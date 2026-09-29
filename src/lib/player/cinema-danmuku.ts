import type { Danmu } from "artplayer-plugin-danmuku";

export type CinemaMode = "trailer" | "watch";

const TRAILER_LINES = [
  "🎬 lights down",
  "here we go",
  "that score though",
  "rewatch energy",
  "cinema mode: on",
  "FlutterFilms ✦",
  "goosebumps",
  "official trailer hype",
  "one more time",
  "theater kid activated",
  "chills at this part",
  "main character energy",
];

const WATCH_LINES = [
  "🍿 settled in",
  "no spoilers please",
  "FlutterFilms watch party",
  "pause for snack break",
  "this scene hits",
  "volume up",
  "authorized stream ✓",
  "rewind that",
  "late night watch",
  "comfort movie vibes",
  "don't skip the credits",
  "scene stealer incoming",
];

const ACCENT_COLORS = ["#5b9fd4", "#8ec5e8", "#c8dff0", "#ffffff", "#f4d58d"];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickLines(mode: CinemaMode, seed: number): string[] {
  const pool = mode === "trailer" ? TRAILER_LINES : WATCH_LINES;
  const picks: string[] = [];
  for (let i = 0; i < pool.length; i += 1) {
    const index = (seed + i * 17) % pool.length;
    picks.push(pool[index]);
  }
  return picks;
}

export function buildCinemaDanmuku(options: {
  mode: CinemaMode;
  movieId?: number;
  title?: string;
}): Danmu[] {
  const seed = options.movieId ?? hashSeed(options.title ?? "flutterfilms");
  const lines = pickLines(options.mode, seed);
  const span = options.mode === "trailer" ? 95 : 140;

  return lines.map((text, index) => {
    const time = 2 + ((seed + index * 11) % Math.max(span - 4, 1));
    const mode = index % 7 === 0 ? 1 : 0;
    return {
      text,
      time,
      mode,
      color: ACCENT_COLORS[(seed + index) % ACCENT_COLORS.length],
      border: index % 5 === 0,
    };
  });
}

export function buildCinemaHeatmap(options: {
  mode: CinemaMode;
  movieId?: number;
  title?: string;
}): { time: number; value: number }[] {
  const seed = options.movieId ?? hashSeed(options.title ?? "flutterfilms");
  const anchors = options.mode === "trailer" ? [8, 28, 52, 74] : [12, 36, 68, 102];

  return anchors.map((time, index) => ({
    time,
    value: 0.35 + ((seed + index * 13) % 60) / 100,
  }));
}
