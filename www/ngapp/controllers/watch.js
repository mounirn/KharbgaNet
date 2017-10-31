/* Kharbga controller */
nsApp.controller('kharbgaController', ['$scope', '$state', '$stateParams', '$rootScope', '$http', '$log', 'localStorageService' , 'appConstants',
    function ($scope, $tsate, $stateParams, $rootScope, $http, $log, localStorageService, appConstants) {
//    document.title = "Kharbga";
    $log.info("Kharbga controller started");

    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri;
    $.nsAppKharbga.initBoard({ themePath: './img/theme-simple/{piece}.png' });
    $log.info("Called Init Board");


    $scope.sessionData = localStorageService.get('sessionData');
    if ($scope.sessionData != null) {
        $log.info("Setting the Game Session ID");

        $.nsAppKharbga.setSessionId($scope.sessionData.SessionId);
    }
    else
        $.nsAppKharbga.setSessionId("");

    var _refreshGames = function () {
        if ($scope.sessionData != null)
            $.nsAppKharbga.refreshGames();
        else {
            $scope.message = "Please login to play or view active games";
        }
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

    $scope.refreshGames = _refreshGames;
    $scope.flipBoard = function () {
        // issue with flip losing game attacker and defender info and 
        // cell highlighting
        $.nsAppKharbga.flipBoard();
    };

    $scope.newGame = function (options) {
        if (options == null)
            return;
        if (typeof options.asAttacker == 'undefined')
            return;

        if ($scope.sessionData != null && $scope.sessionData.IsActive)
            $.nsAppKharbga.newGame(options); 
        else {
            $scope.message = "Please login to be able to start a new game!";
        }

       
    };

    $scope.post = function () {
        // 
        var msg = {message: $scope.moveMessage};
        $.nsAppKharbga.postMessage(msg);
    };

  /*  setTimeout(function () {
        _refreshGames();

        $scope.newGame($rootScope.$stateParams);
    }, 2000);  // run this after completing loading
*/
  

}]);