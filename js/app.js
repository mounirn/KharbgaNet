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
        loggedId: false,
        player: null,
        opponentPlayer: null,
        loaded: false
    };

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

        // malha square
        boardEl.find('.square-d4').addClass('highlight-malha');
       
    }

    function onNewPlayerTurn(eventData) {
        console.log("event: onNewPlayerTurn - player: " + eventData.player);


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
    }
    /**
     * handler for when a setting is completed
     * @param {any} eventData
     */
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

        $('#state').html(Kharbga.GameState[game.getState()]);
        $('#fen').html(board.fen());
        $('#pgn').html(board.position().toString());

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

        if (typeof appClientState.player == 'undefined' ) {
            $('#message').html("<div class='alert alert-info'>Please start or join a game to be able to play.</div>")
            return false;
        }
        if (appClientState.player.IsSpectator === true) {
            $('#message').html("<div class='alert alert-warning'>As a spectator you are not allowed to make any moves. You could however submit comments if allowed by the players.</div>")
            return false;
        }
        // check if allowed to make the move
        if (game.turn() === 'a' && appClientState.player.IsAttacker !== true) {
            return false;
        }
        if (game.turn() === 'd' && appClientState.player.IsAttacker !== false) {
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
        
        $('#gameMove').html(source + "-" + target);

        var ret;

        var resigned = $('#abandonCheckbox').is(':checked');
        var exchangeRequest = false;
        if (game.turn() == 'a')
            exchangeRequest = $('#exchangeRequestAcceptedCheckbox').is(':checked');
        else
            exchangeRequest = $('#exchangeRequestCheckbox').is(':checked');
        var isSetting = false;
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
            // submit to the server
            if (appClientState.serverGameId != "") {
                // notify server pf the setting
                gamesHubProxy.server.recordMove(appClientState.serverGameId, appClientState.userScreenName, isSetting, source, target, resigned, exchangeRequest).done(function () {
                    console.log('server Invocation of recoredMove');

                })
                    .fail(function (error) {
                        console.log('Invocation of recordMove failed. Error: ' + error);
                    });
            }
        }
        // updateStatus();
        if (ret == false) return 'snapback';
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

    function updateMoveFlags(moveFlags) {
        $('#exchangeRequestCheckbox').attr('checked', moveFlags.exchangeRequest);
        $('#exchangeRequestAcceptedCheckbox').attr('checked', moveFlags.exchangeRequestAccepted);

        $('#exchangeRequestDefenderPiece').text(moveFlags.exchangeRequestDefenderPiece);
        $('#exchangeRequestAttackerPiece1').text(moveFlags.exchangeRequestAttackerPiece1);
        $('#exchangeRequestAttackerPiece2').text(moveFlags.exchangeRequestAttackerPiece2);
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
    function onNewGame() {
     
        resetLocalGame();
        // call the server to start the new game
        gamesHubProxy.server.createGame(appClientState.userScreenName, true, false);
    }

    function resetLocalGame() {
        appClientState.loaded = false;
        appClientState.serverGameId = "";
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
    function onLoadSetting1() {
        var fen = "SssSsss/sSSSSSS/ssSsSss/sss1sSS/sSsSSSS/SssSsSS/SssSsSs";
        game.reset();
        game.start();
        board.clear();
        board.start();
    
        game.set(fen);
        board.position(fen, false);

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
    }

    // setup all the various buttons and links events
    $('#login-link').on('click', onLoginLink);
  
    $('#register-link').on('click', onRegisterLink);
    $('#login-submit').on('click', onLoginSubmit);
    $('#register-submit').on('click', onRegisterSubmit);
    $('#logout-link').on('click', onLogoutSubmit);
    $('#refreshAppInfo-submit').on('click', onRefreshAppInfo);
    $('#getPositionBtn').on('click', clickGetPositionBtn);
    $('#new-game').on('click', onNewGame);
   
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

    gamesHubProxy.client.moveRecorded = function (status, errorMessage, gameServerInfo, player, isSetting, moveFrom, moveTo, resigned, exchangeRequest){
        if (status === false) {
            console.log("server - error recording move: " + errorMessage);
            $('#message').html("<div class='alert alert-danger'> Failed to process by the server. Error: " + errorMessage+ "</div>");
            return;
        }
        // submit to the local 
        var turn = 'b';
        if (game.turn() == 'a')
            turn = 'w';
        board.move(moveFrom + "." + turn +  "-" + moveTo);

        // submit to the local game
        var ret;
        if (game.is_in_moving_state()) {
            ret = game.processMove(moveFrom, moveTo, resigned, exchangeRequest);
        }
        else {
            ret = game.processSetting(moveTo);
        }

        // set the board to the game FEN
        board.position(game.fen(), false);
    }
     /**
     * Hello from server
     */
    gamesHubProxy.client.hello = function() {
        console.log("%s - Hello from server", new Date().toLocaleTimeString());
    };

    gamesHubProxy.client.send = onSendMessage;


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
     * @param {any} game -- the game
     */
    function setupLocalPlayer(player, game) {
        if (typeof player == "undefined" || player == null) {
            console.log("%s - setCurrentPlayer - Invalid player passed : ", new Date().toLocaleTimeString());
            return;
        }
        appClientState.player = player;

        appClientState.userScreenName = player.Name;

        if (typeof game == "undefined"  || game == null) {
            console.log("%s - setCurrentPlayer - Invalid game passed : ", new Date().toLocaleTimeString());
            return;
        }

        $('#current-game-id').text(game.ID);
        $('#current-game-status').text(getStatusText(game.Status));
        $('#game-attacker').text(game.AttackerName);
        $('#game-defender').text(game.DefenderName);

        // set up the game if the game is not setup 
        if (appClientState.serverGameId == "") {
            setupLocalGame(game);
            appClientState.serverGameId = game.ID;

            setCookie("_nsgid", game.ID);
        }
        else {
            updateLocalGameStatus(game);
        }
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
            console.log("%s - Game Added: ", new Date().toLocaleTimeString());
            console.log(gameInfo);
        }
        $('#games-list').append("<a href='#' class='list-group-item list-group-item-warning' id='" + gameInfo.ID + "'> ID: " + gameInfo.ID + " - Status: " + getStatusText(gameInfo.Status) + " - Attacker: " + gameInfo.AttackerName + " - Defender: " + gameInfo.DefenderName + " </a>");

        $('#' + gameInfo.ID).on('click', gameInfo, onGameSelected);       
    };

    // handle when the game is selected by a player. All people will receive a this message
    // we do not all player to reset their game if a spectator just joins the game
    gamesHubProxy.client.gameJoined = function (gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null)
        {
            console.log("%s - gameJoined - Invalid Game passed : ", new Date().toLocaleTimeString());
            return;
        }

        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Joined: ", new Date().toLocaleTimeString());
            console.log(gameInfo);
        }
 
        $('#' + gameInfo.ID).addClass(getStatusCss(gameInfo.Status));     
      
        updateLocalGameStatus(gameInfo);
      
    };

    function setupLocalGame(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - setupLocalGame - Invalid game passed : ", new Date().toLocaleTimeString());
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
    }

    function updateLocalGameStatus(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - setupLocalGame - Invalid game passed : ", new Date().toLocaleTimeString());
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
        console.log("%s - Game Deleted: ", new Date().toLocaleTimeString());
        console.log(gameInfo);
    };

    /**
     * Refreshes the list of games from the server for display in the homee page
     */
    function refreshGames() {
        $('#message').html("<div class='alert alert-info'>Refreshing games from the server...</div>")

        $('#games-list').empty();
        gamesHubProxy.server.getGames().done(function (games) {
            $.each(games, function () {
               // if (this.Status == 0 || this.Status = 1)
                $('#games-list').append("<a href='#' class='list-group-item' id='" + this.ID + "'> ID: " + this.ID + " - Status: " + getStatusText(this.Status) + " - Attacker: " + this.AttackerName + " - Defender: " + this.DefenderName + " </a>");

                $('#' + this.ID).on('click', this, onGameSelected);
                $('#' + this.ID).addClass(getStatusCss(this.Status));             
            });

            $('#message').html("<div class='alert alert-info'>Done refreshing games from the server.</div>")
        });
    }
    // reefresh games from server
    $('#games-link').on('click', refreshGames);
    function onGameSelected(e) {
        if (loggingOn === true) {
            console.log("%s - onGameSelected: ", new Date().toLocaleTimeString());
            console.log(e);
        }
        var data = e.data;
        ///todo: add check for the type here
        if (e.data == null || typeof e.data === undefined) {
            console.log("%s - onGameSelected - invalid data passed with the entry ", new Date().toLocaleTimeString());
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
        // update the game view with the given game
    }

    $('#connections-link').on('click', refreshConnections);
    function refreshConnections() {
        $('#system-message').html("<div class='alert alert-info'>Refreshing connections from the server...</div>");
        $('#connections-list').empty();
        var result = nsApiClient.appService.getConnections({ "active": null }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>returned connections successfully. </div>");
                $('#connections-list').html("<div class='panel panel-danger'>  " + JSON.stringify(data) + "  </div>");
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

                $('#connections-list').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive connections from the server. Errors: " + status.responseText + " </div>");
                $('#connections-list').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }
    $('#players-link').on('click', refreshPlayers);
    function refreshPlayers() {
        $('#system-message').html("<div class='alert alert-info'>Refreshing players from the server...</div>");

        $('#players-list').empty();

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
                $('#players-list').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive connections from the server. Errors: " + status.responseText + " </div>");
                $('#players-list').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
     }

    
    /**
   * handler for the Post message request
   */
    function onPostMessage() {
        if (loggingOn === true) {
            console.log("%s - onPostMessage: ", new Date().toLocaleTimeString());
            console.log(gameInfo);
        }
    }

    // base hub messages
    gamesHubProxy.client.joined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('server: connection %s joined on %s ', connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server connected " + connectionInfo.ID + "</li>");
        }
    };
    gamesHubProxy.client.left = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('server: connection %s left on %s ', connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server disconnected " + connectionInfo.ID + "</li>");
        }
    };
    gamesHubProxy.client.rejoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('server: connection %s rejoined on %s ', connectionInfo.ID, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server rejoined " + connectionInfo.ID + "</li>");
        }
    };
    gamesHubProxy.client.pong = function (connectionId, serverTime) {

        if (connectionId !== $.connection.hub.id) {
            console.log('server: INVALID pong from %s received on: %s', connectionId, JSON.stringify(serverTime));
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> server: INVALID pong from " + connectionId + " received on:" + new Date().toLocaleTimeString() + " - server time " + serverTime + "</li>");
        }
        else {
            // check if equal to self
            console.log('server: pong from %s received on: %s', connectionId, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + " pong received from " + connectionId + "</li>");
        }
    };

    function startSignalR() {
        $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
            .done(function () {
                gamesHubProxy.server.hello();
                if (loggingOn === true)
                    console.log('%s connected, connection ID: %', new Date().toLocaleTimeString(), $.connection.hub.id);

                appClientState.serverConnectionId = $.connection.hub.id;

                // 
                checkSessionCookie();

                // setup the games
                setupGames();

                // check local active game cookie
                var gid = checkGameCookie();
                if (gid != "")
                    // tell the server to rejoin this connection with the game
                    gamesHubProxy.server.reJoinGame(appClientState.userScreenName, gid);
            
            })
            .fail(function () { console.log('Could not Connect!'); });
    }

    $.connection.hub.disconnected(function () {
        setTimeout(function () {
            startSignalR();
        }, 2000); // Restart connection after 5 seconds.
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
   

    // handler for resizing
    $(window).resize(board.resize);

 
    setupFormsValidation();

    // automatic login if using coockies 
    checkSessionCookie();



}; // end init()
$(document).ready(init);