/* global angular WebSocket $ */

angular.module("myChat", ["ui.router"])
    .config(["$stateProvider",
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
             }])
    .service("websocketService",
             ["$rootScope",
              "$http",
              function ($rootScope, $http) {
                  var self = this,
                      socket,
                      username,

                      setUsername = function (u) {
                          username = u;
                      },

                      open = function () {
                          $http.get("configs")
                              .then(function (data) {
                                  var configs = data.data;

                                  socket = new WebSocket("ws://"
                                                         + configs["domain"]
                                                         + ":"
                                                         + configs["socket-port"]);

                                  bindEvents(socket);
                              });
                      },

                      bindEvents = function (socket) {
                          socket.onopen = handlers.onOpenHandler;
                          socket.onmessage = handlers.onMessageHandler;
                          socket.onclose = handlers.onCloseHandler;
                      },

                      handlers = {
                          onOpenHandler: function () {
                              socket.send(JSON.stringify({
                                  type: "IDENTIFY",
                                  username: username
                              }));
                          },
                          onMessageHandler: function (message) {
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

                                  $rootScope.$apply();

                                  break;

                              case "USERENTERED":
                                  $rootScope.users.push({
                                      username: receivedMessage.username,
                                      isVisible: false,
                                      messages: [],
                                      unread: 0
                                  });

                                  $rootScope.$apply();

                                  break;

                              case "USERLEFT":
                                  var user = $rootScope.users.filter(function (u) {
                                      return u.username === receivedMessage.username;
                                  });

                                  $rootScope.users.splice($rootScope.users.indexOf(user));
                                  $rootScope.$apply();

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
                                  $rootScope.$apply();

                                  break;

                              default:
                                  // Do nothing
                              }
                          },
                          onCloseHandler: function () {
                              $("#errorModal").modal("show");
                          }
                      },

                      sendMessage = function (targetUsername, messageText) {
                          socket.send(JSON.stringify({
                              type: "MESSAGE",
                              targetUsername: targetUsername,
                              messageText: messageText
                          }));

                          var user = $rootScope.users.filter(function (u) {
                              return u.username === targetUsername;
                          })[0];

                          user.messages.push({
                              fromUsername: username,
                              messageText: messageText
                          });
                      },

                      close = function () {
                          socket.close();
                      };

                  return {
                      setUsername: setUsername,
                      open: open,
                      sendMessage: sendMessage,
                      close: close
                  };
              }])
    .controller("mainController",
                ["$scope",
                 "$rootScope",
                 "$location",
                 function ($scope, $rootScope, $location) {
                     $scope.logout = function () {
                         $rootScope.username = null;
                         $location.path("login");
                     };
                 }])
    .controller("loginController",
                ["$scope",
                 function ($scope) {
                     // Nothing here yet
                 }])
    .controller("chatController",
                ["$scope",
                 "$rootScope",
                 "$stateParams",
                 "websocketService",
                 function ($scope, $rootScope, $stateParams, websocketService) {
                     $rootScope.username = $stateParams.username;

                     websocketService.setUsername($rootScope.username);
                     websocketService.open();

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

                     $scope.sendMessage = function (targetUsername, messageText) {
                         websocketService.sendMessage(targetUsername, messageText);
                     };

                     $scope.$on('$destroy', function () {
                         websocketService.close();
                     });
                 }]);
