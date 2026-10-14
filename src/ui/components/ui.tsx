import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LANGS, type Lang, ordinal, t } from '../i18n';

/* -------------------------------------------------------------- icons */

type IconProps = { className?: string; title?: string };
const svg = (path: React.ReactNode, vb = '0 0 24 24') => ({ className = 'h-5 w-5', title }: IconProps) => (
  <svg viewBox={vb} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
    {title ? <title>{title}</title> : null}
    {path}
  </svg>
);
export const IconHome = svg(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></>);
export const IconGear = svg(<><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const IconReroll = svg(<><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>);
export const IconInfo = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" /></>);
export const IconStar = svg(<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8Z" />);
export const IconClose = svg(<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>);
export const IconArrow = svg(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconBack = svg(<><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>);
export const IconTrophy = svg(<><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 4" /><path d="M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4" /><path d="M8 20h8" /></>);
export const IconUsers = svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 11a3 3 0 1 0-1-5.8" /><path d="M21 20a6 6 0 0 0-4.5-5.8" /></>);
export const IconBook = svg(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20" /></>);
export const IconGrid = svg(<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>);
export const IconChevron = svg(<path d="m6 9 6 6 6-6" />);

/* ------------------------------------------------------------ buttons */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'quiet' | 'danger' | 'ivory'; size?: 'lg' | 'md' | 'sm' };
export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: BtnProps) {
  const base = 'display inline-flex items-center justify-center gap-2 rounded-lg py-1.5 text-center font-extrabold leading-tight transition duration-150 active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 select-none';
  const sizes = { lg: 'min-h-14 px-6 text-[24px]', md: 'min-h-12 px-5 text-[19px]', sm: 'min-h-10 px-3.5 text-[16px]' }[size];
  const v = {
    primary: 'bg-brass text-ink hover:bg-brass-2',
    ivory: 'bg-chalk text-ink hover:bg-white',
    ghost: 'border border-line-2 bg-ink-2 text-chalk hover:border-ash',
    quiet: 'text-chalk hover:text-brass',
    danger: 'border border-loss/60 text-loss',
  }[variant];
  return <button type="button" className={`${base} ${sizes} ${v} ${className}`} {...rest} />;
}

export function Chip({ active, className = '', children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" aria-pressed={active} className={`display h-11 shrink-0 rounded-md border px-3.5 text-[17px] font-bold transition ${active ? 'border-chalk bg-chalk text-ink' : 'border-line-2 text-ash-2 hover:border-ash hover:text-chalk'} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-ash-2 transition hover:text-chalk ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- layout */

export function Screen({ children, wide = false, className = '' }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return <main className={`mx-auto w-full ${wide ? 'max-w-[1080px]' : 'max-w-[560px]'} px-4 pb-10 pt-3 sm:px-5 ${className}`}>{children}</main>;
}

export function TopBar({ onHome, title, right, homeLabel }: { onHome?: () => void; title?: React.ReactNode; right?: React.ReactNode; homeLabel?: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2">
      {onHome ? (
        <IconButton label={homeLabel ?? t('common.home')} onClick={onHome} className="-ml-2.5"><IconHome className="h-6 w-6" /></IconButton>
      ) : null}
      <div className="min-w-0 flex-1">{title}</div>
      {right}
    </div>
  );
}

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="group" aria-label={t('common.language')} className="flex rounded-lg border border-line bg-ink-2 p-0.5">
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={l === lang} onClick={() => onChange(l)}
          className={`mono h-10 min-w-10 rounded-md px-2 text-[13px] font-semibold transition ${l === lang ? 'bg-chalk text-ink' : 'text-ash-2 hover:text-chalk'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, children, aside, className = '' }: { title: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow text-[12px] text-ash-2">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-ink-2 ${className}`}>{children}</div>;
}

/** A structured panel with a printed label strip (team-sheet style). */
export function Panel({ label, aside, children, className = '', tone }: { label?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string; tone?: 'brass' | 'loss' | 'win' }) {
  const edge = tone === 'brass' ? 'border-brass/45' : tone === 'loss' ? 'border-loss/45' : tone === 'win' ? 'border-win/40' : 'border-line';
  return (
    <section className={`overflow-hidden rounded-xl border bg-ink-2 ${edge} ${className}`}>
      {label ? (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-ink-3/60 px-4 py-2">
          <h2 className={`eyebrow text-[11px] ${tone === 'brass' ? 'text-brass' : tone === 'loss' ? 'text-loss' : tone === 'win' ? 'text-win' : 'text-ash-2'}`}>{label}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Progressive disclosure: a titled block that opens on demand. */
export function Disclosure({ title, sub, children, defaultOpen = false, className = '' }: { title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`rounded-xl border border-line bg-ink-2 ${className}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="display block text-[20px] font-extrabold">{title}</span>
          {sub ? <span className="block text-[13px] text-ash">{sub}</span> : null}
        </span>
        <span aria-hidden className={`text-ash-2 transition duration-200 ${open ? 'rotate-180' : ''}`}><IconChevron /></span>
      </button>
      {open ? <div className="animate-fade border-t border-line px-4 py-4">{children}</div> : null}
    </section>
  );
}

/** Shirt number plate, as printed on a team sheet. */
export function Jersey({ n, tone = 'ivory', size = 'md', className = '' }: { n: number | string; tone?: 'ivory' | 'dark' | 'brass' | 'loss'; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const tones = { ivory: 'bg-chalk text-ink', dark: 'border border-line-2 bg-ink-3 text-chalk', brass: 'bg-brass text-ink', loss: 'bg-loss text-ink' }[tone];
  const sizes = { sm: 'h-7 w-7 text-[15px]', md: 'h-9 w-9 text-[19px]', lg: 'h-12 w-12 text-[26px]' }[size];
  return <span className={`display tnum inline-flex shrink-0 items-center justify-center rounded-md font-extrabold ${tones} ${sizes} ${className}`}>{n}</span>;
}

/** A small inline mark that is never colour alone: icon + text. */
export function Mark({ tone, children, className = '' }: { tone: 'win' | 'loss' | 'brass' | 'ash'; children: React.ReactNode; className?: string }) {
  const c = { win: 'text-win', loss: 'text-loss', brass: 'text-brass', ash: 'text-ash-2' }[tone];
  const icon = { win: '▲', loss: '▼', brass: '◆', ash: '·' }[tone];
  return <span className={`inline-flex items-baseline gap-1.5 ${c} ${className}`}><span aria-hidden className="text-[0.8em]">{icon}</span><span>{children}</span></span>;
}

/** A rank as sport prints it: big number, small suffix kept in lower case (8e, 1er, 7th, 3.º). */
export function Ord({ n, className = '' }: { n: number; className?: string }) {
  const m = /^(\d+)(.*)$/.exec(ordinal(n));
  return <span className={className} aria-label={ordinal(n)}>{m?.[1] ?? n}<span aria-hidden className="ml-[0.03em] align-[0.85em] text-[0.4em] font-extrabold normal-case">{m?.[2] ?? ''}</span></span>;
}

/* ------------------------------------------------------------ glossary */

/**
 * Invisible teaching: a rugby term the reader can tap for one line of explanation. Never opens on its own.
 * The explanation lives in the locale under gloss.<id>.
 */
export function Term({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span ref={ref} className={`relative inline ${className}`}>
      <button type="button" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="cursor-help underline decoration-ash/70 decoration-dotted underline-offset-[3px] hover:decoration-brass">{children}</button>
      {open ? (
        <span role="tooltip" className="animate-fade absolute left-0 top-full z-40 mt-1.5 block w-[min(17rem,78vw)] rounded-lg border border-line-2 bg-ink-4 px-3 py-2 text-left text-[13px] font-normal normal-case leading-snug tracking-normal text-chalk shadow-xl" style={{ fontFamily: 'var(--font-sans)', fontStretch: '100%' }}>
          {t(`gloss.${id}`)}
        </span>
      ) : null}
    </span>
  );
}

/** Round "?" that explains a label without interrupting anything. */
export function Help({ id, label }: { id: string; label: string }) {
  return <Term id={id}><span className="sr-only">{label}</span><span aria-hidden className="mono inline-flex h-5 w-5 items-center justify-center rounded-full border border-line-2 text-[11px] text-ash-2">?</span></Term>;
}

/* -------------------------------------------------------------- stats */

export function StatRow({ items, highlight }: { items: { label: string; value: React.ReactNode; tone?: 'brass' | 'loss'; onClick?: () => void; aria?: string }[]; highlight?: number }) {
  return (
    <div className="grid rounded-xl border border-line bg-ink-2 px-1 py-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => {
        const tone = it.tone === 'brass' || i === highlight ? 'text-brass' : it.tone === 'loss' ? 'text-loss' : 'text-chalk';
        const inner = (
          <>
            <span className={`display tnum text-[26px] font-extrabold leading-none ${tone}`}>{it.value}</span>
            <span className="eyebrow mt-1.5 text-[10px] text-ash">{it.label}</span>
          </>
        );
        return it.onClick ? (
          <button key={i} type="button" onClick={it.onClick} aria-label={it.aria} className="flex min-h-11 flex-col items-center justify-center rounded-lg py-0.5 hover:bg-ink-3">{inner}</button>
        ) : (
          <div key={i} className="flex flex-col items-center py-0.5">{inner}</div>
        );
      })}
    </div>
  );
}

export function DimBar({ label, value, thr, tone }: { label: string; value: number; thr?: number; tone?: 'up' | 'down' }) {
  const pct = Math.max(0, Math.min(100, ((value - 50) / 50) * 100));
  const tpct = thr !== undefined ? Math.max(0, Math.min(100, ((thr - 50) / 50) * 100)) : undefined;
  const below = thr !== undefined && value < thr;
  return (
    <div className="grid grid-cols-[minmax(0,8.5rem)_1fr_2.2rem] items-center gap-3">
      <span className="break-words text-[14px] text-ash-2">{label}</span>
      <div className="relative h-2 rounded-sm bg-ink-4" role="meter" aria-valuemin={50} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
        <div className={`absolute inset-y-0 left-0 rounded-sm ${below ? 'bg-loss' : tone === 'up' ? 'bg-win' : 'bg-chalk/80'}`} style={{ width: `${pct}%` }} />
        {tpct !== undefined ? <div className="absolute -top-1 h-4 w-0.5 bg-brass" style={{ left: `calc(${tpct}% - 1px)` }} /> : null}
      </div>
      <span className={`mono text-right text-[13px] font-semibold ${below ? 'text-loss' : 'text-chalk'}`}>{below ? '▼' : ''}{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------- sheets */

export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('common.close')} className="animate-fade absolute inset-0 bg-[#020605]/75" onClick={onClose} />
      <div ref={ref} tabIndex={-1}
        className={`animate-sheet relative flex max-h-[92%] w-full flex-col overflow-hidden rounded-t-2xl border border-line-2 bg-ink-2 outline-none sm:rounded-2xl ${wide ? 'sm:max-w-[680px]' : 'sm:max-w-[520px]'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <div className="display min-w-0 flex-1 text-[24px] font-extrabold">{title}</div>
          <IconButton label={t('common.close')} onClick={onClose} className="-mr-2"><IconClose /></IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, stay, leave, onStay, onLeave }: { open: boolean; title: string; body: string; stay: string; leave: string; onStay: () => void; onLeave: () => void }) {
  return (
    <Sheet open={open} onClose={onStay} title={title}>
      <p className="text-[15px] text-ash-2">{body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button onClick={onLeave} variant="danger">{leave}</Button>
        <Button onClick={onStay} variant="primary">{stay}</Button>
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- toast */

const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ m: string; id: number } | null>(null);
  const show = useCallback((m: string) => setMsg({ m, id: Date.now() }), []);
  useEffect(() => { if (!msg) return; const h = setTimeout(() => setMsg(null), 2400); return () => clearTimeout(h); }, [msg]);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? (
        <div key={msg.id} role="status" className="animate-rise pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
          <div className="max-w-[min(92vw,420px)] rounded-lg bg-chalk px-4 py-2.5 text-center text-[15px] font-semibold text-ink shadow-lg">{msg.m}</div>
        </div>
      ) : null}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ----------------------------------------------------------- utilities */

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function Toggle({ id, checked, onChange, label, hint, disabled }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label htmlFor={id} className={`flex items-start gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-[13px] text-ash">{hint}</span> : null}
      </span>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brass' : 'bg-line-2'} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brass`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full transition ${checked ? 'left-6 bg-ink' : 'left-1 bg-ash-2'}`} />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.v} active={o.v === value} onClick={() => onChange(o.v)} role="radio" aria-checked={o.v === value}>{o.label}</Chip>
      ))}
    </div>
  );
}
