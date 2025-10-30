# Тестирование конфигурации SSL и nginx для rcon-web-admin по пути /rwa/

## Подготовка к тестированию

1. Убедитесь, что все компоненты установлены:
   - Node.js приложение запущено на портах 4326 (HTTP) и 4327 (WebSocket)
   - Nginx настроен с SSL и проксирует запросы к Node.js приложению по пути /rwa/
   - SSL-сертификаты установлены и действительны

## Шаги для обновления конфигурации

### 1. Обновите конфигурацию nginx
Добавьте следующие строки в ваш текущий конфигурации nginx в секцию server:

```
# Прокси-настройки для rcon-web-admin
location /rwa {
    proxy_pass http://localhost:4326; # Приложение rcon-web-admin запущено на порту 4326
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

# Прокси-настройки для WebSocket rcon-web-admin
location /rwa-ws {
    proxy_pass http://localhost:4327; # WebSocket rcon-web-admin на порту 4327
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. Обновите конфигурацию приложения
Замените ваш текущий файл config.js на config-rwa-path.js или обновите текущий файл с такими параметрами:
```javascript
"websocketUrlSsl": "wss://embigo.ru/rwa-ws",
"websocketUrl": "ws://embigo.ru/rwa-ws"
```

### 3. Проверка запуска приложения
```bash
node src/main.js start
```

Убедитесь, что приложение запускается без ошибок и слушает порты 4326 и 4327.

### 4. Проверка конфигурации nginx
```bash
sudo nginx -t
```

### 5. Перезапуск nginx
```bash
sudo systemctl reload nginx
```

### 6. Проверка доступности сайта
Откройте браузер и перейдите на `https://embigo.ru/rwa/`

Проверьте:
- Сайт открывается без ошибок безопасности
- Отображается главная страница rcon-web-admin
- Приложение работает корректно

### 7. Проверка WebSocket-соединения
1. Откройте инструменты разработчика в браузере (F12)
2. Перейдите на вкладку Network/Сеть
3. Обновите страницу и проверьте наличие WebSocket-соединения
4. Убедитесь, что соединение использует `wss://embigo.ru/rwa-ws` (WebSocket Secure)

### 8. Проверка функциональности
1. Попробуйте выполнить вход в систему
2. Проверьте работу основных функций приложения
3. Убедитесь, что команды RCON работают корректно
4. Проверьте работу виджетов (если они установлены)

## Проверка логов

### Проверка логов nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Проверка логов приложения
Наблюдайте за консольным выводом приложения при взаимодействии с интерфейсом.

## Устранение неполадок

### Если WebSocket не работает:
1. Проверьте, что в конфигурации nginx правильно настроены заголовки для WebSocket
2. Убедитесь, что порт 4327 открыт и доступен
3. Проверьте настройки `websocketUrlSsl` и `websocketUrl` в конфигурации приложения

### Если приложение не отвечает по адресу /rwa/:
1. Убедитесь, что в конфигурации nginx правильно указаны пути для location блоков
2. Проверьте, что Node.js приложение запущено
3. Убедитесь, что в конфигурации nginx правильно указан адрес прокси