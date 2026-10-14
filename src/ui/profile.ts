/**
 * Personal statistics and trends, derived only from what this device recorded (games, passport, Daily, challenges).
 * A trend is shown only when enough games back it.
 */
import { ALL_PLAYERS, PLAYER_BY_KEY, TEAMS, VERSIONS } from '../data/index';
import { utcDay, type PlanId, type Pos } from '../engine/index';
import { challengeCounts, type ChallengeRec } from './challenges';
import { streakOf, type DailyStore } from './daily';
import type { GameLog, Passport, Records } from './store';

export const TREND_MIN = 5;

const FAMILY: Record<string, Pos[]> = {
  props: ['LHP', 'THP'], hooker: ['HK'], locks: ['LK'], backrow: ['BF', 'OF', 'N8'], scrumhalf: ['SH'], flyhalf: ['FH'], centres: ['IC', 'OC'], back3: ['WG', 'FB'],
};
export type Family = keyof typeof FAMILY;
const familyOf = (pos: Pos): Family => (Object.keys(FAMILY) as Family[]).find((f) => FAMILY[f].includes(pos))!;

export interface ProfileStats {
  games: number; titles: number; playoffs: number; playoffKnown: number; bestPos?: number; bestPts: number; bestFit: number;
  dailies: number; bestDaily?: number; streak: { current: number; best: number };
  won: number; lost: number; drawn: number; duelsW: number; duelsL: number;
  favPlan?: { plan: PlanId; n: number };
  topPlayer?: { person: string; name: string; n: number };
  topNation?: { nat: string; share: number };
  earliest?: { family: Family; avg: number };
  distinctPlayers: number; distinctVersions: number; avgFit?: number;
  met: { players: number; versions: number; teams: number; nats: number; totalPlayers: number; totalVersions: number; totalTeams: number };
}

export function profileStats(logs: GameLog[], pp: Passport, rec: Records, daily: DailyStore, challenges: ChallengeRec[], now = new Date()): ProfileStats {
  const seasons = logs.filter((l) => l.gauntlet === undefined);
  const known = seasons.filter((l) => typeof l.pos === 'number' && l.pos > 0);
  const plans = new Map<PlanId, number>();
  seasons.forEach((l) => plans.set(l.plan, (plans.get(l.plan) ?? 0) + 1));
  const fav = [...plans.entries()].sort((a, b) => b[1] - a[1])[0];
  const drafted = Object.entries(pp.players).filter(([, v]) => v[1] > 0).sort((a, b) => b[1][1] - a[1][1]);
  const top = drafted[0];
  const nats = new Map<string, number>();
  let picks = 0;
  const firstRound = new Map<Family, number[]>();
  for (const l of seasons) {
    const seen = new Set<Family>();
    l.picks.forEach((k, r) => {
      const p = PLAYER_BY_KEY.get(k);
      if (!p) return;
      picks++;
      nats.set(p.nat, (nats.get(p.nat) ?? 0) + 1);
      const f = familyOf(p.pos[0]);
      if (!seen.has(f)) { seen.add(f); const a = firstRound.get(f) ?? []; a.push(r + 1); firstRound.set(f, a); }
    });
  }
  const topNat = [...nats.entries()].sort((a, b) => b[1] - a[1])[0];
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const earliest = [...firstRound.entries()].filter(([, xs]) => xs.length >= Math.min(TREND_MIN, seasons.length)).map(([f, xs]) => ({ family: f, avg: avg(xs) })).sort((a, b) => a.avg - b.avg)[0];
  const dailies = Object.values(daily.entries);
  const cc = challengeCounts(challenges);
  const recent = seasons.slice(-30);
  return {
    games: rec.games, titles: rec.titles, playoffs: known.filter((l) => (l.pos ?? 99) <= 6).length, playoffKnown: known.length,
    bestPos: known.length ? Math.min(...known.map((l) => l.pos!)) : undefined, bestPts: rec.best, bestFit: rec.bestRatings.fit,
    dailies: dailies.length, bestDaily: dailies.length ? Math.max(...dailies.map((d) => d.pts)) : undefined, streak: streakOf(daily, utcDay(now)),
    won: cc.won, lost: cc.lost, drawn: cc.drawn, duelsW: rec.duels.w, duelsL: rec.duels.l,
    favPlan: fav ? { plan: fav[0], n: fav[1] } : undefined,
    topPlayer: top && top[1][1] >= 2 ? { person: top[0], name: VERSIONS.get(top[0])?.[0]?.name ?? top[0], n: top[1][1] } : undefined,
    topNation: topNat && picks ? { nat: topNat[0], share: Math.round((topNat[1] / picks) * 100) } : undefined,
    earliest: earliest && seasons.length >= TREND_MIN ? earliest : undefined,
    distinctPlayers: drafted.length, distinctVersions: Object.values(pp.versions).filter((v) => v[1] > 0).length,
    avgFit: recent.length ? Math.round(avg(recent.map((l) => l.fit))) : undefined,
    met: {
      players: Object.keys(pp.players).length, versions: Object.keys(pp.versions).length, teams: pp.teams.length, nats: pp.nats.length,
      totalPlayers: VERSIONS.size, totalVersions: ALL_PLAYERS.length, totalTeams: TEAMS.length,
    },
  };
}

export interface Trend { id: string; vars: Record<string, string | number> }
/** Sentences backed by the history. Each needs enough games; none is a guess. */
export function trends(logs: GameLog[], s: ProfileStats): Trend[] {
  const seasons = logs.filter((l) => l.gauntlet === undefined);
  const out: Trend[] = [];
  if (seasons.length < TREND_MIN) return out;
  const fhEarly = seasons.filter((l) => l.picks.slice(0, 4).some((k) => PLAYER_BY_KEY.get(k)?.pos[0] === 'FH')).length;
  out.push({ id: 'fhEarly', vars: { pct: Math.round((fhEarly / seasons.length) * 100) } });
  const best = seasons.slice().sort((a, b) => b.pts - a.pts)[0];
  out.push({ id: 'bestPlan', vars: { plan: best.plan, pts: best.pts } });
  if (s.topPlayer) out.push({ id: 'topPlayer', vars: { name: s.topPlayer.name, n: s.topPlayer.n } });
  if (s.playoffKnown >= TREND_MIN) out.push({ id: 'playoffRate', vars: { pct: Math.round((s.playoffs / s.playoffKnown) * 100) } });
  if (s.avgFit !== undefined) out.push({ id: 'avgFit', vars: { n: s.avgFit } });
  if (s.distinctPlayers) out.push({ id: 'distinct', vars: { n: s.distinctPlayers, v: s.distinctVersions } });
  if (s.topNation) out.push({ id: 'topNation', vars: { nat: s.topNation.nat, pct: s.topNation.share } });
  if (s.earliest) out.push({ id: 'earliest', vars: { family: s.earliest.family, r: Math.round(s.earliest.avg * 10) / 10 } });
  const recent = seasons.slice(-30);
  const star = Math.round((recent.reduce((a, l) => a + l.tookTop, 0) / (recent.length * 15)) * 100);
  out.push({ id: 'star', vars: { pct: star } });
  const oop = Math.round((recent.reduce((a, l) => a + l.oop, 0) / recent.length) * 10) / 10;
  out.push({ id: 'oop', vars: { n: oop } });
  return out;
}
