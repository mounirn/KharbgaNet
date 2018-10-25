/**
 * Include after:
 * - na-apps-utils.js Different languages could be created with this file
 * 
 */
if ($ == undefined || typeof(nsApp) === "undefined" ){
    console.log("Please include na-apps-utils.js before this module");
    throw new Error("Please include jQuery");
}
/**
 * @summary Defines various strings used in the app 
 */
var NSResources = function(){
    this.Guest = "Guest";
    this.Welcome = "Welcome";
    this.Empty = "";
    this.FailedToConnect ="Failed to connect to server";
    this.ConnectedSuccessfully = "Connected to server successfully";

};
nsApp.local = "en"; // default  
nsApp.resources = new NSResources();
$.nsResources = nsApp.resources;
