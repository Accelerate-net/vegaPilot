/**
 * Instructor Portfolio Management Controller
 * Angular 1.x Controller for managing instructor profiles
 */

var app = angular.module('InstructorPortfolioApp', ['ngCookies']);

app.controller('InstructorPortfolioController', ['$scope', '$timeout', '$http', '$cookies', function ($scope, $timeout, $http, $cookies) {
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




    // ===== API Configuration =====
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/people';

    // Get token from localStorage or cookies


    // HTTP Config with auth header
    $scope.getHttpConfig = function () {
        return {
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            }
        };
    };

    // HTTP Config for FormData
    $scope.getFormDataConfig = function () {
        return {
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': undefined // Let browser set it for FormData
            },
            transformRequest: angular.identity
        };
    };

    // ===== Initialize Data =====
    $scope.instructors = [];
    $scope.filteredInstructors = [];
    $scope.paginatedInstructors = [];
    $scope.subjectList = [];
    $scope.searchQuery = '';
    $scope.filterSubject = '';
    $scope.sortBy = 'name';
    $scope.sortColumn = '';
    $scope.sortReverse = false;

    // ===== Pagination =====
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalInstructors = 0;
    $scope.totalPages = 0;

    // ===== Modal States =====
    $scope.editModalOpen = false;
    $scope.deleteModalOpen = false;
    $scope.viewModalOpen = false;
    $scope.lessonsModalOpen = false;
    $scope.editMode = false;

    // ===== Current Items =====
    $scope.currentInstructor = {};
    $scope.selectedInstructor = {};
    $scope.instructorToDelete = {};
    $scope.selectedInstructorForLessons = {};

    // ===== Loading State =====
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // ===== Pagination Functions (Server-Side) =====
    $scope.getTotalPages = function () {
        // Use server-provided totalPages or calculate from totalInstructors
        return $scope.totalPages || Math.ceil($scope.totalInstructors / $scope.pageSize);
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
        if (page !== $scope.currentPage && page >= 1 && page <= $scope.getTotalPages()) {
            $scope.currentPage = page;
            $scope.loadInstructors(); // Reload from API with new page
        }
    };

    $scope.previousPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadInstructors(); // Reload from API
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
            $scope.loadInstructors(); // Reload from API
        }
    };

    $scope.getStartIndex = function () {
        return ($scope.currentPage - 1) * $scope.pageSize;
    };

    $scope.getEndIndex = function () {
        return Math.min($scope.getStartIndex() + $scope.pageSize, $scope.totalInstructors);
    };

    // ===== Kebab Menu Logic =====
    $scope.toggleKebabMenu = function (instructor, $event) {
        $event.stopPropagation();
        var currentStatus = instructor.showKebabMenu;

        // Close all other menus
        $scope.instructors.forEach(function (i) {
            i.showKebabMenu = false;
        });

        // Toggle current
        instructor.showKebabMenu = !currentStatus;
    };

    // Close menus on click outside
    angular.element(document).on('click', function () {
        $timeout(function () {
            if ($scope.instructors) {
                $scope.instructors.forEach(function (i) {
                    i.showKebabMenu = false;
                });
            }
        });
    });

    // ===== Initialize App =====
    $scope.init = function () {
        // Check if token exists, if not set default for development
        var token = getAdminTokenFromCookie();
        if (!token) {
            console.warn('No auth token found. Setting default token for development.');
            // Set default token for development
            localStorage.setItem('authToken', defaultToken);
        }

        $scope.showLoading('Loading instructors...');
        $scope.loadInstructors();
    };

    // ===== Load Instructors =====
    $scope.loadInstructors = function () {
        $scope.showLoading('Loading instructors...');

        // Build query parameters
        var params = {
            page: $scope.currentPage,
            size: $scope.pageSize
        };

        if ($scope.sortBy) {
            params.sortBy = $scope.sortBy;
        }

        if ($scope.filterSubject) {
            params.filterBy = $scope.filterSubject;
        }

        if ($scope.searchQuery) {
            params.searchKey = $scope.searchQuery;
        }

        // Build query string
        var queryString = Object.keys(params)
            .map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            })
            .join('&');

        $http.get($scope.apiBaseUrl + '/list-instructors.php?' + queryString, $scope.getHttpConfig())
            .then(function (response) {
                // Handle both response formats: success: true or status: 'success'
                var isSuccess = (response.data && (response.data.success === true || response.data.status === 'success'));

                if (isSuccess) {
                    // Check if data is directly in response.data or in response.data.data
                    if (Array.isArray(response.data.data)) {
                        $scope.instructors = response.data.data;
                    } else if (response.data.data && response.data.data.instructors) {
                        $scope.instructors = response.data.data.instructors;
                    } else {
                        $scope.instructors = [];
                    }

                    // Map API fields to display fields
                    $scope.instructors = $scope.instructors.map(function (instructor) {
                        // Map experienceYears to experience for display
                        if (instructor.experienceYears && !instructor.experience) {
                            instructor.experience = instructor.experienceYears;
                        }
                        // Ensure photo field is available (null or URL)
                        if (!instructor.photo) {
                            instructor.photo = null;
                        }
                        // Map status field (1 = active, 0 = inactive)
                        instructor.active = instructor.status === 1;

                        return instructor;
                    });

                    // Get total count and pagination info from API meta
                    if (response.data.meta && typeof response.data.meta.total !== 'undefined') {
                        $scope.totalInstructors = response.data.meta.total;
                    } else {
                        $scope.totalInstructors = $scope.instructors.length;
                    }

                    if (response.data.meta && typeof response.data.meta.totalPages !== 'undefined') {
                        $scope.totalPages = response.data.meta.totalPages;
                    } else {
                        $scope.totalPages = 1;
                    }

                    // Get subject list from API meta
                    if (response.data.meta && response.data.meta.subjectList) {
                        $scope.subjectList = response.data.meta.subjectList;
                    }

                    // API already returns paginated data, use it directly
                    $scope.filteredInstructors = $scope.instructors.slice();
                    $scope.paginatedInstructors = $scope.instructors.slice();

                    console.log('Loaded ' + $scope.instructors.length + ' instructors (Page ' + $scope.currentPage + ' of ' + $scope.totalPages + ')');
                } else {
                    console.error('Failed to load instructors:', response.data);
                    $scope.instructors = [];
                    $scope.filteredInstructors = [];
                    $scope.paginatedInstructors = [];
                    $scope.totalInstructors = 0;
                    $scope.totalPages = 0;
                }
                $scope.hideLoading();
            })
            .catch(function (error) {
                console.error('Error loading instructors:', error);
                $scope.instructors = [];
                $scope.filteredInstructors = [];
                $scope.paginatedInstructors = [];
                $scope.hideLoading();
                // Fallback to mock data for development
                $scope.loadMockData();
            });
    };

    // ===== Fallback Mock Data (for development) =====
    $scope.loadMockData = function () {
        $timeout(function () {
            $scope.instructors = [
                {
                    id: 1,
                    name: 'Dr. Sarah Johnson',
                    brief: 'Senior Mathematics Educator with 15+ years of teaching excellence',
                    photo: null,
                    expertSubject: 'Mathematics',
                    qualifications: 'Ph.D. in Mathematics, M.Sc. in Applied Mathematics, Certified Math Educator',
                    experience: 15,
                    email: 'sarah.johnson@vegapilot.com',
                    phone: '+1 (555) 123-4567',
                    bio: 'Dr. Sarah Johnson is a passionate mathematics educator with over 15 years of experience in teaching advanced mathematics. She specializes in making complex mathematical concepts accessible and engaging for students of all levels.',
                    rating: 4.8,
                    studentsCount: 245,
                    active: true,
                    lessons: [
                        { courseName: 'Advanced Calculus', courseCode: 'MATH-301', chapterName: 'Chapter 3: Differential Equations', duration: '2 hours' },
                        { courseName: 'Linear Algebra', courseCode: 'MATH-201', chapterName: 'Chapter 5: Eigenvalues and Eigenvectors', duration: '1.5 hours' },
                        { courseName: 'Advanced Calculus', courseCode: 'MATH-301', chapterName: 'Chapter 7: Multivariable Calculus', duration: '2 hours' },
                        { courseName: 'Probability and Statistics', courseCode: 'MATH-205', chapterName: 'Chapter 2: Probability Distributions', duration: '1.5 hours' },
                        { courseName: 'Linear Algebra', courseCode: 'MATH-201', chapterName: 'Chapter 8: Vector Spaces', duration: '1.5 hours' },
                        { courseName: 'Advanced Calculus', courseCode: 'MATH-301', chapterName: 'Chapter 10: Series and Sequences', duration: '2 hours' }
                    ]
                },
                {
                    id: 2,
                    name: 'Prof. Michael Chen',
                    brief: 'Award-winning Physics Professor and Research Scientist',
                    photo: null,
                    expertSubject: 'Physics',
                    qualifications: 'Ph.D. in Quantum Physics, M.Sc. in Theoretical Physics, IIT Delhi Alumni',
                    experience: 12,
                    email: 'michael.chen@vegapilot.com',
                    phone: '+1 (555) 234-5678',
                    bio: 'Prof. Michael Chen brings cutting-edge physics research into the classroom. His innovative teaching methods have earned him multiple teaching excellence awards.',
                    rating: 4.9,
                    studentsCount: 312,
                    active: true,
                    lessons: [
                        { courseName: 'Quantum Mechanics', courseCode: 'PHYS-401', chapterName: 'Chapter 1: Wave-Particle Duality', duration: '2 hours' },
                        { courseName: 'Classical Mechanics', courseCode: 'PHYS-201', chapterName: 'Chapter 4: Newton\'s Laws', duration: '1.5 hours' },
                        { courseName: 'Quantum Mechanics', courseCode: 'PHYS-401', chapterName: 'Chapter 6: Quantum States', duration: '2 hours' },
                        { courseName: 'Electromagnetism', courseCode: 'PHYS-301', chapterName: 'Chapter 3: Maxwell\'s Equations', duration: '2 hours' },
                        { courseName: 'Classical Mechanics', courseCode: 'PHYS-201', chapterName: 'Chapter 9: Energy and Momentum', duration: '1.5 hours' }
                    ]
                },
                {
                    id: 3,
                    name: 'Dr. Emily Rodriguez',
                    brief: 'Chemistry Expert specializing in Organic and Analytical Chemistry',
                    photo: null,
                    expertSubject: 'Chemistry',
                    qualifications: 'Ph.D. in Organic Chemistry, M.Sc. in Analytical Chemistry, Board Certified',
                    experience: 10,
                    email: 'emily.rodriguez@vegapilot.com',
                    phone: '+1 (555) 345-6789',
                    bio: 'Dr. Emily Rodriguez combines hands-on laboratory experience with theoretical knowledge to create comprehensive chemistry education.',
                    rating: 4.7,
                    studentsCount: 198,
                    active: true,
                    lessons: [
                        { courseName: 'Organic Chemistry I', courseCode: 'CHEM-301', chapterName: 'Chapter 2: Alkanes and Alkenes', duration: '2 hours' },
                        { courseName: 'Analytical Chemistry', courseCode: 'CHEM-401', chapterName: 'Chapter 5: Chromatography Techniques', duration: '1.5 hours' },
                        { courseName: 'Organic Chemistry I', courseCode: 'CHEM-301', chapterName: 'Chapter 8: Reaction Mechanisms', duration: '2 hours' },
                        { courseName: 'General Chemistry', courseCode: 'CHEM-101', chapterName: 'Chapter 4: Chemical Bonding', duration: '1.5 hours' }
                    ]
                },
                {
                    id: 4,
                    name: 'Mr. David Thompson',
                    brief: 'Computer Science Instructor with industry and academic experience',
                    photo: null,
                    expertSubject: 'Computer Science',
                    qualifications: 'M.Sc. in Computer Science, AWS Certified Solutions Architect, Google Cloud Professional',
                    experience: 8,
                    email: 'david.thompson@vegapilot.com',
                    phone: '+1 (555) 456-7890',
                    bio: 'Mr. David Thompson brings real-world software development experience into the classroom, having worked at leading tech companies before transitioning to education.',
                    rating: 4.6,
                    studentsCount: 156,
                    active: true,
                    lessons: [
                        { courseName: 'Data Structures & Algorithms', courseCode: 'CS-201', chapterName: 'Chapter 3: Trees and Graphs', duration: '2 hours' },
                        { courseName: 'Web Development', courseCode: 'CS-301', chapterName: 'Chapter 7: RESTful APIs', duration: '1.5 hours' },
                        { courseName: 'Data Structures & Algorithms', courseCode: 'CS-201', chapterName: 'Chapter 9: Dynamic Programming', duration: '2 hours' },
                        { courseName: 'Cloud Computing', courseCode: 'CS-401', chapterName: 'Chapter 2: AWS Services', duration: '2 hours' },
                        { courseName: 'Web Development', courseCode: 'CS-301', chapterName: 'Chapter 12: Frontend Frameworks', duration: '1.5 hours' },
                        { courseName: 'Database Systems', courseCode: 'CS-305', chapterName: 'Chapter 5: SQL Optimization', duration: '1.5 hours' }
                    ]
                },
                {
                    id: 5,
                    name: 'Dr. Priya Sharma',
                    brief: 'Biology and Life Sciences educator with research background',
                    photo: null,
                    expertSubject: 'Biology',
                    qualifications: 'Ph.D. in Molecular Biology, M.Sc. in Biotechnology, Published Researcher',
                    experience: 11,
                    email: 'priya.sharma@vegapilot.com',
                    phone: '+1 (555) 567-8901',
                    bio: 'Dr. Priya Sharma integrates cutting-edge biological research with fundamental life sciences education, making complex biological processes understandable.',
                    rating: 4.8,
                    studentsCount: 223,
                    active: true,
                    lessons: [
                        { courseName: 'Molecular Biology', courseCode: 'BIO-401', chapterName: 'Chapter 1: DNA Replication', duration: '2 hours' },
                        { courseName: 'Cell Biology', courseCode: 'BIO-201', chapterName: 'Chapter 4: Cell Division', duration: '1.5 hours' },
                        { courseName: 'Genetics', courseCode: 'BIO-301', chapterName: 'Chapter 6: Gene Expression', duration: '2 hours' },
                        { courseName: 'Molecular Biology', courseCode: 'BIO-401', chapterName: 'Chapter 8: Protein Synthesis', duration: '2 hours' },
                        { courseName: 'Cell Biology', courseCode: 'BIO-201', chapterName: 'Chapter 11: Cellular Respiration', duration: '1.5 hours' }
                    ]
                },
                {
                    id: 6,
                    name: 'Ms. Lisa Anderson',
                    brief: 'English Literature and Language Arts specialist',
                    photo: null,
                    expertSubject: 'English',
                    qualifications: 'M.A. in English Literature, TESOL Certified, Creative Writing Certificate',
                    experience: 9,
                    email: 'lisa.anderson@vegapilot.com',
                    phone: '+1 (555) 678-9012',
                    bio: 'Ms. Lisa Anderson fosters a love for literature and language through creative and engaging teaching methods.',
                    rating: 4.5,
                    studentsCount: 187,
                    active: true,
                    lessons: [
                        { courseName: 'English Literature', courseCode: 'ENG-301', chapterName: 'Chapter 3: Shakespeare\'s Works', duration: '2 hours' },
                        { courseName: 'Creative Writing', courseCode: 'ENG-201', chapterName: 'Chapter 5: Narrative Structure', duration: '1.5 hours' },
                        { courseName: 'English Literature', courseCode: 'ENG-301', chapterName: 'Chapter 8: Victorian Poetry', duration: '2 hours' },
                        { courseName: 'Academic Writing', courseCode: 'ENG-101', chapterName: 'Chapter 2: Essay Composition', duration: '1.5 hours' }
                    ]
                }
            ];

            // For mock data, use client-side pagination
            $scope.totalInstructors = $scope.instructors.length;
            $scope.totalPages = Math.ceil($scope.totalInstructors / $scope.pageSize);

            var start = ($scope.currentPage - 1) * $scope.pageSize;
            var end = start + $scope.pageSize;
            $scope.filteredInstructors = $scope.instructors.slice();
            $scope.paginatedInstructors = $scope.instructors.slice(start, end);

            $scope.hideLoading();
        }, 500);
    };

    // ===== Create New Instructor =====
    $scope.openCreateModal = function () {
        $scope.editMode = false;
        $scope.currentInstructor = {
            name: '',
            brief: '',
            photo: null,
            photoPreview: null,
            photoFile: null,
            expertSubject: '',
            qualifications: '',
            experience: 0,
            email: '',
            phone: '',
            bio: '',
            active: true
        };
        $scope.editModalOpen = true;
    };

    // ===== Edit Instructor =====
    $scope.openEditModal = function (instructor) {
        $scope.editMode = true;
        // Create a copy to avoid direct modification
        $scope.currentInstructor = angular.copy(instructor);
        $scope.currentInstructor.photoPreview = null;
        $scope.currentInstructor.photoFile = null;
        $scope.editModalOpen = true;
    };

    $scope.closeEditModal = function () {
        $scope.editModalOpen = false;
        $scope.currentInstructor = {};
    };

    // ===== Load Single Instructor Profile =====
    $scope.loadInstructorProfile = function (instructorId) {
        $scope.showLoading('Loading instructor profile...');

        var url = $scope.apiBaseUrl + '/get-instructor-profile.php?id=' + instructorId;

        $http.get(url, $scope.getHttpConfig())
            .then(function (response) {
                if (response.data && response.data.data) {
                    // API returns nested structure with profile and ratings
                    if (response.data.data.profile) {
                        $scope.selectedInstructor = response.data.data.profile;
                        // Add ratings data if available
                        if (response.data.data.ratings) {
                            $scope.selectedInstructor.rating = response.data.data.ratings.rating;
                            $scope.selectedInstructor.totalStudents = response.data.data.ratings.totalStudents;
                        }
                    } else {
                        // Fallback for flat structure
                        $scope.selectedInstructor = response.data.data;
                    }
                    $scope.selectedInstructor.active = $scope.selectedInstructor.status === 1;
                    $scope.viewModalOpen = true;
                }
                $scope.hideLoading();
            })
            .catch(function (error) {
                console.error('Error loading instructor profile:', error);
                $scope.showToaster('error', 'Error', 'Failed to load instructor profile. Please try again.');
                $scope.hideLoading();
            });
    };

    // ===== View Instructor Profile =====
    $scope.viewInstructor = function (instructor) {
        // Load full profile from API
        $scope.loadInstructorProfile(instructor.id);
    };

    $scope.closeViewModal = function () {
        $scope.viewModalOpen = false;
        $scope.selectedInstructor = {};
    };

    $scope.editFromView = function () {
        // Close view modal and open edit modal
        $scope.viewModalOpen = false;
        $scope.openEditModal($scope.selectedInstructor);
    };

    // ===== Star Rating Helper =====
    $scope.getStarClass = function (rating, index) {
        var starValue = index + 1;
        if (rating >= starValue) {
            return 'fa-star'; // Full star
        } else if (rating >= starValue - 0.5) {
            return 'fa-star-half-o'; // Half star
        } else {
            return 'fa-star-o'; // Empty star
        }
    };

    // ===== Save Instructor =====
    $scope.saveInstructor = function () {
        if (!$scope.currentInstructor.name ||
            !$scope.currentInstructor.brief ||
            !$scope.currentInstructor.expertSubject ||
            !$scope.currentInstructor.qualifications ||
            (!$scope.currentInstructor.experienceYears && !$scope.currentInstructor.experience)) {
            $scope.showToaster('info', 'Notification', 'Please fill in all required fields');
            return;
        }

        $scope.showLoading($scope.editMode ? 'Updating instructor...' : 'Creating instructor...');

        // Prepare FormData
        var formData = new FormData();
        formData.append('name', $scope.currentInstructor.name);
        formData.append('brief', $scope.currentInstructor.brief);
        formData.append('expertSubject', $scope.currentInstructor.expertSubject);
        formData.append('qualifications', $scope.currentInstructor.qualifications);
        formData.append('experienceYears', $scope.currentInstructor.experienceYears || $scope.currentInstructor.experience);

        if ($scope.currentInstructor.email) {
            formData.append('email', $scope.currentInstructor.email);
        }
        if ($scope.currentInstructor.mobile || $scope.currentInstructor.phone) {
            formData.append('mobile', $scope.currentInstructor.mobile || $scope.currentInstructor.phone);
        }

        // Add photo if exists
        if ($scope.currentInstructor.photoFile) {
            formData.append('photo', $scope.currentInstructor.photoFile);
        }

        var url, method;
        if ($scope.editMode) {
            // Update existing instructor
            url = $scope.apiBaseUrl + '/update-instructor.php?id=' + $scope.currentInstructor.id;
            method = 'POST';
        } else {
            // Create new instructor
            url = $scope.apiBaseUrl + '/add-new-instructor.php';
            method = 'POST';
        }

        $http({
            method: method,
            url: url,
            data: formData,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        })
            .then(function (response) {
                // Handle both response formats: success: true or status: 'success'
                var isSuccess = (response.data && (response.data.success === true || response.data.status === 'success'));

                if (isSuccess) {
                    // Reload instructors list
                    $scope.loadInstructors();
                    $scope.closeEditModal();
                    alert($scope.editMode ? 'Instructor updated successfully!' : 'Instructor created successfully!');
                } else {
                    console.error('Failed to save instructor:', response.data);
                    $scope.showToaster('error', 'Error', 'Failed to save instructor: ' + (response.data.message || response.data.error || 'Unknown error'));
                }
                $scope.hideLoading();
            })
            .catch(function (error) {
                console.error('Error saving instructor:', error);
                $scope.showToaster('error', 'Error', 'Error saving instructor. Please try again.');
                $scope.hideLoading();
            });
    };

    // ===== Delete Instructor =====
    $scope.confirmDelete = function (instructor) {
        $scope.instructorToDelete = instructor;
        $scope.deleteModalOpen = true;
    };

    $scope.closeDeleteModal = function () {
        $scope.deleteModalOpen = false;
        $scope.instructorToDelete = {};
    };

    $scope.deleteInstructor = function () {
        $scope.showLoading('Deleting instructor...');

        $timeout(function () {
            var index = $scope.instructors.findIndex(function (i) {
                return i.id === $scope.instructorToDelete.id;
            });
            if (index !== -1) {
                $scope.instructors.splice(index, 1);
            }

            $scope.filterInstructors();
            $scope.hideLoading();
            $scope.closeDeleteModal();
        }, 500);
    };

    // ===== Photo Upload =====
    $scope.handlePhotoSelect = function (file) {
        if (!file) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            $scope.showToaster('info', 'Notification', 'File size must be less than 2MB');
            return;
        }

        // Check file type
        if (!file.type.match('image.*')) {
            $scope.showToaster('info', 'Notification', 'Please select an image file');
            return;
        }

        $scope.$apply(function () {
            $scope.currentInstructor.photoFile = file;

            // Create preview
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.$apply(function () {
                    $scope.currentInstructor.photoPreview = e.target.result;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    // ===== Remove Photo =====
    $scope.removePhoto = function () {
        $scope.currentInstructor.photo = null;
        $scope.currentInstructor.photoPreview = null;
        $scope.currentInstructor.photoFile = null;
        // Reset the file input
        var fileInput = document.getElementById('photoInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // ===== Filter & Sort (Server-Side) =====
    $scope.selectSubject = function (subject) {
        $scope.filterSubject = subject;
        $scope.filterInstructors();
    };

    $scope.getSkeletonRows = function () {
        return new Array($scope.pageSize || 10);
    };

    var filterTimeout;
    $scope.filterInstructors = function () {
        // Cancel previous timeout if exists
        if (filterTimeout) {
            $timeout.cancel(filterTimeout);
        }

        // Set new timeout for debounce (500ms delay)
        filterTimeout = $timeout(function () {
            // Reset to page 1 and reload from API with filters
            $scope.currentPage = 1;
            $scope.loadInstructors();
        }, 500);
    };

    $scope.sortInstructors = function () {
        // Reload from API with new sort order
        $scope.loadInstructors();
    };

    // ===== Sort by Column =====
    $scope.sortByColumn = function (column) {
        // If clicking the same column, toggle sort direction
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        // Map column names to API sortBy values
        var sortByMap = {
            'name': 'name',
            'expertSubject': 'expertSubject',
            'experience': 'experienceYears'
        };

        $scope.sortBy = sortByMap[column] || column;

        // Reload from API with new sort order
        $scope.loadInstructors();
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

    $scope.generateId = function () {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    };

    // ===== View Instructor Lessons =====
    $scope.viewInstructorLessons = function (instructor) {
        $scope.selectedInstructorForLessons = angular.copy(instructor);
        $scope.lessonsModalOpen = true;
    };

    $scope.closeLessonsModal = function () {
        $scope.lessonsModalOpen = false;
        $scope.selectedInstructorForLessons = {};
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
