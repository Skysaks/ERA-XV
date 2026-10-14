import { en, fr, es } from './locales/index';

export type Lang = 'en' | 'fr' | 'es';
export const LANGS: Lang[] = ['fr', 'en', 'es'];
export type Dict = Record<string, string>;
const DICTS: Record<Lang, Dict> = { en, fr, es };
let current: Lang = 'en';

export function detectLang(): Lang {
  try {
    const n = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (n === 'fr' || n === 'es') return n;
  } catch { /* ignore */ }
  return 'en';
}
export const setLang = (l: Lang) => { current = l; try { document.documentElement.lang = l; } catch { /* ignore */ } };
export const dict = (l: Lang) => DICTS[l];

type Vars = Record<string, string | number | undefined>;
export function t(key: string, vars?: Vars): string {
  const d = DICTS[current];
  let k = key;
  if (vars && typeof vars.n === 'number') {
    const pk = `${key}_${vars.n === 1 ? 'one' : 'other'}`;
    if (d[pk] ?? DICTS.en[pk]) k = pk;
  }
  const s = d[k] ?? DICTS.en[k] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, v) => (vars[v] === undefined ? `{${v}}` : String(vars[v]))) : s;
}
export const has = (key: string) => key in DICTS[current] || key in DICTS.en;

export function ordinal(n: number): string {
  if (current === 'fr') return n === 1 ? '1er' : `${n}e`;
  if (current === 'es') return `${n}.º`;
  const m100 = n % 100, m10 = n % 10;
  const suf = m100 >= 11 && m100 <= 13 ? 'th' : m10 === 1 ? 'st' : m10 === 2 ? 'nd' : m10 === 3 ? 'rd' : 'th';
  return `${n}${suf}`;
}

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  try { return new Intl.DateTimeFormat(current, opts).format(d); } catch { return d.toDateString(); }
}

export function fmtNumber(n: number): string {
  try { return new Intl.NumberFormat(current).format(n); } catch { return String(n); }
}
