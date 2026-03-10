# Phase 4 - Visual Flow Guide

## User Interface Architecture

### Main Table View
```
┌─────────────────────────────────────────────────────────────────┐
│ INSTRUCTOR TIME TRACKER                      [ADD INSTRUCTOR]  │
│ Managing X total instructor records                             │
├─────────────────────────────────────────────────────────────────┤
│ Total Hours: XX  |  Total Amount: ₹XXXX  |  Pending: X  Paid: X│
├─────────────────────────────────────────────────────────────────┤
│ Filter: [Subject ▼] [Status ▼] Sort: [Name ▼]                  │
├──────────────┬──────────┬─────────────┬───────────┬─────────────┤
│ Instructor   │ Subject  │ Chapter     │ Amount    │ Status      │
├──────────────┼──────────┼─────────────┼───────────┼─────────────┤
│ Rahul Kumar  │ Math     │ Trig        │ ₹4,000    │ Pending ○   │
│ Ananya Shar. │ Physics  │ Motion      │ ₹3,000    │ Partial ◐   │
│ Mohammed A.  │ Chemistry│ Organic     │ ₹3,300    │ Paid ●      │
│ Sarah J.     │ Biology  │ Physiology  │ ₹2,080    │ Pending ○   │
│ David M.     │ Math     │ Calculus    │ ₹3,500    │ Pending ○   │
└──────────────┴──────────┴─────────────┴───────────┴─────────────┘

CLICK ROW → OPENS DETAILS MODAL
```

---

## Details Modal Flow

### When User Clicks Row
```
USER CLICKS ROW
      ↓
openInstructorDetails(instructor)
      ↓
selectedInstructor = copy of instructor
showDetailsModal = true
      ↓
MODAL OPENS ↓
```

### Details Modal Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Details Modal (max-width: 600px, max-height: 85vh)             │
├─────────────────────────────────────────────────────────────────┤
│                                                            [×]   │
│  [R]  Rahul Kumar                                               │
│       Instructor Record Management                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SUBJECT BREAKDOWN                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Subject Name: Trigonometry - Basics                        │ │
│  │ Hours: 5  |  Hourly Rate: ₹500/hr  |  Amount: ₹2,500     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Subject Name: Trigonometry - Advanced                      │ │
│  │ Hours: 3  |  Hourly Rate: ₹500/hr  |  Amount: ₹1,500     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TOTALS                                                         │
│  ┌──────────────────┬────────────────┬────────────────┐        │
│  │ Total Hours      │ Total Amount   │ Balance        │        │
│  │ 8 hrs            │ ₹4,000        │ ₹4,000        │        │
│  └──────────────────┴────────────────┴────────────────┘        │
│                                                                 │
│  PAYMENT STATUS                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Pending]  Paid Amount: ₹0      Last Updated: Jan 25    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [DELETE]                   [EDIT] [PAY FULL] [PARTIAL]        │
└─────────────────────────────────────────────────────────────────┘

BUTTON ACTIONS:
- DELETE: Remove record entirely
- EDIT: Edit completion date (only for Paid)
- PAY FULL: Pay full balance
- PARTIAL: Pay partial amount
```

### Edit Mode Display
```
When user clicks EDIT button:

┌─────────────────────────────────────────────────────────────────┐
│  COMPLETION DATE (if Paid)                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Completion Date: January 25, 2026                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  EDIT MODE                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Completion Date (if paid)                               │  │
│  │ [DATE PICKER INPUT]                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [DISCARD]                                    [SAVE CHANGES]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Add Instructor Modal Flow

### When User Clicks "ADD INSTRUCTOR"
```
USER CLICKS "ADD INSTRUCTOR"
      ↓
addNewInstructor()
      ↓
newInstructor = {
  name: '', subject: '', chapter: '',
  subjects: [{ name: '', hours: null, rate: null }],
  ...
}
showAddModal = true
      ↓
MODAL OPENS ↓
```

### Add Instructor Modal Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ADD INSTRUCTOR RECORD                                      [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Instructor Name *                                              │
│  [SELECT DROPDOWN - availableNames]                             │
│                                                                 │
│  Subject Category *                                             │
│  [SELECT DROPDOWN - availableSubjects]                          │
│                                                                 │
│  Chapter / Topic (Reference) *                                  │
│  [TEXT INPUT]                                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SUBJECTS & RATES                                 [+ Add Subject]│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Subject Name *    Hours *    Rate (₹/hr) *   Amount    [×] │ │
│  │ [TEXT INPUT]      [NUMBER]   [NUMBER]        [READ-ONLY]  │ │
│  │ Trig Basics       5          500             ₹2,500       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Subject Name *    Hours *    Rate (₹/hr) *   Amount    [×] │ │
│  │ [TEXT INPUT]      [NUMBER]   [NUMBER]        [READ-ONLY]  │ │
│  │ Trig Advanced     3          500             ₹1,500       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TOTALS SUMMARY                                                 │
│  ┌──────────────────┬────────────────┐                         │
│  │ Total Hours      │ Total Amount   │                         │
│  │ 8 hrs            │ ₹4,000        │                         │
│  └──────────────────┴────────────────┘                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [CANCEL]                                          [SAVE]       │
└─────────────────────────────────────────────────────────────────┘

