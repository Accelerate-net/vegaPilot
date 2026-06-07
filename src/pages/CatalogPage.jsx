import React, { useMemo, useState, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';
import { catalogItemsDemo } from '../data/adminRemainingDemo';

export default function CatalogPage() {
  const [items, setItems] = useState(catalogItemsDemo);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  // Modals state
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [statusToggleModalOpen, setStatusToggleModalOpen] = useState(false);
  const [selectedItemForToggle, setSelectedItemForToggle] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [newCatalog, setNewCatalog] = useState({});

  const [toasts, setToasts] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  const filtered = useMemo(() => items.filter((item) => {
    if (filterType && item.type !== (filterType === '1' ? 'Course' : 'Exam')) return false;
    if (filterStatus !== '' && String(item.status) !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return [item.title, item.code, item.brief].some((value) => String(value).toLowerCase().includes(query));
  }), [items, searchQuery, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCatalog = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const summary = {
    total: items.length,
    courses: items.filter((item) => item.type === 'Course').length,
    exams: items.filter((item) => item.type === 'Exam').length,
    active: items.filter((item) => item.status === 1).length,
  };

  const getPagesArray = () => {
     let arr = [];
     for(let i=1; i<=totalPages; i++) arr.push(i);
     return arr;
  };
  
  const getPageRange = () => {
      if (filtered.length === 0) return '0';
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, filtered.length);
      return `${start}-${end}`;
  };

  const getTypeLabel = (type) => {
      if (type === '1' || type === 'Course') return 'Course';
      if (type === '2' || type === 'Exam') return 'Exam';
      return type;
  };

  const getStatusLabel = (status) => {
      return status === '1' || status === 1 ? 'Active' : 'Inactive';
  };

  const formatPrice = (price) => {
      return price ? price.toLocaleString('en-IN') : '0';
  };

  const getDiscountPercentage = (item) => {
      if (!item.originalPrice || !item.sellingPrice || item.originalPrice <= item.sellingPrice) return 0;
      return Math.round(((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100);
  };
  
  const calculateDiscountPercentageForNew = () => {
      if (!newCatalog.originalPrice || !newCatalog.sellingPrice || newCatalog.originalPrice <= newCatalog.sellingPrice) return 0;
      return Math.round(((newCatalog.originalPrice - newCatalog.sellingPrice) / newCatalog.originalPrice) * 100);
  };

  const getBadgeClass = (item) => {
      if (item.tagline && item.tagline.toLowerCase().includes('enroll')) return 'cat-badge-admission';
      if (item.type === 'Exam') return 'cat-badge-official';
      return 'cat-badge-offer';
  };

  const getBadgeText = (item) => {
      return item.type === 'Exam' ? 'OFFICIAL' : 'OPEN';
  };

  const toggleCatalogStatus = (item) => {
      setSelectedItemForToggle(item);
      setStatusToggleModalOpen(true);
  };

  const confirmToggleStatus = () => {
      setItems(items.map(entry => entry.id === selectedItemForToggle.id ? { ...entry, status: entry.status === 1 ? 0 : 1 } : entry));
      setStatusToggleModalOpen(false);
      showToast('success', 'Status Updated', `Catalog item status has been updated.`);
  };

  const editCatalog = (item) => {
      setIsEditing(true);
      setNewCatalog({ ...item, type: item.type === 'Course' ? '1' : '2' });
      setCatalogModalOpen(true);
  };

  const addNewCatalog = () => {
      setIsEditing(false);
      setNewCatalog({
          title: '', code: '', brief: '', type: '1', status: 1, 
          originalPrice: '', sellingPrice: '', pageUrl: '', tagline: 'Enroll Now',
          taxItems: []
      });
      setCatalogModalOpen(true);
  };

  const closeCatalogModal = () => {
      setCatalogModalOpen(false);
  };
  
  const saveCatalog = () => {
      if (!newCatalog.title || !newCatalog.code || !newCatalog.brief) {
          showToast('error', 'Validation Error', 'Please fill all required fields.');
          return;
      }
      
      const payload = {
          ...newCatalog,
          type: newCatalog.type === '1' ? 'Course' : 'Exam'
      };
      
      if (isEditing) {
          setItems(items.map(entry => entry.id === payload.id ? payload : entry));
          showToast('success', 'Updated', 'Catalog item updated successfully.');
      } else {
          setItems([{ ...payload, id: 'CR' + Date.now() }, ...items]);
          showToast('success', 'Created', 'New catalog item created.');
      }
      setCatalogModalOpen(false);
  };

  const addTaxItem = () => {
      const taxes = newCatalog.taxItems || [];
      setNewCatalog({
          ...newCatalog,
          taxItems: [...taxes, { type: 'SGST', valueType: 'percentage', value: 9 }]
      });
  };

  const removeTaxItem = (index) => {
      const taxes = [...(newCatalog.taxItems || [])];
      taxes.splice(index, 1);
      setNewCatalog({ ...newCatalog, taxItems: taxes });
  };

  const calculateTotalTax = () => {
      if (!newCatalog.taxItems || !newCatalog.taxItems.length || !newCatalog.sellingPrice) return 0;
      let total = 0;
      newCatalog.taxItems.forEach(tax => {
          if (tax.valueType === 'percentage') {
              total += (newCatalog.sellingPrice * (tax.value || 0)) / 100;
          } else {
              total += (tax.value || 0);
          }
      });
      return parseFloat(total.toFixed(2));
  };

  const calculateFinalAmount = () => {
      const selling = parseFloat(newCatalog.sellingPrice) || 0;
      return (selling + calculateTotalTax()).toFixed(2);
  };

  return (
    <div className="data-table-page">
      <style>{`
      .cat-catalog-grid { display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: flex-start; background-color: #f9f9f9; margin: 0 0 10px 0; gap: 20px; padding: 20px; }
      .cat-catalog-card { width: 100%; max-width: 300px; min-width: 240px; background-color: rgb(255, 255, 255); border-radius: 10px; overflow: hidden; text-align: center; flex: 1 0 0%; box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 8px; transition: transform 0.3s; cursor: pointer; position: relative; display: flex; flex-direction: column; justify-content: flex-start; height: 410px; }
      .cat-catalog-card:hover { transform: scale(1.05); }
      .cat-catalog-image-container { position: relative; }
      .cat-catalog-image { width: 100%; height: 160px; object-fit: cover; }
      .cat-catalog-badge { position: absolute; top: 10px; left: 10px; padding: 5px 10px; font-size: 12px; font-weight: bold; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); z-index: 10; }
      .cat-badge-admission { background-color: #e8f5e9; color: #2e7d32; }
      .cat-badge-official { background-color: #fff3e0; color: #e65100; }
      .cat-badge-offer { background-color: #fce4ec; color: #c2185b; }
      .cat-catalog-content { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
      .cat-catalog-title { font-size: 16px; font-weight: bold; color: #333; margin: 0 0 8px 0; line-height: 1.3em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; text-align: left; }
      .cat-catalog-description { font-size: 14px; color: #666; margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; text-align: left; line-height: 1.4; }
      .cat-catalog-price-section { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; justify-content: flex-start; flex-wrap: wrap; }
      .cat-catalog-price-original { font-size: 14px; color: #999; text-decoration: line-through; }
      .cat-catalog-price-selling { font-size: 20px; font-weight: bold; color: #2e7d32; }
      .cat-catalog-discount-badge { background: #ff5722; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      .cat-catalog-admin-actions { display: flex; gap: 8px; padding: 10px 15px; background: #f5f5f5; border-top: 1px solid #e0e0e0; justify-content: center; }
      .cat-catalog-actions { display: flex; gap: 8px; }
      .cat-catalog-actions .cat-btn { padding: 6px 12px; font-size: 14px; border-radius: 5px; border: none; cursor: pointer; transition: all 0.2s; }
      .cat-btn-edit { background: #2196F3; color: white; }
      .cat-btn-edit:hover { background: #1976D2; }
      .cat-btn-active { background: #9E9E9E; color: white; }
      .cat-btn-active:hover { background: #757575; }
      .cat-btn-inactive { background: #f44336; color: white; }
      .cat-btn-inactive:hover { background: #d32f2f; }
      .cat-catalog-meta { font-size: 11px; color: #999; text-align: left; margin-bottom: 8px; }
      .cat-empty-state { text-align: center; padding: 80px 20px; color: #666; }
      .cat-empty-state i { font-size: 64px; color: #ddd; margin-bottom: 20px; }
      .cat-empty-state h4 { color: #999; margin-bottom: 15px; font-size: 24px; }
      .cat-empty-state p { color: #bbb; font-size: 16px; line-height: 1.6; }
      .cat-modal-body { max-height: 70vh; overflow-y: auto; }
      .cat-skeleton-card { width: 100%; max-width: 300px; min-width: 240px; height: 410px; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); position: relative; flex: 1 0 0%; }
      .cat-skeleton-thumbnail { width: 100%; height: 160px; background: #f0f2f5; position: relative; overflow: hidden; }
      .cat-skeleton-shimmer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%); animation: cat-shimmer 1.5s infinite; transform: translateX(-100%); }
      @keyframes cat-shimmer { 100% { transform: translateX(100%); } }
      .cat-skeleton-content { padding: 15px; display: flex; flex-direction: column; gap: 12px; flex-grow: 1; }
      .cat-skeleton-line { height: 14px; background: #f0f2f5; border-radius: 4px; position: relative; overflow: hidden; }
      .cat-skeleton-line.cat-title { height: 20px; width: 90%; margin-bottom: 5px; }
      .cat-skeleton-line.cat-short { width: 60%; }
      .cat-skeleton-line.cat-medium { width: 80%; }
      .cat-skeleton-line.cat-price { height: 24px; width: 40%; margin-top: 10px; }
      .cat-form-control { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
      .cat-text-muted { color: #888; font-size: 12px; display: block; margin-top: 4px; }
      .cat-alert { padding: 15px; border-radius: 8px; }
      .cat-alert-warning { background: #fff3cd; border: 1px solid #ffeeba; }
      `}</style>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

      {/* Page Header Section */}
      <div className="page-header-section">
         <div className="page-header-title-group">
            <span className="page-header-icon-box"><i className="fa fa-th-large" /></span>
            <div>
               <h2>Catalog Management</h2>
               <p>Manage catalog entries, pricing, status, and landing page metadata.</p>
            </div>
         </div>
         <button type="button" className="page-action-button" onClick={addNewCatalog}>
            <i className="ti ti-plus" /> Add New Catalog Item
         </button>
      </div>

      <div className="cat-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
         <div className="cat-stat-card" style={{ background: 'white', padding: '18px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e6edf0' }}>
            <div className="cat-stat-icon cat-blue" style={{ width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: '#4f46e5', background: '#e7e9fd' }}>
               <i className="ti ti-layers"></i>
            </div>
            <div className="cat-stat-info" style={{ flex: 1 }}>
               <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{summary.total}</h3>
               <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, margin: '4px 0 0' }}>Total Catalog Items</p>
            </div>
         </div>
         <div className="cat-stat-card" style={{ background: 'white', padding: '18px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e6edf0' }}>
            <div className="cat-stat-icon cat-teal" style={{ width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: '#006073', background: '#e7f5f7' }}>
               <i className="ti ti-book"></i>
            </div>
            <div className="cat-stat-info" style={{ flex: 1 }}>
               <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{summary.courses}</h3>
               <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, margin: '4px 0 0' }}>Courses Available</p>
            </div>
         </div>
         <div className="cat-stat-card" style={{ background: 'white', padding: '18px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e6edf0' }}>
            <div className="cat-stat-icon cat-orange" style={{ width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: '#856404', background: '#fff3cd' }}>
               <i className="ti ti-write"></i>
            </div>
            <div className="cat-stat-info" style={{ flex: 1 }}>
               <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{summary.exams}</h3>
               <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, margin: '4px 0 0' }}>Exams Available</p>
            </div>
         </div>
         <div className="cat-stat-card" style={{ background: 'white', padding: '18px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e6edf0' }}>
            <div className="cat-stat-icon cat-green" style={{ width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: '#155724', background: '#d4edda' }}>
               <i className="ti ti-check"></i>
            </div>
            <div className="cat-stat-info" style={{ flex: 1 }}>
               <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{summary.active}</h3>
               <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, margin: '4px 0 0' }}>Active Items</p>
            </div>
         </div>
      </div>

      <div className="filter-bar">
         <div className="search-wrapper">
            <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'} search-icon`} onClick={() => setSearchQuery('')} aria-hidden="true"></i>
            <input type="text" className="search-input" placeholder="Search catalog items by title, code, or description..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
         </div>

         <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} aria-label="Filter by type">
            <option value="">All Types</option>
            <option value="1">Course</option>
            <option value="2">Exam</option>
         </select>

         <select className="filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
         </select>
      </div>

      {isLoading ? (
          <div className="cat-catalog-grid">
             {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="cat-skeleton-card">
                   <div className="cat-skeleton-thumbnail"><div className="cat-skeleton-shimmer"></div></div>
                   <div className="cat-skeleton-content">
                      <div className="cat-skeleton-line cat-title"><div className="cat-skeleton-shimmer"></div></div>
                      <div className="cat-skeleton-line cat-medium"><div className="cat-skeleton-shimmer"></div></div>
                      <div className="cat-skeleton-line cat-short"><div className="cat-skeleton-shimmer"></div></div>
                      <div className="cat-skeleton-line cat-price"><div className="cat-skeleton-shimmer"></div></div>
                   </div>
                </div>
             ))}
          </div>
      ) : filtered.length > 0 ? (
          <>
             <div className="cat-catalog-grid">
                {paginatedCatalog.map(item => (
                   <div key={item.id} className="cat-catalog-card">
                      <div className="cat-catalog-image-container">
                         <a href={item.pageUrl} target="_blank" rel="noreferrer">
                            <img src={item.displayImage || 'assets/img/default_catalog.png'} alt={item.title} className="cat-catalog-image" />
                         </a>
                         <span className={`cat-catalog-badge ${getBadgeClass(item)}`}>{item.tagline || getBadgeText(item)}</span>
                      </div>
                      
                      <div className="cat-catalog-content">
                         <div>
                            <h3 className="cat-catalog-title">{item.title}</h3>
                            <p className="cat-catalog-description">{item.brief}</p>
                            <div className="cat-catalog-meta">{item.code} • {getTypeLabel(item.type)}</div>
                         </div>
                         <div className="cat-catalog-price-section">
                            {item.originalPrice > item.sellingPrice && (
                               <span className="cat-catalog-price-original">₹{formatPrice(item.originalPrice)}</span>
                            )}
                            <span className="cat-catalog-price-selling">₹{formatPrice(item.sellingPrice)}</span>
                            {item.originalPrice > item.sellingPrice && (
                               <span className="cat-catalog-discount-badge">{getDiscountPercentage(item)}% OFF</span>
                            )}
                         </div>
                      </div>

                      <div className="cat-catalog-admin-actions">
                         <div className="cat-catalog-actions">
                            <button className={`cat-btn ${item.status === 1 ? 'cat-btn-active' : 'cat-btn-inactive'}`} onClick={(e) => { e.stopPropagation(); toggleCatalogStatus(item); }} title={item.status === 1 ? 'Disable' : 'Enable'}>
                               <i className={`ti ${item.status === 1 ? 'ti-eye' : 'ti-eye-off'}`}></i>
                            </button>
                            <button className="cat-btn cat-btn-edit" onClick={(e) => { e.stopPropagation(); editCatalog(item); }} title="Edit">
                               <i className="ti ti-pencil"></i>
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="pagination-container">
                <div className="pagination-info">
                   <span>Showing {getPageRange()} of {filtered.length} items</span>
                </div>
                <div className="pagination-controls">
                   <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <i className="ti ti-angle-left"></i> Previous
                   </button>
                   {getPagesArray().map(page => (
                      <button key={page} className={`pagination-btn ${page === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                   ))}
                   <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                      Next <i className="ti ti-angle-right"></i>
                   </button>
                </div>
             </div>
          </>
      ) : (
          <div className="cat-empty-state">
             <i className="ti ti-shopping-cart"></i>
             <h4>No Catalog Items Found</h4>
             {searchQuery || filterType || filterStatus !== '' ? (
                 <p>No catalog items match your current search criteria or filters. <a href="#!" onClick={() => { setSearchQuery(''); setFilterType(''); setFilterStatus(''); }}>Clear all filters</a> to see all items.</p>
             ) : (
                 <p>No catalog items have been created yet. <a href="#!" onClick={addNewCatalog}>Create your first catalog item</a> to get started.</p>
             )}
          </div>
      )}

      {/* Modals using generic crispr-modal matching classes, we'll implement inline */}
      {catalogModalOpen && (
         <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={closeCatalogModal}>
            <div className="modal-card large" style={{ background: '#fff', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                     <i className={`ti ${isEditing ? 'ti-pencil' : 'ti-plus'}`} style={{ marginRight: '10px' }}></i>
                     {isEditing ? 'Edit Catalog Item' : 'New Catalog Item'}
                  </h3>
                  <button onClick={closeCatalogModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>
                     <i className="ti ti-close"></i>
                  </button>
               </div>
               
               <div className="cat-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                  <div style={{ marginBottom: '20px' }}>
                     <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#333' }}>Basic Information</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                           <label>Title <span style={{ color: 'red' }}>*</span></label>
                           <input type="text" className="cat-form-control" value={newCatalog.title} onChange={e => setNewCatalog({...newCatalog, title: e.target.value})} placeholder="e.g., IAT 2026 – Exclusive 1 Year Course" />
                           <small className="cat-text-muted">Main title of the catalog item</small>
                        </div>
                        <div>
                           <label>Code <span style={{ color: 'red' }}>*</span></label>
                           <input type="text" className="cat-form-control" value={newCatalog.code} onChange={e => setNewCatalog({...newCatalog, code: e.target.value})} placeholder="e.g., IAT2026" />
                           <small className="cat-text-muted">Unique identifier</small>
                        </div>
                     </div>
                     <div style={{ marginTop: '15px' }}>
                        <label>Brief Description <span style={{ color: 'red' }}>*</span></label>
                        <textarea className="cat-form-control" rows="2" style={{ height: 'auto' }} value={newCatalog.brief} onChange={e => setNewCatalog({...newCatalog, brief: e.target.value})} placeholder="e.g., Dedicated coaching for IAT 2026"></textarea>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div>
                           <label>Page URL <span style={{ color: 'red' }}>*</span></label>
                           <input type="text" className="cat-form-control" value={newCatalog.pageUrl} onChange={e => setNewCatalog({...newCatalog, pageUrl: e.target.value})} placeholder="https://crisprlearning.com/courses/1-year-course/" />
                        </div>
                        <div>
                           <label>Tagline <span style={{ color: 'red' }}>*</span></label>
                           <input type="text" className="cat-form-control" value={newCatalog.tagline} onChange={e => setNewCatalog({...newCatalog, tagline: e.target.value})} placeholder="e.g., Enroll Now" />
                        </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div>
                           <label>Type</label>
                           <select className="cat-form-control" value={newCatalog.type} onChange={e => setNewCatalog({...newCatalog, type: e.target.value})}>
                              <option value="1">Course</option>
                              <option value="2">Exam</option>
                           </select>
                        </div>
                        <div>
                           <label>Status</label>
                           <select className="cat-form-control" value={newCatalog.status} onChange={e => setNewCatalog({...newCatalog, status: Number(e.target.value)})}>
                              <option value="1">Active</option>
                              <option value="0">Inactive</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                     <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#333' }}>Display Image</h4>
                     <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ width: '150px', height: '100px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {newCatalog.displayImage ? <img src={newCatalog.displayImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <i className="ti ti-image" style={{ fontSize: '32px', color: '#ccc' }}></i>}
                        </div>
                        <div style={{ flex: 1 }}>
                           <label>Or Image URL</label>
                           <input type="text" className="cat-form-control" value={newCatalog.displayImage || ''} onChange={e => setNewCatalog({...newCatalog, displayImage: e.target.value})} placeholder="https://example.com/image.jpg" />
                        </div>
                     </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                     <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#333' }}>Pricing Information</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div>
                           <label>Original Price (₹) <span style={{ color: 'red' }}>*</span></label>
                           <input type="number" className="cat-form-control" value={newCatalog.originalPrice} onChange={e => setNewCatalog({...newCatalog, originalPrice: Number(e.target.value)})} />
                        </div>
                        <div>
                           <label>Selling Price (₹) <span style={{ color: 'red' }}>*</span></label>
                           <input type="number" className="cat-form-control" value={newCatalog.sellingPrice} onChange={e => setNewCatalog({...newCatalog, sellingPrice: Number(e.target.value)})} />
                        </div>
                        <div>
                           <label>Discount Percentage</label>
                           <input type="text" className="cat-form-control" value={`${calculateDiscountPercentageForNew()}%`} disabled />
                        </div>
                     </div>
                     <div className="cat-alert cat-alert-warning" style={{ marginTop: '15px' }}>
                        <strong style={{ color: '#856404' }}>💡 Pricing Preview:</strong><br />
                        {newCatalog.originalPrice && newCatalog.sellingPrice ? (
                           <span style={{ color: '#856404' }}>
                              Original: <span style={{ textDecoration: 'line-through' }}>₹{newCatalog.originalPrice}</span>
                              → Selling: <strong>₹{newCatalog.sellingPrice}</strong> 
                              {newCatalog.originalPrice > newCatalog.sellingPrice && ` (Save ₹${newCatalog.originalPrice - newCatalog.sellingPrice})`}
                           </span>
                        ) : (
                           <span style={{ color: '#856404' }}>Enter prices to see preview</span>
                        )}
                     </div>
                  </div>

               </div>
               
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <button className="cat-btn cat-btn-default" onClick={closeCatalogModal}><i className="ti ti-close"></i> Cancel</button>
                  <button className="cat-btn" style={{ background: '#006073', color: 'white' }} onClick={saveCatalog}><i className="ti ti-check"></i> {isEditing ? 'Update' : 'Create'} Catalog Item</button>
               </div>
            </div>
         </div>
      )}

      {/* Status Toggle Modal */}
      {statusToggleModalOpen && (
         <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setStatusToggleModalOpen(false)}>
            <div className="modal-card" style={{ maxWidth: '450px', background: '#fff', borderRadius: '12px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
               <div style={{ background: selectedItemForToggle.status === 1 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #006073 0%, #005a6b 100%)', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}><i className="ti ti-alert" style={{ marginRight: '10px' }}></i> Confirm Action</h3>
                  <button onClick={() => setStatusToggleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}><i className="ti ti-close"></i></button>
               </div>
               <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px', color: selectedItemForToggle.status === 1 ? '#ef4444' : '#ff9800' }}>
                     <i className={`ti ${selectedItemForToggle.status === 1 ? 'ti-alert' : 'ti-info-alt'}`}></i>
                  </div>
                  <h4 style={{ marginBottom: '15px', color: '#333', fontWeight: 600 }}>
                     {selectedItemForToggle.status === 1 ? 'Disable Catalog Item?' : 'Enable Catalog Item?'}
                  </h4>
                  <p style={{ color: '#666', margin: 0 }}>
                     {selectedItemForToggle.status === 1 ? 'Do you really want to Disable this catalog item? It would make it unavailable for any users to purchase this.' : 'Do you really want to Enable this catalog item back? Users would be able to purchase this item.'}
                  </p>
               </div>
               <div style={{ background: '#f5f5f5', padding: '15px 20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button className="cat-btn cat-btn-default" onClick={() => setStatusToggleModalOpen(false)}>Cancel</button>
                  <button className="cat-btn" style={{ background: selectedItemForToggle.status === 1 ? '#ef4444' : '#006073', color: 'white' }} onClick={confirmToggleStatus}>
                     Confirm
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
