import React, { useState, useMemo, useEffect, useRef } from 'react';
// Mock Data
const ASSIGNEES = ['Unassigned', 'Alice', 'Bob', 'Charlie'];
const TAGS = ['None', 'Escalation', 'Feedback', 'Purchase', 'Complaint', 'Legal', 'Other'];
const STATUSES = ['In Progress', 'Closed', 'Re-opened'];

const TEMPLATES = [
  { id: 't1', label: 'Greeting', text: 'Hello! Thank you for reaching out. How can I assist you today?' },
  { id: 't2', label: 'Apology for Delay', text: 'We sincerely apologize for the delay in our response. Let me look into this right away.' },
  { id: 't3', label: 'Feedback Acknowledgment (Negative)', text: 'We are very sorry to hear about your negative experience. Your feedback is valuable to us and we will work to address this issue.' },
  { id: 't4', label: 'Technical Issue', text: 'Please ensure your app is updated to the latest version. If the issue persists, could you share a screenshot?' },
  { id: 't5', label: 'Issue Resolved', text: 'I have checked the system and your issue should now be resolved. Let us know if you face any further difficulties.' },
  { id: 't6', label: 'Closing', text: 'If there is nothing else, I will be closing this ticket. Have a great day ahead!' },
];

const initialMessages = [
  { id: 1, type: 'app_ticket', studentName: 'John Doe', assignee: 'Alice', 
    tag: 'Technical Issue', status: 'In Progress', unread: true, lastUpdate: Date.now() - 1000 * 60 * 5, 
    messages: [
      { id: 'm1', sender: 'user', text: 'Hi, my test series is not loading on the app.', timestamp: Date.now() - 1000 * 60 * 60 * 48 },
      { id: 'm2', sender: 'agent', text: 'Hello John, let me check your profile and reset your session.', timestamp: Date.now() - 1000 * 60 * 30 },
      { id: 'm3', sender: 'user', text: 'It still shows "No active packages".', timestamp: Date.now() - 1000 * 60 * 5 }
    ]
  },
  { id: 2, type: 'whatsapp_lead', studentName: 'Jane Smith (+91 9876543210)', assignee: 'Unassigned', 
    tag: 'Purchase', status: 'In Progress', unread: true, lastUpdate: Date.now() - 1000 * 60 * 15,
    messages: [
      { id: 'm4', sender: 'user', text: 'I asked the bot about crash course but want more details.', timestamp: Date.now() - 1000 * 60 * 15 }
    ]
  },
  { id: 3, type: 'app_ticket', studentName: 'Rahul Kumar', assignee: 'Bob', 
    tag: 'Other', status: 'Closed', unread: false, lastUpdate: Date.now() - 1000 * 60 * 60 * 24,
    messages: [
      { id: 'm5', sender: 'user', text: 'When will the results for Mock Test 3 be published?', timestamp: Date.now() - 1000 * 60 * 60 * 25 },
      { id: 'm6', sender: 'agent', text: 'Hi Rahul, the results will be out by tomorrow evening.', timestamp: Date.now() - 1000 * 60 * 60 * 24 }
    ]
  },
  { id: 4, type: 'whatsapp_lead', studentName: 'Priya (+91 8888888888)', assignee: 'Alice', 
    tag: 'Purchase', status: 'Closed', unread: false, lastUpdate: Date.now() - 1000 * 60 * 60 * 48,
    messages: [
      { id: 'm7', sender: 'user', text: 'Can I get a discount for the full bundle?', timestamp: Date.now() - 1000 * 60 * 60 * 50 },
      { id: 'm8', sender: 'agent', text: 'Hi Priya, we are currently offering a 10% discount. Use code WOW10.', timestamp: Date.now() - 1000 * 60 * 60 * 48 }
    ]
  },
];

// Add more dummy chats to demonstrate pagination
for (let i = 5; i <= 25; i++) {
  initialMessages.push({
    id: i,
    type: i % 2 === 0 ? 'app_ticket' : 'whatsapp_lead',
    studentName: `Demo User ${i}`,
    assignee: ASSIGNEES[i % ASSIGNEES.length],
    tag: TAGS[i % TAGS.length],
    status: STATUSES[i % STATUSES.length],
    unread: i % 5 === 0,
    lastUpdate: Date.now() - 1000 * 60 * 60 * (i * 2),
    messages: [
      { id: `m_d_${i}`, sender: 'user', text: `This is a test message from user ${i}.`, timestamp: Date.now() - 1000 * 60 * 60 * (i * 24) }
    ]
  });
}

