// ─── Role definitions ─────────────────────────────────────────────────────────
// paths: '*' means access to all screens
// paths: string[]  means access only to those paths

export const ROLES = {
  super_admin: {
    label: 'Super Admin',
    badgeColor: '#7c3aed',
    paths: '*',
  },
  admin: {
    label: 'Admin',
    badgeColor: '#006073',
    paths: [
      '/candidate-profile', '/candidate-detail',
      '/orders',
      '/courses-list', '/course-view', '/course-management', '/catalog', '/video-content', '/bunny-admin',
      '/quiz-listing', '/quiz-creation', '/quiz-attempt-report', '/question-bank', '/practice-questions',
      '/exam-listing', '/exam-creation-wizard', '/exam-attempt-report', '/test-series-list',
      '/mentor-profiles', '/instructor-portfolio',
      '/leads-management', '/batch',
    ],
  },
  content_manager: {
    label: 'Content Manager',
    badgeColor: '#0891b2',
    paths: [
      '/courses-list', '/course-view', '/course-management', '/catalog',
      '/video-content', '/bunny-admin',
      '/question-bank', '/practice-questions',
      '/quiz-listing', '/quiz-creation', '/quiz-attempt-report',
      '/exam-listing', '/exam-creation-wizard', '/exam-attempt-report',
      '/test-series-list',
    ],
  },
  instructor: {
    label: 'Instructor',
    badgeColor: '#059669',
    paths: [
      '/courses-list', '/course-view',
      '/quiz-listing', '/quiz-attempt-report',
      '/exam-listing', '/exam-attempt-report',
    ],
  },
  mentor: {
    label: 'Mentor',
    badgeColor: '#d97706',
    paths: [
      '/candidate-profile', '/candidate-detail',
      '/mentor-profiles',
    ],
  },
};

// Returns true if the role can access the given path
export function canAccess(role, path) {
  if (!role || !ROLES[role]) return false;
  const allowed = ROLES[role].paths;
  if (allowed === '*') return true;
  return allowed.includes(path);
}

// Returns null (all paths) or string[] of allowed paths for the role
export function getAllowedPaths(role) {
  if (!role || !ROLES[role]) return [];
  const allowed = ROLES[role].paths;
  return allowed === '*' ? null : allowed;
}
