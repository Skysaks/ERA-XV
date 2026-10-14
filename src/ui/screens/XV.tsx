import React, { useEffect, useMemo, useState } from 'react';
import {
  MODES, PLAN_DEF, SLOTS, byKey, compositionDiagnosis, optimise, posRating, responsibilities, swapSlots, teamProfile,
  type DIMS, type FitItem, type Lineup, type Optimisation, type PlanId, type TeamProfile,
} from '../../engine/index';
import { Button, Card, Help, IconArrow, Panel, Screen, Sheet, StatRow, TopBar } from '../components/ui';
import { Pitch } from '../components/Pitch';
import { TeamSheet } from '../components/rugby';
import { dimName, posShort, roleName, teamLabel, teamOfPlayer } from '../format';
import { t } from '../i18n';
import { P, type Session } from '../game';

export function synergyText(id: string, slots: number[], lineup: Lineup): string {
  const names = slots.map((n) => lineup[n]).filter(Boolean).map((k) => P(k!).short).join(', ');
  return t(`synergy.${id}`, { names });
}

export function fitItemText(it: FitItem, lineup: Lineup): string {
  if (it.kind === 'dim') return t('fitx.dim', { dim: dimName(it.dim!), v: it.value!, t: it.thr! });
  if (it.kind === 'pos') { const k = lineup[it.slot!]; return t('fitx.pos', { name: k ? P(k).short : it.label, slot: `${it.slot} ${posShort(SLOTS[it.slot! - 1].pos)}` }); }
  return t(`synergy.${it.synergy}.short`);
}

export function healthItems(prof: TeamProfile): { sev: 'high' | 'mid'; text: string }[] {
  const out: { sev: 'high' | 'mid'; text: string }[] = [];
  if (prof.uncontested) out.push({ sev: 'high', text: t('health.uncontested') });
  if (prof.synergies.some((s) => s.id === 'noKicker')) out.push({ sev: 'high', text: t('health.noKicker', { n: prof.boot }) });
  const plan = PLAN_DEF[prof.plan];
  const crit = (Object.keys(prof.dims) as (typeof DIMS)[number][]).filter((d) => prof.dims[d] < plan.thr[d] - 6).sort((a, b) => prof.dims[a] - plan.thr[a] - (prof.dims[b] - plan.thr[b]));
  if (crit[0]) out.push({ sev: 'mid', text: t('health.critical', { dim: dimName(crit[0]) }) });
  return out;
}

