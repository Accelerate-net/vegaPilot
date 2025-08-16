angular.module('StaffApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


  .controller('StaffController', function($scope, $http, $interval, $cookies) {

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
      var temp_branch = localStorage.getItem("branchCode");

      $scope.initAgents = function(){
	      $http.get("https://accelerateengine.app/food-engine/apis/fetchroles.php?branch="+temp_branch+"&role=AGENT").then(function(response) {
	          $scope.delivery_agent = response.data.results;
	      });
      }
      
      $scope.initAgents();
	
      $scope.errorflag =  false;
      $scope.agentcode = '';
      $scope.agentname = '';
      $scope.addAgent = function(){
        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.code = $scope.agentcode ;
        data.name = $scope.agentname ;
        data.role = document.getElementById("agenttype").value;
        if(data.code == "" || data.name == "" || !isValidPhone(data.code)){
          $scope.errorflag = true;
        }
        else{
          $scope.errorflag = false;
          $http({
            method  : 'POST',
            url     : 'https://accelerateengine.app/food-engine/apis/addagent.php',
            data    : data,
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
           })
           .then(function(response) {
              $scope.initAgents();
            });
        }
      }
      
      $scope.askForDelete = function(con){
      	$scope.askContent = con;
      	$('#confirmationModal').modal('show');
      }

      function isValidPhone(phoneno){
        var pattern = /^[6789]\d{9}$/;
        if(pattern.test(phoneno)){
          return true;
        }
        return false;
      }

      $scope.removeAgent = function(code, role){
        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.code = code;
        data.role = role;
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/removeagent.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
          $('#confirmationModal').modal('hide');
          $scope.initAgents();
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
