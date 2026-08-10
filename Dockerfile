# Builds one container image serving both app-backend (Django) and
# app-frontend (React) — Django serves the built React SPA as static files
# via collectstatic, matching the asistentka pattern this was adapted from.
#
# app-backend/'s own contents (manage.py, backend/, pyproject.toml, uv.lock,
# start.sh) get flattened directly into /app below — manage.py must sit next
# to the backend/ package it imports (backend.settings), not nested under an
# app-backend/ subdirectory.
#
# Build context is the repo root (this Dockerfile is NOT inside
# app-backend/ or app-frontend/) since it needs to COPY from both — see
# .dockerignore for what's excluded from that context.

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

# Flatten app-backend/'s contents directly into /app — manage.py and the
# backend/ Django package must be siblings for `manage.py` to import
# `backend.settings`, not nested under app-backend/ (see CLAUDE.md).
COPY app-backend/ ./

# Copy built frontend so collectstatic can find app-frontend/dist/assets
COPY --from=frontend-builder /app/app-frontend/dist ./app-frontend/dist

RUN python manage.py collectstatic --noinput

RUN chmod +x start.sh

EXPOSE 8000
CMD ["./start.sh"]
