"use strict";

var db = require(__dirname + "/../db");
var fs = require("fs");
var hash = require(__dirname + "/../hash");
var Widget = require(__dirname + "/../widget");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
var View = function (user, messageData, callback) {
    var myServers = {};
    var currentServer = user.getServerById(messageData.server);
    if (currentServer && !currentServer.connected) currentServer = null;
    var widgets = {};
    var serversDb = db.get("servers");
    var servers = serversDb.data ? { ...serversDb.data } : {};
    var wdb = null;
    if (currentServer) wdb = db.get("widgets", "server_" + messageData.server);
    var deeperCallback = function (sendMessageData) {
        sendMessageData.widgets = widgets;
        sendMessageData.myServers = myServers;
        if (currentServer) {
            var myWidgets = wdb.data && wdb.data.list ? [...wdb.data.list] : [];
            sendMessageData.gridrows = wdb.data ? wdb.data.gridrows : undefined;
            sendMessageData.myWidgets = [];
            if (myWidgets) {
                for (var i = 0; i < myWidgets.length; i++) {
                    var widgetData = myWidgets[i];
                    var widget = Widget.get(widgetData.id);
                    if (widget) {
                        widgetData.manifest = sendMessageData.widgets[widget.id];
                        sendMessageData.myWidgets.push(widgetData);
                    }
                }
            }
            sendMessageData.server = messageData.server;
            sendMessageData.serverConnected = currentServer && currentServer.connected;
        }
        callback(sendMessageData);
    };

    // get servers that i am allowed to see
    (function () {
        for (var i in servers) {
            var server = servers[i];
            if (server.active === false) continue;
            var found = user.userData.admin;
            var users = server.users;
            if (users) {
                for (var j = 0; j < users.length; j++) {
                    if (users[j] == user.userData.username) {
                        found = true;
                    }
                }
            }
            if (found) {
                myServers[i] = {
                    "id": server.id,
                    "name": server.name,
                    "game": server.game
                }
            }
        }
    })();
    // get all widgets
    (function () {
        var allWidgets = Widget.getAllWidgets();
        for (var allWidgetsIndex in allWidgets) {
            if (allWidgets.hasOwnProperty(allWidgetsIndex)) {
                var allWidgetsRow = allWidgets[allWidgetsIndex];
                widgets[allWidgetsRow.id] = allWidgetsRow.manifest;
            }
        }
    })();
    // widget actions
    if (messageData.action == "widget") {
        var widgetEntry = null;
        var widget = null;
        if (user.userData !== null && currentServer) {
            switch (messageData.type) {
                case "add":
                    if (user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
                        deeperCallback({"note": {"message": "server.widget.restricted", "type": "danger"}});
                        return;
                    }
                    var widget = Widget.get(messageData.widget);
                    if (widget) {
                        var widgetId = widget.id;
                        var hasWidget = false;
                        if (wdb.data && wdb.data.list) {
                            for (var i = 0; i < wdb.data.list.length; i++) {
                                if (wdb.data.list[i].id === widget.id) {
                                    hasWidget = true;
                                    break;
                                }
                            }
                        }
                        if (hasWidget) {
                            widgetId = null;
                        } else {
                            if (!wdb.data) {
                                wdb.data = {};
                            }
                            if (!wdb.data.list) {
                                wdb.data.list = [];
                            }
                            wdb.data.list.push({
                                "id": widgetId,
                                "position": wdb.data.list.length,
                                "size": widget.manifest.compatibleSizes[0],
                                "options": {},
                                "storage": {}
                            });
                            wdb.write();
                            Widget.callMethodForAllWidgetsIfActive(
                                "onWidgetAdded",
                                currentServer
                            );
                        }
                    }
                    deeperCallback({"widget": widgetId});
                    break;
                case "remove":
                    if (user.userData.readonlyoptions || user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
                        deeperCallback({"note": {"message": "server.widget.restricted", "type": "danger"}});
                        return;
                    }
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        if (wdb.data && wdb.data.list) {
                            var newList = [];
                            for (var i = 0; i < wdb.data.list.length; i++) {
                                if (wdb.data.list[i].id !== messageData.widget) {
                                    newList.push(wdb.data.list[i]);
                                }
                            }
                            wdb.data.list = newList;
                            wdb.write();
                        }
                        delete widget.storageCache[currentServer.id];
                        delete widget.optionsCache[currentServer.id];
                    }
                    deeperCallback({});
                    break;
                case "layout":
                    var widgetEntry = null;
                    if (wdb.data && wdb.data.list) {
                        for (var i = 0; i < wdb.data.list.length; i++) {
                            if (wdb.data.list[i].id === messageData.widget) {
                                widgetEntry = wdb.data.list[i];
                                break;
                            }
                        }
                    }
                    if (widgetEntry) {
                        for (var messageDataIndex in messageData.values) {
                            if (messageData.values.hasOwnProperty(messageDataIndex)) {
                                widgetEntry[messageDataIndex] = messageData.values[messageDataIndex];
                            }
                        }
                        wdb.write();
                    }
                    deeperCallback({});
                    break;
                case "storage":
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        widget.storage.set(currentServer, messageData.key, messageData.value, messageData.lifetime);
                    }
                    deeperCallback({});
                    break;
                case "option":
                    if (user.userData.readonlyoptions) {
                        deeperCallback({"note": {"message": "server.options.restricted", "type": "danger"}});
                        return;
                    }
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        widget.options.set(currentServer, messageData.option, messageData.value);
                    }
                    deeperCallback({});
                    break;
                default:
                    deeperCallback({});

            }
            return;
        }
        deeperCallback({});
        return;
    }
    deeperCallback({});
};

module.exports = View;