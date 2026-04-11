import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { questionBankDemo } from '../data/assessmentBuilderDemo';
import { examsDemo } from '../data/examsDemo';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const next = char === 'x' ? rand : ((rand & 0x3) | 0x8);
    return next.toString(16);
  });
}

function createBlankSection(order) {
  return {
    id: `section-${Date.now()}-${Math.random()}`,
    name: '',
    order,
    duration: 0,
    totalQuestions: 0,
    enableSectionWiseTimer: false,
    sectionMarkingScheme: 0,
    filters: {
      classificationLevel1: '',
      questionType: '',
      level: '',
    },
    questions: [],
  };
}

function normalizeExam(rawExam) {
  const parsedSections = Array.isArray(rawExam.sectionsData)
    ? rawExam.sectionsData
    : (() => {
        try {
          return JSON.parse(rawExam.sectionsData || '[]');
        } catch (error) {
          return [];
        }
      })();

  return {
    title: rawExam.title || '',
    brief: rawExam.brief || '',
    specialTerms: rawExam.specialTerms || '',
    duration: rawExam.duration || 0,
    challengeQuestionAllowed: rawExam.challengeQuestionAllowed ?? 1,
    switchSectionsAllowed: rawExam.switchSectionsAllowed ?? 1,
    markingSchemeOverall: rawExam.markingSchemeOverall ?? 1,
    sections: parsedSections.map((section, index) => ({
      id: `loaded-${index}-${rawExam.id || rawExam.displayKey || 'exam'}`,
      name: section.name || `Section ${index + 1}`,
      order: section.order || index + 1,
      duration: section.duration || 0,
      totalQuestions: section.totalQuestions || section.questions?.length || 0,
      enableSectionWiseTimer: Boolean(section.enableSectionWiseTimer),
      sectionMarkingScheme: section.sectionMarkingScheme || 0,
      filters: {
        classificationLevel1: '',
        questionType: '',
        level: '',
      },
      questions: (section.questions || []).map((question, questionIndex) => ({
        o: question.o || questionIndex + 1,
        qi: question.qi || question.questionId,
        ms: question.ms || 1,
      })),
    })),
  };
}

