/* global angular WebSocket $ */

var myChat = angular.module("myChat", ["ui.router"]);

myChat.config(["$stateProvider",
               "$urlRouterProvider",
               function ($stateProvider, $urlRouterProvider) {
                   $urlRouterProvider.otherwise("/login");

                   $stateProvider.state("login", {
                       url: "/login",
                       controller: "loginController",
                       templateUrl: "scripts/views/login.html"
                   }).state("chat", {
                       url: "/chat/:username",
                       controller: "chatController",
                       templateUrl: "scripts/views/chat.html"
                   });
               }]);

myChat.controller("mainController",
                  ["$scope",
                   "$rootScope",
                   "$location",
                   function ($scope, $rootScope, $location) {
                       $scope.logout = function () {
                           $rootScope.username = null;
                           $location.path("login");
                       };
                   }]);

myChat.controller("loginController",
                  ["$scope",
                   function ($scope) {
                       // Nothing here yet
                   }]);

myChat.controller("chatController",
                  ["$scope",
                   "$rootScope",
                   "$http",
                   "$stateParams",
                   function ($scope, $rootScope, $http, $stateParams) {
                       $rootScope.username = $stateParams.username;

                       $scope.showUser = function (username) {
                           $rootScope.users.forEach(function (u) {
                               u.isVisible = false;
                           });

                           var user = $rootScope.users.filter(function (u) {
                               return u.username === username;
                           })[0];

                           user.isVisible = true;
                           user.unread = 0;
                       };

                       $http.get("configs")
                           .then(function (data) {
                               $scope.configs = data.data;

                               $rootScope.ws = new WebSocket("ws://" +
                                                             $scope.configs["domain"] +
                                                             ":" +
                                                             $scope.configs["server-port"]);

                               $rootScope.ws.onopen = function () {
                                   $rootScope.ws.send(JSON.stringify({
                                       type: "IDENTIFY",
                                       username: $rootScope.username
                                   }));
                               };

                               $rootScope.ws.onmessage = function (message) {
                                   var receivedMessage = JSON.parse(message.data);

                                   switch (receivedMessage.type) {
                                   case "USERLIST":
                                       $rootScope.users = receivedMessage.users.map(function (u) {
                                           return {
                                               username: u,
                                               isVisible: false,
                                               messages: [],
                                               unread: 0
                                           };
                                       });

                                       $scope.$apply();

                                       break;

                                   case "USERENTERED":
                                       $rootScope.users.push({
                                           username: receivedMessage.username,
                                           isVisible: false,
                                           messages: [],
                                           unread: 0
                                       });

                                       $scope.$apply();

                                       break;

                                   case "USERLEFT":
                                       var user = $rootScope.users.filter(function (u) {
                                           return u.username === receivedMessage.username;
                                       });

                                       $rootScope.users.splice($rootScope.users.indexOf(user));
                                       $scope.$apply();

                                       break;

                                   case "MESSAGE":
                                       var sender = $rootScope.users.filter(function (u) {
                                           return u.username === receivedMessage.fromUsername;
                                       })[0];

                                       sender.messages.push({
                                           fromUsername: receivedMessage.fromUsername,
                                           messageText: receivedMessage.messageText
                                       });

                                       sender.unread++;
                                       $scope.$apply();

                                       break;

                                   default:
                                       // Do nothing
                                   }
                               };

                               $rootScope.ws.onclose = function () {
                                   $("#errorModal").modal("show");
                               };

                           });

                       $scope.sendMessage = function (targetUsername, messageText) {
                           $rootScope.ws.send(JSON.stringify({
                               type: "MESSAGE",
                               targetUsername: targetUsername,
                               messageText: messageText
                           }));

                           var user = $rootScope.users.filter(function (u) {
                               return u.username === targetUsername;
                           })[0];

                           user.messages.push({
                               fromUsername: $rootScope.username,
                               messageText: messageText
                           });
                       };

                       $scope.$on('$destroy', function () {
                           $rootScope.ws.close();
                       });
                   }]);
