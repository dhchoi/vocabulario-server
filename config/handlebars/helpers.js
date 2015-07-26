"use strict";

module.exports = {
    init: function(exphbs, connectAssetsObj) {
        exphbs.handlebars.registerHelper("css", function () {
            var css = connectAssetsObj.options.helperContext.css.apply(this, arguments);
            return new exphbs.handlebars.SafeString(css);
        });

        exphbs.handlebars.registerHelper("js", function () {
            var js = connectAssetsObj.options.helperContext.js.apply(this, arguments);
            return new exphbs.handlebars.SafeString(js);
        });

        exphbs.handlebars.registerHelper("assetPath", function () {
            var assetPath = connectAssetsObj.options.helperContext.assetPath.apply(this, arguments);
            return new exphbs.handlebars.SafeString(assetPath);
        });

        exphbs.handlebars.registerHelper("gravatar", function(user, size) {
            if(typeof size !== "number") {
                size = undefined;
            }
            return new exphbs.handlebars.SafeString(user.gravatar(size));
        });

        //http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/#comment-44
        exphbs.handlebars.registerHelper("compare", function(lvalue, operator, rvalue, options) {
            var operators, result;

            if (arguments.length < 3) {
                throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
            }

            if (options === undefined) {
                options = rvalue;
                rvalue = operator;
                operator = "===";
            }

            operators = {
                '==': function (l, r) { return l == r; },
                '===': function (l, r) { return l === r; },
                '!=': function (l, r) { return l != r; },
                '!==': function (l, r) { return l !== r; },
                '<': function (l, r) { return l < r; },
                '>': function (l, r) { return l > r; },
                '<=': function (l, r) { return l <= r; },
                '>=': function (l, r) { return l >= r; },
                'typeof': function (l, r) { return typeof l == r; }
            };

            if (!operators[operator]) {
                throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
            }

            result = operators[operator](lvalue, rvalue);

            if (result) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });
    }
};
