  // could be used by v2 - angaulr
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
       
        $.each(serverGame.moves, function () {
            html += "<tr>";
            html += ("<td>" + this.number + "</td>");
            html += ("<td>" + this.playerName);
            html += ((this.isAttacker == true ? " (Attacker)" : " (Defender)") + "</td>");
            html += ("<td>" + (this.isSetting == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.from) + "</td>");
            html += ("<td>" + (this.to) + "</td>");
            html += ("<td>" + (this.resigned == true ? "Yes" : "No") + "</td>");
            html += ("<td>" + (this.exchangeRequest == true ? "Yes" : "No") + "</td>");
            html += "</tr><tr><td><td>";

            // add another row for the message and fen
            html += ("<td colspan='5'><pre style='font-size:x-small'>Before FEN: " + (this.beforeFen) + "<br>");
            html += ("After FEN: " + (this.afterFen) + "<br>");
         //   html += ("Captured/Exchanged: " + (this.CapturedExchanged) + "<br>");
            html += ("Message: " + (this.message) + "</pre></td>");
            html += "</tr>";
        });

        html += "</tbody></table>";
        $('#game-moves-history').html(html);     
    }

    /**
     * Appends the given move to the game history
     * @param {any} move - move information from the server
     */
    function appendMoveToGameHistory(move) {

        if (move == null) {
            $('#message').html("<div class='alert alert-danger'>Invalid server game move </div>");
        }
        var html = "";
        html += "<tr>";
        html += ("<td>" + move.number + "</td>");
        html += ("<td>" + move.playerName);
        html += ( (move.isAttacker == true ? " (Attacker)" : " (Defender)") + "</td>");
        html += ("<td>" + (move.isSetting == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.from) + "</td>");
        html += ("<td>" + (move.to) + "</td>");
        html += ("<td>" + (move.resigned == true ? "Yes" : "No") + "</td>");
        html += ("<td>" + (move.exchangeRequest == true ? "Yes" : "No") + "</td>");
    //    html += ("<td> <pre style='font-size:xx-small'>" + (move.BeforeFEN) + "<br>");
   //     html += ("" + (move.AfterFEN) + "<br>");
    //    html += ("" + (move.Message) + "<pre></td>");
    //    html += "</tr>";
        html += "</tr><tr><td><td>";

        // add another row for the message and fen
        html += ("<td colspan='5'><pre style='font-size:x-small'> Before FEN: " + (move.beforeFen) + "<br>");
        html += ("After FEN: " + (move.afterFen) + "<br>");
      //  html += ("Captured/Exchanged: " + (move.CapturedExchanged) + "<br>");
        html += ("Message: " + (move.message) + "</pre></td>");

        html += "</tr>";

        $('#game-moves-history-table').append(html);
    }
