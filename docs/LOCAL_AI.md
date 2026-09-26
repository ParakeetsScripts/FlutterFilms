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

## Security

Never expose local endpoints to the public internet without authentication. Production Vercel deployments should use cloud providers or a secured tunnel — not `localhost`.
