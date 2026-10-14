import React, { useState } from 'react';
import { ALL_PLAYERS, TEAMS, VERSIONS } from '../../data/index';
import { UNIT_IDS, UNIT_SLOTS, type ModeId } from '../../engine/index';
import { Button, Chip, IconArrow, IconBook, IconButton, IconGear, IconGrid, IconTrophy, IconUsers, LangSwitch, Ord, Screen } from '../components/ui';
import { fmtDate, fmtNumber, t, type Lang } from '../i18n';
import type { DailyView } from '../daily';
import type { describe } from '../resume';

export interface HomeProps {
  lang: Lang; setLang: (l: Lang) => void;
  mode: ModeId; setMode: (m: ModeId) => void;
  resume: ReturnType<typeof describe>;
  daily: DailyView;
  weeklyName: string;
  toPlay: number;
  onPlay: () => void; onChallenge: () => void; onClubhouse: () => void; onArchives: () => void; onProfile: () => void;
  onDaily: () => void; onDailyShare: () => void; onDailyPractice: () => void; onWeekly: () => void;
  onModes: () => void; onSchool: () => void; onSettings: () => void;
  onResume: () => void; onAbandon: () => void;
}

/** The dataset, counted live: never a number written by hand. */
const COUNTS = { players: VERSIONS.size, versions: ALL_PLAYERS.length, teams: TEAMS.length };

export function PostsMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <path d="M8 3v22M20 3v22M8 15h12" stroke="var(--color-brass)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <ellipse cx="14" cy="8.5" rx="3.2" ry="2" transform="rotate(-30 14 8.5)" fill="var(--color-chalk)" />
    </svg>
  );
}

export function Home(p: HomeProps) {
  const quickModes: ModeId[] = ['classic', 'iq'];
  const shownMode = quickModes.includes(p.mode) ? p.mode : 'classic';
  const soloResume = p.resume && !(p.resume.daily && p.resume.official) ? p.resume : null;
  return (
    <Screen>
      <div className="flex items-center gap-2 pt-1">
        <PostsMark />
        <span className="display min-w-0 flex-1 text-[22px] font-black">ERA <span className="text-brass">XV</span></span>
        <LangSwitch lang={p.lang} onChange={p.setLang} />
        <IconButton label={t('settings.title')} onClick={p.onSettings} className="-mr-2"><IconGear className="h-6 w-6" /></IconButton>
      </div>

      {soloResume ? <ResumeCard r={soloResume} onResume={p.onResume} onAbandon={p.onAbandon} /> : null}

      <header className="touchlines animate-rise mt-4 overflow-hidden rounded-xl border border-line-2 bg-ink-2 px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <p className="eyebrow text-[10.5px] text-brass">{t('home2.kicker')}</p>
        <h1 className={`display mt-2 font-black leading-[0.88] ${soloResume ? 'text-[36px] min-[400px]:text-[40px]' : 'text-[44px] min-[400px]:text-[50px] sm:text-[60px]'}`}>
          {t('home2.title1')}<br />{t('home2.title2')}
        </h1>
        {!soloResume ? (
          <>
            <p className="mt-3 max-w-[36ch] text-[15.5px] leading-snug text-ash-2">{t('home2.pitch')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5" aria-label={t('home2.sheetAria')}>
              {UNIT_IDS.map((u) => (
                <span key={u} className="flex gap-[3px]">
                  {UNIT_SLOTS[u].map((n) => <span key={n} className="display tnum flex h-6 w-6 items-center justify-center rounded-[4px] bg-chalk text-[13px] font-black text-ink">{n}</span>)}
                </span>
              ))}
            </div>
          </>
        ) : null}
        <p className="mono mt-3 text-[11.5px] text-ash">{t('home2.counts', { players: fmtNumber(COUNTS.players), versions: fmtNumber(COUNTS.versions), teams: fmtNumber(COUNTS.teams) })}</p>
      </header>

      <div className="mt-4 flex items-center gap-2" role="radiogroup" aria-label={t('home.mode')}>
        {quickModes.map((m) => <Chip key={m} active={shownMode === m} role="radio" aria-checked={shownMode === m} onClick={() => p.setMode(m)}>{t(`mode.${m}.name`)}</Chip>)}
        <span className="hidden min-w-0 text-[12.5px] leading-tight text-ash min-[360px]:block">{t(`mode.${shownMode}.short`)}</span>
      </div>
      <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => { if (!quickModes.includes(p.mode)) p.setMode('classic'); p.onPlay(); }}>{t('home2.play')} <IconArrow className="h-6 w-6" /></Button>

      <DailyCard d={p.daily} resume={p.resume} onPlay={p.onDaily} onResume={p.onResume} onShare={p.onDailyShare} onPractice={p.onDailyPractice} />

      <Button variant="ivory" className="mt-3 w-full" onClick={p.onChallenge}>{t('home2.challenge')}</Button>

      <nav className="mt-5 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3" aria-label={t('home.more')}>
        <HomeLink onClick={p.onClubhouse} icon={<IconUsers className="h-5 w-5" />} label={t('club.title')} sub={p.toPlay ? t('home3.toPlay', { n: p.toPlay }) : t('home3.clubSub')} badge={p.toPlay} />
        <HomeLink onClick={p.onArchives} icon={<IconGrid />} label={t('archives.title')} sub={t('home3.archivesSub')} />
        <HomeLink onClick={p.onProfile} icon={<IconTrophy />} label={t('profile.title')} sub={t('home3.profileSub')} />
      </nav>

      <div className="mt-4 flex flex-col divide-y divide-line rounded-xl border border-line">
        <FootLink onClick={p.onWeekly} eyebrow={t('home3.weekly')} label={p.weeklyName} />
        <FootLink onClick={p.onModes} label={t('home.modes')} sub={t('home.modesSub')} />
        <FootLink onClick={p.onSchool} icon={<IconBook className="h-5 w-5" />} label={t('school.title')} sub={t('school.short')} />
      </div>
    </Screen>
  );
}

