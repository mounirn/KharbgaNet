var SignalRApp = function () {
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
  
    function onSendMessage(name, message) {
        console.log("%s - onSendMessage from %s: %", getLoggingNow(), name, message);
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
     * checks a given session with the backed and update 
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

    $('#new-game').on('click', { asAttacker: true, againstComputer: false }, onNewGame);
    $('#new-game-attacker').on('click', {asAttacker: true, againstComputer:false}, onNewGame);
    $('#new-game-defender').on('click', { asAttacker: false, againstComputer: false },onNewGame);
    $('#new-game-attacker-system').on('click', { asAttacker: true, againstComputer: true }, onNewGame);
    $('#new-game-defender-system').on('click', { asAttacker: false, againstComputer: true}, onNewGame);

    $('#postMessageBtn').on('click', onPostMessage);
  
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
     * Refreshes the list of games from the server for display in the home page
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
    this.ping = function () {
        gamesHubProxy.server.ping();  
    };

    $('#ping-link').on('click', function () {
        ping();  
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
     
    setupMyAccount();
    setupFormsValidation();
}; // end initSignalR()

