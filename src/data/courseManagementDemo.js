export const courseManagementDemo = {
  bundles: [
    { id: 70001, title: 'IAT Complete Science Bundle', displayKey: 'IAT-SCIENCE', active: 1, modulesIncluded: ['1', '2', '3', '4'], description: 'Complete science curriculum for IAT.' },
    { id: 70002, title: 'NEET Biology Fast Track', displayKey: 'NEET-BIO', active: 1, modulesIncluded: ['1'], description: 'Focused biology preparation bundle.' },
  ],
  modules: [
    { moduleKey: '1', title: 'Biology', description: 'Study of living organisms', subjectArea: 'Science', difficultyLevel: 'Beginner', active: 1 },
    { moduleKey: '2', title: 'Chemistry', description: 'Study of matter and reactions', subjectArea: 'Science', difficultyLevel: 'Beginner', active: 1 },
    { moduleKey: '3', title: 'Physics', description: 'Study of matter and energy', subjectArea: 'Science', difficultyLevel: 'Intermediate', active: 1 },
    { moduleKey: '4', title: 'Mathematics', description: 'Numbers, algebra, and calculus', subjectArea: 'Mathematics', difficultyLevel: 'Intermediate', active: 1 },
  ],
  chapters: [
    { id: 100, moduleCode: '1', code: 'BIO-01', title: 'Cell Biology', label: 'Biology Chapter 1', status: 1, partsIncluded: [{ type: 'VIDEO', title: 'Cell Membrane Lecture' }, { type: 'QUIZ', title: 'Cell Biology Quiz' }] },
    { id: 101, moduleCode: '2', code: 'CHEM-01', title: 'Organic Chemistry', label: 'Chemistry Chapter 1', status: 1, partsIncluded: [{ type: 'VIDEO', title: 'Hydrocarbons Lecture' }, { type: 'MATERIAL', title: 'Revision Notes PDF' }] },
  ],
  syllabi: [
    { id: 'SYL-1', title: 'IAT 2026 Syllabus', segments: [{ id: '1', modules: 4, chapters: 18 }] },
    { id: 'SYL-2', title: 'NEET 2026 Syllabus', segments: [{ id: '1', modules: 3, chapters: 14 }] },
  ],
  teachers: [
    { id: 'T1', name: 'Arjun Mehta', specialization: 'Mathematics', institution: 'IISER Pune' },
    { id: 'T2', name: 'Divya Krishnan', specialization: 'Physics', institution: 'IISER Kolkata' },
  ],
};
