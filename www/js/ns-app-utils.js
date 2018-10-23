if ($ == undefined ){
    console.log("Please include jQuery v1.10 or higher before this module");
    throw new Error("Please include jQuery");
}
/**
 * @summary Defines various strings used in the app 
 */
var NSResources = function(){
    this.Guest = "Guest";
    this.Welcome = "Welcome";
    this.Empty = "";

};
var nsLocal = "en";
var nsResources = new NSResources();

/**
 * @summary the user session
 */
var NSSession = function(){
    this.sessionId = "";
    this.isActive = false;
    this.isAdmin = false;
    this.fullName  = nsResources.Guest;
    this.reset = function(){
        this.name = "";
        this.isActive = false;
        this.isAdmin = false;
        this.fullName = nsResources.Guest;
    };
};
/**
 * @summary the user information
 */
var NSUser = function(){
    this.name = nsResources.Guest;
    this.session = new NSSession();
    this.preferences = {};

    this.isActive = function(){
        return (this.session != null && this.session.isActive === true);
    };
    this.isAdmin = function(){
        return (this.session != null && this.session.isActive === true && this.session.isAdmin === true);
    };
    this.isLoggedIn = function(){
        return this.isActive();
    };
    this.reset =  function(){
        this.name= nsResources.Guest;
        this.session = new NSSession();
    };
}; 

/**
 * @summary the app info including utilities:
 * - logging
 * - user and session info
 * - reading and loading client cookie or local storage data
 */
var NSApp = function(){
    this.state= {// the client app state   
    };  

    /**
     * the current user session
     */
    this.session = new NSSession();

    /**
     * the logged in user info
     */
    this.user = new NSUser();

    this.setSession = function(session){
        this.session = session;
        this.user.session = session;
        if (session!= null){
            this.setCookie(nsApp.C_NSSID, session.sessionId);
            this.user.name = session.fullName;
           
        }
        else{
            this.user.reset();
            this.setCookie(nsApp.C_NSSID, nsResources.Empty);
        }
    };
 

    this.log= function(message) {
        try     {
            console.log(message);
        }
        catch(err) { 
            //no action. probably just IE
        }
    };

    /**
     * Checks if the user is logged in
     * @returns true if logged in false otherwise
     */
    this.isLoggedIn = function(){ 
        return this.user.isLoggedIn();
    };


    /**
     * Helper function for reading cookie
     * @param {any} key - a key
     * @returns {any} - the value or null
     */
    this.getCookie = function(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        var ret = keyValue ? keyValue[2] : null;
        if (ret === null){
            if (window.localStorage != null){
                val = window.localStorage.getItem(key);            
            }
        }
        return ret;
    };

    /**
     * Helper function for setting cookie
     * @param {any} key - the key to set
     * @param {any} value - the value
     */
    this.setCookie = function(key, value) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();

        // store in local storage 
        if (window.localStorage != null){
            window.localStorage.setItem(key, value);            
        }
    };


    this.cw = null;
    this.startWorker = function() {
        if (typeof (Worker) !== "undefined") {
            if (this.cw == null) {
                this.cw = new Worker("kharbga-computer.js");
            }
            this.cw.onmessage = function (event) {
                console.log(event.data);
            };
            this.cw.onerror = function (event) {
                console.log(event.data);
            };
        } else {
            console.log("Sorry! No Web Worker support.");
        }
    };

    this.stopWorker = function() {
        this.cw.terminate();
        this.cw = undefined;
    };

        
    /**
     * @summary Displays an error message to the user
     * @param {string} message - the message to display
     */
    this.displayErrorMessage= function(message){
        $('#message').html("<div class='alert alert-danger'>" + message + "</div>");
    };

    /**
     * @summary Displays a success message to the user
     * @param {string} message - the message to display
     */
    this.displaySuccessMessage= function(message){
        $('#message').html("<div class='alert alert-success'>" + message + "</div>");
    };

    /**
     * @summary Displays a message about the game 
     * @param {string} message - the message to display
     */
    this.displayGameMessage= function(message){
        $('#game-message').html("<div class='alert alert-info'>" + message + "</div>");
    };
        /**
     * @summary Displays a message status change from the messaging server
     * @param {string} message - the message to display
     */
    this.displayNetMessage= function(message){
        $('#net-message').html("<div class='alert alert-info'>" + message + "</div>");
        //   $('#message').html("<div class='alert alert-info'>" + message + "</div>");
        $('#main-message').html("<div class='alert alert-info'>" + message + "</div>");
    };

    /**
     * @summary Display computer Message
     * @param {string} message - the message to display
     */
    this.displayComputerMessage= function(message){
        $('#computer-message').html("<div class='alert alert-info'>" + message + "</div>");
    };

    /**
     * @summary Displays an informational message to the user
     * @param {string} message - the message to display
     */
    this.displayInfoMessage= function(message){
        $('#message').html("<div class='alert alert-info'>" + message + "</div>");
    };
        
    /**
     * @summary Displays a warning message to the user
     * @param {string} message - the message to display
     */
    this.displayWarningMessage = function (message){
        $('#message').html("<div class='alert alert-warning'>" + message + "</div>");
    };

    /**
     * @summary outputs and object properties to the table body element  
     * @param {any} data  - an object
     * @param {string} elementId - the id of the element table to output the object data
     *  in the body. the element body should by in html as '{elementId} + '-body'
     * @param {boolean} clear - clear the previous data or not
     */
    this.dumpObjectInfo = function(data, elementId, clear){ 
    //   $('#main-message').html("<div class='alert alert-info'>Processing...</div>"); 
        if (clear === true){
            $('#' + elementId +'-body').html(""); 
        }

        Object.keys(data).forEach( function(key){
            var obj = data[key]; 
            var objType = typeof(obj);
            if (objType == "object" ){               
                var tr = "<tr><th style='width:30%'>"+toDisplayString(key) + ":</th><td>" ;
                var objHtml = "<ul>";
                
                if (obj!= null){
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var li = "<li>" + toDisplayString(key2) + ": " + obj[key2]+"</li>";
                            objHtml +=(li);
                        }
                    });
                } 
                objHtml += "<ul>";
                tr += objHtml;
                tr += "</td></tr>";

                $('#' + elementId +'-body').append(tr);
            }
            else if (objType == "function" ){
                // skip
            }
            // check if array
            else{
                var tr2 = "<tr><th style='width:20%'>"+toDisplayString(key) + ":</th><td>" + obj+"</td></tr>";
                $('#' + elementId +'-body').append(tr2);
            }
        });  
    };

    
   
};
$.nsApp = new NSApp();
var nsApp = $.nsApp;  
nsApp.C_NSSID = "_nssid";

/** @summary Converts a camel case string to display 
 *  @returns {string} the converted string
*/
function toDisplayString(key){
// key.replace(/([A-Z])/g, function($1){return " "+$1.toLowerCase();});
    // insert a space between lower & upper
    var ret = key.replace(/([a-z])([A-Z])/g, '$1 $2')
    // space before last upper in a sequence followed by lower
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
    // uppercase the first character
    .replace(/^./, function(str){ return str.toUpperCase();}); 

    return ret;
}

   