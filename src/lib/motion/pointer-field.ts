import { damp } from "./progress";

export type PointerListener = (x: number, y: number) => void;

/**
 * Normalized, inertia-smoothed pointer position in [-1, 1]. Writes `--px` / `--py` only on
 * registered elements, and stops its rAF loop as soon as the value settles.
 */
class PointerField {
  private targets = new Set<HTMLElement>();
  private listeners = new Set<PointerListener>();
  private x = 0;
  private y = 0;
  private targetX = 0;
  private targetY = 0;
  private frame = 0;
  private lastTime = 0;
  private enabled = false;

  enable() {
    if (this.enabled || typeof window === "undefined") return;
    this.enabled = true;
    window.addEventListener("pointermove", this.onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener("pointermove", this.onMove);
    document.documentElement.removeEventListener("pointerleave", this.onLeave);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.x = this.y = this.targetX = this.targetY = 0;
    for (const el of this.targets) this.clear(el);
    for (const listener of this.listeners) listener(0, 0);
  }

  register(el: HTMLElement): () => void {
    this.targets.add(el);
    if (this.enabled) this.write(el);
    return () => {
      this.targets.delete(el);
      this.clear(el);
    };
  }

  subscribe(listener: PointerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    this.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    this.schedule();
  };

  private onLeave = () => {
    this.targetX = 0;
    this.targetY = 0;
    this.schedule();
  };

  private schedule() {
    if (this.frame) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.frame = 0;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.x = damp(this.x, this.targetX, 7, dt);
    this.y = damp(this.y, this.targetY, 7, dt);
    const settled = Math.abs(this.x - this.targetX) < 0.001 && Math.abs(this.y - this.targetY) < 0.001;
    if (settled) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
    for (const el of this.targets) this.write(el);
    for (const listener of this.listeners) listener(this.x, this.y);
    if (!settled) this.frame = requestAnimationFrame(this.tick);
  };

  private write(el: HTMLElement) {
    el.style.setProperty("--px", this.x.toFixed(3));
    el.style.setProperty("--py", this.y.toFixed(3));
  }

  private clear(el: HTMLElement) {
    el.style.removeProperty("--px");
    el.style.removeProperty("--py");
  }
}

let field: PointerField | null = null;

export function getPointerField(): PointerField {
  if (!field) field = new PointerField();
  return field;
}
