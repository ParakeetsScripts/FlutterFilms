import { CinematicRail } from "@/components/navigation/CinematicRail";
import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";
import Link from "next/link";

export function MovieRow({
  title,
  movies,
  empty = "Nothing to show here yet.",
  href,
  showUpdated,
  spotlight,
  upcoming,
  bare = false,
  railId,
}: {
  title: string;
  movies: MovieSummary[];
  empty?: string;
  href?: string;
  showUpdated?: boolean;
  spotlight?: boolean;
  upcoming?: boolean;
  /** Skip outer section wrapper when parent provides section chrome */
  bare?: boolean;
  /** Stable id for horizontal scroll position memory */
  railId?: string;
}) {
  if (!movies.length) {
    return (
      <section className="row-section">
        <div className="row-section__header">
          <h2 className="row-section__title">{title}</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{empty}</p>
      </section>
    );
  }

  const label = title || "Movies";
  const storageKey = railId ?? (title ? title.toLowerCase().replace(/\s+/g, "-") : undefined);

  const scroller = (
    <CinematicRail label={label} storageKey={storageKey}>
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          variant={spotlight ? "spotlight" : upcoming ? "upcoming" : "standard"}
          showUpdated={showUpdated}
        />
      ))}
    </CinematicRail>
  );

  if (bare) return scroller;

  return (
    <section className="row-section">
      {title ? (
        <div className="row-section__header">
          <h2 className="row-section__title">{title}</h2>
          {href ? (
            <Link href={href} className="row-section__link">
              See all →
            </Link>
          ) : null}
        </div>
      ) : null}
      {scroller}
    </section>
  );
}
