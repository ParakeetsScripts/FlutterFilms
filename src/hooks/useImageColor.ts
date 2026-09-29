"use client";

import type { Rgb } from "@/lib/motion/color";
import { extractImageColor } from "@/lib/motion/color-client";
import { useEffect, useState } from "react";

/** Ambient tint for one image, sampled when the browser is idle and cached per session. */
export function useImageColor(url: string | null | undefined): Rgb | null {
  const [sample, setSample] = useState<{ url: string; color: Rgb | null } | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const run = () => {
      void extractImageColor(url).then((color) => {
        if (!cancelled) setSample({ url, color });
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }
    const timer = window.setTimeout(run, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [url]);

  return sample && sample.url === url ? sample.color : null;
}
