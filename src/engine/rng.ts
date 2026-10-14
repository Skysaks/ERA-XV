/** Deterministic randomness. Everything that matters for a challenge flows from string seeds. */

export function hashStr(s: string): number {
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0) ^ ((h2 >>> 0) & 0x1fffff);
}

/** uniform in [0,1) for a key — the unit of common random numbers */
export function u01(...parts: (string | number)[]): number {
  let x = hashStr(parts.join('|')) >>> 0;
  // splitmix-ish finaliser
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967296;
}

export class Rng {
  private s: number;
  constructor(seed: string | number) { this.s = typeof seed === 'number' ? seed >>> 0 : hashStr(seed); if (this.s === 0) this.s = 0x9e3779b9; }
  next(): number {
    // mulberry32
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number { return Math.floor(this.next() * n); }
  pick<T>(arr: readonly T[]): T { return arr[this.int(arr.length)]; }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

/** Poisson inverse-CDF: monotone in lambda for a fixed u (common random numbers). */
export function poissonInv(lambda: number, u: number): number {
  if (lambda <= 0) return 0;
  let k = 0, p = Math.exp(-lambda), cdf = p;
  while (u > cdf && k < 40) { k++; p *= lambda / k; cdf += p; }
  return k;
}

/** Random 32-bit seed (non-deterministic) for a fresh draft, printable. */
export function freshSeed(): number {
  const a = new Uint32Array(1);
  try { crypto.getRandomValues(a); return a[0] >>> 0 || 1; } catch { return (Math.random() * 4294967295) >>> 0 || 1; }
}

export function dailySeed(date: Date): number {
  const d = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  return hashStr(`era-xv-daily-${d}`) >>> 0;
}
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}