export function XV({ session, onHome, onChange, onNext, nextLabel, hideRatings, vsLabel }: {
  session: Session; onHome: () => void; onChange: (lineup: Lineup, plan: PlanId) => void; onNext: () => void; nextLabel?: string; hideRatings: boolean; vsLabel?: string;
}) {
  const { lineup, plan, state } = session;
  const prof = useMemo(() => teamProfile(lineup, byKey, plan), [lineup, plan]);
  const resp = useMemo(() => responsibilities(prof), [prof]);
  const diag = useMemo(() => compositionDiagnosis(prof), [prof]);
  const [sel, setSel] = useState<number | null>(null);
  const [view, setView] = useState<'sheet' | 'pitch'>('sheet');
  const [fitOpen, setFitOpen] = useState(false);
  const [optOpen, setOptOpen] = useState(false);
  const [opt, setOpt] = useState<Optimisation | null>(null);
  const [undo, setUndo] = useState<{ lineup: Lineup; plan: PlanId } | null>(null);
  const gauntlet = !!MODES[state.cfg.mode].gauntlet;

  useEffect(() => {
    setOpt(null);
    const h = setTimeout(() => setOpt(optimise(lineup, plan, state.cfg.seed, state.cfg.ruleset)), 60);
    return () => clearTimeout(h);
  }, [lineup, plan, state.cfg.seed, state.cfg.ruleset]);

  const tap = (n: number) => {
    if (sel === null) { setSel(n); return; }
    if (sel === n) { setSel(null); return; }
    setUndo({ lineup, plan });
    onChange(swapSlots(lineup, sel, n), plan);
    setSel(null);
  };
  const health = healthItems(prof);
  const good = prof.synergies.filter((s) => s.delta > 0);
  const bad = prof.synergies.filter((s) => s.delta < 0 && s.id !== 'noKicker' && s.id !== 'uncontested');
  const rowOf = (n: number) => {
    const sv = prof.slots.find((s) => s.n === n);
    return sv ? { n, player: sv.player, rating: sv.rating, kind: sv.kind, role: roleName(sv.player.role) } : { n };
  };
  const badge = (n: number) => {
    const marks: ('captain' | 'kicker' | 'lineout')[] = [];
    if (resp.captain?.slot === n) marks.push('captain');
    if (resp.kicker?.slot === n) marks.push('kicker');
    if (resp.lineout?.slot === n) marks.push('lineout');
    return marks.length ? <span className="mono shrink-0 text-[11px] font-semibold text-brass" aria-label={marks.map((m) => t(`resp.${m}`)).join(', ')}>{marks.map((m) => t(`resp.mark.${m}`)).join(' ')}</span> : null;
  };

  return (
    <Screen wide className="pb-28">
      <TopBar onHome={onHome}
        title={<div className="min-w-0"><p className="eyebrow text-[10.5px] text-ash">{vsLabel ?? t(`mode.${state.cfg.mode}.name`)}</p><h1 className="display text-[24px] font-black leading-[0.95] min-[360px]:text-[28px]">{t('sheet.title')}</h1></div>}
        right={<button type="button" onClick={() => setFitOpen(true)} className="flex min-h-11 flex-col items-end justify-center rounded-lg px-2 hover:bg-ink-3" aria-label={t('fitx.open')}>
          <span className="eyebrow text-[10px] text-ash">{t('sheet.cohesion')}</span>
          <span className={`display tnum text-[28px] font-black leading-none ${prof.fit < 70 ? 'text-loss' : 'text-chalk'}`}>{prof.fit}</span>
        </button>} />

      <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-3">
          {health.some((h) => h.sev === 'high') ? (
            <Panel tone="loss" label={t('health.title')}>
              <ul className="flex flex-col gap-1 px-4 py-3 text-[14px]">{health.map((h, i) => <li key={i} className={h.sev === 'high' ? 'text-loss' : 'text-ash-2'}>{h.sev === 'high' ? '⚠' : '·'} {h.text}</li>)}</ul>
            </Panel>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <div role="tablist" aria-label={t('sheet.view')} className="flex shrink-0 rounded-lg border border-line bg-ink-2 p-0.5">
              {(['sheet', 'pitch'] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} type="button" onClick={() => setView(v)}
                  className={`display h-10 whitespace-nowrap rounded-md px-3.5 text-[16px] font-bold transition ${view === v ? 'bg-chalk text-ink' : 'text-ash-2 hover:text-chalk'}`}>{t(`sheet.view.${v}`)}</button>
              ))}
            </div>
            <span className="min-w-[9rem] flex-1 text-[12.5px] text-ash min-[400px]:text-right">{sel === null ? t('xv.swapHint') : t('xv.swapNow')}</span>
          </div>
          {view === 'sheet' ? (
            <TeamSheet lineup={lineup} rowOf={rowOf} hideRatings={hideRatings} onSlot={tap} selected={sel} badges={badge} />
          ) : (
            <Pitch lineup={lineup} byKey={byKey} hideRatings={hideRatings} onSlot={tap} selected={sel}
              ratingAt={(n) => { const k = lineup[n]; return k ? posRating(P(k), SLOTS[n - 1].pos).rating : undefined; }}
              kindAt={(n) => prof.slots.find((s) => s.n === n)?.kind} className="mx-auto max-w-[440px]" />
          )}
          {undo ? <button type="button" className="self-start text-[14px] text-ash-2 underline underline-offset-2" onClick={() => { onChange(undo.lineup, undo.plan); setUndo(null); }}>{t('optimise.undo')}</button> : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <StatRow items={[
            { label: t('stat.pack'), value: hideRatings ? '—' : prof.pack },
            { label: t('stat.backs'), value: hideRatings ? '—' : prof.backs },
            { label: t('stat.def'), value: hideRatings ? '—' : prof.def },
            { label: t('stat.boot'), value: hideRatings ? '—' : prof.boot, tone: prof.boot < 72 ? 'loss' : undefined },
            { label: t('stat.ovr'), value: hideRatings ? '—' : prof.ovr, tone: 'brass' },
          ]} />

          <Panel label={t('resp.title')} aside={<Help id="responsibilities" label={t('resp.title')} />}>
            <dl className="divide-y divide-line">
              {resp.captain ? <RespRow k={t('resp.captain')} letter={t('resp.mark.captain')} name={resp.captain.player.name} slot={resp.captain.slot}
                sub={resp.captain.historic ? t('resp.captainHistoric', { team: teamLabel(teamOfPlayer(resp.captain.player)) }) : t('resp.captainNamed')} /> : null}
              {resp.kicker ? <RespRow k={t('resp.kicker')} letter={t('resp.mark.kicker')} name={resp.kicker.player.name} slot={resp.kicker.slot} sub={hideRatings ? t('resp.kickerSub') : `${t('attr.goalKick')} ${resp.kicker.value}`} warn={prof.boot < 72} /> : null}
              {resp.lineout ? <RespRow k={t('resp.lineout')} letter={t('resp.mark.lineout')} name={resp.lineout.player.name} slot={resp.lineout.slot} sub={hideRatings ? t('resp.lineoutSub') : `${t('attr.lineout')} ${resp.lineout.value}`} /> : null}
            </dl>
          </Panel>

          {diag.misfits.length ? <DiagnosisPanel prof={prof} /> : null}

          {good.length || bad.length ? (
            <div className="flex flex-wrap gap-1.5">
              {good.map((s) => <span key={s.id} title={synergyText(s.id, s.slots, lineup)} className="eyebrow rounded-sm bg-win/12 px-2 py-1 text-[10.5px] text-win">+ {t(`synergy.${s.id}.short`)} {s.delta}</span>)}
              {bad.map((s) => <span key={s.id} title={synergyText(s.id, s.slots, lineup)} className="eyebrow rounded-sm bg-loss/12 px-2 py-1 text-[10.5px] text-loss">⚠ {t(`synergy.${s.id}.short`)} {s.delta}</span>)}
            </div>
          ) : null}

          <button type="button" onClick={() => setOptOpen(true)} disabled={!opt}
            className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-ink-2 px-4 py-3 text-left transition hover:border-line-2 disabled:opacity-50">
            <span>
              <span className="display block text-[19px] font-extrabold">{t('optimise.cta')}</span>
              <span className="text-[13px] text-ash-2">{opt ? (opt.changed ? (opt.fitTo !== opt.fitFrom ? t('optimise.fitLine', { from: opt.fitFrom, to: opt.fitTo }) : t('optimise.ptsLine', { from: Math.round(opt.expFrom), to: Math.round(opt.expTo) })) : t('optimise.already')) : '…'}</span>
            </span>
            <IconArrow className="h-5 w-5 text-ash-2" />
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="mx-auto flex max-w-[1080px] items-center gap-3">
          <p className="hidden min-w-0 flex-1 truncate text-[13px] text-ash-2 sm:block">{t('sheet.nextHint', { plan: t(`plan.${plan}.name`) })}</p>
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-[320px]" onClick={onNext}>
            {nextLabel ?? (gauntlet ? t('sheet.nextGauntlet') : t('sheet.next'))} <IconArrow className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <Sheet open={fitOpen} onClose={() => setFitOpen(false)} title={t('fitx.title', { n: prof.fit })}>
        <FitExplain prof={prof} lineup={lineup} />
      </Sheet>

      <Sheet open={optOpen} onClose={() => setOptOpen(false)} title={t('optimise.title')}>
        {opt ? (opt.changed ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="px-4 py-3"><p className="eyebrow text-[10.5px] text-ash">{t('stat.fit')}</p><p className="display tnum text-[28px] font-black">{opt.fitFrom} → <span className="text-win">{opt.fitTo}</span></p></Card>
              <Card className="px-4 py-3"><p className="eyebrow text-[10.5px] text-ash">{t('optimise.pts')}</p><p className="display tnum text-[28px] font-black">{Math.round(opt.expFrom)} → <span className="text-win">{Math.round(opt.expTo)}</span></p></Card>
            </div>
            <ul className="text-[14px] text-ash-2">
              {opt.plan !== plan ? <li>{t('optimise.plan', { from: t(`plan.${plan}.short`), to: t(`plan.${opt.plan}.short`) })}</li> : null}
              {opt.moves ? <li>{t('optimise.moves', { n: opt.moves })}</li> : null}
            </ul>
            <p className="text-[12px] text-ash">{t('optimise.note')}</p>
            <Button variant="primary" onClick={() => { setUndo({ lineup, plan }); onChange(opt.lineup, opt.plan); setOptOpen(false); }}>{t('optimise.apply')}</Button>
          </div>
        ) : <p className="text-[15px] text-ash-2">{t('optimise.none')}</p>) : <p className="text-ash">…</p>}
      </Sheet>
    </Screen>
  );
}

