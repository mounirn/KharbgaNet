function getLoggingNow() {
    return moment().format('HH:mm:ss.SSS');
}
///
function NSAppClient(baseURI) {
    this.baseURI = baseURI;
    console.log("NSAppClient CTOR - " + this.baseURI);

    /**
     * Creates the user service object
     * @param {any} baseURI
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
            var uri = this.serviceBaseURI + "token";
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
    }

    /**
     * creates the app service object
     * @param {any} baseURI
     */
    function AppService(baseURI) {
        this.serviceBaseURI = baseURI + "api/app/";
        console.log("%s - App Service CTOR - %s ", getLoggingNow(), this.serviceBaseURI);

        /**
         */
        this.getAppInfo = function (callback) {
            var uri = this.serviceBaseURI + "info";
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

        this.getConnections = function (queryString, callback) {
            var uri = this.serviceBaseURI + "connections";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
        this.getPlayers = function (queryString, callback) {
            var uri = this.serviceBaseURI + "players";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
        this.getGames = function (queryString, callback) {
            var uri = this.serviceBaseURI + "games";
            var ret = null;
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,
                type: "GET",
                data: queryString,
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
    }

    function ClientService(baseUI){
        this.serviceBaseURI = baseURI + "api/client/";

        this.getClients = function (sessionId, searchItem, callback) {

            var queryString = {     
                nameContains: searchItem,
                
            };
            var uri = this.serviceBaseURI + "list/filter";
            console.log("%s - ajax GET %s ", getLoggingNow(), uri);
            $.ajax({
                url: uri,

                data: queryString,

                // Whether this is a POST or GET requests or DELETE
                type: "GET",

                // The name of the callback parameter, as specified by the YQL service
                //jsonp: "callback",             

                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json", "_nssid": sessionId },

                crossDomain: true,

                // Work with the response
                success: function (result, status, xhr) {
                    console.log("%s - ajax - getClients success: status: %s data:", getLoggingNow(),JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("%s - ajax - getClients error: status: %s, error: %s", getLoggingNow(),JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("%s - ajax - getClients complete: status: %s ", getLoggingNow(),JSON.stringify(status));

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
    }

    this.clientService = new ClientService(this.baseURI);

    this.userService = new UserService(this.baseURI);

    this.appService = new AppService(this.baseURI);

};
var debugURI = "http://localhost:3121/";
var prodURI = "http://api.nourisolutions.com/";
var devURI = "http://localhost/NS.API/";
var nsApiClient = new NSAppClient(debugURI);


var teamsUrl = nsApiClient.clientService.serviceBaseURI + "list"; 

const C_NSSID = "_nssid";

