export type MotionMode = "full" | "balanced" | "reduced" | "static";

export type CinematicIntensity = "low" | "balanced" | "immersive";

export type DeviceCapabilities = {
  prefersReducedMotion: boolean;
  webgl: boolean;
  finePointer: boolean;
  hover: boolean;
  saveData: boolean;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  viewportWidth: number;
};

export type MotionPreferences = {
  intensity: CinematicIntensity;
  /** User override from settings; the system preference is always respected too. */
  reduceMotion: boolean;
  performanceMode: boolean;
};

export type MotionState = {
  mode: MotionMode;
  webglScenes: boolean;
  pointerEffects: boolean;
  scrollScenes: boolean;
  sharedTransitions: boolean;
  grain: boolean;
  /** Multiplier applied to every depth token (0 = flat). */
  depthScale: number;
};

export const DEFAULT_MOTION_PREFERENCES: MotionPreferences = {
  intensity: "balanced",
  reduceMotion: false,
  performanceMode: false,
};

/** Used for SSR and the first client render, before capabilities are known. */
export const SERVER_MOTION_STATE: MotionState = {
  mode: "balanced",
  webglScenes: false,
  pointerEffects: false,
  scrollScenes: false,
  sharedTransitions: false,
  grain: false,
  depthScale: 1,
};

export const DESKTOP_MIN_WIDTH = 1024;

const FLAT: Omit<MotionState, "mode"> = {
  webglScenes: false,
  pointerEffects: false,
  scrollScenes: false,
  sharedTransitions: false,
  grain: false,
  depthScale: 0,
};

export function isLowEndDevice(capabilities: DeviceCapabilities): boolean {
  const lowMemory = capabilities.deviceMemory !== null && capabilities.deviceMemory <= 2;
  const lowCores = capabilities.hardwareConcurrency !== null && capabilities.hardwareConcurrency <= 2;
  return lowMemory || lowCores;
}

export function isDesktopClass(capabilities: DeviceCapabilities): boolean {
  return capabilities.finePointer && capabilities.hover && capabilities.viewportWidth >= DESKTOP_MIN_WIDTH;
}

export function resolveMotionState(capabilities: DeviceCapabilities, preferences: MotionPreferences): MotionState {
  if (preferences.performanceMode || isLowEndDevice(capabilities)) {
    return { mode: "static", ...FLAT };
  }
  if (capabilities.prefersReducedMotion || preferences.reduceMotion) {
    return { mode: "reduced", ...FLAT };
  }

  const desktop = isDesktopClass(capabilities);
  const webglAllowed = capabilities.webgl && desktop && !capabilities.saveData && preferences.intensity !== "low";
  const mode: MotionMode = preferences.intensity === "immersive" && webglAllowed ? "full" : "balanced";

  let depthScale = desktop ? 1 : 0.6;
  if (preferences.intensity === "low") depthScale = 0.5;
  if (mode === "full") depthScale = 1.25;

  return {
    mode,
    webglScenes: webglAllowed,
    pointerEffects: capabilities.finePointer && capabilities.hover,
    scrollScenes: true,
    sharedTransitions: true,
    grain: preferences.intensity !== "low" && !capabilities.saveData,
    depthScale,
  };
}
