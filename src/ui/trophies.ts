/**
 * Trophy cabinet: a short list, each one earned by a real performance recorded on this device.
 * Per-game trophies are decided from the season just played; the others from the history (challenges won,
 * distinct players drafted, Daily run).
 */
import type { GauntletRun, PlanId, Season, TeamProfile } from '../engine/index';
import { MAX_POINTS } from '../engine/index';
import { challengeCounts } from './challenges';
import { loadDaily, streakOf } from './daily';
import { loadPassport, loadRecords, saveRecords } from './store';
import { utcDay } from '../engine/index';

export const TROPHIES = ['shield', 'invincible', 'centurion', 'perfection', 'packmaster', 'champagne', 'outsider', 'clubhouse', 'explorer', 'regular', 'purist', 'legendhunter'] as const;
export type TrophyId = (typeof TROPHIES)[number];

export const PACK_MASTER = 90;
export const OUTSIDER_FIT = 70;
export const CLUBHOUSE_WINS = 10;
export const EXPLORER_PLAYERS = 150;
export const REGULAR_DAYS = 7;

export function gameTrophies(g: { season?: Season; gauntlet?: GauntletRun; prof: TeamProfile; plan: PlanId; hidden: boolean; points: number }): TrophyId[] {
  const out: TrophyId[] = [];
  const s = g.season;
  if (s) {
    if (s.finish === 'champion') out.push('shield');
    if (s.l === 0) out.push('invincible');
    if (g.points >= 100) out.push('centurion');
    if (g.points === MAX_POINTS) out.push('perfection');
    if (s.finish === 'champion' && g.plan === 'flair') out.push('champagne');
    if (s.position <= 6 && g.prof.fit < OUTSIDER_FIT) out.push('outsider');
    if (g.hidden && g.points >= 100) out.push('purist');
  }
  if (g.prof.pack >= PACK_MASTER) out.push('packmaster');
  if (g.gauntlet && g.gauntlet.beaten === g.gauntlet.max) out.push('legendhunter');
  return out;
}

export function historyTrophies(now = new Date()): TrophyId[] {
  const out: TrophyId[] = [];
  const rec = loadRecords();
  if (challengeCounts().won + rec.duels.w >= CLUBHOUSE_WINS) out.push('clubhouse');
  const pp = loadPassport();
  const drafted = Object.values(pp.players).filter((v) => v[1] > 0).length;
  if (drafted >= EXPLORER_PLAYERS) out.push('explorer');
  const st = loadDaily();
  if (Math.max(st.bestStreak, streakOf(st, utcDay(now)).current) >= REGULAR_DAYS) out.push('regular');
  return out;
}

/** Stores the new ones, returns them (for the result screen and the analytics). */
export function unlock(ids: TrophyId[]): TrophyId[] {
  const rec = loadRecords();
  const fresh = ids.filter((id, i) => ids.indexOf(id) === i && !rec.achievements.includes(id));
  if (fresh.length) { rec.achievements.push(...fresh); saveRecords(rec); }
  return fresh;
}

export function progressOf(id: TrophyId): { v: number; max: number } | null {
  if (id === 'clubhouse') return { v: challengeCounts().won + loadRecords().duels.w, max: CLUBHOUSE_WINS };
  if (id === 'explorer') return { v: Object.values(loadPassport().players).filter((v) => v[1] > 0).length, max: EXPLORER_PLAYERS };
  if (id === 'regular') { const st = loadDaily(); return { v: Math.max(st.bestStreak, streakOf(st, utcDay(new Date())).current), max: REGULAR_DAYS }; }
  return null;
}
