// Demo data for the Class Notes page — used as a graceful fallback when the
// classnotes backend module is unreachable (local preview, module not deployed).
// Bunny objects are named by checksum (`<sha256>.pdf`); `displayName` is the
// admin-entered Title. Shapes mirror the normalized rows from `src/lib/classNotesApi.js`.

export const CLASS_NOTES_DEMO_BATCHES = [
  { id: 'b1', name: 'IAT 2026 Morning' },
  { id: 'b2', name: 'IAT 2026 Evening' },
  { id: 'b3', name: 'NEET 2026 Repeaters' },
  { id: 'b4', name: 'IAT 2027 Foundation' },
  { id: 'b5', name: 'NEET 2027 Regular' },
];

export const CLASS_NOTES_DEMO_COURSES = [
  { id: '70001', code: 'CR0001', title: 'IAT 2026 – Exclusive 1 Year Course' },
  { id: '70002', code: 'CR0002', title: 'IAT 2026 - Test Series' },
  { id: '70003', code: 'CR0003', title: 'Foundation Physics 2026' },
];

export const CLASS_NOTES_DEMO = [
  {
    id: 9001,
    chapterId: 1,
    chapterTitle: 'The Living World',
    subject: 'Biology',
    fileName: '9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa.pdf',
    displayName: 'The_Living_World_Notes',
    fileUrl: 'https://vega-pilot.b-cdn.net/class-notes/9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa.pdf',
    fileSize: 482304,
    checksumSha256: '9f2c8a41d7be03165a2c9d84f0ab7c11e6d2b93805f4c7ae12d90b6634c8e1aa',
    batches: [{ id: 'b1', name: 'IAT 2026 Morning' }, { id: 'b2', name: 'IAT 2026 Evening' }],
    courses: [{ id: '70001', title: 'IAT 2026 – Exclusive 1 Year Course' }],
    uploadedOn: 1755468000,
  },
  {
    id: 9002,
    chapterId: 34,
    chapterTitle: 'Structure of Atom',
    subject: 'Chemistry',
    fileName: '4d1e0a7b93c25f8e610b2a4d9c7e35f18a06b4d2c9e17f503b8a6d41e2c90577.pdf',
    displayName: 'Structure_Of_Atom_Summary',
    fileUrl: 'https://vega-pilot.b-cdn.net/class-notes/4d1e0a7b93c25f8e610b2a4d9c7e35f18a06b4d2c9e17f503b8a6d41e2c90577.pdf',
    fileSize: 1961984,
    checksumSha256: '4d1e0a7b93c25f8e610b2a4d9c7e35f18a06b4d2c9e17f503b8a6d41e2c90577',
    batches: [{ id: 'b3', name: 'NEET 2026 Repeaters' }],
    courses: [{ id: '70001', title: 'IAT 2026 – Exclusive 1 Year Course' }, { id: '70002', title: 'IAT 2026 - Test Series' }],
    uploadedOn: 1754949600,
  },
  {
    id: 9003,
    chapterId: 80,
    chapterTitle: 'Units and Measurement',
    subject: 'Physics',
    fileName: 'c7a94e21f05d38b6a1e8d40c72f9b5631d0e8a72b45c91f6e3d20a8574c6b933.pdf',
    displayName: 'Units_And_Measurement_Full_Notes',
    fileUrl: 'https://vega-pilot.b-cdn.net/class-notes/c7a94e21f05d38b6a1e8d40c72f9b5631d0e8a72b45c91f6e3d20a8574c6b933.pdf',
    fileSize: 5017600,
    checksumSha256: 'c7a94e21f05d38b6a1e8d40c72f9b5631d0e8a72b45c91f6e3d20a8574c6b933',
    batches: [{ id: 'b1', name: 'IAT 2026 Morning' }, { id: 'b4', name: 'IAT 2027 Foundation' }, { id: 'b5', name: 'NEET 2027 Regular' }],
    courses: [{ id: '70003', title: 'Foundation Physics 2026' }],
    uploadedOn: 1754344800,
  },
  {
    id: 9004,
    chapterId: 52,
    chapterTitle: 'Sets',
    subject: 'Mathematics',
    fileName: 'e8b52d90a37f14c6d2905e8ba61c47f3820d9b5e14a7c30f68d1e94b27a5c044.pdf',
    displayName: 'Sets_Practice_Sheet',
    fileUrl: 'https://vega-pilot.b-cdn.net/class-notes/e8b52d90a37f14c6d2905e8ba61c47f3820d9b5e14a7c30f68d1e94b27a5c044.pdf',
    fileSize: 314368,
    checksumSha256: 'e8b52d90a37f14c6d2905e8ba61c47f3820d9b5e14a7c30f68d1e94b27a5c044',
    batches: [{ id: 'b2', name: 'IAT 2026 Evening' }],
    courses: [{ id: '70001', title: 'IAT 2026 – Exclusive 1 Year Course' }],
    uploadedOn: 1753660800,
  },
];
