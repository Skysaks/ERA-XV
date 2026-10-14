import React, { useDeferredValue, useMemo, useState } from 'react';
import { BUCKETS, TEAMS, TEAM_BY_ID, VERSIONS, parseTitle, type PlayerEra, type TeamEra } from '../../data/index';
import { POSITIONS, type Pos } from '../../engine/index';
import { Button, Chip, Screen, Sheet, TopBar } from '../components/ui';
import { natName, posShort, roleName, teamLabel } from '../format';
import { fmtNumber, t } from '../i18n';
import { loadGames } from '../history';
import { loadPassport } from '../store';

type Tab = 'players' | 'teams';
const PAGE = 40;
const FAMILIES: { id: string; pos: Pos[] }[] = [
  { id: 'props', pos: ['LHP', 'THP'] }, { id: 'hooker', pos: ['HK'] }, { id: 'locks', pos: ['LK'] }, { id: 'backrow', pos: ['BF', 'OF', 'N8'] },
  { id: 'scrumhalf', pos: ['SH'] }, { id: 'flyhalf', pos: ['FH'] }, { id: 'centres', pos: ['IC', 'OC'] }, { id: 'back3', pos: ['WG', 'FB'] },
];
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The encyclopaedia: every player (with all his versions) and every team-era. Built on open, never at start-up. */
export function Archives({ onBack, onInspect }: { onBack: () => void; onInspect: (key: string) => void }) {
  const [tab, setTab] = useState<Tab>('players');
  const [q, setQ] = useState('');
  const query = useDeferredValue(q);
  const [fam, setFam] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
  const [kind, setKind] = useState<'nation' | 'club' | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [team, setTeam] = useState<TeamEra | null>(null);

  // my history with each person: times drafted, best season with one of his versions
  const mine = useMemo(() => {
    const pp = loadPassport();
    const best = new Map<string, number>();
    for (const l of loadGames()) for (const k of l.picks) {
      const person = k.split(':')[1];
      if (person && (best.get(person) ?? -1) < l.pts) best.set(person, l.pts);
    }
    return { drafted: (person: string) => pp.players[person]?.[1] ?? 0, met: (person: string) => !!pp.players[person], best: (person: string) => best.get(person), teams: new Set(pp.teams) };
  }, []);

  const persons = useMemo(() => {
    const f = fold(query.trim());
    const famPos = fam ? FAMILIES.find((x) => x.id === fam)!.pos : null;
    const out: { person: string; vs: PlayerEra[] }[] = [];
    for (const [person, vs] of VERSIONS) {
      if (f && !fold(vs[0].name).includes(f)) continue;
      const keep = vs.filter((v) => {
        const tm = TEAM_BY_ID.get(v.teamEra)!;
        if (famPos && !famPos.includes(v.pos[0])) return false;
        if (bucket && tm.bucket !== bucket) return false;
        if (kind && tm.kind !== kind) return false;
        return true;
      });
      if (keep.length) out.push({ person, vs: keep.sort((a, b) => TEAM_BY_ID.get(a.teamEra)!.mid - TEAM_BY_ID.get(b.teamEra)!.mid) });
    }
    return out.sort((a, b) => Math.max(...b.vs.map((v) => v.rating)) - Math.max(...a.vs.map((v) => v.rating)) || a.vs[0].name.localeCompare(b.vs[0].name));
  }, [query, fam, bucket, kind]);

  const teams = useMemo(() => {
    const f = fold(query.trim());
    return TEAMS.filter((x) => (!f || fold(teamLabel(x)).includes(f)) && (!bucket || x.bucket === bucket) && (!kind || x.kind === kind)).sort((a, b) => a.mid - b.mid);
  }, [query, bucket, kind]);

  const reset = () => setLimit(PAGE);
  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<h1 className="display text-[30px] font-extrabold">{t('archives.title')}</h1>} />
      <p className="mt-1 text-[14px] text-ash-2">{t('archives.intro', { players: fmtNumber(VERSIONS.size), teams: fmtNumber(TEAMS.length) })}</p>
      <div className="mt-3 flex gap-2" role="tablist">
        {(['players', 'teams'] as Tab[]).map((x) => <Chip key={x} role="tab" aria-selected={tab === x} active={tab === x} onClick={() => { setTab(x); reset(); }}>{t(`archives.${x}`)}</Chip>)}
      </div>
      <label htmlFor="arch-q" className="sr-only">{t('archives.search')}</label>
      <input id="arch-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder={t('archives.search')} autoComplete="off"
        className="mt-3 h-12 w-full rounded-lg border border-line-2 bg-ink px-3 text-[16px] text-chalk placeholder:text-ash focus:border-brass focus:outline-none" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {tab === 'players' ? <Filter id="f-pos" label={t('archives.f.position')} value={fam} set={(v) => { setFam(v); reset(); }} options={FAMILIES.map((x) => ({ v: x.id, label: t(`family.${x.id}`) }))} /> : null}
        <Filter id="f-kind" wide={tab !== 'players'} label={t('archives.f.kind')} value={kind} set={(v) => { setKind(v as 'nation' | 'club' | null); reset(); }} options={[{ v: 'nation', label: t('archives.nations') }, { v: 'club', label: t('archives.clubs') }]} />
        <Filter id="f-era" wide label={t('archives.f.era')} value={bucket} set={(v) => { setBucket(v); reset(); }} options={BUCKETS.map((b) => ({ v: b, label: t(`bucket.${b}`) }))} />
      </div>
      <p className="mono mt-3 text-[12px] text-ash" aria-live="polite">{(() => { const n = tab === 'players' ? persons.length : teams.length; return t('archives.count', { n, c: fmtNumber(n) }); })()}</p>

      {tab === 'players' ? (
        <ul className="mt-2 flex flex-col gap-2">
          {persons.slice(0, limit).map(({ person, vs }) => {
            const d = mine.drafted(person), best = mine.best(person);
            return (
              <li key={person} className="rounded-xl border border-line bg-ink-2 px-4 py-3">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="display min-w-0 break-words text-[19px] font-extrabold leading-tight">{vs[0].name}</span>
                  <span className="mono shrink-0 text-[12px] text-ash">{natName(vs[0].nat)}</span>
                </p>
                <p className="text-[12px] text-ash">{mine.met(person) ? (d ? t('archives.drafted', { n: d }) : t('archives.metOnly')) : t('archives.notMet')}{best !== undefined ? ` · ${t('archives.best', { pts: best })}` : ''}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {vs.map((v) => (
                    <li key={v.key}>
                      <button type="button" onClick={() => onInspect(v.key)} className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line px-3 py-1.5 text-left hover:border-line-2">
                        <span className="display tnum w-8 shrink-0 text-[20px] font-black">{v.rating}</span>
                        <span className="min-w-0 flex-1 text-[13.5px]"><span className="font-semibold">{teamLabel(TEAM_BY_ID.get(v.teamEra)!)}</span> <span className="text-ash">· {v.pos.map(posShort).join('/')} · {roleName(v.role)}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {teams.slice(0, limit).map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => setTeam(x)} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-ink-2 px-4 py-2.5 text-left hover:border-line-2">
                <span className="h-9 w-1.5 shrink-0 rounded-sm" style={{ background: x.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="display block break-words text-[18px] font-extrabold leading-tight">{teamLabel(x)}</span>
                  <span className="block text-[12px] text-ash">{t(`bucket.${x.bucket}`)} · {t('archives.squad', { n: x.players.length })}{(x.titles ?? []).length ? ` · ${(x.titles ?? []).map(parseTitle).map((ti) => t(`fact.${ti.kind}`, { year: ti.year })).join(' · ')}` : ''}</span>
                </span>
                <span className="shrink-0 text-[12px] text-ash">{mine.teams.has(x.id) ? '✓' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(tab === 'players' ? persons.length : teams.length) > limit ? <Button className="mt-4 w-full" onClick={() => setLimit((l) => l + PAGE)}>{t('archives.more')}</Button> : null}

      <Sheet open={!!team} onClose={() => setTeam(null)} title={team ? teamLabel(team) : ''} wide>
        {team ? (
          <ul className="flex flex-col gap-1.5">
            {POSITIONS.flatMap((p) => team.players.filter((x) => x.pos[0] === p)).map((v) => (
              <li key={v.key}>
                <button type="button" onClick={() => onInspect(v.key)} className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line px-3 py-1.5 text-left hover:border-line-2">
                  <span className="mono w-10 shrink-0 text-[12px] text-ash">{posShort(v.pos[0])}</span>
                  <span className="min-w-0 flex-1 break-words text-[14px] font-semibold">{v.name}</span>
                  <span className="display tnum shrink-0 text-[18px] font-black">{v.rating}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Sheet>
    </Screen>
  );
}

/** Native selects: one line of filters on a phone instead of three rows of chips, and the platform picker on iOS / Android. */
function Filter({ id, label, value, set, options, wide }: { id: string; label: string; value: string | null; set: (v: string | null) => void; options: { v: string; label: string }[]; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <label htmlFor={id} className="eyebrow block text-[10px] text-ash">{label}</label>
      <span className="relative mt-1 block">
        <select id={id} value={value ?? ''} onChange={(e) => set(e.target.value || null)}
          className={`h-11 w-full min-w-0 appearance-none rounded-lg border bg-ink pl-2.5 pr-8 text-[16px] focus:border-brass focus:outline-none ${value ? 'border-brass/70 text-chalk' : 'border-line-2 text-ash-2'}`}
          style={{ backgroundImage: 'none' }}>
          <option value="">{t('archives.all')}</option>
          {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ash-2" aria-hidden>▾</span>
      </span>
    </div>
  );
}
