/**
 * Candidate Detail Controller
 * Angular 1.x Controller for candidate detail page
 */

var app = angular.module('candidateDetailApp', []);

app.controller('candidateDetailController', ['$scope', '$timeout', function($scope, $timeout) {

    // ===== Initialize Data =====
    $scope.candidate = {};
    $scope.activeTab = 'profile';

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.loadCandidateData();
    };

    // ===== Load Candidate Data =====
    $scope.loadCandidateData = function() {
        // Try to load student data from localStorage first (when opened from orders page)
        var storedStudent = localStorage.getItem('selectedStudent');

        if (storedStudent) {
            try {
                var studentData = JSON.parse(storedStudent);
                // Clear the localStorage after reading
                localStorage.removeItem('selectedStudent');

                // If we have stored student data, use it and enrich with sample data
                $scope.candidate = $scope.enrichStudentData(studentData);
                return;
            } catch (e) {
                console.error('Error parsing student data from localStorage:', e);
            }
        }

        // Fallback: Comprehensive sample data for demonstration
        $scope.candidate = {
            id: 'CAND-001',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '+91 98765 43210',
            whatsapp: '+91 98765 43210',
            photo: null,
            dob: '15th January 2007',
            gender: 'Male',
            category: 'General',
            examsTaken: 12,
            averageScore: 78,
            totalSpent: 34887.02,

            // Educational background
            education: {
                currentClass: 'Class 12 (2024-25)',
                institution: 'Delhi Public School, New Delhi',
                board: 'CBSE',
                targetExam: 'IISER Aptitude Test (IAT) 2026'
            },

            // Parent information
            parent: {
                fatherName: 'Mr. Raj Sharma',
                motherName: 'Mrs. Priya Sharma',
                guardianPhone: '+91 98765 12345'
            },

            // Enrolled courses with validity and payment details
            enrolledCourses: [
                {
                    courseCode: 'CR0001',
                    courseName: 'IAT 2026 – Exclusive 1 Year Course',
                    courseType: 'Course Bundle',
                    validFrom: 1737955200, // Jan 27, 2025
                    validUntil: 1769491200, // Jan 27, 2026 (1 year validity)
                    progress: 45,
                    completedModules: 18,
                    totalModules: 40,
                    hoursSpent: 87,
                    lastAccessed: 1738387200, // Feb 1, 2025
                    payment: {
                        orderNumber: 'ORD-2025-001',
                        orderDate: 1737955200,
                        method: 'UPI',
                        paymentReference: 'UPI202501270001',
                        originalPrice: 45000.00,
                        discountApplied: 500.00,
                        taxAmount: 5218.20,
                        amountPaid: 33708.20
                    }
                },
                {
                    courseCode: 'CR0002',
                    courseName: 'IAT 2026 - Test Series',
                    courseType: 'Test Series',
                    validFrom: 1738041600, // Jan 28, 2025
                    validUntil: 1748822400, // Jan 28, 2025 + 4 months
                    progress: 67,
                    completedModules: 8,
                    totalModules: 12,
                    hoursSpent: 24,
                    lastAccessed: 1738300800, // Jan 31, 2025
                    payment: {
                        orderNumber: 'ORD-2025-006',
                        orderDate: 1738041600,
                        method: 'Card',
                        paymentReference: 'CARD202501280002',
                        originalPrice: 1999.00,
                        discountApplied: 0,
                        taxAmount: 179.82,
                        amountPaid: 1178.82
                    }
                }
            ],

            // Exam results with detailed statistics
            examResults: [
                {
                    examName: 'IAT Mock Test - 6',
                    examCode: 'IAT-MOCK-006',
                    attemptDate: 1738473600, // Feb 2, 2025
                    totalMarks: 240,
                    score: 198,
                    percentage: 82.5,
                    correct: 50,
                    incorrect: 7,
                    unattempted: 3,
                    timeSpent: 175 // minutes
                },
                {
                    examName: 'IAT Mock Test - 5',
                    examCode: 'IAT-MOCK-005',
                    attemptDate: 1738214400, // Jan 30, 2025
                    totalMarks: 240,
                    score: 188,
                    percentage: 78.3,
                    correct: 47,
                    incorrect: 8,
                    unattempted: 5,
                    timeSpent: 172
                },
                {
                    examName: 'Chemistry Chapter Test - Organic',
                    examCode: 'CHEM-ORG-01',
                    attemptDate: 1738128000, // Jan 29, 2025
                    totalMarks: 100,
                    score: 81,
                    percentage: 81.0,
                    correct: 27,
                    incorrect: 4,
                    unattempted: 4,
                    timeSpent: 58
                },
                {
                    examName: 'IAT Mock Test - 4',
                    examCode: 'IAT-MOCK-004',
                    attemptDate: 1737955200, // Jan 27, 2025
                    totalMarks: 240,
                    score: 172,
                    percentage: 71.7,
                    correct: 43,
                    incorrect: 12,
                    unattempted: 5,
                    timeSpent: 178
                },
                {
                    examName: 'Physics Chapter Test - Mechanics',
                    examCode: 'PHY-MECH-01',
                    attemptDate: 1737523200, // Jan 22, 2025
                    totalMarks: 100,
                    score: 76,
                    percentage: 76.0,
                    correct: 25,
                    incorrect: 6,
                    unattempted: 4,
                    timeSpent: 55
                },
                {
                    examName: 'Math Chapter Test - Calculus',
                    examCode: 'MATH-CALC-01',
                    attemptDate: 1737091200, // Jan 17, 2025
                    totalMarks: 100,
                    score: 69,
                    percentage: 69.0,
                    correct: 23,
                    incorrect: 7,
                    unattempted: 5,
                    timeSpent: 60
                }
            ],

            // Assigned mentor
            mentor: {
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
                mentoringStudents: []
            },

            // Recent activity timeline
            recentActivity: [
                {
                    title: 'Attempted Mock Test',
                    description: 'IAT Mock Test - 6 • Scored 82.5%',
                    date: 1738473600,
                    type: 'exam'
                },
                {
                    title: 'Completed Chapter',
                    description: 'Organic Chemistry - Completed all videos and quiz',
                    date: 1738387200,
                    type: 'course'
                },
                {
                    title: 'Attempted Mock Test',
                    description: 'IAT Mock Test - 5 • Scored 78.3%',
                    date: 1738214400,
                    type: 'exam'
                },
                {
                    title: 'Completed Module',
                    description: 'Physics - Wave Motion • 3 videos watched',
                    date: 1738128000,
                    type: 'course'
                },
                {
                    title: 'Chapter Test Attempted',
                    description: 'Chemistry - Organic • Scored 81%',
                    date: 1738128000,
                    type: 'exam'
                },
                {
                    title: 'Attempted Mock Test',
                    description: 'IAT Mock Test - 4 • Scored 71.7%',
                    date: 1737955200,
                    type: 'exam'
                },
                {
                    title: 'Course Enrolled',
                    description: 'IAT 2026 – Exclusive 1 Year Course',
                    date: 1737955200,
                    type: 'enrollment'
                },
                {
                    title: 'Completed Chapter',
                    description: 'Mathematics - Differential Equations',
                    date: 1737523200,
                    type: 'course'
                },
                {
                    title: 'Chapter Test Attempted',
                    description: 'Physics - Mechanics • Scored 76%',
                    date: 1737523200,
                    type: 'exam'
                },
                {
                    title: 'Completed Module',
                    description: 'Chemistry - Inorganic Chemistry • 5 videos watched',
                    date: 1737091200,
                    type: 'course'
                }
            ],

            // Student feedbacks
            feedbacks: [
                {
                    id: 'FB001',
                    linkedItemType: 'Chapter',
                    linkedItemName: 'Organic Chemistry - Hydrocarbons',
                    linkedItemCode: 'CH-ORG-HC-01',
                    linkedItemId: 'chapter_123',
                    comment: 'The video lectures were very clear and well-structured. The practice questions helped solidify my understanding. Would love more questions on isomerism.',
                    rating: 5,
                    submittedDate: 1738473600, // Feb 2, 2025
                    linkedItemDetails: {
                        type: 'chapter',
                        courseName: 'IAT 2026 – Exclusive 1 Year Course',
                        subject: 'Chemistry',
                        duration: '4.5 hours',
                        completionStatus: 'Completed'
                    }
                },
                {
                    id: 'FB002',
                    linkedItemType: 'Exam',
                    linkedItemName: 'IAT Mock Test - 5',
                    linkedItemCode: 'IAT-MOCK-005',
                    linkedItemId: 'exam_456',
                    comment: 'The difficulty level was appropriate. However, some questions in the physics section felt ambiguous. The time limit was just right.',
                    rating: 4,
                    submittedDate: 1738300800, // Jan 31, 2025
                    linkedItemDetails: {
                        type: 'exam',
                        totalQuestions: 60,
                        duration: '180 minutes',
                        myScore: '78.3%',
                        averageScore: '65.2%'
                    }
                },
                {
                    id: 'FB003',
                    linkedItemType: 'Course',
                    linkedItemName: 'IAT 2026 – Exclusive 1 Year Course',
                    linkedItemCode: 'CR0001',
                    linkedItemId: 'course_789',
                    comment: 'Excellent course content overall! The instructors explain concepts very well. Would appreciate more solved examples in Mathematics section.',
                    rating: 5,
                    submittedDate: 1738041600, // Jan 28, 2025
                    linkedItemDetails: {
                        type: 'course',
                        totalModules: 40,
                        completedModules: 18,
                        progress: '45%',
                        validUntil: 1769491200
                    }
                },
                {
                    id: 'FB004',
                    linkedItemType: 'Chapter',
                    linkedItemName: 'Physics - Wave Motion',
                    linkedItemCode: 'CH-PHY-WM-01',
                    linkedItemId: 'chapter_234',
                    comment: 'The animations for wave interference were amazing! Made the concepts much easier to visualize. Practice problems were challenging but helpful.',
                    rating: 5,
                    submittedDate: 1737523200, // Jan 22, 2025
                    linkedItemDetails: {
                        type: 'chapter',
                        courseName: 'IAT 2026 – Exclusive 1 Year Course',
                        subject: 'Physics',
                        duration: '3.5 hours',
                        completionStatus: 'Completed'
                    }
                },
                {
                    id: 'FB005',
                    linkedItemType: 'Exam',
                    linkedItemName: 'Chemistry Chapter Test - Organic',
                    linkedItemCode: 'CHEM-ORG-01',
                    linkedItemId: 'exam_567',
                    comment: 'Good test covering all important topics. Some questions were tricky but fair. Would like detailed solutions for all questions.',
                    rating: 4,
                    submittedDate: 1737350400, // Jan 20, 2025
                    linkedItemDetails: {
                        type: 'exam',
                        totalQuestions: 35,
                        duration: '60 minutes',
                        myScore: '81%',
                        averageScore: '72%'
                    }
                },
                {
                    id: 'FB006',
                    linkedItemType: 'Chapter',
                    linkedItemName: 'Mathematics - Differential Equations',
                    linkedItemCode: 'CH-MATH-DE-01',
                    linkedItemId: 'chapter_345',
                    comment: 'The chapter covered all types of differential equations thoroughly. However, I felt the pace was a bit fast. More step-by-step examples would help.',
                    rating: 3,
                    submittedDate: 1737177600, // Jan 18, 2025
                    linkedItemDetails: {
                        type: 'chapter',
                        courseName: 'IAT 2026 – Exclusive 1 Year Course',
                        subject: 'Mathematics',
                        duration: '5 hours',
                        completionStatus: 'Completed'
                    }
                }
            ]
        };
    };

    // ===== Enrich Student Data =====
    $scope.enrichStudentData = function(studentData) {
        // Build comprehensive candidate object from basic student data
        return {
            id: studentData.id || 'UNKNOWN',
            name: studentData.name || 'Unknown Student',
            email: studentData.email || '',
            phone: studentData.phone || '',
            whatsapp: studentData.phone || '',
            photo: studentData.avatar || null,
            dob: '15th January 2007', // Sample data
            gender: 'Male', // Sample data
            category: 'General', // Sample data
            examsTaken: 12, // Sample data
            averageScore: 78, // Sample data
            totalSpent: studentData.totalSpent || 0,

            // Educational background (sample data)
            education: {
                currentClass: 'Class 12 (2024-25)',
                institution: 'Delhi Public School',
                board: 'CBSE',
                targetExam: 'IISER Aptitude Test (IAT) 2026'
            },

            // Parent information (sample data)
            parent: {
                fatherName: 'Mr. Guardian',
                motherName: 'Mrs. Guardian',
                guardianPhone: studentData.phone || ''
            },

            // Use enrolled courses if available, otherwise sample data
            enrolledCourses: studentData.enrolledCourses && studentData.enrolledCourses.length > 0
                ? studentData.enrolledCourses
                : [
                    {
                        courseCode: 'CR0001',
                        courseName: 'IAT 2026 – Exclusive 1 Year Course',
                        courseType: 'Course Bundle',
                        validFrom: Math.floor(Date.now() / 1000) - (30 * 86400), // 30 days ago
                        validUntil: Math.floor(Date.now() / 1000) + (335 * 86400), // 335 days from now
                        progress: 45,
                        completedModules: 18,
                        totalModules: 40,
                        hoursSpent: 87,
                        lastAccessed: Math.floor(Date.now() / 1000) - (2 * 86400),
                        payment: {
                            orderNumber: 'ORD-2025-001',
                            orderDate: Math.floor(Date.now() / 1000) - (30 * 86400),
                            method: 'UPI',
                            paymentReference: 'UPI202501270001',
                            originalPrice: 45000.00,
                            discountApplied: 500.00,
                            taxAmount: 5218.20,
                            amountPaid: 33708.20
                        }
                    }
                ],

            // Sample exam results
            examResults: [
                {
                    examName: 'IAT Mock Test - 6',
                    examCode: 'IAT-MOCK-006',
                    attemptDate: Math.floor(Date.now() / 1000) - (1 * 86400),
                    totalMarks: 240,
                    score: 198,
                    percentage: 82.5,
                    correct: 50,
                    incorrect: 7,
                    unattempted: 3,
                    timeSpent: 175
                },
                {
                    examName: 'IAT Mock Test - 5',
                    examCode: 'IAT-MOCK-005',
                    attemptDate: Math.floor(Date.now() / 1000) - (5 * 86400),
                    totalMarks: 240,
                    score: 188,
                    percentage: 78.3,
                    correct: 47,
                    incorrect: 8,
                    unattempted: 5,
                    timeSpent: 172
                },
                {
                    examName: 'Chemistry Chapter Test - Organic',
                    examCode: 'CHEM-ORG-01',
                    attemptDate: Math.floor(Date.now() / 1000) - (10 * 86400),
                    totalMarks: 100,
                    score: 81,
                    percentage: 81.0,
                    correct: 27,
                    incorrect: 4,
                    unattempted: 4,
                    timeSpent: 58
                }
            ],

            // Sample recent activity
            recentActivity: [
                {
                    title: 'Attempted Mock Test',
                    description: 'IAT Mock Test - 6 • Scored 82.5%',
                    date: Math.floor(Date.now() / 1000) - (1 * 86400),
                    type: 'exam'
                },
                {
                    title: 'Completed Chapter',
                    description: 'Organic Chemistry - Completed all videos and quiz',
                    date: Math.floor(Date.now() / 1000) - (3 * 86400),
                    type: 'course'
                },
                {
                    title: 'Attempted Mock Test',
                    description: 'IAT Mock Test - 5 • Scored 78.3%',
                    date: Math.floor(Date.now() / 1000) - (5 * 86400),
                    type: 'exam'
                },
                {
                    title: 'Course Enrolled',
                    description: 'IAT 2026 – Exclusive 1 Year Course',
                    date: Math.floor(Date.now() / 1000) - (30 * 86400),
                    type: 'enrollment'
                }
            ],

            // Sample feedbacks
            feedbacks: [
                {
                    id: 'FB001',
                    linkedItemType: 'Chapter',
                    linkedItemName: 'Organic Chemistry - Hydrocarbons',
                    linkedItemCode: 'CH-ORG-HC-01',
                    linkedItemId: 'chapter_123',
                    comment: 'The video lectures were very clear and well-structured. The practice questions helped solidify my understanding.',
                    rating: 5,
                    submittedDate: Math.floor(Date.now() / 1000) - (2 * 86400),
                    linkedItemDetails: {
                        type: 'chapter',
                        courseName: 'IAT 2026 – Exclusive 1 Year Course',
                        subject: 'Chemistry',
                        duration: '4.5 hours',
                        completionStatus: 'Completed'
                    }
                },
                {
                    id: 'FB002',
                    linkedItemType: 'Exam',
                    linkedItemName: 'IAT Mock Test - 5',
                    linkedItemCode: 'IAT-MOCK-005',
                    linkedItemId: 'exam_456',
                    comment: 'The difficulty level was appropriate. However, some questions in the physics section felt ambiguous.',
                    rating: 4,
                    submittedDate: Math.floor(Date.now() / 1000) - (4 * 86400),
                    linkedItemDetails: {
                        type: 'exam',
                        totalQuestions: 60,
                        duration: '180 minutes',
                        myScore: '78.3%',
                        averageScore: '65.2%'
                    }
                }
            ],

            // Assigned mentor (sample data)
            mentor: {
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
                mentoringStudents: []
            }
        };
    };

    // ===== Helper Functions =====

    // Format Unix timestamp to readable date
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get validity status text
    $scope.getValidityStatus = function(validUntil) {
        if (!validUntil) return 'UNKNOWN';
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);

        if (daysRemaining < 0) return 'EXPIRED';
        if (daysRemaining <= 30) return 'EXPIRING SOON';
        return 'ACTIVE';
    };

    // Get validity CSS class
    $scope.getValidityClass = function(validUntil) {
        var status = $scope.getValidityStatus(validUntil);
        switch(status) {
            case 'ACTIVE': return 'validity-active';
            case 'EXPIRING SOON': return 'validity-expiring';
            case 'EXPIRED': return 'validity-expired';
            default: return '';
        }
    };

    // Get score-based CSS class
    $scope.getScoreClass = function(percentage) {
        if (percentage >= 75) return 'score-good';
        if (percentage >= 50) return 'score-average';
        return 'score-poor';
    };

    // Get initials from name
    $scope.getInitials = function(name) {
        if (!name) return '??';
        var parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Calculate days remaining
    $scope.getDaysRemaining = function(validUntil) {
        if (!validUntil) return 0;
        var now = Date.now() / 1000;
        var daysRemaining = Math.ceil((validUntil - now) / 86400);
        return daysRemaining > 0 ? daysRemaining : 0;
    };

    // ===== Quick View Modal for Feedback =====
    $scope.quickViewItem = null;
    $scope.showQuickViewModal = false;

    $scope.openQuickView = function(feedback) {
        $scope.quickViewItem = feedback;
        $scope.showQuickViewModal = true;
    };

    $scope.closeQuickView = function() {
        $scope.showQuickViewModal = false;
        $timeout(function() {
            $scope.quickViewItem = null;
        }, 300);
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

    // ===== Change Mentor Modal =====
    $scope.showChangeMentorModal = false;
    $scope.selectedNewMentor = {};
    $scope.mentorSearchQuery = '';
    $scope.availableMentors = [
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
            mentoringStudents: []
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
            mentoringStudents: []
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
            mentoringStudents: []
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
            mentoringStudents: []
        }
    ];

    $scope.openChangeMentorModal = function() {
        $scope.selectedNewMentor = {};
        $scope.mentorSearchQuery = '';
        $scope.showChangeMentorModal = true;
    };

    $scope.closeChangeMentorModal = function() {
        $scope.showChangeMentorModal = false;
        $timeout(function() {
            $scope.selectedNewMentor = {};
            $scope.mentorSearchQuery = '';
        }, 300);
    };

    $scope.selectMentor = function(mentor) {
        $scope.selectedNewMentor = mentor;
    };

    $scope.assignMentor = function() {
        if (!$scope.selectedNewMentor.id) {
            return;
        }

        // Assign the selected mentor to the candidate
        $scope.candidate.mentor = angular.copy($scope.selectedNewMentor);

        // Show success notification (you can enhance this with a toast/notification)
        alert('Mentor assigned successfully!');

        // Close the modal
        $scope.closeChangeMentorModal();
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
