import React, { useEffect, useMemo, useState } from 'react';
import { BUCKETS, TEAMS } from '../../data/index';
import { MAX_POINTS, RARE_KEYS, RARITY_SAMPLE } from '../../engine/index';
import { Card, Chip, IconStar, Ord, Screen, Section, TopBar } from '../components/ui';
import { natName, teamLabel } from '../format';
import { fmtDate, fmtNumber, t } from '../i18n';
import { loadChallenges } from '../challenges';
import { loadDaily } from '../daily';
import { backfill, loadGames, needsBackfill } from '../history';
import { profileStats, trends, type Trend } from '../profile';
import { loadPassport, loadRecords, type GameLog } from '../store';
import { TROPHIES, progressOf } from '../trophies';

type Tab = 'stats' | 'trends' | 'trophies' | 'collection' | 'history';
const TABS: Tab[] = ['stats', 'trends', 'trophies', 'collection', 'history'];

export function Profile({ onBack, onOpenGame, initial = 'stats' }: { onBack: () => void; onOpenGame: (log: GameLog) => void; initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);
  const [logs, setLogs] = useState<GameLog[]>(() => loadGames());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  useEffect(() => {
    if (!needsBackfill(logs)) return;
    return backfill((done, total) => { setProgress({ done, total }); if (done >= total) { setLogs(loadGames()); setProgress(null); } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pp = useMemo(loadPassport, [logs]);
  const rec = useMemo(loadRecords, [logs]);
  const daily = useMemo(() => loadDaily(), [logs]);
  const stats = useMemo(() => profileStats(logs, pp, rec, daily, loadChallenges()), [logs, pp, rec, daily]);
  const trs = useMemo(() => trends(logs, stats), [logs, stats]);

  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<h1 className="display text-[30px] font-extrabold">{t('profile.title')}</h1>} />
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {TABS.map((x) => <Chip key={x} role="tab" aria-selected={tab === x} active={tab === x} onClick={() => setTab(x)} className="h-auto min-h-11 px-3 text-[15px] leading-tight">{t(`profile.tab.${x}`)}</Chip>)}
      </div>
      {progress ? <p className="mono mt-3 text-[12px] text-ash" aria-live="polite">{t('profile.backfill', { done: progress.done, total: progress.total })}</p> : null}

      {tab === 'stats' ? (
        <div className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <Big label={t('profile.s.games')} value={stats.games} />
            <Big label={t('profile.s.titles')} value={stats.titles} accent={stats.titles > 0} />
            <Big label={t('profile.s.playoffs')} value={stats.playoffKnown ? `${stats.playoffs}` : '—'} sub={stats.playoffKnown ? t('profile.s.ofGames', { n: stats.playoffKnown }) : undefined} />
            <Big label={t('profile.s.bestPos')} value={stats.bestPos ? <Ord n={stats.bestPos} /> : '—'} />
            <Big label={t('profile.s.bestPts', { max: MAX_POINTS })} value={stats.games ? stats.bestPts : '—'} accent />
            <Big label={t('profile.s.bestFit')} value={stats.bestFit || '—'} />
          </div>
          <Section title={t('profile.daily')}>
            <div className="grid grid-cols-3 gap-2">
              <Big small label={t('profile.s.dailies')} value={stats.dailies} />
              <Big small label={t('profile.s.bestDaily')} value={stats.bestDaily ?? '—'} />
              <Big small label={t('profile.s.streak')} value={stats.streak.current} sub={stats.streak.best > stats.streak.current ? t('profile.s.streakBest', { n: stats.streak.best }) : undefined} />
            </div>
            <DailyHistory />
          </Section>
          <Section title={t('profile.challenges')}>
            <div className="grid grid-cols-3 gap-2">
              <Big small label={t('profile.s.won')} value={stats.won} />
              <Big small label={t('profile.s.lost')} value={stats.lost} />
              <Big small label={t('profile.s.duels')} value={`${stats.duelsW}–${stats.duelsL}`} />
            </div>
          </Section>
          <Section title={t('profile.habits')}>
            <Card className="divide-y divide-line">
              <Line k={t('profile.s.favPlan')} v={stats.favPlan ? `${t(`plan.${stats.favPlan.plan}.name`)} · ${stats.favPlan.n}` : '—'} />
              <Line k={t('profile.s.topPlayer')} v={stats.topPlayer ? `${stats.topPlayer.name} · ${stats.topPlayer.n}` : '—'} />
              <Line k={t('profile.s.topNation')} v={stats.topNation ? `${natName(stats.topNation.nat)} · ${stats.topNation.share} %` : '—'} />
              <Line k={t('profile.s.earliest')} v={stats.earliest ? t('profile.s.earliestV', { family: t(`family.${stats.earliest.family}`), r: fmtRound(stats.earliest.avg) }) : '—'} />
              <Line k={t('profile.s.distinct')} v={t('profile.s.distinctV', { n: stats.distinctPlayers, v: stats.distinctVersions })} />
            </Card>
          </Section>
          <p className="text-[12px] text-ash">{t('records.local')}</p>
        </div>
      ) : null}

      {tab === 'trends' ? (
        <div className="mt-5 flex flex-col gap-2.5">
          {trs.length ? trs.map((x) => <TrendLine key={x.id} x={x} />) : <p className="rounded-xl border border-line px-4 py-4 text-[14px] text-ash-2">{t('trend.locked', { n: 5, have: logs.filter((l) => l.gauntlet === undefined).length })}</p>}
          {trs.length ? <p className="mt-2 text-[12px] text-ash">{t('trend.note')}</p> : null}
        </div>
      ) : null}

      {tab === 'trophies' ? (
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          {TROPHIES.map((a) => {
            const got = rec.achievements.includes(a);
            const pr = got ? null : progressOf(a);
            return (
              <Card key={a} className={`flex items-center gap-4 px-4 py-3 ${got ? 'border-brass/50' : ''}`}>
                <span className={`display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px] font-bold ${got ? 'bg-brass text-ink' : 'border border-line-2 text-ash'}`} aria-hidden>{got ? '★' : '·'}</span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-[20px] font-bold leading-tight">{t(`ach.${a}.name`)}</span>
                  <span className="block text-[13px] text-ash-2">{t(`ach.${a}.desc`)}</span>
                  {pr ? <span className="mono mt-1 block text-[12px] text-ash">{Math.min(pr.v, pr.max)} / {pr.max}</span> : null}
                </span>
                <span className={`shrink-0 text-[12px] ${got ? 'text-brass' : 'text-ash'}`}>{got ? t('trophy.got') : t('passport.locked')}</span>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === 'collection' ? <Collection stats={stats} teams={pp.teams} eras={pp.eras} versions={pp.versions} /> : null}
      {tab === 'history' ? <History logs={logs} onOpen={onOpenGame} /> : null}
    </Screen>
  );
}

const fmtRound = (x: number) => fmtNumber(Math.round(x * 10) / 10);

function TrendLine({ x }: { x: Trend }) {
  const vars = { ...x.vars };
  if (x.id === 'bestPlan') vars.plan = t(`plan.${x.vars.plan}.name`);
  if (x.id === 'topNation') vars.nat = natName(String(x.vars.nat));
  if (x.id === 'earliest') { vars.family = t(`family.${x.vars.family}`); vars.r = fmtRound(Number(x.vars.r)); }
  return <p className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-[15px] leading-snug">{t(`trend.${x.id}`, vars)}</p>;
}

function DailyHistory() {
  const st = loadDaily();
  const days = Object.values(st.entries).sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 7);
  if (!days.length) return <p className="text-[13px] text-ash">{t('records.noDaily')}</p>;
  return (
    <Card className="divide-y divide-line">
      {days.map((d) => (
        <div key={d.day} className="flex items-center justify-between gap-3 px-4 py-2 text-[14px]">
          <span>{fmtDate(new Date(`${d.day}T12:00:00Z`), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span className="mono">{d.pos ? <Ord n={d.pos} /> : null} · <span className="font-semibold">{d.pts}</span></span>
        </div>
      ))}
    </Card>
  );
}

function Collection({ stats, teams, eras, versions }: { stats: ReturnType<typeof profileStats>; teams: string[]; eras: string[]; versions: Record<string, unknown> }) {
  const m = stats.met;
  const rare = RARE_KEYS.filter((k) => k in versions).length;
  const met = new Set(teams);
  return (
    <div className="mt-5 flex flex-col gap-6">
      <p className="text-[14px] text-ash-2">{t('collection.intro')}</p>
      <div className="grid grid-cols-2 gap-3">
        <Big label={t('collection.players')} value={m.players} sub={`/ ${fmtNumber(m.totalPlayers)}`} accent />
        <Big label={t('collection.versions')} value={m.versions} sub={`/ ${fmtNumber(m.totalVersions)}`} />
        <Big label={t('collection.teams')} value={m.teams} sub={`/ ${m.totalTeams}`} />
        <Big label={t('collection.nats')} value={m.nats} />
        {RARE_KEYS.length ? <Big label={t('collection.rare')} value={rare} sub={`/ ${RARE_KEYS.length}`} /> : null}
      </div>
      {RARE_KEYS.length ? <p className="-mt-3 text-[12.5px] text-ash">{t('collection.rareNote', { drafts: fmtNumber(RARITY_SAMPLE) })}</p> : null}
      {BUCKETS.map((b) => {
        const ts = TEAMS.filter((x) => x.bucket === b);
        const n = ts.filter((x) => met.has(x.id)).length;
        return (
          <Section key={b} title={`${t(`bucket.${b}`)} · ${n} / ${ts.length}`}>
            <ul className="flex flex-wrap gap-1.5">
              {ts.map((x) => (
                <li key={x.id} className={`rounded-md border px-2 py-1 text-[12.5px] ${met.has(x.id) ? 'border-brass/50 text-chalk' : 'border-line text-ash'}`}>
                  <span className="sr-only">{met.has(x.id) ? t('collection.met') : t('collection.notMet')} </span>{met.has(x.id) ? '✓ ' : ''}{teamLabel(x)}
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
      {eras.length ? null : <p className="text-[13px] text-ash">{t('gallery.empty')}</p>}
    </div>
  );
}

type HTab = 'recent' | 'best' | 'fav';
function History({ logs, onOpen }: { logs: GameLog[]; onOpen: (l: GameLog) => void }) {
  const [tab, setTab] = useState<HTab>('recent');
  const seasons = logs.filter((l) => l.gauntlet === undefined);
  const list = tab === 'recent' ? seasons.slice().reverse().slice(0, 40) : tab === 'best' ? seasons.slice().sort((a, b) => b.pts - a.pts).slice(0, 20) : seasons.filter((l) => l.fav).reverse();
  return (
    <div className="mt-5">
      <div className="flex gap-2" role="tablist">
        {(['recent', 'best', 'fav'] as HTab[]).map((x) => <Chip key={x} role="tab" aria-selected={tab === x} active={tab === x} onClick={() => setTab(x)}>{t(`gallery.${x === 'fav' ? 'favourites' : x}`)}</Chip>)}
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {list.length ? list.map((l) => (
          <button key={l.id} type="button" onClick={() => onOpen(l)} className="flex items-center gap-4 rounded-xl border border-line bg-ink-2 px-4 py-3 text-left hover:border-line-2">
            <span className="display tnum w-14 shrink-0 text-[34px] font-extrabold leading-none">{l.pts}</span>
            <span className="min-w-0 flex-1">
              <span className="display block break-words text-[17px] font-bold leading-tight">{l.daily ? t('daily.title') : t(`mode.${l.mode}.name`)} · {t(`plan.${l.plan}.short`)}</span>
              <span className="block text-[12px] text-ash">{fmtDate(new Date(l.date), { day: 'numeric', month: 'short' })}{l.pos ? <> · <Ord n={l.pos} /></> : null} · {t('stat.fit')} {l.fit}{l.kind === 'challenge' ? ` · ${t('history.challenge')}` : ''}{l.daily && !l.official ? ` · ${t('history.practice')}` : ''}</span>
            </span>
            {l.fav ? <IconStar className="h-5 w-5 shrink-0 fill-brass text-brass" /> : null}
          </button>
        )) : <p className="text-[14px] text-ash-2">{tab === 'fav' ? t('gallery.favEmpty') : t('gallery.empty')}</p>}
      </div>
    </div>
  );
}

function Big({ label, value, accent, sub, small }: { label: string; value: React.ReactNode; accent?: boolean; sub?: string; small?: boolean }) {
  return (
    <Card className="px-3.5 py-3">
      <p className={`display tnum ${small ? 'text-[28px]' : 'text-[36px]'} font-extrabold leading-none ${accent ? 'text-brass' : ''}`}>{value}{sub ? <span className="ml-1 text-[14px] font-semibold text-ash">{sub}</span> : null}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-ash">{label}</p>
    </Card>
  );
}
function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-4 py-2.5 text-[14px]"><span className="text-ash">{k}</span><span className="break-words text-right font-semibold">{v}</span></div>;
}
