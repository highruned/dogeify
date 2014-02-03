Doge.helpers = {};

Doge.helpers.getHashParameters = function() {
    var params = {};

    var keyValuePairs = window.location.hash.substr(1).split('&');

    for (x in keyValuePairs) {
        var split = keyValuePairs[x].split('=', 2);
        params[split[0]] = (split[1]) ? decodeURI(split[1]) : "";
    }

    return params;
};