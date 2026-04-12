import React, { useEffect, useMemo, useRef, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { batchesDemo } from '../data/adminRemainingDemo';

const availableCourses = [
  { id: 'COURSE-001', title: 'IAT 2026 - Exclusive 1 Year Course' },
  { id: 'COURSE-002', title: 'NEET 2026 Complete Preparation' },
  { id: 'COURSE-003', title: 'JEE Advanced 2026 Crash Course' },
  { id: 'COURSE-004', title: 'Foundation Course - Class 11' },
  { id: 'COURSE-005', title: 'Foundation Course - Class 12' },
];

function titleToSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function createStudent(seed, batchName, enrolledToCourse = true) {
  const studentNo = seed + 1;
  const firstNames = ['Aarav', 'Diya', 'Sneha', 'Rahul', 'Amit', 'Megha', 'Farhan', 'Ritika', 'Ananya', 'Nikhil'];
  const lastNames = ['Nair', 'Joseph', 'Menon', 'Prasad', 'Patel', 'S', 'Khan', 'Varma', 'Iyer', 'Thomas'];
  const firstName = firstNames[seed % firstNames.length];
  const lastName = lastNames[seed % lastNames.length];
  const name = `${firstName} ${lastName}`;
  return {
    id: `${titleToSlug(batchName)}-student-${studentNo}`,
    name,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${studentNo}@example.com`,
    phone: `+91 ${String(9000000000 + studentNo).slice(0, 10)}`,
    enrolledToCourse,
    addedOn: Date.now() - seed * 86400000,
  };
}

function normalizeBatch(batch, index) {
  const capacity = Number(batch.numberOfStudents) || 0;
  const baseStudents = Array.isArray(batch.students) ? batch.students : [];
  const normalizedStudents = baseStudents.map((student, studentIndex) => {
    if (typeof student === 'string') {
      return {
        ...createStudent(studentIndex + index * 10, batch.batchName, batch.enrolledCourses.length > 0),
        name: student,
      };
    }
    return {
      ...createStudent(studentIndex + index * 10, batch.batchName, student.enrolledToCourse !== false),
      ...student,
      enrolledToCourse: student.enrolledToCourse !== false,
    };
  });

  const fillerCount = Math.max(0, Math.min(capacity - normalizedStudents.length, normalizedStudents.length > 20 ? 20 : 6));
  for (let fillerIndex = 0; fillerIndex < fillerCount; fillerIndex += 1) {
    const shouldEnroll = batch.enrolledCourses.length > 0 && fillerIndex < Math.max(fillerCount - 2, 0);
    normalizedStudents.push(createStudent(index * 100 + fillerIndex + normalizedStudents.length, batch.batchName, shouldEnroll));
  }

  return {
    ...batch,
    active: batch.active ?? 1,
    isFrozen: Boolean(batch.isFrozen),
    students: normalizedStudents,
    enrolledCourses: [...(batch.enrolledCourses || [])],
  };
}

function createAvailableStudents() {
  return Array.from({ length: 60 }, (_, index) => {
    const student = createStudent(index + 50, 'available-pool', false);
    return {
      ...student,
      id: `available-${index + 1}`,
      status: index % 5 === 0 ? 'inactive' : 'active',
      registrationDate: Date.now() - index * 172800000,
    };
  });
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBatchStatus(batch) {
  if (!batch?.startDate) return 'Active';
  const today = new Date();
  const startDate = new Date(batch.startDate);
  const endDate = batch.endDate ? new Date(batch.endDate) : null;
  if (today < startDate) return 'Upcoming';
  if (endDate && today > endDate) return 'Completed';
  return 'Active';
}

function getBatchStatusClass(batch) {
  const status = getBatchStatus(batch);
  if (status === 'Upcoming') return 'status-upcoming';
  if (status === 'Completed') return 'status-completed';
  return 'status-active';
}

function getUnenrolledStudentsInBatch(batch) {
  return (batch.students || []).filter((student) => !student.enrolledToCourse).length;
}

function sortBatches(rows, column, reverse) {
  const items = [...rows];
  items.sort((left, right) => {
    let aValue;
    let bValue;
    switch (column) {
      case 'batchName':
        aValue = left.batchName.toLowerCase();
        bValue = right.batchName.toLowerCase();
        break;
      case 'studentCount':
        aValue = left.students.length;
        bValue = right.students.length;
        break;
      case 'startDate':
        aValue = new Date(left.startDate || 0).getTime();
        bValue = new Date(right.startDate || 0).getTime();
        break;
      case 'endDate':
        aValue = new Date(left.endDate || 0).getTime();
        bValue = new Date(right.endDate || 0).getTime();
        break;
      case 'status':
        aValue = getBatchStatus(left).toLowerCase();
        bValue = getBatchStatus(right).toLowerCase();
        break;
      default:
        aValue = left.batchName.toLowerCase();
        bValue = right.batchName.toLowerCase();
        break;
    }

    if (aValue < bValue) return reverse ? 1 : -1;
    if (aValue > bValue) return reverse ? -1 : 1;
    return 0;
  });
  return items;
}

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function getStudentInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function BatchManagementPage() {
  const [batches, setBatches] = useState(() => batchesDemo.map(normalizeBatch));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('batchName');
  const [sortReverse, setSortReverse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKebabId, setActiveKebabId] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(false);
  const [batchDraft, setBatchDraft] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollCourseModalOpen, setEnrollCourseModalOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [addStudentsModalOpen, setAddStudentsModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [selectedBatchStudents, setSelectedBatchStudents] = useState({});
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState({});
  const [batchToFreeze, setBatchToFreeze] = useState(null);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const kebabRef = useRef(null);
  const toastIdRef = useRef(0);
  const availableStudentsPool = useMemo(() => createAvailableStudents(), []);

  const showToast = (type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const searchedBatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return batches;
    return batches.filter((batch) => {
      const haystack = [
        batch.batchName,
        batch.description,
        getBatchStatus(batch),
        ...(batch.enrolledCourses || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [batches, searchQuery]);

  const sortedBatches = useMemo(
    () => sortBatches(searchedBatches, sortColumn, sortReverse),
    [searchedBatches, sortColumn, sortReverse]
  );

  const totalPages = Math.max(1, Math.ceil(sortedBatches.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedBatches = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedBatches.slice(start, start + pageSize);
  }, [pageSize, safeCurrentPage, sortedBatches]);

  const showingStart = sortedBatches.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(safeCurrentPage * pageSize, sortedBatches.length);
  const paginationPages = useMemo(() => getPageNumbers(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);

  const selectedBatchStudentsList = useMemo(() => {
    if (!selectedBatch) return [];
    const rows = selectedBatch.students || [];
    if (studentFilter === 'enrolled') return rows.filter((student) => student.enrolledToCourse);
    if (studentFilter === 'not-enrolled') return rows.filter((student) => !student.enrolledToCourse);
    return rows;
  }, [selectedBatch, studentFilter]);

  const visibleBatchStudents = useMemo(() => {
    const query = studentSearchQuery.trim().toLowerCase();
    if (!query) return selectedBatchStudentsList;
    return selectedBatchStudentsList.filter((student) =>
      [student.name, student.email, student.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [selectedBatchStudentsList, studentSearchQuery]);

  const availableStudentsForBatch = useMemo(() => {
    if (!selectedBatch) return [];
    const existingIds = new Set((selectedBatch.students || []).map((student) => student.id));
    const query = studentSearchQuery.trim().toLowerCase();
    return availableStudentsPool.filter((student) => {
      if (existingIds.has(student.id)) return false;
      if (!query) return true;
      return [student.name, student.email, student.phone].some((value) => String(value).toLowerCase().includes(query));
    });
  }, [availableStudentsPool, selectedBatch, studentSearchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function toggleKebab(batchId, event) {
    event.stopPropagation();
    setActiveKebabId((current) => (current === batchId ? null : batchId));
  }

  function handleSort(column) {
    if (sortColumn === column) {
      setSortReverse((value) => !value);
    } else {
      setSortColumn(column);
      setSortReverse(false);
    }
  }

  function openCreateBatchModal() {
    setEditingBatch(false);
    setBatchDraft({
      id: null,
      batchName: '',
      numberOfStudents: '',
      description: '',
      startDate: '',
      endDate: '',
      active: 1,
      isFrozen: false,
      enrolledCourses: [],
      students: [],
    });
    setBatchModalOpen(true);
  }

  function openEditBatchModal(batch) {
    setEditingBatch(true);
    setBatchDraft({
      ...batch,
      numberOfStudents: String(batch.numberOfStudents || ''),
      startDate: formatDateForInput(batch.startDate),
      endDate: formatDateForInput(batch.endDate),
    });
    setBatchModalOpen(true);
    setActiveKebabId(null);
  }

  function saveBatch() {
    if (!batchDraft?.batchName?.trim() || !batchDraft.numberOfStudents) {
      showToast('info', 'Notification', 'Please fill in all required fields.');
      return;
    }
    if (Number(batchDraft.numberOfStudents) < 1) {
      showToast('info', 'Notification', 'Number of students must be at least 1.');
      return;
    }

    const payload = {
      ...batchDraft,
      batchName: batchDraft.batchName.trim(),
      numberOfStudents: Number(batchDraft.numberOfStudents),
      startDate: batchDraft.startDate || '',
      endDate: batchDraft.endDate || '',
    };

    if (editingBatch && payload.id) {
      setBatches((current) => current.map((batch) => (batch.id === payload.id ? { ...batch, ...payload } : batch)));
      showToast('success', 'Batch Updated', `${payload.batchName} has been updated successfully.`);
    } else {
      const created = {
        ...payload,
        id: `BATCH-${Date.now()}`,
        students: [],
        enrolledCourses: [],
      };
      setBatches((current) => [created, ...current]);
      showToast('success', 'Batch Created', `${payload.batchName} has been created successfully.`);
    }

    setBatchModalOpen(false);
    setBatchDraft(null);
  }

  function openManageCourses(batch) {
    setSelectedBatch(batch);
    setSelectedCourse('');
    setEnrollCourseModalOpen(true);
    setStudentsModalOpen(false);
    setAddStudentsModalOpen(false);
    setActiveKebabId(null);
  }

  function addCourseToBatch() {
    if (!selectedBatch || !selectedCourse) return;
    if (selectedBatch.enrolledCourses.includes(selectedCourse)) {
      showToast('info', 'Notification', 'This course is already enrolled to the batch.');
      return;
    }

    setBatches((current) =>
      current.map((batch) =>
        batch.id === selectedBatch.id
          ? {
              ...batch,
              enrolledCourses: [...batch.enrolledCourses, selectedCourse],
              students: batch.students.map((student) => ({ ...student, enrolledToCourse: true })),
            }
          : batch
      )
    );

    setSelectedBatch((current) =>
      current
        ? {
            ...current,
            enrolledCourses: [...current.enrolledCourses, selectedCourse],
            students: current.students.map((student) => ({ ...student, enrolledToCourse: true })),
          }
        : current
    );

    showToast('success', 'Course Added', `${selectedCourse} has been enrolled to ${selectedBatch.batchName}.`);
    setSelectedCourse('');
  }

  function removeCourseFromBatch(courseTitle) {
    if (!selectedBatch) return;
    const nextCourses = selectedBatch.enrolledCourses.filter((course) => course !== courseTitle);
    const nextStudents =
      nextCourses.length === 0
        ? selectedBatch.students.map((student) => ({ ...student, enrolledToCourse: false }))
        : selectedBatch.students;

    setBatches((current) =>
      current.map((batch) =>
        batch.id === selectedBatch.id ? { ...batch, enrolledCourses: nextCourses, students: nextStudents } : batch
      )
    );
    setSelectedBatch((current) => (current ? { ...current, enrolledCourses: nextCourses, students: nextStudents } : current));
    showToast('success', 'Course Removed', `${courseTitle} has been removed from ${selectedBatch.batchName}.`);
  }

  function openStudentsModal(batch) {
    setSelectedBatch(batch);
    setStudentSearchQuery('');
    setStudentFilter('all');
    setSelectedBatchStudents({});
    setStudentsModalOpen(true);
    setAddStudentsModalOpen(false);
    setEnrollCourseModalOpen(false);
    setActiveKebabId(null);
  }

  function openAddStudentsModal(batch) {
    setSelectedBatch(batch);
    setStudentSearchQuery('');
    setSelectedStudentsToAdd({});
    setAddStudentsModalOpen(true);
    setStudentsModalOpen(false);
    setEnrollCourseModalOpen(false);
    setActiveKebabId(null);
  }

  function toggleBatchStudentSelection(student) {
    setSelectedBatchStudents((current) => {
      const next = { ...current };
      if (next[student.id]) delete next[student.id];
      else next[student.id] = student;
      return next;
    });
  }

  function toggleSelectAllBatchStudents(checked) {
    if (!checked) {
      setSelectedBatchStudents({});
      return;
    }
    const next = {};
    visibleBatchStudents.forEach((student) => {
      next[student.id] = student;
    });
    setSelectedBatchStudents(next);
  }

  function removeSelectedStudents() {
    const idsToRemove = Object.keys(selectedBatchStudents);
    if (!selectedBatch || idsToRemove.length === 0) {
      showToast('info', 'Notification', 'Please select at least one student to remove.');
      return;
    }

    const nextStudents = selectedBatch.students.filter((student) => !idsToRemove.includes(student.id));
    setBatches((current) =>
      current.map((batch) => (batch.id === selectedBatch.id ? { ...batch, students: nextStudents } : batch))
    );
    setSelectedBatch((current) => (current ? { ...current, students: nextStudents } : current));
    setSelectedBatchStudents({});
    showToast('success', 'Students Removed', `${idsToRemove.length} student(s) removed from ${selectedBatch.batchName}.`);
  }

  function toggleStudentToAdd(student) {
    setSelectedStudentsToAdd((current) => {
      const next = { ...current };
      if (next[student.id]) delete next[student.id];
      else next[student.id] = student;
      return next;
    });
  }

  function toggleSelectAllStudentsToAdd(checked) {
    if (!checked) {
      setSelectedStudentsToAdd({});
      return;
    }
    const next = {};
    availableStudentsForBatch.forEach((student) => {
      next[student.id] = student;
    });
    setSelectedStudentsToAdd(next);
  }

  function confirmAddStudents() {
    const studentsToAdd = Object.values(selectedStudentsToAdd);
    if (!selectedBatch || studentsToAdd.length === 0) {
      showToast('info', 'Notification', 'Please select at least one student to add.');
      return;
    }

    const additions = studentsToAdd.map((student) => ({
      ...student,
      enrolledToCourse: false,
      addedOn: Date.now(),
    }));
    const nextStudents = [...selectedBatch.students, ...additions];

    setBatches((current) =>
      current.map((batch) => (batch.id === selectedBatch.id ? { ...batch, students: nextStudents } : batch))
    );
    setSelectedBatch((current) => (current ? { ...current, students: nextStudents } : current));
    setSelectedStudentsToAdd({});
    setAddStudentsModalOpen(false);
    showToast('success', 'Students Added', `${studentsToAdd.length} student(s) added to ${selectedBatch.batchName}.`);
  }

  function openFreezeModal(batch) {
    setBatchToFreeze(batch);
    setFreezeModalOpen(true);
    setActiveKebabId(null);
  }

  function confirmFreeze() {
    if (!batchToFreeze) return;
    const nextFrozen = !batchToFreeze.isFrozen;
    setBatches((current) =>
      current.map((batch) => (batch.id === batchToFreeze.id ? { ...batch, isFrozen: nextFrozen } : batch))
    );
    showToast(
      'success',
      'Batch Updated',
      `Batch "${batchToFreeze.batchName}" has been ${nextFrozen ? 'frozen' : 'unfrozen'} successfully.`
    );
    setFreezeModalOpen(false);
    setBatchToFreeze(null);
  }

  function sortIcon(column) {
    if (sortColumn !== column) return 'ti-arrows-vertical';
    return sortReverse ? 'ti-arrow-down' : 'ti-arrow-up';
  }

  return (
    <section className="batch-management-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="page-header-section">
        <div>
          <h2>Batch Management</h2>
          <p>Organize students into batches, manage courses, and control access without changing the existing workflow.</p>
        </div>
        <button type="button" className="create-batch-button" onClick={openCreateBatchModal}>
          <i className="ti ti-plus" /> Create New Batch
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`} onClick={() => setSearchQuery('')} aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search batches by name, course, or status..."
          />
        </div>
      </div>

      {sortedBatches.length === 0 && !isLoading ? (
        <div className="empty-state">
          <i className="ti ti-layout-grid2" />
          <h3>No Batches Found</h3>
          <p>Create your first batch to start organizing students</p>
          <button type="button" className="legacy-btn legacy-btn-success" onClick={openCreateBatchModal}>
            <i className="ti ti-plus" /> Create First Batch
          </button>
        </div>
      ) : null}

      {(sortedBatches.length > 0 || isLoading) && (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className={`sortable ${sortColumn === 'batchName' ? 'active' : ''}`} onClick={() => handleSort('batchName')}>
                  Batch Name
                  <i className={`sort-icon ti ${sortIcon('batchName')}`} />
                </th>
                <th className={`sortable center-align ${sortColumn === 'studentCount' ? 'active' : ''}`} onClick={() => handleSort('studentCount')}>
                  Students
                  <i className={`sort-icon ti ${sortIcon('studentCount')}`} />
                </th>
                <th>Course</th>
                <th className={`sortable ${sortColumn === 'startDate' ? 'active' : ''}`} onClick={() => handleSort('startDate')}>
                  Commence
                  <i className={`sort-icon ti ${sortIcon('startDate')}`} />
                </th>
                <th className={`sortable ${sortColumn === 'endDate' ? 'active' : ''}`} onClick={() => handleSort('endDate')}>
                  Conclude
                  <i className={`sort-icon ti ${sortIcon('endDate')}`} />
                </th>
                <th className={`sortable center-align ${sortColumn === 'status' ? 'active' : ''}`} onClick={() => handleSort('status')}>
                  Status
                  <i className={`sort-icon ti ${sortIcon('status')}`} />
                </th>
                <th className="center-align actions-column">Actions</th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: 10 }, (_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td>
                      <div className="batch-skeleton long" />
                      <div className="batch-skeleton medium small-gap" />
                    </td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton medium" /></td>
                    <td><div className="batch-skeleton short" /></td>
                    <td><div className="batch-skeleton short" /></td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton icon centered" /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody ref={kebabRef}>
                {paginatedBatches.map((batch) => (
                  <tr key={batch.id} className={activeKebabId === batch.id ? 'row-active-menu' : ''}>
                    <td>
                      <div className="batch-name">{batch.batchName}</div>
                      {batch.description ? <div className="batch-description">{batch.description}</div> : null}
                    </td>
                    <td className="center-align">
                      <div className="student-count" onClick={() => openStudentsModal(batch)}>
                        {batch.students.length} / {batch.numberOfStudents}
                      </div>
                      {getUnenrolledStudentsInBatch(batch) > 0 ? (
                        <div className="course-info">
                          <span className="badge badge-warning">
                            <i className="ti ti-alert" /> {getUnenrolledStudentsInBatch(batch)} not enrolled
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {batch.enrolledCourses.length > 0 ? (
                        <div className="batch-courses">
                          {batch.enrolledCourses.map((course) => (
                            <span key={`${batch.id}-${course}`} className="batch-course-badge">
                              <i className="ti ti-book" /> {course}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="course-info muted">
                          <i className="ti ti-info-alt" /> Not enrolled to any course
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={`course-info ${!batch.startDate ? 'muted' : ''}`}>
                        {batch.startDate ? <><i className="ti ti-calendar" /> {formatDate(batch.startDate)}</> : 'Not set'}
                      </div>
                    </td>
                    <td>
                      <div className={`course-info ${!batch.endDate ? 'muted' : ''}`}>
                        {batch.endDate ? <><i className="ti ti-flag" /> {formatDate(batch.endDate)}</> : 'Not set'}
                      </div>
                    </td>
                    <td className="center-align">
                      <span className={`batch-status ${getBatchStatusClass(batch)}`}>{getBatchStatus(batch)}</span>
                    </td>
                    <td className={`center-align ${activeKebabId === batch.id ? 'cell-active-menu' : ''}`}>
                      <div className="kebab-menu-container">
                        <button type="button" className="kebab-button" onClick={(event) => toggleKebab(batch.id, event)}>
                          <i className="ti ti-more-alt" />
                        </button>
                        <div className={`kebab-dropdown ${activeKebabId === batch.id ? 'active' : ''}`}>
                          <button type="button" className="kebab-dropdown-item view-profile" onClick={() => openManageCourses(batch)}>
                            <i className="ti ti-book" />
                            <span className="item-label">Manage Courses</span>
                          </button>
                          <button type="button" className="kebab-dropdown-item manage-students" onClick={() => openAddStudentsModal(batch)}>
                            <i className="ti ti-user" />
                            <span className="item-label">Manage Students</span>
                          </button>
                          <button type="button" className="kebab-dropdown-item edit-action" onClick={() => openEditBatchModal(batch)}>
                            <i className="ti ti-pencil" />
                            <span className="item-label">Modify Batch Details</span>
                          </button>
                          <button
                            type="button"
                            className={`kebab-dropdown-item ${batch.isFrozen ? 'enable-action' : 'draft-action'}`}
                            onClick={() => openFreezeModal(batch)}
                          >
                            <i className={`ti ${batch.isFrozen ? 'ti-unlock' : 'ti-lock'}`} />
                            <span className="item-label">{batch.isFrozen ? 'Unfreeze' : 'Freeze'} Batch</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          <div className="pagination-container">
            <div className="pagination-info">
              <span>
                Showing {showingStart} to {showingEnd} of {sortedBatches.length} entries
              </span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={50}>Show 50</option>
                <option value={200}>Show 200</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                <i className="ti ti-angle-left" /> Previous
              </button>
              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn ${safeCurrentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next <i className="ti ti-angle-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`legacy-modal-backdrop ${batchModalOpen ? 'active' : ''}`} onClick={() => setBatchModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>{editingBatch ? 'Modify Batch Details' : 'Create New Batch'}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setBatchModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            <div className="batch-form-grid">
              <label>
                <span>Batch Name *</span>
                <input
                  type="text"
                  className="search-input"
                  value={batchDraft?.batchName || ''}
                  onChange={(event) => setBatchDraft((current) => ({ ...current, batchName: event.target.value }))}
                />
              </label>
              <label>
                <span>Number of Students *</span>
                <input
                  type="number"
                  className="search-input"
                  value={batchDraft?.numberOfStudents || ''}
                  onChange={(event) => setBatchDraft((current) => ({ ...current, numberOfStudents: event.target.value }))}
                />
              </label>
              <label>
                <span>Commence Date</span>
                <input
                  type="date"
                  className="search-input"
                  value={batchDraft?.startDate || ''}
                  onChange={(event) => setBatchDraft((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>
              <label>
                <span>Conclude Date</span>
                <input
                  type="date"
                  className="search-input"
                  value={batchDraft?.endDate || ''}
                  onChange={(event) => setBatchDraft((current) => ({ ...current, endDate: event.target.value }))}
                />
              </label>
              <label className="full-span">
                <span>Description</span>
                <textarea
                  className="search-input textarea-like"
                  value={batchDraft?.description || ''}
                  onChange={(event) => setBatchDraft((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
            </div>
          </div>
          <div className="legacy-modal-footer">
            <button type="button" className="legacy-btn legacy-btn-default" onClick={() => setBatchModalOpen(false)}>Cancel</button>
            <button type="button" className="legacy-btn legacy-btn-success" onClick={saveBatch}>
              <i className={`ti ${editingBatch ? 'ti-check' : 'ti-plus'}`} /> {editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </div>
      </div>

      <div className={`legacy-modal-backdrop ${enrollCourseModalOpen ? 'active' : ''}`} onClick={() => setEnrollCourseModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>Manage Courses</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setEnrollCourseModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            {selectedBatch ? (
              <>
                <div className="batch-modal-summary">
                  <div className="batch-modal-title">{selectedBatch.batchName}</div>
                  <div className="batch-modal-subtitle">{selectedBatch.students.length} students will inherit access to newly added courses.</div>
                </div>
                <div className="batch-course-toolbar">
                  <select className="search-input" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
                    <option value="">Select a course to add</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                  </select>
                  <button type="button" className="legacy-btn legacy-btn-success" onClick={addCourseToBatch}>
                    <i className="ti ti-plus" /> Add Course
                  </button>
                </div>
                <div className="batch-course-list">
                  {selectedBatch.enrolledCourses.length > 0 ? (
                    selectedBatch.enrolledCourses.map((course) => (
                      <div key={course} className="batch-course-row">
                        <div>
                          <div className="batch-course-row-title">{course}</div>
                          <div className="batch-course-row-meta">Currently assigned to this batch</div>
                        </div>
                        <button type="button" className="legacy-btn legacy-btn-default" onClick={() => removeCourseFromBatch(course)}>
                          <i className="ti ti-trash" /> Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="batch-empty-panel">No courses are currently enrolled to this batch.</div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`legacy-modal-backdrop ${studentsModalOpen ? 'active' : ''}`} onClick={() => setStudentsModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>Batch Students</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setStudentsModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            {selectedBatch ? (
              <>
                <div className="batch-modal-summary">
                  <div className="batch-modal-title">{selectedBatch.batchName}</div>
                  <div className="batch-modal-subtitle">Review student enrollment and remove students in bulk.</div>
                </div>
                <div className="batch-students-toolbar">
                  <div className="search-wrapper">
                    <i className="ti ti-search" />
                    <input
                      type="text"
                      className="search-input"
                      value={studentSearchQuery}
                      onChange={(event) => setStudentSearchQuery(event.target.value)}
                      placeholder="Search students by name, email, or phone..."
                    />
                  </div>
                  <div className="student-filter-tabs">
                    {['all', 'enrolled', 'not-enrolled'].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={studentFilter === filter ? 'active' : ''}
                        onClick={() => setStudentFilter(filter)}
                      >
                        {filter === 'all' ? 'All Students' : filter === 'enrolled' ? 'Enrolled' : 'Not Enrolled'}
                      </button>
                    ))}
                  </div>
                </div>
                <table className="legacy-modal-table batch-students-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={visibleBatchStudents.length > 0 && visibleBatchStudents.every((student) => selectedBatchStudents[student.id])}
                          onChange={(event) => toggleSelectAllBatchStudents(event.target.checked)}
                        />
                      </th>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Added On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBatchStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="checkbox-column">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedBatchStudents[student.id])}
                            onChange={() => toggleBatchStudentSelection(student)}
                          />
                        </td>
                        <td>
                          <div className="batch-student-cell">
                            <div className="batch-student-avatar">{getStudentInitials(student.name)}</div>
                            <div>
                              <div className="batch-student-name">{student.name}</div>
                              <div className="batch-student-id">{student.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="batch-contact-line">{student.email}</div>
                          <div className="batch-contact-line">{student.phone}</div>
                        </td>
                        <td>
                          <span className={`batch-student-status ${student.enrolledToCourse ? 'enrolled' : 'not-enrolled'}`}>
                            {student.enrolledToCourse ? 'Enrolled' : 'Not Enrolled'}
                          </span>
                        </td>
                        <td>{formatDate(student.addedOn)}</td>
                      </tr>
                    ))}
                    {visibleBatchStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5}><div className="batch-empty-panel">No students match the selected filter.</div></td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : null}
          </div>
          <div className="legacy-modal-footer">
            <button type="button" className="legacy-btn legacy-btn-default" onClick={() => openAddStudentsModal(selectedBatch)}>
              <i className="ti ti-user" /> Add Students
            </button>
            <button type="button" className="legacy-btn legacy-btn-danger" onClick={removeSelectedStudents}>
              <i className="ti ti-trash" /> Remove Selected
            </button>
          </div>
        </div>
      </div>

      <div className={`legacy-modal-backdrop ${addStudentsModalOpen ? 'active' : ''}`} onClick={() => setAddStudentsModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>Manage Students</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setAddStudentsModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            {selectedBatch ? (
              <>
                <div className="batch-modal-summary">
                  <div className="batch-modal-title">{selectedBatch.batchName}</div>
                  <div className="batch-modal-subtitle">Select students to add into this batch. New students are added as not enrolled by default.</div>
                </div>
                <div className="search-wrapper batch-modal-search">
                  <i className="ti ti-search" />
                  <input
                    type="text"
                    className="search-input"
                    value={studentSearchQuery}
                    onChange={(event) => setStudentSearchQuery(event.target.value)}
                    placeholder="Search available students..."
                  />
                </div>
                <table className="legacy-modal-table batch-students-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={availableStudentsForBatch.length > 0 && availableStudentsForBatch.every((student) => selectedStudentsToAdd[student.id])}
                          onChange={(event) => toggleSelectAllStudentsToAdd(event.target.checked)}
                        />
                      </th>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableStudentsForBatch.map((student) => (
                      <tr key={student.id}>
                        <td className="checkbox-column">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedStudentsToAdd[student.id])}
                            onChange={() => toggleStudentToAdd(student)}
                          />
                        </td>
                        <td>
                          <div className="batch-student-cell">
                            <div className="batch-student-avatar">{getStudentInitials(student.name)}</div>
                            <div>
                              <div className="batch-student-name">{student.name}</div>
                              <div className="batch-student-id">{student.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="batch-contact-line">{student.email}</div>
                          <div className="batch-contact-line">{student.phone}</div>
                        </td>
                        <td>
                          <span className={`batch-student-status ${student.status === 'active' ? 'enrolled' : 'not-enrolled'}`}>
                            {student.status === 'active' ? 'Available' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {availableStudentsForBatch.length === 0 ? (
                      <tr>
                        <td colSpan={4}><div className="batch-empty-panel">No available students found for this batch.</div></td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : null}
          </div>
          <div className="legacy-modal-footer">
            <div className="batch-selection-count">{Object.keys(selectedStudentsToAdd).length} selected</div>
            <button type="button" className="legacy-btn legacy-btn-default" onClick={() => setAddStudentsModalOpen(false)}>Cancel</button>
            <button type="button" className="legacy-btn legacy-btn-success" onClick={confirmAddStudents}>
              <i className="ti ti-plus" /> Add Selected Students
            </button>
          </div>
        </div>
      </div>

      <div className={`legacy-modal-backdrop ${freezeModalOpen ? 'active' : ''}`} onClick={() => setFreezeModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-confirm" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className={`legacy-modal-header ${batchToFreeze && !batchToFreeze.isFrozen ? 'legacy-danger-header' : ''}`}>
            <h3>{batchToFreeze?.isFrozen ? 'Unfreeze Batch' : 'Freeze Batch'}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setFreezeModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            {batchToFreeze ? (
              <p className="batch-freeze-copy">
                {batchToFreeze.isFrozen
                  ? `Do you want to unfreeze "${batchToFreeze.batchName}" and restore edit access?`
                  : `Do you want to freeze "${batchToFreeze.batchName}"? This keeps the batch visible but prevents operational changes until it is unfrozen.`}
              </p>
            ) : null}
          </div>
          <div className="legacy-modal-footer">
            <button type="button" className="legacy-btn legacy-btn-default" onClick={() => setFreezeModalOpen(false)}>Cancel</button>
            <button type="button" className={`legacy-btn ${batchToFreeze?.isFrozen ? 'legacy-btn-success' : 'legacy-btn-danger'}`} onClick={confirmFreeze}>
              <i className={`ti ${batchToFreeze?.isFrozen ? 'ti-unlock' : 'ti-lock'}`} />
              {batchToFreeze?.isFrozen ? 'Unfreeze Batch' : 'Freeze Batch'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
