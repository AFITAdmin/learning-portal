// copyLessonImages.js
const fs = require("fs");
const path = require("path");

// Source images to copy
const sourceFolder = "public/images/4.B.03";
const images = [
  "activity.jpg",
  "cloze.jpg",
  "slide0_intro.jpg",
  "slide1_introduction.jpg",
  "slide2_success_criteria.jpg",
  "slide3_keywords.jpg",
  "slide4_kahoot.jpg",
  "slide5_discussion.jpg",
  "takeaway.jpg"
];

// Destination lesson folders
const lessonFolders = [
  "public/images/2.B.01",
  "public/images/2.B.02",
  "public/images/2.B.03",
  "public/images/2.B.04",
  "public/images/2.B.05",
  "public/images/2.B.06",
  "public/images/2.C.01",
  "public/images/2.C.02",
  "public/images/2.C.03",
  "public/images/2.C.04",
  "public/images/2.C.05",
  "public/images/2.C.06",
  "public/images/2.E.01",
  "public/images/2.E.02",
  "public/images/2.E.03",
  "public/images/2.E.04",
  "public/images/2.E.05",
  "public/images/2.E.06",
  "public/images/2.G.01",
  "public/images/2.G.02",
  "public/images/2.G.03",
  "public/images/2.G.04",
  "public/images/2.G.05",
  "public/images/2.G.06",
  "public/images/2.M.01",
  "public/images/2.M.02",
  "public/images/2.M.03",
  "public/images/2.M.04",
  "public/images/2.M.05",
  "public/images/2.M.06",
  "public/images/2.S.01",
  "public/images/2.S.02",
  "public/images/2.S.03",
  "public/images/2.S.04",
  "public/images/2.S.05",
  "public/images/2.S.06",
  "public/images/3.B.01",
  "public/images/3.B.02",
  "public/images/3.B.03",
  "public/images/3.B.04",
  "public/images/3.B.05",
  "public/images/3.B.06",
  "public/images/3.C.01",
  "public/images/3.C.02",
  "public/images/3.C.03",
  "public/images/3.C.04",
  "public/images/3.C.05",
  "public/images/3.C.06",
  "public/images/3.E.01",
  "public/images/3.E.02",
  "public/images/3.E.03",
  "public/images/3.E.04",
  "public/images/3.E.05",
  "public/images/3.E.06",
  "public/images/3.G.01",
  "public/images/3.G.02",
  "public/images/3.G.03",
  "public/images/3.G.04",
  "public/images/3.G.05",
  "public/images/3.G.06",
  "public/images/3.M.01",
  "public/images/3.M.02",
  "public/images/3.M.03",
  "public/images/3.M.04",
  "public/images/3.M.05",
  "public/images/3.M.06",
  "public/images/3.S.01",
  "public/images/3.S.02",
  "public/images/3.S.03",
  "public/images/3.S.04",
  "public/images/3.S.05",
  "public/images/3.S.06",
  "public/images/4.B.01",
  "public/images/4.B.02",
  "public/images/4.B.04",
  "public/images/4.B.05",
  "public/images/4.B.06",
  "public/images/4.C.01",
  "public/images/4.C.02",
  "public/images/4.C.03",
  "public/images/4.C.04",
  "public/images/4.C.05",
  "public/images/4.C.06",
  "public/images/4.E.01",
  "public/images/4.E.02",
  "public/images/4.E.03",
  "public/images/4.E.04",
  "public/images/4.E.05",
  "public/images/4.E.06",
  "public/images/4.G.01",
  "public/images/4.G.02",
  "public/images/4.G.03",
  "public/images/4.G.04",
  "public/images/4.G.05",
  "public/images/4.G.06",
  "public/images/4.M.01",
  "public/images/4.M.02",
  "public/images/4.M.03",
  "public/images/4.M.04",
  "public/images/4.M.05",
  "public/images/4.M.06",
  "public/images/4.S.01",
  "public/images/4.S.02",
  "public/images/4.S.03",
  "public/images/4.S.04",
  "public/images/4.S.05",
  "public/images/4.S.06"
];

// Copy function
lessonFolders.forEach((folder) => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  images.forEach((img) => {
    const src = path.join(sourceFolder, img);
    const dest = path.join(folder, img);

    fs.copyFile(src, dest, (err) => {
      if (err) {
        console.error(`Error copying ${img} to ${folder}:`, err);
      } else {
        console.log(`Copied ${img} to ${folder}`);
      }
    });
  });
});

console.log("Copying initiated...");