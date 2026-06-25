# Build from the repo root:  docker build -f apps/api/Dockerfile -t social-planner-api .
# syntax=docker/dockerfile:1
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build: install the whole workspace, compile the api, prune to prod deps ----
FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter api build
# pnpm deploy copies the built package + only its production node_modules
RUN pnpm --filter api deploy --prod /prod/api

# ---- runtime: minimal image with just the compiled app ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# sharp/heic-convert need no extra apt packages — their prebuilt binaries are bundled
COPY --from=build /prod/api ./
EXPOSE 4000
CMD ["node", "dist/main"]
