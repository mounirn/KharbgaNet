var nsApp = angular.module('nsApp', ['ngRoute', 'ui.router']);

nsApp.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "./html/home.html"
        })
        .when("/login", {
            templateUrl: "./html/login.html"
        })
        .when("/register", {
            templateUrl: "./html/register.html"
        })
        .when("/game", {
            templateUrl: "./html/kb-angular-view.html"
        })
        .when("/blue", {
            templateUrl: "./blue.htm"
        });
});


nsApp.config(function ($stateProvider) {
    var helloState = {
        name: 'hello',
        url: '/hello',
        template: '<h3>hello world!</h3>'
    }

    var aboutState = {
        name: 'about',
        url: '/about',
        template: '<h3>Its the UI-Router hello world app!</h3>'
    }

    $stateProvider.state(helloState);
    $stateProvider.state(aboutState);
});


nsApp.service("userService", UserService);

nsApp.component('hello', {

});

function UserService($q) {
    var usersPromise = $q.resolve([
        { id: 1, name: 'Princess Held Captive' },
        { id: 2, name: 'Dragon Burning Cities' },
        { id: 3, name: 'Giant Asteroid Heading For Earth' },
        { id: 4, name: 'Release Deadline Looms' }
    ]);

    this.getUsers = function () {
        return usersPromise;
    };

    this.getUser = function (id) {
        return usersPromise.then(function (users) {
            for (var i = 0; i < users.length; i++) {
                if (users[i].id === id) return users[i];
            }
        });
    }
}