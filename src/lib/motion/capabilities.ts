import { DESKTOP_MIN_WIDTH, type DeviceCapabilities } from "./mode";

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

let webglSupport: boolean | null = null;

export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSupport = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Called when a scene's context is lost and cannot be restored, so later scenes use CSS. */
export function markWebGLUnavailable() {
  webglSupport = false;
}

export function detectCapabilities(): DeviceCapabilities {
  const nav = navigator as NavigatorHints;
  const match = (query: string) => window.matchMedia(query).matches;
  return {
    prefersReducedMotion: match("(prefers-reduced-motion: reduce)"),
    webgl: supportsWebGL(),
    finePointer: match("(pointer: fine)"),
    hover: match("(hover: hover)"),
    saveData: Boolean(nav.connection?.saveData),
    hardwareConcurrency: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    viewportWidth: window.innerWidth,
  };
}

const WATCHED_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(pointer: fine)",
  "(hover: hover)",
  `(min-width: ${DESKTOP_MIN_WIDTH}px)`,
];

export function watchCapabilities(onChange: () => void): () => void {
  const lists = WATCHED_QUERIES.map((query) => window.matchMedia(query));
  for (const list of lists) list.addEventListener("change", onChange);
  return () => {
    for (const list of lists) list.removeEventListener("change", onChange);
  };
}
