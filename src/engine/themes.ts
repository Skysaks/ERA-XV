/**
 * Theme registry: one declarative filter per pool, shared by the weekly featured challenge, the Themes mode and any
 * future event. Adding a theme = one entry here + its name/description in the dictionaries. The draft engine is never
 * duplicated: poolFor() turns the filter into a team list and the usual director draws from it.
 */
import { TEAMS, isChampionTeam, type Bucket, type Comp, type Kind, type TeamEra } from '../data/index';

export interface PoolFilter {
  kinds?: Kind[];
  countries?: string[];
  comps?: Comp[];
  buckets?: Bucket[];
  /** team-era midpoint strictly before / from this year */
  before?: number;
  from?: number;
  /** World Cup, European Cup or Super Rugby winners */
  champions?: boolean;
  /** World Cup winners or Grand Slam sides */
  rwcOrSlam?: boolean;
}

export type ThemeGroup = 'region' | 'competition' | 'era' | 'honours' | 'twist';
export interface ThemeDef { id: string; group: ThemeGroup; filter: PoolFilter; excludePoty?: boolean }

const SOUTH = ['NZL', 'RSA', 'AUS', 'ARG', 'FIJ', 'SAM', 'TON', 'JPN'];
const SIX = ['ENG', 'FRA', 'IRL', 'WAL', 'SCO', 'ITA', 'LIO'];

export const THEMES = {
  // the nine historical weekly themes: their pools must not change (weekly links replay on them)
  amateur: { id: 'amateur', group: 'era', filter: { buckets: ['amateur'] } },
  south: { id: 'south', group: 'region', filter: { countries: SOUTH } },
  nopoty: { id: 'nopoty', group: 'twist', filter: {}, excludePoty: true },
  champions: { id: 'champions', group: 'honours', filter: { champions: true } },
  top14: { id: 'top14', group: 'region', filter: { countries: ['FRA'] } },
  sixnations: { id: 'sixnations', group: 'region', filter: { countries: SIX } },
  earlypro: { id: 'earlypro', group: 'era', filter: { buckets: ['earlypro'] } },
  no10: { id: 'no10', group: 'twist', filter: {} },
  rwc: { id: 'rwc', group: 'honours', filter: { rwcOrSlam: true } },
  // 2.1
  clubs: { id: 'clubs', group: 'competition', filter: { kinds: ['club'] } },
  top14c: { id: 'top14c', group: 'competition', filter: { comps: ['top14'] } },
  prem: { id: 'prem', group: 'competition', filter: { comps: ['prem'] } },
  super: { id: 'super', group: 'competition', filter: { comps: ['super'] } },
  lions: { id: 'lions', group: 'competition', filter: { comps: ['lions'] } },
  pre2000: { id: 'pre2000', group: 'era', filter: { before: 2000 } },
  c21: { id: 'c21', group: 'era', filter: { from: 2000 } },
} as const satisfies Record<string, ThemeDef>;

export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
/** Themes offered in the Themes mode (the plain classic twist is not a pool). */
export const THEME_CHOICES: ThemeId[] = THEME_IDS.filter((id) => id !== 'no10');
export const isThemeId = (x: string): x is ThemeId => Object.prototype.hasOwnProperty.call(THEMES, x);

export function matches(t: TeamEra, f: PoolFilter): boolean {
  if (f.kinds && !f.kinds.includes(t.kind)) return false;
  if (f.countries && !f.countries.includes(t.country)) return false;
  if (f.comps && !f.comps.includes(t.comp)) return false;
  if (f.buckets && !f.buckets.includes(t.bucket)) return false;
  if (f.before !== undefined && !(t.mid < f.before)) return false;
  if (f.from !== undefined && !(t.mid >= f.from)) return false;
  if (f.champions && !isChampionTeam(t)) return false;
  if (f.rwcOrSlam && !(t.titles ?? []).some((x) => x.startsWith('rwc:') || x.startsWith('gs:'))) return false;
  return true;
}

const cache = new Map<ThemeId, TeamEra[]>();
export function themeTeams(id: ThemeId): TeamEra[] {
  let ts = cache.get(id);
  if (!ts) { ts = TEAMS.filter((t) => matches(t, THEMES[id].filter)); cache.set(id, ts); }
  return ts;
}
