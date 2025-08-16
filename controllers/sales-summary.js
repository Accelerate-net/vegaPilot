angular.module('SalesSummaryApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])

  .controller('SalesSummaryController', function($scope, $http, $interval, $cookies) {

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
		    $('#quickFromDate').datetimepicker({  
			    	format: "dd-mm-yyyy",
			    	weekStart: 1,
		        	todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
		    })  
		    $('#quickToDate').datetimepicker({  
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
	document.getElementById("quickFromDate").value = todaySetDate;
	document.getElementById("quickToDate").value = todaySetDate;			
	
	    function toDayFormatted() {
                var d = new Date(),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                return [day, month, year].join('-');
            }
            	    		    		    		    
		        


        $scope.outletCode = localStorage.getItem("branch");
        
       	$scope.isSalesFound = false;
       	


	$scope.fetchFlag = false;
	$scope.isWaitingResponse = false;
	$scope.callSales = function(){
		
		if(document.getElementById("quickFromDate").value == ''){
			alert('Add From date');
		}
		else if(document.getElementById("quickToDate").value == ''){
			alert('Add To date');
		}
		else{		
			$scope.isWaitingResponse = true;
		        var data = {};
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        data.fromDate = formatDate(document.getElementById("quickFromDate").value);
		        data.toDate = formatDate(document.getElementById("quickToDate").value);		        
		        data.outlet = localStorage.getItem("branchCode");

		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/dailysales.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
			  $scope.isWaitingResponse = false;
			  
		         	if(response.data.status){
		         		$scope.fetchFlag = true;
		         		
			          	$scope.cod_sum_delivery = response.data.response.cod_sum_delivery;
			          	$scope.cod_sum_takeaway = response.data.response.cod_sum_takeaway;	          
					$scope.cod_count_delivery = response.data.response.cod_count_delivery;
			          	$scope.cod_count_takeaway = response.data.response.cod_count_takeaway;	
			          	
			          	$scope.pre_sum_delivery = response.data.response.pre_sum_delivery;
			          	$scope.pre_sum_takeaway = response.data.response.pre_sum_takeaway;	          
					$scope.pre_count_delivery = response.data.response.pre_count_delivery;
			          	$scope.pre_count_takeaway = response.data.response.pre_count_takeaway;	
			          	
			        }
			        else{
			        	$scope.fetchFlag = false;
			        }          	      					        
		         });
	         }
	         
	         
	         //Formate date to server requiring format
	         function formatDate(date) {
	           	//Expecing date in DD-MM-YYYY and returns YYYY-MM-DD
	                var res = date.split("-");
	                return res[2]+'-'+res[1]+'-'+res[0];
            	 }	    
	}

	$scope.callSales();
	

          $scope.generateReport = function (mode){
	    
            var temp_from = formatDate(document.getElementById("reportFromDate").value);
            var temp_to = formatDate(document.getElementById("reportToDate").value);
            var temp_token = encodeURIComponent($cookies.get("acceleronLunaAdminToken"));
            
            /* OLD Function
            function formatDate(date) {
                var d = new Date(date),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                return [year, month, day].join('-');
            }
            */
            
           function formatDate(date) {
           	//Expecing date in DD-MM-YYYY and returns YYYY-MM-DD
                var res = date.split("-");
                return res[2]+'-'+res[1]+'-'+res[0];
            }
            
            
	    if(mode == 'SALES'){
            	window.open ("https://accelerateengine.app/food-engine/apis/fetchledger.php?access="+temp_token+"&from="+temp_from+"&to="+temp_to);
            }
            else if(mode == 'DISCOUNTS'){
            	window.open ("https://accelerateengine.app/food-engine/apis/fetchledgerdiscounts.php?access="+temp_token+"&from="+temp_from+"&to="+temp_to);
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
