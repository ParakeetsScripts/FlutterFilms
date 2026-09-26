import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { INTERVIEW_QUESTIONS, buildInterviewProfile } from "@/lib/ai/intelligence/interview";

export async function GET() {
  return handleApi(async () => ({ questions: INTERVIEW_QUESTIONS }));
}

export async function POST(request: Request) {
  rateLimit(`ai-interview:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const body = (await request.json()) as { answers?: Record<string, string> };
    return buildInterviewProfile(body.answers ?? {});
  });
}
