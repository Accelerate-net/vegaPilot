export const courseViewDemo = {
  code: 'CR0001',
  title: 'IAT 2026 – Exclusive 1 Year Course',
  description: 'Comprehensive preparation bundle for IISER Aptitude Test with structured subjects, chapters, and parts.',
  instructor: 'Expert Faculty Team',
  rating: 4.9,
  totalStudents: 450,
  segments: [
    {
      id: '1',
      title: 'Foundation',
      modules: [
        {
          id: '1',
          name: 'Biology',
          description: 'Core biology concepts for IAT preparation',
          chapters: [
            {
              id: '1',
              name: 'Cell Biology Fundamentals',
              description: 'Introduction to cell structure and function',
              parts: [
                { id: '0', title: 'Course Overview', type: 'VIDEO', duration: 520, summary: 'Orientation and roadmap for this chapter.' },
                { id: '1', title: 'Cell Structure Explained', type: 'VIDEO', duration: 1380, summary: 'Detailed lecture on cell organelles.' },
                { id: '2', title: 'Chapter Notes PDF', type: 'MATERIAL', duration: 0, summary: 'Downloadable revision notes.' },
                { id: '3', title: 'Cell Biology Quiz', type: 'QUIZ', duration: 900, summary: 'Chapter assessment with 15 questions.' },
              ],
            },
            {
              id: '2',
              name: 'Genetics and Evolution',
              description: 'Inheritance, genes, and evolution',
              parts: [
                { id: '0', title: 'Genetics Overview', type: 'VIDEO', duration: 640, summary: 'Intro to genetics topics.' },
                { id: '1', title: 'Mendelian Inheritance', type: 'VIDEO', duration: 1440, summary: 'Core inheritance laws and examples.' },
                { id: '2', title: 'Evolution Practice Sheet', type: 'MATERIAL', duration: 0, summary: 'Worksheet for revision.' },
              ],
            },
          ],
        },
        {
          id: '2',
          name: 'Chemistry',
          description: 'Physical and organic chemistry essentials',
          chapters: [
            {
              id: '1',
              name: 'Organic Chemistry Basics',
              description: 'Chemical bonding and organic reactions',
              parts: [
                { id: '0', title: 'Organic Intro', type: 'VIDEO', duration: 780, summary: 'Introduction to organic chemistry.' },
                { id: '1', title: 'Reaction Mechanisms', type: 'VIDEO', duration: 1660, summary: 'Mechanisms with solved examples.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: '2',
      title: 'Advanced',
      modules: [
        {
          id: '3',
          name: 'Physics',
          description: 'Mechanics and modern physics',
          chapters: [
            {
              id: '1',
              name: 'Classical Mechanics',
              description: 'Motion, force, and energy',
              parts: [
                { id: '0', title: 'Mechanics Warmup', type: 'VIDEO', duration: 900, summary: 'Key formulas and concepts.' },
                { id: '1', title: 'Newton Laws Deep Dive', type: 'VIDEO', duration: 1710, summary: 'Applied mechanics examples.' },
              ],
            },
          ],
        },
        {
          id: '4',
          name: 'Mathematics',
          description: 'Calculus and algebra for science',
          chapters: [
            {
              id: '1',
              name: 'Calculus Fundamentals',
              description: 'Differentiation and integration',
              parts: [
                { id: '0', title: 'Calculus Primer', type: 'VIDEO', duration: 840, summary: 'Limits and continuity.' },
                { id: '1', title: 'Differentiation Toolkit', type: 'VIDEO', duration: 1530, summary: 'Rules and worked examples.' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
