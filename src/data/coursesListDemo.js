export const demoCourses = [
  {
    id: 70001,
    code: 'CR0001',
    title: 'IAT 2026 – Exclusive 1 Year Course',
    category: 'IAT',
    modulesList: ['Physics', 'Chemistry', 'Mathematics'],
    totalModules: 3,
    totalChapters: 42,
    totalDuration: '128h 30m',
    status: 'Active',
    totalStudents: 186,
    instructor: 'Arjun Mehta',
    rating: 4.9,
  },
  {
    id: 70002,
    code: 'CR0002',
    title: 'IAT 2026 - Test Series',
    category: 'Test Series',
    modulesList: ['Full Tests', 'Topic Tests'],
    totalModules: 2,
    totalChapters: 18,
    totalDuration: '48h 00m',
    status: 'Draft',
    totalStudents: 92,
    instructor: 'Divya Krishnan',
    rating: 4.6,
  },
  {
    id: 70003,
    code: 'CR0003',
    title: 'Foundation Physics 2026',
    category: 'Foundation',
    modulesList: ['Mechanics', 'Waves', 'Optics'],
    totalModules: 3,
    totalChapters: 27,
    totalDuration: '72h 10m',
    status: 'Active',
    totalStudents: 134,
    instructor: 'Siddharth Bose',
    rating: 4.7,
  },
];

export const demoCourseStudents = {
  CR0001: [
    { id: 'CAND-2026-001', name: 'Aarav Nair', email: 'aarav.nair@example.com', phone: '+91 98765 43210', enrollmentDate: 1736640000000, enrollmentStatusText: 'Active', status: 'active' },
    { id: 'CAND-2026-002', name: 'Diya Joseph', email: 'diya.joseph@example.com', phone: '+91 91234 56780', enrollmentDate: 1732233600000, enrollmentStatusText: 'Active', status: 'active' },
    { id: 'CAND-2026-004', name: 'Sneha Menon', email: 'sneha.menon@example.com', phone: '+91 90012 34098', enrollmentDate: 1738972800000, enrollmentStatusText: 'Active', status: 'active' },
  ],
  CR0002: [
    { id: 'CAND-2026-001', name: 'Aarav Nair', email: 'aarav.nair@example.com', phone: '+91 98765 43210', enrollmentDate: 1738041600000, enrollmentStatusText: 'Active', status: 'active' },
  ],
  CR0003: [
    { id: 'CAND-2026-006', name: 'Meera Krishnan', email: 'meera.krishnan@example.com', phone: '+91 93456 78901', enrollmentDate: 1740787200000, enrollmentStatusText: 'Active', status: 'active' },
  ],
};
