import React, { useMemo, useState, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';

/* ── Source Origin Config ── */
const sourceIcons = {
  'Phone': 'ti-mobile',
  'Email': 'ti-email',
  'WhatsApp': 'ti-comment-alt',
  'Form': 'ti-clipboard',
  'Website': 'ti-world',
  'Social Media': 'ti-heart',
};
const sourceOptions = Object.keys(sourceIcons);

/* ── Interest Levels ── */
const interestConfig = {
  High:    { color: '#16a34a', bg: '#dcfce7', icon: '🔥', label: 'High' },
  Neutral: { color: '#ca8a04', bg: '#fef9c3', icon: '😐', label: 'Neutral' },
  Low:     { color: '#dc2626', bg: '#fee2e2', icon: '❄️', label: 'Low' },
};

/* ── Status Config ── */
const statusConfig = {
  Received:    { color: '#0284c7', bg: '#e0f2fe' },
  'In Progress': { color: '#ca8a04', bg: '#fef9c3' },
  Converted:   { color: '#16a34a', bg: '#dcfce7' },
  Lost:        { color: '#dc2626', bg: '#fee2e2' },
};
const statusOptions = Object.keys(statusConfig);

/* ── Associates ── */
const associates = [
  { id: 'A01', name: 'Sales Admin' },
  { id: 'A02', name: 'Admissions Desk' },
  { id: 'A03', name: 'Counselor Priya' },
  { id: 'A04', name: 'Counselor Arun' },
];

/* ── Auto-calculate next follow-up ── */
function nextFollowUpDate(interest) {
  const days = interest === 'High' ? 1 : interest === 'Neutral' ? 3 : 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/* ── Demo Data ── */
const initialLeads = [
  { id: 1001, name: 'Akhil Raj', phone: '9876543210', email: 'akhil@test.com', source: 'WhatsApp', interest: 'High', status: 'In Progress', associate: 'Sales Admin', description: 'Asked about JEE crash course fees and scholarship.', nextFollowUp: '2026-04-14', createdAt: '2026-04-08T09:00:00Z', followUps: [
    { text: 'Shared brochure and fee structure', addedBy: 'Sales Admin', interest: 'High', at: '2026-04-10T10:15:00Z' },
    { text: 'Student confirmed interest, requesting demo class', addedBy: 'Sales Admin', interest: 'High', at: '2026-04-12T14:30:00Z' },
  ]},
  { id: 1002, name: 'Megha S', phone: '9123456780', email: 'megha@test.com', source: 'Form', interest: 'Neutral', status: 'Received', associate: 'Admissions Desk', description: 'Interested in NEET repeaters batch and hostel.', nextFollowUp: '2026-04-15', createdAt: '2026-04-10T16:00:00Z', followUps: [
    { text: 'Requested hostel details and batch timings', addedBy: 'Admissions Desk', interest: 'Neutral', at: '2026-04-10T16:40:00Z' },
  ]},
  { id: 1003, name: 'Farhan K', phone: '9988776655', email: '', source: 'Phone', interest: 'Low', status: 'Lost', associate: 'Sales Admin', description: 'Comparing SSC foundation pricing with competitors.', nextFollowUp: '2026-04-20', createdAt: '2026-04-06T11:00:00Z', followUps: [
    { text: 'Budget concern noted. Not willing to pay above 15k.', addedBy: 'Sales Admin', interest: 'Low', at: '2026-04-09T12:05:00Z' },
  ]},
  { id: 1004, name: 'Riya Thomas', phone: '9876501234', email: 'riya@example.com', source: 'Social Media', interest: 'High', status: 'Converted', associate: 'Counselor Priya', description: 'Responded to Instagram ad for IAT batch.', nextFollowUp: '', createdAt: '2026-04-01T08:30:00Z', followUps: [
    { text: 'Initial call done, very enthusiastic', addedBy: 'Counselor Priya', interest: 'High', at: '2026-04-02T09:00:00Z' },
    { text: 'Demo class attended, wants to enrol immediately', addedBy: 'Counselor Priya', interest: 'High', at: '2026-04-04T11:00:00Z' },
    { text: 'Payment received, student enrolled', addedBy: 'Counselor Priya', interest: 'High', at: '2026-04-05T15:00:00Z' },
  ]},
  { id: 1005, name: 'Arjun Pillai', phone: '9001122334', email: 'arjun.p@mail.com', source: 'Website', interest: 'Neutral', status: 'In Progress', associate: 'Counselor Arun', description: 'Visited pricing page twice. Registered for newsletter.', nextFollowUp: '2026-04-16', createdAt: '2026-04-11T14:20:00Z', followUps: [
    { text: 'Called, wants to discuss with parents first.', addedBy: 'Counselor Arun', interest: 'Neutral', at: '2026-04-12T10:00:00Z' },
  ]},
  { id: 1006, name: 'Nandita Menon', phone: '9445566778', email: 'nandita@test.in', source: 'Email', interest: 'High', status: 'Received', associate: 'Admissions Desk', description: 'Emailed inquiry about foundation 2027 batch schedule.', nextFollowUp: '2026-04-14', createdAt: '2026-04-12T18:00:00Z', followUps: []},
];

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState(initialLeads);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interestFilter, setInterestFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Modals
  const [selectedLead, setSelectedLead] = useState(null);      // View / Follow-up modal
  const [editingLead, setEditingLead] = useState(null);        // Add/Edit lead modal
  const [reassignLead, setReassignLead] = useState(null);      // Reassign associate modal

  // Follow-up form state
  const [followUpText, setFollowUpText] = useState('');
  const [followUpInterest, setFollowUpInterest] = useState('Neutral');
  const [followUpNextDate, setFollowUpNextDate] = useState('');

  // Dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts(c => [...c, { id, type, title, message }]);
    setTimeout(() => setToasts(c => c.filter(t => t.id !== id)), 4000);
  }

  // Filtering
  const filtered = useMemo(() => {
    return leads.filter(lead => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (interestFilter !== 'all' && lead.interest !== interestFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return [lead.name, lead.phone, lead.email, lead.associate, lead.source].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [leads, searchQuery, statusFilter, interestFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    received: leads.filter(l => l.status === 'Received').length,
    inProgress: leads.filter(l => l.status === 'In Progress').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    lost: leads.filter(l => l.status === 'Lost').length,
  }), [leads]);

  // ── Handlers ──
  const handleSaveLead = (e) => {
    e.preventDefault();
    if (!editingLead.name || !editingLead.phone) {
      showToast('error', 'Error', 'Name and phone are required.');
      return;
    }
    if (editingLead.id) {
      setLeads(c => c.map(l => l.id === editingLead.id ? editingLead : l));
    } else {
      setLeads(c => [{ ...editingLead, id: Date.now(), createdAt: new Date().toISOString(), followUps: [] }, ...c]);
    }
    setEditingLead(null);
    showToast('success', 'Saved', 'Lead saved successfully.');
  };

  const handleAddFollowUp = () => {
    if (!followUpText.trim()) { showToast('error', 'Error', 'Follow-up note cannot be empty.'); return; }
    const note = {
      text: followUpText,
      addedBy: selectedLead.associate,
      interest: followUpInterest,
      at: new Date().toISOString(),
    };
    const updatedLead = {
      ...selectedLead,
      interest: followUpInterest,
      nextFollowUp: followUpNextDate || nextFollowUpDate(followUpInterest),
      followUps: [...selectedLead.followUps, note],
    };
    setLeads(c => c.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    setFollowUpText('');
    setFollowUpInterest('Neutral');
    setFollowUpNextDate('');
    showToast('success', 'Follow-up Added', 'Follow-up note has been saved.');
  };

  const handleStatusChange = (leadId, newStatus) => {
    setLeads(c => c.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (selectedLead && selectedLead.id === leadId) setSelectedLead(prev => ({ ...prev, status: newStatus }));
    showToast('success', 'Status Updated', `Lead marked as ${newStatus}.`);
  };

  const handleReassign = (assocName) => {
    setLeads(c => c.map(l => l.id === reassignLead.id ? { ...l, associate: assocName } : l));
    if (selectedLead && selectedLead.id === reassignLead.id) setSelectedLead(prev => ({ ...prev, associate: assocName }));
    setReassignLead(null);
    showToast('success', 'Reassigned', `Lead reassigned to ${assocName}.`);
  };

  const openLeadDetail = (lead) => {
    setSelectedLead(lead);
    setFollowUpText('');
    setFollowUpInterest('Neutral');
    setFollowUpNextDate('');
    setActiveDropdown(null);
  };

  const openNewLead = () => {
    setEditingLead({ name: '', phone: '', email: '', source: 'Phone', interest: 'Neutral', status: 'Received', associate: associates[0].name, description: '', nextFollowUp: nextFollowUpDate('Neutral') });
  };

  const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
  const formatDateTime = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };

  return (
    <div className="container-fluid" style={{ paddingTop: '1%' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts(c => c.filter(t => t.id !== id))} />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '20px', background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)', borderRadius: '8px', color: 'white' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600, color: 'white' }}>
            <i className="ti ti-direction-alt" style={{ marginRight: '10px' }}></i>Leads Management
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>Track incoming leads, assign associates, and manage follow-ups.</p>
        </div>
        <button onClick={openNewLead} style={{ background: '#ffb706', color: '#006073', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-plus"></i> Add New Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
        {[
          { label: 'Total Leads', value: stats.total, icon: 'ti-layers-alt', bg: '#006073' },
          { label: 'Received', value: stats.received, icon: 'ti-import', bg: '#0284c7' },
          { label: 'In Progress', value: stats.inProgress, icon: 'ti-reload', bg: '#ca8a04' },
          { label: 'Converted', value: stats.converted, icon: 'ti-check-box', bg: '#16a34a' },
          { label: 'Lost', value: stats.lost, icon: 'ti-na', bg: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`}></i>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Listing Table Card */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Search by name, phone, email..." style={{ padding: '8px 12px 8px 35px', borderRadius: '6px', border: '1px solid #d1d5db', width: '300px', fontSize: '14px' }} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}></i>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select style={{ padding: '8px 15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: 500, background: 'white', color: '#4b5563' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Status</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={{ padding: '8px 15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: 500, background: 'white', color: '#4b5563' }} value={interestFilter} onChange={e => { setInterestFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Interest</option>
              <option value="High">🔥 High</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Low">❄️ Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', color: 'white' }}>
              <tr>
                <th style={thStyle}>Lead</th>
                <th style={thStyle}>Origin</th>
                <th style={thStyle}>Associate</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Interest</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={thStyle}>Last Follow-up</th>
                <th style={thStyle}>Next Follow-up</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((lead, idx) => {
                const lastFu = lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                const sc = statusConfig[lead.status] || {};
                const ic = interestConfig[lead.interest] || {};
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.15s' }} className="lm-tr-hover">
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2f1', color: '#006073', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>{lead.name}</strong>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                        <i className={`ti ${sourceIcons[lead.source] || 'ti-info-alt'}`}></i>{lead.source}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ cursor: 'pointer', color: '#006073', fontWeight: 600, fontSize: '13px', borderBottom: '1px dashed #006073' }} onClick={() => setReassignLead(lead)}>
                        {lead.associate}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: ic.bg, color: ic.color }}>
                        {ic.icon} {ic.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{lastFu ? formatDateTime(lastFu.at) : <em style={{ color: '#9ca3af' }}>No follow-ups</em>}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '-'}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', position: 'relative' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#6b7280' }} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === lead.id ? null : lead.id); }}>
                        <i className="ti ti-more-alt" style={{ fontSize: '20px' }}></i>
                      </button>
                      {activeDropdown === lead.id && (
                        <div style={{ position: 'absolute', right: '40px', top: '15px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '170px', padding: '5px 0' }} onClick={e => e.stopPropagation()}>
                          <div style={dropStyle} className="lm-dp-hover" onClick={() => openLeadDetail(lead)}><i className="ti ti-eye"></i> View Details</div>
                          <div style={dropStyle} className="lm-dp-hover" onClick={() => { setEditingLead(lead); setActiveDropdown(null); }}><i className="ti ti-pencil"></i> Edit Lead</div>
                          <div style={dropStyle} className="lm-dp-hover" onClick={() => { setReassignLead(lead); setActiveDropdown(null); }}><i className="ti ti-exchange-vertical"></i> Reassign</div>
                          <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                          {statusOptions.filter(s => s !== lead.status).map(s => (
                            <div key={s} style={{ ...dropStyle, color: statusConfig[s].color }} className="lm-dp-hover" onClick={() => { handleStatusChange(lead.id, s); setActiveDropdown(null); }}>
                              Mark as {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0 0', marginTop: '15px', borderTop: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>
              Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} leads
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button style={pgBtnStyle(false)} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <i className="ti ti-angle-left"></i> Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} style={pgBtnStyle(currentPage === i + 1)} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              ))}
              <button style={pgBtnStyle(false)} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Next <i className="ti ti-angle-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════ Lead Detail / Follow-up Modal ══════ */}
      {selectedLead && (
        <div className="crispr-modal-backdrop active" onClick={() => setSelectedLead(null)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: '800px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="crispr-modal-header">
              <h3><i className="ti ti-user"></i> {selectedLead.name}</h3>
              <button className="crispr-modal-close" onClick={() => setSelectedLead(null)}><i className="ti ti-close"></i></button>
            </div>
            <div className="crispr-modal-body" style={{ padding: 0, background: '#f8fafc' }}>
              {/* Lead Summary Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: (statusConfig[selectedLead.status] || {}).bg, color: (statusConfig[selectedLead.status] || {}).color, marginTop: '4px' }}>{selectedLead.status}</span>
                </div>
                <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Interest</div>
                  <span style={{ marginTop: '4px', display: 'block', fontWeight: 600, color: (interestConfig[selectedLead.interest] || {}).color }}>{(interestConfig[selectedLead.interest] || {}).icon} {selectedLead.interest}</span>
                </div>
                <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Associate</div>
                  <span style={{ cursor: 'pointer', color: '#006073', fontWeight: 600, fontSize: '14px', borderBottom: '1px dashed #006073', marginTop: '4px', display: 'inline-block' }} onClick={() => setReassignLead(selectedLead)}>{selectedLead.associate}</span>
                </div>
                <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Next Follow-up</div>
                  <span style={{ marginTop: '4px', display: 'block', fontWeight: 600, color: '#1e293b' }}>{selectedLead.nextFollowUp ? formatDate(selectedLead.nextFollowUp) : '-'}</span>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Description */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <i className={`ti ${sourceIcons[selectedLead.source] || 'ti-info-alt'}`} style={{ color: '#006073' }}></i>
                    <strong style={{ fontSize: '13px', color: '#475569' }}>Source: {selectedLead.source}</strong>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>Created {formatDateTime(selectedLead.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>{selectedLead.description || 'No description.'}</p>
                </div>

                {/* Follow-up Timeline */}
                <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                  <i className="ti ti-comment-alt" style={{ marginRight: '6px', color: '#006073' }}></i>Follow-up History ({selectedLead.followUps.length})
                </h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
                  {selectedLead.followUps.length > 0 ? selectedLead.followUps.slice().reverse().map((fu, i) => {
                    const fic = interestConfig[fu.interest] || {};
                    return (
                      <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '6px', borderRadius: '3px', background: fic.color || '#cbd5e1', flexShrink: 0 }}></div>
                        <div style={{ flex: 1, background: 'white', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '13px', color: '#334155' }}>{fu.addedBy}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: fic.bg, color: fic.color, fontWeight: 600 }}>{fic.icon} {fu.interest}</span>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDateTime(fu.at)}</span>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{fu.text}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', background: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                      <i className="ti ti-comment" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
                      No follow-ups yet. Add a note below.
                    </div>
                  )}
                </div>

                {/* Add Follow-up Section */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}><i className="ti ti-plus" style={{ marginRight: '5px', color: '#006073' }}></i>Add Follow-up Note</h5>
                  <textarea value={followUpText} onChange={e => setFollowUpText(e.target.value)} placeholder="Type your follow-up note here..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}></textarea>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Interest Level</label>
                      <select value={followUpInterest} onChange={e => { setFollowUpInterest(e.target.value); setFollowUpNextDate(nextFollowUpDate(e.target.value)); }} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                        <option value="High">🔥 High</option>
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Low">❄️ Low</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Next Follow-up</label>
                      <input type="date" value={followUpNextDate || nextFollowUpDate(followUpInterest)} onChange={e => setFollowUpNextDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                    </div>
                    <button onClick={handleAddFollowUp} style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', marginLeft: 'auto', alignSelf: 'flex-end' }}>
                      <i className="ti ti-check"></i> Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="crispr-modal-footer">
              {/* Status quick-change */}
              <div style={{ display: 'flex', gap: '8px', marginRight: 'auto' }}>
                {statusOptions.map(s => (
                  <button key={s} disabled={selectedLead.status === s} onClick={() => handleStatusChange(selectedLead.id, s)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid', borderColor: selectedLead.status === s ? (statusConfig[s]?.color || '#ccc') : '#e2e8f0', background: selectedLead.status === s ? (statusConfig[s]?.bg || '#eee') : 'white', color: statusConfig[s]?.color || '#333', fontWeight: 600, fontSize: '12px', cursor: selectedLead.status === s ? 'default' : 'pointer', opacity: selectedLead.status === s ? 1 : 0.8 }}>
                    {s}
                  </button>
                ))}
              </div>
              <button className="btn btn-default" onClick={() => setSelectedLead(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Add/Edit Lead Modal ══════ */}
      {editingLead && (
        <div className="crispr-modal-backdrop active" onClick={() => setEditingLead(null)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="crispr-modal-header">
              <h3><i className="ti ti-pencil-alt"></i> {editingLead.id ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button className="crispr-modal-close" onClick={() => setEditingLead(null)}><i className="ti ti-close"></i></button>
            </div>
            <form onSubmit={handleSaveLead}>
              <div className="crispr-modal-body">
                <div className="form-section" style={{ marginBottom: '0' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name <span className="required">*</span></label>
                      <input type="text" className="form-control" required value={editingLead.name} onChange={e => setEditingLead({ ...editingLead, name: e.target.value })} placeholder="Lead name" />
                    </div>
                    <div className="form-group">
                      <label>Phone <span className="required">*</span></label>
                      <input type="text" className="form-control" required value={editingLead.phone} onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })} placeholder="Mobile number" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" className="form-control" value={editingLead.email} onChange={e => setEditingLead({ ...editingLead, email: e.target.value })} placeholder="Email (optional)" />
                    </div>
                    <div className="form-group">
                      <label>Source Origin</label>
                      <select className="form-control" value={editingLead.source} onChange={e => setEditingLead({ ...editingLead, source: e.target.value })}>
                        {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Interest Level</label>
                      <select className="form-control" value={editingLead.interest} onChange={e => setEditingLead({ ...editingLead, interest: e.target.value })}>
                        <option value="High">🔥 High</option>
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Low">❄️ Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned Associate</label>
                      <select className="form-control" value={editingLead.associate} onChange={e => setEditingLead({ ...editingLead, associate: e.target.value })}>
                        {associates.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row full">
                    <div className="form-group">
                      <label>Description</label>
                      <textarea className="form-textarea" value={editingLead.description} onChange={e => setEditingLead({ ...editingLead, description: e.target.value })} placeholder="Lead description / notes"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="crispr-modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setEditingLead(null)}>Cancel</button>
                <button type="submit" style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ Reassign Associate Modal ══════ */}
      {reassignLead && (
        <div className="crispr-modal-backdrop active" onClick={() => setReassignLead(null)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="crispr-modal-header">
              <h3><i className="ti ti-exchange-vertical"></i> Reassign Associate</h3>
              <button className="crispr-modal-close" onClick={() => setReassignLead(null)}><i className="ti ti-close"></i></button>
            </div>
            <div className="crispr-modal-body">
              <p style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '14px' }}>
                Select a new associate for <strong>{reassignLead.name}</strong>:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {associates.map(a => (
                  <div key={a.id} onClick={() => handleReassign(a.name)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', border: '1px solid', borderColor: reassignLead.associate === a.name ? '#006073' : '#e2e8f0', background: reassignLead.associate === a.name ? '#e0f2f1' : 'white', cursor: 'pointer', transition: 'all 0.15s' }} className="lm-dp-hover">
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: reassignLead.associate === a.name ? '#006073' : '#e0f2f1', color: reassignLead.associate === a.name ? 'white' : '#006073', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                      {a.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{a.name}</strong>
                      {reassignLead.associate === a.name && <span style={{ fontSize: '11px', color: '#006073', marginLeft: '8px' }}>(Current)</span>}
                    </div>
                    {reassignLead.associate === a.name && <i className="ti ti-check" style={{ color: '#006073', fontSize: '18px' }}></i>}
                  </div>
                ))}
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button className="btn btn-default" onClick={() => setReassignLead(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lm-tr-hover:hover { background-color: #f8f9fa; }
        .lm-dp-hover:hover { background-color: #f3f4f6; }
      `}</style>
    </div>
  );
}

/* ── Shared inline styles ── */
const thStyle = { padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '14px 18px', verticalAlign: 'middle', color: '#4b5563', fontSize: '14px' };
const dropStyle = { padding: '8px 16px', fontSize: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' };
const pgBtnStyle = (active) => ({ padding: '5px 12px', background: active ? '#006073' : 'white', border: '1px solid', borderColor: active ? '#006073' : '#dee2e6', borderRadius: '4px', color: active ? 'white' : '#495057', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400 });
