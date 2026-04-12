import React, { useState, useMemo, useEffect } from 'react';
import ToastRegion from '../components/ToastRegion';
import { courseViewDemo } from '../data/courseViewDemo';
import { demoCourses } from '../data/coursesListDemo';

export default function CourseViewPage() {
  const [toasts, setToasts] = useState([]);
  
  // States
  const [courseData, setCourseData] = useState(courseViewDemo);
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  
  const [selectCourseModalOpen, setSelectCourseModalOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Initialization
  useEffect(() => {
    if (courseData.segments && courseData.segments.length > 0) {
      const seg = courseData.segments[0];
      setSelectedSegmentId(seg.id);
      if (seg.modules && seg.modules.length > 0) {
        const mod = seg.modules[0];
        setSelectedModuleId(mod.id);
        if (mod.chapters && mod.chapters.length > 0) {
          const chap = mod.chapters[0];
          setSelectedChapterId(chap.id);
          if (chap.parts && chap.parts.length > 0) {
            setSelectedPartId(chap.parts[0].id);
          }
        }
      }
    }
  }, [courseData]);

  // Derived state
  const availableSegments = courseData.segments || [];
  
  const selectedSegment = useMemo(() => {
    return availableSegments.find(s => s.id === selectedSegmentId) || null;
  }, [availableSegments, selectedSegmentId]);

  const availableModules = selectedSegment?.modules || [];

  const selectedModule = useMemo(() => {
    return availableModules.find(m => m.id === selectedModuleId) || null;
  }, [availableModules, selectedModuleId]);

  const availableChapters = selectedModule?.chapters || [];

  const chapterData = useMemo(() => {
    return availableChapters.find(c => c.id === selectedChapterId) || null;
  }, [availableChapters, selectedChapterId]);

  const parts = chapterData?.parts || [];

  const selectedPartIndex = useMemo(() => {
    return parts.findIndex(p => p.id === selectedPartId);
  }, [parts, selectedPartId]);

  const selectedPart = parts[selectedPartIndex] || null;

  // Handlers
  const handleSegmentChange = (e) => {
    const sId = e.target.value;
    setSelectedSegmentId(sId);
    // Reset down the chain
    const seg = availableSegments.find(s => s.id === sId);
    const mod = seg?.modules?.[0];
    setSelectedModuleId(mod ? mod.id : '');
    const chap = mod?.chapters?.[0];
    setSelectedChapterId(chap ? chap.id : '');
    setSelectedPartId(chap?.parts?.[0]?.id || '');
  };

  const handleModuleChange = (e) => {
    const mId = e.target.value;
    setSelectedModuleId(mId);
    const mod = availableModules.find(m => m.id === mId);
    const chap = mod?.chapters?.[0];
    setSelectedChapterId(chap ? chap.id : '');
    setSelectedPartId(chap?.parts?.[0]?.id || '');
  };

  const handleChapterChange = (e) => {
    const cId = e.target.value;
    setSelectedChapterId(cId);
    const chap = availableChapters.find(c => c.id === cId);
    setSelectedPartId(chap?.parts?.[0]?.id || '');
  };

  const hasPreviousPart = selectedPartIndex > 0;
  const hasNextPart = selectedPartIndex >= 0 && selectedPartIndex < parts.length - 1;

  const previousPart = () => {
    if (hasPreviousPart) {
      setSelectedPartId(parts[selectedPartIndex - 1].id);
    }
  };

  const nextPart = () => {
    if (hasNextPart) {
      setSelectedPartId(parts[selectedPartIndex + 1].id);
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Select Course logic
  const filteredCoursesArray = useMemo(() => {
    if (!courseSearchQuery) return demoCourses;
    const q = courseSearchQuery.toLowerCase();
    return demoCourses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [demoCourses, courseSearchQuery]);

  const selectCourseFromModal = (code) => {
    // In a real app we would refetch courseViewDemo based on the course code.
    // Here we'll just close it and show a toast.
    setSelectCourseModalOpen(false);
    showToast('success', 'Course Loaded', `Loaded course ${code}`);
  };

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }

  return (
    <div style={{ padding: '0 15px' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px', background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)', borderRadius: '8px', color: 'white' }}>
         <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600, color: 'white' }}>
               <i className="ti ti-book"></i> {courseData.code}: {courseData.title}
            </h2>
            <p style={{ margin: '0 0 15px 0', opacity: 0.9, fontSize: '14px' }}>
               {courseData.description}
            </p>
            {/* Navigation Dropdowns */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Segment</label>
                  <select value={selectedSegmentId} onChange={handleSegmentChange} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'white', color: '#2c3e50', fontWeight: 600, fontSize: '14px', minWidth: '150px', cursor: 'pointer' }}>
                     {availableSegments.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module</label>
                  <select value={selectedModuleId} onChange={handleModuleChange} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'white', color: '#2c3e50', fontWeight: 600, fontSize: '14px', minWidth: '200px', cursor: 'pointer' }}>
                     {availableModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chapter</label>
                  <select value={selectedChapterId} onChange={handleChapterChange} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'white', color: '#2c3e50', fontWeight: 600, fontSize: '14px', minWidth: '250px', cursor: 'pointer' }}>
                     {availableChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
            </div>
         </div>
         <button className="cv-btn cv-btn-lg" style={{ background: '#ffb706', color: '#006073', border: 'none', fontWeight: 600, padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' }} onClick={() => setSelectCourseModalOpen(true)}>
            <i className="ti ti-layers"></i> Select Course
         </button>
      </div>

      {/* Course View Container */}
      <div className="cv-course-container">
         {/* Empty State: No Content Added */}
         {chapterData && parts.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '600px', textAlign: 'center', padding: '40px' }}>
                <i className="ti ti-folder-open" style={{ fontSize: '80px', color: '#dee2e6', marginBottom: '24px' }}></i>
                <h3 style={{ color: '#495057', marginBottom: '12px', fontWeight: 500 }}>No Content Added</h3>
                <p style={{ color: '#6c757d', fontSize: '15px', maxWidth: '400px' }}>
                   No content has been added for "{chapterData.name}" yet.
                </p>
            </div>
         )}

         {/* Normal Content View */}
         {chapterData && parts.length > 0 && (
            <div style={{ display: 'flex', width: '100%', gap: 0 }}>
               {/* Course Sidebar */}
               <div className="cv-course-sidebar">
                  {/* Mentor Info */}
                  <div className="cv-mentor" style={{ borderTop: '3px solid #006073' }}>
                      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMmMyLjIxIDAgNC0xLjc5IDQtNHMtMS43OS00LTQtNC00IDEuNzktNCA0IDEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo=" alt="Mentor" />
                      <div className="cv-mentor-info">
                          <p>Course Instructor</p>
                          <p>Expert in {courseData.category || 'Science'}</p>
                      </div>
                  </div>

                  {/* Chapter List */}
                  <ul className="cv-chapter-list">
                      {parts.map((part, index) => (
                          <li key={part.id} 
                              className={`cv-chapter ${part.id === selectedPartId ? 'cv-active' : ''}`}
                              onClick={() => setSelectedPartId(part.id)}>
                              <div className="cv-chapter-number">{index + 1}</div>
                              <div className="cv-chapter-details">
                                  <div className="cv-chapter-title">{part.title}</div>
                                  <div className="cv-chapter-meta">
                                      <span className={`cv-progress-ring cv-${part.type === 'VIDEO' ? 'in-progress' : 'completed'}`}></span>
                                      {part.type}
                                  </div>
                              </div>
                              <div className="cv-chapter-duration">{formatDuration(part.duration)}</div>
                          </li>
                      ))}
                  </ul>
               </div>

               {/* Course Content Area */}
               <div className="cv-course-content">
                  {selectedPart && (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {/* Content Header */}
                          <div className="cv-content-header">
                             <div style={{ flex: 1 }}>
                                <h3>{selectedPart.title}</h3>
                                <p className="cv-subtext">{selectedPart.summary}</p>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px', color: '#6c757d' }}>
                                   <span><i className="ti ti-time" style={{ marginRight: '5px' }}></i>{formatDuration(selectedPart.duration)}</span>
                                   <span><i className="ti ti-eye" style={{ marginRight: '5px' }}></i>12k views</span>
                                   <span><i className="ti ti-download" style={{ marginRight: '5px' }}></i>143 downloads</span>
                                   <span><i className="ti ti-star" style={{ color: '#ffb706', marginRight: '5px' }}></i>5/5</span>
                                </div>
                             </div>
                             {/* Navigation Controls */}
                             <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="cv-btn" onClick={previousPart} disabled={!hasPreviousPart}
                                        style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e5e8ef', background: 'white', color: '#6c757d', cursor: hasPreviousPart ? 'pointer' : 'not-allowed', opacity: hasPreviousPart ? 1 : 0.5 }}>
                                   <i className="ti ti-angle-left"></i> Previous
                                </button>
                                <button className="cv-btn" onClick={nextPart} disabled={!hasNextPart}
                                        style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e5e8ef', background: 'white', color: '#6c757d', cursor: hasNextPart ? 'pointer' : 'not-allowed', opacity: hasNextPart ? 1 : 0.5 }}>
                                   Next <i className="ti ti-angle-right"></i>
                                </button>
                             </div>
                          </div>

                          {/* Video Player Placeholder or Empty state depending on type */}
                          <div style={{ flex: 1 }}>
                             {selectedPart.type === 'VIDEO' ? (
                                <div className="cv-video-wrapper">
                                    <div className="cv-video-placeholder">
                                        🎥
                                    </div>
                                </div>
                             ) : (
                                <div style={{ padding: '35px' }}>
                                    <div className="cv-part-info">
                                        <div className="cv-part-title"><i className={`ti ti-${selectedPart.type === 'QUIZ' ? 'pencil' : 'download'}`}></i> {selectedPart.title}</div>
                                        <div className="cv-part-description">{selectedPart.summary}</div>
                                        <div className="cv-part-meta">
                                            <div className="cv-meta-item"><i className="ti ti-files"></i> Type: {selectedPart.type}</div>
                                        </div>
                                    </div>
                                </div>
                             )}
                          </div>
                      </div>
                  )}
               </div>
            </div>
         )}
      </div>

      {/* Select Course Modal properly decoupled */}
      {selectCourseModalOpen && (
         <div className="modal-scrim" style={{ display: 'grid', background: 'rgba(9, 26, 30, 0.48)' }} onClick={() => setSelectCourseModalOpen(false)}>
             <div className="modal-card large" style={{ maxWidth: '800px', width: '100%', background: '#fff', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#006073', color: 'white', padding: '15px 20px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                     <h4 style={{ margin: 0 }}><i className="ti ti-layers"></i> Select Course</h4>
                     <button onClick={() => setSelectCourseModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', opacity: 0.8 }}>
                         <i className="ti ti-close"></i>
                     </button>
                 </div>
                 
                 <div style={{ padding: '20px' }}>
                     <div style={{ marginBottom: '20px', position: 'relative' }}>
                         <input type="text" style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #ccc' }} placeholder="Search courses by title or code..." value={courseSearchQuery} onChange={e => setCourseSearchQuery(e.target.value)} />
                         <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }}></i>
                     </div>
                     
                     <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                             <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                                 <tr>
                                     <th style={{ padding: '10px', textAlign: 'left', width: '60px' }}><i className="ti ti-hash"></i></th>
                                     <th style={{ padding: '10px', textAlign: 'left' }}>Course</th>
                                     <th style={{ padding: '10px', textAlign: 'center', width: '150px' }}>Modules</th>
                                     <th style={{ padding: '10px', textAlign: 'center', width: '150px' }}>Chapters</th>
                                     <th style={{ padding: '10px', textAlign: 'center', width: '120px' }}>Category</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {filteredCoursesArray.map(course => (
                                     <tr key={course.code} onClick={() => selectCourseFromModal(course.code)} style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }} className="cv-course-tr-hover">
                                         <td style={{ padding: '10px' }}>
                                             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #008ba3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                                                 <i className="ti ti-book"></i>
                                             </div>
                                         </td>
                                         <td style={{ padding: '10px' }}>
                                             <div>
                                                 <strong style={{ fontSize: '15px' }}>{course.title}</strong>
                                                 <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>Code: {course.code}</div>
                                             </div>
                                         </td>
                                         <td style={{ padding: '10px', textAlign: 'center' }}>
                                             <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e3f2fd', color: '#1976d2', borderRadius: '12px', fontWeight: 500 }}>{course.moduleCount}</span>
                                         </td>
                                         <td style={{ padding: '10px', textAlign: 'center' }}>
                                             <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fff3e0', color: '#f57c00', borderRadius: '12px', fontWeight: 500 }}>{course.chapterCount}</span>
                                         </td>
                                         <td style={{ padding: '10px', textAlign: 'center' }}>
                                             <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e0f7fa', color: '#006064', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{course.category}</span>
                                         </td>
                                     </tr>
                                 ))}
                                 {filteredCoursesArray.length === 0 && (
                                     <tr>
                                         <td colSpan="5" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                                             <i className="ti ti-info-alt" style={{ fontSize: '56px', display: 'block', marginBottom: '15px', opacity: 0.5 }}></i>
                                             <p style={{ fontSize: '16px' }}>No courses available</p>
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>
                 <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
                     <button className="cv-btn" onClick={() => setSelectCourseModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
                         <i className="ti ti-close"></i> Close
                     </button>
                 </div>
             </div>
         </div>
      )}
      
      <style>
      {`
        .cv-course-tr-hover:hover {
            background-color: #f8f9fa;
        }
      `}
      </style>
    </div>
  );
}
