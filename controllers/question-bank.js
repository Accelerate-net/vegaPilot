angular.module('questionBankApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('questionBankController', function($scope, $http, $interval, $cookies, $sce, $timeout) {

    /**
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
    **/

      $scope.summaryTileData = {
          "ratio": "0 : 0 : 0",
          "total": "60",
          "totalPOQ": "0",
          "totalUnverified": "60",
          "totalChallenged": "0",
          "lastChallengeTime": "Unknown",
          "unverifiedPercentage" : "0"
      }

      $scope.renderSummaryTiles = function(){
            $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/list-summary.php',
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.summaryTileData = response.data;

                  $scope.summaryTileData.unverifiedPercentage = (($scope.summaryTileData.totalUnverified / $scope.summaryTileData.total) * 100).toFixed(1);
                }
            });
      }

      $scope.renderSummaryTiles();



      $scope.filterAllQuestions = function(page, records, type) {
            $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/list.php?page='+page+'&records='+records+'&filter='+type,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.listData = response.data.data;

                  if(type == "UNVERIFIED")
                    $scope.totalPages = Math.ceil($scope.summaryTileData.totalUnverified / $scope.maxResultsShown);
                  else if(type == "CHALLENGED")
                    $scope.totalPages = Math.ceil($scope.summaryTileData.totalChallenged / $scope.maxResultsShown);

                }
            });
      }

      $scope.listQuestions = function(page, records){
        $scope.filterAllQuestions(page, records, 'ALL');
      }

      //Default Listing
      $scope.currentPage = localStorage.getItem("currentPageQuestionBankListing") ? localStorage.getItem("currentPageQuestionBankListing") : 1;
      $scope.maxResultsShown = 10; //Records
      $scope.totalPages = Math.ceil($scope.summaryTileData.total / $scope.maxResultsShown);


      $scope.getPYQLabel = function (questionData) {
        if(questionData.pyqType != "" && questionData.pyqYear != "")
          return questionData.pyqType + " - " + questionData.pyqYear;
      }

      $scope.formatEpoch = function(epoch) {
        if(!epoch || epoch == null) {
          return "";
        }

        const date = moment(epoch * 1000); 
        const today = moment().isSame(date, 'day');
        
        if (today) {
          return "at " + date.format('h:mm A');
        } else {
          return "on " + date.format("DD MMM, 'YY");
        }
      };


      

      $scope.goLeft = function() {
        $scope.currentPage--;
        if($scope.currentPage < 1)
          $scope.currentPage = 1;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }

      $scope.goRight = function() {
        $scope.currentPage++;
        if($scope.currentPage > $scope.totalPages)
          $scope.currentPage = $scope.totalPages;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }



      $scope.questionBankFilterApplied = "";
      $scope.quickFilterQuestionBank = function(type) {
          $scope.currentPage = 1;
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", type);
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, type);
          $scope.questionBankFilterApplied = type;
      }

      $scope.removeFilterOnQuestionBank = function() {
          $scope.questionBankFilterApplied = "";
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", "");
          $scope.currentPage = 1;
          $scope.listDefaultQuestions();
      }





      //DATA MODIFICATIONS
      $scope.createView = false;
      $scope.modifyQuestionView = false;

      $scope.addNewQuestion = function() {
          $scope.createView = true;
          $scope.modifyQuestionView = false;
      }


      $scope.currentQuestionSequence = 1;
      $scope.grandTotalQuestions = $scope.summaryTileData.total;

      $scope.modifyQuestion = function(id) {
          
          $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/read-single.php?id='+id,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  
                  $scope.createView = true;
                  $scope.modifyQuestionView = true;

                  $scope.modifyQuestionData = response.data;
                  $scope.isPhotoAttached = $scope.modifyQuestionData.url != "";
                  $scope.isPhotoAttachedSolution = $scope.modifyQuestionData.solutionURL != "";

                  $scope.modifyQuestionData.pyqYear == 0 ? $scope.modifyQuestionData.pyqYear = "" : $scope.modifyQuestionData.pyqYear;

                  $scope.currentQuestionSequence = parseInt(response.data.sequenceNumber);
                  $scope.grandTotalQuestions = parseInt(response.data.totalQuestions);


                  //Update URL param
                  const url = new URL(window.location);
                  url.searchParams.set("modifyId", $scope.modifyQuestionData.id);
                  window.history.pushState({}, '', url);

                } else {
                  $scope.modifyQuestionData = {};
                  $scope.showToasterError("Question #"+id+" not found");
                }
            });

      }

      $scope.seekQuestionBySequenceNumber = function(seekNumber) {
          $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/read-in-sequence.php?sequence='+seekNumber,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  
                  $scope.createView = true;
                  $scope.modifyQuestionView = true;

                  $scope.modifyQuestionData = response.data;
                  $scope.isPhotoAttached = $scope.modifyQuestionData.url != "";
                  $scope.isPhotoAttachedSolution = $scope.modifyQuestionData.solutionURL != "";

                  $scope.modifyQuestionData.pyqYear == 0 ? $scope.modifyQuestionData.pyqYear = "" : $scope.modifyQuestionData.pyqYear;

                  $scope.currentQuestionSequence = parseInt(response.data.sequenceNumber);
                  $scope.grandTotalQuestions = parseInt(response.data.totalQuestions);

                  //Update URL param
                  const url = new URL(window.location);
                  url.searchParams.set("modifyId", $scope.modifyQuestionData.id);
                  window.history.pushState({}, '', url);
                } else {
                  $scope.modifyQuestionData = {};
                }
            });
      }


      $scope.customNumberUserInput = '';
      $scope.seekCustomSequenceNumber = function(number) {
          if ($scope.seekTimeout) {
              $timeout.cancel($scope.seekTimeout);
          }

          $scope.seekTimeout = $timeout(function() {
              $scope.customNumberUserInput = '';
              $scope.seekQuestionBySequenceNumber(number);
          }, 1000);
      };

      $scope.seekCustomQuestionNumber = function(number) {
          if ($scope.seekTimeout) {
              $timeout.cancel($scope.seekTimeout);
          }

          $scope.seekTimeout = $timeout(function() {
              $scope.customNumberUserInput = '';
              $scope.modifyQuestion(number);
          }, 1000);
      };

      

      $scope.seekPreviousQuestion = function() {
          var previous_sequence = $scope.currentQuestionSequence - 1;
          if(previous_sequence < 1)
            previous_sequence = 1;
          $scope.seekQuestionBySequenceNumber(previous_sequence);
      }

      $scope.seekNextQuestion = function() {
          var next_sequence = $scope.currentQuestionSequence + 1;
          if(next_sequence > $scope.grandTotalQuestions)
            next_sequence = $scope.grandTotalQuestions;
          $scope.seekQuestionBySequenceNumber(next_sequence);
      }



      $scope.setQuestionLevel = function(modifyQuestionData, level) {
        if($scope.modifyQuestionData.level == level)
          $scope.modifyQuestionData.level = '';
        else
          $scope.modifyQuestionData.level = level;
      }

      $scope.setQuestionAnswer = function(modifyQuestionData, answer) {
          $scope.modifyQuestionData.answer = answer;
      }

      $scope.getPYQLabelClass = function(level) {
        if(level == "Easy")
          return "label-success";
        else if(level == "Medium")
          return "label-warning";
        else if(level == "Hard")
          return "label-danger";
      }

      $scope.setQuestionPYQType = function(modifyQuestionData, type) {
        $scope.modifyQuestionData.pyqType = type;
      }

      $scope.removeChallengeOnQuestion = function(modifyQuestionData) {
        if($scope.modifyQuestionData.challenged) {
          $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/reset-challenge.php?id='+modifyQuestionData.id,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.challenged = false;
                  $scope.showToaster("Challenge has been removed");
                }
            });
        }
      }

      $scope.toggleVerifiedStatus = function(modifyQuestionData) {
        const verified_flag = !modifyQuestionData.verified;
        const verified_number = verified_flag ? 1 : 0;
        
        $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/update-verified.php?id='+modifyQuestionData.id+'&verified='+verified_number,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.verified = verified_flag;
                  
                  if($scope.modifyQuestionData.verified)
                    $scope.showToaster("The Question has been marked as Verified");
                  else
                    $scope.showToaster("The Question is NOT Verified now");
                }
            });
      }


      $scope.showToasterError = function(message) {
        $scope.showToaster('<b style="color: #ff887f">ERROR</b> '+message);
      }


      $scope.toasterVisible = false;
      $scope.toasterMessage = "";

      $scope.showToaster = function(message) {
          $scope.toasterMessage = $sce.trustAsHtml(message);
          $scope.toasterVisible = true;

          $scope.$applyAsync();

          setTimeout(function() {
              $scope.toasterVisible = false;
              $scope.$apply();
          }, 3000);
      };



      //Seek Questions

      $scope.goLeft = function() {
        $scope.currentPage--;
        if($scope.currentPage < 1)
          $scope.currentPage = 1;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }

      $scope.goRight = function() {
        $scope.currentPage++;
        if($scope.currentPage > $scope.totalPages)
          $scope.currentPage = $scope.totalPages;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }



      $scope.questionBankFilterApplied = "";
      $scope.quickFilterQuestionBank = function(type) {
          $scope.currentPage = 1;
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", type);
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, type);
          $scope.questionBankFilterApplied = type;
      }

      $scope.removeFilterOnQuestionBank = function() {
          $scope.questionBankFilterApplied = "";
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", "");
          $scope.currentPage = 1;
          $scope.listDefaultQuestions();
      }


      $scope.autoSwitching = localStorage.getItem("autoSwitchReviewingQuestions") == 1 ? true : false;

      $scope.updateAutoSwitching = function() {
        $scope.autoSwitching = !$scope.autoSwitching;
        localStorage.setItem("autoSwitchReviewingQuestions", $scope.autoSwitching ? 1 : 0);
      }

      function cleanUpSolutionPath(url) {
          if(!url)
            return "";
          return url.replace('#toolbar=0&navpanes=0&view=Fit', "");
      }

      //Save Modified Question
      $scope.saveModifiedQuestion = function(updatedData, verified) {
            var questionId = updatedData.id;
            var data = {
              "answer": updatedData.answer,
              "chapter": updatedData.chapter,
              "level": updatedData.level,
              "pyqType": updatedData.pyqType,
              "pyqYear": updatedData.pyqYear,
              "solutionPath": cleanUpSolutionPath(updatedData.solutionStorePath),
              "averageTime": updatedData.averageTimeTaken,
              "verified": verified
            }

            $http({
              method  : 'POST',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/update-question-details.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.verified = verified;
                  $scope.showToaster("Successfully updated the question");

                  if(verified && localStorage.getItem("autoSwitchReviewingQuestions") == 1) {
                    $scope.seekNextQuestion(); //Auto Switching
                  }

                } else {
                  $scope.showToasterError("Failed to save the details");
                }
            });  
      }

      $scope.saveOnly = function(modifiedData) {
        $scope.saveModifiedQuestion(modifiedData, false)
      }

      $scope.saveAndVerify = function(modifiedData) {
        $scope.saveModifiedQuestion(modifiedData, true)
      }


      
      //Image Cropper - QUESTION
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
              minCropBoxWidth: 1200,
              autoCropArea: 0.9,
              scalable: false,
              ready: function () {
                // Strict mode: set crop box data first
                $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
              }});           
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
      $scope.saveAttachment = function(questionId){
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

          $scope.updateQuestionImage($scope.myPhotoURL, questionId);
      }


      $scope.updateQuestionImage = function(image, questionId) {
            var data = {
              "image" : image
            }
            $http({
              method  : 'POST',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/update-question-image.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.url = image;
                } else {
                  $scope.showToaster("Question failed to update");
                }
            });        
      }

      $scope.removeSolutionImage = function(questionId) {
            $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/remove-solution-image.php?id='+questionId,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = "";
                  $scope.isPhotoAttachedSolution = false;
                } else {
                  $scope.showToaster("Question failed to update");
                }
            });        
      }

      //Image Cropper - SOLUTION
      $scope.myImageSolution = '';
      $scope.myCroppedImageSolution = '';
      
      var imageSolution = "";
      $scope.cropBoxDataSolution;
      $scope.canvasDataSolution;
      $scope.cropperSolution;
  
      var handleFileSelectSolution = function(evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
          $scope.$apply(function($scope){
            $scope.myImageSolution = evt.target.result;
            setTimeout(function(){ 
              imageSolution = document.getElementById('imageSolution');
              $scope.cropperSolution = new Cropper(imageSolution, {
              minCropBoxWidth: 1200,
              autoCropArea: 0.9,
              scalable: false,
              ready: function () {
                // Strict mode: set crop box data first
                $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
              }});           
            }, 1000);
            
            $scope.photoLoadedToFrameSolution = true;
          });
        };
        
        reader.readAsDataURL(file);
      };
      
      angular.element(document.querySelector('#fileInputSolution')).on('change', handleFileSelectSolution);
      
      $scope.attachPhotoSolution = function(){
        $('#imageModalSolution').modal('show');   
        $scope.photoLoadedToFrameSolution = false;  
      }

      $scope.removePhotoSolution = function(){
        $scope.isPhotoAttachedSolution = false;
        $scope.myPhotoURLSolution = '';
      }
        
      $scope.isPhotoAttachedSolution = false;
      $scope.saveAttachmentSolution = function(questionId){
          $scope.isPhotoAttachedSolution = true;   
          $scope.canvasDataSolution = $scope.cropperSolution.getCroppedCanvas({
            width: 540,
            height: 540,
            fillColor: '#fff',
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'high',
          });
          
          $scope.myPhotoURLSolution = $scope.canvasDataSolution.toDataURL();
          $scope.cropperSolution.destroy();
          $('#imageModalSolution').modal('hide');

          $scope.updateSolutionImage($scope.myPhotoURLSolution, questionId);
      }


      $scope.updateSolutionImage = function(image, questionId) {
            var data = {
              "image" : image
            }
            $http({
              method  : 'POST',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/update-solution-image.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = image;
                } else {
                  $scope.showToaster("Solution failed to update");
                }
            });        
      }


      //Remove Solution Image
      $scope.removePhotoSolution = function(questionId) {
            $http({
              method  : 'GET',
              url     : 'http://akbarmanjeri.in/crispr-apis/restricted/question-bank/reset-solution-image.php?id='+questionId,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = "";
                } else {
                  $scope.showToaster("Solution was not reset");
                }
            });        
      }


      //Paste Solution
      $scope.pasteSolutionURL = function() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function(text) {
                $scope.$apply(function() {
                    $scope.modifyQuestionData.solutionStorePath = text + "#toolbar=0&navpanes=0&view=Fit";
                });
            }).catch(function(err) {
            });
        }
      };

      $scope.getTrustedUrl = function(url) {
        return $sce.trustAsResourceUrl(url);
      };


      $scope.copyToClipboard = function(text, $event) {
          navigator.clipboard.writeText(text).then(() => {
              const button = angular.element($event.currentTarget);
              const message = button[0].querySelector('.copiedMessage');
              if (message) {
                  message.style.display = 'inline';
                  $timeout(() => {
                      message.style.display = 'none';
                  }, 1000);
              }
          }).catch(err => {
          });
      };

      $scope.viewQuestionPhoto = function(img){
        $('#questionPreviewModal').modal('show'); 
        $scope.currentQuestionImage = img;  
      }


      $scope.listDefaultQuestions = function() {
          const urlParams = new URLSearchParams(window.location.search);
          const modifyId = urlParams.get('modifyId');
          if(modifyId && modifyId > 0) { //if "modifyId = 1" is found in URL
            $scope.modifyQuestion(modifyId);
          } else { //load listing table
            $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
          }
      }

      //Starting Method
      $scope.listDefaultQuestions();

})



