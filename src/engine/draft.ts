import { TEAM_BY_ID, VERSIONS, PLAYER_BY_KEY, type PlayerEra, type TeamEra } from '../data/index';
import { SLOTS, famKind, FAM_FACTOR, isInPosition, type PlanId, type RulesetId, type Pos } from './rugby';
import { MODES, poolFor, themeExcludedPersons, type ModeId } from './modes';
import { Rng, u01 } from './rng';
import { emptyLineup, place, type Lineup } from './team';

/** Bump when anything that changes draws, offers or the season model changes: old challenges stay replayable only on their own engine. */
export const ENGINE_VERSION = 1;
export const ROUNDS = 15;

export interface DraftConfig { seed: number; mode: ModeId; plan: PlanId; ruleset: RulesetId; param?: string; engine: number }
export interface Offer { round: number; team: string; options: string[]; tailored: number; shirt?: number }
export interface DraftState {
  cfg: DraftConfig;
  seq: string[];
  alt: string[];
  round: number;
  picks: string[];
  rerollRound: number;
  lineup: Lineup;
  offer: Offer | null;
  history: Offer[];
  exclude: string[];
}

const P = (k: string) => PLAYER_BY_KEY.get(k)!;
const nVersions = (person: string) => VERSIONS.get(person)?.length ?? 1;

/* ------------------------------------------------------------ sequence */

export function sequence(cfg: DraftConfig): { seq: string[]; alt: string[] } {
  const spec = poolFor(cfg.mode, cfg.param);
  const teams = spec.teams.slice().sort((a, b) => a.id.localeCompare(b.id));
  const rng = new Rng(`seq:${cfg.seed}:${cfg.mode}:${cfg.param ?? ''}`);
  const seq: string[] = [];
  const alt: string[] = [];
  if (spec.distinctTeamKey) {
    const keys = rng.shuffle([...new Set(teams.map((t) => t.team))].sort());
    const eraOf = (k: string) => rng.pick(teams.filter((t) => t.team === k)).id;
    const chosen = keys.slice(0, ROUNDS);
    const spare = keys.slice(ROUNDS);
    for (const k of chosen) seq.push(eraOf(k));
    for (let r = 0; r < ROUNDS; r++) alt.push(spare.length ? eraOf(spare[r % spare.length]) : altSameKey(teams, seq[r], rng));
    while (seq.length < ROUNDS) seq.push(rng.pick(teams).id); // fewer than 15 nations: repeat (never happens with the shipped data)
    return { seq, alt };
  }
  const allowRepeats = spec.allowRepeats || teams.length < ROUNDS + 1;
  if (!allowRepeats) {
    const order = rng.shuffle(teams);
    const perKey = new Map<string, number>();
    let rest: TeamEra[] = [];
    // at most two eras of the same team; relaxed only when the pool is too narrow (e.g. French rugby only)
    for (const cap of [2, 3, 99]) {
      rest = [];
      for (const t of order) {
        if (seq.includes(t.id)) continue;
        const c = perKey.get(t.team) ?? 0;
        if (seq.length < ROUNDS && c < cap) { seq.push(t.id); perKey.set(t.team, c + 1); } else rest.push(t);
      }
      if (seq.length >= ROUNDS) break;
    }
    // alternates: never already in the draft, still at most 2 eras of a team including the one being replaced
    for (let r = 0; r < ROUNDS; r++) {
      const replaced = TEAM_BY_ID.get(seq[r])!;
      const cand = rest.find((t, i) => {
        const c = (perKey.get(t.team) ?? 0) - (t.team === replaced.team ? 1 : 0);
        return c < 2 && !alt.includes(t.id) && i >= 0;
      }) ?? rest[r % Math.max(1, rest.length)] ?? teams[(r + 1) % teams.length];
      alt.push(cand.id);
    }
    return { seq, alt };
  }
  // small pools: cycle through shuffled eras, never the same era twice in a row
  let bag: TeamEra[] = [];
  while (seq.length < ROUNDS) {
    if (!bag.length) bag = rng.shuffle(teams);
    const next = bag.shift()!;
    if (seq.length && seq[seq.length - 1] === next.id && teams.length > 1) { bag.push(next); continue; }
    seq.push(next.id);
  }
  for (let r = 0; r < ROUNDS; r++) alt.push(altSameKey(teams, seq[r], rng));
  return { seq, alt };
}
function altSameKey(teams: TeamEra[], id: string, rng: Rng): string {
  const others = teams.filter((t) => t.id !== id);
  return others.length ? rng.pick(others).id : id;
}

