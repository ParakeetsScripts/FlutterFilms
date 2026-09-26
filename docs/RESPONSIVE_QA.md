# Responsive QA Report

**Date:** 2026-09-26  
**Repository:** `/Users/rpm/vitamovies`

## Automated tests executed

| Suite | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm test` (Vitest) | PASS — 58 tests |
| `npm run build` | PASS |
| `npm run test:e2e` (Playwright) | **233 passed**, 7 skipped, 0 failed |

Playwright projects: 12 viewports × key routes (/, /movies, /copilot, /my-cinema, /watchlist, /rooms, /intelligence, /images, /videos).

Assertions per route:
- `document.documentElement.scrollWidth <= window.innerWidth + 1` (no accidental horizontal scroll)
- Primary content visible (h1, hero title, empty state, or loading status)

Skipped: desktop-only “Sign in → /login” on viewports &lt; 900px (mobile uses More → Sign in).

## Matrix (automated overflow + content)

| Viewport | Home | Movies | Copilot | My Cinema | Watchlist | Rooms | Intelligence | Images | Videos |
|----------|------|--------|---------|-----------|-----------|-------|--------------|--------|--------|
| 320×568 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 375×667 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 375×812 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 390×844 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 414×896 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 768×1024 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 820×1180 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1024×1366 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1280×800 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1440×900 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1920×1080 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 2560×1440 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## Manual / not verified in this run

| Area | Status |
|------|--------|
| Real device Safari iOS keyboard overlap | BLOCKED — no device farm |
| Physical PWA install (Chrome/Safari/Android) | BLOCKED — manual |
| Movie detail page (MovieDetailView) | NOT in e2e matrix — add next |
| Visual screenshot regression baselines | NOT configured |
| Landscape phone video/copilot | NOT automated |
| Auth flows with real Neon users | BLOCKED — env |

## Fixes applied this pass

- **Because you watched** — only when favorite or ≥60s playback (`getTasteAnchorId`); uses real TMDB recommendations via `PersonalizedRow`
- **Movie cards** — removed duplicate hover title; `Save`/`Saved` instead of `+`
- **Navigation** — 5 primary tabs + More; thicker header (72px); logo + “Built by Ritvik. M”
- **Themes** — 14 palettes; picker in Settings only (removed header theme toggle)
- **Footer** — 4-column grid on desktop, collapsible categories on mobile
- **Install banner** — compact bottom sheet on mobile; sticky top on desktop
- **Design tokens** — gutters, touch targets, `ResponsiveContainer`, overflow clipping

## Remaining issues

1. TMDB rate limits during parallel e2e (logged server-side; tests still passed)
2. Movie detail, person, collection pages need dedicated responsive tests
3. Copilot streaming/keyboard behavior needs manual mobile Safari QA
4. Screenshot regression baselines not generated

## Commands

```bash
npm run test:e2e          # all viewports
npm run test:e2e -- --project=iphone-se
CI=1 npm run test:e2e     # fresh production server
```
