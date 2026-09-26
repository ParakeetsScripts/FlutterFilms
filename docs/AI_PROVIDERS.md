# AI Providers

## Configuration

| Variable | Provider |
|----------|----------|
| `OLLAMA_BASE_URL` | Local Ollama |
| `AI_LOCAL_ENDPOINT` | OpenAI-compatible local server |
| `AI_LOCAL_API_KEY` | Optional key for local endpoint |
| `OPENAI_API_KEY` | OpenAI / compatible cloud |

Admin model testing: `/admin/models` with `AI_ADMIN_SECRET`.

## Cinema Agent

Central AI system at `/copilot`. Uses tool calling against the real catalog:

- `searchMovies`, `getMovie`, `recommendMovies`, `searchByVibe`
- `getTasteDNA`, `getWatchlist`, `getWatchHistory`
- `buildMarathon`, `findWhereToWatch`, `searchSemanticCatalog`

Responses must cite tool results — no invented movie IDs.

## Degraded mode

When no provider is configured, AI surfaces show honest unavailable states. Catalog search and Tonight picker still work from database/TMDB.

## Image / video

Image studio (`/images`) and video studio (`/videos`) require configured generation providers. Jobs persist in `generation_jobs` with queued/processing/completed/failed states.
