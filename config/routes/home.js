"use strict";

var router = require("express").Router();
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var User = require('mongoose').model('User');

module.exports = function (passport, config) {
    router.route("/")
        .all(function (req, res, next) {
            next();
            console.dir(req);
        })
        .get(function (req, res) {
            res.render('home', {
                title: 'Home'
            });
        });

    router.route("/login")
        // login page
        .get(function (req, res) {
            if (req.user) {
                return res.redirect('/');
            }

            res.render('account/login', {
                title: 'Login'
            });
        })
        // login using email and password
        .post(function (req, res, next) {
            req.assert('email', 'Email is not valid').isEmail();
            req.assert('password', 'Password cannot be blank').notEmpty();

            var errors = req.validationErrors();

            if (errors) {
                req.flash('errors', errors);
                return res.redirect('/login');
            }

            passport.authenticate('local', function (err, user, info) {
                if (err) return next(err);
                if (!user) {
                    req.flash('errors', {msg: info.message});
                    return res.redirect('/login');
                }
                req.logIn(user, function (err) {
                    if (err) return next(err);
                    req.flash('success', {msg: 'Success! You are logged in.'});
                    res.redirect(req.session.returnTo || '/');
                });
            })(req, res, next);
        });

    router.route("/logout")
        // logout
        .get(function (req, res) {
            req.logout();
            res.redirect('/');
        });

    router.route("/signup")
        // signup page
        .get(function (req, res) {
            if (req.user) return res.redirect('/');
            res.render('account/signup', {
                title: 'Create Account'
            });
        })
        // create a new local account
        .post(function (req, res, next) {
            req.assert('email', 'Email is not valid').isEmail();
            req.assert('password', 'Password must be at least 4 characters long').len(4);
            req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

            var errors = req.validationErrors();
            if (errors) {
                req.flash('errors', errors);
                return res.redirect('/signup');
            }

            var user = new User({
                email: req.body.email,
                password: req.body.password
            });

            User.findOne({email: req.body.email}, function (err, existingUser) {
                if (existingUser) {
                    req.flash('errors', {msg: 'Account with that email address already exists.'});
                    return res.redirect('/signup');
                }

                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }

                    req.logIn(user, function (err) {
                        if (err) {
                            return next(err);
                        }

                        res.redirect('/');
                    });
                });
            });
        });

    router.route("/forgot")
        // forgot Password page
        .get(function (req, res) {
            if (req.isAuthenticated()) {
                return res.redirect('/');
            }
            res.render('account/forgot', {
                title: 'Forgot Password'
            });
        })
        // create random token, then the send user an email with a reset link
        .post(function (req, res, next) {
            req.assert('email', 'Please enter a valid email address.').isEmail();

            var errors = req.validationErrors();

            if (errors) {
                req.flash('errors', errors);
                return res.redirect('/forgot');
            }

            async.waterfall([
                function (done) {
                    crypto.randomBytes(16, function (err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                    });
                },
                function (token, done) {
                    User.findOne({email: req.body.email.toLowerCase()}, function (err, user) {
                        if (!user) {
                            req.flash('errors', {msg: 'No account with that email address exists.'});
                            return res.redirect('/forgot');
                        }

                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                        user.save(function (err) {
                            done(err, token, user);
                        });
                    });
                },
                function (token, user, done) {
                    var transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                            user: config.sendgrid.user,
                            pass: config.sendgrid.password
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'hackathon@starter.com',
                        subject: 'Reset your password on Hackathon Starter',
                        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                    };
                    transporter.sendMail(mailOptions, function (err) {
                        req.flash('info', {msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.'});
                        done(err, 'done');
                    });
                }
            ], function (err) {
                if (err) return next(err);
                res.redirect('/forgot');
            });
        });

    router.route("/reset/:token")
        // reset Password page
        .get(function (req, res) {
            if (req.isAuthenticated()) {
                return res.redirect('/');
            }
            User.findOne({resetPasswordToken: req.params.token})
                .where('resetPasswordExpires').gt(Date.now())
                .exec(function (err, user) {
                    if (!user) {
                        req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
                        return res.redirect('/forgot');
                    }
                    res.render('account/reset', {
                        title: 'Password Reset'
                    });
                });
        })
        // process the reset password request
        .post(function (req, res, next) {
            req.assert('password', 'Password must be at least 4 characters long.').len(4);
            req.assert('confirm', 'Passwords must match.').equals(req.body.password);

            var errors = req.validationErrors();

            if (errors) {
                req.flash('errors', errors);
                return res.redirect('back');
            }

            async.waterfall([
                function (done) {
                    User.findOne({resetPasswordToken: req.params.token})
                        .where('resetPasswordExpires').gt(Date.now())
                        .exec(function (err, user) {
                            if (!user) {
                                req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
                                return res.redirect('back');
                            }

                            user.password = req.body.password;
                            user.resetPasswordToken = undefined;
                            user.resetPasswordExpires = undefined;

                            user.save(function (err) {
                                if (err) return next(err);
                                req.logIn(user, function (err) {
                                    done(err, user);
                                });
                            });
                        });
                },
                function (user, done) {
                    var transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                            user: config.sendgrid.user,
                            pass: config.sendgrid.password
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'hackathon@starter.com',
                        subject: 'Your Hackathon Starter password has been changed',
                        text: 'Hello,\n\n' +
                        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                    };
                    transporter.sendMail(mailOptions, function (err) {
                        req.flash('success', {msg: 'Success! Your password has been changed.'});
                        done(err);
                    });
                }
            ], function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        });

    router.route("/contact")
        // contact form page
        .get(function (req, res) {
            res.render('contact', {
                title: 'Contact'
            });
        })
        // send a contact form via Nodemailer
        .post(function (req, res) {
            req.assert('name', 'Name cannot be blank').notEmpty();
            req.assert('email', 'Email is not valid').isEmail();
            req.assert('message', 'Message cannot be blank').notEmpty();

            var errors = req.validationErrors();

            if (errors) {
                req.flash('errors', errors);
                return res.redirect('/contact');
            }

            //var name = req.body.name;
            var transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: config.sendgrid.user,
                    pass: config.sendgrid.password
                }
            });
            var mailOptions = {
                to: 'your@email.com',
                from: req.body.email,
                subject: 'Contact Form | Hackathon Starter',
                text: req.body.message
            };

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash('errors', {msg: err.message});
                    return res.redirect('/contact');
                }
                req.flash('success', {msg: 'Email has been sent successfully!'});
                res.redirect('/contact');
            });
        });

    return router;
};
