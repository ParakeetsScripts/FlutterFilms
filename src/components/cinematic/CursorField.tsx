"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { clamp } from "@/lib/motion/progress";
import { useEffect, useRef } from "react";

const CURSOR_LABELS: Record<string, string> = {
  open: "Open",
  play: "Play",
  explore: "Explore",
  ai: "Ask AI",
  view: "View",
};

const MAGNET_STRENGTH = 0.18;
const MAGNET_MAX_PX = 6;

/** Full-mode only: a small labelled ring near the pointer and gentle magnetism on `[data-magnetic]`. */
export function CursorField() {
  const { state } = useMotion();
  if (state.mode !== "full") return null;
  return <ActiveCursorField />;
}

function ActiveCursorField() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    let frame = 0;
    let x = -100;
    let y = -100;
    let magnet: HTMLElement | null = null;

    const render = () => {
      frame = 0;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const releaseMagnet = () => {
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      const target = event.target instanceof Element ? event.target : null;

      const cursorKey = target?.closest("[data-cursor]")?.getAttribute("data-cursor") ?? "";
      const text = CURSOR_LABELS[cursorKey] ?? "";
      ring.dataset.state = text ? "label" : target?.closest("input, textarea, select") ? "hidden" : "idle";
      if (label.textContent !== text) label.textContent = text;

      const magnetic = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnetic !== magnet) releaseMagnet();
      if (magnetic) {
        magnet = magnetic;
        const rect = magnetic.getBoundingClientRect();
        const dx = clamp((x - (rect.left + rect.width / 2)) * MAGNET_STRENGTH, -MAGNET_MAX_PX, MAGNET_MAX_PX);
        const dy = clamp((y - (rect.top + rect.height / 2)) * MAGNET_STRENGTH, -MAGNET_MAX_PX, MAGNET_MAX_PX);
        magnetic.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }

      if (!frame) frame = requestAnimationFrame(render);
    };

    const onLeave = () => {
      ring.dataset.state = "hidden";
      releaseMagnet();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      releaseMagnet();
    };
  }, []);

  return (
    <div ref={ringRef} className="cursor-field" data-state="hidden" aria-hidden="true">
      <span ref={labelRef} className="cursor-field__label" />
    </div>
  );
}
