import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { ordersDemo } from '../data/ordersDemo';

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(ordersDemo);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesSearch = !searchQuery.trim() || [order.orderNumber, order.customer.name, order.customer.email].some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [orders, searchQuery, filterStatus]);

  const summary = useMemo(() => ({
    totalOrders: filteredOrders.length,
    completedOrders: filteredOrders.filter((order) => order.status === 'completed').length,
    pendingOrders: filteredOrders.filter((order) => order.status === 'pending').length,
    totalRevenue: filteredOrders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + order.totalAmount, 0),
  }), [filteredOrders]);

  function openCustomerProfile(order) {
    window.localStorage.setItem('selectedStudent', JSON.stringify({
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      totalSpent: order.totalAmount,
    }));
    const detailUrl = `${window.location.origin}/candidate-detail`;
    window.open(detailUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="screen-card orders-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Commerce</p>
          <h3>Orders Management</h3>
          <p className="muted-copy">Review transactions, customer purchases, invoice state, and refund actions.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Orders</h4><p className="big-stat">{summary.totalOrders}</p></div>
        <div className="detail-panel"><h4>Completed</h4><p className="big-stat">{summary.completedOrders}</p></div>
        <div className="detail-panel"><h4>Pending</h4><p className="big-stat">{summary.pendingOrders}</p></div>
        <div className="detail-panel"><h4>Revenue</h4><p className="big-stat">₹{summary.totalRevenue.toFixed(2)}</p></div>
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input className="search-input" placeholder="Search by order number, customer name, or email..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="stack-grid">
        {filteredOrders.map((order) => (
          <article key={order.orderNumber} className={`detail-panel order-card ${selectedOrder?.orderNumber === order.orderNumber ? 'active-panel' : ''}`}>
            <div className="hero-row">
              <div>
                <strong>{order.orderNumber}</strong>
                <div className="student-subtle">{formatDate(order.orderDate)} • {order.customer.name}</div>
              </div>
              <span className={`status-pill ${order.status === 'completed' ? 'active' : order.status === 'pending' ? 'expiring-soon' : 'expired'}`}>{order.status}</span>
            </div>
            <div className="result-grid">
              <span><strong>Method:</strong> {order.paymentMethod.toUpperCase()}</span>
              <span><strong>Total:</strong> ₹{order.totalAmount.toFixed(2)}</span>
              <span><strong>Items:</strong> {order.items.length}</span>
              <span><strong>Reference:</strong> {order.paymentReference}</span>
            </div>
            <div className="action-row">
              <button type="button" className="table-button" onClick={() => setSelectedOrder(order)}>Quick View</button>
              <button type="button" className="table-button" onClick={() => { setSelectedOrder(order); setInvoiceOpen(true); }}>Invoice</button>
              <button type="button" className="table-button" onClick={() => openCustomerProfile(order)}>Customer</button>
              <button type="button" className="table-button danger" onClick={() => setRefundOrder(order)}>Refund</button>
            </div>
          </article>
        ))}
      </div>

      {selectedOrder ? (
        <div className="modal-scrim" role="presentation" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Order Details</p>
                <h4>Order #{selectedOrder.orderNumber}</h4>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
            <div className="detail-grid">
              <article className="detail-panel">
                <h4>Customer</h4>
                <p><strong>{selectedOrder.customer.name}</strong></p>
                <p>{selectedOrder.customer.email}</p>
                <p>{selectedOrder.customer.phone}</p>
              </article>
              <article className="detail-panel">
                <h4>Payment</h4>
                <p><strong>Method:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>
                <p><strong>Reference:</strong> {selectedOrder.paymentReference}</p>
                <p><strong>Status:</strong> {selectedOrder.status.toUpperCase()}</p>
              </article>
            </div>
            <div className="stack-grid compact-stack">
              {selectedOrder.items.map((item) => (
                <article key={`${selectedOrder.orderNumber}-${item.code}`} className="detail-panel align-left">
                  <strong>{item.title}</strong>
                  <div className="student-subtle">{item.code} • {item.type}</div>
                  <div className="student-subtle">₹{item.price.toFixed(2)}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {invoiceOpen && selectedOrder ? (
        <div className="modal-scrim" role="presentation" onClick={() => setInvoiceOpen(false)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Invoice</p>
                <h4>Invoice - {selectedOrder.orderNumber}</h4>
              </div>
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => showToast('info', 'Invoice', 'Generating PDF...')}>Download</button>
                <button type="button" className="primary-button" onClick={() => showToast('success', 'Invoice', `Invoice email sent to ${selectedOrder.customer.email}`)}>Email</button>
              </div>
            </div>
            <pre className="token-preview">{JSON.stringify(selectedOrder, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {refundOrder ? (
        <div className="modal-scrim" role="presentation" onClick={() => setRefundOrder(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Refund</p>
            <h4>Initiate refund for {refundOrder.orderNumber}?</h4>
            <p className="muted-copy">Refund amount: ₹{refundOrder.totalAmount.toFixed(2)}</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setRefundOrder(null)}>Cancel</button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setOrders((current) => current.map((order) => order.orderNumber === refundOrder.orderNumber ? { ...order, status: 'refunded' } : order));
                  showToast('success', 'Refund', `Refund initiated for ₹${refundOrder.totalAmount.toFixed(2)}`);
                  setRefundOrder(null);
                }}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
