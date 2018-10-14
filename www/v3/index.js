$(document).on("pagecreate", function() {
    $("body > [data-role='panel']").panel();
    $("body > [data-role='panel'] [data-role='listview']").listview();
});

$(document).one("pageshow", function() {
    $("body > [data-role='header']").toolbar();
    $("body > [data-role='header'] [data-role='navbar']").navbar();
});


$(document).ready(function(){
    $('#start-game-with-options').on('click',function(e){
        var options = {
            asAttacker: $('#as-attacker-checkbox').is(':checked'),
            againstComputer: $('#player-two-computer').is(':checked'),
            overTheNetwork: $('#over-the-network-game').is(':checked'),     
            secondPlayerName: 'Guest II',
            firstPlayerName: 'Guest I'     // this is the user logged in or not           
        };

        if (options.againstComputer == true)
        {
            options.secondPlayerName = "System";
        }
       

        if ($ && $.kApp != null )
            $.kApp.newGame(options);

        $("#popup-menu").popup( "close" );
    });
});


/* popup requires jquery 1.11 - does not work with v 3.3 and mobile 1.4.5*/
$.appViewHandler = {
    closeLoginPanel : function(){
        $("#login-popup").popup( "close" );
    },

    closeRegisterPanel: function (){
        $("#register-panel").popup( "close" );    
    },
    refreshList : function(listElementId){
       var listElement = $(listElementId);
       if (listElement && listElement!=null){
            listElement.listview("refresh");
            listElement.trigger("updateLayout");
       }
    },
    displayGameOver : function(){
        $("#game-over").popup("open" );
    },
    openLoginPanel : function(){
        $("#login-popup").popup("open");
    },
};  

function onLoginLink(){
    $.appViewHandler.openLoginPanel();
}