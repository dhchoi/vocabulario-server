"use strict";

// modules
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/config');
var app = express();

// configure DB
mongoose.connect(config.db);
mongoose.connection.on('error', function () {
    console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

// configure models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
    if (~file.indexOf('.js')) {
        require(__dirname + '/app/models/' + file);
    }
});

// configure passport
require("./config/passport")(passport, config);

// configure express
require("./config/express")(app, passport, config);

// configure routes
require("./config/routes")(app, passport, config);

// start server
app.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
