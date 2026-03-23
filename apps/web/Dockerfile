FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN bun install --frozen-lockfile || bun install

# Build the app
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/
COPY package.json ./
RUN cd apps/web && bun run build

# Production
FROM base AS production
WORKDIR /app/apps/web

# Root node_modules (hoisted deps like react)
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/package.json

# Web app node_modules, built output, server, and runtime source
COPY --from=deps /app/apps/web/node_modules ./node_modules
COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/apps/web/server.ts ./server.ts
COPY --from=build /app/apps/web/src/server ./src/server
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/tsconfig.json ./tsconfig.json

# Shared package (runtime dependency)
COPY --from=build /app/packages/shared /app/packages/shared

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "server.ts"]
