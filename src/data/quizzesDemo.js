export const publishedQuizzesDemo = [
  { id: 9001, title: 'Cell Biology Practice Quiz', description: 'MCQ quiz for Cell Biology chapter', status: 'published', duration: 30, maximumMarks: 60, createdOn: 1742333501, attempts: [] },
  { id: 9002, title: 'Organic Chemistry Drill', description: 'Rapid revision quiz for organic chemistry', status: 'published', duration: 20, maximumMarks: 40, createdOn: 1742333502, attempts: [] },
];

export const draftQuizzesDemo = [
  { id: 9010, title: 'Wave Motion Checkpoint', description: 'Draft quiz for wave motion practice', status: 'draft', duration: 25, maximumMarks: 50, createdOn: 1742333510, attempts: [] },
];

export function withSampleAttempts(quizzes) {
  const students = [
    { name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com' },
    { name: 'Priya Sharma', email: 'priya.sharma@example.com' },
    { name: 'Amit Patel', email: 'amit.patel@example.com' },
  ];
  return quizzes.map((quiz, index) => ({
    ...quiz,
    attempts: quiz.attempts?.length
      ? quiz.attempts
      : students.slice(0, (index % 3) + 1).map((student, attemptIndex) => ({
          studentName: student.name,
          studentEmail: student.email,
          status: attemptIndex % 2 === 0 ? 'completed' : 'in-progress',
          startedAt: Date.now() - (attemptIndex + 1) * 86400000,
          completedAt: attemptIndex % 2 === 0 ? Date.now() - attemptIndex * 43200000 : null,
          score: attemptIndex % 2 === 0 ? Math.floor((quiz.maximumMarks || 50) * 0.7) : null,
        })),
  }));
}
