/* global angular WebSocket $ */

angular.module("myChat", ["ui.router"])
    .config(["$stateProvider",
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
             }])
    .service("messageService",
             ["$rootScope",
              function ($rootScope) {
                  var self = this,
                      users = [],

                      setUsers = function (collection) {
                          users = collection.map(function (u) {
                              return {
                                  username: u,
                                  messages: []
                              };
                          });
                          $rootScope.$emit("usersSet", collection);
                      },

                      getUsers = function () {
                          return users;
                      },

                      addUser = function (username) {
                          users.push({
                              username: username,
                              messages: []
                          });
                          $rootScope.$emit("userAdded", username);
                      },

                      removeUser = function (username) {
                          users = users.filter(function (u) {
                              return u.username !== username;
                          });
                          $rootScope.$emit("userRemoved", username);
                      },

                      addReceivedMessage = function (message) {
                          var user = users.filter(function (u) {
                              return u.username === message.fromUsername;
                          })[0];

                          user.messages.push(message);
                          $rootScope.$emit("messageReceived", {
                              fromUsername: message.fromUsername,
                              messageText: message.messageText
                          });
                      },

                      addSentMessage = function (username, messageText) {
                          var user = users.filter(function (u) {
                              return u.username === username;
                          })[0];

                          user.messages.push({
                              fromUsername: $rootScope.username,
                              messageText: messageText
                          });

                          $rootScope.$emit("messageSent", {
                              username: username,
                              messageText: messageText
                          });
                      };

                  return {
                      setUsers: setUsers,
                      getUsers: getUsers,
                      addUser: addUser,
                      removeUser: removeUser,
                      addReceivedMessage: addReceivedMessage,
                      addSentMessage: addSentMessage
                  };
              }])
    .service("websocketService",
             ["$rootScope",
              "$http",
              "messageService",
              function ($rootScope, $http, messageService) {
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
                                  messageService.setUsers(receivedMessage.users);
                                  break;

                              case "USERENTERED":
                                  messageService.addUser(receivedMessage.username);
                                  break;

                              case "USERLEFT":
                                  messageService.removeUser(receivedMessage.username);
                                  break;

                              case "MESSAGE":
                                  messageService.addReceivedMessage({
                                      fromUsername: receivedMessage.fromUsername,
                                      messageText: receivedMessage.messageText
                                  });
                                  break;

                              default:
                                  // Do nothing
                              }

                              $rootScope.$apply();
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

                          messageService.addSentMessage(targetUsername, messageText);
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
    .controller("loginController",
                ["$scope",
                 function ($scope) {
                     // Nothing here yet
                 }])
    .controller("chatController",
                ["$scope",
                 "$rootScope",
                 "$location",
                 "$stateParams",
                 "websocketService",
                 function ($scope, $rootScope, $location, $stateParams, websocketService) {
                     var self = this;

                     $rootScope.username = $stateParams.username;

                     self.users = [];

                     $rootScope.$on("usersSet", function (e, data) {
                         self.users = data.map(function (u) {
                             return {
                                 username: u,
                                 isVisible: false,
                                 messages: [],
                                 unreadMessageCount: 0
                             };
                         });
                     });

                     $rootScope.$on("userAdded", function (e, username) {
                         self.users.push({
                             username: username,
                             messages: [],
                             isVisible: false,
                             unreadMessageCount: 0
                         });
                     });

                     $rootScope.$on("userRemoved", function (e, username) {
                         self.users = self.users.filter(function (u) {
                             return u.username !== username;
                         });
                     });

                     $rootScope.$on("messageReceived", function (e, data) {
                         var user = self.users.filter(function (u) {
                             return u.username === data.fromUsername;
                         })[0];

                         user.messages.push({
                             fromUsername: data.fromUsername,
                             messageText: data.messageText
                         });

                         user.unreadMessageCount++;
                     });

                     $rootScope.$on("messageSent", function (e, data) {
                         var user = self.users.filter(function (u) {
                             return u.username === data.username;
                         })[0];

                         user.messages.push({
                             fromUsername: $rootScope.username,
                             messageText: data.messageText
                         });
                     });

                     websocketService.setUsername($rootScope.username);
                     websocketService.open();

                     this.showUser = function (username) {
                         self.users.forEach(function (u) {
                             u.isVisible = false;
                         });

                         var user = self.users.filter(function (u) {
                             return u.username === username;
                         })[0];

                         user.isVisible = true;
                         user.unreadMessageCount = 0;
                     };

                     this.sendMessage = function (targetUsername, messageText) {
                         websocketService.sendMessage(targetUsername, messageText);
                     };

                     this.logout = function () {
                         $rootScope.username = null;
                         $location.path("login");
                     };

                     $scope.$on('$destroy', function () {
                         websocketService.close();
                     });
                 }]);
