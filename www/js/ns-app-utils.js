if ($ == undefined ){
    console.log("Please include jQuery v1.10 or higher before this module");
    alert ("Application Error: jQuery is not Included");
    throw new Error("NS App: Please include jQuery");
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
 * Defines the processing result of an action 
 */
function NSResult(){
    this.success = true;
    this.status = 0;
    this.errorMessage = "";
    this.startTime = "";
    this.endTime = "";
}
/**
 * Defines a base app object
 */
function NSObject() {
    this.id = 0;
    this.systemId = "";
    this.name ="";
    this.description = "";
    this.code = "";
    this.isActive = false;
    this.isPublic = false;
    this.imageUrl ="";
    this.status = 0;
    this.classId = 0; 

}
/**
 * @summary the user session
 */
function NSSession(){
    this.sessionId = "";
    this.isActive = false;
    this.isAdmin = false;
    this.fullName  = nsResources.Guest;
    this.mainRole = 0;
    this.lastAccess = "";
    this.createdOn = "";
    this.clientId = 0;
    this.accountId = 0;
    this.imageUrl = "";
    this.reset = function(){
        this.sessionId = "";
        this.fullName = nsResources.Guest;
        this.isActive = false;
        this.isAdmin = false;
        this.mailRole = 0;
        this.lastAccess = "";
        this.createdOn = "";
        this.clientId = 0;
        this.accountId = 0;
        this.imageUrl = "";
    };
    /**
     * Setup the session with back-end data
     */
    this.setup = function(session){
        if (session === null || typeof(session) !== "object" || session === undefined){
            this.reset();
        }
        else{
            this.sessionId = session.sessionId;
            this.fullName = session.fullName;
            this.isActive = session.isActive;
            this.isAdmin = session.isAdmin;
            this.mainRole = session.mainRole;
            this.lastAccess = session.lastAccess;
            this.createdOn = session.createdOn;
            this.clientId = session.clientId;  // the team id
            this.accountId = session.accountId; // the user id
            this.imageUrl = session.imageUrl;
        }
    };
}

function NSClient(){
    this.name = "Guest";
    this.object = null;
}
/**
 * @summary the user information
 */
function NSUser(){
    this.name = "Guest";
    this.systemId = "";
    this.id = 0;
    this.clientId = 0;  // the team id
    this.session = new NSSession();
    this.account = null;
    this.object = null;
    this.team = null;  // aka client org
    this.teamMembers = null;  
    this.preferences = {};
    this.imageUrl = "";
    this.createdOn = "";

    /**
     * sets up the user with the session result
     */
    this.setup = function (session){ 
        this.session.setup(session);
        this.name = this.session.fullName;
        if (session == null){
           this.setAccount(null);
        }
     
    };
    /**
     * sets up the user with the account info result
     */
    this.setAccount = function(account){
        this.account = account;
        if (this.account!= null){
            
            this.systemId = this.account.systemId;
            this.object = this.account.extension;
            if (this.object!= null){
                this.name = this.object.name;
                this.clientId = this.object.clientId;
                this.id = this.object.id;
                this.imageUrl = this.object.imageUrl;
                this.createdOn = this.object.createdOn;
            }
        }
        else{
            this.object = null;
            this.team = null;  // aka client org
            this.preferences = {};
            this.imageUrl = "";
            this.createdOn = "";
            this.teamMembers = null;  
            this.systemId = "";
            this.object = null;
        }
    };
    /**
     * sets up the user record with the current client record
     */
    this.setTeam = function(team){
        this.team = team;
    };

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
        this.session.reset();
        this.preferences = {};
    };
} 

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
     * @summary - the current session id
     */
    this.sessionId = "";

    /**
     * the logged in user info
     */
    this.user = new NSUser();

    /**
     * @summary Defines if debugging is turned on or not
     */
    this.loggingOn = window.__env.enableDebug;

    /**
     * @summary Sets the app and user session - after login or session checking
     */
    this.setSession = function(session){
        this.user.setup(session);
        
        if (session!= null){
            this.sessionId = session.sessionId;
            this.setCookie(nsApp.C_NSSID, session.sessionId);    
        }
        else{ 
            this.sessionId =nsResources.Empty;
            this.setCookie(nsApp.C_NSSID, nsResources.Empty);
        }
    };

    /**
     * @summary Returns the current user logged in user session
     * @returns {NSSession} - the current user session
     */
    this.getSession = function(){
        return this.user.session;
    };
    
    this.setAppStatus = function(appStatus){
        this.appStatus = appStatus; 
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
     * @summary Checks if the user is logged in
     * @returns true if logged in false otherwise
     */
    this.isLoggedIn = function(){ 
        return this.user.isLoggedIn();
    };

    /**
     * @summary retrieves the current session id
     */
    this.sessionId = function(){
        if (this.user.session!= null)
            return this.user.session.sessionId;
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
     * Helper function for reading from local storage. If local storage is not available, use cookies
     * @param {any} key - a key
     * @returns {any} - the value or empty string. 
     */
    this.getFromLocalStorage = function(key) {
        
        var ret = '';      
        if (window.localStorage != null){
            val = window.localStorage.getItem(key);            
        }
        else{
            return getCookie(key);
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

    /**
     * Helper function for setting a value in local storage. If local storage is not available, use cookies
     * @param {any} key - the key to set
     * @param {any} value - the value
     */
    this.setLocalStorage  = function(key, value) {
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
     * @summary Displays the processing result in the case of an error is a div with id = "message"
     * @param {NSResult} result - the message to display
     */
    this.displayResult = function(result){
        if (result!= null && result.errorMessage != null){
            $('#message').html("<div class='alert alert-danger'> Status Code: " + 
                result.status + " - Error: " + result.errorMessage + "</div>");
        }
    };

    
    /**
     * @summary Displays the processing status
     * @param {HTTPResponseStatus} status - the status to parse and 
     */
    this.displayStatus = function(status){
        if (nsApp.isValid(status)){
            if ( status.status === 400 || status.status === 404){  // Bad request
                if (nsApp.isValid(status.responseJSON)){
                    $('#message').html("<div class='alert alert-danger'>" + 
                        status.status + ": " + status.responseJSON.message + "</div>");
                }
                else{
                    $('#message').html("<div class='alert alert-danger'>" + 
                         status.status + ": " + status.responseText + "</div>"); 
                }
            }
            else{
                $('#message').html("<div class='alert alert-danger'>" + 
                    status.status + ": " + status.statusText + "</div>");
            }
        }
    };
 
    /**
     * @summary Checks the processing results of backend requests and display result in the 
     * case of a result error and no data is returned
     * @param {NSResult} data - the data result object
     * @param {HTTPResponseStatus} status - the http status to parse and 
     */
    this.handleResultNoData = function (data,status){
        if (this.isValid(data)){
            this.displayResult(data);
        }
        else {
            if (this.isValidObject(status)) {

                if (status.status === 500) {
                    this.displayErrorMessage("500 - Internal Server Error");
                }
                else if (status.status === 400) {
                    this.displayWarningMessage("400 - Invalid Input - Please check all your input");
                }
                else if (status.status === 404) {
                    this.displayWarningMessage("404 - Not Found ");
                }
                else {
                    this.displayStatus(status);
                }
            }
            else {
                this.displayErrorMessage("Network Error - Unable to process your request - ");
            }
            
        }
        this.displayProcessing(false);
    };

    /**
     * @summary 
     * @param {Boolean} processing - processing flag
     */
    this.displayProcessing = function(processing){
        if (processing){
            $('#processing').html("<div class='alert alert-info'>" + 
                "<i class='fa fa-spinner'>Processing...</div>");
            this.displayNetMessage("<i class='fa fa-spinner fa2x'> Processing...");
            $('.ns-processing').html("<div class='alert alert-info'>" + 
            "<i class='fa fa-spinner'>Processing...</div>");
        }
        else{
            this.displayNetMessage("Done");
            $('#processing').html("");
            $('.ns-processing').html("");
        }

    };

    /**
     * @summary Displays the data result as JSON data in a an div with id="appDebugInfo" if debug is turned on
     * @param {any} result - the data object
     */
    this.displayDebugResult = function(result){
        if (this.loggingOn){
            $('#appInfo').html(JSON.stringify(result));
        }
    }
        
    /**
     * @summary Displays an error message to the user
     * @param {string} message - the message to display
     */
    this.displayErrorMessage= function(message){
        $('#message').html("<div class='alert alert-danger'>" + message + "</div>");
        $('.ns-message').html("<div class='alert alert-danger'>" + message + "</div>");
    };

    /**
     * @summary Displays a success message to the user
     * @param {string} message - the message to display
     */
    this.displaySuccessMessage= function(message){
        $('#message').html("<div class='alert alert-success'>" + message + "</div>");
        $('.ns-message').html("<div class='alert alert-success'>" + message + "</div>");

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
        $('.ns-message').html("<div class='alert alert-info'>" + message + "</div>");

    };
        
    /**
     * @summary Displays a warning message to the user
     * @param {string} message - the message to display
     */
    this.displayWarningMessage = function (message){
        $('#message').html("<div class='alert alert-warning'>" + message + "</div>");
        $('.ns-message').html("<div class='alert alert-warning'>" + message + "</div>");

    };

    /**
     * @summary Displays a message related to the user account
     * @param {string} message - the message to display
    *  @param {boolean} success - success flag
     */
    this.displayAccountMessage = function(message, success){
        if (success == undefined){
            $('#account-message').html("<div class='alert alert-info'>" + message + "</div>");
            $('.ns-account-message').html("<div class='alert alert-info'>" + message + "</div>");
      
            this.displayNetMessage(message,success);
        }else if (success === true){
            $('#account-message').html("<div class='alert alert-success'>" + message + "</div>");
            $('.ns-account-message').html("<div class='alert alert-success'>" + message + "</div>");
            this.displayNetMessage(message, success);
        }
        else if (success === false){
            $('#account-message').html("<div class='alert alert-danger'>" + message + "</div>");
            $('.ns-account-message').html("<div class='alert alert-danger'>" + message + "</div>");
             this.displayNetMessage(message,success);
        }else{
            $('#account-message').html("<div class='alert alert-warning'>" + message + " - " + success+ "</div>"); 
            $('.ns-account-message').html("<div class='alert alert-warning'>" + message + " - " + success+ "</div>"); 
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
     * @summary outputs the object properties to the table body element  
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
                    var tr2 ="<div class='row'>";
                    if (keyRules.type === "url" && obj!= null){
                        tr2+= "<div class='col-xs-3 col-md-4'>";
                        tr2+= keyRules.title + ":</div><div class='col-xs-9 col-md-8 '>";
                        tr2 += "<a href='";
                        var url = keyRules.url;
                        url = url.replace('{?}',obj.toString());
                        tr2+= url;  
                        tr2+=  "'>View</a></div></div>";

                    
                    }
                    else if (keyRules.type === "img"){
                        tr2+= "<div class='col-xs-3 col-md-4'>";
                        var html = getImageUrlContent(obj);
                        tr2 += keyRules.title + ":</div><div class='col-xs-9 col-md-4 strong'>";
                        tr2 += (html + "</div></div>");         
                    }
                    else if (keyRules.type === "avatar"){
                        tr2+= "<div class='col-xs-3 col-md-4'>";
                        var html2 = getAvatar(obj);
                        tr2 += (html2 + "</div><div class='col-xs-9 col-md-4'></div>");         
                    }
                    else{
                        tr2+= "<div class='col-xs-3 col-md-4'>";
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
    function getAvatar(url, title){
        var html = '<div class="img">';
        if (url != null){
            html += '<img src="' + url;
            html += '" style="max-height:120px;max-width:120px;" ';
            if (typeof(title) == "string"){
                html += ' title=" ' + title + '"';
            }
            html += '/>  ';
        }
      
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

  
    /**
     * @summary outputs and user profile
     * @param {any} obj  - the profile user object
     * @param {string} elementId - the id of the element table to output the object data
     */
    this.displayUserProfile = function(obj, elementId){
        if (obj == undefined || obj== null || obj.extension === null || obj.extension == undefined)
            return;
        var html ="";
        $('#' + elementId).html(html);      
        html += "<div class='row'>";
        var title = obj.extension.name;
        html += "<div class='col-sm-4'>";
        html +=  getAvatar(obj.extension.imageUrl, title);
        html += "</div>";
        html += "<div class='col-sm-8'>";
        if (obj.isClientAdmin === true){
            html += "<strong class='text-success'>Team Captain</strong>";
        }
        html += "<ul>";
        
        html += "<li><strong>First Name:</strong> " + getText(obj.firstName) +"</li>";
        html += "<li><strong>Last Name:</strong> " + getText(obj.lastName) +"</li>";
        html+= "</ul>";
   /*     var objElementId = "ns-obj" +  elementId;

        html += "</div><div id='" + objElementId + "'></div>";
        $('#' + elementId).html(html);
        if (obj.extension != null){
             var displayRules = {
                name: {},
                imageUrl : { type: "img"}

            };
            this.displayObjectInfo(obj.extension, objElementId, true, displayRules);
        }
*/
       
    };
    // App utilities
    /**
     * @summary -- checks if the object is valid or not 
     * @param {Object} obj: the object to check
     * @returns {boolean} -- false if the object is null or undefined true otherwise
     * 
     */
    this.isValid = function(obj) {
        if (obj === null) return false;
        if (obj === undefined) return false;     
        if (obj == null) return false;
        if (obj == undefined) return false;
        return true;
    };

    /**
     * @summary -- checks if the data object and result object is valid or not 
     * @param {Object} data: the result object
     * @returns {boolean} -- true if both the data and result object are not null and undefined
     * 
     */
    this.isValidObject = function(data){
        if (this.isValid(data) && (typeof data === "object") ) {
            return true;
        } else {
            return false;               
        }
          
    };
     /**
     * @summary -- checks if the object is valid or 
     * @param {string} obj: the string to check
     * @returns {boolean} -- false if the object is null or undefined true otherwise
     * 
     */
    this.isValidString = function(obj) {
        if (typeof obj === "string") return true;
        if (obj === undefined) return false;     
        if (obj == null) return false;
        if (obj == undefined) return false;
        return true;
    };

    /**
     * @summary Creates a random id using a Guid format
     * @returns {string} -- a random guid
     */
    this.createGuid = function () {
        return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
            var r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }; 
    
    /**
     * @summary Generates a random number from the given range
     * @param {Number} lower - range start
     * @param {Number} upper - range to
     */
    this.getRandom = function(lower, upper) {
        // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
        var percent = (Math.random() * 100);
        // this will return number between 0-99 because Math.random returns decimal number from 0-0.9929292 something like that
        //now you have a percentage, use it find out the number between your INTERVAL :upper-lower 
        var num = ((percent * (upper - lower) / 100));
        //num will now have a number that falls in your INTERVAL simple maths
        num += lower;
        //add lower to make it fall in your INTERVAL
        //but num is still in decimal
        //use Math.floor>downward to its nearest integer you won't get upper value ever
        //use Math.ceil>upward to its nearest integer upper value is possible
        //Math.round>to its nearest integer 2.4>2 2.5>3   both lower and upper value possible
        // console.log("upper: %s,lower: %s, num: %s, floor num: %s, ceil num: %s, round num: %s", lower, upper, num, Math.floor(num), Math.ceil(num), Math.round(num));
        return Math.floor(num);
    }; 
    
    // various messages 
    /**
     * @summary logout message success
     */
    this.MSG_on_logout_done_success = 'on-logout-done-success';
}
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
var path = document.location.path;
var origin = document.location.origin;

console.log("loading: " + resScript);
var resElement = document.createElement('script');
resElement.setAttribute('src', resScript);
document.body.appendChild(resElement);
console.log("loading: " + resScript);
   