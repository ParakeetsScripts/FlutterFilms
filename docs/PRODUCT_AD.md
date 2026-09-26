# FlutterFilms by Ritvik M — 15s Product Advertisement (Production Guide)

Use this document for **screen capture**, **Higgsfield generation**, and **editorial assembly**. Every shot maps to the **real FlutterFilms by Ritvik M UI** in `/Users/rpm/vitamovies`. Do not invent screens.

---

## Before you shoot or generate

### 1. Fix persistence first (recommended)

The app still uses SQLite at `.data/flutter-films.db`. That is fine for local capture, but **do not expand sync/catalog work until Postgres (Neon) is in production**. Sequence:

1. Persistent catalog migration  
2. Real UI capture / reference frames  
3. **16:9** master ad (YouTube / site)  
4. **9:16** vertical cut (Reels / TikTok / Shorts — do not crop 16:9)  
5. Authorized playback integrations  

### 2. Local demo setup

```bash
cd /Users/rpm/vitamovies
npm install
npm run dev
```

Default theme: **noir** (`data-theme="noir"`). Use **1440×900** or **1920×1080** for capture. Disable OS animations if possible; keep browser at 100% zoom.

### 3. Seed personalization (Shot 5)

In browser devtools → Application → Local Storage, or use the app:

- Add **Sweeney Todd** to **Watchlist** and **Favorites**
- Visit `/movie/13885-sweeney-todd-the-demon-barber-of-fleet-street` (creates **History**)
- Optional: authorized **Continue Watching** only if a real `PLAYABLE` source exists

### 4. Canonical demo movie

| Purpose | URL |
| --- | --- |
| Movie detail | `/movie/13885-sweeney-todd-the-demon-barber-of-fleet-street` |
| Search query | `Sweeney Todd` |
| Alternate detail | `/movie/1423191-resident-evil` |

---

## Real UI reference (do not change in the ad)

### Brand

- Wordmark: **Flutter** (primary) + **Films** (secondary) — see `Logo.tsx`
- Site name: **FlutterFilms by Ritvik M**
- Tagline (end card): **Your movies. One beautiful place.**
- Footer line: **TMDB + IMDb metadata**

### Navigation (header)

`Home` · `Movies` · `Latest` · `Watchlist` · `Search` button with **`⌘ K`** (Mac) or **`Ctrl K`** (Windows)

### Homepage sections (exact titles)

1. Cinematic hero (label: **Trending Now** or personalized **Because you watched**)
2. **Trending Now**
3. **Popular**
4. **New Releases**
5. **Coming Soon** (cards show date badges, e.g. **OCT 14**)
6. **Top Rated**
7. **Recently Updated** (cards may show **Updated ·** prefix)
8. Optional: **Because you watched…** (if history exists)
9. Optional: **Continue Watching** (only with real movie progress)

### Search overlay

- Placeholder: **Search movies, people, genres…**
- Sections: **Recent**, **Genres**, **Results**
- Result row: poster · title · year · **TMDB** rating badge

### Movie detail (hero actions — exact copy)

Primary CTA (depends on playback state):

| State | Button label |
| --- | --- |
| Authorized stream | **Watch now** |
| Provider links | **Where to watch** |
| Trailer only | **Watch trailer** |
| None | **Add to watchlist** |

Secondary: **Trailer** (not “Watch Trailer”) · **Watchlist** / **In watchlist** · favorite ♡/♥

Ratings: separate **TMDB** and **IMDb** stacked badges — **never combined**.

Freshness line (if present): **Metadata synchronized …** (relative time, e.g. “2 hours ago”) — in ad you may simplify on-screen to **Updated recently** but do not say “live” or “real-time”.

Sections to scroll through: **Cast** · **Trailer** · **Where to watch** · **Gallery** · **You might also like** · collapsible **More details** / **Data sources**

### Library

