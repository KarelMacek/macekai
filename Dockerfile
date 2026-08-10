# Builds one container image serving both app-backend (Django) and
# app-frontend (React) — Django serves the built React SPA as static files
# via collectstatic, matching the asistentka pattern this was adapted from.
#
# NOT YET BUILDABLE: app-backend/ and app-frontend/ don't exist as code yet
# (see CLAUDE.md — Phase 2, not built). This Dockerfile is a template for
# when that skeleton lands; the COPY paths below assume app-backend/ is a
# Django project laid out like asistentka's backend/ (manage.py at the repo
# root, backend/{settings.py,urls.py,wsgi.py}) and app-backend/pyproject.toml
# + uv for dependency management — verify/adjust both once that code exists.
#
# Build context is the repo root (this Dockerfile is NOT inside
# app-backend/ or app-frontend/) since it needs to COPY from both.

# Stage 1: build React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/app-frontend
COPY app-frontend/package*.json ./
RUN npm install
COPY app-frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.14-slim AS backend
WORKDIR /app

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies (cached layer — only re-runs when lockfile changes)
COPY app-backend/pyproject.toml app-backend/uv.lock ./
RUN uv sync --frozen

# Copy application code
COPY app-backend/manage.py ./
COPY app-backend/ ./app-backend/

# Copy built frontend so collectstatic can find app-frontend/dist/assets
COPY --from=frontend-builder /app/app-frontend/dist ./app-frontend/dist

RUN python manage.py collectstatic --noinput

COPY app-backend/start.sh ./
RUN chmod +x start.sh

EXPOSE 8000
CMD ["./start.sh"]