/** "Composition diagnosis": everyone outside his ideal zone, real problems apart from normal versatility. */
export function DiagnosisPanel({ prof, bare }: { prof: TeamProfile; bare?: boolean }) {
  const diag = compositionDiagnosis(prof);
  if (!diag.misfits.length) return bare ? <p className="text-[14px] text-ash-2">{t('diag.none')}</p> : null;
  const body = (
    <>
      <p className={`${bare ? '' : 'px-4 pt-3'} text-[14px] text-ash-2`}>{t('diag.count', { n: diag.misfits.length })}{diag.problems ? '' : ` ${t('diag.allCompatible')}`}</p>
      <ul className={`grid grid-cols-1 gap-2 ${bare ? 'mt-3' : 'px-4 py-3'} sm:grid-cols-2`}>
        {diag.misfits.slice(0, 8).map((m) => (
          <li key={m.slot} className={`rounded-lg border px-3 py-2 ${m.problem ? 'border-loss/40 bg-loss/[0.06]' : 'border-line bg-ink-3/50'}`}>
            <p className="display break-words text-[18px] font-extrabold">{m.player.short}</p>
            <p className="mono text-[11.5px] text-ash-2">{posShort(m.from)} → {posShort(m.to)} · n°{m.slot}</p>
            <p className={`mt-0.5 text-[12.5px] font-semibold ${m.problem ? 'text-loss' : 'text-brass'}`}>{m.problem ? `! ${t('sheet.oop')}` : `~ ${t('sheet.compat')}`} <span className="font-normal text-ash">· {t('diag.impact')} {t(`diag.impact.${m.impact}`)}</span></p>
          </li>
        ))}
      </ul>
    </>
  );
  if (bare) return body;
  return (
    <Panel label={t('diag.title')} tone={diag.problems ? 'loss' : undefined} aside={<span className="mono text-[11px] text-ash-2">{t('sheet.cohesion')} {prof.fit}</span>}>
      {body}
    </Panel>
  );
}

