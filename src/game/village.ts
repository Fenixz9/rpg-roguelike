// Safe village hub — walkable with the mouse (click a spot or point to walk).
import { W, H, HERO, makeSprite, type HeroClass } from "./engine";

const hyp = (x: number, y: number) => Math.sqrt(x * x + y * y);

export type SpotKind = "npc" | "smith" | "barracks" | "gate";
export interface Spot { id: string; kind: SpotKind; name: string; x: number; y: number; pal: Record<string, string>; lines?: string[]; quest?: Quest; }
export interface Quest { id: string; text: string; reward: number; kind: "kills" | "clear"; goal: number | string; }

export const SPOTS: Spot[] = [
  { id: "smith", kind: "smith", name: "Ferreiro Bruno", x: 60, y: 60, pal: { h: "#3a2a1a", s: "#d9a77a", e: "#111", b: "#7a4a2a", l: "#222" } },
  { id: "barracks", kind: "barracks", name: "Quartel", x: 160, y: 46, pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#b03030", l: "#222" } },
  { id: "padre", kind: "npc", name: "Padre Elias", x: 120, y: 60, pal: { h: "#333", s: "#e8b88a", e: "#111", b: "#222", l: "#111" }, lines: ["A Cripta das Múmias é o coração do mal.", "Só os mais fortes voltam de lá."], quest: { id: "q_padre", text: "Purifique a Cripta das Múmias", reward: 300, kind: "clear", goal: "cripta" } },
  { id: "gate", kind: "gate", name: "Portão", x: 290, y: 95, pal: {} },
  { id: "ana", kind: "npc", name: "Ana, a curandeira", x: 90, y: 135, pal: { h: "#e0a030", s: "#f2c79a", e: "#111", b: "#3a8a5a", l: "#3a2a1a" }, lines: ["Somos dos últimos humanos vivos.", "Os mortos saem das cavernas à noite...", "Traga gemas ao ferreiro e fique mais forte."], quest: { id: "q_ana", text: "Derrote 150 mortos-vivos", reward: 60, kind: "kills", goal: 150 } },
  { id: "velho", kind: "npc", name: "Velho Tomé", x: 200, y: 140, pal: { h: "#ddd", s: "#e8b88a", e: "#111", b: "#5a5a7a", l: "#3a2a1a" }, lines: ["Na Vila Abandonada moravam minha filha e meu neto.", "As múmias são lentas, mas batem forte.", "Os esqueletos correm. Não deixe que te cerquem!"], quest: { id: "q_tome", text: "Purifique a Vila Abandonada", reward: 80, kind: "clear", goal: "vila" } },
  { id: "lia", kind: "npc", name: "Lia, a menina", x: 240, y: 60, pal: { h: "#a0522d", s: "#f2c79a", e: "#111", b: "#d06090", l: "#3a2a1a" }, lines: ["Você vai salvar a gente, né?", "Dizem que a caverna tem mais gemas... e mais monstros."], quest: { id: "q_lia", text: "Purifique a Caverna Sombria", reward: 150, kind: "clear", goal: "caverna" } },
];

export class Village {
  ctx: CanvasRenderingContext2D;
  hero: HTMLCanvasElement;
  npcs: Record<string, HTMLCanvasElement> = {};
  px = 160; py = 100; face = 1;
  tx = 160; ty = 100;
  mx = -99; my = -99;
  keys: Record<string, boolean> = {};
  target: Spot | null = null;
  paused = false;
  t = 0;
  onArrive: (s: Spot) => void;

  constructor(canvas: HTMLCanvasElement, cls: HeroClass, onArrive: (s: Spot) => void) {
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.hero = makeSprite(HERO, cls.pal);
    for (const s of SPOTS) if (s.kind !== "gate") this.npcs[s.id] = makeSprite(HERO, s.pal);
    this.onArrive = onArrive;
  }

  setClass(cls: HeroClass) { this.hero = makeSprite(HERO, cls.pal); }

  hover(): Spot | null {
    for (const s of SPOTS) if (Math.abs(s.x - this.mx) < 12 && Math.abs(s.y - this.my) < 12) return s;
    return null;
  }

  click(x: number, y: number) {
    this.mx = x; this.my = y;
    const s = this.hover();
    this.target = s;
    this.tx = s ? s.x : x; this.ty = s ? s.y + 10 : y;
  }

  update(dt: number) {
    this.t += dt;
    if (this.paused) return;
    let dx = 0, dy = 0;
    const k = this.keys;
    if (k["ArrowLeft"]) dx -= 1;
    if (k["ArrowRight"]) dx += 1;
    if (k["ArrowUp"]) dy -= 1;
    if (k["ArrowDown"]) dy += 1;
    if (dx || dy) { this.tx = this.px; this.ty = this.py; this.target = null; }
    else { const ddx = this.tx - this.px, ddy = this.ty - this.py, d = hyp(ddx, ddy); if (d > 1.5) { dx = ddx / d; dy = ddy / d; } }
    const l = hyp(dx, dy);
    if (l) { dx /= l; dy /= l; if (Math.abs(dx) > 0.1) this.face = dx > 0 ? 1 : -1; }
    this.px = Math.max(8, Math.min(W - 8, this.px + dx * 48 * dt));
    this.py = Math.max(30, Math.min(H - 8, this.py + dy * 48 * dt));
    if (this.target && hyp(this.target.x - this.px, this.target.y + 10 - this.py) < 3) {
      const s = this.target; this.target = null; this.onArrive(s);
    }
  }

  nearest(): Spot | null {
    for (const s of SPOTS) if (hyp(s.x - this.px, s.y - this.py) < 18) return s;
    return null;
  }

  bg: HTMLCanvasElement | null = null;

  drawStatic(g: CanvasRenderingContext2D) {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { g.fillStyle = ((x + y) / 16) & 1 ? "#3f6b34" : "#467a3a"; g.fillRect(x, y, 16, 16); }
    // paths
    g.fillStyle = "#8a7350"; g.fillRect(0, 88, W, 14); g.fillRect(152, 30, 14, 140);
    // palisade
    g.fillStyle = "#5a3d22";
    for (let x = 0; x < W; x += 6) { g.fillRect(x, 0, 5, 22); }
    for (let y = 22; y < H; y += 6) { g.fillRect(0, y, 4, 5); if (y < 84 || y > 108) g.fillRect(W - 4, y, 4, 5); }
    // smith house + anvil
    house(g, 40, 22, "#7a3b2a"); g.fillStyle = "#555"; g.fillRect(74, 62, 8, 4); g.fillRect(76, 66, 4, 3);
    // barracks
    house(g, 140, 8, "#3a4a7a"); g.fillStyle = "#b03030"; g.fillRect(186, 10, 2, 16); g.fillRect(188, 10, 8, 5);
    house(g, 220, 22, "#6a4a2a"); house(g, 60, 112, "#6a4a2a"); house(g, 230, 118, "#7a3b2a");
    g.fillStyle = "#777"; g.fillRect(110, 92, 12, 8); g.fillStyle = "#2a4a8a"; g.fillRect(112, 94, 8, 4);
    g.fillStyle = "#3a2410"; g.fillRect(W - 10, 82, 10, 28); g.fillStyle = "#000"; g.fillRect(W - 7, 86, 7, 20);
  }

  draw() {
    const g = this.ctx;
    if (!this.bg) { this.bg = document.createElement("canvas"); this.bg.width = W; this.bg.height = H; this.drawStatic(this.bg.getContext("2d")!); }
    g.drawImage(this.bg, 0, 0);
    const fl = Math.floor(this.t * 8) % 2; g.fillStyle = fl ? "#ff8a3d" : "#ffd23f"; g.fillRect(36, 58, 4, 4);
    g.fillStyle = "#ffd23f"; if (Math.floor(this.t * 3) % 2) g.fillRect(W - 22, 93, 3, 3);
    // npcs
    for (const s of SPOTS) {
      const sp = this.npcs[s.id];
      if (sp) g.drawImage(sp, s.x - 4, s.y - 4);
      if (s.kind === "npc" || s.kind === "smith" || s.kind === "barracks") {
        g.fillStyle = "#ffd23f"; const bob = Math.floor(this.t * 3) % 2;
        g.fillRect(s.x - 1, s.y - 12 - bob, 2, 4); g.fillRect(s.x - 1, s.y - 7 - bob, 2, 1);
      }
    }
    // destination marker
    if (hyp(this.tx - this.px, this.ty - this.py) > 2) { g.fillStyle = "#fff"; g.fillRect(Math.round(this.tx) - 1, Math.round(this.ty), 3, 1); }
    // hero
    g.save(); g.translate(Math.round(this.px), Math.round(this.py)); g.scale(this.face, 1); g.drawImage(this.hero, -4, -4); g.restore();
    // hover highlight
    const h = this.hover();
    if (h) { g.strokeStyle = "#ffd23f"; g.lineWidth = 1; g.strokeRect(h.x - 9.5, h.y - 9.5, 19, 19); }
    // cursor
    if (this.mx > 0) {
      g.fillStyle = "#fff"; const mx = Math.round(this.mx), my = Math.round(this.my);
      g.fillRect(mx, my, 1, 6); g.fillRect(mx + 1, my + 1, 1, 4); g.fillRect(mx + 2, my + 2, 1, 2); g.fillRect(mx + 3, my + 3, 1, 1);
    }
  }
}

function house(g: CanvasRenderingContext2D, x: number, y: number, roof: string) {
  g.fillStyle = roof;
  for (let i = 0; i < 10; i++) g.fillRect(x + 10 - i * 1.5, y + i, 10 + i * 3, 1);
  g.fillStyle = "#c8a878"; g.fillRect(x, y + 10, 40, 20);
  g.fillStyle = "#4a2a10"; g.fillRect(x + 16, y + 18, 8, 12);
  g.fillStyle = "#ffe9a0"; g.fillRect(x + 5, y + 15, 6, 5); g.fillRect(x + 29, y + 15, 6, 5);
}
