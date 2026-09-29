import "server-only";

import { filterWatchableTonight } from "@/lib/movies/eligibility";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getMovie } from "@/lib/tmdb/movies";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import type { Genre, Movie, MovieSummary } from "@/lib/tmdb/types";
import { trustBadge } from "../trust";

export type AttentionLevel = "background" | "full";

const BACKGROUND_GENRE_IDS = new Set([35, 16, 28, 12, 10751, 10749, 14]);
const FULL_ATTENTION_GENRE_IDS = new Set([18, 9648, 878, 80, 36, 99, 53]);

function dedupe(movies: MovieSummary[], exclude: Set<number>) {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    if (exclude.has(movie.id) || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

export function classifyMovieAttention(movie: Pick<Movie, "runtime" | "genres">): AttentionLevel {
  const runtime = movie.runtime ?? 0;
  const genreIds = movie.genres.map((genre) => genre.id);
  let score = 0;

  if (runtime > 140) score += 2;
  else if (runtime > 110) score += 1;
  else if (runtime > 0 && runtime <= 95) score -= 1;

  for (const id of genreIds) {
    if (FULL_ATTENTION_GENRE_IDS.has(id)) score += 2;
    if (BACKGROUND_GENRE_IDS.has(id)) score -= 1;
  }

  return score >= 2 ? "full" : "background";
}

function attentionLabel(level: AttentionLevel) {
  return level === "full" ? "full attention" : "background / multitask-friendly";
}

function sortForAttention(movies: MovieSummary[], level: AttentionLevel) {
  return [...movies].sort((a, b) => {
    const popA = a.popularity ?? 0;
    const popB = b.popularity ?? 0;
    const ratingA = a.voteAverage ?? 0;
    const ratingB = b.voteAverage ?? 0;
    if (level === "background") return popB - popA || ratingB - ratingA;
    return ratingB - ratingA || popB - popA;
  });
}

function summarizeGenres(genres: Genre[]) {
  return genres.map((genre) => genre.name).filter(Boolean);
}

export async function runAttentionRequirement(
  input: {
    anchorMovieId?: number;
    attention?: AttentionLevel;
    watchlist: number[];
    favorites: number[];
    history: number[];
  },
) {
  const exclude = new Set(input.history);
  const anchorId = input.anchorMovieId ?? input.history[0] ?? input.favorites[0] ?? input.watchlist[0];
  let anchor: Movie | null = null;
  let attention: AttentionLevel = input.attention ?? "background";

  if (anchorId) {
    anchor = await getMovie(anchorId);
    if (anchor && !input.attention) attention = classifyMovieAttention(anchor);
  }

  const genreId = anchor?.genres[0]?.id;
  const [recs, discovered] = await Promise.all([
    anchorId ? getRecommendations(anchorId).catch(() => ({ results: [] as MovieSummary[] })) : Promise.resolve({ results: [] as MovieSummary[] }),
    discoverMovies({
      genre: genreId,
      sort: attention === "full" ? "rating" : "popularity",
      ratingGte: attention === "full" ? 7 : 5.5,
      runtimeLte: attention === "background" ? 120 : undefined,
    }),
  ]);

  let movies = filterWatchableTonight(
    dedupe([...recs.results, ...discovered.results], exclude),
  );
  movies = sortForAttention(movies, attention).slice(0, 8);

  const reason = anchor
    ? `"${anchor.title}" is best with ${attentionLabel(attention)}. Similar picks below.`
    : attention === "full"
      ? "Higher-rated titles that reward full attention."
      : "Comfortable, lower-attention picks from popularity signals.";

  const primary = movies[0] ?? null;

  return {
    primary,
    movies,
    anchor: anchor
      ? {
          id: anchor.id,
          title: anchor.title,
          runtime: anchor.runtime,
          genres: summarizeGenres(anchor.genres),
          attention,
          attentionLabel: attentionLabel(attention),
        }
      : undefined,
    attention,
    attentionLabel: attentionLabel(attention),
    reason,
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
    hasHistory: input.history.length > 0,
  };
}
