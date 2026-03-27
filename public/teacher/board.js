document.addEventListener("DOMContentLoaded", () => {

  const socket = io();
  let slides = [];
  let currentSlide = 0;
  let session_id = null;

  // -----------------------------
  // DOM ELEMENTS
  // -----------------------------
  const container = document.getElementById("boardContainer");
  const header = document.getElementById("controlBar");
  const footer = document.getElementById("footerBar");
  const sidebar = document.getElementById("studentSidebar");
  const toggleBtn = document.getElementById("toggleSidebar");
  const studentList = document.getElementById("studentList");
  const slideContainer = document.getElementById("slideContainer");

  if (!container || !header || !footer || !sidebar || !slideContainer) {
    alert("Board layout missing elements.");
    return;
  }

  // -----------------------------
  // SIDEBAR TOGGLE
  // -----------------------------
  toggleBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
  });

  // -----------------------------
  // PERSISTENT SLIDE FRAME
  // -----------------------------
  const slideFrame = document.createElement("div");
  slideFrame.className = "slideFrame";
  slideFrame.style.display = "flex";
  slideFrame.style.flexDirection = "column";
  slideFrame.style.justifyContent = "center";
  slideFrame.style.alignItems = "center";
  slideFrame.style.height = "100%";
  slideFrame.style.width = "100%";
  slideFrame.style.overflow = "hidden";
  slideFrame.style.padding = "1rem 1.5rem"; // prevent clipping text against sidebar
  slideContainer.appendChild(slideFrame);

  // -----------------------------
  // GET SESSION ID FROM URL
  // -----------------------------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("session")) session_id = urlParams.get("session");

  if (!session_id) {
    alert("No session code found. Start from the main page to generate a session.");
    return;
  }

  // Display session code in header
  const sessionDisplay = document.createElement("span");
  sessionDisplay.id = "sessionDisplay";
  sessionDisplay.textContent = `Session: ${session_id}`;
  sessionDisplay.style.fontWeight = "bold";
  sessionDisplay.style.marginRight = "20px";
  header.querySelector(".left")?.appendChild(sessionDisplay);

  // -----------------------------
  // LOAD SESSION DATA
  // -----------------------------
  async function loadSession() {
    try {
      const res = await fetch(`/api/session/${session_id}`);
      if (!res.ok) return renderError("Session not found");

      const data = await res.json();
      slides = data.slides || [];
      currentSlide = data.slide_index || 0;

      socket.emit("joinSession", session_id);
      await loadStudents();
      renderSlide(currentSlide);
    } catch (err) {
      renderError(`Error loading session: ${err.message}`);
    }
  }

  function renderError(message) {
    slideFrame.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.textContent = message;
    slideFrame.appendChild(h2);
  }

  // -----------------------------
  // SLIDE NAVIGATION
  // -----------------------------
  const nextBtn = document.getElementById("nextSlide");
  const prevBtn = document.getElementById("prevSlide");

  nextBtn?.addEventListener("click", goNext);
  prevBtn?.addEventListener("click", goPrev);

  socket.on("updateSlide", ({ slide_index }) => {
    currentSlide = slide_index;
    renderSlide(currentSlide);
  });

  socket.on("connect", () => {
    if (session_id) socket.emit("joinSession", session_id);
  });

  // -----------------------------
  // STUDENT SIDEBAR FUNCTIONS
  // -----------------------------
  function addStudentToSidebar(studentName, socketId) {
    if (!studentList) return;
    if (document.getElementById(`student-${socketId}`)) return;

    const li = document.createElement("li");
    li.id = `student-${socketId}`;
    li.textContent = studentName;
    studentList.appendChild(li);
  }

  function removeStudentFromSidebar(socketId) {
    const li = document.getElementById(`student-${socketId}`);
    if (li && li.parentElement) li.parentElement.removeChild(li);
  }

  socket.on("studentJoined", ({ socket_id, name }) => {
    addStudentToSidebar(name, socket_id);
  });

  socket.on("studentLeft", ({ socket_id }) => {
    removeStudentFromSidebar(socket_id);
  });

  // -----------------------------
