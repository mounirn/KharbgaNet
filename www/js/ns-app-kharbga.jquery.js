/* Requires to be included before this:
 * - ns-api-client.js  - nsApiClient is already created
 * - ms-app-utils.js
 * - include in html file with the following elements: 
 *   - message: status message div
 *   - appInfo: app Info debugging area/div
 *   - login-form: login form
 *   - register-form: register form
 */

// The app client state
var appClientState = {
    sessionId: "",
    sessionLastAccessTime: new Date(),
    userScreenName: "",
    serverGameId: "",
    serverConnectionId: "",
    serverOpponentConnectionId: "",
    role: 0,      //  unknown, attacker, defender, spectator
    loggedIn: false,
    player: null,  // server object
    serverGame: null,  // from server
    opponentPlayer: null,  // server object
    loaded: false,
    firstComputerSetting: true,
    computer_is_playing: false,
    selectedSource: "",
    signalRinitalized: false,
    activeGame: false,
    lastReplayPosition: -1,
    useServer: false  // turn on when wanting to store the data and interact with the server

};

/**
* Sets up the client state with the given session
* @param {any} session - the user session object
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
};


/**
    * Handler for login click from UI
    * @param {any} e the link event
    */
function onLoginLink(e) {
    e.preventDefault();

    $('#main-tabs a[href="#account"]').tab('show');

    $('#login-panel').show().removeClass('hidden');
    $('#register-panel').hide().addClass('hidden');
}
/**
 * Handler for register click from UI
 * @param {any} e - the link event
 */
function onRegisterLink(e) {
    e.preventDefault();

    $('#main-tabs a[href="#account"]').tab('show');

    $('#login-panel').hide().addClass('hidden');;
    $('#register-panel').show().removeClass('hidden');

}


/*
 * handler for login request 
 * @param {any} e the event details
 * @returns {any} 
 */
function onLoginSubmit(e) {
    e.preventDefault();
    var form = $('#login-form');

    // check if the form is valid
    if (!form.valid()) {
        $('#message').html("<div class='alert alert-danger'>Please fix the input errors below.</div>");
        return false;
    }

    var loginInfo = {
        LoginID: $('#login-id').val(),
        Password: $('#login-pwd').val(),
        RememberMe: $('#login-remember').is(':checked')
    };
    $('#message').html("<div class='alert alert-info'>Processing... </div>");

    var result = nsApiClient.userService.validateLogin(loginInfo, function (data, status) {
        if (data != null) {
            $('#appInfo').html(JSON.stringify(data));
            $('#message').html("<div class='alert alert-success'>Logged in successfully </div>");
            setupClientStateWithSession(data.object);
            setupMyAccount();
            // check the last game 
            rejoinLastGameIfAny();
        }
        else {
            setupClientStateWithSession(null);
            setupMyAccount();
            if (status.status === 404 || status.status === 400)
                $('#message').html("<div class='alert alert-danger'>Invalid Login ID or password</div>");
            else
                $('#message').html("<div class='alert alert-danger'> Failed to login</div>");

            $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
        }
    });
}

/*
 * handler for register request 
 * @param {any} e
 */
