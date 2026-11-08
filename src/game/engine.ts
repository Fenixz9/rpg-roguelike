import { audio } from "./audio";
// Pixel roguelike engine — plain canvas 2D, no modern-only APIs (Tizen-safe).
export const W = 320;
export const H = 180;

type Sprite = HTMLCanvasElement;
export function makeSprite(rows: string[], pal: Record<string, string>): Sprite {
  const c = document.createElement("canvas");
  c.width = rows[0]?.length || 0;
  c.height = rows.length;
  const g = c.getContext("2d");
  if (!g) return c;
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < (rows[y]?.length || 0); x++) {
      const ch = rows[y]?.[x] || ".";
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
export interface Enemy { x: number; y: number; hp: number; kind: EnemyKind; speed: number; dmg: number; hit: number; maxHp: number; boss?: boolean; slow: number; burn: number; cooldown: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; pierce: number; hits: Enemy[]; }
interface Loot { x: number; y: number; type: "gem" | "heart"; got?: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

export interface Stats { armor: number; crit: number; dodge: number; explosion: number; slow: number; burn: number; lifesteal: number; orbit: number; thorns: number; gold: number; knockback: number; rear: boolean; berserk: boolean;  damage: number; fireDelay: number; speed: number; shots: number; pierce: number; maxHp: number; hp: number; bulletSpeed: number; magnet: number; life: number; regen: number; spread: number; }
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
  { id: "blast", title: "Onda de Choque", desc: "Explosões causam dano em área", apply: s => { s.explosion += 18; } },
  { id: "frost", title: "Inverno Eterno", desc: "Tiros reduzem velocidade em 45%", apply: s => { s.slow = 0.45; } },
  { id: "burn", title: "Combustão", desc: "Incendeia: 2 dano por segundo", apply: s => { s.burn += 2; } },
  { id: "vampire", title: "Pacto de Sangue", desc: "Cura 1 vida a cada 20 abates; −1 vida máx.", apply: s => { s.lifesteal += 1; s.maxHp = Math.max(2, s.maxHp - 1); s.hp = Math.min(s.hp, s.maxHp); } },
  { id: "orbit", title: "Satélite Arcano", desc: "Um orbe gira e fere inimigos próximos", apply: s => { s.orbit += 1; } },
  { id: "thorns", title: "Espinhos", desc: "Devolve 4 dano ao receber um golpe", apply: s => { s.thorns += 4; } },
  { id: "armor", title: "Pele de Ferro", desc: "Reduz dano recebido em 20%", apply: s => { s.armor = Math.min(0.6, s.armor + 0.2); } },
  { id: "crit", title: "Ponto Fraco", desc: "+20% chance de dano triplo", apply: s => { s.crit = Math.min(0.8, s.crit + 0.2); } },
  { id: "rear", title: "Retaguarda", desc: "Também dispara para trás", apply: s => { s.rear = true; } },
  { id: "berserk", title: "Último Suspiro", desc: "Dano dobrado abaixo de 40% de vida", apply: s => { s.berserk = true; } },
  { id: "gold", title: "Caçador de Tesouros", desc: "Gemas valem 50% mais", apply: s => { s.gold += 0.5; } },
  { id: "push", title: "Impacto", desc: "Repele inimigos com força", apply: s => { s.knockback += 1; } },
  { id: "glass", title: "Canhão de Vidro", desc: "+80% dano; −3 vida máx.", apply: s => { s.damage *= 1.8; s.maxHp = Math.max(2, s.maxHp - 3); s.hp = Math.min(s.hp, s.maxHp); } },
  { id: "fan", title: "Tempestade", desc: "+3 tiros em leque; −25% dano", apply: s => { s.shots += 3; s.spread = 0.3; s.damage *= 0.75; } },
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
  { id: "knight", name: "Cavaleiro", desc: "Escudo: reduz dano em 25%. Espinhos devolvem golpes.", weapon: "sword", pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#6b7785", l: "#3a2a1a" }, base: { maxHp: 12, damage: 1.1, armor: 0.25, thorns: 2 } },
  { id: "mage", name: "Mago", desc: "Magia explode em área e começa com um orbe.", weapon: "staff", pal: { h: "#6a3fc4", s: "#f2c79a", e: "#111", b: "#4b2a8f", l: "#2a1a3a" }, base: { maxHp: 7, damage: 1.4, explosion: 14, orbit: 1 } },
  { id: "archer", name: "Arqueira", desc: "20% de críticos; flechas atravessam e alcançam longe.", weapon: "bow", pal: { h: "#2e7d32", s: "#f2c79a", e: "#111", b: "#558b2f", l: "#3a2a1a" }, base: { maxHp: 8, fireDelay: 0.85, life: 1.2, crit: 0.2, pierce: 1 } },
  { id: "rogue", name: "Ladino", desc: "20% de esquiva, veneno ardente e adaga extra.", weapon: "daggers", pal: { h: "#222", s: "#f2c79a", e: "#e33", b: "#3b3b3b", l: "#1a1a1a" }, base: { maxHp: 7, speed: 46, shots: 1, dodge: 0.2, burn: 1 } },
  { id: "cleric", name: "Clérigo", desc: "Regenera, atrai tesouros e usa um orbe sagrado.", weapon: "mace", pal: { h: "#f5f5f5", s: "#f2c79a", e: "#111", b: "#d4af37", l: "#5a4a32" }, base: { maxHp: 10, regen: 0.07, magnet: 45, orbit: 1 } },
  { id: "barbarian", name: "Bárbaro", desc: "Fúria abaixo de 40% de vida; cura a cada 20 abates.", weapon: "sword", pal: { h: "#c0602a", s: "#d9a77a", e: "#111", b: "#7a4a2a", l: "#3a2a1a" }, base: { maxHp: 9, damage: 1.4, berserk: true, lifesteal: 1, knockback: 1 } },
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

export type Phase = "play" | "cards" | "dead" | "win" | "paused";
export const DIFFICULTIES = {
  normal: { name: "Normal", hp: 1, damage: 1, speed: 1, spawn: 1, reward: 1 },
  hard: { name: "Difícil", hp: 1.4, damage: 1.6, speed: 1.2, spawn: 1.35, reward: 1.5 },
  nightmare: { name: "Pesadelo", hp: 2, damage: 2.3, speed: 1.4, spawn: 1.7, reward: 2 },
};
export interface Settings { speed: number; difficulty: keyof typeof DIFFICULTIES; volume: number; music: boolean; }
export const DEFAULT_SETTINGS: Settings = { speed: 1, difficulty: "hard", volume: 0.35, music: true };
export interface Place { id: string; name: string; waves: number; waveTime: number; diff: number; floor: string; floor2: string; wall: string; boss: string; bossKind: EnemyKind; pattern: "charge" | "ring" | "summon"; }
export const PLACES: Place[] = [
  { id: "vila", name: "Vila Abandonada", waves: 6, waveTime: 45, diff: 1, floor: "#3b3326", floor2: "#453b2c", wall: "#5a4a32", boss: "Zumbi Titã", bossKind: "zombie", pattern: "charge" },
  { id: "caverna", name: "Caverna Sombria", waves: 7, waveTime: 45, diff: 1.2, floor: "#22222e", floor2: "#2a2a38", wall: "#3c3c52", boss: "Rei Esqueleto", bossKind: "skeleton", pattern: "ring" },
  { id: "cripta", name: "Cripta das Múmias", waves: 8, waveTime: 45, diff: 1.4, floor: "#3a3020", floor2: "#433826", wall: "#6a5530", boss: "Faraó Ancestral", bossKind: "mummy", pattern: "summon" },
  { id: "bosque", name: "Bosque dos Condenados", waves: 6, waveTime: 50, diff: 1.15, floor: "#254030", floor2: "#2f4938", wall: "#183226", boss: "Raiz Cadavérica", bossKind: "zombie", pattern: "summon" },
  { id: "forte", name: "Fortaleza em Ruínas", waves: 7, waveTime: 50, diff: 1.5, floor: "#45494d", floor2: "#50565a", wall: "#313639", boss: "General Sem Alma", bossKind: "skeleton", pattern: "charge" },
  { id: "abismo", name: "Abismo das Cinzas", waves: 8, waveTime: 50, diff: 1.7, floor: "#42252d", floor2: "#4c2c33", wall: "#281c24", boss: "Imperatriz das Cinzas", bossKind: "mummy", pattern: "ring" },
];
export interface Obstacle { x: number; y: number; w: number; h: number; }
interface Hazard { x: number; y: number; vx: number; vy: number; life: number; }
interface Chest { x: number; y: number; opened: boolean; }

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
  settings: Settings;
  classId: string;
  bossSpawned = false;
  bossDefeated = false;
  hazards: Hazard[] = [];
  obstacles: Obstacle[] = [];
  chests: Chest[] = [];
  chestWave = 0;
  orbitT = 0;
  lastOrbit = 0;
  bossTell = 0;
  chargeX = 0; chargeY = 0; chargeT = 0;
  cardsTaken: string[] = [];
  get boss() { return this.enemies.find(e => e.boss && e.hp > 0); }
  setSettings(settings: Settings) { this.settings = { ...settings }; }
  togglePause() { if (this.phase === "play") this.phase = "paused"; else if (this.phase === "paused") this.phase = "play"; this.pointerActive = false; this.keys = {}; this.onChange(); }
  takeDamage(amount: number, enemy?: Enemy) {
    if (this.inv > 0 || this.phase !== "play") return;
    if (Math.random() < this.stats.dodge) { this.inv = 0.25; return; }
    this.stats.hp -= Math.max(0.5, amount * (1 - this.stats.armor));
    this.inv = 0.65; audio.play("hurt");
    if (enemy) enemy.hp -= this.stats.thorns;
    this.burst(this.px, this.py, "#ff3b5c", 6);
    if (this.stats.hp <= 0) { this.stats.hp = 0; this.phase = "dead"; audio.play("dead"); this.onChange(); }
  }
  blocked(x: number, y: number, r = 4) { return this.obstacles.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h); }
  spawnBoss() {
    const d = DIFFICULTIES[this.settings.difficulty];
    const hp = 150 * this.place.diff * d.hp;
    this.enemies.push({ x: this.px + 90, y: this.py, hp, maxHp: hp, kind: this.place.bossKind, speed: 20 * d.speed, dmg: 3 * d.damage, hit: 0, boss: true, slow: 0, burn: 0, cooldown: 3 });
    this.bossSpawned = true; audio.play("boss"); this.onChange();
  }
  enemies: Enemy[] = []; bullets: Bullet[] = []; loot: Loot[] = []; parts: Particle[] = [];
  fireT = 0; spawnT = 1; wave = 1; waveT = 0; total = 0; kills = 0; gems = 0; inv = 0;
  phase: Phase = "play";
  offer: Card[] = [];
  onChange: () => void;

  constructor(canvas: HTMLCanvasElement, place: Place, onChange: () => void, cls: HeroClass, weapon: Weapon, up: Upgrades, settings: Settings = DEFAULT_SETTINGS) {
    this.settings = { ...settings }; this.classId = cls.id;
    this.weapon = weapon;
    const s: Stats = { armor: 0, crit: 0, dodge: 0, explosion: 0, slow: 0, burn: 0, lifesteal: 0, orbit: 0, thorns: 0, gold: 1, knockback: 0.2, rear: false, berserk: false, damage: weapon.dmg, fireDelay: weapon.delay, speed: 42, shots: weapon.shots, pierce: weapon.pierce, maxHp: 8, hp: 8, bulletSpeed: weapon.speed, magnet: 20, life: weapon.life, regen: 0, spread: weapon.spread || 0.15 };
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
    for (const key of ["armor", "crit", "dodge", "explosion", "slow", "burn", "lifesteal", "orbit", "thorns", "knockback", "berserk"] as const) {
      const value = b[key]; if (value !== undefined) Object.assign(s, { [key]: value });
    }
    if (b.pierce) s.pierce += b.pierce;
    s.hp = s.maxHp;
    this.stats = s;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas indisponível"); this.ctx = ctx;
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
    const f = this.floor.getContext("2d"); if (!f) throw new Error("Canvas indisponível");
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
    const difficulty = DIFFICULTIES[this.settings.difficulty];
    const diff = this.place.diff * difficulty.hp * (1 + (this.wave - 1) * 0.18);
    let kind: EnemyKind = "zombie";
    if (this.wave >= 2 && r < 0.3) kind = "skeleton";
    if (this.wave >= 3 && r > 0.85) kind = "mummy";
    const base = kind === "zombie" ? { hp: 4, sp: 25, dmg: 1.5 } : kind === "skeleton" ? { hp: 3, sp: 37, dmg: 1 } : { hp: 12, sp: 20, dmg: 2.5 };
    const x = Math.max(-ARENA, Math.min(ARENA, this.px + Math.cos(a) * 190));
    const y = Math.max(-ARENA, Math.min(ARENA, this.py + Math.sin(a) * 190));
    this.enemies.push({ x, y, hp: base.hp * diff, kind, maxHp: base.hp * diff, speed: base.sp * difficulty.speed * (0.9 + Math.random() * 0.2), dmg: base.dmg * difficulty.damage * (1 + (this.wave - 1) * 0.08), hit: 0, slow: 0, burn: 0, cooldown: 2 + Math.random() * 2 });
  }

  rollCards() {
    const pool = CARD_POOL.filter(c => !(c.id === "rear" && this.stats.rear) && !(c.id === "berserk" && this.stats.berserk));
    this.offer = [];
    while (this.offer.length < 3 && pool.length) { const card = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; if (card) this.offer.push(card); }
  }

  pick(i: number) {
    if (this.phase !== "cards" || !this.offer[i]) return;
    const card = this.offer[i]; if (!card) return;
    card.apply(this.stats); this.cardsTaken.push(card.title); audio.play("card");
    this.stats.shots = Math.min(12, this.stats.shots); this.stats.orbit = Math.min(5, this.stats.orbit); this.stats.fireDelay = Math.max(0.12, this.stats.fireDelay);
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
    this.px = Math.max(-ARENA, Math.min(ARENA, this.px + dx * Math.min(70, s.speed) * this.settings.speed * dt));
    this.py = Math.max(-ARENA, Math.min(ARENA, this.py + dy * Math.min(70, s.speed) * this.settings.speed * dt));

    if (!this.obstacles.length) {
      for (let i = 0; i < 24; i++) {
        const angle = i * 2.4, radius = 65 + (i % 4) * 45;
        this.obstacles.push({ x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius), w: 12 + (i % 3) * 4, h: 14 });
      }
    }
    // Resolve movement separately along each axis to slide along walls.
    const oldX = this.px - dx * Math.min(70, s.speed) * this.settings.speed * dt;
    const oldY = this.py - dy * Math.min(70, s.speed) * this.settings.speed * dt;
    if (this.blocked(this.px, oldY)) this.px = oldX;
    if (this.blocked(this.px, this.py)) this.py = oldY;
    if (this.chestWave !== this.wave) {
      this.chestWave = this.wave;
      let x = 0, y = 0;
      for (let i = 0; i < 20; i++) { x = this.px + (Math.random() - 0.5) * 180; y = this.py + (Math.random() - 0.5) * 130; if (!this.blocked(x, y, 10)) break; }
      this.chests.push({ x, y, opened: false });
    }
    for (const chest of this.chests) if (!chest.opened && dist(chest.x - this.px, chest.y - this.py) < 12) {
      chest.opened = true; this.gems += Math.round((8 + this.wave * 2) * s.gold * DIFFICULTIES[this.settings.difficulty].reward);
      s.hp = Math.min(s.maxHp, s.hp + 2); audio.play("chest"); this.burst(chest.x, chest.y, "#ffd23f", 8); this.onChange();
    }
    // Auto-fire at the nearest enemy in range
    this.fireT -= dt;
    if (this.fireT <= 0) {
      let best: Enemy | null = null, bd = this.range();
      for (const e of this.enemies) { const d = dist(e.x - this.px, e.y - this.py); if (d < bd) { bd = d; best = e; } }
      if (best) {
        this.fireT = s.fireDelay; audio.play("shot");
        const base = Math.atan2(best.y - this.py, best.x - this.px);
        for (let i = 0; i < Math.min(12, s.shots) * (s.rear ? 2 : 1) && this.bullets.length < 100; i++) {
          const a = base + (i >= s.shots ? Math.PI : 0) + ((i % s.shots) - (s.shots - 1) / 2) * s.spread;
          this.bullets.push({ x: this.px, y: this.py, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, life: s.life, pierce: s.pierce, hits: [] });
        }
      }
    }

    if (s.regen > 0 && s.hp < s.maxHp) { this.regenAcc += s.regen * dt; if (this.regenAcc >= 1) { this.regenAcc = 0; s.hp++; } }

    // Spawning
    this.spawnT -= dt;
    const rate = Math.max(0.3, 1.15 - this.wave * 0.1) / (this.place.diff * DIFFICULTIES[this.settings.difficulty].spawn);
    if (this.waveT < this.place.waveTime && this.spawnT <= 0) { this.spawnT = rate; this.spawnEnemy(); }

    if (this.wave === this.place.waves && !this.bossSpawned && this.waveT >= this.place.waveTime * 0.5) this.spawnBoss();
    this.orbitT += dt; this.lastOrbit -= dt; this.bossTell -= dt; this.chargeT -= dt;
    if (s.orbit && this.lastOrbit <= 0) {
      this.lastOrbit = 0.35;
      for (let i = 0; i < s.orbit; i++) {
        const a = this.orbitT * 2 + i * Math.PI * 2 / s.orbit;
        for (const e of this.enemies) if (dist(e.x - this.px - Math.cos(a) * 23, e.y - this.py - Math.sin(a) * 23) < 9) { e.hp -= s.damage * 0.6; e.hit = 0.1; }
      }
    }
    // Enemies
    for (const e of this.enemies) {
      const ex = this.px - e.x, ey = this.py - e.y, d = dist(ex, ey) || 1;
      if (e.hp <= 0) continue;
      e.slow = Math.max(0, e.slow - dt); e.burn = Math.max(0, e.burn - dt);
      if (e.burn > 0) e.hp -= s.burn * dt;
      const speed = e.speed * (e.slow > 0 ? 1 - s.slow : 1);
      const nx = e.x + (ex / d) * speed * dt, ny = e.y + (ey / d) * speed * dt;
      if (e.boss || !this.blocked(nx, e.y)) e.x = nx; else e.y += Math.sign(ex) * speed * dt;
      if (e.boss || !this.blocked(e.x, ny)) e.y = ny; else e.x += Math.sign(ey) * speed * dt;
      e.cooldown -= dt;
      if (e.boss) {
        if (e.cooldown <= 0) {
          e.cooldown = e.hp < e.maxHp / 2 ? 2.5 : 4;
          if (this.place.pattern === "charge") { this.chargeX = ex / d; this.chargeY = ey / d; this.bossTell = 0.75; this.chargeT = 1.5; }
          else {
            const count = this.place.pattern === "ring" ? 12 : 6;
            for (let i = 0; i < count && this.hazards.length < 50; i++) { const a = i * Math.PI * 2 / count + this.total; this.hazards.push({ x: e.x, y: e.y, vx: Math.cos(a) * 65, vy: Math.sin(a) * 65, life: 4 }); }
            if (this.place.pattern === "summon") for (let i = 0; i < 4; i++) this.spawnEnemy();
          }
        }
        if (this.place.pattern === "charge" && this.chargeT > 0 && this.bossTell <= 0) { e.x += this.chargeX * 120 * dt; e.y += this.chargeY * 120 * dt; }
      } else if (e.kind === "skeleton" && e.cooldown <= 0 && d < 160) {
        e.cooldown = 3.5;
        if (this.hazards.length < 50) this.hazards.push({ x: e.x, y: e.y, vx: ex / d * 70, vy: ey / d * 70, life: 2.5 });
      }
      e.hit -= dt;
      if (d < (e.boss ? 15 : 7)) { this.takeDamage(e.dmg, e); if (this.phase !== "play") return; }
    }
    for (const h of this.hazards) {
      h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
      if (this.blocked(h.x, h.y, 1)) h.life = 0;
      if (dist(h.x - this.px, h.y - this.py) < 5) { this.takeDamage(1.5 * DIFFICULTIES[this.settings.difficulty].damage); h.life = 0; }
    }
    this.hazards = this.hazards.filter(h => h.life > 0);
    if (this.phase !== "play") return;

    const n = this.enemies.length;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const a = this.enemies[i], b = this.enemies[j]; if (!a || !b) continue;
        const ddx = a.x - b.x, ddy = a.y - b.y;
        if (ddx > 7 || ddx < -7 || ddy > 7 || ddy < -7) continue;
        const d = dist(ddx, ddy);
        if (d > 0 && d < 7) { const p = (7 - d) / 2; a.x += (ddx / d) * p; a.y += (ddy / d) * p; b.x -= (ddx / d) * p; b.y -= (ddy / d) * p; }
      }

    // Bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (this.blocked(b.x, b.y, 1)) { b.life = 0; continue; }
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hits.indexOf(e) >= 0) continue;
        if (Math.abs(e.x - b.x) < (e.boss ? 13 : 6) && Math.abs(e.y - b.y) < (e.boss ? 13 : 6)) {
          const damage = s.damage * (Math.random() < s.crit ? 3 : 1) * (s.berserk && s.hp < s.maxHp * 0.4 ? 2 : 1);
          e.hp -= damage; e.hit = 0.12; b.hits.push(e); audio.play("hit");
          if (s.slow) e.slow = 2; if (s.burn) e.burn = 3;
          if (!e.boss) { e.x += b.vx * 0.006 * s.knockback; e.y += b.vy * 0.006 * s.knockback; }
          if (s.explosion) { for (const other of this.enemies) if (other !== e && dist(other.x - e.x, other.y - e.y) < s.explosion) { other.hp -= damage * 0.4; other.hit = 0.1; } this.burst(e.x, e.y, "#ff8a3d", 3); }

          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
    for (const e of this.enemies) if (e.hp <= 0) {
      this.kills++; this.burst(e.x, e.y, "#d9c79a", 4);
      if (s.lifesteal && this.kills % 20 === 0) s.hp = Math.min(s.maxHp, s.hp + s.lifesteal);
      if (e.boss) { this.bossDefeated = true; this.gems += Math.round(60 * this.place.diff * DIFFICULTIES[this.settings.difficulty].reward); }
      else if (this.loot.length < 100) this.loot.push({ x: e.x, y: e.y, type: Math.random() < 0.025 ? "heart" : "gem" });
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    for (const l of this.loot) {
      const ddx = this.px - l.x, ddy = this.py - l.y, d = dist(ddx, ddy);
      if (d < s.magnet && d > 0) { l.x += (ddx / d) * 120 * dt; l.y += (ddy / d) * 120 * dt; }
      if (d < 6) { if (l.type === "gem") this.gems += s.gold * DIFFICULTIES[this.settings.difficulty].reward; else s.hp = Math.min(s.maxHp, s.hp + 1); l.got = true; audio.play("loot"); }
    }
    this.loot = this.loot.filter((l) => !l.got);

    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);

    if (this.waveT >= this.place.waveTime && this.enemies.length === 0 && (this.wave < this.place.waves || this.bossDefeated)) {
      // auto-collect leftover loot
      for (const l of this.loot) if (l.type === "gem") this.gems += s.gold * DIFFICULTIES[this.settings.difficulty].reward;
      this.loot = [];
      if (this.wave >= this.place.waves) { this.phase = "win"; audio.play("win"); }
      else { this.rollCards(); this.phase = "cards"; audio.play("card"); }
      this.hazards = []; this.pointerActive = false; this.keys = {};
      this.onChange();
    }
  }

  draw() {
    const g = this.ctx, cx = Math.round(this.px - W / 2), cy = Math.round(this.py - H / 2);
    const half = this.floor.width / 2;
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    g.drawImage(this.floor, cx + half, cy + half, W, H, 0, 0, W, H);
    for (const o of this.obstacles) { g.fillStyle = this.place.wall; g.fillRect(o.x - cx, o.y - cy, o.w, o.h); g.fillStyle = "#96968a"; g.fillRect(o.x - cx + 2, o.y - cy + 2, o.w - 4, 3); }
    for (const chest of this.chests) { g.fillStyle = chest.opened ? "#665744" : "#be8740"; g.fillRect(chest.x - cx - 5, chest.y - cy - 4, 10, 8); g.fillStyle = "#ffe066"; g.fillRect(chest.x - cx - 1, chest.y - cy - 2, 2, 3); }
    for (const l of this.loot) { const sprite = this.sprites[l.type]; if (sprite) g.drawImage(sprite, Math.round(l.x - cx - 2), Math.round(l.y - cy - 2)); }
    for (const e of this.enemies) {
      const ex = Math.round(e.x - cx - 4), ey = Math.round(e.y - cy - 4);
      if (ex < -8 || ey < -8 || ex > W || ey > H) continue;
      if (e.hit > 0) g.globalAlpha = 0.5;
      const sprite = this.sprites[e.kind];
      if (sprite) g.drawImage(sprite, ex - (e.boss ? 8 : 0), ey - (e.boss ? 8 : 0), e.boss ? 24 : 8, e.boss ? 24 : 8);
      if (e.hp < e.maxHp) { g.fillStyle = "#382128"; g.fillRect(ex, ey - 3, 8, 1); g.fillStyle = "#ff3b5c"; g.fillRect(ex, ey - 3, Math.ceil(8 * e.hp / e.maxHp), 1); }
      if (e.hit > 0) g.globalAlpha = 1;
    }
    if (this.inv <= 0 || Math.floor(this.inv * 20) % 2) {
      g.save();
      g.translate(Math.round(this.px - cx), Math.round(this.py - cy));
      g.scale(this.face, 1);
      const hero = this.sprites["hero"]; if (hero) g.drawImage(hero, -4, -4);
      g.restore();
    }
    g.fillStyle = "#ff3b5c";
    for (const h of this.hazards) g.fillRect(Math.round(h.x - cx - 1), Math.round(h.y - cy - 1), 3, 3);
    if (this.bossTell > 0 && this.boss) { g.strokeStyle = "#ff3b5c"; g.beginPath(); g.moveTo(this.boss.x - cx, this.boss.y - cy); g.lineTo(this.boss.x - cx + this.chargeX * 150, this.boss.y - cy + this.chargeY * 150); g.stroke(); }
    g.fillStyle = "#7fdfff";
    for (let i = 0; i < this.stats.orbit; i++) { const a = this.orbitT * 2 + i * Math.PI * 2 / this.stats.orbit; g.fillRect(Math.round(W / 2 + Math.cos(a) * 23 - 2), Math.round(H / 2 + Math.sin(a) * 23 - 2), 4, 4); }
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
