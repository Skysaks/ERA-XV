/* Season-model calibration: bot drafters over many seeds. Writes CALIBRATION.md when run with --write. */
import { writeFileSync } from 'node:fs';
import { botDraft, sideOf, type Bot } from './bots';
import { simulateSeason, rankedTeams, teamSide, expectedPoints } from '../src/engine/season';
import { ENGINE_VERSION } from '../src/engine/draft';
import { MAX_POINTS, type RulesetId } from '../src/engine/rugby';

import { MODEL } from '../src/engine/match';
import { LEAGUE_MIX, LEAGUE_LEVEL } from '../src/engine/season';
if (process.env.LEVEL) Object.assign(LEAGUE_LEVEL, JSON.parse(process.env.LEVEL));
if (process.env.MODEL) Object.assign(MODEL, JSON.parse(process.env.MODEL));
if (process.env.MIX) Object.assign(LEAGUE_MIX, JSON.parse(process.env.MIX));
const N = Number(process.env.N ?? 400);
const ruleset = (process.env.RULESET ?? 'intl') as RulesetId;
const bots: Bot[] = ['competent', 'star', 'random'];
const out: string[] = [];
const log = (s = '') => { out.push(s); console.log(s); };

log(`# ERA XV — season model calibration (engine v${ENGINE_VERSION}, ruleset ${ruleset}, ${N} drafts per bot)`);
log('');
log('## Opponent strength (best XV of each team-era)');
const r = rankedTeams();
log(`Top 8: ${r.slice(0, 8).map((t) => `${t.id} ${teamSide(t).side.ovr}`).join(', ')}`);
log(`Bottom 5: ${r.slice(-5).map((t) => `${t.id} ${teamSide(t).side.ovr}`).join(', ')}`);
log('');
const pct = (xs: number[], q: number) => xs[Math.floor(q * (xs.length - 1))];
for (const bot of bots) {
  const pts: number[] = [], fits: number[] = [], ovrs: number[] = [], wins: number[] = [];
  let champs = 0, hundred = 0, top = 0, inv = 0;
  let rng = 12345;
  const rand = () => { rng = (rng * 1103515245 + 12345) % 2147483648; return rng / 2147483648; };
  for (let i = 0; i < N; i++) {
    const seed = 1000 + i * 7919;
    const d = botDraft({ seed, mode: 'classic', plan: 'balanced', ruleset, engine: ENGINE_VERSION }, bot, rand);
    const { prof, side } = sideOf(d);
    const s = simulateSeason(side, seed, ruleset);
    pts.push(s.points); fits.push(prof.fit); ovrs.push(prof.ovr); wins.push(s.w);
    if (s.finish === 'champion') champs++;
    if (s.points >= 100) hundred++;
    if (s.points >= 120) top++;
    if (s.l === 0) inv++;
  }
  pts.sort((a, b) => a - b); fits.sort((a, b) => a - b);
  const mean = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
  log(`## ${bot}`);
  log(`- points: mean ${mean(pts)} / ${MAX_POINTS}, p10 ${pct(pts, 0.1)}, median ${pct(pts, 0.5)}, p90 ${pct(pts, 0.9)}, max ${pts[pts.length - 1]}`);
  log(`- 100+: ${((hundred / N) * 100).toFixed(1)}% · 120+: ${((top / N) * 100).toFixed(1)}% · unbeaten: ${((inv / N) * 100).toFixed(1)}% · champions: ${((champs / N) * 100).toFixed(1)}%`);
  log(`- wins: mean ${mean(wins)} / 26 · FIT median ${pct(fits, 0.5)} · OVR mean ${mean(ovrs)}`);
  log('');
}
// luck spread for one competent XV
const d = botDraft({ seed: 4242, mode: 'classic', plan: 'balanced', ruleset, engine: ENGINE_VERSION }, 'competent');
const e = expectedPoints(sideOf(d).side, 4242, ruleset, 300);
log(`Luck spread for one competent XV (300 seasons, same fixtures): mean ${e.mean}, 80% range ${e.p10}–${e.p90}`);
if (process.argv.includes('--write')) writeFileSync('CALIBRATION.md', out.join('\n') + '\n');
