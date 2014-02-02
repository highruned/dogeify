(function () {
  var Http, Https, proxyRequest;

  Http = require('http');

  Https = require('https');

  module.exports = proxyRequest = function (req, res) {
    var RequestClient, clientReq, options;
    options = {
      host: req.headers['host'],
      path: req.url,
      headers: req.headers,
      method: req.method,
      agent: false
    };
    RequestClient = req.secure ? Https : Http;
    clientReq = RequestClient.request(options, function (clientRes) {
      var headers, statusCode;
      statusCode = clientRes.statusCode;
      headers = clientRes.headers;
      if ('transfer-encoding' in headers) delete headers['transfer-encoding'];
      if ('content-length' in headers) delete headers['content-length'];
      res.writeHead(statusCode, headers);
      clientRes.on("data", function (data) {
        return res.write(data);
      });
      return clientRes.on("end", function (data) {
        res.end(data);
        if (clientRes.trailers) return res.addTrailers(clientRes.trailers);
      });
    });
    clientReq.on("error", function (err) {
      console.log("Request Error:");
      console.dir(err);
      res.writeHead(500, "Error connecting.", {});
      return res.end();
    });
    req.on("data", function (data) {
      return clientReq.write(data);
    });
    req.on("end", function (data) {
      return clientReq.end(data);
    });
    return req.on("close", function () {
      return clientReq.abort();
    });
  };

}).call(this);