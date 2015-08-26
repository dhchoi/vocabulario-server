"use strict";

var Q = require('q');
var moment = require("moment");
var mongoose = require('mongoose');
var WordDefinition = require("./WordDefinition");

var WordEntrySchema = new mongoose.Schema({
  word: {type: String, lowercase: true},
  definition: {},
  examples: [{
    example: {type: String, default: ""},
    url: {type: String, default: ""},
    added: Date,
    _id: false
  }],
  ratings: [{
    rate: {type: Number, min: 1, max: 5, default: 1},
    saved: Date,
    _id: false
  }],
  currentRate: Number,
  starred: {type: Boolean, default: false},
  created: Date,
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
});

WordEntrySchema.methods.addRating = function (rating, savedDate) {
  var ratingObj = {
    rate: rating,
    saved: savedDate || new Date()
  };
  this.ratings.push(ratingObj);
  this.currentRate = this.ratings[this.ratings.length - 1].rate;

  return this.currentRate;
};

WordEntrySchema.methods.toggleStarred = function () {
  this.starred = !this.starred;

  return this.starred;
};

WordEntrySchema.statics.getWordEntry = function (user, word) {
  var deferred = Q.defer();
  this.findOne({"word": word, "user": user._id}, function (error, wordEntry) {
    if (error) {
      deferred.reject(new Error(error));
    }
    else {
      deferred.resolve(wordEntry);
    }
  });

  return deferred.promise;
};

WordEntrySchema.statics.getAllWordEntries = function (user) {
  var deferred = Q.defer();
  this.find({"user": user._id}, function (error, entries) {
    if (error) {
      deferred.reject(new Error(error));
    }
    else {
      deferred.resolve(entries);
    }
  });

  return deferred.promise;
};

WordEntrySchema.statics.addWordEntry = function (user, word) {
  var deferred = Q.defer();
  var wordEntrySchema = this;

  this.getWordEntry(user, word)
    .then(function (wordEntry) {
      if(!wordEntry) {
        WordDefinition.getWordDefinition(word, "wordreference")
          .then(function (definition) {
            var newWordEntry = new wordEntrySchema();
            var date = new Date();
            newWordEntry.word = word; // TODO: check field defaults (such as first rating)
            newWordEntry.definition = definition;
            newWordEntry.created = date;
            newWordEntry.user = user;
            newWordEntry.addRating(1, date);
            newWordEntry.save(function (error) {
              if (error) {
                deferred.reject(new Error(error));
              }
              else {
                deferred.resolve(newWordEntry._doc);
              }
            });
          })
          .fail(function (error) {
            deferred.reject(new Error(error));
          });
      }
      else {
        deferred.reject(new Error("Word entry already exists for user"));
      }
    })
    .fail(function (error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};

WordEntrySchema.statics.formatWordEntry = function (wordEntry) {
  if(!wordEntry) {
    return null;
  }

  return {
    word: wordEntry.word,
    definition: wordEntry.definitions,
    examples: wordEntry.examples,
    ratings: wordEntry.ratings.map(function (rating) {
      return {
        rate: rating.rate,
        saved: rating.saved.getTime()
      }
    }),
    currentRate: wordEntry.currentRate,
    starred: wordEntry.starred,
    created: formatDate(wordEntry.created),
    createdEpoch: wordEntry.created.getTime() // TODO: might have timezone issues
  };
};

function formatDate(date) {
  return moment(date).format("MMMM Do YYYY, h:mm a");
}

module.exports = mongoose.model('WordEntry', WordEntrySchema);
