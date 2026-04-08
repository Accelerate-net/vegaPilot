console.log("leads.js initializing...");

angular.module('LeadTrackerApp', [])
.controller('LeadController', function ($scope, $timeout, $http) {

  var API_URL = "http://localhost/crispr/leads_api.php";
  var isLocalPreview = window.location.protocol === 'file:';

  // 1. INITIALIZATION
  $scope.leads = [];
  $scope.isLoading = true;
  $scope.showLeadModal = false;
  $scope.showAddLead = false;
  $scope.showAddLeadErrors = false;
  $scope.addLeadMissingFields = [];
  $scope.calendarWeekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  $scope.calendarBlanks = [];
  $scope.selectedCalendarTs = null;
  $scope.currentDate = new Date();
  $scope.currentMonth = $scope.currentDate.getMonth();
  $scope.currentYear = $scope.currentDate.getFullYear();
  $scope.currentPage = 1;
  $scope.itemsPerPage = 10;
  $scope.itemsPerPageOptions = [10, 20];
  $scope.searchQuery = "";
  $scope.selectedStatus = 'all';
  $scope.editingNoteId = null;
  $scope.isAddLeadDirty = false;
  $scope.addLeadPristine = null;
  $scope.tempNoteMood = 2;
  $scope.selectedFollowupDateStr = ""; // string bound to <input type="date">

  // ===========================================================
  // 2. DATE HELPER FUNCTIONS
  // ===========================================================

  // ⭐ Parse "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" from DB
  //    WITHOUT using new Date("YYYY-MM-DD") which causes UTC shift
  function parseDBDate(str) {
    if (!str) return null;
    var s = String(str);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    // Use local constructor: new Date(year, month-1, day)
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), 0, 0, 0, 0);
  }

  // ⭐ Convert a Date object → "YYYY-MM-DD" string for <input type="date">
  function dateToStr(date) {
    if (!date) return "";
    var d = (date instanceof Date) ? date : parseDBDate(String(date));
    if (!d || isNaN(d.getTime())) return "";
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ⭐ Convert "YYYY-MM-DD" string from input → local Date object
  function strToDate(str) {
    if (!str) return null;
    var parts = str.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
  }

  // ⭐ Format any date for MySQL — returns "YYYY-MM-DD 00:00:00"
  function formatDateForDB(date) {
    if (!date) return null;
    if (typeof date === 'string') {
      var m = date.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1] + ' 00:00:00';
    }
    var d = (date instanceof Date) ? date : parseDBDate(String(date));
    if (!d || isNaN(d.getTime())) return null;
    return dateToStr(d) + ' 00:00:00';
  }

  // ===========================================================
  // 3. OTHER HELPER FUNCTIONS
  // ===========================================================

  function isFollowupUpdatedToday(lead) {
    if (!lead.lastFollowupUpdate) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var updateDate = new Date(lead.lastFollowupUpdate);
    updateDate.setHours(0, 0, 0, 0);
    return updateDate.getTime() === today.getTime();
  }

  function applyDefaultSort() {
    $scope.leads.sort(function(a, b) {
      var aLocked = (parseInt(a.leadStatus) === 3 || parseInt(a.leadStatus) === 4);
      var bLocked = (parseInt(b.leadStatus) === 3 || parseInt(b.leadStatus) === 4);
      if (aLocked && !bLocked) return 1;
      if (!aLocked && bLocked) return -1;

      // Priority 1: Leads with follow-up updated today go first
      var aUpdatedToday = isFollowupUpdatedToday(a);
      var bUpdatedToday = isFollowupUpdatedToday(b);
      if (aUpdatedToday && !bUpdatedToday) return -1;
      if (!aUpdatedToday && bUpdatedToday) return 1;

      // Priority 2: Among updated today, sort by update time (most recent first)
      if (aUpdatedToday && bUpdatedToday) {
        var aUpdateTime = a.lastFollowupUpdate instanceof Date ? a.lastFollowupUpdate.getTime() : 0;
        var bUpdateTime = b.lastFollowupUpdate instanceof Date ? b.lastFollowupUpdate.getTime() : 0;
        if (aUpdateTime !== bUpdateTime) return bUpdateTime - aUpdateTime; // Most recent first
      }

      // Priority 3: Sort by follow-up date
      var aTime = a.finalFollowup instanceof Date ? a.finalFollowup.getTime() : 9999999999999;
      var bTime = b.finalFollowup instanceof Date ? b.finalFollowup.getTime() : 9999999999999;
      if (aTime !== bTime) return aTime - bTime;

      return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1;
    });
  }

  function updateBodyScrollLock() {
    var anyOpen = !!($scope.showLeadModal || $scope.showAddLead || $scope.showCalendarModal || $scope.showStatusEditor);
    if (document && document.body) {
      document.body.classList.toggle('modal-open', anyOpen);
    }
  }

  $scope.sanitizeName = function(val) {
    return (val || '').replace(/[^a-zA-Z\s]/g, '');
  };

  function calculateFollowupDate(mood, baseDate) {
    var moodNum = parseInt(mood);
    var days = (moodNum === 1) ? 1 : (moodNum === 3 ? 10 : 4);
    var d = new Date(baseDate || new Date());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  }

  function getMoodEmoji(mood) {
    var n = parseInt(mood);
    if (n === 1) return '😄';
    if (n === 3) return '😡';
    return '😐';
  }
  $scope.getMoodEmoji = getMoodEmoji;

  function getDummyLeads() {
    return [
      {
        id: 1001,
        name: 'Akhil Raj',
        phone: '9876543210',
        dateJoined: new Date(2026, 3, 1),
        updatedAt: new Date(2026, 3, 4, 10, 15),
        description: 'Asked about JEE crash course fees, weekend live classes, and scholarship options.',
        contactMethod: 1,
        behavior: 1,
        finalFollowup: new Date(2026, 3, 7),
        leadStatus: 2,
        attemptNumber: 2,
        status: 'pending',
        addedBy: 'WhatsApp Bot',
        lastFollowupUpdate: new Date(2026, 3, 4),
        followUpHistory: [
          {
            text: 'Shared course brochure and fee structure on WhatsApp.',
            timestamp: new Date(2026, 3, 2, 11, 10).toISOString(),
            addedBy: 'WhatsApp Bot',
            mood: 1
          },
          {
            text: 'Student said parent discussion is pending. Requested callback tomorrow evening.',
            timestamp: new Date(2026, 3, 4, 10, 15).toISOString(),
            addedBy: 'Sales Admin',
            mood: 2
          }
        ]
      },
      {
        id: 1002,
        name: 'Megha S',
        phone: '9123456780',
        dateJoined: new Date(2026, 2, 29),
        updatedAt: new Date(2026, 3, 3, 16, 40),
        description: 'Interested in NEET repeaters batch. Wants hostel details and biology faculty profile.',
        contactMethod: 2,
        behavior: 2,
        finalFollowup: new Date(2026, 3, 6),
        leadStatus: 1,
        attemptNumber: 1,
        status: 'pending',
        addedBy: 'Admissions Desk',
        lastFollowupUpdate: new Date(2026, 3, 3),
        followUpHistory: [
          {
            text: 'Initial call completed. Student asked for hostel and timetable details.',
            timestamp: new Date(2026, 3, 3, 16, 40).toISOString(),
            addedBy: 'Admissions Desk',
            mood: 2
          }
        ]
      },
      {
        id: 1003,
        name: 'Farhan K',
        phone: '9988776655',
        dateJoined: new Date(2026, 2, 25),
        updatedAt: new Date(2026, 3, 2, 12, 5),
        description: 'Looking for SSC foundation coaching. Budget-sensitive and comparing with local center.',
        contactMethod: 1,
        behavior: 3,
        finalFollowup: new Date(2026, 3, 5),
        leadStatus: 3,
        attemptNumber: 3,
        status: 'complete',
        addedBy: 'WhatsApp Bot',
        lastFollowupUpdate: new Date(2026, 3, 2),
        followUpHistory: [
          {
            text: 'Sent SSC program details and pricing.',
            timestamp: new Date(2026, 2, 26, 9, 20).toISOString(),
            addedBy: 'WhatsApp Bot',
            mood: 2
          },
          {
            text: 'Student said price is high. Offered callback after weekend.',
            timestamp: new Date(2026, 2, 29, 14, 30).toISOString(),
            addedBy: 'Sales Admin',
            mood: 3
          },
          {
            text: 'Lead marked lost after joining a nearby offline institute.',
            timestamp: new Date(2026, 3, 2, 12, 5).toISOString(),
            addedBy: 'Sales Admin',
            mood: 3
          }
        ]
      },
      {
        id: 1004,
        name: 'Niveditha Menon',
        phone: '9345678901',
        dateJoined: new Date(2026, 2, 24),
        updatedAt: new Date(2026, 3, 1, 18, 10),
        description: 'Parent inquiry for plus-two commerce student. Asked for CA foundation bridge support.',
        contactMethod: 3,
        behavior: 1,
        finalFollowup: new Date(2026, 3, 3),
        leadStatus: 4,
        attemptNumber: 2,
        status: 'complete',
        addedBy: 'Manual Entry',
        lastFollowupUpdate: new Date(2026, 3, 1),
        followUpHistory: [
          {
            text: 'Shared counselor contact and commerce batch plan over email.',
            timestamp: new Date(2026, 2, 25, 13, 45).toISOString(),
            addedBy: 'Manual Entry',
            mood: 1
          },
          {
            text: 'Parent confirmed admission and requested payment link.',
            timestamp: new Date(2026, 3, 1, 18, 10).toISOString(),
            addedBy: 'Sales Admin',
            mood: 1
          }
        ]
      },
      {
        id: 1005,
        name: 'Rithik Paul',
        phone: '9555512345',
        dateJoined: new Date(2026, 3, 5),
        updatedAt: new Date(2026, 3, 5, 9, 50),
        description: 'Fresh WhatsApp inquiry for CUET humanities prep. Asked for demo class recording.',
        contactMethod: 1,
        behavior: 2,
        finalFollowup: new Date(2026, 3, 9),
        leadStatus: 2,
        attemptNumber: 1,
        status: 'pending',
        addedBy: 'WhatsApp Bot',
        lastFollowupUpdate: new Date(2026, 3, 5),
        followUpHistory: [
          {
            text: 'Sent demo class link and brochure. Waiting for response after viewing.',
            timestamp: new Date(2026, 3, 5, 9, 50).toISOString(),
            addedBy: 'WhatsApp Bot',
            mood: 2
          }
        ]
      },
      {
        id: 1006,
        name: 'Sneha Thomas',
        phone: '9000011122',
        dateJoined: new Date(2026, 2, 30),
        updatedAt: new Date(2026, 3, 4, 19, 5),
        description: 'Manual lead from school seminar. Interested in integrated entrance coaching.',
        contactMethod: 2,
        behavior: 1,
        finalFollowup: new Date(2026, 3, 8),
        leadStatus: 2,
        attemptNumber: 2,
        status: 'pending',
        addedBy: 'Seminar Team',
        lastFollowupUpdate: new Date(2026, 3, 4),
        followUpHistory: [
          {
            text: 'Lead imported from seminar list and first call attempted.',
            timestamp: new Date(2026, 2, 31, 17, 0).toISOString(),
            addedBy: 'Seminar Team',
            mood: 2
          },
          {
            text: 'Student responded positively and asked for integrated batch timetable.',
            timestamp: new Date(2026, 3, 4, 19, 5).toISOString(),
            addedBy: 'Sales Admin',
            mood: 1
          }
        ]
      }
    ];
  }

  function applyLeads(leads) {
    $scope.leads = leads || [];
    applyDefaultSort();
    buildCalendar();
    $scope.isLoading = false;
  }

  function loadDummyLeads() {
    applyLeads(getDummyLeads());
  }

  function buildCalendar() {
    var year  = $scope.currentYear;
    var month = $scope.currentMonth;
    var totalDays = new Date(year, month + 1, 0).getDate();
    var firstDay  = new Date(year, month, 1).getDay();

    $scope.calendarBlanks = [];
    for (var i = 0; i < firstDay; i++) $scope.calendarBlanks.push(i);

    var counts = {};
    $scope.leads.forEach(function(lead) {
      if (!lead.finalFollowup) return;
      var d = new Date(lead.finalFollowup);
      d.setHours(0, 0, 0, 0);
      var ts = d.getTime();
      counts[ts] = (counts[ts] || 0) + 1;
    });

    $scope.calendarDates = [];
    var today = new Date(); today.setHours(0,0,0,0);
    var todayTs = today.getTime();

    for (var day = 1; day <= totalDays; day++) {
      var dateObj = new Date(year, month, day, 0, 0, 0, 0);
      var ts = dateObj.getTime();
      $scope.calendarDates.push({
        day: day, timestamp: ts,
        hasLeads: !!counts[ts],
        count: counts[ts] || 0,
        isToday: ts === todayTs
      });
    }
  }

  // ===========================================================
  // 4. LOAD DATA
  // ===========================================================
  // function loadLeads() {
  //   $scope.isLoading = true;
  //   $http.get(API_URL + "?action=list").then(function(response) {
  //     $scope.leads = response.data.map(function(l) {

  //       var history = [];
  //       if (l.followup_history) {
  //         try { history = JSON.parse(l.followup_history); } catch(e) { history = []; }
  //       }
  //       if (!Array.isArray(history)) history = [];

  //       history.forEach(function(note) {
  //         if (!note) return;
  //         if (!note.addedBy) note.addedBy = l.added_by || 'Admin';
  //         if (note.editedAt && !note.editedBy) note.editedBy = l.added_by || 'Admin';
  //         note.mood = parseInt(note.mood) || parseInt(l.interest_level) || 2;
  //       });

  //       // ⭐ Use parseDBDate everywhere — no new Date("YYYY-MM-DD")
  //       return {
  //         id:             l.id,
  //         name:           l.full_name,
  //         phone:          l.phone_number,
  //         dateJoined:     parseDBDate(l.date_joined),
  //         updatedAt:      l.updated_at ? parseDBDate(l.updated_at) : null,
  //         description:    l.consultation_notes,
  //         contactMethod:  parseInt(l.contact_method) || 1,
  //         behavior:       parseInt(l.interest_level) || 2,
  //         finalFollowup:  parseDBDate(l.follow_up_date),   // ⭐ KEY FIX
  //         status:         l.status || 'pending',
  //         leadStatus:     parseInt(l.lead_status) || 1,
  //         attemptNumber:  parseInt(l.attempt_number) || 0,
  //         addedBy:        l.added_by || 'Admin',
  //         followUpHistory: history
  //       };
  //     });

  //     applyDefaultSort();
  //     buildCalendar();
  //     $scope.isLoading = false;
  //   });
  // }
