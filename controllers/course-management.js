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
    $scope.courseBundles = [
        {
            id: 1,
            title: 'Complete Science Course Bundle',
            displayKey: 'SCIENCE-COMPLETE',
            active: 1,
            modulesIncluded: ['1', '2', '4'],
            description: 'Complete Science course covering Biology, Chemistry, and Physics'
        },
        {
            id: 2,
            title: 'NEET Biology Complete Course',
            displayKey: 'NEET-BIO',
            active: 1,
            modulesIncluded: ['1', '2', '3'],
            description: 'Complete NEET Biology preparation course'
        },
        {
            id: 3,
            title: 'JEE Physics & Chemistry',
            displayKey: 'JEE-PC',
            active: 1,
            modulesIncluded: ['2', '4'],
            description: 'JEE Physics and Chemistry preparation'
        },
        {
            id: 4,
            title: 'Mathematics Foundation',
            displayKey: 'MATH-FND',
            active: 1,
            modulesIncluded: ['3'],
            description: 'Mathematics foundation course'
        }
    ];
    
    // Selected course bundle
    $scope.selectedCourseBundle = null;
    
    // Module filter for chapters tab
    $scope.selectedModuleFilter = '';
    
    // Filtered modules and chapters based on selected course bundle
    $scope.filteredModules = [];
    $scope.filteredChapters = [];
    
    // Chapters data
    $scope.chapters = [];
    
    // Available modules
    $scope.availableModules = [
        { 
            moduleKey: '1', 
            title: 'Biology', 
            selected: false, 
            isDefault: true,
            classificationLevel: 1,
            description: 'Study of living organisms and their interactions',
            subjectArea: 'Science',
            difficultyLevel: 'Beginner',
            active: 1,
            isExpanded: false
        },
        { 
            moduleKey: '2', 
            title: 'Chemistry', 
            selected: false, 
            isDefault: true,
            classificationLevel: 2,
            description: 'Study of matter, its properties, and changes',
            subjectArea: 'Science',
            difficultyLevel: 'Beginner',
            active: 1,
            isExpanded: false
        },
        { 
            moduleKey: '3', 
            title: 'Mathematics', 
            selected: false, 
            isDefault: true,
            classificationLevel: 3,
            description: 'Study of numbers, quantities, and shapes',
            subjectArea: 'Mathematics',
            difficultyLevel: 'Beginner',
            active: 1,
            isExpanded: false
        },
        { 
            moduleKey: '4', 
            title: 'Physics', 
            selected: false, 
            isDefault: true,
            classificationLevel: 4,
            description: 'Study of matter, energy, and their interactions',
            subjectArea: 'Science',
            difficultyLevel: 'Beginner',
            active: 1,
            isExpanded: false
        }
    ];
    
    // New course bundle object
    $scope.newCourseBundle = {
        title: '',
        bundleCode: '',
        displayKey: '',
        subjectArea: '',
        difficultyLevel: '',
        totalDuration: '',
        price: 0,
        description: '',
        features: '',
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
    
    // New module object
    $scope.newModule = {
        title: '',
        moduleKey: '',
        classificationLevel: '',
        description: '',
        subjectArea: '',
        difficultyLevel: 'Beginner',
        active: 1
    };
    
    // Module management variables
    $scope.editingModule = false;
    $scope.editingChapter = false;
    
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
            code: '1',
            title: 'Cell Biology',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20000, skipToNext: true, duration: 1800 },
                '2': { type: 'VIDEO', libraryId: 20001, skipToNext: true, duration: 2100 },
                '3': { type: 'VIDEO', libraryId: 20002, skipToNext: true, duration: 1950 }
            },
            createdOn: 1754809057,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809057,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Biology Chapter 1',
            isExpanded: false,
            teacher: {
                name: 'Dr. Sarah Johnson',
                photo: 'assets/img/default_user.png',
                about: 'Expert biologist with 15+ years of experience in zoology and animal behavior. PhD from Stanford University, specializing in vertebrate biology and ecosystem dynamics.',
                specialization: 'Biology & Zoology',
                experience: '15+ years',
                education: 'PhD, Stanford University',
                rating: 4.8,
                studentsCount: 1250
            }
        },
        {
            id: 101,
            moduleCode: 1,
            code: '2',
            title: 'Genetics & Evolution',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20003, skipToNext: true, duration: 2400 },
                '2': { type: 'VIDEO', libraryId: 20004, skipToNext: true, duration: 2200 },
                '3': { type: 'VIDEO', libraryId: 20005, skipToNext: true, duration: 1900 },
                '4': { type: 'VIDEO', libraryId: 20006, skipToNext: true, duration: 2100 }
            },
            createdOn: 1754809058,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809058,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Biology Chapter 2',
            isExpanded: false,
            teacher: {
                name: 'Dr. Sarah Johnson',
                photo: 'assets/img/default_user.png',
                about: 'Expert biologist with 15+ years of experience in zoology and animal behavior. PhD from Stanford University, specializing in vertebrate biology and ecosystem dynamics.',
                specialization: 'Biology & Zoology',
                experience: '15+ years',
                education: 'PhD, Stanford University',
                rating: 4.8,
                studentsCount: 1250
            }
        },
        {
            id: 102,
            moduleCode: 2,
            code: '1',
            title: 'Atomic Structure',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20007, skipToNext: true, duration: 1800 },
                '2': { type: 'VIDEO', libraryId: 20008, skipToNext: true, duration: 2000 },
                '3': { type: 'VIDEO', libraryId: 20009, skipToNext: true, duration: 1600 }
            },
            createdOn: 1754809059,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809059,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Chemistry Chapter 1',
            isExpanded: false,
            teacher: {
                name: 'Dr. Emily Rodriguez',
                photo: 'assets/img/default_user.png',
                about: 'Chemistry professor with expertise in physical chemistry and quantum mechanics. PhD from CalTech, published 30+ papers in top chemistry journals.',
                specialization: 'Chemistry & Quantum Mechanics',
                experience: '12+ years',
                education: 'PhD, CalTech',
                rating: 4.7,
                studentsCount: 980
            }
        },
        {
            id: 103,
            moduleCode: 2,
            code: '2',
            title: 'Chemical Bonding',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20010, skipToNext: true, duration: 2200 },
                '2': { type: 'VIDEO', libraryId: 20011, skipToNext: true, duration: 1900 },
                '3': { type: 'VIDEO', libraryId: 20012, skipToNext: true, duration: 2100 },
                '4': { type: 'VIDEO', libraryId: 20013, skipToNext: true, duration: 1800 }
            },
            createdOn: 1754809060,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809060,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Chemistry Chapter 2',
            isExpanded: false,
            teacher: {
                name: 'Dr. Emily Rodriguez',
                photo: 'assets/img/default_user.png',
                about: 'Chemistry professor with expertise in physical chemistry and quantum mechanics. PhD from CalTech, published 30+ papers in top chemistry journals.',
                specialization: 'Chemistry & Quantum Mechanics',
                experience: '12+ years',
                education: 'PhD, CalTech',
                rating: 4.7,
                studentsCount: 980
            }
        },
        {
            id: 104,
            moduleCode: 4,
            code: '1',
            title: 'Mechanics',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20014, skipToNext: true, duration: 2500 },
                '2': { type: 'VIDEO', libraryId: 20015, skipToNext: true, duration: 2300 },
                '3': { type: 'VIDEO', libraryId: 20016, skipToNext: true, duration: 2000 },
                '4': { type: 'VIDEO', libraryId: 20017, skipToNext: true, duration: 2200 },
                '5': { type: 'VIDEO', libraryId: 20018, skipToNext: true, duration: 1900 }
            },
            createdOn: 1754809061,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809061,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Physics Chapter 1',
            isExpanded: false,
            teacher: {
                name: 'Prof. David Thompson',
                photo: 'assets/img/default_user.png',
                about: 'Physics professor specializing in classical mechanics and quantum physics. PhD from Harvard, former researcher at CERN, published 40+ papers.',
                specialization: 'Physics & Quantum Mechanics',
                experience: '18+ years',
                education: 'PhD, Harvard',
                rating: 4.9,
                studentsCount: 1650
            }
        },
        {
            id: 105,
            moduleCode: 4,
            code: '2',
            title: 'Thermodynamics',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20019, skipToNext: true, duration: 2100 },
                '2': { type: 'VIDEO', libraryId: 20020, skipToNext: true, duration: 1900 },
                '3': { type: 'VIDEO', libraryId: 20021, skipToNext: true, duration: 2200 }
            },
            createdOn: 1754809062,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809062,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Physics Chapter 2',
            isExpanded: false,
            teacher: {
                name: 'Prof. David Thompson',
                photo: 'assets/img/default_user.png',
                about: 'Physics professor specializing in classical mechanics and quantum physics. PhD from Harvard, former researcher at CERN, published 40+ papers.',
                rating: 4.9,
                studentsCount: 1650
            }
        },
        {
            id: 106,
            moduleCode: 3,
            code: '1',
            title: 'Linear Inequalities',
            partsIncluded: {
                '1': { type: 'VIDEO', libraryId: 20022, skipToNext: true, duration: 1800 },
                '2': { type: 'VIDEO', libraryId: 20023, skipToNext: true, duration: 2000 },
                '3': { type: 'VIDEO', libraryId: 20024, skipToNext: true, duration: 1900 },
                '4': { type: 'VIDEO', libraryId: 20025, skipToNext: true, duration: 2100 }
            },
            createdOn: 1754809063,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809063,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            status: 1,
            label: 'Mathematics Chapter 1',
            isExpanded: false,
            teacher: {
                name: 'Prof. Michael Chen',
                photo: 'assets/img/default_user.png',
                about: 'Distinguished mathematics professor with expertise in algebra and calculus. Former head of Mathematics Department at MIT, published author of 50+ research papers.',
                specialization: 'Mathematics & Algebra',
                experience: '20+ years',
                education: 'PhD, MIT',
                rating: 4.9,
                studentsCount: 2100
            }
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
            
            // Set default course bundle selection after data is loaded
            $scope.selectedCourseBundle = $scope.courseBundles[0]; // Select the first one by default
            $scope.onCourseBundleChange(); // Trigger the filtering
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
        $scope.resetNewCourseBundle();
        $('#courseBundleModal').modal('show');
    };
    
    // Add new chapter
    $scope.addNewChapter = function() {
        $scope.editingChapter = false;
        $scope.resetNewChapter();
        $scope.selectedParts = [];
        $scope.filteredParts = [];
        $('#chapterModal').modal('show');
    };
    
    // Reset new course bundle form
    $scope.resetNewCourseBundle = function() {
        $scope.newCourseBundle = {
            title: '',
            bundleCode: '',
            displayKey: $scope.generateUUID(),
            subjectArea: '',
            difficultyLevel: '',
            totalDuration: '',
            price: 0,
            description: '',
            features: '',
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
    
    // Cancel chapter creation/editing
    $scope.cancelChapterCreation = function() {
        $scope.editingChapter = false;
        $scope.resetNewChapter();
        $('#chapterModal').modal('hide');
    };
    
    // Cancel course bundle creation
    $scope.cancelCourseBundleCreation = function() {
        $('#courseBundleModal').modal('hide');
        $scope.resetNewCourseBundle();
    };
    
    // Save course bundle
    $scope.saveCourseBundle = function() {
        if (!$scope.newCourseBundle.title || !$scope.newCourseBundle.bundleCode) {
            $scope.showToaster('Please fill in all required fields.', 'error');
            return;
        }
        
        // Create new course bundle object
        var newBundle = {
            id: $scope.generateUUID(),
            title: $scope.newCourseBundle.title,
            bundleCode: $scope.newCourseBundle.bundleCode,
            displayKey: $scope.newCourseBundle.displayKey,
            subjectArea: $scope.newCourseBundle.subjectArea,
            difficultyLevel: $scope.newCourseBundle.difficultyLevel,
            totalDuration: $scope.newCourseBundle.totalDuration,
            price: $scope.newCourseBundle.price,
            description: $scope.newCourseBundle.description,
            features: $scope.newCourseBundle.features,
            modulesIncluded: [],
            createdOn: Math.floor(Date.now() / 1000),
            createdBy: 'current-user-id',
            lastUpdatedOn: Math.floor(Date.now() / 1000),
            lastUpdatedBy: 'current-user-id',
            active: $scope.newCourseBundle.active
        };
        
        // Add to course bundles array
        $scope.courseBundles.push(newBundle);
        
        // Update summary data
        $scope.updateSummaryData();
        
        // Show success message
        $scope.showToaster('Course bundle created successfully!', 'success');
        
        // Close modal and reset form
        $('#courseBundleModal').modal('hide');
        $scope.resetNewCourseBundle();
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
        $scope.editingChapter = true;
        $scope.newChapter = angular.copy(chapter);
        // Convert partsIncluded object to array for easier handling
        if (chapter.partsIncluded) {
            $scope.selectedParts = Object.keys(chapter.partsIncluded).map(function(key) {
                return {
                    ...chapter.partsIncluded[key],
                    selected: true,
                    partKey: key
                };
            });
        }
        $('#chapterModal').modal('show');
    };
    
    // Save chapter
    $scope.saveChapter = function() {
        if ($scope.editingChapter) {
            // Update existing chapter
            var index = $scope.chapters.findIndex(function(c) {
                return c.id === $scope.newChapter.id;
            });
            
            if (index !== -1) {
                // Convert selected parts back to object format
                var partsIncluded = {};
                $scope.selectedParts.forEach(function(part) {
                    if (part.selected) {
                        partsIncluded[part.partKey || Object.keys(partsIncluded).length + 1] = {
                            type: part.type || 'VIDEO',
                            libraryId: part.libraryId,
                            skipToNext: part.skipToNext || true,
                            duration: part.duration || 300
                        };
                    }
                });
                
                $scope.chapters[index] = angular.copy($scope.newChapter);
                $scope.chapters[index].partsIncluded = partsIncluded;
                $scope.chapters[index].lastUpdatedOn = Math.floor(Date.now() / 1000);
                
                $scope.showToaster('Chapter updated successfully!', 'success');
            }
        } else {
            // Create new chapter
            var newChapter = angular.copy($scope.newChapter);
            newChapter.id = 1000 + $scope.chapters.length + 1;
            newChapter.createdOn = Math.floor(Date.now() / 1000);
            newChapter.createdBy = '3c4f0321-7805-4110-a8a1-18790e9e023';
            newChapter.lastUpdatedOn = Math.floor(Date.now() / 1000);
            newChapter.lastUpdatedBy = '3c4f0321-7805-4110-a8a1-18790e9e023';
            newChapter.isExpanded = false;
            
            // Convert selected parts to object format
            var partsIncluded = {};
            $scope.selectedParts.forEach(function(part, index) {
                if (part.selected) {
                    partsIncluded[index + 1] = {
                        type: part.type || 'VIDEO',
                        libraryId: part.libraryId,
                        skipToNext: part.skipToNext || true,
                        duration: part.duration || 300
                    };
                }
            });
            
            newChapter.partsIncluded = partsIncluded;
            
            // Add teacher info
            if (newChapter.teacherId) {
                var teachers = [
                    { name: 'Dr. Sarah Johnson', photo: 'assets/img/default_user.png', rating: 4.8 },
                    { name: 'Dr. Emily Rodriguez', photo: 'assets/img/default_user.png', rating: 4.7 },
                    { name: 'Prof. Michael Chen', photo: 'assets/img/default_user.png', rating: 4.9 }
                ];
                newChapter.teacher = teachers[newChapter.teacherId - 1] || teachers[0];
            }
            
            $scope.chapters.push(newChapter);
            $scope.showToaster('Chapter created successfully!', 'success');
        }
        
        $scope.cancelChapterCreation();
        $scope.loadSummaryData();
        
        // Refresh filtered chapters if a course bundle is selected
        if ($scope.selectedCourseBundle) {
            $scope.onCourseBundleChange();
        }
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
    
    // Module Management Functions
    
    // Add new module
    $scope.addNewModule = function() {
        $scope.editingModule = false;
        $scope.resetNewModule();
        $('#moduleModal').modal('show');
    };
    
    // Edit module
    $scope.editModule = function(module) {
        $scope.editingModule = true;
        $scope.newModule = angular.copy(module);
        $('#moduleModal').modal('show');
    };
    
    // View module
    $scope.viewModule = function(module) {
        console.log('Viewing module:', module);
        $scope.showToaster('Module viewer coming soon!', 'info');
    };
    
    // Delete module
    $scope.deleteModule = function(module) {
        if (confirm('Are you sure you want to delete the module "' + module.title + '"? This action cannot be undone.')) {
            var index = $scope.availableModules.findIndex(function(m) {
                return m.moduleKey === module.moduleKey;
            });
            
            if (index !== -1) {
                $scope.availableModules.splice(index, 1);
                $scope.showToaster('Module deleted successfully!', 'success');
                $scope.loadSummaryData();
            }
        }
    };
    
    // Save module
    $scope.saveModule = function() {
        if ($scope.editingModule) {
            // Update existing module
            var index = $scope.availableModules.findIndex(function(m) {
                return m.moduleKey === $scope.newModule.moduleKey;
            });
            
            if (index !== -1) {
                $scope.availableModules[index] = angular.copy($scope.newModule);
                $scope.showToaster('Module updated successfully!', 'success');
            }
        } else {
            // Create new module
            var newModule = angular.copy($scope.newModule);
            newModule.selected = false;
            newModule.isDefault = false;
            
            // Check if module key already exists
            var existingModule = $scope.availableModules.find(function(m) {
                return m.moduleKey === newModule.moduleKey;
            });
            
            if (existingModule) {
                $scope.showToaster('Module key already exists. Please choose a different key.', 'error');
                return;
            }
            
            $scope.availableModules.push(newModule);
            $scope.showToaster('Module created successfully!', 'success');
        }
        
        $scope.cancelModuleCreation();
        $scope.loadSummaryData();
    };
    
    // Cancel module creation
    $scope.cancelModuleCreation = function() {
        $scope.editingModule = false;
        $scope.resetNewModule();
        $('#moduleModal').modal('hide');
    };
    
    // Reset new module form
    $scope.resetNewModule = function() {
        $scope.newModule = {
            title: '',
            moduleKey: '',
            classificationLevel: '',
            description: '',
            subjectArea: '',
            difficultyLevel: 'Beginner',
            active: 1
        };
    };
    
    // Get chapters for a specific module
    $scope.getChaptersForModule = function(moduleKey) {
        // Use filtered chapters if a course bundle is selected, otherwise use all chapters
        var chaptersToSearch = $scope.selectedCourseBundle ? $scope.filteredChapters : $scope.chapters;
        return chaptersToSearch.filter(function(chapter) {
            return chapter.moduleCode == moduleKey;
        });
    };
    
    // Toggle module expansion
    $scope.toggleModule = function(module) {
        module.isExpanded = !module.isExpanded;
    };
    
    // Toggle chapter expansion (only one can be expanded at a time)
    $scope.toggleChapter = function(chapter) {
        // If clicking on already expanded chapter, collapse it
        if (chapter.isExpanded) {
            chapter.isExpanded = false;
        } else {
            // Collapse all other chapters first (both in main chapters array and filtered)
            $scope.chapters.forEach(function(ch) {
                ch.isExpanded = false;
            });
            // Also collapse any filtered chapters
            if ($scope.filteredChapters && $scope.filteredChapters.length > 0) {
                $scope.filteredChapters.forEach(function(ch) {
                    ch.isExpanded = false;
                });
            }
            // Then expand the clicked chapter
            chapter.isExpanded = true;
        }
    };
    
    // Calculate chapter duration
    $scope.calculateChapterDuration = function(chapter) {
        var totalSeconds = 0;
        var parts = chapter.partsIncluded;
        
        // Calculate total duration from parts
        for (var partKey in parts) {
            if (parts.hasOwnProperty(partKey)) {
                var part = parts[partKey];
                // Assuming each part has a duration in seconds
                if (part.duration) {
                    totalSeconds += part.duration;
                } else {
                    // Default duration for parts without duration (5 minutes)
                    totalSeconds += 300;
                }
            }
        }
        
        // Convert to hours and minutes
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return hours + 'h ' + minutes + 'm';
        } else {
            return minutes + 'm';
        }
    };
    
    // Toggle chapter status
    $scope.toggleChapterStatus = function(chapter) {
        chapter.status = chapter.status == 1 ? 0 : 1;
        $scope.showToaster('Chapter status updated!', 'success');
    };
    
    // Edit chapter
    $scope.editChapter = function(chapter) {
        $scope.showToaster('Edit chapter functionality coming soon!', 'info');
        // This would open a chapter editing form
    };
    
    // Video modal functionality
    $scope.selectedVideo = {};
    
    $scope.openVideoModal = function(part, chapter, partNumber) {
        $scope.selectedVideo = {
            title: $scope.getVideoTitle(part.libraryId),
            libraryId: part.libraryId,
            partNumber: partNumber,
            chapterTitle: chapter.title,
            moduleCode: chapter.moduleCode,
            type: part.type,
            skipToNext: part.skipToNext,
            videoUrl: null // This would be the actual video URL from your system
        };
        
        // Show the modal
        $('#videoModal').modal('show');
    };
    
    $scope.playNextVideo = function() {
        // Logic to play the next video in sequence
        $scope.showToaster('Playing next video...', 'info');
    };
    
    $scope.hasNextVideo = function() {
        // Check if there's a next video available
        return true; // Placeholder logic
    };
    
    $scope.addToPlaylist = function() {
        $scope.showToaster('Added to playlist!', 'success');
    };
    
    $scope.markAsCompleted = function() {
        $scope.showToaster('Marked as completed!', 'success');
        $('#videoModal').modal('hide');
    };
    
    $scope.addPartsToChapter = function(chapter) {
        $scope.showToaster('Add parts functionality coming soon!', 'info');
    };
    
    // Teacher profile functions
    $scope.viewTeacherProfile = function(teacher) {
        $scope.showToaster('Teacher profile viewer coming soon!', 'info');
        // This would open a detailed teacher profile modal
    };
    
    $scope.contactTeacher = function(teacher) {
        $scope.showToaster('Contact form for ' + teacher.name + ' coming soon!', 'info');
        // This would open a contact form modal
    };
    
    // Handle module filter change for chapters tab
    $scope.onModuleFilterChange = function() {
        // This function will be called when the module filter changes
        // The actual filtering is done in getFilteredChaptersForDisplay()
    };
    
    // Get chapters for display based on both course bundle and module filter
    $scope.getFilteredChaptersForDisplay = function() {
        var chaptersToFilter = $scope.selectedCourseBundle ? $scope.filteredChapters : $scope.chapters;
        
        if (!$scope.selectedModuleFilter) {
            return chaptersToFilter; // Show all chapters if no module filter
        }
        
        return chaptersToFilter.filter(function(chapter) {
            return chapter.moduleCode.toString() === $scope.selectedModuleFilter;
        });
    };
    
    // Handle course bundle selection change
    $scope.onCourseBundleChange = function() {
        console.log('Course bundle changed to:', $scope.selectedCourseBundle);
        console.log('Available modules:', $scope.availableModules);
        console.log('Available chapters:', $scope.chapters);
        
        if ($scope.selectedCourseBundle) {
            console.log('Selected bundle modulesIncluded:', $scope.selectedCourseBundle.modulesIncluded);
            
            // Filter modules based on selected course bundle
            $scope.filteredModules = $scope.availableModules.filter(function(module) {
                var isIncluded = $scope.selectedCourseBundle.modulesIncluded.some(function(bundleModule) {
                    return bundleModule.moduleKey === module.moduleKey;
                });
                console.log('Module', module.moduleKey, 'included?', isIncluded);
                return isIncluded;
            });
            
            // Filter chapters based on selected course bundle modules
            $scope.filteredChapters = $scope.chapters.filter(function(chapter) {
                var isIncluded = $scope.selectedCourseBundle.modulesIncluded.some(function(bundleModule) {
                    return bundleModule.moduleKey === chapter.moduleCode.toString();
                });
                console.log('Chapter', chapter.moduleCode, 'included?', isIncluded);
                return isIncluded;
            });
            
            console.log('Filtered modules:', $scope.filteredModules);
            console.log('Filtered chapters:', $scope.filteredChapters);
            
            // Update summary data
            $scope.updateSummaryData();
        } else {
            // Reset to show all modules and chapters
            $scope.filteredModules = [];
            $scope.filteredChapters = [];
            $scope.selectedModuleFilter = ''; // Reset module filter
            $scope.summaryTileData = {
                totalCourses: 0,
                totalModules: 0,
                totalChapters: 0,
                totalParts: 0,
                totalActive: 0
            };
        }
    };
    
    // Update summary data based on filtered content
    $scope.updateSummaryData = function() {
        if ($scope.selectedCourseBundle) {
            $scope.summaryTileData.totalCourses = 1; // Selected course bundle
            $scope.summaryTileData.totalModules = $scope.filteredModules.length;
            $scope.summaryTileData.totalChapters = $scope.filteredChapters.length;
            
            var totalParts = 0;
            $scope.filteredChapters.forEach(function(chapter) {
                totalParts += Object.keys(chapter.partsIncluded).length;
            });
            $scope.summaryTileData.totalParts = totalParts;
            
            var activeChapters = $scope.filteredChapters.filter(function(chapter) {
                return chapter.status == 1;
            });
            $scope.summaryTileData.totalActive = activeChapters.length;
        }
    };
    
    // Add Math functions to scope for star rating calculations
    $scope.Math = Math;
    
    // Get star class for rating display
    $scope.getStarClass = function(rating, starIndex) {
        if (starIndex < Math.floor(rating)) {
            return 'fa-star'; // Filled star
        } else if (starIndex === Math.floor(rating) && rating % 1 !== 0) {
            return 'fa-star-half-o'; // Half-filled star
        } else {
            return 'fa-star-o'; // Empty star
        }
    };
    
    // Initialize controller
    $scope.init();
    
    // Initialize Select2 for course bundle dropdown
    $timeout(function() {
        if (typeof $.fn.select2 !== 'undefined') {
            $('#courseBundleSelect').select2({
                placeholder: '-- Select Course Bundle --',
                allowClear: true,
                width: '100%'
            });
        }
    }, 100);
    
    // Enhanced dropdown functions
    $scope.selectCourseBundle = function(bundle) {
        $scope.selectedCourseBundle = bundle;
        $scope.onCourseBundleChange();
    };
    
    $scope.clearCourseBundleSelection = function() {
        $scope.selectedCourseBundle = null;
        $scope.onCourseBundleChange();
    };
});
