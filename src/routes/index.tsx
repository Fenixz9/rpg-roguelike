import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Game, PLACES, CLASSES, UPGRADES, WEAPONS, MAX_UPGRADE, upgradeCost, makeSprite, HERO, W, H, type Place, type HeroClass, type Upgrades, type Weapon, type Settings } from "@/game/engine";
import { Button } from "@/components/ui/button";
import { SettingsPanel, SavesPanel } from "@/game/Options";
import { audio } from "@/game/audio";
import { newBook, newSave, readBook, writeBook, type Save, type SaveBook } from "@/game/saves";
import { Village, SPOTS, type Spot, type Quest } from "@/game/village";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Última Vila — Roguelike Pixel" },
      { name: "description", content: "Roguelike pixelado: enfrente zumbis, esqueletos e múmias em cavernas e vilas abandonadas." },
      { property: "og:title", content: "Última Vila — Roguelike Pixel" },
      { property: "og:description", content: "Enfrente hordas de mortos-vivos, colete loot e escolha cartas a cada horda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const findWeapon = (id: string) => WEAPONS.find(w => w.id === id) || WEAPONS[0];
const hasWeapon = (s: Save, w: Weapon) => w.cost === 0 || s.owned.indexOf(w.id) >= 0;

// Fit the 320x180 canvas into the screen with JS (old TV browsers lack CSS min()).
function useFit(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const fit = () => {
      const c = ref.current; if (!c) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.min(vw / W, vh / H);
      const w = Math.floor(W * s), h = Math.floor(H * s);
      c.style.width = w + "px"; c.style.height = h + "px";
      c.style.left = Math.floor((vw - w) / 2) + "px"; c.style.top = Math.floor((vh - h) / 2) + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref]);
}

function Index() {
  const [book, setBook] = useState<SaveBook>(() => newBook());
  const [storageError, setStorageError] = useState(false);
  const save = book.slots[book.active]?.data || newSave();
  const [place, setPlace] = useState<Place | null>(null);
  const [runId, setRunId] = useState(0);
  useEffect(() => { setBook(readBook()); }, []);
  useEffect(() => { audio.configure(book.settings.volume, book.settings.music); }, [book.settings]);
  const updateBook = (next: SaveBook) => { setBook(next); setStorageError(!writeBook(next)); };
  const update = (data: Save) => {
    const slots = book.slots.slice(), previous = slots[book.active];
    slots[book.active] = { name: previous?.name || "Aventura " + (book.active + 1), savedAt: new Date().toISOString(), data };
    updateBook({ ...book, slots });
  };
  const cls = CLASSES.find(c => c.id === save.cls) || CLASSES[0];
  if (!cls) return null;
  const weapon = findWeapon(save.weapon || cls.weapon);
  if (!weapon) return null;
  if (!place) return <Hub key={book.active} book={book} onBook={updateBook} storageError={storageError} save={save} cls={cls} weapon={weapon} onSave={update} onEnter={(p) => { setPlace(p); setRunId((r) => r + 1); }} />;
  return (
    <Run key={runId} place={place} cls={cls} weapon={weapon} up={save.up} settings={book.settings} onSettings={settings => updateBook({ ...book, settings })}
      onEnd={(gems, kills, won) => {
        const clears = won && save.clears.indexOf(place.id) < 0 ? save.clears.concat([place.id]) : save.clears;
        update({ ...save, gems: save.gems + Math.floor(gems), kills: save.kills + kills, clears });
        setPlace(null);
      }} />
  );
}

type Panel = { kind: "npc"; spot: Spot; line: number } | { kind: "smith"; tab: "weapons" | "up" } | { kind: "barracks" } | { kind: "gate" } | { kind: "options" } | { kind: "saves" } | null;

function questState(save: Save, q: Quest): "done" | "ready" | "open" {
  if (save.quests.indexOf(q.id) >= 0) return "done";
  if (q.kind === "kills" ? save.kills >= (q.goal as number) : save.clears.indexOf(q.goal as string) >= 0) return "ready";
  return "open";
}

