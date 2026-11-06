import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Game, PLACES, CLASSES, UPGRADES, MAX_UPGRADE, upgradeCost, makeSprite, HERO, W, H, type Place, type HeroClass, type Upgrades } from "@/game/engine";
import { Village, SPOTS, type Spot } from "@/game/village";

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

interface Save { gems: number; cls: string; up: Upgrades; }
const DEFAULT_SAVE: Save = { gems: 0, cls: "knight", up: { dmg: 0, hp: 0, spd: 0, rate: 0, mag: 0 } };
const SAVE_KEY = "ultima-vila-save";

function Index() {
  const [save, setSave] = useState<Save>(DEFAULT_SAVE);
  const [place, setPlace] = useState<Place | null>(null);
  const [runId, setRunId] = useState(0);
  useEffect(() => {
    try { const raw = window.localStorage.getItem(SAVE_KEY); if (raw) setSave({ ...DEFAULT_SAVE, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const update = (s: Save) => { setSave(s); try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };
  const cls = CLASSES.find((c) => c.id === save.cls) ?? CLASSES[0]!;
  if (!place) return <Hub save={save} cls={cls} onSave={update} onEnter={(p) => { setPlace(p); setRunId((r) => r + 1); }} />;
  return <Run key={runId} place={place} cls={cls} up={save.up} onEnd={(gems) => { update({ ...save, gems: save.gems + gems }); setPlace(null); }} />;
}

type Panel = { kind: "npc"; spot: Spot; line: number } | { kind: "smith" } | { kind: "barracks" } | { kind: "gate" } | null;

function Hub({ save, cls, onSave, onEnter }: { save: Save; cls: HeroClass; onSave: (s: Save) => void; onEnter: (p: Place) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<Village | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [near, setNear] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const v = new Village(canvas, cls, (s) => setPanel(s.kind === "npc" ? { kind: "npc", spot: s, line: 0 } : { kind: s.kind }));
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
    const mm = (e: MouseEvent) => { const [x, y] = pos(e); v.mx = x; v.my = y; };
    const md = (e: MouseEvent) => { if (v.paused) return; const [x, y] = pos(e); v.click(x, y); };
    const kd = (e: KeyboardEvent) => {
      if (e.key.indexOf("Arrow") === 0) e.preventDefault();
      v.keys[e.key] = true;
      if (e.key === "Enter" && !v.paused) { const n = v.nearest(); if (n) v.onArrive(n); }
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
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { vRef.current?.setClass(cls); }, [cls]);
  useEffect(() => { if (vRef.current) vRef.current.paused = panel !== null; }, [panel]);
  const close = () => setPanel(null);
  const nearSpot = SPOTS.find((s) => s.id === near);

  return (
    <div className="pixel relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background" style={{ cursor: panel ? "default" : "none" }}>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
      <div className="absolute left-0 right-0 top-0 flex justify-between p-4 text-lg text-foreground md:text-2xl">
        <div>Vila Segura</div>
        <div>{cls.name} · <span className="text-primary">◆ {save.gems}</span></div>
      </div>
      {!panel && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-base text-foreground md:text-xl">
          {nearSpot ? `${nearSpot.name} — clique ou OK` : "Clique para andar. Vá ao portão (direita) para sair em expedição."}
        </div>
      )}
      {panel?.kind === "npc" && (
        <Overlay title={panel.spot.name}>
          <p className="max-w-2xl text-center text-xl md:text-2xl">"{panel.spot.lines![panel.line]}"</p>
          <Btn primary onClick={() => panel.line + 1 < panel.spot.lines!.length ? setPanel({ ...panel, line: panel.line + 1 }) : close()}>
            {panel.line + 1 < panel.spot.lines!.length ? "Continuar" : "Tchau"}
          </Btn>
        </Overlay>
      )}
      {panel?.kind === "smith" && (
        <Overlay title={`Ferreiro · ◆ ${save.gems}`}>
          <div className="grid gap-3 md:grid-cols-2">
            {UPGRADES.map((u) => {
              const lvl = save.up[u.id], cost = upgradeCost(lvl), max = lvl >= MAX_UPGRADE, can = !max && save.gems >= cost;
              return (
                <button key={u.id} disabled={!can} onClick={() => onSave({ ...save, gems: save.gems - cost, up: { ...save.up, [u.id]: lvl + 1 } })}
                  className={`w-80 border-4 p-4 text-left ${can ? "border-primary bg-card hover:bg-accent" : "border-border bg-muted opacity-60"}`} style={{ cursor: "pointer" }}>
                  <div className="text-xl text-primary">{u.name} <span className="text-muted-foreground">Nv {lvl}/{MAX_UPGRADE}</span></div>
                  <div className="mt-1 text-base">{u.desc} · {max ? "MÁXIMO" : `◆ ${cost}`}</div>
                </button>
              );
            })}
          </div>
          <Btn onClick={close}>Sair</Btn>
        </Overlay>
      )}
      {panel?.kind === "barracks" && (
        <Overlay title="Quartel · escolha sua classe">
          <div className="grid gap-3 md:grid-cols-3">
            {CLASSES.map((c) => (
              <button key={c.id} onClick={() => onSave({ ...save, cls: c.id })}
                className={`w-72 border-4 p-4 text-left hover:bg-accent ${c.id === cls.id ? "border-primary bg-card" : "border-border bg-muted"}`} style={{ cursor: "pointer" }}>
                <div className="flex items-center gap-3"><ClassIcon c={c} /><div className="text-xl text-primary">{c.name}</div></div>
                <div className="mt-2 text-sm text-muted-foreground">Arma: {c.weapon}</div>
                <div className="mt-1 text-sm">{c.desc}</div>
              </button>
            ))}
          </div>
          <Btn primary onClick={close}>Pronto</Btn>
        </Overlay>
      )}
      {panel?.kind === "gate" && (
        <Overlay title="Para onde vamos?">
          <div className="flex flex-col gap-4 md:flex-row">
            {PLACES.map((p) => (
              <button key={p.name} onClick={() => onEnter(p)} className="w-80 border-4 border-primary bg-card p-6 text-left hover:bg-accent" style={{ cursor: "pointer" }}>
                <div className="text-2xl">{p.name}</div>
                <div className="mt-2 text-base text-muted-foreground">{p.waves} hordas · {p.diff === 1 ? "normal" : "difícil"}</div>
              </button>
            ))}
          </div>
          <Btn onClick={close}>Ficar na vila</Btn>
        </Overlay>
      )}
    </div>
  );
}

function ClassIcon({ c }: { c: HeroClass }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.clearRect(0, 0, 8, 8); g.drawImage(makeSprite(HERO, c.pal), 0, 0); }, [c]);
  return <canvas ref={ref} width={8} height={8} style={{ width: 48, height: 48, imageRendering: "pixelated" }} />;
}

function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`border-4 px-8 py-3 text-xl ${primary ? "border-primary bg-card text-primary" : "border-border bg-muted"}`} style={{ cursor: "pointer" }}>{children}</button>;
}

function Run({ place, cls, up, onEnd }: { place: Place; cls: HeroClass; up: Upgrades; onEnd: (gems: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const game = new Game(canvas, place, () => force((n) => n + 1), cls, up);
    gameRef.current = game;
    force((n) => n + 1);
    const tick = window.setInterval(() => force((n) => n + 1), 500);
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
    const mm = (e: MouseEvent) => toCanvas(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => { if (e.touches[0]) toCanvas(e.touches[0].clientX, e.touches[0].clientY); };
    const kd = (e: KeyboardEvent) => {
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
  }, [place]);

  const g = gameRef.current;
  const s = g?.stats;
  const time = g ? Math.floor(g.total) : 0;
  const waveLeft = g ? Math.max(0, Math.ceil(place.waveTime - g.waveT)) : 0;

  return (
    <div className="pixel relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background" style={{ cursor: "none" }}>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
      {g && s && (
        <div className="absolute left-0 right-0 top-0 flex justify-between p-4 text-lg text-foreground md:text-2xl">
          <div>
            <span className="text-destructive">{"♥".repeat(Math.max(0, s.hp))}</span>
            <span className="text-muted-foreground">{"♥".repeat(Math.max(0, s.maxHp - s.hp))}</span>
          </div>
          <div className="text-center">
            {place.name} · Horda {g.wave}/{place.waves} · {waveLeft > 0 ? `${waveLeft}s` : "Limpe a área!"}
          </div>
          <div>◆ {g.gems} · ☠ {g.kills} · {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        </div>
      )}
      {g?.phase === "cards" && (
        <Overlay title={`Horda ${g.wave} vencida! Escolha uma carta`}>
          <div className="flex flex-col gap-4 md:flex-row">
            {g.offer.map((c, i) => (
              <button key={c.id} onClick={() => g.pick(i)} className="w-64 border-4 border-primary bg-card p-6 text-left hover:bg-accent" style={{ cursor: "pointer" }}>
                <div className="text-xs text-muted-foreground">[{i + 1}]</div>
                <div className="mt-1 text-2xl text-primary">{c.title}</div>
                <div className="mt-3 text-lg text-card-foreground">{c.desc}</div>
              </button>
            ))}
          </div>
        </Overlay>
      )}
      {(g?.phase === "dead" || g?.phase === "win") && (
        <Overlay title={g.phase === "win" ? "Área purificada!" : "Você caiu..."}>
          <p className="text-xl text-muted-foreground">Abates: {g.kills} · Gemas: {g.gems} · Tempo: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</p>
          <div className="flex gap-4">
            <button autoFocus onClick={() => onEnd(g.gems)} className="border-4 border-primary bg-card px-8 py-4 text-xl text-primary" style={{ cursor: "pointer" }}>Voltar à vila com ◆ {g.gems}</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 p-6 text-foreground" style={{ cursor: "default" }}>
      <h2 className="text-center text-2xl text-primary md:text-3xl">{title}</h2>
      {children}
    </div>
  );
}
