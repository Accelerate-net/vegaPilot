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
        const allowed = new Set(filteredModules.map(m => m.moduleKey));
        return chapters.filter(c => allowed.has(c.moduleCode));
    }, [chapters, filteredModules]);

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
                    <div className="panel-heading" style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #e9ecef' }}>
                        <h2 style={{ margin: 0, fontSize: 18, color: '#006073', fontWeight: 600 }}>
                            <i className="ti ti-book"></i> Create New Course Bundle
                        </h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Bundle Title</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" placeholder="Enter course bundle title" value={newBundle.title} onChange={e => setNewBundle({...newBundle, title: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Display Key</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" placeholder="Auto-generated" value={newBundle.displayKey} onChange={e => setNewBundle({...newBundle, displayKey: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Status</label>
                                        <div className="col-sm-9">
                                            <select className="form-control" value={newBundle.active} onChange={e => setNewBundle({...newBundle, active: e.target.value})}>
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 15 }}>
                                        <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Syllabus</label>
                                        <div className="col-sm-9">
                                            <select className="form-control" value={newBundle.selectedSyllabusId} onChange={e => setNewBundle({...newBundle, selectedSyllabusId: e.target.value})}>
                                                <option value="">Select Syllabus (Optional)</option>
                                                {syllabi.map(syl => (
                                                    <option key={syl.id} value={syl.id}>{syl.title}</option>
                                                ))}
                                            </select>
                                            <small className="help-block" style={{ marginTop: 5 }}>Based on the selected syllabus, choose modules below to include.</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />
                            <div className="form-group" style={{ display: 'flex' }}>
                                <label className="col-sm-12 control-label text-left" style={{ fontWeight: 600, fontSize: 16, marginBottom: 15 }}>Select Modules</label>
                            </div>
                            <div className="row" style={{ padding: '0 15px' }}>
                                {modules.map(module => (
                                    <div className="col-md-3" key={module.moduleKey} style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#f8f9fa', padding: '10px 15px', borderRadius: 6, border: '1px solid #e9ecef' }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ marginRight: 10, width: 16, height: 16 }}
                                                checked={!!newBundle.selectedModules[module.moduleKey]} 
                                                onChange={e => setNewBundle({...newBundle, selectedModules: {...newBundle.selectedModules, [module.moduleKey]: e.target.checked}})} 
                                            />
                                            <span style={{ fontWeight: 500 }}>{module.title}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />
                            <div className="form-group text-right" style={{ marginTop: 20 }}>
                                <button type="button" className="btn btn-default" onClick={() => setCreateView(false)} style={{ marginRight: 10, padding: '10px 20px', borderRadius: 4, border: '1px solid #ccc' }}>
                                    <i className="ti ti-close"></i> Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleCreateBundle} disabled={!newBundle.title} style={{ padding: '10px 20px', borderRadius: 4, background: '#006073', border: 'none', color: 'white' }}>
                                    <i className="ti ti-save"></i> Create Course Bundle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        if (createType === 'module') {
            return (
                <div className="panel panel-default">
                    <div className="panel-heading" style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #e9ecef' }}>
                        <h2 style={{ margin: 0, fontSize: 18, color: '#006073', fontWeight: 600 }}>
                            <i className="ti ti-layout-grid2"></i> Create New Module
                        </h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Module Title</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="Enter module title" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Module Key</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., 5" value={newModule.moduleKey} onChange={e => setNewModule({...newModule, moduleKey: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Subject Area</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., Science" value={newModule.subjectArea} onChange={e => setNewModule({...newModule, subjectArea: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Status</label>
                                <div className="col-sm-9">
                                    <select className="form-control" value={newModule.active} onChange={e => setNewModule({...newModule, active: e.target.value})}>
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group text-right" style={{ marginTop: 30 }}>
                                <button type="button" className="btn btn-default" onClick={() => setCreateView(false)} style={{ marginRight: 10, padding: '10px 20px', borderRadius: 4, border: '1px solid #ccc' }}>
                                    <i className="ti ti-close"></i> Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleCreateModule} disabled={!newModule.title || !newModule.moduleKey} style={{ padding: '10px 20px', borderRadius: 4, background: '#006073', border: 'none', color: 'white' }}>
                                    <i className="ti ti-save"></i> Create Module
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        if (createType === 'chapter') {
            return (
                <div className="panel panel-default">
                    <div className="panel-heading" style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #e9ecef' }}>
                        <h2 style={{ margin: 0, fontSize: 18, color: '#006073', fontWeight: 600 }}>
                            <i className="ti ti-bookmark"></i> Create New Chapter
                        </h2>
                    </div>
                    <div className="panel-body">
                        <form className="form-horizontal" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Module</label>
                                <div className="col-sm-9">
                                    <select className="form-control" value={newChapter.moduleCode} onChange={e => setNewChapter({...newChapter, moduleCode: e.target.value})}>
                                        <option value="">Select Module</option>
                                        {modules.map(m => <option key={m.moduleKey} value={m.moduleKey}>{m.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Chapter Code</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="E.g., CH-01" value={newChapter.code} onChange={e => setNewChapter({...newChapter, code: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="col-sm-3 control-label text-right" style={{ fontWeight: 600 }}>Chapter Title</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" placeholder="Enter chapter title" value={newChapter.title} onChange={e => setNewChapter({...newChapter, title: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group text-right" style={{ marginTop: 30 }}>
                                <button type="button" className="btn btn-default" onClick={() => setCreateView(false)} style={{ marginRight: 10, padding: '10px 20px', borderRadius: 4, border: '1px solid #ccc' }}>
                                    <i className="ti ti-close"></i> Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleCreateChapter} disabled={!newChapter.title || !newChapter.moduleCode || !newChapter.code} style={{ padding: '10px 20px', borderRadius: 4, background: '#006073', border: 'none', color: 'white' }}>
                                    <i className="ti ti-save"></i> Create Chapter
                                </button>
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
                            {selectedCourseBundle && !createView && (
                                <>
                                    <h2 className="welcome-title">
                                        <i className="ti ti-book"></i> {selectedCourseBundle.title}
                                    </h2>
                                    <p className="welcome-subtitle">
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
                            {createView && (
                                <>
                                    <h2 className="welcome-title">
                                        <i className="ti ti-pencil"></i> Authoring Tool
                                    </h2>
                                    <p className="welcome-subtitle">Creating new content...</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-primary" onClick={() => setIsSelectCourseModalOpen(true)} style={{ marginRight: 10 }}>
                            <i className="ti ti-layers"></i> Select Course
                        </button>
                        <button className="btn btn-success" onClick={() => { setCreateType('bundle'); setCreateView(true); }}>
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
                                                <i className="ti ti-folder" style={{ marginRight: 10 }}></i> Modules
                                            </a>
                                        </li>
                                        <li role="presentation" className={activeTab === 'chapters' ? 'active' : ''}>
                                            <a href="#chapters" onClick={(e) => { e.preventDefault(); setActiveTab('chapters'); }}>
                                                <i className="ti ti-book" style={{ marginRight: 10 }}></i> Chapters
                                            </a>
                                        </li>
                                    </ul>

                                    <div className="tab-content" style={{ paddingTop: 20 }}>
                        {activeTab === 'modules' && (
                            <div className="row" style={{ paddingTop: 20 }}>
                                <div className="col-md-12">
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12 text-right">
                                            <button className="btn btn-primary" onClick={() => { setCreateType('module'); setCreateView(true); }}>
                                                <i className="ti ti-plus"></i> Add New Module
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            {filteredModules.map(module => (
                                                <div key={module.moduleKey} className="module-card">
                                                    <div className={`module-header ${expandedModules[module.moduleKey] ? 'expanded' : ''}`} onClick={() => toggleModule(module.moduleKey)} style={{ background: '#f8f9fa', padding: '15px 20px', cursor: 'pointer', border: '1px solid #e9ecef', borderRadius: expandedModules[module.moduleKey] ? '4px 4px 0 0' : '4px', marginBottom: expandedModules[module.moduleKey] ? 0 : 15 }}>
                                                        <div className="row" style={{ display: 'flex', alignItems: 'center' }}>
                                                            <div className="col-md-8">
                                                                <div className="module-info" style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <div className="expand-indicator" style={{ marginRight: 15 }}>
                                                                        <i className={`fa ${expandedModules[module.moduleKey] ? 'fa-folder-open-o' : 'fa-folder-o'}`} style={{ fontSize: 24, color: '#666' }}></i>
                                                                    </div>
                                                                    <div className="module-details">
                                                                        <h3 className="module-title" style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>
                                                                            {module.title}
                                                                        </h3>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4 text-right">
                                                                <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); }}>
                                                                    <i className="ti ti-book"></i> Modify Chapters
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedModules[module.moduleKey] && (
                                                        <div className="module-content" style={{ padding: '0 20px 20px', border: '1px solid #e9ecef', borderTop: 'none', background: '#fff', marginBottom: 15, borderRadius: '0 0 4px 4px' }}>
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="chapters-table-container">
                                                                        <table className="table table-striped table-hover" style={{ marginTop: 15 }}>
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
                                                                                                    <div className="teacher-info-compact" style={{ display: 'flex', alignItems: 'center' }}>
                                                                                                        <img src={chapter.teacher.photo || 'assets/img/default_user.png'} alt="teacher" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                                                                                                        <span>{chapter.teacher.name}</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <span className="text-muted" style={{ fontSize: 12 }}>Unassigned</span>
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
                            <div className="row" style={{ paddingTop: 20 }}>
                                <div className="col-md-12">
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12">
                                            <button className="btn btn-default" style={{ marginRight: 10 }} onClick={() => setActiveTab('modules')}>
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
                                                <div key={chapter.id} className="chapter-item" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 15, overflow: 'hidden' }}>
                                                    <div className="chapter-header" onClick={() => toggleChapter(chapter.id)} style={{ padding: '15px 20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                        <div className="row" style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center' }}>
                                                            <div className="col-md-8" style={{ padding: 0 }}>
                                                                <div className="chapter-info" style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <div className="expand-indicator" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                                                        <i className={`fa ${expandedChapters[chapter.id] ? 'fa-folder-open-o' : 'fa-folder-o'}`} style={{ color: '#007bff', fontSize: 20 }}></i>
                                                                    </div>
                                                                    <div className="chapter-details">
                                                                        <h4 className="chapter-title" style={{ margin: '0 0 5px 0', fontSize: 16, fontWeight: 'bold' }}>{chapter.title}</h4>
                                                                        <p className="chapter-meta" style={{ margin: 0, color: '#666', fontSize: 13 }}>
                                                                            <span><b>Chapter {chapter.code}</b> of Subject<i className="fa fa-circle separator-dot" style={{ margin: '0 8px', fontSize: 5 }}></i>{getPartsCount(chapter.partsIncluded)} parts<i className="fa fa-circle separator-dot" style={{ margin: '0 8px', fontSize: 5 }}></i>0:00:00</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4" style={{ padding: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                {chapter.teacher ? (
                                                                    <div className="teacher-info-simple" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                        <img src={chapter.teacher.photo || 'assets/img/default_user.png'} alt="Teacher" style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }} />
                                                                        <div className="teacher-details-simple">
                                                                            <span style={{ fontWeight: 600, display: 'block' }}>{chapter.teacher.name}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="teacher-not-mapped" onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer', padding: '8px 10px', border: '2px dashed #ccc', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, background: '#f9f9f9', transition: 'all 0.3s ease' }}>
                                                                        <i className="ti ti-user" style={{ fontSize: 20, color: '#999' }}></i>
                                                                        <div style={{ textAlign: 'left', flex: 1 }}>
                                                                            <span style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 500 }}>No Instructor</span>
                                                                            <span style={{ display: 'block', fontSize: 10, color: '#007bff', fontWeight: 'bold' }}>Click to Assign</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedChapters[chapter.id] && (
                                                        <div className="parts-list" style={{ background: '#eff8ff', padding: 20, borderTop: '2px solid #aec5dc' }}>
                                                            {getPartsCount(chapter.partsIncluded) > 0 ? (
                                                                <div>
                                                                    {chapter.partsIncluded.map((part, pIdx) => (
                                                                        <div key={pIdx} className="part-item" style={{ display: 'flex', alignItems: 'center', padding: 12, background: '#fff', border: '1px solid #e9ecef', borderRadius: 4, marginBottom: 8 }}>
                                                                            <div style={{ background: '#28a745', color: '#fff', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: 15 }}>
                                                                                {pIdx + 1}
                                                                            </div>
                                                                            <div style={{ color: '#6c757d', marginRight: 10 }}>
                                                                                <i className={`ti ${part.type === 'VIDEO' ? 'ti-video-camera' : part.type === 'MATERIAL' ? 'ti-file' : 'ti-clipboard'}`} style={{fontSize: 24}}></i>
                                                                            </div>
                                                                            <div>
                                                                                <h6 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{part.title}</h6>
                                                                                <span className={`badge badge-${part.type === 'VIDEO' ? 'primary' : part.type === 'MATERIAL' ? 'info' : 'secondary'}`} style={{ fontSize: 10 }}>{part.type}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div style={{ textAlign: 'center', color: '#6c757d', padding: 20 }}>
                                                                    <i className="ti ti-video-camera-off" style={{ fontSize: 32, opacity: 0.5, marginBottom: 10 }}></i>
                                                                    <p style={{ margin: 0 }}>This chapter doesn't have any parts assigned yet.</p>
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
                    <div className="modal-backdrop fade in crispr-modal-backdrop" style={{ display: 'block', zIndex: 1040 }}></div>
                    <div className="modal fade in" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content" style={{ borderRadius: 8, overflow: 'hidden' }}>
                                <div className="modal-header" style={{ background: '#006073', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 className="modal-title" style={{ margin: 0 }}>
                                        <i className="ti ti-layers" style={{ marginRight: 8 }}></i> Select Course Bundle
                                    </h4>
                                    <button type="button" className="close" onClick={() => setIsSelectCourseModalOpen(false)} style={{ color: 'white', opacity: 0.8, background: 'transparent', border: 'none', fontSize: 24 }}>
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body" style={{ padding: 20 }}>
                                    <div className="row" style={{ marginBottom: 20 }}>
                                        <div className="col-md-12">
                                            <div className="input-group" style={{ width: '100%' }}>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Search course bundles by title or code..." 
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    style={{ width: '100%', padding: '10px 15px', borderRadius: 4, border: '1px solid #ddd' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                                <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                                                        <tr>
                                                            <th style={{ padding: '12px 8px', borderBottom: '2px solid #dee2e6' }}><i className="ti ti-hash"></i></th>
                                                            <th style={{ padding: '12px 8px', borderBottom: '2px solid #dee2e6' }}>Course Bundle</th>
                                                            <th style={{ width: 150, textAlign: 'center', padding: '12px 8px', borderBottom: '2px solid #dee2e6' }}>Modules</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bundles.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(bundle => (
                                                            <tr 
                                                                key={bundle.id} 
                                                                onClick={() => {
                                                                    setSelectedCourseBundle(bundle);
                                                                    setIsSelectCourseModalOpen(false);
                                                                    setCreateView(false);
                                                                }}
                                                                style={{ cursor: 'pointer', background: selectedCourseBundle?.id === bundle.id ? '#e8f5e9' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                                                            >
                                                                <td style={{ verticalAlign: 'middle', padding: '12px 8px' }}>
                                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #008ba3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                                        <i className="ti ti-book"></i>
                                                                    </div>
                                                                </td>
                                                                <td style={{ verticalAlign: 'middle', padding: '12px 8px' }}>
                                                                    <strong style={{ fontSize: 16 }}>{bundle.title}</strong>
                                                                    <div style={{ fontSize: 12, color: '#666' }}>Code: {bundle.displayKey}</div>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px 8px' }}>
                                                                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e3f2fd', color: '#1976d2', borderRadius: 12, fontWeight: 'bold' }}>
                                                                        {bundle.modulesIncluded.length}
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
                                <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', padding: 15, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-default" onClick={() => setIsSelectCourseModalOpen(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 4 }}>
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
