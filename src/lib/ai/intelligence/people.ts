import "server-only";

import { tmdbFetch } from "@/lib/tmdb/client";
import { normalizeMovieSummary, type TmdbMovieRaw } from "@/lib/tmdb/normalize";
import { trustBadge } from "../trust";

type PersonCredits = {
  id: number;
  name: string;
  biography: string;
  known_for_department?: string;
  movie_credits?: {
    cast?: TmdbMovieRaw[];
    crew?: Array<TmdbMovieRaw & { job?: string; department?: string }>;
  };
};

export async function analyzePerson(personId: number) {
  const person = await tmdbFetch<PersonCredits>(`/person/${personId}`, {
    append_to_response: "movie_credits",
  });

  const cast = (person.movie_credits?.cast ?? [])
    .map((item) => normalizeMovieSummary(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));

  const crew = (person.movie_credits?.crew ?? [])
    .map((item) => normalizeMovieSummary(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const genreCounts = new Map<string, number>();
  const coStars = new Map<string, number>();
  const decades = new Map<number, number>();

  const topForCoStars = cast.slice(0, 3);
  for (const movie of cast.slice(0, 40)) {
    if (movie.year) decades.set(Math.floor(movie.year / 10) * 10, (decades.get(Math.floor(movie.year / 10) * 10) ?? 0) + 1);
    for (const genre of movie.genres ?? []) {
      genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
    }
  }

  for (const movie of topForCoStars) {
    try {
      const credits = await tmdbFetch<{ cast?: Array<{ name: string; id: number }> }>(`/movie/${movie.id}/credits`);
      for (const member of credits.cast ?? []) {
        if (member.name === person.name) continue;
        coStars.set(member.name, (coStars.get(member.name) ?? 0) + 1);
      }
    } catch {
      /* optional */
    }
  }

  const filmographyJourney = cast
    .slice(0, 8)
    .map((m) => ({ id: m.id, title: m.title, year: m.year, rating: m.voteAverage }));

  const careerTurningPoints: string[] = [];
  const sortedByYear = [...cast].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const firstHit = sortedByYear.find((m) => (m.voteAverage ?? 0) >= 7);
  const recentPeak = cast.find((m) => m.year && m.year >= 2015 && (m.voteAverage ?? 0) >= 7.5);
  if (firstHit) careerTurningPoints.push(`Early breakout signal: ${firstHit.title} (${firstHit.year ?? "?"}) — TMDB rating metadata.`);
  if (recentPeak) careerTurningPoints.push(`Recent high-rated entry: ${recentPeak.title} (${recentPeak.year}) — catalog metadata.`);

  const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

  return {
    id: person.id,
    name: person.name,
    department: person.known_for_department ?? "Acting",
    filmographyJourney,
    careerTurningPoints,
    topGenres: topGenres.length ? topGenres : ["Derived from cast credits — limited genre metadata per title."],
    frequentCoStars: [...coStars.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count })),
    crewHighlights: crew
      .filter((m) => (m.voteAverage ?? 0) >= 7)
      .slice(0, 6)
      .map((m) => ({ id: m.id, title: m.title, year: m.year })),
    decades: [...decades.entries()].sort((a, b) => b[1] - a[1]).map(([decade, count]) => ({ decade, count })),
    labels: [trustBadge("metadata"), trustBadge("verified")],
  };
}

export async function findSimilarPeople(personId: number, kind: "actor" | "director" = "actor") {
  const analysis = await analyzePerson(personId);
  const search = await tmdbFetch<{ results: Array<{ id: number; name: string; known_for_department?: string }> }>(
    "/search/person",
    { query: analysis.topGenres[0] ?? analysis.name.split(" ")[0], page: 1 },
  );

  const similar = search.results
    .filter((p) => p.id !== personId && p.known_for_department?.toLowerCase().includes(kind === "director" ? "direct" : "act"))
    .slice(0, 8)
    .map((p) => ({ id: p.id, name: p.name, department: p.known_for_department }));

  return {
    personId,
    kind,
    similar,
    reason: `Surface matches from catalog search — not a definitive style analysis.`,
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
  };
}
