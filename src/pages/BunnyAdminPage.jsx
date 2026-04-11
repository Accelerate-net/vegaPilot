import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { bunnyFoldersDemo, bunnyVideosDemo } from '../data/adminRemainingDemo';

export default function BunnyAdminPage() {
  const [folders, setFolders] = useState(bunnyFoldersDemo);
  const [videos, setVideos] = useState(bunnyVideosDemo);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  const filteredVideos = useMemo(() => videos.filter((video) => {
    if (selectedFolder !== 'all' && video.folderId !== selectedFolder) return false;
    if (!searchQuery.trim()) return true;
    return video.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
  }), [videos, selectedFolder, searchQuery]);

  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row"><div><p className="eyebrow">Video Hosting</p><h3>Bunny Admin</h3><p className="muted-copy">Folder-oriented Bunny.net management with upload, rename, and delete workflows.</p></div><div className="action-row"><button type="button" className="ghost-button" onClick={() => { const name = `Folder ${folders.length + 1}`; setFolders((current) => [...current, { id: `F-${Date.now()}`, name, description: 'New folder', videoCount: 0 }]); showToast('success', 'Folder Created', `${name} created successfully.`); }}>Create Folder</button><button type="button" className="primary-button" onClick={() => showToast('success', 'Upload Opened', 'Upload dialog opened.')}>Upload Videos</button></div></div>
      <div className="course-layout">
        <div className="detail-panel">
          <h4>Folders</h4>
          <div className="stack-grid">
            <button type="button" className={`outline-trigger ${selectedFolder === 'all' ? 'active-page' : ''}`} onClick={() => setSelectedFolder('all')}>All Folders</button>
            {folders.map((folder) => <button key={folder.id} type="button" className={`outline-trigger ${selectedFolder === folder.id ? 'active-page' : ''}`} onClick={() => setSelectedFolder(folder.id)}>{folder.name} · {folder.videoCount}</button>)}
          </div>
        </div>
        <div className="detail-panel">
          <div className="toolbar-row"><div className="search-shell"><input className="search-input" placeholder="Search videos..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div></div>
          <div className="selection-grid">
            {filteredVideos.map((video) => <div key={video.id} className="selection-card static"><strong>{video.title}</strong><span className="student-subtle">{video.id}</span><div className="chip-row"><span className={`status-pill ${video.status === 'ready' ? 'active' : 'expiring-soon'}`}>{video.status}</span><span className="status-pill">{video.duration}s</span></div><div className="action-row"><button type="button" className="table-button" onClick={() => showToast('info', 'Rename Ready', `Rename ${video.title}`)}>Rename</button><button type="button" className="table-button danger" onClick={() => { setVideos((current) => current.filter((entry) => entry.id !== video.id)); showToast('success', 'Video Deleted', `${video.title} deleted.`); }}>Delete</button></div></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
