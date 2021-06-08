
$(document).ready(function() {
    //  $('.combobox').combobox()
    var kApp = new KharbgaApp();
    // kApp.initBoard({
    //     themePath: '../img/theme-simple/{piece}.png'
    // });
    // Change hash for page-reload
    $('.nav-tabs a').on('shown.bs.tab', function(e) {
        window.location.hash = e.target.hash;
    })
    var url = document.location.toString();
    if (url.match('#')) {
        var activeTab = url.substring(url.indexOf("#") + 1);
        // $('.nav-tabs a[href=#' + activeTab + ']').tab('show');
    }
});

//]]>
function viewGame(id) {
    document.location = "../html/play.html?id=" + id;
}


$('#system-games-link').on('click', refreshGames2);
/**
 * Returns the list of active games (cached) by the server
 * @param {any} e - the event
 */
function refreshGames2(e) {
    e.preventDefault();
    $('#system-message').html("<div class='alert alert-waring'>Refreshing active games from the server...</div>");
    $('#games-table').empty().html('');

    var session = nsApp.getSession();
    var result = nsApiClient.gameService.getGames(session.sessionId,{ "active": null }, function (data, status) {
        if (data != null) {
            var html = "<table class='table table-responsive'><thead>";
            var first = true;
            $('#games-count').text(data.length);
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
                html += ("<td> <a id='glink-"+this.id + "' href='javascript:viewGame(\"" + this.id + "\")'>View</a></td>");
                html += ("<td>" + this.attackerName  + "</td>");
                html += ("<td>" + (this.defenderName ) + "</td>");
                html += ("<td>" + Kharbga.GameStatus[this.status] + "</td>");
                html += ("<td>" + Kharbga.GameState[this.state] + "</td>");
                html += ("<td>" + this.fen + "</td>");
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

$('#players-link').on('click', refreshPlayers);
/**
 * returns the list of active players (cached) from the server
 * @param {any} e - the event
 */
function refreshPlayers(e) {
    e.preventDefault();
    $('#system-message').html("<div class='alert alert-info'>Refreshing players from the server...</div>");

    $('#players-table').empty();
    var session = nsApp.getSession();
    var result = nsApiClient.gameService.getPlayers(session.sessionId,{ "active": null }, function (data, status) {
        if (data != null) {
            $('#system-message').html("<div class='alert alert-success'>Returned players successfully. </div>");
            var html = "<table class='table table-responsive'><thead>";
            $('#players-count').text(data.length);
            var first = true;
            $.each(data, function () {
                if (first) {
                    // append the header
                    html += "<thead><tr>";
                    html += ("<th>Name</th>");
                    html += ("<th>Is Spectator</th>");
                    html += ("<th>Is Attacker</th>");
                    html += ("<th>Current Game ID</th>");
                    html += ("<th>Connected</th>");
                    html += ("<th>Current Connection ID</th>");
                    html += "</tr></thead><tbody>";
                    first = false;
                }

                html += "<tr>";
                html += ("<td>" + this.name + "</td>");
                html += ("<td>" + (this.isSpectator === true ? "Yes" : "No") + "</td>");
                html += ("<td>" + (this.isAttacker === true ? "Yes" : "No") + "</td>");
                html += ("<td>" + this.currentGameId + "</td>");
                html += ("<td>" + (this.connected === true ? "Yes" : "No") + "</td>");
                html += ("<td>" + (this.currentConnection != null ? this.currentConnection.id : "") + "</td>");
                html += "</tr>";

            });

            html += "</tbody></table>";
            $('#players-table').html(html);
        }
        else {
            $('#system-message').html("<div class='alert alert-danger'>Failed to retrieve connections from the server. Errors: " + status.responseText + " </div>");
            $('#players-table').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
        }
    });
 }


 
 $('#connections-link').on('click', refreshConnections);
 function refreshConnections(e) {
     e.preventDefault();
     $('#system-message').html("<div class='alert alert-info'>Refreshing active connections from the server...</div>");
     $('#connections-table').empty();
     var session = nsApp.getSession();
     var result = nsApiClient.gameService.getConnections(session.sessionId, { "active": true }, function (data, status) {
         if (data != null) {
             $('#system-message').html("<div class='alert alert-success'>returned connections successfully. </div>");
             var html = "<table class='table table-responsive'><thead>";
             var first = true;
             $('#connections-count').text(data.length);
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
                 html += ("<td>" + this.userName + "</td>");
                 html += ("<td>" + (this.connected ? "Yes" : "No") + "</td>");
                 html += ("<td>" + this.createdOn + "</td>");
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
