FROM node:25-bookworm-slim

WORKDIR /app

# Install scraper dependencies + Playwright browser + all its OS deps
COPY scraper/package.json scraper/package-lock.json ./scraper/
RUN cd scraper && npm ci --omit=dev \
    && npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Install dashboard dependencies
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/
RUN cd dashboard && npm ci

# Copy source
COPY scraper/ ./scraper/
COPY dashboard/ ./dashboard/

EXPOSE 5173

CMD ["npm", "--prefix", "dashboard", "run", "dev", "--", "--host", "0.0.0.0"]
