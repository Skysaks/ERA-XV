/**
 * Unfinished game, saved on every step so a reload (Safari discarding the tab, a call, a lost connection) loses nothing.
 * What is saved is the minimum to rebuild the game exactly: the draw config, the picks, the reroll, the stage, the
 * placement and plan once the draft is done, the challenge being answered, and the version stamp.
 */
import {
  CURRENT_VERSIONS, MODES, PLANS, ROUNDS, decodeChallenge, lineupIsLegal, replay, reroll, sameVersions, type Lineup, type PlanId,
} from '../engine/index';
import type { Session } from './game';
import { loadResume, saveResume, type Resume } from './store';

export type Stage = 'draft' | 'sheet' | 'plan';

export function snapshot(s: Session, stage: Stage, challengeToken?: string): Resume {
  return {
    v: 2, cfg: s.state.cfg, picks: s.state.picks, rerollRound: s.state.rerollRound, savedAt: Date.now(), daily: s.daily, official: s.official,
    stage, lineup: stage === 'draft' ? undefined : s.lineup, plan: s.plan, challenge: challengeToken ?? s.challengeToken, intent: s.intent, versions: { ...CURRENT_VERSIONS },
  };
}

/** Save, or clear when there is nothing worth resuming. Practice replays and reopened games are never saved. */
export function persist(s: Session | null, stage: Stage, allowed: boolean) {
  if (!s || s.practice || s.reopened || s.live) { saveResume(null); return; }
  // an official Daily is always kept: leaving must not cost the day's only official attempt
  if (!allowed && !(s.daily && s.official)) { saveResume(null); return; }
  if (stage === 'draft' && s.state.round === 0) { saveResume(null); return; }
  saveResume(snapshot(s, stage));
}

export type Restored = { ok: true; session: Session; stage: Stage; round: number } | { ok: false; reason: 'none' | 'corrupt' | 'outdated' };

const isStr = (x: unknown): x is string => typeof x === 'string';
function wellFormed(r: Resume): boolean {
  const c = r?.cfg;
  return !!c && typeof c.seed === 'number' && isStr(c.mode) && c.mode in MODES && PLANS.includes(c.plan) && (c.ruleset === 'intl' || c.ruleset === 'top14')
    && Array.isArray(r.picks) && r.picks.length <= ROUNDS && r.picks.every(isStr) && typeof r.rerollRound === 'number';
}

export function restore(r: Resume | null = loadResume()): Restored {
  if (!r) return { ok: false, reason: 'none' };
  if (!wellFormed(r)) return { ok: false, reason: 'corrupt' };
  if (r.versions && !sameVersions(r.versions)) return { ok: false, reason: 'outdated' };
  const rep = replay(r.cfg, r.picks, r.rerollRound);
  if (!rep.ok || !rep.state) return { ok: false, reason: r.versions ? 'corrupt' : 'outdated' };
  let state = rep.state;
  // replay applies a reroll only when a pick follows it: re-apply one made on the current round
  if (r.rerollRound === r.picks.length && state.round < ROUNDS) state = reroll(state);
  const done = state.round >= ROUNDS;
  const stage: Stage = done ? (r.stage === 'plan' ? 'plan' : 'sheet') : 'draft';
  const lineup: Lineup = done && r.lineup && lineupIsLegal(state.picks, r.lineup as Lineup) ? (r.lineup as Lineup) : state.lineup;
  const plan: PlanId = r.plan && PLANS.includes(r.plan) ? r.plan : r.cfg.plan;
  const session: Session = { state, lineup, plan, daily: r.daily, official: r.official, intent: r.intent };
  if (r.challenge) {
    const d = decodeChallenge(r.challenge);
    if (d.ok) { session.challenge = d.t; session.challengeToken = r.challenge; }
  }
  return { ok: true, session, stage, round: state.round };
}

/** What the home card says about the saved game, without rebuilding it. */
export function describe(r: Resume | null = loadResume()): { round: number; stage: Stage; mode: string; daily?: string; official?: boolean; challenge: boolean } | null {
  if (!r || !wellFormed(r)) return null;
  const stage: Stage = r.picks.length >= ROUNDS ? (r.stage === 'plan' ? 'plan' : 'sheet') : 'draft';
  return { round: Math.min(r.picks.length + 1, ROUNDS), stage, mode: r.cfg.mode, daily: r.daily, official: r.official, challenge: !!r.challenge };
}
