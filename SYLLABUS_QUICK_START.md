# Syllabus-Based Course Initialization - Quick Start

## 5-Minute Quick Start Guide

### Step 1: Open Course Management
Navigate to Course Management page in VegaPilot admin panel.

### Step 2: Create New Course Bundle
Click the "Create New Course Bundle" button.

### Step 3: Fill Basic Information
Required fields:
- **Bundle Title**: e.g., "IAT Plus One Complete Course 2025"
- **Bundle Code**: e.g., "IAT-P1-2025"

Optional but recommended:
- **Subject Area**: Select "Science"
- **Difficulty Level**: Select appropriate level
- **Price**: Set course price
- **Description**: Brief course description

### Step 4: Select Syllabus (Key Step)
In the **"Select Syllabus"** dropdown, choose:
- "IAT Syllabus - Plus One" (for Plus One courses)
- "IAT Syllabus - Plus Two" (for Plus Two courses)

You'll see a notification showing how many modules and chapters will be created.

### Step 5: Save
Click "Save Course Bundle" button.

### Step 6: Verify Creation
Check the success message:
- "Course bundle created successfully! Modules and chapters have been initialized from the selected syllabus."

Navigate to the Chapters tab to see all auto-created chapters.

### Step 7: Add Content
Now add videos, PDFs, and quizzes to each chapter:
1. Click on any chapter to expand it
2. Click "Edit" or "Add Parts"
3. Select content from your library
4. Save the chapter

---

## What Gets Created Automatically?

### For "IAT Syllabus - Plus One"
✅ 4 Modules:
- Biology (19 chapters)
- Chemistry (9 chapters)
- Mathematics (15 chapters)
- Physics (14 chapters)

✅ Total: 57 chapters ready for content

### For "IAT Syllabus - Plus Two"
✅ 4 Modules:
- Biology (13 chapters)
- Chemistry (10 chapters)
- Mathematics (13 chapters)
- Physics (14 chapters)

✅ Total: 50 chapters ready for content

---

## What You Still Need to Do Manually?

❌ **Parts (Videos/PDFs/Quizzes)** - Not auto-created
- Each chapter starts empty
- You must select and add content parts
- This allows customization per course

---

## Example Chapter Structure Created

**Module:** Biology  
**Chapter:** Biology - Chapter 1: The Living World  
**Parts:** (Empty - add manually)  
**Status:** Active  

---

## Tips

1. **Module Reuse**: If modules already exist, they'll be reused (not duplicated)
2. **Syllabus Metadata**: Each chapter stores its syllabus origin for tracking
3. **Manual Override**: You can still create courses manually without selecting a syllabus
4. **Flexible Content**: Different courses can use the same syllabus but different content

---

## Troubleshooting

**Q: Dropdown is empty**  
A: Check that `SYLLABUS_FIXED.json` exists in the project root

**Q: No chapters created**  
A: Ensure you saved the course after selecting a syllabus

**Q: Modules duplicated**  
A: This shouldn't happen - modules are reused. If it does, check module IDs

**Q: Parts not showing**  
A: Parts must be added manually - this is by design

---

## Full Documentation

For detailed documentation, see:
- [SYLLABUS_USAGE_GUIDE.md](SYLLABUS_USAGE_GUIDE.md) - Complete user guide
- [SYLLABUS_IMPLEMENTATION_SUMMARY.md](SYLLABUS_IMPLEMENTATION_SUMMARY.md) - Technical details

---

**Ready to get started?** Open Course Management and create your first syllabus-based course!
