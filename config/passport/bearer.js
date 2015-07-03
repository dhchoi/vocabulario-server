"use strict";

var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require('jsonwebtoken');

module.exports = function (User, config) {
    return new BearerStrategy({session: false}, function (token, done) {
            User.findOne({tokens: {kind: "api", accessToken: token}}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }

                jwt.verify(token, config.sessionSecret, function (err, decoded) {
                    if (err) {
                        console.log(err);
                        return done(err);
                    }

                    return done(null, user, {scope: 'all'});
                });
            });
        }
    );
};
