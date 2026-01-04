var app = angular.module('courseManagementApp', ['ngCookies']);

app.controller('courseManagementController', function($scope, $http, $cookies, $timeout, $sce) {
    
    // Initialize scope variables
    $scope.createView = false;
    $scope.modifyCourseView = false;
    $scope.chapterView = false;
    $scope.courseFilterApplied = '';

    // Available syllabi
    $scope.availableSyllabi = [];
    $scope.uniqueSyllabi = [];
    $scope.selectedSyllabus = null;

    // Cached chapter display data (to prevent infinite digest loops)
    $scope.cachedFilteredChapters = [];
    $scope.cachedGroupedChapters = [];
    $scope.cachedShouldGroup = false;

    // Cached module display data (to prevent infinite digest loops)
    $scope.cachedGroupedModules = [];
    $scope.cachedModuleChaptersGrouped = {}; // Cache for module-specific chapter groups

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
        active: 1,
        syllabusId: ''
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

    // Parts editing state
    $scope.editingChapterParts = false;
    $scope.editingChapterData = null;
    $scope.originalChapterData = null;
    $scope.activeContentTab = 'modules';

    // Module selection for filtering chapters
    $scope.selectedModule = null;
    
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
                { moduleKey: '1', title: 'Biology', chapterIds: [100], disabledCourseIds: [101] },
                { moduleKey: '2', title: 'Chemistry', chapterIds: [102, 103], disabledCourseIds: [] },
                { moduleKey: '3', title: 'Mathematics', chapterIds: [106], disabledCourseIds: [] },
                { moduleKey: '4', title: 'Physics', chapterIds: [104, 105], disabledCourseIds: [] }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20000', skipToNext: true, duration: 2310 },
                '2': { type: 'MATERIAL', libraryId: 'FILE-10001', skipToNext: true, duration: 0 },
                '3': { type: 'VIDEO', libraryId: 'VID-20004', skipToNext: true, duration: 1340 },
                '4': { type: 'QUIZ', libraryId: 'TEST-30001', skipToNext: false, duration: 0 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20001', skipToNext: true, duration: 1845 },
                '2': { type: 'VIDEO', libraryId: 'VID-20002', skipToNext: true, duration: 920 },
                '3': { type: 'MATERIAL', libraryId: 'FILE-10002', skipToNext: true, duration: 0 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20002', skipToNext: true, duration: 920 },
                '2': { type: 'MATERIAL', libraryId: 'FILE-10003', skipToNext: true, duration: 0 },
                '3': { type: 'QUIZ', libraryId: 'TEST-30003', skipToNext: false, duration: 0 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20003', skipToNext: true, duration: 1560 },
                '2': { type: 'MATERIAL', libraryId: 'FILE-10001', skipToNext: true, duration: 0 },
                '3': { type: 'QUIZ', libraryId: 'TEST-30002', skipToNext: false, duration: 0 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20001', skipToNext: true, duration: 1845 },
                '2': { type: 'MATERIAL', libraryId: 'FILE-10002', skipToNext: true, duration: 0 },
                '3': { type: 'QUIZ', libraryId: 'TEST-30002', skipToNext: false, duration: 0 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20000', skipToNext: true, duration: 2310 },
                '2': { type: 'VIDEO', libraryId: 'VID-20003', skipToNext: true, duration: 1560 }
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
                '1': { type: 'VIDEO', libraryId: 'VID-20003', skipToNext: true, duration: 1560 },
                '2': { type: 'MATERIAL', libraryId: 'FILE-10003', skipToNext: true, duration: 0 },
                '3': { type: 'VIDEO', libraryId: 'VID-20004', skipToNext: true, duration: 1340 },
                '4': { type: 'QUIZ', libraryId: 'TEST-30001', skipToNext: false, duration: 0 }
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
        // VIDEO type parts
        {
            libraryId: 'VID-20000',
            title: 'Introduction To Animal Kingdom',
            duration: 2310,
            directory: '475938',
            source: '2e823451-d3e2-481e-9b55-aef338384ac4',
            brief: '',
            type: 'VIDEO',
            thumbnail: 'https://via.placeholder.com/40x30/007bff/ffffff?text=V1'
        },
        {
            libraryId: 'VID-20001',
            title: 'Advanced Physics Concepts',
            duration: 1845,
            directory: '475939',
            source: '3f924562-e4f3-582f-a766-bfg449495bd5',
            brief: '',
            type: 'VIDEO',
            thumbnail: 'https://via.placeholder.com/40x30/28a745/ffffff?text=V2'
        },
        {
            libraryId: 'VID-20002',
            title: 'Chemistry Lab Safety',
            duration: 920,
            directory: '475940',
            source: '4ga35673-f5g4-693g-b877-cgh550506ce6',
            brief: '',
            type: 'VIDEO',
            thumbnail: 'https://via.placeholder.com/40x30/ffc107/ffffff?text=V3'
        },
        {
            libraryId: 'VID-20003',
            title: 'Mathematics Problem Solving',
            duration: 1560,
            directory: '475941',
            source: '5hb46784-g6h5-7a4h-c988-dhi661617df7',
            brief: '',
            type: 'VIDEO',
            thumbnail: 'https://via.placeholder.com/40x30/dc3545/ffffff?text=V4'
        },
        {
            libraryId: 'VID-20004',
            title: 'Biology Cell Structure',
            duration: 1340,
            directory: '475942',
            source: '6ic57895-h7i6-8b5i-da99-eij772728eg8',
            brief: '',
            type: 'VIDEO',
            thumbnail: 'https://via.placeholder.com/40x30/6f42c1/ffffff?text=V5'
        },
        // MATERIAL type parts
        {
            libraryId: 'FILE-10001',
            title: 'Biology Chapter 1 - Class Notes',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/files/cr0004/biology_1_classnotes.pdf',
            brief: 'Comprehensive notes for The Living World chapter',
            type: 'MATERIAL',
            thumbnail: 'https://via.placeholder.com/40x30/17a2b8/ffffff?text=PDF'
        },
        {
            libraryId: 'FILE-10002',
            title: 'Physics Formulas Reference',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/files/cr0004/physics_formulas.pdf',
            brief: 'Quick reference for important physics formulas',
            type: 'MATERIAL',
            thumbnail: 'https://via.placeholder.com/40x30/17a2b8/ffffff?text=PDF'
        },
        {
            libraryId: 'FILE-10003',
            title: 'Chemistry Periodic Table',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/files/cr0004/periodic_table_detailed.pdf',
            brief: 'Detailed periodic table with element properties',
            type: 'MATERIAL',
            thumbnail: 'https://via.placeholder.com/40x30/17a2b8/ffffff?text=PDF'
        },
        // QUIZ type parts (from dummy data)
        {
            libraryId: 'TEST-30001',
            title: 'Biology Chapter 1 - Practice Test',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/exam/34593593485',
            brief: 'Revision Test for The Living World - 20 MCQs',
            type: 'QUIZ',
            thumbnail: 'https://via.placeholder.com/40x30/fd7e14/ffffff?text=TEST'
        },
        {
            libraryId: 'TEST-30002',
            title: 'Physics Unit Test - Kinematics',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/exam/34593593486',
            brief: 'Comprehensive test on motion and kinematics - 25 MCQs',
            type: 'QUIZ',
            thumbnail: 'https://via.placeholder.com/40x30/fd7e14/ffffff?text=TEST'
        },
        {
            libraryId: 'TEST-30003',
            title: 'Chemistry Quiz - Atomic Structure',
            duration: 0,
            directory: '',
            source: 'https://crisprtech.app/exam/34593593487',
            brief: 'Quick quiz on atomic structure and models - 15 MCQs',
            type: 'QUIZ',
            thumbnail: 'https://via.placeholder.com/40x30/fd7e14/ffffff?text=TEST'
        }
    ];
    
    // Initialize the controller
    $scope.init = function() {
        $scope.loadCourseData();
        $scope.loadSummaryData();
        $scope.generateDisplayKey();
        $scope.loadSyllabi();
    };
    
    // Load course data from database (using dummy data for now)
    $scope.loadCourseData = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.courseBundles = $scope.dummyCourseBundles;
            $scope.chapters = $scope.dummyChapters;
            $scope.videoParts = $scope.dummyVideoParts;

            // Load published quizzes from localStorage and add to videoParts
            $scope.loadQuizzesIntoParts();

            // Set default course bundle selection after data is loaded
            $scope.selectedCourseBundle = $scope.courseBundles[0]; // Select the first one by default
            $scope.onCourseBundleChange(); // Trigger the filtering

            // Initialize chapter display cache
            $scope.refreshChapterDisplay();
        }, 500);
    };

    // Load quizzes from localStorage and add to videoParts
    $scope.loadQuizzesIntoParts = function() {
        var publishedQuizzes = localStorage.getItem('publishedQuizzes');
        if (publishedQuizzes) {
            try {
                var quizzes = JSON.parse(publishedQuizzes);

                // Transform quizzes to match videoParts structure
                var quizParts = quizzes.map(function(quiz) {
                    return {
                        libraryId: quiz.id,
                        title: quiz.title,
                        duration: quiz.duration || 0, // Quiz duration in minutes
                        directory: '',
                        source: 'quiz-attempt-report.html?quiz=' + quiz.id,
                        brief: quiz.description || '',
                        type: 'QUIZ',
                        thumbnail: 'https://via.placeholder.com/40x30/6c757d/ffffff?text=Q',
                        totalQuestions: quiz.totalQuestions,
                        maximumMarks: quiz.maximumMarks,
                        quizData: quiz // Store full quiz data for reference
                    };
                });

                // Add quiz parts to videoParts
                $scope.videoParts = $scope.videoParts.concat(quizParts);

                console.log('Loaded ' + quizParts.length + ' quizzes into content library');
            } catch (e) {
                console.error('Error loading quizzes into parts:', e);
            }
        }
    };

    // Load available syllabi from SYLLABUS_FIXED.json
    $scope.loadSyllabi = function() {
        // First, load sample data as fallback
        $scope.loadSampleSyllabi();

        // Then try to load from file (will override if successful)
        $http.get('SYLLABUS_FIXED.json')
            .then(function(response) {
                if (response.data && response.data.syllabus) {
                    // Transform the fixed syllabus structure into array format for dropdown
                    // Keep segments but also create a unique list for course bundle creation
                    $scope.availableSyllabi = response.data.syllabus.map(function(segment) {
                        return {
                            id: response.data.code + '_SEGMENT' + segment.segment,
                            name: response.data.name + ' - ' + segment.name,
                            code: response.data.code,
                            segment: segment.segment,
                            segmentName: segment.name,
                            modules: segment.modules
                        };
                    });

                    // Create unique syllabi list (treat as single syllabus)
                    var syllabusMap = {};
                    $scope.availableSyllabi.forEach(function(syl) {
                        if (!syllabusMap[syl.code]) {
                            syllabusMap[syl.code] = {
                                code: syl.code,
                                name: response.data.name,
                                segments: []
                            };
                        }
                        syllabusMap[syl.code].segments.push({
                            segment: syl.segment,
                            name: syl.segmentName,
                            modules: syl.modules
                        });
                    });

                    $scope.uniqueSyllabi = Object.values(syllabusMap);
                    console.log('Loaded syllabi from file:', $scope.availableSyllabi.length + ' segments in', $scope.uniqueSyllabi.length + ' unique syllabi');
                }
            })
            .catch(function(error) {
                console.warn('Could not load SYLLABUS_FIXED.json, using sample data:', error);
                // Sample data already loaded above
            });
    };

    // Load sample syllabi data (fallback or for testing)
    $scope.loadSampleSyllabi = function() {
        $scope.availableSyllabi = [
            {
                id: 'IAT_SYLLABUS_PART1',
                name: 'IAT Syllabus - Plus One',
                code: 'IAT_SYLLABUS',
                part: 1,
                partName: 'Plus One',
                modules: [
                    {
                        id: 1,
                        moduleName: 'Biology',
                        chapters: [
                            { id: 1, chapterNumber: '1', title: 'The Living World' },
                            { id: 2, chapterNumber: '2', title: 'Biological Classification' },
                            { id: 3, chapterNumber: '3', title: 'Plant Kingdom' },
                            { id: 4, chapterNumber: '4', title: 'Animal Kingdom' },
                            { id: 5, chapterNumber: '5', title: 'Morphology of Flowering Plants' },
                            { id: 6, chapterNumber: '6', title: 'Anatomy of Flowering Plants' },
                            { id: 7, chapterNumber: '7', title: 'Structural Organisation in Animals' },
                            { id: 8, chapterNumber: '8', title: 'Cell: The Unit Life' },
                            { id: 9, chapterNumber: '9', title: 'Biomolecules' },
                            { id: 10, chapterNumber: '10', title: 'Cell Cycle and Cell Division' },
                            { id: 11, chapterNumber: '11', title: 'Photosynthesis in Higher Plants' },
                            { id: 12, chapterNumber: '12', title: 'Respiration in Plants' },
                            { id: 13, chapterNumber: '13', title: 'Plant Growth and Development' },
                            { id: 14, chapterNumber: '14', title: 'Breathing and Exchange of Gases' },
                            { id: 15, chapterNumber: '15', title: 'Body Fluids and Circulation' },
                            { id: 16, chapterNumber: '16', title: 'Excretory Products and their Elimination' },
                            { id: 17, chapterNumber: '17', title: 'Locomotion and Movement' },
                            { id: 18, chapterNumber: '18', title: 'Neural Control and Coordination' },
                            { id: 19, chapterNumber: '19', title: 'Chemical Coordination and Integration' }
                        ]
                    },
                    {
                        id: 2,
                        moduleName: 'Chemistry',
                        chapters: [
                            { id: 33, chapterNumber: '1', title: 'Some Basic Concepts of Chemistry' },
                            { id: 34, chapterNumber: '2', title: 'Structure of Atom' },
                            { id: 35, chapterNumber: '3', title: 'Classification of Elements and Periodicity in Properties' },
                            { id: 36, chapterNumber: '4', title: 'Chemical Bonding and Molecular Structure' },
                            { id: 37, chapterNumber: '5', title: 'Thermodynamics' },
                            { id: 38, chapterNumber: '6', title: 'Equilibrium' },
                            { id: 39, chapterNumber: '7', title: 'Redox reactions' },
                            { id: 40, chapterNumber: '8', title: 'Organic Chemistry - Some basic principles and techniques' },
                            { id: 41, chapterNumber: '9', title: 'Hydrocarbons' }
                        ]
                    },
                    {
                        id: 3,
                        moduleName: 'Mathematics',
                        chapters: [
                            { id: 52, chapterNumber: '1', title: 'Sets' },
                            { id: 53, chapterNumber: '2', title: 'Relations and Functions' },
                            { id: 54, chapterNumber: '3', title: 'Trigonometric Functions' },
                            { id: 55, chapterNumber: '4', title: 'Complex Numbers and Quadratic Equations' },
                            { id: 56, chapterNumber: '5', title: 'Linear Inequalities' },
                            { id: 57, chapterNumber: '6', title: 'Permutations and Combinations' },
                            { id: 58, chapterNumber: '7', title: 'Binomial Theorem' },
                            { id: 59, chapterNumber: '8', title: 'Sequences and Series' },
                            { id: 60, chapterNumber: '9', title: 'Straight Lines' },
                            { id: 61, chapterNumber: '10', title: 'Conic Sections' },
                            { id: 62, chapterNumber: '11', title: 'Introduction to Three-Dimensional Geometry' },
                            { id: 63, chapterNumber: '12', title: 'Limits and Derivatives' },
                            { id: 64, chapterNumber: '13', title: 'Statistics' },
                            { id: 65, chapterNumber: '14', title: 'Probability' },
                            { id: 66, chapterNumber: '15', title: 'Logarithm' }
                        ]
                    },
                    {
                        id: 4,
                        moduleName: 'Physics',
                        chapters: [
                            { id: 80, chapterNumber: '1', title: 'Units and Measurement' },
                            { id: 81, chapterNumber: '2', title: 'Motion in a Straight Line' },
                            { id: 82, chapterNumber: '3', title: 'Motion in a Plane' },
                            { id: 83, chapterNumber: '4', title: 'Laws of Motion' },
                            { id: 84, chapterNumber: '5', title: 'Work, Energy and Power' },
                            { id: 85, chapterNumber: '6', title: 'Systems of Particles and Rotational Motion' },
                            { id: 86, chapterNumber: '7', title: 'Gravitation' },
                            { id: 87, chapterNumber: '8', title: 'Mechanical Properties of Solids' },
                            { id: 88, chapterNumber: '9', title: 'Mechanical Properties of Fluids' },
                            { id: 89, chapterNumber: '10', title: 'Thermal Properties of Matter' },
                            { id: 90, chapterNumber: '11', title: 'Thermodynamics' },
                            { id: 91, chapterNumber: '12', title: 'Kinetic Theory' },
                            { id: 92, chapterNumber: '13', title: 'Oscillations' },
                            { id: 93, chapterNumber: '14', title: 'Waves' }
                        ]
                    }
                ]
            },
            {
                id: 'IAT_SYLLABUS_PART2',
                name: 'IAT Syllabus - Plus Two',
                code: 'IAT_SYLLABUS',
                part: 2,
                partName: 'Plus Two',
                modules: [
                    {
                        id: 1,
                        moduleName: 'Biology',
                        chapters: [
                            { id: 20, chapterNumber: '1', title: 'Sexual Reproduction in Flowering Plants' },
                            { id: 21, chapterNumber: '2', title: 'Human Reproduction' },
                            { id: 22, chapterNumber: '3', title: 'Reproductive Health' },
                            { id: 23, chapterNumber: '4', title: 'Principles of Inheritance and Variation' },
                            { id: 24, chapterNumber: '5', title: 'Molecular Basis of Inheritance' },
                            { id: 25, chapterNumber: '6', title: 'Evolution' },
                            { id: 26, chapterNumber: '7', title: 'Human Health and Disease' },
                            { id: 27, chapterNumber: '8', title: 'Microbes in Human Welfare' },
                            { id: 28, chapterNumber: '9', title: 'Biotechnology: Principles and Processes' },
                            { id: 29, chapterNumber: '10', title: 'Biotechnology and its Applications' },
                            { id: 30, chapterNumber: '11', title: 'Organisms and Populations' },
                            { id: 31, chapterNumber: '12', title: 'Ecosystem' },
                            { id: 32, chapterNumber: '13', title: 'Biodiversity and Conservation' }
                        ]
                    },
                    {
                        id: 2,
                        moduleName: 'Chemistry',
                        chapters: [
                            { id: 42, chapterNumber: '1', title: 'Solutions' },
                            { id: 43, chapterNumber: '2', title: 'Electrochemistry' },
                            { id: 44, chapterNumber: '3', title: 'Chemical Kinetics' },
                            { id: 45, chapterNumber: '4', title: 'The d and f Blocks' },
                            { id: 46, chapterNumber: '5', title: 'The Coordination Compounds' },
                            { id: 47, chapterNumber: '6', title: 'Haloalkenes and Haloarenes' },
                            { id: 48, chapterNumber: '7', title: 'Alcohols Phenols and Ethers' },
                            { id: 49, chapterNumber: '8', title: 'Aldehydes Ketones and Carboxylic Acids' },
                            { id: 50, chapterNumber: '9', title: 'Amines' },
                            { id: 51, chapterNumber: '10', title: 'Biomolecules' }
                        ]
                    },
                    {
                        id: 3,
                        moduleName: 'Mathematics',
                        chapters: [
                            { id: 67, chapterNumber: '1', title: 'Relations and Functions' },
                            { id: 68, chapterNumber: '2', title: 'Inverse Trigonometric Functions' },
                            { id: 69, chapterNumber: '3', title: 'Matrices' },
                            { id: 70, chapterNumber: '4', title: 'Determinants' },
                            { id: 71, chapterNumber: '5', title: 'Continuity and Differentiability' },
                            { id: 72, chapterNumber: '6', title: 'Application of Derivatives' },
                            { id: 73, chapterNumber: '7', title: 'Integrals' },
                            { id: 74, chapterNumber: '8', title: 'Application of Integrals' },
                            { id: 75, chapterNumber: '9', title: 'Differential Equations' },
                            { id: 76, chapterNumber: '10', title: 'Vector Algebra' },
                            { id: 77, chapterNumber: '11', title: 'Three Dimensional Geometry' },
                            { id: 78, chapterNumber: '12', title: 'Linear Programming' },
                            { id: 79, chapterNumber: '13', title: 'Probability' }
                        ]
                    },
                    {
                        id: 4,
                        moduleName: 'Physics',
                        chapters: [
                            { id: 94, chapterNumber: '1', title: 'Electric Charges and Fields' },
                            { id: 95, chapterNumber: '2', title: 'Electrostatic Potential and Capacitance' },
                            { id: 96, chapterNumber: '3', title: 'Current Electricity' },
                            { id: 97, chapterNumber: '4', title: 'Moving Charges and Magnetism' },
                            { id: 98, chapterNumber: '5', title: 'Magnetism and Matter' },
                            { id: 99, chapterNumber: '6', title: 'Electromagnetic Induction' },
                            { id: 100, chapterNumber: '7', title: 'Alternating Current' },
                            { id: 101, chapterNumber: '8', title: 'Electromagnetic Waves' },
                            { id: 102, chapterNumber: '9', title: 'Ray Optics and Optical Instruments' },
                            { id: 103, chapterNumber: '10', title: 'Wave Optics' },
                            { id: 104, chapterNumber: '11', title: 'Dual Nature of Radiation and Matter' },
                            { id: 105, chapterNumber: '12', title: 'Atoms' },
                            { id: 106, chapterNumber: '13', title: 'Nuclei' },
                            { id: 107, chapterNumber: '14', title: 'Semiconductor Electronics: Materials, Devices and Simple Circuits' }
                        ]
                    }
                ]
            }
        ];

        // Create unique syllabi list for course bundle creation
        var syllabusMap = {};
        $scope.availableSyllabi.forEach(function(syl) {
            if (!syllabusMap[syl.code]) {
                syllabusMap[syl.code] = {
                    code: syl.code,
                    name: syl.code.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim(), // Convert code to readable name
                    segments: []
                };
            }
            syllabusMap[syl.code].segments.push({
                segment: syl.part || syl.segment,
                name: syl.partName || syl.segmentName,
                modules: syl.modules
            });
        });

        $scope.uniqueSyllabi = Object.values(syllabusMap);
        // Override name for IAT Syllabus
        $scope.uniqueSyllabi.forEach(function(syl) {
            if (syl.code === 'IAT_SYLLABUS') {
                syl.name = 'IAT Syllabus';
            }
        });

        console.log('Loaded sample syllabi:', $scope.availableSyllabi.length + ' segments in', $scope.uniqueSyllabi.length + ' unique syllabi');
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
            syllabusCode: ''
        };
        $scope.selectedSyllabus = null;
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
    
    // Handle syllabus selection
    $scope.getSelectedSyllabusName = function() {
        if (!$scope.newCourseBundle || !$scope.newCourseBundle.syllabusCode) {
            return '';
        }

        var syllabus = $scope.uniqueSyllabi.find(function(syl) {
            return syl.code === $scope.newCourseBundle.syllabusCode;
        });

        return syllabus ? syllabus.name : '';
    };

    $scope.onSyllabusSelected = function() {
        if (!$scope.newCourseBundle.syllabusCode) {
            $scope.selectedSyllabus = null;
            return;
        }

        // Find the selected syllabus from unique syllabi
        $scope.selectedSyllabus = $scope.uniqueSyllabi.find(function(syllabus) {
            return syllabus.code === $scope.newCourseBundle.syllabusCode;
        });

        if ($scope.selectedSyllabus) {
            // Count total modules and chapters across all segments
            var moduleCount = 0;
            var chapterCount = 0;

            $scope.selectedSyllabus.segments.forEach(function(segment) {
                moduleCount += segment.modules.length;
                segment.modules.forEach(function(module) {
                    chapterCount += module.chapters.length;
                });
            });

            $scope.showToaster('Syllabus selected: ' + moduleCount + ' modules and ' + chapterCount + ' chapters across ' + $scope.selectedSyllabus.segments.length + ' segments', 'info');
        }
    };

    // Initialize modules and chapters from selected syllabus
    $scope.initializeFromSyllabus = function(newBundleId) {
        if (!$scope.selectedSyllabus || !$scope.selectedSyllabus.segments) {
            console.warn('No syllabus or segments found for initialization');
            return;
        }

        var timestamp = Math.floor(Date.now() / 1000);
        var userId = 'current-user-id';
        var modulesCreated = 0;
        var chaptersCreated = 0;

        // Process each segment in the syllabus
        $scope.selectedSyllabus.segments.forEach(function(segment) {
            // Process each module in this segment
            segment.modules.forEach(function(syllabusModule) {
                // Check if module already exists in availableModules
                var existingModule = $scope.availableModules.find(function(m) {
                    return m.moduleKey === syllabusModule.id.toString() || m.title === syllabusModule.moduleName;
                });

                var moduleKey;

                if (!existingModule) {
                    // Create new module with segment information
                    moduleKey = syllabusModule.id.toString();
                    var newModule = {
                        moduleKey: moduleKey,
                        title: syllabusModule.moduleName,
                        selected: false,
                        isDefault: false,
                        classificationLevel: syllabusModule.id,
                        description: 'Module from ' + $scope.selectedSyllabus.name + ' - ' + segment.name + ' - ' + syllabusModule.moduleName,
                        segment: segment.segment,
                        segmentName: segment.name,
                        subjectArea: 'General',
                        active: 1,
                        isExpanded: false
                    };

                    $scope.availableModules.push(newModule);
                    modulesCreated++;
                } else {
                    moduleKey = existingModule.moduleKey;
                }

                // Create chapters for this module
                syllabusModule.chapters.forEach(function(syllabusChapter) {
                    var newChapter = {
                        id: 100 + $scope.chapters.length + 1,
                        moduleCode: parseInt(moduleKey),
                        code: syllabusChapter.chapterNumber,
                        title: syllabusChapter.title,
                        label: syllabusModule.moduleName + ' - Chapter ' + syllabusChapter.chapterNumber + ': ' + syllabusChapter.title,
                        partsIncluded: {}, // Parts will be added separately
                        createdOn: timestamp,
                        createdBy: userId,
                        lastUpdatedOn: timestamp,
                        lastUpdatedBy: userId,
                        status: 1,
                        isExpanded: false,
                        teacher: {
                            name: 'Unassigned',
                            photo: 'assets/img/default_user.png',
                            about: 'No instructor assigned yet. Click to assign an instructor.',
                            specialization: 'To be determined',
                            experience: 'N/A',
                            education: 'N/A',
                            rating: 0,
                            studentsCount: 0
                        },
                        syllabusInfo: {
                            syllabusCode: $scope.selectedSyllabus.code,
                            segment: segment.segment,
                            segmentName: segment.name,
                            moduleId: syllabusModule.id,
                            chapterId: syllabusChapter.id,
                            chapterNumber: syllabusChapter.chapterNumber
                        }
                    };

                    $scope.chapters.push(newChapter);
                    chaptersCreated++;
                });
            });
        });

        console.log('Initialized from syllabus:', modulesCreated, 'modules,', chaptersCreated, 'chapters');
        $scope.showToaster('Successfully initialized ' + modulesCreated + ' new modules and ' + chaptersCreated + ' chapters from syllabus across ' + $scope.selectedSyllabus.segments.length + ' segments.', 'success');
    };

    // Save course bundle
    $scope.saveCourseBundle = function() {
        if (!$scope.newCourseBundle.title || !$scope.newCourseBundle.bundleCode || !$scope.newCourseBundle.syllabusCode) {
            $scope.showToaster('Please fill in all required fields.', 'error');
            return;
        }

        // Create new course bundle object
        var newBundle = {
            id: $scope.generateUUID(),
            title: $scope.newCourseBundle.title,
            bundleCode: $scope.newCourseBundle.bundleCode,
            syllabusCode: $scope.newCourseBundle.syllabusCode,
            modulesIncluded: [],
            createdOn: Math.floor(Date.now() / 1000),
            createdBy: 'current-user-id',
            lastUpdatedOn: Math.floor(Date.now() / 1000),
            lastUpdatedBy: 'current-user-id',
            active: 1
        };

        // If a syllabus was selected, initialize modules and chapters
        if ($scope.newCourseBundle.syllabusCode && $scope.selectedSyllabus && $scope.selectedSyllabus.segments) {
            console.log('Initializing from syllabus:', $scope.selectedSyllabus);
            console.log('Available modules BEFORE initialization:', $scope.availableModules.length);
            console.log('Chapters BEFORE initialization:', $scope.chapters.length);

            $scope.initializeFromSyllabus(newBundle.id);

            console.log('Available modules AFTER initialization:', $scope.availableModules.length);
            console.log('Chapters AFTER initialization:', $scope.chapters.length);

            // Add the created modules to the bundle's modulesIncluded
            // Iterate through all segments
            $scope.selectedSyllabus.segments.forEach(function(segment) {
                console.log('Processing segment:', segment.segment, segment.name, 'with', segment.modules.length, 'modules');

                segment.modules.forEach(function(syllabusModule) {
                    console.log('Looking for module:', syllabusModule.moduleName);

                    var module = $scope.availableModules.find(function(m) {
                        return m.title === syllabusModule.moduleName;
                    });

                    if (module) {
                        console.log('Found module:', module.moduleKey, module.title);

                        var chapterIds = $scope.chapters
                            .filter(function(ch) {
                                return ch.moduleCode == module.moduleKey &&
                                       ch.syllabusInfo &&
                                       ch.syllabusInfo.syllabusCode === $scope.selectedSyllabus.code;
                            })
                            .map(function(ch) { return ch.id; });

                        console.log('Found', chapterIds.length, 'chapters for module', module.title);

                        newBundle.modulesIncluded.push({
                            moduleKey: module.moduleKey,
                            title: module.title,
                            segment: segment.segment,
                            segmentName: segment.name,
                            chapterIds: chapterIds,
                            disabledCourseIds: []
                        });
                    } else {
                        console.warn('Module not found in availableModules:', syllabusModule.moduleName);
                    }
                });
            });

            console.log('Total modules added to bundle:', newBundle.modulesIncluded.length);
            console.log('modulesIncluded:', newBundle.modulesIncluded);
        }

        // Add to course bundles array
        $scope.courseBundles.push(newBundle);

        // Automatically select the newly created bundle
        $scope.selectedCourseBundle = newBundle;

        // Update summary data
        $scope.updateSummaryData();

        // Show success message
        var message = 'Course bundle created successfully!';
        if ($scope.newCourseBundle.syllabusCode) {
            message += ' Modules and chapters have been initialized from the selected syllabus.';
        }
        $scope.showToaster(message, 'success');

        // Close modal and reset form
        $('#courseBundleModal').modal('hide');
        $scope.resetNewCourseBundle();

        // Trigger filtering to show modules for the new bundle
        console.log('About to call onCourseBundleChange with new bundle:', newBundle);
        console.log('Available modules before filtering:', $scope.availableModules);
        $scope.onCourseBundleChange();

        // Refresh the summary data
        $scope.loadSummaryData();
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
    
    // Get part title by library ID
    $scope.getVideoTitle = function(libraryId) {
        var part = $scope.videoParts.find(function(p) {
            return p.libraryId === libraryId;
        });
        return part ? part.title : 'Unknown Part';
    };

    // Get part by library ID
    $scope.getPartByLibraryId = function(libraryId) {
        return $scope.videoParts.find(function(p) {
            return p.libraryId === libraryId;
        });
    };

    // ===== Module Selection and Chapter Filtering =====

    // Select a module and filter chapters
    $scope.selectModule = function(module) {
        $scope.selectedModule = module;
        $scope.activeContentTab = 'chapters';

        // Ensure we're not in editing mode
        $scope.editingChapterParts = false;

        // Collapse all expanded chapters to reset view state
        $scope.chapters.forEach(function(ch) {
            ch.isExpanded = false;
        });
        if ($scope.filteredChapters && $scope.filteredChapters.length > 0) {
            $scope.filteredChapters.forEach(function(ch) {
                ch.isExpanded = false;
            });
        }

        // Clear cached data before refreshing to prevent showing old chapters
        $scope.cachedFilteredChapters = [];
        $scope.cachedGroupedChapters = [];
        $scope.cachedShouldGroup = false;

        // Refresh chapter display with selected module filter
        $scope.refreshChapterDisplay();

        // Switch to Chapters tab using Bootstrap tab API
        $timeout(function() {
            // Force remove active from modules tab and add to chapters tab
            $('a[href="#modules"]').parent().removeClass('active');
            $('a[href="#chapters"]').parent().addClass('active');

            // Hide modules content and show chapters content
            $('#modules').removeClass('in active');
            $('#chapters').addClass('in active');

            // Trigger the tab change event
            $('a[href="#chapters"]').tab('show');
        }, 0);
    };

    // Switch to Modules tab (keep module selected)
    $scope.switchToModulesTab = function() {
        // Just switch the active tab, keep the module selected
        $scope.activeContentTab = 'modules';

        // Switch back to Modules tab
        $timeout(function() {
            $('a[href="#modules"]').tab('show');
        }, 0);
    };

    // Back to Modules - clear module selection and return to Modules tab
    $scope.backToModules = function() {
        // Clear the module selection
        $scope.selectedModule = null;
        $scope.activeContentTab = 'modules';
        $scope.selectedModuleFilter = '';

        // Clear cached data
        $scope.cachedFilteredChapters = [];
        $scope.cachedGroupedChapters = [];
        $scope.cachedShouldGroup = false;

        // Switch back to Modules tab
        $timeout(function() {
            $('a[href="#modules"]').tab('show');
        }, 0);
    };

    // Get filtered chapters for selected module
    $scope.getChaptersForSelectedModule = function() {
        if (!$scope.selectedModule) {
            return [];
        }

        var chaptersToFilter = $scope.selectedCourseBundle ? $scope.filteredChapters : $scope.chapters;

        return chaptersToFilter.filter(function(chapter) {
            return chapter.moduleCode.toString() === $scope.selectedModule.moduleKey.toString();
        });
    };

    // Check if module is selected
    $scope.isModuleSelected = function(module) {
        return $scope.selectedModule && $scope.selectedModule.moduleKey === module.moduleKey;
    };

    // Utility functions
    $scope.formatDuration = function(seconds) {
        if (!seconds) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    };

    // Get formatted parts count by type
    $scope.getPartsCountByType = function(chapter) {
        if (!chapter || !chapter.partsIncluded) {
            return 'No parts';
        }

        var videoCount = 0;
        var fileCount = 0;
        var testCount = 0;

        for (var key in chapter.partsIncluded) {
            var part = chapter.partsIncluded[key];
            var partDetails = $scope.getPartByLibraryId(part.libraryId);

            if (partDetails) {
                if (partDetails.type === 'VIDEO') {
                    videoCount++;
                } else if (partDetails.type === 'FILE') {
                    fileCount++;
                } else if (partDetails.type === 'TEST') {
                    testCount++;
                }
            }
        }

        var parts = [];
        if (videoCount > 0) parts.push(videoCount + ' Video' + (videoCount > 1 ? 's' : ''));
        if (fileCount > 0) parts.push(fileCount + ' File' + (fileCount > 1 ? 's' : ''));
        if (testCount > 0) parts.push(testCount + ' Test' + (testCount > 1 ? 's' : ''));

        return parts.length > 0 ? parts.join(' | ') : 'No parts';
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
        var chapters = chaptersToSearch.filter(function(chapter) {
            return chapter.moduleCode == moduleKey;
        });

        // Sort chapters by segment
        chapters.sort(function(a, b) {
            var segmentA = (a.syllabusInfo && a.syllabusInfo.segment) || 0;
            var segmentB = (b.syllabusInfo && b.syllabusInfo.segment) || 0;
            return segmentA - segmentB;
        });

        return chapters;
    };

    // Get chapters grouped by segment for a specific module (cached)
    $scope.getChaptersGroupedBySegmentForModule = function(moduleKey) {
        return $scope.cachedModuleChaptersGrouped[moduleKey] || [];
    };

    // Build the cache for chapters grouped by segment for a specific module
    $scope.buildModuleChaptersGroupedCache = function(moduleKey) {
        var chapters = $scope.getChaptersForModule(moduleKey);
        var segmentGroups = [];
        var segmentMap = {};

        chapters.forEach(function(chapter) {
            var segment = (chapter.syllabusInfo && chapter.syllabusInfo.segment) || 0;
            var segmentName = (chapter.syllabusInfo && chapter.syllabusInfo.segmentName) || 'Uncategorized';

            if (!segmentMap[segment]) {
                segmentMap[segment] = {
                    segment: segment,
                    name: segmentName,
                    chapters: []
                };
                segmentGroups.push(segmentMap[segment]);
            }

            segmentMap[segment].chapters.push(chapter);
        });

        // Sort segment groups by segment number
        segmentGroups.sort(function(a, b) {
            return a.segment - b.segment;
        });

        $scope.cachedModuleChaptersGrouped[moduleKey] = segmentGroups;
    };

    // Toggle module expansion
    $scope.toggleModule = function(module) {
        module.isExpanded = !module.isExpanded;

        // Build cache when module is expanded
        if (module.isExpanded) {
            $scope.buildModuleChaptersGroupedCache(module.moduleKey);
        }
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
            // Also collapse cached chapters
            if ($scope.cachedFilteredChapters && $scope.cachedFilteredChapters.length > 0) {
                $scope.cachedFilteredChapters.forEach(function(ch) {
                    ch.isExpanded = false;
                });
            }
            // Then expand the clicked chapter
            chapter.isExpanded = true;
        }
    };

    // Helper function to get the number of parts in a chapter
    $scope.getPartsCount = function(partsIncluded) {
        if (!partsIncluded) {
            return 0;
        }
        return Object.keys(partsIncluded).length;
    };

    // Helper function to check if chapter has parts
    $scope.hasPartIncluded = function(partsIncluded) {
        if (!partsIncluded) {
            return false;
        }
        return Object.keys(partsIncluded).length > 0;
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
        // Open the Parts tab for editing this chapter
        $scope.editingChapterParts = true;
        $scope.editingChapterData = angular.copy(chapter);
        // Store original data for change detection
        $scope.originalChapterData = angular.copy(chapter);
        $scope.activeContentTab = 'parts';

        // Switch to Parts tab
        $timeout(function() {
            $('a[href="#parts"]').tab('show');
        }, 100);
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
        $scope.editChapter(chapter);
    };

    // Parts editing functions
    $scope.saveChapterParts = function() {
        if (!$scope.editingChapterData) return;

        // Find the original chapter and update it
        var chapterIndex = $scope.chapters.findIndex(function(ch) {
            return ch.id === $scope.editingChapterData.id;
        });

        if (chapterIndex !== -1) {
            $scope.chapters[chapterIndex].partsIncluded = $scope.editingChapterData.partsIncluded;
            $scope.chapters[chapterIndex].lastUpdatedOn = Math.floor(Date.now() / 1000);

            // Also update in filteredChapters if exists
            if ($scope.selectedCourseBundle) {
                var filteredIndex = $scope.filteredChapters.findIndex(function(ch) {
                    return ch.id === $scope.editingChapterData.id;
                });
                if (filteredIndex !== -1) {
                    $scope.filteredChapters[filteredIndex].partsIncluded = $scope.editingChapterData.partsIncluded;
                    $scope.filteredChapters[filteredIndex].lastUpdatedOn = Math.floor(Date.now() / 1000);
                }
            }

            $scope.showToaster('Chapter parts updated successfully!', 'success');
        }

        // Close the Parts tab
        $scope.cancelChapterPartsEdit();
    };

    $scope.cancelChapterPartsEdit = function() {
        $scope.editingChapterParts = false;
        $scope.editingChapterData = null;
        $scope.originalChapterData = null;
        $scope.activeContentTab = 'chapters';

        // Switch back to Chapters tab
        $timeout(function() {
            $('a[href="#chapters"]').tab('show');
        }, 100);
    };

    // Check if chapter has changes
    $scope.hasChapterChanges = function() {
        if (!$scope.editingChapterData || !$scope.originalChapterData) {
            return false;
        }

        // Compare partsIncluded objects
        var currentParts = $scope.editingChapterData.partsIncluded || {};
        var originalParts = $scope.originalChapterData.partsIncluded || {};

        // Check if number of parts changed
        var currentKeys = Object.keys(currentParts);
        var originalKeys = Object.keys(originalParts);

        if (currentKeys.length !== originalKeys.length) {
            return true;
        }

        // Check if any part details changed
        for (var key in currentParts) {
            if (!originalParts[key]) {
                return true;
            }

            var currentPart = currentParts[key];
            var originalPart = originalParts[key];

            if (currentPart.libraryId !== originalPart.libraryId ||
                currentPart.type !== originalPart.type ||
                currentPart.skipToNext !== originalPart.skipToNext) {
                return true;
            }
        }

        return false;
    };

    $scope.togglePartSelection = function(part) {
        if ($scope.isPartSelected(part.libraryId)) {
            // Remove from partsIncluded
            var keysToRemove = [];
            for (var key in $scope.editingChapterData.partsIncluded) {
                if ($scope.editingChapterData.partsIncluded[key].libraryId === part.libraryId) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(function(key) {
                delete $scope.editingChapterData.partsIncluded[key];
            });
        } else {
            // Add to partsIncluded
            var nextPartNumber = Object.keys($scope.editingChapterData.partsIncluded).length + 1;
            $scope.editingChapterData.partsIncluded[nextPartNumber] = {
                type: part.type,
                libraryId: part.libraryId,
                skipToNext: true,
                duration: part.duration || 300
            };
        }
    };

    $scope.isPartSelected = function(libraryId) {
        if (!$scope.editingChapterData || !$scope.editingChapterData.partsIncluded) return false;

        for (var key in $scope.editingChapterData.partsIncluded) {
            if ($scope.editingChapterData.partsIncluded[key].libraryId === libraryId) {
                return true;
            }
        }
        return false;
    };

    $scope.getSelectedPartsCount = function() {
        if (!$scope.editingChapterData || !$scope.editingChapterData.partsIncluded) return 0;
        return Object.keys($scope.editingChapterData.partsIncluded).length;
    };

    $scope.removePartFromChapter = function(partNumber) {
        if ($scope.editingChapterData && $scope.editingChapterData.partsIncluded) {
            delete $scope.editingChapterData.partsIncluded[partNumber];

            // Reindex the parts
            var newPartsIncluded = {};
            var index = 1;
            for (var key in $scope.editingChapterData.partsIncluded) {
                newPartsIncluded[index] = $scope.editingChapterData.partsIncluded[key];
                index++;
            }
            $scope.editingChapterData.partsIncluded = newPartsIncluded;
        }
    };

    $scope.formatDuration = function(seconds) {
        if (!seconds) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return minutes + ':' + (secs < 10 ? '0' : '') + secs;
    };

    // Video Preview functionality
    $scope.videoPreview = {
        part: null
    };

    $scope.showVideoPreview = function(part, event) {
        // Only show preview for VIDEO type parts with a source
        if (part.type !== 'VIDEO' || !part.source) {
            return;
        }

        // Stop event propagation to prevent triggering parent clicks
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }

        // Store the part data
        $scope.videoPreview.part = part;

        // Use Bootstrap's modal method to show the modal
        // This handles backdrop, scroll lock, and animations automatically
        $('#videoPreviewModal').modal('show');
    };

    $scope.hideVideoPreview = function() {
        // Use Bootstrap's modal method to hide the modal
        $('#videoPreviewModal').modal('hide');
    };

    // Clean up part data when modal is hidden
    $('#videoPreviewModal').on('hidden.bs.modal', function () {
        $scope.$apply(function() {
            $scope.videoPreview.part = null;
        });
    });

    $scope.getBunnyEmbedUrl = function(videoId) {
        if (!videoId) return '';
        // Bunny.net iframe embed URL format
        // Using the CDN hostname from the environment or default
        var cdnHostname = 'vz-031fe1cb-299.b-cdn.net'; // This should match your Bunny.net CDN
        var libraryId = '534211'; // This should match your Bunny.net library ID

        // Return the trusted URL for the iframe with autoplay enabled
        return $sce.trustAsResourceUrl('https://iframe.mediadelivery.net/embed/' + libraryId + '/' + videoId + '?autoplay=true&preload=true');
    };

    // Drag and drop for parts reordering
    $scope.draggedIndex = null;
    $scope.dragOverIndex = null;
    $scope.partsArray = [];

    // Convert partsIncluded object to array for drag-drop
    $scope.getPartsArray = function() {
        if (!$scope.editingChapterData || !$scope.editingChapterData.partsIncluded) {
            return [];
        }

        var parts = [];
        for (var key in $scope.editingChapterData.partsIncluded) {
            if ($scope.editingChapterData.partsIncluded.hasOwnProperty(key)) {
                parts.push($scope.editingChapterData.partsIncluded[key]);
            }
        }
        return parts;
    };

    $scope.handleDragStart = function(event) {
        var element = event.target.closest('[data-index]');
        $scope.draggedIndex = parseInt(element.getAttribute('data-index'));
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', element.innerHTML);

        // Add dragging class immediately
        $timeout(function() {
            element.classList.add('dragging');
        }, 0);
    };

    $scope.handleDragEnter = function(event) {
        event.preventDefault();
        var element = event.target.closest('[data-index]');
        if (element && $scope.draggedIndex !== null) {
            var index = parseInt(element.getAttribute('data-index'));
            if (index !== $scope.draggedIndex) {
                // Remove drag-over from all elements
                document.querySelectorAll('.drag-over').forEach(function(el) {
                    el.classList.remove('drag-over');
                });

                // Add to current element
                element.classList.add('drag-over');
                $scope.dragOverIndex = index;
            }
        }
    };

    $scope.handleDragLeave = function(event) {
        var element = event.target.closest('[data-index]');
        if (element) {
            var relatedTarget = event.relatedTarget;
            // Only remove if we're truly leaving the element (not entering a child)
            if (!relatedTarget || !element.contains(relatedTarget)) {
                element.classList.remove('drag-over');
            }
        }
    };

    $scope.handleDragOver = function(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        // Continuously update drag-over state
        var element = event.target.closest('[data-index]');
        if (element && $scope.draggedIndex !== null) {
            var index = parseInt(element.getAttribute('data-index'));
            if (index !== $scope.draggedIndex && $scope.dragOverIndex !== index) {
                // Remove drag-over from all elements
                document.querySelectorAll('.drag-over').forEach(function(el) {
                    el.classList.remove('drag-over');
                });

                // Add to current element
                element.classList.add('drag-over');
                $scope.dragOverIndex = index;
            }
        }

        return false;
    };

    $scope.handleDrop = function(event) {
        event.stopPropagation();
        event.preventDefault();

        var element = event.target.closest('[data-index]');
        var dropIndex = parseInt(element.getAttribute('data-index'));

        if ($scope.draggedIndex !== null && $scope.draggedIndex !== dropIndex) {
            var parts = $scope.getPartsArray();

            // Remove from old position and insert at new position
            var draggedItem = parts[$scope.draggedIndex];
            parts.splice($scope.draggedIndex, 1);
            parts.splice(dropIndex, 0, draggedItem);

            // Rebuild partsIncluded object with new order
            var newPartsIncluded = {};
            parts.forEach(function(part, index) {
                newPartsIncluded[index + 1] = part;
            });

            $scope.editingChapterData.partsIncluded = newPartsIncluded;
            $scope.$apply();
        }

        // Clean up all drag classes
        document.querySelectorAll('.drag-over').forEach(function(el) {
            el.classList.remove('drag-over');
        });
        document.querySelectorAll('.dragging').forEach(function(el) {
            el.classList.remove('dragging');
        });

        $scope.dragOverIndex = null;
        return false;
    };

    $scope.handleDragEnd = function(event) {
        // Clean up all drag-related classes and state
        document.querySelectorAll('.drag-over').forEach(function(el) {
            el.classList.remove('drag-over');
        });
        document.querySelectorAll('.dragging').forEach(function(el) {
            el.classList.remove('dragging');
        });

        $scope.draggedIndex = null;
        $scope.dragOverIndex = null;
        $scope.$apply();
    };

    // Content library search
    $scope.contentLibrarySearch = '';

    $scope.filterContentLibrary = function(part) {
        // Only show VIDEO type parts
        if (part.type !== 'VIDEO') {
            return false;
        }

        // If editing a chapter, filter by matching module and chapter classification levels
        if ($scope.editingChapterData) {
            var moduleKey = $scope.editingChapterData.moduleKey || $scope.editingChapterData.moduleCode;
            var chapterKey = $scope.editingChapterData.code;

            // Find the module to get its classification level
            var module = $scope.availableModules.find(function(m) {
                return m.moduleKey === moduleKey;
            });

            if (module && part.classificationLevel1 !== undefined && part.classificationLevel2 !== undefined) {
                // Match Classification Level 1 = Module's classificationLevel
                // Match Classification Level 2 = Chapter's code/key
                if (part.classificationLevel1 !== module.classificationLevel ||
                    part.classificationLevel2.toString() !== chapterKey.toString()) {
                    return false;
                }
            }
        }

        // Apply search filter if present
        if (!$scope.contentLibrarySearch) {
            return true;
        }

        var searchLower = $scope.contentLibrarySearch.toLowerCase();
        var title = $scope.getVideoTitle(part.libraryId).toLowerCase();
        var type = part.type.toLowerCase();
        var libraryId = part.libraryId.toLowerCase();

        return title.indexOf(searchLower) !== -1 ||
               type.indexOf(searchLower) !== -1 ||
               libraryId.indexOf(searchLower) !== -1;
    };

    // Teacher profile functions
    $scope.selectedTeacherProfile = null;
    $scope.currentChapterForTeacherChange = null;
    $scope.availableInstructors = [];
    $scope.selectedNewInstructor = {};
    $scope.instructorSearchQuery = '';

    // Load available instructors from instructor portfolio
    $scope.loadAvailableInstructors = function() {
        console.log('Loading available instructors...');
        // In a real application, this would be an API call
        // Using the same data structure as instructor-portfolio.js

        // Use $timeout to ensure Angular digest cycle picks up the change
        $timeout(function() {
            $scope.availableInstructors = [
                {
                    id: 1,
                    name: 'Dr. Sarah Johnson',
                brief: 'Senior Mathematics Educator with 15+ years of teaching excellence',
                photo: null,
                expertSubject: 'Mathematics',
                qualifications: 'Ph.D. in Mathematics, M.Sc. in Applied Mathematics',
                experience: 15,
                bio: 'Dr. Sarah Johnson is a passionate mathematics educator with over 15 years of experience.',
                rating: 4.8,
                active: true
            },
            {
                id: 2,
                name: 'Prof. Michael Chen',
                brief: 'Award-winning Physics Professor and Research Scientist',
                photo: null,
                expertSubject: 'Physics',
                qualifications: 'Ph.D. in Quantum Physics, M.Sc. in Theoretical Physics',
                experience: 12,
                bio: 'Prof. Michael Chen brings cutting-edge physics research into the classroom.',
                rating: 4.9,
                active: true
            },
            {
                id: 3,
                name: 'Dr. Emily Rodriguez',
                brief: 'Chemistry Expert specializing in Organic and Analytical Chemistry',
                photo: null,
                expertSubject: 'Chemistry',
                qualifications: 'Ph.D. in Organic Chemistry, M.Sc. in Analytical Chemistry',
                experience: 10,
                bio: 'Dr. Emily Rodriguez combines hands-on laboratory experience with theoretical knowledge.',
                rating: 4.7,
                active: true
            },
            {
                id: 4,
                name: 'Mr. David Thompson',
                brief: 'Computer Science Instructor with industry and academic experience',
                photo: null,
                expertSubject: 'Computer Science',
                qualifications: 'M.Sc. in Computer Science, AWS Certified Solutions Architect',
                experience: 8,
                bio: 'Mr. David Thompson brings real-world software development experience.',
                rating: 4.6,
                active: true
            },
            {
                id: 5,
                name: 'Dr. Priya Sharma',
                brief: 'Biology and Life Sciences educator with research background',
                photo: null,
                expertSubject: 'Biology',
                qualifications: 'Ph.D. in Molecular Biology, M.Sc. in Biotechnology',
                experience: 11,
                bio: 'Dr. Priya Sharma is a researcher-turned-educator passionate about life sciences.',
                    rating: 4.8,
                    active: true
                }
            ];
            console.log('Loaded instructors:', $scope.availableInstructors.length);
            console.log('First instructor:', $scope.availableInstructors[0].name);
        }, 0);
    };

    // Show teacher profile modal
    $scope.showTeacherProfile = function(chapter) {
        if (chapter && chapter.teacher) {
            $scope.selectedTeacherProfile = chapter.teacher;
            $scope.currentChapterForTeacherChange = chapter;
            $('#teacherProfileModal').modal('show');
        }
    };

    // Assign instructor to chapter (when no instructor is mapped)
    $scope.assignInstructorToChapter = function(chapter) {
        if (!chapter) {
            return;
        }

        // Set the current chapter
        $scope.currentChapterForTeacherChange = chapter;

        // Load available instructors
        $scope.loadAvailableInstructors();

        // Reset selection
        $scope.selectedNewInstructor = {};
        $scope.instructorSearchQuery = '';

        // Open the change instructor modal directly
        $timeout(function() {
            $('#changeInstructorModal').modal('show');
        }, 100);
    };

    // Open change instructor modal
    $scope.openChangeInstructorModal = function() {
        // Close the teacher profile modal
        $('#teacherProfileModal').modal('hide');

        // Always load/refresh available instructors
        $scope.loadAvailableInstructors();

        // Reset selection
        $scope.selectedNewInstructor = {};
        $scope.instructorSearchQuery = '';

        // Open the change instructor modal
        $timeout(function() {
            $('#changeInstructorModal').modal('show');
        }, 300);
    };

    // Select a new instructor
    $scope.selectNewInstructor = function(instructor) {
        $scope.selectedNewInstructor = instructor;
    };

    // Confirm instructor change
    $scope.confirmInstructorChange = function() {
        if (!$scope.selectedNewInstructor.id || !$scope.currentChapterForTeacherChange) {
            return;
        }

        // Create teacher object from instructor data
        var newTeacher = {
            name: $scope.selectedNewInstructor.name,
            photo: $scope.selectedNewInstructor.photo || 'assets/img/default_user.png',
            about: $scope.selectedNewInstructor.brief,
            brief: $scope.selectedNewInstructor.brief,
            specialization: $scope.selectedNewInstructor.expertSubject,
            expertSubject: $scope.selectedNewInstructor.expertSubject,
            experience: $scope.selectedNewInstructor.experience + '+ years',
            education: $scope.selectedNewInstructor.qualifications,
            qualifications: $scope.selectedNewInstructor.qualifications,
            rating: $scope.selectedNewInstructor.rating || 4.5,
            bio: $scope.selectedNewInstructor.bio,
            studentsCount: 0
        };

        // Update the chapter's teacher in both main chapters array and filtered chapters
        var chapterId = $scope.currentChapterForTeacherChange.id;

        // Update in main chapters array
        var chapterIndex = $scope.chapters.findIndex(function(ch) {
            return ch.id === chapterId;
        });
        if (chapterIndex !== -1) {
            $scope.chapters[chapterIndex].teacher = newTeacher;
        }

        // Update in filtered chapters array if it exists
        if ($scope.filteredChapters && $scope.filteredChapters.length > 0) {
            var filteredIndex = $scope.filteredChapters.findIndex(function(ch) {
                return ch.id === chapterId;
            });
            if (filteredIndex !== -1) {
                $scope.filteredChapters[filteredIndex].teacher = newTeacher;
            }
        }

        // Update the current chapter object
        $scope.currentChapterForTeacherChange.teacher = newTeacher;

        // Refresh chapter display to reflect changes
        $scope.refreshChapterDisplay();

        // Close modal and show success message
        $('#changeInstructorModal').modal('hide');
        $scope.showToaster('Instructor changed successfully to ' + newTeacher.name, 'success');

        // Reset selection
        $scope.selectedNewInstructor = {};
        $scope.currentChapterForTeacherChange = null;
    };

    $scope.viewTeacherProfile = function(teacher) {
        $scope.showToaster('Teacher profile viewer coming soon!', 'info');
        // This would open a detailed teacher profile modal
    };

    $scope.contactTeacher = function(teacher) {
        $scope.showToaster('Contact form for ' + teacher.name + ' coming soon!', 'info');
        // This would open a contact form modal
    };
    
    // Refresh chapter display data (call this when filters change)
    $scope.refreshChapterDisplay = function() {
        var chaptersToFilter = $scope.selectedCourseBundle ? $scope.filteredChapters : $scope.chapters;

        // Apply module filter (from module selection or dropdown filter)
        var moduleFilterKey = null;
        if ($scope.selectedModule) {
            moduleFilterKey = $scope.selectedModule.moduleKey.toString();
        } else if ($scope.selectedModuleFilter) {
            moduleFilterKey = $scope.selectedModuleFilter;
        }

        if (moduleFilterKey) {
            // Filter and deduplicate by chapter ID
            var filtered = chaptersToFilter.filter(function(chapter) {
                return chapter.moduleCode.toString() === moduleFilterKey;
            });

            // Deduplicate chapters by ID
            var seen = {};
            $scope.cachedFilteredChapters = filtered.filter(function(chapter) {
                if (seen[chapter.id]) {
                    return false;
                }
                seen[chapter.id] = true;
                return true;
            });
        } else {
            // Deduplicate all chapters by ID
            var seen = {};
            $scope.cachedFilteredChapters = chaptersToFilter.filter(function(chapter) {
                if (seen[chapter.id]) {
                    return false;
                }
                seen[chapter.id] = true;
                return true;
            });
        }

        // Check if grouping is needed (use segment instead of part)
        $scope.cachedShouldGroup = $scope.cachedFilteredChapters.some(function(ch) {
            return ch.syllabusInfo && ch.syllabusInfo.segment;
        });

        // Group chapters by Segment if needed
        if ($scope.cachedShouldGroup) {
            var grouped = {};

            $scope.cachedFilteredChapters.forEach(function(chapter) {
                var segmentKey, segmentLabel;

                if (chapter.syllabusInfo && chapter.syllabusInfo.segment) {
                    segmentKey = chapter.syllabusInfo.segment;
                    segmentLabel = chapter.syllabusInfo.segmentName || ('Segment ' + segmentKey);
                } else {
                    segmentKey = 0;
                    segmentLabel = 'Uncategorized';
                }

                if (!grouped[segmentKey]) {
                    grouped[segmentKey] = {
                        part: segmentKey,  // Keep 'part' key for backward compatibility with HTML
                        label: segmentLabel,
                        chapters: []
                    };
                }

                grouped[segmentKey].chapters.push(chapter);
            });

            // Convert to array and sort by segment number
            $scope.cachedGroupedChapters = [];
            for (var key in grouped) {
                if (grouped.hasOwnProperty(key)) {
                    $scope.cachedGroupedChapters.push(grouped[key]);
                }
            }

            $scope.cachedGroupedChapters.sort(function(a, b) {
                return a.part - b.part;
            });
        }
    };

    // Handle module filter change for chapters tab
    $scope.onModuleFilterChange = function() {
        $scope.refreshChapterDisplay();
    };

    // Get chapters for display based on both course bundle and module filter
    $scope.getFilteredChaptersForDisplay = function() {
        return $scope.cachedFilteredChapters;
    };

    // Group chapters by syllabus Part
    $scope.getChaptersGroupedByPart = function() {
        return $scope.cachedGroupedChapters;
    };

    // Check if chapters should be grouped by Part
    $scope.shouldGroupByPart = function() {
        return $scope.cachedShouldGroup;
    };

    // Group modules by segment for display (cached)
    $scope.getModulesGroupedBySegment = function() {
        return $scope.cachedGroupedModules || [];
    };

    // Build the cached grouped modules
    $scope.buildGroupedModules = function() {
        var segmentGroups = [];
        var segmentMap = {};

        $scope.filteredModules.forEach(function(module) {
            var segment = module.segment || 0;
            var segmentName = module.segmentName || 'Uncategorized';

            if (!segmentMap[segment]) {
                segmentMap[segment] = {
                    segment: segment,
                    name: segmentName,
                    modules: []
                };
                segmentGroups.push(segmentMap[segment]);
            }

            segmentMap[segment].modules.push(module);
        });

        // Sort by segment number
        segmentGroups.sort(function(a, b) {
            return a.segment - b.segment;
        });

        $scope.cachedGroupedModules = segmentGroups;
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

            // Sort filtered modules by segment
            $scope.filteredModules.sort(function(a, b) {
                return (a.segment || 0) - (b.segment || 0);
            });

            // Filter chapters based on selected course bundle modules
            $scope.filteredChapters = $scope.chapters.filter(function(chapter) {
                var isIncluded = $scope.selectedCourseBundle.modulesIncluded.some(function(bundleModule) {
                    return bundleModule.moduleKey === chapter.moduleCode.toString();
                });
                console.log('Chapter', chapter.moduleCode, 'included?', isIncluded);
                return isIncluded;
            });

            // Sort filtered chapters by segment
            $scope.filteredChapters.sort(function(a, b) {
                var segmentA = (a.syllabusInfo && a.syllabusInfo.segment) || 0;
                var segmentB = (b.syllabusInfo && b.syllabusInfo.segment) || 0;
                return segmentA - segmentB;
            });

            console.log('Filtered modules:', $scope.filteredModules);
            console.log('Filtered chapters:', $scope.filteredChapters);

            // Build grouped modules cache
            $scope.buildGroupedModules();

            // Clear module chapters grouped cache
            $scope.cachedModuleChaptersGrouped = {};

            // Update summary data
            $scope.updateSummaryData();
        } else {
            // Reset to show all modules and chapters
            $scope.filteredModules = [];
            $scope.filteredChapters = [];
            $scope.cachedGroupedModules = [];
            $scope.cachedModuleChaptersGrouped = {};
            $scope.selectedModuleFilter = ''; // Reset module filter
            $scope.summaryTileData = {
                totalCourses: 0,
                totalModules: 0,
                totalChapters: 0,
                totalParts: 0,
                totalActive: 0
            };
        }

        // Refresh chapter display cache
        $scope.refreshChapterDisplay();
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

    // ===== Quiz Linking Functions =====
    $scope.quizSearchQuery = '';
    $scope.availableQuizzes = [];
    $scope.selectedQuizForLink = null;

    $scope.openLinkQuizModal = function() {
        if (!$scope.editingChapterData) {
            $scope.showToaster('Please select a chapter to add quiz', 'error');
            return;
        }

        // Load published quizzes from localStorage
        $scope.loadAvailableQuizzes();
        $('#linkQuizModal').modal('show');
    };

    $scope.loadAvailableQuizzes = function() {
        var publishedQuizzes = localStorage.getItem('publishedQuizzes');
        if (publishedQuizzes) {
            try {
                $scope.availableQuizzes = JSON.parse(publishedQuizzes);
                console.log('Loaded ' + $scope.availableQuizzes.length + ' quizzes');
            } catch (e) {
                console.error('Error loading quizzes:', e);
                $scope.availableQuizzes = [];
            }
        } else {
            $scope.availableQuizzes = [];
        }
    };

    $scope.selectQuizForLink = function(quiz) {
        $scope.selectedQuizForLink = quiz;
    };

    $scope.linkQuizToChapter = function() {
        if (!$scope.selectedQuizForLink || !$scope.editingChapterData) {
            $scope.showToaster('Please select a quiz', 'error');
            return;
        }

        // Create a new part entry for the quiz
        var quizPartId = 'QUIZ_' + $scope.selectedQuizForLink.id;
        var nextPartNumber = Object.keys($scope.editingChapterData.partsIncluded).length + 1;

        $scope.editingChapterData.partsIncluded[nextPartNumber] = {
            partNumber: nextPartNumber,
            libraryId: quizPartId,
            title: $scope.selectedQuizForLink.title,
            type: 'QUIZ',
            teacherProfile: null,
            isMandatory: true,
            skipToNext: false,
            quizData: $scope.selectedQuizForLink
        };

        $scope.showToaster('Quiz "' + $scope.selectedQuizForLink.title + '" linked successfully!', 'success');
        $scope.closeLinkQuizModal();
    };

    $scope.closeLinkQuizModal = function() {
        $scope.selectedQuizForLink = null;
        $scope.quizSearchQuery = '';
        $('#linkQuizModal').modal('hide');
    };

    $scope.filterQuizzes = function(quiz) {
        if (!$scope.quizSearchQuery) {
            return true;
        }

        var searchLower = $scope.quizSearchQuery.toLowerCase();
        var titleMatch = quiz.title && quiz.title.toLowerCase().indexOf(searchLower) !== -1;
        var descMatch = quiz.description && quiz.description.toLowerCase().indexOf(searchLower) !== -1;

        return titleMatch || descMatch;
    };

    // ===== Material Attachment Functions =====
    $scope.materialUpload = {
        title: '',
        file: null,
        fileName: '',
        brief: ''
    };

    $scope.openAttachMaterialModal = function() {
        if (!$scope.editingChapterData) {
            $scope.showToaster('Please select a chapter to add material', 'error');
            return;
        }

        // Reset form
        $scope.materialUpload = {
            title: '',
            file: null,
            fileName: '',
            brief: ''
        };

        $('#attachMaterialModal').modal('show');
    };

    $scope.handleMaterialFileSelect = function(event) {
        var file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                $scope.showToaster('Please select a PDF file', 'error');
                return;
            }

            $scope.$apply(function() {
                $scope.materialUpload.file = file;
                $scope.materialUpload.fileName = file.name;
                if (!$scope.materialUpload.title) {
                    $scope.materialUpload.title = file.name.replace('.pdf', '');
                }
            });
        }
    };

    $scope.attachMaterialToChapter = function() {
        if (!$scope.materialUpload.file || !$scope.materialUpload.title || !$scope.editingChapterData) {
            $scope.showToaster('Please provide title and select a PDF file', 'error');
            return;
        }

        // In a real application, you would upload the file to a server here
        // For now, we'll create a placeholder entry
        var materialId = 'MATERIAL_' + Date.now();
        var nextPartNumber = Object.keys($scope.editingChapterData.partsIncluded).length + 1;

        $scope.editingChapterData.partsIncluded[nextPartNumber] = {
            partNumber: nextPartNumber,
            libraryId: materialId,
            title: $scope.materialUpload.title,
            type: 'MATERIAL',
            teacherProfile: null,
            isMandatory: true,
            skipToNext: false,
            fileName: $scope.materialUpload.fileName,
            brief: $scope.materialUpload.brief || '',
            // In production, this would be the URL from the file upload
            fileUrl: 'materials/' + $scope.materialUpload.fileName
        };

        $scope.showToaster('Material "' + $scope.materialUpload.title + '" attached successfully!', 'success');
        $scope.closeAttachMaterialModal();
    };

    $scope.closeAttachMaterialModal = function() {
        $scope.materialUpload = {
            title: '',
            file: null,
            fileName: '',
            brief: ''
        };
        $('#attachMaterialModal').modal('hide');
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
        // Open the select course modal instead of clearing selection
        $scope.courseBundleSearchQuery = '';
        $('#selectCourseModal').modal('show');
    };

    // Select course bundle from modal
    $scope.selectCourseBundleFromModal = function(bundle) {
        if (!bundle) {
            return;
        }

        // Set the selected bundle
        $scope.selectedCourseBundle = bundle;

        // Trigger the change handler to load modules and chapters
        $scope.onCourseBundleChange();

        // Close the modal
        $('#selectCourseModal').modal('hide');

        // Ensure we're viewing the modules tab
        $scope.activeContentTab = 'modules';
        $scope.selectedModule = null;
        $scope.editingChapterParts = false;

        // Switch to modules tab programmatically
        $timeout(function() {
            $('a[href="#modules"]').tab('show');
        }, 100);
    };

    // Close select course modal
    $scope.closeSelectCourseModal = function() {
        $('#selectCourseModal').modal('hide');
    };

    // Get chapter count for a bundle
    $scope.getChapterCountForBundle = function(bundle) {
        if (!bundle || !bundle.modulesIncluded) {
            return 0;
        }

        var count = 0;
        bundle.modulesIncluded.forEach(function(module) {
            if (module.chapterIds) {
                count += module.chapterIds.length;
            }
        });
        return count;
    };
});
