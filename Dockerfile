FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# Install dependencies (layer cache)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/desktop/package.json ./apps/desktop/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/design-tokens/package.json ./packages/design-tokens/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1

# Baked into the client bundle at build time (override with `docker build --build-arg ...`)
ARG NEXT_PUBLIC_VERIFIK_API_URL=
ARG NEXT_PUBLIC_VERIFIK_PROJECT_ID=
ARG NEXT_PUBLIC_VERIFIK_PROJECT_FLOW_ID=
ENV NEXT_PUBLIC_VERIFIK_API_URL=$NEXT_PUBLIC_VERIFIK_API_URL
ENV NEXT_PUBLIC_VERIFIK_PROJECT_ID=$NEXT_PUBLIC_VERIFIK_PROJECT_ID
ENV NEXT_PUBLIC_VERIFIK_PROJECT_FLOW_ID=$NEXT_PUBLIC_VERIFIK_PROJECT_FLOW_ID

RUN pnpm run build --filter=web

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["node", "server.js"]
