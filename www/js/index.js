
var app = function() {

    var self = {};
    self.is_configured = false;

    var server_url = "https://luca-ucsc-teaching-backend.appspot.com/keystore/";
    var call_interval = 2000;

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    self.my_identity = randomString(20);
	// Function creates null board of length or 8x8
	self.null_board = function(length) {
		if (length === undefined) { 
			length = 8*8; 
		}
		var array = Array(length);
		for (var i = 0; i < length; i++) {
			array[i] = "";
		}
		return array;
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
        // This callback is called once Cordova has finished its own initialization.
        console.log("The device is ready");

        $("#vue-div").show();
        self.is_configured = true;
    };

    // This is the object that contains the information coming from the server.
    self.player_1 = null;
    self.player_2 = null;

    // This is the main control loop.
    function call_server() {
        if (self.vue.chosen_magic_word === null) {
            console.log("No magic word.");
            setTimeout(call_server, call_interval);
        } else {
            // We can do a server call.
			console.log("Calling the server");
            $.ajax({
                dataType: 'json',
                url: server_url +'read',
                data: {key: "SPJPETER"+self.vue.chosen_magic_word},
                success: self.process_server_data,
                complete: setTimeout(call_server, call_interval) // Here we go again.
            });
        }
    }

    // Main function for sending the state.
    self.send_state = function () {
        $.post(server_url + 'store',
            {
                key: "SPJPETER"+self.vue.chosen_magic_word,
                val: JSON.stringify(
                    {
                        'player_1': self.player_1,
                        'player_2': self.player_2,
                        'board_1': self.vue.board_1,
						'board_2': self.vue.board_2,
						'turn_count': self.vue.turn_count,
						'game_count': self.vue.game_count
                    }
                )
            }
        );
    };

    // Main place where we receive data and act on it.
    self.process_server_data = function (data) {

		// Check for no data
		if (!data.result) {
			self.player_1 = self.my_identity;
			self.player_2 = null;
			self.vue.board_1 = getBoard();
			self.vue.board_2 = self.null_board();
			self.vue.turn_count = 0;
			self.vue.game_count = 0;
			self.send_state();
		}
		else { // Do have data
			var answer = JSON.parse(data.result);
			if (answer.player_2 === null) {
				if (answer.player_1 === self.my_identity) {
					self.vue.status_line = "Wating for second player.";
					return;
				}
				else if (answer.player_1 === null) {
					self.vue.status_line = "Other player left. Wating for second player.";
					self.player_1 = self.my_identity;
					self.player_2 = null;
					self.vue.board_1 = getBoard();
					self.vue.board_2 = self.null_board();
					self.vue.turn_count = 0;
					self.vue.game_count = 0;
					self.vue.is_my_turn = false;
					self.send_state();
				}
				else {
					self.vue.status_line = "Joining the game.";

					// Set data and send state
					self.player_1 = answer.player_1;
					self.player_2 = self.my_identity;
					self.vue.board_1 = answer.board_1;
					self.vue.board_2 = getBoard();
					self.vue.turn_count = answer.turn_count;
					self.vue.game_count = answer.game_count;
					self.send_state();

					// Make it our turn
					self.vue.is_my_turn = true;
				}
			}
			else { // both not null
				// check if both players are already in
				if (self.player_1 !== self.my_identity && self.player_2 !== self.my_identity) {
					self.vue.status_line = "Cannot join this game, two players already present.";
					self.vue.need_new_magic_word = true;
				}
				else { // Potentially new turn data
					self.vue.status_line = "Both players present and transferring data.";
					if (answer.turn_count >= self.vue.turn_count && answer.game_count === self.vue.game_count) {

						// Swap turns
						if (answer.turn_count > self.vue.turn_count) {
							self.vue.is_my_turn = !self.vue.is_my_turn;
						}

						self.vue.turn_count = answer.turn_count;
						self.vue.board_1 = answer.board_1;
						self.vue.board_2 = answer.board_2;
						self.player_1 = answer.player_1;
						self.player_2 = answer.player_2;

						if (self.board_is_won(self.own_board())) {
							self.vue.win_line = "Sorry, you lost.";
						}

					}
					else if (answer.game_count > self.vue.game_count) {
						self.vue.status_line = "Starting a new game";
						self.vue.win_line = "";
						if (self.player_1 === self.my_identity) {
							self.vue.board_2 = answer.board_2;
							self.vue.board_1 = getBoard();
						}
						else {
							self.vue.board_1 = answer.board_1;
							self.vue.board_2 = getBoard();
						}
						self.vue.turn_count = answer.turn_count;
						self.vue.game_count = answer.game_count;
						self.send_state();

						// Make it our turn
						self.vue.is_my_turn = true;
					}
				}
			}
		}

		/* dont do this
		return;
        // If data is null, we send our data.
        if (!data.result) {
            self.player_x = self.my_identity;
            self.player_o = null;
            self.vue.board_1 = self.null_board();
			self.vue.board_2 = self.null_board();
            self.vue.is_my_turn = false;
            self.send_state();
        } else {
            // I technically don't need to assign this to self, but it helps debug the code.
            self.server_answer = JSON.parse(data.result);
            self.player_x = self.server_answer.player_x;
            self.player_o = self.server_answer.player_o;
            if (self.player_x === null || self.player_o === null) {
                // Some player is missing. We cannot play yet.
                self.vue.is_my_turn = false;
                console.log("Not all players present.");
                if (self.player_o === self.my_identity || self.player_x === self.my_identity) {
                    // We are already present, nothing to do.
                    console.log("Waiting for other player to join");
                } else {
                    console.log("Signing up now.");
                    // We are not present.  Let's join if we can.
                    if (self.player_x === null) {
                        // Preferentially we play as x.
                        self.player_x = self.my_identity;
                        self.send_state();
                    } else if (self.player_o === null) {
                        self.player_o = self.my_identity;
                        self.send_state();
                    } else {
                        // The magic word is already taken.
                        self.vue.need_new_magic_word = true;
                    }
                }
            } else {
                console.log("Both players are present");
                // Both players are present.
                // Let us determine our role if any.
                if (self.player_o !== self.my_identity && self.player_x !== self.my_identity) {
                    // Again, we are intruding in a game.
                    self.vue.need_new_magic_word = true;
                } else {
                    // Here is the interesting code: we are playing, and the opponent is there.
                    // Reconciles the state.
                    self.update_local_vars(self.server_answer);
                }
            }
        }*/
    };

    self.update_local_vars = function (server_answer) {
        // First, figures out our role.
        if (server_answer.player_o === self.my_identity) {
            self.vue.my_role = 'o';
        } else if (server_answer.player_x === self.my_identity) {
            self.vue.my_role = 'x';
        } else {
            self.vue.my_role = ' ';
        }

        // Reconciles the board, and computes whose turn it is.
        for (var i = 0; i < 9; i++) {
            if (self.vue.board[i] === ' ' || server_answer.board[i] !== ' ') {
                // The server has new information for this board.
                Vue.set(self.vue.board, i, server_answer.board[i]);
            } else if (self.vue.board[i] !== server_answer.board[i]
                && self.vue.board[i] !== ' ' && server_answer.board[i] !== ' ')  {
                console.log("Board inconsistency at: " + i);
                console.log("Local:" + self.vue.board[i]);
                console.log("Server:" + server_answer.board[i]);
            }
        }

        // Compute whether it's my turn on the basis of the now reconciled board.
        self.vue.is_my_turn = (self.vue.board !== null) &&
            (self.vue.my_role === whose_turn(self.vue.board));
    };


    function whose_turn(board) {
        num_x = 0;
        num_o = 0;
        for (var i = 0; i < 9; i++) {
            if (board[i] === 'x') num_x += 1;
            if (board[i] === 'o') num_o += 1;
        }
        if (num_o >= num_x) {
            return 'x';
        } else {
            return 'o';
        }
    }


    self.set_magic_word = function () {
		if (self.vue.chosen_magic_word === self.vue.magic_word) { return; }
		// reset board if active
		if (self.vue.chosen_magic_word !== null && self.player_1 !== self.my_identity && self.player_2 !== self.my_identity) {
			self.player_1 = null;
			self.player_2 = null;
			self.vue.board_1 = null;
			self.vue.board_2 = null;
			self.vue.turn_count = null;
			self.vue.game_count = null;
			self.vue.need_new_magic_word = false;
			self.send_state();
		}
        self.vue.chosen_magic_word = self.vue.magic_word;
        self.vue.need_new_magic_word = false;
        // Resets board and turn.
        self.vue.board_1 = self.null_board();
        self.vue.board_2 = self.null_board();
        self.vue.is_my_turn = false;
        self.vue.my_role = "";
    };

    self.play = function (i, j) {
		
		var opponent_board = self.opponent_board();

		if (self.vue.is_my_turn && opponent_board[8*i+j] !== 'h' && opponent_board[8*i+j] !== 'w') {

			if (typeof(opponent_board[8*i+j]) === "number") {
				// This is a hit
				// Check if the ship is sunk
				var shipid = opponent_board[8*i+j];
				var shipcount = 0;
				for (var index = 0; index < opponent_board.length; index++) {
					if (opponent_board[index] === shipid) {
						shipcount++;
					}
				}

				//console.log("set h");
				//opponent_board.splice(8*i+j, 1, 'h');
				opponent_board[8*i+j] = 'h';

				if (shipcount <= 1) { // Hit last of the ship
					self.reveal_water(opponent_board, i, j);
				}

			}
			else if (opponent_board[8*i+j] === '') {
				// Miss (water)
				//opponent_board.splice(8*i+j, 1, 'w');
				opponent_board[8*i+j] = 'w';
			}

			self.vue.is_my_turn = false;
			self.vue.turn_count++;

			// Check for win
			if (self.board_is_won(opponent_board)) {
				self.vue.win_line = "You won!";
			}

			self.send_state();
		}

    };

	self.reveal_water = function(board, x, y) {
		var dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
		var dir;
		for (var i = 0; i < dirs.length; i++) {
			if (board[8*(x+dirs[i].x)+(y+dirs[i].y)] === 'h') {
				dir = dirs[i];
				break;
			}
		}

		if (dir === undefined) { // small ship w/ no adjacent direction
			for (var j = 0; j < dirs.length; j++) {
				var offset = self.vadd(x, y, dirs[j].x, dirs[j].y);
				if (board[self.vflat(offset)] === '') {
					self.set_in_board(board, offset.x, offset.y, 'w');
					//board.splice(i+dirs[j], 1, 'w');
				}
			}
			return;
		}
		
		for (var i = 0; self.vflat(self.vadd(x, y, i*dir.x, i*dir.y)) >= 0 && self.vflat(self.vadd(x, y, i*dir.x, i*dir.y)) < 64; i++) {
			var center = self.vadd(x, y, i*dir.x, i*dir.y);
			if (board[self.vflat(center)] !== 'h') {
				break;
			}
			for (var j = 0; j < dirs.length; j++) {
				var offset = self.vadd(center.x, center.y, dirs[j].x, dirs[j].y);
				if (board[self.vflat(offset)] === '') {
					self.set_in_board(board, offset.x, offset.y, 'w');
					//board.splice(i+dirs[j], 1, 'w');
				}
			}
		}

		for (var i = 0; self.vflat(self.vadd(x, y, -1*i*dir.x, -1*i*dir.y)) >= 0 && self.vflat(self.vadd(x, y, -1*i*dir.x, -1*i*dir.y)) < 64; i++) {
			var center = self.vadd(x, y, -1*i*dir.x, -1*i*dir.y);
			if (board[self.vflat(center)] !== 'h') {
				break;
			}
			for (var j = 0; j < dirs.length; j++) {
				var offset = self.vadd(center.x, center.y, dirs[j].x, dirs[j].y);
				if (board[self.vflat(offset)] === '') {
					self.set_in_board(board, offset.x, offset.y, 'w');
					//board.splice(i+dirs[j], 1, 'w');
				}
			}
		}
	};

	self.vadd = function(x1, y1, x2, y2) {
		return {x: (x1+x2), y: (y1+y2)};
	}

	self.vflat = function(x1, y1) {
		if (typeof(x1) === "object") {
			return 8*x1.x+x1.y;
		}
		return 8*x1+y1;
	}

	self.set_in_board = function(board, x, y, val) {
		if (x < 8 && x >= 0 && y < 8 && y >= 0) {
			board.splice(8*x+y, 1, val);
		}
	};

	self.board_is_won = function(board) {
		for (i = 0; i < board.length; i++) {
			if (typeof(board[i]) === "number") {
				return false;
			}
		}
		return true; // no numbers means all ships sunk -> won
	}

	self.own_board = function() {
		if (self.vue === undefined) { return []; }
		if (self.player_1 === self.my_identity) {
			return self.vue.board_1;
		}
		else {
			return self.vue.board_2;
		}
	};

	self.opponent_board = function() {
		if (self.vue === undefined) { return []; }
		if (self.player_1 === self.my_identity) {
			return self.vue.board_2;
		}
		else {
			return self.vue.board_1;
		}
	};

	self.new_game = function() {
		// Set up a new game
		if (self.vue.win_line === "") {
			return; // game is not over
		}
		else {
			self.vue.status_line = "Starting a new game";
			self.vue.win_line = "";
			// Set boards accordingly
			if (self.player_1 === self.my_identity) {
				self.vue.board_1 = getBoard();
				self.vue.board_2 = self.null_board();
			}
			else {
				self.vue.board_2 = getBoard();
				self.vue.board_1 = self.null_board();
			}

			// Set metadata
			self.vue.turn_count = 0;
			self.vue.game_count++;
			self.vue.is_my_turn = false;
			self.send_state();
		}
	};

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            magic_word: "",
            chosen_magic_word: null,
            need_new_magic_word: false,
            my_role: "",
            board_1: self.null_board(),
            board_2: self.null_board(),
            is_other_present: false,
            is_my_turn: false,
			status_line: "No players present",
			win_line: "",
			turn_count: 0,
			game_count: 0
        },
        methods: {
            set_magic_word: self.set_magic_word,
            play: self.play,
			new_game: self.new_game,
			own_board: self.own_board,
			opponent_board: self.opponent_board
        }

    });

    call_server();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});
