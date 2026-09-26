import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { createGenerationJob, listGenerationJobs } from "@/lib/ai/generation-jobs";
import { getSessionUser } from "@/lib/auth/session";
import { getModelsWithHealth } from "@/lib/ai/repository";

export async function GET() {
  return handleApi(async () => {
    const user = await getSessionUser();
    const [jobs, models] = await Promise.all([
      listGenerationJobs(user?.id, 20),
      getModelsWithHealth(),
    ]);
    const videoCapable = models.filter((m) => m.capabilities?.videoGen && m.healthStatus === "connected");
    return {
      jobs: jobs.filter((j) => (j as { kind: string }).kind === "video"),
      providerConfigured: videoCapable.length > 0,
      models: videoCapable,
    };
  });
}

export async function POST(request: Request) {
  rateLimit(`gen-video:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const user = await getSessionUser();
    const body = (await request.json()) as { prompt?: string; duration?: number; modelId?: string };
    const models = await getModelsWithHealth();
    const videoModel = models.find((m) => m.capabilities?.videoGen && m.healthStatus === "connected");

    if (!videoModel) {
      const jobId = await createGenerationJob({
        userId: user?.id,
        kind: "video",
        prompt: body.prompt,
      });
      return {
        jobId,
        status: "unavailable",
        error: "No video provider configured.",
        setup:
          "Configure a video-capable provider in Open Models and ensure the endpoint is reachable.",
      };
    }

    const jobId = await createGenerationJob({
      userId: user?.id,
      kind: "video",
      modelId: videoModel.id,
      providerId: videoModel.providerId,
      prompt: body.prompt,
      input: { duration: body.duration },
    });

    return {
      jobId,
      status: "queued",
      message: "Video job queued. Poll GET /api/generation/video for status.",
      disclaimer: "No fake completed video is returned until a provider finishes the job.",
    };
  });
}
