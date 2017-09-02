/* global module */

module.exports = [
    "$rootScope",
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
    }
];
