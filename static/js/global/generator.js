window.Doge = {};

function initDogeGenerator() {
	Doge.generator = {
		phrasesOnLoad: 1,
		phrasesPerPage: 15 // TODO: base this on the window size. one per 400x200?
	};

	var vars = {};
	var hrefParts = window.location.href.split('?');
	var phrases;

	if(hrefParts[1]) {
		$.each(hrefParts[1].split('&'), function(i, v) {
			v = v.split('=');
			vars[v[0]] = v[1];
		});

		Doge.generator.phrases = decodeURIComponent(vars.w).replace(/\+/g, ' ').split(',');
	} 
	else {
		Doge.generator.phrases = [
			"wow", 
			"much cool", 
			"lel", 
			"such hussle", 
			"very mobify", 
			"diggity doge doge", 
			"srs web", 
			"such speed wow",
			"do u even mobile?",
			"doges > cats",
			"is all aboot the dogeamins, baby",
			"so mystery",
			"woof!"
		];
	}

	Doge.generator.updatePhrases = function(phrases) {
		Doge.generator.phrases = phrases.split(',');

		var str;

		for(var i = 0; i < Doge.generator.phrases.length; i++) {
			str = Doge.generator.phrases[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');

			if(str == '') {
				Doge.generator.phrases.splice(i, 1);
				i--;
			} 
			else {
				Doge.generator.phrases[i] = str;
			}
		}

		Doge.generator.resetWords();
	};

	Doge.generator.resetWords = function() {
		$('.text').remove();

		for(var i = 0, l = Doge.generator.phrasesOnLoad; i < l; ++i) {
			createText();
		}
	}
}

function initBackground() {
	var colors = ["red", "green", "blue", "yellow", "magenta", "cyan"];
	var sizes = ["small", "medium", "big"];
	var currentPhrase;

	// get a different phrase each time
	function getPhrase() {
		if(!Doge.generator.phrases.length) { 
			return "wow"; 
		}

		var newPhrase = currentPhrase;

		while(newPhrase === currentPhrase) {
			var i = Math.floor(Math.random() * Doge.generator.phrases.length);

			newPhrase = Doge.generator.phrases[i];
		}

		currentPhrase = newPhrase;

		return currentPhrase;
	}

	function createText() {
		var text = $('.text');

		if(text.length > Doge.generator.phrasesPerPage) {
			text.first().fadeOut(200, function() {
				$(this).remove();
			});
		}

		var div = $('<div />').addClass('text');

		div.addClass(sizes[Math.floor(Math.random() * sizes.length)]);
		div.addClass(colors[Math.floor(Math.random() * sizes.length)]);
		div.html(getPhrase());
		div.css('left', (Math.round(Math.random() * 100)) + "%");
		div.css('top', (Math.round(Math.random() * 100)) + "%");

		$('body').append(div);

		div.fadeIn(200);
	}

	function getRandomDelay() {
		return Math.floor(Math.random() * 2000) + 500; // between 500ms-2000ms
	}

	jQuery(function($) {
		// generate doges on focus, and remove them on blur
		var randomTextTimeout;

		function randomText() {
			createText();

			randomTextTimeout = setTimeout(randomText, getRandomDelay());
		}

		$('#destination')
			.bind('focus', function() {
				$('body').addClass('x--woah');

				// create initial doges
				for(var i = 0, l = Doge.generator.phrasesOnLoad; i < l; ++i) {
					createText();
				}

				// start random texting
				randomTextTimeout = setTimeout(randomText, getRandomDelay());
			})
			.bind('blur', function() {
				$('body').removeClass('x--woah');

				$('.text').fadeOut(200, function() {
					$(this).remove();
				});

				if(randomTextTimeout)
					clearTimeout(randomTextTimeout);
			});
	});
}

initDogeGenerator();
initBackground();
