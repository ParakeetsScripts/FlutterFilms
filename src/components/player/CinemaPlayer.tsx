"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { PlaybackSource } from "@/lib/playback/types";
import { useEffect, useRef, useState } from "react";

export function CinemaPlayer({
  source,
  poster,
  movieId,
  trackProgress = false,
}: {
  source: PlaybackSource;
  poster?: string;
  movieId?: number;
  trackProgress?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateContinueWatching, settings } = useUserLibrary();
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || source.type === "embed" || source.type === "external") return;

    let hls: { destroy: () => void } | null = null;
    async function attach() {
      if (source.type === "hls" && video && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const instance = new Hls();
          instance.loadSource(source.url);
          instance.attachMedia(video);
          instance.on(Hls.Events.ERROR, () => setError("Playback is temporarily unavailable."));
          hls = instance;
          return;
        }
      }
      if (video) video.src = source.url;
    }
    attach();
    return () => {
      hls?.destroy();
    };
  }, [source]);

  useEffect(() => {
    if (settings.reduceMotion) return;
    function reveal() {
      setShowControls(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setShowControls(false), 2800);
    }
    const node = containerRef.current;
    node?.addEventListener("mousemove", reveal);
    node?.addEventListener("touchstart", reveal);
    return () => {
      node?.removeEventListener("mousemove", reveal);
      node?.removeEventListener("touchstart", reveal);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [settings.reduceMotion]);

  function persistProgress() {
    const video = videoRef.current;
    if (!trackProgress || !movieId || !video || !video.duration) return;
    if (video.currentTime < 30) return;
    updateContinueWatching({
      movieId,
      positionSeconds: Math.floor(video.currentTime),
      durationSeconds: Math.floor(video.duration),
      updatedAt: new Date().toISOString(),
      kind: "movie",
    });
  }

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

  if (source.type === "embed") {
    const youtube = source.url.match(/[?&]v=([^&]+)/)?.[1];
    if (!youtube) {
      return <p className="text-[var(--muted)]">Video source unavailable.</p>;
    }
    return (
      <div className="cinema-player">
        <iframe
          title={source.title ?? "Trailer"}
          src={`https://www.youtube.com/embed/${youtube}`}
          className="aspect-video w-full bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`cinema-player ${showControls ? "is-active" : ""}`}>
      <div className="cinema-player__stage">
        <video
          ref={videoRef}
          className="cinema-player__video"
          playsInline
          poster={poster}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            persistProgress();
          }}
          onTimeUpdate={persistProgress}
          onEnded={persistProgress}
          onError={() => setError("Video source unavailable.")}
        />
        <div className="cinema-player__controls">
          <button
            type="button"
            className="cinema-player__btn"
            onClick={() => {
              const node = videoRef.current;
              if (!node) return;
              if (node.paused) node.play();
              else node.pause();
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="cinema-player__btn"
            onClick={() => {
              const node = videoRef.current;
              if (!node) return;
              node.muted = !node.muted;
              setMuted(node.muted);
            }}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            className="cinema-player__btn"
            onClick={() => videoRef.current?.requestFullscreen?.()}
          >
            Fullscreen
          </button>
          {typeof document !== "undefined" && document.pictureInPictureEnabled && (
            <button
              type="button"
              className="cinema-player__btn"
              onClick={() => {
                const node = videoRef.current;
                if (!node) return;
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                else node.requestPictureInPicture?.();
              }}
            >
              PiP
            </button>
          )}
        </div>
      </div>
      {error && <p className="cinema-player__error">{error}</p>}
    </div>
  );
}
