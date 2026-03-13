const socket = io();

let session_id = null;
let currentSlide = 0;

const students = {};

// ----------------------------
// START SESSION
// ----------------------------

document.getElementById("startSession").addEventListener("click", async () => {

  const urlParams = new URLSearchParams(window.location.search);
  const lesson = urlParams.get("lesson");

  if (!lesson) {
    alert("Lesson reference missing from URL");
    return;
  }

  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson })
  });

  const data = await res.json();

  session_id = data.session_code;

  document.getElementById("sessionCode").value = session_id;

  socket.emit("joinSession", session_id);

  console.log("Session started:", session_id);

});

// ----------------------------
// LAUNCH BOARD
// ----------------------------

document.getElementById("launchBoard").addEventListener("click", () => {

  const sessionCode = document.getElementById("sessionCode").value.trim();

  if (!sessionCode) return alert("Start a session first!");

  window.open(
    `/teacher/board.html?session=${sessionCode}`,
    "_blank",
    `width=${screen.width},height=${screen.height},left=0,top=0,fullscreen=yes`
  );

});

// ----------------------------
// NEXT SLIDE
// ----------------------------

document.getElementById("nextSlide").addEventListener("click", () => {

  if (!session_id) {
    alert("Start the session first");
    return;
  }

  currentSlide++;

  socket.emit("slideChange", {
    session_id,
    slide_index: currentSlide
  });

});

// ----------------------------
// PREVIOUS SLIDE
// ----------------------------

document.getElementById("prevSlide").addEventListener("click", () => {

  if (!session_id) {
    alert("Start the session first");
    return;
  }

  if (currentSlide > 0) {
    currentSlide--;
  }

  socket.emit("slideChange", {
    session_id,
    slide_index: currentSlide
  });

});

// ----------------------------
// STUDENT JOINED
// ----------------------------

socket.on("studentJoined", ({ socket_id, name }) => {

  const list = document.getElementById("studentList");

  const student = document.createElement("div");

  student.className = "student";

  student.innerText = name;

  list.appendChild(student);

  students[socket_id] = student;

});

// ----------------------------
// STUDENT LEFT
// ----------------------------

socket.on("studentLeft", ({ socket_id }) => {

  if (students[socket_id]) {

    students[socket_id].remove();

    delete students[socket_id];

  }

});