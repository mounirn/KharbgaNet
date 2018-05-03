
var _setupSignalR = function () {
    try {
        $.connection.hub.url = nsApiClient.baseURI + 'signalr';
        if (loggingOn) console.log("Hub URL: %s", $.connection.hub.url);
        gamesHubProxy = $.connection.gamesHub;
        $.connection.hub.logging = loggingOn;  // turn off  (config)

        if (gamesHubProxy == null || typeof gamesHubProxy.client == 'undefined') {
            setSystemError(true);
            return false;
        }

        gamesHubProxy.client.moveRecorded = onMoveRecorded;
        gamesHubProxy.client.send = onSendMessage;
        gamesHubProxy.client.hello = function () {
            if (loggingOn) console.log("%s - Hello from server", getLoggingNow());
            //  $('#message').html("<div class='alert alert-success'>Hello from server.</div>")
            // $('#messages-list').append("<li class='list-group-item'>Hello from server</li>");
        };

        gamesHubProxy.client.gameDeleted = onGameDeleted;
        gamesHubProxy.client.appendMove = onAppendMove;
        gamesHubProxy.client.gameJoined = onGameJoined;
        gamesHubProxy.client.gameCreated = onGameCreated;
        gamesHubProxy.client.setCurrentPlayer = onSetupLocalPlayer;
        gamesHubProxy.client.joined = onJoined;
        gamesHubProxy.client.left = onLeft;
        gamesHubProxy.client.rejoined = onRejoined;
        gamesHubProxy.client.pong = onPong;
        gamesHubProxy.client.messagePosted = onMessagePosted;
        gamesHubProxy.client.gameStateUpdated = onGameStateUpdated;

        return startSignalR();
    }
    catch (e) {
        setSystemError(true);
        console.log(e);
    }

    $.connection.hub.disconnected(function () {
        appClientState.signalRinitalized = false;
        setTimeout(function () {
            if (loggingOn) console.log('%s - RestartSignalR after disconnect!', getLoggingNow());
            startSignalR();
        }, 3000); // Restart connection after 3 seconds.
    });
};

_setupSignalR();

function startSignalR() {
    try {
        $.connection.hub.start({ jsonp: true, transport: ['webSockets', 'longPolling'] })
            .done(function () {
                gamesHubProxy.server.hello();
                if (loggingOn === true)
                    console.log('%s - startSignalR - connected, connection ID: %', getLoggingNow(), $.connection.hub.id);

                appClientState.serverConnectionId = $.connection.hub.id;
                appClientState.signalRinitalized = true;
                // 
                checkSessionCookie();
                // moves the setup of the games on startup at the end of the checking session process
                setSystemError(false);
            })
            .fail(function () {
                appClientState.signalRinitalized = false;
                console.log('%s - startSignalR Could not Connect!', getLoggingNow());
                setSystemError(true);
            });
    }
    catch (e) {
        setSystemError(true);
        console.log(e);
    }
}
