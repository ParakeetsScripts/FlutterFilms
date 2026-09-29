import { dominantColor, rgbTriplet, toAmbient, type Rgb } from "./color";

const memory = new Map<string, Rgb | null>();
const inflight = new Map<string, Promise<Rgb | null>>();
const STORAGE_PREFIX = "ff.color:";
const SAMPLE_WIDTH = 24;
const SAMPLE_HEIGHT = 36;

function readStored(url: string): Rgb | null | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + url);
    if (raw === null) return undefined;
    return raw === "none" ? null : (JSON.parse(raw) as Rgb);
  } catch {
    return undefined;
  }
}

function writeStored(url: string, color: Rgb | null) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + url, color ? JSON.stringify(color) : "none");
  } catch {
    // Storage full or disabled — the in-memory cache still applies.
  }
}

function sample(url: string): Promise<Rgb | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_WIDTH;
        canvas.height = SAMPLE_HEIGHT;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const color = dominantColor(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data);
        resolve(color ? toAmbient(color) : null);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/** Extracts an ambient tint once per image URL; results are cached for the session. */
export function extractImageColor(url: string): Promise<Rgb | null> {
  if (memory.has(url)) return Promise.resolve(memory.get(url) ?? null);
  const stored = readStored(url);
  if (stored !== undefined) {
    memory.set(url, stored);
    return Promise.resolve(stored);
  }
  const pending = inflight.get(url);
  if (pending) return pending;
  const task = sample(url).then((color) => {
    memory.set(url, color);
    writeStored(url, color);
    inflight.delete(url);
    return color;
  });
  inflight.set(url, task);
  return task;
}

let ambientElement: HTMLElement | null = null;
let ambientOwner: symbol | null = null;

export function registerAmbientElement(el: HTMLElement | null) {
  ambientElement = el;
}

/** The page ambient field is tinted by at most one owner (the active hero) at a time. */
export function setAmbientColor(color: Rgb | null, owner: symbol) {
  if (!ambientElement) return;
  if (color) {
    ambientOwner = owner;
    ambientElement.style.setProperty("--ambient-tint", `rgb(${rgbTriplet(color)} / 0.2)`);
  } else if (ambientOwner === owner) {
    ambientOwner = null;
    ambientElement.style.removeProperty("--ambient-tint");
  }
}
