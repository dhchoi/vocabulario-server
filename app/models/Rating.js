"use strict";

var mongoose = require('mongoose');

var RatingSchema = new mongoose.Schema({
  rate: {type: Number, min: 1, max: 5, default: 1},
  saved: Date
});

module.exports = mongoose.model('Rating', RatingSchema);
