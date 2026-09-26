import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { getModelsWithHealth, getProviders } from "@/lib/ai/repository";
import { getOllamaBaseUrl } from "@/lib/ai/adapters/ollama";
import { getLocalOpenAiConfig } from "@/lib/ai/adapters/openai-compatible";

export async function GET(request: Request) {
  rateLimit(`ai-models:${clientKey(request)}`, 60);
  return handleApi(async () => {
    const [models, providers] = await Promise.all([getModelsWithHealth(), getProviders()]);
    return {
      models,
      providers,
      ollamaConfigured: Boolean(getOllamaBaseUrl()),
      localOpenAiConfigured: Boolean(getLocalOpenAiConfig()),
    };
  });
}
