/**
 * Student Management Controller
 * Angular 1.x Controller for managing student profiles
 */

var app = angular.module('StudentManagementApp', ['ngCookies']);

app.controller('StudentManagementController', ['$scope', '$cookies', '$timeout', '$window', '$http', function ($scope, $cookies, $timeout, $window, $http) {

    // ===== API Configuration =====
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/people';

    // Get token from localStorage (same pattern as instructor-portfolio.js)


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

    // ===== Pagination from API =====
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.totalStudents = 0;
    $scope.totalPages = 0;

    // ===== Loading State =====
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);

    //Check if logged in
    if (getAdminTokenFromCookie()) {
        $scope.isLoggedIn = true;
    }
    else {
        $scope.isLoggedIn = false;
        window.location = "index.html";
    }

    //Logout function
    $scope.logoutNow = function () {
        if ($cookies.get("vegaPilotAdminToken")) {
            $cookies.remove("vegaPilotAdminToken");
            window.location = "index.html";
        }
    }

    function getAdminTokenFromCookie() {
        return $cookies.get("vegaPilotAdminToken") || localStorage.getItem("vegaPilotAdminToken");
    }




    // ===== Initialize App =====
    $scope.init = function () {
        $scope.showLoading('Loading students...');
        $scope.loadStudents();
    };

    // ===== Load Students from API =====
    $scope.loadStudents = function () {
        // Build API URL with parameters
        var url = $scope.apiBaseUrl + '/list-candidates.php';
        var params = {
            page: $scope.currentPage,
            size: $scope.itemsPerPage
        };

        // Add sorting parameter
        if ($scope.sortColumn) {
            params.sortBy = $scope.sortColumn;
        }

        // Add search parameter
        var searchKey = ($scope.searchQuery || '').trim();
        if (searchKey && searchKey.length > 0) {
            params.searchKey = searchKey;
        }

        // Add status filter if present
        if ($scope.filterStatus) {
            params.status = $scope.filterStatus;
        }

        console.log('Loading students from API:', url, params);

        // Make API request
        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            console.log('API Response:', response.data);

            if (response.data && response.data.status === 'success') {
                var apiData = response.data.data;
                var meta = response.data.meta;

                // Update pagination metadata
                $scope.currentPage = meta.page;
                $scope.itemsPerPage = meta.size;
                $scope.totalStudents = meta.total;
                $scope.totalPages = meta.totalPages;

                // Map API response to local data structure
                $scope.students = apiData.map(function (candidate) {
                    return {
                        id: candidate.candidateKey || candidate.id,
                        candidateKey: candidate.candidateKey,
                        name: candidate.name || 'Unknown',
                        email: candidate.email || '',
                        mobile: candidate.mobile || candidate.registeredMobile || candidate.communicationMobile || '',
                        registeredMobile: candidate.registeredMobile,
                        communicationMobile: candidate.communicationMobile,
                        avatar: candidate.photo || null, // Photo is already in data URL format
                        status: candidate.blocked ? 'blocked' : (candidate.status || 'active').toLowerCase(),
                        statusCode: candidate.statusCode,
                        blocked: candidate.blocked,
                        enrollmentDate: candidate.joinedDate ? new Date(candidate.joinedDate) : null, // joinedDate is already a date string
                        joinedDate: candidate.joinedDate,
                        lastUpdated: candidate.lastUpdated,
                        dob: candidate.dob,
                        gender: candidate.gender,
                        place: candidate.place,
                        fatherName: candidate.fatherName,
                        motherName: candidate.motherName,
                        aspiration: candidate.aspiration,
                        classOfStudy: candidate.classOfStudy,
                        board: candidate.board,
                        yearOfPassing: candidate.yearOfPassing,
                        lastInstitution: candidate.lastInstitution,
                        totalCourseEnrollments: candidate.totalCourseEnrollments || 0,
                        totalTestSeriesEnrollments: candidate.totalTestSeriesEnrollments || 0,
                        enrolledCourses: [] // Will be populated when viewing details or from separate API
                    };
                });

                // For client-side compatibility, maintain filteredStudents and paginatedStudents
                $scope.filteredStudents = $scope.students.slice();
                $scope.paginatedStudents = $scope.students.slice();

                $scope.hideLoading();
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.students = [];
                $scope.filteredStudents = [];
                $scope.paginatedStudents = [];
                $scope.hideLoading();

                var errorMsg = 'Failed to load students';
                if (response.data && response.data.message) {
                    errorMsg += ': ' + response.data.message;
                } else if (response.data && response.data.error) {
                    errorMsg += ': ' + response.data.error;
                } else {
                    errorMsg += '. Please check console for details.';
                }

                $scope.showToaster('error', 'Error', errorMsg);
            }
        }).catch(function (error) {
            console.error('Error loading students:', error);
            $scope.students = [];
            $scope.filteredStudents = [];
            $scope.paginatedStudents = [];
            $scope.hideLoading();

            if (error.status === 401) {
                $scope.showToaster('error', 'Authentication Failed', 'Please login again.');
            } else {
                $scope.showToaster('error', 'Network Error', 'Error loading students: ' + (error.statusText || 'Unknown error'));
            }
        });
    };

    // ===== View Student Detail =====
    $scope.viewStudentDetail = function (student) {
        // Store student data in localStorage for the detail page
        localStorage.setItem('selectedStudent', JSON.stringify(student));
        // Open detail page in new window
        $window.open('candidate-detail.html', '_blank');
    };

    // ===== Add New Student =====
    $scope.addNewStudent = function () {
        $scope.showToaster('info', 'Feature Coming Soon', 'Add new student functionality is under development.');
    };

    // ===== Filter & Sort (triggers API call) =====
    $scope.filterStudents = function () {
        // Reset to first page and reload from API
        $scope.currentPage = 1;
        $scope.showLoading('Filtering students...');
        $scope.loadStudents();
    };

    $scope.sortStudents = function () {
        // Reload from API with new sort
        $scope.showLoading('Sorting students...');
        $scope.loadStudents();
    };

    // ===== Pagination (API-driven) =====
    $scope.updatePagination = function () {
        // No longer needed for client-side pagination, kept for compatibility
        // API handles pagination server-side
    };

    $scope.getTotalPages = function () {
        return $scope.totalPages || 1;
    };

    $scope.getPageNumbers = function () {
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

    $scope.goToPage = function (page) {
        if (page !== $scope.currentPage) {
            $scope.currentPage = page;
            $scope.showLoading('Loading page ' + page + '...');
            $scope.loadStudents();
        }
    };

    $scope.previousPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.showLoading('Loading previous page...');
            $scope.loadStudents();
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
            $scope.showLoading('Loading next page...');
            $scope.loadStudents();
        }
    };

    $scope.getStartIndex = function () {
        return ($scope.currentPage - 1) * $scope.itemsPerPage + 1;
    };

    $scope.getEndIndex = function () {
        return Math.min($scope.currentPage * $scope.itemsPerPage, $scope.totalStudents);
    };

    // ===== Statistics (using totalCourseEnrollments from API) =====
    $scope.getActiveStudents = function () {
        return $scope.students.filter(function (s) {
            return s.status === 'active' && !s.blocked;
        }).length;
    };

    $scope.getTotalEnrollments = function () {
        return $scope.students.reduce(function (sum, s) {
            return sum + (s.totalCourseEnrollments || 0);
        }, 0);
    };

    $scope.getTotalRevenue = function () {
        // Revenue calculation would need a separate API endpoint
        // For now, return placeholder
        return '0';
    };

    $scope.getAllCourses = function () {
        var courses = new Set();
        $scope.students.forEach(function (s) {
            s.enrolledCourses.forEach(function (e) {
                courses.add(e.courseName);
            });
        });
        return Array.from(courses).sort();
    };

    // ===== Helper Functions =====
    $scope.getInitials = function (name) {
        if (!name) return '??';
        var parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    $scope.showLoading = function (message) {
        $scope.isLoading = true;
        $scope.loadingMessage = message || 'Loading...';
    };

    $scope.hideLoading = function () {
        $timeout(function () {
            $scope.isLoading = false;
        }, 300);
    };

    // ===== Sortable Column Functionality (API-driven) =====
    $scope.sortByColumn = function (column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        // Map column names to API sortBy parameter
        var sortByMap = {
            'name': 'name',
            'email': 'email',
            'mobile': 'mobile',
            'coursesCount': 'totalCourseEnrollments',
            'enrollmentDate': 'joinedDate',
            'status': 'status'
        };

        $scope.sortColumn = sortByMap[column] || column;

        // Reload from API with new sort
        $scope.showLoading('Sorting by ' + column + '...');
        $scope.loadStudents();
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

    $scope.viewEnrolledCourses = function (student) {
        $scope.selectedStudentForCourses = student;
        $scope.coursesModalOpen = true;

        // Fetch course enrollments from API
        $scope.showLoading('Loading course enrollments...');

        var url = $scope.apiBaseUrl.replace('/people', '/enrollment') + '/get-course-enrollments-for-given-candidate.php';
        var params = {
            candidateId: student.id
        };

        console.log('Fetching course enrollments for candidate:', student.id, url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            console.log('Course enrollments API response:', response.data);

            if (response.data && response.data.status === 'success') {
                var enrollmentsData = response.data.data || [];

                // Map API response to local data structure
                $scope.selectedStudentForCourses.enrolledCourses = enrollmentsData.map(function (enrollment) {
                    return {
                        courseId: enrollment.courseId,
                        courseName: enrollment.courseTitle,
                        courseCode: enrollment.courseCode,
                        courseType: enrollment.courseType,
                        catalogType: enrollment.catalogType,
                        accessLevel: enrollment.accessLevel,
                        validUntil: enrollment.expiry, // Unix timestamp
                        enrollmentDate: enrollment.enrollmentDate, // Unix timestamp
                        enrollmentStatus: enrollment.enrollmentStatus,
                        enrollmentStatusText: enrollment.enrollmentStatusText
                    };
                });

                // Update the total count
                $scope.selectedStudentForCourses.totalCourseEnrollments = response.data.totalEnrollments || enrollmentsData.length;

                console.log('Mapped enrollments:', $scope.selectedStudentForCourses.enrolledCourses);
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.selectedStudentForCourses.enrolledCourses = [];
            }

            $scope.hideLoading();
        }, function (error) {
            console.error('Error fetching course enrollments:', error);
            $scope.selectedStudentForCourses.enrolledCourses = [];
            $scope.hideLoading();
        });
    };

    $scope.closeCoursesModal = function () {
        $scope.coursesModalOpen = false;
        $timeout(function () {
            $scope.selectedStudentForCourses = null;
        }, 300);
    };

    // ===== Enroll Course Modal =====
    $scope.enrollCourseModalOpen = false;
    $scope.courseSearchQuery = '';
    $scope.filteredAvailableCoursesForEnrollment = [];

    $scope.openEnrollCourseModal = function () {
        if (!$scope.selectedStudentForCourses) return;

        // Filter out courses already enrolled
        var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function (c) {
            return c.courseId;
        });

        $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function (course) {
            return enrolledCourseIds.indexOf(course.courseId) === -1;
        });

        $scope.courseSearchQuery = '';
        $scope.enrollCourseModalOpen = true;
    };

    $scope.closeEnrollCourseModal = function () {
        $scope.enrollCourseModalOpen = false;
        $scope.courseSearchQuery = '';
        $timeout(function () {
            $scope.filteredAvailableCoursesForEnrollment = [];
        }, 300);
    };

    // Watch for search query changes
    $scope.$watch('courseSearchQuery', function (newVal) {
        if (!$scope.enrollCourseModalOpen) return;

        if (!newVal) {
            // Show all available courses (not enrolled)
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function (c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function (course) {
                return enrolledCourseIds.indexOf(course.courseId) === -1;
            });
        } else {
            // Filter by search query
            var searchLower = newVal.toLowerCase();
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function (c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function (course) {
                var notEnrolled = enrolledCourseIds.indexOf(course.courseId) === -1;
                var matchesSearch = course.courseName.toLowerCase().indexOf(searchLower) !== -1 ||
                    course.courseCode.toLowerCase().indexOf(searchLower) !== -1;
                return notEnrolled && matchesSearch;
            });
        }
    });

    $scope.enrollStudentToCourse = function (course) {
        if (!$scope.selectedStudentForCourses || !course) return;

        $scope.showLoading('Enrolling student to ' + course.courseName + '...');

        $timeout(function () {
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
            var enrolledCourseIds = $scope.selectedStudentForCourses.enrolledCourses.map(function (c) {
                return c.courseId;
            });

            $scope.filteredAvailableCoursesForEnrollment = $scope.availableCourses.filter(function (c) {
                return enrolledCourseIds.indexOf(c.courseId) === -1;
            });

            $scope.hideLoading();

            // Show success message
            $scope.showToaster('success', 'Enrollment Successful', 'Successfully enrolled ' + $scope.selectedStudentForCourses.name + ' to ' + course.courseName + '!');
        }, 800);
    };

    // ===== Date and Validity Helper Functions =====
    $scope.formatDate = function (timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    $scope.getDaysRemaining = function (validUntil) {
        if (!validUntil) return 0;
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);
        return Math.abs(daysRemaining); // Return absolute value for display
    };

    $scope.getValidityStatus = function (validUntil) {
        if (!validUntil) return 'UNKNOWN';
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);

        if (daysRemaining < 0) return 'EXPIRED';
        if (daysRemaining <= 30) return 'EXPIRING SOON';
        return 'ACTIVE';
    };

    $scope.getValidityClass = function (validUntil) {
        var status = $scope.getValidityStatus(validUntil);
        switch (status) {
            case 'ACTIVE': return 'validity-active';
            case 'EXPIRING SOON': return 'validity-expiring';
            case 'EXPIRED': return 'validity-expired';
            default: return '';
        }
    };

    // ===== Kebab Menu & Blacklist =====

    // Kebab Menu Toggle
    $scope.toggleKebabMenu = function (student, event) {
        if (event) event.stopPropagation();

        // Close other open menus
        if ($scope.paginatedStudents) {
            $scope.paginatedStudents.forEach(function (s) {
                if (s.id !== student.id) s.showKebabMenu = false;
            });
        }

        student.showKebabMenu = !student.showKebabMenu;
    };

    // Close kebab menu when clicking elsewhere
    $(document).click(function () {
        $scope.$apply(function () {
            if ($scope.paginatedStudents) {
                $scope.paginatedStudents.forEach(function (s) {
                    s.showKebabMenu = false;
                });
            }
        });
    });

    // Toggle Blacklist
    $scope.toggleBlacklist = function (student) {
        if (!student) return;
        alert('Blacklist functionality for ' + student.name + ' will be implemented soon.');
        // Implement actual blacklist logic here
        student.showKebabMenu = false;
    };

    // Change Page Size
    $scope.changePageSize = function () {
        $scope.itemsPerPage = parseInt($scope.pageSize);
        $scope.currentPage = 1;
        // Trigger re-filtering/pagination
        if (typeof $scope.filterStudents === 'function') {
            $scope.filterStudents();
        } else if (typeof $scope.updatePagination === 'function') {
            $scope.updatePagination();
        } else {
            // If manual slicing, reload from API
            $scope.loadStudents(); // Use loadStudents which exists
        }
    };

    // Generate array for skeleton rows based on current page size
    $scope.getSkeletonRows = function () {
        var count = $scope.pageSize || $scope.itemsPerPage || 10;
        return new Array(count);
    };

    // Initialize Page Size model
    $scope.itemsPerPage = 10; // Ensure default is 10
    $scope.pageSize = 10;

    // Note: init() is already defined earlier in the file (line 67) and will be called there

}]);
