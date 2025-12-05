# Multi-stage build for SvelteKit (adapter-node)
# Use Debian-based image for better-sqlite3 native module compatibility
FROM node:20-bookworm AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev=false

# Copy source
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built output and any runtime assets
COPY --from=builder /app/build ./build
COPY static ./static

# Expose SvelteKit port
EXPOSE 3000

# Prepare a volume for sqlite files (if used)
VOLUME ["/app/data"]

# Ensure data directory exists
RUN mkdir -p /app/data

# Start the server
ENV DB_PATH=/app/data/app_prod.db
CMD ["node", "build/index.js"]
