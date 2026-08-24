// Demo data for the Orders ↔ Payments model (see src/lib/paymentsModel.js).
// Each order snapshots its fee lines (with optional per-line discount) at
// purchase time; GST is applied on the discounted subtotal. Amounts in INR.

const GST = 18;

export const commerceOrdersDemo = [
  {
    id: 1,
    orderNumber: 'ORD-2025-001',
    bundleNumber: 'OB-2025-001',
    orderDate: 1737955200,
    customer: { id: 'CAND-001', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210' },
    item: { catalogId: 1, code: 'CR0001', title: 'IAT 2026 – Exclusive 1 Year Course', type: 'Course Bundle' },
    paymentMode: 'FULL',
    feeLines: [
      { key: 'registration', label: 'Registration Fee', amount: 4990 },
      { key: 'course', label: 'Course Fee', amount: 24000 },
    ],
    discounts: [{ code: 'WELCOME500', description: 'Welcome Discount for New Students', amount: 500 }],
    subtotal: 28990,
    gstPercent: GST,
    gstAmount: 5218.2,
    totalAmount: 33708.2,
  },
  {
    id: 2,
    orderNumber: 'ORD-2025-002',
    bundleNumber: 'OB-2025-002',
    orderDate: 1738041600,
    customer: { id: 'CAND-002', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 87654 32109' },
    item: { catalogId: 2, code: 'CR0002', title: 'IAT 2026 - Test Series', type: 'Test Series' },
    paymentMode: 'FULL',
    feeLines: [{ key: 'course', label: 'Test Series Fee', amount: 999 }],
    discounts: [],
    subtotal: 999,
    gstPercent: GST,
    gstAmount: 179.82,
    totalAmount: 1178.82,
  },
  {
    id: 3,
    orderNumber: 'ORD-2025-003',
    bundleNumber: 'OB-2025-003',
    orderDate: 1738041600,
    customer: { id: 'CAND-001', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210' },
    item: { catalogId: 2, code: 'CR0002', title: 'IAT 2026 - Test Series', type: 'Test Series' },
    paymentMode: 'FULL',
    feeLines: [{ key: 'course', label: 'Test Series Fee', amount: 999 }],
    discounts: [],
    subtotal: 999,
    gstPercent: GST,
    gstAmount: 179.82,
    totalAmount: 1178.82,
  },
  {
    id: 4,
    orderNumber: 'ORD-2025-004',
    bundleNumber: 'OB-2025-004',
    orderDate: 1738128000,
    customer: { id: 'CAND-003', name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '+91 76543 21098' },
    item: { catalogId: 3, code: 'CR0003', title: 'JEE Advanced Complete Package', type: 'Course Bundle' },
    paymentMode: 'FULL',
    feeLines: [
      { key: 'registration', label: 'Registration Fee', amount: 9990 },
      { key: 'course', label: 'Course Fee', amount: 50000 },
    ],
    discounts: [{ code: 'EARLYBIRD2000', description: 'Early Bird Discount', amount: 2000 }],
    subtotal: 59990,
    gstPercent: GST,
    gstAmount: 10798.2,
    totalAmount: 68788.2,
  },
  // ── IISER Course 2027 (Registration 9990 / Course 70000 / Onboarding 1000) ──
  {
    id: 5,
    orderNumber: 'ORD-2026-005',
    bundleNumber: 'OB-2026-005',
    orderDate: 1783659600,
    customer: { id: 'CAND-004', name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 91234 56789' },
    item: { catalogId: 10, code: 'CR0010', title: 'IISER Course 2027', type: 'Course Bundle' },
    paymentMode: 'FULL',
    feeLines: [
      { key: 'registration', label: 'Registration Fee', amount: 9990 },
      { key: 'course', label: 'Course Fee', amount: 70000 },
      { key: 'onboarding', label: 'Onboarding Fee', amount: 1000 },
    ],
    discounts: [],
    subtotal: 80990,
    gstPercent: GST,
    gstAmount: 14578.2,
    totalAmount: 95568.2,
  },
  {
    id: 6,
    orderNumber: 'ORD-2026-006',
    bundleNumber: 'OB-2026-006',
    orderDate: 1785560400,
    customer: { id: 'CAND-001', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210' },
    item: { catalogId: 10, code: 'CR0010', title: 'IISER Course 2027', type: 'Course Bundle' },
    paymentMode: 'INSTALLMENTS',
    feeLines: [
      { key: 'registration', label: 'Registration Fee', amount: 9990 },
      { key: 'course', label: 'Course Fee', amount: 70000 },
      { key: 'onboarding', label: 'Onboarding Fee', amount: 1000 },
    ],
    discounts: [],
    subtotal: 80990,
    gstPercent: GST,
    gstAmount: 14578.2,
    totalAmount: 95568.2,
  },
  {
    id: 7,
    orderNumber: 'ORD-2026-007',
    bundleNumber: 'OB-2026-007',
    orderDate: 1781931600,
    customer: { id: 'CAND-002', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 87654 32109' },
    item: { catalogId: 10, code: 'CR0010', title: 'IISER Course 2027', type: 'Course Bundle' },
    paymentMode: 'INSTALLMENTS',
    feeLines: [
      { key: 'registration', label: 'Registration Fee', amount: 9990 },
      { key: 'course', label: 'Course Fee', amount: 60000, originalAmount: 70000, discountNote: '₹10,000 scholarship discount' },
      { key: 'onboarding', label: 'Onboarding Fee', amount: 1000 },
    ],
    discounts: [],
    subtotal: 70990,
    gstPercent: GST,
    gstAmount: 12778.2,
    totalAmount: 83768.2,
  },
  // ── Order Bundle with multiple cart items: one checkout, one payment,
  //    but each cart item is its own order (OB-2026-008 → orders 8 & 9) ──
  {
    id: 8,
    orderNumber: 'ORD-2026-008',
    bundleNumber: 'OB-2026-008',
    orderDate: 1785733200,
    customer: { id: 'CAND-003', name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '+91 76543 21098' },
    item: { catalogId: 11, code: 'CR0011', title: 'Crash Course 2027', type: 'Course' },
    paymentMode: 'FULL',
    feeLines: [{ key: 'course', label: 'Course Fee', amount: 999 }],
    discounts: [],
    subtotal: 999,
    gstPercent: GST,
    gstAmount: 179.82,
    totalAmount: 1178.82,
  },
  {
    id: 9,
    orderNumber: 'ORD-2026-009',
    bundleNumber: 'OB-2026-008',
    orderDate: 1785733200,
    customer: { id: 'CAND-003', name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '+91 76543 21098' },
    item: { catalogId: 12, code: 'CR0012', title: 'IAT 2027 - Test Series', type: 'Test Series' },
    paymentMode: 'FULL',
    feeLines: [{ key: 'course', label: 'Test Series Fee', amount: 199 }],
    discounts: [],
    subtotal: 199,
    gstPercent: GST,
    gstAmount: 35.82,
    totalAmount: 234.82,
  },
];

const byId = Object.fromEntries(commerceOrdersDemo.map((o) => [o.id, o]));

function payment(seq, orderId, fields) {
  const order = byId[orderId];
  const baseAmount = fields.baseAmount;
  const gstAmount = fields.gstAmount ?? Math.round(baseAmount * order.gstPercent) / 100;
  return {
    id: seq,
    paymentNumber: `PAY-${String(seq).padStart(4, '0')}`,
    orderId,
    orderNumber: order.orderNumber,
    customer: order.customer,
    itemTitle: order.item.title,
    itemCode: order.item.code,
    paymentMode: order.paymentMode,
    kind: 'FOLLOW_UP',
    installmentNo: 1,
    channel: 'ONLINE',
    method: null,
    reference: null,
    dueDate: null,
    paidAt: null,
    status: 'scheduled',
    ...fields,
    baseAmount,
    gstAmount,
    amount: Math.round((baseAmount + gstAmount) * 100) / 100,
  };
}

export const paymentsDemo = [
  payment(1, 1, { kind: 'INITIAL', baseAmount: 28490, gstAmount: 5218.2, method: 'upi', reference: 'UPI202501270001', paidAt: 1737955200, status: 'paid', label: 'Full payment' }),
  payment(2, 2, { kind: 'INITIAL', baseAmount: 999, method: 'card', reference: 'CARD202501280002', paidAt: null, dueDate: 1738041600, status: 'pending', label: 'Full payment' }),
  payment(3, 3, { kind: 'INITIAL', baseAmount: 999, method: 'card', reference: 'CARD202501280003', paidAt: 1738041600, status: 'paid', label: 'Full payment' }),
  payment(4, 4, { kind: 'INITIAL', baseAmount: 57990, gstAmount: 10798.2, method: 'netbanking', reference: 'NB202501290004', paidAt: null, dueDate: 1738128000, status: 'failed', label: 'Full payment' }),

  // Student 1 — full payment
  payment(5, 5, { kind: 'INITIAL', baseAmount: 80990, method: 'netbanking', reference: 'NB202607100005', paidAt: 1783659600, status: 'paid', label: 'Full payment' }),

  // Student 2 — installments: 30990 upfront, then 25000 + 25000
  payment(6, 6, { kind: 'INITIAL', installmentNo: 1, baseAmount: 30990, method: 'upi', reference: 'UPI202608010006', paidAt: 1785560400, status: 'paid', label: 'Installment 1 — Registration + part course fee' }),
  payment(7, 6, { installmentNo: 2, baseAmount: 25000, dueDate: 1789448400, status: 'scheduled', label: 'Installment 2' }),
  payment(8, 6, { installmentNo: 3, baseAmount: 25000, dueDate: 1792040400, status: 'scheduled', label: 'Installment 3' }),

  // Student 3 — discounted course fee, installments; inst 2 paid offline, inst 3 overdue
  payment(9, 7, { kind: 'INITIAL', installmentNo: 1, baseAmount: 20990, method: 'upi', reference: 'UPI202606200009', paidAt: 1781931600, status: 'paid', label: 'Installment 1 — Registration + part course fee' }),
  // Bundle OB-2026-008 — one UPI transaction allocated across both orders
  payment(12, 8, { kind: 'INITIAL', baseAmount: 999, method: 'upi', reference: 'UPI202608030012', paidAt: 1785733200, status: 'paid', label: 'Full payment (bundle OB-2026-008)' }),
  payment(13, 9, { kind: 'INITIAL', baseAmount: 199, method: 'upi', reference: 'UPI202608030012', paidAt: 1785733200, status: 'paid', label: 'Full payment (bundle OB-2026-008)' }),

  payment(10, 7, { installmentNo: 2, baseAmount: 25000, channel: 'OFFLINE', method: 'cheque', reference: 'CHQ-448213', dueDate: 1784091600, paidAt: 1784523600, status: 'paid', label: 'Installment 2' }),
  payment(11, 7, { installmentNo: 3, baseAmount: 25000, dueDate: 1786770000, status: 'scheduled', label: 'Installment 3' }),
];
