# iOS Build Guide

## Prerequisites

- macOS with Xcode installed
- Apple Developer account (for device/TestFlight; simulator works without)
- Capacitor packages installed (`@capacitor/core`, `@capacitor/ios`)

## Bundle identifier

```
com.flutterfilms.app
```

## Configuration

`capacitor.config.ts` points `server.url` at your production Vercel URL (recommended) or local dev server.

```bash
export CAPACITOR_SERVER_URL=https://your-production-domain.vercel.app
```

## Build steps

```bash
cd /Users/rpm/vitamovies
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select development team (Signing & Capabilities)
2. Choose simulator or connected device
3. Product → Build (⌘B)
4. Product → Run (⌘R)

## Native features

- Deep links via `@capacitor/app` (`NativeBridge` component)
- Share sheet via `@capacitor/share`
- Haptics via `@capacitor/haptics`

## Deep links

Universal links / custom scheme: `flutterfilms://movie/{id}`, `flutterfilms://room/{code}`

Configure associated domains in Xcode when production domain is stable.

## Status

- iOS project: **generated** (`/ios`)
- App Store submission: **not performed** — requires Apple Developer Program

See also `APP_STORE_RELEASE.md`.
