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

  if (!adjDisplay || !manuDisplay) return;

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
      document.getElementById("okBtn").disabled = false;
    }
  }, 50);
}

// Confirm name selection and join session
function confirmName() {
  if (!selectedName) return alert("Spin to generate a name first!");
  if (!session_id) return alert("Enter a session code first!");

  console.log("Joining session:", session_id, selectedName);
  sessionStorage.setItem("studentName", selectedName);

  socket.emit("joinSession", { session_id, name: selectedName });

  document.getElementById("loginBackdrop").style.display = "none";
}

// ----------------------------
// JOIN SESSION (CODE INPUT)
// ----------------------------
document.getElementById("joinBtn").addEventListener("click", async () => {
  session_id = document.getElementById("accessCode").value.trim();
  if (!session_id) {
    alert("Enter session code");
    return;
  }

  try {
    const res = await fetch(`/api/session/${session_id}`);
    if (!res.ok) throw new Error("Session not found");

    const data = await res.json();
    slides = data.slides || [];
    currentSlide = data.slide_index || 0;

    document.getElementById("loginPanel").style.display = "none";
    document.getElementById("nameSpinnerContainer").style.display = "flex";

    renderSlide(currentSlide);
  } catch (err) {
    alert(err.message);
  }
});

// ----------------------------
// SPINNER BUTTONS
// ----------------------------
document.getElementById("spinBtn").addEventListener("click", spinName);
document.getElementById("okBtn").addEventListener("click", confirmName);

// ----------------------------
// LOAD NAMES
// ----------------------------
loadNames();

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
  let html = "";

  // Title
  if (slide.title) html += `<h2>${slide.title}</h2>`;

  // Normal text
  if (slide.text && slide.type !== "discussion" && slide.type !== "activity") {
    html += `<p>${slide.text}</p>`;
  }

  // Bullets
  if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
    html += "<ul>";
    slide.bullets.forEach(item => (html += `<li>${item}</li>`));
    html += "</ul>";
  }

  // Kahoot slide
  if (slide.type === "kahoot") {
    html += `
      <div class="kahoot-slide">
        <img src="/images/kahoot_logo.png" class="kahoot-logo">
        <p class="kahoot-instructions">
          Go to <a href="https://kahoot.it" target="_blank"><strong>kahoot.it</strong></a> to join the quiz
        </p>
      </div>
    `;
  }

  // Discussion slide
  if (slide.type === "discussion") {
    html += `<div class="discussion-box"><strong>Discuss:</strong>`;
    if (slide.text) html += `<p>${slide.text}</p>`;
    if (slide.bullets) {
      html += "<ul>";
      slide.bullets.forEach(item => (html += `<li>${item}</li>`));
      html += "</ul>";
    }
    html += `</div>`;
  }

  // Activity slide
  if (slide.type === "activity") {
    html += `<div class="activity-box"><p>${slide.text}</p></div>`;
  }

  // Cloze slide
  if (slide.type === "cloze") {
    let sentenceHTML = slide.sentence;
    slide.answers.forEach((_, i) => {
      sentenceHTML = sentenceHTML.replace("______", `<span class="drop-zone" data-index="${i}"></span>`);
    });
    html += `<p class="clozeSentence">${sentenceHTML}</p>`;

    const uniqueOptions = Array.from(new Set(slide.options.map(o => o.trim())));
    html += `<div id="wordBank" class="word-bank">`;
    uniqueOptions.forEach(opt => {
      html += `<div class="draggable-word" draggable="true">${opt}</div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;

  // ----------------------------
  // Handle drag-drop for cloze
  // ----------------------------
  if (slide.type === "cloze") {
    const words = container.querySelectorAll(".draggable-word");
    const dropZones = container.querySelectorAll(".drop-zone");
    let draggedWord = null;
    let originalParent = null;

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
          originalParent.appendChild(draggedWord);
          draggedWord = null;
          return;
        }

        const index = parseInt(zone.dataset.index);
        const answer = draggedWord.textContent.trim();
        const correctAnswer = slide.answers[index];
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
            correct
          })
        });

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