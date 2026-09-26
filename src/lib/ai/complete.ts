import "server-only";

import { chatOllama } from "./adapters/ollama";
import { chatOpenAiCloud, chatOpenAiCompatible } from "./adapters/openai-compatible";
import { getModelsWithHealth } from "./repository";
import type { ChatMessage } from "./types";

export async function pickConnectedChatModel(preferCoding = false) {
  const models = await getModelsWithHealth();
  const connected = models.filter((m) => m.enabled && m.healthStatus === "connected");
  if (!connected.length) return null;

  if (preferCoding) {
    const coding = connected.find((m) => m.category === "coding" || m.capabilities.coding);
    if (coding) return coding;
  }
  return (
    connected.find((m) => m.category === "chat") ??
    connected.find((m) => m.category === "coding") ??
    connected[0]
  );
}

export async function completeWithConnectedModel(
  messages: ChatMessage[],
  options: { preferCoding?: boolean } = {},
): Promise<string | null> {
  const model = await pickConnectedChatModel(options.preferCoding);
  if (!model) return null;

  try {
    if (model.providerId === "ollama") {
      const response = await chatOllama(model.apiModelId, messages, { stream: false });
      const data = (await response.json()) as { message?: { content?: string } };
      return data.message?.content?.trim() ?? null;
    }
    if (model.providerId === "local_openai") {
      const response = await chatOpenAiCompatible(model.apiModelId, messages, { stream: false });
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content?.trim() ?? null;
    }
    if (model.providerId === "openai") {
      const response = await chatOpenAiCloud(model.apiModelId, messages, { stream: false });
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content?.trim() ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
