# Multi-stage build for optimal image size
FROM node:18-bookworm-slim AS base

# Install dependencies for native modules (Debian-based)
RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
ENV PNPM_HOME=/usr/local/share/pnpm \
    PNPM_SKIP_RECURSIVE_INSTALL_WARN=true
RUN corepack prepare pnpm@latest --activate && pnpm install --no-frozen-lockfile

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000 3001 3002
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN pnpm build

# Production stage
FROM node:18-bookworm-slim AS production

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

# Create non-root user (Debian-based)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m -s /usr/sbin/nologin memento

USER memento

EXPOSE 3000 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

CMD ["node", "dist/index.js"]
