import React, { useState, useEffect, useRef } from 'react';
import './CourseManagementPage.css';
import { courseManagementDemo } from '../data/courseManagementDemo';
import ToastRegion from '../components/ToastRegion';
import Avatar from '../components/Avatar';

const data = courseManagementDemo;

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export default function CourseManagementPage() {
    const [loading, setLoading] = useState(true);
    const [bundles, setBundles] = useState([]);
    const [availableModules] = useState(data.availableModules);
    const [chapters, setChapters] = useState([]);
    const [videoParts] = useState(data.videoParts);
    const [uniqueSyllabi] = useState(data.uniqueSyllabi);
    const [availableInstructors] = useState(data.availableInstructors);

    const [selectedCourseBundle, setSelectedCourseBundle] = useState(null);
    const [filteredModules, setFilteredModules] = useState([]);
    const [filteredChapters, setFilteredChapters] = useState([]);

    const [selectedModule, setSelectedModule] = useState(null);
    const [activeTab, setActiveTab] = useState('modules');
    const [editingChapterParts, setEditingChapterParts] = useState(false);
    const [editingChapterData, setEditingChapterData] = useState(null);
    const [originalChapterData, setOriginalChapterData] = useState(null);

    const [expandedModules, setExpandedModules] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});

    // Drag and drop
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Modal visibility
    const [showBundleModal, setShowBundleModal] = useState(false);
    const [showSelectCourseModal, setShowSelectCourseModal] = useState(false);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showChangeInstructorModal, setShowChangeInstructorModal] = useState(false);
    const [showVideoPreviewModal, setShowVideoPreviewModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showLinkQuizModal, setShowLinkQuizModal] = useState(false);
    const [showAttachMaterialModal, setShowAttachMaterialModal] = useState(false);

    // Modal data
    const [selectedTeacherProfile, setSelectedTeacherProfile] = useState(null);
    const [currentChapterForTeacherChange, setCurrentChapterForTeacherChange] = useState(null);
    const [selectedNewInstructor, setSelectedNewInstructor] = useState(null);
    const [videoPreviewPart, setVideoPreviewPart] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedQuizForLink, setSelectedQuizForLink] = useState(null);
    const [materialUpload, setMaterialUpload] = useState({ title: '', file: null, fileName: '', brief: '' });
    const materialFileRef = useRef(null);

    // Form state for new bundle
    const [newBundle, setNewBundle] = useState({ title: '', bundleCode: '', syllabusCode: '' });

    // Search queries
    const [courseBundleSearchQuery, setCourseBundleSearchQuery] = useState('');
    const [instructorSearchQuery, setInstructorSearchQuery] = useState('');
    const [contentLibrarySearch, setContentLibrarySearch] = useState('');
    const [quizSearchQuery, setQuizSearchQuery] = useState('');

    const [toasts, setToasts] = useState([]);

    // Load data on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            const loadedBundles = data.courseBundles;
            const loadedChapters = data.chapters;
            setBundles(loadedBundles);
            setChapters(loadedChapters);
            const firstBundle = loadedBundles[0];
            setSelectedCourseBundle(firstBundle);
            if (firstBundle) {
                const mods = availableModules.filter(m =>
                    firstBundle.modulesIncluded.some(bm => bm.moduleKey === m.moduleKey)
                );
                const chaps = loadedChapters.filter(ch =>
                    firstBundle.modulesIncluded.some(bm => bm.moduleKey === ch.moduleCode.toString())
                );
                setFilteredModules(mods);
                setFilteredChapters(chaps);
            }
            setLoading(false);
        }, 700);
        return () => clearTimeout(timer);
    }, []);

    function showToast(type, title, message) {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }

    // ===== Utility functions =====

    function getVideoTitle(libraryId) {
        const part = videoParts.find(p => p.libraryId === libraryId);
        return part ? part.title : libraryId || 'Unknown Part';
    }

    function getPartByLibraryId(libraryId) {
        return videoParts.find(p => p.libraryId === libraryId);
    }

    function getPartsCount(partsIncluded) {
        if (!partsIncluded) return 0;
        return Object.keys(partsIncluded).length;
    }

    function getPartsArray(partsIncluded) {
        if (!partsIncluded) return [];
        return Object.keys(partsIncluded)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => ({ ...partsIncluded[key], _key: key }));
    }

    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function calculateChapterDuration(chapter) {
        if (!chapter.partsIncluded) return '0m';
        let totalSeconds = 0;
        for (const key in chapter.partsIncluded) {
            const part = chapter.partsIncluded[key];
            if (part.duration) totalSeconds += part.duration;
        }
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    function getPartsCountByType(chapter) {
        if (!chapter || !chapter.partsIncluded) return 'No parts';
        let videoCount = 0, fileCount = 0, testCount = 0;
        for (const key in chapter.partsIncluded) {
            const p = chapter.partsIncluded[key];
            if (p.type === 'VIDEO') videoCount++;
            else if (p.type === 'MATERIAL') fileCount++;
            else if (p.type === 'QUIZ') testCount++;
        }
        const parts = [];
        if (videoCount > 0) parts.push(`${videoCount} Video${videoCount > 1 ? 's' : ''}`);
        if (fileCount > 0) parts.push(`${fileCount} File${fileCount > 1 ? 's' : ''}`);
        if (testCount > 0) parts.push(`${testCount} Test${testCount > 1 ? 's' : ''}`);
        return parts.length > 0 ? parts.join(' | ') : 'No parts';
    }

    function getStarClass(rating, starIndex) {
        if (!rating) return 'fa-star-o';
        if (starIndex < Math.floor(rating)) return 'fa-star';
        if (starIndex === Math.floor(rating) && rating % 1 !== 0) return 'fa-star-half-o';
        return 'fa-star-o';
    }

    function getChapterCountForBundle(bundle) {
        if (!bundle || !bundle.modulesIncluded) return 0;
        return bundle.modulesIncluded.reduce((acc, m) => acc + (m.chapterIds ? m.chapterIds.length : 0), 0);
    }

    function getChaptersForModule(moduleKey, chapList) {
        const source = chapList || filteredChapters;
        return source.filter(ch => ch.moduleCode.toString() === moduleKey.toString());
    }

    // ===== Course bundle change =====

    function onCourseBundleChange(bundle) {
        setSelectedCourseBundle(bundle);
        setSelectedModule(null);
        setActiveTab('modules');
        setEditingChapterParts(false);
        setEditingChapterData(null);
        setOriginalChapterData(null);
        setExpandedModules({});
        setExpandedChapters({});
        if (bundle) {
            const mods = availableModules.filter(m =>
                bundle.modulesIncluded.some(bm => bm.moduleKey === m.moduleKey)
            );
            const chaps = chapters.filter(ch =>
                bundle.modulesIncluded.some(bm => bm.moduleKey === ch.moduleCode.toString())
            );
            setFilteredModules(mods);
            setFilteredChapters(chaps);
        } else {
            setFilteredModules([]);
            setFilteredChapters([]);
        }
    }

    // ===== Module/Chapter navigation =====

    function selectModule(module) {
        setSelectedModule(module);
        setActiveTab('chapters');
        setEditingChapterParts(false);
        setExpandedChapters({});
    }

    function backToModules() {
        setSelectedModule(null);
        setActiveTab('modules');
    }

    function toggleModule(moduleKey) {
        setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    }

    function toggleChapter(chapterId) {
        setExpandedChapters(prev => ({
            ...Object.fromEntries(Object.keys(prev).map(k => [k, false])),
            [chapterId]: !prev[chapterId],
        }));
    }

    // ===== Chapter parts editing =====

    function editChapter(chapter) {
        const copy = deepCopy(chapter);
        setEditingChapterData(copy);
        setOriginalChapterData(deepCopy(chapter));
        setEditingChapterParts(true);
        setActiveTab('parts');
        setContentLibrarySearch('');
    }

    function cancelChapterPartsEdit() {
        setEditingChapterParts(false);
        setEditingChapterData(null);
        setOriginalChapterData(null);
        setActiveTab('chapters');
    }

    function saveChapterParts() {
        if (!editingChapterData) return;
        const updatedChapters = chapters.map(ch =>
            ch.id === editingChapterData.id
                ? { ...ch, partsIncluded: editingChapterData.partsIncluded, lastUpdatedOn: Math.floor(Date.now() / 1000) }
                : ch
        );
        setChapters(updatedChapters);
        const chaps = updatedChapters.filter(ch =>
            selectedCourseBundle && selectedCourseBundle.modulesIncluded.some(bm => bm.moduleKey === ch.moduleCode.toString())
        );
        setFilteredChapters(chaps);
        showToast('success', 'Saved', 'Chapter parts updated successfully!');
        cancelChapterPartsEdit();
    }

    function hasChapterChanges() {
        if (!editingChapterData || !originalChapterData) return false;
        const curr = editingChapterData.partsIncluded || {};
        const orig = originalChapterData.partsIncluded || {};
        if (Object.keys(curr).length !== Object.keys(orig).length) return true;
        for (const key in curr) {
            if (!orig[key]) return true;
            if (curr[key].libraryId !== orig[key].libraryId || curr[key].type !== orig[key].type || curr[key].skipToNext !== orig[key].skipToNext) return true;
        }
        return false;
    }

    function isPartSelected(libraryId) {
        if (!editingChapterData || !editingChapterData.partsIncluded) return false;
        for (const key in editingChapterData.partsIncluded) {
            if (editingChapterData.partsIncluded[key].libraryId === libraryId) return true;
        }
        return false;
    }

    function getSelectedPartsCount() {
        if (!editingChapterData || !editingChapterData.partsIncluded) return 0;
        return Object.keys(editingChapterData.partsIncluded).length;
    }

    function togglePartSelection(part) {
        if (!editingChapterData) return;
        const parts = { ...editingChapterData.partsIncluded };
        if (isPartSelected(part.libraryId)) {
            for (const key in parts) {
                if (parts[key].libraryId === part.libraryId) delete parts[key];
            }
            // Reindex
            const reindexed = {};
            let idx = 1;
            for (const key of Object.keys(parts).sort((a, b) => parseInt(a) - parseInt(b))) {
                reindexed[idx++] = parts[key];
            }
            setEditingChapterData({ ...editingChapterData, partsIncluded: reindexed });
        } else {
            const nextKey = Object.keys(parts).length + 1;
            parts[nextKey] = { type: part.type, libraryId: part.libraryId, skipToNext: true, duration: part.duration || 0 };
            setEditingChapterData({ ...editingChapterData, partsIncluded: parts });
        }
    }

    function removePartFromChapter(partKey) {
        if (!editingChapterData) return;
        const parts = { ...editingChapterData.partsIncluded };
        delete parts[partKey];
        const reindexed = {};
        let idx = 1;
        for (const key of Object.keys(parts).sort((a, b) => parseInt(a) - parseInt(b))) {
            reindexed[idx++] = parts[key];
        }
        setEditingChapterData({ ...editingChapterData, partsIncluded: reindexed });
    }

    function updateSkipToNext(partKey, value) {
        if (!editingChapterData) return;
        const parts = { ...editingChapterData.partsIncluded };
        parts[partKey] = { ...parts[partKey], skipToNext: value };
        setEditingChapterData({ ...editingChapterData, partsIncluded: parts });
    }

    // ===== Drag and drop =====

    function handleDragStart(e, index) {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnter(e, index) {
        e.preventDefault();
        if (index !== draggedIndex) setDragOverIndex(index);
    }

    function handleDragLeave() {
        // leave handled in drop
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (index !== draggedIndex) setDragOverIndex(index);
        return false;
    }

    function handleDrop(e, dropIndex) {
        e.stopPropagation();
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const partsArr = getPartsArray(editingChapterData.partsIncluded);
        const item = partsArr[draggedIndex];
        partsArr.splice(draggedIndex, 1);
        partsArr.splice(dropIndex, 0, item);
        const newParts = {};
        partsArr.forEach((p, i) => {
            const { _key, ...partData } = p;
            newParts[i + 1] = partData;
        });
        setEditingChapterData({ ...editingChapterData, partsIncluded: newParts });
        setDraggedIndex(null);
        setDragOverIndex(null);
        return false;
    }

    function handleDragEnd() {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }

    // ===== Teacher/Instructor =====

    function showTeacherProfile(chapter) {
        if (chapter && chapter.teacher) {
            setSelectedTeacherProfile(chapter.teacher);
            setCurrentChapterForTeacherChange(chapter);
            setShowTeacherModal(true);
        }
    }

    function assignInstructorToChapter(chapter) {
        setCurrentChapterForTeacherChange(chapter);
        setSelectedNewInstructor(null);
        setInstructorSearchQuery('');
        setShowChangeInstructorModal(true);
    }

    function openChangeInstructorModal() {
        setShowTeacherModal(false);
        setSelectedNewInstructor(null);
        setInstructorSearchQuery('');
        setTimeout(() => setShowChangeInstructorModal(true), 50);
    }

    function confirmInstructorChange() {
        if (!selectedNewInstructor || !currentChapterForTeacherChange) return;
        const newTeacher = {
            name: selectedNewInstructor.name,
            photo: selectedNewInstructor.photo || 'assets/img/default_user.png',
            about: selectedNewInstructor.brief,
            specialization: selectedNewInstructor.expertSubject,
            experience: selectedNewInstructor.experience + '+ years',
            education: selectedNewInstructor.qualifications,
            rating: selectedNewInstructor.rating || 4.5,
            studentsCount: 0,
        };
        const chapterId = currentChapterForTeacherChange.id;
        const updatedChapters = chapters.map(ch =>
            ch.id === chapterId ? { ...ch, teacher: newTeacher } : ch
        );
        setChapters(updatedChapters);
        setFilteredChapters(updatedChapters.filter(ch =>
            selectedCourseBundle && selectedCourseBundle.modulesIncluded.some(bm => bm.moduleKey === ch.moduleCode.toString())
        ));
        setShowChangeInstructorModal(false);
        setSelectedNewInstructor(null);
        setCurrentChapterForTeacherChange(null);
        showToast('success', 'Updated', `Instructor changed to ${newTeacher.name}`);
    }

    // ===== Video modal =====

    function openVideoModal(part, chapter, partNumber) {
        setSelectedVideo({
            title: getVideoTitle(part.libraryId),
            libraryId: part.libraryId,
            partNumber,
            chapterTitle: chapter.title,
            moduleCode: chapter.moduleCode,
            type: part.type,
            skipToNext: part.skipToNext,
        });
        setShowVideoModal(true);
    }

    // ===== Video preview modal =====

    function showVideoPreview(part, e) {
        if (e) e.stopPropagation();
        if (part.type !== 'VIDEO') return;
        setVideoPreviewPart(part);
        setShowVideoPreviewModal(true);
    }

    // ===== Link Quiz =====

    function openLinkQuizModal() {
        setSelectedQuizForLink(null);
        setQuizSearchQuery('');
        setShowLinkQuizModal(true);
    }

    function linkQuizToChapter() {
        if (!selectedQuizForLink || !editingChapterData) return;
        const parts = { ...editingChapterData.partsIncluded };
        const nextKey = Object.keys(parts).length + 1;
        parts[nextKey] = {
            type: 'QUIZ',
            libraryId: 'QUIZ_' + selectedQuizForLink.id,
            skipToNext: false,
            duration: 0,
            title: selectedQuizForLink.title,
        };
        setEditingChapterData({ ...editingChapterData, partsIncluded: parts });
        showToast('success', 'Linked', `Quiz "${selectedQuizForLink.title}" linked successfully!`);
        setShowLinkQuizModal(false);
        setSelectedQuizForLink(null);
    }

    // ===== Attach Material =====

    function openAttachMaterialModal() {
        setMaterialUpload({ title: '', file: null, fileName: '', brief: '' });
        setShowAttachMaterialModal(true);
    }

    function handleMaterialFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            showToast('error', 'Error', 'Please select a PDF file');
            return;
        }
        setMaterialUpload(prev => ({
            ...prev,
            file,
            fileName: file.name,
            title: prev.title || file.name.replace('.pdf', ''),
        }));
    }

    function attachMaterialToChapter() {
        if (!materialUpload.file || !materialUpload.title || !editingChapterData) {
            showToast('error', 'Error', 'Please provide title and select a PDF file');
            return;
        }
        const parts = { ...editingChapterData.partsIncluded };
        const materialId = 'MATERIAL_' + Date.now();
        const nextKey = Object.keys(parts).length + 1;
        parts[nextKey] = {
            type: 'MATERIAL',
            libraryId: materialId,
            skipToNext: false,
            duration: 0,
            title: materialUpload.title,
            fileName: materialUpload.fileName,
            brief: materialUpload.brief || '',
        };
        setEditingChapterData({ ...editingChapterData, partsIncluded: parts });
        showToast('success', 'Attached', `Material "${materialUpload.title}" attached successfully!`);
        setShowAttachMaterialModal(false);
        setMaterialUpload({ title: '', file: null, fileName: '', brief: '' });
    }

    // ===== New Bundle creation =====

    function saveCourseBundle() {
        if (!newBundle.title || !newBundle.bundleCode || !newBundle.syllabusCode) {
            showToast('error', 'Error', 'Please fill in all required fields.');
            return;
        }
        const syllabus = uniqueSyllabi.find(s => s.code === newBundle.syllabusCode);
        if (!syllabus) {
            showToast('error', 'Error', 'Invalid syllabus selected.');
            return;
        }

        // Build modulesIncluded and create chapters
        const newChapters = [...chapters];
        const modulesIncluded = [];
        let chapterIdCounter = Math.max(...chapters.map(c => c.id), 200) + 1;
        const timestamp = Math.floor(Date.now() / 1000);

        syllabus.segments.forEach(segment => {
            segment.modules.forEach(syllabusModule => {
                const moduleKey = syllabusModule.id.toString();
                const chapterIds = [];
                syllabusModule.chapters.forEach(syllabusChapter => {
                    const newChap = {
                        id: chapterIdCounter++,
                        moduleCode: moduleKey,
                        code: syllabusChapter.chapterNumber,
                        title: syllabusChapter.title,
                        label: `${syllabusModule.moduleName} - Chapter ${syllabusChapter.chapterNumber}: ${syllabusChapter.title}`,
                        partsIncluded: {},
                        status: 1,
                        teacher: { name: 'Unassigned', photo: 'assets/img/default_user.png', rating: 0, studentsCount: 0, specialization: 'To be determined', experience: 'N/A' },
                    };
                    newChapters.push(newChap);
                    chapterIds.push(newChap.id);
                });
                modulesIncluded.push({ moduleKey, title: syllabusModule.moduleName, chapterIds, disabledCourseIds: [] });
            });
        });

        const newBundleObj = {
            id: Date.now(),
            displayKey: generateUUID(),
            title: newBundle.title,
            bundleCode: newBundle.bundleCode,
            modulesIncluded,
            active: 1,
        };

        const updatedBundles = [...bundles, newBundleObj];
        setBundles(updatedBundles);
        setChapters(newChapters);
        setShowBundleModal(false);
        setNewBundle({ title: '', bundleCode: '', syllabusCode: '' });
        onCourseBundleChangeWithChapters(newBundleObj, newChapters);
        showToast('success', 'Created', 'Course bundle created successfully! Modules and chapters initialized from syllabus.');
    }

    function onCourseBundleChangeWithChapters(bundle, chapList) {
        setSelectedCourseBundle(bundle);
        setSelectedModule(null);
        setActiveTab('modules');
        setEditingChapterParts(false);
        setEditingChapterData(null);
        setOriginalChapterData(null);
        setExpandedModules({});
        setExpandedChapters({});
        if (bundle) {
            const mods = availableModules.filter(m =>
                bundle.modulesIncluded.some(bm => bm.moduleKey === m.moduleKey)
            );
            const chaps = chapList.filter(ch =>
                bundle.modulesIncluded.some(bm => bm.moduleKey === ch.moduleCode.toString())
            );
            setFilteredModules(mods);
            setFilteredChapters(chaps);
        }
    }

    // ===== Content library filter =====

    function filterContentLibrary(part) {
        if (part.type !== 'VIDEO') return false;
        if (!contentLibrarySearch) return true;
        const s = contentLibrarySearch.toLowerCase();
        return (
            part.title.toLowerCase().includes(s) ||
            part.libraryId.toLowerCase().includes(s)
        );
    }

    // ===== Select course modal =====

    function selectCourseBundleFromModal(bundle) {
        onCourseBundleChange(bundle);
        setShowSelectCourseModal(false);
    }

    // ===== Render helpers =====

    const visibleVideoParts = videoParts.filter(filterContentLibrary);

    const chaptersForSelectedModule = selectedModule
        ? filteredChapters.filter(ch => ch.moduleCode.toString() === selectedModule.moduleKey.toString())
        : [];

    const filteredBundles = bundles.filter(b => {
        if (!courseBundleSearchQuery) return true;
        const s = courseBundleSearchQuery.toLowerCase();
        return b.title.toLowerCase().includes(s) || (b.bundleCode && b.bundleCode.toLowerCase().includes(s));
    });

    const filteredInstructors = availableInstructors.filter(i => {
        if (!instructorSearchQuery) return true;
        const s = instructorSearchQuery.toLowerCase();
        return i.name.toLowerCase().includes(s) || i.expertSubject.toLowerCase().includes(s);
    });

    // ===== Skeleton =====

    if (loading) {
        return (
            <div className="course-management-page-wrapper">
                <div className="course-bundle-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #008ba3 100%)', padding: '25px 30px', marginBottom: 25, borderRadius: 8 }}>
                    <div className="skeleton" style={{ height: 40, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.2)' }}></div>
                </div>
                <div className="panel panel-default">
                    <div className="panel-body">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 70, marginBottom: 15, borderRadius: 8, background: '#f0f0f0' }}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ===== Main render =====

    return (
        <div className="course-management-page-wrapper">
            <ToastRegion toasts={toasts} setToasts={setToasts} />

            {/* Header */}
            <div className="course-bundle-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="welcome-section">
                            {!selectedCourseBundle ? (
                                <h2 className="welcome-title"><i className="ti ti-layers"></i> Course Management</h2>
                            ) : (
                                <h2 className="welcome-title"><i className="ti ti-book"></i> {selectedCourseBundle.title}</h2>
                            )}
                            {selectedCourseBundle && (
                                <p className="welcome-subtitle" style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: 4, display: 'inline-block', margin: 0 }}>
                                    <span style={{ fontWeight: 500 }}><i className="ti ti-folder" style={{ marginRight: 4 }}></i>{filteredModules.length} Modules</span>
                                    <span style={{ margin: '0 12px', opacity: 0.5 }}>|</span>
                                    <span style={{ fontWeight: 500 }}><i className="ti ti-list" style={{ marginRight: 4 }}></i>{filteredChapters.length} Chapters</span>
                                    {selectedCourseBundle.bundleCode && (
                                        <>
                                            <span style={{ margin: '0 12px', opacity: 0.5 }}>|</span>
                                            <span style={{ fontWeight: 400, opacity: 0.85 }}><i className="ti ti-tag" style={{ marginRight: 4 }}></i>{selectedCourseBundle.bundleCode}</span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-primary" style={{ marginRight: 10 }} onClick={() => { setCourseBundleSearchQuery(''); setShowSelectCourseModal(true); }}>
                            <i className="ti ti-layers"></i> Select Course
                        </button>
                        <button className="btn" style={{ background: '#ffb706', color: '#006073', border: 'none', fontWeight: 600 }} onClick={() => { setNewBundle({ title: '', bundleCode: '', syllabusCode: '' }); setShowBundleModal(true); }}>
                            <i className="ti ti-plus"></i> New Bundle
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            {selectedCourseBundle && (
                <div className="row">
                    <div className="col-md-12">
                        <div className="panel panel-default">
                            <div className="panel-body">
                                {/* Tabs */}
                                <ul className="nav nav-tabs" role="tablist">
                                    <li role="presentation" className={!editingChapterParts && activeTab !== 'chapters' ? 'active' : (editingChapterParts ? 'disabled' : '')}>
                                        <a href="#" role="tab" onClick={e => { e.preventDefault(); if (!editingChapterParts) { setActiveTab('modules'); } }}>
                                            <i className="ti ti-folder" style={{ marginRight: 10 }}></i>
                                            {!selectedModule ? 'Modules' : `Module: ${selectedModule.title}`}
                                        </a>
                                    </li>
                                    {selectedModule && (
                                        <li role="presentation" className={!editingChapterParts && activeTab === 'chapters' ? 'active' : (editingChapterParts ? 'disabled' : '')}>
                                            <a href="#" role="tab" onClick={e => { e.preventDefault(); if (!editingChapterParts) setActiveTab('chapters'); }}>
                                                <i className="ti ti-book" style={{ marginRight: 10 }}></i>
                                                {!editingChapterData ? 'Chapters' : `Chapter: ${editingChapterData.code}. ${editingChapterData.title}`}
                                            </a>
                                        </li>
                                    )}
                                    {editingChapterParts && (
                                        <li role="presentation" className="active">
                                            <a href="#" role="tab" onClick={e => e.preventDefault()}>
                                                <i className="ti ti-video-camera" style={{ marginRight: 10 }}></i>Parts
                                            </a>
                                        </li>
                                    )}
                                </ul>

                                <div className="tab-content">
                                    {/* === MODULES TAB === */}
                                    {activeTab === 'modules' && !editingChapterParts && (
                                        <div className="tab-pane active">
                                            {filteredModules.length === 0 ? (
                                                <div className="alert alert-warning"><i className="ti ti-info"></i> No modules found for this course bundle.</div>
                                            ) : (
                                                filteredModules.map(module => (
                                                    <div key={module.moduleKey} className={`module-card${selectedModule && selectedModule.moduleKey === module.moduleKey ? ' selected' : ''}`}>
                                                        <div
                                                            className={`module-header${expandedModules[module.moduleKey] ? ' expanded' : ''}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => toggleModule(module.moduleKey)}
                                                        >
                                                            <div className="row">
                                                                <div className="col-md-8">
                                                                    <div className="module-info">
                                                                        <div className="expand-indicator">
                                                                            <i className={`fa ${expandedModules[module.moduleKey] ? 'fa-folder-open-o' : 'fa-folder-o'}`}></i>
                                                                        </div>
                                                                        <div className="module-details">
                                                                            <h3 className="module-title">
                                                                                {module.title}
                                                                                {selectedModule && selectedModule.moduleKey === module.moduleKey && (
                                                                                    <span className="badge badge-success" style={{ marginLeft: 8 }}>Selected</span>
                                                                                )}
                                                                            </h3>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4 text-right">
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={e => { e.stopPropagation(); selectModule(module); }}
                                                                    >
                                                                        <i className="ti ti-book"></i> Modify Chapters
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {expandedModules[module.moduleKey] && (
                                                            <div className={`module-content${expandedModules[module.moduleKey] ? ' expanded' : ''}`}>
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
                                                                                    {getChaptersForModule(module.moduleKey).length === 0 ? (
                                                                                        <tr>
                                                                                            <td colSpan="6" className="text-center text-muted">
                                                                                                <i className="ti ti-info"></i> No chapters assigned to this module yet
                                                                                            </td>
                                                                                        </tr>
                                                                                    ) : (
                                                                                        getChaptersForModule(module.moduleKey).map(chapter => (
                                                                                            <tr key={chapter.id}>
                                                                                                <td><strong>{chapter.code}</strong></td>
                                                                                                <td>{chapter.title}</td>
                                                                                                <td>{getPartsCountByType(chapter)}</td>
                                                                                                <td>{calculateChapterDuration(chapter)}</td>
                                                                                                <td>
                                                                                                    {chapter.teacher && (
                                                                                                        <div className="teacher-info-compact">
                                                                                                            <Avatar src={chapter.teacher.photo} name={chapter.teacher.name} className="teacher-photo-tiny" placeholderClassName="teacher-photo-tiny placeholder" />
                                                                                                            <span>{chapter.teacher.name}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td>
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
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* === CHAPTERS TAB === */}
                                    {activeTab === 'chapters' && !editingChapterParts && (
                                        <div className="tab-pane active">
                                            {!selectedModule ? (
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9f9f9', borderRadius: 8, border: '2px dashed #ddd' }}>
                                                            <i className="ti ti-info-alt" style={{ fontSize: 48, color: '#999', marginBottom: 20 }}></i>
                                                            <h4 style={{ color: '#666', marginBottom: 10 }}>No Module Selected</h4>
                                                            <p style={{ color: '#999' }}>Please select a module from the <strong>Modules</strong> tab to view its chapters.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="row">
                                                        <div className="col-md-12" style={{ marginBottom: 20 }}>
                                                            <button className="btn btn-default" onClick={backToModules}>
                                                                <i className="ti ti-arrow-left"></i> Back to Modules
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {chaptersForSelectedModule.length === 0 ? (
                                                        <div className="empty-chapters">
                                                            <div className="empty-icon"><i className="ti ti-book-open"></i></div>
                                                            <h4>No Chapters in {selectedModule.title}</h4>
                                                            <p>This module doesn't have any chapters yet.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                {chaptersForSelectedModule.map(chapter => (
                                                                    <div key={chapter.id} className="chapter-item">
                                                                        <div
                                                                            className={`chapter-header${expandedChapters[chapter.id] ? ' expanded' : ''}`}
                                                                            onClick={() => toggleChapter(chapter.id)}
                                                                        >
                                                                            <div className="row">
                                                                                <div className="col-md-8">
                                                                                    <div className="chapter-info">
                                                                                        <div className="expand-indicator">
                                                                                            <i className={`fa ${expandedChapters[chapter.id] ? 'fa-folder-open-o' : 'fa-folder-o'}`}></i>
                                                                                        </div>
                                                                                        <div className="chapter-details">
                                                                                            <h4 className="chapter-title">{chapter.title}</h4>
                                                                                            <p className="chapter-meta">
                                                                                                <span><b>Chapter {chapter.code}</b> | {getPartsCount(chapter.partsIncluded)} parts<i className="fa fa-circle separator-dot" aria-hidden="true"></i>{calculateChapterDuration(chapter)}</span>
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    {chapter.teacher && chapter.teacher.name && chapter.teacher.name !== 'Unassigned' ? (
                                                                                        <div
                                                                                            className="teacher-info-simple"
                                                                                            style={{ cursor: 'pointer' }}
                                                                                            onClick={e => { e.stopPropagation(); showTeacherProfile(chapter); }}
                                                                                        >
                                                                                            <Avatar
                                                                                                src={chapter.teacher.photo}
                                                                                                name={chapter.teacher.name}
                                                                                                className="teacher-photo-small"
                                                                                                placeholderClassName="teacher-photo-small placeholder"
                                                                                            />
                                                                                            <div className="teacher-details-simple">
                                                                                                <span className="teacher-name-simple">{chapter.teacher.name}</span>
                                                                                                <div className="teacher-rating-simple">
                                                                                                    <div className="star-rating">
                                                                                                        {[0, 1, 2, 3, 4].map(i => (
                                                                                                            <i key={i} className={`fa ${getStarClass(chapter.teacher.rating, i)}`}></i>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                    <span className="rating-value">({chapter.teacher.rating})</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div
                                                                                            className="teacher-not-mapped"
                                                                                            onClick={e => { e.stopPropagation(); assignInstructorToChapter(chapter); }}
                                                                                            style={{ cursor: 'pointer', padding: '8px 10px', border: '2px dashed #ccc', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, background: '#f9f9f9', transition: 'all 0.3s ease' }}
                                                                                        >
                                                                                            <i className="ti ti-user" style={{ fontSize: 20, color: '#999' }}></i>
                                                                                            <div style={{ textAlign: 'left', flex: 1 }}>
                                                                                                <div style={{ color: '#666', fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>Not Mapped</div>
                                                                                                <div style={{ color: '#999', fontSize: 10, lineHeight: 1.2 }}>Click to assign</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="col-md-1 text-right">
                                                                                    <div className="chapter-actions">
                                                                                        <button
                                                                                            className="btn btn-primary btn-sm"
                                                                                            onClick={e => { e.stopPropagation(); editChapter(chapter); }}
                                                                                        >
                                                                                            <i className="ti ti-pencil"></i> Edit
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {expandedChapters[chapter.id] && (
                                                                            <div className="parts-list expanded">
                                                                                {getPartsCount(chapter.partsIncluded) > 0 ? (
                                                                                    <div style={{ padding: 20, background: '#f8f9fa' }}>
                                                                                        <h5 style={{ margin: '0 0 15px 0', color: '#006073', fontWeight: 600 }}>
                                                                                            <i className="ti ti-layers"></i> Parts Included in This Chapter ({getPartsCount(chapter.partsIncluded)})
                                                                                        </h5>
                                                                                        <div className="list-group">
                                                                                            {getPartsArray(chapter.partsIncluded).map((part, idx) => (
                                                                                                <div
                                                                                                    key={idx}
                                                                                                    className="list-group-item"
                                                                                                    style={{ marginBottom: 10, borderRadius: 6, cursor: 'pointer' }}
                                                                                                    onClick={() => openVideoModal(part, chapter, idx + 1)}
                                                                                                >
                                                                                                    <div className="row">
                                                                                                        <div className="col-md-1">
                                                                                                            <div className="part-number-badge-large">{idx + 1}</div>
                                                                                                        </div>
                                                                                                        <div className="col-md-1">
                                                                                                            <div className="part-type-icon">
                                                                                                                <i className={`ti ${part.type === 'VIDEO' ? 'ti-video-camera' : part.type === 'MATERIAL' ? 'ti-file' : 'ti-clipboard'}`} style={{ fontSize: 24 }}></i>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="col-md-6">
                                                                                                            <div><strong>{part.title || getVideoTitle(part.libraryId)}</strong></div>
                                                                                                            <div className="text-muted" style={{ fontSize: 12 }}>
                                                                                                                <span className={`badge badge-${part.type === 'VIDEO' ? 'primary' : part.type === 'MATERIAL' ? 'info' : 'secondary'}`}>{part.type}</span>
                                                                                                                {part.type === 'VIDEO' && part.duration > 0 && (
                                                                                                                    <span style={{ marginLeft: 10 }}><i className="ti ti-time"></i> {formatDuration(part.duration)}</span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="col-md-4 text-right">
                                                                                                            {part.skipToNext ? (
                                                                                                                <span className="badge badge-success"><i className="ti ti-forward"></i> Skip to Next Enabled</span>
                                                                                                            ) : (
                                                                                                                <span className="badge badge-secondary"><i className="ti ti-control-pause"></i> No Auto-Skip</span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="empty-parts">
                                                                                        <i className="ti ti-video-camera-off"></i>
                                                                                        <h6>No Parts Added</h6>
                                                                                        <p>This chapter doesn't have any parts assigned yet.</p>
                                                                                        <button className="btn btn-primary btn-sm" onClick={() => editChapter(chapter)}>
                                                                                            <i className="ti ti-plus"></i> Add Parts
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* === PARTS TAB === */}
                                    {activeTab === 'parts' && editingChapterParts && editingChapterData && (
                                        <div className="tab-pane active">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="panel panel-default">
                                                        <div className="panel-heading" style={{ backgroundColor: '#006073', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <h4 className="panel-title" style={{ margin: 0 }}>
                                                                <i className="ti ti-layers"></i> Chapter: {editingChapterData.code}. {editingChapterData.title}
                                                            </h4>
                                                            <div>
                                                                <button className="btn btn-success btn-sm" onClick={saveChapterParts} disabled={!hasChapterChanges()} style={{ marginRight: 8 }}>
                                                                    <i className="ti ti-save"></i> Save
                                                                </button>
                                                                <button className="btn btn-default btn-sm" onClick={cancelChapterPartsEdit}>
                                                                    <i className="ti ti-close"></i> Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="panel-body">
                                                            {/* Selected parts list */}
                                                            <div className="form-group">
                                                                <label style={{ fontSize: 16, fontWeight: 'bold', color: '#006073' }}>
                                                                    <i className="ti ti-check-box"></i> Parts Included in This Chapter ({getSelectedPartsCount()})
                                                                    <span style={{ fontSize: 12, color: '#999', fontWeight: 'normal', marginLeft: 10 }}>
                                                                        <i className="ti ti-hand-drag"></i> Drag to reorder
                                                                    </span>
                                                                </label>
                                                                {getSelectedPartsCount() === 0 ? (
                                                                    <div className="alert alert-info">
                                                                        <i className="ti ti-info-alt"></i> No parts added yet. Select parts from the "Add More Parts" section below.
                                                                    </div>
                                                                ) : (
                                                                    <div className="list-group" style={{ position: 'relative' }}>
                                                                        {getPartsArray(editingChapterData.partsIncluded).map((part, idx) => (
                                                                            <div
                                                                                key={part._key}
                                                                                className={`list-group-item drag-item${draggedIndex === idx ? ' dragging' : ''}${dragOverIndex === idx && draggedIndex !== idx ? ' drag-over' : ''}`}
                                                                                draggable
                                                                                data-index={idx}
                                                                                onDragStart={e => handleDragStart(e, idx)}
                                                                                onDragEnter={e => handleDragEnter(e, idx)}
                                                                                onDragLeave={handleDragLeave}
                                                                                onDragOver={e => handleDragOver(e, idx)}
                                                                                onDrop={e => handleDrop(e, idx)}
                                                                                onDragEnd={handleDragEnd}
                                                                                style={{ transition: 'all 0.3s ease', position: 'relative' }}
                                                                            >
                                                                                <div className="row">
                                                                                    <div className="col-md-1">
                                                                                        <div className="part-number-badge-large">{idx + 1}</div>
                                                                                    </div>
                                                                                    <div className="col-md-1">
                                                                                        <div className="part-type-icon">
                                                                                            <i className={`ti ${part.type === 'VIDEO' ? 'ti-video-camera' : part.type === 'MATERIAL' ? 'ti-file' : 'ti-clipboard'}`} style={{ fontSize: 24 }}></i>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-md-5">
                                                                                        <div><strong>{part.title || getVideoTitle(part.libraryId)}</strong></div>
                                                                                        <div className="text-muted" style={{ fontSize: 12 }}>
                                                                                            <span className={`badge badge-${part.type === 'VIDEO' ? 'primary' : part.type === 'MATERIAL' ? 'info' : 'secondary'}`}>{part.type}</span>
                                                                                            {part.type === 'VIDEO' && part.duration > 0 && (
                                                                                                <span style={{ marginLeft: 10 }}><i className="ti ti-time"></i> {formatDuration(part.duration)}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-md-3">
                                                                                        <label className="checkbox-inline">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!part.skipToNext}
                                                                                                onChange={e => updateSkipToNext(part._key, e.target.checked)}
                                                                                            /> Skip to Next
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="col-md-2 text-right">
                                                                                        <button
                                                                                            className="btn btn-xs btn-danger"
                                                                                            onClick={e => { e.stopPropagation(); removePartFromChapter(part._key); }}
                                                                                        >
                                                                                            <i className="ti ti-trash"></i> Remove
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <hr style={{ margin: '30px 0', borderTop: '2px solid #ddd' }} />

                                                            {/* Add More Parts */}
                                                            <div className="form-group">
                                                                <label style={{ fontSize: 16, fontWeight: 'bold', color: '#666' }}>
                                                                    <i className="ti ti-plus"></i> Add More Parts from Library
                                                                </label>
                                                                <p className="text-muted" style={{ marginBottom: 15 }}>
                                                                    Click on any video below to add it to this chapter, or use the buttons to link quizzes and attach materials.
                                                                </p>

                                                                <div className="row" style={{ marginBottom: 20 }}>
                                                                    <div className="col-md-12">
                                                                        <button className="btn btn-primary" onClick={openLinkQuizModal} style={{ marginRight: 10 }}>
                                                                            <i className="ti ti-clipboard"></i> Link Quiz
                                                                        </button>
                                                                        <button className="btn btn-success" onClick={openAttachMaterialModal}>
                                                                            <i className="ti ti-file"></i> Attach Material
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="row" style={{ marginBottom: 20 }}>
                                                                    <div className="col-md-6">
                                                                        <div className="input-group">
                                                                            <span className="input-group-addon"><i className="ti ti-search"></i></span>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                placeholder="Search videos by title or library ID..."
                                                                                value={contentLibrarySearch}
                                                                                onChange={e => setContentLibrarySearch(e.target.value)}
                                                                            />
                                                                            {contentLibrarySearch && (
                                                                                <span className="input-group-btn">
                                                                                    <button className="btn btn-default" type="button" onClick={() => setContentLibrarySearch('')}>
                                                                                        <i className="ti ti-close"></i>
                                                                                    </button>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-6 text-right">
                                                                        <span className="text-muted" style={{ lineHeight: '34px' }}>
                                                                            Showing {visibleVideoParts.length} videos
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="parts-grid">
                                                                    {visibleVideoParts.map(part => (
                                                                        <div
                                                                            key={part.libraryId}
                                                                            className={`part-card selectable${isPartSelected(part.libraryId) ? ' selected' : ''}`}
                                                                        >
                                                                            <div className="part-header">
                                                                                <div className={`part-type-badge type-${part.type.toLowerCase()}`}>{part.type}</div>
                                                                                <div className="part-actions">
                                                                                    {part.type === 'VIDEO' && part.source && (
                                                                                        <button className="btn btn-xs btn-default" onClick={e => showVideoPreview(part, e)} title="Preview Video" style={{ marginRight: 5 }}>
                                                                                            <i className="ti ti-eye"></i>
                                                                                        </button>
                                                                                    )}
                                                                                    <button
                                                                                        className={`btn btn-xs ${isPartSelected(part.libraryId) ? 'btn-success' : 'btn-primary'}`}
                                                                                        onClick={e => { e.stopPropagation(); togglePartSelection(part); }}
                                                                                        title={isPartSelected(part.libraryId) ? 'Remove from Parts' : 'Add to Parts'}
                                                                                    >
                                                                                        {isPartSelected(part.libraryId)
                                                                                            ? 'Added'
                                                                                            : <><i className="fa fa-plus"></i> Add</>}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div
                                                                                className="part-content"
                                                                                onClick={e => part.type === 'VIDEO' && showVideoPreview(part, e)}
                                                                                style={{ cursor: part.type === 'VIDEO' ? 'pointer' : 'default' }}
                                                                            >
                                                                                <div className="part-thumbnail">
                                                                                    <i className="ti ti-video-camera"></i>
                                                                                </div>
                                                                                <div className="part-info">
                                                                                    <h6 className="part-title">{part.title}</h6>
                                                                                    <div className="part-meta">
                                                                                        <span><i className="ti ti-time"></i> {formatDuration(part.duration)}</span>
                                                                                    </div>
                                                                                    {part.brief && (
                                                                                        <div className="part-brief">
                                                                                            <small className="text-muted">{part.brief}</small>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {isPartSelected(part.libraryId) && (
                                                                                <div className="selection-indicator">
                                                                                    <i className="ti ti-check-box"></i>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {visibleVideoParts.length === 0 && (
                                                                    <div style={{ textAlign: 'center', padding: 40, background: '#f8f9fa', borderRadius: 8 }}>
                                                                        <i className="ti ti-video-camera" style={{ fontSize: 48, color: '#dee2e6' }}></i>
                                                                        <p className="text-muted" style={{ marginTop: 15 }}>No videos found matching your search.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
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
            )}

            {/* ========================= MODALS ========================= */}

            {/* Course Bundle Creation Modal */}
            {showBundleModal && (
                <div className="crispr-modal-backdrop active" onClick={() => setShowBundleModal(false)}>
                    <div className="crispr-modal-dialog" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
                            <h3><i className="ti ti-book-open"></i> Create New Course Bundle</h3>
                            <button className="crispr-modal-close" onClick={() => setShowBundleModal(false)}>
                                <i className="ti ti-close"></i>
                            </button>
                        </div>
                        <div className="crispr-modal-body cmb-form-body">
                            <style>{`
                                .cmb-form-body { display: flex; flex-direction: column; gap: 20px; }
                                .cmb-fld { display: flex; flex-direction: column; gap: 6px; }
                                .cmb-fld-label { font-size: 13px; font-weight: 600; color: #334155; }
                                .cmb-fld-label .req { color: #b42318; }
                                .cmb-input { padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; color: var(--ink); background: #fff; outline: none; width: 100%; }
                                .cmb-help { font-size: 12px; color: var(--muted); }
                            `}</style>

                            <div className="cmb-fld">
                                <label className="cmb-fld-label">Bundle Title <span className="req">*</span></label>
                                <input type="text" className="cmb-input" placeholder="Enter course bundle title" value={newBundle.title} onChange={e => setNewBundle({ ...newBundle, title: e.target.value })} />
                                <small className="cmb-help">Enter a descriptive title for your course bundle</small>
                            </div>

                            <div className="cmb-fld">
                                <label className="cmb-fld-label">Bundle Code <span className="req">*</span></label>
                                <input type="text" className="cmb-input" placeholder="Enter bundle code (e.g., IAT-2024)" value={newBundle.bundleCode} onChange={e => setNewBundle({ ...newBundle, bundleCode: e.target.value })} />
                                <small className="cmb-help">Unique identifier for the course bundle</small>
                            </div>

                            <div className="cmb-fld">
                                <label className="cmb-fld-label">Select Syllabus <span className="req">*</span></label>
                                <select className="cmb-input" value={newBundle.syllabusCode} onChange={e => setNewBundle({ ...newBundle, syllabusCode: e.target.value })}>
                                    <option value="">-- Select a Syllabus --</option>
                                    {uniqueSyllabi.map(syl => (
                                        <option key={syl.code} value={syl.code}>{syl.name}</option>
                                    ))}
                                </select>
                                <small className="cmb-help">Select a syllabus to initialize modules and chapters.</small>
                            </div>

                            {newBundle.syllabusCode && (
                                <div className="alert alert-info" style={{ margin: 0 }}>
                                    <i className="ti ti-info-alt"></i> <strong>Syllabus Selected:</strong> {uniqueSyllabi.find(s => s.code === newBundle.syllabusCode)?.name}
                                    <br /><small>Modules will be organized by segments for easier classification</small>
                                </div>
                            )}
                        </div>
                        <div className="crispr-modal-footer">
                            <button type="button" className="btn btn-default" onClick={() => setShowBundleModal(false)}><i className="ti ti-close"></i> Cancel</button>
                            <button type="button" className="btn btn-success" onClick={saveCourseBundle} disabled={!newBundle.title || !newBundle.bundleCode || !newBundle.syllabusCode}>
                                <i className="ti ti-check"></i> Create Course Bundle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Course Modal */}
            {showSelectCourseModal && (
                <div className="cmp-modal-backdrop" onClick={() => setShowSelectCourseModal(false)}>
                    <div className="cmp-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: '#006073', color: 'white' }}>
                                <button type="button" className="close" style={{ color: 'white', opacity: 0.8 }} onClick={() => setShowSelectCourseModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-layers"></i> Select Course Bundle</h4>
                            </div>
                            <div className="modal-body">
                                <div className="row" style={{ marginBottom: 20 }}>
                                    <div className="col-md-12">
                                        <div className="input-group">
                                            <span className="input-group-addon"><i className="ti ti-search"></i></span>
                                            <input type="text" className="form-control" placeholder="Search course bundles by title or code..." value={courseBundleSearchQuery} onChange={e => setCourseBundleSearchQuery(e.target.value)} />
                                            {courseBundleSearchQuery && (
                                                <span className="input-group-btn">
                                                    <button className="btn btn-default" onClick={() => setCourseBundleSearchQuery('')}><i className="ti ti-close"></i></button>
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
                                                    {filteredBundles.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center" style={{ padding: '60px 20px', color: '#999' }}>
                                                                <i className="ti ti-search" style={{ fontSize: 56, display: 'block', marginBottom: 15, opacity: 0.5 }}></i>
                                                                <p style={{ fontSize: 16 }}>No course bundles found matching your search</p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredBundles.map(bundle => (
                                                            <tr
                                                                key={bundle.id}
                                                                onClick={() => selectCourseBundleFromModal(bundle)}
                                                                style={{ cursor: 'pointer', transition: 'all 0.2s ease', ...(selectedCourseBundle && selectedCourseBundle.id === bundle.id ? { background: '#28a745', color: 'white' } : {}) }}
                                                            >
                                                                <td style={{ verticalAlign: 'middle' }}>
                                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #006073 0%, #008ba3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                                                                        <i className="ti ti-book"></i>
                                                                    </div>
                                                                </td>
                                                                <td style={{ verticalAlign: 'middle' }}>
                                                                    <div>
                                                                        <strong style={{ fontSize: 15 }}>{bundle.title}</strong>
                                                                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Code: {bundle.bundleCode}</div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e3f2fd', color: '#1976d2', borderRadius: 12, fontWeight: 500 }}>
                                                                        {bundle.modulesIncluded ? bundle.modulesIncluded.length : 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fff3e0', color: '#f57c00', borderRadius: 12, fontWeight: 500 }}>
                                                                        {getChapterCountForBundle(bundle)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <span className={`badge ${bundle.active === 1 ? 'badge-success' : 'badge-warning'}`}>
                                                                        {bundle.active === 1 ? 'Active' : 'Inactive'}
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
                            <div className="modal-footer" style={{ background: '#f8f9fa' }}>
                                <div style={{ textAlign: 'left', flex: 1, color: '#666' }}>
                                    <i className="ti ti-info-alt"></i> Click on a row to select and open the course bundle
                                </div>
                                <button type="button" className="btn btn-default" onClick={() => setShowSelectCourseModal(false)}><i className="ti ti-close"></i> Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Profile Modal */}
            {showTeacherModal && selectedTeacherProfile && (
                <div className="cmp-modal-backdrop" onClick={() => setShowTeacherModal(false)}>
                    <div className="cmp-modal-dialog" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: '#006073', color: 'white' }}>
                                <button type="button" className="close" style={{ color: 'white', opacity: 0.8 }} onClick={() => setShowTeacherModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-user"></i> Instructor Profile</h4>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-4 text-center">
                                        <Avatar
                                            src={selectedTeacherProfile.photo}
                                            name={selectedTeacherProfile.name}
                                            style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '4px solid #006073', marginBottom: 15 }}
                                            placeholderStyle={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '4px solid #006073', marginBottom: 15, background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48, fontWeight: 700 }}
                                        />
                                        <div className="star-rating" style={{ fontSize: 20, marginBottom: 10 }}>
                                            {[0, 1, 2, 3, 4].map(i => (
                                                <i key={i} className={`fa ${getStarClass(selectedTeacherProfile.rating, i)}`}></i>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#666' }}>{selectedTeacherProfile.rating}/5.0</p>
                                        <p style={{ color: '#999', fontSize: 14 }}>{selectedTeacherProfile.studentsCount || 0} Students</p>
                                    </div>
                                    <div className="col-md-8">
                                        <h3 style={{ color: '#006073', marginTop: 0 }}>{selectedTeacherProfile.name}</h3>
                                        <p style={{ color: '#666', fontSize: 16, marginBottom: 20 }}><em>{selectedTeacherProfile.brief || selectedTeacherProfile.about}</em></p>
                                        <div style={{ marginBottom: 15 }}>
                                            <strong style={{ color: '#006073' }}><i className="ti ti-bookmark"></i> Specialization:</strong>
                                            <p style={{ marginLeft: 25, color: '#666' }}>{selectedTeacherProfile.specialization || selectedTeacherProfile.expertSubject}</p>
                                        </div>
                                        <div style={{ marginBottom: 15 }}>
                                            <strong style={{ color: '#006073' }}><i className="ti ti-briefcase"></i> Experience:</strong>
                                            <p style={{ marginLeft: 25, color: '#666' }}>{selectedTeacherProfile.experience || 'N/A'}</p>
                                        </div>
                                        {(selectedTeacherProfile.education || selectedTeacherProfile.qualifications) && (
                                            <div style={{ marginBottom: 15 }}>
                                                <strong style={{ color: '#006073' }}><i className="ti ti-medall"></i> Education:</strong>
                                                <p style={{ marginLeft: 25, color: '#666' }}>{selectedTeacherProfile.education || selectedTeacherProfile.qualifications}</p>
                                            </div>
                                        )}
                                        {selectedTeacherProfile.about && (
                                            <div>
                                                <strong style={{ color: '#006073' }}><i className="ti ti-info-alt"></i> About:</strong>
                                                <p style={{ marginLeft: 25, color: '#666' }}>{selectedTeacherProfile.about}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={openChangeInstructorModal}><i className="ti ti-reload"></i> Change Instructor</button>
                                <button type="button" className="btn btn-default" onClick={() => setShowTeacherModal(false)}><i className="ti ti-close"></i> Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Instructor Modal */}
            {showChangeInstructorModal && (
                <div className="cmp-modal-backdrop" onClick={() => setShowChangeInstructorModal(false)}>
                    <div className="cmp-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: '#006073', color: 'white' }}>
                                <button type="button" className="close" style={{ color: 'white', opacity: 0.8 }} onClick={() => setShowChangeInstructorModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title">
                                    <i className="ti ti-reload"></i> Change Instructor{currentChapterForTeacherChange ? ` for: ${currentChapterForTeacherChange.title}` : ''}
                                </h4>
                            </div>
                            <div className="modal-body">
                                <div className="row" style={{ marginBottom: 15 }}>
                                    <div className="col-md-12">
                                        <div className="input-group">
                                            <span className="input-group-addon"><i className="ti ti-search"></i></span>
                                            <input type="text" className="form-control" placeholder="Search instructors by name, subject, or expertise..." value={instructorSearchQuery} onChange={e => setInstructorSearchQuery(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12">
                                        <div style={{ maxHeight: 450, overflowY: 'auto', padding: 5 }}>
                                            {filteredInstructors.map(instructor => (
                                                <div
                                                    key={instructor.id}
                                                    className={`instructor-card${selectedNewInstructor && selectedNewInstructor.id === instructor.id ? ' instructor-selected' : ''}`}
                                                    onClick={() => setSelectedNewInstructor(instructor)}
                                                    style={{ padding: 15, border: '2px solid #ddd', marginBottom: 12, background: 'white', cursor: 'pointer', borderRadius: 8, transition: 'all 0.3s ease' }}
                                                >
                                                    <div className="row">
                                                        <div className="col-md-2 text-center">
                                                            <Avatar src={instructor.photo} name={instructor.name} style={{ width: 70, height: 70, borderRadius: '50%', border: '3px solid #ddd', objectFit: 'cover' }} placeholderStyle={{ width: 70, height: 70, borderRadius: '50%', border: '3px solid #ddd', background: 'linear-gradient(135deg, #006073 0%, #004d5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, fontWeight: 700 }} />
                                                        </div>
                                                        <div className="col-md-10">
                                                            <h4 style={{ margin: '0 0 8px 0', color: '#006073', fontWeight: 600 }}>
                                                                {instructor.name}
                                                                {selectedNewInstructor && selectedNewInstructor.id === instructor.id && (
                                                                    <span style={{ float: 'right', color: '#28a745' }}><i className="ti ti-check-box" style={{ fontSize: 24 }}></i></span>
                                                                )}
                                                            </h4>
                                                            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: 14 }}>{instructor.brief}</p>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, fontSize: 13, color: '#777' }}>
                                                                <span><i className="ti ti-bookmark-alt"></i> <strong>Subject:</strong> {instructor.expertSubject}</span>
                                                                <span><i className="ti ti-briefcase"></i> <strong>Experience:</strong> {instructor.experience} years</span>
                                                                <span><i className="ti ti-star"></i> <strong>Rating:</strong> <span style={{ color: '#ffb706', fontWeight: 'bold' }}>{instructor.rating}/5</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredInstructors.length === 0 && (
                                                <div className="text-center" style={{ padding: '60px 20px', color: '#999' }}>
                                                    <i className="ti ti-search" style={{ fontSize: 56, display: 'block', marginBottom: 15, opacity: 0.5 }}></i>
                                                    <p style={{ fontSize: 16 }}>No instructors found matching your search.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={confirmInstructorChange} disabled={!selectedNewInstructor}><i className="ti ti-check"></i> Assign Instructor</button>
                                <button type="button" className="btn btn-default" onClick={() => setShowChangeInstructorModal(false)}><i className="ti ti-close"></i> Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {showVideoModal && selectedVideo && (
                <div className="cmp-modal-backdrop" onClick={() => setShowVideoModal(false)}>
                    <div className="cmp-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowVideoModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-play"></i> {selectedVideo.title}</h4>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-8">
                                        <div className="video-player-container">
                                            <div className="video-placeholder">
                                                <i className="ti ti-video-camera"></i>
                                                <p>Video Player</p>
                                                <small className="text-muted">Video URL: {selectedVideo.libraryId}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="video-details">
                                            <h5>Video Details</h5>
                                            <ul className="list-unstyled">
                                                <li><strong>Part:</strong> {selectedVideo.partNumber}</li>
                                                <li><strong>Chapter:</strong> {selectedVideo.chapterTitle}</li>
                                                <li><strong>Module:</strong> {selectedVideo.moduleCode}</li>
                                                <li><strong>Type:</strong> {selectedVideo.type}</li>
                                                <li><strong>Skip to Next:</strong> <span className={`badge ${selectedVideo.skipToNext ? 'badge-success' : 'badge-warning'}`}>{selectedVideo.skipToNext ? 'Yes' : 'No'}</span></li>
                                            </ul>
                                            <div className="video-actions">
                                                <button className="btn btn-info btn-block" onClick={() => showToast('info', '', 'Added to playlist!')}><i className="ti ti-list"></i> Add to Playlist</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowVideoModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Preview Modal */}
            {showVideoPreviewModal && videoPreviewPart && (
                <div className="cmp-modal-backdrop" onClick={() => setShowVideoPreviewModal(false)}>
                    <div className="cmp-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowVideoPreviewModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-video-camera"></i> {videoPreviewPart.title}</h4>
                            </div>
                            <div className="modal-body">
                                <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <i className="ti ti-video-camera" style={{ fontSize: 48, marginBottom: 15 }}></i>
                                            <p>Video preview not available in demo</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 15 }}>
                                    <span style={{ marginRight: 20 }}><i className="ti ti-time"></i> {formatDuration(videoPreviewPart.duration)}</span>
                                    <span><i className="ti ti-bookmark"></i> {videoPreviewPart.libraryId}</span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowVideoPreviewModal(false)}><i className="ti ti-close"></i> Hide</button>
                                <button
                                    type="button"
                                    className={`btn ${isPartSelected(videoPreviewPart.libraryId) ? 'btn-danger' : 'btn-success'}`}
                                    onClick={() => togglePartSelection(videoPreviewPart)}
                                >
                                    <i className={`fa ${isPartSelected(videoPreviewPart.libraryId) ? 'fa-minus' : 'fa-plus'}`}></i>
                                    {' '}{isPartSelected(videoPreviewPart.libraryId) ? 'Remove from Parts' : 'Add to Parts'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Quiz Modal */}
            {showLinkQuizModal && (
                <div className="cmp-modal-backdrop" onClick={() => setShowLinkQuizModal(false)}>
                    <div className="cmp-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowLinkQuizModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-clipboard"></i> Link Quiz to Chapter</h4>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                                    <i className="ti ti-info-alt"></i> Select a quiz from the list below to add it as a part in this chapter.
                                </div>
                                <div className="form-group">
                                    <div className="input-group">
                                        <span className="input-group-addon"><i className="ti ti-search"></i></span>
                                        <input type="text" className="form-control" placeholder="Search quizzes by title or description..." value={quizSearchQuery} onChange={e => setQuizSearchQuery(e.target.value)} />
                                        {quizSearchQuery && (
                                            <span className="input-group-btn">
                                                <button className="btn btn-default" type="button" onClick={() => setQuizSearchQuery('')}><i className="ti ti-close"></i></button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
                                    <table className="table table-hover" style={{ marginBottom: 0 }}>
                                        <thead style={{ background: '#f8f9fa' }}>
                                            <tr>
                                                <th style={{ width: 50 }}></th>
                                                <th>Quiz Title</th>
                                                <th style={{ width: 100, textAlign: 'center' }}>Questions</th>
                                                <th style={{ width: 100, textAlign: 'center' }}>Max Marks</th>
                                                <th style={{ width: 100, textAlign: 'center' }}>Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan="5" className="text-center" style={{ padding: '40px', color: '#999' }}>
                                                    <i className="ti ti-clipboard" style={{ fontSize: 48, display: 'block', marginBottom: 15, opacity: 0.3 }}></i>
                                                    <p>No published quizzes available. Create quizzes in the Practice Quizzes section.</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowLinkQuizModal(false)}><i className="ti ti-close"></i> Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={linkQuizToChapter} disabled={!selectedQuizForLink}><i className="ti ti-check"></i> Link Quiz</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attach Material Modal */}
            {showAttachMaterialModal && (
                <div className="cmp-modal-backdrop" onClick={() => setShowAttachMaterialModal(false)}>
                    <div className="cmp-modal-dialog" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowAttachMaterialModal(false)}><span>&times;</span></button>
                                <h4 className="modal-title"><i className="ti ti-file"></i> Attach Material (PDF)</h4>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                                    <i className="ti ti-info-alt"></i> Upload a PDF document to add it as a study material in this chapter.
                                </div>
                                <form className="form-horizontal">
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Material Title <span className="text-danger">*</span></label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" placeholder="Enter material title" value={materialUpload.title} onChange={e => setMaterialUpload({ ...materialUpload, title: e.target.value })} />
                                            <small className="help-block">This will be shown to students</small>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">PDF File <span className="text-danger">*</span></label>
                                        <div className="col-sm-9">
                                            <input type="file" ref={materialFileRef} accept=".pdf,application/pdf" onChange={handleMaterialFileSelect} style={{ display: 'none' }} />
                                            <button type="button" className="btn btn-default btn-block" onClick={() => materialFileRef.current && materialFileRef.current.click()}>
                                                <i className="ti ti-upload"></i> {materialUpload.fileName || 'Choose PDF File'}
                                            </button>
                                            <small className="help-block">Only PDF files are allowed</small>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="col-sm-3 control-label">Brief Description</label>
                                        <div className="col-sm-9">
                                            <textarea className="form-control" rows="3" placeholder="Optional brief description" value={materialUpload.brief} onChange={e => setMaterialUpload({ ...materialUpload, brief: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                    {materialUpload.fileName && (
                                        <div className="form-group">
                                            <div className="col-sm-9 col-sm-offset-3">
                                                <div style={{ padding: 15, background: '#f8f9fa', borderRadius: 4, borderLeft: '3px solid #28a745' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <i className="fa fa-file-pdf-o" style={{ fontSize: 32, color: '#dc3545', marginRight: 15 }}></i>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: '#333' }}>{materialUpload.fileName}</div>
                                                            <div style={{ fontSize: 12, color: '#666' }}>PDF Document</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowAttachMaterialModal(false)}><i className="ti ti-close"></i> Cancel</button>
                                <button type="button" className="btn btn-success" onClick={attachMaterialToChapter} disabled={!materialUpload.file || !materialUpload.title}><i className="ti ti-check"></i> Attach Material</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
