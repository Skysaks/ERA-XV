import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seasonStory, type GauntletRun, type PathStep, type RoundFrame, type Season, type StoryEvent } from '../../engine/index';
import { IconButton, IconHome, IconTrophy, Ord, Screen } from '../components/ui';
import { oppLabel, upper } from '../format';
import { ordinal, t } from '../i18n';
import type { GameResult } from '../game';
import type { SimSpeed } from '../store';
import { track } from '../analytics';
import { haptic } from '../feel';

export function Sim({ result, speed, onDone, onHome }: { result: GameResult; speed: SimSpeed; onDone: () => void; onHome: () => void }) {
  return result.gauntlet
    ? <GauntletSim run={result.gauntlet} speed={speed} onDone={onDone} onHome={onHome} />
    : <SeasonSim season={result.season!} speed={speed} onDone={onDone} onHome={onHome} />;
}

/* ------------------------------------------------------------ helpers */

const GOOD = new Set(['exploit', 'statement', 'tries', 'streak', 'intoTop6', 'leader', 'clinched', 'clinchedTop2']);
const BAD = new Set(['losingRun', 'outOfTop6', 'eliminated', 'firstDefeat']);
export function storyText(e: StoryEvent): string {
  return t(`story.${e.kind}`, { opp: e.opp ? oppLabel(e.opp, e.opp) : '', n: e.n ?? 0, ord: e.rank ? ordinal(e.rank) : '' });
}
const toneOf = (k: string) => (GOOD.has(k) ? 'win' : BAD.has(k) ? 'loss' : 'brass');

/** Home side first, like a real fixture list. */
function MatchLine({ f, big }: { f: RoundFrame['fixture']; big?: boolean }) {
  const opp = upper(oppLabel(f.opp, f.oppName));
  const res = f.result === 'W' ? t('story.res.W') : f.result === 'D' ? t('story.res.D') : t('story.res.L');
  const tone = f.result === 'W' ? 'text-win' : f.result === 'D' ? 'text-ash-2' : 'text-loss';
  const me = <span className="text-chalk">ERA XV</span>;
  const them = <span className="text-ash-2">{opp}</span>;
  const score = <span className={`tnum ${tone}`}>{f.home ? `${f.pf}–${f.pa}` : `${f.pa}–${f.pf}`}</span>;
  return (
    <span className={`display block font-extrabold leading-[1.05] ${big ? 'text-[21px]' : 'text-[16px]'}`}>
      <span className="sr-only">{res} · </span>
      {f.home ? <>{me} {score} {them}</> : <>{them} {score} {me}</>}
    </span>
  );
}

/* ------------------------------------------------------------- season */

type Beat = { kind: 'round'; i: number } | { kind: 'po'; k: number } | { kind: 'end' };

