/**
 * Live rooms over the artifact `room` capability, presence arm only (event topics are admin-only on this page).
 * Every player publishes one presence object; the room is everyone with the same code. Presence is untrusted:
 * shapes are validated and results are re-verified from each player's picks.
 */
import type { PlanId, RulesetId } from '../../engine/rugby';
import { cleanDisplayName } from '../../engine/challenge';

export type RoomKind = 'liveduel' | 'party' | 'shared' | 'coop';
export interface RoomCfg { seed: number; plan: PlanId; ruleset: RulesetId; epoch: number }
export interface RoomResult { pts: number; w: number; d: number; l: number; tok: string }
export interface Presence {
  app: 'eraxv';
  v: 1;
  room: string;
  name: string;
  host: boolean;
  kind: RoomKind;
  joinedAt: number;
  phase: 'lobby' | 'draft' | 'done';
  epoch: number;
  cfg?: RoomCfg;
  commits: string[];
  reveals: number[];
  salts: string[];
  picks: string[];
  result?: RoomResult;
  rematch?: number;
  /** Clubhouse Cup: average rating in position per unit (pack, halves, centres, back three), -1 = not started. Never the picks. */
  units?: number[];
}
export interface RoomPeer { peer: string; me: boolean; p: Presence; updatedAt: number }

type Json = unknown;
interface RawPeer { peer: string; isMe: boolean; sameTab: boolean; presence: Readonly<Record<string, Json>>; updatedAt: number }
interface RoomNs {
  presence(patch: Record<string, Json | null>): Promise<void>;
  peers(): readonly RawPeer[];
  onPeers(h: (c: { peers: readonly RawPeer[] }) => void, onError?: (e: { code: string }) => void): () => void;
  connected(): boolean;
  onConnection(h: (c: boolean) => void, onError?: (e: { code: string }) => void): () => void;
}

const str = (x: unknown, max = 64) => (typeof x === 'string' ? x.slice(0, max) : '');
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const arr = <T>(x: unknown, f: (v: unknown) => T, max = 20): T[] => (Array.isArray(x) ? x.slice(0, max).map(f) : []);

export function parsePresence(raw: Readonly<Record<string, Json>>): Presence | null {
  if (raw.app !== 'eraxv' || raw.v !== 1) return null;
  const kind = raw.kind === 'party' || raw.kind === 'shared' || raw.kind === 'coop' ? raw.kind : 'liveduel';
  const cfgRaw = raw.cfg as Record<string, unknown> | undefined;
  const cfg = cfgRaw && typeof cfgRaw === 'object'
    ? { seed: num(cfgRaw.seed) >>> 0, plan: (str(cfgRaw.plan, 12) || 'balanced') as PlanId, ruleset: (cfgRaw.ruleset === 'top14' ? 'top14' : 'intl') as RulesetId, epoch: num(cfgRaw.epoch) }
    : undefined;
  const resRaw = raw.result as Record<string, unknown> | undefined;
  const result = resRaw && typeof resRaw === 'object' ? { pts: num(resRaw.pts), w: num(resRaw.w), d: num(resRaw.d), l: num(resRaw.l), tok: str(resRaw.tok, 700) } : undefined;
  const phase = raw.phase === 'draft' || raw.phase === 'done' ? raw.phase : 'lobby';
  return {
    app: 'eraxv', v: 1, room: str(raw.room, 8), name: cleanDisplayName(str(raw.name, 64)), host: raw.host === true, kind, joinedAt: num(raw.joinedAt), phase,
    epoch: num(raw.epoch), cfg, commits: arr(raw.commits, (v) => str(v, 16)), reveals: arr(raw.reveals, (v) => num(v)), salts: arr(raw.salts, (v) => str(v, 16)),
    picks: arr(raw.picks, (v) => str(v, 80)), result, rematch: raw.rematch === undefined ? undefined : num(raw.rematch),
    units: Array.isArray(raw.units) ? arr(raw.units, (v) => Math.max(-1, Math.min(99, Math.round(num(v)))), 4) : undefined,
  };
}

export class RoomClient {
  private ns: RoomNs;
  private listeners = new Set<() => void>();
  private unsub: (() => void)[] = [];
  code = '';
  terminal = false;
  constructor(ns: RoomNs) {
    this.ns = ns;
    this.unsub.push(ns.onPeers(() => this.emit(), () => { this.terminal = true; this.emit(); }));
    this.unsub.push(ns.onConnection(() => this.emit(), () => { this.terminal = true; this.emit(); }));
  }
  private emit() { this.listeners.forEach((l) => l()); }
  subscribe(l: () => void) { this.listeners.add(l); return () => this.listeners.delete(l); }
  connected() { return !this.terminal && this.ns.connected(); }
  join(code: string) { this.code = code; }
  /** presence patches must be plain JSON: `undefined` becomes `null` (which removes the field) */
  set(patch: Partial<Presence>) {
    const clean: Record<string, Json | null> = {};
    for (const [k, v] of Object.entries(patch)) clean[k] = v === undefined ? null : (JSON.parse(JSON.stringify(v)) as Json);
    return this.ns.presence(clean).catch(() => undefined);
  }
  leave() { return this.ns.presence({ app: null, room: null, phase: null, result: null }).catch(() => undefined); }
  /** everyone in this room code, oldest first */
  peers(): RoomPeer[] {
    const out: RoomPeer[] = [];
    for (const r of this.ns.peers()) {
      if (!r.isMe && r.presence.room !== this.code) continue;
      const p = parsePresence(r.presence);
      if (!p || p.room !== this.code) continue;
      if (r.isMe && !r.sameTab) continue;
      out.push({ peer: r.peer, me: r.isMe && r.sameTab, p, updatedAt: r.updatedAt });
    }
    return out.sort((a, b) => a.p.joinedAt - b.p.joinedAt || a.peer.localeCompare(b.peer));
  }
  /** rooms somebody is hosting right now (to catch code clashes) */
  codeInUse(code: string): boolean { return this.ns.peers().some((r) => !r.isMe && r.presence.room === code && r.presence.host === true); }
  dispose() { this.unsub.forEach((u) => u()); this.listeners.clear(); }
}

let pending: Promise<RoomClient | null> | null = null;
export function connectRoom(): Promise<RoomClient | null> {
  if (pending) return pending;
  pending = (async () => {
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } };
    if (!w.claude?.use) return null;
    try {
      const ns = (await w.claude.use('room')) as RoomNs | null;
      return ns ? new RoomClient(ns) : null;
    } catch { return null; }
  })();
  return pending;
}

const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
const KIND_CHAR: Record<RoomKind, string> = { liveduel: 'd', party: 'p', shared: 's', coop: 'c' };
/** five characters; the first one tells a joiner which kind of room it is */
export function newRoomCode(kind: RoomKind = 'liveduel'): string {
  let s = KIND_CHAR[kind];
  const a = new Uint32Array(4);
  try { crypto.getRandomValues(a); } catch { for (let i = 0; i < 4; i++) a[i] = Math.floor(Math.random() * 1e9); }
  for (let i = 0; i < 4; i++) s += CODE_CHARS[a[i] % CODE_CHARS.length];
  return s;
}
export function kindOfCode(code: string): RoomKind {
  return code[0] === 'p' ? 'party' : code[0] === 's' ? 'shared' : code[0] === 'c' ? 'coop' : 'liveduel';
}
export function newSalt(): string {
  const a = new Uint32Array(2);
  try { crypto.getRandomValues(a); } catch { a[0] = Math.random() * 1e9; a[1] = Math.random() * 1e9; }
  return a[0].toString(36) + a[1].toString(36);
}
