/**
 * Dataset validator, pure and reusable: the audit script, the unit tests and any future importer run the same checks.
 * Errors make the data unusable or wrong (the build must fail); warnings are for editorial review.
 * Nothing here fixes data: a problem is reported, a human decides.
 */
import { POSITIONS, ROLES, type Pos } from '../engine/rugby';
import type { PlayerEra, TeamEra } from './schema';

export interface Issue { code: string; where: string; msg: string }
export interface ValidationReport { errors: Issue[]; warnings: Issue[]; stats: { teams: number; versions: number; persons: number } }

const TITLE_KINDS = ['rwc', 'gs', 'euro', 'super', 'lions', 'top14', 'prem', 'urc'];
const COMPS = ['test', 'lions', 'top14', 'prem', 'super', 'urc'];
const CONF = ['high', 'medium', 'low'];
const NEED: Record<Pos, number> = { LHP: 1, HK: 1, THP: 1, LK: 2, BF: 1, OF: 1, N8: 1, SH: 1, FH: 1, IC: 1, OC: 1, WG: 2, FB: 1 };
/** a career seen across team-eras whose midpoints are further apart than this is probably two people */
const MAX_CAREER_SPAN = 22;

export function validateDataset(teams: TeamEra[], opts: { captains?: Record<string, string>; thisYear?: number; potyYears?: Record<string, number[]> } = {}): ValidationReport {
  const errors: Issue[] = [], warnings: Issue[] = [];
  const err = (code: string, where: string, msg: string) => errors.push({ code, where, msg });
  const warn = (code: string, where: string, msg: string) => warnings.push({ code, where, msg });
  const thisYear = opts.thisYear ?? new Date().getUTCFullYear();

  const teamIds = new Set<string>();
  const keys = new Set<string>();
  const byPerson = new Map<string, PlayerEra[]>();
  for (const t of teams) {
    // team identity and period
    if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) err('team.id', t.id || '(empty)', 'team-era id missing or not a slug');
    if (teamIds.has(t.id)) err('team.duplicate', t.id, 'duplicate team-era id');
    teamIds.add(t.id);
    if (!t.team) err('team.key', t.id, 'stable team key missing');
    if (!t.name?.trim()) err('team.name', t.id, 'team name missing');
    if (!Array.isArray(t.years) || t.years.length !== 2 || !t.years.every(Number.isInteger)) err('team.period', t.id, 'period missing ([from, to] years)');
    else {
      const [a, b] = t.years;
      if (a > b) err('team.period', t.id, `period reversed: ${a} > ${b}`);
      if (a < 1880 || b > thisYear + 1) err('team.period', t.id, `period out of range: ${a}–${b}`);
      if (b - a > 15) warn('team.period', t.id, `long era (${b - a + 1} seasons): consider splitting it`);
      const m = /^(\d{4})(?:[–-](\d{2,4}))?$/.exec(t.era ?? '');
      if (!m) warn('team.era', t.id, `era label "${t.era}" is not "YYYY" or "YYYY–YY"`);
      else {
        const from = Number(m[1]);
        if (!m[2]) {
          // a single year names the defining season (a World Cup, a tour): it must fall inside the period
          if (from < a || from > b) err('team.era', t.id, `era label "${t.era}" outside years ${a}–${b}`);
        } else {
          const to = m[2].length === 2 ? Math.floor(from / 100) * 100 + Number(m[2]) + (Number(m[2]) < from % 100 ? 100 : 0) : Number(m[2]);
          if (from !== a || to !== b) err('team.era', t.id, `era label "${t.era}" disagrees with years ${a}–${b}`);
        }
      }
    }
    if (!['nation', 'club'].includes(t.kind)) err('team.kind', t.id, `unknown kind ${t.kind}`);
    if (!COMPS.includes(t.comp)) err('team.comp', t.id, `unknown competition ${t.comp}`);
    if (!/^[A-Z]{3}$/.test(t.country)) err('team.country', t.id, `country code "${t.country}" is not three capital letters`);
    if (t.conf && !CONF.includes(t.conf)) err('team.conf', t.id, `unknown confidence ${t.conf}`);
    if (!/^#[0-9a-f]{6}$/i.test(t.color)) warn('team.color', t.id, `colour "${t.color}" is not #rrggbb`);
    for (const title of t.titles ?? []) {
      const [kind, y] = title.split(':');
      const year = Number(y);
      if (!TITLE_KINDS.includes(kind) || !Number.isInteger(year)) err('team.title', t.id, `unreadable honour "${title}"`);
      else if (Array.isArray(t.years) && (year < t.years[0] || year > t.years[1] + 1)) err('team.title', t.id, `honour ${title} outside the era ${t.years.join('–')}`);
    }
    // squad
    if (t.players.length < 15) err('squad.size', t.id, `only ${t.players.length} players: a full XV is impossible`);
    else if (t.players.length < 18) warn('squad.size', t.id, `small squad (${t.players.length})`);
    for (const p of POSITIONS) {
      const any = t.players.filter((x) => x.pos.includes(p)).length;
      if (any < NEED[p]) err('squad.coverage', t.id, `only ${any} player(s) covering ${p} (need ${NEED[p]})`);
    }
    if (!t.players.some((p) => p.attrs.goalKick >= 80)) warn('squad.kicker', t.id, 'no goal-kicker rated 80+');
    const persons = new Set<string>();
    for (const p of t.players) {
      const where = `${t.id} · ${p.name || p.key}`;
      if (keys.has(p.key)) err('player.duplicate', where, `duplicate version key ${p.key}`);
      keys.add(p.key);
      if (persons.has(p.person)) err('player.duplicate', where, `person ${p.person} twice in the same squad`);
      persons.add(p.person);
      if (p.teamEra !== t.id || p.key !== `${t.id}:${p.person}`) err('player.team', where, `version not tied to its team-era (${p.teamEra}, ${p.key})`);
      if (!p.name?.trim()) err('player.name', where, 'name missing');
      if (!p.short?.trim()) err('player.name', where, 'short name missing');
      if (!p.pos.length) err('player.position', where, 'no position');
      for (const x of p.pos) if (!POSITIONS.includes(x)) err('player.position', where, `invalid position ${x}`);
      if (new Set(p.pos).size !== p.pos.length) warn('player.position', where, 'position listed twice');
      if (!Number.isInteger(p.rating) || p.rating < 50 || p.rating > 99) err('player.rating', where, `rating ${p.rating} out of 50–99`);
      else if (p.rating < 70) warn('player.rating', where, `rating ${p.rating} unusually low for a squad of its era`);
      if (!ROLES.includes(p.role)) err('player.role', where, `unknown role ${p.role}`);
      if (!/^[A-Z]{3}$/.test(p.nat)) err('player.nat', where, `nationality "${p.nat}" missing or invalid`);
      if (t.kind === 'nation' && t.country !== 'LIO' && p.nat !== t.country) warn('player.nat', where, `plays for ${t.country} with nationality ${p.nat}`);
      if (!CONF.includes(p.conf)) err('player.conf', where, `unknown confidence ${p.conf}`);
      for (const [a, v] of Object.entries(p.attrs)) if (!Number.isFinite(v) || v < 10 || v > 99) err('player.attr', where, `attribute ${a} = ${v} out of 10–99`);
      const list = byPerson.get(p.person) ?? [];
      list.push(p);
      byPerson.set(p.person, list);
    }
  }

  // identity across versions: one person, one spelling, a plausible career
  const teamOf = new Map(teams.map((t) => [t.id, t]));
  for (const [person, vs] of byPerson) {
    const names = new Set(vs.map((v) => v.name));
    if (names.size > 1) err('person.name', person, `spelled differently: ${[...names].join(' / ')}`);
    const known = vs.map((v) => teamOf.get(v.teamEra)).filter((t): t is TeamEra => !!t && Array.isArray(t.years));
    if (!known.length) continue;
    const mids = known.map((t) => (t.years[0] + t.years[1]) / 2);
    const span = Math.max(...mids) - Math.min(...mids);
    if (span > MAX_CAREER_SPAN) warn('person.span', person, `versions ${Math.round(span)} years apart: two people sharing an id?`);
    const countries = new Set(known.filter((t) => t.kind === 'nation' && t.country !== 'LIO').map((t) => t.country));
    if (countries.size > 1) warn('person.countries', person, `capped by ${[...countries].join(' and ')}: check eligibility`);
  }
  // structured facts must point at real data
  for (const [teamId, person] of Object.entries(opts.captains ?? {})) {
    const t = teamOf.get(teamId);
    if (!t) err('fact.captain', teamId, 'captain given for an unknown team-era');
    else if (!t.players.some((p) => p.person === person)) err('fact.captain', teamId, `captain ${person} is not in the squad`);
  }
  for (const [person, years] of Object.entries(opts.potyYears ?? {})) {
    if (!byPerson.has(person)) warn('fact.poty', person, 'Player of the Year not in the dataset');
    for (const y of years) if (y < 2001 || y > thisYear) err('fact.poty', person, `Player of the Year year ${y} out of range`);
  }
  return { errors, warnings, stats: { teams: teams.length, versions: keys.size, persons: byPerson.size } };
}
