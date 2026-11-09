// Safe village hub — walkable with the mouse (click a spot or point to walk).
import { W, H, HERO, makeSprite, type HeroClass } from "./engine";

export const VW = 640, VH = 360;
const hyp = (x: number, y: number) => Math.sqrt(x * x + y * y);

export type SpotKind = "npc" | "smith" | "barracks" | "gate";
export interface Spot { id: string; kind: SpotKind; name: string; x: number; y: number; pal: Record<string, string>; lines?: string[]; quest?: Quest; }
export interface Quest { id: string; text: string; reward: number; kind: "kills" | "clear"; goal: number | string; }

export const SPOTS: Spot[] = [
  { id: "smith", kind: "smith", name: "Ferreiro Bruno", x: 60, y: 60, pal: { h: "#3a2a1a", s: "#d9a77a", e: "#111", b: "#7a4a2a", l: "#222" } },
  { id: "barracks", kind: "barracks", name: "Quartel", x: 160, y: 46, pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#b03030", l: "#222" } },
  { id: "padre", kind: "npc", name: "Padre Elias", x: 120, y: 60, pal: { h: "#333", s: "#e8b88a", e: "#111", b: "#222", l: "#111" }, lines: ["A Cripta das Múmias é o coração do mal.", "Só os mais fortes voltam de lá."], quest: { id: "q_padre", text: "Purifique a Cripta das Múmias", reward: 300, kind: "clear", goal: "cripta" } },
  { id: "gate", kind: "gate", name: "Portão", x: 604, y: 180, pal: {} },
  { id: "ana", kind: "npc", name: "Ana, a curandeira", x: 90, y: 135, pal: { h: "#e0a030", s: "#f2c79a", e: "#111", b: "#3a8a5a", l: "#3a2a1a" }, lines: ["Somos dos últimos humanos vivos.", "Os mortos saem das cavernas à noite...", "Traga gemas ao ferreiro e fique mais forte."], quest: { id: "q_ana", text: "Derrote 150 mortos-vivos", reward: 60, kind: "kills", goal: 150 } },
  { id: "velho", kind: "npc", name: "Velho Tomé", x: 200, y: 140, pal: { h: "#ddd", s: "#e8b88a", e: "#111", b: "#5a5a7a", l: "#3a2a1a" }, lines: ["Na Vila Abandonada moravam minha filha e meu neto.", "As múmias são lentas, mas batem forte.", "Os esqueletos correm. Não deixe que te cerquem!"], quest: { id: "q_tome", text: "Purifique a Vila Abandonada", reward: 80, kind: "clear", goal: "vila" } },
  { id: "lia", kind: "npc", name: "Lia, a menina", x: 240, y: 60, pal: { h: "#a0522d", s: "#f2c79a", e: "#111", b: "#d06090", l: "#3a2a1a" }, lines: ["Você vai salvar a gente, né?", "Dizem que a caverna tem mais gemas... e mais monstros."], quest: { id: "q_lia", text: "Purifique a Caverna Sombria", reward: 150, kind: "clear", goal: "caverna" } },
  { id: "mara", kind: "npc", name: "Mara, exploradora", x: 400, y: 95, pal: { h: "#47735c", s: "#e8b88a", e: "#111", b: "#347562", l: "#222" }, lines: ["O bosque engoliu a antiga estrada.", "A raiz que controla os mortos ainda vive."], quest: { id: "q_mara", text: "Purifique o Bosque dos Condenados", reward: 120, kind: "clear", goal: "bosque" } },
  { id: "ivo", kind: "npc", name: "Ivo, sentinela", x: 470, y: 255, pal: { h: "#a9b3b9", s: "#d9a77a", e: "#111", b: "#a34949", l: "#222" }, lines: ["Meu general voltou da morte.", "A fortaleza precisa de paz, não de soldados."], quest: { id: "q_ivo", text: "Purifique a Fortaleza em Ruínas", reward: 200, kind: "clear", goal: "forte" } },
  { id: "rosa", kind: "npc", name: "Rosa, agricultora", x: 105, y: 275, pal: { h: "#b86739", s: "#f2c79a", e: "#111", b: "#5f9848", l: "#222" }, lines: ["Plantamos mesmo sem saber se haverá amanhã.", "Cada monstro a menos é uma noite mais tranquila."], quest: { id: "q_rosa", text: "Derrote 500 mortos-vivos", reward: 160, kind: "kills", goal: 500 } },
  { id: "noa", kind: "npc", name: "Noa, arquivista", x: 345, y: 285, pal: { h: "#e2d9b6", s: "#e8b88a", e: "#111", b: "#477e95", l: "#222" }, lines: ["As cinzas escondem a última imperatriz.", "Se ela cair, poderemos reconstruir."], quest: { id: "q_noa", text: "Purifique o Abismo das Cinzas", reward: 350, kind: "clear", goal: "abismo" } },
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
  speed = 1;
  camera() { return { x: Math.max(0, Math.min(VW - W, this.px - W / 2)), y: Math.max(0, Math.min(VH - H, this.py - H / 2)) }; }
  onArrive: (s: Spot) => void;

  constructor(canvas: HTMLCanvasElement, cls: HeroClass, onArrive: (s: Spot) => void) {
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas indisponível"); this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.hero = makeSprite(cls.rows || HERO, cls.pal);
    for (const s of SPOTS) if (s.kind !== "gate") this.npcs[s.id] = makeSprite(HERO, s.pal);
    this.onArrive = onArrive;
  }

  setClass(cls: HeroClass) { this.hero = makeSprite(cls.rows || HERO, cls.pal); }

  hover(): Spot | null {
    for (const s of SPOTS) if (Math.abs(s.x - this.mx) < 12 && Math.abs(s.y - this.my) < 12) return s;
    return null;
  }

  click(x: number, y: number) {
    const camera = this.camera(); x += camera.x; y += camera.y;
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
    this.px = Math.max(8, Math.min(VW - 8, this.px + dx * 95 * this.speed * dt));
    this.py = Math.max(30, Math.min(VH - 8, this.py + dy * 95 * this.speed * dt));
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
    for (let y = 0; y < VH; y += 16) for (let x = 0; x < VW; x += 16) { g.fillStyle = ((x + y) / 16) & 1 ? "#3f6b34" : "#467a3a"; g.fillRect(x, y, 16, 16); }
    // paths
    g.fillStyle = "#8a7350"; g.fillRect(0, 88, VW, 14); g.fillRect(152, 30, 14, VH - 30);
    // palisade
    g.fillStyle = "#5a3d22";
    for (let x = 0; x < VW; x += 6) { g.fillRect(x, 0, 5, 22); }
    for (let y = 22; y < VH; y += 6) { g.fillRect(0, y, 4, 5); if (y < 168 || y > 195) g.fillRect(VW - 4, y, 4, 5); }
    g.fillStyle = "#8a7350"; g.fillRect(0, 172, VW, 16); g.fillRect(0, 268, VW - 60, 12); g.fillRect(392, 55, 12, 240);
    house(g, 380, 55, "#3c7063"); house(g, 450, 216, "#8b4144"); house(g, 82, 236, "#496c46"); house(g, 325, 246, "#39738a"); house(g, 500, 48, "#6a4a2a");
    g.fillStyle = "#305779"; g.fillRect(245, 207, 56, 28); g.fillStyle = "#689cae"; g.fillRect(250, 211, 46, 3);
    for (let i = 0; i < 14; i++) { g.fillStyle = "#284c2c"; g.fillRect(30 + i * 38, 320, 12, 14); g.fillStyle = "#715337"; g.fillRect(34 + i * 38, 334, 4, 7); }
    // smith house + anvil
    house(g, 40, 22, "#7a3b2a"); g.fillStyle = "#555"; g.fillRect(74, 62, 8, 4); g.fillRect(76, 66, 4, 3);
    // barracks
    house(g, 140, 8, "#3a4a7a"); g.fillStyle = "#b03030"; g.fillRect(186, 10, 2, 16); g.fillRect(188, 10, 8, 5);
    house(g, 220, 22, "#6a4a2a"); house(g, 60, 112, "#6a4a2a"); house(g, 230, 118, "#7a3b2a");
    g.fillStyle = "#777"; g.fillRect(110, 92, 12, 8); g.fillStyle = "#2a4a8a"; g.fillRect(112, 94, 8, 4);
    g.fillStyle = "#3a2410"; g.fillRect(VW - 10, 166, 10, 28); g.fillStyle = "#000"; g.fillRect(VW - 7, 170, 7, 20);
  }

  draw() {
    const g = this.ctx;
    if (!this.bg) { this.bg = document.createElement("canvas"); this.bg.width = VW; this.bg.height = VH; const bg = this.bg.getContext("2d"); if (bg) this.drawStatic(bg); }
    const camera = this.camera();
    g.save(); g.translate(-Math.round(camera.x), -Math.round(camera.y));
    g.drawImage(this.bg, 0, 0);
    const fl = Math.floor(this.t * 8) % 2; g.fillStyle = fl ? "#ff8a3d" : "#ffd23f"; g.fillRect(36, 58, 4, 4);
    g.fillStyle = "#ffd23f"; if (Math.floor(this.t * 3) % 2) g.fillRect(VW - 22, 178, 3, 3);
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
    g.restore();
    // cursor
    if (this.mx > 0) {
      g.fillStyle = "#fff"; const mx = Math.round(this.mx - camera.x), my = Math.round(this.my - camera.y);
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
