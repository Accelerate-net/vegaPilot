import React, { useState, useRef, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';
import { availableCourses, availableBatches } from '../data/attemptReportsDemo';

const demoMessages = [
  {
    id: 'msg-1',
    subject: 'Welcome back to Crispr Pilot',
    abstract: 'We have exciting new features lined up for you...',
    body: 'Hello Students,\n\nWe are thrilled to welcome you back for the new term. We have prepared completely new design frameworks for the email web app. Later I will describe how it should look like, so you wont get lost. Do you have any additional questions? I attached some documents which can help you in your work.\n\nBest wishes,\nCrispr Pilot Team',
    date: '2026-04-14T09:00:00Z',
    channels: ['Email', 'App Push'],
    notifyParents: false,
    targetType: 'All Registered Students',
    targets: [],
    recipientCount: 3840,
    sender: 'Isaac Jonas'
  },
  {
    id: 'msg-2',
    subject: 'We want your feedback',
    abstract: 'For athletes, high altitude produces two contradictory effects...',
    body: 'Hi guys,\n\nWe want your feedback regarding the recent live class. Please make sure to fill the survey form available on your dashboard.\n\nRegards,\nSandra',
    date: '2026-04-13T17:00:00Z',
    channels: ['WhatsApp', 'App Push'],
    notifyParents: true,
    targetType: 'Multi Selected Batches',
    targets: ['Batch A', 'Batch C'],
    recipientCount: 124,
    sender: 'Sandra Hesus'
  },
  {
    id: 'msg-3',
    subject: 'The results to our user testing',
    abstract: 'In the eighteenth century the German philosopher Immanuel...',
    body: 'Here are the results to our user testing module.',
    date: '2026-04-12T17:00:00Z',
    channels: ['SMS'],
    notifyParents: true,
    targetType: 'Multi Selected Courses',
    targets: ['CR-101'],
    recipientCount: 450,
    sender: 'Anya Shevchenko'
  }
];

function MultiSelectDropdown({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(id) {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  }

  function getLabel() {
    if (!selected.length) return placeholder;
    if (selected.length === 1) return options.find((o) => o.id === selected[0])?.name || '1 selected';
    return `${selected.length} items selected`;
  }

  return (
    <div className="msg-multiselect" ref={ref}>
      <div className="msg-multiselect-trigger" onClick={() => setOpen(!open)}>
        <span>{getLabel()}</span>
        <i className="ti ti-angle-down" />
      </div>
      {open && (
        <div className="msg-multiselect-dropdown">
          <div className="msg-multiselect-actions">
            <button type="button" onClick={() => onChange(options.map((o) => o.id))}>Select All</button>
            <button type="button" onClick={() => onChange([])}>Clear All</button>
          </div>
          {options.length === 0 ? (
            <div style={{ padding: '8px 12px', color: '#999', fontSize: '13px' }}>No options available</div>
          ) : (
            options.map((opt) => (
              <label key={opt.id} className={`msg-multiselect-item${selected.includes(opt.id) ? ' selected' : ''}`}>
                <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggle(opt.id)} />
                <span>{opt.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function MessengerPage() {
  const [messages, setMessages] = useState(demoMessages);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isComposing, setIsComposing] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Compose State
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpBody, setCmpBody] = useState('');
  const [cmpAudience, setCmpAudience] = useState('All Registered Students');
  const [cmpSelectedCourses, setCmpSelectedCourses] = useState([]);
  const [cmpSelectedBatches, setCmpSelectedBatches] = useState([]);
  
  // Channels
  const [chEmail, setChEmail] = useState(true);
  const [chPush, setChPush] = useState(true);
  const [chSms, setChSms] = useState(false);
  const [chWhatsapp, setChWhatsapp] = useState(false);
  const [notifyParents, setNotifyParents] = useState(false);

  function showToast(type, title, message) {
    const id = Date.now();
    setToasts((c) => [...c, { id, type, title, message }]);
    setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4000);
  }

  function handleCompose() {
    setIsComposing(true);
    setSelectedMessage(null);
  }

  function handleSelectMessage(m) {
    setIsComposing(false);
    setSelectedMessage(m);
  }

  function handleSendMessage() {
    if (!cmpSubject.trim()) return showToast('error', 'Error', 'Message subject is required.');
    if (!cmpBody.trim()) return showToast('error', 'Error', 'Message body is required.');
    if (cmpAudience === 'Multi Selected Courses' && cmpSelectedCourses.length === 0) {
      return showToast('error', 'Error', 'Please select at least one course.');
    }
    if (cmpAudience === 'Multi Selected Batches' && cmpSelectedBatches.length === 0) {
      return showToast('error', 'Error', 'Please select at least one batch.');
    }
    const selectedChannels = [];
    if (chEmail) selectedChannels.push('Email');
    if (chPush) selectedChannels.push('App Push');
    if (chSms) selectedChannels.push('SMS');
    if (chWhatsapp) selectedChannels.push('WhatsApp');

    if (selectedChannels.length === 0) {
      return showToast('error', 'Error', 'Please select at least one delivery channel.');
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      subject: cmpSubject,
      abstract: cmpBody.slice(0, 50) + '...',
      body: cmpBody,
      date: new Date().toISOString(),
      channels: selectedChannels,
      notifyParents,
      targetType: cmpAudience,
      targets: cmpAudience === 'Multi Selected Courses' ? cmpSelectedCourses : (cmpAudience === 'Multi Selected Batches' ? cmpSelectedBatches : []),
      recipientCount: Math.floor(Math.random() * 500) + 50, // Mock count
      sender: 'Current Admin'
    };

    setMessages([newMsg, ...messages]);
    showToast('success', 'Message Sent', 'Your bulk message has been queued for delivery.');
    handleSelectMessage(newMsg);

    // Reset compose
    setCmpSubject('');
    setCmpBody('');
  }

  function handleDownloadCsv(msg) {
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Mobile,Status\\n";
    for(let i=0; i<Math.min(msg.recipientCount, 20); i++) {
       csvContent += `Student ${i+1},student${i+1}@example.com,987654321${i%10},Delivered\\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Recipients_${msg.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'Download Started', 'The recipient list has been downloaded.');
  }

  function formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateFull(isoStr) {
    const d = new Date(isoStr);
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})} Today, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}`;
  }

  function getAvatarColor(sender) {
    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b'];
    let hash = 0;
    for(let i=0; i<sender.length; i++) hash += sender.charCodeAt(i);
    return colors[hash % colors.length];
  }

  return (
    <div className="messenger-layout" style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#fff' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

      {/* LEFT SIDEBAR - INBOX LIST */}
      <div style={{ width: '360px', background: '#F8F9FA', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Inbox</h2>
          <button 
            type="button" 
            onClick={handleCompose}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isComposing ? '#006073' : '#E5E7EB', color: isComposing ? 'white' : '#4B5563', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <i className="ti ti-pencil-alt" /> Compose
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px 12px' }}>
          {messages.map(m => {
            const isSel = (!isComposing && selectedMessage?.id === m.id);
            return (
              <div 
                key={m.id} 
                onClick={() => handleSelectMessage(m)}
                style={{ background: isSel ? '#E5E7EB' : 'transparent', borderRadius: '12px', padding: '16px', marginBottom: '8px', cursor: 'pointer', display: 'flex', gap: '12px', transition: 'all 0.2s' }}
              >
                <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', background: getAvatarColor(m.sender), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  {m.sender.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{m.sender}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatTime(m.date)}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.abstract}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - READING / COMPOSING */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {isComposing ? (
          <div style={{ padding: '40px', maxWidth: '800px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '30px' }}>Compose Broadcast</h1>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Target Audience</label>
              <select className="msg-input" value={cmpAudience} onChange={e => setCmpAudience(e.target.value)}>
                <option value="All Registered Students">All Registered Students</option>
                <option value="All Enrolled Students">All Enrolled Students</option>
                <option value="Multi Selected Courses">Multi Selected Courses</option>
                <option value="Multi Selected Batches">Multi Selected Batches</option>
              </select>
            </div>
            
            {cmpAudience === 'Multi Selected Courses' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Select Courses</label>
                <MultiSelectDropdown options={availableCourses.map(c => ({id: c.id, name: c.name}))} selected={cmpSelectedCourses} onChange={setCmpSelectedCourses} placeholder="Select courses..." />
              </div>
            )}
            {cmpAudience === 'Multi Selected Batches' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Select Batches</label>
                <MultiSelectDropdown options={availableBatches.map(b => ({id: b.id, name: b.name}))} selected={cmpSelectedBatches} onChange={setCmpSelectedBatches} placeholder="Select batches..." />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Subject Line</label>
              <input type="text" className="msg-input" placeholder="Enter message subject..." value={cmpSubject} onChange={e => setCmpSubject(e.target.value)} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Message Body</label>
              <textarea className="msg-input" style={{ minHeight: '200px', resize: 'vertical' }} placeholder="Write your message here..." value={cmpBody} onChange={e => setCmpBody(e.target.value)}></textarea>
            </div>

            <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#111827' }}>Delivery Channels Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="msg-checkbox-label">
                  <input type="checkbox" checked={chEmail} onChange={e => setChEmail(e.target.checked)} />
                  <div className="msg-check-card">
                    <i className="ti ti-email" style={{ fontSize: '20px', color: '#3B82F6' }} />
                    <span style={{ fontWeight: 600 }}>Email Broadcast</span>
                  </div>
                </label>
                <label className="msg-checkbox-label">
                  <input type="checkbox" checked={chPush} onChange={e => setChPush(e.target.checked)} />
                  <div className="msg-check-card">
                    <i className="ti ti-bell" style={{ fontSize: '20px', color: '#8B5CF6' }} />
                    <span style={{ fontWeight: 600 }}>App Push Notification</span>
                  </div>
                </label>
                <label className="msg-checkbox-label">
                  <input type="checkbox" checked={chSms} onChange={e => setChSms(e.target.checked)} />
                  <div className="msg-check-card">
                    <i className="ti ti-mobile" style={{ fontSize: '20px', color: '#10B981' }} />
                    <span style={{ fontWeight: 600 }}>Standard SMS</span>
                  </div>
                </label>
                <label className="msg-checkbox-label">
                  <input type="checkbox" checked={chWhatsapp} onChange={e => setChWhatsapp(e.target.checked)} />
                  <div className="msg-check-card">
                    <i className="ti ti-comments" style={{ fontSize: '20px', color: '#22C55E' }} />
                    <span style={{ fontWeight: 600 }}>WhatsApp Message</span>
                  </div>
                </label>
              </div>
              
              <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={notifyParents} onChange={e => setNotifyParents(e.target.checked)} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563' }}>Notify Parents (Sends WhatsApp clone to associated parent numbers)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSendMessage} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                Send Broadcast <i className="ti ti-location-arrow" />
              </button>
            </div>

          </div>
        ) : selectedMessage ? (
          <div style={{ padding: '40px', maxWidth: '800px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>system@crisprlearning.com</span>
                <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{formatDateFull(selectedMessage.date)}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleDownloadCsv(selectedMessage)} style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#4B5563', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Download Recipient List">
                  <i className="ti ti-download" style={{ fontSize: '18px' }} />
                </button>
                <button style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#EF4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Delete History">
                  <i className="ti ti-trash" style={{ fontSize: '18px' }} />
                </button>
              </div>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: '0 0 30px 0' }}>{selectedMessage.subject}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: getAvatarColor(selectedMessage.sender), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
                {selectedMessage.sender.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{selectedMessage.sender}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>Broadcast Sender</div>
              </div>
            </div>

            <div style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '40px' }}>
              {selectedMessage.body}
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '30px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px' }}>Metadata Trace</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Audience Reach</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{selectedMessage.targetType}</div>
                  <div style={{ fontSize: '13px', color: '#8B5CF6', fontWeight: 'bold' }}>{selectedMessage.recipientCount} Recipients Delivered</div>
                  {selectedMessage.targets?.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
                      Paths: {selectedMessage.targets.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Execution Channels</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {selectedMessage.channels.map(ch => (
                      <span key={ch} style={{ background: '#E0E7FF', color: '#4338CA', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{ch}</span>
                    ))}
                    {selectedMessage.notifyParents && (
                      <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>+ Parents Executed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : null}
      </div>

      <style>{`
        /* Additional scoped styles avoiding global pollution */
        .msg-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .msg-input:focus {
          outline: none;
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .msg-checkbox-label input {
          display: none;
        }
        .msg-check-card {
          border: 2px solid #E5E7EB;
          background: white;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .msg-checkbox-label input:checked + .msg-check-card {
          border-color: #8B5CF6;
          background: #F5F3FF;
        }
        .msg-multiselect {
          position: relative;
          width: 100%;
        }
        .msg-multiselect-trigger {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
        }
        .msg-multiselect-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 50;
          max-height: 250px;
          overflow-y: auto;
        }
        .msg-multiselect-actions {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #E5E7EB;
          background: #F9FAFB;
          position: sticky;
          top: 0;
        }
        .msg-multiselect-actions button {
          background: none;
          border: none;
          color: #8B5CF6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .msg-multiselect-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .msg-multiselect-item:hover {
          background: #F3F4F6;
        }
        .msg-multiselect-item.selected {
          background: #F5F3FF;
        }
        .msg-multiselect-item input {
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
}
