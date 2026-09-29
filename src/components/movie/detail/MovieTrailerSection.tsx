"use client";

import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import { getPosterUrl } from "@/lib/tmdb/images";
import { getPrimaryTrailer, youtubeWatchUrl } from "@/lib/tmdb/videos";
import type { Video } from "@/lib/tmdb/types";
import { useEffect, useState } from "react";

export function MovieTrailerSection({
  movieId,
  movieTitle,
  posterPath,
  initialVideos,
}: {
  movieId: number;
  movieTitle?: string;
  posterPath?: string | null;
  initialVideos: Video[];
}) {
  const poster = getPosterUrl(posterPath, "w780");
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(!getPrimaryTrailer(initialVideos));

  useEffect(() => {
    if (getPrimaryTrailer(initialVideos)) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/movies/${movieId}/videos`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length) setVideos(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId, initialVideos]);

  const trailer = getPrimaryTrailer(videos);

  return (
    <section id="trailer" className="detail-section">
      <p className="eyebrow mb-2">From TMDB catalog</p>
      <h2 className="section-title">Trailer</h2>
      {loading && !trailer ? (
        <p className="text-sm text-[var(--text-muted)]">Loading trailer…</p>
      ) : trailer ? (
        <div className="trailer-frame">
          <CinemaPlayer
            source={{
              providerId: "tmdb-youtube",
              movieId,
              type: "embed",
              url: youtubeWatchUrl(trailer.key),
              title: trailer.name,
            }}
            poster={poster ?? undefined}
            movieId={movieId}
            movieTitle={movieTitle}
            mode="trailer"
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          No YouTube trailer is listed for this title in TMDB yet.
        </p>
      )}
    </section>
  );
}
