/* include after all dependecies */
var init = function () {
    var board,
        boardEl = $('#board');

    // the game events
    function onNewGameStarted(eventData) {
        console.log("event: onNewGameStarted - source: " + eventData.source);
    }
    function onNewPlayerTurn(eventData) {
        console.log("event: onNewPlayerTurn - player: " + eventData.player);

        
        $('#player').html(Kharbga.PlayerRole[eventData.player.role]);
    }
    function onNewSettingCompleted(eventData) {
        console.log("event: onNewSettingCompleted - source " + eventData.source);
        // settings from and to are the same
        console.log("event: onNewSettingCompleted - from " + eventData.from);
        console.log("event: onNewSettingCompleted - to " + eventData.to);
    }
    function onSettingsCompleted(eventData) {
        console.log("event: onSettingsCompleted - source: " + eventData.source);

    }
    function onNewMoveStarted(eventData) {
        console.log("event: onNewMoveStarted - source: " + eventData.source);
        console.log("event: onNewMoveStarted - from " + eventData.from);
        console.log("event: onNewMoveStarted - to " + eventData.to);

    }
    function onNewMoveCompleted(eventData) {
        console.log("event: onNewMoveCompleted - source: " + eventData.source);
        console.log("event: onNewMoveCompleted - from " + eventData.from);
        console.log("event: onNewMoveCompleted - to " + eventData.to);

    }
    function onNewMoveCanceled(eventData) {
        console.log("event: onNewMoveCanceled - source: " + eventData.source);

    }

    function onWinnerDeclared(eventData) {
        console.log("event: onWinnerDeclared - winner: " + eventData.player);

    }
    function onUntouchableSelected(eventData) {
        console.log("event: onUntouchableSelected - source: " + eventData.source);
        console.log("event: onUntouchableSelected - from " + eventData.from);
        console.log("event: onUntouchableSelected - to " + eventData.to);

    }

    function onUntouchableExchangeCanceled(eventData) {
        console.log("event: onUntouchableExchangeCanceled - source: " + eventData.source);

    }
    // Setup the game events to pass to the game object
    var gameEvents = {
        newGameStartedEvent : onNewGameStarted,
        newPlayerTurnEvent : onNewPlayerTurn,
        newSettingCompletedEvent : onNewSettingCompleted,
        settingsCompletedEvent : onSettingsCompleted,
        newMoveStartedEvent : onNewMoveStarted,
        newMoveCompletedEvent : onNewMoveCompleted,
        newMoveCanceledEvent : onNewMoveCanceled,
        winnerDeclaredEvent : onWinnerDeclared,
        untouchableSelectedEvent : onUntouchableSelected,
        untouchableExchangeCanceled : onUntouchableExchangeCanceled,
    }   
 

    var game = new Kharbga.Game(gameEvents);   // KharbgaGame()
    // set the game state
    $('#state').html(Kharbga.GameState[game.getState()]);

    var  squareClass = 'square-55d63',
        squareToHighlight,
        colorToHighlight;


    var onDragMove = function (newLocation, oldLocation, source,
        piece, position, orientation) {
        console.log("New location: " + newLocation);
        console.log("Old location: " + oldLocation);
        console.log("Source: " + source);
        console.log("Piece: " + piece);
        console.log("Position: " + KharbgaBoard.objToFen(position));
        console.log("Orientation: " + orientation);
        console.log("--------------------");
        console.log("game state: " + game.getState());
        console.log("game is in setting mode: " + game.isInSettingMode());

        // add logic to check if current player is allowed to make this move
    };

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
   /*   if (game.game_over() === true ||
          (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    */

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
        sparePieces: true,
        showErrors : 'console'
    };
    var board = KharbgaBoard('board', cfg);

    /**
     * Starts a new game
     */
    function onStart() {
        game.start();
        board.start();
        
        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());
    }
    /**
     * Clears the game and the board. The board is a set with an empty position string or fen
     */
    function onClear() {
        game = new Kharbga.Game();
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