/**
 * Featured challenges: one generic shape for the Daily XV, the weekly theme and any future event.
 * A challenge is data (seed, pool, rules, dates), never a new screen or a copy of the engine.
 */
import type { ModeId } from './modes';
import { MODES, weeklyFor } from './modes';
import { dailySeed, hashStr, isoWeek } from './rng';
import type { RulesetId } from './rugby';
import { THEMES, type PoolFilter, type ThemeId } from './themes';

export type FeaturedKind = 'daily' | 'weekly' | 'event';
export interface FeaturedChallenge {
  /** stable id, e.g. "daily-2026-09-28", "weekly-2026-W39" */
  id: string;
  kind: FeaturedKind;
  /** dictionary keys (titles never live in data) */
  titleKey: string;
  descKey: string;
  seed: number;
  /** UTC calendar days, start inclusive, end exclusive (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  mode: ModeId;
  param?: string;
  ruleset: RulesetId;
  /** informative copy of the pool filter (the pool itself comes from mode + param) */
  filters: PoolFilter;
  rules: { rerolls: number; hideRatings: boolean };
  /** one official attempt; later attempts are practice */
  official: boolean;
  featured: boolean;
  /** needs a server-verified store: false until a backend exists (see docs/LAUNCH.md) */
  leaderboardEnabled: boolean;
}

export const utcDay = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const addDays = (day: string, n: number) => utcDay(new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000));
/** "ERA-XV-2026-09-28": the public name of a Daily draw */
export const dailyLabel = (d: Date) => `ERA-XV-${utcDay(d)}`;

export function dailyChallenge(date: Date, ruleset: RulesetId = 'intl'): FeaturedChallenge {
  const day = utcDay(date);
  return {
    id: `daily-${day}`, kind: 'daily', titleKey: 'daily.title', descKey: 'daily.pitch',
    seed: dailySeed(date), startDate: day, endDate: addDays(day, 1), mode: 'daily', ruleset,
    filters: {}, rules: { rerolls: MODES.daily.rerolls, hideRatings: false },
    official: true, featured: true, leaderboardEnabled: false,
  };
}

export function weeklySeed(date: Date): number {
  const { year, week } = isoWeek(date);
  return hashStr(`era-xv-weekly-${year}-W${week}`) >>> 0;
}
export function weeklyChallenge(date: Date, ruleset: RulesetId = 'intl'): FeaturedChallenge {
  const w = weeklyFor(date);
  const until = utcDay(w.until);
  const start = addDays(until, -6);
  return {
    id: `weekly-${w.year}-W${String(w.week).padStart(2, '0')}`, kind: 'weekly', titleKey: `weekly.${w.id}.name`, descKey: `weekly.${w.id}.desc`,
    seed: weeklySeed(date), startDate: start, endDate: addDays(until, 1), mode: 'weekly', param: w.id, ruleset,
    filters: { ...THEMES[w.id as ThemeId].filter }, rules: { rerolls: MODES.weekly.rerolls, hideRatings: false },
    official: false, featured: true, leaderboardEnabled: false,
  };
}

/** Curated one-off events. Empty on purpose: an event is added as data, with its own dates and theme. */
export const EVENTS: FeaturedChallenge[] = [];

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';
export function challengeStatus(c: FeaturedChallenge, now: Date): ChallengeStatus {
  const day = utcDay(now);
  if (day < c.startDate) return 'upcoming';
  if (day >= c.endDate) return 'ended';
  return 'active';
}

export function activeChallenges(now: Date, ruleset: RulesetId = 'intl'): FeaturedChallenge[] {
  return [dailyChallenge(now, ruleset), weeklyChallenge(now, ruleset), ...EVENTS.filter((e) => challengeStatus(e, now) === 'active')];
}

/** Which featured challenge a draw belongs to, if any (a Daily link from another day is recognised as such). */
export function dailyDayOfSeed(seed: number, around: Date, span = 60): string | undefined {
  for (let i = -1; i <= span; i++) {
    const d = new Date(around.getTime() - i * 86400000);
    if (dailySeed(d) === seed >>> 0) return utcDay(d);
  }
  return undefined;
}
