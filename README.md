# Social Planner

A self-hosted tool for collecting, browsing, and building a **swipe file** of social
media posts from creators you follow. Point it at a TikTok / Instagram / YouTube / X
handle, sync their recent posts, and study what works — engagement metrics, captions,
media, and direct links back to the original post.

> Built as a Turborepo monorepo: a Next.js frontend and a NestJS backend that pulls
> data through the [ScrapeCreators](https://scrapecreators.com) API and stores it in Postgres.

---

## Features

- **Multi-platform sync** — fetch recent posts from TikTok, Instagram, YouTube, and X for any author.
- **Posts explorer** — card and table views with sorting by date, likes, comments, and engagement ratios.
- **Post detail sidebar** — caption, full metrics, inline video playback (or cover image), and a link to the original post.
- **Swipe files** — bookmark posts worth keeping for reference.
- **Per-author sync config** — sync the last *N* posts or a date range.
- **Background jobs** — syncing runs on a BullMQ queue so the UI stays responsive.
- **HEIC handling** — TikTok HEVC-HEIC covers are transcoded server-side so browsers can render them.

> **Note:** there is no authentication yet — the app runs as a single implicit user.
> Don't expose it to the public internet without putting it behind your own auth/proxy.

---

## Tech stack

| Layer    | Stack |
|----------|-------|
| Frontend | Next.js 16 · React 19 · Tailwind · shadcn/ui · TanStack Query & Table · dnd-kit · Recharts |
| Backend  | NestJS 11 · Drizzle ORM · BullMQ (Redis) · class-validator |
| Data     | Postgres (local or Neon) · Redis |
| External | ScrapeCreators API (post data) · Apify API |
| Tooling  | Turborepo · pnpm · TypeScript |

---

## Project structure

```
apps/
  web/    Next.js frontend (port 3000)
  api/    NestJS backend (port 4000)
packages/
  ui/                 shared React components (@repo/ui, raw TSX, no build step)
  eslint-config/      shared ESLint presets
  typescript-config/  shared tsconfig presets
```

The API is organized into feature modules: `authors`, `content`, `sync`,
`swipe`, `settings`, `scrapecreators`, and `apify`.

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 (`corepack enable` then `corepack prepare pnpm@9 --activate`)
- A **Postgres** database — any Postgres works (local, Docker, or a managed host like [Neon](https://neon.tech))
- A **Redis** instance (for the BullMQ sync queue)
- A **ScrapeCreators** API key — https://scrapecreators.com (used to fetch post data)

---

## Getting started

### 1. Install

```sh
pnpm install
```

### 2. Configure environment

**`apps/api/.env`**

```sh
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SCRAPECREATORS_API_KEY=your_key_here
APIFY_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

**`apps/web/.env.local`**

```sh
NEXT_PUBLIC_API_URL=http://localhost:4000
```

(`.env.example` files are provided in each app.)

### 3. Run database migrations

```sh
pnpm --filter api db:migrate
```

### 4. Start everything

```sh
pnpm dev          # web on :3000, api on :4000
```

Then open <http://localhost:3000>, add an author on the **Authors** page, and hit **Sync**.

---

## Run with Docker

The repo ships a `docker-compose.yml` that runs the web app, API, a Postgres
database, and Redis — no external services required.

```sh
cp .env.docker.example .env          # add your SCRAPECREATORS_API_KEY
docker compose up --build            # web :3000 · api :4000 · postgres :5432 · redis :6379
```

Then apply migrations against the database once it's up:

```sh
DATABASE_URL=postgresql://socialplanner:socialplanner@localhost:5432/socialplanner \
  pnpm --filter api db:migrate
```

To use a managed Postgres (e.g. Neon) instead of the bundled one, set
`DATABASE_URL` in `.env` — the API uses the standard `pg` driver and connects to
either. `NEXT_PUBLIC_API_URL` is baked into the web image at build time, so change
it and rebuild for a non-localhost deployment.

## Commands

Run from the repo root (Turbo orchestrates across workspaces):

```sh
pnpm dev           # run all apps in watch mode
pnpm build         # build all apps
pnpm lint          # eslint across workspaces
pnpm check-types   # tsc --noEmit across workspaces
pnpm format        # prettier on **/*.{ts,tsx,md}
```

Target a single app with `--filter`:

```sh
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter api test         # jest unit tests
```

### Database (Drizzle)

```sh
pnpm --filter api db:generate  # generate a migration from schema changes
pnpm --filter api db:migrate   # apply pending migrations
pnpm --filter api db:push      # push schema directly (dev only)
```

> Migrations are generated from `apps/api/src/db/schema.ts`. Never hand-edit the
> generated snapshots in `apps/api/drizzle/` — regenerate them with `db:generate`.

---

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```sh
pnpm lint
pnpm check-types
pnpm --filter api test
```

All user-facing strings must be in **English**.

---

## License

MIT — see [LICENSE](./LICENSE).
