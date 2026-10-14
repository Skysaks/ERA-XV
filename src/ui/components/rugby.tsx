import React from 'react';
import type { PlayerEra } from '../../data/schema';
import {
  GROUP_IDS, GROUP_SLOTS, SLOTS, stars, type FamKind, type GroupId, type Lineup, type Moment, type UnitState,
} from '../../engine/index';
import { dimName, posShort } from '../format';
import { t } from '../i18n';
import { Jersey, Term } from './ui';

/* ------------------------------------------------------------ unit rail */

/** The XV being built, by rugby unit: more visible than the round number. */
export function UnitRail({ units, flash }: { units: UnitState[]; flash?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 min-[360px]:grid-cols-4" role="list" aria-label={t('units.aria')}>
      {units.map((u) => {
        const on = flash === u.id;
        return (
          <div key={u.id} role="listitem" aria-label={t('units.itemAria', { unit: t(`unit2.${u.id}`), n: u.filled, max: u.total })}
            className={`min-w-0 rounded-md border px-1.5 pb-1.5 pt-1 transition ${u.complete ? 'border-brass/60 bg-brass/10' : 'border-line bg-ink-2'} ${on ? 'animate-pop' : ''}`}>
            <span className={`mono block whitespace-nowrap text-[10.5px] font-medium uppercase tracking-[0.04em] min-[360px]:text-[10px] min-[400px]:tracking-[0.08em] ${u.complete ? 'text-brass' : 'text-ash-2'}`}>{t(`unit2.${u.id}`)}</span>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex flex-1 gap-[2px]" aria-hidden>
                {Array.from({ length: u.total }, (_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-[1px] ${i < u.filled ? (u.complete ? 'bg-brass' : 'bg-chalk') : 'bg-line-2'}`} />
                ))}
              </div>
              <span className={`mono shrink-0 text-[11px] font-semibold leading-none ${u.complete ? 'text-brass' : 'text-chalk'}`}>{u.complete ? '✓' : `${u.filled}/${u.total}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- moment */

/** A short, non-blocking "unit complete" card. The draft never waits for it. */
export function MomentCard({ m }: { m: Moment }) {
  const halves = m.id === 'halves';
  return (
    <div className="animate-rise rounded-lg border border-brass/70 bg-ink-3 px-3.5 py-2 shadow-2xl" role="status" aria-live="polite">
      <p className="eyebrow text-[10.5px] text-brass">◆ {t(`moment.${m.id}`)}</p>
      {halves || m.id === 'centres' ? <p className="display mt-0.5 text-[21px] font-extrabold leading-tight">{m.names.join(' × ')}</p> : null}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
        {m.values.map((v) => (
          <span key={v.dim} className="text-[13.5px] text-ash-2">
            {dimName(v.dim)} <span className="mono font-semibold text-chalk">{v.value}</span>
            {halves ? <span className="ml-1 text-brass" aria-label={t('moment.starsAria', { n: stars(v.value) })}>{'★'.repeat(stars(v.value))}<span className="text-line-2">{'★'.repeat(5 - stars(v.value))}</span></span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- team sheet */

export interface SheetRow { n: number; player?: PlayerEra; rating?: number; kind?: FamKind; role?: string }
const isProblem = (k?: FamKind) => k === 'outOfPosition' || k === 'frontRow' || k === 'unfamiliar';

/** The match sheet: first row to back three, the way a rugby team is read. */
export function TeamSheet({ lineup, rowOf, hideRatings, onSlot, selected, compact, badges }: {
  lineup: Lineup;
  rowOf: (n: number) => SheetRow;
  hideRatings?: boolean;
  onSlot?: (n: number) => void;
  selected?: number | null;
  compact?: boolean;
  badges?: (n: number) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {GROUP_IDS.map((g) => <SheetGroup key={g} g={g} lineup={lineup} rowOf={rowOf} hideRatings={hideRatings} onSlot={onSlot} selected={selected} compact={compact} badges={badges} />)}
    </div>
  );
}

function SheetGroup({ g, lineup, rowOf, hideRatings, onSlot, selected, compact, badges }: {
  g: GroupId; lineup: Lineup; rowOf: (n: number) => SheetRow; hideRatings?: boolean; onSlot?: (n: number) => void; selected?: number | null; compact?: boolean; badges?: (n: number) => React.ReactNode;
}) {
  const slots = GROUP_SLOTS[g];
  return (
    <section aria-label={t(`group.${g}`)}>
      <div className="mb-1 flex items-baseline justify-between px-1">
        <h3 className="eyebrow text-[10.5px] text-ash"><Term id={`group.${g}`}>{t(`group.${g}`)}</Term></h3>
        <span className="mono text-[10.5px] text-ash">{slots.join(' · ')}</span>
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-ink-2">
        {slots.map((n) => {
          const r = rowOf(n);
          const p = r.player ?? undefined;
          const sel = selected === n;
          const problem = isProblem(r.kind);
          const compat = !!r.kind && r.kind !== 'natural' && !problem;
          const body = (
            <>
              <Jersey n={n} tone={sel ? 'brass' : p ? 'ivory' : 'dark'} size={compact ? 'sm' : 'md'} />
              <span className="min-w-0 flex-1">
                <span className={`display block font-extrabold leading-[1.02] ${compact ? 'text-[18px]' : 'text-[21px]'} ${p ? '' : 'text-ash'}`}>{p ? p.name : '—'}</span>
                {!compact ? (
                  <span className="block text-[12.5px] leading-snug text-ash-2">
                    {p ? <><span className="font-semibold text-chalk/85">{p.pos.map(posShort).join('/')}</span>{r.role ? ` · ${r.role}` : ''}</> : posShort(SLOTS[n - 1].pos)}
                  </span>
                ) : null}
                {p && (problem || compat) ? (
                  <span className={`eyebrow mt-0.5 inline-block rounded-sm px-1.5 py-0.5 text-[9.5px] ${problem ? 'bg-loss/15 text-loss' : 'bg-brass/12 text-brass'}`}>{problem ? `! ${t('sheet.oop')}` : `~ ${t('sheet.compat')}`}</span>
                ) : null}
              </span>
              {badges ? badges(n) : null}
              {p && !hideRatings && r.rating !== undefined ? <span className="display tnum w-9 shrink-0 text-right text-[24px] font-extrabold">{r.rating}</span> : null}
            </>
          );
          const cls = `flex w-full items-center gap-3 px-3 ${compact ? 'py-1.5' : 'py-2'} text-left ${sel ? 'bg-brass/10' : ''}`;
          return onSlot ? (
            <button key={n} type="button" onClick={() => onSlot(n)} aria-pressed={sel} className={`${cls} min-h-12 transition hover:bg-ink-3`}
              aria-label={p ? t('sheet.rowAria', { n, name: p.name }) : `${n}`}>{body}</button>
          ) : <div key={n} className={cls}>{body}</div>;
        })}
      </div>
    </section>
  );
}

/** Pack / halves / centres / back three filled, from a lineup (for the Clubhouse Cup and the sheet header). */