function loadLeads() {
    if (isLocalPreview) {
      loadDummyLeads();
      return;
    }

    $scope.isLoading = true;
    $http.get(API_URL + "?action=list").then(function(response) {
      var apiLeads = (response.data || []).map(function(l) {
        var history = [];
        try { 
            history = l.followup_history ? JSON.parse(l.followup_history) : []; 
            if (!Array.isArray(history)) history = [];
            
            // FIX: Ensure every historical note has a valid integer mood
            history.forEach(function(note) {
                note.mood = parseInt(note.mood) || 2; 
            });
        } catch(e) { history = []; }

        return {
          id: l.id,
          name: l.full_name,
          phone: l.phone_number,
          dateJoined: new Date(l.date_joined),
          description: l.consultation_notes,
          contactMethod: parseInt(l.contact_method) || 1,
          behavior: parseInt(l.interest_level) || 2,
          finalFollowup: new Date(l.follow_up_date),
          leadStatus: parseInt(l.lead_status) || 1,
          followUpHistory: history,
          lastFollowupUpdate: l.last_followup_update ? parseDBDate(l.last_followup_update) : null
        };
      });
      if (!apiLeads.length) {
        loadDummyLeads();
        return;
      }
      applyLeads(apiLeads);
    }, function() {
      loadDummyLeads();
    });
}
  // ===========================================================
  // 5. SAVE FUNCTION
  // ===========================================================
  // $scope.saveToDB = function(lead, isNew) {
  //   var apiData = angular.copy(lead);
  //   apiData.dateJoined    = formatDateForDB(lead.dateJoined);
  //   apiData.finalFollowup = formatDateForDB(lead.finalFollowup);
  //   apiData.addedBy       = lead.addedBy || "Admin";
  //   var action = isNew ? "add" : "update";
  //   return $http.post(API_URL + "?action=" + action, apiData);
  // };
