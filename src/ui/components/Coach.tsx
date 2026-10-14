import React, { useState } from 'react';
import { t } from '../i18n';
import { loadOnboarding, loadRecords, saveOnboarding } from '../store';
import { track } from '../analytics';

export type CoachStep = 'pick' | 'positions' | 'units' | 'plan';
export const COACH_STEPS: CoachStep[] = ['pick', 'positions', 'units', 'plan'];

/** First game only: a newcomer is someone who never finished a season here and never skipped the tips. */
export function coachActive(): boolean {
  const o = loadOnboarding();
  return !o.done && (o.forced === true || loadRecords().games === 0);
}
export function finishCoach() {
  const o = loadOnboarding();
  if (!o.done) saveOnboarding({ ...o, done: true, forced: false });
}

/**
 * One contextual tip, shown once, never blocking: the cards stay tappable underneath and around it.
 * "Skip the tips" ends the whole walkthrough for good.
 */
export function Coach({ step, when = true }: { step: CoachStep; when?: boolean }) {
  const [o, setO] = useState(loadOnboarding);
  const [active] = useState(coachActive);
  if (!active || o.done || !when || o.seen.includes(step)) return null;
  const n = COACH_STEPS.indexOf(step) + 1;
  const ok = () => {
    const next = { ...o, seen: [...o.seen, step], done: o.done || step === 'plan' };
    saveOnboarding(next); setO(next);
    track('onboarding_step', { step, n });
  };
  const skip = () => {
    const next = { ...o, done: true };
    saveOnboarding(next); setO(next);
    track('onboarding_skipped', { at: step });
  };
  return (
    <aside className="animate-rise rounded-lg border border-brass/60 bg-ink-3 px-3.5 py-2.5" aria-label={t('coach.aria', { n, max: COACH_STEPS.length })}>
      <p className="eyebrow text-[10px] text-brass">{t('coach.step', { n, max: COACH_STEPS.length })}</p>
      <p className="display mt-0.5 text-[20px] font-black leading-tight">{t(`coach.${step}.title`)}</p>
      <p className="mt-0.5 text-[13.5px] leading-snug text-ash-2">{t(`coach.${step}.body`)}</p>
      <div className="mt-2 flex items-center gap-4">
        <button type="button" onClick={ok} className="display min-h-10 rounded-md bg-brass px-3.5 text-[16px] font-extrabold text-ink">{t('coach.ok')}</button>
        <button type="button" onClick={skip} className="min-h-10 text-[13px] text-ash underline-offset-2 hover:text-chalk hover:underline">{t('coach.skip')}</button>
      </div>
    </aside>
  );
}
