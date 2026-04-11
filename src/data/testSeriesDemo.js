export const testSeriesDemo = [
  {
    id: 1,
    name: 'IAT 2026 - Full Mock Tests',
    description: 'Complete mock test series for IISER Aptitude Test 2026 with full-length exams.',
    status: 1,
    exams: [
      { examId: 50000, examTitle: 'IAT Mock Test - 1', accessType: 'free' },
      { examId: 50001, examTitle: 'JEE Main Practice Test - Physics', accessType: 'premium' },
    ],
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2025-11-20T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'NEET Subject Drill Pack',
    description: 'Focused test series for Biology-heavy revision weeks.',
    status: 0,
    exams: [
      { examId: 50002, examTitle: 'NEET Biology Mock Test', accessType: 'premium' },
    ],
    createdAt: '2025-10-15T10:00:00.000Z',
    updatedAt: '2025-10-15T10:00:00.000Z',
  },
];
