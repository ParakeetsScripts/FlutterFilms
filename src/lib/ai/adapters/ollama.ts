import "server-only";

import type { ChatMessage } from "../types";
import { validateSelfHostedUrl } from "../security";

export type OllamaModel = {
  name: string;
  model: string;
  size: number;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
  };
};

export type OllamaTagsResponse = {
  models: OllamaModel[];
};

export function getOllamaBaseUrl(): string | null {
  const raw = process.env.OLLAMA_BASE_URL?.trim();
  if (!raw) return null;
  return validateSelfHostedUrl(raw, { allowLocalhost: true });
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  const base = getOllamaBaseUrl();
  if (!base) return [];
  const started = Date.now();
  const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Ollama unreachable (${response.status})`);
  const data = (await response.json()) as OllamaTagsResponse;
  return data.models ?? [];
}

export async function probeOllamaLatency(): Promise<number> {
  const base = getOllamaBaseUrl();
  if (!base) throw new Error("OLLAMA_BASE_URL not configured");
  const started = Date.now();
  const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Ollama probe failed (${response.status})`);
  return Date.now() - started;
}

export async function chatOllama(
  model: string,
  messages: ChatMessage[],
  options: { stream?: boolean } = {},
): Promise<Response> {
  const base = getOllamaBaseUrl();
  if (!base) throw new Error("OLLAMA_BASE_URL not configured");
  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream ?? true,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Ollama chat failed (${response.status})`);
  }
  return response;
}

export async function testOllamaModel(model: string): Promise<{ latencyMs: number; snippet: string }> {
  const started = Date.now();
  const response = await chatOllama(model, [{ role: "user", content: "Reply with exactly: OK" }], { stream: false });
  const data = (await response.json()) as { message?: { content?: string } };
  return {
    latencyMs: Date.now() - started,
    snippet: (data.message?.content ?? "").slice(0, 120),
  };
}
