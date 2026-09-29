"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics/track";
import { railOffset } from "@/lib/motion/progress";
import { RailControls } from "./RailControls";
import { RailProgress } from "./RailProgress";
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";

const SCROLL_TOLERANCE = 4;
const SCROLL_FRACTION = 0.8;

export type RailDepth = "flat" | "arc";

type CinematicRailProps = {
  label: string;
  children: ReactNode;
  className?: string;
  storageKey?: string;
  /** "arc" curves cards away from the rail center as the rail scrolls (film-strip LOD). */
  depth?: RailDepth;
};

export function CinematicRail({ label, children, className = "", storageKey, depth = "flat" }: CinematicRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { state } = useMotion();
  const railId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const arcEnabled = depth === "arc" && state.scrollScenes;
  const itemCount = Children.count(children);
  const centers = useRef<number[]>([]);
  const arcFrame = useRef(0);

  const paintArc = useCallback(() => {
    arcFrame.current = 0;
    const el = scrollerRef.current;
    if (!el) return;
    const half = el.clientWidth / 2;
    const viewportCenter = el.scrollLeft + half;
    Array.from(el.children).forEach((child, index) => {
      const offset = railOffset(centers.current[index] ?? viewportCenter, viewportCenter, half * 1.15);
      const node = child as HTMLElement;
      node.style.setProperty("--arc", offset.toFixed(3));
      node.style.setProperty("--arc-abs", Math.abs(offset).toFixed(3));
    });
  }, []);

  const scheduleArc = useCallback(() => {
    if (!arcFrame.current) arcFrame.current = requestAnimationFrame(paintArc);
  }, [paintArc]);

  const measureArc = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    centers.current = Array.from(el.children, (child) => {
      const node = child as HTMLElement;
      return node.offsetLeft + node.offsetWidth / 2;
    });
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > SCROLL_TOLERANCE;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && scrollLeft > SCROLL_TOLERANCE);
    setCanScrollRight(overflow && scrollLeft + clientWidth < scrollWidth - SCROLL_TOLERANCE);
    setProgress(overflow ? scrollLeft / (scrollWidth - clientWidth) : 0);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    if (storageKey) {
      try {
        const saved = sessionStorage.getItem(`rail:${storageKey}`);
        if (saved) el.scrollLeft = Number(saved);
      } catch {
        /* ignore */
      }
    }

    const onResize = () => {
      updateScrollState();
      if (arcEnabled) {
        measureArc();
        scheduleArc();
      }
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [storageKey, updateScrollState, arcEnabled, measureArc, scheduleArc, itemCount]);

  useEffect(() => {
    if (arcEnabled) return;
    const el = scrollerRef.current;
    if (!el) return;
    for (const child of Array.from(el.children)) {
      (child as HTMLElement).style.removeProperty("--arc");
      (child as HTMLElement).style.removeProperty("--arc-abs");
    }
  }, [arcEnabled, itemCount]);

  useEffect(() => () => cancelAnimationFrame(arcFrame.current), []);

  const persistScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !storageKey) return;
    try {
      sessionStorage.setItem(`rail:${storageKey}`, String(el.scrollLeft));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const delta = el.clientWidth * SCROLL_FRACTION * direction;
      el.scrollBy({ left: delta, behavior: reducedMotion ? "auto" : "smooth" });
      track(direction < 0 ? "rail_arrow_left" : "rail_arrow_right", { label });
      if (direction > 0 && !canScrollRight) track("rail_end_reached", { label });
    },
    [canScrollRight, label, reducedMotion],
  );

  const endTracked = useRef(false);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      updateScrollState();
      persistScroll();
      if (arcEnabled) scheduleArc();
      const atEnd =
        event.currentTarget.scrollLeft + event.currentTarget.clientWidth >=
        event.currentTarget.scrollWidth - SCROLL_TOLERANCE;
      if (atEnd && !endTracked.current) {
        endTracked.current = true;
        track("rail_end_reached", { label });
      } else if (!atEnd) {
        endTracked.current = false;
      }
    },
    [arcEnabled, label, persistScroll, scheduleArc, updateScrollState],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const el = scrollerRef.current;
      if (!el) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByPage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByPage(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        el.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
      } else if (event.key === "End") {
        event.preventDefault();
        el.scrollTo({ left: el.scrollWidth, behavior: reducedMotion ? "auto" : "smooth" });
      }
    },
    [reducedMotion, scrollByPage],
  );

  return (
    <div
      className={[
        "row-scroller-wrap cinematic-rail",
        depth === "arc" ? "cinematic-rail--arc" : "",
        className,
        canScrollLeft ? "cinematic-rail--can-left" : "",
        canScrollRight ? "cinematic-rail--can-right" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-rail={railId}
    >
      {hasOverflow ? (
        <RailControls
          label={label}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onLeft={() => scrollByPage(-1)}
          onRight={() => scrollByPage(1)}
        />
      ) : null}
      <div
        ref={scrollerRef}
        className="row-scroller cinematic-rail__scroller"
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
      <RailProgress progress={progress} visible={hasOverflow && progress < 0.98} />
    </div>
  );
}
