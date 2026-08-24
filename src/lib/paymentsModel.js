// ─── Orders ↔ Payments domain helpers ────────────────────────────────────────
// One order (a purchase of a catalog item) has exactly one INITIAL payment and
// zero or more FOLLOW_UP payments. Orders are either FULL (settled by the
// initial payment) or INSTALLMENTS (initial payment + a per-order schedule).
//
// Payment record shape (see src/data/paymentsDemo.js):
//   { id, paymentNumber, orderId, orderNumber, customer, itemTitle,
//     paymentMode: 'FULL' | 'INSTALLMENTS',
//     kind: 'INITIAL' | 'FOLLOW_UP', installmentNo, label,
//     baseAmount, gstAmount, amount,
//     channel: 'ONLINE' | 'OFFLINE', method, reference,
//     dueDate, paidAt,                                  // UNIX seconds
//     status: 'paid' | 'pending' | 'scheduled' | 'failed' }
//
// 'scheduled' = not yet paid; it becomes 'overdue' once dueDate has passed.

export const PAYMENT_MODES = ['FULL', 'INSTALLMENTS'];
export const PAYMENT_CHANNELS = ['ONLINE', 'OFFLINE'];

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/** Resolves 'scheduled' → 'overdue' when the due date has passed. */
export function effectiveStatus(payment, now = nowSec()) {
  if (payment.status === 'scheduled' && payment.dueDate && payment.dueDate < now) return 'overdue';
  return payment.status;
}

export function isSettled(payment) {
  return payment.status === 'paid';
}

export function paymentLabel(payment) {
  if (payment.label) return payment.label;
  if (payment.kind === 'INITIAL') return payment.paymentMode === 'INSTALLMENTS' ? 'Installment 1 (initial)' : 'Full payment';
  return `Installment ${payment.installmentNo}`;
}

export function methodLabel(method) {
  const map = {
    upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet',
    cash: 'Cash', cheque: 'Cheque', bank_transfer: 'Bank Transfer', dd: 'Demand Draft',
  };
  return map[method] || (method ? String(method).toUpperCase() : '—');
}

export function methodIcon(method) {
  if (method === 'card') return 'ti-credit-card';
  if (method === 'upi') return 'ti-mobile';
  if (method === 'wallet') return 'ti-wallet';
  if (method === 'netbanking' || method === 'bank_transfer') return 'ti-desktop';
  if (method === 'cheque' || method === 'dd') return 'ti-receipt';
  return 'ti-money';
}

export function statusMeta(status) {
  switch (status) {
    case 'paid':      return { label: 'Paid',      pill: 'active',   tone: 'good' };
    case 'pending':   return { label: 'Pending',   pill: 'pending',  tone: 'warn' };
    case 'scheduled': return { label: 'Upcoming',  pill: 'pending',  tone: 'info' };
    case 'overdue':   return { label: 'Overdue',   pill: 'inactive', tone: 'bad' };
    case 'failed':    return { label: 'Failed',    pill: 'inactive', tone: 'bad' };
    default:          return { label: status || '—', pill: 'pending', tone: 'info' };
  }
}

/**
 * Aggregates an order's payments into paid / outstanding / next-due figures.
 * `payments` may be the global list — it is filtered by orderId here.
 */
export function summarizeOrder(order, payments, now = nowSec()) {
  const rows = payments
    .filter((p) => p.orderId === order.id)
    .map((p) => ({ ...p, status: effectiveStatus(p, now) }))
    .sort((a, b) => (a.installmentNo || 0) - (b.installmentNo || 0));

  const paid = rows.filter(isSettled).reduce((sum, p) => sum + p.amount, 0);
  const total = order.totalAmount;
  const outstanding = Math.max(0, total - paid);
  const overdue = rows.filter((p) => p.status === 'overdue');
  const upcoming = rows.filter((p) => p.status === 'scheduled' || p.status === 'pending');
  const nextDue = [...overdue, ...upcoming].sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))[0] || null;
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  let state;
  if (rows.some((p) => p.kind === 'INITIAL' && p.status === 'failed') && paid === 0) state = 'failed';
  else if (outstanding <= 0.5) state = 'settled';
  else if (overdue.length) state = 'overdue';
  else if (paid > 0) state = 'partial';
  else state = 'unpaid';

  return { rows, paid, total, outstanding, paidPct, overdue, upcoming, nextDue, state };
}

export function orderStateMeta(state) {
  switch (state) {
    case 'settled': return { label: 'Paid in full',    tone: 'good' };
    case 'partial': return { label: 'Partially paid',  tone: 'info' };
    case 'overdue': return { label: 'Overdue',         tone: 'bad' };
    case 'failed':  return { label: 'Payment failed',  tone: 'bad' };
    default:        return { label: 'Awaiting payment', tone: 'warn' };
  }
}
