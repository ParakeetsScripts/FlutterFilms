"use client";

import { readLastCount, writeLastCount } from "@/lib/discover/catalog-session";
import { formatCount, formatResultCount, isCappedTotal } from "@/lib/discover/catalog-view";
import { easeOutCubic } from "@/lib/motion/progress";
import { useEffect, useRef } from "react";

const DURATION_MS = 750;

/**
 * Real result count. When the query changes, the number interpolates from the previous
 * real count to the new real count; the accessible text is always the final value.
 */
export function AnimatedCount({ value, className, persist = false }: { value: number; className?: string; persist?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = persist ? readLastCount() : null;
    if (persist) writeLastCount(value);
    const reduced = document.documentElement.dataset.motion === "reduced" || document.documentElement.dataset.motion === "static";
    if (from === null || from === value || reduced || isCappedTotal(value) || isCappedTotal(from)) {
      el.textContent = formatResultCount(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = easeOutCubic((now - start) / DURATION_MS);
      el.textContent = formatCount(from + (value - from) * t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, persist]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {formatResultCount(value)}
      </span>
      <span className="sr-only">{isCappedTotal(value) ? "more than 20,000" : formatCount(value)}</span>
    </span>
  );
}
