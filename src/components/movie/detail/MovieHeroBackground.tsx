"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
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
  const { settings } = useUserLibrary();
  const [videos, setVideos] = useState(initialVideos);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mobile, setMobile] = useState(true);
  const [measured, setMeasured] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [userStarted, setUserStarted] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.matchMedia("(max-width: 900px)");
    const update = () => {
      setReduceMotion(motion.matches);
      setMobile(viewport.matches);
      setSaveData(prefersSaveData());
      setMeasured(true);
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
  const ambientAllowed =
    measured && Boolean(heroVideo) && !reduceMotion && !mobile && !saveData && settings.autoplayTrailers;
  const showVideo = Boolean(heroVideo && !videoFailed && (userStarted || ambientAllowed));

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
        <div className="detail-hero-v2__video" aria-hidden={userStarted ? undefined : true}>
          <iframe
            title={userStarted ? "Trailer" : ""}
            src={heroEmbedUrl(heroVideo.key)}
            allow="autoplay; encrypted-media; picture-in-picture"
            tabIndex={userStarted ? 0 : -1}
            style={{ pointerEvents: userStarted ? "auto" : "none" }}
            onError={() => setVideoFailed(true)}
          />
        </div>
      ) : null}
      {!showVideo && heroVideo && measured ? (
        <button type="button" className="detail-hero-v2__play" onClick={() => setUserStarted(true)}>
          Play trailer
        </button>
      ) : null}
    </div>
  );
}