function SeasonSim({ season, speed, onDone, onHome }: { season: Season; speed: SimSpeed; onDone: () => void; onHome: () => void }) {
  const story = useMemo(() => seasonStory(season), [season]);
  const beats: Beat[] = useMemo(() => [
    ...story.frames.map((_, i) => ({ kind: 'round' as const, i })),
    ...story.path.map((_, k) => ({ kind: 'po' as const, k })),
    { kind: 'end' as const },
  ], [story]);
  const [b, setB] = useState(speed === 'instant' ? beats.length - 1 : -1);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  useEffect(() => {
    if (speed === 'instant') { finish(); return; }
    const k = speed === 'live' ? 1 : 0.38;
    const next = beats[b + 1];
    if (!next) { const h = setTimeout(finish, 1400 * k + 300); return () => clearTimeout(h); }
    let ms = 280;
    const cur = b >= 0 ? beats[b] : undefined;
    if (cur?.kind === 'round') { const f = story.frames[cur.i]; if (f.featured) ms += 750; }
    if (next.kind === 'round' && story.frames[next.i].pre.length) ms += 900;
    if (next.kind === 'po') { const st = story.path[next.k]; ms = st.kind === 'bye' ? 1100 : st.tie.stage === 'qf' ? 1300 : st.tie.stage === 'sf' ? 1600 : 2000; if (cur?.kind === 'round') ms += 500; }
    const h = setTimeout(() => setB((x) => x + 1), ms * k);
    return () => clearTimeout(h);
  }, [b, beats, speed, story]); // eslint-disable-line react-hooks/exhaustive-deps

  // feedback on the moments that matter
  useEffect(() => {
    const cur = b >= 0 ? beats[b] : undefined;
    if (cur?.kind === 'round') {
      const ev = story.frames[cur.i].events.map((e) => e.kind);
      if (ev.includes('clinched')) haptic('qualify');
    }
    if (cur?.kind === 'po') {
      const st = story.path[cur.k];
      if (st.kind === 'tie' && st.won) haptic(st.tie.stage === 'final' ? 'title' : 'win');
    }
  }, [b]); // eslint-disable-line react-hooks/exhaustive-deps

  const roundsShown = beats.slice(0, b + 1).filter((x) => x.kind === 'round').length;
  const frame = roundsShown ? story.frames[roundsShown - 1] : undefined;
  const poShown = beats.slice(0, b + 1).filter((x) => x.kind === 'po').length;
  const inPlayoffs = poShown > 0 || (roundsShown === story.frames.length && b >= story.frames.length);
  const feed = story.frames.slice(0, roundsShown).slice(-6).reverse();
  const upcoming = beats[b + 1];
  const decider = upcoming?.kind === 'round' && story.frames[upcoming.i].pre.length ? story.frames[upcoming.i].pre[0] : null;
  const delta = frame ? frame.prevRank - frame.rank : 0;

  return (
    <Screen className="pb-24">
      <div className="flex items-center gap-2">
        <IconButton label={t('common.home')} onClick={onHome} className="-ml-2.5"><IconHome className="h-6 w-6" /></IconButton>
        <span className="eyebrow min-w-0 flex-1 break-words text-[11px] text-ash-2">{inPlayoffs ? t('sim.playoffs') : t('story.league')}</span>
        <span className="mono text-[13px] text-ash-2">{t('story.round', { n: frame?.round ?? 0, max: season.fixtures.length })}</span>
      </div>

      {/* scoreboard */}
      <section className="touchlines mt-2 rounded-xl border border-line-2 bg-ink-2 px-4 pb-3 pt-3" aria-live="polite" aria-label={t('story.board')}>
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-4">
          <div>
            <p className="eyebrow text-[10px] text-ash">{t('story.rank')}</p>
            <p className="display tnum text-[56px] font-black leading-[0.85]">{frame ? <Ord n={frame.rank} /> : '—'}</p>
          </div>
          <div className="min-w-0 pb-1">
            {frame && delta !== 0 ? <p className={`mono text-[12px] font-semibold ${delta > 0 ? 'text-win' : 'text-loss'}`}>{delta > 0 ? `▲ ${delta}` : `▼ ${-delta}`}</p> : <p className="mono text-[12px] text-ash">·</p>}
            <p className="mono break-words text-[13px] text-ash-2">{frame ? `${frame.w}${t('stat.W')} · ${frame.d}${t('stat.D')} · ${frame.l}${t('stat.L')}` : '—'}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-[10px] text-ash">{t('story.pts')}</p>
            <p className="display tnum text-[44px] font-black leading-[0.85]">{frame?.pts ?? 0}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <QualChip frame={frame} />
          <span className="mono text-[11px] text-ash">{t('story.top6')}</span>
        </div>
        <div className="mt-2 flex items-end gap-[2px]" aria-hidden>
          {season.fixtures.map((f, k) => (
            <span key={k} className="flex flex-1 flex-col items-center gap-[2px]">
              <span className={`h-1.5 w-1.5 rounded-full ${k < roundsShown && (f.tb || f.lb) ? 'bg-brass' : 'bg-transparent'}`} />
              <span className={`h-6 w-full rounded-[2px] transition-colors duration-200 ${k >= roundsShown ? 'bg-line' : f.result === 'W' ? 'bg-chalk' : f.result === 'D' ? 'bg-ash' : 'bg-loss'}`} />
            </span>
          ))}
        </div>
      </section>

      {decider ? (
        <p className="display animate-pop mt-3 rounded-lg border border-brass/60 bg-brass/10 px-4 py-3 text-center text-[22px] font-black text-brass">{storyText(decider)}</p>
      ) : null}

      {inPlayoffs ? (
        <Playoffs season={season} path={story.path} shown={poShown} final={story.final} finished={b >= beats.length - 1} />
      ) : (
        <ol className="mt-3 flex flex-col gap-2" aria-label={t('story.feed')}>
          {feed.map((f, idx) => <FeedItem key={f.round} f={f} latest={idx === 0} />)}
        </ol>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="mx-auto flex max-w-[560px] justify-end">
          <button type="button" onClick={() => { if (b < beats.length - 1) track('simulation_skipped', { at: b, of: beats.length }); finish(); }} className="display h-12 rounded-lg border border-line-2 px-6 text-[19px] font-extrabold hover:border-ash">
            {b >= beats.length - 1 ? t('story.toResult') : t('sim.skip')}
          </button>
        </div>
      </div>
    </Screen>
  );
}

function QualChip({ frame }: { frame?: RoundFrame }) {
  if (!frame) return <span className="mono text-[12px] text-ash">—</span>;
  if (frame.qualified === 'in') return <span className="eyebrow rounded-sm bg-win/15 px-2 py-1 text-[10.5px] text-win">✓ {t('story.q.in')}</span>;
  if (frame.qualified === 'out') return <span className="eyebrow rounded-sm bg-loss/15 px-2 py-1 text-[10.5px] text-loss">✗ {t('story.q.out')}</span>;
  return frame.rank <= 6
    ? <span className="eyebrow rounded-sm bg-chalk/10 px-2 py-1 text-[10.5px] text-chalk">{t('story.q.inside')}</span>
    : <span className="eyebrow rounded-sm bg-chalk/5 px-2 py-1 text-[10.5px] text-ash-2">{t('story.q.outside')}</span>;
}

function FeedItem({ f, latest }: { f: RoundFrame; latest: boolean }) {
  const fx = f.fixture;
  const tags: string[] = [];
  if (fx.tb) tags.push(t('sim.tb'));
  if (fx.lb) tags.push(t('sim.lb'));
  return (
    <li className={`${latest ? 'animate-slide' : 'opacity-70'} rounded-lg border ${f.featured && latest ? 'border-line-2 bg-ink-3' : 'border-line bg-ink-2'} px-3 py-2`}>
      <div className="flex items-center gap-3">
        <span className="mono w-8 shrink-0 text-[12px] text-ash">{t('story.j', { n: f.round })}</span>
        <span className="min-w-0 flex-1"><MatchLine f={fx} big={latest} /></span>
        <span className={`mono shrink-0 text-[12.5px] font-semibold ${fx.pts ? 'text-chalk' : 'text-ash'}`}>+{fx.pts}</span>
      </div>
      {tags.length ? <p className="mono mt-0.5 pl-11 text-[11.5px] text-brass">{tags.join(' · ')}</p> : null}
      {f.events.length ? (
        <div className="mt-1.5 flex flex-col gap-1 pl-11">
          {f.events.map((e, i) => {
            const tone = toneOf(e.kind);
            return <p key={i} className={`display ${latest ? 'text-[19px]' : 'text-[15px]'} font-black ${tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-brass'} ${latest ? 'animate-pop' : ''}`}>{tone === 'win' ? '▲ ' : tone === 'loss' ? '▼ ' : '◆ '}{storyText(e)}</p>;
          })}
        </div>
      ) : null}
    </li>
  );
}

function Playoffs({ season, path, shown, final, finished }: { season: Season; path: PathStep[]; shown: number; final: Season['playoffs'][number] | undefined; finished: boolean }) {
  const steps = path.slice(0, shown);
  return (
    <section className="mt-3" aria-label={t('sim.playoffs')}>
      <ol className="flex flex-col">
        <li className="rounded-lg border border-line bg-ink-2 px-3 py-2">
          <p className="eyebrow text-[10px] text-ash">{t('story.regular')}</p>
          <p className="display text-[20px] font-black">{t('result.position', { ord: ordinal(season.position) })}</p>
        </li>
        {path.length === 0 ? (
          <li className="mt-2 rounded-lg border border-line bg-ink-2 px-3 py-3">
            <p className="display text-[20px] font-black text-ash-2">{t('story.noPlayoffs')}</p>
            {final ? <p className="mt-1 text-[14px] text-ash-2">{t('story.finalWon', { team: oppLabel(final.winner, final.winner), score: `${Math.max(final.hs, final.as)}–${Math.min(final.hs, final.as)}` })}</p> : null}
          </li>
        ) : null}
        {steps.map((st, i) => {
          const last = i === steps.length - 1;
          if (st.kind === 'bye') {
            return (
              <React.Fragment key="bye">
                <li aria-hidden className="ml-6 h-3 w-px bg-line-2" />
                <li className={`${last ? 'animate-rise' : ''} rounded-lg border border-win/40 bg-win/[0.06] px-3 py-2`}>
                  <p className="eyebrow text-[10px] text-ash">{t('po.qf')}</p>
                  <p className="display text-[18px] font-black text-win">✓ {t('story.bye')}</p>
                </li>
              </React.Fragment>
            );
          }
          const big = st.tie.stage === 'final';
          const outcome = st.won ? (st.tie.stage === 'final' ? t('story.champion') : st.tie.stage === 'sf' ? t('story.toFinal') : t('story.toSemi')) : t('story.out');
          return (
            <React.Fragment key={i}>
              <li aria-hidden className="ml-6 h-3 w-px bg-line-2" />
              <li className={`${last ? 'animate-rise' : ''} rounded-lg border px-3 ${big ? 'py-4' : 'py-2.5'} ${st.won ? (big ? 'border-brass bg-brass/10' : 'border-win/40 bg-win/[0.05]') : 'border-loss/40 bg-loss/[0.05]'}`}>
                <p className="eyebrow text-[10px] text-ash">{t(`po.${st.tie.stage}`)}</p>
                <p className={`display mt-0.5 font-extrabold ${big ? 'text-[22px]' : 'text-[19px]'}`}>
                  ERA XV <span className={`tnum ${st.won ? 'text-win' : 'text-loss'}`}>{st.pf}–{st.pa}</span> <span className="text-ash-2">{upper(oppLabel(st.oppId, st.oppId))}</span>
                </p>
                {st.tie.kc ? <p className="mono mt-0.5 text-[11.5px] text-ash">{t('po.kc', { a: st.tie.home === 'you' ? st.tie.kc[0] : st.tie.kc[1], b: st.tie.home === 'you' ? st.tie.kc[1] : st.tie.kc[0] })}</p>
                  : st.tie.et ? <p className="mono mt-0.5 text-[11.5px] text-ash">{t('po.et')}</p> : null}
                <p className={`display mt-1 ${big && st.won ? 'text-[30px] text-brass' : 'text-[19px]'} font-black ${st.won ? (big ? '' : 'text-win') : 'text-loss'} ${last ? 'animate-pop' : ''}`}>
                  {big && st.won ? <IconTrophy className="mr-2 inline h-7 w-7 -translate-y-1" /> : st.won ? '▲ ' : '▼ '}{outcome}
                </p>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
      {finished && path.length && path[path.length - 1].kind === 'tie' && !(path[path.length - 1] as { won: boolean }).won && final ? (
        <p className="mt-3 text-[13px] text-ash-2">{t('story.finalWon', { team: oppLabel(final.winner, final.winner), score: `${Math.max(final.hs, final.as)}–${Math.min(final.hs, final.as)}` })}</p>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------ gauntlet */

function GauntletSim({ run, speed, onDone, onHome }: { run: GauntletRun; speed: SimSpeed; onDone: () => void; onHome: () => void }) {
  const [i, setI] = useState(speed === 'instant' ? run.ties.length : 0);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };
  useEffect(() => {
    if (speed === 'instant') { finish(); return; }
    const k = speed === 'live' ? 1 : 0.4;
    if (i >= run.ties.length) { const h = setTimeout(finish, 1500 * k); return () => clearTimeout(h); }
    const h = setTimeout(() => { setI((x) => x + 1); if (run.ties[i]?.won) haptic('win'); }, (i === 0 ? 500 : 900 + i * 90) * k);
    return () => clearTimeout(h);
  }, [i, speed]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = run.ties.slice(0, i);
  return (
    <Screen className="pb-24">
      <div className="flex items-center gap-2">
        <IconButton label={t('common.home')} onClick={onHome} className="-ml-2.5"><IconHome className="h-6 w-6" /></IconButton>
        <span className="eyebrow min-w-0 flex-1 text-[11px] text-ash-2">{t('gauntlet.title')}</span>
        <span className="mono text-[13px] text-ash-2">{t('gauntlet.legend', { n: Math.max(1, shown.length), max: run.max })}</span>
      </div>
      <section className="touchlines mt-2 rounded-xl border border-line-2 bg-ink-2 px-4 py-3" aria-live="polite">
        <p className="eyebrow text-[10px] text-ash">{t('gauntlet.beaten')}</p>
        <p className="display tnum text-[56px] font-black leading-[0.85]">{shown.filter((x) => x.won).length}<span className="text-[28px] text-ash"> / {run.max}</span></p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: run.max }, (_, k) => <span key={k} className={`h-6 flex-1 rounded-[2px] ${k < shown.length ? (shown[k].won ? 'bg-win' : 'bg-loss') : 'bg-line'}`} />)}
        </div>
      </section>
      <ol className="mt-3 flex flex-col gap-2">
        {shown.slice().reverse().map((g, k) => (
          <li key={g.opp} className={`${k === 0 ? 'animate-slide' : 'opacity-70'} rounded-lg border ${g.won ? 'border-line' : 'border-loss/40'} bg-ink-2 px-3 py-2`}>
            <p className="display break-words text-[18px] font-extrabold">ERA XV <span className={`tnum ${g.won ? 'text-win' : 'text-loss'}`}>{g.pf}–{g.pa}</span> <span className="text-ash-2">{upper(oppLabel(g.opp, g.oppName))}</span></p>
            {g.kc ? <p className="mono text-[11.5px] text-ash">{t('po.kc', { a: g.kc[0], b: g.kc[1] })}</p> : g.et ? <p className="mono text-[11.5px] text-ash">{t('po.et')}</p> : null}
          </li>
        ))}
      </ol>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="mx-auto flex max-w-[560px] justify-end">
          <button type="button" onClick={() => { if (i < run.ties.length) track('simulation_skipped', { at: i, of: run.ties.length }); finish(); }} className="display h-12 rounded-lg border border-line-2 px-6 text-[19px] font-extrabold hover:border-ash">{i >= run.ties.length ? t('story.toResult') : t('sim.skip')}</button>
        </div>
      </div>
    </Screen>
  );
}
