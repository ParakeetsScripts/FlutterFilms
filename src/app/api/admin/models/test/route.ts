import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { probeOllamaLatency, getOllamaBaseUrl } from "@/lib/ai/adapters/ollama";
import { getLocalOpenAiConfig, probeOpenAiCompatibleLatency } from "@/lib/ai/adapters/openai-compatible";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as { provider?: string };
  try {
    if (body.provider === "ollama" || !body.provider) {
      if (!getOllamaBaseUrl()) {
        return NextResponse.json({ ok: false, error: "OLLAMA_BASE_URL not configured" }, { status: 400 });
      }
      const latencyMs = await probeOllamaLatency();
      return NextResponse.json({ ok: true, provider: "ollama", latencyMs });
    }
    if (body.provider === "local_openai") {
      if (!getLocalOpenAiConfig()) {
        return NextResponse.json({ ok: false, error: "AI_LOCAL_ENDPOINT not configured" }, { status: 400 });
      }
      const latencyMs = await probeOpenAiCompatibleLatency();
      return NextResponse.json({ ok: true, provider: "local_openai", latencyMs });
    }
    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Connection failed" },
      { status: 503 },
    );
  }
}
