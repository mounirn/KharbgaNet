/* System controller */

nsApp.controller('systemController', ['$scope', '$state', '$http', 'appConstants', 'localStorageService', '$log',
    function ($scope, $state, $http, appConstants, localStorageService, $log) {
    document.title = appConstants.appName + " - System Info";
    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri + 'api/app/';

    $scope.hasConnections = false;
    $scope.hasPlayers = false;
    $scope.hasGames = false;

    // http://plnkr.co/edit/UonOgNz0s16iKJkWLwyg?p=preview
    $scope.reverse = false;  // sorting

    $scope.systemError = false; 

    var _refreshConnections = function () {
        var sessionData = localStorageService.get('sessionData');

        if (sessionData == null || angular.isUndefined(sessionData)) {
            $scope.invalidSession = true;
            $state.go('Login', {});
            return;
        }
        $scope.invalidSession = false;
        $log.info("system controller - refreshing connections");
        var sessionId = sessionData.sessionId;
        $scope.message = "Processing...";
        $http({
            method: "GET",
            headers: {
                'Content-Type': "application/json", "_nssid": sessionId
            },
            url: (serviceBase + 'connections')
        }).then(function (response) {
            $scope.connections = response.data;
            $scope.message = "";
            $scope.hasConnections = true;
            $scope.systemError = false; 
        }, function (response) {
            $scope.message = "";
            $log.error(response.statusText);
            $scope.systemError = true; 
            $scope.hasConnections = false;
        });
    }
    var _refreshPlayers = function () {
        var sessionData = localStorageService.get('sessionData');

        if (sessionData == null || angular.isUndefined(sessionData)) {
            $scope.invalidSession = true;
            $state.go('Login', {});
            return;
        }
        $scope.invalidSession = false;
        $log.info("system controller - refreshing players");
        var sessionId = sessionData.sessionId;
        $scope.message = "Processing...";
        $http({
            method: "GET",
            headers: {
                'Content-Type': "application/json", "_nssid": sessionId
            },
            url: (serviceBase + 'players')
        }).then(function (response) {
            $scope.players = response.data;
            $scope.message = "";
            $scope.hasPlayers = true;
            $scope.systemError = false; 
        }, function (response) {
            $scope.message = "";
            $log.error(response.statusText);
            $scope.systemError = true; 
            $scope.hasPlayers = false;
        });
    };

    var _refreshGames = function () {
        var sessionData = localStorageService.get('sessionData');

        if (sessionData == null || angular.isUndefined(sessionData)) {
            $scope.invalidSession = true;
            $state.go('Login', {});
            return;
        }
        $scope.invalidSession = false;
        $log.info("system controller - refreshing games");
        var sessionId = sessionData.sessionId;
        $scope.message = "Processing...";
        $http({
            method: "GET",
            headers: {
                'Content-Type': "application/json", "_nssid": sessionId
            },
            url: (serviceBase + 'games')
        }).then(function (response) {
            $scope.games = response.data;
            $scope.message = "";
            $scope.hasGames = true;
            $scope.systemError = false; 
        }, function (response) {
            $scope.message = "";
            $log.error(response.statusText);
            $scope.systemError = true; 
            $scope.hasGames = false;
        });
    };

    $scope.orderByMe = function (x) {
        $scope.myOrderBy = x;
    }

    // refresh
    _refreshConnections();
    _refreshPlayers();
    _refreshGames();

    $scope.refreshConnections = _refreshConnections;
    $scope.refreshPlayers = _refreshPlayers;
    $scope.refreshGames = _refreshGames;

}]);