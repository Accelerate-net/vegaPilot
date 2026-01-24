var app = angular.module('catalogApp', ['ngCookies']);

app.controller('catalogController', function($scope, $http, $cookies, $timeout) {
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




    // API Configuration
    $scope.apiBaseUrl = 'http://localhost:3000/restricted/catalog';

    // Get token from localStorage (same pattern as other controllers)
    

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

    // Initialize scope variables
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };

    // Pagination
    $scope.currentPage = 1;
    $scope.itemsPerPage = 15;
    $scope.totalItems = 0;
    $scope.totalPages = 0;

    // Search and filters
    $scope.searchQuery = '';
    $scope.filterType = '';
    $scope.filterStatus = '';
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
        console.log('Catalog Controller Initialized');
        $scope.loadCatalog();
        $scope.loadSummaryData();
    };
    
    // Load catalog from API
    $scope.loadCatalog = function() {
        $scope.showLoading('Loading catalog...');

        var url = $scope.apiBaseUrl + '/list-catalog.php';
        var params = {
            page: $scope.currentPage,
            size: $scope.itemsPerPage,
            sortBy: 'createdOn'
        };

        if ($scope.searchQuery && $scope.searchQuery.trim().length > 0) {
            params.searchKey = $scope.searchQuery.trim();
        }

        if ($scope.filterType && $scope.filterType !== '') {
            params.filterBy = 'type';
            params.filterValue = $scope.filterType;
        }

        console.log('Loading catalog from API:', url, params);

        $http({
            method: 'GET',
            url: url,
            params: params,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            console.log('Catalog API response:', response.data);

            if (response.data && response.data.status === 'success') {
                var catalogData = response.data.data || [];

                // Map API response to local data structure
                $scope.catalog = catalogData.map(function(item) {
                    return {
                        id: item.id,
                        code: item.code,
                        type: item.type,
                        typeText: item.typeText,
                        fk_id_exam_series: item.fk_id_exam_series,
                        fk_id_course_bundle: item.fk_id_course_bundle,
                        originalPrice: item.originalPrice,
                        sellingPrice: item.sellingPrice,
                        displayImage: item.displayImage || '',
                        taxDetails: item.taxDetails,
                        otherDetails: item.otherDetails,
                        title: item.title,
                        brief: item.brief,
                        coursePage: item.coursePage,
                        isDiscountApplicable: item.isDiscountApplicable,
                        createdBy: item.createdBy,
                        createdOn: item.createdOn,
                        status: item.status,
                        statusText: item.statusText
                    };
                });

                $scope.filteredCatalog = $scope.catalog;

                // Update pagination metadata
                $scope.currentPage = response.data.page;
                $scope.itemsPerPage = response.data.size;
                $scope.totalItems = response.data.total;
                $scope.totalPages = response.data.totalPages;

                $scope.loadSummaryData();
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.catalog = [];
                $scope.filteredCatalog = [];
            }

            $scope.hideLoading();
        }, function(error) {
            console.error('Error loading catalog:', error);
            console.error('Error details:', error.data, error.status, error.statusText);
            $scope.catalog = [];
            $scope.filteredCatalog = [];
            $scope.hideLoading();

            var errorMsg = 'Failed to load catalog. ';
            if (error.status === 0) {
                errorMsg += 'Cannot connect to server. Please check if the API server is running.';
            } else if (error.data && error.data.message) {
                errorMsg += error.data.message;
            } else {
                errorMsg += 'Please try again.';
            }
            $scope.showToaster(errorMsg, 'error');
        });
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
    
    // Apply filters (combining search, type, and status)
    $scope.applyFilters = function() {
        // Reset to page 1 when filters change
        $scope.currentPage = 1;

        // Update active filters display
        $scope.updateActiveFilters();

        // Reload catalog with new filters
        $scope.loadCatalog();
    };

    // Update active filters display
    $scope.updateActiveFilters = function() {
        $scope.activeFilters = [];

        if ($scope.searchQuery) {
            $scope.activeFilters.push({
                label: 'Search: "' + $scope.searchQuery + '"',
                type: 'search'
            });
        }

        if ($scope.filterType) {
            $scope.activeFilters.push({
                label: 'Type: ' + $scope.getTypeLabel($scope.filterType),
                type: 'type'
            });
        }

        if ($scope.filterStatus !== '') {
            $scope.activeFilters.push({
                label: 'Status: ' + $scope.getStatusLabel($scope.filterStatus),
                type: 'status'
            });
        }
    };

    // Clear search (kept for backwards compatibility)
    $scope.clearSearch = function() {
        $scope.searchQuery = '';
        $scope.applyFilters();
    };
    
    // Clear all filters
    $scope.clearAllFilters = function() {
        $scope.activeFilters = [];
        $scope.searchQuery = '';
        $scope.filterType = '';
        $scope.filterStatus = '';
        $scope.applyFilters();
    };

    // Remove filter
    $scope.removeFilter = function(filter) {
        if (filter.type === 'search') {
            $scope.searchQuery = '';
        } else if (filter.type === 'type') {
            $scope.filterType = '';
        } else if (filter.type === 'status') {
            $scope.filterStatus = '';
        }
        $scope.applyFilters();
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
        console.log('Add New Catalog button clicked');
        $scope.isEditing = false;
        $scope.editingId = null;
        $scope.resetNewCatalog();

        // Use timeout to ensure modal opens after Angular digest
        $timeout(function() {
            console.log('Opening catalog modal');
            $('#catalogModal').modal('show');
        }, 0);
    };
    
    // Edit catalog
    $scope.editCatalog = function(item) {
        console.log('Editing catalog item:', item);
        $scope.isEditing = true;
        $scope.editingId = item.id;

        // Map API fields to form fields
        $scope.newCatalog = {
            title: item.title || '',
            subtitle: item.subtitle || '',
            code: item.code || '',
            type: (item.type || 1).toString(), // Convert to string for select dropdown
            fk_id_exam_series: item.fk_id_exam_series || 0,
            fk_id_course_bundle: item.fk_id_course_bundle || 0,
            originalPrice: item.originalPrice || 0,
            sellingPrice: item.sellingPrice || 0,
            specialPrice: item.specialPrice || 0,
            displayImage: item.displayImage || '',
            brief: item.brief || '',
            isDiscountApplicable: item.isDiscountApplicable || 0,
            badgeType: item.badgeType || 'admission',
            status: (item.status !== undefined ? item.status : 1).toString(), // Convert to string for select dropdown
            pageUrl: item.coursePage || item.pageUrl || '', // Map coursePage to pageUrl
            tagline: item.tagline || 'Enroll Now',
            otherDetails: item.otherDetails || '',
            taxItems: []
        };

        // Parse and transform tax items from API format to form format
        if (item.taxDetails) {
            try {
                var taxData = Array.isArray(item.taxDetails) ? item.taxDetails : JSON.parse(item.taxDetails);
                $scope.newCatalog.taxItems = taxData.map(function(tax) {
                    return {
                        type: tax.code || tax.type || 'SGST',
                        customName: tax.type === 'EXTRA' ? tax.label : '',
                        valueType: tax.mode === 'PERCENTAGE' ? 'percentage' : 'fixed',
                        value: parseFloat(tax.value) || 0
                    };
                });
            } catch (e) {
                console.error('Error parsing tax details:', e);
                $scope.newCatalog.taxItems = [];
            }
        }

        console.log('Mapped newCatalog for editing:', $scope.newCatalog);

        $timeout(function() {
            $('#catalogModal').modal('show');
        }, 0);
    };
    
    // Toggle catalog status
    $scope.selectedItemForToggle = null;

    $scope.toggleCatalogStatus = function(item) {
        console.log('Toggle status for:', item);
        $scope.selectedItemForToggle = item;
        $('#statusToggleModal').modal('show');
    };

    $scope.confirmToggleStatus = function() {
        if (!$scope.selectedItemForToggle) return;

        var item = $scope.selectedItemForToggle;
        var newStatus = item.status == 1 ? 0 : 1;

        console.log('Updating status from', item.status, 'to', newStatus);
        $scope.showLoading('Updating catalog status...');

        // Prepare form data
        var formData = new FormData();
        formData.append('code', item.code);
        formData.append('type', item.type === 1 || item.type === '1' ? 'COURSE' : 'TEST');
        formData.append('originalPrice', item.originalPrice);
        formData.append('sellingPrice', item.sellingPrice);
        formData.append('title', item.title);
        formData.append('brief', item.brief || '');
        formData.append('coursePage', item.coursePage || item.pageUrl || '');
        formData.append('isDiscountApplicable', item.isDiscountApplicable ? 'true' : 'false');

        // Add tax details if available
        if (item.taxDetails) {
            var taxDetailsString = Array.isArray(item.taxDetails)
                ? JSON.stringify(item.taxDetails)
                : (typeof item.taxDetails === 'string' ? item.taxDetails : JSON.stringify(item.taxDetails));
            formData.append('taxDetails', taxDetailsString);
        }

        // Add other details if available
        if (item.otherDetails) {
            var otherDetailsString = typeof item.otherDetails === 'string'
                ? item.otherDetails
                : JSON.stringify(item.otherDetails);
            formData.append('otherDetails', otherDetailsString);
        }

        var url = $scope.apiBaseUrl + '/update-catalog-item.php?id=' + item.id;

        $http({
            method: 'POST',
            url: url,
            data: formData,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log('Status toggle API response:', response.data);

            if (response.data && response.data.status === 'success') {
                // Update the item status in the local array
                item.status = newStatus;
                item.statusText = newStatus == 1 ? 'Active' : 'Inactive';

                var message = newStatus == 1
                    ? 'Catalog item "' + item.title + '" enabled successfully!'
                    : 'Catalog item "' + item.title + '" disabled successfully!';

                $scope.showToaster(message, 'success');
                $('#statusToggleModal').modal('hide');
                $scope.selectedItemForToggle = null;
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.showToaster(response.data.message || 'Failed to update status. Please try again.', 'error');
            }

            $scope.hideLoading();
        }, function(error) {
            console.error('Error updating status:', error);
            $scope.hideLoading();
            $scope.showToaster('Failed to update status. Please try again.', 'error');
        });
    };
    
    // Save catalog
    $scope.saveCatalog = function() {
        console.log('saveCatalog called, newCatalog:', $scope.newCatalog);

        // Validation
        if (!$scope.newCatalog.title || !$scope.newCatalog.code) {
            $scope.showToaster('Please fill in required fields: Title and Code', 'error');
            return;
        }

        if (!$scope.newCatalog.originalPrice || !$scope.newCatalog.sellingPrice) {
            $scope.showToaster('Please enter both Original Price and Selling Price', 'error');
            return;
        }

        console.log('Checking pageUrl:', $scope.newCatalog.pageUrl);
        if (!$scope.newCatalog.pageUrl || $scope.newCatalog.pageUrl.trim() === '') {
            $scope.showToaster('Please enter the Course Page URL', 'error');
            return;
        }

        $scope.showLoading($scope.isEditing ? 'Updating catalog...' : 'Creating catalog...');

        // Prepare form data
        var formData = new FormData();
        formData.append('code', $scope.newCatalog.code);
        formData.append('type', $scope.newCatalog.type === 1 || $scope.newCatalog.type === '1' ? 'COURSE' : 'TEST');
        formData.append('originalPrice', $scope.newCatalog.originalPrice);
        formData.append('sellingPrice', $scope.newCatalog.sellingPrice);
        formData.append('title', $scope.newCatalog.title);
        formData.append('brief', $scope.newCatalog.brief || '');
        formData.append('coursePage', $scope.newCatalog.pageUrl || '');
        formData.append('isDiscountApplicable', $scope.newCatalog.isDiscountApplicable ? 'true' : 'false');

        // Add tax details - transform to API format
        if ($scope.newCatalog.taxItems && $scope.newCatalog.taxItems.length > 0) {
            var transformedTaxItems = $scope.newCatalog.taxItems.map(function(item) {
                return {
                    type: item.customName ? 'EXTRA' : 'TAX',
                    mode: item.valueType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
                    code: item.type || item.customName || 'TAX',
                    label: item.customName || (item.type + ' Tax'),
                    value: item.value.toString()
                };
            });
            formData.append('taxDetails', JSON.stringify(transformedTaxItems));
        }

        // Add other details
        if ($scope.newCatalog.otherDetails) {
            formData.append('otherDetails', typeof $scope.newCatalog.otherDetails === 'string'
                ? $scope.newCatalog.otherDetails
                : JSON.stringify($scope.newCatalog.otherDetails));
        }

        // Add display image if available
        if ($scope.newCatalog.displayImageFile) {
            formData.append('displayImage', $scope.newCatalog.displayImageFile);
        }

        var url = $scope.apiBaseUrl + ($scope.isEditing
            ? '/update-catalog-item.php?id=' + $scope.editingId
            : '/add-new-catalog-item.php');

        console.log('Saving catalog to API:', url, $scope.newCatalog);

        $http({
            method: 'POST',
            url: url,
            data: formData,
            headers: {
                'X-Access-Token': getAdminTokenFromCookie(),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log('Save catalog API response:', response.data);

            if (response.data && response.data.status === 'success') {
                var message = $scope.isEditing
                    ? 'Catalog item "' + $scope.newCatalog.title + '" updated successfully!'
                    : 'Catalog item "' + $scope.newCatalog.title + '" created successfully!';

                $scope.showToaster(message, 'success');
                $('#catalogModal').modal('hide');
                $scope.resetNewCatalog();
                $scope.loadCatalog(); // Reload the catalog
            } else {
                console.error('API returned unsuccessful response:', response.data);
                $scope.showToaster(response.data.message || 'Failed to save catalog item. Please try again.', 'error');
            }

            $scope.hideLoading();
        }, function(error) {
            console.error('Error saving catalog:', error);
            $scope.hideLoading();
            $scope.showToaster('Failed to save catalog item. Please try again.', 'error');
        });
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

        // Store the file object for FormData upload
        $scope.newCatalog.displayImageFile = file;

        // Read file and convert to base64 for preview
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
    $scope.toasterType = 'info';

    $scope.showToaster = function(message, type) {
        console.log('Toaster:', type, message);
        $scope.toasterMessage = message;
        $scope.toasterType = type || 'info';
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
    // Pagination functions
    $scope.previousPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.loadCatalog();
        }
    };

    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
            $scope.loadCatalog();
        }
    };

    $scope.goToPage = function(page) {
        if (page >= 1 && page <= $scope.totalPages && page !== $scope.currentPage) {
            $scope.currentPage = page;
            $scope.loadCatalog();
        }
    };

    $scope.getPageNumbers = function() {
        var pages = [];
        var startPage = Math.max(1, $scope.currentPage - 2);
        var endPage = Math.min($scope.totalPages, $scope.currentPage + 2);

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.init();
});
