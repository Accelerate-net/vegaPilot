/**
 * Test Series Management Controller
 * Angular 1.x Controller for managing test series
 */

var app = angular.module('testSeriesApp', ['ngCookies']);

app.controller('testSeriesController', ['$scope', '$http', '$cookies', '$timeout', function($scope, $http, $cookies, $timeout) {

    // ===== Initialize Data =====
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };

    $scope.testSeriesList = [];
    $scope.availableExams = [];
    $scope.filteredAvailableExams = [];
    $scope.selectedExamsMap = {}; // {examId: {exam: examObj, accessType: 'free'|'premium'}}

    // Modal state
    $scope.createModalOpen = false;
    $scope.editMode = false;
    $scope.currentSeries = null;
    $scope.examSearchQuery = '';

    // Loading state
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // Sorting state
    $scope.sortColumn = 'name';
    $scope.sortReverse = false;

    // Toggle Kebab Menu
    $scope.toggleKebabMenu = function(series, $event) {
        $event.stopPropagation();

        // Close all other kebab menus first
        $scope.testSeriesList.forEach(function(s) {
            if (s !== series) {
                s.showKebabMenu = false;
            }
        });

        // Toggle the clicked series's menu
        series.showKebabMenu = !series.showKebabMenu;
    };

    // Close kebab menus when clicking outside
    angular.element(document).on('click', function(e) {
        if (!angular.element(e.target).closest('.kebab-menu-container').length) {
            var hasOpenMenu = $scope.testSeriesList && $scope.testSeriesList.some(function(series) {
                return series.showKebabMenu;
            });
            if (hasOpenMenu) {
                $scope.$applyAsync(function() {
                    $scope.testSeriesList.forEach(function(series) {
                        series.showKebabMenu = false;
                    });
                });
            }
        }
    });

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.showLoading('Loading data...');
        $scope.loadExams();
        $scope.loadTestSeries();
    };

    // ===== Load Exams from exam-listing (dummy data matching exam-listing.js) =====
    $scope.loadExams = function() {
        $timeout(function() {
            $scope.availableExams = [
                {
                    id: 50000,
                    displayKey: '4df33c6e-9282-48dc-b8ee-d70e5d2304ef',
                    title: 'IAT Mock Test - 1',
                    brief: 'Boost your IISER Aptitude Test 2025 preparation with our specially curated mock test',
                    duration: 180,
                    totalQuestions: 60,
                    numberOfSections: 4,
                    status: 'active'
                },
                {
                    id: 50001,
                    displayKey: '5ef44d7f-0393-59ed-c9ff-e81f6e3415fg',
                    title: 'IAT Mock Test - 2',
                    brief: 'Continue your preparation with our second comprehensive mock test',
                    duration: 180,
                    totalQuestions: 60,
                    numberOfSections: 4,
                    status: 'active'
                },
                {
                    id: 50002,
                    displayKey: '6fg55e8g-1404-60fe-d0gg-f92g7f4526gh',
                    title: 'IAT Mock Test - 3',
                    brief: 'Advanced level mock test for serious aspirants',
                    duration: 180,
                    totalQuestions: 60,
                    numberOfSections: 4,
                    status: 'active'
                },
                {
                    id: 50003,
                    displayKey: '7gh66f9h-2515-71gf-e1hh-g03h8g5637hi',
                    title: 'IAT Mock Test - 4',
                    brief: 'Expert level mock test with challenging questions',
                    duration: 180,
                    totalQuestions: 60,
                    numberOfSections: 4,
                    status: 'active'
                },
                {
                    id: 50004,
                    displayKey: '8hi77g0i-3626-82hg-f2ii-h14i9h6748ij',
                    title: 'IAT Mock Test - 5',
                    brief: 'Final preparation mock test before the actual exam',
                    duration: 180,
                    totalQuestions: 60,
                    numberOfSections: 4,
                    status: 'active'
                },
                {
                    id: 50005,
                    displayKey: '9ij88h1j-4737-93ih-g3jj-i25j0i7859jk',
                    title: 'Physics Full Test - 1',
                    brief: 'Comprehensive physics test covering all topics',
                    duration: 120,
                    totalQuestions: 40,
                    numberOfSections: 2,
                    status: 'active'
                },
                {
                    id: 50006,
                    displayKey: '0jk99i2k-5848-04ji-h4kk-j36k1j8960kl',
                    title: 'Chemistry Full Test - 1',
                    brief: 'Complete chemistry assessment for thorough preparation',
                    duration: 120,
                    totalQuestions: 40,
                    numberOfSections: 2,
                    status: 'active'
                },
                {
                    id: 50007,
                    displayKey: '1kl00j3l-6959-15kj-i5ll-k47l2k9071lm',
                    title: 'Mathematics Full Test - 1',
                    brief: 'Advanced mathematics test with problem-solving questions',
                    duration: 120,
                    totalQuestions: 40,
                    numberOfSections: 2,
                    status: 'active'
                },
                {
                    id: 50008,
                    displayKey: '2lm11k4m-7060-26lk-j6mm-l58m3l0182mn',
                    title: 'Biology Full Test - 1',
                    brief: 'Comprehensive biology test covering all chapters',
                    duration: 120,
                    totalQuestions: 40,
                    numberOfSections: 2,
                    status: 'active'
                },
                {
                    id: 50009,
                    displayKey: '3mn22l5n-8171-37ml-k7nn-m69n4m1293no',
                    title: 'IAT Practice Test - General',
                    brief: 'General practice test for initial assessment',
                    duration: 90,
                    totalQuestions: 30,
                    numberOfSections: 3,
                    status: 'active'
                }
            ];

            $scope.filteredAvailableExams = angular.copy($scope.availableExams);
            $scope.hideLoading();
        }, 500);
    };

    // ===== Load Test Series =====
    $scope.loadTestSeries = function() {
        // Sample data - replace with API call
        $timeout(function() {
            $scope.testSeriesList = [
                {
                    id: 1,
                    name: 'IAT 2026 - Full Mock Tests',
                    description: 'Complete mock test series for IISER Aptitude Test 2026 with 10 full-length tests',
                    status: 'active',
                    exams: [
                        { examId: 50000, examTitle: 'IAT Mock Test - 1', accessType: 'free' },
                        { examId: 50001, examTitle: 'IAT Mock Test - 2', accessType: 'free' },
                        { examId: 50002, examTitle: 'IAT Mock Test - 3', accessType: 'premium' },
                        { examId: 50003, examTitle: 'IAT Mock Test - 4', accessType: 'premium' },
                        { examId: 50004, examTitle: 'IAT Mock Test - 5', accessType: 'premium' }
                    ],
                    createdAt: new Date('2024-11-01'),
                    updatedAt: new Date('2024-11-20')
                },
                {
                    id: 2,
                    name: 'Subject-wise Tests - Physics',
                    description: 'Specialized physics test series for focused preparation',
                    status: 'active',
                    exams: [
                        { examId: 50005, examTitle: 'Physics Full Test - 1', accessType: 'premium' }
                    ],
                    createdAt: new Date('2024-10-15'),
                    updatedAt: new Date('2024-10-15')
                }
            ];
            $scope.hideLoading();
        }, 500);
    };

    // ===== Modal Functions =====
    $scope.openCreateModal = function() {
        $scope.editMode = false;
        $scope.currentSeries = {
            name: '',
            description: '',
            status: 'active',
            exams: []
        };
        $scope.selectedExamsMap = {};
        $scope.examSearchQuery = '';
        $scope.createModalOpen = true;
    };

    $scope.closeCreateModal = function() {
        $scope.createModalOpen = false;
        $timeout(function() {
            $scope.currentSeries = null;
            $scope.selectedExamsMap = {};
            $scope.examSearchQuery = '';
        }, 300);
    };

    $scope.editSeries = function(series) {
        $scope.editMode = true;
        $scope.currentSeries = angular.copy(series);

        // Rebuild selectedExamsMap from series.exams
        $scope.selectedExamsMap = {};
        series.exams.forEach(function(examInfo) {
            var exam = $scope.availableExams.find(function(e) {
                return e.id === examInfo.examId;
            });
            if (exam) {
                $scope.selectedExamsMap[exam.id] = {
                    exam: exam,
                    accessType: examInfo.accessType
                };
            }
        });

        $scope.examSearchQuery = '';
        $scope.createModalOpen = true;
    };

    // ===== Exam Selection Functions =====
    $scope.isExamSelected = function(exam) {
        return !!$scope.selectedExamsMap[exam.id];
    };

    $scope.toggleExamSelection = function(exam) {
        if ($scope.selectedExamsMap[exam.id]) {
            // Deselect
            delete $scope.selectedExamsMap[exam.id];
        } else {
            // Select with default 'premium' access
            $scope.selectedExamsMap[exam.id] = {
                exam: exam,
                accessType: 'premium'
            };
        }
    };

    $scope.getExamAccessType = function(exam) {
        return $scope.selectedExamsMap[exam.id] ? $scope.selectedExamsMap[exam.id].accessType : 'premium';
    };

    $scope.setExamAccessType = function(exam, accessType) {
        if ($scope.selectedExamsMap[exam.id]) {
            $scope.selectedExamsMap[exam.id].accessType = accessType;
        }
    };

    // ===== Watch for search query changes =====
    $scope.$watch('examSearchQuery', function(newVal) {
        if (!newVal) {
            $scope.filteredAvailableExams = angular.copy($scope.availableExams);
        } else {
            var searchLower = newVal.toLowerCase();
            $scope.filteredAvailableExams = $scope.availableExams.filter(function(exam) {
                return exam.title.toLowerCase().indexOf(searchLower) !== -1 ||
                       (exam.brief && exam.brief.toLowerCase().indexOf(searchLower) !== -1);
            });
        }
    });

    // ===== Summary Functions =====
    $scope.getSelectedExamsCount = function() {
        return Object.keys($scope.selectedExamsMap).length;
    };

    $scope.getSelectedFreeCount = function() {
        return Object.values($scope.selectedExamsMap).filter(function(item) {
            return item.accessType === 'free';
        }).length;
    };

    $scope.getSelectedPremiumCount = function() {
        return Object.values($scope.selectedExamsMap).filter(function(item) {
            return item.accessType === 'premium';
        }).length;
    };

    $scope.getFreeExamsCount = function(series) {
        return series.exams.filter(function(e) {
            return e.accessType === 'free';
        }).length;
    };

    $scope.getPremiumExamsCount = function(series) {
        return series.exams.filter(function(e) {
            return e.accessType === 'premium';
        }).length;
    };

    // ===== Validation =====
    $scope.canSaveTestSeries = function() {
        return $scope.currentSeries &&
               $scope.currentSeries.name &&
               $scope.currentSeries.name.trim().length > 0 &&
               $scope.getSelectedExamsCount() > 0;
    };

    // ===== Save Test Series =====
    $scope.saveTestSeries = function() {
        if (!$scope.canSaveTestSeries()) {
            alert('Please fill in all required fields and select at least one exam.');
            return;
        }

        $scope.showLoading($scope.editMode ? 'Updating test series...' : 'Creating test series...');

        $timeout(function() {
            // Build exams array from selectedExamsMap
            var examsArray = Object.values($scope.selectedExamsMap).map(function(item) {
                return {
                    examId: item.exam.id,
                    examTitle: item.exam.title,
                    accessType: item.accessType
                };
            });

            $scope.currentSeries.exams = examsArray;

            if ($scope.editMode) {
                // Update existing series
                var index = $scope.testSeriesList.findIndex(function(s) {
                    return s.id === $scope.currentSeries.id;
                });
                if (index !== -1) {
                    $scope.currentSeries.updatedAt = new Date();
                    $scope.testSeriesList[index] = $scope.currentSeries;
                }
            } else {
                // Create new series
                $scope.currentSeries.id = $scope.testSeriesList.length + 1;
                $scope.currentSeries.createdAt = new Date();
                $scope.currentSeries.updatedAt = new Date();
                $scope.testSeriesList.push($scope.currentSeries);
            }

            $scope.hideLoading();
            $scope.closeCreateModal();

            alert($scope.editMode ? 'Test series updated successfully!' : 'Test series created successfully!');
        }, 800);
    };

    // ===== Delete Test Series =====
    $scope.deleteSeries = function(series) {
        if (confirm('Are you sure you want to delete "' + series.name + '"? This action cannot be undone.')) {
            $scope.showLoading('Deleting test series...');

            $timeout(function() {
                var index = $scope.testSeriesList.indexOf(series);
                if (index !== -1) {
                    $scope.testSeriesList.splice(index, 1);
                }
                $scope.hideLoading();
                alert('Test series deleted successfully!');
            }, 500);
        }
    };

    // ===== View Series Details =====
    $scope.viewSeriesDetails = function(series) {
        // Navigate to detail page or show detail modal
        console.log('View series details:', series);
        // TODO: Implement detail view
    };

    // ===== Loading State =====
    $scope.showLoading = function(message) {
        $scope.isLoading = true;
        $scope.loadingMessage = message || 'Loading...';
    };

    $scope.hideLoading = function() {
        $timeout(function() {
            $scope.isLoading = false;
        }, 300);
    };

    // ===== Sortable Column Functionality =====
    $scope.sortByColumn = function(column) {
        if ($scope.sortColumn === column) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortColumn = column;
            $scope.sortReverse = false;
        }

        $scope.testSeriesList.sort(function(a, b) {
            var aVal, bVal;

            switch(column) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'examCount':
                    aVal = a.exams.length;
                    bVal = b.exams.length;
                    break;
                case 'status':
                    aVal = a.status.toLowerCase();
                    bVal = b.status.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return $scope.sortReverse ? 1 : -1;
            if (aVal > bVal) return $scope.sortReverse ? -1 : 1;
            return 0;
        });
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);
