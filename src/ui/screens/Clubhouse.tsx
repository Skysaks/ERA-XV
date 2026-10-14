import React, { useEffect, useMemo, useState } from 'react';
import { Button, IconArrow, IconBack, IconButton, Ord, Panel, Screen } from '../components/ui';
import { upper } from '../format';
import { t } from '../i18n';
import { connectRoom, type RoomKind } from '../room/transport';
import { challengeCounts } from '../challenges';
import { friendsDailyBoard } from '../leaderboard';
import type { DailyView } from '../daily';
import type { describe } from '../resume';
import type { Records } from '../store';
import { DailyCard } from './Home';

type Live = 'checking' | 'on' | 'off';

/**
 * The social hub. Asynchronous first (links work for anyone, any time); live rooms only where the page really can
 * reach other players, and said so plainly when it cannot.
 */
export function Clubhouse({ onBack, onLive, onPractice, onChallenge, onPasteCode, onMine, onHistory, records, daily, resume, dailyActions }: {
  onBack: () => void; onLive: (k: RoomKind) => void; onPractice: (k: RoomKind) => void; onChallenge: () => void; onPasteCode: (code: string) => void;
  onMine: () => void; onHistory: () => void; records: Records; daily: DailyView; resume: ReturnType<typeof describe>;
  dailyActions: { onPlay: () => void; onResume: () => void; onShare: () => void; onPractice: () => void };
}) {
  const [live, setLive] = useState<Live>('checking');
  const [code, setCode] = useState('');
  useEffect(() => {
    let alive = true;
    connectRoom().then((c) => { if (alive) setLive(c ? 'on' : 'off'); });
    return () => { alive = false; };
  }, []);
  const cc = useMemo(() => challengeCounts(), []);
  // local + friends' verified links only: no server board exists (leaderboard.ts)
  const board = useMemo(() => friendsDailyBoard(daily.day), [daily]);

  return (
    <Screen>
      <div className="flex min-h-12 items-center gap-2">
        <IconButton label={t('common.back')} onClick={onBack} className="-ml-2.5"><IconBack className="h-6 w-6" /></IconButton>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[10.5px] text-brass">{t('club.kicker')}</p>
          <h1 className="display text-[30px] font-black">{t('club.title')}</h1>
        </div>
      </div>
      <p className="mt-1 text-[15px] text-ash-2">{t('club3.intro')}</p>

      <DailyCard d={daily} resume={resume} compact {...dailyActions} />

      <div className="mt-4 flex flex-col gap-3">
        <Panel label={t('club3.challenges')}>
          <div className="px-4 py-3">
            <Button variant="ivory" className="w-full" onClick={onChallenge}>{t('home2.challenge')}</Button>
            <button type="button" onClick={onMine} className="mt-3 flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-left hover:border-line-2">
              <span className="min-w-0">
                <span className="display block text-[19px] font-extrabold">{t('mine.title')}</span>
                <span className="block text-[12.5px] text-ash">{t('club3.mineLine', { play: cc.toPlay, wait: cc.awaiting, won: cc.won, lost: cc.lost })}</span>
              </span>
              {cc.toPlay ? <span className="mono shrink-0 rounded-full bg-brass px-2 py-0.5 text-[12px] font-semibold text-ink">{cc.toPlay}</span> : <IconArrow className="h-5 w-5 shrink-0 text-ash-2" />}
            </button>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) onPasteCode(code.trim()); }}>
              <label htmlFor="club-code" className="sr-only">{t('modes.codeLabel')}</label>
              <input id="club-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('club.link.paste')} autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-lg border border-line-2 bg-ink px-3 text-[16px] text-chalk placeholder:text-ash focus:border-brass focus:outline-none" />
              <Button size="sm" className="h-11" type="submit" disabled={!code.trim()}>{t('modes.open')}</Button>
            </form>
          </div>
        </Panel>

        <Panel label={t('club3.board')} aside={<span className="mono text-[11px] text-ash">{t('club3.boardLocal')}</span>}>
          {board.length > (daily.entry ? 1 : 0) ? (
            <ol className="divide-y divide-line">
              {board.map((r, i) => (
                <li key={i} className={`flex items-center gap-3 px-4 py-2.5 ${r.me ? 'text-brass' : ''}`}>
                  <span className="display tnum w-6 text-[20px] font-black">{i + 1}</span>
                  <span className="min-w-0 flex-1 break-words text-[15px] font-semibold">{r.me ? t('common.you') : upper(r.name || t('ch.yourFriend'))}</span>
                  {r.pos ? <span className="mono text-[12px] text-ash-2"><Ord n={r.pos} /></span> : null}
                  <span className="display tnum w-10 text-right text-[22px] font-black">{r.pts}</span>
                </li>
              ))}
            </ol>
          ) : <p className="px-4 py-3 text-[14px] text-ash-2">{t('club3.boardEmpty')}</p>}
          <p className="border-t border-line px-4 py-2 text-[11.5px] text-ash">{t('club3.boardNote')}</p>
        </Panel>

        <div role="region" aria-labelledby="club-live">
          <h2 id="club-live" className="eyebrow mt-2 text-[12px] text-ash-2">{t('club3.live')}</h2>
          <p className={`mono mt-1 text-[12px] ${live === 'on' ? 'text-win' : 'text-ash'}`} aria-live="polite">
            {live === 'checking' ? t('club.checking') : live === 'on' ? `● ${t('club.liveOn')}` : `○ ${t('club.liveOff')}`}
          </p>
          {live === 'off' ? <p id="club-off" className="mt-1 text-[12.5px] text-ash">{t('club.offNote')}</p> : null}
          <div className="mt-3 flex flex-col gap-3">
            <Format kind="liveduel" title={t('club.duel.title')} lines={[t('club.duel.l1'), t('club.duel.l2'), t('club.duel.l3')]} live={live} onLive={onLive} onPractice={onPractice} create={t('club.duel.create')} />
            <Format kind="party" title={t('club.cup.title')} lines={[t('club.cup.l1'), t('club.cup.l2'), t('club.cup.l3')]} live={live} onLive={onLive} onPractice={onPractice} create={t('club.cup.create')} />
            <Format kind="coop" title={t('club.coop.title')} lines={[t('club.coop.l1'), t('club.coop.l2'), t('club.coop.l3')]} live={live} onLive={onLive} onPractice={onPractice} create={t('club.coop.create')} />
            <Format kind="shared" title={t('club.pool.title')} lines={[t('club.pool.l1'), t('club.pool.l2')]} live={live} onLive={onLive} onPractice={onPractice} create={t('club.pool.create')} compact />
          </div>
        </div>

        <button type="button" onClick={onHistory} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-2 text-left hover:border-line-2">
          <span className="display text-[19px] font-extrabold">{t('club3.history')}</span><IconArrow className="h-5 w-5 text-ash-2" />
        </button>
        {records.duels.w + records.duels.l + records.partiesWon > 0 ? (
          <p className="mono text-[12px] text-ash">{t('club.record', { w: records.duels.w, l: records.duels.l, p: records.partiesWon })}</p>
        ) : null}
      </div>
    </Screen>
  );
}

function Format({ kind, title, lines, live, onLive, onPractice, create, compact }: {
  kind: RoomKind; title: string; lines: string[]; live: Live; onLive: (k: RoomKind) => void; onPractice: (k: RoomKind) => void; create: string; compact?: boolean;
}) {
  return (
    <Panel label={title} tone={compact ? undefined : 'brass'}>
      <div className="px-4 py-3">
        <ul className="flex flex-col gap-1 text-[14px] text-ash-2">{lines.map((l, i) => <li key={i}>· {l}</li>)}</ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant={live === 'on' ? 'primary' : 'ghost'} size="sm" className="min-h-11" disabled={live !== 'on'} onClick={() => onLive(kind)}
            aria-describedby={live === 'off' ? 'club-off' : undefined}>{create}</Button>
          <Button size="sm" className="min-h-11" onClick={() => onPractice(kind)}>{t('club.practice')}</Button>
        </div>
      </div>
    </Panel>
  );
}
