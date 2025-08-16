var app = angular.module('examCreationWizardApp', ['ngCookies']);

app.controller('examCreationWizardController', function($scope, $http, $cookies, $timeout) {
    
    // Initialize scope variables
    $scope.currentStep = 1;
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };
    
    // Exam data structure
    $scope.examData = {
        title: '',
        brief: '',
        photo: '',
        specialTerms: '',
        duration: 0,
        totalQuestions: 0,
        challengeQuestionAllowed: 1,
        numberOfSections: 0,
        switchSectionsAllowed: 1,
        markingSchemeOverall: 1,
        sectionsData: '',
        status: 0,
        sections: []
    };
    
    // New section template
    $scope.newSection = {
        name: '',
        order: 1,
        duration: 0,
        totalQuestions: 0,
        enableSectionWiseTimer: false,
        sectionMarkingScheme: 0,
        questions: [],
        filters: {
            level1: '',
            level2: '',
            questionType: '',
            level: ''
        },
        filteredQuestions: []
    };
    
    // Question bank data (from database)
    $scope.questionBank = [];
    
    // Dummy question bank data for testing
    $scope.dummyQuestionBank = [
        {
            questionId: 1000,
            questionDisplayKey: '374b0acc-d9ff-4ad2-948e-4152029b98c2',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'B',
            questionMode: 'IMAGE',
            level: 1,
            rating: 0,
            averageTimeToSolveProblem: 30,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190245,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190245,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 1,
            classificationLevel2: 61
        },
        {
            questionId: 1001,
            questionDisplayKey: '484c1bdd-e0gg-5be3-059f-5263130c09d3',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'A',
            questionMode: 'IMAGE',
            level: 2,
            rating: 0,
            averageTimeToSolveProblem: 45,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190246,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190246,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 1,
            classificationLevel2: 62
        },
        {
            questionId: 1002,
            questionDisplayKey: '595d2cee-f1hh-6cf4-16ag-6374241d1ae4',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'C',
            questionMode: 'IMAGE',
            level: 1,
            rating: 0,
            averageTimeToSolveProblem: 35,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190247,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190247,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 2,
            classificationLevel2: 63
        },
        {
            questionId: 1003,
            questionDisplayKey: '6a6e3dff-g2ii-7dg5-27bh-7485352e2bf5',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'D',
            questionMode: 'IMAGE',
            level: 3,
            rating: 0,
            averageTimeToSolveProblem: 60,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190248,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190248,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 2,
            classificationLevel2: 64
        },
        {
            questionId: 1004,
            questionDisplayKey: '7b7f4egg-h3jj-8eh6-38ci-8596463f3cg6',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'B',
            questionMode: 'IMAGE',
            level: 2,
            rating: 0,
            averageTimeToSolveProblem: 40,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190249,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190249,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 3,
            classificationLevel2: 65
        },
        {
            questionId: 1005,
            questionDisplayKey: '8c8g5fhh-i4kk-9fi7-49dj-96a7574g4dh7',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'A',
            questionMode: 'IMAGE',
            level: 1,
            rating: 0,
            averageTimeToSolveProblem: 30,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190250,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190250,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 3,
            classificationLevel2: 66
        },
        {
            questionId: 1006,
            questionDisplayKey: '9d9h6gii-j5ll-0gj8-50ek-07b8685h5ei8',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'C',
            questionMode: 'IMAGE',
            level: 3,
            rating: 0,
            averageTimeToSolveProblem: 55,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190251,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190251,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 4,
            classificationLevel2: 67
        },
        {
            questionId: 1007,
            questionDisplayKey: '0e0i7hjj-k6mm-1hk9-61fl-18c9796i6fj9',
            questionSetReferenceNumber: 1,
            questionImage: 'data:image/png;base64,sample',
            solutionImage: 'data:image/png;base64,sample',
            solutionURL: '',
            pyqType: 0,
            pyqYear: 0,
            questionType: 'MCQ',
            answerType: 'SINGLE_CORRECT',
            answerValue: 'D',
            questionMode: 'IMAGE',
            level: 2,
            rating: 0,
            averageTimeToSolveProblem: 45,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742190252,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742190252,
            verified: 1,
            challenged: 0,
            lastChallengedOn: 0,
            classificationLevel1: 4,
            classificationLevel2: 68
        }
    ];
    
    // Initialize the controller
    $scope.init = function() {
        $scope.loadQuestionBank();
        $scope.resetNewSection();
    };
    
    // Load question bank from database (using dummy data for now)
    $scope.loadQuestionBank = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.questionBank = $scope.dummyQuestionBank;
        }, 500);
    };
    
    // Reset new section form
    $scope.resetNewSection = function() {
        $scope.newSection = {
            name: '',
            order: $scope.examData.sections.length + 1,
            duration: 0,
            totalQuestions: 0,
            enableSectionWiseTimer: false,
            sectionMarkingScheme: 0,
            questions: [],
            filters: {
                level1: '',
                level2: '',
                questionType: '',
                level: ''
            },
            filteredQuestions: []
        };
    };
    
    // Add new section
    $scope.addSection = function() {
        if (!$scope.newSection.name || !$scope.newSection.totalQuestions) {
            $scope.showToaster('Please fill in section name and total questions.', 'error');
            return;
        }
        
        var newSection = angular.copy($scope.newSection);
        newSection.filteredQuestions = $scope.questionBank; // Initially show all questions
        
        $scope.examData.sections.push(newSection);
        $scope.examData.numberOfSections = $scope.examData.sections.length;
        
        $scope.showToaster('Section "' + newSection.name + '" added successfully!', 'success');
        $scope.resetNewSection();
    };
    
    // Remove section
    $scope.removeSection = function(index) {
        var sectionName = $scope.examData.sections[index].name;
        $scope.examData.sections.splice(index, 1);
        $scope.examData.numberOfSections = $scope.examData.sections.length;
        
        // Update order numbers
        $scope.examData.sections.forEach(function(section, idx) {
            section.order = idx + 1;
        });
        
        $scope.showToaster('Section "' + sectionName + '" removed successfully!', 'success');
    };
    
    // Filter questions for a section
    $scope.filterQuestions = function(section) {
        var filters = section.filters;
        var filtered = $scope.questionBank;
        
        if (filters.level1) {
            filtered = filtered.filter(function(q) {
                return q.classificationLevel1 == filters.level1;
            });
        }
        
        if (filters.level2) {
            filtered = filtered.filter(function(q) {
                return q.classificationLevel2 == filters.level2;
            });
        }
        
        if (filters.questionType) {
            filtered = filtered.filter(function(q) {
                return q.questionType === filters.questionType;
            });
        }
        
        if (filters.level) {
            filtered = filtered.filter(function(q) {
                return q.level == filters.level;
            });
        }
        
        section.filteredQuestions = filtered;
    };
    
    // Toggle question selection
    $scope.toggleQuestionSelection = function(section, question) {
        if (question.selected) {
            // Add question to section
            if (section.questions.length >= section.totalQuestions) {
                question.selected = false;
                $scope.showToaster('Maximum questions limit reached for this section.', 'warning');
                return;
            }
            
            var newQuestion = {
                o: section.questions.length + 1,
                qi: question.questionId,
                ms: 1 // Default marking scheme
            };
            
            section.questions.push(newQuestion);
        } else {
            // Remove question from section
            var index = section.questions.findIndex(function(q) {
                return q.qi === question.questionId;
            });
            
            if (index !== -1) {
                section.questions.splice(index, 1);
                
                // Reorder remaining questions
                section.questions.forEach(function(q, idx) {
                    q.o = idx + 1;
                });
            }
        }
    };
    
    // Check if question is selected in a section
    $scope.isQuestionSelected = function(section, question) {
        return section.questions.some(function(q) {
            return q.qi === question.questionId;
        });
    };
    
    // Remove question from section
    $scope.removeQuestion = function(section, index) {
        var questionId = section.questions[index].questionId;
        section.questions.splice(index, 1);
        
        // Reorder remaining questions
        section.questions.forEach(function(q, idx) {
            q.o = idx + 1;
        });
        
        // Uncheck the question in filtered list
        var question = section.filteredQuestions.find(function(q) {
            return q.questionId === questionId;
        });
        if (question) {
            question.selected = false;
        }
    };
    
    // Check if all sections are complete
    $scope.areAllSectionsComplete = function() {
        return $scope.examData.sections.every(function(section) {
            return section.questions.length === section.totalQuestions;
        });
    };
    
    // Get total questions across all sections
    $scope.getTotalQuestions = function() {
        return $scope.examData.sections.reduce(function(total, section) {
            return total + section.questions.length;
        }, 0);
    };
    
    // Check if exam is valid for creation
    $scope.isExamValid = function() {
        return $scope.examData.title && 
               $scope.examData.duration > 0 && 
               $scope.examData.sections.length > 0 &&
               $scope.areAllSectionsComplete();
    };
    
    // Navigation functions
    $scope.nextStep = function() {
        if ($scope.currentStep < 4) {
            $scope.currentStep++;
        }
    };
    
    $scope.previousStep = function() {
        if ($scope.currentStep > 1) {
            $scope.currentStep--;
        }
    };
    
    // Create exam
    $scope.createExam = function() {
        if (!$scope.isExamValid()) {
            $scope.showToaster('Please complete all required fields before creating the exam.', 'error');
            return;
        }
        
        // Prepare sections data for JSON
        var sectionsData = $scope.examData.sections.map(function(section) {
            return {
                order: section.order,
                name: section.name,
                duration: section.duration,
                totalQuestions: section.totalQuestions,
                enableSectionWiseTimer: section.enableSectionWiseTimer,
                sectionMarkingScheme: section.sectionMarkingScheme,
                questions: section.questions
            };
        });
        
        // Create exam object
        var exam = {
            displayKey: $scope.generateUUID(),
            title: $scope.examData.title,
            brief: $scope.examData.brief,
            photo: $scope.examData.photo,
            specialTerms: $scope.examData.specialTerms,
            duration: $scope.examData.duration,
            totalQuestions: $scope.getTotalQuestions(),
            challengeQuestionAllowed: $scope.examData.challengeQuestionAllowed,
            numberOfSections: $scope.examData.sections.length,
            switchSectionsAllowed: $scope.examData.switchSectionsAllowed,
            markingSchemeOverall: $scope.examData.markingSchemeOverall,
            sectionsData: JSON.stringify(sectionsData),
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: Math.floor(Date.now() / 1000),
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: Math.floor(Date.now() / 1000)
        };
        
        // In a real application, this would be sent to the backend
        console.log('Creating exam:', exam);
        
        $scope.showToaster('Exam created successfully! Exam ID: ' + exam.displayKey, 'success');
        
        // Reset form and go back to step 1
        $timeout(function() {
            $scope.resetExam();
            $scope.currentStep = 1;
        }, 2000);
    };
    
    // Reset exam data
    $scope.resetExam = function() {
        $scope.examData = {
            title: '',
            brief: '',
            photo: '',
            specialTerms: '',
            duration: 0,
            totalQuestions: 0,
            challengeQuestionAllowed: 1,
            numberOfSections: 0,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 1,
            sectionsData: '',
            status: 0,
            sections: []
        };
        $scope.resetNewSection();
    };
    
    // Generate UUID
    $scope.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
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
    
    // Initialize controller
    $scope.init();
});
