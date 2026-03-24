// student.js
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

// Load names from JSON
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

// Spin name with two "reels" and rolling animation
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
  const totalCycles = 20;

  const interval = setInterval(() => {
    adjDisplay.textContent = getRandomElement(adjectives);
    manuDisplay.textContent = getRandomElement(manufacturers);

    cycle++;
    if (cycle >= totalCycles) {
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

// Confirm name selection and join session
function confirmName() {
  if (!selectedName) {
    alert("Spin to generate a name first!");
    return;
  }
  if (!session_id) {
    alert("Enter a session code first!");
    return;
  }

  const okBtn = document.getElementById("okBtn");
  if (okBtn) okBtn.disabled = true;

  console.log("Joining session:", session_id, selectedName);
  sessionStorage.setItem("studentName", selectedName);

  socket.emit("joinSession", { session_id, name: selectedName });

  const loginBackdrop = document.getElementById("loginBackdrop");
  if (loginBackdrop) loginBackdrop.style.display = "none";
}

// ----------------------------
// DOM CONTENT LOADED INIT
// ----------------------------
let isSpinning = false;

function init() {
  const joinBtn = document.getElementById("joinBtn");
  const spinBtn = document.getElementById("spinBtn");
  const okBtn = document.getElementById("okBtn");

  if (joinBtn) joinBtn.addEventListener("click", joinSession);
  if (spinBtn) {
    spinBtn.addEventListener("click", () => {
      if (isSpinning) return;
      spinName();
    });
  }
  if (okBtn) okBtn.addEventListener("click", confirmName);

  loadNames();
}

document.addEventListener("DOMContentLoaded", init);

async function joinSession() {
  const accessCodeEl = document.getElementById("accessCode");
  session_id = accessCodeEl ? accessCodeEl.value.trim() : "";
  if (!session_id) {
    alert("Enter a session code");
    return;
  }

  const joinBtn = document.getElementById("joinBtn");
  if (joinBtn) joinBtn.disabled = true;

  try {
    const res = await fetch(`/api/session/${session_id}`);
    if (!res.ok) throw new Error("Session not found");

    const data = await res.json();
    slides = data.slides || [];
    currentSlide = data.slide_index || 0;

    const loginPanel = document.getElementById("loginPanel");
    const nameSpinnerContainer = document.getElementById("nameSpinnerContainer");
    if (loginPanel) loginPanel.style.display = "none";
    if (nameSpinnerContainer) nameSpinnerContainer.style.display = "flex";

    renderSlide(currentSlide);
  } catch (err) {
    alert(err.message);
    if (joinBtn) joinBtn.disabled = false;
  }
}

// ----------------------------
// RECEIVE SLIDE CHANGES
// ----------------------------
socket.on("updateSlide", ({ slide_index }) => {
  currentSlide = slide_index;
  renderSlide(currentSlide);
});

// ----------------------------
// RENDER SLIDE
// ----------------------------
function renderSlide(index) {
  const container = document.getElementById("slideContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!slides[index]) return;

  const slide = slides[index];

  // Main wrapper for text + image
  const slideWrapper = document.createElement("div");
  slideWrapper.className = "slide-wrapper"; // CSS flex

  // Text container
  const textContainer = document.createElement("div");
  textContainer.className = "slide-text";

  if (slide.title) {
    const title = document.createElement("h2");
    title.textContent = slide.title;
    textContainer.appendChild(title);
  }

  if (slide.text && slide.type !== "discussion" && slide.type !== "activity" && slide.type !== "cloze") {
    if (Array.isArray(slide.text)) {
      slide.text.forEach(txt => {
        const p = document.createElement("p");
        p.textContent = txt;
        textContainer.appendChild(p);
      });
    } else {
      const p = document.createElement("p");
      p.textContent = slide.text;
      textContainer.appendChild(p);
    }
  }

  if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
    const ul = document.createElement("ul");
    slide.bullets.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    textContainer.appendChild(ul);
  }

  slideWrapper.appendChild(textContainer);

  // Image container
  if (slide.image) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "slide-image-container";

    const imgEl = document.createElement("img");
    imgEl.src = slide.image;
    imgEl.alt = slide.title || "Slide image";
    imgEl.className = "slide-image";

    imgContainer.appendChild(imgEl);
    slideWrapper.appendChild(imgContainer);
  }

  container.appendChild(slideWrapper);

  // ---------- Slide types ----------

  // Kahoot
  if (slide.type === "kahoot") {
    const kahoot = document.createElement("div");
    kahoot.className = "kahoot-slide";

   // const img = document.createElement("img");
   // img.src = "/images/kahoot_logo.png";
   // img.className = "kahoot-logo";
   // kahoot.appendChild(img);

    const p = document.createElement("p");
    p.className = "kahoot-instructions";

    p.appendChild(document.createTextNode("Go to "));
    const a = document.createElement("a");
    a.href = "https://kahoot.it";
    a.target = "_blank";
    a.rel = "noopener";

    const strong = document.createElement("strong");
    strong.textContent = "kahoot.it";

    a.appendChild(strong);
    p.appendChild(a);
    p.appendChild(document.createTextNode(" to join the quiz"));

    kahoot.appendChild(p);

    container.appendChild(kahoot);
  }

  // Discussion
  if (slide.type === "discussion") {
    const discussion = document.createElement("div");
    discussion.className = "discussion-box";
    const strong = document.createElement("strong");
    strong.textContent = "Discuss:";
    discussion.appendChild(strong);

    if (slide.text) {
      if (Array.isArray(slide.text)) {
        slide.text.forEach(txt => {
          const p = document.createElement("p");
          p.textContent = txt;
          discussion.appendChild(p);
        });
      } else {
        const p = document.createElement("p");
        p.textContent = slide.text;
        discussion.appendChild(p);
      }
    }

    if (slide.bullets) {
      const ul = document.createElement("ul");
      slide.bullets.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      discussion.appendChild(ul);
    }

    container.appendChild(discussion);
  }

  // Activity
  if (slide.type === "activity") {
    const activity = document.createElement("div");
    activity.className = "activity-box";

    const p = document.createElement("p");
    p.textContent = slide.text || "";
    activity.appendChild(p);

    container.appendChild(activity);
  }

  // Cloze
  if (slide.type === "cloze") {
    const sentenceParagraph = document.createElement("p");
    sentenceParagraph.className = "clozeSentence";

    if (!slide.sentence || !slide.sentence.includes("______")) {
      const p = document.createElement("p");
      p.textContent = "Cloze slide is malformed.";
      container.appendChild(p);
      return;
    }

    const parts = slide.sentence.split("______");
    parts.forEach((part, index) => {
      sentenceParagraph.appendChild(document.createTextNode(part));
      if (index < parts.length - 1) {
        const dropZone = document.createElement("span");
        dropZone.className = "drop-zone";
        dropZone.dataset.index = index;
        sentenceParagraph.appendChild(dropZone);
      }
    });

    container.appendChild(sentenceParagraph);

    const uniqueOptions = Array.from(new Set((slide.options || []).map(o => o.trim())));
    const wordBank = document.createElement("div");
    wordBank.id = "wordBank";
    wordBank.className = "word-bank";

    uniqueOptions.forEach(opt => {
      const word = document.createElement("div");
      word.className = "draggable-word";
      word.draggable = true;
      word.textContent = opt;
      wordBank.appendChild(word);
    });

    container.appendChild(wordBank);

    let draggedWord = null;
    let originalParent = null;

    const words = wordBank.querySelectorAll(".draggable-word");
    const dropZones = container.querySelectorAll(".drop-zone");

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
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));

      zone.addEventListener("drop", () => {
        zone.classList.remove("drag-over");
        if (!draggedWord) return;

        if (zone.classList.contains("filled")) {
          if (originalParent) originalParent.appendChild(draggedWord);
          draggedWord = null;
          return;
        }

        const index = parseInt(zone.dataset.index, 10);
        const answer = draggedWord.textContent.trim();
        const correctAnswer = (slide.answers || [])[index] || "";
        const correct = answer === correctAnswer;

        const studentName = sessionStorage.getItem("studentName") || "Unknown";

        fetch("/api/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentName,
            session_id,
            activity_id: slide.activity_id,
            question_id: index,
            answer,
            correct,
          }),
        }).catch(e => console.error("Response submit failed", e));

        if (correct) {
          zone.textContent = answer;
          zone.classList.add("correct", "filled");
          draggedWord.remove();
        } else {
          draggedWord.classList.add("incorrect");
          setTimeout(() => {
            draggedWord.classList.remove("incorrect");
            originalParent.appendChild(draggedWord);
          }, 600);
        }

        draggedWord = null;
      });
    });
  }
}