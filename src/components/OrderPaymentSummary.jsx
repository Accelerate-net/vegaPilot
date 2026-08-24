import React from 'react';
import { methodIcon, methodLabel, paymentLabel, statusMeta, summarizeOrder } from '../lib/paymentsModel';

const money = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (ts) => (ts ? new Date(ts * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export const paymentBadgeClass = (p) => (p.status === 'paid' ? 'status-completed' : (p.status === 'overdue' || p.status === 'failed') ? 'status-failed' : 'status-pending');

/**
 * Modal-body content summarising an order's payments — the meta strip, the
 * payment schedule list, and the student/fee aside. Styled after the Orders
 * page order modal; used by the Payments page detail modal and the Orders
 * page "View Payment Summary" modal.
 */
export default function OrderPaymentSummary({ order, payments, highlightPaymentId = null }) {
  const s = summarizeOrder(order, payments);
  const couponSum = (order.discounts || []).reduce((t, d) => t + d.amount, 0);
  const paidCount = s.rows.filter((p) => p.status === 'paid').length;
  const headline = s.rows.find((p) => p.id === highlightPaymentId) || null;

  return (
    <>
      <div className="order-modal-header">
        <div>
          <i className="ti ti-calendar" /> {fmtDate(headline ? (headline.paidAt || headline.dueDate) : order.orderDate)}
          <span><i className="ti ti-user" /> {order.customer.name}</span>
          <span><i className="ti ti-shopping-cart" /> {order.orderNumber}</span>
          {order.bundleNumber ? <span><i className="ti ti-package" /> {order.bundleNumber}</span> : null}
        </div>
        {headline ? (
          <span className={`status-badge ${paymentBadgeClass(headline)}`}>{statusMeta(headline.status).label}</span>
        ) : (
          <span className={`status-badge ${s.outstanding > 0 ? 'status-pending' : 'status-completed'}`}>
            {s.outstanding > 0 ? `₹${money(s.outstanding)} due` : 'Fully settled'}
          </span>
        )}
      </div>
      <div className="order-modal-grid">
        <div>
          <h5>Payment Schedule <small className="payment-schedule-count">{paidCount} of {s.rows.length} settled</small></h5>
          {s.rows.map((p) => (
            <div key={p.id} className={`order-item payment-schedule-item ${p.id === highlightPaymentId ? 'is-current' : ''}`}>
              <div className={`payment-item-badge ${p.status}`}>
                <i className={`ti ${p.status === 'paid' ? 'ti-check' : p.status === 'overdue' || p.status === 'failed' ? 'ti-alert' : 'ti-time'}`} />
              </div>
              <div className="order-item-details">
                <h5>{paymentLabel(p)}</h5>
                <div>
                  {p.status === 'paid'
                    ? <>Paid {fmtDate(p.paidAt)} | {p.channel === 'OFFLINE' ? 'Offline' : 'Online'} | <i className={`ti ${methodIcon(p.method)}`} /> {methodLabel(p.method)}{p.reference ? <> | {p.reference}</> : null}</>
                    : p.dueDate ? <>Due {fmtDate(p.dueDate)}</> : <>Not scheduled</>}
                </div>
                {p.note ? <div className="payment-item-note"><i className="ti ti-comment-alt" /> {p.note}</div> : null}
                {p.originalBaseAmount != null && p.originalBaseAmount !== p.baseAmount ? (
                  <div className="payment-item-note">Adjusted from ₹{money(p.originalBaseAmount)} + GST</div>
                ) : null}
                {p.originalDueDate != null && p.originalDueDate !== p.dueDate ? (
                  <div className="payment-item-note">Rescheduled from {fmtDate(p.originalDueDate)}</div>
                ) : null}
              </div>
              <div className="order-item-price">
                <strong>₹{money(p.amount)}</strong>
                <div className="payment-item-sub">₹{money(p.baseAmount)} + GST ₹{money(p.gstAmount)}</div>
                <span className={`status-badge ${paymentBadgeClass(p)}`}>{statusMeta(p.status).label}</span>
              </div>
            </div>
          ))}
        </div>
        <aside>
          <div className="customer-info">
            <h5>Student Details</h5>
            <p><i className="ti ti-user" /> {order.customer.name}</p>
            <p><i className="ti ti-email" /> {order.customer.email}</p>
            <p><i className="ti ti-mobile" /> {order.customer.phone}</p>
            <p><i className="ti ti-id-badge" /> ID: {order.customer.id}</p>
          </div>
          <div className="order-summary">
            {order.feeLines.map((l) => (
              <div key={l.key} className="summary-row">
                <span>{l.label}</span>
                <span>{l.originalAmount && l.originalAmount !== l.amount ? <small className="payment-fee-strike">₹{money(l.originalAmount)}</small> : null} ₹{money(l.amount)}</span>
              </div>
            ))}
            {(order.discounts || []).map((d) => (
              <div key={d.code} className="summary-row discount"><span>Discount ({d.code})</span><span>-₹{money(d.amount)}</span></div>
            ))}
            <div className="summary-row"><span>Subtotal</span><span>₹{money(order.subtotal - couponSum)}</span></div>
            <div className="summary-row"><span>GST ({order.gstPercent}%)</span><span>₹{money(order.gstAmount)}</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{money(order.totalAmount)}</span></div>
            <div className="summary-row discount"><span>Paid so far</span><span>₹{money(s.paid)}</span></div>
            <div className={`summary-row ${s.outstanding > 0 ? 'outstanding' : ''}`}><span>Outstanding</span><span>₹{money(s.outstanding)}</span></div>
            {s.nextDue ? (
              <div className="summary-row outstanding"><span>{s.nextDue.status === 'overdue' ? 'Overdue since' : 'Next due'}</span><span>{fmtDate(s.nextDue.dueDate)}</span></div>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
