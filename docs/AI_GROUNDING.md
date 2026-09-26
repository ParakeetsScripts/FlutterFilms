# AI Grounding Architecture

Flutter Films grounds Cinema Agent and intelligence features in **source-backed evidence**, not model memory alone.

## Source hierarchy (factual claims)

1. Flutter Films normalized catalog / user records
2. TMDB metadata
3. IMDb structured ratings (official dataset import)
4. Authorized provider data (watch providers, etc.)
5. AI inference (explicitly labeled)

## Evidence layer

Location: `src/lib/ai/evidence/`

| Helper | Purpose |
|--------|---------|
| `getMovieEvidence(movieId)` | TMDB + IMDb fields with provenance |
| `getUserTasteEvidence(...)` | Favorites, history, watchlist, taste signals |
| `buildEvidencePacket(...)` | Copilot + agent context block |

Each `MovieEvidence` includes:

- Separate TMDB and IMDb ratings (never merged)
- `provenance[]` per field (`field`, `value`, `source`, `retrievedAt`)
- `conflicts[]` when TMDB/IMDb disagree

## Identity matching

`src/lib/sync/identity.ts`

- Primary: TMDB `imdb_id` → IMDb title record
- Fallback: catalog row without IMDb link (medium confidence)
- Conflicts surfaced, never silently overwritten

## Copilot pipeline

```
user message
  → buildEvidencePacket() [catalog + taste]
  → runAgentTools() [deterministic tool router]
  → buildCopilotSystemPrompt() [verified data authoritative]
  → model (Ollama / local OpenAI-compatible / OpenAI cloud when configured)
```

## Fact vs inference

| Type | Examples | UI label |
|------|----------|----------|
| Verified | runtime, release date, ratings, cast | TMDB / IMDb |
| Derived | genre overlap, runtime fit | Flutter Films |
| AI inference | mood, pacing read, “why you may like” | AI analysis |

## Missing data policy

When evidence is unavailable, features return `insufficient_data` — never fabricated metadata.

## IMDb sync observability

`runImdbSync()` reports when catalog has zero `imdb_id` matches so admin/ops can distinguish “healthy job, nothing to update” from meaningful imports.
