/**
 * ERA XV — rugby union domain model (pure, no React).
 *
 * Football → rugby transposition:
 *  - 11 slots in a formation        → 15 fixed shirts (1–15). Formations become GAME PLANS.
 *  - GK special case                → FRONT ROW special case (a non-front-rower at 1/2/3 = uncontested scrums)
 *  - ATT / MID / DEF / GK axes      → PACK / BACKS / DEF / BOOT (goal-kicker) axes
 *  - 10 tactical dimensions         → scrum, lineout, breakdown, carry, defence, playmaking,
 *                                     kicking, strike, pace, aerial
 */

export type Pos = 'LHP' | 'HK' | 'THP' | 'LK' | 'BF' | 'OF' | 'N8' | 'SH' | 'FH' | 'IC' | 'OC' | 'WG' | 'FB';
export const POSITIONS: Pos[] = ['LHP', 'HK', 'THP', 'LK', 'BF', 'OF', 'N8', 'SH', 'FH', 'IC', 'OC', 'WG', 'FB'];

export type Unit = 'front' | 'lock' | 'back3row' | 'half' | 'centre' | 'back3';
export const POS_UNIT: Record<Pos, Unit> = {
  LHP: 'front', HK: 'front', THP: 'front', LK: 'lock', BF: 'back3row', OF: 'back3row', N8: 'back3row',
  SH: 'half', FH: 'half', IC: 'centre', OC: 'centre', WG: 'back3', FB: 'back3',
};
export const isForward = (p: Pos) => ['LHP', 'HK', 'THP', 'LK', 'BF', 'OF', 'N8'].includes(p);
export const isFrontRow = (p: Pos) => p === 'LHP' || p === 'HK' || p === 'THP';

/** The 15 shirts. x/y in a 0–100 box, attack upwards (fullback at the bottom). */
export interface Slot { n: number; pos: Pos; x: number; y: number }
export const SLOTS: Slot[] = [
  { n: 1, pos: 'LHP', x: 30, y: 12 },
  { n: 2, pos: 'HK', x: 50, y: 11 },
  { n: 3, pos: 'THP', x: 70, y: 12 },
  { n: 4, pos: 'LK', x: 39, y: 25.5 },
  { n: 5, pos: 'LK', x: 61, y: 25.5 },
  { n: 6, pos: 'BF', x: 17, y: 31 },
  { n: 7, pos: 'OF', x: 83, y: 31 },
  { n: 8, pos: 'N8', x: 50, y: 39 },
  { n: 9, pos: 'SH', x: 33, y: 51 },
  { n: 10, pos: 'FH', x: 62, y: 56 },
  { n: 11, pos: 'WG', x: 11, y: 72 },
  { n: 12, pos: 'IC', x: 38, y: 66 },
  { n: 13, pos: 'OC', x: 63, y: 72 },
  { n: 14, pos: 'WG', x: 89, y: 72 },
  { n: 15, pos: 'FB', x: 50, y: 87 },
];
export const SLOT_COUNT = 15;

export type Dim = 'scrum' | 'lineout' | 'breakdown' | 'carry' | 'defence' | 'playmaking' | 'kicking' | 'strike' | 'pace' | 'aerial';
export const DIMS: Dim[] = ['scrum', 'lineout', 'breakdown', 'carry', 'defence', 'playmaking', 'kicking', 'strike', 'pace', 'aerial'];
export type Attr = Dim | 'goalKick';
export const ATTRS: Attr[] = [...DIMS, 'goalKick'];

