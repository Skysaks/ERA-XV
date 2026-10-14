import { parseTeams, type PlayerEra, type TeamEra, type Bucket } from './schema';
import south from './teams/south';
import north from './teams/north';
import world from './teams/world';
import clubsFr from './teams/clubs-fr';
import clubsEn from './teams/clubs-en';
import clubsSouth from './teams/clubs-south';

export * from './schema';

export const TEAMS: TeamEra[] = parseTeams([...south, ...north, ...world, ...clubsFr, ...clubsEn, ...clubsSouth]);
export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));
export const ALL_PLAYERS: PlayerEra[] = TEAMS.flatMap((t) => t.players);
export const PLAYER_BY_KEY = new Map(ALL_PLAYERS.map((p) => [p.key, p]));

/** every version of a person across team-eras */
export const VERSIONS = new Map<string, PlayerEra[]>();
for (const p of ALL_PLAYERS) {
  if (!VERSIONS.has(p.person)) VERSIONS.set(p.person, []);
  VERSIONS.get(p.person)!.push(p);
}

export const teamOf = (p: PlayerEra) => TEAM_BY_ID.get(p.teamEra)!;
export const teamLabel = (t: TeamEra) => `${t.name} ${t.era}`;

/* ------------------------------------------------ structured facts (sourced) */

/** World Rugby (IRB) Player of the Year, 2001–2024 (not awarded in 2020). */
export const PLAYER_OF_THE_YEAR: Record<string, number[]> = {
  'keith-wood': [2001], 'fabien-galthie': [2002], 'jonny-wilkinson': [2003], 'schalk-burger': [2004],
  'dan-carter': [2005, 2012, 2015], 'richie-mccaw': [2006, 2009, 2010], 'bryan-habana': [2007], 'shane-williams': [2008],
  'thierry-dusautoir': [2011], 'kieran-read': [2013], 'brodie-retallick': [2014], 'beauden-barrett': [2016, 2017],
  'johnny-sexton': [2018], 'pieter-steph-du-toit': [2019, 2024], 'antoine-dupont': [2021], 'josh-van-der-flier': [2022],
  'ardie-savea': [2023],
};

/** Rugby World Cup finals (winner, runner-up, score). */
export const RWC_FINALS: { year: number; winner: string; runnerUp: string; score: string; aet?: boolean }[] = [
  { year: 1987, winner: 'NZL', runnerUp: 'FRA', score: '29–9' },
  { year: 1991, winner: 'AUS', runnerUp: 'ENG', score: '12–6' },
  { year: 1995, winner: 'RSA', runnerUp: 'NZL', score: '15–12', aet: true },
  { year: 1999, winner: 'AUS', runnerUp: 'FRA', score: '35–12' },
  { year: 2003, winner: 'ENG', runnerUp: 'AUS', score: '20–17', aet: true },
  { year: 2007, winner: 'RSA', runnerUp: 'ENG', score: '15–6' },
  { year: 2011, winner: 'NZL', runnerUp: 'FRA', score: '8–7' },
  { year: 2015, winner: 'NZL', runnerUp: 'AUS', score: '34–17' },
  { year: 2019, winner: 'RSA', runnerUp: 'ENG', score: '32–12' },
  { year: 2023, winner: 'RSA', runnerUp: 'NZL', score: '12–11' },
];

export type TitleKind = 'rwc' | 'gs' | 'euro' | 'super' | 'lions' | 'top14' | 'prem' | 'urc';
export function parseTitle(t: string): { kind: TitleKind; year: number } {
  const [k, y] = t.split(':');
  return { kind: k as TitleKind, year: Number(y) };
}
export const MAJOR_TITLES: TitleKind[] = ['rwc', 'euro', 'super'];
export const isChampionTeam = (t: TeamEra) => (t.titles ?? []).some((x) => MAJOR_TITLES.includes(parseTitle(x).kind));

/* ------------------------------------------------------------ groupings */

export const NATION_TEAMS = TEAMS.filter((t) => t.kind === 'nation');
export const CLUB_TEAMS = TEAMS.filter((t) => t.kind === 'club');
export const byBucket = (b: Bucket) => TEAMS.filter((t) => t.bucket === b);

/** clubs with at least three eras → One Club */
export const ONE_CLUB_KEYS: string[] = (() => {
  const c = new Map<string, number>();
  for (const t of CLUB_TEAMS) c.set(t.team, (c.get(t.team) ?? 0) + 1);
  return [...c.entries()].filter(([, n]) => n >= 3).map(([k]) => k).sort();
})();

/** countries with enough history (national sides + clubs) → One Country */
export const ONE_COUNTRY_KEYS = ['FRA', 'NZL', 'ENG', 'IRL', 'RSA', 'AUS', 'WAL'];
export const teamsOfCountry = (c: string) => TEAMS.filter((t) => t.country === c);
export const teamsOfClub = (k: string) => CLUB_TEAMS.filter((t) => t.team === k);

export const NATION_NAMES: Record<string, string> = {
  NZL: 'New Zealand', RSA: 'South Africa', AUS: 'Australia', FRA: 'France', ENG: 'England', IRL: 'Ireland', WAL: 'Wales',
  SCO: 'Scotland', ITA: 'Italy', ARG: 'Argentina', FIJ: 'Fiji', SAM: 'Samoa', TON: 'Tonga', JPN: 'Japan', GEO: 'Georgia',
  CAN: 'Canada', USA: 'United States', ROU: 'Romania', LIO: 'British & Irish Lions',
};
