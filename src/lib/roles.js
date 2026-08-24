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
      '/landing',
      '/candidate-profile', '/candidate-detail',
      '/orders', '/payments', '/commerce-reports',
      '/courses-list', '/course-view', '/course-management', '/catalog', '/video-content', '/bunny-admin', '/class-notes',
      '/quiz-listing', '/quiz-creation', '/quiz-attempt-report', '/question-bank', '/practice-questions',
      '/exam-listing', '/exam-creation-wizard', '/exam-attempt-report', '/test-series-list',
      '/mentor-profiles', '/mentor-sessions', '/instructor-portfolio',
      '/leads-management', '/batch',
      '/residences',
      '/offline-attendance',
      '/assets',
    ],
  },
  content_manager: {
    label: 'Content Manager',
    badgeColor: '#0891b2',
    paths: [
      '/landing',
      '/courses-list', '/course-view', '/course-management', '/catalog',
      '/video-content', '/bunny-admin', '/class-notes',
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
      '/landing',
      '/courses-list', '/course-view',
      '/quiz-listing', '/quiz-attempt-report',
      '/exam-listing', '/exam-attempt-report',
    ],
  },
  mentor: {
    label: 'Mentor',
    badgeColor: '#d97706',
    paths: [
      '/landing',
      '/candidate-profile', '/candidate-detail',
      '/mentor-profiles', '/mentor-sessions',
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

// Returns true if the given user is a SUPER_ADMIN.
// Accepts both the legacy lowercase `role` string and the new RBAC `roles` array.
export function isSuperAdmin(user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes('SUPER_ADMIN')) return true;
  if (typeof user.role === 'string' && user.role.toLowerCase() === 'super_admin') return true;
  return false;
}

// Returns null (all paths) or string[] of allowed paths for the role
export function getAllowedPaths(role) {
  if (!role || !ROLES[role]) return [];
  const allowed = ROLES[role].paths;
  return allowed === '*' ? null : allowed;
}
