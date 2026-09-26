# App Store Release (iOS)

## Overview

FlutterFilms uses **Capacitor** to wrap the production web app with native iOS capabilities (deep links, share sheet, haptics, secure storage). This is not a bare URL wrapper — native plugins provide app-like behavior.

**Apple Developer Program:** $99/year — required for TestFlight and App Store distribution.

## Bundle identifier

```
com.flutterfilms.app
```

Configure in `capacitor.config.ts` and Xcode after `npx cap add ios`.

## Setup

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
export CAPACITOR_SERVER_URL=https://your-production-domain.vercel.app
npx cap init "FlutterFilms by Ritvik M" com.flutterfilms.app --web-dir=out
npx cap add ios
npx cap sync ios
npx cap open ios
```

> **Note:** For static export, configure Next.js `output: 'export'` or point Capacitor `server.url` at the live Vercel deployment (recommended — single source of truth).

## Native features (planned / incremental)

- Universal links / deep links to `/movie/[id]`, `/tonight`
- Native share sheet for Taste DNA and recommendation cards
- Haptic feedback on Tonight pick
- Push notifications (watchlist reminders) — requires APNs credentials

## App Store Connect metadata

| Field | Value |
|-------|-------|
| App name | FlutterFilms by Ritvik M |
| Subtitle | Your movies. Your taste. Your AI. |
| Category | Entertainment |
| Age rating | Prepare via questionnaire (movie metadata references) |
| Privacy policy URL | Production `/account/privacy` |
| Support URL | Production site `/about` |

### Keywords (suggested)

movies, recommendations, watchlist, AI, cinema, tonight, taste

### Review notes template

```
FlutterFilms by Ritvik M is a movie discovery app. It does NOT host or stream copyrighted films.
Playback links use authorized TMDB/JustWatch metadata only.
Demo account: use /demo on the website for the investor journey.
AI features require network; degraded mode shows catalog-only results.
```

## Screenshots checklist

- [ ] iPhone 6.7" — Home hero + AI search
- [ ] iPhone 6.7" — Tonight picker result
- [ ] iPhone 6.7" — Movie detail
- [ ] iPhone 6.7" — Taste DNA / My Cinema
- [ ] iPad 12.9" — Discover grid

## Icon checklist

- [ ] 1024×1024 App Store icon
- [ ] Xcode asset catalog from `public/icons/icon-512.png`

## Signing

1. Enroll in Apple Developer Program
2. Create App ID `com.flutterfilms.app`
3. Create distribution certificate + provisioning profile
4. Configure signing in Xcode → Signing & Capabilities

## TestFlight

1. Archive in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Add internal/external testers
4. Collect feedback before submission

## Submission

Only submit when:

- Production URL is stable on Vercel
- Privacy policy and account deletion work
- App provides meaningful native value beyond a website bookmark

**This document does not imply the app has been submitted or approved.**
