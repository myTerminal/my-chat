/* global module require */

var server = require("diet"),
    dietStatic = require("diet-static"),
    app = server(),
    fs = require("fs");

module.exports = function (configs) {
    app.listen(configs["web-port"]);

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
};

