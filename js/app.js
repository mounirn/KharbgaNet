/* include after all dependecies */
var init = function() {
    var board,
        boardEl = $('#board');

    var myConnectionId, myOpponentConnectionId;  // the network connection ids
    var serverGameId = null;  // the game id assigned by the server

    // the current player turn
    //var currentPlayer;

    /* the game events */
    /**
     * Handler for the local engine when a new game is started
     * @param {any} eventData -- the event data
     */
    function onNewGameStarted(eventData) {
        console.log("event: onNewGameStarted - source: " + eventData.source.fen());

        $('#player').html('New Game...');
        $('#message').html("<div class='alert alert-info'>Started a new game.  </div>")
        updateScores(eventData.source);

        $('.exchangeRequest').hide();
      //  $('#exchangeRequestCheckbox').hide();

        // malha square
        var malha = boardEl.find('.square-d4');
        malha.addClass('highlight-malha');
    }

    function onNewPlayerTurn(eventData) {
        console.log("event: onNewPlayerTurn - player: " + eventData.player);


        $('#player').html(Kharbga.PlayerRole[eventData.player.role]);
        currentPlayer = eventData.player;

        $('#message').html("<div class='alert alert-success'>It is the turn  of the <strong>" +
            Kharbga.PlayerRole[eventData.player.role] + "</strong> to play </div>")

        // reset after player's move 
        moveSourceRequired = "";

     /*   var capturedCells = boardEl.find('.hightlight-captured');
        sourceRequired.removeClass('highlight-captured'); */
        // removed captured cells highlighting 
        $('.hightlight-captured').removeClass('hightlight-captured');
      

    }

    function onNewSettingCompleted(eventData) {
        console.log("event: onNewSettingCompleted - source " + eventData.source.fen());
        // settings from and to are the same
        console.log("event: onNewSettingCompleted - from " + eventData.from);
        console.log("event: onNewSettingCompleted - to " + eventData.to);

        $('#message').html("<div class='alert alert-success'>It is the turn  of the " +
            Kharbga.PlayerRole[eventData.player.role] + " to set the 2nd piece </div>")

        updateScores(eventData.source);


    }

    function onSettingsCompleted(eventData) {
        console.log("event: onSettingsCompleted - source: " + eventData.source.fen());

        $('#message').html("<div class='alert alert-info'>The setting phase is now completed.  It is the Attacker turn to move a piece to the middle cell and attempt to capture the opponent pieces. </div>");

        $('#state').html(Kharbga.GameState[eventData.source.getState()]);

        updateScores(eventData.source);

        // display the exchange request fields
        $('.exchangeRequest').show();

        boardEl.find('.square-d4').removeClass('highlight-malha');
    }

    function onNewMoveStarted(eventData) {
        console.log("event: onNewMoveStarted - source: " + eventData.source.fen());
        console.log("event: onNewMoveStarted - from " + eventData.from);
        console.log("event: onNewMoveStarted - to " + eventData.to);

    }

    function onNewMoveCompleted(eventData) {
        console.log("event: onNewMoveCompleted - game position: %s - from: %s - to: %s  ",
            eventData.source.fen(), eventData.from.ID(), eventData.to.ID());


        // remove source highlighting
        var sourceRequired = boardEl.find('.highlight-source');
        sourceRequired.removeClass('highlight-source');

        boardEl.find('.highlight-captured').removeClass('highlight-captured');

        updateScores(eventData.source);

        if ($('#exchangeRequestChecked').attr('checked') == true) {
            $('#exchangeRequestDefenderPiece').text(to);
        }
        else {
            $('#exchangeRequestDefenderPiece').text('');
        }
    }

    function onNewMoveCompletedContinueSamePlayer(eventData) {
        console.log("event: onNewMoveCompletedContinueSamePlayer - source: %s - from %s - to: %s ",
            eventData.source.fen(), eventData.from.ID(), eventData.to.ID());

        $('#message').html("<div class='alert alert-success'>Same player must continue playing using the same soldier now on: <strong> " +
            eventData.targetCellId  + "</strong>. There are still pieces that could be captured  </div>" );

        // player must play this piece   
     
        var moveSourceRequired = eventData.targetCellId;
        // highlight the piece required for moving
        var sourceRequired = boardEl.find('.square-' + moveSourceRequired);
        sourceRequired.addClass('highlight-source');

        updateScores(eventData.source);
    }

    function onNewMoveCanceled(eventData) {
        console.log("event: onNewMoveCanceled - source: " + eventData.source.fen());

    }

    function onInvalidGameMove(eventData) {
        console.log("game event: onInvalidMove - game fen: " + eventData.source.fen());
        console.log("event: onNewMoveCompleted - from " + eventData.from.ID());
        console.log("event: onNewMoveCompleted - to " + eventData.to.ID());

    }

    function onWinnerDeclared(eventData) {
        console.log("event: onWinnerDeclared - winner: " + eventData.player);

        $('#message').html("<div class='alert alert-info'>Game Over. Winner is: " + Kharbga.PlayerRole[eventData.player.role] + "</div>")

        updateScores(eventData.source);

        $('#startGameBtn').show();
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
        console.log("board event: onInvalidMove - target: %s - type : %s ",
            eventData.targetCellId, Kharbga.BoardMoveType[eventData.type]);
    }

    function onValidMove(eventData) {
        console.log("board event: onValidMove - target: " + eventData.targetCellId);
    }

    function onCapturedPiece(eventData) {
        console.log("board event: onCapturedPiece - target: " + eventData.targetCellId);

        //  board.move(eventData.targetCellId + "-spare");
        // remove original piece from source square
        //srcSquareEl.find('.' + CSS.piece).remove();
        var capturedSquare = boardEl.find('.square-' + eventData.targetCellId);
        capturedSquare.addClass('highlight-captured');
       // capturedSquare.find('.' + pieceClass).remove();

        board.position(game.fen(), false);
        updateScores(game);
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
        invalidSettingMalhaEvent: onInvalidSettingMalha,
        invalidSettingOccupiedEvent: onInvalidSettingOccupied,
        invalidMoveEvent: onInvalidGameMove
    };

    // Setup the board events
    var boardEvents = {
        invalidMoveEvent: onInvalidMove,
        validMoveEvent: onValidMove,
        capturedPieceEvent: onCapturedPiece
    };


    var game = new Kharbga.Game(gameEvents, boardEvents); // KharbgaGame()
    // set the game state
    $('#state').html(Kharbga.GameState[game.getState()]);
    $('#message').html("<div class='alert alert-info'>Click on Start New Game button to start a new game on this computer between two players</div>")

    var squareClass = 'square-55d63',
        pieceClass = 'piece-417db',
        squareToHighlight,
        colorToHighlight;


    var onDragMove = function(newLocation, oldLocation, source,
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

        // check if setting is not over and selected piece is on the board
        if (game.game_setting_over() === false && source !== 'spare')
            return false;
        if (game.is_in_moving_state() === true) {
            // check if piece is surrounded -- return false
            if (game.is_surrounded_piece(source) === true)
                return false;

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
        /*    console.log("Target: " + target);
        console.log("Piece: " + piece);
        console.log("New position: " + KharbgaBoard.objToFen(newPos));
        console.log("Old position: " + KharbgaBoard.objToFen(oldPos));
        console.log("Orientation: " + orientation);
        console.log("--------------------");
*/
        $('#gameMove').html(source + "-" + target);

        var ret;
        var params = {};
        params.exchangeRequest = $('#exchangeRequestCheckbox').attr('checked') == true;
        params.exchangeRequestDefenderPiece = $('#exchangeRequestDefenderPiece').text();
        params.exchangeRequestAccepted = $('#exchangeRequestCheckboxAccepted').attr('checked') == true;
        params.exchangeRequestAttackerPiece1 = $('#exchangeRequestAttackerPiece1').text();
        params.exchangeRequestAttackerPiece2 = $('#exchangeRequestAttackerPiece2').text();
        if (game.is_in_moving_state())
            ret = game.processMove(source, target);
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

    /**
     * processes a given move request
     * @param {string} gameId  -- the game id
     * @param {string} playerId  -- the player id
     * @param {string} move   -- the move info
     */
    var onRecordMove = function(gameId, playerId, move) {
        console.log(gameId + ' ' + playerId + ' ' + move);
    };

    var onMoveEnd = function() {

        //boardEl.find('.square-' + squareToHighlight)
        //    .addClass('highlight-' + colorToHighlight);

        // add logic to check if a valid move

    };

    /**
     * handler for when selection a cell for setting or a piece for exchange(double click)
     * @param {any} target
     * @param {any} piece
     * @param {any} orientation
     */
    var onSelected = function (target, piece, orientation) {
        console.log("onSelected - target: %s - piece: %s ", target, piece);

    }

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDragMove: onDragMove,
        onMoveEnd: onMoveEnd,
        onDrop: onDrop,
        onDoubleClick = onSelected,
        sparePieces: true,
        showErrors: 'console',
        pieceTheme: '../img/theme-simple/{piece}.png'
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

        $('#loadSetting1Btn').show();
        $('#startGameBtn').hide();
    }

    function onLoadSetting1() {
        var fen = "SssSsss/sSSSSSS/ssSsSss/sss1sSS/sSsSSSS/SssSsSS/SssSsSs";
        game.reset();
        game.start();
        board.start();
        board.position(fen, false);

        game.set(fen);

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

    /**
     * Hello from server
     */
    function onHello() {
        console.log("%s - Hello from server", new Date().toLocaleTimeString() );

    }
    function onSendMessage(name, message) {
        console.log("%s - Message from %s: %", new Date().toLocaleTimeString(), name, message);
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

    $('#loadSetting1Btn').on('click', onLoadSetting1);

    // flip the board
    $('#flipOrientationBtn').on('click', board.flip);



    // setup signalR communications
    $.connection.hub.url = 'http://localhost/NS.API/signalr';
    var gamesHubProxy = $.connection.gamesHub;
    gamesHubProxy.client.recordMove = onRecordMove;
    gamesHubProxy.client.hello = onHello;
    gamesHubProxy.client.send = onSendMessage;

    $.connection.hub.start({ jsonp: true })
        .done(function () {
            gamesHubProxy.server.hello();
            console.log('%s connected, connection ID: %', new Date().toLocaleTimeString(), $.connection.hub.id);
            myConnectionId = $.connection.hub.id;
        })
        .fail(function () { console.log('Could not Connect!'); });

    $('#submitMove').on('click', onSubmit);

    function onSubmit() {
        gamesHubProxy.server.recordMove("testGameId", myConnectionId, "testMove").done(function () {
            console.log('server Invocation of recoredMove');
        }).fail(function (error)
        {
            console.log('Invocation of recordMove failed. Error: ' + error);
            });
    }

    // handler for resizing
    $(window).resize(board.resize);

}; // end init()
$(document).ready(init);