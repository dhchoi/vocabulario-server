"use strict";

var Q = require('q');
var phantom = require('phantom');

var sources = {
  WORD_REFERENCE: "wordreference"
};

exports.sources = sources;

exports.getDefinition = function(word, source) {
  var deferred = Q.defer();

  if (source === sources.WORD_REFERENCE) {
    var url = 'http://www.wordreference.com/definition/' + word;
    phantom.create(function (ph) {
      ph.createPage(function (page) {
        page.open(url, function (status) {
          page.evaluate(function () {
            var definition = document.querySelector('.entryRH').innerHTML;
            return definition;
          }, function (definition) {
            ph.exit();
            if (definition == undefined || definition == 'undefined') {
              deferred.reject(new Error("Definition was not found from source"));
            } else {
              deferred.resolve(definition);
            }
          });
        });
      });
    });
  }
  else{
    deferred.reject(new Error("Unknown dictionary source"));
  }

  return deferred.promise;
};
