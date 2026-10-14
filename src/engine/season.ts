import { TEAMS, TEAM_BY_ID, PLAYER_BY_KEY, type TeamEra } from '../data/index';
import { LEAGUE_SIZE, MAX_POINTS, RULESETS, type RulesetId, type PlanId } from './rugby';
import { Rng } from './rng';
import { simMatch, type MatchResult, type Side } from './match';
import { bestXV, teamProfile, type Lineup, type TeamProfile } from './team';

export const byKey = (k: string) => PLAYER_BY_KEY.get(k);

export function sideFromProfile(id: string, name: string, prof: TeamProfile): Side {
  const ten = prof.slots.find((s) => s.n === 10);
  return { id, name, dims: prof.dims, boot: prof.boot, kick10: ten ? ten.player.attrs.kicking : 60, fit: prof.fit, ovr: prof.ovr, plan: prof.plan };
}

/* ------------------------------------------------ team-eras as opponents */

const SIDE_CACHE = new Map<string, { side: Side; lineup: Lineup; prof: TeamProfile }>();
export function teamSide(t: TeamEra) {
  const hit = SIDE_CACHE.get(t.id);
  if (hit) return hit;
  const lineup = bestXV(t.players);
  const plan: PlanId = t.plan ?? 'balanced';
  const prof = teamProfile(lineup, byKey, plan);
  const v = { side: sideFromProfile(t.id, `${t.name} ${t.era}`, prof), lineup, prof };
  SIDE_CACHE.set(t.id, v);
  return v;
}

/** Opponent strength ranking (cached). */
let RANKED: TeamEra[] | null = null;
export function rankedTeams(): TeamEra[] {
  if (!RANKED) RANKED = TEAMS.slice().sort((a, b) => teamSide(b).side.ovr - teamSide(a).side.ovr || a.id.localeCompare(b.id));
  return RANKED;
}

/** League mix: giants from the top of the ranking, contenders, then the rest. */
export const LEAGUE_MIX = { giants: 2, giantTop: 10, contenders: 4, contTop: 40, others: 7 };
/**
 * ERA League sides field a normal match-day XV, not their all-time best: every dimension is lowered by
 * `gap` points (giants a little less). Legends in the Gauntlet always play at full strength.
 */
export const LEAGUE_LEVEL = { gap: 2.5, giantGap: 0.5 };
const LEAGUE_CACHE = new Map<string, Side>();
export function leagueSide(t: TeamEra, giant: boolean): Side {
  const k = `${t.id}:${giant ? 1 : 0}:${LEAGUE_LEVEL.gap}:${LEAGUE_LEVEL.giantGap}`;
  const hit = LEAGUE_CACHE.get(k);
  if (hit) return hit;
  const base = teamSide(t).side;
  const g = giant ? LEAGUE_LEVEL.giantGap : LEAGUE_LEVEL.gap;
  const dims = Object.fromEntries(Object.entries(base.dims).map(([d, v]) => [d, v - g])) as Side['dims'];
  const v: Side = { ...base, dims };
  LEAGUE_CACHE.set(k, v);
  return v;
}
/** 13 opponents per seed. Same seed → same league. */
export function leagueFor(seed: number): TeamEra[] {
  const r = rankedTeams();
  const rng = new Rng(`league:${seed}`);
  const M = LEAGUE_MIX;
  const giants = rng.shuffle(r.slice(0, M.giantTop)).slice(0, M.giants);
  const mid = rng.shuffle(r.slice(M.giantTop, M.contTop)).slice(0, M.contenders);
  const low = rng.shuffle(r.slice(M.contTop)).slice(0, M.others);
  // one team per team key where possible (no two New Zealands in the same league)
  const picked: TeamEra[] = [];
  const seen = new Set<string>();
  for (const t of [...giants, ...mid, ...low]) {
    if (seen.has(t.team)) continue;
    seen.add(t.team); picked.push(t);
  }
  for (const t of rng.shuffle(r)) { if (picked.length >= LEAGUE_SIZE - 1) break; if (!seen.has(t.team)) { seen.add(t.team); picked.push(t); } }
  return picked.slice(0, LEAGUE_SIZE - 1);
}
export const giantsOf = (league: TeamEra[]) => new Set(league.slice().sort((a, b) => teamSide(b).side.ovr - teamSide(a).side.ovr).slice(0, LEAGUE_MIX.giants + 1).map((t) => t.id));

