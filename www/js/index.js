
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

    self.scramble = function() {
		
		// Four different displacements we can go (in order: N, W, E, S)
		var DISP = [[ 0, 1 ],[1, 0],[-1, 0],[0, -1]]
		
		// Timeout before next
		var TIMEOUT = 333; // 1/3rd of a second

		// Recursive functions scrambles, then calls self
		// n is loop counter, max is the max number of loops
		var scrambleOnce = function (n, max) {
			// Base case, stop scrambling if we hit the max
			if (n > max) {
				return;
			}

			// Swap in random direction
			var dir = DISP[Math.floor(Math.random()*DISP.length)]
			var success = self.shuffle(self.emptypos.x+dir[0],
					self.emptypos.y+dir[1]);

			// If this move failed, do another immediately
			var timeToNext = success ? TIMEOUT : 0;

			// Do another move after timeout above. Only increments n if
			// this move succeeded.
			setTimeout(scrambleOnce, timeToNext, n+(success?1:0), max);
		}

		// Start the scramble
		scrambleOnce(1, 16);

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
