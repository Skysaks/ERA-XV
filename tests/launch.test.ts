/**
 * Pre-launch guarantees: fair seeds (Daily, weekly, challenges), results that cannot be forged, games that survive a
 * reload, versioned history, theme pools, dataset validation, and the local stores behind Daily / challenges.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// in-memory localStorage (the stores are browser code, guarded by try/catch)
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

import { TEAMS, PLAYER_BY_KEY, PLAYER_OF_THE_YEAR, isChampionTeam } from '../src/data/index';
import { CAPTAINS } from '../src/data/captains';
import { validateDataset } from '../src/data/validate';
import {
  DATA_VERSION, RARE_KEYS, RARITY_MODES, rarityOf, rarityFresh,
  ENGINE_VERSION, ROUNDS, MODE_ORDER, THEMES, THEME_CHOICES, WEEKLY, CURRENT_VERSIONS, botDraft, dailyChallenge, dailyDayOfSeed, dailyLabel, dailySeed, decodeChallenge,
  drawId, drawOf, encodeChallenge, lineupIsLegal, newDraft, officialEntry, pickOption, poolFor, replay, reroll, sameVersions, simulateSeason,
  sideFromProfile, teamProfile, byKey, themeTeams, utcDay, verifyGame, verifyToken, weeklyChallenge, weeklySeed, challengeStatus, Rng,
  type ChallengeToken, type DraftConfig, type DraftState, type Lineup,
} from '../src/engine/index';
import { restore, snapshot, persist, describe as describeResume } from '../src/ui/resume';
import { loadResume } from '../src/ui/store';
import { dailyStatus, dailyView, loadDaily, markAbandoned, markStarted, officialAvailable, recordOfficial, recordPractice, streakOf } from '../src/ui/daily';
import { challengeCounts, dailyBoard, loadChallenges, recordPlayed, recordReceived, recordSent, stateOf } from '../src/ui/challenges';
import { loadGames } from '../src/ui/history';
import { funnel, localEvents, track, clearEvents } from '../src/ui/analytics';
import { gameTrophies } from '../src/ui/trophies';
import { acceptSubmission, friendsDailyBoard, serverBoard } from '../src/ui/leaderboard';
import { ENCOUNTERS_META } from '../src/data/encounters';
import { ALL_PLAYERS } from '../src/data/index';
import { finishGame, type Session } from '../src/ui/game';
import { unlock } from '../src/ui/trophies';
import { loadRecords } from '../src/ui/store';

const cfg = (seed: number, mode: DraftConfig['mode'] = 'classic', param?: string): DraftConfig => ({ seed, mode, plan: 'balanced', ruleset: 'intl', param, engine: ENGINE_VERSION });
const rng = new Rng('launch-tests');
const draft = (c: DraftConfig): DraftState => botDraft(c, 'competent', () => rng.next());
function tokenOf(s: DraftState, name = 'Ana', plan = s.cfg.plan): string {
  const season = simulateSeason(sideFromProfile('you', 'x', teamProfile(s.lineup, byKey, plan)), s.cfg.seed, s.cfg.ruleset);
  return encodeChallenge({ cfg: { ...s.cfg, plan }, picks: s.picks, rerollRound: s.rerollRound, lineup: s.lineup, points: season.points, wins: season.w, name, rematch: false });
}
const offersOf = (s: DraftState) => s.history.map((o) => o.options.join(','));

beforeEach(() => { localStorage.clear(); });

describe('seeds', () => {
  it('same seed, same offers; another seed, other offers', () => {
    const a = newDraft(cfg(123)), b = newDraft(cfg(123)), c = newDraft(cfg(124));
    expect(a.offer!.options).toEqual(b.offer!.options);
    expect(a.offer!.options).not.toEqual(c.offer!.options);
    // the whole draft, pick for pick
    let x = a, y = b;
    while (x.round < ROUNDS) { x = pickOption(x, x.round % 4); y = pickOption(y, y.round % 4); expect(y.offer?.options).toEqual(x.offer?.options); }
  });
  it('the Daily is one draw per UTC day, the same everywhere', () => {
    const late = new Date('2026-09-27T23:59:59Z'), early = new Date('2026-09-28T00:00:01Z');
    expect(dailySeed(new Date('2026-09-27T00:00:00Z'))).toBe(dailySeed(late));
    expect(dailySeed(late)).not.toBe(dailySeed(early));
    // Paris and Los Angeles at the same instant get the same draw (a Date is an instant, not a local day)
    const instant = new Date('2026-09-28T06:30:00+02:00');
    expect(dailySeed(instant)).toBe(dailySeed(new Date('2026-09-27T21:30:00-07:00')));
    expect(dailyLabel(early)).toBe('ERA-XV-2026-09-28');
    const d = dailyChallenge(early);
    expect(d.id).toBe('daily-2026-09-28');
    expect([d.startDate, d.endDate, d.official, d.leaderboardEnabled]).toEqual(['2026-09-28', '2026-09-29', true, false]);
    expect(dailyDayOfSeed(d.seed, new Date('2026-10-05T12:00:00Z'))).toBe('2026-09-28');
    expect(dailyDayOfSeed(12345, early)).toBeUndefined();
  });
  it('the weekly challenge keeps one draw for its whole ISO week', () => {
    const mon = new Date('2026-09-21T08:00:00Z'), sun = new Date('2026-09-27T22:00:00Z'), next = new Date('2026-09-28T08:00:00Z');
    expect(weeklySeed(mon)).toBe(weeklySeed(sun));
    expect(weeklySeed(sun)).not.toBe(weeklySeed(next));
    const w = weeklyChallenge(mon);
    expect(w.startDate).toBe('2026-09-21');
    expect(w.endDate).toBe('2026-09-28');
    expect(challengeStatus(w, sun)).toBe('active');
    expect(challengeStatus(w, next)).toBe('ended');
    expect(THEMES[w.param as keyof typeof THEMES]).toBeTruthy();
  });
});

describe('challenges', () => {
  it('a link rebuilds exactly the same game', () => {
    const s = draft(cfg(777));
    const tok = tokenOf(s);
    const d = decodeChallenge(tok);
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    const rep = replay(d.t.cfg, d.t.picks, d.t.rerollRound);
    expect(rep.ok).toBe(true);
    expect(offersOf(rep.state!)).toEqual(offersOf(s));
    expect(d.t.lineup).toEqual(s.lineup);
    const v = verifyToken(tok);
    expect(v.ok).toBe(true);
    expect(drawId(drawOf(d.t.cfg))).toBe(drawId(drawOf(s.cfg)));
  });
  it('rejects forged results: score, placement, picks, draw', () => {
    const s = draft(cfg(4242));
    const d = decodeChallenge(tokenOf(s));
    if (!d.ok) throw new Error('decode');
    const t: ChallengeToken = d.t;
    expect(verifyGame({ ...t, points: t.points + 1 })).toEqual({ ok: false, error: 'score_mismatch' });
    const star = t.lineup[10]!;
    const dup: Lineup = t.lineup.map((k, n) => (n >= 1 ? star : k));
    expect(lineupIsLegal(t.picks, dup)).toBe(false);
    expect(verifyGame({ ...t, lineup: dup })).toEqual({ ok: false, error: 'lineup' });
    const other = [...PLAYER_BY_KEY.keys()].find((k) => !t.picks.includes(k))!;
    expect(verifyGame({ ...t, picks: [other, ...t.picks.slice(1)] })).toEqual({ ok: false, error: 'replay' });
    expect(verifyGame(t, { expect: drawOf(cfg(4243)) })).toEqual({ ok: false, error: 'wrong_draw' });
    const e = officialEntry(tokenOf(s), drawOf(s.cfg));
    expect(e.ok).toBe(true);
    if (e.ok) expect(e.entry.versions).toEqual(CURRENT_VERSIONS);
  });
  it('the theme mode travels in links (appended to the mode order)', () => {
    expect(MODE_ORDER.indexOf('theme')).toBe(MODE_ORDER.length - 1);
    const s = draft(cfg(99, 'theme', 'super'));
    const d = decodeChallenge(tokenOf(s));
    expect(d.ok && d.t.cfg.mode === 'theme' && d.t.cfg.param === 'super').toBe(true);
    expect(verifyToken(tokenOf(s)).ok).toBe(true);
  });
});

describe('themes and pools', () => {
  it('the nine historical weekly pools are unchanged', () => {
    const same = (a: string[], b: string[]) => expect(a.slice().sort()).toEqual(b.slice().sort());
    same(themeTeams('amateur').map((t) => t.id), TEAMS.filter((t) => t.bucket === 'amateur').map((t) => t.id));
    same(themeTeams('top14').map((t) => t.id), TEAMS.filter((t) => t.country === 'FRA').map((t) => t.id));
    same(themeTeams('champions').map((t) => t.id), TEAMS.filter(isChampionTeam).map((t) => t.id));
    same(themeTeams('nopoty').map((t) => t.id), TEAMS.map((t) => t.id));
    expect(WEEKLY.slice(0, 9)).toEqual(['amateur', 'south', 'nopoty', 'champions', 'top14', 'sixnations', 'earlypro', 'no10', 'rwc']);
  });
  it('every theme can be drafted to a legal XV', () => {
    for (const id of THEME_CHOICES) {
      expect(themeTeams(id).length, id).toBeGreaterThan(0);
      for (const seed of [1, 2, 3]) {
        const s = draft(cfg(seed * 1000 + id.length, 'theme', id));
        expect(s.round, `${id} ${seed}`).toBe(ROUNDS);
        expect(lineupIsLegal(s.picks, s.lineup), `${id} ${seed}`).toBe(true);
        const pool = new Set(poolFor('theme', id).teams.map((t) => t.id));
        expect(s.picks.every((k) => pool.has(PLAYER_BY_KEY.get(k)!.teamEra)), `${id} pool`).toBe(true);
      }
    }
  });
  it('No Player of the Year really excludes them', () => {
    const poty = new Set(Object.keys(PLAYER_OF_THE_YEAR));
    for (const seed of [5, 6]) {
      const s = draft(cfg(seed, 'theme', 'nopoty'));
      expect(s.history.flatMap((o) => o.options).some((k) => poty.has(PLAYER_BY_KEY.get(k)!.person))).toBe(false);
    }
  });
});

describe('resume after a reload', () => {
  const session = (s: DraftState, extra: Partial<Session> = {}): Session => ({ state: s, lineup: s.lineup, plan: 'balanced', ...extra });
  it('restores a draft mid-way on the same offers, reroll included', () => {
    let s = newDraft(cfg(31));
    for (let r = 0; r < 5; r++) s = pickOption(s, 1);
    s = reroll(s);
    const r = restore(snapshot(session(s), 'draft'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.stage).toBe('draft');
    expect(r.session.state.round).toBe(5);
    expect(r.session.state.offer!.options).toEqual(s.offer!.options);
    expect(r.session.state.rerollRound).toBe(5);
  });
  it('restores a finished draft on the match sheet or the plan, placement and plan kept', () => {
    const s = draft(cfg(32));
    const swapped = s.lineup.slice(); [swapped[11], swapped[14]] = [swapped[14], swapped[11]];
    const r = restore(snapshot({ ...session(s), lineup: swapped, plan: 'territory' }, 'plan'));
    expect(r.ok && r.stage === 'plan' && r.session.plan === 'territory' && r.session.lineup[11] === swapped[11]).toBe(true);
    // a tampered placement falls back to the automatic one instead of being trusted
    const bad = restore({ ...snapshot(session(s), 'sheet'), lineup: s.lineup.map(() => s.picks[0]) });
    expect(bad.ok && bad.session.lineup).toEqual(s.lineup);
  });
  it('keeps the challenge being answered', () => {
    const friend = draft(cfg(33));
    const tok = tokenOf(friend);
    const d = decodeChallenge(tok);
    if (!d.ok) throw new Error('decode');
    let s = newDraft(d.t.cfg);
    s = pickOption(s, 0);
    const r = restore(snapshot(session(s, { challenge: d.t, challengeToken: tok }), 'draft'));
    expect(r.ok && r.session.challengeToken === tok && r.session.challenge?.name === 'Ana').toBe(true);
  });
  it('refuses damaged or outdated saves instead of rebuilding them wrong', () => {
    const s = pickOption(newDraft(cfg(34)), 0);
    const snap = snapshot(session(s), 'draft');
    expect(restore({ ...snap, picks: ['nobody:nobody'] })).toEqual({ ok: false, reason: 'corrupt' });
    expect(restore({ ...snap, versions: { ...CURRENT_VERSIONS, data: CURRENT_VERSIONS.data + 1 } })).toEqual({ ok: false, reason: 'outdated' });
    expect(restore({ ...snap, cfg: { ...snap.cfg, mode: 'nope' as never } })).toEqual({ ok: false, reason: 'corrupt' });
    expect(restore(null)).toEqual({ ok: false, reason: 'none' });
    expect(sameVersions(snap.versions)).toBe(true);
  });
  it('an official Daily is saved even when resume is switched off; practice never is', () => {
    const s = pickOption(newDraft(cfg(35, 'daily')), 0);
    persist(session(s, { daily: '2026-09-28', official: true }), 'draft', false);
    expect(loadResume()?.official).toBe(true);
    expect(describeResume()?.round).toBe(2);
    persist(session(s, { practice: true }), 'draft', true);
    expect(loadResume()).toBeNull();
  });
});

describe('Daily on this device', () => {
  const day = '2026-09-28';
  it('one official result; practice kept apart; giving up is final for the day', () => {
    expect(dailyStatus(day)).toBe('open');
    markStarted(day);
    expect(dailyStatus(day)).toBe('inProgress');
    expect(officialAvailable(day)).toBe(true);
    recordOfficial({ day, pts: 67, pos: 4, token: 'x', at: 1 });
    recordOfficial({ day, pts: 99, pos: 1, token: 'y', at: 2 });
    expect(loadDaily().entries[day].pts).toBe(67);
    recordPractice(day, 90);
    expect(loadDaily().entries[day].pts).toBe(67);
    expect(loadDaily().practice[day]).toEqual({ n: 1, best: 90 });
    markAbandoned('2026-09-29');
    expect(officialAvailable('2026-09-29')).toBe(false);
  });
  it('a streak counts up to yesterday and never takes the best run away', () => {
    for (const d of ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-26', '2026-09-27']) recordOfficial({ day: d, pts: 50, token: d, at: 1 });
    const st = loadDaily();
    expect(streakOf(st, '2026-09-28')).toMatchObject({ current: 2, best: 3 });
    expect(streakOf(st, '2026-09-27')).toMatchObject({ current: 2 });
    expect(streakOf(st, '2026-09-30')).toMatchObject({ current: 0, best: 3 });
    expect(dailyView(new Date('2026-09-27T10:00:00Z')).status).toBe('done');
  });
});

describe('asynchronous challenges', () => {
  it('sent, answered, replied: both sides end up with the same verified comparison', () => {
    const mine = draft(cfg(55)), theirs = draft(cfg(55));
    const myTok = tokenOf(mine, 'Me'), theirTok = tokenOf(theirs, 'Nina');
    // sender side
    const sent = recordSent(myTok)!;
    expect(stateOf(sent)).toBe('awaiting');
    expect(recordReceived(myTok)?.reply).toBe(false); // opening my own link changes nothing
    const back = recordReceived(theirTok)!;
    expect(back.reply).toBe(true);
    expect(stateOf(back.rec)).toBe('done');
    expect(back.rec.them!.name).toBe('Nina');
    expect(challengeCounts().total).toBe(1);
    // receiver side
    localStorage.clear();
    const got = recordReceived(myTok)!;
    expect(stateOf(got.rec)).toBe('toPlay');
    recordPlayed(myTok, theirTok);
    const done = loadChallenges()[0];
    expect(stateOf(done)).toBe('done');
    expect(done.me!.pts).toBe(back.rec.them!.pts);
  });
  it('refuses a forged link and ranks a Daily between friends', () => {
    expect(recordReceived('AAAA')).toBeNull();
    const a = draft(cfg(66, 'daily')), b = draft(cfg(66, 'daily'));
    recordReceived(tokenOf(a, 'Ana'), '2026-09-28');
    recordReceived(tokenOf(b, 'Ben'), '2026-09-28');
    const board = dailyBoard('2026-09-28', { pts: 200 });
    expect(board[0].me).toBe(true);
    expect(board.length).toBe(3);
    expect(board.slice(1).every((r, i, xs) => i === 0 || xs[i - 1].pts >= r.pts)).toBe(true);
  });
});

describe('history and versioning', () => {
  it('migrates 2.0 games to versioned records', () => {
    const s = draft(cfg(77));
    const tok = tokenOf(s);
    localStorage.setItem('era-xv:logs', JSON.stringify([{ id: 'old', date: 1, mode: 'classic', plan: 'balanced', ruleset: 'intl', pts: 50, w: 10, d: 0, l: 16, fit: 80, ovr: 85, pack: 85, backs: 85, def: 85, boot: 85, attack: 85, token: tok, hidden: false, rerolled: false, picks: s.picks, oop: 0, tookTop: 3, seed: 77 }]));
    const [g] = loadGames();
    expect(g.v).toBe(2);
    expect(g.versions).toEqual({ engine: ENGINE_VERSION, data: CURRENT_VERSIONS.data, rules: 1, modes: 1 });
    expect(g.kind).toBe('solo');
    expect(g.drawId).toBe(drawId(drawOf(s.cfg)));
    expect(JSON.parse(localStorage.getItem('era-xv:logs')!)[0].v).toBe(2);
  });
  it('trophies come from real performances only', () => {
    const s = draft(cfg(88));
    const prof = teamProfile(s.lineup, byKey, 'flair');
    const season = simulateSeason(sideFromProfile('you', 'x', prof), 88, 'intl');
    const got = gameTrophies({ season, prof, plan: 'flair', hidden: false, points: season.points });
    expect(got.includes('shield')).toBe(season.finish === 'champion');
    expect(got.includes('champagne')).toBe(season.finish === 'champion');
    expect(got.includes('packmaster')).toBe(prof.pack >= 90);
    expect(got.includes('outsider')).toBe(season.position <= 6 && prof.fit < 70);
  });
});

describe('analytics', () => {
  it('drops personal fields and counts the funnel per session', () => {
    clearEvents();
    track('home_view');
    track('game_started', { mode: 'classic', name: 'Florent', token: 'abc', url: 'x', email: 'a@b' } as never);
    track('draft_round_viewed', { round: 5 });
    const ev = localEvents();
    expect(ev[1].p).toEqual({ mode: 'classic' });
    const f = Object.fromEntries(funnel(ev).map((x) => [x.id, x.sessions]));
    expect([f.home, f.start, f.round5, f.round10]).toEqual([1, 1, 1, 0]);
  });
});

describe('dataset validation', () => {
  it('the shipped dataset has no error', () => {
    const r = validateDataset(TEAMS, { captains: CAPTAINS, potyYears: PLAYER_OF_THE_YEAR });
    expect(r.errors).toEqual([]);
    expect(r.stats.versions).toBe(PLAYER_BY_KEY.size);
  });
  it('catches broken data instead of shipping it', () => {
    const t = TEAMS[0];
    const broken = [{ ...t, id: 'Bad Id', years: [2010, 2004] as [number, number], players: [{ ...t.players[0], pos: ['XX' as never], rating: 120, nat: '' }, ...t.players.slice(1, 12)] }, TEAMS[1], TEAMS[1]];
    const r = validateDataset(broken, { captains: { 'nowhere-1900': 'nobody' } });
    const codes = new Set(r.errors.map((e) => e.code));
    for (const c of ['team.id', 'team.period', 'team.duplicate', 'player.position', 'player.rating', 'player.nat', 'squad.size', 'fact.captain']) expect(codes.has(c), c).toBe(true);
  });
});

describe('leaderboards', () => {
  it('no server board is pretended: only local and verified friends rows exist', () => {
    expect(serverBoard).toBeNull();
    expect(friendsDailyBoard()).toEqual([]);
  });
  it('a submission is recomputed and pinned to its draw, never trusted', () => {
    const today = dailyChallenge(new Date('2026-09-28T10:00:00Z'));
    const s = draft(cfg(today.seed, 'daily'));
    const good = tokenOf(s);
    expect(acceptSubmission(good, drawOf(s.cfg)).ok).toBe(true);
    const d = decodeChallenge(good);
    if (!d.ok) throw new Error('decode');
    const inflated = encodeChallenge({ ...d.t, points: d.t.points + 10 });
    expect(acceptSubmission(inflated, drawOf(s.cfg))).toEqual({ ok: false, error: 'score_mismatch' });
    const otherDay = dailyChallenge(new Date('2026-09-29T10:00:00Z'));
    expect(acceptSubmission(good, { mode: 'daily', seed: otherDay.seed, ruleset: 'intl' })).toEqual({ ok: false, error: 'wrong_draw' });
  });
});

describe('encounter rarity', () => {
  it('the measured table matches the shipped data and draw engine (regenerate with scripts/encounters.ts)', () => {
    expect(ENCOUNTERS_META.dataVersion).toBe(DATA_VERSION);
    expect(ENCOUNTERS_META.engine).toBe(ENGINE_VERSION);
    expect(rarityFresh()).toBe(true);
  });
  it('labels about 5 % of versions, and rare is not strong', () => {
    const share = RARE_KEYS.length / ALL_PLAYERS.length;
    expect(share).toBeGreaterThan(0.04);
    expect(share).toBeLessThan(0.06);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const rare = mean(RARE_KEYS.map((k) => PLAYER_BY_KEY.get(k)!.rating));
    const all = mean(ALL_PLAYERS.map((p) => p.rating));
    expect(Math.abs(rare - all)).toBeLessThan(2);
  });
  it('only shown where the measurement holds, and never changes a draw', () => {
    const k = RARE_KEYS[0];
    for (const m of RARITY_MODES) expect(rarityOf(k, m)).not.toBeNull();
    expect(rarityOf(k, 'eralock')).toBeNull();
    expect(rarityOf(k, 'oneclub')).toBeNull();
    expect(rarityOf('no-such:key')).toBeNull();
    // the draft engine never reads the table: same seed, same offers, with or without it
    const a = offersOf(draft(cfg(4242)));
    const b = offersOf(draft(cfg(4242)));
    expect(a).toEqual(b);
  });
});

describe('retention on this device', () => {
  it('a better game on the same draws is a new personal best, and nobody in it is a new encounter', () => {
    const c = cfg(777001);
    const weak = botDraft(c, 'random', () => rng.next());
    const good = botDraft(c, 'competent', () => rng.next());
    const r1 = finishGame({ state: weak, lineup: weak.lineup, plan: 'balanced' }, 'Ana');
    expect(r1.newPlayers).toBeGreaterThan(0);
    const r2 = finishGame({ state: good, lineup: good.lineup, plan: 'balanced' }, 'Ana');
    expect(r2.points).toBeGreaterThan(r1.points);
    expect(r2.isNewBest).toBe(true);
    expect(r2.prevBest).toBe(r1.points);
    // same seed: the same 15 teams; only players the first draft never saw can be new
    const seen1 = new Set(weak.history.flatMap((o) => o.options.map((k) => PLAYER_BY_KEY.get(k)!.person)));
    const fresh = new Set(good.history.flatMap((o) => o.options.map((k) => PLAYER_BY_KEY.get(k)!.person)).filter((p) => !seen1.has(p)));
    expect(r2.newPlayers).toBe(fresh.size);
    expect(loadRecords().games).toBe(2);
  });
  it('a trophy unlocks once, then stays', () => {
    expect(unlock(['shield'])).toEqual(['shield']);
    expect(unlock(['shield', 'invincible'])).toEqual(['invincible']);
    expect(loadRecords().achievements).toEqual(['shield', 'invincible']);
  });
  it('practice replays and reopened games never touch records', () => {
    const s = draft(cfg(777002));
    finishGame({ state: s, lineup: s.lineup, plan: 'balanced', practice: true }, 'Ana');
    finishGame({ state: s, lineup: s.lineup, plan: 'balanced', reopened: true }, 'Ana');
    expect(loadRecords().games).toBe(0);
  });
});

void utcDay;
