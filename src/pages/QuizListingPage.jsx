import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { draftQuizzesDemo, publishedQuizzesDemo, withSampleAttempts } from '../data/quizzesDemo';

function getQuizzesFromStorage() {
  const published = window.localStorage.getItem('publishedQuizzes');
  const drafts = window.localStorage.getItem('quizDrafts');
  const publishedQuizzes = published ? JSON.parse(published) : publishedQuizzesDemo;
  const draftQuizzes = drafts ? JSON.parse(drafts) : draftQuizzesDemo;
  return withSampleAttempts([...publishedQuizzes, ...draftQuizzes]);
}

export default function QuizListingPage() {
  const navigate = useNavigate();
  const [allQuizzes, setAllQuizzes] = useState(() => getQuizzesFromStorage());
  const [currentTab, setCurrentTab] = useState('all');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [quizToPublish, setQuizToPublish] = useState(null);
  const [attemptsQuiz, setAttemptsQuiz] = useState(null);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const displayedQuizzes = useMemo(() => {
    const filteredByTab = currentTab === 'all' ? allQuizzes : allQuizzes.filter((quiz) => quiz.status === currentTab);
    return filteredByTab.filter((quiz) =>
      !quizSearchQuery.trim() || [quiz.title, quiz.description].some((value) => value?.toLowerCase().includes(quizSearchQuery.trim().toLowerCase()))
    );
  }, [allQuizzes, currentTab, quizSearchQuery]);

  function persistQuizzes(updated) {
    setAllQuizzes(updated);
    window.localStorage.setItem('publishedQuizzes', JSON.stringify(updated.filter((quiz) => quiz.status === 'published')));
    window.localStorage.setItem('quizDrafts', JSON.stringify(updated.filter((quiz) => quiz.status === 'draft')));
  }

  return (
    <section className="screen-card quiz-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Practice Quizzes</p>
          <h3>Quiz Listing</h3>
          <p className="muted-copy">Manage draft and published quizzes, inspect attempts, and open reports.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('/quiz-creation')}>Create Quiz</button>
      </div>

      <div className="tab-row">
        {['all', 'published', 'draft'].map((tab) => (
          <button key={tab} type="button" className={`ghost-button compact ${currentTab === tab ? 'active-page' : ''}`} onClick={() => setCurrentTab(tab)}>
            {tab === 'all' ? 'All Quizzes' : tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input className="search-input" placeholder="Search quizzes by title or description..." value={quizSearchQuery} onChange={(event) => setQuizSearchQuery(event.target.value)} />
        </div>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedQuizzes.map((quiz) => (
              <tr key={quiz.id}>
                <td><strong>{quiz.title}</strong><div className="student-subtle">{quiz.description}</div></td>
                <td><span className={`status-pill ${quiz.status === 'published' ? 'active' : 'inactive'}`}>{quiz.status}</span></td>
                <td>{quiz.duration} min</td>
                <td><button type="button" className="link-chip" onClick={() => setAttemptsQuiz(quiz)}>{quiz.attempts?.length || 0} Student{quiz.attempts?.length === 1 ? '' : 's'}</button></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="table-button" onClick={() => setSelectedQuiz(quiz)}>View</button>
                    <button type="button" className="table-button" onClick={() => { window.localStorage.setItem('reportQuizData', JSON.stringify(quiz)); navigate(`/quiz-attempt-report?quiz=${quiz.id}`); }}>Report</button>
                    {quiz.status === 'draft' ? <button type="button" className="table-button" onClick={() => setQuizToPublish(quiz)}>Publish</button> : null}
                    <button type="button" className="table-button danger" onClick={() => setQuizToDelete(quiz)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {displayedQuizzes.length === 0 ? <tr><td colSpan="5" className="empty-row">No quizzes found for the current tab.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {selectedQuiz ? (
        <div className="modal-scrim" role="presentation" onClick={() => setSelectedQuiz(null)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div><p className="eyebrow">Quiz Details</p><h4>{selectedQuiz.title}</h4></div>
              <button type="button" className="ghost-button" onClick={() => setSelectedQuiz(null)}>Close</button>
            </div>
            <pre className="token-preview">{JSON.stringify(selectedQuiz, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {attemptsQuiz ? (
        <div className="modal-scrim" role="presentation" onClick={() => setAttemptsQuiz(null)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div><p className="eyebrow">Attempts</p><h4>{attemptsQuiz.title}</h4></div>
              <button type="button" className="ghost-button" onClick={() => setAttemptsQuiz(null)}>Close</button>
            </div>
            <div className="stats-grid">
              <div className="detail-panel"><h4>Total Attempts</h4><p className="big-stat">{attemptsQuiz.attempts?.length || 0}</p></div>
              <div className="detail-panel"><h4>Completed</h4><p className="big-stat">{attemptsQuiz.attempts?.filter((attempt) => attempt.status === 'completed').length || 0}</p></div>
              <div className="detail-panel"><h4>In Progress</h4><p className="big-stat">{attemptsQuiz.attempts?.filter((attempt) => attempt.status !== 'completed').length || 0}</p></div>
            </div>
            <div className="student-table-shell nested-shell">
              <table className="student-table">
                <thead><tr><th>Student</th><th>Status</th><th>Started</th><th>Score</th></tr></thead>
                <tbody>
                  {(attemptsQuiz.attempts || []).map((attempt, index) => (
                    <tr key={`${attempt.studentEmail}-${index}`}>
                      <td><strong>{attempt.studentName}</strong><div className="student-subtle">{attempt.studentEmail}</div></td>
                      <td><span className={`status-pill ${attempt.status === 'completed' ? 'active' : 'expiring-soon'}`}>{attempt.status}</span></td>
                      <td>{new Date(attempt.startedAt).toLocaleString('en-IN')}</td>
                      <td>{attempt.score ?? 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {quizToDelete ? (
        <div className="modal-scrim" role="presentation" onClick={() => setQuizToDelete(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Delete Quiz</p>
            <h4>Delete "{quizToDelete.title}"?</h4>
            <p className="muted-copy">All quiz data and attempts will be removed from local storage.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setQuizToDelete(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { const updated = allQuizzes.filter((quiz) => quiz.id !== quizToDelete.id); persistQuizzes(updated); showToast('success', 'Quiz Deleted', 'Quiz deleted successfully.'); setQuizToDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      {quizToPublish ? (
        <div className="modal-scrim" role="presentation" onClick={() => setQuizToPublish(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Publish Quiz</p>
            <h4>Publish "{quizToPublish.title}"?</h4>
            <p className="muted-copy">Once published, students will be able to access this quiz.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setQuizToPublish(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { const updated = allQuizzes.map((quiz) => quiz.id === quizToPublish.id ? { ...quiz, status: 'published' } : quiz); persistQuizzes(updated); showToast('success', 'Quiz Published', 'Quiz published successfully!'); setQuizToPublish(null); }}>Publish</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
