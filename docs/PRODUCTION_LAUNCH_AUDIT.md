# Production Launch Audit

**Date:** 2026-09-26  
**Repository:** `/Users/rpm/vitamovies`

## Summary

FlutterFilms by Ritvik M **builds and deploys to Vercel** (`vita-health1/flutter-films`). Production Neon is **not configured** on Vercel yet — runtime falls back to ephemeral SQLite on serverless (not suitable for production). Local dev uses SQLite at `.data/flutter-films.db`.

---

## CRITICAL (must fix before public launch)

| Issue | Status | Action |
|-------|--------|--------|
| DATABASE_URL not set on Vercel | **OPEN** | Add Neon pooled + direct URLs in Vercel dashboard |
| Production URL behind deployment protection | **VERIFY** | Disable protection or use bypass for public beta |
| Zero production users/events | **EXPECTED** | Launch first, then measure |

## HIGH

| Issue | Status | Action |
|-------|--------|--------|
| Vercel env vars empty | **OPEN** | Add Neon + secrets in Vercel dashboard for `flutter-films` |
| Hobby cron limits | **FIXED** | Crons set to once/day in `vercel.json` |
| Catalog only 16 movies locally | **OPEN** | Run TMDB sync cron on production after deploy |
| CRON_SECRET / AI_ADMIN_SECRET on Vercel | **VERIFY** | Set in Vercel dashboard |

## MEDIUM

| Issue | Status | Action |
|-------|--------|--------|
| PWA icons are placeholders | **ACCEPTABLE** | Replace with branded icons before marketing push |
| iOS not App Store submitted | **EXPECTED** | See `IOS_RELEASE_STATUS.md` |
| Retention D1/D7/D14/D30 | **INSUFFICIENT DATA** | Requires real cohorts post-launch |

## LOW

| Issue | Status | Action |
|-------|--------|--------|
| Google OAuth optional | **OK** | Email auth works without OAuth |
| Cloud AI optional | **OK** | Graceful degradation implemented |

---

## Verified passing locally

- `npm run typecheck` ✓
- `npm test` (53 tests) ✓
- `npm run build` ✓
- Feature validator: 45 LIVE · 39 BETA · 16 PLANNED
- Auth session model implemented
- Cross-user watchlist permission tests
- Analytics event pipeline
- PWA manifest + service worker
- Capacitor iOS project generated
- SEO: sitemap, robots, OG on movie pages

---

## Launch commands

```bash
# 1. Configure Neon in Vercel (DATABASE_URL, DIRECT_DATABASE_URL)
# 2. Set TMDB_API_KEY, CRON_SECRET, AI_ADMIN_SECRET, NEXT_PUBLIC_SITE_URL
vercel link
vercel env pull .env.local
npm run db:migrate          # against production DATABASE_URL
vercel --prod
# 3. Trigger catalog sync
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/tmdb-sync
```

---

## Post-launch success metric

**100 real users** → measure activation, retention, AI adoption, social actions.

Do not optimize feature count. Optimize return behavior.
