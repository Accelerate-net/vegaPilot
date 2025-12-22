var app = angular.module('examListingApp', ['ngCookies']);

app.controller('examListingController', function($scope, $http, $cookies, $timeout) {
    
    // Initialize scope variables
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };

    // Pagination
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 1;

    // Search and filters
    $scope.searchQuery = '';
    $scope.examFilterApplied = '';
    $scope.activeFilters = [];

    // Sorting variables
    $scope.sortColumn = '';
    $scope.sortReverse = false;
    
    // Summary data for tiles
    $scope.summaryTileData = {
        totalExams: 0,
        totalQuestions: 0,
        totalActive: 0,
        totalDraft: 0,
        totalDuration: 0
    };
    
    // Exam data
    $scope.exams = [];
    $scope.filteredExams = [];
    $scope.selectedExam = null;
    
    // Dummy exam data for testing
    $scope.dummyExams = [
        {
            id: 50000,
            displayKey: '4df33c6e-9282-48dc-b8ee-d70e5d2304ef',
            title: 'IAT Mock Test - 1',
            brief: 'Boost your IISER Aptitude Test 2025 preparation with our specially curated mock test',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>There are 4 Sections in this exam, containing 15 questions each.</li><li>Sections will be in the order Biology, Chemistry, Mathematics, and Physics</li><li>You can switch between Sections anytime during the exam</li><li>Every question is an MCQ with only Single Right Answer. You may choose answers from A, B, C, D options.</li><li>Each correct answer awards +4 marks, while each incorrect answer results in a -1 mark penalty.</li><li>There is no mandatory question to attempt, and any unattempted questions receive 0 marks.</li></ol>',
            duration: 180,
            totalQuestions: 60,
            challengeQuestionAllowed: 1,
            numberOfSections: 4,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 1,
            sectionsData: [
                {
                    order: 1,
                    name: 'Biology',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        {o: 1, qi: 1000, ms: 1}, {o: 2, qi: 1001, ms: 1}, {o: 3, qi: 1002, ms: 1},
                        {o: 4, qi: 1003, ms: 1}, {o: 5, qi: 1004, ms: 1}, {o: 6, qi: 1005, ms: 1},
                        {o: 7, qi: 1006, ms: 1}, {o: 8, qi: 1007, ms: 1}, {o: 9, qi: 1008, ms: 1},
                        {o: 10, qi: 1009, ms: 1}, {o: 11, qi: 1010, ms: 1}, {o: 12, qi: 1011, ms: 1},
                        {o: 13, qi: 1012, ms: 1}, {o: 14, qi: 1013, ms: 1}, {o: 15, qi: 1014, ms: 1}
                    ]
                },
                {
                    order: 2,
                    name: 'Chemistry',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        {o: 1, qi: 1015, ms: 1}, {o: 2, qi: 1016, ms: 1}, {o: 3, qi: 1017, ms: 1},
                        {o: 4, qi: 1018, ms: 1}, {o: 5, qi: 1019, ms: 1}, {o: 6, qi: 1020, ms: 1},
                        {o: 7, qi: 1021, ms: 1}, {o: 8, qi: 1022, ms: 1}, {o: 9, qi: 1023, ms: 1},
                        {o: 10, qi: 1024, ms: 1}, {o: 11, qi: 1025, ms: 1}, {o: 12, qi: 1026, ms: 1},
                        {o: 13, qi: 1027, ms: 1}, {o: 14, qi: 1028, ms: 1}, {o: 15, qi: 1029, ms: 1}
                    ]
                },
                {
                    order: 3,
                    name: 'Mathematics',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        {o: 1, qi: 1030, ms: 1}, {o: 2, qi: 1031, ms: 1}, {o: 3, qi: 1032, ms: 1},
                        {o: 4, qi: 1033, ms: 1}, {o: 5, qi: 1034, ms: 1}, {o: 6, qi: 1035, ms: 1},
                        {o: 7, qi: 1036, ms: 1}, {o: 8, qi: 1037, ms: 1}, {o: 9, qi: 1038, ms: 1},
                        {o: 10, qi: 1039, ms: 1}, {o: 11, qi: 1040, ms: 1}, {o: 12, qi: 1041, ms: 1},
                        {o: 13, qi: 1042, ms: 1}, {o: 14, qi: 1043, ms: 1}, {o: 15, qi: 1044, ms: 1}
                    ]
                },
                {
                    order: 4,
                    name: 'Physics',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        {o: 1, qi: 1045, ms: 1}, {o: 2, qi: 1046, ms: 1}, {o: 3, qi: 1047, ms: 1},
                        {o: 4, qi: 1048, ms: 1}, {o: 5, qi: 1049, ms: 1}, {o: 6, qi: 1050, ms: 1},
                        {o: 7, qi: 1051, ms: 1}, {o: 8, qi: 1052, ms: 1}, {o: 9, qi: 1053, ms: 1},
                        {o: 10, qi: 1054, ms: 1}, {o: 11, qi: 1055, ms: 1}, {o: 12, qi: 1056, ms: 1},
                        {o: 13, qi: 1057, ms: 1}, {o: 14, qi: 1058, ms: 1}, {o: 15, qi: 1059, ms: 1}
                    ]
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333501,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333501
        },
        {
            id: 50001,
            displayKey: '5ef44d7f-0393-59ed-c9ff-e81f6e3415f0',
            title: 'JEE Main Practice Test - Physics',
            brief: 'Comprehensive physics practice test covering mechanics, thermodynamics, and modern physics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>This test contains 25 questions from Physics</li><li>Each question carries 4 marks</li><li>Negative marking of 1 mark for wrong answers</li><li>Time limit: 100 minutes</li><li>Use of calculator is allowed</li></ol>',
            duration: 100,
            totalQuestions: 25,
            challengeQuestionAllowed: 0,
            numberOfSections: 1,
            switchSectionsAllowed: 0,
            markingSchemeOverall: 1,
            sectionsData: [
                {
                    order: 1,
                    name: 'Physics',
                    duration: 100,
                    totalQuestions: 25,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 0,
                    questions: [
                        {o: 1, qi: 2000, ms: 1}, {o: 2, qi: 2001, ms: 1}, {o: 3, qi: 2002, ms: 1},
                        {o: 4, qi: 2003, ms: 1}, {o: 5, qi: 2004, ms: 1}, {o: 6, qi: 2005, ms: 1},
                        {o: 7, qi: 2006, ms: 1}, {o: 8, qi: 2007, ms: 1}, {o: 9, qi: 2008, ms: 1},
                        {o: 10, qi: 2009, ms: 1}, {o: 11, qi: 2010, ms: 1}, {o: 12, qi: 2011, ms: 1},
                        {o: 13, qi: 2012, ms: 1}, {o: 14, qi: 2013, ms: 1}, {o: 15, qi: 2014, ms: 1},
                        {o: 16, qi: 2015, ms: 1}, {o: 17, qi: 2016, ms: 1}, {o: 18, qi: 2017, ms: 1},
                        {o: 19, qi: 2018, ms: 1}, {o: 20, qi: 2019, ms: 1}, {o: 21, qi: 2020, ms: 1},
                        {o: 22, qi: 2021, ms: 1}, {o: 23, qi: 2022, ms: 1}, {o: 24, qi: 2023, ms: 1},
                        {o: 25, qi: 2024, ms: 1}
                    ]
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333502,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333502
        },
        {
            id: 50002,
            displayKey: '6fg55e8g-14a4-6afe-da0g-f92g7f4526g1',
            title: 'NEET Biology Mock Test',
            brief: 'Complete biology mock test for NEET preparation covering botany and zoology',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>This test contains 90 questions from Biology</li><li>Questions are divided into Botany and Zoology sections</li><li>Each correct answer gives 4 marks</li><li>No negative marking</li><li>Time limit: 200 minutes</li></ol>',
            duration: 200,
            totalQuestions: 90,
            challengeQuestionAllowed: 1,
            numberOfSections: 2,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 2,
            sectionsData: [
                {
                    order: 1,
                    name: 'Botany',
                    duration: 100,
                    totalQuestions: 45,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: [
                        {o: 1, qi: 3000, ms: 4}, {o: 2, qi: 3001, ms: 4}, {o: 3, qi: 3002, ms: 4},
                        {o: 4, qi: 3003, ms: 4}, {o: 5, qi: 3004, ms: 4}, {o: 6, qi: 3005, ms: 4},
                        {o: 7, qi: 3006, ms: 4}, {o: 8, qi: 3007, ms: 4}, {o: 9, qi: 3008, ms: 4},
                        {o: 10, qi: 3009, ms: 4}, {o: 11, qi: 3010, ms: 4}, {o: 12, qi: 3011, ms: 4},
                        {o: 13, qi: 3012, ms: 4}, {o: 14, qi: 3013, ms: 4}, {o: 15, qi: 3014, ms: 4},
                        {o: 16, qi: 3015, ms: 4}, {o: 17, qi: 3016, ms: 4}, {o: 18, qi: 3017, ms: 4},
                        {o: 19, qi: 3018, ms: 4}, {o: 20, qi: 3019, ms: 4}, {o: 21, qi: 3020, ms: 4},
                        {o: 22, qi: 3021, ms: 4}, {o: 23, qi: 3022, ms: 4}, {o: 24, qi: 3023, ms: 4},
                        {o: 25, qi: 3024, ms: 4}, {o: 26, qi: 3025, ms: 4}, {o: 27, qi: 3026, ms: 4},
                        {o: 28, qi: 3027, ms: 4}, {o: 29, qi: 3028, ms: 4}, {o: 30, qi: 3029, ms: 4},
                        {o: 31, qi: 3030, ms: 4}, {o: 32, qi: 3031, ms: 4}, {o: 33, qi: 3032, ms: 4},
                        {o: 34, qi: 3033, ms: 4}, {o: 35, qi: 3034, ms: 4}, {o: 36, qi: 3035, ms: 4},
                        {o: 37, qi: 3036, ms: 4}, {o: 38, qi: 3037, ms: 4}, {o: 39, qi: 3038, ms: 4},
                        {o: 40, qi: 3039, ms: 4}, {o: 41, qi: 3040, ms: 4}, {o: 42, qi: 3041, ms: 4},
                        {o: 43, qi: 3042, ms: 4}, {o: 44, qi: 3043, ms: 4}, {o: 45, qi: 3044, ms: 4}
                    ]
                },
                {
                    order: 2,
                    name: 'Zoology',
                    duration: 100,
                    totalQuestions: 45,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: [
                        {o: 1, qi: 3045, ms: 4}, {o: 2, qi: 3046, ms: 4}, {o: 3, qi: 3047, ms: 4},
                        {o: 4, qi: 3048, ms: 4}, {o: 5, qi: 3049, ms: 4}, {o: 6, qi: 3050, ms: 4},
                        {o: 7, qi: 3051, ms: 4}, {o: 8, qi: 3052, ms: 4}, {o: 9, qi: 3053, ms: 4},
                        {o: 10, qi: 3054, ms: 4}, {o: 11, qi: 3055, ms: 4}, {o: 12, qi: 3056, ms: 4},
                        {o: 13, qi: 3057, ms: 4}, {o: 14, qi: 3058, ms: 4}, {o: 15, qi: 3059, ms: 4},
                        {o: 16, qi: 3060, ms: 4}, {o: 17, qi: 3061, ms: 4}, {o: 18, qi: 3062, ms: 4},
                        {o: 19, qi: 3063, ms: 4}, {o: 20, qi: 3064, ms: 4}, {o: 21, qi: 3065, ms: 4},
                        {o: 22, qi: 3066, ms: 4}, {o: 23, qi: 3067, ms: 4}, {o: 24, qi: 3068, ms: 4},
                        {o: 25, qi: 3069, ms: 4}, {o: 26, qi: 3070, ms: 4}, {o: 27, qi: 3071, ms: 4},
                        {o: 28, qi: 3072, ms: 4}, {o: 29, qi: 3073, ms: 4}, {o: 30, qi: 3074, ms: 4},
                        {o: 31, qi: 3075, ms: 4}, {o: 32, qi: 3076, ms: 4}, {o: 33, qi: 3077, ms: 4},
                        {o: 34, qi: 3078, ms: 4}, {o: 35, qi: 3079, ms: 4}, {o: 36, qi: 3080, ms: 4},
                        {o: 37, qi: 3081, ms: 4}, {o: 38, qi: 3082, ms: 4}, {o: 39, qi: 3083, ms: 4},
                        {o: 40, qi: 3084, ms: 4}, {o: 41, qi: 3085, ms: 4}, {o: 42, qi: 3086, ms: 4},
                        {o: 43, qi: 3087, ms: 4}, {o: 44, qi: 3088, ms: 4}, {o: 45, qi: 3089, ms: 4}
                    ]
                }
            ],
            status: 0,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333503,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333503
        },
        {
            id: 50003,
            displayKey: '7gh66f9h-25b5-7bgf-eb1h-g03h8g5637h2',
            title: 'Chemistry Olympiad Qualifier',
            brief: 'Preliminary round for Chemistry Olympiad - covers all major chemistry topics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>Duration: 120 minutes</li><li>30 Multiple Choice Questions</li><li>Each question carries 3 marks</li><li>No negative marking</li><li>Top scorers advance to next round</li></ol>',
            duration: 120,
            totalQuestions: 30,
            challengeQuestionAllowed: 0,
            numberOfSections: 3,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 2,
            sectionsData: [
                {
                    order: 1,
                    name: 'Organic Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({length: 10}, function(_, i) { return {o: i+1, qi: 4000+i, ms: 3}; })
                },
                {
                    order: 2,
                    name: 'Inorganic Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({length: 10}, function(_, i) { return {o: i+1, qi: 4010+i, ms: 3}; })
                },
                {
                    order: 3,
                    name: 'Physical Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({length: 10}, function(_, i) { return {o: i+1, qi: 4020+i, ms: 3}; })
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742220000,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742300000
        },
        {
            id: 50004,
            displayKey: '8hi77g0i-36c6-8chi-fc2i-h14i9h6748i3',
            title: 'Mathematics Rapid Fire Quiz',
            brief: 'Quick math assessment covering algebra, geometry, and calculus basics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>Speed test - 60 minutes only</li><li>20 questions</li><li>+5 for correct, -2 for incorrect</li><li>Calculator not allowed</li><li>All questions must be attempted</li></ol>',
            duration: 60,
            totalQuestions: 20,
            challengeQuestionAllowed: 1,
            numberOfSections: 1,
            switchSectionsAllowed: 0,
            markingSchemeOverall: 3,
            sectionsData: [
                {
                    order: 1,
                    name: 'Mathematics',
                    duration: 60,
                    totalQuestions: 20,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: Array.from({length: 20}, function(_, i) { return {o: i+1, qi: 5000+i, ms: 5}; })
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742100000,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742250000
        }
    ];
    
    // Initialize the controller
    $scope.init = function() {
        $scope.loadExams();
        $scope.loadSummaryData();
    };
    
    // Load exams from database (using dummy data for now)
    $scope.loadExams = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.exams = $scope.dummyExams;
            $scope.filteredExams = $scope.exams;
            $scope.updatePagination();
        }, 500);
    };
    
    // Load summary data for tiles
    $scope.loadSummaryData = function() {
        var totalExams = $scope.exams.length;
        var totalQuestions = $scope.exams.reduce(function(sum, exam) {
            return sum + exam.totalQuestions;
        }, 0);
        var totalActive = $scope.exams.filter(function(exam) {
            return exam.status === 1;
        }).length;
        var totalDraft = $scope.exams.filter(function(exam) {
            return exam.status === 0;
        }).length;
        var totalDuration = $scope.exams.reduce(function(sum, exam) {
            return sum + exam.duration;
        }, 0);
        
        $scope.summaryTileData = {
            totalExams: totalExams,
            totalQuestions: totalQuestions,
            totalActive: totalActive,
            totalDraft: totalDraft,
            totalDuration: Math.round(totalDuration / 60) // Convert to hours
        };
    };
    
    // Quick filter exams
    $scope.quickFilterExams = function(filter) {
        $scope.examFilterApplied = filter;
        $scope.currentPage = 1;
        
        if (filter === 'ALL') {
            $scope.filteredExams = $scope.exams;
        } else if (filter === 'ACTIVE') {
            $scope.filteredExams = $scope.exams.filter(function(exam) {
                return exam.status === 1;
            });
        } else if (filter === 'DRAFT') {
            $scope.filteredExams = $scope.exams.filter(function(exam) {
                return exam.status === 0;
            });
        }
        
        $scope.updatePagination();
        $scope.loadSummaryData();
    };
    
    // Apply search
    $scope.applySearch = function() {
        if (!$scope.searchQuery) {
            $scope.filteredExams = $scope.exams;
        } else {
            var query = $scope.searchQuery.toLowerCase();
            $scope.filteredExams = $scope.exams.filter(function(exam) {
                return exam.title.toLowerCase().includes(query) ||
                       exam.brief.toLowerCase().includes(query) ||
                       exam.sectionsData.some(function(section) {
                           return section.name.toLowerCase().includes(query);
                       });
            });
        }
        
        $scope.currentPage = 1;
        $scope.updatePagination();
    };
    
    // Clear search
    $scope.clearSearch = function() {
        $scope.searchQuery = '';
        $scope.filteredExams = $scope.exams;
        $scope.updatePagination();
    };
    
    // Clear all filters
    $scope.clearAllFilters = function() {
        $scope.examFilterApplied = '';
        $scope.activeFilters = [];
        $scope.searchQuery = '';
        $scope.filteredExams = $scope.exams;
        $scope.currentPage = 1;
        $scope.updatePagination();
    };
    
    // Remove filter
    $scope.removeFilter = function(filter) {
        var index = $scope.activeFilters.indexOf(filter);
        if (index > -1) {
            $scope.activeFilters.splice(index, 1);
        }
        // Reapply remaining filters
        $scope.applyFilters();
    };
    
    // Update pagination
    $scope.updatePagination = function() {
        $scope.totalPages = Math.ceil($scope.filteredExams.length / $scope.pageSize);
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages || 1;
        }
    };
    
    // Pagination functions
    $scope.goLeft = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
        }
    };
    
    $scope.goRight = function() {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
        }
    };
    
    // Get status label
    $scope.getStatusLabel = function(status) {
        switch(parseInt(status)) {
            case 0: return 'Draft';
            case 1: return 'Active';
            case 2: return 'Inactive';
            default: return 'Unknown';
        }
    };
    
    // Get status class
    $scope.getStatusClass = function(status) {
        switch(parseInt(status)) {
            case 0: return 'status-draft';
            case 1: return 'status-active';
            case 2: return 'status-inactive';
            default: return 'status-draft';
        }
    };
    
    // Format date
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Get marking scheme label
    $scope.getMarkingSchemeLabel = function(scheme) {
        switch(parseInt(scheme)) {
            case 0: return 'No Marking Scheme';
            case 1: return '+4 for correct, -1 for incorrect';
            case 2: return '+4 for correct, 0 for incorrect (No negative)';
            case 3: return '+3 for correct, -1 for incorrect';
            case 4: return 'Custom Marking Scheme';
            default: return 'Standard Marking';
        }
    };
    
    // Copy to clipboard
    $scope.copyToClipboard = function(text, event) {
        event.stopPropagation();
        
        // Create temporary input element
        var tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show copied message
        var copiedMessage = event.target.parentElement.querySelector('.copiedMessage');
        if (copiedMessage) {
            copiedMessage.style.display = 'block';
            $timeout(function() {
                copiedMessage.style.display = 'none';
            }, 1000);
        }
    };
    
    // View exam
    $scope.viewExam = function(exam) {
        $scope.selectedExam = angular.copy(exam);
        $('#viewExamModal').modal('show');
    };

    // Edit exam from view modal
    $scope.editExamFromView = function() {
        $('#viewExamModal').modal('hide');
        $scope.editExam($scope.selectedExam);
    };

    // Duplicate exam from view modal
    $scope.duplicateExamFromView = function() {
        $('#viewExamModal').modal('hide');
        $scope.duplicateExam($scope.selectedExam);
    };

    // View section questions
    $scope.viewSectionQuestions = function(section) {
        $scope.showToaster('Section has ' + section.questions.length + ' questions (IDs: ' + section.questions.map(function(q) { return q.qi; }).join(', ') + ')', 'info');
    };
    
    // Edit exam
    $scope.editExam = function(exam) {
        console.log('Editing exam:', exam);
        $scope.showToaster('Redirecting to exam editor...', 'info');
        // In a real app, redirect to exam creation wizard with exam data
        $timeout(function() {
            window.location.href = 'exam-creation-wizard.html?edit=' + exam.id;
        }, 1000);
    };
    
    // Duplicate exam
    $scope.duplicateExam = function(exam) {
        var duplicatedExam = angular.copy(exam);
        duplicatedExam.id = $scope.exams.length > 0 ? Math.max.apply(Math, $scope.exams.map(function(e) { return e.id; })) + 1 : 1;
        duplicatedExam.displayKey = generateUUID();
        duplicatedExam.title = exam.title + ' (Copy)';
        duplicatedExam.status = 0; // Set to draft
        duplicatedExam.createdOn = Math.floor(Date.now() / 1000);
        duplicatedExam.lastUpdatedOn = Math.floor(Date.now() / 1000);

        $scope.exams.unshift(duplicatedExam);
        $scope.applyFilters();
        $scope.calculateSummary();
        $scope.showToaster('Exam duplicated successfully! The new exam is now in Draft mode.', 'success');
    };

    // Generate UUID for exam display key
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Delete exam
    $scope.deleteExam = function(exam) {
        if (confirm('Are you sure you want to delete the exam "' + exam.title + '"? This action cannot be undone.')) {
            var index = $scope.exams.findIndex(function(e) {
                return e.id === exam.id;
            });
            
            if (index !== -1) {
                $scope.exams.splice(index, 1);
                $scope.filteredExams = $scope.filteredExams.filter(function(e) {
                    return e.id !== exam.id;
                });
                
                $scope.showToaster('Exam "' + exam.title + '" deleted successfully!', 'success');
                $scope.loadSummaryData();
                $scope.updatePagination();
            }
        }
    };
    
    // Show full terms
    $scope.showFullTerms = function(exam) {
        // In a real app, this could open a modal with full terms
        alert('Full Terms for ' + exam.title + ':\n\n' + exam.specialTerms);
    };
    
    // Math function for pagination
    $scope.Math = Math;
    
    // Toaster notification system
    $scope.toasterVisible = false;
    $scope.toasterMessage = '';
    
    $scope.showToaster = function(message, type) {
        $scope.toasterMessage = '<div class="alert alert-' + type + '">' + message + '</div>';
        $scope.toasterVisible = true;
        
        $timeout(function() {
            $scope.toasterVisible = false;
        }, 3000);
    };
    
    // Logout function
    $scope.logoutNow = function() {
        $cookies.remove('userToken');
        window.location.href = 'login.html';
    };

    // Sort By Column
    $scope.sortByColumn = function(column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        $scope.filteredExams.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'displayKey':
                    aVal = a.displayKey ? a.displayKey.toLowerCase() : '';
                    bVal = b.displayKey ? b.displayKey.toLowerCase() : '';
                    break;
                case 'title':
                    aVal = a.title ? a.title.toLowerCase() : '';
                    bVal = b.title ? b.title.toLowerCase() : '';
                    break;
                case 'totalQuestions':
                    aVal = parseInt(a.totalQuestions) || 0;
                    bVal = parseInt(b.totalQuestions) || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'duration':
                    aVal = parseInt(a.duration) || 0;
                    bVal = parseInt(b.duration) || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'status':
                    aVal = parseInt(a.status);
                    bVal = parseInt(b.status);
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                default:
                    return 0;
            }

            // String comparison
            if (aVal < bVal) {
                return $scope.sortReverse ? 1 : -1;
            }
            if (aVal > bVal) {
                return $scope.sortReverse ? -1 : 1;
            }
            return 0;
        });
    };

    // Initialize controller
    $scope.init();
});
