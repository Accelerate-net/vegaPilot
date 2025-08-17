angular.module('RedeemApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('redeemController', function($scope, $http, $interval, $cookies) {

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
    
    $scope.isSearched = false;
    $scope.isNotFound = false;
    $scope.isOrdersFound = false;
    $scope.isMoreLeft = true;


    $scope.limiter = 0;

    $scope.searchflag = false;
    $scope.searchID = "";
    
    $scope.redeemClicked = false;
    $scope.coupon = {};
    $scope.coupon.k_Amount = "";
    $scope.coupon.k_Discount = "";
    $scope.displayCoupon = "";

    $scope.isBlocked = false;
    $scope.search = function(id){
    
    $scope.redeemClicked = false;
    $scope.displayCoupon = "";

      $scope.isSearched = true;

      //Fetch Coupon Details
      
      $scope.warningMsg = "";
      
      var data = {};
      data.token = $cookies.get("accelerateVegaDeskAdmin");
      data.coupon = $scope.searchID;

      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/getadmincoupon.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {

            if(response.data.status){         
              $scope.warningMsg = "";
              $scope.isNotFound = false;

              $scope.info = response.data.response;
              $scope.displayCoupon = $scope.info.coupon;
              
            }
            else{
              $scope.warningMsg = response.data.error;
              $scope.isNotFound = true;
            }
        });

    }
    
    $scope.redeemNow = function(){
    	$scope.redeemClicked = true;
    }
    
    $scope.redeemFlag = false;
    $scope.confirmCoupon = function(){
    
    	     $scope.redeemFlag = false;
    
	    var data = {};
	    data.token = $cookies.get("accelerateVegaDeskAdmin");
	    data.coupon = $scope.displayCoupon;
	    data.amount = $scope.coupon.k_Amount;
	    data.discount = $scope.coupon.k_Discount;    
	    
	    $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/redeemcoupon.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	            if(response.data.status){  	                     
	              $scope.message = response.data.message;
	              $scope.redeemClicked = false;
	              $scope.isSearched = false;
	              alert('Successfully Redeemed!');           	             
	            }
	            else{
	              $scope.message = "Something went wrong. Try again.";
	              alert('Error. Could not validate.');    
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


