FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM build AS migrate
CMD ["pnpm", "run", "db:migrate"]

FROM build AS production-deps
RUN pnpm prune --prod

FROM base AS production
COPY --from=production-deps /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3333
CMD ["node", "dist/server.js"]