| Route | Title |
| --- | --- |
| `/watchlist` | **My Watchlist** |
| `/favorites` | **Favorites** |
| `/history` | **Recently Viewed** |

Tabs: **Watchlist** · **Favorites** · **History**

### Watch page

- Pre-play states: **Authorized playback** · **Watch on a provider** · **Trailer preview**
- Copy: **FlutterFilms does not host films** (trailers / authorized links only)
- Never show full-movie playback unless the app has a legitimate **PLAYABLE** source

### Visual tokens (noir theme)

| Token | Value |
| --- | --- |
| Background | `#06070a` |
| Accent | `#5b9fd4` |
| Text | `#f4f2ed` |
| UI font | Geist |
| Display font | Newsreader (hero titles) |
| Motion | 180–240ms, ease-out |

---

## Shot-by-shot storyboard (15 seconds)

| Time | Shot | Capture / generate | On-screen text |
| --- | --- | --- | --- |
| **0:00–2.5** | Opening | Black/charcoal + film grain; posters in parallax; resolve to wordmark | **FLUTTERFILMS BY RITVIK M** → **YOUR MOVIE WORLD, BEAUTIFULLY ORGANIZED.** |
| **2.5–5.0** | Homepage | Record `/` — slow scroll, hero + rows | **DISCOVER** |
| **5.0–7.0** | Search | `⌘K` → type **Sweeney Todd** → select result | **SEARCH EVERYTHING** |
| **7.0–10.0** | Detail | `/movie/13885-…` — hero, ratings, scroll cast/trailer/providers | **ONE MOVIE. EVERYTHING YOU NEED.** |
| **10.0–12.5** | Library | Watchlist add → `/watchlist` → home **Because you watched…** → **Updated ·** on a card | **DISCOVER MORE OF WHAT YOU LOVE.** |
| **12.5–15.0** | End card | Charcoal + subtle blue glow + logo | **FLUTTERFILMS BY RITVIK M** · tagline · **DISCOVER • SAVE • WATCH** · **TMDB + IMDb metadata** |

### Capture checklist per shot

**Shot 2 — Homepage**

- [ ] Header visible with all four nav items  
- [ ] Hero with backdrop, title, year, runtime, genres, TMDB + IMDb  
- [ ] At least three rows scrolling (Trending, Popular, New Releases)  
- [ ] Slow push-in; one card hover lift  

**Shot 3 — Search**

- [ ] Dark overlay visible  
- [ ] Large search field + shortcut hint  
- [ ] Results for Sweeney Todd with poster/year/rating  
- [ ] Click through to detail (match cut or morph)  

**Shot 4 — Detail**

- [ ] Cinematic backdrop + poster layout (`detail-hero-v2`)  
- [ ] Both rating badges visible  
- [ ] Primary CTA shows **Where to watch** or **Watch trailer** (honest state)  
- [ ] Brief scroll: Cast → Trailer → Where to watch  

**Shot 5 — Personalization**

- [ ] Watchlist confirmation  
- [ ] Library nav tabs  
- [ ] **Because you watched…** row on home  
- [ ] **Updated ·** on Recently Updated card (optional)  
- [ ] TMDB / IMDb shown separately in a rating moment  

---

## Voiceover

> *"Millions of movies. Smarter discovery. FlutterFilms by Ritvik M brings your movie world together."*

Tone: confident, warm, understated — not trailer hype.

---

## Music & SFX

- Atmospheric cinematic pulse → gentle build → clean resolve on logo  
- UI: soft search confirm, card whoosh, watchlist tick — **no trailer booms**

---

## Higgsfield master prompt (paste as-is)

