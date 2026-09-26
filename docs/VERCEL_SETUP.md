# Vercel + GitHub + Neon Setup

**Project:** `vita-health1/flutter-films`  
**Production URL:** https://flutter-films.vercel.app  
**GitHub:** https://github.com/ritvik-m5/FlutterFilms (private)

## Completed

| Item | Status |
|------|--------|
| Neon Postgres (`flutter-films-db`) | Provisioned via Vercel Marketplace |
| `DATABASE_URL` | Set (pooled) |
| `DIRECT_DATABASE_URL` | Set (unpooled / migrations) |
| `TMDB_API_KEY` | Set (production, preview, development) |
| `CRON_SECRET` | Set (production, preview) |
| `AI_ADMIN_SECRET` | Set (production, preview) |
| `NEXT_PUBLIC_SITE_URL` | `https://flutter-films.vercel.app` |
| Postgres migrations | Applied (V1–V8) |
| GitHub Actions deploy | `.github/workflows/deploy.yml` on `master` |
| GitHub secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Production redeploy | Live at https://flutter-films.vercel.app (CLI + Actions) |

## Deploy on push (GitHub Actions)

Pushes to `master` run [Deploy to Vercel](https://github.com/ritvik-m5/FlutterFilms/actions/workflows/deploy.yml): `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. This replaces native Vercel Git integration when the private repo cannot grant the Vercel GitHub App access.

## Git integration (native Vercel ↔ GitHub) — optional

Native `vercel git connect` requires the [Vercel GitHub App](https://github.com/apps/vercel) to access the private repo. Currently blocked on GitHub **sudo / email verification** for `ritvik-m5`. GitHub Actions deploys are fully functional without this step.

To finish native integration later:

1. https://github.com/apps/vercel/installations/new → grant access to `FlutterFilms`
2. `cd /Users/rpm/vitamovies && npx vercel git connect --yes`

## Post-deploy: seed catalog

```bash
# Use the CRON_SECRET value from Vercel dashboard → Settings → Environment Variables
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://flutter-films.vercel.app/api/cron/tmdb-sync
```

## Local production env

```bash
npx vercel env pull .env.local --environment=development
npm run db:migrate   # uses DATABASE_URL from .env.local
```
