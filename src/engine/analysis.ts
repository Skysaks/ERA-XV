import { PLAYER_BY_KEY, type PlayerEra } from '../data/index';
import { DIMS, type Dim, PLANS, PLAN_DEF, type PlanId, type RulesetId, SLOTS } from './rugby';
import { place, teamProfile, type Lineup, type TeamProfile } from './team';
import { byKey, expectedPoints, sideFromProfile, type Expected, type Season } from './season';
import type { DraftState, Offer } from './draft';
import type { Side } from './match';

const P = (k: string) => PLAYER_BY_KEY.get(k)!;

export interface Eval { prof: TeamProfile; side: Side; exp: Expected }
export function evaluate(lineup: Lineup, plan: PlanId, seed: number, ruleset: RulesetId, n = 40): Eval {
  const prof = teamProfile(lineup, byKey, plan);
  const side = sideFromProfile('you', 'ERA XV', prof);
  return { prof, side, exp: expectedPoints(side, seed, ruleset, n) };
}

/** Each game plan for these fifteen, ranked by expected points on this season's fixtures. */
export function planOptions(lineup: Lineup, seed: number, ruleset: RulesetId, n = 30): { plan: PlanId; fit: number; exp: number }[] {
  return PLANS.map((plan) => {
    const e = evaluate(lineup, plan, seed, ruleset, n);
    return { plan, fit: e.prof.fit, exp: e.exp.mean };
  }).sort((a, b) => b.exp - a.exp || b.fit - a.fit);
}

export interface Optimisation { lineup: Lineup; plan: PlanId; moves: number; fitFrom: number; fitTo: number; expFrom: number; expTo: number; changed: boolean }
export function optimise(lineup: Lineup, plan: PlanId, seed: number, ruleset: RulesetId): Optimisation {
  const players = SLOTS.map((s) => lineup[s.n]).filter(Boolean).map((k) => P(k!));
  const best = place(players);
  const before = evaluate(lineup, plan, seed, ruleset, 30);
  let bestPlan = plan, bestEval = evaluate(best, plan, seed, ruleset, 30);
  for (const p of PLANS) {
    if (p === plan) continue;
    const e = evaluate(best, p, seed, ruleset, 30);
    if (e.exp.mean > bestEval.exp.mean + 0.5) { bestEval = e; bestPlan = p; }
  }
  let moves = 0;
  for (const s of SLOTS) if (best[s.n] !== lineup[s.n]) moves++;
  const changed = (moves > 0 || bestPlan !== plan) && bestEval.exp.mean > before.exp.mean + 0.3;
  return { lineup: changed ? best : lineup, plan: changed ? bestPlan : plan, moves: changed ? moves : 0, fitFrom: before.prof.fit, fitTo: changed ? bestEval.prof.fit : before.prof.fit, expFrom: before.exp.mean, expTo: changed ? bestEval.exp.mean : before.exp.mean, changed };
}

/* ------------------------------------------------------ turning points */

export interface TurningPoint { round: number; picked: PlayerEra; alt: PlayerEra; delta: number; estPts: number; actualEst: number }
/** Same XV with one pick changed (arranged at its best), same fixtures. Estimates, not certainty. */
export function turningPoints(state: DraftState, lineup: Lineup, plan: PlanId, n = 24): TurningPoint[] {
  const seed = state.cfg.seed, rs = state.cfg.ruleset;
  const base = evaluate(lineup, plan, seed, rs, n).exp.mean;
  const out: TurningPoint[] = [];
  state.history.forEach((offer: Offer, r) => {
    const pickedKey = state.picks[r];
    let best: TurningPoint | null = null;
    for (const alt of offer.options) {
      if (alt === pickedKey) continue;
      const altP = P(alt);
      if (state.picks.some((k) => P(k).person === altP.person)) continue;
      const players = state.picks.map((k, i) => (i === r ? altP : P(k)));
      const l = place(players);
      const e = evaluate(l, plan, seed, rs, n).exp.mean;
      const d = Math.round((e - base) * 10) / 10;
      if (!best || d > best.delta) best = { round: r + 1, picked: P(pickedKey), alt: altP, delta: d, estPts: e, actualEst: base };
    }
    if (best && best.delta >= 1) out.push(best);
  });
  return out.sort((a, b) => b.delta - a.delta).slice(0, 3);
}

/* -------------------------------------------------------- draft summary */

