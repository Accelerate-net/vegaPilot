angular.module('vendorsApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('vendorsController', function($scope, $http, $interval, $cookies) {

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

    $('.js-example-basic-single').select2();

    $scope.outletCode = localStorage.getItem("branch");



      //Search Key
      $scope.isSearched = false;
      $scope.searchID = '';
      $scope.isReservationsFound = false;
      $scope.resultMessage = '';
      $scope.filterTitle = 'Vendors List';

      //Default Results : Reservations of the Week
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+'-'+mm+'-'+yyyy;
      
      $scope.todayDate = today;


$scope.initVendors = function(){

      var data = {};
      data.token = $cookies.get("accelerateVegaDeskAdmin");
      
      data.id = 0;

      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/erpfetchvendors.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
       $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
       console.log(response.data)
         if(response.data.status){
           $scope.isReservationsFound = true;
           $scope.vendorList = response.data.response;
         }
         else{
           $scope.isReservationsFound = false;
           $scope.resultMessage = "There are no vendors added yet.";
         }
        });
}
$scope.initVendors();


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

         
         $scope.showCancel = function(vendor){
         
       		$scope.cancelItemCode = vendor.code;
       		$scope.cancelShowName = vendor.name;
       	
       		$('#cancelModal').modal('show');
         
         }
         
        $scope.confirmCancel = function(code){
    	    	  var data = {};
    	    	  data.code = code;
    	        data.token = $cookies.get("accelerateVegaDeskAdmin");

    	        $http({
    	          method  : 'POST',
    	          url     : 'https://accelerateengine.app/food-engine/apis/erpdeleteinventoryvendors.php',
    	          data    : data,
    	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
    	         })
    	         .then(function(response) {
    	         	$('#cancelModal').modal('hide');
    	         	      if(response.data.status){	   
    	         		      $scope.initVendors();
    	              	}
    	              	else{
    		              	alert(response.data.error);
    	              	}
    	         });         
         }
         
         
         
     //Add new reservation
     $scope.nullNewVendor = function(){
     	$scope.newVendor = {};
     	$scope.newVendor.name = "";
     	$scope.newVendor.contact = "";
     	$scope.newVendor.address = "";
     	$scope.newVendor.modeOfPayment = "";
     	$scope.newVendor.paymentReference = ""; 

      document.getElementById("dropProvidingBranches").innerHTML = '';
      document.getElementById("dropProvidingInventories").innerHTML = ''; 
     }
     $scope.nullNewVendor();
     
     
     $scope.openNewVendor = function(){
     	$scope.nullNewVendor();


            var data = {}; 
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            //fetch inventory list, branches list etc.
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpnewvendormetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    if(response.data.status){
                      $scope.metaBranchesList = response.data.branches;
                      $scope.metaInventoryList = response.data.inventories;

                      var n = 0;
                      var listing = '';
                      while($scope.metaBranchesList[n]){
                        listing = listing + '<option value="'+$scope.metaBranchesList[n].code+'">'+$scope.metaBranchesList[n].name+'</option>';
                        

                        if(n == $scope.metaBranchesList.length - 1){
                          document.getElementById("dropProvidingBranches").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
                        }

                        n++;
                      }


                      var m = 0;
                      var items = '';
                      while($scope.metaInventoryList[m]){
                        items = items + '<option value="'+$scope.metaInventoryList[m].code+'">'+$scope.metaInventoryList[m].name+'</option>';
                        

                        if(m == $scope.metaInventoryList.length - 1){
                          document.getElementById("dropProvidingInventories").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ items;
                          $('#newVendorModal').modal('show');
                        }

                        m++;
                      }



                    }
             });  


     }
     

     $scope.showEdit = function(obj){

      $scope.editVendor = obj;
      $scope.editDisplayName = $scope.editVendor.name;

      var tempBranchList = [];
      var tempInventoryList = [];

      console.log($scope.editVendor)

      if(($scope.editVendor.branchesProvided).length > 0){
        var j = 0;
        while($scope.editVendor.branchesProvided[j]){
          tempBranchList.push($scope.editVendor.branchesProvided[j].code)
          j++;
        }  
      }

      if(($scope.editVendor.inventoriesProvided).length > 0){
        var k = 0;
        while($scope.editVendor.inventoriesProvided[k]){
          tempInventoryList.push($scope.editVendor.inventoriesProvided[k].code)
          k++;
        }  
      }

      
            var data = {}; 
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            //fetch categories list, vendors list etc.
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpnewvendormetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    if(response.data.status){

                      $scope.metaBranchesList = response.data.branches;
                      $scope.metaInventoryList = response.data.inventories;

                      console.log($scope.metaBranchesList)

                      var n = 0;
                      var listing = '';
                      while($scope.metaBranchesList[n]){
                        listing = listing + '<option value="'+$scope.metaBranchesList[n].code+'">'+$scope.metaBranchesList[n].name+'</option>';
                        

                        if(n == $scope.metaBranchesList.length - 1){
                          document.getElementById("dropProvidingBranchesEdit").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
                        
                        }

                        n++;
                      }


                      var m = 0;
                      var items = '';
                      while($scope.metaInventoryList[m]){
                        items = items + '<option value="'+$scope.metaInventoryList[m].code+'">'+$scope.metaInventoryList[m].name+'</option>';
                        

                        if(m == $scope.metaInventoryList.length - 1){
                          document.getElementById("dropProvidingInventoriesEdit").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ items;
                          
                          $('#editVendorModal').modal('show');

                          //Prefill branches list
                          $('#dropProvidingBranchesEdit').select2({}).select2('val', tempBranchList);

                          //Prefill branches list
                          $('#dropProvidingInventoriesEdit').select2({}).select2('val', tempInventoryList);

                          
                        }

                        m++;
                      }

                    }
             });  

     }



 

	$scope.saveNewVendor = function(){

		var tempInventories = $("#dropProvidingInventories").val();
    var tempBranches = $("#dropProvidingBranches").val();
		
		$scope.newVendorError = "";
		
		if($scope.newVendor.name == "" || !(/^[a-zA-Z ]+$/.test($scope.newVendor.name))){
			$scope.newVendorError = "Invalid Name";
		}
		else if($scope.newVendor.contact == ""){
			$scope.newVendorError = "Invalid Contact Number";
		}
		else if($scope.newVendor.address == ""){
			$scope.newVendorError = "Invalid Address";
		}
		else if($scope.newVendor.modeOfPayment == ""){
			$scope.newVendorError = "Invalid Mode of Payment";
		}
		else{
			$scope.newVendorError = "";
			
			      var data = {};
            data.details = $scope.newVendor;
            if(tempInventories && tempInventories.length > 0){
              data.inventoriesList = tempInventories;
            }
            if(tempBranches && tempBranches.length > 0){
              data.branchesList = tempBranches;
            }

		        data.token = $cookies.get("accelerateVegaDeskAdmin");

		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/erpaddinventoryvendors.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	      $('#newVendorModal').modal('hide');
		         	      if(response.data.status){	   
		         		      $scope.initVendors();
		              	}
		              	else{
			              	alert(response.data.error);
		              	}
		         });  
		}
	
	}
	
	
	
	$scope.saveEditVendor = function(){

		var tempInventories = $("#dropProvidingInventoriesEdit").val();
    var tempBranches = $("#dropProvidingBranchesEdit").val();
    		
		$scope.editVendorError = "";
		
		if($scope.editVendor.name == ""){
			$scope.editVendorError = "Invalid Name";
		}
		else if($scope.editVendor.contact == ""){
			$scope.editVendorError = "Invalid Contact Number";
		}
		else if($scope.editVendor.address == ""){
			$scope.editVendorError = "Invalid Address";
		}
		else if($scope.editVendor.modeOfPayment == ""){
			$scope.editVendorError = "Invalid Mode of Payment";
		}
		else{
			$scope.editVendorError = "";
			
			       var data = {};
		    	   data.details = $scope.editVendor;
		         data.token = $cookies.get("accelerateVegaDeskAdmin");
             
             data.id = $scope.editVendor.code;
             data.inventoriesList = tempInventories;
             data.branchesList = tempBranches;

            $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/erpeditinventoryvendors.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {
		         	$('#editVendorModal').modal('hide');
		         	      if(response.data.status){	   
		         		      $scope.initVendors();
		              	}
		              	else{
			              	alert(response.data.error);
		              	}
		         });  
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
        
  })
  ;