/** How much each shirt contributes to each team dimension (normalised per dim at load). */
const RAW_W: Record<Dim, Partial<Record<number, number>>> = {
  scrum: { 1: 30, 2: 18, 3: 32, 4: 6, 5: 6, 6: 2, 7: 2, 8: 4 },
  lineout: { 2: 25, 4: 25, 5: 25, 6: 12, 7: 5, 8: 8 },
  breakdown: { 7: 28, 6: 14, 8: 12, 2: 10, 1: 5, 3: 5, 4: 5, 5: 5, 12: 6, 9: 5, 13: 5 },
  carry: { 8: 18, 1: 8, 3: 8, 2: 6, 4: 8, 5: 6, 6: 10, 7: 6, 12: 14, 13: 6, 11: 5, 14: 5 },
  defence: { 6: 12, 7: 12, 12: 10, 13: 12, 4: 6, 5: 6, 8: 8, 2: 4, 1: 3, 3: 3, 10: 6, 9: 5, 15: 8, 11: 2.5, 14: 2.5 },
  playmaking: { 10: 35, 9: 22, 12: 15, 15: 10, 13: 6, 7: 4, 8: 4, 2: 2, 11: 1, 14: 1 },
  kicking: { 10: 38, 9: 22, 15: 22, 12: 8, 11: 5, 14: 5 },
  strike: { 11: 22, 14: 22, 13: 18, 15: 16, 12: 8, 10: 6, 9: 4, 8: 4 },
  pace: { 11: 20, 14: 20, 15: 15, 13: 12, 9: 10, 12: 6, 10: 6, 7: 6, 6: 3, 8: 2 },
  aerial: { 15: 32, 11: 20, 14: 20, 10: 6, 13: 6, 12: 4, 9: 4, 4: 4, 5: 4 },
};
export const SLOT_DIM_W: Record<Dim, number[]> = (() => {
  const out = {} as Record<Dim, number[]>;
  for (const d of DIMS) {
    const arr = new Array(16).fill(0);
    let s = 0;
    for (const [k, v] of Object.entries(RAW_W[d])) { arr[Number(k)] = v!; s += v!; }
    out[d] = arr.map((v) => v / s);
  }
  return out;
})();

/* ------------------------------------------------------------------ roles */

export type Role =
  | 'PS' | 'PC' | 'HS' | 'HD' | 'LE' | 'LC' | 'LA' | 'F6' | 'FT' | 'FJ' | 'FL' | 'NP' | 'NF'
  | '9S' | '9T' | '9K' | '10G' | '10R' | '12C' | '12P' | '13B' | '13D' | 'WF' | 'WP' | 'WA' | 'FC' | 'FS';
export const ROLES: Role[] = ['PS', 'PC', 'HS', 'HD', 'LE', 'LC', 'LA', 'F6', 'FT', 'FJ', 'FL', 'NP', 'NF', '9S', '9T', '9K', '10G', '10R', '12C', '12P', '13B', '13D', 'WF', 'WP', 'WA', 'FC', 'FS'];

/** Attribute offsets from the player's rating, per role (scrum, lineout, breakdown, carry, defence, playmaking, kicking, strike, pace, aerial, goalKick). */
const T = (a: number[]) => a;
export const ROLE_TEMPLATE: Record<Role, number[]> = {
  PS: T([5, -25, -6, -3, -3, -22, -50, -28, -30, -40, -60]),
  PC: T([-2, -25, -3, 4, -2, -14, -50, -22, -22, -40, -60]),
  HS: T([2, 5, -3, -4, -2, -18, -50, -25, -24, -35, -60]),
  HD: T([-3, 0, 2, 4, 0, -10, -45, -15, -15, -35, -60]),
  LE: T([-8, -2, -4, 2, 3, -20, -50, -30, -28, -10, -60]),
  LC: T([-10, 6, -6, -5, -1, -15, -50, -30, -25, -2, -60]),
  LA: T([-12, 0, -2, 3, 2, -10, -45, -20, -15, -6, -60]),
  F6: T([-25, 2, -2, -1, 3, -12, -45, -18, -12, -8, -60]),
  FT: T([-25, -8, 1, -2, 6, -12, -45, -18, -12, -20, -60]),
  FJ: T([-28, -15, 6, -5, 3, -8, -45, -12, -8, -25, -60]),
  FL: T([-28, -10, 1, 0, 0, 0, -35, -6, -4, -18, -60]),
  NP: T([-22, -8, -2, 6, 0, -12, -45, -12, -10, -18, -60]),
  NF: T([-22, -4, 0, 1, -1, -2, -35, -8, -6, -14, -60]),
  '9S': T([-60, -60, -8, -12, -4, 0, -6, 0, 2, -12, -35]),
  '9T': T([-60, -60, -6, -18, -4, 5, -5, -8, 2, -12, -35]),
  '9K': T([-60, -60, -8, -18, -3, 2, 5, -14, -6, -6, -30]),
  '10G': T([-60, -60, -20, -15, -6, 4, 6, -10, -8, -6, -8]),
  '10R': T([-60, -60, -20, -8, -8, 6, 0, -2, 0, -8, -14]),
  '12C': T([-55, -55, -8, 5, 3, -8, -25, -4, -6, -12, -40]),
  '12P': T([-55, -55, -12, -4, 0, 4, 0, -6, -6, -8, -25]),
  '13B': T([-55, -55, -14, -2, -2, -4, -20, 4, 3, -8, -40]),
  '13D': T([-55, -55, -8, -2, 5, 0, -15, -4, -4, -6, -40]),
  WF: T([-60, -60, -20, -12, -8, -14, -25, 6, 7, -10, -40]),
  WP: T([-60, -60, -16, 4, -4, -16, -28, 4, 2, -8, -45]),
  WA: T([-60, -60, -14, -6, 0, -8, -10, 0, 0, 6, -40]),
  FC: T([-60, -60, -16, -6, -4, -2, -6, 3, 4, 2, -30]),
  FS: T([-60, -60, -14, -10, 2, -6, 5, -6, -4, 6, -15]),
};