$scope.saveToDB = function(lead, isNew) {
    var apiData = {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        description: lead.description,
        contactMethod: parseInt(lead.contactMethod) || 1,
        behavior: parseInt(lead.behavior) || 2,
        leadStatus: parseInt(lead.leadStatus) || 1,
        attemptNumber: parseInt(lead.attemptNumber) || 0,
        // Helper ensures date is YYYY-MM-DD
        finalFollowup: formatDateForDB(lead.finalFollowup), 
        dateJoined: formatDateForDB(lead.dateJoined),
        followUpHistory: lead.followUpHistory || [],
        addedBy: lead.addedBy || "Admin"
    };

    var action = isNew ? "add" : "update";
    return $http.post(API_URL + "?action=" + action, apiData);
};

  // ===========================================================
  // 6. SCOPE FUNCTIONS
  // ===========================================================

  $scope.updateFollowUpDate = function(mood) {
    if (!$scope.newLead) return;
    if (mood !== undefined && mood !== null) $scope.newLead.behavior = parseInt(mood);
    var base = $scope.newLead.dateJoined || new Date();
    $scope.newLead.finalFollowup = calculateFollowupDate($scope.newLead.behavior || 2, base);
  };

  // ⭐ THE FIXED DATE CHANGE HANDLER
  // ng-model="selectedFollowupDateStr" gives us a clean "YYYY-MM-DD" string
  // We convert it safely and save
