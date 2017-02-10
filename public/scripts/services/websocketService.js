/* global angular WebSocket $ */

angular.module("myChatServices.websocket", [])
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
              }]);
