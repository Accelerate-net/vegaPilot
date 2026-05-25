// Schedules store backed by the live API. Holds two pieces of state —
// schedules and lookups — with subscriber-based React bindings.
// Mutations are async and call the API in src/lib/schedulesApi.js. The
// store still exposes the optimistic helpers (findEventOverlaps,
// findBatchConflicts) the page modals use to surface inline conflict
// hints; the canonical truth always comes from the server's 409s.

import { useSyncExternalStore } from 'react';
import * as schedulesApi from './schedulesApi';

// ─── Type / icon palette ───────────────────────────────────────────────
// Unified palette + icon: every event maps to one of three categories.
// CLASSES → violet + projector/board icon
// EXAMS   → red + notepad/clipboard icon
// LIVE    → green + video camera icon
const CLASS_STYLE = { color: '#7c3aed', soft: '#ede9fe', icon: 'ti-blackboard' };
const EXAM_STYLE  = { color: '#be123c', soft: '#ffe4e6', icon: 'ti-clipboard' };
const LIVE_STYLE  = { color: '#a16207', soft: '#fef3c7', icon: 'ti-video-camera' };

export const EVENT_TYPES = {
  CLASSROOM_LECTURE: { id: 'CLASSROOM_LECTURE', label: 'Classroom Lecture', ...CLASS_STYLE },
  RECORDED_LECTURE:  { id: 'RECORDED_LECTURE',  label: 'Recorded Lecture',  ...CLASS_STYLE },
  DISCUSSION:        { id: 'DISCUSSION',        label: 'Discussion',        ...CLASS_STYLE },
  ONLINE_EXAM:       { id: 'ONLINE_EXAM',       label: 'Online Exam',       ...EXAM_STYLE  },
  OFFLINE_EXAM:      { id: 'OFFLINE_EXAM',      label: 'Offline Exam',      ...EXAM_STYLE  },
  ONLINE_QUIZ:       { id: 'ONLINE_QUIZ',       label: 'Online Quiz',       ...EXAM_STYLE  },
  LIVE_STREAM:       { id: 'LIVE_STREAM',       label: 'Live Stream',       ...LIVE_STYLE  },
};

// Event types whose body references shared content. Repeating or copying
// them across days replicates the same content reference and requires
// explicit confirmation.
export const CONTENT_BOUND_TYPES = new Set(['ONLINE_EXAM', 'ONLINE_QUIZ', 'RECORDED_LECTURE']);

