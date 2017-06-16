/* App controller */

nsApp.controller('appController', ['$scope', '$rootScope', '$http', 'appConstants',
    function ($scope, $rootScope, $http, appConstants) {
    document.title = "App Info";
    // appSharedService.prepForBroadcast('shouldSelectTab', appConstants.NavTabs.Settings);
    var serviceBase = appConstants.Settings.ApiServiceBaseUri;
    $scope.baseURI = appConstants.Settings.ApiServiceBaseUri;

    $scope.appInfo = {};

    var _refresh = function () {
        $rootScope.processing = true;
        $http({
            method: "GET",
            url: (serviceBase + 'api/app/info')
        }).then(function (response) {
            $scope.appInfo = response.data;
            $rootScope.processing = false;
            $rootScope.systemError = false; 
        }, function (response) {
            $scope.message = response.statusText;
          
            $rootScope.systemError = true; 
            $rootScope.processing = false;
        });
    }
    // refresh
    _refresh();

    $scope.refresh = _refresh;

}]);