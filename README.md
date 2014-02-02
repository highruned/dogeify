Dogeify
==============

Dogeify is a Node.js super-webscale Doge-powered awesome-infused evented based streaming Doge injecting proxy server.

Think CloudFlare, but with Doge.

[Check it out live](http://www.dogeifyit.com/)


What is this?
--------------

This proxy is designed to insert tags, and also rewrite links, headers, cookies, etc
so it appears to transparently work as a man in the middle.

It also inserts Doge.

The proxy is designed to run on a wildcard domain *.SUFFIX_DOMAIN, and everything
are rewritten to match that domain.

To support HTTP and HTTPS sites, we use a prefix usually doge.* or doges.*.

It currently only supports sites running on ports :80 and :443.


Configuration
--------------

These can be set by environment variables:

*PORT*
: Port proxy listens on
Default: 5000

*EXTERNAL_PORT*
: Port proxy appears to be listening on (eg, the front-end server)
Default: 80

*SUFFIX_DOMAIN*
: Domain that is appended when rewritting links
Default: 'dogeifyit.com'

*PREFIX_SUBDOMAIN*
: The subdomain that is prefix to mark http and https sites.
Default: "cat" (which means cat.* == http, cats.* == https).

*LOG_FORMAT*
: Connect Middleware style log format
Default: ':method :status :response-time \t:req[Host]:url :user-agent'


Special Thanks
--------------

The Mobify Team:

 - @rrjamie @fractaltheory @kpeatt @shawnjan8 for Meowbify
 - @mobify whose time and money @rrjamie was wasting to write Meowbify
 - @ericmuyser for liking doges more than cats
