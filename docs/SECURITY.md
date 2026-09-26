# Security

## Sessions

- HttpOnly cookie `ff_session`
- Server validates session on every protected API route
- Never trust client-supplied `userId`

## Admin & cron

- `AI_ADMIN_SECRET` — Bearer token for `/api/admin/*`
- `CRON_SECRET` — Bearer token for `/api/cron/*`

## Secrets

Never expose in client bundles:

- Database URLs
- API keys (TMDB, OpenAI, Google OAuth secret)
- Admin/cron secrets

Only `NEXT_PUBLIC_*` vars are client-safe.

## User data

- Private watch history stays private unless user explicitly shares
- Account deletion: `POST /api/auth/delete`
- Privacy center: `/account/privacy`

## AI trust

AI outputs are labeled AI Interpretation / AI Prediction. They are not written into catalog metadata.

## Rate limiting

Applied on auth, analytics, and AI routes via `rateLimit()` in `src/lib/api.ts`.
