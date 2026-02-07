document.addEventListener('DOMContentLoaded', () => {

    // Vanilla JS Toaster Implementation
    const toasterContainer = document.querySelector('.toaster-container');
    if (toasterContainer) {
        // Clear Angular template if present
        toasterContainer.innerHTML = '';
    }

    window.showToaster = function (type, title, message) {
        if (!toasterContainer) return;

        // Default title if missing
        if (!message) {
            message = title;
            switch (type) {
                case 'success': title = 'Success'; break;
                case 'error': title = 'Error'; break;
                case 'warning': title = 'Warning'; break;
                case 'info': title = 'Info'; break;
                default: title = 'Notification';
            }
        }

        const toaster = document.createElement('div');
        toaster.className = `toaster ${type}`;

        let iconClass = 'ti-info-alt';
        if (type === 'success') iconClass = 'ti-check';
        if (type === 'error') iconClass = 'ti-alert';
        if (type === 'warning') iconClass = 'ti-bell';

        toaster.innerHTML = `
           <div class="toaster-icon">
              <i class="ti ${iconClass}"></i>
           </div>
           <div class="toaster-content">
              <div class="toaster-title">${title}</div>
              <div class="toaster-message">${message}</div>
           </div>
           <button class="toaster-close">
              <i class="ti ti-close"></i>
           </button>
        `;

        // Close button functionality
        toaster.querySelector('.toaster-close').addEventListener('click', () => {
            toaster.classList.add('hiding');
            setTimeout(() => {
                if (toaster.parentElement) toaster.parentElement.removeChild(toaster);
            }, 500);
        });

        toasterContainer.appendChild(toaster);

        // Auto remove
        setTimeout(() => {
            if (toaster.parentElement) {
                toaster.classList.add('hiding');
                setTimeout(() => {
                    if (toaster.parentElement) toaster.parentElement.removeChild(toaster);
                }, 500);
            }
        }, 5000);
    };


    // Helper to get token
    function getAdminTokenFromCookie() {
        var name = "vegaPilotAdminToken";
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        var cookieVal = v ? v[2] : null;
        return cookieVal || localStorage.getItem("vegaPilotAdminToken");
    }

    // State
    let courses = [];
    let coursesPagination = {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        itemsPerPage: 8  // 8 courses per page in modal
    };
    let modalSearchQuery = '';
    let config = {
        autoEnroll: { courses: [] }, // courses is now array of objects: { code, validity }
        discounts: []
    };
    let discountsPagination = {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        pageSize: 10
    };
    let initialAutoEnrollConfig = null; // Store initial state for comparison
    let tempSelectedCourses = []; // Array of codes for modal selection
    let selectedUsers = []; // Array of selected user objects for discount
    let userSearchTimeout = null; // Debounce timer for user search
    let voucherUsersPagination = {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        pageSize: 5
    };
    let currentVoucherId = null;
    let currentVoucherCode = '';
    let voucherUsersSearchQuery = '';
    const BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "http://localhost:3000"
        : "https://crisprtech.app/crispr-apis";

    let currentStatusFilter = 'all'; // 'all' or 'active'

    // DOM Elements
    const selectedCoursesList = document.getElementById('selectedCoursesList');
    const modalCourseList = document.getElementById('modalCourseList');
    const saveAutoEnrollBtn = document.getElementById('saveAutoEnrollBtn');
    const discountTableBody = document.querySelector('#discountTable tbody');
    const addDiscountBtn = document.getElementById('addDiscountBtn');
    const discountModal = document.getElementById('discountModal');
    const courseSelectModal = document.getElementById('courseSelectModal');
    const openCourseSelectModalBtn = document.getElementById('openCourseSelectModalBtn');
    const confirmCourseSelectionBtn = document.getElementById('confirmCourseSelectionBtn');
    const courseSearchInput = document.getElementById('courseSearchInput');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const discountForm = document.getElementById('discountForm');
    const voucherDetailsModal = document.getElementById('voucherDetailsModal');
    const voucherDetailsContent = document.getElementById('voucherDetailsContent');
    const statusFilter = document.getElementById('statusFilter');

    console.log('DOM Elements Check:');
    console.log('addDiscountBtn:', addDiscountBtn);
    console.log('discountModal:', discountModal);
    console.log('discountForm:', discountForm);
    const modalEmptyState = document.getElementById('modalEmptyState');
    const modalPageInfo = document.getElementById('modalPageInfo');
    const modalPrevPage = document.getElementById('modalPrevPage');
    const modalNextPage = document.getElementById('modalNextPage');
    const modalPageNumbers = document.getElementById('modalPageNumbers');
    const modalPaginationContainer = document.getElementById('modalPaginationContainer');
    const limitedUsersCheckbox = document.getElementById('limitedUsersCheckbox');
    const userSelectionContainer = document.getElementById('userSelectionContainer');
    const userSearchInput = document.getElementById('userSearchInput');
    const userSearchResults = document.getElementById('userSearchResults');
    const selectedUsersContainer = document.getElementById('selectedUsersContainer');
    const viewUsersModal = document.getElementById('viewUsersModal');
    const viewUsersModalTitle = document.getElementById('viewUsersModalTitle');
    const voucherUsersTableBody = document.querySelector('#voucherUsersTable tbody');
    const voucherUserSearchInput = document.getElementById('voucherUserSearchInput');
    const voucherUsersPageInfo = document.getElementById('voucherUsersPageInfo');
    const voucherUsersPrevPage = document.getElementById('voucherUsersPrevPage');
    const voucherUsersNextPage = document.getElementById('voucherUsersNextPage');
    const voucherUsersPageNumbers = document.getElementById('voucherUsersPageNumbers');

    // Discounts Pagination Elements
    const discountsPaginationContainer = document.getElementById('discountsPaginationContainer');
    const discountsPageInfo = document.getElementById('discountsPageInfo');
    const discountsPrevPage = document.getElementById('discountsPrevPage');
    const discountsNextPage = document.getElementById('discountsNextPage');
    const discountsPageNumbers = document.getElementById('discountsPageNumbers');

    // Revoke Confirmation Modal Elements
    const revokeConfirmModal = document.getElementById('revokeConfirmModal');
    const revokeVoucherCode = document.getElementById('revokeVoucherCode');
    const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
    let pendingRevokeId = null;

    // Helper Functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0h 0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    // Check if auto-enrollment config has changed
    function hasAutoEnrollChanges() {
        if (!initialAutoEnrollConfig) return false;

        const current = JSON.stringify(config.autoEnroll.courses);
        const initial = JSON.stringify(initialAutoEnrollConfig);

        return current !== initial;
    }

    // Update Save Button Visibility
    function updateSaveButtonVisibility() {
        if (hasAutoEnrollChanges()) {
            saveAutoEnrollBtn.style.display = 'inline-flex';
        } else {
            saveAutoEnrollBtn.style.display = 'none';
        }
    }

    // Initialization
    init();

    async function init() {
        // Fetch courses, config, and discounts
        const [coursesResult] = await Promise.all([fetchCourses(), fetchConfig(), fetchDiscounts()]);

        // Handle courses result
        if (coursesResult) {
            courses = coursesResult.courses;
            coursesPagination.total = coursesResult.total;
            coursesPagination.totalPages = coursesResult.totalPages;
            coursesPagination.currentPage = coursesResult.currentPage;
        }

        // Migrate old data if necessary
        if (config.autoEnroll.courses.length > 0 && typeof config.autoEnroll.courses[0] === 'string') {
            console.log('Migrating old config format...');
            config.autoEnroll.courses = config.autoEnroll.courses.map(code => ({
                code: code,
                validity: { type: 'duration', value: 365, unit: 'days' }
            }));
        }
        // Save initial state for comparison
        initialAutoEnrollConfig = JSON.parse(JSON.stringify(config.autoEnroll.courses));
        renderSelectedCourses();
        // renderDiscounts() is called inside fetchDiscounts() after data loads
        updateSaveButtonVisibility();
    }

    // API Calls
    async function fetchCourses(page = 1, size = 100, searchKey = '', sortBy = 'name') {
        try {
            // Get auth token from localStorage
            const token = getAdminTokenFromCookie();

            // Build query params
            let url = BASE_URL + `/restricted/catalog/list-catalog.php?page=${page}&size=${size}&sortBy=${sortBy}`;
            if (searchKey) {
                url += `&searchKey=${encodeURIComponent(searchKey)}`;
            }
            // Filter by type to only show courses
            url += `&filterBy=type&filterValue=Course`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Access-Token': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Catalog API response:', res);

            if (res.ok) {
                const result = await res.json();
                console.log('Catalog data:', result);

                if (result.status === 'success' && result.data) {
                    // Transform API data to match expected format
                    const catalogCourses = result.data.map(item => ({
                        code: item.code,
                        title: item.title,
                        category: item.typeText || 'Course',
                        description: item.brief || '',
                        status: item.statusText || 'Active',
                        price: item.sellingPrice,
                        originalPrice: item.originalPrice,
                        displayImage: item.displayImage
                    }));

                    return {
                        courses: catalogCourses,
                        total: result.total || 0,
                        totalPages: result.totalPages || 0,
                        currentPage: result.page || 1
                    };
                } else {
                    throw new Error('API returned unsuccessful response');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (err) {
            console.warn('Error fetching courses from catalog API, using sample data:', err);
            // Fallback sample data from courses-list.js
            courses = [
                {
                    code: 'CR004',
                    title: 'IAT 2026 – Exclusive 1 Year Course',
                    category: 'Science',
                    description: 'Comprehensive preparation for IISER Aptitude Test 2026',
                    modulesList: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
                    totalModules: 4,
                    totalChapters: 57,
                    totalDuration: '201h 45m',
                    status: 'Active',
                    totalStudents: 450,
                    instructor: 'Expert Faculty Team',
                    rating: '4.9'
                },
                {
                    code: 'CR001',
                    title: 'Advanced Web Development Masterclass',
                    category: 'Web Development',
                    description: 'Master modern web development with hands-on projects',
                    modulesList: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js'],
                    totalModules: 5,
                    totalChapters: 45,
                    totalDuration: '85h 30m',
                    status: 'Active',
                    totalStudents: 1250,
                    instructor: 'John Smith',
                    rating: '4.8'
                },
                {
                    code: 'CR002',
                    title: 'Data Science and Machine Learning',
                    category: 'Data Science',
                    description: 'Complete guide to data science and ML algorithms',
                    modulesList: ['Python', 'Statistics', 'ML Algorithms', 'Deep Learning'],
                    totalModules: 4,
                    totalChapters: 52,
                    totalDuration: '95h 15m',
                    status: 'Active',
                    totalStudents: 890,
                    instructor: 'Dr. Sarah Williams',
                    rating: '4.9'
                },
                {
                    code: 'CR003',
                    title: 'Digital Marketing Fundamentals',
                    category: 'Marketing',
                    description: 'Learn digital marketing strategies and tools',
                    modulesList: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
                    totalModules: 4,
                    totalChapters: 32,
                    totalDuration: '48h 20m',
                    status: 'Active',
                    totalStudents: 675,
                    instructor: 'Mark Thompson',
                    rating: '4.7'
                },
                {
                    code: 'CR005',
                    title: 'Python Programming Bootcamp',
                    category: 'Programming',
                    description: 'From beginner to advanced Python programming',
                    modulesList: ['Basics', 'OOP', 'Data Structures', 'Web Development'],
                    totalModules: 4,
                    totalChapters: 38,
                    totalDuration: '62h 45m',
                    status: 'Active',
                    totalStudents: 1120,
                    instructor: 'James Anderson',
                    rating: '4.8'
                },
                {
                    code: 'CR006',
                    title: 'UI/UX Design Masterclass',
                    category: 'Design',
                    description: 'Master user interface and user experience design',
                    modulesList: ['Design Principles', 'Wireframing', 'Prototyping', 'Testing'],
                    totalModules: 4,
                    totalChapters: 28,
                    totalDuration: '42h 30m',
                    status: 'Draft',
                    totalStudents: 0,
                    instructor: 'Emily Chen',
                    rating: '4.6'
                },
                {
                    code: 'CR007',
                    title: 'Cloud Computing with AWS',
                    category: 'Cloud Computing',
                    description: 'Comprehensive AWS cloud services and architecture',
                    modulesList: ['EC2', 'S3', 'Lambda', 'Database Services'],
                    totalModules: 4,
                    totalChapters: 35,
                    totalDuration: '55h 15m',
                    status: 'Active',
                    totalStudents: 540,
                    instructor: 'Michael Brown',
                    rating: '4.8'
                }
            ];

            return {
                courses: courses,
                total: courses.length,
                totalPages: 1,
                currentPage: 1
            };
        }
    }

    async function fetchConfig() {
        try {
            // Get auth token from localStorage
            const token = getAdminTokenFromCookie();

            const res = await fetch(BASE_URL + '/restricted/config/get-auto-enrollment-mapping.php', {
                method: 'GET',
                headers: {
                    'X-Access-Token': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Auto-enrollment API response:', res);

            if (res.ok) {
                const result = await res.json();
                console.log('Auto-enrollment data:', result);

                if (result.status === 'success' && result.data) {
                    // Transform API data to internal format and deduplicate by course code
                    const coursesMap = new Map();

                    result.data.forEach(item => {
                        let validity = {};

                        if (item.validityType === 'COUNTER') {
                            // Parse duration like "24 M" into value and unit
                            const parts = item.validityDuration.trim().split(' ');
                            const value = parseInt(parts[0]);
                            const unitChar = parts[1];

                            let unit = 'months';
                            if (unitChar === 'D') unit = 'days';
                            else if (unitChar === 'M') unit = 'months';
                            else if (unitChar === 'Y') unit = 'years';

                            validity = {
                                type: 'duration',
                                value: value,
                                unit: unit
                            };
                        } else if (item.validityType === 'FIXED_DATE') {
                            // Convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
                            const dateParts = item.validityDuration.split('-');
                            const convertedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                            validity = {
                                type: 'fixed',
                                value: convertedDate // Format: "2026-12-31"
                            };
                        }

                        const courseData = {
                            id: item.id,
                            code: item.course,
                            validity: validity,
                            status: item.status,
                            lastUpdatedOn: item.lastUpdatedOn,
                            lastUpdatedBy: item.lastUpdatedBy
                        };

                        // Only keep the most recent entry for each course code
                        if (!coursesMap.has(item.course) ||
                            coursesMap.get(item.course).lastUpdatedOn < item.lastUpdatedOn) {
                            coursesMap.set(item.course, courseData);
                        }
                    });

                    // Convert Map to array
                    config.autoEnroll.courses = Array.from(coursesMap.values());

                    console.log('Transformed config:', config);
                } else {
                    console.error('API returned unsuccessful response:', result);
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (err) {
            console.error('Error fetching config:', err);
            // Keep empty courses array on error
            config.autoEnroll.courses = [];
        }
    }

    async function saveAutoEnroll(data) {
        try {
            // Get auth token from localStorage
            const token = getAdminTokenFromCookie();

            // Find courses that were removed (in initial but not in current)
            const currentCodes = data.courses.map(c => c.code);
            const removedCourses = initialAutoEnrollConfig
                .filter(initial => !currentCodes.includes(initial.code))
                .map(removed => ({
                    id: removed.id || -1,
                    course: removed.code,
                    type: removed.validity.type === 'fixed' ? 'fixed-date' : 'duration',
                    value: removed.validity.type === 'fixed' ?
                        removed.validity.value.split('-').reverse().join('-') : // Convert to DD-MM-YYYY
                        `${removed.validity.value} ${removed.validity.unit === 'days' ? 'D' : removed.validity.unit === 'months' ? 'M' : 'Y'}`,
                    status: 0  // Mark as removed
                }));

            // Transform current courses to API format
            const apiPayload = data.courses.map(item => {
                const enrollment = {
                    id: item.id || -1,  // Use -1 for new courses
                    course: item.code,
                    status: 1  // Active status
                };

                if (item.validity.type === 'fixed') {
                    // Convert YYYY-MM-DD to DD-MM-YYYY
                    const dateParts = item.validity.value.split('-');
                    enrollment.type = 'fixed-date';
                    enrollment.value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                } else {
                    // Duration type
                    enrollment.type = 'duration';
                    const unitChar = item.validity.unit === 'days' ? 'D' :
                        item.validity.unit === 'months' ? 'M' : 'Y';
                    enrollment.value = `${item.validity.value} ${unitChar}`;
                }

                return enrollment;
            });

            // Combine current and removed courses
            const finalPayload = [...apiPayload, ...removedCourses];

            console.log('Saving auto-enrollment:', finalPayload);

            const res = await fetch(BASE_URL + '/restricted/config/save-auto-enrollment-mapping.php', {
                method: 'POST',
                headers: {
                    'X-Access-Token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalPayload)
            });

            const result = await res.json();
            console.log('Save response:', result);

            if (result.status === 'success') {
                showToaster('success', 'Auto-enrollment settings saved successfully!');
                // Reload config to get updated IDs from server
                await fetchConfig();
                // Update initial state after successful save
                initialAutoEnrollConfig = JSON.parse(JSON.stringify(config.autoEnroll.courses));
                renderSelectedCourses();
                updateSaveButtonVisibility();
            } else {
                showToaster('error', 'Error', 'Failed to save settings: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving auto-enroll:', err);
            showToaster('success', 'Error saving settings.');
        }
    }

    async function saveDiscount(discountData) {
        try {
            const token = getAdminTokenFromCookie();

            const url = BASE_URL + '/restricted/config/add-new-voucher-code.php';

            console.log('Saving discount:', discountData);

            // Send as text/plain to avoid CORS preflight
            // The server should read from php://input and json_decode it
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Access-Token': token,
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(discountData)
            });

            const result = await res.json();
            console.log('Save discount API response:', result);

            if (result.status === 'success') {
                showToaster('success', 'Discount code created successfully!');
                // Refresh the discounts list
                await fetchDiscounts();
            } else {
                showToaster('error', 'Error', 'Failed to save discount code: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving discount:', err);
            showToaster('success', 'Error saving discount code.');
        }
    }

    async function performRevoke(voucherId) {
        try {
            const token = getAdminTokenFromCookie();
            const url = BASE_URL + `/restricted/config/revoke-voucher-code.php?id=${voucherId}`;

            console.log('Revoking voucher:', voucherId);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Access-Token': token
                }
            });

            const result = await res.json();
            console.log('Revoke voucher API response:', result);

            if (result.status === 'success') {
                showToaster('success', 'Voucher code revoked successfully!');
                // Refresh the discounts list
                await fetchDiscounts();
            } else {
                showToaster('error', 'Error', 'Failed to revoke voucher code: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error revoking voucher:', err);
            showToaster('success', 'Error revoking voucher code.');
        }
    }

    async function searchUsers(searchKey) {
        try {
            const token = getAdminTokenFromCookie();

            let url = BASE_URL + `/restricted/people/list-candidates.php?page=1&size=20&sortBy=name`;
            if (searchKey && searchKey.trim()) {
                url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
            }

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Access-Token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const result = await res.json();
                console.log('User search API response:', result);
                if (result.status === 'success' && result.data) {
                    return result.data.map(user => ({
                        id: user.id,
                        candidateKey: user.candidateKey,
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile || user.registeredMobile,
                        photo: user.photo
                    }));
                }
            }
            return [];
        } catch (err) {
            console.error('Error searching users:', err);
            return [];
        }
    }

    async function fetchVoucherUsers(voucherId, page = 1, size = 5, searchKey = '', sortBy = 'name') {
        try {
            const token = getAdminTokenFromCookie();

            let url = BASE_URL + `/restricted/config/get-users-associated-to-voucher-code.php?id=${voucherId}&page=${page}&size=${size}&sortBy=${sortBy}&searchKey=${encodeURIComponent(searchKey)}`;

            console.log('Fetching voucher users from:', url);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Access-Token': token
                }
            });

            if (res.ok) {
                const result = await res.json();
                console.log('Voucher users API response:', result);

                if (result.status === 'success') {
                    // Update pagination
                    if (result.pagination) {
                        voucherUsersPagination.currentPage = result.pagination.currentPage;
                        voucherUsersPagination.totalPages = result.pagination.totalPages;
                        voucherUsersPagination.total = result.pagination.totalRecords;
                        voucherUsersPagination.pageSize = result.pagination.pageSize;
                    }

                    // Update modal title with voucher info
                    if (result.voucherInfo) {
                        viewUsersModalTitle.textContent = `Users Associated with "${result.voucherInfo.code}" (${result.voucherInfo.totalAssociatedUsers} total)`;
                    }

                    renderVoucherUsers(result.data || []);
                }
            }
        } catch (err) {
            console.error('Error fetching voucher users:', err);
        }
    }

    function renderVoucherUsers(users) {
        if (!users || users.length === 0) {
            voucherUsersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                        No users found
                    </td>
                </tr>
            `;
            renderVoucherUsersPageNumbers();
            return;
        }

        voucherUsersTableBody.innerHTML = users.map(user => {
            let statusColumn = '';

            if (user.hasClaimed) {
                // User has claimed - show check icon and timestamp
                statusColumn = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="ti ti-check" style="color: #10b981; font-size: 18px;" title="Claimed"></i>
                        <span style="font-size: 12px; color: #6b7280;">
                            ${user.claimedAt || 'N/A'}
                        </span>
                    </div>
                `;
            } else {
                // User has not claimed yet
                statusColumn = `
                    <span style="color: #9ca3af; font-size: 12px;">Not claimed</span>
                `;
            }

            return `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.mobile || 'N/A'}</td>
                    <td>${statusColumn}</td>
                </tr>
            `;
        }).join('');

        renderVoucherUsersPageNumbers();
    }

    function renderVoucherUsersPageNumbers() {
        const { currentPage, totalPages } = voucherUsersPagination;

        voucherUsersPageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        voucherUsersPrevPage.disabled = currentPage === 1;
        voucherUsersNextPage.disabled = currentPage === totalPages;

        let pageButtons = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageButtons += `
                <button
                    onclick="changeVoucherUsersPage(${i})"
                    style="padding: 5px 10px; margin: 0 2px; border: 1px solid #ddd;
                           background: ${i === currentPage ? '#006073' : 'white'};
                           color: ${i === currentPage ? 'white' : '#333'};
                           cursor: pointer; border-radius: 4px;"
                    ${i === currentPage ? 'disabled' : ''}
                >
                    ${i}
                </button>
            `;
        }

        voucherUsersPageNumbers.innerHTML = pageButtons;
    }

    window.viewVoucherUsers = function (voucherId, voucherCode) {
        currentVoucherId = voucherId;
        currentVoucherCode = voucherCode;
        voucherUsersSearchQuery = '';
        voucherUserSearchInput.value = '';
        fetchVoucherUsers(voucherId, 1, 5, '', 'name');
        viewUsersModal.classList.add('active');
    };

    window.viewVoucherDetails = function (index) {
        const discount = config.discounts[index];
        if (!discount) return;

        // Visual helper for rows
        const renderDetailRow = (label, value, iconClass) => `
            <div style="display: flex; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid #f1f5f9; align-items: center; last-child:border-bottom:none;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="${iconClass}" style="color: #94a3b8; font-size: 14px; width: 20px; text-align: center;"></i>
                    <span style="color: #64748b; font-weight: 500; font-size: 13px;">${label}</span>
                </div>
                <span style="color: #334155; font-weight: 600; font-size: 14px;">${value}</span>
            </div>
        `;

        // Format dates
        let validUntilDisplay = 'N/A';
        if (discount.validUntil) {
            const parts = discount.validUntil.split('-');
            if (parts.length === 3) {
                validUntilDisplay = `${parts[0]}-${parts[1]}-${parts[2]}`;
            } else {
                validUntilDisplay = discount.validUntil;
            }
        }

        let valueDisplay = discount.type === 'percentage' ? (discount.value / 1000) + '%' : '₹' + discount.value;
        const statusBadge = discount.status === 1
            ? '<span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Active</span>'
            : '<span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Expired</span>';

        voucherDetailsContent.innerHTML = `
            <div style="padding: 10px;">
                <!-- Header with Code and Status -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
                    <div>
                        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 5px;">Voucher Code</span>
                        <div style="font-size: 28px; font-weight: 700; color: #006073; font-family: monospace; letter-spacing: 1px; line-height: 1;">
                            ${discount.code}
                        </div>
                    </div>
                    <div>${statusBadge}</div>
                </div>

                <!-- Key Metrics Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                         <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Discount Type</div>
                         <div style="font-size: 15px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; text-transform: capitalize;">
                            <i class="ti ti-${discount.type === 'percentage' ? 'pie-chart' : 'wallet'}" style="color: #006073;"></i> 
                            ${discount.type}
                         </div>
                    </div>
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                         <div style="font-size: 11px; text-transform: uppercase; color: #166534; margin-bottom: 5px;">Value</div>
                         <div style="font-size: 18px; font-weight: 700; color: #15803d;">${valueDisplay}</div>
                    </div>
                </div>

                <!-- Rules Section -->
                <div style="margin-bottom: 20px;">
                    <h5 style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">Configuration & Rules</h5>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        ${renderDetailRow('Valid Until', validUntilDisplay, 'ti-calendar')}
                        ${renderDetailRow('Min. Order Value', '₹' + (discount.minOrderValue || 0), 'ti-shopping-cart')}
                        ${discount.type === 'percentage' ? renderDetailRow('Max Discount Cap', '₹' + (discount.maxDiscount || 0), 'ti-arrow-up') : ''}
                        ${renderDetailRow('Usage Limit', discount.usageLimit ? discount.usageLimit + ' uses' : 'Unlimited', 'ti-infinite')}
                        ${renderDetailRow('Audience', discount.userSpecific ? 'Specific Users Only' : 'All Users', 'ti-user')}
                    </div>
                </div>

                <!-- Footer Meta -->
                <div style="text-align: right; font-size: 11px; color: #9ca3af; padding-top: 10px;">
                    Created on ${discount.createdOn || 'N/A'} • By ${discount.createdBy || 'System'}
                </div>
            </div>
        `;

        voucherDetailsModal.classList.add('active');
    };

    window.changeVoucherUsersPage = function (page) {
        if (currentVoucherId) {
            fetchVoucherUsers(currentVoucherId, page, 5, voucherUsersSearchQuery, 'name');
        }
    };

    async function fetchDiscounts(page = 1, size = 10) {
        try {
            // Use the same token retrieval as searchUsers
            const token = getAdminTokenFromCookie();

            let url = `http://localhost:3000/restricted/config/list-vouchers.php?page=${page}&size=${size}`;

            // Add filterActive parameter if 'Active Only' is selected
            if (currentStatusFilter === 'active') {
                url += '&filterActive=true';
            }

            console.log('Fetching discounts from:', url);
            console.log('Using token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Access-Token': token
                }
            });

            console.log('Discounts API response status:', res.status);

            if (res.ok) {
                const result = await res.json();
                console.log('Discounts API response:', result);
                if (result.status === 'success' && result.data) {
                    // Transform API data to internal format
                    config.discounts = result.data.map(discount => ({
                        id: discount.id,
                        code: discount.code,
                        type: discount.discountType,
                        value: discount.value,
                        minOrderValue: discount.minOrderValue,
                        maxDiscount: discount.maxDiscount,
                        validUntil: discount.validityUntil,
                        usageLimit: discount.limitedOn ? discount.limitedOn.length : null,
                        userSpecific: discount.userSpecific === 1,
                        limitedToUsers: discount.userSpecific === 1 ? discount.limitedOn : null,
                        status: discount.status,
                        createdOn: discount.createdOn,
                        createdBy: discount.createdBy
                    }));

                    console.log('Transformed discounts:', config.discounts);

                    // Update pagination
                    if (result.pagination) {
                        discountsPagination.currentPage = result.pagination.currentPage;
                        discountsPagination.totalPages = result.pagination.totalPages;
                        discountsPagination.total = result.pagination.totalRecords;
                        discountsPagination.pageSize = result.pagination.pageSize;
                    }

                    console.log('About to render discounts. Table body element:', discountTableBody);
                    renderDiscounts();
                    renderDiscountsPagination();
                } else {
                    console.error('API response missing data or status not success');
                    renderDiscounts(); // Render empty state
                    renderDiscountsPagination();
                }
            } else {
                console.error('API response not OK. Status:', res.status);
                renderDiscounts(); // Render empty state
                renderDiscountsPagination();
            }
        } catch (err) {
            console.error('Error fetching discounts:', err);
            console.error('Error details:', err.message);
            renderDiscounts(); // Render empty state even on error
        }
    }

    // Rendering
    // Rendering
    function renderSelectedCourses() {
        console.log('renderSelectedCourses called');
        console.log('config.autoEnroll.courses:', config.autoEnroll.courses);
        console.log('courses:', courses);

        if (config.autoEnroll.courses.length === 0) {
            selectedCoursesList.innerHTML = `
                <div class="text-center" style="padding: 30px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; grid-column: 1 / -1;">
                    <i class="ti ti-book" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No courses selected for auto-enrollment.
                </div>
            `;
            return;
        }

        // Map each auto-enrollment course, finding its details or using a placeholder
        selectedCoursesList.innerHTML = config.autoEnroll.courses.map(enrollmentCourse => {
            // Try to find the course details
            const course = courses.find(c => c.code === enrollmentCourse.code) || {
                code: enrollmentCourse.code,
                title: `Course ${enrollmentCourse.code}`,
                category: 'Unknown'
            };

            const settings = enrollmentCourse.validity || { type: 'duration', value: 365, unit: 'days' };
            const isFixed = settings.type === 'fixed';

            return `
            <div class="course-card" style="cursor: default; border-color: #e5e7eb; background: white; flex-direction: column; gap: 0; align-items: stretch; padding: 0; overflow: hidden;">
                <!-- Card Header -->
                <div style="padding: 15px; display: flex; gap: 12px; align-items: flex-start; border-bottom: 1px solid #f1f5f9;">
                    <div class="course-icon" style="background: #006073; color: white; width: 36px; height: 36px; font-size: 16px;">
                        <i class="ti ti-book"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px; font-size: 14px; line-height: 1.3;">${course.title}</div>
                        <div style="font-size: 11px; color: #6b7280; font-family: monospace;">${course.category} • ${course.code}</div>
                    </div>
                    <button class="btn btn-sm" onclick="removeCourse('${course.code}')" style="background: none; border: none; color: #991b1b; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                        <i class="ti ti-close"></i>
                    </button>
                </div>
                
                <!-- Validity Settings -->
                <div style="background: #f8fafc; padding: 12px 15px;">
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; text-transform: uppercase;">
                        <i class="ti ti-calendar" style="font-size: 12px;"></i> Validity
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <select class="form-control input-sm" onchange="updateValidityType('${course.code}', this.value)" style="width: 100%; border-color: #e2e8f0; font-size: 13px; padding: 6px 10px; height: auto;">
                            <option value="duration" ${!isFixed ? 'selected' : ''}>Duration Based</option>
                            <option value="fixed" ${isFixed ? 'selected' : ''}>Fixed Date</option>
                        </select>
                        
                        ${!isFixed ? `
                            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 8px;">
                                <input type="number" class="form-control input-sm" value="${settings.value || 365}" min="1" 
                                    style="border-color: #e2e8f0; font-size: 13px; padding: 6px 10px; height: auto;"
                                    placeholder="Value"
                                    onchange="updateValidityValue('${course.code}', 'value', this.value)">
                                <select class="form-control input-sm" style="border-color: #e2e8f0; font-size: 13px; padding: 6px 10px; height: auto;"
                                    onchange="updateValidityValue('${course.code}', 'unit', this.value)">
                                    <option value="days" ${settings.unit === 'days' ? 'selected' : ''}>Days</option>
                                    <option value="months" ${settings.unit === 'months' ? 'selected' : ''}>Months</option>
                                    <option value="years" ${settings.unit === 'years' ? 'selected' : ''}>Years</option>
                                </select>
                            </div>
                        ` : `
                            <input type="date" class="form-control input-sm" value="${settings.value || ''}" 
                                style="border-color: #e2e8f0; font-size: 13px; padding: 6px 10px; height: auto; width: 100%;"
                                onchange="updateValidityValue('${course.code}', 'value', this.value)">
                        `}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    async function renderModalCourses() {
        const result = await fetchCourses(
            coursesPagination.currentPage,
            coursesPagination.itemsPerPage,
            modalSearchQuery,
            'name'
        );

        if (result) {
            courses = result.courses;
            coursesPagination.total = result.total;
            coursesPagination.totalPages = result.totalPages;
            coursesPagination.currentPage = result.currentPage;
        }

        // Show/hide empty state
        if (courses.length === 0) {
            modalCourseList.style.display = 'none';
            modalEmptyState.style.display = 'block';
            modalPaginationContainer.style.display = 'none';
            return;
        } else {
            modalCourseList.style.display = 'grid';
            modalEmptyState.style.display = 'none';
            modalPaginationContainer.style.display = 'flex';
        }

        // Render courses
        console.log('Rendering modal courses. Total courses:', courses.length);
        console.log('First 3 course codes:', courses.slice(0, 3).map(c => c.code));
        console.log('tempSelectedCourses for comparison:', tempSelectedCourses);

        modalCourseList.innerHTML = courses.map(course => {
            const isSelected = tempSelectedCourses.includes(course.code);
            console.log(`Course ${course.code}: ${isSelected ? 'SELECTED' : 'not selected'}`);
            return `
                <label style="margin: 0;">
                    <input type="checkbox" class="course-checkbox" value="${course.code}"
                        ${isSelected ? 'checked' : ''}>
                    <div class="course-card">
                        <div class="course-icon">
                            <i class="ti ti-book"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${course.title}</div>
                            <div style="font-size: 0.85rem; color: #6b7280;">${course.category} • ${course.code}</div>
                        </div>
                        <div class="check-indicator" style="color: #006073; opacity: 0; transition: opacity 0.2s;">
                            <i class="ti ti-check"></i>
                        </div>
                    </div>
                </label>
            `;
        }).join('');

        // Re-attach event listeners for checkboxes in modal
        document.querySelectorAll('#modalCourseList .course-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!tempSelectedCourses.includes(e.target.value)) {
                        tempSelectedCourses.push(e.target.value);
                    }
                } else {
                    tempSelectedCourses = tempSelectedCourses.filter(id => id !== e.target.value);
                }
            });
        });

        // Update pagination info
        const startItem = (coursesPagination.currentPage - 1) * coursesPagination.itemsPerPage + 1;
        const endItem = Math.min(coursesPagination.currentPage * coursesPagination.itemsPerPage, coursesPagination.total);
        modalPageInfo.textContent = `${startItem}-${endItem} of ${coursesPagination.total}`;

        // Update pagination buttons
        modalPrevPage.disabled = coursesPagination.currentPage === 1;
        modalNextPage.disabled = coursesPagination.currentPage === coursesPagination.totalPages;

        // Render page numbers
        renderModalPageNumbers();

        // Add style for check indicator visibility
        if (!document.getElementById('checkboxStyle')) {
            const style = document.createElement('style');
            style.id = 'checkboxStyle';
            style.innerHTML = `.course-checkbox:checked + .course-card .check-indicator { opacity: 1; }`;
            document.head.appendChild(style);
        }
    }

    function renderModalPageNumbers() {
        const maxPagesToShow = 5;
        const pages = [];
        let startPage = Math.max(1, coursesPagination.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(coursesPagination.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        modalPageNumbers.innerHTML = pages.map(page => `
            <button type="button" class="btn btn-sm ${page === coursesPagination.currentPage ? 'btn-primary' : 'btn-default'}"
                    onclick="goToModalPage(${page})"
                    style="padding: 5px 12px; min-width: 35px;">
                ${page}
            </button>
        `).join('');
    }

    window.goToModalPage = function (page) {
        if (page >= 1 && page <= coursesPagination.totalPages) {
            coursesPagination.currentPage = page;
            renderModalCourses();
        }
    };

    function renderDiscounts() {
        console.log('renderDiscounts called. Discounts count:', config.discounts.length);
        console.log('Discounts data:', config.discounts);
        console.log('Table body element:', discountTableBody);

        if (!discountTableBody) {
            console.error('discountTableBody element not found!');
            return;
        }

        if (config.discounts.length === 0) {
            console.log('No discounts to display');
            discountTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #718096; padding: 30px;">No discount codes found</td></tr>';
            return;
        }

        console.log('Rendering', config.discounts.length, 'discounts');

        discountTableBody.innerHTML = config.discounts.map((discount, index) => {
            // Parse date if it's in DD-MM-YYYY format
            let validUntilDate = null;
            if (discount.validUntil) {
                const parts = discount.validUntil.split('-');
                if (parts.length === 3) {
                    // Assuming DD-MM-YYYY format from API
                    validUntilDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                    validUntilDate = new Date(discount.validUntil);
                }
            }

            const isExpired = validUntilDate && validUntilDate < new Date();

            // Determine status: Revoked (status=0) > Expired > Active
            let statusClass, statusText;
            if (discount.status === 0) {
                statusClass = 'status-revoked';
                statusText = 'Revoked';
            } else if (isExpired) {
                statusClass = 'status-expired';
                statusText = 'Expired';
            } else {
                statusClass = 'status-active';
                statusText = 'Active';
            }

            // Format value display
            let valueDisplay = '';
            if (discount.type === 'percentage') {
                valueDisplay = (discount.value / 1000) + '%';
            } else {
                valueDisplay = '₹' + discount.value;
            }

            // User specific indicator - clickable badge
            const userSpecificBadge = discount.userSpecific
                ? `<span onclick="event.stopPropagation(); viewVoucherUsers(${discount.id}, '${discount.code}')" style="display: inline-block; background: #e0f2f1; color: #006073; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 5px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#b2dfdb'" onmouseout="this.style.background='#e0f2f1'">User Specific</span>`
                : '';

            return `
                <tr onclick="viewVoucherDetails(${index})">
                    <td style="font-weight: 600; font-family: monospace; color: #2c3e50;">${discount.code}${userSpecificBadge}</td>
                    <td>${discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                    <td>${valueDisplay}</td>
                    <td>${validUntilDate ? validUntilDate.toLocaleDateString() : 'N/A'}</td>
                    <td>${discount.usageLimit || 'Unlimited'}</td>
                    <td style="text-align: center;"><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td style="text-align: center;" onclick="event.stopPropagation()">
                        <div class="kebab-menu-container">
                            <button type="button" class="kebab-button" onclick="toggleDiscountKebabMenu(this, event)">
                                <i class="ti ti-more-alt"></i>
                            </button>
                            <div class="kebab-dropdown">
                                <div class="kebab-dropdown-item view-profile" onclick="viewVoucherDetails(${index})">
                                    <i class="ti ti-eye"></i>
                                    <span class="item-label">Voucher Details</span>
                                </div>
                                ${discount.status === 1 ? `
                                <div class="kebab-dropdown-item delete-action" onclick="revokeDiscount(${discount.id}, '${discount.code}')">
                                    <i class="ti ti-ban"></i>
                                    <span class="item-label">Revoke Voucher</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Kebab Menu Logic
    window.toggleDiscountKebabMenu = function (button, event) {
        event.stopPropagation();

        // Close all other open menus
        document.querySelectorAll('.kebab-dropdown.active').forEach(el => {
            if (el !== button.nextElementSibling) {
                el.classList.remove('active');
                // Remove z-index override from row/cell
                const row = el.closest('tr');
                if (row) row.classList.remove('row-active-menu');
                const cell = el.closest('td');
                if (cell) cell.classList.remove('cell-active-menu');
            }
        });

        const dropdown = button.nextElementSibling;
        dropdown.classList.toggle('active');

        // Toggle z-index override for row/cell to ensure menu shows over other rows
        const row = button.closest('tr');
        if (row) row.classList.toggle('row-active-menu');
        const cell = button.closest('td');
        if (cell) cell.classList.toggle('cell-active-menu');
    };

    // Close menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.kebab-dropdown.active').forEach(el => {
            el.classList.remove('active');
            const row = el.closest('tr');
            if (row) row.classList.remove('row-active-menu');
            const cell = el.closest('td');
            if (cell) cell.classList.remove('cell-active-menu');
        });
    });

    function renderDiscountsPagination() {
        if (!config.discounts.length || discountsPagination.total === 0) {
            discountsPaginationContainer.style.display = 'none';
            return;
        }

        discountsPaginationContainer.style.display = 'flex';

        const { currentPage, totalPages, total, pageSize } = discountsPagination;
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);

        discountsPageInfo.textContent = `${startItem}-${endItem} of ${total}`;

        discountsPrevPage.disabled = currentPage === 1;
        discountsNextPage.disabled = currentPage === totalPages;

        // Render page number buttons
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        let pagesHtml = '';
        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `
                <button type="button" 
                    class="pagination-btn ${i === currentPage ? 'active' : ''}"
                    onclick="changeDiscountPage(${i})">
                    ${i}
                </button>
            `;
        }
        discountsPageNumbers.innerHTML = pagesHtml;
    }

    window.changeDiscountPage = function (page) {
        if (page < 1 || page > discountsPagination.totalPages || page === discountsPagination.currentPage) return;
        fetchDiscounts(page);
    };

    function renderSelectedUsers() {
        console.log('Rendering selected users:', selectedUsers);
        if (selectedUsers.length === 0) {
            selectedUsersContainer.innerHTML = '<div style="color: #9ca3af; font-size: 13px; padding: 6px 0;">No users selected</div>';
            return;
        }

        selectedUsersContainer.innerHTML = selectedUsers.map(user => `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; background: #e0f2f1; border-radius: 16px; font-size: 13px; margin: 2px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #006073; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <span style="color: #006073; font-weight: 500;">${user.name}</span>
                <button type="button" onclick="removeSelectedUser(${user.id})" style="background: none; border: none; color: #006073; cursor: pointer; padding: 2px 4px; margin-left: 4px; line-height: 1; display: flex; align-items: center; justify-content: center;">
                    ✕
                </button>
            </div>
        `).join('');
        console.log('Selected users rendered successfully');
    }

    function renderUserSearchResults(users) {
        if (users.length === 0) {
            userSearchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #9ca3af; font-size: 13px;">No users found</div>';
            userSearchResults.style.display = 'block';
            return;
        }

        // Filter out already selected users
        const selectedUserIds = selectedUsers.map(u => u.id);
        const availableUsers = users.filter(u => !selectedUserIds.includes(u.id));

        if (availableUsers.length === 0) {
            userSearchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #9ca3af; font-size: 13px;">All matching users already selected</div>';
            userSearchResults.style.display = 'block';
            return;
        }

        userSearchResults.innerHTML = availableUsers.map(user => `
            <div onclick="selectUser(${user.id}, '${user.name.replace(/'/g, "\\'")}', '${user.email}', '${user.mobile || ''}')"
                 style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;"
                 onmouseover="this.style.background='#f9fafb'"
                 onmouseout="this.style.background='white'">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #006073; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #1f2937; font-size: 14px;">${user.name}</div>
                    <div style="font-size: 12px; color: #6b7280;">${user.email} ${user.mobile ? '• ' + user.mobile : ''}</div>
                </div>
            </div>
        `).join('');
        userSearchResults.style.display = 'block';
    }

    // Event Handlers
    saveAutoEnrollBtn.addEventListener('click', () => {
        saveAutoEnroll({
            courses: config.autoEnroll.courses
        });
    });

    // Course Selection Modal
    openCourseSelectModalBtn.addEventListener('click', () => {
        // Pre-select courses that are already in auto-enrollment config
        tempSelectedCourses = config.autoEnroll.courses
            .filter(c => c.status !== 0)  // Only include active courses
            .map(c => c.code);
        console.log('Pre-selected courses:', tempSelectedCourses);
        console.log('Auto-enroll config courses:', config.autoEnroll.courses);

        coursesPagination.currentPage = 1;
        modalSearchQuery = '';
        courseSearchInput.value = '';
        renderModalCourses();
        courseSelectModal.classList.add('active');
    });

    confirmCourseSelectionBtn.addEventListener('click', () => {
        // Merge new selections with existing settings
        const newSelection = tempSelectedCourses.map(code => {
            const existing = config.autoEnroll.courses.find(c => c.code === code);
            return existing || {
                code: code,
                validity: { type: 'duration', value: 365, unit: 'days' }
            };
        });

        config.autoEnroll.courses = newSelection;
        renderSelectedCourses();
        updateSaveButtonVisibility();
        courseSelectModal.classList.remove('active');
    });

    // Search input - debounced search
    let searchTimeout;
    courseSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            modalSearchQuery = e.target.value;
            coursesPagination.currentPage = 1; // Reset to first page on search
            renderModalCourses();
        }, 300); // 300ms debounce
    });

    // Pagination button event listeners
    modalPrevPage.addEventListener('click', () => {
        if (coursesPagination.currentPage > 1) {
            coursesPagination.currentPage--;
            renderModalCourses();
        }
    });

    modalNextPage.addEventListener('click', () => {
        if (coursesPagination.currentPage < coursesPagination.totalPages) {
            coursesPagination.currentPage++;
            renderModalCourses();
        }
    });

    // Global functions
    window.removeCourse = (code) => {
        config.autoEnroll.courses = config.autoEnroll.courses.filter(c => c.code !== code);
        renderSelectedCourses();
        updateSaveButtonVisibility();
    };

    window.updateValidityType = (code, type) => {
        const course = config.autoEnroll.courses.find(c => c.code === code);
        if (course) {
            course.validity.type = type;
            // Reset value based on type
            if (type === 'fixed') {
                course.validity.value = '';
                delete course.validity.unit;
            } else {
                course.validity.value = 365;
                course.validity.unit = 'days';
            }
            renderSelectedCourses(); // Re-render to show correct inputs
            updateSaveButtonVisibility();
        }
    };

    window.updateValidityValue = (code, field, value) => {
        const course = config.autoEnroll.courses.find(c => c.code === code);
        if (course) {
            course.validity[field] = value;
            updateSaveButtonVisibility();
        }
    };

    // Discount Modal
    const discountTypeSelect = document.getElementById('discountType');
    const percentageFields = document.getElementById('percentageFields');
    const fixedFields = document.getElementById('fixedFields');

    // Toggle conditional fields based on discount type
    function toggleDiscountFields() {
        const discountType = discountTypeSelect.value;
        if (discountType === 'percentage') {
            percentageFields.style.display = 'flex';
            fixedFields.style.display = 'none';
        } else {
            percentageFields.style.display = 'none';
            fixedFields.style.display = 'flex';
        }
    }

    // Initialize on page load
    toggleDiscountFields();

    discountTypeSelect.addEventListener('change', toggleDiscountFields);

    addDiscountBtn.addEventListener('click', () => {
        discountModal.classList.add('active');
        toggleDiscountFields(); // Reset fields when opening modal

        // Reset user selection state
        selectedUsers = [];
        limitedUsersCheckbox.checked = false;
        userSelectionContainer.style.display = 'none';
        userSearchInput.value = '';
        userSearchResults.style.display = 'none';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            discountModal.classList.remove('active');
            courseSelectModal.classList.remove('active');
            voucherDetailsModal.classList.remove('active');
            revokeConfirmModal.classList.remove('active');
        });
    });

    // User selection for discount modal
    limitedUsersCheckbox.addEventListener('change', () => {
        if (limitedUsersCheckbox.checked) {
            userSelectionContainer.style.display = 'block';
            renderSelectedUsers();
        } else {
            userSelectionContainer.style.display = 'none';
            selectedUsers = [];
            userSearchResults.style.display = 'none';
            userSearchInput.value = '';
        }
    });

    userSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();

        // Clear previous timeout
        if (userSearchTimeout) {
            clearTimeout(userSearchTimeout);
        }

        // Hide results if search is empty
        if (!searchTerm) {
            userSearchResults.style.display = 'none';
            return;
        }

        // Debounce search (300ms delay)
        userSearchTimeout = setTimeout(async () => {
            const users = await searchUsers(searchTerm);
            renderUserSearchResults(users);
        }, 300);
    });

    // Close user search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!userSearchResults.contains(e.target) && e.target !== userSearchInput) {
            userSearchResults.style.display = 'none';
        }
    });

    // Status filter change handler
    statusFilter.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        // Reset to page 1 and fetch with filter
        fetchDiscounts(1);
    });

    // Voucher users modal event listeners
    voucherUserSearchInput.addEventListener('input', debounce(() => {
        voucherUsersSearchQuery = voucherUserSearchInput.value.trim();
        if (currentVoucherId) {
            fetchVoucherUsers(currentVoucherId, 1, 5, voucherUsersSearchQuery, 'name');
        }
    }, 300));

    voucherUsersPrevPage.addEventListener('click', () => {
        const { currentPage } = voucherUsersPagination;
        if (currentPage > 1 && currentVoucherId) {
            fetchVoucherUsers(currentVoucherId, currentPage - 1, 5, voucherUsersSearchQuery, 'name');
        }
    });

    voucherUsersNextPage.addEventListener('click', () => {
        const { currentPage, totalPages } = voucherUsersPagination;
        if (currentPage < totalPages && currentVoucherId) {
            fetchVoucherUsers(currentVoucherId, currentPage + 1, 5, voucherUsersSearchQuery, 'name');
        }
    });

    // Close voucher users modal
    viewUsersModal.querySelector('.close-modal').addEventListener('click', () => {
        viewUsersModal.classList.remove('active');
        currentVoucherId = null;
        currentVoucherCode = '';
        voucherUsersSearchQuery = '';
    });

    // Discount pagination listeners
    if (discountsPrevPage) {
        discountsPrevPage.addEventListener('click', () => {
            const { currentPage } = discountsPagination;
            if (currentPage > 1) {
                fetchDiscounts(currentPage - 1);
            }
        });
    }

    if (discountsNextPage) {
        discountsNextPage.addEventListener('click', () => {
            const { currentPage, totalPages } = discountsPagination;
            if (currentPage < totalPages) {
                fetchDiscounts(currentPage + 1);
            }
        });
    }

    // Global functions for user selection (accessible from onclick handlers)
    window.selectUser = (id, name, email, mobile) => {
        // Check if user already selected
        if (selectedUsers.some(u => u.id === id)) {
            return;
        }

        selectedUsers.push({ id, name, email, mobile });
        renderSelectedUsers();
        userSearchInput.value = '';
        userSearchResults.style.display = 'none';
    };

    window.removeSelectedUser = (id) => {
        selectedUsers = selectedUsers.filter(u => u.id !== parseInt(id));
        renderSelectedUsers();
    };

    window.revokeDiscount = function (voucherId, voucherCode) {
        pendingRevokeId = voucherId;
        revokeVoucherCode.textContent = voucherCode;
        revokeConfirmModal.classList.add('active');
    };

    // Confirm revoke button
    confirmRevokeBtn.addEventListener('click', async () => {
        if (pendingRevokeId) {
            revokeConfirmModal.classList.remove('active');
            await performRevoke(pendingRevokeId);
            pendingRevokeId = null;
        }
    });

    // Form submit handler
    async function handleDiscountFormSubmit(e) {
        console.log('Form submit triggered!');
        e.preventDefault();
        e.stopPropagation();
        console.log('Default prevented');

        try {
            const formData = new FormData(discountForm);
            const discountType = formData.get('type');

            // Build API payload according to specification
            const apiPayload = {
                code: formData.get('code').toUpperCase(),
                discountType: discountType,
                value: parseInt(formData.get('value')),
                minOrderValue: 0,
                maxDiscount: 0,
                validityUntil: '',
                usageLimit: 0,
                userSpecific: 0,
                limitedOn: []
            };

            // Add conditional fields based on discount type
            if (discountType === 'percentage') {
                apiPayload.minOrderValue = formData.get('minOrderValue') ? parseInt(formData.get('minOrderValue')) : 0;
                apiPayload.maxDiscount = formData.get('maxDiscount') ? parseInt(formData.get('maxDiscount')) : 0;
            } else if (discountType === 'fixed') {
                apiPayload.minOrderValue = formData.get('minOrderValueFixed') ? parseInt(formData.get('minOrderValueFixed')) : 0;
                apiPayload.maxDiscount = parseInt(formData.get('value')); // For fixed, maxDiscount = value
            }

            // Convert validUntil from YYYY-MM-DD to DD-MM-YYYY
            const validUntilDate = formData.get('validUntil');
            if (validUntilDate) {
                const parts = validUntilDate.split('-');
                apiPayload.validityUntil = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            // Usage limit
            apiPayload.usageLimit = formData.get('usageLimit') ? parseInt(formData.get('usageLimit')) : 0;

            // Add limited users if checkbox is checked and users are selected
            if (limitedUsersCheckbox.checked && selectedUsers.length > 0) {
                apiPayload.userSpecific = 1;
                apiPayload.limitedOn = selectedUsers.map(u => u.id);
            }

            console.log('Submitting discount form with payload:', apiPayload);

            await saveDiscount(apiPayload);

            discountModal.classList.remove('active');
            discountForm.reset();
            toggleDiscountFields(); // Reset field visibility

            // Reset user selection
            selectedUsers = [];
            limitedUsersCheckbox.checked = false;
            userSelectionContainer.style.display = 'none';
            userSearchResults.style.display = 'none';
        } catch (error) {
            console.error('Error in form submit handler:', error);
        }

        return false;
    }

    if (discountForm) {
        console.log('Adding submit event listener to discountForm');
        discountForm.addEventListener('submit', handleDiscountFormSubmit, true);
        discountForm.onsubmit = handleDiscountFormSubmit;
    } else {
        console.error('discountForm element not found!');
    }

    window.deleteDiscount = (index) => {
        if (confirm('Are you sure you want to delete this discount code?')) {
            const updatedDiscounts = config.discounts.filter((_, i) => i !== index);
            saveDiscounts(updatedDiscounts);
        }
    };
});
