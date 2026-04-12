import React, { useState, useMemo, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';
import { vouchersDemo, autoEnrollCoursesDemo, catalogItemsDemo } from '../data/adminRemainingDemo';

export default function WebContentManagerPage() {
  const [toasts, setToasts] = useState([]);
  
  // States
  const [vouchers, setVouchers] = useState(vouchersDemo);
  const [autoEnrollCourses, setAutoEnrollCourses] = useState(autoEnrollCoursesDemo);
  const [discountStatusFilter, setDiscountStatusFilter] = useState('all');
  
  // Discount Pagination
  const [discountPage, setDiscountPage] = useState(1);
  const discountsPerPage = 5;

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([...autoEnrollCourses]);

  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ code: '', type: 'percentage', value: '', validUntil: '', limitUsers: false });
  
  const [viewUsersModalOpen, setViewUsersModalOpen] = useState(false);
  const [selectedVoucherForUsers, setSelectedVoucherForUsers] = useState(null);
  
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [voucherToRevoke, setVoucherToRevoke] = useState(null);

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
    <div style={{ padding: '0 15px' }}>
        <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

        {/* Page Header Section */}
        <div className="wcm-page-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px', background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)', borderRadius: '8px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                   <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600, color: 'white' }}>
                       <i className="ti ti-world" style={{ marginRight: '8px' }}></i> Web Content Manager
                   </h2>
                   <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>Manage auto-enrollment logic and promotional discount codes.</p>
                </div>
            </div>
        </div>

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

            <div style={{ width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="wcm-custom-table">
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
                    <tbody>
                        {paginatedVouchers.map(v => (
                            <tr key={v.id}>
                                <td><strong>{v.code}</strong><br /><small style={{ color: '#666' }}>{v.title}</small></td>
                                <td>{v.amountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                                <td>{v.amountType === 'percentage' ? `${v.amount}%` : `₹${v.amount}`}</td>
                                <td>{new Date(v.validUntil).toLocaleDateString()}</td>
                                <td>{v.limitedUsers ? `${v.users.length} Users` : 'Unlimited'}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`wcm-status-badge wcm-status-${v.status}`}>
                                        {v.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {v.limitedUsers && (
                                        <button className="wcm-btn wcm-btn-default" style={{ marginRight: '5px' }} onClick={() => openViewUsers(v)} title="View Users">
                                            <i className="ti ti-user"></i>
                                        </button>
                                    )}
                                    {v.status === 'active' && (
                                        <button className="wcm-btn wcm-btn-danger" onClick={() => { setVoucherToRevoke(v); setRevokeModalOpen(true); }} title="Revoke Code">
                                            <i className="ti ti-ban"></i>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedVouchers.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No discount codes found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {filteredVouchers.length > 0 && (
                <div className="wcm-pagination-container">
                    <div className="wcm-pagination-info">
                        Showing {(discountPage - 1) * discountsPerPage + 1}-{Math.min(discountPage * discountsPerPage, filteredVouchers.length)} of {filteredVouchers.length} codes
                    </div>
                    <div className="wcm-pagination-controls">
                        <button className="wcm-pagination-btn" onClick={() => setDiscountPage(p => Math.max(1, p - 1))} disabled={discountPage === 1}>
                            <i className="ti ti-angle-left"></i> Previous
                        </button>
                        {Array.from({ length: totalDiscountPages }).map((_, idx) => (
                           <button key={idx} className={`wcm-pagination-btn ${discountPage === idx + 1 ? 'wcm-active' : ''}`} onClick={() => setDiscountPage(idx + 1)}>{idx + 1}</button>
                        ))}
                        <button className="wcm-pagination-btn" onClick={() => setDiscountPage(p => Math.min(totalDiscountPages, p + 1))} disabled={discountPage >= totalDiscountPages}>
                            Next <i className="ti ti-angle-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Modals using react styles securely injected inside wrapper overlays */}
        {/* Enroll Modal */}
        {enrollModalOpen && (
            <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setEnrollModalOpen(false)}>
                <div className="modal-card large" style={{ maxWidth: '800px', width: '100%', background: '#fff', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Select Courses for Auto-Enrollment</h3>
                        <button onClick={() => setEnrollModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    
                    <div style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                        <input type="text" className="wcm-form-control" placeholder="Search courses by name or code..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                    </div>
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px 0' }}>
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
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <button className="wcm-btn wcm-btn-default" onClick={() => setEnrollModalOpen(false)}>Cancel</button>
                        <button className="wcm-btn wcm-btn-primary-custom" onClick={() => setEnrollModalOpen(false)}>Confirm Selection</button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Discount Modal */}
        {discountModalOpen && (
            <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setDiscountModalOpen(false)}>
                <div className="modal-card" style={{ maxWidth: '600px', width: '100%', background: '#fff', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Add Discount Code</h3>
                        <button onClick={() => setDiscountModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreateDiscount}>
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
                                 <input type="checkbox" checked={newDiscount.limitUsers} onChange={e => setNewDiscount({...newDiscount, limitUsers: e.target.checked})} style={{ margin: 0, width: '18px', height: '18px', cursor: 'pointer' }} />
                                 Limit to Specific User(s)
                             </label>
                         </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <button type="button" className="wcm-btn wcm-btn-default" onClick={() => setDiscountModalOpen(false)}>Cancel</button>
                            <button type="submit" className="wcm-btn wcm-btn-primary-custom">Create Code</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* View Users Modal */}
        {viewUsersModalOpen && selectedVoucherForUsers && (
            <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setViewUsersModalOpen(false)}>
                <div className="modal-card" style={{ maxWidth: '700px', width: '100%', background: '#fff', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Users Associated with Voucher</h3>
                        <button onClick={() => setViewUsersModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="wcm-custom-table">
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
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <button className="wcm-btn wcm-btn-default" onClick={() => setViewUsersModalOpen(false)}>Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Revoke Confirm Modal */}
        {revokeModalOpen && voucherToRevoke && (
            <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setRevokeModalOpen(false)}>
                <div className="modal-card" style={{ maxWidth: '450px', background: '#fff', borderRadius: '12px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                    <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'white' }}><i className="ti ti-alert-circle"></i> Confirm Revoke</h3>
                        <button onClick={() => setRevokeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}><i className="ti ti-close"></i></button>
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <i className="ti ti-ban" style={{ fontSize: '64px', color: '#dc2626', marginBottom: '15px' }}></i>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1f2937', fontWeight: 600 }}>Revoke Voucher Code?</h4>
                        <p style={{ color: '#6b7280', margin: '0 0 5px 0' }}>Are you sure you want to revoke this voucher code?</p>
                        <p style={{ color: '#dc2626', fontWeight: 600, margin: 0, fontSize: '18px' }}>{voucherToRevoke.code}</p>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '15px' }}>This action cannot be undone.</p>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '15px 20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button className="wcm-btn wcm-btn-default" onClick={() => setRevokeModalOpen(false)}>Cancel</button>
                        <button className="wcm-btn" style={{ background: '#dc2626', color: 'white', border: 'none', fontWeight: 600 }} onClick={handleRevokeConfirm}>
                            <i className="ti ti-ban"></i> Revoke Code
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