// Summary categories (CLASSES / EXAMS / LIVE) — used by both the list
// page row summary and the split-day column headers.
export const SUMMARY_CATEGORIES = [
  { key: 'CLASSES', label: 'Classes', color: '#c4b5fd', types: ['CLASSROOM_LECTURE', 'RECORDED_LECTURE', 'DISCUSSION'] },
  { key: 'EXAMS',   label: 'Exams',   color: '#f87171', types: ['ONLINE_EXAM', 'OFFLINE_EXAM', 'ONLINE_QUIZ'] },
  { key: 'LIVE',    label: 'Live',    color: '#fcd34d', types: ['LIVE_STREAM'] },
];

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_INIT  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Date helpers ──────────────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, '0'); }
export function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function sameDay(a, b) { return dateKey(a) === dateKey(b); }
export function startOfWeek(d, mondayStart = true) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = mondayStart ? (day === 0 ? -6 : 1 - day) : -day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function minutesToLabel(m) {
  const h = Math.floor(m / 60); const mm = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
  return `${h12}:${pad(mm)} ${ampm}`;
}
export function minutesToInput(m) { return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
export function inputToMinutes(s) { if (!s) return 0; const [h, m] = s.split(':').map(Number); return h * 60 + m; }

export const SLOT_MIN = 5;
export function clampMin(m) { return Math.max(0, Math.min(24 * 60 - SLOT_MIN, Math.round(m / SLOT_MIN) * SLOT_MIN)); }
export function uid(prefix) { return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; }
export function prettyDate(k) {
  const d = parseKey(k);
  return `${WEEKDAY_SHORT[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}
export function arraysEqualUnordered(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(); const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function categorizeEvents(events) {
  const totals = { CLASSES: 0, EXAMS: 0, LIVE: 0 };
  for (const e of events) {
    // Accept either normalized `start`/`end` or raw `start_min`/`end_min`.
    const start = e.start ?? e.start_min ?? 0;
    const end   = e.end   ?? e.end_min   ?? 0;
    const dur = Math.max(0, end - start);
    for (const cat of SUMMARY_CATEGORIES) {
      if (cat.types.includes(e.type)) { totals[cat.key] += dur; break; }
    }
  }
  return totals;
}

export function fmtCompactDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Lookup-resolver helpers ───────────────────────────────────────────
// Used by event tile detail lines, the recurrence-confirmation modal, etc.
// They walk the lookups graph from the latest snapshot so callers can stay
// synchronous.
export function findExamRef(examId) {
  if (!examId) return null;
  for (const ts of _lookups.test_series || []) {
    const ex = (ts.exams || []).find((e) => String(e.id) === String(examId));
    if (ex) return { seriesId: ts.id, seriesName: ts.name, examId: ex.id, examName: ex.name };
  }
  return null;
}
export function findQuizRef(quizId) {
  if (!quizId) return null;
  const q = (_lookups.quizzes || []).find((x) => String(x.id) === String(quizId));
  return q ? { quizId: q.id, quizName: q.name } : null;
}
export function findChapterRef(courseId, moduleId, chapterId) {
  if (!courseId || !moduleId || !chapterId) return null;
  const course = (_lookups.courses || []).find((c) => String(c.id) === String(courseId));
  if (!course) return null;
  const mod = (course.modules || []).find((m) => String(m.id) === String(moduleId));
  if (!mod) return null;
  const ch = (mod.chapters || []).find((c) => String(c.id) === String(chapterId));
  if (!ch) return null;
  return { courseName: course.name, moduleName: mod.name, chapterName: ch.name };
}

// ─── Local optimistic invariants ───────────────────────────────────────
// These mirror the server checks and let the modals show inline hints
// before the user submits. The server has the final say via 409s.
export function findEventOverlaps(events, candidate, excludeId = null) {
  return events.filter((e) =>
    e.id !== excludeId &&
    candidate.start < e.end &&
    candidate.end > e.start
  );
}
export function findBatchConflicts({ excludeId = null, date, batchIds }) {
  const out = [];
  for (const bId of batchIds || []) {
    const c = _schedules.find((s) =>
      s.id !== excludeId &&
      s.date === date &&
      (s.batches || []).some((b) => String(b.id) === String(bId))
    );
    if (c) out.push({ batchId: bId, scheduleId: c.id, scheduleName: c.name, published: c.published });
  }
  return out;
}

// ─── Subscriber stores ────────────────────────────────────────────────
let _schedules = [];
let _lookups = {
  batches: [], instructors: [], venues: [],
  test_series: [], quizzes: [], courses: [],
};
let _lookupsLoaded = false;
const _schedListeners = new Set();
const _lookupListeners = new Set();

function notifySchedules() { _schedListeners.forEach((cb) => cb(_schedules)); }
function notifyLookups()   { _lookupListeners.forEach((cb) => cb(_lookups)); }

export function getSchedules() { return _schedules; }
export function getLookups()   { return _lookups; }
export function isLookupsLoaded() { return _lookupsLoaded; }

export function useSchedules() {
  return useSyncExternalStore(
    (cb) => { _schedListeners.add(cb); return () => _schedListeners.delete(cb); },
    () => _schedules,
    () => _schedules,
  );
}
export function useLookups() {
  return useSyncExternalStore(
    (cb) => { _lookupListeners.add(cb); return () => _lookupListeners.delete(cb); },
    () => _lookups,
    () => _lookups,
  );
}

// ─── API-shape ↔ FE-shape normalizers ─────────────────────────────────
// API uses snake_case + `start_min`/`end_min`. The rest of the FE was
// written against camelCase + `start`/`end`. Normalize at the boundary
// so existing components don't have to change accessors.
export function normalizeEvent(e) {
  if (!e) return e;
  return {
    id:         e.id,
    title:      e.title,
    type:       e.type,
    start:      e.start_min ?? e.start ?? 0,
    end:        e.end_min   ?? e.end   ?? 0,
    instructor: e.instructor ?? null,
    venue:      e.venue ?? null,
    examId:     e.exam_id   ?? e.examId   ?? null,
    quizId:     e.quiz_id   ?? e.quizId   ?? null,
    courseId:   e.course_id ?? e.courseId ?? null,
    moduleId:   e.module_id ?? e.moduleId ?? null,
    chapterId:  e.chapter_id ?? e.chapterId ?? null,
  };
}
export function denormalizeEvent(e) {
  return {
    title:      e.title,
    type:       e.type,
    start_min:  e.start,
    end_min:    e.end,
    instructor: e.instructor ?? null,
    venue:      e.venue ?? null,
    exam_id:    e.examId    ?? null,
    quiz_id:    e.quizId    ?? null,
    course_id:  e.courseId  ?? null,
    module_id:  e.moduleId  ?? null,
    chapter_id: e.chapterId ?? null,
  };
}
function normalizeSchedule(s) {
  if (!s) return s;
  return {
    ...s,
    batches: Array.isArray(s.batches) ? s.batches : [],
    events: Array.isArray(s.events) ? s.events.map(normalizeEvent) : [],
  };
}

// ─── Internal: schedule list updates ──────────────────────────────────
// Merge a freshly-fetched schedule (or schedule array) into the store.
function upsertSchedule(s) {
  const n = normalizeSchedule(s);
  if (!n) return;
  const idx = _schedules.findIndex((x) => x.id === n.id);
  if (idx >= 0) _schedules = _schedules.map((x, i) => i === idx ? n : x);
  else _schedules = [..._schedules, n];
  notifySchedules();
}
function upsertSchedules(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return;
  const map = new Map(_schedules.map((s) => [s.id, s]));
  for (const s of arr) map.set(s.id, normalizeSchedule(s));
  _schedules = Array.from(map.values());
  notifySchedules();
}
function removeSchedule(id) {
  _schedules = _schedules.filter((s) => s.id !== id);
  notifySchedules();
}

// Replace the working set of schedules. Used after a windowed fetch.
function replaceSchedulesInRange(from, to, fetched) {
  // Keep schedules outside the [from, to] window so deep-linked focus
  // detail pages don't disappear when the user changes the visible range.
  const out = _schedules.filter((s) => s.date < from || s.date > to);
  _schedules = [...out, ...fetched];
  notifySchedules();
}

// ─── Loaders ──────────────────────────────────────────────────────────
export async function loadLookups({ force = false } = {}) {
  if (_lookupsLoaded && !force) return _lookups;
  const data = await schedulesApi.fetchLookups();
  _lookups = {
    batches:     data?.batches     || [],
    instructors: data?.instructors || [],
    venues:      data?.venues      || [],
    test_series: data?.test_series || [],
    quizzes:     data?.quizzes     || [],
    courses:     data?.courses     || [],
  };
  _lookupsLoaded = true;
  notifyLookups();
  return _lookups;
}

export async function loadSchedulesInRange({ from, to, batch_id, published } = {}) {
  const { items } = await schedulesApi.fetchSchedules({ from, to, batch_id, published, include: 'events' });
  const normalized = items.map(normalizeSchedule);
  replaceSchedulesInRange(from, to, normalized);
  return normalized;
}

export async function loadSchedule(id) {
  const s = await schedulesApi.fetchSchedule(id);
  upsertSchedule(s);
  return s;
}

// ─── Mutations (async; throw API errors that asApiError can normalize) ─
export async function createSchedule({ name, date, batch_ids }) {
  const s = await schedulesApi.createSchedule({ name, date, batch_ids });
  upsertSchedule(s);
  return s;
}
export async function updateScheduleMeta(id, patch) {
  // patch may include { name, date, batch_ids }
  const s = await schedulesApi.patchSchedule(id, patch);
  upsertSchedule(s);
  return s;
}
export async function deleteSchedule(id) {
  await schedulesApi.deleteSchedule(id);
  removeSchedule(id);
}
export async function publishSchedule(id, additional_batch_ids = []) {
  const s = await schedulesApi.publishSchedule(id, additional_batch_ids);
  upsertSchedule(s);
  return s;
}
export async function unpublishSchedule(id) {
  const s = await schedulesApi.unpublishSchedule(id);
  upsertSchedule(s);
  return s;
}
export async function duplicateSchedule(srcId, { name, date, batch_ids }) {
  const copy = await schedulesApi.duplicateSchedule(srcId, { name, date, batch_ids });
  upsertSchedule(copy);
  return copy;
}
export async function copyEventsBetweenSchedules(targetId, sourceId, { confirmContentDuplication = false } = {}) {
  const { schedule, copied_count } = await schedulesApi.copyEvents(targetId, sourceId, confirmContentDuplication);
  upsertSchedule(schedule);
  return copied_count;
}

export async function addEventToSchedule(scheduleId, ev) {
  const added = normalizeEvent(await schedulesApi.addEvent(scheduleId, denormalizeEvent(ev)));
  const sched = _schedules.find((s) => s.id === scheduleId);
  if (sched) upsertSchedule({ ...sched, events: [...sched.events, added] });
  else await loadSchedule(scheduleId);
  return added;
}
export async function updateEventInSchedule(scheduleId, ev) {
  const { id, ...rest } = ev;
  const updated = normalizeEvent(await schedulesApi.patchEvent(scheduleId, id, denormalizeEvent(rest)));
  const sched = _schedules.find((s) => s.id === scheduleId);
  if (sched) upsertSchedule({ ...sched, events: sched.events.map((e) => e.id === id ? updated : e) });
  else await loadSchedule(scheduleId);
  return updated;
}
export async function deleteEventFromSchedule(scheduleId, eventId) {
  await schedulesApi.deleteEvent(scheduleId, eventId);
  const sched = _schedules.find((s) => s.id === scheduleId);
  if (sched) upsertSchedule({ ...sched, events: sched.events.filter((e) => e.id !== eventId) });
}
export async function recurringEvent(scheduleId, { event, recurrence, confirmContentDuplication = false }) {
  const data = await schedulesApi.recurringEvent(scheduleId, {
    event: denormalizeEvent(event),
    recurrence,
    confirm_content_duplication: confirmContentDuplication,
  });
  if (data?.schedules) upsertSchedules(data.schedules);
  return data; // { placed_new, appended, skipped_partial, schedules }
}

// Re-export the normalizer so consumers don't reach into schedulesApi.
export { asApiError } from './schedulesApi';
