"use client";

type ArtplayerModule = typeof import("artplayer");
type DanmukuModule = typeof import("artplayer-plugin-danmuku");
type HlsModule = typeof import("hls.js");

export type ArtplayerInstance = InstanceType<ArtplayerModule["default"]>;
export type ArtplayerConstructor = ArtplayerModule["default"];

export async function loadArtplayer(): Promise<ArtplayerConstructor> {
  const module = await import("artplayer");
  return module.default;
}

export async function loadDanmukuPlugin(): Promise<DanmukuModule["default"]> {
  const module = await import("artplayer-plugin-danmuku");
  return module.default;
}

export async function loadHls(): Promise<HlsModule["default"]> {
  const module = await import("hls.js");
  return module.default;
}
