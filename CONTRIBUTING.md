# Contributing to Spydeck

This document details the project structure, local development environment setup, available commands, database migration guides, and contributions guidelines.

---

## Workspace Architecture

Spydeck is built as a Turborepo monorepo with `pnpm` workspaces:

```
apps/
  web/    Next.js frontend (port 3000)
  api/    NestJS backend (port 4000)
packages/
  ui/                 shared React components (@repo/ui, raw TSX, no build step)
  eslint-config/      shared ESLint presets
  typescript-config/  shared tsconfig presets
```

The NestJS backend API is organized into dedicated feature modules: `authors`, `content`, `sync`, `swipe`, `settings`, `scrapecreators`, `apify`, and `auth`.

---

## Technical Stack

* **Frontend:** Next.js 16, React 19, Vanilla CSS, shadcn/ui, TanStack Query & Table, dnd-kit, Recharts.
* **Backend:** NestJS 11, Drizzle ORM, BullMQ (Redis), class-validator, pg.
* **Databases:** Postgres (local or Neon serverless), Redis (BullMQ queues and caching).
* **Tooling:** Turborepo, pnpm workspaces, TypeScript.

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
* **Node.js** ≥ 18
* **pnpm** 9 (`corepack enable` then `corepack prepare pnpm@9 --activate`)
* **Postgres** (a local server, Docker Postgres container, or a managed server like Neon)
* **Redis** (used for BullMQ job queue and cache storage)

---

### Step-by-Step Local Setup

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure Environments:**
   
   Create `apps/api/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin
   ```
   *(Ensure `DATABASE_URL` is set to your Postgres connection string and `JWT_SECRET` is configured.)*

   Create `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run Database Migrations:**
   Apply Drizzle migrations to initialize the database schema:
   ```bash
   pnpm --filter api db:migrate
   ```

4. **Seed the Admin User:**
   Bootstrap the initial admin user using the credentials from `.env`:
   ```bash
   pnpm --filter api db:seed-user
   ```

5. **Start Dev Mode:**
   Run all services in watch mode (Next.js on `http://localhost:3000`, NestJS on `http://localhost:4000`):
   ```bash
   pnpm dev
   ```

---

## Docker Compose Setup

A ready-to-run `docker-compose.yml` configures Postgres, Redis, the API backend, and the Next.js frontend:

1. **Prepare Environment File:**
   ```bash
   cp .env.docker.example .env
   ```
   *(Fill in your configurations inside `.env` if necessary.)*

2. **Run Containers:**
   ```bash
   docker compose up --build
   ```

3. **Apply Database Migrations:**
   Run database migrations inside the active environment:
   ```bash
   DATABASE_URL=postgresql://socialplanner:socialplanner@localhost:5432/socialplanner \
     pnpm --filter api db:migrate
   ```

---

## CLI Commands Reference

Run commands from the repository root (Turborepo manages orchestration):

```bash
pnpm dev           # Launch all apps in watch mode
pnpm build         # Build all apps
pnpm lint          # Run ESLint validation
pnpm check-types   # Run TypeScript typechecks
pnpm format        # Run Prettier formatter
```

### App-Specific Filters
Target specific apps using the `--filter` parameter:
```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter api test         # Run Jest unit tests
pnpm --filter api test:e2e     # Run Jest E2E tests
```

### Database & Migrations (Drizzle ORM)
All database schema and migrations are managed inside the `api` app. Changes must be declared in [schema.ts](file:///Users/darioherrera/dev/social-planner2/apps/api/src/db/schema.ts):

```bash
pnpm --filter api db:generate  # Generate SQL migration file from schema changes
pnpm --filter api db:migrate   # Apply all pending migrations to database
pnpm --filter api db:push      # Push schema directly to database (Dev only)
```
> [!IMPORTANT]
> Never manually edit the generated snapshots/files inside `apps/api/drizzle/`. Always modify [schema.ts](file:///Users/darioherrera/dev/social-planner2/apps/api/src/db/schema.ts) and run `db:generate`.

---

## Guidelines for Contributions

* Before opening a Pull Request, verify that all validation gates pass successfully:
  ```bash
  pnpm lint
  pnpm check-types
  pnpm --filter api test
  pnpm --filter api test:e2e
  ```
* **Language Requirement:** All application language, copy, user-facing logs, variables, commits, and comments must be written in **English**.
