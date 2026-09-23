# syntax=docker/dockerfile:1.6
# ---------------------------------------------------------------------------
# Learn System Design — production image
#
# Stage 1: Node 20 builds the SPA. The vault indexer runs as part of `npm run
#          build` (via the `prebuild` hook), so the bundled vault under
#          ./vault/system_design is required at build time.
#
# Stage 2: nginx:alpine serves the static `dist/` output. SPA fallback is
#          configured in nginx.conf so deep links (e.g. /library) work.
# ---------------------------------------------------------------------------

# ---- Stage 1: build -------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first so this layer caches across code changes
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy the rest of the project (including ./vault/system_design and
# scripts/buildVaultIndex.mjs)
COPY . .

# Vite build runs the indexer first via the `prebuild` script.
RUN npm run build

# ---- Stage 2: serve -------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck so platforms (Render, Fly.io) know the container is up
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
