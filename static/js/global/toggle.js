jQuery(function($) {
	$('.js-toggle').click(function() {
		$($(this).attr('href')).toggle();
	});
});