/* -------------------------------------------------------------- offers */

/** Can every drafted player still play in position (natural or listed) at the same time? */
export function canStayInPosition(players: PlayerEra[]): boolean {
  const slotOf = new Array(16).fill(-1);
  const tryAssign = (i: number, seen: boolean[]): boolean => {
    for (const s of SLOTS) {
      if (seen[s.n] || !isInPosition(famKind(players[i].pos, s.pos))) continue;
      seen[s.n] = true;
      if (slotOf[s.n] === -1 || tryAssign(slotOf[s.n], seen)) { slotOf[s.n] = i; return true; }
    }
    return false;
  };
  for (let i = 0; i < players.length; i++) if (!tryAssign(i, new Array(16).fill(false))) return false;
  return true;
}

const wStd = (p: PlayerEra) => (1 + (p.rating - 78) / 12) / nVersions(p.person);
const wStar = (p: PlayerEra) => Math.exp((p.rating - 86) / 2.2) / Math.sqrt(nVersions(p.person));

export function positionOrder(seed: number): number[] {
  return new Rng(`shirts:${seed}`).shuffle(SLOTS.map((s) => s.n));
}

export function makeOffer(state: Pick<DraftState, 'cfg' | 'picks' | 'exclude' | 'lineup'>, round: number, teamId: string): Offer {
  const { cfg } = state;
  const mode = MODES[cfg.mode];
  const t = TEAM_BY_ID.get(teamId)!;
  const drafted = state.picks.map(P);
  const taken = new Set([...drafted.map((p) => p.person), ...state.exclude, ...themeExcludedPersons(cfg.mode === 'weekly' || cfg.mode === 'theme' ? cfg.param : undefined)]);
  let roster = t.players.filter((p) => !taken.has(p.person) && (!mode.maxRating || p.rating <= mode.maxRating));
  if (roster.length < 4) roster = [...roster, ...t.players.filter((p) => !taken.has(p.person) && !roster.includes(p))];
  const key = (p: PlayerEra, salt: string, w: number) => -Math.log(Math.max(1e-12, u01(cfg.seed, 'offer', salt, round, teamId, p.person))) / w;
  const std = new Map(roster.map((p) => [p.key, key(p, 's', wStd(p))]));
  const byStd = roster.slice().sort((a, b) => std.get(a.key)! - std.get(b.key)! || a.key.localeCompare(b.key));

  if (mode.positionDraft) {
    const shirt = positionOrder(cfg.seed)[round];
    const pos = SLOTS.find((s) => s.n === shirt)!.pos;
    const tier = (p: PlayerEra) => FAM_FACTOR[famKind(p.pos, pos)];
    const ranked = byStd.slice().sort((a, b) => tier(b) - tier(a) || std.get(a.key)! - std.get(b.key)!);
    const opts = ranked.slice(0, 4);
    return { round, team: teamId, options: sortOpts(opts), tailored: -1, shirt };
  }

  const star = roster.slice().sort((a, b) => key(a, 'x', wStar(a)) - key(b, 'x', wStar(b)) || a.key.localeCompare(b.key))[0];
  const chosen: PlayerEra[] = [star];
  for (const p of byStd) { if (chosen.length >= 3) break; if (!chosen.includes(p)) chosen.push(p); }
  const canStay0 = canStayInPosition(drafted);
  const ok = (o: PlayerEra) => canStayInPosition([...drafted, o]);
  let tailored = -1;
  let d: PlayerEra | undefined;
  const needTailor = canStay0 && !chosen.some(ok);
  if (canStay0 && (round >= 4 || needTailor)) {
    d = byStd.find((p) => !chosen.includes(p) && ok(p));
    // Cult XV: when no one under the cap fits, the director may reach for the one player who does
    if (!d && needTailor && mode.maxRating) {
      d = t.players.filter((p) => !taken.has(p.person) && !chosen.includes(p) && ok(p)).sort((a, b) => a.rating - b.rating)[0];
    }
    if (d) tailored = 1;
  }
  if (!d) d = byStd.find((p) => !chosen.includes(p));
  if (d) chosen.push(d);
  const opts = sortOpts(chosen);
  return { round, team: teamId, options: opts, tailored: tailored === 1 && d ? opts.indexOf(d.key) : -1 };
}
const sortOpts = (ps: PlayerEra[]) => ps.slice().sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).map((p) => p.key);

