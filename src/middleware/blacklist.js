(function () {
  var blacklist,
    __indexOf = Array.prototype.indexOf || function (item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) return i;
      }
      return -1;
    };

  module.exports = blacklist = function (removeHost, blacklist, content) {
    return function (req, res, next) {
      var host;
      host = removeHost(req.headers['host']);
      if (__indexOf.call(blacklist, host) >= 0) {
        res.writeHead(404, "Four-oh-bore: Sense of humor not found", {
          "Content-Length": content.length,
          "Content-Type": "text/html"
        });
        res.write(content);
        return res.end();
      } else {
        return next();
      }
    };
  };

}).call(this);