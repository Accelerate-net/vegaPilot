import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { catalogItemsDemo } from '../data/adminRemainingDemo';

export default function CatalogPage() {
  const [items, setItems] = useState(catalogItemsDemo);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  const filtered = useMemo(() => items.filter((item) => {
    if (filterType && item.type !== filterType) return false;
    if (filterStatus !== '' && String(item.status) !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return [item.title, item.code, item.brief].some((value) => String(value).toLowerCase().includes(query));
  }), [items, searchQuery, filterType, filterStatus]);

  const summary = {
    total: items.length,
    courses: items.filter((item) => item.type === 'Course').length,
    exams: items.filter((item) => item.type === 'Exam').length,
    active: items.filter((item) => item.status === 1).length,
  };

  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Catalog</p>
          <h3>Catalog Management</h3>
          <p className="muted-copy">Manage catalog entries, pricing, status, and landing page metadata.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setEditingItem({ title: '', code: '', brief: '', type: 'Course', originalPrice: 0, sellingPrice: 0, status: 1, pageUrl: '', tagline: 'Enroll Now' })}>Add Catalog Item</button>
      </div>
      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Items</h4><p className="big-stat">{summary.total}</p></div>
        <div className="detail-panel"><h4>Courses</h4><p className="big-stat">{summary.courses}</p></div>
        <div className="detail-panel"><h4>Exams</h4><p className="big-stat">{summary.exams}</p></div>
        <div className="detail-panel"><h4>Active</h4><p className="big-stat">{summary.active}</p></div>
      </div>
      <div className="report-filter-grid">
        <div className="search-shell"><input className="search-input" placeholder="Search catalog items..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
        <select className="filter-select" value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="">All Types</option><option value="Course">Course</option><option value="Exam">Exam</option></select>
        <select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">All Status</option><option value="1">Active</option><option value="0">Inactive</option></select>
      </div>
      <div className="selection-grid">
        {filtered.map((item) => (
          <div key={item.id} className="selection-card static">
            <strong>{item.title}</strong>
            <span className="student-subtle">{item.code} · {item.type}</span>
            <p className="muted-copy">{item.brief}</p>
            <div className="chip-row">
              <span className={`status-pill ${item.status === 1 ? 'active' : 'inactive'}`}>{item.status === 1 ? 'Active' : 'Inactive'}</span>
              <span className="status-pill">Rs. {item.sellingPrice}</span>
            </div>
            <div className="action-row">
              <button type="button" className="table-button" onClick={() => setEditingItem(item)}>Edit</button>
              <button type="button" className="table-button" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: entry.status === 1 ? 0 : 1 } : entry))}>{item.status === 1 ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
      {editingItem ? (
        <div className="modal-scrim" role="presentation" onClick={() => setEditingItem(null)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row"><div><p className="eyebrow">Catalog Item</p><h4>{editingItem.id ? 'Edit Item' : 'Create Item'}</h4></div><button type="button" className="ghost-button" onClick={() => setEditingItem(null)}>Close</button></div>
            <div className="form-grid">
              <label><span>Title</span><input className="search-input" value={editingItem.title} onChange={(event) => setEditingItem((current) => ({ ...current, title: event.target.value }))} /></label>
              <label><span>Code</span><input className="search-input" value={editingItem.code} onChange={(event) => setEditingItem((current) => ({ ...current, code: event.target.value }))} /></label>
              <label className="full-span"><span>Brief</span><textarea className="search-input textarea-like" value={editingItem.brief} onChange={(event) => setEditingItem((current) => ({ ...current, brief: event.target.value }))} /></label>
              <label><span>Type</span><select className="filter-select" value={editingItem.type} onChange={(event) => setEditingItem((current) => ({ ...current, type: event.target.value }))}><option value="Course">Course</option><option value="Exam">Exam</option></select></label>
              <label><span>Status</span><select className="filter-select" value={editingItem.status} onChange={(event) => setEditingItem((current) => ({ ...current, status: Number(event.target.value) }))}><option value="1">Active</option><option value="0">Inactive</option></select></label>
              <label><span>Original Price</span><input className="search-input" type="number" value={editingItem.originalPrice} onChange={(event) => setEditingItem((current) => ({ ...current, originalPrice: Number(event.target.value) }))} /></label>
              <label><span>Selling Price</span><input className="search-input" type="number" value={editingItem.sellingPrice} onChange={(event) => setEditingItem((current) => ({ ...current, sellingPrice: Number(event.target.value) }))} /></label>
            </div>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setEditingItem(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { setItems((current) => editingItem.id ? current.map((entry) => entry.id === editingItem.id ? editingItem : entry) : [{ ...editingItem, id: Date.now() }, ...current]); setEditingItem(null); showToast('success', 'Catalog Saved', 'Catalog item saved successfully.'); }}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
