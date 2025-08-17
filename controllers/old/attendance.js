angular.module('attendanceApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('attendanceController', function($scope, $http, $interval, $cookies) {

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


      $('#new_attendance_date').datetimepicker({  // Date
		    format: "dd-mm-yyyy",
		    weekStart: 1,
	       todayBtn:  1,
  			autoclose: 1,
  			todayHighlight: 1,
  			startView: 2,
  			minView: 2,
  			forceParse: 1
	    });


$scope.fetchFigures = function(){

    $scope.figure_total_employees = 0;
    $scope.figure_total_present = 0;
    $scope.figure_total_absent = 0;	

		      		var data = {};
		        	data.token = $cookies.get("accelerateVegaDeskAdmin");

			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/erpfetchattendancefigures.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              
			              if(response.data.status){

      						    $scope.figure_total_employees = response.data.figure_total_employees;
      						    $scope.figure_total_present = response.data.figure_total_present;
      						    $scope.figure_total_absent = response.data.figure_total_absent;	
      			              
			              }
			         });    
}

$scope.fetchFigures();





    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("accelerateVegaDeskAdmin")){
        $cookies.remove("accelerateVegaDeskAdmin");
        window.location = "adminlogin.html";
      }
    }

     
    $scope.outletCode = localStorage.getItem("branch");

	$scope.resetNewContent = function(){

		$scope.attendancePopup = {};

		  var today = new Date();

          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          today = dd + '-' + mm + '-' + yyyy;


		$scope.attendancePopup.date = today;
		document.getElementById("new_attendance_date").value = today;

		$scope.newContentSaveError = '';
	}

	$scope.resetNewContent();




      //Seater Area
	
		$scope.seatPlan = "";
		$scope.seatPlanError = "";

		
		$scope.initAllStaff = function(){
		
			  $scope.seatPlanError = "";
		
		      var data = {};
		      data.token = $cookies.get("accelerateVegaDeskAdmin");
          data.date = getFormattedDate(document.getElementById("new_attendance_date").value);


		      $http({
		        method  : 'POST',
		        url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeoplewithattendance.php',
		        data    : data,
		        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		       })
		       .then(function(response) {
		         if(response.data.status){
		         	$scope.seatPlanError = '';

					$scope.attendanceData = response.data.response;
		         }
		         else{
		           	$scope.seatPlanError = response.data.error;
		         }
		         $('#attendancePlanModal').modal('show');
		        });
		}
	

		function getFormattedDate(date){
			var temp = date.split('-');
			return temp[2]+''+temp[1]+''+temp[0];
		}



      	$scope.holdList = []; //hold staff

		$scope.showEmployeeSelector = function(){
			$scope.holdList = [];
			$scope.initAllStaff();   
			$scope.displayDate = document.getElementById("new_attendance_date").value;   	
		}

      $scope.getMyClass = function(person){
      	if(person.attendance == 0){
      		return "btn-default";
      	}
      	else if(person.attendance == 1){
      		return "btn-warning";
      	}
      	else if(person.attendance == 2){
      		return "btn-success";
      	}
      	else if(person.attendance == 5){
      		return "btn-danger";
      	}
      }
      
      
      $scope.staffOptions = function(person){

      		//Invert Attendance code
      		if(person.attendance == 0){
      			person.attendance = 2;
      		}
      		else if(person.attendance == 2){
      			person.attendance = 5;
      		}
      		else if(person.attendance == 5){
      			person.attendance = 1;
      		}
      		else if(person.attendance == 1){
      			person.attendance = 0;
      		}	
      }
      

      $scope.confirmAttendance = function(fullData){

		      var data = {};
		      data.token = $cookies.get("accelerateVegaDeskAdmin");
          data.date = getFormattedDate(document.getElementById("new_attendance_date").value);
		      data.info = fullData;

		      $http({
		        method  : 'POST',
		        url     : 'https://accelerateengine.app/food-engine/apis/erpmarkattendance.php',
		        data    : data,
		        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		       })
		       .then(function(response) {
		         if(response.data.status){
		         	$scope.seatPlanError = '';
		         	$('#attendancePlanModal').modal('hide');
		         }
		         else{
		           	$scope.seatPlanError = response.data.error;
		         }
		        });
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
