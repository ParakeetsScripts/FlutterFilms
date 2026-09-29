"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import {
  IDENTITY_TRANSFORM,
  invertTransform,
  isUsableRect,
  pushInRect,
  rectIntersectsViewport,
  transformToCss,
  type Rect,
} from "@/lib/motion/flip";
import { MOTION } from "@/lib/motion/tokens";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

type StartOptions = { movieId: number; href: string; imageUrl: string; sourceRect: Rect };

type SharedTransitionApi = {
  /** Returns false when the transition cannot run; the caller should navigate normally. */
  start: (options: StartOptions) => boolean;
  claim: (movieId: number, target: HTMLElement) => void;
};

type Flight = {
  movieId: number;
  image: HTMLImageElement;
  veil: HTMLDivElement;
  animation: Animation | null;
  timer: number;
  reachedDestination: boolean;
  landing: boolean;
};

const SharedTransitionContext = createContext<SharedTransitionApi>({
  start: () => false,
  claim: () => {},
});

function place(el: HTMLElement, rect: Rect) {
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function toRect(domRect: DOMRect): Rect {
  return { left: domRect.left, top: domRect.top, width: domRect.width, height: domRect.height };
}

function viewportSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function teardown(flight: Flight, fade: boolean) {
  window.clearTimeout(flight.timer);
  document.documentElement.classList.remove("is-shared-transition");
  flight.veil.classList.remove("is-visible");
  const remove = () => {
    flight.animation?.cancel();
    flight.image.remove();
    flight.veil.remove();
  };
  if (!fade) {
    remove();
    return;
  }
  const fadeOut = flight.image.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: MOTION.duration.fast,
    easing: "ease-out",
    fill: "forwards",
  });
  fadeOut.onfinish = remove;
  fadeOut.oncancel = remove;
  window.setTimeout(remove, MOTION.duration.ui + 80);
}

/**
 * Poster FLIP between routes. Navigation starts immediately; the poster pushes in while the
 * destination renders, then lands on the element registered with `SharedPosterTarget`.
 */
export function SharedTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useMotion();
  const flightRef = useRef<Flight | null>(null);
  const enabled = state.sharedTransitions;

  const abort = useCallback((fade = true) => {
    const flight = flightRef.current;
    if (!flight) return;
    flightRef.current = null;
    teardown(flight, fade);
  }, []);

  const start = useCallback(
    (options: StartOptions) => {
      if (!enabled || !isUsableRect(options.sourceRect) || !options.imageUrl) return false;
      abort(false);

      const image = document.createElement("img");
      image.src = options.imageUrl;
      image.alt = "";
      image.className = "shared-flight";
      image.setAttribute("aria-hidden", "true");
      place(image, options.sourceRect);

      const veil = document.createElement("div");
      veil.className = "shared-veil";
      veil.setAttribute("aria-hidden", "true");

      document.body.append(veil, image);
      document.documentElement.classList.add("is-shared-transition");
      requestAnimationFrame(() => veil.classList.add("is-visible"));

      const target = pushInRect(options.sourceRect, viewportSize());
      const animation = image.animate(
        [
          { transform: transformToCss(IDENTITY_TRANSFORM) },
          { transform: transformToCss(invertTransform(target, options.sourceRect)) },
        ],
        { duration: MOTION.duration.scene, easing: MOTION.easing.cinematic, fill: "forwards" },
      );

      const flight: Flight = {
        movieId: options.movieId,
        image,
        veil,
        animation,
        timer: 0,
        reachedDestination: false,
        landing: false,
      };
      flight.timer = window.setTimeout(() => {
        if (flightRef.current === flight) abort();
      }, MOTION.sharedTransitionTimeout);
      flightRef.current = flight;

      router.push(options.href);
      return true;
    },
    [abort, enabled, router],
  );

  const claim = useCallback(
    (movieId: number, target: HTMLElement) => {
      const flight = flightRef.current;
      if (!flight || flight.movieId !== movieId || flight.landing) return;
      flight.landing = true;
      window.clearTimeout(flight.timer);
      target.dataset.sharedArrival = "true";

      requestAnimationFrame(() => {
        const to = toRect(target.getBoundingClientRect());
        if (!isUsableRect(to) || !rectIntersectsViewport(to, viewportSize())) {
          abort();
          return;
        }
        const from = toRect(flight.image.getBoundingClientRect());
        flight.animation?.cancel();
        place(flight.image, to);
        const landing = flight.image.animate(
          [{ transform: transformToCss(invertTransform(from, to)) }, { transform: transformToCss(IDENTITY_TRANSFORM) }],
          { duration: MOTION.duration.scene, easing: MOTION.easing.cinematic, fill: "forwards" },
        );
        flight.animation = landing;
        const done = () => {
          if (flightRef.current === flight) abort();
        };
        landing.onfinish = done;
        landing.oncancel = done;
      });
    },
    [abort],
  );

  useEffect(() => {
    const flight = flightRef.current;
    if (!flight) return;
    if (pathname.startsWith(`/movie/${flight.movieId}`)) {
      flight.reachedDestination = true;
    } else if (flight.reachedDestination) {
      abort(false);
    }
  }, [abort, pathname]);

  useEffect(() => {
    const onPopState = () => abort(false);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      abort(false);
    };
  }, [abort]);

  const api = useMemo(() => ({ start, claim }), [start, claim]);
  return <SharedTransitionContext.Provider value={api}>{children}</SharedTransitionContext.Provider>;
}

export function useSharedTransition(): SharedTransitionApi {
  return useContext(SharedTransitionContext);
}

/** Click handler for movie links: plain left clicks fly the poster; modified clicks behave natively. */
export function useMovieOpen() {
  const { start } = useSharedTransition();
  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>, movie: { id: number; href: string }, source: HTMLElement | null) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const image = source?.querySelector("img");
      if (!source || !image || !image.complete || !image.naturalWidth) return;
      const imageUrl = image.currentSrc || image.src;
      if (start({ movieId: movie.id, href: movie.href, imageUrl, sourceRect: toRect(source.getBoundingClientRect()) })) {
        event.preventDefault();
      }
    },
    [start],
  );
}

/** Destination for the poster flight (movie detail hero). Hidden while the flight lands. */
export function SharedPosterTarget({
  movieId,
  className,
  children,
}: {
  movieId: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { claim } = useSharedTransition();

  useEffect(() => {
    if (ref.current) claim(movieId, ref.current);
  }, [claim, movieId]);

  return (
    <div ref={ref} className={className ? `shared-poster-target ${className}` : "shared-poster-target"} data-shared-poster={movieId}>
      {children}
    </div>
  );
}