function formatTime(ms) {
  const date = new Date(ms);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function calculateAgeDays(messages) {
  if (!messages || messages.length === 0) return 0;
  const firstTimestamp = messages[0].timestamp;
  return Math.floor((Date.now() - firstTimestamp) / (1000 * 60 * 60 * 24));
}

export default function SupportPage() {
  const [chats, setChats] = useState(initialMessages);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(null);
  
  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Reply Box
  const [replyText, setReplyText] = useState('');
  const threadEndRef = useRef(null);

  // Scroll to bottom of thread
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChatId, chats]);

  // Derived filtered data
  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      const matchSearch = chat.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          chat.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchAssignee = assigneeFilter === 'All' || chat.assignee === assigneeFilter;
      
      let matchPending = true;
      if (showPendingOnly) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        // Pending logic: last message is from user and status is not closed
        matchPending = lastMsg && lastMsg.sender === 'user' && chat.status !== 'Closed';
      }

      return matchSearch && matchAssignee && matchPending;
    }).sort((a, b) => b.lastUpdate - a.lastUpdate);
  }, [chats, searchQuery, assigneeFilter, showPendingOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredChats.length / itemsPerPage));
  const currentChatsList = filteredChats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeChat = useMemo(() => chats.find(c => c.id === selectedChatId), [chats, selectedChatId]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setReplyText('');
    
    // Mark as read
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, unread: false } : c
    ));
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setReplyText(prev => prev + (prev ? '\n\n' : '') + template.text);
      }
      e.target.value = ''; // Reset select
    }
  };

  const handleSendMessage = () => {
    if (!replyText.trim() || !activeChat) return;

    const newMessage = {
      id: `m_${Date.now()}`,
      sender: 'agent',
      text: replyText.trim(),
      timestamp: Date.now()
    };

    setChats(prev => prev.map(c => 
      c.id === activeChat.id ? {
        ...c,
        lastUpdate: Date.now(),
        // Automatically set to In Progress if agent sends a message and it was closed
        status: (c.status === 'Closed' ? 'Re-opened' : c.status),
        messages: [...c.messages, newMessage]
      } : c
    ));

    setReplyText('');
  };

  const handleChatMetaChange = (field, value) => {
    if (!activeChat) return;
    setChats(prev => prev.map(c => 
      c.id === activeChat.id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="support-inbox-page">
      <div className="page-header-section">
        <div>
          <h2>Support Inbox</h2>
          <p>Consolidated view for student support tickets and potential leads chats.</p>
        </div>
      </div>

      <div className="support-main-container">
        {/* Left Panel - Inbox */}
        <div className="support-left-panel">
          <div className="filter-bar support-internal-filters">
            <div className="search-wrapper" style={{ width: '100%', marginBottom: '10px' }}>
              <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`} 
                 style={{ cursor: searchQuery ? 'pointer' : 'default' }}
                 onClick={() => { if(searchQuery) { setSearchQuery(''); setCurrentPage(1); } }} />
              <input 
                type="text" 
                className="search-input"
                placeholder="Search chats, student names..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="support-filter-row">
              <select 
                className="legacy-select support-filter-select"
                value={assigneeFilter}
                onChange={e => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">All Assignees</option>
                {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              
              <label className="support-toggle-label">
                <input 
                  type="checkbox" 
                  checked={showPendingOnly} 
                  onChange={e => { setShowPendingOnly(e.target.checked); setCurrentPage(1); }} 
                />
                Show Pending Only
              </label>
            </div>
          </div>

          <div className="support-chat-list">
            {currentChatsList.length > 0 ? (
              currentChatsList.map(chat => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                return (
                  <div 
                    key={chat.id} 
                    className={`support-chat-item ${chat.unread ? 'unread' : ''} ${selectedChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="chat-item-header">
                      <span className="chat-name">{chat.studentName}</span>
                      <span className="chat-time">{formatTime(chat.lastUpdate)}</span>
                    </div>
                    <div className="chat-item-badges">
                      {chat.type === 'app_ticket' ? (
                        <span className="chat-badge app_ticket"><i className="ti ti-ticket"></i> App Ticket</span>
                      ) : (
                        <span className="chat-badge whatsapp"><i className="ti ti-comment-alt"></i> WhatsApp</span>
                      )}
                      {chat.assignee && <span className="chat-badge assignee"><i className="ti ti-user"></i> {chat.assignee}</span>}
                    </div>
                    <div className="chat-last-message">
                      {lastMessage.sender === 'agent' ? 'You: ' : ''}{lastMessage.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                No chats found matching criteria.
              </div>
            )}
          </div>

          <div className="support-pagination">
            <button 
              className="legacy-btn legacy-btn-default legacy-btn-small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <i className="ti ti-angle-left"></i> Prev
            </button>
            <span style={{ fontSize: '12px', color: '#666' }}>Page {currentPage} of {totalPages}</span>
            <button 
              className="legacy-btn legacy-btn-default legacy-btn-small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next <i className="ti ti-angle-right"></i>
            </button>
          </div>
        </div>

        {/* Right Panel - Thread */}
        <div className="support-right-panel">
          {!activeChat ? (
            <div className="support-empty-state">
              <i className="ti ti-comments"></i>
              <h3>Select a conversation</h3>
              <p>Choose a ticket or chat from the left panel to view and reply.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="support-thread-header">
                <div className="thread-user-info">
                  <h3>
                    {activeChat.type === 'app_ticket' ? (
                      <a 
                        href="#!" 
                        className="student-profile-link"
                        onClick={(e) => { e.preventDefault(); setShowProfileModal(activeChat); }}
                      >
                        {activeChat.studentName}
                      </a>
                    ) : (
                      activeChat.studentName
                    )}
                    <span className={`chat-status-badge ${activeChat.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {activeChat.status}
                    </span>
                  </h3>
                  <div className="thread-user-meta">
                    <span><strong>Source:</strong> {activeChat.type === 'app_ticket' ? 'Student App' : 'WhatsApp Bot'}</span>
                    <span>•</span>
                    <span><strong>ID:</strong> #{activeChat.id}</span>
                    <span>•</span>
                    <span><strong>Age:</strong> {calculateAgeDays(activeChat.messages)} days</span>
                  </div>
                </div>
                
                <div className="thread-actions">
                  <div className="thread-action-group">
                    <label>Assignee</label>
                    <select className="legacy-select" value={activeChat.assignee} onChange={e => handleChatMetaChange('assignee', e.target.value)}>
                      {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="thread-action-group">
                    <label>Tag</label>
                    <select className="legacy-select" value={activeChat.tag || 'None'} onChange={e => handleChatMetaChange('tag', e.target.value)}>
                      {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="thread-action-group">
                    <label>Status</label>
                    <select className="legacy-select" value={activeChat.status} onChange={e => handleChatMetaChange('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="support-thread-messages">
                {activeChat.messages.map(msg => (
                  <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}`}>
                    <div className="message-bubble">
                      <div>{msg.text}</div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              {/* Reply Box */}
              <div className="support-thread-reply">
                <div className="reply-toolbar">
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
                    Reply to {activeChat.type === 'app_ticket' ? 'Student' : 'Lead'}
                  </span>
                  <select className="legacy-select" onChange={handleTemplateChange} defaultValue="">
                    <option value="" disabled>Insert Quick Template...</option>
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <textarea 
                  className="reply-textarea" 
                  placeholder="Type your message here... (Cmd/Ctrl + Enter to send)"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendMessage();
                    }
                  }}
                ></textarea>
                <div className="reply-actions">
                  <button className="btn-send" onClick={handleSendMessage}>
                    <i className="ti ti-location-arrow" style={{ marginRight: '5px' }}></i> Send Message
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="support-modal-backdrop active" onClick={() => setShowProfileModal(null)}>
          <div className="support-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3><i className="ti ti-user"></i> Student Profile</h3>
              <button type="button" className="support-modal-close" onClick={() => setShowProfileModal(null)}>
                <i className="ti ti-close"></i>
              </button>
            </div>
            <div className="support-modal-body">
              <div className="profile-summary-card">
                <div className="profile-avatar-circle">
                  {showProfileModal.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-details-col">
                  <h4>{showProfileModal.studentName}</h4>
                  <div className="profile-subtle-text">
                    <i className="ti ti-email"></i> {showProfileModal.studentName.toLowerCase().replace(/\s+/g, '.')}@example.com
                  </div>
                  <div className="profile-subtle-text">
                    <i className="ti ti-mobile"></i> +91 9999999999
                  </div>
                </div>
              </div>
              
              <div className="profile-enrolled-section">
                <div className="enrolled-sect-title">Currently Enrolled</div>
                <div className="enrolled-badge">
                  <i className="ti ti-crown"></i> Crash Course + 2 others
                </div>
                <div className="profile-subtle-text" style={{ marginTop: '10px' }}>
                  Member since: January 14, 2026
                </div>
              </div>
            </div>
            <div className="support-modal-footer">
              <button 
                type="button" 
                className="btn-send"
                style={{ background: '#f0f4f5', color: '#16353c', boxShadow: 'none' }}
                onClick={() => setShowProfileModal(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-send"
                onClick={() => {
                  window.open('/candidate-detail', '_blank');
                  setShowProfileModal(null);
                }}
              >
                Open Full Profile <i className="ti ti-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
