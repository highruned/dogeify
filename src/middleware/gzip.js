(function() {
  var ContentEncoding, Zlib, captureResponse, gunZip,
    __slice = Array.prototype.slice;

  Zlib = require('zlib');

  captureResponse = require('./../capture');

  ContentEncoding = {
    IDENTITY: 0,
    GZIP: 1,
    DEFLATE: 2,
    parse: function(header) {
      if (/gzip/.test(header)) {
        return this.GZIP;
      } else if (/deflate/.test(header)) {
        return this.DEFLATE;
      } else {
        return this.IDENTITY;
      }
    }
  };

  exports.gunZip = gunZip = function(req, res, next) {
    var buffer, encoding, newRes, transformResponse, writeHead, _ref;
    req.headers['accept-encoding'] = 'gzip, deflate';
    _ref = captureResponse(res, function(statusCode, reason, headers) {
      return transformResponse(statusCode, reason, headers);
    }), buffer = _ref[0], newRes = _ref[1];
    buffer.pause();
    encoding = ContentEncoding.IDENTITY;
    transformResponse = function(statusCode, reason, headers) {
      var unzip;
      if (encoding !== ContentEncoding.IDENTITY) {
        if (encoding === ContentEncoding.GZIP) {
          unzip = Zlib.createGunzip();
        } else {
          unzip = Zlib.createInflate();
        }
        buffer.pipe(unzip).pipe(newRes);
        unzip.on("error", function() {
          console.log("Problem decoding compressed stream.");
          return newRes.end();
        });
      } else {
        buffer.pipe(newRes);
      }
      return buffer.resume();
    };
    writeHead = res.writeHead;
    res.writeHead = function() {
      var headers, reason, statusCode, _i;
      statusCode = arguments[0], reason = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), headers = arguments[_i++];
      if (headers == null) headers = {};
      reason = reason[0];
      encoding = ContentEncoding.parse(headers['content-encoding']);
      if (encoding !== ContentEncoding.IDENTITY) {
        delete headers['content-encoding'];
        delete headers['content-length'];
      }
      if (reason) {
        return writeHead.call(res, statusCode, reason, headers);
      } else {
        return writeHead.call(res, statusCode, headers);
      }
    };
    return next();
  };

}).call(this);
