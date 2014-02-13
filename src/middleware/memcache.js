var url = require('url');
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211');

module.exports = function (req, res, next) {
  var parts = url.parse(req.url, true);

  //delete parts.query.callback; // we don't want to cache the random `callback` param appended by jQuery
  
  // we don't want the queries
  delete parts.query; 
  delete parts.search;

  parts.path = parts.pathname;
  parts.href = parts.pathname;

  var key = (req.secure ? 'https' : 'http') + "://" + req.headers.host + url.format(parts);

  var response = "";

  var writeOld = res.write;
  var endOld = res.end;

  res.write = function() {
    if(!res.disableCache) {
      response += arguments[0];
    }
    
    writeOld.apply(this, arguments);
  };

  res.end = function() {
    if(!res.disableCache) {
      if(typeof arguments[0] !== 'undefined')
        response += arguments[0];
    }

    endOld.apply(this, arguments);
  };

  res.on('finish', function() {
    if(!res.disableCache) {
      var lifetime = 5 * 60; // 5 minutes

      memcached.set(key, response, lifetime, function(err, result) {
        if(err) {
          console.error(err);
        }

        console.dir(result);
      });
    }
  });

  next();
};