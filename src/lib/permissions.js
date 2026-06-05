// ─────────────────────────────────────────────────────────────────────────────
// RBAC permission catalog. Keys MUST match the API enum (App\Enums\Permission).
// `meta[key]` carries display metadata used by the Permissions UI and audit.
// ─────────────────────────────────────────────────────────────────────────────

export const PERMS = {
  // Batches
  BATCHES_VIEW: 'batches.view',
  BATCHES_EDIT: 'batches.edit',
  BATCHES_COURSES_EDIT: 'batches.courses.edit',
  BATCHES_STUDENTS_EDIT: 'batches.students.edit',
  BATCHES_FREEZE: 'batches.freeze',
  LIVE_CLASS_VIEW: 'liveClass.view',
  LIVE_CLASS_EDIT: 'liveClass.edit',

  // Academics
  COURSES_VIEW: 'courses.view',
  COURSES_EDIT: 'courses.edit',
  COURSE_VIEW_VIEW: 'courseView.view',
  COURSE_AUTHORING_VIEW: 'courseAuthoring.view',
  COURSE_AUTHORING_EDIT: 'courseAuthoring.edit',
  COURSE_AUTHORING_INSTRUCTOR_EDIT: 'courseAuthoring.instructor.edit',
  TEST_SERIES_VIEW: 'testSeries.view',
  TEST_SERIES_EDIT: 'testSeries.edit',
  TEST_SERIES_DELETE: 'testSeries.delete',
  QUIZZES_VIEW: 'quizzes.view',
  QUIZZES_EDIT: 'quizzes.edit',
  QUIZZES_DELETE: 'quizzes.delete',
  QUIZ_AUTHORING_VIEW: 'quizAuthoring.view',
  QUIZ_AUTHORING_EDIT: 'quizAuthoring.edit',
  QUIZ_REPORTS_VIEW: 'quizReports.view',
  QUIZ_REPORTS_REEVALUATE: 'quizReports.reEvaluate',
  QUIZ_REPORTS_EXPORT: 'quizReports.export',
  EXAMS_VIEW: 'exams.view',
  EXAMS_EDIT: 'exams.edit',
  EXAMS_DELETE: 'exams.delete',
  EXAMS_REPORTS_EXPORT: 'exams.reports.export',
  EXAMS_REPORTS_REEVALUATE: 'exams.reports.reEvaluate',
  QUESTION_BANK_VIEW: 'questionBank.view',
  QUESTION_BANK_EDIT: 'questionBank.edit',
  PRACTICE_QUESTIONS_VIEW: 'practiceQuestions.view',
  PRACTICE_QUESTIONS_EDIT: 'practiceQuestions.edit',
  PRACTICE_QUESTIONS_DELETE: 'practiceQuestions.delete',
  VIDEOS_VIEW: 'videos.view',
  VIDEOS_EDIT: 'videos.edit',
  VIDEOS_DELETE: 'videos.delete',
  VIDEO_HOSTING_VIEW: 'videoHosting.view',
  VIDEO_HOSTING_EDIT: 'videoHosting.edit',
  VIDEO_HOSTING_DELETE: 'videoHosting.delete',

  // People
  STUDENTS_VIEW: 'students.view',
  STUDENTS_ENROLL: 'students.enroll',
  STUDENTS_BLACKLIST: 'students.blacklist',
  STUDENT_DETAIL_VIEW: 'studentDetail.view',
  STUDENT_DETAIL_MENTOR_EDIT: 'studentDetail.mentor.edit',
  MENTORS_VIEW: 'mentors.view',
  MENTORS_EDIT: 'mentors.edit',
  MENTORS_DELETE: 'mentors.delete',
  MENTORS_MENTEES_EDIT: 'mentors.mentees.edit',
  INSTRUCTORS_VIEW: 'instructors.view',
  INSTRUCTORS_EDIT: 'instructors.edit',
  INSTRUCTORS_DELETE: 'instructors.delete',
  RESIDENCES_VIEW: 'residences.view',
  RESIDENCES_EDIT: 'residences.edit',
  RESIDENCES_DISABLE: 'residences.disable',
  RESIDENCES_STUDENTS_EDIT: 'residences.students.edit',

  // Commerce
  ORDERS_VIEW: 'orders.view',
  ORDERS_INVOICE_SEND: 'orders.invoice.send',
  ORDERS_INVOICE_DOWNLOAD: 'orders.invoice.download',
  ORDERS_REFUND: 'orders.refund',
  CATALOG_VIEW: 'catalog.view',
  CATALOG_EDIT: 'catalog.edit',

  // Marketing
  LEADS_VIEW: 'leads.view',
  LEADS_EDIT: 'leads.edit',
  LEADS_NOTES_EDIT: 'leads.notes.edit',
  LEADS_EXPORT: 'leads.export',
  BROADCAST_VIEW: 'broadcast.view',
  BROADCAST_SEND: 'broadcast.send',
  WEB_CONTENT_VIEW: 'webContent.view',
  WEB_CONTENT_CODES_EDIT: 'webContent.codes.edit',
  WEB_CONTENT_CODES_REVOKE: 'webContent.codes.revoke',

  // Support
  SUPPORT_VIEW: 'support.view',
  SUPPORT_REPLY: 'support.reply',

  // Tools
  FEEDBACK_VIEW: 'feedback.view',
  FEEDBACK_EXPORT: 'feedback.export',
  SURVEYS_VIEW: 'surveys.view',
  SURVEYS_EDIT: 'surveys.edit',
  SURVEYS_STATUS_EDIT: 'surveys.status.edit',
  SURVEYS_RECALL: 'surveys.recall',
  SURVEYS_RESPONSES_EXPORT: 'surveys.responses.export',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_EXPORT: 'attendance.export',
  ATTENDANCE_MARK: 'attendance.mark',
  ASSETS_VIEW: 'assets.view',
  ASSETS_EDIT: 'assets.edit',
  ASSETS_INVOICE_EDIT: 'assets.invoice.edit',
  ASSETS_EXPORT: 'assets.export',
  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_PAY: 'payouts.pay',
  ICARD_VIEW: 'icard.view',
  ICARD_EDIT: 'icard.edit',

  // Admin / Meta — restricted to SUPER_ADMIN
  ROLES_VIEW: 'roles.view',
  ROLES_EDIT: 'roles.edit',
  PERMISSIONS_ASSIGN: 'permissions.assign',
};

