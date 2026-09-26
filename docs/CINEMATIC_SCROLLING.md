# Cinematic Scrolling System

FlutterFilms uses a shared horizontal rail system and lightweight scroll reveals.

## Components

| File | Role |
|------|------|
| `src/components/navigation/CinematicRail.tsx` | Horizontal rail: arrows, wheel, keyboard, progress, scroll memory |
| `src/components/navigation/RailControls.tsx` | Left/right arrow buttons |
| `src/components/navigation/RailProgress.tsx` | Subtle progress bar |
| `src/components/navigation/ScrollToTop.tsx` | Floating return-to-top |
| `src/components/scrollytelling/ScrollReveal.tsx` | Section enter animation via IntersectionObserver |
| `src/components/movie/MovieRow.tsx` | Primary consumer — wraps cards in `CinematicRail` |

## Arrow behavior

- Hidden when no horizontal overflow
- Left disabled at start; right disabled at end
- Desktop only (≥768px); touch uses native swipe
- Scroll step ≈ 80% of visible width

## Keyboard

`ArrowLeft` / `ArrowRight` / `Home` / `End` on focused rail region.

## Reduced motion

`prefers-reduced-motion: reduce` disables scroll reveals and uses instant scroll.

## Analytics

`rail_arrow_left`, `rail_arrow_right`, `rail_end_reached`, `scrolly_section_view`, `scroll_to_top`

## Scroll memory

`sessionStorage` key `rail:{storageKey}` preserves horizontal position per rail id.
