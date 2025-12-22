/**
 * Student Management Controller
 * Angular 1.x Controller for managing student profiles
 */

var app = angular.module('StudentManagementApp', []);

app.controller('StudentManagementController', ['$scope', '$timeout', '$window', function($scope, $timeout, $window) {

    // ===== Initialize Data =====
    $scope.students = [];
    $scope.filteredStudents = [];
    $scope.paginatedStudents = [];
    $scope.searchQuery = '';
    $scope.filterCourse = '';
    $scope.filterStatus = '';
    $scope.sortBy = 'name';

    // ===== Sorting Variables =====
    $scope.sortColumn = 'name';
    $scope.sortReverse = false;

    // ===== Pagination =====
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;

    // ===== Loading State =====
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.showLoading('Loading students...');
        $scope.loadStudents();
    };

    // ===== Load Students with Sample Data =====
    $scope.loadStudents = function() {
        $timeout(function() {
            $scope.students = [
                {
                    id: 'STU001',
                    name: 'Emma Thompson',
                    email: 'emma.thompson@email.com',
                    mobile: '+1 (555) 123-4567',
                    avatar: null,
                    status: 'active',
                    enrollmentDate: new Date('2024-01-15'),
                    address: '123 Main St, New York, NY 10001',
                    dob: new Date('2000-05-20'),
                    enrolledCourses: [
                        {
                            courseId: 'C001',
                            courseName: 'Advanced Mathematics',
                            enrollmentDate: new Date('2024-01-15'),
                            progress: 75,
                            videosWatched: 15,
                            totalVideos: 20,
                            completedChapters: 6,
                            totalChapters: 8,
                            timeSpent: 24,
                            lastAccessed: new Date('2024-12-05'),
                            payment: {
                                amount: 299,
                                date: new Date('2024-01-15'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-001'
                            },
                            exams: [
                                { examName: 'Midterm Exam', date: new Date('2024-10-15'), score: 85, status: 'Passed' },
                                { examName: 'Quiz 1', date: new Date('2024-09-20'), score: 92, status: 'Passed' }
                            ]
                        },
                        {
                            courseId: 'C002',
                            courseName: 'Physics Fundamentals',
                            enrollmentDate: new Date('2024-02-01'),
                            progress: 45,
                            videosWatched: 8,
                            totalVideos: 18,
                            completedChapters: 3,
                            totalChapters: 10,
                            timeSpent: 16,
                            lastAccessed: new Date('2024-12-03'),
                            payment: {
                                amount: 349,
                                date: new Date('2024-02-01'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-015'
                            },
                            exams: [
                                { examName: 'Unit Test 1', date: new Date('2024-11-10'), score: 78, status: 'Passed' }
                            ]
                        }
                    ]
                },
                {
                    id: 'STU002',
                    name: 'Michael Chen',
                    email: 'michael.chen@email.com',
                    mobile: '+1 (555) 234-5678',
                    avatar: null,
                    status: 'active',
                    enrollmentDate: new Date('2024-02-10'),
                    address: '456 Oak Ave, Los Angeles, CA 90001',
                    dob: new Date('1999-11-12'),
                    enrolledCourses: [
                        {
                            courseId: 'C003',
                            courseName: 'Computer Science Basics',
                            enrollmentDate: new Date('2024-02-10'),
                            progress: 90,
                            videosWatched: 27,
                            totalVideos: 30,
                            completedChapters: 9,
                            totalChapters: 10,
                            timeSpent: 45,
                            lastAccessed: new Date('2024-12-06'),
                            payment: {
                                amount: 399,
                                date: new Date('2024-02-10'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-022'
                            },
                            exams: [
                                { examName: 'Final Exam', date: new Date('2024-11-25'), score: 94, status: 'Passed' },
                                { examName: 'Midterm Exam', date: new Date('2024-10-15'), score: 88, status: 'Passed' },
                                { examName: 'Quiz 2', date: new Date('2024-09-30'), score: 91, status: 'Passed' }
                            ]
                        }
                    ]
                },
                {
                    id: 'STU003',
                    name: 'Sarah Johnson',
                    email: 'sarah.johnson@email.com',
                    mobile: '+1 (555) 345-6789',
                    avatar: null,
                    status: 'active',
                    enrollmentDate: new Date('2024-03-05'),
                    address: '789 Pine Rd, Chicago, IL 60601',
                    dob: new Date('2001-03-15'),
                    enrolledCourses: [
                        {
                            courseId: 'C004',
                            courseName: 'Chemistry 101',
                            enrollmentDate: new Date('2024-03-05'),
                            progress: 60,
                            videosWatched: 12,
                            totalVideos: 20,
                            completedChapters: 5,
                            totalChapters: 12,
                            timeSpent: 28,
                            lastAccessed: new Date('2024-12-04'),
                            payment: {
                                amount: 329,
                                date: new Date('2024-03-05'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-045'
                            },
                            exams: [
                                { examName: 'Lab Test 1', date: new Date('2024-11-05'), score: 82, status: 'Passed' },
                                { examName: 'Quiz 1', date: new Date('2024-10-10'), score: 75, status: 'Passed' }
                            ]
                        },
                        {
                            courseId: 'C005',
                            courseName: 'Biology Essentials',
                            enrollmentDate: new Date('2024-03-20'),
                            progress: 35,
                            videosWatched: 7,
                            totalVideos: 25,
                            completedChapters: 3,
                            totalChapters: 15,
                            timeSpent: 18,
                            lastAccessed: new Date('2024-11-30'),
                            payment: {
                                amount: 359,
                                date: new Date('2024-03-20'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-056'
                            },
                            exams: []
                        }
                    ]
                },
                {
                    id: 'STU004',
                    name: 'David Martinez',
                    email: 'david.martinez@email.com',
                    mobile: '+1 (555) 456-7890',
                    avatar: null,
                    status: 'active',
                    enrollmentDate: new Date('2024-04-12'),
                    address: '321 Elm St, Houston, TX 77001',
                    dob: new Date('2000-08-22'),
                    enrolledCourses: [
                        {
                            courseId: 'C001',
                            courseName: 'Advanced Mathematics',
                            enrollmentDate: new Date('2024-04-12'),
                            progress: 50,
                            videosWatched: 10,
                            totalVideos: 20,
                            completedChapters: 4,
                            totalChapters: 8,
                            timeSpent: 20,
                            lastAccessed: new Date('2024-12-02'),
                            payment: {
                                amount: 299,
                                date: new Date('2024-04-12'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-078'
                            },
                            exams: [
                                { examName: 'Quiz 1', date: new Date('2024-11-15'), score: 68, status: 'Passed' }
                            ]
                        }
                    ]
                },
                {
                    id: 'STU005',
                    name: 'Lisa Anderson',
                    email: 'lisa.anderson@email.com',
                    mobile: '+1 (555) 567-8901',
                    avatar: null,
                    status: 'inactive',
                    enrollmentDate: new Date('2024-05-20'),
                    address: '654 Maple Dr, Phoenix, AZ 85001',
                    dob: new Date('1998-12-30'),
                    enrolledCourses: [
                        {
                            courseId: 'C006',
                            courseName: 'English Literature',
                            enrollmentDate: new Date('2024-05-20'),
                            progress: 25,
                            videosWatched: 5,
                            totalVideos: 22,
                            completedChapters: 2,
                            totalChapters: 12,
                            timeSpent: 12,
                            lastAccessed: new Date('2024-10-15'),
                            payment: {
                                amount: 279,
                                date: new Date('2024-05-20'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-102'
                            },
                            exams: []
                        }
                    ]
                },
                {
                    id: 'STU006',
                    name: 'James Wilson',
                    email: 'james.wilson@email.com',
                    mobile: '+1 (555) 678-9012',
                    avatar: null,
                    status: 'active',
                    enrollmentDate: new Date('2024-06-15'),
                    address: '987 Cedar Ln, Philadelphia, PA 19101',
                    dob: new Date('2001-07-18'),
                    enrolledCourses: [
                        {
                            courseId: 'C002',
                            courseName: 'Physics Fundamentals',
                            enrollmentDate: new Date('2024-06-15'),
                            progress: 80,
                            videosWatched: 14,
                            totalVideos: 18,
                            completedChapters: 8,
                            totalChapters: 10,
                            timeSpent: 32,
                            lastAccessed: new Date('2024-12-05'),
                            payment: {
                                amount: 349,
                                date: new Date('2024-06-15'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-125'
                            },
                            exams: [
                                { examName: 'Unit Test 2', date: new Date('2024-11-28'), score: 89, status: 'Passed' },
                                { examName: 'Unit Test 1', date: new Date('2024-10-25'), score: 84, status: 'Passed' }
                            ]
                        },
                        {
                            courseId: 'C003',
                            courseName: 'Computer Science Basics',
                            enrollmentDate: new Date('2024-07-01'),
                            progress: 55,
                            videosWatched: 16,
                            totalVideos: 30,
                            completedChapters: 5,
                            totalChapters: 10,
                            timeSpent: 24,
                            lastAccessed: new Date('2024-12-01'),
                            payment: {
                                amount: 399,
                                date: new Date('2024-07-01'),
                                status: 'Paid',
                                invoiceId: 'INV-2024-138'
                            },
                            exams: [
                                { examName: 'Midterm Exam', date: new Date('2024-11-20'), score: 76, status: 'Passed' }
                            ]
                        }
                    ]
                }
            ];

            $scope.filteredStudents = $scope.students.slice();
            $scope.updatePagination();
            $scope.hideLoading();
        }, 500);
    };

    // ===== View Student Detail =====
    $scope.viewStudentDetail = function(student) {
        // Store student data in localStorage for the detail page
        localStorage.setItem('selectedStudent', JSON.stringify(student));
        // Open detail page in new window
        $window.open('candidate-detail.html', '_blank');
    };

    // ===== Add New Student =====
    $scope.addNewStudent = function() {
        alert('Add new student functionality would be implemented here.');
    };

    // ===== Filter & Sort =====
    $scope.filterStudents = function() {
        var query = ($scope.searchQuery || '').toLowerCase();
        var course = $scope.filterCourse;
        var status = $scope.filterStatus;

        $scope.filteredStudents = $scope.students.filter(function(student) {
            var matchesSearch = true;
            var matchesCourse = true;
            var matchesStatus = true;

            if (query) {
                var courseNames = student.enrolledCourses.map(function(e) {
                    return e.courseName.toLowerCase();
                }).join(' ');

                matchesSearch =
                    student.name.toLowerCase().indexOf(query) !== -1 ||
                    student.email.toLowerCase().indexOf(query) !== -1 ||
                    student.mobile.indexOf(query) !== -1 ||
                    courseNames.indexOf(query) !== -1;
            }

            if (course) {
                matchesCourse = student.enrolledCourses.some(function(e) {
                    return e.courseName === course;
                });
            }

            if (status) {
                matchesStatus = student.status === status;
            }

            return matchesSearch && matchesCourse && matchesStatus;
        });

        $scope.sortStudents();
        $scope.currentPage = 1;
        $scope.updatePagination();
    };

    $scope.sortStudents = function() {
        var sortBy = $scope.sortBy;

        $scope.filteredStudents.sort(function(a, b) {
            var aVal, bVal;

            switch(sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'enrollmentDate':
                    aVal = new Date(a.enrollmentDate);
                    bVal = new Date(b.enrollmentDate);
                    return bVal - aVal; // Descending
                case 'courses':
                    aVal = a.enrolledCourses.length;
                    bVal = b.enrolledCourses.length;
                    return bVal - aVal; // Descending
                default:
                    return 0;
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });

        $scope.updatePagination();
    };

    // ===== Pagination =====
    $scope.updatePagination = function() {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        $scope.paginatedStudents = $scope.filteredStudents.slice(start, end);
    };

    $scope.getTotalPages = function() {
        return Math.ceil($scope.filteredStudents.length / $scope.itemsPerPage);
    };

    $scope.getPageNumbers = function() {
        var total = $scope.getTotalPages();
        var pages = [];
        var maxVisible = 5;
        var start = Math.max(1, $scope.currentPage - Math.floor(maxVisible / 2));
        var end = Math.min(total, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (var i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.goToPage = function(page) {
        $scope.currentPage = page;
        $scope.updatePagination();
    };

    $scope.previousPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.updatePagination();
        }
    };

    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
            $scope.updatePagination();
        }
    };

    $scope.getStartIndex = function() {
        return ($scope.currentPage - 1) * $scope.itemsPerPage;
    };

    $scope.getEndIndex = function() {
        return Math.min($scope.getStartIndex() + $scope.itemsPerPage, $scope.filteredStudents.length);
    };

    // ===== Statistics =====
    $scope.getActiveStudents = function() {
        return $scope.students.filter(function(s) {
            return s.status === 'active';
        }).length;
    };

    $scope.getTotalEnrollments = function() {
        return $scope.students.reduce(function(sum, s) {
            return sum + s.enrolledCourses.length;
        }, 0);
    };

    $scope.getTotalRevenue = function() {
        var total = $scope.students.reduce(function(sum, s) {
            var studentTotal = s.enrolledCourses.reduce(function(courseSum, e) {
                return courseSum + (e.payment.amount || 0);
            }, 0);
            return sum + studentTotal;
        }, 0);
        return total.toLocaleString();
    };

    $scope.getAllCourses = function() {
        var courses = new Set();
        $scope.students.forEach(function(s) {
            s.enrolledCourses.forEach(function(e) {
                courses.add(e.courseName);
            });
        });
        return Array.from(courses).sort();
    };

    // ===== Helper Functions =====
    $scope.getInitials = function(name) {
        if (!name) return '??';
        var parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    $scope.showLoading = function(message) {
        $scope.isLoading = true;
        $scope.loadingMessage = message || 'Loading...';
    };

    $scope.hideLoading = function() {
        $timeout(function() {
            $scope.isLoading = false;
        }, 300);
    };

    // ===== Sortable Column Functionality =====
    $scope.sortByColumn = function(column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        $scope.filteredStudents.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'email':
                    aVal = a.email.toLowerCase();
                    bVal = b.email.toLowerCase();
                    break;
                case 'mobile':
                    aVal = a.mobile;
                    bVal = b.mobile;
                    break;
                case 'coursesCount':
                    aVal = a.enrolledCourses.length;
                    bVal = b.enrolledCourses.length;
                    break;
                case 'enrollmentDate':
                    aVal = new Date(a.enrollmentDate);
                    bVal = new Date(b.enrollmentDate);
                    break;
                case 'status':
                    aVal = a.status.toLowerCase();
                    bVal = b.status.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return $scope.sortReverse ? 1 : -1;
            if (aVal > bVal) return $scope.sortReverse ? -1 : 1;
            return 0;
        });

        $scope.updatePagination();
    };

    // ===== Available Courses Data =====
    $scope.availableCourses = [
        {
            courseId: 'C001',
            courseCode: 'MATH-101',
            courseName: 'Advanced Mathematics',
            duration: '6 months',
            price: 299,
            modules: 8,
            status: 'Active'
        },
        {
            courseId: 'C002',
            courseCode: 'PHY-101',
            courseName: 'Physics Fundamentals',
            duration: '5 months',
            price: 349,
            modules: 10,
            status: 'Active'
        },
        {
            courseId: 'C003',
            courseCode: 'CS-101',
            courseName: 'Computer Science Basics',
            duration: '8 months',
            price: 399,
            modules: 10,
            status: 'Active'
        },
        {
            courseId: 'C004',
            courseCode: 'CHEM-101',
            courseName: 'Chemistry Essentials',
            duration: '6 months',
            price: 329,
            modules: 9,
            status: 'Active'
        },
        {
            courseId: 'C005',
            courseCode: 'BIO-101',
            courseName: 'Biology Fundamentals',
            duration: '5 months',
            price: 299,
            modules: 7,
            status: 'Active'
        },
        {
            courseId: 'C006',
            courseCode: 'ENG-201',
            courseName: 'English Literature',
            duration: '4 months',
            price: 279,
            modules: 12,
            status: 'Active'
        },
        {
            courseId: 'C007',
            courseCode: 'HIST-101',
            courseName: 'World History',
            duration: '6 months',
            price: 249,
            modules: 10,
            status: 'Active'
        },
        {
            courseId: 'C008',
            courseCode: 'ECO-101',
            courseName: 'Economics Basics',
            duration: '5 months',
            price: 299,
            modules: 8,
            status: 'Active'
        }
    ];

    // ===== Enrolled Courses Modal =====
    $scope.coursesModalOpen = false;
    $scope.selectedStudentForCourses = null;

    $scope.viewEnrolledCourses = function(student) {
        $scope.selectedStudentForCourses = student;
        $scope.coursesModalOpen = true;
    };

    $scope.closeCoursesModal = function() {
        $scope.coursesModalOpen = false;
        $timeout(function() {
            $scope.selectedStudentForCourses = null;
        }, 300);
    };

    // ===== Enroll Course Modal =====
    $scope.enrollCourseModalOpen = false;
    $scope.courseSearchQuery = '';
    $scope.filteredAvailableCoursesForEnrollment = [];

    $scope.openEnrollCourseModal = function() {
        if (!$scope.selectedStudentForCourses) return;

        // Filter out courses already enrolled
        var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function(c) {
            return c.courseId;
        });

        $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function(course) {
            return enrolledCourseIds.indexOf(course.courseId) === -1;
        });

        $scope.courseSearchQuery = '';
        $scope.enrollCourseModalOpen = true;
    };

    $scope.closeEnrollCourseModal = function() {
        $scope.enrollCourseModalOpen = false;
        $scope.courseSearchQuery = '';
        $timeout(function() {
            $scope.filteredAvailableCoursesForEnrollment = [];
        }, 300);
    };

    // Watch for search query changes
    $scope.$watch('courseSearchQuery', function(newVal) {
        if (!$scope.enrollCourseModalOpen) return;

        if (!newVal) {
            // Show all available courses (not enrolled)
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function(c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function(course) {
                return enrolledCourseIds.indexOf(course.courseId) === -1;
            });
        } else {
            // Filter by search query
            var searchLower = newVal.toLowerCase();
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function(c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function(course) {
                var notEnrolled = enrolledCourseIds.indexOf(course.courseId) === -1;
                var matchesSearch = course.courseName.toLowerCase().indexOf(searchLower) !== -1 ||
                                  course.courseCode.toLowerCase().indexOf(searchLower) !== -1;
                return notEnrolled && matchesSearch;
            });
        }
    });

    $scope.enrollStudentToCourse = function(course) {
        if (!$scope.selectedStudentForCourses || !course) return;

        $scope.showLoading('Enrolling student to ' + course.courseName + '...');

        $timeout(function() {
            // Create new enrollment
            var newEnrollment = {
                courseId: course.courseId,
                courseCode: course.courseCode,
                courseName: course.courseName,
                enrollmentDate: new Date(),
                progress: 0,
                videosWatched: 0,
                totalVideos: 20,
                completedChapters: 0,
                totalChapters: course.modules || 8,
                timeSpent: 0,
                lastAccessed: new Date(),
                payment: {
                    amount: course.price,
                    date: new Date(),
                    status: 'Paid',
                    invoiceId: 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000)
                },
                exams: []
            };

            // Add to student's enrolled courses
            $scope.selectedStudentForCourses.enrolledCourses.push(newEnrollment);

            // Update the filtered list
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function(c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function(c) {
                return enrolledCourseIds.indexOf(c.courseId) === -1;
            });

            $scope.hideLoading();

            // Show success message
            alert('Successfully enrolled ' + $scope.selectedStudentForCourses.name + ' to ' + course.courseName + '!');
        }, 800);
    };

    // ===== Date and Validity Helper Functions =====
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    $scope.getDaysRemaining = function(validUntil) {
        if (!validUntil) return 0;
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);
        return daysRemaining > 0 ? daysRemaining : 0;
    };

    $scope.getValidityStatus = function(validUntil) {
        if (!validUntil) return 'UNKNOWN';
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);

        if (daysRemaining < 0) return 'EXPIRED';
        if (daysRemaining <= 30) return 'EXPIRING SOON';
        return 'ACTIVE';
    };

    $scope.getValidityClass = function(validUntil) {
        var status = $scope.getValidityStatus(validUntil);
        switch(status) {
            case 'ACTIVE': return 'validity-active';
            case 'EXPIRING SOON': return 'validity-expiring';
            case 'EXPIRED': return 'validity-expired';
            default: return '';
        }
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
