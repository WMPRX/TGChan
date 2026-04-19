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
RUN bun run build

# ---- Stage 3: Production ----
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and migrations for runtime
COPY --from=builder /app/prisma ./prisma

# Copy seed script
COPY --from=builder /app/scripts ./scripts

# Create data directory for SQLite and set ownership
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Set environment defaults
ENV DATABASE_URL="file:/app/data/custom.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start: run migrations then start the server
CMD ["sh", "-c", "bunx prisma db push --skip-generate && node server.js"]
