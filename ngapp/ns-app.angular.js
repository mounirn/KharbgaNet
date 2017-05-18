var nsApp = angular.module('nsApp', ['ui.router', 'LocalStorageModule', 'ui.bootstrap']);
/* States */
nsApp.config(['$locationProvider', '$urlMatcherFactoryProvider', '$stateProvider', '$urlRouterProvider',
    function ($locationProvider, $urlMatcherFactoryProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false); // ??
    $urlMatcherFactoryProvider.caseInsensitive(true);
  
    var homeState = {
        name: 'Home',
        url: '/home',
        templateUrl: 'ngapp/views/home.html'
    }
    var systemState = {
        name: 'System',
        url: '/system',
        templateUrl: 'ngapp/views/system.html', 
    }
    var aboutState = {
        name: 'About',
        url: '/about',
        templateUrl: 'ngapp/views/about.html'
    }
    var loginState = {
        name: 'Login',
        url: '/user/login',
        templateUrl: 'ngapp/views/login.html'
    }
    var profileState = {
        name: 'My Profile',
        url: '/user/profile',
        templateUrl: 'ngapp/views/profile.html'
    }

    var logoutState = {
        name: 'Logout',
        url: '/user/logout',
        templateUrl: 'ngapp/views/logout.html'
    }

    var registerState = {
        name: 'Register',
        url: '/user/register',
        templateUrl: 'ngapp/views/register.html'
    }

    var registerConfirmState = {
        name: 'Confirm Email',
        url: '/register/confirm',
        templateUrl: 'ngapp/views/register_confirm.html'
    }

    var forgotLoginState = {
        name: 'Forgot Login Info',
        url: '/register/forgotLogin',
        templateUrl: 'ngapp/views/forgot_login.html'
    }

    var playState = {
        name: 'Play',
        url: '/play?',
        templateUrl: 'ngapp/views/kharbga.html'
    }

    var helpState = {
        name: 'Help',
        url: '/help',
        templateUrl: 'ngapp/views/help.html'
    }

    var rulesState = {
        name: 'Rules',
        url: '/rules',
        templateUrl: 'ngapp/views/rules.html'
    }

    var contactUsState = {
        name: 'Contact Us',
        url: '/user/contactUs',
        templateUrl: 'ngapp/views/contactUs.html'
    }

    var termsState = {
        name: 'Terms',
        url: '/user/terms',
        templateUrl: 'ngapp/views/terms.html'
    }
    var privacyState = {
        name: 'Privacy',
        url: '/user/privacy',
        templateUrl: 'ngapp/views/privacy.html'
    }




    $stateProvider.state(homeState);
    $stateProvider.state(systemState);
    $stateProvider.state(aboutState);
    $stateProvider.state(loginState);
    $stateProvider.state(registerState);
    $stateProvider.state(registerConfirmState);
    $stateProvider.state(forgotLoginState);
    $stateProvider.state(playState);
    $stateProvider.state(helpState);
    $stateProvider.state(profileState);
    $stateProvider.state(rulesState);
    $stateProvider.state(logoutState);
    $stateProvider.state(contactUsState);
    $stateProvider.state(termsState);
    $stateProvider.state(privacyState);

    $urlRouterProvider.otherwise('/home');

}]);

/* App Constants */
nsApp.constant('appConstants', {
    Settings: {
        appName: "Kharbga",
        ApiServiceBaseUri: nsApiClient.baseURI,
        DefaultUrl: '/play', 
        ClientId: 'nsAppKharbga'
    },
 
    UserRoles: { // Match what is defined in UserRole.cs
        Guest: 0,
        Regular: 1,
        ClientAdmin: 99,
        SystemAdmin: 999
    }
});

nsApp.factory('authInterceptorService', ['$q', '$injector', '$location', 'localStorageService',
    function ($q, $injector, $location, localStorageService) {

    var authInterceptorServiceFactory = {};

    var _request = function (config) {

        config.headers = config.headers || {};

        var authData = localStorageService.get('authorizationData');
        if (authData) {
            config.headers.Authorization = 'Bearer ' + authData.token;
        }

        return config;
    }

    var _responseError = function (rejection) {
        if (rejection.status === 401) {
            var secService = $injector.get('secService');
            var authData = localStorageService.get('authorizationData');

            if (authData) {
                if (authData.useRefreshTokens) {
                    $location.path('/refresh');
                    return $q.reject(rejection);
                }
            }
            secService.logOut();
            $location.path('/login');
        }
        return $q.reject(rejection);
    }

    authInterceptorServiceFactory.request = _request;
    authInterceptorServiceFactory.responseError = _responseError;

    return authInterceptorServiceFactory;
    }]);

/* Shared service */
nsApp.factory('appSharedService', function ($rootScope) {
    var sharedService = {};

    sharedService.actionType = 'None';
    sharedService.data = -1;

    sharedService.prepForBroadcast = function (actionType, data) {
        this.actionType = actionType;
        this.data = data;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function () {
        $rootScope.$broadcast('handleBroadcast');
    };

    return sharedService;
});


nsApp.run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
    $rootScope.color = 'blue';
    $rootScope.user = { sessionId: "", loggedIn: false };

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);


nsApp.filter('toStatusString', function () {
    return function (state) {
        switch (status) {
            case 0:
                return "Created";
            case 1:
                return "Joined";
            case 2:
                return "Active";
            case 3:
                return "Completed";
            case 4:
                return "Aborted";
            case 5:
                return "Disconnected";
            default:
                return "Unknown";
        }
    };
});

nsApp.filter('toStateString', function () {
    return function (state) { return Kharbga.GameState[state]; }; // depends on Kharbga.js
});
