jQuery(function($) {
	$('.js-toggle').click(function() {
		var $target = $($(this).attr('href'));

		if($target.is(':visible'))
			$target.slideUp(150);
		else
			$target.slideDown(150);

		return false;
	});
});