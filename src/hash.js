"use strict";

const crypto = require('crypto');

/**
 * Hash generator
 */
var hash = {};

/**
 * Generate random hash
 * @param {number} length
 * @returns {string}
 */
hash.random = function (length) {
    return crypto.randomBytes(length / 2).toString('hex');
};

/**
 * Generate salted md5 hash
 * @param {string} str
 * @returns {string}
 */
hash.saltedMd5 = function (str) {
    var db = require(__dirname + "/db");
    var settingsDb = db.get("settings");
    var salt = settingsDb.data && settingsDb.data.salt ? settingsDb.data.salt : "";
    return crypto.createHash('md5').update(str + "" + salt).digest("hex");
};

module.exports = hash;