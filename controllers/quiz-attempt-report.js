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

    // Date filters
    $scope.dateFrom = null;
    $scope.dateTo = null;

    // Course and Batch filters
    $scope.selectedCourseFilter = '';
    $scope.selectedBatchFilter = '';
    $scope.availableCourses = [];
    $scope.availableBatches = [];
    $scope.filteredBatchesForCourse = [];

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.loadUrlParams();
        $scope.loadCoursesAndBatches();
        $scope.loadQuizData();
        if ($scope.courseId) {
            $scope.loadCourseInfo();
        }
        $scope.calculateRankings();
    };

    // ===== Load Courses and Batches =====
    $scope.loadCoursesAndBatches = function() {
        // Mock data for courses
        $scope.availableCourses = [
            { id: 'CR001', name: 'IAT 2026 – Exclusive 1 Year Course', code: 'IAT-2026' },
            { id: 'CR002', name: 'NEET 2026 Complete Preparation', code: 'NEET-2026' },
            { id: 'CR003', name: 'JEE Advanced 2026 Crash Course', code: 'JEE-2026' },
            { id: 'CR004', name: 'Foundation Course - Class 11', code: 'FOUND-11' },
            { id: 'CR005', name: 'Foundation Course - Class 12', code: 'FOUND-12' }
        ];

        // Mock data for batches
        $scope.availableBatches = [
            { id: 'BATCH-001', name: 'IAT 2026 - Batch A', courseId: 'CR001', students: ['STU-001', 'STU-002', 'STU-003'] },
            { id: 'BATCH-002', name: 'IAT 2026 - Batch B', courseId: 'CR001', students: ['STU-004', 'STU-005', 'STU-006'] },
            { id: 'BATCH-003', name: 'NEET 2026 - Morning Batch', courseId: 'CR002', students: ['STU-007', 'STU-008', 'STU-009'] },
            { id: 'BATCH-004', name: 'NEET 2026 - Evening Batch', courseId: 'CR002', students: ['STU-010', 'STU-011', 'STU-012'] },
            { id: 'BATCH-005', name: 'JEE 2026 - Weekend Batch', courseId: 'CR003', students: ['STU-013', 'STU-014', 'STU-015'] },
            { id: 'BATCH-006', name: 'Foundation Batch 2025-A', courseId: 'CR004', students: ['STU-016', 'STU-017', 'STU-018'] },
            { id: 'BATCH-007', name: 'Foundation Batch 2025-B', courseId: 'CR005', students: ['STU-019', 'STU-020', 'STU-021'] }
        ];
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

            // Create sample quiz with dummy attempts
            $scope.quiz = {
                id: quizId || '608904B5',
                title: 'IAT 2026 - Mock Test 1',
                description: 'Comprehensive mock test for IISER Aptitude Test 2026 preparation',
                totalQuestions: 60,
                duration: 180,
                maximumMarks: 240,
                status: 'published',
                attempts: $scope.generateSampleAttempts()
            };
        }

        // If quiz exists but has no attempts, add sample data
        if ($scope.quiz && (!$scope.quiz.attempts || $scope.quiz.attempts.length === 0)) {
            $scope.quiz.attempts = $scope.generateSampleAttempts();
        }
    };

    // ===== Generate Sample Attempts =====
    $scope.generateSampleAttempts = function() {
        var studentNames = [
            'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
            'Anjali Gupta', 'Arjun Mehta', 'Divya Iyer', 'Karan Verma', 'Neha Joshi',
            'Rahul Desai', 'Pooja Nair', 'Siddharth Rao', 'Kavya Menon', 'Aditya Shah',
            'Ritu Agarwal', 'Varun Khanna', 'Meera Pillai', 'Rohan Malhotra', 'Shruti Kapoor',
            'Nikhil Bose', 'Ananya Das', 'Harsh Jain', 'Ishita Banerjee', 'Saurabh Mishra'
        ];

        var attempts = [];
        var now = new Date();
        var courseIds = ['CR001', 'CR002', 'CR003', 'CR004', 'CR005'];
        var studentIdPrefix = 'STU-';

        for (var i = 0; i < 25; i++) {
            var daysAgo = Math.floor(Math.random() * 30); // Last 30 days
            var hoursAgo = Math.floor(Math.random() * 24);
            var startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));

            var isCompleted = Math.random() > 0.2; // 80% completion rate
            var score = isCompleted ? Math.floor(Math.random() * 241) : 0; // 0-240
            var timeTaken = Math.floor(Math.random() * 180) + 60; // 60-240 minutes

            var endDate = isCompleted ? new Date(startDate.getTime() + (timeTaken * 60 * 1000)) : null;

            attempts.push({
                studentId: studentIdPrefix + String(i + 1).padStart(3, '0'),
                studentName: studentNames[i],
                studentEmail: studentNames[i].toLowerCase().replace(' ', '.') + '@example.com',
                courseId: courseIds[i % courseIds.length],
                startedAt: startDate.toISOString(),
                completedAt: endDate ? endDate.toISOString() : null,
                status: isCompleted ? 'completed' : 'in-progress',
                score: score,
                correctAnswers: isCompleted ? Math.floor((score / 240) * 60) : 0,
                incorrectAnswers: isCompleted ? Math.floor(Math.random() * 15) : 0,
                unattempted: isCompleted ? 60 - Math.floor((score / 240) * 60) - Math.floor(Math.random() * 15) : 60
            });
        }

        return attempts;
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

        // Filter by date range (with time)
        if ($scope.dateFrom) {
            var fromDateTime = new Date($scope.dateFrom);
            filtered = filtered.filter(function(ranking) {
                if (!ranking.startedAt) return false;
                var attemptDateTime = new Date(ranking.startedAt);
                return attemptDateTime >= fromDateTime;
            });
        }

        if ($scope.dateTo) {
            var toDateTime = new Date($scope.dateTo);
            filtered = filtered.filter(function(ranking) {
                if (!ranking.startedAt) return false;
                var attemptDateTime = new Date(ranking.startedAt);
                return attemptDateTime <= toDateTime;
            });
        }

        // Filter by course
        if ($scope.selectedCourseFilter) {
            filtered = filtered.filter(function(ranking) {
                return ranking.courseId === $scope.selectedCourseFilter;
            });
        }

        // Filter by batch
        if ($scope.selectedBatchFilter) {
            var selectedBatch = $scope.availableBatches.find(function(b) {
                return b.id === $scope.selectedBatchFilter;
            });

            if (selectedBatch) {
                filtered = filtered.filter(function(ranking) {
                    return selectedBatch.students.indexOf(ranking.studentId) !== -1;
                });
            }
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

    // ===== Filter Helper Functions =====

    // Course change handler
    $scope.onCourseChange = function() {
        // Reset batch filter when course changes
        $scope.selectedBatchFilter = '';

        // Filter batches for selected course
        if ($scope.selectedCourseFilter) {
            $scope.filteredBatchesForCourse = $scope.availableBatches.filter(function(batch) {
                return batch.courseId === $scope.selectedCourseFilter;
            });
        } else {
            $scope.filteredBatchesForCourse = [];
        }
    };

    // Get course name by ID
    $scope.getCourseName = function(courseId) {
        var course = $scope.availableCourses.find(function(c) {
            return c.id === courseId;
        });
        return course ? course.name : courseId;
    };

    // Get batch name by ID
    $scope.getBatchName = function(batchId) {
        var batch = $scope.availableBatches.find(function(b) {
            return b.id === batchId;
        });
        return batch ? batch.name : batchId;
    };

    // Check if any filters are active
    $scope.hasActiveFilters = function() {
        return $scope.searchQuery ||
               $scope.statusFilter !== 'all' ||
               $scope.dateFrom ||
               $scope.dateTo ||
               $scope.selectedCourseFilter ||
               $scope.selectedBatchFilter;
    };

    // Clear all filters
    $scope.clearFilters = function() {
        $scope.searchQuery = '';
        $scope.statusFilter = 'all';
        $scope.dateFrom = null;
        $scope.dateTo = null;
        $scope.selectedCourseFilter = '';
        $scope.selectedBatchFilter = '';
        $scope.filteredBatchesForCourse = [];
    };

    // Clear course filter (and batch)
    $scope.clearCourseFilter = function() {
        $scope.selectedCourseFilter = '';
        $scope.selectedBatchFilter = '';
        $scope.filteredBatchesForCourse = [];
    };

    // ===== Export Rank List to PDF =====
    $scope.exportRankListPDF = function() {
        var filteredData = $scope.getFilteredRankings();

        if (filteredData.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        // Confirm export
        if (!confirm('Do you want to export the filtered rank list (' + filteredData.length + ' records) as PDF?')) {
            return;
        }

        // Generate PDF content
        var printWindow = $window.open('', '_blank');

        var html = '<!DOCTYPE html><html><head><title>Rank List - ' + $scope.quiz.title + '</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
        html += 'h1 { color: #006073; font-size: 24px; margin-bottom: 5px; }';
        html += 'h2 { color: #333; font-size: 18px; margin-top: 0; }';
        html += '.header-info { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #006073; }';
        html += '.info-row { display: flex; gap: 30px; margin-bottom: 8px; font-size: 13px; }';
        html += '.info-label { font-weight: bold; color: #666; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
        html += 'th { background: #006073; color: white; padding: 12px 8px; text-align: left; font-size: 12px; border: 1px solid #004d5c; }';
        html += 'td { padding: 10px 8px; border: 1px solid #ddd; font-size: 11px; }';
        html += 'tr:nth-child(even) { background: #f8f9fa; }';
        html += '.rank-col { font-weight: bold; color: #006073; text-align: center; }';
        html += '.score-col { font-weight: bold; text-align: center; }';
        html += '.footer { margin-top: 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }';
        html += '@media print { body { margin: 0; } }';
        html += '</style></head><body>';

        // Header
        html += '<h1>Quiz Rank List Report</h1>';
        html += '<h2>' + $scope.quiz.title + '</h2>';

        // Quiz Info
        html += '<div class="header-info">';
        html += '<div class="info-row">';
        html += '<div><span class="info-label">Total Questions:</span> ' + $scope.quiz.totalQuestions + '</div>';
        html += '<div><span class="info-label">Duration:</span> ' + $scope.quiz.duration + ' minutes</div>';
        html += '<div><span class="info-label">Maximum Marks:</span> ' + $scope.quiz.maximumMarks + '</div>';
        html += '</div>';

        // Filter Info
        if ($scope.hasActiveFilters()) {
            html += '<div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">';
            html += '<div><span class="info-label">Filters Applied:</span></div>';
            html += '</div>';
            html += '<div class="info-row">';
            if ($scope.searchQuery) html += '<div>Search: "' + $scope.searchQuery + '"</div>';
            if ($scope.statusFilter !== 'all') html += '<div>Status: ' + $scope.statusFilter + '</div>';
            if ($scope.dateFrom) html += '<div>From: ' + $scope.dateFrom + '</div>';
            if ($scope.dateTo) html += '<div>To: ' + $scope.dateTo + '</div>';
            if ($scope.selectedCourseFilter) html += '<div>Course: ' + $scope.getCourseName($scope.selectedCourseFilter) + '</div>';
            if ($scope.selectedBatchFilter) html += '<div>Batch: ' + $scope.getBatchName($scope.selectedBatchFilter) + '</div>';
            html += '</div>';
        }

        html += '<div class="info-row" style="margin-top: 10px;">';
        html += '<div><span class="info-label">Total Records:</span> ' + filteredData.length + '</div>';
        html += '<div><span class="info-label">Generated On:</span> ' + new Date().toLocaleString() + '</div>';
        html += '</div>';
        html += '</div>';

        // Table
        html += '<table>';
        html += '<thead><tr>';
        html += '<th style="width: 60px; text-align: center;">Rank</th>';
        html += '<th style="width: 180px;">Student Name</th>';
        html += '<th style="width: 200px;">Email</th>';
        html += '<th style="width: 100px; text-align: center;">Score</th>';
        html += '<th style="width: 80px; text-align: center;">Percentage</th>';
        html += '<th style="width: 100px; text-align: center;">Time Taken</th>';
        html += '<th style="width: 140px;">Started At</th>';
        html += '<th style="width: 80px; text-align: center;">Status</th>';
        html += '</tr></thead><tbody>';

        filteredData.forEach(function(record) {
            html += '<tr>';
            html += '<td class="rank-col">' + (record.rank || 'N/A') + '</td>';
            html += '<td>' + record.studentName + '</td>';
            html += '<td>' + record.studentEmail + '</td>';
            html += '<td class="score-col">' + record.score + ' / ' + $scope.quiz.maximumMarks + '</td>';
            html += '<td class="score-col">' + (record.percentage || 0) + '%</td>';
            html += '<td style="text-align: center;">' + (record.timeTaken || 'N/A') + '</td>';
            html += '<td>' + $scope.formatDateTime(record.startedAt) + '</td>';
            html += '<td style="text-align: center; text-transform: capitalize;">' + record.status + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';

        // Footer
        html += '<div class="footer">';
        html += 'Generated by VegaPilot LMS - Quiz Attempt Report<br>';
        html += 'This document is auto-generated and reflects data at the time of export.';
        html += '</div>';

        html += '</body></html>';

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = function() {
            setTimeout(function() {
                printWindow.print();
            }, 250);
        };
    };

}]);