// LOAD EXISTING STUDENTS (ON REFRESH)
// -----------------------------
async function loadStudents() {
  console.log("TEST: loadStudents is running");

  try {
    const res = await fetch(`/api/session/${session_id}/students`);
    console.log("Fetch response:", res);
    if (!res.ok) return;

    const students = await res.json();
    console.log("Students returned:", students);

    // Clear list first
    studentList.innerHTML = "";

    students.forEach(s => {
      addStudentToSidebar(s.name, s.socket_id);
    });

  } catch (err) {
    console.error("Error loading students:", err);
  }
}

  // -----------------------------
  // FULLSCREEN TOGGLE
  // -----------------------------
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  fullscreenBtn?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Fullscreen failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // -----------------------------
  // RENDER SLIDE
  // -----------------------------
  function renderSlide(index) {
    slideFrame.innerHTML = "";
    if (!slides[index]) return renderError("No slide content");

    const slide = slides[index];

    // Update slide counter
    document.getElementById("currentSlide").textContent = index + 1;
    document.getElementById("totalSlides").textContent = slides.length;

    // Helper for creating elements
    function createEl(tag, text, className) {
      const el = document.createElement(tag);
      el.textContent = text;
      if (className) el.className = className;
      el.style.margin = "0.5rem 0";
      el.style.textAlign = "center";
      return el;
    }

    // Title
    if (slide.title) slideFrame.appendChild(createEl("h1", slide.title));

    // Text
    if (slide.text && !["discussion", "activity"].includes(slide.type)) {
      slideFrame.appendChild(createEl("p", slide.text));
    }

    // Bullets
    if (slide.bullets && !["discussion", "activity"].includes(slide.type)) {
      const ul = document.createElement("ul");
      ul.style.listStyle = "disc";
      ul.style.padding = "0";
      ul.style.margin = "1rem 0";
      ul.style.textAlign = "left";
      slide.bullets.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        li.style.fontSize = "1em";
        li.style.marginBottom = "0.5rem";
        ul.appendChild(li);
      });
      slideFrame.appendChild(ul);
    }

    // Discussion / Activity
    if (["discussion", "activity"].includes(slide.type)) {
      const box = document.createElement("div");
      box.className = slide.type === "discussion" ? "discussion-box" : "activity-box";

      if (slide.type === "discussion") {
        box.appendChild(createEl("strong", "Discuss:"));
      }

      if (slide.text) box.appendChild(createEl("p", slide.text));
      if (slide.bullets) {
        const ul = document.createElement("ul");
        ul.style.listStyle = "disc";
        ul.style.paddingLeft = "2rem";
        slide.bullets.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        });
        box.appendChild(ul);
      }

      slideFrame.appendChild(box);
    }

    // Kahoot
    if (slide.type === "kahoot") {
      const box = document.createElement("div");
      box.className = "activity-box";
      box.appendChild(createEl("h2", "Kahoot Quiz"));
      box.appendChild(createEl("p", "Launch the quiz from this link:"));

      const a = document.createElement("a");
      a.href = slide.kahoot_link || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Open Kahoot Quiz";
      a.style.fontSize = "1.2em";
      box.appendChild(a);

      slideFrame.appendChild(box);
    }

    // Cloze / Quiz
    if (slide.type === "cloze") {
      slideFrame.appendChild(createEl("p", slide.sentence));
      slide.options?.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt;
        btn.style.margin = "0.25rem";
        btn.style.flex = "1 1 auto";
        slideFrame.appendChild(btn);

        btn.addEventListener("click", () => {
          const correct = (slide.answers || []).includes(btn.textContent);
          btn.classList.add(correct ? "correct" : "incorrect");
        });
      });
    }

    scaleSlideText();
  }

  function scaleSlideText() {
    const headerHeight = header.offsetHeight;
    const footerHeight = footer.offsetHeight;
    const availableHeight = window.innerHeight - headerHeight - footerHeight - 20;

    slideFrame.style.fontSize = "1rem";
    let fontSize = 100;
    while (slideFrame.scrollHeight > availableHeight && fontSize > 20) {
      fontSize -= 1;
      slideFrame.style.fontSize = fontSize + "%";
    }
  }

  // -----------------------------
  // KEYBOARD NAVIGATION
  // -----------------------------
  function goNext() {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      renderSlide(currentSlide);
      socket.emit("slideChange", { slide_index: currentSlide, session_id });
    }
  }

  function goPrev() {
    if (currentSlide > 0) {
      currentSlide--;
      renderSlide(currentSlide);
      socket.emit("slideChange", { slide_index: currentSlide, session_id });
    }
  }

  document.addEventListener("keydown", e => {
    const nextKeys = ["ArrowRight", "PageDown", " ", "Enter"];
    const prevKeys = ["ArrowLeft", "PageUp"];
    if (nextKeys.includes(e.key)) { e.preventDefault(); goNext(); }
    if (prevKeys.includes(e.key)) { e.preventDefault(); goPrev(); }
  });

  // -----------------------------
  // DISPLAY TODAY DATE
  // -----------------------------
  const todayElem = document.getElementById("todayDate");
  if (todayElem) {
    const today = new Date();
    todayElem.textContent = today.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  // -----------------------------
  // INIT
  // -----------------------------
  loadSession();
  window.addEventListener("resize", scaleSlideText);

});