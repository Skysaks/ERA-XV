/**
 * Readings of an XV for the match sheet, the game-plan screen and the staff debrief.
 * Every statement is derived from the team model (dimensions, thresholds, familiarity, league opponents);
 * nothing here changes a rating, a FIT or a season.
 */
import type { PlayerEra } from '../data/schema';
import { DIMS, type Dim, PLAN_DEF, PLANS, type PlanId, SLOT_DIM_W, type FamKind, SLOTS, type Pos } from './rugby';
import { teamProfile, type Lineup, type TeamProfile } from './team';
import { byKey, giantsOf, leagueFor, leagueSide } from './season';
import { GROUP_IDS, GROUP_SLOTS, groupDims, type GroupId } from './units';
import { isCaptain } from './traits';

/* ------------------------------------------------------ responsibilities */

export interface Responsibilities {
  captain: { player: PlayerEra; slot: number; historic: boolean } | null;
  kicker: { player: PlayerEra; slot: number; value: number } | null;
  lineout: { player: PlayerEra; slot: number; value: number } | null;
}
/** Assigned automatically to the best candidate; the kicker is the one the season model uses. */
export function responsibilities(prof: TeamProfile): Responsibilities {
  const slotOf = (p: PlayerEra) => prof.slots.find((s) => s.player.key === p.key)?.n ?? 0;
  const caps = prof.slots.filter((s) => isCaptain(s.player)).sort((a, b) => b.rating - a.rating);
  const best = prof.slots.slice().sort((a, b) => b.rating - a.rating || a.n - b.n)[0];
  const capt = caps[0] ?? best;
  const jumpers = prof.slots.filter((s) => [2, 4, 5, 6, 8].includes(s.n)).sort((a, b) => b.player.attrs.lineout - a.player.attrs.lineout || a.n - b.n);
  const lo = jumpers.find((s) => s.n !== 2) ?? jumpers[0];
  return {
    captain: capt ? { player: capt.player, slot: capt.n, historic: !!caps[0] } : null,
    kicker: prof.kicker ? { player: prof.kicker, slot: slotOf(prof.kicker), value: prof.boot } : null,
    lineout: lo ? { player: lo.player, slot: lo.n, value: lo.player.attrs.lineout } : null,
  };
}

/* -------------------------------------------------------------- plans */

/** The match-sheet group that carries most of a dimension (from the shirt weights of the team model). */
export function mainGroupOf(d: Dim): GroupId {
  let best: GroupId = 'front', bw = -1;
  for (const g of GROUP_IDS) {
    const w = GROUP_SLOTS[g].reduce((a, n) => a + SLOT_DIM_W[d][n], 0);
    if (w > bw) { bw = w; best = g; }
  }
  return best;
}

export type PlanVerdict =
  | { kind: 'natural'; groups: GroupId[] }
  | { kind: 'limited'; dim: Dim; value: number; thr: number }
  | { kind: 'workable' };
export interface PlanReport {
  plan: PlanId;
  fit: number;
  favoured: Dim[];
  reduced: Dim[];
  needs: { dim: Dim; thr: number; value: number; ok: boolean }[];
  weak?: { dim: Dim; value: number; thr: number };
  verdict: PlanVerdict;
}

export function planReport(lineup: Lineup, planId: PlanId): PlanReport {
  const plan = PLAN_DEF[planId];
  const prof = teamProfile(lineup, byKey, planId);
  const favoured = DIMS.filter((d) => plan.w[d] >= 1.2).sort((a, b) => plan.w[b] - plan.w[a]);
  const reduced = DIMS.filter((d) => plan.w[d] <= 0.9).sort((a, b) => plan.w[a] - plan.w[b]);
  const needs = DIMS.filter((d) => plan.thr[d] > 70).sort((a, b) => plan.thr[b] - plan.thr[a])
    .map((d) => ({ dim: d, thr: plan.thr[d], value: prof.dims[d], ok: prof.dims[d] >= plan.thr[d] }));
  const short = DIMS.filter((d) => prof.dims[d] < plan.thr[d]).sort((a, b) => (prof.dims[a] - plan.thr[a]) - (prof.dims[b] - plan.thr[b]));
  const weak = short[0] ? { dim: short[0], value: prof.dims[short[0]], thr: plan.thr[short[0]] } : undefined;
  let verdict: PlanVerdict = { kind: 'workable' };
  const keyDims = favoured.length ? favoured.slice(0, 2) : [];
  if (weak && (favoured.includes(weak.dim) || needs.some((n) => n.dim === weak.dim)) && weak.thr - weak.value >= 3) {
    verdict = { kind: 'limited', dim: weak.dim, value: weak.value, thr: weak.thr };
  } else if (prof.fit >= 90 && keyDims.every((d) => prof.dims[d] >= plan.thr[d])) {
    const groups: GroupId[] = [];
    for (const d of keyDims) {
      const g = mainGroupOf(d);
      const gv = groupDims(lineup, byKey, GROUP_SLOTS[g])[d];
      if (gv >= plan.thr[d] && !groups.includes(g)) groups.push(g);
    }
    if (groups.length || !favoured.length) verdict = { kind: 'natural', groups };
  }
  return { plan: planId, fit: prof.fit, favoured, reduced, needs, weak, verdict };
}

