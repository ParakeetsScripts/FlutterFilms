import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  WebGLRenderer,
  type Material,
  type Texture,
} from "three";
import { clamp01, damp, easeInOutCubic } from "@/lib/motion/progress";

export type PosterHallOptions = {
  canvas: HTMLCanvasElement;
  posterUrls: string[];
  /** CSS colour of the page base, used for fog so posters dissolve into the room. */
  background: string;
  animateDust: boolean;
  maxPixelRatio: number;
  onReady: () => void;
  onContextLost: () => void;
};

type Print = {
  material: MeshBasicMaterial;
  reflection: MeshBasicMaterial;
  loadedAt: number | null;
};

const POSTER_WIDTH = 1.5;
const POSTER_HEIGHT = 2.25;
const ARC_RADIUS = 9;
const FLOOR_Y = -1.75;
const DUST_COUNT = 240;
const TEXTURE_FADE_MS = 700;
const DUST_FRAME_INTERVAL = 1 / 30;

/** Deterministic PRNG so the hall composes identically on every visit. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(draw: (context: CanvasRenderingContext2D, size: number) => void, size = 256): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) draw(context, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A projection hall: real catalog posters on a concave arc, a polished floor that catches
 * faint reflections, a soft projector glow and settled dust. The camera dollies back as
 * the hero scene's pin progress goes 0 → 1.
 */
export class PosterHallRenderer {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(42, 1, 0.1, 60);
  private fog: Fog;
  private prints: Print[] = [];
  private dust: Points | null = null;
  private owned: Array<{ dispose: () => void }> = [];
  private resizeObserver: ResizeObserver;
  private frame = 0;
  private running = false;
  private disposed = false;
  private readyFired = false;
  /** Resizing clears the drawing buffer, so a settled scene still needs one frame. */
  private dirty = true;
  private lastTime = 0;
  private dustClock = 0;
  private progress = 0;
  private targetProgress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private targetPointerX = 0;
  private targetPointerY = 0;
  private focus = 0;
  private targetFocus = 0;

