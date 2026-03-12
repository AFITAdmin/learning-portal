# Lesson JSON Format

Lessons are stored as JSON arrays.

Each object represents a slide.

------------------------------------------------------------------------

# Basic Structure

\[ { "slide_index": 0, "type": "content", "title": "Lesson Title",
"text": "Lesson description" }\]

Slides must include:

-   slide_index
-   type

------------------------------------------------------------------------

# Slide Types

## Content

Standard instructional slides.

Fields

title\
text\
bullets

Example

{ "slide_index": 2, "type": "content", "title": "Success Criteria",
"bullets": \[ "Understand stress", "Recognise wellbeing strategies",
"Set personal goals" \] }

------------------------------------------------------------------------

## Discussion

Prompts students for class discussion.

Displayed inside a discussion box.

Example

{ "slide_index": 4, "type": "discussion", "title": "Quick Questions",
"bullets": \[ "What makes you feel relaxed?", "What causes stress?",
"How do you manage pressure?" \] }

------------------------------------------------------------------------

## Activity

Introduces a classroom activity.

Example

{ "slide_index": 7, "type": "activity", "title": "Activity", "text":
"Discuss ways to improve your wellbeing." }

------------------------------------------------------------------------

## Cloze

Interactive multiple choice activity.

Fields

sentence\
options\
answers\
activity_id

Example

{ "slide_index": 9, "type": "cloze", "sentence": "Exercise helps reduce
\_\_\_\_\_\_.", "options": \[ "stress", "sleep", "food" \], "answers":
\[ "stress" \], "activity_id": "wellbeing_q1" }

------------------------------------------------------------------------

# Rendering Rules

Content slides

Title\
Text\
Bullet list

Discussion slides

Title\
Discussion box\
Bullet prompts

Activity slides

Title\
Activity instruction card

Cloze slides

Sentence\
Clickable answer options
