import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { questionBankDemo } from '../data/assessmentBuilderDemo';
import { examsDemo } from '../data/examsDemo';

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKING_SCHEMES = [
  { id: 1, label: '+4 / −1  (Standard)',  correct: 4,  incorrect: -1   },
  { id: 2, label: '+4 / 0  (No Penalty)', correct: 4,  incorrect: 0    },
  { id: 3, label: '+2 / −0.5',            correct: 2,  incorrect: -0.5 },
  { id: 4, label: '+1 / 0  (Basic)',       correct: 1,  incorrect: 0    },
];

const LEVEL_LABEL = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const SUBJECT_MAP = { 1: 'Physics', 2: 'Chemistry', 3: 'Mathematics', 4: 'Biology' };

const STEPS = [
  { num: 1, label: 'Exam Details'  },
  { num: 2, label: 'Sections'      },
  { num: 3, label: 'Questions'     },
  { num: 4, label: 'Summary'       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function blankSection(order, schemeId) {
  return {
    id: `s-${Date.now()}-${Math.random()}`,
    name: '',
    order,
    duration: 30,
    totalQuestions: 10,
    sectionMarkingScheme: schemeId || 1,
    questions: [],
    filters: { classificationLevel1: '', questionType: '', level: '' },
  };
}

function normalizeExam(raw) {
  let sections = [];
  try { sections = Array.isArray(raw.sectionsData) ? raw.sectionsData : JSON.parse(raw.sectionsData || '[]'); } catch (_) {}
  return {
    title: raw.title || '',
    brief: raw.brief || '',
    specialTerms: raw.specialTerms || '',
    challengeQuestionAllowed: raw.challengeQuestionAllowed ?? 1,
    switchSectionsAllowed: raw.switchSectionsAllowed ?? 1,
    sectionTimerEnabled: raw.sectionTimerEnabled ?? 0,
    markingSchemeOverall: raw.markingSchemeOverall ?? 1,
    sections: sections.map((s, i) => ({
      id: `loaded-${i}`,
      name: s.name || `Section ${i + 1}`,
      order: s.order || i + 1,
      duration: s.duration || 30,
      totalQuestions: s.totalQuestions || s.questions?.length || 0,
      sectionMarkingScheme: s.sectionMarkingScheme || raw.markingSchemeOverall || 1,
      questions: (s.questions || []).map((q, qi) => ({ o: q.o || qi + 1, qi: q.qi || q.questionId })),
      filters: { classificationLevel1: '', questionType: '', level: '' },
    })),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf3f4' }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
          background: checked ? 'var(--brand)' : '#d1d5db', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

function StepHeader({ current }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)' }}>
      {STEPS.map((step) => {
        const done = step.num < current;
        const active = step.num === current;
        return (
          <div
            key={step.num}
            style={{
              flex: 1, padding: '12px 16px', textAlign: 'center',
              background: active ? 'var(--brand)' : done ? '#e6f4f6' : '#f9fbfb',
              color: active ? 'white' : done ? 'var(--brand)' : 'var(--muted)',
              fontWeight: active ? 700 : 500, fontSize: '0.85rem',
              borderRight: step.num < STEPS.length ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ fontSize: '0.75rem', marginBottom: 2, opacity: 0.75 }}>Step {step.num}</div>
            {done && <span style={{ marginRight: 4 }}>✓</span>}
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExamCreationWizardPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const editId    = new URLSearchParams(location.search).get('edit');

  const existingExam = useMemo(() => {
    if (!editId) return null;
    const drafts    = JSON.parse(window.localStorage.getItem('examDrafts')     || '[]');
    const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]');
    return [...drafts, ...published, ...examsDemo].find((e) => String(e.id) === String(editId)) || null;
  }, [editId]);

  const [step, setStep]     = useState(1);
  const [toasts, setToasts] = useState([]);

  const [exam, setExam] = useState(() =>
    existingExam
      ? normalizeExam(existingExam)
      : {
          title: '', brief: '', specialTerms: '',
          challengeQuestionAllowed: 1,
          switchSectionsAllowed: 1,
          sectionTimerEnabled: 0,
          markingSchemeOverall: 1,
          sections: [],
        }
  );

  // Section management
  const [draft, setDraft]               = useState(() => blankSection(1, 1));
  const [editingSectionId, setEditingId] = useState(null);
  const [selectedSectionId, setSelId]   = useState(null);

  // Preview modal
  const [showPreview, setShowPreview]   = useState(false);
  const [previewIdx, setPreviewIdx]     = useState(0);

  // Random Select modal
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomConfig, setRandomConfig]       = useState([
    { level: 1, label: 'Easy',   count: '', chapters: [] },
    { level: 2, label: 'Medium', count: '', chapters: [] },
    { level: 3, label: 'Hard',   count: '', chapters: [] },
  ]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalDuration  = exam.sections.reduce((s, sec) => s + Number(sec.duration  || 0), 0);
  const totalQuestions = exam.sections.reduce((s, sec) => s + sec.questions.length,        0);
  const totalRequired  = exam.sections.reduce((s, sec) => s + Number(sec.totalQuestions || 0), 0);

  const selectedSection = exam.sections.find((s) => s.id === selectedSectionId) || exam.sections[0] || null;

  const activeScheme = MARKING_SCHEMES.find((m) => m.id === Number(exam.markingSchemeOverall)) || MARKING_SCHEMES[0];
  const maxMarks = exam.sections.reduce(
    (sum, sec) => sum + sec.questions.length * (MARKING_SCHEMES.find((m) => m.id === Number(sec.sectionMarkingScheme))?.correct || activeScheme.correct),
    0
  );

  const filteredQuestions = useMemo(() => {
    if (!selectedSection) return questionBankDemo;
    return questionBankDemo.filter((q) => {
      if (selectedSection.filters.classificationLevel1 && String(q.classificationLevel1) !== String(selectedSection.filters.classificationLevel1)) return false;
      if (selectedSection.filters.questionType && q.questionType !== selectedSection.filters.questionType) return false;
      if (selectedSection.filters.level && String(q.level) !== String(selectedSection.filters.level)) return false;
      return true;
    });
  }, [selectedSection]);

  // Chapters available for random select (subject + type filtered, level-agnostic)
  const randomSelectChapters = useMemo(() => {
    if (!selectedSection) return [];
    const pool = questionBankDemo.filter((q) => {
      if (selectedSection.filters.classificationLevel1 && String(q.classificationLevel1) !== String(selectedSection.filters.classificationLevel1)) return false;
      if (selectedSection.filters.questionType && q.questionType !== selectedSection.filters.questionType) return false;
      return true;
    });
    return [...new Set(pool.map((q) => q.chapter).filter(Boolean))].sort();
  }, [selectedSection]);

  // Flat list of all questions for preview
  const previewList = useMemo(() =>
    exam.sections.flatMap((sec) =>
      sec.questions.map((q) => {
        const info = questionBankDemo.find((qb) => qb.questionId === q.qi) || {};
        return { ...q, ...info, sectionName: sec.name };
      })
    ),
  [exam.sections]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toast(type, title, msg) {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type, title, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }

  function setExamField(field, value) {
    setExam((p) => ({ ...p, [field]: value }));
  }

  function updateSection(id, fn) {
    setExam((p) => ({ ...p, sections: p.sections.map((s) => s.id === id ? fn(s) : s) }));
  }

  function updateSelected(fn) { if (selectedSection) updateSection(selectedSection.id, fn); }

  // ── Section actions ────────────────────────────────────────────────────────

  function addSection() {
    if (!draft.name.trim()) { toast('error', 'Missing Name', 'Provide a section name.'); return; }
    const newSec = {
      ...draft,
      id: `s-${Date.now()}-${Math.random()}`,
      order: exam.sections.length + 1,
      totalQuestions: Number(draft.totalQuestions) || 10,
      duration: Number(draft.duration) || 30,
    };
    setExam((p) => ({ ...p, sections: [...p.sections, newSec] }));
    setSelId(newSec.id);
    setDraft(blankSection(exam.sections.length + 2, exam.markingSchemeOverall));
    toast('success', 'Section Added', `"${newSec.name}" added.`);
  }

  function saveEditedSection() {
    updateSection(editingSectionId, () => ({ ...draft }));
    setEditingId(null);
    setDraft(blankSection(exam.sections.length + 1, exam.markingSchemeOverall));
    toast('success', 'Section Updated', 'Changes saved.');
  }

  function startEdit(sec) {
    setEditingId(sec.id);
    setDraft({ ...sec });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(blankSection(exam.sections.length + 1, exam.markingSchemeOverall));
  }

  function removeSection(id) {
    setExam((p) => {
      const secs = p.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
      return { ...p, sections: secs };
    });
    if (selectedSectionId === id) setSelId(null);
    if (editingSectionId === id) cancelEdit();
  }

  function moveSection(id, dir) {
    setExam((p) => {
      const arr = [...p.sections];
      const idx = arr.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...p, sections: arr.map((s, i) => ({ ...s, order: i + 1 })) };
    });
  }

  // ── Question selection ─────────────────────────────────────────────────────

  function toggleQuestion(q) {
    if (!selectedSection) return;
    const already = selectedSection.questions.some((x) => x.qi === q.questionId);
    updateSelected((sec) => {
      if (already) {
        return { ...sec, questions: sec.questions.filter((x) => x.qi !== q.questionId).map((x, i) => ({ ...x, o: i + 1 })) };
      }
      if (sec.questions.length >= Number(sec.totalQuestions)) {
        toast('error', 'Section Full', `Max ${sec.totalQuestions} questions allowed.`);
        return sec;
      }
      return { ...sec, questions: [...sec.questions, { o: sec.questions.length + 1, qi: q.questionId }] };
    });
  }

  function randomSelect() {
    if (!selectedSection) return;
    const remaining = Number(selectedSection.totalQuestions) - selectedSection.questions.length;
    if (remaining <= 0) { toast('info', 'Already Full', 'Section already has all required questions.'); return; }
    setRandomConfig([
      { level: 1, label: 'Easy',   count: '', chapters: [] },
      { level: 2, label: 'Medium', count: '', chapters: [] },
      { level: 3, label: 'Hard',   count: '', chapters: [] },
    ]);
    setShowRandomModal(true);
  }

  function applyRandomSelect() {
    if (!selectedSection) return;
    const remaining = Number(selectedSection.totalQuestions) - selectedSection.questions.length;
    const totalRequested = randomConfig.reduce((s, row) => s + (Number(row.count) || 0), 0);

    if (totalRequested === 0) { toast('error', 'No Questions', 'Specify at least one question to select.'); return; }
    if (totalRequested > remaining) {
      toast('error', 'Too Many', `Only ${remaining} slot(s) remaining. You requested ${totalRequested}.`);
      return;
    }

    const already = new Set(selectedSection.questions.map((x) => x.qi));
    const batchPicked = new Set();
    const picks = [];
    const warnings = [];

    for (const row of randomConfig) {
      const n = Number(row.count) || 0;
      if (n === 0) continue;
      const pool = questionBankDemo.filter((q) => {
        if (already.has(q.questionId) || batchPicked.has(q.questionId)) return false;
        if (q.level !== row.level) return false;
        if (selectedSection.filters.classificationLevel1 && String(q.classificationLevel1) !== String(selectedSection.filters.classificationLevel1)) return false;
        if (selectedSection.filters.questionType && q.questionType !== selectedSection.filters.questionType) return false;
        if (row.chapters.length > 0 && !row.chapters.includes(q.chapter)) return false;
        return true;
      });
      const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, n);
      shuffled.forEach((q) => batchPicked.add(q.questionId));
      picks.push(...shuffled);
      if (shuffled.length < n) {
        warnings.push(`${row.label}: only ${shuffled.length}/${n} found${row.chapters.length > 0 ? ' in selected chapters' : ''}`);
      }
    }

    if (picks.length === 0) { toast('error', 'No Match', 'No questions found matching your criteria.'); return; }

    updateSelected((sec) => ({
      ...sec,
      questions: [
        ...sec.questions,
        ...picks.map((q, i) => ({ o: sec.questions.length + i + 1, qi: q.questionId })),
      ],
    }));

    if (warnings.length > 0) {
      toast('warning', 'Partial Pick', warnings.join(' · '));
    } else {
      toast('success', 'Random Select', `${picks.length} question(s) added.`);
    }
    setShowRandomModal(false);
  }

  function clearSection() {
    updateSelected((sec) => ({ ...sec, questions: [] }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function isStep1Valid() { return exam.title.trim().length > 0; }
  function isStep2Valid() { return exam.sections.length > 0; }
  function isStep3Valid() { return exam.sections.length > 0 && exam.sections.every((s) => s.questions.length === Number(s.totalQuestions)); }
  function isExamReady()  { return isStep1Valid() && isStep2Valid() && isStep3Valid(); }

  function tryNext() {
    if (step === 1 && !isStep1Valid()) { toast('error', 'Incomplete', 'Please enter an exam title.'); return; }
    if (step === 2 && !isStep2Valid()) { toast('error', 'No Sections', 'Add at least one section.'); return; }
    if (step === 3 && !isStep3Valid()) { toast('error', 'Incomplete', 'Fill all sections before proceeding.'); return; }
    setStep((s) => Math.min(4, s + 1));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function saveExam(status) {
    if (status === 1 && !isExamReady()) { toast('error', 'Incomplete Exam', 'Complete all steps before publishing.'); return; }
    const id = existingExam?.id || Date.now();
    const payload = {
      ...(existingExam || {}),
      id, displayKey: existingExam?.displayKey || uuid(),
      title: exam.title, brief: exam.brief, specialTerms: exam.specialTerms,
      duration: totalDuration,
      challengeQuestionAllowed: Number(exam.challengeQuestionAllowed),
      switchSectionsAllowed: Number(exam.switchSectionsAllowed),
      sectionTimerEnabled: Number(exam.sectionTimerEnabled),
      markingSchemeOverall: Number(exam.markingSchemeOverall),
      totalQuestions, numberOfSections: exam.sections.length,
      maximumMarks: maxMarks, status,
      sectionsData: exam.sections.map((s) => ({
        order: s.order, name: s.name,
        duration: Number(s.duration), totalQuestions: Number(s.totalQuestions),
        sectionMarkingScheme: Number(s.sectionMarkingScheme),
        questions: s.questions,
      })),
      createdOn: existingExam?.createdOn || Math.floor(Date.now() / 1000),
      lastUpdatedOn: Math.floor(Date.now() / 1000),
    };
    const drafts    = JSON.parse(window.localStorage.getItem('examDrafts')     || '[]').filter((e) => String(e.id) !== String(id));
    const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]').filter((e) => String(e.id) !== String(id));
    if (status === 0) drafts.unshift(payload);
    if (status === 1) published.unshift(payload);
    window.localStorage.setItem('examDrafts',     JSON.stringify(drafts));
    window.localStorage.setItem('publishedExams', JSON.stringify(published));
    toast('success', status === 1 ? 'Published' : 'Draft Saved', exam.title);
    setTimeout(() => navigate('/exam-listing'), 800);
  }

  // ── Render: Section Form ───────────────────────────────────────────────────

  function SectionForm({ isEditing }) {
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Section Name *</span>
            <input className="search-input" placeholder="e.g. Physics" value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Duration (min) *</span>
            <input className="search-input" type="number" min="1" value={draft.duration}
              onChange={(e) => setDraft((p) => ({ ...p, duration: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Total Questions *</span>
            <input className="search-input" type="number" min="1" value={draft.totalQuestions}
              onChange={(e) => setDraft((p) => ({ ...p, totalQuestions: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Marking Scheme</span>
            <select className="filter-select" style={{ maxWidth: '100%' }} value={draft.sectionMarkingScheme}
              onChange={(e) => setDraft((p) => ({ ...p, sectionMarkingScheme: Number(e.target.value) }))}>
              {MARKING_SCHEMES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}{m.id === Number(exam.markingSchemeOverall) ? ' (Exam Default)' : ''}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEditing ? (
            <>
              <button className="primary-button" type="button" onClick={saveEditedSection} style={{ flex: 1 }}>Save Changes</button>
              <button className="ghost-button" type="button" onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <button className="primary-button" type="button" onClick={addSection} style={{ flex: 1 }}>
              + Add Section
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="screen-card wizard-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Page header */}
      <div className="hero-row" style={{ marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Exam Creation Wizard</p>
          <h3 style={{ margin: '4px 0 0' }}>{editId ? 'Edit Exam' : 'Create New Exam'}</h3>
        </div>
        <button className="ghost-button" type="button" onClick={() => navigate('/exam-listing')}>← Back to Exams</button>
      </div>

      <StepHeader current={step} />

      {/* ════════════════════ STEP 1 – EXAM DETAILS ════════════════════ */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Basics */}
          <div className="detail-panel">
            <h4 style={{ marginTop: 0 }}>Exam Basics</h4>
            <div style={{ display: 'grid', gap: 16 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Title *</span>
                <input className="search-input" placeholder="e.g. IAT Mock Test - 1" value={exam.title}
                  onChange={(e) => setExamField('title', e.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Brief / Description</span>
                <textarea className="search-input" rows={3} placeholder="Short description of the exam..."
                  style={{ resize: 'vertical' }} value={exam.brief}
                  onChange={(e) => setExamField('brief', e.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Instructions / Special Terms</span>
                <textarea className="search-input" rows={3} placeholder="Rules, instructions shown to students..."
                  style={{ resize: 'vertical' }} value={exam.specialTerms}
                  onChange={(e) => setExamField('specialTerms', e.target.value)} />
              </label>
            </div>
          </div>

          {/* Configs */}
          <div className="detail-panel">
            <h4 style={{ marginTop: 0 }}>Exam Configuration</h4>

            <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Overall Marking Scheme</span>
              <select className="filter-select" style={{ maxWidth: '100%' }} value={exam.markingSchemeOverall}
                onChange={(e) => setExamField('markingSchemeOverall', Number(e.target.value))}>
                {MARKING_SCHEMES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <span className="muted-copy" style={{ fontSize: '0.78rem' }}>
                Applied to sections unless a section uses a custom scheme.
              </span>
            </label>

            <Toggle
              label="Question Challenge Allowed"
              checked={Boolean(exam.challengeQuestionAllowed)}
              onChange={(v) => setExamField('challengeQuestionAllowed', v ? 1 : 0)}
            />
            <p className="muted-copy" style={{ fontSize: '0.78rem', margin: '4px 0 12px 0' }}>
              Students can flag a question as incorrect during the exam.
            </p>

            <Toggle
              label="Section Switching Allowed"
              checked={Boolean(exam.switchSectionsAllowed)}
              onChange={(v) => setExamField('switchSectionsAllowed', v ? 1 : 0)}
            />
            <p className="muted-copy" style={{ fontSize: '0.78rem', margin: '4px 0 12px 0' }}>
              Students can move between sections freely. When off, each section must be completed before advancing.
            </p>

            <Toggle
              label="Section-wise Timer"
              checked={Boolean(exam.sectionTimerEnabled)}
              onChange={(v) => setExamField('sectionTimerEnabled', v ? 1 : 0)}
            />
            <p className="muted-copy" style={{ fontSize: '0.78rem', margin: '4px 0 0 0' }}>
              Show a per-section countdown. When off, only the overall exam timer is shown.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 2 – SECTIONS ════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Sections list */}
          <div className="detail-panel" style={{ alignSelf: 'start' }}>
            <h4 style={{ marginTop: 0 }}>Sections ({exam.sections.length})</h4>

            {exam.sections.length === 0 && (
              <div className="empty-row standalone" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p className="muted-copy">No sections yet. Add one using the form.</p>
              </div>
            )}

            {exam.sections.map((sec) => (
              <div
                key={sec.id}
                className={`detail-panel ${selectedSectionId === sec.id ? 'active-panel' : ''}`}
                style={{ marginBottom: 12, padding: 14 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: 'var(--brand)', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                        #{sec.order}
                      </span>
                      <strong>{sec.name}</strong>
                    </div>
                    <div className="muted-copy" style={{ fontSize: '0.82rem', marginTop: 6, display: 'flex', gap: 14 }}>
                      <span>⏱ {sec.duration} min</span>
                      <span>❓ {sec.totalQuestions} Qs</span>
                      <span>📊 {MARKING_SCHEMES.find((m) => m.id === Number(sec.sectionMarkingScheme))?.label || '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="table-button" type="button" title="Move up"    onClick={() => moveSection(sec.id, -1)} style={{ padding: '4px 8px' }}>↑</button>
                    <button className="table-button" type="button" title="Move down"  onClick={() => moveSection(sec.id,  1)} style={{ padding: '4px 8px' }}>↓</button>
                    <button className="ghost-button compact" type="button"            onClick={() => { setSelId(sec.id); startEdit(sec); }}>Edit</button>
                    <button className="table-button danger"  type="button"            onClick={() => removeSection(sec.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {exam.sections.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9f9', borderRadius: 10, fontSize: '0.85rem' }}>
                <strong>Total:</strong> {totalDuration} min &nbsp;·&nbsp; {totalRequired} questions
              </div>
            )}
          </div>

          {/* Add / Edit form */}
          <div className="detail-panel" style={{ alignSelf: 'start' }}>
            <h4 style={{ marginTop: 0 }}>{editingSectionId ? `Editing: ${draft.name || 'Section'}` : 'Add Section'}</h4>
            <SectionForm isEditing={Boolean(editingSectionId)} />
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 3 – QUESTIONS ════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          {/* Section tabs */}
          <div className="detail-panel" style={{ alignSelf: 'start' }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Sections</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {exam.sections.map((sec) => {
                const filled  = sec.questions.length;
                const needed  = Number(sec.totalQuestions);
                const pct     = needed > 0 ? Math.round((filled / needed) * 100) : 0;
                const done    = filled === needed;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={`outline-trigger ${selectedSection?.id === sec.id ? 'active-page' : ''}`}
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 12, border: `1px solid ${done ? '#15803d' : 'var(--line)'}`, background: done ? '#f0fdf4' : 'white', cursor: 'pointer' }}
                    onClick={() => setSelId(sec.id)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{sec.name}</div>
                    <div style={{ fontSize: '0.75rem', color: done ? '#15803d' : 'var(--muted)', marginTop: 3 }}>
                      {filled}/{needed} · {pct}%
                    </div>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: done ? '#15803d' : 'var(--brand)', transition: 'width 0.3s' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question bank */}
          <div className="detail-panel">
            {!selectedSection ? (
              <p className="muted-copy">Select a section on the left.</p>
            ) : (
              <>
                {/* Section header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{selectedSection.name}</h4>
                    <span className="muted-copy" style={{ fontSize: '0.82rem' }}>
                      {selectedSection.questions.length} / {selectedSection.totalQuestions} questions selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ghost-button compact" type="button" onClick={randomSelect}>
                      🎲 Random Select
                    </button>
                    {selectedSection.questions.length > 0 && (
                      <button className="table-button danger" type="button" onClick={clearSection}>Clear</button>
                    )}
                  </div>
                </div>

                {/* Selected questions chips */}
                {selectedSection.questions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, padding: 10, background: '#f0f9f9', borderRadius: 10 }}>
                    {selectedSection.questions.map((q) => {
                      const info = questionBankDemo.find((qb) => qb.questionId === q.qi);
                      return (
                        <span key={q.qi} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'var(--brand)', color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>
                          Q{q.o}: {info?.questionDisplayKey || q.qi}
                          <button type="button" onClick={() => toggleQuestion({ questionId: q.qi })}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <select className="filter-select" value={selectedSection.filters.classificationLevel1}
                    onChange={(e) => updateSelected((s) => ({ ...s, filters: { ...s.filters, classificationLevel1: e.target.value } }))}>
                    <option value="">All Subjects</option>
                    {Object.entries(SUBJECT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select className="filter-select" value={selectedSection.filters.questionType}
                    onChange={(e) => updateSelected((s) => ({ ...s, filters: { ...s.filters, questionType: e.target.value } }))}>
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Integer">Integer</option>
                  </select>
                  <select className="filter-select" value={selectedSection.filters.level}
                    onChange={(e) => updateSelected((s) => ({ ...s, filters: { ...s.filters, level: e.target.value } }))}>
                    <option value="">All Levels</option>
                    <option value="1">Easy</option>
                    <option value="2">Medium</option>
                    <option value="3">Hard</option>
                  </select>
                  <span className="muted-copy" style={{ lineHeight: '46px', fontSize: '0.82rem' }}>{filteredQuestions.length} questions</span>
                </div>

                {/* Question table */}
                <div className="student-table-shell" style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Question ID</th>
                        <th>Subject</th>
                        <th>Chapter</th>
                        <th>Type</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.length === 0 && (
                        <tr><td colSpan={6} className="empty-row">No questions match the filters.</td></tr>
                      )}
                      {filteredQuestions.map((q) => {
                        const checked = selectedSection.questions.some((x) => x.qi === q.questionId);
                        const full    = !checked && selectedSection.questions.length >= Number(selectedSection.totalQuestions);
                        return (
                          <tr key={q.questionId} style={{ background: checked ? '#f0fdf4' : undefined, opacity: full ? 0.45 : 1 }}>
                            <td>
                              <input type="checkbox" checked={checked} disabled={full}
                                onChange={() => toggleQuestion(q)} style={{ width: 16, height: 16, cursor: full ? 'not-allowed' : 'pointer' }} />
                            </td>
                            <td><strong>{q.questionDisplayKey}</strong></td>
                            <td>{q.subject}</td>
                            <td>{q.chapter}</td>
                            <td><span className="status-pill">{q.questionType}</span></td>
                            <td><span className="status-pill" style={{ background: q.level === 1 ? '#15803d' : q.level === 2 ? '#b45309' : '#b42318' }}>{LEVEL_LABEL[q.level]}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 4 – SUMMARY ════════════════════ */}
      {step === 4 && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Exam config strip */}
          <div className="detail-panel" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #004954 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 4px', opacity: 0.75, fontSize: '0.82rem' }}>Exam</p>
                <h3 style={{ margin: 0, color: 'white' }}>{exam.title || '—'}</h3>
                {exam.brief && <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.88rem' }}>{exam.brief}</p>}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Marking Scheme', value: activeScheme.label },
                  { label: 'Challenge',      value: exam.challengeQuestionAllowed ? 'Allowed' : 'Disabled' },
                  { label: 'Switching',      value: exam.switchSectionsAllowed    ? 'Allowed' : 'Locked'   },
                  { label: 'Section Timer',  value: exam.sectionTimerEnabled      ? 'On'      : 'Off'       },
                ].map((item) => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {exam.sections.map((sec) => {
              const scheme = MARKING_SCHEMES.find((m) => m.id === Number(sec.sectionMarkingScheme)) || activeScheme;
              const secMax = sec.questions.length * scheme.correct;
              return (
                <div key={sec.id} className="detail-panel" style={{ borderTop: '3px solid var(--brand)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ background: 'var(--brand)', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>#{sec.order}</span>
                    {sec.questions.length === Number(sec.totalQuestions)
                      ? <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.82rem' }}>✓ Complete</span>
                      : <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.82rem' }}>⚠ Incomplete</span>
                    }
                  </div>
                  <strong style={{ fontSize: '1rem' }}>{sec.name}</strong>
                  <div className="muted-copy" style={{ fontSize: '0.82rem', marginTop: 8, display: 'grid', gap: 4 }}>
                    <div>⏱ Duration: <strong>{sec.duration} min</strong></div>
                    <div>❓ Questions: <strong>{sec.questions.length} / {sec.totalQuestions}</strong></div>
                    <div>📊 Scheme: <strong>{scheme.label}</strong></div>
                    <div>🏆 Max Marks: <strong>{secMax}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="detail-panel">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { label: 'Sections',        value: exam.sections.length },
                { label: 'Total Duration',  value: `${totalDuration} min` },
                { label: 'Total Questions', value: totalQuestions },
                { label: 'Maximum Marks',   value: maxMarks },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div className="muted-copy" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
                  <div className="big-stat" style={{ fontSize: '2rem' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness */}
          {!isExamReady() && (
            <div className="info-banner" style={{ background: '#fff7ed', borderColor: '#fcd34d', color: '#92400e' }}>
              ⚠ Some sections are incomplete. Fill all questions before publishing.
            </div>
          )}

          {/* Preview button */}
          {previewList.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <button
                className="primary-button"
                type="button"
                onClick={() => { setPreviewIdx(0); setShowPreview(true); }}
                style={{ padding: '14px 40px', fontSize: '1rem' }}
              >
                👁 Preview Exam
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom navigation ──────────────────────────────────────────── */}
      <div className="pagination-bar" style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="pagination-controls">
          <button className="ghost-button" type="button" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>← Previous</button>
          {step < 4 && (
            <button className="primary-button" type="button" onClick={tryNext}>Next →</button>
          )}
        </div>
        <div className="action-row">
          <button className="ghost-button" type="button" onClick={() => saveExam(0)}>Save Draft</button>
          {step === 4 && (
            <button className="primary-button" type="button" onClick={() => saveExam(1)}>
              {editId ? '✓ Update Exam' : '🚀 Publish Exam'}
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════ RANDOM SELECT MODAL ════════════════════ */}
      {showRandomModal && selectedSection && (() => {
        const remaining      = Number(selectedSection.totalQuestions) - selectedSection.questions.length;
        const totalRequested = randomConfig.reduce((s, row) => s + (Number(row.count) || 0), 0);
        const isOver         = totalRequested > remaining;
        const isEmpty        = totalRequested === 0;

        return (
          <div className="modal-scrim" onClick={() => setShowRandomModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}
              style={{ padding: 0, maxWidth: 580, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>🎲 Random Select</strong>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Section: <strong>{selectedSection.name}</strong> &nbsp;·&nbsp;
                    <strong style={{ color: 'var(--brand)' }}>{remaining}</strong> slot(s) remaining
                  </p>
                </div>
                <button type="button" onClick={() => setShowRandomModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gap: 16 }}>
                <div style={{ padding: '10px 14px', background: '#f0f9f9', borderRadius: 10, fontSize: '0.84rem', color: 'var(--muted)' }}>
                  For each difficulty level, enter the count and choose which chapters to draw from.
                  Leaving chapters empty picks from all available chapters.
                </div>

                {randomConfig.map((row, ri) => {
                  const levelColor = row.level === 1 ? '#15803d' : row.level === 2 ? '#b45309' : '#b42318';
                  return (
                    <div key={row.level} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
                      {/* Level + count row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <span style={{ background: levelColor, color: 'white', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: '0.82rem', minWidth: 64, textAlign: 'center' }}>
                          {row.label}
                        </span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>No. of questions</span>
                          <input
                            type="number" min="0" placeholder="0"
                            value={row.count}
                            className="search-input"
                            style={{ width: 72, textAlign: 'center' }}
                            onChange={(e) => setRandomConfig((prev) => prev.map((r, i) => i === ri ? { ...r, count: e.target.value } : r))}
                          />
                        </label>
                      </div>

                      {/* Chapter multi-select */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Chapters
                          {row.chapters.length > 0
                            ? <span style={{ fontWeight: 400, textTransform: 'none', color: levelColor, marginLeft: 6 }}>{row.chapters.length} selected</span>
                            : <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6 }}>— all chapters</span>
                          }
                        </div>
                        {randomSelectChapters.length === 0 ? (
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>No chapters available for the current filters.</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 108, overflowY: 'auto', padding: 2 }}>
                            {randomSelectChapters.map((ch) => {
                              const selected = row.chapters.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => setRandomConfig((prev) => prev.map((r, i) => {
                                    if (i !== ri) return r;
                                    const chapters = selected
                                      ? r.chapters.filter((c) => c !== ch)
                                      : [...r.chapters, ch];
                                    return { ...r, chapters };
                                  }))}
                                  style={{
                                    padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', cursor: 'pointer',
                                    border: `1px solid ${selected ? levelColor : 'var(--line)'}`,
                                    background: selected ? levelColor : 'white',
                                    color: selected ? 'white' : 'inherit',
                                    fontWeight: selected ? 600 : 400,
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {ch}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {row.chapters.length > 0 && (
                          <button type="button"
                            onClick={() => setRandomConfig((prev) => prev.map((r, i) => i === ri ? { ...r, chapters: [] } : r))}
                            style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                            Clear selection
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total indicator */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px', borderRadius: 10,
                  background: isOver ? '#fff1f0' : '#f0f9f9',
                  border: `1px solid ${isOver ? '#fca5a5' : 'var(--line)'}`,
                }}>
                  <span style={{ fontSize: '0.88rem' }}>
                    Total requested: <strong>{totalRequested}</strong> of {remaining} available
                  </span>
                  {isOver && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700 }}>
                      ⚠ Exceeds {remaining} remaining slot(s)
                    </span>
                  )}
                  {!isOver && totalRequested > 0 && remaining - totalRequested > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {remaining - totalRequested} slot(s) stay unfilled
                    </span>
                  )}
                  {!isOver && totalRequested === remaining && (
                    <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>✓ Fills section exactly</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
                <button className="ghost-button" type="button" onClick={() => setShowRandomModal(false)}>Cancel</button>
                <button className="primary-button" type="button" onClick={applyRandomSelect}
                  disabled={isOver || isEmpty}
                  style={{ opacity: (isOver || isEmpty) ? 0.5 : 1 }}>
                  Apply Random Select
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════ PREVIEW MODAL ════════════════════ */}
      {showPreview && previewList.length > 0 && (() => {
        const current = previewList[previewIdx];
        // Figure out which section this question belongs to (for the header indicator)
        let sectionStart = 0;
        let sectionLocal = previewIdx;
        let currentSecObj = null;
        for (const sec of exam.sections) {
          if (sectionLocal < sec.questions.length) { currentSecObj = sec; break; }
          sectionStart += sec.questions.length;
          sectionLocal -= sec.questions.length;
        }
        const secIdx      = currentSecObj ? exam.sections.indexOf(currentSecObj) : 0;
        const secFilled   = currentSecObj?.questions.length || 0;

        return (
          <div className="modal-scrim" onClick={() => setShowPreview(false)}>
            <div className="modal-card large" onClick={(e) => e.stopPropagation()}
              style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>

              {/* Modal header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, var(--brand) 0%, #004954 100%)', borderRadius: '24px 24px 0 0', color: 'white' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Preview</div>
                  <strong style={{ fontSize: '1.1rem' }}>{exam.title}</strong>
                </div>
                <button type="button" onClick={() => setShowPreview(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕ Close</button>
              </div>

              {/* Section tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
                {exam.sections.map((sec, si) => {
                  const isActive = si === secIdx;
                  const qStart   = exam.sections.slice(0, si).reduce((s, x) => s + x.questions.length, 0);
                  return (
                    <button key={sec.id} type="button"
                      onClick={() => setPreviewIdx(qStart)}
                      style={{ padding: '10px 18px', border: 'none', borderBottom: isActive ? '3px solid var(--brand)' : '3px solid transparent', background: 'white', color: isActive ? 'var(--brand)' : 'var(--muted)', fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                      {sec.name} ({sec.questions.length})
                    </button>
                  );
                })}
              </div>

              {/* Question display */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <span className="muted-copy" style={{ fontSize: '0.82rem' }}>
                    Section: <strong>{current.sectionName}</strong> · Q{sectionLocal + 1}/{secFilled}
                  </span>
                  <span className="muted-copy" style={{ fontSize: '0.82rem' }}>
                    Overall: Q{previewIdx + 1} / {previewList.length}
                  </span>
                </div>

                {/* Question card */}
                <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 28, background: '#fafbfb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--brand)', color: 'white', borderRadius: 8, padding: '4px 12px', fontWeight: 700, fontSize: '0.88rem' }}>{current.questionDisplayKey || `Q-${current.qi}`}</span>
                      <span className="status-pill">{current.questionType || 'MCQ'}</span>
                      <span className="status-pill" style={{ background: current.level === 1 ? '#15803d' : current.level === 2 ? '#b45309' : '#b42318' }}>
                        {LEVEL_LABEL[current.level] || 'Medium'}
                      </span>
                    </div>
                    <span className="muted-copy" style={{ fontSize: '0.8rem' }}>⏱ ~{current.averageTimeToSolveProblem || 60}s</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Subject',  value: current.subject  || SUBJECT_MAP[current.classificationLevel1] || '—' },
                      { label: 'Chapter',  value: current.chapter  || '—' },
                      { label: 'Section',  value: current.sectionName },
                      { label: 'Order in Section', value: `Q${sectionLocal + 1}` },
                    ].map((r) => (
                      <div key={r.label} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontWeight: 600 }}>{r.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '14px 18px', background: '#e8f4f5', borderRadius: 10, color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                    <em>Question content preview not available in demo mode.</em>
                    <br /><small>Question ID: {current.qi} · Display Key: {current.questionDisplayKey || '—'}</small>
                  </div>
                </div>

                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 20, flexWrap: 'wrap' }}>
                  {previewList.map((_, i) => (
                    <button key={i} type="button" onClick={() => setPreviewIdx(i)}
                      style={{ width: i === previewIdx ? 24 : 10, height: 10, borderRadius: 5, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: i === previewIdx ? 'var(--brand)' : '#d1d5db' }} />
                  ))}
                </div>
              </div>

              {/* Navigation footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="ghost-button" type="button" disabled={previewIdx === 0}
                  onClick={() => setPreviewIdx((i) => i - 1)}>
                  ← Previous
                </button>
                <span className="muted-copy" style={{ fontSize: '0.88rem' }}>{previewIdx + 1} / {previewList.length}</span>
                <button className="ghost-button" type="button" disabled={previewIdx === previewList.length - 1}
                  onClick={() => setPreviewIdx((i) => i + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
