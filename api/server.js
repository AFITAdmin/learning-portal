// api/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// PostgreSQL pool
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
});

// -----------------------------
// SESSION STORE (in memory)
// -----------------------------

const sessions = {};

/*
Example structure:

sessions = {
  "483291": {
      lesson: "4.B.02",
      slide_index: 0
  }
}
*/

// -----------------------------
// HELPERS
// -----------------------------

function generateSessionCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -----------------------------
// MIDDLEWARE
// -----------------------------

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// -----------------------------
// CREATE SESSION (Teacher)
// -----------------------------

app.post("/api/session", (req, res) => {

  const { lesson } = req.body;

  if (!lesson) {
    return res.status(400).json({ error: "Lesson required" });
  }

  const code = generateSessionCode();

  sessions[code] = {
    lesson: lesson,
    slide_index: 0
  };

  console.log("Session created:", code, lesson);

  res.json({ session_code: code });

});


// -----------------------------
// STUDENT JOINS SESSION
// -----------------------------

app.get("/api/session/:code", (req, res) => {

  const code = req.params.code;

  const session = sessions[code];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const lessonPath = path.join(
    __dirname,
    "../data/lessons",
    `${session.lesson}.json`
  );

  fs.readFile(lessonPath, "utf8", (err, data) => {

    if (err) {
      console.error("Lesson load error:", err);
      return res.status(500).json({ error: "Could not load lesson" });
    }

    res.json({
      slides: JSON.parse(data),
      slide_index: session.slide_index
    });

  });

});


// -----------------------------
// STORE STUDENT RESPONSES
// -----------------------------

app.post("/api/response", async (req, res) => {

  const { student_id, session_id, activity_id, question_id, answer, correct } = req.body;

  try {

    await pool.query(
      `INSERT INTO responses(student_id, session_id, activity_id, question_id, answer, correct, timestamp)
       VALUES($1,$2,$3,$4,$5,$6,NOW())`,
      [student_id, session_id, activity_id, question_id, answer, correct]
    );

    res.send({ status: "ok" });

  } catch (err) {

    console.error(err);
    res.status(500).send({ status: "error" });

  }

});


// -----------------------------
// SOCKET.IO
// -----------------------------

io.on("connection", (socket) => {

  console.log("New client connected:", socket.id);

  // Student joins session room
  socket.on("joinSession", (session_id) => {

    socket.join(session_id);

    console.log(`Socket ${socket.id} joined session ${session_id}`);

    io.to(session_id).emit("studentJoined", {
      socket_id: socket.id
    });

  });


  // Teacher changes slide
  socket.on("slideChange", ({ session_id, slide_index }) => {

    if (sessions[session_id]) {
      sessions[session_id].slide_index = slide_index;
    }

    io.to(session_id).emit("updateSlide", {
      slide_index
    });

  });


  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

});


// -----------------------------
// START SERVER
// -----------------------------

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});