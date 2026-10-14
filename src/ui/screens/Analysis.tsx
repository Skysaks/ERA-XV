import React, { useEffect, useMemo, useState } from 'react';
import {
  DIMS, PLAN_DEF, draftSummary, expectedPoints, seasonStory, sideFromProfile, staffPoints, turningPoints, type AreaReading, type Expected, type TurningPoint,
} from '../../engine/index';
import { Card, DimBar, Disclosure, Help, IconBack, IconButton, Panel, Screen, Term } from '../components/ui';
import { dimName, oppLabel, signed, upper } from '../format';
import { ordinal, t } from '../i18n';
import type { GameResult } from '../game';
import { DiagnosisPanel, synergyText } from './XV';
import { storyText } from './Sim';
import { standingLabel } from './Result';

export function Analysis({ result, onBack, onReplayFrom }: { result: GameResult; onBack: () => void; onReplayFrom: (round: number) => void }) {
  const { prof, season, gauntlet, session } = result;
  const [exp, setExp] = useState<Expected | null>(null);
  const [tps, setTps] = useState<TurningPoint[] | null>(null);
  useEffect(() => {
    const h = setTimeout(() => {
      if (season) setExp(expectedPoints(sideFromProfile('you', 'ERA XV', prof), session.state.cfg.seed, session.state.cfg.ruleset, 120));
      setTps(turningPoints(session.state, session.lineup, session.plan, 20));
    }, 40);
    return () => clearTimeout(h);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const staff = useMemo(() => staffPoints(prof, session.state.cfg.seed), [prof, session.state.cfg.seed]);
  const story = useMemo(() => (season ? seasonStory(season) : null), [season]);
  const plan = PLAN_DEF[prof.plan];
  const ds = draftSummary(session.state, prof);
  const verdict = exp && season ? (season.points > exp.p90 ? 'above' : season.points < exp.p10 ? 'below' : 'within') : null;
  const keyMoments = story ? story.frames.flatMap((f) => f.events.filter((e) => ['clinched', 'eliminated', 'leader', 'exploit', 'outOfTop6', 'intoTop6'].includes(e.kind)).map((e) => ({ round: f.round, e }))).slice(0, 4) : [];

  return (
    <Screen>
      <div className="flex min-h-12 items-center gap-2">
        <IconButton label={t('common.back')} onClick={onBack} className="-ml-2.5"><IconBack className="h-6 w-6" /></IconButton>
        <div className="min-w-0 flex-1">
          <p className="eyebrow break-words text-[10.5px] text-ash">{season ? standingLabel(season) : t('gauntlet.title')}</p>
          <h1 className="display text-[28px] font-black">{t('debrief.title')}</h1>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {/* level 1: the XV in three points */}
        <Panel label={t('debrief.three')} aside={<Help id="staffAreas" label={t('debrief.three')} />}>
          <ul className="divide-y divide-line">
            {staff.strengths.map((a) => <AreaRow key={a.area} a={a} tone="win" />)}
            <AreaRow a={staff.weakness} tone={staff.weakness.relative ? 'ash' : 'loss'} />
          </ul>
          {staff.strengths.length === 0 ? <p className="px-4 pb-3 text-[13px] text-ash-2">{t('debrief.noEdge')}</p> : null}
        </Panel>

        {/* level 1: why the season went that way */}
        {season ? (
          <Panel label={t('debrief.why')}>
            <div className="px-4 py-3">
              {exp ? (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <div><p className="eyebrow text-[10px] text-ash">{t('analysis.result')}</p><p className="display tnum text-[40px] font-black leading-none">{season.points}</p></div>
                    <div className="text-right"><p className="eyebrow text-[10px] text-ash">{t('analysis.expected')}</p><p className="display tnum text-[28px] font-black leading-none">{exp.p10}–{exp.p90}</p></div>
                  </div>
                  <RangeBar exp={exp} actual={season.points} max={season.max} />
                  <p className={`display mt-2 text-[20px] font-black ${verdict === 'above' ? 'text-win' : verdict === 'below' ? 'text-loss' : 'text-chalk'}`}>{verdict === 'above' ? '▲ ' : verdict === 'below' ? '▼ ' : ''}{t(`analysis.verdict.${verdict}`)}</p>
                  <p className="mt-1 text-[12px] text-ash">{t('analysis.expectedNote', { exp: exp.mean })}</p>
                </>
              ) : <p className="text-ash">…</p>}
              <ul className="mt-3 flex flex-col gap-1.5 text-[14px] text-ash-2">
                {prof.fit < 90 ? <li>· {t('debrief.fit', { n: prof.fit, k: prof.oop.length })}</li> : <li>· {t('debrief.fitGood', { n: prof.fit })}</li>}
                {prof.boot < 72 ? <li className="text-loss">⚠ {t('health.noKicker', { n: prof.boot })}</li> : null}
                {keyMoments.map((m, i) => <li key={i}><span className="mono text-ash">{t('story.j', { n: m.round })}</span> · {storyText(m.e)}</li>)}
              </ul>
            </div>
          </Panel>
        ) : null}

        {/* level 1: turning points (estimates) */}
        <Panel label={t('analysis.turning')} aside={<span className="mono text-[10.5px] text-ash">{t('debrief.estimates')}</span>}>
          <div className="px-4 py-3">
            {tps === null ? <p className="text-ash">…</p> : tps.length ? (
              <div className="flex flex-col gap-2.5">
                {tps.map((tp) => (
                  <Card key={tp.round} className="bg-ink-3/60 px-4 py-3">
                    <p className="eyebrow text-[10px] text-ash">{t('analysis.roundN', { n: tp.round })}</p>
                    <div className="mt-1 grid grid-cols-2 gap-3 text-[14px]">
                      <p><span className="eyebrow text-[9.5px] text-ash">{t('debrief.yourPick')}</span><br /><span className="font-semibold">{tp.picked.name}</span></p>
                      <p><span className="eyebrow text-[9.5px] text-ash">{t('analysis.alternative')}</span><br /><span className="font-semibold text-win">{tp.alt.name}</span></p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="mono text-[14px] font-semibold text-win">{t('analysis.estPts', { pts: signed(tp.delta) })}</span>
                      <button type="button" onClick={() => onReplayFrom(tp.round)} className="display min-h-11 rounded-lg border border-line-2 px-3 text-[15px] font-extrabold hover:border-ash">{t('analysis.replayFrom', { n: tp.round })}</button>
                    </div>
                  </Card>
                ))}
                <p className="text-[12px] text-ash">{t('analysis.turningNote')}</p>
              </div>
            ) : <p className="text-[14px] text-ash-2">{t('analysis.noTurning')}</p>}
          </div>
        </Panel>

        {/* level 2 and 3: on demand */}
        <p className="eyebrow mt-2 text-[10.5px] text-ash">{t('debrief.more')}</p>
        <Disclosure title={t('debrief.tactical')} sub={t(`plan.${prof.plan}.name`)}>
          <div className="flex flex-col gap-2.5">
            {DIMS.map((d) => <DimBar key={d} label={dimName(d)} value={prof.dims[d]} thr={plan.thr[d]} tone={prof.dims[d] >= 90 ? 'up' : undefined} />)}
            <p className="mt-1 text-[12px] text-ash">{t('analysis.tickNote')}</p>
          </div>
        </Disclosure>

        {prof.slots.some((s) => s.kind !== 'natural') || prof.synergies.length ? (
          <Disclosure title={t('diag.title')} sub={`${t('sheet.cohesion')} ${prof.fit}`}>
            <DiagnosisPanel prof={prof} bare />
            {prof.synergies.length ? (
              <ul className="mt-5 flex flex-col gap-1.5 text-[14px]">
                {prof.synergies.map((s) => <li key={s.id} className={s.delta > 0 ? 'text-win' : 'text-loss'}>{s.delta > 0 ? '+' : ''}{s.delta} · {synergyText(s.id, s.slots, session.lineup)}</li>)}
              </ul>
            ) : null}
          </Disclosure>
        ) : null}

        <Disclosure title={t('decide.title')} sub={t(`decide.grade.${ds.balance}`)}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
            <Kv k={t('decide.star')} v={t(`decide.level.${ds.star}`)} />
            <Kv k={t('decide.balance')} v={t(`decide.grade.${ds.balance}`)} />
            <Kv k={t('decide.discipline')} v={t(`decide.grade.${ds.discipline}`)} />
            <Kv k={t('decide.risk')} v={t(`decide.level.${ds.risk}`)} />
            <p className="col-span-2 text-ash-2">
              {ds.allStars ? t('decide.allStars', { n: ds.rounds }) : ds.costlyStars ? t('decide.costlyStars', { n: ds.costlyStars }) : ds.sacrifices ? t('decide.sacrifices', { n: ds.sacrifices }) : t('decide.clean', { n: ds.rounds })}
            </p>
          </div>
        </Disclosure>

        {season ? (
          <>
            <Disclosure title={t('analysis.matches', { n: season.fixtures.length })} sub={`${season.w}${t('stat.W')} · ${season.d}${t('stat.D')} · ${season.l}${t('stat.L')}`}>
              <div className="-mx-4 -my-4 divide-y divide-line">
                {season.fixtures.map((f) => (
                  <div key={f.round} className="flex items-center gap-2.5 px-4 py-2 text-[13.5px]">
                    <span className="mono w-7 text-ash">{f.round}</span>
                    <span className="mono w-5 text-[11px] text-ash">{f.home ? t('sim.home') : t('sim.away')}</span>
                    <span className="min-w-0 flex-1 break-words">{oppLabel(f.opp, f.oppName)}{f.giant ? <span className="ml-1.5 text-[11px] text-brass">★</span> : null}</span>
                    <span className="flex gap-0.5">{f.tb ? <span className="eyebrow rounded-sm bg-brass/15 px-1 text-[9.5px] text-brass" title={t('sim.tb')}>{t('bp.tb')}</span> : null}{f.lb ? <span className="eyebrow rounded-sm bg-brass/15 px-1 text-[9.5px] text-brass" title={t('sim.lb')}>{t('bp.lb')}</span> : null}</span>
                    <span className={`mono w-14 text-right font-semibold ${f.result === 'W' ? 'text-chalk' : f.result === 'D' ? 'text-ash-2' : 'text-loss'}`}>{f.result === 'L' ? '▼' : ''}{f.pf}–{f.pa}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[12px] text-ash">{t('analysis.matchesNote')} <Term id="bonus">{t('debrief.bonusTerm')}</Term></p>
            </Disclosure>

            <Disclosure title={t('analysis.table')} sub={t('result.position', { ord: ordinal(season.position) })}>
              <div className="scroll-x -mx-4 -my-4">
                <table className="w-full text-[13px]">
                  <thead><tr className="text-left text-ash">
                    <th className="py-2 pl-3 pr-1 font-medium">#</th><th className="px-2 py-2 font-medium">{t('table.team')}</th>
                    <th className="px-1.5 py-2 text-right font-medium">{t('stat.W')}</th>
                    <th className="px-1.5 py-2 text-right font-medium">{t('table.pd')}</th><th className="px-1.5 py-2 text-right font-medium">{t('table.bp')}</th><th className="px-3 py-2 text-right font-medium">{t('table.pts')}</th>
                  </tr></thead>
                  <tbody className="mono">
                    {season.table.map((r, i) => (
                      <tr key={r.id} className={`border-t border-line ${r.id === 'you' ? 'bg-brass/10 font-semibold text-brass' : ''} ${i === 5 ? 'border-b-2 border-b-line-2' : ''}`}>
                        <td className="py-1.5 pl-3 pr-1">{i + 1}</td>
                        <td className="break-words px-2 py-1.5" style={{ fontFamily: 'var(--font-sans)' }}>{r.id === 'you' ? 'ERA XV' : oppLabel(r.id, r.name)}</td>
                        <td className="px-1.5 py-1.5 text-right">{r.w}</td>
                        <td className="px-1.5 py-1.5 text-right">{signed(r.pf - r.pa)}</td><td className="px-1.5 py-1.5 text-right">{r.tb + r.lb}</td>
                        <td className="px-3 py-1.5 text-right">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[12px] text-ash">{t('analysis.tableNote')}</p>
            </Disclosure>

            <Disclosure title={t('sim.playoffs')} sub={story?.final ? t('story.finalWon', { team: oppLabel(story.final.winner, story.final.winner), score: `${Math.max(story.final.hs, story.final.as)}–${Math.min(story.final.hs, story.final.as)}` }) : ''}>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['qf', 'sf', 'final'] as const).map((st) => (
                  <div key={st} className="flex flex-col gap-2">
                    <p className="eyebrow text-[10px] text-ash">{t(`po.${st}`)}</p>
                    {season.playoffs.filter((p) => p.stage === st).map((p, i) => (
                      <Card key={i} className={`px-3 py-2 text-[13px] ${p.home === 'you' || p.away === 'you' ? 'border-brass/50' : ''}`}>
                        <PoRow id={p.home} score={p.hs} won={p.winner === p.home} />
                        <PoRow id={p.away} score={p.as} won={p.winner === p.away} />
                        {p.kc ? <p className="mono text-[11px] text-ash">{t('po.kc', { a: p.kc[0], b: p.kc[1] })}</p> : p.et ? <p className="mono text-[11px] text-ash">{t('po.et')}</p> : null}
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </Disclosure>
          </>
        ) : null}

        {gauntlet ? (
          <Disclosure title={t('gauntlet.run')} sub={t('gauntlet.legendsN', { n: gauntlet.beaten, max: gauntlet.max })} defaultOpen>
            <div className="-mx-4 -my-4 divide-y divide-line">
              {gauntlet.ties.map((g, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                  <span className="mono w-6 text-ash">{i + 1}</span>
                  <span className="min-w-0 flex-1 break-words">{oppLabel(g.opp, g.oppName)}</span>
                  <span className={`mono font-semibold ${g.won ? 'text-win' : 'text-loss'}`}>{g.won ? '▲' : '▼'} {g.pf}–{g.pa}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[12px] text-ash">{t('analysis.gauntletNote')}</p>
          </Disclosure>
        ) : null}
      </div>
    </Screen>
  );
}

function AreaRow({ a, tone }: { a: AreaReading; tone: 'win' | 'loss' | 'ash' }) {
  const label = t(`staff.${a.area}.${tone === 'win' ? 'up' : tone === 'loss' ? 'down' : 'low'}`);
  return (
    <li className="px-4 py-3">
      <p className={`display text-[21px] font-black ${tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-chalk'}`}>
        <span aria-hidden>{tone === 'win' ? '▲ ' : tone === 'loss' ? '▼ ' : '◆ '}</span>{label}
      </p>
      <p className="mt-0.5 text-[13px] text-ash-2">
        {a.dims.map((d) => `${dimName(d.dim)} ${d.value}`).join(' · ')} <span className="text-ash">— {t(a.delta >= 0 ? 'debrief.vsLeagueUp' : 'debrief.vsLeagueDown', { n: Math.abs(a.delta) })}</span>
      </p>
    </li>
  );
}

function PoRow({ id, score, won }: { id: string; score: number; won: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${won ? 'font-semibold text-chalk' : 'text-ash-2'}`}>
      <span className="break-words">{won ? '▲ ' : ''}{id === 'you' ? 'ERA XV' : oppLabel(id, id)}</span><span className="mono">{score}</span>
    </div>
  );
}
function Kv({ k, v }: { k: string; v: string }) {
  return <div><p className="text-[12px] text-ash">{k}</p><p className="display text-[20px] font-extrabold">{upper(v)}</p></div>;
}
function RangeBar({ exp, actual, max }: { exp: Expected; actual: number; max: number }) {
  const x = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div className="relative mt-4 h-2.5 rounded-sm bg-ink-4" aria-hidden>
      <div className="absolute inset-y-0 rounded-sm bg-chalk/25" style={{ left: x(exp.p10), width: `calc(${x(exp.p90)} - ${x(exp.p10)})` }} />
      <div className="absolute -top-1 h-4.5 w-0.5 bg-ash-2" style={{ left: x(exp.mean) }} />
      <div className="absolute -top-1.5 h-5.5 w-1.5 -translate-x-1/2 rounded-sm bg-brass" style={{ left: x(actual) }} />
    </div>
  );
}
