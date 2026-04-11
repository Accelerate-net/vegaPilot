import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { leadsDemo } from '../data/adminRemainingDemo';

function statusLabel(code) {
  return { 1: 'Received', 2: 'In Progress', 3: 'Lost', 4: 'Converted' }[code] || 'Unknown';
}

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState(leadsDemo);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) { const id = Date.now() + Math.random(); setToasts((current) => [...current, { id, type, title, message }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000); }
  const filtered = useMemo(() => leads.filter((lead) => {
    if (statusFilter !== 'all' && String(lead.leadStatus) !== String(statusFilter)) return false;
    if (moodFilter && lead.mood !== moodFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return [lead.name, lead.phone].some((value) => String(value).toLowerCase().includes(query));
  }), [leads, searchQuery, statusFilter, moodFilter]);
  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Leads</p><h3>Leads Management</h3><p className="muted-copy">Lead tracking, status handling, and follow-up history.</p></div><button type="button" className="primary-button" onClick={() => setEditingLead({ name: '', phone: '', source: 'Manual', mood: 2, leadStatus: 1, description: '', finalFollowup: '', followUps: [] })}>Add Lead</button></div>
      <div className="stats-grid"><div className="detail-panel"><h4>Total Leads</h4><p className="big-stat">{leads.length}</p></div><div className="detail-panel"><h4>Received</h4><p className="big-stat">{leads.filter((lead) => lead.leadStatus === 1).length}</p></div><div className="detail-panel"><h4>In Progress</h4><p className="big-stat">{leads.filter((lead) => lead.leadStatus === 2).length}</p></div><div className="detail-panel"><h4>Converted</h4><p className="big-stat">{leads.filter((lead) => lead.leadStatus === 4).length}</p></div></div>
      <div className="report-filter-grid"><div className="search-shell"><input className="search-input" placeholder="Search by name or phone..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div><select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All Status</option><option value="1">Received</option><option value="2">In Progress</option><option value="4">Converted</option><option value="3">Lost</option></select><div className="chip-row"><button type="button" className={`table-button ${moodFilter === 1 ? 'selected-chip' : ''}`} onClick={() => setMoodFilter((current) => current === 1 ? null : 1)}>😄</button><button type="button" className={`table-button ${moodFilter === 2 ? 'selected-chip' : ''}`} onClick={() => setMoodFilter((current) => current === 2 ? null : 2)}>😐</button><button type="button" className={`table-button ${moodFilter === 3 ? 'selected-chip' : ''}`} onClick={() => setMoodFilter((current) => current === 3 ? null : 3)}>😡</button></div></div>
      <div className="student-table-shell"><table className="student-table"><thead><tr><th>Name</th><th>Phone</th><th>Source</th><th>Mood</th><th>Status</th><th>Follow-up</th><th>Actions</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><div className="student-subtle">{lead.description}</div></td><td>{lead.phone}</td><td>{lead.source}</td><td>{lead.mood === 1 ? '😄' : lead.mood === 2 ? '😐' : '😡'}</td><td><span className={`status-pill ${lead.leadStatus === 4 ? 'active' : lead.leadStatus === 3 ? 'expired' : 'expiring-soon'}`}>{statusLabel(lead.leadStatus)}</span></td><td>{lead.finalFollowup}</td><td><div className="action-row"><button type="button" className="table-button" onClick={() => setSelectedLead(lead)}>Open</button><button type="button" className="table-button" onClick={() => setEditingLead(lead)}>Edit</button></div></td></tr>)}</tbody></table></div>
      {selectedLead ? <div className="modal-scrim" role="presentation" onClick={() => setSelectedLead(null)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Lead Detail</p><h4>{selectedLead.name}</h4><div className="stack-grid">{selectedLead.followUps.map((item, index) => <div key={`${selectedLead.id}-${index}`} className="detail-panel"><strong>{item.addedBy}</strong><p className="muted-copy">{item.text}</p><span className="student-subtle">{new Date(item.at).toLocaleString('en-IN')}</span></div>)}</div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setSelectedLead(null)}>Close</button><button type="button" className="primary-button" onClick={() => { setSelectedLead(null); showToast('success', 'Follow-up Saved', 'Lead follow-up updated successfully.'); }}>Add Follow-up</button></div></div></div> : null}
      {editingLead ? <div className="modal-scrim" role="presentation" onClick={() => setEditingLead(null)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Lead Form</p><h4>{editingLead.id ? 'Edit Lead' : 'Create Lead'}</h4><div className="form-grid"><label><span>Name</span><input className="search-input" value={editingLead.name} onChange={(event) => setEditingLead((current) => ({ ...current, name: event.target.value }))} /></label><label><span>Phone</span><input className="search-input" value={editingLead.phone} onChange={(event) => setEditingLead((current) => ({ ...current, phone: event.target.value }))} /></label><label className="full-span"><span>Description</span><textarea className="search-input textarea-like" value={editingLead.description} onChange={(event) => setEditingLead((current) => ({ ...current, description: event.target.value }))} /></label></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setEditingLead(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => { setLeads((current) => editingLead.id ? current.map((entry) => entry.id === editingLead.id ? editingLead : entry) : [{ ...editingLead, id: Date.now() }, ...current]); setEditingLead(null); showToast('success', 'Lead Saved', 'Lead saved successfully.'); }}>Save</button></div></div></div> : null}
    </section>
  );
}
