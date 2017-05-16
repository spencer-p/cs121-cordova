
var app = function() {

    var self = {};
    self.is_configured = false;

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        v.map(function(e) {e._idx = k++;});
    };

    // Initializes an attribute of an array of objects.
    var set_array_attribute = function (v, attr, x) {
        v.map(function (e) {e[attr] = x;});
    };

    self.initialize = function () {
        document.addEventListener('deviceready', self.ondeviceready, false);
    };

    self.ondeviceready = function () {
        // This callback is called once Cordova has finished
        // its own initialization.
        console.log("The device is ready");
        $("#vue-div").show(); // This is jQuery.
        self.is_configured = true;
    };

    self.reset = function () {
        self.vue.board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
		self.emptypos = { x: 3, y: 3 };
    };

    self.shuffle = function(i, j) {
		// Do nothing if out of bounds
		if (i < 0 || i > 3 || j < 0 || j > 3) {
			return false;
		}
		
		// If dx is 1 and dy is 0 or other way around
		if ((Math.abs(self.emptypos.x-i) == 1
			&& Math.abs(self.emptypos.y-j) == 0)
			|| (Math.abs(self.emptypos.x-i) == 0
			&& Math.abs(self.emptypos.y-j) == 1)) {

			// valid move
			console.log("Shuffle: " + i + ", " + j);

			// Set empty pos to the number
			self.vue.board.splice(self.emptypos.x*4 + self.emptypos.y,
				1, self.vue.board[4*i+j]);

			// Set the num to empty
			self.vue.board.splice(4*i+j, 1, 0);

			// Set empty pos
			self.emptypos.x = i;
			self.emptypos.y = j;
			
			// Success
			return true;
		}
		
		// No move
		return false;
	};

	self.deltaPositionInBounds = function (x, y) {
		var i = x + self.emptypos.x;
		var j = y + self.emptypos.y;
		return (i >= 0 && i <= 3 && j >= 0 && j <= 3)
	}

	// Find number of inversions
	self.countInversions = function(array) {
		var count = 0;
		for (var i = 0; i < array.length; i++) {
			var current = array[i];
			for (var j = i+1; j < array.length; j++) {
				if (array[j] < current && array[j] != 0) {
					count++;
				}
			}
		}
		return count;
	}

	// Returns x, y of empty space
	self.indexEmpty = function(array) {
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (array[4*i+j] === 0) {
					return {x: j, y: i};
				}
			}
		}
	}

	// solvable if:
	// - blank is on even row and inversions is odd
	// - blank is on odd row and inversions is even
	self.isSolvable = function(array) {
		var empty = self.indexEmpty(array);
		var inversions = self.countInversions(array);
		return (empty.y%2 !== inversions%2);
	}

	// shuffle from stackoverflow
	self.shuffleArray = function (array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

	// Polite scramble makes arrays and checks solvability
	self.scramble = function() {

		// Shuffle until is solvable
		var newArray;
		do {
			newArray = self.shuffleArray(self.vue.board);
		} while (!self.isSolvable(newArray));

		// Copy array to make vue update
		for (var i = 0; i < newArray.length; i++) {
			self.vue.board.splice(i, 1, newArray[i]);
		}
		
		// Set empty pos
		self.emptypos = self.indexEmpty(newArray);

	}

	// Fun scramble. Animates random movements.
	self.animatedScramble = function() {
		
		// Four different DIRSlacements we can go (in order: N, W, S, E)
		var DIRS = [[ 0, 1 ],[1, 0],[0, -1],[-1, 0]]
		
		// Timeout before next
		var TIMEOUT = 100; // in milliseconds
		var CHANCEOFCHANGE = 1/2;
		var NUMMOVES = 32;

		// Recursive functions scrambles, then calls self
		// dir is direction, n is loop counter, max is the max number of loops
		var scrambleOnce = function (dirnumber, n, max) {
			// Base case, stop scrambling if we hit the max
			if (n > max) {
				return;
			}

			// Choose a dir if unspecified
			if (dirnumber === null) {
				dirnumber = Math.floor(Math.random()*DIRS.length)
			}

			// Swap in direction
			var success = self.shuffle(self.emptypos.x+DIRS[dirnumber][0],
					self.emptypos.y+DIRS[dirnumber][1]);

			// Choose new dir if failed or random chance
			// This block of code is unfortunately dense. In short, it turns
			// by 90 degrees and tries to avoid 180s.
			if (!success || Math.random() < CHANCEOFCHANGE) {
				// newdir will eventually be our new dir. we'll modify it in
				// relation to dirnumber.
				var newdir = dirnumber;

				// Loop makes sure the new position is valid before exiting.
				do {

					// 50/50 move left or right in array
					if (Math.random() > 0.5) {
						// Subtract one and wrap to max.
						newdir = dirnumber-1;
						if (newdir < 0) {
							newdir = DIRS.length-1;
						}
					}
					else {
						// add and wrap
						newdir = (dirnumber+1)%DIRS.length;
					}

				} while (!self.deltaPositionInBounds(DIRS[newdir][0], DIRS[newdir][1]));

				// Success. Assign new direction and move on.
				dirnumber = newdir;
			}

			// Do another move
			if (success) {
				// If the last move was successful, we wait for the next one
				// to give the appearance of an animation.
				setTimeout(scrambleOnce, TIMEOUT, dirnumber, n+1, max);
			}
			else {
				// If the last move failed, just try again immediately
				scrambleOnce(dirnumber, n, max);
			}
		}

		// Start the scramble
		scrambleOnce(null, 1, NUMMOVES);

    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            board: []
        },
        methods: {
            reset: self.reset,
            shuffle: self.shuffle,
            scramble: self.scramble,
            animatedScramble: self.animatedScramble
        }

    });

    self.reset();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});
