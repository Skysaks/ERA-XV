import React, { useMemo, useState } from 'react';
import {
  MODES, byKey, seasonStory, staffPoints, standingOf, teamProfile, type MatchResult, type PickDiff, type Season, type TeamProfile, type Standing,
} from '../../engine/index';
import { Button, Disclosure, Ord, Help, IconArrow, IconButton, IconHome, IconStar, IconTrophy, Panel, Screen } from '../components/ui';
import { CompareTable } from '../components/compare';
import { ShareSheet, type ShareKind } from './Share';
import { TeamSheet } from '../components/rugby';
import { oppLabel, roleName, signed, upper } from '../format';
import { ordinal, t } from '../i18n';
import type { GameResult } from '../game';
import type { Lineup } from '../../engine/team';

export interface CompareView {
  name: string;
  theirPoints: number;
  theirSeason?: Season;
  theirLineup: Lineup;
  theirPlan?: string;
  diffs: PickDiff[];
  decisive?: PickDiff;
  h2h?: MatchResult;
}

/** "Champions of the ERA League", "Semi-finalists", "7th · One place off the play-offs"… */
export function standingLabel(s: Season): string {
  const st = standingOf(s);
  const base = t(`standing.${st}`);
  return st === 'doorstep' || st === 'midtable' || st === 'bottom' || st === 'playoffs' ? `${ordinal(s.position)} · ${base}` : base;
}
/** kept for other screens (gallery, share) */
export function Result({ result, name, fav, onFav, onHome, onAgain, onRunItBack, onAnalysis, compare, onRematch, buildUrl, autoShare, onName, next }: {
  result: GameResult; name: string; fav: boolean; onFav: () => void; onHome: () => void; onAgain: () => void; onRunItBack: () => void; onAnalysis: () => void;
  compare?: CompareView; onRematch?: () => void; buildUrl: (token: string) => string; autoShare?: boolean; onName?: (n: string) => void;
  /** what to play next (today's Daily, the weekly challenge) */
  next?: React.ReactNode;
}) {
  const { season, gauntlet, prof, session } = result;
  const mode = MODES[session.state.cfg.mode];
  const hideRatings = !!mode.hideRatings;
  const officialDaily = !!session.daily && !!session.official;
  const mainShare: ShareKind = compare ? 'rematch' : officialDaily ? 'daily' : 'challenge';
  const [share, setShare] = useState<null | ShareKind>(autoShare && !session.live ? 'challenge' : null);

  return (
    <Screen>
      <div className="flex items-center gap-2">
        <IconButton label={t('common.home')} onClick={onHome} className="-ml-2.5"><IconHome className="h-6 w-6" /></IconButton>
        <span className="eyebrow min-w-0 flex-1 break-words text-[10.5px] text-ash">
          {(session.live ? t(`room.tag.${session.live}`) : t(`mode.${session.state.cfg.mode}.name`))} · {t(`plan.${session.plan}.short`)}
        </span>
        <IconButton label={fav ? t('gallery.unfavourite') : t('gallery.favourite')} onClick={onFav} className={`-mr-2 ${fav ? 'text-brass' : ''}`}>
          <IconStar className={`h-6 w-6 ${fav ? 'fill-brass' : ''}`} />
        </IconButton>
      </div>

      {compare ? <CompareBlock result={result} compare={compare} name={name} onRematch={onRematch} onShare={() => setShare('result')} /> : null}

      {season ? <SeasonHero result={result} season={season} /> : gauntlet ? <GauntletHero result={result} /> : null}

      <div className="mt-2 flex flex-col gap-1 text-[13.5px] font-medium">
        {result.isNewBest ? <span className="text-win">▲ {t('result.newBest')} <span className="text-ash">· {t('result.previous', { n: result.prevBest })}</span></span>
          : result.prevBest && season ? <span className="text-ash">{result.points === result.prevBest ? t('result.matchesBest') : t('result.bestGap', { best: result.prevBest, gap: Math.max(0, result.prevBest - result.points) })}</span> : null}
        {result.modeBest ? <span className="text-win">▲ {t('result.modeBest', { mode: t(`mode.${session.state.cfg.mode}.name`) })}</span> : null}
        {session.daily ? <span className="text-ash-2">{session.official ? t('result.dailyOfficial') : t('result.dailyCasual')}</span> : null}
        {session.practice ? <span className="text-ash-2">{t('draft.practice')}</span> : null}
        {session.reopened ? <span className="text-ash-2">{t('result3.reopened')}</span> : null}
        {result.newPlayers ? <span className="text-ash-2">{t('result3.newPlayers', { n: result.newPlayers })}</span> : null}
        {result.unlocked.length ? <span className="text-brass">★ {t('ach.unlocked', { names: result.unlocked.map((a) => t(`ach.${a}.name`)).join(', ') })}</span> : null}
        {result.discover ? <span className="text-ash-2">{result.discover.kind === 'era' ? t('discover.era') : t('discover.nation')}: <span className="text-chalk">{result.discover.kind === 'era' ? t(`bucket.${result.discover.label}`) : t(`nat.${result.discover.label}`)}</span> {t('discover.added')}</span> : null}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {!session.live ? (
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShare(mainShare)}>
            {mainShare === 'rematch' ? t('result3.reply', { name: compare!.name }) : mainShare === 'daily' ? t('result3.challengeDaily') : t('result.challenge2')}
          </Button>
        ) : null}
        <Button variant="ivory" className="w-full" onClick={onAnalysis}>{t('result.debrief')} <IconArrow className="h-5 w-5" /></Button>
        {!session.live ? <Button size="sm" className="min-h-11 w-full" onClick={() => setShare('result')}>{t('result3.share')}</Button> : null}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onAgain} className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-line bg-ink-2 px-2 py-2 text-center hover:border-line-2">
            <span className="display text-[18px] font-extrabold">{t('result3.newDraft')}</span><span className="text-[12px] text-ash">{t('result3.newDraftSub')}</span>
          </button>
          <button type="button" onClick={onRunItBack} className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-line bg-ink-2 px-2 py-2 text-center hover:border-line-2">
            <span className="display text-[18px] font-extrabold">{t('result3.sameDraws')}</span><span className="text-[12px] text-ash">{t('result3.sameDrawsSub')}</span>
          </button>
        </div>
      </div>

      {next ? <div className="mt-5">{next}</div> : null}

      <Disclosure className="mt-5" title={t('result.sheet')} sub={`${t('sheet.cohesion')} ${prof.fit}${hideRatings ? '' : ` · ${t('stat.ovr')} ${prof.ovr}`}`}>
        <TeamSheet lineup={session.lineup} compact hideRatings={false}
          rowOf={(n) => { const sv = prof.slots.find((s) => s.n === n); return sv ? { n, player: sv.player, rating: sv.rating, kind: sv.kind, role: roleName(sv.player.role) } : { n }; }} />
      </Disclosure>

      <ShareSheet open={!!share} kind={share ?? 'challenge'} onClose={() => setShare(null)} result={result} name={name} compare={compare} buildUrl={buildUrl} onName={onName} />
    </Screen>
  );
}

