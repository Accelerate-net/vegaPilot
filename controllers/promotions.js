angular.module('promotionsApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('promotionsController', function($scope, $http, $interval, $cookies) {

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
      
      
      
      
          	//Date Picker Initializers
          	
		    $('#reportFromDate').datetimepicker({  
			    	format: "dd-mm-yyyy",
			    	weekStart: 1,
		        	todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
		    })  
		    $('#reportToDate').datetimepicker({  
			    	format: "dd-mm-yyyy",
			    	weekStart: 1,
		        	todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
		    })  
		    
	//Default Date Values	  
	var todaySetDate =  toDayFormatted();
	document.getElementById("reportFromDate").value = todaySetDate;
	document.getElementById("reportToDate").value = todaySetDate;

	    function toDayFormatted() {
                var d = new Date(),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                return [day, month, year].join('-');
            }
            
		    
      
      $scope.isMoreLeft = true;
      $scope.initializeActiveCoupons = function(){
      	//Fetch Active Coupons
      	var co_data = {};
      	co_data.id = 0;
        co_data.token = $cookies.get("acceleronLunaAdminToken");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/fetchcouponsadmin.php',
          data    : co_data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
         		$scope.active_coupons = response.data.response;
         		
         		$scope.coupon_analytics_used = response.data.analytics_used;
         		$scope.coupon_analytics_expired = response.data.analytics_expired; 
         		$scope.coupon_analytics_active = response.data.analytics_active;

	             if($scope.active_coupons.length%10 == 0){
	                  $scope.isMoreLeft = true;
	             }else{
	                  $scope.isMoreLeft = false;
	             }
	             
	             if($scope.coupon_analytics_active == 0){
	             	$scope.isMoreLeft = false;
	             }
	             
         	}
         	else{
         		$scope.isMoreLeft = false;
         	}
         	
         	        $scope.coupon_analytics_used = response.data.analytics_used ? response.data.analytics_used : 0;
         		$scope.coupon_analytics_expired = response.data.analytics_expired ? response.data.analytics_expired: 0; 
         		$scope.coupon_analytics_active = response.data.analytics_active ? response.data.analytics_active: 0;
         		
         });
       }
       $scope.initializeActiveCoupons();
       
       $scope.limiter = 0;
       
      //Load More Orders
      $scope.loadMore = function(){
      console.log('Loading')
        $scope.limiter = $scope.limiter + 10;
        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.id = $scope.limiter;

        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/fetchcouponsadmin.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         console.log(response);
           if(response.data.status){           
             $scope.active_coupons = $scope.active_coupons.concat(response.data.response);

             if($scope.active_coupons.length%10 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
           	if($scope.limiter == 0){
             		$scope.isOrdersFound = false;
             	}
             	else{
             		$scope.isMoreLeft = false;
             	}
           }
          });
      }
             

    
      //New Coupon Wizard
      $scope.newCouponWindowFlag = false;
      $scope.editCouponWindowFlag = false;
      $scope.saveError = "";
      

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
	          

      
      $scope.newCoupon = {};
      $scope.newCoupon.code = "";
      $scope.newCoupon.brief = "Get 10% off (maximum discount Rs. 50) on  when you order for a minimum cart value of Rs. 350";
      $scope.newCoupon.limit = 0;
      $scope.newCoupon.expiry = new Date();
      $scope.newCoupon.rule = "PERCENTAGE";
      
      //For Rule - PERCENTAAGE
      $scope.newCoupon.percentageP = 0;
      $scope.newCoupon.percentageD = 0;
      $scope.newCoupon.percentageM = 0;            
      
      $scope.showNewCouponWindow = function(){
      	$scope.newCouponWindowFlag = true;
      	$scope.editCouponWindowFlag = false;
      	
              //Reset Values
      	      $scope.newCoupon.code = "";
	      $scope.newCoupon.brief = "";
	      $scope.newCoupon.limit = 0;
	      $scope.newCoupon.expiry = new Date();
	      $scope.newCoupon.rule = "PERCENTAGE";
	      
	      //For Rule - PERCENTAAGE
	      $scope.newCoupon.percentageP = 0;
	      $scope.newCoupon.percentageD = 0;
	      $scope.newCoupon.percentageM = 0;  
	      
	      document.getElementById("tokenfield-typeahead").value = "";
      }
      
      $scope.selectRule = function(){
      console.log('Selecting Rule' + $scope.newCoupon.rule);
      }
      
      $scope.saveNewCoupon = function(){
      
      	$scope.saveError = "";
      	
      	$scope.newCoupon.expiry = document.getElementById("new_date").value;      
      	
      	//For Rule - PERCENTAGE
      	if($scope.newCoupon.rule == "PERCENTAGE"){	      	
	      
	      	if($scope.newCoupon.code == ""){
	      		$scope.saveError = "Coupon Code can not be null";
	      	}      
	      	else if(!(/^[0-9a-zA-Z]+$/.test($scope.newCoupon.code))){
	      		$scope.saveError = "Coupon Code can have only numbers or letters";
	      	}
	      	else if($scope.newCoupon.brief == ""){
	      		$scope.saveError = "Add a short description for the coupon";
	      	}
	      	else if($scope.newCoupon.limit < 1 ||  $scope.newCoupon.limit == ""){
	      		$scope.saveError = "Add usage limit for the coupon";
	      	}
	      	else if($scope.newCoupon.expiry == ""){
	      		$scope.saveError = "Add an expiry date";
	      	}
	      	else if($scope.newCoupon.percentageP < 1 || $scope.newCoupon.percentageP > 100){
	      		$scope.saveError = "Ensure Percentage value is correct. It must be in 1 to 100 range";
	      	}
	      	else if($scope.newCoupon.percentageM < 1 || $scope.newCoupon.percentageD < 1){
	      		$scope.saveError = "Ensure M, D values are correct. It can not be 0.";
	      	}

	      	
	      	
	      	if($scope.saveError != ""){
	      		
	      	}
	      	else{
	      	
	      		//Processing expiry date
		      	var todayDate = new Date();
		      	var dd = todayDate.getDate();
			var mm = todayDate.getMonth()+1;
			var yyyy = todayDate.getFullYear();
			if(dd<10) {dd = '0'+dd;}
			if(mm<10) {mm = '0'+mm;}
			var mytoday = yyyy+mm+dd;
			
			if(formatDate($scope.newCoupon.expiry) < mytoday){
				$scope.saveError = "Add a futuristic expiry date";			
			}
			else{ // No errors, good to go.
				$scope.newCoupon.expiryDate = $scope.newCoupon.expiry;
				$('#confirmationModal').modal('show');
			}
			
			    function formatDate(date) {
		           	//Expecing date in DD-MM-YYYY and returns YYYYMMDD
		                var res = date.split("-");
		                return res[2]+res[1]+res[0];
		            }		            						
	      	
	      	}
	}
      	//Add more rules here in future ...
     
      }
      
      //Final Save
      $scope.createCoupon = function(){
      
      	var outList = document.getElementById("tokenfield-typeahead").value;
      
      	var data = {};
      	data.token = $cookies.get("acceleronLunaAdminToken");
      	data.code = $scope.newCoupon.code;
      	data.brief = $scope.newCoupon.brief;      	
      	data.limit = $scope.newCoupon.limit;
      	data.expiry = $scope.newCoupon.expiryDate;
      	data.rule = $scope.newCoupon.rule; 
        data.percentageP = $scope.newCoupon.percentageP;    
      	data.percentageD = $scope.newCoupon.percentageD;
      	data.percentageM = $scope.newCoupon.percentageM;
      	data.list = outList;           	
      	
      	var myurl = "";
      	if(!$scope.editCouponWindowFlag && $scope.newCouponWindowFlag){
      		myurl = "https://accelerateengine.app/food-engine/apis/createcoupon.php";      	
      	}
      	else if($scope.editCouponWindowFlag && !$scope.newCouponWindowFlag){
      		data.permanentCode = $scope.viewingCode;
      		myurl = "https://accelerateengine.app/food-engine/apis/editcoupon.php";
      	}

        $http({
          method  : 'POST',
          url     : myurl,
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
              if(response.data.status){
              	$('#confirmationModal').modal('hide');
              	      $scope.newCoupon.code = "";
		      $scope.newCoupon.brief = "";
		      $scope.newCoupon.limit = 0;
		      $scope.newCoupon.expiry = "";
		      $scope.newCoupon.rule = "PERCENTAGE";
		      
		      //For Rule - PERCENTAAGE
		      $scope.newCoupon.percentageP = 0;
		      $scope.newCoupon.percentageD = 0;
		      $scope.newCoupon.percentageM = 0; 
		  
		      $scope.newCouponWindowFlag = false;
		      $scope.editCouponWindowFlag = false;
		      
		      $scope.initializeActiveCoupons();
              }
              else{
              	$('#confirmationModal').modal('hide');
              	$scope.saveError = response.data.error;
              }
         });
      }
      
      $scope.hideCouponWindow = function(){
      		$scope.newCouponWindowFlag = false;
		$scope.editCouponWindowFlag = false;
      }
      
      //View and Edit Coupon
      $scope.viewCoupon = function(requestCode){
      	$scope.newCouponWindowFlag = false;
	$scope.editCouponWindowFlag = false;
	
	$scope.viewingCode = requestCode;
	
	var data = {};
      	data.token = $cookies.get("acceleronLunaAdminToken");
      	data.singleid = requestCode;      	     	    

        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/fetchcouponsadmin.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
         	
         	console.log(response.data.response)
         		$scope.editCouponWindowFlag = true;
         		
         		var temp_date = (response.data.response.expiry).split("-");
         		var my_date = new Date(temp_date[2], temp_date[1] - 1, temp_date[0]);
         		
         		$scope.myCreatedDate = response.data.response.created;
         		
         		$scope.newCoupon.code = response.data.response.code;
      			$scope.newCoupon.brief = response.data.response.brief;
		      	$scope.newCoupon.limit = response.data.response.limit;
		      	$scope.newCoupon.expiry = my_date;
		      	$scope.newCoupon.rule = response.data.response.rule;
      
      			//For Rule - PERCENTAAGE
      			$scope.newCoupon.percentageP = response.data.response.percentageP;
      			$scope.newCoupon.percentageD = response.data.response.percentageD;
      			$scope.newCoupon.percentageM = response.data.response.percentageM;
      			
      			document.getElementById("tokenfield-typeahead").value = response.data.response.list;
         	}
         	else{
         		alert('There was some error while fetching the coupon details.');
         	}              
         });                 
		     		      
      }
      
      //Deactivate Coupon
      $scope.deactivateCoupon = function(requestCode){   	
	
	var data = {};
      	data.token = $cookies.get("acceleronLunaAdminToken");
      	data.singleid = requestCode; 	     	    

        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/deactivatecoupon.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
         
         	      $scope.newCoupon.code = "";
		      $scope.newCoupon.brief = "";
		      $scope.newCoupon.limit = 0;
		      $scope.newCoupon.expiry = new Date();
		      $scope.newCoupon.rule = "PERCENTAGE";
		      
		      //For Rule - PERCENTAAGE
		      $scope.newCoupon.percentageP = 0;
		      $scope.newCoupon.percentageD = 0;
		      $scope.newCoupon.percentageM = 0; 
		      document.getElementById("tokenfield-typeahead").value = "";
		  
		      $scope.newCouponWindowFlag = false;
		      $scope.editCouponWindowFlag = false;
		      
		      $scope.initializeActiveCoupons();
		      $scope.limiter = 0;
      		
         	}
         	else{
         		$scope.saveError = response.data.error;
         	}              
         });                 
		     		      
      }
      
      
      //Report generations
      $scope.viewReport = function(mode, code){
      	  
      	  //Set todays Date
          $scope.contentToDate = new Date();
          $scope.contentFromDate= new Date();
          
      	$scope.contentMode = mode;
      	$scope.contentCode = code;
      	$('#dateModal').modal('show');
      }
      
      $scope.generateReport = function(mode, uid, type){
      	var from = ''; 
      	var to = '';
      	var temp_token = encodeURIComponent($cookies.get("acceleronLunaAdminToken"));
      	
  	if(type == 'RANGE'){
  		if(document.getElementById("reportFromDate").value == '' || document.getElementById("reportToDate").value == ''){
  			alert('Please specify the date FROM and date TO');
  		}
  		else{  		
  			from = formatDate(document.getElementById("reportFromDate").value);
  			to = formatDate(document.getElementById("reportToDate").value);
  			window.open ("https://accelerateengine.app/food-engine/apis/fetchcouponsummary.php?access="+temp_token+"&uid="+uid+"&mode="+mode+"&from="+from+"&to="+to);
  			$('#dateModal').modal('hide');
  		}
  	}
  	else{
  		window.open ("https://accelerateengine.app/food-engine/apis/fetchcouponsummary.php?access="+temp_token+"&uid="+uid+"&mode="+mode+"&from=&to=");
  		$('#dateModal').modal('hide');
  	}
      	
      	
      	    function formatDate(date) {
           	//Expecing date in DD-MM-YYYY and returns YYYY-MM-DD
                var res = date.split("-");
                return res[2]+'-'+res[1]+'-'+res[0];
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