/* ------------------------------------------------------------ schedule */

/** Double round robin (circle method). Index 0 = you. Returns 26 rounds of [home, away] pairs. */
export function schedule(n: number, seed: number): [number, number][][] {
  const teams = Array.from({ length: n }, (_, i) => i);
  const rng = new Rng(`sched:${seed}`);
  const order = [0, ...rng.shuffle(teams.slice(1))];
  const rounds: [number, number][][] = [];
  const arr = order.slice();
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()!);
  }
  const second = rounds.map((ps) => ps.map(([a, b]) => [b, a] as [number, number]));
  return [...rounds, ...second];
}

/* -------------------------------------------------------------- season */

export interface Fixture {
  round: number; opp: string; oppName: string; home: boolean; giant: boolean;
  pf: number; pa: number; tf: number; ta: number; result: 'W' | 'D' | 'L'; pts: number; tb: boolean; lb: boolean;
  raw: MatchResult;
}
export interface Row { id: string; name: string; p: number; w: number; d: number; l: number; pf: number; pa: number; tf: number; ta: number; tb: number; lb: number; pts: number }
export interface PlayoffTie { stage: 'qf' | 'sf' | 'final'; home: string; away: string; hs: number; as: number; et?: boolean; kc?: [number, number]; winner: string }
export type Finish = 'champion' | 'final' | 'semi' | 'quarter' | 'missed';
export interface SeasonEvent { round: number; kind: 'first_defeat' | 'statement_win' | 'five_tries' | 'winning_streak' | 'unbeaten_run' | 'invincible' | 'bp_machine'; opp?: string; score?: string; n?: number }
export interface Season {
  seed: number; ruleset: RulesetId;
  fixtures: Fixture[];
  points: number; w: number; d: number; l: number; pf: number; pa: number; tf: number; ta: number; tb: number; lb: number;
  table: Row[]; position: number;
  playoffs: PlayoffTie[]; finish: Finish;
  events: SeasonEvent[];
  max: number;
  /** league table after each round (index 0 = after round 1), for the round-by-round broadcast */
  standings: Row[][];
}

export const YOU = 'you';

export function simulateSeason(you: Side, seed: number, rulesetId: RulesetId = 'intl', luck = ''): Season {
  const rs = RULESETS[rulesetId];
  const league = leagueFor(seed);
  const giants = giantsOf(league);
  const sides: Side[] = [you, ...league.map((t) => leagueSide(t, giants.has(t.id)))];
  const ids = [YOU, ...league.map((t) => t.id)];
  const rounds = schedule(sides.length, seed);
  const rows: Row[] = ids.map((id, i) => ({ id, name: sides[i].name, p: 0, w: 0, d: 0, l: 0, pf: 0, pa: 0, tf: 0, ta: 0, tb: 0, lb: 0, pts: 0 }));
  const fixtures: Fixture[] = [];
  const standings: Row[][] = [];
  const book = (row: Row, pf: number, pa: number, tf: number, ta: number) => {
    const won = pf > pa, drew = pf === pa;
    row.p++; row.pf += pf; row.pa += pa; row.tf += tf; row.ta += ta;
    let pts = won ? rs.win : drew ? rs.draw : 0;
    const tb = rs.tryBonus(tf, ta, won);
    const lb = !won && !drew && rs.losingBonus(pa - pf);
    if (won) row.w++; else if (drew) row.d++; else row.l++;
    if (tb) { pts++; row.tb++; }
    if (lb) { pts++; row.lb++; }
    row.pts += pts;
    return { pts, tb, lb };
  };
  rounds.forEach((pairs, r) => {
    for (const [h, a] of pairs) {
      const key = `${seed}${luck}:m:${r}:${ids[h]}:${ids[a]}`;
      const res = simMatch(sides[h], sides[a], key);
      const bh = book(rows[h], res.home.pts, res.away.pts, res.home.tries, res.away.tries);
      const ba = book(rows[a], res.away.pts, res.home.pts, res.away.tries, res.home.tries);
      if (h === 0 || a === 0) {
        const home = h === 0;
        const me = home ? res.home : res.away, them = home ? res.away : res.home;
        const b = home ? bh : ba;
        const oppIdx = home ? a : h;
        fixtures.push({
          round: r + 1, opp: ids[oppIdx], oppName: sides[oppIdx].name, home, giant: giants.has(ids[oppIdx]),
          pf: me.pts, pa: them.pts, tf: me.tries, ta: them.tries,
          result: me.pts > them.pts ? 'W' : me.pts === them.pts ? 'D' : 'L', pts: b.pts, tb: b.tb, lb: b.lb, raw: res,
        });
      }
    }
    standings.push(rows.map((x) => ({ ...x })).sort(cmpRows));
  });
  const table = rows.slice().sort(cmpRows);
  const position = table.findIndex((r) => r.id === YOU) + 1;
  const me = rows[0];
  const { ties, finish } = playoffs(table, ids, sides, seed, luck);
  return {
    seed, ruleset: rulesetId, fixtures,
    points: me.pts, w: me.w, d: me.d, l: me.l, pf: me.pf, pa: me.pa, tf: me.tf, ta: me.ta, tb: me.tb, lb: me.lb,
    table, position, playoffs: ties, finish, events: seasonEvents(fixtures), max: MAX_POINTS, standings,
  };
}

