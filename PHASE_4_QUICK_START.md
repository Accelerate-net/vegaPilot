# Instructor Time Tracker - Phase 4 Quick Start Guide

## 🚀 Quick Access

### Open the Application
1. File Path: `admin_html/instructor-time-tracker.html`
2. Open in browser or via local server
3. Navigate from admin dashboard sidebar

### Key Features Available

#### 1. View Instructor Records
- ✅ Table shows all instructors
- ✅ Click any row to open details modal
- ✅ Filter by subject, status, or sort by name/hours/amount

#### 2. Add New Instructor
- ✅ Click "ADD INSTRUCTOR" button (top right)
- ✅ Fill in instructor name, subject, chapter
- ✅ Add one or more subjects with hours and rates
- ✅ View live totals as you type
- ✅ Save to create record

#### 3. View Details & Breakdown
- ✅ Click any instructor row
- ✅ See subject-by-subject breakdown
- ✅ View total hours and total amount
- ✅ Check payment status and completion date
- ✅ Edit completion date if paid
- ✅ Process payments or delete record

#### 4. Payment Management
- ✅ Pay Full: Mark entire record as paid
- ✅ Partial Payment: Pay partial amount
- ✅ Track paid vs. outstanding balance

---

## 📊 Data Structure at a Glance

```javascript
Instructor Record = {
  id: 'INS001',
  name: 'John Doe',
  subject: 'Mathematics',
  chapter: 'Trigonometry',
  subjects: [
    { name: 'Trig Basics', hours: 5, rate: 500 },        // ₹2,500
    { name: 'Trig Advanced', hours: 3, rate: 600 }       // ₹1,800
  ],
  totalHours: 8,
  totalAmount: 4300,
  paidAmount: 1000,
  balanceAmount: 3300,
  paymentStatus: 'Partial',
  completedDate: null,
  lastUpdated: Date
}
```

---

## 🔑 Key JavaScript Functions

### Data Management
- `loadInstructors()` - Load from storage
- `saveInstructorsToStorage()` - Persist to storage

### Add Instructor Workflow
- `addNewInstructor()` - Open add modal
- `openAddInstructorModal()` - Initialize form
- `addSubjectField()` - Add subject row
- `removeSubjectField(index)` - Remove subject row
- `calculateTotalHours(subjects)` - Sum hours
- `calculateTotalAmount(subjects)` - Sum amounts
- `saveNewInstructor()` - Save new record

### Details Modal Workflow
- `openInstructorDetails(instructor)` - Open modal
- `closeInstructorDetails()` - Close modal
- `openEditMode()` - Enable edit mode
- `cancelEditDetails()` - Cancel edit
- `saveDetailsEdit()` - Save completion date
- `getTotalSubjectHours(instructor)` - Get total hours

### Payment & Actions
- `openPaymentModal(instructor)` - Full payment
- `openPartialPaymentModal(instructor)` - Partial payment
- `deleteInstructor(instructor)` - Delete record

---

## 🎯 Common Tasks

### Task: Add an Instructor with Multiple Subjects
1. Click "ADD INSTRUCTOR"
2. Select instructor name: "Rahul Kumar"
3. Select subject: "Mathematics"
4. Enter chapter: "Trigonometry"
5. Subject #1: "Trig - Basics", 5 hours, ₹500/hr → ₹2,500
6. Click "Add Subject"
7. Subject #2: "Trig - Advanced", 3 hours, ₹600/hr → ₹1,800
8. **Totals update to:** 8 hours, ₹4,300
9. Click "Save"

### Task: View Instructor Breakdown
1. Click instructor row in table
2. Modal opens showing:
   - Avatar and name
   - "Trig - Basics": 5h @ ₹500/hr = ₹2,500
   - "Trig - Advanced": 3h @ ₹600/hr = ₹1,800
   - **Total Hours:** 8h
   - **Total Amount:** ₹4,300
   - **Balance:** ₹4,300 (if unpaid)
   - **Payment Status:** Pending

### Task: Record Partial Payment
1. Open instructor details
2. Click "Partial" button
3. Enter amount paid (e.g., ₹2,000)
4. Status changes to "Partial"
5. **Balance updates:** ₹4,300 - ₹2,000 = ₹2,300

### Task: Mark as Complete
1. Open details modal
2. Click "Pay Full" to pay remaining balance
3. Status changes to "Paid"
4. Completion Date field appears
5. Click "Edit" to modify date if needed
6. Date auto-populated with current date

---

## 📱 Storage Info

**Storage Location:** Browser localStorage  
**Storage Key:** `vegapilot_instructors_expenses`  
**Data Persists:** Across page refreshes and browser sessions  
**Clear All:** Open DevTools → Application → localStorage → Find key → Delete

---

## ⚠️ Important Notes

### Data Migration
- Old format with single `hourlyRate` field is no longer used
- Each subject now has its own rate
- Demo data has been updated to new structure
- If clearing old data, records in old format won't display

### Subject Management
- Minimum 1 subject required per record
- No maximum limit on subjects
- Each subject independently tracked
- Rates can vary between subjects

### Payment Status
- **Pending:** No payment made (balanceAmount = totalAmount)
- **Partial:** Some payment made (0 < paidAmount < totalAmount)
- **Paid:** Fully paid (balanceAmount = 0)

### Completion Date
- Only editable when status is "Paid"
- Auto-set to current date when marked as paid
- Manually editable via Edit mode in modal

---

## 🐛 Troubleshooting

**Issue:** Add Instructor button disabled
- Check: All required fields filled (name, subject, chapter)
- Check: At least one subject with name, hours, rate

**Issue:** Save button greyed out
- Check: Form validation (all required fields)
- Check: At least one subject added to the form

**Issue:** Totals not calculating
- Check: Hours and rate both entered as numbers
- Check: No typos in field values

**Issue:** Changes not persisting
- Check: Browser allows localStorage
- Check: Sufficient storage space
- Clear cache and try again

**Issue:** Old data not showing
- Check: Previously saved data in new format
- Check: localStorage hasn't been cleared
- Old format data may need to be re-entered

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review PHASE_4_IMPLEMENTATION_SUMMARY.md
3. Check browser console for errors (F12)
4. Verify localStorage data (F12 → Application)

---

## ✅ Verification Checklist

- [ ] Page loads without errors
- [ ] ADD INSTRUCTOR button visible and clickable
- [ ] Can add instructor with multiple subjects
- [ ] Totals calculate correctly
- [ ] Details modal opens on row click
- [ ] Subject breakdown displays properly
- [ ] Payment buttons work
- [ ] Edit mode for completion date works
- [ ] Changes persist after refresh
- [ ] No console errors

---

**Last Updated:** January 27, 2026  
**Version:** 4.0 - Modal & Subject-Wise Breakdown  
**Status:** ✅ Ready for Use
