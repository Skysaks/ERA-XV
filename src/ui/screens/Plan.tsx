import React, { useEffect, useMemo, useState } from 'react';
import { MODES, PLANS, allPlanReports, planOptions, type Lineup, type PlanId, type PlanReport, type DraftState } from '../../engine/index';
import { Button, Help, IconArrow, IconBack, IconButton, Screen, Term } from '../components/ui';
import { dimName } from '../format';
import { Coach } from '../components/Coach';
import { t } from '../i18n';

export function Plan({ state, lineup, plan, onChange, onBack, onPlay, playLabel, vsLabel, coach = true }: {
  state: DraftState; lineup: Lineup; plan: PlanId; onChange: (p: PlanId) => void; onBack: () => void; onPlay: () => void; playLabel?: string; vsLabel?: string; coach?: boolean;
}) {
  const reports = useMemo(() => allPlanReports(lineup), [lineup]);
  const [est, setEst] = useState<Record<string, number> | null>(null);
  const gauntlet = !!MODES[state.cfg.mode].gauntlet;
  useEffect(() => {
    setEst(null);
    const h = setTimeout(() => {
      const o = planOptions(lineup, state.cfg.seed, state.cfg.ruleset, 24);
      setEst(Object.fromEntries(o.map((x) => [x.plan, Math.round(x.exp)])));
    }, 60);
    return () => clearTimeout(h);
  }, [lineup, state.cfg.seed, state.cfg.ruleset]);
  const best = est ? PLANS.slice().sort((a, b) => (est[b] ?? 0) - (est[a] ?? 0))[0] : null;

  return (
    <Screen className="pb-28">
      <div className="flex min-h-12 items-center gap-2">
        <IconButton label={t('common.back')} onClick={onBack} className="-ml-2.5"><IconBack className="h-6 w-6" /></IconButton>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[10.5px] text-ash">{vsLabel ?? t(`mode.${state.cfg.mode}.name`)}</p>
          <h1 className="display text-[28px] font-black">{t('plan2.title')}</h1>
        </div>
        <Help id="plan" label={t('plan2.title')} />
      </div>
      <p className="mt-1 text-[14px] text-ash-2">{t('plan2.intro')}</p>
      {coach ? <div className="mt-3"><Coach step="plan" /></div> : null}

      <div className="mt-4 flex flex-col gap-2.5" role="radiogroup" aria-label={t('plan2.title')}>
        {reports.map((r) => (
          <PlanCard key={r.plan} r={r} selected={r.plan === plan} est={est?.[r.plan]} best={!gauntlet && best === r.plan} onSelect={() => onChange(r.plan)} />
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ash">{t('plan.estimate')}</p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="mx-auto max-w-[560px]">
          <Button variant="primary" size="lg" className="w-full py-1.5" onClick={onPlay}>
            <span className="flex min-w-0 flex-col items-center leading-none">
              <span>{playLabel ?? (gauntlet ? t('xv.gauntlet') : t('plan2.playShort'))}</span>
              <span className="mono mt-1 text-[11.5px] font-semibold normal-case tracking-normal">{t(`plan.${plan}.name`)}</span>
            </span>
            <IconArrow className="h-6 w-6 shrink-0" />
          </Button>
        </div>
      </div>
    </Screen>
  );
}

function PlanCard({ r, selected, est, best, onSelect }: { r: PlanReport; selected: boolean; est?: number; best: boolean; onSelect: () => void }) {
  const fitTone = r.fit >= 90 ? 'text-win' : r.fit < 70 ? 'text-loss' : 'text-chalk';
  return (
    <div className={`rounded-xl border transition ${selected ? 'border-brass bg-brass/[0.07]' : 'border-line bg-ink-2'}`}>
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-brass' : 'border-line-2'}`} aria-hidden>
          {selected ? <span className="h-2.5 w-2.5 rounded-full bg-brass" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="display text-[22px] font-black">{t(`plan.${r.plan}.name`)}</span>
            {best ? <span className="eyebrow rounded-sm bg-brass px-1.5 py-0.5 text-[9.5px] text-ink">{t('plan.best')}</span> : null}
          </span>
          <span className="mt-0.5 block text-[13.5px] leading-snug text-ash-2">{t(`plan.${r.plan}.tag`)}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="eyebrow block text-[9.5px] text-ash">{t('stat.fit')}</span>
          <span className={`display tnum block text-[26px] font-black leading-none ${fitTone}`}>{r.fit}</span>
          <span className="mono block text-[11px] text-ash">{est !== undefined ? t('plan.exp', { n: est }) : '…'}</span>
        </span>
      </button>
      {selected ? (
        <div className="animate-fade border-t border-line px-4 pb-4 pt-3">
          <p className={`text-[14px] font-medium ${r.verdict.kind === 'limited' ? 'text-loss' : r.verdict.kind === 'natural' ? 'text-win' : 'text-ash-2'}`}>
            {r.verdict.kind === 'limited' ? '⚠ ' : r.verdict.kind === 'natural' ? '✓ ' : ''}{verdictText(r)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="eyebrow text-[10px] text-ash">{t('plan2.favoured')}</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-[13.5px]">
                {r.favoured.length ? r.favoured.map((d) => <li key={d} className="text-chalk"><span className="text-win" aria-hidden>↑ </span>{dimName(d)}</li>) : <li className="text-ash-2">{t('plan2.none')}</li>}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-ash">{t('plan2.reduced')}</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-[13.5px]">
                {r.reduced.length ? r.reduced.map((d) => <li key={d} className="text-ash-2"><span aria-hidden>↓ </span>{dimName(d)}</li>) : <li className="text-ash-2">{t('plan2.none')}</li>}
              </ul>
            </div>
          </div>
          {r.needs.length ? (
            <div className="mt-3">
              <p className="eyebrow text-[10px] text-ash">{t('plan2.needs')}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {r.needs.map((n) => (
                  <li key={n.dim} className={`mono rounded-sm px-1.5 py-0.5 text-[11.5px] ${n.ok ? 'bg-win/10 text-win' : 'bg-loss/12 text-loss'}`}>
                    {n.ok ? '✓' : '✗'} {dimName(n.dim)} {n.value}/{n.thr}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-3 text-[12.5px] text-ash">
            <Term id={`plan.${r.plan}`}>{t('plan2.philosophy')}</Term> · {t(`plan.${r.plan}.risk`)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function verdictText(r: PlanReport): string {
  const v = r.verdict;
  if (v.kind === 'limited') return t('plan2.limited', { dim: dimName(v.dim), v: v.value, thr: v.thr });
  if (v.kind === 'natural') {
    if (v.groups.length >= 2) return t('plan2.natural2', { a: t(`groupPoss.${v.groups[0]}`), b: t(`groupPoss.${v.groups[1]}`) });
    if (v.groups.length === 1) return t('plan2.natural1', { a: t(`groupPoss.${v.groups[0]}`) });
    return t('plan2.natural0');
  }
  return t('plan2.workable', { fit: r.fit });
}