$scope.onFollowupDateChanged = function() {
    if (!$scope.selectedFollowupDateStr || !$scope.selectedLead) return;
    var newDate = strToDate($scope.selectedFollowupDateStr);
    if (!newDate || isNaN(newDate.getTime())) return;
    $scope.selectedLead.finalFollowup = newDate;
    // Mark when follow-up date was updated
    $scope.selectedLead.lastFollowupUpdate = new Date();
    // ⭐ NO alert — completely silent
    $scope.saveToDB($scope.selectedLead, false).then(function() {
        applyDefaultSort();
        buildCalendar();
    });
};

  // Note Editing
  $scope.startEditingNote = function(note) {
    if ($scope.editingNoteId !== null) {
      $scope.selectedLead.followUpHistory.forEach(function(n) { n.isEditing = false; });
    }
    note.originalText    = note.text;
    $scope.editingNoteId = note.timestamp;
    note.isEditing       = true;
  };

  $scope.cancelEditingNote = function(note) {
    note.text      = note.originalText;
    note.isEditing = false;
    if ($scope.editingNoteId === note.timestamp) $scope.editingNoteId = null;
  };

  $scope.saveEditedNote = function(lead, note) {
    if (!note.text || note.text.trim() === "") return alert("Note cannot be empty.");
    note.isEditing    = false;
    note.editedAt     = new Date().toISOString();
    note.editedBy     = lead.addedBy || "Admin";
    note.originalText = null;
    $scope.editingNoteId = null;
    $scope.saveToDB(lead, false).then(function(res) {
      var data = res.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { data = null; } }
      var ok = data && (data.success === true || data.success === 1 || data.success === "true");
      if (!ok && res.status >= 200 && res.status < 300) ok = true;
      if (!ok) alert("Error updating note: " + ((data && data.error) || "Unknown"));
    });
  };

