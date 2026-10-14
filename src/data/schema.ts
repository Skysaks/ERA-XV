import { ATTRS, type Attr, type PlanId, type Pos, POSITIONS, ROLES, ROLE_TEMPLATE, type Role } from '../engine/rugby';

export type Kind = 'nation' | 'club';
/** test = national XV, lions = British & Irish Lions, then club competitions */
export type Comp = 'test' | 'lions' | 'top14' | 'prem' | 'super' | 'urc';
export type Bucket = 'amateur' | 'earlypro' | 'modern' | 'now';
export const BUCKETS: Bucket[] = ['amateur', 'earlypro', 'modern', 'now'];
export type Confidence = 'high' | 'medium' | 'low';

export interface TeamMeta {
  id: string;
  /** stable team key (club or nation), e.g. "toulouse", "nzl" */
  team: string;
  name: string;
  era: string;
  years: [number, number];
  kind: Kind;
  /** ISO-ish 3-letter country of the team (LIO for the Lions) */
  country: string;
  comp: Comp;
  color: string;
  /** structured honours inside the era: rwc:1987, gs:2003, euro:2021, super:1998, lions:1971, top14:2021, prem:2020, urc:2025 */
  titles?: string[];
  /** the side's own game plan when it plays you in the ERA League */
  plan?: PlanId;
  conf?: Confidence;
}

export interface PlayerEra {
  /** unique id of this player-season: `${teamEra}:${person}` */
  key: string;
  /** identity shared by every version of the same person */
  person: string;
  name: string;
  short: string;
  pos: Pos[];
  rating: number;
  role: Role;
  nat: string;
  teamEra: string;
  attrs: Record<Attr, number>;
  conf: Confidence;
  /** the data names him as a goal-kicker (explicit gk= value), not just a template estimate */
  kicker?: boolean;
}

export interface TeamEra extends TeamMeta {
  players: PlayerEra[];
  bucket: Bucket;
  mid: number;
}

export interface RawTeam { meta: TeamMeta; body: string }
export const team = (meta: TeamMeta, body: string): RawTeam => ({ meta, body });

const ATTR_KEYS: Record<string, Attr> = {
  sc: 'scrum', lo: 'lineout', bd: 'breakdown', cr: 'carry', df: 'defence', pm: 'playmaking', kk: 'kicking', st: 'strike', pc: 'pace', ae: 'aerial', gk: 'goalKick',
};

