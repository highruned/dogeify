(function () {
  var BLACKLIST, BLACKLIST_CONTENT, Connect, FS, Http, DOGE_INDEX, LOG_FORMAT, Server, blacklist, getHostUtilities, gunZip, handler, insertGA, proxyRequest, randomDoge, rewriteHTML, rewriteHost, robots, setupInjector, setupStatic, staticApp, stats;

  Http = require('http');

  FS = require('fs');

  Connect = require('connect');

  getHostUtilities = require('./utils').getHostUtilities;

  stats = require('./middleware/stats');

  rewriteHTML = require('./middleware/rewriteHTML');

  randomDoge = require('./middleware/randomDoge');

  rewriteHost = require('./middleware/rewriteHost');

  gunZip = require('./middleware/gzip').gunZip;

  proxyRequest = require('./middleware/proxyRequest');

  robots = require('./middleware/robots');

  var memcache = require('./middleware/memcache');

  insertGA = require('./middleware/insertGA');

  blacklist = require('./middleware/blacklist');

  api = require('./middleware/api');

  /*
  Doge Injecting Proxy


  Intro
  ----------------
  This proxy is designed to insert tags, and also rewrite links, headers, cookies, etc
  so it appears to transparently work as a man in the middle.

  The proxy is designed to run on a wildcard domain *.SERVER_SUFFIX_DOMAIN, and all links
  are rewritten to match that domain.

  To support HTTP and HTTPS sites, we use a prefix.

  It currently only support sites running on ports :80 and :443.

  Structure
  -----------------

  The proxy is setup as series of connect middleware, which rewrite various parts
  of the site:

  1. Logging:

      Connect.logger(LOG_FORMAT)

  2. Block Crawlers:

      robots

  3. Marks whether it is secure or not (based on prefix):

      isSecure

  4. Replace the images with Doge Images:

      randomDoge()

  5. Rewrite the links, src, images, in the page:

      rewriteHTML(addHost)

  6. Rewrite the headers (Host, Cookie, etc) to what the Origin/Browser expects (and vice versa)

      rewriteHost(addHost, removeHost)

  7. Unzip responses from the Origin

      gunZip

  8. Repeat the (now modified) request against the 

      proxyRequest


  This is a little bit of an abuse of the middleware pattern, but it was
  fun to implement.


  Configuration
  -----------------
  These can be set by environment variables


  PORT
  : Port proxy listens on
  Default: 5000

  EXTERNAL_PORT
  : Port proxy appears to be listening on (eg, the front-end server)
  Default: 80

  SUFFIX_DOMAIN
  : Domain that is appended when rewritting links
  Default: 'dogeifyit.com'

  PREFIX_SUBDOMAIN
  : The subdomain that is prefix to mark http and https sites.
  Default: "doge" (which means doge.* == http, doges.* == https).

  : Path (

  LOG_FORMAT
  : Connect Middleware style log format
  Default: ':method :status :response-time \t:req[Host]:url :user-agent'
  */

  var SERVER_PORT = process.env.PORT || 5000;
  var SERVER_EXTERNAL_PORT = process.env.EXTERNAL_PORT || 80;
  var SERVER_SUFFIX_DOMAIN = process.env.SUFFIX_DOMAIN || "dogeifyit.com";
  var SERVER_PREFIX = process.env.PREFIX_SUBDOMAIN || "doge";
  var SERVER_URI = SERVER_EXTERNAL_PORT == 80 ? SERVER_SUFFIX_DOMAIN : SERVER_SUFFIX_DOMAIN + ':' + SERVER_EXTERNAL_PORT;

  LOG_FORMAT = ':method :status :response-time \t:req[Host]:url :user-agent';


  DOGE_INDEX = "" + __dirname + "/../data/doges.txt";

  BLACKLIST = ["atelierzen.canalblog.com", "www.shipleyschool.org", "www.cropscience.bayer.com", "www.bayer.com"];

  BLACKLIST_CONTENT = FS.readFileSync("" + __dirname + "/../static/404.html");

  setupInjector = function () {
    var addHost, app, isHostSecure, isSecure, removeHost, _ref;

    _ref = getHostUtilities(SERVER_SUFFIX_DOMAIN, SERVER_EXTERNAL_PORT, SERVER_PREFIX), 
    addHost = _ref[0], 
    removeHost = _ref[1], 
    isHostSecure = _ref[2],
    normalizeHost = _ref[3]; // TODO: simply this
    
    isSecure = function (req, res, next) {
      if (isHostSecure(req.headers['host'])) {
        req.secure = true;
      } 
      else {
        req.secure = false;
      }

      next();
    };

    app = Connect()
      .use(function(req, res, next) {
          // if the request is for our top level domain, let's look for static files
          if(req.headers['host'] === SERVER_URI) {
            Connect.static(__dirname + "/../static", {
              maxAge: 24 * 60 * 60,
              redirect: true
            })(req, res, next);
          }
          // or if it's for our API
          else if(req.headers['host'] === 'api.' + SERVER_SUFFIX_DOMAIN + (SERVER_EXTERNAL_PORT == 80 ? '' : ':' + SERVER_EXTERNAL_PORT)) {
            memcache(req, res, next);
            api(req, res, next);
          }
          // otherwise let's continue proxying this shi-
          else {
            next();
          }
      })
      .use(memcache)
      .use(Connect.logger(LOG_FORMAT))
      .use(stats)
      .use(robots)
      .use(api)
      .use(blacklist(removeHost, BLACKLIST, BLACKLIST_CONTENT))
      .use(isSecure)
      .use(insertGA())
      .use(randomDoge(DOGE_INDEX))
      .use(rewriteHTML(addHost))
      .use(rewriteHost(addHost, removeHost))
      .use(gunZip)
      .use(proxyRequest);

    return app;
  };

  /*
  Swallow Exceptions
  */

  process.on('uncaughtException', function (err) {
    console.log("Caught exception: " + err);

    if (err.stack) 
      console.log(err.stack);
  });

  /*
  Setup the handler
  */

  console.log("Starting Dogeify on " + SERVER_PORT);

  var injectorApp = setupInjector();

  Server = Http.createServer(function (req, res) {
    injectorApp.handle(req, res);
  });

  Server.listen(SERVER_PORT);

}).call(this);