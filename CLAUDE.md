# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Turborepo monorepo (pnpm workspaces) with two apps and three shared packages. Note: `README.md` is the stock `create-turbo` starter text and is out of date — it references a `docs` app that has been removed and does not mention the NestJS `api`. Trust this file and the actual `apps/` and `packages/` contents over the README.

- `apps/web` — Next.js 16 (React 19) frontend, port **3000**
- `apps/api` — NestJS 11 backend, port **4000** (override with `PORT` env var; see [apps/api/src/main.ts](apps/api/src/main.ts))
- `packages/ui` — shared React components, imported as `@repo/ui` (exports `./src/*.tsx` directly, no build step)
- `packages/eslint-config` — `@repo/eslint-config`, exposes `./base`, `./next-js`, `./react-internal`
- `packages/typescript-config` — `@repo/typescript-config`, shared tsconfig presets

## Conventions

- **Language: English only.** All application language must be in English — UI copy, labels, placeholders, button text, toast/notification messages, validation/error messages, empty states, and any user-facing string. Code identifiers, comments, and commit messages are English too. Do not introduce Spanish (or any non-English) strings into the app.

## Commands

Run from the repo root; Turbo orchestrates across workspaces.

```sh
pnpm dev           # run all apps (web:3000, api:4000) in watch mode
pnpm build         # build all (turbo caches; see outputs note below)
pnpm lint          # eslint across workspaces
pnpm check-types   # tsc --noEmit across workspaces
pnpm format        # prettier --write on **/*.{ts,tsx,md}
```

Target a single app with `--filter`:

```sh
pnpm --filter web dev
pnpm --filter api dev          # nest start --watch
pnpm --filter api start        # one-shot, no watch
```

### Tests (api only — web has no tests)

```sh
pnpm --filter api test                       # jest unit tests (*.spec.ts under src/)
pnpm --filter api test:watch
pnpm --filter api test:e2e                   # uses test/jest-e2e.json
pnpm --filter api test -- app.controller     # single test file by name pattern
```

## Architecture notes

- **Heterogeneous build outputs.** `turbo.json` lists both `.next/**` (Next.js) and `dist/**` (NestJS) under the `build` task's `outputs`. Both must stay listed or Turbo's cache misses the NestJS artifacts. Don't trim this to just `.next/**`.
- **`@repo/ui` ships raw TSX**, not compiled JS — consumers (`web`) transpile it. There's no build step for the UI package; editing a component is immediately picked up.
- **Port convention**: frontend 3000, API 4000. Keep them distinct; `EADDRINUSE` during local runs is usually a lingering process from a prior run, not a config problem.
- NestJS app is the default scaffold: single `AppModule` → `AppController` → `AppService`. No feature modules yet.
