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
        userScreenName: "Guest",
        gameChannel: "",
        serverConnectionId: "",
        serverOpponentConnectionId: "",
        role: 0,      //  unknown, attacker, defender, spectator
    };

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

        appClientState.gameChannel = serverStartNewGame();
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
        console.log("event: onNewSettingCompleted - cell " + eventData.targetCellId);

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
     /*   console.log("event: onNewMoveStarted - source: " + eventData.source.fen());
        console.log("event: onNewMoveStarted - from " + eventData.from);
        console.log("event: onNewMoveStarted - to " + eventData.to);
*/

    }

    function onNewMoveCompleted(eventData) {
        console.log("event: onNewMoveCompleted - game position: %s - from: %s - to: %s  ",
            eventData.source.fen(), eventData.from.ID(), eventData.to.ID());


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

    }

    /**
     * handler for the player selecting a cell and not moving and staying the same cell. This could indicate a player
     * selecting a piece for exchange
     * @param {any} eventData -- the action data
     */
    function onNewMoveCanceled(eventData) {
        console.log("event: onNewMoveCanceled - target Cell Id: " + eventData.targetCellId);
 
    }

    function onInvalidGameMove(eventData) {
        console.log("game event: onInvalidMove - game fen: " + eventData.source.fen());
        console.log("event: onNewMoveCompleted - from " + eventData.from.ID());
        console.log("event: onNewMoveCompleted - to " + eventData.to.ID());

    }

    /**
     * Handler for when the game is game
     * @param {any} eventData - the game event info
     */
    function onWinnerDeclared(eventData) {
        console.log("event: onWinnerDeclared - winner: " + eventData.player);

        $('#message').html("<div class='alert alert-info'><strong>Game Over. Winner is: " + Kharbga.PlayerRole[eventData.player.role] + " </strong></div>")

        updateScores(eventData.source);

        $('#state').html(Kharbga.GameState[eventData.source.getState()]);
        

        $('#startGameBtn').show();
        $('#loadSetting1').hide();
      //  board.clear();
    }

    function onUntouchableSelected(eventData) {
        console.log("event: onUntouchableSelected - cell: " + eventData.targetCellId);
     
        var exchangeSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangeSquare.addClass('highlight-exchange');

        updateMoveFlags(eventData.source.move_flags());

    }

    function onUntouchableExchangeCanceled(eventData) {
        console.log("event: onUntouchableExchangeCanceled - source: " + eventData.source);
        $('#message').html("<div class='alert alert-warning'>Exchange Request Canceled</div>")

        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
    }

    function onUntouchableExchangeCompleted(eventData) {
        console.log("event: onUntouchableExchangeCompleted - source: " + eventData.source);
        $('#message').html("<div class='alert alert-success'>Exchnage Request Completed</div>")


     //   board.position(game.fen(), false);
        updateScores(eventData.source);
        updateMoveFlags(eventData.source.move_flags());

        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
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

        $('#message').html("<div class='alert alert-danger'>Invalid Move " + Kharbga.BoardMoveType[eventData.type] +" </div>")
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

    function onExchangedPiece(eventData) {
        console.log("board event: onExchangedPiece - target: " + eventData.targetCellId);

        //  board.move(eventData.targetCellId + "-spare");
        // remove original piece from source square
        //srcSquareEl.find('.' + CSS.piece).remove();
        var exchangedSquare = boardEl.find('.square-' + eventData.targetCellId);
        exchangedSquare.addClass('highlight-exchange');
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
        untouchableExchangeCompletedEvent: onUntouchableExchangeCompleted,
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


    function readMoveParams() {
     
    }

    function updateMoveFlags(moveFlags) {
        $('#exchangeRequestCheckbox').attr('checked', moveFlags.exchangeRequest);
        $('#exchangeRequestAcceptedCheckbox').attr('checked', moveFlags.exchangeRequestAccepted);

        $('#exchangeRequestDefenderPiece').text(moveFlags.exchangeRequestDefenderPiece);
        $('#exchangeRequestAttackerPiece1').text(moveFlags.exchangeRequestAttackerPiece1);
        $('#exchangeRequestAttackerPiece2').text(moveFlags.exchangeRequestAttackerPiece2);
    }

    var onDrop = function(source, target, piece, newPos, oldPos, orientation) {
        console.log("onDrop - from: %s - to: %s ", source, target);
        /*    console.log("Target: " + target);
        console.log("Piece: " + piece);
        console.log("New position: " + KharbgaBoard.objToFen(newPos));
        console.log("Old position: " + KharbgaBoard.objToFen(oldPos));
        console.log("Orientation: " + orientation);
        console.log("--------------------");
*/
        // readMoveParams();
        $('#gameMove').html(source + "-" + target);

        var ret;

        var exchangeRequest = false;
        if (game.turn() == 'a')
            exchangeRequest = $('#exchangeRequestAcceptedCheckbox').is(':checked');
        else
            exchangeRequest = $('#exchangeRequestCheckbox').is(':checked');

        if (game.is_in_moving_state())
            ret = game.processMove(source, target, $('#abandonCheckbox').is(':checked'), exchangeRequest);
        else
            ret = game.processSetting(target);

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
        console.log("onSelected - target: %s - piece: %s ", target, piece);

    }

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDragMove: onDragMove,
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
        boardEl.find('.highlight-captured').removeClass('highlight-captured');
        boardEl.find('.highlight-source').removeClass('highlight-source');
        boardEl.find('.highlight-exchange').removeClass('highlight-exchange');
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

  
    function onSendMessage(name, message) {
        console.log("%s - Message from %s: %", new Date().toLocaleTimeString(), name, message);
    }


    function clickGetPositionBtn() {
        console.log("Current position as an Object:");
        console.log(board.position().toString());

        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

        console.log("Current position as a FEN string:");
        console.log(board.fen());
    }
    var loggedIn = false;
    var userName = "";
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
            }
            else {
                $('#account-message').html("<div class='alert alert-error'> <pre> " + JSON.stringify(status) + " </pre> </div>");
                $('#appInfo').html(JSON.stringify(status));
            }  
        });
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
     * Sets up the MyAccount tab based on the current app client state
     */
    function setupMyAccount() {
        if (loggedIn) {
            $('#account-info-panel').show().removeClass('hidden');;
        } else {
            $('#login-panel').show().removeClass('hidden');;
            $('#register-panel').hide().addClass('hidden');;
            $('#account-info-panel').hide().addClass('hidden');;
        }
    }

    // setup all the various buttons and links events
    $('#login-link').on('click', onLoginLink);
    $('#register-link').on('click', onRegisterLink);
    $('#login-submit').on('click', onLoginSubmit);
    $('#refreshAppInfo-submit').on('click', onRefreshAppInfo);
    $('#getPositionBtn').on('click', clickGetPositionBtn);
    $('#startGameBtn').on('click', onStart);
    $('#clearBoardBtn').on('click', onClear);
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

    setupMyAccount();

    // setup signalR communications
    $.connection.hub.url = nsApiClient.baseURI + 'signalr';

    console.log("Hub URL: %s", $.connection.hub.url);

    var gamesHubProxy = $.connection.gamesHub;
    $.connection.hub.logging = loggingOn;

    gamesHubProxy.client.recordMove = onRecordMove;
     /**
     * Hello from server
     */
    gamesHubProxy.client.hello = function() {
        console.log("%s - Hello from server", new Date().toLocaleTimeString());
    };

    gamesHubProxy.client.send = onSendMessage;
 

    // game handler
    gamesHubProxy.client.gameAdded = function (gameInfo) {
        // add to the games list

    };

    gamesHubProxy.client.gameDeleted = function (gameInfo) {
        // remove from the games list

    };

    // base hub messages
    gamesHubProxy.client.joined = function (connectionId, serverTime) {
        console.log('server: connection %s joined on %s ',connectionId, serverTime);
    };
    gamesHubProxy.client.left = function (connectionId, serverTime) {
        console.log('server: connection %s left on %s ', connectionId, serverTime);
    };
    gamesHubProxy.client.rejoined = function (connectionId, serverTime) {
        console.log('server: connection %s rejoined on %s ', connectionId, serverTime);
    };
    gamesHubProxy.client.pong = function (connectionId, serverTime) {

        if (connectionId !== $.connection.hub.id) {
            console.log('server: INVALID pong from %s received on: %s', connectionId, serverTime);
        }
        else {
            // check if equal to self
            console.log('server: pong from %s received on: %s', connectionId, serverTime);
        }
    };

    $.connection.hub.start({ jsonp: true })
        .done(function () {
            gamesHubProxy.server.hello();
            console.log('%s connected, connection ID: %', new Date().toLocaleTimeString(), $.connection.hub.id);
            myConnectionId = $.connection.hub.id;
        })
        .fail(function () { console.log('Could not Connect!'); });

    $('#submitMove').on('click', function onSubmit() {
        gamesHubProxy.server.recordMove("testGameId", myConnectionId, "testMove").done(function () {
            console.log('server Invocation of recoredMove');
        })
        .fail(function (error)
        {
            console.log('Invocation of recordMove failed. Error: ' + error);
        });
    });

    $('#ping-button').on('click', function () {
        gamesHubProxy.server.ping(new Date());  
    });


    /**
     * starts a new game on the server
     * @returns the new game id
     */
    function serverStartNewGame() {
        gamesHubProxy.server.newGame(appClientState.userScreenName);
    }
    /**
     * handler for the Post message request
     */
    function onPostMessage() {

    }
    // handler for resizing
    $(window).resize(board.resize);

}; // end init()
$(document).ready(init);