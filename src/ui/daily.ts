/**
 * Daily XV on this device: one official attempt per UTC day, practice replays kept apart, a regularity streak that
 * never takes anything away. Without a server this is honour-based (clearing the browser storage resets it);
 * a leaderboard must re-validate entries server-side (engine/official.ts).
 */
import { dailyChallenge, utcDay, type FeaturedChallenge } from '../engine/index';
import type { PlanId } from '../engine/index';
import { load, loadRecords, save } from './store';

export interface DailyEntry { day: string; pts: number; pos?: number; w?: number; d?: number; l?: number; fit?: number; plan?: PlanId; token?: string; at: number }
export interface DailyStore {
  /** official results by UTC day */
  entries: Record<string, DailyEntry>;
  /** official attempt locked in (first pick made) */
  started: Record<string, number>;
  /** official attempt given up: the rest of the day is practice */
  abandoned: Record<string, number>;
  /** practice replays per day, best score */
  practice: Record<string, { n: number; best: number }>;
  /** longest run of consecutive official Dailies (kept when a run ends) */
  bestStreak: number;
}

const EMPTY: DailyStore = { entries: {}, started: {}, abandoned: {}, practice: {}, bestStreak: 0 };

export function loadDaily(): DailyStore {
  const st = { ...EMPTY, ...load<Partial<DailyStore>>('daily', {}) };
  // 2.0 kept only the points of official dailies in the records
  const legacy = loadRecords().daily ?? {};
  for (const [day, pts] of Object.entries(legacy)) if (!st.entries[day] && typeof pts === 'number') st.entries[day] = { day, pts, at: Date.parse(`${day}T12:00:00Z`) };
  return st;
}
export const saveDaily = (s: DailyStore) => save('daily', s);

export type DailyStatus = 'open' | 'inProgress' | 'done' | 'abandoned';
export function dailyStatus(day: string, st = loadDaily()): DailyStatus {
  if (st.entries[day]) return 'done';
  if (st.abandoned[day]) return 'abandoned';
  if (st.started[day]) return 'inProgress';
  return 'open';
}
/** The next attempt of `day` is official only if no official one was finished or given up. */
export const officialAvailable = (day: string, st = loadDaily()) => !st.entries[day] && !st.abandoned[day];

export function markStarted(day: string) {
  const st = loadDaily();
  if (!st.started[day]) { st.started[day] = Date.now(); saveDaily(st); }
}
export function markAbandoned(day: string) {
  const st = loadDaily();
  if (!st.entries[day]) { st.abandoned[day] = Date.now(); saveDaily(st); }
}
export function recordOfficial(e: DailyEntry) {
  const st = loadDaily();
  if (st.entries[e.day]?.token) return; // one official result per day, the first one stands (a 2.0 entry has no link yet)
  st.entries[e.day] = e;
  st.bestStreak = Math.max(st.bestStreak, streakOf(st, e.day).current);
  saveDaily(st);
}
export function recordPractice(day: string, pts: number) {
  const st = loadDaily();
  const p = st.practice[day] ?? { n: 0, best: 0 };
  st.practice[day] = { n: p.n + 1, best: Math.max(p.best, pts) };
  saveDaily(st);
}

const prevDay = (day: string) => utcDay(new Date(Date.parse(`${day}T00:00:00Z`) - 86400000));
/**
 * Consecutive days with an official Daily. Today not played yet does not break it: the run still counts up to
 * yesterday. A missed day simply starts a new run; the best run is kept.
 */
export function streakOf(st: DailyStore, today: string): { current: number; best: number; alive: boolean } {
  let day = st.entries[today] ? today : prevDay(today);
  let current = 0;
  while (st.entries[day]) { current++; day = prevDay(day); }
  return { current, best: Math.max(st.bestStreak, current), alive: !!st.entries[today] || current > 0 };
}

export interface DailyView { challenge: FeaturedChallenge; day: string; status: DailyStatus; entry?: DailyEntry; streak: { current: number; best: number }; practice?: { n: number; best: number }; played: number; bestPts: number }
export function dailyView(now = new Date(), st = loadDaily()): DailyView {
  const challenge = dailyChallenge(now);
  const day = challenge.startDate;
  const all = Object.values(st.entries);
  return {
    challenge, day, status: dailyStatus(day, st), entry: st.entries[day], streak: streakOf(st, day), practice: st.practice[day],
    played: all.length, bestPts: all.reduce((a, e) => Math.max(a, e.pts), 0),
  };
}
