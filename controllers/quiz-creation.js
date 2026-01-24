// Quiz Creation Controller - Manages quiz creation from question batches
var quizCreationApp = angular.module('quizCreationApp', []);

quizCreationApp.controller('quizCreationController', ['$scope', '$timeout', function($scope, $timeout) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);


    // ===== Initialize Scope Variables =====
    $scope.currentStep = 1;
    $scope.availableBatches = [];
    $scope.allQuestions = [];
    $scope.questionsFromBatches = [];
    $scope.customQuestions = [];
    $scope.isDragover = false;
    $scope.quizUrl = '';
    $scope.quizConfig = {
        title: '',
        description: '',
        duration: 180, // Default 3 hours
        markingScheme: 'default',
        customMarking: {
            correct: 4,
            incorrect: -1,
            unanswered: 0
        },
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '18:00',
        allowMultipleAttempts: false
    };

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.loadQuestions();
        $scope.loadBatches();
        $scope.checkForPreselectedBatches();
        $scope.setDefaultDates();
    };

    // ===== Set Default Dates (Today and Tomorrow) =====
    $scope.setDefaultDates = function() {
        var today = new Date();
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        $scope.quizConfig.startDate = today.toISOString().split('T')[0];
        $scope.quizConfig.endDate = tomorrow.toISOString().split('T')[0];
    };

    // ===== Load Questions from LocalStorage =====
    $scope.loadQuestions = function() {
        var storedQuestions = localStorage.getItem('practiceQuestions');
        if (storedQuestions) {
            try {
                $scope.allQuestions = JSON.parse(storedQuestions);
                console.log('Loaded questions from localStorage:', $scope.allQuestions.length, 'questions');
            } catch (e) {
                console.error('Error loading questions:', e);
                $scope.allQuestions = [];
            }
        } else {
            console.log('No questions found in localStorage');
            $scope.allQuestions = [];
        }
    };

    // ===== Load Batches =====
    $scope.loadBatches = function() {
        var batchMap = {};

        $scope.allQuestions.forEach(function(question) {
            var batchId = question.batchId || 'UNBATCHED';
            if (!batchMap[batchId]) {
                batchMap[batchId] = {
                    id: batchId,
                    count: 0,
                    createdAt: question.createdAt,
                    selected: false
                };
            }
            batchMap[batchId].count++;
            if (question.createdAt < batchMap[batchId].createdAt) {
                batchMap[batchId].createdAt = question.createdAt;
            }
        });

        $scope.availableBatches = Object.values(batchMap).sort(function(a, b) {
            return b.createdAt - a.createdAt;
        });

        console.log('Loaded batches:', $scope.availableBatches.length, 'batches');
        console.log('Batch IDs:', $scope.availableBatches.map(function(b) { return b.id; }));
    };

    // ===== Check for Preselected Batches from Practice Questions Page or URL =====
    $scope.checkForPreselectedBatches = function() {
        var preselectedBatchIds = [];

        // First, check URL parameters (e.g., ?bundlesSelected=[00001,00002])
        var urlParams = new URLSearchParams(window.location.search);
        var bundlesParam = urlParams.get('bundlesSelected');
        if (bundlesParam) {
            try {
                // Parse the array from URL (format: [00001,00002] or 00001,00002)
                var cleanParam = bundlesParam.replace(/[\[\]]/g, '');
                preselectedBatchIds = cleanParam.split(',').map(function(id) {
                    return id.trim();
                }).filter(function(id) {
                    return id.length > 0;
                });
                console.log('Loaded bundles from URL:', preselectedBatchIds);
            } catch (e) {
                console.error('Error parsing bundlesSelected from URL:', e);
            }
        }

        // If no URL params (bundlesSelected not provided), redirect to practice-questions.html
        if (preselectedBatchIds.length === 0) {
            console.log('No bundlesSelected parameter found, redirecting to practice-questions.html');
            window.location.href = 'practice-questions.html';
            return;
        }

        // Filter availableBatches to show only pre-selected ones
        $scope.availableBatches = $scope.availableBatches.filter(function(batch) {
            return preselectedBatchIds.indexOf(batch.id) !== -1;
        });

        // Mark all filtered batches as selected by default
        $scope.availableBatches.forEach(function(batch) {
            batch.selected = true;
        });

        // Load questions from selected batches
        $scope.loadQuestionsFromBatches();
    };

    // ===== Toggle Batch Selection =====
    $scope.toggleBatch = function(batchId) {
        var batch = $scope.availableBatches.find(function(b) {
            return b.id === batchId;
        });
        if (batch) {
            batch.selected = !batch.selected;
            // Reload questions based on updated selection
            $scope.loadQuestionsFromBatches();
        }
    };

    // ===== Get Selected Batches =====
    $scope.getSelectedBatches = function() {
        return $scope.availableBatches.filter(function(batch) {
            return batch.selected;
        });
    };

    // ===== Get Total Questions from Selected Batches =====
    $scope.getTotalQuestionsFromBatches = function() {
        return $scope.getSelectedBatches().reduce(function(total, batch) {
            return total + batch.count;
        }, 0);
    };

    // ===== Load Questions from Selected Batches =====
    $scope.loadQuestionsFromBatches = function() {
        var selectedBatchIds = $scope.getSelectedBatches().map(function(b) {
            return b.id;
        });

        $scope.questionsFromBatches = $scope.allQuestions.filter(function(question) {
            return selectedBatchIds.indexOf(question.batchId) !== -1;
        });
    };

    // ===== Trigger Custom Image Upload =====
    $scope.triggerCustomImageUpload = function() {
        document.getElementById('customImageInput').click();
    };

    // ===== Handle Custom Image Upload =====
    $scope.handleCustomImageUpload = function(event) {
        var files = event.target.files;

        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    $scope.showToaster('info', 'Notification', 'File "' + file.name + '" is not an image. Only image files are allowed.');
                    continue;
                }

                // Validate file size (10MB max)
                if (file.size > 10 * 1024 * 1024) {
                    $scope.showToaster('info', 'Notification', 'File "' + file.name + '" is too large. Maximum size is 10MB.');
                    continue;
                }

                // Read and process the image
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        $scope.$apply(function() {
                            var customQuestion = {
                                id: $scope.generateCustomQuestionId(),
                                uuid: $scope.generateUUID(),
                                imageData: e.target.result,
                                answerType: 'MCQ',
                                correctAnswer: 'A',
                                level: 'Medium',
                                createdAt: new Date().getTime(),
                                fileName: file.name,
                                isCustom: true
                            };
                            $scope.customQuestions.push(customQuestion);
                        });
                    };
                    reader.readAsDataURL(file);
                })(file);
            }
        }

        // Reset input
        event.target.value = '';
    };

    // ===== Generate Custom Question ID =====
    $scope.generateCustomQuestionId = function() {
        var maxId = 0;
        $scope.customQuestions.forEach(function(q) {
            var idNum = parseInt(q.id.replace('CQ', ''));
            if (idNum > maxId) {
                maxId = idNum;
            }
        });
        return 'CQ' + String(maxId + 1).padStart(4, '0');
    };

    // ===== Generate UUID =====
    $scope.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // ===== Remove Question =====
    $scope.removeQuestion = function(index, type) {
        if (type === 'batch') {
            $scope.questionsFromBatches.splice(index, 1);
        } else if (type === 'custom') {
            $scope.customQuestions.splice(index, 1);
        }
    };

    // ===== Navigation =====
    $scope.goToStep = function(step) {
        // Validate before allowing navigation
        if (step > $scope.currentStep) {
            // Moving forward - validate current step
            if (!$scope.validateCurrentStep()) {
                return;
            }
        }
        $scope.currentStep = step;

        // Update questions when moving to step 2
        if (step === 2) {
            $scope.loadQuestionsFromBatches();
        }

        // Generate quiz URL when moving to step 4
        if (step === 4) {
            $scope.generateQuizUrl();
        }
    };

    $scope.nextStep = function() {
        if ($scope.validateCurrentStep()) {
            $scope.goToStep($scope.currentStep + 1);
        }
    };

    $scope.previousStep = function() {
        if ($scope.currentStep > 1) {
            $scope.goToStep($scope.currentStep - 1);
        }
    };

    // ===== Validate Current Step =====
    $scope.validateCurrentStep = function() {
        if ($scope.currentStep === 1) {
            if ($scope.getSelectedBatches().length === 0) {
                $scope.showToaster('info', 'Notification', 'Please select at least one batch to continue.');
                return false;
            }
        }
        return true;
    };

    // ===== Check if Quiz Config is Valid =====
    $scope.isQuizConfigValid = function() {
        return $scope.quizConfig.title &&
               $scope.quizConfig.duration > 0 &&
               $scope.quizConfig.startDate &&
               $scope.quizConfig.startTime &&
               $scope.quizConfig.endDate &&
               $scope.quizConfig.endTime;
    };

    // ===== Get Total Questions =====
    $scope.getTotalQuestions = function() {
        return $scope.questionsFromBatches.length + $scope.customQuestions.length;
    };

    // ===== Get Maximum Marks =====
    $scope.getMaximumMarks = function() {
        var totalQuestions = $scope.getTotalQuestions();
        var marksPerQuestion = 4; // Default

        if ($scope.quizConfig.markingScheme === 'default') {
            marksPerQuestion = 4;
        } else if ($scope.quizConfig.markingScheme === 'no-negative') {
            marksPerQuestion = 1;
        } else if ($scope.quizConfig.markingScheme === 'custom') {
            marksPerQuestion = $scope.quizConfig.customMarking.correct || 0;
        }

        return totalQuestions * marksPerQuestion;
    };

    // ===== Generate Quiz URL =====
    $scope.generateQuizUrl = function() {
        var quizId = $scope.generateUUID().split('-')[0].toUpperCase();
        $scope.quizUrl = 'https://candidate.crisprlearning.com/quiz/' + quizId;
    };

    // ===== Copy Quiz URL =====
    $scope.copyQuizUrl = function() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText($scope.quizUrl).then(function() {
                $scope.showToaster('info', 'Notification', 'Quiz URL copied to clipboard!');
            }).catch(function(err) {
                console.error('Error copying URL:', err);
                $scope.fallbackCopyUrl();
            });
        } else {
            $scope.fallbackCopyUrl();
        }
    };

    // ===== Fallback Copy URL Method =====
    $scope.fallbackCopyUrl = function() {
        var textArea = document.createElement('textarea');
        textArea.value = $scope.quizUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            $scope.showToaster('info', 'Notification', 'Quiz URL copied to clipboard!');
        } catch (err) {
            alert('Failed to copy URL. Please copy manually: ' + $scope.quizUrl);
        }
        document.body.removeChild(textArea);
    };

    // ===== Format Date =====
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'N/A';
        var date = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    // ===== Format Date Time =====
    $scope.formatDateTime = function(dateVal, timeVal) {
        if (!dateVal || !timeVal) return 'Not set';

        var date;

        // Handle Date object (from AngularJS date input) or string
        if (dateVal instanceof Date) {
            // dateVal is already a Date object, extract date parts
            var year = dateVal.getFullYear();
            var month = String(dateVal.getMonth() + 1).padStart(2, '0');
            var day = String(dateVal.getDate()).padStart(2, '0');
            var dateStr = year + '-' + month + '-' + day;

            // Handle time - could be Date object or string
            var timeStr;
            if (timeVal instanceof Date) {
                var hours = String(timeVal.getHours()).padStart(2, '0');
                var mins = String(timeVal.getMinutes()).padStart(2, '0');
                timeStr = hours + ':' + mins;
            } else {
                timeStr = timeVal;
            }

            date = new Date(dateStr + 'T' + timeStr);
        } else {
            // Both are strings
            var timeStr = (timeVal instanceof Date)
                ? String(timeVal.getHours()).padStart(2, '0') + ':' + String(timeVal.getMinutes()).padStart(2, '0')
                : timeVal;
            date = new Date(dateVal + 'T' + timeStr);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid date';

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var formattedDate = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var formattedTime = hours + ':' + minutes + ' ' + ampm;

        return formattedDate + ' at ' + formattedTime;
    };

    // ===== Save as Draft =====
    $scope.saveAsDraft = function() {
        var quiz = $scope.prepareQuizData();
        quiz.status = 'draft';

        // Save to localStorage
        var drafts = JSON.parse(localStorage.getItem('quizDrafts') || '[]');
        drafts.push(quiz);
        localStorage.setItem('quizDrafts', JSON.stringify(drafts));

        $scope.showToaster('success', 'Success', 'Quiz saved as draft successfully!\n\nYou can publish it later from the drafts section.');
    };

    // ===== Publish Quiz =====
    $scope.publishQuiz = function() {
        if (!$scope.isQuizConfigValid()) {
            $scope.showToaster('info', 'Notification', 'Please fill in all required quiz configuration fields.');
            return;
        }

        if ($scope.getTotalQuestions() === 0) {
            $scope.showToaster('info', 'Notification', 'Please add at least one question to the quiz.');
            return;
        }

        if (confirm('Are you sure you want to publish this quiz?\n\nOnce published, students will be able to access it during the scheduled time window.')) {
            var quiz = $scope.prepareQuizData();
            quiz.status = 'published';

            // Save to localStorage
            var quizzes = JSON.parse(localStorage.getItem('publishedQuizzes') || '[]');
            quizzes.push(quiz);
            localStorage.setItem('publishedQuizzes', JSON.stringify(quizzes));

            $scope.showToaster('success', 'Success', 'Quiz published successfully!\n\nQuiz URL: ' + $scope.quizUrl + '\n\nShare this URL with your students.');

            // Redirect to quiz management page (or stay on current page)
            // window.location.href = 'quiz-management.html';
        }
    };

    // ===== Prepare Quiz Data =====
    $scope.prepareQuizData = function() {
        var allQuizQuestions = $scope.questionsFromBatches.concat($scope.customQuestions);

        // Extract unique quiz ID from URL
        var quizId = $scope.quizUrl.split('/').pop();

        return {
            id: quizId,
            uuid: $scope.generateUUID(),
            title: $scope.quizConfig.title,
            description: $scope.quizConfig.description,
            duration: $scope.quizConfig.duration,
            markingScheme: $scope.quizConfig.markingScheme,
            customMarking: $scope.quizConfig.customMarking,
            startDateTime: $scope.quizConfig.startDate + 'T' + $scope.quizConfig.startTime,
            endDateTime: $scope.quizConfig.endDate + 'T' + $scope.quizConfig.endTime,
            questions: allQuizQuestions,
            totalQuestions: allQuizQuestions.length,
            maximumMarks: $scope.getMaximumMarks(),
            url: $scope.quizUrl,
            batches: $scope.getSelectedBatches().map(function(b) { return b.id; }),
            createdAt: new Date().getTime(),
            createdBy: 'Abhijith'
        };
    };

}]);