export const cmpRows = (a: Row, b: Row) => b.pts - a.pts || b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa) || b.tf - a.tf || a.id.localeCompare(b.id);

function playoffs(table: Row[], ids: string[], sides: Side[], seed: number, luck: string): { ties: PlayoffTie[]; finish: Finish } {
  const sideOf = (id: string) => sides[ids.indexOf(id)];
  const seedIds = table.slice(0, 6).map((r) => r.id);
  const ties: PlayoffTie[] = [];
  const play = (stage: PlayoffTie['stage'], h: string, a: string, neutral: boolean) => {
    const res = simMatch(sideOf(h), sideOf(a), `${seed}${luck}:po:${stage}:${h}:${a}`, { neutral, knockout: true });
    const t: PlayoffTie = { stage, home: h, away: a, hs: res.home.pts, as: res.away.pts, et: res.et, kc: res.kc, winner: res.w === 1 ? h : a };
    ties.push(t);
    return t.winner;
  };
  const q1 = play('qf', seedIds[2], seedIds[5], false);
  const q2 = play('qf', seedIds[3], seedIds[4], false);
  // top seed meets the lowest-seeded quarter-final winner
  const rank = (id: string) => seedIds.indexOf(id);
  const [lowW, highW] = rank(q1) > rank(q2) ? [q1, q2] : [q2, q1];
  const s1 = play('sf', seedIds[0], lowW, true);
  const s2 = play('sf', seedIds[1], highW, true);
  play('final', s1, s2, true);
  const pos = table.findIndex((r) => r.id === YOU);
  let finish: Finish = 'missed';
  if (pos < 6) {
    const lostAt = ties.find((t) => (t.home === YOU || t.away === YOU) && t.winner !== YOU);
    const inFinal = ties.find((t) => t.stage === 'final' && (t.home === YOU || t.away === YOU));
    if (inFinal && inFinal.winner === YOU) finish = 'champion';
    else if (lostAt) finish = lostAt.stage === 'final' ? 'final' : lostAt.stage === 'sf' ? 'semi' : 'quarter';
  }
  return { ties, finish };
}

export function seasonEvents(fx: Fixture[]): SeasonEvent[] {
  const ev: SeasonEvent[] = [];
  let firstLossSeen = false, streak = 0, unbeaten = 0, bestUnbeaten = 0, tbCount = 0;
  let streakLogged = false;
  for (const f of fx) {
    const score = `${f.pf}–${f.pa}`;
    if (f.result === 'L' && !firstLossSeen) { firstLossSeen = true; ev.push({ round: f.round, kind: 'first_defeat', opp: f.opp, score, n: f.round - 1 }); }
    if (f.result === 'W' && f.giant && f.pf - f.pa >= 15) ev.push({ round: f.round, kind: 'statement_win', opp: f.opp, score });
    if (f.tf >= 6) ev.push({ round: f.round, kind: 'five_tries', opp: f.opp, score, n: f.tf });
    streak = f.result === 'W' ? streak + 1 : 0;
    if (streak === 8 && !streakLogged) { streakLogged = true; ev.push({ round: f.round, kind: 'winning_streak', n: 8 }); }
    unbeaten = f.result === 'L' ? 0 : unbeaten + 1;
    bestUnbeaten = Math.max(bestUnbeaten, unbeaten);
    if (unbeaten === 15) ev.push({ round: f.round, kind: 'unbeaten_run', n: 15 });
    if (f.tb) tbCount++;
    if (tbCount === 20 && f.tb) ev.push({ round: f.round, kind: 'bp_machine', n: 20 });
  }
  if (fx.length && fx.every((f) => f.result !== 'L')) ev.push({ round: fx.length, kind: 'invincible' });
  return ev;
}

