if ($ == undefined ){
    console.log("Please include jQuery v1.10 or higher before this module");
    throw new Error("Please include jQuery");
}

function NSApp (){
    this.state= {// the client app state
        session: {
            id: "",
            clientId: "",
        }
    };  
    this.user = {// the current user info
        name: "Guest"
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
                var tr = "<tr><th style='width:20%'>"+this.toDisplayString(key) + ":</th><td>" ;
                var objHtml = "<ul>";
                
                if (obj!= null){
                    Object.keys(obj).forEach( function(key2){
                        if (typeof obj[key2] != "function" )
                        {                 
                            var li = "<li>" + this.toDisplayString(key2) + ": " + obj[key2]+"</li>";
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
                var tr2 = "<tr><th style='width:20%'>"+this.toDisplayString(key) + ":</th><td>" + obj+"</td></tr>";
                $('#' + elementId +'-body').append(tr2);
            }
        });  
    };

    
    /** 
     * @summary Converts a camel case string to display 
     *  @returns {string} the converted string
     */
    this.toDisplayString = function(key){
        // key.replace(/([A-Z])/g, function($1){return " "+$1.toLowerCase();});
        // insert a space between lower & upper
        var ret = key.replace(/([a-z])([A-Z])/g, '$1 $2')
        // space before last upper in a sequence followed by lower
        .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
        // uppercase the first character
        .replace(/^./, function(str){ return str.toUpperCase();}); 

        return ret;
    };
}
$.nsApp = new NSApp();
var nsApp = $.nsApp;  
nsApp.C_NSGID = "_nsgid";
nsApp.C_NSSID = "_nssid";

   