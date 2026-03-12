const socket = io();

let session_id = null;
let slides = [];
let currentSlide = 0;

// ----------------------------
// JOIN SESSION
// ----------------------------
document.getElementById("joinBtn").addEventListener("click", async () => {
  session_id = document.getElementById("accessCode").value.trim();
  if (!session_id) {
    alert("Enter session code");
    return;
  }
  try {
    const res = await fetch(`/api/session/${session_id}`);
    if (!res.ok) {
      throw new Error("Session not found");
    }
    const data = await res.json();
    slides = data.slides;
    currentSlide = data.slide_index;
    document.getElementById("loginPanel").style.display = "none";

    // join socket room
    socket.emit("joinSession", session_id);

    renderSlide(currentSlide);
  } catch (err) {
    alert(err.message);
  }
});

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
  if (slide.title) {
    html += `<h2>${slide.title}</h2>`;
  }

  // Normal slide text
  if (slide.text && slide.type !== "discussion" && slide.type !== "activity") {
    html += `<p>${slide.text}</p>`;
  }

  // Normal slide bullets
  if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
    html += "<ul>";
    slide.bullets.forEach(item => {
      html += `<li>${item}</li>`;
    });
    html += "</ul>";
  }

  // DISCUSSION
  if (slide.type === "discussion") {
    html += `<div class="discussion-box"><strong>Discuss:</strong>`;

    if (slide.text) {
      html += `<p>${slide.text}</p>`;
    }

    if (slide.bullets) {
      html += "<ul>";
      slide.bullets.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += "</ul>";
    }

    html += `</div>`;
  }

  // ACTIVITY INTRO
  if (slide.type === "activity") {
    html += `
      <div class="activity-box">
        <p>${slide.text}</p>
      </div>
    `;
  }

  // CLOZE ACTIVITY
  if (slide.type === "cloze") {
    html += `<p>${slide.sentence}</p>`;
    slide.options.forEach(opt => {
      html += `<button class="option">${opt}</button>`;
    });
  }

  container.innerHTML = html;

  // HANDLE CLOZE BUTTONS
  if (slide.type === "cloze") {
    container.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => {
        const correct = slide.answers.includes(btn.textContent);

        fetch("/api/response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            student_id: socket.id,
            session_id,
            activity_id: slide.activity_id,
            question_id: slide.activity_id,
            answer: btn.textContent,
            correct
          })
        });

        btn.classList.add(correct ? "correct" : "incorrect");
      });
    });
  }
}