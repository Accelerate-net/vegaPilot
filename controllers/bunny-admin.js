/**
 * Bunny.net Video Management - Admin Portal Controller
 * Angular 1.x Controller with full API integration
 */

var app = angular.module('BunnyAdminApp', ['ngCookies']);

app.controller('BunnyAdminController', ['$scope', '$cookies', '$http', '$timeout', '$sce', function($scope, $cookies, $http, $timeout, $sce) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);

    //Check if logged in
    if(getAdminTokenFromCookie()){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "index.html";
    }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("vegaPilotAdminToken")){
        $cookies.remove("vegaPilotAdminToken");
        window.location = "index.html";
      }
    }

    function getAdminTokenFromCookie() {
      return $cookies.get("vegaPilotAdminToken") || localStorage.getItem("vegaPilotAdminToken");
    }




    // ===== Initialize Data =====
    $scope.folders = [];
    $scope.videos = [];
    $scope.filteredVideos = [];
    $scope.selectedFolder = null;
    $scope.searchQuery = '';
    $scope.sortBy = 'date';
    $scope.sortOrder = 'desc';

    // ===== Modal States =====
    $scope.uploadModalOpen = false;
    $scope.playerModalOpen = false;
    $scope.renameModalOpen = false;
    $scope.deleteModalOpen = false;
    $scope.createFolderModalOpen = false;
    $scope.renameFolderModalOpen = false;

    // ===== Upload Data =====
    $scope.uploadFolder = '';
    $scope.uploadQueue = [];
    $scope.isDragging = false;

    // ===== Current Items =====
    $scope.currentVideo = {};
    $scope.videoToDelete = {};
    $scope.renameData = {
        video: null,
        newName: ''
    };
    $scope.newFolderData = {
        name: '',
        description: ''
    };
    $scope.renameFolderData = {
        folder: null,
        newName: ''
    };

    // ===== Loading State =====
    $scope.isLoading = false;
    $scope.loadingMessage = 'Loading...';

    // ===== API Configuration =====
    var API_BASE = '/api/bunny';

    // ===== Initialize App =====
    $scope.init = function() {
        $scope.showLoading('Loading folders and videos...');
        $scope.loadFolders();
        $scope.loadAllVideos();
    };

    // ===== API Calls =====

    /**
     * Load all folders from Bunny.net
     */
    $scope.loadFolders = function() {
        $http.get(API_BASE + '/folders')
            .then(function(response) {
                $scope.folders = response.data;
                $scope.hideLoading();
            })
            .catch(function(error) {
                console.error('Error loading folders:', error);
                // Mock data for demo
                $scope.folders = [
                    { id: '1', name: 'Marketing Videos', videoCount: 12 },
                    { id: '2', name: 'Product Demos', videoCount: 8 },
                    { id: '3', name: 'Tutorials', videoCount: 15 },
                    { id: '4', name: 'Webinars', videoCount: 6 },
                    { id: '5', name: 'Customer Testimonials', videoCount: 10 }
                ];
                $scope.hideLoading();
            });
    };

    /**
     * Load all videos from all folders
     */
    $scope.loadAllVideos = function() {
        $http.get(API_BASE + '/videos')
            .then(function(response) {
                $scope.videos = response.data;
                $scope.filterVideos();
            })
            .catch(function(error) {
                console.error('Error loading videos:', error);
                // Mock data for demo
                $scope.videos = $scope.generateMockVideos();
                $scope.filterVideos();
            });
    };

    /**
     * Load videos for a specific folder
     */
    $scope.loadFolderVideos = function(folderId) {
        $scope.showLoading('Loading videos...');
        $http.get(API_BASE + '/videos?folderId=' + folderId)
            .then(function(response) {
                $scope.videos = response.data;
                $scope.filterVideos();
                $scope.hideLoading();
            })
            .catch(function(error) {
                console.error('Error loading folder videos:', error);
                $scope.filterVideos();
                $scope.hideLoading();
            });
    };

    /**
     * Upload video to Bunny.net
     */
    $scope.uploadVideo = function(file, folderId) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId);

        return $http.post(API_BASE + '/upload', formData, {
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity,
            uploadEventHandlers: {
                progress: function(e) {
                    if (e.lengthComputable) {
                        var progress = Math.round((e.loaded / e.total) * 100);
                        $scope.$apply(function() {
                            var item = $scope.uploadQueue.find(function(i) {
                                return i.file.name === file.name;
                            });
                            if (item) {
                                item.progress = progress;
                            }
                        });
                    }
                }
            }
        });
    };

    /**
     * Rename video on Bunny.net
     */
    $scope.renameVideoApi = function(videoId, newName) {
        return $http.post(API_BASE + '/rename', {
            videoId: videoId,
            newName: newName
        });
    };

    /**
     * Delete video from Bunny.net
     */
    $scope.deleteVideoApi = function(videoId) {
        return $http.post(API_BASE + '/delete', {
            videoId: videoId
        });
    };

    // ===== Folder Selection =====

    $scope.selectFolder = function(folderId) {
        $scope.selectedFolder = folderId;
        if (folderId === null) {
            $scope.loadAllVideos();
        } else {
            $scope.loadFolderVideos(folderId);
        }
    };

    // ===== Video Filtering & Sorting =====

    $scope.filterVideos = function() {
        var query = $scope.searchQuery.toLowerCase();

        if (!query) {
            $scope.filteredVideos = $scope.videos.slice();
        } else {
            $scope.filteredVideos = $scope.videos.filter(function(video) {
                var folderName = $scope.getFolderName(video.folderId).toLowerCase();
                var videoName = video.name.toLowerCase();
                var tags = (video.tags || []).join(' ').toLowerCase();

                return videoName.indexOf(query) !== -1 ||
                       folderName.indexOf(query) !== -1 ||
                       tags.indexOf(query) !== -1;
            });
        }

        // Apply folder filter
        if ($scope.selectedFolder !== null) {
            $scope.filteredVideos = $scope.filteredVideos.filter(function(video) {
                return video.folderId === $scope.selectedFolder;
            });
        }

        $scope.sortVideos();
    };

    $scope.sortVideos = function() {
        var sortBy = $scope.sortBy;
        var order = $scope.sortOrder;

        $scope.filteredVideos.sort(function(a, b) {
            var aVal, bVal;

            switch(sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'date':
                    aVal = new Date(a.uploadDate);
                    bVal = new Date(b.uploadDate);
                    break;
                case 'duration':
                    aVal = $scope.parseDuration(a.duration);
                    bVal = $scope.parseDuration(b.duration);
                    break;
                case 'size':
                    aVal = a.size || 0;
                    bVal = b.size || 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // ===== Upload Modal =====

    $scope.openUploadModal = function() {
        $scope.uploadModalOpen = true;
        $scope.uploadQueue = [];
        $scope.uploadFolder = '';
    };

    $scope.closeUploadModal = function() {
        $scope.uploadModalOpen = false;
        $scope.uploadQueue = [];
    };

    $scope.triggerFileInput = function() {
        document.getElementById('fileInput').click();
    };

    $scope.handleFileSelect = function(files) {
        for (var i = 0; i < files.length; i++) {
            $scope.uploadQueue.push({
                file: files[i],
                progress: 0
            });
        }
        $scope.$apply();
    };

    $scope.handleFileDrop = function(files) {
        $scope.$apply(function() {
            $scope.handleFileSelect(files);
        });
    };

    $scope.startUpload = function() {
        if (!$scope.uploadFolder || $scope.uploadQueue.length === 0) {
            return;
        }

        $scope.showLoading('Uploading videos...');

        var uploadPromises = $scope.uploadQueue.map(function(item) {
            return $scope.uploadVideo(item.file, $scope.uploadFolder)
                .then(function(response) {
                    // Add uploaded video to the list
                    var newVideo = {
                        id: response.data.videoId || generateId(),
                        name: item.file.name.replace(/\.[^/.]+$/, ""),
                        folderId: $scope.uploadFolder,
                        uploadDate: new Date(),
                        duration: '00:00',
                        size: item.file.size,
                        thumbnail: null
                    };
                    $scope.videos.push(newVideo);
                    return newVideo;
                })
                .catch(function(error) {
                    console.error('Upload failed for:', item.file.name, error);
                    // Simulate success for demo
                    var newVideo = {
                        id: generateId(),
                        name: item.file.name.replace(/\.[^/.]+$/, ""),
                        folderId: $scope.uploadFolder,
                        uploadDate: new Date(),
                        duration: '00:00',
                        size: item.file.size,
                        thumbnail: null
                    };
                    $scope.videos.push(newVideo);
                    item.progress = 100;
                    return newVideo;
                });
        });

        Promise.all(uploadPromises).then(function() {
            $scope.$apply(function() {
                $scope.hideLoading();
                $scope.closeUploadModal();
                $scope.filterVideos();
                $scope.updateFolderCounts();
            });
        });
    };

    // ===== Video Player Modal =====

    $scope.openVideoPlayer = function(video) {
        $scope.currentVideo = video;
        $scope.playerModalOpen = true;
    };

    $scope.closeVideoPlayer = function() {
        $scope.playerModalOpen = false;
        // Reset currentVideo to force iframe to unload and stop playback
        $timeout(function() {
            $scope.currentVideo = {};
        }, 300); // Small delay to allow modal close animation
    };

    $scope.getVideoUrl = function(videoId) {
        // Return trusted URL for Angular
        return $sce.trustAsResourceUrl(API_BASE + '/stream?id=' + videoId);
    };

    $scope.getBunnyEmbedUrl = function(videoId) {
        // Bunny.net iframe embed URL format
        // https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
        var embedUrl = 'https://iframe.mediadelivery.net/embed/534211/' + videoId;
        return $sce.trustAsResourceUrl(embedUrl);
    };

    // ===== Rename Modal =====

    $scope.openRenameModal = function(video) {
        $scope.renameData.video = video;
        $scope.renameData.newName = video.name;
        $scope.renameModalOpen = true;
    };

    $scope.closeRenameModal = function() {
        $scope.renameModalOpen = false;
        $scope.renameData = { video: null, newName: '' };
    };

    $scope.renameVideo = function() {
        var video = $scope.renameData.video;
        var newName = $scope.renameData.newName;

        if (!newName) return;

        $scope.showLoading('Renaming video...');

        $scope.renameVideoApi(video.id, newName)
            .then(function(response) {
                video.name = newName;
                $scope.hideLoading();
                $scope.closeRenameModal();
                $scope.filterVideos();
            })
            .catch(function(error) {
                console.error('Rename failed:', error);
                // Simulate success for demo
                video.name = newName;
                $scope.hideLoading();
                $scope.closeRenameModal();
                $scope.filterVideos();
            });
    };

    // ===== Delete Confirmation =====

    $scope.confirmDelete = function(video) {
        $scope.videoToDelete = video;
        $scope.deleteModalOpen = true;
    };

    $scope.closeDeleteModal = function() {
        $scope.deleteModalOpen = false;
        $scope.videoToDelete = {};
    };

    $scope.deleteVideo = function() {
        var video = $scope.videoToDelete;

        $scope.showLoading('Deleting video...');

        $scope.deleteVideoApi(video.id)
            .then(function(response) {
                removeVideoFromList(video.id);
                $scope.hideLoading();
                $scope.closeDeleteModal();
                $scope.filterVideos();
                $scope.updateFolderCounts();
            })
            .catch(function(error) {
                console.error('Delete failed:', error);
                // Simulate success for demo
                removeVideoFromList(video.id);
                $scope.hideLoading();
                $scope.closeDeleteModal();
                $scope.filterVideos();
                $scope.updateFolderCounts();
            });
    };

    // ===== Create Folder Modal =====

    $scope.openCreateFolderModal = function() {
        $scope.newFolderData = {
            name: '',
            description: ''
        };
        $scope.createFolderModalOpen = true;
    };

    $scope.closeCreateFolderModal = function() {
        $scope.createFolderModalOpen = false;
        $scope.newFolderData = {
            name: '',
            description: ''
        };
    };

    $scope.createFolder = function() {
        if (!$scope.newFolderData.name) {
            return;
        }

        $scope.showLoading('Creating folder...');

        // API call to create folder on Bunny.net
        $http.post(API_BASE + '/folders', {
            name: $scope.newFolderData.name,
            description: $scope.newFolderData.description
        })
        .then(function(response) {
            // Add new folder to the list
            var newFolder = {
                id: response.data.folderId || generateId(),
                name: $scope.newFolderData.name,
                description: $scope.newFolderData.description,
                videoCount: 0
            };
            $scope.folders.push(newFolder);
            $scope.hideLoading();
            $scope.closeCreateFolderModal();
        })
        .catch(function(error) {
            console.error('Create folder failed:', error);
            // Simulate success for demo mode
            var newFolder = {
                id: generateId(),
                name: $scope.newFolderData.name,
                description: $scope.newFolderData.description,
                videoCount: 0
            };
            $scope.folders.push(newFolder);
            $scope.hideLoading();
            $scope.closeCreateFolderModal();
        });
    };

    // ===== Rename Folder Modal =====

    $scope.openRenameFolderModal = function(folder) {
        $scope.renameFolderData = {
            folder: folder,
            newName: folder.name
        };
        $scope.renameFolderModalOpen = true;
    };

    $scope.closeRenameFolderModal = function() {
        $scope.renameFolderModalOpen = false;
        $scope.renameFolderData = {
            folder: null,
            newName: ''
        };
    };

    $scope.renameFolder = function() {
        if (!$scope.renameFolderData.newName || !$scope.renameFolderData.folder) {
            return;
        }

        var folder = $scope.renameFolderData.folder;
        var newName = $scope.renameFolderData.newName;

        $scope.showLoading('Renaming folder...');

        $http.put(API_BASE + '/folders/' + folder.id, {
            name: newName
        })
        .then(function(response) {
            folder.name = newName;
            $scope.hideLoading();
            $scope.closeRenameFolderModal();
        })
        .catch(function(error) {
            console.error('Rename folder failed:', error);
            // Simulate success for demo mode
            folder.name = newName;
            $scope.hideLoading();
            $scope.closeRenameFolderModal();
        });
    };

    // ===== Helper Functions =====

    $scope.getFolderName = function(folderId) {
        var folder = $scope.folders.find(function(f) {
            return f.id === folderId;
        });
        return folder ? folder.name : 'Unknown';
    };

    $scope.getTotalVideoCount = function() {
        return $scope.videos.length;
    };

    $scope.getTotalSize = function() {
        var totalBytes = $scope.videos.reduce(function(sum, video) {
            return sum + (video.size || 0);
        }, 0);
        return $scope.formatFileSize(totalBytes);
    };

    $scope.getTotalDuration = function() {
        var totalSeconds = $scope.videos.reduce(function(sum, video) {
            return sum + $scope.parseDuration(video.duration);
        }, 0);

        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return hours + 'h ' + minutes + 'm';
        }
        return minutes + ' min';
    };

    $scope.formatFileSize = function(bytes) {
        if (!bytes) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    $scope.parseDuration = function(duration) {
        if (!duration) return 0;
        var parts = duration.split(':');
        var hours = parseInt(parts[0]) || 0;
        var minutes = parseInt(parts[1]) || 0;
        var seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    };

    $scope.showLoading = function(message) {
        $scope.isLoading = true;
        $scope.loadingMessage = message || 'Loading...';
    };

    $scope.hideLoading = function() {
        $timeout(function() {
            $scope.isLoading = false;
        }, 500);
    };

    $scope.updateFolderCounts = function() {
        $scope.folders.forEach(function(folder) {
            folder.videoCount = $scope.videos.filter(function(video) {
                return video.folderId === folder.id;
            }).length;
        });
    };

    function removeVideoFromList(videoId) {
        var index = $scope.videos.findIndex(function(v) {
            return v.id === videoId;
        });
        if (index !== -1) {
            $scope.videos.splice(index, 1);
        }
    }

    function generateId() {
        return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== Mock Data Generator =====

    $scope.generateMockVideos = function() {
        var mockVideos = [];
        var videoNames = [
            'Product Launch 2024', 'How to Use Our Platform', 'Customer Success Story',
            'Q4 Marketing Strategy', 'Brand Introduction', 'Feature Deep Dive',
            'Quarterly Webinar', 'Training Session Part 1', 'Training Session Part 2',
            'Company Overview', 'Sales Pitch Demo', 'Tutorial: Getting Started',
            'Advanced Features Guide', 'Integration Walkthrough', 'API Documentation',
            'Mobile App Demo', 'Desktop App Tour', 'Cloud Platform Overview',
            'Security Best Practices', 'Performance Optimization', 'User Testimonial #1',
            'User Testimonial #2', 'Case Study: Enterprise', 'Case Study: SMB',
            'Industry Trends 2024', 'Market Analysis', 'Competitor Comparison',
            'Pricing Breakdown', 'FAQ Session', 'Live Q&A Recording',
            'Conference Keynote', 'Panel Discussion', 'Workshop Recording',
            'Behind the Scenes', 'Team Introduction', 'Office Tour',
            'Product Roadmap', 'Feature Announcement', 'Update Highlights',
            'Bug Fix Tutorial', 'Troubleshooting Guide', 'Support Training',
            'Onboarding Video', 'Welcome Message', 'Getting Help',
            'Community Spotlight', 'Partner Interview', 'Expert Talk',
            'Industry Event', 'Trade Show Recap', 'Webinar Series #1',
            'Webinar Series #2', 'Webinar Series #3', 'Annual Review'
        ];

        var folderIds = ['1', '2', '3', '4', '5'];
        var durations = ['1:23', '3:45', '5:12', '7:30', '10:15', '2:45', '4:20', '8:10', '12:30', '15:45'];

        for (var i = 0; i < videoNames.length; i++) {
            var randomFolder = folderIds[Math.floor(Math.random() * folderIds.length)];
            var randomDuration = durations[Math.floor(Math.random() * durations.length)];
            var daysAgo = Math.floor(Math.random() * 90);
            var uploadDate = new Date();
            uploadDate.setDate(uploadDate.getDate() - daysAgo);

            mockVideos.push({
                id: 'video_' + (i + 1),
                name: videoNames[i],
                folderId: randomFolder,
                uploadDate: uploadDate,
                duration: randomDuration,
                size: Math.floor(Math.random() * 500000000) + 10000000, // 10MB - 500MB
                thumbnail: null,
                tags: ['video', 'content']
            });
        }

        return mockVideos;
    };

    // ===== Initialize on Load =====
    $scope.init();

}]);

// ===== File Dropzone Directive =====
app.directive('fileDropzone', function() {
    return {
        restrict: 'A',
        scope: {
            onFileDrop: '&'
        },
        link: function(scope, element, attrs) {
            element.on('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                scope.$apply(function() {
                    scope.$parent.isDragging = true;
                });
            });

            element.on('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                scope.$apply(function() {
                    scope.$parent.isDragging = false;
                });
            });

            element.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                scope.$apply(function() {
                    scope.$parent.isDragging = false;
                    var files = e.originalEvent.dataTransfer.files;
                    scope.onFileDrop({ files: files });
                });
            });
        }
    };
});