/* ---------------------------------------------------------- lifecycle */

export function newDraft(cfg: DraftConfig, exclude: string[] = []): DraftState {
  const { seq, alt } = sequence(cfg);
  const s: DraftState = { cfg, seq, alt, round: 0, picks: [], rerollRound: -1, lineup: emptyLineup(), offer: null, history: [], exclude };
  s.offer = makeOffer(s, 0, seq[0]);
  return s;
}

export function canReroll(s: DraftState): boolean {
  return s.round < ROUNDS && s.rerollRound === -1 && MODES[s.cfg.mode].rerolls > 0;
}

export function reroll(s: DraftState): DraftState {
  if (!canReroll(s)) return s;
  const seq = s.seq.slice();
  seq[s.round] = s.alt[s.round];
  const n: DraftState = { ...s, seq, rerollRound: s.round };
  n.offer = makeOffer(n, s.round, seq[s.round]);
  return n;
}

export function pickOption(s: DraftState, idx: number): DraftState {
  if (!s.offer || s.round >= ROUNDS) return s;
  const key = s.offer.options[idx];
  if (!key) return s;
  const picks = [...s.picks, key];
  let lineup: Lineup;
  if (s.offer.shirt) { lineup = s.lineup.slice(); lineup[s.offer.shirt] = key; }
  else lineup = place(picks.map(P), s.lineup);
  const n: DraftState = { ...s, picks, lineup, round: s.round + 1, history: [...s.history, s.offer], offer: null };
  if (n.round < ROUNDS) n.offer = makeOffer(n, n.round, n.seq[n.round]);
  return n;
}

/** Update the externally excluded persons (shared draft) and refresh the current offer. */
export function withExclusions(s: DraftState, exclude: string[]): DraftState {
  const n = { ...s, exclude };
  if (n.round < ROUNDS) n.offer = makeOffer(n, n.round, n.seq[n.round]);
  return n;
}

export function swapSlots(l: Lineup, a: number, b: number): Lineup {
  const n = l.slice();
  [n[a], n[b]] = [n[b], n[a]];
  return n;
}

export function lineupPlayers(l: Lineup): PlayerEra[] {
  return SLOTS.map((s) => l[s.n]).filter(Boolean).map((k) => P(k!));
}

export interface ReplayResult { ok: boolean; state?: DraftState; reason?: string }
/** Rebuild a finished draft from its picks (challenge links, resume). */
export function replay(cfg: DraftConfig, picks: string[], rerollRound: number, exclude: string[] = []): ReplayResult {
  let s = newDraft(cfg, exclude);
  for (let r = 0; r < picks.length; r++) {
    if (r === rerollRound) s = reroll(s);
    const idx = s.offer?.options.indexOf(picks[r]) ?? -1;
    if (idx < 0) return { ok: false, reason: `round ${r + 1}: pick not offered` };
    s = pickOption(s, idx);
  }
  return { ok: true, state: s };
}

export const posOfSlot = (n: number): Pos => SLOTS.find((s) => s.n === n)!.pos;
