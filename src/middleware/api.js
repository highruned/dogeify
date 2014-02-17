(function () {
  var url = require('url');
  var db = require('../database');
  var blockchain = require('../blockchain');
  var twitter = require('../twitter');
  
  /*
  Doge API 1.0

  Overview
    Follows the RESTful philosophy. CRUD operations. 
    C = Create (POST). R = Read (GET). U = Update (PUT). D = Delete (DELETE).
  ----------------
  R /v1/go
  R /v1/topSites
  R /v1/topUsers
  R /v1/verifyClaim


  GET /v1/go
  ----------------

  GET /v1/topSites
  ----------------

  GET /v1/topUsers
  ----------------

  GET /v1/verifyClaim
  ----------------

  */

  var SERVER_PORT = process.env.PORT || 5000;
  var SERVER_EXTERNAL_PORT = process.env.EXTERNAL_PORT || 80;
  var SERVER_SUFFIX_DOMAIN = process.env.SUFFIX_DOMAIN || "dogeifyit.com";
  var SERVER_PREFIX = process.env.PREFIX_SUBDOMAIN || "doge";
  var SERVER_URI = SERVER_EXTERNAL_PORT == 80 ? SERVER_SUFFIX_DOMAIN : SERVER_SUFFIX_DOMAIN + ':' + SERVER_EXTERNAL_PORT;

  var getHostUtilities = require('../utils').getHostUtilities;

  var _ref = getHostUtilities(SERVER_SUFFIX_DOMAIN, SERVER_EXTERNAL_PORT, SERVER_PREFIX), 
    addHost = _ref[0], 
    removeHost = _ref[1], 
    isHostSecure = _ref[2],
    normalizeHost = _ref[3]; // TODO: simply this

  function sendResponse(res, callback, code, message, data) {
    var data = {code: code, message: message, data: data};
    var content = callback + '(' + JSON.stringify(data) + ')';

    res.writeHead(200, {
      'Content-Length': content.length,
      'Content-Type': "application/javascript"
    });

    res.write(content);
    res.end();
  }

  var SUCCESS_CODE = 10,
    ERROR_CODE = 11;

  var UNPROCESSED_STATUS = 1,
    PROCESSING_STATUS = 2,
    PROCESSED_STATUS = 3,
    INVALID_PAYMENT_STATUS = 4;

  // TODO: compiling this list from route definitions would be cleaner
  var api = {
    routes: {
      get: {
        goDestination: function(req, res, next) {
          res.disableCache = true;

          var queryData = url.parse(req.url, true).query;

          // normalize the site URL
          var siteUrl = normalizeHost(removeHost(queryData['site']));

          if(!siteUrl) {
            console.log("Attempting to go to a blank destination");
            sendResponse(res, queryData.callback, ERROR_CODE, "Error");
            return;
          }

          // insert request into database
          db.query("UPDATE sites SET searches = searches + 1 WHERE url = $1::text", [ siteUrl ], function(err) {
            db.query("INSERT INTO sites (url) \
                SELECT $1::text \
                WHERE NOT EXISTS (SELECT 1 FROM sites WHERE url = $1::text)", [ siteUrl ], function(err) {

              sendResponse(res, queryData.callback, SUCCESS_CODE, "Success");
            });
          });
        },

        topSites: function(req, res, next) {
          var queryData = url.parse(req.url, true).query;

          // insert request into database
          db.query("SELECT url, searches, comment FROM sites ORDER BY searches DESC LIMIT 20", [], function(err, res2) {
            if(!res2) {
              console.error(err);
              sendResponse(res, queryData.callback, ERROR_CODE, "Error");
              return;
            }

            sendResponse(res, queryData.callback, SUCCESS_CODE, "Success", res2.rows);
          });
        },

        topUsers: function(req, res, next) {
          var queryData = url.parse(req.url, true).query;

          // insert request into database
          db.query("SELECT refers, twitter_username, points, has_tweeted FROM users ORDER BY points DESC LIMIT 10", [], function(err, res2) {
            if(!res2) {
              console.error(err);
              sendResponse(res, queryData.callback, ERROR_CODE, "Error");
              return;
            }

            sendResponse(res, queryData.callback, SUCCESS_CODE, "Success", res2.rows);
          });
        },

        verifyClaim: function(req, res, next) {
          res.disableCache = true;

          var queryData = url.parse(req.url, true).query;
          var twitterUsername = queryData['twitter_username'].replace('@', '');

          if(!twitterUsername) {
            console.log("Attempting to be nobody");
            sendResponse(res, queryData.callback, ERROR_CODE, "Error");
            return;
          }

          db.query("INSERT INTO users (twitter_username) \
              SELECT $1::text \
              WHERE NOT EXISTS (SELECT 1 FROM users WHERE twitter_username = $1::text)", [ twitterUsername ], function(err, data) {
            if(err) {
              console.error(err);
              sendResponse(res, queryData.callback, ERROR_CODE, "Error");
              return;
            }

            db.query("SELECT id FROM users WHERE twitter_username = $1::text", [ twitterUsername ], function(err, data) {
              if(err) {
                console.error(err);
                sendResponse(res, queryData.callback, ERROR_CODE, "Error");
                return;
              }

              var userId = data.rows[0].id;

              // insert user into database if it doesn't exist
              db.query("SELECT id FROM payments WHERE user_id = $1::int", [ userId ], function(err, data) {
                if(err) {
                  console.error(err);
                  sendResponse(res, queryData.callback, ERROR_CODE, "Error");
                  return;
                }

                // throw an error if a payment already exists
                if(data.rows.length) {
                  console.log("User trying to claim more than once.");
                  sendResponse(res, queryData.callback, ERROR_CODE, "error: dogecoin, you already haz it!");
                  return;
                }

                var dogecoinAddress = queryData['dogecoin_address'];
                var referrerUsername = queryData['referrer_username'].replace('@', '');
                var amount = Math.floor(Math.random() * 10)+5; // number between 5 and 10

                db.query("INSERT INTO payments (user_id, type, address, amount) \
                    SELECT $1::int, $2::text, $3::text, $4::int \
                    WHERE NOT EXISTS (SELECT 1 FROM payments WHERE user_id = $1::int)", [ userId, 'DOGE', dogecoinAddress, amount ], function(err) {
                  if(err) {
                    console.error(err);
                    sendResponse(res, queryData.callback, ERROR_CODE, "Error");
                    return;
                  }

                  sendResponse(res, queryData.callback, SUCCESS_CODE, 'wow! great success! dogecoin, you will haz it!');

                  if(!referrerUsername) {
                    return;
                  }

                  // update referrer refers or insert referrer into database
                  db.query("INSERT INTO users (twitter_username) \
                    SELECT $1::text \
                    WHERE NOT EXISTS (SELECT 1 FROM users WHERE twitter_username = $1::text)", [ referrerUsername ], function(err) {

                    db.query("UPDATE users SET refers = refers + 1 WHERE twitter_username = $1::text", [ referrerUsername ], function(err) {
                      
                    });
                  });
                });
              });
            });
          });
        }
      }
    }
  };

  function processPayments() {
    console.log("Processing payments");

    db.query("SELECT id, user_id, type, address, amount FROM payments WHERE status in($1::int, $2::int) AND (updated_at IS NULL OR updated_at < current_timestamp - interval '5 seconds') LIMIT 1", [ UNPROCESSED_STATUS, INVALID_PAYMENT_STATUS ], function(err, data) {
      if(err) {
        console.error(err);
        setTimeout(processPayments, 1 * 1000); // go again
        return;
      }

      // if we don't have any pending payments go again in a second
      if(!data.rows.length) {
        console.log("No payments to process");
        setTimeout(processPayments, 1 * 1000);
        return;
      }

      var payment = data.rows[0];

      db.query('SELECT twitter_username FROM users WHERE id = $1::int', [ payment.user_id ], function(err, data) {
        if(err) {
          console.error(err);
          db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
          setTimeout(processPayments, 1 * 1000); // go again
          return;
        }

        if(!data.rows.length) {
          console.log("Cannot find associated user for payment");
          db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
          setTimeout(processPayments, 1 * 1000);
          return;
        }

        var twitterUsername = data.rows[0].twitter_username;

        twitter.getTweets(twitterUsername, function(err, data) {
          if(err) {
            console.error(err);
            db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
            setTimeout(processPayments, 1 * 1000); // go again
            return;
          }

          if(data.user.followers_count <= 1 || data.user.statuses_count <= 3) {
            console.log("User doesn't have a sufficient account to receive payment: " + twitterUsername);
            setTimeout(processPayments, 1 * 1000); // go again
            db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
            return;
          }

          var referrer = data.referrer;
          var hasTweeted = false;

          for(var i = 0, l = data.tweets.length; i < l; ++i) {
            var tweet = data.tweets[i];

            if(tweet.indexOf('dogeifyit.com') !== -1) { // test @ericmuyser with cropp.com, live should be dogeifyit.com
              hasTweeted = true;
            }
          }

          if(!hasTweeted) {
            console.log("User has not tweeted so they cannot receive payment: " + twitterUsername);
            db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
            setTimeout(processPayments, 1 * 1000); // go again
            return;
          }

          console.log("Paying: " + twitterUsername + " at address: " + payment.address);

          db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ PROCESSING_STATUS, payment.id ]);

          blockchain.withdraw(payment.amount, payment.address, function(err, data) {
            if(err) {
              console.error(err);
              db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ INVALID_PAYMENT_STATUS, payment.id ]);
              setTimeout(processPayments, 1 * 1000); // go again
              return;
            }

            db.query("UPDATE payments SET transaction_hash = $1::text WHERE id = $2::int", [ data.replace('"', ''), payment.id ]);

            db.query("UPDATE users SET points = points + 1 WHERE id = $1::int", [ payment.user_id ]);

            // give credit to the referrer
            if(referrer) {
              db.query("UPDATE users SET refers = refers + 1 WHERE twitter_username = $1::int", [ referrer ]);
            }

            db.query("UPDATE payments SET status = $1::int WHERE id = $2::int", [ PROCESSED_STATUS, payment.id ], function() {
              // process another payment in a second
              setTimeout(processPayments, 1 * 1000);
            });
          });
        });
      });
    });
  }

  setTimeout(processPayments, 1 * 1000);

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