var request = require('request');

module.exports = {
	createTransaction: function() {
		return {};
	},
	sendTransaction: function(transaction) {

	},
	withdraw: function(amount, paymentAddress, callback) {
		var url = "https://www.dogeapi.com/wow/?api_key=API_KEY&a=withdraw&amount=" + amount + "&payment_address=" + paymentAddress;

		request({ uri: url }, function (err, response, body) {
			if (err && response.statusCode !== 200) {
				callback && callback("Error when contacting: " + url);
				return;
			}

			if(body.indexOf("Unauthorized") !== -1) {
				callback && callback("Unauthorized error when contacting: " + url);
				return;
			}

			callback && callback(null, body);
		});
	}
};