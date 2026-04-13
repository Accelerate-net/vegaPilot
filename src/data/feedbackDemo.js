import { availableCourses } from './attemptReportsDemo';
import { examsDemo } from './examsDemo';

const studentPool = [
  ['STU-001', 'Rajesh Kumar'],
  ['STU-002', 'Priya Sharma'],
  ['STU-003', 'Amit Patel'],
  ['STU-004', 'Sneha Reddy'],
  ['STU-005', 'Vikram Singh'],
  ['STU-006', 'Anjali Gupta'],
  ['STU-007', 'Arjun Mehta'],
  ['STU-008', 'Divya Iyer'],
  ['STU-009', 'Karan Verma'],
  ['STU-010', 'Neha Joshi'],
  ['STU-011', 'Rahul Desai'],
  ['STU-012', 'Pooja Nair'],
];

const mockRemarks = [
  "Excellent content, really helped me understand the concepts.",
  "The exam was a bit too lengthy.",
  "Great instructor, but the video quality could be better.",
  "Very relevant to the syllabus.",
  "Average experience, could use more practice questions.",
  "Highly recommended!",
  "Some questions had ambiguous options.",
  "The chapter explanation was outstanding.",
  "I loved the detailed solutions provided.",
  "Please add more mock tests like this.",
  "",
  "",
];

export function generateFeedbacks(count = 45) {
  const now = Date.now();
  const feedbacks = [];

  for (let i = 0; i < count; i++) {
    const student = studentPool[i % studentPool.length];
    const isAnonymous = i % 5 === 0;
    
    // Mix course feedbacks and exam feedbacks
    const isCourse = i % 3 !== 0;
    let itemType, itemName, itemId, chapterName;

    if (isCourse) {
      itemType = 'course';
      const course = availableCourses[i % availableCourses.length];
      itemId = course.id;
      itemName = course.name;
      chapterName = i % 2 === 0 ? `Chapter ${Math.floor(i / 2) % 5 + 1}` : null;
    } else {
      itemType = 'exam';
      const exam = examsDemo[i % examsDemo.length];
      itemId = String(exam.id);
      itemName = exam.title;
      chapterName = null;
    }

    const rating = Math.max(1, 5 - (i % 3)); // Ratings between 3 and 5 typically
    const remark = mockRemarks[i % mockRemarks.length];
    const submittedAt = new Date(now - (i + 1) * 36e5 * 12).toISOString();

    feedbacks.push({
      id: `FB-${1000 + i}`,
      studentId: isAnonymous ? null : student[0],
      studentName: isAnonymous ? 'Anonymous' : student[1],
      studentEmail: isAnonymous ? null : `${student[1].toLowerCase().replace(/\\s+/g, '.')}@example.com`,
      rollNumber: isAnonymous ? null : `R${2024000 + i + 1}`,
      itemType,
      itemId,
      itemName,
      chapterName,
      rating: rating === 1 ? i % 4 + 2 : rating, // Adjust a bit
      remarks: remark,
      isAnonymous,
      submittedAt,
    });
  }

  return feedbacks;
}

export const feedbackDemoData = generateFeedbacks();
