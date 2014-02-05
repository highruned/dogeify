(function () {
  var FS, NO_TRANSFORM, Rewriter, captureResponse, outputTag, _ref;

  FS = require('fs');

  captureResponse = require('./../capture');

  _ref = require('./../rewrite'), Rewriter = _ref.Rewriter, NO_TRANSFORM = _ref.NO_TRANSFORM, outputTag = _ref.outputTag;

  module.exports = function (path) {
    /*
        RewriteHTML middleware.
    
        Rewrites response HTML's urls, 
        so they point a new url given by `rewriteUrl` argument.
    */
    var getDogeURL, doges, dogesRaw, doge, transform, _i, _len;

    dogesRaw = FS.readFileSync(path, 'utf8').split("\n");
    doges = [];

    for (_i = 0, _len = dogesRaw.length; _i < _len; _i++) {
      doge = dogesRaw[_i];
      doge = doge.replace(/(#.*)/, "");
      doge = doge.replace(/\s+/g, "");

      if (doge) 
        doges.push(doge);
    }

    getDogeURL = function () {
      var index = Math.floor(Math.random() * doges.length);

      return doges[index];
    };

    transform = function (el) {
      /*
        Inserts Doges

        Looks in:
            - img (src)
      */
      if (el.name === 'img') {
        if (!(el.attribs != null) || !el.attribs.src || (Math.random() > 10)) {
          return NO_TRANSFORM;
        }

        var random = Math.random().toString().slice(2, 7);
        el.attribs.src = getDogeURL();

        return outputTag(el);
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

        buffer.resume();
      };

      next();
    };
  };

}).call(this);