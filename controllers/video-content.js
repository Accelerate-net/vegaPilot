var app = angular.module('videoContentApp', ['ngCookies']);

app.controller('videoContentController', function($scope, $http, $cookies, $timeout) {
    
    // Initialize scope variables
    $scope.createView = false;
    $scope.modifyVideoView = false;
    $scope.currentPage = 1;
    $scope.totalPages = 1;
    $scope.videoFilterApplied = '';
    $scope.uploadProgress = 0;
    $scope.uploadInProgress = false;
    $scope.uploadStatus = null;
    $scope.videoPreview = null;
    $scope.isDragOver = false;
    
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
    $scope.bunnyNetConfig = {
        libraryId: '475938',
        accessKey: '5244ed1d-5f30-4ba5-8837ee980f7c-898e-4d16',
        baseUrl: 'https://video.bunnycdn.com/library'
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
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
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
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
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
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4'
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
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_4mb.mp4'
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
    $scope.init = function() {
        $scope.loadVideoList();
        $scope.loadSummaryData();
        
        // Try to load collections from Bunny.net
        console.log('Initializing controller, attempting to load collections...');
        $scope.loadBunnyCollections();
        
        // Load storage data from Bunny.net
        $scope.loadBunnyStorage();
        
        // Also try a direct test after a short delay
        $timeout(function() {
            console.log('Testing API connection after initialization...');
            $scope.testBunnyConnection();
        }, 2000);
    };
    
    // Load video list from database (using dummy data for now)
    $scope.loadVideoList = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.listData = $scope.dummyVideos;
            $scope.totalPages = 1;
        }, 500);
    };
    
    // Load summary data for tiles
    $scope.loadSummaryData = function() {
        // Calculate summary from dummy data
        var total = $scope.dummyVideos.length;
        var totalDuration = $scope.dummyVideos.reduce(function(sum, video) {
            return sum + video.durationInSeconds;
        }, 0);
        var totalRecent = $scope.dummyVideos.filter(function(video) {
            // Show videos uploaded in last 30 days
            var uploadDate = new Date(video.uploadedAt || video.createdOn * 1000);
            var thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return uploadDate > thirtyDaysAgo;
        }).length;
        var totalLong = $scope.dummyVideos.filter(function(video) {
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
    $scope.loadBunnyCollections = function() {
        $scope.loadingCollections = true;
        
        // Make actual API call to Bunny.net
        $scope.fetchBunnyCollections();
    };
    
    // Load storage data from Bunny.net
    $scope.loadBunnyStorage = function() {
        console.log('Loading storage data from Bunny.net...');
        
        // Set loading state
        $scope.summaryTileData.totalStorage = 'Loading...';
        
        // Try multiple endpoints to get storage data
        var endpoints = [
            // Library info endpoint
            $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId,
            // Library statistics endpoint
            $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/statistics',
            // Library usage endpoint
            $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/usage'
        ];
        
        var tryEndpoint = function(index) {
            if (index >= endpoints.length) {
                // All endpoints failed, use fallback calculation
                console.log('All storage endpoints failed, using fallback calculation');
                $scope.calculateFallbackStorage();
                return;
            }
            
            var url = endpoints[index];
            console.log('Trying storage endpoint:', url);
            
            $http.get(url, {
                headers: {
                    'AccessKey': $scope.bunnyNetConfig.accessKey
                }
            }).then(function(response) {
                console.log('Storage API response from', url, ':', response.data);
                
                var storageData = response.data;
                var storageUsed = null;
                
                // Try different possible field names for storage
                if (storageData.storageUsed !== undefined) {
                    storageUsed = storageData.storageUsed;
                } else if (storageData.storage !== undefined) {
                    storageUsed = storageData.storage;
                } else if (storageData.used !== undefined) {
                    storageUsed = storageData.used;
                } else if (storageData.bytes !== undefined) {
                    storageUsed = storageData.bytes;
                } else if (storageData.size !== undefined) {
                    storageUsed = storageData.size;
                }
                
                if (storageUsed !== null && storageUsed !== undefined) {
                    // Convert bytes to GB
                    var storageGB = (storageUsed / (1024 * 1024 * 1024)).toFixed(2);
                    $scope.summaryTileData.totalStorage = storageGB;
                    console.log('✅ Storage updated from Bunny.net:', storageGB + ' GB');
                    $scope.showToaster('Storage data updated from Bunny.net', 'success');
                } else {
                    console.log('No storage data found in response from', url);
                    // Try next endpoint
                    tryEndpoint(index + 1);
                }
            }).catch(function(error) {
                console.error('Error fetching storage data from', url, ':', error);
                // Try next endpoint
                tryEndpoint(index + 1);
            });
        };
        
        // Start trying endpoints
        tryEndpoint(0);
    };
    
    // Fallback storage calculation
    $scope.calculateFallbackStorage = function() {
        if ($scope.bunnyCollections && $scope.bunnyCollections.length > 0) {
            var totalVideos = $scope.bunnyCollections.reduce(function(sum, collection) {
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
    $scope.fetchBunnyCollections = function() {
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
        }).then(function(response) {
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
                $scope.bunnyCollections = collections.map(function(collection) {
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
            
        }).catch(function(error) {
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
    $scope.refreshCollections = function() {
        $scope.loadBunnyCollections();
        // Also refresh storage data
        $scope.loadBunnyStorage();
    };
    
    // Handle collection selection change
    $scope.onCollectionChange = function() {
        if ($scope.newVideo.collectionName === '__custom__') {
            $scope.newVideo.customCollectionName = '';
        }
    };
    
    // Create new collection
    $scope.createCollection = function() {
        if (!$scope.newVideo.customCollectionName) {
            $scope.showToaster('Please enter a collection name', 'error');
            return;
        }
        
        $scope.creatingCollection = true;
        
        // Make actual API call to Bunny.net
        $scope.createBunnyCollection();
    };
    
    // Load fallback collections if API fails
    $scope.loadFallbackCollections = function() {
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
    $scope.createBunnyCollection = function() {
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
        }).then(function(response) {
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
            
        }).catch(function(error) {
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
    $scope.addNewVideo = function() {
        $scope.createView = true;
        $scope.modifyVideoView = false;
        $scope.resetNewVideo();
    };
    
    // Reset new video form
    $scope.resetNewVideo = function() {
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
    $scope.testFileSelect = function() {
        console.log('Test function called');
        console.log('Current newVideo:', $scope.newVideo);
        console.log('Current videoPreview:', $scope.videoPreview);
        $scope.showToaster('Test function called - check console', 'info');
    };
    
    // Show debug information
    $scope.showDebugInfo = function() {
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
    $scope.testBunnyConnection = function() {
        console.log('Testing Bunny.net API connection...');
        $scope.showToaster('Testing API connection...', 'info');
        
        var testUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/collections?page=1&itemsPerPage=1';
        
        console.log('Testing URL:', testUrl);
        console.log('Using API Key:', $scope.bunnyNetConfig.accessKey);
        
        $http.get(testUrl, {
            headers: {
                'AccessKey': $scope.bunnyNetConfig.accessKey
            }
        }).then(function(response) {
            console.log('✅ API connection successful!');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            console.log('Response structure:', JSON.stringify(response.data, null, 2));
            
            if (response.data && response.data.data) {
                console.log('Collections found:', response.data.data.length);
                response.data.data.forEach(function(col, index) {
                    console.log('Collection ' + index + ':', col);
                });
            } else if (response.data && Array.isArray(response.data)) {
                console.log('Direct array response, collections found:', response.data.length);
                response.data.forEach(function(col, index) {
                    console.log('Collection ' + index + ':', col);
                });
            } else {
                console.log('Unexpected response structure:', Object.keys(response.data || {}));
            }
            
            $scope.showToaster('✅ Bunny.net API connection successful! Check console for details.', 'success');
        }).catch(function(error) {
            console.error('❌ API connection failed:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.data?.message || error.statusText);
            console.error('Full error:', error);
            
            $scope.showToaster('❌ API connection failed: ' + (error.data?.message || error.statusText || 'Unknown error'), 'error');
        });
    };
    
    // Handle video file selection
    $scope.onVideoFileSelect = function(event) {
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
    
    // Get video duration from file
    $scope.getVideoDuration = function(file) {
        var video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
            $scope.$apply(function() {
                $scope.newVideo.durationInSeconds = Math.round(video.duration);
            });
        };
        
        video.src = URL.createObjectURL(file);
    };
    
    // Upload video to Bunny.net
    $scope.uploadVideo = function() {
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
        var selectedCollection = $scope.bunnyCollections.find(function(col) {
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
        
        // Try different upload methods
        $scope.tryUploadMethod1(selectedCollection);
    };
    
    // Method 1: Direct file upload with proper headers
    $scope.tryUploadMethod1 = function(selectedCollection) {
        console.log('Trying Method 1: Direct file upload');
        
        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos';
        
        // Create FormData
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);
        
        // Add metadata as separate fields
        formData.append('title', $scope.newVideo.titleName);
        formData.append('description', $scope.newVideo.titleName + ' - Uploaded via VegaPilot');
        formData.append('tags', 'vegapilot,upload');
        formData.append('collectionId', selectedCollection.id);
        
        // Create XMLHttpRequest for upload with progress tracking
        var xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function() {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });
        
        // Upload complete
        xhr.addEventListener('load', function() {
            console.log('Method 1 response:', xhr.status, xhr.responseText);
            
            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 1 failed with 415, trying Method 2...');
                $scope.tryUploadMethod2(selectedCollection);
            } else {
                $scope.handleUploadError(xhr.status, xhr.responseText);
            }
        });
        
        // Upload error
        xhr.addEventListener('error', function() {
            console.log('Method 1 error, trying Method 2...');
            $scope.tryUploadMethod2(selectedCollection);
        });
        
        // Set request headers
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        
        // Send the request
        xhr.send(formData);
    };
    
    // Method 2: Upload with different content type handling
    $scope.tryUploadMethod2 = function(selectedCollection) {
        console.log('Trying Method 2: Alternative upload method');
        
        var uploadUrl = $scope.bunnyNetConfig.baseUrl + '/' + $scope.bunnyNetConfig.libraryId + '/videos';
        
        // Create FormData
        var formData = new FormData();
        formData.append('file', $scope.newVideo.file);
        
        // Add metadata as JSON string
        var metadata = {
            title: $scope.newVideo.titleName,
            description: $scope.newVideo.titleName + ' - Uploaded via VegaPilot',
            tags: ['vegapilot', 'upload'],
            collectionId: selectedCollection.id
        };
        formData.append('metadata', JSON.stringify(metadata));
        
        // Create XMLHttpRequest
        var xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function() {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });
        
        // Upload complete
        xhr.addEventListener('load', function() {
            console.log('Method 2 response:', xhr.status, xhr.responseText);
            
            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else if (xhr.status === 415) {
                console.log('Method 2 failed with 415, trying Method 3...');
                $scope.tryUploadMethod3(selectedCollection);
            } else {
                $scope.handleUploadError(xhr.status, xhr.responseText);
            }
        });
        
        // Upload error
        xhr.addEventListener('error', function() {
            console.log('Method 2 error, trying Method 3...');
            $scope.tryUploadMethod3(selectedCollection);
        });
        
        // Set request headers
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        
        // Send the request
        xhr.send(formData);
    };
    
    // Method 3: Upload using fetch API with different approach
    $scope.tryUploadMethod3 = function(selectedCollection) {
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
        }).then(function(response) {
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
        }).then(function(responseText) {
            if (responseText) {
                $scope.handleUploadSuccess(responseText, selectedCollection);
            }
        }).catch(function(error) {
            console.log('Method 3 error, trying Method 4...');
            $scope.tryUploadMethod4(selectedCollection);
        });
    };
    
    // Method 4: Upload to collection endpoint directly
    $scope.tryUploadMethod4 = function(selectedCollection) {
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
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;
                $scope.$apply(function() {
                    $scope.uploadProgress = Math.round(percentComplete);
                    $scope.updateUploadStatus(percentComplete, selectedCollection.name);
                });
            }
        });
        
        // Upload complete
        xhr.addEventListener('load', function() {
            console.log('Method 4 response:', xhr.status, xhr.responseText);
            
            if (xhr.status === 200 || xhr.status === 201) {
                $scope.handleUploadSuccess(xhr.responseText, selectedCollection);
            } else {
                console.log('All upload methods failed. Final error:', xhr.status, xhr.responseText);
                $scope.handleUploadError(xhr.status, xhr.responseText);
            }
        });
        
        // Upload error
        xhr.addEventListener('error', function() {
            console.log('All upload methods failed');
            $scope.handleUploadError(0, 'All upload methods failed');
        });
        
        // Set request headers
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('AccessKey', $scope.bunnyNetConfig.accessKey);
        
        // Send the request
        xhr.send(formData);
    };
    
    // Update upload status based on progress
    $scope.updateUploadStatus = function(percentComplete, collectionName) {
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
    $scope.handleUploadSuccess = function(responseText, selectedCollection) {
        var response = JSON.parse(responseText);
        console.log('✅ Upload successful:', response);
        
        $scope.$apply(function() {
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
            setTimeout(function() {
                $scope.uploadInProgress = false;
                $scope.resetNewVideo();
                $scope.showToaster('Video added to your library!', 'success');
            }, 2000);
        });
    };
    
    // Handle upload error
    $scope.handleUploadError = function(status, responseText) {
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
        
        $scope.$apply(function() {
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
    $scope.isFormComplete = function() {
        return $scope.newVideo.file && 
               $scope.newVideo.titleName && 
               $scope.newVideo.titleName.trim() !== '' &&
               $scope.newVideo.collectionName && 
               $scope.newVideo.collectionName !== '__custom__' &&
               $scope.newVideo.collectionName !== '';
    };
    
    // Generate UUID for demo purposes
    $scope.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    // Cancel upload and return to list
    $scope.cancelUpload = function() {
        $scope.createView = false;
        $scope.modifyVideoView = false;
        $scope.uploadInProgress = false;
        $scope.uploadProgress = 0;
        $scope.uploadStatus = null;
        $scope.resetNewVideo();
    };
    
    // Open video for viewing
    $scope.openVideo = function(videoData) {
        // This could open a modal or navigate to video player
        console.log('Opening video:', videoData);
    };
    
    // View video details
    $scope.viewVideo = function(videoData) {
        $scope.modifyVideoData = angular.copy(videoData);
        $scope.createView = true;
        $scope.modifyVideoView = true;
    };
    
    // Modify video
    $scope.modifyVideo = function(videoId) {
        var video = $scope.dummyVideos.find(function(v) {
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
    $scope.saveVideoChanges = function() {
        var index = $scope.dummyVideos.findIndex(function(v) {
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
    $scope.goBackToList = function() {
        $scope.createView = false;
        $scope.modifyVideoView = false;
        $scope.modifyVideoData = {};
    };
    
    // Quick filter videos
    $scope.quickFilterVideos = function(filter) {
        $scope.videoFilterApplied = filter;
        $scope.currentPage = 1;
        
        if (filter === 'ALL') {
            $scope.listData = $scope.dummyVideos;
        } else if (filter === 'RECENT') {
            // Show recent videos (last 10)
            $scope.listData = $scope.dummyVideos.slice(0, 10);
        } else if (filter === 'LONG') {
            // Show videos longer than 5 minutes
            $scope.listData = $scope.dummyVideos.filter(function(video) {
                return video.durationInSeconds > 300;
            });
        }
    };
    
    // Remove filter on videos
    $scope.removeFilterOnVideos = function() {
        $scope.videoFilterApplied = '';
        $scope.currentPage = 1;
        $scope.listData = $scope.dummyVideos;
    };
    
    // Pagination functions
    $scope.goLeft = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadVideoList();
        }
    };
    
    $scope.goRight = function() {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
            $scope.loadVideoList();
        }
    };
    
    // Utility functions
    $scope.formatDuration = function(seconds) {
        if (!seconds) return '0:00';
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    };
    

    
    $scope.copyToClipboard = function(text, event) {
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
            $timeout(function() {
                copiedMessage.style.display = 'none';
            }, 1000);
        }
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
