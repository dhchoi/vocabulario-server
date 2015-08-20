"use strict";

var mongoose = require('mongoose');
var Rating = require("./Rating");

var WordSchema = new mongoose.Schema({
  word: {type: String, unique: true, lowercase: true},
  definition: {type: String, default: ''},
  sentence: {type: String, default: ''},
  ratings: [Rating.schema],
  currentRate: Number,
  starred: {type: Boolean, default: false},
  created: Date
});

WordSchema.methods.addRating = function (rating, savedDate) {
  var ratingObj = {
    rate: rating,
    saved: savedDate || new Date()
  };
  this.ratings.push(ratingObj);
  this.currentRate = this.ratings[this.ratings.length - 1].rate;

  return this.currentRate;
};

WordSchema.methods.toggleStarred = function () {
  this.starred = !this.starred;

  return this.starred;
};

// TODO: optimize and find way to query with proper findOne()
WordSchema.statics.search = function (words, w) {
  var wordFound = words.filter(function (word) {
    if (word.word === w) {
      return true;
    } else {
      return false;
    }
  });

  if (wordFound.length > 0) {
    return wordFound[0];
  }

  return null;
};

module.exports = mongoose.model('Word', WordSchema);
