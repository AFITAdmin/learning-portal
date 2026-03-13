document.addEventListener("DOMContentLoaded", () => {

  const socket = io();

  let slides = [];
  let currentSlide = 0;
  let session_id = null;

  const container = document.getElementById("boardContainer");

  // -----------------------------
  // GET SESSION ID FROM URL (if present)
  // -----------------------------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("session")) {
    session_id = urlParams.get("session");
  }

  // -----------------------------
  // START SESSION BUTTON
  // -----------------------------
  const startBtn = document.getElementById("startSession");
  startBtn?.addEventListener("click", async () => {
    const lessonInput = document.getElementById("sessionCode");
    const lesson = lessonInput?.value.trim();
    if (!lesson) return alert("Enter a lesson name");

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson })
      });

      if (!res.ok) throw new Error("Could not create session");

      const data = await res.json();
      session_id = data.session_code;

      console.log("Session created:", session_id, lesson);

      // Update input so you can launch board
      lessonInput.value = session_id;

      // Update URL so refresh keeps session
      const newUrl = `${window.location.pathname}?session=${session_id}`;
      window.history.replaceState({}, "", newUrl);

      // Load the session immediately
      loadSession();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // -----------------------------
  // LAUNCH BOARD BUTTON
  // -----------------------------
  const launchBtn = document.getElementById("launchBoard");
  launchBtn?.addEventListener("click", () => {
    if (!session_id) return alert("No session code. Start a session first.");
    loadSession();
  });

  // -----------------------------
  // LOAD SESSION LESSON
  // -----------------------------
  async function loadSession() {
    if (!session_id) return;

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

  // -----------------------------
  // RECEIVE SLIDE UPDATES FROM STUDENTS/TEACHER
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
    if (!slides[index]) {
      container.innerHTML = "<h2>No slide content</h2>";
      return;
    }

    const slide = slides[index];
    let html = "";

    // Slide counter
    const currentSlideElem = document.getElementById("currentSlide");
    const totalSlidesElem = document.getElementById("totalSlides");
    if (currentSlideElem && totalSlidesElem) {
      currentSlideElem.textContent = index + 1;
      totalSlidesElem.textContent = slides.length;
    }

    // Slide title
    if (slide.title) html += `<h1>${slide.title}</h1>`;

    // Normal text
    if (slide.text && slide.type !== "discussion" && slide.type !== "activity") {
      html += `<p>${slide.text}</p>`;
    }

    // Bullets
    if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
      html += "<ul>";
      slide.bullets.forEach(item => html += `<li>${item}</li>`);
      html += "</ul>";
    }

    // Kahoot
    if (slide.type === "kahoot") {
      html += `
      <div class="activity-box">
        <h2>Kahoot Quiz</h2>
        <p>Launch the quiz from this link:</p>
        <p><a href="${slide.kahoot_link}" target="_blank" class="kahootLink">Open Kahoot Quiz</a></p>
      </div>`;
    }

    // Discussion
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

    // Activity
    if (slide.type === "activity") {
      html += `<div class="activity-box"><p>${slide.text}</p>`;
      if (slide.bullets) {
        html += "<ul>";
        slide.bullets.forEach(item => html += `<li>${item}</li>`);
        html += "</ul>";
      }
      html += `</div>`;
    }

    // Cloze
    if (slide.type === "cloze") {
      html += `<p>${slide.sentence}</p>`;
      slide.options.forEach(opt => html += `<button class="option">${opt}</button>`);
    }

    container.innerHTML = html;

    // Cloze button handling
    if (slide.type === "cloze") {
      container.querySelectorAll(".option").forEach(btn => {
        btn.addEventListener("click", () => {
          const correct = slide.answers.includes(btn.textContent);
          btn.classList.add(correct ? "correct" : "incorrect");
        });
      });
    }
  }

  // -----------------------------
  // Only load session if session_id exists in URL
  // -----------------------------
  if (session_id) loadSession();

});