export const allPlanReports = (lineup: Lineup) => PLANS.map((p) => planReport(lineup, p));

/* ------------------------------------------------------- staff debrief */

export type AreaId = 'setpiece' | 'collision' | 'defence' | 'attack' | 'territory' | 'pace';
export const AREAS: Record<AreaId, Dim[]> = {
  setpiece: ['scrum', 'lineout'],
  collision: ['carry', 'breakdown'],
  defence: ['defence'],
  attack: ['playmaking', 'strike'],
  territory: ['kicking', 'aerial'],
  pace: ['pace'],
};
export const AREA_IDS = Object.keys(AREAS) as AreaId[];
export interface AreaReading { area: AreaId; value: number; league: number; delta: number; dims: { dim: Dim; value: number }[] }
export interface StaffPoints { strengths: AreaReading[]; weakness: AreaReading & { relative: boolean }; all: AreaReading[] }

/** Your areas against the average of this season's thirteen ERA League opponents. */
export function staffPoints(prof: TeamProfile, seed: number): StaffPoints {
  const league = leagueFor(seed);
  const giants = giantsOf(league);
  const sides = league.map((t) => leagueSide(t, giants.has(t.id)));
  const avg = (d: Dim) => sides.reduce((a, s) => a + s.dims[d], 0) / sides.length;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const all: AreaReading[] = AREA_IDS.map((area) => {
    const ds = AREAS[area];
    const value = Math.round(mean(ds.map((d) => prof.dims[d])));
    const league = Math.round(mean(ds.map(avg)));
    return { area, value, league, delta: value - league, dims: ds.map((d) => ({ dim: d, value: prof.dims[d] })) };
  });
  const sorted = all.slice().sort((a, b) => b.delta - a.delta);
  const strengths = sorted.filter((a) => a.delta >= 2).slice(0, 2);
  const low = sorted[sorted.length - 1];
  return { strengths, weakness: { ...low, relative: low.delta >= 0 }, all };
}

/* ------------------------------------------------- composition diagnosis */

export interface Misfit { slot: number; player: PlayerEra; from: Pos; to: Pos; kind: FamKind; problem: boolean; impact: 'high' | 'medium' | 'low' }
const PEN: Record<FamKind, number> = { natural: 0, secondary: 1, close: 3, cover: 5, stretch: 8, unfamiliar: 14, outOfPosition: 22, frontRow: 30 };
/** Everyone not in his natural position: real problems apart from normal versatility. */
export function compositionDiagnosis(prof: TeamProfile): { fit: number; misfits: Misfit[]; problems: number } {
  const misfits = prof.slots.filter((s) => s.kind !== 'natural').map((s) => {
    const pen = PEN[s.kind];
    return {
      slot: s.n, player: s.player, from: s.player.pos[0], to: SLOTS[s.n - 1].pos, kind: s.kind,
      problem: s.kind === 'outOfPosition' || s.kind === 'frontRow' || s.kind === 'unfamiliar',
      impact: (pen >= 14 ? 'high' : pen >= 5 ? 'medium' : 'low') as Misfit['impact'],
    };
  }).sort((a, b) => PEN[b.kind] - PEN[a.kind] || a.slot - b.slot);
  return { fit: prof.fit, misfits, problems: misfits.filter((m) => m.problem).length };
}
