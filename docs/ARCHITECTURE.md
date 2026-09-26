# FlutterFilms by Ritvik M — Architecture

## Product positioning

FlutterFilms by Ritvik M answers **what should I watch, why, and what next** — not merely what a movie is. The core loop is:

**Discover → Decide → Save → Watch → Remember → Return**

## Stack

| Layer | Technology |
|-------|------------|
| Web app | Next.js 16 App Router, React 19, Tailwind 4 |
| Database | Neon Postgres (production) with SQLite fallback (local) |
| Catalog | TMDB API + IMDb sync into Postgres/SQLite |
| Auth | Cookie sessions (`ff_session`), bcrypt passwords, optional Google OAuth |
| AI | Provider adapters (Ollama, OpenAI-compatible), Cinema Agent tool runtime |
| Analytics | First-party `analytics_events` + optional Vercel Web Analytics |
| Mobile | PWA (manifest + service worker) + Capacitor iOS shell |

## Key directories

```
src/app/              Routes (pages + API)
src/components/       UI (MovieDetailView preserved)
src/lib/
  ai/                 Agent, features runtime, intelligence services
  analytics/          Typed events, repository, track()
  auth/               Sessions, repository
  db/                 Driver abstraction (Postgres / SQLite)
  release/            Deployment readiness checks
  tmdb/               TMDB client + normalization
  user/               Library store + server sync
db/migrations/        Postgres SQL migrations
public/               Static assets, PWA icons, service worker
```

## Data flow

1. **Catalog** — TMDB/IMDb cron sync → `movies`, `people`, ratings tables
2. **Personalization** — Client library (localStorage) + `/api/user/sync` when authenticated
3. **Recommendations** — Taste signals + catalog queries; never invent movie IDs
4. **Cinema Agent** — Heuristic planner → tool calls (`searchMovies`, `getTasteDNA`, …) → grounded response
5. **Analytics** — Client `track()` → `POST /api/analytics/track` → Postgres/SQLite

## Feature runtime

Intelligence features are defined in `src/lib/ai/features/catalog.ts` and validated by `validate.ts`. Status is computed:

- **LIVE** — service + API + UI + tests + trust labels
- **BETA** — partial acceptance criteria
- **PLANNED** — not implemented
- **DEGRADED / ERROR** — health failures

Never hardcode LIVE counts in the registry.

## Trust layer

Labels: Verified Catalog Fact, Database Metadata, External Source, User Data, AI Interpretation, AI Prediction. AI output is never written into catalog metadata.

## Authentication

Server routes use `requireSessionUser()` / `getSessionUser()`. Client-supplied user IDs are never trusted for private resources.

## Deployment

- **Vercel** — Next.js native; `vercel.json` defines cron jobs only
- **PWA** — `src/app/manifest.ts`, `public/sw.js`, `/install`
- **iOS** — `capacitor.config.ts`; run `npx cap add ios` after production URL is set

See also: `VERCEL_DEPLOYMENT.md`, `APP_STORE_RELEASE.md`, `ANALYTICS.md`.