  constructor(private options: PosterHallOptions) {
    const { canvas } = options;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxPixelRatio));
    this.renderer.setClearColor(0x000000, 0);

    this.fog = new Fog(new Color(options.background), 4, 12);
    this.scene.fog = this.fog;

    this.buildPrints();
    this.buildFloor();
    this.buildProjectorGlow();
    this.buildDust();

    canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  start() {
    this.running = true;
    this.dirty = true;
    this.wake();
  }

  suspend() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  setProgress(value: number) {
    this.targetProgress = clamp01(value);
    this.wake();
  }

  setPointer(x: number, y: number) {
    this.targetPointerX = x;
    this.targetPointerY = y;
    this.wake();
  }

  setFocus(value: number) {
    this.targetFocus = clamp01(value);
    this.wake();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.suspend();
    this.resizeObserver.disconnect();
    this.options.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Points) {
        object.geometry.dispose();
        const material = object.material as Material | Material[];
        for (const item of Array.isArray(material) ? material : [material]) item.dispose();
      }
    });
    for (const resource of this.owned) resource.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private buildPrints() {
    const posterGeometry = new PlaneGeometry(POSTER_WIDTH, POSTER_HEIGHT);
    const frameGeometry = new PlaneGeometry(POSTER_WIDTH * 1.04, POSTER_HEIGHT * 1.03);
    const reflectionFade = canvasTexture((context, size) => {
      const gradient = context.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.55, "rgba(255,255,255,0)");
      gradient.addColorStop(1, "rgba(255,255,255,0.5)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    });
    this.owned.push(reflectionFade);

    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    const random = seeded(7);
    const count = this.options.posterUrls.length;
    const span = Math.min(Math.PI * 0.62, Math.max(0.35, count * 0.2));

    this.options.posterUrls.forEach((url, index) => {
      const t = count === 1 ? 0 : index / (count - 1) - 0.5;
      const angle = t * span;
      const lift = (random() - 0.5) * 0.35 + 0.15;

      const group = new Group();
      group.position.set(Math.sin(angle) * ARC_RADIUS, lift, -Math.cos(angle) * ARC_RADIUS + ARC_RADIUS * 0.3);
      group.rotation.y = -angle;

      const material = new MeshBasicMaterial({ color: 0x1a1c22, transparent: true, opacity: 0 });
      group.add(new Mesh(posterGeometry, material));

      const frame = new Mesh(frameGeometry, new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 }));
      frame.position.z = -0.02;
      group.add(frame);

      const reflection = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        alphaMap: reflectionFade,
        depthWrite: false,
      });
      const mirror = new Mesh(posterGeometry, reflection);
      mirror.position.y = 2 * (FLOOR_Y - lift);
      mirror.scale.y = -1;
      group.add(mirror);

      this.scene.add(group);
      const print: Print = { material, reflection, loadedAt: null };
      this.prints.push(print);

      loader.load(url, (texture: Texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        material.map = texture;
        material.needsUpdate = true;
        reflection.map = texture;
        reflection.needsUpdate = true;
        this.owned.push(texture);
        print.loadedAt = performance.now();
        this.dirty = true;
        this.wake();
      });
    });
  }

  private buildFloor() {
    const glow = canvasTexture((context, size) => {
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, "rgba(170,188,215,0.18)");
      gradient.addColorStop(0.45, "rgba(120,140,170,0.05)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    });
    this.owned.push(glow);
    const floor = new Mesh(new PlaneGeometry(26, 26), new MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, -4);
    this.scene.add(floor);
  }

  private buildProjectorGlow() {
    const beam = canvasTexture((context, size) => {
      const gradient = context.createRadialGradient(size / 2, size * 0.35, 0, size / 2, size * 0.35, size / 2);
      gradient.addColorStop(0, "rgba(210,220,240,0.35)");
      gradient.addColorStop(0.4, "rgba(150,170,210,0.08)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    });
    this.owned.push(beam);
    const glow = new Mesh(
      new PlaneGeometry(20, 12),
      new MeshBasicMaterial({ map: beam, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false, opacity: 0.6 }),
    );
    glow.position.set(0, 2.6, -13);
    this.scene.add(glow);
  }

  private buildDust() {
    const random = seeded(42);
    const positions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i += 1) {
      positions[i * 3] = (random() - 0.5) * 18;
      positions[i * 3 + 1] = random() * 5 - 1.5;
      positions[i * 3 + 2] = -random() * 14 + 2;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    this.dust = new Points(
      geometry,
      new PointsMaterial({
        color: 0xd6dcea,
        size: 0.028,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    this.scene.add(this.dust);
  }

  private resize() {
    const { clientWidth, clientHeight } = this.options.canvas;
    if (!clientWidth || !clientHeight) return;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.wake();
  }

  private wake() {
    if (!this.running || this.frame || this.disposed) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.frame = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;

    const settling = this.update(dt, now);
    const dustDue = this.options.animateDust && (this.dustClock += dt) >= DUST_FRAME_INTERVAL;
    if (settling || dustDue || this.dirty) {
      if (dustDue) this.dustClock = 0;
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
    if (!this.readyFired) {
      this.readyFired = true;
      this.options.onReady();
    }
    if (this.running && (settling || this.options.animateDust)) {
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  /** Advances eased state; returns true while anything is still moving. */
  private update(dt: number, now: number): boolean {
    this.progress = damp(this.progress, this.targetProgress, 5, dt);
    this.pointerX = damp(this.pointerX, this.targetPointerX, 4, dt);
    this.pointerY = damp(this.pointerY, this.targetPointerY, 4, dt);
    this.focus = damp(this.focus, this.targetFocus, 5, dt);

    const pull = easeInOutCubic(this.progress);
    this.camera.position.set(this.pointerX * 0.45, 0.35 + pull * 0.45 - this.pointerY * 0.25, 2.8 + pull * 6.2 - this.focus * 0.8);
    this.camera.lookAt(this.pointerX * 0.15, 0.1, -7);
    this.fog.near = 3 + pull * 3;
    this.fog.far = 11 + pull * 12;

    const brightness = 0.42 + pull * 0.45 + this.focus * 0.08;
    let fading = false;
    for (const print of this.prints) {
      if (print.loadedAt === null) continue;
      const reveal = clamp01((now - print.loadedAt) / TEXTURE_FADE_MS);
      if (reveal < 1) fading = true;
      print.material.color.setScalar(brightness);
      print.material.opacity = reveal;
      print.reflection.opacity = reveal * (0.14 + pull * 0.1);
    }

    if (this.dust && this.options.animateDust) {
      this.dust.rotation.y = Math.sin(now / 9000) * 0.05;
      this.dust.position.y = Math.sin(now / 5200) * 0.08;
    }

    const moving =
      Math.abs(this.progress - this.targetProgress) > 1e-4 ||
      Math.abs(this.pointerX - this.targetPointerX) > 1e-4 ||
      Math.abs(this.pointerY - this.targetPointerY) > 1e-4 ||
      Math.abs(this.focus - this.targetFocus) > 1e-4;
    return moving || fading;
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.suspend();
    if (!this.disposed) this.options.onContextLost();
  };
}
