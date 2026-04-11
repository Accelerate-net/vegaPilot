import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableMentors, candidateDetailFallback } from '../data/candidateDetailDemo';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getValidityStatus(validUntil) {
  if (!validUntil) return 'UNKNOWN';
  const daysRemaining = Math.ceil((validUntil - Date.now() / 1000) / 86400);
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 30) return 'EXPIRING SOON';
  return 'ACTIVE';
}

function getScoreTone(percentage) {
  if (percentage >= 75) return 'active';
  if (percentage >= 50) return 'expiring-soon';
  return 'expired';
}

function getStarString(rating) {
  const rounded = Math.round(rating || 0);
  return '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded);
}

function enrichStudentData(studentData) {
  return {
    ...candidateDetailFallback,
    id: studentData.id || candidateDetailFallback.id,
    name: studentData.name || candidateDetailFallback.name,
    email: studentData.email || candidateDetailFallback.email,
    phone: studentData.phone || studentData.mobile || candidateDetailFallback.phone,
    whatsapp: studentData.phone || studentData.mobile || candidateDetailFallback.whatsapp,
    photo: studentData.avatar || studentData.photo || null,
    totalSpent: studentData.totalSpent || candidateDetailFallback.totalSpent,
    enrolledCourses:
      studentData.enrolledCourses && studentData.enrolledCourses.length > 0
        ? studentData.enrolledCourses.map((course) => ({
            ...course,
            courseCode: course.courseCode || course.courseId || 'CR0001',
            courseType: course.courseType || 'Course Bundle',
            validFrom: course.validFrom || Math.floor(Date.now() / 1000) - 30 * 86400,
            validUntil: course.validUntil || Math.floor(Date.now() / 1000) + 335 * 86400,
            progress: course.progress ?? 45,
            completedModules: course.completedModules ?? 18,
            totalModules: course.totalModules ?? 40,
            hoursSpent: course.hoursSpent ?? 87,
            payment: course.payment || candidateDetailFallback.enrolledCourses[0].payment,
          }))
        : candidateDetailFallback.enrolledCourses,
  };
}

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [candidate, setCandidate] = useState(() => {
    const storedStudent = window.localStorage.getItem('selectedStudent');
    if (!storedStudent) {
      return candidateDetailFallback;
    }
    try {
      window.localStorage.removeItem('selectedStudent');
      return enrichStudentData(JSON.parse(storedStudent));
    } catch {
      return candidateDetailFallback;
    }
  });

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }

  const filteredMentors = useMemo(() => {
    const query = mentorSearchQuery.trim().toLowerCase();
    if (!query) return availableMentors;
    return availableMentors.filter((mentor) =>
      [mentor.name, mentor.institution, mentor.specialization].some((value) => value.toLowerCase().includes(query))
    );
  }, [mentorSearchQuery]);

  function assignMentor(mentor) {
    setCandidate((current) => ({ ...current, mentor }));
    setMentorModalOpen(false);
    setMentorSearchQuery('');
    showToast('success', 'Success', 'Mentor assigned successfully!');
  }

  const tabs = [
    ['profile', 'Profile'],
    ['courses', 'Enrolled Courses'],
    ['performance', 'Performance'],
    ['feedbacks', 'Feedbacks'],
    ['activity', 'Activity'],
    ['mentor', 'Mentor'],
  ];

  return (
    <section className="screen-card detail-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="detail-hero">
        <div className="student-cell">
          {candidate.photo ? <img alt={candidate.name} className="avatar hero-avatar" src={candidate.photo} /> : <div className="avatar placeholder hero-avatar">{getInitials(candidate.name)}</div>}
          <div>
            <h3>{candidate.name}</h3>
            <div className="detail-meta">{candidate.id} • {candidate.email} • {candidate.phone}</div>
          </div>
        </div>
        <button className="ghost-button" type="button" onClick={() => navigate('/candidate-profile')}>Back</button>
      </div>

      <div className="stats-grid">
        <div className="detail-panel"><h4>Courses</h4><p className="big-stat">{candidate.enrolledCourses.length}</p></div>
        <div className="detail-panel"><h4>Exams</h4><p className="big-stat">{candidate.examsTaken}</p></div>
        <div className="detail-panel"><h4>Avg Score</h4><p className="big-stat">{candidate.averageScore}%</p></div>
        <div className="detail-panel"><h4>Total Spent</h4><p className="big-stat">₹{candidate.totalSpent}</p></div>
      </div>

      <div className="tab-row">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={`ghost-button compact ${activeTab === key ? 'active-page' : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Personal Information</h4>
            <p><strong>Full Name:</strong> {candidate.name}</p>
            <p><strong>Date of Birth:</strong> {candidate.dob}</p>
            <p><strong>Gender:</strong> {candidate.gender}</p>
            <p><strong>Category:</strong> {candidate.category}</p>
          </article>
          <article className="detail-panel">
            <h4>Contact Information</h4>
            <p><strong>Email:</strong> {candidate.email}</p>
            <p><strong>Phone:</strong> {candidate.phone}</p>
            <p><strong>WhatsApp:</strong> {candidate.whatsapp}</p>
          </article>
          <article className="detail-panel">
            <h4>Educational Background</h4>
            <p><strong>Current Class:</strong> {candidate.education.currentClass}</p>
            <p><strong>Institution:</strong> {candidate.education.institution}</p>
            <p><strong>Board:</strong> {candidate.education.board}</p>
            <p><strong>Target Exam:</strong> {candidate.education.targetExam}</p>
          </article>
          <article className="detail-panel">
            <h4>Parent Information</h4>
            <p><strong>Father:</strong> {candidate.parent.fatherName}</p>
            <p><strong>Mother:</strong> {candidate.parent.motherName}</p>
            <p><strong>Guardian Phone:</strong> {candidate.parent.guardianPhone || candidate.parent.phone}</p>
          </article>
        </div>
      ) : null}

      {activeTab === 'courses' ? (
        <div className="stack-grid">
          {candidate.enrolledCourses.map((enrollment) => (
            <article key={`${enrollment.courseCode}-${enrollment.validUntil}`} className="detail-panel">
              <div className="hero-row">
                <div>
                  <h4>{enrollment.courseName}</h4>
                  <p className="muted-copy">{enrollment.courseCode} • {enrollment.courseType}</p>
                </div>
                <span className={`status-pill ${getValidityStatus(enrollment.validUntil).toLowerCase().replace(/\s+/g, '-')}`}>{getValidityStatus(enrollment.validUntil)}</span>
              </div>
              <p><strong>Validity:</strong> {formatDate(enrollment.validFrom)} to {formatDate(enrollment.validUntil)}</p>
              <p><strong>Progress:</strong> {enrollment.progress}% • {enrollment.completedModules}/{enrollment.totalModules} modules • {enrollment.hoursSpent} hours</p>
              <p><strong>Order:</strong> {enrollment.payment?.orderNumber} • <strong>Amount Paid:</strong> ₹{enrollment.payment?.amountPaid}</p>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === 'performance' ? (
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Course Progress</h4>
            {candidate.enrolledCourses.map((enrollment) => (
              <div key={enrollment.courseCode} className="progress-block">
                <div className="hero-row"><span>{enrollment.courseName}</span><strong>{enrollment.progress}%</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${enrollment.progress}%` }} /></div>
              </div>
            ))}
          </article>
          <article className="detail-panel">
            <h4>Recent Exam Results</h4>
            {candidate.examResults.map((result) => (
              <div key={result.examCode} className="result-card">
                <div className="hero-row">
                  <div>
                    <strong>{result.examName}</strong>
                    <div className="student-subtle">{formatDate(result.attemptDate)}</div>
                  </div>
                  <span className={`status-pill ${getScoreTone(result.percentage)}`}>{result.percentage}%</span>
                </div>
                <div className="result-grid">
                  <span>{result.score}/{result.totalMarks} Score</span>
                  <span>{result.correct} Correct</span>
                  <span>{result.incorrect} Wrong</span>
                  <span>{result.unattempted} Skipped</span>
                </div>
              </div>
            ))}
          </article>
        </div>
      ) : null}

      {activeTab === 'feedbacks' ? (
        <div className="stack-grid">
          {candidate.feedbacks.map((feedback) => (
            <article key={feedback.id} className="detail-panel">
              <div className="hero-row">
                <div>
                  <strong>{feedback.linkedItemType}: {feedback.linkedItemName}</strong>
                  <div className="student-subtle">{formatDate(feedback.submittedDate)} • {feedback.linkedItemCode}</div>
                </div>
                <button type="button" className="ghost-button compact" onClick={() => setQuickViewItem(feedback)}>Quick View</button>
              </div>
              <p className="muted-copy">"{feedback.comment}"</p>
              <div className="student-subtle">{getStarString(feedback.rating)} ({feedback.rating})</div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === 'activity' ? (
        <div className="stack-grid">
          {candidate.recentActivity.map((activity, index) => (
            <article key={`${activity.title}-${index}`} className="detail-panel">
              <strong>{activity.title}</strong>
              <div className="student-subtle">{formatDate(activity.date)} • {activity.description}</div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === 'mentor' ? (
        <article className="detail-panel">
          <div className="hero-row">
            <div>
              <h4>Assigned Mentor</h4>
              <p className="muted-copy">Manage the student’s mentoring ownership.</p>
            </div>
            <button type="button" className="primary-button" onClick={() => setMentorModalOpen(true)}>Change Mentor</button>
          </div>
          {candidate.mentor ? (
            <div className="mentor-card">
              <div className="avatar placeholder hero-avatar">{getInitials(candidate.mentor.name)}</div>
              <div>
                <h4>{candidate.mentor.name}</h4>
                <p className="muted-copy">{candidate.mentor.brief}</p>
                <p><strong>Institution:</strong> {candidate.mentor.institution}</p>
                <p><strong>Specialization:</strong> {candidate.mentor.specialization}</p>
                <p><strong>Rating:</strong> {getStarString(candidate.mentor.rating)} ({candidate.mentor.rating})</p>
                <p><strong>Email:</strong> {candidate.mentor.email}</p>
                <p><strong>Phone:</strong> {candidate.mentor.phone}</p>
              </div>
            </div>
          ) : (
            <div className="empty-row standalone">No mentor assigned yet.</div>
          )}
        </article>
      ) : null}

      {quickViewItem ? (
        <div className="modal-scrim" role="presentation" onClick={() => setQuickViewItem(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Quick View</p>
                <h4>{quickViewItem.linkedItemType}: {quickViewItem.linkedItemName}</h4>
              </div>
              <button type="button" className="ghost-button" onClick={() => setQuickViewItem(null)}>Close</button>
            </div>
            <p><strong>Code:</strong> {quickViewItem.linkedItemCode}</p>
            <p><strong>Comment:</strong> {quickViewItem.comment}</p>
            {quickViewItem.linkedItemDetails ? <pre className="token-preview">{JSON.stringify(quickViewItem.linkedItemDetails, null, 2)}</pre> : null}
          </div>
        </div>
      ) : null}

      {mentorModalOpen ? (
        <div className="modal-scrim" role="presentation" onClick={() => setMentorModalOpen(false)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Mentors</p>
                <h4>Assign a Mentor</h4>
              </div>
              <button type="button" className="ghost-button" onClick={() => setMentorModalOpen(false)}>Close</button>
            </div>
            <input className="search-input" placeholder="Search mentors by name, institution, or specialization..." value={mentorSearchQuery} onChange={(event) => setMentorSearchQuery(event.target.value)} />
            <div className="course-grid mentor-grid">
              {filteredMentors.map((mentor) => (
                <button key={mentor.id} type="button" className="detail-panel mentor-option" onClick={() => assignMentor(mentor)}>
                  <div className="hero-row">
                    <strong>{mentor.name}</strong>
                    <span className="student-subtle">{mentor.rating}</span>
                  </div>
                  <p className="muted-copy">{mentor.brief}</p>
                  <p className="student-subtle">{mentor.institution} • {mentor.specialization}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
