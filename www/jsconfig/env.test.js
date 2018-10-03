//https://www.jvandemo.com/how-to-configure-your-angularjs-application-using-environment-variables/

(function (window) {
    window.__env = window.__env || {};  
    // Base url
    window.__env.baseURI = 'http://www.nswinhost.net/nouris/v3/';
  
    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = false;
  }(this));