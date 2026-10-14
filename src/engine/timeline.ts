/**
 * The season as a story, round by round. Everything here is read from the results the season model
 * actually produced (scores, tries, bonus points, the league table after each round): no invented match events.
 */
import { MAX_PER_GAME, SEASON_GAMES } from './rugby';
import { YOU, type Fixture, type PlayoffTie, type Row, type Season } from './season';

export type StoryKind =
  | 'exploit' | 'statement' | 'tries' | 'streak' | 'losingRun' | 'firstDefeat'
  | 'intoTop6' | 'outOfTop6' | 'leader' | 'clinched' | 'clinchedTop2' | 'eliminated' | 'decider';
export interface StoryEvent { kind: StoryKind; n?: number; opp?: string; rank?: number }

export interface RoundFrame {
  round: number;
  fixture: Fixture;
  rank: number;
  prevRank: number;
  pts: number; w: number; d: number; l: number;
  /** before the kick-off of this round (last-round decider) */
  pre: StoryEvent[];
  events: StoryEvent[];
  featured: boolean;
  qualified: 'in' | 'out' | 'open';
}

export type PathStep =
  | { kind: 'bye'; stage: 'qf' }
  | { kind: 'tie'; tie: PlayoffTie; won: boolean; oppId: string; pf: number; pa: number };

export interface SeasonStory {
  frames: RoundFrame[];
  /** your road through the knockouts (empty when you missed the top six) */
  path: PathStep[];
  /** who lifted the ERA Shield */
  final: PlayoffTie | undefined;
}

const rankOf = (table: Row[], id = YOU) => table.findIndex((r) => r.id === id) + 1;

/** Can no longer finish outside the top `k`: at most k-1 other teams can still reach your current total. */
export function guaranteedTop(table: Row[], remaining: number, k: number): boolean {
  const me = table.find((r) => r.id === YOU)!;
  const chasers = table.filter((r) => r.id !== YOU && r.pts + MAX_PER_GAME * remaining >= me.pts).length;
  return chasers <= k - 1;
}
/** Out of the top `k` whatever happens: k teams already have more than your maximum. */
export function outOfTop(table: Row[], remaining: number, k: number): boolean {
  const me = table.find((r) => r.id === YOU)!;
  const ahead = table.filter((r) => r.id !== YOU && r.pts > me.pts + MAX_PER_GAME * remaining).length;
  return ahead >= k;
}

export function seasonStory(season: Season, giants?: ReadonlySet<string>): SeasonStory {
  const frames: RoundFrame[] = [];
  let pts = 0, w = 0, d = 0, l = 0, streak = 0, losing = 0, unbeatenStart = 0;
  let clinched = false, clinched2 = false, eliminated = false, everLeader = false;
  let prevRank = 0;
  season.fixtures.forEach((f, i) => {
    const table = season.standings[i];
    const before = i > 0 ? season.standings[i - 1] : undefined;
    const rank = rankOf(table);
    const remaining = SEASON_GAMES - f.round;
    pts += f.pts;
    if (f.result === 'W') w++; else if (f.result === 'D') d++; else l++;
    const events: StoryEvent[] = [];
    const pre: StoryEvent[] = [];

    // last round still open: the table after round 25 decides
    if (f.round === SEASON_GAMES && before && !clinched && !eliminated) pre.push({ kind: 'decider' });

    // results
    const oppRankBefore = before ? rankOf(before, f.opp) : 99;
    if (f.result === 'W' && !f.home && (f.giant || giants?.has(f.opp) || oppRankBefore <= 3)) events.push({ kind: 'exploit', opp: f.opp });
    else if (f.result === 'W' && f.home && f.giant && f.pf - f.pa >= 15) events.push({ kind: 'statement', opp: f.opp });
    if (f.tf >= 6) events.push({ kind: 'tries', n: f.tf, opp: f.opp });
    streak = f.result === 'W' ? streak + 1 : 0;
    if ([5, 8, 12, 16, 20, 26].includes(streak)) events.push({ kind: 'streak', n: streak });
    losing = f.result === 'L' ? losing + 1 : 0;
    if (losing === 3 || losing === 5) events.push({ kind: 'losingRun', n: losing });
    if (f.result === 'L' && unbeatenStart >= 5 && unbeatenStart === i) events.push({ kind: 'firstDefeat', n: unbeatenStart });
    if (f.result !== 'L' && unbeatenStart === i) unbeatenStart++;

    // table
    if (f.round >= 3) {
      if (rank === 1 && (prevRank !== 1 || !everLeader)) { events.push({ kind: 'leader' }); everLeader = true; }
      else if (rank <= 6 && prevRank > 6) events.push({ kind: 'intoTop6', rank });
      else if (rank > 6 && prevRank <= 6 && prevRank > 0) events.push({ kind: 'outOfTop6', rank });
    }
    if (!clinched && guaranteedTop(table, remaining, 6)) { clinched = true; events.push({ kind: 'clinched' }); }
    if (!clinched2 && guaranteedTop(table, remaining, 2)) { clinched2 = true; events.push({ kind: 'clinchedTop2' }); }
    if (!eliminated && !clinched && outOfTop(table, remaining, 6)) { eliminated = true; events.push({ kind: 'eliminated' }); }

    frames.push({
      round: f.round, fixture: f, rank, prevRank: prevRank || rank, pts, w, d, l, pre, events,
      featured: pre.length > 0 || events.length > 0,
      qualified: clinched ? 'in' : eliminated ? 'out' : 'open',
    });
    prevRank = rank;
  });

  const path: PathStep[] = [];
  if (season.position <= 6) {
    if (season.position <= 2) path.push({ kind: 'bye', stage: 'qf' });
    for (const tie of season.playoffs) {
      if (tie.home !== YOU && tie.away !== YOU) continue;
      const home = tie.home === YOU;
      path.push({ kind: 'tie', tie, won: tie.winner === YOU, oppId: home ? tie.away : tie.home, pf: home ? tie.hs : tie.as, pa: home ? tie.as : tie.hs });
    }
  }
  return { frames, path, final: season.playoffs.find((t) => t.stage === 'final') };
}

/** Where the regular season left you, in rugby words. */
export type Standing = 'champion' | 'finalist' | 'semi' | 'quarter' | 'playoffs' | 'doorstep' | 'midtable' | 'bottom';
export function standingOf(season: Season): Standing {
  switch (season.finish) {
    case 'champion': return 'champion';
    case 'final': return 'finalist';
    case 'semi': return 'semi';
    case 'quarter': return 'quarter';
    default: break;
  }
  if (season.position <= 6) return 'playoffs';
  if (season.position === 7) return 'doorstep';
  if (season.position <= 10) return 'midtable';
  return 'bottom';
}
