// Pixel roguelike engine — plain canvas 2D, no modern-only APIs (Tizen-safe).
export const W = 320;
export const H = 180;

type Sprite = HTMLCanvasElement;
export function makeSprite(rows: string[], pal: Record<string, string>): Sprite {
  const c = document.createElement("canvas");
  c.width = rows[0]!.length;
  c.height = rows.length;
  const g = c.getContext("2d")!;
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y]!.length; x++) {
      const ch = rows[y]![x]!;
      if (ch !== "." && pal[ch]) {
        g.fillStyle = pal[ch];
        g.fillRect(x, y, 1, 1);
      }
    }
  return c;
}

export const HERO = [
  "..hhhh..",
  ".hhhhhh.",
  ".hsesse.",
  ".hssss..",
  "..bbbb..",
  ".sbbbbs.",
  "..bbbb..",
  "..l..l..",
];
const ZOMBIE = [
  "..gggg..",
  ".gggggg.",
  ".grggrg.",
  ".gggggg.",
  "gcccccg.",
  "..cccc.g",
  "..cccc..",
  "..g..g..",
];
const SKELETON = [
  "..wwww..",
  ".wwwwww.",
  ".wkwwkw.",
  "..wkkw..",
  "...ww...",
  ".wwwwww.",
  "...ww...",
  "..w..w..",
];
const MUMMY = [
  "..mmmm..",
  ".mmnmmm.",
  ".mymmym.",
  ".nmmmmn.",
  "mmmnmmmm",
  "..mmnm..",
  "..mmmm..",
  "..m..m..",
];
const HEART = [".r.r.", "rrrrr", "rrrrr", ".rrr.", "..r.."];
const GEM = [".c.", "ccc", ".c."];

