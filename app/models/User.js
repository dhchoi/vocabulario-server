"use strict";

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    email: {type: String, unique: true, lowercase: true},
    password: String,

    facebook: String,
    twitter: String,
    google: String,
    tokens: Array,

    profile: {
        name: {type: String, default: ''},
        gender: {type: String, default: ''},
        location: {type: String, default: ''},
        website: {type: String, default: ''},
        picture: {type: String, default: ''}
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
});

/**
 * Password hash middleware.
 */
// hook to be called before each call to save() on our User model
UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    // hash the password that has changed
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) {
                return next(err);
            }

            user.password = hash;
            next();
        });
    });
});

/**
 * Helper method for validating user's password.
 */
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }

        cb(null, isMatch);
    });
};

/**
 * Helper method for getting user's gravatar.
 */
UserSchema.methods.gravatar = function (size) {
    size = size || 200;

    if (!this.email) {
        return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
    }

    var md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

module.exports = mongoose.model('User', UserSchema);
