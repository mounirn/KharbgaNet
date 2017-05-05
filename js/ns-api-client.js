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
        console.log("User Service CTOR - " + this.serviceBaseURI);

        this.checkSession = function (sessionId, callback) {
            var uri = this.serviceBaseURI + "token";

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
                    console.log("ajax - checkSession success: status: %s data:", JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - checkSession error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - checkSession complete: status: %s ", JSON.stringify(status));

                }
            });

        };
        this.validateLogin = function (loginInfo, callback) {
            var uri = this.serviceBaseURI + "token";

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
                    console.log("ajax - validateLogin success: status: %s data:", JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - validateLogin error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - validateLogin complete: status: %s ", JSON.stringify(status));

                }
            });

        };
        this.logout = function (sessionId, callback) {
            var uri = this.serviceBaseURI + "token";

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
                    console.log("ajax - logout success: status: %s data:", JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - logout error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - logout complete: status: %s ", JSON.stringify(status));

                }
            });

        };
        this.register = function (registerInfo, callback) {
            var uri = this.serviceBaseURI + "register";

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
                    console.log("ajax - register success: status: %s data:", JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - register error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - register complete: status: %s ", JSON.stringify(status));

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
        console.log("App Service CTOR - " + this.serviceBaseURI);

        /**
         */
        this.getAppInfo = function (callback) {
            var uri = this.serviceBaseURI + "info";
            var ret = null;

            $.ajax({
                url: uri,
                type: "GET",
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("ajax - getAppInfo success: status: %s data:", JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("ajax - getAppInfo error: status: %s,  error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("ajax - getAppInfo complete: status: %s", JSON.stringify(status));

                }
            });

            return ret;
        };

        this.getConnections = function (queryString, callback) {
            var uri = this.serviceBaseURI + "connections";
            var ret = null;

            $.ajax({
                url: uri,
                type: "GET",
                data: queryString, 
                contentType: "application/json",
                //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                // Work with the response
                success: function (data, status, xhr) {
                    console.log("ajax - getConnections success: status: %s data:", JSON.stringify(status));
                    console.log(data);
                    callback(data, status);
                },
                error: function (xhr, status, errorThrown) {
                    console.log("ajax - getConnections error: status: %s,  error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status, errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("ajax - getConnections complete: status: %s", JSON.stringify(status));

                }
            });

            this.getPlayers = function (queryString, callback) {
                var uri = this.serviceBaseURI + "players";
                var ret = null;

                $.ajax({
                    url: uri,
                    type: "GET",
                    data: queryString,
                    contentType: "application/json",
                    //  headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "OAuth oauth_token=ACCESSTOKEN" },
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    // Work with the response
                    success: function (data, status, xhr) {
                        console.log("ajax - getPlayers success: status: %s data:", JSON.stringify(status));
                        console.log(data);
                        callback(data, status);
                    },
                    error: function (xhr, status, errorThrown) {
                        console.log("ajax - getPlayers error: status: %s,  error: %s", JSON.stringify(status), errorThrown);
                        callback(null, status, errorThrown);
                    },
                    complete: function (xhr, status) {
                        console.log("ajax - getPlayers complete: status: %s", JSON.stringify(status));

                    }
                });
                return ret;
            }
            return ret;
        }
    }


    function ClientService(baseUI){
        this.serviceBaseURI = baseURI + "api/client/";

        this.getClients = function (sessionId, searchItem, callback) {

            var queryString = {     
                nameContains: searchItem,
                
            };
            var uri = this.serviceBaseURI + "list/filter";

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
                    console.log("ajax - getClients success: status: %s data:", JSON.stringify(status));
                    console.log(result);
                    callback(result, status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - getClients error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - getClients complete: status: %s ", JSON.stringify(status));

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
var nsApiClient = new NSAppClient(prodURI);


var teamsUrl = nsApiClient.clientService.serviceBaseURI + "list"; 

const C_NSSID = "_nssid";

