"use strict";
/**
 * Express routes, url handling
 */

var express = require('express');
var path = require('path');
var app = express();
var config = require(__dirname + "/config");

// Основной маршрут - поддержка префикса URL
app.get("/", function (req, res) {
    // Если приложение доступно через префикс, нужно корректно отдавать index.html
    res.sendFile(path.resolve(__dirname + "/../public/index.html"));
});

// Middleware для обработки доверенных прокси (для корректной работы с nginx)
app.set('trust proxy', true);

// Middleware для статических файлов до универсального маршрута
app.use(express.static(__dirname + "/../public"));

// output the required ws port number
app.get("/wsconfig", function (req, res) {
    // Получаем basePath из заголовка, переданного nginx
    var basePath = req.headers['x-script-name'] || '';
    res.send(JSON.stringify({
        port : config.port + 1,
        sslUrl : config.websocketUrlSsl,
        url : config.websocketUrl,
        basePath: basePath
    }));
});

// Маршрут для поддержки префикса URL - добавим универсальный маршрут
app.get("*", function (req, res) {
    // Проверяем, является ли запрос за файлом (с расширением)
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Если это файл, отдаем 404, так как он уже должен быть обработан express.static
        res.status(404).send('File not found');
    } else {
        // Если это не файл, значит это маршрут приложения, отдаем index.html
        res.sendFile(path.resolve(__dirname + "/../public/index.html"));
    }
});

app.listen(config.port, config.host, function () {
    console.log("RCON Web Admin listening on port " + config.port);
});
