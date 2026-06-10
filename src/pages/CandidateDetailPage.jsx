import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import Avatar from '../components/Avatar';
import { availableMentors, candidateDetailFallback } from '../data/candidateDetailDemo';

/* ── Helpers ── */
function fmtDate(ts) {
  if (!ts) return 'Unknown';
  return new Date(ts * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
function getValidityStatus(validUntil) {
  if (!validUntil) return 'UNKNOWN';
  const d = Math.ceil((validUntil - Date.now() / 1000) / 86400);
  if (d < 0) return 'EXPIRED';
  if (d <= 30) return 'EXPIRING SOON';
  return 'ACTIVE';
}
function getValidityClass(validUntil) {
  const s = getValidityStatus(validUntil);
  if (s === 'ACTIVE') return { background: '#d4edda', color: '#155724' };
  if (s === 'EXPIRING SOON') return { background: '#fff3cd', color: '#856404' };
  return { background: '#f8d7da', color: '#721c24' };
}
function getScoreColor(pct) {
  if (pct >= 75) return '#28a745';
  if (pct >= 50) return '#ffc107';
  return '#dc3545';
}
function getStarClass(rating, idx) {
  const sv = idx + 1;
  if (rating >= sv) return 'fa fa-star';
  if (rating >= sv - 0.5) return 'fa fa-star-half-o';
  return 'fa fa-star-o';
}
function enrichStudentData(d) {
  return {
    ...candidateDetailFallback,
    id: d.id || candidateDetailFallback.id,
    name: d.name || candidateDetailFallback.name,
    email: d.email || candidateDetailFallback.email,
    phone: d.phone || d.mobile || candidateDetailFallback.phone,
    whatsapp: d.phone || d.mobile || candidateDetailFallback.whatsapp,
    photo: d.avatar || d.photo || null,
    totalSpent: d.totalSpent || candidateDetailFallback.totalSpent,
    enrolledCourses: d.enrolledCourses?.length > 0
      ? d.enrolledCourses.map(c => ({
          ...c,
          courseCode: c.courseCode || c.courseId || 'CR0001',
          courseType: c.courseType || 'Course Bundle',
          validFrom: c.validFrom || Math.floor(Date.now() / 1000) - 30 * 86400,
          validUntil: c.validUntil || Math.floor(Date.now() / 1000) + 335 * 86400,
          progress: c.progress ?? 45,
          completedModules: c.completedModules ?? 18,
          totalModules: c.totalModules ?? 40,
          hoursSpent: c.hoursSpent ?? 87,
          payment: c.payment || candidateDetailFallback.enrolledCourses[0].payment,
        }))
      : candidateDetailFallback.enrolledCourses,
  };
}

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorSearch, setMentorSearch] = useState('');
  const [selectedNewMentor, setSelectedNewMentor] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [candidate, setCandidate] = useState(() => {
    const stored = window.localStorage.getItem('selectedStudent');
    if (!stored) return candidateDetailFallback;
    try { window.localStorage.removeItem('selectedStudent'); return enrichStudentData(JSON.parse(stored)); }
    catch { return candidateDetailFallback; }
  });

  function showToast(type, title, msg) { const id = Date.now() + Math.random(); setToasts(c => [...c, { id, type, title, message: msg }]); setTimeout(() => setToasts(c => c.filter(t => t.id !== id)), 5000); }

  const filteredMentors = useMemo(() => {
    const q = mentorSearch.trim().toLowerCase();
    if (!q) return availableMentors;
    return availableMentors.filter(m => [m.name, m.institution, m.specialization].some(v => v.toLowerCase().includes(q)));
  }, [mentorSearch]);

  function assignMentor() {
    if (!selectedNewMentor) return;
    setCandidate(c => ({ ...c, mentor: { ...selectedNewMentor } }));
    setMentorModalOpen(false);
    setMentorSearch('');
    setSelectedNewMentor(null);
    showToast('success', 'Success', 'Mentor assigned successfully!');
  }

  const tabs = [
    { key: 'profile', icon: 'ti-user', label: 'Profile' },
    { key: 'courses', icon: 'ti-book', label: 'Enrolled Courses' },
    { key: 'performance', icon: 'ti-bar-chart', label: 'Performance' },
    { key: 'feedbacks', icon: 'ti-comments', label: 'Feedbacks' },
    { key: 'activity', icon: 'ti-time', label: 'Activity' },
    { key: 'mentor', icon: 'ti-user', label: 'Mentor' },
  ];

  const sortedFeedbacks = useMemo(() =>
    [...(candidate.feedbacks || [])].sort((a, b) => b.submittedDate - a.submittedDate),
  [candidate.feedbacks]);

  return (
    <div className="container-fluid" style={{ paddingTop: '1%' }}>
      <ToastRegion toasts={toasts} onDismiss={id => setToasts(c => c.filter(t => t.id !== id))} />

      {/* ═══ Student Header ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', color: 'white', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <Avatar
            src={candidate.photo}
            name={candidate.name}
            style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }}
            placeholderStyle={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid white', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: 'white', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'white' }}>{candidate.name}</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px' }}>
              <span><i className="ti ti-id-badge"></i> {candidate.id}</span>
              <span><i className="ti ti-email"></i> {candidate.email}</span>
              <span><i className="ti ti-mobile"></i> {candidate.phone}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
              {[
                { val: candidate.enrolledCourses.length, lbl: 'Courses' },
                { val: candidate.examsTaken, lbl: 'Exams' },
                { val: `${candidate.averageScore}%`, lbl: 'Avg Score' },
                { val: `₹${candidate.totalSpent}`, lbl: 'Total Spent' },
              ].map(s => (
                <div key={s.lbl} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{s.val}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button onClick={() => navigate('/candidate-profile')} style={{ background: 'white', color: '#006073', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              <i className="ti ti-arrow-left"></i> Back
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Tab Navigation ═══ */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '25px', borderBottom: '2px solid #e9ecef' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '15px 30px', background: 'transparent', border: 'none', borderBottom: `3px solid ${activeTab === t.key ? '#006073' : 'transparent'}`, cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: activeTab === t.key ? '#006073' : '#6c757d', transition: 'all 0.2s' }}>
            <i className={`ti ${t.icon}`} style={{ marginRight: '6px' }}></i>{t.label}
          </button>
        ))}
      </div>

      {/* ═══ Profile Tab ═══ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {[
            { title: 'Personal Information', icon: 'ti-user', fields: [
              { label: 'Full Name', value: candidate.name },
              { label: 'Date of Birth', value: candidate.dob },
              { label: 'Gender', value: candidate.gender },
              { label: 'Category', value: candidate.category },
            ]},
            { title: 'Contact Information', icon: 'ti-email', fields: [
              { label: 'Email', value: candidate.email },
              { label: 'Phone', value: candidate.phone },
              { label: 'WhatsApp', value: candidate.whatsapp },
            ]},
            { title: 'Educational Background', icon: 'ti-book', fields: [
              { label: 'Current Class', value: candidate.education.currentClass },
              { label: 'School/College', value: candidate.education.institution },
              { label: 'Board', value: candidate.education.board },
              { label: 'Target Exam', value: candidate.education.targetExam },
            ]},
            { title: 'Parent Information', icon: 'ti-user', fields: [
              { label: "Father's Name", value: candidate.parent.fatherName },
              { label: "Mother's Name", value: candidate.parent.motherName },
              { label: 'Guardian Phone', value: candidate.parent.guardianPhone || candidate.parent.phone },
            ]},
          ].map(card => (
            <div key={card.title} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
              <h5 style={{ color: '#006073', margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
                <i className={`ti ${card.icon}`} style={{ marginRight: '8px' }}></i>{card.title}
              </h5>
              {card.fields.map(f => (
                <div key={f.label} style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</div>
                  <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{f.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ═══ Courses Tab ═══ */}
      {activeTab === 'courses' && candidate.enrolledCourses.map((en, idx) => (
        <div key={`${en.courseCode}-${idx}`} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', padding: '20px', borderBottom: '1px solid #dee2e6' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#006073', margin: '0 0 8px 0' }}>{en.courseName}</h3>
            <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6c757d' }}>
              <span><i className="ti ti-bookmark"></i> {en.courseCode}</span>
              <span><i className="ti ti-tag"></i> {en.courseType}</span>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            {/* Validity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px', alignItems: 'center' }}>
              <div>
                <strong>Validity Period</strong><br />
                <span style={{ fontSize: '13px', color: '#6c757d' }}>{fmtDate(en.validFrom)} to {fmtDate(en.validUntil)}</span>
              </div>
              <span style={{ ...getValidityClass(en.validUntil), padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                {getValidityStatus(en.validUntil)}
              </span>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span><strong>Progress</strong></span>
                <span><strong>{en.progress}%</strong></span>
              </div>
              <div style={{ height: '12px', background: '#e9ecef', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #006073 0%, #00a8cc 100%)', borderRadius: '6px', width: `${en.progress}%` }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                {en.completedModules} / {en.totalModules} modules • {en.hoursSpent} hours
              </div>
            </div>

            {/* Payment */}
            {en.payment && (
              <div style={{ background: '#e7f3ff', borderLeft: '3px solid #007bff', padding: '12px 15px', borderRadius: '4px', marginTop: '15px' }}>
                <h6 style={{ margin: '0 0 10px 0', color: '#007bff', fontWeight: 600 }}><i className="ti ti-credit-card"></i> Payment Details</h6>
                {[
                  ['Order Number:', en.payment.orderNumber, { fontWeight: 600 }],
                  ['Payment Method:', en.payment.method],
                  ['Original Price:', `₹${en.payment.originalPrice}`, { textDecoration: 'line-through' }],
                ].map(([l, v, s]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>{l}</span><span style={s}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(0,123,255,0.2)', paddingTop: '8px', fontWeight: 600 }}>
                  <span>Amount Paid:</span><span style={{ color: '#007bff' }}>₹{en.payment.amountPaid}</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: '15px' }}>
              <button style={{ padding: '6px 14px', fontSize: '13px', background: '#006073', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>
                <i className="ti ti-eye"></i> View Course
              </button>
              <button style={{ padding: '6px 14px', fontSize: '13px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <i className="ti ti-receipt"></i> View Invoice
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ═══ Performance Tab ═══ */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Course Progress */}
          <div style={{ flex: 1, background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333' }}><i className="ti ti-bar-chart"></i> Course Progress</h4>
            {candidate.enrolledCourses.map(en => (
              <div key={en.courseCode} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span>{en.courseName}</span>
                  <span><strong>{en.progress}%</strong></span>
                </div>
                <div style={{ height: '12px', background: '#e9ecef', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #006073 0%, #00a8cc 100%)', borderRadius: '6px', width: `${en.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Exam Results */}
          <div style={{ flex: 1, background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333' }}><i className="ti ti-clipboard"></i> Recent Exam Results</h4>
            {candidate.examResults.slice(0, 5).map(r => (
              <div key={r.examCode} style={{ background: '#f8f9fa', borderRadius: '6px', padding: '15px', marginBottom: '12px', borderLeft: '4px solid #006073' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, color: '#333' }}>{r.examName}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(r.percentage) }}>{r.percentage}%</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
                  <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>{r.score}/{r.totalMarks}</span><div style={{ fontSize: '11px', color: '#6c757d' }}>Score</div></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600, color: '#28a745' }}>{r.correct}</span><div style={{ fontSize: '11px', color: '#6c757d' }}>Correct</div></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600, color: '#dc3545' }}>{r.incorrect}</span><div style={{ fontSize: '11px', color: '#6c757d' }}>Wrong</div></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>{r.unattempted}</span><div style={{ fontSize: '11px', color: '#6c757d' }}>Skipped</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Feedbacks Tab ═══ */}
      {activeTab === 'feedbacks' && (
        <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#333' }}><i className="ti ti-comments"></i> Student Feedback History</h4>
          {sortedFeedbacks.length > 0 ? (
            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: '5px', top: '5px', bottom: '5px', width: '2px', background: '#e9ecef' }}></div>
              {sortedFeedbacks.map(fb => (
                <div key={fb.id} style={{ position: 'relative', marginBottom: '20px' }}>
                  {/* Timeline dot */}
                  <div style={{ position: 'absolute', left: '-26px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: '#006073' }}></div>
                  <div style={{ background: '#f8f9fa', padding: '12px 15px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#333' }}>Feedback on {fb.linkedItemType}: {fb.linkedItemName}</div>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px' }}>
                          <i className="ti ti-calendar"></i> {fmtDate(fb.submittedDate)}
                          {fb.rating != null && (
                            <span style={{ marginLeft: '15px', display: 'inline-block' }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <i key={s} className={getStarClass(fb.rating, s - 1)} style={{ color: '#ffb706', fontSize: '13px', marginRight: '2px' }}></i>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setQuickViewItem(fb)} style={{ fontSize: '11px', padding: '4px 12px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        <i className="ti ti-eye"></i> Quick View
                      </button>
                    </div>
                    <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #006073' }}>
                      <div style={{ fontSize: '13px', color: '#555', fontStyle: 'italic' }}>"{fb.comment}"</div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                      <span style={{ background: '#e9ecef', color: '#006073', padding: '4px 8px', borderRadius: '4px' }}>{fb.linkedItemType}</span>
                      <span style={{ marginLeft: '8px' }}>{fb.linkedItemCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <i className="ti ti-comments" style={{ fontSize: '48px', opacity: 0.3 }}></i>
              <p style={{ marginTop: '15px' }}>No feedback submitted yet</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Activity Tab ═══ */}
      {activeTab === 'activity' && (
        <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#333' }}><i className="ti ti-time"></i> Recent Activity</h4>
          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            <div style={{ position: 'absolute', left: '5px', top: '5px', bottom: '5px', width: '2px', background: '#e9ecef' }}></div>
            {(candidate.recentActivity || []).slice(0, 20).map((act, idx) => (
              <div key={`${act.title}-${idx}`} style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ position: 'absolute', left: '-26px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: '#006073' }}></div>
                <div style={{ background: '#f8f9fa', padding: '12px 15px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{act.title}</div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>{fmtDate(act.date)} • {act.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Mentor Tab ═══ */}
      {activeTab === 'mentor' && (
        <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h4 style={{ margin: 0, color: '#333' }}><i className="ti ti-user"></i> Assigned Mentor</h4>
            <button onClick={() => { setSelectedNewMentor(null); setMentorSearch(''); setMentorModalOpen(true); }} style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              <i className="ti ti-pencil"></i> Change Mentor
            </button>
          </div>

          {candidate.mentor ? (
            <div style={{ display: 'flex', gap: '25px', alignItems: 'start' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                <Avatar
                  src={candidate.mentor.photo}
                  name={candidate.mentor.name}
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #006073' }}
                  placeholderStyle={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 700 }}
                />
              </div>
              {/* Details */}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#006073' }}>{candidate.mentor.name}</h3>
                <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>{candidate.mentor.brief}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  {[
                    ['Institution (Alumni)', candidate.mentor.institution],
                    ['Graduation Year', candidate.mentor.graduationYear],
                    ['Specialization', candidate.mentor.specialization],
                    ['Rating', null],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{lbl}</div>
                      {lbl === 'Rating' ? (
                        <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>
                          <span style={{ color: '#ffc107' }}>
                            {[0, 1, 2, 3, 4].map(i => <i key={i} className={getStarClass(candidate.mentor.rating, i)} style={{ marginRight: '2px' }}></i>)}
                          </span>
                          <span style={{ marginLeft: '5px', color: '#6c757d' }}>{candidate.mentor.rating}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{val}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>
                    <i className="ti ti-email"></i> {candidate.mentor.email}
                  </button>
                  <button style={{ background: '#f8f9fa', color: '#333', border: '1px solid #e9ecef', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>
                    <i className="ti ti-mobile"></i> {candidate.mentor.phone}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <i className="ti ti-user" style={{ fontSize: '48px', opacity: 0.3 }}></i>
              <p style={{ marginTop: '15px' }}>No mentor assigned yet</p>
              <button onClick={() => { setSelectedNewMentor(null); setMentorSearch(''); setMentorModalOpen(true); }} style={{ background: '#006073', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginTop: '10px' }}>Assign a Mentor</button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Quick View Modal ═══ */}
      {quickViewItem && (
        <div className="crispr-modal-backdrop active" onClick={() => setQuickViewItem(null)}>
          <div className="crispr-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', color: 'white', borderRadius: '6px 6px 0 0' }}>
              <h4 style={{ margin: 0, color: 'white' }}><i className="ti ti-eye"></i> Quick View: {quickViewItem.linkedItemType}</h4>
              <button onClick={() => setQuickViewItem(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', opacity: 1 }}>×</button>
            </div>
            <div className="crispr-modal-body" style={{ padding: '25px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#006073', margin: '0 0 15px 0' }}>{quickViewItem.linkedItemName}</h4>
                <span style={{ background: '#006073', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>{quickViewItem.linkedItemCode}</span>
              </div>

              {quickViewItem.linkedItemDetails?.type === 'chapter' && (
                <>
                  {[['Course', quickViewItem.linkedItemDetails.courseName], ['Subject', quickViewItem.linkedItemDetails.subject], ['Duration', quickViewItem.linkedItemDetails.duration]].map(([l, v]) => (
                    <div key={l} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                      <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                    <span style={{ background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '4px', fontSize: '13px' }}>{quickViewItem.linkedItemDetails.completionStatus}</span>
                  </div>
                </>
              )}
              {quickViewItem.linkedItemDetails?.type === 'exam' && (
                <>
                  {[['Total Questions', `${quickViewItem.linkedItemDetails.totalQuestions} questions`], ['Duration', quickViewItem.linkedItemDetails.duration]].map(([l, v]) => (
                    <div key={l} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                      <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>My Score</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#006073', marginTop: '4px' }}>{quickViewItem.linkedItemDetails.myScore}</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Average Score</div>
                    <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{quickViewItem.linkedItemDetails.averageScore}</div>
                  </div>
                </>
              )}
              {quickViewItem.linkedItemDetails?.type === 'course' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Progress</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <div style={{ flex: 1, height: '10px', background: '#e9ecef', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #006073 0%, #00a8cc 100%)', width: quickViewItem.linkedItemDetails.progress }}></div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#006073' }}>{quickViewItem.linkedItemDetails.progress}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Modules</div>
                    <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{quickViewItem.linkedItemDetails.completedModules} / {quickViewItem.linkedItemDetails.totalModules} completed</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>Valid Until</div>
                    <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>{fmtDate(quickViewItem.linkedItemDetails.validUntil)}</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ borderTop: '1px solid #e9ecef', padding: '15px 25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setQuickViewItem(null)} style={{ padding: '8px 16px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
              <button style={{ padding: '8px 16px', background: '#006073', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Change Mentor Modal ═══ */}
      {mentorModalOpen && (
        <div className="crispr-modal-backdrop active" onClick={() => setMentorModalOpen(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: '800px' }} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="crispr-modal-header">
              <h3><i className="ti ti-user"></i> Change Mentor</h3>
              <button type="button" className="crispr-modal-close" onClick={() => setMentorModalOpen(false)}><i className="ti ti-close" /></button>
            </div>
            <div className="crispr-modal-body" style={{ maxHeight: '500px' }}>
              <div style={{ marginBottom: '20px' }}>
                <input type="text" value={mentorSearch} onChange={e => setMentorSearch(e.target.value)} placeholder="Search mentors by name, institution, or specialization..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #e9ecef', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gap: '15px' }}>
                {filteredMentors.map(m => {
                  const isSel = selectedNewMentor?.id === m.id;
                  return (
                    <div key={m.id} onClick={() => setSelectedNewMentor(m)}
                      style={{ border: `2px solid ${isSel ? '#006073' : '#e9ecef'}`, borderRadius: '8px', padding: '15px', cursor: 'pointer', transition: 'all 0.2s', background: isSel ? '#f8f9fa' : 'white' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ flexShrink: 0 }}>
                          <Avatar
                            src={m.photo}
                            name={m.name}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                            placeholderStyle={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                            <h5 style={{ margin: 0, color: '#006073' }}>{m.name}</h5>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: '#ffc107', fontSize: '12px' }}>
                                {[0, 1, 2, 3, 4].map(i => <i key={i} className={getStarClass(m.rating, i)}></i>)}
                              </span>
                              <span style={{ marginLeft: '3px', color: '#6c757d', fontSize: '12px' }}>{m.rating}</span>
                            </div>
                          </div>
                          <p style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '13px' }}>{m.brief}</p>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6c757d' }}>
                            <span><i className="ti ti-home"></i> {m.institution}</span>
                            <span><i className="ti ti-bookmark"></i> {m.specialization}</span>
                            <span><i className="ti ti-user"></i> Mentoring {m.mentoringStudents?.length || 0} students</span>
                          </div>
                        </div>
                        {isSel && <div style={{ flexShrink: 0 }}><i className="ti ti-check" style={{ fontSize: '24px', color: '#006073' }}></i></div>}
                      </div>
                    </div>
                  );
                })}
                {filteredMentors.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    <i className="ti ti-search" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                    <p style={{ marginTop: '15px' }}>No mentors found matching your search</p>
                  </div>
                )}
              </div>
            </div>
            <div className="legacy-modal-footer">
              <button type="button" className="legacy-btn legacy-btn-default" onClick={() => setMentorModalOpen(false)}>Cancel</button>
              <button type="button" className="legacy-btn legacy-btn-success" onClick={assignMentor} disabled={!selectedNewMentor} style={{ cursor: selectedNewMentor ? 'pointer' : 'not-allowed', opacity: selectedNewMentor ? 1 : 0.5 }}>
                <i className="ti ti-check"></i> Assign Mentor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
