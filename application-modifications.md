# Модификации приложения для работы с префиксом URL

## Проблема
Текущая реализация rcon-web-admin не учитывает префиксы URL, что может вызвать проблемы при работе через nginx с префиксом `/rwa/`.

## Решение
Поскольку в текущем приложении нет встроенной поддержки префиксов URL, нужно внести изменения в файлы приложения.

### 1. Обновление wsconfig endpoint

Файл: `src/routes.js`

Текущий код:
```javascript
// output the required ws port number
app.get("/wsconfig", function (req, res) {
    res.send(JSON.stringify({port : config.port + 1, sslUrl : config.websocketUrlSsl, url : config.websocketUrl}));
});
```

Поскольку мы используем кастомные URL для WebSocket, этот endpoint должен продолжать работать по прежнему адресу, но значения websocketUrl должны быть настроены в конфигурации для работы с префиксом.

### 2. Возможные изменения в клиентском JavaScript

Поскольку приложение использует WebSocket-соединения, клиентский код должен знать правильные URL для подключения. Эти URL указываются в конфигурации приложения и передаются через `/wsconfig` endpoint.

### 3. Запуск приложения с префиксом URL

Поскольку Express приложение не настроено для работы с префиксом, рекомендуется:

1. Запускать приложение как отдельный домен или поддомен
2. Или внести изменения в структуру приложения для поддержки префиксов URL

### 4. Альтернативное решение (рекомендуется)

Наиболее простое решение - использовать отдельный поддомен для rcon-web-admin, например `rwa.embigo.ru`, вместо пути `/rwa/`. Это избавит от необходимости модифицировать исходный код приложения.

Конфигурация nginx в этом случае будет выглядеть так:

```
server {
    server_name rwa.embigo.ru;
    
    # SSL configuration
    listen 443 ssl http2;
    ssl_certificate    /etc/letsencrypt/live/embigo.ru-0001/fullchain.pem;
    ssl_certificate_key    /etc/letsencrypt/live/embigo.ru-0001/privkey.pem;

    location / {
        proxy_pass http://localhost:4326;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    location /ws {
        proxy_pass http://localhost:4327;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

И соответствующая конфигурация приложения:
```javascript
"websocketUrlSsl": "wss://rwa.embigo.ru/ws",
"websocketUrl": "ws://rwa.embigo.ru/ws"
```

### 5. Если все же нужно использовать путь /rwa/

Если вы хотите использовать именно путь `/rwa/`, то потребуется модифицировать приложение для поддержки префиксов URL. Это потребует:

1. Обновления всех клиентских скриптов, чтобы они корректно формировали URL для API-вызовов
2. Настройки WebSocket-соединений с учетом префикса
3. Возможной модификации путей в HTML-шаблонах

Это более сложный путь, требующий значительных изменений в коде приложения.