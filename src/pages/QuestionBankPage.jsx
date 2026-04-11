import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { questionBankDemoLite } from '../data/adminRemainingDemo';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState(questionBankDemoLite);
  const [filters, setFilters] = useState({ query: '', subject: '', verified: '' });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }
  const filtered = useMemo(() => questions.filter((question) => {
    if (filters.subject && question.subject !== filters.subject) return false;
    if (filters.verified !== '' && String(question.verified) !== filters.verified) return false;
    if (!filters.query.trim()) return true;
    const query = filters.query.trim().toLowerCase();
    return [question.displayKey, question.chapter, question.subject].some((value) => String(value).toLowerCase().includes(query));
  }), [questions, filters]);
  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Question Bank</p><h3>Question Bank</h3><p className="muted-copy">Review, verify, challenge, and update solution metadata for questions.</p></div></div>
      <div className="report-filter-grid"><div className="search-shell"><input className="search-input" placeholder="Search question key or chapter..." value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></div><select className="filter-select" value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}><option value="">All Subjects</option><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Mathematics">Mathematics</option></select><select className="filter-select" value={filters.verified} onChange={(event) => setFilters((current) => ({ ...current, verified: event.target.value }))}><option value="">All Verification</option><option value="true">Verified</option><option value="false">Unverified</option></select></div>
      <div className="student-table-shell"><table className="student-table"><thead><tr><th>Key</th><th>Subject</th><th>Chapter</th><th>Type</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((question) => <tr key={question.id}><td>{question.displayKey}</td><td>{question.subject}</td><td>{question.chapter}</td><td>{question.questionType}</td><td>{question.level}</td><td><div className="chip-row"><span className={`status-pill ${question.verified ? 'active' : 'inactive'}`}>{question.verified ? 'Verified' : 'Review'}</span>{question.challenged ? <span className="status-pill expired">Challenged</span> : null}</div></td><td><div className="action-row"><button type="button" className="table-button" onClick={() => setSelectedQuestion(question)}>View</button><button type="button" className="table-button" onClick={() => { setQuestions((current) => current.map((entry) => entry.id === question.id ? { ...entry, verified: !entry.verified } : entry)); showToast('success', 'Verification Updated', `${question.displayKey} verification updated.`); }}>{question.verified ? 'Unverify' : 'Verify'}</button></div></td></tr>)}</tbody></table></div>
      {selectedQuestion ? <div className="modal-scrim" role="presentation" onClick={() => setSelectedQuestion(null)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Question Detail</p><h4>{selectedQuestion.displayKey}</h4><p className="muted-copy">{selectedQuestion.subject} · {selectedQuestion.chapter}</p><div className="detail-panel"><p><strong>Answer:</strong> {selectedQuestion.answer}</p><p><strong>Solution:</strong> {selectedQuestion.solution}</p></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setSelectedQuestion(null)}>Close</button><button type="button" className="primary-button" onClick={() => { setSelectedQuestion(null); showToast('success', 'Solution Saved', 'Solution notes updated successfully.'); }}>Save Notes</button></div></div></div> : null}
    </section>
  );
}
