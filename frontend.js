$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');
    var sendButton = $('#send');
    var listButton = $('#list');
    var catchUser = $('#catch-user');
    var captureButton = $('#capture');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    listButton.attr('disabled', 'disabled');
    catchUser.attr('disabled', 'disabled');
    captureButton.attr('disabled', 'disabled');

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose name and join to server:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        switch (json.type) {
            case 'spyon':
                if (message.data.name === myName) {
                   addListeners(); 
                }
                break;
            case 'spyoff':
                if (message.data.name === myName) {
                   removeListeners(); 
                }
                break;
            case 'msg':
                input.removeAttr('disabled');
                addMessage(json.data.author, json.data.text, new Date(json.data.time));
                break;
            case 'history':
                for (var i=0; i < json.data.length; i++) {
                    addMessage(json.data[i].author, json.data[i].text, new Date(json.data[i].time));
                }
                break;
            default:
                console.log('Wrong type for message: ', json);
                break;
        }        
    };      

    /**
     * Send message
     */
    sendButton.on('click', sendCommand);

    /**
     * Send message with get list of users command
     */
    listButton.on('click', sendGetList);

    /**
     * Send message with capture user action
     */
    captureButton.on('click', sendCapture);

    /**
     * Send mesage when user presses Enter key
     */
    input.on('keydown', keydownSend);

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, dt) {
        content.prepend('<p><span>' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
    }

    function addListeners() {        
        ["MOUSEDOWN", "MOUSEUP", "MOUSEOVER", "MOUSEOUT", "MOUSEMOVE", "MOUSEDRAG", "CLICK", 
        "DBLCLICK", "KEYDOWN", "KEYUP", "KEYPRESS", "DRAGDROP", "FOCUS", "BLUR", "SELECT", 
        "CHANGE"].forEach(function(ev) {            
            window.addEventListener(ev.toLowerCase(), function() {
                console.log('event:', ev)
            });
        });
    }

    function removeListeners() {        
        ["MOUSEDOWN", "MOUSEUP", "MOUSEOVER", "MOUSEOUT", "MOUSEMOVE", "MOUSEDRAG", "CLICK", 
        "DBLCLICK", "KEYDOWN", "KEYUP", "KEYPRESS", "DRAGDROP", "FOCUS", "BLUR", "SELECT", 
        "CHANGE"].forEach(function(ev) {            
            window.removeEventListener(ev.toLowerCase(), function() {
                console.log('event:', ev)
            });
        });
    }

    function keydownSend(e) {
        if (e.keyCode === 13) {
            sendCommand();
        }    
    }

    function sendCommand() {
        var msg = {};

        if (myName === false) {
            var msg = {
                type: 'join'
                data: {
                    name: input.val()
                }
            }

            myName = input.val();            
            listButton.removeAttr('disabled');
            catchUser.removeAttr('disabled'); 
            captureButton.removeAttr('disabled');                       
        } else {
            var msg = {
                type: 'msg'
                data: {
                    text: input.val()
                }    
            }
        }
        
        // send the message as an ordinary text
        connection.send(msg);
        input.val('');
        // disable the input field to make the user wait until server
        // sends back response
        input.attr('disabled', 'disabled');        
    };  

    function sendGetList() {
        var msg = {};

        var msg = {
                type: 'list'
                data: {
                    name: myName
            }
        }

        connection.send(msg);
    };

    function sendCapture() {
        var msg = {};

        var msg = {
                type: 'catch'
                data: {
                    name: catchUser.val()
            }
        }

        connection.send(msg);
    };
});