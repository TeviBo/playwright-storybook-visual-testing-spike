FROM node:18-bullseye-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libglib2.0-0 \
    libnss3 \
    libdrm2 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcb1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production \
    && npx playwright install --with-deps

# Copy application code
COPY . .

# Create necessary directories and build storybook
RUN mkdir -p tests/logs tests/reports tests/snapshots \
    && npm run build-storybook

# Expose ports
EXPOSE 6006 3000

# Environment variables
ENV NODE_ENV=production
ENV CI=true
ENV STORAGE_PROVIDER=minio
ENV STORAGE_BUCKET=storybook-visual-tests-screenshots
ENV STORAGE_ENDPOINT=minio
ENV STORAGE_PORT=9000
ENV STORAGE_USE_SSL=false
ENV STORYBOOK_URL=http://192.168.0.40:6006/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f "$STORYBOOK_URL" || exit 1

# Default command
CMD ["npm", "run", "visual-tests:ci"]