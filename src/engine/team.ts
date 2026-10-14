import type { PlayerEra } from '../data/schema';
import {
  DIMS, type Dim, type Pos, SLOTS, SLOT_DIM_W, famKind, FAM_FACTOR, type FamKind, isInPosition, PLAN_DEF, type PlanId, isFrontRow, type Role,
} from './rugby';

/* ---------------------------------------------------- ratings by position */

/** What a shirt needs: that shirt's share of every dimension, normalised. */
export const SLOT_NEEDS: Record<number, Record<Dim, number>> = (() => {
  const out: Record<number, Record<Dim, number>> = {};
  for (const s of SLOTS) {
    const v = {} as Record<Dim, number>;
    let sum = 0;
    for (const d of DIMS) { v[d] = SLOT_DIM_W[d][s.n]; sum += v[d]; }
    for (const d of DIMS) v[d] = sum ? v[d] / sum : 0;
    out[s.n] = v;
  }
  return out;
})();
const POS_NEEDS: Record<string, Record<Dim, number>> = (() => {
  const out: Record<string, Record<Dim, number>> = {};
  for (const s of SLOTS) if (!out[s.pos]) out[s.pos] = SLOT_NEEDS[s.n];
  return out;
})();

export function profileFit(p: PlayerEra, pos: Pos): number {
  const need = POS_NEEDS[pos];
  let s = 0;
  for (const d of DIMS) s += need[d] * p.attrs[d];
  return s;
}

export interface PosRating { rating: number; kind: FamKind; factor: number; adj: number }
const cacheKey = (p: PlayerEra, pos: Pos) => `${p.key}@${pos}`;
const PR_CACHE = new Map<string, PosRating>();
/** A player's rating in a given position: his rating × familiarity, nudged by how well his attributes suit that job. */
export function posRating(p: PlayerEra, pos: Pos): PosRating {
  const k = cacheKey(p, pos);
  const hit = PR_CACHE.get(k);
  if (hit) return hit;
  const kind = famKind(p.pos, pos);
  const factor = FAM_FACTOR[kind];
  let adj = 0;
  if (kind !== 'natural' && kind !== 'frontRow' && kind !== 'outOfPosition') {
    adj = Math.max(-4, Math.min(3, (profileFit(p, pos) - profileFit(p, p.pos[0])) * 0.25));
  }
  const rating = kind === 'natural' ? p.rating : Math.max(20, Math.min(p.rating, Math.round(p.rating * factor + adj)));
  const r = { rating, kind, factor, adj: Math.round(adj) };
  PR_CACHE.set(k, r);
  return r;
}

/* ---------------------------------------------------------- assignment */

/** Hungarian algorithm (min-cost, square). Returns assignment row→col. */
export function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity), used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity, j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const res = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) res[p[j] - 1] = j - 1;
  return res;
}

/** slots[1..15] → player key (index 0 unused) */
export type Lineup = (string | null)[];
export const emptyLineup = (): Lineup => new Array(16).fill(null);

/**
 * Best arrangement of up to 15 players over the 15 shirts. `prev` keeps players where they are
 * when it costs nothing (stable picks during the draft).
 */
export function place(players: PlayerEra[], prev?: Lineup): Lineup {
  // square matrix: rows = players, columns = 15 shirts + bench columns (value 0) when more than 15 players
  const n = Math.max(15, players.length);
  const cost: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    const p = players[i];
    for (let c = 0; c < n; c++) {
      const s = SLOTS[c];
      if (!p || !s) { row.push(0); continue; }
      const pr = posRating(p, s.pos);
      let val = pr.rating * 10 + (isInPosition(pr.kind) ? 6 : 0);
      if (prev && prev[s.n] === p.key) val += 3;
      row.push(-val);
    }
    cost.push(row);
  }
  const a = hungarian(cost);
  const out = emptyLineup();
  a.forEach((col, i) => { if (players[i] && col >= 0 && col < 15) out[SLOTS[col].n] = players[i].key; });
  return out;
}

/** Where a candidate would land if added (slot number), given the current players. */
export function projectSlot(current: PlayerEra[], cand: PlayerEra, prev: Lineup): number {
  const l = place([...current, cand], prev);
  for (let n = 1; n <= 15; n++) if (l[n] === cand.key) return n;
  return 0;
}

