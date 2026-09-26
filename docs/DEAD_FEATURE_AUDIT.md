# Flutter Films — Dead Feature Audit

**Audit date:** 2026-09-26  
**Production:** https://flutter-films.vercel.app  
**Repository:** `/Users/rpm/vitamovies`

## Executive summary

This audit traced routes, APIs, feature registry entries, AI services, TMDB/IMDb data paths, and production behavior. The largest systemic issue was **status inflation**: the feature validator treated every feature as having UI (`hasUi || true`) and many “LIVE” intelligence slugs had **no `executeFeatureService` handler**, returning `"This capability is not implemented yet."` while the registry claimed they worked.

**Fixed in this pass:**

- Honest feature validator (`validate.ts`) — no forced `hasUi: true`; generic `/api/ai/features/[slug]` counts as API when a service exists.
- Wired 11 previously dead taste/franchise/agent slugs to real `taste.ts` / `franchise.ts` / briefing logic.
- Added **AI evidence context layer** (`src/lib/ai/context/`) for TMDB + IMDb + user taste grounding in Copilot.
- Cloud OpenAI path when `OPENAI_API_KEY` is set (`chatOpenAiCloud`).
- Regression tests for validator honesty and wired feature runtime.

**Still partial (honest status):**

- 16 features remain **planned** (no service).
- Chat-heavy features (`spoiler-shield`, `ending-explanation`, etc.) redirect to Copilot — require connected model.
- Semantic search is **metadata/regex catalog search**, not embedding vectors.
- Creative image features produce **SVG concept art**, not generative model output.
- `/videos` is a shell when no video provider is configured.
- Agent watchlist/community tools still return `client_action_required` stubs.

---

## Status counts (post-fix validator)

| Status   | Count |
|----------|------:|
| LIVE     | 45    |
| BETA     | 39    |
| PLANNED  | 16    |
| DEGRADED | 0     |
| ERROR    | 0     |

> **Note:** LIVE count is still high because many features share real recommendation/briefing/taste services. Each LIVE slug should be verified independently — registry count is not marketing proof.

---

## Critical fixes

### 1. Feature validator inflation

| Item | Before | After |
|------|--------|-------|
| `hasUi` | `def.hasUi \|\| true` (always true) | `def.hasUi \|\| Boolean(def.href)` |
| `hasApi` | `def.hasApi \|\| def.hasService` | `def.hasApi \|\| Boolean(def.api) \|\| def.hasService` |

**Files:** `src/lib/ai/features/validate.ts`

### 2. Dead LIVE feature handlers (now wired)

| Feature | Status | Fix |
|---------|--------|-----|
| `movie-dna` | LIVE | `computeTasteDna` |
| `genre-map` | LIVE | DNA genre slice + explanations |
| `decade-map` | LIVE | DNA decade slice |
| `global-cinema-map` | LIVE | DNA country/language slice |
| `favorite-patterns` | LIVE | `buildTasteExplanations` |
| `taste-contradiction` | LIVE | `tasteContradictions` |
| `rewatch-probability` | LIVE | `rewatchCandidates` |
| `taste-evolution` | LIVE | DNA + honest limited-history note |
| `franchise-completion` | LIVE | `analyzeFranchise` + watch history |
| `post-reflection` | LIVE | Briefing-backed reflection prompts |
| `cinema-agent` | LIVE | Redirect payload to `/copilot` |

**Files:** `src/lib/ai/features/services.ts`

### 3. AI grounding

| Component | Purpose |
|-----------|---------|
| `src/lib/ai/context/movie.ts` | TMDB + IMDb evidence from catalog |
| `src/lib/ai/context/user.ts` | User taste signals (favorites/history/watchlist) |
| `src/lib/ai/context/index.ts` | `buildEvidencePacket()` for Copilot |
| `src/lib/ai/copilot-context.ts` | System prompt uses evidence; fact vs inference rules |
| `src/lib/ai/chat.ts` | Passes user library into context; OpenAI cloud path |

**Source hierarchy (factual claims):** Flutter Films DB → TMDB → IMDb → authorized providers → AI inference (labeled).

---

## Feature matrix (selected)