.controller('peopleController', function($scope, $http, $interval, $cookies) {
//1. Check if the user is logged in?

//2. If the logged in user has the previliage to view?

//3.Otther data to be displayed on the screeen ('badges', 'messages', 'notificaitons')


      // //Check if logged in
      // if($cookies.get("accelerateVegaDeskAdmin")){
      //   $scope.isLoggedIn = true;
      // }
      // else{
      //   $scope.isLoggedIn = false;
      //   window.location = "adminlogin.html";
      // }
      


      //Logout function
      $scope.logoutNow = function(){
        if($cookies.get("accelerateVegaDeskAdmin")){
          $cookies.remove("accelerateVegaDeskAdmin");
          window.location = "adminlogin.html";
        }
      }

    const currentYear = 2025;

    $scope.updateToNumber = function() {
        $scope.newStudent.nativePlace = $scope.newStudent.nativePlace.replace(/\D/g, '');
        if($scope.newStudent.nativePlace > currentYear) {
          $scope.newStudent.nativePlace = 2024;
        } else if($scope.newStudent.nativePlace.length == 4 && $scope.newStudent.nativePlace < 1990) {
          $scope.newStudent.nativePlace = "";
        }
    };





      $scope.searchWithBranch = function(){

            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeoplemetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                if(response.data.status){
                  $scope.branchList = response.data.branches;
                  if($scope.branchList.length > 0)
                    $('#filterModal').modal('show'); 
                  else
                    return '';
                }
            });
      }

      $scope.searchWithBranchAction = function(key){
        $scope.searchKey = key;
        $scope.search(key);
        $('#filterModal').modal('hide');
      }



      $scope.searchWithRole = function(){

            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeoplemetadata.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                if(response.data.status){
                  $scope.roleList = response.data.roles;
                  if($scope.roleList.length > 0)
                    $('#filterModalRole').modal('show'); 
                  else
                    return '';
                }
            });
      }

      $scope.searchWithRoleAction = function(key){
        $scope.searchKey = key;
        $scope.search(key);
        $('#filterModalRole').modal('hide');
      }



      $scope.search = function(search_key){

            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");
            data.key = search_key;


            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeople.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {

                if(response.data.status){
                  $scope.isSearched = true;
                  $scope.isFound = true;
                  $scope.studentData = response.data.response;

                  console.log($scope.studentData)

                  if($scope.studentData.length == 1){
                    $scope.singleStudent = true;
                    $scope.studentData = $scope.studentData[0];
                    console.log($scope.studentData);
                  }
                  else{
                    $scope.singleStudent = false;
                  }
                }
                else{
                  $scope.isSearched = true;
                  $scope.isFound = false;
                  $scope.studentData = {};
                }

            });
              
      }


      $scope.resetSearchView = function(){
        $scope.createView = false;
        $scope.editStudentWindow = false;

        $scope.isSearched = false;
        $scope.isFound = false;
        $scope.singleStudent = false;
        
        $scope.studentData = "";

        $scope.newStudent = [];
        $scope.newStudent.fName = "";
        $scope.newStudent.lName = "";
        $scope.newStudent.height = "";
        $scope.newStudent.weight = "";
        $scope.newStudent.dob = "";
        $scope.newStudent.doj = "";
        $scope.newStudent.class = "";
        $scope.newStudent.division = "";
        $scope.newStudent.stream = "";
        $scope.newStudent.section = "";
        $scope.newStudent.gender = "";
        $scope.newStudent.bloodGroup = "";

        $scope.searchKey = "";
        $scope.errorMessage = "";
      }

      $scope.resetSearchView();


      $scope.editCurrentProfile = function(currentData){  

        $scope.createView = true;
        $scope.editStudentWindow = true;
        $scope.editStudent = currentData;

        $scope.displayedName = $scope.editStudent.fName +' '+ $scope.editStudent.lName;

        $scope.editStudent.regEmpID = currentData.employeeID;
        $scope.editStudent.regMobile = currentData.contact;
        currentData.gender == 'Male' ? $scope.editStudent.gender = 'M' : $scope.editStudent.gender = 'F';
        $scope.editStudent.dob = currentData.birthDate;

        $scope.editStudent.addressHouse = currentData.currentAddress.house;
        $scope.editStudent.addressLocation = currentData.currentAddress.location;
        $scope.editStudent.addressPost = currentData.currentAddress.post;
        $scope.editStudent.addressPostcode = currentData.currentAddress.postCode;
        $scope.editStudent.addressCity = currentData.currentAddress.city;
        $scope.editStudent.addressDistrict = currentData.currentAddress.district;
        $scope.editStudent.addressState = currentData.currentAddress.state;

        $scope.editStudent.permanentHouse = currentData.permanentAddress.house;
        $scope.editStudent.permanentLocation = currentData.permanentAddress.location;
        $scope.editStudent.permanentPost = currentData.permanentAddress.post;
        $scope.editStudent.permanentPostcode = currentData.permanentAddress.postCode;
        $scope.editStudent.permanentCity = currentData.permanentAddress.city;
        $scope.editStudent.permanentDistrict = currentData.permanentAddress.district;
        $scope.editStudent.permanentState = currentData.permanentAddress.state;

        $scope.editStudent.emergencyContact = currentData.emergencyName;
        $scope.editStudent.emergencyPhone = currentData.emergencyNumber;

        document.getElementById('dob_edit').value = currentData.birthDate;
        document.getElementById('doj_edit').value = currentData.joinDate;

        $scope.editStudent.dob = currentData.birthDate;
        $scope.editStudent.doj = currentData.joinDate;

        $scope.editStudent.bankAccountName = currentData.bankInfo.name;
        $scope.editStudent.bankAccountNumber = currentData.bankInfo.number;
        $scope.editStudent.bankName = currentData.bankInfo.bank;
        $scope.editStudent.bankBranch = currentData.bankInfo.branch;
        $scope.editStudent.ifsc = currentData.bankInfo.ifsc;

        if(currentData.photoURL && currentData.photoURL != ''){
          $scope.isPhotoAttached = true;
          $scope.myPhotoURL = currentData.photoURL;
        }
        else{
          $scope.isPhotoAttached = false;
        }


        $('#dob_edit').datetimepicker({  
          format: "dd-mm-yyyy",
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0
        }) 

        $('#doj_edit').datetimepicker({  
            format: "dd-mm-yyyy",
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            minView: 2,
            forceParse: 0
        }) 



      }



      $scope.saveEditStudent = function(){

            $scope.editStudent.dob = document.getElementById('dob_edit').value;
            $scope.editStudent.doj = document.getElementById('doj_edit').value;

            if($scope.editStudent.gender === ''){
              $scope.errorMessage = 'Mention the gender of the Staff';
            }
            else if($scope.editStudent.fName === ''){
              $scope.errorMessage = 'Mention the first name of the Staff';
            }
            else if($scope.editStudent.dob === ''){
              $scope.errorMessage = 'Mention the Date of Birth';
            }
            else if($scope.editStudent.nativePlace === ''){
              $scope.errorMessage = 'Mention the native place of the staff';
            }
            else if($scope.editStudent.religion === ''){
              $scope.errorMessage = "Mention the Religion";
            }
            else if($scope.editStudent.bloodGroup === ''){
              $scope.errorMessage = "Mention Blood Group";
            }
            else if($scope.editStudent.addressHouse === '' || $scope.editStudent.addressLocation === '' || $scope.editStudent.addressPost === '' || $scope.editStudent.addressPostcode === '' || $scope.editStudent.addressCity === '' || $scope.editStudent.addressDistrict === '' || $scope.editStudent.addressState === ''){
              $scope.errorMessage = "Add complete Residential Address";
            }
            else if($scope.editStudent.permanentHouse === '' || $scope.editStudent.permanentLocation === '' || $scope.editStudent.permanentPost === '' || $scope.editStudent.permanentPostcode === '' || $scope.editStudent.permanentCity === '' || $scope.editStudent.permanentDistrict === '' || $scope.editStudent.permanentState === ''){
              $scope.errorMessage = "Add complete Permanent Address";
            }
            else if($scope.editStudent.emergencyContact === '' || $scope.editStudent.emergencyPhone === ''){
              $scope.errorMessage = "Add Emerygency contact details";
            }
            else if($scope.editStudent.designation === ''){
              $scope.errorMessage = "Mention designation of the staff";
            }
            else if($scope.editStudent.doj === ''){
              $scope.errorMessage = "Mention joining date";
            }
            else if($scope.editStudent.joinBranch === ''){
              $scope.errorMessage = "Mention first joining branch";
            }
            else if($scope.editStudent.currentBranch === ''){
              $scope.errorMessage = "Mention the current branch";
            }
            else{
            
                        var data = {};
                        data.token = $cookies.get("accelerateVegaDeskAdmin");

                        data.empID = $scope.editStudent.regEmpID;
                        data.regMobile = $scope.editStudent.regMobile;

                        data.fName = $scope.editStudent.fName;
                        data.lName = $scope.editStudent.lName;
                        data.gender = $scope.editStudent.gender;
                        data.dob = $scope.editStudent.dob;
                        data.height = $scope.editStudent.height;
                        data.weight = $scope.editStudent.weight;
                        data.religion = $scope.editStudent.religion;
                        data.bloodGroup = $scope.editStudent.bloodGroup;
                        data.nativePlace = $scope.editStudent.nativePlace;

                        data.currentAddress = {
                          "house" : $scope.editStudent.addressHouse,
                          "location" : $scope.editStudent.addressLocation,
                          "post" : $scope.editStudent.addressPost,
                          "postCode" : $scope.editStudent.addressPostcode,
                          "city" : $scope.editStudent.addressCity,
                          "district" : $scope.editStudent.addressDistrict,
                          "state" : $scope.editStudent.addressState
                        }

                        data.permanentAddress = {
                          "house" : $scope.editStudent.permanentHouse,
                          "location" : $scope.editStudent.permanentLocation,
                          "post" : $scope.editStudent.permanentPost,
                          "postCode" : $scope.editStudent.permanentPostcode,
                          "city" : $scope.editStudent.permanentCity,
                          "district" : $scope.editStudent.permanentDistrict,
                          "state" : $scope.editStudent.permanentState
                        }

                        data.designation = $scope.editStudent.designation;
                        data.joinDate = $scope.editStudent.doj;
                        data.joinBranch = $scope.editStudent.joinBranch;
                        data.currentBranch = $scope.editStudent.currentBranch;

                        data.bankInfo = {
                          "name" : $scope.editStudent.bankAccountName,
                          "number" : $scope.editStudent.bankAccountNumber,
                          "bank" : $scope.editStudent.bankName,
                          "branch" : $scope.editStudent.bankBranch,
                          "ifsc" : $scope.editStudent.ifsc
                        }

                        data.url = $scope.myPhotoURL;

                        data.emergencyContact = $scope.editStudent.emergencyContact;
                        data.emergencyPhone = $scope.editStudent.emergencyPhone;

                        console.log(data)
            
                        $http({
                          method  : 'POST',
                          url     : 'https://accelerateengine.app/food-engine/apis/epreditperson.php',
                          data    : data,
                          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
                         })
                         .then(function(response) {            
                            if(response.data.status){
                              
                              var temp_key = $scope.editStudent.regEmpID;

                              $scope.cancelCreateView();
                              $scope.editStudent = []; 
                              $scope.errorMessage = "";

                              $scope.search(temp_key);

                            }
                
                            else{
                              $scope.errorMessage = response.data.error;
                            }
                    });
                }        
      }



      $scope.createStudent = function(){
            $scope.newStudent.dob = document.getElementById('dob').value;
            $scope.newStudent.doj = document.getElementById('doj').value;

            if($scope.newStudent.regEmpID === ''){
              $scope.errorMessage = 'Add Employee ID';
            }
            if($scope.newStudent.regMobile === ''){
              $scope.errorMessage = 'Add Mobile Number of the Staff';
            }
            if($scope.newStudent.gender === ''){
              $scope.errorMessage = 'Mention the gender of the Staff';
            }
            else if($scope.newStudent.fName === ''){
              $scope.errorMessage = 'Mention the first name of the Staff';
            }
            else if($scope.newStudent.dob === ''){
              $scope.errorMessage = 'Mention the Date of Birth';
            }
            else if($scope.newStudent.nativePlace === ''){
              $scope.errorMessage = 'Mention the native place of the staff';
            }
            else if($scope.newStudent.religion === ''){
              $scope.errorMessage = "Mention the Religion";
            }
            else if($scope.newStudent.bloodGroup === ''){
              $scope.errorMessage = "Mention Blood Group";
            }
            else if($scope.newStudent.addressHouse === '' || $scope.newStudent.addressLocation === '' || $scope.newStudent.addressPost === '' || $scope.newStudent.addressPostcode === '' || $scope.newStudent.addressCity === '' || $scope.newStudent.addressDistrict === '' || $scope.newStudent.addressState === ''){
              $scope.errorMessage = "Add complete Residential Address";
            }
            else if($scope.newStudent.permanentHouse === '' || $scope.newStudent.permanentLocation === '' || $scope.newStudent.permanentPost === '' || $scope.newStudent.permanentPostcode === '' || $scope.newStudent.permanentCity === '' || $scope.newStudent.permanentDistrict === '' || $scope.newStudent.permanentState === ''){
              $scope.errorMessage = "Add complete Permanent Address";
            }
            else if($scope.newStudent.emergencyContact === '' || $scope.newStudent.emergencyPhone === ''){
              $scope.errorMessage = "Add Emerygency contact details";
            }
            else if($scope.newStudent.designation === ''){
              $scope.errorMessage = "Mention designation of the staff";
            }
            else if($scope.newStudent.doj === ''){
              $scope.errorMessage = "Mention joining date";
            }
            else if($scope.newStudent.joinBranch === ''){
              $scope.errorMessage = "Mention first joining branch";
            }
            else if($scope.newStudent.currentBranch === ''){
              $scope.errorMessage = "Mention the current branch";
            }
            else{
            
                        var data = {};
                        data.token = $cookies.get("accelerateVegaDeskAdmin");

                        data.empID = $scope.newStudent.regEmpID;
                        data.regMobile = $scope.newStudent.regMobile;

                        data.fName = $scope.newStudent.fName;
                        data.lName = $scope.newStudent.lName;
                        data.gender = $scope.newStudent.gender;
                        data.dob = $scope.newStudent.dob;
                        data.height = $scope.newStudent.height;
                        data.weight = $scope.newStudent.weight;
                        data.religion = $scope.newStudent.religion;
                        data.bloodGroup = $scope.newStudent.bloodGroup;
                        data.nativePlace = $scope.newStudent.nativePlace;

                        data.currentAddress = {
                          "house" : $scope.newStudent.addressHouse,
                          "location" : $scope.newStudent.addressLocation,
                          "post" : $scope.newStudent.addressPost,
                          "postCode" : $scope.newStudent.addressPostcode,
                          "city" : $scope.newStudent.addressCity,
                          "district" : $scope.newStudent.addressDistrict,
                          "state" : $scope.newStudent.addressState
                        }

                        data.permanentAddress = {
                          "house" : $scope.newStudent.permanentHouse,
                          "location" : $scope.newStudent.permanentLocation,
                          "post" : $scope.newStudent.permanentPost,
                          "postCode" : $scope.newStudent.permanentPostcode,
                          "city" : $scope.newStudent.permanentCity,
                          "district" : $scope.newStudent.permanentDistrict,
                          "state" : $scope.newStudent.permanentState
                        }

                        data.designation = $scope.newStudent.designation;
                        data.joinDate = $scope.newStudent.doj;
                        data.joinBranch = $scope.newStudent.joinBranch;
                        data.currentBranch = $scope.newStudent.currentBranch;

                        data.bankInfo = {
                          "name" : $scope.newStudent.bankAccountName,
                          "number" : $scope.newStudent.bankAccountNumber,
                          "bank" : $scope.newStudent.bankName,
                          "branch" : $scope.newStudent.bankBranch,
                          "ifsc" : $scope.newStudent.ifsc
                        }

                        data.url = $scope.myPhotoURL;

                        data.emergencyContact = $scope.newStudent.emergencyContact;
                        data.emergencyPhone = $scope.newStudent.emergencyPhone;
            
                        $http({
                          method  : 'POST',
                          url     : 'https://accelerateengine.app/food-engine/apis/erpaddperson.php',
                          data    : data,
                          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
                         })
                         .then(function(response) {
            
                            if(response.data.status){
                              $scope.cancelCreateView();
                              $scope.newStudent = []; 
                              $scope.errorMessage = "";
                            }
                
                            else{
                              $scope.errorMessage = response.data.error;
                            }
                    });
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
              minCropBoxWidth: 1800,
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






      $scope.goToStudentProfile = function(search_key){
            
            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");
            data.key = search_key;

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeople.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                if(response.data.status){
                  $scope.singleStudent = true;
                  $scope.isSearched = true;
                  $scope.isFound = true;

                  $scope.studentData = response.data.response[0];   
                }

                else{
                  $scope.isSearched = true;
                  $scope.isFound = false;
                  $scope.studentData = {}
                }
            });
    }


      //Edit 

      setTimeout(function(){
        $('#dob').datetimepicker({  
          format: "dd-mm-yyyy",
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0
        }) 

        $('#doj').datetimepicker({  
            format: "dd-mm-yyyy",
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            minView: 2,
            forceParse: 0
        }) 
      }, 200);

      
  $scope.createStudentView = function() {
    	$scope.createView = true;
      $scope.editStudentWindow = false;
  }
  
  $scope.cancelCreateView = function() {
    	$scope.createView = false;
  }

  $scope.viewPhoto = function(img){
    $('#imagePreviewModal').modal('show'); 
    $scope.currentImage = img;  
  }


  //Attendance Page

  $scope.calendarView = true;

  $scope.attendanceRecord = [];
  $scope.FetchAttendanceRecord = function(month, year){

          if(!month || month == '' || !year || year == ''){
            var today = new Date();
            var mm = today.getMonth()+1; //January is 0!
            var year = today.getFullYear();
            if(mm<10) {
                mm = '0'+mm;
            } 
            var month = mm;
          }

            var userID = $scope.studentData.employeeID;
            
            var data = {};
            data.token = $cookies.get("accelerateVegaDeskAdmin");
            data.year = year;
            data.month = month;
            data.user = userID;

            $http({
              method  : 'POST',
              url     : 'https://accelerateengine.app/food-engine/apis/erpfetchpeopleattendance.php',
              data    : data,
              headers : {'Content-Type': 'application/x-www-form-urlencoded'}
             })
             .then(function(response) {
                if(response.data.status){
                  $scope.attendanceRecord = response.data.response;   
                  $scope.fetchCalendar($scope.attendanceRecord);
                }
            });
  }


  $scope.fetchCalendar = function(attendanceRecord){

            $scope.events = [];

            angular.forEach(attendanceRecord, function(value, key){

              if(value.status == 0){
                var tempDate = (value.date).split("-");
                value.start = tempDate[2]+"-"+tempDate[1]+"-"+tempDate[0];
                value.backgroundColor = "#bdc3c7";
                value.title = "Unknown";
              }
              else if(value.status == 1){
                var tempDate = (value.date).split("-");
                value.start = tempDate[2]+"-"+tempDate[1]+"-"+tempDate[0];
                value.backgroundColor = "#e67e22";
                value.title = "Half Day";
              }
              else if(value.status == 2){
                var tempDate = (value.date).split("-");
                value.start = tempDate[2]+"-"+tempDate[1]+"-"+tempDate[0];
                value.backgroundColor = "#2ecc71";
                value.title = "Present";
              }
              else if(value.status == 5){
                var tempDate = (value.date).split("-");
                value.start = tempDate[2]+"-"+tempDate[1]+"-"+tempDate[0];
                value.backgroundColor = "#e74c3c";
                value.title = "Absent";
              }

              $scope.events.push(value);
            });


            console.log($scope.events)

            /* initialize the calendar
            -----------------------------------------------------------------*/

            $('#calendar-view').fullCalendar({
              header: {
                  left:   'title',
                  center: '',
                  right:  ''
              },
              defaultView: 'month',
              editable: false,
              droppable: false, // this allows things to be dropped onto the calendar
              drop: function() {
                // is the "remove after drop" checkbox checked?
                if ($('#drop-remove').is(':checked')) {
                  // if so, remove the element from the "Draggable Events" list
                  $(this).remove();
                }
              },
              
              
              events: $scope.events,
              
              buttonIcons: { //multiple fa class because it will then output .fc-icon-fa.fa.fa-...
                  prev: 'fa fa fa-angle-left',
                  next: 'fa fa fa-angle-right',
                  prevYear: 'fa fa fa-angle-double-left',
                  nextYear: 'fa fa fa-angle-double-left'
              },
              
              
            });
   }

   $scope.openMonthSelector = function(){

      $('#attendanceFilterMonth').datetimepicker({
        format: "MM, yyyy",
        autoclose: 1,
        startView: 3,
        minView: 3,
        forceParse: 0
      })

      $('#monthSelectorModal').modal('show'); 
   }


   var tempToday = new Date();

   //default month year display
   $scope.attendanceFilterDisplay = (getFancyMonth(tempToday.getMonth()))+', '+(tempToday.getFullYear());

   $scope.applyMonthFilterAttendance = function(){
    var tempNewDate = document.getElementById("attendanceFilterMonth").value;
    $('#monthSelectorModal').modal('hide');

    $scope.attendanceFilterDisplay = tempNewDate;

    var tempSplit = tempNewDate.split(", ");

    var month = getMonthDigit(tempSplit[0]);
    var year = tempSplit[1];

    $scope.FetchAttendanceRecord(month, year)

    var newDate = new Date(year, month-1, 01)
    $('#calendar-view').fullCalendar('gotoDate', newDate);
   }

  function getMonthDigit(text){
    switch(text) {
        case 'January':
            return '01'
        case 'February':
            return '02'
        case 'March':
            return '03'
        case 'April':
            return '04'
        case 'May':
            return '05'
        case 'June':
            return '06'
        case 'July':
            return '07'
        case 'August':
            return '08'   
        case 'September':
            return '09'
        case 'October':
            return '10'
        case 'November':
            return '11'
        case 'December':
            return '12'                
    }
  }

  function getFancyMonth(id){
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    return month[id];    
  }

});