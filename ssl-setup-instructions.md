# Настройка SSL для rcon-web-admin с nginx

## Вариант 1: Использование Let's Encrypt (рекомендуется)

### Установка Certbot (для Ubuntu/Debian):
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Получение SSL-сертификата:
```bash
sudo certbot --nginx -d your-domain.com
```

Certbot автоматически обновит конфигурацию nginx и настроит SSL-сертификат.

## Вариант 2: Ручная установка SSL-сертификатов

### Если у вас уже есть SSL-сертификаты:

1. Разместите SSL-сертификат в `/etc/ssl/certs/`:
   - `sudo cp your_domain.crt /etc/ssl/certs/your_domain.crt`

2. Разместите приватный ключ в `/etc/ssl/private/`:
   - `sudo cp your_domain.key /etc/ssl/private/your_domain.key`

3. Убедитесь, что права доступа установлены правильно:
   - `sudo chmod 64 /etc/ssl/certs/your_domain.crt`
   - `sudo chmod 600 /etc/ssl/private/your_domain.key`

## Обновление конфигурации nginx

1. Обновите файл конфигурации nginx, указав пути к вашим SSL-сертификатам:
   - `ssl_certificate /etc/ssl/certs/your_domain.crt;`
   - `ssl_certificate_key /etc/ssl/private/your_domain.key;`

2. Перезапустите nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Обновление конфигурации приложения

1. Замените файл `config.js` на `config-ssl.js`, предварительно изменив доменное имя:
   ```javascript
   "websocketUrlSsl": "wss://your-domain.com/ws",
   "websocketUrl": "ws://your-domain.com/ws"
   ```

2. Перезапустите приложение rcon-web-admin.

## Проверка настройки

1. Убедитесь, что приложение запущено:
   ```bash
   node src/main.js start
   ```

2. Откройте в браузере `https://your-domain.com`

3. Проверьте, что веб-сокет соединение работает корректно (обычно на порту 4327).

## Автоматическое обновление SSL-сертификатов

Если вы используете Let's Encrypt, сертификаты обновляются автоматически, но вы можете проверить настройку:
```bash
sudo crontab -l
```

Обычно Certbot добавляет cron-задачу для автоматического обновления сертификатов.