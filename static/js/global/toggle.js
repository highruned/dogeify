jQuery(function($) {
	$('.js-toggle').click(function() {
		var $target = $($(this).attr('href'));

		if($target.is(':visible')) {
			$('html').removeClass('x--woah');

			$target.slideUp(150);
		}
		else {
			$('html').addClass('x--woah');

			$target.slideDown(150);

            $target[0].scrollIntoView(true);
		}

		return false;
	});
});