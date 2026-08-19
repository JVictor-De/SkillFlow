# syntax=docker/dockerfile:1.6
# ---------- Stage 1: install deps ------------------------------------------ #
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------- Stage 2: build standalone bundle -------------------------------- #
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* vars are inlined into the client bundle by `next build`. They
# MUST be available at build time — runtime env in the container is too late
# (the static JS chunks are already shipped). Coolify/compose passes them via
# `build.args` in docker-compose.yml.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_USE_MOCKS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `output: "standalone"` in next.config emits a self-contained .next/standalone
# directory that we can ship without node_modules.
RUN npm run build

# ---------- Stage 3: minimal runtime ---------------------------------------- #
FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy public assets (if they exist) and Next standalone server.
# The trailing slash and wildcard makes it optional without failing if `public` is missing
COPY --from=builder --chown=nextjs:nodejs /app/public* ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