function onRegisterSubmit(e) {
    e.preventDefault();
    var form = $('#register-form');

    // check if the form is valid
    if (!form.valid()) {
        $('#message').html("<div class='alert alert-danger'>Please fix the input errors below.</div>");
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
    $('#message').html("<div class='alert alert-info'>Processing... </div>");

    var result = nsApiClient.userService.register(registerInfo, function (data, status) {
        if (data != null) {
            $('#appInfo').html(JSON.stringify(data));
            $('#message').html("<div class='alert alert-success'>Registered new account successfully. </div>");

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
                $('#message').html("<div class='alert alert-danger'>Invalid registration info. Errors: " + status.responseText + " </div>");
            else
                $('#message').html("<div class='alert alert-danger'> Failed to register.</div>");

            $('#appInfo').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
        }
    });
}

/*
* handler for logout request
* @param {any} e
*/
function onLogoutSubmit(e) {
    e.preventDefault();
    $('#message').html("<div class='alert alert-info'>Processing... </div>");
    // add call for back-end to delete the session
    nsApiClient.userService.logout(appClientState.sessionId, function (data, status) {
        if (data != null) {
            $('#appInfo').html(JSON.stringify(data));
            $('#message').html("<div class='alert alert-success'>Logged out successfully </div>");

            setupClientStateWithSession(null);
            setupMyAccount();
        }
        else {
            setupClientStateWithSession(null); e;
            setupMyAccount();

            $('#message').html("<div class='alert alert-danger'>Failed to logout.  </div>");
            $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
        }
    });
    appClientState.loggedIn = false;

    setupMyAccount();

}
/*
 * handler for refresh app info request
 * @param {any} e
 */
function onRefreshAppInfo(e) {
    e.preventDefault();
    nsApiClient.appService.getAppInfo(function (data, status) {
        if (data != null) {
            $('#message').html("<div class='alert alert-info'>" + JSON.stringify(status) + "</div>");
            $('#appInfo').html(JSON.stringify(data));
        }
        else {
            $('#message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
            $('#appInfo').html('');
        }
    });

}

/**
    * checks a given session with the backed and update 
    * @param {any} sessionId the session id
    */
function checkSession(sessionId) {
    $('#message').html("<div class='alert alert-info'>Processing... </div>");
    var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
        if (data != null) {
            $('#appInfo').html(JSON.stringify(data));
            $('#message').html("");

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
        $('#account-game-role').text(appClientState.player.IsSpectator ? "Spectator" : (appClientState.player.IsAttacker ? "Attacker" : "Defender"));
    }
    else {
        $('#account-game-role').text("");
    }
}

function setupFormsValidation() {
    $('#login-form').validate();
    $('#register-form').validate();
}

function setupTeamsHtml5Combobox() {
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
                    url: teamsUrl,
                    type: "get"
                }
            }
        }
    }).data("kendoComboBox");
}

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

$('#players-link').on('click', refreshPlayers);


/*
 * Returns the list of active players (cached) from the server
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
/*
 * Returns the list of active games (cached) by the server
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
                html += ("<td>" + this.AttackerName + "</td>");
                html += ("<td>" + (this.DefenderName) + "</td>");
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


/**
 * selects the given game in the list
 * @param {any} gameId - the game id
 */
function selectActiveGameId(gameId) {
    $('.selected-game').removeClass('selected-game');
    $('#' + gameId).addClass('selected-game');
    $('#' + gameId).css('fontWeight', 'bold');
    $('#' + gameId).css('PaddingLeft', '10px');
}


/**
* Adds a game to the list
* @param {any} gameInfo the game server info
*/
function appendGameToGamesList(gameInfo) {
    if (gameInfo === null)
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
* Updates the item status in the games list
* @param {any} gameInfo - the game info from the server
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
    html += ((move.IsAttacker == true ? " (Attacker)" : " (Defender)") + "</td>");
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
 * @param {any} serverGame - the server game
 */
function setupGameMovesHistoryList(serverGame) {

    if (serverGame === null) {
        $('#message').html("<div class='alert alert-danger'>Invalid server game </div>");
    }
    $('#game-moves-history').empty();

    var html = "<ul class='list-group' id='game-moves-history-list' style='max-height:300px; overflow-y:scroll'>";
    html += "</ul>";
    $('#game-moves-history').html(html);

    $.each(serverGame.Moves, function (i, v) {
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
    html += ((move.IsSetting == true ? "Set" : "Move") + ": ");
    html += (move.From + " to ");
    html += move.To;
    if (move.Resigned == true)
        html += " - Resigned";
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
        html += (" - Captured: " + move.Captured);

    if (move.Exchanged != "")
        html += (" - Exchanged: " + move.Exchanged);

    if (move.Message != "")
        html += (" - Message: " + move.Message);

    //  html += "</pre>";
    html += "</li>";

    $('#game-moves-history-list').append(html);
}



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


/**
 * checks the stored user session id
 */
function checkSessionCookie() {
    var cookie = getCookie(C_NSSID);
    if (typeof cookie === "string" && cookie.length > 10)
        checkSession(cookie);
}

/*
* Checks the stored active game id 
*/
function getLastGameCookie() {
    var cookie = getCookie("_nsgid");
    if (typeof cookie === "string" && cookie.length > 10)
        return cookie;
    return "";
}


// setup all the various buttons and links events
$('#login-link').on('click', onLoginLink);
$('#register-link').on('click', onRegisterLink);
$('#login-submit').on('click', onLoginSubmit);
$('#register-submit').on('click', onRegisterSubmit);
$('#logout-link').on('click', onLogoutSubmit);
$('#refreshAppInfo-submit').on('click', onRefreshAppInfo);

