"use strict";

var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function (User, config) {
    return new FacebookStrategy(config.facebook, function (req, accessToken, refreshToken, profile, done) {
        if (req.user) {
            User.findOne({facebook: profile.id}, function (err, existingUser) {
                if (existingUser) {
                    req.flash('errors', {msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
                    done(err);
                } else {
                    User.findById(req.user.id, function (err, user) {
                        user.facebook = profile.id;
                        user.tokens.push({kind: 'facebook', accessToken: accessToken});
                        user.profile.name = user.profile.name || profile.displayName;
                        user.profile.gender = user.profile.gender || profile._json.gender;
                        user.profile.picture = user.profile.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        user.save(function (err) {
                            req.flash('info', {msg: 'Facebook account has been linked.'});
                            done(err, user);
                        });
                    });
                }
            });
        }
        else {
            User.findOne({facebook: profile.id}, function (err, existingUser) {
                if (existingUser) return done(null, existingUser);
                User.findOne({email: profile._json.email}, function (err, existingEmailUser) {
                    if (existingEmailUser) {
                        req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.'});
                        done(err);
                    } else {
                        var user = new User();
                        user.email = profile._json.email;
                        user.facebook = profile.id;
                        user.tokens.push({kind: 'facebook', accessToken: accessToken});
                        user.profile.name = profile.displayName;
                        user.profile.gender = profile._json.gender;
                        user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        user.profile.location = (profile._json.location) ? profile._json.location.name : '';
                        user.save(function (err) {
                            done(err, user);
                        });
                    }
                });
            });
        }
    });
};