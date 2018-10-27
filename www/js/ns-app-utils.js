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
function NSSession(){
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
function NSUser(){
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
function NSApp(){
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

    // turn on logging 
    this.loggingOn = window.__env.enableDebug;

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
     * @summary retrieves the current session id
     */
    this.sessionId = function(){
        if (this.session!= null)
            return this.session.sessionId;
        else
            return nsResources.Empty;
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
     * @param {boolean} success - message is success or not
     *   
     */
    this.displayNetMessage = function(message,success){
        if (success === true){
            $('#net-message').html("<div class='alert alert-success'>" + message + "</div>");
        }else if (success === false){
            $('#net-message').html("<div class='alert alert-danger'>" + message + "</div>");
        }else{
            $('#net-message').html("<div class='alert alert-info'>" + message + "</div>");
        }
     //   $('#message').html("<div class='alert alert-info'>" + message + "</div>");
        $('#main-message').html("<div class='alert alert-info'>" + message + "</div>");
    }

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
     * @summary Displays a message related to the user account
     * @param {string} message - the message to display
    *  @param {boolean} success - success flag
     */
    this.displayAccountMessage = function(message, success){
        if (success == undefined){
            $('#account-message').html("<div class='alert alert-info'>" + message + "</div>");
            this.displayNetMessage(message,success);
        }else if (success === true){
            $('#account-message').html("<div class='alert alert-success'>" + message + "</div>");
            this.displayNetMessage(message, success);
        }
        else if (success === false){
            $('#account-message').html("<div class='alert alert-danger'>" + message + "</div>");
             this.displayNetMessage(message,success);
        }else{
            $('#account-message').html("<div class='alert alert-warning'>" + message + " - " + success+ "</div>"); 
             this.displayNetMessage(message + " - " + success);
        }   
    } ;         

    /**
     * @summary outputs and object properties to the table body element  
     * @param {any} data  - an object
     * @param {string} elementId - the id of the element table to output the object data
     *  in the body. the element body should by in html as '{elementId} + '-body'
     * @param {boolean} clear - clear the previous data or not
     */
    this.dumpObjectInfo = function(data, elementId, clear, rules){ 
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

        // utils
        //https://stackoverflow.com/questions/6677035/jquery-scroll-to-element
        // helper for scrolling to an element
        $.fn.nsScrollTo = function (speed) {
            if (typeof (speed) === 'undefined')
                speed = 1000;

            $('html, body').animate({
                scrollTop: parseInt($(this).offset().top)
            }, speed);
        };
///
    };
    

    /**
     * @summary outputs and object properties to the table body element  
     * @param {any} data  - an object
     * @param {string} elementId - the id of the element table to output the object data
     *  in the body. the element body should by in html as '{elementId} + '-body'
     * @param {boolean} clear - clear the previous data or not
     * @param {object} rules - rules to display the object
     */
    this.displayObjectInfo = function(data, elementId, clear, rules){ 
    //   $('#main-message').html("<div class='alert alert-info'>Processing...</div>"); 
        if (clear === true){
            $('#' + elementId).html(""); 
        }
        var keyRules = null;
        
        Object.keys(data).forEach( function(key){
                // check the propDefs
            if (rules != null && typeof(rules) == "object"){
                keyRules = rules[key];          
            }
            if (keyRules != null ){ // only output the element if is included in the rule
                var obj = data[key]; 
                var objType = typeof(obj);
                if (obj != null && objType == "object" ){               
                    var tr = "<div class='row'><div class='col-xs-4 strong'>"+toDisplayString(key) + ":</div><div class='col-xs-8'>" ;
                    var objHtml = "<ul>";
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var li = "<li>" + toDisplayString(key2) + ": " + obj[key2]+"</li>";
                            objHtml +=(li);
                        }
                    });
   
                    objHtml += "<ul>";
                    tr += objHtml;
                    tr += "</div></div>";

                    $('#' + elementId ).append(tr);
                }
                else if (objType == "function" ){
                    // skip
                }
                // check if array
                else{
                    var tr2 ="<div class='row'><div class='col-xs-3 col-md-4'>"
                    if (keyRules.type === "url" && obj!= null){
                        tr2+= keyRules.title + ":</div><div class='col-xs-9 col-md-8 '>";
                        tr2 += "<a href='";
                        var url = keyRules.url;
                        url = url.replace('{?}',obj.toString());
                        tr2+= url;  
                        tr2+=  "'>View</a></div></div>";

                    
                    }
                    else if (keyRules.type === "img"){
                        var html = getImageUrlContent(obj);
                        tr2 += keyRules.title + ":</div><div class='col-xs-9 col-md-4 strong'>";
                        tr2 += (html + "</div></div>");         
                    }
                    else{
                        tr2 += toDisplayString(key) + ":</div><div class='col-xs-9 col-md-6'>" + getText(obj)+"</div></div>";
                        
                    } 
                    $('#' + elementId).append(tr2);
                }
            }
        });  
    };
    function getText(obj){
        if (obj == null)
            return "";
        else 
            return obj.toString();
    }
    function getImageUrlContent(url){
        var html = "<div>";
        html += '<div class="row"> <div class="col-sm-3">';
        if (url != null){
            html += '<img src="' + url;
            html += '" style="max-height:80px;max-width:80px;">  ';
        }
        html += '   </div> <div class="col-sm-9" style="text-align:center;margin-bottom:10px;">';
        html += '        <input type="file" id="file-logo" class="btn btn-primary" />';
        html += '       ';
        html += '    </div>';
        html += '    ';
        html += '</div>';
        return html;
    }
        
      /**
     * @summary outputs and object properties to the table body element  
     * @param {any} list  - an array of objects
     * @param {string} elementId - the id of the element table to output the object data
     *  in the body. the element body should by in html as '{elementId} + '-body'
     * @param {boolean} clear - clear the previous data or not
     * @param {object} rules - defines how to handle each field in the list item
     */
    this.dumpListInfo = function(list, elementId, clear, rules){ 
        if (clear === true){
            $('#' + elementId ).html(""); 
        }
       
        $.each(list, function(item,data){
            var tr = "<li class='list-group-item'>";
            var name = data['name'];
            if (typeof(name) == "string"){
                tr += "<h2>" + name + "</h2>";
            }

            tr+= "<ul class='list-group dropdown'>";
            Object.keys(data).forEach( function(key){
                var keyRules = null;
                // check the propDefs
                if (rules != null && typeof(rules) == "object"){
                    keyRules = rules[key];          
                }
                if (keyRules != null ){
                    tr += ( "<li class='list-group-item'><strong>" + toDisplayString(key)  + ":</strong> ");
                
                    var obj = data[key]; 
                    var objType = typeof(obj);
                    if (objType == "object" ){               
                        var objHtml = "<br> <ul>";
                        
                        if (obj!= null){
                            Object.keys(obj).forEach( function(key2){
                                if (typeof obj[key2] != "function" )
                                {                 
                                    var li = "<li class='list-group-item'><strong>" + toDisplayString(key2) + ":</strong> " + obj[key2]+"</li>";
                                    objHtml +=(li);
                                }
                            });
                        } 
                        objHtml += "</ul>";
                        tr += objHtml;
                
                    }
                    // check if array
                    else{
                        if (obj!= null && objType != "function"){
                            // check the 
                            if (keyRules.type === "url"){
                                var url = keyRules.url;
                                url = url.replace('{?}',obj.toString());
                                tr +="<a href='" + url + "'>View</a>"
                            }
                            else if (keyRules.type === "enum"){
                                var mapped = toDisplayString(keyRules.map[obj]);
                                tr += mapped
                            }
                            else{
                                tr += obj.toString();
                            }
                        }
                    }
                    tr+= "</li>";
                }
                
            });    
            tr+= "</li>";
            $('#' + elementId).append(tr);
        });
    };
};
var nsApp = new NSApp();
nsApp.C_NSSID = "_nssid";

$.nsApp = nsApp;  

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

var resScript= "../jsconfig/ns-app-resources.js";
console.log("loading: " + resScript);
var resElement = document.createElement('script');
resElement.setAttribute('src', resScript);
document.body.appendChild(resElement);
console.log("loading: " + resScript);
   