// Courses List Controller - Displays all courses with navigation to course viewer
var coursesListApp = angular.module('coursesListApp', []);

coursesListApp.controller('coursesListController', ['$scope', '$timeout', function($scope, $timeout) {

    // ===== Initialize Scope Variables =====
    $scope.courses = [];
    $scope.searchQuery = '';
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading courses...';
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
    $scope.filteredStudentsList = [];

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.showLoading('Loading courses...');
        $scope.loadCourses();
    };

    // ===== Load Courses =====
    $scope.loadCourses = function() {
        $timeout(function() {
            // Sample course data - matches the structure from course-view.js
            $scope.courses = [
                {
                    code: 'CR004',
                    title: 'IAT 2026 – Exclusive 1 Year Course',
                    category: 'Science',
                    description: 'Comprehensive preparation for IISER Aptitude Test 2026',
                    modulesList: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
                    totalModules: 4,
                    totalChapters: 57,
                    totalDuration: '201h 45m',
                    status: 'Active',
                    totalStudents: 450,
                    instructor: 'Expert Faculty Team',
                    rating: '4.9'
                },
                {
                    code: 'CR001',
                    title: 'Advanced Web Development Masterclass',
                    category: 'Web Development',
                    description: 'Master modern web development with hands-on projects',
                    modulesList: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js'],
                    totalModules: 5,
                    totalChapters: 45,
                    totalDuration: '85h 30m',
                    status: 'Active',
                    totalStudents: 1250,
                    instructor: 'John Smith',
                    rating: '4.8'
                },
                {
                    code: 'CR002',
                    title: 'Data Science and Machine Learning',
                    category: 'Data Science',
                    description: 'Complete guide to data science and ML algorithms',
                    modulesList: ['Python', 'Statistics', 'ML Algorithms', 'Deep Learning'],
                    totalModules: 4,
                    totalChapters: 52,
                    totalDuration: '95h 15m',
                    status: 'Active',
                    totalStudents: 890,
                    instructor: 'Dr. Sarah Williams',
                    rating: '4.9'
                },
                {
                    code: 'CR003',
                    title: 'Digital Marketing Fundamentals',
                    category: 'Marketing',
                    description: 'Learn digital marketing strategies and tools',
                    modulesList: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
                    totalModules: 4,
                    totalChapters: 32,
                    totalDuration: '48h 20m',
                    status: 'Active',
                    totalStudents: 675,
                    instructor: 'Mark Thompson',
                    rating: '4.7'
                },
                {
                    code: 'CR005',
                    title: 'Python Programming Bootcamp',
                    category: 'Programming',
                    description: 'From beginner to advanced Python programming',
                    modulesList: ['Basics', 'OOP', 'Data Structures', 'Web Development'],
                    totalModules: 4,
                    totalChapters: 38,
                    totalDuration: '62h 45m',
                    status: 'Active',
                    totalStudents: 1120,
                    instructor: 'James Anderson',
                    rating: '4.8'
                },
                {
                    code: 'CR006',
                    title: 'UI/UX Design Masterclass',
                    category: 'Design',
                    description: 'Master user interface and user experience design',
                    modulesList: ['Design Principles', 'Wireframing', 'Prototyping', 'Testing'],
                    totalModules: 4,
                    totalChapters: 28,
                    totalDuration: '42h 30m',
                    status: 'Draft',
                    totalStudents: 0,
                    instructor: 'Emily Chen',
                    rating: '4.6'
                },
                {
                    code: 'CR007',
                    title: 'Cloud Computing with AWS',
                    category: 'Cloud Computing',
                    description: 'Comprehensive AWS cloud services and architecture',
                    modulesList: ['EC2', 'S3', 'Lambda', 'Database Services'],
                    totalModules: 4,
                    totalChapters: 35,
                    totalDuration: '55h 15m',
                    status: 'Active',
                    totalStudents: 540,
                    instructor: 'Michael Brown',
                    rating: '4.8'
                }
            ];

            $scope.calculateStats();
            $scope.hideLoading();
        }, 500);
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
        // Navigate to course-view page with the first module and first chapter
        // For CR004, we'll open Biology (module 1), Molecular Biology (chapter 2) as per the example
        var moduleId = '1';
        var chapterId = course.code === 'CR004' ? '2' : '1';
        var partId = '0';

        var url = 'course-view.html?courseCode=' + course.code +
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

            students.push({
                id: 'STU' + String(1000 + i).padStart(4, '0'),
                name: name,
                email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@example.com',
                phone: '+1 (' + (200 + Math.floor(Math.random() * 800)) + ') ' +
                       (100 + Math.floor(Math.random() * 900)) + '-' +
                       (1000 + Math.floor(Math.random() * 9000)),
                enrollmentDate: enrollmentDate.getTime(),
                status: Math.random() > 0.1 ? 'active' : 'inactive',
                avatar: null
            });
        }

        return students;
    };

    // ===== View Course Students =====
    $scope.viewCourseStudents = function(course) {
        // Generate students if not already generated
        if (!course.enrolledStudents) {
            course.enrolledStudents = $scope.generateStudentsForCourse(course.code, course.totalStudents);
        }

        $scope.selectedCourseForStudents = course;
        $scope.studentSearchQuery = '';
        $scope.updateFilteredStudentsList();
        $scope.studentsModalOpen = true;
    };

    // ===== Update Filtered Students List =====
    $scope.updateFilteredStudentsList = function() {
        if (!$scope.selectedCourseForStudents || !$scope.selectedCourseForStudents.enrolledStudents) {
            $scope.filteredStudentsList = [];
            return;
        }

        var query = ($scope.studentSearchQuery || '').toLowerCase();
        if (!query) {
            $scope.filteredStudentsList = $scope.selectedCourseForStudents.enrolledStudents;
        } else {
            $scope.filteredStudentsList = $scope.selectedCourseForStudents.enrolledStudents.filter(function(student) {
                return (student.name && student.name.toLowerCase().indexOf(query) !== -1) ||
                       (student.email && student.email.toLowerCase().indexOf(query) !== -1) ||
                       (student.phone && student.phone.toLowerCase().indexOf(query) !== -1) ||
                       (student.id && student.id.toLowerCase().indexOf(query) !== -1);
            });
        }
    };

    // Watch for changes in student search query
    $scope.$watch('studentSearchQuery', function() {
        $scope.updateFilteredStudentsList();
    });

    // ===== Close Students Modal =====
    $scope.closeStudentsModal = function() {
        $scope.studentsModalOpen = false;
        $timeout(function() {
            $scope.selectedCourseForStudents = null;
            $scope.studentSearchQuery = '';
            $scope.filteredStudentsList = [];
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

    // ===== Initialize on Load =====
    $scope.init();

}]);
