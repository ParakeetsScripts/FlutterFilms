# Production Verification

Last run: **2026-09-26** — HTTP status smoke (pre–third-pass deploy; re-verify after push).

## Method

```bash
node -e "fetch('https://flutter-films.vercel.app/').then(r=>console.log(r.status))"
# or: /usr/bin/curl -s -o /dev/null -w "%{http_code}" "https://flutter-films.vercel.app<route>"
```

## Routes checked

| Route | Status |
|-------|--------|
| `/` | 200 |
| `/onboarding` | 200 |
| `/movies` | 200 |
| `/discover` | 200 |
| `/tonight` | 200 |
| `/movie/1423191-resident-evil` | 200 |
| `/copilot` | 200 |
| `/my-cinema` | 200 |
| `/watchlists` | 200 |
| `/rooms` | 200 |
| `/intelligence` | 200 |
| `/community` | 200 |

## APIs (representative)

- `GET /api/search?query=interstellar` — not re-run this pass
- `POST /api/ai/chat` — requires model env + auth for mutations
- `POST /api/ai/features/cinema-agent` — covered by unit regression tests

## Production verdict

**PRODUCTION NOT VERIFIED** for authenticated agent mutations, memory CRUD, or post-deploy third-pass changes.

Public route smoke: **all listed routes returned HTTP 200** on 2026-09-26.

**Note:** Watchlist mutation, memory CRUD, and recommendation feedback require signed-in session — verify via E2E (`e2e/routes.spec.ts`) or manual login after deploy.
