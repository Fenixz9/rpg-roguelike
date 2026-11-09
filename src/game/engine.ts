import { audio } from "./audio";
// Pixel roguelike engine (Vampire Survivors style) — plain canvas 2D, no modern-only APIs (Tizen-safe).
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
      if (ch !== "." && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
    }
  return c;
}
/** Second walking frame: legs (last row) step outward. */
export function stepFrame(rows: string[]): string[] {
  const last = rows[rows.length - 1] || "";
  const out: string[] = [];
  for (let i = 0; i < last.length; i++) out.push(".");
  const half = last.length / 2;
  for (let i = 0; i < last.length; i++) {
    const ch = last[i]; if (!ch || ch === ".") continue;
    const j = i < half ? Math.max(0, i - 1) : Math.min(last.length - 1, i + 1);
    out[j] = ch;
  }
  return rows.slice(0, -1).concat([out.join("")]);
}
const whitePal = (pal: Record<string, string>) => { const p: Record<string, string> = {}; for (const k of Object.keys(pal)) p[k] = "#ffffff"; return p; };
const dist = (x: number, y: number) => Math.sqrt(x * x + y * y);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const HERO = ["..hhhh..", ".hhhhhh.", ".hsesse.", ".hssss..", "..bbbb..", ".sbbbbs.", "..bbbb..", "..l..l.."];
const CREW = ["..bbbb..", ".bbbbbb.", "bbvvvvb.", "bbvvvvbb", "bbbbbbbb", "bbbbbbbb", ".bbbbbb.", ".bb..bb."];
const PLUMBER = ["..hhhh..", ".hhhhhh.", ".sseses.", ".smmmms.", "..bbbb..", ".hbbbbh.", "..bbbb..", ".ll..ll."];
const HEDGEHOG = ["hhhhh...", ".hhhhhh.", "hhhsesh.", ".hhsssh.", "..hhhh..", ".shhhhs.", "..hhhh..", ".ll..ll."];
const BLOCKY = ["hhhhhhhh", "hsssssss", "hseesses", "hsssssss", "bbbbbbbb", "sbbbbbbs", ".llllll.", ".ll..ll."];
const ROBOT = ["...hh...", ".hhhhhh.", ".heehee.", ".hhhhhh.", "bbbbbbbb", "s.bbbb.s", "..bbbb..", ".ll..ll."];
const BLOB = "........,..bbbb..,.bbbbbb.,bbebbebb,bbbbbbbb,bbbbbbbb,bbbbbbbb,.bbbbbb.".split(",");

const ZOMBIE = ["..gggg..", ".gggggg.", ".grggrg.", ".gggggg.", "gcccccg.", "..cccc.g", "..cccc..", "..g..g.."];
const SKELETON = ["..wwww..", ".wwwwww.", ".wkwwkw.", "..wkkw..", "...ww...", ".wwwwww.", "...ww...", "..w..w.."];
const MUMMY = ["..mmmm..", ".mmnmmm.", ".mymmym.", ".nmmmmn.", "mmmnmmmm", "..mmnm..", "..mmmm..", "..m..m.."];
const BAT = ["........", "b......b", "bb.bb.bb", "bbbbbbbb", ".bbrrbb.", "..bbbb..", "...bb...", "........"];
const GHOST = ["..wwww..", ".wwwwww.", ".wkwwkw.", ".wwwwww.", ".wwkkww.", ".wwwwww.", ".wwwwww.", ".w.ww.w."];
const SLIME = ["........", "........", "...gg...", "..gggg..", ".gwggwg.", ".gkggkg.", "gggggggg", ".gggggg."];
const GHOUL = ["..pppp..", ".pppppp.", ".prpprp.", ".pkkkkp.", "pppppppp", "p.pppp.p", "..pppp..", ".p....p."];
const IMP = ["r......r", "rr.rr.rr", ".rrrrrr.", ".ryrryr.", ".rrrrrr.", "..rrrr..", ".r.rr.r.", ".r....r."];
const WRAITH = ["..pppp..", ".pppppp.", ".pyppyp.", ".pppppp.", "pppppppp", "pppppppp", ".p.pp.p.", "p..p..p."];
const SPIDER = ["........", "k.k..k.k", ".kkkkkk.", "kkrkkrkk", ".kkkkkk.", "k.kkkk.k", "k......k", "........"];
const HEART = [".r.r.", "rrrrr", "rrrrr", ".rrr.", "..r.."];
const GEM = [".c.", "ccc", ".c."];
const BIGGEM = ["..c..", ".ccc.", "ccwcc", ".ccc.", "..c.."];

export type EnemyKind = "zombie" | "skeleton" | "mummy" | "bat" | "ghost" | "slime" | "ghoul" | "brute" | "imp" | "wraith" | "spider";
interface EnemyDef { name: string; rows: string[]; pal: Record<string, string>; hp: number; sp: number; dmg: number; size: number; xp: number; fly?: boolean; shoot?: number; }
export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  zombie: { name: "Zumbi", rows: ZOMBIE, pal: { g: "#6fa34a", r: "#e33", c: "#5b4a7a" }, hp: 4, sp: 22, dmg: 1.5, size: 8, xp: 1 },
  skeleton: { name: "Esqueleto", rows: SKELETON, pal: { w: "#e8e4d8", k: "#222" }, hp: 3, sp: 34, dmg: 1, size: 8, xp: 1, shoot: 4 },
  mummy: { name: "Múmia", rows: MUMMY, pal: { m: "#d9c79a", n: "#a8946a", y: "#ffd23f" }, hp: 12, sp: 18, dmg: 2.5, size: 9, xp: 2 },
  bat: { name: "Morcego", rows: BAT, pal: { b: "#4a3a5a", r: "#ff3b5c" }, hp: 1.5, sp: 52, dmg: 0.8, size: 7, xp: 1, fly: true },
  ghost: { name: "Fantasma", rows: GHOST, pal: { w: "#cfe8ff", k: "#223" }, hp: 3, sp: 28, dmg: 1.2, size: 8, xp: 1, fly: true },
  slime: { name: "Gosma", rows: SLIME, pal: { g: "#7ad04a", w: "#fff", k: "#123" }, hp: 9, sp: 15, dmg: 1.5, size: 9, xp: 2 },
  ghoul: { name: "Carniçal", rows: GHOUL, pal: { p: "#8a7a9a", r: "#ff3b5c", k: "#222" }, hp: 5, sp: 46, dmg: 1.6, size: 8, xp: 1 },
  brute: { name: "Bruto", rows: ZOMBIE, pal: { g: "#4d7a35", r: "#ff8a3d", c: "#6a2a2a" }, hp: 30, sp: 15, dmg: 3.5, size: 14, xp: 6 },
  imp: { name: "Diabrete", rows: IMP, pal: { r: "#d0402a", y: "#ffd23f" }, hp: 4, sp: 26, dmg: 1, size: 8, xp: 2, shoot: 2.8 },
  wraith: { name: "Espectro", rows: WRAITH, pal: { p: "#6a4a9a", y: "#7fdfff" }, hp: 7, sp: 32, dmg: 2, size: 9, xp: 2, fly: true, shoot: 3.5 },
  spider: { name: "Aranha", rows: SPIDER, pal: { k: "#2a2230", r: "#ff3b5c" }, hp: 2.5, sp: 60, dmg: 1, size: 8, xp: 1 },
};

