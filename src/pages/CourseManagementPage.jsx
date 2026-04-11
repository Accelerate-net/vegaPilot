import React, { useMemo, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { courseManagementDemo } from '../data/courseManagementDemo';

export default function CourseManagementPage() {
  const [bundles, setBundles] = useState(courseManagementDemo.bundles);
  const [modules, setModules] = useState(courseManagementDemo.modules);
  const [chapters, setChapters] = useState(courseManagementDemo.chapters);
  const [activeTab, setActiveTab] = useState('bundles');
  const [selectedBundleId, setSelectedBundleId] = useState(courseManagementDemo.bundles[0]?.id || null);
  const [bundleDraft, setBundleDraft] = useState({ title: '', displayKey: '', description: '' });
  const [moduleDraft, setModuleDraft] = useState({ title: '', moduleKey: '', description: '', subjectArea: '', difficultyLevel: 'Beginner' });
  const [chapterDraft, setChapterDraft] = useState({ moduleCode: '1', code: '', title: '', label: '' });
  const [selectedSyllabusId, setSelectedSyllabusId] = useState(courseManagementDemo.syllabi[0]?.id || '');
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const selectedBundle = useMemo(
    () => bundles.find((bundle) => bundle.id === selectedBundleId) || bundles[0] || null,
    [bundles, selectedBundleId]
  );

  const filteredModules = useMemo(() => {
    if (!selectedBundle) return modules;
    return modules.filter((module) => selectedBundle.modulesIncluded.includes(module.moduleKey));
  }, [modules, selectedBundle]);

  const filteredChapters = useMemo(() => {
    const allowed = new Set(filteredModules.map((module) => module.moduleKey));
    return chapters.filter((chapter) => allowed.has(chapter.moduleCode));
  }, [chapters, filteredModules]);

  return (
    <section className="screen-card course-management-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Authoring</p>
          <h3>Course Management</h3>
          <p className="muted-copy">Manage bundles, modules, and chapters while preserving the existing authoring workflow.</p>
        </div>
      </div>

      <div className="tab-row">
        {['bundles', 'modules', 'chapters'].map((tab) => (
          <button key={tab} type="button" className={`ghost-button compact ${activeTab === tab ? 'active-page' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <article className="detail-panel">
          <h4>Bundle Scope</h4>
          <select className="filter-select" value={selectedBundleId || ''} onChange={(event) => setSelectedBundleId(Number(event.target.value))}>
            {bundles.map((bundle) => <option key={bundle.id} value={bundle.id}>{bundle.title}</option>)}
          </select>
          {selectedBundle ? (
            <div className="stack-grid compact-stack">
              <p><strong>Display Key:</strong> {selectedBundle.displayKey}</p>
              <p><strong>Description:</strong> {selectedBundle.description}</p>
              <div className="chip-row">{selectedBundle.modulesIncluded.map((moduleKey) => <span key={moduleKey} className="link-chip neutral">Module {moduleKey}</span>)}</div>
            </div>
          ) : null}
        </article>
        <article className="detail-panel">
          <h4>Syllabus Bootstrap</h4>
          <select className="filter-select" value={selectedSyllabusId} onChange={(event) => setSelectedSyllabusId(event.target.value)}>
            {courseManagementDemo.syllabi.map((syllabus) => <option key={syllabus.id} value={syllabus.id}>{syllabus.title}</option>)}
          </select>
          <button type="button" className="primary-button" onClick={() => showToast('success', 'Syllabus Selected', `Initialized draft structure from ${selectedSyllabusId}.`)}>
            Initialize From Syllabus
          </button>
        </article>
      </div>

      {activeTab === 'bundles' ? (
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Create Course Bundle</h4>
            <input className="search-input" placeholder="Bundle title" value={bundleDraft.title} onChange={(event) => setBundleDraft((current) => ({ ...current, title: event.target.value }))} />
            <input className="search-input" placeholder="Display key" value={bundleDraft.displayKey} onChange={(event) => setBundleDraft((current) => ({ ...current, displayKey: event.target.value }))} />
            <textarea className="search-input textarea-like" placeholder="Description" value={bundleDraft.description} onChange={(event) => setBundleDraft((current) => ({ ...current, description: event.target.value }))} />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (!bundleDraft.title.trim()) {
                  showToast('error', 'Validation', 'Please enter a course bundle title.');
                  return;
                }
                setBundles((current) => [...current, { id: Date.now(), title: bundleDraft.title, displayKey: bundleDraft.displayKey || `BUNDLE-${Date.now()}`, description: bundleDraft.description, active: 1, modulesIncluded: filteredModules.map((module) => module.moduleKey) }]);
                setBundleDraft({ title: '', displayKey: '', description: '' });
                showToast('success', 'Bundle Created', 'Course bundle created successfully!');
              }}
            >
              Save Bundle
            </button>
          </article>
          <article className="detail-panel">
            <h4>Existing Bundles</h4>
            <div className="stack-grid compact-stack">
              {bundles.map((bundle) => (
                <button key={bundle.id} type="button" className={`detail-panel align-left ${bundle.id === selectedBundleId ? 'active-panel' : ''}`} onClick={() => setSelectedBundleId(bundle.id)}>
                  <strong>{bundle.title}</strong>
                  <div className="student-subtle">{bundle.displayKey} • {bundle.modulesIncluded.length} modules</div>
                </button>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === 'modules' ? (
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Create Module</h4>
            <input className="search-input" placeholder="Module title" value={moduleDraft.title} onChange={(event) => setModuleDraft((current) => ({ ...current, title: event.target.value }))} />
            <input className="search-input" placeholder="Module key" value={moduleDraft.moduleKey} onChange={(event) => setModuleDraft((current) => ({ ...current, moduleKey: event.target.value }))} />
            <input className="search-input" placeholder="Subject area" value={moduleDraft.subjectArea} onChange={(event) => setModuleDraft((current) => ({ ...current, subjectArea: event.target.value }))} />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (!moduleDraft.title.trim() || !moduleDraft.moduleKey.trim()) {
                  showToast('error', 'Validation', 'Please fill in required module fields.');
                  return;
                }
                if (modules.some((module) => module.moduleKey === moduleDraft.moduleKey)) {
                  showToast('error', 'Validation', 'Module key already exists.');
                  return;
                }
                setModules((current) => [...current, { ...moduleDraft, active: 1 }]);
                setModuleDraft({ title: '', moduleKey: '', description: '', subjectArea: '', difficultyLevel: 'Beginner' });
                showToast('success', 'Module Saved', 'Module created successfully!');
              }}
            >
              Save Module
            </button>
          </article>
          <article className="detail-panel">
            <h4>Modules In Selected Bundle</h4>
            <div className="stack-grid compact-stack">
              {filteredModules.map((module) => (
                <div key={module.moduleKey} className="detail-panel align-left">
                  <strong>{module.title}</strong>
                  <div className="student-subtle">{module.moduleKey} • {module.subjectArea}</div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === 'chapters' ? (
        <div className="detail-grid">
          <article className="detail-panel">
            <h4>Create Chapter</h4>
            <select className="filter-select" value={chapterDraft.moduleCode} onChange={(event) => setChapterDraft((current) => ({ ...current, moduleCode: event.target.value }))}>
              {modules.map((module) => <option key={module.moduleKey} value={module.moduleKey}>{module.title}</option>)}
            </select>
            <input className="search-input" placeholder="Chapter code" value={chapterDraft.code} onChange={(event) => setChapterDraft((current) => ({ ...current, code: event.target.value }))} />
            <input className="search-input" placeholder="Chapter title" value={chapterDraft.title} onChange={(event) => setChapterDraft((current) => ({ ...current, title: event.target.value }))} />
            <input className="search-input" placeholder="Label" value={chapterDraft.label} onChange={(event) => setChapterDraft((current) => ({ ...current, label: event.target.value }))} />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (!chapterDraft.title.trim() || !chapterDraft.code.trim()) {
                  showToast('error', 'Validation', 'Please fill in all required chapter fields.');
                  return;
                }
                setChapters((current) => [...current, { id: Date.now(), ...chapterDraft, status: 1, partsIncluded: [] }]);
                setChapterDraft({ moduleCode: '1', code: '', title: '', label: '' });
                showToast('success', 'Chapter Saved', 'Chapter created successfully!');
              }}
            >
              Save Chapter
            </button>
          </article>
          <article className="detail-panel">
            <h4>Chapters In Selected Bundle</h4>
            <div className="stack-grid compact-stack">
              {filteredChapters.map((chapter) => (
                <div key={chapter.id} className="detail-panel align-left">
                  <strong>{chapter.title}</strong>
                  <div className="student-subtle">{chapter.code} • Module {chapter.moduleCode}</div>
                  <div className="chip-row">{(chapter.partsIncluded || []).map((part, index) => <span key={`${chapter.id}-${index}`} className="link-chip neutral">{part.type}</span>)}</div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
