/* global require */

var configs = require("./configs.json");

require("./server-web")(configs);
require("./server-socket")(configs);
