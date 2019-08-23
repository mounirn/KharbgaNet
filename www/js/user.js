
$(document).ready(function() {
    var kApp = new KharbgaApp();
    $.kApp =  kApp;// dot need to call setup here
    $.nsApp.setup(false, false);
    // load user games after few seconds
   

    // check the user id param
    var queries = {};
    $.each(document.location.search.substr(1).split('&'),function(c,q){
      if (q!= ""){
         var i = q.split('=');
         queries[i[0].toString()] = i[1].toString();
      }
    });
    var userId = "";
    //console.log(queries);
    if (queries.id != null && queries.id.length > 10){
        userId = queries.id;
    }
    setTimeout(function(){
        // setup - start with the given game Id
        loadUserProfile(userId);
    },2000);

});


function loadUserProfile(userId){
   // alert(userId);

    if (nsApp.isLoggedIn() === false){
        return;
    }
    nsApiClient.userService.getUserView(nsApp.sessionId, userId, function (data, status) {
        if (nsApp.isValid(data) ) {
          
            nsApp.displayUserProfile(data,'user-profile');
        }
        else {
           nsApp.displayAccountMessage("Unable to load user profile info. Error: " + status.statusText, false);
           
        }
    });
}



