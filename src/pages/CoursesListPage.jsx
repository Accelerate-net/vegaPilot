import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { api } from '../lib/api';
import { demoCourses, demoCourseStudents } from '../data/coursesListDemo';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatMillis(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function pageNumbers(currentPage, totalPages) {
  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i += 1) pages.push(i);
  return pages;
}

function mapCourse(course) {
  return {
    id: course.id,
    code: course.code || '',
    title: course.title,
    category: course.category || '',
    modulesList: course.modules || course.modulesList || [],
    totalModules: course.totalModules || 0,
    totalChapters: course.chapters || course.totalChapters || 0,
    totalDuration: course.duration || course.totalDuration || '0h 0m',
    status: course.status || 'Draft',
    totalStudents: course.students || course.totalStudents || 0,
    instructor: course.instructor,
    rating: course.rating,
  };
}

function paginateRows(rows, currentPage, pageSize) {
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    totalItems,
    totalPages,
    currentPage: safePage,
  };
}

export default function CoursesListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
  const [studentsItemsPerPage] = useState(5);
  const [studentsTotalPages, setStudentsTotalPages] = useState(0);
  const [studentsTotalItems, setStudentsTotalItems] = useState(0);
  const [studentsSortBy, setStudentsSortBy] = useState('name');
  const [studentsSortOrder, setStudentsSortOrder] = useState('ASC');
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      setIsLoading(true);
      try {
        const response = await api.get('/restricted/course/list-course-bundles.php', {
          params: {
            page: currentPage,
            size: itemsPerPage,
            sortBy,
            sortOrder,
            searchKey: searchQuery.trim() || undefined,
          },
        });
        if (response.data?.status === 'success') {
          if (cancelled) return;
          setCourses((response.data.data || []).map(mapCourse));
          setCurrentPage(response.data.meta?.page || 1);
          setTotalItems(response.data.meta?.total || 0);
          setTotalPages(response.data.meta?.totalPages || 1);
          setIsDemoMode(false);
          return;
        }
        throw new Error('Failed to load courses');
      } catch {
        if (cancelled) return;
        const filtered = demoCourses.filter((course) =>
          !searchQuery.trim() || [course.code, course.title, course.category].some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        );
        const paginated = paginateRows(filtered, currentPage, itemsPerPage);
        setCourses(paginated.rows);
        setTotalItems(paginated.totalItems);
        setTotalPages(paginated.totalPages);
        setCurrentPage(paginated.currentPage);
        setIsDemoMode(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [currentPage, itemsPerPage, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    async function loadCourseStudents() {
      if (!selectedCourse) return;
      try {
        const response = await api.get('/restricted/enrollment/get-course-enrollments.php', {
          params: {
            course: selectedCourse.code,
            page: studentsCurrentPage,
            size: studentsItemsPerPage,
            sortBy: studentsSortBy,
            sortOrder: studentsSortOrder,
            searchKey: studentSearchQuery.trim() || undefined,
          },
        });
        if (response.data?.status === 'success') {
          if (cancelled) return;
          const rows = (response.data.data || []).map((enrollment) => ({
            id: enrollment.candidateId || '',
            name: enrollment.name || 'Unknown Student',
            email: enrollment.email || '',
            phone: enrollment.mobile || '',
            photo: enrollment.photo || null,
            enrollmentDate: enrollment.enrollmentDate || Date.now(),
            enrollmentStatusText: enrollment.enrollmentStatus === 1 ? 'Active' : 'Inactive',
            status: enrollment.enrollmentStatus === 1 ? 'active' : 'inactive',
          }));
          setCourseStudents(rows);
          setStudentsTotalItems(response.data.total || 0);
          setStudentsTotalPages(response.data.totalPages || 0);
          setStudentsCurrentPage(response.data.page || 1);
          return;
        }
        throw new Error('Failed');
      } catch {
        if (cancelled) return;
        const source = demoCourseStudents[selectedCourse.code] || [];
        const filtered = source.filter((student) =>
          !studentSearchQuery.trim() || [student.name, student.email].some((value) => value.toLowerCase().includes(studentSearchQuery.trim().toLowerCase()))
        );
        const paginated = paginateRows(filtered, studentsCurrentPage, studentsItemsPerPage);
        setCourseStudents(paginated.rows);
        setStudentsTotalItems(paginated.totalItems);
        setStudentsTotalPages(paginated.totalPages);
        setStudentsCurrentPage(paginated.currentPage);
      }
    }
    loadCourseStudents();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, studentSearchQuery, studentsCurrentPage, studentsItemsPerPage, studentsSortBy, studentsSortOrder]);

  const stats = useMemo(() => ({
    totalCourses: courses.length,
    totalModules: courses.reduce((sum, course) => sum + (course.totalModules || 0), 0),
    totalChapters: courses.reduce((sum, course) => sum + (course.totalChapters || 0), 0),
    activeCourses: courses.filter((course) => String(course.status).toLowerCase() === 'active').length,
  }), [courses]);

  function openCourse(course) {
    navigate(`/course-view?courseCode=${course.code}&bundleId=${course.id || 70005}&segment=1&module=1&chapter=1&part=0`);
  }

  function openStudentProfile(student) {
    window.localStorage.setItem('selectedStudent', JSON.stringify(student));
    const detailUrl = `${window.location.origin}/candidate-detail`;
    window.open(detailUrl, '_blank', 'noopener,noreferrer');
  }

  function toggleSort(column) {
    if (sortBy === column) {
      setSortOrder((value) => (value === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  }

  const currentPageNumbers = useMemo(() => pageNumbers(currentPage, totalPages), [currentPage, totalPages]);
  const studentPageNumbers = useMemo(() => pageNumbers(studentsCurrentPage, studentsTotalPages), [studentsCurrentPage, studentsTotalPages]);

  function closeStudentsModal() {
    setSelectedCourse(null);
    setStudentSearchQuery('');
    setCourseStudents([]);
    setStudentsCurrentPage(1);
    setStudentsTotalPages(0);
    setStudentsTotalItems(0);
    setStudentsSortBy('name');
    setStudentsSortOrder('ASC');
  }

  return (
    <section className="screen-card courses-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Programs</p>
          <h3>Courses List</h3>
          <p className="muted-copy">Browse bundles, inspect enrolled students, and route into course content.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate('/course-management')}>Create New Course</button>
      </div>

      {isDemoMode ? <div className="info-banner">Showing demo course data because the course APIs are currently unreachable.</div> : null}

      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Courses</h4><p className="big-stat">{stats.totalCourses}</p></div>
        <div className="detail-panel"><h4>Total Modules</h4><p className="big-stat">{stats.totalModules}</p></div>
        <div className="detail-panel"><h4>Total Chapters</h4><p className="big-stat">{stats.totalChapters}</p></div>
        <div className="detail-panel"><h4>Active Courses</h4><p className="big-stat">{stats.activeCourses}</p></div>
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input className="search-input" placeholder="Search courses by name, ID, or category..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} />
        </div>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('code')}>Course ID</button></th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('name')}>Course Name</button></th>
              <th>Modules</th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('chapters')}>Chapters</button></th>
              <th>Total Duration</th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('status')}>Status</button></th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('students')}>Students</button></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(itemsPerPage)].map((_, index) => <tr key={`loading-${index}`}><td colSpan="8" className="loading-row">Loading courses...</td></tr>) : null}
            {!isLoading && courses.map((course) => (
              <tr key={course.code}>
                <td><div className="student-name">{course.code}</div></td>
                <td><div className="student-name">{course.title}</div><div className="student-subtle">{course.category}</div></td>
                <td><div className="chip-row">{(course.modulesList || []).map((module) => <span key={module} className="link-chip neutral">{module}</span>)}</div></td>
                <td>{course.totalChapters}</td>
                <td>{course.totalDuration}</td>
                <td><span className={`status-pill ${String(course.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`}>{course.status}</span></td>
                <td><button type="button" className="link-chip" onClick={() => { setSelectedCourse(course); setStudentsCurrentPage(1); setStudentSearchQuery(''); }}>{course.totalStudents} Student{course.totalStudents === 1 ? '' : 's'}</button></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="table-button" onClick={() => openCourse(course)}>View Course</button>
                    <button type="button" className="table-button" onClick={() => setStatusConfirm(course)}>
                      {String(course.status).toLowerCase() === 'active' ? 'Move as Draft' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && courses.length === 0 ? <tr><td colSpan="8" className="empty-row">No courses found.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div className="muted-copy">Showing {courses.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} courses</div>
        <div className="pagination-controls">
          <select className="filter-select compact" value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); }}>
            {[10, 20, 50, 200].map((size) => <option key={size} value={size}>Show {size}</option>)}
          </select>
          <button type="button" className="ghost-button compact" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
          {currentPageNumbers.map((page) => <button key={page} type="button" className={`ghost-button compact ${page === currentPage ? 'active-page' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>)}
          <button type="button" className="ghost-button compact" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</button>
        </div>
      </div>

      {selectedCourse ? (
        <div className="modal-scrim" role="presentation" onClick={closeStudentsModal}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Students</p>
                <h4>Enrolled Students - {selectedCourse.title}</h4>
              </div>
              <button type="button" className="ghost-button" onClick={closeStudentsModal}>Close</button>
            </div>
            <input className="search-input" placeholder="Search students by name or email..." value={studentSearchQuery} onChange={(event) => { setStudentSearchQuery(event.target.value); setStudentsCurrentPage(1); }} />
            <div className="student-table-shell nested-shell">
              <table className="student-table">
                <thead>
                  <tr>
                    <th><button type="button" className="sort-button" onClick={() => { setStudentsSortBy('name'); setStudentsSortOrder((value) => (studentsSortBy === 'name' && value === 'ASC' ? 'DESC' : 'ASC')); setStudentsCurrentPage(1); }}>Student Name</button></th>
                    <th><button type="button" className="sort-button" onClick={() => { setStudentsSortBy('email'); setStudentsSortOrder((value) => (studentsSortBy === 'email' && value === 'ASC' ? 'DESC' : 'ASC')); setStudentsCurrentPage(1); }}>Email</button></th>
                    <th>Phone</th>
                    <th><button type="button" className="sort-button" onClick={() => { setStudentsSortBy('enrollmentDate'); setStudentsSortOrder((value) => (studentsSortBy === 'enrollmentDate' && value === 'ASC' ? 'DESC' : 'ASC')); setStudentsCurrentPage(1); }}>Enrollment Date</button></th>
                    <th><button type="button" className="sort-button" onClick={() => { setStudentsSortBy('enrollmentStatus'); setStudentsSortOrder((value) => (studentsSortBy === 'enrollmentStatus' && value === 'ASC' ? 'DESC' : 'ASC')); setStudentsCurrentPage(1); }}>Status</button></th>
                  </tr>
                </thead>
                <tbody>
                  {courseStudents.map((student) => (
                    <tr key={`${selectedCourse.code}-${student.id}`} onClick={() => openStudentProfile(student)}>
                      <td>
                        <div className="student-cell">
                          {student.photo ? <img alt={student.name} className="avatar" src={student.photo} /> : <div className="avatar placeholder">{getInitials(student.name)}</div>}
                          <div>
                            <div className="student-name">{student.name}</div>
                            <div className="student-subtle">ID: {student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.phone || 'N/A'}</td>
                      <td>{formatMillis(student.enrollmentDate)}</td>
                      <td><span className={`status-pill ${student.status === 'active' ? 'active' : 'inactive'}`}>{student.enrollmentStatusText || student.status}</span></td>
                    </tr>
                  ))}
                  {courseStudents.length === 0 ? <tr><td colSpan="5" className="empty-row">No students found for this course.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar">
              <div className="muted-copy">Showing {courseStudents.length === 0 ? 0 : (studentsCurrentPage - 1) * studentsItemsPerPage + 1} to {Math.min(studentsCurrentPage * studentsItemsPerPage, studentsTotalItems)} of {studentsTotalItems} students</div>
              <div className="pagination-controls">
                <button type="button" className="ghost-button compact" disabled={studentsCurrentPage === 1} onClick={() => setStudentsCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
                {studentPageNumbers.map((page) => <button key={page} type="button" className={`ghost-button compact ${page === studentsCurrentPage ? 'active-page' : ''}`} onClick={() => setStudentsCurrentPage(page)}>{page}</button>)}
                <button type="button" className="ghost-button compact" disabled={studentsCurrentPage === studentsTotalPages || studentsTotalPages === 0} onClick={() => setStudentsCurrentPage((page) => Math.min(studentsTotalPages, page + 1))}>Next</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {statusConfirm ? (
        <div className="modal-scrim" role="presentation" onClick={() => setStatusConfirm(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Confirm Action</p>
            <h4>
              {String(statusConfirm.status).toLowerCase() === 'active' ? 'Move course to Draft?' : 'Enable this course?'}
            </h4>
            <p className="muted-copy">
              Are you sure you want to change the status of "{statusConfirm.title}" to {String(statusConfirm.status).toLowerCase() === 'active' ? 'Draft' : 'Active'}?
            </p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setStatusConfirm(null)}>Cancel</button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setCourses((current) => current.map((course) => course.code === statusConfirm.code ? { ...course, status: String(course.status).toLowerCase() === 'active' ? 'Draft' : 'Active' } : course));
                  showToast('success', 'Success', `Course status updated to ${String(statusConfirm.status).toLowerCase() === 'active' ? 'Draft' : 'Active'}`);
                  setStatusConfirm(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
