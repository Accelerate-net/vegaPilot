import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { examsDemo } from '../data/examsDemo';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ExamListingPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState(() => {
    const storedDrafts = window.localStorage.getItem('examDrafts');
    const storedPublished = window.localStorage.getItem('publishedExams');
    const drafts = storedDrafts ? JSON.parse(storedDrafts) : [];
    const published = storedPublished ? JSON.parse(storedPublished) : [];
    const map = new Map();
    [...published, ...drafts, ...examsDemo].forEach((exam) => {
      if (!map.has(exam.id)) map.set(exam.id, exam);
    });
    return [...map.values()];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [sortColumn, setSortColumn] = useState('title');
  const [sortReverse, setSortReverse] = useState(false);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const filteredExams = useMemo(() => {
    const filtered = exams.filter((exam) =>
      !searchQuery.trim() || [exam.title, exam.displayKey, exam.brief].some((value) => String(value).toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );
    return filtered.sort((a, b) => {
      const left = a[sortColumn];
      const right = b[sortColumn];
      if (left < right) return sortReverse ? 1 : -1;
      if (left > right) return sortReverse ? -1 : 1;
      return 0;
    });
  }, [exams, searchQuery, sortColumn, sortReverse]);

  function duplicateExam(exam) {
    const duplicatedExam = {
      ...exam,
      id: Math.max(...exams.map((entry) => entry.id)) + 1,
      displayKey: generateUUID(),
      title: `${exam.title} (Copy)`,
      status: 0,
      createdOn: Math.floor(Date.now() / 1000),
    };
    const updated = [duplicatedExam, ...exams];
    setExams(updated);
    const drafts = updated.filter((entry) => entry.status === 0);
    window.localStorage.setItem('examDrafts', JSON.stringify(drafts));
    showToast('success', 'Exam Duplicated', 'Exam duplicated successfully! The new exam is now in Draft mode.');
  }

  return (
    <section className="screen-card exam-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Exams</p>
          <h3>Exam Listing</h3>
          <p className="muted-copy">Manage exam drafts and published tests, launch reports, and duplicate/edit flows.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('/exam-creation-wizard')}>Create New Exam</button>
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input className="search-input" placeholder="Search exams by title or key..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </div>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-button" onClick={() => { setSortColumn('displayKey'); setSortReverse((value) => !value); }}>Exam Key</button></th>
              <th><button type="button" className="sort-button" onClick={() => { setSortColumn('title'); setSortReverse((value) => !value); }}>Title</button></th>
              <th>Duration</th>
              <th>Questions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.displayKey}</td>
                <td><strong>{exam.title}</strong><div className="student-subtle">{exam.brief}</div></td>
                <td>{exam.duration} min</td>
                <td>{exam.totalQuestions}</td>
                <td><span className={`status-pill ${exam.status === 1 ? 'active' : 'inactive'}`}>{exam.status === 1 ? 'Active' : 'Draft'}</span></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="table-button" onClick={() => { window.localStorage.setItem('reportExamData', JSON.stringify(exam)); navigate(`/exam-attempt-report?exam=${exam.id}`); }}>Report</button>
                    <button type="button" className="table-button" onClick={() => navigate(`/exam-creation-wizard?edit=${exam.id}`)}>Edit</button>
                    <button type="button" className="table-button" onClick={() => duplicateExam(exam)}>Duplicate</button>
                    <button type="button" className="table-button danger" onClick={() => setExamToDelete(exam)}>Delete</button>
                    <button type="button" className="table-button" onClick={() => setSelectedExam(exam)}>View</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredExams.length === 0 ? <tr><td colSpan="6" className="empty-row">No exams found.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {selectedExam ? (
        <div className="modal-scrim" role="presentation" onClick={() => setSelectedExam(null)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div><p className="eyebrow">Exam Details</p><h4>{selectedExam.title}</h4></div>
              <button type="button" className="ghost-button" onClick={() => setSelectedExam(null)}>Close</button>
            </div>
            <pre className="token-preview">{JSON.stringify(selectedExam, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {examToDelete ? (
        <div className="modal-scrim" role="presentation" onClick={() => setExamToDelete(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Delete Exam</p>
            <h4>Delete "{examToDelete.title}"?</h4>
            <p className="muted-copy">This action cannot be undone.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setExamToDelete(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => {
                setExams((current) => current.filter((exam) => exam.id !== examToDelete.id));
                window.localStorage.setItem('examDrafts', JSON.stringify(JSON.parse(window.localStorage.getItem('examDrafts') || '[]').filter((exam) => exam.id !== examToDelete.id)));
                window.localStorage.setItem('publishedExams', JSON.stringify(JSON.parse(window.localStorage.getItem('publishedExams') || '[]').filter((exam) => exam.id !== examToDelete.id)));
                showToast('success', 'Exam Deleted', `Exam "${examToDelete.title}" deleted successfully!`);
                setExamToDelete(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
