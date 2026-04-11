import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { practiceQuestionsDemo } from '../data/assessmentBuilderDemo';

function uuid() {
  return 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)).toUpperCase();
}

export default function QuizCreationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectedBundles = (params.get('bundlesSelected') || '').replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
  const [currentStep, setCurrentStep] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [allQuestions] = useState(() => {
    const stored = window.localStorage.getItem('practiceQuestions');
    if (!stored) return practiceQuestionsDemo;
    try {
      return JSON.parse(stored);
    } catch (error) {
      return practiceQuestionsDemo;
    }
  });
  const [customQuestions, setCustomQuestions] = useState([]);
  const [quizConfig, setQuizConfig] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    return {
      title: '',
      description: '',
      duration: 180,
      markingScheme: 'default',
      customMarking: { correct: 4, incorrect: -1, unanswered: 0 },
      startDate: today.toISOString().slice(0, 10),
      startTime: '09:00',
      endDate: tomorrow.toISOString().slice(0, 10),
      endTime: '18:00',
      allowMultipleAttempts: false,
    };
  });
  const [quizUrl, setQuizUrl] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState(() => {
    if (!preselectedBundles.length) return [];
    return [...new Set(preselectedBundles)];
  });

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const availableBatches = useMemo(() => {
    const map = new Map();
    allQuestions.forEach((question) => {
      const current = map.get(question.batchId) || { id: question.batchId, count: 0, createdAt: question.createdAt };
      current.count += 1;
      current.createdAt = Math.min(current.createdAt, question.createdAt);
      map.set(question.batchId, current);
    });
    return [...map.values()].sort((left, right) => right.createdAt - left.createdAt);
  }, [allQuestions]);

  const questionsFromBatches = useMemo(
    () => allQuestions.filter((question) => selectedBatchIds.includes(question.batchId)),
    [allQuestions, selectedBatchIds],
  );

  const allQuizQuestions = [...questionsFromBatches, ...customQuestions];
  const totalQuestions = allQuizQuestions.length;
  const maxMarks = quizConfig.markingScheme === 'custom'
    ? totalQuestions * Number(quizConfig.customMarking.correct || 0)
    : totalQuestions * (quizConfig.markingScheme === 'no-negative' ? 1 : 4);

  function nextStep() {
    if (currentStep === 1 && selectedBatchIds.length === 0) {
      showToast('error', 'No Bundles Selected', 'Select at least one bundle before continuing.');
      return;
    }
    if (currentStep === 3 && !quizConfig.title.trim()) {
      showToast('error', 'Quiz Title Required', 'Enter the quiz title before continuing.');
      return;
    }
    const next = Math.min(4, currentStep + 1);
    setCurrentStep(next);
    if (next === 4 && !quizUrl) {
      setQuizUrl(`https://candidate.crisprlearning.com/quiz/${uuid()}`);
    }
  }

  function addCustomQuestion(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomQuestions((current) => [
        ...current,
        {
          id: `CQ-${current.length + 1}`,
          uuid: uuid(),
          batchId: 'CUSTOM',
          title: file.name,
          imageData: reader.result,
          answerType: 'MCQ',
          correctAnswer: 'A',
          level: 'Medium',
          createdAt: Date.now(),
          isCustom: true,
        },
      ]);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function persistQuiz(status) {
    if (!quizConfig.title.trim() || totalQuestions === 0) {
      showToast('error', 'Quiz Incomplete', 'Add a title and at least one question before saving.');
      return;
    }

    const resolvedUrl = quizUrl || `https://candidate.crisprlearning.com/quiz/${uuid()}`;
    if (!quizUrl) {
      setQuizUrl(resolvedUrl);
    }

    const quiz = {
      id: resolvedUrl.split('/').pop(),
      uuid: uuid(),
      title: quizConfig.title,
      description: quizConfig.description,
      duration: Number(quizConfig.duration),
      markingScheme: quizConfig.markingScheme,
      customMarking: quizConfig.customMarking,
      startDateTime: `${quizConfig.startDate}T${quizConfig.startTime}`,
      endDateTime: `${quizConfig.endDate}T${quizConfig.endTime}`,
      questions: allQuizQuestions,
      totalQuestions,
      maximumMarks: maxMarks,
      url: resolvedUrl,
      batches: selectedBatchIds,
      createdAt: Date.now(),
      createdBy: 'Abhijith',
      status,
      attempts: [],
    };

    const drafts = JSON.parse(window.localStorage.getItem('quizDrafts') || '[]').filter((item) => item.id !== quiz.id);
    const published = JSON.parse(window.localStorage.getItem('publishedQuizzes') || '[]').filter((item) => item.id !== quiz.id);
    if (status === 'draft') drafts.unshift(quiz);
    if (status === 'published') published.unshift(quiz);
    window.localStorage.setItem('quizDrafts', JSON.stringify(drafts));
    window.localStorage.setItem('publishedQuizzes', JSON.stringify(published));
    navigate('/quiz-listing');
  }

  return (
    <section className="screen-card wizard-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Quiz Creation</p>
          <h3>Build Quiz From Practice Bundles</h3>
          <p className="muted-copy">This keeps the legacy batch-driven flow and allows custom image questions before publishing.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => navigate('/quiz-listing')}>Back to Quizzes</button>
      </div>

      {!preselectedBundles.length ? (
        <div className="info-banner">No `bundlesSelected` query parameter was provided, so all available practice bundles are shown for manual selection.</div>
      ) : null}

      <div className="wizard-steps">
        {[1, 2, 3, 4].map((step) => (
          <button key={step} type="button" className={`wizard-step-pill ${currentStep === step ? 'active' : ''}`} onClick={() => setCurrentStep(step)}>
            Step {step}
          </button>
        ))}
      </div>

      {currentStep === 1 ? (
        <div className="detail-panel">
          <h4>Select Bundles</h4>
          <div className="selection-grid">
            {availableBatches.map((batch) => (
              <button key={batch.id} type="button" className={`selection-card ${selectedBatchIds.includes(batch.id) ? 'selected' : ''}`} onClick={() => setSelectedBatchIds((current) => current.includes(batch.id) ? current.filter((id) => id !== batch.id) : [...current, batch.id])}>
                <strong>{batch.id}</strong>
                <span>{batch.count} questions</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="builder-grid">
          <div className="detail-panel">
            <h4>Questions From Selected Bundles</h4>
            <div className="student-table-shell">
              <table className="student-table">
                <thead><tr><th>Question</th><th>Bundle</th><th>Level</th><th>Type</th></tr></thead>
                <tbody>
                  {questionsFromBatches.map((question) => (
                    <tr key={question.id}>
                      <td><strong>{question.title}</strong></td>
                      <td>{question.batchId}</td>
                      <td>{question.level}</td>
                      <td>{question.answerType}</td>
                    </tr>
                  ))}
                  {questionsFromBatches.length === 0 ? <tr><td colSpan="4" className="empty-row">No questions loaded from the selected bundles.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
          <div className="detail-panel">
            <h4>Add Custom Image Questions</h4>
            <label className="primary-button upload-button">
              Upload Image
              <input type="file" accept="image/*" hidden onChange={addCustomQuestion} />
            </label>
            <div className="stack-grid nested-panel">
              {customQuestions.map((question) => (
                <div key={question.uuid} className="detail-panel">
                  <strong>{question.title}</strong>
                  <p className="muted-copy">Custom question · {question.answerType}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="detail-panel">
          <h4>Quiz Configuration</h4>
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input className="search-input" value={quizConfig.title} onChange={(event) => setQuizConfig((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              <span>Duration (minutes)</span>
              <input className="search-input" type="number" value={quizConfig.duration} onChange={(event) => setQuizConfig((current) => ({ ...current, duration: event.target.value }))} />
            </label>
            <label className="full-span">
              <span>Description</span>
              <textarea className="search-input textarea-like" value={quizConfig.description} onChange={(event) => setQuizConfig((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label>
              <span>Marking Scheme</span>
              <select className="filter-select" value={quizConfig.markingScheme} onChange={(event) => setQuizConfig((current) => ({ ...current, markingScheme: event.target.value }))}>
                <option value="default">Default (+4/-1)</option>
                <option value="no-negative">No Negative</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label>
              <span>Start Date</span>
              <input className="search-input" type="date" value={quizConfig.startDate} onChange={(event) => setQuizConfig((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label>
              <span>Start Time</span>
              <input className="search-input" type="time" value={quizConfig.startTime} onChange={(event) => setQuizConfig((current) => ({ ...current, startTime: event.target.value }))} />
            </label>
            <label>
              <span>End Date</span>
              <input className="search-input" type="date" value={quizConfig.endDate} onChange={(event) => setQuizConfig((current) => ({ ...current, endDate: event.target.value }))} />
            </label>
            <label>
              <span>End Time</span>
              <input className="search-input" type="time" value={quizConfig.endTime} onChange={(event) => setQuizConfig((current) => ({ ...current, endTime: event.target.value }))} />
            </label>
          </div>
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="detail-grid">
          <div className="detail-panel">
            <h4>Quiz Summary</h4>
            <p><strong>{quizConfig.title || 'Untitled Quiz'}</strong></p>
            <p className="muted-copy">{quizConfig.description || 'No description provided.'}</p>
            <p>Total questions: {totalQuestions}</p>
            <p>Maximum marks: {maxMarks}</p>
            <p>Schedule: {quizConfig.startDate} {quizConfig.startTime} to {quizConfig.endDate} {quizConfig.endTime}</p>
          </div>
          <div className="detail-panel">
            <h4>Launch URL</h4>
            <p className="token-preview">{quizUrl || `https://candidate.crisprlearning.com/quiz/${uuid()}`}</p>
          </div>
        </div>
      ) : null}

      <div className="pagination-bar">
        <div className="pagination-controls">
          <button type="button" className="ghost-button" disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}>Previous</button>
          <button type="button" className="ghost-button" disabled={currentStep === 4} onClick={nextStep}>Next</button>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => persistQuiz('draft')}>Save Draft</button>
          <button type="button" className="primary-button" onClick={() => persistQuiz('published')}>Publish Quiz</button>
        </div>
      </div>
    </section>
  );
}
