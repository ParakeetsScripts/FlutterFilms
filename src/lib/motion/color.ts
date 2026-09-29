export type Rgb = { r: number; g: number; b: number };

type Hsl = { h: number; s: number; l: number };

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

function hueToChannel(p: number, q: number, t: number): number {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, h) * 255),
    b: Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Saturation-weighted average of RGBA pixels. Mid-luminance, saturated pixels dominate,
 * so a mostly-dark poster with a strong blue sky reads as blue rather than black.
 */
export function dominantColor(pixels: ArrayLike<number>): Rgb | null {
  let wr = 0;
  let wg = 0;
  let wb = 0;
  let total = 0;
  let opaque = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const pixel = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
    const { s, l } = rgbToHsl(pixel);
    opaque += 1;
    const weight = (0.05 + s * s) * (1 - Math.min(1, Math.abs(l - 0.5) * 1.6));
    if (weight <= 0) continue;
    wr += pixel.r * weight;
    wg += pixel.g * weight;
    wb += pixel.b * weight;
    total += weight;
  }

  if (!opaque || total <= 0) return null;
  return { r: Math.round(wr / total), g: Math.round(wg / total), b: Math.round(wb / total) };
}

/** Clamp an extracted color into a band that tints the room without hurting text contrast. */
export function toAmbient(color: Rgb): Rgb {
  const { h, s, l } = rgbToHsl(color);
  const saturation = s < 0.08 ? s : Math.min(0.55, Math.max(0.18, s));
  const lightness = Math.min(0.55, Math.max(0.38, l));
  return hslToRgb({ h, s: saturation, l: lightness });
}

export function rgbTriplet(color: Rgb): string {
  return `${color.r} ${color.g} ${color.b}`;
}