export interface Enemy { x: number; y: number; hp: number; kind: EnemyKind; speed: number; dmg: number; hit: number; maxHp: number; boss?: boolean; elite?: boolean; size: number; slow: number; burn: number; freeze: number; cooldown: number; face: number; seed: number; }
type BulletKind = "bolt" | "whip" | "boomerang" | "homing" | "wave" | "bomb";
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; max: number; pierce: number; hits: Enemy[]; kind: BulletKind; size: number; color: string; dmg: number; dx: number; dy: number; ox: number; oy: number; }
interface Loot { x: number; y: number; type: "gem" | "big" | "heart"; value: number; got?: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Fx { kind: "line" | "ring" | "text" | "slash"; x: number; y: number; x2: number; y2: number; r: number; life: number; max: number; color: string; text?: string; }
interface Zone { x: number; y: number; r: number; life: number; dmg: number; color: string; }

export interface Stats {
  armor: number; crit: number; dodge: number; explosion: number; slow: number; burn: number; lifesteal: number; orbit: number; thorns: number; gold: number; knockback: number; rear: boolean; berserk: boolean;
  damage: number; fireDelay: number; speed: number; shots: number; pierce: number; maxHp: number; hp: number; bulletSpeed: number; magnet: number; life: number; regen: number; spread: number;
  size: number; xpMul: number; curse: number; cdMul: number; nova: number; stomp: number; drones: number; trail: number; freeze: number; growth: number; vent: number; luck: number; revive: number; execute: number;
}
export type Rarity = "comum" | "rara" | "épica" | "lendária";
export interface Card { id: string; title: string; desc: string; rarity: Rarity; tier: number; apply: (s: Stats) => void; }

// ---------- 150+ cards: 26 stat families × 5 tiers + transformative specials ----------
const ROMAN = ["I", "II", "III", "IV", "V"];
const RAR: Rarity[] = ["comum", "comum", "rara", "épica", "lendária"];
const cap = (v: number, m: number) => Math.min(m, v);
type Family = [string, string, (t: number) => string, (s: Stats, t: number) => void, number?];
const FAMILIES: Family[] = [
  ["dmg", "Lâmina Afiada", t => "+" + 8 * t + "% dano", (s, t) => { s.damage *= 1 + 0.08 * t; }],
  ["rate", "Gatilho Rápido", t => "+" + 6 * t + "% cadência", (s, t) => { s.fireDelay *= 1 - 0.06 * t; }],
  ["spd", "Botas Leves", t => "+" + 5 * t + "% velocidade", (s, t) => { s.speed *= 1 + 0.05 * t; }],
  ["hp", "Coração Forte", t => "+" + t + " vida máx. e cura", (s, t) => { s.maxHp += t; s.hp += t; }],
  ["mag", "Ímã", t => "+" + 12 * t + " alcance de coleta", (s, t) => { s.magnet += 12 * t; }],
  ["regen", "Bênção", t => "Regenera " + (0.04 * t).toFixed(2) + " vida/s", (s, t) => { s.regen += 0.04 * t; }],
  ["range", "Alcance", t => "+" + 8 * t + "% alcance", (s, t) => { s.life *= 1 + 0.08 * t; }],
  ["area", "Onda de Choque", t => "Explosão +" + 6 * t + " de área", (s, t) => { s.explosion += 6 * t; }],
  ["crit", "Ponto Fraco", t => "+" + 5 * t + "% crítico (×3)", (s, t) => { s.crit = cap(s.crit + 0.05 * t, 0.85); }],
  ["armor", "Pele de Ferro", t => "−" + 5 * t + "% dano recebido", (s, t) => { s.armor = cap(s.armor + 0.05 * t, 0.7); }],
  ["dodge", "Reflexos", t => "+" + 4 * t + "% esquiva", (s, t) => { s.dodge = cap(s.dodge + 0.04 * t, 0.6); }],
  ["gold", "Caçador de Tesouros", t => "Gemas +" + 15 * t + "%", (s, t) => { s.gold += 0.15 * t; }],
  ["xp", "Sabedoria", t => "+" + 10 * t + "% experiência", (s, t) => { s.xpMul += 0.1 * t; }],
  ["push", "Impacto", t => "+" + 25 * t + "% repulsão", (s, t) => { s.knockback += 0.25 * t; }],
  ["thorns", "Espinhos", t => "Devolve " + 2 * t + " dano por golpe", (s, t) => { s.thorns += 2 * t; }],
  ["burn", "Combustão", t => "Incendeia: +" + t + " dano/s", (s, t) => { s.burn += t; }],
  ["size", "Projéteis Gigantes", t => "+" + 12 * t + "% tamanho dos tiros", (s, t) => { s.size *= 1 + 0.12 * t; }],
  ["vel", "Pólvora Fina", t => "+" + 8 * t + "% velocidade dos tiros", (s, t) => { s.bulletSpeed *= 1 + 0.08 * t; }],
  ["cd", "Relógio Antigo", t => "Poderes recarregam " + 6 * t + "% mais rápido", (s, t) => { s.cdMul *= 1 - 0.06 * t; }],
  ["curse", "Maldição", t => "+" + 10 * t + "% inimigos e +" + 10 * t + "% gemas", (s, t) => { s.curse += 0.1 * t; s.gold += 0.1 * t; }],
  ["frost", "Toque Gélido", t => t * 4 + "% chance de congelar", (s, t) => { s.freeze = cap(s.freeze + 0.04 * t, 0.5); s.slow = Math.max(s.slow, 0.3); }],
  ["nova", "Pulso Arcano", t => "Pulso de " + 6 * t + " tiros em volta", (s, t) => { s.nova += t; }, 3],
  ["stomp", "Terremoto", t => "Pisão periódico de raio +" + 10 * t, (s, t) => { s.stomp += 10 * t; }, 3],
  ["trail", "Rastro de Fogo", t => "Deixa fogo ao andar (" + t * 3 + " dano/s)", (s, t) => { s.trail += 3 * t; }, 3],
  ["drone", "Drone Ajudante", t => "+" + t + " drone(s) atirador(es)", (s, t) => { s.drones += t; }, 2],
  ["exec", "Executor", t => "Executa inimigos com menos de " + 4 * t + "% de vida", (s, t) => { s.execute = cap(s.execute + 0.04 * t, 0.25); }, 3],
];
const SPECIALS: Card[] = [
  { id: "multi", title: "Tiro Duplo", desc: "+1 projétil", rarity: "rara", tier: 2, apply: s => { s.shots += 1; } },
  { id: "multi2", title: "Tiro Triplo", desc: "+2 projéteis", rarity: "épica", tier: 4, apply: s => { s.shots += 2; } },
  { id: "pierce", title: "Perfurante", desc: "Atravessa +1 inimigo", rarity: "rara", tier: 2, apply: s => { s.pierce += 1; } },
  { id: "pierce2", title: "Lança Fantasma", desc: "Atravessa +3 inimigos", rarity: "épica", tier: 4, apply: s => { s.pierce += 3; } },
  { id: "heal", title: "Poção", desc: "Cura toda a vida", rarity: "comum", tier: 1, apply: s => { s.hp = s.maxHp; } },
  { id: "vampire", title: "Pacto de Sangue", desc: "Cura 1 a cada 15 abates; −1 vida máx.", rarity: "rara", tier: 2, apply: s => { s.lifesteal += 1; s.maxHp = Math.max(2, s.maxHp - 1); s.hp = Math.min(s.hp, s.maxHp); } },
  { id: "orbit", title: "Satélite Arcano", desc: "+1 orbe giratório", rarity: "rara", tier: 2, apply: s => { s.orbit += 1; } },
  { id: "orbit2", title: "Anel de Orbes", desc: "+3 orbes giratórios", rarity: "lendária", tier: 5, apply: s => { s.orbit += 3; } },
  { id: "rear", title: "Retaguarda", desc: "Também dispara para trás", rarity: "rara", tier: 2, apply: s => { s.rear = true; } },
  { id: "berserk", title: "Último Suspiro", desc: "Dano dobrado abaixo de 40% de vida", rarity: "rara", tier: 2, apply: s => { s.berserk = true; } },
  { id: "glass", title: "Canhão de Vidro", desc: "+80% dano; −3 vida máx.", rarity: "épica", tier: 3, apply: s => { s.damage *= 1.8; s.maxHp = Math.max(2, s.maxHp - 3); s.hp = Math.min(s.hp, s.maxHp); } },
  { id: "fan", title: "Tempestade", desc: "+3 tiros em leque; −25% dano", rarity: "épica", tier: 3, apply: s => { s.shots += 3; s.spread = Math.max(s.spread, 0.3); s.damage *= 0.75; } },
  { id: "tank", title: "Fortaleza Viva", desc: "+8 vida máx.; −15% velocidade", rarity: "épica", tier: 3, apply: s => { s.maxHp += 8; s.hp += 8; s.speed *= 0.85; } },
  { id: "speedster", title: "Raio Humano", desc: "+30% velocidade; −2 vida máx.", rarity: "rara", tier: 2, apply: s => { s.speed *= 1.3; s.maxHp = Math.max(2, s.maxHp - 2); s.hp = Math.min(s.hp, s.maxHp); } },
  { id: "phoenix", title: "Pena de Fênix", desc: "Revive uma vez com vida cheia", rarity: "lendária", tier: 5, apply: s => { s.revive += 1; } },
  { id: "growth", title: "Fome de Batalha", desc: "+1% dano a cada 10 abates", rarity: "épica", tier: 3, apply: s => { s.growth += 0.01; } },
  { id: "vent", title: "Duto Secreto", desc: "Teleporta e explode a cada 5s", rarity: "épica", tier: 4, apply: s => { s.vent = s.vent ? s.vent * 0.8 : 5; } },
  { id: "luck", title: "Trevo de 4 Folhas", desc: "Uma carta extra para escolher", rarity: "lendária", tier: 4, apply: s => { s.luck = cap(s.luck + 1, 2); } },
  { id: "overload", title: "Sobrecarga", desc: "+50% cadência; −20% dano", rarity: "épica", tier: 3, apply: s => { s.fireDelay *= 0.5; s.damage *= 0.8; } },
  { id: "sniper", title: "Olho de Águia", desc: "+60% alcance e +40% dano; −1 projétil", rarity: "épica", tier: 3, apply: s => { s.life *= 1.6; s.damage *= 1.4; s.shots = Math.max(1, s.shots - 1); } },
  { id: "gambit", title: "Aposta Arriscada", desc: "+100% gemas; inimigos +30%", rarity: "rara", tier: 2, apply: s => { s.gold += 1; s.curse += 0.3; } },
  { id: "holy", title: "Aura Sagrada", desc: "Pulso + pisão + regen", rarity: "lendária", tier: 5, apply: s => { s.nova += 1; s.stomp += 15; s.regen += 0.08; } },
  { id: "army", title: "Esquadrão", desc: "+2 drones e +1 orbe", rarity: "lendária", tier: 5, apply: s => { s.drones += 2; s.orbit += 1; } },
  { id: "inferno", title: "Inferno", desc: "Fogo ao andar, queimadura e explosão", rarity: "lendária", tier: 5, apply: s => { s.trail += 4; s.burn += 2; s.explosion += 10; } },
  { id: "zero", title: "Zero Absoluto", desc: "25% de congelar e +20% dano", rarity: "lendária", tier: 5, apply: s => { s.freeze = cap(s.freeze + 0.25, 0.5); s.slow = 0.5; s.damage *= 1.2; } },
  { id: "titan", title: "Sangue de Titã", desc: "+30% tamanho, +30% dano, +4 vida", rarity: "lendária", tier: 5, apply: s => { s.size *= 1.3; s.damage *= 1.3; s.maxHp += 4; s.hp += 4; } },
];
export const CARD_POOL: Card[] = (() => {
  const list: Card[] = [];
  for (const [id, title, desc, apply, maxT] of FAMILIES)
    for (let t = 1; t <= (maxT || 5); t++) list.push({ id: id + t, title: title + " " + ROMAN[t - 1], desc: desc(t), rarity: RAR[t - 1] || "comum", tier: t, apply: s => apply(s, t) });
  return list.concat(SPECIALS);
})();

// ---------- Weapons ----------
export type WeaponKind = "bolt" | "whip" | "boomerang" | "homing" | "wave" | "bomb" | "nova" | "chain" | "rain" | "laser";
export interface Weapon { id: string; name: string; desc: string; cost: number; color: string; kind: WeaponKind; size: number; dmg: number; delay: number; speed: number; life: number; pierce: number; shots: number; spread: number; }
const wp = (id: string, name: string, desc: string, cost: number, kind: WeaponKind, color: string, size: number, dmg: number, delay: number, speed: number, life: number, pierce: number, shots: number, spread = 0.15): Weapon => ({ id, name, desc, cost, kind, color, size, dmg, delay, speed, life, pierce, shots, spread });
export const WEAPONS: Weapon[] = [
  wp("sword", "Espada", "Corte largo à frente", 0, "whip", "#dfe6ee", 16, 2.2, 0.75, 0, 0.2, 99, 1),
  wp("staff", "Cajado de Fogo", "Bola de fogo que explode", 0, "bomb", "#ff8a3d", 4, 3, 0.9, 110, 0.9, 0, 1),
  wp("bow", "Arco Curto", "Flechas rápidas e longas", 0, "bolt", "#ffe066", 2, 1.3, 0.38, 230, 0.8, 0, 1),
  wp("daggers", "Adagas", "Duas adagas por vez", 0, "bolt", "#cfd8dc", 2, 0.9, 0.3, 190, 0.6, 0, 2, 0.2),
  wp("mace", "Maça Sagrada", "Bumerangue sagrado", 0, "boomerang", "#fff59d", 4, 1.8, 0.8, 150, 1.2, 4, 1),
  wp("knife", "Faca do Impostor", "Facadas rapidíssimas", 0, "bolt", "#e8e8e8", 3, 1.4, 0.22, 200, 0.35, 1, 1),
  wp("hammer", "Martelo de Pedreiro", "Golpe esmagador em volta", 0, "whip", "#b07040", 22, 3.5, 1.1, 0, 0.22, 99, 1),
  wp("fireflower", "Flor de Fogo", "Bolas de fogo que quicam", 0, "bomb", "#ff5a2a", 4, 2.2, 0.6, 140, 0.8, 0, 1),
  wp("pistol", "Revólver", "Tiro certeiro e rápido", 0, "bolt", "#ffd23f", 2, 1.6, 0.32, 280, 0.7, 0, 1),
  wp("wand", "Varinha Mágica", "Mísseis teleguiados", 0, "homing", "#b388ff", 3, 1.4, 0.55, 140, 1.4, 0, 1),
  wp("chicote", "Chicote de Couro", "Chicotada horizontal", 0, "whip", "#c08040", 20, 2, 0.8, 0, 0.18, 99, 1),
  wp("rings", "Anéis Dourados", "Anéis em todas as direções", 0, "nova", "#ffd23f", 3, 1.2, 1, 150, 0.7, 1, 2),
  wp("crossbow", "Besta", "Virote forte e perfurante", 900, "bolt", "#c08040", 3, 3, 0.6, 270, 0.8, 3, 1),
  wp("shotgun", "Bacamarte", "Leque de 6 chumbos", 1600, "bolt", "#ffcf7a", 2, 1.3, 0.75, 220, 0.35, 0, 6, 0.16),
  wp("boomerang", "Bumerangue", "Vai e volta cortando tudo", 2000, "boomerang", "#a0e0ff", 4, 2.6, 0.7, 170, 1.3, 99, 1),
  wp("axes", "Machados Gêmeos", "3 machados que voltam", 2400, "boomerang", "#b0b8c0", 5, 2.4, 0.9, 160, 1.3, 99, 3, 0.4),
  wp("ice", "Varinha de Gelo", "Rajada rapidíssima", 2800, "bolt", "#7fdfff", 2, 1.2, 0.14, 230, 0.7, 0, 1),
  wp("bombs", "Bombas de Pólvora", "Bombas com grande explosão", 3000, "bomb", "#555555", 5, 5, 1.1, 90, 0.9, 0, 2, 0.4),
  wp("holy", "Água Benta", "Frascos que explodem em luz", 3400, "bomb", "#7fd0ff", 4, 3.5, 0.8, 120, 0.7, 0, 2, 0.6),
  wp("serpent", "Cajado Serpente", "Tiros em zigue-zague", 3800, "wave", "#6aff8a", 3, 2.4, 0.4, 170, 1, 2, 2, 0.1),
  wp("spear", "Lança Dourada", "Atravessa tudo", 4200, "bolt", "#ffd23f", 4, 5, 0.7, 230, 0.8, 99, 1),
  wp("missiles", "Mísseis Arcanos", "4 mísseis teleguiados", 4800, "homing", "#ff6aff", 3, 2.2, 0.6, 150, 1.6, 0, 4, 0.6),
  wp("grimoire", "Grimório Orbital", "Páginas em 360°", 5200, "nova", "#e0d0ff", 4, 2.4, 0.8, 140, 0.9, 2, 4),
  wp("chain", "Raio em Cadeia", "Relâmpago que salta", 5800, "chain", "#9ff0ff", 1, 3, 0.7, 0, 0, 4, 1),
  wp("flame", "Lança-chamas", "Fogo contínuo e perfurante", 6500, "bolt", "#ff7a2a", 5, 0.9, 0.07, 160, 0.35, 99, 1, 0.25),
  wp("sun", "Cetro do Sol", "Chuva de raios do céu", 7500, "rain", "#fff2a0", 14, 4, 0.8, 0, 0, 0, 3),
  wp("laser", "Canhão de Luz", "Raio que atravessa tudo", 9000, "laser", "#ff3b5c", 3, 4, 0.9, 0, 0, 99, 1),
  wp("minigun", "Metralhadora", "Chuva de balas", 11000, "bolt", "#ffe066", 2, 1.1, 0.06, 300, 0.6, 0, 1, 0.12),
  wp("scythe", "Foice da Morte", "Corte gigante dos dois lados", 14000, "whip", "#c0a0ff", 30, 7, 0.9, 0, 0.25, 99, 2),
  wp("thor", "Martelo do Trovão", "Raios em cadeia gigantes", 17000, "chain", "#ffff80", 2, 6, 0.6, 0, 0, 8, 2),
  wp("storm", "Olho da Tempestade", "Tempestade de raios", 20000, "rain", "#c0f0ff", 18, 6, 0.6, 0, 0, 0, 6),
  wp("excalibur", "Excalibur", "Três raios sagrados", 25000, "laser", "#ffffa0", 5, 9, 0.8, 0, 0, 99, 3, 0.35),
  wp("void", "Orbe do Vazio", "Buracos negros em 360°", 30000, "nova", "#6a2aff", 7, 6, 1, 110, 1.2, 99, 4),
];

// ---------- Characters ----------
export interface HeroClass { id: string; name: string; desc: string; pal: Record<string, string>; rows?: string[]; weapon: string; base: Partial<Stats>; }
export const CLASSES: HeroClass[] = [
  { id: "knight", name: "Cavaleiro", desc: "Escudo −25% dano e espinhos.", weapon: "sword", pal: { h: "#9aa4b0", s: "#f2c79a", e: "#111", b: "#6b7785", l: "#3a2a1a" }, base: { maxHp: 14, damage: 1.1, armor: 0.25, thorns: 3 } },
  { id: "mage", name: "Mago", desc: "Explosões maiores e um orbe.", weapon: "staff", pal: { h: "#6a3fc4", s: "#f2c79a", e: "#111", b: "#4b2a8f", l: "#2a1a3a" }, base: { maxHp: 8, damage: 1.4, explosion: 14, orbit: 1 } },
  { id: "archer", name: "Arqueira", desc: "20% crítico e flechas perfurantes.", weapon: "bow", pal: { h: "#2e7d32", s: "#f2c79a", e: "#111", b: "#558b2f", l: "#3a2a1a" }, base: { maxHp: 9, fireDelay: 0.85, life: 1.2, crit: 0.2, pierce: 1 } },
  { id: "rogue", name: "Ladino", desc: "Esquiva 20% e veneno.", weapon: "daggers", pal: { h: "#222", s: "#f2c79a", e: "#e33", b: "#3b3b3b", l: "#1a1a1a" }, base: { maxHp: 8, speed: 50, shots: 1, dodge: 0.2, burn: 1 } },
  { id: "cleric", name: "Clérigo", desc: "Regenera e atrai tesouros.", weapon: "mace", pal: { h: "#f5f5f5", s: "#f2c79a", e: "#111", b: "#d4af37", l: "#5a4a32" }, base: { maxHp: 11, regen: 0.08, magnet: 45, orbit: 1 } },
  { id: "barbarian", name: "Bárbaro", desc: "Fúria e cura ao matar.", weapon: "hammer", pal: { h: "#c0602a", s: "#d9a77a", e: "#111", b: "#7a4a2a", l: "#3a2a1a" }, base: { maxHp: 12, damage: 1.4, berserk: true, lifesteal: 1, knockback: 1 } },
  { id: "crew", name: "Tripulante Suspeito", desc: "Não faz tarefas: usa dutos! Teleporta explodindo a cada 4s.", weapon: "knife", rows: CREW, pal: { b: "#4a8cff", v: "#9fe8ff" }, base: { maxHp: 7, speed: 56, vent: 4, dodge: 0.1 } },
  { id: "impostor", name: "Impostor", desc: "Faca 2× mais forte, dutos e drones sabotadores.", weapon: "knife", rows: CREW, pal: { b: "#d02a2a", v: "#9fe8ff" }, base: { maxHp: 8, damage: 2, vent: 6, drones: 1, speed: 50 } },
  { id: "plumber", name: "Encanador Bigodudo", desc: "Pisões que esmagam e bolas de fogo.", weapon: "fireflower", rows: PLUMBER, pal: { h: "#d02a2a", s: "#f2c79a", e: "#111", m: "#3a2010", b: "#2a50d0", l: "#5a3010" }, base: { maxHp: 10, stomp: 30, knockback: 1 } },
  { id: "hedgehog", name: "Ouriço Veloz", desc: "Velocidade absurda, rastro de fogo e ímã.", weapon: "rings", rows: HEDGEHOG, pal: { h: "#2a5ad0", s: "#f2c79a", e: "#111", l: "#d02a2a" }, base: { maxHp: 7, speed: 78, trail: 4, magnet: 60, gold: 1.3 } },
  { id: "miner", name: "Minerador Quadrado", desc: "Corta tudo com área enorme e armadura.", weapon: "hammer", rows: BLOCKY, pal: { h: "#4a2a10", s: "#c89a6a", e: "#3a3aa0", b: "#3aa0a0", l: "#2a2a7a" }, base: { maxHp: 12, armor: 0.15, size: 1.4, explosion: 8 } },
  { id: "hunter", name: "Caçador de Vampiros", desc: "Chicote, sangue e crítico.", weapon: "chicote", pal: { h: "#7a4a2a", s: "#f2c79a", e: "#111", b: "#7a2a2a", l: "#3a2a1a" }, base: { maxHp: 11, lifesteal: 1, crit: 0.15 } },
  { id: "necro", name: "Necromante", desc: "Comanda 3 drones e mísseis teleguiados.", weapon: "wand", pal: { h: "#2a2a2a", s: "#b0c0b0", e: "#7fff7f", b: "#3a2a4a", l: "#1a1a1a" }, base: { maxHp: 6, drones: 3, regen: 0.03 } },
  { id: "ninja", name: "Ninja", desc: "35% esquiva, rapidez e crítico.", weapon: "daggers", pal: { h: "#1a1a2a", s: "#f2c79a", e: "#111", b: "#1a1a2a", l: "#111" }, base: { maxHp: 6, dodge: 0.35, speed: 62, crit: 0.25 } },
  { id: "pyro", name: "Piromante", desc: "Tudo pega fogo: rastro, queimadura e explosão.", weapon: "staff", pal: { h: "#ff5a2a", s: "#f2c79a", e: "#111", b: "#8a1a1a", l: "#3a1a1a" }, base: { maxHp: 8, burn: 3, trail: 3, explosion: 10 } },
  { id: "samurai", name: "Samurai", desc: "Cortes duplos e 30% de crítico.", weapon: "sword", pal: { h: "#1a1a1a", s: "#f2c79a", e: "#111", b: "#a02a2a", l: "#222" }, base: { maxHp: 10, crit: 0.3, shots: 1, damage: 1.2 } },
  { id: "cowboy", name: "Pistoleiro", desc: "Saque rápido: atira para frente e para trás.", weapon: "pistol", pal: { h: "#8a5a2a", s: "#f2c79a", e: "#111", b: "#a07040", l: "#3a2a1a" }, base: { maxHp: 9, rear: true, fireDelay: 0.85, crit: 0.1 } },
  { id: "robot", name: "Robô Sucata", desc: "Pulsos de energia, drone e armadura.", weapon: "pistol", rows: ROBOT, pal: { h: "#a0a8b0", e: "#ff3b5c", b: "#707880", s: "#505860", l: "#404850" }, base: { maxHp: 12, armor: 0.2, nova: 1, drones: 1, speed: 36 } },
  { id: "golem", name: "Gigante de Pedra", desc: "25 de vida, pisões enormes, mas lento.", weapon: "hammer", rows: BLOCKY, pal: { h: "#6a6a6a", s: "#8a8a8a", e: "#ffd23f", b: "#5a5a5a", l: "#4a4a4a" }, base: { maxHp: 25, speed: 30, stomp: 45, armor: 0.3, regen: 0.04 } },
  { id: "gambler", name: "Apostador", desc: "+1 carta para escolher, gemas ×2, pouca vida.", weapon: "rings", pal: { h: "#2a2a2a", s: "#f2c79a", e: "#111", b: "#2a7a2a", l: "#1a1a1a" }, base: { maxHp: 6, luck: 1, gold: 2, crit: 0.2 } },
  { id: "monk", name: "Monge", desc: "Pulsos arcanos constantes e regeneração.", weapon: "mace", pal: { h: "#e0a030", s: "#e8b88a", e: "#111", b: "#e07020", l: "#5a3a1a" }, base: { maxHp: 11, nova: 2, regen: 0.06, cdMul: 0.8 } },
  { id: "slime", name: "Gosma Heroica", desc: "Corpo de gosma: espinhos e repulsão enormes.", weapon: "wand", rows: BLOB, pal: { b: "#4ad07a", e: "#111" }, base: { maxHp: 16, thorns: 8, knockback: 2, speed: 38, freeze: 0.1 } },
];

export interface Upgrades { dmg: number; hp: number; spd: number; rate: number; mag: number; }
export const UPGRADES: { id: keyof Upgrades; name: string; desc: string }[] = [
  { id: "dmg", name: "Afiar arma", desc: "+10% dano" },
  { id: "hp", name: "Armadura", desc: "+1 vida máx." },
  { id: "spd", name: "Botas", desc: "+5% velocidade" },
  { id: "rate", name: "Empunhadura", desc: "+6% cadência" },
  { id: "mag", name: "Bolsa de couro", desc: "+8 alcance de coleta" },
];
export const upgradeCost = (lvl: number) => 60 + lvl * lvl * 60;
export const MAX_UPGRADE = 8;

export type Phase = "play" | "cards" | "dead" | "win" | "paused";
export const DIFFICULTIES = {
  normal: { name: "Normal", hp: 1, damage: 1, speed: 1, spawn: 1, reward: 1 },
  hard: { name: "Difícil", hp: 1.5, damage: 1.6, speed: 1.15, spawn: 1.4, reward: 1.5 },
  nightmare: { name: "Pesadelo", hp: 2.2, damage: 2.3, speed: 1.3, spawn: 1.8, reward: 2.2 },
};
export interface Settings { speed: number; difficulty: keyof typeof DIFFICULTIES; volume: number; music: boolean; }
export const DEFAULT_SETTINGS: Settings = { speed: 1, difficulty: "hard", volume: 0.35, music: true };
export interface Place { id: string; name: string; waves: number; waveTime: number; diff: number; floor: string; floor2: string; wall: string; boss: string; bossKind: EnemyKind; pattern: "charge" | "ring" | "summon"; enemies: EnemyKind[]; }
export const PLACES: Place[] = [
  { id: "vila", name: "Vila Abandonada", waves: 6, waveTime: 50, diff: 1, floor: "#3b3326", floor2: "#453b2c", wall: "#5a4a32", boss: "Zumbi Titã", bossKind: "zombie", pattern: "charge", enemies: ["zombie", "bat", "skeleton", "ghoul", "brute"] },
  { id: "caverna", name: "Caverna Sombria", waves: 7, waveTime: 50, diff: 1.2, floor: "#22222e", floor2: "#2a2a38", wall: "#3c3c52", boss: "Rei Esqueleto", bossKind: "skeleton", pattern: "ring", enemies: ["bat", "skeleton", "spider", "slime", "imp"] },
  { id: "bosque", name: "Bosque dos Condenados", waves: 7, waveTime: 50, diff: 1.3, floor: "#254030", floor2: "#2f4938", wall: "#183226", boss: "Raiz Cadavérica", bossKind: "slime", pattern: "summon", enemies: ["zombie", "spider", "slime", "ghoul", "wraith"] },
  { id: "pantano", name: "Pântano Venenoso", waves: 7, waveTime: 50, diff: 1.4, floor: "#2a3a22", floor2: "#33452a", wall: "#1a2a1a", boss: "Rainha do Lodo", bossKind: "slime", pattern: "ring", enemies: ["slime", "zombie", "spider", "ghoul", "brute"] },
  { id: "cripta", name: "Cripta das Múmias", waves: 8, waveTime: 50, diff: 1.5, floor: "#3a3020", floor2: "#433826", wall: "#6a5530", boss: "Faraó Ancestral", bossKind: "mummy", pattern: "summon", enemies: ["mummy", "skeleton", "ghost", "brute", "wraith"] },
  { id: "mina", name: "Mina Desmoronada", waves: 8, waveTime: 50, diff: 1.6, floor: "#2e2620", floor2: "#372e26", wall: "#4a3a2a", boss: "Golem de Carvão", bossKind: "brute", pattern: "charge", enemies: ["bat", "skeleton", "slime", "brute", "imp"] },
  { id: "forte", name: "Fortaleza em Ruínas", waves: 8, waveTime: 50, diff: 1.75, floor: "#45494d", floor2: "#50565a", wall: "#313639", boss: "General Sem Alma", bossKind: "skeleton", pattern: "charge", enemies: ["skeleton", "ghoul", "brute", "imp", "ghost"] },
  { id: "catedral", name: "Catedral Profana", waves: 8, waveTime: 55, diff: 1.9, floor: "#3a2a3a", floor2: "#443244", wall: "#2a1a2a", boss: "Bispo Profano", bossKind: "wraith", pattern: "ring", enemies: ["ghost", "mummy", "wraith", "imp", "skeleton"] },
  { id: "abismo", name: "Abismo das Cinzas", waves: 9, waveTime: 50, diff: 2.1, floor: "#42252d", floor2: "#4c2c33", wall: "#281c24", boss: "Imperatriz das Cinzas", bossKind: "imp", pattern: "ring", enemies: ["imp", "wraith", "ghost", "brute", "mummy", "spider"] },
  { id: "castelo", name: "Castelo do Conde", waves: 9, waveTime: 55, diff: 2.4, floor: "#2a1a22", floor2: "#33202a", wall: "#140a10", boss: "Conde Vampiro", bossKind: "bat", pattern: "summon", enemies: ["bat", "ghost", "ghoul", "wraith", "brute", "spider"] },
];
export interface Obstacle { x: number; y: number; w: number; h: number; }
interface Hazard { x: number; y: number; vx: number; vy: number; life: number; }
export type ChestType = "gold" | "feast" | "relic" | "bomb" | "magnet" | "frost" | "rage" | "jackpot";
interface Chest { x: number; y: number; type: ChestType; opened: boolean; }
const CHEST_INFO: Record<ChestType, { name: string; color: string; weight: number }> = {
  gold: { name: "Baú de gemas", color: "#be8740", weight: 30 },
  feast: { name: "Banquete: vida cheia", color: "#d04060", weight: 16 },
  relic: { name: "Relíquia: carta grátis", color: "#a060ff", weight: 14 },
  bomb: { name: "Bomba sagrada!", color: "#ff8a3d", weight: 12 },
  magnet: { name: "Ímã: todas as gemas", color: "#4fe3ff", weight: 12 },
  frost: { name: "Relógio congelante", color: "#9fe8ff", weight: 9 },
  rage: { name: "Fúria: dano ×2 por 12s", color: "#ff3b5c", weight: 7 },
  jackpot: { name: "JACKPOT!", color: "#ffd23f", weight: 3 },
};
const pickChest = (): ChestType => {
  const keys = Object.keys(CHEST_INFO) as ChestType[];
  let total = 0; for (const k of keys) total += CHEST_INFO[k].weight;
  let r = Math.random() * total;
  for (const k of keys) { r -= CHEST_INFO[k].weight; if (r <= 0) return k; }
  return "gold";
};

const ARENA = 420;
const MAX_ENEMIES = 130;
const MULT = ["damage", "fireDelay", "life", "size", "cdMul"];
const ADD = ["shots", "pierce"];

export class Game {
  ctx: CanvasRenderingContext2D;
  sprites: Record<string, Sprite> = {};
  floor: HTMLCanvasElement;
  place: Place;
  px = 0; py = 0; face = 1; moving = false; walkT = 0;
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
  zones: Zone[] = [];
  fx: Fx[] = [];
  orbitT = 0; lastOrbit = 0;
  bossTell = 0; chargeX = 0; chargeY = 0; chargeT = 0;
  cardsTaken: string[] = [];
  enemies: Enemy[] = []; bullets: Bullet[] = []; loot: Loot[] = []; parts: Particle[] = [];
  fireT = 0; spawnAcc = 0; wave = 1; waveT = 0; total = 0; kills = 0; gems = 0; inv = 0;
  level = 1; xp = 0; pending = 0;
  novaT = 2; stompT = 2; ventT = 3; trailT = 0; droneT = 1; dustT = 0;
  rage = 0; frozen = 0; shake = 0;
  notice = ""; noticeT = 0;
  phase: Phase = "play";
  offer: Card[] = [];
  onChange: () => void;
  get boss() { return this.enemies.find(e => e.boss && e.hp > 0); }
  get xpNeed() { return 5 + this.level * 4 + Math.floor(this.level * this.level * 0.15); }

