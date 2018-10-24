//https://www.jvandemo.com/how-to-configure-your-angularjs-application-using-environment-variables/

(function (window) {
    window.__env = window.__env || {};
  
    // Base url
    window.__env.baseURI = 'http://localhost/NS.API_2016/';
  
    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = true;
  }(this));