import React from 'react';
import { signed, upper } from '../format';
import { ordinal, t } from '../i18n';

export interface SideView { name: string; me: boolean; pos?: number; pts: number; fit: number; diff?: number; bonus?: number; w?: number; d?: number; l?: number; note?: string }

/** Two XVs on the same draw, side by side: the standing first, then the numbers that explain it. */
export function CompareTable({ a, b }: { a: SideView; b: SideView }) {
  type Row = { k: string; va?: number; vb?: number; show: (v?: number) => string; better: 'high' | 'low'; big?: boolean };
  const rows: Row[] = [
    { k: t('cmp.pos'), va: a.pos, vb: b.pos, show: (v) => (v ? ordinal(v) : '—'), better: 'low' },
    { k: t('cmp.pts'), va: a.pts, vb: b.pts, show: (v) => (v === undefined ? '—' : String(v)), better: 'high', big: true },
    { k: t('stat.fit'), va: a.fit, vb: b.fit, show: (v) => (v === undefined ? '—' : String(v)), better: 'high' },
    { k: t('cmp.diff'), va: a.diff, vb: b.diff, show: (v) => (v === undefined ? '—' : signed(v)), better: 'high' },
    { k: t('cmp.bonus'), va: a.bonus, vb: b.bonus, show: (v) => (v === undefined ? '—' : String(v)), better: 'high' },
  ];
  const win = (r: Row, side: 'a' | 'b') => {
    if (r.va === undefined || r.vb === undefined || r.va === r.vb) return false;
    const aWins = r.better === 'high' ? r.va > r.vb : r.va < r.vb;
    return side === 'a' ? aWins : !aWins;
  };
  return (
    <table className="w-full table-fixed text-[14px]">
      <thead>
        <tr>
          <th className="w-[34%]" />
          {[a, b].map((s, i) => (
            <th key={i} className="px-1 pb-2 text-right align-bottom">
              <span className={`display block break-words text-[18px] font-extrabold leading-tight ${s.me ? 'text-chalk' : 'text-ash-2'}`}>{upper(s.name)}</span>
              {s.note ? <span className="block text-[11px] font-normal text-ash">{s.note}</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.k} className="border-t border-line">
            <th scope="row" className="eyebrow py-2 pr-2 text-left text-[10px] font-medium text-ash">{r.k}</th>
            {(['a', 'b'] as const).map((side) => {
              const v = side === 'a' ? r.va : r.vb;
              const w = win(r, side);
              return <td key={side} className={`mono py-2 pl-1 text-right ${r.big ? 'display text-[22px] font-black' : 'font-semibold'} ${w ? 'text-win' : 'text-chalk'}`}>{w ? <span className="sr-only">{t('cmp.better')} </span> : null}{w ? '▲ ' : ''}{r.show(v)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
