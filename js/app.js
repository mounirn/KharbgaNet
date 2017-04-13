/* include after all dependecies */
var init = function () {
    var board,
        boardEl = $('#board');

    // the current player turn
    var currentPlayer;

    // the game events
    function onNewGameStarted(eventData) {
        console.log("event: onNewGameStarted - source: " + eventData.source.fen());

        $('#player').html('New Game...');
        $('#message').html("<div class='alert alert-info'>Started a new game.  </div>")
        updateScores(eventData.source);
    }
    function onNewPlayerTurn(eventData) {
        console.log("event: onNewPlayerTurn - player: " + eventData.player);

        
        $('#player').html(Kharbga.PlayerRole[eventData.player.role]);
        currentPlayer = eventData.player;

        $('#message').html("<div class='alert alert-success'>It is the turn  of the "
                +  Kharbga.PlayerRole[eventData.player.role] + " to play </div>")
    }
    function onNewSettingCompleted(eventData) {
        console.log("event: onNewSettingCompleted - source " + eventData.source.fen());
        // settings from and to are the same
        console.log("event: onNewSettingCompleted - from " + eventData.from);
        console.log("event: onNewSettingCompleted - to " + eventData.to);

        $('#message').html("<div class='alert alert-success'>It is the turn  of the "
            + Kharbga.PlayerRole[eventData.player.role] + " to set the 2nd piece </div>")

        updateScores(eventData.source);
    }
    function onSettingsCompleted(eventData) {
        console.log("event: onSettingsCompleted - source: " + eventData.source.fen());

        $('#message').html("<div class='alert alert-warning'>The setting phase is now completed.  </div>");

        $('#state').html(Kharbga.GameState[eventData.source.getState()]);

        updateScores(eventData.source);
    }
    function onNewMoveStarted(eventData) {
        console.log("event: onNewMoveStarted - source: " + eventData.source.fen());
        console.log("event: onNewMoveStarted - from " + eventData.from);
        console.log("event: onNewMoveStarted - to " + eventData.to);

    }
    function onNewMoveCompleted(eventData) {
        console.log("event: onNewMoveCompleted - source: " + eventData.source.fen());
        console.log("event: onNewMoveCompleted - from " + eventData.from);
        console.log("event: onNewMoveCompleted - to " + eventData.to);


        updateScores(eventData.source);
    }
    function onNewMoveCanceled(eventData) {
        console.log("event: onNewMoveCanceled - source: " + eventData.source.fen());

    }

    function onWinnerDeclared(eventData) {
        console.log("event: onWinnerDeclared - winner: " + eventData.player);

        $('#message').html("<div class='alert alert-info'>Game Over. Winner is: " + Kharbga.PlayerRole[eventData.player.role]  + "</div>")

        updateScores(eventData.source);
    }
    function onUntouchableSelected(eventData) {
        console.log("event: onUntouchableSelected - source: " + eventData.source);
        console.log("event: onUntouchableSelected - from " + eventData.from);
        console.log("event: onUntouchableSelected - to " + eventData.to);

        updateScores(eventData.source);

    }

    function onUntouchableExchangeCanceled(eventData) {
        console.log("event: onUntouchableExchangeCanceled - source: " + eventData.source);

        updateScores(eventData.source);
    }
    function onInvalidSettingMalha(eventData) {
        console.log("event: onInvalidSettingMalha - targetCellId: " + eventData.targetCellId);
        $('#message').html("<div class='alert alert-danger'>Setting on middle cell (Malha) is not allowed</div>")

    }
    function onInvalidSettingOccupied(eventData) {
        console.log("event: onInvalidSettingMalha - targetCellId: " + eventData.targetCellId);

        $('#message').html("<div class='alert alert-danger'>Setting on an occupied cell is not allowed</div>")
    }

    function updateScores(game) {
        $('#attacker_score').html(game.getAttackerScore().toString());
        $('#defender_score').html(game.getDefenderScore().toString());
    }

    /* Board Events */
    function onInvalidMove(eventData) {
        console.log("board event: onInvalidMove - target: " + eventData.targetCellId);
    }
    function onValidMove(eventData) {
        console.log("board event: onValidMove - target: " + eventData.targetCellId);
    }
    function onCapturedPiece(eventData) {
        console.log("board event: onCapturedPiece - target: " + eventData.targetCellId);

      //  board.move(eventData.targetCellId + "-spare");

        board.position(game.fen(), false);

    }


    // Setup the game events to pass to the game object
    var gameEvents = {
        newGameStartedEvent: onNewGameStarted,
        newPlayerTurnEvent: onNewPlayerTurn,
        newSettingCompletedEvent: onNewSettingCompleted,
        settingsCompletedEvent: onSettingsCompleted,
        newMoveStartedEvent: onNewMoveStarted,
        newMoveCompletedEvent: onNewMoveCompleted,
        newMoveCanceledEvent: onNewMoveCanceled,
        winnerDeclaredEvent: onWinnerDeclared,
        untouchableSelectedEvent: onUntouchableSelected,
        untouchableExchangeCanceledEvent: onUntouchableExchangeCanceled,
        invalidSettingMalhaEvent: onInvalidSettingMalha,
        invalidSettingOccupiedEvent: onInvalidSettingOccupied,

    };  

    // Setup the board events
    var boardEvents = {
        invalidMoveEvent: onInvalidMove,
        validMoveEvent: onValidMove,
        capturedPieceEvent: onCapturedPiece
    };
 

    var game = new Kharbga.Game(gameEvents,boardEvents);   // KharbgaGame()
    // set the game state
    $('#state').html(Kharbga.GameState[game.getState()]);
    $('#message').html("<div class='alert alert-info'>Click on Start New Game button to start a new game on this computer between two players</div>")

    var  squareClass = 'square-55d63',
        squareToHighlight,
        colorToHighlight;


    var onDragMove = function (newLocation, oldLocation, source,
        piece, position, orientation) {
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
        
        // check if settings is over and selected piece is spare
        if (game.game_setting_over() === true && source === 'spare')
           return false;

        // check if setting is not over and selected piece is on baord
        if (game.game_setting_over() === false && source !== 'spare')
            return false;
        if (game.is_in_moving_state() === true) {
            // check if piece is sourrounded -- return false
            if (game.is_surrounded_piece(source))
                return false;
        }

    };

    var onDrop = function (source, target, piece, newPos, oldPos, orientation) {
        console.log("Source: " + source);
        console.log("Target: " + target);
        console.log("Piece: " + piece);
        console.log("New position: " + KharbgaBoard.objToFen(newPos));
        console.log("Old position: " + KharbgaBoard.objToFen(oldPos));
        console.log("Orientation: " + orientation);
        console.log("--------------------");

        var ret;
        if (game.is_in_moving_state())
            ret = game.processMove(source,target);
        else
            ret = game.processSetting(target);

        // see if the move is legal
  //      var move = game.({
  //          from: source,
  //          to: target,
  //          promotion: 'q' // NOTE: always promote to a queen for example simplicity
  //      });

        // illegal move
      //  if (move === null) return 'snapback';

       // updateStatus();
        if (ret == false) return 'snapback';

    };


    var onMoveEnd = function() {
      boardEl.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight);

     // add logic to check if a valid move

    };

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDragMove: onDragMove,
        onMoveEnd: onMoveEnd,
        onDrop : onDrop,
        sparePieces: true,
        showErrors : 'console'
    };
    var board = KharbgaBoard('board', cfg);

    /**
     * Starts a new game
     */
    function onStart() {
        game.reset();
        game.start();
        board.start();
        
        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        updateScores(game);
    }
    /**
     * Clears the game and the board. The board is a set with an empty position string or fen
     */
    function onClear() {
        game.reset();
        $('#state').html(Kharbga.GameState[game.getState()]);
        board.clear();

        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());
    }

    function clickGetPositionBtn() {
        console.log("Current position as an Object:");
        console.log(board.position());

        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        console.log("Current position as a FEN string:");
        console.log(board.fen());
    }

    $('#getPositionBtn').on('click', clickGetPositionBtn);
    $('#startGameBtn').on('click', onStart);
    $('#clearBoardBtn').on('click', onClear);
    $('#clearBoardInstantBtn').on('click', function() {
        board.clear(false);
    });

    // flip the board
    $('#flipOrientationBtn').on('click', board.flip);

    // handler for resizing
    $(window).resize(board.resize);

}; // end init()
$(document).ready(init);