# FlutterFilms by Ritvik M Design System

## Principles

- **Cinematic first** — movie artwork carries the visual weight; UI frames it.
- **Neutral dark base** — five surface depths, not saturated blue blocks.
- **Accent sparingly** — CTAs, active nav, links, focus only.
- **Editorial typography** — Newsreader for titles; Geist for UI.

## Themes

| Theme | Use |
| --- | --- |
| `noir` | Default neutral cinematic dark |
| `charcoal` | Cool graphite |
| `velvet` | Warm theater charcoal |
| `dawn` | Light editorial mode |

Set via `data-theme` on `<html>`, persisted in user settings.

## Surface hierarchy

| Level | Token | Role |
| --- | --- | --- |
| 0 | `--bg-0` | Page background |
| 1 | `--bg-1` | Section tint |
| 2 | `--surface-1` | Subtle panels |
| 3 | `--surface-2` / `--surface-3` | Cards, menus |
| 4 | `--nav-bg` | Floating navigation |

## Typography

- **Display**: `--font-display` (Newsreader) — hero titles, section headers
- **UI**: `--font-ui` (Geist) — nav, buttons, metadata, body
- Body: 16px · Meta: 12px · Eyebrow: uppercase + letter-spacing

## Spacing scale

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80` (`--space-*`)

## Radius

- `--radius-sm` 6px · `--radius-md` 10px · `--radius-lg` 14px · `--radius-xl` 18px

## Components

- `Logo` — split Flutter / Films identity
- `MovieCard` — poster-first with hover metadata
- `MovieRow` / `MovieGrid` — discovery layouts
- `Hero` — cinematic homepage feature
- `RatingBadge` — compact TMDB / IMDb labels
- `SearchOverlay` — command palette (⌘K / Ctrl+K)
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-ghost`

## Motion

- Fast interactions: 180ms
- Standard: 240ms
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Respect `prefers-reduced-motion` and user setting `reduceMotion`

## Accessibility

- Visible `:focus-visible` with accent outline
- No critical information hover-only on mobile
- Semantic headings and ARIA on search dialog
