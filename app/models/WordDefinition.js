"use strict";

var Q = require('q');
var mongoose = require('mongoose');
var dictionary = require("../helpers/dictionary");

var WordDefinitionSchema = new mongoose.Schema({
  //"word": {type: String, lowercase: true},
  //"plural": {type: String, lowercase: true},
  //"entries:": [{
  //  "types": [{
  //    "partOfSpeech": {type: String, default: ""},
  //    "definitions": [{
  //      "text": {type: String, default: ""},
  //      "category": {type: String, default: ""},
  //      "label": {type: String, default: ""},
  //      _id: false
  //    }],
  //    _id: false
  //  }],
  //  "pronunciationSymbol": {type: String, default: ""},
  //  "pronunciationFile": {type: String, default: ""},
  //  _id: false
  //}],
  //"source": {type: String, lowercase: true}
  "word": {type: String, lowercase: true},
  "definitions:": [{
    "asdf": {type: String, default: ""}
  }],
  //  [{
  //  "partOfSpeech": {type: String, default: ""},
  //  "text": {type: String, default: ""},
  //  //"labels": [{
  //  //  "text": {type: String, default: ""},
  //  //  "type": {type: String, default: ""},
  //  //  _id: false
  //  //}],
  //  labels: {},
  //  _id: false
  //}],
  "pronunciationSymbol": {type: String, default: ""},
  "pronunciationFile": {type: String, default: ""},
  "source": {type: String, lowercase: true}
});

WordDefinitionSchema.statics.getWordDefinition = function (word, source) {
  var deferred = Q.defer();
  var wordDefinitionSchema = this;

  this.findOne({"word": word, "source": source}, function (err, wordDefinition) {
    if (err) {
      deferred.reject(new Error(err));
    }
    else {
      if (wordDefinition) {
        deferred.resolve(wordDefinition);
      }
      else {
        wordDefinitionSchema.addWordDefinition(word, source)
          .then(function (newWordDefinition) {
            deferred.resolve(newWordDefinition);
          })
          .fail(function (error) {
            deferred.reject(new Error(error));
          });
      }
    }
  });

  return deferred.promise;
};

WordDefinitionSchema.statics.addWordDefinition = function (word, source) {
  var deferred = Q.defer();
  var newWordDefinition = new this();

  dictionary.getDefinition(word, source)
    .then(function (definitions) {
      var obj = {"asdf": 1};
      newWordDefinition.word = word;
      newWordDefinition.source = source;
      // TODO: array not being saved
      newWordDefinition.definitions.push(obj);//definitions;
      newWordDefinition.save(function (error) {
        if (error) {
          deferred.reject(new Error(error));
        }
        else {
          deferred.resolve(newWordDefinition);
        }
      });
    })
    .fail(function (error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};

module.exports = mongoose.model('WordDefinition', WordDefinitionSchema);
