/** Discreet feedback: short vibrations and tones, only when the player allows them in Settings. */
let prefs = { sound: false, haptics: true };
export const setFeel = (p: { sound: boolean; haptics: boolean }) => { prefs = { sound: p.sound, haptics: p.haptics }; };

const PATTERNS = { pick: 8, unit: [10, 40, 14], win: 12, qualify: [14, 50, 18], title: [18, 60, 18, 60, 30] } as const;
export type Feel = keyof typeof PATTERNS;

export function haptic(kind: Feel) {
  if (!prefs.haptics) return;
  try { navigator.vibrate?.(PATTERNS[kind] as number | number[]); } catch { /* ignore */ }
}

export function tone(f = 660, ms = 120) {
  if (!prefs.sound) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = f; o.type = 'triangle'; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000); o.stop(ctx.currentTime + ms / 1000 + 0.01);
  } catch { /* ignore */ }
}

/** true when the player asked for less motion (setting or system) */
