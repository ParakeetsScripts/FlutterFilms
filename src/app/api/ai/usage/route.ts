import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { getUsageSummary } from "@/lib/ai/repository";

export async function GET(request: Request) {
  rateLimit(`ai-usage:${clientKey(request)}`, 30);
  return handleApi(async () => getUsageSummary());
}
