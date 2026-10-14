import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TEAM_BY_ID, parseTitle } from '../../data/index';
import {
  MODES, ROUNDS, SLOTS, byKey, canReroll, completedMoment, headlineTraits, optionInsights, posRating, rarityOf, teamProfile, unitProgress,
  type DraftState, type Moment, type MomentId, type OptionInsight, type PlanId,
} from '../../engine/index';
import { IconButton, IconHome, IconInfo, IconReroll, Screen } from '../components/ui';
import { Pitch } from '../components/Pitch';
import { Coach, type CoachStep } from '../components/Coach';
import { MomentCard, UnitRail } from '../components/rugby';
import { dimShort, posShort, roleName, shirtName, teamName, upper } from '../format';
import { t } from '../i18n';
import type { Settings } from '../store';
import { P } from '../game';
import { haptic } from '../feel';

export interface DraftProps {
  state: DraftState;
  plan: PlanId;
  settings: Settings;
  onPick: (idx: number) => void;
  onReroll: () => void;
  onHome: () => void;
  onInspect: (key: string) => void;
  /** live rooms and challenges */
  vsLabel?: string;
  status?: React.ReactNode;
  locked?: boolean;
  lockedKey?: string;
  forceHints?: boolean;
  firstGames?: boolean;
  /** contextual first-game tips (off in live rooms) */
  coach?: boolean;
  knowledge?: React.ReactNode;
  practice?: boolean;
  /** extra block under the board (Clubhouse Cup progress) */
  aside?: React.ReactNode;
}

const TITLE_ORDER = ['rwc', 'gs', 'lions', 'euro', 'super', 'top14', 'prem', 'urc'];

