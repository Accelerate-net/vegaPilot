import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { availableCourses, demoCandidates } from '../data/candidateProfileDemo';
import ToastRegion from '../components/ToastRegion';

function normalizeCandidate(candidate) {
  return {
    id: candidate.candidateKey || candidate.id,
    candidateKey: candidate.candidateKey || candidate.id,
    name: candidate.name || 'Unknown',
    email: candidate.email || '',
    mobile: candidate.mobile || candidate.registeredMobile || candidate.communicationMobile || '',
    avatar: candidate.photo || candidate.avatar || null,
    status: candidate.blocked ? 'blocked' : String(candidate.status || 'active').toLowerCase(),
    blocked: Boolean(candidate.blocked),
    joinedDate: candidate.joinedDate || null,
    enrollmentDate: candidate.joinedDate ? new Date(candidate.joinedDate) : null,
    totalCourseEnrollments: candidate.totalCourseEnrollments || 0,
    totalTestSeriesEnrollments: candidate.totalTestSeriesEnrollments || 0,
    enrolledCourses: [...(candidate.enrolledCourses || [])],
  };
}

function sortDemoRows(rows, sortColumn, sortReverse) {
  const items = [...rows];
  items.sort((left, right) => {
    let a = left[sortColumn];
    let b = right[sortColumn];

    if (sortColumn === 'joinedDate') {
      a = new Date(a || 0).getTime();
      b = new Date(b || 0).getTime();
    }

    a = a ?? '';
    b = b ?? '';

    if (typeof a === 'string') a = a.toLowerCase();
    if (typeof b === 'string') b = b.toLowerCase();

    if (a < b) return sortReverse ? 1 : -1;
    if (a > b) return sortReverse ? -1 : 1;
    return 0;
  });
  return items;
}

