/**
 * JS mirror of the motion tokens in `src/styles/cinematic/tokens.css`.
 * Only one-shot WAAPI transitions read these; CSS owns everything else.
 */
export const MOTION = {
  duration: {
    fast: 160,
    ui: 240,
    scene: 520,
    cinematic: 900,
  },
  easing: {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  /** Upper bound for waiting on a destination route before a shared transition gives up. */
  sharedTransitionTimeout: 4500,
} as const;