export function slug(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** tiny deterministic hash → [0,1) */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface ParsedLine { name: string; pos: Pos[]; rating: number; role: Role; nat: string; extras: Record<string, string> }

export function parseLine(rawLine: string, defaultNat: string): ParsedLine {
  let line = rawLine;
  let short: string | undefined;
  const sm = line.match(/short=(.+?)(?=\s+[a-z]{2,5}=|\s*\||\s*$)/);
  if (sm) { short = sm[1].trim(); line = line.replace(sm[0], ''); }
  const parts = line.split('|').map((p) => p.trim());
  if (parts.length < 4) throw new Error(`Bad line: ${line}`);
  const [name, posStr, ratingStr, roleField, ...restFields] = parts;
  const [roleStr, ...roleTail] = roleField.split(/\s+/);
  const rest = [roleTail.join(' '), ...restFields];
  const pos = posStr.split('/').map((p) => p.trim()) as Pos[];
  for (const p of pos) if (!POSITIONS.includes(p)) throw new Error(`Bad position ${p} in: ${line}`);
  const rating = Number(ratingStr);
  if (!Number.isFinite(rating) || rating < 50 || rating > 99) throw new Error(`Bad rating in: ${line}`);
  const role = roleStr as Role;
  if (!ROLES.includes(role)) throw new Error(`Bad role ${roleStr} in: ${line}`);
  let nat = defaultNat;
  const extras: Record<string, string> = {};
  for (const r of rest) {
    if (!r) continue;
    for (const tok of r.split(/\s+/)) {
      if (!tok) continue;
      if (tok.includes('=')) {
        const [k, ...v] = tok.split('=');
        extras[k] = v.join('=');
      } else if (/^[A-Z]{3}$/.test(tok)) nat = tok;
      else throw new Error(`Bad token "${tok}" in: ${line}`);
    }
  }
  if (short) extras.short = short;
  return { name, pos, rating, role, nat, extras };
}

export function buildAttrs(personId: string, rating: number, role: Role, extras: Record<string, string>): Record<Attr, number> {
  const tpl = ROLE_TEMPLATE[role];
  const out = {} as Record<Attr, number>;
  ATTRS.forEach((a, i) => {
    const noise = Math.round((hash01(`${personId}:${a}`) - 0.5) * 5);
    out[a] = Math.max(12, Math.min(99, Math.round(rating + tpl[i] + noise)));
  });
  for (const [k, v] of Object.entries(extras)) {
    const a = ATTR_KEYS[k];
    if (a) out[a] = Math.max(10, Math.min(99, Number(v)));
  }
  return out;
}

export function bucketOf(years: [number, number]): Bucket {
  const mid = Math.floor((years[0] + years[1]) / 2);
  if (mid <= 1995) return 'amateur';
  if (mid <= 2007) return 'earlypro';
  if (mid <= 2017) return 'modern';
  return 'now';
}

const PARTICLES = new Set(['du', 'de', 'van', 'der', 'le', 'la', 'di', 'da', 'dos', 'des', 'von', 'del']);
export function surnameOf(name: string): string {
  const toks = name.split(/\s+/);
  if (toks.length === 1) return name;
  for (let i = 1; i < toks.length - 1; i++) {
    if (PARTICLES.has(toks[i].toLowerCase())) return toks.slice(i).join(' ');
  }
  return toks[toks.length - 1];
}

export function parseTeams(raws: RawTeam[]): TeamEra[] {
  const seenTeamIds = new Set<string>();
  const teams: TeamEra[] = [];
  for (const { meta, body } of raws) {
    if (seenTeamIds.has(meta.id)) throw new Error(`Duplicate team-era id ${meta.id}`);
    seenTeamIds.add(meta.id);
    const players: PlayerEra[] = [];
    const seenPersons = new Set<string>();
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const p = parseLine(line, meta.kind === 'nation' && meta.country !== 'LIO' ? meta.country : '???');
      if (p.nat === '???') throw new Error(`Missing nationality in ${meta.id}: ${line}`);
      const person = p.extras.id ?? slug(p.name);
      if (seenPersons.has(person)) throw new Error(`Duplicate person ${person} in ${meta.id}`);
      seenPersons.add(person);
      players.push({
        key: `${meta.id}:${person}`,
        person,
        name: p.name,
        short: p.extras.short ?? '',
        pos: p.pos,
        rating: p.rating,
        role: p.role,
        nat: p.nat,
        teamEra: meta.id,
        attrs: buildAttrs(person, p.rating, p.role, p.extras),
        conf: (p.extras.conf as Confidence) ?? meta.conf ?? 'high',
        kicker: p.extras.gk !== undefined && Number(p.extras.gk) >= 80,
      });
    }
    teams.push({ ...meta, players, bucket: bucketOf(meta.years), mid: (meta.years[0] + meta.years[1]) / 2 });
  }
  assignShortNames(teams);
  return teams;
}

/** Surname on its own unless two different people share it; then an initial is added. Explicit short= wins. */
function assignShortNames(teams: TeamEra[]) {
  const bySurname = new Map<string, Set<string>>();
  for (const t of teams) for (const p of t.players) {
    const s = surnameOf(p.name).toLowerCase();
    if (!bySurname.has(s)) bySurname.set(s, new Set());
    bySurname.get(s)!.add(p.person);
  }
  const explicit = new Map<string, string>();
  for (const t of teams) for (const p of t.players) if (p.short) explicit.set(p.person, p.short);
  for (const t of teams) for (const p of t.players) {
    if (explicit.has(p.person)) { p.short = explicit.get(p.person)!; continue; }
    const sur = surnameOf(p.name);
    const clash = (bySurname.get(sur.toLowerCase())?.size ?? 1) > 1;
    if (!clash) { p.short = sur; continue; }
    const given = p.name.slice(0, p.name.length - sur.length).trim();
    const initials = given.split(/[\s-]+/).filter(Boolean).map((g) => (g.length <= 3 && g === g.toUpperCase() ? g : g[0] + '.')).join(' ');
    p.short = `${initials} ${sur}`.trim();
  }
  // two different people with the same computed short name → full names for both
  const byShort = new Map<string, Set<string>>();
  for (const t of teams) for (const p of t.players) {
    if (!byShort.has(p.short)) byShort.set(p.short, new Set());
    byShort.get(p.short)!.add(p.person);
  }
  for (const t of teams) for (const p of t.players) {
    if ((byShort.get(p.short)?.size ?? 1) > 1 && !explicit.has(p.person)) p.short = p.name;
  }
}
