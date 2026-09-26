import "server-only";

import { discoverMovies } from "@/lib/tmdb/discover";
import { searchCatalog } from "@/lib/sync/catalog";
import { trustBadge } from "../trust";

const VIBE_MAP: Array<{ pattern: RegExp; genre?: number; ratingGte?: number; note: string }> = [
  { pattern: /rain|lonely|melanchol|sad|quiet/i, genre: 18, note: "Drama-forward atmospheric match" },
  { pattern: /funny|laugh|comedy|light/i, genre: 35, note: "Comedy vibe" },
  { pattern: /scary|horror|fear/i, genre: 27, note: "Horror vibe" },
  { pattern: /space|sci-?fi|future|interstellar/i, genre: 878, note: "Sci-fi vibe" },
  { pattern: /beautiful|cinematograph|visual|atmospher/i, ratingGte: 7, note: "Higher-rated visual candidates" },
  { pattern: /action|intense|explos/i, genre: 28, note: "Action energy" },
  { pattern: /romance|love/i, genre: 10749, note: "Romance vibe" },
  { pattern: /thriller|suspense|twist/i, genre: 53, note: "Thriller vibe" },
];

export async function vibeSearch(query: string) {
  const q = query.trim();
  const rules = VIBE_MAP.filter((r) => r.pattern.test(q));
  const primary = rules[0];

  const [textResults, discovered] = await Promise.all([
    searchCatalog(q, 1),
    discoverMovies({
      genre: primary?.genre,
      ratingGte: primary?.ratingGte,
      sort: primary?.ratingGte ? "rating" : "popularity",
    }),
  ]);

  const merged = [...textResults.results];
  for (const m of discovered.results) {
    if (!merged.find((x) => x.id === m.id)) merged.push(m);
  }

  return {
    query: q,
    interpretation: primary?.note ?? "Semantic catalog search",
    results: merged.slice(0, 24),
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
  };
}
