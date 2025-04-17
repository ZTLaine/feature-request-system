FROM node:18-alpine AS base

# Install dependencies needed for Prisma and bcrypt
RUN apk add --no-cache libc6-compat openssl-dev python3 make g++

# Create app directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy Prisma schema first
COPY prisma ./prisma

# Explicitly generate Prisma client before copying the rest of the code
# This ensures it's generated from the latest schema
RUN npx prisma generate

# Copy application code
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM node:18-alpine AS runner
WORKDIR /app

# Install production dependencies only
RUN apk add --no-cache libc6-compat curl

ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Uncomment the following line to disable telemetry at runtime
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "[$(date)] Starting container initialization..."' >> /app/entrypoint.sh && \
    echo 'echo "[$(date)] Checking environment variables..."' >> /app/entrypoint.sh && \
    echo 'if [ -z "$DATABASE_URL" ]; then echo "[$(date)] Error: DATABASE_URL is not set" && exit 1; fi' >> /app/entrypoint.sh && \
    echo 'if [ -z "$NEXTAUTH_SECRET" ]; then echo "[$(date)] Error: NEXTAUTH_SECRET is not set" && exit 1; fi' >> /app/entrypoint.sh && \
    echo 'if [ -z "$NEXTAUTH_URL" ]; then echo "[$(date)] Error: NEXTAUTH_URL is not set" && exit 1; fi' >> /app/entrypoint.sh && \
    echo 'echo "[$(date)] Environment variables check passed"' >> /app/entrypoint.sh && \
    echo 'echo "[$(date)] Running database migrations..."' >> /app/entrypoint.sh && \
    echo 'npx prisma migrate deploy' >> /app/entrypoint.sh && \
    echo 'if [ $? -ne 0 ]; then echo "[$(date)] Error: Database migration failed" && exit 1; fi' >> /app/entrypoint.sh && \
    echo 'echo "[$(date)] Database migrations completed successfully"' >> /app/entrypoint.sh && \
    echo 'echo "[$(date)] Starting application..."' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh
RUN chown nextjs:nodejs /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Set entrypoint and command
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["next", "start"]