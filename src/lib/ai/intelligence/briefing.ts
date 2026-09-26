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

export async function buildMovieBriefing(movieId: number, spoilerLevel: SpoilerLevel = "none") {
  const movie = await getMovie(movieId);
  if (!movie) return null;

  const sections: BriefingSection[] = [
    {
      title: "At a glance",
      body: [
        movie.title,
        movie.year ? `(${movie.year})` : null,
        formatRuntime(movie.runtime),
        movie.genres.map((g) => g.name).join(", "),
        movie.releases?.certification,
      ]
        .filter(Boolean)
        .join(" · "),
      label: trustBadge("verified"),
    },
    {
      title: "Ratings (separate sources)",
      body: `TMDB ${movie.tmdbRating ?? movie.voteAverage ?? "n/a"} · IMDb ${movie.imdbRating ?? "n/a"} — never averaged.`,
      label: trustBadge("metadata"),
    },
  ];

  if (spoilerLevel === "none" && movie.overview) {
    sections.push({
      title: "Should I watch this?",
      body: `${movie.overview.slice(0, 280)}${movie.overview.length > 280 ? "…" : ""}`,
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
      title: "Theme explorer",
      body: `Primary genres: ${movie.genres.map((g) => g.name).join(", ")}. Thematic reading is interpretive — verify with your own viewing.`,
      label: trustBadge("ai_interpretation"),
    });
  }

  if (movie.keywords?.length && spoilerLevel === "none") {
    const motifs = movie.keywords.slice(0, 6).map((k) => k.name).join(", ");
    sections.push({
      title: "Motif signals",
      body: `Catalog keywords: ${motifs}. Recurring motifs require viewing — these are metadata tags only.`,
      label: trustBadge("metadata"),
    });
  }

  const directors = movie.credits.crew.filter((c) => c.job === "Director").map((c) => c.name);
  const cinematographers = movie.credits.crew.filter((c) => c.job === "Director of Photography").map((c) => c.name);
  if (directors.length || cinematographers.length) {
    sections.push({
      title: "Filmmaking breakdown",
      body: [
        directors.length ? `Director: ${directors.join(", ")}` : null,
        cinematographers.length ? `Cinematography: ${cinematographers.join(", ")}` : null,
        movie.runtime ? `Runtime ${formatRuntime(movie.runtime)} — pacing context only.` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      label: trustBadge("verified"),
    });
  }

  if (spoilerLevel === "moderate" || spoilerLevel === "full") {
    sections.push({
      title: "Spoiler zone",
      body: "Detailed plot discussion requires Copilot with explicit confirmation. FlutterFilms does not invent plot facts.",
      label: trustBadge("ai_interpretation"),
    });
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