/* ---------------------------------------------------- expected outcome */

export interface Expected { mean: number; p10: number; p90: number; samples: number[] }
/** Same XV, same fixtures, different luck. */
export function expectedPoints(you: Side, seed: number, ruleset: RulesetId, n = 120): Expected {
  const s: number[] = [];
  for (let i = 0; i < n; i++) s.push(quickPoints(you, seed, ruleset, `:x${i}`));
  s.sort((a, b) => a - b);
  return { mean: Math.round((s.reduce((a, b) => a + b, 0) / n) * 10) / 10, p10: s[Math.floor(n * 0.1)], p90: s[Math.floor(n * 0.9)], samples: s };
}

/** Only your 26 matches (fast path for estimates). */
export function quickPoints(you: Side, seed: number, rulesetId: RulesetId, luck = ''): number {
  const rs = RULESETS[rulesetId];
  const league = leagueFor(seed);
  const giants = giantsOf(league);
  const sides: Side[] = [you, ...league.map((t) => leagueSide(t, giants.has(t.id)))];
  const ids = [YOU, ...league.map((t) => t.id)];
  const rounds = schedule(sides.length, seed);
  let pts = 0;
  rounds.forEach((pairs, r) => {
    const pr = pairs.find(([h, a]) => h === 0 || a === 0)!;
    const [h, a] = pr;
    const res = simMatch(sides[h], sides[a], `${seed}${luck}:m:${r}:${ids[h]}:${ids[a]}`);
    const home = h === 0;
    const me = home ? res.home : res.away, them = home ? res.away : res.home;
    const won = me.pts > them.pts, drew = me.pts === them.pts;
    pts += won ? rs.win : drew ? rs.draw : 0;
    if (rs.tryBonus(me.tries, them.tries, won)) pts++;
    if (!won && !drew && rs.losingBonus(them.pts - me.pts)) pts++;
  });
  return pts;
}

/* ------------------------------------------------------------ gauntlet */

export const LEGEND_IDS = ['sam-1991', 'fra-1977', 'wal-1970s', 'lions-1971', 'aus-1991', 'nzl-1987', 'eng-2003', 'rsa-2019', 'toulouse-2024', 'nzl-2015'];
export function legends(): TeamEra[] {
  return LEGEND_IDS.map((id) => TEAM_BY_ID.get(id)!).filter(Boolean).sort((a, b) => teamSide(a).side.ovr - teamSide(b).side.ovr || a.id.localeCompare(b.id));
}
export interface GauntletRun { beaten: number; max: number; ties: { opp: string; oppName: string; pf: number; pa: number; tf: number; ta: number; et?: boolean; kc?: [number, number]; won: boolean }[] }
export function runGauntlet(you: Side, seed: number, luck = ''): GauntletRun {
  const ls = legends();
  const ties: GauntletRun['ties'] = [];
  let beaten = 0;
  for (let i = 0; i < ls.length; i++) {
    const t = ls[i];
    const res = simMatch(you, teamSide(t).side, `${seed}${luck}:g:${i}:${t.id}`, { neutral: true, knockout: true });
    const won = res.w === 1;
    ties.push({ opp: t.id, oppName: `${t.name} ${t.era}`, pf: res.home.pts, pa: res.away.pts, tf: res.home.tries, ta: res.away.tries, et: res.et, kc: res.kc, won });
    if (!won) break;
    beaten++;
  }
  return { beaten, max: ls.length, ties };
}
