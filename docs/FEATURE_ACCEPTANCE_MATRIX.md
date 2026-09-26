# Feature Acceptance Matrix

Generated: 2026-09-26T09:43:48.627Z

## Summary

| Status | Count |
|--------|------:|
| LIVE | 45 |
| BETA | 39 |
| PLANNED | 16 |
| DEGRADED | 0 |
| ERROR | 0 |

## Matrix

| Feature ID | Slug | Status | Backend | DB | API | UI | Tests | Data | AI | Route | Notes |
|-----------:|------|--------|---------|----|----|----|-------|------|----|-------|-------|
| 1 | movie-interview | live | yes | user | yes | yes | yes | catalog+user+auth | none | /my-cinema/interview | Validated |
| 2 | vibe-search | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/discover | Validated |
| 3 | emotion-timeline | beta | yes | catalog | no | yes | no | catalog | chat | /intelligence/discover | No acceptance tests |
| 4 | energy-slider | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/discover | Validated |
| 5 | brain-level | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/discover | Validated |
| 6 | attention-requirement | beta | yes | catalog | no | yes | no | catalog | none | /intelligence/discover | No acceptance tests |
| 7 | background-mode | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/discover | Validated |
| 8 | no-skip-mode | beta | yes | user | yes | yes | no | catalog+user | none | /intelligence/discover | No acceptance tests |
| 9 | instant-pick | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/instant-pick | Validated |
| 10 | movie-roulette | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/movie-roulette | Validated |
| 11 | anti-algorithm | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/anti-algorithm | Validated |
| 12 | taste-expansion | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/taste-expansion | Validated |
| 13 | micro-genre | beta | yes | catalog | no | yes | no | catalog | none | /intelligence/discover | No acceptance tests |
| 14 | movie-dna | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 15 | context-aware | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/context-aware | Validated |
| 16 | movie-briefing | live | yes | catalog | yes | yes | yes | catalog | chat | /intelligence/movie-briefing | Validated |
| 17 | first-time-guide | live | yes | catalog | yes | yes | yes | catalog | chat | /intelligence/first-time-guide | Validated |
| 18 | spoiler-shield | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 19 | character-primer | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/character-primer | No acceptance tests |
| 20 | world-primer | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/world-primer | No acceptance tests |
| 21 | franchise-catchup | beta | yes | catalog | no | yes | no | catalog+franchise | none | /franchises | No acceptance tests |
| 22 | ending-explanation | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 23 | theme-explorer | live | yes | catalog | yes | yes | yes | catalog | chat | /intelligence/theme-explorer | Validated |
| 24 | motif-explorer | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/motif-explorer | No acceptance tests |
| 25 | symbolism-mode | live | yes | catalog | no | yes | yes | catalog | chat | /copilot | Validated |
| 26 | filmmaking-breakdown | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/filmmaking-breakdown | No acceptance tests |
| 27 | director-intent | planned | no | catalog | no | no | no | catalog | none | /intelligence/director-intent | No service implementation; No acceptance tests |
| 28 | production-challenges | planned | no | catalog | no | no | no | catalog | none | /intelligence/production-challenges | No service implementation; No acceptance tests |
| 29 | location-intelligence | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/location-intelligence | Validated |
| 30 | version-comparison | planned | no | catalog | no | no | no | catalog | none | /intelligence/version-comparison | No service implementation; No acceptance tests |
| 31 | actor-similarity | live | yes | catalog | yes | yes | yes | catalog+people | none | /person | Validated |
| 32 | director-similarity | beta | yes | catalog | yes | yes | no | catalog+people | none | /person | No acceptance tests |
| 33 | actor-chemistry | beta | yes | catalog | no | yes | no | catalog+people | none | /person | No acceptance tests |
| 34 | collaboration-graph | planned | no | catalog | no | no | no | catalog | none | /intelligence/collaboration-graph | No service implementation; No acceptance tests |
| 35 | career-turning-points | beta | yes | catalog | yes | yes | no | catalog+people | none | /person | No acceptance tests |
| 36 | filmography-journey | beta | yes | catalog | yes | yes | no | catalog+people | none | /person | No acceptance tests |
| 37 | underseen-actor | planned | no | catalog | no | no | no | catalog | none | /intelligence/underseen-actor | No service implementation; No acceptance tests |
| 38 | crew-discovery | planned | no | catalog | no | no | no | catalog | none | /intelligence/crew-discovery | No service implementation; No acceptance tests |
| 39 | crew-influence | planned | no | catalog | no | no | no | catalog | none | /intelligence/crew-influence | No service implementation; No acceptance tests |
| 40 | creative-team-dna | planned | no | catalog | no | no | no | catalog | none | /intelligence/creative-team-dna | No service implementation; No acceptance tests |
| 41 | franchise-health | beta | yes | catalog | yes | yes | no | catalog+franchise | none | /franchises | No acceptance tests |
| 42 | timeline-conflicts | live | yes | catalog | yes | yes | yes | catalog+franchise | none | /intelligence/timeline-conflicts | Validated |
| 43 | watch-order | beta | yes | catalog | no | yes | no | catalog+franchise | none | /collection | No acceptance tests |
| 44 | franchise-entry | beta | yes | catalog | yes | yes | no | catalog+franchise | none | /intelligence/franchise-entry | No acceptance tests |
| 45 | franchise-completion | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 46 | universe-map | planned | no | catalog | no | no | no | catalog | none | /intelligence/universe-map | No service implementation; No acceptance tests |
| 47 | franchise-similarity | live | yes | catalog | yes | yes | yes | catalog+franchise | none | /intelligence/franchise-similarity | Validated |
| 48 | spin-off-discovery | live | yes | catalog | yes | yes | yes | catalog+franchise | none | /intelligence/spin-off-discovery | Validated |
| 49 | adaptation-tracker | planned | no | catalog | no | no | no | catalog | none | /intelligence/adaptation-tracker | No service implementation; No acceptance tests |
| 50 | remake-evolution | planned | no | catalog | no | no | no | catalog | none | /intelligence/remake-evolution | No service implementation; No acceptance tests |
| 51 | taste-dna-2 | live | yes | user | yes | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 52 | taste-contradiction | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 53 | favorite-patterns | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 54 | regret-predictor | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/regret-predictor | Validated |
| 55 | rewatch-probability | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 56 | taste-evolution | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 57 | personality-card | live | yes | user | yes | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 58 | genre-map | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 59 | decade-map | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 60 | global-cinema-map | live | yes | user | no | yes | yes | catalog+user+auth | none | /my-cinema | Validated |
| 61 | group-picker | beta | yes | user | yes | yes | no | catalog+user | none | /community | No acceptance tests |
| 62 | taste-intersection | beta | yes | user | yes | yes | no | catalog+user | none | /community | No acceptance tests |
| 63 | friend-recs | planned | no | catalog | no | no | no | catalog | none | /intelligence/friend-recs | No service implementation; No acceptance tests |
| 64 | shared-watchlists | live | yes | user | yes | yes | yes | catalog+user+auth | none | /watchlists | Validated |
| 65 | movie-room | live | yes | user | yes | yes | yes | catalog+user+auth | none | /rooms | Validated |
| 66 | debate-mode | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 67 | spoiler-rooms | planned | no | catalog | no | no | no | catalog | none | /intelligence/spoiler-rooms | No service implementation; No acceptance tests |
| 68 | discussion-starter | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 69 | sentiment-map | planned | no | catalog | no | no | no | catalog | none | /intelligence/sentiment-map | No service implementation; No acceptance tests |
| 70 | taste-match | beta | yes | user | yes | yes | no | catalog+user | none | /community | No acceptance tests |
| 71 | smart-resume | beta | yes | user | no | yes | no | user | none | /watchlist | No acceptance tests |
| 72 | session-planner | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/session-planner | Validated |
| 73 | double-feature | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/double-feature | Validated |
| 74 | weekend-marathon | live | yes | user | yes | yes | yes | catalog+user | none | /copilot | Validated |
| 75 | family-planner | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/family-planner | Validated |
| 76 | short-on-time | live | yes | user | yes | yes | yes | catalog+user | none | /intelligence/short-on-time | Validated |
| 77 | food-pairing | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 78 | atmosphere-mode | beta | yes | catalog | no | yes | no | catalog | chat | /copilot | No acceptance tests |
| 79 | post-reflection | live | yes | user | no | yes | yes | catalog+user+auth | none | /copilot | Validated |
| 80 | rewatch-reflection | planned | no | catalog | no | no | no | catalog | none | /intelligence/rewatch-reflection | No service implementation; No acceptance tests |
| 81 | scene-memory | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/remember | Validated |
| 82 | quote-search | planned | no | catalog | no | no | no | catalog | none | /intelligence/quote-search | No service implementation; No acceptance tests |
| 83 | visual-description | beta | yes | catalog | yes | yes | no | catalog | none | /intelligence/visual-description | No acceptance tests |
| 84 | remember-wizard | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/remember | Validated |
| 85 | nl-filters | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/nl-filters | Validated |
| 86 | narrative-structure | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/narrative-structure | No acceptance tests |
| 87 | pacing-search | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/pacing-search | No acceptance tests |
| 88 | character-arc | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/character-arc | No acceptance tests |
| 89 | relationship-search | beta | yes | catalog | yes | yes | no | catalog | none | /intelligence/relationship-search | No acceptance tests |
| 90 | semantic-catalog | live | yes | catalog | yes | yes | yes | catalog | none | /intelligence/semantic-catalog | Validated |
| 91 | poster-generator | live | yes | catalog | yes | yes | yes | catalog | image | /images | Validated |
| 92 | watchlist-poster | beta | yes | catalog | yes | yes | no | catalog | image | /images | No acceptance tests |
| 93 | movie-night-card | beta | yes | catalog | yes | yes | no | catalog | image | /images | No acceptance tests |
| 94 | franchise-graphic | beta | yes | catalog | yes | yes | no | catalog | image | /images | No acceptance tests |
| 95 | comparison-graphic | beta | yes | catalog | yes | yes | no | catalog | image | /images | No acceptance tests |
| 96 | trailer-concept | beta | yes | catalog | yes | yes | no | catalog | chat | /images | No acceptance tests |
| 97 | review-assistant | beta | yes | catalog | yes | yes | no | catalog | chat | /images | No acceptance tests |
| 98 | cinema-newsletter | beta | yes | catalog | yes | yes | no | catalog | chat | /intelligence/cinema-newsletter | No acceptance tests |
| 99 | weekly-brief | beta | yes | catalog | yes | yes | no | catalog | chat | /my-cinema | No acceptance tests |
| 100 | cinema-agent | live | yes | catalog | yes | yes | yes | catalog | chat,reasoning | /copilot | Validated |
