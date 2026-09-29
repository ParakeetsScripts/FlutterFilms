import { describe, expect, it } from "vitest";
import { dominantColor, rgbToHsl, toAmbient } from "./color";
import { invertTransform, isUsableRect, pushInRect, transformToCss } from "./flip";
import { resolveMotionState, type DeviceCapabilities, type MotionPreferences } from "./mode";
import {
  activeIndex,
  circularOffset,
  clamp01,
  wrapIndex,
  computeSceneProgress,
  progressChanged,
  railOffset,
  wallCardOffset,
  wallPinForCard,
} from "./progress";

const desktop: DeviceCapabilities = {
  prefersReducedMotion: false,
  webgl: true,
  finePointer: true,
  hover: true,
  saveData: false,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  viewportWidth: 1440,
};

const phone: DeviceCapabilities = { ...desktop, finePointer: false, hover: false, viewportWidth: 390 };

const balanced: MotionPreferences = { intensity: "balanced", reduceMotion: false, performanceMode: false };

describe("resolveMotionState", () => {
  it("gives capable desktops the balanced mode with WebGL scenes", () => {
    const state = resolveMotionState(desktop, balanced);
    expect(state.mode).toBe("balanced");
    expect(state.webglScenes).toBe(true);
    expect(state.pointerEffects).toBe(true);
    expect(state.depthScale).toBe(1);
  });

  it("only reaches full mode when immersive intensity meets a WebGL desktop", () => {
    expect(resolveMotionState(desktop, { ...balanced, intensity: "immersive" }).mode).toBe("full");
    expect(resolveMotionState({ ...desktop, webgl: false }, { ...balanced, intensity: "immersive" }).mode).toBe("balanced");
    expect(resolveMotionState(desktop, { ...balanced, intensity: "immersive" }).depthScale).toBe(1.25);
  });

  it("respects the system reduced-motion preference and the user override", () => {
    const system = resolveMotionState({ ...desktop, prefersReducedMotion: true }, balanced);
    const user = resolveMotionState(desktop, { ...balanced, reduceMotion: true });
    for (const state of [system, user]) {
      expect(state.mode).toBe("reduced");
      expect(state.scrollScenes).toBe(false);
      expect(state.webglScenes).toBe(false);
      expect(state.sharedTransitions).toBe(false);
      expect(state.depthScale).toBe(0);
    }
  });

  it("drops to static for performance mode and low-end hardware", () => {
    expect(resolveMotionState(desktop, { ...balanced, performanceMode: true }).mode).toBe("static");
    expect(resolveMotionState({ ...desktop, deviceMemory: 2 }, balanced).mode).toBe("static");
    expect(resolveMotionState({ ...desktop, hardwareConcurrency: 2 }, balanced).mode).toBe("static");
  });

  it("keeps phones in a lighter balanced mode without WebGL or pointer effects", () => {
    const state = resolveMotionState(phone, balanced);
    expect(state.mode).toBe("balanced");
    expect(state.webglScenes).toBe(false);
    expect(state.pointerEffects).toBe(false);
    expect(state.scrollScenes).toBe(true);
    expect(state.depthScale).toBeLessThan(1);
  });

  it("skips WebGL and grain for data-saver and low intensity", () => {
    expect(resolveMotionState({ ...desktop, saveData: true }, balanced)).toMatchObject({ webglScenes: false, grain: false });
    expect(resolveMotionState(desktop, { ...balanced, intensity: "low" })).toMatchObject({
      webglScenes: false,
      grain: false,
      depthScale: 0.5,
    });
  });
});

describe("computeSceneProgress", () => {
  const vh = 800;

  it("reports before/after outside the viewport", () => {
    expect(computeSceneProgress({ top: 900, height: 400 }, vh).phase).toBe("before");
    expect(computeSceneProgress({ top: -500, height: 400 }, vh).phase).toBe("after");
  });

  it("walks a short scene through enter → active → exit", () => {
    const entering = computeSceneProgress({ top: 600, height: 400 }, vh);
    expect(entering.phase).toBe("enter");
    expect(entering.enter).toBeCloseTo(0.5);

    const active = computeSceneProgress({ top: 200, height: 400 }, vh);
    expect(active.phase).toBe("active");
    expect(active.enter).toBe(1);
    expect(active.exit).toBe(0);

    const exiting = computeSceneProgress({ top: -200, height: 400 }, vh);
    expect(exiting.phase).toBe("exit");
    expect(exiting.exit).toBeCloseTo(0.5);
  });

  it("measures pin progress for scenes taller than the viewport", () => {
    const tall = { height: 1600 };
    expect(computeSceneProgress({ ...tall, top: 0 }, vh).pin).toBe(0);
    expect(computeSceneProgress({ ...tall, top: -400 }, vh).pin).toBeCloseTo(0.5);
    expect(computeSceneProgress({ ...tall, top: -800 }, vh).pin).toBe(1);
    expect(computeSceneProgress({ ...tall, top: -400 }, vh).phase).toBe("active");
  });

  it("keeps overall progress monotonic from 0 to 1", () => {
    expect(computeSceneProgress({ top: vh, height: 400 }, vh).progress).toBe(0);
    expect(computeSceneProgress({ top: -400, height: 400 }, vh).progress).toBe(1);
  });

  it("ignores sub-epsilon changes so styles are not rewritten needlessly", () => {
    const a = computeSceneProgress({ top: 100, height: 400 }, vh);
    const b = computeSceneProgress({ top: 100.1, height: 400 }, vh);
    expect(progressChanged(a, b)).toBe(false);
    expect(progressChanged(null, a)).toBe(true);
  });

  it("clamps non-finite input safely", () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(4)).toBe(1);
  });
});

