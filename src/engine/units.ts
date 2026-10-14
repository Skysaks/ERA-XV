/**
 * Rugby structure of an XV: units (pack, halves, centres, back three) and the finer groups of a match sheet.
 * Read-only helpers on top of the team model: nothing here changes a rating, a FIT or a season.
 */
import type { PlayerEra } from '../data/schema';
import { DIMS, type Dim, FAM_FACTOR, SLOTS, SLOT_DIM_W } from './rugby';
import { posRating, type Lineup } from './team';

export type UnitId = 'pack' | 'halves' | 'centres' | 'back3';
export const UNIT_SLOTS: Record<UnitId, number[]> = {
  pack: [1, 2, 3, 4, 5, 6, 7, 8],
  halves: [9, 10],
  centres: [12, 13],
  back3: [11, 14, 15],
};
export const UNIT_IDS: UnitId[] = ['pack', 'halves', 'centres', 'back3'];

/** Match-sheet groups, in the order a rugby team sheet reads. */
export type GroupId = 'front' | 'second' | 'backrow' | 'halves' | 'centres' | 'back3';
export const GROUP_SLOTS: Record<GroupId, number[]> = {
  front: [1, 2, 3],
  second: [4, 5],
  backrow: [6, 7, 8],
  halves: [9, 10],
  centres: [12, 13],
  back3: [11, 14, 15],
};
export const GROUP_IDS: GroupId[] = ['front', 'second', 'backrow', 'halves', 'centres', 'back3'];
export const unitOfSlot = (n: number): UnitId => (n <= 8 ? 'pack' : n === 9 || n === 10 ? 'halves' : n === 12 || n === 13 ? 'centres' : 'back3');
export const groupOfSlot = (n: number): GroupId => (GROUP_IDS.find((g) => GROUP_SLOTS[g].includes(n)) ?? 'back3');

export interface UnitState { id: UnitId; filled: number; total: number; complete: boolean }
export function unitProgress(lineup: Lineup): UnitState[] {
  return UNIT_IDS.map((id) => {
    const slots = UNIT_SLOTS[id];
    const filled = slots.filter((n) => !!lineup[n]).length;
    return { id, filled, total: slots.length, complete: filled === slots.length };
  });
}

/**
 * Same weighting as the team profile (shirt share of a dimension × attribute × familiarity), restricted to a set of shirts.
 * A dimension a group does not touch falls back to the plain average of that attribute.
 */
export function groupDims(lineup: Lineup, byKey: (k: string) => PlayerEra | undefined, slots: number[]): Record<Dim, number> {
  const views = slots.map((n) => {
    const k = lineup[n];
    const p = k ? byKey(k) : undefined;
    if (!p) return null;
    const pos = SLOTS[n - 1].pos;
    return { n, p, f: FAM_FACTOR[posRating(p, pos).kind] };
  }).filter((x): x is { n: number; p: PlayerEra; f: number } => !!x);
  const out = {} as Record<Dim, number>;
  for (const d of DIMS) {
    let s = 0, w = 0;
    for (const v of views) {
      const wt = SLOT_DIM_W[d][v.n];
      if (!wt) continue;
      s += wt * v.p.attrs[d] * (0.5 + 0.5 * v.f);
      w += wt;
    }
    if (w) out[d] = Math.round(s / w);
    else out[d] = views.length ? Math.round(views.reduce((a, v) => a + v.p.attrs[d] * (0.5 + 0.5 * v.f), 0) / views.length) : 0;
  }
  return out;
}

/** Average rating in position of the filled shirts of a unit (Clubhouse Cup progress). */
export function unitRatings(lineup: Lineup, byKey: (k: string) => PlayerEra | undefined): Record<UnitId, number | null> {
  const out = {} as Record<UnitId, number | null>;
  for (const id of UNIT_IDS) {
    const rs = UNIT_SLOTS[id].map((n) => {
      const k = lineup[n];
      const p = k ? byKey(k) : undefined;
      return p ? posRating(p, SLOTS[n - 1].pos).rating : null;
    }).filter((x): x is number => x !== null);
    out[id] = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : null;
  }
  return out;
}

/* ------------------------------------------------------ draft moments */

export type MomentId = 'front' | 'backrow' | 'pack' | 'halves' | 'centres' | 'back3';
export const MOMENT_SLOTS: Record<MomentId, number[]> = {
  front: GROUP_SLOTS.front, backrow: GROUP_SLOTS.backrow, pack: UNIT_SLOTS.pack,
  halves: UNIT_SLOTS.halves, centres: UNIT_SLOTS.centres, back3: UNIT_SLOTS.back3,
};
/** The three qualities shown when a group is complete (real group values, see groupDims). */
export const MOMENT_DIMS: Record<MomentId, Dim[]> = {
  front: ['scrum', 'carry'],
  backrow: ['breakdown', 'pace', 'defence'],
  pack: ['carry', 'lineout', 'breakdown'],
  halves: ['playmaking', 'kicking'],
  centres: ['carry', 'defence', 'strike'],
  back3: ['pace', 'aerial', 'strike'],
};
/** One moment per pick at most: the biggest structure wins. */
const MOMENT_ORDER: MomentId[] = ['pack', 'front', 'backrow', 'halves', 'back3', 'centres'];

export interface Moment { id: MomentId; values: { dim: Dim; value: number }[]; names: string[] }
export function completedMoment(before: Lineup, after: Lineup, byKey: (k: string) => PlayerEra | undefined, seen: ReadonlySet<MomentId>): Moment | null {
  const full = (l: Lineup, slots: number[]) => slots.every((n) => !!l[n]);
  for (const id of MOMENT_ORDER) {
    if (seen.has(id)) continue;
    const slots = MOMENT_SLOTS[id];
    if (!full(before, slots) && full(after, slots)) {
      const dims = groupDims(after, byKey, slots);
      return {
        id,
        values: MOMENT_DIMS[id].map((d) => ({ dim: d, value: dims[d] })),
        names: slots.map((n) => byKey(after[n]!)!.short),
      };
    }
  }
  return null;
}

/** 1–5 stars for a 0–100 group value (display only). */
export const stars = (v: number) => (v >= 92 ? 5 : v >= 86 ? 4 : v >= 80 ? 3 : v >= 74 ? 2 : 1);
