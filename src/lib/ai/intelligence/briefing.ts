import "server-only";

import { getMovie } from "@/lib/tmdb/movies";
import type { Movie } from "@/lib/tmdb/types";
import { formatRuntime } from "@/lib/slug";
import { trustBadge } from "../trust";

export type SpoilerLevel = "none" | "light" | "moderate" | "full";

export type BriefingSection = {
  title: string;
  body: string;
  label: ReturnType<typeof trustBadge>;
};

export type BriefingOptions = {
  language?: string;
  region?: string;
};

function formatScore(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return value.toFixed(1);
}

function formatVoteCount(value: number | null | undefined): string | null {
  if (value == null || value <= 0) return null;
  return value.toLocaleString("en-US");
}

export function formatBriefingRatings(movie: Movie): string {
  const tmdbScore = formatScore(movie.tmdbRating ?? movie.voteAverage);
  const tmdbVotes = formatVoteCount(movie.tmdbVoteCount ?? movie.voteCount);
  const tmdbPart = tmdbScore
    ? `TMDB ${tmdbScore}${tmdbVotes ? ` (${tmdbVotes} votes)` : ""}`
    : "TMDB rating unavailable";

  let imdbPart = "IMDb rating not synced yet";
  const imdbScore = formatScore(movie.imdbRating);
  const imdbVotes = formatVoteCount(movie.imdbVoteCount);
  if (imdbScore) {
    imdbPart = `IMDb ${imdbScore}${imdbVotes ? ` (${imdbVotes} votes)` : ""}`;
  } else if (movie.imdbId) {
    imdbPart = `IMDb rating pending sync (${movie.imdbId})`;
  }

  return `${tmdbPart} · ${imdbPart}. Ratings are never averaged.`;
}

