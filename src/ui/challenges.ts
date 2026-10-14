/**
 * Asynchronous challenges on this device. No account, no server: a challenge is a link carrying the draw and the
 * sender's verified result; the reply is another link. Both results are recomputed from their links before they are
 * stored or compared (engine/official.ts), so a score typed by hand cannot enter this list.
 *
 *   sent      I shared my result          → awaiting until their reply link is opened here
 *   received  I opened someone's link     → to play, then done once I have played the same draw
 */
import { drawId, drawOf, verifyToken, type DrawSpec } from '../engine/index';
import { load, save } from './store';

export interface ChallengeSide { name: string; pts: number; pos?: number; fit: number; w: number; d: number; l: number; diff?: number; bonus?: number; token: string; at: number }
export interface ChallengeRec {
  id: string;
  drawId: string;
  draw: DrawSpec;
  dir: 'sent' | 'received';
  createdAt: number;
  updatedAt: number;
  daily?: string;
  me?: ChallengeSide;
  them?: ChallengeSide;
}
export type ChallengeState = 'toPlay' | 'awaiting' | 'done';
export const stateOf = (c: ChallengeRec): ChallengeState => (c.me && c.them ? 'done' : c.dir === 'received' ? 'toPlay' : 'awaiting');
export function outcome(c: ChallengeRec): 'win' | 'loss' | 'draw' | null {
  if (!c.me || !c.them) return null;
  return c.me.pts > c.them.pts ? 'win' : c.me.pts < c.them.pts ? 'loss' : 'draw';
}

const KEY = 'challenges';
const MAX = 120;
export const loadChallenges = (): ChallengeRec[] => {
  const xs = load<ChallengeRec[]>(KEY, []);
  return Array.isArray(xs) ? xs.filter((x) => x && typeof x.drawId === 'string' && x.draw) : [];
};
const saveChallenges = (xs: ChallengeRec[]) => save(KEY, xs.sort((a, b) => a.updatedAt - b.updatedAt).slice(-MAX));

/** Side of a result and its draw, recomputed from its link. Null when the link does not verify. */
function verified(token: string, fallbackName = ''): { side: ChallengeSide; draw: DrawSpec } | null {
  const v = verifyToken(token);
  if (!v.ok) return null;
  const g = v.game;
  const s = g.season;
  const side: ChallengeSide = {
    name: g.t.name || fallbackName, pts: g.points, pos: s?.position, fit: g.prof.fit, w: s?.w ?? g.points, d: s?.d ?? 0, l: s?.l ?? 0,
    diff: s ? s.pf - s.pa : undefined, bonus: s ? s.tb + s.lb : undefined, token, at: Date.now(),
  };
  return { side, draw: drawOf(g.t.cfg) };
}
export const sideFromToken = (token: string, fallbackName = ''): ChallengeSide | null => verified(token, fallbackName)?.side ?? null;

/** I shared a result of mine. */
export function recordSent(token: string, daily?: string): ChallengeRec | null {
  const x = verified(token);
  if (!x) return null;
  const { side: me, draw } = x;
  const id = drawId(draw);
  const xs = loadChallenges();
  // one open "sent" per draw: sharing the same result again just refreshes it
  let rec = xs.find((c) => c.drawId === id && c.dir === 'sent' && !c.them);
  if (rec) { rec.me = me; rec.updatedAt = Date.now(); }
  else { rec = { id: `${id}-s${Date.now().toString(36)}`, drawId: id, draw, dir: 'sent', createdAt: Date.now(), updatedAt: Date.now(), daily, me }; xs.push(rec); }
  saveChallenges(xs);
  return rec;
}

/**
 * I opened a link. If it answers a challenge I sent (same draw), it completes it.
 * Opening my own link again changes nothing.
 */
export function recordReceived(token: string, daily?: string): { rec: ChallengeRec; reply: boolean } | null {
  const x = verified(token);
  if (!x) return null;
  const { side: them, draw } = x;
  const id = drawId(draw);
  const xs = loadChallenges();
  const mine = xs.find((c) => c.drawId === id && c.me?.token === token);
  if (mine) return { rec: mine, reply: false };
  const sent = xs.find((c) => c.drawId === id && c.dir === 'sent' && (!c.them || c.them.token === token));
  if (sent) {
    sent.them = them; sent.updatedAt = Date.now();
    saveChallenges(xs);
    return { rec: sent, reply: true };
  }
  let rec = xs.find((c) => c.drawId === id && c.dir === 'received' && c.them?.token === token);
  if (!rec) { rec = { id: `${id}-r${Date.now().toString(36)}`, drawId: id, draw, dir: 'received', createdAt: Date.now(), updatedAt: Date.now(), daily, them }; xs.push(rec); }
  else rec.updatedAt = Date.now();
  saveChallenges(xs);
  return { rec, reply: false };
}

/** I played a received challenge: attach my verified result. */
export function recordPlayed(challengeToken: string, myToken: string): ChallengeRec | null {
  const me = sideFromToken(myToken);
  if (!me) return null;
  const xs = loadChallenges();
  const rec = xs.find((c) => c.dir === 'received' && c.them?.token === challengeToken);
  if (!rec) return null;
  if (!rec.me) rec.me = me; // the first answer is the one that counts
  rec.updatedAt = Date.now();
  saveChallenges(xs);
  return rec;
}

export function challengeCounts(xs = loadChallenges()) {
  let won = 0, lost = 0, drawn = 0, toPlay = 0, awaiting = 0;
  for (const c of xs) {
    const st = stateOf(c);
    if (st === 'toPlay') toPlay++;
    else if (st === 'awaiting') awaiting++;
    const o = outcome(c);
    if (o === 'win') won++; else if (o === 'loss') lost++; else if (o === 'draw') drawn++;
  }
  return { won, lost, drawn, toPlay, awaiting, total: xs.length };
}

/** Friends' verified results on one Daily, plus mine: a local, honest "between friends" table. */
export function dailyBoard(day: string, mine?: { pts: number; pos?: number; token?: string }, xs = loadChallenges()): { name: string; pts: number; pos?: number; me: boolean }[] {
  const rows: { name: string; pts: number; pos?: number; me: boolean; token?: string }[] = [];
  if (mine) rows.push({ name: '', pts: mine.pts, pos: mine.pos, me: true, token: mine.token });
  for (const c of xs) {
    if (c.daily !== day || !c.them) continue;
    if (rows.some((r) => r.token === c.them!.token)) continue;
    rows.push({ name: c.them.name, pts: c.them.pts, pos: c.them.pos, me: false, token: c.them.token });
  }
  return rows.sort((a, b) => b.pts - a.pts || (a.pos ?? 99) - (b.pos ?? 99)).map(({ token: _t, ...r }) => r);
}
