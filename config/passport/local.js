"use strict";

var LocalStrategy = require('passport-local').Strategy;

module.exports = function (User) {
  return new LocalStrategy({usernameField: 'email'}, function (email, password, done) {
    email = email.toLowerCase();
    User.findOne({email: email}, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, {message: "Email '" + email + "' not found."});
      }

      user.comparePassword(password, function (err, isMatch) {
        if (isMatch) {
          return done(null, user);
        }
        else {
          return done(null, false, {message: 'Invalid password.'});
        }
      });
    });
  });
};