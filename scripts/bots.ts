import { botDraft as engineBotDraft, type BotKind } from '../src/engine/bot';
import type { DraftConfig, DraftState } from '../src/engine/draft';
import { teamProfile } from '../src/engine/team';
import { byKey, sideFromProfile } from '../src/engine/season';

export type Bot = BotKind;
export const botDraft = (cfg: DraftConfig, bot: Bot, rng: () => number = Math.random): DraftState => engineBotDraft(cfg, bot, rng);

export function sideOf(s: DraftState) {
  const prof = teamProfile(s.lineup, byKey, s.cfg.plan);
  return { prof, side: sideFromProfile('you', 'ERA XV', prof) };
}
