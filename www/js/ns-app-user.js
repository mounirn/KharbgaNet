/** NS App Object
 * Include after: 
 * - jQuery
 * - ns-app-utils.js 
 * - ns-api-client.js
 */
if ($ == undefined || $.nsApp == undefined){
    console.log("Please include jQuery and ns-app-utils before this module");
    throw new Error("Please include jQuery and ns-app-utils");
}
if (nsApiClient == undefined){
    console.log("Please include ns-api-client before this module");
    throw new Error("Please include ns-api-client");
}
var nsApp = $.nsApp;
nsApp.init = function(){ 
   // setup all the various buttons and links events
   $('#user-state-link').on('click', _refreshUserState);
   $('#login-link').on('click', onLoginLink);  
   $('#register-link').on('click', onRegisterLink);
   $('#login-submit').on('click', onLoginSubmit);
   $('#register-submit').on('click', onRegisterSubmit);
   $('#logout-link').on('click', onLogoutSubmit);

    /* We are assuming the UI will have the above links and and a number of panels for:
    * - login: id login-panel
    * - register: id=register-panel
    * - my Account info: id=account-info-panel
    * Also the followings for messages:
    * - Welcome message: id=welcome-message
    * - Account logging status: id="account-message"
    * In addition the utils message is also used
    */
    /**
     * Handler for login click from UI
     * @param {any} e
     */
    function onLoginLink(e) {
        e.preventDefault();

     //   var accountTab = $('#main-tabs a[href="#account"]');
     //   if (accountTab != null &&  accountTab.tab != null &&  accountTab.tab != undefined)
    //        accountTab.tab('show');  

     //   $('#login-panel').show().removeClass('hidden');
     //   $('#register-panel').hide().addClass('hidden');
        transferToLogin();
    }
    /**
     * Handler for register click from UI
     * @param {any} e
     */
    function onRegisterLink(e) {
        e.preventDefault();

     //   var accountTab = $('#main-tabs a[href="#account"]');
     //   if (accountTab != null &&  accountTab.tab != null &&  accountTab.tab != undefined)
     //       accountTab.tab('show');

      //  $('#login-panel').hide().addClass('hidden');
      //  $('#register-panel').show().removeClass('hidden');

      transferToRegister();
    }

 
    /**
     * handler for login request 
     * @param {any} e
     */
    function onLoginSubmit(e) {
        e.preventDefault();
        var form = $('#login-form');

        // check if the form is valid
        if (!form.valid()) {
            displayAccountMessage("Please fix the input errors below.",false);
            return false;
        }

        var loginInfo = {
            LoginID: $('#login-id').val(),
            Password: $('#login-pwd').val(),
            RememberMe: $('#login-remember').is(':checked')
        };
        displayAccountMessage("Processing... ");

        var result = nsApiClient.userService.validateLogin(loginInfo, function(data, status) {
            if (data != null) {               
                displayAccountMessage("Logged in successfully",true);                    
                console.log(data);
                setupClientStateWithSession(data.object);           
                if ($.appViewHandler != null && typeof($.appViewHandler.closeLoginPanel) === 'function')
                    $.appViewHandler.closeLoginPanel();

               transferToPlay();
            }
            else {
                setupClientStateWithSession(null);
            
                if (status.status === 404 || status.status === 400  )
                    displayAccountMessage("Invalid user name or password",false);
                else
                   displayAccountMessage("Failed to login. Error: " + error.status,false);

                $('#appInfo').html("<pre> " + JSON.stringify(status) + " </pre>");
            }  
        });
    }

    /**
     * handler for register request 
     * @param {any} e
     */
    function onRegisterSubmit(e) {
        e.preventDefault();
        var form = $('#register-form');
      
        // check if the form is valid
        if (!form.valid()) {
            displayAccountMessage("Please fix the input errors below.",false);
            return false;
        }

        var registerInfo = {
            LoginID: $('#register-login-id').val(),
            Password: $('#register-pwd').val(),
            ConfirmPassword: $('#register-pwd-confirm').val(),
            Name: $('#register-name').val(),
            Email: $('#register-email').val(),
            OrgName: $('#register-team').val()

        };
        displayAccountMessage("Processing...");

        var result = nsApiClient.userService.register(registerInfo, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                console.log(data);
                setupClientStateWithSession(data.object);      
                transferToPlay();
                displayAccountMessage("Registered new account successfully. ",true);
                if ($.appViewHandler != null && typeof($.appViewHandler.closeRegisterPanel) === 'function')
                    $.appViewHandler.closeRegisterPanel();
            }
            else {
                setupClientStateWithSession(null);
               
                if (status.status === 404 || status.status === 400)
                    $('#account-message').html("<div class='alert alert-danger'>Invalid registration info. Errors: " + status.responseText+ " </div>");
                else
                    $('#account-message').html("<div class='alert alert-danger'> Failed to register.</div>");

                $('#appInfo').html("<div class='panel panel-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
            }
        });
    }

    function transferToMyAccount(){
        document.location= "../html/my-account.html";
    }
    function transferToPlay(){
        document.location= "../html/play.html";
    }
    function transferToLogin(){
        document.location= "../html/login.html";
    }
    function transferToRegister(){
        document.location= "../html/register.html";
    }
    /**
    * handler for logout request
    * @param {any} e
    */
    function onLogoutSubmit(e) {
        e.preventDefault();
        if ($.nsApp.session == null ||$.nsApp.session.sessionId.length < 10)
        {         
            transferToMyAccount(); 
            displayAccountMessage("You are not logged in");
            return; 
        }
        displayAccountMessage("Processing...");
        // add call for back-end to delete the session
        nsApiClient.userService.logout($.nsApp.session.sessionId, function (data,status) {
            if (data != null ) {   
                setupClientStateWithSession(null);
                transferToLogin(); 
                displayAccountMessage("Logged out successfully");
            }
            else {
                setupClientStateWithSession(null);      
                transferToLogin();
                displayAccountMessage("You are not logged in");
            } 
        });
    }

    function setupFormsValidation() {
        $('#login-form').validate();
        $('#register-form').validate();
    }

    /**
     * @summary Sets up the dropdown list for a the teams field
     */
    function setupTeamsHtml5Combobox(){
        $("#register-team").on('keyup', function () {
            var val = this.value;
            if (val.length < 3)
                return;
            var result = nsApiClient.clientService.getClients("", val, function (data, status) {
                if (data != null) {
                    //   $('#appInfo').html(JSON.stringify(data));
                    $("#register-team-list").empty();
                    $.each(data, function () {
                        // if (this.Status == 0 || this.Status = 1)
                        $("#register-team-list").append("<option id=client_'" + this.systemId + "' value='" + this.name + "' ></option>");
                    });
                }
                else {
                    $('#appInfo').html("<div class='alert alert-danger'> <pre> " + JSON.stringify(status) + " </pre> </div>");
                }
            });
        });
    }
 
    function displayAccountMessage(message, success){
        if (success == undefined){
            $('#account-message').html("<div class='alert alert-info'>" + message + "</div>");
            nsApp.displayInfoMessage(message);
        }else if (success === true){
            $('#account-message').html("<div class='alert alert-success'>" + message + "</div>");
            nsApp.displaySuccessMessage(message);
        }
        else if (success === false){
            $('#account-message').html("<div class='alert alert-danger'>" + message + "</div>");
            nsApp.displayErrorMessage(message);
        }else{
            $('#account-message').html("<div class='alert alert-warning'>" + message + " - " + success+ "</div>"); 
            nsApp.displayInfoMessage(message + " - " + success);
        }   
    }           

    /**
     * @summary checks the session coockie
     */
    function checkSessionCookie() {
        var cookie = nsApp.getCookie(C_NSSID);
        if (typeof(cookie) === "string" && cookie.length > 10)
            checkSession(cookie);       
        else{
            // check local storage
            if (window.localStorage != null){
                var sid = window.localStorage.getItem(C_NSSID);
                if (typeof sid  === "string" && sid.length > 10)
                    checkSession(sid);   
                else{
                    setupClientStateWithSession(null);  
                }
            }
            else{
                setupClientStateWithSession(null);
            }
        }
    }

    /**
     * checks a given session with the back end and update the UI accordingly
     * @param {any} sessionId the session id
     */
    function checkSession(sessionId) {
        displayAccountMessage("Processing...");
        var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                displayAccountMessage("");

                var session = data.object;
                
                if (session != null) {
                    setupClientStateWithSession(session);
                    
                }
                else {
                    setupClientStateWithSession(null);
                }
                if (nsApp.state.loadAccountInfo === true)
                    _loadAccountInfo();

                if (nsApp.state.loadTeamInfo === true)
                    _loadTeamInfo();

            }
            else {
                nsApp.setSession(null);
                setupMyAccount();
                if (status.status === 404 || status.status === 400)
                    displayAccountMessage("Invalid Session - Please Login", false);
                else
                    displayAccountMessage("Failed to access the system. Please try your request again later.",false);

            }
        });
    }

    /**
     * @summary Sets up the MyAccount tab based on the current app client state
     */
    function setupMyAccount() {
        if (nsApp.isLoggedIn() === true) {
         //   $('#account-info-panel').show().removeClass('hidden');
            $('#account-welcome').show().removeClass('hidden');
            $('#account-welcome').html("<strong> Welcome " + nsApp.user.name + "</strong>");
            $('#login-li').hide().addClass('hidden');
            $('#register-li').hide().addClass('hidden');
            $('#logout-li').show().removeClass('hidden');
        //    $('#login-panel').hide().addClass('hidden');
        //    $('#register-panel').hide().addClass('hidden');
            displayAccountMessage("Welcome " + nsApp.user.name);
        
            $('#account-session-id').text(nsApp.session.sessionId);
            if (nsApp.user.session!= null){
                nsApp.dumpObjectInfo(nsApp.session,'user-session-info-table',true);
            }
    

        } else {
         //   $('#login-panel').show().removeClass('hidden');
         //   $('#register-panel').hide().addClass('hidden');
         //   $('#account-info-panel').hide().addClass('hidden');
            $('#account-welcome').hide().addClass('hidden');
            $('#login-li').show().removeClass('hidden');
            $('#register-li').show().removeClass('hidden');
            $('#logout-li').hide().addClass('hidden');
            displayAccountMessage("");
        }
        $('#account-name').text(nsApp.user.name);
      //  $('#account-org-id').text(nsApp.state.session.clientId);
        
    }

    /**
    * @summary sets up the client state with the given session
    * @param {any} session - the session info
    */
    function setupClientStateWithSession(session) {
        nsApp.setSession(session);
        setupMyAccount();
    }


  
    $('#refreshAppInfo-submit').on('click', onRefreshAppInfo);
    /**
     * handler for refresh app info request
     * @param {any} e
     */
    function onRefreshAppInfo(e) { 
        if (e!= null)     
            e.preventDefault();
        _refreshAppInfo();

    }

    function _refreshAppInfo(){
        $("#api-url").text(nsApiClient.baseURI);
       // $('#help-message').html("<div class='alert alert-info'>Processing...</div>");
   
        nsApiClient.appService.getAppInfo(function (data, status) {
            if (data != null) {
                nsApp.dumpObjectInfo(data,'app-info-table',true);
            }
            else {
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                $('#appInfo').html('');
            }
        });
    }
    $('#app-state-link').on('click', _refreshAppState);

    function _refreshAppState(e){
        if (e!= null)
            e.preventDefault();
            
        nsApp.dumpObjectInfo(nsApp.state,'app-state-table');  
      
    }


    $('#user-state-link').on('click', _refreshUserState);
    function _refreshUserState(e){
        if (e!= null)
            e.preventDefault();
        nsApp.dumpObjectInfo(nsApp.user,'user-state-table',true);         
    }
    $('#account-link').on('click', _loadAccountInfo);
    function _loadAccountInfo(){
      
        if (nsApp.isLoggedIn() === false){
            return;
        }
        nsApiClient.userService.getAccountInfo(nsApp.session.sessionId, function (data, status) {
            if (data != null) {
                nsApp.user.account = data.object;
                nsApp.dumpObjectInfo(data.object,'user-info-table',true);
            }
            else {
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
               displayAccountMessage("Unable to load user info. Error: " + status.toString());
            }
        });
    }

    $('#team-link').on('click', _loadTeamInfo);
    function _loadTeamInfo(){
        if (nsApp.isLoggedIn() === false){
            return;
        }
        nsApiClient.clientService.getClientInfo(nsApp.session.sessionId, function (data, status) {
            if (data != null) {
                nsApp.user.team = data.object;
                nsApp.dumpObjectInfo(data.object,'team-info-table',true);
            }
            else {
                nsApp.user.team = null;
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
               displayAccountMessage("Unable to load team info. Error: " + status.toString());
            }
        });
    }

 
    /** 
     * @summary checks the session cookie, setup 
     * the form with any data  
     * @param {boolean} loadTeamInfo load team info option
     */ 
    this.setup = function (loadTeamInfo) {
     

        nsApp.state.loadAccountInfo = loadTeamInfo;
        nsApp.state.loadTeamInfo = loadTeamInfo;

        checkSessionCookie();
        setupTeamsHtml5Combobox();   
        setupMyAccount();
        setupFormsValidation();

    };

};
nsApp.init(); // init 