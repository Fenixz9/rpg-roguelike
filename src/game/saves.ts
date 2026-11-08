import { DEFAULT_SETTINGS, type Settings, type Upgrades, CLASSES, WEAPONS } from "./engine";

export interface Save { gems: number; cls: string; up: Upgrades; owned: string[]; weapon: string | null; kills: number; clears: string[]; quests: string[]; }
export interface SaveSlot { name: string; savedAt: string; data: Save; }
export interface SaveBook { active: number; slots: (SaveSlot | null)[]; settings: Settings; }
export const SAVE_KEY = "ultima-vila-slots-v2";
export const newSave = (): Save => ({ gems: 0, cls: "knight", up: { dmg: 0, hp: 0, spd: 0, rate: 0, mag: 0 }, owned: [], weapon: null, kills: 0, clears: [], quests: [] });
export const newBook = (): SaveBook => ({ active: 0, slots: [{ name: "Aventura 1", savedAt: new Date().toISOString(), data: newSave() }, null, null], settings: { ...DEFAULT_SETTINGS } });
export function sanitizeSave(raw: unknown): Save {
  if (!raw || typeof raw !== "object") throw new Error("Save inválido");
  const r = raw as Partial<Save>, s = newSave();
  const number = (n: unknown, max = 9999999) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  s.gems = number(r.gems); s.kills = number(r.kills);
  if (CLASSES.some(c => c.id === r.cls)) s.cls = r.cls as string;
  for (const key of Object.keys(s.up) as (keyof Upgrades)[]) s.up[key] = number(r.up?.[key], 8);
  const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
  s.owned = strings(r.owned).filter(id => WEAPONS.some(w => w.id === id));
  s.clears = strings(r.clears); s.quests = strings(r.quests);
  const weapon = WEAPONS.find(w => w.id === r.weapon);
  if (weapon && (weapon.cost === 0 || s.owned.indexOf(weapon.id) >= 0)) s.weapon = weapon.id;
  return s;
}
export function readBook(): SaveBook {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const r = JSON.parse(raw) as SaveBook;
      const book = newBook();
      book.slots = [0, 1, 2].map(i => r.slots?.[i] ? { name: String(r.slots[i]?.name || "Aventura " + (i + 1)).slice(0, 30), savedAt: String(r.slots[i]?.savedAt), data: sanitizeSave(r.slots[i]?.data) } : null);
      book.active = [0, 1, 2].indexOf(r.active) >= 0 ? r.active : 0;
      if (!book.slots[book.active]) book.slots[book.active] = newBook().slots[0] || null;
      book.settings = {
        speed: Math.max(0.5, Math.min(1.5, Number(r.settings?.speed) || 1)),
        difficulty: ["normal", "hard", "nightmare"].indexOf(r.settings?.difficulty) >= 0 ? r.settings.difficulty : "hard",
        volume: typeof r.settings?.volume === "number" ? Math.max(0, Math.min(1, r.settings.volume)) : 0.35,
        music: r.settings?.music !== false,
      };
      return book;
    }
    const book = newBook(), legacy = localStorage.getItem("ultima-vila-save");
    if (legacy && book.slots[0]) book.slots[0].data = sanitizeSave(JSON.parse(legacy));
    return book;
  } catch { return newBook(); }
}
export function writeBook(book: SaveBook): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(book)); return true; } catch { return false; }
}