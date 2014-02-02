(function () {
  var END_EVENT, EventEmitter, FS, HtmlParser, InnerRewriter, NO_TRANSFORM, OuterRewriter, outputTag,
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
    },
    __slice = Array.prototype.slice,
    __bind = function (fn, me) {
      return function () {
        return fn.apply(me, arguments);
      };
    };

  HtmlParser = require("htmlparser");

  FS = require('fs');

  EventEmitter = require('events').EventEmitter;

  END_EVENT = {
    "event": "END"
  };

  NO_TRANSFORM = {};

  outputTag = function (el) {
    var attr, tag, value, _ref;
    tag = "<";
    tag += el.name;
    if (el.attribs) {
      _ref = el.attribs;
      for (attr in _ref) {
        value = _ref[attr];
        tag += " " + attr;
        if (value) tag += "=\"" + value + "\"";
      }
    }
    tag += ">";
    return tag;
  };

  InnerRewriter = (function (_super) {

    __extends(InnerRewriter, _super);

    function InnerRewriter(transform) {
      this._transform = transform;
      this._dataQueue = [];
      this._paused = false;
      this._destroySoon = false;
      this._destoryed = false;
      this._willFlush = false;
    }

    InnerRewriter.prototype.transformElement = function (el) {
      return this._transform(el);
    };

    InnerRewriter.prototype.writeTag = function (el) {
      var from, to, transformed;
      transformed = this.transformElement(el);
      if (transformed !== NO_TRANSFORM) {
        from = el.location.character;
        to = from + el.raw.length + 2;
        this.write(from, to, transformed);
      }
      return null;
    };

    InnerRewriter.prototype.writeText = function (el) {};

    InnerRewriter.prototype.writeComment = function (el) {};

    InnerRewriter.prototype.writeDirective = function (el) {};

    InnerRewriter.prototype.reset = function () {};

    InnerRewriter.prototype.done = function () {
      return this.end();
    };

    InnerRewriter.prototype.flush = function () {
      var _this = this;
      if (!this._willFlush) {
        return process.nextTick(function () {
          return _this._flush();
        });
      }
    };

    InnerRewriter.prototype._flush = function () {
      var data;
      this._willFlush = false;
      if (this._paused || this._destroyed) return;
      while (this._dataQueue.length) {
        data = this._dataQueue.shift();
        if (data === END_EVENT) {
          this.emit('end');
        } else {
          this.emit.apply(this, ['data'].concat(__slice.call(data)));
        }
      }
      if (this._destorySoon) {
        this._destroyed = true;
        return this.emit('close');
      }
    };

    InnerRewriter.prototype.destroySoon = function () {
      return this._destroySoon = true;
    };

    InnerRewriter.prototype.destroy = function () {
      this._destroyed = true;
      return this.emit('close');
    };

    InnerRewriter.prototype.pause = function () {
      return this._paused = true;
    };

    InnerRewriter.prototype.resume = function () {
      this._paused = false;
      return this.flush();
    };

    InnerRewriter.prototype.write = function () {
      var data;
      data = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this._dataQueue.push(data);
      return this.flush();
    };

    InnerRewriter.prototype.end = function () {
      this._dataQueue.push(END_EVENT);
      return this.flush();
    };

    return InnerRewriter;

  })(EventEmitter);

  OuterRewriter = (function (_super) {

    __extends(OuterRewriter, _super);

    function OuterRewriter(transform) {
      this._handleError = __bind(this._handleError, this);
      this._handleClose = __bind(this._handleClose, this);
      this._handleEnd = __bind(this._handleEnd, this);
      this._handleData = __bind(this._handleData, this);
      this.rewriter = new InnerRewriter(transform);
      this.parser = new HtmlParser.Parser(this.rewriter, {
        includeLocation: true
      });
      this.input = "";
      this.index = 0;
      this._paused = false;
      this._destroySoon = false;
      this._destroyed = false;
      this._willFlush = false;
      this._setup();
    }

    OuterRewriter.prototype._setup = function () {
      this.rewriter.on("data", this._handleData);
      this.rewriter.on("end", this._handleEnd);
      this.rewriter.on("close", this._handleClose);
      return this.rewriter.on("error", this._handleError);
    };

    OuterRewriter.prototype._handleData = function (from, to, data) {
      this._output(this.input.slice(this.index, from));
      if (data) this._output(data);
      return this.index = to;
    };

    OuterRewriter.prototype._handleEnd = function () {
      this._output(this.input.slice(this.index, this.input.length));
      return this._end();
    };

    OuterRewriter.prototype._handleClose = function () {
      return this._close();
    };

    OuterRewriter.prototype._handleError = function (error) {
      return this._error(error);
    };

    OuterRewriter.prototype._output = function (output) {
      return this.emit("data", output);
    };

    OuterRewriter.prototype._end = function () {
      return this.emit("end");
    };

    OuterRewriter.prototype._close = function () {
      return this.emit("close");
    };

    OuterRewriter.prototype._error = function () {
      return this.emit("error");
    };

    OuterRewriter.prototype.write = function (data) {
      if (Buffer.isBuffer(data)) data = data.toString();
      this.input += data;
      this.parser.parseChunk(data);
      return true;
    };

    OuterRewriter.prototype.end = function () {
      return this.parser.done();
    };

    OuterRewriter.prototype.pipe = function (destination, options) {
      this.on("data", function (output) {
        return destination.write(output);
      });
      if (!(options != null) || !(options.end != null) || options.end) {
        this.on("end", function () {
          return destination.end();
        });
      }
      return destination;
    };

    OuterRewriter.prototype.writable = true;

    OuterRewriter.prototype.readable = true;

    OuterRewriter.prototype.destroySoon = function () {
      return this._destroySoon = true;
    };

    OuterRewriter.prototype.destroy = function () {
      this._destroyed = true;
      return this.emit('close');
    };

    return OuterRewriter;

  })(EventEmitter);

  exports.Rewriter = OuterRewriter;

  exports.NO_TRANSFORM = NO_TRANSFORM;

  exports.outputTag = outputTag;

}).call(this);