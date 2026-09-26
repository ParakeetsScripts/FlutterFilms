# Feature Runtime

## Status semantics

| Status | Meaning |
|--------|---------|
| **LIVE** | Service executes, API + UI exist, tests exist, real data path, no stub responses |
| **BETA** | Works with documented limitation (SVG concepts, smart catalog search, partial auth UX) |
| **PLANNED** | No service implementation |
| **DEGRADED** | Executes but dependency unavailable (e.g. TMDB down) |
| **ERROR** | Unexpected runtime failure |

Honest caps in `capability-audit.ts` prevent marketing labels (e.g. semantic search, poster builder) from counting as LIVE.

## Validator

`src/lib/ai/features/validate.ts` evaluates:

- `hasDefinition`, `hasService`, `hasApi`, `hasUi`, `hasTests`
- `hasRealDataPath`, `hasExecutionPath`

API path: dedicated route **or** `/api/ai/features/[slug]`

UI path: `href` **or** `/intelligence/[slug]`

## Execution

```
POST /api/ai/features/[slug]
  → runFeature()
  → executeFeatureService()
  → telemetry in feature_runs
```

## Regression tests

- `feature-runtime.test.ts` — validator honesty
- `feature-live-regression.test.ts` — every LIVE slug must not return stub/unimplemented

Stub detection: `isStubFeatureResult()` in `capability-audit.ts`

## Cinema Agent

`cinema-agent` slug and `POST /api/ai/chat` both call **`runCinemaAgent()`** (`src/lib/ai/agent/orchestrator.ts`):

- Entity resolution + session context (`resolveEntities`, `AgentSessionContext`)
- Deterministic tool planning (`planAgentTools`) with LLM optional in Copilot only
- Real mutations when authenticated (`createWatchlistEntry`, `removeWatchlistEntry`, `createRecommendationFeedback`)
- Account memory via `agent_memories` (non-UUID fixture IDs skip DB gracefully in tests)
- Copilot UI at `/copilot` for generative natural-language replies when a model is connected

## Taste features

Shared domain logic in `src/lib/ai/intelligence/taste.ts`:

- `computeTasteDna` — TMDB genre list for unexplored genres
- `buildRewatchSignals` — ordinal signals, not fake probabilities
- `buildTasteEvolutionTimeline` — from `taste_snapshots` when available
- `savePostReflection` — persists to `taste_signals`