function getDemoResponse({ searchQuery, filterStatus, currentPage, itemsPerPage, sortColumn, sortReverse }) {
  let rows = demoCandidates.map(normalizeCandidate);
  const query = searchQuery.trim().toLowerCase();

  if (query) {
    rows = rows.filter((candidate) =>
      [candidate.name, candidate.email, candidate.mobile, candidate.candidateKey]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }

  if (filterStatus) {
    rows = rows.filter((candidate) => candidate.status === filterStatus);
  }

  rows = sortDemoRows(rows, sortColumn, sortReverse);

  const totalStudents = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * itemsPerPage;

  return {
    students: rows.slice(start, start + itemsPerPage),
    totalStudents,
    totalPages,
    currentPage: page,
  };
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateFromSeconds(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getValidityStatus(validUntil) {
  if (!validUntil) return 'UNKNOWN';
  const daysRemaining = Math.ceil((validUntil - Date.now() / 1000) / 86400);
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 30) return 'EXPIRING SOON';
  return 'ACTIVE';
}

function getDaysRemaining(validUntil) {
  if (!validUntil) return 0;
  return Math.abs(Math.ceil((validUntil - Date.now() / 1000) / 86400));
}

function getPageNumbers(currentPage, totalPages) {
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  const pages = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortReverse, setSortReverse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading students...');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [studentToBlacklist, setStudentToBlacklist] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = (type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadStudents() {
      setIsLoading(true);
      setLoadingMessage('Loading students...');
      const isLocalWebPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      try {
        const response = await api.get('/restricted/people/list-candidates.php', {
          params: {
            page: currentPage,
            size: itemsPerPage,
            sortBy: sortColumn,
            searchKey: searchQuery.trim() || undefined,
            status: filterStatus || undefined,
          },
        });

        if (response.data?.status === 'success') {
          const rows = (response.data.data || []).map(normalizeCandidate);
          if (!isCancelled) {
            setStudents(rows);
            setTotalStudents(response.data.meta?.total || 0);
            setTotalPages(response.data.meta?.totalPages || 1);
            setCurrentPage(response.data.meta?.page || 1);
            setIsDemoMode(false);
          }
          return;
        }

        throw new Error(response.data?.message || response.data?.error || 'Failed to load students');
      } catch (error) {
        const demo = getDemoResponse({
          searchQuery,
          filterStatus,
          currentPage,
          itemsPerPage,
          sortColumn,
          sortReverse,
        });

        if (!isCancelled) {
          setStudents(demo.students);
          setTotalStudents(demo.totalStudents);
          setTotalPages(demo.totalPages);
          setCurrentPage(demo.currentPage);
          setIsDemoMode(true);
          if (isLocalWebPreview) {
            showToast('info', 'Demo Data', 'Loaded demo candidate data because the candidate API is not reachable.');
          } else {
            showToast('error', 'Network Error', error.message || 'Error loading students.');
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadStudents();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, filterStatus, itemsPerPage, searchQuery, sortColumn, sortReverse]);

  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'active' && !student.blocked).length,
    [students]
  );

  const totalEnrollments = useMemo(
    () => students.reduce((sum, student) => sum + (student.totalCourseEnrollments || 0), 0),
    [students]
  );

  const filteredAvailableCourses = useMemo(() => {
    if (!selectedStudent) return [];
    const enrolledCourseIds = new Set((selectedStudent.enrolledCourses || []).map((course) => course.courseId));
    return availableCourses.filter((course) => {
      if (enrolledCourseIds.has(course.courseId)) return false;
      if (!courseSearchQuery.trim()) return true;
      const query = courseSearchQuery.trim().toLowerCase();
      return course.courseName.toLowerCase().includes(query) || course.courseCode.toLowerCase().includes(query);
    });
  }, [courseSearchQuery, selectedStudent]);

  const paginationPages = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  function closeStudentModal() {
    setSelectedStudent(null);
    setEnrollModalOpen(false);
    setCourseSearchQuery('');
  }

  function handleSort(column) {
    const map = {
      name: 'name',
      email: 'email',
      mobile: 'mobile',
      coursesCount: 'totalCourseEnrollments',
      enrollmentDate: 'joinedDate',
      status: 'status',
    };
    const next = map[column] || column;
    if (sortColumn === next) {
      setSortReverse((value) => !value);
    } else {
      setSortColumn(next);
      setSortReverse(false);
    }
    setCurrentPage(1);
  }

  function openStudentCourses(student) {
    setSelectedStudent(student);
  }

  function openStudentDetail(student) {
    window.localStorage.setItem('selectedStudent', JSON.stringify(student));
    const detailUrl = `${window.location.origin}${window.location.pathname}#/candidate-detail.html`;
    window.open(detailUrl, '_blank', 'noopener,noreferrer');
  }

  function confirmBlacklist() {
    if (!studentToBlacklist) return;
    showToast('success', 'Profile Blacklisted', `${studentToBlacklist.name} has been successfully blacklisted.`);
    setStudentToBlacklist(null);
  }

  function enrollStudentToCourse(course) {
    if (!selectedStudent) return;
    const newEnrollment = {
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      enrollmentDate: Math.floor(Date.now() / 1000),
      validUntil: Math.floor(Date.now() / 1000) + 180 * 86400,
      enrollmentStatusText: 'ACTIVE',
    };

    setSelectedStudent((current) => ({
      ...current,
      enrolledCourses: [...(current?.enrolledCourses || []), newEnrollment],
      totalCourseEnrollments: (current?.totalCourseEnrollments || 0) + 1,
    }));

    setStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              enrolledCourses: [...student.enrolledCourses, newEnrollment],
              totalCourseEnrollments: student.totalCourseEnrollments + 1,
            }
          : student
      )
    );

    showToast('success', 'Enrollment Successful', `Successfully enrolled ${selectedStudent.name} to ${course.courseName}.`);
  }

  const showingStart = totalStudents === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, totalStudents);

  return (
    <section className="screen-card student-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="hero-row">
        <div>
          <p className="eyebrow">Students</p>
          <h3>Student Management</h3>
          <p className="muted-copy">Search, review, and manage candidate enrollments with API-backed pagination.</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => showToast('info', 'Feature Coming Soon', 'Add new student functionality is under development.')}>
          Add Student
        </button>
      </div>

      {isDemoMode ? <div className="info-banner">Showing demo candidate records mapped to the current API response structure for preview.</div> : null}

      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Students</h4><p className="big-stat">{totalStudents}</p></div>
        <div className="detail-panel"><h4>Active on Page</h4><p className="big-stat">{activeStudents}</p></div>
        <div className="detail-panel"><h4>Course Enrollments</h4><p className="big-stat">{totalEnrollments}</p></div>
        <div className="detail-panel"><h4>Data Source</h4><p className="big-stat">{isDemoMode ? 'Demo' : 'API'}</p></div>
      </div>

      <div className="toolbar-row">
        <div className="search-shell">
          <input
            aria-label="Search students"
            className="search-input"
            placeholder="Search by name, email, mobile, or candidate key..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-button" onClick={() => handleSort('name')}>Student</button></th>
              <th><button type="button" className="sort-button" onClick={() => handleSort('email')}>Email</button></th>
              <th><button type="button" className="sort-button" onClick={() => handleSort('mobile')}>Mobile</button></th>
              <th><button type="button" className="sort-button" onClick={() => handleSort('coursesCount')}>Enrolled Courses</button></th>
              <th><button type="button" className="sort-button" onClick={() => handleSort('enrollmentDate')}>Enrollment Date</button></th>
              <th><button type="button" className="sort-button" onClick={() => handleSort('status')}>Status</button></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(itemsPerPage)].map((_, index) => (
                <tr key={`loading-${index}`}>
                  <td colSpan="7" className="loading-row">{loadingMessage}</td>
                </tr>
              ))
            ) : students.length > 0 ? (
              students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-cell">
                      {student.avatar ? (
                        <img alt={student.name} className="avatar" src={student.avatar} />
                      ) : (
                        <div className="avatar placeholder">{getInitials(student.name)}</div>
                      )}
                      <div>
                        <div className="student-name">{student.name}</div>
                        <div className="student-subtle">ID: {student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>{student.mobile}</td>
                  <td>
                    <button type="button" className="link-chip" onClick={() => openStudentCourses(student)}>
                      {student.totalCourseEnrollments || 0} Course{student.totalCourseEnrollments === 1 ? '' : 's'}
                    </button>
                  </td>
                  <td>{student.enrollmentDate ? student.enrollmentDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}</td>
                  <td><span className={`status-pill ${student.status}`}>{student.status}</span></td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="table-button" onClick={() => openStudentDetail(student)}>View</button>
                      <button type="button" className="table-button danger" onClick={() => setStudentToBlacklist(student)}>Blacklist</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-row">No students found for the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div className="muted-copy">
          Showing {showingStart} to {showingEnd} of {totalStudents} students
        </div>
        <div className="pagination-controls">
          <select className="filter-select compact" value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); }}>
            {[10, 20, 50, 200].map((size) => <option key={size} value={size}>Show {size}</option>)}
          </select>
          <button type="button" className="ghost-button compact" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
          {paginationPages.map((page) => (
            <button key={page} type="button" className={`ghost-button compact ${page === currentPage ? 'active-page' : ''}`} onClick={() => setCurrentPage(page)}>
              {page}
            </button>
          ))}
          <button type="button" className="ghost-button compact" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</button>
        </div>
      </div>

      {selectedStudent ? (
        <div className="modal-scrim" role="presentation" onClick={closeStudentModal}>
          <div className="modal-card large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">Enrollments</p>
                <h4>Enrolled Courses - {selectedStudent.name}</h4>
              </div>
              <div className="action-row">
                <button type="button" className="primary-button" onClick={() => setEnrollModalOpen(true)}>Enroll Course</button>
                <button type="button" className="ghost-button" onClick={closeStudentModal}>Close</button>
              </div>
            </div>
            <div className="detail-panel subtle-panel">
              <div className="student-cell">
                <div className="avatar placeholder">{getInitials(selectedStudent.name)}</div>
                <div>
                  <div className="student-name">{selectedStudent.name}</div>
                  <div className="student-subtle">{selectedStudent.email}</div>
                </div>
              </div>
            </div>
            {(selectedStudent.enrolledCourses || []).length > 0 ? (
              <table className="student-table compact-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Active Till</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.enrolledCourses.map((course) => (
                    <tr key={`${selectedStudent.id}-${course.courseId}`}>
                      <td>
                        <div className="student-name">{course.courseName}</div>
                        <div className="student-subtle">{course.courseCode}</div>
                      </td>
                      <td>
                        <div>{formatDateFromSeconds(course.validUntil)}</div>
                        <div className="student-subtle">{getDaysRemaining(course.validUntil)} days {getValidityStatus(course.validUntil) === 'EXPIRED' ? 'expired' : 'remaining'}</div>
                      </td>
                      <td><span className={`status-pill ${getValidityStatus(course.validUntil).toLowerCase().replace(/\s+/g, '-')}`}>{course.enrollmentStatusText || getValidityStatus(course.validUntil)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-row standalone">No courses enrolled.</div>
            )}

            {enrollModalOpen ? (
              <div className="nested-panel">
                <div className="modal-header-row">
                  <div>
                    <p className="eyebrow">Enroll Course</p>
                    <h4>Available Courses</h4>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => setEnrollModalOpen(false)}>Done</button>
                </div>
                <input
                  aria-label="Search available courses"
                  className="search-input"
                  placeholder="Search courses by name or code..."
                  value={courseSearchQuery}
                  onChange={(event) => setCourseSearchQuery(event.target.value)}
                />
                <div className="course-grid">
                  {filteredAvailableCourses.map((course) => (
                    <article key={course.courseId} className="detail-panel">
                      <h4>{course.courseName}</h4>
                      <p className="student-subtle">{course.courseCode} • {course.duration}</p>
                      <p className="student-subtle">{course.modules} modules • ₹{course.price}</p>
                      <button type="button" className="primary-button" onClick={() => enrollStudentToCourse(course)}>Enroll</button>
                    </article>
                  ))}
                  {filteredAvailableCourses.length === 0 ? <div className="empty-row standalone">No matching courses available.</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {studentToBlacklist ? (
        <div className="modal-scrim" role="presentation" onClick={() => setStudentToBlacklist(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Confirmation</p>
            <h4>Blacklist {studentToBlacklist.name}?</h4>
            <p className="muted-copy">By doing this, the candidate will not be able to login to the application anymore. You can re-enable access later.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setStudentToBlacklist(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={confirmBlacklist}>Confirm</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
