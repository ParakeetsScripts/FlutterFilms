# Vercel Deployment

## Prerequisites

- Vercel account linked to the Git repository
- Neon Postgres `DATABASE_URL` and `DIRECT_DATABASE_URL`
- `TMDB_API_KEY` or `TMDB_API_TOKEN`
- `CRON_SECRET` — Bearer token for `/api/cron/*`
- `AI_ADMIN_SECRET` — Bearer token for `/api/admin/*`
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://your-domain.vercel.app`

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon pooled connection |
| `DIRECT_DATABASE_URL` | Yes | Migrations / direct queries |
| `TMDB_API_KEY` | Yes | Catalog sync |
| `CRON_SECRET` | Yes | Cron authentication |
| `AI_ADMIN_SECRET` | Yes | Admin dashboards |
| `OLLAMA_BASE_URL` | No | Local/cloud Ollama |
| `OPENAI_API_KEY` | No | Cloud chat |
| `GOOGLE_CLIENT_ID` / `SECRET` | No | OAuth |
| `NEXT_PUBLIC_VERCEL_ANALYTICS` | No | Enable Vercel Analytics bridge |

## Deploy steps

```bash
cd /Users/rpm/vitamovies
npm ci
npm run db:migrate    # against production DATABASE_URL
npm run typecheck
npm test
npm run build
```

### CLI (if authenticated)

```bash
vercel link
vercel env pull .env.local
vercel --prod
```

### Git integration

Push to `main` — Vercel builds automatically if the project is connected.

## Cron jobs

Defined in `vercel.json` (Hobby-compatible — once per day each):

- TMDB sync — daily 02:00 UTC
- IMDb sync — daily 04:00 UTC
- Provider sync — daily 06:00 UTC
- Health check — daily 08:00 UTC

On Vercel Pro you can increase frequency (e.g. TMDB every 4 hours). Manual sync remains available via `curl` with `CRON_SECRET`.

Cron requests must include `Authorization: Bearer $CRON_SECRET`.

## Health checks

- `/admin/release` — readiness dashboard (requires `AI_ADMIN_SECRET`)
- `/api/cron/health-check` — automated probe

## Preview deployments

Every PR branch receives a preview URL. Use separate Neon branch or preview database when possible.

## Blockers

If Vercel CLI is not authenticated or env vars are missing, see `/admin/release` for a **VERCEL BLOCKER REPORT** — do not assume deployment succeeded.
