import {
  TEAMS, NATION_TEAMS, isChampionTeam, teamsOfClub, teamsOfCountry, PLAYER_OF_THE_YEAR, type TeamEra, type Bucket, BUCKETS, ONE_CLUB_KEYS, ONE_COUNTRY_KEYS,
} from '../data/index';
import { isoWeek, Rng } from './rng';
import { THEMES, THEME_CHOICES, isThemeId, themeTeams, type ThemeDef, type ThemeId } from './themes';

export type ModeId =
  | 'classic' | 'iq' | 'daily' | 'eralock' | 'noreroll'
  | 'nations' | 'oneclub' | 'onecountry' | 'champions' | 'worldxv' | 'weekly'
  | 'blitz' | 'cult' | 'mystery' | 'position' | 'gauntlet'
  | 'liveduel' | 'party' | 'shared' | 'coop' | 'theme';

export type ModeGroup = 'core' | 'social' | 'history' | 'skill' | 'identity';
export interface ModeDef {
  id: ModeId;
  group: ModeGroup;
  /** needs a parameter chosen by the player (period, club, country) */
  param?: 'bucket' | 'club' | 'country' | 'theme';
  hideRatings?: boolean;
  hideTeam?: boolean;
  rerolls: number;
  timer?: number;
  maxRating?: number;
  positionDraft?: boolean;
  gauntlet?: boolean;
  live?: boolean;
}

export const MODES: Record<ModeId, ModeDef> = {
  classic: { id: 'classic', group: 'core', rerolls: 1 },
  iq: { id: 'iq', group: 'core', rerolls: 1, hideRatings: true },
  daily: { id: 'daily', group: 'core', rerolls: 1 },
  eralock: { id: 'eralock', group: 'history', rerolls: 1, param: 'bucket' },
  noreroll: { id: 'noreroll', group: 'skill', rerolls: 0 },
  nations: { id: 'nations', group: 'history', rerolls: 1 },
  oneclub: { id: 'oneclub', group: 'history', rerolls: 1, param: 'club' },
  onecountry: { id: 'onecountry', group: 'history', rerolls: 1, param: 'country' },
  champions: { id: 'champions', group: 'history', rerolls: 1 },
  worldxv: { id: 'worldxv', group: 'identity', rerolls: 1 },
  weekly: { id: 'weekly', group: 'core', rerolls: 1 },
  blitz: { id: 'blitz', group: 'skill', rerolls: 1, timer: 8 },
  cult: { id: 'cult', group: 'skill', rerolls: 1, maxRating: 86 },
  mystery: { id: 'mystery', group: 'skill', rerolls: 1, hideRatings: true, hideTeam: true },
  position: { id: 'position', group: 'skill', rerolls: 1, positionDraft: true },
  gauntlet: { id: 'gauntlet', group: 'skill', rerolls: 1, gauntlet: true },
  liveduel: { id: 'liveduel', group: 'social', rerolls: 0, live: true },
  party: { id: 'party', group: 'social', rerolls: 1, live: true },
  shared: { id: 'shared', group: 'social', rerolls: 0, live: true },
  /** two players build ONE XV, alternating picks */
  coop: { id: 'coop', group: 'social', rerolls: 0, live: true },
  /** any pool of the theme registry (featured.ts): one engine, one screen, many themes */
  theme: { id: 'theme', group: 'history', rerolls: 1, param: 'theme' },
};
export const MODE_ORDER: ModeId[] = ['classic', 'iq', 'daily', 'weekly', 'liveduel', 'party', 'shared', 'nations', 'eralock', 'oneclub', 'onecountry', 'champions', 'worldxv', 'noreroll', 'blitz', 'cult', 'mystery', 'position', 'gauntlet', 'coop', 'theme'];
/** Modes playable solo from the Modes screen (live ones open a room). */
export const SOLO_MODES = MODE_ORDER.filter((m) => !MODES[m].live);

/* ------------------------------------------------------- weekly themes */

/** Weekly rotation: the ids index the theme registry (themes.ts). The first nine keep their historical order. */
export type WeeklyId = ThemeId;
export const WEEKLY: ThemeId[] = ['amateur', 'south', 'nopoty', 'champions', 'top14', 'sixnations', 'earlypro', 'no10', 'rwc', 'clubs', 'prem', 'super', 'pre2000', 'c21', 'lions', 'top14c'];
export function weeklyFor(date: Date): { id: ThemeId; week: number; year: number; until: Date } {
  const { year, week } = isoWeek(date);
  const id = WEEKLY[(year * 53 + week) % WEEKLY.length];
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  const until = new Date(d.getTime() + (7 - day) * 86400000);
  return { id, week, year, until };
}

/** Persons excluded by a theme (No Player of the Year). */
export function themeExcludedPersons(id?: string): Set<string> {
  if (id && isThemeId(id) && (THEMES[id] as ThemeDef).excludePoty) return new Set(Object.keys(PLAYER_OF_THE_YEAR));
  return new Set();
}

/* -------------------------------------------------------------- pools */

export interface PoolSpec { teams: TeamEra[]; allowRepeats: boolean; distinctTeamKey?: boolean }
export function poolFor(mode: ModeId, param?: string): PoolSpec {
  switch (mode) {
    case 'nations': return { teams: NATION_TEAMS, allowRepeats: false };
    case 'worldxv': return { teams: NATION_TEAMS.filter((t) => t.country !== 'LIO'), allowRepeats: false, distinctTeamKey: true };
    case 'champions': return { teams: TEAMS.filter(isChampionTeam), allowRepeats: false };
    case 'oneclub': return { teams: teamsOfClub(param && ONE_CLUB_KEYS.includes(param) ? param : ONE_CLUB_KEYS[0]), allowRepeats: true };
    case 'onecountry': {
      const c = param && ONE_COUNTRY_KEYS.includes(param) ? param : ONE_COUNTRY_KEYS[0];
      const ts = teamsOfCountry(c);
      return { teams: ts, allowRepeats: ts.length < 15 };
    }
    case 'eralock': {
      const b = (BUCKETS.includes(param as Bucket) ? param : 'now') as Bucket;
      const ts = TEAMS.filter((t) => t.bucket === b);
      return { teams: ts, allowRepeats: ts.length < 15 };
    }
    case 'weekly':
    case 'theme': {
      const ts = themeTeams(param && isThemeId(param) ? param : 'no10');
      return { teams: ts, allowRepeats: ts.length < 15 };
    }
    default: return { teams: TEAMS, allowRepeats: false };
  }
}

/** Random parameter when the player lets the draw decide. */
export function randomParam(mode: ModeId, seed: number): string | undefined {
  const rng = new Rng(`param:${mode}:${seed}`);
  if (mode === 'eralock') return rng.pick(BUCKETS);
  if (mode === 'oneclub') return rng.pick(ONE_CLUB_KEYS);
  if (mode === 'onecountry') return rng.pick(ONE_COUNTRY_KEYS);
  if (mode === 'theme') return rng.pick(THEME_CHOICES);
  return undefined;
}
