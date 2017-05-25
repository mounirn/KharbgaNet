/* user controller */
nsApp.controller('userController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        document.title = "Login/Register";
        $scope.message = "";
        $log.info("userController started");
        $scope.sessionData = localStorageService.get('sessionData');

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var homeUrl = "/#!/home";
        var logoutUrl = "/user/logout";

        $scope.loginData = { };

        $scope.registerData = {};

        $scope.teamList = [];

       // $scope.errorMessage = "";

        $scope.login = function () {

            var form = $scope.loginForm;
            if (form.$invalid) {
                $scope.invalidInput = true; 
                angular.element("[name='" + form.$name + "']").find('.ng-invalid:visible:first').focus();
                return;
            }
            $scope.invalidInput = false;
            $scope.message = "Processing...";
            $log.info("userController login start");

            $http({
                method: "POST",
                url: (serviceBase + 'token'),
                headers: {
                    'Content-Type': "application/json"
                },
                data: $scope.loginData
            }).then(function (response) {
     
                $scope.message = "";           
                $scope.invalidLogin = false;
                $log.info("userController login success");
                // add check for result
                setupUser(response.data);

                }, function (response) {
                    $log.info("userController login error");
                   if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true; // ("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    $scope.systemError = true; //("<div class='alert alert-danger'> Failed to login</div>");
                   $scope.session = {};
                   $scope.message = "";

                   setupUser(null);
            });
        };


        $scope.register = function () {

            var form = $scope.registerForm;
            if (form.$invalid) {
                $scope.invalidInput = true;
                
                angular.element("[name='" + form.$name + "']").find('.ng-invalid:visible:first').focus();
                return;
            }
            $scope.invalidInput = false;
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
                setupUser(response.data);

            }, function (response) {
                if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true; // ("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    $scope.systemError = true; //("<div class='alert alert-danger'> Failed to login</div>");

                $scope.message = "";
            });
        };

        $scope.teamChange = function () {
            var sessionId = "";
            if ($scope.sessionData != null)
                sessionId = $scope.sessionData.sessionId;
            // calling the API here
            nsApiClient.clientService.getClients(sessionId, $scope.registerData.orgName, function (data,status) {
                $scope.teamList = data;               
            });
        }

        var setupUser = function (sessionResult) {
            var sessionData = null;
            if (sessionResult != null)
                sessionData = sessionResult.object; 

            $scope.sessionData = sessionData; 
        

            if (sessionData != null && sessionData.isActive) {
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
     
        $scope.$watch('loginData', function () {
          //  $scope.message = "";
        },
            true);

        $scope.forgetPassword = function () {

            //todo:
        }

        var _updateTeamInfo = function (sessionId) {
        
            nsApiClient.clientService.getClientInfo(sessionId, function (data, status) {
                $scope.user.team = data;
                $scope.user.team.status = status;
             
            });

        };

        var _updateAccountInfo = function (sessionId) {
          
            nsApiClient.userService.getAccountInfo(sessionId, function (data, status) {
                $scope.user.account = data;
                $scope.user.account.status = status;
            });
        };


    }]);