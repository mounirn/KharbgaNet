/* Help controller */
nsApp.controller('helpController', ['$scope', '$http', 'appConstants', function ($scope, $http, appConstants) {
    document.title = appConstants.appName + " - Help";
    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri + 'api/app/';

    $scope.hasMessages = false;
  

    var _refreshMessages = function () {
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




    // refresh
    _refreshMessages();

    $scope.refreshMessages = _refreshMessages;
    $scope.ping = function () {

        $.nsAppKharbga.ping();
    };

}]);