import { PLAYER_BY_KEY } from '../data/index';
import { SLOTS, isInPosition } from './rugby';
import { place, posRating } from './team';
import { canReroll, newDraft, pickOption, reroll, ROUNDS, type DraftConfig, type DraftState } from './draft';

const P = (k: string) => PLAYER_BY_KEY.get(k)!;
export type BotKind = 'competent' | 'star' | 'random';

/** Sum of position ratings, minus a penalty for anyone out of position. */
export function lineupValue(keys: string[]): number {
  const l = place(keys.map(P));
  let v = 0;
  for (const s of SLOTS) {
    const k = l[s.n];
    if (!k) continue;
    const pr = posRating(P(k), s.pos);
    v += pr.rating - (isInPosition(pr.kind) ? 0 : 10);
  }
  return v;
}

/** The house bot's choice for the current offer. */
export function botChoice(s: DraftState, kind: BotKind = 'competent', rnd: () => number = Math.random): number {
  const opts = s.offer?.options ?? [];
  if (!opts.length) return 0;
  if (kind === 'random') return Math.floor(rnd() * opts.length);
  if (kind === 'star') return 0;
  let best = -Infinity, idx = 0;
  opts.forEach((k, i) => { const v = lineupValue([...s.picks, k]); if (v > best) { best = v; idx = i; } });
  return idx;
}

export function botDraft(cfg: DraftConfig, kind: BotKind = 'competent', rnd: () => number = Math.random, exclude: string[] = []): DraftState {
  let s = newDraft(cfg, exclude);
  while (s.round < ROUNDS) {
    if (kind === 'competent' && canReroll(s)) {
      const best = Math.max(...s.offer!.options.map((k) => lineupValue([...s.picks, k])));
      if (best - lineupValue(s.picks) < 70) { s = reroll(s); continue; }
    }
    s = pickOption(s, botChoice(s, kind, rnd));
  }
  return s;
}
