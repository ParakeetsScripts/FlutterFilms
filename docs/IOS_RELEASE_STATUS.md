# iOS Release Status

## Current state: READY (development) / BLOCKED (App Store)

| Item | Status |
|------|--------|
| Capacitor project | ✓ Generated at `/ios` |
| Bundle ID | `com.flutterfilms.app` |
| App name | FlutterFilms by Ritvik M |
| Deep links | Configured in `NativeBridge` |
| Share / Haptics | Implemented via Capacitor plugins |
| Xcode build | **Not verified** in this environment |
| App Store submission | **Not performed** |

## Remaining Apple requirements

- Apple Developer Program enrollment ($99/year)
- Distribution certificate + provisioning profile
- App Store Connect app record
- Privacy policy URL (production `/account/privacy`)
- Screenshots (6.7" iPhone required)
- 1024×1024 App Store icon (replace placeholder)

## Build locally

```bash
export CAPACITOR_SERVER_URL=https://your-production-domain.vercel.app
npx cap sync ios
npx cap open ios
```

See `IOS_BUILD.md` and `APP_STORE_RELEASE.md`.

## Honest assessment

The iOS shell is **prepared**, not **shipped**. Do not claim App Store availability until TestFlight validates on real devices.
