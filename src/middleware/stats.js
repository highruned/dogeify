(function () {
  var DEBUG, Https, MAX_COUNTER, WORKER_ID, bytesSent, counter, inFlight, loghit, responseCount, responseTime, sendHits, statsCollector;

  Https = require('https');

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
    if (counter > MAX_COUNTER) return counter = 1;
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
        source: "heroku." + WORKER_ID
      }],
      gauges: [{
        name: "dogeify.responseTime",
        value: responseCount && (responseTime / responseCount) || 0,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.bytesSent",
        value: bytesSent,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.requestsPerSecond",
        value: responseCount / 60,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.inProgress",
        value: inFlight,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.memory.rss",
        value: mem.rss,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.memory.heapUsed",
        value: mem.heapUsed,
        source: "heroku." + WORKER_ID
      }, {
        name: "dogeify.memory.heapTotal",
        value: mem.heapTotal,
        source: "heroku." + WORKER_ID
      }]
    };
    req = Https.request(options, function (res) {
      if (DEBUG) {
        console.log("Logged " + counter);
        return res.on("data", function (data) {
          return console.log(data.toString());
        });
      }
    });
    responseTime = 0;
    responseCount = 0;
    bytesSent = 0;
    return req.end(JSON.stringify(data));
  };

  setInterval(sendHits, 60 * 1000);

  module.exports = statsCollector = function (req, res, next) {
    var end, flying, length, time, write;
    inFlight += 1;
    flying = true;
    time = Date.now();
    end = res.end;
    write = res.write;
    length = 0;
    res.write = function (chunk, encoding) {
      if (Buffer.isBuffer(chunk)) {
        length += chunk.length;
      } else {
        length += Buffer.byteLength(chunk);
      }
      return write.call(res, chunk, encoding);
    };
    res.end = function (chunk, encoding) {
      if (flying) {
        inFlight -= 1;
        flying = false;
      }
      loghit(Date.now() - time, length);
      return end.call(res, chunk, encoding);
    };
    res.on("close", function () {
      if (flying) {
        inFlight -= 1;
        return flying = false;
      }
    });
    return next();
  };

}).call(this);