FROM node:25-bookworm-slim

# Install Playwright's Chromium dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install scraper dependencies + Playwright browser
COPY scraper/package.json scraper/package-lock.json ./scraper/
RUN cd scraper && npm ci --omit=dev && npx playwright install chromium

# Install dashboard dependencies
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/
RUN cd dashboard && npm ci

# Copy source
COPY scraper/ ./scraper/
COPY dashboard/ ./dashboard/

EXPOSE 5173

CMD ["npm", "--prefix", "dashboard", "run", "dev", "--", "--host", "0.0.0.0"]
