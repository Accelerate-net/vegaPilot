// Exam Attempt Report Controller - Displays rank list and analytics for exams
var examReportApp = angular.module('examReportApp', []);

examReportApp.controller('examReportController', ['$scope', '$window', function($scope, $window) {

    // ===== Initialize Scope Variables =====
    $scope.exam = null;
    $scope.rankings = [];
    $scope.searchQuery = '';
    $scope.statusFilter = 'all';
    $scope.courseId = null;
    $scope.moduleId = null;
    $scope.chapterId = null;
    $scope.partId = null;
    $scope.courseInfo = null;

    // Date filters
    $scope.dateFrom = null;
    $scope.dateTo = null;

    // Course and Batch filters
    $scope.selectedCourseFilter = '';
    $scope.selectedBatchFilters = []; // Array for multi-select
    $scope.availableCourses = [];
    $scope.availableBatches = [];
    $scope.filteredBatchesForCourse = [];
    $scope.batchDropdownOpen = false; // For dropdown toggle

    // Pagination
    $scope.currentPage = 1;
    $scope.pageSize = 20;
    $scope.pageSizeOptions = [20, 50, 100, 200];

    // Sorting
    $scope.sortColumn = 'rank';
    $scope.sortDirection = 'asc'; // 'asc' or 'desc'

    // Re-evaluate modal
    $scope.showReEvaluateModal = false;

    // Export modal
    $scope.showExportModal = false;

    // Export column selection (all selected by default)
    $scope.exportColumns = {
        rank: true,
        studentName: true,
        rollNumber: true,
        totalScore: true,
        percentage: true,
        totalAttempts: true,
        correctAttempts: true,
        wrongAttempts: true
    };

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.loadUrlParams();
        $scope.loadCoursesAndBatches();
        $scope.loadExamData();
        if ($scope.courseId) {
            $scope.loadCourseInfo();
        }
        $scope.calculateRankings();
    };

    // ===== Load Courses and Batches =====
    $scope.loadCoursesAndBatches = function() {
        // Mock data for courses
        $scope.availableCourses = [
            { id: 'CR001', name: 'IAT 2026 – Exclusive 1 Year Course', code: 'IAT-2026' },
            { id: 'CR002', name: 'NEET 2026 Complete Preparation', code: 'NEET-2026' },
            { id: 'CR003', name: 'JEE Advanced 2026 Crash Course', code: 'JEE-2026' },
            { id: 'CR004', name: 'Foundation Course - Class 11', code: 'FOUND-11' },
            { id: 'CR005', name: 'Foundation Course - Class 12', code: 'FOUND-12' }
        ];

        // Mock data for batches
        $scope.availableBatches = [
            { id: 'BATCH-001', name: 'IAT 2026 - Batch A', courseId: 'CR001', students: ['STU-001', 'STU-002', 'STU-003'] },
            { id: 'BATCH-002', name: 'IAT 2026 - Batch B', courseId: 'CR001', students: ['STU-004', 'STU-005', 'STU-006'] },
            { id: 'BATCH-003', name: 'NEET 2026 - Morning Batch', courseId: 'CR002', students: ['STU-007', 'STU-008', 'STU-009'] },
            { id: 'BATCH-004', name: 'NEET 2026 - Evening Batch', courseId: 'CR002', students: ['STU-010', 'STU-011', 'STU-012'] },
            { id: 'BATCH-005', name: 'JEE 2026 - Weekend Batch', courseId: 'CR003', students: ['STU-013', 'STU-014', 'STU-015'] },
            { id: 'BATCH-006', name: 'Foundation Batch 2025-A', courseId: 'CR004', students: ['STU-016', 'STU-017', 'STU-018'] },
            { id: 'BATCH-007', name: 'Foundation Batch 2025-B', courseId: 'CR005', students: ['STU-019', 'STU-020', 'STU-021'] }
        ];
    };

    // ===== Load URL Parameters =====
    $scope.loadUrlParams = function() {
        var urlParams = new URLSearchParams($window.location.search);
        $scope.courseId = urlParams.get('course');
        $scope.moduleId = urlParams.get('module');
        $scope.chapterId = urlParams.get('chapter');
        $scope.partId = urlParams.get('part');

        console.log('URL Parameters:', {
            course: $scope.courseId,
            module: $scope.moduleId,
            chapter: $scope.chapterId,
            part: $scope.partId
        });
    };

    // ===== Get Exam ID from URL =====
    $scope.getExamIdFromUrl = function() {
        var urlParams = new URLSearchParams($window.location.search);
        return urlParams.get('exam');
    };

    // ===== Load Course Info =====
    $scope.loadCourseInfo = function() {
        // This would typically come from a backend API
        // For now, we'll create a mock course info based on the course ID
        $scope.courseInfo = {
            id: $scope.courseId,
            name: 'Course ' + $scope.courseId,
            module: $scope.moduleId ? 'Module ' + $scope.moduleId : null,
            chapter: $scope.chapterId ? 'Chapter ' + $scope.chapterId : null,
            part: $scope.partId ? 'Part ' + $scope.partId : null
        };
    };

    // ===== Load Exam Data =====
    $scope.loadExamData = function() {
        var examId = $scope.getExamIdFromUrl();

        // Try to get from localStorage first (passed from listing page)
        var reportExamData = localStorage.getItem('reportExamData');
        if (reportExamData) {
            try {
                $scope.exam = JSON.parse(reportExamData);
                console.log('Loaded exam from localStorage:', $scope.exam);
                // Clear after loading
                localStorage.removeItem('reportExamData');

                // If exam exists but has no attempts, add sample data
                if (!$scope.exam.attempts || $scope.exam.attempts.length === 0) {
                    $scope.exam.attempts = $scope.generateSampleAttempts();
                }
                return;
            } catch (e) {
                console.error('Error parsing exam data:', e);
            }
        }

        // Fallback: Try to find in published exams
        var publishedExams = localStorage.getItem('publishedExams');
        if (publishedExams) {
            try {
                var exams = JSON.parse(publishedExams);
                $scope.exam = exams.find(function(e) { return e.id === examId; });

                if (!$scope.exam) {
                    // Try drafts
                    var draftExams = localStorage.getItem('examDrafts');
                    if (draftExams) {
                        var drafts = JSON.parse(draftExams);
                        $scope.exam = drafts.find(function(e) { return e.id === examId; });
                    }
                }
            } catch (e) {
                console.error('Error loading exam:', e);
            }
        }

        if (!$scope.exam) {
            console.error('Exam not found for ID:', examId);

            // Create sample exam with dummy attempts
            $scope.exam = {
                id: examId || 'EXAM-001',
                title: 'IAT 2026 - Full Length Mock Test 1',
                brief: 'Comprehensive mock test for IISER Aptitude Test 2026 preparation covering all sections',
                totalQuestions: 60,
                duration: 180,
                maximumMarks: 240,
                numberOfSections: 3,
                status: 'published',
                sectionsData: [
                    { name: 'Mathematics', questions: 20, marks: 80 },
                    { name: 'Physics', questions: 20, marks: 80 },
                    { name: 'Chemistry', questions: 20, marks: 80 }
                ],
                attempts: $scope.generateSampleAttempts()
            };
        }

        // If exam exists but has no attempts, add sample data
        if ($scope.exam && (!$scope.exam.attempts || $scope.exam.attempts.length === 0)) {
            $scope.exam.attempts = $scope.generateSampleAttempts();
        }
    };

    // ===== Get Status Label =====
    $scope.getStatusLabel = function(status) {
        var statusLabels = {
            'draft': 'Draft',
            'published': 'Published',
            'scheduled': 'Scheduled',
            'completed': 'Completed',
            'archived': 'Archived'
        };
        return statusLabels[status] || status;
    };

    // ===== Generate Sample Attempts =====
    $scope.generateSampleAttempts = function() {
        var studentNames = [
            'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
            'Anjali Gupta', 'Arjun Mehta', 'Divya Iyer', 'Karan Verma', 'Neha Joshi',
            'Rahul Desai', 'Pooja Nair', 'Siddharth Rao', 'Kavya Menon', 'Aditya Shah',
            'Ritu Agarwal', 'Varun Khanna', 'Meera Pillai', 'Rohan Malhotra', 'Shruti Kapoor',
            'Nikhil Bose', 'Ananya Das', 'Harsh Jain', 'Ishita Banerjee', 'Saurabh Mishra'
        ];

        var attempts = [];
        var now = new Date();
        var courseIds = ['CR001', 'CR002', 'CR003', 'CR004', 'CR005'];
        var studentIdPrefix = 'STU-';

        for (var i = 0; i < 25; i++) {
            var daysAgo = Math.floor(Math.random() * 30); // Last 30 days
            var hoursAgo = Math.floor(Math.random() * 24);
            var startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));

            var isCompleted = Math.random() > 0.2; // 80% completion rate
            var score = isCompleted ? Math.floor(Math.random() * 241) : 0; // 0-240
            var timeTaken = Math.floor(Math.random() * 180) + 60; // 60-240 minutes

            var endDate = isCompleted ? new Date(startDate.getTime() + (timeTaken * 60 * 1000)) : null;

            attempts.push({
                studentId: studentIdPrefix + String(i + 1).padStart(3, '0'),
                studentName: studentNames[i],
                studentEmail: studentNames[i].toLowerCase().replace(' ', '.') + '@example.com',
                rollNumber: 'R' + (2024000 + i + 1), // Roll numbers like R2024001, R2024002, etc.
                courseId: courseIds[i % courseIds.length],
                startedAt: startDate.toISOString(),
                completedAt: endDate ? endDate.toISOString() : null,
                status: isCompleted ? 'completed' : 'in-progress',
                score: score,
                correctAnswers: isCompleted ? Math.floor((score / 240) * 60) : 0,
                incorrectAnswers: isCompleted ? Math.floor(Math.random() * 15) : 0,
                unattempted: isCompleted ? 60 - Math.floor((score / 240) * 60) - Math.floor(Math.random() * 15) : 60
            });
        }

        return attempts;
    };

    // ===== Calculate Rankings =====
    $scope.calculateRankings = function() {
        if (!$scope.exam || !$scope.exam.attempts) {
            $scope.rankings = [];
            return;
        }

        var attempts = $scope.exam.attempts;

        // Filter by course enrollment if course parameter is present
        if ($scope.courseId) {
            attempts = $scope.filterByCourseEnrollment(attempts);
        }

        // Get only completed attempts for ranking
        var completedAttempts = attempts.filter(function(attempt) {
            return attempt.status === 'completed';
        });

        // Sort by score (descending)
        completedAttempts.sort(function(a, b) {
            return b.score - a.score;
        });

        // Assign ranks
        var currentRank = 1;
        var maximumMarks = $scope.exam.maximumMarks || 240;
        for (var i = 0; i < completedAttempts.length; i++) {
            if (i > 0 && completedAttempts[i].score < completedAttempts[i - 1].score) {
                currentRank = i + 1;
            }
            completedAttempts[i].rank = currentRank;
            completedAttempts[i].percentage = Math.round((completedAttempts[i].score / maximumMarks) * 100);
            completedAttempts[i].timeTaken = $scope.calculateTimeTaken(completedAttempts[i]);
        }

        // Add in-progress attempts without ranks
        var inProgressAttempts = $scope.exam.attempts.filter(function(attempt) {
            return attempt.status === 'in-progress';
        }).map(function(attempt) {
            attempt.rank = '-';
            attempt.percentage = 0;
            attempt.timeTaken = '-';
            return attempt;
        });

        // Combine: completed first, then in-progress
        $scope.rankings = completedAttempts.concat(inProgressAttempts);
    };

    // ===== Calculate Time Taken =====
    $scope.calculateTimeTaken = function(attempt) {
        if (!attempt.startedAt || !attempt.completedAt) {
            return 'N/A';
        }

        var startTime = new Date(attempt.startedAt).getTime();
        var endTime = new Date(attempt.completedAt).getTime();
        var diffMs = endTime - startTime;

        var diffMins = Math.floor(diffMs / 60000);
        var diffSecs = Math.floor((diffMs % 60000) / 1000);

        if (diffMins > 0) {
            return diffMins + ' min ' + diffSecs + ' sec';
        } else {
            return diffSecs + ' sec';
        }
    };

    // ===== Get Filtered Rankings =====
    $scope.getFilteredRankings = function() {
        var filtered = $scope.rankings;

        // Filter by status
        if ($scope.statusFilter && $scope.statusFilter !== 'all') {
            filtered = filtered.filter(function(ranking) {
                return ranking.status === $scope.statusFilter;
            });
        }

        // Filter by search query
        if ($scope.searchQuery && $scope.searchQuery.trim() !== '') {
            var query = $scope.searchQuery.toLowerCase();
            filtered = filtered.filter(function(ranking) {
                var nameMatch = ranking.studentName && ranking.studentName.toLowerCase().indexOf(query) !== -1;
                var emailMatch = ranking.studentEmail && ranking.studentEmail.toLowerCase().indexOf(query) !== -1;
                var rollMatch = ranking.rollNumber && ranking.rollNumber.toLowerCase().indexOf(query) !== -1;
                return nameMatch || emailMatch || rollMatch;
            });
        }

        // Filter by date range (with time)
        if ($scope.dateFrom) {
            var fromDateTime = new Date($scope.dateFrom);
            filtered = filtered.filter(function(ranking) {
                if (!ranking.startedAt) return false;
                var attemptDateTime = new Date(ranking.startedAt);
                return attemptDateTime >= fromDateTime;
            });
        }

        if ($scope.dateTo) {
            var toDateTime = new Date($scope.dateTo);
            filtered = filtered.filter(function(ranking) {
                if (!ranking.startedAt) return false;
                var attemptDateTime = new Date(ranking.startedAt);
                return attemptDateTime <= toDateTime;
            });
        }

        // Filter by course
        if ($scope.selectedCourseFilter) {
            filtered = filtered.filter(function(ranking) {
                return ranking.courseId === $scope.selectedCourseFilter;
            });
        }

        // Filter by batches (multi-select)
        if ($scope.selectedBatchFilters && $scope.selectedBatchFilters.length > 0) {
            // Get all students from selected batches
            var studentsInSelectedBatches = [];
            $scope.selectedBatchFilters.forEach(function(batchId) {
                var batch = $scope.availableBatches.find(function(b) {
                    return b.id === batchId;
                });
                if (batch && batch.students) {
                    studentsInSelectedBatches = studentsInSelectedBatches.concat(batch.students);
                }
            });

            filtered = filtered.filter(function(ranking) {
                return studentsInSelectedBatches.indexOf(ranking.studentId) !== -1;
            });
        }

        // Apply sorting
        filtered = $scope.applySorting(filtered);

        return filtered;
    };

    // ===== Apply Sorting =====
    $scope.applySorting = function(data) {
        if (!$scope.sortColumn) return data;

        return data.slice().sort(function(a, b) {
            var valA, valB;

            switch ($scope.sortColumn) {
                case 'rank':
                    valA = a.rank || 9999;
                    valB = b.rank || 9999;
                    break;
                case 'studentName':
                    valA = (a.studentName || '').toLowerCase();
                    valB = (b.studentName || '').toLowerCase();
                    break;
                case 'rollNumber':
                    valA = (a.rollNumber || '').toLowerCase();
                    valB = (b.rollNumber || '').toLowerCase();
                    break;
                case 'percentage':
                    valA = a.percentage || 0;
                    valB = b.percentage || 0;
                    break;
                default:
                    return 0;
            }

            var comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;

            return $scope.sortDirection === 'desc' ? -comparison : comparison;
        });
    };

    // ===== Sort By Column =====
    $scope.sortBy = function(column) {
        if ($scope.sortColumn === column) {
            // Toggle direction if same column
            $scope.sortDirection = $scope.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            $scope.sortColumn = column;
            $scope.sortDirection = 'asc';
        }
        $scope.currentPage = 1; // Reset to first page when sorting changes
    };

    // ===== Get Sort Icon =====
    $scope.getSortIcon = function(column) {
        if ($scope.sortColumn !== column) {
            return 'ti-exchange-vertical'; // Neutral icon
        }
        return $scope.sortDirection === 'asc' ? 'ti-angle-up' : 'ti-angle-down';
    };

    // ===== Get Paginated Rankings =====
    $scope.getPaginatedRankings = function() {
        var filtered = $scope.getFilteredRankings();
        var startIndex = ($scope.currentPage - 1) * $scope.pageSize;
        var endIndex = startIndex + $scope.pageSize;
        return filtered.slice(startIndex, endIndex);
    };

    // ===== Get Total Pages =====
    $scope.getTotalPages = function() {
        var filtered = $scope.getFilteredRankings();
        return Math.ceil(filtered.length / $scope.pageSize);
    };

    // ===== Go to Page =====
    $scope.goToPage = function(page) {
        var totalPages = $scope.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            $scope.currentPage = page;
        }
    };

    // ===== Previous Page =====
    $scope.prevPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
        }
    };

    // ===== Next Page =====
    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
        }
    };

    // ===== On Page Size Change =====
    $scope.onPageSizeChange = function() {
        $scope.currentPage = 1; // Reset to first page when page size changes
    };

    // ===== Get Page Numbers for Display =====
    $scope.getPageNumbers = function() {
        var totalPages = $scope.getTotalPages();
        var currentPage = $scope.currentPage;
        var pages = [];

        if (totalPages <= 7) {
            // Show all pages if 7 or fewer
            for (var i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first, last, and pages around current
            if (currentPage <= 4) {
                for (var i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (var i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (var i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // ===== Get Start Index (for display) =====
    $scope.getStartIndex = function() {
        var filtered = $scope.getFilteredRankings();
        if (filtered.length === 0) return 0;
        return ($scope.currentPage - 1) * $scope.pageSize + 1;
    };

    // ===== Get End Index (for display) =====
    $scope.getEndIndex = function() {
        var filtered = $scope.getFilteredRankings();
        var endIndex = $scope.currentPage * $scope.pageSize;
        return Math.min(endIndex, filtered.length);
    };

    // ===== Get Total Attempts =====
    $scope.getTotalAttempts = function() {
        return $scope.rankings.length;
    };

    // ===== Get Completed Count =====
    $scope.getCompletedCount = function() {
        return $scope.rankings.filter(function(r) {
            return r.status === 'completed';
        }).length;
    };

    // ===== Get In Progress Count =====
    $scope.getInProgressCount = function() {
        return $scope.rankings.filter(function(r) {
            return r.status === 'in-progress';
        }).length;
    };

    // ===== Get Average Score =====
    $scope.getAverageScore = function() {
        var completed = $scope.rankings.filter(function(r) {
            return r.status === 'completed';
        });

        if (completed.length === 0) {
            return 0;
        }

        var totalPercentage = completed.reduce(function(sum, r) {
            return sum + r.percentage;
        }, 0);

        return Math.round(totalPercentage / completed.length);
    };

    // ===== Get Rank Class =====
    $scope.getRankClass = function(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'rank-other';
    };

    // ===== Get Score Class =====
    $scope.getScoreClass = function(percentage) {
        if (percentage >= 90) return 'score-excellent';
        if (percentage >= 75) return 'score-good';
        if (percentage >= 60) return 'score-average';
        return 'score-poor';
    };

    // ===== Filter By Course Enrollment =====
    $scope.filterByCourseEnrollment = function(attempts) {
        // In a real application, this would check against enrolled students from a backend
        // For now, we'll simulate by checking if the student has the course in their profile

        // Try to load course enrollments from localStorage
        var courseEnrollments = localStorage.getItem('courseEnrollments_' + $scope.courseId);

        if (!courseEnrollments) {
            // If no specific enrollments found, return all attempts
            // In production, you might want to return empty array or fetch from backend
            console.log('No course enrollment data found for course:', $scope.courseId);
            return attempts;
        }

        try {
            var enrolledStudents = JSON.parse(courseEnrollments);

            // Filter attempts to only include enrolled students
            return attempts.filter(function(attempt) {
                // Check if student email is in enrolled students list
                return enrolledStudents.some(function(student) {
                    return student.email === attempt.studentEmail;
                });
            });
        } catch (e) {
            console.error('Error parsing course enrollments:', e);
            return attempts;
        }
    };

    // ===== Format Date Time =====
    $scope.formatDateTime = function(dateTimeStr) {
        if (!dateTimeStr) return 'Not set';

        var date;
        if (typeof dateTimeStr === 'number') {
            date = new Date(dateTimeStr);
        } else if (dateTimeStr.indexOf('T') !== -1) {
            date = new Date(dateTimeStr);
        } else {
            return dateTimeStr;
        }

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var formattedDate = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var formattedTime = hours + ':' + minutes + ' ' + ampm;

        return formattedDate + ' ' + formattedTime;
    };

    // ===== Format Filter Date (for active filters display) =====
    $scope.formatFilterDate = function(dateTimeValue) {
        if (!dateTimeValue) return 'Not Set';

        var date;
        // Handle Date object (from datetime-local ng-model binding)
        if (dateTimeValue instanceof Date) {
            date = dateTimeValue;
        }
        // Handle string format (e.g., "2026-01-22T10:28" or ISO string)
        else if (typeof dateTimeValue === 'string' && dateTimeValue.indexOf('T') !== -1) {
            date = new Date(dateTimeValue);
        }
        // Fallback: try to parse as Date
        else {
            date = new Date(dateTimeValue);
        }

        if (isNaN(date.getTime())) return 'Invalid Date';

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var day = date.getDate();
        var month = months[date.getMonth()];
        var year = date.getFullYear();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return month + ' ' + day + ', ' + year + ' at ' + hours + ':' + minutes + ' ' + ampm;
    };

    // ===== Filter Helper Functions =====

    // Course change handler
    $scope.onCourseChange = function() {
        // Reset batch filters when course changes
        $scope.selectedBatchFilters = [];
        $scope.batchDropdownOpen = false;

        // Filter batches for selected course
        if ($scope.selectedCourseFilter) {
            $scope.filteredBatchesForCourse = $scope.availableBatches.filter(function(batch) {
                return batch.courseId === $scope.selectedCourseFilter;
            });
        } else {
            $scope.filteredBatchesForCourse = [];
        }
    };

    // Get course name by ID
    $scope.getCourseName = function(courseId) {
        var course = $scope.availableCourses.find(function(c) {
            return c.id === courseId;
        });
        return course ? course.name : courseId;
    };

    // Get batch name by ID
    $scope.getBatchName = function(batchId) {
        var batch = $scope.availableBatches.find(function(b) {
            return b.id === batchId;
        });
        return batch ? batch.name : batchId;
    };

    // Check if any filters are active
    $scope.hasActiveFilters = function() {
        return $scope.searchQuery ||
               $scope.statusFilter !== 'all' ||
               $scope.dateFrom ||
               $scope.dateTo ||
               $scope.selectedCourseFilter ||
               ($scope.selectedBatchFilters && $scope.selectedBatchFilters.length > 0);
    };

    // Clear all filters
    $scope.clearFilters = function() {
        $scope.searchQuery = '';
        $scope.statusFilter = 'all';
        $scope.dateFrom = null;
        $scope.dateTo = null;
        $scope.selectedCourseFilter = '';
        $scope.selectedBatchFilters = [];
        $scope.filteredBatchesForCourse = [];
        $scope.batchDropdownOpen = false;
        $scope.currentPage = 1; // Reset pagination
    };

    // Clear course filter (and batch)
    $scope.clearCourseFilter = function() {
        $scope.selectedCourseFilter = '';
        $scope.selectedBatchFilters = [];
        $scope.filteredBatchesForCourse = [];
        $scope.batchDropdownOpen = false;
    };

    // Clear date from filter
    $scope.clearDateFrom = function() {
        $scope.dateFrom = null;
        // Also clear the input element value directly for datetime-local
        var input = document.getElementById('dateFromInput');
        if (input) input.value = '';
    };

    // Clear date to filter
    $scope.clearDateTo = function() {
        $scope.dateTo = null;
        // Also clear the input element value directly for datetime-local
        var input = document.getElementById('dateToInput');
        if (input) input.value = '';
    };

    // Clear status filter
    $scope.clearStatusFilter = function() {
        $scope.statusFilter = 'all';
    };

    // Clear batch filter (all selected batches)
    $scope.clearBatchFilter = function() {
        $scope.selectedBatchFilters = [];
        $scope.batchDropdownOpen = false;
    };

    // Remove a single batch from selection
    $scope.removeBatchFilter = function(batchId) {
        var index = $scope.selectedBatchFilters.indexOf(batchId);
        if (index > -1) {
            $scope.selectedBatchFilters.splice(index, 1);
        }
    };

    // Toggle batch dropdown
    $scope.toggleBatchDropdown = function($event) {
        if ($event) {
            $event.stopPropagation();
        }
        $scope.batchDropdownOpen = !$scope.batchDropdownOpen;
    };

    // Toggle batch selection
    $scope.toggleBatchSelection = function(batchId, $event) {
        if ($event) {
            $event.stopPropagation();
        }
        var index = $scope.selectedBatchFilters.indexOf(batchId);
        if (index > -1) {
            $scope.selectedBatchFilters.splice(index, 1);
        } else {
            $scope.selectedBatchFilters.push(batchId);
        }
    };

    // Check if batch is selected
    $scope.isBatchSelected = function(batchId) {
        return $scope.selectedBatchFilters.indexOf(batchId) > -1;
    };

    // Get selected batches display text
    $scope.getSelectedBatchesText = function() {
        if (!$scope.selectedBatchFilters || $scope.selectedBatchFilters.length === 0) {
            return 'All Batches';
        }
        if ($scope.selectedBatchFilters.length === 1) {
            return $scope.getBatchName($scope.selectedBatchFilters[0]);
        }
        return $scope.selectedBatchFilters.length + ' batches selected';
    };

    // Select all batches
    $scope.selectAllBatches = function($event) {
        if ($event) {
            $event.stopPropagation();
        }
        $scope.selectedBatchFilters = $scope.filteredBatchesForCourse.map(function(b) {
            return b.id;
        });
    };

    // Clear all batch selections
    $scope.clearAllBatches = function($event) {
        if ($event) {
            $event.stopPropagation();
        }
        $scope.selectedBatchFilters = [];
    };

    // Close dropdown when clicking outside
    $scope.closeBatchDropdown = function() {
        $scope.batchDropdownOpen = false;
    };

    // ===== Re-evaluate Modal Functions =====

    // Open re-evaluate confirmation modal
    $scope.openReEvaluateModal = function() {
        $scope.showReEvaluateModal = true;
    };

    // Close re-evaluate modal
    $scope.closeReEvaluateModal = function() {
        $scope.showReEvaluateModal = false;
    };

    // Confirm and perform re-evaluation
    $scope.confirmReEvaluate = function() {
        var filteredData = $scope.getFilteredRankings();
        var attemptCount = filteredData.length;

        // Close modal
        $scope.showReEvaluateModal = false;

        // Show processing message (in a real app, this would call an API)
        console.log('Re-evaluating ' + attemptCount + ' attempts...');

        // Simulate re-evaluation process
        // In production, this would call backend API to:
        // 1. Fetch current answer keys
        // 2. Recalculate scores for each attempt
        // 3. Update rankings
        // 4. Send notifications if needed

        // For demo purposes, we'll show a success alert
        setTimeout(function() {
            alert('Successfully re-evaluated ' + attemptCount + ' response(s).\n\nScores and rankings have been updated based on the current answer keys.');

            // Recalculate rankings (simulated)
            $scope.$apply(function() {
                $scope.calculateRankings();
            });
        }, 500);
    };

    // ===== Export Modal Functions =====

    // Open export confirmation modal
    $scope.openExportModal = function() {
        $scope.showExportModal = true;
    };

    // Close export modal
    $scope.closeExportModal = function() {
        $scope.showExportModal = false;
    };

    // Confirm and perform export
    $scope.confirmExportPDF = function() {
        $scope.showExportModal = false;
        $scope.exportRankListPDF();
    };

    // Toggle export column selection
    $scope.toggleExportColumn = function(column) {
        // Check if toggling this column would leave both studentName and rollNumber unchecked
        if (column === 'studentName' && $scope.exportColumns.studentName && !$scope.exportColumns.rollNumber) {
            // Cannot uncheck studentName if rollNumber is already unchecked
            return;
        }
        if (column === 'rollNumber' && $scope.exportColumns.rollNumber && !$scope.exportColumns.studentName) {
            // Cannot uncheck rollNumber if studentName is already unchecked
            return;
        }
        // Check if toggling this column would leave both rank and totalScore unchecked
        if (column === 'rank' && $scope.exportColumns.rank && !$scope.exportColumns.totalScore) {
            // Cannot uncheck rank if totalScore is already unchecked
            return;
        }
        if (column === 'totalScore' && $scope.exportColumns.totalScore && !$scope.exportColumns.rank) {
            // Cannot uncheck totalScore if rank is already unchecked
            return;
        }
        $scope.exportColumns[column] = !$scope.exportColumns[column];
    };

    // Check if a column can be toggled off
    $scope.canToggleColumn = function(column) {
        if (column === 'studentName') {
            return !$scope.exportColumns.studentName || $scope.exportColumns.rollNumber;
        }
        if (column === 'rollNumber') {
            return !$scope.exportColumns.rollNumber || $scope.exportColumns.studentName;
        }
        if (column === 'rank') {
            return !$scope.exportColumns.rank || $scope.exportColumns.totalScore;
        }
        if (column === 'totalScore') {
            return !$scope.exportColumns.totalScore || $scope.exportColumns.rank;
        }
        return true;
    };

    // Get count of selected columns
    $scope.getSelectedColumnCount = function() {
        var count = 0;
        for (var key in $scope.exportColumns) {
            if ($scope.exportColumns[key]) count++;
        }
        return count;
    };

    // Select all export columns
    $scope.selectAllExportColumns = function() {
        for (var key in $scope.exportColumns) {
            $scope.exportColumns[key] = true;
        }
    };

    // Reset export columns to default (all selected)
    $scope.resetExportColumns = function() {
        $scope.exportColumns = {
            rank: true,
            studentName: true,
            rollNumber: true,
            totalScore: true,
            percentage: true,
            totalAttempts: true,
            correctAttempts: true,
            wrongAttempts: true
        };
    };

    // ===== Export Rank List to PDF =====
    $scope.exportRankListPDF = function() {
        var filteredData = $scope.getFilteredRankings();

        if (filteredData.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        // Get selected columns
        var cols = $scope.exportColumns;
        var maximumMarks = $scope.exam.maximumMarks || 240;

        // Generate PDF content
        var printWindow = $window.open('', '_blank');

        var html = '<!DOCTYPE html><html><head><title>Rank List - ' + $scope.exam.title + '</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
        html += 'h1 { color: #006073; font-size: 24px; margin-bottom: 5px; }';
        html += 'h2 { color: #333; font-size: 18px; margin-top: 0; }';
        html += '.header-info { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #006073; }';
        html += '.info-row { display: flex; gap: 30px; margin-bottom: 8px; font-size: 13px; }';
        html += '.info-label { font-weight: bold; color: #666; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
        html += 'th { background: #006073; color: white; padding: 12px 8px; text-align: left; font-size: 12px; border: 1px solid #004d5c; }';
        html += 'td { padding: 10px 8px; border: 1px solid #ddd; font-size: 11px; }';
        html += 'tr:nth-child(even) { background: #f8f9fa; }';
        html += '.rank-col { font-weight: bold; color: #006073; text-align: center; }';
        html += '.score-col { font-weight: bold; text-align: center; }';
        html += '.footer { margin-top: 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }';
        html += '@media print { body { margin: 0; } }';
        html += '</style></head><body>';

        // Header
        html += '<h1>Exam Rank List Report</h1>';
        html += '<h2>' + $scope.exam.title + '</h2>';

        // Exam Info
        html += '<div class="header-info">';
        html += '<div class="info-row">';
        html += '<div><span class="info-label">Total Questions:</span> ' + $scope.exam.totalQuestions + '</div>';
        html += '<div><span class="info-label">Duration:</span> ' + $scope.exam.duration + ' minutes</div>';
        html += '<div><span class="info-label">Maximum Marks:</span> ' + maximumMarks + '</div>';
        if ($scope.exam.numberOfSections) {
            html += '<div><span class="info-label">Sections:</span> ' + $scope.exam.numberOfSections + '</div>';
        }
        html += '</div>';

        // Filter Info
        if ($scope.hasActiveFilters()) {
            html += '<div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">';
            html += '<div><span class="info-label">Filters Applied:</span></div>';
            html += '</div>';
            html += '<div class="info-row">';
            if ($scope.searchQuery) html += '<div>Search: "' + $scope.searchQuery + '"</div>';
            if ($scope.statusFilter !== 'all') html += '<div>Status: ' + $scope.statusFilter + '</div>';
            if ($scope.dateFrom) html += '<div>From: ' + $scope.dateFrom + '</div>';
            if ($scope.dateTo) html += '<div>To: ' + $scope.dateTo + '</div>';
            if ($scope.selectedCourseFilter) html += '<div>Course: ' + $scope.getCourseName($scope.selectedCourseFilter) + '</div>';
            if ($scope.selectedBatchFilters && $scope.selectedBatchFilters.length > 0) {
                var batchNames = $scope.selectedBatchFilters.map(function(batchId) {
                    return $scope.getBatchName(batchId);
                }).join(', ');
                html += '<div>Batch(es): ' + batchNames + '</div>';
            }
            html += '</div>';
        }

        html += '<div class="info-row" style="margin-top: 10px;">';
        html += '<div><span class="info-label">Total Records:</span> ' + filteredData.length + '</div>';
        html += '<div><span class="info-label">Generated On:</span> ' + new Date().toLocaleString() + '</div>';
        html += '</div>';
        html += '</div>';

        // Table - Dynamic headers based on selected columns
        html += '<table>';
        html += '<thead><tr>';
        if (cols.rank) html += '<th style="width: 60px; text-align: center;">Rank</th>';
        if (cols.studentName) html += '<th style="width: 180px;">Student Name</th>';
        if (cols.rollNumber) html += '<th style="width: 120px;">Roll Number</th>';
        if (cols.totalScore) html += '<th style="width: 100px; text-align: center;">Total Score</th>';
        if (cols.percentage) html += '<th style="width: 80px; text-align: center;">Percentage</th>';
        if (cols.totalAttempts) html += '<th style="width: 100px; text-align: center;">Total Attempts</th>';
        if (cols.correctAttempts) html += '<th style="width: 100px; text-align: center;">Correct Attempts</th>';
        if (cols.wrongAttempts) html += '<th style="width: 100px; text-align: center;">Wrong Attempts</th>';
        html += '</tr></thead><tbody>';

        filteredData.forEach(function(record) {
            html += '<tr>';
            if (cols.rank) html += '<td class="rank-col">' + (record.rank || 'N/A') + '</td>';
            if (cols.studentName) html += '<td>' + record.studentName + '</td>';
            if (cols.rollNumber) html += '<td>' + (record.rollNumber || 'N/A') + '</td>';
            if (cols.totalScore) html += '<td class="score-col">' + record.score + ' / ' + maximumMarks + '</td>';
            if (cols.percentage) html += '<td class="score-col">' + (record.percentage || 0) + '%</td>';
            if (cols.totalAttempts) {
                var totalAttempts = (record.correctAnswers || 0) + (record.incorrectAnswers || 0);
                html += '<td style="text-align: center;">' + totalAttempts + '</td>';
            }
            if (cols.correctAttempts) html += '<td style="text-align: center; color: #155724;">' + (record.correctAnswers || 0) + '</td>';
            if (cols.wrongAttempts) html += '<td style="text-align: center; color: #721c24;">' + (record.incorrectAnswers || 0) + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';

        // Footer
        html += '<div class="footer">';
        html += 'Generated by VegaPilot LMS - Exam Attempt Report<br>';
        html += 'This document is auto-generated and reflects data at the time of export.';
        html += '</div>';

        html += '</body></html>';

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = function() {
            setTimeout(function() {
                printWindow.print();
            }, 250);
        };
    };

}]);