/* ------------------------------------------------------------ heroes */

function SeasonHero({ result, season }: { result: GameResult; season: Season }) {
  const st = standingOf(season);
  const story = useMemo(() => seasonStory(season), [season]);
  const champion = st === 'champion';
  const qualified = season.position <= 6;
  const route = story.path.filter((p) => p.kind === 'tie');
  const diff = season.pf - season.pa;
  return (
    <section className={`touchlines animate-rise mt-4 rounded-xl border px-4 pb-4 pt-4 ${champion ? 'border-brass bg-brass/[0.08]' : 'border-line-2 bg-ink-2'}`}
      aria-label={t('result.aria2', { label: standingLabel(season), pts: season.points })}>
      <p className="eyebrow text-[10.5px] text-ash">{t('result.seasonOver')}</p>
      {champion ? (
        <>
          <p className="display mt-2 flex items-center gap-2 text-[46px] font-black leading-[0.9] text-brass"><IconTrophy className="h-10 w-10 shrink-0" />{t('standing.champion')}</p>
          <p className="mt-1 text-[14px] text-ash-2">{t('result.shield')}</p>
        </>
      ) : (
        <div className="mt-1 flex items-end gap-4">
          <Ord n={season.position} className="display tnum text-[92px] font-black leading-[0.8]" />
          <span className="min-w-0 pb-1.5">
            <span className="display block text-[26px] font-black leading-[0.95]">{t(`standing.${st}`)}</span>
            <span className="mt-1 block text-[13px] text-ash-2">{qualified ? t('result.qualified') : t('result.regularOf', { n: season.table.length })}</span>
          </span>
        </div>
      )}
      {qualified ? (
        <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          {story.path.some((p) => p.kind === 'bye') ? <li className="text-win">✓ {t('story.bye')}</li> : null}
          {route.map((p, i) => p.kind === 'tie' ? (
            <li key={i} className={p.won ? 'text-win' : 'text-loss'}>{p.won ? '▲' : '▼'} {t(`po.${p.tie.stage}`)} {p.pf}–{p.pa} <span className="text-ash">{oppLabel(p.oppId, p.oppId)}</span></li>
          ) : null)}
        </ol>
      ) : null}
      <dl className="mt-4 grid grid-cols-4 divide-x divide-line rounded-lg border border-line bg-ink/40">
        <Stat k={t('result.k.pts')} v={season.points} />
        <Stat k={t('result.k.record')} v={`${season.w}-${season.d}-${season.l}`} small />
        <Stat k={t('result.k.diff')} v={signed(diff)} tone={diff >= 0 ? 'win' : 'loss'} />
        <Stat k={t('result.k.bonus')} v={season.tb + season.lb} />
      </dl>
      <p className="mono mt-2 flex items-center gap-2 text-[12px] text-ash">
        {t('result.eraScore', { pts: result.points, max: result.max })} <Help id="eraScore" label={t('result.eraScoreLabel')} />
      </p>
      {season.points === season.max ? <p className="display mt-2 text-[22px] font-black text-brass">{t('result.perfect')} <span className="block text-[14px] text-ash-2">{t('result.perfectSub')}</span></p> : null}
    </section>
  );
}

