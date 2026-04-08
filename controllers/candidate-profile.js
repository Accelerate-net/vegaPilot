/**
 * Student Management Controller
 * Angular 1.x Controller for managing student profiles
 */

var app = angular.module('StudentManagementApp', ['ngCookies']);

app.controller('StudentManagementController', ['$scope', '$cookies', '$timeout', '$window', '$http', function ($scope, $cookies, $timeout, $window, $http) {

    // ===== API Configuration =====
    const BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "http://localhost:3000"
        : "https://crisprtech.app/crispr-apis";
    var isLocalPreview = window.location.protocol === 'file:';

    $scope.apiBaseUrl = BASE_URL + '/restricted/people';

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

    function getDummyCandidatesDataset() {
        return [
            {
                id: 101,
                candidateKey: 'CAND-2026-001',
                name: 'Aarav Nair',
                email: 'aarav.nair@example.com',
                mobile: '+91 98765 43210',
                registeredMobile: '+91 98765 43210',
                communicationMobile: '+91 98765 43210',
                photo: null,
                totalCourseEnrollments: 3,
                totalTestSeriesEnrollments: 1,
                status: 'Active',
                statusCode: 1,
                blocked: false,
                joinedDate: '2026-01-12T00:00:00Z',
                lastUpdated: '2026-03-14T09:30:00Z',
                dob: '2007-08-18',
                gender: 'Male',
                place: 'Kochi',
                fatherName: 'Ramesh Nair',
                motherName: 'Deepa Nair',
                aspiration: 'IIT-JEE',
                classOfStudy: '12th',
                board: 'CBSE',
                yearOfPassing: '2026',
                lastInstitution: 'Gregorian Public School',
                enrolledCourses: [
                    {
                        courseId: 'C001',
                        courseName: 'Advanced Mathematics',
                        courseCode: 'MATH-101',
                        validUntil: 1780704000,
                        enrollmentDate: 1736640000,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C002',
                        courseName: 'Physics Fundamentals',
                        courseCode: 'PHY-101',
                        validUntil: 1779321600,
                        enrollmentDate: 1737244800,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C004',
                        courseName: 'Chemistry Essentials',
                        courseCode: 'CHEM-101',
                        validUntil: 1777766400,
                        enrollmentDate: 1738368000,
                        enrollmentStatusText: 'EXPIRING SOON'
                    }
                ]
            },
            {
                id: 102,
                candidateKey: 'CAND-2026-002',
                name: 'Diya Joseph',
                email: 'diya.joseph@example.com',
                mobile: '+91 91234 56780',
                registeredMobile: '+91 91234 56780',
                communicationMobile: '+91 91234 56780',
                photo: null,
                totalCourseEnrollments: 2,
                totalTestSeriesEnrollments: 2,
                status: 'Active',
                statusCode: 1,
                blocked: false,
                joinedDate: '2025-11-22T00:00:00Z',
                lastUpdated: '2026-02-28T15:45:00Z',
                dob: '2008-02-02',
                gender: 'Female',
                place: 'Thrissur',
                fatherName: 'Mathew Joseph',
                motherName: 'Anitha Joseph',
                aspiration: 'NEET',
                classOfStudy: '11th',
                board: 'State',
                yearOfPassing: '2027',
                lastInstitution: 'St. Clare Senior Secondary School',
                enrolledCourses: [
                    {
                        courseId: 'C005',
                        courseName: 'Biology Fundamentals',
                        courseCode: 'BIO-101',
                        validUntil: 1781481600,
                        enrollmentDate: 1732233600,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C004',
                        courseName: 'Chemistry Essentials',
                        courseCode: 'CHEM-101',
                        validUntil: 1777248000,
                        enrollmentDate: 1732752000,
                        enrollmentStatusText: 'EXPIRING SOON'
                    }
                ]
            },
            {
                id: 103,
                candidateKey: 'CAND-2026-003',
                name: 'Mohammed Irfan',
                email: 'm.irfan@example.com',
                mobile: '+91 99887 77665',
                registeredMobile: '+91 99887 77665',
                communicationMobile: '+91 99887 77665',
                photo: null,
                totalCourseEnrollments: 1,
                totalTestSeriesEnrollments: 0,
                status: 'Inactive',
                statusCode: 0,
                blocked: false,
                joinedDate: '2025-09-03T00:00:00Z',
                lastUpdated: '2026-01-16T11:10:00Z',
                dob: '2006-12-10',
                gender: 'Male',
                place: 'Malappuram',
                fatherName: 'Hameed K',
                motherName: 'Shabana Hameed',
                aspiration: 'SSC CGL',
                classOfStudy: 'Completed 12th',
                board: 'State',
                yearOfPassing: '2025',
                lastInstitution: 'Ideal Higher Secondary School',
                enrolledCourses: [
                    {
                        courseId: 'C006',
                        courseName: 'English Literature',
                        courseCode: 'ENG-201',
                        validUntil: 1765843200,
                        enrollmentDate: 1725321600,
                        enrollmentStatusText: 'EXPIRED'
                    }
                ]
            },
            {
                id: 104,
                candidateKey: 'CAND-2026-004',
                name: 'Sneha Menon',
                email: 'sneha.menon@example.com',
                mobile: '+91 90012 34098',
                registeredMobile: '+91 90012 34098',
                communicationMobile: '+91 90012 34098',
                photo: null,
                totalCourseEnrollments: 4,
                totalTestSeriesEnrollments: 3,
                status: 'Active',
                statusCode: 1,
                blocked: false,
                joinedDate: '2026-02-08T00:00:00Z',
                lastUpdated: '2026-03-30T08:20:00Z',
                dob: '2007-04-24',
                gender: 'Female',
                place: 'Kozhikode',
                fatherName: 'Rajeev Menon',
                motherName: 'Lakshmi Menon',
                aspiration: 'KEAM',
                classOfStudy: '12th',
                board: 'CBSE',
                yearOfPassing: '2026',
                lastInstitution: 'Silver Hills Public School',
                enrolledCourses: [
                    {
                        courseId: 'C001',
                        courseName: 'Advanced Mathematics',
                        courseCode: 'MATH-101',
                        validUntil: 1782172800,
                        enrollmentDate: 1738972800,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C002',
                        courseName: 'Physics Fundamentals',
                        courseCode: 'PHY-101',
                        validUntil: 1782172800,
                        enrollmentDate: 1738972800,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C004',
                        courseName: 'Chemistry Essentials',
                        courseCode: 'CHEM-101',
                        validUntil: 1782172800,
                        enrollmentDate: 1738972800,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C008',
                        courseName: 'Economics Basics',
                        courseCode: 'ECO-101',
                        validUntil: 1779667200,
                        enrollmentDate: 1740096000,
                        enrollmentStatusText: 'ACTIVE'
                    }
                ]
            },
            {
                id: 105,
                candidateKey: 'CAND-2026-005',
                name: 'Rahul Prasad',
                email: 'rahul.prasad@example.com',
                mobile: '+91 95555 11223',
                registeredMobile: '+91 95555 11223',
                communicationMobile: '+91 95555 11223',
                photo: null,
                totalCourseEnrollments: 0,
                totalTestSeriesEnrollments: 1,
                status: 'Blocked',
                statusCode: 2,
                blocked: true,
                joinedDate: '2025-08-19T00:00:00Z',
                lastUpdated: '2026-03-02T13:05:00Z',
                dob: '2005-06-15',
                gender: 'Male',
                place: 'Kannur',
                fatherName: 'Suresh Prasad',
                motherName: 'Bindu Prasad',
                aspiration: 'Bank Exams',
                classOfStudy: 'Graduate',
                board: 'University',
                yearOfPassing: '2024',
                lastInstitution: 'Payyanur College',
                enrolledCourses: []
            },
            {
                id: 106,
                candidateKey: 'CAND-2026-006',
                name: 'Meera Krishnan',
                email: 'meera.krishnan@example.com',
                mobile: '+91 93456 78901',
                registeredMobile: '+91 93456 78901',
                communicationMobile: '+91 93456 78901',
                photo: null,
                totalCourseEnrollments: 2,
                totalTestSeriesEnrollments: 1,
                status: 'Active',
                statusCode: 1,
                blocked: false,
                joinedDate: '2026-03-01T00:00:00Z',
                lastUpdated: '2026-04-02T10:00:00Z',
                dob: '2008-10-09',
                gender: 'Female',
                place: 'Thiruvananthapuram',
                fatherName: 'Krishnan N',
                motherName: 'Revathi Krishnan',
                aspiration: 'CUET',
                classOfStudy: '12th',
                board: 'ISC',
                yearOfPassing: '2026',
                lastInstitution: 'Loyola School',
                enrolledCourses: [
                    {
                        courseId: 'C003',
                        courseName: 'Computer Science Basics',
                        courseCode: 'CS-101',
                        validUntil: 1782604800,
                        enrollmentDate: 1740787200,
                        enrollmentStatusText: 'ACTIVE'
                    },
                    {
                        courseId: 'C006',
                        courseName: 'English Literature',
                        courseCode: 'ENG-201',
                        validUntil: 1779062400,
                        enrollmentDate: 1741132800,
                        enrollmentStatusText: 'ACTIVE'
                    }
                ]
            }
        ];
    }

    function mapCandidate(candidate) {
        return {
            id: candidate.candidateKey || candidate.id,
            candidateKey: candidate.candidateKey,
            name: candidate.name || 'Unknown',
            email: candidate.email || '',
            mobile: candidate.mobile || candidate.registeredMobile || candidate.communicationMobile || '',
            registeredMobile: candidate.registeredMobile,
            communicationMobile: candidate.communicationMobile,
            avatar: candidate.photo || null,
            status: candidate.blocked ? 'blocked' : (candidate.status || 'active').toLowerCase(),
            statusCode: candidate.statusCode,
            blocked: candidate.blocked,
            enrollmentDate: candidate.joinedDate ? new Date(candidate.joinedDate) : null,
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
            enrolledCourses: angular.copy(candidate.enrolledCourses || [])
        };
    }

    function applyStudentResponse(apiData, meta) {
        $scope.currentPage = meta.page;
        $scope.itemsPerPage = meta.size;
        $scope.pageSize = meta.size;
        $scope.totalStudents = meta.total;
        $scope.totalPages = meta.totalPages;

        $scope.students = apiData.map(mapCandidate);
        $scope.filteredStudents = $scope.students.slice();
        $scope.paginatedStudents = $scope.students.slice();
        $scope.hideLoading();
    }

    function getDummyCandidatesResponse() {
        var dataset = getDummyCandidatesDataset();
        var filtered = dataset.slice();
        var searchKey = ($scope.searchQuery || '').trim().toLowerCase();

        if (searchKey) {
            filtered = filtered.filter(function (candidate) {
                return [candidate.name, candidate.email, candidate.mobile, candidate.candidateKey]
                    .filter(Boolean)
                    .some(function (value) {
                        return String(value).toLowerCase().indexOf(searchKey) !== -1;
                    });
            });
        }

        if ($scope.filterStatus) {
            filtered = filtered.filter(function (candidate) {
                var normalizedStatus = candidate.blocked ? 'blocked' : String(candidate.status || '').toLowerCase();
                return normalizedStatus === $scope.filterStatus;
            });
        }

        var sortField = $scope.sortColumn || 'name';
        filtered.sort(function (left, right) {
            var a = left[sortField];
            var b = right[sortField];

            if (sortField === 'joinedDate') {
                a = new Date(a || 0).getTime();
                b = new Date(b || 0).getTime();
            }

            a = a == null ? '' : a;
            b = b == null ? '' : b;

            if (typeof a === 'string') a = a.toLowerCase();
            if (typeof b === 'string') b = b.toLowerCase();

            if (a < b) return $scope.sortReverse ? 1 : -1;
            if (a > b) return $scope.sortReverse ? -1 : 1;
            return 0;
        });

        var total = filtered.length;
        var size = $scope.itemsPerPage || 10;
        var totalPages = Math.max(1, Math.ceil(total / size));
        var currentPage = Math.min($scope.currentPage || 1, totalPages);
        var startIndex = (currentPage - 1) * size;

        return {
            data: filtered.slice(startIndex, startIndex + size),
            meta: {
                page: currentPage,
                size: size,
                total: total,
                totalPages: totalPages
            }
        };
    }

    function loadDummyStudents(message) {
        $scope.isDemoMode = true;
        if (message) {
            $scope.showToaster('info', 'Demo Data', message);
        }

        var dummyResponse = getDummyCandidatesResponse();
        applyStudentResponse(dummyResponse.data, dummyResponse.meta);
    }

    //Check if logged in
    if (getAdminTokenFromCookie()) {
        $scope.isLoggedIn = true;
    }
    else if (isLocalPreview) {
        $scope.isLoggedIn = true;
        $scope.isDemoMode = true;
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
        if ($scope.isDemoMode) {
            loadDummyStudents();
            return;
        }

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
                applyStudentResponse(response.data.data || [], response.data.meta || {
                    page: 1,
                    size: $scope.itemsPerPage,
                    total: 0,
                    totalPages: 1
                });
            } else {
                console.error('API returned unsuccessful response:', response.data);
                if (isLocalPreview) {
                    loadDummyStudents('Loaded local demo student data because the API response was not successful.');
                    return;
                }

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
            if (isLocalPreview) {
                loadDummyStudents('Loaded local demo student data because the candidate API is not reachable in preview mode.');
                return;
            }

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

        if ($scope.isDemoMode) {
            $scope.selectedStudentForCourses.enrolledCourses = angular.copy(student.enrolledCourses || []);
            return;
        }

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

    // ===== Blacklist Confirmation Modal =====
    $scope.blacklistModalOpen = false;
    $scope.blacklistConfirmMessage = '';
    $scope.studentToBlacklist = null;

    $scope.closeBlacklistModal = function () {
        $scope.blacklistModalOpen = false;
        $scope.studentToBlacklist = null;
    };

    // Toggle Blacklist
    $scope.toggleBlacklist = function (student) {
        if (!student) return;

        $scope.studentToBlacklist = student;
        $scope.blacklistConfirmMessage = "Do you really want to blacklist the profile of " + student.name + ". By doing this, the candidate won't be able to login to the application anymore. You can re-enable access anytime.";
        $scope.blacklistModalOpen = true;

        // Close kebab menu
        student.showKebabMenu = false;
    };

    $scope.confirmBlacklist = function () {
        if (!$scope.studentToBlacklist) {
            $scope.closeBlacklistModal();
            return;
        }

        $scope.showLoading('Blacklisting student...');

        $timeout(function () {
            // Mock API call success
            $scope.hideLoading();
            $scope.showToaster('success', 'Profile Blacklisted', $scope.studentToBlacklist.name + ' has been successfully blacklisted.');

            // Update local state if needed (e.g. change status)
            // $scope.studentToBlacklist.status = 'blocked'; 

            $scope.closeBlacklistModal();
        }, 800);
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
