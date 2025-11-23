// Quiz Attempt Report Controller - Displays rank list and analytics
var quizReportApp = angular.module('quizReportApp', []);

quizReportApp.controller('quizReportController', ['$scope', '$window', function($scope, $window) {

    // ===== Initialize Scope Variables =====
    $scope.quiz = null;
    $scope.rankings = [];
    $scope.searchQuery = '';
    $scope.statusFilter = 'all';
    $scope.courseId = null;
    $scope.moduleId = null;
    $scope.chapterId = null;
    $scope.partId = null;
    $scope.courseInfo = null;

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.loadUrlParams();
        $scope.loadQuizData();
        if ($scope.courseId) {
            $scope.loadCourseInfo();
        }
        $scope.calculateRankings();
    };

    // ===== Load URL Parameters =====
    $scope.loadUrlParams = function() {
        var urlParams = new URLSearchParams($window.location.search);
        $scope.courseId = urlParams.get('course');
        $scope.moduleId = urlParams.get('module');
        $scope.chapterId = urlParams.get('chapter');
        $scope.partId = urlParams.get('part');

        console.log('URL Parameters:', {
            course: $scope.courseId,
            module: $scope.moduleId,
            chapter: $scope.chapterId,
            part: $scope.partId
        });
    };

    // ===== Get Quiz ID from URL =====
    $scope.getQuizIdFromUrl = function() {
        var urlParams = new URLSearchParams($window.location.search);
        return urlParams.get('quiz');
    };

    // ===== Load Course Info =====
    $scope.loadCourseInfo = function() {
        // This would typically come from a backend API
        // For now, we'll create a mock course info based on the course ID
        $scope.courseInfo = {
            id: $scope.courseId,
            name: 'Course ' + $scope.courseId,
            module: $scope.moduleId ? 'Module ' + $scope.moduleId : null,
            chapter: $scope.chapterId ? 'Chapter ' + $scope.chapterId : null,
            part: $scope.partId ? 'Part ' + $scope.partId : null
        };
    };

    // ===== Load Quiz Data =====
    $scope.loadQuizData = function() {
        var quizId = $scope.getQuizIdFromUrl();

        // Try to get from localStorage first (passed from listing page)
        var reportQuizData = localStorage.getItem('reportQuizData');
        if (reportQuizData) {
            try {
                $scope.quiz = JSON.parse(reportQuizData);
                console.log('Loaded quiz from localStorage:', $scope.quiz);
                // Clear after loading
                localStorage.removeItem('reportQuizData');
                return;
            } catch (e) {
                console.error('Error parsing quiz data:', e);
            }
        }

        // Fallback: Try to find in published quizzes
        var publishedQuizzes = localStorage.getItem('publishedQuizzes');
        if (publishedQuizzes) {
            try {
                var quizzes = JSON.parse(publishedQuizzes);
                $scope.quiz = quizzes.find(function(q) { return q.id === quizId; });

                if (!$scope.quiz) {
                    // Try drafts
                    var draftQuizzes = localStorage.getItem('quizDrafts');
                    if (draftQuizzes) {
                        var drafts = JSON.parse(draftQuizzes);
                        $scope.quiz = drafts.find(function(q) { return q.id === quizId; });
                    }
                }
            } catch (e) {
                console.error('Error loading quiz:', e);
            }
        }

        if (!$scope.quiz) {
            console.error('Quiz not found for ID:', quizId);
            $scope.quiz = {
                title: 'Quiz Not Found',
                description: 'The requested quiz could not be loaded.',
                totalQuestions: 0,
                duration: 0,
                maximumMarks: 0,
                status: 'unknown',
                attempts: []
            };
        }
    };

    // ===== Calculate Rankings =====
    $scope.calculateRankings = function() {
        if (!$scope.quiz || !$scope.quiz.attempts) {
            $scope.rankings = [];
            return;
        }

        var attempts = $scope.quiz.attempts;

        // Filter by course enrollment if course parameter is present
        if ($scope.courseId) {
            attempts = $scope.filterByCourseEnrollment(attempts);
        }

        // Get only completed attempts for ranking
        var completedAttempts = attempts.filter(function(attempt) {
            return attempt.status === 'completed';
        });

        // Sort by score (descending)
        completedAttempts.sort(function(a, b) {
            return b.score - a.score;
        });

        // Assign ranks
        var currentRank = 1;
        for (var i = 0; i < completedAttempts.length; i++) {
            if (i > 0 && completedAttempts[i].score < completedAttempts[i - 1].score) {
                currentRank = i + 1;
            }
            completedAttempts[i].rank = currentRank;
            completedAttempts[i].percentage = Math.round((completedAttempts[i].score / $scope.quiz.maximumMarks) * 100);
            completedAttempts[i].timeTaken = $scope.calculateTimeTaken(completedAttempts[i]);
        }

        // Add in-progress attempts without ranks
        var inProgressAttempts = $scope.quiz.attempts.filter(function(attempt) {
            return attempt.status === 'in-progress';
        }).map(function(attempt) {
            attempt.rank = '-';
            attempt.percentage = 0;
            attempt.timeTaken = '-';
            return attempt;
        });

        // Combine: completed first, then in-progress
        $scope.rankings = completedAttempts.concat(inProgressAttempts);
    };

    // ===== Calculate Time Taken =====
    $scope.calculateTimeTaken = function(attempt) {
        if (!attempt.startedAt || !attempt.completedAt) {
            return 'N/A';
        }

        var startTime = new Date(attempt.startedAt).getTime();
        var endTime = new Date(attempt.completedAt).getTime();
        var diffMs = endTime - startTime;

        var diffMins = Math.floor(diffMs / 60000);
        var diffSecs = Math.floor((diffMs % 60000) / 1000);

        if (diffMins > 0) {
            return diffMins + ' min ' + diffSecs + ' sec';
        } else {
            return diffSecs + ' sec';
        }
    };

    // ===== Get Filtered Rankings =====
    $scope.getFilteredRankings = function() {
        var filtered = $scope.rankings;

        // Filter by status
        if ($scope.statusFilter && $scope.statusFilter !== 'all') {
            filtered = filtered.filter(function(ranking) {
                return ranking.status === $scope.statusFilter;
            });
        }

        // Filter by search query
        if ($scope.searchQuery && $scope.searchQuery.trim() !== '') {
            var query = $scope.searchQuery.toLowerCase();
            filtered = filtered.filter(function(ranking) {
                var nameMatch = ranking.studentName && ranking.studentName.toLowerCase().indexOf(query) !== -1;
                var emailMatch = ranking.studentEmail && ranking.studentEmail.toLowerCase().indexOf(query) !== -1;
                return nameMatch || emailMatch;
            });
        }

        return filtered;
    };

    // ===== Get Total Attempts =====
    $scope.getTotalAttempts = function() {
        return $scope.rankings.length;
    };

    // ===== Get Completed Count =====
    $scope.getCompletedCount = function() {
        return $scope.rankings.filter(function(r) {
            return r.status === 'completed';
        }).length;
    };

    // ===== Get In Progress Count =====
    $scope.getInProgressCount = function() {
        return $scope.rankings.filter(function(r) {
            return r.status === 'in-progress';
        }).length;
    };

    // ===== Get Average Score =====
    $scope.getAverageScore = function() {
        var completed = $scope.rankings.filter(function(r) {
            return r.status === 'completed';
        });

        if (completed.length === 0) {
            return 0;
        }

        var totalPercentage = completed.reduce(function(sum, r) {
            return sum + r.percentage;
        }, 0);

        return Math.round(totalPercentage / completed.length);
    };

    // ===== Get Rank Class =====
    $scope.getRankClass = function(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'rank-other';
    };

    // ===== Get Score Class =====
    $scope.getScoreClass = function(percentage) {
        if (percentage >= 90) return 'score-excellent';
        if (percentage >= 75) return 'score-good';
        if (percentage >= 60) return 'score-average';
        return 'score-poor';
    };

    // ===== Filter By Course Enrollment =====
    $scope.filterByCourseEnrollment = function(attempts) {
        // In a real application, this would check against enrolled students from a backend
        // For now, we'll simulate by checking if the student has the course in their profile

        // Try to load course enrollments from localStorage
        var courseEnrollments = localStorage.getItem('courseEnrollments_' + $scope.courseId);

        if (!courseEnrollments) {
            // If no specific enrollments found, return all attempts
            // In production, you might want to return empty array or fetch from backend
            console.log('No course enrollment data found for course:', $scope.courseId);
            return attempts;
        }

        try {
            var enrolledStudents = JSON.parse(courseEnrollments);

            // Filter attempts to only include enrolled students
            return attempts.filter(function(attempt) {
                // Check if student email is in enrolled students list
                return enrolledStudents.some(function(student) {
                    return student.email === attempt.studentEmail;
                });
            });
        } catch (e) {
            console.error('Error parsing course enrollments:', e);
            return attempts;
        }
    };

    // ===== Format Date Time =====
    $scope.formatDateTime = function(dateTimeStr) {
        if (!dateTimeStr) return 'Not set';

        var date;
        if (typeof dateTimeStr === 'number') {
            date = new Date(dateTimeStr);
        } else if (dateTimeStr.indexOf('T') !== -1) {
            date = new Date(dateTimeStr);
        } else {
            return dateTimeStr;
        }

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var formattedDate = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var formattedTime = hours + ':' + minutes + ' ' + ampm;

        return formattedDate + ' ' + formattedTime;
    };

}]);
