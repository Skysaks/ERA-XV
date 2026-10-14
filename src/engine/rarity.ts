/**
 * Encounter rarity: how rarely a player VERSION is offered, measured on the real director (scripts/encounters.ts).
 * It is a label, never a weight: draws, ratings, FIT and seasons ignore it, so a Daily or a challenge stays identical
 * for everyone. Rare ≠ strong: the labelled versions average the same rating as the whole base.
 */
import { ENCOUNTERS, ENCOUNTERS_META } from '../data/encounters';
import { DATA_VERSION } from './challenge';
import { ENGINE_VERSION } from './draft';
import type { ModeId } from './modes';

export type Rarity = 'veryRare' | 'rare';
/** Modes drawing from the whole base with the classic director: the only ones the measurement describes. */
export const RARITY_MODES: ModeId[] = ['classic', 'iq', 'daily', 'noreroll', 'blitz'];

/** The table matches the shipped data and draw engine (a stale table shows nothing rather than a wrong label). */
export const rarityFresh = (): boolean => ENCOUNTERS_META.dataVersion === DATA_VERSION && ENCOUNTERS_META.engine === ENGINE_VERSION;

/** `mode` given: only where the measurement applies. `per`: one draft in `per` offers this version. */
export function rarityOf(key: string, mode?: ModeId): { tier: Rarity; per: number } | null {
  if (mode && !RARITY_MODES.includes(mode)) return null;
  if (!rarityFresh()) return null;
  const e = ENCOUNTERS[key];
  if (!e) return null;
  return { tier: e[0] === 2 ? 'veryRare' : 'rare', per: Math.max(2, Math.round(10000 / Math.max(1, e[1]))) };
}

export const RARE_KEYS: string[] = Object.keys(ENCOUNTERS);
export const RARITY_SAMPLE = ENCOUNTERS_META.drafts;
