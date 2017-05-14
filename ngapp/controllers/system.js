/* System controller */

nsApp.controller('systemController', ['$scope', '$http', 'appConstants', function ($scope, $http, appConstants) {
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
        $scope.message = "Processing...";
        $http({
            method: "GET",
            url: (serviceBase + 'connections')
        }).then(function (response) {
            $scope.connections = response.data;
            $scope.message = "";
            $scope.hasConnections = true;
        }, function (response) {
            $scope.message = response.statusText;
            $scope.systemError = true; 
            $scope.hasConnections = false;
        });
    }
    var _refreshPlayers = function () {
        $scope.message = "Processing...";
        $http({
            method: "GET",
            url: (serviceBase + 'players')
        }).then(function (response) {
            $scope.players = response.data;
            $scope.message = "";
            $scope.hasPlayers = true;
        }, function (response) {
            $scope.message = response.statusText;
            $scope.systemError = true; 
            $scope.hasPlayers = false;
        });
    };

    var _refreshGames = function () {
        $scope.message = "Processing...";
        $http({
            method: "GET",
            url: (serviceBase + 'games')
        }).then(function (response) {
            $scope.games = response.data;
            $scope.message = "";
            $scope.hasGames = true;
        }, function (response) {
            $scope.message = response.statusText;
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