/* ---------------------------------------------------------- team profile */

export type SynergyId =
  | 'axis' | 'centres' | 'engine' | 'backrow' | 'kickchase' | 'tempo' | 'finishers'
  | 'noJackal' | 'noKicker' | 'uncontested' | 'sameChannel' | 'noCaller' | 'highBall' | 'slowBack3';
export interface Synergy { id: SynergyId; delta: number; slots: number[] }
export interface FitItem { kind: 'dim' | 'pos' | 'syn'; label: string; delta: number; dim?: Dim; value?: number; thr?: number; slot?: number; synergy?: SynergyId }

export interface SlotView { n: number; pos: Pos; player: PlayerEra; rating: number; kind: FamKind }
export interface TeamProfile {
  filled: number;
  slots: SlotView[];
  dims: Record<Dim, number>;
  pack: number; backs: number; def: number; boot: number; fit: number; ovr: number; team: number;
  kicker: PlayerEra | null;
  fitItems: FitItem[];
  synergies: Synergy[];
  oop: SlotView[];
  uncontested: boolean;
  plan: PlanId;
}

const POS_PENALTY: Record<FamKind, number> = { natural: 0, secondary: 1, close: 3, cover: 5, stretch: 8, unfamiliar: 14, outOfPosition: 22, frontRow: 30 };
const is = (r: Role | undefined, ...rs: Role[]) => !!r && rs.includes(r);

