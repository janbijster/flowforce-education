#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
poetry install --no-interaction --no-ansi

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate 