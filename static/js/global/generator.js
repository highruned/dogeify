function initDogeGenerator() {
	Doge.generator = {
		phrasesOnLoad: 1,
		phrasesPerPage: 15, // TODO: base this on the window size. one per 400x200?
		phraseDelayMin: 400,
		phraseDelayMax: 500
	};

	var params = Doge.helpers.getHashParameters();

	if(params['phrases']) {
		Doge.generator.phrases = encodeURIComponent(params['phrases']).split('%2C');
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
			"do u even mobile, doge?",
			"doges > cats",
			"so web scale",
			"is all aboot the dogeamins, baby",
			"dogeammed with luv",
			"so mystery",
			"woof!"
		];
	}

	Doge.generator.updatePhrases = function(phrases) {
		Doge.generator.phrases = phrases.split(',');

		for(var i = 0; i < Doge.generator.phrases.length; i++) {
			var str = Doge.generator.phrases[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');

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
		else if(Doge.generator.phrases.length === 1) {
			return Doge.generator.phrases[0];
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

		var div = $('<div></div>')
			.addClass('text')
			.addClass(sizes[getRandom(0, sizes.length)])
			.addClass(colors[getRandom(0, sizes.length)])
			.html(getPhrase())
			.css('left', getRandom(0, 80) + "%")
			.css('top', getRandom(0, 80) + "%")
			.appendTo('#wrapper')
			.fadeIn(200);
	}

	function getRandom(min, max) {
		return Math.floor(Math.random() * max) + min; 
	}

	jQuery(function($) {
		// generate doges on focus, and remove them on blur
		var randomTextTimeout;

		function randomText() {
			createText();

			randomTextTimeout = setTimeout(randomText, getRandom(Doge.generator.phraseDelayMin, Doge.generator.phraseDelayMax));
		}

		$('#destination')
			.bind('focus', function() {
				$('html').addClass('x--woah');

				$('.going-places > .notice').fadeIn(300);

				// create initial doges
				for(var i = 0, l = Doge.generator.phrasesOnLoad; i < l; ++i) {
					createText();
				}

				// start random texting
				randomTextTimeout = setTimeout(randomText, getRandom(Doge.generator.phraseDelayMin, Doge.generator.phraseDelayMax)); // between 500ms-2000ms
			})
			.bind('blur', function() {
				$('html').removeClass('x--woah');

				$('.going-places > .notice').fadeOut(200);

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
