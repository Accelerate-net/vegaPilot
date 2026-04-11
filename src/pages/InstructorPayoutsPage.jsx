import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { payoutEntriesDemo } from '../data/adminRemainingDemo';

export default function InstructorPayoutsPage() {
  const [entries, setEntries] = useState(payoutEntriesDemo);
  const [statusFilter, setStatusFilter] = useState('');
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) { const id = Date.now() + Math.random(); setToasts((current) => [...current, { id, type, title, message }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000); }
  const filtered = useMemo(() => entries.filter((entry) => !statusFilter || entry.status === statusFilter), [entries, statusFilter]);
  const totalPending = filtered.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + entry.trackedHours * entry.rate, 0);
  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Payouts</p><h3>Instructor Payouts</h3><p className="muted-copy">Time tracking summaries and payout approval actions.</p></div><select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All Statuses</option><option value="pending">Pending</option><option value="paid">Paid</option></select></div>
      <div className="stats-grid"><div className="detail-panel"><h4>Total Pending</h4><p className="big-stat">Rs. {totalPending}</p></div><div className="detail-panel"><h4>Rows</h4><p className="big-stat">{filtered.length}</p></div></div>
      <div className="student-table-shell"><table className="student-table"><thead><tr><th>Instructor</th><th>Month</th><th>Hours</th><th>Rate</th><th>Sessions</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td>{entry.instructorName}</td><td>{entry.month}</td><td>{entry.trackedHours}</td><td>{entry.rate}</td><td>{entry.sessions}</td><td>Rs. {entry.trackedHours * entry.rate}</td><td><span className={`status-pill ${entry.status === 'paid' ? 'active' : 'expiring-soon'}`}>{entry.status}</span></td><td><button type="button" className="table-button" onClick={() => { setEntries((current) => current.map((row) => row.id === entry.id ? { ...row, status: row.status === 'pending' ? 'paid' : 'pending' } : row)); showToast('success', 'Payout Updated', `${entry.instructorName} payout updated.`); }}>{entry.status === 'pending' ? 'Mark Paid' : 'Reopen'}</button></td></tr>)}</tbody></table></div>
    </section>
  );
}
