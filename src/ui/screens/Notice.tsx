import React from 'react';
import { Button, Screen, TopBar } from '../components/ui';
import { t } from '../i18n';

export type NoticeId = 'malformed' | 'outdated' | 'invalid' | 'score_mismatch' | 'replay' | 'lineup' | 'wrong_draw' | 'resume_corrupt' | 'resume_outdated' | 'crash';

/** A recoverable dead end: what happened, in one sentence, and a way forward. Never a blank screen. */
export function Notice({ id, onHome, onPlay, onBack }: { id: NoticeId; onHome: () => void; onPlay: () => void; onBack?: () => void }) {
  return (
    <Screen>
      <TopBar onHome={onHome} />
      <div className="flex min-h-[60vh] flex-col justify-center">
        <p className="eyebrow text-[11px] text-loss">{t('notice3.kicker')}</p>
        <h1 className="display mt-2 text-[38px] font-black leading-[0.95]">{t(`notice3.${id}.title`)}</h1>
        <p className="mt-3 max-w-[42ch] text-[15px] text-ash-2">{t(`notice3.${id}.body`)}</p>
        <div className="mt-6 grid gap-3">
          <Button variant="primary" onClick={onPlay}>{t('notice3.play')}</Button>
          {onBack ? <Button onClick={onBack}>{t('common.back')}</Button> : null}
          <Button onClick={onHome}>{t('notice3.home')}</Button>
        </div>
      </div>
    </Screen>
  );
}
