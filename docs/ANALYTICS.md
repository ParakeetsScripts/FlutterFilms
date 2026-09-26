# Analytics

## Philosophy

First-party, privacy-conscious product analytics. No fabricated metrics. When data is insufficient, dashboards show **INSUFFICIENT DATA**.

## Client API

```ts
import { track } from "@/lib/analytics/track";

track("movie_viewed", { movieId: 550 });
track("tonight_picker_completed", { movieId: 550, mood: "low" });
```

## Event types

Defined in `src/lib/analytics/events.ts`:

- Navigation: `page_view`, `session_start`
- Auth: `signup_completed`, `login_completed`
- Catalog: `movie_viewed`, `movie_searched`
- AI: `ai_prompt_submitted`, `ai_response_received`, `cinema_agent_used`
- Product: `watchlist_added`, `favorite_added`, `tonight_picker_completed`, `onboarding_completed`
- Growth: `cta_clicked`, `pwa_installed`, `room_created`

## Storage

Tables: `analytics_events`, `analytics_sessions`

Migration: `db/migrations/006_postgres_analytics.sql`, SQLite `MIGRATIONS_V7`

## Server ingestion

`POST /api/analytics/track` — rate limited, attaches authenticated `user_id` when session exists.

## Admin dashboard

`/admin/product` — requires `Authorization: Bearer $AI_ADMIN_SECRET`

Ranges: today, 7d, 30d, 90d, all

## Vercel Web Analytics (optional)

Set `NEXT_PUBLIC_VERCEL_ANALYTICS=1` and install `@vercel/analytics`. Events are mirrored via `src/lib/analytics/providers.ts` without replacing first-party storage.

## Funnel

Visitor → Search → Movie View → Watchlist → Return Visit

Computed from real `analytics_events` in `/api/admin/product`.
