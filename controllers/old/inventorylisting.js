angular.module('inventoryListApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('inventoryListController', function($scope, $http, $interval, $cookies) {

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
      $scope.filterTitle = 'Inventory Master List';

      //Default Results : Reservations of the Week
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1;
      var yyyy = today.getFullYear();
      if(dd<10){ dd='0'+dd;}
      if(mm<10){ mm='0'+mm;}
      var today = dd+'-'+mm+'-'+yyyy;
      
      $scope.todayDate = today;


$scope.initStocks = function(){

      var data = {};
      data.token = $cookies.get("accelerateVegaDeskAdmin");

      $('#vegaPanelBodyLoader').show(); $("body").css("cursor", "progress");
      $http({
        method  : 'POST',
        url     : 'https://accelerateengine.app/food-engine/apis/erpfetchinventorylist.php',
        data    : data,
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
       })
       .then(function(response) {
       $('#vegaPanelBodyLoader').hide(); $("body").css("cursor", "default");
         if(response.data.status){

           $scope.isReservationsFound = true;
           $scope.stockList = response.data.response;
           
                 if($scope.stockList.length%10 == 0){
                    $scope.isMoreLeft = true;
               }else{
                    $scope.isMoreLeft = false;
               }
               
         }
         else{
           $scope.isReservationsFound = false;
           $scope.resultMessage = "There are no Inventory added yet.";
         }
        });
}
$scope.initStocks();



         
         $scope.showCancel = function(stock){
         
          $scope.cancelItemCode = stock.id;
          $scope.cancelShowName = stock.name;
        
          $('#cancelModal').modal('show');
         
         }
         
         $scope.confirmCancel = function(code){
              var data = {};
              data.id = code;
              data.token = $cookies.get("accelerateVegaDeskAdmin");

              $http({
                method  : 'POST',
                url     : 'https://accelerateengine.app/food-engine/apis/erpdeleteinventorylist.php',
                data    : data,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}
               })
               .then(function(response) {
                $('#cancelModal').modal('hide');
                      if(response.data.status){    
                        $scope.initStocks();
                      }
                      else{
                        alert(response.data.error);
                      }
               });         
         }
         
         
         
     //Add new reservation
     $scope.nullNewInventory = function(){
      $scope.newStock = {};
      $scope.newStock.name = "";
      $scope.newStock.category = "";
      $scope.newStock.unit = "";
     }
     $scope.nullNewInventory();
     
     
     $scope.openNewInventory = function(){
     
            $scope.nullNewInventory();

            var data = {}; 
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            //fetch categories list, vendors list etc.
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpnewinventorymetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    if(response.data.status){
                      $scope.metaCategoryList = response.data.categories;
                      $('#newInventoryModal').modal('show');
                    }
             });  

     }




     
     $scope.showEdit = function(obj){
      $scope.editStock = obj;
      $scope.editDisplayName = $scope.editStock.name;
      
            var data = {}; 
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            //fetch categories list, vendors list etc.
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpnewinventorymetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    if(response.data.status){
                      $scope.metaCategoryList = response.data.categories;
                      $('#stockEditModal').modal('show');
                    }
             });  

     }


     
  $scope.saveNewInventory = function(){

    $scope.newStockError = "";
    
    if($scope.newStock.name == "" || !(/^[a-zA-Z ]+$/.test($scope.newStock.name))){
      $scope.newStockError = "Invalid Name";
    }
    else if($scope.newStock.category == ""){
      $scope.newStockError = "Select the Category";
    }
    else if($scope.newStock.unit == ""){
      $scope.newStockError = "Invalid Unit";
    }   
    else{
      $scope.newStockError = "";
      
      var data = {};
            data.details = $scope.newStock;
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpaddinventorylist.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    $('#newInventoryModal').modal('hide');
                    if(response.data.status){    
                      $scope.initStocks();
                    }
                    else{
                      console.log(response.data.error);
                    }
             });  
    }
  
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


 
  
  $scope.saveEditInventory = function(){
    
    $scope.editStockError = "";
    
    if($scope.editStock.name == "" || !(/^[a-zA-Z ]+$/.test($scope.editStock.name))){
      $scope.editStockError = "Invalid Name";
    }
    else if($scope.editStock.category == ""){
      $scope.editStockError = "Select the Category";
    }
    else if($scope.editStock.unit == ""){
      $scope.editStockError = "Invalid Unit";
    }  
    else{
      $scope.editStockError = "";
      
            var data = {};
            data.details = $scope.editStock;
            data.id = $scope.editStock.id;

            data.token = $cookies.get("accelerateVegaDeskAdmin");

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpeditinventorylist.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    $('#stockEditModal').modal('hide');
                    if(response.data.status){    
                      $scope.initStocks();
                    }
                    else{
                      console.log(response.data.error);
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
