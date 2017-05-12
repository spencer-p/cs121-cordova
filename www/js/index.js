
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

    self.scramble = function() {
		
		// Four different DIRSlacements we can go (in order: N, W, S, E)
		var DIRS = [[ 0, 1 ],[1, 0],[0, -1],[-1, 0]]
		
		// Timeout before next
		var TIMEOUT = 250; // 1/4rd of a second
		var CHANCEOFCHANGE = 1/2;

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
			console.log(dirnumber);

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
		scrambleOnce(null, 1, 32);

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
            scramble: self.scramble
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