// Optional metadata used by the management UI; not required for permission checks.
export const PERMISSION_META = {
  // High-risk operations get red treatment in the UI matrix.
  highRisk: new Set([
    PERMS.TEST_SERIES_DELETE, PERMS.QUIZZES_DELETE, PERMS.QUIZ_REPORTS_REEVALUATE,
    PERMS.QUIZ_REPORTS_EXPORT, PERMS.EXAMS_DELETE, PERMS.EXAMS_REPORTS_EXPORT,
    PERMS.EXAMS_REPORTS_REEVALUATE, PERMS.PRACTICE_QUESTIONS_DELETE,
    PERMS.VIDEOS_DELETE, PERMS.VIDEO_HOSTING_DELETE, PERMS.STUDENTS_BLACKLIST,
    PERMS.MENTORS_DELETE, PERMS.INSTRUCTORS_DELETE, PERMS.RESIDENCES_DISABLE,
    PERMS.ORDERS_REFUND, PERMS.LEADS_EXPORT, PERMS.BROADCAST_SEND,
    PERMS.WEB_CONTENT_CODES_REVOKE, PERMS.FEEDBACK_EXPORT, PERMS.SURVEYS_RECALL,
    PERMS.SURVEYS_RESPONSES_EXPORT, PERMS.ATTENDANCE_EXPORT, PERMS.ASSETS_EXPORT,
    PERMS.PAYOUTS_PAY,
  ]),
};

// `has(perms, key)` — returns true for SUPER_ADMIN wildcard or exact match.
export function has(perms, key) {
  if (!perms) return false;
  if (perms === '*' || (Array.isArray(perms) && perms.includes('*'))) return true;
  return Array.isArray(perms) ? perms.includes(key) : false;
}

// `hasAny(perms, [...keys])`
export function hasAny(perms, keys) {
  if (!perms) return false;
  if (perms === '*' || (Array.isArray(perms) && perms.includes('*'))) return true;
  if (!Array.isArray(perms) || !Array.isArray(keys)) return false;
  return keys.some((k) => perms.includes(k));
}

// `hasAll(perms, [...keys])`
export function hasAll(perms, keys) {
  if (!perms) return false;
  if (perms === '*' || (Array.isArray(perms) && perms.includes('*'))) return true;
  if (!Array.isArray(perms) || !Array.isArray(keys)) return false;
  return keys.every((k) => perms.includes(k));
}