function ResumeCard({ r, onResume, onAbandon }: { r: NonNullable<ReturnType<typeof describe>>; onResume: () => void; onAbandon: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const where = r.stage === 'draft' ? t('resume2.round', { n: r.round, max: 15 }) : r.stage === 'sheet' ? t('resume2.sheet') : t('resume2.plan');
  return (
    <section className="animate-rise mt-4 rounded-xl border border-brass/55 bg-ink-2 px-4 py-3" aria-label={t('resume2.title')}>
      <p className="eyebrow text-[10.5px] text-brass">{t('resume2.title')}</p>
      <p className="display mt-1 text-[24px] font-black leading-none">{where}</p>
      <p className="mt-1 text-[13px] text-ash-2">{r.challenge ? t('resume2.challenge') : t(`mode.${r.mode}.name`)}</p>
      {confirm ? (
        <div className="mt-3">
          <p className="text-[13.5px] text-ash-2">{t('resume2.abandonBody')}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" variant="danger" onClick={() => { setConfirm(false); onAbandon(); }}>{t('resume2.abandonYes')}</Button>
            <Button size="sm" onClick={() => setConfirm(false)}>{t('resume2.keep')}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Button variant="primary" size="sm" className="min-h-11" onClick={onResume}>{t('resume2.resume')}</Button>
          <Button size="sm" className="min-h-11" onClick={() => setConfirm(true)}>{t('resume2.abandon')}</Button>
        </div>
      )}
    </section>
  );
}

export function DailyCard({ d, resume, onPlay, onResume, onShare, onPractice, compact }: {
  d: DailyView; resume: ReturnType<typeof describe>; onPlay: () => void; onResume: () => void; onShare: () => void; onPractice: () => void; compact?: boolean;
}) {
  const date = fmtDate(new Date(`${d.day}T12:00:00Z`), { weekday: 'short', day: 'numeric', month: 'short' });
  const inProgress = d.status === 'inProgress' && resume?.daily === d.day && resume.official;
  const streak = d.streak.current > 0 ? <p className="mono mt-2 text-[12px] text-ash-2">{t('daily.streak', { n: d.streak.current })}{d.streak.best > d.streak.current ? ` · ${t('daily.bestStreak', { n: d.streak.best })}` : ''}</p> : null;
  return (
    <section className={`touchlines mt-3 rounded-xl border px-4 py-3.5 ${d.status === 'done' ? 'border-line-2 bg-ink-2' : 'border-brass/60 bg-brass/[0.06]'}`} aria-label={t('daily.title')}>
      <p className="eyebrow flex flex-wrap justify-between gap-x-3 text-[10.5px] text-brass"><span>{t('daily.title')}</span><span className="text-ash">{date}</span></p>
      {d.status === 'done' && d.entry ? (
        <>
          <p className="eyebrow mt-2 text-[10px] text-ash">{t('daily.yours')}</p>
          <div className="mt-0.5 flex items-end gap-3">
            {d.entry.pos ? <Ord n={d.entry.pos} className="display tnum text-[54px] font-black leading-[0.85]" /> : null}
            <span className="display tnum pb-1 text-[26px] font-black leading-none text-brass">{t('daily.pts', { n: d.entry.pts })}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-ash">{t('daily.officialNote')}{d.practice ? ` · ${t('daily.practiceBest', { n: d.practice.n, best: d.practice.best })}` : ''}</p>
          {streak}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="primary" className="min-h-11" onClick={onShare}>{t('daily.challenge')}</Button>
            <Button size="sm" className="min-h-11" onClick={onPractice}>{t('daily.practice')}</Button>
          </div>
          {!compact ? <p className="mt-2 text-[12px] text-ash">{t('daily.tomorrow')}</p> : null}
        </>
      ) : d.status === 'abandoned' ? (
        <>
          <p className="display mt-2 text-[22px] font-black leading-tight">{t('daily.abandoned')}</p>
          <p className="mt-1 text-[13px] text-ash-2">{t('daily.abandonedBody')}</p>
          <Button size="sm" className="mt-3 min-h-11 w-full" onClick={onPractice}>{t('daily.practice')}</Button>
        </>
      ) : (
        <>
          <p className="display mt-2 text-[26px] font-black leading-[0.95]">{t('daily.headline')}</p>
          <p className="mt-1 text-[14px] text-ash-2">{t('daily.pitch')}</p>
          {streak}
          <Button variant="primary" className="mt-3 w-full" onClick={inProgress ? onResume : onPlay}>
            {inProgress ? t('daily.resume', { n: resume!.round }) : t('daily.play')} <IconArrow className="h-5 w-5" />
          </Button>
          {!compact ? <p className="mt-2 text-[12px] text-ash">{t('daily.oneShot')}</p> : null}
        </>
      )}
    </section>
  );
}

function HomeLink({ onClick, icon, label, sub, badge }: { onClick: () => void; icon: React.ReactNode; label: string; sub: string; badge?: number }) {
  return (
    <button type="button" onClick={onClick} className="relative flex min-h-14 min-w-0 flex-row items-center gap-3 rounded-xl border border-line bg-ink-2 px-3 py-2.5 text-left text-ash-2 transition hover:border-line-2 hover:text-chalk min-[360px]:min-h-24 min-[360px]:flex-col min-[360px]:items-start min-[360px]:gap-1.5 min-[360px]:px-2.5 min-[360px]:py-3">
      {icon}
      <span className="min-w-0">
        <span className="display block text-[17px] font-extrabold leading-tight text-chalk min-[360px]:text-[16px] min-[400px]:text-[17px]">{label}</span>
        <span className="block text-[12px] leading-snug text-ash">{sub}</span>
      </span>
      {badge ? <span className="mono absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-[11px] font-semibold text-ink" aria-hidden>{badge}</span> : null}
    </button>
  );
}

function FootLink({ onClick, label, sub, eyebrow, icon }: { onClick: () => void; label: string; sub?: string; eyebrow?: string; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-ink-2">
      <span className="flex min-w-0 items-center gap-3">
        {icon ? <span className="text-ash-2">{icon}</span> : null}
        <span className="min-w-0">
          {eyebrow ? <span className="eyebrow block text-[10px] text-brass">{eyebrow}</span> : null}
          <span className="display block break-words text-[19px] font-extrabold leading-tight">{label}</span>
          {sub ? <span className="block break-words text-[12.5px] text-ash">{sub}</span> : null}
        </span>
      </span>
      <IconArrow className="h-5 w-5 shrink-0 text-ash-2" />
    </button>
  );
}
