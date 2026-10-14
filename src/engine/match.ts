import { type Dim, PLAN_DEF, type PlanId } from './rugby';
import { poissonInv, u01 } from './rng';

/** Everything the match engine needs to know about one XV. */
export interface Side {
  id: string;
  name: string;
  dims: Record<Dim, number>;
  boot: number;
  /** tactical kicking of the fly-half (drop goals) */
  kick10: number;
  fit: number;
  ovr: number;
  plan: PlanId;
}

export interface Components { sp: number; col: number; att: number; kg: number; def: number }

/** Plan-weighted deviations from a 72 baseline; FIT adds cohesion. */
export function components(s: Side): Components {
  const w = PLAN_DEF[s.plan].w;
  const dev = (d: Dim) => (s.dims[d] - 72) * w[d];
  const coh = (s.fit - 85) * MODEL.coh;
  return {
    sp: 0.5 * dev('scrum') + 0.5 * dev('lineout') + coh,
    col: 0.4 * dev('carry') + 0.35 * dev('breakdown') + 0.25 * dev('defence') + coh,
    att: 0.35 * dev('playmaking') + 0.4 * dev('strike') + 0.25 * dev('pace') + coh,
    kg: 0.6 * dev('kicking') + 0.4 * dev('aerial') + coh,
    def: 0.6 * dev('defence') + 0.25 * dev('breakdown') + 0.15 * dev('pace') + coh,
  };
}

export const MODEL = {
  baseTries: 2.55, kTry: 0.06, kTryCol: 0.022,
  basePens: 2.2, kPen: 0.034, kPenCol: 0.02,
  home: 0.1,
  /** FIT → cohesion on every component */
  coh: 0.04,
  /** differences are softened beyond ±soft (tanh), so a broken XV still wins a few */
  soft: 10,
};
const soft = (x: number) => MODEL.soft * Math.tanh(x / MODEL.soft);

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const pPenalty = (boot: number) => Math.max(0.5, Math.min(0.93, 0.4 + 0.0055 * boot));
export const pConversion = (boot: number) => Math.max(0.42, Math.min(0.88, 0.25 + 0.0066 * boot));

export interface Expect { lt: number; lp: number; ld: number; terr: number }
export function expectations(a: Side, b: Side, homeA: boolean, neutral: boolean): { a: Expect; b: Expect } {
  const ca = components(a), cb = components(b);
  const h = neutral ? 0 : homeA ? MODEL.home : -MODEL.home;
  const pa = sigmoid(0.05 * soft(ca.sp - cb.sp) + 0.045 * soft(ca.col - cb.col) + 0.04 * soft(ca.kg - cb.kg) + h);
  const mk = (c1: Components, c2: Components, s: Side, p: number, hb: number): Expect => ({
    lt: MODEL.baseTries * Math.exp(MODEL.kTry * soft(c1.att - c2.def) + MODEL.kTryCol * soft(c1.col - c2.col)) * (0.55 + 0.9 * p) * (1 + hb * 0.6),
    lp: MODEL.basePens * Math.exp(MODEL.kPen * soft(c1.sp - c2.sp) + MODEL.kPenCol * soft(c1.col - c2.col)) * (0.5 + p) * (s.plan === 'territory' ? 1.12 : 1),
    ld: 0.1 * Math.max(0, s.kick10 - 76) / 12,
    terr: p,
  });
  return { a: mk(ca, cb, a, pa, h), b: mk(cb, ca, b, 1 - pa, -h) };
}

export interface SideScore { pts: number; tries: number; cons: number; pens: number; drops: number }
function scoreSide(e: Expect, boot: number, key: string, tag: string, scale = 1): SideScore {
  const tries = poissonInv(e.lt * scale, u01(key, tag, 'T'));
  let cons = 0;
  for (let i = 0; i < tries; i++) if (u01(key, tag, 'C', i) < pConversion(boot)) cons++;
  const att = poissonInv(e.lp * scale, u01(key, tag, 'P'));
  let pens = 0;
  for (let i = 0; i < att; i++) if (u01(key, tag, 'K', i) < pPenalty(boot)) pens++;
  const drops = poissonInv(e.ld * scale, u01(key, tag, 'D'));
  return { pts: tries * 5 + cons * 2 + pens * 3 + drops * 3, tries, cons, pens, drops };
}

export interface MatchResult {
  home: SideScore; away: SideScore;
  /** extra time was played (knockouts) */
  et?: boolean;
  /** kicking competition score (knockouts still level after extra time) */
  kc?: [number, number];
  /** winner: 1 home, -1 away, 0 draw */
  w: 1 | 0 | -1;
}

export function simMatch(home: Side, away: Side, key: string, opts: { neutral?: boolean; knockout?: boolean } = {}): MatchResult {
  const { a, b } = expectations(home, away, true, !!opts.neutral);
  const hs = scoreSide(a, home.boot, key, 'h');
  const as = scoreSide(b, away.boot, key, 'a');
  let w: 1 | 0 | -1 = hs.pts > as.pts ? 1 : hs.pts < as.pts ? -1 : 0;
  const res: MatchResult = { home: hs, away: as, w };
  if (w === 0 && opts.knockout) {
    const eh = scoreSide(a, home.boot, key + ':et', 'h', 0.25);
    const ea = scoreSide(b, away.boot, key + ':et', 'a', 0.25);
    res.et = true;
    const add = (x: SideScore, y: SideScore): SideScore => ({ pts: x.pts + y.pts, tries: x.tries + y.tries, cons: x.cons + y.cons, pens: x.pens + y.pens, drops: x.drops + y.drops });
    res.home = add(hs, eh); res.away = add(as, ea);
    w = res.home.pts > res.away.pts ? 1 : res.home.pts < res.away.pts ? -1 : 0;
    if (w === 0) {
      // kicking competition: five each, then sudden death
      let kh = 0, ka = 0;
      const ph = 0.42 + 0.0045 * home.boot, pa = 0.42 + 0.0045 * away.boot;
      for (let i = 0; i < 5; i++) { if (u01(key, 'kc', 'h', i) < ph) kh++; if (u01(key, 'kc', 'a', i) < pa) ka++; }
      let i = 5;
      while (kh === ka && i < 30) { if (u01(key, 'kc', 'h', i) < ph) kh++; if (u01(key, 'kc', 'a', i) < pa) ka++; i++; }
      if (kh === ka) kh++;
      res.kc = [kh, ka];
      w = kh > ka ? 1 : -1;
    }
    res.w = w;
  }
  return res;
}
