# Syllabus-Based Course Initialization Guide

## Overview

The VegaPilot platform now supports syllabus-based course initialization. This feature allows administrators to automatically create course structures (modules and chapters) based on predefined syllabus templates stored in `SYLLABUS.json`.

## How It Works

### 1. Syllabus Structure

Syllabi are defined in `SYLLABUS.json` with the following hierarchy:
- **Syllabus** - Top-level exam/course template (e.g., NEET 2025, JEE Main 2025)
  - **Modules** - Subject divisions (e.g., Physics, Chemistry, Biology)
    - **Chapters** - Individual topics within each module
      - **Topics** - Subtopics covered in each chapter

### 2. Creating a Course with Syllabus

When creating a new course bundle in [course-management.html](course-management.html):

1. Click "Create New Course Bundle"
2. Fill in basic course information (title, code, subject area, etc.)
3. **Select a Syllabus** from the dropdown (optional)
4. When you select a syllabus, the system shows how many modules and chapters will be created
5. Click "Save Course Bundle"

### 3. What Gets Auto-Created

When you select a syllabus and save the course:

**Modules:**
- Automatically created based on syllabus modules
- Includes: module name, code, sequence, description
- Skips creation if module already exists

**Chapters:**
- Automatically created under respective modules
- Includes: chapter name, code, sequence, estimated duration, topics
- Each chapter stores syllabus metadata for reference

**Parts (Videos/PDFs/Quizzes):**
- NOT automatically created (as per requirement)
- Must be added separately by editing each chapter
- This allows flexibility in content selection

### 4. Example Workflow

**Scenario:** Create an IAT Plus One course

1. Open Course Management → Create New Course Bundle
2. Set:
   - Title: "IAT Plus One Complete Course"
   - Bundle Code: "IAT-P1-2025"
   - Subject Area: "Science"
   - **Select Syllabus:** "IAT Syllabus - Plus One"
3. Save the course

**Result:**
- 4 modules created: Biology, Chemistry, Mathematics, Physics
- 57 chapters created across all modules (19 Biology + 9 Chemistry + 15 Mathematics + 14 Physics)
- Each chapter is properly labeled with module name and chapter number
- Parts can now be added to each chapter individually

**Scenario 2:** Create an IAT Plus Two course

1. Select Syllabus: "IAT Syllabus - Plus Two"
2. Save the course

**Result:**
- 4 modules created: Biology, Chemistry, Mathematics, Physics
- 50 chapters created across all modules (13 Biology + 10 Chemistry + 13 Mathematics + 14 Physics)

## Adding Content to Chapters

After creating a course from a syllabus:

1. Go to the "Chapters" tab in Course Management
2. Click on any chapter to expand it
3. Click "Add Parts" to select videos, PDFs, or quizzes
4. Parts must be selected from the existing content library

## SYLLABUS_FIXED.json Structure

```json
{
  "code": "IAT_SYLLABUS",
  "name": "IAT Syllabus",
  "syllabus": [
    {
      "part": 1,
      "name": "Plus One",
      "modules": [
        {
          "id": 1,
          "moduleName": "Biology",
          "chapters": [
            {
              "id": 1,
              "chapterNumber": "1",
              "title": "The Living World"
            },
            {
              "id": 2,
              "chapterNumber": "2",
              "title": "Biological Classification"
            }
          ]
        },
        {
          "id": 2,
          "moduleName": "Chemistry",
          "chapters": [
            {
              "id": 33,
              "chapterNumber": "1",
              "title": "Some Basic Concepts of Chemistry"
            }
          ]
        }
      ]
    },
    {
      "part": 2,
      "name": "Plus Two",
      "modules": [
        {
          "id": 1,
          "moduleName": "Biology",
          "chapters": [
            {
              "id": 20,
              "chapterNumber": "1",
              "title": "Sexual Reproduction in Flowering Plants"
            }
          ]
        }
      ]
    }
  ]
}
```

### Structure Explanation:
- **code** - Unique identifier for the syllabus (e.g., "IAT_SYLLABUS")
- **name** - Display name of the syllabus (e.g., "IAT Syllabus")
- **syllabus** - Array of parts (e.g., Plus One, Plus Two)
  - **part** - Part number (1, 2, etc.)
  - **name** - Part name (e.g., "Plus One", "Plus Two")
  - **modules** - Array of subject modules
    - **id** - Module ID (used as moduleKey)
    - **moduleName** - Subject name (e.g., "Biology", "Chemistry")
    - **chapters** - Array of chapters
      - **id** - Unique chapter ID
      - **chapterNumber** - Chapter sequence number
      - **title** - Chapter title

## Adding New Syllabi

To add a new syllabus template:

1. Open `SYLLABUS_FIXED.json`
2. Add a new part object to the "syllabus" array
3. Follow the structure shown above:
   - Assign a unique `part` number
   - Give it a descriptive `name`
   - Add modules with unique `id` values
   - Add chapters under each module
4. Ensure unique chapter `id` values across the entire syllabus
5. Save the file

The new syllabus part will automatically appear in the dropdown on next page load.

**Note:** The current implementation supports a single syllabus with multiple parts. To add completely different syllabi (e.g., NEET, JEE), you would need to create separate JSON files and update the controller to load from multiple sources.

## Benefits

1. **Consistency** - Standardized course structures across similar courses
2. **Speed** - Create complex course structures in seconds
3. **Accuracy** - Pre-validated syllabus ensures correct topic coverage
4. **Flexibility** - Can still create courses manually without syllabus
5. **Customization** - Parts selection remains flexible per chapter

## Files Modified

- [course-management.html](course-management.html) - Added syllabus dropdown in course creation modal (line ~2460)
- [controllers/course-management.js](controllers/course-management.js) - Added syllabus loading and initialization logic
- [SYLLABUS_FIXED.json](SYLLABUS_FIXED.json) - Syllabus template definitions (IAT Syllabus with Plus One and Plus Two parts)

## Technical Details

### Controller Functions

- `loadSyllabi()` - Loads syllabus data from SYLLABUS.json
- `onSyllabusSelected()` - Handles syllabus selection and shows preview
- `initializeFromSyllabus()` - Creates modules and chapters from selected syllabus
- `saveCourseBundle()` - Enhanced to process syllabus initialization

### Data Storage

Each chapter created from a syllabus includes a `syllabusInfo` object:
```javascript
{
  syllabusId: "IAT_SYLLABUS_PART1",
  syllabusCode: "IAT_SYLLABUS",
  part: 1,
  partName: "Plus One",
  moduleId: 1,
  chapterId: 1,
  chapterNumber: "1"
}
```

This allows tracking of syllabus origin and provides metadata for chapter management.

### Dropdown Display

The syllabus dropdown shows entries in the format:
- "IAT Syllabus - Plus One" (contains 57 chapters across 4 modules)
- "IAT Syllabus - Plus Two" (contains 50 chapters across 4 modules)

When selected, the system shows a notification with the count of modules and chapters that will be created.
