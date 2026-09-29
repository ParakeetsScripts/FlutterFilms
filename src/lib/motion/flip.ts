export type Rect = { left: number; top: number; width: number; height: number };

export type FlipTransform = { x: number; y: number; scaleX: number; scaleY: number };

export const IDENTITY_TRANSFORM: FlipTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };

export function isUsableRect(rect: Rect | null | undefined): rect is Rect {
  if (!rect) return false;
  return [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) && rect.width > 1 && rect.height > 1;
}

/**
 * Transform (with `transform-origin: 0 0`) that makes an element laid out at `to`
 * appear exactly at `from`. Animating from this to identity is the FLIP "invert → play".
 */
export function invertTransform(from: Rect, to: Rect): FlipTransform {
  return {
    x: from.left - to.left,
    y: from.top - to.top,
    scaleX: to.width ? from.width / to.width : 1,
    scaleY: to.height ? from.height / to.height : 1,
  };
}

export function transformToCss(transform: FlipTransform): string {
  return `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX}, ${transform.scaleY})`;
}

/**
 * Provisional landing spot while the destination route renders: the poster pushes in
 * toward the viewport center, keeping its aspect ratio.
 */
export function pushInRect(source: Rect, viewport: { width: number; height: number }, heightFraction = 0.56): Rect {
  const aspect = source.width / source.height || 2 / 3;
  const height = Math.min(viewport.height * heightFraction, (viewport.width * 0.7) / aspect);
  const width = height * aspect;
  return {
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
    width,
    height,
  };
}

export function rectIntersectsViewport(rect: Rect, viewport: { width: number; height: number }): boolean {
  return rect.left < viewport.width && rect.top < viewport.height && rect.left + rect.width > 0 && rect.top + rect.height > 0;
}
