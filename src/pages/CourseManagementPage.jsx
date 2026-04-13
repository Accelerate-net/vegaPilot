import React, { useState, useMemo } from 'react';
import './CourseManagementPage.css';
import { courseManagementDemo } from '../data/courseManagementDemo';
import ToastRegion from '../components/ToastRegion';

export default function CourseManagementPage() {
    const [bundles, setBundles] = useState(courseManagementDemo.bundles);
    const [modules, setModules] = useState(courseManagementDemo.modules);
    const [chapters, setChapters] = useState(courseManagementDemo.chapters);
    const [syllabi] = useState(courseManagementDemo.syllabi || []);
    
    const [selectedCourseBundle, setSelectedCourseBundle] = useState(courseManagementDemo.bundles[0] || null);
    const [activeTab, setActiveTab] = useState('modules');
    const [toasts, setToasts] = useState([]);
    
    // View flags
    const [createView, setCreateView] = useState(false);
    const [createType, setCreateType] = useState(''); // 'bundle', 'module', 'chapter', 'parts'
    const [editingChapterId, setEditingChapterId] = useState(null);

    // Form states
    const [newBundle, setNewBundle] = useState({ title: '', displayKey: '', active: '1', selectedSyllabusId: '', selectedModules: {} });
    const [newModule, setNewModule] = useState({ title: '', moduleKey: '', subjectArea: '', difficultyLevel: 'Beginner', active: '1' });
    const [newChapter, setNewChapter] = useState({ moduleCode: '', code: '', title: '', label: '', status: '1' });
    
    // Modals
    const [isSelectCourseModalOpen, setIsSelectCourseModalOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    
    // Expanded states
    const [expandedModules, setExpandedModules] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});
    
    const [searchQuery, setSearchQuery] = useState('');

    function showToast(type, title, message) {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, type, title, message }]);
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
    }

    const filteredModules = useMemo(() => {
        if (!selectedCourseBundle) return [];
        return modules.filter(m => selectedCourseBundle.modulesIncluded.includes(m.moduleKey));
    }, [modules, selectedCourseBundle]);
    
    const filteredChapters = useMemo(() => {
        let chaps = chapters;
        if (selectedCourseBundle) {
            const allowed = new Set(filteredModules.map(m => m.moduleKey));
            chaps = chaps.filter(c => allowed.has(c.moduleCode));
        }
        if (selectedModule) {
            chaps = chaps.filter(c => c.moduleCode === selectedModule.moduleKey);
        }
        return chaps;
    }, [chapters, filteredModules, selectedCourseBundle, selectedModule]);

    const toggleModule = (moduleKey) => {
        setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
    };

    const getPartsCount = (partsArray) => partsArray ? partsArray.length : 0;

    const handleCreateBundle = () => {
        const selectedModuleKeys = Object.keys(newBundle.selectedModules).filter(k => newBundle.selectedModules[k]);
        const b = {
            id: Date.now(),
            title: newBundle.title,
            displayKey: newBundle.displayKey || `BUN-${Date.now().toString().slice(-4)}`,
            active: parseInt(newBundle.active, 10),
            modulesIncluded: selectedModuleKeys,
            description: ''
        };
        setBundles([...bundles, b]);
        setSelectedCourseBundle(b);
        setCreateView(false);
        showToast('success', 'Bundle Created', 'Successfully created new course bundle.');
        setNewBundle({ title: '', displayKey: '', active: '1', selectedSyllabusId: '', selectedModules: {} });
    };

    const handleCreateModule = () => {
        const m = { ...newModule, active: parseInt(newModule.active, 10) };
        setModules([...modules, m]);
        
        // Auto-add to currently selected bundle
        if (selectedCourseBundle) {
            const updatedBundle = { 
                ...selectedCourseBundle, 
                modulesIncluded: [...selectedCourseBundle.modulesIncluded, m.moduleKey] 
            };
            setBundles(bundles.map(b => b.id === updatedBundle.id ? updatedBundle : b));
            setSelectedCourseBundle(updatedBundle);
        }
        
        setCreateView(false);
        showToast('success', 'Module Created', 'Successfully created new module.');
        setNewModule({ title: '', moduleKey: '', subjectArea: '', difficultyLevel: 'Beginner', active: '1' });
    };

    const handleCreateChapter = () => {
        const c = { id: Date.now(), ...newChapter, status: parseInt(newChapter.status, 10), partsIncluded: [] };
        setChapters([...chapters, c]);
        setCreateView(false);
        showToast('success', 'Chapter Created', 'Successfully created new chapter.');
        setNewChapter({ moduleCode: '', code: '', title: '', label: '', status: '1' });
    };

    const renderCreateView = () => {
        if (createType === 'bundle') {
            return (
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <h2><i className="ti ti-book"></i> Create New Course Bundle</h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Bundle Title</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" placeholder="Enter course bundle title" value={newBundle.title} onChange={e => setNewBundle({...newBundle, title: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Display Key</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" placeholder="Auto-generated HTML" value={newBundle.displayKey} onChange={e => setNewBundle({...newBundle, displayKey: e.target.value})} readOnly />
                                            <small className="help-block">Auto-generated unique identifier</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Status</label>
                                        <div className="col-sm-9">
                                            <select className="form-control" value={newBundle.active} onChange={e => setNewBundle({...newBundle, active: e.target.value})}>
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Syllabus</label>
                                        <div className="col-sm-9">
                                            <select className="form-control" value={newBundle.selectedSyllabusId} onChange={e => setNewBundle({...newBundle, selectedSyllabusId: e.target.value})}>
                                                <option value="">Select Syllabus</option>
                                                {syllabi.map(syl => (
                                                    <option key={syl.id} value={syl.id}>{syl.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Select Modules</label>
                                <div className="col-sm-9">
                                    <div className="row">
                                        {modules.map(module => (
                                            <div className="col-md-3" key={module.moduleKey}>
                                                <div className="checkbox">
                                                    <label>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!newBundle.selectedModules[module.moduleKey]} 
                                                            onChange={e => setNewBundle({...newBundle, selectedModules: {...newBundle.selectedModules, [module.moduleKey]: e.target.checked}})} 
                                                        />
                                                        <strong>{module.title}</strong>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="col-sm-offset-3 col-sm-9">
                                    <button type="button" className="btn btn-primary btn-lg" onClick={handleCreateBundle} disabled={!newBundle.title} style={{ marginRight: 10 }}>
                                        <i className="ti ti-save"></i> Create Course Bundle
                                    </button>
                                    <button type="button" className="btn btn-default btn-lg" onClick={() => setCreateView(false)}>
                                        <i className="ti ti-close"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        if (createType === 'module') {
            return (
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <h2><i className="ti ti-layout-grid2"></i> Create New Module</h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal">
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Module Title</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="Enter module title" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Module Key</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., 5" value={newModule.moduleKey} onChange={e => setNewModule({...newModule, moduleKey: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Subject Area</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., Science" value={newModule.subjectArea} onChange={e => setNewModule({...newModule, subjectArea: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Status</label>
                                <div className="col-sm-9">
                                    <select className="form-control" value={newModule.active} onChange={e => setNewModule({...newModule, active: e.target.value})}>
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-offset-3 col-sm-9">
                                    <button type="button" className="btn btn-primary btn-lg" onClick={handleCreateModule} disabled={!newModule.title || !newModule.moduleKey} style={{ marginRight: 10 }}>
                                        <i className="ti ti-save"></i> Create Module
                                    </button>
                                    <button type="button" className="btn btn-default btn-lg" onClick={() => setCreateView(false)}>
                                        <i className="ti ti-close"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        if (createType === 'chapter') {
            return (
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <h2><i className="ti ti-bookmark"></i> Create New Chapter</h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal">
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Module</label>
                                <div className="col-sm-9">
                                    <select className="form-control" value={newChapter.moduleCode} onChange={e => setNewChapter({...newChapter, moduleCode: e.target.value})}>
                                        <option value="">Select Module</option>
                                        {modules.map(m => <option key={m.moduleKey} value={m.moduleKey}>{m.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Chapter Code</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., CH-01" value={newChapter.code} onChange={e => setNewChapter({...newChapter, code: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-3 control-label">Chapter Title</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="Enter chapter title" value={newChapter.title} onChange={e => setNewChapter({...newChapter, title: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-offset-3 col-sm-9">
                                    <button type="button" className="btn btn-primary btn-lg" onClick={handleCreateChapter} disabled={!newChapter.title || !newChapter.moduleCode || !newChapter.code} style={{ marginRight: 10 }}>
                                        <i className="ti ti-save"></i> Create Chapter
                                    </button>
                                    <button type="button" className="btn btn-default btn-lg" onClick={() => setCreateView(false)}>
                                        <i className="ti ti-close"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="container-fluid" style={{ paddingTop: '1%' }}>
            <ToastRegion toasts={toasts} onDismiss={(id) => setToasts(current => current.filter(t => t.id !== id))} />
            
            <div className="course-bundle-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="welcome-section">
                            {!selectedCourseBundle && (
                                <h2 className="welcome-title">
                                    <i className="ti ti-layers"></i> Course Management
                                </h2>
                            )}
                            {selectedCourseBundle && (
                                <>
                                    <h2 className="welcome-title">
                                        <i className="ti ti-book"></i> {selectedCourseBundle.title}
                                    </h2>
                                    <p className="welcome-subtitle" style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: 4, display: 'inline-block', margin: 0 }}>
                                        <span style={{ fontWeight: 500 }}>
                                            <i className="ti ti-folder" style={{ marginRight: 4 }}></i>{filteredModules.length} Modules
                                        </span>
                                        <span style={{ margin: '0 12px', opacity: 0.5 }}>|</span>
                                        <span style={{ fontWeight: 500 }}>
                                            <i className="ti ti-list" style={{ marginRight: 4 }}></i>{filteredChapters.length} Chapters
                                        </span>
                                        {selectedCourseBundle.displayKey && (
                                            <>
                                                <span style={{ margin: '0 12px', opacity: 0.5 }}>|</span>
                                                <span style={{ fontWeight: 400, opacity: 0.85 }}>
                                                    <i className="ti ti-tag" style={{ marginRight: 4 }}></i>{selectedCourseBundle.displayKey}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-primary" onClick={() => setIsSelectCourseModalOpen(true)} style={{ marginRight: 10 }}>
                            <i className="ti ti-layers"></i> Select Course
                        </button>
                        <button className="btn btn-success" onClick={() => { setCreateType('bundle'); setCreateView(true); }} style={{ background: '#ffb706', color: '#006073', border: 'none', fontWeight: 600 }}>
                            <i className="ti ti-plus"></i> New Bundle
                        </button>
                    </div>
                </div>
            </div>

            {createView ? (
                <div data-widget-group="course-window">
                    <div className="row">
                        <div className="col-md-12">
                            {renderCreateView()}
                        </div>
                    </div>
                </div>
            ) : selectedCourseBundle ? (
                <div data-widget-group="course-management-tabs">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="panel panel-default">
                                <div className="panel-body">
                                    <ul className="nav nav-tabs" role="tablist">
                                        <li role="presentation" className={activeTab === 'modules' ? 'active' : ''}>
                                            <a href="#modules" onClick={(e) => { e.preventDefault(); setActiveTab('modules'); }}>
                                                <i className="ti ti-folder" style={{ marginRight: 10 }}></i> 
                                                {!selectedModule ? 'Modules' : `Module: ${selectedModule.title}`}
                                            </a>
                                        </li>
                                        {selectedModule && (
                                            <li role="presentation" className={activeTab === 'chapters' ? 'active' : ''}>
                                                <a href="#chapters" onClick={(e) => { e.preventDefault(); setActiveTab('chapters'); }}>
                                                    <i className="ti ti-book" style={{ marginRight: 10 }}></i> Chapters
                                                </a>
                                            </li>
                                        )}
                                    </ul>

                                    <div className="tab-content" style={{ paddingTop: 20 }}>
                        {activeTab === 'modules' && (
                            <div className="row" style={{ paddingTop: 0 }}>
                                <div className="col-md-12">
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12">
                                            <button className="btn btn-default" style={{ display: 'none' }} onClick={() => { setCreateType('module'); setCreateView(true); }}>
                                                <i className="ti ti-plus"></i> Add New Module
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            {filteredModules.map(module => (
                                                <div key={module.moduleKey} className="module-card">
                                                    <div className={`module-header ${expandedModules[module.moduleKey] ? 'expanded' : ''}`} onClick={() => toggleModule(module.moduleKey)}>
                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="module-info">
                                                                    <div className="expand-indicator">
                                                                        <i className={`fa ${expandedModules[module.moduleKey] ? 'fa-folder-open-o' : 'fa-folder-o'}`}></i>
                                                                    </div>
                                                                    <div className="module-details">
                                                                        <h3 className="module-title">
                                                                            {module.title}
                                                                        </h3>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4 text-right">
                                                                <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedModule(module); setActiveTab('chapters'); }}>
                                                                    <i className="ti ti-book"></i> Modify Chapters
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedModules[module.moduleKey] && (
                                                        <div className="module-content">
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="chapters-table-container">
                                                                        <table className="table table-striped table-hover">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Chapter</th>
                                                                                    <th>Name</th>
                                                                                    <th>Parts</th>
                                                                                    <th>Total Hours</th>
                                                                                    <th>Teacher</th>
                                                                                    <th>Status</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {chapters.filter(c => c.moduleCode === module.moduleKey).length === 0 ? (
                                                                                    <tr>
                                                                                        <td colSpan="6" className="text-center text-muted" style={{ padding: '20px' }}>
                                                                                            <i className="ti ti-info"></i> No chapters assigned to this module yet
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : (
                                                                                    chapters.filter(c => c.moduleCode === module.moduleKey).map(chapter => (
                                                                                        <tr key={chapter.id}>
                                                                                            <td style={{ verticalAlign: 'middle' }}><strong>{chapter.code}</strong></td>
                                                                                            <td style={{ verticalAlign: 'middle' }}>{chapter.title}</td>
                                                                                            <td style={{ verticalAlign: 'middle' }}>{getPartsCount(chapter.partsIncluded)}</td>
                                                                                            <td style={{ verticalAlign: 'middle' }}>0:00:00</td>
                                                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                                                {chapter.teacher ? (
                                                                                                    <div className="teacher-info-compact">
                                                                                                        <img src={chapter.teacher.photo || 'assets/img/default_user.png'} alt="teacher" className="teacher-photo-tiny" />
                                                                                                        <span>{chapter.teacher.name}</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="teacher-not-mapped">
                                                                                                        <i className="ti ti-help"></i> Not Assigned
                                                                                                    </div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                                                <span className={`badge ${chapter.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                                                                                                    {chapter.status === 1 ? 'Active' : 'Inactive'}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'chapters' && (
                            <div className="row" style={{ paddingTop: 0 }}>
                                <div className="col-md-12">
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12">
                                            <button className="btn btn-default" style={{ marginRight: 10 }} onClick={() => { setSelectedModule(null); setActiveTab('modules'); }}>
                                                <i className="ti ti-arrow-left"></i> Back to Modules
                                            </button>
                                            <button className="btn btn-default" style={{ display: 'none' }} onClick={() => { setCreateType('chapter'); setCreateView(true); }}>
                                                <i className="ti ti-plus"></i> Add New Chapter
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            {filteredChapters.map(chapter => (
                                                <div key={chapter.id} className="chapter-item">
                                                    <div className="chapter-header" onClick={() => toggleChapter(chapter.id)}>
                                                        <div className="row" style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center' }}>
                                                            <div className="col-md-8" style={{ padding: 0 }}>
                                                                <div className="chapter-info">
                                                                    <div className="expand-indicator">
                                                                        <i className={`fa ${expandedChapters[chapter.id] ? 'fa-folder-open-o' : 'fa-folder-o'}`}></i>
                                                                    </div>
                                                                    <div className="chapter-details">
                                                                        <h4 className="chapter-title">{chapter.title}</h4>
                                                                        <p className="chapter-meta">
                                                                            <span><b>Chapter {chapter.code}</b> of Subject<i className="fa fa-circle separator-dot"></i>{getPartsCount(chapter.partsIncluded)} parts<i className="fa fa-circle separator-dot"></i>0:00:00</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4" style={{ padding: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                {chapter.teacher ? (
                                                                    <div className="teacher-info-simple" onClick={(e) => e.stopPropagation()}>
                                                                        <img src={chapter.teacher.photo || 'assets/img/default_user.png'} alt="Teacher" />
                                                                        <div className="teacher-details-simple">
                                                                            <span>{chapter.teacher.name}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="teacher-not-mapped" onClick={(e) => e.stopPropagation()}>
                                                                        <i className="ti ti-user"></i>
                                                                        <div className="text-left" style={{ flex: 1 }}>
                                                                            <span className="title">No Instructor</span>
                                                                            <span className="subtitle">Click to Assign</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedChapters[chapter.id] && (
                                                        <div className="chapter-parts-container">
                                                            {getPartsCount(chapter.partsIncluded) > 0 ? (
                                                                <div className="parts-list">
                                                                    {chapter.partsIncluded.map((part, pIdx) => (
                                                                        <div key={pIdx} className="part-card">
                                                                            <div className="part-index">
                                                                                {pIdx + 1}
                                                                            </div>
                                                                            <div className="part-icon">
                                                                                <i className={`ti ${part.type === 'VIDEO' ? 'ti-video-camera' : part.type === 'MATERIAL' ? 'ti-file' : 'ti-clipboard'}`}></i>
                                                                            </div>
                                                                            <div className="part-content">
                                                                                <h4>{part.title}</h4>
                                                                                <span className={`badge badge-${part.type === 'VIDEO' ? 'primary' : part.type === 'MATERIAL' ? 'info' : 'secondary'}`}>{part.type}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="no-parts-message">
                                                                    <div className="empty-state-icon">
                                                                        <i className="ti ti-video-camera-off"></i>
                                                                    </div>
                                                                    <h4>No Parts Found</h4>
                                                                    <p>This chapter doesn't have any parts assigned yet.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Select Course Modal */}
            {isSelectCourseModalOpen && (
                <>
                    <div className="modal-backdrop fade in" style={{ display: 'block', zIndex: 1040 }}></div>
                    <div className="modal fade in" id="selectCourseModal" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1" role="dialog" aria-labelledby="selectCourseModalLabel">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header" style={{ backgroundColor: '#006073', color: 'white' }}>
                                    <button type="button" className="close" onClick={() => setIsSelectCourseModalOpen(false)} style={{ color: 'white', opacity: 0.8 }}>
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                    <h4 className="modal-title" id="selectCourseModalLabel">
                                        <i className="ti ti-layers"></i> Select Course Bundle
                                    </h4>
                                </div>
                                <div className="modal-body">
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12">
                                            <div className="input-group">
                                                <span className="input-group-addon"><i className="ti ti-search"></i></span>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Search course bundles by title or code..." 
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                />
                                                {searchQuery && (
                                                    <span className="input-group-btn">
                                                        <button className="btn btn-default" onClick={() => setSearchQuery('')}>
                                                            <i className="ti ti-close"></i>
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                                <table className="table table-hover" style={{ marginBottom: 0 }}>
                                                    <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                                                        <tr>
                                                            <th style={{ width: 60 }}><i className="ti ti-hash"></i></th>
                                                            <th>Course Bundle</th>
                                                            <th style={{ width: 150, textAlign: 'center' }}>Modules</th>
                                                            <th style={{ width: 150, textAlign: 'center' }}>Chapters</th>
                                                            <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bundles.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.displayKey.toLowerCase().includes(searchQuery.toLowerCase())).map(bundle => (
                                                            <tr 
                                                                key={bundle.id} 
                                                                onClick={() => {
                                                                    setSelectedCourseBundle(bundle);
                                                                    setIsSelectCourseModalOpen(false);
                                                                    setCreateView(false);
                                                                }}
                                                                style={{ cursor: 'pointer', transition: 'all 0.2s ease', color: selectedCourseBundle?.id === bundle.id ? 'white' : 'inherit' }}
                                                                className={selectedCourseBundle?.id === bundle.id ? 'bg-success' : ''}
                                                            >
                                                                <td style={{ verticalAlign: 'middle' }}>
                                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #008ba3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                                                                        <i className="ti ti-book"></i>
                                                                    </div>
                                                                </td>
                                                                <td style={{ verticalAlign: 'middle' }}>
                                                                    <strong style={{ fontSize: 16 }}>{bundle.title}</strong>
                                                                    <div style={{ fontSize: 12, color: '#666' }}>Code: {bundle.displayKey}</div>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span className="badge" style={{ backgroundColor: '#007bff', fontSize: 14, padding: '6px 12px', borderRadius: 12 }}>
                                                                        {bundle.modulesIncluded.length}
                                                                    </span>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span className="badge" style={{ backgroundColor: '#28a745', fontSize: 14, padding: '6px 12px', borderRadius: 12 }}>
                                                                        {bundle.modulesIncluded.reduce((acc, mk) => acc + chapters.filter(c => c.moduleCode === mk).length, 0)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span className={`badge ${bundle.active === 1 ? 'badge-success' : 'badge-warning'}`}>
                                                                        {bundle.active === 1 ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-default" onClick={() => setIsSelectCourseModalOpen(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
