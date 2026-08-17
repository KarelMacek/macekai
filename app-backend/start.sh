#!/bin/sh
# set -e: a failed migrate (e.g. DB unreachable) must stop the container from
# ever starting gunicorn — otherwise it silently serves against a stale/broken
# schema instead of failing loudly. Bit dev live on 2026-08-17: Postgres was
# stopped, migrate failed silently every deploy since, and the app kept
# serving anyway, 3 migrations behind, until someone noticed.
set -e
mkdir -p /app/sqlite
python manage.py migrate --noinput
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile - --error-logfile -
