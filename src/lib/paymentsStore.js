// Shared payments state — one list of payment records used by the Orders,
// Payments, and Student Details pages, so a payment recorded on one page is
// visible on the others. Demo-backed today (seeded from paymentsDemo and
// persisted to localStorage); swap load/persist for API calls when the
// backend endpoints land.
import { useSyncExternalStore } from 'react';
import { commerceOrdersDemo, paymentsDemo } from '../data/paymentsDemo';
import { effectiveStatus, nowSec, paymentLabel } from './paymentsModel';

const STORAGE_KEY = 'crisprPilotPaymentsDemo.v1';

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Discard saved state whenever the demo seed changes shape.
    if (saved?.seedLen !== paymentsDemo.length || !Array.isArray(saved.payments)) return null;
    return { payments: saved.payments, manualOrders: Array.isArray(saved.manualOrders) ? saved.manualOrders : [] };
  } catch {
    return null;
  }
}

const loaded = load();
let payments = loaded?.payments || paymentsDemo;
// Orders created by staff from the Orders page (demo orders stay a static seed).
let manualOrders = loaded?.manualOrders || [];
const listeners = new Set();

function emit() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seedLen: paymentsDemo.length, payments, manualOrders }));
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getPayments() {
  return payments;
}

export function usePayments() {
  return useSyncExternalStore(subscribe, getPayments);
}

export function getAllOrders() {
  return manualOrders.length ? commerceOrdersDemo.concat(manualOrders) : commerceOrdersDemo;
}

function getManualOrders() {
  return manualOrders;
}

export function useManualOrders() {
  return useSyncExternalStore(subscribe, getManualOrders);
}

