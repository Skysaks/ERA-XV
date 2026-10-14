/**
 * Qualitative traits of a player-era. Extensible registry: a trait is only given when the data supports it.
 * - captain: listed in data/captains.ts for that team-era
 * - poty: World Rugby Player of the Year during that era
 * - goalKicker: an explicit goal-kicking value (gk ≥ 80) in the data
 * - utility: listed at three or more back positions
 * - role traits (jackal, lineout boss…): the player's role in the data
 * Nothing here changes a rating, a FIT or a season.
 */
import type { PlayerEra } from '../data/schema';
import { PLAYER_OF_THE_YEAR, TEAM_BY_ID } from '../data/index';
import { CAPTAINS } from '../data/captains';
import { isForward, type Role } from './rugby';

export type TraitId =
  | 'captain' | 'poty' | 'goalKicker' | 'utility'
  | 'jackal' | 'lineoutBoss' | 'scrummager' | 'ballCarrier' | 'finisher' | 'highBall' | 'playmaker' | 'distributor' | 'defensiveLeader';

/** Traits that say more than the role label already shown on a card. */
export const HEADLINE_TRAITS: TraitId[] = ['captain', 'poty', 'goalKicker', 'utility'];

const ROLE_TRAIT: Partial<Record<Role, TraitId>> = {
  FJ: 'jackal', LC: 'lineoutBoss', PS: 'scrummager', NP: 'ballCarrier', PC: 'ballCarrier', '12C': 'ballCarrier', WP: 'ballCarrier',
  WF: 'finisher', WA: 'highBall', FS: 'highBall', '10G': 'playmaker', '10R': 'playmaker', '12P': 'playmaker', '9T': 'distributor', '13D': 'defensiveLeader', FT: 'defensiveLeader',
};

const CACHE = new Map<string, TraitId[]>();
export function traitsOf(p: PlayerEra): TraitId[] {
  const hit = CACHE.get(p.key);
  if (hit) return hit;
  const out: TraitId[] = [];
  if (CAPTAINS[p.teamEra] === p.person) out.push('captain');
  const team = TEAM_BY_ID.get(p.teamEra);
  const poty = PLAYER_OF_THE_YEAR[p.person];
  if (team && poty?.some((y) => y >= team.years[0] && y <= team.years[1])) out.push('poty');
  if (p.kicker) out.push('goalKicker');
  if (p.pos.filter((x) => !isForward(x)).length >= 3) out.push('utility');
  const r = ROLE_TRAIT[p.role];
  if (r) out.push(r);
  CACHE.set(p.key, out);
  return out;
}

export const headlineTraits = (p: PlayerEra) => traitsOf(p).filter((x) => HEADLINE_TRAITS.includes(x));
export const isCaptain = (p: PlayerEra) => CAPTAINS[p.teamEra] === p.person;
