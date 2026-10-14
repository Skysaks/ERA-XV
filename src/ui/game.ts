import { PLAYER_BY_KEY, TEAM_BY_ID } from '../data/index';
import {
  CURRENT_VERSIONS, ENGINE_VERSION, MAX_POINTS, MODES, byKey, dailySeed, drawId, drawOf, encodeChallenge, freshSeed, randomParam, runGauntlet, sideFromProfile,
  simulateSeason, teamProfile, unitRatings, weeklyFor, weeklySeed,
  type ChallengeToken, type DraftConfig, type DraftState, type GauntletRun, type Lineup, type ModeId, type PlanId, type RulesetId, type Season, type TeamProfile,
} from '../engine/index';
import { loadLogs, loadPassport, loadRecords, saveLogs, savePassport, saveRecords, type GameLog, type Records } from './store';
import { recordOfficial, recordPractice } from './daily';
import { recordPlayed } from './challenges';
import { gameTrophies, historyTrophies, unlock, type TrophyId } from './trophies';
import { timed, track } from './analytics';

export const P = (k: string) => PLAYER_BY_KEY.get(k)!;

export function makeConfig(mode: ModeId, plan: PlanId, ruleset: RulesetId, param?: string, seed?: number): DraftConfig {
  const now = new Date();
  const s = seed ?? (mode === 'daily' ? dailySeed(now) : mode === 'weekly' ? weeklySeed(now) : freshSeed());
  let p = param;
  if (mode === 'weekly' && !p) p = weeklyFor(now).id;
  if (MODES[mode].param && !p) p = randomParam(mode, s);
  return { seed: s, mode, plan, ruleset, param: p, engine: ENGINE_VERSION };
}
export const todayKey = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

export interface Session {
  state: DraftState;
  lineup: Lineup;
  plan: PlanId;
  /** a received challenge being played */
  challenge?: ChallengeToken;
  /** its link, as received (to attach my answer to it) */
  challengeToken?: string;
  daily?: string;
  official?: boolean;
  /** replay from a turning point: never recorded */
  practice?: boolean;
  /** a past game reopened from the history: never recorded again */
  reopened?: boolean;
  /** live room context label */
  live?: 'liveduel' | 'party' | 'shared' | 'coop' | 'practice';
  /** started from "Challenge a friend": the share sheet opens on the result */
  intent?: 'challenge';
}

export interface GameResult {
  id: string;
  session: Session;
  prof: TeamProfile;
  season?: Season;
  gauntlet?: GauntletRun;
  points: number;
  max: number;
  token: string;
  prevBest: number;
  isNewBest: boolean;
  modeBest: boolean;
  unlocked: string[];
  discover?: { kind: 'era' | 'nation'; label: string };
  /** players met for the first time in this draft (offered, not only drafted) */
  newPlayers?: number;
}

export function playSeason(s: Session): { prof: TeamProfile; season?: Season; gauntlet?: GauntletRun; points: number; max: number } {
  const prof = teamProfile(s.lineup, byKey, s.plan);
  const side = sideFromProfile('you', 'ERA XV', prof);
  if (MODES[s.state.cfg.mode].gauntlet) {
    const g = timed('gauntlet', () => runGauntlet(side, s.state.cfg.seed));
    return { prof, gauntlet: g, points: g.beaten, max: g.max };
  }
  const season = timed('season', () => simulateSeason(side, s.state.cfg.seed, s.state.cfg.ruleset));
  return { prof, season, points: season.points, max: MAX_POINTS };
}

export function tokenFor(s: Session, points: number, wins: number, name: string, rematch = false): string {
  const cfg = { ...s.state.cfg, plan: s.plan };
  const mode = MODES[cfg.mode].live ? 'classic' : cfg.mode;
  return encodeChallenge({ cfg: { ...cfg, mode }, picks: s.state.picks, rerollRound: s.state.rerollRound, lineup: s.lineup, points, wins, name, rematch });
}

export const kindOf = (s: Session): NonNullable<GameLog['kind']> =>
  s.practice ? 'practice' : s.live ? 'room' : s.challenge ? 'challenge' : s.daily ? 'daily' : s.state.cfg.mode === 'weekly' ? 'weekly' : 'solo';

