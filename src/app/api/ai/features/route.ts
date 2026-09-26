import { handleApi } from "@/lib/api";
import { getIntelligenceFeatures } from "@/lib/ai/features/registry";
import { countByStatus } from "@/lib/ai/features/validate";
import type { FeatureCategory } from "@/lib/ai/features/registry";

export async function GET() {
  return handleApi(async () => {
    const features = getIntelligenceFeatures();
    const counts = countByStatus();
    const byCategory = (category: FeatureCategory) =>
      features.filter((f) => f.category === category);

    return {
      features,
      byCategory: {
        discovery: byCategory("discovery"),
        movie: byCategory("movie"),
        people: byCategory("people"),
        franchise: byCategory("franchise"),
        personal: byCategory("personal"),
        social: byCategory("social"),
        watching: byCategory("watching"),
        search: byCategory("search"),
        creative: byCategory("creative"),
        agent: byCategory("agent"),
      },
      live: counts.live,
      degraded: counts.degraded,
      beta: counts.beta,
      planned: counts.planned,
      error: counts.error,
    };
  });
}