function Stat({ k, v, tone, small }: { k: string; v: React.ReactNode; tone?: 'win' | 'loss'; small?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center px-1 py-2">
      <dt className="eyebrow text-[9.5px] text-ash">{k}</dt>
      <dd className={`display tnum mt-0.5 ${small ? 'text-[20px]' : 'text-[24px]'} font-black leading-none ${tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-chalk'}`}>{v}</dd>
    </div>
  );
}

function GauntletHero({ result }: { result: GameResult }) {
  const g = result.gauntlet!;
  const perfect = g.beaten === g.max;
  const last = g.ties[g.ties.length - 1];
  return (
    <section className={`touchlines animate-rise mt-4 rounded-xl border px-4 py-4 ${perfect ? 'border-brass bg-brass/[0.08]' : 'border-line-2 bg-ink-2'}`}
      aria-label={t('result.gauntletAria', { pts: result.points, max: result.max })}>
      <p className="eyebrow text-[10.5px] text-ash">{t('gauntlet.title')}</p>
      <p className="display tnum mt-1 text-[80px] font-black leading-[0.85]">{g.beaten}<span className="text-[32px] text-ash"> / {g.max}</span></p>
      <p className={`display mt-1 text-[24px] font-black ${perfect ? 'text-brass' : 'text-chalk'}`}>{perfect ? t('gauntlet.perfect', { max: g.max }) : t('gauntlet.out', { opp: upper(oppLabel(last.opp, last.oppName)) })}</p>
    </section>
  );
}

/* ---------------------------------------------------------- challenge */