export function getOrderByNumber(orderNumber) {
  return getAllOrders().find((o) => o.orderNumber === orderNumber) || null;
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Base amount still payable on an order (fee lines − coupons − paid bases). */
export function outstandingBase(order, rows = payments) {
  const couponSum = (order.discounts || []).reduce((s, d) => s + d.amount, 0);
  const payable = order.subtotal - couponSum;
  const paidBase = rows.filter((p) => p.orderId === order.id && p.status === 'paid')
    .reduce((s, p) => s + p.baseAmount, 0);
  return round2(Math.max(0, payable - paidBase));
}

/**
 * Records a manual (typically offline) payment against an order.
 *
 * - `applyToId`: id of an unpaid scheduled/pending/overdue payment row to
 *   settle with the received amount, or null for an ad-hoc payment row.
 * - `baseAmount` is exclusive of GST; GST is added at the order's rate.
 * - `rebalance`: when true, the remaining scheduled installments are adjusted
 *   so their sum matches what is still due after this payment. Surplus is
 *   absorbed from the last installment backwards (fully-covered installments
 *   are dropped); a shortfall is added onto the last installment. Adjusted
 *   rows keep `originalBaseAmount` so the change stays visible.
 *
 * Returns the recorded payment row.
 */
export function recordPayment(order, { applyToId = null, baseAmount, channel = 'OFFLINE', method, reference = '', paidAt = nowSec(), note = '', rebalance = true }) {
  const gstRate = order.gstPercent / 100;
  const base = round2(baseAmount);
  const gst = round2(base * gstRate);
  const next = payments.map((p) => ({ ...p }));
  let recorded;

  if (applyToId != null) {
    recorded = next.find((p) => p.id === applyToId);
    if (!recorded || recorded.status === 'paid') throw new Error('Selected installment is not payable');
    if (recorded.baseAmount !== base) recorded.originalBaseAmount = recorded.originalBaseAmount ?? recorded.baseAmount;
    Object.assign(recorded, {
      baseAmount: base, gstAmount: gst, amount: round2(base + gst),
      channel, method, reference, paidAt, note, status: 'paid',
    });
  } else {
    const maxId = next.reduce((m, p) => Math.max(m, p.id), 0);
    const orderRows = next.filter((p) => p.orderId === order.id);
    recorded = {
      id: maxId + 1,
      paymentNumber: `PAY-${String(maxId + 1).padStart(4, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      itemTitle: order.item.title,
      itemCode: order.item.code,
      paymentMode: order.paymentMode,
      kind: 'FOLLOW_UP',
      installmentNo: orderRows.reduce((m, p) => Math.max(m, p.installmentNo || 0), 0) + 1,
      label: 'Ad-hoc payment',
      baseAmount: base, gstAmount: gst, amount: round2(base + gst),
      channel, method, reference, dueDate: null, paidAt, note, status: 'paid',
    };
    next.push(recorded);
  }

  if (rebalance) rebalanceSchedule(order, next);

  payments = next;
  emit();
  return recorded;
}

/**
 * Adjusts an order's unpaid scheduled installments (in place, on `rows`) so
 * their base amounts sum to the outstanding base. See recordPayment.
 */
function rebalanceSchedule(order, rows) {
  const remaining = rows
    .filter((p) => p.orderId === order.id && effectiveStatus(p) !== 'paid' && p.status !== 'failed' && p.status !== 'pending')
    .sort((a, b) => (a.installmentNo || 0) - (b.installmentNo || 0));
  if (!remaining.length) return;

  const due = outstandingBase(order, rows);
  let delta = round2(remaining.reduce((s, p) => s + p.baseAmount, 0) - due);
  const gstRate = order.gstPercent / 100;
  const drop = new Set();

  for (let i = remaining.length - 1; i >= 0 && Math.abs(delta) >= 0.01; i -= 1) {
    const row = remaining[i];
    const isLast = i === remaining.length - 1;
    let newBase;
    if (delta > 0) newBase = round2(Math.max(0, row.baseAmount - delta)); // absorb surplus
    else if (isLast) newBase = round2(row.baseAmount - delta);            // push shortfall onto last
    else break;
    delta = round2(delta - (row.baseAmount - newBase));
    if (newBase !== row.baseAmount) {
      row.originalBaseAmount = row.originalBaseAmount ?? row.baseAmount;
      row.baseAmount = newBase;
      row.gstAmount = round2(newBase * gstRate);
      row.amount = round2(newBase + row.gstAmount);
    }
    if (newBase === 0) drop.add(row.id);
  }

  for (const id of drop) rows.splice(rows.findIndex((p) => p.id === id), 1);
}

/**
 * Pure preview of what recordPayment would do to the schedule — used by the
 * Record Payment modal to show old → new installments before submitting.
 * Returns rows for the order after a hypothetical payment.
 */
export function previewSchedule(order, { applyToId, baseAmount }) {
  const rows = payments.map((p) => ({ ...p }));
  const gstRate = order.gstPercent / 100;
  const base = round2(baseAmount || 0);
  const target = applyToId != null ? rows.find((p) => p.id === applyToId) : null;
  if (target) {
    target.baseAmount = base;
    target.status = 'paid';
  } else {
    rows.push({ id: -1, orderId: order.id, installmentNo: 999, baseAmount: base, gstAmount: round2(base * gstRate), status: 'paid' });
  }
  rebalanceSchedule(order, rows);
  return rows.filter((p) => p.orderId === order.id && p.id !== (target ? null : -1));
}

/**
 * Shapes commerce orders + live payments into the row format the Orders page
 * renders (same fields the old ordersDemo carried), with payment progress
 * attached. `statusOverrides` lets the page keep UI-only states like a
 * demo refund ({[orderId]: 'refunded'}).
 */
export function buildOrdersView(rows, statusOverrides = {}) {
  return getAllOrders().map((order) => {
    const orderRows = rows.filter((p) => p.orderId === order.id);
    const initial = orderRows.find((p) => p.kind === 'INITIAL');
    const paid = orderRows.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const derivedStatus = !initial || initial.status === 'pending' ? 'pending'
      : initial.status === 'failed' && paid === 0 ? 'failed'
      : 'completed';
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      bundleNumber: order.bundleNumber,
      orderDate: order.orderDate,
      status: statusOverrides[order.id] || derivedStatus,
      paymentMethod: initial?.method || 'netbanking',
      paymentReference: initial?.reference || '',
      customer: order.customer,
      items: [{
        catalogId: order.item.catalogId,
        code: order.item.code,
        title: order.item.title,
        type: order.item.type,
        originalPrice: order.feeLines.reduce((s, l) => s + (l.originalAmount || l.amount), 0),
        price: order.subtotal,
      }],
      subtotal: order.subtotal,
      taxPercent: order.gstPercent,
      taxAmount: order.gstAmount,
      discountAmount: (order.discounts || []).reduce((s, d) => s + d.amount, 0),
      discounts: order.discounts || [],
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      scheduledCount: orderRows.filter((p) => p.status === 'scheduled').length,
      paidAmount: Math.round(paid * 100) / 100,
      outstandingAmount: Math.round(Math.max(0, order.totalAmount - paid) * 100) / 100,
      commerceOrder: order,
    };
  });
}

function nextSequence(prefix) {
  // Order/bundle numbers share one running sequence across years (ORD-2025-004
  // is followed by ORD-2026-005 in the seed), so take the global max suffix.
  const pattern = new RegExp(`^${prefix}-(\\d{4})-(\\d+)$`);
  return getAllOrders().reduce((max, order) => {
    const value = prefix === 'OB' ? order.bundleNumber : order.orderNumber;
    const match = pattern.exec(value || '');
    return match ? Math.max(max, Number(match[2])) : max;
  }, 0) + 1;
}

/**
 * Creates an order bundle from manually entered details — one order per
 * selected catalog item, all sharing a bundle number, plus the payment rows
 * implied by each item's payment plan (see paymentsModel.js):
 *
 * - FULL, collected:  INITIAL row marked paid on the order date.
 * - FULL, pending:    INITIAL row pending, due a week after the order date.
 * - INSTALLMENTS:     INITIAL row (amount collected now) marked paid, then the
 *                     remainder split equally into monthly scheduled rows.
 *
 * `customer` must be an already-registered student ({id, name, email, phone});
 * items carry { catalogItem, feeLines, discount?, paymentMode, initialStatus,
 * paidNow, installmentCount, firstDueDate }. `payment` holds the shared
 * channel/method/reference used for collected initial payments.
 * Returns { bundleNumber, orders }.
 */
export function createOrderBundle({ customer, orderDate = nowSec(), items, payment = {} }) {
  const gstPercent = 18;
  let orderId = getAllOrders().reduce((max, o) => Math.max(max, o.id), 0);
  let paymentId = payments.reduce((max, p) => Math.max(max, p.id), 0);
  let orderSeq = nextSequence('ORD');
  const bundleNumber = `OB-${new Date(orderDate * 1000).getFullYear()}-${String(nextSequence('OB')).padStart(3, '0')}`;
  const year = new Date(orderDate * 1000).getFullYear();

  const newOrders = [];
  const newPayments = [];

  const paymentRow = (order, fields) => {
    paymentId += 1;
    const baseAmount = round2(fields.baseAmount);
    const gstAmount = round2(baseAmount * (gstPercent / 100));
    return {
      id: paymentId,
      paymentNumber: `PAY-${String(paymentId).padStart(4, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      itemTitle: order.item.title,
      itemCode: order.item.code,
      paymentMode: order.paymentMode,
      kind: 'FOLLOW_UP',
      installmentNo: 1,
      channel: payment.channel || 'OFFLINE',
      method: payment.method || null,
      reference: payment.reference || null,
      dueDate: null,
      paidAt: null,
      note: '',
      status: 'scheduled',
      ...fields,
      baseAmount,
      gstAmount,
      amount: round2(baseAmount + gstAmount),
    };
  };

  for (const item of items) {
    orderId += 1;
    const subtotal = round2(item.feeLines.reduce((sum, line) => sum + line.amount, 0));
    const discounts = item.discount ? [item.discount] : [];
    const payableBase = round2(subtotal - discounts.reduce((sum, d) => sum + d.amount, 0));
    const gstAmount = round2(payableBase * (gstPercent / 100));
    const order = {
      id: orderId,
      orderNumber: `ORD-${year}-${String(orderSeq).padStart(3, '0')}`,
      bundleNumber,
      orderDate,
      customer,
      item: {
        catalogId: item.catalogItem.id,
        code: item.catalogItem.code,
        title: item.catalogItem.title,
        type: item.catalogItem.type,
      },
      paymentMode: item.paymentMode,
      feeLines: item.feeLines,
      discounts,
      subtotal,
      gstPercent,
      gstAmount,
      totalAmount: round2(payableBase + gstAmount),
    };
    orderSeq += 1;
    newOrders.push(order);

    if (item.paymentMode === 'INSTALLMENTS') {
      newPayments.push(paymentRow(order, {
        kind: 'INITIAL', installmentNo: 1, baseAmount: item.paidNow,
        paidAt: orderDate, status: 'paid', label: 'Installment 1 (initial)',
      }));
      const remainder = round2(payableBase - item.paidNow);
      const count = item.installmentCount;
      const split = round2(remainder / count);
      for (let n = 0; n < count; n += 1) {
        const due = new Date(item.firstDueDate * 1000);
        due.setMonth(due.getMonth() + n);
        newPayments.push(paymentRow(order, {
          installmentNo: n + 2,
          // Last installment absorbs the rounding remainder of the equal split.
          baseAmount: n === count - 1 ? round2(remainder - split * (count - 1)) : split,
          dueDate: Math.floor(due.getTime() / 1000),
          status: 'scheduled',
          label: `Installment ${n + 2}`,
        }));
      }
    } else if (item.initialStatus === 'paid') {
      newPayments.push(paymentRow(order, {
        kind: 'INITIAL', baseAmount: payableBase,
        paidAt: orderDate, status: 'paid', label: 'Full payment',
      }));
    } else {
      newPayments.push(paymentRow(order, {
        kind: 'INITIAL', baseAmount: payableBase,
        dueDate: orderDate + 7 * 24 * 3600, status: 'pending', label: 'Full payment',
      }));
    }
  }

  manualOrders = [...manualOrders, ...newOrders];
  payments = [...payments, ...newPayments];
  emit();
  return { bundleNumber, orders: newOrders };
}

/**
 * Updates due dates of an order's unpaid installments.
 * `changes` maps payment id → new due date (UNIX seconds). Rows keep
 * `originalDueDate` on first change so the reschedule stays visible.
 */
export function updateDueDates(order, changes) {
  let touched = 0;
  const next = payments.map((p) => {
    const dueDate = changes[p.id];
    if (p.orderId !== order.id || dueDate == null || p.status === 'paid' || dueDate === p.dueDate) return p;
    touched += 1;
    return { ...p, originalDueDate: p.originalDueDate ?? p.dueDate, dueDate };
  });
  if (!touched) return 0;
  payments = next;
  emit();
  return touched;
}

/**
 * Merges two or more of an order's unpaid (scheduled/overdue) installments
 * into a single installment with a new due date. The earliest installment
 * becomes the merged row (amounts summed, GST recomputed); the others are
 * removed. The merged row keeps `mergedFrom` so the history stays visible.
 * Returns the merged row, or null if fewer than two valid rows were given.
 */
export function mergeInstallments(order, ids, dueDate) {
  const idSet = new Set(ids);
  const mergeable = payments
    .filter((p) => p.orderId === order.id && idSet.has(p.id)
      && (effectiveStatus(p) === 'scheduled' || effectiveStatus(p) === 'overdue'))
    .sort((a, b) => (a.installmentNo || 0) - (b.installmentNo || 0));
  if (mergeable.length < 2) return null;

  const gstRate = order.gstPercent / 100;
  const base = round2(mergeable.reduce((s, p) => s + p.baseAmount, 0));
  const gst = round2(base * gstRate);
  const numbers = mergeable.map((p) => p.installmentNo || 0);
  const survivor = mergeable[0];
  const merged = {
    ...survivor,
    baseAmount: base,
    gstAmount: gst,
    amount: round2(base + gst),
    dueDate,
    status: 'scheduled',
    label: `Installments ${numbers.join(' + ')} (merged)`,
    mergedFrom: mergeable.map((p) => ({ label: paymentLabel(p), amount: p.amount, dueDate: p.dueDate })),
  };
  // The merge supersedes earlier amount/date adjustments on the survivor.
  delete merged.originalBaseAmount;
  delete merged.originalDueDate;

  payments = payments
    .filter((p) => p.id === survivor.id || !idSet.has(p.id) || p.orderId !== order.id)
    .map((p) => (p.id === survivor.id ? merged : p));
  emit();
  return merged;
}
