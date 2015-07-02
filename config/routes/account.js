"use strict";

var router = require("express").Router();
var User = require('mongoose').model('User');
var passportConf = require('../middlewares/authorization');

module.exports = function () {
    router.route("/")
        // profile page
        .get(passportConf.isAuthenticated, function (req, res) {
            res.render('account/profile', {
                title: 'Account Management'
            });
        });

    router.route("/profile")
        // update profile information
        .post(passportConf.isAuthenticated, function (req, res, next) {
            User.findById(req.user.id, function (err, user) {
                if (err) return next(err);
                user.email = req.body.email || '';
                user.profile.name = req.body.name || '';
                user.profile.gender = req.body.gender || '';
                user.profile.location = req.body.location || '';
                user.profile.website = req.body.website || '';

                user.save(function (err) {
                    if (err) return next(err);
                    req.flash('success', {msg: 'Profile information updated.'});
                    res.redirect('/account');
                });
            });
        });

    router.route("/password")
        // update current password
        .post(passportConf.isAuthenticated, function (req, res, next) {
            req.assert('password', 'Password must be at least 4 characters long').len(4);
            req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

            var errors = req.validationErrors();

            if (errors) {
                req.flash('errors', errors);
                return res.redirect('/account');
            }

            User.findById(req.user.id, function (err, user) {
                if (err) return next(err);

                user.password = req.body.password;

                user.save(function (err) {
                    if (err) return next(err);
                    req.flash('success', {msg: 'Password has been changed.'});
                    res.redirect('/account');
                });
            });
        });

    router.route("/delete")
        // delete user account
        .post(passportConf.isAuthenticated, function (req, res, next) {
            User.remove({_id: req.user.id}, function (err) {
                if (err) return next(err);
                req.logout();
                req.flash('info', {msg: 'Your account has been deleted.'});
                res.redirect('/');
            });
        });

    router.route("/unlink/:provider")
        // unlink OAuth provider
        .get(passportConf.isAuthenticated, function (req, res, next) {
            var provider = req.params.provider;
            User.findById(req.user.id, function (err, user) {
                if (err) return next(err);

                user[provider] = undefined;
                user.tokens = _.reject(user.tokens, function (token) {
                    return token.kind === provider;
                });

                user.save(function (err) {
                    if (err) return next(err);
                    req.flash('info', {msg: provider + ' account has been unlinked.'});
                    res.redirect('/account');
                });
            });
        });

    return router;
};
