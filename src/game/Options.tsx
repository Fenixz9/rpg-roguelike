import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, type Settings } from "./engine";
import { audio } from "./audio";
import { newSave, sanitizeSave, type SaveBook, type Save } from "./saves";

export function SettingsPanel({ settings, onChange, onClose }: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  return <div className="g-overlay">
    <h2 className="g-title">Opções</h2>
    <div className="g-settings">
      <label className="g-setting">Velocidade do personagem · {Math.round(settings.speed * 100)}%
        <input aria-label="Velocidade do personagem" type="range" min="50" max="150" step="5" value={Math.round(settings.speed * 100)} onChange={e => onChange({ ...settings, speed: Number(e.target.value) / 100 })} />
      </label>
      <fieldset><legend>Dificuldade das expedições</legend><div className="g-tabs">
        {Object.entries(DIFFICULTIES).map(([id, d]) => <Button variant="game" size="game" key={id} aria-pressed={settings.difficulty === id} className={settings.difficulty === id ? "pri" : ""} onClick={() => onChange({ ...settings, difficulty: id as Settings["difficulty"] })}>{d.name}</Button>)}
      </div></fieldset>
      <p className="g-sub">Recompensa: ×{DIFFICULTIES[settings.difficulty].reward} · vida inimiga: ×{DIFFICULTIES[settings.difficulty].hp} · dano inimigo: ×{DIFFICULTIES[settings.difficulty].damage}</p>
      <label className="g-setting">Volume · {Math.round(settings.volume * 100)}%
        <input aria-label="Volume" type="range" min="0" max="100" step="5" value={Math.round(settings.volume * 100)} onChange={e => { audio.unlock(); onChange({ ...settings, volume: Number(e.target.value) / 100 }); audio.play("loot"); }} />
      </label>
      <label className="g-check"><input type="checkbox" checked={settings.music} onChange={e => onChange({ ...settings, music: e.target.checked })} /> Música 8-bit</label>
    </div>
    <Button variant="game" size="game" onClick={onClose}>Voltar</Button>
  </div>;
}

export function SavesPanel({ book, current, onChange, onClose }: { book: SaveBook; current: Save; onChange: (b: SaveBook) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState<{ index: number; action: "reset" | "overwrite" | "new" } | null>(null);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const apply = (index: number, data: Save) => {
    const slots = book.slots.slice();
    slots[index] = { name: name.trim().slice(0, 30) || slots[index]?.name || "Aventura " + (index + 1), data, savedAt: new Date().toISOString() };
    onChange({ ...book, slots, active: index }); setConfirm(null); setMessage("Progresso salvo.");
  };
  if (confirm) return <div className="g-overlay"><h2 className="g-title">{confirm.action === "reset" ? "Zerar esta aventura?" : "Substituir este save?"}</h2><p className="g-text">O progresso do espaço {confirm.index + 1} será apagado. Os outros saves não mudam.</p><Button variant="game" size="game" onClick={() => apply(confirm.index, confirm.action === "overwrite" ? current : newSave())}>Confirmar</Button><Button variant="game" size="game" onClick={() => setConfirm(null)}>Cancelar</Button></div>;
  return <div className="g-overlay"><h2 className="g-title">Suas aventuras</h2>
    <label className="g-setting">Nome do save<input aria-label="Nome do save" value={name} maxLength={30} placeholder="Minha aventura" onChange={e => setName(e.target.value)} /></label>
    <div className="g-row">{book.slots.map((slot, index) => <div className="g-save-slot" key={index}>
      <h3>{index + 1} · {slot?.name || "Espaço vazio"}{book.active === index ? " ✓" : ""}</h3>
      {slot && <p className="g-sub">◆ {Math.floor(slot.data.gems)} · {slot.data.clears.length} áreas · {slot.data.kills} abates</p>}
      {slot && <Button variant="game" size="game" disabled={book.active === index} onClick={() => { onChange({ ...book, active: index }); setMessage("Aventura carregada."); }}>Carregar</Button>}
      <Button variant="game" size="game" onClick={() => slot && book.active !== index ? setConfirm({ index, action: "overwrite" }) : apply(index, current)}>Salvar aqui</Button>
      <Button variant="game" size="game" onClick={() => slot ? setConfirm({ index, action: "new" }) : apply(index, newSave())}>Nova aventura</Button>
      {slot && <Button variant="game" size="game" onClick={() => setConfirm({ index, action: "reset" })}>Zerar</Button>}
    </div>)}</div>
    <div className="g-tabs"><Button variant="game" size="game" onClick={() => {
      const blob = new Blob([JSON.stringify(current)], { type: "application/json" });
      const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = "ultima-vila-save.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    }}>Exportar save</Button><Button variant="game" size="game" onClick={() => input.current?.click()}>Importar save</Button></div>
    <input ref={input} type="file" accept=".json,application/json" hidden onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = sanitizeSave(JSON.parse(String(reader.result))); const index = book.slots.findIndex(s => !s); if (index < 0) { setMessage("Crie um espaço vazio antes de importar."); return; } apply(index, data); } catch { setMessage("Este arquivo não é um save válido."); } }; reader.readAsText(file); e.target.value = ""; }} />
    <p className="g-sub" role="status">{message || "Salvo neste navegador · exporte uma cópia para guardar."}</p><Button variant="game" size="game" onClick={onClose}>Voltar à vila</Button>
  </div>;
}