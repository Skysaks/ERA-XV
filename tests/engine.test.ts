import { describe, it, expect } from 'vitest';
import { TEAMS, TEAM_BY_ID, VERSIONS, PLAYER_BY_KEY, ONE_CLUB_KEYS, ONE_COUNTRY_KEYS, BUCKETS } from '../src/data/index';
import {
  famKind, SLOTS, POSITIONS, MAX_POINTS, RULESETS, PLANS, famFactor,
  hungarian, place, teamProfile, posRating, emptyLineup,
  newDraft, pickOption, reroll, canReroll, replay, sequence, ROUNDS, ENGINE_VERSION, canStayInPosition, positionOrder, withExclusions,
  simulateSeason, simMatch, expectedPoints, runGauntlet, legends, leagueFor, schedule, byKey, sideFromProfile, teamSide,
  encodeChallenge, decodeChallenge, poolFor, MODE_ORDER, MODES, weeklyFor, WEEKLY, u01, poissonInv,
  optimise, turningPoints, draftSummary, planOptions, compareDrafts,
  type DraftConfig, type ModeId, type DraftState,
} from '../src/engine/index';

const cfg = (seed: number, mode: ModeId = 'classic', param?: string): DraftConfig => ({ seed, mode, plan: 'balanced', ruleset: 'intl', engine: ENGINE_VERSION, param });
const P = (k: string) => PLAYER_BY_KEY.get(k)!;

/** picks the option that keeps everyone in position (the director guarantees one exists), highest rating first */
function disciplinedDraft(c: DraftConfig): DraftState {
  let s = newDraft(c);
  while (s.round < ROUNDS) {
    const players = s.picks.map(P);
    let idx = s.offer!.options.findIndex((k) => canStayInPosition([...players, P(k)]));
    if (idx < 0) idx = 0;
    s = pickOption(s, idx);
  }
  return s;
}

