var app = angular.module('courseManagementApp', ['ngCookies']);

app.controller('courseManagementController', function($scope, $http, $cookies, $timeout) {
    
    // Initialize scope variables
    $scope.createView = false;
    $scope.modifyCourseView = false;
    $scope.chapterView = false;
    $scope.courseFilterApplied = '';
    
    // Summary data for tiles
    $scope.summaryTileData = {
        totalCourses: 0,
        totalModules: 0,
        totalChapters: 0,
        totalParts: 0,
        totalActive: 0
    };
    
    // Course bundles data
    $scope.courseBundles = [];
    
    // Chapters data
    $scope.chapters = [];
    
    // Available modules
    $scope.availableModules = [
        { moduleKey: '1', title: 'Biology', selected: false },
        { moduleKey: '2', title: 'Chemistry', selected: false },
        { moduleKey: '3', title: 'Mathematics', selected: false },
        { moduleKey: '4', title: 'Physics', selected: false }
    ];
    
    // New course bundle object
    $scope.newCourseBundle = {
        title: '',
        displayKey: '',
        active: 1
    };
    
    // New chapter object
    $scope.newChapter = {
        moduleCode: '',
        code: '',
        title: '',
        label: '',
        status: 1,
        partsIncluded: {}
    };
    
    // Course being modified
    $scope.modifyCourseData = {};
    
    // Video parts data (from video content library)
    $scope.videoParts = [];
    
    // Filtered parts based on module selection
    $scope.filteredParts = [];
    
    // Selected parts for chapter
    $scope.selectedParts = [];
    
    // Dummy data for testing
    $scope.dummyCourseBundles = [
        {
            id: 70000,
            displayKey: 'db2350e0-e4c3-4928-a4d7-60081092235c',
            title: 'Complete Science Course Bundle',
            modulesIncluded: [
                { moduleKey: '1', title: 'Biology', chapterIds: [100, 101, 102], disabledCourseIds: [102] },
                { moduleKey: '2', title: 'Chemistry', chapterIds: [100, 101, 102], disabledCourseIds: [102] },
                { moduleKey: '3', title: 'Mathematics', chapterIds: [100, 101, 102], disabledCourseIds: [102] },
                { moduleKey: '4', title: 'Physics', chapterIds: [100, 101, 102], disabledCourseIds: [102] }
            ],
            createdOn: 1754809057,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809057,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            active: 1
        }
    ];
    
    $scope.dummyChapters = [
        {
            id: 100,
            moduleCode: 1,
            code: '4',
            title: 'Animal Kingdom',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20000, skipToNext: true },
                '2': { type: 'VIDEO', libraryId: 20001, skipToNext: true },
                '3': { type: 'VIDEO', libraryId: 20002, skipToNext: true },
                '4': { type: 'VIDEO', libraryId: 20003, skipToNext: true }
            },
            createdOn: 1754809057,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809057,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Biology Chapter 4'
        },
        {
            id: 101,
            moduleCode: 3,
            code: '5',
            title: 'Linear Inequalities',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20004, skipToNext: true },
                '2': { type: 'VIDEO', libraryId: 20005, skipToNext: true },
                '3': { type: 'VIDEO', libraryId: 20006, skipToNext: true },
                '4': { type: 'VIDEO', libraryId: 20007, skipToNext: true },
                '5': { type: 'VIDEO', libraryId: 20008, skipToNext: true },
                '6': { type: 'VIDEO', libraryId: 20009, skipToNext: true },
                '7': { type: 'VIDEO', libraryId: 20010, skipToNext: true },
                '8': { type: 'VIDEO', libraryId: 20011, skipToNext: true },
                '9': { type: 'VIDEO', libraryId: 20012, skipToNext: true },
                '10': { type: 'VIDEO', libraryId: 20013, skipToNext: true },
                '11': { type: 'VIDEO', libraryId: 20014, skipToNext: true },
                '12': { type: 'VIDEO', libraryId: 20015, skipToNext: true }
            },
            createdOn: 1754809058,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809058,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Mathematics Chapter 5'
        }
    ];
    
    $scope.dummyVideoParts = [
        {
            videoId: 20000,
            titleName: 'Introduction To Animal Kingdom',
            durationInSeconds: 2310,
            classificationLevel1: 1,
            classificationLevel2: 1,
            thumbnail: 'https://via.placeholder.com/40x30/007bff/ffffff?text=V1'
        },
        {
            videoId: 20001,
            titleName: 'Advanced Physics Concepts',
            durationInSeconds: 1845,
            classificationLevel1: 3,
            classificationLevel2: 2,
            thumbnail: 'https://via.placeholder.com/40x30/28a745/ffffff?text=V2'
        },
        {
            videoId: 20002,
            titleName: 'Chemistry Lab Safety',
            durationInSeconds: 920,
            classificationLevel1: 2,
            classificationLevel2: 1,
            thumbnail: 'https://via.placeholder.com/40x30/ffc107/ffffff?text=V3'
        },
        {
            videoId: 20003,
            titleName: 'Mathematics Problem Solving',
            durationInSeconds: 1560,
            classificationLevel1: 4,
            classificationLevel2: 3,
            thumbnail: 'https://via.placeholder.com/40x30/dc3545/ffffff?text=V4'
        },
        {
            videoId: 20004,
            titleName: 'Biology Cell Structure',
            durationInSeconds: 1340,
            classificationLevel1: 2,
            classificationLevel2: 2,
            thumbnail: 'https://via.placeholder.com/40x30/6f42c1/ffffff?text=V5'
        },
        {
            videoId: 20005,
            titleName: 'English Literature Analysis',
            durationInSeconds: 2100,
            classificationLevel1: 3,
            classificationLevel2: 4,
            thumbnail: 'https://via.placeholder.com/40x30/20c997/ffffff?text=V6'
        },
        {
            videoId: 20006,
            titleName: 'History World War II',
            durationInSeconds: 2780,
            classificationLevel1: 1,
            classificationLevel2: 1,
            thumbnail: 'https://via.placeholder.com/40x30/fd7e14/ffffff?text=V7'
        },
        {
            videoId: 20007,
            titleName: 'Geography Climate Change',
            durationInSeconds: 1650,
            classificationLevel1: 2,
            classificationLevel2: 3,
            thumbnail: 'https://via.placeholder.com/40x30/e83e8c/ffffff?text=V8'
        }
    ];
    
    // Initialize the controller
    $scope.init = function() {
        $scope.loadCourseData();
        $scope.loadSummaryData();
        $scope.generateDisplayKey();
    };
    
    // Load course data from database (using dummy data for now)
    $scope.loadCourseData = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.courseBundles = $scope.dummyCourseBundles;
            $scope.chapters = $scope.dummyChapters;
            $scope.videoParts = $scope.dummyVideoParts;
        }, 500);
    };
    
    // Load summary data for tiles
    $scope.loadSummaryData = function() {
        var totalCourses = $scope.courseBundles.length;
        var totalModules = $scope.availableModules.length;
        var totalChapters = $scope.chapters.length;
        var totalParts = $scope.videoParts.length;
        var totalActive = $scope.courseBundles.filter(function(bundle) {
            return bundle.active === 1;
        }).length;
        
        $scope.summaryTileData = {
            totalCourses: totalCourses,
            totalModules: totalModules,
            totalChapters: totalChapters,
            totalParts: totalParts,
            totalActive: totalActive
        };
    };
    
    // Generate display key for new course bundle
    $scope.generateDisplayKey = function() {
        $scope.newCourseBundle.displayKey = $scope.generateUUID();
    };
    
    // Generate UUID
    $scope.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    // Add new course bundle
    $scope.addNewCourse = function() {
        $scope.createView = true;
        $scope.modifyCourseView = false;
        $scope.chapterView = false;
        $scope.resetNewCourseBundle();
    };
    
    // Add new chapter
    $scope.addNewChapter = function() {
        $scope.createView = true;
        $scope.modifyCourseView = false;
        $scope.chapterView = true;
        $scope.resetNewChapter();
    };
    
    // Reset new course bundle form
    $scope.resetNewCourseBundle = function() {
        $scope.newCourseBundle = {
            title: '',
            displayKey: $scope.generateUUID(),
            active: 1
        };
        $scope.availableModules.forEach(function(module) {
            module.selected = false;
        });
    };
    
    // Reset new chapter form
    $scope.resetNewChapter = function() {
        $scope.newChapter = {
            moduleCode: '',
            code: '',
            title: '',
            label: '',
            status: 1,
            partsIncluded: {}
        };
        $scope.selectedParts = [];
        $scope.filteredParts = [];
    };
    
    // Filter parts by module selection
    $scope.filterPartsByModule = function() {
        if (!$scope.newChapter.moduleCode) {
            $scope.filteredParts = [];
            return;
        }
        
        $scope.filteredParts = $scope.videoParts.filter(function(part) {
            return part.classificationLevel1 == $scope.newChapter.moduleCode;
        });
        
        // Add selected property to each part
        $scope.filteredParts.forEach(function(part) {
            part.selected = false;
        });
    };
    
    // Update part selection
    $scope.updatePartSelection = function() {
        $scope.selectedParts = $scope.filteredParts.filter(function(part) {
            return part.selected;
        });
    };
    
    // Update module selection
    $scope.updateModuleSelection = function() {
        // This function can be used to update the UI when modules are selected
    };
    
    // Create course bundle
    $scope.createCourseBundle = function() {
        if (!$scope.newCourseBundle.title) {
            $scope.showToaster('Please enter a course bundle title.', 'error');
            return;
        }
        
        var selectedModules = $scope.availableModules.filter(function(module) {
            return module.selected;
        });
        
        if (selectedModules.length === 0) {
            $scope.showToaster('Please select at least one module.', 'error');
            return;
        }
        
        // Create new course bundle
        var newBundle = {
            id: 70000 + $scope.courseBundles.length + 1,
            displayKey: $scope.newCourseBundle.displayKey,
            title: $scope.newCourseBundle.title,
            modulesIncluded: selectedModules.map(function(module) {
                return {
                    moduleKey: module.moduleKey,
                    title: module.title,
                    chapterIds: [],
                    disabledCourseIds: []
                };
            }),
            createdOn: Math.floor(Date.now() / 1000),
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: Math.floor(Date.now() / 1000),
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            active: $scope.newCourseBundle.active
        };
        
        $scope.courseBundles.unshift(newBundle);
        
        $scope.showToaster('Course bundle created successfully!', 'success');
        $scope.cancelCourseCreation();
        $scope.loadSummaryData();
    };
    
    // Create chapter
    $scope.createChapter = function() {
        if (!$scope.newChapter.moduleCode || !$scope.newChapter.title || $scope.selectedParts.length === 0) {
            $scope.showToaster('Please fill in all required fields and select at least one part.', 'error');
            return;
        }
        
        // Create parts included object
        var partsIncluded = {};
        $scope.selectedParts.forEach(function(part, index) {
            partsIncluded[index + 1] = {
                type: 'VIDEO',
                libraryId: part.videoId,
                skipToNext: true
            };
        });
        
        // Create new chapter
        var newChapter = {
            id: 100 + $scope.chapters.length + 1,
            moduleCode: parseInt($scope.newChapter.moduleCode),
            code: $scope.newChapter.code,
            title: $scope.newChapter.title,
            label: $scope.newChapter.label,
            partsIncluded: partsIncluded,
            createdOn: Math.floor(Date.now() / 1000),
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: Math.floor(Date.now() / 1000),
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: $scope.newChapter.status
        };
        
        $scope.chapters.unshift(newChapter);
        
        $scope.showToaster('Chapter created successfully!', 'success');
        $scope.cancelChapterCreation();
        $scope.loadSummaryData();
    };
    
    // Cancel course creation
    $scope.cancelCourseCreation = function() {
        $scope.createView = false;
        $scope.modifyCourseView = false;
        $scope.chapterView = false;
        $scope.resetNewCourseBundle();
    };
    
    // Cancel chapter creation
    $scope.cancelChapterCreation = function() {
        $scope.createView = false;
        $scope.modifyCourseView = false;
        $scope.chapterView = false;
        $scope.resetNewChapter();
    };
    
    // Edit course bundle
    $scope.editCourseBundle = function(bundle) {
        $scope.modifyCourseData = angular.copy(bundle);
        $scope.createView = true;
        $scope.modifyCourseView = true;
        $scope.chapterView = false;
    };
    
    // View course bundle
    $scope.viewCourseBundle = function(bundle) {
        // This could open a modal or navigate to course viewer
        console.log('Viewing course bundle:', bundle);
        $scope.showToaster('Course bundle viewer coming soon!', 'info');
    };
    
    // Edit chapter
    $scope.editChapter = function(chapter) {
        // This could open a modal for editing chapters
        console.log('Editing chapter:', chapter);
        $scope.showToaster('Chapter editor coming soon!', 'info');
    };
    
    // View chapter
    $scope.viewChapter = function(chapter) {
        // This could open a modal for viewing chapters
        console.log('Viewing chapter:', chapter);
        $scope.showToaster('Chapter viewer coming soon!', 'info');
    };
    
    // Save course bundle changes
    $scope.saveCourseBundleChanges = function() {
        var index = $scope.courseBundles.findIndex(function(b) {
            return b.id === $scope.modifyCourseData.id;
        });
        
        if (index !== -1) {
            $scope.courseBundles[index] = angular.copy($scope.modifyCourseData);
            $scope.courseBundles[index].lastUpdatedOn = Math.floor(Date.now() / 1000);
            
            $scope.showToaster('Course bundle updated successfully!', 'success');
            $scope.goBackToList();
            $scope.loadSummaryData();
        } else {
            $scope.showToaster('Error updating course bundle.', 'error');
        }
    };
    
    // Go back to course list
    $scope.goBackToList = function() {
        $scope.createView = false;
        $scope.modifyCourseView = false;
        $scope.chapterView = false;
        $scope.modifyCourseData = {};
    };
    
    // Quick filter courses
    $scope.quickFilterCourses = function(filter) {
        $scope.courseFilterApplied = filter;
        
        if (filter === 'ALL') {
            $scope.courseBundles = $scope.dummyCourseBundles;
        } else if (filter === 'ACTIVE') {
            $scope.courseBundles = $scope.dummyCourseBundles.filter(function(bundle) {
                return bundle.active === 1;
            });
        } else if (filter === 'CHAPTERS') {
            // Show chapters view
            $scope.courseBundles = $scope.dummyCourseBundles;
        }
    };
    
    // Remove filter on courses
    $scope.removeFilterOnCourses = function() {
        $scope.courseFilterApplied = '';
        $scope.courseBundles = $scope.dummyCourseBundles;
    };
    
    // Get video title by library ID
    $scope.getVideoTitle = function(libraryId) {
        var video = $scope.videoParts.find(function(part) {
            return part.videoId === libraryId;
        });
        return video ? video.titleName : 'Unknown Video';
    };
    
    // Utility functions
    $scope.formatDuration = function(seconds) {
        if (!seconds) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
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
