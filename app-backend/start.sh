#!/bin/sh
mkdir -p /app/sqlite
python manage.py migrate --noinput
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile - --error-logfile -