// $scope.addFollowUpNote = function(lead) {
//     var noteText = $scope.noteDraft.text;
//     if (!noteText || noteText.trim() === "") return alert("Please type a note.");
    
//     var selectedMood = parseInt($scope.noteDraft.mood) || 2; 

//     if (!lead.followUpHistory) lead.followUpHistory = [];

//     lead.followUpHistory.push({
//       text: noteText,
//       timestamp: new Date().toISOString(),
//       addedBy: "Admin",
//       mood: selectedMood // Now correctly saves 1, 2, or 3
//     });

//     lead.behavior = selectedMood; // Update main face
//     lead.attemptNumber = lead.followUpHistory.length;

//     $scope.saveToDB(lead, false).then(function(res) {
//         if (res.data.success) {
//             // Reset the draft for the next note
//             $scope.noteDraft.text = ""; 
//             $scope.noteDraft.mood = lead.behavior; 
//             console.log("Note saved with mood " + selectedMood);
//         }
//     });
// };
// FIX: Add 'noteText' as the second parameter
// Add 'noteText' here
// FIX: Add noteText AND noteMood as parameters
$scope.addFollowUpNote = function(lead) {
    var noteText = $scope.newNote.text;
    var selectedMood = parseInt($scope.newNote.mood) || 2; 

    if (!noteText || noteText.trim() === "") return alert("Please type a note.");

    if (!lead.followUpHistory) lead.followUpHistory = [];

    // Push to the array so it shows up in the list instantly
    lead.followUpHistory.push({
      text: noteText,
      timestamp: new Date().toISOString(),
      addedBy: "Admin",
      mood: selectedMood
    });

    lead.behavior = selectedMood; // Update main lead face
    lead.attemptNumber = lead.followUpHistory.length;

    $scope.saveToDB(lead, false).then(function(res) {
        // ⭐ THE FIX: Force parse the PHP response just like your other functions
        var data = res.data;
        if (typeof data === 'string') { 
            try { data = JSON.parse(data); } catch(e) { data = null; } 
        }
        
        // Check if it was successful
        var ok = data && (data.success === true || data.success === 1 || data.success === "true");
        if (!ok && res.status >= 200 && res.status < 300) ok = true;

        if (ok) {
            // ⭐ This will now correctly trigger and clear the input box!
            $scope.newNote.text = ""; 
            $scope.newNote.mood = lead.behavior; 
            console.log("Note saved successfully with mood " + selectedMood);
        } else {
            alert("Saved, but there was an issue reading the API response.");
        }
    });
};
  $scope.updateNoteMood = function(lead, note, newMood) {
    if (!note.moodHistory) note.moodHistory = [];
    note.moodHistory.push({ mood: parseInt(newMood), changedAt: new Date().toISOString(), changedBy: lead.addedBy || "Admin" });
    note.mood = parseInt(newMood);
    $scope.saveToDB(lead, false);
  };

  $scope.isLeadLocked = function(lead) {
    if (!lead) return false;
    var s = parseInt(lead.leadStatus);
    return s === 3 || s === 4;
  };

  $scope.updateLeadStatus = function(lead) {
    $scope.saveToDB(lead, false).then(function(res) {
        if (res.data.success) {
            applyDefaultSort();
        }
    });
  };
  $scope.quickUpdateMood = function(lead) {
    lead.finalFollowup = calculateFollowupDate(lead.behavior, new Date());
    // Mark when follow-up date was updated
    lead.lastFollowupUpdate = new Date();
    $scope.saveToDB(lead, false).then(function() { applyDefaultSort(); });
  };

  // ⭐ openLeadModal: set the string variable for the date input
