# Stage 1: Build the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Use npm ci for deterministic and faster builds
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Install dumb-init for proper signal handling (PID 1 problem)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create necessary directories and set ownership for non-root user
RUN mkdir -p src/config && chown -R node:node /app

# Copy dependencies definition
COPY --chown=node:node package*.json ./

# Switch to non-root user 'node' for security
USER node

# Install production dependencies and clean cache to reduce image size
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets and server code with correct ownership
COPY --chown=node:node --from=build-stage /app/dist ./dist
COPY --chown=node:node --from=build-stage /app/server.js ./
COPY --chown=node:node --from=build-stage /app/backend ./backend
COPY --chown=node:node --from=build-stage /app/src/config/data.json ./src/config/data.json

# Set environment variables
# JWT_SECRET 会自动生成，无需配置
# ADMIN_USERNAME/ADMIN_PASSWORD 应通过 docker-compose 设置
# CORS_ORIGINS 可通过 docker-compose 覆盖
ENV NODE_ENV=production \
    PORT=3333

EXPOSE 3333

# Use dumb-init as entrypoint to handle signals correctly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
