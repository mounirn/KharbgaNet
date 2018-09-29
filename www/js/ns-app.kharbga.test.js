/* Kharbga App Object */
var TestKharbgaApp = function () {
   
    // signalR communications
    var gamesHubProxy = null;


  
    function onSendMessage(name, message) {
        console.log("%s - onSendMessage from %s: %", getLoggingNow(), name, message);
    }

    /**
     * Handler for login click from UI
     * @param {any} e
     */
    function onLoginLink(e) {
        e.preventDefault();

        $('#main-tabs a[href="#account"]').tab('show');      

        $('#login-panel').show().removeClass('hidden');
        $('#register-panel').hide().addClass('hidden');
    }
    /**
     * Handler for register click from UI
     * @param {any} e
     */
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
                setupClientStateWithSession(data.object);           
                setupMyAccount();
                // check the last game 
                rejoinLastGameIfAny();
            }
            else {
                setupClientStateWithSession(null);
                setupMyAccount();            
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
                    setupClientStateWithSession(data.session);      
                }
                else {
                    setupClientStateWithSession(null);
                }
                setupMyAccount();

                rejoinLastGameIfAny();
            }
            else {
                setupClientStateWithSession(null);
              //  setupMyAccount();
               
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
        // add call for back-end to delete the session
        nsApiClient.userService.logout(appClientState.sessionId, function (data,status) {
            if (data != null ) {
                $('#appInfo').html(JSON.stringify(data));
                $('#account-message').html("<div class='alert alert-success'>Logged out successfully </div>");
               
                setupClientStateWithSession(null);
                setupMyAccount();
            }
            else {
                setupClientStateWithSession(null);e;
                setupMyAccount();
      
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
     * checks the stored user session id
     */
    function checkSessionCookie() {
        var cookie = getCookie(C_NSSID);
        if (typeof cookie === "string" && cookie.length > 10)
            checkSession(cookie);       
    }

    /**
    * checks the stored active game id 
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
        $('#main-message').html("<div class='alert alert-info'>Processing... </div>");
        var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                $('#main-message').html("");

                var session = data.object;

                if (session != null) {
                    setupClientStateWithSession(session);
                 //   rejoinLastGameIfAny();
                }
                else {
                    setupClientStateWithSession(null);
                }
                setupMyAccount();

                // rejoin the game
               //
            }
            else {
               // setCookie(C_NSSID, "");
                appClientState.loggedIn = false;
                setupMyAccount();
                appClientState.sessionId = "";
                appClientState.userScreenName = "";


                if (status.status === 404 || status.status === 400)
                    $('#main-message').html("<div class='alert alert-danger'>Invalid Session</div>");
                else
                    $('#main-message').html("<div class='alert alert-danger'> Failed to access the system</div>");

                $('#main-message').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
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

        if (!appClientState.signalRinitalized)
            return;
       
        // check local active game cookie
        var gid = getLastGameCookie();
        setupGames(gid);

        if (gid != "" && gamesHubProxy != null && appClientState.signalRinitalized) {

        //    gamesHubProxy.server.reJoinGame(appClientState.userScreenName, gid, false);
            // tell the server to rejoin this connection with the game
            gamesHubProxy.server.joinGame(appClientState.userScreenName, gid, false);
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
    $('#new-game').on('click', { asAttacker: true, againstComputer: false }, onNewGame);
    $('#new-game-attacker').on('click', {asAttacker: true, againstComputer:false}, onNewGame);
    $('#new-game-defender').on('click', { asAttacker: false, againstComputer: false },onNewGame);
    $('#new-game-attacker-system').on('click', { asAttacker: true, againstComputer: true }, onNewGame);
    $('#new-game-defender-system').on('click', { asAttacker: false, againstComputer: true}, onNewGame);
    $('#postMessageBtn').on('click', onPostMessage);
    $('#loadSetting1Btn').on('click', onLoadSetting1);
    $('#flipOrientation').on('click', this.flipBoard);// flip the board
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
        if (lastMoveId == serverMove.ClientID) {
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
        $('#gameMove').html(serverMove.From + " - " + serverMove.To);
        $('#move-captured').html(serverMove.Captured);
        $('#move-exchanged').html(serverMove.Exchanged);
    }

    /**
     * sets up the local player info 
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
     * called back when a game is created to the Caller of the started game
     * called back when a game is joined to the Joiner of the game (including spectator)
    */

    // game created
    // all clients get this message with this game info
    
    var onGameCreated = function (status, error, gameInfo, playerInfo) {
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

    /**
     * Updates the item status in the games list
     * @param {any} gameInfo
     */
    function updateGameInGameList(gameInfo) {
        $('#' + gameInfo.id).remove();
    //    appendGameToGamesList(gameInfo)

        // update the color of the list depending on the status
        $('#' + gameInfo.id).removeClass('list-group-item-warning');
        $('#' + gameInfo.id).removeClass('list-group-item-info');
        $('#' + gameInfo.id).removeClass('list-group-item-danger');
        $('#' + gameInfo.id).removeClass('list-group-item-success');
        $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));  

        // update the player names
       // game.setPlayerNames(gameInfo.AttackerName, gameInfo.DefenderName);

        $('#status-' + gameInfo.id).html(getStatusText(gameInfo.Status));
        if (gameInfo.DefenderName != "")
            $('#linkd-' + gameInfo.id).replaceWith(gameInfo.DefenderName);

        if (gameInfo.AttackerName != "")
            $('#linka-' + gameInfo.id).replaceWith(gameInfo.AttackerName);
        // update the text on the button to mention Replay when the game is completed
    }

    /**
     * Adds a game to the list
     * @param {any} gameInfo
     */
    function appendGameToGamesList(gameInfo) {
        if (gameInfo == null)
            return;

        $('#' + gameInfo.id).detach();

        var html = "<li id='" + gameInfo.id + " ' class='list-group-item ";

        // add the class of the item
        html += getStatusCss(gameInfo.Status);
        html += "'>";
     //   html += "ID: " + gameInfo.id + "<br>";
        if (gameInfo.AttackerName == "") {
             html += "<a href='' id='linka-" + gameInfo.id + "' class=''><strong>Play</strong></a>";
        }
        else {
            html += gameInfo.AttackerName;
        }
        html += " vs. ";
        if (gameInfo.DefenderName == "") {
            html += "<a href='' id='linkd-" + gameInfo.id + "' class='' ><strong>Play</strong></a>";
        }
        else {
            html += gameInfo.DefenderName;
        }
        html += " (<span id='status-" + gameInfo.id + "'>" + getStatusText(gameInfo.Status) + "</span>)";
        html += "<br><button id='watch-" + gameInfo.id + "' class='btn btn-default'>Join / Watch</button";
        html += "</li>";

        $('#games-list').append(html);

        $('#linka-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#linkd-' + gameInfo.id).on('click', gameInfo, onGameSelected);
        $('#watch-' + gameInfo.id).on('click', gameInfo, onGameSelected);
     //   $('#' + gameInfo.id).addClass(getStatusCss(gameInfo.Status));          
    }

    /**
     * selects the given game in the list
     * @param {any} gameId
     */
    function selectActiveGameId(gameId) {
        $('.selected-game').removeClass('selected-game');
        $('#' + gameId).addClass('selected-game');
        $('#' + gameId).css('fontWeight', 'bold');
        $('#' + gameId).css('PaddingLeft', '10px');
    }

    /**
     * Refreshes the list of games from the server for display in the home page
     */
    function _refreshGames(e) {
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
    $('#games-link').on('click', _refreshGames);

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


    $('#connections-link').on('click', refreshConnections);
    function refreshConnections(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing connections from the server...</div>");
        $('#connections-table').empty();
        var result = nsApiClient.appService.getConnections({ "active": null }, function (data, status) {
            if (data != null) {
                $('#system-message').html("<div class='alert alert-success'>returned connections successfully. </div>");
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
                    html += ("<td>" + this.id + "</td>");
                    html += ("<td>" + this.UserName + "</td>");
                    html += ("<td>" + (this.Connected ? "Yes" : "No") + "</td>");
                    html += ("<td>" + this.CreatedOn + "</td>");
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
     */
    function refreshPlayers(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-info'>Refreshing players from the server...</div>");

        $('#players-table').empty();

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
                    html += ("<td>" + (this.CurrentConnection != null ? this.CurrentConnection.id : "") + "</td>");
                    html += "</tr>";

                });

                html += "</tbody></table>";
                $('#players-table').html(html);
            }
            else {
                $('#system-message').html("<div class='alert alert-danger'>Failed to retreive connections from the server. Errors: " + status.responseText + " </div>");
                $('#players-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
     }

    $('#system-games-link').on('click', refreshGames2);
    /**
     * returns the list of active games (cached) by the server
     */
    function refreshGames2(e) {
        e.preventDefault();
        $('#system-message').html("<div class='alert alert-waring'>Refreshing active games from the server...</div>");
        $('#games-table').empty().html('');

        var result = nsApiClient.appService.getGames({ "active": null }, function (data, status) {
            if (data != null) {
                var html = "<table class='table table-responsive'><thead>";
                var first = true;
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
                    html += ("<td>" + this.id + "</td>");
                    html += ("<td>" + this.AttackerName  + "</td>");
                    html += ("<td>" + (this.DefenderName ) + "</td>");
                    html += ("<td>" + getStatusText(this.Status) + "</td>");
                    html += ("<td>" + Kharbga.GameState[this.State] + "</td>");
                    html += ("<td>" + this.FEN + "</td>");
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

    function setupGameMovesHistory(serverGame) {

        if (serverGame == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game </div>");
        }
        $('#game-moves-history').empty();

        var html = "<table  class='table table-responsive'><thead>";
        // append the header
        html += "<thead ><tr>";
        html += ("<th>Number</th>");
        html += ("<th>Player</th>");
        html += ("<th>Is Setting</th>");
        html += ("<th>From</th>");
        html += ("<th>To</th>");
        html += ("<th>Resigned</th>");
        html += ("<th>Exchange Request</th>");
   //     html += ("<th>Before FEN <br>");
   //     html += ("After FEN <br>");
   //     html += ("Message</th>");
        html += "</tr></thead><tbody id='game-moves-history-table'  style='max- height:300px; overflow - y:scroll'>";
       
        $.each(serverGame.Moves, function () {
            html += "<tr>";
            html += ("<td>" + this.Number + "</td>");
            html += ("<td>" + this.PlayerName);
            html += ((this.IsAttacker == true ? " (Attacker)" : " (Defender)") + "</td>");
            html += ("<td>" + (this.IsSetting == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.From) + "</td>");
            html += ("<td>" + (this.To) + "</td>");
            html += ("<td>" + (this.Resigned == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.ExchangeRequest == true ? "Yes" : "No") + "</td>");
            html += "</tr><tr><td><td>"

            // add another row for the message and fen
            html += ("<td colspan='5'><pre style='font-size:x-small'>Before FEN: " + (this.BeforeFEN) + "<br>");
            html += ("After FEN: " + (this.AfterFEN) + "<br>");
         //   html += ("Captured/Exchanged: " + (this.CapturedExchanged) + "<br>");
            html += ("Message: " + (this.Message) + "</pre></td>");
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
        html += ("<td>" + move.PlayerName);
        html += ( (move.IsAttacker == true ? " (Attacker)" : " (Defender)") + "</td>");
        html += ("<td>" + (move.IsSetting == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.From) + "</td>");
        html += ("<td>" + (move.To) + "</td>");
        html += ("<td>" + (move.Resigned == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.ExchangeRequest == true ? "Yes" : "No") + "</td>");
    //    html += ("<td> <pre style='font-size:xx-small'>" + (move.BeforeFEN) + "<br>");
   //     html += ("" + (move.AfterFEN) + "<br>");
    //    html += ("" + (move.Message) + "<pre></td>");
    //    html += "</tr>";
        html += "</tr><tr><td><td>"

        // add another row for the message and fen
        html += ("<td colspan='5'><pre style='font-size:x-small'> Before FEN: " + (move.BeforeFEN) + "<br>");
        html += ("After FEN: " + (move.AfterFEN) + "<br>");
      //  html += ("Captured/Exchanged: " + (move.CapturedExchanged) + "<br>");
        html += ("Message: " + (move.Message) + "</pre></td>");

        html += "</tr>";

        $('#game-moves-history-table').append(html);
    }

    /**
     * Sets up the game moves history list with a server game
     * @param {any} serverGame
     */
    function setupGameMovesHistoryList(serverGame) {

        if (serverGame == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game </div>");
        }
        $('#game-moves-history').empty();

        var html =  "<ul class='list-group' id='game-moves-history-list' style='max-height:300px; overflow-y:scroll'>";
        html += "</ul>";
        $('#game-moves-history').html(html);

        $.each(serverGame.Moves, function (i,v) {
            appendMoveToGameHisotryList(v);
        });
    }
       

    /**
     * Appends the given move to the game history
     * @param {any} move - move information from the server
     */
    function appendMoveToGameHisotryList(move) {

        if (move == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game move </div>");
        }
        var html = "";
        html += "<li class='list-group-item'>";
        html += ("<strong>" + move.Number + ". </strong>");
        html += ("" + move.PlayerName);
        html += ((move.IsAttacker == true ? " (Attacker)" : " (Defender)") + " - ");
        html += ( (move.IsSetting == true ? "Set" : "Move") + ": ");
        html += (move.From + " to ");
        html += move.To ;
        if (move.Resigned == true)
            html +=  " - Resigned";
        if (move.ExchangeRequest == true) {
            if (move.IsAttacker)
                html += " - Exchange Request Accepted";
            else
                html += " - Exchange Request";
        }
     //   html += "<br>";

        // add another row for the message and fen
     //   html += ("<pre style='font-size:small'>FEN Before & After: " + (move.BeforeFEN) + " - ");
     //   html += ((move.AfterFEN) );
        if (move.Captured != "")
            html += ( " - Captured: " + move.Captured);

        if (move.Exchanged != "")
            html += (" - Exchanged: " + move.Exchanged );

        if (move.Message != "")
            html += (" - Message: " + move.Message);

      //  html += "</pre>";
           html += "</li>";

        $('#game-moves-history-list').append(html);
    }

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
        $('#messages-list').append("<li class='list-group-item'><strong>" + getLoggingNow() + " - " + user.Name + ":</strong> <pre> " + message+ " </pre></li>");

    }
    var onGameStateUpdated = function (satus, message, game, player){
        if (loggingOn)
            console.log('%s - server: onGameStatusUpdated - game: %s: %s', getLoggingNow(), game.id);


        updateLocalGameStatus(game);
    }
  
   // startSignalR();
  
    function saveGame() {
     //   if (appClientState.userScreenName == game.winner.Name) { // winner gets this honor
            gamesHubProxy.server.updateGameState(appClientState.userScreenName, appClientState.serverGame.id,
                game.getState(), game.winner.IsAttacker(), game.attackerScore, game.defenderScore);
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
            appClientState.userScreenName = session.fullName;
            appClientState.loggedIn = session.isActive;
            setCookie(C_NSSID, appClientState.sessionId);
        }
        else {
            appClientState.session = null;
            appClientState.sessionId = "";
            appClientState.userScreenName = "";
            appClientState.loggedIn = false;
            setCookie(C_NSSID, "");
        }

    }

    /**
     * Helper function for setting cookie
     * @param {any} key
     * @param {any} value
     */
    function setCookie(key, value) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
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
        $('#state').html(Kharbga.GameState[game.getState()]);
      //  $('#message').html("<div class='alert alert-success'>Click on the New Game button to start a new game on this computer.</div>")

       // setupTeamsComboBox();

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

    function updateBoardInfo(){
        if (game.is_in_setting_state() === true)
            boardEl.find('.square-d4').addClass('highlight-malha');
        else
            boardEl.find('.square-d4').removeClass('highlight-malha');

        if (appClientState.serverGame != null) {
            if (appClientState.serverGame.AttackerName == appClientState.userScreenName )
                $('#game-attacker').text(appClientState.serverGame.AttackerName + " (me)" );
            else
                $('#game-attacker').text(appClientState.serverGame.AttackerName);

            if (appClientState.serverGame.DefenderName == appClientState.userScreenName)
                $('#game-defender').text(appClientState.serverGame.DefenderName + " (me)" );
            else
                $('#game-defender').text(appClientState.serverGame.DefenderName );
        }
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


    this.getCurrentGame = function () {
        // 
        return appClientState.serverGame;
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
        if (!move.ExchangeRequest)
            boardEl.find('.highlight-exchange').removeClass('highlight-exchange');

        if (move.IsSetting) {
            boardEl.find('.square-d4').removeClass('highlight-malha');
            boardEl.find('.square-d4').addClass('highlight-malha');
            if (highlightMove === true)
                boardEl.find('.square-' + move.To).addClass('highlight-move');
        }
        else {
            boardEl.find('.square-d4').removeClass('highlight-malha');
            if (highlightMove === true) {
                boardEl.find('.square-' + move.From).addClass('highlight-move');
                if (!move.ExchangeRequest)
                    boardEl.find('.square-' + move.To).addClass('highlight-move');
                else
                    boardEl.find('.square-' + move.To).addClass('highlight-exchange');

                var capturedCells = move.Captured.split(' ');

                if (capturedCells != null) {
                    $.each(capturedCells, function (item, value) {
                        boardEl.find('.square-' + value).addClass('highlight-captured');
                    });
                }

                var exchangedCells = move.Exchanged.split(' ');

                if (exchangedCells != null) {
                    $.each(exchangedCells, function (item, value) {
                        boardEl.find('.square-' + value).addClass('highlight-exchange');
                    });
                }
            }
        }
    
        $('#play-move-player').html(move.PlayerName + " (" + (move.IsAttacker ? "Attacker": "Defender") + ")");
        $('#play-move-number').html(move.Number + " of " + appClientState.serverGame.Moves.length);
 

        var html = "";
        if (move.IsSetting) {
            html += "Set: " + move.To; 
        }else {
            html += "Move: " + move.From + "-" + move.To; 
        }
        if (move.ExchangeRequest) {
            if (move.IsAttacker)
                html += " - Exchange request Accepted";
            else
                html += " - Exchange request";
        }

        if (move.Captured != "") {
            html += " - Captured: " + move.Captured;
        }

        if (move.Exchanged != "") {
            html += " - Exchanged: " + move.Exchanged;
        }
        if (move.Resigned) {
            if (move.IsAttacker)
                html += " - Attacker Resigned";
            else
                html +=" - Defender Resigned" ;
        }

        $('#play-move-info').html(html);
        playSound();
       
    };

    this.playBegining = function () {
        console.log("playBegining");
        if (appClientState.serverGame == null)
            return;

    //    if (appClientState.serverGame.Status != 3)
    //        return;
       
        // we now have a completed game
        console.log("playBegining - status: %s - Last replay Position: %s",
            appClientState.serverGame.Status, appClientState.lastReplayPosition);

        var lastSettingPos = 48;
        if (appClientState.lastReplayPosition > lastSettingPos)
            appClientState.lastReplayPosition = lastSettingPos;
        else
            appClientState.lastReplayPosition = 0;


        board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].BeforeFEN, true);

        updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition], true);
        boardEl.find('.highlight-move').removeClass('highlight-move');

    };
    this.playBackward = function () {
        console.log("playBackward");
        if (appClientState.serverGame == null)
            return;

    //    if (appClientState.serverGame.Status != 3)
    //        return;
        if (appClientState.serverGame.Moves.length == 0)
            return;

        console.log("playBackward - status: %s", appClientState.serverGame.Status);

        appClientState.lastReplayPosition--;
        if (appClientState.lastReplayPosition < 0) {
            appClientState.lastReplayPosition = 0;
            board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].BeforeFEN, true);
            updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition],false);
            return;
        }
        board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].AfterFEN, true);
        updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition],true);

    };
    var replayId = "";
    var replayOn = false;
    this.playStart = function () {
        console.log("playStart");
        if (appClientState.serverGame == null)
            return;

         if (appClientState.serverGame.Status != 3)
              return;

        if (appClientState.serverGame.Moves == null)
            return;

        console.log("playStart - status: %s", appClientState.serverGame.Status);

        if (appClientState.lastReplayPosition < 0)
            appClientState.lastReplayPosition = 0;

        if (appClientState.serverGame.Moves.length == 0) {
            // message
            return;
        }

        if (replayOn)
            return;

        board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].AfterFEN, true);
        updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition], true);
        $('#play-start').attr('class', 'disabled');
        $('#play-pause').attr('class', 'enabled');

        replayId = setInterval(function (playForward) {
            playForward();
        }, 3000, this.playForward);   // add option for replay speed
        replayOn = true;
    };
    this.playPause = function () {
        console.log("playPause");
        if (appClientState.serverGame == null)
            return;

        if (appClientState.serverGame.Status != 3)
            return;

        console.log("playPause - status: %s", appClientState.serverGame.Status);

        clearInterval(replayId);
        replayOn = false;
        $('#play-start').attr('class', 'enabled');
        $('#play-pause').attr('class', 'disabled');

    };
    this.playForward = function () {
        console.log("playForward");
        if (appClientState.serverGame == null)
            return;

    //    if (appClientState.serverGame.Status != 3)
     //       return;

        // we now have a completed game
        console.log("playForward - status: %s - Last replay Position: %s",
            appClientState.serverGame.Status, appClientState.lastReplayPosition);

        appClientState.lastReplayPosition++;
        if (appClientState.serverGame.Moves.length <= appClientState.lastReplayPosition) {
            appClientState.lastReplayPosition = appClientState.serverGame.Moves.length - 1;
            board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].AfterFEN, true);
            updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition],false);
            clearInterval(replayId);
            replayOn = false;
            return;
        }
        board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].AfterFEN, true);
        updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition],true);

    };
    this.playEnd = function () {
        console.log("playEnd");
        if (appClientState.serverGame == null)
            return;

    

        // we now have a completed game
        console.log("playEnd - status: %s - Last replay Position: %s",
            appClientState.serverGame.Status, appClientState.lastReplayPosition);

        var lastSettingPos = 47;
        if (appClientState.lastReplayPosition < lastSettingPos)
            appClientState.lastReplayPosition = lastSettingPos;
        else
            appClientState.lastReplayPosition = appClientState.serverGame.Moves.length - 1

        if (appClientState.serverGame.Moves.length > appClientState.lastReplayPosition)
            appClientState.lastReplayPosition = appClientState.serverGame.Moves.length - 1

        board.position(appClientState.serverGame.Moves[appClientState.lastReplayPosition].AfterFEN, true);
        updateBoardWithMove(appClientState.serverGame.Moves[appClientState.lastReplayPosition], true);

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

        var volume = $('#sound-volume').val();
        var volumeNumber = Number.parseFloat(volume);
        sound.muted = false;
        if (volume < 0.2)
            sound.volume = 0.2;
        else
            sound.volume = volumeNumber;
    };

    this.selectGame = function (gameId) {

        if (typeof gameId == 'undefined' || gameId == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid game selected</div>")

            return;
        }

        resetLocalGame();
        if (typeof gamesHubProxy == 'undefined' || gamesHubProxy == null)
        {
            $('#message').html("<div class ='alert alert-danger'>System issue - not connected to server</div>")
            return;        
        }
        //join the game and indicate if spectator or not
        gamesHubProxy.server.joinGame(appClientState.userScreenName, gameId, false);

    };

    var cw;

    function startWorker() {
        if (typeof (Worker) !== "undefined") {
            if (typeof (cw) == "undefined") {
                cw = new Worker("kharbga-computer.js");
            }
            cw.onmessage = function (event) {
                console.log(event.data);
            };
            cw.onerror = function (event) {
                console.log(event.data);
            };
        } else {
            console.log("Sorry! No Web Worker support.");
        }
    }

    function stopWorker() {
        cw.terminate();
        cw = undefined;
    }
}; 
