(function () {
  var DEBUG, https, MAX_COUNTER, WORKER_ID, bytesSent, counter, inFlight, loghit, responseCount, responseTime, sendHits;

  https = require('https');

  DEBUG = process.env['DEBUG'];

  MAX_COUNTER = 1000000;

  WORKER_ID = Math.floor(Math.random() * 1000000);

  bytesSent = 0;

  counter = 0;

  responseCount = 0;

  responseTime = 0;

  inFlight = 0;

  loghit = function (time, bytes) {
    responseTime += time || 0;
    counter += 1;
    responseCount += 1;
    bytesSent += bytes;

    if (counter > MAX_COUNTER) 
      return counter = 1;
  };

  sendHits = function () {
    var data, mem, options, req;

    options = {
      host: "metrics-api.librato.com",
      path: "/v1/metrics",
      method: "POST",
      auth: process.env["LIBRATO_AUTH"],
      headers: {
        "Content-Type": "application/json"
      }
    };

    mem = process.memoryUsage();

    data = {
      counters: [{
        name: "dogeify.requests",
        value: counter,
        source: "worker." + WORKER_ID
      }],
      gauges: [{
        name: "dogeify.responseTime",
        value: responseCount && (responseTime / responseCount) || 0,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.bytesSent",
        value: bytesSent,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.requestsPerSecond",
        value: responseCount / 60,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.inProgress",
        value: inFlight,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.memory.rss",
        value: mem.rss,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.memory.heapUsed",
        value: mem.heapUsed,
        source: "worker." + WORKER_ID
      }, {
        name: "dogeify.memory.heapTotal",
        value: mem.heapTotal,
        source: "worker." + WORKER_ID
      }]
    };

    req = https.request(options, function (res) {
      if (DEBUG) {
        console.log("Logged " + counter);

        res.on('data', function (data) {
          console.log(data.toString());
        });
      }
    });

    responseTime = 0;
    responseCount = 0;
    bytesSent = 0;

    req.end(JSON.stringify(data));
  };

  setInterval(sendHits, 60 * 1000);

  module.exports = function (req, res, next) {
    var end = res.end, 
      flying = true, 
      length = 0, 
      time = Date.now(), 
      write = res.write;

    inFlight += 1;

    res.write = function (chunk, encoding) {
      if (Buffer.isBuffer(chunk)) {
        length += chunk.length;
      } 
      else {
        length += Buffer.byteLength(chunk);
      }

      write.call(res, chunk, encoding);
    };

    res.end = function (chunk, encoding) {
      if (flying) {
        inFlight -= 1;
        flying = false;
      }
console.log('logging');
      loghit(Date.now() - time, length);

      end.call(res, chunk, encoding);
    };

    res.on('close', function () {
      if (flying) {
        inFlight -= 1;
        flying = false;
      }
    });

    next();
  };

}).call(this);