import React, { useState, useMemo, useEffect, useRef } from 'react';
import ToastRegion from '../components/ToastRegion';
import { vouchersDemo, autoEnrollCoursesDemo, catalogItemsDemo } from '../data/adminRemainingDemo';

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}

function VoucherKebabMenu({ voucher, onViewUsers, onRevoke }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canViewUsers = voucher.limitedUsers;
  const canRevoke = voucher.status === 'active';

  return (
    <div className="kebab-menu-container" ref={ref}>
      <button
        type="button"
        className="kebab-button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        <i className="ti ti-more-alt" />
      </button>
      <div className={`kebab-dropdown${open ? ' active' : ''}`}>
        {canViewUsers && (
          <button type="button" className="kebab-dropdown-item" onClick={() => { setOpen(false); onViewUsers(voucher); }}>
            <i className="ti ti-user" /> View Users
          </button>
        )}
        {canRevoke && (
          <button type="button" className="kebab-dropdown-item danger-action" onClick={() => { setOpen(false); onRevoke(voucher); }}>
            <i className="ti ti-ban" /> Revoke Code
          </button>
        )}
        {!canViewUsers && !canRevoke && (
          <span className="kebab-dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
            No actions available
          </span>
        )}
      </div>
    </div>
  );
}

export default function WebContentManagerPage() {
  const [toasts, setToasts] = useState([]);
  
  // States
  const [vouchers, setVouchers] = useState(vouchersDemo);
  const [autoEnrollCourses, setAutoEnrollCourses] = useState(autoEnrollCoursesDemo);
  const [discountStatusFilter, setDiscountStatusFilter] = useState('all');
  
  // Discount Pagination
  const [discountPage, setDiscountPage] = useState(1);
  const [discountsPerPage, setDiscountsPerPage] = useState(20);

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([...autoEnrollCourses]);

  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ code: '', type: 'percentage', value: '', validUntil: '', limitUsers: false });

  // User selection for limited discount codes
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const sampleUsers = [
    { id: 'U001', name: 'Aarav Nair', phone: '9876500001', email: 'aarav@test.com' },
    { id: 'U002', name: 'Diya Joseph', phone: '9876500002', email: 'diya@test.com' },
    { id: 'U003', name: 'Sneha Menon', phone: '9876500003', email: 'sneha@test.com' },
    { id: 'U004', name: 'Rahul Prasad', phone: '9876500004', email: 'rahul@test.com' },
    { id: 'U005', name: 'Amit Patel', phone: '9876500005', email: 'amit@test.com' },
  ];
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return [];
    const q = userSearchQuery.toLowerCase();
    return sampleUsers.filter(u => !selectedUsers.some(s => s.id === u.id) && (u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q)));
  }, [userSearchQuery, selectedUsers]);
  
  const [viewUsersModalOpen, setViewUsersModalOpen] = useState(false);
  const [selectedVoucherForUsers, setSelectedVoucherForUsers] = useState(null);
  
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [voucherToRevoke, setVoucherToRevoke] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  // Auto-Enrollment Logic
  const handleCourseSelectionToggle = (course) => {
    const isSelected = selectedCourses.some(c => c.code === course.code);
    if (isSelected) {
      setSelectedCourses(selectedCourses.filter(c => c.code !== course.code));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const saveAutoEnrollCourses = () => {
    setAutoEnrollCourses([...selectedCourses]);
    showToast('success', 'Saved', 'Auto-enrollment courses saved successfully.');
  };

  const filteredCatalogForEnrollment = useMemo(() => {
    if (!courseSearch) return catalogItemsDemo;
    return catalogItemsDemo.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()) || c.code.toLowerCase().includes(courseSearch.toLowerCase()));
  }, [courseSearch]);

  // Discount Logic
  const filteredVouchers = useMemo(() => {
    let result = vouchers;
    if (discountStatusFilter === 'active') {
      result = result.filter(v => v.status === 'active');
    }
    return result;
  }, [vouchers, discountStatusFilter]);

  const totalDiscountPages = Math.ceil(filteredVouchers.length / discountsPerPage) || 1;
  const paginatedVouchers = filteredVouchers.slice((discountPage - 1) * discountsPerPage, discountPage * discountsPerPage);

  const handleCreateDiscount = (e) => {
    e.preventDefault();
    if (!newDiscount.code || !newDiscount.value || !newDiscount.validUntil) {
       showToast('error', 'Error', 'Please fill all required fields');
       return;
    }
    const created = {
      id: 'VOC-' + Date.now(),
      code: newDiscount.code.toUpperCase(),
      title: 'Custom Discount',
      amountType: newDiscount.type,
      amount: Number(newDiscount.value),
      status: 'active',
      validUntil: newDiscount.validUntil,
      limitedUsers: newDiscount.limitUsers,
      users: []
    };
    setVouchers([created, ...vouchers]);
    setDiscountModalOpen(false);
    showToast('success', 'Created', 'New discount code added.');
  };

  const handleRevokeConfirm = () => {
    setVouchers(vouchers.map(v => v.id === voucherToRevoke.id ? { ...v, status: 'revoked' } : v));
    setRevokeModalOpen(false);
    showToast('success', 'Revoked', 'Discount code has been revoked.');
  };

  const openViewUsers = (voucher) => {
    setSelectedVoucherForUsers(voucher);
    setViewUsersModalOpen(true);
  };

  return (
    <div className="container-fluid data-table-page" style={{ paddingTop: '1%' }}>
        <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

        {/* Auto-Enrollment Section */}
        <div className="wcm-section-card">
            <div className="wcm-section-header">
                <h2 className="wcm-section-title"><i className="ti ti-user" style={{ marginRight: '10px' }}></i>New User Auto-Enrollment</h2>
                <button className="wcm-btn wcm-btn-primary-custom" onClick={saveAutoEnrollCourses}>
                    <i className="ti ti-save"></i> Save Changes
                </button>
            </div>

            <div className="wcm-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontWeight: 600, color: '#4b5563', margin: 0 }}>Selected Courses</label>
                    <button className="wcm-btn wcm-btn-default" style={{ border: '1px solid #d1d5db', color: '#4b5563' }} onClick={() => setEnrollModalOpen(true)}>
                        <i className="ti ti-plus"></i> Select Courses
                    </button>
                </div>

                <div className="wcm-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(30%, 1fr))' }}>
                    {autoEnrollCourses.length > 0 ? autoEnrollCourses.map(course => (
                       <div key={course.code} className="wcm-course-card" style={{ cursor: 'default', borderColor: '#006073', background: '#e5faff' }}>
                           <div className="wcm-course-icon" style={{ background: '#006073', color: 'white' }}><i className="ti ti-book"></i></div>
                           <div>
                               <strong>{course.title || course.code}</strong>
                               <div style={{ fontSize: '12px', color: '#666' }}>{course.code}</div>
                           </div>
                       </div>
                    )) : (
                       <div style={{ padding: '30px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#6b7280', textAlign: 'center', gridColumn: '1 / -1' }}>
                           <i className="ti ti-book" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                           No courses selected for auto-enrollment.
                       </div>
                    )}
                </div>
            </div>
        </div>

        {/* Discount Codes Section */}
        <div className="wcm-section-card">
            <div className="wcm-section-header">
                <h2 className="wcm-section-title"><i className="ti ti-ticket" style={{ marginRight: '10px' }}></i>Discount Codes</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select id="wcm-statusFilter" style={{ padding: '8px 35px 8px 15px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', color: '#4b5563', fontSize: '14px', fontWeight: 500 }} value={discountStatusFilter} onChange={(e) => { setDiscountStatusFilter(e.target.value); setDiscountPage(1); }}>
                        <option value="all">All Codes</option>
                        <option value="active">Active Only</option>
                    </select>
                    <button className="wcm-btn wcm-btn-success-custom" onClick={() => { setNewDiscount({ code: '', type: 'percentage', value: '', validUntil: '', limitUsers: false }); setDiscountModalOpen(true); }}>
                        <i className="ti ti-plus"></i> Add New Code
                    </button>
                </div>
            </div>

            <div className="students-table-container">
                <table className={`students-table ${isLoading ? 'thead-loading' : ''}`}>
                    <thead>
                        <tr>
                            <th>Discount Code</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Valid Until</th>
                            <th>Usage Limit</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    {isLoading ? (
                    <tbody>
                        {Array.from({ length: 8 }, (_, i) => (
                            <tr key={`sk-${i}`}>
                                {Array.from({ length: 7 }, (_, j) => (
                                    <td key={j}><div className="table-skeleton medium" /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    ) : (
                    <tbody>
                        {paginatedVouchers.map(v => (
                            <tr key={v.id}>
                                <td><strong>{v.code}</strong><br /><small style={{ color: '#666' }}>{v.title}</small></td>
                                <td>{v.amountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                                <td>{v.amountType === 'percentage' ? `${v.amount}%` : `₹${v.amount}`}</td>
                                <td>{new Date(v.validUntil).toLocaleDateString()}</td>
                                <td>{v.limitedUsers ? `${v.users.length} Users` : 'Unlimited'}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`status-pill status-${v.status === 'active' ? 'active' : 'inactive'}`}>
                                        {v.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <VoucherKebabMenu
                                        voucher={v}
                                        onViewUsers={openViewUsers}
                                        onRevoke={(voucher) => { setVoucherToRevoke(voucher); setRevokeModalOpen(true); }}
                                    />
                                </td>
                            </tr>
                        ))}
                        {paginatedVouchers.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No discount codes found.</td></tr>
                        )}
                    </tbody>
                    )}
                </table>

                {filteredVouchers.length > 0 && (
                    <div className="pagination-container">
                        <div className="pagination-info">
                            <span>Showing {(discountPage - 1) * discountsPerPage + 1} to {Math.min(discountPage * discountsPerPage, filteredVouchers.length)} of {filteredVouchers.length} entries</span>
                            <select
                                className="page-size-select"
                                value={discountsPerPage}
                                onChange={(e) => { setDiscountsPerPage(Number(e.target.value)); setDiscountPage(1); }}
                            >
                                {[5, 10, 20, 50, 100].map((size) => <option key={size} value={size}>Show {size}</option>)}
                            </select>
                        </div>
                        <div className="pagination-controls">
                            <button type="button" className="pagination-btn" onClick={() => setDiscountPage(p => Math.max(1, p - 1))} disabled={discountPage === 1}>
                                <i className="ti ti-angle-left"></i> Previous
                            </button>
                            {getPageNumbers(discountPage, totalDiscountPages).map((page, idx) => (
                                page === '...'
                                    ? <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                                    : <button key={page} type="button" className={`pagination-btn ${discountPage === page ? 'active' : ''}`} onClick={() => setDiscountPage(page)}>{page}</button>
                            ))}
                            <button type="button" className="pagination-btn" onClick={() => setDiscountPage(p => Math.min(totalDiscountPages, p + 1))} disabled={discountPage >= totalDiscountPages}>
                                Next <i className="ti ti-angle-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Enroll Modal */}
        {enrollModalOpen && (
            <div className="crispr-modal-backdrop active" onClick={() => setEnrollModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '800px', width: '100%' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header">
                        <h3>Select Courses</h3>
                        <button className="crispr-modal-close" onClick={() => setEnrollModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    <div className="crispr-modal-body" style={{ padding: 0 }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                            <input type="text" className="wcm-form-control" placeholder="Search courses by name or code..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px' }}>
                            <div className="wcm-course-grid">
                                {filteredCatalogForEnrollment.map(course => {
                                    const checked = selectedCourses.some(c => c.code === course.code);
                                    return (
                                       <label key={course.code} style={{ margin: 0, fontWeight: 'normal' }}>
                                           <input type="checkbox" className="wcm-course-checkbox" checked={checked} onChange={() => handleCourseSelectionToggle(course)} />
                                           <div className="wcm-course-card">
                                               <div className="wcm-course-icon"><i className="ti ti-book"></i></div>
                                               <div>
                                                   <strong>{course.title}</strong>
                                                   <div style={{ fontSize: '12px', color: '#666' }}>{course.code}</div>
                                               </div>
                                           </div>
                                       </label>
                                    );
                                })}
                                {filteredCatalogForEnrollment.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', gridColumn: '1 / -1' }}>
                                        <i className="ti ti-search" style={{ fontSize: '48px', marginBottom: '15px', display: 'block', opacity: 0.5 }}></i>
                                        <p style={{ margin: 0 }}>No courses found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="crispr-modal-footer">
                        <button type="button" className="btn btn-default" onClick={() => setEnrollModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn wcm-btn-primary-custom" onClick={() => setEnrollModalOpen(false)}>Confirm Selection</button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Discount Modal */}
        {discountModalOpen && (
            <div className="crispr-modal-backdrop active" onClick={() => setDiscountModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header">
                        <h3>Add Discount Code</h3>
                        <button className="crispr-modal-close" onClick={() => setDiscountModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    
                    <div className="crispr-modal-body">
                        <form id="wcmDiscountForm" onSubmit={handleCreateDiscount}>
                            <div style={{ marginBottom: '15px' }}>
                                <label><i className="ti ti-tag" style={{ marginRight: '5px' }}></i>Discount Code <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="wcm-form-control" value={newDiscount.code} onChange={e => setNewDiscount({...newDiscount, code: e.target.value})} placeholder="e.g. WELCOME20" required style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 600 }} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label><i className="ti ti-settings" style={{ marginRight: '5px' }}></i>Discount Type</label>
                                    <select className="wcm-form-control" value={newDiscount.type} onChange={e => setNewDiscount({...newDiscount, type: e.target.value})}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label><i className="ti ti-money" style={{ marginRight: '5px' }}></i>Discount Value <span style={{ color: 'red' }}>*</span></label>
                                    <input type="number" className="wcm-form-control" value={newDiscount.value} onChange={e => setNewDiscount({...newDiscount, value: e.target.value})} required min="0" placeholder="0" />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label><i className="ti ti-calendar" style={{ marginRight: '5px' }}></i>Valid Until <span style={{ color: 'red' }}>*</span></label>
                                    <input type="date" className="wcm-form-control" value={newDiscount.validUntil} onChange={e => setNewDiscount({...newDiscount, validUntil: e.target.value})} required />
                                </div>
                            </div>

                            <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', margin: 0, fontWeight: 600, color: '#475569' }}>
                                     <input type="checkbox" checked={newDiscount.limitUsers} onChange={e => { setNewDiscount({...newDiscount, limitUsers: e.target.checked}); if (!e.target.checked) { setSelectedUsers([]); setUserSearchQuery(''); } }} style={{ margin: 0, width: '18px', height: '18px', cursor: 'pointer' }} />
                                     Limit to Specific User(s)
                                 </label>

                                 {/* User search section - shown when limitUsers is checked */}
                                 {newDiscount.limitUsers && (
                                     <div style={{ paddingLeft: '5px', marginTop: '15px' }}>
                                         {/* Search Input */}
                                         <div style={{ position: 'relative', marginBottom: '10px' }}>
                                             <input type="text" className="form-control" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Search user by name, email, or mobile..." style={{ paddingLeft: '40px', width: '100%', padding: '12px 16px 12px 40px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '14px' }} />
                                             <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '16px' }}></i>
                                         </div>

                                         {/* Selected Users Tags */}
                                         {selectedUsers.length > 0 && (
                                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                                 {selectedUsers.map(u => (
                                                     <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#e0f2f1', color: '#006073', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
                                                         {u.name}
                                                         <button type="button" onClick={() => setSelectedUsers(selectedUsers.filter(s => s.id !== u.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#dc2626', fontSize: '14px', lineHeight: 1 }}>
                                                             <i className="ti ti-close"></i>
                                                         </button>
                                                     </span>
                                                 ))}
                                             </div>
                                         )}

                                         {/* Search Results Dropdown */}
                                         {filteredUsers.length > 0 && (
                                             <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', background: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                 {filteredUsers.map(u => (
                                                     <div key={u.id} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }} className="wcm-user-result-hover" onClick={() => { setSelectedUsers([...selectedUsers, u]); setUserSearchQuery(''); }}>
                                                         <div>
                                                             <strong style={{ fontSize: '14px' }}>{u.name}</strong>
                                                             <div style={{ fontSize: '12px', color: '#6b7280' }}>{u.email} · {u.phone}</div>
                                                         </div>
                                                         <i className="ti ti-plus" style={{ color: '#006073' }}></i>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}

                                         {userSearchQuery && filteredUsers.length === 0 && (
                                             <div style={{ textAlign: 'center', padding: '15px', color: '#9ca3af', fontSize: '13px' }}>
                                                 No users found matching "{userSearchQuery}"
                                             </div>
                                         )}
                                     </div>
                                 )}
                            </div>
                        </form>
                    </div>
                    <div className="crispr-modal-footer">
                        <button type="button" className="btn btn-default" onClick={() => setDiscountModalOpen(false)}>Cancel</button>
                        <button type="submit" form="wcmDiscountForm" className="btn wcm-btn-primary-custom">Create Code</button>
                    </div>
                </div>
            </div>
        )}

        {/* View Users Modal */}
        {viewUsersModalOpen && selectedVoucherForUsers && (
            <div className="crispr-modal-backdrop active" onClick={() => setViewUsersModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '700px', width: '100%' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header">
                        <h3>Users Associated with Voucher</h3>
                        <button className="crispr-modal-close" onClick={() => setViewUsersModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    <div className="crispr-modal-body">
                        <div className="students-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVoucherForUsers.users && selectedVoucherForUsers.users.length > 0 ? (
                                       selectedVoucherForUsers.users.map((u, i) => (
                                           <tr key={i}>
                                               <td>{u.name}</td>
                                               <td>{u.phone}</td>
                                           </tr>
                                       ))
                                    ) : (
                                       <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>No users found for this voucher.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="crispr-modal-footer">
                        <button className="btn btn-default" onClick={() => setViewUsersModalOpen(false)}>Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Revoke Confirm Modal */}
        {revokeModalOpen && voucherToRevoke && (
            <div className="crispr-modal-backdrop active" onClick={() => setRevokeModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
                        <h3><i className="ti ti-alert-circle"></i> Confirm Revoke</h3>
                        <button className="crispr-modal-close" onClick={() => setRevokeModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    <div className="crispr-modal-body">
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <i className="ti ti-ban" style={{ fontSize: '64px', color: '#dc2626', marginBottom: '15px' }}></i>
                            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Revoke Voucher Code?</h4>
                            <p style={{ color: '#6b7280', margin: '0 0 5px 0' }}>Are you sure you want to revoke this voucher code?</p>
                            <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>{voucherToRevoke.code}</p>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '15px' }}>This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="crispr-modal-footer">
                        <button className="btn btn-default" onClick={() => setRevokeModalOpen(false)}>Cancel</button>
                        <button className="btn btn-danger" style={{ background: '#dc2626', color: 'white', border: 'none', fontWeight: 600 }} onClick={handleRevokeConfirm}>
                            <i className="ti ti-ban"></i> Revoke Code
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
