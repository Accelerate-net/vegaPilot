export const questionBankDemo = [
  { questionId: 1000, questionDisplayKey: 'QB-1000', subject: 'Physics', chapter: 'Mechanics', questionType: 'MCQ', level: 1, classificationLevel1: 1, classificationLevel2: 61, answerValue: 'B', averageTimeToSolveProblem: 45 },
  { questionId: 1001, questionDisplayKey: 'QB-1001', subject: 'Physics', chapter: 'Waves', questionType: 'MCQ', level: 2, classificationLevel1: 1, classificationLevel2: 62, answerValue: 'A', averageTimeToSolveProblem: 40 },
  { questionId: 1002, questionDisplayKey: 'QB-1002', subject: 'Chemistry', chapter: 'Organic', questionType: 'MCQ', level: 2, classificationLevel1: 2, classificationLevel2: 63, answerValue: 'C', averageTimeToSolveProblem: 55 },
  { questionId: 1003, questionDisplayKey: 'QB-1003', subject: 'Chemistry', chapter: 'Physical', questionType: 'Integer', level: 3, classificationLevel1: 2, classificationLevel2: 64, answerValue: 'D', averageTimeToSolveProblem: 65 },
  { questionId: 1004, questionDisplayKey: 'QB-1004', subject: 'Mathematics', chapter: 'Calculus', questionType: 'MCQ', level: 2, classificationLevel1: 3, classificationLevel2: 65, answerValue: 'B', averageTimeToSolveProblem: 50 },
  { questionId: 1005, questionDisplayKey: 'QB-1005', subject: 'Mathematics', chapter: 'Algebra', questionType: 'MCQ', level: 1, classificationLevel1: 3, classificationLevel2: 66, answerValue: 'A', averageTimeToSolveProblem: 35 },
  { questionId: 1006, questionDisplayKey: 'QB-1006', subject: 'Biology', chapter: 'Cell Biology', questionType: 'MCQ', level: 1, classificationLevel1: 4, classificationLevel2: 67, answerValue: 'C', averageTimeToSolveProblem: 30 },
  { questionId: 1007, questionDisplayKey: 'QB-1007', subject: 'Biology', chapter: 'Genetics', questionType: 'MCQ', level: 3, classificationLevel1: 4, classificationLevel2: 68, answerValue: 'D', averageTimeToSolveProblem: 60 },
  { questionId: 1008, questionDisplayKey: 'QB-1008', subject: 'Physics', chapter: 'Thermodynamics', questionType: 'MCQ', level: 2, classificationLevel1: 1, classificationLevel2: 69, answerValue: 'B', averageTimeToSolveProblem: 48 },
  { questionId: 1009, questionDisplayKey: 'QB-1009', subject: 'Chemistry', chapter: 'Inorganic', questionType: 'MCQ', level: 1, classificationLevel1: 2, classificationLevel2: 70, answerValue: 'A', averageTimeToSolveProblem: 32 },
  { questionId: 1010, questionDisplayKey: 'QB-1010', subject: 'Mathematics', chapter: 'Coordinate Geometry', questionType: 'MCQ', level: 3, classificationLevel1: 3, classificationLevel2: 71, answerValue: 'C', averageTimeToSolveProblem: 58 },
  { questionId: 1011, questionDisplayKey: 'QB-1011', subject: 'Biology', chapter: 'Human Physiology', questionType: 'MCQ', level: 2, classificationLevel1: 4, classificationLevel2: 72, answerValue: 'D', averageTimeToSolveProblem: 42 },
];

export const practiceQuestionsDemo = questionBankDemo.map((question, index) => ({
  id: `PQ-${question.questionId}`,
  uuid: `practice-${question.questionId}`,
  batchId: `BUNDLE-${String(Math.floor(index / 3) + 1).padStart(3, '0')}`,
  title: `${question.subject} - ${question.chapter}`,
  questionId: question.questionId,
  answerType: question.questionType,
  correctAnswer: question.answerValue,
  level: ['Easy', 'Medium', 'Hard'][Math.min(question.level - 1, 2)],
  createdAt: Date.now() - index * 86400000,
  isCustom: false,
}));
