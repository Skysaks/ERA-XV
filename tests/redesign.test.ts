import { describe, it, expect } from 'vitest';
import { TEAM_BY_ID, PLAYER_BY_KEY } from '../src/data/index';
import { CAPTAINS } from '../src/data/captains';
import {
  ENGINE_VERSION, ROUNDS, PLANS, SEASON_GAMES, newDraft, pickOption, canStayInPosition, place, teamProfile, byKey, sideFromProfile, simulateSeason,
  seasonStory, guaranteedTop, outOfTop, standingOf, optionInsights, lineupWith, traitsOf, headlineTraits, planReport, staffPoints,
  compositionDiagnosis, responsibilities, unitProgress, completedMoment, botDraft, cmpRows,
  type DraftConfig, type DraftState,
} from '../src/engine/index';

const P = (k: string) => PLAYER_BY_KEY.get(k)!;
const cfg = (seed: number): DraftConfig => ({ seed, mode: 'classic', plan: 'balanced', ruleset: 'intl', engine: ENGINE_VERSION });
function disciplined(c: DraftConfig): DraftState {
  let s = newDraft(c);
  while (s.round < ROUNDS) {
    const players = s.picks.map(P);
    let idx = s.offer!.options.findIndex((k) => canStayInPosition([...players, P(k)]));
    if (idx < 0) idx = 0;
    s = pickOption(s, idx);
  }
  return s;
}
const seasonOf = (s: DraftState, plan = s.cfg.plan) => simulateSeason(sideFromProfile('you', 'ERA XV', teamProfile(s.lineup, byKey, plan)), s.cfg.seed, s.cfg.ruleset);

describe('season story', () => {
  it('standings replay the season exactly', () => {
    for (const seed of [11, 202, 3003, 40004]) {
      const season = seasonOf(disciplined(cfg(seed)));
      expect(season.standings).toHaveLength(SEASON_GAMES);
      const last = season.standings[SEASON_GAMES - 1];
      expect(last.map((r) => r.id)).toEqual(season.table.map((r) => r.id));
      expect(last.map((r) => r.pts)).toEqual(season.table.map((r) => r.pts));
      const story = seasonStory(season);
      expect(story.frames).toHaveLength(SEASON_GAMES);
      expect(story.frames[SEASON_GAMES - 1].rank).toBe(season.position);
      expect(story.frames[SEASON_GAMES - 1].pts).toBe(season.points);
      const f = story.frames[SEASON_GAMES - 1];
      expect([f.w, f.d, f.l]).toEqual([season.w, season.d, season.l]);
      // every snapshot is sorted with the league's own rules
      for (const t of season.standings) expect(t.slice().sort(cmpRows).map((r) => r.id)).toEqual(t.map((r) => r.id));
    }
  });

  it('qualification calls are never contradicted by the final table', () => {
    let clinchedSeen = 0, elimSeen = 0;
    for (let i = 0; i < 40; i++) {
      const seed = 5000 + i * 131;
      const s = i % 2 ? disciplined(cfg(seed)) : botDraft(cfg(seed), 'random', () => ((i * 7919 + seed) % 97) / 97);
      const season = seasonOf(s);
      const story = seasonStory(season);
      const ev = story.frames.flatMap((f) => f.events.map((e) => e.kind));
      if (ev.includes('clinched')) { clinchedSeen++; expect(season.position).toBeLessThanOrEqual(6); }
      if (ev.includes('clinchedTop2')) expect(season.position).toBeLessThanOrEqual(2);
      if (ev.includes('eliminated')) { elimSeen++; expect(season.position).toBeGreaterThan(6); }
      // a decider is only announced when the last round really was open
      const pre = story.frames[SEASON_GAMES - 1].pre.map((e) => e.kind);
      if (pre.includes('decider')) {
        const t25 = season.standings[SEASON_GAMES - 2];
        expect(guaranteedTop(t25, 1, 6)).toBe(false);
        expect(outOfTop(t25, 1, 6)).toBe(false);
      }
      // the road through the knockouts matches the finish
      if (season.position <= 6) {
        const ties = story.path.filter((p) => p.kind === 'tie');
        expect(ties.length).toBeGreaterThan(0);
        const lastTie = ties[ties.length - 1];
        if (season.finish === 'champion') expect(lastTie.kind === 'tie' && lastTie.won && lastTie.tie.stage === 'final').toBe(true);
        else expect(lastTie.kind === 'tie' && !lastTie.won).toBe(true);
        expect(story.path.some((p) => p.kind === 'bye')).toBe(season.position <= 2);
      } else expect(story.path).toHaveLength(0);
      expect(standingOf(season)).toBeTruthy();
    }
    expect(clinchedSeen + elimSeen).toBeGreaterThan(0);
  });
});

