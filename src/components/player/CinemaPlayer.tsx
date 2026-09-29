"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { buildCinemaArtplayerOptions } from "@/lib/player/artplayer-cinema";
import type { CinemaMode } from "@/lib/player/cinema-danmuku";
import type { PlaybackSource } from "@/lib/playback/types";
import { loadArtplayer, type ArtplayerInstance } from "@/lib/player/load-player-modules";
import { useEffect, useRef, useState } from "react";

export function CinemaPlayer({
  source,
  poster,
  movieId,
  movieTitle,
  mode = "watch",
  trackProgress = false,
}: {
  source: PlaybackSource;
  poster?: string;
  movieId?: number;
  movieTitle?: string;
  mode?: CinemaMode;
  trackProgress?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<ArtplayerInstance | null>(null);
  const { updateContinueWatching } = useUserLibrary();
  const persistRef = useRef(updateContinueWatching);
  persistRef.current = updateContinueWatching;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source.type === "external") return;

    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    setError(null);

    async function mount() {
      const Artplayer = await loadArtplayer();

      if (disposed || !container) return;

      artRef.current?.destroy(false);
      container.innerHTML = "";

      const options = await buildCinemaArtplayerOptions({
        container,
        source,
        poster,
        movieId,
        movieTitle,
        mode,
        onError: (message) => setError(message),
      });

      const art = new Artplayer(options);
      artRef.current = art;

      function persistProgress() {
        const video = art.video;
        if (!trackProgress || !movieId || !video?.duration || source.type === "embed") return;
        if (video.currentTime < 30) return;
        persistRef.current({
          movieId,
          positionSeconds: Math.floor(video.currentTime),
          durationSeconds: Math.floor(video.duration),
          updatedAt: new Date().toISOString(),
          kind: "movie",
        });
      }

      art.on("video:pause", persistProgress);
      art.on("video:ended", persistProgress);
      art.on("video:timeupdate", persistProgress);
      art.on("error", () => setError("Video source unavailable."));
    }

    void mount();

    return () => {
      disposed = true;
      artRef.current?.destroy(false);
      artRef.current = null;
    };
  }, [mode, movieId, movieTitle, poster, source, trackProgress]);

  if (source.type === "external") {
    return (
      <div className="cinema-player cinema-player--external">
        <div className="cinema-player__stage flex aspect-video items-center justify-center">
          <a href={source.url} className="btn btn-primary">
            Open this title on its authorized service
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cinema-player cinema-player--art">
      <div ref={containerRef} className="cinema-player__art" data-testid="artplayer" />
      {error ? <p className="cinema-player__error">{error}</p> : null}
    </div>
  );
}
