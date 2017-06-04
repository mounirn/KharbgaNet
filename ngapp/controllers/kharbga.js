/* Kharbga controller */
nsApp.controller('kharbgaController', ['$scope', '$state', '$stateParams', '$rootScope', '$http', '$log', 'localStorageService' , 'appConstants',
    function ($scope, $state, $stateParams, $rootScope, $http, $log, localStorageService, appConstants) {
  //  document.title = "Kharbga";

    $log.info("Kharbga controller started");

    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri;
    if ($.nsAppKharbga != null && !angular.isUndefined($.nsAppKharbga)) {
        $.nsAppKharbga.initBoard({ themePath: './img/theme-simple/{piece}.png' });
    };



    $scope.currentGameIsActive = false;

    $scope.sessionData = localStorageService.get('sessionData');
    if ($scope.sessionData != null) {
        $log.info("Kharbga controller - setting session Id");

        $.nsAppKharbga.setSessionId($scope.sessionData.sessionId);
        $log.info("Kharbga controller - setting up games and last game");
        $.nsAppKharbga.setup();

    }
    else {
         $.nsAppKharbga.setSessionId("");
        // go to the login screen
        $state.go('Login', {});
    }

   /* var _refreshGames = function () {
        if ($scope.sessionData != null) {
            $log.info("Kharbga controller - refreshing server games");

            $.nsAppKharbga.refreshGames();
        }
        else {
            $scope.message = "Please login to play or view active games";
        }
    };
        */

    $scope.getGameStatus = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return false;

        var currentGame = $.nsAppKharbga.getCurrentGame();
        if (currentGame == null || angular.isUndefined(currentGame))
            return false;

        return true;
    };
   /* window.initialize = function () {
        // code to execute after your JS file referenced in the loadScript function loads
    };
 */

 /*   var loadScript = function () {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = './js/ns-app-kharbga.js';
        document.body.appendChild(script);
    };

    $scope.$on('$viewContentLoaded', function () {
        loadScript();
    });
  */

   // $scope.refreshGames = _refreshGames;
    $scope.flipBoard = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return false;

        // issue with flip losing game attacker and defender info and
        // cell highlighting
        $.nsAppKharbga.flipBoard();
    };

    $scope.newGame = function (options) {
        if (options == null)
            return;
        if (typeof options.asAttacker == 'undefined')
            return;

        if ($scope.sessionData != null && $scope.sessionData.isActive) {
            $.nsAppKharbga.newGame(options);
            $scope.currentGameIsActive = true; 

           // angular.element(document).find("#currentGamePanel").nsScrollTo();

        }
        else {
            $scope.message = "Please login to be able to start a new game!";
        }

       
    };

    $scope.post = function () {
        // 
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;

        var msg = {message: $scope.userMessage};
        $.nsAppKharbga.postMessage(msg);
    };

    $scope.playBegining = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playBegining();
    };

    $scope.playBackward = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playBackward(); 
    };
    $scope.playStart = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playStart(); 
    };
    $scope.playPause = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playPause(); 
    };
    $scope.playForward = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playForward(); 
    };
    $scope.playEnd = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.playEnd();
    };

    $scope.soundToggle = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.soundToggle();
    };
    $scope.soundUp = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.soundUp();
    };
    $scope.soundDown = function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.soundDown();
    };

    $scope.setVolume = function (volume) {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;
        $.nsAppKharbga.setVolume(volume);
    };

    setTimeout(function () {
        if ($.nsAppKharbga == null || angular.isUndefined($.nsAppKharbga))
            return;

        $.nsAppKharbga.setup();

    }, 1000);  // run this after completing loading
 

}]);


/* replay controller */
nsApp.controller('replayController', ['$scope', '$state', '$stateParams', '$rootScope', '$http', '$log', 'localStorageService' , 'appConstants',
    function ($scope, $state, $stateParams, $rootScope, $http, $log, localStorageService, appConstants) {

    $log.info("Kharbga replay controller started");
    $scope.currentGame = null;

    if ($.nsAppKharbga != null && !angular.isUndefined($.nsAppKharbga)) {
        $.nsAppKharbga.initBoard({ themePath: './img/theme-basic/{piece}.png' });

        $scope.currentGame = $.nsAppKharbga.getCurrentGame();
    };

}]);