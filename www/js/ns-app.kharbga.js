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

    var userOptions = {
        highlightLastMove: true,
        highlightLastMoveMilliSecondsBeforeTimeout: 2000,
        displayLastMove: true,
        playSoundAfterMove: true
        // add different types of sound depending on success or failure of last action
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
        backgroundJobId: -1, // the background computer player timer
        playOptions: playOptions,
        userOptions: userOptions
        
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


    /* the game events */
    /**
     * Handler for the local engine when a new game is started
     * @param {any} eventData -- the event data
     */
    function onNewGameStarted(eventData) {
        logMessage("event: onNewGameStarted - game Id: " + eventData.source.id);
        logObject(eventData);
        var message = "Started a new game";
        displaySuccessMessage(message);
        displayGameMessage(message);

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
        logMessage("event: onNewPlayerTurn - player: " + eventData.player.name);
        $('#player-turn').html(eventData.player.name);

        var message = "It is the turn  of <strong style='color:orange'>" +
            eventData.player.name;
      
        if (user != null && !user.isSpectator)  {
            if (user.isAttacker === true && game.turn() == 'a')
                message += " (Your turn) ";

            if (user.isAttacker === false && game.turn() == 'd')
                message += " (Your turn) ";
        }
        message += "</strong> to play";
        displaySuccessMessage(message);
        displayGameMessage(message);
       
        $("#move-message").val('');  // clears the last move message

        updateBoard(eventData.source);
        currentMove.copyToLastAndReset();

        if (userOptions.highlightLastMove) {
            setTimeout(function () {
                removeSelectedCells();
                removeLastMoveHighlighting();
            },userOptions.highlightLastMoveMilliSecondsBeforeTimeout);           
        }       
    }
  
    /**
     * handler for when a setting is completed
     * @param {any} eventData: the event data
     */
    function onNewSettingCompleted(eventData) {
        logMessage("event: onNewSettingCompleted - cell: " + eventData.targetCellId);
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
        var message = "It is the turn  of <strong style='color:orange'>" + eventData.player.name;

     // Indicator for local player that it is their turn   
        if (!user.isSpectator){
            if (user.isAttacker === true && game.turn() == 'a')
                message += " (Your turn) ";

            if (user.isAttacker === false && game.turn() == 'd')
                message += " (Your turn) ";
        }

        message+=" </strong>to set the 2nd piece ";
        displaySuccessMessage(message);
        displayGameMessage(message);
        updateBoard(eventData.source);

        currentMove.from = "spare";
        currentMove.to = eventData.targetCellId;
   
        /* highlight the previous move */
        var source = boardEl.find('.square-' + eventData.targetCellId);
        source.addClass('highlight-move');     
           
    }

    /**
     * @summary Handler for when the settings phase is completed
     * @param {any} eventData: the event data
     */
    function onSettingsCompleted(eventData) {
        logMessage("event: onSettingsCompleted - final board state: %s" + eventData.source.fen());

       var message = "The setting phase is now completed. It is the Attacker turn to move a piece to the middle cell. ";
        displayInfoMessage(message);
        displayGameMessage(message);
        gameState.state = eventData.source.getState();

        $('#state').html(toDisplayString(Kharbga.GameState[gameState.state]));

        updateScores(eventData.source);

        // display the exchange request fields
        $('.exchangeRequest').show();

        boardEl.find('.square-d4').removeClass('highlight-malha');

       
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
     * @summary Handler for when a move is completed and the same player must continue moving using the same piece
     * @param {any} eventData: the event data
     */
    function onNewMoveCompletedContinueSamePlayer(eventData) {
        if (loggingOn){
        console.log("%s - event: onNewMoveCompletedContinueSamePlayer - source: %s - from %s - to: %s ",
            getLoggingNow(), eventData.source.fen(), eventData.from.id, eventData.to.id);
        }
        var message = "Same player must continue playing using the same soldier now on: <strong> " +
            eventData.targetCellId  + "</strong>. There are still pieces that could be captured.";
        displaySuccessMessage(message);
        displayGameMessage(message);

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
       
    }

    /**
     * @summary handler for the player selecting a cell and not moving and staying the same cell. This could indicate a player
     * selecting a piece for exchange
     * @param {any} eventData -- the action data
     */
    function onNewMoveCanceled(eventData) {
        logMessage("event: onNewMoveCanceled - target Cell Id: " + eventData.targetCellId); 
    }

    /**
     * @summary Handler for an invalid move
     * @param {any} eventData - the event data
     */
    function onInvalidGameMove(eventData) {
        logMessage("event: onInvalidMove - from: "+ eventData.from.id + " - to: " + 
            eventData.to.id);
    }

    /**
     * @summary Handler for when the game is over
     * @param {any} eventData - the game event info
     */
    function onWinnerDeclared(eventData) {
        logMessage("event: onWinnerDeclared - winner: " + eventData.player.name);
        displaySuccessMessage("Game Over. Winner is: <strong>" + eventData.player.name + " </strong>");

        $('#state').html(toDisplayString(Kharbga.GameState[eventData.source.getState()]));
        gameState.state = eventData.source.getState();
        gameState.status = Kharbga.GameStatus.Completed;

        updateLocalGameStatus(gameState);

        updateBoard(eventData.source);

        currentMove.copyToLastAndReset();
        currentMove.reset();

        if (userOptions.highlightLastMove) {
            setTimeout(function () {
                removeSelectedCells();
                removeLastMoveHighlighting();
            }, userOptions.highlightLastMoveMilliSecondsBeforeTimeout);
        }  
       
       // turn off the background computer thread
        if (typeof appClientState.backgroundJobId == "number" && appClientState.backgroundJobId > 0){
            clearInterval(appClientState.backgroundJobId);
            appClientState.backgroundJobId = -1;
            displayComputerMessage("Ended computer play task");
        }
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
            displayInfoMessage('Game setting is done. You could only move pieces on the board now.');
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
            logMessage("allowedToMove() - Error - user is null.");
            return false;
        }
        if (user.isSpectator === true) {
            displayWarningMessage("As a spectator you are not allowed to make any moves. You could however post comments to the players.");
            return false;
        }

        if (playOptions.playOnSameComputerWithOpponent == false)
        {
            // check if allowed to make a move
            if (game.turn() === 'a' && user.isAttacker !== true) {
                $('#message').html("<div class='alert alert-warning'>It is the attacker's turn to play.</div>");
                return false;
            }
            if (game.turn() === 'd' && user.isAttacker !== false) {
                $('#message').html("<div class='alert alert-warning'>It is the defender's turn to play.</div>");
                return false;
            }
        }
   
        return true;
    }


    /**
     * @summary checks if the source square is valid depending on the current game state
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
     * @summary Main entry point for processing  the user action
     * @param {any} source -- the source piece
     * @param {any} target -- the target piece
     */
    function processAction(source, target) {
        var ret = false;
        var gameMove = new Kharbga.GameMove();
        gameMove.player = game.getCurrentPlayer();

        gameMove.playerName = gameMove.player.name; 

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
                displayWarningMessage("Invalid move from " + source + " to " + target + ". You may only move your soldiers to adjacent orthogonal free cells");
                displayGameMessage("Invalid move from " + source + " to " + target + ". You may only move your soldiers to adjacent orthogonal free cells");
    
                return false;
            }

            ret = game.processMove2(gameMove, gameEvents);
        }
        else {
            if (game.is_in_setting_state()) {
                gameMove.isSetting = true;
                ret = game.processSetting(target, gameMove.resigned);
                onMoveProcessed(ret, gameMove);
            }
            else {
                ret = false;
            }
        }

        return ret; 
    }

    /**
     * @summary Callback for when the action is processed
     * @param {any} ok - the processing status
     * @param {any} gameMove - the move is processed
     */
    function onMoveProcessed(ok, gameMove) {
        if (ok === false){
            logMessage("Failed to process move");
            log(gameMove); 
            displayWarningMessage("Failed to process move");
            
            //return;  should still update the UI with 
        }
        // update the game move
        gameMove.afterFen = game.fen();
        gameMove.captured = lastMove.captured;
        gameMove.exchanged = lastMove.exchanged; 
        lastMoveId = createMoveId();
        gameMove.clientId = lastMoveId;
        
        if (gameMove.number <= 0)
            gameMove.number = gameState.getNextMoveNumber(); 

        // update the UI with the last action info
        updateLastActionInfo(gameMove);

        // complete the move and return if not using the server
        if (appClientState.useServer === false)
        {
         
            displayGameMessage("Recorded locally move #: " + gameMove.number);
          
            onMoveRecorded(true,"",gameMove);
            completeMoveProcessed();
            return;
        }
    
        if (appClientState.useServer === true){
            // start signalR if not initialized
            if (!appClientState.signalReInitialized ) 
                startSignalR();

            // submit to the server
            if (gameState.id != "" ) {
                // notify server pf the setting
                displayNetMessage("Recording move # "+ gameMove.number);
                gamesHubProxy.server.recordMove(appClientState.sessionId,gameState.id, 
                    user.name,
                    gameMove.isAttacker, gameMove.isSetting, gameMove.from, gameMove.to, 
                    gameMove.resigned, gameMove.exchangeRequest,
                    gameMove.beforeFen, game.fen(), gameMove.message, lastMoveId,
                    lastMove.captured, lastMove.exchanged
                ).done(function () {
                    logMessage('Done  recordedMove move Id : ' +  lastMoveId);
                    displayNetMessage("Done recording move # " + gameMove.number);
                    completeMoveProcessed();

                })
                .fail(function (error) {
                    logMessage("Failed recordMove - moveId : " + lastMoveId);
                    logObject(error);
                    displayNetMessage("Failed to record move - error: " + error);
                });
            }
        }   
    }

    /** 
     * @summary Handler to complete a move locally 
     */
    function completeMoveProcessed() {
        $("#user-message").text("");
        $("#move-message").text("");
     
        //play sound - add check for user preferences
        if (userOptions.playSound === true){
            playSound();  
        }
        // update the game state with the latest score
        gameState.attackerScore = game.attackerScore;
        gameState.defenderScore = game.defenderScore;
        gameState.state = game.getState();

        updateLocalGameStatus(gameState); 

        // good place to reset the current move
        // check if game is over
        if (game.game_over()) {
            updateBoard(game);
            updateBoardInfo();
            gameState.status = Kharbga.GameStatus.Completed;
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
     * @summary handler for when click  a cell for setting or for a move (from or to)
     * @param {any} square -- the clicked square
     * @param {any} piece  -- the piece on the square
     * @param {any} position -- current game position
     * @param {any} orientation -- the game orientation 
     */
    var onClick = function (square, piece, position, orientation) {
        logMessage("onClick - square: " + square + " - piece: " +  piece);

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
                displayInfoMessage("Selected cell <strong> " + square + " </strong> for moving...");
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
            displayWarningMessage("Canceled cell selection for square <strong> " + appClientState.selectedSource + " </strong>for moving...");
            removeSelectedCells(); // from the previous move
            appClientState.selectedSource = "";
            return;
        }

      
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
     * @summary Handler for when double clicking a cell for setting or for a move (from or to)
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

     //   boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

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
     * @summary Identifies the local player opponent role based on the app state
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
     * @summary Checks the board and play a move if its the computer turn
     * 
     */
    function checkBoardAndPlayIfComputer() {
        displayComputerMessage(getLoggingNow() + " - checking turn...");
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

        displayComputerMessage(getLoggingNow() + " - thinking...");
        $('#computer-message').html("<div class='alert alert-warning'>Thinking... </div>");
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
       // $('#computer-message').html("");
    }

  
    /**
     * @summary Generates a computer setting or move and submits ot the game engine
     */
    function computer_play() {
        // the game move to generate
        var gameMove = new Kharbga.GameMove();

        var computerPlayer = gameState.getComputerPlayer();
        var moveSourceRequired = game.move_source_required();
        logMessage("computer_play() as" + getComputerRole() + "required From Piece: "+ moveSourceRequired);
              
        appClientState.computerIsPlaying = true;
        gameMove.player = computerPlayer;
        gameMove.playerName = computerPlayer.name;
        gameMove.from = "";
        gameMove.to = "";
        gameMove.exchangeRequest = false;  // default to true for computer if playing unreachable pieces
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

            if (settings== null || settings.length <= 0) {        
                // if computer can not play -- resign or pass
                game.check();
                appClientState.computerIsPlaying = false;
                displayComputerMessage("Computer: Unable to find setting");
                return;
            }
            gameMove.from = "spare";

            if (playOptions.randomSetting) {
                var settingId = getRandom(0, settings.length - 1);
                gameMove.to = settings[settingId];
            }
            else{
                gameMove.to  = settings[0];
            }
            appClientState.firstComputerSetting = false;
            logMessage("Generated computer setting:  " + gameMove.to);
            displayComputerMessage("Generated computer setting:  " + gameMove.to);
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
                        gameMove.exchangeRequest = true;
                    }
                }

                if (moves == null || moves.length == 0) { // no unreachable?{
                    moves = game.moves(moveSourceRequired);
                }         
                if (moves == null || moves.length <= 0) {
             
                    // if computer can not play -- resign or pass
                    game.check();
                    appClientState.computerIsPlaying = false;
                    displayComputerMessage("No moves are found by computer. Passing...");
                    return;
                }
                
                var moveId = 0;
                if (moveSourceRequired!= null && moveSourceRequired.length >0){
                    for(var item = 0; item< moves.length; item++ ){
                        if (moves[item].source == moveSourceRequired){
                            moveId = item;
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
                gameMove.from = move.from;
                gameMove.to = move.to;
                logMessage("Game Move generated: ");
                logObject(gameMove);
                displayComputerMessage("Generated computer move: " + gameMove.from + "-" + gameMove.to);
                  
            }
        }
       
        $('#gameMove').html(gameMove.from + "-" + gameMove.to);  
        var ret = false;    
        gameMove.resigned = false;
        gameMove.message = "";
        gameMove.isAttacker = false;
        if (game.turn() == 'a') {
            gameMove.isAttacker = true;
        }
        gameMove.isSetting = false;
        gameMove.beforeFen = game.fen();

        if (game.is_in_moving_state()) {
            ret = game.processMove(gameMove.from, gameMove.to, gameMove.resigned,gameMove.exchangeRequest);
        }
        else {
            if (game.is_in_setting_state()) {
                gameMove.isSetting = true;
                ret = game.processSetting(gameMove.to);
            }
            else {
                ret = false;
            }
        }
        gameMove.afterFen = game.fen();
        gameMove.captured = lastMove.captured;
        gameMove.exchanged = lastMove.exchanged;
        var gameMoveText = gameMove.from + "-" + gameMove.to;
        if (gameMove.captured.length > 0)
        {
            gameMoveText += ": (c) - ";
            gameMoveText += gameMove.captured;
        }
        if (gameMove.exchanged.length > 0)
        {
            gameMoveText += ": (e) - ";
            gameMoveText += gameMove.exchanged;
        }
        $('#gameMove').html(gameMoveText);  

        if (ret == true) {
            lastMoveId = createMoveId();
            gameMove.clientId = lastMoveId;
            gameMove.number = gameState.getNextMoveNumber();

            // submit to the server
            if (gameState.id != "" && appClientState.useServer === true && computerPlayer!= null) {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(appClientState.sessionId,gameState.id, computerPlayer.name,
                    gameMove.isAttacker, gameMove.isSetting, gameMove.from, gameMove.to, gameMove.resigned, 
                    gameMove.exchangeRequest, gameMove.beforeFen, gameMove.afterFen, gameMove.message, 
                    gameMove.clientId,
                    lastMove.captured, lastMove.exchanged
                ).done(function () {
                    displayNetMessage("Done recording move number: " + gameMove.number);
                    board.position(game.fen(), false); // update the board with the computer move
                    playSound();

                }).fail(function (error) {
                    logMessage("Failed recording move. Error:");
                    displayNetMessage("Failed recording move number: " + gameMove.number);
                    logObject(error);
                });
            }
            else { 
                displayGameMessage("Recording computer move #: " + gameMove.number);
                 onMoveRecorded(true,"",gameMove);  
                 // record the move locally 
                 completeMoveProcessed();

                board.position(game.fen(), false); // update the board with the computer move
                playSound();
            }
        }

        appClientState.computerIsPlaying = false;
    }

    /**
     * @summary Updates the board position with the local given game position
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

        resizeGame();

    }

    function clearLastMoveInfo() {
        $('#gameMove').empty();
        $('#move-captured').empty();
        $('#move-exchanged').empty();
    }

    /**
     * @summary Updates the board game scores based on the given game
     * @param {any} aGame 
     */
    function updateScores(aGame) {
        if (aGame == null) {
            console.log("updateScores - null aGame");
            return;
        }
        $('#attacker_score').html(aGame.getAttackerScore().toString());
        $('#defender_score').html(aGame.getDefenderScore().toString());

        // the score is shown in various locations using this class
        $('.attacker-score').html(aGame.getAttackerScore().toString());
        $('.defender-score').html(aGame.getDefenderScore().toString());

        // the board state
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
     * @summary Displays an error message to the user
     * @param {string} message - the message to display
     */
    function displayErrorMessage(message){
        $('#message').html("<div class='alert alert-danger'>" + message + "</div>");
    }

    /**
     * @summary Displays a success message to the user
     * @param {string} message - the message to display
     */
    function displaySuccessMessage(message){
        $('#message').html("<div class='alert alert-success'>" + message + "</div>");
    }

    /**
     * @summary Displays a message about the game 
     * @param {string} message - the message to display
     */
    function displayGameMessage(message){
        $('#game-message').html("<div class='alert alert-info'>" + message + "</div>");
    }
     /**
     * @summary Displays a message status change from the messaging server
     * @param {string} message - the message to display
     */
    function displayNetMessage(message){
        $('#net-message').html("<div class='alert alert-info'>" + message + "</div>");
     //   $('#message').html("<div class='alert alert-info'>" + message + "</div>");
        $('#main-message').html("<div class='alert alert-info'>" + message + "</div>");
    }

    /**
     * @summary Display computer Message
     * @param {string} message - the message to display
     */
    function displayComputerMessage(message){
        $('#computer-message').html("<div class='alert alert-info'>" + message + "</div>");
    }

    /**
     * @summary Displays an informational message to the user
     * @param {string} message - the message to display
     */
    function displayInfoMessage(message){
        $('#message').html("<div class='alert alert-info'>" + message + "</div>");
    }
    
    /**
     * @summary Displays a warning message to the user
     * @param {string} message - the message to display
     */
    function displayWarningMessage(message){
        $('#message').html("<div class='alert alert-warning'>" + message + "</div>");
    }

    /**
     * @summary Starts a new game - the main entry point
     * @param {Kharbga.PlayOptions} e - the event data
     */
    function onNewGame(e) {
        if (e == null || e.data == null) {
            logMessage('New Game - Invalid input.');
            return false;
        }
       
        resetLocalGame();
        var options = e.data;

        // check if the user is logged in or not if requesting to play game over the network
        // 
        if (options.overTheNetwork === null || options.overTheNetwork === true){

            if (appClientState.loggedIn === false){
                displayErrorMessage("Please <a href='javascript:$.appViewHandler.openLoginPanel()'>login</a> to play network games. ");
                if ($.appViewHandler != null && typeof($.appViewHandler.openLoginPanel) === 'function')
                    $.appViewHandler.openLoginPanel();
                return; 
            }
        }
        // 
        appClientState.useServer = e.data.overTheNetwork === true; // change server mode dep on user request
        playOptions.useServer = appClientState.useServer; 
        playOptions.playOnSameComputerWithOpponent = (e.data.againstComputer === false && e.data.overTheNetwork == false);


        if (appClientState.useServer === true) {
            if (gamesHubProxy != null){
                // call the server to start the new game
                gamesHubProxy.server.createGame(appClientState.sessionId,user.name, e.data.asAttacker, e.data.againstComputer)
                    .done(function () {
                        displayGameMessage('Created new game on server successfully');                   
                        logMessage("Done Server Invocation of create game");

                    }).fail(function (error) {
                        displayGameMessage('Failed to create new game on server. Error: ' + error);
                        logMessage("Invocation of createGame failed. Error: " + error);
                    });
            }
            else{
                displayErrorMessage("Unable to start game on the server - server is not up");
                displayNetMessage("Unable to start game on the server - server is not up");
            }
        }
        else{
            // Create a new game locally
            displayGameMessage("Creating a local game...");
        
            gameState.reset();
            gameState.id = createGameId();
            if (appClientState.loggedIn === false){
                user.name = "I";
            }
            user.isSpectator = false;
            user.isAttacker = e.data.asAttacker; 

            var opponent = {
                name:"Friend",
                isSpectator: false,
                isAttacker: false,
                isSystem: true
            };         
            user.isAttacker = e.data.asAttacker;
            opponent.isAttacker = !e.data.asAttacker;
            opponent.isSystem = e.data.againstComputer;   

            if (opponent.isSystem === true){
                opponent.name = "System";
            }

            if (e.data.asAttacker === true)
            {
                gameState.attackerName = user.name;
                gameState.attacker = user;
                gameState.defender = opponent;
                gameState.defenderName = opponent.name;
            }
            else{
                gameState.defenderName = user.name;
                gameState.defender = user;
                gameState.attacker = opponent;
                gameState.attackerName = opponent.name;
            }

            if (e.data.againstComputer === true || e.data.overTheNetwork === false){
                game.status = Kharbga.GameStatus.Active;
                game.state  = Kharbga.GameState.Settings;
            }
           
            onGameCreated(true,"",gameState,user); 
            onSetupLocalPlayer(user,gameState);
        }
    }
 
    /**
     * @summary Call back when a game is created by the server
     *  or called back when a game is joined to the Joiner of the game (including spectator)
     * Also called when started a game with no server option
    */
    var onGameCreated = function (status, error, gameInfo, playerInfo) {
        logMessage("On game Created - status: " +  status);

        if (status === false) {
            logMessage("error creating game");
            logObject(error);
            displayGameMessage("Unable to create game - ES13");
            return;
        }
        // add to the games list
        logMessage("Game Created: ");
        displayGameMessage("Created game successfully");
        logObject(gameInfo);

        if (appClientState.useServer === true){
         
            // add the game to the list if coming from the server
            appendGameToGamesList(gameInfo,true);      

            // update local game state
            gameState.update(gameInfo); 
        }

        // setup the game and the board and update the UI
        setupLocalGame(gameInfo);
   
        // start the background timer for the computer if we have a computer playing
        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null){
            logMessage("starting computer play timer...");
            displayComputerMessage("Started computer player task");
            appClientState.backgroundJobId = setInterval(checkBoardAndPlayIfComputer,4000);
        }
    };

    /**
     * @summary: Clears the local game and board 
     * 
     */
    function resetLocalGame() {
        // create a new instance for the local game
        //delete game;         
        game = new Kharbga.Game(gameEvents, boardEvents);
        appClientState.loaded = false;
        
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

       // setCookie("_nsgid", "");

        // hide the panel (?)
      //  $('#currentGamePanel').hide();
        _soundToggle();

    }
    /**
     * @summary Loads a sample game setting (fen) 
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
   
    /**
     * Clears the game and the board. The board is a set with an empty position string or fen
     */
    function onClear(e) {

        e.preventDefault();

        resetLocalGame();
        setCookie("_nsgid", "");
        // clear any computer thread stated
        if (appClientState.backgroundJobId> 0){
            clearInterval(appClientState.backgroundJobId);
            appClientState.backgroundJobId = -1;
            displayComputerMessage("Ended computer play task");
        }
    }

    function onResign(e){
        e.preventDefault();
       
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
    * @summary retrieves the stored active game id 
    */
    function getLastGameCookie() {
        var cookie = getCookie("_nsgid");
        if (typeof cookie === "string" && cookie.length > 10)
            return cookie;
     
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
            displayNetMessage("Joining previous game - id: " + gid);
        //    gamesHubProxy.server.reJoinGame(user.name, gid, false);
            // tell the server to rejoin this connection with the game
            gamesHubProxy.server.joinGame(appClientState.sessionId,user.name, gid, false).done(function(){
                displayNetMessage("Done joining previous game - id: " + gid);
            });
        }
        else{
            // check local saved game
            loadGame();
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
    $('#new-game').on('click', { asAttacker: true, againstComputer: true,overTheNetwork:true }, onNewGame);
    $('#new-game-attacker').on('click', {asAttacker: true, againstComputer:false,overTheNetwork:true}, onNewGame);
    $('#new-game-defender').on('click', { asAttacker: false, againstComputer: false,overTheNetwork:true },onNewGame);
    $('#new-game-attacker-system').on('click', { asAttacker: true, againstComputer: true,overTheNetwork:true }, onNewGame);
    $('#new-game-defender-system').on('click', { asAttacker: false, againstComputer: true,overTheNetwork:true}, onNewGame);
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
   
    /**
     * @summary handle for when a move is recorded
     * @param {any} status -- move status
     * @param {any} errorMessage -- error message if move failed to record
     * @param {any} gameMove -- the game move to record
     */
    var onMoveRecorded = function (status, errorMessage, gameMove) {
        if (status === false) {
            logMessage("server - error recording move. Error: "+ errorMessage);
            displayNetMessage("Failed to process move by the server. Error: " + errorMessage);
            return;
        }
        if (gameMove == null) {
            logMessage("server - error recording move - invalid game move passed");
            displayNetMessage("Server Record Move - Invalid Game Move");
            return;
        }

        // add the move to the local game
        gameState.moves.push(gameMove);
      
        // if the move is already submitted to the local game (by real player or computer) just add to the Move history and 
        if (lastMoveId === gameMove.clientId) {
            // append the move to the game history
            appendMoveToGameHistoryList(gameMove);
            logMessage("server - did not record setting/move in local game for local moveId: "+
                 lastMoveId);
            displayGameMessage("Completed recording move #: " + gameMove.number);
            return; 
        }
    
        var ret;
        logMessage("server - recording setting/move in local game for server Move ID: " +gameMove.clientId);
        displayGameMessage("Processing server move locally");
        if (game.is_in_moving_state()) {
            ret = game.processMove(gameMove.from, gameMove.to, gameMove.resigned, gameMove.exchangeRequest);
        }
        else {
            ret = game.processSetting(gameMove.to);
        }
        updateBoard(game);
        updateLastActionInfo(gameMove);
        if (ret == true){
            displayGameMessage("Completed processing server move successfully");
            playSound();
        }
        else {
            // play error sound
            displayGameMessage("Failed to process server move successfully");
        }

        // append the move to the game history
        appendMoveToGameHistoryList(gameMove);
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

    /**
     * @summary Updates the UI display of the last action 
     * @param {*} gameMove - the game move info
     */
    function updateLastActionInfo(gameMove) {

        
        $('#move-captured').html(gameMove.captured);
        $('#move-exchanged').html(gameMove.exchanged);

        var gameMoveText = gameMove.from + "-" + gameMove.to;
        if (gameMove.isAttacker)
            gameMoveText += " (A) ";
        else
            gameMoveText += " (D) ";

        if (gameMove.captured.length > 0)
        {
            gameMoveText += ": captured - ";
            gameMoveText += gameMove.captured;
        }
        if (gameMove.exchanged.length > 0)
        {
            gameMoveText += ": exchanged - ";
            gameMoveText += gameMove.exchanged;
        }
        if (gameMove.resigned === true){
            gameMoveText += ": resigned ";
        }
        if (gameMove.exchangeRequest){
            if (gameMove.isAttacker)
                gameMoveText += (" Exchange req. accepted "); // + gameMove.exchangeRequestAttackerPiece1 + " " + gameMove.exchangeRequestAttackerPiece2);
            else
                gameMoveText += (" exchange req. ");// + gameMove.exchangeRequestDefenderPiece);

        }
        $('#gameMove').html(gameMoveText);  
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
     * @summary Sets up the local player info 
     * @param {any} player -- the player
     * @param {any} serverGame -- the game is not required
     */
    var onSetupLocalPlayer = function setupLocalPlayer(player, serverGame) {
        if (typeof player == "undefined" || player == null) {
            logMessage("setCurrentPlayer - Invalid player passed");
            return;
        }
        displayNetMessage("Setup up local user - name: " + player.name);
        user.update(player);
        
        if (typeof(serverGame) === "undefined" || serverGame == null) {
            logMessage("setCurrentPlayer - invalid game passed ");
            logNetMessage("Setup up local user error - SE21");
            return;
        }
      
        setupResignCheckbox();

        // refresh the myAccount info
        setupMyAccount();
    };
   
    /** 
     * @summary handler when the game is selected by a player. All users in the game group 
     *  will receive a this message
     *  We do not players to reset their game if a spectator just joins the game
     * @param {gameInfo} - the game joined 
     * @param {player} player - the player that joined the game
     */
    var onGameJoined = function (gameInfo, player) {
      
        if (typeof(gameInfo) === "undefined" || gameInfo == null)
        {
            logMessage("server - onGameJoined - invalid game ");
           // displayNetMessage("Join Game Error - SE22");    
            return;
        }

        logMessage("Player joining: ");
        logObject(player);

        // add to the games list
        logMessage("Game Joined: ");
        logObject(gameInfo);
        displayGameMessage("Joined game id: " + gameInfo.id);    
           
        // setup the local game with this
        setupLocalGame(gameInfo);
      
        // start the background timer for the computer if we have a computer playing
        if (appClientState.backgroundJobId> 0){
            clearInterval(appClientState.backgroundJobId);
            displayComputerMessage("Ended computer play task");
        }

        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null && 
            gameInfo.Status < Kharbga.GameStatus.Completed){
            logMessage("starting computer play timer...");
            displayComputerMessage("Started computer player task");
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
        if (typeof(gameInfo) === "undefined" || gameInfo === null) {
            logMessage("setupLocalGame - Invalid game passed");
            return;
        }
        
        // clear the local game
        resetLocalGame();

        // update the game players info
        game.attacker.name = gameInfo.attackerName;
        game.defender.name = gameInfo.defenderName;
        game.state = gameInfo.state;

        // update the game players info - is this needed
        game.setPlayerNames(gameInfo.attackerName,gameInfo.defenderName);

        // update the local game state if it is not already the same
        if (gameState != gameInfo)
            gameState.update(gameInfo);

        displayGameMessage("Updated local game with joined game " );    
        
        
         game.setupWith(gameInfo);// replay all existing moves
       //  if (gameInfo.moves!= null && gameInfo.moves.length> 0){
       //     var lastMove = gameInfo.moves[gameState.moves.length-1];
       //     game.set(lastMove.afterFen);  // set the board with the last move pos
       //     game.state = gameInfo.state;
        //}
        
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
        // setCookie("_nsgid", gameInfo.id);
    }

    /** 
     * @summary updates the ui with the game state 
     *  @param - the game state
     */
    function updateLocalGameStatus(gameInfo) {
        if (typeof (gameInfo) === "undefined" || gameInfo == null) {
            logMessage("updateLocalGameStatus - Invalid game passed ");
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

        if (appClientState.useServer === true){
             updateGameInGameList(gameInfo);
        }

        if (game.winner != null){
            if (game.winner.isAttacker)
                $('#game-winner').html(game.winner.name + " (Attacker)");
            else
                $('#game-winner').html(game.winner.name + " (Defender)");        

        }
    }

    /**
     * @summary Updates the item status in the games list
     * @param {Kharbga.GameInfo} gameInfo - the game from the server to use to update the list
     */
    function updateGameInGameList(gameInfo) {
        $('#' + gameInfo.id).remove();
         appendGameToGamesList(gameInfo,true);  // move the game to the top

     /*   // update the color of the list depending on the status
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
    */
    }

    /**
     * @summary Adds a game to the active games list
     * @param {any} gameInfo - the game from the server to add to the list
     * @param {boolean} front - if true, the game is put in the front of the list 
     */
    function appendGameToGamesList(gameInfo, front) {
        if (gameInfo == null)
            return;

        $('#' + gameInfo.id).detach(); // removes the game from the list if any

        var html = "<li id='" + gameInfo.id + " ' class='list-group-item ";

        // add the class of the item
        html += getStatusCss(gameInfo.status);
        html += "'>";
        
        // add a play link if game is not joined
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
        // add watch button 
        html += "<br><button id='watch-" + gameInfo.id + "' class='btn btn-default'>Watch</button";
        html += "</li>";

        if (front === true){
            $('#games-list').prepend(html);
        }
        else{
            $('#games-list').append(html);
        }

        $('#linka-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#linkd-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#watch-' + gameInfo.id).on('click', gameInfo, onGameSelected);
     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));          
    }

    
    var onGameDeleted = function (gameInfo) {
        // remove from the games list
        console.log("%s - Game Deleted: ", getLoggingNow());
        console.log(gameInfo);
    };


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
      
        logMessage("_refreshingGames from the server : ");
        
        if (appClientState.userServer === false){
            displayWarningMessage("Messaging Server Not To Use Mode - Action: Refresh Active Games");
            return;
        }
   
        displayGameMessage("Refreshing active games from the server...");
   
        $('#games-list').empty();
   
         gamesHubProxy.server.getGames(appClientState.sessionId).done(function (gamesResult) {
            if (gamesResult.success === true) {
                $.each(gamesResult.object, function () {
                    appendGameToGamesList(this);
                    
                });
                refreshList('#games-list');
            }
            logMessage("_refreshingGames from the server - selecting active game Id: " +  gameState.id);
            
            displayGameMessage("Done refreshing active games from the server.");
            
            //selectActiveGameId(gameState.id);
        });
    }

    // externalize for client apps
    this.refreshGames = _refreshGames;

    /**
     * @summary Handler for when a game is selected for joining or watching from the game list
     * @param {any} the link event
     */
    function onGameSelected(e) {
        e.preventDefault();
        logMessage("onGameSelected: ");
        logObject(e);
        
        var data = e.data;
        if (e.data == null || typeof e.data === undefined) {
            logMessage("onGameSelected - invalid data passed with the entry ");
            return;
        }

        if (appClientState.userServer === false){
            displayNetMessage("Messaging Server Not To Use Mode - Action: Join or Watch an Active Game");
            return;
        }
 
        displayNetMessage("Join/Watch selected game - id: " + data.id);
        var spectator = false;
        resetLocalGame();

        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.sessionId, user.name, data.id, spectator).done(function () {
      
            // select the game 
            selectActiveGameId(data.id);
            displayNetMessage("Done selected game id: " + data.id);
        });  
        
        // focus the game tab
        boardEl.focus();
    }

    /**
     * @summary handler for when a game is selected for watching and replaying (learning purpose)
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
     * @param {any} gameInfo - the game info
     */
    function setupGameMovesHistoryList(gameInfo) {

        if (gameInfo == null) {
            displayGameMessage("Invalid game");
            return;
        }   

        $('#game-moves-history-list').empty();

        $.each(gameInfo.moves, function (i,v) {
            appendMoveToGameHistoryList(v);
        });

    }
       
    /**
     * Appends the given move to the game history
     * @param {any} move - move information from the server
     */
    function appendMoveToGameHistoryList(move) {

        if (move == null) {
            return;
        }
        var html = "";
        html += "<li class='list-group-item' style='font-size:xx-small'>";
        html += ("<strong>" + move.number + ". </strong>");
        html += ("" + move.playerName);
        html += ((move.isAttacker == true ? " (A)" : " (D)") + " - ");
      //  html += ( (move.isSetting == true ? "S" : "M") + ": ");
        html += (move.from + " to ");
        html += move.to ;
        if (move.resigned == true)
            html +=  " - Resigned";
        if (move.exchangeRequest == true) {
            if (move.isAttacker)
                html += " - exchange req. accepted";
            else
                html += " - exchange req.";
        }
     //   html += "<br>";

        // add another row for the message and fen
     //   html += ("<pre style='font-size:small'>FEN Before & After: " + (move.BeforeFEN) + " - ");
     //   html += ((move.AfterFEN) );
        if (move.captured != "")
            html += ( " - captured: " + move.captured);

        if (move.exchanged != "")
            html += (" - exchanged: " + move.exchanged );

        if (move.message != "")
            html += (" - message: " + move.message);

      //  html += "</pre>";
           html += "</li>";

        $('#game-moves-history-list').prepend(html);
        refreshList('#game-moves-history-list');
    }

    /**
    * @summary handler for the Post message request
    */
    function onPostMessage() {      
        logMessage("onPostMessage: ");

        // the user must be logged in to 
        if (appClientState.loggedIn === false || appClientState.session === null){
            // add check if admin
            displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }

        if (gamesHubProxy != null )
        {
            var message = $('#move-message').val();
            displayNetMessage("Posting message: " + message);
            gamesHubProxy.server.postMessage(appClientState.sessionId,user.name,message).done(function () {        
                displayNetMessage("Posted message successfully");
            });  
        }
        else{
            displayNetMessage("Posting message - client is not connected - please try ping or restart.");
        }
    }

    function refreshList(id){
        if ($.appViewHandler && $.appViewHandler != null)
            $.appViewHandler.refreshList(id);
    }

    // base hub messages
    var onJoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            logMessage("on Joined: " + serverTime);
            logObject(connectionInfo);
            
        }
    };
    var onLeft = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            logMessage("onLeft: " + serverTime);
            logObject(connectionInfo);
        }
    };
    var onRejoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            if (loggingOn === true) {
                logMessage("onRejoined: " + serverTime);
                logObject(connectionInfo);
            }
        }
    };
    var onPong = function (connectionId, serverTime, result) {
        if (connectionId !== $.connection.hub.id) {
            logMessage("invalid pong received - different from local connection id" ); 
            displayNetMessage("Invalid pong received");
        }
        else {
            // check if equal to self
            logMessage('pong received');
            appendToNetMessagesList(user.name, "pong received - server time: " + serverTime);
            displayNetMessage("pong received on " + serverTime);
        }
        logObject(result);
        $('#signalr-status').html("Server Time: " + serverTime.toString());
    };
    var onMessagePosted = function (user, message) {
        logMessage("server: onMessagePosted from: " + user.name + " - message: " + message);

        appendToNetMessagesList(user.name,message);
        
        $("#move-message").val('');
    };

    var onGameStateUpdated = function (status, message, game, player){
        logMessage("server: onGameStatusUpdated - game id: " + game.id + " status: " + status);
        updateLocalGameStatus(game);
    };
  
    /**
     * @summary adds a message to the networks message list on the top
     * @param {string} from message source
     * @param {string} message the message
     */
    function appendToNetMessagesList(from, message){
        $('#messages-list').prepend("<li class='list-group-item'>" + getLoggingNow() + " - " + from + ": <pre> " + message + " </pre></li>");
      
        refreshList('#messages-list');
    }
  
    /**
     * @summary saves the game on the server
     */
    function saveGame() {

        // update the local game state with the game info
        gameState.state = game.getState();

        if (appClientState.userServer === true){
            setCookie("_nsgid", gameState.id);
            displayNetMessage("Saving game on the server...");
            gamesHubProxy.server.updateGameState(appClientState.sessionId,user.name, gameState.id,
                game.getState(), game.winner.isAttacker, game.attackerScore, game.defenderScore).done(function(){
                    displayNetMessage("Done saving game on the server.");
                    displayGameMessage("Saved game on the server");
                });
        }
        else{
            // clear the last game cookie so local storage is used instead when joining the last game
            setCookie("_nsgid", "");

            displayGameMessage("Saving game locally");
            if (typeof(window.localStorage) !== "undefined" ){
                window.localStorage.setItem("kharbgaGameState", JSON.stringify(gameState));
                displayGameMessage("Saved game locally");
            }
        }
    }

    /**
     * @summary Loads a game from local storage and set up the game state and board with it
     */
    function loadGame(){       
        if (typeof(window.localStorage) !== "undefined" ){
            displayGameMessage("Loading last local game");
            var prevGameState = window.localStorage.getItem("kharbgaGameState");
            var obj = JSON.parse(prevGameState);
            logObject(obj);
            if (obj!= null){
                gameState.update(obj);
                onGameJoined(gameState,user);
            }
            displayGameMessage("loaded game locally");
        }
    }

    /**
    * @summary sets up the client state with the given session
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
     * @summary Helper function for setting cookie and local storage
     * @param {string} key
     * @param {string} value
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
     * @summary Helper function for reading cookie
     * @param {any} key
     * @param {any} value
     */
    function getCookie(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        var ret = keyValue ? keyValue[2] : null;

        if (ret === null){
            if (window.localStorage != null){
                val = window.localStorage.getItem(key);            
            }
        }
        return ret;
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


    /**
     * @summary updates the board info based on the local game
     */
    function updateBoardInfo(){
        if (game === null)
            return;

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
        
        // update the scores      
        updateScores(game);

        // update the move flags
        updateMoveFlags(game.move_flags());

        updateTurnInfo(game);
    }

    /**
     * @summary handler for window resize event
     * @param {*} e 
     */
    function resizeGame(e) {
        if (board == null)
            return;

        board.resize(e);    

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
                logMessage('Signalr Error: ');
                logObject(error);
                appClientState.signalReInitialized = false;
                displayNetMessage("SignalR Error: error ");

                $('#messages-list').append("<li class='list-group-item list-group-item-danger'>  " + error + "</li>");
                refreshList('#messages-list');
            });
            displayNetMessage("Setup Signal R successfully");

            return startSignalR();
        }
        catch (e) {
            setSystemError(true);
            appClientState.useServer = false;
            appClientState.signalReInitialized = false;
            logObject(e);
            displayNetMessage("Error setting up SignalR: " + e);
            $("#signalr-status").html("<div class='alert alert-danger'>Not setup</div>");

        }

        $.connection.hub.disconnected(function () {
            appClientState.signalReInitialized = false;
            appClientState.useServer = false;
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> disconnected " + $.connection.hub.id + "</li>");
            refreshList('#messages-list');
            displayNetMessage("Disconnected");
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
                    logMessage('startSignalR - connected, connection ID: ' + $.connection.hub.id);
                    appClientState.serverConnectionId = $.connection.hub.id;
                    appClientState.signalReInitialized = true;
                    appClientState.useServer = true;
                    // 
                    checkSessionCookie();
                    // moves the setup of the games on startup at the end of the checking session process
                    displayNetMessage("Connected");
                    $("#signalr-status").html("<div class='alert alert-success'>Connected</div>");

                    // check if we got a game to rejoin and refresh the active games
                    rejoinLastGameIfAny();
                })
                .fail(function () {
                    appClientState.signalReInitialized = false;
                    checkSessionCookie();
                    logMessage('startSignalR failed to connect');
                    displayNetMessage("Failed to Connected. Turning off server mode.");
                    $("#signalr-status").html("<div class='alert alert-danger'>Not connected</div>");
                    appClientState.useServer = false;
                });

        }
        catch (e) {
            logObject(e);
            appClientState.useServer = false;
            displayNetMessage("Failed to Connected. Turning off server mode.");
            $("#signalr-status").html("<div class='alert alert-danger'>Not Started</div>");
        }
    }

    this.setupSignalR = _setupSignalR;

    function onFlipBoard(e){
        if (e!= null)
            e.preventDefault();

        if (board == null) {
            displayWarningMessage('Game board is not initialized');
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

    /** 
     * @summary checks the session cookie, setup the current games and last game if any 
     */ 
    this.setup = function () {
        checkSessionCookie();
        // the game will be rejoined if a valid session
        // guests will not be able to rejoin their games
        // rejoinLastGameIfAny();
    };

    /** @summary starts and initializes connection to the server
     *  @returns true if successful, false otherwise
     */
    this.initMessaging = function(){
        return  _setupSignalR();
    }; 

    function _ping(e){
        if (e!= null)
            e.preventDefault();

        // the user must be logged in to 
        if (appClientState.loggedIn === false || appClientState.session === null){
            // add check if admin
            displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }
        // attempt to start SignalR if not init
        if (appClientState.signalReInitialized == false)
        {
            displayNetMessage("Signal R is not setup. Setting up...");
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized ){
            displayNetMessage("Signal R is setup. Pinging...");
            gamesHubProxy.server.ping(appClientState.sessionId).done(function () { 
                displayNetMessage("Done Pinging."); 
            });
        }
        else{
            displayNetMessage("Unable to ping - Signal R is not setup.");
        }
    }

    /**
     *  @summary outputs the object to console if logging is on
     *  @param {any} obj - the object to log
     */
    function log(obj){
        if (loggingOn){
            console.log(obj);
        }
    }

    /**
     *  @summary outputs the object to console if logging is on
     *  @param {any} obj - the object to log
     */
    function logObject(obj){
        if (loggingOn){
            console.log(obj);
        }
    }
    /**
     *  @summary outputs the message to to console with the current time
     *  @param {any} message - the message to log
     */
    function logMessage(message){
        if (loggingOn){
            console.log("%s - %s", getLoggingNow(), message);
        }
    }
        

    this.ping = _ping;

    this.newGame = function (options) {
        var event = { data: options };
        logMessage("New Game Request. Options: ");
        log(options);
   
        onNewGame(event); // 
    };

    this.postMessage = function(msg){

        // the user must be logged in to 
        if (appClientState.loggedIn === false || appClientState.session === null){
            // add check if admin
            displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }

        if (gamesHubProxy == null) {
            displayNetMessage("Unable to post to server. Please try ping or restart first.");
            return;
        }
        displayNetMessage("Posting message...");
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

    /**
     * Updates the board with a given move capptured or exchanged pieces
     * @param {*} move 
     * @param {*} highlightMove 
     */
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

        // updates the last action info with the move
        updateLastActionInfo(move); 
       
    };

    /**
     * @summary starts the board at the beginning of the setting phase if still playing a setting move
     * if playing a moving move to goes back to the beginning of the moving phase
     */
    this.playBegining = function () {
        
        // we now have a completed game
        console.log("playBeginning - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);
        if (gameState.moves == null || gameState.moves.length == 0){
            displayGameMessage("No moves to replay");
            return;
        }

        if (appClientState.lastReplayPosition > 48)
            appClientState.lastReplayPosition = 48;
        else
            appClientState.lastReplayPosition = 0;

        
        if (gameState.lastReplayPosition >= gameState.moves.length)
            appClientState.lastReplayPosition = 0;

        var move = gameState.moves[appClientState.lastReplayPosition];

        
        if (appClientState.lastReplayPosition === 48){
            displayGameMessage("Restarting replay at the end of settings");
            board.position(move.beforeFen, true);   
        }
        else{
            displayGameMessage("Restarting replay at the beginning of settings");
            board.position(move.beforeFen, true);   
        }
       
        
        updateBoardWithMove(move, true);
        boardEl.find('.highlight-move').removeClass('highlight-move');

        $('#fen').html(board.fen().replaceAll2('/','/ ') );

    };
    
    /**
     * @summary displays one move back of the game state
     */
    this.playBackward = function () {
        console.log("playBackward - one move back");
       
        if (gameState.moves == null || gameState.moves.length == 0){
            displayGameMessage("No moves to replay");
            return;
        }


        console.log("playBackward - status: %s", gameState.status);
        var move = null;
        appClientState.lastReplayPosition--;
        if (appClientState.lastReplayPosition < 0) {
            appClientState.lastReplayPosition = 0;
            move = gameState.moves[appClientState.lastReplayPosition];

            board.position(move.beforeFen, true);
            displayGameMessage("Restarting replay at the beginning");
            updateBoardWithMove(move, true);
            $('#fen').html(board.fen().replaceAll2('/','/ ') );
            return;
        }
       
        move = gameState.moves[appClientState.lastReplayPosition];
        displayGameMessage("Replay at move# " + move.number);  
        board.position(move.afterFen, true);
        updateBoardWithMove(move,true);
        $('#fen').html(board.fen().replaceAll2('/','/ ') );

    };
    
    
    var replayId = "";
    var replayOn = false;
    
    /**
     *  @summary starts the replay of a game - game needs to be in a completed state
     */
    this.playStart = function () {
        console.log("playStart");
     
        if (gameState.moves == null || gameState.moves.length == 0){
            displayGameMessage("No moves to replay");
            return;
        }

        console.log("playStart - status: %s", gameState.status);

        if (appClientState.lastReplayPosition < 0)
            appClientState.lastReplayPosition = 0;


        if (replayOn)
            return;
           
        var move = gameState.moves[appClientState.lastReplayPosition];
        displayGameMessage("Started replay at move #" + move.number);
       // $('#replay-position').html("move#" + move.id);

        board.position(move.beforeFen, true);
        updateBoardWithMove(move, true);
        $('#fen').html(board.fen().replaceAll2('/','/ ') );

        $('#play-start').attr('class', 'disabled');
        $('#play-pause').attr('class', 'enabled');

        replayId = setInterval(function (playForward) {
            playForward();
        }, 3000, this.playForward);   // add option for replay speed
        replayOn = true;
    };

    
    /**
     * @summary Pause the replay of the game
     */
    this.playPause = function () {
        console.log("playPause");
       
     //   if (gameState.status != 3)
      //      return;

        console.log("playPause - status: %s", gameState.status);
        displayGameMessage("Paused replay of current game");

        clearInterval(replayId);
        replayOn = false;

        $('#play-start').attr('class', 'enabled');
        $('#play-pause').attr('class', 'disabled');


    };

    
    /**
     * @summary moves the replay position of the game state to the next move
     */
    this.playForward = function () {  
        // we now have a completed game
        console.log("playForward - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);
        
        if (gameState.moves == null || gameState.moves.length == 0){
            displayGameMessage("No moves to replay");
            return;
        }
        var move = null;
        
        if (gameState.moves.length <= appClientState.lastReplayPosition) {
            appClientState.lastReplayPosition = gameState.moves.length - 1;

            move = gameState.moves[appClientState.lastReplayPosition];
            displayGameMessage("Replay of last move #" + move.number);
           // $('#replay-position').html("move#" + move.id);
    
            board.position(move.afterFen, true);
            updateBoardWithMove(move, true);
            $('#fen').html(board.fen().replaceAll2('/','/ ') );
          
            clearInterval(replayId);
            replayOn = false;
            return;
        }

        move = gameState.moves[appClientState.lastReplayPosition];
        displayGameMessage("Replay at move #" + move.number);
       // $('#replay-position').html("move#" + move.id);

        board.position(move.afterFen, true);
        updateBoardWithMove(move, true);
        $('#fen').html(board.fen().replaceAll2('/','/ ') )
        
        // set the play position to the next move
        appClientState.lastReplayPosition++;
      
    };

    
    /**
     * @summary moves the board at the end of the settings position 
     */
    this.playEnd = function () {
        console.log("play end of setting or moving");
   
        // we now have a completed game
        console.log("playEnd - status: %s - Last replay Position: %s",
            gameState.status, appClientState.lastReplayPosition);

        
        if (gameState.moves == null || gameState.moves.length == 0){
            displayGameMessage("No moves to replay");
            return;
        }

       
        if (appClientState.lastReplayPosition < 48)
            appClientState.lastReplayPosition = 48;
        else
            appClientState.lastReplayPosition = gameState.moves.length - 1;


        var move = gameState.moves[appClientState.lastReplayPosition];
        
        // $('#replay-position').html("move#" + move.id);

        if (appClientState.lastReplayPosition === 48){
            board.position(move.beforeFen, true);
            displayGameMessage("Setting replay at end of settings");
        }
        else{
            board.position(move.afterFen, true);
            displayGameMessage("Setting replay at end of game");
        }
        updateBoardWithMove(move, true);
        $('#fen').html(board.fen().replaceAll2('/','/ ') );
       
        boardEl.find('.highlight-move').removeClass('highlight-move');

    };

    var soundMuted = false; 
    var _soundToggle = function () {
        logMessage("soundToggle");
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
        logMessage("soundUp");
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
        logMessage("soundDown");
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
        logMessage("setVolume");
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
