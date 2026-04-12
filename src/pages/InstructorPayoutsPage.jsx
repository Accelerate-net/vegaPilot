import React, { useState, useMemo, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';

const ledgerMock = {
  'I-001': [
    { id: 1, date: '2 April 2026', type: 'WORK', description: 'Chapter 2', hours: '5 hours', amount: 5000 },
    { id: 2, date: '4 April 2026', type: 'WORK', description: 'Chapter 1', hours: '2 hours', amount: 2000 },
    { id: 3, date: '10 April 2026', type: 'PAYMENT', description: 'Payment via Bank Transfer', hours: '-', amount: -6000 },
    { id: 4, date: '13 April 2026', type: 'WORK', description: 'Chapter 5', hours: '6 hours', amount: 6000 },
  ],
  'I-002': [
    { id: 1, date: '1 April 2026', type: 'WORK', description: 'Organic Chem Overview', hours: '4 hours', amount: 6000 },
    { id: 2, date: '10 April 2026', type: 'PAYMENT', description: 'Payment via Cheque', hours: '-', amount: -3000 },
  ],
  'I-003': [
    { id: 1, date: '5 April 2026', type: 'WORK', description: 'Calculus Advanced', hours: '12 hours', amount: 10800 },
  ]
};

const initialSummaries = [
  { id: 'I-001', name: 'Dr. Arjun Mehta', specialization: 'Physics' },
  { id: 'I-002', name: 'Dr. Divya Krishnan', specialization: 'Chemistry' },
  { id: 'I-003', name: 'Prof. Sneha Menon', specialization: 'Mathematics' },
];

export default function InstructorPayoutsPage() {
  const [toasts, setToasts] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);
  
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [ledgerData, setLedgerData] = useState(ledgerMock);

  // Calculate dynamic summaries combining FIFO logic
  const instructorSummaries = useMemo(() => {
    return initialSummaries.map(instructor => {
        const records = ledgerData[instructor.id] || [];
        let earnings = 0;
        let paid = 0;
        records.forEach(r => {
            if (r.type === 'WORK') earnings += r.amount;
            if (r.type === 'PAYMENT') paid += Math.abs(r.amount);
        });
        return {
            ...instructor,
            totalEarnings: earnings,
            totalPaid: paid,
            balanceDue: earnings - paid
        };
    });
  }, [ledgerData]);

  const filteredSummaries = useMemo(() => {
    if (!searchQuery) return instructorSummaries;
    const lower = searchQuery.toLowerCase();
    return instructorSummaries.filter(i => i.name.toLowerCase().includes(lower) || i.specialization.toLowerCase().includes(lower));
  }, [instructorSummaries, searchQuery]);

  const totalPages = Math.ceil(filteredSummaries.length / rowsPerPage) || 1;
  const paginatedSummaries = filteredSummaries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  const handleKebabClick = (e, index) => {
      e.stopPropagation();
      setActiveDropdown(activeDropdown === index ? null : index);
  };

  const openLedgerModal = (instructorId) => {
      setSelectedInstructorId(instructorId);
      setLedgerModalOpen(true);
      setActiveDropdown(null);
  };
  
  const openPaymentModal = (instructorId) => {
      setSelectedInstructorId(instructorId);
      setMakePaymentModalOpen(true);
      setActiveDropdown(null);
  };

  const processLedgerWithFifo = (records) => {
      // Create a copy to track unpaid balances of WORK entries
      let workEntries = records.filter(r => r.type === 'WORK').map(r => ({ ...r, unpaid: r.amount }));
      let totalPayments = records.filter(r => r.type === 'PAYMENT').reduce((acc, r) => acc + Math.abs(r.amount), 0);
      
      // FIFO allocation
      for (let i = 0; i < workEntries.length; i++) {
          if (totalPayments <= 0) break;
          if (totalPayments >= workEntries[i].unpaid) {
              totalPayments -= workEntries[i].unpaid;
              workEntries[i].unpaid = 0;
              workEntries[i].fifoStatus = 'Settled';
          } else {
              workEntries[i].unpaid -= totalPayments;
              totalPayments = 0;
              workEntries[i].fifoStatus = 'Partial';
          }
      }
      
      workEntries.forEach(w => {
          if (w.unpaid === w.amount) {
              w.fifoStatus = 'Unpaid';
          }
      });

      // Merge back
      return records.map(r => {
          if (r.type === 'PAYMENT') return { ...r, status: '' };
          const processedWork = workEntries.find(w => w.id === r.id);
          return { ...r, status: processedWork.fifoStatus };
      });
  };

  const selectedLedgerWithFifo = useMemo(() => {
     if (!selectedInstructorId) return [];
     const records = ledgerData[selectedInstructorId] || [];
     return processLedgerWithFifo(records);
  }, [ledgerData, selectedInstructorId]);

  const selectedInstructorInfo = useMemo(() => {
     if (!selectedInstructorId) return null;
     return instructorSummaries.find(i => i.id === selectedInstructorId);
  }, [instructorSummaries, selectedInstructorId]);

  const handleMakePayment = (e) => {
      e.preventDefault();
      if (!paymentAmount || Number(paymentAmount) <= 0) return;
      
      const newEntry = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          type: 'PAYMENT',
          description: paymentDesc || 'Payment via Portal',
          hours: '-',
          amount: -Math.abs(Number(paymentAmount))
      };

      setLedgerData(prev => ({
          ...prev,
          [selectedInstructorId]: [...(prev[selectedInstructorId] || []), newEntry]
      }));

      setMakePaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentDesc('');
      showToast('success', 'Payment Recorded', `Payment of Rs. ${paymentAmount} has been recorded.`);
  };

  return (
    <div className="container-fluid" style={{ paddingTop: '1%' }}>
        <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

        {/* Header matching standard pattern */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px', background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)', borderRadius: '8px', color: 'white' }}>
            <div>
               <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600, color: 'white' }}>
                   <i className="ti ti-time" style={{ marginRight: '10px' }}></i> Instructor Payouts
               </h2>
               <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>Track payments made and pending settlements for instructors.</p>
            </div>
        </div>

        {/* List Section */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '25px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#006073', margin: 0 }}>Payout Summary Directory</h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                       <input type="text" style={{ padding: '8px 12px 8px 35px', borderRadius: '6px', border: '1px solid #d1d5db', width: '250px', fontSize: '14px' }} placeholder="Search instructor..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                       <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}></i>
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', background: 'white', borderRadius: '8px', overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instructor</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earnings</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</th>
                            <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance Due</th>
                            <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSummaries.map((inst, index) => (
                            <tr key={inst.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'all 0.2s ease' }} className="po-tr-hover">
                                <td style={{ padding: '18px 20px', verticalAlign: 'middle', color: '#4b5563' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2f1', color: '#006073', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '16px' }}>
                                             {inst.name.charAt(4)}
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '15px', color: '#2c3e50' }}>{inst.name}</strong>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{inst.specialization}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '18px 20px', verticalAlign: 'middle', fontWeight: 500, color: '#4b5563' }}>Rs. {inst.totalEarnings.toLocaleString()}</td>
                                <td style={{ padding: '18px 20px', verticalAlign: 'middle', fontWeight: 500, color: '#10b981' }}>Rs. {inst.totalPaid.toLocaleString()}</td>
                                <td style={{ padding: '18px 20px', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, background: inst.balanceDue > 0 ? '#fff3cd' : '#d4edda', color: inst.balanceDue > 0 ? '#856404' : '#155724' }}>
                                        Rs. {inst.balanceDue.toLocaleString()} {inst.balanceDue > 0 ? 'due' : 'cleared'}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 20px', verticalAlign: 'middle', textAlign: 'center', position: 'relative' }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#6b7280' }} onClick={(e) => handleKebabClick(e, index)}>
                                        <i className="ti ti-more-alt" style={{ fontSize: '20px' }}></i>
                                    </button>
                                    
                                    {/* Dropdown menu */}
                                    {activeDropdown === index && (
                                        <div style={{ position: 'absolute', right: '40px', top: '25px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 100, minWidth: '160px', padding: '5px 0' }} onClick={e => e.stopPropagation()}>
                                            <div style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }} className="po-dp-hover" onClick={() => openLedgerModal(inst.id)}>
                                                <i className="ti ti-eye"></i> View Details
                                            </div>
                                            <div style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }} className="po-dp-hover" onClick={() => openPaymentModal(inst.id)}>
                                                <i className="ti ti-money"></i> Record Payment
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedSummaries.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>No instructors found matching query.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination matched to candidate profiles */}
            {filteredSummaries.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8f9fa', borderTop: '1px solid #e9ecef', borderRadius: '0 0 8px 8px', marginTop: '15px' }}>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>
                        Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredSummaries.length)} of {filteredSummaries.length} entries
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button style={{ padding: '5px 12px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', color: '#495057', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: currentPage === 1 ? 0.5 : 1 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <i className="ti ti-angle-left"></i> Previous
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                           <button key={idx} style={{ padding: '5px 12px', background: currentPage === idx + 1 ? '#006073' : 'white', border: '1px solid', borderColor: currentPage === idx + 1 ? '#006073' : '#dee2e6', borderRadius: '4px', color: currentPage === idx + 1 ? 'white' : '#495057', cursor: 'pointer', fontSize: '13px', fontWeight: currentPage === idx + 1 ? 600 : 400 }} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                        ))}
                        <button style={{ padding: '5px 12px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', color: '#495057', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: currentPage >= totalPages ? 0.5 : 1 }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            Next <i className="ti ti-angle-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Ledger Detailed Modal */}
        {ledgerModalOpen && selectedInstructorInfo && (
            <div className="crispr-modal-backdrop" onClick={() => setLedgerModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '900px', width: '100%' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                        <h3 style={{ margin: 0, fontWeight: 700 }}><i className="ti ti-agenda" style={{ color: '#006073' }}></i> Payout Ledger: {selectedInstructorInfo.name}</h3>
                        <button className="crispr-modal-close" style={{ color: '#64748b' }} onClick={() => setLedgerModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    
                    <div className="crispr-modal-body" style={{ padding: '20px', background: '#f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                             <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                 <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Earnings</div>
                                 <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>Rs. {selectedInstructorInfo.totalEarnings.toLocaleString()}</div>
                             </div>
                             <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                 <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Paid out</div>
                                 <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>Rs. {selectedInstructorInfo.totalPaid.toLocaleString()}</div>
                             </div>
                             <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                 <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Balance Due</div>
                                 <div style={{ fontSize: '24px', fontWeight: 700, color: selectedInstructorInfo.balanceDue > 0 ? '#f59e0b' : '#333' }}>Rs. {selectedInstructorInfo.balanceDue.toLocaleString()}</div>
                             </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 600 }}>Date</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 600 }}>Description</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 600 }}>Hours</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#475569', fontWeight: 600 }}>Amount</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 600 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedLedgerWithFifo.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: r.type === 'PAYMENT' ? '#f0fdfa' : 'white' }}>
                                            <td style={{ padding: '12px 15px', fontSize: '14px', color: '#334155' }}>{r.date}</td>
                                            <td style={{ padding: '12px 15px', fontSize: '14px', color: r.type === 'PAYMENT' ? '#0f766e' : '#334155', fontWeight: r.type === 'PAYMENT' ? 600 : 400 }}>
                                                 {r.type === 'PAYMENT' && <i className="ti ti-money" style={{ marginRight: '5px' }}></i>}
                                                 {r.description}
                                            </td>
                                            <td style={{ padding: '12px 15px', fontSize: '14px', color: '#64748b' }}>{r.hours}</td>
                                            <td style={{ padding: '12px 15px', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: 500 }}>
                                                {r.amount > 0 ? `+ Rs. ${r.amount}` : `- Rs. ${Math.abs(r.amount)}`}
                                            </td>
                                            <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                {r.type === 'WORK' && r.status && (
                                                    <span style={{ 
                                                        display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                                                        background: r.status === 'Settled' ? '#dcfce7' : r.status === 'Partial' ? '#fef9c3' : '#fee2e2',
                                                        color: r.status === 'Settled' ? '#166534' : r.status === 'Partial' ? '#854d0e' : '#991b1b'
                                                    }}>
                                                        {r.status}
                                                    </span>
                                                )}
                                                {r.type === 'PAYMENT' && (
                                                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                                                        Payment
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="crispr-modal-footer">
                        <button type="button" className="btn btn-default" onClick={() => setLedgerModalOpen(false)}>Close Ledger</button>
                        <button type="button" style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setLedgerModalOpen(false); openPaymentModal(selectedInstructorInfo.id); }}>
                             <i className="ti ti-plus"></i> Record New Payment
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Make Payment Modal */}
        {makePaymentModalOpen && selectedInstructorInfo && (
            <div className="crispr-modal-backdrop" onClick={() => setMakePaymentModalOpen(false)}>
                <div className="crispr-modal-dialog" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                    <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                        <h3 style={{ margin: 0, fontWeight: 600 }}><i className="ti ti-money"></i> Record Payment</h3>
                        <button className="crispr-modal-close" style={{ color: 'white' }} onClick={() => setMakePaymentModalOpen(false)}>
                            <i className="ti ti-close"></i>
                        </button>
                    </div>
                    <form onSubmit={handleMakePayment}>
                        <div className="crispr-modal-body" style={{ padding: '25px' }}>
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#6b7280' }}>Recording payment for</p>
                                <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 700 }}>{selectedInstructorInfo.name}</h4>
                                <p style={{ margin: '5px 0 0 0', color: selectedInstructorInfo.balanceDue > 0 ? '#d97706' : '#10b981', fontWeight: 600 }}>Due Balance: Rs. {selectedInstructorInfo.balanceDue.toLocaleString()}</p>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Amount to Pay (Rs.) *</label>
                                <input type="number" required min="1" max={selectedInstructorInfo.balanceDue + 5000} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px' }} placeholder="e.g. 5000" />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Description / Reference</label>
                                <input type="text" value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px' }} placeholder="Payment via Bank Account / Txn ID" />
                            </div>
                        </div>
                        <div className="crispr-modal-footer">
                            <button type="button" className="btn btn-default" onClick={() => setMakePaymentModalOpen(false)}>Cancel</button>
                            <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                                Confirm Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <style>
        {`
            .po-tr-hover:hover {
                background-color: #f8f9fa;
            }
            .po-dp-hover:hover {
                background-color: #f3f4f6;
            }
            .table-button {
                padding: 6px 12px;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                color: #4b5563;
                cursor: pointer;
                transition: all 0.2s;
            }
            .table-button:hover {
                background: #f3f4f6;
            }
        `}
        </style>
    </div>
  );
}
