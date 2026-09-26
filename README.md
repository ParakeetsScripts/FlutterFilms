# FlutterFilms by Ritvik M

A cinematic movie discovery platform with automatic TMDB and IMDb metadata synchronization. FlutterFilms does not host films.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## Why this is a separate project

The Kodi `metadata.themoviedb.org.python` repository is a metadata scraper add-on, not a web app. FlutterFilms uses that project as an architectural reference for filename parsing and TMDB matching, then maintains a server-side catalog through official APIs and authorized datasets.

## Setup

1. Create a free TMDB API key or Read Access Token at [themoviedb.org](https://www.themoviedb.org/settings/api).
2. Copy `.env.example` to `.env.local`.
3. Set `TMDB_API_TOKEN` (Bearer) or `TMDB_API_KEY`.
4. Install and run:

```bash
npm install
npm test
/Users/rpm/vitamovies/dev.sh
```

The `dev.sh` launcher works from **any directory** and always starts FlutterFilms by Ritvik M from `/Users/rpm/vitamovies`. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
| --- | --- |
| `TMDB_API_TOKEN` | Preferred. Server-only Bearer token. |
| `TMDB_API_KEY` | Optional v3 query-key fallback. |
| `TMDB_IMAGE_BASE_URL` | Defaults to `https://image.tmdb.org/t/p`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata. |
| `DATABASE_URL` | Optional SQLite path (`file:.data/flutter-films.db`). |
| `CRON_SECRET` | Bearer token for `/api/cron/*` (required in production). |
| `SYNC_STALE_MS` | On-demand refresh threshold (default 6 hours). |
| `IMDB_IMPORT_BASICS` | Set `true` to import IMDb runtime from `title.basics.tsv.gz`. |

Never commit real secrets. `.env*` is gitignored.

## Metadata synchronization

```
TMDB API / changes ──┐
                     ├── Sync Engine ──► SQLite catalog ──► UI / search / latest
IMDb official TSV ───┘
```

- **TMDB**: incremental sync via the official Changes API, discovery lists, and per-movie refresh.
- **IMDb**: official bulk datasets from `datasets.imdbws.com` (ratings; optional basics for runtime). No HTML scraping.
- **Ratings**: TMDB and IMDb ratings are stored and displayed separately — never averaged.
- **Cron** (Vercel): `/api/cron/tmdb-sync`, `/api/cron/imdb-sync`, `/api/cron/provider-sync`, `/api/cron/health-check` secured with `Authorization: Bearer $CRON_SECRET`.
- **Admin**: `/admin/sync` shows source health and recent jobs.
- **Latest**: `/latest` shows recently updated, newly added, and upcoming titles.

Metadata updates do not require redeploying the frontend. Only application code changes need a new build.

## Architecture

```
UI → catalog layer → SQLite + sync engine → TMDB API / IMDb datasets / authorized providers
```

- `src/lib/sync/` synchronization engine, conflict rules, catalog reads
- `src/lib/db/` SQLite schema and client
- `src/lib/tmdb/` official metadata, images, credits, videos, discover, watch providers
- `src/lib/playback/` provider adapters and resolver
- `src/lib/library/` filename parsing and TMDB matching
- `src/app/api/` server routes that hide credentials

Playback statuses:

- `PLAYABLE` authorized HLS/DASH/MP4
- `AVAILABLE_EXTERNALLY` JustWatch/TMDB deep links
- `TRAILER_ONLY` official trailer
- `NO_PLAYBACK_SOURCE` watchlist only

The Einthusan adapter exists but is disabled. Enable it only after you have official API access and lawful playback terms. Do not scrape or proxy streams.

## Attribution

- TMDB: “This product uses the TMDB API but is not endorsed or certified by TMDB.”
- IMDb: ratings from IMDb official datasets where linked titles exist. Follow IMDb linking and attribution requirements for your license.
- JustWatch: watch-provider data is supplied by JustWatch. Availability varies by region.

## Scripts

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Trigger a local TMDB sync (with `CRON_SECRET` set):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/tmdb-sync
```
