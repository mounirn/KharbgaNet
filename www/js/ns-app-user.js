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
$.nsApp.init = function(){ 
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
     * @param {any} e the event data
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
     * @summary handler for login request 
     * @param {any} e - the event data
     */
    function onLoginSubmit(e) {
        e.preventDefault();
        var form = $('#login-form');

        // check if the form is valid
        if (!form.valid()) {
            displayAccountMessage("Please fix the input errors",false);
            return false;
        }
        else{
            displayAccountMessage("",null);
        }

        var loginInfo = {
            LoginId: $('#login-id').val(),
            Pwd: $('#login-pwd').val(),
            RememberMe: $('#login-remember').is(':checked')
        };
        nsApp.displayProcessing(true);
        nsApp.displayInfoMessage("Checking Login Credentials...");

        nsApiClient.userService.validateLogin(loginInfo, function(data, status) {
            nsApp.displayProcessing(false);
            if (nsApp.isValid(data)) {               
            
                nsApp.displaySuccessMessage("Logged in Successfully.");                 
                console.log(data);
                setupClientStateWithSession(data);           
                if (nsApp.isValid($.appViewHandler) && typeof $.appViewHandler.closeLoginPanel === 'function')
                    $.appViewHandler.closeLoginPanel();

               transferToPlay();
            }
            else {
                if (nsApp.isValid(status)) {
                    if (status.status === 404 || status === 400) {
                        nsApp.displayErrorMessage("Invalid Login Id or Password. Please check your input");
                    }
                    else {
                        nsApp.handleResultNoData(data, status);
                    }
                }
                else {
                    nsApp.handleResultNoData(data, status);
                }
            }
        });
    }

    function parseBoolean(str) {
        if (str == null || typeof(str) == undefined)
            return undefined;
        var lowerCase = str.toLowerCase();
        if (lowerCase === 'true' ) return true;
        else if (lowerCase === 'false') return false;
        else return undefined;
    }
    /**
     * @summary reads the user preferences from the db and sets up the user preferences object
     */
    function loadUserPreferences(){
        if (nsApp.isLoggedIn() !== true){
            return;
        }
        nsApp.displayProcessing(true);

        nsApiClient.userService.getPreferences(nsApp.sessionId, 
            function (data, status) {
                if (nsApp.isValid(data)) {                
                    console.log(data);
                    nsApp.displayProcessing(false);    
                    data.forEach(function(item,val){
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
                    displayUserPreferences();               
                }
                else{
                
                    nsApp.handleResultNoData(data,status);   
                }    
            }
        );
    }

    function displayUserPreferences(){
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
     * @param {any} e the event data
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
        nsApp.displayProcessing(true);

        var result = nsApiClient.userService.registerClient(registerInfo, function (data, status) {
            if (nsApp.isValid(data)) {
                setupClientStateWithSession(data);      
                transferToPlay();
                nsApp.displayProcessing(false);
                if (nsApp.isValid($.appViewHandler) && typeof($.appViewHandler.closeRegisterPanel) === 'function')
                    $.appViewHandler.closeRegisterPanel();
            }
            else {
                    
                nsApp.handleResultNoData(data,status);   
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

        if (nsApp.isValid($.nsVM)){  // in a jqm app with panels
            $.nsVM.openLoginPanel();
        }
        else{
            document.location= "../html/login.html";
        }
    }
    function transferToRegister(){
        document.location= "../html/register.html";
    }
    /**
    * handler for logout request
    * @param {any} e the event data
    */
    function onLogoutSubmit(e) {
        e.preventDefault();
        var session = nsApp.getSession();
        if (!nsApp.isValid(session) || !nsApp.isValidString(session.sessionId))
        {         
            transferToMyAccount(); 
            nsApp.displayAccountMessage("You are not logged in");
            return; 
        }
        nsApp.displayProcessing(true);

        // add call for back-end to delete the session
        nsApiClient.userService.signOut(session.sessionId, function (data,status) {
            if (nsApp.isValid(data)) {          
                setupClientStateWithSession(null);    
                  nsApp.displayProcessing(false);   

                if (nsApp.isValid($.nsVM) && typeof ($.nsVM.sendMessage) === 'function'){
                    $.nsVM.sendMessage(nsApp.MSG_on_logout_done_success,data);
                }
            }
            else {
                // clear the session anyway
                setupClientStateWithSession(null);    
                nsApp.displayProcessing(false); 
              //  nsApp.handleResultNoData(data,status);   
            } 
        });
    }

    function setupFormsValidation() {
        $('#login-form').validate();
        $('#register-form').validate();
    }

    /**
     * @summary Sets up the dropdown list for a the teams field in the registration 
     * of other pages requiring a teams dropdown
     */
    function setupTeamsHtml5Combobox(){
        $("#register-team").on('keyup', function () {
            var val = this.value;
            if (val.length < 3)
                return;

            nsApp.displayProcessing(true);
            nsApiClient.clientService.getClientsLookup("", val, function (result, status) {
                if (nsApp.isValid(result) && nsApp.isValid(result.data)) {
                    nsApp.displayProcessing(false);  
                    $("#register-team-list").empty();
                    $.each(result.data, function () {
                        // if (this.Status == 0 || this.Status = 1)
                        $("#register-team-list").append("<option id=client_'" + this.systemId + "' value='" + this.name + "' ></option>");
                    });
                }
                else {
                   
                    nsApp.handleResultNoData(data,status);                      
                }
            });
        });
    }
 
    function displayAccountMessage(message, success){
       nsApp.displayAccountMessage(message,success);
    }           

    /**
     * @summary checks the session stored in cookie or local storage
     * @param {object} e - the event
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
        
        nsApp.displayProcessing(true);
        
        nsApiClient.userService.checkSession(sessionId, function (data, status) {
            nsApp.displayProcessing(false);
            if (nsApp.isValidObject(data)) {
                nsApp.displayDebugResult(data);
              

                var session = data;  
                setupClientStateWithSession(session);              
               
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
            
                nsApp.handleResultNoData(data,status);    
                                                 
            }
        });
    }

    /**
     * @summary Sets up the MyAccount information based on the current app client session state
     * Standard UI elements are used with the following ids:
     *   - account-link: My account link when logged in
     *   - account-info: display accounts information when logged in 
     *   - account-welcome: Welcome message when logged in;    
     *   - account-img: the user account image 
     *   - login-link: the login link 
     *   - register-link: register link 
     *   - logout-link: the logout link
     *   - login-li: the login list item or div 
     *   - register-li: register list item or div
     *   - logout-li: the logout list item or div
    */
    function setupMyAccount() {
        if (nsApp.loggingOn) console.log("setupMyAccount");
        var session = nsApp.getSession();
        if (nsApp.isValid(session) &&  session.isActive) {
            $('#account-link').show().removeClass('hidden'); 
            $('#account-info').show().removeClass('hidden');
            $('#account-welcome').show().removeClass('hidden');
            $('#account-welcome').html("<strong> Welcome " + session.fullName + "</strong>");
            if (nsApp.isValid(session.imageUrl)){
                $('#account-img').show().removeClass('hidden');
                $('#account-img').html("<img src='" + 
                    session.imageUrl +  "' title='" + session.fullName + 
                    "' class='img img-rounded' style='max-width:30px;max-height:30px;' />");
            }
            $('#login-li').hide().addClass('hidden');
            $('#login-link').hide().addClass('hidden');
            $('#login-popup').hide().addClass('hidden');
            $('#register-link').hide().addClass('hidden');
            $('#register-li').hide().addClass('hidden');
            $('#logout-li').show().removeClass('hidden');
            
            $('#account-session-id').text(session.sessionId);
          
            displayAccountMessage("Welcome! You are logged in", true);
            nsApp.displayObjectInfo(session,'user-session-info',true, {
                fullName: {},
                lastAccess: {},
                createdOn: {},
                imageUrl: {type:'img', title: 'Image'},
                clientId: {},  // the team id
                accountId: { type:"url", title:"Account",
                    url: "../html/user.html?id={?}"
                }
            });
            
    

        } else {
       
            $('#account-link').hide().addClass('hidden'); 
            $('#account-welcome').hide().addClass('hidden');
            $('#account-img').hide().addClass('hidden');
            $('#account-info').hide().addClass('hidden');
            $('#login-link').show().removeClass('hidden');
            $('#login-popup').show().removeClass('hidden');
            $('#register-link').show().removeClass('hidden');
            $('#login-li').show().removeClass('hidden');
            $('#register-li').show().removeClass('hidden');
            $('#logout-li').hide().addClass('hidden');

            displayAccountMessage("You are not logged in", null);
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
    }
  
    $('#refreshAppInfo-submit').on('click', onRefreshAppInfo);

    /**
     * handler for refresh app info request
     * @param {any} e - the event data
     */
    function onRefreshAppInfo(e) { 
        if (e!= null)     
            e.preventDefault();
        _refreshAppInfo();

    }

    function _refreshAppInfo(){
        $("#api-url").text(nsApiClient.baseURI);
    
        nsApp.displayProcessing(true);
        nsApiClient.appService.getAppInfo(function (data, status) {
            nsApp.displayProcessing(false);
            if (nsApp.isValid(data)) {
                nsApp.dumpObjectInfo(data,'app-info-table',true);
            }
            else {
                nsApp.handleResultNoData(data,status);    
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
        nsApiClient.userService.getAccountInfo(nsApp.sessionId, function (data, status) {
            if (nsApp.isValid(data)) {
                nsApp.user.setAccount(data);
                var displayRules =   {
                        name: {},
                        firstName: {},
                        lastName: {}, 
                        birthDate: {}, 
                        createdOn: {},
                        lastLogin: {},
                        clientId: { title: "Team Id"},
                        imageUrl: {
                            type: "img",
                            title:"Avatar"
                        }
                    };
                nsApp.displayObjectInfo(nsApp.user,'user-account-info',true, displayRules);
            }
            else {
                if (nsApp.isValid(data)){
                    nsApp.displayResult(data);
                }
                else{
              //  $('#help-message').html("<div class='alert alert-error'>" + JSON.stringify(status) + "</div>");
                    nsApp.displayAccountMessage("Unable to load user info. Error: " + status.statusText, false);
                }
            }
        });
    }

    $('#team-link').on('click', _loadTeamInfo);
    function _loadTeamInfo(){
        if (nsApp.isLoggedIn() === false){
            return;
        }
        nsApiClient.clientService.getClientInfo(nsApp.sessionId, function (data, status) {
            if (nsApp.isValid(data)) {
                nsApp.user.setTeam(data);
            //    nsApp.setAppStatus(data.object.appStatus);
                var displayRules =    {
                        name: {},
                        createdOn: {},
                        imageUrl: {  type: "img",
                            title:"Logo"
                        },
                        mainUserId: { type:"url", title:"Captain",
                            url: "../html/user.html?id={?}"
                        }
                    };
                nsApp.displayObjectInfo(nsApp.user.team,'user-team-info',true, displayRules );
            }
            else {
                nsApp.handleResultNoData(data,status);    
            }
        });
    }

    $('#team-members-link').on('click', _loadTeamMembers);
    function _loadTeamMembers(){
        if (nsApp.isLoggedIn() === false){
            return;
        }
        nsApiClient.clientService.getClientMembers(nsApp.sessionId, function (data, status) {
            if (nsApp.isValid(data)) {
                nsApp.user.teamMembers = data;
                var displayRules =    {
                    name: {},
                    systemId: { type:"url", title:"Account",
                        url: "../html/user.html?id={?}"
                    }
                };
                displayUserList(data,'team-members-list',true,displayRules);
            }
            else {
                nsApp.handleResultNoData(data,status);    
            }
        });
    }

    function displayCookieUsage(){
        var html = "We use cookies and local storage to make various functions";
        html += " work on this site and to collect data on how it is being used.";
        html += "By clicking Accept, you agree to our use of these tools for advertising, analytics and support.";  

    }

    /**
     * @summary outputs user list 
     * @param {any} list  - an array of app users
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
             var obj = data; 
             if (obj!== null && obj !== undefined) {  
                html += ( "<li class='list-group-item'>");
                html += "<a href='../html/user.html?id=" + obj.Id;
                html += "'><div class='row'>";
                html+="<div class='col-xs-3 col-sm-4'>";
            
          
                if (typeof(obj.imageUrl) === "string")
                {
                    
                    html+="<img src='"+obj.imageUrl + "' style='max-height:60px;'>";
                    
                } 
                html+="</div>";
                html+="<div class='col-xs-9 col-sm-8'>";
            //  html+= data.name;
                if (typeof obj.name === "string"){
                        html+= obj.name;
                }
                else{
                    html+= (data.firstName + " " + data.lastName);
                }
                if (data.isClientAdmin === true){
                    html += "<strong class='text-success'> (Team Captain) </strong>";
                }
                html+="</div>";
                html+= "</div></a></li>";

            }
          
           
        });
        html+= "</ul>";
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
        nsApiClient.userService.uploadLogo(nsApp.sessionId, formData,
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
        nsApiClient.objectService.uploadFile(nsApp.sessionId, nsApp.user.account.id, formData,
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
            setupMyAccount();
            setupFormsValidation();         
            _loadAccountInfo();
            if (loadTeamInfo){ 
                 loadUserPreferences();
                _loadTeamInfo();
                _loadTeamMembers();
            }        
            
        },4000); // wait for the check session to complete

    };

};
$.nsApp.init(); // init 