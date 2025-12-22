var app = angular.module('batchApp', ['ngCookies']);

app.controller('batchController', function($scope, $http, $cookies, $timeout) {

    // Initialize scope variables
    $scope.batches = [];
    $scope.availableCourses = [];
    $scope.newBatch = {};
    $scope.selectedBatch = null;
    $scope.selectedCourse = null;
    $scope.editingBatch = false;
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // Modal control variables
    $scope.studentsModalOpen = false;
    $scope.selectedBatchForStudents = null;
    $scope.studentSearchQuery = '';
    $scope.studentFilter = 'all'; // 'all', 'enrolled', 'not-enrolled'
    $scope.detailsModalOpen = false;
    $scope.selectedBatchForDetails = null;
    $scope.deleteModalOpen = false;
    $scope.batchToDelete = null;
    $scope.addStudentsModalOpen = false;
    $scope.batchForAddingStudents = null;
    $scope.studentsToAddCount = null;
    $scope.availableStudentsForBatch = [];
    $scope.filteredAvailableStudents = [];
    $scope.selectedStudentsToAdd = {}; // Map of student IDs to be added

    // Sorting state
    $scope.sortColumn = 'batchName';
    $scope.sortReverse = false;

    // Dummy data for available courses
    $scope.availableCourses = [
        { id: 'COURSE-001', title: 'IAT 2026 – Exclusive 1 Year Course' },
        { id: 'COURSE-002', title: 'NEET 2026 Complete Preparation' },
        { id: 'COURSE-003', title: 'JEE Advanced 2026 Crash Course' },
        { id: 'COURSE-004', title: 'Foundation Course - Class 11' },
        { id: 'COURSE-005', title: 'Foundation Course - Class 12' }
    ];

    // Dummy batch data
    $scope.batches = [
        {
            id: 'BATCH-001',
            batchName: 'IAT 2026 - Batch A',
            numberOfStudents: 450,
            description: 'Primary batch for IAT 2026 preparation with comprehensive curriculum',
            startDate: '2025-01-15',
            endDate: '2026-05-30',
            createdOn: Date.now(),
            students: generateDummyStudents(450, true), // All enrolled
            enrolledCourses: ['IAT 2026 – Exclusive 1 Year Course', 'Foundation Course - Class 11'], // Array of courses
            active: 1
        },
        {
            id: 'BATCH-002',
            batchName: 'NEET 2026 - Morning Batch',
            numberOfStudents: 300,
            description: 'Morning session for NEET aspirants',
            startDate: '2025-02-01',
            endDate: '2026-05-15',
            createdOn: Date.now(),
            students: generateDummyStudents(280, true), // 280 enrolled
            enrolledCourses: ['NEET 2026 Complete Preparation'],
            active: 1
        },
        {
            id: 'BATCH-003',
            batchName: 'JEE 2026 - Evening Batch',
            numberOfStudents: 200,
            description: 'Evening session for JEE Advanced preparation',
            startDate: '2025-03-01',
            endDate: '2026-04-30',
            createdOn: Date.now(),
            students: generateDummyStudents(180, false), // 180 students, 20 not enrolled
            enrolledCourses: ['JEE Advanced 2026 Crash Course', 'Foundation Course - Class 12'],
            active: 1
        },
        {
            id: 'BATCH-004',
            batchName: 'Foundation Batch 2025',
            numberOfStudents: 150,
            description: 'Foundation course for Class 11 students',
            startDate: '2025-04-01',
            endDate: '2026-03-31',
            createdOn: Date.now(),
            students: generateDummyStudents(150, true),
            enrolledCourses: [], // Not enrolled to any course yet
            active: 1
        }
    ];

    // Generate dummy students
    function generateDummyStudents(count, allEnrolled) {
        var students = [];
        var unenrolledCount = allEnrolled ? 0 : Math.min(20, Math.floor(count * 0.1));

        for (var i = 1; i <= count; i++) {
            students.push({
                id: 'STU-' + Date.now() + '-' + i,
                name: 'Student ' + i,
                email: 'student' + i + '@example.com',
                enrolledToCourse: i > (count - unenrolledCount) ? false : true, // Last N students are not enrolled
                addedOn: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
            });
        }
        return students;
    }

    // Open create batch modal
    $scope.openCreateBatchModal = function() {
        $scope.editingBatch = false;
        $scope.newBatch = {
            batchName: '',
            numberOfStudents: null,
            description: '',
            startDate: null,
            endDate: null,
            active: 1
        };
        $('#batchModal').modal('show');
    };

    // Edit batch
    $scope.editBatch = function(batch) {
        $scope.editingBatch = true;
        $scope.newBatch = angular.copy(batch);
        $('#batchModal').modal('show');
    };

    // Save batch (create or update)
    $scope.saveBatch = function() {
        // Validate required fields
        if (!$scope.newBatch.batchName || !$scope.newBatch.numberOfStudents) {
            alert('Please fill in all required fields');
            return;
        }

        if ($scope.newBatch.numberOfStudents < 1) {
            alert('Number of students must be at least 1');
            return;
        }

        $scope.isLoading = true;
        $scope.loadingMessage = $scope.editingBatch ? 'Updating batch...' : 'Creating batch...';

        $timeout(function() {
            if ($scope.editingBatch) {
                // Update existing batch
                var index = $scope.batches.findIndex(function(b) { return b.id === $scope.newBatch.id; });
                if (index !== -1) {
                    $scope.batches[index] = angular.copy($scope.newBatch);
                }
            } else {
                // Create new batch
                $scope.newBatch.id = 'BATCH-' + Date.now();
                $scope.newBatch.createdOn = Date.now();
                $scope.newBatch.students = []; // Start with empty student list
                $scope.newBatch.enrolledCourses = []; // Initialize as empty array
                $scope.batches.unshift(angular.copy($scope.newBatch));
            }

            $scope.isLoading = false;
            $('#batchModal').modal('hide');
        }, 500);
    };

    // Delete batch - Open confirmation modal
    $scope.deleteBatch = function(batch) {
        $scope.batchToDelete = batch;
        $scope.deleteModalOpen = true;
    };

    // Close delete modal
    $scope.closeDeleteModal = function() {
        $scope.deleteModalOpen = false;
        $scope.batchToDelete = null;
    };

    // Confirm delete
    $scope.confirmDelete = function() {
        $scope.isLoading = true;
        $scope.loadingMessage = 'Deleting batch...';
        $scope.deleteModalOpen = false;

        $timeout(function() {
            var index = $scope.batches.indexOf($scope.batchToDelete);
            if (index !== -1) {
                $scope.batches.splice(index, 1);
            }
            $scope.isLoading = false;
            $scope.batchToDelete = null;
        }, 500);
    };

    // Open manage courses modal
    $scope.openEnrollCourseModal = function(batch) {
        $scope.selectedBatch = batch;
        $scope.selectedCourse = null;
        // Initialize enrolledCourses array if it doesn't exist
        if (!$scope.selectedBatch.enrolledCourses) {
            $scope.selectedBatch.enrolledCourses = [];
        }
        $('#enrollCourseModal').modal('show');
    };

    // Add course to batch
    $scope.addCourseToBatch = function() {
        if (!$scope.selectedCourse) {
            return;
        }

        // Check if course is already enrolled
        if ($scope.selectedBatch.enrolledCourses && $scope.selectedBatch.enrolledCourses.indexOf($scope.selectedCourse) !== -1) {
            alert('This course is already enrolled to the batch');
            return;
        }

        $scope.isLoading = true;
        $scope.loadingMessage = 'Adding course and enrolling students...';

        $timeout(function() {
            // Initialize enrolledCourses array if it doesn't exist
            if (!$scope.selectedBatch.enrolledCourses) {
                $scope.selectedBatch.enrolledCourses = [];
            }

            // Add course to the batch
            $scope.selectedBatch.enrolledCourses.push($scope.selectedCourse);

            // Mark all existing students as enrolled (to at least one course)
            $scope.selectedBatch.students.forEach(function(student) {
                student.enrolledToCourse = true;
            });

            $scope.isLoading = false;
            $scope.selectedCourse = null;
        }, 800);
    };

    // Remove course from batch
    $scope.removeCourseFromBatch = function(courseTitle) {
        if (!confirm('Are you sure you want to remove "' + courseTitle + '" from this batch? All students will be unenrolled from this course.')) {
            return;
        }

        $scope.isLoading = true;
        $scope.loadingMessage = 'Removing course...';

        $timeout(function() {
            // Remove course from enrolledCourses array
            var index = $scope.selectedBatch.enrolledCourses.indexOf(courseTitle);
            if (index !== -1) {
                $scope.selectedBatch.enrolledCourses.splice(index, 1);
            }

            // If no courses left, mark all students as not enrolled
            if (!$scope.selectedBatch.enrolledCourses || $scope.selectedBatch.enrolledCourses.length === 0) {
                $scope.selectedBatch.students.forEach(function(student) {
                    student.enrolledToCourse = false;
                });
            }

            $scope.isLoading = false;
        }, 800);
    };

    // Generate pool of available students (not in any batch yet)
    $scope.allAvailableStudents = [];
    for (var i = 1; i <= 100; i++) {
        $scope.allAvailableStudents.push({
            id: 'AVAIL-STU-' + i,
            name: 'Available Student ' + i,
            email: 'available' + i + '@example.com',
            phone: '+91 ' + (9000000000 + i),
            status: i % 5 === 0 ? 'inactive' : 'active',
            registrationDate: Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
        });
    }

    // Add students to batch - Open modal
    $scope.addStudentsToBatch = function(batch) {
        $scope.batchForAddingStudents = batch;
        $scope.selectedStudentsToAdd = {};
        $scope.studentSearchQuery = '';

        // Get students already in this batch
        var batchStudentIds = batch.students.map(function(s) { return s.id; });

        // Filter out students already in this batch
        $scope.availableStudentsForBatch = $scope.allAvailableStudents.filter(function(student) {
            return batchStudentIds.indexOf(student.id) === -1;
        });

        $scope.filteredAvailableStudents = angular.copy($scope.availableStudentsForBatch);
        $scope.addStudentsModalOpen = true;
    };

    // Close add students modal
    $scope.closeAddStudentsModal = function() {
        $scope.addStudentsModalOpen = false;
        $timeout(function() {
            $scope.batchForAddingStudents = null;
            $scope.selectedStudentsToAdd = {};
            $scope.studentSearchQuery = '';
            $scope.availableStudentsForBatch = [];
            $scope.filteredAvailableStudents = [];
        }, 300);
    };

    // Toggle student selection for adding to batch
    $scope.toggleStudentSelection = function(student) {
        if ($scope.selectedStudentsToAdd[student.id]) {
            delete $scope.selectedStudentsToAdd[student.id];
        } else {
            $scope.selectedStudentsToAdd[student.id] = student;
        }
    };

    // Check if student is selected
    $scope.isStudentSelected = function(student) {
        return !!$scope.selectedStudentsToAdd[student.id];
    };

    // Get count of selected students
    $scope.getSelectedStudentsCount = function() {
        return Object.keys($scope.selectedStudentsToAdd).length;
    };

    // Select all students
    $scope.selectAllStudents = function($event) {
        $event.stopPropagation();
        var checkbox = $event.target;

        if (checkbox.checked) {
            // Select all filtered students
            $scope.filteredAvailableStudents.forEach(function(student) {
                $scope.selectedStudentsToAdd[student.id] = student;
            });
        } else {
            // Deselect all
            $scope.selectedStudentsToAdd = {};
        }
    };

    // Watch for search query changes
    $scope.$watch('studentSearchQuery', function(newVal) {
        if (!$scope.availableStudentsForBatch || $scope.availableStudentsForBatch.length === 0) {
            return;
        }

        if (!newVal) {
            $scope.filteredAvailableStudents = angular.copy($scope.availableStudentsForBatch);
        } else {
            var searchLower = newVal.toLowerCase();
            $scope.filteredAvailableStudents = $scope.availableStudentsForBatch.filter(function(student) {
                return student.name.toLowerCase().indexOf(searchLower) !== -1 ||
                       student.email.toLowerCase().indexOf(searchLower) !== -1 ||
                       student.phone.indexOf(searchLower) !== -1;
            });
        }
    });

    // Confirm add students
    $scope.confirmAddStudents = function() {
        var selectedCount = $scope.getSelectedStudentsCount();

        if (selectedCount === 0) {
            alert('Please select at least one student to add.');
            return;
        }

        $scope.isLoading = true;
        $scope.loadingMessage = 'Adding ' + selectedCount + ' student(s) to batch...';
        $scope.closeAddStudentsModal();

        $timeout(function() {
            // Add selected students to batch
            Object.values($scope.selectedStudentsToAdd).forEach(function(student) {
                $scope.batchForAddingStudents.students.push({
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    enrolledToCourse: false, // New students are NOT enrolled by default
                    addedOn: Date.now()
                });
            });

            $scope.isLoading = false;
            alert(selectedCount + ' student(s) added to batch successfully!');
        }, 800);
    };

    // Get initials for avatar
    $scope.getInitials = function(name) {
        if (!name) return '??';
        var parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Format date
    $scope.formatDate = function(timestamp) {
        var date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // View batch details - Open modal
    $scope.viewBatchDetails = function(batch) {
        $scope.selectedBatchForDetails = batch;
        $scope.detailsModalOpen = true;
    };

    // Close details modal
    $scope.closeDetailsModal = function() {
        $scope.detailsModalOpen = false;
        $scope.selectedBatchForDetails = null;
    };

    // View batch students - Open modal
    $scope.viewBatchStudents = function(batch) {
        $scope.selectedBatchForStudents = batch;
        $scope.studentSearchQuery = '';
        $scope.studentFilter = 'all'; // Reset filter to 'all'
        $scope.studentsModalOpen = true;
    };

    // Close students modal
    $scope.closeStudentsModal = function() {
        $scope.studentsModalOpen = false;
        $scope.selectedBatchForStudents = null;
        $scope.studentSearchQuery = '';
        $scope.studentFilter = 'all';
    };

    // Set student filter
    $scope.setStudentFilter = function(filter) {
        $scope.studentFilter = filter;
    };

    // Get filtered students based on selected filter
    $scope.getFilteredStudents = function() {
        if (!$scope.selectedBatchForStudents || !$scope.selectedBatchForStudents.students) {
            return [];
        }

        var students = $scope.selectedBatchForStudents.students;

        if ($scope.studentFilter === 'enrolled') {
            return students.filter(function(s) { return s.enrolledToCourse; });
        } else if ($scope.studentFilter === 'not-enrolled') {
            return students.filter(function(s) { return !s.enrolledToCourse; });
        }

        // 'all' or default
        return students;
    };

    // Navigate to student profile
    $scope.navigateToStudentProfile = function(student) {
        // Navigate to candidate profile page with student ID
        window.location.href = 'candidate-profile.html?studentId=' + student.id;
    };

    // Get batch status
    $scope.getBatchStatus = function(batch) {
        if (!batch) return 'Active';
        if (!batch.startDate) return 'Active';

        var today = new Date();
        var startDate = new Date(batch.startDate);
        var endDate = batch.endDate ? new Date(batch.endDate) : null;

        if (today < startDate) {
            return 'Upcoming';
        } else if (endDate && today > endDate) {
            return 'Completed';
        } else {
            return 'Active';
        }
    };

    // Get batch status class
    $scope.getBatchStatusClass = function(batch) {
        if (!batch) return {};
        var status = $scope.getBatchStatus(batch);
        return {
            'status-active': status === 'Active',
            'status-upcoming': status === 'Upcoming',
            'status-completed': status === 'Completed'
        };
    };

    // Format date
    $scope.formatDate = function(dateValue) {
        if (!dateValue) return '';
        var date = new Date(dateValue);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Get unenrolled students in a batch
    $scope.getUnenrolledStudentsInBatch = function(batch) {
        if (!batch || !batch.students) return 0;
        return batch.students.filter(function(s) { return !s.enrolledToCourse; }).length;
    };

    // Statistics functions
    $scope.getTotalBatches = function() {
        return $scope.batches.length;
    };

    $scope.getActiveBatches = function() {
        return $scope.batches.filter(function(b) {
            return $scope.getBatchStatus(b) === 'Active';
        }).length;
    };

    $scope.getTotalStudents = function() {
        return $scope.batches.reduce(function(sum, batch) {
            return sum + batch.students.length;
        }, 0);
    };

    $scope.getUnenrolledCount = function() {
        return $scope.batches.reduce(function(sum, batch) {
            return sum + $scope.getUnenrolledStudentsInBatch(batch);
        }, 0);
    };

    // ===== Sortable Column Functionality =====
    $scope.sortByColumn = function(column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        $scope.batches.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'batchName':
                    aVal = a.batchName.toLowerCase();
                    bVal = b.batchName.toLowerCase();
                    break;
                case 'studentCount':
                    aVal = a.students.length;
                    bVal = b.students.length;
                    break;
                case 'startDate':
                    aVal = a.startDate ? new Date(a.startDate) : new Date(0);
                    bVal = b.startDate ? new Date(b.startDate) : new Date(0);
                    break;
                case 'status':
                    aVal = $scope.getBatchStatus(a).toLowerCase();
                    bVal = $scope.getBatchStatus(b).toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return $scope.sortReverse ? 1 : -1;
            if (aVal > bVal) return $scope.sortReverse ? -1 : 1;
            return 0;
        });
    };

});
