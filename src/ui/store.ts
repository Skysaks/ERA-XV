/** Per-viewer conveniences in browser storage. Every access is guarded: the game works without it. */
import type { ModeId } from '../engine/modes';
import type { PlanId, RulesetId } from '../engine/rugby';
import type { Lang } from './i18n';

const NS = 'era-xv:';
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch { return fallback; }
}
export function save(key: string, v: unknown): void {
  try { localStorage.setItem(NS + key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}
export function remove(key: string): void { try { localStorage.removeItem(NS + key); } catch { /* ignore */ } }
export function clearAll(): void {
  try {
    const ks: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(NS)) ks.push(k); }
    ks.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
export function exportAll(): string {
  const out: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) out[k.slice(NS.length)] = JSON.parse(localStorage.getItem(k) ?? 'null');
    }
  } catch { /* ignore */ }
  return JSON.stringify(out);
}

/* ------------------------------------------------------------ settings */

export type SimSpeed = 'live' | 'fast' | 'instant';
export type Knowledge = 'minimal' | 'standard' | 'deep';
export interface Settings {
  lang?: Lang;
  sim: SimSpeed;
  hints: boolean;
  preview: boolean;
  resume: boolean;
  sound: boolean;
  haptics: boolean;
  motion: 'system' | 'full' | 'reduced';
  contrast: boolean;
  largeText: boolean;
  knowledge: Knowledge;
  mode: ModeId;
  plan: PlanId;
  ruleset: RulesetId;
  name: string;
  /** generated room nickname, used when no name is set */
  nick?: string;
}
export const DEFAULT_SETTINGS: Settings = {
  sim: 'live', hints: true, preview: true, resume: true, sound: false, haptics: true, motion: 'system', contrast: false, largeText: false,
  knowledge: 'standard', mode: 'classic', plan: 'balanced', ruleset: 'intl', name: '',
};
export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>('settings', {}) });
export const saveSettings = (s: Settings) => save('settings', s);

/* ------------------------------------------------------------- records */

/**
 * One finished game. v2 adds everything needed to reproduce and re-validate it after the game or the data evolve:
 * the version stamp, the draw id, the context (daily, challenge, weekly) and the final standing.
 */
export interface GameLog {
  id: string; date: number; mode: ModeId; plan: PlanId; ruleset: RulesetId; pts: number; w: number; d: number; l: number;
  fit: number; ovr: number; pack: number; backs: number; def: number; boot: number; attack: number;
  token: string; finish?: string; gauntlet?: number; hidden: boolean; rerolled: boolean; daily?: string; official?: boolean;
  picks: string[]; oop: number; tookTop: number; seed: number; param?: string; fav?: boolean;
  /* v2 */
  v?: 2;
  versions?: { engine: number; data: number; rules: number; modes: number };
  kind?: 'solo' | 'daily' | 'weekly' | 'challenge' | 'practice' | 'room';
  drawId?: string;
  /** a friend challenge being answered: the challenge's draw id */
  challengeId?: string;
  pos?: number;
  tb?: number; lb?: number; pf?: number; pa?: number; tf?: number;
  halves?: number; centres?: number; back3?: number;
}
export interface Records {
  games: number; sum: number; best: number; byMode: Partial<Record<ModeId, number>>;
  hundreds: number; unbeaten: number; titles: number;
  daily: Record<string, number>;
  duels: { w: number; l: number }; partiesWon: number;
  achievements: string[];
  bestRatings: { fit: number; pack: number; backs: number; def: number };
}
export const EMPTY_RECORDS: Records = {
  games: 0, sum: 0, best: 0, byMode: {}, hundreds: 0, unbeaten: 0, titles: 0, daily: {}, duels: { w: 0, l: 0 }, partiesWon: 0, achievements: [],
  bestRatings: { fit: 0, pack: 0, backs: 0, def: 0 },
};
export const loadRecords = (): Records => ({ ...EMPTY_RECORDS, ...load<Partial<Records>>('records', {}) });
export const saveRecords = (r: Records) => save('records', r);
export const loadLogs = (): GameLog[] => load<GameLog[]>('logs', []);
export const LOG_LIMIT = 500;
export const saveLogs = (l: GameLog[]) => save('logs', l.slice(-LOG_LIMIT));

/** Era Passport: every player (person), version, team-era and nation met. */
export interface Passport {
  /** person → [offered, drafted, passed] */
  players: Record<string, [number, number, number]>;
  /** version key → [offered, drafted] (2.1: player vs version) */
  versions: Record<string, [number, number]>;
  teams: string[]; nats: string[]; eras: string[];
}
export const loadPassport = (): Passport => ({ players: {}, versions: {}, teams: [], nats: [], eras: [], ...load<Partial<Passport>>('passport', {}) });
export const savePassport = (p: Passport) => save('passport', p);

/** An unfinished solo game: the draft, or a finished draft waiting on the match sheet or the game plan. */
export interface Resume {
  cfg: import('../engine/draft').DraftConfig; picks: string[]; rerollRound: number; savedAt: number; daily?: string; official?: boolean;
  /* v2 */
  v?: 2;
  stage?: 'draft' | 'sheet' | 'plan';
  lineup?: (string | null)[];
  plan?: PlanId;
  /** the friend challenge being answered (its link token) */
  challenge?: string;
  intent?: 'challenge';
  versions?: { engine: number; data: number; rules: number; modes: number };
}
export const loadResume = (): Resume | null => load<Resume | null>('resume', null);
export const saveResume = (r: Resume | null) => (r ? save('resume', r) : remove('resume'));

/* ---------------------------------------------------------- onboarding */

export interface Onboarding { done: boolean; seen: string[]; /** asked again from Settings */ forced?: boolean }
export const loadOnboarding = (): Onboarding => ({ done: false, seen: [], ...load<Partial<Onboarding>>('onboarding', {}) });
export const saveOnboarding = (o: Onboarding) => save('onboarding', o);
