"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { readMetrics } from "@/lib/motion/debug-metrics";
import { getScrollEngine } from "@/lib/motion/scroll-engine";
import { useEffect, useRef, useState } from "react";

/** Development-only overlay, toggled with Alt+Shift+D. Never rendered in production builds. */
export function CinematicDebug() {
  if (process.env.NODE_ENV === "production") return null;
  return <DebugToggle />;
}

function DebugToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === "KeyD") setOpen((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return open ? <DebugPanel /> : null;
}

function DebugPanel() {
  const { state, capabilities } = useMotion();
  const liveRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let frames = 0;
    let worst = 0;
    let windowStart = last;

    const loop = (now: number) => {
      const delta = now - last;
      last = now;
      frames += 1;
      worst = Math.max(worst, delta);
      if (now - windowStart >= 500 && liveRef.current) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        const scenes = getScrollEngine()
          .snapshot()
          .map(({ id, progress }) =>
            progress
              ? `${id.padEnd(12)} ${progress.phase.padEnd(6)} p=${progress.progress.toFixed(2)} pin=${progress.pin.toFixed(2)}`
              : `${id.padEnd(12)} (idle)`,
          );
        const metrics = readMetrics().map(([name, value]) => `${name}: ${value}ms`);
        liveRef.current.textContent = [`fps ${fps} · worst frame ${worst.toFixed(1)}ms`, ...metrics, "", ...scenes].join("\n");
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <aside className="cine-debug" aria-label="Cinematic debug">
      <p className="cine-debug__title">Cinematic debug</p>
      <p>
        mode <strong>{state.mode}</strong> · depth {state.depthScale}
      </p>
      <p>
        webgl {state.webglScenes ? "on" : "off"} · scroll {state.scrollScenes ? "on" : "off"} · pointer{" "}
        {state.pointerEffects ? "on" : "off"} · shared {state.sharedTransitions ? "on" : "off"}
      </p>
      {capabilities ? (
        <p>
          reduced-motion {String(capabilities.prefersReducedMotion)} · fine {String(capabilities.finePointer)} · cores{" "}
          {capabilities.hardwareConcurrency ?? "?"} · mem {capabilities.deviceMemory ?? "?"}
        </p>
      ) : null}
      <pre ref={liveRef} className="cine-debug__live" />
    </aside>
  );
}
