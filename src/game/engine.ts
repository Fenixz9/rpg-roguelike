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
const dist = (x: number, y: number) => Math.sqrt(x * x + y * y);

export const HERO = ["..hhhh..", ".hhhhhh.", ".hsesse.", ".hssss..", "..bbbb..", ".sbbbbs.", "..bbbb..", "..l..l.."];
const ZOMBIE = ["..gggg..", ".gggggg.", ".grggrg.", ".gggggg.", "gcccccg.", "..cccc.g", "..cccc..", "..g..g.."];
const SKELETON = ["..wwww..", ".wwwwww.", ".wkwwkw.", "..wkkw..", "...ww...", ".wwwwww.", "...ww...", "..w..w.."];
const MUMMY = ["..mmmm..", ".mmnmmm.", ".mymmym.", ".nmmmmn.", "mmmnmmmm", "..mmnm..", "..mmmm..", "..m..m.."];
const HEART = [".r.r.", "rrrrr", "rrrrr", ".rrr.", "..r.."];
const GEM = [".c.", "ccc", ".c."];

export type EnemyKind = "zombie" | "skeleton" | "mummy";
interface Enemy { x: number; y: number; hp: number; kind: EnemyKind; speed: number; dmg: number; hit: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; pierce: number; hits: Enemy[]; }
interface Loot { x: number; y: number; type: "gem" | "heart"; got?: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

export interface Stats { damage: number; fireDelay: number; speed: number; shots: number; pierce: number; maxHp: number; hp: number; bulletSpeed: number; magnet: number; life: number; regen: number; spread: number; }
export interface Card { id: string; title: string; desc: string; apply: (s: Stats) => void; }

export const CARD_POOL: Card[] = [
  { id: "dmg", title: "Lâmina Afiada", desc: "+30% dano", apply: (s) => (s.damage *= 1.3) },
  { id: "rate", title: "Gatilho Rápido", desc: "+20% cadência", apply: (s) => (s.fireDelay *= 0.8) },
  { id: "spd", title: "Botas Leves", desc: "+12% velocidade", apply: (s) => (s.speed *= 1.12) },
  { id: "multi", title: "Tiro Duplo", desc: "+1 projétil", apply: (s) => (s.shots += 1) },
  { id: "pierce", title: "Perfurante", desc: "Atravessa +1 inimigo", apply: (s) => (s.pierce += 1) },
  { id: "hp", title: "Coração Forte", desc: "+2 vida máx. e cura", apply: (s) => { s.maxHp += 2; s.hp += 2; } },
  { id: "heal", title: "Poção", desc: "Cura toda a vida", apply: (s) => (s.hp = s.maxHp) },
  { id: "vel", title: "Alcance", desc: "+25% alcance do tiro", apply: (s) => { s.bulletSpeed *= 1.12; s.life *= 1.12; } },
  { id: "mag", title: "Ímã", desc: "Coleta loot de longe", apply: (s) => (s.magnet += 20) },
  { id: "regen", title: "Bênção", desc: "Regenera vida", apply: (s) => (s.regen += 0.06) },
];

export interface Weapon { id: string; name: string; desc: string; cost: number; color: string; size: number; dmg: number; delay: number; speed: number; life: number; pierce: number; shots: number; spread: number; }
export const WEAPONS: Weapon[] = [
  { id: "sword", name: "Espada", desc: "Golpe curto que atravessa", cost: 0, color: "#dfe6ee", size: 4, dmg: 2, delay: 0.5, speed: 150, life: 0.4, pierce: 3, shots: 1, spread: 0 },
  { id: "staff", name: "Cajado de Fogo", desc: "Bola de fogo forte", cost: 0, color: "#ff8a3d", size: 4, dmg: 3, delay: 0.8, speed: 110, life: 1.1, pierce: 1, shots: 1, spread: 0 },
  { id: "bow", name: "Arco Curto", desc: "Flechas rápidas e longas", cost: 0, color: "#ffe066", size: 2, dmg: 1.2, delay: 0.35, speed: 220, life: 0.8, pierce: 0, shots: 1, spread: 0 },
  { id: "daggers", name: "Adagas", desc: "Duas adagas por vez", cost: 0, color: "#cfd8dc", size: 2, dmg: 0.9, delay: 0.3, speed: 180, life: 0.6, pierce: 0, shots: 2, spread: 0.2 },
  { id: "mace", name: "Maça Sagrada", desc: "Equilibrada", cost: 0, color: "#fff59d", size: 3, dmg: 1.6, delay: 0.5, speed: 140, life: 0.7, pierce: 1, shots: 1, spread: 0 },
  { id: "crossbow", name: "Besta", desc: "Virote forte e perfurante", cost: 60, color: "#c08040", size: 3, dmg: 2.6, delay: 0.6, speed: 260, life: 0.7, pierce: 2, shots: 1, spread: 0 },
  { id: "axes", name: "Machados", desc: "Leque de 3 machados", cost: 100, color: "#b0b8c0", size: 3, dmg: 1.6, delay: 0.55, speed: 150, life: 0.5, pierce: 2, shots: 3, spread: 0.3 },
  { id: "ice", name: "Varinha de Gelo", desc: "Disparo muito rápido", cost: 140, color: "#7fdfff", size: 2, dmg: 1.1, delay: 0.17, speed: 210, life: 0.7, pierce: 0, shots: 1, spread: 0 },
  { id: "spear", name: "Lança Dourada", desc: "Atravessa tudo", cost: 220, color: "#ffd23f", size: 4, dmg: 4, delay: 0.7, speed: 200, life: 0.7, pierce: 6, shots: 1, spread: 0 },
  { id: "sun", name: "Cetro do Sol", desc: "Chuva de 5 raios", cost: 350, color: "#fff2a0", size: 3, dmg: 2.2, delay: 0.5, speed: 190, life: 0.7, pierce: 1, shots: 5, spread: 0.25 },
];

export interface HeroClass { id: string; name: string; desc: string; pal: Record<string, string>; weapon: string; base: Partial<Stats>; }
export const CLASSES: HeroClass[] = [
  { id: "knight", name: "Cavaleiro", desc: "Muita vida e resistente.", weapon: "sword", pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#6b7785", l: "#3a2a1a" }, base: { maxHp: 12, damage: 1.1 } },
  { id: "mage", name: "Mago", desc: "Pouca vida, dano mágico alto.", weapon: "staff", pal: { h: "#6a3fc4", s: "#f2c79a", e: "#111", b: "#4b2a8f", l: "#2a1a3a" }, base: { maxHp: 7, damage: 1.4 } },
  { id: "archer", name: "Arqueira", desc: "Atira mais rápido e longe.", weapon: "bow", pal: { h: "#2e7d32", s: "#f2c79a", e: "#111", b: "#558b2f", l: "#3a2a1a" }, base: { maxHp: 8, fireDelay: 0.85, life: 1.2 } },
  { id: "rogue", name: "Ladino", desc: "O mais veloz. +1 projétil.", weapon: "daggers", pal: { h: "#222", s: "#f2c79a", e: "#e33", b: "#3b3b3b", l: "#1a1a1a" }, base: { maxHp: 7, speed: 50, shots: 1 } },
  { id: "cleric", name: "Clérigo", desc: "Regenera vida e atrai loot.", weapon: "mace", pal: { h: "#f5f5f5", s: "#f2c79a", e: "#111", b: "#d4af37", l: "#5a4a32" }, base: { maxHp: 10, regen: 0.1, magnet: 45 } },
  { id: "barbarian", name: "Bárbaro", desc: "Muito dano, sem armadura.", weapon: "sword", pal: { h: "#c0602a", s: "#d9a77a", e: "#111", b: "#7a4a2a", l: "#3a2a1a" }, base: { maxHp: 9, damage: 1.6 } },
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
export interface Place { id: string; name: string; waves: number; waveTime: number; diff: number; floor: string; floor2: string; wall: string; }
export const PLACES: Place[] = [
  { id: "vila", name: "Vila Abandonada", waves: 6, waveTime: 45, diff: 1, floor: "#3b3326", floor2: "#453b2c", wall: "#5a4a32" },
  { id: "caverna", name: "Caverna Sombria", waves: 7, waveTime: 50, diff: 1.35, floor: "#22222e", floor2: "#2a2a38", wall: "#3c3c52" },
  { id: "cripta", name: "Cripta das Múmias", waves: 8, waveTime: 50, diff: 1.7, floor: "#3a3020", floor2: "#433826", wall: "#6a5530" },
];

const ARENA = 260;

export class Game {
  ctx: CanvasRenderingContext2D;
  sprites: Record<string, Sprite>;
  floor: HTMLCanvasElement;
  place: Place;
  px = 0; py = 0; face = 1;
  mx = W / 2; my = H / 2;
  pointerActive = false;
  keys: Record<string, boolean> = {};
  stats: Stats;
  weapon: Weapon;
  regenAcc = 0;
  enemies: Enemy[] = []; bullets: Bullet[] = []; loot: Loot[] = []; parts: Particle[] = [];
  fireT = 0; spawnT = 1; wave = 1; waveT = 0; total = 0; kills = 0; gems = 0; inv = 0;
  phase: Phase = "play";
  offer: Card[] = [];
  onChange: () => void;

  constructor(canvas: HTMLCanvasElement, place: Place, onChange: () => void, cls: HeroClass, weapon: Weapon, up: Upgrades) {
    this.weapon = weapon;
    const s: Stats = { damage: weapon.dmg, fireDelay: weapon.delay, speed: 42, shots: weapon.shots, pierce: weapon.pierce, maxHp: 8, hp: 8, bulletSpeed: weapon.speed, magnet: 20, life: weapon.life, regen: 0, spread: weapon.spread || 0.15 };
    const b = cls.base;
    if (b.maxHp) s.maxHp = b.maxHp;
    if (b.damage) s.damage *= b.damage;
    if (b.fireDelay) s.fireDelay *= b.fireDelay;
    if (b.life) s.life *= b.life;
    if (b.speed) s.speed = b.speed;
    if (b.shots) s.shots += b.shots;
    if (b.regen) s.regen = b.regen;
    if (b.magnet) s.magnet = b.magnet;
    s.damage *= 1 + up.dmg * 0.1; s.maxHp += up.hp; s.speed *= 1 + up.spd * 0.05;
    s.fireDelay *= Math.pow(0.94, up.rate); s.magnet += up.mag * 8;
    s.hp = s.maxHp;
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
    // Pre-render the whole floor once (cheap per-frame draw on slow TVs)
    const size = (ARENA + 200) * 2;
    this.floor = document.createElement("canvas");
    this.floor.width = size; this.floor.height = size;
    const f = this.floor.getContext("2d")!;
    for (let y = 0; y < size; y += 16) for (let x = 0; x < size; x += 16) {
      const wx = x - size / 2, wy = y - size / 2;
      const out = Math.abs(wx + 8) > ARENA + 8 || Math.abs(wy + 8) > ARENA + 8;
      f.fillStyle = out ? place.wall : ((x + y) / 16) & 1 ? place.floor : place.floor2;
      f.fillRect(x, y, 16, 16);
      if (!out && ((x * 7 + y * 13) % 5 === 0)) { f.fillStyle = place.wall; f.fillRect(x + 5, y + 7, 2, 1); }
    }
  }

  spawnEnemy() {
    if (this.enemies.length >= 40) return;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random();
    const diff = this.place.diff * (1 + (this.wave - 1) * 0.15);
    let kind: EnemyKind = "zombie";
    if (this.wave >= 2 && r < 0.3) kind = "skeleton";
    if (this.wave >= 3 && r > 0.85) kind = "mummy";
    const base = kind === "zombie" ? { hp: 3, sp: 16, dmg: 1 } : kind === "skeleton" ? { hp: 2, sp: 26, dmg: 1 } : { hp: 9, sp: 12, dmg: 2 };
    const x = Math.max(-ARENA, Math.min(ARENA, this.px + Math.cos(a) * 190));
    const y = Math.max(-ARENA, Math.min(ARENA, this.py + Math.sin(a) * 190));
    this.enemies.push({ x, y, hp: base.hp * diff, kind, speed: base.sp * (0.9 + Math.random() * 0.25), dmg: base.dmg, hit: 0 });
  }

  rollCards() {
    const pool = CARD_POOL.slice();
    this.offer = [];
    while (this.offer.length < 3 && pool.length) this.offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
  }

  pick(i: number) {
    if (this.phase !== "cards" || !this.offer[i]) return;
    this.offer[i]!.apply(this.stats);
    this.stats.hp = Math.min(this.stats.hp + 1, this.stats.maxHp);
    this.wave++;
    this.waveT = 0; this.spawnT = 1.5;
    this.phase = "play";
    this.onChange();
  }

  burst(x: number, y: number, color: string, n = 5) {
    if (this.parts.length > 80) return;
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, life: 0.35, color });
  }

  range() { return Math.max(60, Math.min(170, this.stats.bulletSpeed * this.stats.life + 10)); }

  update(dt: number) {
    if (this.phase !== "play") return;
    const s = this.stats;
    this.total += dt; this.waveT += dt; this.inv -= dt;

    // Movement: remote arrows, otherwise walk toward the pointer
    let dx = 0, dy = 0;
    const k = this.keys;
    if (k["ArrowLeft"]) dx -= 1;
    if (k["ArrowRight"]) dx += 1;
    if (k["ArrowUp"]) dy -= 1;
    if (k["ArrowDown"]) dy += 1;
    if (!dx && !dy && this.pointerActive) {
      const ddx = this.mx - W / 2, ddy = this.my - H / 2, d = dist(ddx, ddy);
      if (d > 10) { dx = ddx / d; dy = ddy / d; }
    } else if (dx || dy) { const l = dist(dx, dy); dx /= l; dy /= l; }
    if (Math.abs(dx) > 0.1) this.face = dx > 0 ? 1 : -1;
    this.px = Math.max(-ARENA, Math.min(ARENA, this.px + dx * s.speed * dt));
    this.py = Math.max(-ARENA, Math.min(ARENA, this.py + dy * s.speed * dt));

    // Auto-fire at the nearest enemy in range
    this.fireT -= dt;
    if (this.fireT <= 0) {
      let best: Enemy | null = null, bd = this.range();
      for (const e of this.enemies) { const d = dist(e.x - this.px, e.y - this.py); if (d < bd) { bd = d; best = e; } }
      if (best) {
        this.fireT = s.fireDelay;
        const base = Math.atan2(best.y - this.py, best.x - this.px);
        for (let i = 0; i < s.shots; i++) {
          const a = base + (i - (s.shots - 1) / 2) * s.spread;
          this.bullets.push({ x: this.px, y: this.py, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, life: s.life, pierce: s.pierce, hits: [] });
        }
      }
    }

    if (s.regen > 0 && s.hp < s.maxHp) { this.regenAcc += s.regen * dt; if (this.regenAcc >= 1) { this.regenAcc = 0; s.hp++; } }

    // Spawning
    this.spawnT -= dt;
    const rate = Math.max(0.45, 1.5 - this.wave * 0.12) / this.place.diff;
    if (this.waveT < this.place.waveTime && this.spawnT <= 0) { this.spawnT = rate; this.spawnEnemy(); }

    // Enemies
    for (const e of this.enemies) {
      const ex = this.px - e.x, ey = this.py - e.y, d = dist(ex, ey) || 1;
      e.x += (ex / d) * e.speed * dt; e.y += (ey / d) * e.speed * dt;
      e.hit -= dt;
      if (d < 6 && this.inv <= 0) {
        s.hp -= e.dmg; this.inv = 1; this.burst(this.px, this.py, "#ff3b5c", 8);
        e.x -= (ex / d) * 10; e.y -= (ey / d) * 10;
        if (s.hp <= 0) { this.phase = "dead"; this.onChange(); return; }
      }
    }
    const n = this.enemies.length;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const a = this.enemies[i]!, b = this.enemies[j]!;
        const ddx = a.x - b.x, ddy = a.y - b.y;
        if (ddx > 7 || ddx < -7 || ddy > 7 || ddy < -7) continue;
        const d = dist(ddx, ddy);
        if (d > 0 && d < 7) { const p = (7 - d) / 2; a.x += (ddx / d) * p; a.y += (ddy / d) * p; b.x -= (ddx / d) * p; b.y -= (ddy / d) * p; }
      }

    // Bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hits.indexOf(e) >= 0) continue;
        if (Math.abs(e.x - b.x) < 6 && Math.abs(e.y - b.y) < 6) {
          e.hp -= s.damage; e.hit = 0.1; b.hits.push(e);
          e.x += b.vx * 0.02; e.y += b.vy * 0.02;
          if (e.hp <= 0) {
            this.kills++;
            this.burst(e.x, e.y, e.kind === "zombie" ? "#6fa34a" : e.kind === "skeleton" ? "#e8e4d8" : "#d9c79a");
            this.loot.push({ x: e.x, y: e.y, type: Math.random() < 0.06 ? "heart" : "gem" });
          }
          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    for (const l of this.loot) {
      const ddx = this.px - l.x, ddy = this.py - l.y, d = dist(ddx, ddy);
      if (d < s.magnet && d > 0) { l.x += (ddx / d) * 120 * dt; l.y += (ddy / d) * 120 * dt; }
      if (d < 6) { if (l.type === "gem") this.gems++; else s.hp = Math.min(s.maxHp, s.hp + 1); l.got = true; }
    }
    this.loot = this.loot.filter((l) => !l.got);

    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);

    if (this.waveT >= this.place.waveTime && this.enemies.length === 0) {
      // auto-collect leftover loot
      for (const l of this.loot) if (l.type === "gem") this.gems++;
      this.loot = [];
      if (this.wave >= this.place.waves) this.phase = "win";
      else { this.rollCards(); this.phase = "cards"; }
      this.onChange();
    }
  }

