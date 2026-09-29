export type ScenePhase = "before" | "enter" | "active" | "exit" | "after";

export type SceneProgress = {
  /** 0 when the scene's top meets the viewport bottom, 1 when its bottom meets the viewport top. */
  progress: number;
  /** 0 → 1 while the scene moves into full view. */
  enter: number;
  /** 0 → 1 while the scene leaves the viewport. */
  exit: number;
  /** 0 → 1 while a scene taller than the viewport is pinned (top ≤ 0 and bottom ≥ viewport). */
  pin: number;
  phase: ScenePhase;
};

export type VerticalRect = { top: number; height: number };

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value <= 0 ? 0 : value > 1 ? 1 : value;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function computeSceneProgress(rect: VerticalRect, viewportHeight: number): SceneProgress {
  const vh = Math.max(1, viewportHeight);
  const height = Math.max(1, rect.height);
  const top = rect.top;
  const bottom = top + height;
  const span = Math.min(vh, height);

  const progress = clamp01((vh - top) / (vh + height));
  const enter = clamp01((vh - top) / span);
  const exit = clamp01((span - bottom) / span);
  const pin = height > vh ? clamp01(-top / (height - vh)) : 0;

  let phase: ScenePhase;
  if (top >= vh) phase = "before";
  else if (bottom <= 0) phase = "after";
  else if (enter < 1) phase = "enter";
  else if (exit > 0) phase = "exit";
  else phase = "active";

  return { progress, enter, exit, pin, phase };
}

export function progressChanged(previous: SceneProgress | null, next: SceneProgress, epsilon = 0.0005): boolean {
  if (!previous) return true;
  return (
    previous.phase !== next.phase ||
    Math.abs(previous.progress - next.progress) > epsilon ||
    Math.abs(previous.enter - next.enter) > epsilon ||
    Math.abs(previous.exit - next.exit) > epsilon ||
    Math.abs(previous.pin - next.pin) > epsilon
  );
}

/** Index of the rect crossing the focal line (a fraction of viewport height), or -1. */
export function activeIndex(rects: VerticalRect[], viewportHeight: number, focal = 0.45): number {
  const line = viewportHeight * focal;
  return rects.findIndex((rect) => rect.top <= line && rect.top + rect.height > line);
}

/** Signed distance of an item's center from the viewport center, normalized to [-1, 1]. */
export function railOffset(itemCenter: number, viewportCenter: number, halfWidth: number): number {
  if (halfWidth <= 0) return 0;
  return clamp((itemCenter - viewportCenter) / halfWidth, -1, 1);
}

/** Shortest signed distance from `active` to `index` on a ring of `count` items. */
export function circularOffset(index: number, active: number, count: number): number {
  if (count <= 0) return 0;
  let offset = (index - active) % count;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;
  return offset;
}

export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export type WallGeometry = {
  cardWidth: number;
  gap: number;
  paddingLeft: number;
  distance: number;
  viewportWidth: number;
};

export function wallCardCenter(index: number, geometry: WallGeometry): number {
  return geometry.paddingLeft + index * (geometry.cardWidth + geometry.gap) + geometry.cardWidth / 2;
}

/** Where a wall card sits relative to the viewport center once the track is translated by `pin * distance`. */
export function wallCardOffset(index: number, pin: number, geometry: WallGeometry): number {
  const center = wallCardCenter(index, geometry) - pin * geometry.distance;
  return railOffset(center, geometry.viewportWidth / 2, geometry.viewportWidth / 2);
}

/** Pin progress that centers a card, used for keyboard focus and prev/next controls. */
export function wallPinForCard(index: number, geometry: WallGeometry): number {
  if (geometry.distance <= 0) return 0;
  return clamp01((wallCardCenter(index, geometry) - geometry.viewportWidth / 2) / geometry.distance);
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dtSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dtSeconds));
}