FORM INTERACTIONS:
- Click "Add Subject": New row appears below current subjects
- Fill subject row: Hours × Rate auto-calculates amount
- Click [×] on row: Subject row removed
- Totals update live as you type
- Save button disabled if validation fails
```

### Subject Add/Remove Flow
```
INITIAL STATE
├─ Subject Row 1 [Trig Basics | 5 | 500 | ₹2,500] [×]
└─ Totals: 5 hrs, ₹2,500

USER CLICKS "+ Add Subject"
├─ Subject Row 1 [Trig Basics | 5 | 500 | ₹2,500] [×]
├─ Subject Row 2 [EMPTY | EMPTY | EMPTY | ₹0] [×]      ← NEW
└─ Totals: 5 hrs, ₹2,500

USER FILLS ROW 2
├─ Subject Row 1 [Trig Basics | 5 | 500 | ₹2,500] [×]
├─ Subject Row 2 [Trig Adv | 3 | 550 | ₹1,650] [×]
└─ Totals: 8 hrs, ₹4,150        ← UPDATED

USER CLICKS × ON ROW 2
├─ Subject Row 1 [Trig Basics | 5 | 500 | ₹2,500] [×]
└─ Totals: 5 hrs, ₹2,500        ← UPDATED
```

---

## Data Flow Diagram

### Adding New Instructor
```
USER FORM INPUT
  ↓
[Validate all fields]
  ↓
[Check: At least 1 subject]
  ↓
[Validate each subject: name, hours, rate > 0]
  ↓
[Calculate totalHours = sum of subject hours]
[Calculate totalAmount = sum of subject (hours × rate)]
  ↓
[Check if instructor exists with same name/subject]
  ├─ YES: Append subjects to existing record
  │         └─ Recalculate totals
  │         └─ Update status
  │         └─ Update lastUpdated
  │
  └─ NO: Create new record
         └─ Generate new ID
         └─ Set status to Pending
         └─ Set completedDate to null
  ↓
[Save to localStorage]
  ↓
[Refresh table display]
  ↓
CLOSE MODAL & SHOW SUCCESS
```

### Viewing Instructor
```
USER CLICKS ROW
  ↓
openInstructorDetails(instructor)
  ↓
[Copy instructor data to selectedInstructor]
[Set showDetailsModal = true]
  ↓
DISPLAY MODAL
  ├─ Show name & avatar
  ├─ Loop through subjects array
  │  ├─ Display subject.name
  │  ├─ Display subject.hours
  │  ├─ Display subject.rate
  │  └─ Calculate & display: hours × rate
  │
  ├─ Calculate & show totals
  │  ├─ getTotalSubjectHours(subjects)
  │  ├─ calculateTotalAmount(subjects)
  │  └─ Show balance = total - paidAmount
  │
  ├─ Show payment status
  │  ├─ Status badge (color-coded)
  │  ├─ Paid amount
  │  └─ Last updated date
  │
  └─ If Paid: Show completion date section
```

### Processing Payment
```
USER CLICKS "PAY FULL"
  ↓
openPaymentModal(instructor)
  ↓
[Display payment form]
[Show balance to pay]
  ↓
USER CONFIRMS
  ↓
[Update paidAmount = totalAmount]
[Calculate balanceAmount = 0]
[Set paymentStatus = 'Paid']
[Set completedDate = new Date()]
  ↓
[Save to localStorage]
  ↓
[Refresh instructor display]
  ↓
COMPLETION DATE SECTION APPEARS
```

---

## State Machine

### Modal States
```
CLOSED
  │
  ├─ User clicks row ──→ DETAILS_OPEN
  │
  └─ User clicks "ADD" ──→ ADD_OPEN

DETAILS_OPEN
  ├─ User clicks "×" ──→ CLOSED
  ├─ User clicks outside ──→ CLOSED
  ├─ User clicks "Edit" ──→ DETAILS_EDIT_MODE
  ├─ User clicks "Delete" ──→ DELETE_CONFIRM
  └─ User clicks "Pay Full" ──→ PAYMENT_MODAL

