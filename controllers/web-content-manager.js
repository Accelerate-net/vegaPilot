document.addEventListener('DOMContentLoaded', () => {
    // State
    let courses = [];
    let config = {
        autoEnroll: { courses: [] }, // courses is now array of objects: { code, validity }
        discounts: []
    };
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

    // Initialization
    init();

    async function init() {
        await Promise.all([fetchCourses(), fetchConfig()]);
        // Migrate old data if necessary
        if (config.autoEnroll.courses.length > 0 && typeof config.autoEnroll.courses[0] === 'string') {
            console.log('Migrating old config format...');
            config.autoEnroll.courses = config.autoEnroll.courses.map(code => ({
                code: code,
                validity: { type: 'duration', value: 365, unit: 'days' }
            }));
        }
        renderSelectedCourses();
        renderDiscounts();
    }

    // API Calls
    async function fetchCourses() {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                courses = await res.json();
            } else {
                throw new Error('API request failed');
            }
        } catch (err) {
            console.warn('Error fetching courses, using sample data:', err);
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
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch('/api/web-content/config');
            config = await res.json();
        } catch (err) {
            console.error('Error fetching config:', err);
        }
    }

    async function saveAutoEnroll(data) {
        try {
            const res = await fetch('/api/web-content/auto-enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                alert('Auto-enrollment settings saved successfully!');
            } else {
                alert('Failed to save settings.');
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
        const selectedCodes = config.autoEnroll.courses.map(c => c.code);
        const selectedCourseObjects = courses.filter(c => selectedCodes.includes(c.code));

        if (selectedCourseObjects.length === 0) {
            selectedCoursesList.innerHTML = `
                <div class="text-center" style="padding: 30px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; grid-column: 1 / -1;">
                    <i class="ti ti-book" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No courses selected for auto-enrollment.
                </div>
            `;
            return;
        }

        selectedCoursesList.innerHTML = selectedCourseObjects.map(course => {
            const settings = config.autoEnroll.courses.find(c => c.code === course.code).validity || { type: 'duration', value: 365, unit: 'days' };
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

    function renderModalCourses(filter = '') {
        const filtered = courses.filter(c =>
            c.status === 'Active' &&
            (c.title.toLowerCase().includes(filter.toLowerCase()) ||
                c.code.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filtered.length === 0) {
            modalCourseList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No active courses found.</div>';
            return;
        }

        modalCourseList.innerHTML = filtered.map(course => `
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

        // Add style for check indicator visibility
        if (!document.getElementById('checkboxStyle')) {
            const style = document.createElement('style');
            style.id = 'checkboxStyle';
            style.innerHTML = `.course-checkbox:checked + .course-card .check-indicator { opacity: 1; }`;
            document.head.appendChild(style);
        }
    }

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
        courseSelectModal.classList.remove('active');
    });

    courseSearchInput.addEventListener('input', (e) => {
        renderModalCourses(e.target.value);
    });

    // Global functions
    window.removeCourse = (code) => {
        config.autoEnroll.courses = config.autoEnroll.courses.filter(c => c.code !== code);
        renderSelectedCourses();
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
        }
    };

    window.updateValidityValue = (code, field, value) => {
        const course = config.autoEnroll.courses.find(c => c.code === code);
        if (course) {
            course.validity[field] = value;
        }
    };

    // Discount Modal
    addDiscountBtn.addEventListener('click', () => {
        discountModal.classList.add('active');
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
        const newDiscount = {
            code: formData.get('code').toUpperCase(),
            type: formData.get('type'),
            value: formData.get('value'),
            validUntil: formData.get('validUntil'),
            usageLimit: formData.get('usageLimit') || null
        };

        const updatedDiscounts = [...config.discounts, newDiscount];
        saveDiscounts(updatedDiscounts);
        discountModal.classList.remove('active');
        discountForm.reset();
    });

    window.deleteDiscount = (index) => {
        if (confirm('Are you sure you want to delete this discount code?')) {
            const updatedDiscounts = config.discounts.filter((_, i) => i !== index);
            saveDiscounts(updatedDiscounts);
        }
    };
});
