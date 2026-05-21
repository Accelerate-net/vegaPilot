import { api } from './api';

const BASE = '/restricted/feedback';

export const FEEDBACK_TYPE = {
  COURSE: 'COURSE',
  EXAM: 'EXAM',
  MODULE: 'MODULE',
  CHAPTER: 'CHAPTER',
};

function ensureOk(body) {
  if (body && body.success === false) {
    const err = body.error || {};
    const e = new Error(err.message || 'Request failed');
    e.code = err.code;
    e.fields = err.fields;
    e.envelope = body;
    throw e;
  }
  return body;
}

function clean(params) {
  const out = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });
  return out;
}

export async function listFeedback({
  page = 1,
  size = 20,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
  filterBy,
  searchKey,
  type,
  courseId,
  moduleId,
  chapterId,
} = {}) {
  const { data } = await api.get(`${BASE}/list`, {
    params: clean({ page, size, sortBy, sortOrder, filterBy, searchKey, type, courseId, moduleId, chapterId }),
  });
  return ensureOk(data);
}

export async function feedbackSummary({ type, sortBy = 'rating', sortOrder = 'DESC', page = 1, limit = 20 } = {}) {
  const { data } = await api.get(`${BASE}/summary`, {
    params: clean({ type, sortBy, sortOrder, page, limit }),
  });
  return ensureOk(data);
}