export function Draft(props: DraftProps) {
  const { state, plan, settings } = props;
  const mode = MODES[state.cfg.mode];
  const hideRatings = !!mode.hideRatings;
  const hideTeam = !!mode.hideTeam;
  const offer = state.offer;
  const team = offer ? TEAM_BY_ID.get(offer.team)! : null;
  const [focus, setFocus] = useState<number | null>(null);
  const hints = props.forceHints || settings.hints;
  const preview = props.forceHints || settings.preview;

  const current = useMemo(() => teamProfile(state.lineup, byKey, plan), [state.lineup, plan]);
  const insights: OptionInsight[] = useMemo(() => optionInsights(state, plan, current), [state, plan, current]);
  const units = useMemo(() => unitProgress(state.lineup), [state.lineup]);

  // unit-complete moments: computed from the real lineup, shown briefly, never blocking
  const prev = useRef({ round: state.round, lineup: state.lineup, seed: state.cfg.seed });
  const seen = useRef(new Set<MomentId>());
  const [moment, setMoment] = useState<{ m: Moment; id: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p.seed !== state.cfg.seed || state.round < p.round) seen.current = new Set();
    if (state.round === p.round + 1) {
      const m = completedMoment(p.lineup, state.lineup, byKey, seen.current);
      if (m) {
        seen.current.add(m.id);
        setMoment({ m, id: Date.now() });
        setFlash(m.id === 'front' || m.id === 'backrow' ? 'pack' : m.id);
        haptic('unit');
      }
    }
    prev.current = { round: state.round, lineup: state.lineup, seed: state.cfg.seed };
  }, [state.round, state.lineup, state.cfg.seed]);
  useEffect(() => { if (!moment) return; const h = setTimeout(() => setMoment(null), 2600); return () => clearTimeout(h); }, [moment]);
  useEffect(() => { if (!flash) return; const h = setTimeout(() => setFlash(null), 700); return () => clearTimeout(h); }, [flash]);

  // blitz timer
  const [left, setLeft] = useState<number | null>(mode.timer ?? null);
  const pickRef = useRef(props.onPick);
  pickRef.current = props.onPick;
  useEffect(() => {
    if (!mode.timer || !offer || props.locked) { setLeft(null); return; }
    setLeft(mode.timer);
    const started = Date.now();
    const h = setInterval(() => {
      const l = Math.max(0, mode.timer! - (Date.now() - started) / 1000);
      setLeft(l);
      if (l <= 0) { clearInterval(h); pickRef.current((state.cfg.seed + state.round) % Math.max(1, offer.options.length)); }
    }, 100);
    return () => clearInterval(h);
  }, [offer, mode.timer, props.locked, state.round, state.cfg.seed]);

  // keyboard: 1–4 to pick, R to reroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= (offer?.options.length ?? 0) && !props.locked) props.onPick(n - 1);
      if ((e.key === 'r' || e.key === 'R') && canReroll(state) && !props.locked) props.onReroll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [offer, props, state]);

  const hi = focus !== null ? insights[focus]?.slot ?? null : null;
  const coachStep: CoachStep | null = props.coach === false ? null : state.round === 0 ? 'pick' : state.round < 4 ? 'positions' : state.round < 9 ? 'units' : null;
  const rerolls = mode.rerolls > 0 && state.rerollRound < 0 ? 1 : 0;
  const fitShown = current.filled > 0;
  const round = Math.min(state.round + 1, ROUNDS);
  const title = team && !hideTeam ? (team.titles ?? []).map(parseTitle).sort((a, b) => TITLE_ORDER.indexOf(a.kind) - TITLE_ORDER.indexOf(b.kind))[0] : undefined;

  return (
    <Screen wide>
      <div className="sticky z-20 -mx-4 border-b border-line/70 bg-ink/95 px-4 pb-2.5 pt-1 backdrop-blur sm:-mx-5 sm:px-5" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        {moment ? (
          <div key={moment.id} className="pointer-events-none absolute inset-x-0 top-0 z-30 flex min-h-full justify-center bg-ink/80 px-3 pt-1.5 sm:px-5">
            <div className="w-full max-w-[560px]"><MomentCard m={moment.m} /></div>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <IconButton label={t('common.home')} onClick={props.onHome} className="-ml-2.5"><IconHome className="h-6 w-6" /></IconButton>
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate text-[10.5px] text-ash">{t(`mode.${state.cfg.mode}.name`)}</p>
            <p className="mono whitespace-nowrap text-[13px] text-ash-2" aria-label={t('draft.roundAria', { n: round, max: ROUNDS })}>
              {t('draft2.pick', { n: round, max: ROUNDS })}
              <span className="mx-1.5 text-line-2">|</span>
              <span title={t('draft.fitTitle')}>{t('stat.fit')} <span className={`font-semibold ${fitShown && current.fit < 70 ? 'text-loss' : 'text-chalk'}`}>{fitShown ? current.fit : '—'}</span></span>
            </p>
          </div>
          <button type="button" onClick={props.onReroll} disabled={!canReroll(state) || props.locked}
            aria-label={canReroll(state) ? t('draft.rerollAria') : t('draft.noRerolls')} title={canReroll(state) ? t('draft.rerollAria') : t('draft.noRerolls')}
            className="mono flex h-11 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-[14px] font-semibold transition enabled:hover:border-ash disabled:opacity-35">
            <IconReroll className="h-4.5 w-4.5" /><span className="hidden min-[380px]:inline">{t('draft2.reroll')}</span> {rerolls}
          </button>
        </div>
        <div className="mt-2"><UnitRail units={units} flash={flash} /></div>
        {props.vsLabel || props.status || left !== null ? (
          <div className="mt-2 flex items-center gap-3 text-[13px]">
            {props.vsLabel ? <span className="eyebrow shrink-0 text-[10.5px] text-brass">{props.vsLabel}</span> : null}
            {props.status ? <span className="min-w-0 break-words text-ash-2">{props.status}</span> : null}
            {left !== null ? (
              <span className="ml-auto flex items-center gap-2" aria-live="polite">
                <span className="relative h-1.5 w-20 overflow-hidden rounded-sm bg-line"><span className={`absolute inset-y-0 left-0 ${left < 3 ? 'bg-loss' : 'bg-brass'}`} style={{ width: `${(left / (mode.timer ?? 8)) * 100}%` }} /></span>
                <span className="mono font-semibold">{t('draft.timeLeft', { s: Math.ceil(left) })}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-8">
        <div className="order-2 lg:sticky lg:top-40 lg:order-1 lg:self-start">
          <Pitch
            lineup={state.lineup} byKey={byKey} hideRatings={hideRatings}
            ratingAt={(n) => { const k = state.lineup[n]; return k ? posRating(P(k), SLOTS[n - 1].pos).rating : undefined; }}
            kindAt={(n) => current.slots.find((s) => s.n === n)?.kind}
            highlight={preview ? hi ?? offer?.shirt ?? null : offer?.shirt ?? null}
            className="mx-auto max-w-[min(66%,250px)] sm:max-w-[330px] lg:max-w-[400px]"
          />
          {props.aside}
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-2 lg:order-2">
          {coachStep ? <Coach key={coachStep} step={coachStep} /> : null}
          {props.knowledge ? (
            <div className="flex min-h-6 items-center" aria-live="polite">{props.knowledge}</div>
          ) : null}
          {offer?.shirt ? (
            <div className="rounded-lg border border-brass/50 bg-ink-2 px-4 py-2.5 text-[14px]">
              <span className="eyebrow text-[10.5px] text-brass">{t('draft.fill')}</span>{' '}
              <span className="display text-[20px] font-extrabold">{offer.shirt} · {shirtName(offer.shirt)}</span>
            </div>
          ) : null}
          {team ? (
            <div className="flex items-stretch gap-3 pb-1">
              <span className="w-1.5 shrink-0 rounded-sm" style={{ background: hideTeam ? 'var(--color-ash)' : team.color }} aria-hidden />
              <div className="min-w-0">
                <p className="eyebrow text-[10.5px] text-ash">{t('draft2.draw', { n: round })}{!hideTeam ? ` · ${t(`bucket.${team.bucket}`)}` : ''}</p>
                <h2 className="display min-w-0 text-[32px] font-black leading-[0.95]">
                  {hideTeam ? t('draft.mysteryClub') : upper(teamName(team))}
                  <span className="ml-2 text-[22px] font-semibold text-ash-2">{hideTeam ? t('draft.mysteryEra') : team.era}</span>
                </h2>
                {title ? <p className="mt-0.5 break-words text-[12.5px] text-brass">◆ {t(`fact.${title.kind}`, { year: title.year })}</p> : null}
              </div>
            </div>
          ) : null}

          {insights.map((o, i) => (
            <OptionCard key={o.key} o={o} i={i} hideRatings={hideRatings} hints={hints && current.filled > 0} preview={preview} rarity={rarityOf(o.key, state.cfg.mode)}
              locked={props.locked} chosen={props.lockedKey === o.key} focused={focus === i}
              onPick={() => props.onPick(i)} onFocus={(f) => setFocus(f ? i : null)} onInspect={() => props.onInspect(o.key)} />
          ))}
          <p className="hidden pt-1 text-[12px] text-ash lg:block">{t('draft.keys')}</p>
          {props.practice ? <p className="text-[12px] text-ash">{t('draft.practice')}</p> : null}
        </div>
      </div>
    </Screen>
  );
}

function OptionCard({ o, i, hideRatings, hints, preview, rarity, locked, chosen, focused, onPick, onFocus, onInspect }: {
  o: OptionInsight; i: number; hideRatings: boolean; hints: boolean; preview: boolean; rarity: ReturnType<typeof rarityOf>; locked?: boolean; chosen: boolean; focused: boolean;
  onPick: () => void; onFocus: (f: boolean) => void; onInspect: () => void;
}) {
  const p = P(o.key);
  const traits = headlineTraits(p);
  const problem = o.kind === 'outOfPosition' || o.kind === 'frontRow' || o.kind === 'unfamiliar';
  return (
    <div className="relative">
      <button type="button" disabled={locked} onClick={onPick}
        onMouseEnter={() => onFocus(true)} onMouseLeave={() => onFocus(false)} onFocus={() => onFocus(true)} onBlur={() => onFocus(false)}
        className={`animate-rise w-full rounded-xl border bg-ink-2 py-2.5 pl-4 pr-12 text-left transition duration-150 active:scale-[0.99] ${chosen ? 'border-brass bg-brass/10' : focused ? 'border-ash' : 'border-line hover:border-line-2'} disabled:opacity-60`}
        style={{ animationDelay: `${i * 40}ms` }}
        aria-describedby={`opt-${i}-notes`}>
        <span className="flex items-baseline gap-3">
          <span className="display min-w-0 flex-1 text-[23px] font-extrabold leading-[1.02]">{upper(p.name)}</span>
          {!hideRatings ? <span className="display tnum shrink-0 text-[32px] font-black leading-none">{p.rating}</span> : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[13px]">
          <span className="min-w-0 flex-1 break-words text-ash-2"><span className="font-semibold text-chalk">{p.pos.map(posShort).join('/')}</span> · {roleName(p.role)}</span>
          {preview && o.slot ? (
            <span className={`mono shrink-0 text-[12.5px] font-semibold ${problem ? 'text-loss' : o.inPos ? 'text-ash-2' : 'text-brass'}`} aria-label={t('draft.wherePlay')}>
              → {o.slot} {posShort(SLOTS[o.slot - 1].pos)}
            </span>
          ) : null}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {o.strengths.map((s) => (
            <span key={s.dim} className="mono text-[11.5px] font-medium text-ash-2">{dimShort(s.dim)}{hideRatings ? '' : <span className="ml-1 font-semibold text-chalk">{s.value}</span>}</span>
          ))}
          {rarity ? <span className="eyebrow rounded-sm border border-brass/70 px-1.5 py-[1px] text-[9.5px] text-brass-2" title={t('rarity.per', { n: rarity.per })}>◆ {t(`rarity.${rarity.tier}`)}</span> : null}
          {traits.map((tr) => <span key={tr} className="eyebrow rounded-sm bg-brass/12 px-1.5 py-0.5 text-[9.5px] text-brass">★ {t(`trait.${tr}`)}</span>)}
          {hints && o.fitDelta ? <span className={`mono text-[11.5px] font-semibold ${o.fitDelta > 0 ? 'text-win' : 'text-loss'}`}>{o.fitDelta > 0 ? '▲' : '▼'} {t('stat.fit')} {o.fitDelta > 0 ? '+' : ''}{o.fitDelta}</span> : null}
        </span>
        {hints && o.notes.length ? (
          <span id={`opt-${i}-notes`} className="mt-1.5 flex flex-col gap-0.5 border-t border-line pt-1.5">
            {o.notes.map((n) => (
              <span key={n.id} className={`text-[12.5px] font-medium leading-snug ${n.tone === 'plus' ? 'text-win' : 'text-loss'}`}>
                <span aria-hidden>{n.tone === 'plus' ? '+ ' : '⚠ '}</span>{noteText(n.id, n.vars)}
              </span>
            ))}
          </span>
        ) : <span id={`opt-${i}-notes`} className="sr-only" />}
      </button>
      <button type="button" onClick={onInspect} aria-label={t('inspect.aria', { name: p.name })}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-ash-2 hover:text-chalk">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-2 bg-ink-3"><IconInfo className="h-4 w-4" /></span>
      </button>
    </div>
  );
}

export function noteText(id: string, vars?: Record<string, string | number>): string {
  const [kind, arg] = id.split('.');
  if (kind === 'syn' || kind === 'risk') return t(`synergy.${arg}.short`);
  return t(`insight.${id}`, vars);
}
