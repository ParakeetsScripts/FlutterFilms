"use client";

import { EMPTY_CHAPTERS, getScrollEngine } from "@/lib/motion/scroll-engine";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  return getScrollEngine().subscribeChapters(listener);
}

function getSnapshot() {
  return getScrollEngine().getChapterSnapshot();
}

export function ChapterIndex({ label = "Page chapters" }: { label?: string }) {
  const { chapters, activeId } = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CHAPTERS);
  if (chapters.length < 2) return null;

  return (
    <nav className="chapter-index" aria-label={label}>
      <ol className="chapter-index__list">
        {chapters.map((chapter) => {
          const active = chapter.id === activeId;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                className={`chapter-index__link ${active ? "is-active" : ""}`}
                aria-current={active ? "location" : undefined}
              >
                <span className="chapter-index__num">{String(chapter.index).padStart(2, "0")}</span>
                <span className="chapter-index__label">{chapter.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
