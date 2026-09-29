import fs from "node:fs";
import path from "node:path";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

export function mediaRoot(): string {
  const configured = process.env.MEDIA_STORAGE_PATH?.trim();
  const root = configured ? path.resolve(configured) : path.join(process.cwd(), ".data", "media");
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export function uploadTempRoot(): string {
  const root = path.join(mediaRoot(), "uploads");
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export function assetRoot(assetId: string): string {
  const root = path.join(mediaRoot(), "assets", assetId);
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export function defaultChunkSize(): number {
  const parsed = Number(process.env.MEDIA_CHUNK_SIZE_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CHUNK_SIZE;
}

export function safeJoin(base: string, relative: string): string | null {
  const resolved = path.resolve(base, relative);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}