describe('draft insights', () => {
  it('describe each option without changing the draft', () => {
    let s = newDraft(cfg(77));
    while (s.round < ROUNDS) {
      const ins = optionInsights(s, 'balanced');
      expect(ins).toHaveLength(s.offer!.options.length);
      for (const o of ins) {
        expect(o.notes.length).toBeLessThanOrEqual(2);
        expect(o.strengths.length).toBe(2);
        const l = lineupWith(s, o.key);
        expect(l[o.slot]).toBe(o.key);
        const tp = teamProfile(l, byKey, 'balanced');
        const cur = teamProfile(s.lineup, byKey, 'balanced');
        expect(o.fitDelta).toBe(cur.filled ? tp.fit - cur.fit : 0);
        if (o.kind === 'frontRow') expect(o.notes.some((n) => n.id === 'frontRow')).toBe(true);
      }
      s = pickOption(s, s.round % s.offer!.options.length);
    }
  });

  it('marks unit completion and moments on the real lineup', () => {
    const s = disciplined(cfg(909));
    expect(unitProgress(s.lineup).every((u) => u.complete)).toBe(true);
    let st = newDraft(cfg(909));
    const seen = new Set<string>();
    while (st.round < ROUNDS) {
      const idx = st.offer!.options.indexOf(s.picks[st.round]);
      const next = pickOption(st, idx);
      const m = completedMoment(st.lineup, next.lineup, byKey, seen as Set<never>);
      if (m) { seen.add(m.id); expect(m.values.every((v) => v.value > 0 && v.value <= 99)).toBe(true); }
      st = next;
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});

describe('traits and responsibilities', () => {
  it('captains exist in their team-era', () => {
    for (const [team, person] of Object.entries(CAPTAINS)) {
      const t = TEAM_BY_ID.get(team);
      expect(t, team).toBeTruthy();
      expect(t!.players.some((p) => p.person === person), `${team} ${person}`).toBe(true);
    }
  });
  it('derives traits from data only', () => {
    const mccaw = PLAYER_BY_KEY.get('nzl-2015:richie-mccaw')!;
    expect(traitsOf(mccaw)).toContain('captain');
    expect(headlineTraits(mccaw)).toContain('captain');
    const carter = PLAYER_BY_KEY.get('nzl-2015:dan-carter')!;
    expect(traitsOf(carter)).toContain('poty');
    const anyKicker = [...PLAYER_BY_KEY.values()].filter((p) => traitsOf(p).includes('goalKicker'));
    expect(anyKicker.length).toBeGreaterThan(50);
    expect(anyKicker.every((p) => p.kicker)).toBe(true);
  });
  it('the kicker on the sheet is the one the season model uses', () => {
    const s = disciplined(cfg(1234));
    const prof = teamProfile(s.lineup, byKey, 'balanced');
    const r = responsibilities(prof);
    expect(r.kicker?.player.key).toBe(prof.kicker?.key);
    expect(r.captain).toBeTruthy();
    expect(r.lineout && [2, 4, 5, 6, 8].includes(r.lineout.slot)).toBe(true);
  });
});

describe('plan and debrief readings', () => {
  it('plan reports agree with the team profile', () => {
    const s = disciplined(cfg(4321));
    for (const plan of PLANS) {
      const r = planReport(s.lineup, plan);
      expect(r.fit).toBe(teamProfile(s.lineup, byKey, plan).fit);
      if (plan === 'territory') expect(r.favoured[0]).toBe('kicking');
      if (plan === 'balanced') expect(r.favoured).toHaveLength(0);
      if (r.verdict.kind === 'limited') expect(r.verdict.value).toBeLessThan(r.verdict.thr);
    }
  });
  it('staff points compare with this season’s league', () => {
    const s = disciplined(cfg(2468));
    const prof = teamProfile(s.lineup, byKey, 'balanced');
    const sp = staffPoints(prof, s.cfg.seed);
    expect(sp.strengths.every((a) => a.delta >= 2)).toBe(true);
    expect(Math.min(...sp.all.map((a) => a.delta))).toBe(sp.weakness.delta);
    const players = s.picks.map(P);
    const messy = place(players.slice().reverse());
    const diag = compositionDiagnosis(teamProfile(messy, byKey, 'balanced'));
    expect(diag.misfits.every((m) => m.kind !== 'natural')).toBe(true);
    expect(diag.problems).toBe(diag.misfits.filter((m) => m.problem).length);
  });
});
