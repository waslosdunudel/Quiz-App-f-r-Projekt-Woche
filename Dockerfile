FROM php:8.2-apache

# src/ als Document Root nutzen
COPY src/ /var/www/html/

# Schreibrechte für die CSV-Datei (wird zur Laufzeit beschrieben)
RUN mkdir -p /var/www/html/api/data \
    && chown -R www-data:www-data /var/www/html/api/data \
    && chmod 775 /var/www/html/api/data

EXPOSE 80
