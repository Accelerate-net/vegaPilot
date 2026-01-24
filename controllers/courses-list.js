// Courses List Controller - Displays all courses with navigation to course viewer
var coursesListApp = angular.module('coursesListApp', []);

coursesListApp.controller('coursesListController', ['$scope', '$timeout', '$http', function($scope, $timeout, $http) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);


    // ===== API Configuration =====
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/course';

    // Get token from localStorage
    $scope.getAuthToken = function() {
        var token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');
        if (!token) {
            console.warn('No auth token found. Using default token for development.');
            localStorage.setItem('authToken', token);
        }
        return token;
    };

    // ===== Initialize Scope Variables =====
    $scope.courses = [];
    $scope.searchQuery = '';
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading courses...';
    $scope.sortColumn = '';
    $scope.sortReverse = false;

    // Pagination
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.totalItems = 0;
    $scope.totalPages = 0;
    $scope.sortBy = 'name';
    $scope.sortOrder = 'ASC';
    $scope.Math = window.Math; // For Math.min in template

    $scope.stats = {
        totalCourses: 0,
        totalModules: 0,
        totalChapters: 0,
        activeCourses: 0
    };

    // ===== Students Modal Variables =====
    $scope.studentsModalOpen = false;
    $scope.selectedCourseForStudents = null;
    $scope.studentSearchQuery = '';
    $scope.paginatedStudentsList = [];

    // Students pagination (server-side)
    $scope.studentsCurrentPage = 1;
    $scope.studentsItemsPerPage = 5;
    $scope.studentsTotalPages = 0;
    $scope.studentsTotalItems = 0;
    $scope.studentsSortBy = 'name';
    $scope.studentsSortOrder = 'ASC';

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.showLoading('Loading courses...');
        $scope.loadCourses();
    };

    // ===== Load Courses from API =====
    $scope.loadCourses = function() {
        $scope.showLoading('Loading courses...');

        var url = $scope.apiBaseUrl + '/list-course-bundles.php';
        var params = {
            page: $scope.currentPage,
            size: $scope.itemsPerPage,
            sortBy: $scope.sortBy,
            sortOrder: $scope.sortOrder
        };

        if ($scope.searchQuery && $scope.searchQuery.trim().length > 0) {
            params.searchKey = $scope.searchQuery.trim();
        }

        console.log('Loading courses from API:', url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            console.log('Courses API response:', response.data);

            if (response.data && response.data.status === 'success') {
                var apiData = response.data.data || [];

                // Map API response to UI format
                $scope.courses = apiData.map(function(course) {
                    return {
                        id: course.id,
                        code: course.code || '',
                        title: course.title,
                        category: course.category,
                        description: '', // Not provided by API
                        modulesList: course.modules || [],
                        totalModules: course.totalModules || 0,
                        totalChapters: course.chapters || 0,
                        totalDuration: course.duration || '0h 0m',
                        status: course.status,
                        totalStudents: course.students || 0,
                        instructor: course.instructor,
                        rating: course.rating
                    };
                });

                // Update pagination metadata
                var meta = response.data.meta;
                if (meta) {
                    $scope.currentPage = meta.page;
                    $scope.totalItems = meta.total;
                    $scope.totalPages = meta.totalPages;
                }

                $scope.calculateStats();
            } else {
                console.error('API returned unsuccessful response:', response.data);
            }

            $scope.hideLoading();
        }, function(error) {
            console.error('Error loading courses:', error);
            $scope.hideLoading();
        });
    };

    // ===== Calculate Statistics =====
    $scope.calculateStats = function() {
        $scope.stats.totalCourses = $scope.courses.length;
        $scope.stats.totalModules = $scope.courses.reduce(function(sum, course) {
            return sum + course.totalModules;
        }, 0);
        $scope.stats.totalChapters = $scope.courses.reduce(function(sum, course) {
            return sum + course.totalChapters;
        }, 0);
        $scope.stats.activeCourses = $scope.courses.filter(function(course) {
            return course.status === 'Active';
        }).length;
    };

    // ===== Open Course =====
    $scope.openCourse = function(course) {
        // Navigate to course-view page with bundleId and default values
        var bundleId = course.id || 70005;
        var segment = '1';
        var moduleId = '1';
        var chapterId = '1';
        var partId = '0';

        var url = 'course-view.html?courseCode=' + course.code +
                  '&bundleId=' + bundleId +
                  '&segment=' + segment +
                  '&module=' + moduleId +
                  '&chapter=' + chapterId +
                  '&part=' + partId;

        window.location.href = url;
    };

    // ===== Loading Functions =====
    $scope.showLoading = function(message) {
        $scope.loadingMessage = message || 'Loading...';
        $scope.isLoading = true;
    };

    $scope.hideLoading = function() {
        $timeout(function() {
            $scope.isLoading = false;
        }, 300);
    };

    // ===== Generate Sample Students for a Course =====
    $scope.generateStudentsForCourse = function(courseCode, totalStudents) {
        var students = [];
        var firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Jennifer', 'Robert', 'Lisa',
                         'William', 'Mary', 'Richard', 'Patricia', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Elizabeth'];
        var lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

        for (var i = 0; i < totalStudents; i++) {
            var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            var name = firstName + ' ' + lastName;
            var enrollmentDate = new Date();
            enrollmentDate.setDate(enrollmentDate.getDate() - Math.floor(Math.random() * 365));

            var isActive = Math.random() > 0.1;
            students.push({
                id: 'STU' + String(1000 + i).padStart(4, '0'),
                name: name,
                email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@example.com',
                phone: '+1 (' + (200 + Math.floor(Math.random() * 800)) + ') ' +
                       (100 + Math.floor(Math.random() * 900)) + '-' +
                       (1000 + Math.floor(Math.random() * 9000)),
                enrollmentDate: enrollmentDate.getTime(),
                status: isActive ? 'active' : 'inactive',
                enrollmentStatus: isActive ? 1 : 0,
                enrollmentStatusText: isActive ? 'Active' : 'Inactive',
                avatar: null
            });
        }

        return students;
    };

    // ===== View Course Students =====
    $scope.viewCourseStudents = function(course) {
        $scope.selectedCourseForStudents = course;
        $scope.studentSearchQuery = '';
        $scope.studentsModalOpen = true;

        // Reset pagination and sorting
        $scope.studentsCurrentPage = 1;
        $scope.studentsSortBy = 'name';
        $scope.studentsSortOrder = 'ASC';

        // Always load students from API with pagination
        $scope.loadCourseEnrollments();
    };

    // ===== Load Course Enrollments from API =====
    $scope.loadCourseEnrollments = function() {
        if (!$scope.selectedCourseForStudents) return;

        $scope.showLoading('Loading enrolled students...');

        var url = $scope.apiBaseUrl.replace('/course', '/enrollment') + '/get-course-enrollments.php';
        var params = {
            course: $scope.selectedCourseForStudents.code,
            page: $scope.studentsCurrentPage,
            size: $scope.studentsItemsPerPage,
            sortBy: $scope.studentsSortBy,
            sortOrder: $scope.studentsSortOrder
        };

        // Add search parameter if exists
        if ($scope.studentSearchQuery && $scope.studentSearchQuery.trim()) {
            params.searchKey = $scope.studentSearchQuery.trim();
        }

        console.log('Loading course enrollments from API:', url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            console.log('Course enrollments API response:', response.data);

            if (response.data && response.data.status === 'success') {
                var enrollmentsData = response.data.data || [];

                // Map API response to student format
                $scope.paginatedStudentsList = enrollmentsData.map(function(enrollment) {
                    return {
                        id: enrollment.candidateId || '',
                        name: enrollment.name || 'Unknown Student',
                        email: enrollment.email || '',
                        phone: enrollment.mobile || '',
                        photo: enrollment.photo || null,
                        place: enrollment.place || '',
                        about: enrollment.about || '',
                        enrollmentDate: enrollment.enrollmentDate || Date.now(),
                        enrollmentStatus: enrollment.enrollmentStatus,
                        enrollmentStatusText: enrollment.enrollmentStatus === 1 ? 'Active' : 'Inactive',
                        candidateStatus: enrollment.candidateStatus
                    };
                });

                // Update pagination metadata from API response
                $scope.studentsTotalItems = response.data.total || 0;
                $scope.studentsTotalPages = response.data.totalPages || 0;
                $scope.studentsCurrentPage = response.data.page || 1;
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.paginatedStudentsList = [];
                $scope.studentsTotalItems = 0;
                $scope.studentsTotalPages = 0;
            }

            $scope.hideLoading();
        }, function(error) {
            console.error('Error loading course enrollments:', error);
            $scope.paginatedStudentsList = [];
            $scope.studentsTotalItems = 0;
            $scope.studentsTotalPages = 0;
            $scope.hideLoading();
        });
    };

    // ===== Search Students (Server-side) =====
    $scope.searchStudents = function() {
        // Reset to page 1 when searching
        $scope.studentsCurrentPage = 1;
        $scope.loadCourseEnrollments();
    };

    // ===== Change Students Sort (Server-side) =====
    $scope.changeStudentsSort = function(sortBy) {
        // Toggle sort order if clicking the same column
        if ($scope.studentsSortBy === sortBy) {
            $scope.studentsSortOrder = $scope.studentsSortOrder === 'ASC' ? 'DESC' : 'ASC';
        } else {
            $scope.studentsSortBy = sortBy;
            $scope.studentsSortOrder = 'ASC';
        }

        // Reset to page 1 when sorting changes
        $scope.studentsCurrentPage = 1;
        $scope.loadCourseEnrollments();
    };

    // ===== Students Pagination Functions =====
    $scope.studentsPreviousPage = function() {
        if ($scope.studentsCurrentPage > 1) {
            $scope.studentsCurrentPage--;
            $scope.loadCourseEnrollments();
        }
    };

    $scope.studentsNextPage = function() {
        if ($scope.studentsCurrentPage < $scope.studentsTotalPages) {
            $scope.studentsCurrentPage++;
            $scope.loadCourseEnrollments();
        }
    };

    $scope.studentsGoToPage = function(page) {
        if (page >= 1 && page <= $scope.studentsTotalPages) {
            $scope.studentsCurrentPage = page;
            $scope.loadCourseEnrollments();
        }
    };

    $scope.getStudentsPageNumbers = function() {
        var pages = [];
        var startPage = Math.max(1, $scope.studentsCurrentPage - 2);
        var endPage = Math.min($scope.studentsTotalPages, $scope.studentsCurrentPage + 2);

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    // ===== Close Students Modal =====
    $scope.closeStudentsModal = function() {
        $scope.studentsModalOpen = false;
        $timeout(function() {
            $scope.selectedCourseForStudents = null;
            $scope.studentSearchQuery = '';
            $scope.filteredStudentsList = [];
            $scope.paginatedStudentsList = [];
            $scope.studentsCurrentPage = 1;
            $scope.studentsTotalPages = 0;
        }, 300);
    };

    // ===== View Student Profile =====
    $scope.viewStudentProfile = function(student) {
        // Store student data in localStorage and open candidate-detail page
        localStorage.setItem('selectedStudent', JSON.stringify(student));
        window.open('candidate-detail.html', '_blank');
    };

    // ===== Get Initials =====
    $scope.getInitials = function(name) {
        if (!name) return '??';
        var parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // ===== Format Date =====
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'N/A';
        var date = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    // ===== Sort by Column =====
    $scope.sortByColumn = function(column) {
        // If clicking the same column, toggle sort direction
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        // Sort the courses
        $scope.courses.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'code':
                    aVal = a.code ? a.code.toLowerCase() : '';
                    bVal = b.code ? b.code.toLowerCase() : '';
                    break;
                case 'title':
                    aVal = a.title ? a.title.toLowerCase() : '';
                    bVal = b.title ? b.title.toLowerCase() : '';
                    break;
                case 'totalChapters':
                    aVal = a.totalChapters || 0;
                    bVal = b.totalChapters || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'status':
                    aVal = a.status ? a.status.toLowerCase() : '';
                    bVal = b.status ? b.status.toLowerCase() : '';
                    break;
                case 'totalStudents':
                    aVal = a.totalStudents || 0;
                    bVal = b.totalStudents || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                default:
                    return 0;
            }

            // For string values
            var comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;

            return $scope.sortReverse ? -comparison : comparison;
        });
    };

    // ===== Search Courses =====
    $scope.searchCourses = function() {
        // Reset to page 1 when searching
        $scope.currentPage = 1;
        $scope.loadCourses();
    };

    // ===== Pagination Functions =====
    $scope.previousPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadCourses();
        }
    };

    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
            $scope.loadCourses();
        }
    };

    $scope.goToPage = function(page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
            $scope.loadCourses();
        }
    };

    $scope.getPageNumbers = function() {
        var pages = [];
        var startPage = Math.max(1, $scope.currentPage - 2);
        var endPage = Math.min($scope.totalPages, $scope.currentPage + 2);

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    // ===== Change Sort =====
    $scope.changeSortBy = function(sortBy) {
        if ($scope.sortBy === sortBy) {
            // Toggle sort order
            $scope.sortOrder = $scope.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        } else {
            $scope.sortBy = sortBy;
            $scope.sortOrder = 'ASC';
        }
        $scope.currentPage = 1;
        $scope.loadCourses();
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
