(function () {
  var BLACKLIST, BLACKLIST_CONTENT, Connect, FS, Http, KITTY_INDEX, LOG_FORMAT, PROXY_EXTERNAL_PORT, PROXY_PORT, PROXY_PREFIX, PROXY_SUFFIX_DOMAIN, Server, blacklist, dogeInjectorApp, getHostUtilities, gunZip, handler, insertGA, proxyRequest, randomDoge, rewriteHTML, rewriteHost, robots, setupDogeInjector, setupStatic, staticApp, stats;

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

  insertGA = require('./middleware/insertGA');

  blacklist = require('./middleware/blacklist');

  /*
  Doge Injecting Proxy


  Intro
  ----------------
  This proxy is designed to insert tags, and also rewrite links, headers, cookies, etc
  so it appears to transparently work as a man in the middle.

  The proxy is designed to run on a wildcard domain *.PROXY_SUFFIX_DOMAIN, and all links
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

  PROXY_PORT = process.env.PORT || 5000;

  PROXY_EXTERNAL_PORT = process.env.EXTERNAL_PORT || 80;

  PROXY_SUFFIX_DOMAIN = process.env.SUFFIX_DOMAIN || "dogeifyit.com";

  LOG_FORMAT = ':method :status :response-time \t:req[Host]:url :user-agent';

  PROXY_PREFIX = process.env.PREFIX_SUBDOMAIN || "doge";

  KITTY_INDEX = "" + __dirname + "/../data/doges.txt";

  BLACKLIST = ["atelierzen.canalblog.com", "www.shipleyschool.org", "www.cropscience.bayer.com", "www.bayer.com"];

  BLACKLIST_CONTENT = FS.readFileSync("" + __dirname + "/../static/404.html");

  setupDogeInjector = function () {
    var addHost, app, isHostSecure, isSecure, removeHost, _ref;
    _ref = getHostUtilities(PROXY_SUFFIX_DOMAIN, PROXY_EXTERNAL_PORT, PROXY_PREFIX), addHost = _ref[0], removeHost = _ref[1], isHostSecure = _ref[2];
    isSecure = function (req, res, next) {
      if (isHostSecure(req.headers['host'])) {
        req.secure = true;
      } else {
        req.secure = false;
      }
      return next();
    };
    app = Connect();
    app.use(Connect.logger(LOG_FORMAT)).use(stats).use(robots).use(blacklist(removeHost, BLACKLIST, BLACKLIST_CONTENT)).use(isSecure).use(insertGA()).use(randomDoge(KITTY_INDEX)).use(rewriteHTML(addHost)).use(rewriteHost(addHost, removeHost)).use(gunZip).use(proxyRequest);
    return app;
  };

  setupStatic = function () {
    var app = Connect();

    app.use(Connect.static(__dirname + "/../static", {
      maxAge: 24 * 60 * 60,
      redirect: true
    }));

    return app;
  };

  /*
  Swallow Exceptions
  */

  process.on('uncaughtException', function (err) {
    console.log("Caught exception: " + err);
    if (err.stack) return console.log(err.stack);
  });

  /*
  Setup the handler
  */

  console.log("Starting Dogeify on " + PROXY_PORT);

  dogeInjectorApp = setupDogeInjector();

  staticApp = setupStatic();

  handler = function (req, res) {
    var proxyRe;
    proxyRe = RegExp("^" + PROXY_PREFIX + "s?[.]");
    if (proxyRe.test(req.headers['host'])) {
      return dogeInjectorApp.handle(req, res);
    } else {
      return staticApp.handle(req, res);
    }
  };

  Server = Http.createServer(handler);

  Server.listen(PROXY_PORT);

}).call(this);