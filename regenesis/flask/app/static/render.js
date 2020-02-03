const TOTAL_IMAGES = 6; // even numbers only
const IMG_COLS = TOTAL_IMAGES/2;
const IMG_ROWS = 2;
const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 768;
const PADDING_HORIZ = 30;
const PADDING_VERT = 30;
const IMG_WIDTH = 320;
const IMG_HEIGHT = 320;
const START_LEFT = (DISPLAY_WIDTH - ((IMG_COLS * IMG_WIDTH) + ((IMG_COLS-1) * PADDING_HORIZ))) / 2;
const START_TOP = (DISPLAY_HEIGHT - ((IMG_ROWS * IMG_HEIGHT) + ((IMG_ROWS-1) * PADDING_VERT))) / 2;

const FADE_TIME = 5000;
const MIN_DISPLAY_TIME = 10000;
const WAIT_TIME = 3000;
let displayOrder = [];

// Loader state
let appState = "INTRO";
let loaderState = "WAIT";
let lastLoaderStateStart = new Date();
let targetSlot = -1;
let lastDisplayStartTime = new Date() - MIN_DISPLAY_TIME;
let seeds = [];

// Audio
let mic, fft;

// Image display states
const images = [];
for (let j=0; j < IMG_ROWS; j++) {
	for (let i=0; i < IMG_COLS; i++) {
		let slot = j*IMG_COLS + i;
		images[slot] = {
			state: "WAIT",
			img: null,
			nextImg: null,
			x: START_LEFT + (i * (IMG_WIDTH + PADDING_HORIZ)),
			y: START_TOP + (j * (IMG_HEIGHT + PADDING_VERT)),
			start: new Date()
		}
	}
}

function setup() {

	createCanvas(1280, 768);
	frameRate(30);
	background(0);

	textFont('Georgia');
	textSize(80);
	textAlign(CENTER);
	
	mic = new p5.AudioIn();
	mic.start();
	fft = new p5.FFT();
	fft.setInput(mic);
}

function draw() {


	if (appState == 'INTRO') {
		fill(255);
		text('Regenesis', DISPLAY_WIDTH/2, DISPLAY_HEIGHT/2);
		return;
	} else if (appState == "INTRO_CLEAR") {
		background(0);
		appState = "RUNNING";
	}

	// Load generated images into the back buffer for each slot
	switch (loaderState) {

		// Wait until an image slot becomes available		
		case "WAIT":
			targetSlot = -1;
			for (let i=0; i < images.length; i++) {
				if (!images[i].nextImg) {
					targetSlot = i;
					setLoaderState("LOAD");
					break;
				}
			}
			break;
			
		case "LOAD":
			setLoaderState("LOADING");
			loadImage('/genImage?seed=' + getSeed(),
				img => {
			    	images[targetSlot].nextImg = img;
			    	console.log("loaded next image for slot " + targetSlot);
			    	targetSlot = -1;
			    	setLoaderState("WAIT");
				},
				error => {
					console.log("failed to load image");
			    	setLoaderState("WAIT");
				}
			);
			break;
			
	}
	
	const now = new Date();
	
	// Activate new image
	if ((now - lastDisplayStartTime) > WAIT_TIME) {		
		
		// First try and take an empty slot, but use a random starting index
		const startIdx = getRandomInt(0, images.length);
		for (let i=0; i < images.length; i++) {
			const idx = (startIdx + i) % images.length;
			if (images[idx].nextImg && 
				(images[idx].state === "WAIT" || (images[idx].state === "DISPLAY" && ((now - images[idx].start) > MIN_DISPLAY_TIME)))) {

				images[idx].state = "FADE";
				images[idx].start = new Date();
				lastDisplayStartTime = now;
				break;
			}
		}
	}
	
	for (let i=0; i < images.length; i++) 
	{

		// Render
		if (images[i].nextImg || images[i].img) {

			let elapsed = now - images[i].start;
		
			if (images[i].state === "FADE") {
				if (elapsed > FADE_TIME) {
					images[i].state = "DISPLAY";
					images[i].start = now;
					images[i].img = images[i].nextImg;
					images[i].nextImg = null;
				} else {

					if (images[i].img) {
						let fadeAmount = 255 - Math.round(255 * (elapsed / FADE_TIME));
						fadeAmount = fadeAmount > 255 ? 255 : (fadeAmount < 0 ? 0 : fadeAmount);
						tint(fadeAmount, fadeAmount, fadeAmount);
						image(images[i].img, images[i].x, images[i].y, IMG_WIDTH, IMG_HEIGHT);
					}

					let fadeAmount = Math.round(255 * (elapsed / FADE_TIME));
					fadeAmount = fadeAmount > 255 ? 255 : (fadeAmount < 0 ? 0 : fadeAmount);
					tint(255, fadeAmount);
					image(images[i].nextImg, images[i].x, images[i].y, IMG_WIDTH, IMG_HEIGHT);

				}
				continue;
			}
			
			if (images[i].state === "DISPLAY") {
				noTint();
				image(images[i].img, images[i].x, images[i].y, IMG_WIDTH, IMG_HEIGHT);
				continue;
			}
		}
	}


	/*
	if (getAudioContext().state == 'running') {
		let spectrum = fft.analyze();
		stroke('red');
		strokeWeight(4);
		beginShape();
	  	for (i = 0; i < spectrum.length; i++) {
	    	vertex(i, map(spectrum[i], 0, 255, 500, 0));
	  	}
	  	endShape();
  	}
	*/
}

function touchStarted() {
	if (getAudioContext().state !== 'running') {
		getAudioContext().resume();
	}
	if (appState == 'INTRO') {
		appState = 'INTRO_CLEAR';
	}
}

function getSeed() {

	let seed = -1;
	if (fft) {
		let spectrum = fft.analyze();
		seed =  hashIntArray(spectrum);
		console.log("audio-based seed = " +seed);
	}

	while (seed == -1 || seeds.includes(seed)) {
		console.log("audio-based seed not new, picking random seed");
		seed = getRandomInt(1, 999999);
	}

	seeds.push(seed);
	return seed;
}

function setLoaderState(newState) {
	loaderState = newState;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hashIntArray(a) {
	maxSeed = 999999;
	h = a.length % maxSeed;
	for (let i=0; i < a.length; i++) {
	    h = (h + a[i]) % maxSeed;
	}
	return h;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
