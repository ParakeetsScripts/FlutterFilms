import "server-only";

import type { ChatMessage } from "../types";
import { validateSelfHostedUrl } from "../security";

export function getLocalOpenAiConfig() {
  const endpoint = process.env.AI_LOCAL_ENDPOINT?.trim();
  if (!endpoint) return null;
  const base = validateSelfHostedUrl(endpoint, { allowLocalhost: true });
  const apiKey = process.env.AI_LOCAL_API_KEY?.trim() || undefined;
  return { base, apiKey };
}

export async function probeOpenAiCompatibleLatency(): Promise<number> {
  const config = getLocalOpenAiConfig();
  if (!config) throw new Error("AI_LOCAL_ENDPOINT not configured");
  const started = Date.now();
  const response = await fetch(`${config.base}/models`, {
    headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Local endpoint probe failed (${response.status})`);
  return Date.now() - started;
}

export async function chatOpenAiCompatible(
  model: string,
  messages: ChatMessage[],
  options: { stream?: boolean } = {},
): Promise<Response> {
  const config = getLocalOpenAiConfig();
  if (!config) throw new Error("AI_LOCAL_ENDPOINT not configured");
  const response = await fetch(`${config.base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream ?? true,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Local chat failed (${response.status})`);
  }
  return response;
}

export function getOpenAiCloudConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const base = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  return { base, apiKey };
}

export async function chatOpenAiCloud(
  model: string,
  messages: ChatMessage[],
  options: { stream?: boolean } = {},
): Promise<Response> {
  const config = getOpenAiCloudConfig();
  if (!config) throw new Error("OPENAI_API_KEY not configured");
  const response = await fetch(`${config.base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: options.stream ?? true,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `OpenAI chat failed (${response.status})`);
  }
  return response;
}

export async function testOpenAiCompatibleModel(model: string): Promise<{ latencyMs: number; snippet: string }> {
  const started = Date.now();
  const response = await chatOpenAiCompatible(model, [{ role: "user", content: "Reply with exactly: OK" }], { stream: false });
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return {
    latencyMs: Date.now() - started,
    snippet: (data.choices?.[0]?.message?.content ?? "").slice(0, 120),
  };
}
