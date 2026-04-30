# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /build

# Install pnpm (lockfile v9 requires pnpm v9+)
RUN npm install -g pnpm@9

# Copy manifests first so Docker can cache the install layer
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

COPY artifacts/api-server/package.json     ./artifacts/api-server/
COPY artifacts/distressiq/package.json     ./artifacts/distressiq/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/

COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json         ./lib/api-spec/
COPY lib/api-zod/package.json          ./lib/api-zod/
COPY lib/db/package.json               ./lib/db/
COPY lib/replit-auth-web/package.json  ./lib/replit-auth-web/

COPY scripts/package.json ./scripts/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the React/Vite frontend
RUN NODE_ENV=production pnpm --filter @workspace/distressiq run build

# Bundle the Express API server with esbuild
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

# ── Stage 2: Database-migration runner (drizzle-kit push) ─────────────────────
# Used by `docker compose run db-migrate`.  Based on the builder image so
# drizzle-kit and all workspace packages are already installed.
FROM builder AS migrate

WORKDIR /build

CMD ["pnpm", "--filter", "@workspace/db", "run", "push"]

# ── Stage 3: Production image ──────────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

# Copy only the built artefacts from the builder
COPY --from=builder /build/artifacts/api-server/dist   ./artifacts/api-server/dist
COPY --from=builder /build/artifacts/distressiq/dist/public ./artifacts/distressiq/dist/public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Healthcheck: call the API health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
