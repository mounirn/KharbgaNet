// utils
function getLoggingNow() {
    return moment().format('HH:mm:ss.SSS');
}

String.prototype.replaceAll2 = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

function setSystemError(on) {
    if (on)
        $('#main-message').show();
    else
        $('#main-message').hide();
}


function NSAppClient(baseURI) {
    
  
    this.baseURI = baseURI;
    console.log("NSAppClient CTOR - " + this.baseURI);
   
    /**
     * Creates the user service object
     * @param {any} baseURI - the base URI
     */
    function UserService(baseURI) {
        this.serviceBaseURI = baseURI + "api/user/";
        console.log("%s - User Service CTOR - %s, ", getLoggingNow(), this.serviceBaseURI);
  
        this.checkSession = function (sessionId, callback) {
            var uri = this.serviceBaseURI + "token";

            console.log("%s - ajax GET %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",             

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid" : sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - checkSession success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - checkSession error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - checkSession complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });

        };
        this.validateLogin = function (loginInfo, callback) {
            var uri = this.serviceBaseURI + "login";
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET request
                type: "POST",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                // Tell jQuery we're expecting JSONP
                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },

                // Tell YQL what we want and that we want JSON
                data: JSON.stringify(loginInfo),
                crossDomain: true,


                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - validateLogin success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - validateLogin error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - validateLogin complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };
        /**
         * @summary logs out the current user
         * @param {string} sessionId - the user session id 
         * @param {function} callback - the callback function with the result (data, status)
         */
        this.logout = function (sessionId, callback) {
            var uri = this.serviceBaseURI + "token";
            console.log("%s - ajax DELETE %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "DELETE",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid" : sessionId  },
          
                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - logout success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - logout error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - logout complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };

        this.register = function (registerInfo, callback) {
            var uri = this.serviceBaseURI + "register";
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET request
                type: "POST",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                // Tell jQuery we're expecting JSONP
                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },

                // Tell YQL what we want and that we want JSON
                data: JSON.stringify(registerInfo),
                crossDomain: true,


                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - register success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - register error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - register complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });

        };
        /**
         * @summary retrieves the current user logged in account information
         * @param {string} sessionId - the user session id 
         * @param {function} callback - the callback function with the result (data, status)
         */
        this.getAccountInfo = function (sessionId, callback) {
            var uri = this.serviceBaseURI + "my";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getAccountInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getAccountInfo error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getAccountInfo complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };
  
        /**
         * @summary retrieves the current user logged in account preferences
         * @param {string} sessionId - the user session id 
         * @param {function} callback - the callback function with the result (data, status)
         */
        this.getPreferences = function(sessionId,callback){
            var uri = this.serviceBaseURI + "preferences";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getPreferences success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getPreferences error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getPreferences complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });
        };

        /**
         * @summary updatess the current user logged in account preferences
         * @param {string} sessionId - the user session id 
         * @param {function} callback - the callback function with the result (data, status)
         */
        this.savePreferences = function(sessionId,preferences, callback){
            var uri = this.serviceBaseURI + "preferences";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,

                // Whether this is a POST or GET request
                type: "POST",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                // Tell jQuery we're expecting JSONP
                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId  },

                // Tell YQL what we want and that we want JSON
                data: JSON.stringify(preferences),
                crossDomain: true,


                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - savePreferences success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - savePreferences error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - savePreferences complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };

        /**
         * @summary retrieves a user profile
         * @param {string} sessionId - the user logged in session id 
         * @param {string} userId - the user id of the profile to retrieve 
         * @param {function} callback - the callback function with the result (data, status)
         */
        this.getUserInfo = function (sessionId, userId, callback) {
            var uri = this.serviceBaseURI + "profile/" + userId;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getUserInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getUserInfo error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getUserInfo complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };

        /**
    * @summary retrieves a user profile
    * @param {string} sessionId - the user logged in session id 
    * @param {string} userSystemId - the user system id of the profile to retrieve 
    * @param {function} callback - the callback function with the result (data, status)
    */
        this.getUserProfile = function (sessionId, userSystemId, callback) {
            var uri = this.serviceBaseURI + "profile/" + userSystemId;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getUserProfile success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getUserProfile error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getUserProfile complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };


        /**
* @summary retrieves a user profile
* @param {string} sessionId - the user logged in session id 
* @param {string} userId - the user id of the user profile to retrieve 
* @param {function} callback - the callback function with the result (data, status)
*/
        this.getUserView = function (sessionId, userId, callback) {
            var uri = this.serviceBaseURI + "view/" + userId;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                dataType: "json",

                contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getUserInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getUserInfo error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getUserInfo complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });

        };



        /**
         * @summary: updates the user logo
         * @param {string} sessionId - the session id
         * @param {FormData} formData - the formData with the file info   
        */

        this.uploadLogo = function(sessionId, formData, callback){
            var uri = this.serviceBaseURI + "logo" ;
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,
                type: "POST",// Whether this is a POST or GET request
                //jsonp: "callback",
            //  dataType: "json",
            //  contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "_nssid": sessionId  },

                // Tell YQL what we want and that we want JSON
                data: formData,
                contentType: false,  
                processData: false,  
                crossDomain: true,
                success: function (result, status, xhr) {
                    console.log("%s - ajax - uploadLogo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - uploadLogo error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - uploadLogo complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };
    }

    /**
     * creates the app service object
     * @param {any} baseURI - base URI
     */
    function AppService(baseURI) {
        this.serviceBaseURI = baseURI + "api/app/";
        console.log("%s - App Service CTOR - %s ", getLoggingNow(), this.serviceBaseURI);

        /**
         * @summary retrieves basic app info - available to all users
         */
        this.getAppInfo = function (callback) {
            var uri = this.serviceBaseURI + "status";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getAppInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getAppInfo error: status: %s,  error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getAppInfo complete: status: %s", getLoggingNow(),JSON.stringify(status));

                }
            });

            return ret;
        
        };
        
       
        this.getSystemHelper = function (sessionId, api, callback) {
            var uri = this.serviceBaseURI + api;
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid" : sessionId  },
        
                  // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getSystemInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getSystemInfo error: status: %s,  error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getSystemInfo complete: status: %s", getLoggingNow(),JSON.stringify(status));

                }
            });

            return ret;
        
        };
        /**
         * @summary retrieves app hosting info - available to sys admin
         */
        this.getSystemHostInfo = function(sessionId, callback){
            return getSystemHelper(sessionId, "host/info", callback);
        };
        /**
         * @summary retrieves system log for sys admin
         */
        this.getSystemLog = function(sessionId, callback){
            return getSystemHelper(sessionId, "log", callback);
        };

        /**
         * @summary retrieves app info details for sys admin
         */
        this.getSystemInfo = function(sessionId, callback){
            return getSystemHelper(sessionId, "about", callback);
        };
    }

    function ClientService(baseUI){
        this.serviceBaseURI = baseURI + "api/client/";

        /**
         * @summary search for organizations by name contains
         * @param {string} name - name contains
         * @param {function} callback callback function (data, status) 
         *          data is a result list of client organizations
         */
        this.getClientsFilter = function (sessionId, name, callback) {

            var queryString = {     
                nameContains: name,
                
            };
            var uri = this.serviceBaseURI + "filter";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                data: queryString,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",             

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", C_NSSID: sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getClientsFilter success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getClientsFilter error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getClientsFilter complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };

    /**
         * @summary search for organizations by name contains
         * @param {string} name - name contains
         * @param {function} callback callback function (data, status) 
         *      data is a result list of app objects lookup data to include in a dropdown 
         */
        this.getClientsLookup = function (sessionId, name, callback) {

            var queryString = {     
                nameContains: name,
                
            };
            var uri = this.serviceBaseURI + "lookup";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                data: queryString,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",             

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", C_NSSID: sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getClientsLookup success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getClientsLookup error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getClientsLookup complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };

        this.getClientInfo = function (sessionId, callback) {

            var queryString = {
            };
            var uri = this.serviceBaseURI + "my";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                data: queryString,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",
  
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getClientInfo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getClientInfo error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getClientInfo complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });
        };

        this.getClientMembers = function (sessionId, callback) {

            var queryString = {
                max:20
            };
            var uri = this.serviceBaseURI + "members";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                data: queryString,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",
  
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getClientMembers success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getClientMembers error: status: %s, error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getClientMembers complete: status: %s ", getLoggingNow(), JSON.stringify(status));

                }
            });
        };

        /**
         * @summary: updates the org logo
         * @param {string} sessionId - the session id
         * @param {FormData} formData - the formData with the file info   
        */
       this.uploadLogo = function(sessionId, formData, callback){
            var uri = this.serviceBaseURI + "logo" ;
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,
                type: "POST",// Whether this is a POST or GET request
                //jsonp: "callback",
            //  dataType: "json",
            //  contentType: "application/json",

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "_nssid": sessionId  },

                // Tell YQL what we want and that we want JSON
                data: formData,
                contentType: false,  
                processData: false,  
                crossDomain: true,
                success: function (result, status, xhr) {
                    console.log("%s - ajax - uploadLogo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - uploadLogo error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - uploadLogo complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };
    }

    function GameService(baseURI) {
        this.serviceBaseURI = baseURI + "api/game/";
        console.log("%s - Game Service CTOR - %s ", getLoggingNow(), this.serviceBaseURI);

        /**
         * @summary: retrieves list of server connections depending on current user logged in
         * @param {string} sessionId - the session id
         * @param {object} queryString - the query string object with key value pairs 
         */
        this.getConnections = function (sessionId, queryString, callback) {
            var uri = this.serviceBaseURI + "connections";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getConnections success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getConnections error: status: %s,  error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getConnections complete: status: %s", getLoggingNow(),JSON.stringify(status));

                }
            });
            return ret;
        };

        /**
         * @summary: retrieves list of players depending on current user logged in
         * @param {string} sessionId - the session id
         * @param {object} queryString - the query string object with key value pairs 
         */
        this.getPlayers = function (sessionId, queryString, callback) {
            var uri = this.serviceBaseURI + "players";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getPlayers success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getPlayers error: status: %s,  error: %s", getLoggingNow(), JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getPlayers complete: status: %s", getLoggingNow(),JSON.stringify(status));

                }
            });
            return ret;
        };

        /**
         * @summary: retrieves list of games depending on current user logged in
         * @param {string} sessionId - the session id
         * @param {object} queryString - the query string object with key value pairs 
         */
        this.getGames = function (sessionId, queryString, callback) {
            var uri = this.serviceBaseURI + "list";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getGames success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getGames error: status: %s,  error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getGames complete: status: %s", getLoggingNow(),JSON.stringify(status));
                }
            });
            return ret;
        };


           /**
         * @summary: retrieves list of games depending on current user logged in
         * @param {string} sessionId - the session id
         * @param {object} queryString - the query string object with key value pairs 
         */
        this.getUserGames = function (sessionId, queryString, callback) {
            var uri = this.serviceBaseURI + "user/list";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("%s - ajax - getUserGames success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("%s - ajax - getUserGames error: status: %s,  error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getGames complete: status: %s", getLoggingNow(),JSON.stringify(status));
                }
            });
            return ret;
        };
    }

    function ObjectService(baseURI){
        this.serviceBaseURI = baseURI + "api/object/";
        console.log("%s - ObjectService CTOR - %s ", getLoggingNow(), this.serviceBaseURI);

        /**
         * @summary: posts an object logo
         * @param {string} sessionId - the session id
         * @param {object} id - the object id    
         * @param {FormData} formData - the formData with the file info   
        */
        this.uploadLogo = function(sessionId,id, formData, callback){
            var uri = this.serviceBaseURI + "logo/" + id;
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,

                // Whether this is a POST or GET request
                type: "POST",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                // Tell jQuery we're expecting JSONP
              //  dataType: "json",

              //  contentType: "application/json",
   

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "_nssid": sessionId  },

                // Tell YQL what we want and that we want JSON
                data: formData,
                contentType: false,  
                processData: false,  
                crossDomain: true,


                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - uploadLogo success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - uploadLogo error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - uploadLogo complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };

        /**
         * @summary: posts an object logo
         * @param {string} sessionId - the session id
         * @param {object} id - the object id    
         * @param {FormData} formData - the formData with the file info   
        */
       this.uploadFile = function(sessionId,id, formData, callback){
            var uri = this.serviceBaseURI + "file/" + id;
            console.log("%s - ajax POST %s ", getLoggingNow(), uri);

            $.ajax({
                url: uri,

                // Whether this is a POST or GET request
                type: "POST",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",

                // Tell jQuery we're expecting JSONP
            //  dataType: "json",

            //  contentType: "application/json",

            

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "_nssid": sessionId  },

                // Tell YQL what we want and that we want JSON
                data: formData,
                contentType: false,  
                processData: false,  
                crossDomain: true,


                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - uploadFile success: status: %s data:", getLoggingNow(), JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - uploadFile error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - uploadFile complete: status: %s ", getLoggingNow(),JSON.stringify(status));

                }
            });
        };
    }

    this.clientService = new ClientService(this.baseURI);

    this.userService = new UserService(this.baseURI);

    this.appService = new AppService(this.baseURI);

    this.gameService = new GameService(this.baseURI);

    this.objectService = new ObjectService(this.baseURI);

}

var nsApiClient = new NSAppClient(__env.baseURI);


var teamsUrl = nsApiClient.clientService.serviceBaseURI + "list"; 

const C_NSSID = "_nssid";

