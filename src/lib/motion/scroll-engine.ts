import { activeIndex, computeSceneProgress, progressChanged, roundTo, type SceneProgress, type VerticalRect } from "./progress";

export type SceneListener = (progress: SceneProgress) => void;

export type ChapterInfo = { id: string; index: number; label: string };

export type ChapterSnapshot = { chapters: ChapterInfo[]; activeId: string | null };

export const EMPTY_CHAPTERS: ChapterSnapshot = { chapters: [], activeId: null };

type SceneEntry = {
  id: string;
  el: HTMLElement;
  chapter?: { index: number; label: string };
  near: boolean;
  rect: VerticalRect | null;
  last: SceneProgress | null;
};

const SCENE_VARS = ["--scene-progress", "--scene-enter", "--scene-exit", "--scene-pin"] as const;

/**
 * The only writer of `--scene-*` custom properties. One rAF per scroll/resize burst:
 * every rect is read first, then styles are written, so there is no layout thrash.
 * Variables live on scene elements (never `:root`) to keep style recalculation local.
 */
class ScrollEngine {
  private entries = new Map<HTMLElement, SceneEntry>();
  private listeners = new Map<HTMLElement, Set<SceneListener>>();
  private chapterListeners = new Set<() => void>();
  private chapterSnapshot: ChapterSnapshot = EMPTY_CHAPTERS;
  private intersection: IntersectionObserver | null = null;
  private resize: ResizeObserver | null = null;
  private frame = 0;
  private running = false;
  private writeVars = true;
  private activeChapter: string | null = null;

  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.intersection = new IntersectionObserver(this.onIntersect, { rootMargin: "75% 0px 75% 0px" });
    this.resize = new ResizeObserver(this.schedule);
    for (const entry of this.entries.values()) this.observe(entry.el);
    window.addEventListener("scroll", this.schedule, { passive: true });
    window.addEventListener("resize", this.schedule, { passive: true });
    this.schedule();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener("scroll", this.schedule);
    window.removeEventListener("resize", this.schedule);
    this.intersection?.disconnect();
    this.resize?.disconnect();
    this.intersection = null;
    this.resize = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const entry of this.entries.values()) {
      this.clearVars(entry);
      entry.last = null;
    }
  }

  /** In reduced/static modes scenes still report phase (for chapters), but stop driving transforms. */
  configure(options: { writeVars: boolean }) {
    if (this.writeVars === options.writeVars) return;
    this.writeVars = options.writeVars;
    for (const entry of this.entries.values()) {
      if (!this.writeVars) this.clearVars(entry);
      entry.last = null;
    }
    this.schedule();
  }

  register(el: HTMLElement, options: { id: string; chapter?: { index: number; label: string } }): () => void {
    const entry: SceneEntry = { id: options.id, el, chapter: options.chapter, near: true, rect: null, last: null };
    this.entries.set(el, entry);
    if (this.running) this.observe(el);
    this.notifyChapters();
    this.schedule();
    return () => {
      this.intersection?.unobserve(el);
      this.resize?.unobserve(el);
      this.clearVars(entry);
      delete el.dataset.scenePhase;
      this.entries.delete(el);
      this.notifyChapters();
    };
  }

  /** Listeners may subscribe before their scene registers (child effects run first). */
  subscribe(el: HTMLElement, listener: SceneListener): () => void {
    let set = this.listeners.get(el);
    if (!set) {
      set = new Set();
      this.listeners.set(el, set);
    }
    set.add(listener);
    const last = this.entries.get(el)?.last;
    if (last) listener(last);
    this.schedule();
    return () => {
      set.delete(listener);
      if (!set.size) this.listeners.delete(el);
    };
  }

  subscribeChapters = (listener: () => void): (() => void) => {
    this.chapterListeners.add(listener);
    return () => {
      this.chapterListeners.delete(listener);
    };
  };

  getChapterSnapshot = (): ChapterSnapshot => this.chapterSnapshot;

  current(el: HTMLElement): SceneProgress | null {
    return this.entries.get(el)?.last ?? null;
  }

  snapshot(): Array<{ id: string; progress: SceneProgress | null }> {
    return [...this.entries.values()].map((entry) => ({ id: entry.id, progress: entry.last }));
  }

  private observe(el: HTMLElement) {
    this.intersection?.observe(el);
    this.resize?.observe(el);
  }

  private chapters(): ChapterInfo[] {
    return [...this.entries.values()]
      .filter((entry): entry is SceneEntry & { chapter: { index: number; label: string } } => Boolean(entry.chapter))
      .map((entry) => ({ id: entry.id, index: entry.chapter.index, label: entry.chapter.label }))
      .sort((a, b) => a.index - b.index);
  }

  private notifyChapters() {
    this.chapterSnapshot = { chapters: this.chapters(), activeId: this.activeChapter };
    for (const listener of this.chapterListeners) listener();
  }

  private onIntersect = (records: IntersectionObserverEntry[]) => {
    for (const record of records) {
      const entry = this.entries.get(record.target as HTMLElement);
      if (entry) entry.near = record.isIntersecting;
    }
    this.schedule();
  };

  private schedule = () => {
    if (!this.running || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = () => {
    this.frame = 0;
    const viewportHeight = window.innerHeight;

    const measured: SceneEntry[] = [];
    for (const entry of this.entries.values()) {
      if (!entry.near && entry.last) continue;
      const rect = entry.el.getBoundingClientRect();
      entry.rect = { top: rect.top, height: rect.height };
      measured.push(entry);
    }

    for (const entry of measured) {
      const next = computeSceneProgress(entry.rect!, viewportHeight);
      if (!progressChanged(entry.last, next)) continue;
      const phaseChanged = entry.last?.phase !== next.phase;
      entry.last = next;
      if (this.writeVars) this.writeSceneVars(entry.el, next);
      if (phaseChanged) entry.el.dataset.scenePhase = next.phase;
      const listeners = this.listeners.get(entry.el);
      if (listeners) for (const listener of listeners) listener(next);
    }

    const chapterEntries = measured.filter((entry) => entry.chapter);
    const index = activeIndex(chapterEntries.map((entry) => entry.rect!), viewportHeight);
    const nextActive = index >= 0 ? chapterEntries[index].id : null;
    if (nextActive !== this.activeChapter) {
      this.activeChapter = nextActive;
      this.notifyChapters();
    }
  };

  private writeSceneVars(el: HTMLElement, progress: SceneProgress) {
    const style = el.style;
    style.setProperty("--scene-progress", String(roundTo(progress.progress)));
    style.setProperty("--scene-enter", String(roundTo(progress.enter)));
    style.setProperty("--scene-exit", String(roundTo(progress.exit)));
    style.setProperty("--scene-pin", String(roundTo(progress.pin)));
  }

  private clearVars(entry: SceneEntry) {
    for (const name of SCENE_VARS) entry.el.style.removeProperty(name);
  }
}

let engine: ScrollEngine | null = null;

export function getScrollEngine(): ScrollEngine {
  if (!engine) engine = new ScrollEngine();
  return engine;
}

export type { ScrollEngine };
