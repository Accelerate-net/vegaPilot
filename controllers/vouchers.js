angular.module('vouchersApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('vouchersController', function($scope, $http, $interval, $cookies) {

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
      $scope.isVouchersFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Vouchers Created Today';
      $scope.isMoreLeft = false;

      //Default Results : Vouchers issued today
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = yyyy+''+mm+''+dd;
      
$scope.initVouchers = function(){

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = 0;
      data.key = today;
      
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchvouchersadmin.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         if(response.data.status){

           $scope.isVouchersFound = true;
           $scope.vouchersList = response.data.response;
           
           	     if($scope.vouchersList.length%10 == 0){
	                  $scope.isMoreLeft = true;
	             }else{
	                  $scope.isMoreLeft = false;
	             }
	             
         }
         else{
           $scope.isVouchersFound = false;
           $scope.resultMessage = "There are no Vouchers created today.";
         }
        });
}
$scope.initVouchers();


      $scope.limiter = 0;
      
      $scope.searchByDate = function(){    
	    $scope.searchID = "";
	    setTimeout(function(){
		    $('#mySearchBox').datetimepicker({  
			    	format: "yyyymmdd",
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
               
        if($scope.searchID != ""){
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/fetchvouchersadmin.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         console.log(response)
	           if(response.data.status){            
	             $scope.filterTitle = response.data.result;
	             
	             $scope.isMoreLeft = false;
	             $scope.isVouchersFound = true;
	             $scope.vouchersList = response.data.response;
	           
	             $scope.filterTitle = response.data.message;
	
	             if($scope.vouchersList.length%10 == 0){
	                  $scope.isMoreLeft = true;
	             }else{
	                  $scope.isMoreLeft = false;
	             }
	           }
	           else{
	             $scope.isVouchersFound = false;
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
          url     : 'https://accelerateengine.app/food-engine/apis/fetchvouchersadmin.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
           if(response.data.status){
             $scope.isVouchersFound = true;
             $scope.vouchersList = $scope.vouchersList.concat(response.data.response);

             if($scope.vouchersList.length%10 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
           	if($scope.limiter == 0){
             		$scope.isVouchersFound = false;
             	}
             	else{
             		$scope.isMoreLeft = false;
             	}
           }
          });
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
            
            
            
       $scope.openVoucherReport = function(){
       		$('#dateModal').modal('show');
       }
       
      $scope.generateReport = function(type){
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
  			window.open ("https://accelerateengine.app/food-engine/apis/fetchvouchersummary.php?access="+temp_token+"&from="+from+"&to="+to);
  			$('#dateModal').modal('hide');
  		}
  	}
  	else{
  		window.open ("https://accelerateengine.app/food-engine/apis/fetchvouchersummary.php?access="+temp_token+"&from=&to=");
  		$('#dateModal').modal('hide');
  	}
      	
      	
      	    function formatDate(date) {
           	//Expecing date in DD-MM-YYYY and returns YYYY-MM-DD
                var res = date.split("-");
                return res[2]+'-'+res[1]+'-'+res[0];
            }                                                  	      	
      }

       
                     
         
         $scope.showCancel = function(id, showMobile, showName){
         
       		$scope.cancelVocuherCode = id;
       		$scope.cancelShowName = showName != ""? showName+" ("+showMobile+")": "Unknown Person";
       	
       		$('#cancelModal').modal('show');
         
         }
         
         $scope.confirmCancel = function(code){
	    	var data = {};
	    	data.id = code;
	        data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/cancelvoucheradmin.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         	$('#cancelModal').modal('hide');
	         	if(response.data.status){	 
	         		$scope.initVouchers();
	              	}
	              	else{
		              	alert(response.data.error);
	              	}
	         });         
         }
         
         
         
     //Add new reservation
     $scope.nullNewVoucher = function(){
     	$scope.newVoucherContent = {};
     	$scope.newVoucherContent.mobile = "";
     	$scope.newVoucherContent.value = 50;
     	$scope.newVoucherContent.minAmount = 0;
     	$scope.newVoucherContent.date = "";
     	$scope.newVoucherContent.code = ""; 
     	
     	$scope.isCustomChecked = false;
     	$scope.isCustomApproved = false;     	
     	$scope.customCheckError = "";    	     	
     }
     $scope.nullNewVoucher();
     
     
     
     $scope.openNewVoucher = function(){
     	$scope.nullNewVoucher();
     	$('#voucherModal').modal('show');
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
	      

	$scope.defaultValidityFlags = function(){
		$scope.isLoading = false;
	     	$scope.isCustomChecked = false;
     		$scope.isCustomApproved = false;     	
     		$scope.customCheckError = "";   
	}
	    
	$scope.checkAvailability = function(){	
					
		if($scope.newVoucherContent.code != ''){
		    	var data = {};
		    	data.code = $scope.newVoucherContent.code;
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        $scope.isLoading = true;
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/customvouchercheck.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	$scope.isCustomChecked = true;
		         	$scope.isLoading = false;
		         	if(response.data.status){	   
		         		$scope.isCustomApproved = true;
		         		$scope.customCheckError = "";
		              	}
		              	else{
			              	$scope.isCustomApproved = false;
			              	$scope.customCheckError = response.data.error;
		              	}
		         }); 
	         } 

	}
	
	$scope.getValidityIcon = function(){
	
		if($scope.newVoucherContent.code == ''){
			return "";
		}
		
		if(!$scope.isCustomChecked){
			return "ti ti-help";
		}
		else{
			if($scope.newVoucherContent.code != '' && $scope.isCustomApproved){
				return "ti ti-check";
			}
			else if($scope.newVoucherContent.code != '' && !$scope.isCustomApproved){
				return "ti ti-close";
			}			
		}	
	
	}
	
	$scope.getValidityStyle = function(){
		var normal = {
			"color" : "#f39c12"
		}	
		
		var green = {
			"color" : "#27ae60"
		}	
		
		var red = {
			"color" : "#e74c3c"
		}
		
		if(!$scope.isCustomChecked){
			return normal;
		}
		else{
			if($scope.newVoucherContent.code != '' && $scope.isCustomApproved){
				return green;
			}
			else if($scope.newVoucherContent.code != '' && !$scope.isCustomApproved){
				return red;
			}			
		}			
	
	}
	

	    
	    
	    
	$scope.saveNewVoucher = function(){
	
		$scope.newVoucherContent.date = document.getElementById("new_date").value;
		
		$scope.newVoucherError = "";
		
		if($scope.newVoucherContent.mobile == "" || !(/^[789]\d{9}$/.test($scope.newVoucherContent.mobile))){
			$scope.newVoucherError = "Invalid Mobile Number";
		}
		else if($scope.newVoucherContent.value == "" || $scope.newVoucherContent.value == 0){
			$scope.newVoucherError = "Invalid Voucher Amount";
		}
		else if($scope.newVoucherContent.date == ""){
			$scope.newVoucherError = "Add an expiry date";
		}
		else if($scope.newVoucherContent.minAmount < 0){
			$scope.newVoucherError = "Set Minimum Amount to 0, if no minimum amount applicable.";
		}
		else{
			$scope.newVoucherError = "";
			
	      		//Processing expiry date
		      	var todayDate = new Date();
		      	var dd = todayDate.getDate();
			var mm = todayDate.getMonth()+1;
			var yyyy = todayDate.getFullYear();
			if(dd<10) {dd = '0'+dd;}
			if(mm<10) {mm = '0'+mm;}
			var mytoday = yyyy+''+mm+''+dd;
			
			var myformattedDate = formatDate($scope.newVoucherContent.date);
			if(myformattedDate < mytoday){
				$scope.newVoucherError = "Add a futuristic expiry date";			
			}
			else{ // No errors, good to go.
				$scope.userName = $scope.newVoucherContent.mobile;				
				$('#voucherModal').modal('hide');
				$('#confirmVoucherModal').modal('show');
			}
			
			function formatDate(date) {
		           	//Expecing date in DD-MM-YYYY and returns YYYYMMDD
		                var res = date.split("-");
		                return res[2]+res[1]+res[0];
		       }	
		       		            		            			
		}
	
	}
	
	
	$scope.confirmVoucher = function(){
			var data = {};
		    	data.details = $scope.newVoucherContent;
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/newvoucheradmin.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	$('#confirmVoucherModal').modal('hide');
		         	if(response.data.status){	   
		         		$scope.initVouchers();
		              	}
		              	else{
			              	alert(response.data.error);
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
