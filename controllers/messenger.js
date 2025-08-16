angular.module('messengerApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('messengerController', function($scope, $http, $interval, $cookies) {

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
      
      $scope.marketingType = 'sms';
      
      $scope.sms_last_used = '';
      $scope.push_last_used = '';
      
      $scope.deleteError = "";
      
      //Default Flags
      $scope.defaultFlagSet = function(){
	      $scope.newSMSWindowFlag = false;
	      $scope.newPushWindowFlag = false;
	      
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
			      	case 'push':{
			      		current_entries = $scope.figure_active_push;
			      		break;
			      	}
			      	case 'sms':{
			      		current_entries = $scope.figure_active_sms;
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
	          url     : 'https://accelerateengine.app/food-engine/apis/fetchmessengerhistory.php',
	          data    : co_data,
	          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	         })
	         .then(function(response) {
			if(response.data.status){
			
			      $scope.isContentFound = true;
			      
			      $scope.active_content = response.data.response;
				
			      $scope.figure_active_sms = response.data.totalSMS;
			      $scope.figure_active_push = response.data.totalPush;
			      
			      $scope.sms_last_used = response.data.smsLast;
     			      $scope.push_last_used = response.data.pushLast;
			      
			      //Update Total Pages
			      switch(type){
			      	case 'push':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_push/10);
			      		if($scope.figure_active_push == 0){$scope.isContentFound = false;}
			      		break;
			      	}
			      	case 'sms':{
			      		$scope.totalDisplayPages = Math.ceil($scope.figure_active_sms/10);
			      		if($scope.figure_active_sms == 0){$scope.isContentFound = false;}
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
	    document.getElementById("smsIcon").style.color = "#FFF";
	    document.getElementById("smsTag").style.color = "#FFF";
	    document.getElementById("smsCount").style.color = "#FFF";
	    document.getElementById("smsTabButton").style.background="#2980b9";
	
	    document.getElementById("pushIcon").style.color = "#ABB2B9";
	    document.getElementById("pushTag").style.color = "#ABB2B9";
	    document.getElementById("pushCount").style.color = "#ABB2B9";
	    document.getElementById("pushTabButton").style.background="#F1F1F1";

	    
	$scope.openType = function (type){
		$scope.active_content = {};
		$scope.marketingType = type;
		$scope.initializeContent(type, 1);
		//Styling
		switch(type) {
		    case 'sms':
		    {		    	
			    document.getElementById("smsIcon").style.color = "#FFF";
			    document.getElementById("smsTag").style.color = "#FFF";
			    document.getElementById("smsCount").style.color = "#FFF";
			    document.getElementById("smsTabButton").style.background="#2980b9";
			
			    document.getElementById("pushIcon").style.color = "#ABB2B9";
			    document.getElementById("pushTag").style.color = "#ABB2B9";
			    document.getElementById("pushCount").style.color = "#ABB2B9";
			    document.getElementById("pushTabButton").style.background="#F1F1F1";
		        
		            break;
		    }
		    case 'push':
		    {
			    document.getElementById("pushIcon").style.color = "#FFF";
			    document.getElementById("pushTag").style.color = "#FFF";
			    document.getElementById("pushCount").style.color = "#FFF";
			    document.getElementById("pushTabButton").style.background="#2980b9";
			
			    document.getElementById("smsIcon").style.color = "#ABB2B9";
			    document.getElementById("smsTag").style.color = "#ABB2B9";
			    document.getElementById("smsCount").style.color = "#ABB2B9";
			    document.getElementById("smsTabButton").style.background="#F1F1F1";
		        
		            break;
		    }
		} 
	}
	
	
	//New Creations
	$scope.showNewContentWindow = function(){
		switch($scope.marketingType){
			case 'sms':{
				$scope.newSMSWindowFlag  = true;
				$scope.newPushWindowFlag  = false;	
                       		
                       		break;
			}
			case 'push':{
				$scope.newSMSWindowFlag  = false;
				$scope.newPushWindowFlag  = true;
                       		
                       		break;			
			}
		
		}
	}
	
	$scope.changeOfferType = function(){
		$scope.addNewContent.offer = !$scope.addNewContent.offer;
	}
	
	
        //Characters Left in the SMS
        $scope.alertCount = "";
        $scope.smsCharCount = function() {
            $scope.alertCount = 140-(($scope.addNewContent.brief).length)+ ' characters left.';
        }
        
        //List of Classes
	$scope.myClassList = "";
	
	$.get("https://accelerateengine.app/food-engine/apis/fetchclassinfosimple.php", function(data){
          var temp = JSON.parse(data);
          if(temp.status){
		$scope.myClassList = temp.response;
          }
          else{
          	$scope.myClassList = [{value: 'CLASSIC'}, {value: 'IITM'}, {value: 'FRESHER'} , {value: 'SILVER'}, {value: 'PLATINUM'}];
          }
      	});          	
	
	
	
	//Report Generation Confirmation
	$scope.generateReport = function(code, mytype){
		var temp_token = encodeURIComponent($cookies.get("acceleronLunaAdminToken"));
		window.open ("https://accelerateengine.app/food-engine/apis/fetchmessengersummary.php?access="+temp_token+"&uid="+code+"&type="+mytype);
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
		document.getElementById("tokenfield-typeahead").value = "";

		
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
		 
		if(type == 'push'){ //1. Push
			var todayDate = new Date();
		
			if($scope.addNewContent.title == ""){
		      		$scope.newContentSaveError = "Add a title";
		      	}
		      	if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add a description";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");

		      		var data = {};
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.brief = $scope.addNewContent.brief;
		        	data.title = $scope.addNewContent.title;
		        	data.url = $scope.myPhotoURL;      
		        		
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/pushcampaigncreate.php',
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
		else if(type == 'sms'){ //2. SMS
		
			if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add the content";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");

		      		
		      		var data = {};
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.content = $scope.addNewContent.brief;
		        	data.name = $scope.addNewContent.name;
		        	data.target = document.getElementById("tokenfield-typeahead").value;   
		        	console.log(data) 
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/smscampaign.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              $('#loading').hide(); $("body").css("cursor", "default");
			              if(response.data.status){
			              
			              	$scope.smsConfirmModalText = response.data.checkText+'.';
			              	$scope.smsConfirmModalClasswise = response.data.response;
			              	$scope.sendCost = response.data.totalExpectedCost;
			              	
			              	$('#sendConfirmationModal').modal('show');
			              	//$scope.newContentSet();
			              	//$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'save');
			              }
			              else{
			              	$scope.newContentSaveError = response.data.error;
			              }
			         });
		      	}
		}	
	
	}
	
	
	
	$scope.submitSMS = function(){				
		
			if($scope.addNewContent.brief == ""){
		      		$scope.newContentSaveError = "Add the content";
		      	}
		      	else{
		      		//Add to server
		      		$scope.newContentSaveError = "";
		      		
		      		$('#loading').show(); $("body").css("cursor", "progress");
		      		
		      		var data = {};
		        	data.token = $cookies.get("acceleronLunaAdminToken");
		        	data.content = $scope.addNewContent.brief;
		        	data.name = $scope.addNewContent.name;
		        	data.target = document.getElementById("tokenfield-typeahead").value;   
			        $http({
			          method  : 'POST',
			          url     : 'https://accelerateengine.app/food-engine/apis/smscampaigncreate.php',
			          data    : data,
			          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
			         })
			         .then(function(response) {
			              $('#loading').hide(); $("body").css("cursor", "default");
			              if(response.data.status){			              	
			              	$('#sendConfirmationModal').modal('hide');
			              	$scope.newContentSet();
			              	$scope.initializeContent($scope.marketingType, $scope.currentDisplayPage, 'save');
			              }
			              else{
			              	$scope.newContentSaveError = response.data.error;
			              }
			         });
		      	}	
	}
	
	
	
	$scope.hideNewContent = function(){
		$scope.newContentSet();
		$scope.defaultFlagSet();
	}
	
	$scope.addTarget = function(targetName){
		if(document.getElementById("tokenfield-typeahead").value == ""){
			$('#tokenfield-typeahead').val(targetName).trigger('change');
		}
		else{
			$('#tokenfield-typeahead').val(document.getElementById("tokenfield-typeahead").value+', '+targetName).trigger('change');
		}	
		
		document.getElementById('button_'+targetName).style.display = 'none';			
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
