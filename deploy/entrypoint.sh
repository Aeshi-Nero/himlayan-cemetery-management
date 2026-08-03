#!/bin/sh
set -e

echo "[entrypoint] Generating APP_KEY if missing..."
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    php /var/www/html/artisan key:generate --force --quiet
fi

# Create and touch the SQLite database if that's the configured driver.
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    mkdir -p "$(dirname "$DB_FILE")"
    touch "$DB_FILE"
    chown -R www-data:www-data "$(dirname "$DB_FILE")"
    chmod 0775 "$(dirname "$DB_FILE")"
    echo "[entrypoint] SQLite DB ready at $DB_FILE"
fi

echo "[entrypoint] Running migrations..."
php /var/www/html/artisan migrate --force --no-interaction

if [ "${DB_ROOT_USER_COUNT:-0}" = "0" ]; then
    USERS=$(php /var/www/html/artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null || echo "0")
    if [ "$USERS" = "0" ] || [ -z "$USERS" ]; then
        echo "[entrypoint] Empty database detected, seeding..."
        php /var/www/html/artisan db:seed --force --no-interaction
    fi
fi

echo "[entrypoint] Creating storage link..."
php /var/www/html/artisan storage:link --no-interaction --quiet || true

# Caching config in production speeds things up, but env must be resolved first.
if [ "${APP_ENV:-production}" = "production" ]; then
    php /var/www/html/artisan config:cache --no-interaction || true
fi

echo "[entrypoint] Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf