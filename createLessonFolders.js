// createLessonFolders.js

const fs = require('fs');
const path = require('path');

// Base path where images folders will be created
const basePath = path.join(__dirname, 'data', 'lessons', 'images');

// Levels, Learning Areas (letters), Lessons
const levels = [2, 3, 4];
const areas = ['G', 'C', 'E', 'B', 'M', 'S'];
const lessons = ['01', '02', '03', '04', '05', '06'];

levels.forEach(level => {
  areas.forEach(area => {
    lessons.forEach(lesson => {
      const folderName = `${level}.${area}.${lesson}`;
      const folderPath = path.join(basePath, folderName);

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Created: ${folderPath}`);
      } else {
        console.log(`Exists: ${folderPath}`);
      }
    });
  });
});

console.log('All folders created!');