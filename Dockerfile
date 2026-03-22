# ---- Stage 1: Build the dashboard ----
FROM node:25-bookworm-slim AS dashboard-build

WORKDIR /build/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci
COPY dashboard/ .
COPY package.json /build/package.json
RUN npm run build


# ---- Stage 2: Install server production deps (Linux-native) ----
FROM node:25-bookworm-slim AS server-deps

# better-sqlite3 needs build tools for its native addon
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build/server
COPY server/package.json ./
RUN npm install --omit=dev


# ---- Stage 3: Production image ----
FROM node:25-bookworm-slim

# Install Playwright Chromium system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
       libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
       libpango-1.0-0 libcairo2 libasound2 libxshmfence1 libx11-xcb1 \
       libxfixes3 fonts-liberation fonts-noto-color-emoji \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Server with Linux-built node_modules
COPY --from=server-deps /build/server/node_modules ./server/node_modules
COPY server/index.js server/config.js server/utils.js server/db.js \
     server/queries.js server/import.js server/auth.js server/fetch-orders.js \
     server/package.json ./server/

# Install Playwright Chromium browser binary
RUN cd server && npx playwright install chromium

# Built dashboard (static files only)
COPY --from=dashboard-build /build/dashboard/dist ./dashboard/dist

ENV NODE_ENV=production
VOLUME /app/data
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server/index.js"]
