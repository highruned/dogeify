(function () {
  var http = require('http'),
    https = require('https');

  module.exports = function (req, res) {
    var options = {
      host: req.headers['host'],
      path: req.url,
      headers: req.headers,
      method: req.method,
      agent: false
    };

    var requestClient = req.secure ? https : http;

    var clientReq = requestClient.request(options, function (clientRes) {
      var statusCode = clientRes.statusCode;
      var headers = clientRes.headers;

      if ('transfer-encoding' in headers) 
        delete headers['transfer-encoding'];

      if ('content-length' in headers) 
        delete headers['content-length'];

      res.writeHead(statusCode, headers);

      clientRes.on('data', function (data) {
        res.write(data);
      });

      clientRes.on('end', function (data) {
        res.end(data);

        if (clientRes.trailers) 
          res.addTrailers(clientRes.trailers);
      });
    });

    clientReq.on('error', function (err) {
      console.log("Request Error:");
      console.dir(err);

      res.writeHead(500, "Error connecting.", {});
      res.end();
    });

    req.on('data', function (data) {
      clientReq.write(data);
    });

    req.on('end', function (data) {
      clientReq.end(data);
    });

    req.on('close', function () {
      clientReq.abort();
    });
  };

}).call(this);