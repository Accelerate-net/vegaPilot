angular.module('guestApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


  .controller('guestController', function($scope, $http, $interval, $cookies) {

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


    
    
    $scope.displayFlag = false;
    $scope.displayUserInfo = "";
    $scope.isBlocked = false;  
    
    
    $scope.searchlimiter = 0;
    $scope.isSearched = false;
    $scope.isSearchNotFound = false;
    $scope.searchflag = false;
    $scope.searchID = "";
    $scope.resultList = "";
    $scope.filterTitle = "Recently Visited Guests";
    $scope.isMoreSearchLeft = true;


    
    $scope.visitlimiter = 0;
    $scope.visitList = "";
    $scope.isVisitsFound = false;
    $scope.isMoreVisitsLeft = true;
    
    
    $scope.fetchVisits = function(userKey){    
	     
	      var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.id = $scope.visitlimiter;
              data.mobile = userKey;

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/deskfetchuserhistory.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                 if(response.data.status){
                    $scope.isVisitsFound = true;
                    
                    $scope.visitList = response.data.response;		                    

                    if($scope.visitList.length%5 == 0){
                      	$scope.isMoreVisitsLeft = true;
                    }
                    else{
                    	$scope.isMoreVisitsLeft = false;
                    }
                    
                    /* Analytics */
                    if(response.data.analyticsAvailable){
                    	$scope.totalVisits = response.data.totalVisits;
                    	$scope.totalPoints = response.data.totalRewards;
                    	$scope.totalAmount = response.data.totalAmount;
                    }
                 }
                 else{
                   $scope.isVisitsFound = false;
                 }
                });        
    }
    
    $scope.search = function(id){

      $scope.isSearched = true;

      //Fetch User Details
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.key = $scope.searchID;
      data.id = $scope.searchlimiter;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchuser.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
            if(response.data.status){
              $scope.isSearchNotFound = false;
              $scope.filterTitle = response.data.message;
              
              //Show info directly if only one result found
              if(response.data.count == 1){
              	$scope.displayFlag = true;
              	$scope.displayUserInfo = response.data.response[0];
              	$scope.fetchVisits($scope.displayUserInfo.mobile);
              	$scope.isMoreSearchLeft = false;
              	
              }
              else{
              	$scope.displayFlag = false;
              	$scope.resultList = response.data.response;
              	
              	console.log($scope.resultList)
              	
              	if($scope.resultList.length%5 == 0){
              		$scope.isMoreSearchLeft = true;
              	}
              	else{
              		$scope.isMoreSearchLeft = false;
              	}
              	
              }

            }
            else{
              $scope.isMoreSearchLeft = false;
              $scope.isSearchNotFound = true;
              $scope.filterTitle = "No Results Found";
            }
        });

    }
    
    $scope.displayUser = function(userObj){
    	$scope.displayFlag = true;
    	$scope.displayUserInfo = userObj;    
    	$scope.fetchVisits($scope.displayUserInfo.mobile);	
    }
    
    $scope.resetDisplay = function(){
    	$scope.displayFlag = !$scope.displayFlag;
    }

    $scope.manageUserBlock = function(userid, status) {
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = status;
      data.user = userid;


      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/desksetuserblock.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         if(response.data.status){
           if(response.data.isBlocked){
             $scope.isBlocked = true;
             $scope.displayUserInfo.isBlocked = true;
           }
           else {
             $scope.isBlocked = false;
             $scope.displayUserInfo.isBlocked = false;
           }
         }
        });

    }



    $scope.loadMoreSearch = function(){
    
      $scope.searchlimiter = $scope.searchlimiter + 5;
      
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = $scope.searchlimiter;
      data.key = $scope.searchID;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchuser.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         if(response.data.status){

            $scope.resultList = $scope.resultList.concat(response.data.response);

            if($scope.resultList.length%5 == 0){
              $scope.isMoreSearchLeft = true;
            }
            else{
              $scope.isMoreSearchLeft = false;
            }
         }
         else{
           $scope.isMoreSearchLeft = false;
         }
        });
    }
  

    $scope.loadMoreVisits = function(userKey){
    
      	      $scope.visitlimiter = $scope.visitlimiter + 5;
      
	      var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.id = $scope.visitlimiter;
              data.mobile = userKey;

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/deskfetchuserhistory.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                 if(response.data.status){
                    
                    $scope.visitList = $scope.visitList.concat(response.data.response);	                    

                    if($scope.visitList.length%5 != 0){
                      	$scope.isMoreVisitsLeft = true;
                    }
                    else{
                    	$scope.isMoreVisitsLeft = false;
                    }
                 }
                 else{
                   $scope.isMoreVisitsLeft = false;
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
