/* session controller */
nsApp.controller('sessionController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window) {
        document.title = "Login/Register";
        $scope.message = "";

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var logoutUrl = "/user/logout";


        var setupUser = function (sessionData) {
      
            if (sessionData != null && sessionData.IsActive) {
                $scope.user.loggedIn = true;
                $scope.user.name = sessionData.FullName;
                //  $scope.user.sessionId = sessionData.SessionId;
                $scope.user.role = sessionData.MainRole;
                $scope.user.lastAccess = sessionData.LastAccess;
                $scope.user.orgId = sessionData.ClientId;
                $scope.user.isAdmin = sessionData.IsAdmin;

               // $.nsAppKharbga.setSessionId(sessionData.SessionId);
            }
            else {
                $scope.user = {
                    name: "", sessionId: "", currentGameId: "", role: "", loggedIn: false,
                    lastAccess: '', isAdmin: false, orgId: 0
                };
                $state.go('Login', {});
                $location.path(loginUrl);
               // $state.reload(); 

              //  $.nsAppKharbga.setSessionId("");
            }

            $rootScope.user = $scope.user;
        };

        // read the user info from localStorage  if any 
        var _checkSession =  function () {      
            var sessionData = localStorageService.get('sessionData');
       
            //setupUser(null);
        //    $scope.message = "Processing...";
            if (sessionData != null) {
                var sessionId = sessionData.SessionId;
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
            var sessionId = sessionData.SessionId;
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

                }, function (response) {
                    $scope.message = response.statusText;
                });
            }
        };

        // call on startup
        _checkSession();

        $scope.logout = _logout;

        $scope.play = function (options) {
            $state.go('Play', options);
        };

    }]);