  constructor(canvas: HTMLCanvasElement, place: Place, onChange: () => void, cls: HeroClass, weapon: Weapon, up: Upgrades, settings: Settings = DEFAULT_SETTINGS) {
    this.settings = { ...settings }; this.classId = cls.id;
    this.weapon = weapon;
    const s: Stats = { armor: 0, crit: 0, dodge: 0, explosion: 0, slow: 0, burn: 0, lifesteal: 0, orbit: 0, thorns: 0, gold: 1, knockback: 0.3, rear: false, berserk: false, damage: weapon.dmg, fireDelay: weapon.delay, speed: 44, shots: weapon.shots, pierce: weapon.pierce, maxHp: 8, hp: 8, bulletSpeed: weapon.speed, magnet: 22, life: weapon.life, regen: 0, spread: weapon.spread || 0.15, size: 1, xpMul: 1, curse: 0, cdMul: 1, nova: 0, stomp: 0, drones: 0, trail: 0, freeze: 0, growth: 0, vent: 0, luck: 0, revive: 0, execute: 0 };
    const b = cls.base as Record<string, number | boolean>, sr = s as unknown as Record<string, number | boolean>;
    for (const key of Object.keys(b)) {
      const v = b[key]; if (v === undefined) continue;
      if (MULT.indexOf(key) >= 0) sr[key] = (sr[key] as number) * (v as number);
      else if (ADD.indexOf(key) >= 0) sr[key] = (sr[key] as number) + (v as number);
      else sr[key] = v;
    }
    s.damage *= 1 + up.dmg * 0.1; s.maxHp += up.hp; s.speed *= 1 + up.spd * 0.05;
    s.fireDelay *= Math.pow(0.94, up.rate); s.magnet += up.mag * 8;
    s.hp = s.maxHp;
    this.stats = s;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas indisponível"); this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.place = place;
    this.onChange = onChange;
    const rows = cls.rows || HERO;
    this.sprites.hero = makeSprite(rows, cls.pal);
    this.sprites.hero2 = makeSprite(stepFrame(rows), cls.pal);
    for (const k of Object.keys(ENEMIES) as EnemyKind[]) {
      const d = ENEMIES[k];
      this.sprites[k] = makeSprite(d.rows, d.pal);
      this.sprites[k + "2"] = makeSprite(stepFrame(d.rows), d.pal);
      this.sprites[k + "W"] = makeSprite(d.rows, whitePal(d.pal));
    }
    this.sprites.heart = makeSprite(HEART, { r: "#ff3b5c" });
    this.sprites.gem = makeSprite(GEM, { c: "#4fe3ff" });
    this.sprites.big = makeSprite(BIGGEM, { c: "#ff6aff", w: "#fff" });
    // Pre-render floor + decorations once (cheap per-frame draw on slow TVs)
    const size = (ARENA + 200) * 2;
    this.floor = document.createElement("canvas");
    this.floor.width = size; this.floor.height = size;
    const f = this.floor.getContext("2d"); if (!f) throw new Error("Canvas indisponível");
    for (let y = 0; y < size; y += 16) for (let x = 0; x < size; x += 16) {
      const wx = x - size / 2, wy = y - size / 2;
      const out = Math.abs(wx + 8) > ARENA + 8 || Math.abs(wy + 8) > ARENA + 8;
      f.fillStyle = out ? place.wall : ((x + y) / 16) & 1 ? place.floor : place.floor2;
      f.fillRect(x, y, 16, 16);
      const h = (x * 7 + y * 13) % 11;
      if (!out && h === 0) { f.fillStyle = place.wall; f.fillRect(x + 5, y + 7, 2, 1); f.fillRect(x + 9, y + 4, 1, 2); }
      if (!out && h === 3) { f.fillStyle = "#d8d0c0"; f.fillRect(x + 4, y + 9, 4, 1); f.fillRect(x + 5, y + 8, 1, 3); }
      if (!out && h === 6) { f.fillStyle = "#00000033"; f.fillRect(x + 2, y + 2, 6, 3); }
    }
    for (let i = 0; i < 40; i++) {
      const angle = i * 2.39, radius = 60 + (i % 7) * 50;
      this.obstacles.push({ x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius), w: 10 + (i % 3) * 6, h: 12 + (i % 2) * 6 });
    }
    this.spawnChest(); this.spawnChest();
  }

