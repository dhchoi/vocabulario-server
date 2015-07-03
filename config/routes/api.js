"use strict";

var router = require("express").Router();
var User = require('mongoose').model('User');
var jwt = require('jsonwebtoken');
var _ = require('lodash');

module.exports = function (passport, config) {
    router.route("/token")
        // respond with token if successfully logged in
        .post(function (req, res, next) {
            passport.authenticate('local', {session: false}, function (err, user, info) {
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
                        expiresInMinutes: 1440 * 30 // expires in 24 hours
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

    return router;
};
