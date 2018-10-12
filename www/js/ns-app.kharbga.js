/* Kharbga App Object */
var KharbgaApp = function () {
    // the board game and ui element
    var board,
        boardEl = $('#board');

    // signalR communications
    var gamesHubProxy = null;

    // flag for turning on/off logging 
    var loggingOn = true; 
    
    /**
     * play options on the computer
     */
    var playOptions = {
        useServer : false,
        playOnSameComputerWithOpponent: true,
        randomSetting: true,
        firstSettingMustIncludeMalhaAdjacent: true,
        randomMove: true,
        searchMovesThatCaptureOpponent: true,
        searchMovesThatSaveSelf: true,
        preferMovesThatCaptureOverMovesThatSave: true,
        displayGameOverDialog: false

    };

    // local user - a player (attacker or defender) or spectator
    var user = {
        name:"Guest",
        isAttacker:true,
        isSpectator:false,
        reset: function(){
            this.name = "Guest";
            this.isAttacker= true;
            this.IsSpectator = false;
        },
        update: function(player){
            if (player == null)
            {
                log("null player");
                return;
            }
            this.name = player.name;
            this.isAttacker = player.isAttacker;
            this.isSpectator = player.isSpectator;
        } 
    };
  
    // defines the local game state 
    var gameState = new Kharbga.GameInfo();

    // the client state
    var appClientState = {
        sessionId: "", 
        role: 0,      //  unknown, attacker, defender, spectator
        loggedIn: false,     
        loaded: false,
        firstComputerSetting: true,
        computerIsPlaying: false,
        selectedSource: "",      // indicates that the user has a selected a source for setting or moving
        moveSourceRequired : "", // the move source required 
        signalReInitialized: false,
        activeGame: false,  // indicates that a game is progress
        lastReplayPosition: -1,
        useServer : false,  // turn on when wanting to store the data and interact with the server
        backgroundJobId: -1 // the background computer player timer
        
    };
    // the last move info
    var lastMove = {
        isAttacker: true,
        isSetting: true,
        fromRequired: "", 
        from: "",
        to : "",
        captured: "",
        exchanged: "",
        resigned: false,
        exchangeRequest: false
    };
    // the current move info
    var currentMove ={
        isAttacker: true,
        isSetting: true,
        fromRequired: "", 
        from: "",
        to: "",
        captured: "",
        exchanged: "",
        resigned: false,
        exchangeRequest: false,
        reset: function () {
            currentMove.isSetting = null;
            currentMove.isAttacker = null;
            currentMove.fromRequired = ""; 
            currentMove.from = "";
            currentMove.to = "";
            currentMove.captured = "";
            currentMove.exchanged = "";
            currentMove.resigned = false;
            currentMove.exchangedRequest = false;
        },
        copyToLast: function () {
            lastMove.fromRequired = currentMove.fromRequired;
            lastMove.from = currentMove.from;
            lastMove.to = currentMove.to;
            lastMove.isAttacker = currentMove.isAttacker;
            lastMove.isSetting = currentMove.isSetting;
            lastMove.exchanged = currentMove.exchanged;
            lastMove.captured = currentMove.captured;
            lastMove.resigned = currentMove.resigned;
            lastMove.exchangeRequest = currentMove.exchangeRequest;
        },
        copyToLastAndReset: function () {
            currentMove.copyToLast();
            currentMove.reset();
        }
    };

    var userOptions = {
        highlightLastMove: true,
        highlightLastMoveMilliSecondsBeforeTimeout: 2000,
        displayLastMove: true
    };

    /* the game events */
    /**
     * Handler for the local engine when a new game is started
     * @param {any} eventData -- the event data
     */
    function onNewGameStarted(eventData) {
        if (loggingOn) 
            console.log("%s - event: onNewGameStarted - source: %s ", getLoggingNow(), eventData.source.fen());

        $('#message').html("<div class='alert alert-success'>Started a new game.  </div>");

        appClientState.activeGame = true;
        $('#currentGamePanel').show();

        // update the board with current game state
        updateBoard(eventData.source);

        if (userOptions.displayLastMove)
            currentMove.copyToLastAndReset();

        
     
    }
    /**
     * private event handler when a new player turn
     * @param {any} eventData: the event data
     */
    function onNewPlayerTurn(eventData) {
        if (loggingOn)
            console.log("%s - event: onNewPlayerTurn - player: %s", getLoggingNow(), eventData.player);

        $('#player-turn').html(eventData.player.name);

        var message = "<div class='alert alert-success'>It is the turn  of the <strong>" +
            eventData.player.name;
      
        if (user != null && !user.isSpectator)  {
            if (user.isAttacker === true && game.turn() == 'a')
                message += " (Your turn) ";

            if (user.isAttacker === false && game.turn() == 'd')
                message += " (Your turn) ";
        }

        message += "</strong> to play </div>";
        $('#message').html(message);
       
        $("#move-message").val('');  // clears the last move message

        updateBoard(eventData.source);
        currentMove.copyToLastAndReset();

        if (userOptions.highlightLastMove) {
            setTimeout(function () {
                removeSelectedCells();
                removeLastMoveHighlighting();
            },userOptions.highlightLastMoveMilliSecondsBeforeTimeout);           
        }

        //setTimeout(checkBoardAndPlayIfComputer,1000);            
    }
  
    /**
     * handler for when a setting is completed
     * @param {any} eventData: the event data
     */
    function onNewSettingCompleted(eventData) {
        if (loggingOn)
            console.log("%s - event: onNewSettingCompleted - cell %s ", getLoggingNow(), eventData.targetCellId);
        currentMove.isSetting = true;
        if (game.turn() == 'a') {
            $('#attackerSettings').append($('<option>', {
                value: game.getAttackerScore(),
                text: eventData.targetCellId
            }));
            currentMove.isAttacker = true;
        }
        else {
            $('#defenderSettings').append($('<option>', {
                value: game.getDefenderScore(),
                text: eventData.targetCellId
            }));
            currentMove.isAttacker = false;
        }
        var message = "<div class='alert alert-success'>It is the turn  of the <strong>" + eventData.player.name;

     // Indicator for local player that it is their turn   
        if (!user.isSpectator){
            if (user.isAttacker === true && game.turn() == 'a')
                message += " (Your turn) ";

            if (user.isAttacker === false && game.turn() == 'd')
                message += " (Your turn) ";
        }

        message+=" </strong>to set the 2nd piece. </div>";
        $('#message').html(message);

        updateBoard(eventData.source);

        currentMove.from = "spare";
        currentMove.to = eventData.targetCellId;
   
        /* highlight the previous move */
        var source = boardEl.find('.square-' + eventData.targetCellId);
        source.addClass('highlight-move');
       
        //setTimeout(checkBoardAndPlayIfComputer,1000);      
    }

    /**      
    * Checks if it is the local player turn or not - if playing with
    * @param {any} player: the local player
    * @param {any} game: the game to check
    * @returns true or false
    */
    function isLocalPlayerTurn(){
   
        if (user.isSpectator)
            return false;

        if (user.isAttacker === true && game.turn() == 'a')
            return true;

        if (user.isAttacker === false && game.turn() == 'd')
            return true;

        return false;
    }

    /**
     * Handler for when the settings phase is completed
     * @param {any} eventData: the event data
     */
    function onSettingsCompleted(eventData) {
        console.log("%s - event: onSettingsCompleted - final board state: %s", getLoggingNow(), eventData.source.fen());

       var message = "<div class='alert alert-success'>The setting phase is now completed.  It is the Attacker turn to move a piece to the middle cell. <strong>";

     /* Check if it is local player turn 
     */
        message += " </strong></div>";
        $('#message').html(message);


        $('#state').html(toDisplayString(Kharbga.GameState[eventData.source.getState()]));

        updateScores(eventData.source);

        // display the exchange request fields
        $('.exchangeRequest').show();

        boardEl.find('.square-d4').removeClass('highlight-malha');

       //setTimeout(checkBoardAndPlayIfComputer,1000);      
    }

    /**
     * Handler for when a new move is started
     * @param {any} eventData: the event data
     */
    function onNewMoveStarted(eventData) {
        // not used 
    }

    /**
     * handler for when a move is completed
     * @param {any} eventData: the event data
     */
    function onNewMoveCompleted(eventData) {
        console.log("%s - event: onNewMoveCompleted - game position: %s - from: %s - to: %s  ",
            getLoggingNow(), eventData.source.fen(), eventData.from.id, eventData.to.id);

        currentMove.isSetting = false;
        currentMove.from = eventData.from.id;
        currentMove.to = eventData.to.id;

        // remove source highlighting
         var sourceRequired = boardEl.find('.highlight-source');
         sourceRequired.removeClass('highlight-source');

        boardEl.find('.highlight-captured').removeClass('highlight-captured');

        /* highlight the previous move */
        var source = boardEl.find('.square-' + eventData.from.id);
        source.addClass('highlight-move');
        var target = boardEl.find('.square-' + eventData.to.id);
        target.addClass('highlight-move');

        
        updateBoard(eventData.source);

        if (game.turn() == 'a') {
            $('#attackerMoves').append($('<option>', {
                value: game.getAttackerMoveNumber(),
                text:  eventData.from.id + '-' + eventData.to.id
            }));
            currentMove.isAttacker = true;
        }
        else {
            $('#defenderMoves').append($('<option>', {
                value: game.getDefenderMoveNumber(),
                text: eventData.from.id + '-' + eventData.to.id
            }));
            currentMove.isAttacker = false;
        }      

        appClientState.moveSourceRequired = ""; // clear it
    }

    /**
     * Handler for when a move is completed and the same player must continue moving using the same piece
     * @param {any} eventData: the event data
     */
    function onNewMoveCompletedContinueSamePlayer(eventData) {
        console.log("%s - event: onNewMoveCompletedContinueSamePlayer - source: %s - from %s - to: %s ",
            getLoggingNow(), eventData.source.fen(), eventData.from.id, eventData.to.id);

        $('#message').html("<div class='alert alert-success'>Same player must continue playing using the same soldier now on: <strong> " +
            eventData.targetCellId  + "</strong>. There are still pieces that could be captured.  </div>" );

        currentMove.isSetting = false;
        currentMove.copyToLast();
        currentMove.fromRequired = eventData.targetCellId;
        // player must play this piece   
     
        var moveSourceRequired = eventData.targetCellId;
        // highlight the piece required for moving
        var sourceRequired = boardEl.find('.square-' + moveSourceRequired);
        sourceRequired.addClass('highlight-source');

        updateScores(eventData.source);

        if (game.turn() == 'a') {
            $('#attackerMoves').append($('<option>', {
                value: game.getAttackerMoveNumber(),
                text: eventData.from.id + '-' + eventData.to.id
            }));
            currentMove.isAttacker = true;
        }
        else {
            $('#defenderMoves').append($('<option>', {
                value: game.getDefenderMoveNumber(),
                text: eventData.from.id + '-' + eventData.to.id
            }));
            currentMove.isAttacker = false;
        }

        appClientState.moveSourceRequired = moveSourceRequired;
        //setTimeout(checkBoardAndPlayIfComputer,1000,moveSourceRequired);      
      //  checkBoardAndPlayIfComputer(moveSourceRequired);
    }

    /**
     * handler for the player selecting a cell and not moving and staying the same cell. This could indicate a player
     * selecting a piece for exchange
     * @param {any} eventData -- the action data
     */
    function onNewMoveCanceled(eventData) {
        console.log("%s - event: onNewMoveCanceled - target Cell Id: %s ", getLoggingNow(), eventData.targetCellId); 
    }

    /**
     * Handler for an invalid move
     * @param {any} eventData - the event data
     */
    function onInvalidGameMove(eventData) {
        console.log("%s - event: onInvalidMove - source: %s - from %s - to: %s ",
            getLoggingNow(), eventData.source.fen(), eventData.from.id, eventData.to.id);
    }

    /**
     * Handler for when the game is over
     * @param {any} eventData - the game event info
     */
    function onWinnerDeclared(eventData) {
        console.log("%s - event: onWinnerDeclared - winner: %s ", getLoggingNow(), eventData.player);
        $('#message').html("<div class='alert alert-success'><strong>Game Over. Winner is: " + eventData.player.name + " </strong></div>");

        $('#state').html(toDisplayString(Kharbga.GameState[eventData.source.getState()]));

        updateBoard(eventData.source);

        currentMove.copyToLastAndReset();
        currentMove.reset();

        if (userOptions.highlightLastMove) {
            setTimeout(function () {
                removeSelectedCells();
                removeLastMoveHighlighting();
            }, userOptions.highlightLastMoveMilliSecondsBeforeTimeout);
        }
       // $('#startGameBtn').show();
       // $('#loadSetting1').hide();    
       
       // turn off the background computer thread
        if (typeof applicationCache.backgroundJobId == "number" && applicationCache.backgroundJobId > 0)
            clearInterval(appClientState.backgroundJobId);
    }

    /**
     * Handler when an untouchable soldier is selected
     * @param {any} eventData - the event data
     */
    function onUntouchableSelected(eventData) {
        console.log("%s - event: onUntouchableSelected - cell: %s", getLoggingNow(), eventData.targetCellId);
     
        var exchangeSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangeSquare.addClass('highlight-exchange');

        updateMoveFlags(eventData.source.move_flags());

    }

    /**
     * Handler for when  an exchange request is canceled
     * @param {any} eventData - the event data
     */
    function onUntouchableExchangeCanceled(eventData) {
        console.log("%s - event: onUntouchableExchangeCanceled - source: %s ", getLoggingNow(), eventData.source);
        $('#message').html("<div class='alert alert-warning'>Exchange Request Canceled</div>");

        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
    }

    /**
     * Handler for when an exchange request is completed
     * @param {any} eventData - the event data
     */
    function onUntouchableExchangeCompleted(eventData) {
        console.log("%s - event: onUntouchableExchangeCompleted - source: %s ", getLoggingNow(),eventData.source);
        $('#message').html("<div class='alert alert-success'>Exchange Request Completed</div>");


     //   board.position(game.fen(), false);
        updateScores(eventData.source);
        var moveFlags = game.move_flags();
        updateMoveFlags(moveFlags);

        // remove the highlighting after a couple of seconds
        setTimeout(removeLastMoveHighlighting, 2000);
    }

    /**
     * Handler for when a player sets on the Malha during setting mode
     * @param {any} eventData - the event data
     */
    function onInvalidSettingMalha(eventData) {
        console.log("%s - event: onInvalidSettingMalha - targetCellId: %s ", getLoggingNow(), eventData.targetCellId);
        $('#message').html("<div class='alert alert-danger'>Setting on middle cell (Malha) is not allowed</div>");

    }

    /**
     * Handler for when a player sets on an occupied cell
     * @param {any} eventData - the event data
     */
    function onInvalidSettingOccupied(eventData) {
        console.log("%s - event: onInvalidSettingOccupied - targetCellId: %s ", getLoggingNow(), eventData.targetCellId);

        $('#message').html("<div class='alert alert-danger'>Setting on an occupied cell is not allowed</div>");
    }

    /* Board Events */
    function onInvalidMove(eventData) {
        console.log("%s - board event: onInvalidMove - target: %s - type : %s ",
            getLoggingNow(), eventData.targetCellId, Kharbga.BoardMoveType[eventData.type]);

        $('#message').html("<div class='alert alert-danger'>Invalid Move " + Kharbga.BoardMoveType[eventData.type] +" </div>");
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

        $('#move-captured').append(" " + eventData.targetCellId);
        currentMove.captured += " ";
        currentMove.captured += eventData.targetCellId;

        updateBoard(game);
    }

    function onExchangedPiece(eventData) {
        console.log("%s - board event: onExchangedPiece - target: %s", getLoggingNow(), eventData.targetCellId);

    
        var exchangedSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangedSquare.addClass('highlight-exchange');

        $('#move-exchanged').append(" " + eventData.targetCellId);
        currentMove.exchanged += " ";
        currentMove.exchanged += eventData.targetCellId;

        updateBoard(game);

    }

    function onPlayerPassed(eventData) {
        console.log("%s - board event: onPlayer Passed - target: %s ", getLoggingNow(), eventData.player.Name);
        $('#message').html("<div class='alert alert-warning'>Player passed - Player: " + eventData.player.Name + " </div>");
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
        playerPassedEvent: onPlayerPassed,
        moveProcessed: onMoveProcessed,
    };

    // Setup the board events
    var boardEvents = {
        invalidMoveEvent: onInvalidMove,
        validMoveEvent: onValidMove,
        capturedPieceEvent: onCapturedPiece,
        exchangedPieceEvent: onExchangedPiece

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
        // check if settings is over and selected piece is spare
        if (game.game_setting_over() === true && source === 'spare') {
            $('#message').html("<div class='alert alert-warning'>Game setting is done. You could only move pieces on the board now.</div>");
            return false;
        }

        // check if setting is not over and selected piece is on the board
        if (game.game_setting_over() === false && source !== 'spare') {
            $('#message').html("<div class='alert alert-warning'>You are not allowed to move pieces on the board until the game setting is completed.</div>");

            return false;
        }

        if (!allowedToMove())
              return; 

        return validSource(source, piece);
    };

    /**
     * Checks if the local user and game and see if ok to make a move 
     */
    function allowedToMove() {
        if (game.game_over() === true)
            return false;     

        if (user == null) {
            $('#message').html("<div class='alert alert-info'>Please start or join a game to be able to play.</div>");
            return false;
        }
        if (user.isSpectator === true) {
            $('#message').html("<div class='alert alert-warning'>As a spectator you are not allowed to make any moves. You could however post comments to the players.</div>");
            return false;
        }
        // check if allowed to make the move
        if (game.turn() === 'a' && user.isAttacker !== true) {
            $('#message').html("<div class='alert alert-warning'>It is the attacker's turn to play.</div>");
            return false;
        }
        if (game.turn() === 'd' && user.isAttacker !== false) {
            $('#message').html("<div class='alert alert-warning'>It is the defender's turn to play.</div>");
            return false;
        }
   
        return true;
    }


    /**
     * checks if the source square is valid depending on the current game state
     * @param {any} source -- the selected square
     * @param {any} piece  -- the piece selected
     */
    function validSource(source, piece) {
        if (source == "" || source == "spare")
        {
            if (game.is_in_moving_state() === false)
                return true;
            else
                return false; 
        }

        if (game.is_in_moving_state() === true) {        
            // check if selected is occupied by current player
            if (game.is_occupied_current_player(source) === false) {
                $('#message').html("<div class='alert alert-warning'>Cell <strong>"+ source + "</strong> is not occupied by a solider. You could only move using your soldiers.</div>");

                return false;
            }

            // check if source piece is surrounded -- return false
            if (game.is_surrounded_piece(source) === true) {
                $('#message').html("<div class='alert alert-warning'>You could only move pieces that have free/open adjacent cells.</div>");

                return false;
            }

            var moveSourceRequired = game.move_source_required();
            // check if a given source piece must be played
            if (moveSourceRequired.length != 0 && source !== moveSourceRequired) {
                $('#message').html("<div class='alert alert-info'>Please continue moving using solider on " + moveSourceRequired + "</div>");
                return false;
            }
        }

        return true;
    }

    /**
     * Handler for when a piece is dropped on the board
     * @param {any} source -- source location
     * @param {any} target -- target location
     * @param {any} piece  -- the piece selected
     * @param {any} newPos -- the new position
     * @param {any} oldPos -- the old position of the board
     * @param {any} orientation -- the board orientation
     */
    var onDrop = function(source, target, piece, newPos, oldPos, orientation) {
        console.log("onDrop - from: %s - to: %s ", source, target);

        clearLastMoveInfo();
        $('#gameMove').html(source + "-" + target);
       
        var ret = processAction(source, target);
        // updateStatus();
        if (ret == false) return 'snapback';
    };

    /**
     * Process the user action
     * @param {any} source -- the source piece
     * @param {any} target -- the target piece
     */
    function processAction(source, target) {
        var ret = false;
        var gameMove = {};

        gameMove.message = $("#move-message").val();

        gameMove.resigned = $('#resign-checkbox').is(':checked');
        gameMove.exchangeRequest = false;
        gameMove.isAttacker = false;
        if (game.turn() == 'a') {
            gameMove.exchangeRequest = $('#exchangeRequestAcceptedCheckbox').is(':checked');
            gameMove.isAttacker = true;
        }
        else {
            gameMove.exchangeRequest = $('#exchangeRequestCheckbox').is(':checked');
        }
        gameMove.isSetting = false;

        gameMove.beforeFen = game.fen();
        gameMove.from = source;
        gameMove.to = target;

        if (game.is_in_moving_state()) {
            if (source == target)
            {
                removeSelectedCells(); 
                appClientState.selectedSource = "";

                return false;  // same cell is selected
            }

            // check if valid move
            if (game.valid_move(source, target) === false) {

                removeSelectedCells();
                appClientState.selectedSource = "";
                $('#message').html("<div class='alert alert-warning'>Invalid move from " + source + " to " + target +". You may only move your soldiers to adjacent free cells orthogonally and not diagonally.</div>");
    
                return false;
            }

            ret = game.processMove2(gameMove, gameEvents);
        }
        else {
            if (game.is_in_setting_state()) {
                gameMove.isSetting = true;
                ret = game.processSetting(target);
                onMoveProcessed(ret, gameMove);
            }
            else {
                ret = false;
            }
        }

        return ret; 
    }

    /**
     * Callback for when the action is processed
     * @param {any} ok - the processing status
     * @param {any} gameMove - the move is processed
     */
    function onMoveProcessed(ok, gameMove) {
        if (ok === false)
            return;

        // complete the move and return if not using the server
        if (!appClientState.useServer)
        {
            completeMoveProcessed();
            return;
        }
    
        // start signalR if not initialized
        if (!appClientState.signalReInitialized) 
            startSignalR();

        lastMoveId = createMoveId();
        // submit to the server
        if (gameState.id != "" && appClientState.useServer === true) {
            // notify server pf the setting
            gamesHubProxy.server.recordMove(appClientState.sessionId,gameState.id, 
                user.name,
                gameMove.isAttacker, gameMove.isSetting, gameMove.from, gameMove.to, 
                gameMove.resigned, gameMove.exchangeRequest,
                gameMove.beforeFen, game.fen(), gameMove.message, lastMoveId,
                lastMove.captured, lastMove.exchanged
            ).done(function () {
                console.log('%s - Done server Invocation of recordedMove ( moveId : %s)', getLoggingNow(), lastMoveId);
                completeMoveProcessed();

            })
                .fail(function (error) {
                    console.log('%s - Invocation of recordMove ( moveId : %s) failed. Error: %s ', getLoggingNow(), lastMoveId, error);
                });
        }
        else {
            completeMoveProcessed(); // complete the move without the server
        }
    }

    function completeMoveProcessed() {
        $("#user-message").text("");
        $("#move-message").text("");
        // 
        //play sound here
        playSound();  // good one

        // good place to reset the current move
        // check if game is over
        if (game.game_over()) {
            updateBoard(game);
            updateBoardInfo();
            // trigger server updating the game status into the server
            if ($ && $.appViewHandler!= null){
                $.appViewHandler.displayGameOver();
            }
            saveGame(game);
        }
    }

    var onMoveEnd = function () {     
        //updateBoard()
    };

    
    
    /**
     * handler for when click  a cell for setting or for a move (from or to)
     * @param {any} square -- the clicked square
     * @param {any} piece  -- the piece on the square
     * @param {any} position -- current game position
     * @param {any} orientation -- the game orientation 
     */
    var onClick = function (square, piece, position, orientation) {
        console.log("%s - onClick - square: %s - piece: %s ", getLoggingNow(), square, piece);

        // check if allowed to move
        if (!allowedToMove())
            return;

        var source = "";
        if (game.is_in_moving_state()) {
            if (appClientState.selectedSource == "") {
                // Checks if the square is valid
                if (!validSource(square, piece))
                    return;
                appClientState.selectedSource = square;
                removeSelectedCells(); // from the previous move
                $('#message').html("<div class='alert alert-success'>Selected cell <strong> " + square + " </strong>for moving...</div>");
                // highlight square
                highlightSelected(square);
                return;
            }
            source = appClientState.selectedSource;
        }
        else {
            source = "spare";
        }

        var target = square;
        if (source == target) {
            $('#message').html("<div class='alert alert-success'>Canceled cell selection for square <strong> " + appClientState.selectedSource + " </strong>for moving...</div>");
            removeSelectedCells(); // from the previous move
            appClientState.selectedSource = "";
            return;
        }

        // Checks if the source is valid
        //   if (!validSource(source, piece))
        //       return;

        //to do : add check for target
        highlightTarget(square);
        $('#move-captured').empty();
        $('#move-exchanged').empty();

        var ret = processAction(source, target);

        if (ret) {
            $('#gameMove').html(source + "-" + target);

            setTimeout(updateBoard, 200,game);  // update the board after handling on Click event
            //   updateBoard();
            //    removeSelectedCells();
        }
        appClientState.selectedSource = ""; //reset after the move
    };

    /**
       * handler for when double clicking a cell for setting or for a move (from or to)
       * @param {any} target -- the target square
       * @param {any} piece  -- the piece on the square
       * @param {any} position -- current game position
       * @param {any} orientation -- game orientation 
       */
    var onDoubleClick = function (target, piece, position, orientation) {
        console.log("%s - onDoubleClick - target: %s - piece: %s ", getLoggingNow(), target, piece);

    };

    function highlightSelected(square) {
        var squareEl =  boardEl.find('.square-' + square);
        squareEl.addClass('highlight-move');

        //   var background = '#a9a9a9';
        //  if (squareEl.hasClass('black-3c85d') === true) {
        //    background = '#696969';
        //   }

        //   squareEl.css('background', background);
    }
    function highlightTarget(square) {
        var squareEl = boardEl.find('.square-' + square);
        squareEl.addClass('highlight-move');

        var background = '#a9a9a9';
        if (squareEl.hasClass('black-3c85d') === true) {
            background = '#696969';
        }

     //   squareEl.css('border-color', background);
    }

    var removeSelectedCells = function () {
      
        boardEl.find('.highlight-move').removeClass('highlight-move');

     //   boardEl.find('.highlight-move').css('background', '#f0d9b5');// default color
    };

    var removeLastMoveHighlighting = function () {
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        boardEl.find('.highlight-source').removeClass('highlight-source');
        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

    };
    var lastMoveId = "";

    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var createMoveId = function () {
        return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
            var r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }; 
    var createGameId = function () {
        return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
            var r = Math.random() * 16 | 0;
            return r.toString(16);
        });
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
        // console.log("upper: %s,lower: %s, num: %s, floor num: %s, ceil num: %s, round num: %s", lower, upper, num, Math.floor(num), Math.ceil(num), Math.round(num));
        return Math.floor(num);
    }

    /**
      * Identifies the local player role based on the app state
      */
    function getLocalPlayerRole() {
        if (user == null) return "null";
        if (user.isSpectator) return "Spectator";

        if (user.isAttacker) return "Attacker";
        else
            return "Defender";
    }

    /**
     * Identifies the local player opponent role based on the app state
     * @returns the computer role in the current game
     */
    function getComputerRole() {
        var computer = null;
        if (gameState.attacker.isSystem)
            computer = gameState.attacker;
        else if (gameState.defender.isSystem) 
            computer = gameState.defender;

        if (computer == null)
            return "null";
        if (computer.isSystem === false)
            return "Not Involved";
        if (computer.isAttacker) return "Attacker";
        else 
            return "Defender";
    }

    /**
     * Checks the board and play a move if its the computer turn
     */
    function checkBoardAndPlayIfComputer() {
        console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s",
            getLoggingNow(), getComputerRole(), game.turn());
        if (appClientState.computerIsPlaying === true) {
            console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - computer is playing - returning",
                getLoggingNow(), getComputerRole(), game.turn());
            return;
        }
        if (user == null || appClientState.computerIsPlaying === true) {
            console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local player is null - returning",
                getLoggingNow(), getComputerRole(), game.turn());
            return;
        }
        if (user.isSpectator){
            console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local player is spectator - returning",
            getLoggingNow(), getComputerRole(), game.turn());
            return;    
        }
        if (game.turn() == 'a' && user.isAttacker === true) {
            boardEl.removeClass("turn-disabled");
            boardEl.prop('disabled', false);
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - local real player role is: %s - returning",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }

        if (game.turn() == 'd' && user.isAttacker === false) {
            boardEl.removeClass("turn-disabled");
            boardEl.prop('disabled', false);
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - local real player role is: %s - returning",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }

        boardEl.addClass("turn-disabled");
        boardEl.prop('disabled', true);
      
        if (gameState.attacker.isSystem == false && gameState.defender.isSystem == false){  
            // both game players are not computers 
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - opponent player is not system. Local player id: %s",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }

        // the game is not set
        if (gameState.id == "") {
            console.log("%s - checkBoardAndPlayIfComputer (as %s)- game turn: %s - Null Server Game ID. Local player id: %s",
                getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole());
            return;
        }
        console.log("%s - checkBoardAndPlayIfComputer (as %s) - game turn: %s - local real player is: %s - required From Piece: %s",
            getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole(), game.move_source_required());

 
        $('#main-message').html("<div class='alert alert-warning'>Computer Player Thinking... </div>");
        var computerPlayer = gameState.getComputerPlayer();
        if (computerPlayer.isAttacker === true && game.turn() == 'a') {
           // $('#message').html("<div class='alert alert-warning'>Thinking... </div>");
           computer_play();
        }
        else {
            if (computerPlayer.isAttacker === false && game.turn() == 'd') {
                computer_play();
            }
        }
        $('#main-message').html("");
    }

  
    /**
     * Generates a computer setting or move
     */
    function computer_play() {
        var computerPlayer = gameState.getComputerPlayer();
        var moveSourceRequired = game.move_source_required();
        console.log("%s - computer_play() as %s - required From Piece: %s", getComputerRole(), 
            getLoggingNow(), moveSourceRequired);
        
        
        appClientState.computerIsPlaying = true;

        var source = "";
        var target = "";
        var exchangeRequest = false;  // default to true for computer if playing unreachable pieces
        if (game.is_in_setting_state()) {
            var settings = [];
            if (playOptions.firstSettingMustIncludeMalhaAdjacent &&
                 appClientState.firstComputerSetting == true && computerPlayer.isAttacker) {
                settings = game.settings_near_malha(); // cells adjacent to Malha
            }
            else {
                temp_settings = game.settings_near_opponent();

                if (computerPlayer.isAttacker) {
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
                    for (var si3 = 0; si3 < settings3.length; si3++) {
                        if (temp_settings.indexOf(settings3[si3]) > 0)
                            settings.push(settings3[si3]);
                    }
                    if (settings.length == 0)
                        settings = temp_settings;
                } 
           
            }
            if (settings.length == 0)  // whatever is left
                settings = game.settings();

            if (settings== null || typeof settings.length === "undefined" || settings.length <= 0) {
              //  $('#message').html("<div class='alert alert-error'>Unable to find a valid setting</div>");

                // if computer can not play -- resign or pass
                game.check();
                appClientState.computerIsPlaying = false;
                return;
            }
            source = "spare";

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
                    moves = game.moves_that_capture(moveSourceRequired);
                }
                if (playOptions.searchMovesThatSaveSelf) {
                    var movesThatSave = game.moves_that_save(moveSourceRequired);

                    if (!playOptions.preferMovesThatCaptureOverMovesThatSave && movesThatSave.length > 0)
                        moves = movesThatSave;
                }

                if (moves == null || moves.length == 0) {  // no capture able and no savable
                    moves = game.moves_unreachables(moveSourceRequired);
                    if (moves != null && moves.length > 0){
                       
                        exchangeRequest = true;
                      
                    }
                }

                if (moves == null || moves.length == 0) { // no unreachable?{
                    
                    moves = game.moves(moveSourceRequired);
                }

                
                if (moves == null || typeof moves.length === "undefined" || moves.length <= 0) {
                 //   $('#message').html("<div class='alert alert-danger'>Unable to find a valid move - Contact Support!</div>");

                    // if computer can not play -- resign or pass
                    game.check();
                    appClientState.computerIsPlaying = false;
                    return;
                }
                
                var moveId = 0;
                if (moveSourceRequired!= null && moveSourceRequired.length >0){
                    for(var item = 0; item< moves.length; item++ ){
                        if (moves[item].source == moveSourceRequired){
                            moveId = item.id;
                            break;
                        }
                    }
                }
                else{
                    if (playOptions.randomMove)
                        moveId = getRandom(0, moves.length - 1);
                }

                // todo -- add check for game to rank the moves by score and play the one with the highest score
                var move = moves[moveId];
                source = move.from;
                target = move.to;
                console.log("%s - Generated computer move from %s to %s", getLoggingNow(), source, target);
            }
        }
       

        $('#gameMove').html(source + "-" + target);
      
        var ret = false;
        var msg = "";
        var resigned = false;
        // add rule for how to make the computer resign

        var isAttacker = false;
        if (game.turn() == 'a') {
            // set the exchange request if computer
            isAttacker = true;
        }
        var isSetting = false;

        var beforeFen = game.fen();

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
            if (gameState.id != "" && appClientState.useServer === true && computerPlayer!= null) {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(appClientState.sessionId,gameState.id, computerPlayer.name,
                    isAttacker, isSetting, source, target, resigned, exchangeRequest, beforeFen, game.fen(), msg, lastMoveId,
                    lastMove.captured, lastMove.exchanged
                ).done(function () {
                    console.log('%s - Done Server Invocation of recordedMove ( moveId : %s) inside computer_play - for opponent player %s',
                        getLoggingNow(), lastMoveId, computerPlayer.name);

                    board.position(game.fen(), false); // update the board with the computer move

                    playSound();

                }).fail(function (error) {
                    console.log('%s - Invocation of recordMove ( moveId : %s) failed. Error: %s', getLoggingNow(), lastMoveId, error);
                });
            }
            else { 
                
                board.position(game.fen(), false); // update the board with the computer move
                playSound();
            }
        }

        appClientState.computerIsPlaying = false;
    }

    /**
     * Updates the board position with the local given game position
     * @param aGame -- the game to use to update the board with
     */
    function updateBoard(aGame) {
        if (aGame == null) {
            console.log("updateBoard - null aGame");
            return;
        }

        if (board != null) {

            // update the board position here for the case when processing exchanges
            board.position(aGame.fen(), true);
            updateBoardInfo();
        }
     
        // see if we have a server game that is joined
        if (gameState.status == 0) {
        //     $('#message').html("<div class='alert alert-warning'>Game is still in pending state for another player to join.</div>");
            boardEl.css('border-color: warning');
        }
        else {
            if (gameState.status == 1) {
                //  $('#message').html("<div class='alert alert-success'>Game is joined by another player.</div>");
                // enable it
                boardEl.css('border-color: green');
            }
            else {
                $('#message').html("<div class='alert alert-info'><strong>Game Over.</strong></div>");
                boardEl.css('border-color: red');
            }
        }
        setupResignCheckbox();
    }

    function clearLastMoveInfo() {
        $('#gameMove').empty();
        $('#move-captured').empty();
        $('#move-exchanged').empty();
    }

    /**
     * Updates the board game scores based on the given game
     * @param {any} aGame 
     */
    function updateScores(aGame) {
        if (aGame == null) {
            console.log("updateScores - null aGame");
            return;
        }
        $('#attacker_score').html(aGame.getAttackerScore().toString());
        $('#defender_score').html(aGame.getDefenderScore().toString());
        $('#state').html(toDisplayString(Kharbga.GameState[aGame.getState()]));

        if (board != null) {
            $('#fen').html(board.fen().replaceAll2('/','/ ') );
            $('#pgn').html(board.position().toString());
        }
    }

    /**
     * Updates the board turn info (clock and processing)
     * @param {any} aGame - the game to update
     */
    function updateTurnInfo(aGame) {
        if (aGame == null) {
            console.log("updateScores - null aGame");
            return;
        }
        if (aGame.game_over() && aGame.winner != null) {
            if (aGame.winner.isAttacker) {
                $('#attacker-thinking').html("WON");
                $('#defender-thinking').html("LOST");
            } else {
                $('#attacker-thinking').html("LOST");
                $('#defender-thinking').html("WON");
            }
        }
        else {
            if (aGame.turn() == 'a') {
                $('#attacker-thinking').html("<div class='alert alert-warning'><strong> >>> <strong> </div>");
                $('#defender-thinking').html("");
            }
            else {
                $('#attacker-thinking').html("");
                $('#defender-thinking').html("<div class='alert alert-warning'><strong> >>> <strong> </div>");
            }
        }
    }
    /**
     * Updates the board game options with the given game move flags
     * @param {any} moveFlags - the move flags
     */
    function updateMoveFlags(moveFlags) {
        $('#exchangeRequestCheckbox').prop('checked', moveFlags.exchangeRequest);
        $('#exchangeRequestAcceptedCheckbox').prop('checked', moveFlags.exchangeRequestAccepted);

        $('#exchangeRequestDefenderPiece').text(moveFlags.exchangeRequestDefenderPiece);
        $('#exchangeRequestAttackerPiece1').text(moveFlags.exchangeRequestAttackerPiece1);
        $('#exchangeRequestAttackerPiece2').text(moveFlags.exchangeRequestAttackerPiece2);
        var exchangedSquare;
        if (!moveFlags.exchangeRequest)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
        else{
            exchangedSquare = boardEl.find('.square-' + moveFlags.exchangeRequestDefenderPiece);
            exchangedSquare.addClass('highlight-exchange');
        }

        if (!moveFlags.exchangeRequestAccepted)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');


        exchangedSquare = boardEl.find('.square-' + moveFlags.exchangeRequestAttackerPiece1);
        exchangedSquare.addClass('highlight-exchange');
        exchangedSquare = boardEl.find('.square-' + moveFlags.exchangeRequestAttackerPiece2);
        exchangedSquare.addClass('highlight-exchange');

        selectedSquare = boardEl.find('.square-' + appClientState.selectedSource);
        selectedSquare.addClass('highlight-move');
    }
    
    /**
     * Starts a new game - the main entry point
     * @param {any} e - the event data
     */
    function onNewGame(e) {
        if (e == null || e.data == null) {
            $('#message').html("<div class='alert alert-danger'>onNewGame - Invalid arguments</div>");
            return false;
        }

        /* allow creating the game event not connected to a server
        if (gamesHubProxy == null) {
            $('#message').html("<div class='alert alert-danger'>Not connected to server</div>");
            return;
        }*/
       
        resetLocalGame();

        if (appClientState.useServer === true && gamesHubProxy !== null) {
            // call the server to start the new game
            gamesHubProxy.server.createGame(appClientState.sessionId,user.name, e.data.asAttacker, e.data.againstComputer)
                .done(function () {
                    console.log('%s - Done Server Invocation of create game', getLoggingNow());

                }).fail(function (error) {
                    console.log('%s - Invocation of createGame failed. Error: %s', getLoggingNow(), error);
                });
        }
        else{
            // Create a new game locally
            gameState.reset();
            gameState.id = createGameId();
            user.reset();
            var opponent = {
                name:"Opponent",
                isSpectator: false,
                isAttacker: false,
                isSystem: true
            };         
            user.isAttacker = e.data.asAttacker;
            opponent.isAttacker = !e.data.asAttacker;
            opponent.isSystem = e.data.againstComputer;            
            if (e.data.asAttacker === true)
            {
                gameState.attackerName = user.name;
                gameState.attacker = user;
                gameState.defender = opponent;
            }
            else{
                gameState.defenderName = user.name;
                gameState.attacker = opponent;
                gameState.defender = user;
            }

            if (e.data.againstComputer === true){
                game.status = Kharbga.GameStatus.Joined;
                game.state  = Kharbga.GameState.Settings;
            }
           
            onGameCreated(true,"",gameState,user); 
            onSetupLocalPlayer(user,gameState);
        }
    }
 
    /**
     * Call back when a game is created by the server
     * called back when a game is joined to the Joiner of the game (including spectator)
    */

    // game created
    // all clients get this message with this game info
    
    var onGameCreated = function (status, error, gameInfo, playerInfo) {
        if (loggingOn)
            console.log("On game Created - status: %s", status);

        if (status === false) {
            console.log("%s - error creating game: ", getLoggingNow());
            console.log("%s - error: %s ", getLoggingNow(), error);
            $('#message').html("<div class='alert alert-danger'>Unable to create game on the server. Please try again later!</div>");
            return;
        }
        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Created: ", getLoggingNow());
            console.log(gameInfo);
        }

        // add the game to the list
        appendGameToGamesList(gameInfo);      

        // setup the game and the board and update the UI
        setupLocalGame(gameInfo);
   
        // start the background timer for the computer if we have a computer playing
        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null){
            console.log("starting computer play timer...");
            appClientState.backgroundJobId = setInterval(checkBoardAndPlayIfComputer,4000);
        }
    };



    /**
     * Clears the local game and board 
     */
    function resetLocalGame() {
        // create a new instance for the local game
        //delete game;         
        game = new Kharbga.Game(gameEvents, boardEvents);
        appClientState.loaded = false;
        
        gameState.reset();

        appClientState.firstComputerSetting = true;
        game.reset();
        game.start();
        $('#state').html(toDisplayString(Kharbga.GameState[game.getState()]));
        if (board != null) {
            board.clear();
            board.start();
            $('#fen').html(board.fen());
            $('#pgn').html(board.position().toString());
        }

        updateScores(game);

        $('#loadSetting1Btn').show();
        //  $('#startGameBtn').hide();
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        boardEl.find('.highlight-source').removeClass('highlight-source');
        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
        boardEl.find('.square-d4').addClass('highlight-malha');

        clearLastMoveInfo();
        removeLastMoveHighlighting();
        $('#resign-checkbox').prop('checked', false);

        setCookie("_nsgid", "");

        // hide the panel (?)
      //  $('#currentGamePanel').hide();
        _soundToggle();

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

        $('#state').html(toDisplayString(Kharbga.GameState[game.getState()]));
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

       // $('#loadSetting1Btn').hide();
    }
    $('#clear-board-button').on('click', onClear);
    $('#resign-button').on('click', onResign);
    /**
     * Clears the game and the board. The board is a set with an empty position string or fen
     */
    function onClear(e) {

        e.preventDefault();

        gameState.reset();
       
        // do not clear the user - this should be the same as the user logged in
        // user.reset();

        setupLocalGame(gameState);
        setupLocalPlayer(user,gameState);
    }

    function onResign(e){
        e.preventDefault();
        $('#resign-checkbox').attr('checked','checked');
        $('#resign-checkbox').prop('checked',true);
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

    /**
     * Handler for login click from UI
     * @param {any} e
     */
    function onLoginLink(e) {
        e.preventDefault();

        var accountTab = $('#main-tabs a[href="#account"]');
        if (accountTab != null &&  accountTab.tab != null &&  accountTab.tab != undefined)
            accountTab.tab('show');  

         $('#login-panel').show().removeClass('hidden');
         $('#register-panel').hide().addClass('hidden');
    }
    /**
     * Handler for register click from UI
     * @param {any} e
     */
    function onRegisterLink(e) {
        e.preventDefault();

        var accountTab = $('#main-tabs a[href="#account"]');
        if (accountTab != null &&  accountTab.tab != null &&  accountTab.tab != undefined)
            accountTab.tab('show');

        $('#login-panel').hide().addClass('hidden');
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
                console.log(data);
                setupClientStateWithSession(data.object);           

                // check the last game 
                rejoinLastGameIfAny();
                if ($.appViewHandler != null && typeof($.appViewHandler.closeLoginPanel) === 'function')
                    $.appViewHandler.closeLoginPanel();
            }
            else {
                setupClientStateWithSession(null);
            
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
                console.log(data);
                setupClientStateWithSession(data.object);      


                rejoinLastGameIfAny();
                if ($.appViewHandler != null && typeof($.appViewHandler.closeRegisterPanel) === 'function')
                    $.appViewHandler.closeRegisterPanel();
            }
            else {
                setupClientStateWithSession(null);
               
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
        if (appClientState.sessionId == null || appClientState.sessionId.length < 10)
        {
            $('#account-message').html("<div class='alert alert-info'>Invalid session</div>");
            return; 
        }
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");
        // add call for back-end to delete the session
        nsApiClient.userService.logout(appClientState.sessionId, function (data,status) {
            if (data != null ) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Logged out successfully </div>");
               
                setupClientStateWithSession(null);
                
            }
            else {
                setupClientStateWithSession(null);
                //e;
               
      
                $('#account-message').html("<div class='alert alert-danger'>Failed to logout.  </div>");
                $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            } 
  

        });
        

        

    }
    /**
     * handler for refresh app info request
     * @param {any} e
     */
    function onRefreshAppInfo(e) { 
        if (e!= null)     
            e.preventDefault();
        _refreshAppInfo();

    }

    function _refreshAppInfo(){
        $("#api-url").text(nsApiClient.baseURI);
       // $('#help-message').html("<div class='alert alert-info'>Processing...</div>");
   
        nsApiClient.appService.getAppInfo(function (data, status) {
            if (data != null) {
              //  $('#help-message').html("<div class='alert alert-info'>" + JSON.stringify(status) + "</div>");
              //  $('#appInfo').html(JSON.stringify(data));
                $('#app-info-table-body').html("");
                Object.keys(data).forEach( function(key){
                    var tr = "<tr><th>"+toDisplayString(key) + "</th><td>" + data[key]+"</td></tr>";
                    $('#app-info-table-body').append(tr);
                });
            }
            else {
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                $('#appInfo').html('');
            }
        });
    }
    $('#app-state-link').on('click', _refreshAppState);

    function _refreshAppState(e){
        if (e!= null)
            e.preventDefault();

        $('#main-message').html("<div class='alert alert-info'>Processing...</div>"); 
       
        $('#app-state-table-body').html("");
        Object.keys(appClientState).forEach( function(key){
            var obj = appClientState[key]; 
            var objType = typeof obj;
            if (objType == "object" ){               
                var tr = "<tr><th>"+toDisplayString(key) + "</th><td>" + objType +"</td></tr>";
                $('#app-state-table-body').append(tr);
                if (obj!= null){
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var tr = "<tr><th><span style='padding-left:50px;'>.</span>"+toDisplayString(key2) + "</th><td>" + obj[key2]+"</td></tr>";
                            $('#app-state-table-body').append(tr);
                        }
                    });
                }
            }
            else if (objType == "function" ){
                // skip
            }
            // check if array
            else{
                var tr2 = "<tr><th>"+toDisplayString(key) + "</th><td>" + obj+"</td></tr>";
                $('#app-state-table-body').append(tr2);
            }
        });
      
    }

    $('#game-state-link').on('click', _refreshGameState);

    function _refreshGameState(e){
        if (e!= null)
            e.preventDefault();

        $('#main-message').html("<div class='alert alert-info'>Processing...</div>"); 
       
        $('#game-state-table-body').html("");
        Object.keys(gameState).forEach( function(key){
            var obj = gameState[key]; 
            var objType = typeof obj;
            if (objType == "object" ){               
                var tr = "<tr><th>"+toDisplayString(key) + "</th><td>" + objType +"</td></tr>";
                $('#game-state-table-body').append(tr);
                if (obj!= null){
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var tr = "<tr><th><span style='padding-left:50px;'>.</span>"+toDisplayString(key2) + "</th><td>" + obj[key2]+"</td></tr>";
                            $('#game-state-table-body').append(tr);
                        }
                    });
                }
            }
            else if (objType == "function" ){
                // skip
            }
            // check if array
            else{
                var tr2 = "<tr><th>"+toDisplayString(key) + "</th><td>" + obj+"</td></tr>";
                $('#game-state-table-body').append(tr2);
            }
        });
    }


    $('#user-state-link').on('click', _refreshUserState);

    function _refreshUserState(e){
        if (e!= null)
            e.preventDefault();

        $('#main-message').html("<div class='alert alert-info'>Processing...</div>"); 
       
        $('#user-state-table-body').html("");
        Object.keys(user).forEach( function(key){
            var obj = user[key]; 
            var objType = typeof obj;
            if (objType == "object" ){               
                var tr = "<tr><th>"+toDisplayString(key) + "</th><td>" + objType +"</td></tr>";
                $('#user-state-table-body').append(tr);
                if (obj!= null){
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var tr = "<tr><th><span style='padding-left:50px;'>.</span>"+toDisplayString(key2) + "</th><td>" + obj[key2]+"</td></tr>";
                            $('#user-state-table-body').append(tr);
                        }
                    });
                }
            }
            else if (objType == "function" ){
                // skip
            }
            // check if array
            else{
                var tr2 = "<tr><th>"+toDisplayString(key) + "</th><td>" + obj+"</td></tr>";
                $('#user-state-table-body').append(tr2);
            }
        });
    }

    /** @summary Converts a camel case string to display 
     *  @returns {string} the converted string
    */
    function toDisplayString(key){
       // key.replace(/([A-Z])/g, function($1){return " "+$1.toLowerCase();});
        // insert a space between lower & upper
        var ret = key.replace(/([a-z])([A-Z])/g, '$1 $2')
        // space before last upper in a sequence followed by lower
        .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
        // uppercase the first character
        .replace(/^./, function(str){ return str.toUpperCase();}); 

        return ret;
    }

    /**
     * checks the stored user session id
     */
    function checkSessionCookie() {
        var cookie = getCookie(C_NSSID);
        if (typeof cookie === "string" && cookie.length > 10)
            checkSession(cookie);       
        else{
            // check local storage
            if (window.localStorage != null){
                var sid = window.localStorage.getItem(C_NSSID);
                if (typeof sid  === "string" && sid.length > 10)
                    checkSession(sid);   
                else{
                    setupClientStateWithSession(null);  
                }
            }
            else{
                setupClientStateWithSession(null);
            }
        }
    }

    /**
    * checks the stored active game id 
    */
    function getLastGameCookie() {
        var cookie = getCookie("_nsgid");
        if (typeof cookie === "string" && cookie.length > 10)
            return cookie;
        // check local staroge
        if (window.localStorage != null){
            var gid = window.localStorage.getItem("_nsgid");
            if (typeof gid  === "string" && gid.length > 10)
                return gid;     
        }
        return "";
    }

    /**
     * checks a given session with the backed and update 
     * @param {any} sessionId the session id
     */
    function checkSession(sessionId) {
        $('#account-message').html("<div class='alert alert-info'>Processing... </div>");
        var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("");

                var session = data.object;
                
                if (session != null) {
                    setupClientStateWithSession(session);
                    
                }
                else {
                    setupClientStateWithSession(null);
                }


                // rejoin the game if any in all cases - just in case for guests
                rejoinLastGameIfAny();
            }
            else {
                setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
                setupMyAccount();
                appClientState.sessionId = "";
                appClientState.session = null;
                user.name = "";


                if (status.status === 404 || status.status === 400)
                    $('#account-message').html("<div class='alert alert-warning'>Invalid Session - Please Login</div>");
                else
                    $('#account-message').html("<div class='alert alert-danger'> Failed to access the system. Please try your request again later. </div>");

               // $('#account-message').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
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
            $('#account-welcome').html("<strong> Welcome " + user.name + "</strong>");

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
        $('#account-name').text(user.name);
       // $('#account-org-id').text(appClientState.session.ClientId);
        $('#account-session-id').text(appClientState.sessionId);
        $('#account-game-id').text(gameState.id);
        if (user != null) {
            $('#account-game-role').text(user.isSpectator? "Spectator" : (user.isAttacker ? "Attacker" : "Defender"));
        }
        else {
            $('#account-game-role').text("");
        }
    }

    /**
     * @summary rejoins local cached game 
     * (after the user refreshes the their browser or logs in again)
     * sets up the active open games (latest 20 games)
     */
    function rejoinLastGameIfAny() {

        if (!appClientState.signalReInitialized){
            // try to start it again
            _setupSignalR();
            
            
            setTimeout(rejoinLastGameIfAny,5000);
            return;
        }
      
        // check local active game cookie
        var gid = getLastGameCookie();
        setupGames(gid);

        if (gid != "" && gamesHubProxy != null && appClientState.signalReInitialized) {

        //    gamesHubProxy.server.reJoinGame(user.name, gid, false);
            // tell the server to rejoin this connection with the game
            gamesHubProxy.server.joinGame(appClientState.sessionId,user.name, gid, false);
        }

        //resize the board 
        resizeGame();

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
    $('#flipOrientation').on('click', onFlipBoard);// flip the board
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

    // handlers for the play
    $('#play-backward').on('click', function () {
        console.log('play - backward');
    });
    $('#play-start').on('click', function () {
        console.log('play - start');
    });
    $('#play-pause').on('click', function () {
        console.log('play - pause');
    });
    $('#play-forward').on('click', function () {
        console.log('play - forward');
    });
   
    /**
     * handle for when a move is recorded
     * @param {any} status -- move status
     * @param {any} errorMessage -- error message if move failed to record
     * @param {any} serverMove -- the server move record with/ captured/exchange info
     */
    var onMoveRecorded = function (status, errorMessage, serverMove) {
        if (status === false) {
            console.log("%s - server - error recording move: %s ", getLoggingNow(), errorMessage);
            $('#message').html("<div class='alert alert-danger'> Failed to process move by the server. Error: " + errorMessage+ "</div>");
            return;
        }
        if (serverMove == null) {
            console.log("%s - server - error recording move - invalid game move passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Game Move </div>");
            return;
        }

        // add the move to the local game
        gameState.moves.push(serverMove);
      
        // if the move is already submitted to the local game (by real player or computer) just add to the Move history and 
        if (lastMoveId == serverMove.clientId) {
            // append the move to the game history
            appendMoveToGameHistoryList(serverMove);
            console.log("%s - server - did not record setting/move in local game for local moveId: %s", 
                getLoggingNow(), lastMoveId);
            return; 
        }
    
        var ret;
        console.log("%s - server - recording setting/move in local game for server Move ID: %s", 
            getLoggingNow(), serverMove.clientId);

        if (game.is_in_moving_state()) {
            ret = game.processMove(serverMove.from, serverMove.to, serverMove.resigned, serverMove.exchangeRequest);
        }
        else {
            ret = game.processSetting(serverMove.to);
        }
        updateBoard(game);
        updateLastActionInfo(serverMove);
        if (ret == true)
            playSound();
        else {
            // play error sound
        }

        // append the move to the game history
        appendMoveToGameHistoryList(serverMove);
    };


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

    function updateLastActionInfo(serverMove) {
        $('#gameMove').html(serverMove.from + " - " + serverMove.to);
        $('#move-captured').html(serverMove.captured);
        $('#move-exchanged').html(serverMove.exchanged);
    }

    function setupResignCheckbox(){
        // setup the check boxes based on the player
        if (user.isSpectator) {
            $('#resign-checkbox').prop('disabled', true);
            $('#exchangeRequestCheckbox').prop('disabled', true);
            $('#exchangeRequestAcceptedCheckbox').prop('disabled', true);
        }
        else {
            $('#resign-checkbox').prop('enabled', true);
            if (user.isAttacker) {
                $('#exchangeRequestCheckbox').prop('disabled', true);
                $('#exchangeRequestAcceptedCheckbox').prop('disabled', false);
            }
            else {
                $('#exchangeRequestAcceptedCheckbox').prop('disabled', true);
                $('#exchangeRequestCheckbox').prop('disabled', false);
            }
        }
    }
    /**
     * sets up the local player info 
     * @param {any} player -- the player
     * @param {any} serverGame -- the game is not required
     */
    var onSetupLocalPlayer = function setupLocalPlayer(player, serverGame) {
        if (typeof player == "undefined" || player == null) {
            console.log("%s - setCurrentPlayer - Invalid player passed : ", getLoggingNow());
            return;
        }
        user.update(player);
        
        if (typeof serverGame == "undefined" || serverGame == null) {
            console.log("%s - setCurrentPlayer - Invalid game passed : ", getLoggingNow());
            return;
        }
      
        setupResignCheckbox();

     //   gameState.update(serverGame);
     //  updateLocalGameStatus(serverGame);

        // refresh the myAccount info
        setupMyAccount();
    };
   
    // handle when the game is selected by a player. All people will receive a this message
    // we do not all player to reset their game if a spectator just joins the game
    var onGameJoined = function (gameInfo) {
        if (status === false) {
            console.log("%s - error joining game: ", getLoggingNow());
            console.log("%s - error: %s ", getLoggingNow(), error);
            $('#message').html("<div class='alert alert-danger'>Unable to process game on the server. Please try again later!</div>");
            return;
        }

        if (typeof gameInfo == "undefined" || gameInfo == null)
        {
            $('#message').html("<div class='alert alert-danger'>Failed to process game from the server. Please try again later!</div>");
            console.log("%s - gameJoined - Invalid Game passed : ", getLoggingNow());
            return;
        }

        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Joined: ", getLoggingNow());
            console.log(gameInfo);
        }
  
     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));    

       
        
        setupLocalGame(gameInfo);
      

        // start the background timer for the computer if we have a computer playing
        if (appClientState.backgroundJobId> 0)
            clearInterval(appClientState.backgroundJobId);

        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null){
            console.log("starting computer play timer...");
            appClientState.backgroundJobId = setInterval(checkBoardAndPlayIfComputer,4000);
        }
    };

    var onAppendMove = function (gameId, move) {
        // double check that this is current move
      //  appendMoveToGameHistory(move);
    };

    /**
     * @summary Sets up the local game with the given game info
     * @param {Kharbga.GameInfo} gameInfo - the game information
     */
    function setupLocalGame(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - setupLocalGame - Invalid game passed : ", getLoggingNow());
            return;
        }
        // set the game id coockie
    

        // clear the local game
        resetLocalGame();

        // update the game players info
        game.attacker.name = gameInfo.attackerName;
        game.defender.name = gameInfo.defenderName;

         // update the game players info - is this needed
         game.setPlayerNames(gameInfo.attackerName,gameInfo.defenderName);

        // update the local game state
        gameState.update(gameInfo);

        // replay all existing moves
        game.setupWith(gameInfo);

        clearLastMoveInfo();

        // update the board display
        updateBoard(game);

        // player
        if (game.turn() == 'a')
            $('#player-turn').html("Attacker");
        else
            $('#player-turn').html("Defender");

        updateLocalGameStatus(gameInfo);
        selectActiveGameId(gameInfo.id);

        // setup the move history list
        setupGameMovesHistoryList(gameInfo);
        removeSelectedCells();

        // sets up the cookie for replaying the active game
        setCookie("_nsgid", gameInfo.id);
    }

    function updateLocalGameStatus(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - updateLocalGameStatus - Invalid game passed : ", getLoggingNow());
            return;
        }  

        $('#current-game-id').text(gameInfo.id);
        $('#current-game-status').text(getStatusText(gameInfo.status));
        $('#game-attacker').text(gameInfo.attackerName);
        $('#game-defender').text(gameInfo.defenderName);
        $('.attacker-name').text(gameInfo.attackerName);
        $('.defender-name').text(gameInfo.defenderName);
        $('#game-players').html(gameInfo.attackerName + " vs. " + gameInfo.defenderName);
        $('#game-score').html(gameInfo.attackerScore + "-" + gameInfo.defenderScore);
        $('#game-result').html(toDisplayString(Kharbga.GameState[gameInfo.state]));

        updateGameInGameList(gameInfo);

        if (game.winner != null){
            if (game.winner.isAttacker)
                $('#game-winner').html(gameInfo.attackerName + " (Attacker)");
            else
                $('#game-winner').html(gameInfo.defenderName + " (Defender)");        

            // activate the modal dialog here 
            if (gameInfo.status > 2)
                setTimeout(function () {
                  //  $('#game-over').modal();
                }, 1000);
        }
    }

    var onGameDeleted = function (gameInfo) {
        // remove from the games list
        console.log("%s - Game Deleted: ", getLoggingNow());
        console.log(gameInfo);
    };

    /**
     * Updates the item status in the games list
     * @param {Kharbga.GameInfo} gameInfo - the game from the server to use to update the list
     */
    function updateGameInGameList(gameInfo) {
        $('#' + gameInfo.id).remove();
    //    appendGameToGamesList(gameInfo)

        // update the color of the list depending on the status
        $('#' + gameInfo.id).removeClass('list-group-item-warning');
        $('#' + gameInfo.id).removeClass('list-group-item-info');
        $('#' + gameInfo.id).removeClass('list-group-item-danger');
        $('#' + gameInfo.id).removeClass('list-group-item-success');
        $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.status));  

        // update the player names
       // game.setPlayerNames(gameInfo.AttackerName, gameInfo.DefenderName);

        $('#status-' + gameInfo.id).html(getStatusText(gameInfo.status));
        if (gameInfo.defenderName != "")
            $('#linkd-' + gameInfo.id).replaceWith(gameInfo.defenderName);

        if (gameInfo.attackerName != "")
            $('#linka-' + gameInfo.id).replaceWith(gameInfo.attackerName);
        // update the text on the button to mention Replay when the game is completed
    }

    /**
     * Adds a game to the list
     * @param {any} gameInfo - the game from the server to add to the list
     */
    function appendGameToGamesList(gameInfo) {
        if (gameInfo == null)
            return;

        $('#' + gameInfo.id).detach();

        var html = "<li id='" + gameInfo.id + " ' class='list-group-item ";

        // add the class of the item
        html += getStatusCss(gameInfo.status);
        html += "'>";
     //   html += "ID: " + gameInfo.id + "<br>";
        if (gameInfo.attackerName == "") {
             html += "<a href='' id='linka-" + gameInfo.id + "' class=''><strong>Play</strong></a>";
        }
        else {
            html += gameInfo.attackerName;
        }
        html += " vs. ";
        if (gameInfo.defenderName == "") {
            html += "<a href='' id='linkd-" + gameInfo.id + "' class='' ><strong>Play</strong></a>";
        }
        else {
            html += gameInfo.defenderName;
        }
        html += " (<span id='status-" + gameInfo.id + "'>" + getStatusText(gameInfo.status) + "</span>)";
        html += "<br><button id='watch-" + gameInfo.id + "' class='btn btn-default'>Join / Watch</button";
        html += "</li>";

        $('#games-list').append(html);

        $('#linka-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#linkd-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#watch-' + gameInfo.id).on('click', gameInfo, onGameSelected);
     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));          
    }

    /**
     * Selects the given game in the list
     * @param {string} gameId - the game id
     */
    function selectActiveGameId(gameId) {
        if (typeof gameId == undefined || gameId === "")
            return;
        $('.selected-game').removeClass('selected-game');
        $('#' + gameId).addClass('selected-game');
        $('#' + gameId).css('fontWeight', 'bold');
        $('#' + gameId).css('PaddingLeft', '10px');
    }

    $('#use-server.checkbox').click(function(){

        appClientState.useServer = $('#use-server.checkbox').is(':checked'); 

    });
    $('#games-link').on('click', _refreshGames);

    /**
     * Refreshes the list of games from the server for display in the home page for the current user
     * @param {any} e - the event object
     */
    function _refreshGames(e) {
        if (typeof e != "undefined" && e != null)
             e.preventDefault();
      
       $('#main-message').html("<div class='alert alert-info'>Refreshing games from the server...</div>");

        $('#games-list').empty();
        if (loggingOn) {
            console.log("%s - _refreshingGames from the server : ", getLoggingNow());
        }

        if (appClientState.userServer === false){
            $('#main-message').html("<div class='alert alert-info'>Server is not being used</div>");
            return;
        }
        gamesHubProxy.server.getGames(appClientState.sessionId).done(function (gamesResult) {
            if (gamesResult.success === true) {
                $.each(gamesResult.object, function () {
                    appendGameToGamesList(this);
                    
                });
                refreshList('#games-list');
            }
            if (loggingOn) {
                console.log("%s - _refreshingGames from the server - selecting active game Id: %s ", getLoggingNow(), gameState.id);
            }
            selectActiveGameId(gameState.id);
           $('#main-message').html("<div class='alert alert-success'>Done refreshing games from the server.</div>");
        });
    }
    
    // refresh games from server
  

    // externalize for angular App
    this.refreshGames = _refreshGames;

    /**
     * Handler for when a game is selected for joining 
     * @param {any} e
     */
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
 
        $('#message').html("<div class='alert alert-success'>Game is ready on the server</div>");
        $('#message').html("<div class='alert alert-success'>Setting up game state based on server data</div>");
        console.log("Setting up game state based on server data");
   
        var spectator = false;
        resetLocalGame();
        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.sessionId, user.name, data.id, spectator).done(function () {
         // init the local game with the given server game data    
      //   resetLocalGame();  // server will sen
         // update the game view with the given game

                // select the game 
       //    selectActiveGameId(data.id);
        });  
        
        // focus the game tab
        boardEl.focus();
    }

    /**
     * handler for when a game is selected for watching and replaying (learning purpose)
     * @param {any} e
     */
    function onWatchGameSelected(e) {
        if (gamesHubProxy == null)
            setSystemError(true);

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


        $('#message').html("<div class='alert alert-success'>Setting up game state based on server data</div>");
        console.log("Setting up game state based on server data");

        var spectator = true;

        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.sessionId,user.name, data.id, spectator);

        // init the local game with the given server game data    
      //  resetLocalGame();  // server will sen
        // update the game view with the given game
    }
    $('#submitMove').on('click', function onSubmit() {
        /*
        gamesHubProxy.server.recordMove("testGameId", myConnectionId, "testMove").done(function () {
            console.log('server Invocation of recordedMove');
        })
        .fail(function (error)
        {
            console.log('Invocation of recordMove failed. Error: ' + error);
        });
        */
    });

    $('#ping-link').on('click', _ping);

    $('#connections-link').on('click', refreshConnections);
    function refreshConnections(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing active connections from the server...</div>");
        $('#connections-table').empty();
        var result = nsApiClient.gameService.getConnections(appClientState.sessionId, { "active": true }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>returned connections successfully. </div>");
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
                $('#connections-count').text(data.length);
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
                    html += ("<td>" + this.id + "</td>");
                    html += ("<td>" + this.userName + "</td>");
                    html += ("<td>" + (this.connected ? "Yes" : "No") + "</td>");
                    html += ("<td>" + this.createdOn + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";

                $('#connections-table').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retrieve connections from the server. Errors: " + status.responseText + " </div>");
                $('#connections-list').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }
    $('#players-link').on('click', refreshPlayers);
    /**
     * returns the list of active players (cached) from the server
     * @param {any} e - the event
     */
    function refreshPlayers(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing players from the server...</div>");

        $('#players-table').empty();

        var result = nsApiClient.gameService.getPlayers(appClientState.sessionId,{ "active": null }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>Returned players successfully. </div>");
                var html = "<table class='table table-responsive'><thead>";
                $('#players-count').text(data.length);
                var first = true;
                $.each(data, function () {
                    if (first) {
                        // append the header
                        html += "<thead><tr>";
                        html += ("<th>Name</th>");
                        html += ("<th>Is Spectator</th>");
                        html += ("<th>Is Attacker</th>");
                        html += ("<th>Current Game ID</th>");
                        html += ("<th>Connected</th>");
                        html += ("<th>Current Connection ID</th>");
                        html += "</tr></thead><tbody>";
                        first = false;
                    }

                    html += "<tr>";
                    html += ("<td>" + this.name + "</td>");
                    html += ("<td>" + (this.isSpectator === true ? "Yes" : "No") + "</td>");
                    html += ("<td>" + (this.isAttacker === true ? "Yes" : "No") + "</td>");
                    html += ("<td>" + this.currentGameId + "</td>");
                    html += ("<td>" + (this.connected === true ? "Yes" : "No") + "</td>");
                    html += ("<td>" + (this.currentConnection != null ? this.currentConnection.id : "") + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";
                $('#players-table').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retrieve connections from the server. Errors: " + status.responseText + " </div>");
                $('#players-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
     }

    $('#system-games-link').on('click', refreshGames2);
    /**
     * Returns the list of active games (cached) by the server
     * @param {any} e - the event
     */
    function refreshGames2(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-waring'>Refreshing active games from the server...</div>");
        $('#games-table').empty().html('');

        var result = nsApiClient.gameService.getGames(appClientState.sessionId,{ "active": null }, function (data, status) {
            if (data != null) {
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
                $('#games-count').text(data.length);
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
                    html += ("<td> <a id='glink-"+this.id + "' href='#'>View</a></td>");
                    html += ("<td>" + this.attackerName  + "</td>");
                    html += ("<td>" + (this.defenderName ) + "</td>");
                    html += ("<td>" + getStatusText(this.status) + "</td>");
                    html += ("<td>" + Kharbga.GameState[this.state] + "</td>");
                    html += ("<td>" + this.fen + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";
                $('#games-table').html(html);
                $('#system-message').html("<div class='alert alert-success'>Done refreshing games from the server. </div>");
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retrieve the active games from the server. Errors: " + status.responseText + " </div>");
                $('#games-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }
    $('#server-link').on('click', setupSignalR);
    function setupSignalR(e){
        if (e!= null)
            e.preventDefault();
        _setupSignalR();
    }

    /**
     * Sets up the game moves history list with a server game
     * @param {any} serverGame - the server game
     */
    function setupGameMovesHistoryList(serverGame) {

        if (serverGame == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game </div>");
        }   

        $('#game-moves-history-list').empty();

        $.each(serverGame.moves, function (i,v) {
            appendMoveToGameHistoryList(v);
        });

    }
       
    /**
     * Appends the given move to the game history
     * @param {any} move - move information from the server
     */
    function appendMoveToGameHistoryList(move) {

        if (move == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game move </div>");
        }
        var html = "";
        html += "<li class='list-group-item'>";
        html += ("<strong>" + move.number + ". </strong>");
        html += ("" + move.playerName);
        html += ((move.isAttacker == true ? " (Attacker)" : " (Defender)") + " - ");
        html += ( (move.isSetting == true ? "Set" : "Move") + ": ");
        html += (move.from + " to ");
        html += move.to ;
        if (move.resigned == true)
            html +=  " - Resigned";
        if (move.exchangeRequest == true) {
            if (move.isAttacker)
                html += " - Exchange Request Accepted";
            else
                html += " - Exchange Request";
        }
     //   html += "<br>";

        // add another row for the message and fen
     //   html += ("<pre style='font-size:small'>FEN Before & After: " + (move.BeforeFEN) + " - ");
     //   html += ((move.AfterFEN) );
        if (move.captured != "")
            html += ( " - Captured: " + move.captured);

        if (move.exchanged != "")
            html += (" - Exchanged: " + move.exchanged );

        if (move.message != "")
            html += (" - Message: " + move.message);

      //  html += "</pre>";
           html += "</li>";

        $('#game-moves-history-list').append(html);
        refreshList('#game-moves-history-list');
    }

    /**
   * handler for the Post message request
   */
    function onPostMessage() {
        if (loggingOn === true) {
            console.log("%s - onPostMessage: ", getLoggingNow());
            
        }

        if (gamesHubProxy != null )
        {
            var message = $('#move-message').val();
            gamesHubProxy.server.postMessage(appClientState.sessionId,user.name,message);
        }
    }

    function refreshList(id){
        if ($.appViewHandler && $.appViewHandler != null)
            $.appViewHandler.refreshList(id);
    }

    // base hub messages
    var onJoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s joined on %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server connected " + connectionInfo.id + "</li>");
            refreshList('#messages-list');
            
        }
    };
    var onLeft = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s left at %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server disconnected " + connectionInfo.id + " - " + connectionInfo.UserName + "</li>");
            refreshList('#messages-list');
        }
    };
    var onRejoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s rejoined on %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + ": server rejoined " + connectionInfo.id + "</li>");
            refreshList('#messages-list');
        }
    };
    var onPong = function (connectionId, serverTime, result) {
        if (connectionId !== $.connection.hub.id) {
            if (loggingOn) console.log('%s - server: INVALID pong from %s received on: %s', getLoggingNow(), connectionId, JSON.stringify(serverTime));
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> server: INVALID pong from " + connectionId + " received on:" + new Date().toLocaleTimeString() + " - server time " + serverTime + "</li>");
            refreshList('#messages-list');
        }
        else {
            // check if equal to self
            if (loggingOn) console.log('%s - server: pong from %s received on: %s', getLoggingNow(), connectionId, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + " pong received from " + connectionId + " - server time " + serverTime + "</li>");
            refreshList('#messages-list');
            if (loggingOn)  console.log(result);
        }
        $('#signalr-status').html("Server Time: " + serverTime.toString());
    };
    var onMessagePosted = function (user, message) {
        if (loggingOn)
            console.log('%s - server: onMessagePosted from %s: %s', getLoggingNow(), user.Name, message);
        $('#messages-list').append("<li class='list-group-item'><strong>" + getLoggingNow() + " - " + user.name + ":</strong> <pre> " + message+ " </pre></li>");
        refreshList('#messages-list');
    };

    var onGameStateUpdated = function (status, message, game, player){
        if (loggingOn)
            console.log('%s - server: onGameStatusUpdated - game: %s: %s - status: %s', getLoggingNow(), game.id, status);


        updateLocalGameStatus(game);
    };
  
   // startSignalR();
  
    function saveGame() {
     //   if (user.name == game.winner.Name) { // winner gets this honor
            gamesHubProxy.server.updateGameState(appClientState.sessionId,user.name, gameState.id,
                game.getState(), game.winner.isAttacker, game.attackerScore, game.defenderScore);
     //   }
    }

    /**
    * sets up the client state with the given session
    * @param {any} session
    */
    var setupClientStateWithSession = function (session) {
        if (session != null) {
            appClientState.session = session;
            appClientState.sessionId = session.sessionId;
            user.name = session.fullName;
            appClientState.loggedIn = session.isActive;
            setCookie(C_NSSID, appClientState.sessionId);
        }
        else {
            appClientState.session = null;
            appClientState.sessionId = "";
            user.name = "";
            appClientState.loggedIn = false;
            setCookie(C_NSSID, "");
        }
        setupMyAccount();
    };

    /**
     * Helper function for setting cookie and local storage
     * @param {any} key
     * @param {any} value
     */
    function setCookie(key, value) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();

        // store in local storage 
        if (window.localStorage != null){
            window.localStorage.setItem(key, value);            
        }
    }
    /**
     * Helper function for reading cookie
     * @param {any} key
     * @param {any} value
     */
    function getCookie(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        return keyValue ? keyValue[2] : null;
    }

    ///todo: automatic setup of an active game
    function setupGames(activeGameId) {
        // refresh games from the server
        _refreshGames();

        // set the game state
        $('#state').html(toDisplayString(Kharbga.GameState[game.getState()]));
      //  $('#message').html("<div class='alert alert-success'>Click on the New Game button to start a new game on this computer.</div>")


        selectActiveGameId(activeGameId);

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
                        $("#register-team-list").append("<option id=client_'" + this.systemId + "' value='" + this.name + "' ></option>");
                    });
                }
                else {
                    $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
                }
            });
        });
    }


    function updateBoardInfo(){
        if (game.is_in_setting_state() === true)
            boardEl.find('.square-d4').addClass('highlight-malha');
        else
            boardEl.find('.square-d4').removeClass('highlight-malha');

        if (gameState.attackerName == user.name )
            $('#game-attacker').text(gameState.attackerName + " (me)" );
        else
            $('#game-attacker').text(gameState.attackerName);

        if (gameState.defenderName == user.name)
            $('#game-defender').text(gameState.defenderName + " (me)" );
        else
            $('#game-defender').text(gameState.defenderName );
        //      
        updateScores(game);

        // update the move flags
        updateMoveFlags(game.move_flags());
        updateTurnInfo(game);

    }

    function resizeGame(e) {

        if (board == null)
            return;

        board.resize(e);
       // $('#currentGamePanel').nsScrollTo();

        updateBoardInfo();
    }
    // handler for resizing
    $(window).resize(resizeGame);

    setupMyAccount();
    setupFormsValidation();

    function playSound() {
        var sound = document.getElementById('sound');
        if (sound != null && typeof(sound) != 'undefined')
            sound.play();
    }
    // call to initialize the board after creating the object
    this.initBoard = function (config) {
        var cfg = {
            draggable: config.draggable,
            position: 'start',
            onDragStart: onDragStart,
            //  onDragMove: onDragMove,
            onMoveEnd: onMoveEnd,
            onDrop: onDrop,
            onClick: onClick,
        //    onDoubleClick: onDoubleClick,
        //    onMouseoutSquare: onMouseoutSquare,
        //    onMouseoverSquare: onMouseoverSquare,

            sparePieces: true,
            showErrors: 'console',
            //showErrors
            pieceTheme: config.themePath,

        };
        board = KharbgaBoard('board', cfg);
        boardEl = $('#board');
        $('#currentGamePanel').hide();
        resizeGame();
      
    };

    $('.nav-tabs a').on('shown.bs.tab', function(e){
        resizeGame();
      // alert('The new tab is about to be shown.' +e);
    });
    $('.nav-tabs a').click(function(e) {
        // No e.preventDefault() here.
        $(this).tab('show');
        resizeGame();
       // alert(e);
    });

    /** @summary starts and initializes connection to the server
     *  @returns true if successful, false otherwise
     */
    var _setupSignalR = function () {
        try {
            $.connection.hub.url = nsApiClient.baseURI + 'signalr';
            if (loggingOn) console.log("Hub URL: %s", $.connection.hub.url);

            $('#server-uri').text($.connection.hub.url); 

            gamesHubProxy = $.connection.gamesHub;
            $.connection.hub.logging = loggingOn;  // turn off  (config)

            if (gamesHubProxy == null || typeof gamesHubProxy.client == 'undefined') {
                setSystemError(true);
                return false;
            }

            gamesHubProxy.client.moveRecorded = onMoveRecorded;
            gamesHubProxy.client.send = onSendMessage;
            gamesHubProxy.client.hello = function () {
                if (loggingOn) console.log("%s - Hello from server", getLoggingNow());
                 $('#message').html("<div class='alert alert-success'>Hello from server.</div>")
                 $('#messages-list').append("<li class='list-group-item'>Hello from server</li>");
                 refreshList('#messages-list');
            };

            gamesHubProxy.client.gameDeleted = onGameDeleted;
            gamesHubProxy.client.appendMove = onAppendMove;
            gamesHubProxy.client.gameJoined = onGameJoined;
            gamesHubProxy.client.gameCreated = onGameCreated;
            gamesHubProxy.client.setCurrentPlayer = onSetupLocalPlayer;
            gamesHubProxy.client.joined = onJoined;
            gamesHubProxy.client.left = onLeft;
            gamesHubProxy.client.rejoined = onRejoined;
            gamesHubProxy.client.pong = onPong;
            gamesHubProxy.client.messagePosted = onMessagePosted;
            gamesHubProxy.client.gameStateUpdated = onGameStateUpdated;

            $.connection.hub.error(function(error) {
                console.log('Signalr Error: ' + error);
                console.log(error);
                appClientState.signalReInitialized = false;
                $("#signalr-status").html("<div class='alert alert-danger'>" + error+"</div>");
                $('#messages-list').append("<li class='list-group-item list-group-item-danger'>  " + error + "</li>");
                refreshList('#messages-list');
            });
            $('#messages-list').append("<li class='list-group-item list-group-item-success'>  " + "Setup" + "</li>");
            refreshList('#messages-list');
            return startSignalR();
        }
        catch (e) {
            setSystemError(true);
            appClientState.useServer = false;
            appClientState.signalReInitialized = false;
            console.log(e);
            $("#signalr-status").html("<div class='alert alert-danger'>Not setup</div>");

        }

        $.connection.hub.disconnected(function () {
            appClientState.signalReInitialized = false;
            appClientState.useServer = false;
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> disconnected " + $.connection.hub.id + "</li>");
            refreshList('#messages-list');

            $("#signalr-status").html("<div class='alert alert-danger'>Disconnected</div>");
            setTimeout(function () {
                if (loggingOn) console.log('%s - RestartSignalR after disconnect!', getLoggingNow());
                startSignalR();
            }, 3000); // Restart connection after 3 seconds.
        });
    };

    //_setupSignalR();
    //_refreshAppInfo();

    function startSignalR() {
        
        try {
         //   if (!appClientState.setupSignalR)
        //      _setupSignalR();

            $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
                .done(function () {
                    gamesHubProxy.server.hello(appClientState.sessionId);
                    if (loggingOn === true)
                        console.log('%s - startSignalR - connected, connection ID: %', getLoggingNow(), $.connection.hub.id);

                    appClientState.serverConnectionId = $.connection.hub.id;
                    appClientState.signalReInitialized = true;
                    appClientState.useServer = true;
                    // 
                    checkSessionCookie();
                    // moves the setup of the games on startup at the end of the checking session process
                    $("#signalr-status").html("<div class='alert alert-success'>Connected</div>");
                    $('#messages-list').append("<li class='list-group-item list-group-item-success'>  " + "Started" + "</li>");
                    refreshList('#messages-list');

                    setSystemError(false);

                    // check if we got a game to rejoin and refresh the active games
                    rejoinLastGameIfAny();
                })
                .fail(function () {
                    appClientState.signalReInitialized = false;
                    checkSessionCookie();
                    console.log('%s - startSignalR Could not Connect!', getLoggingNow());
                    setSystemError(true);
                    $("#signalr-status").html("<div class='alert alert-danger'>Not connected</div>");
                    appClientState.useServer = false;
                });

        }
        catch (e) {
            setSystemError(true);
            console.log(e);
            appClientState.useServer = false;
            $("#signalr-status").html("<div class='alert alert-danger'>Not Started</div>");
        }
    }

    //startSignalR();

    this.setupSignalR = _setupSignalR;

    function onFlipBoard(e){
        if (e!= null)
            e.preventDefault();

        if (board == null) {
            $('#message').html("<div class='alert alert-danger'>Game board is not initialized</div>");
            return;
        }
        board.flip();
        updateBoardInfo();   
    }
    this.flipBoard = function () {
        onFlipBoard();
    };

    this.setSessionId = function (sid) {
        setCookie(C_NSSID, sid);
        if (sid != "")
            checkSessionCookie();  // check it and update state
    };

    /** @summary checks the session cookie, setup the current games and last game if any 
     * 
     */ 
    this.setup = function () {
        checkSessionCookie();
        // the game will be rejoined if a valid session
        // guests will not be able to rejoin their games
        // rejoinLastGameIfAny();
    };

    function _ping(e){
        if (e!= null)
            e.preventDefault();

        // attempt to start SignalR if not init
        if (appClientState.signalReInitialized == false)
        {
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized){
            gamesHubProxy.server.ping(appClientState.sessionId).done(function () { setSystemError(false); });
        }
        else{

        }
    }
    
    this.ping = _ping;

    this.newGame = function (options) {
        var event = { data: options };
        onNewGame(event); // 
    };

    this.postMessage = function(msg){
        if (gamesHubProxy == null) {
            alert("Unable to connect with server");
            //setSystemError("Unable to connect with signalR hub");
            return;
        }
        gamesHubProxy.server.postMessage(appClientState.sessionId,user.name, msg.message);
    };


    this.getCurrentGame = function () {
        // 
        return  gameState;
    };

    this.getCurrentState = function () {
        // 
        return appClientState;
    };

    var updateBoardWithMove = function (move, highlightMove) {
        if (move == null)
            return;

        boardEl.find('.highlight-move').removeClass('highlight-move');
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        if (!move.exchangeRequest)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

        if (move.isSetting) {
            boardEl.find('.square-d4').removeClass('highlight-malha');
            boardEl.find('.square-d4').addClass('highlight-malha');
            if (highlightMove === true)
                boardEl.find('.square-' + move.to).addClass('highlight-move');
        }
        else {
            boardEl.find('.square-d4').removeClass('highlight-malha');
            if (highlightMove === true) {
                boardEl.find('.square-' + move.from).addClass('highlight-move');
                if (!move.exchangeRequest)
                    boardEl.find('.square-' + move.to).addClass('highlight-move');
                else
                    boardEl.find('.square-' + move.to).addClass('highlight-exchange');

                if (move.captured != null){
                    var capturedCells = move.captured.split(' ');

                    if (capturedCells != null) {
                        $.each(capturedCells, function (item, value) {
                            boardEl.find('.square-' + value).addClass('highlight-captured');
                        });
                    }
                }
                if (move.exchanged != null){
                    var exchangedCells = move.exchanged.split(' ');

                    if (exchangedCells != null) {
                        $.each(exchangedCells, function (item, value) {
                            boardEl.find('.square-' + value).addClass('highlight-exchange');
                        });
                    }
                }
            }
        }
    
        $('#play-move-player').html(move.playerName + " (" + (move.isAttacker ? "Attacker": "Defender") + ")");
        $('#play-move-number').html(move.number + " of " + gameState.moves.length);
 

        var html = "";
        if (move.isSetting) {
            html += "Set: " + move.to; 
        }else {
            html += "Move: " + move.from + "-" + move.to; 
        }
        if (move.exchangeRequest) {
            if (move.isAttacker)
                html += " - Exchange request Accepted";
            else
                html += " - Exchange request";
        }

        if (move.captured != "") {
            html += " - Captured: " + move.captured;
        }

        if (move.exchanged != "") {
            html += " - Exchanged: " + move.exchanged;
        }
        if (move.resigned) {
            if (move.isAttacker)
                html += " - Attacker Resigned";
            else
                html +=" - Defender Resigned" ;
        }

        $('#play-move-info').html(html);
        playSound();
       
    };

    this.playBegining = function () {
        console.log("playBeginning");
    
        // we now have a completed game
        console.log("playBeginning - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);

        var lastSettingPos = 48;
        if (appClientState.lastReplayPosition > lastSettingPos)
            appClientState.lastReplayPosition = lastSettingPos;
        else
            appClientState.lastReplayPosition = 0;


        board.position(gameState.moves[appClientState.lastReplayPosition].beforeFen, true);

        updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition], true);
        boardEl.find('.highlight-move').removeClass('highlight-move');

    };
    this.playBackward = function () {
        console.log("playBackward");
        if (appClientState.serverGame == null)
            return;

    //    if (gameState.status != 3)
    //        return;
        if (gameState.moves.length == 0)
            return;

        console.log("playBackward - status: %s", gameState.status);

        appClientState.lastReplayPosition--;
        if (appClientState.lastReplayPosition < 0) {
            appClientState.lastReplayPosition = 0;
            board.position(gameState.moves[appClientState.lastReplayPosition].beforeFen, true);
            updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition],false);
            return;
        }
        board.position(gameState.moves[appClientState.lastReplayPosition].afterFen, true);
        updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition],true);

    };
    
    /** @summary starts and initializes connection to the server
     *  @returns true if successful, false otherwise
     */
    this.initMessaging = function(){
       return  _setupSignalR();
    }; 
    var replayId = "";
    var replayOn = false;
    
    /** @summary starts the replay of a game - see game state
     */
    this.playStart = function () {
        console.log("playStart");
     
         if (gameState.status != 3)
              return;

        if (gameState.moves == null)
            return;

        console.log("playStart - status: %s", gameState.status);

        if (appClientState.lastReplayPosition < 0)
            appClientState.lastReplayPosition = 0;

        if (gameState.moves.length == 0) {
            // message
            return;
        }

        if (replayOn)
            return;

        board.position(gameState.moves[appClientState.lastReplayPosition].afterFen, true);
        updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition], true);
        $('#play-start').attr('class', 'disabled');
        $('#play-pause').attr('class', 'enabled');

        replayId = setInterval(function (playForward) {
            playForward();
        }, 3000, this.playForward);   // add option for replay speed
        replayOn = true;
    };
    this.playPause = function () {
        console.log("playPause");
       
        if (gameState.status != 3)
            return;

        console.log("playPause - status: %s", gameState.status);

        clearInterval(replayId);
        replayOn = false;
        $('#play-start').attr('class', 'enabled');
        $('#play-pause').attr('class', 'disabled');

    };
    this.playForward = function () {
        console.log("playForward");
      
    //    if (gameState.status != 3)
     //       return;

        // we now have a completed game
        console.log("playForward - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);

        appClientState.lastReplayPosition++;
        if (gameState.moves.length <= appClientState.lastReplayPosition) {
            appClientState.lastReplayPosition = gameState.moves.length - 1;
            board.position(gameState.moves[appClientState.lastReplayPosition].afterFen, true);
            updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition],false);
            clearInterval(replayId);
            replayOn = false;
            return;
        }
        board.position(gameState.moves[appClientState.lastReplayPosition].afterFen, true);
        updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition],true);

    };
    this.playEnd = function () {
        console.log("playEnd");
        if (appClientState.serverGame == null)
            return;
   

        // we now have a completed game
        console.log("playEnd - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);

        var lastSettingPos = 47;
        if (appClientState.lastReplayPosition < lastSettingPos)
            appClientState.lastReplayPosition = lastSettingPos;
        else
            appClientState.lastReplayPosition = gameState.moves.length - 1;

        if (gameState.moves.length > appClientState.lastReplayPosition)
            appClientState.lastReplayPosition = gameState.moves.length - 1;

        board.position(gameState.moves[appClientState.lastReplayPosition].afterFen, true);
        updateBoardWithMove(gameState.moves[appClientState.lastReplayPosition], true);

        boardEl.find('.highlight-move').removeClass('highlight-move');

    };
    var soundMuted = false; 
    var _soundToggle = function () {
        var sound = document.getElementById("sound");
        if (sound == null || typeof (sound) == 'undefined')
            return;

        soundMuted = !soundMuted;

        sound.muted = soundMuted;
        $('#sound-mute').removeClass('mute');
        if (soundMuted)
            $('#sound-mute').addClass('mute');

    };
    this.soundToggle = _soundToggle;

    this.soundUp = function () {
        var sound = document.getElementById("sound");
        if (sound == null || typeof (sound) == 'undefined')
            return;

        sound.muted = false;
        var volume = sound.volume;

        volume += 0.2;
        if (volume > 1.0)
            sound.volume = 1.0;
        else
            sound.volume = volume;

    };
    this.soundDown = function () {
        var sound = document.getElementById("sound");
        if (sound == null || typeof (sound) == 'undefined')
            return;

        sound.muted = false;
        var volume = sound.volume;
        volume -= 0.2;

        if (volume < 0.2)
            sound.volume = 0.2;
        else
            sound.volume = volume;
    };

    this.setVolume = function (volume) {
        var sound = document.getElementById("sound");
        if (sound == null || typeof (sound) == 'undefined')
            return;

        var volume2 = $('#sound-volume').val();
        var volumeNumber = Number.parseFloat(volume2);
        sound.muted = false;
        if (volume < 0.2)
            sound.volume = 0.2;
        else
            sound.volume = volumeNumber;
    };

    this.selectGame = function (gameId) {

        if (typeof gameId == 'undefined' || gameId == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid game selected</div>");

            return;
        }

        resetLocalGame();
        if (typeof gamesHubProxy == 'undefined' || gamesHubProxy == null)
        {
            $('#message').html("<div class ='alert alert-danger'>System issue - not connected to server</div>");
            return;        
        }
        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.sessionId,user.name, gameId, false);

    };

    this.setSystemError = function(show){
        if (show)
            $('#message').html("<div class='alert alert-danger'>Messaging Server Error</div>");
        else
            $('#message').html("");
    };
}; 