| Feature | Route | UI | API | Service | Data | Persistence | Tests | Status | Issue / fix |
|---------|-------|----|-----|---------|------|-------------|-------|--------|-------------|
| Tonight | `/tonight` | ✓ | ✓ | ✓ | TMDB discover + eligibility | — | ✓ | LIVE | Future releases excluded (prior fix) |
| Onboarding | `/onboarding` | ✓ | ✓ | ✓ | TMDB search | DB + localStorage | ✓ | LIVE | Prior overhaul |
| Taste DNA 2.0 | `/my-cinema` | ✓ | ✓ | ✓ | TMDB + user signals | taste_signals | ✓ | LIVE | — |
| Movie DNA | `/my-cinema` | ✓ | ✓ | ✓ | taste.ts | user library | ✓ | LIVE | **Was DEAD — wired** |
| Franchise completion | `/my-cinema` | ✓ | ✓ | ✓ | TMDB collections | history | — | BETA | **Was DEAD — wired** |
| Cinema Agent | `/copilot` | ✓ | ✓ | ✓ | agent tools + context | sessions | ✓ | LIVE | **Was redirect stub — fixed** |
| Semantic search | `/intelligence` | ✓ | ✓ | ✓ | Catalog regex | — | ✓ | LIVE | Not true embeddings — label honestly |
| Poster generator | `/images` | ✓ | ✓ | ✓ | SVG templates | — | ✓ | BETA | Not generative AI — concept SVG |
| Videos | `/videos` | ✓ | — | — | — | — | — | PARTIAL | Empty without video provider |
| Director intent | — | — | — | — | — | — | — | PLANNED | No service |
| Friend recs | — | — | — | — | — | — | — | PLANNED | No service |
| Agent watchlist tools | Copilot | ✓ | ✓ | stub | — | — | — | PARTIAL | `client_action_required` |

---

## Planned features (no service — 16)

`director-intent`, `production-challenges`, `version-comparison`, `collaboration-graph`, `underseen-actor`, `crew-discovery`, `crew-influence`, `creative-team-dna`, `universe-map`, `adaptation-tracker`, `remake-evolution`, `friend-recs`, `spoiler-rooms`, `sentiment-map`, `rewatch-reflection`, `quote-search`

---

## Data layer

| Source | Status | Notes |
|--------|--------|-------|
| TMDB | LIVE | `src/lib/tmdb/*`, sync via `tmdb-sync.ts` |
| IMDb ratings | PARTIAL | `imdb-sync.ts` — requires `imdb_id` from TMDB sync first |
| Identity | LIVE | TMDB `imdb_id` primary; title/year fallback in catalog |
| Ratings | LIVE | **Kept separate** — never merged in UI or AI prompts |

---

## API surface

- **51** page routes under `src/app/`
- **68** API route handlers
- Generic feature runner: `POST /api/ai/features/[slug]`
- Copilot: `POST /api/ai/chat` (tools + grounded context)

---

## Tests (this pass)

```text
npm run typecheck — PASS
npm test — 70 passed
npm run build — PASS
```

New tests:

- `src/lib/ai/context/context.test.ts` — TMDB/IMDb rating separation
- `src/lib/ai/features/feature-runtime.test.ts` — validator honesty + wired slugs

---

## Production verification

**PRODUCTION VERIFIED** (HTTP 200 smoke, 2026-09-26):

`/`, `/movies`, `/discover`, `/tonight`, `/onboarding`, `/my-cinema`, `/watchlist`, `/rooms`, `/copilot`, `/people`, `/franchises`, `/intelligence`, `/community`

Full interactive crawl and authenticated flows not automated in CI from this environment.

---

## Remaining blockers (P1/P2)

1. **Catalog depth** — run TMDB sync cron with valid `CRON_SECRET` / `TMDB_API_KEY` so search and AI evidence have movies.
2. **Cloud models in registry** — OpenAI adapter exists; add enabled cloud models to DB when `OPENAI_API_KEY` present.
3. **Agent tool stubs** — watchlist mutations, community room, video generation need server-side completion.
4. **Semantic search** — implement embeddings or relabel UI as “catalog smart search”.
5. **Creative features** — label SVG output; wire real image provider when configured.
6. **Google OAuth** — rotate exposed secret; publish app or add test users.

---

## Files changed (this audit pass)

**Modified**

- `src/lib/ai/features/validate.ts`
- `src/lib/ai/features/services.ts`
- `src/lib/ai/copilot-context.ts`
- `src/lib/ai/chat.ts`
- `src/lib/ai/adapters/openai-compatible.ts`
- `src/app/api/ai/chat/route.ts`
- `src/lib/ai/features/feature-runtime.test.ts`

**Created**

- `src/lib/ai/context/types.ts`
- `src/lib/ai/context/movie.ts`
- `src/lib/ai/context/user.ts`
- `src/lib/ai/context/index.ts`
- `src/lib/ai/context/context.test.ts`
- `docs/DEAD_FEATURE_AUDIT.md`
