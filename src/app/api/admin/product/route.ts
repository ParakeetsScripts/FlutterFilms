import { handleApi } from "@/lib/api";
import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { getFullProductDashboard } from "@/lib/analytics/product-metrics";
import type { AnalyticsRange } from "@/lib/analytics/repository";

const RANGES = new Set<AnalyticsRange>(["today", "7d", "30d", "90d", "all"]);

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  return handleApi(async () => {
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get("range") ?? "7d";
    const range = RANGES.has(rangeParam as AnalyticsRange) ? (rangeParam as AnalyticsRange) : "7d";
    const dashboard = await getFullProductDashboard(range);
    return {
      ...dashboard,
      disclaimer: dashboard.insufficientData
        ? "INSUFFICIENT DATA — metrics reflect only verified database records."
        : "All metrics from database records — not fabricated.",
    };
  });
}
