import React, { useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { mentorsDemo } from '../data/adminRemainingDemo';

export default function MentorProfilesPage() {
  const [mentors, setMentors] = useState(mentorsDemo);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [editingMentor, setEditingMentor] = useState(null);
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) { const id = Date.now() + Math.random(); setToasts((current) => [...current, { id, type, title, message }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000); }
  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Mentors</p><h3>Mentor Profiles</h3><p className="muted-copy">Create mentors, inspect assignments, and keep student mappings current.</p></div><button type="button" className="primary-button" onClick={() => setEditingMentor({ name: '', specialization: '', email: '', phone: '', status: 'active', assignedStudents: 0 })}>Add Mentor</button></div>
      <div className="selection-grid">{mentors.map((mentor) => <div key={mentor.id} className="selection-card static"><strong>{mentor.name}</strong><span className="student-subtle">{mentor.specialization}</span><div className="chip-row"><span className={`status-pill ${mentor.status === 'active' ? 'active' : 'inactive'}`}>{mentor.status}</span><span className="status-pill">{mentor.assignedStudents} students</span></div><p className="muted-copy">{mentor.email}</p><div className="action-row"><button type="button" className="table-button" onClick={() => setSelectedMentor(mentor)}>Assigned Students</button><button type="button" className="table-button" onClick={() => setEditingMentor(mentor)}>Edit</button></div></div>)}</div>
      {selectedMentor ? <div className="modal-scrim" role="presentation" onClick={() => setSelectedMentor(null)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Assigned Students</p><h4>{selectedMentor.name}</h4><div className="detail-panel"><p>{selectedMentor.assignedStudents} students currently mapped to this mentor.</p></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setSelectedMentor(null)}>Close</button></div></div></div> : null}
      {editingMentor ? <div className="modal-scrim" role="presentation" onClick={() => setEditingMentor(null)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Mentor Profile</p><h4>{editingMentor.id ? 'Edit Mentor' : 'Create Mentor'}</h4><div className="form-grid"><label><span>Name</span><input className="search-input" value={editingMentor.name} onChange={(event) => setEditingMentor((current) => ({ ...current, name: event.target.value }))} /></label><label><span>Specialization</span><input className="search-input" value={editingMentor.specialization} onChange={(event) => setEditingMentor((current) => ({ ...current, specialization: event.target.value }))} /></label></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setEditingMentor(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => { setMentors((current) => editingMentor.id ? current.map((entry) => entry.id === editingMentor.id ? editingMentor : entry) : [{ ...editingMentor, id: `M-${Date.now()}` }, ...current]); setEditingMentor(null); showToast('success', 'Mentor Saved', 'Mentor profile saved successfully.'); }}>Save</button></div></div></div> : null}
    </section>
  );
}
