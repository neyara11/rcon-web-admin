"use strict";

const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const fs = require("fs");
var hash = require(__dirname + "/hash");

/**
 * LowDB helper
 */
var db = {};

/**
 * The db defaults
 * @type {object<string, *>}
 * @private
 */
db._defaults = {
    "steamapi": {},
    "servers": {},
    "settings": {},
    "users": {},
    "widgets": {"list": []}
};

/**
 * Get lowdb instance
 * @param {string} file
 * @param {string=} folder
 * @returns {LowSync}
 */
db.get = function (file, folder) {
    var path = __dirname + '/../db';
    if (folder) path += "/" + folder;
    path += "/" + file + ".json";
    
    // Create directory if it doesn't exist
    const dir = require('path').dirname(path);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create default data if file doesn't exist
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify(db._defaults[file] || {}), 'utf8');
    }
    
    var adapter = new JSONFileSync(path);
    var inst = new LowSync(adapter);
    inst.read();
    
    // if getting settings than set some defaults
    if (typeof db._defaults[file] != "undefined") {
        if (file == "settings") {
            if (!inst.data || typeof inst.data.salt === 'undefined') {
                db._defaults[file].salt = hash.random(64);
            }
        }
        if (!inst.data) {
            inst.data = db._defaults[file];
        } else {
            // Merge defaults with existing data
            for (var key in db._defaults[file]) {
                if (inst.data[key] === undefined) {
                    inst.data[key] = db._defaults[file][key];
                }
            }
        }
        inst.write();
    }
    return inst;
};

module.exports = db;