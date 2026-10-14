import type { PlayerEra, TeamEra } from '../data/schema';
import { TEAM_BY_ID } from '../data/index';
import type { Dim, Pos, Role } from '../engine/rugby';
import { SLOTS } from '../engine/rugby';
import { fmtNumber, has, t } from './i18n';

export const posShort = (p: Pos) => t(`pos.${p}`);
export const posName = (p: Pos) => t(`posName.${p}`);
export const slotPos = (n: number) => SLOTS.find((s) => s.n === n)!.pos;
export const shirtName = (n: number) => t(`shirt.${n}`);
export const roleName = (r: Role) => t(`role.${r}`);
export const dimName = (d: Dim) => t(`dim.${d}`);
export const dimShort = (d: Dim) => t(`dimShort.${d}`);
export const natName = (c: string) => (has(`nat.${c}`) ? t(`nat.${c}`) : c);
export const teamName = (tm: TeamEra) => (has(`team.${tm.team}`) ? t(`team.${tm.team}`) : tm.name);
export const teamLabel = (tm: TeamEra) => `${teamName(tm)} ${tm.era}`;
export const teamOfPlayer = (p: PlayerEra) => TEAM_BY_ID.get(p.teamEra)!;
export const upper = (s: string) => s.toLocaleUpperCase();
/** +3, −12, +10,3 (locale decimal separator) */
export const signed = (n: number) => { const s = fmtNumber(Math.abs(Math.round(n * 10) / 10)); return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s; };
export const oppLabel = (id: string, fallback: string) => { const tm = TEAM_BY_ID.get(id); return tm ? teamLabel(tm) : fallback; };
