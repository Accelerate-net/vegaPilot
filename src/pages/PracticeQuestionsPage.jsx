import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { practiceBundlesDemo } from '../data/adminRemainingDemo';

export default function PracticeQuestionsPage() {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState(practiceBundlesDemo);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }
  const filtered = useMemo(() => bundles.filter((bundle) => !searchQuery.trim() || [bundle.title, bundle.sourceFile, bundle.subject].some((value) => String(value).toLowerCase().includes(searchQuery.trim().toLowerCase()))), [bundles, searchQuery]);
  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Practice Questions</p><h3>Practice Questions</h3><p className="muted-copy">OCR/manual ingestion batches that feed quiz creation.</p></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => { const next = { id: `BUNDLE-${Date.now()}`, title: 'New OCR Batch', sourceFile: 'upload.pdf', subject: 'Physics', questionCount: 0, status: 'review', createdAt: new Date().toISOString() }; setBundles((current) => [next, ...current]); showToast('success', 'Batch Added', 'Practice bundle uploaded for review.'); }}>Upload PDF</button><button type="button" className="primary-button" disabled={selectedBundles.length === 0} onClick={() => navigate(`/quiz-creation?bundlesSelected=[${selectedBundles.join(',')}]`)}>Create Quiz From Selected</button></div></div>
      <div className="toolbar-row"><div className="search-shell"><input className="search-input" placeholder="Search bundles..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div></div>
      <div className="student-table-shell"><table className="student-table"><thead><tr><th>Select</th><th>Bundle</th><th>Subject</th><th>Questions</th><th>Status</th><th>Created</th></tr></thead><tbody>{filtered.map((bundle) => <tr key={bundle.id}><td><input type="checkbox" checked={selectedBundles.includes(bundle.id)} onChange={() => setSelectedBundles((current) => current.includes(bundle.id) ? current.filter((value) => value !== bundle.id) : [...current, bundle.id])} /></td><td><strong>{bundle.title}</strong><div className="student-subtle">{bundle.sourceFile}</div></td><td>{bundle.subject}</td><td>{bundle.questionCount}</td><td><span className={`status-pill ${bundle.status === 'processed' ? 'active' : 'expiring-soon'}`}>{bundle.status}</span></td><td>{new Date(bundle.createdAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div>
    </section>
  );
}