  draw() {
    const g = this.ctx, cx = Math.round(this.px - W / 2), cy = Math.round(this.py - H / 2);
    const half = this.floor.width / 2;
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    g.drawImage(this.floor, cx + half, cy + half, W, H, 0, 0, W, H);
    for (const l of this.loot) g.drawImage(this.sprites[l.type]!, Math.round(l.x - cx - 2), Math.round(l.y - cy - 2));
    for (const e of this.enemies) {
      const ex = Math.round(e.x - cx - 4), ey = Math.round(e.y - cy - 4);
      if (ex < -8 || ey < -8 || ex > W || ey > H) continue;
      if (e.hit > 0) g.globalAlpha = 0.5;
      g.drawImage(this.sprites[e.kind]!, ex, ey);
      if (e.hit > 0) g.globalAlpha = 1;
    }
    if (this.inv <= 0 || Math.floor(this.inv * 20) % 2) {
      g.save();
      g.translate(Math.round(this.px - cx), Math.round(this.py - cy));
      g.scale(this.face, 1);
      g.drawImage(this.sprites["hero"]!, -4, -4);
      g.restore();
    }
    g.fillStyle = this.weapon.color;
    const bs = this.weapon.size, bh = bs / 2;
    for (const b of this.bullets) g.fillRect(Math.round(b.x - cx - bh), Math.round(b.y - cy - bh), bs, bs);
    for (const p of this.parts) { g.fillStyle = p.color; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
    if (this.pointerActive) {
      g.fillStyle = "#fff";
      const mx = Math.round(this.mx), my = Math.round(this.my);
      g.fillRect(mx, my, 1, 6); g.fillRect(mx + 1, my + 1, 1, 4); g.fillRect(mx + 2, my + 2, 1, 2); g.fillRect(mx + 3, my + 3, 1, 1);
    }
  }
}
