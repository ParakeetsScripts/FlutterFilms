"use client";

import { getPrimaryHeroVideo, youtubeEmbedUrl } from "@/lib/tmdb/videos";
import type { Video } from "@/lib/tmdb/types";
import { useEffect, useMemo, useState } from "react";

function heroEmbedUrl(key: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: key,
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
  });
  return `${youtubeEmbedUrl(key)}?${params.toString()}`;
}

function prefersSaveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

export function MovieHeroBackground({
  movieId,
  backdrop,
  initialVideos,
}: {
  movieId: number;
  backdrop?: string | null;
  initialVideos: Video[];
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.matchMedia("(max-width: 900px)");
    const update = () => {
      setReduceMotion(motion.matches);
      setMobile(viewport.matches);
      setSaveData(prefersSaveData());
    };
    update();
    motion.addEventListener("change", update);
    viewport.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      viewport.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (getPrimaryHeroVideo(initialVideos)) return;
    let cancelled = false;
    fetch(`/api/movies/${movieId}/videos`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length) setVideos(data);
      })
      .catch(() => {
        // Keep backdrop-only hero.
      });
    return () => {
      cancelled = true;
    };
  }, [movieId, initialVideos]);

  const heroVideo = useMemo(() => getPrimaryHeroVideo(videos), [videos]);
  const showVideo = Boolean(heroVideo && !reduceMotion && !mobile && !saveData && !videoFailed);

  useEffect(() => {
    setVideoFailed(false);
  }, [heroVideo?.key]);

  return (
    <div className="detail-hero-v2__media" data-testid="movie-hero-media">
      {backdrop ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt=""
          className={
            showVideo
              ? "detail-hero-v2__backdrop detail-hero-v2__backdrop--under-video"
              : "detail-hero-v2__backdrop detail-hero-v2__backdrop--animated"
          }
        />
      ) : null}
      {showVideo && heroVideo ? (
        <div className="detail-hero-v2__video" aria-hidden="true">
          <iframe
            title=""
            src={heroEmbedUrl(heroVideo.key)}
            allow="autoplay; encrypted-media; picture-in-picture"
            tabIndex={-1}
            style={{ pointerEvents: "none" }}
            onError={() => setVideoFailed(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
