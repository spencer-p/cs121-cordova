
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
    self.null_board = ["", "", "", "", "", "", "", "", ""];

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
    self.state = {
        player_x: null,
        player_o: null,
        board: null
    };

    // This is the main control loop.
    function call_server() {
        console.log("Calling the server");
        if (self.vue.chosen_magic_word === null) {
            console.log("No magic word.");
            setTimeout(call_server, call_interval);
        } else {
            // We can do a server call.
            $.ajax({
                dataType: 'json',
                url: server_url +'read',
                data: {key: self.vue.chosen_magic_word},
                success: self.process_server_data,
                complete: setTimeout(call_server, call_interval) // Here we go again.
            });
        }
    }

    call_server();

    // Main function for sending the state.
    self.send_state = function () {
        self.update_local_vars();
        $.post(server_url + 'store',
            {
                key: self.vue.chosen_magic_word,
                val: JSON.stringify(self.state)
            }
        );
    };


    // Main place where we receive data and act on it.
    self.process_server_data = function (data) {
        // If data is null, we send our data.
        if (!data.result) {
            self.state.player_x = self.my_identity;
            self.state.player_o = null;
            self.state.board = self.null_board;
            self.update_local_vars();
            self.send_state();
        } else if (!self.are_both_players_present(data.result)) {
            // Some player is still missing (perhaps us!).
            self.state = data.result;
            if (self.state.player_o === self.my_identity || self.state.player_x === self.my_identity) {
                // We are already present, nothing to do.
                self.update_local_vars();
            } else {
                // We are not present.  Let's join if we can.
                if (self.state.player_x === null) {
                    // Preferentially we play as x.
                    self.state.player_x = self.my_identity;
                    self.send_state();
                } else if (self.state.player_o === null) {
                    self.state.player_o = self.my_identity;
                    self.send_state();
                } else {
                    // The magic word is already taken.
                    self.vue.need_new_magic_word = true;
                    self.update_local_vars();
                }
            }
        } else {
            // Both players are present.
            // Let us determine our role if any.
            if (self.state.player_o !== self.my_identity || self.state.player_x !== self.my_identity) {
                // Again, we are intruding in a game.
                self.vue.need_new_magic_word = true;
                self.update_local_vars();
            } else {
                // Here is the interesting code: we are playing, and the opponent is there.
                // What are we?
                if (self.state.player_o === self.my_identity) {
                    self.my_role = 'o';
                } else {
                    self.my_role = 'x';
                }
                self.update_local_vars();
            }
        }
    };

    self.update_local_vars = function () {
        // Update things like self.vue.is_other_present, etc etc.
        // Idempotent.
        // Also displays the board whenever I am part of the game, and blank otherwise.
        self.vue.board = null;
        self.vue.is_game_ongoing = null;
        self.vue.my_role = null;
        self.vue.is_my_turn = false;
    };


    self.are_both_players_present = function (s) {
        return (s.player_x !== null && s.player_o !== null);
    };

    self.set_magic_word = function () {
        self.vue.chosen_magic_word = self.vue.magic_word;
        self.vue.need_new_magic_word = false;
    };

    self.play = function (i, j) {
        // Check that the game is ongoing and that it's our turn to play.
        // Check also that the square is empty.
        // Update self.vue.board and self.state.board
        self.send_state();
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
            board: self.null_board,
            is_other_present: false
        },
        methods: {
            set_magic_word: self.set_magic_word,
            play: self.play
        }

    });

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});
