jQuery(function($) {
    window.goDestination_callback = function(res) {

    };

    function initDestinationForm() {
        $('#destination-form').on('submit', function(e) { 
            var val = $('input').val();
            
            var match = /^((((http)(s)?):)?\/\/)?([^\/:]*):?([0-9]*)(\/?.*)/.exec(val);
            var protocol = match[3] || 'http';
            var host = match[6];
            var port = match[7] ? ':' + match[7] : '';
            var path = match[8];
            var secure = protocol === 'https';

            // old code checked for SSL and used doge or doges, but I don't think we need to do that?
            var site = Doge.helpers.dogeifyHost(host); 

            // first let our server know we're visiting this URL
            $.ajax({
                url: Doge.api.endpoint + 'goDestination?site=' + site + '&callback=?',
                dataType: 'jsonp',
                jsonpCallback: 'goDestination_callback'
            });

            window.open(site);

            return false;
        });
    }

    window.verifyClaim_callback = function(res) {
        $('#claim-form .notice').html(res.message).show();
    };

    function initReferrerFeature() {
        var params = Doge.helpers.getHashParameters();

        if(params['referrer']) {
            $('#referrer').val('@' + params['referrer']);
        }

        $('#twitterUsername').keyup(function() {
            var twitterUsername = $(this).val().replace('@', '');

            $('#referrerUrl').val('http://' + Doge.uri + '/#referrer=' + twitterUsername);
        });

        $('#claim-form').submit(function(e) {
            var data = $(this).serialize();

            $.ajax({
                url: Doge.api.endpoint + 'verifyClaim?' + data + '&callback=?',
                dataType: 'jsonp',
                jsonpCallback: 'verifyClaim_callback'
            });

            e.preventDefault();
        });
    }

    window.refreshTopSites_callback = function(res) {
        if(res.code != 10) {
            alert("An error occurred: " + res.message + "(" + res.code + ")");
            return;
        }

        var sites = res.data;
        var $table = $('.top-sites table');

        $table.find('tbody tr').remove();

        $(sites).each(function(i, site) {
            var $tr = $('<tr> \
                            <td>' + (i + 1) + '</td> \
                            <td class="url"><a href="' + site.url + '">' + site.url + '</a></td> \
                            <td>' + (site.comment ? site.comment : '') + '</td> \
                            <td><a class="btn btn-go" href="' + site.url + '">Go</a></td> \
                        </tr>');

            $table.find('tbody').append($tr);
        });

        $('.top-sites a').bind('click', function(e) {
            $('#destination')
                .val($(this).attr('href'))
                .focus();

            $(window).scroll($('#destination').offset().top);

            e.preventDefault();
        });
    };

    function refreshTopSites() {
        $('.top-sites a').unbind('click');

        $.ajax({
            url: Doge.api.endpoint + 'topSites?callback=?',
            dataType: 'jsonp',
            jsonpCallback: 'refreshTopSites_callback'
        });
    }

    function initTopSites() {
        refreshTopSites();
    }

    window.refreshTopUsers_callback = function(res) {
        if(res.code != 10) {
            alert("An error occurred: " + res.message + "(" + res.code + ")");
            return;
        }

        var sites = res.data;
        var $table = $('.top-doges table');

        $table.find('tbody tr').remove();

        $(sites).each(function(i, user) {
            var $tr = $('<tr> \
                            <td>' + (i + 1) + '</td> \
                            <td class="username"><a href="http://twitter.com/' + user.twitter_username + '">@' + user.twitter_username + '</a></td> \
                            <td>' + user.points + ' points (' + (user.has_tweeted ? 'tweeted + ' : '') + ' ' + user.refers + ' referred)</td> \
                            <td><a class="btn btn-go" href="http://twitter.com/' + user.twitter_username + '" target="_blank">Stalk</a></td> \
                        </tr>');

            $table.find('tbody').append($tr);
        });
    };

    function refreshTopUsers() {
        $.ajax({
            url: Doge.api.endpoint + 'topUsers?callback=?',
            dataType: 'jsonp',
            jsonpCallback: 'refreshTopUsers_callback'
        });
    }

    function initTopUsers() {
        refreshTopUsers();
    }

    initDestinationForm();
    initReferrerFeature();
    initTopSites();
    initTopUsers();
});