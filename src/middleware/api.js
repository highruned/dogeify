(function () {

  /*
  Doge API 1.0

  Overview
    Follows the RESTful philosophy. CRUD operations. 
    C = Create (POST). R = Read (GET). U = Update (PUT). D = Delete (DELETE).
  ----------------
  R /api/v1/go
  R /api/v1/sites/top
  R /api/v1/users/top


  GET /api/v1/go
  ----------------

  GET /api/v1/sites/top
  ----------------

  GET /api/v1/users/top
  ----------------

  */

  // TODO: compiling this list from route definitions would be cleaner
  var api = {
    routes: {
      get: {
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
    }
  };

  module.exports = function (req, res, next) {
    // TODO: check if it's a GET request first
    var requestType = 'get';

    for(var route in api.routes[requestType]) {
      if(new RegExp("/api/v1/" + route).test(req.url)) {
        api.routes[requestType][route](req, res, next);

        return; // we'll let the route take it from here
      }
      else if(new RegExp("/api/v1/" + route).test(req.url)) {
        api.routes[requestType][route](req, res, next);

        return; // we'll let the route take it from here
      }
    }

    // there were no matches
    next();
  };

}).call(this);