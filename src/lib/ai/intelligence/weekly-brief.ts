import "server-only";

import { getLatestSections } from "@/lib/sync/catalog";
import { getTrendingMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import { trustBadge } from "../trust";

export async function buildWeeklyBrief() {
  const [{ updated }, trending, upcoming] = await Promise.all([
    getLatestSections(),
    getTrendingMovies("week"),
    getUpcomingMovies(1),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    sections: [
      { title: "Trending this week", movies: trending.results.slice(0, 6), label: trustBadge("metadata") },
      { title: "Recently updated in catalog", movies: updated.slice(0, 6), label: trustBadge("metadata") },
      { title: "Coming soon", movies: upcoming.results.slice(0, 6), label: trustBadge("metadata") },
    ],
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
    disclaimer: "Summaries use verified catalog metadata — not live box office or review fabrication.",
  };
}
