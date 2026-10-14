import { en, fr, es } from '../src/ui/locales/index';
import { POSITIONS, ROLES, DIMS, ATTRS, PLANS, SLOTS } from '../src/engine/rugby';
import { MODE_ORDER, WEEKLY, MODES } from '../src/engine/modes';
import { TEAMS, ALL_PLAYERS } from '../src/data';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
let errors = 0;
for (const [name, dict] of [['fr', fr], ['es', es]] as const) {
  const missing = Object.keys(en).filter((k) => !(k in dict));
  const extra = Object.keys(dict).filter((k) => !(k in en) && !(k.endsWith('_one') || k.endsWith('_other')) );
  const badVars = Object.keys(en).filter((k) => k in dict && vars(en[k]) !== vars(dict[k]) && !(k.endsWith('_one')));
  if (missing.length) { errors += missing.length; console.log(`[${name}] missing ${missing.length}:`, missing.join(' ')); }
  if (extra.length) console.log(`[${name}] extra ${extra.length}:`, extra.join(' '));
  if (badVars.length) { errors += badVars.length; console.log(`[${name}] placeholder mismatch:`, badVars.map((k) => `${k} en{${vars(en[k])}} ${name}{${vars(dict[k])}}`).join(' | ')); }
}
// dynamic key families built from engine enums
const fam: string[] = [];
for (const p of POSITIONS) fam.push(`pos.${p}`, `posName.${p}`);
for (const s of SLOTS) fam.push(`shirt.${s.n}`);
for (const r of ROLES) fam.push(`role.${r}`, `roleDesc.${r}`, `roleStr.${r}`, `roleNeed.${r}`, `roleRisk.${r}`);
for (const d of DIMS) fam.push(`dim.${d}`, `dimShort.${d}`);
for (const a of ATTRS) fam.push(`attr.${a}`);
for (const p of PLANS) for (const f of ['name', 'short', 'tag', 'str', 'needs', 'risk']) fam.push(`plan.${p}.${f}`);
for (const m of MODE_ORDER) { fam.push(`mode.${m}.name`, `mode.${m}.desc`, `modes.group.${MODES[m].group}`); if (MODES[m].param) fam.push(`modes.choose.${MODES[m].param}`); }
for (const w of WEEKLY) fam.push(`weekly.${w}.name`, `weekly.${w}.desc`);
for (const k of ['axis','centres','engine','backrow','kickchase','tempo','finishers','noJackal','noKicker','uncontested','sameChannel','noCaller','highBall','slowBack3']) fam.push(`synergy.${k}`, `synergy.${k}.short`);
for (const k of ['champion', 'final', 'semi', 'quarter', 'missed']) fam.push(`finish.${k}`);
for (const k of ['natural', 'secondary', 'close', 'cover', 'stretch', 'unfamiliar', 'outOfPosition', 'frontRow']) fam.push(`inspect.kind.${k}`);
for (const k of ['malformed', 'outdated', 'invalid', 'score_mismatch']) fam.push(`notice.${k}`);
for (const u of ['pack', 'halves', 'centres', 'back3']) fam.push(`unit2.${u}`, `unit2.${u}.short`);
for (const g of ['front', 'second', 'backrow', 'halves', 'centres', 'back3']) fam.push(`group.${g}`, `groupPoss.${g}`, `gloss.group.${g}`);
for (const m of ['front', 'backrow', 'pack', 'halves', 'centres', 'back3']) fam.push(`moment.${m}`, `insight.complete.${m}`);
for (const d of DIMS) fam.push(`insight.boost.${d}`, `insight.still.${d}`);
for (const k of ['uncontested', 'noKicker', 'noJackal', 'noCaller', 'highBall', 'slowBack3', 'sameChannel']) fam.push(`insight.fix.${k}`);
for (const k of ['captain', 'poty', 'goalKicker', 'utility', 'jackal', 'lineoutBoss', 'scrummager', 'ballCarrier', 'finisher', 'highBall', 'playmaker', 'distributor', 'defensiveLeader']) fam.push(`trait.${k}`);
for (const k of ['exploit', 'statement', 'tries', 'streak', 'losingRun', 'firstDefeat', 'intoTop6', 'outOfTop6', 'leader', 'clinched', 'clinchedTop2', 'eliminated', 'decider']) fam.push(`story.${k}`);
for (const k of ['champion', 'finalist', 'semi', 'quarter', 'playoffs', 'doorstep', 'midtable', 'bottom']) fam.push(`standing.${k}`);
for (const a of ['setpiece', 'collision', 'defence', 'attack', 'territory', 'pace']) fam.push(`staff.${a}.up`, `staff.${a}.down`, `staff.${a}.low`);
for (const p of PLANS) fam.push(`gloss.plan.${p}`);
for (const k of ['fit', 'responsibilities', 'plan', 'eraScore', 'staffAreas', 'bonus']) fam.push(`gloss.${k}`);
for (const k of ['captain', 'kicker', 'lineout']) fam.push(`resp.mark.${k}`, `resp.${k}`);
for (const k of ['high', 'medium', 'low']) fam.push(`diag.impact.${k}`);
for (const k of ['sheet', 'pitch']) fam.push(`sheet.view.${k}`);
for (const k of ['W', 'D', 'L']) fam.push(`story.res.${k}`);
for (const k of ['liveduel', 'party', 'shared', 'coop', 'practice']) fam.push(`room.tag.${k}`);
// 2.1 families
for (const k of ['stats', 'trends', 'trophies', 'collection', 'history']) fam.push(`profile.tab.${k}`);
for (const k of ['props', 'hooker', 'locks', 'backrow', 'scrumhalf', 'flyhalf', 'centres', 'back3']) fam.push(`family.${k}`);
for (const k of ['rare', 'veryRare']) fam.push(`rarity.${k}`);
for (const k of ['fhEarly', 'bestPlan', 'topPlayer', 'playoffRate', 'avgFit', 'distinct', 'topNation', 'earliest', 'star', 'oop']) fam.push(`trend.${k}`);
for (const k of ['malformed', 'outdated', 'invalid', 'score_mismatch', 'replay', 'lineup', 'wrong_draw', 'resume_corrupt', 'resume_outdated', 'crash']) fam.push(`notice3.${k}.title`, `notice3.${k}.body`);
for (const k of ['pick', 'positions', 'units', 'plan']) fam.push(`coach.${k}.title`, `coach.${k}.body`);
for (const k of ['shield', 'invincible', 'centurion', 'perfection', 'packmaster', 'champagne', 'outsider', 'clubhouse', 'explorer', 'regular', 'purist', 'legendhunter']) fam.push(`ach.${k}.name`, `ach.${k}.desc`);
for (const k of ['story', 'post']) fam.push(`share3.fmt.${k}`);
for (const k of ['home', 'start', 'round5', 'round10', 'round15', 'simulation', 'result', 'analysis', 'replay', 'challenge', 'accepted', 'dailyViewed', 'dailyPlayed']) fam.push(`diag.step.${k}`);
fam.push('diag.title', 'diag.count', 'archives.players', 'archives.teams');
const missingFam = [...new Set(fam)].filter((k) => !(k in en));
if (missingFam.length) { errors += missingFam.length; console.log('[families] missing in en:', missingFam.join(' ')); }
const nats = new Set(ALL_PLAYERS.map((p) => p.nat));
const natMissing = [...nats].filter((c) => !(`nat.${c}` in en));
if (natMissing.length) console.log('[nat] no label (falls back to code):', natMissing.join(' '));
const teamKeys = new Set(TEAMS.map((t) => t.team));
console.log(`[team] ${[...teamKeys].filter((k) => `team.${k}` in en).length}/${teamKeys.size} team keys localised (others use data name)`);

// static keys used in UI source
const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(f) && files.push(p); } };
walk('src/ui');
const used = new Set<string>();
for (const f of files) {
  if (f.includes('locales')) continue;
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([^'$]+)'/g)) used.add(m[1]);
}
const unknown = [...used].filter((k) => !(k in en) && !(`${k}_other` in en));
if (unknown.length) { errors += unknown.length; console.log('[src] keys used but not in en:', unknown.join(' ')); }
console.log(`en ${Object.keys(en).length} keys · fr ${Object.keys(fr).length} · es ${Object.keys(es).length} · static uses ${used.size}`);
process.exit(errors ? 1 : 0);
