angular.module('CandidateProfileApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateProfileController', function($scope, $http, $interval, $cookies) {

      $scope.name = "Abhijith";
      $scope.myPhotoURL = "https://abhijithcs.in/assets/images/avatar.jpg";

      
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
    console.log('hello')
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
          width: 200,
          height: 200,
          fillColor: '#fff',
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'high',
        });
        
      $scope.myPhotoURL = $scope.canvasData.toDataURL();
      $scope.saveCandidatePhoto($scope.myPhotoURL);
      $scope.cropper.destroy();
      $('#imageModal').modal('hide');   
   }



    $scope.saveCandidatePhoto = function(photoURL){
          var data = {};
          data.token = $cookies.get("accelerateVegaDeskAdmin");
          data.url = photoURL;

          console.log(data)

          $http({
            method  : 'POST',
            url     : 'https://accelerateengine.app/food-engine/apis/epreditperson.php',
            data    : data,
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
           })
           .then(function(response) {            
              
          });   
    };


});