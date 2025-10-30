"use strict";

var WebSocketUser = require(__dirname + "/websocketuser");
var WebSocketServer = require("ws").Server;
var config = require(__dirname + "/config");

/**
 * Some tools for web socket server management
 */
var WebSocketMgr = {};

/**
 * The socket server itself
 * @type {null|WebSocketServer}
 */
WebSocketMgr.server = null;

/**
 * Start the websocket server
 */
WebSocketMgr.startServer = function () {
    try {
        if (WebSocketMgr.server === null) {
            WebSocketMgr.server = new WebSocketServer({port: config.port + 1});
            WebSocketMgr.server.on('connection', function connection(ws, req) {
                var user = new WebSocketUser(ws);
                
                // Handle incoming messages
                ws.on('message', function incoming(message) {
                    // Check if the connection is still open before processing
                    if (ws.readyState !== ws.OPEN) return;
                    
                    try {
                        // Check if message is a Buffer and convert to string if needed
                        if (Buffer.isBuffer(message)) {
                            message = message.toString('utf8');
                        }
                        user.onMessage(JSON.parse(message));
                    } catch (e) {
                        console.error(new Date(), "WebSocket message error:", e.message);
                    }
                });
                
                // Handle connection close
                ws.on("close", function () {
                    try {
                        user.onMessage({"action": "closed"});
                    } catch (e) {
                        console.error(new Date(), "WebSocket close error:", e.message);
                    }
                });
                
                // Handle connection errors
                ws.on("error", function(error) {
                    console.error(new Date(), "WebSocket error:", error.message);
                });
            });
            
            // Handle server errors
            WebSocketMgr.server.on('error', function error(err) {
                console.error(new Date(), "WebSocket server error:", err.message);
            });
            
            // if for some reason the server went down, restart it some seconds later
            WebSocketMgr.server.on('close', function close() {
                WebSocketMgr.server = null;
                WebSocketUser.instances = [];
            });
        }
    } catch (e) {
        console.error(new Date(), "Start Websocket Server error", e);
    }
};

// start websocket server and create an interval
WebSocketMgr.startServer();
// check each x seconds if the server is down and try to restart it
setInterval(WebSocketMgr.startServer, 10000);