function Hub({ save, cls, weapon, onSave, onEnter, book, onBook, storageError }: { book: SaveBook; onBook: (b: SaveBook) => void; storageError: boolean; save: Save; cls: HeroClass; weapon: Weapon; onSave: (s: Save) => void; onEnter: (p: Place) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<Village | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [near, setNear] = useState<string | null>(null);
  useFit(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const v = new Village(canvas, cls, (s) => setPanel(s.kind === "npc" ? { kind: "npc", spot: s, line: 0 } : s.kind === "smith" ? { kind: "smith", tab: "weapons" } : { kind: s.kind }));
    vRef.current = v;
    let raf = 0, last = performance.now(), lastNear: string | null = null;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      v.update(dt); v.draw();
      const n = v.nearest(); const id = n ? n.id : null;
      if (id !== lastNear) { lastNear = id; setNear(id); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const pos = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const; };
    const mm = (e: MouseEvent) => { const p = pos(e), cam = v.camera(); v.mx = p[0] + cam.x; v.my = p[1] + cam.y; };
    const md = (e: MouseEvent) => { audio.unlock(); if (v.paused) return; const p = pos(e); v.click(p[0], p[1]); };
    const touch = (e: TouchEvent) => { const t = e.touches[0]; if (t) md({ clientX: t.clientX, clientY: t.clientY } as MouseEvent); };
    canvas.addEventListener("touchstart", touch);
    const kd = (e: KeyboardEvent) => {
      audio.unlock();
      if (v.paused) return;
      if (e.key.indexOf("Arrow") === 0) e.preventDefault();
      v.keys[e.key] = true;
      if (e.key === "Enter") { const n = v.nearest(); if (n) v.onArrive(n); }
    };
    const ku = (e: KeyboardEvent) => { v.keys[e.key] = false; };
    window.addEventListener("mousemove", mm);
    canvas.addEventListener("mousedown", md);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", mm);
      canvas.removeEventListener("mousedown", md);
      canvas.removeEventListener("touchstart", touch);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (vRef.current) vRef.current.setClass(cls); }, [cls]);
  useEffect(() => { if (vRef.current) { vRef.current.paused = panel !== null; vRef.current.keys = {}; } }, [panel]);
  useEffect(() => { if (vRef.current) vRef.current.speed = book.settings.speed; }, [book.settings.speed]);
  const close = () => setPanel(null);
  const nearSpot = SPOTS.filter((s) => s.id === near)[0];

  return (
    <div className="g-root" style={{ cursor: panel ? "default" : "none" }}>
      <canvas ref={canvasRef} width={W} height={H} className="g-canvas" />
      <div className="g-hud">
        <div>Vila Segura</div>
        <div>{cls.name} · {weapon.name} · <span className="g-gold">◆ {save.gems}</span></div>
      </div>
      {!panel && <div className="g-tools"><Button variant="game" size="game" onClick={() => { audio.unlock(); setPanel({ kind: "options" }); }}>Opções</Button><Button variant="game" size="game" onClick={() => setPanel({ kind: "saves" })}>Saves</Button></div>}
      {!panel && nearSpot && <div className="g-interact"><Button variant="game" size="game" onClick={() => vRef.current?.onArrive(nearSpot)}>{nearSpot.name}</Button></div>}
      {storageError && <p className="g-warning">Não foi possível salvar. Exporte seu save antes de sair.</p>}
      {panel?.kind === "options" && <SettingsPanel settings={book.settings} onChange={settings => onBook({ ...book, settings })} onClose={close} />}
      {panel?.kind === "saves" && <SavesPanel book={book} current={save} onChange={onBook} onClose={close} />}
      {panel && panel.kind === "npc" && <NpcPanel panel={panel} save={save} onSave={onSave} setPanel={setPanel} close={close} />}
      {panel && panel.kind === "smith" && (
        <div className="g-overlay">
          <h2 className="g-title">Ferreiro Bruno · <span className="g-gold">◆ {save.gems}</span></h2>
          <div className="g-tabs">
            <Button variant="game" size="game" className={"g-btn" + (panel.tab === "weapons" ? " pri" : "")} onClick={() => setPanel({ kind: "smith", tab: "weapons" })}>Armas</Button>
            <Button variant="game" size="game" className={"g-btn" + (panel.tab === "up" ? " pri" : "")} onClick={() => setPanel({ kind: "smith", tab: "up" })}>Melhorias</Button>
          </div>
          {panel.tab === "weapons" ? (
            <div className="g-row">
              {WEAPONS.map((w) => {
                const own = hasWeapon(save, w), eq = w.id === weapon.id, can = !own && save.gems >= w.cost;
                return (
                  <Button variant="gameCard" size="game" key={w.id} className={"g-card" + (eq ? " sel" : "") + (!own && !can ? " off" : "")}
                    onClick={() => {
                      audio.play("buy");
                      if (own) onSave({ ...save, weapon: w.id });
                      else if (can) onSave({ ...save, gems: save.gems - w.cost, owned: save.owned.concat([w.id]), weapon: w.id });
                    }}>
                    <div className="t">{w.name}</div>
                    <div className="d">{w.desc}</div>
                    <div className="k">{eq ? "EQUIPADA" : own ? "Equipar" : "◆ " + w.cost}</div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="g-row">
              {UPGRADES.map((u) => {
                const lvl = save.up[u.id], cost = upgradeCost(lvl), max = lvl >= MAX_UPGRADE, can = !max && save.gems >= cost;
                return (
                  <Button variant="gameCard" size="game" key={u.id} className={"g-card" + (can ? "" : " off")}
                    onClick={() => { if (can) { audio.play("buy"); onSave({ ...save, gems: save.gems - cost, up: { ...save.up, [u.id]: lvl + 1 } }); } }}>
                    <div className="t">{u.name} <span className="k">Nv {lvl}/{MAX_UPGRADE}</span></div>
                    <div className="d">{u.desc} · {max ? "MÁXIMO" : "◆ " + cost}</div>
                  </Button>
                );
              })}
            </div>
          )}
          <Button variant="game" size="game" className="g-btn" onClick={close}>Sair</Button>
        </div>
      )}
      {panel && panel.kind === "barracks" && (
        <div className="g-overlay">
          <h2 className="g-title">Quartel · escolha sua classe</h2>
          <div className="g-row">
            {CLASSES.map((c) => (
              <Button variant="gameCard" size="game" key={c.id} className={"g-card" + (c.id === cls.id ? " sel" : "")}
                onClick={() => onSave({ ...save, cls: c.id, weapon: null })}>
                <div className="t"><ClassIcon c={c} />{c.name}{c.id === cls.id ? " ✓" : ""}</div>
                <div className="d">{c.desc}</div>
                <div className="k">Arma inicial: {findWeapon(c.weapon)?.name}</div>
              </Button>
            ))}
          </div>
          <Button variant="game" size="game" className="g-btn pri" onClick={close}>Pronto</Button>
        </div>
      )}
      {panel && panel.kind === "gate" && (
        <div className="g-overlay">
          <h2 className="g-title">Para onde vamos?</h2>
          <div className="g-row">
            {PLACES.map((p) => (
              <Button variant="gameCard" size="game" key={p.id} className="g-card" onClick={() => { audio.unlock(); onEnter(p); }}>
                <div className="t">{p.name}{save.clears.indexOf(p.id) >= 0 ? " ✓" : ""}</div>
                <div className="d">{p.waves} hordas · {Math.round(p.waves * p.waveTime / 60)}–8 min · {p.boss}</div>
              </Button>
            ))}
          </div>
          <Button variant="game" size="game" className="g-btn" onClick={close}>Ficar na vila</Button>
        </div>
      )}
    </div>
  );
}

function NpcPanel({ panel, save, onSave, setPanel, close }: { panel: { kind: "npc"; spot: Spot; line: number }; save: Save; onSave: (s: Save) => void; setPanel: (p: Panel) => void; close: () => void }) {
  const lines = panel.spot.lines || [];
  const q = panel.spot.quest;
  if (panel.line < lines.length) {
    return (
      <div className="g-overlay">
        <h2 className="g-title">{panel.spot.name}</h2>
        <p className="g-text">"{lines[panel.line]}"</p>
        <Button variant="game" size="game" className="g-btn pri" autoFocus onClick={() => setPanel({ ...panel, line: panel.line + 1 })}>Continuar</Button>
      </div>
    );
  }
  const st = q ? questState(save, q) : "done";
  return (
    <div className="g-overlay">
      <h2 className="g-title">{panel.spot.name}</h2>
      {q && (
        <>
          <p className="g-text">Pedido: {q.text}</p>
          <p className="g-sub">
            {q.kind === "kills" ? "Progresso: " + Math.min(save.kills, q.goal as number) + "/" + q.goal + " · " : ""}
            Recompensa: <span className="g-gold">◆ {q.reward}</span>
          </p>
          {st === "done" && <p className="g-sub">"Obrigado, herói! Você já me ajudou."</p>}
          {st === "ready" && (
            <Button variant="game" size="game" className="g-btn pri" autoFocus onClick={() => { onSave({ ...save, gems: save.gems + q.reward, quests: save.quests.concat([q.id]) }); }}>Receber recompensa</Button>
          )}
        </>
      )}
      <Button variant="game" size="game" className="g-btn" autoFocus={st !== "ready"} onClick={close}>Tchau</Button>
    </div>
  );
}

function ClassIcon({ c }: { c: HeroClass }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current?.getContext("2d"); if (!g) return; g.clearRect(0, 0, 8, 8); g.drawImage(makeSprite(c.rows || HERO, c.pal), 0, 0); }, [c]);
  return <canvas ref={ref} width={8} height={8} className="g-icon" />;
}

function Run({ place, cls, weapon, up, onEnd, settings, onSettings }: { settings: Settings; onSettings: (s: Settings) => void; place: Place; cls: HeroClass; weapon: Weapon; up: Upgrades; onEnd: (gems: number, kills: number, won: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [, force] = useState(0);
  const [options, setOptions] = useState(false);
  useFit(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const game = new Game(canvas, place, () => force((n) => n + 1), cls, weapon, up, settings);
    gameRef.current = game;
    force((n) => n + 1);
    const tick = window.setInterval(() => force((n) => n + 1), 400);
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      game.update(dt);
      game.draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const toCanvas = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      game.mx = ((cx - r.left) / r.width) * W;
      game.my = ((cy - r.top) / r.height) * H;
      game.pointerActive = true;
    };
    const mm = (e: MouseEvent) => { if (game.phase === "play") toCanvas(e.clientX, e.clientY); };
    const tm = (e: TouchEvent) => { audio.unlock(); if (game.phase === "play" && e.touches[0]) toCanvas(e.touches[0].clientX, e.touches[0].clientY); };
    const kd = (e: KeyboardEvent) => {
      audio.unlock(); if (e.key === "Escape") game.togglePause();
      if (e.key.indexOf("Arrow") === 0) { game.pointerActive = false; e.preventDefault(); }
      game.keys[e.key] = true;
      if (game.phase === "cards" && /^[123]$/.test(e.key)) game.pick(Number(e.key) - 1);
    };
    const ku = (e: KeyboardEvent) => { game.keys[e.key] = false; };
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm);
    window.addEventListener("touchstart", tm);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchstart", tm);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  useEffect(() => { gameRef.current?.setSettings(settings); }, [settings]);
  const g = gameRef.current;
  const s = g ? g.stats : null;
  const time = g ? Math.floor(g.total) : 0;
  const waveLeft = g ? Math.max(0, Math.ceil(place.waveTime - g.waveT)) : 0;
  const clock = Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + (time % 60);

  return (
    <div className="g-root" style={{ cursor: g && g.phase === "play" ? "none" : "default" }}>
      <canvas ref={canvasRef} width={W} height={H} className="g-canvas" />
      {g && s && (
        <div className="g-hud">
          <div>
            <span className="g-red">♥ {Math.ceil(s.hp)}/{s.maxHp}</span>
            
          </div>
          <div>Horda {g.wave}/{place.waves} · {waveLeft > 0 ? waveLeft + "s" : "Limpe a área!"}</div>
          <div><span className="g-gold">◆ {Math.floor(g.gems)}</span> · ☠ {g.kills} · {clock}</div>
        </div>
      )}
      {g?.boss && <div className="g-boss">{place.boss} · {Math.ceil(g.boss.hp)}/{Math.ceil(g.boss.maxHp)}<progress value={g.boss.hp} max={g.boss.maxHp} /></div>}
      {g?.phase === "play" && <div className="g-tools"><Button variant="game" size="game" aria-label="Pausar" onClick={() => g.togglePause()}>Ⅱ Pausa</Button></div>}
      {g?.phase === "paused" && !options && <div className="g-overlay"><h2 className="g-title">Expedição pausada</h2><p className="g-text">{cls.name} · {weapon.name}<br />Dano {s?.damage.toFixed(1)} · vida {Math.ceil(s?.hp || 0)}/{s?.maxHp}</p><p className="g-sub">{g.cardsTaken.join(" · ") || "Nenhuma carta ainda"}</p><Button variant="game" size="game" onClick={() => g.togglePause()}>Continuar</Button><Button variant="game" size="game" onClick={() => setOptions(true)}>Opções</Button><Button variant="game" size="game" onClick={() => onEnd(g.gems, g.kills, false)}>Voltar à vila</Button></div>}
      {options && <SettingsPanel settings={settings} onChange={onSettings} onClose={() => setOptions(false)} />}
      {g && g.phase === "cards" && (
        <div className="g-overlay">
          <h2 className="g-title">Horda {g.wave} vencida! Escolha uma carta</h2>
          <div className="g-row">
            {g.offer.map((c, i) => (
              <Button variant="gameCard" size="game" key={c.id} className="g-card" autoFocus={i === 0} onClick={() => g.pick(i)}>
                <div className="k">[{i + 1}]</div>
                <div className="t">{c.title}</div>
                <div className="d">{c.desc}</div>
              </Button>
            ))}
          </div>
        </div>
      )}
      {g && (g.phase === "dead" || g.phase === "win") && (
        <div className="g-overlay">
          <h2 className="g-title">{g.phase === "win" ? "Área purificada!" : "Você caiu..."}</h2>
          <p className="g-text">Abates: {g.kills} · Gemas: {Math.floor(g.gems)} · Tempo: {clock}</p>
          <Button variant="game" size="game" className="g-btn pri" autoFocus onClick={() => onEnd(g.gems, g.kills, g.phase === "win")}>Voltar à vila com ◆ {Math.floor(g.gems)}</Button>
        </div>
      )}
    </div>
  );
}
