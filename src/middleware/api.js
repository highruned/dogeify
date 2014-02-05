(function () {
  var api = {
    routes: {
      go: function(req, res, next) {
        var test = JSON.stringify({a: '44'});

        res.writeHead(200, {
          'Content-Length': test.length,
          'Content-Type': "application/json"
        });

        res.write(test);

        return res.end();
      }
    }
  };

  module.exports = function (req, res, next) {
    for(var route in api.routes) {
      if(new RegExp("/api/1/" + route).test(req.url)) {
        api.routes[route](req, res, next);

        return; // we'll let the route take it from here
      }
    }

    // there were no matches
    next();
  };

}).call(this);