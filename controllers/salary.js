angular.module('salaryApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('salaryController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    if($cookies.get("accelerateVegaDeskAdmin")){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "adminlogin.html";
    }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("accelerateVegaDeskAdmin")){
        $cookies.remove("accelerateVegaDeskAdmin");
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
      $scope.filterTitle = 'Salary Issued this Month';
      $scope.isMoreLeft = false;

      //Default Results : Salary of the Month
      var today = new Date();
      var mm = today.getMonth();
      var yyyy = today.getFullYear();

      today = getFancyMonth(mm)+' '+yyyy;
      
      $scope.todayDate = today;


  function getFancyMonth(id){
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    return month[id];    
  }



$scope.initReservations = function(){

      var data = {};
      data.token = $cookies.get("accelerateVegaDeskAdmin");
      data.id = 0;
      data.key = today;

      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/erpfetchsalaryslips.php',
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
           $scope.resultMessage = "There are no Salary Slips generated this month!";
         }
        });
}
$scope.initReservations();


      $scope.limiter = 0;
      
      $scope.searchByDate = function(){    
	    $scope.searchID = "";
	    setTimeout(function(){
		    $('#mySearchBox').datetimepicker({  
			    	format: "MM yyyy",
			    	weekStart: 1,
		        	todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 3,
				minView: 3,
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
        data.token = $cookies.get("accelerateVegaDeskAdmin");
        data.key = $scope.searchID;
        data.id = 0;
        $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        if($scope.searchID != ""){
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/erpfetchsalaryslips.php',
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
        data.token = $cookies.get("accelerateVegaDeskAdmin");
        data.key = $scope.searchID;
        data.id = $scope.limiter;

        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/erpfetchsalaryslips.php',
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
	        data.token = $cookies.get("accelerateVegaDeskAdmin");
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
     	$scope.newSalarySlip = {};
     	$scope.newSalarySlip.staffMetaData = "";
     	$scope.newSalarySlip.amount = 0;
     	$scope.newSalarySlip.mode = "";
     	$scope.newSalarySlip.date = "";
     	$scope.newSalarySlip.month = "";
     	$scope.newSalarySlip.reference = "";
     	$scope.newSalarySlip.comments = "";  
     	$scope.newSalarySlip.employeeCode = "";   

     	$scope.isPhotoAttached = false;
		$scope.myPhotoURL = '';
     }
     $scope.nullNewReservation();
     
     
     $scope.openNewReservation = function(){
     	$scope.nullNewReservation();

            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");
            data.key = '';

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchstafflistsalary.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {

                if(response.data.status){
                  $scope.staffList = response.data.response;
                  console.log($scope.staffList)
                  $('#reservationModal').modal('show');
                }
                else{
                  
                }

            });

     	
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
	    
	    $('#new_month').datetimepicker({ // Time
			format: "MM yyyy",
        	weekStart: 1,
        	todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 3,
			minView: 3,
			maxView: 3,
			forceParse: 0
	    });
	    
	    
	
	$scope.isPhotoAttached = false;
	$scope.myPhotoURL = '';

	$scope.adjustValues = function(){
		var staffObj = JSON.parse($scope.newSalarySlip.staffMetaData);
		console.log(staffObj.payAmountDue)

		$scope.newSalarySlip.amount = staffObj.payAmountDue;
		$scope.newSalarySlip.employeeCode = staffObj.employeeID;

		if(staffObj.photoURL && staffObj.photoURL != ''){
			$scope.isPhotoAttached = true;
			$scope.myPhotoURL = staffObj.photoURL;
		}
		else{
			$scope.isPhotoAttached = false;
			$scope.myPhotoURL = '';
		}
	}    
	    
	    
	$scope.saveNewSlip = function(){
	
		$scope.newSalarySlip.month = document.getElementById("new_month").value;
		$scope.newSalarySlip.date = document.getElementById("new_date").value;
		$scope.newSalarySlip.mode = document.getElementById("my_mode").value;

		
		$scope.newReservationError = "";
		
		if($scope.newSalarySlip.employeeCode == ""){
			$scope.newReservationError = "Select Employee";
		}
		else if($scope.newSalarySlip.amount == "" || $scope.newSalarySlip.amount == 0){
			$scope.newReservationError = "Invalid Amount";
		}
		else if($scope.newSalarySlip.date == "" || $scope.newSalarySlip.month == ""){
			$scope.newReservationError = "Add Date and Issuing Month";
		}
		else if($scope.newSalarySlip.mode == ""){
			$scope.newReservationError = "Select Payment Mode";
		}
		else{
			$scope.newReservationError = "";

			$scope.newSalarySlip.month = standardiseMonth($scope.newSalarySlip.month);
			
			var data = {};
		    	data.details = $scope.newSalarySlip;
		        data.token = $cookies.get("accelerateVegaDeskAdmin");
            
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/erpaddsalaryslip.php',
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


	function standardiseMonth(input){
		var temp = input.split(' ');
		var month = temp[0];

		return temp[1]+''+getMonthDigit(month)

	}


  function getMonthDigit(text){
    switch(text) {
        case 'January':
            return '01'
        case 'February':
            return '02'
        case 'March':
            return '03'
        case 'April':
            return '04'
        case 'May':
            return '05'
        case 'June':
            return '06'
        case 'July':
            return '07'
        case 'August':
            return '08'   
        case 'September':
            return '09'
        case 'October':
            return '10'
        case 'November':
            return '11'
        case 'December':
            return '12'                
    }
  }



     //Refresh Badge Counts
        var admin_data = {};
        admin_data.token = $cookies.get("accelerateVegaDeskAdmin");
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
