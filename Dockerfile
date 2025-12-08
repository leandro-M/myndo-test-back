# Backend
FROM node:20-alpine AS base


# Dependencies
FROM base AS deps
WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build && \
    ls -la dist/ && \
    find dist -name "main.js" && \
    test -f dist/src/main.js || test -f dist/main.js

# Production
FROM base AS runner
WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma.config.ts ./

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
