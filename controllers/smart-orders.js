angular.module('SmartOrdersApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])

.controller('SmartOrdersController', function($scope, $http, $interval, $cookies) {

const TOKEN_FOR_TESTING = "sHtArttc2ht%2BtMf9baAeQ9ukHnXtlsHfexmCWx5sJOhHIq1S%2F7Wg6G8g0PY2zmkff5rCh%2BPGETDqicga%2B2XyW9hsC3qlAOG0OrAJwvjTCC8%3D";



      //Check if logged in
      // if($cookies.get("acceleronLunaAdminToken")){
      //   $scope.isLoggedIn = true;
      // }
      // else{
      //   $scope.isLoggedIn = false;
      //   window.location = "adminlogin.html";
      // }


      /* Loading Animation */
      var toastShowingInterval;
      function showToast(message, color){
          clearInterval(toastShowingInterval);
          var x = document.getElementById("infobar");
          x.style.background = color && color != '' ? color : '#ff9607';
          x.innerHTML = message ? '<tag id="infotext">'+message+'</tag>' : '<tag id="infotext">Loading...</tag>';
          x.className = "show"; 
          toastShowingInterval = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
      }



      $scope.isLoggedIn = true;

      //Logout function
      $scope.logoutNow = function(){
        if($cookies.get("acceleronLunaAdminToken")){
          $cookies.remove("acceleronLunaAdminToken");
          window.location = "adminlogin.html";
        }
      }

      $scope.outletCode = localStorage.getItem("branch");

      $scope.tablesList = [];
      $scope.isTablesLoaded = false;
      $scope.loadTables = function(){
          var data = {};
          data.token = $cookies.get("acceleronLunaAdminToken");
          $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
          $http({
            method  : 'POST',
            url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-tablestatus.php',
            data    : data,
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
          })
          .then(function(response) {
             $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
             if(response.data.status){
               $scope.tablesList = response.data.data;
               $scope.isTablesLoaded = true;
             }
             else{
               $scope.isTablesLoaded = false;
             }
          });
      }
      
      $scope.loadTables();



      $scope.TimerOrders = $interval(function () {
        $scope.loadTables();
      }, 10000);



      $scope.individualOrder = {};

      $scope.acknowledgeServiceRequest = function(table){
        if(table.activeServiceRequest){
              var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.requestId = table.activeServiceRequestId;
              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-acknowledgerequest.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
              })
              .then(function(response) {
                 $scope.loadTables();
                 $('#serviceRequestModal').modal('hide');
              });
        }
      }

      $scope.showServiceRequestModal = function(table){
        $scope.ServiceRequestModalContent = table;
        $('#serviceRequestModal').modal('show');
      }


      $scope.openTable = function(table){
        if(table.activeServiceRequest){
          //Acknowledge service
          $scope.showServiceRequestModal(table);
          return;
        }
        
        $scope.currentTableData = table;

        var isTableOccuppied = !$scope.currentTableData.isTableFree;
        var tableOrderStatus = $scope.currentTableData.orderStatus;

        if(isTableOccuppied){
            if(table.hasNewOrder){ //There is a new order on the table --> Punch
                var data = {};
                data.token = TOKEN_FOR_TESTING;//$cookies.get("acceleronLunaAdminToken");
                data.masterorder = table.masterOrderId;
                $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
                $http({
                  method  : 'POST',
                  url     : 'https://accelerateengine.app/smart-menu/apis/fetchorder.php',
                  data    : data,
                  headers : {'Content-Type': 'application/x-www-form-urlencoded'}
                })
                .then(function(response) {
                   $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
                   if(response.data.status){
                     $scope.individualOrder = response.data.data;
                     var cart = $scope.individualOrder.cart;
                     for(var i = 0; i < cart.length; i++){
                        cart[i].isAvailable = true;
                     }

                     $scope.individualOrder.cart = cart;

                     $('#punchOrderModal').modal('show');
                   }
                   else{
                      showToast("Failed to load the order table - " + response.data.error, "#f44335");
                   }
                });
            }
            else{
                if(tableOrderStatus == 0){ //show GENERATE BILL options
                  $scope.showOptions('GENERATE_BILL', table);
                }
                else if(tableOrderStatus == 1){ //already billed - waiting for settlement (orange tile)
                  $scope.showOptions('SETTLE_BILL', table);
                }
            }
        }

      }

      $scope.getOrderCount = function(number){
        if(number == 1){
          return "2nd";
        }
        else if(number == 2){
          return "3rd";
        }
        else if(number > 2){
          return (number+1) + "th";
        }
      }

      $scope.getFormattedTime = function(date){
        return moment(date, "yyyy-mm-dd hh:mm:ss").format('hh:mm a');
      }

      $scope.showOptions = function(requestType, tableData){
        $scope.tableOptionsModalContent = tableData;
        if(requestType == 'GENERATE_BILL'){
          $('#generateInvoiceModal').modal('show');
        }
        else if(requestType == 'SETTLE_BILL'){
          $('#settleInvoiceModal').modal('show');
        }
      }


      $scope.changeItemAvailability = function(item){
         var cart = $scope.individualOrder.cart;
         for(var i = 0; i < cart.length; i++){
            if(cart[i].code == item.code && cart[i].variant == item.variant){
              cart[i].isAvailable = !cart[i].isAvailable;
            }
         }
         $scope.individualOrder.cart = cart;
      }

      $scope.generateBillForTable = function(tableData){
              var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.masterorder = tableData.masterOrderId;
              data.systemBillNumber = tableData.systemBillNumber;
              data.totalBillAmount = tableData.billAmount;
              $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-generateinvoice.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
              })
              .then(function(response) {
                 $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
                 if(response.data.status){
                   $('#generateInvoiceModal').modal('hide');
                   showToast("Successfully generated invoice", "#4caf50");
                   $scope.loadTables();
                 }
                 else{
                   showToast("Failed to generate bill - " + response.data.error, "#f44335");
                 }
              });
      }


      $scope.settleBillForTable = function(tableData){
              var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.masterOrderId = tableData.masterOrderId;
              $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-settleoffline.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
              })
              .then(function(response) {
                 $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
                 if(response.data.status){
                   $('#settleInvoiceModal').modal('hide');
                   showToast("Settled invoice offline", "#4caf50");
                   $scope.loadTables();
                 }
                 else{
                   showToast("Failed to settle bill - " + response.data.error, "#f44335");
                 }
              });
      }

      $scope.rejectMasterOrderForTable = function(tableData){
              var data = {};
              data.token = $cookies.get("acceleronLunaAdminToken");
              data.masterorder = tableData.masterOrderId;
              $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-rejectmasterorder.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
              })
              .then(function(response) {
                 $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
                 if(response.data.status){
                   $('#generateInvoiceModal').modal('hide');
                   showToast("The order has been rejected", "#4caf50");
                   $scope.loadTables();
                 }
                 else{
                   showToast("Failed to reject the order - " + response.data.error, "#f44335");
                 }
              });
      }


      $scope.punchOrderAccept = function(currentTableData, individualOrder){
        let cart = individualOrder.cart;
        let filteredCart = [];
        let i = 0;
        let isCartChanged = 0;
        while(i < cart.length){
            if(cart[i].isAvailable){
                filteredCart.push(cart[i]);
            }
            else {
                isCartChanged = 1;
            }
            i++;
        }

        if(filteredCart.length == 0){
           showToast("Warning: You have marked all items unavailable, so please REJECT the order.", "#ff9800");
           return;
        }
        else {
                    var data = {
                        masterOrderId: currentTableData.masterOrderId,
                        subOrderId: individualOrder.orderId,
                        cartChanged: isCartChanged,
                        cartFinal: filteredCart
                    }

                    $http({
                        method: 'POST',
                        url: 'https://accelerateengine.app/smart-menu/apis/superadmin-acceptorder.php',
                        data: data,
                        timeout: 10000
                    })
                    .then(function(data) {
                        if(data.status){
                            //Push to local server
                            $scope.sendOrderToServer(currentTableData, individualOrder);
                            $('#punchOrderModal').modal('hide');
                            $scope.loadTables();
                        }
                        else {
                            showToast("Error in accepting the order", "#f44336");
                        }
                    })
        }

      }


      $scope.sendOrderToServer = function(currentTableData, individualOrder){
                var localServerIP = localStorage.getItem("localServerIP") && localStorage.getItem("localServerIP") != "" ? localStorage.getItem("localServerIP") : "127.0.0.1";
                var COMMON_IP_ADDRESS = "http://"+localServerIP+":5984/";

                var table = currentTableData.table;
                if(table == ''){  
                    showToast("Table missing", "#f44336");
                    return '';
                }

                isTableFreeCheck(table);

                function isTableFreeCheck(table_req){
                    $http({
                        method: 'GET',
                        url: COMMON_IP_ADDRESS+'/accelerate_tables/_design/filter-tables/_view/filterbyname?startkey=["'+table_req+'"]&endkey=["'+table_req+'"]',
                        timeout: 10000
                    })
                    .then(function(response) {
                        let data = response.data;
                        if(data.rows.length >= 1){
                                var thisTable = data.rows[0].value;
                                if(thisTable.status != 0){
                                    alert("Order Already Exists - The table "+table_req+" is not free. Refresh the table status or check in Live Orders on the System.");
                                    var confirmPopup = $ionicPopup.confirm({
                                        cssClass: 'popup-clear confirm-alert-alternate',
                                        title: 'Order Already Exists',
                                        template: '<p style="color: #4e5b6a; padding: 0 10px 10px 10px; margin: 0; font-size: 15px; font-weight: 400;"></p>'
                                    });
                                }
                                else{
                                    sendKOTToServerAfterProcess();
                                }
                        }
                        else{
                          showToast("Error: Unable to read Table info.", "#f44336");
                        }
                    }) 
                }


                function sendKOTToServerAfterProcess(){
                        var tapOrderMetaData = {
                            "source": "SMART",
                            "type": "DINE"
                        }

                        var orderData = {
                              "_id": 'SMART_'+currentTableData.masterOrderId+'_'+individualOrder.orderId,
                              "tapsSource": tapOrderMetaData,
                              "KOTNumber": "",
                              "orderDetails": {
                                "mode": "",
                                "modeType": "",
                                "reference": individualOrder.orderId,
                                "isOnline": true
                              },
                              "table": table,
                              "customerName": currentTableData.guestName,
                              "customerMobile": currentTableData.guestMobile,
                              "guestCount": 0,
                              "machineName": "Luna",
                              "sessionName": "",
                              "stewardName": currentTableData.stewardName,
                              "stewardCode": currentTableData.stewardCode,
                              "date": "",
                              "timePunch": "",
                              "timeKOT": "",
                              "timeBill": "",
                              "timeSettle": "",
                              "cart": individualOrder.cart,
                              "specialRemarks": individualOrder.comments,
                              "allergyInfo": "",
                              "extras": [],
                              "discount": {},
                              "customExtras": {}
                        }


                          //post to server
                          var http = new XMLHttpRequest();   
                          var url = COMMON_IP_ADDRESS+'accelerate_third_party_orders';
                          http.open("POST", url);
                          http.setRequestHeader("Content-Type", "application/json");

                          http.onreadystatechange = function() {
                              let errorString = "";
                              if(http.status == 201) {
                                  showToast("Successfully posted the order", "#4caf4f");
                              }
                              else if(http.status == 409){
                                  errorString = "Aborted! This Order was punched already";
                              }
                              else if(http.status == 404){
                                  errorString = "Local Server Error: Connection failed";
                              }
                              else{
                                  errorString = "Error: Punching order failed";
                              }

                              if(errorString != ""){
                                  showToast(errorString, "#f44336")
                              }
                          }

                          http.send(JSON.stringify(orderData));

                }          
      }

      $scope.punchOrderReject = function(currentTableData, individualOrder){
        var data = {
            masterOrderId: currentTableData.masterOrderId,
            subOrderId: individualOrder.orderId,
            token: $cookies.get("acceleronLunaAdminToken")
        }

        $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-rejectorder.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        .then(function(response) {
           $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
           if(response.data.status){
             $('#punchOrderModal').modal('hide');
             showToast("Order has been rejected", "#4caf50");
             $scope.loadTables();
           }
           else{
             showToast("Error - " + (response.data.error ? response.data.error : "Something went wrong"), "#f44335");
           }
        });

      }

      $scope.getOrderTime = function(time, format){
        if(format == 'PAST'){
          return moment(time).fromNow();
        }
        if(format == 'ABSOLUTE'){
          return moment(time).format('LT');
        }
      }

      $scope.getTableOrderCounter = function(tablesList, type){
        let free = 0;
        let news = 0;
        let punched = 0;
        let billed = 0;

        var i = 0;
        while(i < tablesList.length){
          let table = tablesList[i];
          if(table.isTableFree){
            free++;
          }
          else{
              switch(table.orderStatus){
                case "0":{
                  if(!table.hasNewOrder){
                    punched++;
                  } else {
                    news++;
                  }
                  break;
                }
                case "1":{
                  billed++;
                  break;
                }
              }
          }
          i++;
        }


        switch(type){
          case "NEW":{
            return news;
          }
          case "PUNCHED":{
            return punched;
          }
          case "BILLED":{
            return billed;
          }
          case "FREE":{
            return free;
          }
        }

      }


      $scope.getTileClasses = function(table){

        let tileColor = "free";

        if(table.isTableFree){
          tileColor = "free";
        }

        switch(table.orderStatus){
          case "0":{
            tileColor = "active";
            break;
          }
          case "1":{
            tileColor = "billed";
            break;
          }
          case "2":{
            tileColor = "settled";
            break;
          }
          default:{
            tileColor = "free";
          }
        }

        if((table.hasNewOrder) && (tileColor == "free" || tileColor == "active")){
          tileColor = "new";
        }

        var isServiceRequest = table.activeServiceRequest != "" ? true : false;
        if(isServiceRequest){
          tileColor = tileColor + " serviceWarning";
        }

        return tileColor;
      }

      $scope.getTileText = function(table){
        if(table.orderStatus != 2 && table.hasNewOrder){
          return "New";
        }

        if(table.orderStatus != 2 && table.isTableFree){
          return "Free";
        }

        switch(table.orderStatus){
          case "0":{
            if(table.stewardName && table.stewardName != ""){
              return table.stewardName;
            }
            return "Running";
          }
          case "1":{
            if(table.billAmount && table.billAmount != ""){
              return "Billed Rs." + table.billAmount;
            }
            return "Billed";
          }
          case "2":{
            if(table.systemBillNumber && table.systemBillNumber != ""){
              return "Billed #" + table.systemBillNumber;
            }
            return "Billed";
          }
          default:{
            return "";
          }
        }
      }


      $scope.getServiceWarningIcon = function(table){
        var requestType = table.activeServiceRequest;
        switch(requestType){
          case "CALL_REQUEST_BILL":{
            return "fa-file-text-o";
          }
          case "CALL_CALL_STEWARD":{
            return "fa-user-o";
          }
          case "CALL_SERVE_FAST":{
            return "fa-bolt";
          }
          default:{
            return "fa-paper-o";
          }
        }
      }

      $scope.getServiceNameFromKey = function(requestType){
        switch(requestType){
          case "CALL_REQUEST_BILL":{
            return "Needs Bill";
          }
          case "CALL_CALL_STEWARD":{
            return "Calling Steward";
          }
          case "CALL_SERVE_FAST":{
            return "Faster Service";
          }
          default:{
            return "Calling Steward";
          }
        }
      }

      $scope.getServiceWarningLabel = function(table){
        var requestType = table.activeServiceRequest;
        switch(requestType){
          case "CALL_REQUEST_BILL":{
            return "Take Bill";
          }
          case "CALL_CALL_STEWARD":{
            return "Attend";
          }
          case "CALL_SERVE_FAST":{
            return "Serve Fast";
          }
          default:{
            return "Attend";
          }
        }
      }

  })

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
  
  


  .controller('smartOrdersHistoryController', function($scope, $http, $interval, $cookies) {

      /*
      //Check if logged in
      if($cookies.get("acceleronLunaAdminToken")){
        $scope.isLoggedIn = true;
      }
      else{
        $scope.isLoggedIn = false;
        window.location = "adminlogin.html";
      }

      */

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
      $scope.stewardCode = false;
      $scope.tableNumber = false;

      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isOrdersFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Today\'s Completed Smart Orders';
      $scope.isMoreLeft = true;

      //Default Results : Completed Orders of the Day
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = yyyy+'-'+mm+'-'+dd;

      var data = {};
      data.token ="QJz9u+Dw/YD5mr1wNKxX9HY+N1LMiMEQ5s7M6WLi0Q8p5ybXRmWkl0sYE7tKoBzEvUNvHu1BoS+jeowv5H8T6A=="//$cookies.get("acceleronLunaAdminToken");
      data.status = 0;
      data.key = today;
      
      $scope.isOrderSummaryLoaded = false;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-fetchordersummary.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
	       $scope.isOrderSummaryLoaded = true;
         if(response.data.status){
           $scope.isMoreLeft = false; //Showing all orders anyways.
           $scope.isOrdersFound = true;
           $scope.completed_orders = sortByNewOrders(response.data.response);
         }
         else{
           $scope.isOrdersFound = false;
           $scope.resultMessage = "There are no completed Smart Orders today!";
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
          url     : 'https://accelerateengine.app/food-engine/apis/superadmin-fetchordersummary.php',
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
          url     : 'https://accelerateengine.app/food-engine/apis/superadmin-fetchordersummary.php',
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
        $scope.displayOrderID = order.masterOrderId;
        $scope.displayOrderContent = order;
        $scope.isViewingOrder = true;
      }

      $scope.getSplitOrderStatusHeader = function(splitOrder){
        if(splitOrder.status == 0){
          return "greenSplitHeader";
        } else if(splitOrder.status == 1){
          return "acceptedSplitHeader";
        } else if(splitOrder.status == 5){
          return "redSplitHeader";
        }
      }

      $scope.getSubOrderHeading = function(rank, splitOrder){
        let text = "";
        if(splitOrder.status == 0){
          text = "- Pending";
        } else if(splitOrder.status == 1){
          text = "- Accepeted";
        } else if(splitOrder.status == 5){
          text = "- Rejected";
        }


        if(rank == 1){
          return "First Order " + text;
        } else if(rank == 2){
          return "Second Order " + text;
        } else if(rank == 3){
          return "Third Order " + text;
        } else if(rank >= 4){
          return rank + "th Order " + text;
        }
      }

      $scope.getFormattedTime = function(date){
        return moment(date, "yyyy-mm-dd hh:mm:ss").format('hh:mm a');
      }

      $scope.isViewingSplitOrderCommentsText = false;
      $scope.viewingSplitOrderCommentsText = "";
      $scope.openSplitOrderComments = function(text){
        if(text == ""){
          return;
        }
        $scope.isViewingSplitOrderCommentsText = true;
        $scope.viewingSplitOrderCommentsText = text;
      }

      $scope.getRunningStatusText = function(orderData){
        var i = 0;
        while(i < orderData.length){
          if(orderData[i].status != 0){
            return "Running Order"
          }
          i++
        }
        return "New Order"
      }

      $scope.getRunningStatusTextStyle = function(orderData){
        var i = 0;
        while(i < orderData.length){
          if(orderData[i].status != 0){
            return {
              "color": "#f44336"
            }
          }
          i++
        }
        return {
          "color": "#16a085"
        }
      }

      function sortByNewOrders(orderData){
        orderData.sort(function(obj1, obj2) {
          return obj1.table - obj2.table;
        });

        for(let i = 0; i < orderData.length; i++){ //Showing: New > Running > Billed > Completed
          if(orderData[i].orderStatus == 2){
            orderData[i].sortIndex = 500;
          } else if(orderData[i].orderStatus == 1){
            orderData[i].sortIndex = 400;
          } else {
            orderData[i].sortIndex = hasNewOrder(orderData[i]) ? 100 : 300;
          }
        }
        orderData.sort(function(obj1, obj2) {
          return obj1.sortIndex - obj2.sortIndex;
        });

        return orderData;
      }

      function hasNewOrder(order){
        if(order.orderStatus == 0){
          var i = 0;
          let orderData = order.orderData;
          while(i < orderData.length){
            if(orderData[i].status == 0){
              return true;
            }
            i++
          }
        }
        return false;
      }

      $scope.getRunningStatusTableBadge = function(order){
        if(order.orderStatus == 2){ //Completed
          return "completedTableBadge";
        } else if(order.orderStatus == 1){ //Billed
          return "orangeTableBadge";
        } else if(order.orderStatus == 0){ //Active
          var i = 0;
          let orderData = order.orderData;
          while(i < orderData.length){
            if(orderData[i].status == 0){
              return "greenTableBadge"; //Some pending
            }
            i++
          }
          return "redTableBadge"; // Some pending
        } else if(order.orderStatus == 5){ //Rejected
          return "rejectedTableBadge";
        }
      }

      $scope.isCaptainDetailsFound = function(order){
        if(order.stewardName == '' && order.stewardCode == ''){
          return false;
        }
        return true;
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




  .controller('rejectedSmartOrdersController', function($scope, $http, $interval, $cookies) {

      /*
      //Check if logged in
      if($cookies.get("acceleronLunaAdminToken")){
        $scope.isLoggedIn = true;
      }
      else{
        $scope.isLoggedIn = false;
        window.location = "adminlogin.html";
      }

      */

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
      $scope.stewardCode = false;
      $scope.tableNumber = false;

      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isOrdersFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Today\'s Rejected Smart Orders';
      $scope.isMoreLeft = true;

      //Default Results : Completed Orders of the Day
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = yyyy+'-'+mm+'-'+dd;

      var data = {};
      data.token = $cookies.get("acceleronLunaAdminToken");
      data.status = 0;
      data.key = today;
      
      $scope.isOrderSummaryLoaded = false;
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-fetchordersummary.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
         $scope.isOrderSummaryLoaded = true;
         if(response.data.status){
           $scope.isMoreLeft = false; //Showing all orders anyways.
           $scope.isOrdersFound = true;
           $scope.completed_orders = sortByNewOrders(response.data.response);
         }
         else{
           $scope.isOrdersFound = false;
           $scope.resultMessage = "There are no rejected Smart Orders today!";
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
        data.id = 5;
        $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/superadmin-fetchordersummary.php',
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
          url     : 'https://accelerateengine.app/food-engine/apis/superadmin-fetchordersummary.php',
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
        $scope.displayOrderID = order.masterOrderId;
        $scope.displayOrderContent = order;
        $scope.isViewingOrder = true;
      }

      $scope.getSplitOrderStatusHeader = function(splitOrder){
        if(splitOrder.status == 0){
          return "greenSplitHeader";
        } else if(splitOrder.status == 1){
          return "acceptedSplitHeader";
        } else if(splitOrder.status == 5){
          return "redSplitHeader";
        }
      }

      $scope.getSubOrderHeading = function(rank, splitOrder){
        let text = "";
        if(splitOrder.status == 0){
          text = "- Pending";
        } else if(splitOrder.status == 1){
          text = "- Accepeted";
        } else if(splitOrder.status == 5){
          text = "- Rejected";
        }


        if(rank == 1){
          return "First Order " + text;
        } else if(rank == 2){
          return "Second Order " + text;
        } else if(rank == 3){
          return "Third Order " + text;
        } else if(rank >= 4){
          return rank + "th Order " + text;
        }
      }

      $scope.getFormattedTime = function(date){
        return moment(date, "yyyy-mm-dd hh:mm:ss").format('hh:mm a');
      }

      $scope.isViewingSplitOrderCommentsText = false;
      $scope.viewingSplitOrderCommentsText = "";
      $scope.openSplitOrderComments = function(text){
        if(text == ""){
          return;
        }
        $scope.isViewingSplitOrderCommentsText = true;
        $scope.viewingSplitOrderCommentsText = text;
      }

      function sortByNewOrders(orderData){
        orderData.sort(function(obj1, obj2) {
          return obj1.table - obj2.table;
        });

        for(let i = 0; i < orderData.length; i++){ //Showing: New > Running > Billed > Completed
          if(orderData[i].orderStatus == 2){
            orderData[i].sortIndex = 500;
          } else if(orderData[i].orderStatus == 1){
            orderData[i].sortIndex = 400;
          } else {
            orderData[i].sortIndex = hasNewOrder(orderData[i]) ? 100 : 300;
          }
        }
        orderData.sort(function(obj1, obj2) {
          return obj1.sortIndex - obj2.sortIndex;
        });

        return orderData;
      }

      function hasNewOrder(order){
        if(order.orderStatus == 0){
          var i = 0;
          let orderData = order.orderData;
          while(i < orderData.length){
            if(orderData[i].status == 0){
              return true;
            }
            i++
          }
        }
        return false;
      }

      $scope.isCaptainDetailsFound = function(order){
        if(order.stewardName == '' && order.stewardCode == ''){
          return false;
        }
        return true;
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

            //Default ORDER to display:
            if($scope.isPendingDisplayed){
              $scope.displayOrderID = $scope.pending_orders[0].orderID;
              $scope.displayOrderContent = $scope.pending_orders[0];
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



  


  .controller('smartOrdersSettingsController', function($scope, $http, $interval, $cookies) {

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

      /* Loading Animation */
      var toastShowingInterval;
      function showToast(message, color){
          clearInterval(toastShowingInterval);
          var x = document.getElementById("infobar");
          x.style.background = color && color != '' ? color : '#ff9607';
          x.innerHTML = message ? '<tag id="infotext">'+message+'</tag>' : '<tag id="infotext">Loading...</tag>';
          x.className = "show"; 
          toastShowingInterval = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
      }

      $scope.qrConfigData = [];
      $scope.isQrConfigFound = false;

      $scope.loadConfiguredQR = function(){
            var data = {};
            data.token = $cookies.get("acceleronLunaAdminToken");
            
            $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-fetchqrconfig.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                   $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
                   if(response.data.status){
                      $scope.qrConfigData = response.data.data;
                      $scope.isQrConfigFound = true;
                   }
                   else{
                      $scope.isQrConfigFound = false;
                      $scope.resultMessage = "There are no QRs configured at this outlet";
                   }
              });
      }

      $scope.loadConfiguredQR();


      $scope.getScannerDownloadLink = function(qrData){
        let branchCode = qrData.branch;
        let table = qrData.table;
        window.open("https://accelerateengine.app/food-engine/qr-scanner-generator/generate.php?branch="+branchCode+"&table="+table);
      }

      $scope.getFormattedTime = function(text, type){
        if(type == 'TIME')
          return moment(text, 'YYYY-MM-DD hh:mm:ss').format('HH:mm a');
        else if (type == 'DATE')
          return moment(text, 'YYYY-MM-DD hh:mm:ss').format('DD-MM-YYYY');
        else 
          return moment(text, 'YYYY-MM-DD hh:mm:ss').format('HH:mm a / DD-MM-YYYY');
      }


      $scope.getRandomColorForCaptains = function(code){
        var hex = code.substring(4, 10);
        var color = "";
        if(hex.length < 3){
          color = "#000";
        } else {
          color = "#" + hex;
        }
        return {
          "background": color
        }
      }


       //Assign Captain
       $scope.assignCaptain = function(qrData){
            $scope.selectedQrData= qrData;
            var temp_branch = localStorage.getItem("branchCode");
            $http({
              method  : 'GET',
              url     : 'https://accelerateengine.app/food-engine/apis/fetchroles.php?branch='+temp_branch+'&role=CAPTAIN',
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                   $scope.allStaffList = response.data.results;
                   $('#chooseCaptainModal').modal('show');
              });
       }

       $scope.assignCaptainToTable = function(qrData, captainData){

            var data = {};
            data.token = $cookies.get("acceleronLunaAdminToken");
            data.captainCode = captainData.code;
            data.table = qrData.table;
          
            $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-assigncaptaintotable.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
            })
            .then(function(response) {
               if(!response.data.status){
                  showToast("Failed to assign : " + response.data.error, "#f44336");
               }
               else {
                  $('#chooseCaptainModal').modal('hide');
                  $scope.loadConfiguredQR();
               }
            });
       }

       $scope.getCaptainClass = function(qrData, captainData){
          if(qrData.isCaptainAssigned && qrData.assignedCaptainCode == captainData.code){
            return 'chooseCaptainButtonSelect';
          }

          return 'chooseCaptainButton';
       }



       //Update Settings
       $scope.updateSettings = function(qrData, type, flag){
          if(type == 'MAINTAIN'){
            qrData.isMaintainMode = flag;
          } else if(type == 'PAYMENT'){
            qrData.isPaymentEnabled = flag;
          } else if(type == 'QR'){
            qrData.isQrEnabled = flag;
          }

          var data = {};
          data.token = $cookies.get("acceleronLunaAdminToken");
          data.statusPayment = qrData.isPaymentEnabled ? 1 : 0;
          data.statusMaintain = qrData.isMaintainMode ? 1 : 0;
          data.statusQr = qrData.isQrEnabled ? 1: 0;
          data.qrReference = qrData.qrCode;
          
          $http({
            method  : 'POST',
            url     : 'https://accelerateengine.app/smart-menu/apis/superadmin-updateqrconfig.php',
            data    : data,
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
           })
           .then(function(response) {
                 if(!response.data.status){
                    showToast("Failed to update : " + response.data.error, "#f44336");
                 }
            });
       }

  })
  ;
