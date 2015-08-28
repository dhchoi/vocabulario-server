"use strict";

var Q = require('q');
var phantom = require('phantom');
var request = require('request');
var cheerio = require('cheerio');

var sources = {
  WORD_REFERENCE: "wordreference",
  WORDNIK: "wordnik",
  RH_LEARNERS: "Random-House-Learner's-Dictionary-of-American-English-2015",
  AHD_LEGACY: "ahd-legacy",
  WEBSTER: "gcide"
};

exports.sources = sources;

exports.getDefinition = function(word, source) {
  var deferred = Q.defer();

  switch (source) {
    case sources.WORD_REFERENCE:
    //  phantom.create(function (ph) {
    //    ph.createPage(function (page) {
    //      page.open('http://www.wordreference.com/definition/'+word, function (status) {
    //        page.evaluate(function () {
    //          return document.querySelector('.entryRH').innerHTML;
    //        }, function (containerHTML) {
    //          ph.exit();
    //          if (containerHTML == undefined || containerHTML == 'undefined') {
    //            deferred.reject(new Error("Definition was not found from source"));
    //          }
    //          else {
    //            var source = sources.RH_LEARNERS;
    //            var $ = cheerio.load(containerHTML);
    //            var entries = [];
    //
    //            // in loop
    //            splitToArray(containerHTML, '<span class="rh_me">').forEach(function (entryHTML) {
    //              var entry = {
    //                types: []
    //              };
    //              var $entry = cheerio.load(entryHTML);
    //
    //              // pronunciation symbol / file
    //              $entry(".rh_pron").find("span").remove();
    //              entry.pronunciationSymbol = $entry(".rh_pron").text();
    //              entry.pronunciationFile = "";
    //              console.log("- pronunciationSymbol: " + entry.pronunciationSymbol);
    //
    //              // main definition
    //              var mainDef = '<span class="rh_pdef">';
    //              var otherDefs = '<span class="rh_empos">';
    //              var type = {
    //                definitions: []
    //              };
    //              var $type = cheerio.load(containerHTML.slice(containerHTML.indexOf(mainDef), containerHTML.indexOf(otherDefs)));
    //              type.partOfSpeech = $type(".rh_pos").text().split(",")[0];
    //              console.log("-- partOfSpeech: " + type.partOfSpeech);
    //              for(var i = 0; i < $type(".rh_def").length; i++) {
    //                console.log("-- def "+i+": " + $type(".rh_def")[i]);
    //              }
    //              //$type(".rh_def").forEach(function (def, index) {
    //              //  console.log("-- def "+index+": " + def.text());
    //              //});
    //
    //              // other definitions
    //              splitToArray(entryHTML, otherDefs).forEach(function (typeHTML) {
    //                var type = {
    //                  definitions: []
    //                };
    //                var $type = cheerio.load(typeHTML);
    //
    //                // part of speech
    //                type.partOfSpeech = $type(".rh_pos").text().split(",")[0];
    //                console.log("-- partOfSpeech: " + type.partOfSpeech);
    //                for(var i = 0; i < $type(".rh_def").length; i++) {
    //                  console.log("-- def "+i+": " + $type(".rh_def")[i]);
    //                }
    //              });
    //            });
    //
    //            // need to normalize
    //            deferred.resolve(containerHTML);
    //          }
    //        });
    //      });
    //    });
    //  });
    //break;
    case sources.WEBSTER:
      var key = "819814de75d9398dc72080b8e4f085bb2acf91ce2e511fe1d";
      request("http://api.wordnik.com:80/v4/word.json/"+word+"/definitions?api_key="+key+"&sourceDictionaries="+source, function (error, response, body) {
        if(error) {
          deferred.reject(new Error(error));
        }
        else {
          var definitions = [];
          JSON.parse(body).forEach(function (definition) {
            if(definition.sourceDictionary === source) {
              definitions.push({
                "partOfSpeech": definition.partOfSpeech,
                "text": definition.text,
                "labels": definition.labels
              });
            }
          });
          console.log("before resolving..." + definitions.length);
          deferred.resolve(definitions);
        }
      });
      break;
    default:
      deferred.reject(new Error("Unknown dictionary source"));
  }

  return deferred.promise;
};

function normailizePartOfSpeech() {

}

function splitToArray(text, splitter) {
  var arr = [];
  var startIndex = text.indexOf(splitter);
  var endIndex = -1;

  if(startIndex < 0) {
    return arr;
  }

  while(startIndex > -1 && startIndex != text.length) {
    endIndex = text.indexOf(splitter, startIndex+1);
    if(endIndex < 0) {
      endIndex = text.length;
    }

    arr.push(text.slice(startIndex, endIndex));

    startIndex = endIndex;
  }

  return arr;
}