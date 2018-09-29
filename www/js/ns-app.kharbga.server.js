/* a default game viewer - clients could provide their own verskon*/
var GameViewer = function () {
    this.message = function (msg) {
        $('#message').html("<div class='alert alert-danger'> " + msg + "</div > ");
    };

};

var ClientActions = function () {
    
};

/* Kharbga Server - Encapsulates all SignalR server access functions */
var KharbgaServer = function (gameViwer) {
    // signalR communications
    var gamesHubProxy = null;
    this.gameViewer = gameViewer;
    this.recordMove = function () {

    };

    // provides messaging support functions
    // flag for turning on/off logging 
    var loggingOn = true; 

    /*
     * Starts a new game
     * @param a - the game start options
     * @returns a 
     */
    this.createGame = function (a) {
        if (a === null) {
            return 'Invalid input';
        }

        if (gamesHubProxy === null) {
            return 'Not connected to server';
        }

        // resetLocalGame();
        // call the server to start the new game
        gamesHubProxy.server.createGame(a.userScreenName, a.asAttacker, a.againstComputer)
            .done(function () {
                console.log('%s - Done Server Invocation of create game', getLoggingNow());

            }).fail(function (error) {
                console.log('%s - Invocation of createGame failed. Error: %s', getLoggingNow(), error);
            });
    };

    /*
     * Server client call back
     */
    function onSendMessage(name, message) {
        console.log("%s - onSendMessage from %s: %", getLoggingNow(), name, message);
    }
 
   
    /**
     * rejoins local cached game (after the user refreshes the their browser or logs in again)
     */
    this.rejoinLastGameIfAny = function () {

        if (!appClientState.signalRinitalized)
            return;

        // check local active game cookie
        var gid = getLastGameCookie();
        setupGames(gid);

        if (gid !== "" && gamesHubProxy !== null && appClientState.signalRinitalized) {

            //    gamesHubProxy.server.reJoinGame(appClientState.userScreenName, gid, false);
            // tell the server to rejoin this connection with the game
            gamesHubProxy.server.joinGame(appClientState.userScreenName, gid, false);
        }
    };

   
    /**
     * handle for when a move is recorded
     * @param {any} status -- move status
     * @param {any} errorMessage -- error message if move failed to record
     * @param {any} gameServerInfo -- the server game
     * @param {any} player -- the player making the move
     * @param {any} isAttacker -- indicates if attacker move
     * @param {any} isSetting  -- indicates if setting or move
     * @param {any} moveFrom  -- from location
     * @param {any} moveTo   -- to location
     * @param {any} resigned  -- indicates player resigned
     * @param {any} exchangeRequest -- indicates an exchange request or acceptance
     * @param {any} beforeFEN  -- board state before the move
     * @param {any} afterFEN    -- board state after the move
     * @param {any} message  -- the message posted by the player with the move
     * @param {any} serverMove -- the server move record with/ captured/exchange info
     */
    var onMoveRecorded = function (status, errorMessage, gameServerInfo, player, isAttacker, isSetting, moveFrom, moveTo, resigned,
            exchangeRequest, beforeFEN, afterFEN, message, serverMove) {
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
      
        // check the game and the player
        if (gameServerInfo == null) {
            console.log("%s = server - error recording move - invalid game passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Game </div>");
            return;
        }

        appClientState.serverGame = gameServerInfo; // latest game info (it could get big!)

        if (player == null) {
            console.log("%s - server - error recording move - invalid player passed", getLoggingNow());
            $('#message').html("<div class='alert alert-danger'> Server Record Move - Invalid Player </div>");
            return;
        }

        // if the move is already submitted to the local game (by real player or computer) just add to the Move history and 
        if (lastMoveId === serverMove.ClientID) {
            // append the move to the game history
            appendMoveToGameHisotryList(serverMove);
            console.log("%s - server - did not record setting/move in local game for local moveId: %s", getLoggingNow(), lastMoveId);
            return; 
        }
    
        var ret;
        console.log("%s - server - recording setting/move in local game for server Move ID: %s", getLoggingNow(), serverMove.ClientID);

        if (game.is_in_moving_state()) {
            ret = game.processMove(moveFrom, moveTo, resigned, exchangeRequest);
        }
        else {
            ret = game.processSetting(moveTo);
        }
        updateBoard(game);
        updateLastActionInfo(serverMove);
        if (ret == true)
            playSound();
        else {
            // play error sound
        }

        // append the move to the game history
        appendMoveToGameHisotryList(serverMove);
    }

    /**
     * Sets up the game local player info 
     * @param {any} player -- the player
     * @param {any} serverGame -- the game
     */
    var onSetupLocalPlayer = function setupLocalPlayer(player, serverGame) {
        if (typeof player == "undefined" || player == null) {
            console.log("%s - setCurrentPlayer - Invalid player passed : ", getLoggingNow());
            return;
        }
        appClientState.player = player;
        

       // appClientState.userScreenName = player.Name;

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

        $('#current-game-id').text(serverGame.id);
        $('#current-game-status').text(getStatusText(serverGame.Status));
        $('#game-attacker').text(serverGame.AttackerName);
        $('#game-defender').text(serverGame.DefenderName);

        // set up the game if the game is not setup 
        if (appClientState.serverGameId == "") {
            setupLocalGame(serverGame);
            appClientState.serverGameId = serverGame.id;

            setCookie("_nsgid", serverGame.id);
        }
        else {
            updateLocalGameStatus(serverGame);
        }

        // setup the check boxes based on the player
        if (appClientState.player.IsSpectator) {
            $('#abandonCheckbox').prop('disabled', true);
            $('#exchangeRequestCheckbox').prop('disabled', true);
            $('#exchangeRequestAcceptedCheckbox').prop('disabled', true);
        }
        else {
            if (appClientState.player.IsAttacker) {
                $('#exchangeRequestCheckbox').prop('disabled', true);
                $('#exchangeRequestAcceptedCheckbox').prop('disabled', false);
            }
            else {
                $('#exchangeRequestAcceptedCheckbox').prop('disabled', true);
                $('#exchangeRequestCheckbox').prop('disabled', false);
            }
        }
        // refresh the myAccount info
        setupMyAccount();
    }

    /**
     * Called back when a game is created to the Caller of the started game
     * called back when a game is joined to the Joiner of the game (including spectator)
     *
     */
    var onGameCreated = function (status, error, gameInfo, playerInfo) {
        if (status === false) {
            console.log("%s - error creating game: ", getLoggingNow());
            console.log("%s - error: %s ", getLoggingNow(), error);

            _gameViewer.message('Unable to create game on the server.Please try again later!');
            $('#message').html("<div class='alert alert-danger'>Unable to create game on the server. Please try again later!</div>");
            return;
        }
        // add to the games list
        if (loggingOn === true) {
            console.log("%s - Game Created: ", getLoggingNow());
            console.log(gameInfo);
        }

        // update the game players info
        game.attacker.Name = gameInfo.AttackerName;
        game.defender.Name = gameInfo.DefenderName;

        appendGameToGamesList(gameInfo);
       
        checkBoardAndPlayIfComputer();
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
       // show the panel
      //  $('#currentGamePanel').show();

     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));    

        // update the game players info
        game.setPlayerNames(gameInfo.AttackerName,gameInfo.DefenderName);
      
        updateLocalGameStatus(gameInfo);
        setupGameMovesHistoryList(gameInfo);

        selectActiveGameId(gameInfo.id);
       // 
        checkBoardAndPlayIfComputer();
    };

    var onAppendMove = function (gameId, move) {
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
        var gameState = new Kharbga.ServerGameState(gameInfo.id, gameInfo.CreatedBy, gameInfo.State, gameInfo.Status);
        gameState.Moves.push(gameInfo.Moves);
        gameState.Players.push(gameInfo.Players);        
        game.setupWith(gameInfo);

        clearLastMoveInfo();

        updateBoard(game);

        // player
        if (game.turn() == 'a')
            $('#player-turn').html("Attacker");
        else
            $('#player-turn').html("Defender");


        appClientState.serverGameId = gameInfo.id;
        appClientState.serverGame = gameInfo;

        updateLocalGameStatus(gameInfo);

        // setup the move history
        setupGameMovesHistoryList(gameInfo);

        removeSelectedCells();
    }

    function updateLocalGameStatus(gameInfo) {
        if (typeof gameInfo == "undefined" || gameInfo == null) {
            console.log("%s - updateLocalGameStatus - Invalid game passed : ", getLoggingNow());
            return;
        }  

        // game status 
        $('#current-game-status').text(getStatusText(gameInfo.Status));  
     //   updateGameInGameList(gameInfo);
  
        $('#game-attacker').text(gameInfo.AttackerName);
        $('#game-defender').text(gameInfo.DefenderName);

        $('#game-players').html(gameInfo.AttackerName + " vs. " + gameInfo.DefenderName);
        $('#game-score').html(gameInfo.AttackerScore + "-" + gameInfo.DefenderScore);
        $('#game-result').html(Kharbga.GameState[gameInfo.State]);

        if (gameInfo.WinnerIsAttacker)
            $('#game-winner').html(gameInfo.AttackerName + " (Attacker)");
        else
            $('#game-winner').html(gameInfo.DefenderName + " (Defender)");

        updateGameInGameList(gameInfo);

        // activate the modal dialog here instead of OnWinnerDeclared?
        if (gameInfo.Status > 2)
            setTimeout(function () {
                $('#game-over').modal();
            }, 1000);


       
         
    }

    var onGameDeleted = function (gameInfo) {
        // remove from the games list
        console.log("%s - Game Deleted: ", getLoggingNow());
        console.log(gameInfo);
    };
 

    /*
     * Refreshes the list of games from the server for display in the home page
     */
    this.refreshGames = function(e) {
        if (e != null)
             e.preventDefault();
      //  $('#message').html("<div class='alert alert-info'>Refreshing games from the server...</div>")

        $('#games-list').empty();
        if (loggingOn) {
            console.log("%s - _refreshingGames from the server : ", getLoggingNow());
        }
        gamesHubProxy.server.getGames().done(function (games) {
            $.each(games, function () {
                appendGameToGamesList(this);
            });
            if (loggingOn) {
                console.log("%s - _refreshingGames from the server - selecting active game Id: %s ", getLoggingNow(), appClientState.serverGameId);
            }
            selectActiveGameId(appClientState.serverGameId);
         //   $('#message').html("<div class='alert alert-success'>Done refreshing games from the server.</div>")
        });
    }
    
    // refresh games from server
    $('#games-link').on('click', refreshGames);

    /**
     * Handler for when a game is selected for joining 
     * @param {any} e - the event data
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

        // switch view to the Play/View tab
        $('#main-tabs a[href="#home"]').tab('show');   
        $('#message').html("<div class='alert alert-success'>Game is ready on the server</div>");

     
        $('#message').html("<div class='alert alert-success'>Setting up game state based on server data</div>")
        console.log("Setting up game state based on server data");
   
        var spectator = false;

        resetLocalGame();

        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.userScreenName, data.id, spectator).done(function () {
         // init the local game with the given server game data    
      //   resetLocalGame();  // server will sen
         // update the game view with the given game

                // select the game 
       //    selectActiveGameId(data.id);
        });                

       
    }

    /**
     * Handler for when a game is selected for watching and replaying (learning purpose)
     * @param {any} e - the event data
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


        $('#message').html("<div class='alert alert-success'>Setting up game state based on server data</div>")
        console.log("Setting up game state based on server data");

        var spectator = true;

        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.userScreenName, data.id, spectator);

        // init the local game with the given server game data    
        //  resetLocalGame();  // server will sen
        // update the game view with the given game
    }

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
        if (gamesHubProxy == null)
            setSystemError(true);
        gamesHubProxy.server.ping();
    });


    /**
   * handler for the Post message request
   */
    function onPostMessage() {
        if (loggingOn === true) {
            console.log("%s - onPostMessage: ", getLoggingNow());
            
        }
    }
    // base hub messages
    var onJoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s joined on %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server connected " + connectionInfo.id + "</li>");
        }
    };
    var onLeft = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s left at %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + new Date().toLocaleTimeString() + ": server disconnected " + connectionInfo.id + " - " + connectionInfo.UserName + "</li>");
        }
    };
    var onRejoined = function (connectionInfo, serverTime) {
        if (loggingOn === true) {
            console.log('%s - server: connection %s rejoined on %s ', getLoggingNow(), connectionInfo.id, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + ": server rejoined " + connectionInfo.id + "</li>");
        }
    };
    var onPong = function (connectionId, serverTime) {
        if (connectionId !== $.connection.hub.id) {
            if (loggingOn) console.log('%s - server: INVALID pong from %s received on: %s', getLoggingNow(), connectionId, JSON.stringify(serverTime));
            $('#messages-list').append("<li class='list-group-item list-group-item-danger'> server: INVALID pong from " + connectionId + " received on:" + new Date().toLocaleTimeString() + " - server time " + serverTime + "</li>");
        }
        else {
            // check if equal to self
            if (loggingOn) console.log('%s - server: pong from %s received on: %s', getLoggingNow(), connectionId, serverTime);
            $('#messages-list').append("<li class='list-group-item'>" + getLoggingNow() + " pong received from " + connectionId + "</li>");
        }
    };
    var onMessagePosted = function (user, message) {
        if (loggingOn)
            console.log('%s - server: onMessagePosted from %s: %s', getLoggingNow(), user.Name, message);
        $('#messages-list').append("<li class='list-group-item'><strong>" + getLoggingNow() + " - " + user.Name + ":</strong> <pre> " + message + " </pre></li>");

    };

    var onGameStateUpdated = function (satus, message, game, player) {
        if (loggingOn)
            console.log('%s - server: onGameStatusUpdated - game: %s: %s', getLoggingNow(), game.id);


        updateLocalGameStatus(game);
    };
  
   // startSignalR();
  
    this.saveGame = function (game) {
        //   if (appClientState.userScreenName == game.winner.Name) { // winner gets this honor
        gamesHubProxy.server.updateGameState(appClientState.userScreenName,
            appClientState.serverGame.id,
            game.getState(), game.winner.IsAttacker(), game.attackerScore, game.defenderScore);
        //   }
    };


    ///todo: automatic setup of an active game
    function setupGames(activeGameId) {
        // refresh games from the server
        _refreshGames();

        // set the game state
        $('#state').html(Kharbga.GameState[game.getState()]);
      //  $('#message').html("<div class='alert alert-success'>Click on the New Game button to start a new game on this computer.</div>")

       // setupTeamsComboBox();

        selectActiveGameId(activeGameId);

        setupTeamsHtml5Combobox();
    }

    /**
     * Initalize connections to the server
     */
    this.initServer = function () {
       
        _setupSignalR();
    };

    var _setupSignalR = function () {
        try {
            $.connection.hub.url = nsApiClient.baseURI + 'signalr';
            if (loggingOn) console.log("Hub URL: %s", $.connection.hub.url);
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
                //  $('#message').html("<div class='alert alert-success'>Hello from server.</div>")
                // $('#messages-list').append("<li class='list-group-item'>Hello from server</li>");
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

            return startSignalR();
        }
        catch (e) {
            setSystemError(true);
            console.log(e);
        }

        $.connection.hub.disconnected(function () {
            appClientState.signalRinitalized = false;
            setTimeout(function () {
                if (loggingOn) console.log('%s - RestartSignalR after disconnect!', getLoggingNow());
                startSignalR();
            }, 3000); // Restart connection after 3 seconds.
        });
    };

    _setupSignalR();

    function startSignalR() {
        try {
            $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
                .done(function () {
                    gamesHubProxy.server.hello();
                    if (loggingOn === true)
                        console.log('%s - startSignalR - connected, connection ID: %', getLoggingNow(), $.connection.hub.id);

                    appClientState.serverConnectionId = $.connection.hub.id;
                    appClientState.signalRinitalized = true;
                    // 
                    checkSessionCookie();
                    // moves the setup of the games on startup at the end of the checking session process
                    setSystemError(false);
                })
                .fail(function () {
                    appClientState.signalRinitalized = false;
                    console.log('%s - startSignalR Could not Connect!', getLoggingNow());
                    setSystemError(true);
                });
        }
        catch (e) {
            setSystemError(true);
            console.log(e);
        }
    }

    startSignalR();

    this.setupSignalR = _setupSignalR;

    this.flipBoard = function () {
        if (board == null) {
            $('#message').html("<div class='alert alert-danger'>Game board is not initialized</div>")
            return;
        }
        board.flip();
        updateBoardInfo();       
    };

    this.setSessionId = function (sid) {
        setCookie(C_NSSID, sid);
        if (sid != "")
            checkSessionCookie();  // check it and update state
    }

    // setup the current games and last game if any 
    this.setup = function () {
        rejoinLastGameIfAny();
    };
    
    this.ping = function () {
        if (gamesHubProxy == null) {
            setSystemError(true);
            return;
        }
        gamesHubProxy.server.ping().done(function () { setSystemError(false); });
    };



    this.newGame = function (options) {
        var event = { data: options };
        onNewGame(event); // 
    };


    this.postMessage = function(msg){
        if (gamesHubProxy == null) {
            alert("Unable to connect with server");
            //setSystemError("Unable to connet with signalR hub");
            return;
        }
        gamesHubProxy.server.postMessage(appClientState.userScreenName, msg.message);
    };


    this.selectGame = function (gameId) {

        if (typeof gameId == 'undefined' || gameId == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid game selected</div>")

            return;
        }

        if (typeof gamesHubProxy == 'undefined' || gamesHubProxy == null)
        {
            $('#message').html("<div class ='alert alert-danger'>System issue - not connected to server</div>")
            return;        
        }
        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.userScreenName, gameId, false);

    };

}; 
