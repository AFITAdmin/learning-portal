const fs = require('fs');
const path = require('path');

// Folder with all JSON lessons
const lessonsDir = './data/lessons';
const imagesDir = '/images'; // browser root path

// Standard first slides
const standardSlides = [0,1,2,3,4,5];
const lastSlidesCount = 3;

// Map for standard slides
const standardMap = {
  0: 'slide0_intro.jpg',
  1: 'slide1_introduction.jpg',
  2: 'slide2_success_criteria.jpg',
  3: 'slide3_keywords.jpg',
  4: 'slide4_kahoot.jpg',
  5: 'slide5_discussion.jpg'
};

// Map for last 3 slides
const lastMap = ['activity.jpg','cloze.jpg','takeaway.jpg'];

// Function to update images in a lesson JSON file
function addImagesToLesson(filePath) {
  const lessonName = path.parse(filePath).name; // e.g., '3.B.02'
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const totalSlides = data.length;

  data.forEach((slide, index) => {
    // First 6 slides
    if (standardSlides.includes(index)) {
      slide.image = `${imagesDir}/2.B.01/${standardMap[index]}`; // always 2.B.01 folder
    }
    // Last 3 slides
    else if (index >= totalSlides - lastSlidesCount) {
      const lastIndex = index - (totalSlides - lastSlidesCount);
      slide.image = `${imagesDir}/2.B.01/${lastMap[lastIndex]}`;
    }
    // Learning slides
    else {
      slide.image = `${imagesDir}/2.B.01/slide${index}_learning.jpg`;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated images for ${filePath}`);
}

// Process all JSON files in lessons folder
fs.readdirSync(lessonsDir).forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(lessonsDir, file);
    addImagesToLesson(filePath);
  }
});

console.log('All lesson files updated with images.');