/** The natural position a role belongs to (used for Role School and role-based synergies). */
export const ROLE_HOME: Record<Role, Pos[]> = {
  PS: ['LHP', 'THP'], PC: ['LHP', 'THP'], HS: ['HK'], HD: ['HK'], LE: ['LK'], LC: ['LK'], LA: ['LK'],
  F6: ['BF'], FT: ['BF', 'OF'], FJ: ['OF'], FL: ['OF', 'BF'], NP: ['N8'], NF: ['N8'],
  '9S': ['SH'], '9T': ['SH'], '9K': ['SH'], '10G': ['FH'], '10R': ['FH'], '12C': ['IC'], '12P': ['IC'],
  '13B': ['OC'], '13D': ['OC'], WF: ['WG'], WP: ['WG'], WA: ['WG'], FC: ['FB'], FS: ['FB'],
};

/* ------------------------------------------------------------ familiarity */

export type FamKind = 'natural' | 'secondary' | 'close' | 'cover' | 'stretch' | 'unfamiliar' | 'outOfPosition' | 'frontRow';
export const FAM_FACTOR: Record<FamKind, number> = {
  natural: 1, secondary: 0.97, close: 0.93, cover: 0.88, stretch: 0.82, unfamiliar: 0.72, outOfPosition: 0.55, frontRow: 0.45,
};

/** Directed relations from → to (player's position → shirt position). */
const REL: Partial<Record<Pos, Partial<Record<Pos, FamKind>>>> = {
  LHP: { THP: 'cover', HK: 'stretch' },
  THP: { LHP: 'close', HK: 'stretch' },
  HK: { LHP: 'stretch', THP: 'stretch', BF: 'stretch', OF: 'stretch' },
  LK: { BF: 'cover', N8: 'stretch' },
  BF: { OF: 'close', N8: 'close', LK: 'cover' },
  OF: { BF: 'close', N8: 'cover' },
  N8: { BF: 'close', OF: 'cover', LK: 'stretch' },
  SH: { FH: 'stretch' },
  FH: { IC: 'cover', FB: 'cover', SH: 'stretch', OC: 'stretch' },
  IC: { OC: 'close', FH: 'stretch', WG: 'stretch' },
  OC: { IC: 'close', WG: 'cover', FB: 'stretch' },
  WG: { FB: 'close', OC: 'stretch' },
  FB: { WG: 'close', FH: 'stretch', OC: 'stretch' },
};

export function famKind(playerPos: Pos[], slotPos: Pos): FamKind {
  if (playerPos[0] === slotPos) return 'natural';
  if (playerPos.includes(slotPos)) return 'secondary';
  if (isFrontRow(slotPos) && !playerPos.some(isFrontRow)) return 'frontRow';
  let best: FamKind = isForward(playerPos[0]) === isForward(slotPos) ? 'unfamiliar' : 'outOfPosition';
  for (const p of playerPos) {
    const k = REL[p]?.[slotPos];
    if (k && FAM_FACTOR[k] > FAM_FACTOR[best]) best = k;
  }
  return best;
}
export const famFactor = (playerPos: Pos[], slotPos: Pos) => FAM_FACTOR[famKind(playerPos, slotPos)];
export const isInPosition = (k: FamKind) => k === 'natural' || k === 'secondary';