export type EnemyKind = "zombie" | "skeleton" | "mummy";
interface Enemy { x: number; y: number; hp: number; max: number; kind: EnemyKind; speed: number; dmg: number; hit: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; pierce: number; hits: Enemy[]; enemy?: boolean; }
interface Loot { x: number; y: number; type: "gem" | "heart"; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

export interface Card { id: string; title: string; desc: string; apply: (s: Stats) => void; }
export interface Stats { damage: number; fireDelay: number; speed: number; shots: number; pierce: number; maxHp: number; hp: number; bulletSpeed: number; magnet: number; life: number; regen: number; }

export const CARD_POOL: Card[] = [
  { id: "dmg", title: "Lâmina Afiada", desc: "+30% dano", apply: (s) => (s.damage *= 1.3) },
  { id: "rate", title: "Gatilho Rápido", desc: "+20% cadência", apply: (s) => (s.fireDelay *= 0.8) },
  { id: "spd", title: "Botas Leves", desc: "+15% velocidade", apply: (s) => (s.speed *= 1.15) },
  { id: "multi", title: "Tiro Duplo", desc: "+1 projétil", apply: (s) => (s.shots += 1) },
  { id: "pierce", title: "Perfurante", desc: "Atravessa +1 inimigo", apply: (s) => (s.pierce += 1) },
  { id: "hp", title: "Coração Forte", desc: "+2 vida máx. e cura", apply: (s) => { s.maxHp += 2; s.hp += 2; } },
  { id: "heal", title: "Poção", desc: "Cura toda a vida", apply: (s) => (s.hp = s.maxHp) },
  { id: "vel", title: "Flecha Veloz", desc: "+25% vel. do tiro", apply: (s) => (s.bulletSpeed *= 1.25) },
  { id: "mag", title: "Ímã", desc: "Coleta loot de longe", apply: (s) => (s.magnet += 20) },
];

export interface HeroClass { id: string; name: string; weapon: string; desc: string; pal: Record<string, string>; bullet: string; size: number; base: Partial<Stats>; }
export const CLASSES: HeroClass[] = [
  { id: "knight", name: "Cavaleiro", weapon: "Espada", desc: "Muita vida. Golpes curtos e fortes que atravessam inimigos.", pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#6b7785", l: "#3a2a1a" }, bullet: "#dfe6ee", size: 4, base: { maxHp: 10, hp: 10, damage: 1.6, fireDelay: 0.45, speed: 55, bulletSpeed: 140, life: 0.35, pierce: 2 } },
  { id: "mage", name: "Mago", weapon: "Cajado", desc: "Pouca vida. Bolas de fogo lentas e devastadoras.", pal: { h: "#6a3fc4", s: "#f2c79a", e: "#111", b: "#4b2a8f", l: "#2a1a3a" }, bullet: "#ff8a3d", size: 4, base: { maxHp: 5, hp: 5, damage: 2.4, fireDelay: 0.7, bulletSpeed: 120, pierce: 1 } },
  { id: "archer", name: "Arqueiro", weapon: "Arco", desc: "Flechas rápidas de longo alcance.", pal: { h: "#2e7d32", s: "#f2c79a", e: "#111", b: "#558b2f", l: "#3a2a1a" }, bullet: "#ffe066", size: 2, base: { maxHp: 6, hp: 6, fireDelay: 0.3, bulletSpeed: 230, life: 1.6 } },
  { id: "rogue", name: "Ladino", weapon: "Adagas", desc: "Muito veloz. Arremessa duas adagas de cada vez.", pal: { h: "#222", s: "#f2c79a", e: "#e33", b: "#3b3b3b", l: "#1a1a1a" }, bullet: "#cfd8dc", size: 2, base: { maxHp: 5, hp: 5, damage: 0.7, fireDelay: 0.28, speed: 80, shots: 2 } },
  { id: "cleric", name: "Clérigo", weapon: "Maça sagrada", desc: "Regenera vida com o tempo e atrai loot de longe.", pal: { h: "#f5f5f5", s: "#f2c79a", e: "#111", b: "#d4af37", l: "#5a4a32" }, bullet: "#fff59d", size: 3, base: { maxHp: 8, hp: 8, regen: 0.08, magnet: 40 } },
];
export interface Upgrades { dmg: number; hp: number; spd: number; rate: number; mag: number; }
export const UPGRADES: { id: keyof Upgrades; name: string; desc: string }[] = [
  { id: "dmg", name: "Afiar arma", desc: "+10% dano" },
  { id: "hp", name: "Armadura", desc: "+1 vida máx." },
  { id: "spd", name: "Botas", desc: "+5% velocidade" },
  { id: "rate", name: "Empunhadura", desc: "+6% cadência" },
  { id: "mag", name: "Bolsa de couro", desc: "+8 alcance de coleta" },
];
export const upgradeCost = (lvl: number) => 10 + lvl * 12;
export const MAX_UPGRADE = 8;

export type Phase = "play" | "cards" | "dead" | "win";
export interface Place { name: string; waves: number; waveTime: number; diff: number; floor: string; floor2: string; wall: string; }
export const PLACES: Place[] = [
  { name: "Vila Abandonada", waves: 6, waveTime: 50, diff: 1, floor: "#3b3326", floor2: "#453b2c", wall: "#5a4a32" },
  { name: "Caverna Sombria", waves: 8, waveTime: 50, diff: 1.5, floor: "#22222e", floor2: "#2a2a38", wall: "#3c3c52" },
];

export class Game {
  ctx: CanvasRenderingContext2D;
  sprites: Record<string, Sprite>;
  place: Place;
  px = 0; py = 0; face = 1;
  mx = W / 2; my = H / 2; // mouse in screen px
  pointerActive = false;
  keys: Record<string, boolean> = {};
  stats: Stats;
  cls: HeroClass;
  regenAcc = 0;
  enemies: Enemy[] = []; bullets: Bullet[] = []; loot: Loot[] = []; parts: Particle[] = [];
  fireT = 0; spawnT = 0; wave = 1; waveT = 0; total = 0; kills = 0; gems = 0; inv = 0;
  phase: Phase = "play";
  offer: Card[] = [];
  arena = 260;
  onChange: () => void;

  constructor(canvas: HTMLCanvasElement, place: Place, onChange: () => void, cls: HeroClass = CLASSES[0]!, up: Upgrades = { dmg: 0, hp: 0, spd: 0, rate: 0, mag: 0 }) {
    this.cls = cls;
    const s: Stats = { damage: 1, fireDelay: 0.4, speed: 60, shots: 1, pierce: 0, maxHp: 6, hp: 6, bulletSpeed: 160, magnet: 16, life: 1.2, regen: 0, ...cls.base };
    s.damage *= 1 + up.dmg * 0.1; s.maxHp += up.hp; s.hp = s.maxHp; s.speed *= 1 + up.spd * 0.05;
    s.fireDelay *= Math.pow(0.94, up.rate); s.magnet += up.mag * 8;
    this.stats = s;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.place = place;
    this.onChange = onChange;
    this.sprites = {
      hero: makeSprite(HERO, cls.pal),
      zombie: makeSprite(ZOMBIE, { g: "#6fa34a", r: "#e33", c: "#5b4a7a" }),
      skeleton: makeSprite(SKELETON, { w: "#e8e4d8", k: "#222" }),
      mummy: makeSprite(MUMMY, { m: "#d9c79a", n: "#a8946a", y: "#ffd23f" }),
      heart: makeSprite(HEART, { r: "#ff3b5c" }),
      gem: makeSprite(GEM, { c: "#4fe3ff" }),
    };
  }

  camX() { return this.px - W / 2; }
  camY() { return this.py - H / 2; }

  spawnEnemy() {
    const a = Math.random() * Math.PI * 2;
    const d = 200;
    const r = Math.random();
    const diff = this.place.diff * (1 + (this.wave - 1) * 0.25);
    let kind: EnemyKind = "zombie";
    if (this.wave >= 2 && r < 0.35) kind = "skeleton";
    if (this.wave >= 3 && r > 0.8) kind = "mummy";
    const base = kind === "zombie" ? { hp: 3, sp: 22, dmg: 1 } : kind === "skeleton" ? { hp: 2, sp: 36, dmg: 1 } : { hp: 8, sp: 16, dmg: 2 };
    let x = this.px + Math.cos(a) * d, y = this.py + Math.sin(a) * d;
    x = Math.max(-this.arena, Math.min(this.arena, x));
    y = Math.max(-this.arena, Math.min(this.arena, y));
    const hp = base.hp * diff;
    this.enemies.push({ x, y, hp, max: hp, kind, speed: base.sp * (0.9 + Math.random() * 0.3), dmg: base.dmg, hit: 0 });
  }

  rollCards() {
    const pool = CARD_POOL.slice();
    this.offer = [];
    while (this.offer.length < 3 && pool.length) this.offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
  }

  pick(i: number) {
    if (this.phase !== "cards" || !this.offer[i]) return;
    this.offer[i].apply(this.stats);
    this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);
    this.wave++;
    this.waveT = 0;
    this.phase = "play";
    this.onChange();
  }

  burst(x: number, y: number, color: string, n = 6) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, life: 0.4, color });
  }

  update(dt: number) {
    if (this.phase !== "play") return;
    const s = this.stats;
    this.total += dt; this.waveT += dt; this.inv -= dt;

    // Movement: keyboard/remote arrows override, otherwise follow the mouse
    let dx = 0, dy = 0;
    const k = this.keys as Record<string, boolean | undefined> & { ArrowLeft?: boolean; ArrowRight?: boolean; ArrowUp?: boolean; ArrowDown?: boolean; a?: boolean; d?: boolean; w?: boolean; s?: boolean };
    if (k.ArrowLeft || k.a) dx -= 1;
    if (k.ArrowRight || k.d) dx += 1;
    if (k.ArrowUp || k.w) dy -= 1;
    if (k.ArrowDown || k.s) dy += 1;
    const tx = this.mx + this.camX(), ty = this.my + this.camY();
    if (!dx && !dy && this.pointerActive) {
      const ddx = tx - this.px, ddy = ty - this.py, dist = Math.hypot(ddx, ddy);
      if (dist > 6) { dx = ddx / dist; dy = ddy / dist; }
    } else if (dx || dy) { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
    this.px = Math.max(-this.arena, Math.min(this.arena, this.px + dx * s.speed * dt));
    this.py = Math.max(-this.arena, Math.min(this.arena, this.py + dy * s.speed * dt));

    // Aim at mouse (or nearest enemy if no pointer)
    let ax = tx - this.px, ay = ty - this.py;
    if (!this.pointerActive) {
      let best: Enemy | null = null, bd = 1e9;
      for (const e of this.enemies) { const d = Math.hypot(e.x - this.px, e.y - this.py); if (d < bd) { bd = d; best = e; } }
      if (best) { ax = best.x - this.px; ay = best.y - this.py; } else { ax = this.face; ay = 0; }
    }
    if (Math.abs(ax) > 1) this.face = ax > 0 ? 1 : -1;
    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fireT = s.fireDelay;
      const base = Math.atan2(ay, ax);
      for (let i = 0; i < s.shots; i++) {
        const a = base + (i - (s.shots - 1) / 2) * 0.15;
        this.bullets.push({ x: this.px, y: this.py, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, life: s.life, pierce: s.pierce, hits: [] });
      }
    }

    if (s.regen > 0 && s.hp < s.maxHp) { this.regenAcc += s.regen * dt; if (this.regenAcc >= 1) { this.regenAcc = 0; s.hp++; this.onChange(); } }

    // Spawning
    this.spawnT -= dt;
    const rate = Math.max(0.25, 1.4 - this.wave * 0.12) / this.place.diff;
    if (this.waveT < this.place.waveTime && this.spawnT <= 0) { this.spawnT = rate; this.spawnEnemy(); }

    // Enemies
    for (const e of this.enemies) {
      const ex = this.px - e.x, ey = this.py - e.y, d = Math.hypot(ex, ey) || 1;
      e.x += (ex / d) * e.speed * dt; e.y += (ey / d) * e.speed * dt;
      e.hit -= dt;
      if (d < 7 && this.inv <= 0) {
        s.hp -= e.dmg; this.inv = 0.8; this.burst(this.px, this.py, "#ff3b5c", 8); this.onChange();
        if (s.hp <= 0) { this.phase = "dead"; this.onChange(); return; }
      }
    }
    // separation
    for (let i = 0; i < this.enemies.length; i++)
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i]!, b = this.enemies[j]!;
        const ddx = a.x - b.x, ddy = a.y - b.y, d = Math.hypot(ddx, ddy);
        if (d > 0 && d < 7) { const p = (7 - d) / 2; a.x += (ddx / d) * p; a.y += (ddy / d) * p; b.x -= (ddx / d) * p; b.y -= (ddy / d) * p; }
      }

    // Bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hits.indexOf(e) >= 0) continue;
        if (Math.abs(e.x - b.x) < 5 && Math.abs(e.y - b.y) < 5) {
          e.hp -= s.damage; e.hit = 0.1; b.hits.push(e);
          e.x += b.vx * 0.02; e.y += b.vy * 0.02;
          if (e.hp <= 0) {
            this.kills++;
            this.burst(e.x, e.y, e.kind === "zombie" ? "#6fa34a" : e.kind === "skeleton" ? "#e8e4d8" : "#d9c79a");
            this.loot.push({ x: e.x, y: e.y, type: Math.random() < 0.05 ? "heart" : "gem" });
          }
          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // Loot
    for (const l of this.loot) {
      const ddx = this.px - l.x, ddy = this.py - l.y, d = Math.hypot(ddx, ddy);
      if (d < s.magnet) { l.x += (ddx / d) * 120 * dt; l.y += (ddy / d) * 120 * dt; }
      if (d < 5) {
        if (l.type === "gem") this.gems++; else s.hp = Math.min(s.maxHp, s.hp + 1);
        (l as Loot & { got?: boolean }).got = true; this.onChange();
      }
    }
    this.loot = this.loot.filter((l) => !(l as Loot & { got?: boolean }).got);

    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);

    // Wave end: time over and arena cleared
    if (this.waveT >= this.place.waveTime && this.enemies.length === 0) {
      if (this.wave >= this.place.waves) { this.phase = "win"; }
      else { this.rollCards(); this.phase = "cards"; }
      this.onChange();
    }
  }

  draw() {
    const g = this.ctx, cx = Math.round(this.camX()), cy = Math.round(this.camY());
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    // floor tiles
    const T = 16;
    for (let ty = Math.floor(cy / T) * T; ty < cy + H; ty += T)
      for (let tx = Math.floor(cx / T) * T; tx < cx + W; tx += T) {
        const out = Math.abs(tx + 8) > this.arena + 8 || Math.abs(ty + 8) > this.arena + 8;
        g.fillStyle = out ? this.place.wall : ((tx / T + ty / T) & 1 ? this.place.floor : this.place.floor2);
        g.fillRect(tx - cx, ty - cy, T, T);
      }
    for (const l of this.loot) g.drawImage(this.sprites[l.type]!, Math.round(l.x - cx - 2), Math.round(l.y - cy - 2));
    for (const e of this.enemies) {
      g.globalAlpha = e.hit > 0 ? 0.5 : 1;
      g.drawImage(this.sprites[e.kind]!, Math.round(e.x - cx - 4), Math.round(e.y - cy - 4));
      g.globalAlpha = 1;
    }
    // hero
    if (this.inv <= 0 || Math.floor(this.inv * 20) % 2) {
      g.save();
      g.translate(Math.round(this.px - cx), Math.round(this.py - cy));
      g.scale(this.face, 1);
      g.drawImage(this.sprites["hero"]!, -4, -4);
      g.restore();
    }
    g.fillStyle = this.cls.bullet;
    const bs = this.cls.size, bh = bs / 2;
    for (const b of this.bullets) g.fillRect(Math.round(b.x - cx - bh), Math.round(b.y - cy - bh), bs, bs);
    for (const p of this.parts) { g.fillStyle = p.color; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
    // crosshair
    if (this.pointerActive) {
      g.fillStyle = "#fff";
      const mx = Math.round(this.mx), my = Math.round(this.my);
      g.fillRect(mx - 3, my, 2, 1); g.fillRect(mx + 2, my, 2, 1); g.fillRect(mx, my - 3, 1, 2); g.fillRect(mx, my + 2, 1, 2);
    }
  }
}
