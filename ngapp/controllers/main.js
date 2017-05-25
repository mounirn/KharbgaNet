/* main/home controller */
nsApp.controller('mainController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        this.message = "";
        $scope.sessionData = localStorageService.get('sessionData');
        $log.info("mainController started");
    
        this.play = function (options) {

            if ($scope.sessionData != null && $scope.sessionData.isActive) {
                $state.go('Play', options);
                if (!(options.asSpectator === true) ) {
                    setTimeout(function () { $.nsAppKharbga.newGame(options); }, 1000);
                }               
            }
            else {
                $state.go('Login', options);
            }
        };

        /* used by the different child controllers thru $scope and rootScope */
        $scope.setupSessionData = function (sessionResult) {
            var sessionData = null;
            if (sessionResult != null)
                sessionData = sessionResult.object;

            // $rootScope.sessionData = sessionData;

            if (sessionData != null && sessionData.isActive) {
                localStorageService.set('sessionData', sessionData);

                $.nsAppKharbga.setSessionId(sessionData.sessionId);
                $scope.sessionData = localStorageService.get('sessionData');
               
            }
            else {
                localStorageService.remove('sessionData');
                $.nsAppKharbga.setSessionId('');
                $scope.sessionData = localStorageService.get('sessionData');
            }

            $rootScope.sessionData = sessionData;
        };
    }]);

/* login controller */
nsApp.controller('loginController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        this.message = "";
        $log.info("loginController started");

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // after login
        var defaultUrl = "/user/profile";
        var loginUrl = "/user/login";
        var homeUrl = "/#!/home";
        var logoutUrl = "/user/logout";

        this.loginData = {};
        this.login = function () {
            var form = $scope.loginForm;
            if (form.$invalid) {
                this.invalidInput = true;
                angular.element("[name='" + form.$name + "']").find('.ng-invalid:visible:first').focus();
                return;
            }
            this.invalidInput = false;
            this.message = "Processing...";
            $log.info("loginController login start");

            $http({
                method: "POST",
                url: (serviceBase + 'token'),
                headers: {
                    'Content-Type': "application/json"
                },
                data: this.loginData
            }).then(function (response) {

                this.message = "";
                this.invalidLogin = false;
                $log.info("loginController login success");
                // add check for result
                $scope.setupSessionData(response.data);

                $state.go('Home', {});

            }, function (response) {
                $log.info("loginController login error");
                if (response.status === 404 || response.status === 400)
                    this.invalidLogin = true; // ("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    this.systemError = true; //("<div class='alert alert-danger'> Failed to login</div>");

                this.message = response.errorText;

                $scope.setupSessionData(null);  
            });
        };

    }]);


/* session controller */
nsApp.controller('sessionController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        this.message = "";
        this.data = localStorageService.get('sessionData');
        $log.info("sessionController started");

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";

        // read the session info from localStorage if any 
        this.checkSession = function () {
            var sessionData = localStorageService.get('sessionData');

            if (sessionData == null || angular.isUndefined(sessionData)) {
                this.invalidSession = true;
                return;
            }
            var sessionId = sessionData.sessionId;
            $http({
                method: "GET",
                url: (serviceBase + 'token'),
                headers: {
                    'Content-Type': "application/json", "_nssid": sessionId
                }
            }).then(function (response) {
                this.systemError = false;
                this.message = "";
                this.invalidSession = false;

                $scope.setupSessionData(response.data);  
                this.data = localStorageService.get('sessionData');

            },
            function (response) {
                if (response.status === 404 || response.status === 400)
                    this.invalidSession = true;
                else
                    this.systemError = true;

                this.message = response.statusText;
                $scope.setupSessionData(response.data);  
                this.data = localStorageService.get('sessionData');

            });
        };

        this.logout = function () {
            //  $scope.message = "Processing...";
            var sessionData = localStorageService.get('sessionData');

            if (sessionData != null) {
                var sessionId = sessionData.sessionId;
                $http({
                    method: "DELETE",
                    url: (serviceBase + 'token'),
                    headers: {
                        'Content-Type': "application/json", "_nssid": sessionId
                    }
                }).then(function (response) {
                    localStorageService.remove('sessionData');

                    $scope.message = "";
                    $state.go('Logout', {});

                }, function (response) {
                    $scope.message = response.statusText;
                });
            }
         
            $scope.setupSessionData(null);
            $state.go('Logout', {}); 
        };

        // call on startup
        this.checkSession();

    }]);

/* user account controller */
nsApp.controller('accountController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        $log.info("accountController started");
        $scope.user = {};
        $scope.action = {};
        $scope.action.invalid = true;
        this.updateAccountInfo = function () {
            var sessionData = localStorageService.get('sessionData');
            if (sessionData == null) {
                return;
            }
            var sessionId = sessionData.sessionId;

            nsApiClient.userService.getAccountInfo(sessionId, function (data, status) {
               
                $scope.user.account = data.object;
                if (angular.isObject($scope.user.account))
                    $scope.action.invalid = false;

                $scope.action.status = status;

                // add check for status to trigger a system error event
            });
        };

        this.updateAccountInfo();


    }]);

/* team controller */
nsApp.controller('teamController', ['$scope', '$state', '$rootScope', '$location', 'appConstants', 'localStorageService', '$http', '$window', '$log',
    function ($scope, $state, $rootScope, $location, appConstants, localStorageService, $http, $window, $log) {
        $scope.message = "";
        $log.info("teamController started");
        $scope.action = {};
        $scope.action.invalid = true;

        $scope.team = null;

        this.updateTeamInfo = function () {
            var sessionData = localStorageService.get('sessionData');
            if (sessionData == null) {
                return;
            }
            var sessionId = sessionData.sessionId;

            nsApiClient.clientService.getClientInfo(sessionId, function (data, status) {

                $scope.team = data;
                if (angular.isObject($scope.team))
                    $scope.action.invalid = false;

                $scope.action.status = status;

            });

        };

        this.updateTeamInfo();

    }]);