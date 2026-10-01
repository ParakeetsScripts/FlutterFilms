"use client";

import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
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
  const { settings } = useUserLibrary();
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(!getPrimaryTrailer(initialVideos));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!settings.autoplayTrailers) return;
    if (window.matchMedia("(max-width: 899px), (prefers-reduced-motion: reduce)").matches) return;
    setPlaying(true);
  }, [settings.autoplayTrailers]);

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
          {playing ? (
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
          ) : (
            <button type="button" className="trailer-poster" onClick={() => setPlaying(true)}>
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt="" />
              ) : null}
              <span className="trailer-poster__play">Play trailer</span>
              <span className="trailer-poster__name">{trailer.name}</span>
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          No YouTube trailer is listed for this title in TMDB yet.
        </p>
      )}
    </section>
  );
}