function CompareBlock({ result, compare, name, onRematch, onShare }: { result: GameResult; compare: CompareView; name: string; onRematch?: () => void; onShare: () => void }) {
  const mine = result.points, theirs = compare.theirPoints;
  const verdict = mine > theirs ? t('ch.youWin') : mine < theirs ? t('ch.theyWin', { name: compare.name }) : t('ch.deadHeat');
  const h = compare.h2h;
  const theirProf: TeamProfile = useMemo(() => teamProfile(compare.theirLineup, byKey, (compare.theirPlan ?? result.session.plan) as never), [compare]); // eslint-disable-line react-hooks/exhaustive-deps
  const seed = result.session.state.cfg.seed;
  const myTop = useMemo(() => staffPoints(result.prof, seed).strengths[0], [result, seed]);
  const theirTop = useMemo(() => staffPoints(theirProf, seed).strengths[0], [theirProf, seed]);
  const s = result.season, ts = compare.theirSeason;
  return (
    <Panel className="animate-rise mt-4" tone={mine > theirs ? 'win' : mine < theirs ? 'loss' : undefined} label={t('ch.duelTitle')}>
      <div className="px-4 pt-3">
        <p className={`display text-[34px] font-black leading-none ${mine > theirs ? 'text-win' : mine < theirs ? 'text-loss' : 'text-chalk'}`}>{mine > theirs ? '▲ ' : mine < theirs ? '▼ ' : ''}{verdict}</p>
        <p className="text-[14px] text-ash-2">{mine === theirs ? t('ch.level') : t('ch.by', { n: Math.abs(mine - theirs) })}</p>
      </div>
      <div className="mt-3 px-4">
        <CompareTable
          a={{ name: name || t('common.you'), me: true, pos: s?.position, pts: mine, fit: result.prof.fit, diff: s ? s.pf - s.pa : undefined, bonus: s ? s.tb + s.lb : undefined, note: myTop ? t(`staff.${myTop.area}.up`) : undefined }}
          b={{ name: compare.name, me: false, pos: ts?.position, pts: theirs, fit: theirProf.fit, diff: ts ? ts.pf - ts.pa : undefined, bonus: ts ? ts.tb + ts.lb : undefined, note: theirTop ? t(`staff.${theirTop.area}.up`) : undefined }}
        />
      </div>
      <div className="px-4 pb-4">
        <p className="eyebrow mt-3 text-[11px] text-brass">{compare.diffs.length ? t('cmp.choices', { n: compare.diffs.length }) : t('ch.identical')}</p>
        {h ? <p className="mt-2 text-[13.5px] text-ash-2">{t('ch.h2h')} <span className="font-semibold text-chalk">{t('room.h2hScore', { a: h.home.pts, b: h.away.pts, name: compare.name })}</span>{h.kc ? ` ${t('po.kc', { a: h.kc[0], b: h.kc[1] })}` : ''}</p> : null}
        {compare.decisive ? (
          <div className="mt-3 border-t border-line pt-3">
            <p className="eyebrow text-[10px] text-ash">{t('ch.decisive', { n: compare.decisive.round })}</p>
            <p className="mt-1 text-[14.5px]">{compare.decisive.pts >= 0
              ? t('ch.decisiveUp', { yours: compare.decisive.yours.name, theirs: compare.decisive.theirs.name, pts: Math.round(compare.decisive.pts) })
              : t('ch.decisiveDown', { yours: compare.decisive.yours.name, theirs: compare.decisive.theirs.name, pts: Math.round(Math.abs(compare.decisive.pts)) })}</p>
            <p className="text-[11.5px] text-ash">{t('ch.estimate')}</p>
          </div>
        ) : null}
        {compare.diffs.length ? <PickDiffs diffs={compare.diffs} /> : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {onRematch ? <Button onClick={onRematch}>{t('ch.rematch')}</Button> : null}
          <Button onClick={onShare}>{t('ch.share')}</Button>
        </div>
      </div>
    </Panel>
  );
}

export function PickDiffs({ diffs }: { diffs: { round: number; yours: { short: string }; theirs: { short: string }; pts?: number }[] }) {
  return (
    <details className="mt-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-ash-2">{t('ch.split')} ({diffs.length})</summary>
      <ul className="mt-1 flex flex-col gap-2 text-[14px]">
        {diffs.map((d) => (
          <li key={d.round} className="flex justify-between gap-3">
            <span className="min-w-0 break-words"><span className="mono text-ash">{t('analysis.round', { n: d.round })}</span> {d.yours.short} <span className="text-ash">{t('ch.over')}</span> {d.theirs.short}</span>
            {d.pts !== undefined ? <span className={`mono shrink-0 font-semibold ${d.pts > 0 ? 'text-win' : d.pts < 0 ? 'text-loss' : 'text-ash'}`}>{d.pts > 0 ? '+' : ''}{d.pts}</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

export type { Standing };
