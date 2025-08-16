angular.module('OrdersApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('failedOrdersController', function($scope, $http, $interval, $cookies) {

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

      //Delivery Delay Warning
      $scope.isDeliveryDelayed = false;

      //Outlet Open/Close status
      $scope.isOutletClosed = false;
      $http.get("https://accelerateengine.app/food-engine/apis/getoutletstatus.php?outlet="+localStorage.getItem("branchCode")).then(function(data) {
          var temp = JSON.parse(data);
          if(temp.status){
            $scope.isOutletClosed = false;
          }
          else{
            $scope.isOutletClosed = true;
          }
      });

      //Search or Order View?
      $scope.isViewingOrder = false;

      //Type of Search
      $scope.searchDate = false;
      $scope.searchMobile = false;
      $scope.searchOrder = false;

      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isOrdersFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Today\'s Failed Orders';
      $scope.isMoreLeft = true;

      //Default Results : Failed Orders of the Day
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+''+mm+''+yyyy;

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 2;
      data.key = today;
      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/failedorders.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
         if(response.data.status){
           $scope.isMoreLeft = false; //Showing all orders anyways.
           $scope.isOrdersFound = true;
           $scope.completed_orders = response.data.response;
         }
         else{
           $scope.isOrdersFound = false;
           $scope.resultMessage = "There are no Failed Orders today!";
         }
        });


      $scope.searchByDate = function(){    
	    $scope.searchID = "";
	    setTimeout(function(){
		    $('#mySearchBox').datetimepicker({  
			    	format: "ddmmyyyy",
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
      
      
      


      $scope.limiter = 0;

      $scope.search = function() {
        //Switch to list view in case not
        $scope.isViewingOrder = false;


        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.key = $scope.searchID;
        data.id = 0;
	$('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/failedorders.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
           if(response.data.status){
             $scope.isOrdersFound = true;
             $scope.completed_orders = response.data.response;
             $scope.filterTitle = response.data.result;

             if($scope.completed_orders.length%5 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
             $scope.isOrdersFound = false;
             $scope.filterTitle = "No Results";
             $scope.resultMessage = "There are no matching results.";
           }
          });
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
          url     : 'https://accelerateengine.app/food-engine/apis/failedorders.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         console.log(response);
           if(response.data.status){
             $scope.isOrdersFound = true;
             $scope.completed_orders = $scope.completed_orders.concat(response.data.response);
             $scope.filterTitle = response.data.result;

             if($scope.completed_orders.length%10 == 0){
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

      //To display order details
      $scope.displayOrder = function(order){
        $scope.displayOrderID = order.orderID;
        $scope.displayOrderContent = order;
        $scope.user_contact = order.address;
        $scope.displayOrderType = order.isTakeaway;

        $scope.isViewingOrder = true;
      }

      $scope.cancelDisplay = function(){
        $scope.isViewingOrder = false;
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
  
  


  .controller('completedOrdersController', function($scope, $http, $interval, $cookies) {

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


      //Outlet Open/Close status
      $scope.isOutletClosed = false;
      $http.get("https://accelerateengine.app/food-engine/apis/getoutletstatus.php?outlet="+localStorage.getItem("branchCode")).then(function(data) {
          var temp = JSON.parse(data);
          if(temp.status){
            $scope.isOutletClosed = false;
          }
          else{
            $scope.isOutletClosed = true;
          }
      });

      //Search or Order View?
      $scope.isViewingOrder = false;

      //Type of Search
      $scope.searchDate = false;
      $scope.searchMobile = false;
      $scope.searchOrder = false;

      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isOrdersFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Today\'s Completed Orders';
      $scope.isMoreLeft = true;

      //Default Results : Completed Orders of the Day
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+''+mm+''+yyyy;

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 2;
      data.key = today;
      

      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/filterorders.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
	 $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
         if(response.data.status){
           $scope.isMoreLeft = false; //Showing all orders anyways.
           $scope.isOrdersFound = true;
           $scope.completed_orders = response.data.response;
         }
         else{
           $scope.isOrdersFound = false;
           $scope.resultMessage = "There are no Completed Orders today!";
         }
        });

      $scope.searchByDate = function(){    
	    $scope.searchID = "";
	    setTimeout(function(){
		    $('#mySearchBox').datetimepicker({  
			    	format: "ddmmyyyy",
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
      


      $scope.limiter = 0;

      $scope.search = function() {
        //Switch to list view in case not
        $scope.isViewingOrder = false;


        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.key = $scope.searchID;
        data.id = 0;
        $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/filterorders.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
           $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
           if(response.data.status){
             $scope.isOrdersFound = true;
             $scope.completed_orders = response.data.response;
             $scope.filterTitle = response.data.result;

             if($scope.completed_orders.length%5 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
             $scope.isOrdersFound = false;
             $scope.filterTitle = "No Results";
             $scope.resultMessage = "There are no matching results.";
           }
          });
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
          url     : 'https://accelerateengine.app/food-engine/apis/filterorders.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
           if(response.data.status){
             $scope.isOrdersFound = true;
             $scope.completed_orders = $scope.completed_orders.concat(response.data.response);
             $scope.filterTitle = response.data.result;

             if($scope.completed_orders.length%5 == 0){
                  $scope.isMoreLeft = true;
             }else{
                  $scope.isMoreLeft = false;
             }
           }
           else{
             $scope.isOrdersFound = false;
           }
          });
      }

      //To display order details
      $scope.displayOrder = function(order){
      	
      	console.log(order.orderID)
      
        $scope.displayOrderID = order.orderID;
        $scope.displayOrderContent = order;
        $scope.user_contact = order.address;
        $scope.displayOrderType = order.isTakeaway;

        $scope.isViewingOrder = true;
      }

      $scope.cancelDisplay = function(){
        $scope.isViewingOrder = false;
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

  .controller('ordersController', function($scope, $http, $interval, $cookies) {
  
  $('#headerLoading').show(); $("body").css("cursor", "progress");

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
    var temp_outlet = localStorage.getItem("branchCode");



    //Outlet Open/Close status
    $scope.isOutletClosed = false;
    $http.get("https://accelerateengine.app/food-engine/apis/getoutletstatus.php?outlet="+temp_outlet)
    .then(function(response) {
       	$scope.isOutletClosed = !response.data.status;
	$scope.isDeliveryDelayed = response.data.isDelay;
    });

    $scope.triggerOutlet = function(close_reason) {
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.reason = close_reason;
      console.log(data)
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/setoutletstatus.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
      })
      .then(function(response) {
        if(response.data.status){
          $('#closeOutlet').modal('hide');
          if(response.data.isOpen){
            $scope.isOutletClosed = false;
          }
          else{
            $scope.isOutletClosed = true;
          }
        }
      });
    }
    
    $scope.setDelay = function(delay_reason) {
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.reason = delay_reason;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/setoutletdelay.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
      })
      .then(function(response) {
        if(response.data.status){
          $('#delayedDelivery').modal('hide');
          if(response.data.isDelay){
            $scope.isDeliveryDelayed = true;
          }
          else{
            $scope.isDeliveryDelayed = false;
          }
        }
      });
    }
    


    //Pending Flags
    $scope.moreflag_p=true;
    $scope.limiter_p=0;

    //Confirmed Flags
    $scope.moreflag_c=true;
    $scope.limiter_c=0;

    //Show only when "dispatch order" is clicked.
    $scope.showDeliveryAgents = false;

    //Default styling
    document.getElementById("confirmedTab").style.display="none";
    $scope.isPendingDisplayed = true;

    document.getElementById("pendingTitle").style.color = "#FFF";
    document.getElementById("pendingIcon").style.color = "#FFF";
    document.getElementById("pendingTag").style.color = "#FFF";
    document.getElementById("pendingCount").style.color = "#FFF";
    document.getElementById("pendingTabButton").style.background="#f39c12";

    document.getElementById("confirmedTitle").style.color = "#ABB2B9";
    document.getElementById("confirmedIcon").style.color = "#ABB2B9";
    document.getElementById("confirmedTag").style.color = "#ABB2B9";
    document.getElementById("confirmedCount").style.color = "#ABB2B9";
    document.getElementById("confirmedTabButton").style.background="#F1F1F1";


    $scope.showConfirmed = function(){
      $scope.showDeliveryAgents = false; // Hide choose agent option

      document.getElementById("confirmedTitle").style.color = "#FFF";
      document.getElementById("confirmedIcon").style.color = "#FFF";
      document.getElementById("confirmedTag").style.color = "#FFF";
      document.getElementById("confirmedCount").style.color = "#FFF";
      document.getElementById("confirmedTabButton").style.background="#27ae60";

      document.getElementById("pendingTitle").style.color = "#ABB2B9";
      document.getElementById("pendingIcon").style.color = "#ABB2B9";
      document.getElementById("pendingTag").style.color = "#ABB2B9";
      document.getElementById("pendingCount").style.color = "#ABB2B9";
      document.getElementById("pendingTabButton").style.background="#F1F1F1";

      document.getElementById("pendingTab").style.display="none";
      document.getElementById("confirmedTab").style.display="block";

      $scope.isPendingDisplayed = false;
      $scope.initializePendingOrders();
      if($scope.confirmed_orders.length < 1){
        $scope.displayOrderID = "";
        $scope.displayOrderContent = "";
      }

    }


    $scope.showPending = function(){
      console.log('show pending_orders')
      $scope.showDeliveryAgents = false; // Hide choose agent option

      document.getElementById("pendingTitle").style.color = "#FFF";
      document.getElementById("pendingIcon").style.color = "#FFF";
      document.getElementById("pendingTag").style.color = "#FFF";
      document.getElementById("pendingCount").style.color = "#FFF";
      document.getElementById("pendingTabButton").style.background="#f39c12";

      document.getElementById("confirmedTitle").style.color = "#ABB2B9";
      document.getElementById("confirmedIcon").style.color = "#ABB2B9";
      document.getElementById("confirmedTag").style.color = "#ABB2B9";
      document.getElementById("confirmedCount").style.color = "#ABB2B9";
      document.getElementById("confirmedTabButton").style.background="#F1F1F1";

      document.getElementById("pendingTab").style.display="block";
      document.getElementById("confirmedTab").style.display="none";

      $scope.isPendingDisplayed = true;
      $scope.initializePendingOrders();
      if($scope.pending_orders.length < 1)
        $scope.displayOrderID = "";
    }



    $scope.initializePendingOrders = function(){

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 0;
      // data.id = 0;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchorders.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
            $scope.pending_orders = response.data.response;
            $scope.pending_orders_length = response.data.count;
            //console.log($scope.pending_orders.length);
            //console.log($scope.pending_orders);
            //Default ORDER to display:
            if($scope.isPendingDisplayed){
              console.log('******************DEFAULT ID'+$scope.pending_orders[0].orderID);
              $scope.displayOrderID = $scope.pending_orders[0].orderID;
              $scope.displayOrderContent = $scope.pending_orders[0];
              console.log($scope.displayOrderContent)
            }

          });


      //Initialising Confimred

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 1;
      // data.id = 0;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchorders.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
      })
      .then(function(response) {
      console.log('fetching confirmed orders')
      console.log(response)
      
      if(response.data.error != ''){
               	var x = document.getElementById("infobar")
		x.innerHTML = "Error: "+response.data.error;
		x.className = "show";
		setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);          
      }
      
      
          $scope.confirmed_orders = response.data.response;
          $scope.confirmed_orders_length = response.data.count;

          if(!$scope.isPendingDisplayed){
            $scope.displayOrderID = $scope.confirmed_orders[0].orderID;
            $scope.displayOrderContent = $scope.confirmed_orders[0];
          }
      });

    }

    $scope.refreshPendingOrders = function(){
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 0;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/fetchorders.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
            $scope.pending_orders = response.data.response;

			$scope.pending_orders_length = response.data.count;

            //Default ORDER to display:
            /*
            if($scope.isPendingDisplayed){
              $scope.displayOrderID = $scope.pending_orders[0].orderID;
              $scope.displayOrderContent = $scope.pending_orders[0];
            }
            */

          });


    }
    
    

    $scope.showOrder = function(orderid, isTakeaway){
      $scope.showDeliveryAgents = false; // Hide choose agent option
      $scope.displayOrderType = isTakeaway;
      $scope.displayOrderID = orderid;

      var i = 0;
      //Find matching order
      if($scope.isPendingDisplayed){
        while(i < $scope.pending_orders.length){
            if($scope.displayOrderID == $scope.pending_orders[i].orderID){
              $scope.displayOrderContent = $scope.pending_orders[i];
              break;
            }
            i++;
        }
      }
      else{
        while(i < $scope.confirmed_orders.length){
            if($scope.displayOrderID == $scope.confirmed_orders[i].orderID){
              $scope.displayOrderContent = $scope.confirmed_orders[i];
              break;
            }
            i++;
        }
      }
      console.log($scope.displayOrderContent)
    }


    $scope.confirmOrder = function(orderid){
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = orderid;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/confirmorder.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         console.log(response)
         if(response.data.status){
            $scope.initializePendingOrders();
            $scope.displayOrderID = "";
            $scope.displayOrderContent = "";
            window.scrollTo(0,0);
          }
          else{
               		var x = document.getElementById("infobar")
		x.innerHTML = "Error: "+response.data.error;
		x.className = "show";
		setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);    
            //alert()
          }
        });
    }

    $scope.rejectOrder = function(orderid, flag){   
    	$scope.rejectingOrderId = orderid;
    	
    	if(flag){
    		$scope.confirmationModalText = "This is a prepaid order. Do you still want to cancel this order?";
    	}
    	else{
    		$scope.confirmationModalText = "Are you sure want to cancel this order?";
    	}
    	
    	$('#confirmationModal').modal('show');
    }
    
    $scope.rejectOrderConfirm = function(orderid){
      $('#confirmationModal').modal('hide');
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = orderid;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/rejectorder.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
            $scope.initializePendingOrders();
            $scope.displayOrderID = "";
            $scope.displayOrderContent = "";
            window.scrollTo(0,0);
       });    
    }


    $scope.assignAgent = function(orderid){
      $scope.showDeliveryAgents = true;
      var temp_branch = localStorage.getItem("branchCode");
      $http.get("https://accelerateengine.app/food-engine/apis/fetchroles.php?branch="+temp_branch+"&role=AGENT").then(function(response) {
        $scope.all_agents = response.data.results;
        $scope.delivery_agents = [];
        var i = 0;
        while(i < $scope.all_agents.length){
          $scope.delivery_agents.push(
            {
              value: $scope.all_agents[i].code ,
              label: $scope.all_agents[i].name
            }
          );
          i++;
        }

      });
    }

    $scope.agentsList = "";
    $scope.dispatchOrder = function(orderid, agentcode){
      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.id = orderid;
      data.agent = agentcode;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/dispatchorder.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         console.log(response)
         if(response.data.status){
            $scope.initializePendingOrders();
            $scope.displayOrderID = "";
            $scope.displayOrderContent = "";
            window.scrollTo(0,0);
         }
         else{
           alert("Error. Please try again.");
         }
       });
    }


    //Refresh Page every 15 seconds.
    $scope.Timer = $interval(function () {
        $scope.refreshPendingOrders();
    }, 20000);


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
              		$scope.helprequests_length = response.data.helpCount;
              		$scope.smart_orders_length = response.data.smartOrdersCount;
              	}
              	else{
              		$scope.reservations_length = 0;
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
              		$scope.helprequests_length = response.data.helpCount;
              		$scope.smart_orders_length = response.data.smartOrdersCount;
              	}
              	else{
              		$scope.reservations_length = 0;
              		$scope.helprequests_length = 0;
              	}
           });
        }, 20000);




	})

  ;
