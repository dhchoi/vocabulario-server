"use strict";

module.exports = function (app, passport, config) {
    app.use("/", require("./routes/home")(passport, config));
    app.use("/account", require("./routes/account")());
    app.use("/auth", require("./routes/auth")(passport));
};
