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
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
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

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Command to run the application
CMD ["node", "server.js"] 