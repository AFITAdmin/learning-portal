// api/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const {
  validateSessionPayload,
  validateResponsePayload,
  validateSessionCode
} = require("./validation");

require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Check your .env file.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// PostgreSQL pool

const { Pool } = require('pg');

console.log("RAW DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log("DATABASE_URL (masked):", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/(postgresql:\/\/[^:]+:)([^@]+)(@.+)/, "$1***$3") : "<not set>");
try {
  const match = process.env.DATABASE_URL.match(/@([^:/]+)(:\d+)?\//);
  console.log("DATABASE_HOST:", match ? match[1] : "<not set>");
} catch (err) {
  console.error("DATABASE_URL parsing failed:", err.message);
}

pool.query('SELECT NOW()')
  .then(() => console.log('DB OK'))
  .catch(err => console.error('DB ERROR:', err));

// -----------------------------
// SESSION STORE (in memory)
// -----------------------------

const sessions = {};

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
  const { error, value } = validateSessionPayload(req.body);
  if (error) {
    return res.status(400).json({ error: "Invalid session payload", details: error.details.map(d => d.message) });
  }

  const lesson = value.lesson;
  const code = generateSessionCode();

  sessions[code] = {
    lesson,
    slide_index: 0,
    students: {}
  };

  console.log("Session created:", code, lesson);

  res.json({ session_code: code });
});

// -----------------------------
// STUDENT LOADS SESSION
// -----------------------------

app.get("/api/session/:code", (req, res) => {
  const code = req.params.code;
  const { error } = validateSessionCode(code);
  if (error) {
    return res.status(400).json({ error: "Invalid session code" });
  }

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
  const { error, value } = validateResponsePayload(req.body);
  if (error) {
    return res.status(400).json({ error: "Invalid response payload", details: error.details.map(d => d.message) });
  }

  const { student_id, session_id, activity_id, question_id, answer, correct } = value;

  try {
    await pool.query(
      `INSERT INTO responses(student_id, session_id, activity_id, question_id, answer, correct, timestamp)
       VALUES($1,$2,$3,$4,$5,$6,NOW())`,
      [student_id, session_id, activity_id, question_id, answer, correct]
    );

    res.send({ status: "ok" });
  } catch (err) {
    console.error("Response DB insert error", err);
    res.status(500).send({ status: "error" });
  }
});

// -----------------------------
// SOCKET.IO
// -----------------------------

io.on("connection", (socket) => {

  console.log("New client connected:", socket.id);

  socket.on("joinSession", (payload) => {

    console.log("joinSession payload:", payload);

    // TEACHER JOIN
    if (typeof payload === "string") {

      const session_id = payload;

      socket.join(session_id);

      console.log(`Teacher joined session ${session_id}`);

      return;

    }

    // STUDENT JOIN
    const { session_id, name } = payload;

    if (!sessions[session_id]) {
      console.log("Invalid session:", session_id);
      return;
    }

    socket.join(session_id);

    sessions[session_id].students[socket.id] = {
      name
    };

    console.log(`Student ${name} joined session ${session_id}`);

    io.to(session_id).emit("studentJoined", {
      socket_id: socket.id,
      name
    });

  });

  // -----------------------------
  // SLIDE CHANGE
  // -----------------------------

  socket.on("slideChange", ({ session_id, slide_index }) => {

    if (sessions[session_id]) {
      sessions[session_id].slide_index = slide_index;
    }

    io.to(session_id).emit("updateSlide", {
      slide_index
    });

  });

  // -----------------------------
  // DISCONNECT
  // -----------------------------

  socket.on("disconnect", () => {

    console.log("Client disconnected:", socket.id);

    for (const session_id in sessions) {

      const session = sessions[session_id];

      if (session.students[socket.id]) {

        const name = session.students[socket.id].name;

        delete session.students[socket.id];

        console.log(`Student ${name} left session ${session_id}`);

        io.to(session_id).emit("studentLeft", {
          socket_id: socket.id
        });

      }

    }

  });

});

// -----------------------------
// START SERVER
// -----------------------------

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});