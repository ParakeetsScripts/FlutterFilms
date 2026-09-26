"use client";

import { MovieRow } from "@/components/movie/MovieRow";
import { PosterSkeleton } from "@/components/ui/States";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useEffect, useState } from "react";

export function PersonalizedRow({ anchorId, title }: { anchorId: number; title: string }) {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`/api/movies/${anchorId}/recommendations`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { results?: MovieSummary[] } | null) => {
        if (cancelled) return;
        setMovies((data?.results ?? []).slice(0, 12));
        setFailed(!data?.results?.length);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anchorId]);

  if (loading) {
    return (
      <section className="row-section">
        <div className="row-section__header">
          <h2 className="row-section__title">{title}</h2>
        </div>
        <PosterSkeleton count={6} />
      </section>
    );
  }

  if (failed || !movies.length) return null;

  return <MovieRow title={title} movies={movies} bare={!title} />;
}
