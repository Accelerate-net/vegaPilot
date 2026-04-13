import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';

export default function LiveClassActivityPlannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const classId = params.get('classId') || 'LC-Unknown';

  const [toasts, setToasts] = useState([]);
  const [activities, setActivities] = useState([
    {
      id: 'ACT-01',
      type: 'poll',
      title: 'How well do you understand thermodynamics?',
      options: ['Very well', 'Somewhat', 'Not really', 'Completely lost'],
      status: 'draft',
    },
    {
      id: 'ACT-02',
      type: 'quiz',
      title: 'Mid-session Checkpoint Quiz',
      duration: 10,
      questions: [
        { q: 'What is the First Law of Thermodynamics?', options: ['Conservation of Energy', 'Entropy increases', 'F=ma', 'E=mc2'], correct: 0 },
      ],
      status: 'draft',
    }
  ]);

  const [showPollModal, setShowPollModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [viewingActivity, setViewingActivity] = useState(null);

  // Poll Form
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Quiz Form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState([
    { question: '', imageUrl: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }

  function handleSavePoll() {
    if (!pollQuestion.trim()) return showToast('error', 'Error', 'Poll question cannot be empty.');
    if (pollOptions.some(opt => !opt.trim())) return showToast('error', 'Error', 'All options must be filled.');
    if (pollOptions.length < 2) return showToast('error', 'Error', 'A poll requires at least 2 options.');

    const newPoll = {
      id: `ACT-${Date.now()}`,
      type: 'poll',
      title: pollQuestion,
      options: pollOptions,
      status: 'draft',
    };
    setActivities(curr => [...curr, newPoll]);
    setShowPollModal(false);
    showToast('success', 'Draft Saved', 'Poll activity has been pre-configured successfully.');
    setPollQuestion('');
    setPollOptions(['', '']);
  }

  function addPollOption() {
    setPollOptions([...pollOptions, '']);
  }

  function updatePollOption(val, idx) {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  }

  function removePollOption(idx) {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  }

  function handleSaveQuiz() {
    if (!quizTitle.trim()) return showToast('error', 'Error', 'Quiz title cannot be empty.');
    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.question.trim()) return showToast('error', 'Error', `Question ${i + 1} is empty.`);
      if (q.options.some(o => !o.trim())) return showToast('error', 'Error', `All 4 options must be filled for Question ${i + 1}.`);
    }

    const newQuiz = {
      id: `ACT-${Date.now()}`,
      type: 'quiz',
      title: quizTitle,
      duration: quizDuration,
      questions: quizQuestions,
      status: 'draft',
    };
    setActivities(curr => [...curr, newQuiz]);
    setShowQuizModal(false);
    showToast('success', 'Draft Saved', 'Quiz activity has been pre-configured successfully.');
    setQuizTitle('');
    setQuizDuration(10);
    setQuizQuestions([{ question: '', imageUrl: '', options: ['', '', '', ''], correctIndex: 0 }]);
  }

  function addQuizQuestion() {
    setQuizQuestions([...quizQuestions, { question: '', imageUrl: '', options: ['', '', '', ''], correctIndex: 0 }]);
  }

  function removeQuizQuestion(idx) {
    if (quizQuestions.length === 1) return showToast('error', 'Error', 'You must have at least 1 question.');
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  }

  function updateQuizQuestion(idx, field, value) {
    const next = [...quizQuestions];
    next[idx] = { ...next[idx], [field]: value };
    setQuizQuestions(next);
  }

  function updateQuizOption(qIdx, optIdx, val) {
    const next = [...quizQuestions];
    const newOptions = [...next[qIdx].options];
    newOptions[optIdx] = val;
    next[qIdx].options = newOptions;
    setQuizQuestions(next);
  }

  function renderActivityCard(act) {
    const isPoll = act.type === 'poll';
    return (
      <div key={act.id} style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', 
        display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '300px', maxWidth: '400px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`ear-status-badge ${isPoll ? 'ear-stat-indigo' : 'ear-stat-teal'}`} style={{ color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {isPoll ? 'Poll' : 'Quiz'}
          </span>
          <span style={{ fontSize: '12px', background: '#eef4f5', color: '#59757b', padding: '4px 8px', borderRadius: '4px' }}>Draft Configured</span>
        </div>
        
        <h4 style={{ margin: 0, color: 'var(--ink)' }}>{act.title}</h4>
        
        {isPoll ? (
          <div style={{ fontSize: '13px', color: '#59757b' }}>
            <strong>{act.options.length}</strong> options defined.
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#59757b' }}>
            <span style={{ marginRight: '16px' }}><i className="ti ti-timer" /> {act.duration} Minutes Timer</span>
            <span><i className="ti ti-hand-drag" /> {act.questions.length} Questions</span>
          </div>
        )}
        
        <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setViewingActivity(act)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #006073', background: 'transparent', color: '#006073', cursor: 'pointer', fontSize: '13px', flex: 1 }}>
            Quick View
          </button>
          <button type="button" onClick={() => setActivities(activities.filter(a => a.id !== act.id))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '13px', flex: 1 }}>
            Delete
          </button>
          <button type="button" style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#006073', color: 'white', opacity: 0.5, cursor: 'not-allowed', fontSize: '13px', flex: 1 }}>
            Publish
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="courses-list-page" style={{ position: 'relative', minHeight: '100vh', paddingBottom: '40px' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {/* ── Page Header ── */}
      <div className="page-header-section" style={{ background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ti ti-layout-media-overlay" style={{ color: '#006073' }} /> Activity Planner
          </h2>
          <p style={{ margin: '6px 0 0', color: '#59757b' }}>
            Pre-configure Polls and Quizzes for <strong>{classId}</strong>. These drafts will be available in the Studio to publish during the live stream.
          </p>
        </div>
        <button type="button" className="ghost-button" style={{ border: '1px solid #006073', color: '#006073', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }} onClick={() => navigate(-1)}>
          <i className="ti ti-arrow-left" /> Back to Scheduler
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button type="button" onClick={() => setShowPollModal(true)} style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--ink)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#006073', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <i className="ti ti-bar-chart" />
          </div>
          <strong style={{ fontSize: '16px' }}>Add a New Poll</strong>
          <span style={{ fontSize: '13px', color: '#59757b', textAlign: 'center' }}>Quick single-question check-in with multiple options. Ideal for gauging audience sentiment instantly.</span>
        </button>
        <button type="button" onClick={() => setShowQuizModal(true)} style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--ink)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fbbf24', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <i className="ti ti-hand-point-up" />
          </div>
          <strong style={{ fontSize: '16px' }}>Configure a Quiz</strong>
          <span style={{ fontSize: '13px', color: '#59757b', textAlign: 'center' }}>Set up multi-question timed assessments. The studio automates marking and leaderboard delivery.</span>
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ti ti-layers" /> Planned Drafts ({activities.length})</h3>
        
        {activities.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {activities.map(renderActivityCard)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#59757b' }}>
            <i className="ti ti-layout-media-overlay" style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px', display: 'block' }} />
            No activities have been planned for this live class yet. Pre-configure polls or quizzes above.
          </div>
        )}
      </div>

      {/* ── Poll Configuration Modal ── */}
      {showPollModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: '#006073', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}><i className="ti ti-bar-chart" /> Configure Poll</h3>
              <button type="button" onClick={() => setShowPollModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><i className="ti ti-close" /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Question Prompt <span style={{ color: '#dc2626' }}>*</span></label>
                <input 
                  type="text" 
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}
                  placeholder="e.g. Is everyone able to hear me clearly?" 
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Options <span style={{ color: '#dc2626' }}>*</span></label>
                {pollOptions.map((opt, index) => (
                  <div key={`opt-${index}`} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => updatePollOption(e.target.value, index)}
                      style={{ flex: 1, border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}
                      placeholder={`Option ${index + 1}`} 
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => removePollOption(index)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        <i className="ti ti-trash" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <button type="button" onClick={addPollOption} style={{ marginTop: '8px', background: 'transparent', border: '1px dashed #006073', color: '#006073', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <i className="ti ti-plus" /> Add Option
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
              <button type="button" onClick={() => setShowPollModal(false)} style={{ border: '1px solid var(--line)', background: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSavePoll} style={{ border: 'none', background: '#006073', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save as Draft</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Configuration Modal ── */}
      {showQuizModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: '#006073', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}><i className="ti ti-hand-point-up" /> Configure Quiz</h3>
              <button type="button" onClick={() => setShowQuizModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><i className="ti ti-close" /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2 }}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Quiz Title <span style={{ color: '#dc2626' }}>*</span></label>
                  <input 
                    type="text" 
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}
                    placeholder="e.g. End of Session Exam" 
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Duration (Minutes) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input 
                    type="number" 
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value))}
                    style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}
                    min={1}
                    max={120}
                  />
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--line)' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {quizQuestions.map((q, qIndex) => (
                  <div key={`q-${qIndex}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ color: '#006073' }}>Question {qIndex + 1}</strong>
                      <button type="button" onClick={() => removeQuizQuestion(qIndex)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px' }} title="Remove Question">
                        <i className="ti ti-trash" />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <textarea 
                        value={q.question}
                        onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                        style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                        placeholder="Type the question content here..." 
                      />
                      <input 
                        type="url" 
                        value={q.imageUrl}
                        onChange={(e) => updateQuizQuestion(qIndex, 'imageUrl', e.target.value)}
                        style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}
                        placeholder="Optional: Enter an image URL for the question context" 
                      />

                      <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                        {q.options.map((opt, oIndex) => (
                          <div key={`q${qIndex}-o${oIndex}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: q.correctIndex === oIndex ? '#ecfdf5' : 'white', border: `1px solid ${q.correctIndex === oIndex ? '#10b981' : 'var(--line)'}`, borderRadius: '8px', padding: '8px 12px' }}>
                            <input 
                              type="radio" 
                              name={`correct-q${qIndex}`} 
                              checked={q.correctIndex === oIndex}
                              onChange={() => updateQuizQuestion(qIndex, 'correctIndex', oIndex)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <input 
                              type="text" 
                              value={opt}
                              onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }}
                              placeholder={`Option ${['A','B','C','D'][oIndex]}`}
                            />
                            {q.correctIndex === oIndex && <i className="ti ti-check" style={{ color: '#10b981' }} />}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: '#59757b' }}>* Select the radio button to mark the correct option.</div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addQuizQuestion} style={{ alignSelf: 'flex-start', background: '#eef4f5', border: '1px solid #006073', color: '#006073', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className="ti ti-plus" /> Add Next Question
                </button>

              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
              <button type="button" onClick={() => setShowQuizModal(false)} style={{ border: '1px solid var(--line)', background: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSaveQuiz} style={{ border: 'none', background: '#006073', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Quiz Draft</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick View Modal ── */}
      {viewingActivity && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: '#006073', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}><i className="ti ti-eye" /> Quick View: {viewingActivity.type === 'poll' ? 'Poll' : 'Quiz'}</h3>
              <button type="button" onClick={() => setViewingActivity(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><i className="ti ti-close" /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--ink)' }}>{viewingActivity.title}</h4>
                {viewingActivity.type === 'quiz' && (
                  <div style={{ fontSize: '13px', color: '#59757b' }}>
                    <i className="ti ti-timer" /> Duration: {viewingActivity.duration} Minutes
                  </div>
                )}
              </div>

              {viewingActivity.type === 'poll' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viewingActivity.options.map((opt, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '14px' }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {viewingActivity.type === 'quiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {viewingActivity.questions.map((q, i) => {
                    // Handle both new dynamically created format and initial mocked format gracefully
                    const content = q.question || q.q; 
                    const correctIdx = q.correctIndex !== undefined ? q.correctIndex : q.correct;
                    
                    return (
                      <div key={i} style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#006073' }}>Question {i + 1}</div>
                        <div style={{ marginBottom: '16px', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{content}</div>
                        {q.imageUrl && (
                          <div style={{ marginBottom: '16px' }}>
                            <img src={q.imageUrl} alt={`Img ${i}`} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--line)' }} />
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px' }}>
                          {q.options.map((opt, oItx) => (
                            <div key={oItx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: correctIdx === oItx ? '#ecfdf5' : '#f8fafc', border: `1px solid ${correctIdx === oItx ? '#10b981' : 'var(--line)'}` }}>
                              <span style={{ fontWeight: 'bold', width: '20px', color: '#59757b' }}>{['A','B','C','D'][oItx]}</span>
                              <span style={{ fontSize: '14px', flex: 1 }}>{opt}</span>
                              {correctIdx === oItx && <i className="ti ti-check" style={{ color: '#10b981' }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setViewingActivity(null)} style={{ border: 'none', background: '#006073', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close Quick View</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
