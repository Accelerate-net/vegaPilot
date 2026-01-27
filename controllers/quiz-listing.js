// Quiz Listing Controller - Manages quiz listing and attempts
var quizListingApp = angular.module('quizListingApp', ['ngCookies']);

quizListingApp.controller('quizListingController', ['$scope', '$cookies', '$timeout', function ($scope, $cookies, $timeout) {
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




    // ===== Initialize Scope Variables =====
    $scope.allQuizzes = [];
    $scope.publishedQuizzes = [];
    $scope.draftQuizzes = [];
    $scope.currentTab = 'all';
    $scope.showAttemptsModal = false;
    $scope.showViewModal = false;
    $scope.showDeleteModal = false;
    $scope.showPublishModal = false;
    $scope.selectedQuiz = null;
    $scope.quizToDelete = null;
    $scope.quizToPublish = null;
    $scope.quizSearchQuery = '';
    $scope.attemptSearchQuery = '';

    // Sorting variables
    $scope.sortColumn = '';
    $scope.sortReverse = false;

    // Pagination
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.pageSize = "10";
    $scope.totalItems = 0;
    $scope.totalPages = 0;

    // Attempts Pagination
    $scope.attemptsPage = 1;
    $scope.attemptsPageSize = 5;
    $scope.totalAttempts = 0;
    $scope.totalAttemptsPages = 0;

    $scope.Math = window.Math;

    // Loading State
    $scope.isLoading = false;

    // ===== Toggle Kebab Menu =====
    $scope.toggleKebabMenu = function (quiz, $event) {
        $event.stopPropagation();

        // Close all other kebab menus first
        $scope.allQuizzes.forEach(function (q) {
            if (q !== quiz) {
                q.showKebabMenu = false;
            }
        });

        // Toggle the clicked quiz's menu
        quiz.showKebabMenu = !quiz.showKebabMenu;
    };

    // Close kebab menus when clicking outside
    angular.element(document).on('click', function (event) {
        $scope.$apply(function () {
            $scope.allQuizzes.forEach(function (quiz) {
                quiz.showKebabMenu = false;
            });
        });
    });

    // ===== Initialize Controller =====
    $scope.init = function () {
        $scope.isLoading = true;
        // Simulate loading delay for shimmer effect
        $timeout(function () {
            $scope.loadQuizzes();
            $scope.loadSampleAttempts(); // For demonstration - you can remove this in production
            $scope.isLoading = false;
        }, 1500);
    };

    // ===== Pagination Functions =====
    $scope.changePageSize = function () {
        $scope.itemsPerPage = parseInt($scope.pageSize);
        $scope.currentPage = 1;
    };

    $scope.previousPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
        }
    };

    $scope.goToPage = function (page) {
        $scope.currentPage = page;
    };

    $scope.getPageNumbers = function () {
        var pages = [];
        for (var i = 1; i <= $scope.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.getPaginatedQuizzes = function () {
        var filtered = $scope.getFilteredQuizzes();
        $scope.totalItems = filtered.length;
        $scope.totalPages = Math.ceil($scope.totalItems / $scope.itemsPerPage);

        // Ensure current page is valid
        if ($scope.currentPage > $scope.totalPages && $scope.totalPages > 0) {
            $scope.currentPage = $scope.totalPages;
        }

        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        return filtered.slice(start, start + $scope.itemsPerPage);
    };

    $scope.getSkeletonRows = function () {
        return new Array($scope.itemsPerPage);
    };

    // ===== Load Quizzes from LocalStorage =====
    $scope.loadQuizzes = function () {
        // Load published quizzes
        var publishedQuizzes = localStorage.getItem('publishedQuizzes');
        if (publishedQuizzes) {
            try {
                $scope.publishedQuizzes = JSON.parse(publishedQuizzes);
            } catch (e) {
                console.error('Error loading published quizzes:', e);
                $scope.publishedQuizzes = [];
            }
        }

        // Load draft quizzes
        var draftQuizzes = localStorage.getItem('quizDrafts');
        if (draftQuizzes) {
            try {
                $scope.draftQuizzes = JSON.parse(draftQuizzes);
            } catch (e) {
                console.error('Error loading draft quizzes:', e);
                $scope.draftQuizzes = [];
            }
        }

        // Combine all quizzes
        $scope.allQuizzes = $scope.publishedQuizzes.concat($scope.draftQuizzes);

        console.log('Loaded quizzes:', {
            total: $scope.allQuizzes.length,
            published: $scope.publishedQuizzes.length,
            drafts: $scope.draftQuizzes.length
        });
    };

    // ===== Load Sample Attempts (For Demonstration) =====
    $scope.loadSampleAttempts = function () {
        // Add sample attempts to quizzes for demonstration
        // In production, this would come from a backend API
        $scope.allQuizzes.forEach(function (quiz, index) {
            if (!quiz.attempts) {
                quiz.attempts = [];
            }

            // Add 2-5 random sample attempts for each quiz
            var numAttempts = Math.floor(Math.random() * 4) + 2;
            var students = [
                { name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com' },
                { name: 'Priya Sharma', email: 'priya.sharma@example.com' },
                { name: 'Amit Patel', email: 'amit.patel@example.com' },
                { name: 'Sneha Reddy', email: 'sneha.reddy@example.com' },
                { name: 'Vikram Singh', email: 'vikram.singh@example.com' },
                { name: 'Ananya Iyer', email: 'ananya.iyer@example.com' },
                { name: 'Karthik Menon', email: 'karthik.menon@example.com' }
            ];

            for (var i = 0; i < numAttempts && i < students.length; i++) {
                var student = students[i];
                var status = Math.random() > 0.3 ? 'completed' : 'in-progress';
                var startTime = new Date().getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last 7 days

                var attempt = {
                    studentName: student.name,
                    studentEmail: student.email,
                    status: status,
                    startedAt: startTime,
                    completedAt: status === 'completed' ? startTime + (quiz.duration * 60 * 1000) : null,
                    score: status === 'completed' ? Math.floor(Math.random() * quiz.maximumMarks * 0.6) + Math.floor(quiz.maximumMarks * 0.3) : null
                };

                quiz.attempts.push(attempt);
            }
        });

        // Update the separate arrays too
        $scope.publishedQuizzes = $scope.allQuizzes.filter(function (q) { return q.status === 'published'; });
        $scope.draftQuizzes = $scope.allQuizzes.filter(function (q) { return q.status === 'draft'; });
    };

    // ===== Switch Tab =====
    $scope.switchTab = function (tab) {
        $scope.currentTab = tab;
    };

    // ===== Get Displayed Quizzes Based on Current Tab =====
    $scope.getDisplayedQuizzes = function () {
        if ($scope.currentTab === 'all') {
            return $scope.allQuizzes;
        } else if ($scope.currentTab === 'published') {
            return $scope.publishedQuizzes;
        } else if ($scope.currentTab === 'draft') {
            return $scope.draftQuizzes;
        }
        return [];
    };

    // ===== Get Filtered Quizzes (with Search) =====
    $scope.getFilteredQuizzes = function () {
        var quizzes = $scope.getDisplayedQuizzes();

        if (!$scope.quizSearchQuery || $scope.quizSearchQuery.trim() === '') {
            return quizzes;
        }

        var query = $scope.quizSearchQuery.toLowerCase();
        return quizzes.filter(function (quiz) {
            var titleMatch = quiz.title && quiz.title.toLowerCase().indexOf(query) !== -1;
            var descMatch = quiz.description && quiz.description.toLowerCase().indexOf(query) !== -1;
            return titleMatch || descMatch;
        });
    };

    // ===== Get Filtered Attempts (with Search) =====
    $scope.getFilteredAttempts = function () {
        if (!$scope.selectedQuiz || !$scope.selectedQuiz.attempts) {
            return [];
        }

        var attempts = $scope.selectedQuiz.attempts;

        if (!$scope.attemptSearchQuery || $scope.attemptSearchQuery.trim() === '') {
            return attempts;
        }

        var query = $scope.attemptSearchQuery.toLowerCase();
        return attempts.filter(function (attempt) {
            var nameMatch = attempt.studentName && attempt.studentName.toLowerCase().indexOf(query) !== -1;
            var emailMatch = attempt.studentEmail && attempt.studentEmail.toLowerCase().indexOf(query) !== -1;
            return nameMatch || emailMatch;
        });
    };

    // ===== Get Paginated Attempts =====
    $scope.getPaginatedAttempts = function () {
        var filtered = $scope.getFilteredAttempts();
        $scope.totalAttempts = filtered.length;
        $scope.totalAttemptsPages = Math.ceil($scope.totalAttempts / $scope.attemptsPageSize);

        if ($scope.attemptsPage > $scope.totalAttemptsPages && $scope.totalAttemptsPages > 0) {
            $scope.attemptsPage = $scope.totalAttemptsPages;
        }

        var start = ($scope.attemptsPage - 1) * $scope.attemptsPageSize;
        return filtered.slice(start, start + $scope.attemptsPageSize);
    };

    // Attempts Pagination Controls
    $scope.changeAttemptsPage = function (page) {
        $scope.attemptsPage = page;
    };

    $scope.nextAttemptsPage = function () {
        if ($scope.attemptsPage < $scope.totalAttemptsPages) {
            $scope.attemptsPage++;
        }
    };

    $scope.prevAttemptsPage = function () {
        if ($scope.attemptsPage > 1) {
            $scope.attemptsPage--;
        }
    };

    $scope.getAttemptsPageNumbers = function () {
        var pages = [];
        for (var i = 1; i <= $scope.totalAttemptsPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.getAttemptsStartIndex = function () {
        return ($scope.attemptsPage - 1) * $scope.attemptsPageSize;
    };

    $scope.getAttemptsEndIndex = function () {
        return Math.min($scope.attemptsPage * $scope.attemptsPageSize, $scope.totalAttempts);
    };

    // ===== Show Attempts Modal =====
    $scope.showAttempts = function (quiz) {
        $scope.selectedQuiz = quiz;
        $scope.attemptSearchQuery = '';
        $scope.attemptsPage = 1; // Reset to first page
        $scope.showAttemptsModal = true;
    };

    // ===== Close Attempts Modal =====
    $scope.closeAttemptsModal = function () {
        $scope.showAttemptsModal = false;
        $scope.selectedQuiz = null;
        $scope.attemptSearchQuery = '';
    };

    // ===== Show View Modal =====
    $scope.viewQuiz = function (quiz) {
        $scope.selectedQuiz = quiz;
        $scope.showViewModal = true;
    };

    // ===== Close View Modal =====
    $scope.closeViewModal = function () {
        $scope.showViewModal = false;
        $scope.selectedQuiz = null;
    };

    // ===== View Report =====
    $scope.viewReport = function (quiz) {
        // Store quiz data for the report page
        localStorage.setItem('reportQuizData', JSON.stringify(quiz));
        // Navigate to report page with quiz ID
        window.location.href = 'quiz-attempt-report.html?quiz=' + quiz.id;
    };

    // ===== Show Delete Modal =====
    $scope.deleteQuiz = function (quiz) {
        $scope.quizToDelete = quiz;
        $scope.showDeleteModal = true;
    };

    // ===== Close Delete Modal =====
    $scope.closeDeleteModal = function () {
        $scope.showDeleteModal = false;
        $scope.quizToDelete = null;
    };

    // ===== Confirm Delete =====
    $scope.confirmDelete = function () {
        var quiz = $scope.quizToDelete;

        // Remove from appropriate array
        if (quiz.status === 'published') {
            $scope.publishedQuizzes = $scope.publishedQuizzes.filter(function (q) {
                return q.id !== quiz.id;
            });
            localStorage.setItem('publishedQuizzes', JSON.stringify($scope.publishedQuizzes));
        } else {
            $scope.draftQuizzes = $scope.draftQuizzes.filter(function (q) {
                return q.id !== quiz.id;
            });
            localStorage.setItem('quizDrafts', JSON.stringify($scope.draftQuizzes));
        }

        // Update all quizzes
        $scope.allQuizzes = $scope.publishedQuizzes.concat($scope.draftQuizzes);

        $scope.closeDeleteModal();
    };

    // ===== Show Publish Modal =====
    $scope.publishQuiz = function (quiz) {
        $scope.quizToPublish = quiz;
        $scope.showPublishModal = true;
    };

    // ===== Close Publish Modal =====
    $scope.closePublishModal = function () {
        $scope.showPublishModal = false;
        $scope.quizToPublish = null;
    };

    // ===== Confirm Publish =====
    $scope.confirmPublish = function () {
        var quiz = $scope.quizToPublish;
        quiz.status = 'published';

        // Remove from drafts
        $scope.draftQuizzes = $scope.draftQuizzes.filter(function (q) {
            return q.id !== quiz.id;
        });

        // Add to published
        $scope.publishedQuizzes.push(quiz);

        // Update all quizzes
        $scope.allQuizzes = $scope.publishedQuizzes.concat($scope.draftQuizzes);

        // Save to localStorage
        localStorage.setItem('publishedQuizzes', JSON.stringify($scope.publishedQuizzes));
        localStorage.setItem('quizDrafts', JSON.stringify($scope.draftQuizzes));

        $scope.closePublishModal();
    };

    // ===== Get Completed Count =====
    $scope.getCompletedCount = function (attempts) {
        if (!attempts) return 0;
        return attempts.filter(function (a) { return a.status === 'completed'; }).length;
    };

    // ===== Get In Progress Count =====
    $scope.getInProgressCount = function (attempts) {
        if (!attempts) return 0;
        return attempts.filter(function (a) { return a.status === 'in-progress'; }).length;
    };

    // ===== Get Percentage =====
    $scope.getPercentage = function (score, maxMarks) {
        if (!maxMarks || maxMarks === 0) return 0;
        return Math.round((score / maxMarks) * 100);
    };


    // ===== Format Date =====
    $scope.formatDate = function (timestamp) {
        if (!timestamp) return 'N/A';
        var date = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    // ===== Format Date Time =====
    $scope.formatDateTime = function (dateTimeStr) {
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

    // ===== Sort By Column =====
    $scope.sortByColumn = function (column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        // Get the current displayed quizzes and sort them
        var quizzesToSort = $scope.getDisplayedQuizzes();

        quizzesToSort.sort(function (a, b) {
            var aVal, bVal;

            switch (column) {
                case 'title':
                    aVal = a.title ? a.title.toLowerCase() : '';
                    bVal = b.title ? b.title.toLowerCase() : '';
                    break;
                case 'status':
                    aVal = a.status ? a.status.toLowerCase() : '';
                    bVal = b.status ? b.status.toLowerCase() : '';
                    break;
                case 'totalQuestions':
                    aVal = parseInt(a.totalQuestions) || 0;
                    bVal = parseInt(b.totalQuestions) || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'duration':
                    aVal = parseInt(a.duration) || 0;
                    bVal = parseInt(b.duration) || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'maximumMarks':
                    aVal = parseInt(a.maximumMarks) || 0;
                    bVal = parseInt(b.maximumMarks) || 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'attemptCount':
                    aVal = a.attempts ? a.attempts.length : 0;
                    bVal = b.attempts ? b.attempts.length : 0;
                    return $scope.sortReverse ? (aVal - bVal) : (bVal - aVal);
                case 'createdAt':
                    aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

        // Update the appropriate array based on current tab
        if ($scope.currentTab === 'all') {
            $scope.allQuizzes = quizzesToSort;
        } else if ($scope.currentTab === 'published') {
            $scope.publishedQuizzes = quizzesToSort;
        } else if ($scope.currentTab === 'draft') {
            $scope.draftQuizzes = quizzesToSort;
        }
    };

}]);
