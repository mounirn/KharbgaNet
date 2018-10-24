function init() {
    window.fbAsyncInit = function() {
        FB.init({
            appId: '107740655926360',
            cookie: true,
            xfbml: true,
            version: 'v2.8'
        });

        FB.AppEvents.logPageView();
        checkLoginState();
    };
}

function handleLoad(e) {
    console.log('Loaded import: ' + e.target.href);
}

function handleError(e) {
    console.log('Error loading import: ' + e.target.href);
}

    function checkLoginState() {
        if (typeof FB === 'object') {
            FB.getLoginStatus(function(response) {
                statusChangeCallback(response);
            });
        }
    }

    function statusChangeCallback(response) {
        console.log('statusChangeCallback');
        console.log(response);
        // The response object is returned with a status field that lets the
        // app know the current login status of the person.
        // Full docs on the response object can be found in the documentation
        // for FB.getLoginStatus().
        if (response.status === 'connected') {
            // Logged into your app and Facebook.
            testAPI();
            $('#loginButton').hide();
            $('#logoutButton').show();
        } else {
            // The person is not logged into your app or we are unable to tell.
            $('#loginButton').show();
            document.getElementById('status').innerHTML = 'Please log ' +
                'into this app.';

            $('#logoutButton').hide();
        }
    }

    // Here we run a very simple test of the Graph API after login is
    // successful.  See statusChangeCallback() for when this call is made.
    function testAPI() {
        console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
            console.log('Successful login for: ' + response.name);
            console.log(response);
            document.getElementById('status').innerHTML =
                'Welcome ' + response.name + '!';
        });
    }


    $(document).ready(function() {
        $('#logout').click(function() {
            FB.logout(function(response) {
                // Person is now logged out
                console.log("Logout ", response);
                $('#loginButton').show();
            });
        });
    });

