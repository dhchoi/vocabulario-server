"use strict";

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require("moment");
var Word = require("./Word");
var dictionary = require("../helpers/dictionary");

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

  words: [Word.schema],

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

// delete word
UserSchema.methods.deleteWord = function (word, cb) {
  updateWord(this, word,
    function (wordFound) {
      wordFound.remove();
    },
    cb
  );
};

// toggle starred for word
UserSchema.methods.toggleStarred = function (word, cb) {
  updateWord(this, word,
    function (wordFound) {
      wordFound.toggleStarred();
    },
    cb
  );
};

// add rating for word
UserSchema.methods.addRating = function (word, rating, cb) {
  updateWord(this, word,
    function (wordFound) {
      wordFound.addRating(rating);
    },
    cb
  );
};

// add word
UserSchema.methods.addWord = function (wordToAdd, cb) {
  var user = this;
  dictionary.getDefinition(wordToAdd, function (err, result) {
    if (!err) {
      var newWord = createWord(wordToAdd, result, new Date());
      user.words.push(newWord);
      user.save(function (err) {
        if (!err) {
          cb(null, _.extend({
            result: true,
            message: "Add '" + wordToAdd + "' success."
          }, formatWord(newWord._doc)));
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
      cb(err, {
        result: false,
        message: result
      });
    }
  });
};

UserSchema.methods.getWords = function (filter) {
  if(!filter) {
    return this.words.map(formatWord);
  }

  var filteredWords = this.words.filter(function (word) {
    if (word[filter.key] === filter.value) {
      return true;
    } else {
      return false;
    }
  });

  return filteredWords.map(formatWord);
};

function formatWord(word) {
  return {
    word: word.word,
    definition: word.definition,
    sentence: word.sentence,
    ratings: word.ratings.map(function (rating) {
      return {
        rate: rating.rate,
        saved: formatDate(rating.saved)
      }
    }),
    currentRate: word.currentRate,
    starred: word.starred,
    created: formatDate(word.created)
  };
}

function formatDate(date) {
  return moment(date).format("MMMM Do YYYY, h:mm a");
}

function updateWord(user, word, action, cb) {
  var wordFound = Word.search(user.words, word);
  if (wordFound) {
    action(wordFound);
    user.save(function (err) {
      if (!err) { // TODO: gotta check if 'word' might interfere with words that have "'"
        cb(null, {
          result: true,
          message: "Finished updating '" + wordFound.word + "'."
        });
      }
      else {
        console.log(err);
        cb(err, {
          result: false,
          message: "Failed to update '" + wordFound.word + "'."
        });
      }
    });
  }
  else {
    cb(null, {
      result: false,
      message: "The user does not have the word '" + word + "'."
    });
  }
}

function createWord(word, definition, date) {
  // TODO: check field defaults (such as first rating)
  var newWord = new Word({
    word: word,
    definition: definition,
    created: date
  });
  newWord.addRating(1, date);

  return newWord;
}

module.exports = mongoose.model('User', UserSchema);
