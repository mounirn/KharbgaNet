/// 
function NSAppClient(baseURI) {
    this.baseURI = baseURI;
    console.log("NSAppClient CTOR - " + this.baseURI);

    /**
     * Creates the user service object
     * @param {any} baseURI
     */
    function UserService(baseURI) {
        this.serviceBaseURI = baseURI + "user/";
        console.log("User Service CTOR - " + this.serviceBaseURI);

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
                success: function (result,status,xhr) {
                    console.log("ajax - validateLogin success: status: %s data:", JSON.stringify(status));
                    console.log(result); 
                    callback(result,status);
                },
                error: function (status, errorThrown) {
                    console.log("ajax - validateLogin error: status: %s, error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status);
                },
                complete: function (xhr, status) {
                    console.log("ajax - validateLogin complete: status: %s ", JSON.stringify(status));
                  
                }
            });

        }

    }

    /**
     * creates the app service object
     * @param {any} baseURI
     */
    function AppService(baseURI) {
        this.serviceBaseURI = baseURI + "app/";
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
                    callback(data,status);
                },
                error: function (xhr,status, errorThrown) {
                    console.log("ajax - getAppInfo error: status: %s,  error: %s", JSON.stringify(status), errorThrown);
                    callback(null, status,errorThrown);
                },
                complete: function (xhr, status) {
                    console.log("ajax - getAppInfo complete: status: %s", JSON.stringify(status));
                   
                }
            });

            return ret;
        }
    }

    this.userService = new UserService(this.baseURI);

    this.appService = new AppService(this.baseURI);

};
var debugURI = "http://localhost:3121/api/";
var prodURI = "";
var devURI = "http://localhost/NS.API/api/";
var nsApiClient = new NSAppClient(debugURI);

