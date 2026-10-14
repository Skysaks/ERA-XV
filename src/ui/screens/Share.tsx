import React, { useEffect, useRef, useState } from 'react';
import { MODES, standingOf } from '../../engine/index';
import { Button, Chip, Sheet, copyText, useToast } from '../components/ui';
import { signed } from '../format';
import { fmtDate, ordinal, t } from '../i18n';
import { tokenFor, type GameResult } from '../game';
import { renderCard, type CardFormat, type RenderedCard } from '../shareCard';
import { canSaveImage, saveImage, shareLink } from '../share';
import { recordSent } from '../challenges';
import { track } from '../analytics';
import { standingLabel, type CompareView } from './Result';

export type ShareKind = 'challenge' | 'result' | 'rematch' | 'daily';

/**
 * One sheet for every share: a link that rebuilds the exact draw, a text, and a card (9:16 story or 4:5 post).
 * The link is always visible and selectable, so sharing never depends on the clipboard alone.
 */
export function ShareSheet({ open, kind, onClose, result, name: initialName, compare, buildUrl, onName }: {
  open: boolean; kind: ShareKind; onClose: () => void; result: GameResult; name: string; compare?: CompareView; buildUrl: (token: string) => string; onName?: (n: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [format, setFormat] = useState<CardFormat>('story');
  const [card, setCard] = useState<RenderedCard | null | 'error'>(null);
  const [canSave, setCanSave] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const { season, gauntlet, session } = result;
  const mode = MODES[session.state.cfg.mode];
  const where = season ? standingLabel(season) : gauntlet ? t('gauntlet.legendsN', { n: gauntlet.beaten, max: gauntlet.max }) : '';
  const day = session.daily ? fmtDate(new Date(`${session.daily}T12:00:00Z`), { day: 'numeric', month: 'short' }) : '';
  const token = tokenFor(session, result.points, season?.w ?? gauntlet?.beaten ?? 0, name, kind === 'rematch');
  const url = buildUrl(token);
  const text = kind === 'rematch' && compare
    ? (result.points > compare.theirPoints ? t('shareText.win', { name: compare.name, a: result.points, b: compare.theirPoints })
      : result.points < compare.theirPoints ? t('shareText.loss', { name: compare.name, a: result.points, b: compare.theirPoints })
        : t('shareText.draw', { name: compare.name, a: result.points, b: compare.theirPoints }))
    : kind === 'daily' ? t('share3.dailyText', { day, where, pts: result.points })
      : gauntlet ? t('shareText.gauntlet', { pts: result.points, max: result.max }) : t('shareText.challenge2', { where, pts: result.points });

  useEffect(() => { void canSaveImage().then(setCanSave); }, []);
  // a challenge link exists as soon as the sheet opens (sharing it is tracked separately)
  useEffect(() => { if (open) track('challenge_created', { kind, mode: session.state.cfg.mode, daily: !!session.daily }); }, [open, kind]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setCard(null);
    const h = setTimeout(() => {
      renderCard({
        format,
        headline: season ? t(`standing.${standingOf(season)}`) : where,
        big: season ? ordinal(season.position) : undefined,
        kicker: kind === 'daily' ? t('share3.dailyKicker', { day }) : name ? t('card.nameXV', { name }) : t('card.myXV'),
        gold: season?.finish === 'champion' || (!!gauntlet && gauntlet.beaten === gauntlet.max),
        stats: season ? t('card.stats', { pts: season.points, w: season.w, d: season.d, l: season.l, diff: signed(season.pf - season.pa), bp: season.tb + season.lb }) : `${result.points} / ${result.max}`,
        sub: `${t(`plan.${session.plan}.name`)} · ${t('stat.fit')} ${result.prof.fit}`,
        lineup: session.lineup, hideRatings: !!mode.hideRatings,
        sheetTitle: t('sheet.title'),
        tagline: kind === 'result' ? t('card.yourTurn') : t('card.canYou'),
        footer: t('share3.footer'),
        mode: session.daily ? t('daily.title') : t(`mode.${session.state.cfg.mode}.name`),
      }).then((c) => { if (alive) setCard(c); }).catch(() => { if (alive) setCard('error'); });
    }, 120); // typing a name does not re-render the card on every key
    return () => { alive = false; clearTimeout(h); };
  }, [open, name, kind, format]); // eslint-disable-line react-hooks/exhaustive-deps

  const sent = () => {
    if (kind === 'rematch') return;
    recordSent(token, session.daily);
    track('challenge_shared', { kind, mode: session.state.cfg.mode, daily: !!session.daily });
  };
  const doShare = async () => {
    track('share_clicked', { kind, format, via: 'share' });
    const file = card && card !== 'error' && card.blob ? new File([card.blob], `era-xv-${format}.png`, { type: 'image/png' }) : null;
    const out = await shareLink({ title: 'ERA XV', text, url, file });
    track('share_completed', { kind, outcome: out });
    if (out === 'cancelled') return;
    sent();
    if (out === 'copied') toast(t('share.copied'));
    else if (out === 'shared') toast(t('share3.done'));
    else { toast(t('share.select')); linkRef.current?.focus(); linkRef.current?.select(); }
  };
  const doCopy = async () => {
    track('share_clicked', { kind, format, via: 'copy' });
    const ok = await copyText(url);
    sent();
    if (ok) toast(t('share.copied')); else { toast(t('share.select')); linkRef.current?.focus(); linkRef.current?.select(); }
  };
  const doSave = async () => {
    if (!card || card === 'error' || !card.blob) return;
    track('share_clicked', { kind, format, via: 'image' });
    const out = await saveImage(card.blob, `era-xv-${session.daily ?? 'xv'}-${format}.png`);
    if (out === 'saved') toast(t('share3.saved'));
    else if (out === 'unavailable') { setCanSave(false); toast(t('share.longpress')); }
  };

  const title = kind === 'rematch' ? t('share.rematchTitle', { name: compare?.name ?? '' }) : kind === 'daily' ? t('share3.dailyTitle') : kind === 'challenge' ? t('share.challengeTitle2') : t('share.resultTitle');
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-[14px] text-ash-2">{kind === 'rematch' ? t('share3.replyNote', { name: compare?.name ?? '' }) : t('share.fair')}</p>
        <div>
            <label htmlFor="share-name" className="text-[14px] text-ash-2">{t('share.name')}</label>
            <input id="share-name" value={name} maxLength={20} autoComplete="nickname" onChange={(e) => { setName(e.target.value.slice(0, 20)); }} onBlur={() => onName?.(name.trim())}
              placeholder={t('share.namePlaceholder')} className="mt-1.5 h-11 w-full rounded-lg border border-line-2 bg-ink px-3 text-[16px] focus:border-brass focus:outline-none" />
            <p className="mt-1 text-[11.5px] text-ash">{t('share3.pseudoNote')}</p>
        </div>
        <div>
          <label htmlFor="share-link" className="text-[12px] text-ash">{t('share.linkAria')}</label>
          <input id="share-link" ref={linkRef} readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="mt-1 h-11 w-full rounded-lg border border-line bg-ink px-3 text-[16px] text-ash-2" />
        </div>
        <Button variant="primary" onClick={doShare}>{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? t('share3.share') : t('share.copyInvite')}</Button>
        <div className={`grid gap-3 ${canSave ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Button onClick={doCopy}>{t('share.copy')}</Button>
          {canSave ? <Button onClick={doSave} disabled={!card || card === 'error'}>{t('share3.saveImage')}</Button> : null}
        </div>
        <div role="radiogroup" aria-label={t('share3.format')} className="flex items-center gap-2">
          <span className="text-[13px] text-ash">{t('share3.format')}</span>
          {(['story', 'post'] as CardFormat[]).map((f) => <Chip key={f} role="radio" aria-checked={format === f} active={format === f} onClick={() => setFormat(f)} className="h-9 text-[15px]">{t(`share3.fmt.${f}`)}</Chip>)}
        </div>
        {card === null ? <p className="text-[14px] text-ash">{t('share.rendering')}</p> : card !== 'error' ? (
          <img src={card.url} alt={t('share.previewAlt')} className={`mx-auto w-full rounded-lg border border-line ${format === 'story' ? 'max-w-[240px]' : 'max-w-[300px]'}`} />
        ) : null}
        <p className="text-[12px] text-ash">{canSave ? t('share3.imageNote') : t('share.longpress')}</p>
      </div>
    </Sheet>
  );
}