function truncateOverview(overview: string, maxLength: number): string {
  if (overview.length <= maxLength) return overview;
  const slice = overview.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function buildSpoilerZoneBody(movie: Movie, spoilerLevel: SpoilerLevel): string | null {
  const overview = movie.overview?.trim();
  if (!overview) {
    return "Plot synopsis is not available in the catalog yet.";
  }

  if (spoilerLevel === "moderate") {
    return overview;
  }

  const parts = [overview];
  if (movie.tagline?.trim()) {
    parts.push(`Tagline: ${movie.tagline.trim()}`);
  }
  if (movie.keywords?.length) {
    parts.push(`Catalog keywords: ${movie.keywords.map((k) => k.name).join(", ")}.`);
  }
  return parts.join("\n\n");
}

function atAGlanceBody(movie: Movie): string {
  const title =
    movie.originalTitle && movie.originalTitle !== movie.title
      ? `${movie.title} (${movie.originalTitle})`
      : movie.title;

  return [
    title,
    movie.year ? `(${movie.year})` : null,
    formatRuntime(movie.runtime),
    movie.genres.map((g) => g.name).join(", "),
    movie.releases?.certification,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function computeMovieDna(movie: Movie): string {
  const runtime = movie.runtime ?? 0;
  const pacing =
    runtime <= 95 ? "Fast" : runtime <= 130 ? "Moderate" : runtime > 0 ? "Measured" : "Unknown";
  const genreBlend = movie.genres.map((g) => g.name).join(" · ") || "Unclassified";
  const complexity =
    (movie.keywords?.length ?? 0) >= 8 ? "Thematically dense" : (movie.keywords?.length ?? 0) >= 4 ? "Moderate" : "Focused";
  return [
    `Pacing: ${pacing} (${formatRuntime(movie.runtime) ?? "runtime unknown"})`,
    `Genre blend: ${genreBlend}`,
    `Story focus: ${complexity} (from catalog keywords count)`,
    `Tone signal: ${movie.genres[0]?.name ?? "General"}-leaning (catalog genres)`,
  ].join("\n");
}

function filmmakingBody(movie: Movie): string | null {
  const directors = movie.credits.crew.filter((c) => c.job === "Director").map((c) => c.name);
  const writers = movie.credits.crew
    .filter((c) => c.job === "Writer" || c.job === "Screenplay")
    .map((c) => c.name);
  const cinematographers = movie.credits.crew
    .filter((c) => c.job === "Director of Photography")
    .map((c) => c.name);

  const body = [
    directors.length ? `Director: ${[...new Set(directors)].join(", ")}` : null,
    writers.length ? `Writers: ${[...new Set(writers)].slice(0, 4).join(", ")}` : null,
    cinematographers.length ? `Cinematography: ${[...new Set(cinematographers)].join(", ")}` : null,
    movie.runtime ? `Runtime ${formatRuntime(movie.runtime)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return body || null;
}

export async function buildMovieBriefing(
  movieId: number,
  spoilerLevel: SpoilerLevel = "none",
  options: BriefingOptions = {},
) {
  const movie = await getMovie(movieId, options);
  if (!movie) return null;

  const sections: BriefingSection[] = [
    {
      title: "At a glance",
      body: atAGlanceBody(movie),
      label: trustBadge("verified"),
    },
    {
      title: "Ratings (separate sources)",
      body: formatBriefingRatings(movie),
      label: trustBadge("metadata"),
    },
  ];

  const overview = movie.overview?.trim();
  if (overview && spoilerLevel === "none") {
    sections.push({
      title: "Should I watch this?",
      body: truncateOverview(overview, 280),
      label: trustBadge("metadata"),
    });
  }

  if (overview && spoilerLevel === "light") {
    sections.push({
      title: "Synopsis",
      body: truncateOverview(overview, 480),
      label: trustBadge("metadata"),
    });
  }

  if (spoilerLevel !== "full") {
    const cast = movie.credits.cast.slice(0, 6).map((c) => c.name).join(", ");
    if (cast) {
      sections.push({
        title: "Character primer",
        body: `Key cast: ${cast}. Roles only — no plot reveals.`,
        label: trustBadge("verified"),
      });
    }
  }

  if (movie.collection && spoilerLevel === "none") {
    sections.push({
      title: "Franchise context",
      body: `Part of ${movie.collection.name}. Consider catch-up before sequels.`,
      label: trustBadge("metadata"),
    });
  }

  if (movie.genres.length && spoilerLevel !== "full") {
    sections.push({
      title: "Genres",
      body: movie.genres.map((g) => g.name).join(", "),
      label: trustBadge("metadata"),
    });
  }

  if (movie.keywords?.length && spoilerLevel === "none") {
    const motifs = movie.keywords.slice(0, 6).map((k) => k.name).join(", ");
    sections.push({
      title: "Motif signals",
      body: `Catalog keywords: ${motifs}.`,
      label: trustBadge("metadata"),
    });
  }

  const filmmaking = filmmakingBody(movie);
  if (filmmaking) {
    sections.push({
      title: "Filmmaking breakdown",
      body: filmmaking,
      label: trustBadge("verified"),
    });
  }

  sections.push({
    title: "Movie DNA",
    body: `${computeMovieDna(movie)}\n\nCalculated from FlutterFilms catalog metadata — not a model guess.`,
    label: trustBadge("metadata"),
  });

  if (spoilerLevel === "none" && overview) {
    sections.push({
      title: "Spoiler-safe briefing",
      body: `${truncateOverview(overview, 220)}\n\nNo plot twists or ending details at this spoiler level.`,
      label: trustBadge("metadata"),
    });
  }

  if (spoilerLevel === "none") {
    const guide = buildFirstTimeGuide(movie);
    sections.push({
      title: "First-time viewer guide",
      body: guide.map((g) => `${g.title}: ${g.body}`).join("\n\n"),
      label: trustBadge("metadata"),
    });
  }

  if (spoilerLevel === "moderate" || spoilerLevel === "full") {
    const spoilerBody = buildSpoilerZoneBody(movie, spoilerLevel);
    if (spoilerBody) {
      sections.push({
        title: "Spoiler zone",
        body: spoilerBody,
        label: trustBadge("metadata"),
      });
    }
  }

  return { movieId, movieTitle: movie.title, spoilerLevel, sections, updatedAt: movie.metadataUpdatedAt };
}

export function buildFirstTimeGuide(movie: Movie): BriefingSection[] {
  return [
    {
      title: "Tone & pacing",
      body: `Genres: ${movie.genres.map((g) => g.name).join(", ")}. Runtime ${formatRuntime(movie.runtime) ?? "unknown"}.`,
      label: trustBadge("metadata"),
    },
    {
      title: "Know before you watch",
      body: movie.tagline || "No tagline in catalog.",
      label: trustBadge("verified"),
    },
  ];
}