$scope.openLeadModal = function(lead) {
    $scope.selectedLead = lead; 
   
    $scope.selectedLead.finalFollowup = lead.finalFollowup instanceof Date 
        ? lead.finalFollowup 
        : parseDBDate(String(lead.finalFollowup));
    
    // ⭐ Create the object here to bypass ng-if scope issues
    $scope.newNote = {
        mood: parseInt(lead.behavior) || 2,
        text: ""
    };
    
    $scope.editingNoteId = null;
    $scope.showLeadModal = true;
};

  $scope.closeLeadModal = function() {
    if ($scope.editingNoteId !== null) {
      if (!confirm("You have unsaved changes. Close without saving?")) return;
    }
    if ($scope.selectedLead && $scope.selectedLead.followUpHistory) {
      $scope.selectedLead.followUpHistory.forEach(function(n) { n.isEditing = false; });
    }
    $scope.editingNoteId = null;
    $scope.showLeadModal = false;
  };

  $scope.openAddLeadModal = function() {
    $scope.newLead = {
      name: '', phone: '', behavior: 2, contactMethod: 1,
      dateJoined: new Date(), description: '', leadStatus: 1,
      attemptNumber: 1, followUpHistory: []
    };
    $scope.newLead.finalFollowup  = calculateFollowupDate(2, $scope.newLead.dateJoined);
    $scope.showAddLeadErrors      = false;
    $scope.addLeadMissingFields   = [];
    $scope.isAddLeadDirty         = false;
    $scope.addLeadPristine        = angular.copy($scope.newLead);
    $scope.showAddLead            = true;
  };

  $scope.closeAddLead = function() {
    if ($scope.isAddLeadDirty) {
      if (!confirm("You have unsaved changes. Close without saving?")) return;
    }
    $scope.showAddLead          = false;
    $scope.showAddLeadErrors    = false;
    $scope.addLeadMissingFields = [];
    $scope.isAddLeadDirty       = false;
    $scope.addLeadPristine      = null;
  };

  $scope.saveNewLead = function() {
    $scope.showAddLeadErrors = true;
    if (!$scope.newLead) return;

    if (!$scope.newLead.contactMethod) $scope.newLead.contactMethod = 1;
    if (!$scope.newLead.behavior)      $scope.newLead.behavior      = 2;
    if (!$scope.newLead.dateJoined)    $scope.newLead.dateJoined    = new Date();
    if (!$scope.newLead.finalFollowup) {
      $scope.newLead.finalFollowup = calculateFollowupDate($scope.newLead.behavior, $scope.newLead.dateJoined);
    }
    // Mark follow-up date update time
    $scope.newLead.lastFollowupUpdate = new Date();
    if (!$scope.newLead.followUpHistory) $scope.newLead.followUpHistory = [];

    var nameVal  = $scope.sanitizeName($scope.newLead.name).trim();
    var phoneVal = ($scope.newLead.phone || "").toString().trim();
    var notesVal = ($scope.newLead.description || "").trim();
    $scope.newLead.name        = nameVal;
    $scope.newLead.phone       = phoneVal;
    $scope.newLead.description = notesVal;

    var missing = [];
    if (!nameVal)  missing.push("Full Name");
    if (!phoneVal) missing.push("Phone Number");
    if (!notesVal) missing.push("Consultation Notes");
    $scope.addLeadMissingFields = missing;
    if (missing.length) { alert("Missing required: " + missing.join(", ")); return; }

    $scope.saveToDB($scope.newLead, true).then(function(res) {
      var data = res.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { data = null; } }
      var ok = data && (data.success === true || data.success === 1 || data.id);
      if (!ok && res.status >= 200 && res.status < 300) ok = true;
      if (ok) {
        loadLeads();
        $scope.showAddLead          = false;
        $scope.showAddLeadErrors    = false;
        $scope.addLeadMissingFields = [];
      } else {
        alert("Error adding lead: " + ((data && data.error) || "Unknown"));
      }
    }, function() { alert("Error adding lead. Please check the API or network."); });
  };

  // Filters
  $scope.filterByStatus = function(status) {
    $scope.selectedStatus = status;
    $scope.statusFilter   = (status === 'all') ? {} : { leadStatus: status };
  };

  $scope.filterByMood = function(n) {
    $scope.selectedMood = n;
    $scope.moodFilter   = n ? { behavior: n } : {};
  };

  $scope.filterByDate = function(type) {
    $scope.selectedDateFilter = type;
    var today = new Date(); today.setHours(0,0,0,0);

    if (type === 'today') {
      $scope.selectedCalendarTs = null;
      $scope.dateFilter = function(lead) {
        var d = new Date(lead.finalFollowup); d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      };
      return;
    }
    if (type === 'tomorrow') {
      $scope.selectedCalendarTs = null;
      var tom = new Date(today); tom.setDate(today.getDate() + 1);
      $scope.dateFilter = function(lead) {
        var d = new Date(lead.finalFollowup); d.setHours(0,0,0,0);
        return d.getTime() === tom.getTime();
      };
      return;
    }
    if (type === 'calendar' || type === 'custom') return;
    $scope.dateFilter = {};
    $scope.selectedDateFilter = null;
    $scope.selectedCalendarTs = null;
  };

  $scope.clearAllFilters = function() {
    $scope.searchQuery = ""; $scope.selectedMood = null; $scope.moodFilter = {};
    $scope.selectedStatus = 'all'; $scope.statusFilter = {};
    $scope.selectedDateFilter = null; $scope.dateFilter = {};
    $scope.selectedCalendarTs = null; $scope.currentPage = 1;
  };

  // Calendar
  $scope.showCalendarModal = false;

  $scope.openCalendar = function() {
    $scope.showCalendarModal  = true;
    $scope.selectedDateFilter = ($scope.selectedDateFilter === 'custom') ? 'custom' : 'calendar';
    $scope.currentDate  = new Date();
    $scope.currentMonth = $scope.currentDate.getMonth();
    $scope.currentYear  = $scope.currentDate.getFullYear();
    buildCalendar();
  };

  $scope.closeCalendar = function() { $scope.showCalendarModal = false; };

  $scope.previousMonth = function() {
    if ($scope.currentMonth === 0) { $scope.currentMonth = 11; $scope.currentYear--; }
    else $scope.currentMonth--;
    buildCalendar();
  };

  $scope.nextMonth = function() {
    if ($scope.currentMonth === 11) { $scope.currentMonth = 0; $scope.currentYear++; }
    else $scope.currentMonth++;
    buildCalendar();
  };

  $scope.getMonthYear = function() {
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months[$scope.currentMonth] + " " + $scope.currentYear;
  };

  $scope.selectCalendarDate = function(day) {
    if (!day) return;
    $scope.selectedCalendarTs = day.timestamp;
    $scope.selectedDateFilter = 'custom';
    $scope.dateFilter = function(lead) {
      var d = new Date(lead.finalFollowup); d.setHours(0,0,0,0);
      return d.getTime() === day.timestamp;
    };
    $scope.showCalendarModal = false;
  };

  // UI Helpers
  $scope.leadSortKey = function(lead) {
    if (!lead) return 0;
    return (parseInt(lead.leadStatus) === 3 || parseInt(lead.leadStatus) === 4) ? 1 : 0;
  };

  $scope.isFollowupUpdatedToday = function(lead) {
    return isFollowupUpdatedToday(lead);
  };

  $scope.getRowClass = function(lead) {
    if (!lead) return {};
    var s = parseInt(lead.leadStatus);
    return {
      'row-converted':  s === 4,
      'row-lost':       s === 3,
      'second-attempt': lead.attemptNumber > 1 && lead.status === 'pending',
      'completed-row':  lead.status === 'complete'
    };
  };

  $scope.getContactStyle = function(m) { return { 'background': ({1:'#25d366',2:'#b45309',3:'#7c3aed'})[m] }; };
  $scope.getContactIcon  = function(m) { return ({1:'fa-whatsapp',2:'fa-phone',3:'fa-envelope'})[m]; };

  $scope.isOverdue = function(d) { return new Date(d) < new Date().setHours(0,0,0,0); };

  $scope.isAlertDate = function(date) {
    if (!date) return false;
    var today = new Date(); today.setHours(0,0,0,0);
    var d = new Date(date); d.setHours(0,0,0,0);
    var diff = (d - today) / (1000*60*60*24);
    return diff >= -1 && diff <= 1;
  };

  // Pagination
  $scope.getTotalPages = function() {
    return Math.max(1, Math.ceil(($scope.filteredResults || $scope.leads || []).length / $scope.itemsPerPage));
  };
  $scope.setPage = function(p) {
    var max = $scope.getTotalPages();
    $scope.currentPage = Math.min(Math.max(p, 1), max);
  };
  $scope.pagesArray = function() {
    return Array.from({length: $scope.getTotalPages()}, function(_, i){ return i+1; });
  };
  $scope.getPaginationInfo = function() {
    return "Showing " + ($scope.filteredResults || $scope.leads || []).length + " Leads";
  };
  $scope.setItemsPerPage = function(n) { $scope.itemsPerPage = n; $scope.currentPage = 1; };
