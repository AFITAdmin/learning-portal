# System Architecture

This document describes how the Interactive Classroom Lesson Platform is
structured.

------------------------------------------------------------------------

# Overview

The system follows a real-time client-server model.

The teacher controls lesson progression, and all connected students
synchronise their views using Socket.IO.

------------------------------------------------------------------------

# Core Components

Teacher Dashboard\
Controls lesson sessions and launches the teacher board.

Teacher Board\
Full-screen presentation display used on the classroom screen.

Student Client\
Allows students to join a session and participate in activities.

Server\
Handles session creation, slide synchronisation, and response storage.

------------------------------------------------------------------------

# Data Flow

Teacher starts lesson\
↓\
Server creates session\
↓\
Session code generated\
↓\
Students join session\
↓\
Students added to Socket.IO room\
↓\
Teacher changes slide\
↓\
Server emits updateSlide event\
↓\
All student clients update slide

------------------------------------------------------------------------

# Socket.IO Events

## joinSession

Client → Server

Used when a student or teacher joins a lesson session.

Payload:

session_id

Server behaviour:

Adds the socket to the session room.

------------------------------------------------------------------------

## updateSlide

Server → Clients

Broadcast when teacher changes slide.

Payload:

{ slide_index: number }

All connected clients update their displayed slide.

------------------------------------------------------------------------

# Lesson Storage

Lessons are stored as JSON files in the lessons/ directory.

These are loaded when a session begins and cached in memory for
performance.

------------------------------------------------------------------------

# Session Lifecycle

1.  Teacher starts lesson
2.  Server loads lesson JSON
3.  Session created
4.  Session code assigned
5.  Students join session
6.  Teacher advances slides
7.  Session ends when lesson closes
