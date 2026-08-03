# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 2: Production Dependencies
# ==========================================
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production
RUN npx prisma generate

# ==========================================
# STAGE 3: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=America/La_Paz

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy node_modules & dist from builder stages
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
