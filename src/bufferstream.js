(function () {
  var BufferStream, DEBUG, Stream,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function (child, parent) {
      for (var key in parent) {
        if (__hasProp.call(parent, key)) child[key] = parent[key];
      }

      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor;
      child.__super__ = parent.prototype;

      return child;
    };

  Stream = require('stream');

  /*
  BufferStream

  A streaming interface for a buffer.

  You can stream (eg, `pipe`) data in to a `BufferStream` object
  and then `pipe` it into another object.

  BufferStreams have a few benefits:
      - Automatically buffer any amount of data (memory permitting).
           - Automatically increase in size in a semi-intelligent fashion.
           - No need to wait for `drain` on the write side.
           - Makes efficient use of buffers

      - You can `pause` a BufferStream and collect data for later.
  */

  DEBUG = process.env['DEBUG'];

  BufferStream = (function (_super) {
    var MAX_BUFFER_SIZE, MIN_BUFFER_SIZE;

    __extends(BufferStream, _super);

    MIN_BUFFER_SIZE = 65536;

    MAX_BUFFER_SIZE = 65536;

    function BufferStream(size) {
      if (size == null) size = MIN_BUFFER_SIZE;
      this.writeIndex = 0;
      this.readIndex = 0;
      this.buffer = new Buffer(size);
      this.readBuffer = 1024 * 16;
      this.encoding = 'utf8';
      this.emitStrings = false;
      this._endWrite = false;
      this._endRead = false;
      this._destroySoon = false;
      this._destroyed = false;
      this.writable = true;
      this.readable = true;
      this.paused = false;
    }

    /*
        #
    */

    BufferStream.prototype.ensureSpace = function (bytes) {
      var bytesAvailable, currentSize, desiredSize, newBuffer, targetSize;
      bytesAvailable = this.buffer.length - this.writeIndex;

      if (bytesAvailable >= bytes) 
        return;

      currentSize = this.writeIndex - this.readIndex;
      desiredSize = currentSize + bytes;
      targetSize = MIN_BUFFER_SIZE;

      while (targetSize < desiredSize) {
        targetSize *= 2;
      }

      if (DEBUG) {
        console.log("Resizing buffer from " + this.buffer.length + " to " + targetSize);
      }

      newBuffer = new Buffer(targetSize);
      this.buffer.copy(newBuffer, 0, this.readIndex, this.writeIndex);
      this.writeIndex = this.writeIndex - this.readIndex;
      this.readIndex = 0;
      this.buffer = newBuffer;

      return true;
    };

    /*
        # Internal Buffer Access
    */

    BufferStream.prototype._writeBuffer = function (buffer) {
      this.ensureSpace(buffer.length);
      buffer.copy(this.buffer, this.writeIndex);
      this.writeIndex = this.writeIndex + buffer.length;

      return true;
    };

    BufferStream.prototype._writeString = function (string) {
      var bytes;

      bytes = Buffer.byteLength(string, this.encoding);
      this.ensureSpace(bytes);
      this.buffer.write(string, this.writeIndex, bytes, this.encoding);
      this.writeIndex = this.writeIndex + bytes;

      return true;
    };

    BufferStream.prototype._readBuffer = function (maxBytes) {
      var buffer;

      if (maxBytes == null) 
        maxBytes = 0;

      if (maxBytes === 0) {
        this.targetIndex = this.writeIndex;
      } 
      else {
        this.targetIndex = this.readIndex + maxBytes;
      }

      if (this.targetIndex > this.writeIndex) 
        this.targetIndex = this.writeIndex;

      buffer = this.buffer.slice(this.readIndex, this.targetIndex);
      this.readIndex = this.targetIndex;

      return buffer;
    };

    BufferStream.prototype._getLength = function () {
      return this.writeIndex - this.readIndex;
    };

    /*
        # Readable Stream Methods
    */

    BufferStream.prototype.setEncoding = function (encoding) {
      if (encoding !== 'utf8') {
        throw new Error("Only UTF8 is a supported encoding");
      }

      throw new Error("Not Implemented.");

      this.encoding = encoding;

      this.emitStrings = true;
    };

    BufferStream.prototype.pause = function () {
      this.paused = true;
    };

    BufferStream.prototype.resume = function () {
      this.paused = false;

      this.flush();
    };

    BufferStream.prototype._flush = function () {
      var empty;

      if (this.paused || this._destroyed) return;

      this._emitData(this._endWrite || this._destroySoon);
      empty = !this._getLength();

      if (empty && this._endWrite) this._emitEnd();
      if (empty && this._endWrite && this._destroySoon) return this.destroy();
    };

    BufferStream.prototype._emitData = function (force) {
      var bytesRemaining, data;

      if (force == null) force = false;

      bytesRemaining = this._getLength();
      if ((bytesRemaining >= MIN_BUFFER_SIZE) || force) {
        data = this._readBuffer(MAX_BUFFER_SIZE);
        if (data.length) this.emit("data", data);
        this.flush();
      }
    };

    BufferStream.prototype._emitEnd = function () {
      this.readable = false;
      this._endRead = true;
      this.emit('end');
      this.destroy();
    };

    /*
        # Writable Stream Methods
    */

    BufferStream.prototype.write = function (data, encoding) {
      if (encoding == null) encoding = 'utf8';
      if (encoding !== 'utf8') throw new Error("Only supports utf8.");
      if (this._endWrite || this._destroyed) {
        throw new Error("Cannot write to stream, has been ended or destroyed.");
      }

      if (Buffer.isBuffer(data)) {
        this._writeBuffer(data);
      } 
      else {
        this._writeString(data, encoding);
      }

      this.flush();

      return true;
    };

    BufferStream.prototype.end = function (data, encoding) {
      if (data != null) 
        this.write(data, encoding);

      this.writable = false;
      this._endWrite = true;

      return this.flush();
    };

    /*
        # Readable, Writable Stream Methods
    */

    BufferStream.prototype.flush = function () {
      var _this = this;

      process.nextTick(function () {
        _this._flush();
      });
    };

    BufferStream.prototype.destroy = function () {
      if (this._destroyed) return;
      this._destroyed = true;
      this.writable = false;
      this.readable = false;
      if (!this._endRead) this.emit('close');
      this.cleanup();
    };

    BufferStream.prototype.destroySoon = function () {
      this.end();
      this._destroySoon = true;
      this.flush();
    };

    BufferStream.prototype.cleanup = function () {
      this.readIndex = 0;
      this.writeIndex = 0;
      this.buffer = null;
    };

    return BufferStream;

  })(Stream);

  module.exports = BufferStream;

}).call(this);