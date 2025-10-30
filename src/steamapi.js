"use strict";

var request = require(__dirname + "/request");
var db = require(__dirname + "/db");

/**
 * Steam utils
 */
var steamapi = {};

/**
 * Request to our api
 * @param {string} type
 * @param {string[]} ids
 * @param {function} callback
 */
steamapi.request = function (type, ids, callback) {
    if (!ids.length) {
        callback({});
        return;
    }
    var res = {};
    var missingIds = [];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var steamData = steamapi.getDataForId(type, id);
        if (steamData) {
            res[id] = steamData;
        } else {
            missingIds.push(id);
        }
    }
    if (missingIds.length) {
        // Получаем API ключ из конфигурации
        var config = require(__dirname + "/config");
        if (!config.steamApiKey) {
            // Если API ключ не задан, возвращаем только кэшированные данные
            callback(res);
            return;
        }
        
        var apiKey = config.steamApiKey;
        var url = null;
        
        if (type == "summaries") {
            url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + apiKey + "&steamids=" + missingIds.join(",");
        } else if (type == "bans") {
            url = "https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=" + apiKey + "&steamids=" + missingIds.join(",");
        } else {
            callback(res);
            return;
        }
        
        request.get(url, false, function (result) {
            if (result !== null && result.length > 0) {
                var steamData = null;
                try {
                    var data = JSON.parse(result);
                    if (type == "bans") {
                        if(data.players){
                            for (var i = 0; i < data.players.length; i++) {
                                steamData = data.players[i];
                                steamapi.saveDataForId(type, steamData.SteamId, steamData);
                                res[steamData.SteamId] = steamData;
                            }
                        }
                    }
                    if (type == "summaries") {
                        if(data.response && data.response.players){
                            for (var i = 0; i < data.response.players.length; i++) {
                                steamData = data.response.players[i];
                                steamapi.saveDataForId(type, steamData.steamid, steamData);
                                res[steamData.steamid] = steamData;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing JSON from Steam API:", e);
                }
            }
            callback(res);
        });
    } else {
        callback(res);
    }
};

/**
 * Get db data for steamid
 * @param {string} type
 * @param {string} id
 * @returns {*}
 */
steamapi.getDataForId = function (type, id) {
    var sdb = db.get("steamapi");
    var playerData = sdb.data && sdb.data[id] ? sdb.data[id] : null;
    if (!playerData || !playerData[type]) return null;
    if (playerData[type].timestamp < (new Date().getTime() / 1000 - 86400)) {
        delete playerData[type];
    }
    return playerData[type] || null;
};

/**
 * Save db data for steamid
 * @param {string} type
 * @param {string} id
 * @param {object} data
 * @returns {*}
 */
steamapi.saveDataForId = function (type, id, data) {
    var sdb = db.get("steamapi");
    if (!sdb.data) {
        sdb.data = {};
    }
    var playerData = sdb.data[id] || {};
    data.timestamp = new Date().getTime() / 1000;
    playerData[type] = data;
    sdb.data[id] = playerData;
    sdb.write();
};

/**
 * Delete old entries
 */
steamapi.cleanup = function () {
    try {
        var sdb = db.get("steamapi");
        var data = sdb.data || {};
        var timeout = new Date() / 1000 - 86400;
        for (var steamId in data) {
            if (data.hasOwnProperty(steamId)) {
                var entries = data[steamId];
                for (var entryIndex in entries) {
                    if (entries.hasOwnProperty(entryIndex)) {
                        var entryRow = entries[entryIndex];
                        if (entryRow.timestamp < timeout) {
                            delete entries[entryIndex];
                        }
                    }
                }
            }
        }
        sdb.data = data;
        sdb.write();
    } catch (e) {
        console.error(new Date(), "Steamapi cleanup failed", e, e.stack);
    }
};

// each 30 minutes cleanup the steamapi db and remove old entries
setInterval(steamapi.cleanup, 30 * 60 * 1000);
steamapi.cleanup();

module.exports = steamapi;
