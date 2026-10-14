/**
 * Leaderboards behind one interface, with the provenance of every row kept visible:
 *
 *   local     — my own results on this device
 *   friends   — results carried by challenge links, each recomputed from its link before it is shown
 *   server    — results a server accepted after recomputing them (engine/official.ts). NO server exists yet:
 *               `serverBoard` is null and nothing in the UI pretends otherwise.
 *
 * Plugging a backend = implementing LeaderboardService against the contract in docs/LAUNCH.md and assigning it to
 * `serverBoard`; screens already branch on `source`.
 */
import { dailyChallenge, drawOf, officialEntry, type DrawSpec, type OfficialEntry } from '../engine/index';
import { dailyBoard, loadChallenges } from './challenges';
import { loadDaily } from './daily';

export type BoardScope = 'daily' | 'weekly' | 'friends' | 'clubhouse';
export type BoardSource = 'local' | 'friends' | 'server';
export interface BoardRow { name: string; pts: number; pos?: number; me: boolean; source: BoardSource }

export interface LeaderboardService {
  readonly source: BoardSource;
  /** submit one official result (the link token); the service recomputes it, never trusts the points */
  submit(token: string, draw: DrawSpec): Promise<{ ok: true; entry: OfficialEntry } | { ok: false; error: string }>;
  /** rows for one draw (a Daily, a weekly challenge), best first */
  top(drawId: string, limit?: number): Promise<BoardRow[]>;
}

/** No backend in this build (artifact / standalone file). Assign an implementation here once one exists. */
export const serverBoard: LeaderboardService | null = null;

/** Today's Daily between friends, built from verified challenge links on this device. */
export function friendsDailyBoard(day = dailyChallenge(new Date()).startDate): BoardRow[] {
  const mine = loadDaily().entries[day];
  return dailyBoard(day, mine ? { pts: mine.pts, pos: mine.pos, token: mine.token } : undefined, loadChallenges())
    .map((r) => ({ ...r, source: r.me ? 'local' : 'friends' }));
}

/**
 * What a server must do with a submission, runnable here so the rule is tested: recompute from the link, pin the draw,
 * reject anything that does not replay. The server adds identity (one entry per player per draw) and storage.
 */
export function acceptSubmission(token: string, draw: DrawSpec): ReturnType<LeaderboardService['submit']> extends Promise<infer R> ? R : never {
  const r = officialEntry(token, drawOf(draw));
  return r.ok ? { ok: true, entry: r.entry } : { ok: false, error: r.error };
}
