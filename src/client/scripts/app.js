/* global global require */

global.jQuery = require('jquery');

var angular = require('angular'),
    uiRouter = require('angular-ui-router'),
    bootstrap = require('bootstrap');

angular.module("myChat", ["ui.router", "myChatServices"])
    .config([
        "$stateProvider",
        "$urlRouterProvider",
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise("/login");

            $stateProvider.state("login", {
                url: "/login",
                controller: "loginController",
                controllerAs: "login",
                templateUrl: "scripts/views/login.html"
            }).state("chat", {
                url: "/chat/:username",
                controller: "chatController",
                controllerAs: "chat",
                templateUrl: "scripts/views/chat.html"
            });
        }
    ])
    .controller("loginController", require('./controllers/loginController.js'))
    .controller("chatController", require('./controllers/chatController.js'));

angular.module("myChatServices", [])
    .service("messageService", require('./services/messageService.js'))
    .service("websocketService", require('./services/websocketService.js'));

var templates = require('../../../public/scripts/templates');
