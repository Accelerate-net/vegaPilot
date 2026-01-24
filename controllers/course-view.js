// Course View Controller - Handles course content navigation and display
var courseViewApp = angular.module('courseViewApp', []);

courseViewApp.controller('courseViewController', ['$scope', '$timeout', '$http', function($scope, $timeout, $http) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);


    // ===== API Configuration =====
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/course';

    // Get token from localStorage
    $scope.getAuthToken = function() {
        var token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');
        if (!token) {
            console.warn('No auth token found. Using default token for development.');
            localStorage.setItem('authToken', token);
        }
        return token;
    };

    // Loading state
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    $scope.showLoading = function(message) {
        $scope.isLoading = true;
        $scope.loadingMessage = message || 'Loading...';
    };

    $scope.hideLoading = function() {
        $scope.isLoading = false;
    };

    // Format duration from seconds to MM:SS or HH:MM:SS
    $scope.formatDuration = function(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;

        if (hours > 0) {
            return hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (secs < 10 ? '0' : '') + secs;
        } else {
            return minutes + ':' + (secs < 10 ? '0' : '') + secs;
        }
    };

    // ===== Initialize Scope Variables =====
    $scope.courseData = {};
    $scope.moduleData = {};
    $scope.chapterData = {};
    $scope.selectedPart = null;
    $scope.selectedPartId = 0;
    $scope.profileData = {};
    $scope.availableModules = [];
    $scope.availableChapters = [];
    $scope.availableSegments = [];
    $scope.selectedModuleId = '1';
    $scope.selectedChapterId = '1';
    $scope.selectedSegmentId = '1';
    $scope.bundleId = null;
    $scope.segmentId = null;
    $scope.courseBundleMetadata = null; // Store full metadata from API

    // ===== Course Database =====
    $scope.coursesDatabase = {
        'CR004': {
            code: 'CR004',
            title: 'IAT 2026 – Exclusive 1 Year Course',
            category: 'Science',
            description: 'Comprehensive preparation for IISER Aptitude Test 2026',
            instructor: 'Expert Faculty Team',
            rating: '4.9',
            totalStudents: 450,
            modules: {
                '1': {
                    id: '1',
                    name: 'Biology',
                    description: 'Comprehensive Biology curriculum covering all topics for IAT',
                    totalChapters: 12,
                    totalDuration: '45h 30m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'Cell Biology Fundamentals',
                            description: 'Introduction to cell structure and function'
                        },
                        '2': {
                            id: '2',
                            name: 'Molecular Biology',
                            description: 'DNA, RNA, and protein synthesis mechanisms'
                        },
                        '3': {
                            id: '3',
                            name: 'Genetics and Evolution',
                            description: 'Principles of heredity and evolutionary biology'
                        }
                    }
                },
                '2': {
                    id: '2',
                    name: 'Chemistry',
                    description: 'In-depth Chemistry preparation for competitive exams',
                    totalChapters: 15,
                    totalDuration: '52h 15m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'Organic Chemistry Basics',
                            description: 'Introduction to organic compounds and reactions'
                        },
                        '2': {
                            id: '2',
                            name: 'Physical Chemistry',
                            description: 'Thermodynamics and chemical kinetics'
                        }
                    }
                },
                '3': {
                    id: '3',
                    name: 'Physics',
                    description: 'Advanced Physics concepts and problem-solving',
                    totalChapters: 14,
                    totalDuration: '48h 45m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'Classical Mechanics',
                            description: 'Newtons laws and motion analysis'
                        },
                        '2': {
                            id: '2',
                            name: 'Electromagnetism',
                            description: 'Electric and magnetic fields and forces'
                        }
                    }
                },
                '4': {
                    id: '4',
                    name: 'Mathematics',
                    description: 'Mathematical concepts essential for science',
                    totalChapters: 16,
                    totalDuration: '55h 20m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'Calculus Fundamentals',
                            description: 'Differentiation and integration basics'
                        },
                        '2': {
                            id: '2',
                            name: 'Linear Algebra',
                            description: 'Vectors, matrices, and transformations'
                        }
                    }
                }
            }
        },
        'CR001': {
            code: 'CR001',
            title: 'Advanced Web Development Masterclass',
            category: 'Web Development',
            description: 'Master modern web development with hands-on projects',
            instructor: 'John Smith',
            rating: '4.8',
            totalStudents: 1250,
            modules: {
                '1': {
                    id: '1',
                    name: 'HTML5 & Semantic Web',
                    description: 'Modern HTML5 and semantic markup',
                    totalChapters: 4,
                    totalDuration: '3h 15m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'HTML Basics',
                            description: 'Introduction to HTML structure'
                        }
                    }
                },
                '2': {
                    id: '2',
                    name: 'CSS3 Styling & Layout',
                    description: 'Learn advanced CSS techniques and modern layout systems',
                    totalChapters: 5,
                    totalDuration: '4h 20m',
                    chapters: {
                        '1': {
                            id: '1',
                            name: 'CSS Grid Layout System',
                            description: 'Master CSS Grid for creating complex, responsive layouts'
                        }
                    }
                }
            }
        }
    };

    // ===== URL Parameter Helper =====
    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            courseCode: urlParams.get('courseCode') || 'CR001',
            moduleId: urlParams.get('module') || '1',
            chapterId: urlParams.get('chapter') || '1',
            partId: urlParams.get('part') || '0'
        };
    }

    // ===== Initialize Controller =====
    $scope.init = function() {
        const params = getUrlParams();
        const urlParams = new URLSearchParams(window.location.search);
        $scope.bundleId = urlParams.get('bundleId') || urlParams.get('id') || 70005;
        $scope.segmentId = urlParams.get('segment') || 1;

        $scope.selectedPartId = parseInt(params.partId);
        $scope.currentParams = params;
        $scope.selectedModuleId = params.moduleId;
        $scope.selectedChapterId = params.chapterId;
        $scope.selectedSegmentId = $scope.segmentId.toString();

        // Load metadata first, then use it to populate dropdowns
        $scope.loadCourseBundleMetadata();
    };

    // ===== Load Course Bundle Metadata from API =====
    $scope.loadCourseBundleMetadata = function() {
        $scope.showLoading('Loading course structure...');

        var url = $scope.apiBaseUrl + '/get-course-bundle-content.php';
        var params = { id: $scope.bundleId };

        console.log('Loading course bundle metadata from API:', url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            console.log('Course bundle metadata API response:', response.data);

            if (response.data && response.data.status === 'success' && response.data.data) {
                var metadata = response.data.data;
                $scope.courseBundleMetadata = metadata;

                // Set course data
                $scope.courseData = {
                    bundleId: metadata.bundleId,
                    displayKey: metadata.displayKey,
                    title: metadata.title,
                    syllabus: metadata.syllabus
                };

                // Build available segments
                $scope.availableSegments = metadata.content.map(function(segment) {
                    return {
                        id: segment.segment.toString(),
                        name: segment.name
                    };
                });

                // Load modules and chapters based on current segment
                $scope.updateModulesFromMetadata();
                $scope.updateChaptersFromMetadata();

                // Now load the chapter data
                $scope.loadChapterData($scope.currentParams.courseCode, $scope.selectedModuleId, $scope.selectedChapterId);
                $scope.loadProfileData();

                $scope.hideLoading();
            } else {
                console.error('API returned unsuccessful response:', response.data);
                // Fallback to old methods
                $scope.loadCourseData($scope.currentParams.courseCode);
                $scope.loadAvailableModules($scope.currentParams.courseCode);
                $scope.loadAvailableChapters($scope.currentParams.courseCode, $scope.selectedModuleId);
                $scope.loadChapterData($scope.currentParams.courseCode, $scope.selectedModuleId, $scope.selectedChapterId);
                $scope.loadProfileData();
                $scope.hideLoading();
            }
        }, function(error) {
            console.error('Error loading course bundle metadata:', error);
            // Fallback to old methods
            $scope.loadCourseData($scope.currentParams.courseCode);
            $scope.loadAvailableModules($scope.currentParams.courseCode);
            $scope.loadAvailableChapters($scope.currentParams.courseCode, $scope.selectedModuleId);
            $scope.loadChapterData($scope.currentParams.courseCode, $scope.selectedModuleId, $scope.selectedChapterId);
            $scope.loadProfileData();
            $scope.hideLoading();
        });
    };

    // ===== Update Modules from Metadata =====
    $scope.updateModulesFromMetadata = function() {
        if (!$scope.courseBundleMetadata || !$scope.courseBundleMetadata.content) {
            $scope.availableModules = [];
            return;
        }

        // Find the selected segment
        var selectedSegment = $scope.courseBundleMetadata.content.find(function(seg) {
            return seg.segment.toString() === $scope.selectedSegmentId;
        });

        if (selectedSegment && selectedSegment.modules) {
            $scope.availableModules = selectedSegment.modules.map(function(module) {
                return {
                    id: module.moduleId.toString(),
                    name: module.moduleName
                };
            });
        } else {
            $scope.availableModules = [];
        }
    };

    // ===== Update Chapters from Metadata =====
    $scope.updateChaptersFromMetadata = function() {
        if (!$scope.courseBundleMetadata || !$scope.courseBundleMetadata.content) {
            $scope.availableChapters = [];
            return;
        }

        // Find the selected segment
        var selectedSegment = $scope.courseBundleMetadata.content.find(function(seg) {
            return seg.segment.toString() === $scope.selectedSegmentId;
        });

        if (!selectedSegment) {
            $scope.availableChapters = [];
            return;
        }

        // Find the selected module
        var selectedModule = selectedSegment.modules.find(function(mod) {
            return mod.moduleId.toString() === $scope.selectedModuleId;
        });

        if (selectedModule && selectedModule.chapters) {
            $scope.availableChapters = selectedModule.chapters.map(function(chapter) {
                return {
                    id: chapter.chapterId.toString(),
                    name: chapter.title,
                    enabled: chapter.enabled
                };
            });
        } else {
            $scope.availableChapters = [];
        }
    };

    // ===== Load Course Data =====
    $scope.loadCourseData = function(courseCode) {
        $timeout(function() {
            const course = $scope.coursesDatabase[courseCode];
            if (course) {
                $scope.courseData = {
                    code: course.code,
                    title: course.title,
                    category: course.category,
                    description: course.description,
                    instructor: course.instructor,
                    rating: course.rating,
                    totalStudents: course.totalStudents
                };
            } else {
                // Fallback to default course
                $scope.courseData = {
                    code: 'CR001',
                    title: 'Advanced Web Development Masterclass',
                    category: 'Web Development',
                    description: 'Master modern web development with hands-on projects',
                    instructor: 'John Smith',
                    rating: '4.8',
                    totalStudents: 1250
                };
            }
        }, 500);
    };

    // ===== Load Available Modules =====
    $scope.loadAvailableModules = function(courseCode) {
        const course = $scope.coursesDatabase[courseCode];
        if (course && course.modules) {
            $scope.availableModules = Object.keys(course.modules).map(function(moduleId) {
                return {
                    id: moduleId,
                    name: course.modules[moduleId].name
                };
            });
        } else {
            $scope.availableModules = [];
        }
    };

    // ===== Load Available Chapters =====
    $scope.loadAvailableChapters = function(courseCode, moduleId) {
        const course = $scope.coursesDatabase[courseCode];
        if (course && course.modules[moduleId] && course.modules[moduleId].chapters) {
            $scope.availableChapters = Object.keys(course.modules[moduleId].chapters).map(function(chapterId) {
                return {
                    id: chapterId,
                    name: course.modules[moduleId].chapters[chapterId].name
                };
            });
        } else {
            $scope.availableChapters = [];
        }
    };

    // ===== Load Module Data =====
    $scope.loadModuleData = function(courseCode, moduleId) {
        $timeout(function() {
            const course = $scope.coursesDatabase[courseCode];
            if (course && course.modules[moduleId]) {
                const module = course.modules[moduleId];
                $scope.moduleData = {
                    id: module.id,
                    name: module.name,
                    description: module.description,
                    totalChapters: module.totalChapters,
                    totalDuration: module.totalDuration
                };
            } else {
                // Fallback to default module
                $scope.moduleData = {
                    id: moduleId,
                    name: 'Default Module',
                    description: 'Module content',
                    totalChapters: 5,
                    totalDuration: '4h 20m'
                };
            }
        }, 600);
    };

    // ===== Load Chapter Data with Parts from API =====
    $scope.loadChapterData = function(courseCode, moduleId, chapterId) {
        // Get bundleId from URL or use default mapping
        const urlParams = new URLSearchParams(window.location.search);
        const bundleId = urlParams.get('bundleId') || $scope.bundleId || 70000;
        const segment = urlParams.get('segment') || $scope.segmentId || 1;

        $scope.showLoading('Loading chapter content...');

        var url = $scope.apiBaseUrl + '/get-course-bundle-content.php';
        var params = {
            id: bundleId,
            segment: segment,
            module: moduleId,
            chapter: chapterId
        };

        console.log('Loading chapter data from API:', url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': $scope.getAuthToken(),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            console.log('Chapter data API response:', response.data);

            if (response.data && response.data.status === 'success' && response.data.data) {
                var apiData = response.data.data;

                // Map partsIncluded to parts array
                var parts = [];
                if (apiData.partsIncluded) {
                    Object.keys(apiData.partsIncluded).forEach(function(key) {
                        var part = apiData.partsIncluded[key];
                        parts.push({
                            id: parseInt(key),
                            title: part.title || 'Part ' + key,
                            type: part.type,
                            description: part.type === 'VIDEO' ? 'Video Lecture' : (part.type === 'QUIZ' ? 'Quiz Assessment' : 'Lesson Content'),
                            fullDescription: part.title || '',
                            duration: part.duration ? $scope.formatDuration(part.duration) : '0:00',
                            durationSeconds: part.duration || 0,
                            views: 0,
                            downloads: 0,
                            rating: 4.8,
                            progressStatus: 'not-started',
                            progressText: 'Not Started',
                            videoUrl: null,
                            libraryId: part.libraryId || null,
                            videoId: part.videoId || null,
                            quizId: part.quizId || null,
                            skipToNext: part.skipToNext !== undefined ? part.skipToNext : true,
                            sourceDirectory: part.sourceDirectory || null,
                            sourceKey: part.sourceKey || null
                        });
                    });
                }

                // Sort parts by id
                parts.sort(function(a, b) { return a.id - b.id; });

                // Get chapter name from availableChapters if available
                var chapterName = apiData.title || 'Chapter Content';
                if ($scope.availableChapters && $scope.availableChapters.length > 0) {
                    var currentChapter = $scope.availableChapters.find(function(ch) {
                        return ch.id === chapterId.toString();
                    });
                    if (currentChapter) {
                        chapterName = currentChapter.name;
                    }
                }

                $scope.chapterData = {
                    id: apiData.chapter || chapterId,
                    chapterNumber: apiData.chapterNumber || apiData.chapter,
                    code: apiData.code || '',
                    name: chapterName,
                    label: apiData.label || '',
                    description: apiData.segmentName + ' - ' + apiData.moduleName || 'Chapter description',
                    moduleName: apiData.moduleName || '',
                    segmentName: apiData.segmentName || '',
                    parts: parts,
                    partsSummary: apiData.partsSummary || '',
                    totalVideos: apiData.totalVideos || 0,
                    totalAttachments: apiData.totalAttachments || 0,
                    totalQuizzes: apiData.totalQuizzes || 0,
                    totalHours: apiData.totalHours || 0,
                    totalSeconds: apiData.totalSeconds || 0,
                    teacher: apiData.teacher || {},
                    enabled: apiData.enabled !== undefined ? apiData.enabled : true
                };

                // Store teacher data
                if (apiData.teacher) {
                    $scope.teacherData = apiData.teacher;
                }

                // Select the first part by default or the specified part
                if ($scope.chapterData.parts && $scope.chapterData.parts.length > 0) {
                    const partIndex = Math.min($scope.selectedPartId, $scope.chapterData.parts.length - 1);
                    $scope.selectPart($scope.chapterData.parts[partIndex]);
                }

                $scope.hideLoading();
            } else {
                console.error('API returned unsuccessful response:', response.data);
                // Fallback to dummy data
                $scope.loadChapterDataFallback(courseCode, moduleId, chapterId);
                $scope.hideLoading();
            }
        }, function(error) {
            console.error('Error loading chapter data:', error);
            // Fallback to dummy data
            $scope.loadChapterDataFallback(courseCode, moduleId, chapterId);
            $scope.hideLoading();
        });
    };

    // Fallback function with dummy data
    $scope.loadChapterDataFallback = function(courseCode, moduleId, chapterId) {
        $timeout(function() {
            const course = $scope.coursesDatabase[courseCode];
            let chapterName = 'Chapter Content';
            let chapterDescription = 'Chapter description';

            if (course && course.modules[moduleId] && course.modules[moduleId].chapters[chapterId]) {
                const chapter = course.modules[moduleId].chapters[chapterId];
                chapterName = chapter.name;
                chapterDescription = chapter.description;
            }

            // Generate parts based on course/module/chapter context
            let parts = [];

            if (courseCode === 'CR004' && moduleId === '1' && chapterId === '2') {
                // Biology - Molecular Biology parts
                parts = [
                    {
                        id: 0,
                        title: 'Introduction to Molecular Biology',
                        description: 'Overview of molecular biology and its importance',
                        fullDescription: 'Molecular biology is the branch of biology that concerns the molecular basis of biological activity. This lesson introduces you to the fundamental concepts of DNA, RNA, and proteins, and their roles in cellular processes.',
                        duration: '18:45',
                        views: 1450,
                        downloads: 112,
                        rating: 4.9,
                        progressStatus: 'completed',
                        progressText: 'Completed',
                        videoUrl: null
                    },
                    {
                        id: 1,
                        title: 'DNA Structure and Replication',
                        description: 'Understanding DNA structure and the replication process',
                        fullDescription: 'Learn about the double helix structure of DNA, the base pairing rules, and the semi-conservative replication mechanism. Understand the role of DNA polymerase and other enzymes in DNA replication.',
                        duration: '25:30',
                        views: 1320,
                        downloads: 98,
                        rating: 4.8,
                        progressStatus: 'in-progress',
                        progressText: 'In Progress',
                        videoUrl: null
                    },
                    {
                        id: 2,
                        title: 'RNA and Transcription',
                        description: 'The role of RNA and the transcription process',
                        fullDescription: 'Explore the different types of RNA (mRNA, tRNA, rRNA) and their functions. Learn how genetic information is transcribed from DNA to RNA, including the role of RNA polymerase and transcription factors.',
                        duration: '22:15',
                        views: 1180,
                        downloads: 85,
                        rating: 4.7,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    },
                    {
                        id: 3,
                        title: 'Protein Synthesis and Translation',
                        description: 'How proteins are synthesized from genetic information',
                        fullDescription: 'Understand the process of translation where mRNA is decoded by ribosomes to produce proteins. Learn about the genetic code, codons, and the role of tRNA in bringing amino acids to the ribosome.',
                        duration: '28:40',
                        views: 1050,
                        downloads: 76,
                        rating: 4.9,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    },
                    {
                        id: 4,
                        title: 'Gene Expression and Regulation',
                        description: 'Mechanisms of gene expression control',
                        fullDescription: 'Study how gene expression is regulated at transcriptional and post-transcriptional levels. Learn about promoters, enhancers, silencers, and epigenetic modifications that control when and how genes are expressed.',
                        duration: '24:20',
                        views: 980,
                        downloads: 68,
                        rating: 4.8,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    }
                ];
            } else {
                // Default parts for other courses/chapters
                parts = [
                    {
                        id: 0,
                        title: 'Introduction to Topic',
                        description: 'Understanding the basics of the topic',
                        fullDescription: 'This lesson introduces you to the fundamental concepts. You\'ll learn the basic principles and build a strong foundation for advanced topics.',
                        duration: '15:30',
                        views: 1250,
                        downloads: 89,
                        rating: 4.9,
                        progressStatus: 'completed',
                        progressText: 'Completed',
                        videoUrl: null
                    },
                    {
                        id: 1,
                        title: 'Core Concepts',
                        description: 'Deep dive into core concepts',
                        fullDescription: 'Learn the essential concepts and principles. This lesson covers the theoretical foundations and practical applications.',
                        duration: '22:15',
                        views: 980,
                        downloads: 67,
                        rating: 4.7,
                        progressStatus: 'in-progress',
                        progressText: 'In Progress',
                        videoUrl: null
                    },
                    {
                        id: 2,
                        title: 'Advanced Techniques',
                        description: 'Master advanced techniques and methods',
                        fullDescription: 'Master advanced techniques with practical examples. Learn how to apply these concepts to real-world scenarios.',
                        duration: '28:45',
                        views: 850,
                        downloads: 54,
                        rating: 4.8,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    },
                    {
                        id: 3,
                        title: 'Practical Applications',
                        description: 'Apply your knowledge to practical scenarios',
                        fullDescription: 'Learn how to apply the concepts to solve real problems. This lesson includes hands-on examples and case studies.',
                        duration: '35:20',
                        views: 720,
                        downloads: 43,
                        rating: 4.6,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    },
                    {
                        id: 4,
                        title: 'Summary and Review',
                        description: 'Comprehensive review of all topics covered',
                        fullDescription: 'Review all the key concepts and prepare for assessments. This lesson consolidates your learning and highlights important points.',
                        duration: '18:30',
                        views: 650,
                        downloads: 38,
                        rating: 4.9,
                        progressStatus: 'not-started',
                        progressText: 'Not Started',
                        videoUrl: null
                    }
                ];
            }

            $scope.chapterData = {
                id: chapterId,
                name: chapterName,
                description: chapterDescription,
                parts: parts
            };

            // Select the first part by default or the specified part
            $scope.selectPart($scope.chapterData.parts[$scope.selectedPartId]);
        }, 700);
    };

    // ===== Load Profile Data =====
    $scope.loadProfileData = function() {
        $scope.profileData = {
            name: 'John Doe',
            email: 'john.doe@example.com'
        };
    };

    // ===== Select Part =====
    $scope.selectPart = function(part) {
        $scope.selectedPart = part;
        $scope.selectedPartId = part.id;

        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('part', part.id);
        window.history.pushState({}, '', url);

        // Show toaster
        $scope.showToasterMessage('Now playing: ' + part.title);

        // Update progress if needed
        if (part.progressStatus === 'not-started') {
            part.progressStatus = 'in-progress';
            part.progressText = 'In Progress';
        }
    };

    // ===== Show Toaster Message =====
    $scope.showToasterMessage = function(message) {
        console.log('Toaster:', message);
    };

    // ===== Navigation Functions =====
    $scope.goToCourse = function() {
        window.location.href = 'catalog.html';
    };

    $scope.goToModule = function() {
        window.location.href = 'preview-course.html?courseCode=' + $scope.courseData.code;
    };

    // ===== Previous/Next Part Navigation =====
    $scope.previousPart = function() {
        if ($scope.hasPreviousPart()) {
            const currentIndex = $scope.chapterData.parts.findIndex(p => p.id === $scope.selectedPartId);
            if (currentIndex > 0) {
                $scope.selectPart($scope.chapterData.parts[currentIndex - 1]);
                scrollToTop();
            }
        }
    };

    $scope.nextPart = function() {
        if ($scope.hasNextPart()) {
            const currentIndex = $scope.chapterData.parts.findIndex(p => p.id === $scope.selectedPartId);
            if (currentIndex < $scope.chapterData.parts.length - 1) {
                $scope.selectPart($scope.chapterData.parts[currentIndex + 1]);
                scrollToTop();
            }
        }
    };

    $scope.hasPreviousPart = function() {
        if (!$scope.chapterData.parts || $scope.chapterData.parts.length === 0) return false;
        const currentIndex = $scope.chapterData.parts.findIndex(p => p.id === $scope.selectedPartId);
        return currentIndex > 0;
    };

    $scope.hasNextPart = function() {
        if (!$scope.chapterData.parts || $scope.chapterData.parts.length === 0) return false;
        const currentIndex = $scope.chapterData.parts.findIndex(p => p.id === $scope.selectedPartId);
        return currentIndex < $scope.chapterData.parts.length - 1;
    };

    // ===== Segment Change Handler =====
    $scope.onSegmentChange = function() {
        // Update available modules for the selected segment
        if ($scope.courseBundleMetadata) {
            $scope.updateModulesFromMetadata();
        }

        // Select the first module of the new segment
        if ($scope.availableModules.length > 0) {
            $scope.selectedModuleId = $scope.availableModules[0].id;
            // Update chapters for the first module
            $scope.updateChaptersFromMetadata();
        }

        // Select the first chapter
        if ($scope.availableChapters.length > 0) {
            $scope.selectedChapterId = $scope.availableChapters[0].id;
        }

        // Navigate to the new segment/module/chapter
        $scope.navigateToModuleAndChapter();
    };

    // ===== Module Change Handler =====
    $scope.onModuleChange = function() {
        // Update available chapters for the selected module
        if ($scope.courseBundleMetadata) {
            // Use API metadata
            $scope.updateChaptersFromMetadata();
        } else {
            // Fallback to old method
            $scope.loadAvailableChapters($scope.currentParams.courseCode, $scope.selectedModuleId);
        }

        // Select the first chapter of the new module
        if ($scope.availableChapters.length > 0) {
            $scope.selectedChapterId = $scope.availableChapters[0].id;
        }

        // Navigate to the new module and chapter
        $scope.navigateToModuleAndChapter();
    };

    // ===== Chapter Change Handler =====
    $scope.onChapterChange = function() {
        // Navigate to the selected chapter
        $scope.navigateToModuleAndChapter();
    };

    // ===== Navigate to Module and Chapter =====
    $scope.navigateToModuleAndChapter = function() {
        var url = 'course-view.html?courseCode=' + $scope.currentParams.courseCode +
                  '&bundleId=' + $scope.bundleId +
                  '&segment=' + $scope.selectedSegmentId +
                  '&module=' + $scope.selectedModuleId +
                  '&chapter=' + $scope.selectedChapterId +
                  '&part=0';
        window.location.href = url;
    };

    // ===== Select Course Modal =====
    $scope.courseSearchQuery = '';
    $scope.filteredCoursesArray = [];

    // Convert coursesDatabase object to array for easier filtering
    $scope.updateFilteredCoursesArray = function() {
        if (!$scope.coursesDatabase) {
            $scope.filteredCoursesArray = [];
            return;
        }

        var coursesArray = [];
        try {
            Object.keys($scope.coursesDatabase).forEach(function(courseCode) {
                var course = $scope.coursesDatabase[courseCode];
                if (!course) {
                    return;
                }

                var moduleCount = course.modules ? Object.keys(course.modules).length : 0;
                var chapterCount = $scope.getChapterCountForCourse(course);

                coursesArray.push({
                    code: course.code,
                    title: course.title,
                    category: course.category,
                    moduleCount: moduleCount,
                    chapterCount: chapterCount,
                    modules: course.modules
                });
            });

            // Filter based on search query
            if ($scope.courseSearchQuery) {
                var query = $scope.courseSearchQuery.toLowerCase();
                $scope.filteredCoursesArray = coursesArray.filter(function(courseItem) {
                    return (courseItem.title && courseItem.title.toLowerCase().indexOf(query) !== -1) ||
                           (courseItem.code && courseItem.code.toLowerCase().indexOf(query) !== -1) ||
                           (courseItem.category && courseItem.category.toLowerCase().indexOf(query) !== -1);
                });
            } else {
                $scope.filteredCoursesArray = coursesArray;
            }
        } catch (error) {
            $scope.filteredCoursesArray = [];
        }
    };

    // Watch for changes in search query
    $scope.$watch('courseSearchQuery', function() {
        $scope.updateFilteredCoursesArray();
    });

    $scope.openSelectCourseModal = function() {
        $scope.courseSearchQuery = '';
        $scope.updateFilteredCoursesArray();

        $timeout(function() {
            // Try multiple approaches to ensure the modal opens
            var modalElement = document.getElementById('selectCourseModal');
            if (modalElement) {
                // Check if Bootstrap's modal is available
                if (typeof window.$ !== 'undefined' && window.$.fn && window.$.fn.modal) {
                    window.$('#selectCourseModal').modal('show');
                } else if (typeof window.jQuery !== 'undefined' && window.jQuery.fn && window.jQuery.fn.modal) {
                    window.jQuery('#selectCourseModal').modal('show');
                } else {
                    // Fallback: manually add the modal classes
                    modalElement.classList.add('in');
                    modalElement.style.display = 'block';
                    document.body.classList.add('modal-open');

                    // Create backdrop
                    var backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade in';
                    backdrop.id = 'courseModalBackdrop';
                    document.body.appendChild(backdrop);
                }
            }
        }, 100);
    };

    $scope.selectCourseFromModal = function(courseCode) {
        if (!courseCode) {
            return;
        }

        // Navigate to the selected course (first module, first chapter, first part)
        var course = $scope.coursesDatabase[courseCode];
        if (course && course.modules) {
            var firstModuleId = Object.keys(course.modules)[0];
            if (firstModuleId && course.modules[firstModuleId].chapters) {
                var firstChapterId = Object.keys(course.modules[firstModuleId].chapters)[0];
                var url = 'course-view.html?courseCode=' + courseCode +
                          '&module=' + firstModuleId +
                          '&chapter=' + firstChapterId +
                          '&part=0';
                window.location.href = url;
            }
        }

        // Close the modal
        var modalElement = document.getElementById('selectCourseModal');
        if (modalElement) {
            if (typeof window.$ !== 'undefined' && window.$.fn && window.$.fn.modal) {
                window.$('#selectCourseModal').modal('hide');
            } else if (typeof window.jQuery !== 'undefined' && window.jQuery.fn && window.jQuery.fn.modal) {
                window.jQuery('#selectCourseModal').modal('hide');
            } else {
                // Fallback: manually remove the modal classes
                modalElement.classList.remove('in');
                modalElement.style.display = 'none';
                document.body.classList.remove('modal-open');

                // Remove backdrop
                var backdrop = document.getElementById('courseModalBackdrop');
                if (backdrop) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }
        }
    };

    $scope.getModuleCount = function(course) {
        if (!course || !course.modules) return 0;
        return Object.keys(course.modules).length;
    };

    $scope.getChapterCountForCourse = function(course) {
        if (!course || !course.modules) return 0;
        var count = 0;
        Object.keys(course.modules).forEach(function(moduleId) {
            var module = course.modules[moduleId];
            if (module.chapters) {
                count += Object.keys(module.chapters).length;
            }
        });
        return count;
    };

    $scope.isCourseDatabaseEmpty = function() {
        return !$scope.coursesDatabase || Object.keys($scope.coursesDatabase).length === 0;
    };

    // ===== Helper Functions =====
    function scrollToTop() {
        const courseContent = document.querySelector('.course-content');
        if (courseContent) {
            courseContent.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== Initialize on Load =====
    $scope.init();

}]);
