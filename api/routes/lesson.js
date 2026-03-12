const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// GET /api/lesson?lesson=X.XX.XX
router.get("/", (req, res) => {
  const lessonRef = req.query.lesson; // read lesson from URL query
  if (!lessonRef) {
    return res.status(400).json({ error: "No lesson specified" });
  }

  const lessonPath = path.join(__dirname, "../../data/lessons", `${lessonRef}.json`);

  fs.readFile(lessonPath, "utf8", (err, data) => {
    if (err) {
      console.error(`Lesson file not found: ${lessonPath}`, err);
      return res.status(404).json({ error: "Lesson not found" });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      res.status(500).json({ error: "Invalid lesson JSON" });
    }
  });
});

module.exports = router;