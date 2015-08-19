"use strict";

var router = require("express").Router();
var User = require('mongoose').model('User');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var passportConf = require('../middlewares/authorization');

module.exports = function (passport, config) { //TODO: normalize all api response fields
    router.route("/token")
        // respond with token if successfully logged in
        .post(allowCrossDomain, function (req, res, next) {
            passport.authenticate('local', {session: false}, function (err, user, info) { //TODO: make sure this is session-less
                if (err) {
                    return next(err);
                }

                if (!user) {
                    res.json(info);
                }
                else {
                    var provider = "api";
                    user.tokens = _.reject(user.tokens, function (token) {
                        return token.kind === provider;
                    });
                    var accessToken = jwt.sign({email: user.email}, config.sessionSecret, {
                        expiresInMinutes: 1440 * 30 // expires in 30 days
                    });

                    user.tokens.push({kind: provider, accessToken: accessToken});
                    user.save(function (err) {
                        if (err) {
                            return next(err);
                        }

                        res.json({message: "", accessToken: accessToken});
                    });
                }
            })(req, res, next);
        });

    router.route("/check")
        // check if token is valid
        .post(passport.authenticate('bearer'), function (req, res) {
            res.json(req.authInfo);
        });

    router.route("/web/add")
        .post(passportConf.isAuthenticated, function (req, res) {
            addWord(req, res);
        });
    router.route("/add")
        // add word
        .post(passport.authenticate('bearer'), function (req, res) {
            addWord(req, res);
        });

    router.route("/web/delete")
        .post(passportConf.isAuthenticated, function (req, res) {
            deleteWord(req, res);
        });
    router.route("/delete")
        // delete word
        .post(passport.authenticate('bearer'), function (req, res) {
            deleteWord(req, res);
        });

    router.route("/web/toggle-starred")
      .post(passportConf.isAuthenticated, function (req, res) {
        toggleStarred(req, res);
      });
    router.route("/toggle-starred")
      .post(passport.authenticate('bearer'), function (req, res) {
        toggleStarred(req, res);
      });

    router.route("/get")
        .get(passport.authenticate('bearer'), function (req, res) {
            res.json(req.user.words);
        });

    return router;
};

// ## CORS middleware
// see: http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); //req.headers.origin
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //X-Requested-With

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

function addWord(req, res) {
    if(req.body.word) {
        req.user.addWord(req.body.word, function(err, resultObj) {
            if(err) res.json(resultObj); //return next(err);
            else res.json(resultObj); // TODO: req.flash('success', {msg: message.message}); // res.json(_.pick(message, ["result", "message"]));
        });
    }
    else {
        res.json({result: false, message: "Word to add was not specified."});
    }
}

function deleteWord(req, res) {
    if(req.body.word) {
        req.user.deleteWord(req.body.word, function(err, resultObj) {
            if(err) res.json(resultObj);
            else res.json(resultObj)
        });
    }
    else {
        res.json({result: false, message: "Word to delete was not specified."});
    }
}

function toggleStarred(req, res) {
  if(req.body.word) {
    req.user.toggleStarred(req.body.word, req.body.starred, function(err, resultObj) {
      if(err) res.json(resultObj);
      else res.json(resultObj)
    });
  }
  else {
    res.json({result: false, message: "Word to toggle starred was not specified."});
  }
}