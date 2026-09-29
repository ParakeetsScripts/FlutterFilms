"use client";

import { registerAmbientElement } from "@/lib/motion/color-client";
import { useEffect, useRef } from "react";

/** Fixed atmosphere behind all content, plus the film-grain layer above it. Decorative only. */
export function AmbientField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerAmbientElement(ref.current);
    return () => registerAmbientElement(null);
  }, []);

  return (
    <>
      <div ref={ref} className="ambient-field" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
    </>
  );
}
