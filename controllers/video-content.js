var app = angular.module('videoContentApp', ['ngCookies']);

app.controller('videoContentController', function ($scope, $http, $cookies, $timeout, $sce) {
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



    // Initialize scope variables
    $scope.createView = false;
    $scope.modifyVideoView = false;
    $scope.linkVideoView = false;
    $scope.currentPage = 1;
    $scope.totalPages = 1;
    $scope.maxResultsShown = 10; // Number of items per page
    $scope.videoFilterApplied = '';
    $scope.uploadProgress = 0;
    $scope.uploadInProgress = false;
    $scope.uploadStatus = null;
    $scope.videoPreview = null;
    $scope.isDragOver = false;
    $scope.isLoading = true; // Add loading state

    // Skeleton loader helper
    $scope.getSkeletonRows = function () {
        return new Array($scope.maxResultsShown).fill(0);
    };

    // Summary data for tiles
    $scope.summaryTileData = {
        total: 0,
        totalDuration: 0,
        totalUploading: 0,
        totalCompleted: 0,
        totalStorage: 0
    };

    // Video list data
    $scope.listData = [];
    $scope.allFilteredVideos = []; // Store all filtered videos before pagination
    $scope.filteredVideos = [];    // Store currently displayed page of videos

    // Filter settings
    $scope.showFilters = false;
    $scope.videoFilters = {
        searchText: '',
        chapterId: '',
        moduleId: '',
        instructorId: '',
        sortBy: '-createdOn'
    };

    // Available filter options (will be populated from data)
    $scope.availableChapters = [];
    $scope.availableModules = [];
    $scope.availableInstructors = [];

    // New video object
    $scope.newVideo = {
        file: null,
        titleName: '',
        titleCode: '',

        classificationLevel1: '',
        classificationLevel2: '',
        durationInSeconds: 0,
        collectionName: '',
        customCollectionName: '',
        status: 1
    };

    // Video being modified
    $scope.modifyVideoData = {};

    // Bunny.net collection management
    $scope.bunnyCollections = [];
    $scope.loadingCollections = false;
    $scope.creatingCollection = false;

    // Use dynamic BASE_URL
    const BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "http://localhost:3000"
        : "https://crisprtech.app/crispr-apis";

    // API Configuration - Use proxy server
    var API_BASE = BASE_URL + '/api/bunny';

    // Pagination helpers
    $scope.getStartIndex = function () {
        if ($scope.allFilteredVideos.length === 0) return 0;
        return ($scope.currentPage - 1) * $scope.maxResultsShown + 1;
    };

    $scope.getEndIndex = function () {
        var end = $scope.currentPage * $scope.maxResultsShown;
        return end > $scope.allFilteredVideos.length ? $scope.allFilteredVideos.length : end;
    };

    // Apply filters to video list
    $scope.applyFilters = function () {
        console.log('Applying filters:', $scope.videoFilters);

        var filtered = $scope.listData.slice(); // Start with all videos

        // Apply search filter (title or video ID)
        if ($scope.videoFilters.searchText) {
            var searchLower = $scope.videoFilters.searchText.toLowerCase();
            filtered = filtered.filter(function (video) {
                var titleMatch = video.titleName && video.titleName.toLowerCase().indexOf(searchLower) !== -1;
                var idMatch = video.videoId && video.videoId.toString().indexOf(searchLower) !== -1;
                var displayKeyMatch = video.videoDisplayKey && video.videoDisplayKey.toLowerCase().indexOf(searchLower) !== -1;
                return titleMatch || idMatch || displayKeyMatch;
            });
        }

        // Apply subject filter
        if ($scope.videoFilters.subject) {
            filtered = filtered.filter(function (video) {
                // Assuming you might add a subject field to your video data in the future
                // or map it from modules/chapters. For now, we'll try to guess or use a placeholder logic
                // If chapter IDs start with '1B' or '2B', it's Biology. '1P'/'2P' Physics, etc.
                // This is an example, adjust to your actual data structure.
                if (!video.chapterId) return false;

                var prefix = video.chapterId.substring(1, 2); // 'B' from '1B01'
                if ($scope.videoFilters.subject === 'Biology' && prefix === 'B') return true;
                if ($scope.videoFilters.subject === 'Physics' && prefix === 'P') return true;
                if ($scope.videoFilters.subject === 'Chemistry' && prefix === 'C') return true;
                if ($scope.videoFilters.subject === 'Mathematics' && prefix === 'M') return true;

                return false;
            });
        }

        // Apply chapter filter
        if ($scope.videoFilters.chapterId) {
            filtered = filtered.filter(function (video) {
                return video.chapterId === $scope.videoFilters.chapterId;
            });
        }

        // Apply module filter
        if ($scope.videoFilters.moduleId) {
            filtered = filtered.filter(function (video) {
                return video.moduleId === $scope.videoFilters.moduleId;
            });
        }

        // Apply instructor filter
        if ($scope.videoFilters.instructorId) {
            filtered = filtered.filter(function (video) {
                return video.instructorId === $scope.videoFilters.instructorId;
            });
        }

        // Apply sorting
        if ($scope.videoFilters.sortBy) {
            var sortField = $scope.videoFilters.sortBy;
            var isDescending = sortField.startsWith('-');
            var field = isDescending ? sortField.substring(1) : sortField;

            filtered.sort(function (a, b) {
                var aVal = a[field];
                var bVal = b[field];

                // Handle string comparison
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal ? bVal.toLowerCase() : '';
                }

                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = '';
                if (bVal === null || bVal === undefined) bVal = '';

                if (aVal < bVal) return isDescending ? 1 : -1;
                if (aVal > bVal) return isDescending ? -1 : 1;
                return 0;
            });
        }

        // Store full filtered list
        $scope.allFilteredVideos = filtered;

        // Calculate total pages
        $scope.totalPages = Math.ceil($scope.allFilteredVideos.length / $scope.maxResultsShown) || 1;

        // Reset to first page
        $scope.currentPage = 1;

        // Apply pagination
        $scope.paginateVideos();

        console.log('Filtered results:', $scope.allFilteredVideos.length + ' videos, Total Pages:', $scope.totalPages);

        // Update summary data
        if (typeof $scope.updateFilteredSummary === 'function') {
            $scope.updateFilteredSummary();
        }
    };

    // Paginate videos based on current page
    $scope.paginateVideos = function () {
        var start = ($scope.currentPage - 1) * $scope.maxResultsShown;
        var end = start + $scope.maxResultsShown;

        $scope.filteredVideos = $scope.allFilteredVideos.slice(start, end);
    };

    // Pagination functions
    $scope.goLeft = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.paginateVideos();
        }
    };

    $scope.goRight = function () {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
            $scope.paginateVideos();
        }
    };
    // Dummy data for testing
    $scope.dummyVideos = [
        {
            videoId: 20000,
            videoDisplayKey: '4a97f519-198e-4ddb-9cc0-46c019ba5875',
            titleCode: 1,
            titleName: 'Introduction To Animal Kingdom',
            durationInSeconds: 2310,
            classificationLevel1: 1,
            classificationLevel2: 1,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809057,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809057,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/007bff/ffffff?text=V1',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            chapterId: 'CH001',
            chapterName: 'Animal Kingdom Basics',
            moduleId: 'MOD01',
            moduleName: 'Biology Fundamentals',
            instructorId: 'INS01',
            instructorName: 'Dr. Sarah Johnson'
        },
        {
            videoId: 20001,
            videoDisplayKey: '7b2e8f63-2a9f-5eec-8dd1-57d12acb8f86',
            titleCode: 2,
            titleName: 'Advanced Physics Concepts',
            durationInSeconds: 1845,
            classificationLevel1: 3,
            classificationLevel2: 2,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809058,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809058,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/28a745/ffffff?text=V2',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
            chapterId: 'CH002',
            chapterName: 'Mechanics',
            moduleId: 'MOD02',
            moduleName: 'Physics Advanced',
            instructorId: 'INS02',
            instructorName: 'Prof. Michael Chen'
        },
        {
            videoId: 20002,
            videoDisplayKey: '9c3f1g74-3b0g-6ffd-9ee2-68e23bd9g97',
            sourceDirectory: '475940',
            sourceKey: '878c6g05-g789-6c56-dc43-458hh76d6e5',
            titleCode: 3,
            titleName: 'Chemistry Lab Safety',
            durationInSeconds: 920,
            classificationLevel1: 2,
            classificationLevel2: 1,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809059,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809059,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/ffc107/ffffff?text=V3',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4',
            chapterId: 'CH003',
            chapterName: 'Lab Safety',
            moduleId: 'MOD03',
            moduleName: 'Chemistry Basics',
            instructorId: 'INS01',
            instructorName: 'Dr. Sarah Johnson'
        },
        {
            videoId: 20003,
            videoDisplayKey: '1d4g2h85-4c1h-7gge-0ff3-79f34ce0h08',
            sourceDirectory: '475941',
            sourceKey: '989d7h16-h890-7d67-ed54-569ii87e7f6',
            titleCode: 4,
            titleName: 'Mathematics Problem Solving',
            durationInSeconds: 1560,
            classificationLevel1: 4,
            classificationLevel2: 3,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809060,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809060,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/dc3545/ffffff?text=V4',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_4mb.mp4',
            chapterId: 'CH004',
            chapterName: 'Calculus Basics',
            moduleId: 'MOD04',
            moduleName: 'Mathematics Core',
            instructorId: 'INS03',
            instructorName: 'Dr. Emily Davis'
        },
        {
            videoId: 20004,
            videoDisplayKey: '2e5h3i96-5d2i-8hff-1gg4-80g45df1i19',
            sourceDirectory: '475942',
            sourceKey: '090e8i27-i901-8e78-fe65-670jj98f8g7',
            titleCode: 5,
            titleName: 'Biology Cell Structure',
            durationInSeconds: 1340,
            classificationLevel1: 2,
            classificationLevel2: 2,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809061,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809061,
            chapterId: 'CH001',
            chapterName: 'Animal Kingdom Basics',
            moduleId: 'MOD01',
            moduleName: 'Biology Fundamentals',
            instructorId: 'INS02',
            instructorName: 'Prof. Michael Chen',
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/6f42c1/ffffff?text=V5',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4'
        },
        {
            videoId: 20005,
            videoDisplayKey: '3f6i4j07-6e3j-9igg-2hh5-91h56eg2j20',
            sourceDirectory: '475943',
            sourceKey: '1a1f9j38-j012-9f89-gf76-781kk09g9h8',
            titleCode: 6,
            titleName: 'English Literature Analysis',
            durationInSeconds: 2100,
            classificationLevel1: 3,
            classificationLevel2: 4,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809062,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809062,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/20c997/ffffff?text=V6',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_6mb.mp4'
        },
        {
            videoId: 20006,
            videoDisplayKey: '4g7j5k18-7f4k-0jhh-3ii6-02i67fh3k31',
            sourceDirectory: '475944',
            sourceKey: '2b2g0k49-k123-0g90-hg87-892ll10h0i9',
            titleCode: 7,
            titleName: 'History World War II',
            durationInSeconds: 2780,
            classificationLevel1: 1,
            classificationLevel2: 1,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809063,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809063,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/fd7e14/ffffff?text=V7',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_7mb.mp4'
        },
        {
            videoId: 20007,
            videoDisplayKey: '5h8k6l29-8g5l-1kii-4jj7-13j78gi4l42',
            sourceDirectory: '475945',
            sourceKey: '3c3h1l50-l234-1h01-ih98-903mm21i1j0',
            titleCode: 8,
            titleName: 'Geography Climate Change',
            durationInSeconds: 1650,
            classificationLevel1: 2,
            classificationLevel2: 3,
            createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            createdOn: 1754809064,
            lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
            lastUpdatedOn: 1754809064,
            status: 1,
            thumbnail: 'https://via.placeholder.com/60x40/e83e8c/ffffff?text=V8',
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_8mb.mp4'
        }
    ];

    // Initialize the controller
    $scope.init = function () {
        $scope.loadVideoList();
        $scope.loadSummaryData();

        // Try to load collections from Bunny.net
        console.log('Initializing controller, attempting to load collections...');
        $scope.loadBunnyCollections();

        // Load storage data from Bunny.net
        $scope.loadBunnyStorage();

        // Also try a direct test after a short delay
        $timeout(function () {
            console.log('Testing API connection after initialization...');
            $scope.testBunnyConnection();
        }, 2000);
    };

    // Load video list from database (using dummy data for now)
    $scope.loadVideoList = function () {
        $scope.isLoading = true;
        // Simulate API call delay
        $timeout(function () {
            $scope.listData = $scope.dummyVideos;
            $scope.totalPages = 1;

            // Populate filter options and apply initial filters
            $scope.populateFilterOptions();
            $scope.applyFilters();
            $scope.isLoading = false;
        }, 800);
    };

    // Load summary data for tiles
    $scope.loadSummaryData = function () {
        // Calculate summary from dummy data
        var total = $scope.dummyVideos.length;
        var totalDuration = $scope.dummyVideos.reduce(function (sum, video) {
            return sum + video.durationInSeconds;
        }, 0);
        var totalRecent = $scope.dummyVideos.filter(function (video) {
            // Show videos uploaded in last 30 days
            var uploadDate = new Date(video.uploadedAt || video.createdOn * 1000);
            var thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return uploadDate > thirtyDaysAgo;
        }).length;
        var totalLong = $scope.dummyVideos.filter(function (video) {
            return video.durationInSeconds > 300; // Longer than 5 minutes
        }).length;

        $scope.summaryTileData = {
            total: total,
            totalDuration: Math.round(totalDuration / 60), // Convert to minutes
            totalRecent: totalRecent,
            totalLong: totalLong,
            totalStorage: '0.00' // Will be updated from Bunny.net
        };
    };

    // Load Bunny.net collections
    $scope.loadBunnyCollections = function () {
        $scope.loadingCollections = true;

        // Use proxy server to fetch collections
        $http.get(API_BASE + '/folders')
            .then(function (response) {
                console.log('Collections loaded from proxy:', response.data);
                $scope.bunnyCollections = response.data.map(function (folder) {
                    return {
                        guid: folder.id,
                        name: folder.name,
                        videoCount: folder.videoCount || 0
                    };
                });
                $scope.loadingCollections = false;
            })
            .catch(function (error) {
                console.error('Error loading collections from proxy:', error);
                $scope.loadingCollections = false;
                $scope.loadFallbackCollections();
            });
    };

    // Load storage data from Bunny.net
    $scope.loadBunnyStorage = function () {
        console.log('Loading storage data - using fallback calculation');
        // For now, use fallback calculation
        // TODO: Add storage endpoint to proxy server if needed
        $scope.calculateFallbackStorage();
    };

    // Fallback storage calculation
    $scope.calculateFallbackStorage = function () {
        if ($scope.bunnyCollections && $scope.bunnyCollections.length > 0) {
            var totalVideos = $scope.bunnyCollections.reduce(function (sum, collection) {
                return sum + (collection.videoCount || 0);
            }, 0);
            // Estimate 500MB per video on average
            var estimatedStorage = (totalVideos * 500 / 1024).toFixed(2);
            $scope.summaryTileData.totalStorage = estimatedStorage;
            console.log('📊 Fallback storage calculation:', estimatedStorage + ' GB (estimated from ' + totalVideos + ' videos)');
            $scope.showToaster('Using estimated storage from video count', 'info');
        } else {
            $scope.summaryTileData.totalStorage = '0.00';
            console.log('📊 No videos found, storage set to 0.00 GB');
        }
    };

    // Fetch collections from Bunny.net API
    $scope.fetchBunnyCollections = function () {
        var url = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/collections';
        var params = {
            page: 1,
            itemsPerPage: 100,
            orderBy: 'date',
            includeThumbnails: false
        };

        console.log('Fetching collections from:', url);
        console.log('API Key:', $scope.bunnyNetConfig.accessKey);
        console.log('Library ID:', $scope.bunnyNetConfig.libraryId);

        $http.get(url, {
            params: params,
            headers: {
                'AccessKey': $scope.bunnyNetConfig.accessKey
            }
        }).then(function (response) {
            console.log('Collections API response:', response);
            console.log('Response data:', response.data);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Try different possible response structures
            var collections = [];

            if (response.data && response.data.data) {
                // Standard paginated response
                collections = response.data.data;
                console.log('Found collections in response.data.data:', collections);
            } else if (response.data && Array.isArray(response.data)) {
                // Direct array response
                collections = response.data;
                console.log('Found collections in response.data (array):', collections);
            } else if (response.data && response.data.collections) {
                // Collections property
                collections = response.data.collections;
                console.log('Found collections in response.data.collections:', collections);
            } else if (response.data && response.data.items) {
                // Items property
                collections = response.data.items;
                console.log('Found collections in response.data.items:', collections);
            } else {
                console.log('No collections found in response. Full response structure:', JSON.stringify(response.data, null, 2));
            }

            if (collections && collections.length > 0) {
                $scope.bunnyCollections = collections.map(function (collection) {
                    console.log('Processing collection:', collection);

                    var mappedCollection = {
                        id: collection.id || collection.guid || collection.collectionId || 'unknown',
                        name: collection.name || collection.collectionName || 'Unnamed Collection',
                        videoCount: collection.videoCount || collection.videosCount || collection.count || 0,
                        created: collection.dateCreated ? new Date(collection.dateCreated * 1000).toISOString().split('T')[0] :
                            collection.createdAt ? new Date(collection.createdAt).toISOString().split('T')[0] :
                                collection.date ? new Date(collection.date).toISOString().split('T')[0] : 'Unknown',
                        description: collection.description || collection.desc || 'Collection from Bunny.net'
                    };

                    console.log('Mapped collection:', mappedCollection);
                    return mappedCollection;
                });

                console.log('Final bunnyCollections array:', $scope.bunnyCollections);
                $scope.showToaster('Collections loaded successfully from Bunny.net: ' + $scope.bunnyCollections.length + ' found', 'success');

                // Refresh storage data after collections are loaded
                $scope.loadBunnyStorage();
            } else {
                $scope.bunnyCollections = [];
                $scope.showToaster('No collections found in your Bunny.net library', 'info');

                // Still try to get storage data
                $scope.loadBunnyStorage();
            }

            $scope.loadingCollections = false;

        }).catch(function (error) {
            console.error('Error fetching collections:', error);
            console.error('Error details:', {
                status: error.status,
                statusText: error.statusText,
                data: error.data,
                config: error.config
            });

            $scope.loadingCollections = false;

            if (error.status === 401) {
                $scope.showToaster('Authentication failed. Please check your API key.', 'error');
            } else if (error.status === 404) {
                $scope.showToaster('Library not found. Please check your library ID.', 'error');
            } else if (error.status === 403) {
                $scope.showToaster('Access forbidden. Check your API key permissions.', 'error');
            } else {
                $scope.showToaster('Failed to load collections from Bunny.net: ' + (error.data?.message || error.statusText || 'Unknown error'), 'error');
            }

            // Fallback to dummy data if API fails
            $scope.loadFallbackCollections();
        });
    };

    // Refresh collections
    $scope.refreshCollections = function () {
        $scope.loadBunnyCollections();
        // Also refresh storage data
        $scope.loadBunnyStorage();
    };

    // Handle collection selection change
    $scope.onCollectionChange = function () {
        if ($scope.newVideo.collectionName === '__custom__') {
            $scope.newVideo.customCollectionName = '';
        }
    };

    // Create new collection
    $scope.createCollection = function () {
        if (!$scope.newVideo.customCollectionName) {
            $scope.showToaster('Please enter a collection name', 'error');
            return;
        }

        $scope.creatingCollection = true;

        // Make actual API call to Bunny.net
        $scope.createBunnyCollection();
    };

    // Load fallback collections if API fails
    $scope.loadFallbackCollections = function () {
        console.log('Loading fallback collections due to API failure');
        $scope.bunnyCollections = [
            {
                id: 'fallback_001',
                name: 'vegapilot-videos',
                videoCount: 15,
                created: '2024-01-15',
                description: 'Main video collection for VegaPilot (Fallback)'
            },
            {
                id: 'fallback_002',
                name: 'course-content',
                videoCount: 8,
                created: '2024-01-20',
                description: 'Educational course videos (Fallback)'
            },
            {
                id: 'fallback_003',
                name: 'tutorial-series',
                videoCount: 12,
                created: '2024-01-25',
                description: 'Step-by-step tutorial videos (Fallback)'
            }
        ];
        $scope.showToaster('Using fallback collections. API connection failed.', 'warning');
    };

    // Create collection in Bunny.net
    $scope.createBunnyCollection = function () {
        var url = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/collections';

        console.log('Creating collection:', $scope.newVideo.customCollectionName);
        console.log('API URL:', url);

        $http.post(url, {
            name: $scope.newVideo.customCollectionName
        }, {
            headers: {
                'AccessKey': $scope.bunnyNetConfig.accessKey,
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            console.log('Collection creation response:', response.data);

            var newCollection = {
                id: response.data.id || response.data.guid,
                name: response.data.name,
                videoCount: 0,
                created: new Date().toISOString().split('T')[0],
                description: 'Custom collection created by user'
            };

            $scope.bunnyCollections.push(newCollection);
            $scope.newVideo.collectionName = newCollection.name;
            $scope.newVideo.customCollectionName = '';
            $scope.creatingCollection = false;

            $scope.showToaster('Collection "' + newCollection.name + '" created successfully in Bunny.net!', 'success');

        }).catch(function (error) {
            console.error('Error creating collection:', error);
            $scope.creatingCollection = false;

            if (error.status === 401) {
                $scope.showToaster('Authentication failed. Please check your API key.', 'error');
            } else if (error.status === 400) {
                $scope.showToaster('Invalid collection name or request format.', 'error');
            } else if (error.status === 409) {
                $scope.showToaster('Collection with this name already exists.', 'error');
            } else {
                $scope.showToaster('Failed to create collection in Bunny.net: ' + (error.data?.message || error.statusText || 'Unknown error'), 'error');
            }
        });
    };

    // Add new video (show upload form)
    $scope.addNewVideo = function () {
        $scope.createView = true;
        $scope.modifyVideoView = false;
        $scope.resetNewVideo();
    };

    // Reset new video form
    $scope.resetNewVideo = function () {
        $scope.newVideo = {
            file: null,
            titleName: '',
            titleCode: '',
            classificationLevel1: '',
            classificationLevel2: '',
            durationInSeconds: 0,
            collectionName: '',
            customCollectionName: ''
        };
        $scope.videoPreview = null;
        $scope.uploadProgress = 0;
        $scope.uploadInProgress = false;
        $scope.uploadStatus = null;
    };

    // Test function for debugging
    $scope.testFileSelect = function () {
        console.log('Test function called');
        console.log('Current newVideo:', $scope.newVideo);
        console.log('Current videoPreview:', $scope.videoPreview);
        $scope.showToaster('Test function called - check console', 'info');
    };

    // Show debug information
    $scope.showDebugInfo = function () {
        console.log('=== DEBUG INFORMATION ===');
        console.log('Current bunnyCollections:', $scope.bunnyCollections);
        console.log('Collections length:', $scope.bunnyCollections.length);
        console.log('Loading state:', $scope.loadingCollections);
        console.log('API Config:', $scope.bunnyNetConfig);
        console.log('Current newVideo:', $scope.newVideo);

        var debugInfo = 'Collections: ' + $scope.bunnyCollections.length + '\n';
        debugInfo += 'Loading: ' + $scope.loadingCollections + '\n';
        debugInfo += 'API Key: ' + $scope.bunnyNetConfig.accessKey.substring(0, 10) + '...\n';
        debugInfo += 'Library ID: ' + $scope.bunnyNetConfig.libraryId + '\n';
        debugInfo += 'Base URL: ' + $scope.bunnyNetConfig.baseUrl;

        alert('Debug Information:\n\n' + debugInfo);
    };

    // Test Bunny.net API connection
    $scope.testBunnyConnection = function () {
        console.log('Testing Bunny.net API connection...');
        $scope.showToaster('Testing API connection...', 'info');

        var testUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/collections?page=1&itemsPerPage=1';

        console.log('Testing URL:', testUrl);
        console.log('Using API Key:', $scope.bunnyNetConfig.accessKey);

        $http.get(testUrl, {
            headers: {
                'AccessKey': $scope.bunnyNetConfig.accessKey
            }
        }).then(function (response) {
            console.log('✅ API connection successful!');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            console.log('Response structure:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.data) {
                console.log('Collections found:', response.data.data.length);
                response.data.data.forEach(function (col, index) {
                    console.log('Collection ' + index + ':', col);
                });
            } else if (response.data && Array.isArray(response.data)) {
                console.log('Direct array response, collections found:', response.data.length);
                response.data.forEach(function (col, index) {
                    console.log('Collection ' + index + ':', col);
                });
            } else {
                console.log('Unexpected response structure:', Object.keys(response.data || {}));
            }

            $scope.showToaster('✅ Bunny.net API connection successful! Check console for details.', 'success');
        }).catch(function (error) {
            console.error('❌ API connection failed:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.data?.message || error.statusText);
            console.error('Full error:', error);

            $scope.showToaster('❌ API connection failed: ' + (error.data?.message || error.statusText || 'Unknown error'), 'error');
        });
    };

    // Handle video file selection
    $scope.onVideoFileSelect = function (event) {
        console.log('File selected:', event.target.files[0]);
        var file = event.target.files[0];
        if (file) {
            $scope.newVideo.file = file;

            // Create preview URL
            $scope.videoPreview = URL.createObjectURL(file);

            // Get video duration
            $scope.getVideoDuration(file);

            // Force Angular to update the view
            $scope.$apply();

            console.log('Video file loaded:', {
                name: file.name,
                size: file.size,
                type: file.type,
                duration: $scope.newVideo.durationInSeconds
            });
        }
    };

    // Select video file function for button click
    $scope.selectVideoFile = function () {
        if (!$scope.uploadInProgress) {
            document.getElementById('videoFile').click();
        }
    };

    // Remove selected file
    $scope.removeSelectedFile = function () {
        if (!$scope.uploadInProgress) {
            $scope.newVideo.file = null;
            $scope.newVideo.durationInSeconds = null;
            document.getElementById('videoFile').value = '';
        }
    };

    // Get video duration from file
    $scope.getVideoDuration = function (file) {
        var video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function () {
            $scope.$apply(function () {
                $scope.newVideo.durationInSeconds = Math.round(video.duration);
            });
        };

        video.src = URL.createObjectURL(file);
    };

    // Upload video to Bunny.net
    $scope.uploadVideo = function () {
        if (!$scope.newVideo.file || !$scope.newVideo.titleName) {
            $scope.showToaster('Please select a video file and enter a title.', 'error');
            return;
        }

        if (!$scope.newVideo.collectionName || $scope.newVideo.collectionName === '__custom__') {
            $scope.showToaster('Please select a collection or create a new one.', 'error');
            return;
        }

        // Validate file type
        var allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
        if (!allowedTypes.includes($scope.newVideo.file.type)) {
            $scope.showToaster('Unsupported file type: ' + $scope.newVideo.file.type + '. Please use MP4, AVI, MOV, WMV, FLV, WebM, or MKV.', 'error');
            return;
        }

        // Validate file size (500MB limit)
        var maxSize = 500 * 1024 * 1024; // 500MB in bytes
        if ($scope.newVideo.file.size > maxSize) {
            $scope.showToaster('File too large: ' + ($scope.newVideo.file.size / (1024 * 1024)).toFixed(2) + 'MB. Maximum size is 500MB.', 'error');
            return;
        }

        // Show upload progress
        $scope.uploadProgress = 0;
        $scope.uploadInProgress = true;
        $scope.uploadStatus = {
            type: 'info',
            title: 'Starting Upload',
            message: 'Preparing to upload video to Bunny.net collection: ' + $scope.newVideo.collectionName
        };

        // Get the collection ID for the selected collection
        var selectedCollection = $scope.bunnyCollections.find(function (col) {
            return col.name === $scope.newVideo.collectionName;
        });

        if (!selectedCollection) {
            $scope.showToaster('Selected collection not found. Please refresh and try again.', 'error');
            $scope.uploadInProgress = false;
            return;
        }

        console.log('Starting upload for file:', $scope.newVideo.file.name);
        console.log('File type:', $scope.newVideo.file.type);
        console.log('File size:', $scope.newVideo.file.size, 'bytes');
        console.log('Collection:', selectedCollection.name, '(ID:', selectedCollection.id + ')');

        // Upload video to Bunny.net
        $scope.uploadVideoToBunny(selectedCollection);
    };

    // Single upload method to Bunny.net via proxy server
    $scope.uploadVideoToBunny = function (selectedCollection) {
        console.log('Uploading video to Bunny.net via proxy server');

        // Create FormData for file upload
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);
        formData.append('folderId', selectedCollection.guid);

        // Use XMLHttpRequest for progress tracking
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Upload response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    $scope.handleUploadSuccess(response, selectedCollection);
                } catch (e) {
                    console.log('Error parsing response:', e);
                    $scope.handleUploadError(xhr.status, 'Invalid response format');
                }
            } else {
                $scope.handleUploadError(xhr.status, xhr.responseText);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('Upload failed with network error');
            $scope.handleUploadError('network', 'Network error occurred during upload');
        });

        // Set up and send the request to proxy server
        xhr.open('POST', API_BASE + '/upload');
        xhr.send(formData);
    };

    // Method 3: Upload using fetch API with different approach
    $scope.tryUploadMethod3 = function (selectedCollection) {
        console.log('Trying Method 3: Fetch API upload');

        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos';

        // Create FormData
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);

        // Add metadata
        formData.append('title', $scope.newVideo.titleName);
        formData.append('description', $scope.newVideo.titleName + ' - Uploaded via VegaPilot');
        formData.append('tags', 'vegapilot,upload');
        formData.append('collectionId', selectedCollection.id);

        // Use fetch API
        fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'AccessKey': $scope.bunnyNetConfig.accessKey
            },
            body: formData
        }).then(function (response) {
            console.log('Method 3 response:', response.status);

            if (response.ok) {
                return response.text();
            } else if (response.status === 415) {
                console.log('Method 3 failed with 415, trying Method 4...');
                $scope.tryUploadMethod4(selectedCollection);
                return;
            } else {
                throw new Error('Upload failed: ' + response.status);
            }
        }).then(function (responseText) {
            if (responseText) {
                $scope.handleUploadSuccess(responseText, selectedCollection);
            }
        }).catch(function (error) {
            console.log('Method 3 error, trying Method 4...');
            $scope.tryUploadMethod4(selectedCollection);
        });
    };

    // Method 4: Upload to collection endpoint directly
    $scope.tryUploadMethod4 = function (selectedCollection) {
        console.log('Trying Method 4: Collection-specific upload');

        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/collections/' + selectedCollection.id + '/videos';

        // Create FormData
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);
        formData.append('title', $scope.newVideo.titleName);
        formData.append('description', $scope.newVideo.titleName + ' - Uploaded via VegaPilot');

        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Method 4 response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 4 failed with 415, trying Method 5...');
                $scope.tryUploadMethod5(selectedCollection);
            } else {
                console.log('Method 4 failed, trying Method 5...');
                $scope.tryUploadMethod5(selectedCollection);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('Method 4 error, trying Method 5...');
            $scope.tryUploadMethod5(selectedCollection);
        });

        // Set request headers
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);

        // Send the request
        xhr.send(formData);
    };

    // Method 5: Direct binary upload without FormData
    $scope.tryUploadMethod5 = function (selectedCollection) {
        console.log('Trying Method 5: Direct binary upload');

        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos';

        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Method 5 response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 5 failed with 415, trying Method 6...');
                $scope.tryUploadMethod6(selectedCollection);
            } else {
                console.log('Method 5 failed, trying Method 6...');
                $scope.tryUploadMethod6(selectedCollection);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('Method 5 error, trying Method 6...');
            $scope.tryUploadMethod6(selectedCollection);
        });

        // Set request headers for binary upload
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');

        // Add metadata as query parameters
        var metadataUrl = uploadUrl + '?title=' + encodeURIComponent($scope.newVideo.titleName) +
            '&description=' + encodeURIComponent($scope.newVideo.titleName + ' - Uploaded via VegaPilot') +
            '&tags=vegapilot,upload' +
            '&collectionId=' + selectedCollection.id;

        xhr.open('POST', metadataUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');

        // Send the file directly as binary data
        xhr.send($scope.newVideo.file);
    };

    // Method 6: Try using pull zone approach (upload to a different endpoint)
    $scope.tryUploadMethod6 = function (selectedCollection) {
        console.log('Trying Method 6: Pull zone upload approach');

        // Try the pull zone endpoint
        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/pullzone';

        // Create FormData with minimal fields
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);

        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Method 6 response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 6 failed with 415, trying Method 7...');
                $scope.tryUploadMethod7(selectedCollection);
            } else {
                console.log('Method 6 failed, trying Method 7...');
                $scope.tryUploadMethod7(selectedCollection);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('Method 6 error, trying Method 7...');
            $scope.tryUploadMethod7(selectedCollection);
        });

        // Set request headers
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);

        // Send the request
        xhr.send(formData);
    };

    // Method 7: Try using the Bunny.net direct upload approach
    $scope.tryUploadMethod7 = function (selectedCollection) {
        console.log('Trying Method 7: Direct upload with minimal headers');

        // Try a different endpoint structure
        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos/upload';

        // Create FormData with only the file
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);

        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Method 7 response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 7 failed with 415, trying Method 8...');
                $scope.tryUploadMethod8(selectedCollection);
            } else {
                console.log('Method 7 failed, trying Method 8...');
                $scope.tryUploadMethod8(selectedCollection);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('Method 7 error, trying Method 8...');
            $scope.tryUploadMethod8(selectedCollection);
        });

        // Set request headers - minimal approach
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);

        // Send the request
        xhr.send(formData);
    };

    // Method 8: Try using different authentication header format
    $scope.tryUploadMethod8 = function (selectedCollection) {
        console.log('Trying Method 8: Different authentication header format');

        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos';

        // Create FormData with minimal fields
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);

        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function () {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });

        // Upload complete
        xhr.addEventListener('load', function () {
            console.log('Method 8 response:', xhr.status, xhr.responseText);

            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else {
                console.log('All upload methods failed. Final error:', xhr.status, xhr.responseText);
                $scope.handleUploadError(xhr.status, xhr.responseText);
            }
        });

        // Upload error
        xhr.addEventListener('error', function () {
            console.log('All upload methods failed');
            $scope.handleUploadError(0, 'All upload methods failed');
        });

        // Try different header formats
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        xhr.setRequestHeader('Authorization', 'Bearer ' + $scope.bunnyNetConfig.accessKey);
        xhr.setRequestHeader('X-Access-Key', $scope.bunnyNetConfig.accessKey);

        // Send the request
        xhr.send(formData);
    };

    // Update upload status based on progress
    $scope.updateUploadStatus = function (percentComplete, collectionName) {
        if (percentComplete < 20) {
            $scope.uploadStatus = {
                type: 'info',
                title: 'Initializing Upload',
                message: 'Preparing video file for upload...'
            };
        } else if (percentComplete < 40) {
            $scope.uploadStatus = {
                type: 'info',
                title: 'Uploading to Bunny.net',
                message: 'Transferring video data to Bunny.net servers...'
            };
        } else if (percentComplete < 70) {
            $scope.uploadStatus = {
                type: 'info',
                title: 'Processing Video',
                message: 'Bunny.net is processing and optimizing your video...'
            };
        } else if (percentComplete < 90) {
            $scope.uploadStatus = {
                type: 'info',
                title: 'Generating Thumbnail',
                message: 'Creating video thumbnail and metadata...'
            };
        } else if (percentComplete < 100) {
            $scope.uploadStatus = {
                type: 'info',
                title: 'Finalizing',
                message: 'Completing upload and saving to collection: ' + collectionName
            };
        }
    };

    // Handle successful upload
    $scope.handleUploadSuccess = function (responseText, selectedCollection) {
        var response = JSON.parse(responseText);
        console.log('✅ Upload successful:', response);

        $scope.$apply(function () {
            $scope.uploadProgress = 100;
            $scope.uploadStatus = {
                type: 'success',
                title: 'Upload Complete!',
                message: 'Video uploaded to Bunny.net successfully! Video ID: ' + (response.guid || response.id || 'Unknown')
            };

            // Add to local data with real Bunny.net details
            var newVideo = {
                videoId: 20000 + $scope.dummyVideos.length + 1,
                videoDisplayKey: response.guid || response.id || $scope.generateUUID(),
                titleCode: $scope.newVideo.titleCode || 1,
                titleName: $scope.newVideo.titleName,
                durationInSeconds: $scope.newVideo.durationInSeconds,
                classificationLevel1: $scope.newVideo.classificationLevel1 || 1,
                classificationLevel2: $scope.newVideo.classificationLevel2 || 1,
                createdBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
                createdOn: Math.floor(Date.now() / 1000),
                lastUpdatedBy: '3c4f0321-7805-4110-a8a1-18790e9de023',
                lastUpdatedOn: Math.floor(Date.now() / 1000),
                status: 1, // Active
                thumbnail: response.thumbnail || 'https://via.placeholder.com/60x40/007bff/ffffff?text=NEW',
                bunnyNetId: response.guid || response.id,
                collectionName: selectedCollection.name,
                fileSize: $scope.newVideo.file.size,
                uploadedAt: new Date().toISOString()
            };

            $scope.dummyVideos.unshift(newVideo);
            $scope.listData = $scope.dummyVideos;
            $scope.loadSummaryData();

            // Refresh collections to update video counts
            $scope.loadBunnyCollections();

            $scope.showToaster('Video uploaded successfully to Bunny.net!', 'success');

            // Reset form after successful upload
            setTimeout(function () {
                $scope.uploadInProgress = false;
                $scope.resetNewVideo();
                $scope.showToaster('Video added to your library!', 'success');
            }, 2000);
        });
    };

    // Handle upload error
    $scope.handleUploadError = function (status, responseText) {
        console.error('❌ Upload failed:', status, responseText);

        var errorMessage = 'Upload failed';
        if (status === 415) {
            errorMessage = 'Unsupported file format. Please try converting your video to MP4 format.';
        } else if (status === 413) {
            errorMessage = 'File too large. Please use a smaller video file.';
        } else if (status === 401) {
            errorMessage = 'Authentication failed. Please check your API key.';
        } else if (status === 403) {
            errorMessage = 'Access denied. Please check your permissions.';
        } else if (status === 404) {
            errorMessage = 'Upload endpoint not found. Please check your library ID.';
        } else {
            errorMessage = 'Upload failed with status: ' + status;
        }

        $scope.$apply(function () {
            $scope.uploadStatus = {
                type: 'error',
                title: 'Upload Failed',
                message: errorMessage
            };
            $scope.uploadInProgress = false;
        });

        $scope.showToaster(errorMessage, 'error');
    };

    // Check if form is complete for upload
    $scope.isFormComplete = function () {
        return $scope.newVideo.file &&
            $scope.newVideo.titleName &&
            $scope.newVideo.titleName.trim() !== '' &&
            $scope.newVideo.collectionName &&
            $scope.newVideo.collectionName !== '__custom__' &&
            $scope.newVideo.collectionName !== '';
    };

    // Generate UUID for demo purposes
    $scope.generateUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Cancel upload and return to list
    $scope.cancelUpload = function () {
        $scope.createView = false;
        $scope.modifyVideoView = false;
        $scope.uploadInProgress = false;
        $scope.uploadProgress = 0;
        $scope.uploadStatus = null;
        $scope.resetNewVideo();
    };

    // Open video for viewing
    $scope.openVideo = function (videoData) {
        // This could open a modal or navigate to video player
        console.log('Opening video:', videoData);
    };

    // View video details
    $scope.viewVideo = function (videoData) {
        $scope.modifyVideoData = angular.copy(videoData);
        $scope.createView = true;
        $scope.modifyVideoView = true;
    };

    // Modify video
    $scope.modifyVideo = function (videoId) {
        var video = $scope.dummyVideos.find(function (v) {
            return v.videoId === videoId;
        });

        if (video) {
            $scope.modifyVideoData = angular.copy(video);
            $scope.createView = true;
            $scope.modifyVideoView = true;
        } else {
            $scope.showToaster('Video not found.', 'error');
        }
    };

    // Save video changes
    $scope.saveVideoChanges = function () {
        var index = $scope.dummyVideos.findIndex(function (v) {
            return v.videoId === $scope.modifyVideoData.videoId;
        });

        if (index !== -1) {
            $scope.dummyVideos[index] = angular.copy($scope.modifyVideoData);
            $scope.dummyVideos[index].lastUpdatedOn = Math.floor(Date.now() / 1000);

            $scope.showToaster('Video updated successfully!', 'success');
            $scope.goBackToList();
            $scope.loadSummaryData();
        } else {
            $scope.showToaster('Error updating video.', 'error');
        }
    };

    // Go back to video list
    $scope.goBackToList = function () {
        $scope.createView = false;
        $scope.modifyVideoView = false;
        $scope.modifyVideoData = {};
    };

    // Quick filter videos
    $scope.quickFilterVideos = function (filter) {
        $scope.videoFilterApplied = filter;
        $scope.currentPage = 1;

        if (filter === 'ALL') {
            $scope.listData = $scope.dummyVideos;
        } else if (filter === 'RECENT') {
            // Show recent videos (last 10)
            $scope.listData = $scope.dummyVideos.slice(0, 10);
        } else if (filter === 'LONG') {
            // Show videos longer than 5 minutes
            $scope.listData = $scope.dummyVideos.filter(function (video) {
                return video.durationInSeconds > 300;
            });
        }
    };

    // Remove filter on videos
    $scope.removeFilterOnVideos = function () {
        $scope.videoFilterApplied = '';
        $scope.currentPage = 1;
        $scope.listData = $scope.dummyVideos;
    };

    // Pagination functions
    $scope.goLeft = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadVideoList();
        }
    };

    $scope.goRight = function () {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
            $scope.loadVideoList();
        }
    };

    // Utility functions
    $scope.formatDuration = function (seconds) {
        if (!seconds) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    };

    // Get Bunny.net embed URL for video player
    $scope.getBunnyEmbedUrl = function (videoId) {
        // Bunny.net iframe embed URL format
        // https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
        var embedUrl = 'https://iframe.mediadelivery.net/embed/534211/' + videoId;
        return $sce.trustAsResourceUrl(embedUrl);
    };


    $scope.copyToClipboard = function (text, event) {
        event.stopPropagation();

        // Create temporary input element
        var tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        // Show copied message
        var copiedMessage = event.target.parentElement.querySelector('.copiedMessage');
        if (copiedMessage) {
            copiedMessage.style.display = 'block';
            $timeout(function () {
                copiedMessage.style.display = 'none';
            }, 1000);
        }
    };

    // Toaster notification system
    $scope.toasterVisible = false;
    $scope.toasterMessage = '';

    $scope.showToaster = function (message, type) {
        $scope.toasterMessage = '<div class="alert alert-' + type + '">' + message + '</div>';
        $scope.toasterVisible = true;

        $timeout(function () {
            $scope.toasterVisible = false;
        }, 3000);
    };



    // Clear all filters
    $scope.clearFilters = function () {
        $scope.videoFilters = {
            searchText: '',
            chapterId: '',
            moduleId: '',
            instructorId: '',
            sortBy: '-createdOn'
        };
        $scope.applyFilters();
    };

    // Check if any filters are active
    $scope.hasActiveFilters = function () {
        return $scope.videoFilters.searchText ||
            $scope.videoFilters.chapterId ||
            $scope.videoFilters.moduleId ||
            $scope.videoFilters.instructorId;
    };

    // Get name helpers for active filters display
    $scope.getChapterName = function (chapterId) {
        var chapter = $scope.availableChapters.find(function (c) { return c.id === chapterId; });
        return chapter ? chapter.name : chapterId;
    };

    $scope.getModuleName = function (moduleId) {
        var module = $scope.availableModules.find(function (m) { return m.id === moduleId; });
        return module ? module.name : moduleId;
    };

    $scope.getInstructorName = function (instructorId) {
        var instructor = $scope.availableInstructors.find(function (i) { return i.id === instructorId; });
        return instructor ? instructor.name : instructorId;
    };

    // Update summary data for filtered results
    $scope.updateFilteredSummary = function () {
        if (!$scope.allFilteredVideos) return;

        var totalDuration = $scope.allFilteredVideos.reduce(function (sum, video) {
            return sum + (video.durationInSeconds || 0);
        }, 0);

        // Update summary tiles to reflect filtered data
        $scope.summaryTileData.total = $scope.allFilteredVideos.length;
        $scope.summaryTileData.totalDuration = Math.round(totalDuration / 60);
    };

    // Pagination UI Helpers
    $scope.getPageNumbers = function () {
        var pages = [];
        var maxPagesToShow = 5;
        var startPage = Math.max(1, $scope.currentPage - 2);
        var endPage = Math.min($scope.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.changePageSize = function () {
        $scope.currentPage = 1;
        $scope.paginateVideos();
    };

    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
            $scope.paginateVideos();
        }
    };

    // Logout function
    $scope.logoutNow = function () {
        $cookies.remove('userToken');
        window.location.href = 'login.html';
    };

    // Fetch all videos from Bunny.net
    // Fetch all videos from Bunny.net
    $scope.fetchAllVideos = function () {
        $scope.isLoading = true; // Set loading state to true
        $scope.listData = []; // Clear list data

        // Check if running on file protocol or dummy mode is forced
        var isFileProtocol = window.location.protocol === 'file:';
        if (isFileProtocol) {
            console.warn('Running on file protocol, using dummy data.');
            $timeout(function () {
                $scope.loadDummyData();
                $scope.isLoading = false;
            }, 1000); // Shimmer effect delay
            return;
        }

        $http.get(API_BASE + '/videos').then(function (response) {
            console.log('Fetched videos:', response.data);
            if (response.data && Array.isArray(response.data)) {
                $scope.listData = response.data.map(function (video) {
                    return {
                        videoId: video.guid,
                        titleName: video.title,
                        videoDisplayKey: video.guid,
                        durationInSeconds: video.length,
                        thumbnail: video.thumbnailUrl || (video.status === 3 ? 'assets/img/video-placeholder.png' : ''),
                        status: video.status,
                        classificationLevel1: video.metaTags ? video.metaTags.find(tag => tag.property === 'level1')?.value : '',
                        classificationLevel2: video.metaTags ? video.metaTags.find(tag => tag.property === 'level2')?.value : '',
                        collectionId: video.collectionId,
                        chapterId: video.metaTags ? video.metaTags.find(tag => tag.property === 'chapterId')?.value : '',
                    };
                });

                $scope.applyFilters();
            }
            $scope.isLoading = false;
        }, function (error) {
            console.error('Error fetching videos:', error);
            $scope.showToaster('Failed to load videos due to API error. Loading demo data.', 'warning');
            $scope.loadDummyData();
            $scope.isLoading = false; // Set loading state to false
        });
    };

    // Link New Video Logic
    $scope.onSubjectChange = function () {
        var subject = $scope.newVideo.classificationLevel1;
        $scope.availableChapters = [];
        if (!subject) return;

        // Dummy chapters data
        var chaptersDB = {
            'Biology': [
                { id: '1B01', name: 'Ch 1: The Living World' },
                { id: '1B02', name: 'Ch 2: Biological Classification' }
            ],
            'Chemistry': [
                { id: '1C01', name: 'Ch 1: Basic Concepts' },
                { id: '1C04', name: 'Ch 4: Chemical Bonding' }
            ],
            'Physics': [
                { id: '1P05', name: 'Ch 5: Laws of Motion' },
                { id: '2P09', name: 'Ch 9: Ray Optics' }
            ],
            'Mathematics': [
                { id: '1M13', name: 'Ch 13: Limits & Derivatives' },
                { id: '2M07', name: 'Ch 7: Integrals' }
            ]
        };

        $scope.availableChapters = chaptersDB[subject] || [];
        $scope.newVideo.classificationLevel2 = ''; // Reset chapter selection
    };

    $scope.videosInSelectedCollection = [];
    $scope.loadingVideosInCollection = false;

    $scope.onCollectionSelect = function () {
        // Reset rows when collection changes
        $scope.videoItems = [{ targetVideoId: '', titleName: '' }];
        $scope.videosInSelectedCollection = [];

        if (!$scope.newVideo.collectionName) {
            return;
        }

        $scope.loadingVideosInCollection = true;

        // Simulate API call to fetch videos in folder
        $timeout(function () {
            // Generate dummy videos for the selected folder
            $scope.videosInSelectedCollection = [
                { guid: 'vid-' + Math.floor(Math.random() * 10000), title: 'Lecture 1: Introduction', length: 1800 },
                { guid: 'vid-' + Math.floor(Math.random() * 10000), title: 'Lecture 2: Advanced Concepts', length: 2400 },
                { guid: 'vid-' + Math.floor(Math.random() * 10000), title: 'Problem Solving Session', length: 1200 },
                { guid: 'vid-' + Math.floor(Math.random() * 10000), title: 'Exam Review', length: 3600 },
                { guid: 'vid-' + Math.floor(Math.random() * 10000), title: 'Lab Demonstration', length: 900 }
            ];
            $scope.loadingVideosInCollection = false;
        }, 800);
    };

    $scope.videoItems = [];

    $scope.addVideoRow = function () {
        // Find next available video
        var availableVid = $scope.videosInSelectedCollection.find(function (vid) {
            return !$scope.videoItems.some(function (item) { return item.targetVideoId === vid.guid; });
        });

        var newItem = { targetVideoId: '', titleName: '' };

        if (availableVid) {
            newItem.targetVideoId = availableVid.guid;
            newItem.titleName = availableVid.title;
        }

        $scope.videoItems.push(newItem);

        // Focus the new title input after render
        $timeout(function () {
            var inputs = document.querySelectorAll('.video-row-title');
            if (inputs.length > 0) {
                var input = inputs[inputs.length - 1];
                input.focus();
                input.select();
            }
        });
    };

    $scope.removeVideoRow = function (index) {
        $scope.videoItems.splice(index, 1);
    };

    // Filter available videos for dropdown (exclude already selected)
    $scope.getAvailableVideos = function (currentItem) {
        return $scope.videosInSelectedCollection.filter(function (vid) {
            // Include if it's the current item's selection OR if it's not selected by any other item
            return vid.guid === currentItem.targetVideoId ||
                !$scope.videoItems.some(function (item) { return item.targetVideoId === vid.guid; });
        });
    };

    $scope.onVideoSelect = function (item, index) {
        // Auto-fill title from selected video
        if (item.targetVideoId) {
            var selectedVid = $scope.videosInSelectedCollection.find(function (v) { return v.guid === item.targetVideoId; });
            if (selectedVid) {
                item.titleName = selectedVid.title;
            }
        }

        // Focus and select title input
        $timeout(function () {
            // We need to target specific row input
            var inputId = 'video-title-' + index;
            var element = document.getElementById(inputId);
            if (element) {
                element.focus();
                element.select();
            }
        });
    };

    $scope.isLinkFormComplete = function () {
        var baseValid = $scope.newVideo.classificationLevel1 &&
            $scope.newVideo.classificationLevel2 &&
            $scope.newVideo.instructorId &&
            $scope.newVideo.collectionName;

        if (!baseValid) return false;
        if ($scope.videoItems.length === 0) return false;

        // Check if all rows are valid
        return $scope.videoItems.every(function (item) {
            return item.targetVideoId && item.titleName;
        });
    };

    $scope.linkVideo = function () {
        // 1. Construct the requested payload
        var chapterObj = $scope.availableChapters.find(function (c) { return c.id === $scope.newVideo.classificationLevel2; });
        var instructorObj = $scope.availableInstructors.find(function (i) { return i.id === $scope.newVideo.instructorId; });

        var payload = {
            "subject": $scope.newVideo.classificationLevel1,
            "chapter": chapterObj ? chapterObj.name : $scope.newVideo.classificationLevel2,
            "instructor": instructorObj ? instructorObj.name : $scope.newVideo.instructorId,
            "videos": $scope.videoItems.map(function (item) {
                return {
                    "id": item.targetVideoId,
                    "title": item.titleName
                };
            })
        };

        // Log the output as requested
        console.log("Expected Output:", JSON.stringify(payload, null, 4));

        // 2. Perform the UI update (internal logic to show rows in table)
        var successCount = 0;
        $scope.videoItems.forEach(function (item) {
            if (!item.targetVideoId || !item.titleName) return;

            var linkedVideo = {
                videoId: $scope.generateUUID(),
                titleName: item.titleName,
                videoDisplayKey: 'LNK-' + Math.floor(Math.random() * 1000),
                durationInSeconds: 0,
                status: 1,
                classificationLevel1: $scope.newVideo.classificationLevel1,
                classificationLevel2: $scope.newVideo.classificationLevel2,
                instructorId: $scope.newVideo.instructorId,
                thumbnail: 'assets/img/video-placeholder.png',
                collectionName: $scope.newVideo.collectionName
            };

            // Find duration
            var selectedVid = $scope.videosInSelectedCollection.find(function (v) { return v.guid === item.targetVideoId; });
            if (selectedVid) linkedVideo.durationInSeconds = selectedVid.length;

            $scope.listData.unshift(linkedVideo);
            successCount++;
        });

        $scope.applyFilters();
        $scope.showToaster(successCount + ' videos linked successfully!', 'success');
        $scope.closeLinkVideoModal(); // Close modal
    };

    $scope.openLinkVideoModal = function () {
        $scope.resetNewVideo();
        $scope.linkVideoView = true;
    };

    $scope.closeLinkVideoModal = function () {
        $scope.linkVideoView = false;
    };

    $scope.resetNewVideo = function () {
        $scope.newVideo = {
            classificationLevel1: '',
            classificationLevel2: '',
            instructorId: '',
            collectionName: ''
        };
        // Initialize with one empty row
        $scope.videoItems = [{ targetVideoId: '', titleName: '' }];
        $scope.videosInSelectedCollection = [];
    };


    $scope.loadDummyData = function () {
        $scope.availableInstructors = [
            { id: 'inst001', name: 'Teacher 1' },
            { id: 'inst002', name: 'Teacher 2' }
        ];

        // Dummy Collections
        $scope.bunnyCollections = [
            { name: 'Biology_Lectures', videoCount: 15 },
            { name: 'Physics_Mechanics', videoCount: 8 },
            { name: 'Chem_Organic', videoCount: 12 }
        ];

        $scope.listData = [
            { videoId: 'v1001', titleName: 'Introduction to Biology', videoDisplayKey: 'BIO-101', durationInSeconds: 1200, status: 1, classificationLevel1: 'Beginner', classificationLevel2: 'Basic', thumbnail: 'assets/img/video-placeholder.png', chapterId: '1B01' },
            { videoId: 'v1002', titleName: 'Chemical Bonding Basics', videoDisplayKey: 'CHEM-202', durationInSeconds: 3600, status: 1, classificationLevel1: 'Intermediate', classificationLevel2: 'Standard', thumbnail: 'assets/img/video-placeholder.png', chapterId: '1C04' },
            { videoId: 'v1003', titleName: 'Newton\'s Laws of Motion', videoDisplayKey: 'PHY-305', durationInSeconds: 2400, status: 0, classificationLevel1: 'Advanced', classificationLevel2: 'Core', thumbnail: 'assets/img/video-placeholder.png', chapterId: '1P05' },
            { videoId: 'v1004', titleName: 'Calculus: Derivatives', videoDisplayKey: 'MATH-401', durationInSeconds: 4500, status: 1, classificationLevel1: 'Expert', classificationLevel2: 'Premium', thumbnail: 'assets/img/video-placeholder.png', chapterId: '1M13' },
            { videoId: 'v1005', titleName: 'Organic Chemistry Reactions', videoDisplayKey: 'CHEM-250', durationInSeconds: 5000, status: 1, classificationLevel1: 'Hard', classificationLevel2: 'Elite', thumbnail: 'assets/img/video-placeholder.png', chapterId: '2C10' }
        ];
        $scope.applyFilters();
    };

    $scope.init = function () {
        console.log('Video Content Controller initialized');
        $scope.fetchAllVideos();
        // $scope.fetchCollections(); // Uncomment if needed
    };

    // Initialize controller
    $scope.init();

    // Navbar animations are now handled globally in assets/js/application.js
});