export default function ExamCreationWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  const [currentStep, setCurrentStep] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  const existingExam = useMemo(() => {
    if (!editId) return null;
    const drafts = JSON.parse(window.localStorage.getItem('examDrafts') || '[]');
    const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]');
    return [...drafts, ...published, ...examsDemo].find((exam) => String(exam.id) === String(editId)) || null;
  }, [editId]);

  const [examData, setExamData] = useState(() => existingExam ? normalizeExam(existingExam) : {
    title: '',
    brief: '',
    specialTerms: '',
    duration: 0,
    challengeQuestionAllowed: 1,
    switchSectionsAllowed: 1,
    markingSchemeOverall: 1,
    sections: [],
  });
  const [draftSection, setDraftSection] = useState(() => createBlankSection(1));

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const selectedSection = examData.sections.find((section) => section.id === selectedSectionId) || examData.sections[0] || null;
  const filteredQuestions = useMemo(() => {
    if (!selectedSection) return [];
    return questionBankDemo.filter((question) => {
      if (selectedSection.filters.classificationLevel1 && String(question.classificationLevel1) !== String(selectedSection.filters.classificationLevel1)) return false;
      if (selectedSection.filters.questionType && question.questionType !== selectedSection.filters.questionType) return false;
      if (selectedSection.filters.level && String(question.level) !== String(selectedSection.filters.level)) return false;
      return true;
    });
  }, [selectedSection]);

  function updateSelectedSection(updater) {
    if (!selectedSection) return;
    setExamData((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === selectedSection.id ? updater(section) : section),
    }));
  }

  function addSection() {
    if (!draftSection.name || !draftSection.totalQuestions) {
      showToast('error', 'Incomplete Section', 'Section name and total questions are required.');
      return;
    }

    const nextSection = {
      ...draftSection,
      id: `section-${Date.now()}-${Math.random()}`,
      order: examData.sections.length + 1,
      totalQuestions: Number(draftSection.totalQuestions),
      duration: Number(draftSection.duration) || 0,
    };

    setExamData((current) => ({ ...current, sections: [...current.sections, nextSection] }));
    setSelectedSectionId(nextSection.id);
    setDraftSection(createBlankSection(examData.sections.length + 2));
    showToast('success', 'Section Added', `Section "${nextSection.name}" added successfully.`);
  }

  function removeSection(sectionId) {
    setExamData((current) => {
      const nextSections = current.sections.filter((section) => section.id !== sectionId).map((section, index) => ({ ...section, order: index + 1 }));
      return { ...current, sections: nextSections };
    });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }

  function toggleQuestion(question) {
    if (!selectedSection) return;
    const isSelected = selectedSection.questions.some((item) => item.qi === question.questionId);

    updateSelectedSection((section) => {
      if (isSelected) {
        return {
          ...section,
          questions: section.questions.filter((item) => item.qi !== question.questionId).map((item, index) => ({ ...item, o: index + 1 })),
        };
      }

      if (section.questions.length >= Number(section.totalQuestions || 0)) {
        showToast('error', 'Section Full', 'Maximum questions limit reached for this section.');
        return section;
      }

      return {
        ...section,
        questions: [...section.questions, { o: section.questions.length + 1, qi: question.questionId, ms: 1 }],
      };
    });
  }

  function isExamValid() {
    return Boolean(
      examData.title.trim()
      && Number(examData.duration) > 0
      && examData.sections.length > 0
      && examData.sections.every((section) => section.questions.length === Number(section.totalQuestions)),
    );
  }

  function saveExam(status) {
    if (!isExamValid()) {
      showToast('error', 'Incomplete Exam', 'Complete the exam setup and fill every section before saving.');
      return;
    }

    const examId = existingExam?.id || Date.now();
    const payload = {
      ...(existingExam || {}),
      id: examId,
      displayKey: existingExam?.displayKey || uuid(),
      title: examData.title,
      brief: examData.brief,
      specialTerms: examData.specialTerms,
      duration: Number(examData.duration),
      challengeQuestionAllowed: Number(examData.challengeQuestionAllowed),
      switchSectionsAllowed: Number(examData.switchSectionsAllowed),
      markingSchemeOverall: Number(examData.markingSchemeOverall),
      totalQuestions: examData.sections.reduce((total, section) => total + section.questions.length, 0),
      numberOfSections: examData.sections.length,
      maximumMarks: examData.sections.reduce((total, section) => total + section.questions.length * 4, 0),
      status,
      sectionsData: examData.sections.map((section) => ({
        order: section.order,
        name: section.name,
        duration: Number(section.duration),
        totalQuestions: Number(section.totalQuestions),
        enableSectionWiseTimer: section.enableSectionWiseTimer,
        sectionMarkingScheme: Number(section.sectionMarkingScheme),
        questions: section.questions,
      })),
      createdOn: existingExam?.createdOn || Math.floor(Date.now() / 1000),
      lastUpdatedOn: Math.floor(Date.now() / 1000),
    };

    const drafts = JSON.parse(window.localStorage.getItem('examDrafts') || '[]').filter((exam) => String(exam.id) !== String(examId));
    const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]').filter((exam) => String(exam.id) !== String(examId));
    if (status === 0) drafts.unshift(payload);
    if (status === 1) published.unshift(payload);
    window.localStorage.setItem('examDrafts', JSON.stringify(drafts));
    window.localStorage.setItem('publishedExams', JSON.stringify(published));
    navigate('/exam-listing');
  }

  return (
    <section className="screen-card wizard-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Exam Creation Wizard</p>
          <h3>{editId ? 'Edit Exam' : 'Create New Exam'}</h3>
          <p className="muted-copy">Rebuilt from the Angular exam authoring flow with staged section and question setup.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => navigate('/exam-listing')}>Back to Exams</button>
      </div>

      <div className="wizard-steps">
        {[1, 2, 3, 4].map((step) => (
          <button key={step} type="button" className={`wizard-step-pill ${currentStep === step ? 'active' : ''}`} onClick={() => setCurrentStep(step)}>
            Step {step}
          </button>
        ))}
      </div>

      {currentStep === 1 ? (
        <div className="builder-grid">
          <div className="detail-panel">
            <h4>Exam Basics</h4>
            <div className="form-grid">
              <label>
                <span>Title</span>
                <input className="search-input" value={examData.title} onChange={(event) => setExamData((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                <span>Duration (minutes)</span>
                <input className="search-input" type="number" value={examData.duration} onChange={(event) => setExamData((current) => ({ ...current, duration: event.target.value }))} />
              </label>
              <label className="full-span">
                <span>Brief</span>
                <textarea className="search-input textarea-like" value={examData.brief} onChange={(event) => setExamData((current) => ({ ...current, brief: event.target.value }))} />
              </label>
              <label className="full-span">
                <span>Special Terms</span>
                <textarea className="search-input textarea-like" value={examData.specialTerms} onChange={(event) => setExamData((current) => ({ ...current, specialTerms: event.target.value }))} />
              </label>
            </div>
          </div>
          <div className="detail-panel">
            <h4>Add Section</h4>
            <div className="form-grid">
              <label>
                <span>Section Name</span>
                <input className="search-input" value={draftSection.name} onChange={(event) => setDraftSection((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>Total Questions</span>
                <input className="search-input" type="number" value={draftSection.totalQuestions} onChange={(event) => setDraftSection((current) => ({ ...current, totalQuestions: event.target.value }))} />
              </label>
              <label>
                <span>Duration</span>
                <input className="search-input" type="number" value={draftSection.duration} onChange={(event) => setDraftSection((current) => ({ ...current, duration: event.target.value }))} />
              </label>
              <button type="button" className="primary-button" onClick={addSection}>Add Section</button>
            </div>
            <div className="stack-grid nested-panel">
              {examData.sections.map((section) => (
                <div key={section.id} className={`detail-panel ${selectedSection?.id === section.id ? 'active-panel' : ''}`}>
                  <div className="hero-row">
                    <div>
                      <h4>{section.name}</h4>
                      <p className="muted-copy">{section.questions.length}/{section.totalQuestions} questions selected</p>
                    </div>
                    <div className="action-row">
                      <button type="button" className="ghost-button compact" onClick={() => setSelectedSectionId(section.id)}>Configure</button>
                      <button type="button" className="table-button danger" onClick={() => removeSection(section.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="builder-grid">
          <div className="detail-panel">
            <h4>Sections</h4>
            <div className="stack-grid">
              {examData.sections.map((section) => (
                <button key={section.id} type="button" className={`outline-trigger ${selectedSection?.id === section.id ? 'active-page' : ''}`} onClick={() => setSelectedSectionId(section.id)}>
                  {section.name} · {section.questions.length}/{section.totalQuestions}
                </button>
              ))}
            </div>
          </div>
          <div className="detail-panel">
            <h4>{selectedSection ? selectedSection.name : 'Choose a section'}</h4>
            {selectedSection ? (
              <>
                <div className="report-filter-grid">
                  <select className="filter-select" value={selectedSection.filters.classificationLevel1} onChange={(event) => updateSelectedSection((section) => ({ ...section, filters: { ...section.filters, classificationLevel1: event.target.value } }))}>
                    <option value="">All Subjects</option>
                    <option value="1">Physics</option>
                    <option value="2">Chemistry</option>
                    <option value="3">Mathematics</option>
                    <option value="4">Biology</option>
                  </select>
                  <select className="filter-select" value={selectedSection.filters.questionType} onChange={(event) => updateSelectedSection((section) => ({ ...section, filters: { ...section.filters, questionType: event.target.value } }))}>
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Integer">Integer</option>
                  </select>
                  <select className="filter-select" value={selectedSection.filters.level} onChange={(event) => updateSelectedSection((section) => ({ ...section, filters: { ...section.filters, level: event.target.value } }))}>
                    <option value="">All Levels</option>
                    <option value="1">Easy</option>
                    <option value="2">Medium</option>
                    <option value="3">Hard</option>
                  </select>
                </div>
                <div className="student-table-shell">
                  <table className="student-table">
                    <thead><tr><th>Select</th><th>Question</th><th>Subject</th><th>Type</th><th>Level</th></tr></thead>
                    <tbody>
                      {filteredQuestions.map((question) => {
                        const checked = selectedSection.questions.some((item) => item.qi === question.questionId);
                        return (
                          <tr key={question.questionId}>
                            <td><input type="checkbox" checked={checked} onChange={() => toggleQuestion(question)} /></td>
                            <td><strong>{question.questionDisplayKey}</strong><div className="student-subtle">{question.chapter}</div></td>
                            <td>{question.subject}</td>
                            <td>{question.questionType}</td>
                            <td>{question.level}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <p className="muted-copy">Add a section first.</p>}
          </div>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="stats-grid">
          {examData.sections.map((section) => (
            <div key={section.id} className="detail-panel">
              <h4>{section.name}</h4>
              <p className="muted-copy">{section.questions.length} of {section.totalQuestions} questions assigned.</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${section.totalQuestions ? (section.questions.length / section.totalQuestions) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="detail-grid">
          <div className="detail-panel">
            <h4>Review</h4>
            <p><strong>{examData.title}</strong></p>
            <p className="muted-copy">{examData.brief}</p>
            <p>Total sections: {examData.sections.length}</p>
            <p>Total questions: {examData.sections.reduce((total, section) => total + section.questions.length, 0)}</p>
          </div>
          <div className="detail-panel">
            <h4>Completion Check</h4>
            <p className="muted-copy">{isExamValid() ? 'Ready to save.' : 'Some sections are incomplete.'}</p>
          </div>
        </div>
      ) : null}

      <div className="pagination-bar">
        <div className="pagination-controls">
          <button type="button" className="ghost-button" disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}>Previous</button>
          <button type="button" className="ghost-button" disabled={currentStep === 4} onClick={() => setCurrentStep((step) => Math.min(4, step + 1))}>Next</button>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => saveExam(0)}>Save Draft</button>
          <button type="button" className="primary-button" onClick={() => saveExam(1)}>{editId ? 'Update Exam' : 'Publish Exam'}</button>
        </div>
      </div>
    </section>
  );
}
