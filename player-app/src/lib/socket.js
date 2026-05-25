// Realtime channel. Placeholder implementation that emits demo events on
// a timer so the overlays are visible during development. Swap the body of
// `connect()` for a real WebSocket / Pusher / SSE client when the backend
// is ready — the public API (subscribe/unsubscribe) does not change.

import { USE_MOCK } from '../config.js';

const subscribers = new Map(); // channel -> Set<fn>

function emit(channel, payload) {
  const set = subscribers.get(channel);
  if (!set) return;
  for (const fn of set) {
    try { fn(payload); } catch { /* swallow subscriber errors */ }
  }
}

let mockTimer = null;
function startMockEvents(branchId) {
  if (mockTimer) return;
  const NAMES = ['Ajinkya', 'Sneha', 'Rahul', 'Meera', 'Vivaan', 'Priya', 'Arjun', 'Kavya'];
  mockTimer = setInterval(() => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    emit(`checkin:${branchId}`, {
      id: `evt-${Date.now()}`,
      name,
      message: 'Checked in successfully',
      at: new Date().toISOString(),
    });
  }, 12_000);
}

export function connect({ branchId }) {
  if (USE_MOCK) {
    startMockEvents(branchId);
    return;
  }
  // Real implementation goes here, e.g.:
  // const ws = new WebSocket(`${WS_BASE}/branch/${branchId}`);
  // ws.onmessage = (e) => { const { channel, payload } = JSON.parse(e.data); emit(channel, payload); };
}

export function subscribe(channel, fn) {
  if (!subscribers.has(channel)) subscribers.set(channel, new Set());
  subscribers.get(channel).add(fn);
  return () => subscribers.get(channel)?.delete(fn);
}

export function disconnect() {
  if (mockTimer) { clearInterval(mockTimer); mockTimer = null; }
  subscribers.clear();
}
