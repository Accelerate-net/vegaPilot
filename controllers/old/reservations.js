angular.module('reservationsApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('reservationsController', function($scope, $http, $interval, $cookies) {

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
      $scope.filterTitle = 'Upcoming Reservations of the Week';
      $scope.isMoreLeft = false;

      //Default Results : Reservations of the Week
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+'-'+mm+'-'+yyyy;
      
      $scope.todayDate = today;


$scope.initReservations = function(){

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = 0;
      data.key = today;
      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchreservationsadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
       $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
         if(response.data.status){

           $scope.isReservationsFound = true;
           $scope.reservationsList = response.data.response;
           
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
	          url     : 'https://accelerateengine.app/food-engine/apis/fetchreservationsadmin.php',
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
          url     : 'https://accelerateengine.app/food-engine/apis/fetchreservationsadmin.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
           if(response.data.status){
             $scope.isReservationsFound = true;
             $scope.reservationsList = $scope.reservationsList.concat(response.data.response);

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
      
      
      $scope.getStatusColor = function(mystatus){
	switch(mystatus) {
	    case 'Seated':{
	        return 'greenColorText';
	        break;
	    }
	    case 'Completed':{
	        return 'greenColorText';
	        break;
	    }
	    case 'Cancelled':{
	        return 'redColorText';
	        break;
	    } 
	    case 'No Show':{
	        return 'redColorText';
	        break;
	    }   
	    default:{
	        return '';
	    }
	}      
      }
               
         
         $scope.showCancel = function(id, showName){
         
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
		              	alert(response.data.error);
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
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/newreservationsadmin.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	$('#reservationModal').modal('hide');
		         	if(response.data.status){	   
		         		$scope.initReservations();
		              	}
		              	else{
			              	alert(response.data.error);
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
			              	alert(response.data.error);
		              	}
		         });  
		}
	
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
