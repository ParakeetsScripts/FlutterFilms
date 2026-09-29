"use client";

import type { SceneProgress } from "@/lib/motion/progress";
import { getPointerField } from "@/lib/motion/pointer-field";
import { getScrollEngine } from "@/lib/motion/scroll-engine";
import { useEffect, useEffectEvent, useRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";

type SceneTag = "section" | "div" | "header" | "footer" | "article";

export type SceneChapter = { index: number; label: string };

export type CinematicSceneProps = Omit<HTMLAttributes<HTMLElement>, "id"> & {
  id: string;
  as?: SceneTag;
  chapter?: SceneChapter;
  sceneRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

/**
 * A scroll scene: registers with the scroll engine, which writes `--scene-progress`,
 * `--scene-enter`, `--scene-exit`, `--scene-pin`, and `data-scene-phase` on this element.
 * CSS consumes those; JS consumers subscribe with `useSceneProgress`.
 */
export function CinematicScene({ id, as: Tag = "section", chapter, sceneRef, className, children, ...rest }: CinematicSceneProps) {
  const ownRef = useRef<HTMLElement | null>(null);
  const ref = sceneRef ?? ownRef;
  const chapterIndex = chapter?.index;
  const chapterLabel = chapter?.label;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const registration = chapterIndex !== undefined && chapterLabel ? { index: chapterIndex, label: chapterLabel } : undefined;
    return getScrollEngine().register(el, { id, chapter: registration });
  }, [ref, id, chapterIndex, chapterLabel]);

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      id={id}
      data-scene={id}
      className={className ? `cine-scene ${className}` : "cine-scene"}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Subscribe to a scene's progress without re-rendering React on every frame. */
export function useSceneProgress(ref: RefObject<HTMLElement | null>, onProgress: (progress: SceneProgress) => void) {
  const handle = useEffectEvent(onProgress);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return getScrollEngine().subscribe(el, (progress) => handle(progress));
  }, [ref]);
}

/** Opt an element into `--px` / `--py` pointer parallax variables. */
export function usePointerTarget(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return getPointerField().register(el);
  }, [ref, enabled]);
}
