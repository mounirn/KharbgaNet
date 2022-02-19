/** Kharbga App Object 
 * Include after: 
 * - jQuery
 * - ns-app-utils.js 
 * - ns-api-client.js
 * - ns-app-user.js
 */
if ($ == undefined || $.nsApp == undefined){
    console.log("Please include jQuery and ns-app-utils before this module");
    throw new Error("Please include jQuery and ns-app-utils");
}
if (nsApp == null || nsApiClient == undefined){
    console.log("Please include ns-api-client before this module");
    throw new Error("Please include ns-api-client");
}
if (nsApp == null || nsApp == undefined || nsApp.user == undefined){
    console.log("Please include ns-app-user before this module");
    throw new Error("Please include ns-app-user module");
}
/* Kharbga App Object */
var KharbgaApp = function () {
    // the board game and ui element
    var board,
        boardEl = $('#board');

    var C_NSGID = "_nsgid";

    // signalR communications
    var gamesHubProxy = null;

    // flag for turning on/off logging 
    var loggingOn = window.__env.enableDebug; 
    
    /**
     * play options on the computer
     */
    var playOptions = {
        //useServer : false,
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
        displayLastMove: true,
        playSoundAfterMove: true,// add different types of sound depending on success or failure of last action,
        color: "",
        avatar: "",
        boardColor: "#f0d9b5",
        attackerColor: "#0000ff",
        defenderColor: "#8B0000",
        highlightSelectedColor: "#ffff00",
        highlightMoveColor: "#ffff00",
        highlightSourceRequiredColor: "#008000",
        highlightCapturedColor: "#ff0000",
        highlightExchangedColor: "#ffa500", 
        "highlightLastMoveTimeout": 2000,
    };

    // local user - a player (attacker or defender) or spectator
    var user = nsApp.user;
    user.preferences = userOptions;
 /* 
    user.reset = function(){
        this.name = "Guest";
        this.isAttacker= true;
        this.IsSpectator = false;
        this.score = 0;
    };
*/  user.update = function(player){
        if (player == null)
        {
            log("null player");
            return;
        }
        this.name = player.name;
        this.isAttacker = player.isAttacker;
        this.isSpectator = player.isSpectator;
        this.score = player.score;
        this.playerInfo = player;
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
        signalReInitialized: false,
        activeGame: false,  // indicates that a game is progress
        lastReplayPosition: -1,
        useServer : false,  // turn on when wanting to store the data and interact with the server
        backgroundJobId: -1, // the background computer player timer
        playOptions: playOptions,
        userOptions: userOptions
        
    };
    nsApp.state.appClientState = appClientState; // for logging purpose
    user.userOptions = userOptions;
    nsApp.state.playOptions = playOptions; // for logging purpose

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
        if (nsApp.loggingOn) console.log("onNewGameStarted");
        logMessage("event: onNewGameStarted - game Id: " + eventData.source.id);
        logObject(eventData);
        var message = "Started a new game";
       
        displayGameMessage(message);

        appClientState.activeGame = true;
        $('#currentGamePanel').show();
        $('#current-game-info').show();

        $('#start-new-game-btn').hide();

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
        if (typeof (eventData) == "undefined" || typeof(eventData.player) == "undefined" ){
            if (nsApp.loggingOn) console.log("Invalid event:onNewPlayerTurn " );
            return;
        }
        logMessage("event: onNewPlayerTurn - player: " + eventData.player.name);
        $('#player-turn').html(eventData.player.name);

        var message = "Turn: <strong style='color:orange'>" +
            eventData.player.name;
        message += "</strong> ";

        if (user != null && !user.isSpectator)  {
            if (user.isAttacker === true && game.turn() == 'a'){
                message += " (Your turn) ";
                displaySuccessMessage(message);
            }
            else  if (user.isAttacker === false && game.turn() == 'd'){
                message += " (Your turn) ";
                displaySuccessMessage(message);
            }
            else{
                displayInfoMessage(message);
            }
        }
        else{
            displayInfoMessage(message);
        }
       
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
        var message = "Turn: <strong style='color:orange'>" + eventData.player.name;
        message+=" </strong> - 2nd soldier ";
    
        // Indicator for local player that it is their turn   
        if (user.isSpectator === false){
            if (user.isAttacker === true && game.turn() == 'a'){
                message += " (Your turn) ";
                displaySuccessMessage(message);
                
            }
            else if (user.isAttacker === false && game.turn() == 'd'){
                message += " (Your turn) ";
                displaySuccessMessage(message);
            }
            else{
                displayInfoMessage(message);
            }  
        }
        else{
            displayInfoMessage(message);
        }

        
        currentMove.from = "spare";
        currentMove.to = eventData.targetCellId;
   
        /* highlight the previous move */
        var source = boardEl.find('.square-' + eventData.targetCellId);
        source.addClass('highlight-move');     
   
        updateBoard(eventData.source);      
    }

    /**
     * @summary Handler for when the settings phase is completed
     * @param {any} eventData: the event data
     */
    function onSettingsCompleted(eventData) {
        logMessage("event: onSettingsCompleted - final board state: %s" + eventData.source.fen());

        var message = "Settings done. Turn: Attacker - move to malha";
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
        // var sourceRequired = boardEl.find('.highlight-source');
        // sourceRequired.removeClass('highlight-source');

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
        var message = "Turn: <strong style='color:orange'>" +
            eventData.source.currentPlayer.name;
            message += "</strong> ";

        message+= "Must move <strong> " + eventData.targetCellId  + "</strong> to complete capture(s)";
        displayInfoMessage(message);
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
        if (loggingOn) console.log("onNewGameStarted");

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
     * @summary Handler when an untouchable soldier is selected
     * @param {any} eventData - the event data
     */
    function onUntouchableSelected(eventData) {
        logMessage("event: onUntouchableSelected - cell: " +  eventData.targetCellId);
     
        var exchangeSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangeSquare.addClass('highlight-exchange');

        updateMoveFlags(eventData.source.moveFlags);
    }

    /**
     * @summary Handler for when  an exchange request is canceled
     * @param {any} eventData - the event data
     */
    function onUntouchableExchangeCanceled(eventData) {
        logMessage("event: onUntouchableExchangeCanceled ");
        displayGameMessage("Exchange Request Canceled");

        updateScores(eventData.source);
        updateMoveFlags(eventData.source.moveFlags);

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
    }

    /**
     * Handler for when an exchange request is completed
     * @param {any} eventData - the event data
     */
    function onUntouchableExchangeCompleted(eventData) {
        logMessage("event: onUntouchableExchangeCompleted ", getLoggingNow());
        displayGameMessage("Exchange Request Completed");

        updateScores(eventData.source);
        updateMoveFlags(eventData.source.moveFlags);

        // remove the highlighting after a couple of seconds
        setTimeout(removeLastMoveHighlighting, 3000);
    }

    /**
     * Handler for when a player sets on the Malha during setting mode
     * @param {any} eventData - the event data
     */
    function onInvalidSettingMalha(eventData) {
        logMessage("event: onInvalidSettingMalha - targetCellId: " + eventData.targetCellId);
        displayGameMessage("Setting on middle cell (Malha) is not allowed");

    }

    /**
     * Handler for when a player sets on an occupied cell
     * @param {any} eventData - the event data
     */
    function onInvalidSettingOccupied(eventData) {
        logMessage("event: onInvalidSettingOccupied - targetCellId: " + eventData.targetCellId);

        displayGameMessage("Setting on an occupied cell is not allowed");
    }

    /* Board Events */
    function onInvalidMove(eventData) {
        console.log("%s - board event: onInvalidMove - target: %s - type : %s ",
            getLoggingNow(), eventData.targetCellId, Kharbga.BoardMoveType[eventData.type]);

        $('#message').html("<div class='alert alert-danger'>Invalid Move: " + 
        toDisplayString(Kharbga.BoardMoveType[eventData.type]) +" </div>");
    }

    function onValidMove(eventData) {
        logMessage("board event: onValidMove - target: " +  eventData.targetCellId);
    }

    function onCapturedPiece(eventData) {
        logMessage("board event: onCapturedPiece - target: " + eventData.targetCellId);

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
        logMessage("board event: onExchangedPiece - target: " + eventData.targetCellId);
    
        var exchangedSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangedSquare.addClass('highlight-exchange');

        $('#move-exchanged').append(" " + eventData.targetCellId);
        currentMove.exchanged += " ";
        currentMove.exchanged += eventData.targetCellId;

        updateBoard(game);

    }

    function onPlayerPassed(eventData) {
        logMessage("board event: onPlayer Passed - target: " + eventData.player.Name);
        displayGameMessage("Player passed: " + eventData.player.Name);
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
        if (game.game_over() === true){
          //  onClear();  // display play link
            return false;  
        }   

        if (user == null) {
            logMessage("allowedToMove() - Error - user is null.");
            return false;
        }
        if (user.isSpectator === true) {
            displayWarningMessage("Not allowed as spectator. You could only post comments.");
            return false;
        }

        if (playOptions.playOnSameComputerWithOpponent === false || gameState.isNetworkGame === true )
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
                displayWarningMessage("Cell <strong>"+ source + "</strong> is not occupied by your solider.");
                return false;
            }

            // check if source piece is surrounded -- return false
            if (game.is_surrounded_piece(source) === true) {
                displayWarningMessage("You could only move soldiers that have free/open adjacent cells");

                return false;
            }

            var moveSourceRequired = game.moveSourceRequired;
            // check if a given source piece must be played
            if (moveSourceRequired.length != 0 && source !== moveSourceRequired) {
                displayErrorMessage("Please continue moving using solider on <strong>" + moveSourceRequired + "</strong>");
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
      //  $('#gameMove').html(source + "-" + target);
       
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
        if (loggingOn) console.log("processAction");
        var ret = false;
        var gameMove = new Kharbga.GameMove();
        var player = game.getCurrentPlayer();

        gameMove.playerName = player.name; 

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

        // complete the move and return if not using the server
        if (gameState.isNetworkGame === false)
        {
         
            displayGameMessage("Recorded locally move #: " + gameMove.number);        
            processGameMove(gameMove);
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
                nsApp.displayNetMessage("Recording move # "+ gameMove.number);
                gamesHubProxy.server.recordMove(nsApp.sessionId,gameState.id, 
                    user.name,
                    gameMove.isAttacker, gameMove.isSetting, gameMove.from, gameMove.to, 
                    gameMove.resigned, gameMove.exchangeRequest,
                    gameMove.beforeFen, game.fen(), gameMove.message, lastMoveId,
                    lastMove.captured, lastMove.exchanged
                ).done(function () {
                    logMessage('Done  recordedMove move Id : ' +  lastMoveId);
                    nsApp.displayNetMessage("Done recording move # " + gameMove.number);
                    processGameMove(gameMove);
                    completeMoveProcessed();
                    
                })
                .fail(function (error) {
                    logMessage("Failed recordMove - moveId : " + lastMoveId);
                    logObject(error);
                    nsApp.displayNetMessage("Failed to record move - error: " + error);
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
        gameState.attacker.score = game.attacker.score;
        gameState.defender.score = game.defender.score;
        gameState.state = game.getState();

        updateLocalGameStatus(gameState); 

        // check if game is over
        if (game.game_over()) {
            updateBoard(game);
            updateBoardInfo(game);
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
         
            var moveSourceRequired = game.moveSourceRequired;
            if (moveSourceRequired.length > 0) 
            {
                highlightSource(moveSourceRequired);
                source = moveSourceRequired;
            }
            else{
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
                else{
                source = appClientState.selectedSource;
                }  
            }
        }
        else {
            source = " ";
        }

        var target = square;
        if (source == target) {
            displayWarningMessage("Canceled selection <strong> " + appClientState.selectedSource + " </strong>for moving...");
            removeSelectedCells(); // from the previous move
            appClientState.selectedSource = "";
            return;
        }

      
        highlightTarget(square);
        $('#move-captured').empty();
        $('#move-exchanged').empty();

        processAction(source, target);

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
        if (game.moveSourceRequired.length === 0){
            // do not highlight if it is a required for the move
            var squareEl =  boardEl.find('.square-' + square);
            squareEl.addClass('highlight-move');
        }

        //   var background = '#a9a9a9';
        //  if (squareEl.hasClass('black-3c85d') === true) {
        //    background = '#696969';
        //   }

        //   squareEl.css('background', background);
    }
    function highlightSource(square) {  
        // do not highlight if it is a required for the move
        var squareEl =  boardEl.find('.square-' + square);
        squareEl.addClass('highlight-source');
 
      //  var background = '#a9a9a9';

      //  squareEl.css('background-color', background);
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
        if (game.moveSourceRequired === "")
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
            getLoggingNow(), getComputerRole(), game.turn(), getLocalPlayerRole(), 
                game.moveSourceRequired);

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
        if (loggingOn) console.log("computer_play");
        // the game move to generate
        var gameMove = new Kharbga.GameMove();

        var computerPlayer = gameState.getComputerPlayer();
        var moveSourceRequired = game.moveSourceRequired;
        logMessage("computer_play() as" + getComputerRole() + "required From Piece: "+ moveSourceRequired);
              
        appClientState.computerIsPlaying = true;
     //   gameMove.player = computerPlayer;
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
                        if (moves[item].from === moveSourceRequired){
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
       
     //   $('#gameMove').html(gameMove.from + "-" + gameMove.to);  
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
        gameMove.flags.copy(game.moveFlags);

        if (ret == true) {
            lastMoveId = createMoveId();
            gameMove.clientId = lastMoveId;
            gameMove.number = gameState.getNextMoveNumber();

            // submit to the server if a network game
            if (gameState.isNetworkGame === true ) {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(nsApp.sessionId,gameState.id, computerPlayer.name,
                    gameMove.isAttacker, gameMove.isSetting, gameMove.from, gameMove.to, gameMove.resigned, 
                    gameMove.exchangeRequest, gameMove.beforeFen, gameMove.afterFen, gameMove.message, 
                    gameMove.clientId,
                    lastMove.captured, lastMove.exchanged
                ).done(function () {
                    nsApp.displayNetMessage("Done recording move number: " + gameMove.number);
                    board.position(game.fen(), false); // update the board with the computer move
                    processGameMove(gameMove);
                    completeMoveProcessed(); 
                    playSound();

                }).fail(function (error) {
                    logMessage("Failed recording move. Error:");
                    nsApp.displayNetMessage("Failed recording move number: " + gameMove.number);
                    logObject(error);
                });
            }
            else { 
                displayGameMessage("Recording computer move #: " + gameMove.number);
               
                board.position(game.fen(), false); // update the board with the computer move
                processGameMove(gameMove);
                // record the move locally 
                completeMoveProcessed(); 
            }
        }

        appClientState.computerIsPlaying = false;
    }

    /**
     * @summary Updates the board position with the local given game position
     * @param aGame -- the game to use to update the board with
     */
    function updateBoard(aGame) {
        if (loggingOn) console.log("updateBoard");
        if (aGame == null) {
            console.log("updateBoard - null aGame");
            return;
        }

        if (board != null) {

            // update the board position here for the case when processing exchanges
            board.position(aGame.fen(), true);
             updateBoardInfo(aGame);
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
        updateCheckboxSettings();
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

     //   if (!moveFlags.exchangeRequestAccepted)
     //       boardEl.find('.highlight-exchange').removeClass('highlight-exchange');


        exchangedSquare = boardEl.find('.square-' + moveFlags.exchangeRequestAttackerPiece1);
        exchangedSquare.addClass('highlight-exchange');
        exchangedSquare = boardEl.find('.square-' + moveFlags.exchangeRequestAttackerPiece2);
        exchangedSquare.addClass('highlight-exchange');

        selectedSquare = boardEl.find('.square-' + appClientState.selectedSource);
        selectedSquare.addClass('highlight-move');
    }
 
    /**
     * @summary clears the the last move info
     */
    function clearLastMoveInfo() {
        $('#gameMove').empty();
        $('#move-captured').empty();
        $('#move-exchanged').empty();
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
     * @param {boolean} success - message is success or not
     */
    function displayGameMessage(message, success){
        if (success === true){
            $('#game-message').html("<div class='alert alert-success'>" + message + "</div>");
        }else if (success === false){
            $('#game-message').html("<div class='alert alert-danger'>" + message + "</div>");
        }else{
            $('#game-message').html("<div class='alert alert-info'>" + message + "</div>");
        }
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
        if (loggingOn) console.log("onNewGame");
        if (e == null || e.data == null) {
            logMessage('New Game - Invalid input.');
            return false;
        }
       
        resetLocalGame();
        var options = e.data;

        // check if the user is logged in or not if requesting to play game over the network
        // 
        if (options.overTheNetwork === null || options.overTheNetwork === true){

            if (nsApp.isLoggedIn() === false){
                displayErrorMessage("Please <a href='javascript:$.appViewHandler.openLoginPanel()'>login</a> to play network games. ");
                if ($.appViewHandler != null && typeof($.appViewHandler.openLoginPanel) === 'function')
                    $.appViewHandler.openLoginPanel();
                return; 
            }
        }
        // 
        appClientState.useServer = e.data.overTheNetwork === true; // change server mode dep on user request

        playOptions.playOnSameComputerWithOpponent = (e.data.againstComputer === false && e.data.overTheNetwork == false);

        gameState.isNetworkGame = e.data.overTheNetwork === true;

        if (gameState.isNetworkGame === true) {
            if (gamesHubProxy != null){
                // call the server to start the new game
                gamesHubProxy.server.createGame(nsApp.sessionId,user.name, e.data.asAttacker, e.data.againstComputer)
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
                nsApp.displayNetMessage("Unable to start game on the server - server is not up");
            }
        }
        else{
            // Create a new game locally
            displayGameMessage("Creating a local game...");
        
            gameState.reset();
            gameState.isNetworkGame = false;
            gameState.id = createGameId();
            if (nsApp.isLoggedIn() === false){
                user.name = "Guest";
            }
            user.isSpectator = false;
            user.isAttacker = e.data.asAttacker; 

            var opponent = {
                name:"Friend",
                isSpectator: false,
                isAttacker: false,
                isSystem: false,
                score: 0
            };         
            user.isAttacker = e.data.asAttacker;
            opponent.isAttacker = !e.data.asAttacker;
            opponent.isSystem = e.data.againstComputer;   

            if (opponent.isSystem === true){
                opponent.name = "System";
            }

            if (e.data.asAttacker === true)
            {              
                gameState.attacker = user;
                gameState.defender = opponent;               
            }
            else{            
                gameState.defender = user;
                gameState.attacker = opponent;     
            }

            if (e.data.againstComputer === true || e.data.overTheNetwork === false){
                gameState.status = Kharbga.GameStatus.Joined;
                game.state  = Kharbga.GameState.Settings;
            }
           
          
            onSetupLocalPlayer(user,gameState); 
            startLocalGame();
        }
    }
 
    /**
     * @summary Call back when a game is created by the server
     *  or called back when a game is joined to the Joiner of the game (including spectator)
     * Also called when started a game with no server option
     * @param {boolean} status - the action status
     * @param {string} error - error message is status is not true
     * @param {Kharbga.GameInfo} gameInfo - the game Info 
     * @param {Kharbga.Player} playerInfo - the player info
    */
    var onGameCreated = function (status, error, gameInfo, playerInfo) {
        if (loggingOn) console.log("onGameCreated");
        logMessage("On game Created - status: " +  status);

        if (status === false) {
            logMessage("error creating game");
            logObject(error);
            displayGameMessage("Unable to create game - ES13");
            return;
        }
        // add to the games list
        if (loggingOn) console.log("Game Created: ");
        logObject(gameInfo);
        if (loggingOn) console.log("Player Info: ");
        logObject(playerInfo);

     //   appendGameToGamesList(gameInfo,true);      
        gameState.update(gameInfo); 
        setCookie(C_NSGID,gameInfo.id);
        startLocalGame();
        
    };

    /**
     * @summary sets up and starts the local game 
     */
    function startLocalGame(){
        if (loggingOn) console.log("startLocalGame");
        // setup the game and the board and update the UI
        setupLocalGame(gameState);
        
        // start the background timer for the computer if we have a computer playing
        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null){
           
            logMessage("starting computer play timer...");
            displayComputerMessage("Started computer player task");
            appClientState.backgroundJobId = setInterval(checkBoardAndPlayIfComputer,4000);
        }
        // set up the sound for the current user
        setupSound();

        // start the game
        game.start(); 
    }

    /**
     * @summary: Clears the local game and board 
     * 
     */
    function resetLocalGame() {
        if (loggingOn) console.log("resetLocalGame");
        // create a new instance for the local game
        //delete game;         
        game = new Kharbga.Game(gameEvents, boardEvents);
        appClientState.loaded = false;       
        appClientState.firstComputerSetting = true;

        game.reset();
       // game.start();
        $('#state').html(toDisplayString(Kharbga.GameState[game.getState()]));
        if (board != null) {
            board.clear();
            board.start();
            $('#fen').html(board.fen());
            $('#pgn').html(board.position().toString());
        }

        updateScores(game);

        $('#loadSetting1Btn').show();
        $('#start-new-game-btn').show();
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        boardEl.find('.highlight-source').removeClass('highlight-source');
        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
        boardEl.find('.square-d4').addClass('highlight-malha');

        clearLastMoveInfo();
        removeLastMoveHighlighting();
        $('#resign-checkbox').prop('checked', false);

       // setCookie(C_NSGID, "");

        // hide the panel (?)
        $('#currentGamePanel').hide();
        $('#current-game-info').hide();
        displayComputerMessage("");

        displayInfoMessage("Click here to <a href='javascript:$.appViewHandler.openNewGamePanel()'>play</a> local or network games. "); 
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
     * @summary Clears the game and the board. The board is a set with an empty position string or fen
     * and resets the game for play a friendly game on the client with no server involved
     */
    function onClear(e) {
        if (loggingOn) console.log("onClear");
        if (typeof(e) !== "undefined" && e != null )
            e.preventDefault();

        resetLocalGame();
        setCookie(C_NSGID, "");
        clearLocalGameStorage();

         // turn off the background computer thread
        if (typeof appClientState.backgroundJobId == "number" && appClientState.backgroundJobId > 0){
            clearInterval(appClientState.backgroundJobId);
            appClientState.backgroundJobId = -1;
            displayComputerMessage("Ended computer play task");
        }
        displayGameMessage("Cleared last game"); 
        nsApp.displayNetMessage("");

        // stop a reply timer if any
        if (replayId >= 0){
            clearInterval(replayId);
            replayId = -1;
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



    $('#game-state-link').on('click', _refreshGameState);
    function _refreshGameState(e){
        if (e!= null)
            e.preventDefault();
        nsApp.dumpObjectInfo(gameState,'game-state-table',true);  
        nsApp.dumpObjectInfo(game,'game-state-table', false);  
    }

    /**
    * @summary retrieves the stored active game id 
    */
    function getLastGameCookie() {
        var cookie = getCookie(C_NSGID);
        if (typeof cookie === "string" && cookie.length > 10)
            return cookie;
     
        return "";
    }

    /**
     * @summary rejoins local cached game 
     * (after the user refreshes the their browser or logs in again)
     * sets up the active open games (latest 20 games)
     */
    function rejoinLastGameIfAny() {
        if (loggingOn) console.log("rejoinLastGameIfAny");
        
        loadGame(); // load a previously saved game if any

        // check the net and load any previously played game
        if (appClientState.useServer === true){
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
                nsApp.displayNetMessage("Joining previous game - id: " + gid);
            //    gamesHubProxy.server.reJoinGame(user.name, gid, false);
                // tell the server to rejoin this connection with the game
                gamesHubProxy.server.joinGame(nsApp.sessionId,user.name, gid, false).done(function(){
                    nsApp.displayNetMessage("Done joining previous game - id: " + gid);
                    //resize the board 
                    resizeGame();
                });
            }
        }  
    }

    /**
     * @summary handle for when a move is coming from the network
     * @param {any} status -- move status
     * @param {any} errorMessage -- error message if move failed to record
     * @param {any} gameMove -- the game move to record
     */
    var onMoveRecorded = function (status, errorMessage, gameMove) {
        if (loggingOn) console.log("onMoveRecorded");
        if (status === false) {
            logMessage("server - error recording move. Error: "+ errorMessage);
            nsApp.displayNetMessage("Failed to process move by the server. Error: " + errorMessage);
            return;
        }
        if (gameMove == null) {
            logMessage("server - error recording move - invalid game move passed");
            nsApp.displayNetMessage("Server Record Move - Invalid Game Move");
            return;
        }
        removeSelectedCells(); 
        // if the move is already submitted to the local game (by real player or computer) just add to the Move history and 
        if (lastMoveId === gameMove.clientId) {
           
            processGameMove(gameMove);
            completeMoveProcessed();
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
        if (ret == true){
            displayGameMessage("Completed processing server move successfully");
            playSound();
        }
        else {
            // play error sound
            displayGameMessage("Failed to process server move successfully");
        }

        processGameMove(gameMove);
        completeMoveProcessed();

      
    };

    /**
     * @summary processes the game move
     *  add it to the history
     *  updates the board with this info
     * @param {Kharbga.GameMove} gameMove 
     */
    function processGameMove(gameMove){
        if (loggingOn) console.log("processGameMove");
        
        if (gameMove == null) {
            logMessage("server - error recording move - invalid game move passed");
            nsApp.displayNetMessage("Server Record Move - Invalid Game Move");
            return;
        }

        gameState.moves.push(gameMove);

        updateBoard(game);
        updateBoardWithMove(gameMove);
        
        // append the move to the game history
        appendMoveToGameHistoryList(gameMove);

        // save the game if a local game
        if (gameState.isNetworkGame === false){
            saveGame();
        }

        setTimeout(function () {
            removeSelectedCells();
            removeLastMoveHighlighting();
        },userOptions.highlightLastMoveMilliSecondsBeforeTimeout);
    }


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

    function updateCheckboxSettings(){
        if (loggingOn) console.log("setupResignCheckbox");
        // setup the check boxes based on the player
        if (user.isSpectator) {
            $('#resign-checkbox').prop('disabled', true);
            $('#exchangeRequestCheckbox').prop('disabled', true);
            $('#exchangeRequestAcceptedCheckbox').prop('disabled', true);
        }
        else {
            $('#resign-checkbox').prop('enabled', true);
            if (playOptions.playOnSameComputerWithOpponent === true)
            {
                $('#exchangeRequestCheckbox').prop('disabled', false);
                $('#exchangeRequestAcceptedCheckbox').prop('disabled', false);
            }
            else{
                
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
    }
    /**
     * @summary Sets up the local player info 
     * @param {any} player -- the player
     * @param {any} serverGame -- the game is not required
     */
    var onSetupLocalPlayer = function setupLocalPlayer(player, serverGame) {
        if (loggingOn) console.log("onSetupLocalPlayer");
        if (typeof player == "undefined" || player == null) {
            logMessage("setCurrentPlayer - Invalid player passed");
            return;
        }
        nsApp.displayNetMessage("Setup up local user - name: " + player.name);
        user.update(player);
        
        if (typeof(serverGame) === "undefined" || serverGame == null) {
            logMessage("setCurrentPlayer - invalid game passed ");
            logNetMessage("Setup up local user error - SE21");
            return;
        }
      
      //  setupResignCheckbox();

        // refresh the myAccount info
       // nsApp.setupMyAccount();
    };
   
    /** 
     * @summary handler when the game is selected by a player. All users in the game group 
     *  will receive a this message
     *  We do not players to reset their game if a spectator just joins the game
     * @param {gameInfo} - the game joined 
     * @param {player} player - the player that joined the game
     * @param {boolean} status - indicates if the game is joined successfully
     * @param {string} error - message 
     */
    var onGameJoined = function (gameInfo, player,status, error) {
        if (loggingOn) console.log("onGameJoined");
        if (status === false){
             logMessage("server - onGameJoined - error: " + error);
             nsApp.displayNetMessage("Unable to join game - error: " + error);    
             return;
        }

        if (typeof(gameInfo) === "undefined" || gameInfo == null)
        {
            logMessage("server - onGameJoined - invalid game ");
           // nsApp.displayNetMessage("Join Game Error - SE22");    
            return;
        }
        appClientState.useServer = true; // we are server mode

        logMessage("Player joining: ");
        logObject(player);
     

        // add to the games list
        logMessage("Game Joined: ");
        logObject(gameInfo);
        setCookie(C_NSGID,gameInfo.id);
    /*    if (gameInfo.id !== ""){
            nsApp.displayNetMessage("Joined game id: " + gameInfo.id);    
            displayGameMessage("Joined game id: " + gameInfo.id, true);    
            if (appClientState.userServer === true){
                setCookie(C_NSGID,gameInfo.id);
            }

            // start the game
            game.start(); 
        }
         
    */

       // displayInfoMessage("Setting up joined game...");    
        // setup the local game with this
        setupLocalGame(gameInfo);
      
        // start the background timer for the computer if we have a computer playing
        if (appClientState.backgroundJobId> 0){
            clearInterval(appClientState.backgroundJobId);
            displayComputerMessage("Ended computer play task");
        }

        var computerPlayer = gameState.getComputerPlayer();
        if (user.isSpectator === false &&  computerPlayer!= null && 
            gameInfo.status < Kharbga.GameStatus.Completed){
       
            logMessage("starting computer play timer...");
            displayComputerMessage("Started computer player task");
            appClientState.backgroundJobId = setInterval(checkBoardAndPlayIfComputer,4000);
        }    
        
        // start the game
        game.start(); 
    };

    /**
     * @summary Sets up the local game with the given game info
     * @param {Kharbga.GameInfo} gameInfo - the game information
     */
    function setupLocalGame(gameInfo) {
        if (loggingOn) console.log("setupLocalGame");

        if (typeof(gameInfo) === "undefined" || gameInfo === null) {
            logMessage("setupLocalGame - Invalid game passed");
            return;
        }
      
        // update the game players info
        if (gameInfo.attacker != null)
            game.attacker.name = gameInfo.attacker.name;
        if (gameInfo.defender!= null)
            game.defender.name = gameInfo.defender.name;
        game.state = gameInfo.state;

        // update the local game state if it is not already the same
        if (gameState != gameInfo)
            gameState.update(gameInfo);

        displayGameMessage("Setup local game");    
        
        if (gameInfo.status === Kharbga.GameStatus.Completed){
             if (gameInfo.moves!= null && gameInfo.moves.length> 0){
                var lastMove = gameInfo.moves[gameState.moves.length-1];
                game.set(lastMove.afterFen);  // set the board with the last move pos
                updateBoardWithMove(lastMove);
             }
            game.state = gameInfo.state;
        }
        else{
            game.setupWith(gameInfo);
            // replay all existing moves if game is not over

           // displayGameMessage("Completed loading game moves", true);    
        }
        // close any open panels or popups for the user to view the game
        if ($.appViewHandler != null && typeof($.appViewHandler.closeOpenPanels) === 'function')
            $.appViewHandler.closeOpenPanels();
    
        
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
 

    }

    var onAppendMove = function (gameId, move) {
        // double check that this is current move
      //  appendMoveToGameHistory(move);
    };

    /** 
     * @summary updates the ui with the game state 
     *  @param - the game state
     */
    function updateLocalGameStatus(gameInfo) {
        if (loggingOn) console.log("updateLocalGameStatus");

        if (typeof (gameInfo) === "undefined" || gameInfo == null) {
            logMessage("updateLocalGameStatus - Invalid game passed ");
            return;
        }  

        $('#current-game-id').text(gameInfo.id);
        $('#current-game-status').text(getStatusText(gameInfo.status));
        if (gameInfo.attacker!= null){
            $('.attacker-name').text(gameInfo.attacker.name);
            $('#game-attacker').text(gameInfo.attacker.name);
        }
        if (gameInfo.defender!=null){
            $('#game-defender').text(gameInfo.defender.name);     
            $('.defender-name').text(gameInfo.defender.name);
        }
        
        if (gameInfo.attacker!= null && gameInfo.defender!=null){
            $('#game-players').html(gameInfo.attacker.name + " vs. " + gameInfo.defender.name);
            $('#game-score').html(gameInfo.attacker.score + "-" + gameInfo.defender.score);
        }
        $('#game-result').html(toDisplayString(Kharbga.GameState[gameInfo.state]));

        if (appClientState.useServer === true){
          //   updateGameInGameList(gameInfo);
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
      //   appendGameToGamesList(gameInfo,true);  // move the game to the top

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
     * @param {string} listId - the id of the list to add the game to
     */
    function appendGameToGamesList(gameInfo, front, listId) {
        if (loggingOn) console.log("appendGameToGamesList");
        if (gameInfo == null)
            return;

        $('#li-' + gameInfo.id).detach(); // removes the game from the list if any

        var html = "<li id='li-" + gameInfo.id + " ' style='font-size:small' class='list-group-item ";

        // add the class of the item
        html += getStatusCss(gameInfo.status);
        html += "'>";
        var title="";

        if (gameInfo.attackerName == "" || gameInfo.defenderName == "" ){
        
            // add a play link if game is not joined
            if (gameInfo.attackerName == "") {
                title ="Play " + gameInfo.defenderName + "as Attacker";
                html += "<a href='' id='linka-" + gameInfo.id + "' class=''"; 
                html += ("title='" + title + "'");
                html += ">Play ";
                html += gameInfo.defenderName;
                html += " (A)</a>";
               
            }
            else if (gameInfo.defenderName == "") {
                title ="Play " + gameInfo.attackerName + "as Defender";
                html += "<a href='' id='linkd-" + gameInfo.id + "' class=''";
                html += ("title='" + title + "'");
                html += ">Play ";          
                html += gameInfo.attackerName;
                html += "(D)</a>";          
            }
        }
        else{

            //  html += " (<span id='status-" + gameInfo.id + "'>" + getStatusText(gameInfo.status) + "</span>)";
            // add watch link
            title = ("Watch " + gameInfo.attackerName + " vs. " + gameInfo.defenderName ) ;
            title += (" - " + Kharbga.GameStatus[gameInfo.status].toString() + " status");   
            html += ("<a id='watch-" + gameInfo.id + "' class='btn btn-default ui-btn ui-icon-eye ui-btn-icon-left' ");
            html += ("title='" + title + "'");
            html += "> ";
            html += (gameInfo.attackerName + " vs. " + gameInfo.defenderName);
            html += "</a>";
        }
        html += "</li>";

        if (front === true){
            $(listId).prepend(html);
        }
        else{
            $(listId).append(html);
        }

        $('#linka-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#linkd-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#watch-' + gameInfo.id).on('click', gameInfo, onGameSelected);
     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));          
    }

     /**
     * @summary Adds a player to the active players list - each player is listed with his name, a
     * link to watch the game played, a link to view the player user account
     * 
     * @param {any} playerInfo - the player from the server to add to the list
     * @param {boolean} front - if true, the player is put in the front of the list 
     * @param {string} listId - the id of the list to add the player to
     */
    function appendPlayerToPlayersList(playerInfo, front, listId) {
        if (loggingOn) console.log("appendPlayerToPlayersList");
        if (playerInfo == null)
            return;

        $('#li-' + playerInfo.id).detach(); // removes the player from the list if any

        var html = "<li id='li-" + playerInfo.id + " ' style='font-size:small' class='list-group-item ";
        var imageUrl = playerInfo.imageUrl;
       // var gameId = playerInfo.currentGameId;
     //   var userAccountId = playerInfo.accountId; 
      
        html += "'>";
        html += "<a target='_new' title='View user account' href='user.html?id=" + playerInfo.id + "'>";
        if (typeof imageUrl === "string" && imageUrl.length > 0) {
            html += "<img style='max-width:80px;' src='" + playerInfo.imageUrl + "'/>";
        }
     //   var color  = playerInfo.color;
     //   html += "<span style='color:blue'>";
        html += playerInfo.name  ;   // title of the link 
        html += "</span>"; 
        html += "</a>";
     //   var title="Watch the game player by " + playerInfo.name  ; 
     //   html += ("<a id='watch-" + gameId + "' xclass='btn btn-default ui-btn ui-icon-eye ui-btn-icon-left' ");
     //   html += ("title='" + title + "'");
    //    html += ">Watch this game</a>";
  
        html += "</li>";

        if (front === true){
            $(listId).prepend(html);
        }
        else{
            $(listId).append(html);
        }

      //  var gameInfo = {};
      //  gameInfo.id = gameId; 
      //  $('#watch-' + gameId.id).on('click', gameInfo, onGameSelected);
             
    }

    
    var onGameDeleted = function (gameInfo) {
        // remove from the games list
        console.log("%s - Game Deleted: ", getLoggingNow());
        console.log(gameInfo);
    };


    /**
     * @summary Selects the given game in the list
     * @param {string} gameId - the game id
     */
    function selectActiveGameId(gameId) {
        if (loggingOn) console.log("selectActiveGameId");      

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
    $('#my-games-link').on('click', _refreshMyGames);
    $('#active-games-link').on('click', _refreshActiveGames);
    $('#active-players-link').on('click', _refreshActivePlayers);


    /**
     * Refreshes the list of games from the server for display in the home page for the current user
     * @param {any} e - the event object
     */
    function _refreshMyGames(e) {
        if (loggingOn) console.log("_refreshMyGames");   
        if (typeof e != "undefined" && e != null)
             e.preventDefault();

        if (nsApp.isLoggedIn() === false){
            nsApp.displayPleaseLogin();          
            return;
        }
        logMessage("_refreshing My Games from the server : ");
        
        if (appClientState.userServer === false){
            displayWarningMessage("Messaging Server Not To Use Mode - Action: Refresh Active Games");
            return;
        }
   
       // displayGameMessage("Refreshing active games from the server...");
        var listId = '#my-games-list';
        $(listId).empty();
        if (appClientState.signalReInitialized == false)
        {
            
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized ){
            nsApp.displayNetMessage("Refreshing games from the server...");
            gamesHubProxy.server.getMyGames(nsApp.sessionId).done(function (gamesResult) {
                if (gamesResult.success === true) {
                    $.each(gamesResult.object, function () {
                        appendGameToGamesList(this,true,listId);
                        
                    });
                    refreshList(listId);
                }
                
                nsApp.displayNetMessage("Done refreshing active games from the server.");
                
                selectActiveGameId(gameState.id);
            }); 
        }
        else{
            nsApp.displayNetMessage("Unable to refresh my games from the server");
        }    
    }
  
    /**
     * Refreshes the list of active games from the server for display in 
     * the game network page for the current user
     * @param {any} e - the event object
     */
    function _refreshActiveGames(e) {
        if (loggingOn) console.log("_refreshActiveGames");   
        if (typeof e != "undefined" && e != null)
             e.preventDefault();
      
        logMessage("_refreshingActiveGames from the server : ");
        if (nsApp.isLoggedIn() === false){
            nsApp.displayPleaseLogin();
            return;
        }
        if (appClientState.userServer === false){
            displayWarningMessage("Messaging Server Not To Use Mode - Action: Refresh Active Games");
            return;
        }
   
        var listId = '#active-games-list';
       // displayGameMessage("Refreshing active games from the server...");
   
        $(listId).empty();
        if (appClientState.signalReInitialized == false)
        {
            
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized ){
            nsApp.displayNetMessage("Refreshing games from the server...");
            gamesHubProxy.server.getActiveGames(nsApp.sessionId).done(function (gamesResult) {
                if (gamesResult.success === true) {
                    $.each(gamesResult.object, function () {
                        appendGameToGamesList(this,true,listId);
                        
                    });
                    refreshList(listId);
                }
                
                nsApp.displayNetMessage("Done refreshing active games from the server.");
                
                selectActiveGameId(gameState.id);
            }); 
        }
        else{
            nsApp.displayNetMessage("Unable to refresh my games from the server");
        }    
    }
 
    /**
     * Refreshes the list of active players from the server for display 
     *  in the game network list of active players
     * @param {any} e - the event object
     */
    function _refreshActivePlayers(e) {
        if (loggingOn) console.log("_refreshActivePlayers");   
        if (typeof e != "undefined" && e != null)
             e.preventDefault();
      
        /* check permissions */
        
        if (nsApp.isLoggedIn() === false){
            nsApp.displayPleaseLogin();
            return;
        }
        logMessage("_refreshingActivePlayers from the server : ");
        
        if (appClientState.userServer === false){
            displayWarningMessage("Messaging Server Not To Use Mode - Action: Refresh Active Games");
            return;
        }
   
        var listId = '#active-players-list';
  
        $(listId).empty();


/*

        if (appClientState.signalReInitialized == false)
        {
            
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized ){
            nsApp.displayNetMessage("Refreshing active players from the server...");
            gamesHubProxy.server.getActivePlayers(nsApp.sessionId).done(function (playersResult) {
                if (playersResult.success === true) {
                    $.each(playersResult.object, function () {
                        appendPlayerToPlayersList(this,true,listId);
                        
                    });
                    refreshList(listId);
                }
                
                nsApp.displayNetMessage("Done refreshing active players from the server.");
                    
            }); 
        }
        else{
            nsApp.displayNetMessage("Unable to refresh active players from the server");
        }   
        */
        nsApp.displayProcessing(true);  
        var session = nsApp.getSession();
        var queryString = {};
        nsApiClient.gameService.getUsers(session.sessionId, queryString, function (data,status) {
            console.log(data);
            if (nsApp.isValid(data)) {          
                var players = data;
                nsApp.displayProcessing(false);   
                if (players ) {
                    $.each(players, function () {
                        appendPlayerToPlayersList(this,true,listId);
                        
                    });
                    refreshList(listId);
                }
                
                nsApp.displayNetMessage("Done refreshing active players from the server.");
               
            }
            else {
                nsApp.displayProcessing(false);
                // clear the session anyway          
                 nsApp.handleResultNoData(data,status);   
            }
        });

    }

    /**
     * Refresh games - current user and the active games 
     */
    function _refreshGames(){
        _refreshActiveGames();
        _refreshMyGames();
    }

    // externalize for client apps
    this.refreshGames = _refreshGames;
    this.refreshMyGames = _refreshMyGames;
    this.refreshActiveGames = _refreshActiveGames;
    this.refreshActivePlayers = _refreshActivePlayers;

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
        if (nsApp.isLoggedIn() === false ){
            displayErrorMessage("Please <a href='javascript:$.appViewHandler.openLoginPanel()'>login</a> to play network games. ");
            if ($.appViewHandler != null && typeof($.appViewHandler.openLoginPanel) === 'function')
                $.appViewHandler.openLoginPanel();
            return; 
        }
        
      //  if (appClientState.userServer === false){
      //      nsApp.displayNetMessage("Messaging Server Not To Use Mode - Action: Join or Watch an Active Game");
      //      return;
      //  }
        // turn on use server
        appClientState.useServer = true;
 
        nsApp.displayNetMessage("Join/Watch selected game - id: " + data.id);
        var spectator = false;
        resetLocalGame();
        displayGameMessage("Joining game...")
    
        // check the net and load any previously played game
        if (appClientState.useServer === true){
            if (!appClientState.signalReInitialized){
                // try to start it again
                _setupSignalR();
           
            }
            if (gamesHubProxy != null){
                //join the game and indicate if spectator or not
                gamesHubProxy.server.joinGame(nsApp.sessionId, user.name, data.id, spectator).done(function () {
            
                    // select the game 
                    selectActiveGameId(data.id);
                    nsApp.displayNetMessage("Done selected game id: " + data.id);
                    displayGameMessage("Joined game: " + data.id,true);
                });  
            }
        }
        
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
        gamesHubProxy.server.joinGame(nsApp.sessionId,user.name, data.id, spectator);

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
        html += (move.isAttacker == true ? "A: " : "D: ");
        html +=  move.playerName;
        html +=" - ";
        html += ( (move.isSetting == true ? "S" : "M") + ": ");
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
        if (nsApp.isLoggedIn() === false){
            // add check if admin
            nsApp.displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }

        if (gamesHubProxy != null )
        {
            var message = $('#move-message').val();
            nsApp.displayNetMessage("Posting message: " + message);
            gamesHubProxy.server.postMessage(nsApp.sessionId,user.name,message).done(function () {        
                nsApp.displayNetMessage("Posted message successfully");
            });  
        }
        else{
            nsApp.displayNetMessage("Posting message - client is not connected - please try ping or restart.");
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
            nsApp.displayNetMessage("Invalid pong received");
        }
        else {
            // check if equal to self
            logMessage('pong received');
            appendToNetMessagesList(user.name, "pong received - server time: " + serverTime);
            nsApp.displayNetMessage("pong received on " + serverTime);
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
        if (loggingOn) console.log("saveGame");
        // update the local game state with the game info
        gameState.state = game.getState();

        if (appClientState.userServer === true && gameState.isNetworkGame === false){
            setCookie(C_NSGID, gameState.id);
            nsApp.displayNetMessage("Saving game on the server...");
            gamesHubProxy.server.updateGameState(nsApp.sessionId,user.name, gameState.id,
                game.getState(), game.winner.isAttacker, game.attacker.score, game.defender.score).done(function(){
                    nsApp.displayNetMessage("Done saving game on the server.");
                    displayGameMessage("Saved game on the server");
                });
        }
        else{
            // clear the last game cookie so local storage is used instead when joining the last game
            setCookie(C_NSGID, "");
            gameState.localUserIsAttacker = user.isAttacker; // save this to reset the local user
            
            if (typeof(window.localStorage) !== "undefined" ){
                displayGameMessage("Saving game locally"); 
            //    window.localStorage.setItem("kharbgaGameState", JSON.stringify(gameState));
                displayGameMessage("Saved game state locally");
            }
        }
    }

    function clearLocalGameStorage(){
        if (loggingOn) console.log("clearLocalGameStorage");
        if (typeof(window.localStorage) !== "undefined" ){
            window.localStorage.setItem("kharbgaGameState", "");         
        }
    }

    /**
     * @summary Loads a game from local storage and set up the game state and board with it
     * or clears the board
     */
    function loadGame(){   
        if (loggingOn) console.log("loadGame");     
        if (typeof(window.localStorage) !== "undefined" ){
            displayGameMessage("Loading last local game");
            var prevGameState = window.localStorage.getItem("kharbgaGameState");
            if (prevGameState === "")
            {
                onClear();
                return;
            }
            var obj = JSON.parse(prevGameState);
            logObject(obj);
            if (obj!= null){
                gameState.update(obj);
                // check if attacker or defender
                if (obj.localUserIsAttacker === true)
                    user.update(gameState.attacker);  
                else
                    user.update(gameState.defender); 

                startLocalGame();
                displayGameMessage("Started  game locally");
                return;
            }           
        }
        // clear the board
        onClear();
    }

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
        if (loggingOn) console.log("setupGames");

        // refresh games from the server
        _refreshGames();

        // set the game state
        $('#state').html(toDisplayString(Kharbga.GameState[game.getState()]));
        if (activeGameId === null || activeGameId.length < 10){
            displayGameMessage("Click on the New Game button to start a new game on this computer.");
        }

       // selectActiveGameId(activeGameId);
    }


    /**
     * @summary updates the board info based on the local game
     * @param {Kharbga.Game} - aGame this is a kharbga game to use
     */
    function updateBoardInfo(aGame){
        if (loggingOn) console.log("updateBoardInfo");
        if (aGame === null)
            return;

        if (aGame.is_in_setting_state() === true)
            boardEl.find('.square-d4').addClass('highlight-malha');
        else
            boardEl.find('.square-d4').removeClass('highlight-malha');

        if (aGame.attacker.name == user.name )
            $('#game-attacker').text(aGame.attacker.name + " (me)" );
        else
            $('#game-attacker').text(aGame.attacker.name);

        if (aGame.defender.name == user.name)
            $('#game-defender').text(aGame.defender.name + " (me)" );
        else
            $('#game-defender').text(aGame.defender.name );
          
        boardEl.find('.highlight-source').removeClass('highlight-source');
        // check the source required
        if (aGame.moveSourceRequired != null && aGame.moveSourceRequired.length> 1){
            boardEl.find('.highlight-source').removeClass('highlight-source'); 
            var sourceRequired = boardEl.find('.square-' + aGame.moveSourceRequired);
            sourceRequired.addClass('highlight-source');
        }
     

        // update the scores      
        updateScores(aGame);

        // update the move flags
        updateMoveFlags(aGame.moveFlags);

        updateTurnInfo(aGame);
    }

    /**
     * @summary Updates the UI display of the last action 
     * @param {*} gameMove - the game move info
     */
    function updateLastActionInfo(gameMove) {
        if (loggingOn) console.log("updateLastActionInfo");
        $('#move-captured').html(gameMove.captured);
        $('#move-exchanged').html(gameMove.exchanged);

        if (gameMove.isAttacker)
            gameMoveText += "A: ";
        else
            gameMoveText += "D: ";

        var gameMoveText = gameMove.from + " to " + gameMove.to;
        
        if (gameMove.captured.length > 0)
        {
            gameMoveText += " - c: ";
            gameMoveText += gameMove.captured;
        }
        if (gameMove.exchanged.length > 0)
        {
            gameMoveText += " - e: ";
            gameMoveText += gameMove.exchanged;
        }
        if (gameMove.resigned === true){
            gameMoveText += " - resigned ";
        }
        if (gameMove.exchangeRequest){
            if (gameMove.isAttacker)
                gameMoveText += (" - era "); // + gameMove.exchangeRequestAttackerPiece1 + " " + gameMove.exchangeRequestAttackerPiece2);
            else
                gameMoveText += (" - er ");// + gameMove.exchangeRequestDefenderPiece);

        }
        // check the game move flags
        if (game.state !== Kharbga.GameState.Completed){
            var flags = game.moveFlags;
            if (flags && flags.exchangeRequest === true){
                gameMoveText += (" - er ");
                if (flags.exchangeRequestDefenderPiece.length>1){
                    gameMoveText += flags.exchangeRequestDefenderPiece;
                }
                if (flags.exchangeRequestAccepted === true){
                    gameMoveText += (" - era ");
                    if (flags.exchangeRequestAttackerPiece1.length>1){
                        gameMoveText += flags.exchangeRequestAttackerPiece1;
                    }
                    if (flags.exchangeRequestAttackerPiece2.length>1){
                        gameMoveText += " ";
                        gameMoveText += flags.exchangeRequestAttackerPiece2;
                    }
                }
            }
        }
        $('#gameMove').html(gameMoveText);  
    }

    /**
     * @summary handler for window resize event
     * @param {*} e 
     */
    function resizeGame(e) {
        if (loggingOn) console.log("resizeGame");
        if (board == null)
            return;

        board.resize(e);    

        updateBoardInfo(game);  // 
    }
    // handler for resizing
    $(window).resize(resizeGame);

 
    function playSound() {
        if (userOptions.playSoundAfterMove === false){
            return;
        }

        var sound = document.getElementById('sound');
        if (sound != null && typeof(sound) != 'undefined')
            sound.play();
    }
    // call to initialize the board after creating the object
    this.initBoard = function (config) {
        if (loggingOn) console.log("initBoard"); 
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
        if (loggingOn) console.log("_setupSignalR");
        try {
            $.connection.hub.url = nsApiClient.baseURI + 'signalr';
            if (loggingOn) console.log("Hub URL: %s", $.connection.hub.url);

            $('#server-uri').text($.connection.hub.url); 

            gamesHubProxy = $.connection.gamesHub;
            $.connection.hub.logging = loggingOn;  // turn off  (config)

            if (gamesHubProxy == null || typeof gamesHubProxy.client == 'undefined') {
                nsApp.displayNetMessage("Unable to setup connection to server",false);
                return false;
            }

            gamesHubProxy.client.moveRecorded = onMoveRecorded;
            gamesHubProxy.client.send = onSendMessage;
            gamesHubProxy.client.hello = function () {
                if (loggingOn) console.log("%s - Hello from server", getLoggingNow());
                 
                 appendToNetMessagesList("server","Hello");
                
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
               // nsApp.displayNetMessage("SignalR Error: error " + error);
               // appendToNetMessagesList("server", error);
            });
        //    nsApp.displayNetMessage($.nsResources.ConnectedSuccessfully,true);
        nsApp.displayNetMessage("Connected Successfully",true);
            return startSignalR();
        }
        catch (e) {
            setSystemError(true);
            appClientState.useServer = false;
            appClientState.signalReInitialized = false;
            logObject(e);
            nsApp.displayNetMessage("Error connecting to server: " + e);
            $("#signalr-status").html("<div class='alert alert-danger'>Not setup</div>");

        }

        $.connection.hub.disconnected(function () {
            appClientState.signalReInitialized = false;
            appClientState.useServer = false;
            
            appendToNetMessagesList("Disconnected");

            nsApp.displayNetMessage("Disconnected");
            $("#signalr-status").html("<div class='alert alert-danger'>Disconnected</div>");
            setTimeout(function () {
                if (loggingOn) console.log('%s - RestartSignalR after disconnect!', getLoggingNow());
                startSignalR();
            }, 3000); // Restart connection after 3 seconds.
        });
    };

    function startSignalR() {
        if (loggingOn) console.log("startSignalR"); 
        try {
         //   if (!appClientState.setupSignalR)
        //      _setupSignalR();

            $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
                .done(function () {
                    gamesHubProxy.server.hello(nsApp.sessionId);
                    logMessage('startSignalR - connected, connection ID: ' + $.connection.hub.id);
                    appClientState.serverConnectionId = $.connection.hub.id;
                    appClientState.signalReInitialized = true;
                    appClientState.useServer = true;
                    appendToNetMessagesList("server","Connected");

                    // moves the setup of the games on startup at the end of the checking session process
                  //  nsApp.displayNetMessage($.nsResources.ConnectedSuccessfully, true);
                     nsApp.displayNetMessage("Connected Successfully", true);
                 
                  $("#signalr-status").html("<div class='alert alert-success'>Connected</div>");

                    resizeGame();

                    // check if we got a game to rejoin and refresh the active games
                   // rejoinLastGameIfAny();
                    joinGame(nsApp.state.gameId);
                })
                .fail(function () {
                    appClientState.signalReInitialized = false;

                    appendToNetMessagesList("server", "Failed to connect");
    
                    logMessage('startSignalR failed to connect');
                    $("#signalr-status").html("<div class='alert alert-danger'>Not connected</div>");
                    appClientState.useServer = false;
                });

        }
        catch (e) {
            logObject(e);
            appClientState.useServer = false;
            nsApp.displayNetMessage("Failed to Connected. Turning off server mode.");
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
        updateBoardInfo(game);   
    }
    this.flipBoard = function () {
        onFlipBoard();
    };

    /** @summary joins a game by game id 
     * @param {string} gameId - the game id
     */
    function joinGame(gameId){
        if (loggingOn) console.log("joinGame");
        if (gameId == null || typeof(gameId) != "string" || gameId.length < 10){
            return;
        }
        // check if the user is logged in for
        if (nsApp.isLoggedIn() === false){
            // add check if admin
            nsApp.displayErrorMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");   
            nsApp.displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }
        // attempt to start SignalR if not init
        if (appClientState.signalReInitialized == false)
        {
            nsApp.displayNetMessage("Signal R is not setup. Setting up...");
            _setupSignalR();
            //startSignalR();
        }
        if (gameId != "" && gamesHubProxy != null && appClientState.signalReInitialized) {
            nsApp.displayNetMessage("Joining game - id: " + gameId);
            nsApp.displayGameMessage("Joining game - id: " + gameId);
        //    gamesHubProxy.server.reJoinGame(user.name, gid, false);
            // tell the server to rejoin this connection with the game
            gamesHubProxy.server.joinGame(nsApp.sessionId,user.name, gameId, false).done(function(){
                nsApp.displayNetMessage("Done joining game - id: " + gameId);
                nsApp.displayGameMessage("Done joining game - id: " + gameId);
                //resize the board 
                resizeGame();
            });
        }
    };

    /** 
     * @summary checks the session cookie, setup the current games and last game if any 
     * @param {string} gameId - the startup game Id
     */ 
    this.setup = function (gameId) {
        nsApp.state.gameId = gameId;
        // check previous login session
        nsApp.setup();

        // setup signal R
        var setupOk =  _setupSignalR();
        if (setupOk == false) {
            // alert("Unable to setup connection to the server. Please try again later!");
            // try again after a couple of sec
            setTimeout(function() {
                _setupSignalR();
            }, 2000);
        }
        // init the board

        this.initBoard({
            themePath: '../img/theme-simple/{piece}.png'
        });

       
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
        if (nsApp.isLoggedIn() === false){
            // add check if admin
            nsApp.displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }
        // attempt to start SignalR if not init
        if (appClientState.signalReInitialized == false)
        {
            nsApp.displayNetMessage("Signal R is not setup. Setting up...");
            _setupSignalR();
            //startSignalR();
        }
        if (appClientState.signalReInitialized ){
            nsApp.displayNetMessage("Signal R is setup. Pinging...");
            gamesHubProxy.server.ping(nsApp.sessionId).done(function () { 
                nsApp.displayNetMessage("Done Pinging."); 
            });
        }
        else{
            nsApp.displayNetMessage("Unable to ping - Signal R is not setup.");
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
     *  @param {any} error - error condition 
     */
    function logMessage(message, error){
        if (loggingOn){
            if (error === true){
                console.log("Error");  // set breakpoint error for stack trace on error
            }
            console.log("%s - %s", getLoggingNow(), message);
        }
       
    }
        

    this.ping = _ping;

    this.newGame = function (options) {
        if (loggingOn) console.log("newGame");
        
        var event = { data: options };
        logMessage("New Game Request. Options: ");
        log(options);
   
        onNewGame(event); // 
    };

    this.postMessage = function(msg){

        // the user must be logged in to 
        if (nsApp.isLoggedIn() === false){
            // add check if admin
            nsApp.displayNetMessage("<a href='javascript:$.nsVM.openLoginPanel()'>Login</a> is required for this function.");
            return;
        }

        if (gamesHubProxy == null) {
            nsApp.displayNetMessage("Unable to post to server. Please try ping or restart first",false);
            return;
        }
        nsApp.displayNetMessage("Posting message...");
        gamesHubProxy.server.postMessage(nsApp.sessionId,user.name, msg.message);
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
     * @summary updates the board with a given move captured or exchanged pieces
     * @param {Kharbga.GameMove} move - the move info
     * @param {boolean} highlightMove - highlight the board with the move info
     */
    var updateBoardWithMove = function (move, highlightMove) {
        if (loggingOn) console.log("updateBoardWithMove");
        if (move == null)
            return;

        if (highlightMove === true){
            boardEl.find('.highlight-move').removeClass('highlight-move');
            boardEl.find('.highlight-captured').removeClass('highlight-captured');
        
            if (move.exchangeRequest == false)
                boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
        }
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
                boardEl.find('.square-' + move.to).addClass('highlight-move'); 
                if (move.exchangeRequest === true){
                    boardEl.find('.square-' + move.to).removeClass('highlight-exchange');
                    boardEl.find('.square-' + move.to).addClass('highlight-exchange');
                }

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
 
        // to display on computer message
        var html = "";
        if (move.isSetting) {
            html += "setting: " + move.to; 
        }else {
            html += "move: " + move.from + "-" + move.to; 
        }
        if (move.exchangeRequest) {
            if (move.isAttacker)
                html += " - era";
            else
                html += " - er";
        }

        if (move.captured != "") {
            html += " - captured: " + move.captured;
        }

        if (move.exchanged != "") {
            html += " - exchanged: " + move.exchanged;
        }
        if (move.resigned) {
            if (move.isAttacker)
                html += " - Attacker Resigned";
            else
                html +=" - Defender Resigned" ;
        }

        displayComputerMessage(html);
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
       
        
      //  updateBoardWithMove(move, true);
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
    
    
    var replayId = -1;
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
      //  updateBoardWithMove(move, true);
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
        replayId = -1;
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

    /**
     * Sets up the sound depending on user preferences
     */
    function setupSound(){
        var sound = document.getElementById("sound");
        if (sound == null || typeof (sound) == 'undefined')
            return;

        sound.muted = userOptions.playSoundAfterMove === false;
        $('#sound-mute').removeClass('mute');
        if (soundMuted)
            $('#sound-mute').addClass('mute');
    }

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
        gamesHubProxy.server.joinGame(nsApp.sessionId,user.name, gameId, false);

    };

    this.setSystemError = function(show){
        if (show)
            $('#message').html("<div class='alert alert-danger'>Messaging Server Error</div>");
        else
            $('#message').html("");
    };
   

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

    // call onClear
    // onClear();  // starts with a clear board
}; 
