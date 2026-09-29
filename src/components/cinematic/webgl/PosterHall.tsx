"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { useSceneProgress } from "@/components/cinematic/CinematicScene";
import { SceneErrorBoundary } from "@/components/cinematic/SceneErrorBoundary";
import { markWebGLUnavailable } from "@/lib/motion/capabilities";
import { cssVars } from "@/lib/motion/css-vars";
import { recordMetric } from "@/lib/motion/debug-metrics";
import { getPointerField } from "@/lib/motion/pointer-field";
import { getScrollEngine } from "@/lib/motion/scroll-engine";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type RefObject } from "react";
import type { PosterHallRenderer } from "./poster-hall-renderer";

const MAX_PRINTS = 9;

type PosterHallProps = {
  movies: MovieSummary[];
  sceneRef: RefObject<HTMLElement | null>;
  /** Tightens the camera slightly while a search is running. */
  focus: boolean;
};

function readPageBackground(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--bg-0").trim();
  return value || "#06070a";
}

/**
 * Decorative hero environment. WebGL on capable desktops, a CSS 3D arc everywhere else.
 * Always aria-hidden: the posters here are atmosphere; the catalog lives in real links below.
 */
export function PosterHall({ movies, sceneRef, focus }: PosterHallProps) {
  const { state } = useMotion();
  const [failed, setFailed] = useState(false);
  const prints = useMemo(() => movies.filter((movie) => movie.posterPath).slice(0, MAX_PRINTS), [movies]);
  const useWebGL = state.webglScenes && !failed && prints.length > 1;

  const fail = () => {
    markWebGLUnavailable();
    setFailed(true);
  };

  return (
    <div className="poster-hall" aria-hidden="true" data-renderer={useWebGL ? "webgl" : "css"}>
      {useWebGL ? (
        <SceneErrorBoundary onError={fail}>
          <PosterHallCanvas
            prints={prints}
            sceneRef={sceneRef}
            focus={focus}
            animateDust={state.mode === "full"}
            maxPixelRatio={state.mode === "full" ? 1.75 : 1.5}
            onFailure={fail}
          />
        </SceneErrorBoundary>
      ) : (
        <PosterHallFallback prints={prints} />
      )}
      <div className="poster-hall__scrim" />
    </div>
  );
}

function PosterHallCanvas({
  prints,
  sceneRef,
  focus,
  animateDust,
  maxPixelRatio,
  onFailure,
}: {
  prints: MovieSummary[];
  sceneRef: RefObject<HTMLElement | null>;
  focus: boolean;
  animateDust: boolean;
  maxPixelRatio: number;
  onFailure: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PosterHallRenderer | null>(null);
  const posterUrls = useMemo(
    () => prints.map((movie) => getPosterUrl(movie.posterPath, "w342")).filter((url): url is string => Boolean(url)),
    [prints],
  );
  const reportFailure = useEffectEvent(onFailure);
  const initialFocus = useEffectEvent(() => (focus ? 1 : 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    const hall = canvas?.parentElement;
    if (!canvas || !hall) return;
    let disposed = false;
    let renderer: PosterHallRenderer | null = null;
    let visibility: IntersectionObserver | null = null;
    const startedAt = performance.now();

    const onPageVisibility = () => {
      if (document.hidden) renderer?.suspend();
      else renderer?.start();
    };

    import("./poster-hall-renderer")
      .then(({ PosterHallRenderer }) => {
        if (disposed) return;
        renderer = new PosterHallRenderer({
          canvas,
          posterUrls,
          background: readPageBackground(),
          animateDust,
          maxPixelRatio,
          onReady: () => {
            hall.dataset.webglReady = "true";
            recordMetric("webgl first frame", performance.now() - startedAt);
          },
          onContextLost: () => reportFailure(),
        });
        rendererRef.current = renderer;
        recordMetric("webgl init", performance.now() - startedAt);

        const scene = sceneRef.current;
        const current = scene ? getScrollEngine().current(scene) : null;
        if (current) renderer.setProgress(current.pin);
        renderer.setFocus(initialFocus());

        visibility = new IntersectionObserver(([entry]) => {
          if (entry?.isIntersecting && !document.hidden) renderer?.start();
          else renderer?.suspend();
        });
        visibility.observe(canvas);
        document.addEventListener("visibilitychange", onPageVisibility);
      })
      .catch(() => {
        if (!disposed) reportFailure();
      });

    return () => {
      disposed = true;
      visibility?.disconnect();
      document.removeEventListener("visibilitychange", onPageVisibility);
      renderer?.dispose();
      rendererRef.current = null;
      delete hall.dataset.webglReady;
    };
  }, [posterUrls, animateDust, maxPixelRatio, sceneRef]);

  useSceneProgress(sceneRef, (progress) => rendererRef.current?.setProgress(progress.pin));

  useEffect(() => getPointerField().subscribe((x, y) => rendererRef.current?.setPointer(x, y)), []);

  useEffect(() => {
    rendererRef.current?.setFocus(focus ? 1 : 0);
  }, [focus]);

  return <canvas ref={canvasRef} className="poster-hall__canvas" />;
}

function PosterHallFallback({ prints }: { prints: MovieSummary[] }) {
  return (
    <div className="poster-hall__fallback">
      <div className="poster-hall__arc">
        {prints.map((movie, index) => {
          const t = prints.length === 1 ? 0 : index / (prints.length - 1) - 0.5;
          const src = getPosterUrl(movie.posterPath, "w185");
          if (!src) return null;
          return (
            <div
              key={movie.id}
              className="poster-hall__print"
              style={cssVars({ "--t": t.toFixed(3), "--abs-t": Math.abs(t).toFixed(3) })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" decoding="async" />
            </div>
          );
        })}
      </div>
      <div className="poster-hall__floor" />
    </div>
  );
}
