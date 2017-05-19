/* App controller */

nsApp.controller('appController', ['$scope', '$http', 'appConstants', function ($scope, $http, appConstants) {
    document.title = "App Info";
    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri;
    $scope.baseURI = appConstants.Settings.ApiServiceBaseUri;

    $scope.appInfo = {};

    var _refresh = function () {
        $scope.message = "Processing...";
        $http({
            method: "GET",
            url: (serviceBase + 'api/app/info')
        }).then(function (response) {
            $scope.appInfo = response.data;
            $scope.message = "";
        }, function (response) {
            $scope.message = response.statusText;
        });
    }
    // refresh
    _refresh();

    $scope.refresh = _refresh;

}]);