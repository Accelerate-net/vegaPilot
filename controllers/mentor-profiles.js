/**
 * Mentor Profiles Management Controller
 * Angular 1.x Controller for managing mentor profiles
 */

var app = angular.module('MentorProfilesApp', ['ngCookies']);

app.controller('MentorProfilesController', ['$scope', '$timeout', '$http', '$cookies', function($scope, $timeout, $http, $cookies) {

    // ===== API Configuration =====
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/people';

    // Get token from localStorage or cookies
    $scope.getAuthToken = function() {
        // Try localStorage first
        var token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');
        // Fallback to cookies
        if (!token) {
            token = $cookies.get('authToken') || $cookies.get('X-Access-Token');
        }
        // If still no token, use the default token
        if (!token) {
        }
        return token;
    };

    // HTTP Config with auth header
    $scope.getHttpConfig = function() {
        return {
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': 'application/json'
            }
        };
    };

    // HTTP Config for FormData
    $scope.getFormDataConfig = function() {
        return {
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': undefined // Let browser set it for FormData
            },
            transformRequest: angular.identity
        };
    };

    // ===== Initialize Data =====
    $scope.mentors = [];
    $scope.filteredMentors = [];
    $scope.paginatedMentors = [];
    $scope.specializationList = [];
    $scope.searchQuery = '';
    $scope.filterSpecialization = '';
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.itemsPerPage = 10;
    $scope.totalMentors = 0;
    $scope.totalPages = 0;
    $scope.sortBy = 'name';
    $scope.sortColumn = '';
    $scope.sortReverse = false;

    // ===== Modal States =====
    $scope.editModalOpen = false;
    $scope.deleteModalOpen = false;
    $scope.viewModalOpen = false;
    $scope.studentsModalOpen = false;
    $scope.editMode = false;

    // ===== Current Items =====
    $scope.currentMentor = {};
    $scope.selectedMentor = {};
    $scope.selectedMentorForStudents = null;
    $scope.mentorToDelete = {};

    // ===== Loading State =====
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.showLoading('Loading mentors...');
        $scope.loadMentors();
    };

    // ===== Pagination Functions =====
    $scope.getTotalPages = function() {
        return $scope.totalPages || Math.ceil($scope.totalMentors / $scope.itemsPerPage);
    };

    $scope.getPageNumbers = function() {
        var totalPages = $scope.getTotalPages();
        var currentPage = $scope.currentPage;
        var pages = [];
        var maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (var i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            var startPage = Math.max(1, currentPage - 2);
            var endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

            if (endPage - startPage < maxPagesToShow - 1) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }

            for (var i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    $scope.goToPage = function(page) {
        if (page !== $scope.currentPage && page >= 1 && page <= $scope.getTotalPages()) {
            $scope.currentPage = page;
            $scope.loadMentors();
        }
    };

    $scope.previousPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadMentors();
        }
    };

    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
            $scope.loadMentors();
        }
    };

    $scope.getStartIndex = function() {
        return ($scope.currentPage - 1) * $scope.itemsPerPage;
    };

    $scope.getEndIndex = function() {
        var end = $scope.currentPage * $scope.itemsPerPage;
        return Math.min(end, $scope.totalMentors);
    };

    // ===== Load Mentors from API =====
    $scope.loadMentors = function() {
        $scope.showLoading('Loading mentors...');

        // Build API URL with pagination, sorting, and search parameters
        var url = $scope.apiBaseUrl + '/list-mentors.php';
        url += '?page=' + $scope.currentPage;
        url += '&size=' + $scope.pageSize;

        if ($scope.sortBy) {
            url += '&sortBy=' + $scope.sortBy;
        }

        if ($scope.searchQuery) {
            url += '&searchKey=' + encodeURIComponent($scope.searchQuery);
        }

        if ($scope.filterSpecialization) {
            url += '&filterBy=' + encodeURIComponent($scope.filterSpecialization);
        }

        $http.get(url, $scope.getHttpConfig())
            .then(function(response) {
                console.log('API Response:', response.data);

                if (response.data && response.data.data) {
                    $scope.mentors = response.data.data;

                    // Map API fields to display fields
                    $scope.mentors = $scope.mentors.map(function(mentor) {
                        if (!mentor.photo) {
                            mentor.photo = null;
                        }
                        mentor.active = mentor.status === 1;
                        // Map numberOfMappedStudents to mentoringStudents count
                        mentor.studentCount = mentor.numberOfMappedStudents || 0;
                        return mentor;
                    });

                    // Get total count and pagination info from API meta
                    if (response.data.meta && typeof response.data.meta.total !== 'undefined') {
                        $scope.totalMentors = response.data.meta.total;
                        $scope.totalPages = response.data.meta.totalPages || Math.ceil($scope.totalMentors / $scope.pageSize);
                    } else {
                        $scope.totalMentors = $scope.mentors.length;
                    }

                    // Get specialization list from API meta
                    if (response.data.meta && response.data.meta.specializationList) {
                        $scope.specializationList = response.data.meta.specializationList;
                    }

                    // API already returns paginated data, use it directly
                    $scope.paginatedMentors = $scope.mentors.slice();
                    $scope.filteredMentors = $scope.mentors.slice();

                    console.log('Loaded ' + $scope.mentors.length + ' mentors, Total: ' + $scope.totalMentors);
                } else {
                    console.error('Invalid API response format');
                    $scope.mentors = [];
                    $scope.paginatedMentors = [];
                    $scope.filteredMentors = [];
                }

                $scope.hideLoading();
            })
            .catch(function(error) {
                console.error('Error loading mentors:', error);
                alert('Failed to load mentors. Please try again.');
                $scope.mentors = [];
                $scope.paginatedMentors = [];
                $scope.filteredMentors = [];
                $scope.hideLoading();
            });
    };

    // ===== Load Single Mentor Profile =====
    $scope.loadMentorProfile = function(mentorId) {
        $scope.showLoading('Loading mentor profile...');

        var url = $scope.apiBaseUrl + '/get-mentor-profile.php?id=' + mentorId;

        $http.get(url, $scope.getHttpConfig())
            .then(function(response) {
                if (response.data && response.data.data) {
                    // API returns nested structure with profile and ratings
                    if (response.data.data.profile) {
                        $scope.selectedMentor = response.data.data.profile;
                        // Add ratings data if available
                        if (response.data.data.ratings) {
                            $scope.selectedMentor.rating = response.data.data.ratings.rating;
                            $scope.selectedMentor.totalStudents = response.data.data.ratings.totalStudents;
                        }
                    } else {
                        // Fallback for flat structure
                        $scope.selectedMentor = response.data.data;
                    }
                    $scope.selectedMentor.active = $scope.selectedMentor.status === 1;
                    $scope.viewModalOpen = true;
                }
                $scope.hideLoading();
            })
            .catch(function(error) {
                console.error('Error loading mentor profile:', error);
                alert('Failed to load mentor profile. Please try again.');
                $scope.hideLoading();
            });
    };

    // ===== Create New Mentor =====
    $scope.openCreateModal = function() {
        $scope.editMode = false;
        $scope.currentMentor = {
            name: '',
            brief: '',
            photo: null,
            photoPreview: null,
            photoFile: null,
            specialisation: '',
            almaMater: '',
            graduationYear: '',
            email: '',
            mobile: '',
            active: true
        };
        $scope.editModalOpen = true;
    };

    // ===== Edit Mentor =====
    $scope.openEditModal = function(mentor) {
        $scope.editMode = true;
        // Create a copy to avoid direct modification
        $scope.currentMentor = angular.copy(mentor);
        $scope.currentMentor.photoPreview = null;
        $scope.currentMentor.photoFile = null;
        $scope.editModalOpen = true;
    };

    $scope.closeEditModal = function() {
        $scope.editModalOpen = false;
        $scope.currentMentor = {};
    };

    // ===== View Mentor Profile =====
    $scope.viewMentor = function(mentor) {
        // Load full profile from API
        $scope.loadMentorProfile(mentor.id);
    };

    $scope.closeViewModal = function() {
        $scope.viewModalOpen = false;
        $scope.selectedMentor = {};
    };

    $scope.editFromView = function() {
        // Close view modal and open edit modal
        $scope.viewModalOpen = false;
        $scope.openEditModal($scope.selectedMentor);
    };

    // ===== Star Rating Helper =====
    $scope.getStarClass = function(rating, index) {
        var starValue = index + 1;
        if (rating >= starValue) {
            return 'fa-star'; // Full star
        } else if (rating >= starValue - 0.5) {
            return 'fa-star-half-o'; // Half star
        } else {
            return 'fa-star-o'; // Empty star
        }
    };

    // ===== Save Mentor =====
    $scope.saveMentor = function() {
        if (!$scope.currentMentor.name ||
            !$scope.currentMentor.brief ||
            !$scope.currentMentor.specialisation ||
            !$scope.currentMentor.almaMater ||
            !$scope.currentMentor.graduationYear) {
            return;
        }

        $scope.showLoading($scope.editMode ? 'Updating mentor...' : 'Creating mentor...');

        // Prepare FormData for file upload
        var formData = new FormData();
        formData.append('name', $scope.currentMentor.name);
        formData.append('brief', $scope.currentMentor.brief);
        formData.append('specialisation', $scope.currentMentor.specialisation);
        formData.append('almaMater', $scope.currentMentor.almaMater);
        formData.append('graduationYear', $scope.currentMentor.graduationYear);

        if ($scope.currentMentor.email) {
            formData.append('email', $scope.currentMentor.email);
        }
        if ($scope.currentMentor.mobile) {
            formData.append('mobile', $scope.currentMentor.mobile);
        }

        // Add photo if there's a new file
        if ($scope.currentMentor.photoFile) {
            formData.append('photo', $scope.currentMentor.photoFile);
        }

        var url, method;
        if ($scope.editMode) {
            url = $scope.apiBaseUrl + '/update-mentor.php?id=' + $scope.currentMentor.id;
            method = 'POST';
        } else {
            url = $scope.apiBaseUrl + '/add-new-mentor.php';
            method = 'POST';
        }

        $http({
            method: method,
            url: url,
            data: formData,
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        })
        .then(function(response) {
            console.log('Save response:', response.data);

            if (response.data.status) {
                // Reload mentors list
                $scope.loadMentors();
                $scope.closeEditModal();
            } else {
                alert('Error: ' + (response.data.error || 'Failed to save mentor'));
                $scope.hideLoading();
            }
        })
        .catch(function(error) {
            console.error('Error saving mentor:', error);
            alert('Failed to save mentor. Please try again.');
            $scope.hideLoading();
        });
    };

    // ===== Delete Mentor =====
    $scope.confirmDelete = function(mentor) {
        $scope.mentorToDelete = mentor;
        $scope.deleteModalOpen = true;
    };

    $scope.closeDeleteModal = function() {
        $scope.deleteModalOpen = false;
        $scope.mentorToDelete = {};
    };

    $scope.deleteMentor = function() {
        $scope.showLoading('Deleting mentor...');

        // Note: You'll need to add delete API endpoint
        var url = $scope.apiBaseUrl + '/delete-mentor.php?id=' + $scope.mentorToDelete.id;

        $http.post(url, {}, $scope.getHttpConfig())
            .then(function(response) {
                if (response.data.status) {
                    $scope.loadMentors();
                    $scope.closeDeleteModal();
                } else {
                    alert('Error: ' + (response.data.error || 'Failed to delete mentor'));
                    $scope.hideLoading();
                }
            })
            .catch(function(error) {
                console.error('Error deleting mentor:', error);
                alert('Failed to delete mentor. Please try again.');
                $scope.hideLoading();
            });
    };

    // ===== Photo Upload =====
    $scope.handlePhotoSelect = function(file) {
        if (!file) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        // Check file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        $scope.$apply(function() {
            $scope.currentMentor.photoFile = file;

            // Create preview
            var reader = new FileReader();
            reader.onload = function(e) {
                $scope.$apply(function() {
                    $scope.currentMentor.photoPreview = e.target.result;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    // ===== Remove Photo =====
    $scope.removePhoto = function() {
        $scope.currentMentor.photo = null;
        $scope.currentMentor.photoPreview = null;
        $scope.currentMentor.photoFile = null;
        // Reset the file input
        var fileInput = document.getElementById('photoInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // ===== Filter & Sort (Server-Side) =====
    var filterTimeout;
    $scope.filterMentors = function() {
        // Cancel previous timeout if exists
        if (filterTimeout) {
            $timeout.cancel(filterTimeout);
        }

        // Set new timeout for debounce (500ms delay)
        filterTimeout = $timeout(function() {
            // Reset to page 1 and reload from API with filters
            $scope.currentPage = 1;
            $scope.loadMentors();
        }, 500);
    };

    $scope.sortMentors = function() {
        // Reload from API with new sort order
        $scope.loadMentors();
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

        // Map display column names to API field names
        var sortByMap = {
            'name': 'name',
            'institution': 'almaMater',
            'specialization': 'specialisation'
        };

        $scope.sortBy = sortByMap[column] || column;
        $scope.loadMentors();
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

    // ===== View Mentoring Students Modal =====
    $scope.studentsCurrentPage = 1;
    $scope.studentsPageSize = 5;
    $scope.studentsTotalCount = 0;
    $scope.studentsTotalPages = 0;
    $scope.studentsSearch = {
        key: ''
    };
    var studentsSearchTimeout;

    $scope.viewMentoringStudents = function(mentor) {
        $scope.selectedMentorForStudents = mentor;
        $scope.selectedMentorForStudents.mentoringStudents = []; // Initialize empty array
        $scope.studentsCurrentPage = 1;
        $scope.studentsSearch.key = '';
        $scope.studentsModalOpen = true;

        // Load first page of students
        $scope.loadMappedStudents();
    };

    $scope.loadMappedStudents = function() {
        if (!$scope.selectedMentorForStudents) return;

        // Fetch mapped students from API with pagination and search
        $scope.showLoading('Loading students...');
        var url = $scope.apiBaseUrl + '/get-candidates-mapped-to-mentor-profile.php';
        url += '?id=' + $scope.selectedMentorForStudents.id;
        url += '&page=' + $scope.studentsCurrentPage;
        url += '&size=' + $scope.studentsPageSize;

        // Add search key if it exists and is not empty
        var searchKey = ($scope.studentsSearch.key || '').trim();
        if (searchKey && searchKey.length > 0) {
            url += '&searchKey=' + encodeURIComponent(searchKey);
        }

        console.log('Loading students with URL:', url);
        console.log('Search key:', searchKey);

        $http.get(url, $scope.getHttpConfig())
            .then(function(response) {
                if (response.data && response.data.data) {
                    $scope.selectedMentorForStudents.mentoringStudents = response.data.data;

                    // Get pagination info from meta
                    if (response.data.meta) {
                        $scope.studentsTotalCount = response.data.meta.total || 0;
                        $scope.studentsTotalPages = response.data.meta.totalPages || Math.ceil($scope.studentsTotalCount / $scope.studentsPageSize);
                    } else {
                        $scope.studentsTotalCount = $scope.selectedMentorForStudents.mentoringStudents.length;
                        $scope.studentsTotalPages = 1;
                    }
                } else {
                    $scope.selectedMentorForStudents.mentoringStudents = [];
                    $scope.studentsTotalCount = 0;
                    $scope.studentsTotalPages = 0;
                }
                $scope.hideLoading();
            })
            .catch(function(error) {
                console.error('Error loading mapped students:', error);
                $scope.selectedMentorForStudents.mentoringStudents = [];
                $scope.studentsTotalCount = 0;
                $scope.studentsTotalPages = 0;
                $scope.hideLoading();
                alert('Failed to load students. Please try again.');
            });
    };

    $scope.filterStudents = function() {
        if (studentsSearchTimeout) {
            $timeout.cancel(studentsSearchTimeout);
        }
        studentsSearchTimeout = $timeout(function() {
            $scope.studentsCurrentPage = 1;
            $scope.loadMappedStudents();
        }, 500);
    };

    $scope.studentsGoToPage = function(page) {
        if (page >= 1 && page <= $scope.studentsTotalPages) {
            $scope.studentsCurrentPage = page;
            $scope.loadMappedStudents();
        }
    };

    $scope.studentsPreviousPage = function() {
        if ($scope.studentsCurrentPage > 1) {
            $scope.studentsCurrentPage--;
            $scope.loadMappedStudents();
        }
    };

    $scope.studentsNextPage = function() {
        if ($scope.studentsCurrentPage < $scope.studentsTotalPages) {
            $scope.studentsCurrentPage++;
            $scope.loadMappedStudents();
        }
    };

    $scope.getStudentsStartIndex = function() {
        return ($scope.studentsCurrentPage - 1) * $scope.studentsPageSize;
    };

    $scope.getStudentsEndIndex = function() {
        var end = $scope.studentsCurrentPage * $scope.studentsPageSize;
        return Math.min(end, $scope.studentsTotalCount);
    };

    $scope.getStudentsPageNumbers = function() {
        var pages = [];
        var maxPagesToShow = 5;
        var startPage = Math.max(1, $scope.studentsCurrentPage - Math.floor(maxPagesToShow / 2));
        var endPage = Math.min($scope.studentsTotalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.closeStudentsModal = function() {
        $scope.studentsModalOpen = false;
        $timeout(function() {
            $scope.selectedMentorForStudents = null;
        }, 300);
    };

    // ===== View Student Profile =====
    $scope.viewStudentProfile = function(student) {
        localStorage.setItem('selectedStudent', JSON.stringify(student));
        window.open('candidate-detail.html', '_blank');
        $scope.closeStudentsModal();
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
