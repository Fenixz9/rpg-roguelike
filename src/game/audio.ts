// Small synthesized sound bank: no downloads, and unsupported TVs stay silent safely.
export type Sound = "zap" | "level" | "nova" | "shot" | "hit" | "hurt" | "loot" | "buy" | "card" | "boss" | "win" | "dead" | "chest";
class GameAudio {
  context: AudioContext | null = null;
  volume = 0.35;
  music = true;
  timer: ReturnType<typeof setInterval> | null = null;
  last: Partial<Record<Sound, number>> = {};
  unlock() {
    try {
      const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      if (!this.context) this.context = new Audio();
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
      if (!this.timer) {
        let step = 0;
        const notes = [130.81, 0, 164.81, 196, 146.83, 0, 196, 164.81];
        this.timer = setInterval(() => {
          const note = notes[step++ % notes.length];
          if (this.music && note) this.tone(note, 0.16, 0.035, "triangle");
        }, 320);
      }
    } catch { /* Web Audio is optional on old TVs. */ }
  }
  configure(volume: number, music: boolean) { this.volume = volume; this.music = music; }
  tone(frequency: number, duration: number, gain = 0.12, type: OscillatorType = "square", end?: number) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || !this.volume) return;
    try {
      const oscillator = ctx.createOscillator(), level = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (end) oscillator.frequency.exponentialRampToValueAtTime(end, ctx.currentTime + duration);
      level.gain.setValueAtTime(gain * this.volume, ctx.currentTime);
      level.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.connect(level); level.connect(ctx.destination);
      oscillator.start(); oscillator.stop(ctx.currentTime + duration);
      oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); };
    } catch { /* Audio must never interrupt gameplay. */ }
  }
  play(sound: Sound) {
    const now = Date.now();
    if (now - (this.last[sound] || 0) < (sound === "shot" || sound === "hit" ? 130 : 80)) return;
    this.last[sound] = now;
    const bank: Record<Sound, [number, number, number]> = {
      shot: [420, 0.06, 130], hit: [150, 0.04, 70], hurt: [180, 0.18, 40],
      loot: [880, 0.07, 1200], buy: [440, 0.2, 880], card: [520, 0.3, 1040],
      boss: [90, 0.8, 40], win: [440, 0.8, 1760], dead: [330, 0.7, 40], chest: [660, 0.3, 1320], zap: [1200, 0.08, 300], level: [523, 0.4, 1568], nova: [300, 0.2, 900],
    };
    const [frequency, duration, end] = bank[sound];
    this.tone(frequency, duration, sound === "shot" ? 0.055 : 0.12, "square", end);
  }
}
export const audio = new GameAudio();