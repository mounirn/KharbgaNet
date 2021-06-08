// Assumes 
// - vue is included
// - ns-app-user is included
// 
// Vue app 
var nsVueApp = new Vue({
    el: '#ns-vue-app',
    data: {
        model: nsApp,
        message: 'Hello ' + nsApp.user.name, 
        myTitle: 'You loaded this page on ' + new Date().toLocaleString(),
        isLoggedIn: nsApp.user.isLoggedIn(),
        isSysAdmin: nsApp.user.isSysAdmin(),
        currentSession: nsApp.getSession()
    },
    // life cycle hook
    created: function () {
        // `this` points to the vm instance
       
     
        console.log('model is: ' + this.model);
        console.log('message is: ' + this.message);
    },
    watch: {
        // whenever session changes, this function will run
        currentSession: function (olsSession, newSession) {
          
          this.message = 'Hello ' + nsApp.user.name;
         
          this.isLoggedIn = nsApp.user.isLoggedIn();
          this.isSysAdmin =  nsApp.user.isSysAdmin();
          console.log('message is after watch: ' + this.message);
         
        }
    },

    methods: {
        setup: function(session){
            this.currentSession = session;          
            this.message = 'Hello ' + nsApp.user.name;
            //this.currentSession=  nsApp.getSession();
            this.isLoggedIn = nsApp.user.isLoggedIn();
            this.isSysAdmin =  nsApp.user.isSysAdmin();
            console.log('message is after setup: ' + this.message)
        },
        logout: function () {
        // `this` points to the vm instance
        nsApp.logout(function(session){
            currentSession = session;
        });
      }
    }
    
    });

$(document).ready(function() {
    var kApp = new KharbgaApp();
    $.kApp =  kApp; // dot need to call setup here
    nsApp.setup(true,true, function(session){
        nsVueApp.setup(session);
    });
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