DETAILS_EDIT_MODE
  ├─ User clicks "Discard" ──→ DETAILS_OPEN
  ├─ User clicks "Save Changes" ──→ DETAILS_OPEN
  └─ (date saved to storage)

ADD_OPEN
  ├─ User clicks "Cancel" ──→ CLOSED
  ├─ User clicks "×" ──→ CLOSED
  ├─ User clicks "Save" ──→ VALIDATE
  │                          ├─ Invalid ──→ SHOW_ERROR → ADD_OPEN
  │                          └─ Valid ──→ SAVE_TO_STORAGE → CLOSED
  └─ (user clicks "Add Subject") ──→ ADD_OPEN (update subject list)
```

---

## Color Scheme

### Buttons
```
PRIMARY ACTION (Save, Edit)      → #006073 (Teal)
SUCCESS ACTION (Pay Full)         → #16a34a (Green)
WARNING ACTION (Partial Payment)  → #f59e0b (Amber)
DANGER ACTION (Delete)            → #dc2626 (Red)
SECONDARY (Cancel, Discard)       → #94a3b8 (Gray)
ACCENT (Add Subject)              → #006073 (Teal)
```

### Status Badges
```
PENDING   → #fbbf24 (Yellow badge with "Pending" text)
PARTIAL   → #f59e0b (Orange badge with "Partial" text)
PAID      → #16a34a (Green badge with "Paid" text)
```

### Display Elements
```
TOTALS CARDS        → #f0fdf4 (Light green background)
SUBJECT BREAKDOWN   → White cards with #e2e8f0 border
COMPLETION DATE     → #f0fdf4 (Light green) with #16a34a border
TOTALS TEXT         → #16a34a (Green text)
INFO LABELS         → #64748b (Gray text)
```

---

## Responsive Design

### Desktop (>1200px)
```
Full modal: 600px wide
Subject grid: 4 columns (name | hours | rate | amount)
Totals grid: 3 columns
All fields visible and sized normally
```

### Tablet (768px - 1200px)
```
Modal adjusts: ~90% of screen width or max 600px
Subject grid: May stack to 2 columns if needed
Buttons stack vertically if space limited
Touch-friendly button sizes maintained
```

### Mobile (<768px)
```
Modal: Full width - 20px padding
Subject grid: 2 columns (name | hours) and (rate | amount)
Form fields: Full width stacking
Buttons: Stack vertically
Overflow: Modal scrollable (85vh max-height)
```

---

## Loading States

### Initial Page Load
```
Page loads
  ↓
loadInstructors() from localStorage
  ↓
Display 5 demo instructors (from default data)
  ↓
Calculate statistics
  ↓
Display table with records
```

### Modal Load
```
Modal opens
  ↓
Copy data to $scope variable
  ↓
ng-repeat processes subjects array
  ↓
calculateTotalHours() runs
  ↓
calculateTotalAmount() runs
  ↓
Modal displays (animations)
```

### Form Save
```
User clicks Save
  ↓
Form validation runs (8 checks)
  ↓
If invalid: Show alert, stay on form
  ↓
If valid: Process data
  ↓
Save to localStorage
  ↓
Show success alert
  ↓
Close modal
  ↓
Refresh table
```

---

## Error Handling

### Validation Errors
```
❌ Missing Instructor Name
   → Alert: "Instructor Name, Subject, and Chapter are required."
   → User stays in form

❌ No Subjects Added
   → Alert: "Please add at least one subject with hours and rate."
   → Save button disabled (visual feedback)

❌ Incomplete Subject
   → Alert: "All subjects must have a name, hours, and rate."
   → User must complete the row

❌ Zero or Negative Values
   → Alert: "Hours and Rate must be greater than zero."
   → Form validates numbers
```

### Recovery Actions
```
User sees error
  ↓
User corrects the issue
  ↓
Validation clears
  ↓
Try Save again
  ↓
Should succeed
```

---

## Animation & Transitions

### Modal Appearance
```
Modal slides in with fade effect
  - Overlay: opacity 0 → 1 (200ms)
  - Modal: transform translateY(20px) → translateY(0) (300ms)
  - Effect: Smooth, professional appearance
```

### Subject Addition
```
New subject row appears
  - Opacity: 0 → 1 (200ms)
  - Height: 0 → auto (200ms)
  - Effect: Smooth slide and fade
```

### Edit Mode Toggle
```
Edit controls fade in/out
  - Old content fades out
  - New content fades in
  - Duration: 300ms
  - Animation: fadeIn CSS class
```

---

**Visual Design:** Modern, clean, professional  
**Interaction Model:** Modal-based, click-driven  
**Accessibility:** Color + text labels, keyboard support considered  
**Performance:** All animations <300ms, smooth 60fps target  

---

Created: January 27, 2026  
Status: ✅ Complete & Ready
