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
        container.textContent = "";
        const errorHeading = document.createElement("h2");
        errorHeading.textContent = "Session not found";
        container.appendChild(errorHeading);
        return;
      }

      const data = await res.json();
      slides = data.slides || [];
      currentSlide = data.slide_index || 0;

      // Join the session room
      socket.emit("joinSession", session_id);

      renderSlide(currentSlide);

    } catch (err) {
      container.textContent = "";
      const errorHeading = document.createElement("h2");
      errorHeading.textContent = `Error loading session: ${err.message}`;
      container.appendChild(errorHeading);
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
    container.textContent = "";
    if (!slides[index]) {
      const noSlide = document.createElement("h2");
      noSlide.textContent = "No slide content";
      container.appendChild(noSlide);
      return;
    }

    const slide = slides[index];

    // Slide counter
    const currentSlideElem = document.getElementById("currentSlide");
    const totalSlidesElem = document.getElementById("totalSlides");
    if (currentSlideElem && totalSlidesElem) {
      currentSlideElem.textContent = index + 1;
      totalSlidesElem.textContent = slides.length;
    }

    // Slide title
    if (slide.title) {
      const title = document.createElement("h1");
      title.textContent = slide.title;
      container.appendChild(title);
    }

    // Normal text
    if (slide.text && slide.type !== "discussion" && slide.type !== "activity") {
      const p = document.createElement("p");
      p.textContent = slide.text;
      container.appendChild(p);
    }

    // Bullets
    if (slide.bullets && slide.type !== "discussion" && slide.type !== "activity") {
      const ul = document.createElement("ul");
      slide.bullets.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      container.appendChild(ul);
    }

    // Kahoot
    if (slide.type === "kahoot") {
      const activityBox = document.createElement("div");
      activityBox.className = "activity-box";

      const h2 = document.createElement("h2");
      h2.textContent = "Kahoot Quiz";
      activityBox.appendChild(h2);

      const pIntro = document.createElement("p");
      pIntro.textContent = "Launch the quiz from this link:";
      activityBox.appendChild(pIntro);

      const pLink = document.createElement("p");
      const a = document.createElement("a");
      a.href = slide.kahoot_link || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "kahootLink";
      a.textContent = "Open Kahoot Quiz";
      pLink.appendChild(a);
      activityBox.appendChild(pLink);

      container.appendChild(activityBox);
    }

    // Discussion
    if (slide.type === "discussion") {
      const discussion = document.createElement("div");
      discussion.className = "discussion-box";

      const strong = document.createElement("strong");
      strong.textContent = "Discuss:";
      discussion.appendChild(strong);

      if (slide.text) {
        const pText = document.createElement("p");
        pText.textContent = slide.text;
        discussion.appendChild(pText);
      }

      if (slide.bullets) {
        const ul = document.createElement("ul");
        slide.bullets.forEach((item) => {
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

      const pActivity = document.createElement("p");
      pActivity.textContent = slide.text || "";
      activity.appendChild(pActivity);

      if (slide.bullets) {
        const ul = document.createElement("ul");
        slide.bullets.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        });
        activity.appendChild(ul);
      }

      container.appendChild(activity);
    }

    // Cloze
    if (slide.type === "cloze") {
      const sentenceP = document.createElement("p");
      sentenceP.textContent = slide.sentence;
      container.appendChild(sentenceP);

      slide.options?.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt;
        container.appendChild(btn);
      });

      container.querySelectorAll(".option").forEach((btn) => {
        btn.addEventListener("click", () => {
          const correct = (slide.answers || []).includes(btn.textContent);
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