import React, { useMemo, useState } from 'react';
import { MAX_POINTS, MODES, decodeChallenge, standingOf, verifyGame, type ChallengeToken } from '../../engine/index';
import { Button, Chip, IconArrow, Ord, Panel, Screen, TopBar } from '../components/ui';
import { CompareTable } from '../components/compare';
import { upper } from '../format';
import { fmtDate, t } from '../i18n';
import { P } from '../game';
import { loadChallenges, outcome, stateOf, type ChallengeRec } from '../challenges';
import { PickDiffs } from './Result';

export type DailyContext = { kind: 'officialToday' } | { kind: 'alreadyPlayed'; pts: number } | { kind: 'pastDaily'; day: string } | null;

/** "Florian te défie": the draw is rebuilt from the link, the sender's result recomputed from it. */
export function ChallengeIntro({ token, daily, previous, onPlay, onFresh, onHome, onOpen }: {
  token: ChallengeToken; daily: DailyContext; previous?: ChallengeRec; onPlay: () => void; onFresh: () => void; onHome: () => void; onOpen: (rec: ChallengeRec) => void;
}) {
  const who = token.name || t('ch.yourFriend');
  const gauntlet = !!MODES[token.cfg.mode].gauntlet;
  const v = useMemo(() => verifyGame(token), [token]);
  const season = v.ok ? v.game.season : undefined;
  const answered = previous?.me && previous.them ? previous : undefined;
  return (
    <Screen>
      <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{daily && daily.kind !== 'pastDaily' ? t('daily.title') : token.rematch ? t('ch.rematchTitle') : t('ch.title')}</span>} />
      <h1 className="display mt-3 text-[40px] font-black leading-[0.92] min-[400px]:text-[46px]">{t('ch3.challenges', { name: upper(who) })}</h1>
      <section className="touchlines animate-rise mt-4 rounded-xl border border-line-2 bg-ink-2 px-4 py-4" aria-label={t('ch3.theirResult', { name: who })}>
        <p className="eyebrow text-[10.5px] text-ash">{t('ch.finished', { who: upper(who) })}</p>
        {season ? (
          <div className="mt-1 flex items-end gap-4">
            <Ord n={season.position} className="display tnum text-[80px] font-black leading-[0.8]" />
            <span className="min-w-0 pb-1">
              <span className="display block text-[24px] font-black leading-[0.95]">{t(`standing.${standingOf(season)}`)}</span>
              <span className="mono mt-1 block text-[13px] text-ash-2">{t('ch.ptsLine', { pts: token.points, w: season.w, d: season.d, l: season.l })}</span>
            </span>
          </div>
        ) : (
          <p className="display tnum mt-1 text-[72px] font-black leading-[0.85]">{token.points}<span className="text-[28px] text-ash"> / {gauntlet ? 10 : MAX_POINTS}</span></p>
        )}
      </section>
      <p className="display mt-5 text-[30px] font-black leading-[0.95]">{t('ch3.same1')}<br />{t('ch3.same2')}<br /><span className="text-brass">{t('ch3.same3')}</span></p>
      <p className="mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ash-2">
        <span>{token.cfg.mode === 'daily' ? t('daily.title') : t(`mode.${token.cfg.mode}.name`)}{token.cfg.param && (token.cfg.mode === 'weekly' || token.cfg.mode === 'theme') ? ` · ${t(`weekly.${token.cfg.param}.name`)}` : ''}</span>
        <span>{t(`ruleset.${token.cfg.ruleset}`)}</span>
      </p>
      {daily?.kind === 'officialToday' ? <p className="mt-3 rounded-lg border border-brass/50 bg-brass/[0.07] px-3 py-2 text-[13.5px] text-chalk">{t('ch3.countsAsDaily')}</p> : null}
      {daily?.kind === 'alreadyPlayed' ? <p className="mt-3 rounded-lg border border-line px-3 py-2 text-[13.5px] text-ash-2">{t('ch3.dailyDone', { pts: daily.pts })}</p> : null}
      {daily?.kind === 'pastDaily' ? <p className="mt-3 rounded-lg border border-line px-3 py-2 text-[13.5px] text-ash-2">{t('ch3.pastDaily', { day: fmtDate(new Date(`${daily.day}T12:00:00Z`), { day: 'numeric', month: 'long' }) })}</p> : null}
      {answered ? (
        <>
          <p className="mt-4 text-[14px] text-ash-2">{t('ch3.alreadyAnswered', { a: answered.me!.pts, b: answered.them!.pts })}</p>
          <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => onOpen(answered)}>{t('ch3.seeComparison')} <IconArrow className="h-6 w-6" /></Button>
          <button type="button" onClick={onPlay} className="mt-3 min-h-11 w-full text-center text-[14px] text-ash-2 underline underline-offset-2 hover:text-chalk">{t('ch3.playAgainPractice')}</button>
        </>
      ) : (
        <Button variant="primary" size="lg" className="mt-6 w-full" onClick={onPlay}>{t('ch3.accept')} <IconArrow className="h-6 w-6" /></Button>
      )}
      <button type="button" onClick={onFresh} className="mt-3 min-h-11 w-full text-center text-[14px] text-ash-2 underline underline-offset-2 hover:text-chalk">{t('ch.fresh')}</button>
    </Screen>
  );
}