  setSettings(settings: Settings) { this.settings = { ...settings }; }
  togglePause() { if (this.phase === "play") this.phase = "paused"; else if (this.phase === "paused") this.phase = "play"; this.pointerActive = false; this.keys = {}; this.onChange(); }
  diff() { return DIFFICULTIES[this.settings.difficulty] || DIFFICULTIES.hard; }
  say(text: string) { this.notice = text; this.noticeT = 2.5; this.onChange(); }

  takeDamage(amount: number, enemy?: Enemy) {
    if (this.inv > 0 || this.phase !== "play") return;
    if (Math.random() < this.stats.dodge) { this.inv = 0.25; this.text(this.px, this.py - 8, "ESQUIVA", "#7fdfff"); return; }
    this.stats.hp -= Math.max(0.5, amount * (1 - this.stats.armor));
    this.inv = 0.6; this.shake = 0.25; audio.play("hurt");
    if (enemy && this.stats.thorns) { enemy.hp -= this.stats.thorns; enemy.hit = 0.1; }
    this.burst(this.px, this.py, "#ff3b5c", 8);
    if (this.stats.hp <= 0) {
      if (this.stats.revive > 0) { this.stats.revive--; this.stats.hp = this.stats.maxHp; this.inv = 2; this.nuke(); this.say("Pena de Fênix: renasceu!"); return; }
      this.stats.hp = 0; this.phase = "dead"; audio.play("dead"); this.onChange();
    }
  }
  blocked(x: number, y: number, r = 4) {
    for (const o of this.obstacles) if (x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h) return true;
    return false;
  }
  freeSpot(cx: number, cy: number, spread: number) {
    let x = cx, y = cy;
    for (let i = 0; i < 30; i++) { x = Math.max(-ARENA + 10, Math.min(ARENA - 10, cx + rnd(-spread, spread))); y = Math.max(-ARENA + 10, Math.min(ARENA - 10, cy + rnd(-spread, spread))); if (!this.blocked(x, y, 10)) break; }
    return [x, y] as const;
  }
  spawnChest(type?: ChestType, x?: number, y?: number) {
    if (this.chests.filter(c => !c.opened).length > 8) return;
    const p = x !== undefined && y !== undefined ? [x, y] as const : this.freeSpot(this.px, this.py, 150);
    this.chests.push({ x: p[0], y: p[1], type: type || pickChest(), opened: false });
  }
  spawnBoss() {
    const d = this.diff();
    const hp = 220 * this.place.diff * d.hp * (1 + this.place.waves * 0.12);
    this.enemies.push({ x: this.px + 110, y: this.py, hp, maxHp: hp, kind: this.place.bossKind, speed: 20 * d.speed, dmg: 3.5 * d.damage, hit: 0, boss: true, size: 28, slow: 0, burn: 0, freeze: 0, cooldown: 3, face: 1, seed: 0 });
    this.bossSpawned = true; audio.play("boss"); this.say("CHEFE: " + this.place.boss + "!");
  }

