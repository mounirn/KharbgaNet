/* main controller */
nsApp.controller('mainController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        document.title = "Home";
        $scope.message = "";
        $scope.sessionData = localStorageService.get('sessionData');

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var logoutUrl = "/user/logout";


        var setupUser = function (sessionData) {

            $scope.sessionData = sessionData; 

            if (sessionData != null && sessionData.isActive) {
                $scope.user.loggedIn = true;
                $scope.user.name = sessionData.fullName;
                //  $scope.user.sessionId = sessionData.SessionId;
                $scope.user.role = sessionData.mainRole;
                $scope.user.lastAccess = sessionData.lastAccess;
                $scope.user.orgId = sessionData.clientId;
                $scope.user.isAdmin = sessionData.isAdmin;
                _updateTeamInfo();
            }
            else {
                $scope.user = {
                    name: "", sessionId: "", currentGameId: "", role: "", loggedIn: false,
                    lastAccess: '', isAdmin: false, orgId: 0
                };
                $state.go('Home', {});

                $scope.user.currentGame = $.nsAppKharbga.getCurrentGame();
                $scope.user.currentState = $.nsAppKharbga.getCurrentState();
             //   $location.path(loginUrl);

            }

            $rootScope.user = $scope.user;
        };

        // read the user info from localStorage  if any 
        var _checkSession =  function () {      
            var sessionData = localStorageService.get('sessionData');
       
            //setupUser(null);
        //    $scope.message = "Processing...";
            if (sessionData != null) {
                var sessionId = sessionData.sessionId;
                $http({
                    method: "GET",
                    url: (serviceBase + 'token'),
                    headers: {
                        'Content-Type': "application/json", "_nssid": sessionId
                    }
                }).then(function (response) {
                    localStorageService.set('sessionData', response.data.session);
                    setupUser(sessionData);  
                    $scope.systemError = false;
                    $scope.message = "";

                 
                }, function (response) {
                    $scope.systemError = true;
                    setupUser(null);  
                });
            }
            else {
                setupUser(sessionData);    
               
            }
        };

        var _logout = function () {
            //  $scope.message = "Processing...";
            var sessionData = localStorageService.get('sessionData');
            var sessionId = sessionData.sessionId;
            if (sessionData) {
                $http({
                    method: "DELETE",
                    url: (serviceBase + 'token'),
                    headers: {
                        'Content-Type': "application/json", "_nssid": sessionId
                    }
                }).then(function (response) {
                    localStorageService.remove('sessionData');

                    setupUser(null);
                    $scope.message = "";
                    $state.go('Logout', {});

                }, function (response) {
                    $scope.message = response.statusText;
                });
            }
        };

        // call on startup
        _checkSession();

        $scope.logout = _logout;

        $scope.play = function (options) {
            $scope.sessionData = localStorageService.get('sessionData');

            if ($scope.sessionData != null && $scope.sessionData.isActive) {
                $state.go('Play', options);
                setTimeout(function () { $.nsAppKharbga.newGame(options); }, 1000);
                
            }
            else {
                $state.go('Login', options);
            }
        };

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
              //  $state.reload();  // refresh the state
            });

        };

     //   $scope.updateTeamInfo = _updateTeamInfo;

        


    }]);