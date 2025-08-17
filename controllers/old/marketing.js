angular.module('marketingApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('marketingController', function($scope, $http, $interval, $cookies) {

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
      
      $scope.marketingType = 'combos';
      $scope.figure_active_combos = 0;
      $scope.figure_active_promotions = 0;
      $scope.figure_active_coupons = 0;   
      
      $scope.deleteError = "";
      
      //Default Flags
      $scope.defaultFlagSet = function(){
	      $scope.newComboWindowFlag = false;
	      $scope.newPromoWindowFlag = false;
	      $scope.newCouponWindowFlag = false;
	      
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
			      	case 'promotions':{
			      		current_entries = $scope.figure_active_promotions;
			      		break;
			      	}
			      	case 'combos':{
			      		current_entries = $scope.figure_active_combos;
			      		break;
			      	}
			      	case 'coupons':{
			      		current_entries = $scope.figure_active_coupons;
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
	        co_data.token = $cookies.get("acceleronLunaAdminToken");
	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/fetchmarketingcontent.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){
			
			      $scope.isContentFound = true;
			      
			      $scope.active_content = response.data.response;
				
			      $scope.figure_active_combos = response.data.totalCombos;
			      $scope.figure_active_promotions = response.data.totalPromotions;
			      $scope.figure_active_coupons = response.data.totalCoupons;
			      
			      //Update Total Pages
			      switch(type){
			      	case 'promotions':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_promotions/10);
			      		if($scope.figure_active_promotions == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      	case 'combos':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_combos/10);
			      		if($scope.figure_active_combos == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      	case 'coupons':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_coupons/10);
			      		if($scope.figure_active_coupons == 0){$scope.isContentFound = false;}
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
		$scope.marketingType = type;
		$scope.initializeContent(type, 1);
		//Styling
		switch(type) {
		    case 'combos':
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
		    case 'promotions':
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
		    case 'coupons':
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
	
	
	//New Creations
	$scope.showNewContentWindow = function(){
		switch($scope.marketingType){
			case 'combos':{
				$scope.newComboWindowFlag  = true;
				$scope.newPromoWindowFlag  = false;
				$scope.newCouponWindowFlag  = false;				
                       		
                       		break;
			}
			case 'promotions':{
				$scope.newComboWindowFlag  = false;
				$scope.newPromoWindowFlag  = true;
				$scope.newCouponWindowFlag  = false;
                       		
                       		break;			
			}
			case 'coupons':{
				$scope.newComboWindowFlag  = false;
				$scope.newPromoWindowFlag  = false;
				$scope.newCouponWindowFlag  = true;
                       		
                       		break;			
			}
		
		}
	}
	
	$scope.changeOfferType = function(){
		$scope.addNewContent.offer = !$scope.addNewContent.offer;
	}
	
	//Delete Confirmation
	$scope.confirmDelete = function(code, name){
		$scope.deleteDisplayName = name;
		$scope.deleteItemCode = code;
		$('#deleteModal').modal('show');
	}
	
	$scope.deleteContent = function(req_id){
		var co_data = {};
	      	co_data.type = $scope.marketingType;
	      	co_data.id = req_id;
	        co_data.token = $cookies.get("acceleronLunaAdminToken");

	        $http({
	          method  : 'POST',
	          url     : 'https://accelerateengine.app/food-engine/apis/deletemarketingcontent.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){			      
			      	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'delete'); 
			      	$('#deleteModal').modal('hide');
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
		$scope.addNewContent.code = "";
		$scope.addNewContent.name = "";
		$scope.addNewContent.price = "";
		$scope.addNewContent.brief = "";
		$scope.addNewContent.expiry = new Date();
		$scope.addNewContent.offer = false;
		
		$scope.isPhotoAttached = false;
		$scope.myPhotoURL = "";
		
		$scope.currentDisplayPage = 1;
	      	$scope.totalDisplayPages = 1;
	      	$scope.isContentFound = false;
	}
	$scope.newContentSet();
	
	
	
      
      	    //Image Cropper
      	    $scope.myImage = '';
	    $scope.myCroppedImage = '';
	    
	      var image = "";
	      $scope.cropBoxData;
	      $scope.canvasData;
	      $scope.cropper;
	
	    var handleFileSelect = function(evt) {
	      var file = evt.currentTarget.files[0];
	      var reader = new FileReader();
	      reader.onload = function (evt) {
	        $scope.$apply(function($scope){
	          $scope.myImage = evt.target.result;
	          setTimeout(function(){ 
	          	image = document.getElementById('image');
	          	$scope.cropper = new Cropper(image, {
	          	  aspectRatio: 16 / 9,
		          autoCropArea: 0.8,
		          scalable: false,
		          ready: function () {
		            // Strict mode: set crop box data first
		            $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
		          }
		        });		        
		  }, 1000);
		  $scope.photoLoadedToFrame = true;
	        });
	      };
	      reader.readAsDataURL(file);
	    };
	    angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
	    
	 $scope.attachPhoto = function(){
	 	$('#imageModal').modal('show');		
	 	$scope.photoLoadedToFrame = false; 	
	 }
	    
	 $scope.isPhotoAttached = false;
	 $scope.saveAttachment = function(){
	 	$scope.isPhotoAttached = true;	 
	        $scope.canvasData = $scope.cropper.getCroppedCanvas({
				  width: 853,
				  height: 480,
				  fillColor: '#fff',
				  imageSmoothingEnabled: false,
				  imageSmoothingQuality: 'high',
				});
				
		$scope.myPhotoURL = $scope.canvasData.toDataURL();
	        $scope.cropper.destroy();
	        $('#imageModal').modal('hide');		
	 }
	 
	 
	 $scope.saveNewContent = function(type){
		
		if(type == 'coupons'){ //1. Coupon 
			var todayDate = new Date();
		
			if($scope.addNewContent.code == ""){
		      		$scope.newContentSaveError = "Coupon Code can not be null";
		      	}      
		      	else if(!(/^[0-9a-zA-Z]+$/.test($scope.addNewContent.code))){
		      		$scope.newContentSaveError = "Coupon Code can have only numbers or letters";
		      	}
		      	else if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add a short description for the coupon";
		      	}
		      	else if($scope.addNewContent.expiry == "" || $scope.addNewContent.expiry < todayDate){
		      		$scope.newContentSaveError = "Add a futuristic expiry date";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
		      		
		      		//Processing expiry date
			      	var d = $scope.addNewContent.expiry;
			      	var dd = d.getDate();
				var mm = d.getMonth()+1;
				var yyyy = d.getFullYear();
				if(dd<10) {dd = '0'+dd;}
				if(mm<10) {mm = '0'+mm;}
				var myExpiryDate = dd+'-'+mm+'-'+yyyy;
		      		
		      		var data = {};
		      		data.type = "coupon";
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.code = $scope.addNewContent.code;
		        	data.brief = $scope.addNewContent.brief;
		        	data.expiry = myExpiryDate;   
   
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/newmarketingcontent.php',
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
		else if(type == 'promotions'){ //2. Promos 
			var todayDate = new Date();
		
			if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add a description";
		      	}
		      	else if($scope.addNewContent.expiry == "" || $scope.addNewContent.expiry < todayDate){
		      		$scope.newContentSaveError = "Add a futuristic expiry date";
		      	}
		      	else if(!$scope.addNewContent.offer && $scope.myPhotoURL == "" ){
		      		$scope.newContentSaveError = "Promotion must have a photo attachment";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
		      		
		      		//Processing expiry date
			      	var d = $scope.addNewContent.expiry;
			      	var dd = d.getDate();
				var mm = d.getMonth()+1;
				var yyyy = d.getFullYear();
				if(dd<10) {dd = '0'+dd;}
				if(mm<10) {mm = '0'+mm;}
				var myExpiryDate = dd+'-'+mm+'-'+yyyy;
		      		
		      		var data = {};
		      		data.type = "promotion";
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.brief = $scope.addNewContent.brief;
		        	data.sub = $scope.addNewContent.offer ? 'offer' : 'promotion';
		        	data.expiry = myExpiryDate;   
		        	data.url = $scope.myPhotoURL;      
		        	console.log(data)  	
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/newmarketingcontent.php',
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
		else if(type == 'combos'){ //3. Combo
			var todayDate = new Date();
		
			if($scope.addNewContent.name == ""){
		      		$scope.newContentSaveError = "Combo Name can not be null";
		      	}      
		      	else if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add a brief about the Combo Offer";
		      	}
		      	else if($scope.addNewContent.price == "" || $scope.addNewContent.price < 1 || isNaN($scope.addNewContent.price)){
		      		$scope.newContentSaveError = "Invalid Price";
		      	}
		      	else if($scope.addNewContent.expiry == "" || $scope.addNewContent.expiry < todayDate){
		      		$scope.newContentSaveError = "Add a futuristic expiry date";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
		      		
		      		//Processing expiry date
			      	var d = $scope.addNewContent.expiry;
			      	var dd = d.getDate();
				var mm = d.getMonth()+1;
				var yyyy = d.getFullYear();
				if(dd<10) {dd = '0'+dd;}
				if(mm<10) {mm = '0'+mm;}
				var myExpiryDate = dd+'-'+mm+'-'+yyyy;
		      		
		      		var data = {};
		      		data.type = "combo";
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.brief = $scope.addNewContent.brief;
		        	data.name = $scope.addNewContent.name;
		        	data.price = $scope.addNewContent.price;
		        	data.expiry = myExpiryDate;   
		        	data.url = $scope.myPhotoURL;      
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/newmarketingcontent.php',
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
