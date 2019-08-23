var myApp = angular.module('nsApp', ['ui.router', 'LocalStorageModule', 'ui.bootstrap' ]);
/* States */
myApp.config(['$locationProvider', '$urlMatcherFactoryProvider', '$stateProvider', '$urlRouterProvider',
    function ($locationProvider, $urlMatcherFactoryProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false); // ??
    $urlMatcherFactoryProvider.caseInsensitive(true);
  
        var homeState = {
            name: 'Home',
            url: '/home',
            templateUrl: 'ngapp/views/home.html'
        };
        var systemState = {
            name: 'System',
            url: '/system',
            templateUrl: 'ngapp/views/system.html'
        };
        var aboutState = {
            name: 'About',
            url: '/about',
            templateUrl: 'ngapp/views/about.html'
        };
        var loginState = {
            name: 'Login',
            url: '/user/login',
            templateUrl: 'ngapp/views/login.html'
        };
        var profileState = {
            name: 'My Profile',
            url: '/user/profile',
            templateUrl: 'ngapp/views/profile.html'
        };

        var myGamesState = {
            name: 'My Games',
            url: '/user/games',
            templateUrl: 'ngapp/views/myGames.html'
        };

        var logoutState = {
            name: 'Logout',
            url: '/user/logout',
            templateUrl: 'ngapp/views/logout.html'
        };

        var registerState = {
            name: 'Register',
            url: '/user/register',
            templateUrl: 'ngapp/views/register.html'
        }
            ;
        var registerConfirmState = {
            name: 'Confirm Email',
            url: '/user/confirm/:userId?email',
            templateUrl: 'ngapp/views/register_confirm.html'
        };

        var forgotLoginState = {
            name: 'Forgot Login Info',
            url: '/user/forgotLogin',
            templateUrl: 'ngapp/views/forgot_login.html'
        };

        var playState = {
            name: 'Play',
            url: '/play?',
            templateUrl: 'ngapp/views/kharbga.html'
        };

        var testTabsState = {
            name: 'Test Tabs',
            url: '/test/tabs',
            templateUrl: 'ngapp/views/ktabs.html'
        };

        var activeGamesState = {
            name: 'Active Games',
            url: '/active/games?',
            templateUrl: 'ngapp/views/activeGames.html'
        };

        var helpState = {
            name: 'Help',
            url: '/help',
            templateUrl: 'ngapp/views/help.html'
        };

        var rulesState = {
            name: 'Rules',
            url: '/rules',
            templateUrl: 'ngapp/views/rules.html'
        };

        var contactUsState = {
            name: 'Contact Us',
            url: '/user/contactUs',
            templateUrl: 'ngapp/views/contactUs.html'
        };

        var termsState = {
            name: 'Terms',
            url: '/user/terms',
            templateUrl: 'ngapp/views/terms.html'
        };
        var privacyState = {
            name: 'Privacy',
            url: '/user/privacy',
            templateUrl: 'ngapp/views/privacy.html'
        };


    $stateProvider.state(homeState);
    $stateProvider.state(systemState);
    $stateProvider.state(aboutState);
    $stateProvider.state(loginState);
    $stateProvider.state(registerState);
    $stateProvider.state(registerConfirmState);
    $stateProvider.state(forgotLoginState);
    $stateProvider.state(playState);
    $stateProvider.state(testTabsState);
    $stateProvider.state(helpState);
    $stateProvider.state(profileState);
    $stateProvider.state(myGamesState);
    $stateProvider.state(rulesState);
    $stateProvider.state(logoutState);
    $stateProvider.state(contactUsState);
    $stateProvider.state(termsState);
    $stateProvider.state(privacyState);
    $stateProvider.state(activeGamesState);

    $urlRouterProvider.otherwise('/home');

}]);

/* App Constants */
myApp.constant('appConstants', {
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

myApp.factory('authInterceptorService', ['$q', '$injector', '$location', 'localStorageService',
    function ($q, $injector, $location, localStorageService) {

    var authInterceptorServiceFactory = {};

        var _request = function (config) {

            config.headers = config.headers || {};

            var authData = localStorageService.get('authorizationData');
            if (authData) {
                config.headers.Authorization = 'Bearer ' + authData.token;
            }

            return config;
        };

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
        };

    authInterceptorServiceFactory.request = _request;
    authInterceptorServiceFactory.responseError = _responseError;

    return authInterceptorServiceFactory;
    }]);

/* Shared service */
myApp.factory('appSharedService', function ($rootScope) {
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


myApp.run(['$rootScope', '$state', '$stateParams', '$log', '$location', '$window',
    function ($rootScope, $state, $stateParams, $log, $location, $window) {
    $rootScope.color = 'blue';
    $rootScope.user = { sessionId: "", loggedIn: false };
    $rootScope.message = "";
    $rootScope.processing = false;
    $rootScope.systemError = false;

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $rootScope.sessionData = {};

    // SEO stuff
    $window.ga('create', 'UA-6996887-11', 'auto');

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (angular.isObject($.nsAppKharbga)) {
            // update the rootScope
            $rootScope.currentGame = $.nsAppKharbga.getCurrentGame();
            $rootScope.currentState = $.nsAppKharbga.getCurrentState();
        }

        // called every time the state transition is attempted
        $log.info("stateChangeStart - event %s, toState: %s, toParams: %s", event, toState, toParams);

        $window.ga('send', 'pageview', $location.path());
    });
}]);


myApp.filter('toStatusString', function () {
    return function (status) {
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

myApp.filter('toStateString', function () {
    return function (state) { return Kharbga.GameState[state]; }; // depends on Kharbga.js
});

myApp.filter('toStatusCSS', function () {
    return function (status) {
      switch (status) {
            case 0:
                return "list-group-item-warning";
            case 1:
                return "list-group-item-success";
            case 2:
                return "list-group-item-success";
            case 3:
                return "list-group-item-info";
            case 4:
                return "list-group-item-info";
            case 5:
                return "list-group-item-danger";
            default:
                return "list-group-item-danger";
        }
    };
});

// directives
myApp.directive('tabs',
    function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},
            controller: [
                "$scope", function($scope) {
                    var panes = $scope.panes = [];

                    $scope.select = function (pane) {
                        angular.forEach(panes,
                            function (pane) {
                                pane.selected = false;
                            });
                        pane.selected = true;
                    };

                    this.addPane = function (pane) {
                        if (panes.length === 0) $scope.select(pane);
                        panes.push(pane);
                    };
                }
            ],
            template:
                '<div class="tabbable">' +
                    '<ul class="nav nav-tabs">' +
                    '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}">' +
                    '<a href="" ng-click="select(pane)">{{pane.title}}</a>' +
                    '</li>' +
                    '</ul>' +
                    '<div class="tab-content" ng-transclude></div>' +
                    '</div>',
            replace: true
        };
    });

myApp.directive('pane',
    function() {
        return {
            require: '^tabs',
            restrict: 'E',
            transclude: true,
            scope: { title: '@' },
            link: function(scope, element, attrs, tabsCtrl) {
                tabsCtrl.addPane(scope);
            },
            template:
                '<div class="tab-pane" ng-class="{active: selected}" ng-transclude>' +
                    '</div>',
            replace: true
        };
    });