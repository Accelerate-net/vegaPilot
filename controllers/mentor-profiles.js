/**
 * Mentor Profiles Management Controller
 * Angular 1.x Controller for managing mentor profiles
 */

var app = angular.module('MentorProfilesApp', []);

app.controller('MentorProfilesController', ['$scope', '$timeout', function($scope, $timeout) {

    // ===== Initialize Data =====
    $scope.mentors = [];
    $scope.filteredMentors = [];
    $scope.searchQuery = '';
    $scope.filterSubject = '';
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

    // ===== Load Mentors =====
    $scope.loadMentors = function() {
        // In a real application, this would be an API call
        // For now, we'll use mock data
        $timeout(function() {
            $scope.mentors = [
                {
                    id: 1,
                    name: 'Arjun Mehta',
                    brief: 'IISER Pune Alumni specializing in Mathematics and Data Science',
                    photo: null,
                    institution: 'IISER Pune',
                    graduationYear: 2020,
                    specialization: 'Mathematics & Data Science',
                    qualifications: 'BS-MS in Mathematics, Currently pursuing Ph.D. at MIT',
                    email: 'arjun.mehta@example.com',
                    phone: '+91 98765 43210',
                    bio: 'Arjun graduated from IISER Pune with distinction in Mathematics. He is passionate about guiding aspiring scientists and helping them navigate the challenging IISER entrance exams.',
                    rating: 4.9,
                    active: true,
                    mentoringStudents: [
                        {id: 'CAND-001', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-002', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 98765 43211', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-003', name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '+91 98765 43212', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-004', name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 98765 43213', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-005', name: 'Karthik Iyer', email: 'karthik.iyer@example.com', phone: '+91 98765 43214', enrolledCourses: 2, status: 'active'}
                    ]
                },
                {
                    id: 2,
                    name: 'Divya Krishnan',
                    brief: 'IISER Kolkata Alumni with expertise in Physics and Astrophysics',
                    photo: null,
                    institution: 'IISER Kolkata',
                    graduationYear: 2019,
                    specialization: 'Physics & Astrophysics',
                    qualifications: 'BS-MS in Physics, Research Fellow at TIFR',
                    email: 'divya.krishnan@example.com',
                    phone: '+91 98765 43220',
                    bio: 'Divya is an IISER Kolkata alumna currently working as a Research Fellow at TIFR. She loves mentoring students and sharing her journey through competitive science exams.',
                    rating: 4.8,
                    active: true,
                    mentoringStudents: [
                        {id: 'CAND-006', name: 'Ananya Singh', email: 'ananya.singh@example.com', phone: '+91 98765 43215', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-007', name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '+91 98765 43216', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-008', name: 'Meera Joshi', email: 'meera.joshi@example.com', phone: '+91 98765 43217', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-009', name: 'Vikram Rao', email: 'vikram.rao@example.com', phone: '+91 98765 43218', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-010', name: 'Nisha Desai', email: 'nisha.desai@example.com', phone: '+91 98765 43219', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-011', name: 'Aditya Nair', email: 'aditya.nair@example.com', phone: '+91 98765 43220', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-012', name: 'Pooja Menon', email: 'pooja.menon@example.com', phone: '+91 98765 43221', enrolledCourses: 2, status: 'active'}
                    ]
                },
                {
                    id: 3,
                    name: 'Siddharth Bose',
                    brief: 'IISER Bhopal Alumni passionate about Chemistry and Materials Science',
                    photo: null,
                    institution: 'IISER Bhopal',
                    graduationYear: 2021,
                    specialization: 'Chemistry',
                    qualifications: 'BS-MS in Chemistry, Published 3 research papers',
                    email: 'siddharth.bose@example.com',
                    phone: '+91 98765 43230',
                    bio: 'Siddharth completed his BS-MS from IISER Bhopal and has published multiple research papers in materials science. He enjoys guiding students through the IAT preparation journey.',
                    rating: 4.7,
                    active: true,
                    mentoringStudents: [
                        {id: 'CAND-013', name: 'Kavya Pillai', email: 'kavya.pillai@example.com', phone: '+91 98765 43222', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-014', name: 'Harsh Agarwal', email: 'harsh.agarwal@example.com', phone: '+91 98765 43223', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-015', name: 'Tanvi Shah', email: 'tanvi.shah@example.com', phone: '+91 98765 43224', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-016', name: 'Rajesh Kapoor', email: 'rajesh.kapoor@example.com', phone: '+91 98765 43225', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-017', name: 'Anjali Verma', email: 'anjali.verma@example.com', phone: '+91 98765 43226', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-018', name: 'Nikhil Chopra', email: 'nikhil.chopra@example.com', phone: '+91 98765 43227', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-019', name: 'Sakshi Malhotra', email: 'sakshi.malhotra@example.com', phone: '+91 98765 43228', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-020', name: 'Varun Khanna', email: 'varun.khanna@example.com', phone: '+91 98765 43229', enrolledCourses: 1, status: 'active'}
                    ]
                },
                {
                    id: 4,
                    name: 'Riya Chatterjee',
                    brief: 'IISER Mohali Alumni with focus on Biology and Biotechnology',
                    photo: null,
                    institution: 'IISER Mohali',
                    graduationYear: 2020,
                    specialization: 'Biology & Biotechnology',
                    qualifications: 'BS-MS in Biology, Currently at IISc Bangalore',
                    email: 'riya.chatterjee@example.com',
                    phone: '+91 98765 43240',
                    bio: 'Riya is an IISER Mohali alumna currently pursuing her Ph.D. at IISc Bangalore. She has a deep understanding of the IISER system and loves mentoring aspiring students.',
                    rating: 4.9,
                    active: true,
                    mentoringStudents: [
                        {id: 'CAND-021', name: 'Ishaan Bhatt', email: 'ishaan.bhatt@example.com', phone: '+91 98765 43230', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-022', name: 'Shreya Pandey', email: 'shreya.pandey@example.com', phone: '+91 98765 43231', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-023', name: 'Aryan Saxena', email: 'aryan.saxena@example.com', phone: '+91 98765 43232', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-024', name: 'Diya Banerjee', email: 'diya.banerjee@example.com', phone: '+91 98765 43233', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-025', name: 'Kabir Jain', email: 'kabir.jain@example.com', phone: '+91 98765 43234', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-026', name: 'Aarohi Sinha', email: 'aarohi.sinha@example.com', phone: '+91 98765 43235', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-027', name: 'Yash Tiwari', email: 'yash.tiwari@example.com', phone: '+91 98765 43236', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-028', name: 'Kriti Dubey', email: 'kriti.dubey@example.com', phone: '+91 98765 43237', enrolledCourses: 1, status: 'active'},
                        {id: 'CAND-029', name: 'Ayush Mishra', email: 'ayush.mishra@example.com', phone: '+91 98765 43238', enrolledCourses: 2, status: 'active'},
                        {id: 'CAND-030', name: 'Zara Khan', email: 'zara.khan@example.com', phone: '+91 98765 43239', enrolledCourses: 1, status: 'active'}
                    ]
                }
            ];

            $scope.filteredMentors = $scope.mentors.slice();
            $scope.hideLoading();
        }, 500);
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
        $scope.selectedMentor = angular.copy(mentor);
        $scope.viewModalOpen = true;
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
            !$scope.currentMentor.expertSubject ||
            !$scope.currentMentor.qualifications ||
            !$scope.currentMentor.experience) {
            return;
        }

        $scope.showLoading($scope.editMode ? 'Updating mentor...' : 'Creating mentor...');

        $timeout(function() {
            if ($scope.editMode) {
                // Update existing mentor
                var index = $scope.mentors.findIndex(function(i) {
                    return i.id === $scope.currentMentor.id;
                });
                if (index !== -1) {
                    // If there's a new photo file, simulate upload
                    if ($scope.currentMentor.photoFile) {
                        $scope.currentMentor.photo = $scope.currentMentor.photoPreview;
                    }
                    $scope.mentors[index] = angular.copy($scope.currentMentor);
                }
            } else {
                // Create new mentor
                var newMentor = angular.copy($scope.currentMentor);
                newMentor.id = $scope.generateId();
                // If there's a photo file, use the preview as the photo
                if (newMentor.photoFile) {
                    newMentor.photo = newMentor.photoPreview;
                }
                delete newMentor.photoPreview;
                delete newMentor.photoFile;
                $scope.mentors.push(newMentor);
            }

            $scope.filterMentors();
            $scope.hideLoading();
            $scope.closeEditModal();
        }, 500);
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

        $timeout(function() {
            var index = $scope.mentors.findIndex(function(i) {
                return i.id === $scope.mentorToDelete.id;
            });
            if (index !== -1) {
                $scope.mentors.splice(index, 1);
            }

            $scope.filterMentors();
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

    // ===== Filter & Sort =====
    $scope.filterMentors = function() {
        var query = ($scope.searchQuery || '').toLowerCase();
        var subject = $scope.filterSubject;

        $scope.filteredMentors = $scope.mentors.filter(function(mentor) {
            var matchesSearch = true;
            var matchesSubject = true;

            if (query) {
                matchesSearch =
                    mentor.name.toLowerCase().indexOf(query) !== -1 ||
                    mentor.brief.toLowerCase().indexOf(query) !== -1 ||
                    mentor.expertSubject.toLowerCase().indexOf(query) !== -1 ||
                    mentor.qualifications.toLowerCase().indexOf(query) !== -1;
            }

            if (subject) {
                matchesSubject = mentor.expertSubject === subject;
            }

            return matchesSearch && matchesSubject;
        });

        $scope.sortMentors();
    };

    $scope.sortMentors = function() {
        var sortBy = $scope.sortBy;

        $scope.filteredMentors.sort(function(a, b) {
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

    // ===== Sort by Column =====
    $scope.sortByColumn = function(column) {
        // If clicking the same column, toggle sort direction
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        // Sort the filtered mentors
        $scope.filteredMentors.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'institution':
                    aVal = a.institution ? a.institution.toLowerCase() : '';
                    bVal = b.institution ? b.institution.toLowerCase() : '';
                    break;
                case 'specialization':
                    aVal = a.specialization ? a.specialization.toLowerCase() : '';
                    bVal = b.specialization ? b.specialization.toLowerCase() : '';
                    break;
                case 'studentCount':
                    aVal = a.mentoringStudents ? a.mentoringStudents.length : 0;
                    bVal = b.mentoringStudents ? b.mentoringStudents.length : 0;
                    // For numeric values, return directly
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

    // ===== Statistics =====
    $scope.getActiveMentors = function() {
        return $scope.mentors.filter(function(i) {
            return i.active;
        }).length;
    };

    $scope.getTotalSubjects = function() {
        var subjects = new Set();
        $scope.mentors.forEach(function(i) {
            if (i.expertSubject) {
                subjects.add(i.expertSubject);
            }
        });
        return subjects.size;
    };

    $scope.getAverageExperience = function() {
        if ($scope.mentors.length === 0) return '0';

        var total = $scope.mentors.reduce(function(sum, i) {
            return sum + (i.experience || 0);
        }, 0);

        var avg = total / $scope.mentors.length;
        return avg.toFixed(1) + ' yrs';
    };

    $scope.getUniqueSubjects = function() {
        var subjects = new Set();
        $scope.mentors.forEach(function(i) {
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

    // ===== View Mentoring Students Modal =====
    $scope.viewMentoringStudents = function(mentor) {
        $scope.selectedMentorForStudents = mentor;
        $scope.studentsModalOpen = true;
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
