import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { testOllamaModel } from "@/lib/ai/adapters/ollama";
import { testOpenAiCompatibleModel } from "@/lib/ai/adapters/openai-compatible";
import { getModelsWithHealth } from "@/lib/ai/repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as { modelId?: string };
  if (!body.modelId) {
    return NextResponse.json({ error: "modelId required" }, { status: 400 });
  }
  const models = await getModelsWithHealth();
  const model = models.find((m) => m.id === body.modelId);
  if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 });
  if (model.healthStatus !== "connected") {
    return NextResponse.json({ error: "Model is not connected on the configured backend." }, { status: 503 });
  }
  try {
    const result =
      model.providerId === "ollama"
        ? await testOllamaModel(model.apiModelId)
        : await testOpenAiCompatibleModel(model.apiModelId);
    return NextResponse.json({ ok: true, modelId: model.id, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Model test failed" },
      { status: 503 },
    );
  }
}
