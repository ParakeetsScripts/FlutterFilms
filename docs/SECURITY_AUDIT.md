# Security Audit Summary

## Authentication

- Session cookie `ff_session` (httpOnly)
- `requireSessionUser()` on protected API routes
- Client-supplied user IDs never trusted

## Authorization (verified)

| Resource | Check |
|----------|-------|
| Shared watchlists | Role-based (owner/editor/viewer) server-side |
| Movie rooms | Owner-only lock/restart/close |
| Admin APIs | `AI_ADMIN_SECRET` Bearer token |
| Cron | `CRON_SECRET` Bearer token |

## Cross-user isolation

- Acceptance tests in `watchlists.test.ts` verify viewer cannot edit
- Room votes scoped by `voter_id`
- User library sync requires valid session

## Rate limiting

Applied on auth, analytics, AI, and social routes.

## Secrets

- Never exposed in client bundles
- Environment audit at `/admin/release` shows READY/MISSING without values

## AI / prompt injection

- Cinema Agent uses tool calls against catalog — not raw DB dumps
- Trust labels on AI interpretation vs verified facts

## Recommendations

- Enable Postgres RLS for multi-tenant hardening in production Neon
- Rotate `CRON_SECRET` and `AI_ADMIN_SECRET` per environment
- Add CSRF tokens if cookie auth used from non-same-site contexts

## Pending manual verification

- Production SSRF on AI provider URLs
- File upload paths (image studio reference images)
- Penetration test before public launch
