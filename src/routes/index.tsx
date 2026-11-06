import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Game, PLACES, W, H, type Place } from "@/game/engine";

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

function Index() {
  const [place, setPlace] = useState<Place | null>(null);
  const [runId, setRunId] = useState(0);
  if (!place) return <Menu onPick={(p) => { setPlace(p); setRunId((r) => r + 1); }} />;
  return <Run key={runId} place={place} onExit={() => setPlace(null)} onRetry={() => setRunId((r) => r + 1)} />;
}

function Menu({ onPick }: { onPick: (p: Place) => void }) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") setSel(0);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") setSel(1);
      if (e.key === "Enter") onPick(PLACES[sel]!);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sel, onPick]);
  return (
    <div className="pixel flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 text-foreground">
      <h1 className="text-4xl text-primary md:text-6xl">ÚLTIMA VILA</h1>
      <p className="text-center text-sm text-muted-foreground">Escolha onde entrar</p>
      <div className="flex flex-col gap-4 md:flex-row">
        {PLACES.map((p, i) => (
          <button
            key={p.name}
            onMouseEnter={() => setSel(i)}
            onClick={() => onPick(p)}
            className={`border-4 px-8 py-6 text-left ${sel === i ? "border-primary bg-card" : "border-border bg-muted"}`}
          >
            <div className="text-xl">{p.name}</div>
            <div className="mt-2 text-xs text-muted-foreground">{p.waves} hordas · dificuldade {p.diff === 1 ? "normal" : "difícil"}</div>
          </button>
        ))}
      </div>
      <p className="max-w-lg text-center text-xs text-muted-foreground">
        O herói segue o ponteiro e atira na direção dele. Sem ponteiro: setas movem e a mira é automática.
      </p>
    </div>
  );
}

function Run({ place, onExit, onRetry }: { place: Place; onExit: () => void; onRetry: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const game = new Game(canvas, place, () => force((n) => n + 1));
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
        <div className="absolute left-0 right-0 top-0 flex justify-between p-4 text-sm text-foreground md:text-lg">
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
              <button key={c.id} onClick={() => g.pick(i)} className="w-56 border-4 border-primary bg-card p-5 text-left hover:bg-accent" style={{ cursor: "pointer" }}>
                <div className="text-xs text-muted-foreground">[{i + 1}]</div>
                <div className="mt-1 text-lg text-primary">{c.title}</div>
                <div className="mt-3 text-sm text-card-foreground">{c.desc}</div>
              </button>
            ))}
          </div>
        </Overlay>
      )}
      {(g?.phase === "dead" || g?.phase === "win") && (
        <Overlay title={g.phase === "win" ? "Área purificada!" : "Você caiu..."}>
          <p className="text-muted-foreground">Abates: {g.kills} · Gemas: {g.gems} · Tempo: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</p>
          <div className="flex gap-4">
            <button autoFocus onClick={onRetry} className="border-4 border-primary bg-card px-6 py-3 text-primary" style={{ cursor: "pointer" }}>Jogar de novo</button>
            <button onClick={onExit} className="border-4 border-border bg-muted px-6 py-3" style={{ cursor: "pointer" }}>Menu</button>
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
