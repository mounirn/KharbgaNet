/* login controller */
nsApp.controller('userController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window) {
        document.title = "Login/Register";
        $scope.message = "";

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var logoutUrl = "/user/logout";

        $scope.loginData = {
            userName: "",
            password: "",
            useRefreshTokens: false
        };

       // $scope.errorMessage = "";

        $scope.login = function () {
           
            if ($scope.loginForm.$invalid) {
                $scope.invalidInput = true; 
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
                $state.go('Play', {})
                setupUser(response.data.session);

                $scope.message = "";     
       
                $scope.invalidLogin = false;
                $scope.message = "";

            }, function (response) {
                   if (response.status === 404 || response.status === 400)
                    $scope.invalidLogin = true; // ("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    $scope.systemError = true; //("<div class='alert alert-danger'> Failed to login</div>");

                   $scope.message = "";
            });
        };

        var setupUser = function (sessionData) {
            if (sessionData != null && sessionData.IsActive) {
                $scope.user.loggedIn = true; 
                $scope.user.name = sessionData.FullName;
              //  $scope.user.sessionId = sessionData.SessionId;
                $scope.user.role = sessionData.MainRole;
                $scope.user.lastAccess = sessionData.LastAccess;
                $scope.user.orgId = sessionData.ClientId;
                $scope.user.isAdmin = sessionData.IsAdmin;
              //  $state.reload();
                $.nsAppKharbga.setSessionId(sessionData.SessionId);

            }   
            else {

                $scope.user = { name: "", sessionId: "", currentGameId: "", role: "", loggedIn: false, lastAccess: '', isAdmin: false, orgId: 0 };
                $state.go('Login', {});
                $location.path(loginUrl);
              //  $state.reload(); 
                $.nsAppKharbga.setSessionId('');
            }

            $rootScope.user = $scope.user;
        };
     
        $scope.$watch('loginData', function () {
          //  $scope.message = "";
        }, true);

        $scope.forgetPassword = function () {

            //todo:
        }
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
                    $location.path(loginUrl);
                 
                });
            }
            else {
                $location.path(loginUrl);
                setupUser(sessionData);    
               
            }
        };

        // call on startup
  //      _checkSession();

   

    }]);