# syntax=docker/dockerfile:1

# ---------- Frontend build stage ----------
FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- PHP runtime stage ----------
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        nginx \
        supervisor \
        icu-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        sqlite-dev \
        curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_sqlite \
        bcmath \
        gd \
        exif \
        intl \
        mbstring \
        opcache \
        pcntl \
        zip \
    && docker-php-ext-enable opcache \
    && apk del --no-cache icu-dev libpng-dev libjpeg-turbo-dev freetype-dev libzip-dev sqlite-dev \
    && apk add --no-cache \
        icu-libs \
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        sqlite-libs

# Install composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .
# Build assets from the frontend stage
COPY --from=assets /app/public/build public/build

# Install PHP dependencies
RUN composer install --no-dev --no-scripts --no-interaction --optimize-autoloader \
    && composer dump-autoload --no-dev --optimize

# Runtime config: nginx, php-fpm pool, supervisord
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/php-fpm.conf /usr/local/etc/php-fpm.d/zz-render.conf
COPY deploy/supervisord.conf /etc/supervisord.conf
COPY deploy/entrypoint.sh /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p /var/lib/laravel/storage \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/lib/laravel \
    && ln -s /var/www/html/artisan /usr/local/bin/artisan

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint"]