/* login controller */
nsApp.controller('userController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        document.title = "Login/Register";
        $scope.message = "";
        $scope.sessionData = localStorageService.get('sessionData');
        $scope.team = {};

        $log.info("userController started");

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
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
            
            $http({
                method: "POST",
                url: (serviceBase + 'token'),
                headers: {
                    'Content-Type': "application/json"
                },
                data: $scope.loginData
            }).then(function (response) {
                localStorageService.set('sessionData', response.data.session); 
                $scope.message = "";           
                $scope.invalidLogin = false;

               setupUser(response.data.session);

            }, function (response) {
                   if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true; // ("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    $scope.systemError = true; //("<div class='alert alert-danger'> Failed to login</div>");

                   $scope.message = "";
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
                localStorageService.set('sessionData', response.data.session);
                $scope.message = "";
                $scope.invalidLogin = false;
                $scope.message = "";
                setupUser(response.data.session);

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

        var setupUser = function (sessionData) {
            if (sessionData != null && sessionData.isActive) {
                $scope.user.loggedIn = true; 
                $scope.user.name = sessionData.fullName;
              //  $scope.user.sessionId = sessionData.SessionId;
                $scope.user.role = sessionData.mainRole;
                $scope.user.lastAccess = sessionData.lastAccess;
                $scope.user.orgId = sessionData.clientId;
                $scope.user.isAdmin = sessionData.isAdmin;
              //  $state.reload();

                $.nsAppKharbga.setSessionId(sessionData.sessionId);
                _updateTeamInfo();
                $state.go('Home', {});
            }   
            else {

                $scope.user = { name: "", sessionId: "", currentGameId: "", role: "", loggedIn: false, lastAccess: '', isAdmin: false, orgId: 0 };
                $.nsAppKharbga.setSessionId('');
                $state.go('Login', {});
                $location.path(loginUrl);
              //  $state.reload();              
            }

            $rootScope.user = $scope.user;
        };
     
        $scope.$watch('loginData', function () {
          //  $scope.message = "";
        },
            true);

        $scope.forgetPassword = function () {

            //todo:
        }

        // 
        
    
        

        var _updateTeamInfo = function () {
            var sessionId = "";
            $scope.sessionData = localStorageService.get('sessionData');
            if ($scope.sessionData == null)
                return;

            sessionId = $scope.sessionData.sessionId;
            nsApiClient.clientService.getClientInfo(sessionId, function (data, status) {
                $scope.user.team = data;
                $scope.status = status;
                $scope.user.currentGame = $.nsAppKharbga.getCurrentGame();
                $scope.user.currentState = $.nsAppKharbga.getCurrentState();
                $state.reload();  // refresh the state
            });

        };

    //    $scope.updateTeamInfo = _updateTeamInfo;

    }]);