function RespRow({ k, letter, name, slot, sub, warn }: { k: string; letter: string; name: string; slot: number; sub: string; warn?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brass/50 text-[12px] font-semibold text-brass" aria-hidden>{letter}</span>
      <div className="min-w-0 flex-1">
        <dt className="eyebrow text-[10px] text-ash">{k}</dt>
        <dd className="break-words text-[15px] font-semibold">{name} <span className="mono text-[12px] font-medium text-ash">n°{slot}</span></dd>
      </div>
      <span className={`shrink-0 text-right text-[12.5px] ${warn ? 'text-loss' : 'text-ash-2'}`}>{warn ? '⚠ ' : ''}{sub}</span>
    </div>
  );
}

export function FitExplain({ prof, lineup }: { prof: TeamProfile; lineup: Lineup }) {
  const items = prof.fitItems;
  const raw = 100 + items.reduce((a, b) => a + b.delta, 0);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] text-ash-2">{t('gloss.fit')}</p>
      <div className="flex justify-between text-[15px]"><span>{t('fitx.start')}</span><span className="mono font-semibold">100</span></div>
      {items.map((it, i) => (
        <div key={i} className="flex justify-between gap-3 text-[14px]">
          <span className="text-ash-2">{fitItemText(it, lineup)}</span>
          <span className={`mono shrink-0 font-semibold ${it.delta > 0 ? 'text-win' : 'text-loss'}`}>{it.delta > 0 ? '+' : ''}{it.delta}</span>
        </div>
      ))}
      {raw < 30 ? <p className="text-[13px] text-ash">{t('fitx.floor')}</p> : null}
      {raw > 100 ? <p className="text-[13px] text-ash">{t('fitx.cap')}</p> : null}
      <div className="mt-1 flex justify-between border-t border-line pt-2 text-[16px] font-bold"><span>{t('stat.fit')}</span><span className="mono">{prof.fit}</span></div>
      <p className="mt-2 text-[12px] text-ash">{t('fitx.note')}</p>
    </div>
  );
}
