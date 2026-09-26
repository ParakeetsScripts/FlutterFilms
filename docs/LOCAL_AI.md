# Local AI (Ollama)

## Quick start

```bash
ollama serve
ollama pull llama3.2
```

In `.env.local`:

```
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

## OpenAI-compatible local servers

```
AI_LOCAL_ENDPOINT=http://127.0.0.1:8080/v1
AI_LOCAL_API_KEY=optional
```

## Testing

`/admin/models` — run connectivity tests with admin secret.

`/open-models` — user-facing model selection when configured.

## Remote Ollama (e.g. DataGurus server)

Native API:

```
OLLAMA_BASE_URL=http://100.98.79.102:11434
```

OpenAI-compatible (`/v1`):

```
AI_LOCAL_ENDPOINT=http://100.98.79.102:11434/v1
AI_LOCAL_API_KEY=ollama
```

Flutter Films **auto-discovers** installed models from `/api/tags` or `/v1/models`. You do not need to register `qwen3-coder:30b` manually — it appears when pulled on the server.

**Vercel note:** serverless functions must be able to reach the Ollama host. Tailscale-only IPs (`100.x`) are not reachable from Vercel unless you expose the host publicly (Funnel, reverse proxy, etc.). Use `OPENAI_API_KEY` on Vercel as a cloud fallback when local AI is unreachable.

## Security

Never expose local endpoints to the public internet without authentication. Production Vercel deployments should use cloud providers or a secured tunnel — not `localhost`.
