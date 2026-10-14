/**
 * Official result validation: everything a result claims is recomputed from what the link carries
 * (seed, mode, picks, placement, plan) with the same pure engine. Nothing here trusts a score sent by a client,
 * and nothing depends on the browser: a server can run this module unchanged (Node) to accept a result
 * into a leaderboard.
 */
import { decodeChallenge, DATA_VERSION, type ChallengeToken, type DecodeError } from './challenge';
import { ENGINE_VERSION, ROUNDS, replay, type DraftConfig } from './draft';
import { MODES, type ModeId } from './modes';
import { SLOTS, type RulesetId } from './rugby';
import { hashStr } from './rng';
import { byKey, runGauntlet, sideFromProfile, simulateSeason, type GauntletRun, type Season } from './season';
import { teamProfile, type Lineup, type TeamProfile } from './team';

/** Scoring and bonus model (season.ts). Bump when a change alters points for the same XV and seed. */
export const RULES_VERSION = 1;
/** Pools, themes and featured challenges definitions (modes.ts, featured.ts). Bump when the same seed would draw differently. */
export const MODES_VERSION = 1;

export interface VersionStamp { engine: number; data: number; rules: number; modes: number }
export const CURRENT_VERSIONS: VersionStamp = { engine: ENGINE_VERSION, data: DATA_VERSION, rules: RULES_VERSION, modes: MODES_VERSION };
export const sameVersions = (v: Partial<VersionStamp> | undefined): boolean =>
  !!v && v.engine === ENGINE_VERSION && v.data === DATA_VERSION && (v.rules ?? 1) === RULES_VERSION && (v.modes ?? 1) === MODES_VERSION;

/** The same 15 draws: mode + seed + parameter (the offers) and the ruleset (the season). The plan is a player choice. */
export interface DrawSpec { mode: ModeId; seed: number; param?: string; ruleset: RulesetId }
export const drawOf = (cfg: DraftConfig | DrawSpec): DrawSpec => ({ mode: cfg.mode, seed: cfg.seed >>> 0, param: cfg.param || undefined, ruleset: cfg.ruleset });
export function drawId(d: DrawSpec): string {
  return hashStr(`${d.mode}|${d.seed >>> 0}|${d.param ?? ''}|${d.ruleset}`).toString(36).padStart(7, '0').slice(-7);
}
export const sameDraw = (a: DrawSpec, b: DrawSpec) => drawId(drawOf(a)) === drawId(drawOf(b));

/** A finished lineup is exactly the 15 picks, one per shirt: no player twice, nobody left out. */
export function lineupIsLegal(picks: string[], lineup: Lineup): boolean {
  if (picks.length !== ROUNDS || new Set(picks).size !== ROUNDS) return false;
  const placed = SLOTS.map((s) => lineup[s.n]);
  if (placed.some((k) => !k)) return false;
  if (new Set(placed).size !== ROUNDS) return false;
  return placed.every((k) => picks.includes(k!));
}

export type VerifyError = DecodeError | 'replay' | 'lineup' | 'score_mismatch' | 'wrong_draw';
export interface VerifiedGame {
  t: ChallengeToken;
  prof: TeamProfile;
  season?: Season;
  gauntlet?: GauntletRun;
  /** recomputed, never read from the link */
  points: number;
  max: number;
}
export type Verification = { ok: true; game: VerifiedGame } | { ok: false; error: VerifyError };

/**
 * Replays the draft on its seed (every pick must have been offered), checks the placement, recomputes the season.
 * `expect` pins the draw (e.g. today's Daily). `exclude` is the shared-pool exclusion list of live rooms.
 */
export function verifyGame(t: ChallengeToken, opts: { expect?: DrawSpec; exclude?: string[]; lenientReplay?: boolean } = {}): Verification {
  if (opts.expect && !sameDraw(drawOf(t.cfg), opts.expect)) return { ok: false, error: 'wrong_draw' };
  const rep = replay(t.cfg, t.picks, t.rerollRound, opts.exclude);
  if (!rep.ok && !opts.lenientReplay) return { ok: false, error: 'replay' };
  if (!lineupIsLegal(t.picks, t.lineup)) return { ok: false, error: 'lineup' };
  const prof = teamProfile(t.lineup, byKey, t.cfg.plan);
  const side = sideFromProfile('them', t.name || 'them', prof);
  if (MODES[t.cfg.mode]?.gauntlet) {
    const g = runGauntlet(side, t.cfg.seed);
    if (g.beaten !== t.points) return { ok: false, error: 'score_mismatch' };
    return { ok: true, game: { t, prof, gauntlet: g, points: g.beaten, max: g.max } };
  }
  const season = simulateSeason(side, t.cfg.seed, t.cfg.ruleset);
  if (season.points !== t.points) return { ok: false, error: 'score_mismatch' };
  return { ok: true, game: { t, prof, season, points: season.points, max: season.max } };
}

export function verifyToken(token: string, opts: { expect?: DrawSpec; exclude?: string[]; lenientReplay?: boolean } = {}): Verification {
  const d = decodeChallenge(token.trim());
  if (!d.ok) return { ok: false, error: d.error };
  return verifyGame(d.t, opts);
}

/** What a server would store for an official entry: only derived, verifiable facts plus the pseudonym. */
export interface OfficialEntry { drawId: string; token: string; name: string; points: number; position?: number; fit: number; versions: VersionStamp }
export function officialEntry(token: string, expect?: DrawSpec): { ok: true; entry: OfficialEntry } | { ok: false; error: VerifyError } {
  const v = verifyToken(token, { expect });
  if (!v.ok) return v;
  const g = v.game;
  return {
    ok: true,
    entry: { drawId: drawId(drawOf(g.t.cfg)), token, name: g.t.name.slice(0, 24), points: g.points, position: g.season?.position, fit: g.prof.fit, versions: CURRENT_VERSIONS },
  };
}
