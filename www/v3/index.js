$(document).on("pagecreate", function() {
    $("body > [data-role='panel']").panel();
    $("body > [data-role='panel'] [data-role='listview']").listview();
});

$(document).one("pageshow", function() {
    $("body > [data-role='header']").toolbar();
    $("body > [data-role='header'] [data-role='navbar']").navbar();
});
/* popup requires jquery 1.11 - does not work with v 3.3 and mobile 1.4.5*/
$.appViewHandler = {
    closeLoginPanel : function(){
        $("#login-panel").popup( "close" );
    },

    closeRegisterPanel: function (){
        $("#register-panel").popup( "close" );    
    }
}   