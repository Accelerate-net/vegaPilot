angular.module('StandardMenuApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


  .controller('standardMenuController', function($scope, $http, $interval, $cookies) {

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


    $scope.showToast = function(content, timer){
               	var x = document.getElementById("loadingbar")
		x.innerHTML = content;
		x.className = "show";
		
		if(timer && timer != ''){
			setTimeout(function(){ x.className = x.className.replace("show", ""); }, timer);  
		}      
    }
    
    $scope.hideToast = function(){
               	var x = document.getElementById("loadingbar")
		x.className = x.className.replace("show", "");       
    }
    
    

      $scope.outletCode = localStorage.getItem("branch");

      $http.get("https://accelerateengine.app/food-engine/apis/specialfetchstandardmenu.php?token="+encodeURIComponent($cookies.get("acceleronLunaAdminToken"))).then(function(response) {
          $scope.menu = response.data;
      });

      $scope.cuisine = "";
      $scope.showCuisineItems = function(cuisineCode){
        var i = 0;
        while(i < $scope.menu.length){
          if($scope.menu[i].mainType == cuisineCode)
          {
            $scope.cuisine = $scope.menu[i];
            break;
          }
          i++;
        }

        //$scope.initializeMenu();
      }

      $scope.initializeMenu = function(){
        $http.get("https://accelerateengine.app/food-engine/apis/specialfetchstandardmenu.php?token="+encodeURIComponent($cookies.get("acceleronLunaAdminToken"))).then(function(response) {
            $scope.menu = response.data;
        });
      }
      
      
      $scope.reinitialiseCuisineItems = function(cuisineCode){
      
	      $http.get("https://accelerateengine.app/food-engine/apis/specialfetchstandardmenu.php?token="+encodeURIComponent($cookies.get("acceleronLunaAdminToken"))).then(function(response) {
	            	$scope.menu = response.data;
	            
	            	var i = 0;
		        while(i < $scope.menu.length){
		          if($scope.menu[i].mainType == cuisineCode)
		          {
		            $scope.cuisine = $scope.menu[i];
		            break;
		          }
		          i++;
		        }
	        });
        
      }


	
      $scope.isShowingStandardisationWindow = false;
      $scope.standardisationContent = {};


      $scope.openStandardisationWindow = function(item_code){
      
        $scope.backup_original_item_code = "";
        $scope.backup_original_photo = "";

        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        data.code = item_code;
        
        $scope.showToast('<i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size: 100%"></i> Loading');
        
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/specialgetitemstandards.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
         		$scope.hideToast();
         		$scope.standardisationContent = response.data.details;
         		
         		$scope.backup_original_item_code = item_code;
         		$scope.backup_original_photo = $scope.standardisationContent.imageData;
         		
         		if($scope.standardisationContent.imageData && $scope.standardisationContent.imageData != ''){
         			$scope.isPhotoAttached = true;
         			$scope.myPhotoURL = $scope.standardisationContent.imageData;
         		}
         		else{
         			$scope.isPhotoAttached = false;
         		}
         		
         		console.log($scope.standardisationContent)
         		$scope.isShowingStandardisationWindow = true;
         		$scope.renderSubCategoryName();
         	}else{
         		$scope.hideToast();
         		alert("Error: "+response.data.error);
         		$scope.isShowingStandardisationWindow = false;
         		
         		$scope.backup_original_item_code = "";
         		$scope.backup_original_photo = "";
         	}
         });
      }
      
      $scope.allCategoryList = [];
      $scope.initialiseCategories = function(){
        
        var data = {};
        data.token = $cookies.get("acceleronLunaAdminToken");
        
        $http({
          method  : 'POST',
          url     : 'https://accelerateengine.app/food-engine/apis/specialgetcategories.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
         	if(response.data.status){
         		$scope.allCategoryList = response.data.list;
         	}else{
         		$scope.allCategoryList = [];
         	}
         });  
      }
      
      $scope.initialiseCategories();
      
      
      
      $scope.subCategoryList = [];
      
      $scope.updateSubCategories = function(){
      	
	      	if($scope.allCategoryList.length == 0){
	      		$scope.subCategoryList = [];
	      	}
	      	else{
	      		var n = 0;
	      		while($scope.allCategoryList[n]){
	      			if($scope.allCategoryList[n].category == $scope.standardisationContent.mainCategory){
	      				$scope.subCategoryList = $scope.allCategoryList[n].list;
	      				break;
	      			}
	      			n++;
	      		}
	      	}
	      	
	      	
	      	//initialise default value
	      	if($scope.subCategoryList.length > 0){
	      		$scope.standardisationContent.subCategory = $scope.subCategoryList[0].value;
	      	}
	      	else{
	      		$scope.standardisationContent.subCategory = "";
	      	}
      		
      }
      
      
      
      $scope.renderSubCategoryName = function(){
	      	if($scope.allCategoryList.length == 0){
	      		$scope.subCategoryList = [];
	      		$scope.standardisationContent.subCategory = "";
	      	}
	      	else{
	      		var n = 0;
	      		while($scope.allCategoryList[n]){
	      			if($scope.allCategoryList[n].category == $scope.standardisationContent.mainCategory){
	      				
	      				$scope.subCategoryList = $scope.allCategoryList[n].list;
	      				for(var i = 0; i < $scope.subCategoryList.length; i++){
	      					if($scope.subCategoryList[i].value == $scope.standardisationContent.subCategory){
	      						$scope.standardisationContent.subCategory = $scope.subCategoryList[i].value;
	      						break;
	      					}
	      				}
	      				
	      				break;
	      			}
	      			n++;
	      		}
	      	}      
      }
      
      
      
      $scope.addMoreIngredient = function(){
	      	
	      	if($scope.standardisationContent.composition == "" || !$scope.standardisationContent.composition){
	      		$scope.standardisationContent.composition = [];
	      		
	      	}
	      	
      			
	      	if($scope.standardisationContent.isCustom == 1){
	      		if($scope.standardisationContent.custom == "" || !$scope.standardisationContent.custom){
		      		$scope.standardisationContent.composition.push({
		      			"name" : "",
		      			"quantity" : [{ 
		      				"choice": "", 
		      				"value": "" 
		      				}]
		      		});
	      		}
	      		else{
	      			var composition_unit = [];
	      			var n = 0;
	      			while($scope.standardisationContent.custom[n]){
		      			composition_unit.push({
		      				"choice": $scope.standardisationContent.custom[n].customName,
		      				"value": ""
		      			})
		      			n++;
		      		}
		      		
		      		$scope.standardisationContent.composition.push({
		      			"name" : "",
		      			"quantity" : composition_unit
		      		});
	      		}
	      	}
	      	else{
		      	$scope.standardisationContent.composition.push({
	      			"name" : "",
	      			"quantity" : [{ 
	      				"choice": "", 
	      				"value": "" 
	      				}]
	      		});
	      	}
      	
      		
      		
      }
      
      $scope.updateCompositionArray = function(){
      
	      if($scope.standardisationContent.composition && $scope.standardisationContent.composition != ""){
	      	var n = 0;
	      	while($scope.standardisationContent.composition[n]){
	      		$scope.standardisationContent.composition[n].quantity.push({
	      			"choice": "",
	      			"value": ""
	      		});
	      		
	      		n++;
	      	}
	      }
      }
      
      $scope.adjustCompositionChoiceName = function(index){
      	/*
      		At 'index' of every $scope.standardisationContent.composition[n].quantity[index].choice 
      		to be updated with
      		$scope.standardisationContent.custom[index].customName
      	*/
      	
      	if($scope.standardisationContent.composition && $scope.standardisationContent.composition != ""){
	      	var n = 0;
	      	while($scope.standardisationContent.composition[n]){
	      		$scope.standardisationContent.composition[n].quantity[index].choice = $scope.standardisationContent.custom[index].customName;
	      		n++;
	      	}
	}
      
      }
      
      
      
      $scope.removeIngredient = function(index){
      	$scope.standardisationContent.composition.splice(index, 1);
      }
      
      
      $scope.adjustCompositionList = function(index){
      	if($scope.standardisationContent.composition == "" || !$scope.standardisationContent.composition){
	  	return ''; 		
	}
	else{
		var n = 0;
		while($scope.standardisationContent.composition[n]){
			$scope.standardisationContent.composition[n].quantity.splice(index, 1);
			n++;
		}
	}
      };
            
      
      $scope.addMoreChoice = function(){
	      	
	      	if($scope.standardisationContent.custom == "" || !$scope.standardisationContent.custom){
	      		$scope.standardisationContent.custom = [];
	      		
	      	}
      	
      		$scope.standardisationContent.custom.push({
      			"customName" : "",
      			"customPrice" : 0
      		});
      		
      		$scope.adjustPriceRange();
      		$scope.updateCompositionArray();
      }
      
      $scope.removeChoice = function(index){
      	$scope.standardisationContent.custom.splice(index, 1);
      	$scope.adjustCompositionList(index);
      	$scope.adjustPriceRange();
      }
      
      $scope.adjustPriceRange = function(){
      	if($scope.standardisationContent.custom == "" || !$scope.standardisationContent.custom){
      		$scope.standardisationContent.itemPrice = "-";
      	}
      	else if($scope.standardisationContent.custom.length == 0){
      		$scope.standardisationContent.itemPrice = "-";
      	}
      	else if($scope.standardisationContent.custom.length == 1){
      		$scope.standardisationContent.itemPrice = $scope.standardisationContent.custom[0].customPrice;
      	}
      	else{
      		var min = 0;
      		var max = 0;
      		
      		var n = 0;
      		while($scope.standardisationContent.custom[n]){
      			
      			if (parseInt($scope.standardisationContent.custom[n].customPrice) > parseInt($scope.standardisationContent.custom[max].customPrice)) {
                            max = n;
                        }
                        if (parseInt($scope.standardisationContent.custom[min].customPrice) > parseInt($scope.standardisationContent.custom[n].customPrice)) {
                            min = n;
                        }
                        
      			n++;
      		}
      		
      		
      		if ($scope.standardisationContent.custom[min].customPrice != $scope.standardisationContent.custom[max].customPrice) {
			$scope.standardisationContent.itemPrice = $scope.standardisationContent.custom[min].customPrice + '-' + $scope.standardisationContent.custom[max].customPrice;
		} else {
		      $scope.standardisationContent.itemPrice = $scope.standardisationContent.custom[min].customPrice;
		}
      	}
      	
      }
      
      $scope.clearCustomPricing = function(){
      	$scope.standardisationContent.itemPrice = 0;
      	$scope.standardisationContent.custom = [];
      	
      	if(!$scope.standardisationContent.composition || $scope.standardisationContent.composition == ""){
      		//skip
      	}
      	else{
      		/* 
      			Keep only first CHOICE NAME inside the Composition list
      			if at all anything was added
      		*/
      	
      		var remember_content = {};	
      	
      		var n = 0;
      		while($scope.standardisationContent.composition[n]){
      			var size = $scope.standardisationContent.composition[n].quantity.length;
      			$scope.standardisationContent.composition[n].quantity.splice(1, size - 1);
      			n++;
      		}
      		
      	}
      }
     




      
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
                aspectRatio: 1 / 1,
              autoCropArea: 0.9,
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
	
	   $scope.removePhoto = function(){
	    $scope.isPhotoAttached = false;
	    $scope.myPhotoURL = '';
	   }
	      
	   $scope.isPhotoAttached = false;
	   $scope.saveAttachment = function(){
	        $scope.isPhotoAttached = true;   
	          $scope.canvasData = $scope.cropper.getCroppedCanvas({
	          width: 540,
	          height: 540,
	          fillColor: '#fff',
	          imageSmoothingEnabled: false,
	          imageSmoothingQuality: 'high',
	        });
	        
	          $scope.myPhotoURL = $scope.canvasData.toDataURL();
	          $scope.cropper.destroy();
	          $('#imageModal').modal('hide');   
	   }




	$scope.cancelStandardisationView = function(){
		$scope.isShowingStandardisationWindow = false;
		$scope.standardisationContent = {};
	}
	
	
	$scope.errorMessage = "";
	$scope.updateCurrentItem = function(){
		
		$scope.errorMessage = "";
	
		/* Registration */
		if(!$scope.standardisationContent.itemCode || $scope.standardisationContent.itemCode == "" || isNaN($scope.standardisationContent.itemCode)){
			$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Item Code has to be a valid Number', 3000);
			return '';
		}
		
		if(!$scope.standardisationContent.itemName || $scope.standardisationContent.itemName == ""){
			$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Item Name not set', 3000);
			return '';
		}
		
		if(!$scope.standardisationContent.mainCategory || $scope.standardisationContent.mainCategory == ""){
			$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Main Category missing', 3000);
			return '';
		}
		
		if(!$scope.standardisationContent.subCategory || $scope.standardisationContent.subCategory == ""){
			$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Sub Category missing', 3000);
			return '';
		}
		
		
		/* Custom Pricing */
		if($scope.standardisationContent.isCustom != 0 && $scope.standardisationContent.isCustom != 1){
			$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Custom Pricing unknown', 3000);
			return '';
		}
		else{
			//not a custom item
			if($scope.standardisationContent.isCustom == 0){
				if(!$scope.standardisationContent.itemPrice || $scope.standardisationContent.itemPrice == "" || isNaN($scope.standardisationContent.itemPrice) || $scope.standardisationContent.itemPrice < 1){
					$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Item Price has to be a Number', 3000);
					return '';
				}
			}
			else{ //custom item
				if(!$scope.standardisationContent.custom || $scope.standardisationContent.custom == "" || $scope.standardisationContent.custom == []){
					$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Add atleast one Custom Choice', 3000);
					return '';
				}
				else{
					var n = 0;
					while($scope.standardisationContent.custom[n]){
						
						if(!$scope.standardisationContent.custom[n].customName || $scope.standardisationContent.custom[n].customName == ''){
							$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Custom Choice '+(n+1)+' is missing', 3000);
							return ''
						}
						
						if(!$scope.standardisationContent.custom[n].customPrice || $scope.standardisationContent.custom[n].customPrice == '' || isNaN($scope.standardisationContent.custom[n].customPrice) || $scope.standardisationContent.custom[n].customPrice < 1){
							$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Price of Custom Choice '+(n+1)+' has to be a Number', 3000);
							return ''
						}
						
						n++;
					}
				
				}
				
			}
		
		}
		
		
		/* Major Composition */
		if(!$scope.standardisationContent.composition || $scope.standardisationContent.composition == "" || $scope.standardisationContent.composition == []){
			//Composition not added --> SKIP
		}
		else{
			
			var n = 0;
			while($scope.standardisationContent.composition[n]){
						
				if(!$scope.standardisationContent.composition[n].name || $scope.standardisationContent.composition[n].name == ''){
					$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Composition Raw Ingredient '+(n+1)+' is missing', 3000);
					return ''
				}
				
				for(var i = 0; i < $scope.standardisationContent.composition[n].quantity.length; i++){		
					if(!$scope.standardisationContent.composition[n].quantity[i].value || $scope.standardisationContent.composition[n].quantity[i].value == '' || $scope.standardisationContent.composition[n].quantity[i].value < 1){
						$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Quantity of Raw Ingredient '+(n+1)+' has to be a Number', 3000);
						return ''
					}
				}
						
				n++;
			}
		
		}
		
		
		
		/* Properties */
		if(!$scope.standardisationContent.isVeg || $scope.standardisationContent.isVeg == ""){
			$scope.standardisationContent.isVeg = 3; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.isVeg == 0 || $scope.standardisationContent.isVeg == 1){
				//ok
			}
			else{
				$scope.standardisationContent.isVeg = 3;
			}
		}


		if(!$scope.standardisationContent.majorContent || $scope.standardisationContent.majorContent == ""){
			$scope.standardisationContent.majorContent = 0; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.majorContent == 1 || $scope.standardisationContent.majorContent == 2 || $scope.standardisationContent.majorContent == 3 || $scope.standardisationContent.majorContent == 4 || $scope.standardisationContent.majorContent == 5){
				//ok
			}
			else{
				$scope.standardisationContent.majorContent = 0;
			}
		}
		
		if(!$scope.standardisationContent.spiceLevel || $scope.standardisationContent.spiceLevel == ""){
			$scope.standardisationContent.spiceLevel = 0; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.spiceLevel == 1 || $scope.standardisationContent.spiceLevel == 2 || $scope.standardisationContent.spiceLevel == 3){
				//ok
			}
			else{
				$scope.standardisationContent.spiceLevel = 0;
			}
		}
		
		
		if(!$scope.standardisationContent.cookingType || $scope.standardisationContent.cookingType == ""){
			$scope.standardisationContent.cookingType = 0; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.cookingType == 1 || $scope.standardisationContent.cookingType == 2 || $scope.standardisationContent.cookingType == 3 || $scope.standardisationContent.cookingType == 4){
				//ok
			}
			else{
				$scope.standardisationContent.cookingType = 0;
			}
		}
		
		
		if(!$scope.standardisationContent.boneType || $scope.standardisationContent.boneType == ""){
			$scope.standardisationContent.boneType = 0; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.boneType == 1 || $scope.standardisationContent.boneType == 2){
				//ok
			}
			else{
				$scope.standardisationContent.boneType = 0;
			}
		}
		
		if(!$scope.standardisationContent.fryType || $scope.standardisationContent.fryType == ""){
			$scope.standardisationContent.fryType = 0; //default value --> Not Applicable
		}
		else{
			if($scope.standardisationContent.fryType == 1 || $scope.standardisationContent.fryType == 2){
				//ok
			}
			else{
				$scope.standardisationContent.fryType = 0;
			}
		}
		
		
				
		
		
		
		/* Cooking Time */
		if(!$scope.standardisationContent.cookingTime || $scope.standardisationContent.cookingTime == ""){
			//Serving Time not set --> SKIP	
		}
		else{
			if(isNaN($scope.standardisationContent.cookingTime) || $scope.standardisationContent.cookingTime < 1){
				$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: Avg. Serving Time has to be a valid Number', 3000);
				return '';
			}
		}
		
		/* Photo */
		if($scope.isPhotoAttached){
			$scope.standardisationContent.imageData = $scope.myPhotoURL;
		}
		else{
			$scope.standardisationContent.imageData = "";
		}
		
		
		//Everything is fine --> POST TO SERVER
		  var data = $scope.standardisationContent;
	          data.token = $cookies.get("acceleronLunaAdminToken");
	          data.itemCodeOriginal = $scope.backup_original_item_code;
	          data.imageDataOriginal = $scope.backup_original_photo;
	          
	          $scope.showToast('<i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size: 100%"></i> Updating...');
	          
	          $http({
	            method  : 'POST',
	            url     : 'https://accelerateengine.app/food-engine/apis/specialupdateitem.php',
	            data    : data,
	            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
	           })
	           .then(function(response) {
	           	if(response.data.status){
	           		$scope.hideToast();
	           		$scope.reinitialiseCuisineItems($scope.standardisationContent.mainCategory);
	           		$scope.cancelStandardisationView();
	           		
	           		$scope.showToast('<i class="fa fa-check" style="font-size: 100%"></i> Updated', 3000);
	           	}
	           	else{
	           		$scope.hideToast();
	           		$scope.showToast('<i class="fa fa-warning" style="font-size: 100%"></i> Error: '+response.data.error, 3000);
	           	}
	           
	           });
		
	}
	
});
