function log(message)   {
    
    try     {
        console.log(message);
    }
    catch(err) { 
        //no action. probably just IE
    }
}
/**
   * Helper function for reading cookie
   * @param {any} key - a key
   * @returns {any} - the value or null
   */
function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

/**
 * Helper function for setting cookie
 * @param {any} key - the key to set
 * @param {any} value - the value
 */
function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

var cw;

function startWorker() {
    if (typeof (Worker) !== "undefined") {
        if (typeof (cw) == "undefined") {
            cw = new Worker("kharbga-computer.js");
        }
        cw.onmessage = function (event) {
            console.log(event.data);
        };
        cw.onerror = function (event) {
            console.log(event.data);
        };
    } else {
        console.log("Sorry! No Web Worker support.");
    }
}

function stopWorker() {
    cw.terminate();
    cw = undefined;
}