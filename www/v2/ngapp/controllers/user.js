/* register controller */
myApp.controller('registerController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        $scope.message = "";
        $log.info("registerController started");
        $scope.sessionData = localStorageService.get('sessionData');

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var homeUrl = "/#!/home";
        var logoutUrl = "/user/logout";

        $scope.registerData = {};

        $scope.teamList = [];

        $scope.register = function () {

            var form = $scope.registerForm;
            if (form.$invalid) {
                $scope.invalidInput = true;
                
                angular.element("[name='" + form.$name + "']").find('.ng-invalid:visible:first').focus();
                return;
            }
            $scope.invalidInput = false;
            $scope.systemError = false;
            $scope.message = "Processing...";

            $http({
                method: "POST",
                url: (serviceBase + 'register'),
                headers: {
                    'Content-Type': "application/json"
                },
                data: $scope.registerData
            }).then(function (response) {
                $scope.message = "";
                $scope.invalidLogin = false;
                $scope.systemError = false;
                $scope.message = "";
                $scope.setupSessionData(response.data);

            }, function (response) {
                if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true; 
                else
                    $rootScope.systemError = true; 

                $scope.message = "";
                $rootScope.processing = false;
                $scope.setupSessionData(null);  
            });
        };

        $scope.teamChange = function () {
            var sessionId = "";
            if (angular.isObject($scope.sessionData) )
                sessionId = $scope.sessionData.sessionId;

            // calling the API here
            nsApiClient.clientService.getClientsLookup(sessionId, $scope.registerData.orgName, function (data, status) {
                $scope.teamList = data;
            });
        };

        var setupUser = function (sessionResult) {
            var sessionData = null;
            if (sessionResult != null)
                sessionData = sessionResult.object; 

            $scope.sessionData = sessionData; 
        

            if (angular.isObject(sessionData) && sessionData.isActive) {
                localStorageService.set('sessionData', sessionData); 

                $scope.user = {};
                $scope.user.loggedIn = true; 
                $scope.invalidLogin = false;

                $.nsAppKharbga.setSessionId(sessionData.sessionId);
                _updateAccountInfo(sessionData.sessionId);
                _updateTeamInfo(sessionData.sessionId);
                $scope.user.currentGame = $.nsAppKharbga.getCurrentGame();
                $scope.user.currentState = $.nsAppKharbga.getCurrentState();
                $rootScope.user = $scope.user;
                $rootScope.sessionData = $scope.sessionData;
                $state.go('Home', {});
                $location.path(homeUrl);
            }   
            else {
                localStorageService.remove('sessionData');
                $.nsAppKharbga.setSessionId('');
               
                $scope.user = { loggedIn: false };
                $scope.user.currentGame = {};
                $scope.user.currentState = {};
                $rootScope.user = $scope.user;
                $rootScope.sessionData = $scope.sessionData;

               $state.go('Login', {});
            }

            $rootScope.user = $scope.user;
            $rootScope.sessionData = $scope.sessionData;
        };
   
    }]);

/* register Confirm controller */
myApp.controller('registerConfirmController', ['$scope', '$state', '$stateParams', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $stateParams, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        $scope.message = "";
        $log.info("registerConfirmController started");
        $scope.sessionData = localStorageService.get('sessionData');

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        $scope.userId = $stateParams.userId; 
        $scope.email = $stateParams.email;

    }]);


/* contactUs controller */
myApp.controller('contactUsController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        $scope.message = "";
        $log.info("contactUsController started");
        $scope.sessionData = localStorageService.get('sessionData');

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        $scope.contactUsData = {};
        if ($scope.SessionData != null) {
            $scope.contactUsData.sessionId = $scope.SessionData.sessionId;
        }
        else {
            $scope.contactUsData.sessionId = "";
        }
        $scope.send = function () {

            var form = $scope.contactUsForm;
            if (form.$invalid) {
                $scope.invalidInput = true;

                angular.element("[name='" + form.$name + "']").find('.ng-invalid:visible:first').focus();
                return;
            }
            $scope.invalidInput = false;
            $scope.systemError = false;
            $scope.message = "Processing...";

            $http({
                method: "POST",
                url: (serviceBase + 'send'),
                headers: {
                    'Content-Type': "application/json", '_nssid': $scope.contactUsData.sessionId
                },
                data: $scope.contactUsData
            }).then(function (response) {
                $scope.message = "";
                $scope.systemError = false;
                $scope.message = "";

            }, function (response) {
                if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true;
                else
                    $rootScope.systemError = true;

                $scope.message = "";
                $rootScope.processing = false;
            });
        };


    }]);