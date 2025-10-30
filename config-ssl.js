/**
 * User configuration for SSL setup with nginx
 * Copy to config.js to enable it
 */
var config = {
    /**
     * The host to bind the webinterface to
     * null if you want allow every hostname
     */
    "host": null,

    /**
     * The full wss:// url to the websocket
     * Required when proxying through nginx
     */
    "websocketUrlSsl": "wss://your-domain.com/ws", // Замените на ваш домен

    /**
     * The full ws://
     * Required when proxying through nginx
     */
    "websocketUrl": "ws://your-domain.com/ws", // Замените на ваш домен

    /**
     * The port for the server and websocket
     * The given number is the one for the webinterface
     * The given number + 1 is the websocket port
     * Notice that both given number and the number+1 will be required
     */
    "port": 4326,
    
    /**
     * Steam Web API Key
     * You can get this at https://steamcommunity.com/dev/apikey
     * This is required for features like player profiles, VAC/Steam ban information
     */
    "steamApiKey": null
};

module.exports = config;