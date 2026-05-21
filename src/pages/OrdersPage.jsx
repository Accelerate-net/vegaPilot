import React, { useEffect, useMemo, useRef, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { Can, usePermission } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import { ordersDemo } from '../data/ordersDemo';

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getItemsSummary(order) {
  if (!order.items?.length) return 'No items';
  const firstTitle = order.items[0].title || 'Item';
  const truncated = firstTitle.length > 30 ? `${firstTitle.slice(0, 30)}...` : firstTitle;
  const remaining = order.items.length - 1;
  return remaining > 0 ? `${truncated} +${remaining}` : truncated;
}

function paymentIcon(method) {
  if (method === 'card') return 'ti-credit-card';
  if (method === 'upi') return 'ti-mobile';
  if (method === 'wallet') return 'ti-wallet';
  if (method === 'netbanking') return 'ti-desktop';
  return 'ti-money';
}

function statusClass(status) {
  if (status === 'completed') return 'active';
  if (status === 'pending') return 'pending';
  return 'inactive';
}

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function sortIcon(column, activeColumn, isReverse) {
  if (activeColumn !== column) return 'ti-arrows-vertical';
  return isReverse ? 'ti-arrow-down' : 'ti-arrow-up';
}

function sortOrders(rows, sortColumn, sortReverse) {
  return [...rows].sort((left, right) => {
    let a = '';
    let b = '';

    if (sortColumn === 'orderNumber') {
      a = left.orderNumber;
      b = right.orderNumber;
    } else if (sortColumn === 'customer') {
      a = left.customer.name;
      b = right.customer.name;
    } else if (sortColumn === 'orderDate') {
      a = Number(left.orderDate);
      b = Number(right.orderDate);
    } else if (sortColumn === 'totalAmount') {
      a = Number(left.totalAmount);
      b = Number(right.totalAmount);
    } else if (sortColumn === 'status') {
      a = left.status;
      b = right.status;
    } else if (sortColumn === 'paymentMethod') {
      a = left.paymentMethod;
      b = right.paymentMethod;
    }

    if (typeof a === 'string') a = a.toLowerCase();
    if (typeof b === 'string') b = b.toLowerCase();
    if (a < b) return sortReverse ? 1 : -1;
    if (a > b) return sortReverse ? -1 : 1;
    return 0;
  });
}

export default function OrdersPage() {
  const { can } = usePermission();
  const [orders, setOrders] = useState(ordersDemo);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [sortColumn, setSortColumn] = useState('orderDate');
  const [sortReverse, setSortReverse] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterMenuOpen, setFilterMenuOpen] = useState('');
  const [openKebabId, setOpenKebabId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: '', orderNumber: '' });
  const [refundData, setRefundData] = useState({ order: null, code: ['', '', '', ''], error: '' });
  const [toasts, setToasts] = useState([]);
  const menuRef = useRef(null);
  const toastIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenKebabId(null);
        setFilterMenuOpen('');
      }
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  function showToast(type, title, message) {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  function handleSort(column) {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortReverse((current) => !current);
      return;
    }
    setSortColumn(column);
    setSortReverse(false);
  }

  function clearAllFilters() {
    setSearchQuery('');
    setFilterStatus('');
    setFilterPaymentMethod('');
    setCurrentPage(1);
  }

  function viewOrder(order) {
    setSelectedOrder(order);
    setOrderModalOpen(true);
    setOpenKebabId(null);
  }

  function viewInvoice(order) {
    setSelectedOrder(order);
    setInvoiceModalOpen(true);
    setOpenKebabId(null);
  }

  function sendInvoiceEmail(order) {
    setEmailData({
      to: order.customer.email,
      subject: `Invoice for Order #${order.orderNumber}`,
      orderNumber: order.orderNumber,
    });
    setEmailModalOpen(true);
    setOpenKebabId(null);
  }

  function initiateRefund(order) {
    setRefundData({ order, code: ['', '', '', ''], error: '' });
    setRefundModalOpen(true);
    setOpenKebabId(null);
  }

  function confirmRefund() {
    const code = refundData.code.join('');
    if (code.length !== 4) {
      setRefundData((current) => ({ ...current, error: 'Please enter the complete 4-digit code.' }));
      return;
    }

    setOrders((current) => current.map((order) => (order.id === refundData.order.id ? { ...order, status: 'refunded' } : order)));
    showToast('success', 'Refund', `Refund initiated for ₹${formatMoney(refundData.order.totalAmount)}`);
    setRefundModalOpen(false);
  }

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const matchesSearch = !query || [
        order.orderNumber,
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        order.paymentReference,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesStatus = !filterStatus || order.status === filterStatus;
      const matchesPayment = !filterPaymentMethod || order.paymentMethod === filterPaymentMethod;
      return matchesSearch && matchesStatus && matchesPayment;
    });
    return sortOrders(filtered, sortColumn, sortReverse);
  }, [orders, searchQuery, filterStatus, filterPaymentMethod, sortColumn, sortReverse]);

  const summary = useMemo(() => ({
    totalOrders: orders.length,
    completedOrders: orders.filter((order) => order.status === 'completed').length,
    pendingOrders: orders.filter((order) => order.status === 'pending').length,
    totalRevenue: orders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + order.totalAmount, 0),
  }), [orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredOrders.length === 0 ? 0 : (page - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);
  const statusLabel = filterStatus ? `${filterStatus.slice(0, 1).toUpperCase()}${filterStatus.slice(1)}` : 'All Status';
  const paymentLabel = filterPaymentMethod ? `${filterPaymentMethod.slice(0, 1).toUpperCase()}${filterPaymentMethod.slice(1)}` : 'All Payment Methods';

  return (
    <section className="orders-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="page-header-section">
        <div>
          <h2><i className="ti ti-receipt" /> Orders Management</h2>
          <p>Review transactions, customer purchases, invoice state, and refund actions.</p>
        </div>
      </div>

      <div className="orders-stats-row">
        <StatCard icon="ti-receipt" tone="indigo" value={summary.totalOrders} label="Total Orders" />
        <StatCard icon="ti-check" tone="green" value={summary.completedOrders} label="Completed" />
        <StatCard icon="ti-time" tone="orange" value={summary.pendingOrders} label="Pending" />
        <StatCard icon="ti-money" tone="teal" value={`₹${Math.round(summary.totalRevenue).toLocaleString('en-IN')}`} label="Total Revenue" />
      </div>

      <div className="filter-bar" ref={menuRef}>
        <div className="search-wrapper">
          <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`} onClick={() => { setSearchQuery(''); setCurrentPage(1); }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by order ID, customer name, email, or phone..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <FilterDropdown
          label={statusLabel}
          open={filterMenuOpen === 'status'}
          onToggle={() => setFilterMenuOpen((current) => (current === 'status' ? '' : 'status'))}
          options={[
            ['', 'All Status'],
            ['completed', 'Completed'],
            ['pending', 'Pending'],
            ['failed', 'Failed'],
            ['refunded', 'Refunded'],
          ]}
          onSelect={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
            setFilterMenuOpen('');
          }}
        />
        <FilterDropdown
          label={paymentLabel}
          open={filterMenuOpen === 'payment'}
          onToggle={() => setFilterMenuOpen((current) => (current === 'payment' ? '' : 'payment'))}
          options={[
            ['', 'All Payment Methods'],
            ['card', 'Card'],
            ['upi', 'UPI'],
            ['netbanking', 'Net Banking'],
            ['wallet', 'Wallet'],
          ]}
          onSelect={(value) => {
            setFilterPaymentMethod(value);
            setCurrentPage(1);
            setFilterMenuOpen('');
          }}
        />
      </div>

      {(isLoading || filteredOrders.length > 0) ? (
        <div className="crispr-table-container">
          <table className="crispr-table">
            <thead>
              <tr>
                <th className={`sortable ${sortColumn === 'orderNumber' ? 'active' : ''}`} onClick={() => handleSort('orderNumber')}>Order ID <i className={`sort-icon ti ${sortIcon('orderNumber', sortColumn, sortReverse)}`} /></th>
                <th className={`sortable ${sortColumn === 'customer' ? 'active' : ''}`} onClick={() => handleSort('customer')}>Customer <i className={`sort-icon ti ${sortIcon('customer', sortColumn, sortReverse)}`} /></th>
                <th className={`sortable ${sortColumn === 'orderDate' ? 'active' : ''}`} onClick={() => handleSort('orderDate')}>Date <i className={`sort-icon ti ${sortIcon('orderDate', sortColumn, sortReverse)}`} /></th>
                <th>Items Summary</th>
                <th className={`sortable ${sortColumn === 'totalAmount' ? 'active' : ''}`} onClick={() => handleSort('totalAmount')}>Amount <i className={`sort-icon ti ${sortIcon('totalAmount', sortColumn, sortReverse)}`} /></th>
                <th className={`sortable ${sortColumn === 'status' ? 'active' : ''}`} onClick={() => handleSort('status')}>Status <i className={`sort-icon ti ${sortIcon('status', sortColumn, sortReverse)}`} /></th>
                <th className={`sortable ${sortColumn === 'paymentMethod' ? 'active' : ''}`} onClick={() => handleSort('paymentMethod')}>Payment <i className={`sort-icon ti ${sortIcon('paymentMethod', sortColumn, sortReverse)}`} /></th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, index) => (
                  <tr key={`skel-${index}`}>
                    <td><div className="orders-skeleton short"><div className="orders-skeleton-shimmer" /></div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="orders-skeleton avatar"><div className="orders-skeleton-shimmer" /></div>
                        <div>
                          <div className="orders-skeleton medium" style={{ marginBottom: 5 }}><div className="orders-skeleton-shimmer" /></div>
                          <div className="orders-skeleton short" style={{ height: 12, width: 100 }}><div className="orders-skeleton-shimmer" /></div>
                        </div>
                      </div>
                    </td>
                    <td><div className="orders-skeleton medium" style={{ width: 110 }}><div className="orders-skeleton-shimmer" /></div></td>
                    <td><div className="orders-skeleton long"><div className="orders-skeleton-shimmer" /></div></td>
                    <td><div className="orders-skeleton amount"><div className="orders-skeleton-shimmer" /></div></td>
                    <td><div className="orders-skeleton badge"><div className="orders-skeleton-shimmer" /></div></td>
                    <td><div className="orders-skeleton short" style={{ width: 70 }}><div className="orders-skeleton-shimmer" /></div></td>
                    <td />
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} onClick={() => viewOrder(order)} className={openKebabId === order.id ? 'row-active-menu' : ''}>
                    <td><span className="order-number-link">{order.orderNumber}</span></td>
                    <td>
                      <div className="profile-cell">
                        <div className="profile-info">
                          <div className="profile-name">{order.customer.name}</div>
                          <div className="profile-subtext">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="info-cell"><i className="ti ti-calendar" /> {formatDate(order.orderDate)}</div></td>
                    <td><div className="info-cell" title={order.items?.[0]?.title}>{getItemsSummary(order)}</div></td>
                    <td><span className="order-amount">₹{formatMoney(order.totalAmount)}</span></td>
                    <td><span className={`crispr-status ${statusClass(order.status)}`}>{order.status}</span></td>
                    <td><span className="crispr-badge"><i className={`ti ${paymentIcon(order.paymentMethod)}`} /> {order.paymentMethod.toUpperCase()}</span></td>
                    <td className={`actions-column ${openKebabId === order.id ? 'cell-active-menu' : ''}`} onClick={(event) => event.stopPropagation()}>
                      <div className="kebab-menu-container">
                        <button type="button" className="kebab-button" onClick={(event) => { event.stopPropagation(); setOpenKebabId((current) => (current === order.id ? null : order.id)); }}>
                          <i className="ti ti-more-alt" />
                        </button>
                        <div className={`kebab-dropdown ${openKebabId === order.id ? 'active' : ''}`}>
                          <button type="button" className="kebab-dropdown-item" onClick={() => viewOrder(order)}><i className="ti ti-eye" /> View Order</button>
                          {can(PERMS.ORDERS_INVOICE_DOWNLOAD) && (
                            <button type="button" className="kebab-dropdown-item" onClick={() => viewInvoice(order)}><i className="ti ti-receipt" /> View Invoice</button>
                          )}
                          {can(PERMS.ORDERS_INVOICE_SEND) && (
                            <button type="button" className="kebab-dropdown-item" onClick={() => sendInvoiceEmail(order)}><i className="ti ti-email" /> Email Invoice</button>
                          )}
                          {order.status === 'completed' && can(PERMS.ORDERS_REFUND) ? (
                            <button type="button" className="kebab-dropdown-item refund-action" onClick={() => initiateRefund(order)}><i className="ti ti-back-left" /> Initiate Refund</button>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {!isLoading && filteredOrders.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span>Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredOrders.length)} of {filteredOrders.length} entries</span>
                <select className="page-size-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}>
                  {[10, 20, 50, 100].map((size) => <option key={size} value={size}>Show {size}</option>)}
                </select>
              </div>
              <div className="pagination-controls">
                <button type="button" className="pagination-btn" disabled={page === 1} onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}><i className="ti ti-angle-left" /> Previous</button>
                {getPageNumbers(page, totalPages).map((pageNumber) => <button key={pageNumber} type="button" className={`pagination-btn ${page === pageNumber ? 'active' : ''}`} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</button>)}
                <button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}>Next <i className="ti ti-angle-right" /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <i className="ti ti-shopping-cart" />
          <h4>No Orders Found</h4>
          {(searchQuery || filterStatus || filterPaymentMethod) ? (
            <p>No orders match your search criteria or filters. <button type="button" onClick={clearAllFilters}>Clear all filters</button> to see all orders.</p>
          ) : (
            <p>No orders have been placed yet.</p>
          )}
        </div>
      )}

      {orderModalOpen && selectedOrder ? <OrderModal order={selectedOrder} onClose={() => setOrderModalOpen(false)} onInvoice={() => viewInvoice(selectedOrder)} /> : null}
      {invoiceModalOpen && selectedOrder ? <InvoiceModal order={selectedOrder} onClose={() => setInvoiceModalOpen(false)} onDownload={() => showToast('info', 'Generating PDF', 'Generating PDF...')} /> : null}
      {emailModalOpen ? <EmailModal emailData={emailData} setEmailData={setEmailData} onClose={() => setEmailModalOpen(false)} onSend={() => { if (!emailData.to) { showToast('error', 'Email', 'Please enter an email address'); return; } setEmailModalOpen(false); showToast('success', 'Email Sent', `Invoice email sent to ${emailData.to}`); }} /> : null}
      {refundModalOpen && refundData.order ? <RefundModal refundData={refundData} setRefundData={setRefundData} onClose={() => setRefundModalOpen(false)} onConfirm={confirmRefund} /> : null}
    </section>
  );
}

function FilterDropdown({ label, open, onToggle, options, onSelect }) {
  return (
    <div className="filter-dropdown">
      <button type="button" className="filter-dropdown-btn" onClick={(event) => { event.stopPropagation(); onToggle(); }}>
        {label}
        <i className="ti ti-angle-down" />
      </button>
      <div className={`orders-filter-menu ${open ? 'active' : ''}`}>
        {options.map(([value, optionLabel]) => (
          <button key={optionLabel} type="button" onClick={() => onSelect(value)}>{optionLabel}</button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, tone, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><i className={`ti ${icon}`} /></div>
      <div className="stat-info"><h3>{value}</h3><p>{label}</p></div>
    </div>
  );
}

function OrderModal({ order, onClose, onInvoice }) {
  return (
    <div className="crispr-modal-backdrop active" role="presentation" onClick={onClose}>
      <div className="crispr-modal-dialog order-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="crispr-modal-header">
          <h3><i className="ti ti-receipt" /> Order #{order.orderNumber}</h3>
          <button type="button" className="crispr-modal-close" onClick={onClose}><i className="ti ti-close" /></button>
        </div>
        <div className="crispr-modal-body">
          <div className="order-modal-header">
            <div><i className="ti ti-calendar" /> {formatDate(order.orderDate)} <span><i className="ti ti-user" /> {order.customer.name}</span></div>
            <span className={`status-badge status-${order.status}`}>{order.status.toUpperCase()}</span>
          </div>
          <div className="order-modal-grid">
            <div>
              <h5>Order Items</h5>
              {order.items.map((item) => <OrderItem key={`${order.id}-${item.code}`} item={item} />)}
            </div>
            <aside>
              <div className="customer-info">
                <h5>Customer Details</h5>
                <p><i className="ti ti-email" /> {order.customer.email}</p>
                <p><i className="ti ti-mobile" /> {order.customer.phone}</p>
                <p><i className="ti ti-id-badge" /> ID: {order.customer.id}</p>
              </div>
              <OrderSummary order={order} />
            </aside>
          </div>
        </div>
        <div className="crispr-modal-footer">
          <button type="button" className="btn btn-default" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={onInvoice}><i className="ti ti-receipt" /> View Invoice</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ order, onClose, onDownload }) {
  return (
    <div className="crispr-modal-backdrop active" role="presentation" onClick={onClose}>
      <div className="crispr-modal-dialog invoice-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="crispr-modal-header invoice-header">
          <h3><i className="ti ti-receipt" /> Invoice - {order.orderNumber}</h3>
          <button type="button" className="crispr-modal-close" onClick={onClose}><i className="ti ti-close" /></button>
        </div>
        <div className="crispr-modal-body invoice-body">
          <div className="invoice-top">
            <div><h2>Crispr Pilot</h2><p>Educational Platform<br />www.crisprlearning.com<br />support@crisprlearning.com</p></div>
            <div className="invoice-meta"><h3>INVOICE</h3><p><strong>Invoice #:</strong> INV-{order.orderNumber}<br /><strong>Date:</strong> {formatDate(order.orderDate)}<br /><strong>Status:</strong> <span className={`status-badge status-${order.status}`}>{order.status.toUpperCase()}</span></p></div>
          </div>
          <hr />
          <div className="invoice-info-grid">
            <div><h5>Bill To:</h5><p><strong>{order.customer.name}</strong><br />{order.customer.email}<br />{order.customer.phone}</p></div>
            <div><h5>Payment Details:</h5><p><strong>Method:</strong> {order.paymentMethod.toUpperCase()}<br /><strong>Reference:</strong> {order.paymentReference}<br /><strong>Status:</strong> {order.status.toUpperCase()}</p></div>
          </div>
          <table className="invoice-table">
            <thead><tr><th>#</th><th>Item Description</th><th>Price</th><th>Qty</th><th>Amount</th></tr></thead>
            <tbody>{order.items.map((item, index) => <tr key={item.code}><td>{index + 1}</td><td><strong>{item.title}</strong><br /><small>Code: {item.code}</small></td><td>₹{formatMoney(item.price)}</td><td>1</td><td>₹{formatMoney(item.price)}</td></tr>)}</tbody>
          </table>
          <div className="invoice-bottom">
            <div>{order.discounts?.length ? <><h6>Discounts Applied:</h6>{order.discounts.map((discount) => <p key={discount.code} className="discount-line"><i className="ti ti-check" /> {discount.code} - {discount.description} (-₹{formatMoney(discount.amount)})</p>)}</> : null}</div>
            <OrderSummary order={order} invoice />
          </div>
          <div className="invoice-terms"><strong>Terms & Conditions:</strong><br />Thank you for your purchase. This is a computer-generated invoice and does not require a physical signature. All sales are final. For any queries, please contact our support team.</div>
        </div>
        <div className="crispr-modal-footer">
          <button type="button" className="btn btn-default" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={onDownload}><i className="ti ti-download" /> Download</button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ emailData, setEmailData, onClose, onSend }) {
  return (
    <div className="crispr-modal-backdrop active" role="presentation" onClick={onClose}>
      <div className="crispr-modal-dialog email-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="crispr-modal-header"><h3><i className="ti ti-email" /> Email Invoice</h3><button type="button" className="crispr-modal-close" onClick={onClose}><i className="ti ti-close" /></button></div>
        <div className="crispr-modal-body">
          <p className="email-copy">Send invoice for Order <strong>#{emailData.orderNumber}</strong> to the customer.</p>
          <label className="form-group"><span>Recipient Email <strong>*</strong></span><input type="email" className="form-control" value={emailData.to} onChange={(event) => setEmailData((current) => ({ ...current, to: event.target.value }))} /></label>
          <label className="form-group"><span>Subject</span><input type="text" className="form-control" value={emailData.subject} onChange={(event) => setEmailData((current) => ({ ...current, subject: event.target.value }))} /></label>
        </div>
        <div className="crispr-modal-footer"><button type="button" className="btn btn-default" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={onSend}><i className="ti ti-check" /> Send Email</button></div>
      </div>
    </div>
  );
}

function RefundModal({ refundData, setRefundData, onClose, onConfirm }) {
  const complete = refundData.code.every(Boolean);
  const inputsRef = useRef([]);

  return (
    <div className="crispr-modal-backdrop active" role="presentation" onClick={onClose}>
      <div className="crispr-modal-dialog refund-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="refund-header"><button type="button" className="refund-close" onClick={onClose}><i className="ti ti-close" /></button></div>
        <div className="crispr-modal-body refund-body">
          <div className="refund-icon"><i className="ti ti-alert" /></div>
          <h3>Initiate Refund</h3>
          <p>Are you sure you want to initiate a refund of <strong>₹{formatMoney(refundData.order.totalAmount)}</strong> for Order <strong>#{refundData.order.orderNumber}</strong>? Please enter the confirmatory code to continue.</p>
          <div className="refund-code-row">
            {refundData.code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(event) => {
                  const val = event.target.value.replace(/\D/g, '').slice(0, 1);
                  const next = [...refundData.code];
                  next[index] = val;
                  setRefundData((current) => ({ ...current, code: next, error: '' }));
                  if (val && index < 3) inputsRef.current[index + 1]?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digit && index > 0) {
                    inputsRef.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>
          {refundData.error ? <p className="refund-error">{refundData.error}</p> : null}
          <div className="refund-actions"><button type="button" className="btn btn-default" onClick={onClose}>Cancel</button><button type="button" className="btn btn-danger" disabled={!complete} onClick={onConfirm}>Confirm Refund</button></div>
        </div>
      </div>
    </div>
  );
}

function OrderItem({ item }) {
  return (
    <div className="order-item">
      <img src={item.image || '/assets/img/default_course.png'} className="order-item-image" alt="" />
      <div className="order-item-details"><h5>{item.title}</h5><div>Code: {item.code} | Type: {item.type}</div></div>
      <div className="order-item-price"><strong>₹{formatMoney(item.price)}</strong>{item.originalPrice > item.price ? <small>₹{formatMoney(item.originalPrice)}</small> : null}</div>
    </div>
  );
}

function OrderSummary({ order, invoice = false }) {
  return (
    <div className={invoice ? 'invoice-summary' : 'order-summary'}>
      <div className="summary-row"><span>Subtotal</span><span>₹{formatMoney(order.subtotal)}</span></div>
      {order.taxAmount > 0 ? <div className="summary-row"><span>Tax ({order.taxPercent}%)</span><span>₹{formatMoney(order.taxAmount)}</span></div> : null}
      {order.discountAmount > 0 ? <div className="summary-row discount"><span>Discount</span><span>-₹{formatMoney(order.discountAmount)}</span></div> : null}
      <div className="summary-row total"><span>Total</span><span>₹{formatMoney(order.totalAmount)}</span></div>
    </div>
  );
}