// $scope.updateFollowupOnly = function(lead) {
//     if (!lead || !lead.finalFollowup) return;

//     // convert properly
//     var d = lead.finalFollowup instanceof Date 
//             ? lead.finalFollowup 
//             : strToDate(lead.finalFollowup);

//     lead.finalFollowup = d;

//     $scope.saveToDB(lead, false).then(function() {
//         applyDefaultSort();
//         buildCalendar();
//         console.log("Follow-up date updated.");
//     });
// };

$scope.updateFollowupOnly = function(lead) {
    if (!lead || !lead.finalFollowup) return;

    // Input type="date" gives a "YYYY-MM-DD" string — convert it to a Date
    if (typeof lead.finalFollowup === 'string') {
        var parsed = strToDate(lead.finalFollowup);
        if (!parsed || isNaN(parsed.getTime())) return;
        lead.finalFollowup = parsed;
    }

    $scope.saveToDB(lead, false).then(function(res) {
        applyDefaultSort();
        buildCalendar();
        // Silent save — no alerts
    });
};


$scope.openWhatsApp = function(p) { window.open('https://wa.me/91' + p, '_blank'); };
  $scope.makeCall     = function(p) { window.location.href = 'tel:+91' + p; };

  // Watchers
  $scope.$watch('newLead', function(v) {
    if (!v || !$scope.addLeadPristine) return;
    $scope.isAddLeadDirty = !angular.equals(v, $scope.addLeadPristine);
  }, true);
  $scope.$watchGroup(['showLeadModal','showAddLead','showCalendarModal','showStatusEditor'], updateBodyScrollLock);

  // INIT
  loadLeads();
});
