// Practice Questions Controller - Manages PDF to JPEG conversion and question bank
var practiceQuestionsApp = angular.module('practiceQuestionsApp', []);

practiceQuestionsApp.controller('practiceQuestionsController', ['$scope', '$timeout', function($scope, $timeout) {
    // Initialize Toaster Service
    if (typeof initToaster === 'function') initToaster($scope, $timeout);


    // ===== Initialize Scope Variables =====
    $scope.questions = [];
    $scope.searchQuery = '';
    $scope.isProcessing = false;
    $scope.processingMessage = '';
    $scope.processingProgress = 0;
    $scope.editModalOpen = false;
    $scope.editingQuestion = null;
    $scope.editForm = {
        answerType: 'MCQ',
        correctAnswer: 'A'
    };
    $scope.currentBatchLabel = '';
    $scope.sanitizedLabel = ''; // Cached sanitized label
    $scope.selectedBatchFilter = '';
    $scope.batches = {};
    $scope.batchesList = []; // Cached batches list
    $scope.filteredBatchesList = []; // Cached filtered batches list (after search)
    $scope.selectedBatchesCount = 0; // Cached selected batches count
    $scope.filteredQuestions = []; // Cached filtered questions
    $scope.nextBatchNumber = '00001'; // Cache for next batch number
    $scope.currentQuestionIndex = 0; // Current question index for single question view
    $scope.batchSearchQuery = ''; // Search query for batches
    $scope.batchCurrentPage = 1; // Current page for batch pagination
    $scope.batchesPerPage = 6; // Number of batches per page
    $scope.verificationFilter = 'all'; // Filter: 'all', 'verified', 'unverified'

    // ===== Initialize PDF.js =====
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // ===== Initialize Controller =====
    $scope.init = function() {
        $scope.loadQuestions();
        $scope.updateNextBatchNumber();
        $scope.updateBatchesList();
        $scope.updateFilteredQuestions();
    };

    // ===== Watch currentBatchLabel and Update Sanitized Label =====
    $scope.$watch('currentBatchLabel', function(newVal) {
        $scope.sanitizedLabel = $scope.sanitizeBatchLabel(newVal || '');
    });

    // ===== Watch questions array and update derived data =====
    $scope.$watchCollection('questions', function() {
        $scope.updateBatchesList();
        $scope.updateFilteredQuestions();
    });

    // ===== Watch search query and update filtered questions =====
    $scope.$watch('searchQuery', function() {
        $scope.updateFilteredQuestions();
    });

    // ===== Load Questions from LocalStorage =====
    $scope.loadQuestions = function() {
        var storedQuestions = localStorage.getItem('practiceQuestions');
        if (storedQuestions) {
            try {
                $scope.questions = JSON.parse(storedQuestions);
            } catch (e) {
                console.error('Error loading questions:', e);
                $scope.questions = [];
            }
        }
    };

    // ===== Save Questions to LocalStorage =====
    $scope.saveQuestions = function() {
        try {
            localStorage.setItem('practiceQuestions', JSON.stringify($scope.questions));
        } catch (e) {
            console.error('Error saving questions:', e);
            $scope.showToaster('error', 'Error', 'Error saving questions. LocalStorage may be full.');
        }
    };

    // ===== Generate UUID =====
    $scope.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // ===== Generate Question ID =====
    $scope.generateQuestionId = function() {
        var maxId = 0;
        $scope.questions.forEach(function(q) {
            var idNum = parseInt(q.id.replace('Q', ''));
            if (idNum > maxId) {
                maxId = idNum;
            }
        });
        return 'Q' + String(maxId + 1).padStart(4, '0');
    };

    // ===== Get Next Batch Number =====
    $scope.getNextBatchNumber = function() {
        var maxBatchNum = 0;

        // Extract all batch numbers from existing questions
        $scope.questions.forEach(function(q) {
            if (q.batchId) {
                // Extract number from format like "00001-ChapterOne" or "00001"
                var match = q.batchId.match(/^(\d+)/);
                if (match) {
                    var batchNum = parseInt(match[1]);
                    if (batchNum > maxBatchNum) {
                        maxBatchNum = batchNum;
                    }
                }
            }
        });

        return String(maxBatchNum + 1).padStart(5, '0');
    };

    // ===== Update Next Batch Number (Cache) =====
    $scope.updateNextBatchNumber = function() {
        $scope.nextBatchNumber = $scope.getNextBatchNumber();
    };

    // ===== Sanitize Batch Label =====
    $scope.sanitizeBatchLabel = function(label) {
        if (!label) return '';

        // Remove spaces and special characters, keep only alphanumeric
        var sanitized = label.trim()
            .replace(/\s+/g, '')  // Remove all spaces
            .replace(/[^a-zA-Z0-9]/g, '');  // Remove special characters

        return sanitized;
    };

    // ===== Generate Batch ID =====
    $scope.generateBatchId = function(fileName) {
        var batchNumber = $scope.getNextBatchNumber();
        var label = '';

        if ($scope.currentBatchLabel && $scope.currentBatchLabel.trim()) {
            // User provided a label
            label = $scope.sanitizeBatchLabel($scope.currentBatchLabel);
        } else {
            // Use filename without extension
            label = fileName.replace(/\.[^/.]+$/, '')  // Remove extension
                           .replace(/\s+/g, '')  // Remove spaces
                           .replace(/[^a-zA-Z0-9]/g, '')  // Remove special characters
                           .substring(0, 20);  // Limit length
        }

        return batchNumber + '-' + label;
    };

    // ===== Trigger File Input =====
    $scope.triggerFileInput = function() {
        document.getElementById('pdfFileInput').click();
    };

    // ===== Handle File Selection =====
    $scope.handleFileSelect = function(event) {
        var file = event.target.files[0];

        if (file && file.type === 'application/pdf') {
            $scope.$apply(function() {
                $scope.processPDF(file);
            });
        } else if (file) {
            $scope.showToaster('info', 'Notification', 'Please select a valid PDF file.');
        }
        // Reset input so same file can be selected again
        event.target.value = '';
    };

    // ===== Handle Drag Over =====
    $scope.handleDragOver = function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    };

    // ===== Handle Drag Leave =====
    $scope.handleDragLeave = function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
    };

    // ===== Handle Drop =====
    $scope.handleDrop = function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');

        var files = event.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            if (file.type === 'application/pdf') {
                $scope.$apply(function() {
                    $scope.processPDF(file);
                });
            } else {
                $scope.showToaster('info', 'Notification', 'Please drop a valid PDF file.');
            }
        }
    };

    // ===== Find Last Line with Content =====
    // Helper function to detect the last line with content (non-white pixels)
    function findLastContentLine(context, width, height) {
        var imageData = context.getImageData(0, 0, width, height);
        var pixels = imageData.data;

        // Iterate from bottom to top to find the last line with content
        for (var y = height - 1; y >= 0; y--) {
            for (var x = 0; x < width; x++) {
                var index = (y * width + x) * 4;
                var r = pixels[index];
                var g = pixels[index + 1];
                var b = pixels[index + 2];

                // Check if pixel is not white (allowing small tolerance)
                if (r < 250 || g < 250 || b < 250) {
                    return y;
                }
            }
        }
        return height; // If no content found, return full height
    }

    // ===== Process PDF File =====
    $scope.processPDF = function(file) {
        if (!pdfjsLib) {
            $scope.showToaster('info', 'Notification', 'PDF.js library not loaded. Please refresh the page and try again.');
            return;
        }

        // Generate batch ID for this upload
        var generatedBatchId = $scope.generateBatchId(file.name);
        console.log('Generated Batch ID:', generatedBatchId, 'for file:', file.name);

        $scope.isProcessing = true;
        $scope.processingMessage = 'Loading PDF...';
        $scope.processingProgress = 0;

        var fileReader = new FileReader();
        fileReader.onload = function(e) {
            var typedArray = new Uint8Array(e.target.result);

            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                var totalPages = pdf.numPages;
                $scope.$apply(function() {
                    $scope.processingMessage = 'Converting ' + totalPages + ' page' + (totalPages > 1 ? 's' : '') + ' to images...';
                });

                var processedPages = 0;
                var newQuestions = [];

                // Pre-calculate starting ID to avoid duplicates
                var startingIdNumber = 0;
                $scope.questions.forEach(function(q) {
                    var idNum = parseInt(q.id.replace('Q', ''));
                    if (idNum > startingIdNumber) {
                        startingIdNumber = idNum;
                    }
                });

                // Process each page
                var processPage = function(pageNumber) {
                    pdf.getPage(pageNumber).then(function(page) {
                        // Set scale for 300 DPI quality (2.5x for ~300 DPI)
                        var scale = 2.5;
                        var viewport = page.getViewport({ scale: scale });

                        // Create canvas for full page
                        var canvas = document.createElement('canvas');
                        var context = canvas.getContext('2d');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        // Render PDF page to canvas
                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                        page.render(renderContext).promise.then(function() {
                            // Crop parameters (matching Python script)
                            var cropWidthInches = 6;
                            var dpi = 300;
                            var cropWidthPixels = cropWidthInches * dpi; // 1800 pixels
                            var paddingHeight = 66;

                            // Scale crop width based on actual canvas scale
                            var scaledCropWidth = Math.min(cropWidthPixels * (scale / 2.5), canvas.width);

                            // Find the last line with content
                            var lastContentLine = findLastContentLine(context, canvas.width, canvas.height);

                            // Calculate padded height
                            var paddedHeight = Math.min(lastContentLine + 1 + paddingHeight, canvas.height);

                            // Create new canvas for cropped image
                            var croppedCanvas = document.createElement('canvas');
                            var croppedContext = croppedCanvas.getContext('2d');
                            croppedCanvas.width = scaledCropWidth;
                            croppedCanvas.height = paddedHeight;

                            // Draw cropped portion
                            croppedContext.drawImage(
                                canvas,
                                0, 0, scaledCropWidth, paddedHeight,  // Source rectangle
                                0, 0, scaledCropWidth, paddedHeight   // Destination rectangle
                            );

                            // Convert cropped canvas to JPEG
                            var imageData = croppedCanvas.toDataURL('image/jpeg', 0.92);

                            // Create question object with unique ID based on starting number + page number
                            var questionId = 'Q' + String(startingIdNumber + pageNumber).padStart(4, '0');
                            var question = {
                                id: questionId,
                                uuid: $scope.generateUUID(),
                                imageData: imageData,
                                answerType: 'MCQ',
                                correctAnswer: 'A',
                                createdAt: new Date().getTime(),
                                pageNumber: pageNumber,
                                fileName: file.name,
                                batchId: generatedBatchId,
                                ocrText: '',
                                isProcessingOCR: false,
                                ocrProgress: 0,
                                verified: false
                            };

                            newQuestions.push(question);
                            processedPages++;

                            // Update progress
                            $scope.$apply(function() {
                                $scope.processingProgress = Math.round((processedPages / totalPages) * 100);
                            });

                            // Check if all pages processed
                            if (processedPages === totalPages) {
                                // Sort by page number
                                newQuestions.sort(function(a, b) {
                                    return a.pageNumber - b.pageNumber;
                                });

                                // Add to questions array
                                $scope.$apply(function() {
                                    $scope.questions = $scope.questions.concat(newQuestions);
                                    $scope.saveQuestions();
                                    $scope.updateNextBatchNumber(); // Update cached batch number
                                    $scope.processingMessage = 'Successfully created ' + totalPages + ' question' + (totalPages > 1 ? 's' : '') + ' in batch ' + generatedBatchId + '!';

                                    // Clear the batch label for next upload
                                    $scope.currentBatchLabel = '';

                                    // Hide processing status after 2 seconds
                                    $timeout(function() {
                                        $scope.isProcessing = false;
                                        $scope.processingProgress = 0;
                                    }, 2000);
                                });

                                // Start OCR processing in background after digest cycle
                                $timeout(function() {
                                    $scope.processOCRForQuestions(newQuestions);
                                }, 100);
                            }
                        }).catch(function(error) {
                            console.error('Error rendering page:', error);
                            $scope.$apply(function() {
                                $scope.isProcessing = false;
                                $scope.showToaster('error', 'Error', 'Error rendering PDF page ' + pageNumber + '. Please try again.');
                            });
                        });
                    }).catch(function(error) {
                        console.error('Error getting page:', error);
                        $scope.$apply(function() {
                            $scope.isProcessing = false;
                            $scope.showToaster('error', 'Error', 'Error processing PDF page ' + pageNumber + '. Please try again.');
                        });
                    });
                };

                // Process all pages
                for (var i = 1; i <= totalPages; i++) {
                    processPage(i);
                }

            }).catch(function(error) {
                console.error('Error loading PDF:', error);
                $scope.$apply(function() {
                    $scope.isProcessing = false;
                    $scope.showToaster('error', 'Error', 'Error loading PDF. Please make sure it is a valid PDF file.');
                });
            });
        };

        fileReader.onerror = function(error) {
            console.error('Error reading file:', error);
            $scope.$apply(function() {
                $scope.isProcessing = false;
                $scope.showToaster('error', 'Error', 'Error reading file. Please try again.');
            });
        };

        fileReader.readAsArrayBuffer(file);
    };

    // ===== Process OCR for Questions =====
    $scope.processOCRForQuestions = function(questions) {
        console.log('processOCRForQuestions called with', questions.length, 'questions');

        if (!window.Tesseract) {
            console.error('Tesseract.js not loaded. OCR will be skipped.');
            $scope.showToaster('info', 'Notification', 'Tesseract.js library is not loaded. Please refresh the page and try again.');
            return;
        }

        console.log('Tesseract.js is loaded, starting OCR processing...');

        // Process questions sequentially to avoid overwhelming the browser
        var processNextQuestion = function(index) {
            if (index >= questions.length) {
                console.log('All OCR processing complete!');
                return; // All done
            }

            var question = questions[index];
            console.log('Starting OCR for question:', question.id);

            question.isProcessingOCR = true;
            question.ocrProgress = 0;

            Tesseract.recognize(
                question.imageData,
                'eng',
                {
                    logger: function(m) {
                        console.log('OCR status for', question.id, ':', m.status, m.progress);
                        if (m.status === 'recognizing text') {
                            try {
                                $scope.$apply(function() {
                                    question.ocrProgress = Math.round(m.progress * 100);
                                });
                            } catch(e) {
                                // Ignore digest already in progress errors
                                question.ocrProgress = Math.round(m.progress * 100);
                            }
                        }
                    }
                }
            ).then(function(result) {
                // Clean up the OCR text
                var text = result.data.text || '';

                console.log('OCR completed for question ' + question.id);
                console.log('Raw text:', text);

                // Split into lines and clean each line
                var lines = text.split('\n');
                var cleanedLines = [];

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();

                    // Skip empty lines
                    if (!line) continue;

                    // Skip lines that are only whitespace or single characters
                    if (line.length < 2) continue;

                    // Skip lines that are purely symbols (likely artifacts)
                    // But keep lines with at least some alphanumeric content
                    var hasAlphaNumeric = /[a-zA-Z0-9]/.test(line);
                    if (hasAlphaNumeric) {
                        cleanedLines.push(line);
                    }
                }

                question.ocrText = cleanedLines.join('\n');
                question.isProcessingOCR = false;
                question.ocrProgress = 100;

                console.log('Raw text length:', text.length);
                console.log('Cleaned text length:', question.ocrText.length);
                console.log('Cleaned text:', question.ocrText);

                $scope.saveQuestions();

                // Use $timeout to safely trigger digest and process next question
                $timeout(function() {
                    processNextQuestion(index + 1);
                }, 0);
            }).catch(function(error) {
                console.error('OCR Error for question ' + question.id + ':', error);

                question.isProcessingOCR = false;
                question.ocrText = '';

                // Continue with next question even if this one failed
                $timeout(function() {
                    processNextQuestion(index + 1);
                }, 0);
            });
        };

        // Start processing from first question
        processNextQuestion(0);
    };

    // ===== Edit Question =====
    $scope.editQuestion = function(question) {
        $scope.editingQuestion = question;
        $scope.editForm = {
            answerType: question.answerType,
            correctAnswer: question.correctAnswer
        };
        $scope.editModalOpen = true;
    };

    // ===== Save Edit =====
    $scope.saveEdit = function() {
        if ($scope.editingQuestion) {
            $scope.editingQuestion.answerType = $scope.editForm.answerType;
            $scope.editingQuestion.correctAnswer = $scope.editForm.correctAnswer;
            $scope.saveQuestions();
            $scope.closeEditModal();
        }
    };

    // ===== Close Edit Modal =====
    $scope.closeEditModal = function() {
        $scope.editModalOpen = false;
        $timeout(function() {
            $scope.editingQuestion = null;
            $scope.editForm = {
                answerType: 'MCQ',
                correctAnswer: 'A'
            };
        }, 300);
    };

    // ===== Delete Question =====
    $scope.deleteQuestion = function(question) {
        if (confirm('Are you sure you want to delete this question?')) {
            var index = $scope.questions.indexOf(question);
            if (index > -1) {
                $scope.questions.splice(index, 1);
                $scope.saveQuestions();
                $scope.updateNextBatchNumber(); // Update cached batch number

                // Adjust current question index if needed
                if ($scope.currentQuestionIndex >= $scope.filteredQuestions.length - 1 && $scope.currentQuestionIndex > 0) {
                    $scope.currentQuestionIndex--;
                }
            }
        }
    };

    // ===== Get Filtered Questions =====
    $scope.getFilteredQuestions = function() {
        var filtered = $scope.questions;

        // Filter by selected batches (from Batch Management section)
        var selectedBatches = $scope.getSelectedBatches();
        if (selectedBatches.length > 0) {
            var selectedBatchIds = selectedBatches.map(function(b) { return b.id; });
            filtered = filtered.filter(function(question) {
                return selectedBatchIds.indexOf(question.batchId) !== -1;
            });
        }

        // Filter by search query
        if ($scope.searchQuery) {
            var query = $scope.searchQuery.toLowerCase();
            filtered = filtered.filter(function(question) {
                return (question.id && question.id.toLowerCase().indexOf(query) !== -1) ||
                       (question.uuid && question.uuid.toLowerCase().indexOf(query) !== -1) ||
                       (question.answerType && question.answerType.toLowerCase().indexOf(query) !== -1) ||
                       (question.correctAnswer && question.correctAnswer.toLowerCase().indexOf(query) !== -1) ||
                       (question.fileName && question.fileName.toLowerCase().indexOf(query) !== -1) ||
                       (question.batchId && question.batchId.toLowerCase().indexOf(query) !== -1) ||
                       (question.ocrText && question.ocrText.toLowerCase().indexOf(query) !== -1);
            });
        }

        // Filter by verification status
        if ($scope.verificationFilter === 'verified') {
            filtered = filtered.filter(function(question) {
                return question.verified === true;
            });
        } else if ($scope.verificationFilter === 'unverified') {
            filtered = filtered.filter(function(question) {
                return !question.verified;
            });
        }

        return filtered;
    };

    // ===== Handle Verification Filter Change =====
    $scope.onVerificationFilterChange = function() {
        $scope.currentQuestionIndex = 0;
        $scope.updateFilteredQuestions();
    };

    // ===== Update Filtered Questions (Cache) =====
    $scope.updateFilteredQuestions = function() {
        $scope.filteredQuestions = $scope.getFilteredQuestions();
        // Reset to first question when filter changes
        if ($scope.currentQuestionIndex >= $scope.filteredQuestions.length) {
            $scope.currentQuestionIndex = 0;
        }
        // Update verification status
        if ($scope.updateVerificationStatus) {
            $scope.updateVerificationStatus();
        }
    };

    // ===== Question Navigation Functions =====
    $scope.previousQuestion = function() {
        if ($scope.currentQuestionIndex > 0) {
            $scope.currentQuestionIndex--;
        }
    };

    $scope.nextQuestion = function() {
        if ($scope.currentQuestionIndex < $scope.filteredQuestions.length - 1) {
            $scope.currentQuestionIndex++;
        }
    };

    $scope.goToQuestion = function(index) {
        if (index >= 0 && index < $scope.filteredQuestions.length) {
            $scope.currentQuestionIndex = index;
        }
    };

    // ===== Toggle Question Verified Status =====
    $scope.toggleVerified = function(question) {
        if (question) {
            question.verified = !question.verified;
            $scope.saveQuestions();
            $scope.updateVerificationStatus();
        }
    };

    // ===== Update Verification Status =====
    $scope.unverifiedCount = 0;
    $scope.allQuestionsVerified = false;

    $scope.updateVerificationStatus = function() {
        var unverified = $scope.filteredQuestions.filter(function(q) {
            return !q.verified;
        });
        $scope.unverifiedCount = unverified.length;
        $scope.allQuestionsVerified = $scope.filteredQuestions.length > 0 && unverified.length === 0;
    };

    // ===== Update Batches List (Cache) =====
    $scope.updateBatchesList = function() {
        $scope.batchesList = $scope.getBatches();
        $scope.selectedBatchesCount = $scope.batchesList.filter(function(b) { return b.selected; }).length;
        $scope.updateFilteredBatchesList();
    };

    // ===== Update Filtered Batches List (after search) =====
    $scope.updateFilteredBatchesList = function() {
        if (!$scope.batchSearchQuery) {
            $scope.filteredBatchesList = $scope.batchesList;
        } else {
            var query = $scope.batchSearchQuery.toLowerCase();
            $scope.filteredBatchesList = $scope.batchesList.filter(function(batch) {
                return batch.id.toLowerCase().indexOf(query) !== -1;
            });
        }
        // Reset to page 1 when search changes
        if ($scope.batchCurrentPage > $scope.getBatchTotalPages()) {
            $scope.batchCurrentPage = 1;
        }
    };

    // ===== Batch Search Change Handler =====
    $scope.onBatchSearchChange = function() {
        $scope.batchCurrentPage = 1;
        $scope.updateFilteredBatchesList();
    };

    // ===== Get Paginated Batches =====
    $scope.getPaginatedBatches = function() {
        var startIndex = ($scope.batchCurrentPage - 1) * $scope.batchesPerPage;
        var endIndex = startIndex + $scope.batchesPerPage;
        return $scope.filteredBatchesList.slice(startIndex, endIndex);
    };

    // ===== Get Total Batch Pages =====
    $scope.getBatchTotalPages = function() {
        return Math.ceil($scope.filteredBatchesList.length / $scope.batchesPerPage);
    };

    // ===== Previous Batch Page =====
    $scope.prevBatchPage = function() {
        if ($scope.batchCurrentPage > 1) {
            $scope.batchCurrentPage--;
        }
    };

    // ===== Next Batch Page =====
    $scope.nextBatchPage = function() {
        if ($scope.batchCurrentPage < $scope.getBatchTotalPages()) {
            $scope.batchCurrentPage++;
        }
    };

    // ===== Get Batches =====
    $scope.getBatches = function() {
        var batchMap = {};

        $scope.questions.forEach(function(question) {
            var batchId = question.batchId || 'UNBATCHED';
            if (!batchMap[batchId]) {
                batchMap[batchId] = {
                    id: batchId,
                    count: 0,
                    createdAt: question.createdAt,
                    selected: $scope.batches[batchId] ? $scope.batches[batchId].selected : false
                };
            }
            batchMap[batchId].count++;
            // Use earliest creation date for batch
            if (question.createdAt < batchMap[batchId].createdAt) {
                batchMap[batchId].createdAt = question.createdAt;
            }
        });

        // Convert to array and sort by creation date (newest first)
        var batches = Object.values(batchMap).sort(function(a, b) {
            return b.createdAt - a.createdAt;
        });

        return batches;
    };

    // ===== Toggle Batch Selection =====
    $scope.toggleBatchSelection = function(batchId) {
        if (!$scope.batches[batchId]) {
            $scope.batches[batchId] = { selected: false };
        }
        $scope.batches[batchId].selected = !$scope.batches[batchId].selected;
        $scope.updateBatchesList(); // Update cached list to reflect selection change
        $scope.updateFilteredQuestions(); // Update questions list based on selection
    };

    // ===== Get Selected Batches =====
    $scope.getSelectedBatches = function() {
        return $scope.batchesList.filter(function(batch) {
            return batch.selected;
        });
    };

    // ===== Delete Batch =====
    $scope.deleteBatch = function(batchId) {
        var batchQuestions = $scope.questions.filter(function(q) {
            return q.batchId === batchId;
        });

        var message = 'Are you sure you want to delete batch "' + batchId + '"?\n\n' +
                      'This will permanently delete ' + batchQuestions.length + ' question(s).';

        if (confirm(message)) {
            $scope.questions = $scope.questions.filter(function(question) {
                return question.batchId !== batchId;
            });
            delete $scope.batches[batchId];
            $scope.saveQuestions();
            $scope.updateNextBatchNumber(); // Update cached batch number

            // Clear batch filter if it was deleted
            if ($scope.selectedBatchFilter === batchId) {
                $scope.selectedBatchFilter = '';
            }
        }
    };

    // ===== Create Quiz from Selected Batches =====
    $scope.createQuizFromSelectedBatches = function() {
        var selectedBatches = $scope.getSelectedBatches();

        if (selectedBatches.length === 0) {
            $scope.showToaster('info', 'Notification', 'Please select at least one batch to create a quiz.');
            return;
        }

        // Get all questions from selected batches
        var quizQuestions = $scope.questions.filter(function(question) {
            return selectedBatches.some(function(batch) {
                return batch.id === question.batchId;
            });
        });

        console.log('Creating quiz from batches:', selectedBatches.map(function(b) { return b.id; }));
        console.log('Total questions:', quizQuestions.length);

        // Build URL with selected bundle IDs
        var bundleIds = selectedBatches.map(function(b) { return b.id; });
        var bundlesParam = encodeURIComponent('[' + bundleIds.join(',') + ']');

        // Navigate to quiz creation page with URL parameters
        window.location.href = 'quiz-creation.html?bundlesSelected=' + bundlesParam;
    };

    // ===== Format Date =====
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'N/A';
        var date = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' ' +
               String(date.getHours()).padStart(2, '0') + ':' +
               String(date.getMinutes()).padStart(2, '0');
    };

    // ===== Clear All Questions =====
    $scope.clearAllQuestions = function() {
        if (confirm('Are you sure you want to delete ALL questions? This action cannot be undone.')) {
            $scope.questions = [];
            $scope.saveQuestions();
        }
    };

    // ===== Watch for changes in questions and auto-save =====
    $scope.$watch('questions', function(newVal, oldVal) {
        if (newVal !== oldVal && newVal) {
            $scope.saveQuestions();
        }
    }, true); // Deep watch to detect changes in nested properties

    // ===== Initialize on Load =====
    $scope.init();

}]);
