var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/reddit_app");

mongoose.set("debug", true);

module.exports.Work = require("./work");
// module.exports.Comment = require("./comment");
module.exports.User = require("./user");