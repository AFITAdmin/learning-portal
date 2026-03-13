document.addEventListener("DOMContentLoaded", () => {

  const socket = io();

  let slides = [];
  let currentSlide = 0;
  let session_id = null;

  // -----------------------------
  // GET SESSION CODE FROM URL
  // -----------------------------
  const urlParams = new URLSearchParams(window.location.search);
  session_id = urlParams.get("session");

  const container = document.getElementById("slideContainer") || document.getElementById("boardContainer");

  if (!session_id) {
    container.innerHTML = "<h2>No session specified</h2>";
    throw new Error("Session missing");
  }

  // -----------------------------
  // LOAD SESSION LESSON
  // -----------------------------
  async function loadSession() {
    try {
      const res = await fetch(`/api/session/${session_id}`);
      if (!res.ok) {
        container.innerHTML = "<h2>Session not found</h2>";
        return;
      }

      const data = await res.json();

      slides = data.slides || [];
      currentSlide = data.slide_index || 0;

      // Join the session room
      socket.emit("joinSession", session_id);

      renderSlide(currentSlide);
    } catch (err) {
      container.innerHTML = `<h2>Error loading session: ${err.message}</h2>`;
    }
  }

  loadSession();

  // -----------------------------
  // RECEIVE SLIDE UPDATES
  // -----------------------------
  socket.on("updateSlide", ({ slide_index }) => {
    currentSlide = slide_index;
    renderSlide(currentSlide);
  });

  // -----------------------------
  // NEXT / PREVIOUS BUTTONS
  // -----------------------------
  document.getElementById("nextSlide")?.addEventListener("click", () => {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      renderSlide(currentSlide);
      socket.emit("slideChange", { slide_index: currentSlide, session_id });
    }
  });

  document.getElementById("prevSlide")?.addEventListener("click", () => {
    if (currentSlide > 0) {
      currentSlide--;
      renderSlide(currentSlide);
      socket.emit("slideChange", { slide_index: currentSlide, session_id });
    }
  });

  // -----------------------------
  // RENDER SLIDE
  // -----------------------------
  function renderSlide(index) {
    if (!slides[index]) return;

    const slide = slides[index];
    let html = "";

    // -----------------------------
    // Update slide counter (teacher dashboard only)
    // -----------------------------
    const currentSlideElem = document.getElementById("currentSlide");
    const totalSlidesElem = document.getElementById("totalSlides");

    if (currentSlideElem && totalSlidesElem) {
      currentSlideElem.textContent = index + 1;
      totalSlidesElem.textContent = slides.length;
    }

    // -----------------------------
    // Slide title
    // -----------------------------
    if (slide.title) html += `<h1>${slide.title}</h1>`;

    // -----------------------------
    // Normal text (not discussion/activity)
    // -----------------------------
    if (slide.text && slide.type !== "discussion" && slide.type !== "activity") {
      html += `<p>${slide.text}</p>`;
    }

    // -----------------------------
    // Bullets for normal slides
    // -----------------------------
    if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
      html += "<ul>";
      slide.bullets.forEach(item => html += `<li>${item}</li>`);
      html += "</ul>";
    }
    
    // -----------------------------
    // Kahoot slide
    // -----------------------------
      if (slide.type === "kahoot") {

      html += `
      <div class="activity-box">
        <h2>Kahoot Quiz</h2>
        <p>Launch the quiz from this link:</p>
        <p>
          <a href="${slide.kahoot_link}" target="_blank" class="kahootLink">
            Open Kahoot Quiz
          </a>
        </p>
      </div>
      `;
    }

    // -----------------------------
    // Discussion slide
    // -----------------------------
    if (slide.type === "discussion") {
      html += `<div class="discussion-box"><strong>Discuss:</strong>`;
      if (slide.text) html += `<p>${slide.text}</p>`;
      if (slide.bullets) {
        html += "<ul>";
        slide.bullets.forEach(item => html += `<li>${item}</li>`);
        html += "</ul>";
      }
      html += `</div>`;
    }

    // -----------------------------
    // Activity slide
    // -----------------------------
    if (slide.type === "activity") {
      html += `<div class="activity-box"><p>${slide.text}</p>`;
      if (slide.bullets) {
        html += "<ul>";
        slide.bullets.forEach(item => html += `<li>${item}</li>`);
        html += "</ul>";
      }
      html += `</div>`;
    }

    // -----------------------------
    // Cloze slide
    // -----------------------------
    if (slide.type === "cloze") {
      html += `<p>${slide.sentence}</p>`;
      slide.options.forEach(opt => html += `<button class="option">${opt}</button>`);
    }

    container.innerHTML = html;

    // -----------------------------
    // Cloze button handling
    // -----------------------------
    if (slide.type === "cloze") {
      container.querySelectorAll(".option").forEach(btn => {
        btn.addEventListener("click", () => {
          const correct = slide.answers.includes(btn.textContent);
          btn.classList.add(correct ? "correct" : "incorrect");
        });
      });
    }
  }

});