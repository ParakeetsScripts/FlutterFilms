# Vercel Blocker Report

Updated 2026-09-26.

## Status: PARTIAL — deployed, env incomplete

**Preview:** https://flutter-films-7u8vjfkqc-vita-health1.vercel.app  
**Production:** https://flutter-films.vercel.app (deployment protection may apply)

## Resolved

| Requirement | Status |
|-------------|--------|
| Vercel CLI | Available via `npx vercel` |
| Vercel authentication | `ritvik-m5` on team `vita-health1` |
| Project link | `vita-health1/flutter-films` (did not touch `vitahealth`) |
| Hobby cron limits | Fixed — all crons run once per day |

## Still blocking production

| Requirement | Status |
|-------------|--------|
| `DATABASE_URL` on Vercel | **Not set** — Neon required |
| `DIRECT_DATABASE_URL` | **Not set** |
| `CRON_SECRET` | **Not set** |
| `AI_ADMIN_SECRET` | **Not set** |
| Production migrations | Cannot run until Postgres URL is set |
| Verified deployment URL | **Deployed** — build passes; app needs Neon + secrets for full function |

## Deploy commands (after Neon + secrets)

```bash
cd /Users/rpm/vitamovies
vercel env add DATABASE_URL production
vercel env add DIRECT_DATABASE_URL production
vercel env add TMDB_API_KEY production
vercel env add CRON_SECRET production
vercel env add AI_ADMIN_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env pull .env.local
npm run db:migrate
npx vercel          # preview
npx vercel --prod   # production
```

## What passes locally

- `npm run typecheck` ✓
- `npm test` (53) ✓
- `npm run build` ✓
