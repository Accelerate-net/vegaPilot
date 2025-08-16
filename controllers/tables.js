angular.module('tablesApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('tablesController', function($scope, $http, $interval, $cookies) {

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


    
        
      /* Initialisations Sections & Tables */
      
      $scope.isSectionsFound = false;
      $scope.resultMessage = '';
      $scope.sectionsList = "";
      $scope.initSections = function(){
	
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");
	      
	      console.log(data)
	      
	      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchtablesections.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	       console.log(response)
	       $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
	         if(response.data.status){
	
	           $scope.isSectionsFound = true;
	           $scope.sectionsList = response.data.response;

	         }
	         else{
	           $scope.isSectionsFound = false;
	           $scope.resultMessage = "There are no Sections found.";
	         }
	        });
	}
	
	
	
	$scope.initSections();
	

      /* TABLES */
      
      $scope.isTablesFound = false;
      $scope.resultMessageTables = '';
      $scope.tablesList = "";
      
      $scope.initTables = function(){
	
	      var data = {};
	      data.token = $cookies.get("acceleronLunaAdminToken");	      
	      
	      $('#vegaPanelBodyLoaderTables').show(); $("body").css("cursor", "progress");
	      $http({
	        method  : 'POST',
	        url     : 'https://accelerateengine.app/food-engine/apis/deskfetchtables.php',
	        data    : data,
	        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	       })
	       .then(function(response) {
	       $('#vegaPanelBodyLoaderTables').hide(); $("body").css("cursor", "default");
	         if(response.data.status){
	
	           $scope.isTablesFound = true;
	           $scope.tablesList = response.data.response;

	         }
	         else{
	           $scope.isTablesFound = false;
	           $scope.resultMessageTables = "There are no Tables found.";
	         }
	        });
	}
	
	
	
	$scope.initTables();
	
	


   /* Sections Operations */	
      
      
   
      
      $scope.deleteSection = function(id, showName){
       		$scope.cancelItemCode = id;
       		$scope.cancelShowName = showName != ""? showName: "with unknown name";       	
       		$('#deleteSectionModal').modal('show');      
      }
      
      $scope.confirmDeleteSection = function(code){
	    	var data = {};
	    	data.id = code;
	        data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/deskdeletetablesection.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         	$('#deleteSectionModal').modal('hide');
	         	if(response.data.status){	   
	         		$scope.initSections();
	         		$scope.initTables();
	              	}
	              	else{
		              	alert(response.data.error);
	              	}
	         });         
      }
                              
         
         
     
     $scope.openNewSection = function(){
     	$('#tableModal').modal('hide');
     	$scope.newSectionContent = {};
     	$scope.newSectionContent.name = "";
     	$scope.newSectionError = "";
     	$('#sectionModal').modal('show');
     }
     
	    
	$scope.saveNewSection = function(){
		
		$scope.newSectionError = "";
		
		if($scope.newSectionContent.name == "" || !(/^[a-zA-Z ]+$/.test($scope.newSectionContent.name))){
			$scope.newSectionError = "Invalid Section Name";
		}
		else{
			$scope.newSectionError = "";
			
			var data = {};
		    	data.name = $scope.newSectionContent.name;
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/deskaddtablesection.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {	         	
		         	if(response.data.status){	   
		         		$scope.initSections();
		         		$('#sectionModal').modal('hide');
		              	}
		              	else{
			              	$scope.newSectionError = response.data.error;
		              	}
		         });  
		}
	
	}
	
	



	/* Tables Operations */
      
      
   
      
      $scope.deleteTable = function(showName){
       		$scope.cancelItemCode = showName;
       		$scope.cancelShowName = showName != ""? showName: "with unknown name";       	
       		$('#deleteTableModal').modal('show');      
      }
      
      $scope.confirmDeleteTable = function(code){
	    	var data = {};
	    	data.id = code;
	        data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/deskdeletetable.php',
	          data    : data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
	         	$('#deleteTableModal').modal('hide');
	         	if(response.data.status){	   
	         		$scope.initTables();
	              	}
	              	else{
		              	alert(response.data.error);
	              	}
	         });         
      }
                              
         
         
     
     $scope.openNewTable = function(){
     	$scope.newTableContent = {};
     	$scope.newTableContent.name = "";
     	$scope.newTableContent.capacity = "";
     	$scope.newTableContent.section = "";
     	$scope.newTableError = "";

	
     	$scope.isSectionExists = true;
     	if($scope.sectionsList.length == 0){
     		$scope.isSectionExists = false;
     	}


     	$('#tableModal').modal('show');
     }
     
	    
	$scope.saveNewTable = function(){
		
		$scope.newTableError = "";		
		
		if($scope.newTableContent.name == ""){
			$scope.newTableError = "Invalid Table Name";
		}
		else if($scope.newTableContent.capacity == ""){
			$scope.newTableError = "Invalid Capacity";
		}
		else if($scope.newTableContent.section == ""){
			$scope.newTableError = "Invalid Section";
		}		
		else{
			$scope.newTableError = "";					
			
			var data = {};
		    	data.name = $scope.newTableContent.name;
		    	data.section = $scope.newTableContent.section;
		    	data.capacity = $scope.newTableContent.capacity;
		        data.token = $cookies.get("acceleronLunaAdminToken");
		        console.log(data)
		        $http({
		          method  : 'POST',
		          url     : 'https://accelerateengine.app/food-engine/apis/deskaddtable.php',
		          data    : data,
		          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
		         })
		         .then(function(response) {	         	
		         	if(response.data.status){	   
		         		$scope.initTables();
		         		$('#tableModal').modal('hide');
		              	}
		              	else{
			              	$scope.newTableError = response.data.error;
		              	}
		         });  
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
