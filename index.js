/* global module require */

var configs = require("./configs.json"),
    server = require("diet"),
    dietStatic = require("diet-static"),
    app = server(),
    fs = require("fs");

app.listen(configs["client-port"]);

app.footer(dietStatic({
    path: app.path + '/public/'
}));

app.get("/", function ($) {
    $.header('content-type', 'text/html');
    $.end(fs.readFileSync(app.path + "/public/index.html", "utf8"));
});

app.get("/configs", function ($) {
    $.json(configs);
});

var wss = new (require("ws")).Server({
    perMessageDeflate: false,
    port: configs["server-port"]
});

var clients = [];

wss.on('connection', function (ws) {
    clients.push({
        ws: ws,
        username: "anonymous"
    });

    ws.on('message', function (message) {
        var self = this,
            receivedMessage = JSON.parse(message),
            currentClient,
            targetClient;

        switch (receivedMessage.type) {
        case "IDENTIFY":
            currentClient = clients.filter(function (c) {
                return c.ws === self;
            })[0];

            currentClient.username = receivedMessage.username;

            console.log("user identified", currentClient.username);

            currentClient.ws.send(JSON.stringify({
                type: "USERLIST",
                users: clients.filter(function (c) {
                    return c.ws !== self;
                }).map(function (c) {
                    return c.username;
                })
            }));

            clients.filter(function (c) {
                return c.ws !== self;
            }).forEach(function (c) {
                c.ws.send(JSON.stringify({
                    type: "USERENTERED",
                    username: currentClient.username
                }));
            });

            break;

        case "MESSAGE":
            currentClient = clients.filter(function (c) {
                return c.ws === self;
            })[0];

            targetClient = clients.filter(function (c) {
                return c.username === receivedMessage.targetUsername;
            })[0];

            targetClient.ws.send(JSON.stringify({
                type: "MESSAGE",
                fromUsername: currentClient.username,
                messageText: receivedMessage.messageText
            }));

            break;

        default:
            // Do nothing
        }
    });

    ws.on("close", function () {
        var self = this,
        currentClient = clients.filter(function (c) {
            return c.ws === self;
        })[0],
        index = clients.indexOf(currentClient);

        clients.splice(index, 1);

        clients.forEach(function (c) {
            c.ws.send(JSON.stringify({
                type: "USERLEFT",
                username: currentClient.username
            }));
        });

        console.log("connection closed");
    });
});
