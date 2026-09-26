import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildCreativeAsset } from "@/lib/ai/intelligence/creative";
import { createGenerationJob, updateGenerationJob, listGenerationJobs } from "@/lib/ai/generation-jobs";
import { getSessionUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  return handleApi(async () => {
    const user = await getSessionUser();
    const jobs = await listGenerationJobs(user?.id, 30);
    return { jobs };
  });
}

export async function POST(request: Request) {
  rateLimit(`gen-image:${clientKey(request)}`, 15);
  return handleApi(async () => {
    const user = await getSessionUser();
    const body = (await request.json()) as {
      prompt?: string;
      title?: string;
      kind?: "poster" | "watchlist_poster" | "movie_night_card";
      aspectRatio?: string;
    };

    const title = body.title ?? body.prompt?.slice(0, 80) ?? "Untitled";
    const kind = body.kind ?? "poster";
    const jobId = await createGenerationJob({
      userId: user?.id,
      kind: "image",
      prompt: body.prompt ?? title,
      local: true,
      input: { kind, aspectRatio: body.aspectRatio },
    });

    try {
      await updateGenerationJob(jobId, { status: "running", progress: 30 });
      const asset = buildCreativeAsset(kind, { title, subtitle: body.prompt });
      await updateGenerationJob(jobId, {
        status: "completed",
        progress: 100,
        output: { svg: asset.svg, disclaimer: asset.disclaimer },
      });
      return {
        jobId,
        status: "completed",
        asset,
        disclaimer: "AI-generated — not official studio artwork.",
      };
    } catch (error) {
      await updateGenerationJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Generation failed",
      });
      return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
    }
  });
}
