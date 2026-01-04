document.addEventListener('DOMContentLoaded', () => {
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
    let initialAutoEnrollConfig = null; // Store initial state for comparison
    let tempSelectedCourses = []; // Array of codes for modal selection

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
    const modalEmptyState = document.getElementById('modalEmptyState');
    const modalPageInfo = document.getElementById('modalPageInfo');
    const modalPrevPage = document.getElementById('modalPrevPage');
    const modalNextPage = document.getElementById('modalNextPage');
    const modalPageNumbers = document.getElementById('modalPageNumbers');
    const modalPaginationContainer = document.getElementById('modalPaginationContainer');

    // Helper Functions
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
        // Fetch courses and config
        const [coursesResult] = await Promise.all([fetchCourses(), fetchConfig()]);

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
        renderDiscounts();
        updateSaveButtonVisibility();
    }

    // API Calls
    async function fetchCourses(page = 1, size = 100, searchKey = '', sortBy = 'name') {
        try {
            // Get auth token from localStorage
            const token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');

            // Build query params
            let url = `http://localhost:3000/restricted/catalog/list-catalog.php?page=${page}&size=${size}&sortBy=${sortBy}`;
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
            const token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');

            const res = await fetch('http://localhost:3000/restricted/config/get-auto-enrollment-mapping.php', {
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
            const token = localStorage.getItem('authToken') || localStorage.getItem('X-Access-Token');

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

            const res = await fetch('http://localhost:3000/restricted/config/save-auto-enrollment-mapping.php', {
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
                alert('Auto-enrollment settings saved successfully!');
                // Reload config to get updated IDs from server
                await fetchConfig();
                // Update initial state after successful save
                initialAutoEnrollConfig = JSON.parse(JSON.stringify(config.autoEnroll.courses));
                renderSelectedCourses();
                updateSaveButtonVisibility();
            } else {
                alert('Failed to save settings: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving auto-enroll:', err);
            alert('Error saving settings.');
        }
    }

    async function saveDiscounts(discounts) {
        try {
            const res = await fetch('/api/web-content/discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discounts)
            });
            const result = await res.json();
            if (result.success) {
                config.discounts = discounts;
                renderDiscounts();
            } else {
                alert('Failed to save discount code.');
            }
        } catch (err) {
            console.error('Error saving discounts:', err);
            alert('Error saving discount code.');
        }
    }

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
            <div class="course-card" style="cursor: default; border-color: #e5e7eb; background: white; flex-direction: column; gap: 15px; align-items: stretch;">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div class="course-icon" style="background: #006073; color: white;">
                        <i class="ti ti-book"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${course.title}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">${course.category} • ${course.code}</div>
                    </div>
                    <button class="btn btn-sm" onclick="removeCourse('${course.code}')" style="background: none; border: none; color: #991b1b; cursor: pointer;">
                        <i class="ti ti-close"></i>
                    </button>
                </div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #f1f5f9;">
                    <label style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; display: block; text-transform: uppercase;">Validity Period</label>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <select class="form-control input-sm" onchange="updateValidityType('${course.code}', this.value)" style="width: 120px;">
                            <option value="duration" ${!isFixed ? 'selected' : ''}>Duration</option>
                            <option value="fixed" ${isFixed ? 'selected' : ''}>Fixed Date</option>
                        </select>
                        
                        ${!isFixed ? `
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <input type="number" class="form-control input-sm" value="${settings.value || 365}" min="1" style="width: 80px;" 
                                    onchange="updateValidityValue('${course.code}', 'value', this.value)">
                                <select class="form-control input-sm" style="width: 100px;"
                                    onchange="updateValidityValue('${course.code}', 'unit', this.value)">
                                    <option value="days" ${settings.unit === 'days' ? 'selected' : ''}>Days</option>
                                    <option value="months" ${settings.unit === 'months' ? 'selected' : ''}>Months</option>
                                    <option value="years" ${settings.unit === 'years' ? 'selected' : ''}>Years</option>
                                </select>
                            </div>
                        ` : `
                            <input type="date" class="form-control input-sm" value="${settings.value || ''}" style="width: auto;"
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
        modalCourseList.innerHTML = courses.map(course => `
            <label style="margin: 0;">
                <input type="checkbox" class="course-checkbox" value="${course.code}"
                    ${tempSelectedCourses.includes(course.code) ? 'checked' : ''}>
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
        `).join('');

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

    window.goToModalPage = function(page) {
        if (page >= 1 && page <= coursesPagination.totalPages) {
            coursesPagination.currentPage = page;
            renderModalCourses();
        }
    };

    function renderDiscounts() {
        if (config.discounts.length === 0) {
            discountTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #718096; padding: 30px;">No discount codes active</td></tr>';
            return;
        }

        discountTableBody.innerHTML = config.discounts.map((discount, index) => {
            const isExpired = new Date(discount.validUntil) < new Date();
            const statusClass = isExpired ? 'status-expired' : 'status-active';
            const statusText = isExpired ? 'Expired' : 'Active';

            return `
                <tr>
                    <td style="font-weight: 600; font-family: monospace; color: #006073;">${discount.code}</td>
                    <td>${discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                    <td>${discount.type === 'percentage' ? discount.value + '%' : '$' + discount.value}</td>
                    <td>${new Date(discount.validUntil).toLocaleDateString()}</td>
                    <td>${discount.usageLimit || 'Unlimited'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td style="text-align: right;">
                        <button class="btn btn-danger" onclick="deleteDiscount(${index})" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; background: #fee2e2; color: #991b1b; border: none; cursor: pointer; transition: all 0.2s;">
                            <i class="ti ti-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Event Handlers
    saveAutoEnrollBtn.addEventListener('click', () => {
        saveAutoEnroll({
            courses: config.autoEnroll.courses
        });
    });

    // Course Selection Modal
    openCourseSelectModalBtn.addEventListener('click', () => {
        tempSelectedCourses = config.autoEnroll.courses.map(c => c.code);
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
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            discountModal.classList.remove('active');
            courseSelectModal.classList.remove('active');
        });
    });

    discountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(discountForm);
        const discountType = formData.get('type');

        const newDiscount = {
            code: formData.get('code').toUpperCase(),
            type: discountType,
            value: formData.get('value'),
            validUntil: formData.get('validUntil'),
            usageLimit: formData.get('usageLimit') || null
        };

        // Add conditional fields based on discount type
        if (discountType === 'percentage') {
            if (formData.get('minOrderValue')) {
                newDiscount.minOrderValue = formData.get('minOrderValue');
            }
            if (formData.get('maxDiscount')) {
                newDiscount.maxDiscount = formData.get('maxDiscount');
            }
        } else if (discountType === 'fixed') {
            if (formData.get('minOrderValueFixed')) {
                newDiscount.minOrderValue = formData.get('minOrderValueFixed');
            }
        }

        const updatedDiscounts = [...config.discounts, newDiscount];
        saveDiscounts(updatedDiscounts);
        discountModal.classList.remove('active');
        discountForm.reset();
        toggleDiscountFields(); // Reset field visibility
    });

    window.deleteDiscount = (index) => {
        if (confirm('Are you sure you want to delete this discount code?')) {
            const updatedDiscounts = config.discounts.filter((_, i) => i !== index);
            saveDiscounts(updatedDiscounts);
        }
    };
});
