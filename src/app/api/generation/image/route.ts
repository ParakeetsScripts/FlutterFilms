import { handleApi, rateLimit, clientKey } from "@/lib/api";
import type { CreativeKind } from "@/lib/ai/intelligence/creative";
import { runCreativeGeneration } from "@/lib/ai/intelligence/creative-service";
import { createGenerationJob, updateGenerationJob, listGenerationJobs } from "@/lib/ai/generation-jobs";
import { getSessionUser } from "@/lib/auth/session";
import { getUserLibrary } from "@/lib/user/library-repository";
import { NextResponse } from "next/server";

const KINDS = new Set<CreativeKind>([
  "poster",
  "watchlist_poster",
  "movie_night_card",
  "franchise_timeline",
  "comparison",
  "trailer_concept",
  "review_outline",
]);

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
      kind?: string;
      aspectRatio?: string;
      watchlistIds?: number[];
      movieId?: number;
    };

    const title = body.title?.trim() || body.prompt?.slice(0, 80) || "Untitled";
    const kind = KINDS.has(body.kind as CreativeKind) ? (body.kind as CreativeKind) : "poster";

    let watchlistIds = body.watchlistIds ?? [];
    if (!watchlistIds.length && user && (kind === "watchlist_poster" || kind === "movie_night_card")) {
      const library = await getUserLibrary(user.id);
      watchlistIds = library.watchlist;
    }

    const jobId = await createGenerationJob({
      userId: user?.id,
      kind: "image",
      prompt: body.prompt ?? title,
      local: true,
      input: { kind, aspectRatio: body.aspectRatio, watchlistIds },
    });

    try {
      await updateGenerationJob(jobId, { status: "running", progress: 30 });
      const asset = await runCreativeGeneration({
        kind,
        title,
        subtitle: body.prompt,
        watchlistIds,
        movieId: body.movieId,
      });
      await updateGenerationJob(jobId, {
        status: "completed",
        progress: 100,
        output: { svg: asset.svg, textContent: asset.textContent, disclaimer: asset.disclaimer },
      });
      return {
        jobId,
        status: "completed",
        asset,
        disclaimer: asset.disclaimer,
      };
    } catch (error) {
      await updateGenerationJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Generation failed",
      });
      return NextResponse.json({ error: "Creative generation failed." }, { status: 500 });
    }
  });
}
