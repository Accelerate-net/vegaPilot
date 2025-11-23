/**
 * Instructor Portfolio Management Controller
 * Angular 1.x Controller for managing instructor profiles
 */

var app = angular.module('InstructorPortfolioApp', []);

app.controller('InstructorPortfolioController', ['$scope', '$timeout', function($scope, $timeout) {

    // ===== Initialize Data =====
    $scope.instructors = [];
    $scope.filteredInstructors = [];
    $scope.searchQuery = '';
    $scope.filterSubject = '';
    $scope.sortBy = 'name';

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

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.showLoading('Loading instructors...');
        $scope.loadInstructors();
    };

    // ===== Load Instructors =====
    $scope.loadInstructors = function() {
        // In a real application, this would be an API call
        // For now, we'll use mock data
        $timeout(function() {
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

            $scope.filteredInstructors = $scope.instructors.slice();
            $scope.hideLoading();
        }, 500);
    };

    // ===== Create New Instructor =====
    $scope.openCreateModal = function() {
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
    $scope.openEditModal = function(instructor) {
        $scope.editMode = true;
        // Create a copy to avoid direct modification
        $scope.currentInstructor = angular.copy(instructor);
        $scope.currentInstructor.photoPreview = null;
        $scope.currentInstructor.photoFile = null;
        $scope.editModalOpen = true;
    };

    $scope.closeEditModal = function() {
        $scope.editModalOpen = false;
        $scope.currentInstructor = {};
    };

    // ===== View Instructor Profile =====
    $scope.viewInstructor = function(instructor) {
        $scope.selectedInstructor = angular.copy(instructor);
        $scope.viewModalOpen = true;
    };

    $scope.closeViewModal = function() {
        $scope.viewModalOpen = false;
        $scope.selectedInstructor = {};
    };

    $scope.editFromView = function() {
        // Close view modal and open edit modal
        $scope.viewModalOpen = false;
        $scope.openEditModal($scope.selectedInstructor);
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

    // ===== Save Instructor =====
    $scope.saveInstructor = function() {
        if (!$scope.currentInstructor.name ||
            !$scope.currentInstructor.brief ||
            !$scope.currentInstructor.expertSubject ||
            !$scope.currentInstructor.qualifications ||
            !$scope.currentInstructor.experience) {
            return;
        }

        $scope.showLoading($scope.editMode ? 'Updating instructor...' : 'Creating instructor...');

        $timeout(function() {
            if ($scope.editMode) {
                // Update existing instructor
                var index = $scope.instructors.findIndex(function(i) {
                    return i.id === $scope.currentInstructor.id;
                });
                if (index !== -1) {
                    // If there's a new photo file, simulate upload
                    if ($scope.currentInstructor.photoFile) {
                        $scope.currentInstructor.photo = $scope.currentInstructor.photoPreview;
                    }
                    $scope.instructors[index] = angular.copy($scope.currentInstructor);
                }
            } else {
                // Create new instructor
                var newInstructor = angular.copy($scope.currentInstructor);
                newInstructor.id = $scope.generateId();
                // If there's a photo file, use the preview as the photo
                if (newInstructor.photoFile) {
                    newInstructor.photo = newInstructor.photoPreview;
                }
                delete newInstructor.photoPreview;
                delete newInstructor.photoFile;
                $scope.instructors.push(newInstructor);
            }

            $scope.filterInstructors();
            $scope.hideLoading();
            $scope.closeEditModal();
        }, 500);
    };

    // ===== Delete Instructor =====
    $scope.confirmDelete = function(instructor) {
        $scope.instructorToDelete = instructor;
        $scope.deleteModalOpen = true;
    };

    $scope.closeDeleteModal = function() {
        $scope.deleteModalOpen = false;
        $scope.instructorToDelete = {};
    };

    $scope.deleteInstructor = function() {
        $scope.showLoading('Deleting instructor...');

        $timeout(function() {
            var index = $scope.instructors.findIndex(function(i) {
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
            $scope.currentInstructor.photoFile = file;

            // Create preview
            var reader = new FileReader();
            reader.onload = function(e) {
                $scope.$apply(function() {
                    $scope.currentInstructor.photoPreview = e.target.result;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    // ===== Filter & Sort =====
    $scope.filterInstructors = function() {
        var query = ($scope.searchQuery || '').toLowerCase();
        var subject = $scope.filterSubject;

        $scope.filteredInstructors = $scope.instructors.filter(function(instructor) {
            var matchesSearch = true;
            var matchesSubject = true;

            if (query) {
                matchesSearch =
                    instructor.name.toLowerCase().indexOf(query) !== -1 ||
                    instructor.brief.toLowerCase().indexOf(query) !== -1 ||
                    instructor.expertSubject.toLowerCase().indexOf(query) !== -1 ||
                    instructor.qualifications.toLowerCase().indexOf(query) !== -1;
            }

            if (subject) {
                matchesSubject = instructor.expertSubject === subject;
            }

            return matchesSearch && matchesSubject;
        });

        $scope.sortInstructors();
    };

    $scope.sortInstructors = function() {
        var sortBy = $scope.sortBy;

        $scope.filteredInstructors.sort(function(a, b) {
            var aVal, bVal;

            switch(sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'subject':
                    aVal = a.expertSubject.toLowerCase();
                    bVal = b.expertSubject.toLowerCase();
                    break;
                case 'experience':
                    aVal = a.experience || 0;
                    bVal = b.experience || 0;
                    return bVal - aVal; // Descending for experience
                default:
                    return 0;
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
    };

    // ===== Statistics =====
    $scope.getActiveInstructors = function() {
        return $scope.instructors.filter(function(i) {
            return i.active;
        }).length;
    };

    $scope.getTotalSubjects = function() {
        var subjects = new Set();
        $scope.instructors.forEach(function(i) {
            if (i.expertSubject) {
                subjects.add(i.expertSubject);
            }
        });
        return subjects.size;
    };

    $scope.getAverageExperience = function() {
        if ($scope.instructors.length === 0) return '0';

        var total = $scope.instructors.reduce(function(sum, i) {
            return sum + (i.experience || 0);
        }, 0);

        var avg = total / $scope.instructors.length;
        return avg.toFixed(1) + ' yrs';
    };

    $scope.getUniqueSubjects = function() {
        var subjects = new Set();
        $scope.instructors.forEach(function(i) {
            if (i.expertSubject) {
                subjects.add(i.expertSubject);
            }
        });
        return Array.from(subjects).sort();
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

    $scope.generateId = function() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    };

    // ===== View Instructor Lessons =====
    $scope.viewInstructorLessons = function(instructor) {
        $scope.selectedInstructorForLessons = angular.copy(instructor);
        $scope.lessonsModalOpen = true;
    };

    $scope.closeLessonsModal = function() {
        $scope.lessonsModalOpen = false;
        $scope.selectedInstructorForLessons = {};
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
