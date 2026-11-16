# ==========================================
# Multi-Stage Production Dockerfile for SmartSpend
# ==========================================

# Stage 1: Build the React client
FROM node:22-bookworm-slim AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:22-bookworm-slim
WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

WORKDIR /app
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Expose server port
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

# Mountable volume for persistent SQLite database
VOLUME ["/app/server"]

CMD ["node", "server/server.js"]
