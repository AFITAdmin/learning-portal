# Contributing Guide

This document outlines how development should be carried out for this
project.

------------------------------------------------------------------------

# Development Principles

The project aims to remain:

-   lightweight
-   readable
-   dependency-minimal
-   classroom reliable

Avoid unnecessary frameworks.

Vanilla JavaScript is preferred where possible.

------------------------------------------------------------------------

# Branch Workflow

Recommended branch structure

main\
development\
feature/\*

Example

feature/student-activity-lock\
feature/lesson-library

------------------------------------------------------------------------

# Commit Message Style

Use clear commit prefixes.

feat: new feature\
fix: bug fix\
refactor: code improvement\
docs: documentation change

Examples

feat: add session code joining\
fix: duplicate bullet rendering\
feat: teacher board presentation mode

------------------------------------------------------------------------

# Testing Checklist

Before committing:

-   Teacher board loads correctly
-   Student page joins session
-   Slides synchronise
-   Cloze answers submit correctly
-   No duplicate rendering

------------------------------------------------------------------------

# Future Development Priorities

1.  Activity locking
2.  Teacher slide controls
3.  Student response analytics
4.  Lesson library
5.  Database integration
