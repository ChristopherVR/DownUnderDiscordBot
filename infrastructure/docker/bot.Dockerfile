# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/bot/package.json packages/bot/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
RUN pnpm --filter discord-dashboard-shared build

COPY packages/bot/ packages/bot/
RUN pnpm --filter discord-bot exec prisma generate
RUN pnpm --filter discord-bot build

# --- Production stage ---
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/
COPY --from=builder /app/packages/bot/package.json packages/bot/
COPY --from=builder /app/packages/bot/dist/ packages/bot/dist/
COPY --from=builder /app/packages/bot/prisma/ packages/bot/prisma/
COPY --from=builder /app/packages/bot/src/database/generated/ packages/bot/src/database/generated/

RUN pnpm install --frozen-lockfile --prod

# Prisma needs the client at runtime
RUN pnpm --filter discord-bot exec prisma generate

ENV NODE_ENV=production
ENV FFMPEG_PATH=ffmpeg

EXPOSE 3001

CMD ["node", "packages/bot/dist/index.js"]
