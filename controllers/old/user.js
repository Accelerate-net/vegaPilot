angular.module('UsersApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


  .controller('userOrdersController', function($scope, $http, $interval, $cookies) {

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

    $scope.isSearched = false;
    $scope.isNotFound = false;
    $scope.isOrdersFound = false;
    $scope.isMoreLeft = true;


    $scope.limiter=0;

    $scope.searchflag = false;
    $scope.searchID = "";

    $scope.isBlocked = false;
    $scope.search = function(id){

      $scope.isSearched = true;

      //Fetch User Details
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.mobile = $scope.searchID;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchusersadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
            if(response.data.status){
              $scope.isNotFound = false;

              //Fetch User details
              $scope.user_details = response.data.response;
              $scope.isBlocked = $scope.user_details.isBlocked;
              $scope.user_contact = $scope.user_details.savedAddresses[0];

              //Fetch Recent Orders
              var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              // data.status = 2;
              data.id = $scope.limiter;
              data.mobile = $scope.searchID;

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/orderhistoryadmin.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                 if(response.data.status){
                    $scope.isOrdersFound = true;
                    $scope.user_orders = response.data.response;
                    $scope.user_orders_length = response.data.count;
                    $scope.user_orders_amount = response.data.volume;

console.log(response)


                    if($scope.user_orders_length == 0){
                      $scope.isOrdersFound = false;
                    }

                    if($scope.user_orders.length%5 != 0){
                      $scope.isMoreLeft = true;
                    }
                 }
                 else{
                   $scope.isOrdersFound = false;
                 }
                });
            }
            else{
              $scope.isNotFound = true;
            }
        });

    }
    
    $scope.openFeedback = function(feed){
    	if(feed.comment != ''){
    		$scope.feedContent = feed;
    		$('#feedbackModal').modal('show');
    	}
    }

    $scope.manageUserBlock = function(userid, status) {
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = status;
      data.user = userid;


      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/setuserblock.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         if(response.data.status){
           if(response.data.isBlocked){
             $scope.isBlocked = true;
           }
           else {
             $scope.isBlocked = false;
           }
         }
        });

    }

    $scope.loadMore = function(){
      $scope.limiter = $scope.limiter + 5;
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = $scope.limiter;
      data.mobile = $scope.searchID;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/orderhistoryadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         if(response.data.status){
            $scope.isMoreLeft = true;
            $scope.user_orders_length = response.data.count;

            $scope.user_orders = $scope.user_orders.concat(response.data.response);
            console.log($scope.user_orders)

            if($scope.user_orders.length%5 != 0){
              $scope.isMoreLeft = false;
            }
         }
         else{
           $scope.isMoreLeft = false;
         }
        });
    }

    $scope.showNext = function(){
    	$scope.prevflag=true;
    	$scope.limiter+=5;
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 2;
      data.id = $scope.limiter;
      data.mobile = id;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/orderhistoryadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
        if($scope.user_orders.length < 5){
            $scope.nextflag=false;
          }
            $scope.user_orders = response.data.response;
      });
    }

    $scope.showPrev = function(){
    	$scope.nextflag=true;
    	$scope.limiter-=5;
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 2;
      data.id = $scope.limiter;
      data.mobile = id;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/orderhistoryadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
        if($scope.limiter==0){
          $scope.prevflag=false;
        }
            $scope.user_orders = response.data.response;
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
