# ---- Stage 1: Dependencies ----
FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Stage 2: Build ----
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js (standalone output)
RUN bunx next build

# Run Prisma db push during build to create the database file
ENV DATABASE_URL="file:/app/data/custom.db"
RUN mkdir -p /app/data && bunx prisma db push --skip-generate

# ---- Stage 3: Production ----
FROM node:20-slim AS runner
WORKDIR /app

# Install openssl (needed for Prisma SQLite) and curl (for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with a proper home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs && \
    mkdir -p /home/nextjs && chown nextjs:nodejs /home/nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Copy full Prisma packages (includes CLI binary for db push)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy seed script
COPY --from=builder /app/scripts ./scripts

# Copy pre-built SQLite database from builder
COPY --from=builder /app/data/custom.db /app/data/custom.db

# Create data directory for SQLite and set ownership
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data && \
    chown -R nextjs:nodejs /app/node_modules

# Set environment defaults
ENV DATABASE_URL="file:/app/data/custom.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOME="/home/nextjs"

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start server directly — database is already created during build
# If schema changes, prisma db push will run first
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null; node server.js"]
