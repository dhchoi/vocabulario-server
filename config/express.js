"use strict";

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var multer = require('multer');
var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets'); //TODO: check prod options
var exphbs = require('express-handlebars').create({
  extname: ".hbs",
  layoutsDir: "app/views/layouts/",
  partialsDir: "app/views/partials/",
  defaultLayout: "main"
});
//var hbsLayouts = require('handlebars-layouts').register(exphbs.handlebars);
var hbsHelpers = require("./handlebars/helpers");
var csrfFreeRoutes = "/api";

module.exports = function (app, passport, config) {
  var env = process.env.NODE_ENV || "development";
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = (env == "development");

  var connectAssetsObj = connectAssets({
    paths: [
      path.join(config.root, 'public/css'),
      path.join(config.root, 'public/js'),
      path.join(config.root, 'public/')
    ]
  });
  hbsHelpers.init(exphbs.handlebars, connectAssetsObj);

  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(config.root, 'app/views'));
  app.engine('.hbs', exphbs.engine);
  app.set('view engine', '.hbs');

  app.use(compress());
  app.use(connectAssetsObj);
  app.use(logger('dev'));
  app.use(favicon(path.join(config.root, 'public/img/favicon.png')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(multer({dest: path.join(config.root, 'uploads')}));
  app.use(expressValidator());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.sessionSecret,
    store: new MongoStore({url: config.db, autoReconnect: true})
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  //app.use(lusca({
  //    csrf: true,
  //    xframe: 'SAMEORIGIN',
  //    xssProtection: true
  //}));
  app.use(function (req, res, next) {
    if (_.startsWith(req.path, csrfFreeRoutes)) {
      next();
    }
    else {
      lusca({
        csrf: true,
        xframe: 'SAMEORIGIN',
        xssProtection: true
      })(req, res, next);
    }
  });
  app.use(function (req, res, next) {
    res.locals.user = req.user; // will make a 'user' variable available in all templates
    next();
  });
  app.use(express.static(path.join(config.root, 'public'), {maxAge: 31557600000}));
  app.use(errorHandler());
};
