# Cinema Agent Architecture

## Canonical orchestrator

`src/lib/ai/agent/orchestrator.ts` — `runCinemaAgent()`

Used by:

- `POST /api/ai/chat` (Copilot)
- `cinema-agent` intelligence feature runtime
- Future mobile/API consumers

## Pipeline

```
user message
  → resolveEntities()        [person/movie/franchise + session refs]
  → planAgentTools()         [deterministic intent router + entity hints]
  → invokeAgentTool()        [TMDB, catalog, watchlist mutations, memory, rooms]
  → buildEvidencePacket()    [TMDB + IMDb + taste]
  → listAgentMemories()      [account-persistent DB memory]
  → structured actions       [watchlist/feedback/sign-in required]
  → LLM (Copilot only)       [when model connected]
```

## Tools

Mutation tools require authenticated `userId` and verify DB state:

- `createWatchlistEntry` / `removeWatchlistEntry`
- `createRecommendationFeedback` (feeds recommendation exclusions)
- `getMemories` / `storeMemory`
- `getCommunityRoom` (real room state)

## Session context

`AgentSessionContext` tracks `lastMovieId`, `lastPersonId`, `lastCollectionId`, `lastRecommendationIds` for pronoun resolution ("that movie", "add it to my watchlist").

## Memory

Authoritative store: `agent_memories` table via `/api/user/memory`.

Device `localStorage` in `user/store.ts` is a cache/draft only — Copilot prefers DB memory when signed in.

## Structured actions

`AgentAction` types returned from orchestrator for UI confirmation when needed (`SIGN_IN_REQUIRED`, `ADD_TO_WATCHLIST`, etc.).