describe('dataset', () => {
  it('has the expected volume and every team-era can field a XV', () => {
    expect(TEAMS.length).toBeGreaterThanOrEqual(85);
    for (const t of TEAMS) {
      for (const p of POSITIONS) expect(t.players.some((x) => x.pos.includes(p)), `${t.id} ${p}`).toBe(true);
      expect(t.players.filter((x) => x.pos.includes('LK')).length, t.id).toBeGreaterThanOrEqual(2);
      expect(t.players.filter((x) => x.pos.includes('WG')).length, t.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('keeps one spelling per person and unique keys', () => {
    for (const [, vs] of VERSIONS) expect(new Set(vs.map((v) => v.name)).size).toBe(1);
    expect(new Set(TEAMS.flatMap((t) => t.players.map((p) => p.key))).size).toBe(PLAYER_BY_KEY.size);
  });
  it('separates homonyms (Richard Hill ×2, Jonathan Davies)', () => {
    expect(VERSIONS.has('richard-hill-9')).toBe(true);
    expect(VERSIONS.has('richard-hill-6')).toBe(true);
    expect(VERSIONS.get('richard-hill-6')!.every((v) => v.pos[0] === 'BF')).toBe(true);
  });
  it('fills every era bucket and the One Club / One Country lists', () => {
    for (const b of BUCKETS) expect(TEAMS.filter((t) => t.bucket === b).length).toBeGreaterThanOrEqual(15);
    expect(ONE_CLUB_KEYS).toEqual(expect.arrayContaining(['toulouse', 'leinster', 'crusaders', 'leicester']));
    expect(ONE_COUNTRY_KEYS).toContain('FRA');
  });
});

describe('positions', () => {
  it('ranks familiarity sensibly', () => {
    expect(famKind(['N8'], 'N8')).toBe('natural');
    expect(famKind(['LK', 'BF'], 'BF')).toBe('secondary');
    expect(famKind(['BF'], 'OF')).toBe('close');
    expect(famKind(['FH'], 'IC')).toBe('cover');
    expect(famKind(['OC'], 'LHP')).toBe('frontRow');
    expect(famKind(['WG'], 'LK')).toBe('outOfPosition');
    expect(famKind(['LK'], 'SH')).toBe('outOfPosition');
    expect(famKind(['THP'], 'LHP')).toBe('close');
    expect(famKind(['LHP'], 'THP')).toBe('cover');
    expect(famFactor(['OC'], 'HK')).toBeLessThan(famFactor(['WG'], 'N8'));
  });
  it('rates a player highest in his natural position', () => {
    const dupont = PLAYER_BY_KEY.get('fra-2023:antoine-dupont')!;
    const natural = posRating(dupont, 'SH').rating;
    for (const p of POSITIONS) expect(posRating(dupont, p).rating).toBeLessThanOrEqual(natural);
  });
});

describe('placement', () => {
  it('hungarian finds the optimum on a small matrix', () => {
    const cost = [[4, 1, 3], [2, 0, 5], [3, 2, 2]];
    const a = hungarian(cost);
    const total = a.reduce((s, c, r) => s + cost[r][c], 0);
    expect(total).toBe(5);
  });
  it('puts a real team in its natural shirts', () => {
    const t = TEAM_BY_ID.get('nzl-2015')!;
    const l = place(t.players);
    const prof = teamProfile(l, byKey, 'balanced');
    expect(prof.filled).toBe(15);
    expect(prof.oop.length).toBe(0);
    expect(P(l[10]!).name).toBe('Dan Carter');
    expect(P(l[7]!).name).toBe('Richie McCaw');
  });
  it('flags uncontested scrums when a back plays in the front row', () => {
    const t = TEAM_BY_ID.get('nzl-2015')!;
    const l = place(t.players);
    const back = t.players.find((p) => p.pos[0] === 'OC' && !Object.values(l).includes(p.key))!;
    const l2 = l.slice(); l2[1] = back.key;
    const prof = teamProfile(l2, byKey, 'balanced');
    expect(prof.uncontested).toBe(true);
    expect(prof.synergies.some((s) => s.id === 'uncontested')).toBe(true);
    expect(prof.fit).toBeLessThan(teamProfile(l, byKey, 'balanced').fit);
  });
  it('keeps FIT within 30–100', () => {
    for (const seed of [1, 2, 3]) {
      let s = newDraft(cfg(seed));
      while (s.round < ROUNDS) s = pickOption(s, 0);
      const f = teamProfile(s.lineup, byKey, 'balanced').fit;
      expect(f).toBeGreaterThanOrEqual(30);
      expect(f).toBeLessThanOrEqual(100);
    }
  });
});

describe('draft', () => {
  it('is deterministic for a seed', () => {
    const a = newDraft(cfg(42)), b = newDraft(cfg(42));
    expect(a.seq).toEqual(b.seq);
    expect(a.offer).toEqual(b.offer);
  });
  it('draws 15 different team-eras, at most two eras of one team', () => {
    for (let seed = 1; seed < 40; seed++) {
      const { seq } = sequence(cfg(seed));
      expect(new Set(seq).size).toBe(15);
      const perTeam = new Map<string, number>();
      for (const id of seq) { const k = TEAM_BY_ID.get(id)!.team; perTeam.set(k, (perTeam.get(k) ?? 0) + 1); }
      expect(Math.max(...perTeam.values())).toBeLessThanOrEqual(2);
    }
  });
  it('World XV draws fifteen different nations', () => {
    const { seq } = sequence(cfg(7, 'worldxv'));
    expect(new Set(seq.map((id) => TEAM_BY_ID.get(id)!.country)).size).toBe(15);
    expect(seq.every((id) => TEAM_BY_ID.get(id)!.kind === 'nation' && TEAM_BY_ID.get(id)!.country !== 'LIO')).toBe(true);
  });
  it('offers four different, undrafted people each round', () => {
    let s = newDraft(cfg(99));
    while (s.round < ROUNDS) {
      const opts = s.offer!.options;
      expect(opts.length).toBe(4);
      expect(new Set(opts.map((k) => P(k).person)).size).toBe(4);
      const drafted = new Set(s.picks.map((k) => P(k).person));
      for (const k of opts) expect(drafted.has(P(k).person)).toBe(false);
      s = pickOption(s, s.round % 4);
    }
    expect(s.picks.length).toBe(15);
  });
  it('director: a disciplined drafter can always finish with nobody out of position', () => {
    const modes: ModeId[] = ['classic', 'cult', 'nations', 'champions', 'worldxv', 'noreroll'];
    for (const m of modes) for (let seed = 100; seed < 130; seed++) {
      const s = disciplinedDraft(cfg(seed, m));
      const prof = teamProfile(s.lineup, byKey, 'balanced');
      expect(prof.oop.length, `${m} seed ${seed}`).toBe(0);
    }
  });
  it('cult XV never offers anyone rated above 86 (when the squad allows it)', () => {
    let s = newDraft(cfg(5, 'cult'));
    while (s.round < ROUNDS) {
      s.offer!.options.forEach((k, i) => { if (i !== s.offer!.tailored) expect(P(k).rating).toBeLessThanOrEqual(86); });
      s = pickOption(s, 0);
    }
  });
  it('reroll swaps the draw once, then is spent', () => {
    let s = newDraft(cfg(11));
    s = pickOption(s, 0);
    expect(canReroll(s)).toBe(true);
    const before = s.seq[1];
    s = reroll(s);
    expect(s.seq[1]).not.toBe(before);
    expect(canReroll(s)).toBe(false);
    expect(reroll(s)).toBe(s);
  });
  it('No Reroll has none', () => {
    expect(canReroll(newDraft(cfg(3, 'noreroll')))).toBe(false);
  });
  it('position draft puts every pick in the named shirt', () => {
    let s = newDraft(cfg(21, 'position'));
    const order = positionOrder(21);
    for (let r = 0; r < ROUNDS; r++) {
      expect(s.offer!.shirt).toBe(order[r]);
      const k = s.offer!.options[0];
      s = pickOption(s, 0);
      expect(s.lineup[order[r]]).toBe(k);
    }
  });
  it('replays a finished draft exactly (challenge links)', () => {
    let s = newDraft(cfg(77));
    for (let r = 0; r < ROUNDS; r++) { if (r === 6) s = reroll(s); s = pickOption(s, (r * 3) % 4); }
    const rep = replay(cfg(77), s.picks, s.rerollRound);
    expect(rep.ok).toBe(true);
    expect(rep.state!.lineup).toEqual(s.lineup);
    expect(rep.state!.history.map((o) => o.options)).toEqual(s.history.map((o) => o.options));
  });
  it('shared draft: a rival pick disappears from your offer', () => {
    let s = newDraft(cfg(123));
    const taken = P(s.offer!.options[0]).person;
    s = withExclusions(s, [taken]);
    expect(s.offer!.options.map((k) => P(k).person)).not.toContain(taken);
  });
  it('every mode has a usable pool', () => {
    for (const m of MODE_ORDER) {
      const params = MODES[m].param === 'bucket' ? BUCKETS : MODES[m].param === 'club' ? ONE_CLUB_KEYS : MODES[m].param === 'country' ? ONE_COUNTRY_KEYS : m === 'weekly' ? WEEKLY : [undefined];
      for (const p of params) {
        expect(poolFor(m, p).teams.length, `${m}/${p}`).toBeGreaterThan(0);
        const s = disciplinedDraft(cfg(8, m, p));
        expect(s.picks.length, `${m}/${p}`).toBe(15);
      }
    }
  });
});

describe('match & season', () => {
  const s = disciplinedDraft(cfg(2024));
  const prof = teamProfile(s.lineup, byKey, 'balanced');
  const side = sideFromProfile('you', 'ERA XV', prof);

  it('poisson inverse is monotone in lambda (common random numbers)', () => {
    for (let i = 0; i < 200; i++) {
      const u = u01('t', i);
      expect(poissonInv(3, u)).toBeGreaterThanOrEqual(poissonInv(2, u));
    }
  });
  it('a stronger XV never scores fewer tries on the same seed', () => {
    const weak = { ...side, dims: Object.fromEntries(Object.entries(side.dims).map(([k, v]) => [k, v - 6])) as typeof side.dims };
    const opp = teamSide(TEAM_BY_ID.get('fra-2011')!).side;
    for (let i = 0; i < 200; i++) {
      const a = simMatch(side, opp, `crn:${i}`), b = simMatch(weak, opp, `crn:${i}`);
      expect(a.home.tries).toBeGreaterThanOrEqual(b.home.tries);
    }
  });
  it('simulates a full, deterministic 26-game season', () => {
    const a = simulateSeason(side, 2024), b = simulateSeason(side, 2024);
    expect(a.points).toBe(b.points);
    expect(a.fixtures.length).toBe(26);
    expect(a.w + a.d + a.l).toBe(26);
    expect(a.points).toBeLessThanOrEqual(MAX_POINTS);
    expect(a.fixtures.filter((f) => f.home).length).toBe(13);
    expect(a.table.length).toBe(14);
    expect(a.table.reduce((x, r) => x + r.p, 0)).toBe(14 * 26);
    expect(['champion', 'final', 'semi', 'quarter', 'missed']).toContain(a.finish);
    const sum = a.fixtures.reduce((x, f) => x + f.pts, 0);
    expect(sum).toBe(a.points);
  });
  it('applies both bonus-point rulesets', () => {
    expect(RULESETS.intl.tryBonus(4, 5, false)).toBe(true);
    expect(RULESETS.intl.losingBonus(7)).toBe(true);
    expect(RULESETS.intl.losingBonus(8)).toBe(false);
    expect(RULESETS.top14.tryBonus(4, 2, true)).toBe(false);
    expect(RULESETS.top14.tryBonus(5, 2, true)).toBe(true);
    expect(RULESETS.top14.tryBonus(6, 2, false)).toBe(false);
    expect(RULESETS.top14.losingBonus(5)).toBe(true);
    expect(RULESETS.top14.losingBonus(6)).toBe(false);
  });
  it('schedule: everyone meets everyone home and away', () => {
    const r = schedule(14, 5);
    expect(r.length).toBe(26);
    const seen = new Set<string>();
    for (const round of r) for (const [h, a] of round) seen.add(`${h}-${a}`);
    expect(seen.size).toBe(14 * 13);
  });
  it('same seed → same league of 13 different teams', () => {
    const l = leagueFor(9);
    expect(l.length).toBe(13);
    expect(new Set(l.map((t) => t.team)).size).toBe(13);
    expect(leagueFor(9).map((t) => t.id)).toEqual(l.map((t) => t.id));
  });
  it('expected range brackets the mean', () => {
    const e = expectedPoints(side, 2024, 'intl', 60);
    expect(e.p10).toBeLessThanOrEqual(e.mean);
    expect(e.p90).toBeGreaterThanOrEqual(e.mean);
  });
  it('gauntlet: ten legends, weakest first, ends on the first defeat', () => {
    expect(legends().length).toBe(10);
    const g = runGauntlet(side, 2024);
    expect(g.ties.length).toBe(Math.min(10, g.beaten + 1));
    for (const t of g.ties) expect(t.pf === t.pa ? !!t.kc || !!t.et : true).toBe(true);
  });
});

describe('analysis', () => {
  const s = disciplinedDraft(cfg(31));
  it('optimise never makes things worse', () => {
    const scrambled = s.lineup.slice();
    [scrambled[9], scrambled[10]] = [scrambled[10], scrambled[9]];
    const o = optimise(scrambled, 'balanced', 31, 'intl');
    expect(o.expTo).toBeGreaterThanOrEqual(o.expFrom);
  });
  it('plan options cover every plan', () => {
    expect(planOptions(s.lineup, 31, 'intl', 10).map((p) => p.plan).sort()).toEqual([...PLANS].sort());
  });
  it('turning points are at most three, each a real improvement', () => {
    const tps = turningPoints(s, s.lineup, 'balanced', 12);
    expect(tps.length).toBeLessThanOrEqual(3);
    for (const t of tps) expect(t.delta).toBeGreaterThanOrEqual(1);
  });
  it('summarises the draft from real picks', () => {
    const prof = teamProfile(s.lineup, byKey, 'balanced');
    const d = draftSummary(s, prof);
    expect(d.rounds).toBe(15);
    expect(d.discipline).toBe('excellent');
  });
  it('compares two drafts on the same seed', () => {
    const other = (() => { let x = newDraft(cfg(31)); while (x.round < ROUNDS) x = pickOption(x, 3); return x; })();
    const season = simulateSeason(sideFromProfile('you', 'x', teamProfile(s.lineup, byKey, 'balanced')), 31);
    const c = compareDrafts({ name: 'a', picks: s.picks, history: s.history, lineup: s.lineup, plan: 'balanced', season }, { name: 'b', picks: other.picks, history: other.history, lineup: other.lineup, plan: 'balanced', season }, 31, 'intl');
    expect(c.diffs.length).toBeGreaterThan(0);
  });
});

describe('challenge links', () => {
  it('round-trips and detects edits', () => {
    const s = disciplinedDraft(cfg(555));
    const tok = encodeChallenge({ cfg: s.cfg, picks: s.picks, rerollRound: s.rerollRound, lineup: s.lineup, points: 88, wins: 18, name: 'Florian', rematch: false });
    expect(tok).toMatch(/^[A-Za-z0-9_-]{40,600}$/);
    const d = decodeChallenge(tok);
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.t.picks).toEqual(s.picks);
      expect(d.t.lineup).toEqual(s.lineup);
      expect(d.t.name).toBe('Florian');
      expect(d.t.cfg.seed).toBe(555);
    }
    const broken = tok.slice(0, 20) + (tok[20] === 'A' ? 'B' : 'A') + tok.slice(21);
    expect(decodeChallenge(broken).ok).toBe(false);
    expect(decodeChallenge('not a token').ok).toBe(false);
  });
});

describe('weekly & daily', () => {
  it('weekly theme rotates by ISO week', () => {
    const a = weeklyFor(new Date('2026-09-26T12:00:00Z')), b = weeklyFor(new Date('2026-10-05T12:00:00Z'));
    expect(WEEKLY).toContain(a.id);
    expect(a.id === b.id && a.week === b.week).toBe(false);
  });
  it('empty lineup profile is harmless', () => {
    expect(teamProfile(emptyLineup(), byKey, 'balanced').fit).toBe(0);
    expect(SLOTS.length).toBe(15);
  });
});
