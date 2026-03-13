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
  const res = await fetch("/data/names.json");
  const data = await res.json();
  adjectives = data.adjectives;
  manufacturers = data.manufacturers;
  updateAttemptsText();
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateAttemptsText() {
  document.getElementById("attemptsLeft").textContent = `Attempts left: ${attempts}`;
}

// Spin name with two "reels" and rolling animation
function spinName() {
  if (attempts <= 0) {
    alert("No attempts left!");
    return;
  }

  const adjDisplay = document.getElementById("adjDisplay");
  const manuDisplay = document.getElementById("manuDisplay");

  const totalCycles = 20; // number of updates
  let cycle = 0;

  const interval = setInterval(() => {
    const adj = getRandomElement(adjectives);
    const manu = getRandomElement(manufacturers);
    adjDisplay.textContent = adj;
    manuDisplay.textContent = manu;

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

// Confirm name selection
function confirmName() {
  if (!selectedName) return;
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
    slides = data.slides;
    currentSlide = data.slide_index;

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

  // Discussion
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

  // Activity intro
  if (slide.type === "activity") {
    html += `<div class="activity-box"><p>${slide.text}</p></div>`;
  }

  // Cloze drag-drop activity
  if (slide.type === "cloze") {
    // Replace each blank with a unique drop zone
    let sentenceHTML = slide.sentence;
    slide.answers.forEach((_, i) => {
      sentenceHTML = sentenceHTML.replace(
        "______",
        `<span class="drop-zone" data-index="${i}"></span>`
      );
    });

    html += `<p class="clozeSentence">${sentenceHTML}</p>`;

    html += `<div id="wordBank" class="word-bank">`;
    slide.options.forEach(opt => {
      html += `<div class="draggable-word" draggable="true">${opt}</div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;

  // ----------------------------
  // Handle drag-drop Cloze (MULTI BLANK WITH SNAP-BACK + HOVER FEEDBACK)
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
        zone.classList.add("drag-over"); // translucent highlight
      });

      zone.addEventListener("dragleave", () => {
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", () => {
        zone.classList.remove("drag-over");

        if (!draggedWord) return;

        // Snap back if already filled
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

        // Send response
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