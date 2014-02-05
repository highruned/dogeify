(function () {
  var fs, NO_TRANSFORM, Rewriter, captureResponse, insertGA, outputTag, _ref;

  fs = require('fs');

  captureResponse = require('./../capture');

  _ref = require('./../rewrite'), Rewriter = _ref.Rewriter, NO_TRANSFORM = _ref.NO_TRANSFORM, outputTag = _ref.outputTag;

  module.exports = insertGA = function () {
    /*
        Insert GA Middleware
    
    
        Inserts the tag after the opening head tag.
    */
    var gaTag = fs.readFileSync("" + __dirname + "/../../vendor/ga.html");

    var transform = function (el) {
      if (el.name === 'body') {
        var tag = outputTag(el);

        return tag + gaTag;
      } 
      else {
        return NO_TRANSFORM;
      }
    };

    return function (req, res, next) {
      var buffer, newRes, transformResponse, _ref2;
      _ref2 = captureResponse(res, function (statusCode, reason, headers) {
        return transformResponse(statusCode, reason, headers);
      }), buffer = _ref2[0], newRes = _ref2[1];
      buffer.pause();

      transformResponse = function (statusCode, reason, headers) {
        var ajax, html, jsonp, okay, rw;

        html = /html/.test(headers['content-type']);
        ajax = headers['x-requested-with'];
        jsonp = /callback=/i.test(req.url);
        okay = statusCode === 200;

        if (html && !ajax && !jsonp && okay) {
          rw = new Rewriter(transform);

          buffer.pipe(rw).pipe(newRes);
        } 
        else {
          buffer.pipe(newRes);
        }

        return buffer.resume();
      };

      next();
    };
  };

}).call(this);