/**
 * Instructor Time Tracker Controller - Professional Expense Management
 * Features: Full/Partial Payments, Status Tracking, localStorage Persistence
 */
console.log('InstructorTimeTracker controller file loaded');

(function () {
  var app = angular.module('InstructorTimeTrackerApp', []);

  app.controller('InstructorTimeTrackerController', [
    '$scope',
    '$timeout',
    function ($scope, $timeout) {

      // ================== INITIALIZATION ==================
      $scope.instructors = [];
      $scope.filteredInstructors = [];
      $scope.paginatedInstructors = [];

      $scope.searchQuery = '';
      $scope.filterSubject = '';
      $scope.filterPaymentStatus = '';
      $scope.sortBy = 'name';

      // ================== PAGINATION ==================
      $scope.currentPage = 1;
      $scope.itemsPerPage = 10;

      // ================== UI STATES ==================
      $scope.isLoading = false;
      $scope.loadingMessage = 'Loading...';
      $scope.showAddModal = false;
      $scope.showDetailsModal = false;
      $scope.showPaymentModal = false;
      $scope.showPartialModal = false;
      $scope.showTrackingModal = false;
      $scope.editDetailsMode = false;
      $scope.selectedInstructor = {};
      $scope.partialAmount = null;

      // ================== PAYMENT MODE ==================
      $scope.paymentMode = 'full';
      $scope.paymentUI = { amount: 0 };

      // ================== DROPDOWNS ==================
      $scope.availableNames = [
        'Rahul Kumar',
        'Ananya Sharma',
        'Mohammed Asif',
        'Sarah Johnson',
        'David Martinez',
        'Lisa Anderson'
      ];

      $scope.availableSubjects = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'English'
      ];

      // ================== FORM MODEL ==================
      $scope.newInstructor = {
        name: '',
        subject: '',
        chapter: '',
        subjects: [],
        totalHours: null,
        hourlyRate: null,
        paymentStatus: 'Pending'
      };

      // ================== STORAGE KEY ==================
      const STORAGE_KEY = 'vegapilot_instructors_expenses';

      // ================== INIT ==================
      $scope.init = function () {
        $scope.showLoading('Loading expense records...');
        $scope.loadInstructors();
      };

      // ================== LOAD FROM STORAGE OR DEMO DATA ==================
      $scope.loadInstructors = function () {
        $timeout(function () {
          var stored = localStorage.getItem(STORAGE_KEY);
          
          if (stored && stored !== 'undefined') {
            try {
              $scope.instructors = JSON.parse(stored);
              // Convert date strings back to Date objects
              $scope.instructors.forEach(function(ins) {
                if (ins.lastUpdated) ins.lastUpdated = new Date(ins.lastUpdated);
              });
            } catch (e) {
              console.error('Storage error:', e);
              $scope.instructors = $scope.getDefaultInstructors();
              $scope.saveInstructorsToStorage();
            }
          } else {
            // Load demo data
            $scope.instructors = $scope.getDefaultInstructors();
            $scope.saveInstructorsToStorage();
          }

          $scope.filteredInstructors = $scope.instructors.slice();
          $scope.sortInstructors();
          $scope.updatePagination();
          $scope.hideLoading();
        }, 300);
      };

      // ================== DEFAULT DEMO DATA ==================
      $scope.getDefaultInstructors = function () {
        return [
          {
            id: 'INS001',
            name: 'Rahul Kumar',
            subject: 'Mathematics',
            chapter: 'Trigonometry – Basics',
            subjects: [
              { name: 'Trigonometry - Basics', hours: 5, rate: 500 },
              { name: 'Trigonometry - Advanced', hours: 3, rate: 500 }
            ],
            totalHours: 8,
            hourlyRate: 500,
            totalAmount: 4000,
            paidAmount: 0,
            balanceAmount: 4000,
            paymentStatus: 'Pending',
            lastUpdated: new Date('2024-12-01T10:30:00'),
            completedDate: null
          },
          {
            id: 'INS002',
            name: 'Ananya Sharma',
            subject: 'Physics',
            chapter: 'Motion & Kinematics',
            subjects: [
              { name: 'Motion & Kinematics', hours: 5, rate: 600 }
            ],
            totalHours: 5,
            hourlyRate: 600,
            totalAmount: 3000,
            paidAmount: 3000,
            balanceAmount: 0,
            paymentStatus: 'Paid',
            lastUpdated: new Date('2024-12-02T09:15:00'),
            completedDate: new Date('2024-12-02T09:15:00')
          },
          {
            id: 'INS003',
            name: 'Mohammed Asif',
            subject: 'Chemistry',
            chapter: 'Organic – Introduction',
            subjects: [
              { name: 'Organic - Introduction', hours: 3, rate: 550 },
              { name: 'Organic - Mechanisms', hours: 3, rate: 550 }
            ],
            totalHours: 6,
            hourlyRate: 550,
            totalAmount: 3300,
            paidAmount: 1650,
            balanceAmount: 1650,
            paymentStatus: 'Partial',
            lastUpdated: new Date('2024-12-03T14:45:00'),
            completedDate: null
          },
          {
            id: 'INS004',
            name: 'Sarah Johnson',
            subject: 'Biology',
            chapter: 'Human Physiology',
            subjects: [
              { name: 'Human Physiology', hours: 4, rate: 520 }
            ],
            totalHours: 4,
            hourlyRate: 520,
            totalAmount: 2080,
            paidAmount: 2080,
            balanceAmount: 0,
            paymentStatus: 'Paid',
            lastUpdated: new Date('2024-12-03T18:20:00'),
            completedDate: new Date('2024-12-03T18:20:00')
          },
          {
            id: 'INS005',
            name: 'David Martinez',
            subject: 'Mathematics',
            chapter: 'Calculus – Limits',
            subjects: [
              { name: 'Calculus - Limits', hours: 4, rate: 500 },
              { name: 'Calculus - Continuity', hours: 3, rate: 500 }
            ],
            totalHours: 7,
            hourlyRate: 500,
            totalAmount: 3500,
            paidAmount: 1000,
            balanceAmount: 2500,
            paymentStatus: 'Partial',
            lastUpdated: new Date('2024-12-04T11:05:00'),
            completedDate: null
          },
          {
            id: 'INS006',
            name: 'Lisa Anderson',
            subject: 'English',
            chapter: 'Poetry – Basics',
            totalHours: 3,
            hourlyRate: 450,
            totalAmount: 1350,
            paidAmount: 1350,
            balanceAmount: 0,
            paymentStatus: 'Paid',
            lastUpdated: new Date('2024-12-01T16:10:00')
          }
        ];
      };

      // ================== SAVE TO STORAGE ==================
      $scope.saveInstructorsToStorage = function () {
        localStorage.setItem(STORAGE_KEY, JSON.stringify($scope.instructors));
      };

      // ================== ADD NEW INSTRUCTOR ==================
      $scope.addNewInstructor = function () {
        $scope.newInstructor = {
          name: '',
          subject: '',
          chapter: '',          subjects: [{ name: '', hours: null, rate: null }],          totalHours: null,
          hourlyRate: null,
          paymentStatus: 'Pending'
        };
        $scope.showAddModal = true;
      };

      $scope.closeAddInstructorModal = function () {
        $scope.showAddModal = false;
      };

      // ================== SUBJECT MANAGEMENT HELPERS ==================
      $scope.addSubjectField = function () {
        if (!$scope.newInstructor.subjects) {
          $scope.newInstructor.subjects = [];
        }
        $scope.newInstructor.subjects.push({ name: '', hours: null, rate: null });
      };

      $scope.removeSubjectField = function (index) {
        if ($scope.newInstructor.subjects && $scope.newInstructor.subjects.length > 1) {
          $scope.newInstructor.subjects.splice(index, 1);
        }
      };

      $scope.calculateTotalHours = function (subjects) {
        if (!subjects || !Array.isArray(subjects)) return 0;
        var total = 0;
        for (var i = 0; i < subjects.length; i++) {
          total += Number(subjects[i].hours) || 0;
        }
        return total;
      };

      $scope.calculateTotalAmount = function (subjects) {
        if (!subjects || !Array.isArray(subjects)) return 0;
        var total = 0;
        for (var i = 0; i < subjects.length; i++) {
          var hours = Number(subjects[i].hours) || 0;
          var rate = Number(subjects[i].rate) || 0;
          total += hours * rate;
        }
        return total;
      };

      // ================== SAVE NEW INSTRUCTOR (UPDATED FOR SUBJECTS) ==================
      $scope.saveNewInstructor = function (form) {
        if (form && form.$invalid) return;

        // Validation
        if (!$scope.newInstructor.name || !$scope.newInstructor.subject || !$scope.newInstructor.chapter) {
          alert('❌ Instructor Name, Subject, and Chapter are required.');
          return;
        }

        if (!$scope.newInstructor.subjects || $scope.newInstructor.subjects.length === 0) {
          alert('❌ Please add at least one subject with hours and rate.');
          return;
        }

        // Validate all subjects have required fields
        for (var s = 0; s < $scope.newInstructor.subjects.length; s++) {
          var subject = $scope.newInstructor.subjects[s];
          if (!subject.name || !subject.hours || !subject.rate) {
            alert('❌ All subjects must have a name, hours, and rate.');
            return;
          }
          if (Number(subject.hours) <= 0 || Number(subject.rate) <= 0) {
            alert('❌ Hours and Rate must be greater than zero.');
            return;
          }
        }

        // Calculate totals from subjects
        var totalHours = $scope.calculateTotalHours($scope.newInstructor.subjects);
        var totalAmount = $scope.calculateTotalAmount($scope.newInstructor.subjects);

        // Check for existing record (by name and subject category)
        var existing = null;
        for (var i = 0; i < $scope.instructors.length; i++) {
          var ins = $scope.instructors[i];
          if (ins.name === $scope.newInstructor.name && ins.subject === $scope.newInstructor.subject) {
            existing = ins;
            break;
          }
        }

        if (existing) {
          // UPDATE EXISTING RECORD - Add subjects to existing array
          if (!existing.subjects) existing.subjects = [];
          
          for (var j = 0; j < $scope.newInstructor.subjects.length; j++) {
            existing.subjects.push(angular.copy($scope.newInstructor.subjects[j]));
          }

          // Recalculate totals
          existing.totalHours = $scope.calculateTotalHours(existing.subjects);
          existing.totalAmount = $scope.calculateTotalAmount(existing.subjects);
          existing.balanceAmount = existing.totalAmount - (existing.paidAmount || 0);

          // Update chapter reference
          if (existing.chapter.indexOf($scope.newInstructor.chapter) === -1) {
            existing.chapter += ', ' + $scope.newInstructor.chapter;
          }

          // Recalculate status
          if (existing.balanceAmount === 0) existing.paymentStatus = 'Paid';
          else if (existing.paidAmount > 0) existing.paymentStatus = 'Partial';
          else existing.paymentStatus = 'Pending';

          existing.lastUpdated = new Date();
        } else {
          // CREATE NEW RECORD
          var id = 'INS' + ('000' + ($scope.instructors.length + 1)).slice(-3);
          var isFullPay = $scope.newInstructor.paymentStatus === 'Paid';

          $scope.instructors.push({
            id: id,
            name: $scope.newInstructor.name,
            subject: $scope.newInstructor.subject,
            chapter: $scope.newInstructor.chapter,
            subjects: angular.copy($scope.newInstructor.subjects),
            totalHours: totalHours,
            hourlyRate: null, // No longer single rate, now per-subject rates
            totalAmount: totalAmount,
            paidAmount: isFullPay ? totalAmount : 0,
            balanceAmount: isFullPay ? 0 : totalAmount,
            paymentStatus: isFullPay ? 'Paid' : 'Pending',
            lastUpdated: new Date(),
            completedDate: isFullPay ? new Date() : null
          });
        }

        $scope.saveInstructorsToStorage();
        $scope.filterInstructors();
        $scope.showAddModal = false;
        alert('✓ Record saved successfully!');
      };

      // ================== ROW INTERACTION ==================
      // ================== DETAILS MODAL ==================
      $scope.openInstructorDetails = function (instructor) {
        $scope.selectedInstructor = angular.copy(instructor);
        $scope.showDetailsModal = true;
        $scope.editDetailsMode = false;
      };

      $scope.closeInstructorDetails = function () {
        $scope.showDetailsModal = false;
        $scope.selectedInstructor = {};
        $scope.editDetailsMode = false;
      };

      $scope.openEditMode = function () {
        $scope.editDetailsMode = true;
      };

      $scope.cancelEditDetails = function () {
        $scope.editDetailsMode = false;
      };

      $scope.saveDetailsEdit = function () {
        // Find and update the instructor in the main list
        for (var i = 0; i < $scope.instructors.length; i++) {
          if ($scope.instructors[i].id === $scope.selectedInstructor.id) {
            $scope.instructors[i].completedDate = $scope.selectedInstructor.completedDate;
            break;
          }
        }
        $scope.saveInstructorsToStorage();
        $scope.editDetailsMode = false;
        alert('✓ Changes saved successfully!');
      };

      $scope.getTotalSubjectHours = function (instructor) {
        if (!instructor || !instructor.subjects) return 0;
        var total = 0;
        for (var i = 0; i < instructor.subjects.length; i++) {
          total += instructor.subjects[i].hours || 0;
        }
        return total;
      };

      // ================== PAYMENT MODALS ==================
      $scope.openPaymentModal = function (instructor) {
        $scope.selectedInstructor = instructor;
        $scope.showPaymentModal = true;
      };

      $scope.closePaymentModal = function () {
        $scope.showPaymentModal = false;
        $scope.selectedInstructor = {};
      };

      $scope.openPartialPaymentModal = function (instructor) {
        $scope.selectedInstructor = instructor;
        $scope.partialAmount = null;
        $scope.showPartialModal = true;
      };

      $scope.closePartialModal = function () {
        $scope.showPartialModal = false;
        $scope.partialAmount = null;
        $scope.selectedInstructor = {};
      };

      $scope.openTrackingModal = function (instructor) {
        $scope.selectedInstructor = instructor;
        $scope.showTrackingModal = true;
      };

      $scope.closeTrackingModal = function () {
        $scope.showTrackingModal = false;
        $scope.selectedInstructor = {};
      };

      // ================== PAYMENT PROCESSING ==================
      $scope.processFullPayment = function (instructor) {
        if (!instructor || instructor.balanceAmount <= 0) {
          alert('❌ No balance to pay');
          return;
        }

        var confirmMsg = '✓ Process full payment of ' + $scope.formatCurrency(instructor.balanceAmount) + ' for ' + instructor.name + '?';
        if (!window.confirm(confirmMsg)) return;

        instructor.paidAmount += instructor.balanceAmount;
        instructor.balanceAmount = 0;
        instructor.paymentStatus = 'Paid';
        instructor.lastUpdated = new Date();

        $scope.saveInstructorsToStorage();
        $scope.filterInstructors();
        $scope.closePaymentModal();
        alert('✓ Full payment recorded successfully!');
      };

      $scope.validatePartialAmount = function () {
        if ($scope.partialAmount > $scope.selectedInstructor.balanceAmount) {
          $scope.partialAmount = $scope.selectedInstructor.balanceAmount;
        }
      };

      $scope.processPartialPayment = function (instructor, amount) {
        amount = Number(amount);
        
        if (!amount || amount <= 0) {
          alert('❌ Please enter a valid amount');
          return;
        }

        if (amount > instructor.balanceAmount) {
          alert('❌ Amount cannot exceed balance of ' + $scope.formatCurrency(instructor.balanceAmount));
          return;
        }

        var confirmMsg = '✓ Process partial payment of ' + $scope.formatCurrency(amount) + ' for ' + instructor.name + '?';
        if (!window.confirm(confirmMsg)) return;

        instructor.paidAmount += amount;
        instructor.balanceAmount = instructor.totalAmount - instructor.paidAmount;

        if (instructor.balanceAmount <= 0) {
          instructor.paymentStatus = 'Paid';
          instructor.balanceAmount = 0;
        } else {
          instructor.paymentStatus = 'Partial';
        }

        instructor.lastUpdated = new Date();
        $scope.saveInstructorsToStorage();
        $scope.filterInstructors();
        $scope.closePartialModal();
        alert('✓ Partial payment recorded successfully!\n\nAmount Paid: ' + $scope.formatCurrency(amount) + '\nNew Balance: ' + $scope.formatCurrency(instructor.balanceAmount));
      };

      // ================== IE-safe unique subject list =====
      $scope.getAllSubjects = function () {
        var list = [];
        for (var i = 0; i < $scope.instructors.length; i++) {
          var s = $scope.instructors[i].subject;
          if (s && list.indexOf(s) === -1) {
            list.push(s);
          }
        }
        list.sort();
        return list;
      };

      $scope.getTotalPages = function () {
        return Math.ceil(
          $scope.filteredInstructors.length / $scope.itemsPerPage
        ) || 1;
      };

      $scope.getPaginationInfo = function () {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage + 1;
        var end = Math.min($scope.currentPage * $scope.itemsPerPage, $scope.filteredInstructors.length);
        var total = $scope.filteredInstructors.length;
        return 'Showing ' + start + ' to ' + end + ' of ' + total + ' instructors';
      };

      $scope.getPageNumbers = function () {
        var total = $scope.getTotalPages();
        var pages = [];
        var maxVisible = 5;
        var start = Math.max(
          1,
          $scope.currentPage - Math.floor(maxVisible / 2)
        );
        var end = Math.min(total, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
          start = Math.max(1, end - maxVisible + 1);
        }

        for (var i = start; i <= end; i++) {
          pages.push(i);
        }
        return pages;
      };

      $scope.goToPage = function (page) {
        $scope.currentPage = page;
        $scope.updatePagination();
      };

      $scope.previousPage = function () {
        if ($scope.currentPage > 1) {
          $scope.currentPage--;
          $scope.updatePagination();
        }
      };

      $scope.nextPage = function () {
        if ($scope.currentPage < $scope.getTotalPages()) {
          $scope.currentPage++;
          $scope.updatePagination();
        }
      };

      $scope.getStartIndex = function () {
        return ($scope.currentPage - 1) * $scope.itemsPerPage;
      };

      $scope.getEndIndex = function () {
        return Math.min(
          $scope.getStartIndex() + $scope.itemsPerPage,
          $scope.filteredInstructors.length
        );
      };

      $scope.getInitials = function (name) {
        if (!name) return '??';
        var parts = name.trim().split(' ');
        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

      // ================== FILTER & SORT ==================
      $scope.filterInstructors = function () {
        var q = ($scope.searchQuery || '').toLowerCase();

        $scope.filteredInstructors = $scope.instructors.filter(function (i) {
          return (
            (!q || (i.name + i.subject + i.chapter).toLowerCase().indexOf(q) !== -1) &&
            (!$scope.filterSubject || i.subject === $scope.filterSubject) &&
            (!$scope.filterPaymentStatus || i.paymentStatus === $scope.filterPaymentStatus)
          );
        });

        $scope.sortInstructors();
        $scope.currentPage = 1;
        $scope.updatePagination();
      };

      $scope.sortInstructors = function () {
        var s = $scope.sortBy;
        $scope.filteredInstructors.sort(function (a, b) {
          if (s === 'hours') return b.totalHours - a.totalHours;
          if (s === 'amount') return b.totalAmount - a.totalAmount;
          return a.name.localeCompare(b.name);
        });
      };

      // ================== PAGINATION ==================
      $scope.updatePagination = function () {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        $scope.paginatedInstructors = $scope.filteredInstructors.slice(
          start,
          start + $scope.itemsPerPage
        );
      };

      // ================== TOTALS & STATISTICS ==================
      $scope.getTotalHours = function () {
        return $scope.instructors.reduce(function (s, i) { return s + (i.totalHours || 0); }, 0);
      };

      $scope.getTotalPaidAmount = function () {
        return $scope.instructors.reduce(function (s, i) { return s + (i.paidAmount || 0); }, 0);
      };

      $scope.getTotalPendingAmount = function () {
        return $scope.instructors.reduce(function (s, i) { return s + (i.balanceAmount || 0); }, 0);
      };

      $scope.getTotalExpenses = function () {
        return $scope.instructors.reduce(function (s, i) { return s + (i.totalAmount || 0); }, 0);
      };

      // ================== HELPERS ==================
      $scope.formatCurrency = function (a) {
        return '₹' + Number(a || 0).toLocaleString('en-IN');
      };

      $scope.showLoading = function (m) {
        $scope.isLoading = true;
        $scope.loadingMessage = m;
      };

      $scope.hideLoading = function () {
        $timeout(function () {
          $scope.isLoading = false;
        }, 200);
      };

      // ================== INITIALIZE ON LOAD ==================
      $scope.init();
    }
  ]);
})();