  spawnEnemy(kind?: EnemyKind, ax?: number, ay?: number, elite = false) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    const d = this.diff();
    const unlocked = Math.min(this.place.enemies.length, 1 + Math.floor((this.wave + 1) / 1.5));
    const k: EnemyKind = kind || this.place.enemies[Math.floor(Math.random() * unlocked)] || "zombie";
    const def = ENEMIES[k];
    const scale = this.place.diff * d.hp * (1 + (this.wave - 1) * 0.3 + this.total / 240) * (elite ? 4 : 1);
    let x = ax, y = ay;
    if (x === undefined || y === undefined) { const a = Math.random() * Math.PI * 2; x = this.px + Math.cos(a) * 200; y = this.py + Math.sin(a) * 200; }
    x = Math.max(-ARENA, Math.min(ARENA, x)); y = Math.max(-ARENA, Math.min(ARENA, y));
    this.enemies.push({ x, y, hp: def.hp * scale, kind: k, maxHp: def.hp * scale, speed: def.sp * d.speed * (elite ? 0.9 : rnd(0.85, 1.15)), dmg: def.dmg * d.damage * (1 + (this.wave - 1) * 0.1) * (elite ? 1.5 : 1), hit: 0, elite, size: def.size * (elite ? 1.6 : 1), slow: 0, burn: 0, freeze: 0, cooldown: (def.shoot || 2) * rnd(0.5, 1.5), face: 1, seed: Math.random() * 10 });
  }
  swarm() {
    const kinds = this.place.enemies;
    const k = kinds[Math.min(kinds.length - 1, Math.floor(Math.random() * Math.min(kinds.length, this.wave)))] || "zombie";
    const n = 14 + this.wave * 3;
    for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; this.spawnEnemy(k, this.px + Math.cos(a) * 170, this.py + Math.sin(a) * 120); }
    this.spawnEnemy(undefined, undefined, undefined, true);
    this.say("Horda " + this.wave + ": " + ENEMIES[k].name + "s cercando!");
  }

  rollCards() {
    const s = this.stats, n = 3 + s.luck;
    const maxTier = Math.min(5, 1 + Math.floor(this.level / 3));
    const pool = CARD_POOL.filter(c => c.tier <= maxTier + (Math.random() < 0.1 ? 1 : 0) && !(c.id === "rear" && s.rear) && !(c.id === "berserk" && s.berserk));
    this.offer = [];
    const ids: Record<string, boolean> = {};
    for (let tries = 0; this.offer.length < n && tries < 200 && pool.length; tries++) {
      const card = pool[Math.floor(Math.random() * pool.length)]; if (!card) continue;
      const fam = card.id.replace(/\d+$/, "");
      if (ids[fam]) continue;
      // higher tiers are rarer
      if (Math.random() > 1 / card.tier + 0.15) continue;
      ids[fam] = true; this.offer.push(card);
    }
  }

  pick(i: number) {
    if (this.phase !== "cards" || !this.offer[i]) return;
    const card = this.offer[i]; if (!card) return;
    const s = this.stats;
    card.apply(s); this.cardsTaken.push(card.title); audio.play("card");
    s.shots = Math.min(14, s.shots); s.orbit = Math.min(8, s.orbit); s.drones = Math.min(6, s.drones); s.nova = Math.min(5, s.nova); s.fireDelay = Math.max(0.05, s.fireDelay); s.cdMul = Math.max(0.3, s.cdMul);
    this.pending--;
    if (this.pending > 0) this.rollCards();
    else { this.phase = "play"; this.inv = Math.max(this.inv, 0.6); }
    this.onChange();
  }

  burst(x: number, y: number, color: string, n = 5, speed = 80) {
    for (let i = 0; i < n && this.parts.length < 160; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed, life: rnd(0.2, 0.45), color, size: Math.random() < 0.3 ? 2 : 1 });
  }
  text(x: number, y: number, text: string, color: string) {
    let n = 0; for (const f of this.fx) if (f.kind === "text") n++;
    if (n < 24) this.fx.push({ kind: "text", x, y, x2: 0, y2: 0, r: 0, life: 0.6, max: 0.6, color, text });
  }
  ring(x: number, y: number, r: number, color: string, life = 0.3) { if (this.fx.length < 80) this.fx.push({ kind: "ring", x, y, x2: 0, y2: 0, r, life, max: life, color }); }
  line(x: number, y: number, x2: number, y2: number, color: string, life = 0.15) { if (this.fx.length < 80) this.fx.push({ kind: "line", x, y, x2, y2, r: 0, life, max: life, color }); }

  range() { return Math.max(70, Math.min(190, this.stats.bulletSpeed * this.stats.life + 20)); }
  nearest(x: number, y: number, max: number, skip?: Enemy[]) {
    let best: Enemy | null = null, bd = max;
    for (const e of this.enemies) { if (e.hp <= 0 || (skip && skip.indexOf(e) >= 0)) continue; const d = dist(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  power() { const s = this.stats; return s.damage * (s.berserk && s.hp < s.maxHp * 0.4 ? 2 : 1) * (this.rage > 0 ? 2 : 1) * (1 + s.growth * Math.floor(this.kills / 10)); }

  hitEnemy(e: Enemy, base: number, kx = 0, ky = 0) {
    if (e.hp <= 0) return;
    const s = this.stats, crit = Math.random() < s.crit;
    const dmg = base * (crit ? 3 : 1);
    e.hp -= dmg; e.hit = 0.1;
    if (s.slow) e.slow = 2;
    if (s.burn) e.burn = 3;
    if (s.freeze && Math.random() < s.freeze && !e.boss) e.freeze = 1.5;
    if (!e.boss && (kx || ky)) { const l = dist(kx, ky) || 1; const k = 3 * s.knockback * (e.elite ? 0.3 : 1); e.x += kx / l * k; e.y += ky / l * k; }
    if (s.execute && !e.boss && e.hp > 0 && e.hp < e.maxHp * s.execute) { e.hp = 0; this.text(e.x, e.y - 6, "✝", "#ff3b5c"); }
    if (crit || dmg >= 5 || e.boss) this.text(e.x + rnd(-3, 3), e.y - 6, String(Math.round(dmg * 10) / 10), crit ? "#ffd23f" : "#ffffff");
    audio.play("hit");
  }
  area(x: number, y: number, r: number, dmg: number, color: string) {
    for (const e of this.enemies) if (e.hp > 0 && dist(e.x - x, e.y - y) < r + e.size / 2) this.hitEnemy(e, dmg, e.x - x, e.y - y);
    this.ring(x, y, r, color, 0.3); this.burst(x, y, color, 6, 120);
  }
  nuke() { for (const e of this.enemies) if (!e.boss) e.hp = 0; else this.hitEnemy(e, e.maxHp * 0.1); this.shake = 0.5; this.ring(this.px, this.py, 200, "#ffffff", 0.5); }

  fire(target: Enemy) {
    const s = this.stats, w = this.weapon, p = this.power();
    const base = Math.atan2(target.y - this.py, target.x - this.px);
    const size = Math.max(1, Math.round(w.size * s.size));
    const shots = Math.min(14, s.shots);
    const dirs: number[] = [];
    if (w.kind === "nova") { const n = shots * 4; for (let i = 0; i < n; i++) dirs.push(base + i * Math.PI * 2 / n); }
    else for (let i = 0; i < shots; i++) dirs.push(base + (i - (shots - 1) / 2) * s.spread);
    if (s.rear && w.kind !== "nova") { const n = dirs.length; for (let i = 0; i < n; i++) dirs.push((dirs[i] || 0) + Math.PI); }
    this.ring(this.px + Math.cos(base) * 6, this.py + Math.sin(base) * 6, 3, w.color, 0.1);
    if (w.kind === "chain") {
      for (let k = 0; k < shots; k++) {
        let from = { x: this.px, y: this.py }, hits: Enemy[] = [];
        let cur: Enemy | null = k === 0 ? target : this.nearest(this.px, this.py, this.range(), hits);
        for (let j = 0; cur && j < 2 + s.pierce + w.pierce; j++) {
          this.line(from.x, from.y, cur.x, cur.y, w.color, 0.18);
          this.hitEnemy(cur, p, cur.x - from.x, cur.y - from.y); hits.push(cur);
          from = { x: cur.x, y: cur.y }; cur = this.nearest(cur.x, cur.y, 60, hits);
        }
      }
      audio.play("zap"); return;
    }
    if (w.kind === "rain") {
      for (let k = 0; k < shots + 1; k++) {
        const e = k === 0 ? target : this.enemies[Math.floor(Math.random() * this.enemies.length)];
        if (!e || dist(e.x - this.px, e.y - this.py) > 200) continue;
        this.line(e.x, e.y - 120, e.x, e.y, w.color, 0.2);
        this.area(e.x, e.y, size + s.explosion * 0.5, p, w.color);
      }
      this.shake = Math.max(this.shake, 0.08); audio.play("zap"); return;
    }
    if (w.kind === "laser") {
      for (const a of dirs) {
        const len = 220, ex = this.px + Math.cos(a) * len, ey = this.py + Math.sin(a) * len;
        this.fx.push({ kind: "line", x: this.px, y: this.py, x2: ex, y2: ey, r: size, life: 0.18, max: 0.18, color: w.color });
        for (const e of this.enemies) {
          const rx = e.x - this.px, ry = e.y - this.py, t = rx * Math.cos(a) + ry * Math.sin(a);
          if (t < 0 || t > len) continue;
          if (Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)) < size + e.size / 2) this.hitEnemy(e, p, Math.cos(a), Math.sin(a));
        }
      }
      audio.play("zap"); return;
    }
    if (w.kind === "whip") {
      for (let i = 0; i < Math.max(1, Math.min(4, shots)) * (s.rear ? 2 : 1); i++) {
        const side = i % 2 === 0 ? (Math.cos(base) >= 0 ? 1 : -1) : (Math.cos(base) >= 0 ? -1 : 1);
        const oy = -4 + Math.floor(i / 2) * 8;
        this.bullets.push({ x: this.px, y: this.py, vx: 0, vy: 0, life: w.life, max: w.life, pierce: 999, hits: [], kind: "whip", size, color: w.color, dmg: p, dx: side, dy: 0, ox: side * (size / 2 + 4), oy });
      }
      audio.play("shot"); return;
    }
    const kind: BulletKind = w.kind === "nova" ? "bolt" : w.kind;
    for (const a of dirs) {
      if (this.bullets.length >= 170) break;
      this.bullets.push({ x: this.px, y: this.py, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, life: s.life, max: s.life, pierce: s.pierce, hits: [], kind, size, color: w.color, dmg: p, dx: Math.cos(a), dy: Math.sin(a), ox: this.px, oy: this.py });
    }
    audio.play("shot");
  }

  gainXp(v: number) {
    this.xp += v * this.stats.xpMul;
    while (this.xp >= this.xpNeed) { this.xp -= this.xpNeed; this.level++; this.pending++; }
    if (this.pending > 0 && this.phase === "play") { this.rollCards(); this.phase = "cards"; audio.play("level"); this.pointerActive = false; this.keys = {}; this.onChange(); }
  }

  update(dt: number) {
    this.noticeT -= dt;
    if (this.phase !== "play") return;
    const s = this.stats, d = this.diff();
    this.total += dt; this.waveT += dt; this.inv -= dt; this.rage -= dt; this.frozen -= dt; this.shake = Math.max(0, this.shake - dt);

    // ---- Movement: remote arrows, otherwise walk toward the pointer
    let dx = 0, dy = 0;
    const k = this.keys;
    if (k["ArrowLeft"]) dx -= 1;
    if (k["ArrowRight"]) dx += 1;
    if (k["ArrowUp"]) dy -= 1;
    if (k["ArrowDown"]) dy += 1;
    if (!dx && !dy && this.pointerActive) {
      const ddx = this.mx - W / 2, ddy = this.my - H / 2, l = dist(ddx, ddy);
      if (l > 10) { dx = ddx / l; dy = ddy / l; }
    } else if (dx || dy) { const l = dist(dx, dy); dx /= l; dy /= l; }
    if (Math.abs(dx) > 0.1) this.face = dx > 0 ? 1 : -1;
    this.moving = !!(dx || dy);
    const sp = Math.min(95, s.speed) * this.settings.speed * dt;
    const oldX = this.px, oldY = this.py;
    this.px = Math.max(-ARENA, Math.min(ARENA, this.px + dx * sp));
    if (this.blocked(this.px, this.py)) this.px = oldX;
    this.py = Math.max(-ARENA, Math.min(ARENA, this.py + dy * sp));
    if (this.blocked(this.px, this.py)) this.py = oldY;
    if (this.moving) {
      this.walkT += dt; this.dustT -= dt;
      if (this.dustT <= 0) { this.dustT = 0.14; if (this.parts.length < 160) this.parts.push({ x: this.px - dx * 3 + rnd(-1, 1), y: this.py + 4, vx: -dx * 10, vy: -6, life: 0.3, color: "#c8b898", size: 1 }); }
    }

    // ---- Waves (continuous, Vampire Survivors style)
    if (this.waveT >= this.place.waveTime && this.wave < this.place.waves) {
      this.wave++; this.waveT = 0; this.swarm(); this.spawnChest(); if (this.wave % 2 === 0) this.spawnChest();
      if (this.wave === this.place.waves) this.spawnBoss();
    }
    const rate = (1.6 + this.wave * 1.2 + this.total / 25) * this.place.diff * d.spawn * (1 + s.curse) * (this.boss ? 0.6 : 1);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) { this.spawnAcc -= 1; this.spawnEnemy(undefined, undefined, undefined, Math.random() < 0.01 + this.wave * 0.002); }

    // ---- Chests
    for (const chest of this.chests) if (!chest.opened && dist(chest.x - this.px, chest.y - this.py) < 12) { chest.opened = true; this.openChest(chest); }
    this.chests = this.chests.filter(c => !c.opened);

    // ---- Auto-fire at nearest enemy
    this.fireT -= dt;
    if (this.fireT <= 0) {
      const best = this.nearest(this.px, this.py, this.range());
      if (best) { this.fireT = s.fireDelay; this.fire(best); }
    }
    // ---- Powers
    const cd = s.cdMul;
    if (s.nova) { this.novaT -= dt; if (this.novaT <= 0) { this.novaT = 3.5 * cd; const n = 6 * s.nova; for (let i = 0; i < n && this.bullets.length < 170; i++) { const a = i * Math.PI * 2 / n; this.bullets.push({ x: this.px, y: this.py, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.7, max: 0.7, pierce: 1, hits: [], kind: "bolt", size: 3, color: "#b388ff", dmg: this.power() * 0.8, dx: 0, dy: 0, ox: 0, oy: 0 }); } this.ring(this.px, this.py, 14, "#b388ff"); audio.play("nova"); } }
    if (s.stomp) { this.stompT -= dt; if (this.stompT <= 0) { this.stompT = 2.6 * cd; this.area(this.px, this.py, s.stomp, this.power() * 1.3, "#e8d090"); this.shake = Math.max(this.shake, 0.12); audio.play("nova"); } }
    if (s.vent) { this.ventT -= dt; if (this.ventT <= 0 && this.enemies.length) {
      this.ventT = s.vent * cd;
      this.area(this.px, this.py, 28, this.power() * 2, "#ff3b5c");
      const tx = this.moving ? dx : (Math.random() - 0.5), ty = this.moving ? dy : (Math.random() - 0.5), l = dist(tx, ty) || 1;
      const nx = Math.max(-ARENA, Math.min(ARENA, this.px + tx / l * 60)), ny = Math.max(-ARENA, Math.min(ARENA, this.py + ty / l * 60));
      if (!this.blocked(nx, ny)) { this.px = nx; this.py = ny; }
      this.area(this.px, this.py, 28, this.power() * 2, "#ff3b5c"); this.inv = Math.max(this.inv, 0.4);
    } }
    if (s.trail && this.moving) { this.trailT -= dt; if (this.trailT <= 0 && this.zones.length < 60) { this.trailT = 0.12; this.zones.push({ x: this.px, y: this.py + 3, r: 6, life: 1.6, dmg: s.trail, color: "#ff8a3d" }); } }
    if (s.drones) { this.droneT -= dt; if (this.droneT <= 0) { this.droneT = 0.7 * cd; for (let i = 0; i < s.drones; i++) {
      const a = this.total * 1.3 + i * Math.PI * 2 / s.drones, x = this.px + Math.cos(a) * 16, y = this.py + Math.sin(a) * 12;
      const t = this.nearest(x, y, 150); if (!t || this.bullets.length >= 170) continue; const l = dist(t.x - x, t.y - y) || 1;
      this.bullets.push({ x, y, vx: (t.x - x) / l * 170, vy: (t.y - y) / l * 170, life: 1, max: 1, pierce: 0, hits: [], kind: "homing", size: 2, color: "#7fff9f", dmg: this.power() * 0.5, dx: 0, dy: 0, ox: 0, oy: 0 });
    } } }
    this.orbitT += dt; this.lastOrbit -= dt;
    if (s.orbit && this.lastOrbit <= 0) {
      this.lastOrbit = 0.25;
      for (let i = 0; i < s.orbit; i++) {
        const a = this.orbitT * 3 + i * Math.PI * 2 / s.orbit, ox = this.px + Math.cos(a) * 26, oy = this.py + Math.sin(a) * 26;
        for (const e of this.enemies) if (dist(e.x - ox, e.y - oy) < 7 + e.size / 2) this.hitEnemy(e, this.power() * 0.6, e.x - this.px, e.y - this.py);
      }
    }
    if (s.regen > 0 && s.hp < s.maxHp) { this.regenAcc += s.regen * dt; if (this.regenAcc >= 1) { this.regenAcc = 0; s.hp = Math.min(s.maxHp, s.hp + 1); this.text(this.px, this.py - 8, "+1", "#6aff8a"); } }

    // ---- Zones (fire trail, holy water)
    for (const z of this.zones) { z.life -= dt; for (const e of this.enemies) if (dist(e.x - z.x, e.y - z.y) < z.r + e.size / 2) { e.hp -= z.dmg * dt; e.hit = Math.max(e.hit, 0.03); } }
    this.zones = this.zones.filter(z => z.life > 0);

    // ---- Enemies
    this.bossTell -= dt; this.chargeT -= dt;
    const frozen = this.frozen > 0;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const def = ENEMIES[e.kind];
      const ex = this.px - e.x, ey = this.py - e.y, l = dist(ex, ey) || 1;
      e.slow = Math.max(0, e.slow - dt); e.burn = Math.max(0, e.burn - dt); e.freeze -= dt; e.hit -= dt;
      if (e.burn > 0) e.hp -= s.burn * dt;
      if (Math.abs(ex) > 1) e.face = ex > 0 ? 1 : -1;
      if (frozen || e.freeze > 0) continue;
      let speed = e.speed * (e.slow > 0 ? 1 - s.slow : 1);
      let mx = ex / l, my = ey / l;
      if (e.kind === "bat") { const wob = Math.sin(this.total * 6 + e.seed) * 0.8; mx += -my * wob; my += mx * wob; }
      if (e.kind === "spider" && Math.sin(this.total * 2 + e.seed) > 0.6) speed *= 0.2;
      if (l > 260 && !e.boss) { // recycle far-away enemies in front of the player (VS style)
        const a = Math.random() * Math.PI * 2; e.x = this.px + Math.cos(a) * 190; e.y = this.py + Math.sin(a) * 190; continue;
      }
      const nx = e.x + mx * speed * dt, ny = e.y + my * speed * dt;
      const fly = def.fly || e.boss;
      if (fly || !this.blocked(nx, e.y)) e.x = nx; else e.y += Math.sign(ey || 1) * speed * dt;
      if (fly || !this.blocked(e.x, ny)) e.y = ny; else e.x += Math.sign(ex || 1) * speed * dt;
      e.cooldown -= dt;
      if (e.boss) {
        if (e.cooldown <= 0) {
          e.cooldown = e.hp < e.maxHp / 2 ? 2.2 : 3.5;
          if (this.place.pattern === "charge") { this.chargeX = ex / l; this.chargeY = ey / l; this.bossTell = 0.7; this.chargeT = 1.5; }
          const count = this.place.pattern === "ring" ? 16 : 8;
          for (let i = 0; i < count && this.hazards.length < 80; i++) { const a = i * Math.PI * 2 / count + this.total; this.hazards.push({ x: e.x, y: e.y, vx: Math.cos(a) * 65, vy: Math.sin(a) * 65, life: 4 }); }
          if (this.place.pattern === "summon") for (let i = 0; i < 6; i++) this.spawnEnemy(undefined, e.x + rnd(-30, 30), e.y + rnd(-30, 30));
        }
        if (this.place.pattern === "charge" && this.chargeT > 0 && this.bossTell <= 0) { e.x += this.chargeX * 130 * dt; e.y += this.chargeY * 130 * dt; }
      } else if (def.shoot && e.cooldown <= 0 && l < 160) {
        e.cooldown = def.shoot * rnd(0.8, 1.3);
        if (this.hazards.length < 80) this.hazards.push({ x: e.x, y: e.y, vx: ex / l * 70, vy: ey / l * 70, life: 2.5 });
      }
      if (l < e.size / 2 + 3) { this.takeDamage(e.dmg, e); if (this.phase !== "play") return; }
    }
    for (const h of this.hazards) {
      h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
      if (this.blocked(h.x, h.y, 1)) h.life = 0;
      if (dist(h.x - this.px, h.y - this.py) < 5) { this.takeDamage(1.5 * d.damage * (1 + this.wave * 0.05)); h.life = 0; }
    }
    this.hazards = this.hazards.filter(h => h.life > 0);
    if (this.phase !== "play") return;

    // separation (cheap, early-out)
    const n = this.enemies.length;
    for (let i = 0; i < n; i++) {
      const a = this.enemies[i]; if (!a) continue;
      for (let j = i + 1; j < n; j++) {
        const b = this.enemies[j]; if (!b) continue;
        const r = (a.size + b.size) * 0.4, ddx = a.x - b.x, ddy = a.y - b.y;
        if (ddx > r || ddx < -r || ddy > r || ddy < -r) continue;
        const dd = dist(ddx, ddy);
        if (dd > 0 && dd < r) { const p = (r - dd) / 2; const ma = a.boss ? 0.1 : 1, mb = b.boss ? 0.1 : 1; a.x += (ddx / dd) * p * ma; a.y += (ddy / dd) * p * ma; b.x -= (ddx / dd) * p * mb; b.y -= (ddy / dd) * p * mb; }
      }
    }

    // ---- Bullets
    for (const b of this.bullets) {
      b.life -= dt;
      if (b.kind === "whip") { b.x = this.px + b.ox; b.y = this.py + b.oy; }
      else {
        if (b.kind === "boomerang") { b.vx -= b.dx * s.bulletSpeed * 2.2 * dt; b.vy -= b.dy * s.bulletSpeed * 2.2 * dt; if (b.life < b.max * 0.5 && dist(b.x - this.px, b.y - this.py) < 8) b.life = 0; }
        if (b.kind === "homing") { const t = this.nearest(b.x, b.y, 120); if (t) { const l = dist(t.x - b.x, t.y - b.y) || 1, sp = dist(b.vx, b.vy); b.vx += ((t.x - b.x) / l * sp - b.vx) * 5 * dt; b.vy += ((t.y - b.y) / l * sp - b.vy) * 5 * dt; } }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.kind === "wave") { const t = b.max - b.life, off = Math.sin(t * 14) * 14; b.ox = b.x - b.dy * off; b.oy = b.y + b.dx * off; }
        if (b.kind !== "boomerang" && this.blocked(b.x, b.y, 1)) { if (b.kind === "bomb") this.explode(b); b.life = 0; continue; }
        if (b.kind === "bomb" && b.life <= 0) { this.explode(b); continue; }
      }
      const bx = b.kind === "wave" ? b.ox : b.x, by = b.kind === "wave" ? b.oy : b.y;
      const hw = b.kind === "whip" ? b.size / 2 + 2 : b.size / 2 + 1, hh = b.kind === "whip" ? Math.max(5, b.size / 3) : hw;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hits.indexOf(e) >= 0) continue;
        const r = e.size / 2;
        if (Math.abs(e.x - bx) < r + hw && Math.abs(e.y - by) < r + hh) {
          if (b.kind === "bomb") { this.explode(b); break; }
          this.hitEnemy(e, b.dmg, b.kind === "whip" ? b.dx : b.vx, b.kind === "whip" ? 0 : b.vy); b.hits.push(e);
          if (s.explosion && b.kind !== "whip") this.area(e.x, e.y, s.explosion, b.dmg * 0.4, "#ff8a3d");
          if (b.pierce-- <= 0) { b.life = 0; this.burst(bx, by, b.color, 3); break; }
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);

    // ---- Deaths & loot
    for (const e of this.enemies) if (e.hp <= 0) {
      this.kills++; this.burst(e.x, e.y, ENEMIES[e.kind].pal[Object.keys(ENEMIES[e.kind].pal)[0] || ""] || "#fff", e.elite || e.boss ? 14 : 5);
      if (s.lifesteal && this.kills % 15 === 0) s.hp = Math.min(s.maxHp, s.hp + s.lifesteal);
      if (e.boss) { this.bossDefeated = true; this.gems += Math.round(300 * this.place.diff * d.reward); this.shake = 0.6; this.ring(e.x, e.y, 60, "#ffd23f", 0.6); }
      else if (e.elite) { this.spawnChest(undefined, e.x, e.y); this.loot.push({ x: e.x + 6, y: e.y, type: "big", value: 15 }); }
      else this.dropLoot(e.x, e.y, Math.random() < 0.012 ? "heart" : ENEMIES[e.kind].xp >= 5 ? "big" : "gem", ENEMIES[e.kind].xp);
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    for (const l of this.loot) {
      const ddx = this.px - l.x, ddy = this.py - l.y, dd = dist(ddx, ddy);
      if (dd < s.magnet && dd > 0) { l.x += (ddx / dd) * 150 * dt; l.y += (ddy / dd) * 150 * dt; }
      if (dd < 6) { l.got = true; this.collect(l); }
    }
    this.loot = this.loot.filter(l => !l.got);

    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const f of this.fx) { f.life -= dt; if (f.kind === "text") f.y -= 18 * dt; }
    this.fx = this.fx.filter(f => f.life > 0);

    if (this.bossDefeated) {
      for (const l of this.loot) if (l.type !== "heart") this.gems += l.value * s.gold * d.reward;
      this.loot = []; this.phase = "win"; audio.play("win"); this.hazards = []; this.pointerActive = false; this.keys = {}; this.onChange();
    }
  }
  dropLoot(x: number, y: number, type: Loot["type"], value: number) {
    if (this.loot.length >= 160) { const other = this.loot[Math.floor(Math.random() * this.loot.length)]; if (other && other.type !== "heart") { other.value += value; if (other.value >= 5) other.type = "big"; } return; }
    this.loot.push({ x, y, type, value });
  }
  collect(l: Loot) {
    const s = this.stats, d = this.diff();
    if (l.type === "heart") { s.hp = Math.min(s.maxHp, s.hp + 2); this.text(l.x, l.y - 4, "+2", "#ff3b5c"); }
    else { this.gems += l.value * s.gold * d.reward; this.gainXp(l.value); }
    audio.play("loot");
  }
  explode(b: Bullet) { b.life = 0; this.area(b.x, b.y, 14 + b.size * 2 + this.stats.explosion, b.dmg, b.color); if (this.weapon.id === "holy" && this.zones.length < 60) this.zones.push({ x: b.x, y: b.y, r: 14, life: 2, dmg: b.dmg, color: "#7fd0ff" }); }
  openChest(c: Chest) {
    const s = this.stats, d = this.diff(), info = CHEST_INFO[c.type];
    audio.play("chest"); this.burst(c.x, c.y, info.color, 16, 140); this.ring(c.x, c.y, 20, info.color, 0.5);
    if (c.type === "gold") this.gems += Math.round((20 + this.wave * 8) * s.gold * d.reward);
    if (c.type === "jackpot") { this.gems += Math.round((120 + this.wave * 30) * s.gold * d.reward); s.hp = s.maxHp; this.pending++; }
    if (c.type === "feast") s.hp = s.maxHp;
    if (c.type === "relic") this.pending++;
    if (c.type === "bomb") this.nuke();
    if (c.type === "magnet") for (const l of this.loot) if (l.type !== "heart") { l.got = true; this.collect(l); }
    if (c.type === "frost") this.frozen = 6;
    if (c.type === "rage") this.rage = 12;
    this.say(info.name);
    if (this.pending > 0 && this.phase === "play") { this.rollCards(); this.phase = "cards"; audio.play("level"); this.pointerActive = false; this.keys = {}; this.onChange(); }
  }

  draw() {
    const g = this.ctx;
    const shx = this.shake > 0 ? Math.round(rnd(-2, 2)) : 0, shy = this.shake > 0 ? Math.round(rnd(-2, 2)) : 0;
    const cx = Math.round(this.px - W / 2) + shx, cy = Math.round(this.py - H / 2) + shy;
    const half = this.floor.width / 2;
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    g.drawImage(this.floor, cx + half, cy + half, W, H, 0, 0, W, H);
    for (const z of this.zones) { g.globalAlpha = Math.min(0.7, z.life); g.fillStyle = z.color; const fl = Math.floor(this.total * 12 + z.x) % 2; g.fillRect(Math.round(z.x - cx - z.r / 2), Math.round(z.y - cy - z.r / 2 - fl), Math.round(z.r), Math.round(z.r)); }
    g.globalAlpha = 1;
    for (const o of this.obstacles) {
      const ox = o.x - cx, oy = o.y - cy; if (ox > W || oy > H || ox + o.w < 0 || oy + o.h < 0) continue;
      g.fillStyle = "#00000055"; g.fillRect(ox + 2, oy + o.h - 2, o.w, 4);
      g.fillStyle = this.place.wall; g.fillRect(ox, oy, o.w, o.h);
      g.fillStyle = "#96968a"; g.fillRect(ox + 2, oy + 2, o.w - 4, 3);
      g.fillStyle = "#00000044"; g.fillRect(ox, oy + o.h - 3, o.w, 3);
    }
    for (const chest of this.chests) {
      const x = Math.round(chest.x - cx), y = Math.round(chest.y - cy) - (Math.floor(this.total * 3) % 2), info = CHEST_INFO[chest.type];
      g.fillStyle = "#00000066"; g.fillRect(x - 5, y + 5, 10, 2);
      g.fillStyle = info.color; g.fillRect(x - 5, y - 4, 10, 8);
      g.fillStyle = "#3a2410"; g.fillRect(x - 5, y - 1, 10, 1);
      g.fillStyle = "#ffe066"; g.fillRect(x - 1, y - 2, 2, 3);
      if (Math.floor(this.total * 4) % 4 === 0) { g.fillStyle = "#fff"; g.fillRect(x + 3, y - 6, 1, 1); }
    }
    for (const l of this.loot) { const sprite = this.sprites[l.type]; if (sprite) g.drawImage(sprite, Math.round(l.x - cx - sprite.width / 2), Math.round(l.y - cy - sprite.height / 2 + (Math.floor(this.total * 4 + l.x) % 2))); }
    for (const e of this.enemies) {
      const sz = e.size, ex = Math.round(e.x - cx - sz / 2), ey = Math.round(e.y - cy - sz / 2);
      if (ex < -sz || ey < -sz || ex > W || ey > H) continue;
      const step = Math.floor(this.total * 6 + e.seed) % 2;
      const sprite = e.hit > 0 ? this.sprites[e.kind + "W"] : step ? this.sprites[e.kind + "2"] : this.sprites[e.kind];
      g.fillStyle = "#00000055"; g.fillRect(ex + 1, ey + sz - 1, sz - 2, 2);
      if (e.kind === "ghost" || e.kind === "wraith") g.globalAlpha = 0.75;
      if (e.freeze > 0 || this.frozen > 0) g.globalAlpha = 0.6;
      if (sprite) {
        const bob = ENEMIES[e.kind].fly ? Math.round(Math.sin(this.total * 5 + e.seed) * 2) : step;
        g.save(); g.translate(ex + sz / 2, ey + sz / 2 - bob); g.scale(e.face, 1); g.drawImage(sprite, -sz / 2, -sz / 2, sz, sz); g.restore();
      }
      g.globalAlpha = 1;
      if (e.freeze > 0 || this.frozen > 0) { g.fillStyle = "#9fe8ff"; g.fillRect(ex, ey, 2, 2); g.fillRect(ex + sz - 2, ey + sz - 2, 2, 2); }
      if (e.burn > 0 && Math.floor(this.total * 10) % 2) { g.fillStyle = "#ff8a3d"; g.fillRect(ex + sz / 2, ey - 1, 1, 2); }
      if (e.elite) { g.strokeStyle = "#ffd23f"; g.strokeRect(ex - 0.5, ey - 0.5, sz + 1, sz + 1); }
      if (e.hp < e.maxHp && !e.boss) { g.fillStyle = "#382128"; g.fillRect(ex, ey - 3, sz, 1); g.fillStyle = "#ff3b5c"; g.fillRect(ex, ey - 3, Math.ceil(sz * e.hp / e.maxHp), 1); }
    }
    // hero
    if (this.inv <= 0 || Math.floor(this.inv * 20) % 2) {
      const hx = Math.round(this.px - cx), hy = Math.round(this.py - cy);
      const step = this.moving ? Math.floor(this.walkT * 8) % 2 : 0;
      g.fillStyle = "#00000066"; g.fillRect(hx - 3, hy + 4, 6, 2);
      g.save(); g.translate(hx, hy - step); g.scale(this.face, 1);
      const hero = this.sprites[step ? "hero2" : "hero"]; if (hero) g.drawImage(hero, -4, -4);
      g.restore();
      if (this.rage > 0) { g.strokeStyle = "#ff3b5c"; g.strokeRect(hx - 5.5, hy - 5.5, 11, 11); }
    }
    for (const h of this.hazards) { const x = Math.round(h.x - cx), y = Math.round(h.y - cy); g.fillStyle = "#ff3b5c"; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = "#ffd0d0"; g.fillRect(x, y, 1, 1); }
    if (this.bossTell > 0 && this.boss) { g.strokeStyle = "#ff3b5c"; g.lineWidth = 2; g.beginPath(); g.moveTo(this.boss.x - cx, this.boss.y - cy); g.lineTo(this.boss.x - cx + this.chargeX * 150, this.boss.y - cy + this.chargeY * 150); g.stroke(); g.lineWidth = 1; }
    for (let i = 0; i < this.stats.orbit; i++) { const a = this.orbitT * 3 + i * Math.PI * 2 / this.stats.orbit; const x = Math.round(this.px - cx + Math.cos(a) * 26), y = Math.round(this.py - cy + Math.sin(a) * 26); g.fillStyle = "#3a8aff"; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = "#bfeaff"; g.fillRect(x - 2, y - 2, 4, 4); }
    for (let i = 0; i < this.stats.drones; i++) { const a = this.total * 1.3 + i * Math.PI * 2 / this.stats.drones; const x = Math.round(this.px - cx + Math.cos(a) * 16), y = Math.round(this.py - cy + Math.sin(a) * 12 - 6); g.fillStyle = "#5a6a5a"; g.fillRect(x - 2, y - 1, 5, 3); g.fillStyle = "#7fff9f"; g.fillRect(x, y, 1, 1); if (Math.floor(this.total * 10) % 2) { g.fillStyle = "#ccc"; g.fillRect(x - 3, y - 2, 7, 1); } }
    // bullets with trails
    for (const b of this.bullets) {
      const bx = Math.round((b.kind === "wave" ? b.ox : b.x) - cx), by = Math.round((b.kind === "wave" ? b.oy : b.y) - cy), sz = b.size, hs = Math.floor(sz / 2);
      if (b.kind === "whip") {
        const t = 1 - b.life / b.max, w = Math.round(sz * Math.min(1, t * 3)), x0 = b.dx > 0 ? bx - sz / 2 : bx + sz / 2 - w;
        g.globalAlpha = Math.max(0.2, b.life / b.max); g.fillStyle = b.color; g.fillRect(Math.round(x0), by - 2, w, 4); g.fillStyle = "#ffffff"; g.fillRect(Math.round(x0), by - 1, w, 1); g.globalAlpha = 1;
        continue;
      }
      const sp = dist(b.vx, b.vy) || 1;
      g.globalAlpha = 0.35; g.fillStyle = b.color; g.fillRect(bx - hs - Math.round(b.vx / sp * sz), by - hs - Math.round(b.vy / sp * sz), sz, sz); g.globalAlpha = 1;
      g.fillStyle = b.color; g.fillRect(bx - hs, by - hs, sz, sz);
      if (sz >= 3) { g.fillStyle = "#ffffff"; g.fillRect(bx - hs + 1, by - hs + 1, 1, 1); }
      if (b.kind === "boomerang") { g.fillStyle = b.color; const r = Math.floor(this.total * 20) % 2; g.fillRect(bx - hs - (r ? 2 : 0), by - hs - (r ? 0 : 2), sz + (r ? 4 : 0), sz + (r ? 0 : 4)); }
    }
    for (const p of this.parts) { g.globalAlpha = Math.min(1, p.life * 4); g.fillStyle = p.color; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size); }
    g.globalAlpha = 1;
    for (const f of this.fx) {
      const a = f.life / f.max; g.globalAlpha = Math.max(0, Math.min(1, a * 1.5));
      if (f.kind === "ring") { g.strokeStyle = f.color; g.lineWidth = 1; g.beginPath(); g.arc(Math.round(f.x - cx), Math.round(f.y - cy), Math.max(1, f.r * (1.2 - a * 0.6)), 0, Math.PI * 2); g.stroke(); }
      else if (f.kind === "line") { g.strokeStyle = f.color; g.lineWidth = Math.max(1, f.r || 1); g.beginPath(); g.moveTo(Math.round(f.x - cx), Math.round(f.y - cy)); g.lineTo(Math.round(f.x2 - cx) + (f.r ? 0 : Math.round(rnd(-1, 1))), Math.round(f.y2 - cy)); g.stroke(); if (f.r) { g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.stroke(); } g.lineWidth = 1; }
      else if (f.kind === "text" && f.text) { g.font = "bold 7px monospace"; g.textAlign = "center"; g.fillStyle = "#000"; g.fillText(f.text, Math.round(f.x - cx) + 1, Math.round(f.y - cy) + 1); g.fillStyle = f.color; g.fillText(f.text, Math.round(f.x - cx), Math.round(f.y - cy)); }
    }
    g.globalAlpha = 1;
    if (this.frozen > 0) { g.fillStyle = "#9fe8ff22"; g.fillRect(0, 0, W, H); }
    if (this.stats.hp < this.stats.maxHp * 0.3 && Math.floor(this.total * 3) % 2) { g.strokeStyle = "#ff3b5c"; g.lineWidth = 3; g.strokeRect(1, 1, W - 2, H - 2); g.lineWidth = 1; }
    // XP bar
    g.fillStyle = "#1a1830"; g.fillRect(0, H - 4, W, 4);
    g.fillStyle = "#4fe3ff"; g.fillRect(0, H - 4, Math.round(W * Math.min(1, this.xp / this.xpNeed)), 4);
    g.fillStyle = "#ffffff55"; g.fillRect(0, H - 4, Math.round(W * Math.min(1, this.xp / this.xpNeed)), 1);
    if (this.pointerActive) {
      g.fillStyle = "#fff";
      const mx = Math.round(this.mx), my = Math.round(this.my);
      g.fillRect(mx, my, 1, 6); g.fillRect(mx + 1, my + 1, 1, 4); g.fillRect(mx + 2, my + 2, 1, 2); g.fillRect(mx + 3, my + 3, 1, 1);
    }
  }
}
