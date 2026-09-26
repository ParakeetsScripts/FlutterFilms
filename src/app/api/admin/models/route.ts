import { handleApi } from "@/lib/api";
import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { getModelsWithHealth, getProviders, getUsageSummary } from "@/lib/ai/repository";
import { getOllamaBaseUrl, listOllamaModels } from "@/lib/ai/adapters/ollama";

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;
  return handleApi(async () => {
    const [models, providers, usage] = await Promise.all([
      getModelsWithHealth(),
      getProviders(),
      getUsageSummary(),
    ]);
    let ollamaModels: Awaited<ReturnType<typeof listOllamaModels>> = [];
    if (getOllamaBaseUrl()) {
      try {
        ollamaModels = await listOllamaModels();
      } catch {
        ollamaModels = [];
      }
    }
    return { models, providers, usage, ollamaModels, ollamaBaseUrl: getOllamaBaseUrl() };
  });
}
