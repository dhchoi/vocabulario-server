"use strict";

var Q = require('q');
var mongoose = require('mongoose');
var dictionary = require("../helpers/dictionary");

var WordDefinitionSchema = new mongoose.Schema({
  "word": {type: String, lowercase: true},
  "source": {type: String, lowercase: true},
  "definitions": [{
    "definition": {type: String, default: ""},
    "partOfSpeech": {type: String, default: ""},
    _id: false
  }],
  "pronunciationSymbol": {type: String, default: ""},
  "pronunciationFile": {type: String, default: ""}
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
    .then(function (definition) {
      newWordDefinition.word = word;
      newWordDefinition.source = source;
      newWordDefinition.definitions.push({
        definition: definition,
        partOfSpeech: ""
      });
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

  //dictionary.getDefinition(word, source, function (err, result) {
  //  if (!err) {
  //    var newWord = WordEntry.createNewEntry(word, result);
  //    user.wordEntries.push(newWord);
  //    user.save(function (err) {
  //      if (!err) {
  //        cb(null, _.extend({
  //          result: true,
  //          message: "Add '" + word + "' success."
  //        }, formatWord(newWord._doc)));
  //      }
  //      else {
  //        //res.json(err);
  //        console.log(err);
  //        cb(err, {
  //          result: false,
  //          message: "Error while saving word definition to database."
  //        });
  //      }
  //    });
  //  }
  //  else {
  //    // TODO: check if this is the right way (and find something that ends res)
  //    cb(err, {
  //      result: false,
  //      message: result
  //    });
  //  }
  //});
};

module.exports = mongoose.model('WordDefinition', WordDefinitionSchema);
