# syntax=docker/dockerfile:1

# ─── Stage 1: deps ────────────────────────────────────────────────────────
# Install ALL dependencies (dev + prod) needed for the build step.
# Uses Node 20 to match package.json engines (>= 20.0.0).
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# OpenSSL is required by Prisma's query engine.
# build-essential + python3 give sharp/native deps a fallback path,
# though sharp 0.34 ships prebuilt linux-x64 binaries by default.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit --no-fund


# ─── Stage 2: builder ─────────────────────────────────────────────────────
# Generate Prisma client + build Remix.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client must be generated in the Linux container env
# (binaryTargets in schema.prisma already includes debian targets).
RUN npx prisma generate

RUN npm run build


# ─── Stage 3: runtime ─────────────────────────────────────────────────────
# Minimal image: prod deps + built output + Prisma engines + uploads scaffold.
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Runtime needs:
#   * openssl for Prisma
#   * tini for proper signal handling (graceful shutdown on docker stop)
#   * wget for HEALTHCHECK
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini wget \
 && rm -rf /var/lib/apt/lists/*

# Prune to production deps only (drops dev tooling, slimmer image).
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force

# Copy built artifacts + Prisma generated client from the builder stage.
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# uploads/ scaffolding. In production this directory is the mount point
# for a host bind mount (./uploads on the VPS) — meaning the contents
# baked here will be hidden by the mount. We create the structure so
# the image is self-consistent if anyone runs it WITHOUT a bind mount.
RUN mkdir -p /app/uploads/products /app/uploads/content /app/uploads/settings

# Run as the non-root `node` user that the base image ships with.
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Wrapping in tini so SIGTERM / SIGINT propagate cleanly to remix-serve.
ENTRYPOINT ["/usr/bin/tini", "--"]

# Healthcheck hits the homepage. The endpoint must return 200 from the
# Remix runtime once the app is fully booted.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider --tries=1 http://127.0.0.1:3000/ || exit 1

CMD ["npm", "run", "start"]