/** Records, logs, passport, Daily, challenges and trophies (skipped for practice replays and reopened games). */
export function finishGame(s: Session, name: string): GameResult {
  const { prof, season, gauntlet, points, max } = playSeason(s);
  const rec = loadRecords();
  const prevBest = rec.best;
  const token = tokenFor(s, points, season?.w ?? gauntlet?.beaten ?? 0, name);
  const mode = s.state.cfg.mode;
  let discover: GameResult['discover'];
  const res: GameResult = {
    id: `${Date.now().toString(36)}${s.state.cfg.seed.toString(36)}`,
    session: s, prof, season, gauntlet, points, max, token, prevBest,
    isNewBest: false, modeBest: false, unlocked: [],
  };
  track('season_completed', { mode, plan: s.plan, kind: kindOf(s), pts: points, pos: season?.position, fit: prof.fit, official: !!s.official });
  if (season && season.position <= 6) track('playoffs_reached', { mode, pos: season.position });
  if (season?.finish === 'champion') track('champion', { mode, plan: s.plan });
  if (s.practice || s.reopened) return res;

  // records
  if (season) {
    rec.games++; rec.sum += points;
    if (points > rec.best) { res.isNewBest = rec.games > 1; rec.best = points; }
    if (points >= 100) rec.hundreds++;
    if (season.l === 0) rec.unbeaten++;
    if (season.finish === 'champion') rec.titles++;
  }
  const prevMode = rec.byMode[mode];
  if (prevMode === undefined || points > prevMode) { res.modeBest = prevMode !== undefined; rec.byMode[mode] = points; }
  rec.bestRatings = {
    fit: Math.max(rec.bestRatings.fit, prof.fit), pack: Math.max(rec.bestRatings.pack, prof.pack),
    backs: Math.max(rec.bestRatings.backs, prof.backs), def: Math.max(rec.bestRatings.def, prof.def),
  };
  saveRecords(rec);

  // Daily: one official result per day, practice kept apart
  if (s.daily) {
    if (s.official) {
      recordOfficial({ day: s.daily, pts: points, pos: season?.position, w: season?.w, d: season?.d, l: season?.l, fit: prof.fit, plan: s.plan, token, at: Date.now() });
      track('daily_completed', { pts: points, pos: season?.position, official: true });
    } else {
      recordPractice(s.daily, points);
      track('daily_completed', { pts: points, official: false });
    }
  }
  // answered challenge
  if (s.challengeToken) {
    recordPlayed(s.challengeToken, token);
    track('challenge_completed', { won: points > (s.challenge?.points ?? 0), daily: !!s.daily });
  }

  // passport: players (person) and versions met / drafted / passed, teams, nations, eras
  const pp = loadPassport();
  const firstGame = pp.teams.length === 0;
  const newEras: string[] = [], newNats: string[] = [];
  let newPlayers = 0;
  s.state.history.forEach((offer, r) => {
    const tm = TEAM_BY_ID.get(offer.team)!;
    if (!pp.teams.includes(tm.id)) pp.teams.push(tm.id);
    if (!pp.eras.includes(tm.bucket)) { pp.eras.push(tm.bucket); newEras.push(tm.bucket); }
    for (const k of offer.options) {
      const p = P(k);
      const drafted = k === s.state.picks[r];
      const e = pp.players[p.person];
      if (!e) newPlayers++;
      const pe = e ?? [0, 0, 0];
      pe[0]++;
      if (drafted) pe[1]++; else pe[2]++;
      pp.players[p.person] = pe;
      const ve = pp.versions[k] ?? [0, 0];
      ve[0]++; if (drafted) ve[1]++;
      pp.versions[k] = ve;
      if (!pp.nats.includes(p.nat)) { pp.nats.push(p.nat); newNats.push(p.nat); }
    }
  });
  savePassport(pp);
  if (!firstGame) {
    if (newEras.length) discover = { kind: 'era', label: newEras[0] };
    else if (newNats.length) discover = { kind: 'nation', label: newNats[0] };
  }
  res.discover = discover;
  res.newPlayers = newPlayers;

  // history (v2: versioned and reproducible)
  const hidden = !!MODES[mode].hideRatings;
  const units = unitRatings(s.lineup, byKey);
  const tookTop = s.state.history.filter((o, r) => P(s.state.picks[r]).rating === Math.max(...o.options.map((k) => P(k).rating))).length;
  const log: GameLog = {
    id: res.id, date: Date.now(), mode, plan: s.plan, ruleset: s.state.cfg.ruleset, pts: points, w: season?.w ?? gauntlet?.beaten ?? 0, d: season?.d ?? 0, l: season?.l ?? 0,
    fit: prof.fit, ovr: prof.ovr, pack: prof.pack, backs: prof.backs, def: prof.def, boot: prof.boot, attack: prof.dims.strike,
    token, finish: season?.finish, gauntlet: gauntlet?.beaten, hidden, rerolled: s.state.rerollRound >= 0, daily: s.daily, official: s.official,
    picks: s.state.picks, oop: prof.oop.length, tookTop, seed: s.state.cfg.seed, param: s.state.cfg.param,
    v: 2, versions: { ...CURRENT_VERSIONS }, kind: kindOf(s), drawId: drawId(drawOf(s.state.cfg)),
    challengeId: s.challenge ? drawId(drawOf(s.challenge.cfg)) : undefined,
    pos: season?.position, tb: season?.tb, lb: season?.lb, pf: season?.pf, pa: season?.pa, tf: season?.tf,
    halves: units.halves ?? undefined, centres: units.centres ?? undefined, back3: units.back3 ?? undefined,
  };
  const logs = loadLogs();
  logs.push(log);
  saveLogs(logs);

  // trophies: this season, then what the history now adds up to
  const fresh = unlock([...gameTrophies({ season, gauntlet, prof, plan: s.plan, hidden, points }), ...historyTrophies()]);
  res.unlocked = fresh;
  fresh.forEach((id: TrophyId) => track('achievement_unlocked', { id }));
  return res;
}

export function records(): Records { return loadRecords(); }
