//var Twit = require('twit');
//var jsdom = require('jsdom');
var request = require('request');

//var T = new Twit({
//  consumer_key: 'a5hF3A1K1LFfMvL3myMUVg',
//  consumer_secret: 'N1UnMqgZw1SvpO0a83PM8xHyFmAwWWagrhn2sRuw9dI',
//  access_token: '98806106-0WndsnA3dPM61GslUrskaeUxef5ta7Mo28Ng2PFeQ',
//  access_token_secret: 'IzABlcFk0uEvCHPiVkevUDuBg6UIL9kTuedvR5wmkZvYP'
//});

module.exports = {
	getTweets: function(username, callback) {
		var user = {
			followers_count: 0,
			statuses_count: 0
		};

		var tweets = [];

		var twitterFeed = "https://twitter.com/" + username;

		request({ uri: twitterFeed }, function (err, response, body) {
			if (err && response.statusCode !== 200) {
				callback && callback("Error when contacting: " + twitterFeed);
				return;
			}

			if(body.indexOf("Sorry, that page doesn’t exist!") !== -1 || body.indexOf("Welcome to Twitter") !== -1) {
				callback && callback("Problem occurred getting the timeline for: " + username);
				return;
			}

			user.followers_count = parseInt(/Followers<strong title=\"([^\"]+)\"/gi.exec(body)[1]);
			user.statuses_count = parseInt(/Tweets<strong title=\"([^\"]+)\"/gi.exec(body)[1]);

			if(body.indexOf("hasn't tweeted yet") !== -1) {

			}
			else {
				var tweetsRegex = /<p class=\"js-tweet-text tweet-text\">(.+?)<\/p>/gi;

				while((result = tweetsRegex.exec(body))) {
					var tweet = result[1];

					tweets.push(tweet);
				}
			}
/*
			jsdom.env({
				html: body,
				scripts: [
					'http://code.jquery.com/jquery.js'
				],
				done: function (err, window) {
	    			var $ = window.$;

	    			if($('.body-content > h1:contains(Sorry)').length) {
						callback && callback("Problem occurred getting the timeline for: " + username);
	    				return;
	    			}

					var followers_count = $('[data-element-term="follower_stats"] strong').text();
					var statuses_count = $('[data-element-term="tweet_stats"] strong').text();

					var $tweets = $('.tweet-text');
					var tweets = [];

					$tweets.each(function() {
						var tweet = {text: $(this).text()};

						tweets.push(tweet);
					});

					var user = {
						followers_count: followers_count,
						statuses_count: statuses_count
					};
					
					callback && callback(null, {user: user, tweets: tweets});
				}
			});
*/
			
			callback && callback(null, {user: user, tweets: tweets});

		});
	}/*,
	getTweetsOld: function(username, callback) {
		
		T.get('statuses/user_timeline', { screen_name: username, count: 10 }, function(err, tweets) {
			if(err) {
				callback && callback(err);
				return;
			}

			var user;

			// find the user's information
			for(var i = 0, l = tweets.length; i < l; ++i) {
				var status = tweets[i];

				if(status.user.screen_name == username) {
					user = status.user;
					break;
				}
			}

			callback && callback(err, {user: user, tweets: tweets});
		});
		
	}*/
};