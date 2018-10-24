$(document).on("pagecreate", function() {
    $("body > [data-role='panel']").panel();
    $("body > [data-role='panel'] [data-role='listview']").listview();
});

$(document).one("pageshow", function() {
    $("body > [data-role='header']").toolbar();
    $("body > [data-role='header'] [data-role='navbar']").navbar();
});

$.nsAppViewModel = {};


$(document).ready(function(){
    $('#start-game-with-options').on('click',function(e){
        var options = {
            asAttacker: $('#play-as-attacker').is(':checked'),
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

    // set up the various controls
    $('#play-beginning').on('click',$.appViewHandler.playBeginning);
    $('#play-backward').on('click',$.appViewHandler.playBackward);
    $('#play-start').on('click',$.appViewHandler.playStart);
    $('#play-pause').on('click',$.appViewHandler.playPause);
    $('#play-forward').on('click',$.appViewHandler.playForward);
    $('#play-end').on('click',$.appViewHandler.playEnd);
    $('#sound-set-volume').on('click',$.appViewHandler.setVolume);
    $('#sound-toggle').on('click',$.appViewHandler.soundToggle);
});


/* popup requires jquery 1.11 - does not work with v 3.3 and mobile 1.4.5*/
$.appViewHandler = {
    closeLoginPanel : function(){
        $("#login-popup").popup( "close" );
    },

    closeOpenPanels : function(){
        if ($("#account-panel").hasClass("ui-panel-open") == true ){
            $("#account-panel").panel( "close" );
        }
        if ($("#play-watch-section").hasClass("ui-panel-open") == true ){
            $("#play-watch-section").panel( "close" );
        }
        if ($("#popup-menu-popup").hasClass("ui-popup-active") == true ){
            $("#popup-menu").popup("close");
        }
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

    playBeginning : function () {
        if ($.nsAppKharbga == null )
            return;

        $.nsAppKharbga.playBegining();
    },

    playBackward : function () {
        if ($.nsAppKharbga == null)
            return;
        $.nsAppKharbga.playBackward(); 
    },

    playStart : function () {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.playStart(); 
    },

    playPause : function () {
        if ($.nsAppKharbga == null)
            return;
         $.nsAppKharbga.playPause(); 
    },

    playForward : function () {
        if ($.nsAppKharbga == null)
            return;
        $.nsAppKharbga.playForward(); 
    },

    playEnd : function () {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.playEnd();
    },

    soundToggle : function () {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.soundToggle();
    },

    soundUp : function () {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.soundUp();
    },

    soundDown : function () {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.soundDown();
    },

    setVolume : function (volume) {
        if ($.nsAppKharbga == null )
            return;
        $.nsAppKharbga.setVolume(volume);
    }
};  

function onLoginLink(){
    $.appViewHandler.openLoginPanel();
}

$.nsVM = $.appViewHandler;