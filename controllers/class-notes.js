/**
 * Class Notes Controller
 * Angular 1.x controller for uploading chapter-wise class notes (PDF) to
 * Bunny.net Edge Storage and persisting their metadata.
 *
 * Flow:
 *   1. Admin picks a Chapter from the dropdown and attaches a PDF.
 *   2. The PDF is uploaded to Bunny Storage via the generic storage proxy
 *      (folder: `class-notes`). The Bunny access key never reaches the browser.
 *   3. The returned CDN URL + object name, plus the chapter context, are POSTed
 *      to update-classnotes-metadata.php to persist the record.
 */

var app = angular.module('classNotesApp', ['ngCookies']);

// ===== File input -> ng-model directive (Angular 1.x has no native binding) =====
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var setter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    setter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.controller('classNotesController', ['$scope', '$http', '$cookies', '$timeout', function ($scope, $http, $cookies, $timeout) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);

    // ===== Auth =====
    if (getAdminTokenFromCookie()) {
        $scope.isLoggedIn = true;
    } else {
        $scope.isLoggedIn = false;
        window.location = "index.html";
    }

    $scope.logoutNow = function () {
        if ($cookies.get("vegaPilotAdminToken")) {
            $cookies.remove("vegaPilotAdminToken");
        }
        window.location = "index.html";
    };

    function getAdminTokenFromCookie() {
        return $cookies.get("vegaPilotAdminToken") || localStorage.getItem("vegaPilotAdminToken");
    }

    // ===== API Configuration =====
    const BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "http://localhost:3000"
        : "https://crisprtech.app/crispr-apis";

    // Metadata endpoints (sibling PHP scripts under /restricted/classnotes).
    $scope.apiBaseUrl = BASE_URL + '/restricted/classnotes';
    // Top-level storage-zone folder that owns class notes (sent as `path`).
    var STORAGE_FOLDER = 'class-notes';

    var MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB — mirrors the backend ceiling.

    // ===== State =====
    $scope.chapters = [];          // flattened chapter list for the dropdown
    $scope.notes = [];             // uploaded class-note records
    $scope.filteredNotes = [];
    $scope.isLoading = true;       // list loading
    $scope.isUploading = false;
    $scope.uploadProgress = 0;

    // Server-driven list controls (see list-classnotes-metadata.php params).
    $scope.searchQuery = '';
    $scope.filterChapterId = '';
    $scope.includeHidden = false;

    // Pagination
    $scope.currentPage = 1;
    $scope.pageSize = 50;
    $scope.totalItems = 0;
    $scope.totalPages = 1;

    // Upload form model
    $scope.form = {
        chapterId: '',
        file: null
    };

    $scope.summaryData = {
        totalNotes: 0,
        totalChapters: 0,
        totalSize: 0
    };

    // Skeleton loader helper
    $scope.getSkeletonRows = function () {
        return new Array(5);
    };

    // ===== Init =====
    // Load chapters first so the notes list can enrich rows (title/subject) from
    // the syllabus; still load notes even if the syllabus fetch fails.
    $scope.init = function () {
        $scope.loadChapters().finally(function () {
            $scope.loadNotes();
        });
    };

    // ===== Chapters (from syllabus) =====
    // Flatten SYLLABUS_FIXED.json (segment -> module(subject) -> chapters) into a
    // single list suitable for a <select>.
    $scope.loadChapters = function () {
        return $http.get('SYLLABUS_FIXED.json')
            .then(function (response) {
                var flat = [];
                var segments = (response.data && response.data.syllabus) || [];
                segments.forEach(function (segment) {
                    (segment.modules || []).forEach(function (module) {
                        (module.chapters || []).forEach(function (chapter) {
                            flat.push({
                                id: chapter.id,
                                subject: module.moduleName,
                                segment: segment.name,
                                chapterNumber: chapter.chapterNumber,
                                title: chapter.title,
                                label: module.moduleName + ' • Ch ' + chapter.chapterNumber + ' — ' + chapter.title
                            });
                        });
                    });
                });
                $scope.chapters = flat;
                $scope.summaryData.totalChapters = flat.length;
            })
            .catch(function (error) {
                console.warn('Could not load SYLLABUS_FIXED.json:', error);
                $scope.showToaster('Could not load chapters list.', 'error');
            });
    };

    $scope.getChapterById = function (id) {
        return $scope.chapters.find(function (c) {
            return String(c.id) === String(id);
        });
    };

    // ===== Load existing notes (server-side search / filter / paging) =====
    $scope.loadNotes = function () {
        $scope.isLoading = true;

        var params = {
            page: $scope.currentPage,
            size: $scope.pageSize,
            includeHidden: $scope.includeHidden
        };
        if ($scope.searchQuery && $scope.searchQuery.trim()) {
            params.searchKey = $scope.searchQuery.trim();
        }
        if ($scope.filterChapterId) {
            params.chapterId = $scope.filterChapterId;
        }

        $http({
            method: 'GET',
            url: $scope.apiBaseUrl + '/list-classnotes-metadata.php',
            params: params,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            var body = response.data || {};
            var rows = body.data || body.notes || [];
            $scope.notes = rows.map(mapNote);
            $scope.filteredNotes = $scope.notes;

            // Pagination metadata (mirrors the catalog endpoint shape).
            $scope.currentPage = body.page || $scope.currentPage;
            $scope.pageSize = body.size || $scope.pageSize;
            $scope.totalItems = (body.total != null) ? body.total : $scope.notes.length;
            $scope.totalPages = body.totalPages || Math.max(1, Math.ceil($scope.totalItems / $scope.pageSize));

            $scope.calculateSummary();
        }).catch(function (error) {
            console.warn('Could not load class notes:', error);
            $scope.notes = [];
            $scope.filteredNotes = [];
            $scope.totalItems = 0;
            $scope.totalPages = 1;
        }).finally(function () {
            $scope.isLoading = false;
        });
    };

    function mapNote(row) {
        var chapterId = row.chapterId || row.fk_id_chapter;
        var fileUrl = row.fileUrl || row.url || row.cdnUrl || '';
        var fileName = row.fileName || row.objectName || basenameFromUrl(fileUrl);
        // Enrich from the syllabus when the backend row doesn't carry display fields.
        var chapter = $scope.getChapterById(chapterId);
        return {
            id: row.id,
            chapterId: chapterId,
            chapterTitle: row.chapterTitle || row.title || (chapter && chapter.title),
            subject: row.subject || (chapter && chapter.subject),
            fileName: fileName,
            displayName: row.displayName || row.originalName || prettyNameFromStored(fileName),
            fileUrl: fileUrl,
            fileSize: row.fileSize || row.size || 0,
            hidden: row.hidden || row.isHidden || false,
            uploadedOn: row.uploadedOn || row.createdOn
        };
    }

    function basenameFromUrl(url) {
        if (!url) return '';
        try {
            var path = url.split('?')[0].split('#')[0];
            return decodeURIComponent(path.substring(path.lastIndexOf('/') + 1));
        } catch (e) {
            return url;
        }
    }

    // Recover a friendly name from our {uuid}_{ddmmYYYY}_{base}.ext convention.
    function prettyNameFromStored(name) {
        if (!name) return '';
        var m = /^[0-9a-fA-F-]{8,}_\d{8}_(.+)$/.exec(name);
        return m ? m[1] : name;
    }

    // ===== Summary =====
    $scope.calculateSummary = function () {
        // Total reflects the full result set; size is summed over the loaded page.
        $scope.summaryData.totalNotes = $scope.totalItems || $scope.notes.length;
        $scope.summaryData.totalSize = $scope.notes.reduce(function (sum, n) {
            return sum + (Number(n.fileSize) || 0);
        }, 0);
    };

    // ===== Search / Filter (server-side) =====
    // Any filter change resets to page 1 and re-queries. Search is debounced so
    // we don't fire a request per keystroke.
    var searchDebounce = null;
    $scope.applyFilters = function () {
        $scope.currentPage = 1;
        if (searchDebounce) $timeout.cancel(searchDebounce);
        searchDebounce = $timeout(function () {
            $scope.loadNotes();
        }, 350);
    };

    // Immediate re-query (chapter dropdown, includeHidden toggle).
    $scope.reloadNotes = function () {
        $scope.currentPage = 1;
        $scope.loadNotes();
    };

    $scope.clearAllFilters = function () {
        $scope.searchQuery = '';
        $scope.filterChapterId = '';
        $scope.includeHidden = false;
        $scope.reloadNotes();
    };

    // ===== Pagination =====
    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.totalPages && page !== $scope.currentPage) {
            $scope.currentPage = page;
            $scope.loadNotes();
        }
    };

    $scope.previousPage = function () {
        $scope.goToPage($scope.currentPage - 1);
    };

    $scope.nextPage = function () {
        $scope.goToPage($scope.currentPage + 1);
    };

    $scope.changePageSize = function () {
        $scope.currentPage = 1;
        $scope.loadNotes();
    };

    $scope.getStartIndex = function () {
        return $scope.totalItems === 0 ? 0 : ($scope.currentPage - 1) * $scope.pageSize + 1;
    };

    $scope.getEndIndex = function () {
        return Math.min($scope.currentPage * $scope.pageSize, $scope.totalItems);
    };

    $scope.getPageNumbers = function () {
        var pages = [];
        var maxVisible = 5;
        var start = Math.max(1, $scope.currentPage - Math.floor(maxVisible / 2));
        var end = Math.min($scope.totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (var i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    // ===== File selection =====
    $scope.onFileSelected = function () {
        var file = $scope.form.file;
        if (!file) return;
        var err = validateFile(file);
        if (err) {
            $scope.showToaster(err, 'error');
            $scope.form.file = null;
            // Reset the native input so re-picking the same file fires change.
            var input = document.getElementById('classNoteFile');
            if (input) input.value = '';
        }
    };

    function validateFile(file) {
        if (!file) return 'Please attach a PDF file.';
        var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (!isPdf) return 'Only PDF files are allowed.';
        if (file.size > MAX_UPLOAD_BYTES) {
            return 'File is too large. Maximum size is 200 MB.';
        }
        return null;
    }

    // ===== Filename convention: {uuid}_{ddmmYYYY}_{safeBase}.{ext} =====
    function buildFileName(originalName) {
        var uuid = (window.crypto && window.crypto.randomUUID)
            ? window.crypto.randomUUID()
            : fallbackUuid();
        var d = new Date();
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var yyyy = d.getFullYear();
        var datePart = '' + dd + mm + yyyy;

        var dot = originalName.lastIndexOf('.');
        var rawBase = dot > 0 ? originalName.slice(0, dot) : originalName;
        var safeBase = rawBase.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[-_.]+|[-_.]+$/g, '') || 'file';
        var ext = (dot > 0 ? originalName.slice(dot + 1) : 'pdf').toLowerCase();
        return uuid + '_' + datePart + '_' + safeBase + '.' + ext;
    }

    function fallbackUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // ===== Upload =====
    $scope.uploadClassNote = function () {
        if (!$scope.form.chapterId) {
            $scope.showToaster('Please select a chapter.', 'error');
            return;
        }
        var file = $scope.form.file;
        var err = validateFile(file);
        if (err) {
            $scope.showToaster(err, 'error');
            return;
        }

        var chapter = $scope.getChapterById($scope.form.chapterId);
        var fileName = buildFileName(file.name);

        var formData = new FormData();
        formData.append('file', file);
        formData.append('path', STORAGE_FOLDER);
        formData.append('fileName', fileName);

        $scope.isUploading = true;
        $scope.uploadProgress = 0;

        // 1) Upload the PDF (backend stores it in Bunny; key stays server-side).
        $http.post($scope.apiBaseUrl + '/upload-classnote.php', formData, {
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': undefined
            },
            transformRequest: angular.identity,
            uploadEventHandlers: {
                progress: function (e) {
                    if (e.lengthComputable) {
                        $scope.$apply(function () {
                            $scope.uploadProgress = Math.round((e.loaded / e.total) * 100);
                        });
                    }
                }
            }
        }).then(function (response) {
            var created = (response.data && (response.data.data || response.data)) || {};
            var fileUrl = created.fileUrl || created.url || created.cdn_url || created.cdnUrl || created.Url || '';
            if (!fileUrl) {
                // Throwing here rejects the chain and lands in .catch below.
                throw { data: { error: { message: 'Upload succeeded but no file URL was returned.' } } };
            }

            // 2) Persist metadata linking the file to its chapter.
            return $scope.saveMetadata({
                chapterId: chapter ? chapter.id : $scope.form.chapterId,
                fileUrl: fileUrl
            });
        }).then(function () {
            $scope.showToaster('Class note uploaded successfully!', 'success');
            $scope.resetForm();
            $scope.reloadNotes();
        }).catch(function (error) {
            console.error('Class note upload failed:', error);
            $scope.showToaster(bunnyErrorMessage(error, 'Upload failed. Please try again.'), 'error');
        }).finally(function () {
            $scope.isUploading = false;
            $scope.uploadProgress = 0;
        });
    };

    // ===== Persist metadata =====
    $scope.saveMetadata = function (payload) {
        return $http({
            method: 'POST',
            url: $scope.apiBaseUrl + '/update-classnotes-metadata.php',
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            },
            data: payload
        });
    };

    $scope.resetForm = function () {
        $scope.form.chapterId = '';
        $scope.form.file = null;
        var input = document.getElementById('classNoteFile');
        if (input) input.value = '';
    };

    // ===== Map storage error envelope to friendly copy =====
    function bunnyErrorMessage(error, fallback) {
        var env = error && error.data && error.data.error;
        var copy = {
            FOLDER_NOT_ALLOWED: 'Upload folder is not permitted.',
            FILE_TOO_LARGE: 'File is too large. Maximum size is 200 MB.',
            UNSUPPORTED_TYPE: 'Unsupported file type. Only PDF is allowed.',
            UPSTREAM_FAILED: 'Storage is unavailable right now. Please try again.',
            NOT_FOUND: 'The file was not found.'
        };
        if (env && env.code && copy[env.code]) return copy[env.code];
        return (env && env.message) || fallback || 'Storage request failed.';
    }

    // ===== Helpers =====
    $scope.formatBytes = function (bytes) {
        bytes = Number(bytes) || 0;
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    $scope.formatDate = function (timestamp) {
        if (!timestamp) return '—';
        // Accept both unix seconds and ISO strings.
        var date = (typeof timestamp === 'number' || /^\d+$/.test(timestamp))
            ? new Date(Number(timestamp) * 1000)
            : new Date(timestamp);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    $scope.openNote = function (note) {
        if (note.fileUrl) {
            window.open(note.fileUrl, '_blank');
        } else {
            $scope.showToaster('No file URL available for this note.', 'error');
        }
    };

    // ===== Toaster =====
    $scope.toasterVisible = false;
    $scope.toasterMessage = '';
    $scope.showToaster = function (message, type) {
        var icon = '';
        switch (type) {
            case 'success': icon = '<i class="ti ti-check" style="margin-right: 8px;"></i>'; break;
            case 'error': icon = '<i class="ti ti-close" style="margin-right: 8px;"></i>'; break;
            case 'warning': icon = '<i class="ti ti-alert" style="margin-right: 8px;"></i>'; break;
            default: icon = '<i class="ti ti-info-alt" style="margin-right: 8px;"></i>';
        }
        $scope.toasterMessage = icon + message;
        $scope.toasterVisible = true;
        $timeout(function () {
            $scope.toasterVisible = false;
        }, 3000);
    };
}]);
