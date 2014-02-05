(function () {
  var url = require('url');
  
  /*
  Doge API 1.0

  Overview
    Follows the RESTful philosophy. CRUD operations. 
    C = Create (POST). R = Read (GET). U = Update (PUT). D = Delete (DELETE).
  ----------------
  R /v1/go
  R /v1/sites/top
  R /v1/users/top


  GET /v1/go
  ----------------

  GET /v1/sites/top
  ----------------

  GET /v1/users/top
  ----------------

  */

  // TODO: compiling this list from route definitions would be cleaner
  var api = {
    routes: {
      get: {
        go: function(req, res, next) {
          var data = JSON.stringify({a: '44'});

          var queryData = url.parse(req.url, true).query;
          var content = queryData.callback + '(' + data + ')';

          res.writeHead(200, {
            'Content-Length': content.length,
            'Content-Type': "application/javascript"
          });

          res.write(content);
          res.end();
        }
      }
    }
  };

  module.exports = function (req, res, next) {
    // TODO: check if it's a GET request first
    var requestType = 'get';

    for(var route in api.routes[requestType]) {
      if(new RegExp("/v1/" + route).test(req.url)) {
        api.routes[requestType][route](req, res, next);

        return; // we'll let the route take it from here
      }
      else if(new RegExp("/v1/" + route).test(req.url)) {
        api.routes[requestType][route](req, res, next);

        return; // we'll let the route take it from here
      }
    }

    // there were no matches
    next();
  };

}).call(this);