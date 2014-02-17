(function () {
  var NO_TRANSFORM, Rewriter, captureResponse, outputTag, transformUrl, _ref;

  captureResponse = require('./../capture');

  _ref = require('./../rewrite'), Rewriter = _ref.Rewriter, NO_TRANSFORM = _ref.NO_TRANSFORM, outputTag = _ref.outputTag;

  transformUrl = function (el, addHost) {
    /*
        Calls `addHost` for any URL found in the
        HTML source, replacing it's value.
    
        Looks in:
            - a (href)
            - link (href)
            - img (src)
            - style (src)
            - script (src)
            - form (action)
    */
    if (el.name === 'a' || el.name === 'link') {
      if (!(el.attribs != null) || !el.attribs.href) 
        return NO_TRANSFORM;

      el.attribs.href = addHost(el.attribs.href, {
        url: true
      });

      return outputTag(el);
    } 
    else if (el.name === 'img' || el.name === 'style' || el.name === 'script' || el.name === 'iframe') {
      if (!(el.attribs != null) || !el.attribs.src) 
        return NO_TRANSFORM;

      el.attribs.src = addHost(el.attribs.src, {
        url: true
      });

      return outputTag(el);
    } 
    else if (el.name === 'form') {
      if (!(el.attribs != null) || !el.attribs.action) 
        return NO_TRANSFORM;

      el.attribs.action = addHost(el.attribs.action, {
        url: true
      });

      return outputTag(el);
    } 
    else {
      return NO_TRANSFORM;
    }
  };

  module.exports = function (addHost) {
    /*
        RewriteHTML middleware.
    
        Rewrites response HTML's Urls, so they point a new Urls given by `addHost`
        argument.
    */
    var transform = function (el) {
      return transformUrl(el, addHost);
    };

    return function (req, res, next) {
      var buffer, newRes, transformResponse, _ref2;

      _ref2 = captureResponse(res, function (statusCode, reason, headers) {
        return transformResponse(statusCode, reason, headers);
      }), buffer = _ref2[0], newRes = _ref2[1];

      buffer.pause();

      req.on('close', function () {
        if (buffer) 
          buffer.destroy();
      });

      buffer.on('end', function () {
        if (buffer) 
          buffer = null;
      });

      buffer.on('close', function () {
        if (buffer) 
          buffer = null;
      });

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
          if(!buffer) {
            console.log("Trying to write a non-200 response to a closed pipe.");
            console.log(headers);
            return;
          }

          buffer.pipe(newRes);
        }

        return buffer.resume();
      };

      next();
    };
  };

}).call(this);