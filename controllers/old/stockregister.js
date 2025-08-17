angular.module('inventoryApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


  .controller('inventoryController', function($scope, $http, $interval, $cookies) {

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
    


	$('.js-example-basic-single').select2();



      $scope.outletCode = localStorage.getItem("branch");
      
      $scope.marketingType = 'out';
      $scope.figure_active_out = 0;
      $scope.figure_active_purchases = 0;
      $scope.figure_active_payments = 0;   
      
      $scope.deleteError = "";
      
      //Default Flags
      $scope.defaultFlagSet = function(){
	      $scope.newComboWindowFlag = false;
	      $scope.newPromoWindowFlag = false;
	      $scope.newCouponWindowFlag = false;

		  $scope.editComboWindowFlag = false;
	      $scope.editPromoWindowFlag = false;
	      $scope.editCouponWindowFlag = false;	

	      $scope.isPhotoAttached = false;
      }      
      $scope.defaultFlagSet();
      
      
      //Display Function
      $scope.currentDisplayPage = 1;
      $scope.totalDisplayPages = 1;
      $scope.isContentFound = false;
      
      $scope.initializeContent = function(type, req_pageid, option){
      		var pageid = req_pageid;
      		$scope.defaultFlagSet();	
      		
      		//Update Current page
       	  	$scope.currentDisplayPage = pageid;
       	  	
       	  	//Special Corner Cases (Adding New Page (10 entries to 11) and Deleting a Page (11 entries to 10))
		if(option != '') //Check if its a corner case
		{
			var current_entries = 0;
			switch(type){
			      	case 'purchases':{
			      		current_entries = $scope.figure_active_purchases;
			      		break;
			      	}
			      	case 'out':{
			      		current_entries = $scope.figure_active_out;
			      		break;
			      	}
			      	case 'payments':{
			      		current_entries = $scope.figure_active_payments;
			      		break;
			      	}
			} 	
			
			if(option == 'delete'){
				if((current_entries-1)%10 == 0){
					if($scope.currentDisplayPage == $scope.totalDisplayPages){ //I am on the last page
						$scope.currentDisplayPage--;
						pageid--;
					}					
				}
			}
			else if(option == 'save'){
				if((current_entries+1)%10 == 1){
					if($scope.currentDisplayPage == $scope.totalDisplayPages && $scope.currentDisplayPage != 1){ //I am on the last page
						$scope.currentDisplayPage++;
						pageid++;	
					}	
								
				}			
			}
		}	 
       	  
		//Fetch Active Content
	      	var co_data = {};
	      	co_data.type = type;
	      	co_data.page = pageid - 1;
	        co_data.token = $cookies.get("accelerateVegaDeskAdmin");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/erpfetchstockregistercontent.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){
			
			      $scope.isContentFound = true;
			      
			      $scope.active_content = response.data.response;
				
			      $scope.figure_active_out = response.data.totalOut;
			      $scope.figure_active_purchases = response.data.totalPurchases;
			      $scope.figure_active_payments = response.data.totalPayments;
			      
			      //Update Total Pages
			      switch(type){
			      	case 'purchases':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_purchases/10);
			      		if($scope.figure_active_purchases == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      	case 'out':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_out/10);
			      		if($scope.figure_active_out == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      	case 'payments':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_payments/10);
			      		if($scope.figure_active_payments == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      }				            			       
			}
			else{	
				$scope.isContentFound = false;		
				$scope.newContentSet();	
				$scope.active_content = {};
			}
	    });	
	}


  $scope.getRandomColor = function(code){

	  code = code.toString().split('').pop();

	  var styles = [
	    {"color": "#ff4300"},
	    {"color": "#1abc9c"},
	    {"color": "#3498db"},
	    {"color": "#9b59b6"},
	    {"color": "#34495e"},
	    {"color": "#e67e22"},
	    {"color": "#0a3d62"},
	    {"color": "#b71540"},
	    {"color": "#e58e26"},
	    {"color": "#60a3bc"}
	  ];

	  return styles[code];
	}


	$scope.initializeContent($scope.marketingType, 1);
	
      
      	    //Default Styling
        document.getElementById("combosTitle").style.color = "#FFF";
	    document.getElementById("combosIcon").style.color = "#FFF";
	    document.getElementById("combosTag").style.color = "#FFF";
	    document.getElementById("combosCount").style.color = "#FFF";
	    document.getElementById("combosTabButton").style.background="#2980b9";
	
	    document.getElementById("promotionsTitle").style.color = "#ABB2B9";
	    document.getElementById("promotionsIcon").style.color = "#ABB2B9";
	    document.getElementById("promotionsTag").style.color = "#ABB2B9";
	    document.getElementById("promotionsCount").style.color = "#ABB2B9";
	    document.getElementById("promotionsTabButton").style.background="#F1F1F1";
	    
	    document.getElementById("couponsTitle").style.color = "#ABB2B9";
	    document.getElementById("couponsIcon").style.color = "#ABB2B9";
	    document.getElementById("couponsTag").style.color = "#ABB2B9";
	    document.getElementById("couponsCount").style.color = "#ABB2B9";
	    document.getElementById("couponsTabButton").style.background="#F1F1F1";
	    
	$scope.openType = function (type){
		$scope.active_content = [];
		$scope.marketingType = type;
		$scope.initializeContent(type, 1);
		//Styling
		switch(type) {
		    case 'out':
		    {		    	
		        document.getElementById("combosTitle").style.color = "#FFF";
			    document.getElementById("combosIcon").style.color = "#FFF";
			    document.getElementById("combosTag").style.color = "#FFF";
			    document.getElementById("combosCount").style.color = "#FFF";
			    document.getElementById("combosTabButton").style.background="#2980b9";
			
			    document.getElementById("promotionsTitle").style.color = "#ABB2B9";
			    document.getElementById("promotionsIcon").style.color = "#ABB2B9";
			    document.getElementById("promotionsTag").style.color = "#ABB2B9";
			    document.getElementById("promotionsCount").style.color = "#ABB2B9";
			    document.getElementById("promotionsTabButton").style.background="#F1F1F1";
			    
			    document.getElementById("couponsTitle").style.color = "#ABB2B9";
			    document.getElementById("couponsIcon").style.color = "#ABB2B9";
			    document.getElementById("couponsTag").style.color = "#ABB2B9";
			    document.getElementById("couponsCount").style.color = "#ABB2B9";
			    document.getElementById("couponsTabButton").style.background="#F1F1F1";
		        
		        break;
		    }
		    case 'purchases':
		    {
		        document.getElementById("promotionsTitle").style.color = "#FFF";
			    document.getElementById("promotionsIcon").style.color = "#FFF";
			    document.getElementById("promotionsTag").style.color = "#FFF";
			    document.getElementById("promotionsCount").style.color = "#FFF";
			    document.getElementById("promotionsTabButton").style.background="#2980b9";
			
			    document.getElementById("combosTitle").style.color = "#ABB2B9";
			    document.getElementById("combosIcon").style.color = "#ABB2B9";
			    document.getElementById("combosTag").style.color = "#ABB2B9";
			    document.getElementById("combosCount").style.color = "#ABB2B9";
			    document.getElementById("combosTabButton").style.background="#F1F1F1";
			    
			    document.getElementById("couponsTitle").style.color = "#ABB2B9";
			    document.getElementById("couponsIcon").style.color = "#ABB2B9";
			    document.getElementById("couponsTag").style.color = "#ABB2B9";
			    document.getElementById("couponsCount").style.color = "#ABB2B9";
			    document.getElementById("couponsTabButton").style.background="#F1F1F1";
		        
		        break;
		    }
		    case 'payments':
		    {
		        document.getElementById("couponsTitle").style.color = "#FFF";
			    document.getElementById("couponsIcon").style.color = "#FFF";
			    document.getElementById("couponsTag").style.color = "#FFF";
			    document.getElementById("couponsCount").style.color = "#FFF";
			    document.getElementById("couponsTabButton").style.background="#2980b9";
			
			    document.getElementById("promotionsTitle").style.color = "#ABB2B9";
			    document.getElementById("promotionsIcon").style.color = "#ABB2B9";
			    document.getElementById("promotionsTag").style.color = "#ABB2B9";
			    document.getElementById("promotionsCount").style.color = "#ABB2B9";
			    document.getElementById("promotionsTabButton").style.background="#F1F1F1";
			    
			    document.getElementById("combosTitle").style.color = "#ABB2B9";
			    document.getElementById("combosIcon").style.color = "#ABB2B9";
			    document.getElementById("combosTag").style.color = "#ABB2B9";
			    document.getElementById("combosCount").style.color = "#ABB2B9";
			    document.getElementById("combosTabButton").style.background="#F1F1F1";
		        
		        break;
		    }
		} 
	}

	function getTodayDate(){
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

		  return today;
	}
	
	
	//New Creations
	$scope.showNewContentWindow = function(){
		switch($scope.marketingType){
			case 'out':{


              var data = {};
              data.token = $cookies.get("accelerateVegaDeskAdmin");
      
              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/erpnewstockoutregistermetadata.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                    if(response.data.status){ 

						$scope.newComboWindowFlag  = true;
						$scope.newPromoWindowFlag  = false;
						$scope.newCouponWindowFlag  = false;
						$scope.editComboWindowFlag = false;
					    $scope.editPromoWindowFlag = false;
					    $scope.editCouponWindowFlag = false;


	                      $scope.metaInventoryList = response.data.inventories; 
	                    	
	                      var m = 0;
	                      var allItemsListing = '';
	                      while($scope.metaInventoryList[m]){

	                        var k = 0;
	                        var itemsListing = '';
	                        while($scope.metaInventoryList[m].items[k]){
	                          itemsListing = itemsListing + '<option value="'+encodeURI(JSON.stringify($scope.metaInventoryList[m].items[k]))+'">'+$scope.metaInventoryList[m].items[k].name+'</option>';
	                          k++;
	                        }

	                        allItemsListing = allItemsListing + '<optgroup label="'+$scope.metaInventoryList[m].category+'">' + itemsListing + '</optgroup>';

	                        //last iteration
	                        if(m == $scope.metaInventoryList.length - 1){
	                          document.getElementById("dropStockOutInventory").innerHTML = allItemsListing;
	                          document.getElementById("dropStockOutInventory").value = '';

	                          $("#dropStockOutInventory").change(function(){
	                            var itemObj = JSON.parse(decodeURI($("#dropStockOutInventory").val()));
	                            document.getElementById("unitDisplayPart").innerHTML = itemObj.unit;
	                          });
	                        }

	                        m++
	                      }




					    
					    $('#inventory_date').datetimepicker({  // Date
						    format: "dd-mm-yyyy",
						    weekStart: 1,
					        todayBtn:  1,
							autoclose: 1,
							todayHighlight: 1,
							startView: 2,
							minView: 2,
							forceParse: 1
					    });


					    document.getElementById("inventory_date").value = getTodayDate(); 
			        }
               	});      

               	break;
			}
			case 'purchases':{

              var data = {};
              data.token = $cookies.get("accelerateVegaDeskAdmin");

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/erpnewstockmetadata.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                    if(response.data.status){ 

						$scope.newComboWindowFlag  = false;
						$scope.newPromoWindowFlag  = true;
						$scope.newCouponWindowFlag  = false;
						$scope.editComboWindowFlag = false;
					    $scope.editPromoWindowFlag = false;
					    $scope.editCouponWindowFlag = false;
                      


                      	$scope.metaVendorsList = response.data.vendors;
                      	$scope.metaInventoryList = response.data.inventories;

	                      var n = 0;
	                      var listing = '';
	                      while($scope.metaVendorsList[n]){
	                        listing = listing + '<option value="'+$scope.metaVendorsList[n].code+'">'+$scope.metaVendorsList[n].name+'</option>';
	                        

	                        if(n == $scope.metaVendorsList.length - 1){
	                          	document.getElementById("dropPurchaseVendor").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
	                        	document.getElementById("dropPurchaseVendor").value = '';
	                        }

	                        n++;
	                      }




	                      var m = 0;
	                      var allItemsListing = '';
	                      while($scope.metaInventoryList[m]){

	                        var k = 0;
	                        var itemsListing = '';
	                        while($scope.metaInventoryList[m].items[k]){
	                          itemsListing = itemsListing + '<option value="'+encodeURI(JSON.stringify($scope.metaInventoryList[m].items[k]))+'">'+$scope.metaInventoryList[m].items[k].name+'</option>';
	                          k++;
	                        }

	                        allItemsListing = allItemsListing + '<optgroup label="'+$scope.metaInventoryList[m].category+'">' + itemsListing + '</optgroup>';

	                        //last iteration
	                        if(m == $scope.metaInventoryList.length - 1){
	                          document.getElementById("dropPurchaseInventory").innerHTML = allItemsListing;
	                          document.getElementById("dropPurchaseInventory").value = '';
	                          $("#dropPurchaseInventory").change(function(){
	                            var itemObj = JSON.parse(decodeURI($("#dropPurchaseInventory").val()));
	                            document.getElementById("unitDisplayPartPurchase").innerHTML = itemObj.unit;
	                          });
	                        }

	                        m++
	                      }




					    
					    $('#purchase_date').datetimepicker({  // Date
						    format: "dd-mm-yyyy",
						    weekStart: 1,
					        todayBtn:  1,
							autoclose: 1,
							todayHighlight: 1,
							startView: 2,
							minView: 2,
							forceParse: 1
					    });


					    document.getElementById("purchase_date").value = getTodayDate(); 
			        }
               	});
                       		
                break;			
			}
			case 'payments':{

              var data = {};
              data.token = $cookies.get("accelerateVegaDeskAdmin");

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/erpnewstockmetadata.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                    if(response.data.status){ 

						$scope.newComboWindowFlag  = false;
						$scope.newPromoWindowFlag  = false;
						$scope.newCouponWindowFlag  = true;
						$scope.editComboWindowFlag = false;
					    $scope.editPromoWindowFlag = false;
					    $scope.editCouponWindowFlag = false;
                      


                      	$scope.metaVendorsList = response.data.vendors;
                      	$scope.metaInventoryList = response.data.inventories;

	                      var n = 0;
	                      var listing = '';
	                      while($scope.metaVendorsList[n]){
	                        listing = listing + '<option value="'+$scope.metaVendorsList[n].code+'">'+$scope.metaVendorsList[n].name+'</option>';
	                        

	                        if(n == $scope.metaVendorsList.length - 1){
	                          	document.getElementById("dropPaymentVendor").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
	                        	document.getElementById("dropPaymentVendor").value = '';
	                        }

	                        n++;
	                      }




	                      var m = 0;
	                      var allItemsListing = '';
	                      while($scope.metaInventoryList[m]){

	                        var k = 0;
	                        var itemsListing = '';
	                        while($scope.metaInventoryList[m].items[k]){
	                          itemsListing = itemsListing + '<option value="'+$scope.metaInventoryList[m].items[k].code+'">'+$scope.metaInventoryList[m].items[k].name+'</option>';
	                          k++;
	                        }

	                        allItemsListing = allItemsListing + '<optgroup label="'+$scope.metaInventoryList[m].category+'">' + itemsListing + '</optgroup>';

	                        //last iteration
	                        if(m == $scope.metaInventoryList.length - 1){
	                          	document.getElementById("dropPaymentInventory").innerHTML = allItemsListing;
	                        	document.getElementById("dropPaymentInventory").value = '';
	                        }

	                        m++
	                      }

					    
					    $('#payment_date').datetimepicker({  // Date
						    format: "dd-mm-yyyy",
						    weekStart: 1,
					        todayBtn:  1,
							autoclose: 1,
							todayHighlight: 1,
							startView: 2,
							minView: 2,
							forceParse: 1
					    });


					    document.getElementById("payment_date").value = getTodayDate(); 
			        }
               	});
                       		
                break;	

			}
		
		}
	}

	$scope.editContentSaveError = "";

	$scope.showEditContentWindow = function(content){

		$scope.editContentSaveError = "";    
	    $scope.myEditContent = content;
	    console.log($scope.myEditContent);

		switch($scope.marketingType){
			case 'out':{
				$scope.newComboWindowFlag  = false;
				$scope.newPromoWindowFlag  = false;
				$scope.newCouponWindowFlag  = false;
				$scope.editComboWindowFlag = true;
			    $scope.editPromoWindowFlag = false;
			    $scope.editCouponWindowFlag = false;

                       		
                       		break;
			}
			case 'purchases':{
				$scope.newComboWindowFlag  = false;
				$scope.newPromoWindowFlag  = false;
				$scope.newCouponWindowFlag  = false;
				$scope.editComboWindowFlag = false;
			    $scope.editPromoWindowFlag = true;
			    $scope.editCouponWindowFlag = false;
                       		
                       		break;			
			}
			case 'payments':{
				$scope.newComboWindowFlag  = false;
				$scope.newPromoWindowFlag  = false;
				$scope.newCouponWindowFlag  = false;
				$scope.editComboWindowFlag = false;
			    $scope.editPromoWindowFlag = false;
			    $scope.editCouponWindowFlag = true;
                       		
                       		break;			
			}
		
		}
	}


	
	//Delete Confirmation
	$scope.confirmDeleteStockOut = function(content){
		$scope.deleteItemName = content.inventoryName
		$scope.deleteItemQuantity = content.quantity;
		$scope.deleteItemDate = content.date;
		$scope.deleteItemId = content.id;

		$scope.deleteUID = content.id;
		$('#deleteStockOutModal').modal('show');
	}

	$scope.deleteStockOutContent = function(req_id){
		var co_data = {};
	      	co_data.id = req_id;
	        co_data.token = $cookies.get("accelerateVegaDeskAdmin");

	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/erpdeletestockouthistory.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){			      
			      	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'delete'); 
			      	$('#deleteStockOutModal').modal('hide');
			}
			else{
				$scope.deleteError = response.data.error;
			}
	         });		         	         
	}

	$scope.confirmDeletePurchase = function(content){
		$scope.deleteItemId = content.id;
		$scope.deleteItemQuantity = content.quantity;
		$scope.deleteItemName = content.inventoryName;
		$scope.deleteItemVendor = content.vendorName;
		$scope.deleteItemDate = content.date;

		$scope.deleteUID = content.id;
		$('#deletePurchaseModal').modal('show');
	}

	$scope.deletePurchaseContent = function(req_id){
		var co_data = {};
	      	co_data.id = req_id;
	        co_data.token = $cookies.get("accelerateVegaDeskAdmin");

	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/erpdeleteinventorypurchasehistory.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){			      
			      	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'delete'); 
			      	$('#deletePurchaseModal').modal('hide');
			}
			else{
				$scope.deleteError = response.data.error;
			}
	         });		         	         
	}

	$scope.confirmDeletePayment = function(content){
		$scope.deleteItemName = content.name;
		$scope.deleteItemAmount = content.amount;
		$scope.deleteItemVendor = content.paymentTo;
		$scope.deleteItemDate = content.date;
		$scope.deleteItemId = content.paymentFor;

		$scope.deleteUID = content.id;
		$('#deletePaymentModal').modal('show');
	}

	$scope.deletePaymentContent = function(req_id){
			var co_data = {};
	      	co_data.id = req_id;
	        co_data.token = $cookies.get("accelerateVegaDeskAdmin");

	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/erpdeleteinventorypaymentshistory.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){			      
			      	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'delete'); 
			      	$('#deletePaymentModal').modal('hide');
			}
			else{
				$scope.deleteError = response.data.error;
			}
	         });		         	         
	}

	//View Content
	$scope.viewMyContent = function(content){
		$scope.viewContent = content;
		$('#viewModal').modal('show');		
	}
	
	//New Content
	$scope.addNewContent = {};
	$scope.newContentSet = function(){

		document.getElementById("dropStockOutInventory").innerHTML = '';
		document.getElementById("dropPurchaseVendor").innerHTML = '';
		document.getElementById("dropPurchaseInventory").innerHTML = '';
		document.getElementById("dropPaymentVendor").innerHTML = '';
		document.getElementById("dropPaymentInventory").innerHTML = '';


		$scope.addNewContent.quantity = "";
		$scope.addNewContent.remarks = "";
		$scope.addNewContent.id = "";

		$scope.addNewContent.unitsPurchased = "";
		$scope.addNewContent.vendorId = "";
		$scope.addNewContent.comments = "";
		$scope.addNewContent.paymentMode = "CASH";
		$scope.addNewContent.totalAmount = "";

		$scope.addNewContent.paymentReference = "";
		$scope.addNewContent.extraComments = "";
		
			$scope.currentDisplayPage = 1;
	      	$scope.totalDisplayPages = 1;
	      	$scope.isContentFound = false;
	}
	$scope.newContentSet();

	 $scope.saveNewContent = function(type){
		if(type == 'out'){

		    var tempObj = document.getElementById("dropStockOutInventory").value;
		    var itemObj = JSON.parse(decodeURI(tempObj));	

		    $scope.addNewContent.id = itemObj.code;
		    $scope.addNewContent.date = document.getElementById("inventory_date").value;

			if($scope.addNewContent.id == ""){
				$scope.newContentSaveError = "Choose an Inventory";
			}
			else if($scope.addNewContent.quantity == ""){
				$scope.newContentSaveError = "Mention Quantity";
			}
			else{
				//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");		      		
		      		var data = {};
		        	data.token = $cookies.get("accelerateVegaDeskAdmin");
		        	data.id = $scope.addNewContent.id;
		        	data.quantity = $scope.addNewContent.quantity;
		        	data.remarks = $scope.addNewContent.remarks;
		        	data.date = $scope.addNewContent.date;

			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/erpstockregisterentry.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              $('#loading').hide(); $("body").css("cursor", "default");
			              if(response.data.status){
			              	$scope.newContentSet();
			              	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'save');
			              }
			              else{
			              	$scope.newContentSaveError = response.data.error;
			              }
			         });
			}
		}


		else if(type == 'purchases'){ 

			var tempVendor = document.getElementById("dropPurchaseVendor").value;

			var tempObj = document.getElementById("dropPurchaseInventory").value;
		    var itemObj = JSON.parse(decodeURI(tempObj));	


		    $scope.addNewContent.vendorId = tempVendor;
		    $scope.addNewContent.item = itemObj.code;
		    $scope.addNewContent.purchaseDate = document.getElementById("purchase_date").value;
		    

				if($scope.addNewContent.vendorId == ""){
		      		$scope.newContentSaveError = "Choose a Vendor";
		      	}      
		      	else if($scope.addNewContent.item == ""){
		      		$scope.newContentSaveError = "Choose an Inventory";
		      	}
				else if($scope.addNewContent.unitsPurchased == ""){
		      		$scope.newContentSaveError = "Enter the purchased quantity";
		      	}
		      	else if($scope.addNewContent.purchaseDate == ""){
		      		$scope.newContentSaveError = "Enter purchase date";
		      	}
		      	else if($scope.addNewContent.paymentMode == ""){
		      		$scope.newContentSaveError = "Choose a payment method";
		      	}
		      	else if($scope.addNewContent.totalAmount == ""){
		      		$scope.newContentSaveError = "Enter the total amount";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
		      		
	
		      		var data = {};
		        	data.token = $cookies.get("accelerateVegaDeskAdmin");
		        	data.vendorId = $scope.addNewContent.vendorId;
		        	data.item = $scope.addNewContent.item;
		        	data.units = $scope.addNewContent.unitsPurchased;
		        	data.paymentMode = $scope.addNewContent.paymentMode;
		        	data.remarks = $scope.addNewContent.comments;   
		        	data.amount = $scope.addNewContent.totalAmount;
		        	data.date = $scope.addNewContent.purchaseDate; 

			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/erpaddinventorypurchasehistory.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              $('#loading').hide(); $("body").css("cursor", "default");
			              if(response.data.status){
			              	$scope.newContentSet();
			              	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'save');
			              }
			              else{
			              	$scope.newContentSaveError = response.data.error;
			              }
			         });
		      	}
		}		
		else if(type == 'payments'){


			var tempVendor = document.getElementById("dropPaymentVendor").value;
			var tempItem = document.getElementById("dropPaymentInventory").value;
		    var tempDate = document.getElementById("payment_date").value;



				if(tempVendor == "" && tempItem == ""){
		      		$scope.newContentSaveError = "Mention which Vendor you are paying to or what Item are you paying for?";
		      	}
		      	else if($scope.addNewContent.totalAmount == "" && $scope.addNewContent.totalAmount != 0){
		      		$scope.newContentSaveError = "Enter the amount";
		      	}
		      	else if($scope.addNewContent.paymentMode == ""){
		      		$scope.newContentSaveError = "Choose a payment mode";
		      	}
		      	else if(tempDate == ""){
		      		$scope.newContentSaveError = "Mention date of payment";
		      	}

		      	else{

		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
	
		      		var data = {};
		        	data.token = $cookies.get("accelerateVegaDeskAdmin");
		        	data.paymentTo = tempVendor;
		        	data.paymentFor = tempItem;
		        	data.amount = $scope.addNewContent.totalAmount;
		        	data.mode = $scope.addNewContent.paymentMode;
		        	data.reference = $scope.addNewContent.paymentReference;
		        	data.comments = $scope.addNewContent.extraComments;
		        	data.date = tempDate;

			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/erpaddinventorypaymentshistory.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              $('#loading').hide(); $("body").css("cursor", "default");
			              if(response.data.status){
			              	$scope.newContentSet();
			              	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'save');
			              }
			              else{
			              	$scope.newContentSaveError = response.data.error;
			              }
			         });
		      	}
		}
		
	
	}
	
	$scope.hideNewContent = function(){
		$scope.newContentSet();
		$scope.defaultFlagSet();
	}

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


});
