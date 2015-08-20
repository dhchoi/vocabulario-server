"use strict";

var phantom = require('phantom');

exports.getDefinition = function(word, cb) {
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
};
