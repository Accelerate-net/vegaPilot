var app = angular.module('catalogApp', ['ngCookies']);

app.controller('catalogController', function($scope, $http, $cookies, $timeout) {
    
    // Initialize scope variables
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };
    
    // Search and filters
    $scope.searchQuery = '';
    $scope.activeFilters = [];
    
    // Summary data for tiles
    $scope.summaryData = {
        totalItems: 0,
        totalCourses: 0,
        totalExams: 0,
        totalActive: 0
    };
    
    // Catalog data
    $scope.catalog = [];
    $scope.filteredCatalog = [];
    
    // New catalog object
    $scope.newCatalog = {
        title: '',
        subtitle: '',
        code: '',
        type: 1,
        fk_id_exam_series: 0,
        fk_id_course_bundle: 0,
        originalPrice: 0,
        sellingPrice: 0,
        specialPrice: 0,
        displayImage: '',
        taxDetails: '',
        otherDetails: '',
        brief: '',
        isDiscountApplicable: 0,
        badgeType: 'admission',
        status: 1,
        pageUrl: '',
        tagline: 'Enroll Now',
        taxItems: []
    };
    
    // Modal state
    $scope.isEditing = false;
    $scope.editingId = null;
    
    // Enhanced sample catalog data matching the image style
    $scope.dummyCatalog = [
        {
            id: 1,
            code: 'CR0001',
            type: 1,
            fk_id_exam_series: 0,
            fk_id_course_bundle: 0,
            originalPrice: 4500000,
            sellingPrice: 2899000,
            displayImage: 'https://crisprlearning.com/wp-content/uploads/2025/01/banner-iat-crash-course.jpg',
            taxDetails: '[{"type":"SGST","valueType":"percentage","value":9},{"type":"CGST","valueType":"percentage","value":9}]',
            otherDetails: '{\n    \"commencement\": \"July 2026\",\n    \"conclusion\": \"June 2027\",\n    \"duration\": \"1 Year\",\n    \"coaching\": \"Expert Coaching\"\n}',
            title: 'IAT 2026 – Exclusive 1 Year Course',
            subtitle: 'with EXPERT COACHING',
            brief: 'Dedicated coaching for IAT 2026 with personalized attention and comprehensive preparation.',
            isDiscountApplicable: 0,
            specialPrice: null,
            badgeType: 'admission',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1754586238,
            status: 1,
            pageUrl: 'https://crisprlearning.com/courses/iiser-exclusive-1-year-course-for-iat/',
            tagline: 'Enroll Now'
        },
        {
            id: 2,
            code: 'CR0002',
            type: 2,
            fk_id_exam_series: 60000,
            fk_id_course_bundle: 0,
            originalPrice: 199900,
            sellingPrice: 99900,
            displayImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
            taxDetails: '[{"type":"GST","valueType":"percentage","value":18}]',
            otherDetails: '{ \"commencement\": \"Since Enrollment\", \"conclusion\": \"25 May, 2025\", \"premiumValidTill\": \"31-05-2025\", \"premiumValidForDays\": \"\", \"description\": \"Most realistic IISER mock tests designed by IISER students\" }',
            title: 'IAT 2026 - Test Series',
            subtitle: 'Most Realistic IISER Mock Tests',
            brief: 'The most REALISTIC IISER MOCK TESTS designed by IISER STUDENTS. Practice with exam-like questions.',
            isDiscountApplicable: 1,
            specialPrice: null,
            badgeType: 'offer',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742334417,
            status: 1,
            pageUrl: 'https://crisprlearning.com/test-series/iat-2026',
            tagline: 'Buy Now'
        },
        {
            id: 3,
            code: 'CR0003',
            type: 2,
            fk_id_exam_series: 60001,
            fk_id_course_bundle: 0,
            originalPrice: 199900,
            sellingPrice: 19900,
            displayImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
            taxDetails: null,
            otherDetails: '{ \"commencement\": \"Since Enrollment\", \"conclusion\": \"25 May, 2025\", \"premiumValidTill\": \"31-05-2025\", \"premiumValidForDays\": \"\", \"description\": \"Attempt actual IISER questions, get real-time scores\" }',
            title: 'Previous Year IAT 2017-2025',
            subtitle: 'Official PYQs Collection',
            brief: 'Attempt actual IISER questions, get real-time scores and see which IISER you\'d have got that year.',
            isDiscountApplicable: 1,
            specialPrice: 19900,
            badgeType: 'official',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1746868871,
            status: 1,
            pageUrl: 'https://crisprlearning.com/previous-years/iat',
            tagline: 'Start Practice'
        },
        {
            id: 4,
            code: 'CR0004',
            type: 1,
            fk_id_exam_series: 0,
            fk_id_course_bundle: 70000,
            originalPrice: 599000,
            sellingPrice: 499000,
            displayImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
            taxDetails: '[{"type":"SGST","valueType":"percentage","value":9},{"type":"CGST","valueType":"percentage","value":9}]',
            otherDetails: '{\n    \"commencement\": \"5 April, 2025\",\n    \"conclusion\": \"25 May, 2025\",\n    \"duration\": \"2 Months\",\n    \"intensity\": \"Crash Course\"\n}',
            title: 'Dream IISER - IAT 2025 Crash Course',
            subtitle: 'Intensive 2-Month Preparation',
            brief: 'Intensive preparation with expert guidance, mock tests, and personalized study plans.',
            isDiscountApplicable: 0,
            specialPrice: null,
            badgeType: 'admission',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742334417,
            status: 1,
            pageUrl: 'https://crisprlearning.com/courses/iat-crash-course/',
            tagline: 'Join Now'
        },
        {
            id: 5,
            code: 'CR0005',
            type: 1,
            fk_id_exam_series: 0,
            fk_id_course_bundle: 70001,
            originalPrice: 3500000,
            sellingPrice: 2499000,
            displayImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop',
            taxDetails: '[{"type":"GST","valueType":"percentage","value":18}]',
            otherDetails: '{\n    \"commencement\": \"Immediate\",\n    \"conclusion\": \"31 December 2026\",\n    \"duration\": \"6 Months\",\n    \"mode\": \"Online + Offline\"\n}',
            title: 'IAT 2026 - Hybrid Learning Program',
            subtitle: 'Online + Offline Mode',
            brief: 'Flexible learning with both online and offline sessions. Access to recorded lectures and live doubt sessions.',
            isDiscountApplicable: 1,
            specialPrice: null,
            badgeType: 'offer',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1754586239,
            status: 1,
            pageUrl: 'https://crisprlearning.com/courses/hybrid-program/',
            tagline: 'Learn More'
        },
        {
            id: 6,
            code: 'CR0006',
            type: 2,
            fk_id_exam_series: 60002,
            fk_id_course_bundle: 0,
            originalPrice: 299900,
            sellingPrice: 149900,
            displayImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&h=600&fit=crop',
            taxDetails: '[{"type":"SGST","valueType":"percentage","value":9},{"type":"CGST","valueType":"percentage","value":9}]',
            otherDetails: '{ \"commencement\": \"Since Enrollment\", \"conclusion\": \"30 June 2026\", \"premiumValidTill\": \"30-06-2026\", \"premiumValidForDays\": \"\", \"description\": \"Advanced level mock tests with detailed solutions\" }',
            title: 'IAT 2026 - Advanced Test Series',
            subtitle: 'Expert Level Preparation',
            brief: 'Advanced level mock tests designed by IIT/IISER professors with detailed solutions and analytics.',
            isDiscountApplicable: 1,
            specialPrice: null,
            badgeType: 'official',
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1754586240,
            status: 1,
            pageUrl: 'https://crisprlearning.com/test-series/advanced/',
            tagline: 'Get Started'
        }
    ];
    
    // Initialize the controller
    $scope.init = function() {
        $scope.loadCatalog();
        $scope.loadSummaryData();
    };
    
    // Load catalog from database (using dummy data for now)
    $scope.loadCatalog = function() {
        // Simulate API call delay
        $timeout(function() {
            $scope.catalog = $scope.dummyCatalog;
            $scope.filteredCatalog = $scope.catalog;
        }, 500);
    };
    
    // Load summary data for tiles
    $scope.loadSummaryData = function() {
        var totalItems = $scope.catalog.length;
        var totalCourses = $scope.catalog.filter(function(item) {
            return item.type === 1;
        }).length;
        var totalExams = $scope.catalog.filter(function(item) {
            return item.type === 2;
        }).length;
        var totalActive = $scope.catalog.filter(function(item) {
            return item.status === 1;
        }).length;
        
        $scope.summaryData = {
            totalItems: totalItems,
            totalCourses: totalCourses,
            totalExams: totalExams,
            totalActive: totalActive
        };
    };
    
    // Apply search
    $scope.applySearch = function() {
        if (!$scope.searchQuery) {
            $scope.filteredCatalog = $scope.catalog;
        } else {
            var query = $scope.searchQuery.toLowerCase();
            $scope.filteredCatalog = $scope.catalog.filter(function(item) {
                return item.title.toLowerCase().includes(query) ||
                       item.code.toLowerCase().includes(query) ||
                       item.brief.toLowerCase().includes(query);
            });
        }
    };
    
    // Clear search
    $scope.clearSearch = function() {
        $scope.searchQuery = '';
        $scope.filteredCatalog = $scope.catalog;
    };
    
    // Clear all filters
    $scope.clearAllFilters = function() {
        $scope.activeFilters = [];
        $scope.searchQuery = '';
        $scope.filteredCatalog = $scope.catalog;
    };
    
    // Remove filter
    $scope.removeFilter = function(filter) {
        var index = $scope.activeFilters.indexOf(filter);
        if (index > -1) {
            $scope.activeFilters.splice(index, 1);
        }
    };
    
    // Get type label
    $scope.getTypeLabel = function(type) {
        switch(parseInt(type)) {
            case 1: return 'Course';
            case 2: return 'Exam';
            default: return 'Unknown';
        }
    };
    
    // Get type class
    $scope.getTypeClass = function(type) {
        switch(parseInt(type)) {
            case 1: return 'type-course';
            case 2: return 'type-exam';
            default: return 'type-course';
        }
    };
    
    // Get status label
    $scope.getStatusLabel = function(status) {
        switch(parseInt(status)) {
            case 1: return 'Active';
            case 0: return 'Inactive';
            default: return 'Unknown';
        }
    };
    
    // Get status class
    $scope.getStatusClass = function(status) {
        switch(parseInt(status)) {
            case 1: return 'status-active';
            case 0: return 'status-inactive';
            default: return 'status-active';
        }
    };
    
    // Format price
    $scope.formatPrice = function(price) {
        return (price / 100).toLocaleString('en-IN');
    };
    
    // Get discount percentage
    $scope.getDiscountPercentage = function(item) {
        if (!item.isDiscountApplicable) return 0;
        var discount = ((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100;
        return Math.round(discount);
    };
    
    // Format date
    $scope.formatDate = function(timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    };
    
    // Parse tax details
    $scope.parseTaxDetails = function(taxDetails) {
        try {
            return JSON.parse(taxDetails);
        } catch (e) {
            return [];
        }
    };
    
    // Get badge class
    $scope.getBadgeClass = function(item) {
        switch(item.badgeType) {
            case 'admission': return 'badge-admission';
            case 'official': return 'badge-official';
            case 'offer': return 'badge-offer';
            default: return 'badge-admission';
        }
    };
    
    // Get badge text
    $scope.getBadgeText = function(item) {
        switch(item.badgeType) {
            case 'admission': return 'Admission Started';
            case 'official': return 'Official PYQs';
            case 'offer': return '50% OFF';
            default: return 'Admission Started';
        }
    };
    
    // Add new catalog
    $scope.addNewCatalog = function() {
        $scope.isEditing = false;
        $scope.editingId = null;
        $scope.resetNewCatalog();
        $('#catalogModal').modal('show');
    };
    
    // Edit catalog
    $scope.editCatalog = function(item) {
        $scope.isEditing = true;
        $scope.editingId = item.id;
        $scope.newCatalog = angular.copy(item);

        // Parse tax items if taxDetails exists
        if (item.taxDetails) {
            try {
                var taxData = JSON.parse(item.taxDetails);
                $scope.newCatalog.taxItems = taxData;
            } catch (e) {
                $scope.newCatalog.taxItems = [];
            }
        } else {
            $scope.newCatalog.taxItems = [];
        }

        $('#catalogModal').modal('show');
    };
    
    // View catalog
    $scope.viewCatalog = function(item) {
        console.log('Viewing catalog item:', item);
        $scope.showToaster('Catalog viewer coming soon!', 'info');
    };
    
    // Delete catalog
    $scope.deleteCatalog = function(item) {
        if (confirm('Are you sure you want to delete the catalog item "' + item.title + '"? This action cannot be undone.')) {
            var index = $scope.catalog.findIndex(function(c) {
                return c.id === item.id;
            });
            
            if (index !== -1) {
                $scope.catalog.splice(index, 1);
                $scope.filteredCatalog = $scope.filteredCatalog.filter(function(c) {
                    return c.id !== item.id;
                });
                
                $scope.showToaster('Catalog item "' + item.title + '" deleted successfully!', 'success');
                $scope.loadSummaryData();
            }
        }
    };
    
    // Save catalog
    $scope.saveCatalog = function() {
        // Validation
        if (!$scope.newCatalog.title || !$scope.newCatalog.code) {
            $scope.showToaster('Please fill in required fields: Title and Code', 'error');
            return;
        }

        if (!$scope.newCatalog.originalPrice || !$scope.newCatalog.sellingPrice) {
            $scope.showToaster('Please enter both Original Price and Selling Price', 'error');
            return;
        }

        if (!$scope.newCatalog.pageUrl) {
            $scope.showToaster('Please enter the Page URL', 'error');
            return;
        }

        // Convert tax items to JSON string
        if ($scope.newCatalog.taxItems && $scope.newCatalog.taxItems.length > 0) {
            $scope.newCatalog.taxDetails = JSON.stringify($scope.newCatalog.taxItems);
        } else {
            $scope.newCatalog.taxDetails = null;
        }

        if ($scope.isEditing) {
            // Update existing catalog
            var index = $scope.catalog.findIndex(function(c) {
                return c.id === $scope.editingId;
            });

            if (index !== -1) {
                var updatedItem = angular.copy($scope.newCatalog);
                updatedItem.id = $scope.editingId;
                updatedItem.lastUpdatedOn = Math.floor(Date.now() / 1000);
                $scope.catalog[index] = updatedItem;

                $scope.showToaster('Catalog item "' + updatedItem.title + '" updated successfully!', 'success');
            }
        } else {
            // Create new catalog
            var newItem = angular.copy($scope.newCatalog);
            newItem.id = $scope.catalog.length > 0 ? Math.max(...$scope.catalog.map(c => c.id)) + 1 : 1;
            newItem.createdOn = Math.floor(Date.now() / 1000);
            newItem.createdBy = '66599dd1-c984-4cd0-944d-72b3a1492552';

            $scope.catalog.unshift(newItem);
            $scope.showToaster('Catalog item "' + newItem.title + '" created successfully!', 'success');
        }

        $scope.filteredCatalog = $scope.catalog;
        $scope.loadSummaryData();
        $('#catalogModal').modal('hide');
    };
    
    // Reset new catalog form
    $scope.resetNewCatalog = function() {
        $scope.newCatalog = {
            title: '',
            subtitle: '',
            code: '',
            type: 1,
            fk_id_exam_series: 0,
            fk_id_course_bundle: 0,
            originalPrice: 0,
            sellingPrice: 0,
            specialPrice: 0,
            displayImage: '',
            taxDetails: '',
            otherDetails: '',
            brief: '',
            isDiscountApplicable: 0,
            badgeType: 'admission',
            status: 1,
            pageUrl: '',
            tagline: 'Enroll Now',
            taxItems: []
        };
    };

    // Tax Management Functions
    $scope.addTaxItem = function() {
        if (!$scope.newCatalog.taxItems) {
            $scope.newCatalog.taxItems = [];
        }
        $scope.newCatalog.taxItems.push({
            type: 'SGST',
            customName: '',
            valueType: 'percentage',
            value: 0
        });
    };

    $scope.removeTaxItem = function(index) {
        if ($scope.newCatalog.taxItems && $scope.newCatalog.taxItems.length > index) {
            $scope.newCatalog.taxItems.splice(index, 1);
        }
    };

    $scope.calculateTotalTax = function() {
        if (!$scope.newCatalog.taxItems || !$scope.newCatalog.sellingPrice) {
            return 0;
        }

        var total = 0;
        $scope.newCatalog.taxItems.forEach(function(tax) {
            if (tax.value) {
                if (tax.valueType === 'percentage') {
                    total += ($scope.newCatalog.sellingPrice * tax.value / 100);
                } else {
                    total += parseFloat(tax.value) || 0;
                }
            }
        });

        return total.toFixed(2);
    };

    $scope.calculateFinalAmount = function() {
        var sellingPrice = parseFloat($scope.newCatalog.sellingPrice) || 0;
        var totalTax = parseFloat($scope.calculateTotalTax()) || 0;
        return (sellingPrice + totalTax).toFixed(2);
    };

    $scope.calculateDiscountPercentage = function() {
        if (!$scope.newCatalog.originalPrice || !$scope.newCatalog.sellingPrice) {
            return 0;
        }
        if ($scope.newCatalog.originalPrice <= $scope.newCatalog.sellingPrice) {
            return 0;
        }
        var discount = (($scope.newCatalog.originalPrice - $scope.newCatalog.sellingPrice) / $scope.newCatalog.originalPrice) * 100;
        return Math.round(discount);
    };

    // Image Upload Handler
    $scope.onImageSelect = function(event) {
        var file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match('image.*')) {
            $scope.showToaster('Please select a valid image file (JPG, PNG, WebP)', 'error');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            $scope.showToaster('Image size should not exceed 5MB', 'error');
            return;
        }

        // Read file and convert to base64
        var reader = new FileReader();
        reader.onload = function(e) {
            $scope.$apply(function() {
                $scope.newCatalog.displayImage = e.target.result;
            });
        };
        reader.readAsDataURL(file);
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