export type Level = 'high' | 'medium' | 'low';
export type Grade = 'excellent' | 'strong' | 'fair' | 'weak';
export interface DraftSummary { star: Level; balance: Grade; discipline: Grade; risk: Level; sacrifices: number; costlyStars: number; allStars: boolean; rounds: number }
export function draftSummary(state: DraftState, prof: TeamProfile): DraftSummary {
  let tookTop = 0, sacrifices = 0, costlyStars = 0;
  const rounds = state.history.length;
  state.history.forEach((offer, r) => {
    const opts = offer.options.map(P);
    const top = Math.max(...opts.map((o) => o.rating));
    const picked = P(state.picks[r]);
    if (picked.rating === top) {
      tookTop++;
      const inPos = prof.slots.find((s) => s.player.key === picked.key);
      if (inPos && inPos.kind !== 'natural' && inPos.kind !== 'secondary') costlyStars++;
    } else sacrifices++;
  });
  const starShare = rounds ? tookTop / rounds : 0;
  const star: Level = starShare >= 0.75 ? 'high' : starShare >= 0.45 ? 'medium' : 'low';
  const balance: Grade = prof.fit >= 95 ? 'excellent' : prof.fit >= 85 ? 'strong' : prof.fit >= 70 ? 'fair' : 'weak';
  const oop = prof.oop.length;
  const discipline: Grade = oop === 0 ? 'excellent' : oop === 1 ? 'strong' : oop <= 3 ? 'fair' : 'weak';
  const risk: Level = costlyStars >= 3 || state.rerollRound >= 10 ? 'high' : costlyStars >= 1 ? 'medium' : 'low';
  return { star, balance, discipline, risk, sacrifices, costlyStars, allStars: tookTop === rounds && rounds > 0, rounds };
}

/* -------------------------------------------------------------- why */

export interface Why { strengths: { dim: Dim; level: 'elite' | 'strong' }[]; weakness?: { dim: Dim; level: 'main' | 'limited' }; fitWeak: boolean; oop: number }
export function whyScore(prof: TeamProfile): Why {
  const plan = PLAN_DEF[prof.plan];
  const ranked = DIMS.slice().sort((a, b) => (prof.dims[b] - plan.thr[b]) - (prof.dims[a] - plan.thr[a]));
  const strengths = ranked.filter((d) => prof.dims[d] >= 88).slice(0, 2).map((d) => ({ dim: d, level: prof.dims[d] >= 91 ? 'elite' as const : 'strong' as const }));
  const worst = ranked[ranked.length - 1];
  const gap = prof.dims[worst] - plan.thr[worst];
  const weakness = gap < 0 ? { dim: worst, level: 'main' as const } : gap < 6 ? { dim: worst, level: 'limited' as const } : undefined;
  return { strengths, weakness, fitWeak: prof.fit < 70, oop: prof.oop.length };
}
export function strongestWeakest(prof: TeamProfile): { strongest: Dim[]; weakest: Dim[] } {
  const plan = PLAN_DEF[prof.plan];
  const ranked = DIMS.slice().sort((a, b) => (prof.dims[b] - plan.thr[b]) - (prof.dims[a] - plan.thr[a]));
  return { strongest: ranked.slice(0, 3).filter((d) => prof.dims[d] >= 85), weakest: ranked.slice(-3).reverse().filter((d) => prof.dims[d] < plan.thr[d] + 4) };
}

/* -------------------------------------------------------- challenges */

export interface CompareSide { name: string; picks: string[]; history: Offer[]; lineup: Lineup; plan: PlanId; season: Season }
export interface PickDiff { round: number; yours: PlayerEra; theirs: PlayerEra; sameOffer: boolean; pts: number; axes: Dim[] }
/** Where two drafts on the same seed split, and what each split was worth to YOUR season (estimate). */
export function compareDrafts(me: CompareSide, them: CompareSide, seed: number, ruleset: RulesetId): { diffs: PickDiff[]; decisive?: PickDiff } {
  const diffs: PickDiff[] = [];
  const base = evaluate(me.lineup, me.plan, seed, ruleset, 24);
  for (let r = 0; r < Math.min(me.picks.length, them.picks.length); r++) {
    if (me.picks[r] === them.picks[r]) continue;
    const yours = P(me.picks[r]), theirs = P(them.picks[r]);
    const sameOffer = me.history[r]?.team === them.history[r]?.team;
    let pts = 0;
    let axes: Dim[] = [];
    if (!me.picks.some((k) => P(k).person === theirs.person)) {
      const players = me.picks.map((k, i) => (i === r ? theirs : P(k)));
      const alt = evaluate(place(players), me.plan, seed, ruleset, 24);
      pts = Math.round(base.exp.mean - alt.exp.mean);
      axes = DIMS.filter((d) => Math.abs(base.prof.dims[d] - alt.prof.dims[d]) >= 1)
        .sort((a, b) => Math.abs(base.prof.dims[b] - alt.prof.dims[b]) - Math.abs(base.prof.dims[a] - alt.prof.dims[a])).slice(0, 2);
    }
    diffs.push({ round: r + 1, yours, theirs, sameOffer, pts, axes });
  }
  const decisive = diffs.slice().sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts))[0];
  return { diffs, decisive: decisive && Math.abs(decisive.pts) >= 1 ? decisive : undefined };
}
