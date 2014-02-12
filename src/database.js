var pg = require('pg');

var conString = "postgres://dogeify:1234@localhost/dogeify";

var client = new pg.Client(conString);

client.connect(function(err) {
  if(err) {
    return console.error('Could not connect to Postgres', err);
  }
});


module.exports = client;