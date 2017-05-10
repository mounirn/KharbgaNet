/* include after all dependecies */
var init = function() {
    var board,
        boardEl = $('#board');
    
    // flag for turning on/off logging 
    var loggingOn = true; 

    // the client state
    var appClientState = {
        sessionId: "",
        sessionLastAccessTime: new Date(),
        userScreenName: "",
        serverGameId: "",
        serverConnectionId: "",
        serverOpponentConnectionId: "",
        role: 0,      //  unknown, attacker, defender, spectator
        loggedIn: false,
        player: null,
        serverGame: null,
        opponentPlayer: null,
        loaded: false,
        firstComputerSetting: true,
        computer_is_playing: false
    };

    /* the game events */
    /**
     * Handler for the local engine when a new game is started
     * @param {any} eventData -- the event data
     */
    function onNewGameStarted(eventData) {
        console.log("%s - event: onNewGameStarted - source: %s ", moment().format('HH:mm:ss.SSS'), eventData.source.fen());

        $('#player').html('New Game...');
        $('#message').html("<div class='alert alert-info'>Started a new game.  </div>")
        updateScores(eventData.source);

        // malha square
        boardEl.find('.square-d4').addClass('highlight-malha');

        // update the board with current game state
        board.position(game.fen(), false);

        //checkBoardAndPlayIfComputer();
    }
    

    function onNewPlayerTurn(eventData) {
        console.log("%s - event: onNewPlayerTurn - player: %s", getLoggingNow(), eventData.player);


        $('#player-turn').html(Kharbga.PlayerRole[eventData.player.role]);
        currentPlayer = eventData.player;

        $('#message').html("<div class='alert alert-success'>It is the turn  of the <strong>" +
            Kharbga.PlayerRole[eventData.player.role] + "</strong> to play </div>")

        // reset after player's move 
        moveSourceRequired = "";

     /*   var capturedCells = boardEl.find('.hightlight-captured');
        sourceRequired.removeClass('highlight-captured'); */
        // removed captured cells highlighting 
        $('.hightlight-captured').removeClass('hightlight-captured');
     
        checkBoardAndPlayIfComputer();
       
    }
    function getLocalPlayerRole() {
        if (appClientState == null || appClientState.player == null) return "null";
        if (appClientState.player.IsAttacker) return "Attacker";
        else
            return "Defender";
    }
    /**
     * Checks the board and play a move if its the computer turn
     * @param {any} requiredFromPiece -- piece to use as the from 
     */
    function checkBoardAndPlayIfComputer(requiredFromPiece) {
         if (appClientState.player == null) {
             console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local player is null - returning",
                 getLoggingNow(),getComputerRole(), game.turn());
            return;
         }
         if (game.turn() == 'a' && appClientState.player.IsAttacker === true ) {
                boardEl.removeClass("turn-disabled");
                boardEl.prop('disabled', false);
                console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - local real player role is: %s - returning",
                    getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());

                return;
         }

         if (game.turn() == 'd' && appClientState.player.IsAttacker === false ) {
                boardEl.removeClass("turn-disabled");
                boardEl.prop('disabled', false);
                console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - local real player role is: %s - returning",
                    getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
                return;
         }
   
        boardEl.addClass("turn-disabled");
        boardEl.prop('disabled', true);
        if (appClientState.player.IsSpectator || appClientState.opponentPlayer == null) {
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - local real player is spectator or opponent player is null - returning",
                getLoggingNow(), getComputerRole(),game.turn());

            return;
        }
        // check opponent player is system 
       if (appClientState.opponentPlayer.IsSystem == false) {
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - opponent player is not system. Local player id: %s",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());

            return;
        }

        // the game is not set
       if (appClientState.serverGameId == "") {
           console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - Null Server Game ID. Local player id: %s",
               getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }
        console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local real player is: %s - required From Piece: %s",
            getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole() , requiredFromPiece);


        if (appClientState.opponentPlayer.IsAttacker === true && game.turn() == 'a' ) {
            $('#message').html("<div class='alert alert-warning'>Thinking... </div>");
            setTimeout(computer_play, 4000, requiredFromPiece);// ask the system to play after a couple of seconds
        }
        else {
            if (appClientState.opponentPlayer.IsAttacker === false && game.turn() == 'd' ) {
                $('#message').html("<div class='alert alert-warning'>Thinking... </div>");
                setTimeout(computer_play, 4000, requiredFromPiece);// ask the system to play after a couple of seconds
            }
            else
                console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local real player is: %s - required From Piece: %s -- did not trigger play",
                    getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole(), requiredFromPiece);
        }
    }

    /**
     * handler for when a setting is completed
     * @param {any} eventData
     */
    function onNewSettingCompleted(eventData) {
        console.log("%s - event: onNewSettingCompleted - cell %s ", getLoggingNow(),eventData.targetCellId);

        if (game.turn() == 'a') {
            $('#attackerSettings').append($('<option>', {
                value: game.getAttackerScore(),
                text: eventData.targetCellId
            }));

            
        }
        else {
            $('#defenderSettings').append($('<option>', {
                value: game.getDefenderScore(),
                text: eventData.targetCellId
            }));
        }
   
        $('#message').html("<div class='alert alert-success'>It is the turn  of the " +
            Kharbga.PlayerRole[eventData.player.role] + " to set the 2nd piece </div>")

        updateScores(eventData.source);

       
         checkBoardAndPlayIfComputer();

       
    }
    
    function onSettingsCompleted(eventData) {
        console.log("%s - event: onSettingsCompleted - final board state: %s", getLoggingNow(), eventData.source.fen());

        $('#message').html("<div class='alert alert-success'>The setting phase is now completed.  It is the Attacker turn to move a piece to the middle cell and attempt to capture the opponent pieces. </div>");

        $('#state').html(Kharbga.GameState[eventData.source.getState()]);

        updateScores(eventData.source);

        // display the exchange request fields
        $('.exchangeRequest').show();

        boardEl.find('.square-d4').removeClass('highlight-malha');


        checkBoardAndPlayIfComputer();
      
    }

    function onNewMoveStarted(eventData) {
     /*   console.log("event: onNewMoveStarted - source: " + eventData.source.fen());
        console.log("event: onNewMoveStarted - from " + eventData.from);
        console.log("event: onNewMoveStarted - to " + eventData.to);
*/

    }

    function onNewMoveCompleted(eventData) {
        console.log("%s - event: onNewMoveCompleted - game position: %s - from: %s - to: %s  ",
            getLoggingNow(), eventData.source.fen(), eventData.from.ID(), eventData.to.ID());


        // remove source highlighting
        var sourceRequired = boardEl.find('.highlight-source');
        sourceRequired.removeClass('highlight-source');

        boardEl.find('.highlight-captured').removeClass('highlight-captured');
      
        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        // update the board position here for the case when processing exchanges
        board.position(game.fen(), true);

        if (game.turn() == 'a') {
            $('#attackerMoves').append($('<option>', {
                value: game.getAttackerMoveNumber(),
                text:  eventData.from.ID() + '-' + eventData.to.ID()
            }));
        }
        else {
            $('#defenderMoves').append($('<option>', {
                value: game.getDefenderMoveNumber(),
                text: eventData.from.ID() + '-' + eventData.to.ID()
            }));
        }   
    }

    function onNewMoveCompletedContinueSamePlayer(eventData) {
        console.log("%s - event: onNewMoveCompletedContinueSamePlayer - source: %s - from %s - to: %s ",
            getLoggingNow(), eventData.source.fen(), eventData.from.ID(), eventData.to.ID());

        $('#message').html("<div class='alert alert-success'>Same player must continue playing using the same soldier now on: <strong> " +
            eventData.targetCellId  + "</strong>. There are still pieces that could be captured  </div>" );

        // player must play this piece   
     
        var moveSourceRequired = eventData.targetCellId;
        // highlight the piece required for moving
        var sourceRequired = boardEl.find('.square-' + moveSourceRequired);
        sourceRequired.addClass('highlight-source');

        updateScores(eventData.source);

        if (game.turn() == 'a') {
            $('#attackerMoves').append($('<option>', {
                value: game.getAttackerMoveNumber(),
                text: eventData.from.ID() + '-' + eventData.to.ID()
            }));
        }
        else {
            $('#defenderMoves').append($('<option>', {
                value: game.getDefenderMoveNumber(),
                text: eventData.from.ID() + '-' + eventData.to.ID()
            }));
        }

        checkBoardAndPlayIfComputer(moveSourceRequired);
    }

    /**
     * handler for the player selecting a cell and not moving and staying the same cell. This could indicate a player
     * selecting a piece for exchange
     * @param {any} eventData -- the action data
     */
    function onNewMoveCanceled(eventData) {
        console.log("%s - event: onNewMoveCanceled - target Cell Id: %s ", getLoggingNow(), eventData.targetCellId);
 
    }

    function onInvalidGameMove(eventData) {
        console.log("%s - event: onInvalidMove - source: %s - from %s - to: %s ",
            getLoggingNow(), eventData.source.fen(), eventData.from.ID(), eventData.to.ID());
    }

    /**
     * Handler for when the game is game
     * @param {any} eventData - the game event info
     */
    function onWinnerDeclared(eventData) {
        console.log("%s - event: onWinnerDeclared - winner: %s ", getLoggingNow(), eventData.player);

        $('#message').html("<div class='alert alert-success'><strong>Game Over. Winner is: " + Kharbga.PlayerRole[eventData.player.role] + " </strong></div>")

        updateScores(eventData.source);

        $('#state').html(Kharbga.GameState[eventData.source.getState()]);
        

        $('#startGameBtn').show();
        $('#loadSetting1').hide();     
    }

    function onUntouchableSelected(eventData) {
        console.log("%s - event: onUntouchableSelected - cell: %s", getLoggingNow(), eventData.targetCellId);
     
        var exchangeSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangeSquare.addClass('highlight-exchange');

        updateMoveFlags(eventData.source.move_flags());

    }

    function onUntouchableExchangeCanceled(eventData) {
        console.log("%s - event: onUntouchableExchangeCanceled - source: %s ", getLoggingNow(), eventData.source);
        $('#message').html("<div class='alert alert-warning'>Exchange Request Canceled</div>")

        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
    }

    function onUntouchableExchangeCompleted(eventData) {
        console.log("%s - event: onUntouchableExchangeCompleted - source: %s ", getLoggingNow(),eventData.source);
        $('#message').html("<div class='alert alert-success'>Exchnage Request Completed</div>")


     //   board.position(game.fen(), false);
        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
    }

    function onInvalidSettingMalha(eventData) {
        console.log("%s - event: onInvalidSettingMalha - targetCellId: %s ", getLoggingNow(), eventData.targetCellId);
        $('#message').html("<div class='alert alert-danger'>Setting on middle cell (Malha) is not allowed</div>")

    }

    function onInvalidSettingOccupied(eventData) {
        console.log("%s - event: onInvalidSettingOccupied - targetCellId: %s ", getLoggingNow(), eventData.targetCellId);

        $('#message').html("<div class='alert alert-danger'>Setting on an occupied cell is not allowed</div>")
    }

    function updateScores(game) {
        $('#attacker_score').html(game.getAttackerScore().toString());
        $('#defender_score').html(game.getDefenderScore().toString());

        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

    }

    /* Board Events */
    function onInvalidMove(eventData) {
        console.log("%s - board event: onInvalidMove - target: %s - type : %s ",
            getLoggingNow(), eventData.targetCellId, Kharbga.BoardMoveType[eventData.type]);

        $('#message').html("<div class='alert alert-danger'>Invalid Move " + Kharbga.BoardMoveType[eventData.type] +" </div>")
    }

    function onValidMove(eventData) {
        console.log("%s - board event: onValidMove - target: %s ", getLoggingNow(), eventData.targetCellId);
    }

    function onCapturedPiece(eventData) {
        console.log("%s - board event: onCapturedPiece - target: %s ", getLoggingNow(), eventData.targetCellId);

        //  board.move(eventData.targetCellId + "-spare");
        // remove original piece from source square
        //srcSquareEl.find('.' + CSS.piece).remove();
        var capturedSquare = boardEl.find('.square-' + eventData.targetCellId);
        capturedSquare.addClass('highlight-captured');
       // capturedSquare.find('.' + pieceClass).remove();

        board.position(game.fen(), false);
        updateScores(game);
    }

    function onExchangedPiece(eventData) {
        console.log("%s - board event: onExchangedPiece - target: %s", getLoggingNow(), eventData.targetCellId);

        //  board.move(eventData.targetCellId + "-spare");
        // remove original piece from source square
        //srcSquareEl.find('.' + CSS.piece).remove();
        var exchangedSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangedSquare.addClass('highlight-exchange');
        // capturedSquare.find('.' + pieceClass).remove();

        board.position(game.fen(), false);
        updateScores(game);
    }

    function onPlayerPassed(eventData) {
        console.log("%s - board event: onPlayer Passed - target: %s ", getLoggingNow(), eventData.player.Name);
        $('#message').html("<div class='alert alert-warning'>Player passed - Player: " + eventData.player.Name + " </div>")
   }


    // Setup the game events to pass to the game object
    var gameEvents = {
        newGameStartedEvent: onNewGameStarted,
        newPlayerTurnEvent: onNewPlayerTurn,
        newSettingCompletedEvent: onNewSettingCompleted,
        settingsCompletedEvent: onSettingsCompleted,
        newMoveStartedEvent: onNewMoveStarted,
        newMoveCompletedEvent: onNewMoveCompleted,
        newMoveCompletedContinueSamePlayerEvent: onNewMoveCompletedContinueSamePlayer,
        newMoveCanceledEvent: onNewMoveCanceled,
        winnerDeclaredEvent: onWinnerDeclared,
        untouchableSelectedEvent: onUntouchableSelected,
        untouchableExchangeCanceledEvent: onUntouchableExchangeCanceled,
        untouchableExchangeCompletedEvent: onUntouchableExchangeCompleted,
        invalidSettingMalhaEvent: onInvalidSettingMalha,
        invalidSettingOccupiedEvent: onInvalidSettingOccupied,
        invalidMoveEvent: onInvalidGameMove, 
        playerPassedEvent : onPlayerPassed
    };

    // Setup the board events
    var boardEvents = {
        invalidMoveEvent: onInvalidMove,
        validMoveEvent: onValidMove,
        capturedPieceEvent: onCapturedPiece

    };

    var game = new Kharbga.Game(gameEvents, boardEvents); 
  
    var squareClass = 'square-55d63',
        pieceClass = 'piece-417db',
        squareToHighlight,
        colorToHighlight;


    var onDragMove = function(newLocation, oldLocation, source, piece, position, orientation) {
        /*      console.log("New location: " + newLocation);
              console.log("Old location: " + oldLocation);
              console.log("Source: " + source);
              console.log("Piece: " + piece);
              console.log("Position: " + KharbgaBoard.objToFen(position));
              console.log("Orientation: " + orientation);
              console.log("--------------------");
              console.log("game state: " + game.getState());
              console.log("game is in setting mode: " + game.isInSettingMode());
          */
    };

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
        if (game.game_over() === true ||
            (game.turn() === 'a' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'd' && piece.search(/^w/) !== -1)) {
            return false;
        }

        if (typeof appClientState.player == 'undefined' || appClientState.player == null) {
            $('#message').html("<div class='alert alert-info'>Please start or join a game to be able to play.</div>")
            return false;
        }
        if (appClientState.player.IsSpectator === true) {
            $('#message').html("<div class='alert alert-warning'>As a spectator you are not allowed to make any moves. You could however submit comments if allowed by the players.</div>")
            return false;
        }
        // check if allowed to make the move
        if (game.turn() === 'a' && appClientState.player.IsAttacker !== true) {
            $('#message').html("<div class='alert alert-warning'>It is the attacker's turn to play.</div>")
           return false;
        }
        if (game.turn() === 'd' && appClientState.player.IsAttacker !== false) {
            $('#message').html("<div class='alert alert-warning'>It is the defender's turn to play.</div>")
            return false;
        }

        // check if settings is over and selected piece is spare
        if (game.game_setting_over() === true && source === 'spare') {
            $('#message').html("<div class='alert alert-warning'>Game setting is done. You could only move pieces on the board now.</div>")
            return false;
        }

        // check if setting is not over and selected piece is on the board
        if (game.game_setting_over() === false && source !== 'spare') {
            $('#message').html("<div class='alert alert-warning'>You are not allowed to move pieces on the board until the game setting is completed.</div>")

            return false;
        }
        if (game.is_in_moving_state() === true) {
            // check if piece is surrounded -- return false
            if (game.is_surrounded_piece(source) === true) {
                $('#message').html("<div class='alert alert-warning'>You could only move pieces that have free/open adjacent cells.</div>")

                return false;
            }

            var moveSourceRequired = game.move_source_required();
            // check if a given source piece must be played
            if (moveSourceRequired.length != 0 && source !== moveSourceRequired) {
                $('#message').html("<div class='alert alert-info'>Please continue moving using solider on " + moveSourceRequired + "</div>")
                return false;
            }
        }
    };


    var onDrop = function(source, target, piece, newPos, oldPos, orientation) {
        console.log("onDrop - from: %s - to: %s ", source, target);
        
        $('#gameMove').html(source + "-" + target);

        var ret;

        var msg = $("move-message").text();

        var resigned = $('#abandonCheckbox').is(':checked');
        var exchangeRequest = false;
        var isAttacker = false;
        if (game.turn() == 'a') {
            exchangeRequest = $('#exchangeRequestAcceptedCheckbox').is(':checked');
            isAttacker = true;
        }
        else {
            exchangeRequest = $('#exchangeRequestCheckbox').is(':checked');
        }
        var isSetting = false;

        var beforeFEN = game.fen();
               
        if (game.is_in_moving_state()) {
            ret = game.processMove(source, target, resigned, exchangeRequest);
        }
        else {
            if (game.is_in_setting_state() ){
                isSetting = true;
                ret = game.processSetting(target);
            }
            else {
                ret = false;
            }
        }

        if (ret == true) {  // add option to show submit to server button
            lastMoveId = createMoveId(); 
            // submit to the server
            if (appClientState.serverGameId != "") {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(appClientState.serverGameId, appClientState.userScreenName,
                    isAttacker, isSetting, source, target, resigned, exchangeRequest, beforeFEN, game.fen(), msg, lastMoveId
                ).done(function () {
                    console.log('%s - Done server Invocation of recoredMove ( moveId : %s)', getLoggingNow(),lastMoveId);
                })
                .fail(function (error) {
                    console.log('%s - Invocation of recordMove ( moveId : %s) failed. Error: %s ', getLoggingNow(), lastMoveId, error);
                });
            }
        }
        // updateStatus();
        if (ret == false) return 'snapback';
    };
    var lastMoveId = "";
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    function createMoveId() {
        return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
            var r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }

    /**
     * play options for the computer
     */
    var playOptions = {
        randomSetting: true,
        firstSettingMustIncludeMalhaAdjacent: true,
        randomMove: true,
        searchMovesThatCaptureOpponent: true,
        searchMovesThatSaveSelf: true,
        preferMovesThatCaptureOverMovesThatSave: true

    };

    /**
     * returns a random number from the given range
     * @param {any} lower - range start
     * @param {any} upper - range to
     */
    function getRandom(lower, upper) {
        // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
        var percent = (Math.random() * 100);
        // this will return number between 0-99 because Math.random returns decimal number from 0-0.9929292 something like that
        //now you have a percentage, use it find out the number between your INTERVAL :upper-lower 
        var num = ((percent * (upper - lower) / 100));
        //num will now have a number that falls in your INTERVAL simple maths
        num += lower;
        //add lower to make it fall in your INTERVAL
        //but num is still in decimal
        //use Math.floor>downward to its nearest integer you won't get upper value ever
        //use Math.ceil>upward to its nearest integer upper value is possible
        //Math.round>to its nearest integer 2.4>2 2.5>3   both lower and upper value possible
        // console.log("upper: %s,lower: %s, num: %s, floor num: %s, ceill num: %s, round num: %s", lower, upper, num, Math.floor(num), Math.ceil(num), Math.round(num));
        return Math.floor(num);
    }

    /**
     * @returns the computer role in the current game
     */
    function getComputerRole() {
        if (appClientState.opponentPlayer == null)
            return "null appClientState.opponentPlayer";

        if (appClientState.opponentPlayer.IsAttacker) return "Attacker";
        else 
            return "Defender";
    }
    /**
     * Generates a computer setting or move
     * @param requiredFromPiece - piece to use for moving
     */
    function computer_play(requiredFromPiece) {
        console.log("%s - computer_play() as %s - required From Piece: %s", getComputerRole(), getLoggingNow(), requiredFromPiece);
        appClientState.computer_is_playing = true;

        if (game.turn() == 'a' && appClientState.player.IsAttacker === true) {
            boardEl.removeClass("turn-disabled");
            boardEl.prop('disabled', false);
            console.log("%s - computer_play() (as %s)- game turn: %s - local real player role is: %s - returning",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());

            return;
        }

        if (game.turn() == 'd' && appClientState.player.IsAttacker === false) {
            boardEl.removeClass("turn-disabled");
            boardEl.prop('disabled', false);
            console.log("%s - ccomputer_play() (as %s)- game turn: %s - local real player role is: %s - returning",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }

        var source = "";
        var target = "";
        var exchangeRequest = false;  // default to true for computer if playing unreachable pieces
        if (game.is_in_setting_state()) {
            var settings = [];
            if (playOptions.firstSettingMustIncludeMalhaAdjacent && appClientState.firstComputerSetting == true && appClientState.opponentPlayer.IsAttacker) {
                settings = game.settings_near_malha(); // cells adjacent to Malha
            }
            else {
                temp_settings = game.settings_near_opponent();

                if (appClientState.opponentPlayer.IsAttacker) {
                    var settings2 = game.settings_near_malha();
                    // check if settings includes any of these and prefer to set on these 
                    for (var si = 0; si < settings2.length; si++) {
                        if (temp_settings.indexOf(settings2[si]) > 0)
                            settings.push(settings2[si]);
                    }
                }
                if (settings.length == 0) { // if none are left check prefer these next ones
                    var settings3 = ['d1', 'e1', 'c1', 'a5', 'a4', 'a3', 'c7', 'd7', 'e7', 'g5', 'g4', 'g3', 'b5', 'c6', 'b3', 'c2', 'e2', 'f3', 'e6', 'f5'];
                    // check if settings includes any of these and prefer to set on these 
                    for (var si = 0; si < settings3.length; si++) {
                        if (temp_settings.indexOf(settings3[si]) > 0)
                            settings.push(settings3[si]);
                    }
                    if (settings.length == 0)
                        settings = temp_settings;
                } 
           
            }
            if (settings.length == 0)  // whatever is left
                settings = game.settings();

            if (settings== null || typeof settings.length === "undefined" || settings.length <= 0) {
                $('#message').html("<div class='alert alert-error'>Unable to find a valid setting</div>");

                // if computer can not play -- resign or pass
                game.check();
                appClientState.computer_is_playing = false;
                return;
            }
            soruce = "spare";

            if (playOptions.randomSetting) {
                var settingId = getRandom(0, settings.length - 1);
                target = settings[settingId];
            }
            else
                target = settings[0];

            appClientState.firstComputerSetting = false;
            console.log("%s - Generated computer setting:  %s", getLoggingNow(), target);
        }
        else {
            if (game.is_in_moving_state()) {
                var moves = null;
                if (playOptions.searchMovesThatCaptureOpponent) {
                    moves = game.moves_that_capture(requiredFromPiece);
                }
                if (playOptions.searchMovesThatSaveSelf) {
                    var movesThatSave = game.moves_that_save(requiredFromPiece);

                    if (!playOptions.preferMovesThatCaptureOverMovesThatSave && movesThatSave.length > 0)
                        moves = movesThatSave;
                }

                if (moves == null || moves.length == 0) {  // no capture able and no savable
                    moves = game.moves_unreachables(requiredFromPiece);
                    if (moves != null && moves.length > 0)
                        exchangeRequest = true;
                }

                if (moves == null || moves.length == 0) { // no unreachable?{
                    moves = game.moves(requiredFromPiece);
                }

                
                if (moves == null || typeof moves.length === "undefined" || moves.length <= 0) {
                    $('#message').html("<div class='alert alert-danger'>Unable to find a valid move - Contact Support!</div>");

                    // if computer can not play -- resign or pass
                    game.check();
                    appClientState.computer_is_playing = false;
                    return;
                }
                
                var moveId = 0;
                if (playOptions.randomMove)
                    moveId = getRandom(0, moves.length - 1);

                // todo -- add check for game to rank the moves by score and play the one with the highest score

                var move = moves[moveId];
                source = move.From;
                target = move.To;
                console.log("%s - Generated computer move from %s to %s", getLoggingNow(), source, target);
            }
        }

        $('#gameMove').html(source + "-" + target);

        var ret = false;

        var msg = "";

        var resigned = $('#abandonCheckbox').is(':checked');
        var isAttacker = false;
        if (game.turn() == 'a') {
            // set the exchange request if computer
   //         exchangeRequest = $('#exchangeRequestAcceptedCheckbox').is(':checked');
            isAttacker = true;
        }
        else {
   //         exchangeRequest = $('#exchangeRequestCheckbox').is(':checked');
        }
        var isSetting = false;

        var beforeFEN = game.fen();

        if (game.is_in_moving_state()) {
            ret = game.processMove(source, target, resigned, exchangeRequest);
        }
        else {
            if (game.is_in_setting_state()) {
                isSetting = true;
                ret = game.processSetting(target);
            }
            else {
                ret = false;
            }
        }

        if (ret == true) {  
            
            lastMoveId = createMoveId(); 
            // submit to the server
            if (appClientState.serverGameId != "") {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(appClientState.serverGameId, appClientState.opponentPlayer.Name,
                    isAttacker, isSetting, source, target, resigned, exchangeRequest, beforeFEN, game.fen(), msg, lastMoveId
                ).done(function () {
                    console.log('%s - Done Server Invocation of recoredMove ( moveId : %s) inside computer_play - for opponent player %s',
                        getLoggingNow(), lastMoveId, appClientState.opponentPlayer.Name);

                    board.position(game.fen(), false); // update the board with the computer move

                }).fail(function (error) {
                    console.log('%s - Invocation of recordMove ( moveId : %s) failed. Error: %s', getLoggingNow(), lastMoveId, error);
                });
            }

            board.position(game.fen(), false); // update the board with the computer move
        }

        appClientState.computer_is_playing = false;
    };

    var onMoveEnd = function() {

        // remove exchange request highlighting if 

        //boardEl.find('.square-' + squareToHighlight)
        //    .addClass('highlight-' + colorToHighlight);

        // update the game position at the end of the move
        board.position(game.fen(), false);

    };

    /**
     * handler for when selection a cell for setting or a piece for exchange(double click)
     * @param {any} target
     * @param {any} piece
     * @param {any} orientation
     */
    var onSelected = function (target, piece, orientation) {
        console.log("%s - onSelected - target: %s - piece: %s ", getLoggingNow(), target, piece);

    }

    function updateMoveFlags(moveFlags) {
        $('#exchangeRequestCheckbox').attr('checked', moveFlags.exchangeRequest);
        $('#exchangeRequestAcceptedCheckbox').attr('checked', moveFlags.exchangeRequestAccepted);

        $('#exchangeRequestDefenderPiece').text(moveFlags.exchangeRequestDefenderPiece);
        $('#exchangeRequestAttackerPiece1').text(moveFlags.exchangeRequestAttackerPiece1);
        $('#exchangeRequestAttackerPiece2').text(moveFlags.exchangeRequestAttackerPiece2);

        if (!moveFlags.exchangeRequest)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

        if (!moveFlags.exchangeRequestAccepted)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

    }
    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
      //  onDragMove: onDragMove,
        onMoveEnd: onMoveEnd,
        onDrop: onDrop,
        onDoubleClick : onSelected,
        sparePieces: true,
        showErrors: 'console',
        pieceTheme: '../img/theme-simple/{piece}.png'
    };
    var board = KharbgaBoard('board', cfg);

    /**
     * Starts a new game
     */
    function onNewGame(e) {
        if (e.data == null) {
            $('#message').html("<div class='alert alert-danger'>onNewGame - Invalid arguments</div>");
            return false;
        }
       
        resetLocalGame();
        // call the server to start the new game
        gamesHubProxy.server.createGame(appClientState.userScreenName, e.data.asAttacker, e.data.againstComputer)
        .done(function () {
            console.log('%s - Done Server Invocation of create game', getLoggingNow());

        }).fail(function (error) {
            console.log('%s - Invocation of createGame failed. Error: %s', getLoggingNow(), error);
        });        
    }

    /**
     * Clears the local game and board 
     */
    function resetLocalGame() {
        // create a new instance for the local game
        //delete game;         
        game = new Kharbga.Game(gameEvents, boardEvents);
        appClientState.loaded = false;
        appClientState.serverGameId = "";
        appClientState.firstComputerSetting = true;
        game.reset();
        game.start();
        board.clear();
        board.start();

        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());
       
        updateScores(game);

        $('#loadSetting1Btn').show();
        //  $('#startGameBtn').hide();
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        boardEl.find('.highlight-source').removeClass('highlight-source');
        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
        boardEl.find('.square-d4').addClass('highlight-malha');

        setCookie("_nsgid", "");

    }
    /**
     * Loads a sample game setting
     */
    function onLoadSetting1() {
        var fen = "SssSsss/sSSSSSS/ssSsSss/sss1sSS/sSsSSSS/SssSsSS/SssSsSs";
        game = new Kharbga.Game(gameEvents, boardEvents);
        game.reset();
        game.start();
        board.clear();
        board.start();
    
        game.set(fen);
        board.position(game.fen(), false);

        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        $('#loadSetting1Btn').hide();
    }
    /**
     * Clears the game and the board. The board is a set with an empty position string or fen
     */
    function onClear() {
        game = new Kharbga.Game(gameEvents, boardEvents);
        game.reset();
        game.start();
        $('#state').html(Kharbga.GameState[game.getState()]);
        board.clear();

        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        onStart();
    }

  
    function onSendMessage(name, message) {
        console.log("%s - onSendMessage from %s: %", getLoggingNow(), name, message);
    }


    function clickGetPositionBtn() {
        console.log("Current position as an Object:");
        console.log(board.position().toString());

        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        console.log("Current position as a FEN string:");
        console.log(board.fen());
    }
   
    function onLoginLink(e) {
        e.preventDefault();

        $('#main-tabs a[href="#account"]').tab('show');      

        $('#login-panel').show().removeClass('hidden');
        $('#register-panel').hide().addClass('hidden');
    }
    function onRegisterLink(e) {
        e.preventDefault();

        $('#main-tabs a[href="#account"]').tab('show');

        $('#login-panel').hide().addClass('hidden');;
        $('#register-panel').show().removeClass('hidden');

    }
    /**
     * handler for login request 
     * @param {any} e
     */
    function onLoginSubmit(e) {
        e.preventDefault();
        var form = $('#login-form');

        // check if the form is valid
        if (!form.valid()) {
            $('#account-message').html("<div class='alert alert-danger'>Please fix the input errors below.</div>");
            return false;
        }

        var loginInfo = {
            LoginID: $('#login-id').val(),
            Password: $('#login-pwd').val(),
            RememberMe: $('#login-remember').is(':checked')
        };
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");

        var result = nsApiClient.userService.validateLogin(loginInfo, function(data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Logged in successfully </div>");

                var session = data.session;           

                if (session != null) {
                    appClientState.session = session;
                    appClientState.sessionId = session.SessionId;
                    appClientState.userScreenName = session.FullName;
                    appClientState.loggedIn = true;
                    setCookie(C_NSSID, appClientState.sessionId);
                }
                else {
                    appClientState.loggedIn = false;
                }
                setupMyAccount();

                // check the last game 
                rejoinLastGameIfAny();
            }
            else {
                setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
                setupMyAccount();
                appClientState.sessionId = "";
                appClientState.userScreenName = "";
                if (status.status === 404 || status.status === 400  )
                    $('#account-message').html("<div class='alert alert-danger'>Invalid Login ID or password</div>");
                else
                    $('#account-message').html("<div class='alert alert-danger'> Failed to login</div>");

                $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }  
        });
    }

    /**
     * handler for register request 
     * @param {any} e
     */
    function onRegisterSubmit(e) {
        e.preventDefault();
        var form = $('#register-form');
      
        // check if the form is valid
        if (!form.valid()) {
            $('#account-message').html("<div class='alert alert-danger'>Please fix the input errors below.</div>");
            return false;
        }

        var registerInfo = {
            LoginID: $('#register-login-id').val(),
            Password: $('#register-pwd').val(),
            ConfirmPassword: $('#register-pwd-confirm').val(),
            Name: $('#register-name').val(),
            Email: $('#register-email').val(),
            OrgName: $('#register-team').val()

        };
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");

        var result = nsApiClient.userService.register(registerInfo, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Registered new account successfully. </div>");

                var session = data.session;

                if (session != null) {
                    appClientState.session = session;
                    appClientState.sessionId = session.SessionId;
                    appClientState.userScreenName = session.FullName;
                    appClientState.loggedIn = true;
                    setCookie(C_NSSID, appClientState.sessionId);
                }
                else {
                    appClientState.loggedIn = false;
                }
                setupMyAccount();

                rejoinLastGameIfAny();
            }
            else {
                setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
              //  setupMyAccount();
                appClientState.sessionId = "";
                appClientState.userScreenName = "";
                if (status.status === 404 || status.status === 400)
                    $('#account-message').html("<div class='alert alert-danger'>Invalid registration info. Errors: " + status.responseText+ " </div>");
                else
                    $('#account-message').html("<div class='alert alert-danger'> Failed to register.</div>");

                $('#appInfo').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }

    /**
    * handler for logout request
    * @param {any} e
    */
    function onLogoutSubmit(e) {
        e.preventDefault();
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");
        // add call for backend to delete the session
        nsApiClient.userService.logout(appClientState.sessionId, function (data,status) {
            if (data != null ) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Logged out successfully </div>");

                
                appClientState.sessionId = data.SessionId;
                appClientState.userScreenName = data.FullName;
                appClientState.loggedIn = false;
                setCookie(C_NSSID, "");
                setupMyAccount();
            }
            else {
                setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
                setupMyAccount();
                appClientState.sessionId = "";
                appClientState.userScreenName = "";
                $('#account-message').html("<div class='alert alert-danger'>Failed to logout.  </div>");
                $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }  
        });
        appClientState.loggedIn = false;

        setupMyAccount();

    }
    /**
     * handler for refresh app info request
     * @param {any} e
     */
    function onRefreshAppInfo(e) {      
        e.preventDefault();
        nsApiClient.appService.getAppInfo(function (data, status) {
            if (data != null) {
                $('#help-message').html("<div class='alert alert-info'>" + JSON.stringify(status) + "</div>");
                $('#appInfo').html(JSON.stringify(data));
            }
            else {
                $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                $('#appInfo').html('');
            }
        });

    }

    /**
     * checks the stored cookie on app startup
     */
    function checkSessionCookie() {
        var cookie = getCookie(C_NSSID);
        if (typeof cookie === "string" && cookie.length > 10)
            checkSession(cookie);       
    }

    /**
   * checks the stored active game id and active playerId
   */
    function checkGameCookie() {
        var cookie = getCookie("_nsgid");
        if (typeof cookie === "string" && cookie.length > 10)
            return cookie;
        return "";
    }

    /**
     * checks a given session with the backend and update 
     * @param {any} sessionId the session id
     */
    function checkSession(sessionId) {
      
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");

        var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Valid Session </div>");

                var session = data.session;

                if (session != null) {
                    appClientState.session = session;
                    appClientState.sessionId = session.SessionId;
                    appClientState.userScreenName = session.FullName;
                    appClientState.loggedIn = true;
                    setCookie(C_NSSID, appClientState.sessionId);
                }
                else {
                    appClientState.loggedIn = false;
                    // setCookie(C_NSSID, "");
                }
                setupMyAccount();

                // rejoin the game

                rejoinLastGameIfAny();
            }
            else {
               // setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
                setupMyAccount();
                appClientState.sessionId = "";
                appClientState.userScreenName = "";
                if (status.status === 404 || status.status === 400)
                    $('#account-message').html("<div class='alert alert-danger'>Invalid Session</div>");
                else
                    $('#account-message').html("<div class='alert alert-danger'> Failed to access the system</div>");

                $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }

    /**
     * Sets up the MyAccount tab based on the current app client state
     */
    function setupMyAccount() {
        if (appClientState.loggedIn === true) {
            $('#account-info-panel').show().removeClass('hidden');
            $('#account-welcome').show().removeClass('hidden');
            $('#account-welcome').html("<strong> Welcome " + appClientState.userScreenName + "</strong>");

            $('#login-li').hide().addClass('hidden');
            $('#register-li').hide().addClass('hidden');

            $('#logout-li').show().removeClass('hidden');

            $('#login-panel').hide().addClass('hidden');
            $('#register-panel').hide().addClass('hidden');

      

        } else {
            $('#login-panel').show().removeClass('hidden');
            $('#register-panel').hide().addClass('hidden');
            $('#account-info-panel').hide().addClass('hidden');

            $('#account-welcome').hide().addClass('hidden');

            $('#login-li').show().removeClass('hidden');
            $('#register-li').show().removeClass('hidden');
            $('#logout-li').hide().addClass('hidden');
        }
        $('#account-name').text(appClientState.userScreenName);
       // $('#account-org-id').text(appClientState.session.ClientId);
        $('#account-session-id').text(appClientState.sessionId);
        $('#account-game-id').text(appClientState.serverGameId);
        if (appClientState.player != null) {
            $('#account-game-role').text(appClientState.player.IsSpectator? "Spectator" : (appClientState.player.IsAttacker ? "Attacker" : "Defender"));
        }
        else {
            $('#account-game-role').text("");
        }
    }

    /**
     * rejoins local cached game (after the user refreshes the their browser or logs in again)
     */
    function rejoinLastGameIfAny() {
        setupGames();

        // check local active game cookie
        var gid = checkGameCookie();
        if (gid != "") {
                // tell the server to rejoin this connection with the game
                gamesHubProxy.server.reJoinGame(appClientState.userScreenName, gid);
        }
    }

    // setup all the various buttons and links events
    $('#login-link').on('click', onLoginLink);
  
    $('#register-link').on('click', onRegisterLink);
    $('#login-submit').on('click', onLoginSubmit);
    $('#register-submit').on('click', onRegisterSubmit);
    $('#logout-link').on('click', onLogoutSubmit);
    $('#refreshAppInfo-submit').on('click', onRefreshAppInfo);
    $('#getPositionBtn').on('click', clickGetPositionBtn);
    $('#new-game').on('click', { asAttacker: true, againstComputer: false }, onNewGame);
    $('#new-game-attacker').on('click', {asAttacker: true, againstComputer:false}, onNewGame);
    $('#new-game-defender').on('click', { asAttacker: false, againstComputer: false },onNewGame);
    $('#new-game-attacker-system').on('click', { asAttacker: true, againstComputer: true }, onNewGame);
    $('#new-game-defender-system').on('click', { asAttacker: false, againstComputer: true}, onNewGame);

    $('#postMessageBtn').on('click', onPostMessage);
    $('#loadSetting1Btn').on('click', onLoadSetting1);
    $('#flipOrientation').on('click', board.flip);// flip the board
    $('#exchangeRequestCheckbox').on('click', function () {
        var checked = $('#exchangeRequestCheckbox').is(':checked');
        if (!checked) {           
            $('#exchangeRequestDefenderPiece').text('');
        }
    });
    $('#exchangeRequestAcceptedCheckbox').on('click', function () {
        var checked = $('#exchangeRequestAcceptedCheckbox').is(':checked');
        if (!checked) {
            $('#exchangeRequestAttackerPiece1').text('');
            $('#exchangeRequestAttackerPiece2').text('');
        }
    });

    //setupMyAccount();

    // setup signalR communications
    $.connection.hub.url = nsApiClient.baseURI + 'signalr';

    console.log("Hub URL: %s", $.connection.hub.url);

    var gamesHubProxy = $.connection.gamesHub;
    $.connection.hub.logging = loggingOn;

    gamesHubProxy.client.moveRecorded = function (status, errorMessage, gameServerInfo, player, isAttacker, isSetting, moveFrom, moveTo, resigned, exchangeRequest, beforeFEN, afterFEN, message,serverMove){
        if (status === false) {
            console.log("%s - server - error recording move: %s ", getLoggingNow(), errorMessage);
            $('#message').html("<div class='alert alert-danger'> Failed to process by the server. Error: " + errorMessage+ "</div>");
            return;
        }
        if (serverMove == null) {
            console.log("%s - server - error recording move - invalid game move passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Game Move </div>");
            return;
        }
        // check the game and the player
        if (gameServerInfo == null) {
            console.log("%s = server - error recording move - invalid game passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Game </div>");
            return;
        }

        if (player == null) {
            console.log("%s - server - error recording move - invalid player passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Player </div>");
            return;
        }

        // if the move is already submitted to the local game (by real player or computer) just add to the Move history and 
        if (lastMoveId == serverMove.ClientID) {
            // apend the move to the game history
            appendMoveToGameHisotry(serverMove);
            console.log("%s - server - did not record setting/move in local game for local moveId: %s", getLoggingNow(), lastMoveId);
            return; 
        }
    
            // submit to the local 
        /*    var turn = 'b';
            if (game.turn() == 'a')
                turn = 'w';
            board.move(moveFrom + "-" + moveTo); */

       // submit to the local game if not already submitted by self (drop)

        var ret;
        console.log("%s - server - recording setting/move in local game for server Move ID: %s", getLoggingNow(), serverMove.ClientID);

        if (game.is_in_moving_state()) {
            ret = game.processMove(moveFrom, moveTo, resigned, exchangeRequest);
        }
        else {
            ret = game.processSetting(moveTo);
        }

        // set the board to the game FEN
        board.position(game.fen(), false);


        // apend the move to the game history
        appendMoveToGameHisotry(serverMove);
    }
     /**
     * Hello from server
     */
    gamesHubProxy.client.hello = function() {
        console.log("%s - Hello from server", getLoggingNow());
    };

    gamesHubProxy.client.send = onSendMessage;

    /**
     * returns the status text based on status code
     * @param {any} status
     */
    function getStatusText(status) {
        switch (status) {
            case 0:
                return "Created";
            case 1:
                return "Joined";
            case 2:
                return "Active";
            case 3:
                return "Completed";
            case 4:
                return "Aborted";
            case 5:
                return "Disconnected";
            default:
                return "Unknown";
        }
    }
    function getStatusCss(status) {
        switch (status) {
            case 0:
                return "list-group-item-warning";
            case 1:
                return "list-group-item-success";
            case 2:
                return "list-group-item-success";
            case 3:
                return "list-group-item-info";
            case 4:
                return "list-group-item-info";
            case 5:
                return "list-group-item-danger";
            default:
                return "list-group-item-danger";
        }
    }

    /**
     * sets up the local player info 
     * @param {any} player -- the player
     * @param {any} serverGame -- the game
     */
    function setupLocalPlayer(player, serverGame) {
        if (typeof player == "undefined" || player == null) {
            console.log("%s - setCurrentPlayer - Invalid player passed : ", getLoggingNow());
            return;
        }
        appClientState.player = player;
        

        appClientState.userScreenName = player.Name;

        if (!player.IsSpectator) {
            if (appClientState.userScreenName == serverGame.AttackerName) {
                appClientState.opponentPlayer = serverGame.Defender;
            }
            else {
                if (appClientState.userScreenName == serverGame.DefenderName)
                    appClientState.opponentPlayer = serverGame.Attacker;
            }
        }

        if (typeof serverGame == "undefined" || serverGame == null) {
            console.log("%s - setCurrentPlayer - Invalid game passed : ", getLoggingNow());
            return;
        }
        appClientState.serverGame = serverGame;

        $('#current-game-id').text(serverGame.ID);
        $('#current-game-status').text(getStatusText(serverGame.Status));
        $('#game-attacker').text(serverGame.AttackerName);
        $('#game-defender').text(serverGame.DefenderName);

        // set up the game if the game is not setup 
        if (appClientState.serverGameId == "") {
            setupLocalGame(serverGame);
            appClientState.serverGameId = serverGame.ID;

            setCookie("_nsgid", serverGame.ID);
        }
        else {
            updateLocalGameStatus(serverGame);
        }

        // refresh the myAccount info
        setupMyAccount();
    }
    /**
     * called back when a game is created to the Caller of the started game
     * called back when a game is joined to the Joiner of the game (including spectator)
    */
    gamesHubProxy.client.setCurrentPlayer = setupLocalPlayer;

    // game created
    // all clients get this message with this game info
    gamesHubProxy.client.gameCreated = function (gameInfo) {
        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Created: ", getLoggingNow());
            console.log(gameInfo);
        }
        $('#games-list').append("<a href='#' class='list-group-item list-group-item-warning' id='" + gameInfo.ID + "'> ID: " + gameInfo.ID + " - Status: " + getStatusText(gameInfo.Status) + " - Attacker: " + gameInfo.AttackerName + " - Defender: " + gameInfo.DefenderName + " </a>");

        $('#' + gameInfo.ID).on('click', gameInfo, onGameSelected);       

        checkBoardAndPlayIfComputer();
    };

    // handle when the game is selected by a player. All people will receive a this message
    // we do not all player to reset their game if a spectator just joins the game
    gamesHubProxy.client.gameJoined = function (gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null)
        {
            console.log("%s - gameJoined - Invalid Game passed : ", getLoggingNow());
            return;
        }

        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Joined: ", getLoggingNow());
            console.log(gameInfo);
        }
 
        $('#' + gameInfo.ID).addClass(getStatusCss(gameInfo.Status));     
      
        updateLocalGameStatus(gameInfo);
        setupGameMovesHistory(gameInfo);

        // 
        checkBoardAndPlayIfComputer();
    };

    gamesHubProxy.client.appendMove = function (gameId, move) {
        // double check that this is current move
        appendMoveToGameHisotry(move);
    }

    function setupLocalGame(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - setupLocalGame - Invalid game passed : ", getLoggingNow());
            return;
        }

        resetLocalGame();

        // set the board and the local game with the current game from the server
        var gameState = new Kharbga.ServerGameState(gameInfo.ID, gameInfo.CreatedBy, gameInfo.State, gameInfo.Status);
        gameState.Moves.push(gameInfo.Moves);
        gameState.Players.push(gameInfo.Players);        
        game.setupWith(gameInfo);

        board.position(game.fen(), false);

        // player
        if (game.turn() == 'a')
            $('#player-turn').html("Attacker");
        else
            $('#player-turn').html("Defender");

        updateLocalGameStatus(gameInfo);

        appClientState.serverGameId = gameInfo.ID;

        // setup the move history
        setupGameMovesHistory(gameInfo);
    }

    function updateLocalGameStatus(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - setupLocalGame - Invalid game passed : ", getLoggingNow());
            return;
        }  

        // game state
        $('#current-game-status').text(getStatusText(gameInfo.Status));     
        $('#' + gameInfo.ID).empty().text(" ID: " + gameInfo.ID + " - Status: " + getStatusText(gameInfo.Status) + " - Attacker: " + gameInfo.AttackerName + " - Defender: " + gameInfo.DefenderName);
        $('#' + gameInfo.ID).removeClass('list-group-item-info');
        $('#' + this.ID).addClass(getStatusCss(gameInfo.Status));

        $('#game-attacker').text(gameInfo.AttackerName);
        $('#game-defender').text(gameInfo.DefenderName);
    }

    gamesHubProxy.client.gameDeleted = function (gameInfo) {
        // remove from the games list
        console.log("%s - Game Deleted: ", getLoggingNow());
        console.log(gameInfo);
    };

    /**
     * Refreshes the list of games from the server for display in the homee page
     */
    function refreshGames(e) {
        if (e != null)
             e.preventDefault();
        $('#message').html("<div class='alert alert-info'>Refreshing games from the server...</div>")

        $('#games-list').empty();
        gamesHubProxy.server.getGames().done(function (games) {
            $.each(games, function () {
               // if (this.Status == 0 || this.Status = 1)
                $('#games-list').append("<a href='#' class='list-group-item' id='" + this.ID + "'> ID: " + this.ID + " - Status: " + getStatusText(this.Status) + " - Attacker: " + this.AttackerName + " - Defender: " + this.DefenderName + " </a>");

                $('#' + this.ID).on('click', this, onGameSelected);
                $('#' + this.ID).addClass(getStatusCss(this.Status));             
            });

            $('#message').html("<div class='alert alert-success'>Done refreshing games from the server.</div>")
        });
    }
    // reefresh games from server
    $('#games-link').on('click', refreshGames);
    function onGameSelected(e) {
        e.preventDefault();
        if (loggingOn === true) {
            console.log("%s - onGameSelected: ", getLoggingNow());
            console.log(e);
        }
        var data = e.data;
        ///todo: add check for the type here
        if (e.data == null || typeof e.data === undefined) {
            console.log("%s - onGameSelected - invalid data passed with the entry ", getLoggingNow());
            return;
        }

        // switch view to the Play/View tab
        $('#main-tabs a[href="#home"]').tab('show');   
        $('#message').html("<div class='alert alert-success'>Game is ready on the server</div>");

     
        $('#message').html("<div class='alert alert-success'>Setting up game state based on server data</div>")
        console.log("Setting up game state based on server data");
   
        var spectator = false;
           
        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.userScreenName, data.ID, spectator);                  

        // init the local game with the given server game data    
        resetLocalGame();  // server will sen
        // update the game view with the given game
    }

    $('#connections-link').on('click', refreshConnections);
    function refreshConnections(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing connections from the server...</div>");
        $('#connections-table').empty();
        var result = nsApiClient.appService.getConnections({ "active": null }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>returned connections successfully. </div>");
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
                $.each(data, function () {
                    if (first) {
                        // append the header
                        html += "<thead><tr>";
                        html += ("<th>ID</th>");
                        html += ("<th>User Name</th>");
                        html += ("<th>Connected</th>");
                        html += ("<th>Created On</th>");
                        html += "</tr></thead><tbody>";
                        first = false;
                    }

                    html += "<tr>";
                    html += ("<td>" + this.ID + "</td>");
                    html += ("<td>" + this.UserName + "</td>");
                    html += ("<td>" + (this.Connected ? "Yes" : "No") + "</td>");
                    html += ("<td>" + this.CreatedOn + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";

                $('#connections-table').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive connections from the server. Errors: " + status.responseText + " </div>");
                $('#connections-list').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }
    $('#players-link').on('click', refreshPlayers);
    /**
     * returns the list of active players (cached) from the server
     */
    function refreshPlayers(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing players from the server...</div>");

        $('#players-table').empty();

        var result = nsApiClient.appService.getPlayers({ "active": null }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>Returned players successfully. </div>");
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
                $.each(data, function () {
                    if (first) {
                        // append the header
                        html += "<thead><tr>";
                        html += ("<th>Name</th>");
                        html += ("<th>Is Spectator</th>");
                        html += ("<th>Is Attacker</th>");
                        html += ("<th>Current Game ID</th>");
                        html += ("<th>Current Connection ID</th>");
                        html += "</tr></thead><tbody>";
                        first = false;
                    }

                    html += "<tr>";
                    html += ("<td>" + this.Name + "</td>");
                    html += ("<td>" + (this.IsSpectator == true ? "Yes" : "No") + "</td>");
                    html += ("<td>" + (this.IsAttacker == true ? "Yes" : "No") + "</td>");
                    html += ("<td>" + this.CurrentGameId + "</td>");
                    html += ("<td>" + (this.CurrentConnection != null ? this.CurrentConnection.ID : "") + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";
                $('#players-table').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive connections from the server. Errors: " + status.responseText + " </div>");
                $('#players-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
     }

    $('#system-games-link').on('click', refreshGames2);
    /**
     * returns the list of active games (cached) by the server
     */
    function refreshGames2(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-waring'>Refreshing active games from the server...</div>");
        $('#games-table').empty().html('');

        var result = nsApiClient.appService.getGames({ "active": null }, function (data, status) {
            if (data != null) {
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
                $.each(data, function () {
                    if (first) {
                        // append the header
                        html += "<thead><tr>";
                        html += ("<th>ID</th>");
                        html += ("<th>Attacker</th>");
                        html += ("<th>Defender</th>");
                        html += ("<th>Status</th>");
                        html += ("<th>State</th>");
                        html += ("<th>FEN</th>");
                        html += "</tr></thead><tbody>";
                        first = false;
                    }

                    html += "<tr>";
                    html += ("<td>" + this.ID + "</td>");
                    html += ("<td>" + this.AttackerName  + "</td>");
                    html += ("<td>" + (this.DefenderName ) + "</td>");
                    html += ("<td>" + getStatusText(this.Status) + "</td>");
                    html += ("<td>" + Kharbga.GameState[this.State] + "</td>");
                    html += ("<td>" + this.FEN + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";
                $('#games-table').html(html);
                $('#system-message').html("<div class='alert alert-success'>Done refreshing games from the server. </div>");
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive the active games from the server. Errors: " + status.responseText + " </div>");
                $('#games-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }

    function setupGameMovesHistory(serverGame) {

        if (serverGame == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game </div>");
        }
        $('#game-moves-history').empty();

        var html = "<table  class='table table-responsive'><thead>";
        // append the header
        html += "<thead><tr>";
        html += ("<th>Number</th>");
        html += ("<th>Player</th>");
        html += ("<th>Is Attacker</th>");
        html += ("<th>Is Setting</th>");
        html += ("<th>From</th>");
        html += ("<th>To</th>");
        html += ("<th>Resigned</th>");
        html += ("<th>Exchange Request</th>");
        html += ("<th>Before FEN <br>");
        html += ("After FEN <br>");
        html += ("Message</th>");
        html += "</tr></thead><tbody id='game-moves-history-table'>";
       
        $.each(serverGame.Moves, function () {
            html += "<tr>";
            html += ("<td>" + this.Number + "</td>");
            html += ("<td>" + this.PlayerName + "</td>");
            html += ("<td>" + (this.IsAttacker == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.IsSetting == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.From) + "</td>");
            html += ("<td>" + (this.To) + "</td>");
            html += ("<td>" + (this.Resigned == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.ExchangeRequest == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.BeforeFEN) + "<br>");
            html += ("" + (this.AfterFEN) + "<br>");
            html += ("" + (this.Message) + "</td>");
            html += "</tr>";

        });

        html += "</tbody></table>";
        $('#game-moves-history').html(html);     
    }

    /**
     * Appends the given move to the game history
     * @param {any} move - move information from the server
     */
    function appendMoveToGameHisotry(move) {

        if (move == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game move </div>");
        }
        var html = "";
        html += "<tr>";
        html += ("<td>" + move.Number + "</td>");
        html += ("<td>" + move.PlayerName + "</td>");
        html += ("<td>" + (move.IsAttacker == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.IsSetting == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.From) + "</td>");
        html += ("<td>" + (move.To) + "</td>");
        html += ("<td>" + (move.Resigned == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.ExchangeRequest == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.BeforeFEN) + "<br>");
        html += ("" + (move.AfterFEN) + "<br>");
        html += ("" + (move.Message) + "</td>");
        html += "</tr>";

        $('#game-moves-history-table').append(html);
    }
    /**
   * handler for the Post message request
   */
    function onPostMessage() {
        if (loggingOn === true) {
            console.log("%s - onPostMessage: ", getLoggingNow());
            console.log(gameInfo);
        }
    }
    // base hub messages
    gamesHubProxy.client.joined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s joined on %s ', getLoggingNow(), connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server connected " + connectionInfo.ID + "</li>");
        }
    };
    gamesHubProxy.client.left = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s left at %s ', getLoggingNow(), connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server disconnected " + connectionInfo.ID + " - " + connectionInfo.UserName + "</li>");
        }
    };
    gamesHubProxy.client.rejoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s rejoined on %s ', getLoggingNow(), connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + ": server rejoined " + connectionInfo.ID + "</li>");
        }
    };
    gamesHubProxy.client.pong = function (connectionId, serverTime) {
        if (connectionId !== $.connection.hub.id) {
            console.log('%s - server: INVALID pong from %s received on: %s', getLoggingNow(), connectionId, JSON.stringify(serverTime));
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> server: INVALID pong from " + connectionId + " received on:" + new Date().toLocaleTimeString() + " - server time " + serverTime + "</li>");
        }
        else {
            // check if equal to self
            console.log('%s - server: pong from %s received on: %s', getLoggingNow(), connectionId, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + " pong received from " + connectionId + "</li>");
        }
    };

    function startSignalR() {
        $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
            .done(function () {
                gamesHubProxy.server.hello();
                if (loggingOn === true)
                    console.log('%s - startSignalR - connected, connection ID: %', getLoggingNow(), $.connection.hub.id);

                appClientState.serverConnectionId = $.connection.hub.id;

                // 
                checkSessionCookie();   
                // moves the setup of the games on startup at the end of the checking session proess
            })
            .fail(function () { console.log('%s - startSignalR Could not Connect!', getLoggingNow()); });
    }

    $.connection.hub.disconnected(function () {
        setTimeout(function () {
            console.log('%s - RestartSignalR after disconnect!', getLoggingNow());
            startSignalR();
        }, 3000); // Restart connection after 3 seconds.
    });

    startSignalR();

  

    $('#submitMove').on('click', function onSubmit() {
        /*
        gamesHubProxy.server.recordMove("testGameId", myConnectionId, "testMove").done(function () {
            console.log('server Invocation of recoredMove');
        })
        .fail(function (error)
        {
            console.log('Invocation of recordMove failed. Error: ' + error);
        });
        */
    });

    $('#ping-link').on('click', function () {
        gamesHubProxy.server.ping();  
    });


    function setCookie(key, value) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
    }

    function getCookie(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        return keyValue ? keyValue[2] : null;
    }

    ///todo: automatic setup of an active game
    function setupGames(activeGameId) {
        // refresh games from the server
        refreshGames();

        // set the game state
        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#message').html("<div class='alert alert-info'>Click on Start New Game button to start a new game on this computer between two players</div>")

       // issue with Kendo UI and jQuery incom. with versions after 1.7

       // setupTeamsComboBox();

        setupTeamsHtml5Combobox();
    }

    function setupFormsValidation() {
        $('#login-form').validate();
        $('#register-form').validate();
    }
    function setupTeamsHtml5Combobox(){
        $("#register-team").on('keyup', function () {
            var result = nsApiClient.clientService.getClients(appClientState.sessionId, this.value, function (data, status) {
                if (data != null) {
                    //   $('#appInfo').html(JSON.stringify(data));
                    $("#register-team-list").empty();
                    $.each(data, function () {
                        // if (this.Status == 0 || this.Status = 1)
                        $("#register-team-list").append("<option id=client_'" + this.SystemId + "' value='" + this.Name + "' ></option>");
                    });
                }
                else {
                    $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
                }
            });

        });
    }

    function setupTeamsComboBox() {

        var teams = $("#register-team").kendoComboBox({
            filter: "contains",
            placeholder: "Select Team...",
            dataTextField: "Name",
            dataValueField: "ID",
            dataSource: {
                type: "json",
                serverFiltering: true,
                transport: {
                   read: {
                       url: teamsUrl ,
                       type: "get"
                    }
                }
            }
        }).data("kendoComboBox");
    }
   
    function resizeGame(e) {
        board.resize(e);

        if (game.is_in_setting_state() === true)
            boardEl.find('.square-d4').addClass('highlight-malha');
        else
            boardEl.find('.square-d4').removeClass('highlight-malha');

        if (appClientState.serverGame != null) {
            $('#game-attacker').text(appClientState.serverGame.AttackerName);
            $('#game-defender').text(appClientState.serverGame.DefenderName);
        }
    }
    // handler for resizing
    $(window).resize(resizeGame);

    setupMyAccount();
    setupFormsValidation();
}; // end init()
$(document).ready(init);