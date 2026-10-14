/**
 * Game history: versioned records, migration of older ones, and reopening any past game from its own link.
 */
import {
  CURRENT_VERSIONS, DATA_VERSION, MODES, decodeChallenge, drawId, drawOf, replay, runGauntlet, sideFromProfile, simulateSeason, teamProfile, byKey,
  type ChallengeToken,
} from '../engine/index';
import type { GameResult, Session } from './game';
import { loadLogs, loadPassport, saveLogs, savePassport, type GameLog } from './store';

/** Cheap part of the v1 → v2 migration: stamps, kind, draw id. Runs on every load, saves only if something changed. */
export function loadGames(): GameLog[] {
  const logs = loadLogs();
  let changed = false;
  for (const l of logs) {
    if (l.v === 2) continue;
    changed = true;
    const d = decodeChallenge(l.token);
    l.v = 2;
    l.versions = { engine: 1, data: d.ok ? DATA_VERSION : 0, rules: 1, modes: 1 };
    l.kind = l.daily ? 'daily' : l.mode === 'weekly' ? 'weekly' : 'solo';
    l.drawId = drawId(drawOf({ mode: l.mode, seed: l.seed, param: l.param, ruleset: l.ruleset }));
  }
  if (changed) saveLogs(logs);
  return logs;
}

export const needsBackfill = (logs: GameLog[]) => logs.some((l) => l.gauntlet === undefined && l.pos === undefined && decodeChallenge(l.token).ok);

/**
 * Expensive part, only when the profile needs it: season position and bonus of older games, and the versions met
 * in them (player vs version). Runs in small batches so the page stays responsive.
 */
export function backfill(onProgress: (done: number, total: number) => void): () => void {
  let stop = false;
  const logs = loadGames();
  const todo = logs.filter((l) => l.gauntlet === undefined && l.pos === undefined);
  const pp = loadPassport();
  const fillVersions = Object.keys(pp.versions).length === 0;
  let i = 0;
  const step = () => {
    if (stop) return;
    const end = Math.min(todo.length, i + 6);
    for (; i < end; i++) {
      const l = todo[i];
      const d = decodeChallenge(l.token);
      if (!d.ok) { l.pos = 0; continue; } // 0 = unknown (older data version)
      const prof = teamProfile(d.t.lineup, byKey, d.t.cfg.plan);
      const s = simulateSeason(sideFromProfile('you', 'x', prof), d.t.cfg.seed, d.t.cfg.ruleset);
      Object.assign(l, { pos: s.position, tb: s.tb, lb: s.lb, pf: s.pf, pa: s.pa, tf: s.tf });
      if (fillVersions) {
        const rep = replay(d.t.cfg, d.t.picks, d.t.rerollRound);
        rep.state?.history.forEach((o, r) => o.options.forEach((k) => {
          const e = pp.versions[k] ?? [0, 0];
          e[0]++; if (k === d.t.picks[r]) e[1]++;
          pp.versions[k] = e;
        }));
      }
    }
    onProgress(i, todo.length);
    if (i < todo.length) setTimeout(step, 16);
    else {
      const all = loadLogs();
      const byId = new Map(todo.map((l) => [l.id, l]));
      saveLogs(all.map((l) => byId.get(l.id) ?? l));
      if (fillVersions) savePassport(pp);
    }
  };
  setTimeout(step, 0);
  return () => { stop = true; };
}

/** Rebuild a result screen from a stored game (its link carries the draw, the picks, the placement and the plan). */
export function resultFromToken(token: string, extra: Partial<Session> = {}, id = `re-${Date.now().toString(36)}`): GameResult | null {
  const d = decodeChallenge(token);
  if (!d.ok) return null;
  return resultFromChallenge(d.t, token, extra, id);
}
export function resultFromChallenge(t: ChallengeToken, token: string, extra: Partial<Session> = {}, id = `re-${Date.now().toString(36)}`): GameResult | null {
  const rep = replay(t.cfg, t.picks, t.rerollRound);
  if (!rep.ok || !rep.state) return null;
  const prof = teamProfile(t.lineup, byKey, t.cfg.plan);
  const side = sideFromProfile('you', 'ERA XV', prof);
  const session: Session = { state: rep.state, lineup: t.lineup, plan: t.cfg.plan, reopened: true, ...extra };
  if (MODES[t.cfg.mode].gauntlet) {
    const g = runGauntlet(side, t.cfg.seed);
    return { id, session, prof, gauntlet: g, points: g.beaten, max: g.max, token, prevBest: 0, isNewBest: false, modeBest: false, unlocked: [] };
  }
  const season = simulateSeason(side, t.cfg.seed, t.cfg.ruleset);
  return { id, session, prof, season, points: season.points, max: season.max, token, prevBest: 0, isNewBest: false, modeBest: false, unlocked: [] };
}

export const versionsNow = () => ({ ...CURRENT_VERSIONS });