describe("chapter and rail geometry", () => {
  it("finds the chapter crossing the focal line", () => {
    const rects = [
      { top: -900, height: 800 },
      { top: -100, height: 800 },
      { top: 700, height: 800 },
    ];
    expect(activeIndex(rects, 800)).toBe(1);
    expect(activeIndex([{ top: 500, height: 100 }], 800)).toBe(-1);
  });

  it("normalizes rail offsets to [-1, 1]", () => {
    expect(railOffset(500, 500, 400)).toBe(0);
    expect(railOffset(900, 500, 400)).toBe(1);
    expect(railOffset(-2000, 500, 400)).toBe(-1);
    expect(railOffset(500, 500, 0)).toBe(0);
  });

  it("computes shortest ring distances for the portal carousel", () => {
    expect(circularOffset(0, 0, 10)).toBe(0);
    expect(circularOffset(1, 0, 10)).toBe(1);
    expect(circularOffset(9, 0, 10)).toBe(-1);
    expect(circularOffset(0, 9, 10)).toBe(1);
    expect(wrapIndex(-1, 10)).toBe(9);
    expect(wrapIndex(10, 10)).toBe(0);
  });

  it("centers wall cards at the pin that the controls scroll to", () => {
    const geometry = { cardWidth: 240, gap: 32, paddingLeft: 64, distance: 1800, viewportWidth: 1280 };
    const pin = wallPinForCard(5, geometry);
    expect(wallCardOffset(5, pin, geometry)).toBeCloseTo(0);
    expect(wallPinForCard(0, geometry)).toBe(0);
    expect(wallPinForCard(0, { ...geometry, distance: 0 })).toBe(0);
  });
});

describe("FLIP math", () => {
  it("inverts a destination rect back onto its source", () => {
    const from = { left: 100, top: 200, width: 150, height: 225 };
    const to = { left: 400, top: 120, width: 300, height: 450 };
    const t = invertTransform(from, to);
    expect(t).toEqual({ x: -300, y: 80, scaleX: 0.5, scaleY: 0.5 });
    expect(to.left + t.x).toBe(from.left);
    expect(to.width * t.scaleX).toBe(from.width);
    expect(transformToCss(t)).toBe("translate3d(-300px, 80px, 0) scale(0.5, 0.5)");
  });

  it("pushes in toward the viewport center while keeping the poster aspect", () => {
    const rect = pushInRect({ left: 0, top: 0, width: 200, height: 300 }, { width: 1400, height: 900 });
    expect(rect.width / rect.height).toBeCloseTo(2 / 3);
    expect(rect.left + rect.width / 2).toBeCloseTo(700);
    expect(rect.top + rect.height / 2).toBeCloseTo(450);
  });

  it("rejects collapsed or non-finite rects", () => {
    expect(isUsableRect({ left: 0, top: 0, width: 0, height: 10 })).toBe(false);
    expect(isUsableRect({ left: Number.NaN, top: 0, width: 10, height: 10 })).toBe(false);
    expect(isUsableRect(null)).toBe(false);
  });
});

function solid(r: number, g: number, b: number, count = 16, alpha = 255): number[] {
  return Array.from({ length: count }).flatMap(() => [r, g, b, alpha]);
}

describe("ambient color extraction", () => {
  it("returns null for fully transparent images", () => {
    expect(dominantColor(solid(200, 20, 20, 8, 0))).toBeNull();
  });

  it("recovers a solid color", () => {
    expect(dominantColor(solid(200, 40, 40))).toEqual({ r: 200, g: 40, b: 40 });
  });

  it("lets a small saturated area outweigh a large neutral one", () => {
    const pixels = [...solid(128, 128, 128, 90), ...solid(30, 90, 220, 10)];
    const color = dominantColor(pixels)!;
    expect(color.b).toBeGreaterThan(color.r);
  });

  it("clamps ambient lightness and keeps grays neutral", () => {
    const ambient = toAmbient({ r: 250, g: 20, b: 20 });
    const { l } = rgbToHsl(ambient);
    expect(l).toBeGreaterThanOrEqual(0.37);
    expect(l).toBeLessThanOrEqual(0.56);
    expect(rgbToHsl(toAmbient({ r: 120, g: 120, b: 120 })).s).toBeLessThan(0.08);
  });
});
