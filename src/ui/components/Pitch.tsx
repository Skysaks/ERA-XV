import React from 'react';
import type { PlayerEra } from '../../data/schema';
import { SLOTS, type FamKind } from '../../engine/rugby';
import type { Lineup } from '../../engine/team';
import { posShort } from '../format';
import { t } from '../i18n';

/** A vertical rugby pitch as a tactics board: try lines, 22 m, 10 m, halfway, H-posts at both ends. */
export function PitchLines({ className = '' }: { className?: string }) {
  const dash = '1.4 1.6';
  const posts = (y1: number, y2: number, bar: number) => (
    <g stroke="rgb(200 164 93 / 0.8)" strokeWidth="0.55" vectorEffect="non-scaling-stroke">
      <line x1="33" y1={y1} x2="33" y2={y2} />
      <line x1="39" y1={y1} x2="39" y2={y2} />
      <line x1="33" y1={bar} x2="39" y2={bar} />
    </g>
  );
  return (
    <svg viewBox="0 0 72 100" preserveAspectRatio="none" className={`absolute inset-0 h-full w-full ${className}`} aria-hidden>
      <rect x="0" y="0" width="72" height="100" fill="var(--color-pitch)" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x="0" y={i * 10} width="72" height="5" fill="var(--color-pitch-2)" opacity="0.6" />
      ))}
      <g stroke="rgb(241 235 221 / 0.2)" strokeWidth="0.35" fill="none" vectorEffect="non-scaling-stroke">
        <rect x="3" y="2" width="66" height="96" rx="0.4" />
        <line x1="3" y1="6" x2="69" y2="6" />
        <line x1="3" y1="94" x2="69" y2="94" />
        <line x1="3" y1="25" x2="69" y2="25" />
        <line x1="3" y1="75" x2="69" y2="75" />
        <line x1="3" y1="50" x2="69" y2="50" />
        <line x1="3" y1="41" x2="69" y2="41" strokeDasharray={dash} />
        <line x1="3" y1="59" x2="69" y2="59" strokeDasharray={dash} />
        <line x1="8" y1="6" x2="8" y2="94" strokeDasharray="0.6 3" />
        <line x1="64" y1="6" x2="64" y2="94" strokeDasharray="0.6 3" />
        <line x1="17" y1="6" x2="17" y2="94" strokeDasharray="0.6 5" />
        <line x1="55" y1="6" x2="55" y2="94" strokeDasharray="0.6 5" />
      </g>
      {posts(1.2, 6, 4.2)}
      {posts(94, 98.8, 95.8)}
      <g fill="rgb(241 235 221 / 0.26)" fontSize="2.3" fontFamily="var(--font-mono)" fontWeight="500">
        <text x="4.2" y="24.2">22</text>
        <text x="4.2" y="74.2">22</text>
        <text x="4.2" y="40.2">10</text>
        <text x="4.2" y="58.2">10</text>
      </g>
    </svg>
  );
}

export interface PitchProps {
  lineup: Lineup;
  byKey: (k: string) => PlayerEra | undefined;
  ratingAt?: (n: number) => number | undefined;
  kindAt?: (n: number) => FamKind | undefined;
  hideRatings?: boolean;
  highlight?: number | null;
  selected?: number | null;
  marked?: number[];
  onSlot?: (n: number) => void;
  size?: 'sm' | 'md';
  className?: string;
  hint?: React.ReactNode;
  slotLabel?: (n: number) => string;
  /** hide surname plates (compact board during the draft on small phones) */
  noNames?: boolean;
}

export function Pitch({ lineup, byKey, ratingAt, kindAt, hideRatings, highlight, selected, marked = [], onSlot, size = 'md', className = '', hint, slotLabel, noNames }: PitchProps) {
  const tok = size === 'sm' ? 'h-7 w-7 text-[14px]' : 'h-10 w-10 text-[19px] sm:h-11 sm:w-11 sm:text-[21px]';
  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full max-w-full overflow-hidden rounded-xl border border-line" style={{ aspectRatio: '0.74' }}>
        <PitchLines />
        {SLOTS.map((s) => {
          const key = lineup[s.n];
          const p = key ? byKey(key) : undefined;
          const kind = kindAt?.(s.n);
          const oop = !!p && !!kind && kind !== 'natural' && kind !== 'secondary';
          const bad = oop && (kind === 'outOfPosition' || kind === 'frontRow' || kind === 'unfamiliar');
          const isHi = highlight === s.n, isSel = selected === s.n, isMarked = marked.includes(s.n);
          const rating = p ? ratingAt?.(s.n) ?? p.rating : undefined;
          const ring = isSel ? 'ring-2 ring-brass ring-offset-2 ring-offset-pitch' : isHi ? 'ring-2 ring-brass animate-pulse-ring' : bad ? 'ring-2 ring-loss' : oop ? 'ring-2 ring-brass/70' : isMarked ? 'ring-2 ring-brass' : '';
          const label = p ? `${s.n} ${posShort(s.pos)}: ${p.name}${!hideRatings && rating !== undefined ? `, ${rating}` : ''}${oop ? ` · ${t(bad ? 'draft.oop' : 'draft.compatible')}` : ''}` : `${s.n} ${posShort(s.pos)}`;
          const content = (
            <>
              <span className={`display tnum relative flex items-center justify-center rounded-md font-extrabold transition ${tok} ${p ? 'bg-chalk text-ink shadow-[0_2px_0_rgb(0_0_0/0.35)]' : isHi ? 'border-2 border-dashed border-brass text-brass' : 'border border-dashed border-chalk/35 text-chalk/55'} ${ring}`}>
                {p ? (hideRatings ? s.n : rating) : (slotLabel ? slotLabel(s.n) : s.n)}
                {bad ? <span aria-hidden className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-loss text-[10px] font-black leading-none text-ink">!</span> : null}
              </span>
              {p && size !== 'sm' && !noNames ? (
                <span className="mt-1 max-w-[64px] truncate rounded-sm bg-ink/75 px-1 text-[11px] font-semibold leading-4 text-chalk sm:max-w-[84px] sm:text-[12px]">{p.short}</span>
              ) : !p && size !== 'sm' && !noNames ? (
                <span className="mono mt-0.5 text-[10px] font-medium text-chalk/50">{posShort(s.pos)}</span>
              ) : null}
            </>
          );
          const style: React.CSSProperties = { left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' };
          return onSlot ? (
            <button key={s.n} type="button" aria-label={label} aria-pressed={isSel} onClick={() => onSlot(s.n)} className="absolute flex min-h-11 min-w-11 flex-col items-center justify-center" style={style}>{content}</button>
          ) : (
            <div key={s.n} aria-label={label} role="img" className="absolute flex flex-col items-center" style={style}>{content}</div>
          );
        })}
      </div>
      {hint ? <div className="mt-2 flex justify-center">{hint}</div> : null}
    </div>
  );
}
