jQuery(function($) {
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
            var site = protocol + '://' + host + '.' + window.location.hostname + port + path; 

            // first let our server know we're visiting this URL
            $.ajax({
                url: 'http://api.dogeifyit.com.local:5000/v1/go?site=' + site + '&callback=?',
                dataType: 'jsonp',
                success: function() {
                    //window.location = site;
                }
            });

            window.open(site);

            return false;
        });
    }

    function initReferrerFeature() {
        var params = Doge.helpers.getHashParameters();

        if(params['referrer']) {
            $('#referrer').val('@' + params['referrer']);
        }

        $('#twitterUsername').keyup(function() {
            var twitterUsername = $(this).val().replace('@', '');

            $('#referrerUrl').val('http://dogeifyit.com/#referrer=' + twitterUsername);
        });

        $('#claim-form').submit(function(e) {
            var data = $(this).serialize();

            $.ajax({
                url: 'http://api.dogeifyit.com.local:5000/v1/verifyClaim?' + data + '&callback=?',
                dataType: 'jsonp',
                success: function(res) {
                    $('#claim-form .notice').html(res.message).show();
                }
            });

            e.preventDefault();
        });
    }

    function refreshTopSites() {
        $.ajax({
            url: 'http://api.dogeifyit.com.local:5000/v1/topSites?callback=?',
            dataType: 'jsonp',
            success: function(res) {
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
                                    <td class="url"><a href="' + Doge.helpers.dogeifyHost(site.url) + '">' + site.url + '</a></td> \
                                    <td>' + site.comment + '</td> \
                                    <td><a class="btn btn-go" href="' + Doge.helpers.dogeifyHost(site.url) + '">Go</a></td> \
                                </tr>');

                    $table.find('tbody').append($tr);
                });
            }
        });
    }

    function refreshTopUsers() {
        $.ajax({
            url: 'http://api.dogeifyit.com.local:5000/v1/topUsers?callback=?',
            dataType: 'jsonp',
            success: function(res) {
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
            }
        });
    }

    function initTopSites() {
        refreshTopSites();

        $('.top-sites').on('a', 'click', function() {
            $('#destination')
                .val($(this).attr('href'))
                .focus();

            $(window).scroll($('#destination').offset().top);

            return false;
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