/** A finished challenge, rebuilt from the two links: standing, points, cohesion, difference, bonus, choices. */
export function ChallengeDetail({ rec, onBack, onNewChallenge, onViewMine }: { rec: ChallengeRec; onBack: () => void; onNewChallenge: () => void; onViewMine?: () => void }) {
  const me = rec.me!, them = rec.them!;
  const o = outcome(rec);
  const diffs = useMemo(() => {
    const a = decodeChallenge(me.token), b = decodeChallenge(them.token);
    if (!a.ok || !b.ok) return [];
    return a.t.picks.map((k, r) => ({ r, k, o: b.t.picks[r] })).filter((x) => x.o && x.k !== x.o).map((x) => ({ round: x.r + 1, yours: P(x.k), theirs: P(x.o) }));
  }, [me.token, them.token]);
  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<span className="eyebrow text-[11px] text-brass">{rec.daily ? t('daily.title') : t('ch.duelTitle')}</span>} />
      <Panel className="animate-rise mt-3" tone={o === 'win' ? 'win' : o === 'loss' ? 'loss' : undefined} label={rec.daily ? fmtDate(new Date(`${rec.daily}T12:00:00Z`), { day: 'numeric', month: 'long' }) : t(`mode.${rec.draw.mode}.name`)}>
        <div className="px-4 pt-3">
          <p className={`display text-[34px] font-black leading-none ${o === 'win' ? 'text-win' : o === 'loss' ? 'text-loss' : 'text-chalk'}`}>
            {o === 'win' ? `▲ ${t('ch.youWin')}` : o === 'loss' ? `▼ ${t('ch.theyWin', { name: them.name || t('ch.yourFriend') })}` : t('ch.deadHeat')}
          </p>
          <p className="text-[14px] text-ash-2">{me.pts === them.pts ? t('ch.level') : t('ch.by', { n: Math.abs(me.pts - them.pts) })}</p>
        </div>
        <div className="mt-3 px-4">
          <CompareTable a={{ ...me, name: t('common.you'), me: true }} b={{ ...them, name: them.name || t('ch.yourFriend'), me: false }} />
        </div>
        <div className="px-4 pb-4">
          <p className="eyebrow mt-3 text-[11px] text-brass">{diffs.length ? t('cmp.choices', { n: diffs.length }) : t('ch.identical')}</p>
          {diffs.length ? <PickDiffs diffs={diffs} /> : null}
        </div>
      </Panel>
      <div className="mt-4 grid gap-3">
        <Button variant="primary" onClick={onNewChallenge}>{t('ch3.newOne')}</Button>
        {onViewMine ? <Button onClick={onViewMine}>{t('ch3.viewMine')}</Button> : null}
      </div>
    </Screen>
  );
}

