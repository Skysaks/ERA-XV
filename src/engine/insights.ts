/**
 * What each draft option would do to YOUR XV, in a few facts. It informs; it never ranks the options
 * or tells the player which one to take.
 */
import type { PlayerEra } from '../data/schema';
import { PLAYER_BY_KEY } from '../data/index';
import { DIMS, type Dim, famKind, isInPosition, PLAN_DEF, type PlanId, SLOTS, type FamKind } from './rugby';
import { place, SLOT_NEEDS, teamProfile, type Lineup, type SynergyId, type TeamProfile } from './team';
import { byKey } from './season';
import type { DraftState } from './draft';
import { MOMENT_SLOTS, type MomentId } from './units';

const P = (k: string) => PLAYER_BY_KEY.get(k)!;

export interface Note { tone: 'plus' | 'warn'; id: string; vars?: Record<string, string | number> }
export interface OptionInsight {
  key: string;
  slot: number;
  kind: FamKind | null;
  inPos: boolean;
  fitDelta: number;
  strengths: { dim: Dim; value: number }[];
  notes: Note[];
  up?: Dim;
  down?: Dim;
}

const FIXABLE: SynergyId[] = ['uncontested', 'noKicker', 'noJackal', 'noCaller', 'highBall', 'slowBack3', 'sameChannel'];
const COMPLETE_ORDER: MomentId[] = ['pack', 'halves', 'back3', 'centres', 'front', 'backrow'];

/** The two qualities a player brings to the shirt he would wear (attributes that shirt actually uses). */
export function keyStrengths(p: PlayerEra, slot: number): { dim: Dim; value: number }[] {
  const n = slot || SLOTS.find((s) => s.pos === p.pos[0])!.n;
  const need = SLOT_NEEDS[n];
  return DIMS.filter((d) => need[d] >= 0.06)
    .sort((a, b) => p.attrs[b] - p.attrs[a] || need[b] - need[a])
    .slice(0, 2)
    .map((d) => ({ dim: d, value: p.attrs[d] }));
}

export function lineupWith(state: DraftState, key: string): Lineup {
  const offer = state.offer;
  if (offer?.shirt) { const l = state.lineup.slice(); l[offer.shirt] = key; return l; }
  return place([...state.picks.map(P), P(key)], state.lineup);
}

export function optionInsights(state: DraftState, plan: PlanId, current?: TeamProfile): OptionInsight[] {
  const offer = state.offer;
  if (!offer) return [];
  const cur = current ?? teamProfile(state.lineup, byKey, plan);
  const thr = PLAN_DEF[plan].thr;
  const had = new Set(cur.synergies.map((s) => s.id));
  const views = offer.options.map((key) => {
    const p = P(key);
    const lineup = lineupWith(state, key);
    const slot = SLOTS.find((s) => lineup[s.n] === key)?.n ?? 0;
    const kind = slot ? famKind(p.pos, SLOTS[slot - 1].pos) : null;
    return { key, p, lineup, slot, kind, prof: teamProfile(lineup, byKey, plan) };
  });
  // a new problem every option would create is about the XV, not about one option: not shown on the cards
  const newBad = (v: (typeof views)[number]) => v.prof.synergies.filter((s) => s.delta < 0 && !had.has(s.id)).map((s) => s.id);
  const commonBad = new Set(views.length ? newBad(views[0]).filter((id) => views.every((v) => newBad(v).includes(id))) : []);
  const weakest = DIMS.slice().sort((a, b) => (cur.dims[a] - thr[a]) - (cur.dims[b] - thr[b]))[0];
  const someoneFixes = views.some((v) => v.prof.dims[weakest] - cur.dims[weakest] >= 2);

  return views.map(({ key, p, lineup, slot, kind, prof }) => {
    const now = new Set(prof.synergies.map((s) => s.id));
    const plus: Note[] = [];
    const warn: Note[] = [];

    if (kind === 'frontRow') warn.push({ tone: 'warn', id: 'frontRow' });
    else if (kind && (kind === 'outOfPosition' || kind === 'unfamiliar')) warn.push({ tone: 'warn', id: 'oop', vars: { slot } });

    for (const id of FIXABLE) if (had.has(id) && !now.has(id)) plus.push({ tone: 'plus', id: `fix.${id}` });
    for (const m of COMPLETE_ORDER) {
      const slots = MOMENT_SLOTS[m];
      if (slots.includes(slot) && !slots.every((n) => !!state.lineup[n]) && slots.every((n) => !!lineup[n])) { plus.push({ tone: 'plus', id: `complete.${m}` }); break; }
    }
    for (const s of prof.synergies) {
      if (had.has(s.id)) continue;
      if (s.delta > 0) plus.push({ tone: 'plus', id: `syn.${s.id}` });
      else if (!commonBad.has(s.id) && s.id !== 'uncontested') warn.push({ tone: 'warn', id: `risk.${s.id}` });
    }

    let up: Dim | undefined, down: Dim | undefined, bu = 1, bd = -1;
    if (cur.filled) {
      for (const d of DIMS) {
        const diff = prof.dims[d] - cur.dims[d];
        if (diff > bu) { bu = diff; up = d; }
        if (diff < bd) { bd = diff; down = d; }
      }
    }
    if (up && bu >= 2) plus.push({ tone: 'plus', id: `boost.${up}` });
    // the XV's weakest area stays weak with this player while another option would lift it
    if (state.round >= 6 && someoneFixes && cur.dims[weakest] < thr[weakest] - 4 && prof.dims[weakest] - cur.dims[weakest] < 2) warn.push({ tone: 'warn', id: `still.${weakest}` });

    const notes: Note[] = warn.length ? [...plus.slice(0, 1), warn[0]] : plus.slice(0, 2);
    return {
      key, slot, kind, inPos: kind ? isInPosition(kind) : false,
      fitDelta: cur.filled ? prof.fit - cur.fit : 0,
      strengths: keyStrengths(p, slot),
      notes, up, down,
    };
  });
}
