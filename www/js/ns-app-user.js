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
                   displayStatus(status);
            }  
        });
    }

    function parseBoolean(str) {
        if (str == null || typeof(str) == undefined)
            return undefined;
        var lowerCase = str.toLowerCase();
        if (lowerCase == 'true' ) return true;
        else if (lowerCase == 'false') return false;
        else return undefined;
    }
    /**
     * @summary reads the user preferences from the db and sets up the user preferences object
     */
    function loadUserPreferences(){
        if (nsApp.isLoggedIn() !== true){
            return;
        }
        nsApiClient.userService.getPreferences(nsApp.session.sessionId, 
            function (data, status) {
                if (data != null && data.success === true && data.object!=null) {
                
                    console.log(data);
                    displayAccountMessage("Successfully loaded user preferences", true);     
                    data.object.forEach(function(item,val){
                        var obj  = nsApp.user.preferences[item.key];
                        if (obj!= null){
                            var objType = typeof(obj);
                            if (objType == "boolean"){
                                nsApp.user.preferences[item.key] = parseBoolean(item.value);
                            }
                            else if (objType == "number"){
                                nsApp.user.preferences[item.key] = Number.parseInt(item.value);
                            }
                            else{
                                nsApp.user.preferences[item.key] =item.value;
                            }
                        }
                        else{
                            nsApp.user.preferences[item.key] = item.value;
                        }
                    });
                    OutputUserPreferences();               
                }
                else{
                    displayAccountMessage("Failed to load user preferences", false);
                }    
            }
        );
    }

    function OutputUserPreferences(){
        var htmlForm ="";
     //   var htmlForm = '<form id="user-preferences-form">';
        // output the preferences in the table
        Object.keys(nsApp.user.preferences).forEach(function(key){
           
            var obj  = nsApp.user.preferences[key];
            var objType = typeof(obj);
            if (objType === "boolean"){
                htmlForm+= '<div class="col-sm-offset-6 col-sm-6"><div class="checkbox" >';
                htmlForm += '<label class="strong"><strong><input type="checkbox" id="user-'; 
                htmlForm += key;
                htmlForm += '" ';
                if (obj === true){
                    htmlForm+= ' checked ';
                }
                htmlForm  += '> ';
                htmlForm += toDisplayString(key);
                htmlForm += '</strong></label></div><hr></div>'; 
            }
            else{
                 htmlForm+= '<div class="form-group">';
                 htmlForm += '<label class="control-label col-sm-6" for="user-';
                 htmlForm += key;
                 htmlForm += '">';
                 htmlForm += toDisplayString(key);
                 htmlForm += '</label>';
                 htmlForm += '<div class="col-sm-6"><input id="user-';
                 htmlForm += key;
                 htmlForm += '" class="form-control" ';
                 if (objType === "number"){
                    htmlForm += ' type="number" ';
                 }
                 else{
                     if (key.toLowerCase().indexOf("color")  >= 0)
                     {
                        htmlForm += '" type="color" ';  
                     }
                     else{

                        htmlForm += '" type="text" ';
                     }
                }
                htmlForm += ' /> ';
                if (key.toLowerCase().indexOf("avatar")  >= 0){   
                    if (obj.length > 0)
                        htmlForm += '<img src="'+ obj + '" alt="Avatar" class="avatar"></img>';
                
                }
                htmlForm+= "</div></div>";
            }

            
        });

      //  htmlForm += '</form>';
        $('#user-preferences-form-body').html(htmlForm);

        // set the values
        Object.keys(nsApp.user.preferences).forEach(function(key){
            $('#user-'+key).attr('value',nsApp.user.preferences[key]);
        } );
    }

    $('#save-user-preferences').on('click',saveUserPreferences);

    function toBaseType(type){  // See BaseType.cs
        if (type === "string")
            return 12;
        else if (type === "number")
            return 11;
        else if (type == "boolean")
            return 15;
        else if (type == "object")
            return 18;
        else
            return 18;  
    }
    function saveUserPreferences(e){  
        if (e!= null)
            e.preventDefault();
        
        var list = [];
        // read the prefs
        Object.keys(nsApp.user.preferences).forEach(function(key){
            var obj  = nsApp.user.preferences[key];
            var objType = typeof(obj);
            if (objType === "boolean"){
                nsApp.user.preferences[key] = $('#user-'+key).is(":checked");
            }
            else if (objType === "number"){
                nsApp.user.preferences[key] = Number.parseInt($('#user-'+key).val());
            }
            else{
                nsApp.user.preferences[key] = $('#user-'+key).val();
            }
            var item = {
                id: 0,
                AppObjectId : 0,
                BaseType: toBaseType(typeof(nsApp.user.preferences[key])),
                key: key,
                value: nsApp.user.preferences[key]
            };
            list.push(item);
        } );

        nsApiClient.userService.savePreferences(nsApp.session.sessionId, list,function (data, status) {
            if (data != null) {
              
                console.log(data);
                if (data.success === true){
                    displayAccountMessage("Successfully saved user preferences", true);
                    return;
                }
                
            }
           
            displayAccountMessage("Failed to save user preferences. Error: " + status, false);  
   
        }
        );
        
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
                   displayStatus(status);
            }
        });
    }

    function transferToMyAccount(){
        document.location= "../html/my-account.html";
    }

    /**
     * @summary transfers the user to the the play page
     */
    function transferToPlay(){
        document.location= "../html/play.html";
    }

    /**
     * @summary transfers the user to the login page
     */
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
            nsApp.displayNetMessage(message,success);
        }else if (success === true){
            $('#account-message').html("<div class='alert alert-success'>" + message + "</div>");
              nsApp.displayNetMessage(message, success);
        }
        else if (success === false){
            $('#account-message').html("<div class='alert alert-danger'>" + message + "</div>");
             nsApp.displayNetMessage(message,success);
        }else{
            $('#account-message').html("<div class='alert alert-warning'>" + message + " - " + success+ "</div>"); 
             nsApp.displayNetMessage(message + " - " + success);
        }   
    }           

    /**
     * @summary checks the session cookie
     */
    function checkSessionCookie(e) {
        if (nsApp.loggingOn) console.log("user.checkSessionCookie");
        if (e!= null){
            e.preventDefault();
        }
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
        if (nsApp.loggingOn) console.log("user.checkSession");
            displayAccountMessage("Processing...");
        var result = nsApiClient.userService.checkSession(sessionId, function (data, status) {
            if (data != null) {
                $('#appInfo').html(JSON.stringify(data));
                displayAccountMessage("");

                var session = data.object;
                
                if (session != null) {
                    setupClientStateWithSession(session);
                  //  loadUserPreferences();
                }
                else {
                    setupClientStateWithSession(null);
                }
                if (nsApp.state.loadAccountInfo === true){
                    _loadAccountInfo();
                    nsApp.state.loadAccountInfo = false;
                }

                if (nsApp.state.loadTeamInfo === true){
                    _loadTeamInfo();
                    nsApp.state.loadTeamInfo = false;
                }
            }
            else {
                nsApp.setSession(null);
                
                setupMyAccount();
                displayStatus(status);
            
            }
        });
    }

    function displayStatus(status){
        if (status == null || typeof status.status !== "number" )
            return; 

        if (status.status === 404 || status.status === 400)
            displayAccountMessage("Not found", false);
        else
            displayAccountMessage("Failed to access the system. Please try your request again later.",false);
    }

    /**
     * @summary Sets up the MyAccount tab based on the current app client state
     */
    function setupMyAccount() {
        if (nsApp.loggingOn) console.log("setupMyAccount");
        if (nsApp.isLoggedIn() === true) {
         //   $('#account-info-panel').show().removeClass('hidden');
            $('#account-link').show().removeClass('hidden'); 
            $('#account-welcome').show().removeClass('hidden');
            $('#account-welcome').html("<strong> Welcome " + nsApp.user.name + "</strong>");
            $('#login-li').hide().addClass('hidden');
            $('#login-link').hide().addClass('hidden');
            $('#login-popup').hide().addClass('hidden');
            $('#register-link').hide().addClass('hidden');
            $('#register-li').hide().addClass('hidden');
            $('#logout-li').show().removeClass('hidden');
        //    $('#login-panel').hide().addClass('hidden');
        //    $('#register-panel').hide().addClass('hidden');
        //    displayAccountMessage("Welcome " + nsApp.user.name);
        
            $('#account-session-id').text(nsApp.session.sessionId);
            if (nsApp.user.session!= null){
                nsApp.displayObjectInfo(nsApp.session,'user-session-info',true, {
                    fullName: {},
                    lastAccess: {},
                    createdOn: {},
                    accountId: { type:"url", title:"Account",
                        url: "../html/user.html?id={?}"
                    }
                });
            }
    

        } else {
         //   $('#login-panel').show().removeClass('hidden');
         //   $('#register-panel').hide().addClass('hidden');
         //   $('#account-info-panel').hide().addClass('hidden');
            $('#account-link').hide().addClass('hidden'); 
            $('#account-welcome').hide().addClass('hidden');
            $('#login-link').show().removeClass('hidden');
            $('#login-popup').show().removeClass('hidden');
            $('#register-link').show().removeClass('hidden');
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
        if (nsApp.loggingOn) console.log("user.setupClientStateWithSession");
        nsApp.setSession(session);

        setupMyAccount();

        if (session === null && nsApp.state.transferToLogin === true){
            transferToLogin();
        }
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
                var displayRules =   {
                        firstName: {},
                        lastName: {}, 
                        birthDate: {}, 
                        createdOn: {},
                        lastLogin: {},
                        imageUrl: {
                            type: "img",
                            title:"Avatar"
                        }
                    };
                nsApp.displayObjectInfo(data.object,'user-account-info',true, displayRules);
            }
            else {
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
               displayAccountMessage("Unable to load user info. Error: " + status.statusText, false);
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
                var displayRules =    {
                        name: {},
                        createdOn: {},
                        mainUserId: { type:"url", title:"Captain",
                            url: "../html/user.html?id={?}"
                        }
                    };
                nsApp.displayObjectInfo(data.object,'user-team-info',true, displayRules );
            }
            else {
                nsApp.user.team = null;
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
               displayAccountMessage("Unable to load team info. Error: " + status.statusText, false);
            }
        });
    }

    $('#team-members-link').on('click', _loadTeamMembers);
    function _loadTeamMembers(){
        if (nsApp.isLoggedIn() === false){
            return;
        }
        nsApiClient.clientService.getClientMembers(nsApp.session.sessionId, function (data, status) {
            if (data != null) {
                nsApp.user.teamMembers = data.object;
                var displayRules =    {
                    name: {},
                    id: { type:"url", title:"Account",
                        url: "../html/user.html?id={?}"
                    }
                };
                displayUserList(data.object,'team-members-list',true,displayRules);
            }
            else {
                nsApp.user.teamMembers = null;
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
               displayAccountMessage("Unable to load team members. Error: " + status.statusText, false);
            }
        });
    }
    /**
     * @summary outputs user list 
     * @param {any} list  - an array of objects
     * @param {string} elementId - the id of the element table to output the html
     * @param {boolean} clear - clear the previous data or not
     * @param {object} rules - defines how to handle each field in the list item
     */
    function displayUserList(list, elementId, clear){ 
        if (clear === true){
            $('#' + elementId ).html(""); 
        }
        var html = "<ul class='list-group dropdown'>";
        $.each(list, function(item,data){                   
            html += ( "<li class='list-group-item'>");
            html += "<a href='../html/user.html?id=" + data.systemId;
            html += "'><div class='row'>"
            html+="<div class='col-xs-3 col-sm-4'>";
            if (typeof(data.imageUrl) == "string")
            {
                
                html+="<img src='"+data.imageUrl + "' style='max-height:60px;'>";
                
            } 
            html+="</div>";
            html+="<div class='col-xs-9 col-sm-8'>";
            html+= data.name;
            html+="</div>"
           html+= "</div></a></li>";
           
        });
        html+= "</ul>"
         $('#' + elementId).html(html);
    }

    $('#upload-logo').click(function () {  
        if ($('#file-logo').val() == '') {  
            displayAccountMessage("Please select file to upload",false);
            return;  
        }  

        var formData = new FormData();  
        var file = $('#file-logo')[0];  
        formData.append('uploadedLogo', file.files[0]);  
        nsApiClient.userService.uploadLogo(nsApp.session.sessionId, formData,
            function (data, status) {
                if (data != null) {
                    displayAccountMessage("Uploaded file successfully ",true);
                    _loadAccountInfo();
                }
                else {
                  
                  //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                   displayAccountMessage("Unable to load file. Error: " + status.statusText, false);
                }
        });
    });  

    $('#upload-file').click(function () {  
        if ($('#file-file').val() == '') {  
            displayAccountMessage("Please select file to upload",false);
            return;  
        }  

        var formData = new FormData();  
        var file = $('#file-file')[0];  
        formData.append('uploadedFile', file.files[0]);  
        nsApiClient.objectService.uploadFile(nsApp.session.sessionId, nsApp.user.account.id, formData,
            function (data, status) {
                if (data != null) {
                    displayAccountMessage("Uploaded file successfully " + data);
                }
                else {
                    nsApp.user.teamMembers = null;
                  //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                   displayAccountMessage("Unable to load file. Error: " + status.toString());
                }
        });
    });  

    $('#session-link').on('click', checkSessionCookie);
 
    /** 
     * @summary checks the session cookie, setup 
     * the form with any data  
     * @param {boolean} loadTeamInfo load team info option
     * @param {boolean} transferToLogin transfer to login page if invalid session
     */ 
    this.setup = function (loadTeamInfo,transferToLogin) {
        if (nsApp.loggingOn) console.log("user.setup");

        nsApp.state.loadAccountInfo = loadTeamInfo;
        nsApp.state.loadTeamInfo = loadTeamInfo;
        nsApp.state.transferToLogin = transferToLogin;

        checkSessionCookie();

        setTimeout(function(){ 
            setupTeamsHtml5Combobox();   
            loadUserPreferences();
            setupMyAccount();
            setupFormsValidation();         
            _loadAccountInfo();
            if (loadTeamInfo){
                _loadTeamInfo();
                _loadTeamMembers();
            }        
            
        },4000); // wait for the check session to complete

    };

};
nsApp.init(); // init 