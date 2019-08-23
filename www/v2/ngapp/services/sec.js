/* Security Service*/
// http://jasonwatmore.com/post/2015/03/10/angularjs-user-registration-and-login-example-tutorial

myApp.factory('secService', ['$http', '$q', '$rootScope','localStorageService',  'appConstants',
    function ($http, $q, localStorageService, appConstants) {

        var serviceBase = appConstants.Settings.ApiServiceBaseUri + "api/user/";
        var authServiceFactory = {};

        var initAuthentication = {
            isAuth: false,
            userName: "",
            fullName: "",
            role: "",
            useRefreshTokens: false
        };

        var _authentication = {};

        var setAuthenticationData = function (data) {

            _authentication.isAuth = !!data;

            if (!data) {
                data = initAuthentication;
            }

            _authentication.userName = data.userName;
            _authentication.fullName = data.fullName;
            _authentication.role = data.role;
            _authentication.useRefreshTokens = data.useRefreshTokens;
        };

        setAuthenticationData();

        var _saveRegistration = function (registration) {
            _logOut();

            return $http.post(serviceBase + 'register', registration).success(function (response) {

                var authorizationData = { token: response.access_token, userName: registration.userName, fullName: response.userName, refreshToken: "", useRefreshTokens: false, role: response.role };

                localStorageService.set('authorizationData', authorizationData);

                setAuthenticationData(authorizationData);

                _setupAjaxWithToken(response.access_token);

                return response;
            }).error(function (err, status) {
                return err;
            });
        };

        var _login = function (loginData) {
       
            var deferred = $q.defer();

            $http({
                method: "POST",
                url: (serviceBase + 'api/user/token'), 
                headers: {
                    'Content-Type': "application/json"
                },
                data: loginData
            }).then(function (response) {
                localStorageService.set('sessionData', response.data);

                deferred.resolve(response);
                
            }, function (response) {
                $rootScope.message = response.statusText;

                deferred.reject(err);
            });

           
     /*       var data = "grant_type=password&username=" + loginData.userName + "&password=" + loginData.password;

            if (loginData.useRefreshTokens) {
                data = data + "&client_id=" + appConstants.Settings.ClientId;
            }     

            $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {

                var authorizationData = null;

                if (loginData.useRefreshTokens) {
                    authorizationData = { token: response.access_token, userName: loginData.userName, fullName: response.userName, refreshToken: response.refresh_token, useRefreshTokens: true, role: response.role };
                }
                else {
                    authorizationData = { token: response.access_token, userName: loginData.userName, fullName: response.userName, refreshToken: "", useRefreshTokens: false, role: response.role };
                }

                localStorageService.set('authorizationData', authorizationData);

                setAuthenticationData(authorizationData);

                _setupAjaxWithToken(response.access_token);

                deferred.resolve(response);

            }).error(function (err, status) {
                _logOut();
                deferred.reject(err);
            });
*/
            return deferred.promise;

        };

        var _logOut = function () {

            localStorageService.remove('authorizationData');

            setAuthenticationData();

            $.ajaxSetup({
                headers: {}
            });

            _setupAjaxWithToken();

        };

        var _fillAuthData = function () {

            var authData = localStorageService.get('authorizationData');
            if (authData) {
                setAuthenticationData(authData)

                _setupAjaxWithToken(authData.token);
            }

        };

        var _setupAjaxWithToken = function (token) {  // Setup global ajax header

            var headers = {};

            if (token) {
                headers = {
                    Authorization: 'Bearer ' + token
                };
            }

            $.ajaxSetup({
                headers: headers
            });
        };

        var _refreshToken = function () {
            var deferred = $q.defer();

            var authData = localStorageService.get('authorizationData');

            if (authData) {

                if (authData.useRefreshTokens) {

                    var data = "grant_type=refresh_token&refresh_token=" + authData.refreshToken + "&client_id=" + appConstants.AuthSettings.ClientId;

                    localStorageService.remove('authorizationData');

                    $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {

                        localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, refreshToken: response.refresh_token, useRefreshTokens: true });

                        deferred.resolve(response);

                    }).error(function (err, status) {
                        _logOut();
                        deferred.reject(err);
                    });
                }
            }

            return deferred.promise;
        };

        authServiceFactory.saveRegistration = _saveRegistration;
        authServiceFactory.login = _login;
        authServiceFactory.logOut = _logOut;
        authServiceFactory.fillAuthData = _fillAuthData;
        authServiceFactory.authentication = _authentication;
        authServiceFactory.refreshToken = _refreshToken;

        return authServiceFactory;
    }]);
