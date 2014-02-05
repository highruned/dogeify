(function () {
  var BufferStream, Connect, captureResponse,
    __slice = Array.prototype.slice;

  Connect = require('connect');

  BufferStream = require('./bufferstream');

  captureResponse = function (res, onEndHeader) {
    var buffer, end, headersWritten, newRes, setHeader, write, writeHead;

    write = res.write;
    end = res.end;
    writeHead = res.writeHead;
    setHeader = res.setHeader;
    res.reason = "";
    res.headers = {};
    buffer = new BufferStream();
    headersWritten = false;

    res.write = function (data, encoding) {
      buffer.write(data, encoding);
      if (!headersWritten && onEndHeader) {
        headersWritten = true;
        return onEndHeader(res.statusCode, res.reason, res.headers);
      }
    };

    res.end = function (data, encoding) {
      buffer.end(data, encoding);
      if (!headersWritten && onEndHeader) {
        headersWritten = true;
        return onEndHeader(res.statusCode, res.reason, res.headers);
      }
    };

    res.writeHead = function () {
      var statusCode, _headers, _i, _reason, _statusCode;
      _statusCode = arguments[0], _reason = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), _headers = arguments[_i++];
      statusCode = _statusCode;
      res.reason = _reason[0] || res.reason;
      res.headers = _headers || res.headers;
      writeHead.apply(res, arguments);
      if (!headersWritten && onEndHeader) {
        headersWritten = true;
        return onEndHeader(res.statusCode, res.reason, res.headers);
      }
    };

    res.setHeader = function (header, value) {
      return res.headers[header] = value;
    };

    res.on("close", function () {
      return buffer.destroy();
    });

    newRes = {
      write: function (data, encoding) {
        return write.call(res, data, encoding);
      },
      end: function (data, encoding) {
        return end.call(res, data, encoding);
      },
      on: function () {
        return res.on.apply(res, arguments);
      },
      emit: function () {
        return res.emit.apply(res, arguments);
      },
      writable: true,
      removeListener: function () {
        return res.removeListener.apply(res, arguments);
      },
      destroy: function () {
        return this.emit("close");
      }
    };
    
    return [buffer, newRes];
  };

  module.exports = captureResponse;

}).call(this);