type Tab = 'open' | 'done';
/** My challenges: to play, awaiting a reply, finished. Everything stays on this device. */
export function ChallengesScreen({ onBack, onPlay, onOpen, onNew }: { onBack: () => void; onPlay: (rec: ChallengeRec) => void; onOpen: (rec: ChallengeRec) => void; onNew: () => void }) {
  const xs = useMemo(() => loadChallenges().slice().sort((a, b) => b.updatedAt - a.updatedAt), []);
  const open = xs.filter((c) => stateOf(c) !== 'done');
  const done = xs.filter((c) => stateOf(c) === 'done');
  const [tab, setTab] = useState<Tab>(open.length || !done.length ? 'open' : 'done');
  const list = tab === 'open' ? open : done;
  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<h1 className="display text-[30px] font-extrabold">{t('mine.title')}</h1>} />
      <p className="mt-1 text-[14px] text-ash-2">{t('mine.intro')}</p>
      <div className="mt-3 flex gap-2" role="tablist">
        <Chip role="tab" aria-selected={tab === 'open'} active={tab === 'open'} onClick={() => setTab('open')}>{t('mine.open')} · {open.length}</Chip>
        <Chip role="tab" aria-selected={tab === 'done'} active={tab === 'done'} onClick={() => setTab('done')}>{t('mine.done')} · {done.length}</Chip>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {list.length ? list.map((c) => <Row key={c.id} c={c} onPlay={() => onPlay(c)} onOpen={() => onOpen(c)} />) : (
          <p className="rounded-xl border border-line px-4 py-4 text-[14px] text-ash-2">{tab === 'open' ? t('mine.emptyOpen') : t('mine.emptyDone')}</p>
        )}
      </div>
      <Button variant="ivory" className="mt-5 w-full" onClick={onNew}>{t('home2.challenge')}</Button>
      <p className="mt-3 text-[12px] text-ash">{t('mine.local')}</p>
    </Screen>
  );
}

function Row({ c, onPlay, onOpen }: { c: ChallengeRec; onPlay: () => void; onOpen: () => void }) {
  const st = stateOf(c);
  const o = outcome(c);
  const label = c.daily ? `${t('daily.title')} · ${fmtDate(new Date(`${c.daily}T12:00:00Z`), { day: 'numeric', month: 'short' })}` : t(`mode.${c.draw.mode}.name`);
  const who = c.them?.name || (c.dir === 'received' ? t('ch.yourFriend') : '');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-[10px] text-ash">{label} · {st === 'toPlay' ? t('mine.st.toPlay') : st === 'awaiting' ? t('mine.st.awaiting') : t('mine.st.done')}</span>
        <span className="display block break-words text-[19px] font-extrabold leading-tight">
          {st === 'awaiting' ? t('mine.sentLine', { pts: c.me!.pts }) : st === 'toPlay' ? t('mine.receivedLine', { name: who, pts: c.them!.pts }) : `${upper(who || t('ch.yourFriend'))} · ${c.me!.pts}–${c.them!.pts}`}
        </span>
        {o ? <span className={`text-[12.5px] ${o === 'win' ? 'text-win' : o === 'loss' ? 'text-loss' : 'text-ash-2'}`}>{o === 'win' ? `▲ ${t('mine.won')}` : o === 'loss' ? `▼ ${t('mine.lost')}` : t('mine.drawn')}</span> : null}
        {st === 'awaiting' ? <span className="block text-[12px] text-ash">{t('mine.awaitingNote')}</span> : null}
      </span>
      {st === 'toPlay' ? <Button size="sm" variant="primary" className="min-h-11 shrink-0" onClick={onPlay}>{t('mine.play')}</Button> : st === 'done' ? <Button size="sm" className="min-h-11 shrink-0" onClick={onOpen}>{t('mine.see')}</Button> : null}
    </div>
  );
}
