"use strict";

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var _ = require('lodash');
var WordEntry = require("./WordEntry");

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

UserSchema.methods.getWord = function (word, cb) {
  WordEntry.getWordEntry(this, word)
    .then(function (wordEntry) {
      cb(WordEntry.formatWordEntry(wordEntry ? wordEntry._doc : wordEntry));
    })
    .fail(function (error) {
      console.log(error);
      cb(null);
    });
};

UserSchema.methods.getAllWords = function (filter, cb) {
  WordEntry.getAllWordEntries(this)
    .then(function (entries) {
      if(!filter) {
        cb(entries.map(WordEntry.formatWordEntry));
      }
      else {
        var filteredWords = entries.filter(function (wordEntry) {
          if (wordEntry[filter.key] === filter.value) {
            return true;
          } else {
            return false;
          }
        });
        cb(filteredWords.map(WordEntry.formatWordEntry));
      }
    })
    .fail(function (error) {
      console.log(error);
      cb([]);
    });
};

// delete wordEntry
UserSchema.methods.deleteWord = function (wordEntry, cb) {
  updateWordEntry(this, wordEntry,
    function (wordEntryFound) {
      wordEntryFound.remove();
    },
    cb
  );
};

// toggle starred for wordEntry
UserSchema.methods.toggleStarred = function (wordEntry, cb) {
  updateWordEntry(this, wordEntry,
    function (wordEntryFound) {
      wordEntryFound.toggleStarred();
    },
    cb
  );
};

// add rating for wordEntry
UserSchema.methods.addRating = function (wordEntry, rating, cb) {
  updateWordEntry(this, wordEntry,
    function (wordEntryFound) {
      wordEntryFound.addRating(rating);
    },
    cb
  );
};

// add wordEntry
UserSchema.methods.addWord = function (wordToAdd, cb) {
  WordEntry.addWordEntry(this, wordToAdd)
    .then(function (newWordEntry) {
      cb(null, _.extend({
        result: true,
        message: "Add '" + wordToAdd + "' success"
      }, WordEntry.formatWordEntry(newWordEntry)));
    })
    .fail(function (error) {
      cb(error, { // TODO: check if this is the right way (and find something that ends res)
        result: false,
        message: error.message
      });
    });
};

function updateWordEntry(user, word, action, cb) { // TODO: probably refactor out to WordEntry.js
  WordEntry.getWordEntry(user, word)
    .then(function (wordEntry) {
      if(wordEntry) {
        action(wordEntry);
        console.dir(wordEntry);
        wordEntry.save(function (err) {
          if (!err) { // TODO: gotta check if 'word' might interfere with words that have "'"
            cb(null, {
              result: true,
              message: "Finished updating '" + wordEntry.word + "'"
            });
          }
          else {
            console.log(err);
            cb(err, {
              result: false,
              message: "Failed to update '" + wordEntry.word + "'"
            });
          }
        });
      }
      else {
        cb(true, {
          result: false,
          message: "The user does not have the word '" + word + "'"
        });
      }
    })
    .fail(function (error) {
      cb(error, {
        result: false,
        message: error.message
      });
    });
}

module.exports = mongoose.model('User', UserSchema);
