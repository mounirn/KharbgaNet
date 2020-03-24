
$(document).ready(function() {
    var kApp = new KharbgaApp();
    $.kApp =  kApp; // dot need to call setup here
    $.nsApp.setup(true, true);
    // load user games after few seconds
    setTimeout(function(){
        _loadUserGames();
    },3000);

    $('#user-games-link').on('click', _loadUserGames);
    function _loadUserGames(e){
        if (e!= null)
            e.preventDefault(); 

        if (nsApp.loggingOn) console.log("_loadUserGames");
        if (nsApp.isLoggedIn() === false){
            
            return;
        }
        var query = {
            max:50
        };

        nsApiClient.gameService.getUserGames(nsApp.sessionId, query, function (data, status) {
            if (data != null) {
                nsApp.user.games = data.object;
                nsApp.displayAccountMessage("Loaded user games successfully" , true);
      
                var displayRules = {
                    // list only the items to display here
                    id : {
                        type:"url",
                        url: "../html/play.html?id={?}"
                    }, 
                    attackerName : {type:"string",},
                    defenderName : {type:"string",},
                    status : {
                        type:"enum", 
                        map : Kharbga.GameStatus
                    },
                    state : {
                        type:"enum", 
                        map : Kharbga.GameState
                    }
                }; 
                nsApp.dumpListInfo(data.object,'user-games-list',true,displayRules);
            }
            else {
                nsApp.user.games = null;
              
              nsApp.displayAccountMessage("Unable to load user games. Error: " + status.statusText, false);
            }
        });
    }
});

