angular.module('stocksApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])



  .controller('stocksController', function($scope, $http, $interval, $cookies) {

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
      $scope.filterTitle = 'Inventory Stocks List';

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
        url     : 'https://accelerateengine.app/food-engine/apis/erpfetchstock.php',
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
                url     : 'https://accelerateengine.app/food-engine/apis/erpdeletestocklist.php',
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
      $scope.newStock.minStockUnit = "";
      $scope.newStock.currentStock = "";
      $scope.newStock.vendorList = '';
     }
     $scope.nullNewInventory();
     
     $scope.metaVendorsList = [];
     $scope.metaInventoryList = [];

     
     $scope.openNewInventory = function(){
      $scope.nullNewInventory();

            var data = {}; 
            data.token = $cookies.get("accelerateVegaDeskAdmin");
      
            //fetch inventories list, vendors list etc.
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpnewstockmetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                    if(response.data.status){
                      $scope.metaVendorsList = response.data.vendors;
                      $scope.metaInventoryList = response.data.inventories;

                      var n = 0;
                      var listing = '';
                      while($scope.metaVendorsList[n]){
                        listing = listing + '<option value="'+$scope.metaVendorsList[n].code+'">'+$scope.metaVendorsList[n].name+'</option>';
                        

                        if(n == $scope.metaVendorsList.length - 1){
                          document.getElementById("dropProvidingVendors").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
                          $('#newInventoryModal').modal('show');
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
                          document.getElementById("inventorySuggestions").innerHTML = allItemsListing;
                          $("#inventorySuggestions").change(function(){
                            var itemObj = JSON.parse(decodeURI($("#inventorySuggestions").val()));
                            document.getElementById("stockUnits").innerHTML = 'in '+itemObj.unit;
                            document.getElementById("stockCurrentUnits").innerHTML = 'in '+itemObj.unit;
                          });
                        }

                        m++
                      }


                    }
             });  


      
     }



     
     $scope.showEdit = function(obj){
      $scope.editStock = obj;
      $scope.editDisplayName = $scope.editStock.name;

      var tempVendorsList = [];

      if(($scope.editStock.vendorsList).length > 0){
        var j = 0;
        while($scope.editStock.vendorsList[j]){
          tempVendorsList.push($scope.editStock.vendorsList[j].id)
          j++;
        }  
      }
      
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
                      $scope.metaVendorsList = response.data.vendors;
                      $scope.metaCategoryList = response.data.categories;

                      var n = 0;
                      var listing = '';
                      while($scope.metaVendorsList[n]){
                        listing = listing + '<option value="'+$scope.metaVendorsList[n].code+'">'+$scope.metaVendorsList[n].name+'</option>';
                        

                        if(n == $scope.metaVendorsList.length - 1){
                          document.getElementById("dropProvidingVendorsEdit").innerHTML = ' <option value="" disabled=""> Select an option </option> '+ listing;
                          $('#stockEditModal').modal('show');

                          //Prefill vendors list
                          $('#dropProvidingVendorsEdit').select2({}).select2('val', tempVendorsList);

                        }

                        n++;
                      }

                    }
             });  

     }


     
  $scope.saveNewInventory = function(){

    var tempVendors = $("#dropProvidingVendors").val();
    
    $scope.newStockError = "";

    var tempObj = document.getElementById("inventorySuggestions").value;
    var itemObj = JSON.parse(decodeURI(tempObj));

    $scope.newStock.code = itemObj.code;
    
    if($scope.newStock.minStockUnit == ""){
      $scope.newStockError = "Invalid Minimum Stock";
    }
    else if($scope.newStock.currentStock == ""){
      $scope.newStockError = "Invalid Current Stock";
    } 
    else if($scope.newStock.code == "" || $scope.newStock.code == undefined){
      $scope.newStockError = "Invalid Inventory";
    }    
    else{
      $scope.newStockError = "";
      
            var data = {};
            data.details = $scope.newStock;

            if(tempVendors && tempVendors.length > 0){
              data.vendorsList = tempVendors;
            }

            data.token = $cookies.get("accelerateVegaDeskAdmin");
      
            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpaddstocklist.php',
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

    var tempVendors = $("#dropProvidingVendorsEdit").val();
    
    $scope.editStockError = "";
    
    if($scope.editStock.minStockUnit == ""){
      $scope.editStockError = "Invalid Minimum Stock";
    }
    else if($scope.editStock.currentStock == ""){
      $scope.editStockError = "Invalid Current Stock";
    }   
    else{
      $scope.editStockError = "";
      
            var data = {};
            data.details = $scope.editStock;
            data.id = $scope.editStock.id;
            data.vendorsList = tempVendors;

            data.token = $cookies.get("accelerateVegaDeskAdmin");

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpeditstocklist.php',
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





