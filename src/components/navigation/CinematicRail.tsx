"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics/track";
import { RailControls } from "./RailControls";
import { RailProgress } from "./RailProgress";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
  type WheelEvent,
} from "react";

const SCROLL_TOLERANCE = 4;
const SCROLL_FRACTION = 0.8;

type CinematicRailProps = {
  label: string;
  children: ReactNode;
  className?: string;
  storageKey?: string;
};

export function CinematicRail({ label, children, className = "", storageKey }: CinematicRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const railId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > SCROLL_TOLERANCE;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && scrollLeft > SCROLL_TOLERANCE);
    setCanScrollRight(overflow && scrollLeft + clientWidth < scrollWidth - SCROLL_TOLERANCE);
    if (overflow && scrollWidth > clientWidth) {
      setProgress(scrollLeft / (scrollWidth - clientWidth));
    } else {
      setProgress(0);
    }
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

    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [storageKey, updateScrollState]);

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
    [label, persistScroll, updateScrollState],
  );

  const onWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !hasOverflow) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (Math.abs(event.deltaY) < 8) return;
    el.scrollLeft += event.deltaY;
    event.preventDefault();
  }, [hasOverflow]);

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

  const showArrows = hasOverflow;

  return (
    <div
      className={`row-scroller-wrap cinematic-rail ${className} ${canScrollLeft ? "cinematic-rail--can-left" : ""} ${canScrollRight ? "cinematic-rail--can-right" : ""}`}
      data-rail={railId}
    >
      {showArrows ? (
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
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
      <RailProgress progress={progress} visible={hasOverflow && progress < 0.98} />
    </div>
  );
}
