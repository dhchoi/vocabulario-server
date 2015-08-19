"use strict";

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var _ = require('lodash');

var WordSchema = new mongoose.Schema({
  word: {type: String, unique: true, lowercase: true},
  definition: {type: String, default: ''},
  sentence: {type: String, default: ''},
  rating: {type: Number, default: 1, min: 1, max: 5},
  starred: {type: Boolean, default: false},
  created: Date
});

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

  words: [WordSchema],

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

// delete word
UserSchema.methods.deleteWord = function (wordToDelete, cb) {
  var wordFound = this.words.filter(function (word) {
    if (word.word === wordToDelete) {
      return true;
    } else {
      return false;
    }
  });

  if (wordFound.length > 0) {
    console.log("wordFoundId: " + wordFound[0]._id);
    this.words.id(wordFound[0]._id).remove();
    this.save(function (err) {
      if (!err) { // TODO: gotta check if 'word' might interfere with words that have "'"
        cb(null, {result: true, message: "Delete '" + wordToDelete + "' success."});
      }
      else {
        console.log(err);
        cb(err, {
          result: false,
          message: "Error while deleting word from database."
        });
      }
    });
  }
  else {
    cb(null, {result: false, message: "User did not have '" + wordToDelete + "' for deletion."});
  }
};

// toggle starred for word
UserSchema.methods.toggleStarred = function (wordToToggle, starred, cb) {
  var wordFound = this.words.filter(function (word) {
    if (word.word === wordToToggle) {
      return true;
    } else {
      return false;
    }
  });

  if (wordFound.length > 0) {
    console.log("wordFoundId: " + wordFound[0]._id);
    this.words.id(wordFound[0]._id).starred = starred;
    this.save(function (err) {
      if (!err) {
        cb(null, {
          result: true,
          message: "Setting starred to '" + starred + "' success."
        });
      }
      else {
        console.log(err);
        cb(err, {
          result: false,
          message: "Error while saving starred field of word to database."
        });
      }
    });
  }
  else {
    cb(null, {result: false, message: "User did not have '" + wordToToggle + "' for toggling starred."});
  }
};

// add word
UserSchema.methods.addWord = function (wordToAdd, cb) {
  var user = this;
  getDefinition(wordToAdd, function (err, result) {
    if (!err) {
      var wordObj = {
        word: wordToAdd,
        definition: result,
        created: new Date()
      };
      user.words.push(wordObj);
      user.save(function (err) {
        if (!err) {
          cb(null, _.extend({
            result: true,
            message: "Add '" + wordToAdd + "' success."
          }, wordObj));
        }
        else {
          //res.json(err);
          console.log(err);
          cb(err, {
            result: false,
            message: "Error while saving word definition to database."
          });
        }
      });
    }
    else {
      // TODO: check if this is the right way (and find something that ends res)
      cb(err, {result: false, message: result});
    }
  });
};

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


var phantom = require('phantom');
function getDefinition(word, cb) {
  var url = 'http://www.wordreference.com/definition/' + word;
  phantom.create(function (ph) {
    ph.createPage(function (page) {
      page.open(url, function (status) {
        console.log("status: " + status);
        page.evaluate(function () {
          var element = document.querySelector('.entryRH').innerHTML;
          return element;
        }, function (result) {
          ph.exit();
          if (result == undefined || result == 'undefined') {
            console.log("could not fetch definition");
            cb(true, "could not fetch definition");
          }
          else {
            cb(null, result);
          }
        });
      });
    });
  });
}

module.exports = mongoose.model('User', UserSchema);
