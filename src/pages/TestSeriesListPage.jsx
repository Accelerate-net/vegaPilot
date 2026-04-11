import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { examsDemo } from '../data/examsDemo';
import { testSeriesDemo } from '../data/testSeriesDemo';

function loadAvailableExams() {
  const drafts = JSON.parse(window.localStorage.getItem('examDrafts') || '[]');
  const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]');
  const map = new Map();
  [...published, ...drafts, ...examsDemo].forEach((exam) => {
    if (!map.has(exam.id)) map.set(exam.id, exam);
  });
  return [...map.values()];
}

function loadSeries() {
  const stored = window.localStorage.getItem('testSeriesList');
  if (!stored) return testSeriesDemo;
  try {
    return JSON.parse(stored);
  } catch (error) {
    return testSeriesDemo;
  }
}

export default function TestSeriesListPage() {
  const [allExams] = useState(() => loadAvailableExams());
  const [seriesList, setSeriesList] = useState(() => loadSeries());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortReverse, setSortReverse] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [editingSeries, setEditingSeries] = useState(null);
  const [selectedExamsMap, setSelectedExamsMap] = useState({});
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [formState, setFormState] = useState({ name: '', description: '', status: 1 });

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  function persist(next) {
    setSeriesList(next);
    window.localStorage.setItem('testSeriesList', JSON.stringify(next));
  }

  const visibleSeries = useMemo(() => {
    const filtered = seriesList.filter((series) =>
      !searchQuery.trim() || [series.name, series.description].some((value) => String(value || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );
    return filtered.sort((left, right) => {
      const leftValue = left[sortColumn] ?? '';
      const rightValue = right[sortColumn] ?? '';
      if (leftValue < rightValue) return sortReverse ? 1 : -1;
      if (leftValue > rightValue) return sortReverse ? -1 : 1;
      return 0;
    });
  }, [seriesList, searchQuery, sortColumn, sortReverse]);

  const visibleExams = useMemo(() => allExams.filter((exam) => !examSearchQuery.trim() || [exam.title, exam.brief].some((value) => String(value || '').toLowerCase().includes(examSearchQuery.trim().toLowerCase()))), [allExams, examSearchQuery]);

  function openCreateModal(series) {
    if (series) {
      setEditingSeries(series);
      setFormState({ name: series.name, description: series.description, status: series.status });
      const selected = {};
      series.exams.forEach((examInfo) => {
        const exam = allExams.find((entry) => entry.id === examInfo.examId);
        if (exam) selected[exam.id] = { exam, accessType: examInfo.accessType };
      });
      setSelectedExamsMap(selected);
    } else {
      setEditingSeries(null);
      setFormState({ name: '', description: '', status: 1 });
      setSelectedExamsMap({});
    }
    setExamSearchQuery('');
    setIsModalOpen(true);
  }

  function toggleExamSelection(exam) {
    setSelectedExamsMap((current) => {
      if (current[exam.id]) {
        const next = { ...current };
        delete next[exam.id];
        return next;
      }
      return { ...current, [exam.id]: { exam, accessType: 'premium' } };
    });
  }

  function saveSeries() {
    if (!formState.name.trim() || Object.keys(selectedExamsMap).length === 0) {
      showToast('error', 'Series Incomplete', 'Enter a name and select at least one exam.');
      return;
    }

    const payload = {
      id: editingSeries?.id || Date.now(),
      name: formState.name,
      description: formState.description,
      status: Number(formState.status),
      exams: Object.values(selectedExamsMap).map((item) => ({
        examId: item.exam.id,
        examTitle: item.exam.title,
        accessType: item.accessType,
      })),
      createdAt: editingSeries?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = editingSeries
      ? seriesList.map((series) => series.id === editingSeries.id ? payload : series)
      : [payload, ...seriesList];
    persist(next);
    setIsModalOpen(false);
    showToast('success', editingSeries ? 'Series Updated' : 'Series Created', `${payload.name} saved successfully.`);
  }

  return (
    <section className="screen-card">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Test Series</p>
          <h3>Test Series List</h3>
          <p className="muted-copy">Manage grouped exam collections and assign free or premium access per exam.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openCreateModal(null)}>Create Test Series</button>
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input className="search-input" placeholder="Search test series..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </div>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-button" onClick={() => { setSortColumn('name'); setSortReverse((value) => !value); }}>Name</button></th>
              <th>Description</th>
              <th>Exams</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleSeries.map((series) => (
              <tr key={series.id}>
                <td><strong>{series.name}</strong></td>
                <td>{series.description}</td>
                <td>
                  <div className="chip-row">
                    {series.exams.map((exam) => <span key={`${series.id}-${exam.examId}`} className={`status-pill ${exam.accessType === 'free' ? 'active' : 'inactive'}`}>{exam.examTitle} · {exam.accessType}</span>)}
                  </div>
                </td>
                <td><span className={`status-pill ${series.status === 1 ? 'active' : 'inactive'}`}>{series.status === 1 ? 'Active' : 'Inactive'}</span></td>
                <td>{new Date(series.updatedAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="table-button" onClick={() => openCreateModal(series)}>Edit</button>
                    <button type="button" className="table-button danger" onClick={() => { setSeriesToDelete(series); setIsDeleteOpen(true); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleSeries.length === 0 ? <tr><td colSpan="6" className="empty-row">No test series found.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="modal-scrim" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div><p className="eyebrow">Test Series Setup</p><h4>{editingSeries ? 'Edit Series' : 'Create Series'}</h4></div>
              <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input className="search-input" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>Status</span>
                <select className="filter-select" value={formState.status} onChange={(event) => setFormState((current) => ({ ...current, status: Number(event.target.value) }))}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <label className="full-span">
                <span>Description</span>
                <textarea className="search-input textarea-like" value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
              </label>
            </div>
            <div className="toolbar-row">
              <div className="search-shell">
                <input className="search-input" placeholder="Search exams..." value={examSearchQuery} onChange={(event) => setExamSearchQuery(event.target.value)} />
              </div>
            </div>
            <div className="selection-grid">
              {visibleExams.map((exam) => {
                const selected = selectedExamsMap[exam.id];
                return (
                  <div key={exam.id} className={`selection-card static ${selected ? 'selected' : ''}`}>
                    <button type="button" className="sort-button align-left" onClick={() => toggleExamSelection(exam)}>
                      <strong>{exam.title}</strong>
                      <div className="student-subtle">{exam.brief}</div>
                    </button>
                    {selected ? (
                      <select className="filter-select" value={selected.accessType} onChange={(event) => setSelectedExamsMap((current) => ({ ...current, [exam.id]: { ...current[exam.id], accessType: event.target.value } }))}>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={saveSeries}>Save Series</button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteOpen && seriesToDelete ? (
        <div className="modal-scrim" role="presentation" onClick={() => setIsDeleteOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Delete Test Series</p>
            <h4>Delete "{seriesToDelete.name}"?</h4>
            <p className="muted-copy">This removes the grouped exam mapping from local storage.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { persist(seriesList.filter((series) => series.id !== seriesToDelete.id)); setIsDeleteOpen(false); showToast('success', 'Series Deleted', 'Test series deleted successfully.'); }}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
