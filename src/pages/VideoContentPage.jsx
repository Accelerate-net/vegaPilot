import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { videoLibraryDemo } from '../data/adminRemainingDemo';

export default function VideoContentPage() {
  const [videos, setVideos] = useState(videoLibraryDemo);
  const [filters, setFilters] = useState({ searchText: '', subject: '', chapterId: '', instructorId: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  const filtered = useMemo(() => videos.filter((video) => {
    if (filters.subject && video.subject !== filters.subject) return false;
    if (filters.chapterId && video.chapterId !== filters.chapterId) return false;
    if (filters.instructorId && video.instructorId !== filters.instructorId) return false;
    if (!filters.searchText.trim()) return true;
    const query = filters.searchText.trim().toLowerCase();
    return [video.titleName, video.videoDisplayKey].some((value) => String(value).toLowerCase().includes(query));
  }), [videos, filters]);

  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div><p className="eyebrow">Video Library</p><h3>Video Content</h3><p className="muted-copy">Manage linked videos, chapter metadata, and upload state.</p></div>
        <button type="button" className="primary-button" onClick={() => setShowUpload(true)}>Upload / Link Video</button>
      </div>
      <div className="report-filter-grid">
        <div className="search-shell"><input className="search-input" placeholder="Search videos..." value={filters.searchText} onChange={(event) => setFilters((current) => ({ ...current, searchText: event.target.value }))} /></div>
        <select className="filter-select" value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}><option value="">All Subjects</option><option value="Biology">Biology</option><option value="Chemistry">Chemistry</option><option value="Mathematics">Mathematics</option></select>
      </div>
      <div className="student-table-shell">
        <table className="student-table">
          <thead><tr><th>Title</th><th>Key</th><th>Subject</th><th>Instructor</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((video) => (
              <tr key={video.id}>
                <td><strong>{video.titleName}</strong><div className="student-subtle">{video.collectionName}</div></td>
                <td>{video.videoDisplayKey}</td>
                <td>{video.subject}</td>
                <td>{video.instructorName}</td>
                <td>{Math.floor(video.durationInSeconds / 60)} min</td>
                <td><span className={`status-pill ${video.status === 'ready' ? 'active' : 'expiring-soon'}`}>{video.status}</span></td>
                <td><div className="action-row"><button type="button" className="table-button" onClick={() => showToast('info', 'Preview Opened', `Previewing ${video.titleName}`)}>Preview</button><button type="button" className="table-button" onClick={() => showToast('success', 'Video Linked', `${video.titleName} linked successfully.`)}>Link</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showUpload ? <div className="modal-scrim" role="presentation" onClick={() => setShowUpload(false)}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="eyebrow">Upload Video</p><h4>Queue a new upload</h4><div className="detail-panel"><p className="muted-copy">The legacy page supports both direct uploads and linked videos. This port keeps the workflow entry point and metadata capture.</p></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => setShowUpload(false)}>Cancel</button><button type="button" className="primary-button" onClick={() => { setShowUpload(false); showToast('success', 'Upload Queued', 'Video upload queued successfully.'); }}>Queue Upload</button></div></div></div> : null}
    </section>
  );
}
