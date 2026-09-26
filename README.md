# FlutterFilms

A cinematic movie discovery platform with TMDB and IMDb metadata synchronization, personal taste modeling, and a **200-capability** Cinema Intelligence Layer. FlutterFilms does **not** host films.

**Production:** [flutter-films.vercel.app](https://flutter-films.vercel.app)

This product uses the TMDB API but is not endorsed or certified by TMDB.

---

## Table of contents

1. [What FlutterFilms is](#what-flutterfilms-is)
2. [200 capabilities](#200-capabilities)
3. [Feature status honesty](#feature-status-honesty)
4. [Architecture](#architecture)
5. [Data sources & synchronization](#data-sources--synchronization)
6. [Cinema Agent & AI providers](#cinema-agent--ai-providers)
7. [Setup](#setup)
8. [Environment variables](#environment-variables)
9. [Development & testing](#development--testing)
10. [Deployment](#deployment)
11. [Playback model](#playback-model)
12. [Project relationship](#project-relationship)
13. [Attribution](#attribution)

---

## What FlutterFilms is

FlutterFilms helps you answer questions most movie sites ignore:

- **What should I watch tonight?**
- **Why might I like (or dislike) this title?**
- **What should I explore next** — people, franchises, genres, eras?

It combines:

| Layer | Role |
| --- | --- |
| **Catalog** | TMDB metadata, images, credits, collections, watch providers |
| **Ratings** | Separate TMDB and IMDb ratings (never blended) |
| **Taste** | Favorites, history, watchlists, taste DNA, reflections |
| **Intelligence** | 200 catalogued capabilities with validated LIVE / BETA / PLANNED status |
| **Cinema Agent** | Tool-using agent with evidence retrieval and optional LLM reply in Copilot |

Public UI branding is **FlutterFilms**. Page titles and install copy use the product name only.

---

## 200 capabilities

The intelligence catalog contains **exactly 200 features** (IDs 1–200), defined in:

- `src/lib/ai/features/catalog.ts` — features 1–100 (foundation)
- `src/lib/ai/features/catalog-extended.ts` — features 101–200 (extended intelligence)

### Categories

| Category | Count (approx.) | Examples |
| --- | ---: | --- |
| Discovery | 24+ | Vibe Search, Like This but Darker, Why This Movie? |
| Movie intelligence | 20+ | Movie vs Movie, Theme Similarity, Audience Similarity |
| People & crew | 24+ | Actor Career Timeline, Director Style Signature |
| Franchises | 24+ | Watch Order Planner, Franchise Rating Evolution |
| Personal taste | 20+ | Taste DNA, Favorite Directors, Taste Report |
| Watching & planning | 16+ | Tonight Picker, Triple Feature, Watchlist Prioritizer |
| Social | 8+ | Movie Rooms, Group Taste Merge, Shared Watchlists |
| Search | 10+ | Smart Catalog Search, Scene Memory, NL Filters |
| Creative studio | 8+ | Poster Concept Builder, Trailer Concept, Review Assistant |
| Cinema Agent | 4+ | Cinema Agent, Command Center, Memory Hub |

### Where to browse them

- **About page** (`/about`) — full searchable matrix embedded on the page
- **Intelligence hub** (`/intelligence`) — filterable grid with implementation metadata
- **Per-feature pages** (`/intelligence/[slug]`) — individual capability detail
- **Docs** — [docs/FEATURES_200.md](docs/FEATURES_200.md) for the canonical numbered list

Features 101–200 ship with **service handlers** (`extended-services.ts`). **LIVE** status requires an explicit acceptance contract in `feature-acceptance-contracts.ts` — not merely having a handler. See `docs/FEATURE_DIFFERENTIATION_AUDIT.md` for per-feature tier, mode, and status.

---

## Feature status honesty

Status is **computed**, not marketing copy. The validator (`src/lib/ai/features/validate.ts`) checks:

| Status | Meaning |
| --- | --- |
| **LIVE** | Distinct/family-differentiated implementation + explicit acceptance contract + verified data path |
| **BETA** | Runnable handler but missing contract, generic-prompt tier, family variant, or generative without model |
| **PLANNED** | No service implementation |
| **DEGRADED** | Capped when honest limitations apply (e.g. SVG poster vs generative image) |

Honest caps (`capability-audit.ts`) prevent inflated LIVE counts for features like Smart Catalog Search (keyword/FTS, not vector embeddings) and Poster Concept Builder (deterministic SVG).

Run validation locally:

```bash
npm test -- src/lib/ai/features
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js UI (App Router)                                        │
│  Movies · Discover · Tonight · Copilot · Intelligence · About   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  API routes (src/app/api/)                                      │
│  Catalog · sync cron · AI features · auth · user library          │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ Sync engine   │   │ Feature runtime │   │ Cinema Agent     │
│ TMDB · IMDb   │   │ 200 capabilities│   │ tools · evidence │
└───────┬───────┘   └────────┬────────┘   └────────┬─────────┘
        │                    │                     │
        ▼                    ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│  SQLite (local) or Postgres (production)                    │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  External: TMDB API · IMDb datasets · Ollama/OpenAI (opt.)    │
└───────────────────────────────────────────────────────────────┘
```

### Key directories

| Path | Purpose |
| --- | --- |
| `src/lib/sync/` | TMDB/IMDb sync engine, catalog reads, staleness |
| `src/lib/db/` | Schema, client, Postgres/SQLite compatibility |
| `src/lib/tmdb/` | Official TMDB client, images, discover, providers |
| `src/lib/ai/features/` | 200-feature catalog, capabilities, services, validator |
| `src/lib/ai/agent/` | Cinema Agent orchestrator, planner, tools |
| `src/lib/ai/evidence/` | TMDB/IMDb provenance for grounded responses |
| `src/lib/ai/intelligence/` | Taste, recommendations, franchise, people, creative |
| `src/lib/playback/` | Provider adapters and playback resolver |
| `src/lib/library/` | Filename parsing and TMDB matching |
| `src/components/about/` | About page including embedded 200-feature catalog |

---

## Data sources & synchronization

```
TMDB API / changes ──┐
                     ├── Sync Engine ──► catalog DB ──► UI / search / latest
IMDb official TSV ───┘
```

- **TMDB**: incremental sync via Changes API, discovery lists, per-movie refresh
- **IMDb**: official bulk datasets from `datasets.imdbws.com` (ratings; optional `title.basics` for runtime)
- **Ratings**: stored and displayed separately — never averaged
- **Watch providers**: authorized provider data; availability varies by region
- **Cron** (Vercel): `/api/cron/tmdb-sync`, `/api/cron/imdb-sync`, `/api/cron/provider-sync`, `/api/cron/health-check` — secured with `Authorization: Bearer $CRON_SECRET`
- **Admin**: `/admin/sync` for source health and job history
- **Latest**: `/latest` for recently updated, new, and upcoming titles

Metadata updates do not require redeploying the frontend.

---

## Cinema Agent & AI providers

**Cinema Agent** (`/copilot`) runs `runCinemaAgent()` with:

- Tool routing (recommendations, taste, franchise, people, watchlist actions)
- Evidence retrieval before generative interpretation
- Session context and optional user memory (`/account/memories`)

**Providers** (`/open-models`, `/settings`):

| Provider | Configuration |
| --- | --- |
| **Ollama** | `OLLAMA_BASE_URL` — auto-discovers models from `/api/tags` |
| **OpenAI-compatible** | `AI_LOCAL_ENDPOINT` + `AI_LOCAL_API_KEY` |
| **Cloud fallback** | `OPENAI_API_KEY` when local models are unreachable |

**Important:** Vercel cannot reach Tailscale-only IPs. For production Copilot, use a publicly reachable Ollama endpoint or `OPENAI_API_KEY`.

Creative features (trailer concept, review assistant) use LLM when connected; poster builder uses deterministic SVG concepts unless a generative image provider is configured.

---

## Setup

1. Create a TMDB API Read Access Token at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
2. Copy `.env.example` → `.env.local`.
3. Set `TMDB_API_TOKEN` (preferred) or `TMDB_API_KEY`.
4. Install and run:

```bash
npm install
npm test
/Users/rpm/vitamovies/dev.sh
```

The `dev.sh` launcher starts FlutterFilms from `/Users/rpm/vitamovies` regardless of your current directory. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Open [http://localhost:3000](http://localhost:3000).

Optional: set `OLLAMA_BASE_URL` for local Cinema Agent generative replies.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_TOKEN` | Yes* | Server-only Bearer token (preferred) |
| `TMDB_API_KEY` | Yes* | v3 query-key fallback |
| `TMDB_IMAGE_BASE_URL` | No | Defaults to `https://image.tmdb.org/t/p` |
| `NEXT_PUBLIC_SITE_URL` | Prod | Canonical URL for metadata, install, OG tags |
| `DATABASE_URL` | No | Postgres URL (prod) or SQLite path (`file:.data/flutter-films.db`) |
| `DIRECT_DATABASE_URL` | No | Direct Postgres connection for migrations |
| `CRON_SECRET` | Prod | Bearer token for `/api/cron/*` |
| `SYNC_STALE_MS` | No | On-demand refresh threshold (default 6 hours) |
| `IMDB_IMPORT_BASICS` | No | `true` to import runtime from `title.basics.tsv.gz` |
| `OLLAMA_BASE_URL` | No | Native Ollama API (e.g. `http://localhost:11434`) |
| `AI_LOCAL_ENDPOINT` | No | OpenAI-compatible local endpoint |
| `AI_LOCAL_API_KEY` | No | API key for local endpoint (default `ollama`) |
| `OPENAI_API_KEY` | No | Cloud fallback for Copilot and creative LLM |
| `OPENAI_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |
| `AI_ADMIN_SECRET` | No | Admin AI dashboard (falls back to `CRON_SECRET` in dev) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `RESEND_API_KEY` | No | Transactional email (links logged in dev when unset) |

\* At least one TMDB credential is required.

Never commit real secrets. `.env*` is gitignored.

---

## Development & testing

```bash
npm test              # Vitest unit tests (feature validator, sync, taste, etc.)
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run build         # Production build
npm start             # Production server
npx playwright test   # E2E (about, install, onboarding)
```

Feature-specific tests:

```bash
npm test -- src/lib/ai/features/feature-runtime.test.ts
npm test -- src/lib/ai/features/feature-200-regression.test.ts
npm test -- src/lib/ai/features/feature-live-regression.test.ts
```

Trigger a local TMDB sync:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/tmdb-sync
```

---

## Deployment

Deployed on **Vercel** with:

- `NEXT_PUBLIC_SITE_URL` set to the production domain
- `DATABASE_URL` pointing to Neon Postgres (or compatible)
- `CRON_SECRET` for scheduled sync jobs
- `TMDB_API_TOKEN` and optional `OPENAI_API_KEY`

Install as PWA via `/install` — device-aware instructions, canonical URL from env (no hardcoded domains).

---

## Playback model

FlutterFilms does not host films. Playback statuses:

| Status | Meaning |
| --- | --- |
| `PLAYABLE` | Authorized HLS/DASH/MP4 |
| `AVAILABLE_EXTERNALLY` | JustWatch/TMDB deep links |
| `TRAILER_ONLY` | Official trailer |
| `NO_PLAYBACK_SOURCE` | Watchlist / metadata only |

The Einthusan adapter exists but is disabled. Enable only with official API access and lawful playback terms. Do not scrape or proxy streams.

---

## Project relationship

The Kodi [`metadata.themoviedb.org.python`](https://github.com/xbmc/metadata.themoviedb.org.python) repository is a metadata scraper add-on, not a web app. FlutterFilms uses it as an architectural reference for filename parsing and TMDB matching, then maintains a server-side catalog through official APIs and authorized datasets.

---

## Attribution

- **TMDB**: “This product uses the TMDB API but is not endorsed or certified by TMDB.”
- **IMDb**: ratings from official datasets where linked titles exist. Follow IMDb linking requirements for your license.
- **JustWatch**: watch-provider data supplied by JustWatch. Availability varies by region.

---

## Maintainer

Created by Ritvik M. Public product surfaces use the **FlutterFilms** brand only.
