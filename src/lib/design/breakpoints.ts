/** Canonical breakpoints — use in JS; CSS mirrors these in globals.css */
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
  ultrawide: 2560,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const VIEWPORT_TESTS = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "iphone-8", width: 375, height: 667 },
  { name: "iphone-x", width: 375, height: 812 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-14-max", width: 414, height: 896 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "ipad-air", width: 820, height: 1180 },
  { name: "ipad-pro", width: 1024, height: 1366 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "full-hd", width: 1920, height: 1080 },
  { name: "ultrawide", width: 2560, height: 1440 },
] as const;
