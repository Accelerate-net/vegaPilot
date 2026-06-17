import { api } from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Quiz API client.
//
// Talks to the `quiz` backend module that creates and manages quizzes built from
// practice-question batches. Base path resolves to `<origin>/api/restricted/quiz`
// — the shared `api` axios instance already prefixes `/api` and injects
// X-Access-Token.
//
// Envelopes follow the house contract: error `{ error: { code, message, details } }`.
// axios rejects on non-2xx, so callers run the error through `quizError()`.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/restricted/quiz';

export function quizError(err) {
  const env = err?.response?.data?.error;
  return {
    status: err?.response?.status,
    code: env?.code || 'SERVER_ERROR',
    message: env?.message || err?.message || 'Request failed',
    fields: env?.details?.fields || null,
  };
}

// POST /api/restricted/quiz/create
// body: {
//   title, brief, terms, duration, totalQuestions, markingScheme,
//   challengeQuestionAllowed, multipleAttemptsAllowed, uniqueID,
//   quizLimitedToBatches: [], scheduledStart, scheduledEnd,
//   questionsData: [{ o, qi, ms }]
// }
export async function createQuiz(body) {
  const { data } = await api.post(`${BASE}/create`, body);
  return data?.data ?? data;
}
