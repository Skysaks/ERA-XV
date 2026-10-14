import { ALL_PLAYERS } from '../data/index';
import { hashStr } from './rng';
import { PLANS, type PlanId, type RulesetId, SLOTS } from './rugby';
import { MODE_ORDER, type ModeId } from './modes';
import { ENGINE_VERSION, type DraftConfig } from './draft';
import type { Lineup } from './team';

/** Stable numbering of every player version (sorted by key) — part of the data fingerprint. */
const INDEX = ALL_PLAYERS.map((p) => p.key).sort();
const INDEX_OF = new Map(INDEX.map((k, i) => [k, i]));
export const DATA_VERSION = hashStr(INDEX.join(',') + ALL_PLAYERS.map((p) => p.rating + p.pos.join('')).join('')) & 0xffff;
const RULESETS: RulesetId[] = ['intl', 'top14'];

export interface ChallengeToken {
  cfg: DraftConfig;
  picks: string[];
  rerollRound: number;
  lineup: Lineup;
  points: number;
  wins: number;
  name: string;
  rematch: boolean;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export function encodeChallenge(t: ChallengeToken): string {
  const enc = new TextEncoder();
  const param = enc.encode((t.cfg.param ?? '').slice(0, 20));
  const name = enc.encode(t.name.slice(0, 24)).slice(0, 40);
  const out: number[] = [];
  out.push(1, t.cfg.engine & 0xff, DATA_VERSION & 0xff, (DATA_VERSION >> 8) & 0xff);
  out.push(MODE_ORDER.indexOf(t.cfg.mode), PLANS.indexOf(t.cfg.plan), RULESETS.indexOf(t.cfg.ruleset), t.rematch ? 1 : 0);
  out.push((t.cfg.seed >>> 24) & 0xff, (t.cfg.seed >>> 16) & 0xff, (t.cfg.seed >>> 8) & 0xff, t.cfg.seed & 0xff);
  out.push(t.rerollRound < 0 ? 255 : t.rerollRound);
  out.push(param.length, ...param);
  for (const k of t.picks) { const i = INDEX_OF.get(k) ?? 0xffff; out.push((i >> 8) & 0xff, i & 0xff); }
  // shirt n → index of the pick wearing it (4 bits each)
  const slotIdx = SLOTS.map((s) => { const i = t.picks.indexOf(t.lineup[s.n] ?? ''); return i < 0 ? 15 : i; });
  for (let i = 0; i < 16; i += 2) out.push(((slotIdx[i] ?? 15) << 4) | (slotIdx[i + 1] ?? 15));
  out.push(Math.max(0, Math.min(255, t.points)), Math.max(0, Math.min(255, t.wins)));
  out.push(name.length, ...name);
  // checksum
  let c = 0;
  for (const b of out) c = (c * 31 + b) & 0xff;
  out.push(c);
  return b64url(Uint8Array.from(out));
}

/**
 * A name typed by another player (challenge link, live room) is shown on this screen: drop control,
 * zero-width and bidirectional-override characters (which can disguise text) and cap the length.
 */
export const cleanDisplayName = (s: string): string =>
  s.replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').trim().slice(0, 24);

export type DecodeError = 'malformed' | 'outdated' | 'invalid';
export function decodeChallenge(token: string): { ok: true; t: ChallengeToken } | { ok: false; error: DecodeError } {
  let b: Uint8Array;
  try { b = unb64url(token); } catch { return { ok: false, error: 'malformed' }; }
  try {
    if (b.length < 40) return { ok: false, error: 'malformed' };
    let c = 0;
    for (let i = 0; i < b.length - 1; i++) c = (c * 31 + b[i]) & 0xff;
    if (c !== b[b.length - 1]) return { ok: false, error: 'malformed' };
    let i = 0;
    const ver = b[i++];
    if (ver !== 1) return { ok: false, error: 'outdated' };
    const engine = b[i++];
    const dv = b[i++] | (b[i++] << 8);
    if (engine !== ENGINE_VERSION || dv !== DATA_VERSION) return { ok: false, error: 'outdated' };
    const mode = MODE_ORDER[b[i++]] as ModeId | undefined;
    const plan = PLANS[b[i++]] as PlanId | undefined;
    const ruleset = RULESETS[b[i++]];
    const rematch = b[i++] === 1;
    if (!mode || !plan || !ruleset) return { ok: false, error: 'invalid' };
    const seed = ((b[i++] << 24) | (b[i++] << 16) | (b[i++] << 8) | b[i++]) >>> 0;
    const rr = b[i++];
    const pl = b[i++];
    const param = new TextDecoder().decode(b.slice(i, i + pl)); i += pl;
    const picks: string[] = [];
    for (let r = 0; r < 15; r++) { const idx = (b[i++] << 8) | b[i++]; const k = INDEX[idx]; if (!k) return { ok: false, error: 'invalid' }; picks.push(k); }
    const slotIdx: number[] = [];
    for (let r = 0; r < 8; r++) { const v = b[i++]; slotIdx.push(v >> 4, v & 15); }
    const lineup: Lineup = new Array(16).fill(null);
    SLOTS.forEach((s, j) => { const pi = slotIdx[j]; lineup[s.n] = pi < 15 ? picks[pi] : null; });
    const points = b[i++], wins = b[i++];
    const nl = b[i++];
    const name = cleanDisplayName(new TextDecoder().decode(b.slice(i, i + nl)));
    return { ok: true, t: { cfg: { seed, mode, plan, ruleset, param: param || undefined, engine }, picks, rerollRound: rr === 255 ? -1 : rr, lineup, points, wins, name, rematch } };
  } catch { return { ok: false, error: 'malformed' }; }
}

export const TOKEN_RE = /^[A-Za-z0-9_-]{40,600}$/;
export const ROOM_RE = /^r-([a-z2-9]{5})$/;
