/* global module */

module.exports = [
    "$scope",
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
    }
];
