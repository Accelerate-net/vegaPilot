/**
 * Orders Management Controller
 * Angular 1.x Controller for managing customer orders and invoices
 */

var app = angular.module('ordersApp', ['ngCookies']);

app.controller('ordersController', ['$scope', '$http', '$cookies', '$timeout', function ($scope, $http, $cookies, $timeout) {
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




    // ===== Initialize Data =====
    $scope.orders = [];
    $scope.filteredOrders = [];
    $scope.selectedOrder = null;
    $scope.isLoading = true;

    // Pagination
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.totalPages = 1;

    // Filters
    $scope.searchQuery = '';
    $scope.filterStatus = '';
    $scope.filterPaymentMethod = '';

    // Skeleton Loader Helper
    $scope.getSkeletonRows = function () {
        return new Array($scope.pageSize);
    };

    // ===== Student Quick View Modal State =====
    $scope.studentViewModalOpen = false;
    $scope.selectedStudent = null;

    // Summary data
    $scope.summaryData = {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
    };

    // Profile data
    $scope.profileData = {
        name: 'Admin User',
        email: 'admin@vegapilot.com'
    };

    // Toaster state
    $scope.toasterVisible = false;
    $scope.toasterMessage = '';

    // ===== Sample Orders Data =====
    $scope.dummyOrders = [
        {
            id: 1,
            orderNumber: 'ORD-2025-001',
            orderDate: 1737955200, // Jan 27, 2025
            status: 'completed',
            paymentMethod: 'upi',
            paymentReference: 'UPI202501270001',
            customer: {
                id: 'CAND-001',
                name: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                phone: '+91 98765 43210'
            },
            items: [
                {
                    catalogId: 1,
                    code: 'CR0001',
                    title: 'IAT 2026 – Exclusive 1 Year Course',
                    type: 'Course Bundle',
                    originalPrice: 45000.00,
                    price: 28990.00,
                    image: 'https://crisprlearning.com/wp-content/uploads/2025/01/banner-iat-crash-course.jpg'
                }
            ],
            subtotal: 28990.00,
            taxPercent: 18,
            taxAmount: 5218.20,
            discountAmount: 500.00,
            totalAmount: 33708.20,
            discounts: [
                {
                    code: 'WELCOME500',
                    description: 'Welcome Discount for New Students',
                    amount: 500.00
                }
            ]
        },
        {
            id: 2,
            orderNumber: 'ORD-2025-002',
            orderDate: 1738041600, // Jan 28, 2025
            status: 'completed',
            paymentMethod: 'card',
            paymentReference: 'CARD202501280002',
            customer: {
                id: 'CAND-002',
                name: 'Priya Patel',
                email: 'priya.patel@example.com',
                phone: '+91 87654 32109'
            },
            items: [
                {
                    catalogId: 2,
                    code: 'CR0002',
                    title: 'IAT 2026 - Test Series',
                    type: 'Test Series',
                    originalPrice: 1999.00,
                    price: 999.00,
                    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 999.00,
            taxPercent: 18,
            taxAmount: 179.82,
            discountAmount: 0,
            totalAmount: 1178.82,
            discounts: []
        },
        {
            id: 3,
            orderNumber: 'ORD-2025-003',
            orderDate: 1738128000, // Jan 29, 2025
            status: 'pending',
            paymentMethod: 'netbanking',
            paymentReference: 'NB202501290003',
            customer: {
                id: 'CAND-003',
                name: 'Amit Kumar',
                email: 'amit.kumar@example.com',
                phone: '+91 76543 21098'
            },
            items: [
                {
                    catalogId: 3,
                    code: 'CR0003',
                    title: 'JEE Advanced Complete Package',
                    type: 'Course Bundle',
                    originalPrice: 75000.00,
                    price: 59990.00,
                    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 59990.00,
            taxPercent: 18,
            taxAmount: 10798.20,
            discountAmount: 2000.00,
            totalAmount: 68788.20,
            discounts: [
                {
                    code: 'EARLYBIRD2000',
                    description: 'Early Bird Discount',
                    amount: 2000.00
                }
            ]
        },
        {
            id: 4,
            orderNumber: 'ORD-2025-004',
            orderDate: 1738214400, // Jan 30, 2025
            status: 'completed',
            paymentMethod: 'upi',
            paymentReference: 'UPI202501300004',
            customer: {
                id: 'CAND-004',
                name: 'Sneha Reddy',
                email: 'sneha.reddy@example.com',
                phone: '+91 65432 10987'
            },
            items: [
                {
                    catalogId: 4,
                    code: 'CR0004',
                    title: 'NEET Biology Master Class',
                    type: 'Course',
                    originalPrice: 35000.00,
                    price: 24990.00,
                    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop'
                },
                {
                    catalogId: 5,
                    code: 'CR0005',
                    title: 'NEET Chemistry Crash Course',
                    type: 'Course',
                    originalPrice: 25000.00,
                    price: 17990.00,
                    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 42980.00,
            taxPercent: 18,
            taxAmount: 7736.40,
            discountAmount: 1500.00,
            totalAmount: 49216.40,
            discounts: [
                {
                    code: 'COMBO1500',
                    description: 'Combo Course Discount',
                    amount: 1500.00
                }
            ]
        },
        {
            id: 5,
            orderNumber: 'ORD-2025-005',
            orderDate: 1738300800, // Jan 31, 2025
            status: 'failed',
            paymentMethod: 'card',
            paymentReference: 'CARD202501310005',
            customer: {
                id: 'CAND-005',
                name: 'Vikram Singh',
                email: 'vikram.singh@example.com',
                phone: '+91 54321 09876'
            },
            items: [
                {
                    catalogId: 6,
                    code: 'CR0006',
                    title: 'Physics Olympiad Preparation',
                    type: 'Test Series',
                    originalPrice: 12000.00,
                    price: 8990.00,
                    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 8990.00,
            taxPercent: 18,
            taxAmount: 1618.20,
            discountAmount: 0,
            totalAmount: 10608.20,
            discounts: []
        },
        {
            id: 6,
            orderNumber: 'ORD-2025-006',
            orderDate: 1738387200, // Feb 1, 2025
            status: 'completed',
            paymentMethod: 'upi',
            paymentReference: 'UPI202502010006',
            customer: {
                id: 'CAND-006',
                name: 'Ananya Iyer',
                email: 'ananya.iyer@example.com',
                phone: '+91 43210 98765'
            },
            items: [
                {
                    catalogId: 1,
                    code: 'CR0001',
                    title: 'IAT 2026 – Exclusive 1 Year Course',
                    type: 'Course Bundle',
                    originalPrice: 45000.00,
                    price: 28990.00,
                    image: 'https://crisprlearning.com/wp-content/uploads/2025/01/banner-iat-crash-course.jpg'
                },
                {
                    catalogId: 2,
                    code: 'CR0002',
                    title: 'IAT 2026 - Test Series',
                    type: 'Test Series',
                    originalPrice: 1999.00,
                    price: 999.00,
                    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 29989.00,
            taxPercent: 18,
            taxAmount: 5398.02,
            discountAmount: 3000.00,
            totalAmount: 32387.02,
            discounts: [
                {
                    code: 'MEGASALE3000',
                    description: 'Mega Sale - Limited Time Offer',
                    amount: 3000.00
                }
            ]
        },
        {
            id: 7,
            orderNumber: 'ORD-2025-007',
            orderDate: 1738473600, // Feb 2, 2025
            status: 'refunded',
            paymentMethod: 'netbanking',
            paymentReference: 'NB202502020007',
            customer: {
                id: 'CAND-007',
                name: 'Rohan Mehta',
                email: 'rohan.mehta@example.com',
                phone: '+91 32109 87654'
            },
            items: [
                {
                    catalogId: 3,
                    code: 'CR0003',
                    title: 'JEE Advanced Complete Package',
                    type: 'Course Bundle',
                    originalPrice: 75000.00,
                    price: 59990.00,
                    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop'
                }
            ],
            subtotal: 59990.00,
            taxPercent: 18,
            taxAmount: 10798.20,
            discountAmount: 0,
            totalAmount: 70788.20,
            discounts: []
        }
    ];

    // ===== Initialize App =====
    $scope.init = function () {
        $scope.loadOrders();
        $scope.calculateSummary();
    };

    // ===== Load Orders =====
    $scope.loadOrders = function () {
        $scope.isLoading = true;
        // Simulate network delay
        $timeout(function () {
            $scope.orders = $scope.dummyOrders;
            $scope.filteredOrders = $scope.orders;
            $scope.updatePagination();
            $scope.isLoading = false;
        }, 800);
    };

    // ===== Calculate Summary =====
    $scope.calculateSummary = function () {
        var totalOrders = $scope.orders.length;
        var completedOrders = $scope.orders.filter(function (order) {
            return order.status === 'completed';
        }).length;
        var pendingOrders = $scope.orders.filter(function (order) {
            return order.status === 'pending';
        }).length;
        var totalRevenue = $scope.orders
            .filter(function (order) { return order.status === 'completed'; })
            .reduce(function (sum, order) { return sum + order.totalAmount; }, 0);

        $scope.summaryData = {
            totalOrders: totalOrders,
            completedOrders: completedOrders,
            pendingOrders: pendingOrders,
            totalRevenue: totalRevenue
        };
    };

    // ===== Search and Filter =====
    $scope.applySearch = function () {
        $scope.applyFilters();
    };

    $scope.applyFilters = function () {
        var filtered = $scope.orders;

        // Apply search query
        if ($scope.searchQuery) {
            var query = $scope.searchQuery.toLowerCase();
            filtered = filtered.filter(function (order) {
                return order.orderNumber.toLowerCase().includes(query) ||
                    order.customer.name.toLowerCase().includes(query) ||
                    order.customer.email.toLowerCase().includes(query) ||
                    order.customer.phone.toLowerCase().includes(query) ||
                    order.paymentReference.toLowerCase().includes(query);
            });
        }

        // Apply status filter
        if ($scope.filterStatus) {
            filtered = filtered.filter(function (order) {
                return order.status === $scope.filterStatus;
            });
        }

        // Apply payment method filter
        if ($scope.filterPaymentMethod) {
            filtered = filtered.filter(function (order) {
                return order.paymentMethod === $scope.filterPaymentMethod;
            });
        }

        $scope.filteredOrders = filtered;
        $scope.currentPage = 1;
        $scope.updatePagination();
    };

    $scope.clearSearch = function () {
        $scope.searchQuery = '';
        $scope.applyFilters();
    };

    $scope.clearAllFilters = function () {
        $scope.searchQuery = '';
        $scope.filterStatus = '';
        $scope.filterPaymentMethod = '';
        $scope.applyFilters();
    };

    // ===== Pagination =====
    $scope.updatePagination = function () {
        $scope.totalPages = Math.ceil($scope.filteredOrders.length / $scope.pageSize);
        if ($scope.totalPages === 0) $scope.totalPages = 1;
        // Adjust current page if it exceeds total pages
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }
    };

    $scope.goLeft = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
        }
    };

    $scope.goRight = function () {
        if ($scope.currentPage < $scope.totalPages) {
            $scope.currentPage++;
        }
    };

    // Standard Pagination Helpers (matching candidate-profile.html)
    $scope.previousPage = $scope.goLeft;
    $scope.nextPage = $scope.goRight;

    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
        }
    };

    $scope.getTotalPages = function () {
        return $scope.totalPages;
    };

    $scope.getStartIndex = function () {
        if ($scope.filteredOrders.length === 0) return 0;
        return ($scope.currentPage - 1) * $scope.pageSize + 1;
    };

    $scope.getEndIndex = function () {
        if ($scope.filteredOrders.length === 0) return 0;
        return Math.min($scope.currentPage * $scope.pageSize, $scope.filteredOrders.length);
    };

    $scope.getPageNumbers = function () {
        var pages = [];
        var maxVisibleButtons = 5;
        var startPage = Math.max(1, $scope.currentPage - Math.floor(maxVisibleButtons / 2));
        var endPage = Math.min($scope.totalPages, startPage + maxVisibleButtons - 1);

        if (endPage - startPage + 1 < maxVisibleButtons) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        for (var i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    $scope.changePageSize = function () {
        $scope.currentPage = 1;
        $scope.updatePagination();
    };

    // Math object for template
    $scope.Math = window.Math;

    // ===== Date Formatting =====
    $scope.formatDate = function (timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ===== Kebab Menu & View Order =====
    $scope.openKebabId = null;

    $scope.toggleKebabMenu = function (id, event) {
        if (event) {
            event.stopPropagation();
        }
        if ($scope.openKebabId === id) {
            $scope.openKebabId = null;
        } else {
            $scope.openKebabId = id;
        }
    };

    // Close kebab menu when clicking elsewhere
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.kebab-menu-container').length) {
            $timeout(function () {
                $scope.openKebabId = null;
            });
        }
    });

    // Use Angular for modal state
    $scope.orderModalOpen = false;
    $scope.invoiceModalOpen = false;

    $scope.viewOrder = function (order) {
        $scope.selectedOrder = angular.copy(order);
        $scope.orderModalOpen = true;
    };

    $scope.closeOrderModal = function () {
        $scope.orderModalOpen = false;
    };

    // ===== Order Actions =====
    $scope.viewInvoice = function (order) {
        $scope.selectedOrder = angular.copy(order);
        $scope.invoiceModalOpen = true;
    };

    $scope.closeInvoiceModal = function () {
        $scope.invoiceModalOpen = false;
    };

    $scope.downloadInvoice = function (order) {
        $scope.showToaster('Generating PDF...', 'info');

        var element = document.querySelector('.invoice-body');
        var opt = {
            margin: 10,
            filename: 'Invoice-' + order.orderNumber + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Use html2pdf library
        if (window.html2pdf) {
            html2pdf().set(opt).from(element).save().then(function () {
                $scope.$apply(function () {
                    $scope.showToaster('Invoice downloaded successfully!', 'success');
                });
            }).catch(function (err) {
                console.error('PDF Generation Error:', err);
                $scope.$apply(function () {
                    $scope.showToaster('Error generating PDF. Please try again.', 'error');
                });
            });
        } else {
            $scope.showToaster('PDF library not loaded. Please refresh the page.', 'error');
        }
    };

    // State for email modal
    $scope.emailModalOpen = false;
    $scope.emailData = {
        to: '',
        subject: '',
        orderId: null
    };

    $scope.sendInvoiceEmail = function (order) {
        $scope.emailData = {
            to: order.customer.email, // Pre-fill with customer email
            subject: 'Invoice for Order #' + order.orderNumber,
            orderId: order.id,
            orderNumber: order.orderNumber
        };
        // Use timeout to ensure UI updates if needed or just open modal
        $timeout(function () {
            $scope.emailModalOpen = true;
        });
    };

    $scope.closeEmailModal = function () {
        $scope.emailModalOpen = false;
    };

    $scope.sendEmailConfirmation = function () {
        if (!$scope.emailData.to) {
            $scope.showToaster('Please enter an email address', 'error');
            return;
        }

        // Simulate email sending
        $timeout(function () {
            $scope.emailModalOpen = false;
            $scope.showToaster('Invoice email sent to ' + $scope.emailData.to, 'success');
        }, 500);
    };

    $scope.updateOrderStatus = function (order, newStatus) {
        var index = $scope.orders.findIndex(function (o) {
            return o.id === order.id;
        });

        if (index !== -1) {
            $scope.orders[index].status = newStatus;
            $scope.applyFilters();
            $scope.calculateSummary();
            $scope.showToaster('Order #' + order.orderNumber + ' marked as ' + newStatus, 'success');
        }
    };

    // Refund Modal State
    $scope.refundData = {
        order: null,
        code: ['', '', '', ''],
        error: ''
    };

    $scope.refundModalOpen = false;

    $scope.initiateRefund = function (order) {
        $scope.refundData = {
            order: order,
            code: ['', '', '', ''],
            error: ''
        };
        // Reset inputs
        $scope.refundModalOpen = true;
        $timeout(function () {
            // Focus first input
            var firstInput = document.getElementById('digit-0');
            if (firstInput) firstInput.focus();
        }, 100);
    };

    $scope.closeRefundModal = function () {
        $scope.refundModalOpen = false;
    };

    $scope.handleDigitInput = function (index, event) {
        var val = $scope.refundData.code[index];
        // Ensure only numbers
        if (/[^0-9]/.test(val)) {
            $scope.refundData.code[index] = '';
            return;
        }

        // Auto-advance
        if (val && index < 3) {
            document.getElementById('digit-' + (index + 1)).focus();
        }

        // Handle Backspace to go back
        if (!val && index > 0 && event && event.keyCode === 8) {
            document.getElementById('digit-' + (index - 1)).focus();
        }
    };

    $scope.confirmRefund = function () {
        var code = $scope.refundData.code.join('');
        // Demo validation code '1234'
        if (code.length === 4) {
            $scope.refundModalOpen = false;
            $scope.updateOrderStatus($scope.refundData.order, 'refunded');
            $scope.showToaster('Refund initiated for ₹' + $scope.refundData.order.totalAmount.toFixed(2), 'success');
        } else {
            $scope.refundData.error = "Please enter the complete 4-digit code.";
        }
    };

    // ===== Toaster =====
    $scope.showToaster = function (message, type) {
        var icon = '';
        var color = '';

        switch (type) {
            case 'success':
                icon = '<i class="ti ti-check" style="margin-right: 8px;"></i>';
                color = '#28a745';
                break;
            case 'error':
                icon = '<i class="ti ti-close" style="margin-right: 8px;"></i>';
                color = '#dc3545';
                break;
            case 'info':
                icon = '<i class="ti ti-info-alt" style="margin-right: 8px;"></i>';
                color = '#17a2b8';
                break;
            case 'warning':
                icon = '<i class="ti ti-alert" style="margin-right: 8px;"></i>';
                color = '#ffc107';
                break;
            default:
                icon = '<i class="ti ti-info-alt" style="margin-right: 8px;"></i>';
                color = '#6c757d';
        }

        $scope.toasterMessage = icon + message;
        $scope.toasterVisible = true;

        $timeout(function () {
            $scope.toasterVisible = false;
        }, 3000);
    };

    // ===== Toggle Order Expand/Collapse =====
    $scope.toggleOrderExpand = function (order) {
        order.expanded = !order.expanded;
    };

    // ===== Get Items Summary =====
    $scope.getItemsSummary = function (order) {
        if (!order.items || order.items.length === 0) return 'No items';

        var firstItem = order.items[0].title;
        var remainingCount = order.items.length - 1;

        // Truncate first item title if too long
        if (firstItem.length > 30) {
            firstItem = firstItem.substring(0, 30) + '...';
        }

        if (remainingCount > 0) {
            return firstItem + ' +' + remainingCount;
        } else {
            return firstItem;
        }
    };

    // ===== View Student Profile (Quick View Modal) =====
    $scope.viewStudentProfile = function (customer) {
        // Create student object with customer data
        $scope.selectedStudent = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            avatar: customer.avatar || null,
            status: customer.status || 'active',
            address: customer.address || null,
            enrollmentDate: customer.enrollmentDate || null,
            totalOrders: customer.totalOrders || 0,
            totalSpent: customer.totalSpent || 0,
            enrolledCourses: customer.enrolledCourses || []
        };
        $scope.studentViewModalOpen = true;
    };

    // ===== Close Student Quick View Modal =====
    $scope.closeStudentViewModal = function () {
        $scope.studentViewModalOpen = false;
        $timeout(function () {
            $scope.selectedStudent = null;
        }, 300);
    };

    // ===== View Student Detailed Profile =====
    $scope.viewStudentDetailedProfile = function () {
        // Store student data in localStorage for the detail page
        localStorage.setItem('selectedStudent', JSON.stringify($scope.selectedStudent));
        // Open detail page in new window
        window.open('candidate-detail.html', '_blank');
        // Close the quick view modal
        $scope.closeStudentViewModal();
    };

    // ===== Logout =====
    $scope.logoutNow = function () {
        window.location.href = 'index.html';
    };

}]);
