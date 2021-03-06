// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

var clientNames = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
//var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
//colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;    

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        var type = '';
        var data = {};
        var json = JSON.parse(message.utf8Data);

        console.log(message.utf8Data);

        if (message.type === 'utf8') {
            type = json.type;
            data = json.data;             

            switch (type) {
                case 'join':
                    for (var it = 0; it < clients.length; it++) {                                                                                                      
                        clients[it].sendUTF(JSON.stringify(
                            { 
                                type:'msg', 
                                data: {
                                    author: 'Server',
                                    text: data.name + ' was joined to Server!',
                                    time: (new Date()).getTime()
                                }
                            }
                        ));                                  
                    }                  
                    clientNames.push(data.name);                 
                    break;
                case 'msg':
                    //we want to keep history of all sent messages
                    var textMessage = {
                        time: (new Date()).getTime(),
                        text: data.text,
                        author: data.name                       
                    };
                    history.push(textMessage);
                    history = history.slice(-100);

                    //broadcast message to all connected clients
                    var str = JSON.stringify({ type:'msg', data: textMessage });
                    for (var it = 0; it < clients.length; it++) {
                        clients[it].sendUTF(str);
                    }
                    break;
                case 'list':                    
                    connection.sendUTF(JSON.stringify(
                        {
                            type:'msg', 
                            data: {
                                author: 'Server',
                                text: 'List of users: ' + clientNames.join('; '),
                                time: (new Date()).getTime()                                
                            }    
                        }
                    ));
                    break;
                case 'catch':                    
                    for (var it = 0; it < clients.length; it++) {                                                                                                      
                        clients[it].sendUTF(JSON.stringify(
                            {
                                type:'spyon',
                                data: {
                                    name: data.name
                                }
                            }
                        ));                                     
                    }
                    break;
                case 'uncatch':                    
                    for (var it = 0; it < clients.length; it++) {                                               
                        clients[it].sendUTF(JSON.stringify(
                            {
                                type:'spyoff',
                                data: {
                                    name: data.name
                                }
                            }
                        ));                                                                         
                    }
                    break;
                default:
                    console.log((new Date()) + ' Wrong message type.');
                    break;
            }
        }        
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            clientNames.splice(index, 1);            
        }
    });

});