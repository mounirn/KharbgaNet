/* Help controller */
nsApp.controller('helpController', ['$scope', '$rootScope', '$http', 'appConstants',
    function ($scope, $rootScope, $http, appConstants) {
    document.title = appConstants.appName + " - Help";
    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri + 'api/app/';

    $scope.hasMessages = false;
  

    var _refreshMessages = function () {
        $rootScope.processing = true;
        $http({
            method: "GET",
            url: (serviceBase + 'games')
        }).then(function (response) {
            $scope.games = response.data;
            $rootScope.processing = false;
            $scope.hasGames = true;
        }, function (response) {
            $scope.message = response.statusText;
            $rootScope.systemError = true; 
            $scope.hasGames = false;
            $rootScope.processing = false;
        });
    };




    // refresh
    _refreshMessages();

    $scope.refreshMessages = _refreshMessages;
    $scope.ping = function () {

        $.nsAppKharbga.ping();
    };

}]);