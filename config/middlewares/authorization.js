"use strict";

// login Required middleware
exports.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// authorization Required middleware
exports.isAuthorized = function (req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, {kind: provider})) {
    next();
  }
  else {
    res.redirect('/auth/' + provider);
  }
};