/* ------------------------------------------------------------- game plans */

export type PlanId = 'balanced' | 'pack' | 'flair' | 'territory' | 'blitz' | 'tempo';
export const PLANS: PlanId[] = ['balanced', 'pack', 'flair', 'territory', 'blitz', 'tempo'];
export interface Plan {
  id: PlanId;
  /** multiplier on each dimension's weight in the match engine */
  w: Record<Dim, number>;
  /** FIT threshold per dimension (below it, FIT drops) */
  thr: Record<Dim, number>;
  /** short label used on chips */
  short: string;
}
const base = (v: number): Record<Dim, number> => Object.fromEntries(DIMS.map((d) => [d, v])) as Record<Dim, number>;
const mk = (id: PlanId, short: string, w: Partial<Record<Dim, number>>, thr: Partial<Record<Dim, number>>): Plan => ({
  id, short, w: { ...base(1), ...w }, thr: { ...base(70), ...thr },
});
export const PLAN_DEF: Record<PlanId, Plan> = {
  balanced: mk('balanced', 'BAL', {}, {}),
  pack: mk('pack', 'PACK', { scrum: 1.4, lineout: 1.25, carry: 1.4, breakdown: 1.1, playmaking: 0.85, strike: 0.8, pace: 0.7 },
    { scrum: 76, lineout: 74, carry: 76, playmaking: 64, strike: 62, pace: 58 }),
  flair: mk('flair', 'FLAIR', { playmaking: 1.4, strike: 1.4, pace: 1.3, carry: 0.9, scrum: 0.8, kicking: 0.8, lineout: 0.9 },
    { playmaking: 76, strike: 76, pace: 74, scrum: 62, kicking: 60, lineout: 64 }),
  territory: mk('territory', 'KICK', { kicking: 1.5, aerial: 1.35, defence: 1.2, lineout: 1.1, playmaking: 0.9, strike: 0.8, pace: 0.85 },
    { kicking: 78, aerial: 74, defence: 74, strike: 62, pace: 62 }),
  blitz: mk('blitz', 'BLITZ', { defence: 1.5, breakdown: 1.3, pace: 1.1, kicking: 0.9, playmaking: 0.9 },
    { defence: 78, breakdown: 75, pace: 70, playmaking: 64, kicking: 62 }),
  tempo: mk('tempo', 'TEMPO', { breakdown: 1.3, pace: 1.2, playmaking: 1.2, carry: 1.1, scrum: 0.8, kicking: 0.8, aerial: 0.85 },
    { breakdown: 76, pace: 74, playmaking: 74, scrum: 62, kicking: 60, aerial: 60 }),
};

/* --------------------------------------------------------------- rulesets */

export type RulesetId = 'intl' | 'top14';
export interface Ruleset { id: RulesetId; win: number; draw: number; tryBonus: (triesFor: number, triesAgainst: number, won: boolean) => boolean; losingBonus: (margin: number) => boolean }
export const RULESETS: Record<RulesetId, Ruleset> = {
  /** Six Nations / World Cup / Premiership / URC: 4 tries = bonus; lose by 7 or fewer = bonus. */
  intl: { id: 'intl', win: 4, draw: 2, tryBonus: (tf) => tf >= 4, losingBonus: (m) => m >= 1 && m <= 7 },
  /** Top 14: offensive bonus if you WIN with 3+ more tries than the opponent; defensive bonus if you lose by 5 or fewer. */
  top14: { id: 'top14', win: 4, draw: 2, tryBonus: (tf, ta, won) => won && tf - ta >= 3, losingBonus: (m) => m >= 1 && m <= 5 },
};
export const SEASON_GAMES = 26;
export const MAX_PER_GAME = 5;
export const MAX_POINTS = SEASON_GAMES * MAX_PER_GAME; // 130
export const LEAGUE_SIZE = 14;