```
Create a premium 15-second product advertisement for FlutterFilms by Ritvik M using the REAL FlutterFilms by Ritvik M interface as visual reference.

FlutterFilms by Ritvik M is a movie DISCOVERY platform (TMDB + IMDb metadata, watchlist, availability). It does NOT host copyrighted films. Do not show Netflix/Disney full-movie playback, torrents, or fake streams.

VISUAL IDENTITY (match exactly):
- Near-black charcoal background (#06070a)
- Soft white typography (#f4f2ed), Geist UI + Newsreader serif for movie titles
- Subtle electric blue accent (#5b9fd4) on CTAs and focus only
- Split wordmark: "Flutter" + "Films"
- Premium spacing, thin borders, poster-first cards, 180–240ms motion

SHOT 1 (0–2.5s): Black cinematic open, film grain, posters in shallow depth of field. Wordmark: FLUTTERFILMS BY RITVIK M. Text: YOUR MOVIE WORLD, BEAUTIFULLY ORGANIZED.

SHOT 2 (2.5–5s): Real FlutterFilms by Ritvik M homepage. Nav: Home, Movies, Latest, Watchlist. Search shows ⌘K. Hero + rows: Trending Now, Popular, New Releases, Coming Soon, Top Rated, Recently Updated. Slow dolly push. Text: DISCOVER.

SHOT 3 (5–7s): Command search overlay. Placeholder: "Search movies, people, genres…". User types "Sweeney Todd". Results: poster, title, year, TMDB rating. Select → movie detail. Text: SEARCH EVERYTHING.

SHOT 4 (7–10s): Real movie detail page. Cinematic backdrop, poster, title, year, runtime, genres, separate TMDB and IMDb ratings (never averaged), overview. Buttons: "Where to watch" or "Watch trailer", "Trailer", "Watchlist". Scroll reveals Cast, Trailer, Where to watch, Gallery, recommendations. Text: ONE MOVIE. EVERYTHING YOU NEED.

SHOT 5 (10–12.5s): Watchlist add, tabs Watchlist/Favorites/History, row "Because you watched…", optional "Updated ·" on card. Separate TMDB and IMDb labels. Text: DISCOVER MORE OF WHAT YOU LOVE.

SHOT 6 (12.5–15s): Clean charcoal end card, subtle blue glow. FLUTTERFILMS BY RITVIK M. Your movies. One beautiful place. DISCOVER • SAVE • WATCH. Footer: TMDB + IMDb metadata.

VO: "Millions of movies. Smarter discovery. FlutterFilms by Ritvik M brings your movie world together."

Camera: slow dolly, controlled parallax, rack focus, no shake, no TikTok cuts.
Audio: premium cinematic electronic, subtle UI sounds, no trailer impacts.
16:9, 1920×1080, photoreal UI, no warped logos, no invented features.
```

### Vertical cut (9:16)

Re-compose — do not crop 16:9:

- Shot 2: single hero + one row  
- Shot 3: full-screen search  
- Shot 4: hero + ratings + one scroll beat  
- Shot 5: watchlist + one personalized row  
- Shot 6: centered end card (larger type)

---

## What NOT to show

- Combined TMDB/IMDb scores  
- Full movie streams without authorized source  
- Fake providers, reviews, subscriptions, user counts  
- “Live” / “Real-time” / “Instant” sync claims  
- UI that does not exist in the app (social feed, AI scores, etc.)

---

## Assembly notes

| Deliverable | Spec |
| --- | --- |
| Master | 16:9 · 1920×1080 · 15s · H.264 or ProRes |
| Social | 9:16 · 1080×1920 · separate edit |
| Safe area | 10% margin for mobile UI overlays |

**Best workflow:** record real UI at 60fps → use captures as Higgsfield reference images → generate transitional/atmosphere shots → composite in edit (DaVinci / Premiere). The product should read as authentic even if some frames are enhanced.

---

## Regression guard

The `/watch` client/server split is fixed. Before publishing the ad, smoke-test:

- `/` loads with all home rows  
- `⌘K` → Sweeney Todd → correct detail page  
- `/movie/13885-sweeney-todd-the-demon-barber-of-fleet-street` — hero, ratings, cast, providers  
- Watchlist persist after refresh  