export function teamProfile(lineup: Lineup, byKey: (k: string) => PlayerEra | undefined, planId: PlanId = 'balanced'): TeamProfile {
  const plan = PLAN_DEF[planId];
  const slots: SlotView[] = [];
  for (const s of SLOTS) {
    const key = lineup[s.n];
    const p = key ? byKey(key) : undefined;
    if (!p) continue;
    const pr = posRating(p, s.pos);
    slots.push({ n: s.n, pos: s.pos, player: p, rating: pr.rating, kind: pr.kind });
  }
  const at = (n: number) => slots.find((x) => x.n === n);
  const dims = {} as Record<Dim, number>;
  for (const d of DIMS) {
    let s = 0, w = 0;
    for (const sv of slots) {
      const wt = SLOT_DIM_W[d][sv.n];
      if (!wt) continue;
      const f = FAM_FACTOR[sv.kind];
      s += wt * sv.player.attrs[d] * (0.5 + 0.5 * f);
      w += wt;
    }
    dims[d] = w ? Math.round(s / w) : 0;
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const pack = Math.round(mean(slots.filter((x) => x.n <= 8).map((x) => x.rating)));
  const backs = Math.round(mean(slots.filter((x) => x.n >= 9).map((x) => x.rating)));
  let kicker: PlayerEra | null = null;
  for (const sv of slots) if (!kicker || sv.player.attrs.goalKick > kicker.attrs.goalKick) kicker = sv.player;
  const boot = kicker ? kicker.attrs.goalKick : 0;
  const uncontested = slots.some((x) => x.n <= 3 && x.kind === 'frontRow');

  /* synergies (only judged on a complete, or near-complete unit) */
  const syn: Synergy[] = [];
  const r = (n: number) => at(n)?.player.role;
  if (at(10) && at(12) && is(r(12), '12P') && (at(12)!.kind !== 'outOfPosition')) syn.push({ id: 'axis', delta: 2, slots: [10, 12] });
  if (at(12) && at(13)) {
    if (is(r(12), '12C') && is(r(13), '13B', '13D')) syn.push({ id: 'centres', delta: 2, slots: [12, 13] });
    if (is(r(12), '12C') && is(r(13), '12C')) syn.push({ id: 'sameChannel', delta: -3, slots: [12, 13] });
  }
  if (at(4) && at(5)) {
    const roles = [r(4), r(5)];
    const enf = roles.filter((x) => is(x, 'LE')).length, cal = roles.filter((x) => is(x, 'LC')).length;
    if (enf >= 1 && (cal >= 1 || roles.some((x) => is(x, 'LA')))) syn.push({ id: 'engine', delta: 2, slots: [4, 5] });
    const callers = [4, 5, 6, 8].filter((n) => is(r(n), 'LC', 'F6')).length;
    if (!callers && dims.lineout < plan.thr.lineout) syn.push({ id: 'noCaller', delta: -3, slots: [4, 5] });
  }
  if (at(6) && at(7) && at(8)) {
    const br = [r(6), r(7), r(8)];
    const hasJackal = br.some((x) => is(x, 'FJ', 'FL'));
    const hasCarrier = br.some((x) => is(x, 'NP', 'NF'));
    const hasSetOrTackle = br.some((x) => is(x, 'F6', 'FT'));
    if (hasJackal && hasCarrier && hasSetOrTackle) syn.push({ id: 'backrow', delta: 3, slots: [6, 7, 8] });
    if (!hasJackal && dims.breakdown < plan.thr.breakdown + 2) syn.push({ id: 'noJackal', delta: -4, slots: [6, 7, 8] });
  }
  if (at(9) && at(10) && is(r(9), '9T', '9S') && is(r(10), '10R')) syn.push({ id: 'tempo', delta: 2, slots: [9, 10] });
  if (at(9) && at(11) && at(14) && is(r(9), '9K') && [r(11), r(14), r(15)].some((x) => is(x, 'WA', 'FS'))) syn.push({ id: 'kickchase', delta: 2, slots: [9, 11, 14] });
  if (at(11) && at(14) && at(11)!.player.attrs.strike >= 88 && at(14)!.player.attrs.strike >= 88) syn.push({ id: 'finishers', delta: 1, slots: [11, 14] });
  if (at(11) && at(14) && at(15) && dims.aerial < plan.thr.aerial - 4) syn.push({ id: 'highBall', delta: -3, slots: [11, 14, 15] });
  if (at(11) && at(14) && at(15)) {
    const avgPace = mean([11, 14, 15].map((n) => at(n)!.player.attrs.pace));
    if (avgPace < 84) syn.push({ id: 'slowBack3', delta: -3, slots: [11, 14, 15] });
  }
  if (slots.length >= 12 && boot < 72) syn.push({ id: 'noKicker', delta: -6, slots: kicker ? [slots.find((x) => x.player === kicker)!.n] : [] });
  if (uncontested) syn.push({ id: 'uncontested', delta: -6, slots: slots.filter((x) => x.n <= 3 && x.kind === 'frontRow').map((x) => x.n) });

  /* FIT */
  const items: FitItem[] = [];
  const complete = slots.length === 15;
  if (complete) {
    for (const d of DIMS) {
      const thr = plan.thr[d];
      if (dims[d] < thr) items.push({ kind: 'dim', label: d, dim: d, value: dims[d], thr, delta: -Math.min(12, Math.round((thr - dims[d]) * 0.6 * 10) / 10) });
    }
  }
  for (const sv of slots) {
    const pen = POS_PENALTY[sv.kind];
    if (pen) items.push({ kind: 'pos', label: sv.player.short, slot: sv.n, delta: -pen });
  }
  for (const s of syn) items.push({ kind: 'syn', label: s.id, synergy: s.id, delta: s.delta });
  const raw = 100 + items.reduce((a, b) => a + b.delta, 0);
  const fit = slots.length ? Math.max(30, Math.min(100, Math.round(raw))) : 0;
  const def = dims.defence;
  const base = mean([pack, backs, def]);
  const ovr = slots.length ? Math.round(base * (0.8 + 0.2 * (fit / 100))) : 0;
  const team = slots.length ? Math.round(mean(slots.map((x) => x.rating))) : 0;
  return {
    filled: slots.length, slots, dims, pack, backs, def, boot, fit, ovr, team, kicker, fitItems: items, synergies: syn,
    oop: slots.filter((x) => !isInPosition(x.kind)), uncontested, plan: planId,
  };
}

/** A team-era's own best XV (ERA League opponents, legends): exact assignment over the whole squad. */
export function bestXV(players: PlayerEra[]): Lineup {
  return place(players);
}

export const isFrontRowSlot = (n: number) => n <= 3;
export { isFrontRow };
