# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Gacha·Kuji Map** — a Next.js 16 (App Router) web app for finding gacha (capsule toy) and ichiban kuji shops on a Kakao Map. Single-package repo, no Docker, no local database. All data lives in a remote Supabase project.

### Commands

- **Dev server**: `pnpm dev` (port 3000)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint` (ESLint 9, flat config in `eslint.config.mjs`)
- **No test suite** exists in this repo.

### Environment variables

A `.env.local` file is required with these keys (see `README.md` for details):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | Yes | Kakao JavaScript SDK key (map rendering) |
| `KAKAO_REST_API_KEY` | Yes | Server-side geocoding |
| `NEXT_PUBLIC_SITE_URL` | No | Defaults to Vercel URL |

Without real credentials, the app still starts and renders UI chrome, but Supabase queries return empty results and the Kakao map won't load.

### Caveats

- **Node.js 20** is required (`.nvmrc`). The project specifies `pnpm@9.15.0` via `packageManager` field; `corepack enable && corepack prepare pnpm@9.15.0 --activate` ensures the correct version.
- The home page SSR calls `getShops()` which gracefully returns `[]` on Supabase errors, so the dev server starts fine with placeholder credentials.
- There is no `middleware.ts` at the repo root despite references in docs; the `proxy.ts` file contains middleware-like session refresh logic registered via `next.config.ts`.
- ESLint has 2 pre-existing issues (1 error in `app/home-client.tsx`, 1 warning in `app/owner/shops/shop-list-client.tsx`); these are not blocking.
