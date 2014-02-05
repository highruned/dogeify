jQuery(function($) {
    $('#destination-form').on('submit', function(e) { 
        var val = $('input').val();
        
        var match = /^((((http)(s)?):)?\/\/)?([^\/:]*):?([0-9]*)(\/?.*)/.exec(val);
        var protocol = match[3] || "http";
        var host = match[6];
        var port = match[7] ? ':' + match[7] : '';
        var path = match[8];
        var secure = protocol === "https";

        // old code checked for SSL and used doge or doges, but I don't think we need to do that?
        var newPath = protocol + '://' + host + "." + window.location.hostname + port + path; //"http://" + (secure ? "doges." : "doge.") + host + ".dogeifyit.com" + port + path;

        // first let our server know we're visiting this URL
        $.ajax({
            url: $(this).attr('action') + '?callback=?',
            dataType: 'jsonp',
            success: function() {
                window.location = newPath;
            }
        });

        return false;
    });

    $('.top-sites a').click(function() {
        $('#destination')
            .val($(this).attr('href'))
            .focus();

        $(window).scroll($('#destination').offset().top);

        return false;
    });

    var params = Doge.helpers.getHashParameters();

    if(params['referrer']) {
        $('#referrer').val('@' + params['referrer']);
    }

    $('#twitterUsername').keyup(function() {
        var twitterUsername = $(this).val().replace('@', '');

        $('#referrerUrl').val('http://dogeifyit.com/#referrer=' + twitterUsername);
    });

    // preload doge-go-woah (shown on URL input focus)
    $('<img />').attr('src', "i/doge-go-woah.png").hide().appendTo('body');
});