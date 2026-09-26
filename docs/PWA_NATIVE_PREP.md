# FlutterFilms — PWA & future native packaging

FlutterFilms is a **Progressive Web App (PWA)**. Users install it through supported browsers (Add to Home Screen, Install app, or desktop install). It is **not** distributed via the App Store or Google Play unless a separate native wrapper is published later.

## Current production PWA surface

| Asset | Location |
| --- | --- |
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` |
| Service worker | `public/sw.js` (scope `/`) |
| Icons | `public/icons/*` (generate with `python3 scripts/generate-pwa-icons.py`) |
| Install UX | `/install`, `InstallBanner`, `beforeinstallprompt` when supported |
| Offline shell | `/offline` + cached shell routes only |

## Canonical origin

Set `NEXT_PUBLIC_SITE_URL` to the verified production origin (e.g. `https://flutter-films.vercel.app`). Metadata, sitemap, robots, and install copy derive from this value.

## Offline honesty

- Cached: app shell, static assets, `/offline`
- **Not** cached: `/api/*`, `/account/*`, auth routes
- **Not** claimed: offline movie streaming

## Future native wrappers (optional)

The repo includes Capacitor scaffolding (`capacitor.config.ts`) pointing at the production web origin. A future native package could:

1. Wrap the production PWA in a WebView (Capacitor) or Trusted Web Activity (Android)
2. Reuse the same manifest icons and deep links
3. Publish store listings only when real binaries exist

Do **not** ship fake APK/IPA downloads or store badges without real listings.
