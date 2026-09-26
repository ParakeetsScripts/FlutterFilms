# FlutterFilms by Ritvik M — Product Overview

## Problem

People spend more time choosing than watching. Traditional databases answer *what is this movie?* — not *what should I watch tonight with friends?*

## Solution

FlutterFilms by Ritvik M combines verified catalog data (TMDB/IMDb), personal taste, AI reasoning, and social coordination into one loop:

**Discover → AI helps you choose → Save → Watch → Reflect → Share → Movie Room → Return**

## Target users

- Movie lovers overwhelmed by choice
- Friend groups planning movie night
- Couples/families with different tastes
- Returning viewers building long-term taste profiles

## Core loop (this phase)

1. **Hero AI search** — describe mood, get real catalog matches
2. **Tonight Picker** — one recommendation with explanation
3. **Shared watchlists** — collaborative lists with OWNER/EDITOR/VIEWER permissions
4. **Movie rooms** — invite link, preferences, voting, AI group pick
5. **Taste DNA** — visualized from real signals
6. **Retention analytics** — activation funnel, social events, honest INSUFFICIENT DATA states

## Architecture

- **Web:** Next.js 16, Neon Postgres, SQLite local fallback
- **AI:** Cinema Agent + feature runtime; Ollama/cloud providers
- **Social:** Postgres-persisted watchlists & rooms; polling-based live sync
- **Mobile:** PWA + Capacitor iOS (`com.flutterfilms.app`)
- **Analytics:** First-party events + optional Vercel bridge

## Monetization foundation

Configurable usage limits for AI/generation — no hardcoded pricing.

## Security

Session-based auth; server-side permission checks on every mutation; private histories never exposed to rooms unless explicitly shared.

## Deployment

Vercel for web; App Store via Capacitor + Apple Developer Program ($99/year).

See `ARCHITECTURE.md`, `VERCEL_DEPLOYMENT.md`, `APP_STORE_RELEASE.md`.
