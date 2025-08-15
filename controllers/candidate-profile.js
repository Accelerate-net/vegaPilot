angular.module('candidateProfileApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateProfileController', function($scope, $http, $interval, $cookies, $sce, $timeout) {

/*
      //Check if logged in
      if($cookies.get("vegaPilotAdminToken")){
        $scope.isLoggedIn = true;
      }
      else{
        $scope.isLoggedIn = false;
        window.location = "index.html";
      }

      //Logout function
      $scope.logoutNow = function(){
        if($cookies.get("vegaPilotAdminToken")){
          $cookies.remove("vegaPilotAdminToken");
          window.location = "index.html";
        }
      }
*/

      function getAdminTokenFromCookie() {
        return "TOKEN";//$cookies.get("vegaPilotAdminToken");
      }



        $scope.profileData = {};

        $scope.fetchProfileData = function(){
            $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/user/user-profile.php',
              headers : {
                'Content-Type': 'application/json',
                'X-Access-Token': getAdminTokenFromCookie()
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.profileData = response.data.data;
                }
            });
      }

      $scope.fetchProfileData();



});