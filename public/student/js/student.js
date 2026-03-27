// =============================
// student.js - FULL UPDATE
// =============================

const socket = io();

let session_id = null;
let slides = [];
let currentSlide = 0;

// ----------------------------
// SPINNER / NAME LOGIC
// ----------------------------
let adjectives = [];
let manufacturers = [];
let attempts = 3;
let selectedName = "";
let isSpinning = false;

async function loadNames() {
  try {
    const res = await fetch("/data/names.json");
    const data = await res.json();
    adjectives = data.adjectives;
    manufacturers = data.manufacturers;
    updateAttemptsText();
  } catch (err) {
    console.error("Error loading names.json:", err);
  }
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateAttemptsText() {
  const elem = document.getElementById("attemptsLeft");
  if (elem) elem.textContent = `Attempts left: ${attempts}`;
}

function spinName() {
  if (attempts <= 0) {
    alert("No attempts left!");
    return;
  }

  const adjDisplay = document.getElementById("adjDisplay");
  const manuDisplay = document.getElementById("manuDisplay");
  const spinBtn = document.getElementById("spinBtn");
  const okBtn = document.getElementById("okBtn");

  if (!adjDisplay || !manuDisplay || !spinBtn || !okBtn) return;

  isSpinning = true;
  spinBtn.disabled = true;
  okBtn.disabled = true;

  let cycle = 0;
  const interval = setInterval(() => {
    adjDisplay.textContent = getRandomElement(adjectives);
    manuDisplay.textContent = getRandomElement(manufacturers);
    cycle++;

    if (cycle >= 20) {
      clearInterval(interval);
      selectedName = `${adjDisplay.textContent} ${manuDisplay.textContent}`;
      attempts--;
      updateAttemptsText();
      okBtn.disabled = false;
      spinBtn.disabled = false;
      isSpinning = false;
    }
  }, 50);
}

// ----------------------------
// LOGIN OVERLAY
// ----------------------------
function showLoginOverlay() {
  const backdrop = document.getElementById("loginBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("hidden");
  // small timeout to trigger CSS transition
  setTimeout(() => backdrop.classList.add("visible"), 20);
}

function hideLoginOverlay() {
  const backdrop = document.getElementById("loginBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("visible");
  setTimeout(() => backdrop.classList.add("hidden"), 400);
}

function confirmName() {
  if (!selectedName) {
    alert("Spin to generate a name first!");
    return;
  }
  if (!session_id) {
    alert("Enter a session code first!");
    return;
  }

  localStorage.setItem("studentSession", JSON.stringify({ session_id, name: selectedName }));
  socket.emit("joinSession", { session_id, name: selectedName });

  hideLoginOverlay();

  displayStudentName(selectedName);
}

// ----------------------------
// HEADER DISPLAY
// ----------------------------
function displayStudentName(name) {
  const header = document.getElementById("studentHeader");
  const nameSpan = document.getElementById("studentNameDisplay");
  if (!header || !nameSpan) return;

  nameSpan.textContent = name;
  header.classList.remove("hidden");
}

// ----------------------------
// INITIALISATION
// ----------------------------
function init() {
  const saved = localStorage.getItem("studentSession");

  if (saved) {
    try {
      const { session_id: savedSession, name } = JSON.parse(saved);
      if (savedSession && name) {
        session_id = savedSession;

        fetch(`/api/session/${session_id}`)
          .then(res => {
            if (!res.ok) throw new Error("Session expired");
            return res.json();
          })
          .then(data => {
            slides = data.slides || [];
            currentSlide = data.slide_index || 0;

            hideLoginOverlay();

            renderSlide(currentSlide);
            socket.emit("joinSession", { session_id, name });
            displayStudentName(name);
          })
          .catch(() => localStorage.removeItem("studentSession"));
      } else {
        showLoginOverlay();
      }
    } catch {
      localStorage.removeItem("studentSession");
      showLoginOverlay();
    }
  } else {
    showLoginOverlay();
  }

  document.getElementById("joinBtn")?.addEventListener("click", joinSession);
  document.getElementById("spinBtn")?.addEventListener("click", () => {
    if (!isSpinning) spinName();
  });
  document.getElementById("okBtn")?.addEventListener("click", confirmName);

  loadNames();
}

document.addEventListener("DOMContentLoaded", init);

// ----------------------------
// JOIN SESSION
// ----------------------------
async function joinSession() {
  const accessCodeEl = document.getElementById("accessCode");
  session_id = accessCodeEl?.value.trim() || "";

  if (!session_id) {
    alert("Enter a session code");
    return;
  }

  document.getElementById("joinBtn").disabled = true;

  try {
    const res = await fetch(`/api/session/${session_id}`);
    if (!res.ok) throw new Error("Session not found");

    const data = await res.json();
    slides = data.slides || [];
    currentSlide = data.slide_index || 0;

    document.getElementById("loginPanel")?.classList.add("hidden");
    document.getElementById("nameSpinnerContainer")?.classList.remove("hidden");

    renderSlide(currentSlide);
  } catch (err) {
    alert(err.message);
    document.getElementById("joinBtn").disabled = false;
  }
}

// ----------------------------
// SOCKET EVENTS
// ----------------------------
socket.on("updateSlide", ({ slide_index }) => {
  currentSlide = slide_index;
  renderSlide(currentSlide);
});

// ----------------------------
// SLIDE RENDERING
// ----------------------------
function renderSlide(index) {
  const container = document.getElementById("slideContainer");
  if (!container) return;

  container.innerHTML = "";

  const slide = slides[index];
  if (!slide) return;

  if (["activity", "discussion", "kahoot", "cloze"].includes(slide.type)) {
    renderSlideType(slide, container);
    updateFooter(slide);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "slide-wrapper";

  const text = document.createElement("div");
  text.className = "slide-text";

  if (slide.title) {
    const h2 = document.createElement("h2");
    h2.textContent = slide.title;
    text.appendChild(h2);
  }

  if (slide.text) {
    const texts = Array.isArray(slide.text) ? slide.text : [slide.text];
    texts.forEach(t => {
      const p = document.createElement("p");
      p.textContent = t;
      text.appendChild(p);
    });
  }

  if (slide.bullets) {
    const ul = document.createElement("ul");
    slide.bullets.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    text.appendChild(ul);
  }

  wrapper.appendChild(text);

  if (slide.image) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "slide-image-container";

    const box = document.createElement("div");
    box.className = "slide-image-box";

    const img = document.createElement("img");
    img.src = slide.image;
    img.alt = slide.title || "Slide image";
    img.className = "slide-image";

    box.appendChild(img);
    imgContainer.appendChild(box);
    wrapper.appendChild(imgContainer);
  }

  container.appendChild(wrapper);
  updateFooter(slide);
}

// ----------------------------
// SLIDE TYPES (activity, discussion, kahoot, cloze)
// ----------------------------
function renderSlideType(slide, container) {
  const wrapper = document.createElement("div");
  wrapper.className = "slide-wrapper activity-layout";

  if (slide.title) {
    const h2 = document.createElement("h2");
    h2.textContent = slide.title;
    wrapper.appendChild(h2);
  }

  if (slide.type === "activity") {
    if (slide.image) {
      const imgContainer = document.createElement("div");
      imgContainer.className = "slide-image-container activity-image";

      const box = document.createElement("div");
      box.className = "slide-image-box";

      const img = document.createElement("img");
      img.src = slide.image;
      img.className = "slide-image";

      box.appendChild(img);
      imgContainer.appendChild(box);
      wrapper.appendChild(imgContainer);
    }

    const activity = document.createElement("div");
    activity.className = "activity-box";

    const texts = Array.isArray(slide.text) ? slide.text : [slide.text];
    texts.forEach(t => {
      if (!t) return;
      const p = document.createElement("p");
      p.textContent = t;
      activity.appendChild(p);
    });

    wrapper.appendChild(activity);
    container.appendChild(wrapper);
    return;
  }

  if (slide.type === "discussion") {
    const box = document.createElement("div");
    box.className = "discussion-box";

    const strong = document.createElement("strong");
    strong.textContent = "Discuss:";
    box.appendChild(strong);

    const texts = Array.isArray(slide.text) ? slide.text : [slide.text];
    texts.forEach(t => {
      if (!t) return;
      const p = document.createElement("p");
      p.textContent = t;
      box.appendChild(p);
    });

    if (slide.bullets) {
      const ul = document.createElement("ul");
      slide.bullets.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }

    container.appendChild(box);
    return;
  }

  if (slide.type === "kahoot") {
    const div = document.createElement("div");
    div.className = "kahoot-slide";
    div.innerHTML = `Go to <strong>kahoot.it</strong> to join the quiz`;
    container.appendChild(div);
    return;
  }

  if (slide.type === "cloze") {
    const sentenceParagraph = document.createElement("p");
    sentenceParagraph.className = "clozeSentence";

    if (!slide.sentence || !slide.sentence.includes("______")) {
      sentenceParagraph.textContent = "Cloze slide is malformed.";
      wrapper.appendChild(sentenceParagraph);
      container.appendChild(wrapper);
      return;
    }

    const parts = slide.sentence.split("______");
    parts.forEach((part, index) => {
      sentenceParagraph.appendChild(document.createTextNode(part));
      if (index < parts.length - 1) {
        const dropZone = document.createElement("span");
        dropZone.className = "drop-zone";
        dropZone.dataset.index = index;
        dropZone.textContent = "______";
        sentenceParagraph.appendChild(dropZone);
      }
    });

    wrapper.appendChild(sentenceParagraph);

    const wordBank = document.createElement("div");
    wordBank.className = "word-bank";

    const uniqueOptions = Array.from(new Set((slide.options || []).map(o => o.trim())));
    uniqueOptions.forEach(opt => {
      const word = document.createElement("div");
      word.className = "draggable-word";
      word.draggable = true;
      word.textContent = opt;
      wordBank.appendChild(word);
    });

    wrapper.appendChild(wordBank);
    container.appendChild(wrapper);

    // ----------------------------
    // drag & drop logic
    // ----------------------------
    let draggedWord = null;
    let originalParent = null;

    const words = wordBank.querySelectorAll(".draggable-word");
    const dropZones = wrapper.querySelectorAll(".drop-zone");

    words.forEach(word => {
      word.addEventListener("dragstart", () => {
        draggedWord = word;
        originalParent = word.parentElement;
        word.classList.add("dragging");
      });
      word.addEventListener("dragend", () => {
        word.classList.remove("dragging");
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener("dragover", e => {
        e.preventDefault();
        const index = parseInt(zone.dataset.index, 10);
        const correctAnswer = (slide.answers || [])[index] || "";

        zone.classList.remove("incorrect-zone-highlight");

        if (draggedWord && draggedWord.textContent === correctAnswer) {
          zone.classList.add("correct-zone-highlight");
          zone.classList.remove("drag-over");
        } else {
          zone.classList.add("drag-over");
          zone.classList.remove("correct-zone-highlight");
        }
      });

      zone.addEventListener("dragleave", () => {
        zone.classList.remove("drag-over");
        zone.classList.remove("correct-zone-highlight");
      });

      zone.addEventListener("drop", () => {
        zone.classList.remove("drag-over");
        zone.classList.remove("correct-zone-highlight");

        if (!draggedWord) return;

        if (zone.classList.contains("filled")) {
          originalParent?.appendChild(draggedWord);
          draggedWord = null;
          return;
        }

        const index = parseInt(zone.dataset.index, 10);
        const answer = draggedWord.textContent.trim();
        const correctAnswer = (slide.answers || [])[index] || "";
        const correct = answer === correctAnswer;

        if (correct) {
          zone.textContent = answer;
          zone.classList.add("correct", "filled");
          draggedWord.remove();
        } else {
          zone.classList.add("incorrect-zone-highlight");
          setTimeout(() => {
            zone.classList.remove("incorrect-zone-highlight");
            originalParent?.appendChild(draggedWord);
          }, 600);
        }

        draggedWord = null;
      });
    });
  }
}

// ----------------------------
// FOOTER
// ----------------------------
function updateFooter(slide) {
  const footer = document.getElementById("studentFooter");
  if (!footer) return;

  footer.textContent = slide.type ? `Slide type: ${slide.type}` : "";
}