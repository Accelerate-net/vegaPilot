angular.module('seaterApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('seaterController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    if($cookies.get("acceleronLunaAdminToken")){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "adminlogin.html";
    }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("acceleronLunaAdminToken")){
        $cookies.remove("acceleronLunaAdminToken");
        window.location = "adminlogin.html";
      }
    }

    $scope.outletCode = localStorage.getItem("branch");


	    //UI betterment purpose
	    $scope.formatTime = function(time){
	      var formatted = time;
	        if(time > 1230){
	          time = time - 1200;
	          if(time <= 930){
	            formatted = '0'+time;
	          }
	          else{
	            formatted = time;
	          }
	        }
	
	      var final = formatted.toString().substring(0,2)+':'+formatted.toString().substring(2,4)+' PM';
	
	      return final;
	    }


    
         
      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isReservationsFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Today\'s Reservations';
      $scope.isMoreLeft = false;
      
      $scope.activeLunchCount = 0; 
      $scope.activeDinnerCount = 0;    
      
      $scope.showHistory = false; //Dont show history by default

      //Default Results : Reservations of the Week
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+'-'+mm+'-'+yyyy;
      
      $scope.todayDate = today;
      
      //Lunch = 1 or Dinner = 2 or All = 0
      $scope.timeFilterFlag = 0;
      if(localStorage.getItem("timeFilter") == 0 || localStorage.getItem("timeFilter") == 1 || localStorage.getItem("timeFilter") == 2){
      	$scope.timeFilterFlag = localStorage.getItem("timeFilter");
      }
      
      $scope.changeTimeFilter = function(){
      	if($scope.timeFilterFlag == 2){      		
      		$scope.timeFilterFlag = 0;
      	}
      	else{
      		$scope.timeFilterFlag++;      		
      	}
      	localStorage.setItem("timeFilter", $scope.timeFilterFlag);
      }
      
      //Reservation Filter
      $scope.getReservationsFiltered = function(myReservation, historyFlag){
      
      		//Show all, no restrictions
	      	if($scope.timeFilterFlag == 0){
		      	if(myReservation.statusCode == 0 && !historyFlag){
		      		return true;
		      	}
		      	else if(historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}
	      	}
	      	else if($scope.timeFilterFlag == 1){ //Show only lunch
		      	if(myReservation.statusCode == 0 && !historyFlag && myReservation.isLunch){
		      		return true;
		      	}
		      	else if(historyFlag && myReservation.isLunch){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}	
	      	else if($scope.timeFilterFlag == 2){ //Show only dinner
		      	if(myReservation.statusCode == 0 && !historyFlag && !myReservation.isLunch){
		      		return true;
		      	}
		      	else if(historyFlag && !myReservation.isLunch){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}		      	
      }
      
      
     
      
      
      
      
      

$scope.initReservations = function(){

      $scope.activeLunchCount = 0; //Want to Count only reservations with status 0
      $scope.activeDinnerCount = 0;         

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = 0;
      data.key = today;
      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchreservations.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
       $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
         if(response.data.status){
         
         

           $scope.isReservationsFound = true;
           $scope.reservationsList = response.data.response;
           $scope.activeLunchCount = response.data.activeLunchCount;
           $scope.activeDinnerCount = response.data.activeDinnerCount;
           
           	     if($scope.reservationsList.length%10 == 0){
	                  $scope.isMoreLeft = true;
	             }else{
	                  $scope.isMoreLeft = false;
	             }
	             
         }
         else{
           $scope.isReservationsFound = false;
           $scope.resultMessage = "There are no Reservations this week!";
         }
        });
}
$scope.initReservations();


      $scope.limiter = 0;
      
      $scope.searchByDate = function(){    
	    $scope.searchID = "";
	    setTimeout(function(){
		    $('#mySearchBox').datetimepicker({  
			    	format: "dd-mm-yyyy",
			    	weekStart: 1,
		        	todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
		    }).on('changeDate', function(ev) {
			    $scope.searchID = $("#mySearchBox").val();
			    $scope.search();
		    }).on('hide', function(ev) { 
			    $('#mySearchBox').datetimepicker('remove');
		    });
			
		    $("#mySearchBox").datetimepicker().focus();
	    
	    }, 200);	     
      }

      $scope.search = function() {

        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.key = $scope.searchID;
        data.id = 0;
        $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        if($scope.searchID != ""){
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/deskfetchreservations.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
	           if(response.data.status){            
	             $scope.filterTitle = response.data.result;
	             
	             $scope.isMoreLeft = false;
	             $scope.isReservationsFound = true;
	             $scope.reservationsList = response.data.response;
	             $scope.activeLunchCount = response.data.activeLunchCount;
	             $scope.activeDinnerCount = response.data.activeDinnerCount;
	           
	             $scope.filterTitle = response.data.message;
	
	             if($scope.reservationsList.length%10 == 0){
	                  $scope.isMoreLeft = true;
	             }else{
	                  $scope.isMoreLeft = false;
	             }
	           }
	           else{
	             $scope.isReservationsFound = false;
	             $scope.filterTitle = "No Matching Results";
	             $scope.resultMessage = "There are no matching results.";
	           }
	          });
          
          }
      }

      //Load More Orders
      $scope.loadMore = function(){
        $scope.limiter = $scope.limiter + 10;
        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.key = $scope.searchID;
        data.id = $scope.limiter;

        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/deskfetchreservations.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
           if(response.data.status){
             $scope.isReservationsFound = true;
             $scope.reservationsList = $scope.reservationsList.concat(response.data.response);
             $scope.activeLunchCount = response.data.activeLunchCount;
             $scope.activeDinnerCount = response.data.activeDinnerCount;             

             if($scope.reservationsList.length%10 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
           	if($scope.limiter == 0){
             		$scope.isReservationsFound = false;
             	}
             	else{
             		$scope.isMoreLeft = false;
             	}
           }
          });
      }
               
               
               
               
      //Time Filter not found warning
      $scope.getFilterWarnCheck = function(historyFlag){
      
      		//Show all, no restrictions
	      	if($scope.timeFilterFlag == 0){
		      	if($scope.activeLunchCount == 0 && $scope.activeDinnerCount == 0 && !historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}
	      	}
	      	else if($scope.timeFilterFlag == 1){ //Show only lunch
		      	if($scope.activeLunchCount == 0 && !historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}	
	      	else if($scope.timeFilterFlag == 2){ //Show only dinner
		      	if($scope.activeDinnerCount == 0 && !historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}	      	
      }
      
      
      //TO show the table or not
      $scope.getFilterTableDisplayCheck = function(historyFlag){
      		//Show all, no restrictions
	      	if($scope.timeFilterFlag == 0){
		      	if($scope.activeLunchCount > 0 || $scope.activeDinnerCount > 0 || historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}
	      	}
	      	else if($scope.timeFilterFlag == 1){ //Show only lunch
		      	if($scope.activeLunchCount > 0 || historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}	
	      	else if($scope.timeFilterFlag == 2){ //Show only dinner
		      	if($scope.activeDinnerCount > 0 || historyFlag){
		      		return true;
		      	}
		      	else{
		      		return false;
		      	}	      	
	      	}      
      
      }
      
                     
         
         $scope.showCancel = function(id, showName, status){
         
         	$scope.cancelWarn = "";
         	
         	if(status == 1){
         		$scope.cancelWarn = "It is already seated. ";
         	}
         	else if(status == 2){
         		$scope.cancelWarn = "It is already completed. ";
         	}
         
       		$scope.cancelItemCode = id;
       		$scope.cancelShowName = showName != ""? showName: "Unknown Person";
       	
       		$('#cancelModal').modal('show');
         
         }
         
         $scope.confirmCancel = function(code){
	    	var data = {};
	    	data.id = code;
	        data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/cancelreservationsadmin.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         	$('#cancelModal').modal('hide');
	         	if(response.data.status){	   
	         		$scope.initReservations();
	              	}
	              	else{
			    var x = document.getElementById("snackbar")
			    x.innerHTML = "Error: "+response.data.error;
			    x.className = "show";
			    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);	
	              	}
	         });         
         }
         
         
         
         $scope.showConfirmComplete = function(id, showName){
       		$scope.confirmItemCode = id;
       		$scope.confirmShowName = showName != ""? showName: "Unknown Person";
       	
       		$('#completeConfirmModal').modal('show');         
         }
         
         $scope.confirmComplete = function(code){
	    	var data = {};
	    	data.id = code;
	        data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/deskmarkreservationcompleted.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         	$('#completeConfirmModal').modal('hide');
	         	if(response.data.status){	   
	         		$scope.initReservations();
	              	}
	              	else{
			    var x = document.getElementById("snackbar")
			    x.innerHTML = "Error: "+response.data.error;
			    x.className = "show";
			    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);		              	
	              	}
	         });         
         }         
         
         
     //Add new reservation
     $scope.nullNewReservation = function(){
     	$scope.newReservationContent = {};
     	$scope.newReservationContent.mobile = "";
     	$scope.newReservationContent.email = "";
     	$scope.newReservationContent.name = "";
     	$scope.newReservationContent.count = 2;
     	$scope.newReservationContent.mode = "";
     	$scope.newReservationContent.date = "";
     	$scope.newReservationContent.time = "";
     	$scope.newReservationContent.comments = "";     
     }
     $scope.nullNewReservation();
     
     
     $scope.openNewReservation = function(){
     	$scope.nullNewReservation();
     	$('#reservationModal').modal('show');
     	console.log('opening new reservation')
     }
     
     $scope.showEdit = function(obj){
     	$scope.editReservationContent = obj;
     	$('#reservationEditModal').modal('show');
     }
     
            $('#new_date').datetimepicker({  // Date
		    	format: "dd-mm-yyyy",
		    	weekStart: 1,
	        	todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 2,
			minView: 2,
			forceParse: 0
	    });
	    
	    $('#new_time').datetimepicker({ // Time
			format: "hhii",
        		weekStart: 1,
        		todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 1,
			minView: 0,
			maxView: 1,
			forceParse: 0
	    });
	    
	    $('#edit_date').datetimepicker({  // Date
		    	format: "dd-mm-yyyy",
		    	weekStart: 1,
	        	todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 2,
			minView: 2,
			forceParse: 0
	    });
	    
	    $('#edit_time').datetimepicker({ // Time
			format: "hhii",
        		weekStart: 1,
        		todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 1,
			minView: 0,
			maxView: 1,
			forceParse: 0
	    });
	    
	    
	    
	    
	$scope.saveNewReservation = function(){
	
		$scope.newReservationContent.time = document.getElementById("new_time").value;
		$scope.newReservationContent.date = document.getElementById("new_date").value;
		$scope.newReservationContent.mode = document.getElementById("my_mode").value;
		$scope.newReservationContent.isBirthday = document.getElementById("check_birthday").checked ? 1 : 0;
		$scope.newReservationContent.isAnniversary = document.getElementById("check_anniversary").checked? 1: 0;
		
		console.log($scope.newReservationContent);
		
		$scope.newReservationError = "";
		
		if($scope.newReservationContent.name == "" || !(/^[a-zA-Z ]+$/.test($scope.newReservationContent.name))){
			$scope.newReservationError = "Invalid Name";
		}
		else if($scope.newReservationContent.mobile == "" || !(/^[789]\d{9}$/.test($scope.newReservationContent.mobile))){
			$scope.newReservationError = "Invalid Mobile Number";
		}
		else if($scope.newReservationContent.count == "" || $scope.newReservationContent.count == 0){
			$scope.newReservationError = "Invalid Person Count";
		}
		else if($scope.newReservationContent.date == "" || $scope.newReservationContent.time == ""){
			$scope.newReservationError = "Add Date and Time";
		}
		else if($scope.newReservationContent.mode == ""){
			$scope.newReservationError = "Select Reservation Mode";
		}
		else{
			$scope.newReservationError = "";
			
			var data = {};
		    	data.details = $scope.newReservationContent;
		        data.token = $cookies.get("acceleronLunaAdminToken");

console.log(data)
		        
		        document.getElementById("newReservationSaveButton").innerHTML = '<img width="17px" src="assets/img/arrowloader.gif">';
		        
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/newreservationsadmin.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	document.getElementById("newReservationSaveButton").innerHTML = "Save";
		         	$('#reservationModal').modal('hide');
		         	if(response.data.status){	   
		         	    $scope.initReservations();
				    var x = document.getElementById("snackbar")
				    x.innerHTML = "Reservation added successfully";
				    x.className = "show";
				    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);		         				         		
		              	}
		              	else{
				    var x = document.getElementById("snackbar")
				    x.innerHTML = "Error: "+response.data.error;
				    x.className = "show";
				    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);				              	
		              	}
		         });  
		}
	
	}
	
	
	
	$scope.saveEditReservation = function(){
	
		$scope.editReservationContent.time = document.getElementById("edit_time").value;
		$scope.editReservationContent.date = document.getElementById("edit_date").value;
		
		console.log($scope.editReservationContent);
		
		$scope.editReservationError = "";
		
		
		if($scope.editReservationContent.count == "" || $scope.editReservationContent.count == 0){
			$scope.editReservationError = "Invalid Person Count";
		}
		else if($scope.editReservationContent.date == "" || $scope.editReservationContent.time == ""){
			$scope.editReservationError = "Add Date and Time";
		}
		else{
			$scope.editReservationError = "";
			
			var data = {};
		    	data.details = $scope.editReservationContent;
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/editreservationsadmin.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	$('#reservationEditModal').modal('hide');
		         	if(response.data.status){	   
		         		$scope.initReservations();
		              	}
		              	else{
				    var x = document.getElementById("snackbar")
				    x.innerHTML = "Error: "+response.data.error;
				    x.className = "show";
				    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);			              	
		              	}
		         });  
		}
	
	}
	
	$scope.getActionClass = function(status){
		if(status == 0){
			return "reservationReceived";
		}
		else if(status == 1){
			return "reservationSeated";
		}
		else if(status == 2){
			return "reservationCompleted";
		}
		else if(status == 5){
			return "reservationCancelled";
		}
		else if(status == 6){
			return "reservationNoShow";
		}
		else{
			return "reservationReceived";
		}
	}

	$scope.getRowClass = function(status){
		if(status == 0){
			return "activeReservationRow";
		}
		else if(status == 1){
			return "historyReservationRow";
		}
		else if(status == 2){
			return "historyReservationRow";
		}
		else if(status == 5){
			return "cancelledReservationRow";
		}
		else if(status == 6){
			return "cancelledReservationRow";
		}
		else{
			return "";
		}	
	}
	
      //Seater Area
	
	$scope.seatPlan = "";
	$scope.freeingAllList = "";
	$scope.seatPlanError = "";
	$scope.fetchTime = 'now';
	$scope.initSeatPlan = function(){
	
		$scope.seatPlanError = "";
	
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchtables.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	       console.log(response)
	         if(response.data.status){
	         	$scope.seatPlanError = '';
	         	$scope.fetchTime = response.data.time;
			$scope.seatPlan = response.data.response;
			$scope.freeingAllList = response.data.freeingList;
	         }
	         else{
	           	$scope.seatPlanError = response.data.error;
	         }
	        });
	}
	
		

      
      $scope.holdList = []; //Seats to hold
      $scope.holdListCapacity = 0; //Capacity of hold seats
      $scope.allotedList = []; //Seats already alloted

      $scope.openSeatPlan = function(reservation){
	if(reservation.statusCode == 0 || reservation.statusCode == 1){
	        $scope.guestInfo = reservation;
	      	$scope.holdList = [];
	      	$scope.holdListCapacity = 0;
	      	$scope.allotedList = [];
	        $scope.initSeatPlan();      	
	      	$('#seatingPlanModal').modal('show');
	}
	else{
	    var x = document.getElementById("snackbar")
	    
	    if(reservation.statusCode == 2)
	    	x.innerHTML = "This reservation is already completed";
	    else if(reservation.statusCode == 5 || reservation.statusCode == 6)
	    	x.innerHTML = "Cancelled/No Show reservations can not be edited";
	    	
	    x.className = "show";
	    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);	
	}
      }
      
      $scope.checkDeallot = function(seatID, guestID, seat){
      	if(seatID == guestID){
      		$scope.allotedList.push(seat);
      	}
      }
      
     
      
      $scope.getMyClass = function(seat){
      	if(seat.status == 0){
      		return "btn-success";
      	}
      	else if(seat.status == 1){
      		return "btn-danger";
      	}
      	else if(seat.status == 2){
      		return "btn-warning";
      	}
      }
      
      
      $scope.seatOptions = function(seat){
      	if(seat.status != 0){ //Seat Not Free
      		$scope.myReleaseSeat = seat;    	
      		$('#releaseSeatModal').modal('show');
      		return 0;
      	}
      	else{
      		if($scope.holdList.length == 0){
      			$scope.holdListCapacity = Number(seat.capacity);
      			$scope.holdList.push(seat.name);
      			document.getElementById("seat_"+seat.name).classList.remove('btn-success');
      			document.getElementById("seat_"+seat.name).classList.add('seatSelected');
      			document.getElementById("seatTag_"+seat.name).innerHTML = '<i class="fa fa-check"></i>';

      		}
      		else{
      			var index = $scope.holdList.indexOf(seat.name);
      			if(index > -1){ //Already in the list --> UNSELECT
      				$scope.holdList.splice(index, 1);
      				$scope.holdListCapacity = Number($scope.holdListCapacity) - Number(seat.capacity);
      				document.getElementById("seat_"+seat.name).classList.remove('seatSelected');
      				document.getElementById("seat_"+seat.name).classList.add('btn-success');
      				document.getElementById("seatTag_"+seat.name).innerHTML = (seat.occupant).substring(0, 20);
      				if((seat.occupant).length > 20){
      					document.getElementById("seatTag_"+seat.name).innerHTML += '...'; 
      				}
      			}
      			else{ //Not in the list --> SELECT
      				$scope.holdList.push(seat.name);
      				$scope.holdListCapacity = Number($scope.holdListCapacity) + Number(seat.capacity);
      				document.getElementById("seat_"+seat.name).classList.remove('btn-success');
      				document.getElementById("seat_"+seat.name).classList.add('seatSelected');
      				document.getElementById("seatTag_"+seat.name).innerHTML = '<i class="fa fa-check"></i>';
      			}      		
      		}
      		
      		
      	}      	
      }
      
     //For Gen View only 
      $scope.openSeatPlanView = function(){
	$scope.initSeatPlan();      	
	$('#seatingPlanViewModal').modal('show');
      }
      
      
      $scope.seatOptionsView = function(seat){
      	if(seat.status != 0){ //Seat Not Free
      		$scope.myReleaseSeat = seat;    	
      		$('#releaseSeatModal').modal('show');
      	}
      	else{
	    var x = document.getElementById("snackbar")
	    x.innerHTML = seat.name+" is already free";
	    x.className = "show";
	    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);	      	
      	}
      }      
      
      
      
      $scope.allocateSeats = function(code, list){	      
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");
	      data.id = code;
	      data.tables = list; //JSON.stringify(list);
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskassigntable.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	         $('#seatingPlanModal').modal('hide');
	         if(response.data.status){
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Tables allocated successfully";
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);	
		    $scope.initSeatPlan();
		    $scope.initReservations();    	         	
	         }
	         else{
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Error: "+response.data.error;
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);		           
	         }
	        });
      }
      
      $scope.deallocateSeats = function(code, list){	      
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");
	      data.id = code;
	      data.tables = list;
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskreleasealltables.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	         $('#seatingPlanModal').modal('hide');
	         if(response.data.status){
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Tables released successfully";
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);	
		    $scope.initSeatPlan();
		    $scope.initReservations();    	         	
	         }
	         else{
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Error: "+response.data.error;
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);		           
	         }
	        });
      }
      

      $scope.confirmRelease = function(code, reserveID){
	      
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");
	      data.id = code;
	      data.bookingID = reserveID;
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskreleasetables.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	         $('#releaseSeatModal').modal('hide');
	         if(response.data.status){
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Table "+code+" released";
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
		    $scope.initSeatPlan();    		         	
	         }
	         else{
		    var x = document.getElementById("snackbar")
		    x.innerHTML = "Error: "+response.data.error;
		    x.className = "show";
		    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);		           	
	         }
	        });
      }
      
         

     //Refresh Badge Counts
        var admin_data = {};
        admin_data.token = $cookies.get("acceleronLunaAdminToken");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/fetchbadgecounts.php',
          data    : admin_data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
              		$scope.reservations_length = response.data.reservationsCount;
              		$scope.pending_orders_length = response.data.ordersCount;
              		$scope.helprequests_length = response.data.helpCount;
              		$scope.smart_orders_length = response.data.smartOrdersCount;
              	}
              	else{
              		$scope.reservations_length = 0;
              		$scope.pending_orders_length = 0;
              		$scope.helprequests_length = 0;
              	}
         });

        $scope.Timer = $interval(function () {
          $http({
            method  : 'POST',
            url     : 'https://accelerateengine.app/food-engine/apis/fetchbadgecounts.php',
            data    : admin_data,
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
           })
           .then(function(response) {
                if(response.data.status){
              		$scope.reservations_length = response.data.reservationsCount;
              		$scope.pending_orders_length = response.data.ordersCount;
              		$scope.helprequests_length = response.data.helpCount;
              		$scope.smart_orders_length = response.data.smartOrdersCount;
              	}
              	else{
              		$scope.reservations_length = 0;
              		$scope.pending_orders_length = 0;
              		$scope.helprequests_length = 0;
              	}
           });
        }, 20000);
        
  })
  ;
