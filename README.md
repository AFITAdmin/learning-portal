# Interactive Classroom Lesson Platform

A real-time classroom teaching platform where a **teacher controls
lesson slides** and **students join using a session code**.

Slides synchronise live across all connected devices using
**Socket.IO**, allowing teachers to deliver structured lessons with
interactive student participation.

------------------------------------------------------------------------

# Key Features

### Real-Time Classroom Sync

-   Teacher controls slide progression
-   Students automatically follow the teacher's slide
-   Updates pushed instantly via WebSockets

### Session Code System

Students join using a **short session code**, removing the need for
login accounts.

### Interactive Lesson Types

Supports multiple teaching slide types:

-   Content slides
-   Discussion prompts
-   Classroom activities
-   Cloze (multiple choice) questions

### Presentation Board

A **full-screen teacher board** optimised for classroom displays with
large typography and clean formatting.

### JSON Lesson System

Lessons are stored as **portable JSON files**, making them easy to
create, modify, and share.

------------------------------------------------------------------------

# System Architecture

Teacher Dashboard │ │ Start Lesson ▼ Session Created (Server) │ │
Session Code ▼ Students Join Session │ ▼ Socket.IO Room │ ▼ Teacher
Controls Slides │ ▼ updateSlide Event Broadcast │ ▼ All Students Sync
Slide

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   HTML
-   CSS
-   Vanilla JavaScript
-   Socket.IO Client

## Backend

-   Node.js
-   Express
-   Socket.IO

## Data

-   JSON lesson files
-   PostgreSQL (planned for analytics)

------------------------------------------------------------------------

# Session System

### Session Workflow

1.  Teacher launches a lesson
2.  Server creates a session
3.  A session code is generated
4.  Students enter the code
5.  Students join a Socket.IO room
6.  Teacher advances slides
7.  Server broadcasts slide updates to all students

------------------------------------------------------------------------

# Slide Types

Lessons consist of an ordered array of slide objects.

Example structure:

{ "slide_index": 1, "type": "content", "title": "Introduction",
"bullets": \[ "Recognising stress", "Managing wellbeing", "Setting
realistic goals" \] }

------------------------------------------------------------------------

## Content Slides

Standard instructional slides.

Fields: - title - text - bullets

------------------------------------------------------------------------

## Discussion Slides

Used for class discussion prompts.

Rendered inside a discussion box.

Example:

{ "type": "discussion", "title": "Quick Questions", "bullets": \[ "What
helps you relax?", "What causes stress?" \] }

------------------------------------------------------------------------

## Activity Slides

Used to introduce class tasks.

Example:

{ "type": "activity", "title": "Activity", "text": "Discuss your current
wellbeing habits." }

------------------------------------------------------------------------

## Cloze Slides

Interactive student question slides.

Fields: - sentence - options - answers - activity_id

Example:

{ "type": "cloze", "sentence": "Exercise helps reduce \_\_\_\_\_\_.",
"options": \["stress","sleep","food"\], "answers": \["stress"\] }

------------------------------------------------------------------------

# API Endpoints

## Get Session Data

GET /api/session/:session_id

Returns: { slides: \[\], slide_index: number }

------------------------------------------------------------------------

## Record Student Response

POST /api/response

Payload: { student_id, session_id, activity_id, question_id, answer,
correct }

------------------------------------------------------------------------

# Lesson Authoring Tool

A browser-based lesson generator allows teachers to create lesson JSON
files.

Features: - structured lesson inputs - slide creation - automatic JSON
generation - downloadable lesson files

------------------------------------------------------------------------

# Rendering Logic Improvements

Recent updates improved slide rendering consistency.

Fixed Issues: - Duplicate bullet lists - Discussion bullets rendering
outside the card - Undefined text errors - Inconsistent formatting
between board and student views

------------------------------------------------------------------------

# Local Development Setup

1.  Clone repository git clone
    https://github.com/AFITAdmin/project-name.git

2.  Install dependencies npm install

3.  Start server node server.js

4.  Open pages

Teacher dashboard http://localhost:3000/teacher/dashboard.html

Student page http://localhost:3000/student/student.html

------------------------------------------------------------------------

# Planned Improvements

-   Student activity locking
-   Teacher slide controls
-   Response analytics
-   Lesson library
-   PostgreSQL analytics storage

------------------------------------------------------------------------

# Project Vision

To create a lightweight classroom teaching system combining:

-   structured lesson delivery
-   real-time student interaction
-   simple lesson creation
-   minimal teacher setup

The aim is to provide a flexible alternative to complex classroom
learning platforms.
