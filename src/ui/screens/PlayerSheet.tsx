import React, { useMemo } from 'react';
import { PLAYER_BY_KEY, PLAYER_OF_THE_YEAR, TEAM_BY_ID, VERSIONS, parseTitle } from '../../data/index';
import { ATTRS, DIMS, POSITIONS, SLOTS, place, posRating, teamProfile, byKey, keyStrengths, traitsOf, rarityOf, RARITY_SAMPLE, type Attr, type DraftState, type PlanId } from '../../engine/index';
import { DimBar, Disclosure, Sheet } from '../components/ui';
import { dimName, natName, posName, posShort, roleName, teamLabel } from '../format';
import { fmtNumber, t } from '../i18n';
import { loadLogs, loadPassport } from '../store';
import { P } from '../game';
import { profileFit } from '../../engine/team';

export function PlayerSheet({ playerKey, onClose, hideRatings, draft, plan, onRole }: {
  playerKey: string | null; onClose: () => void; hideRatings: boolean; draft?: DraftState; plan?: PlanId; onRole?: (role: string) => void;
}) {
  const p = playerKey ? PLAYER_BY_KEY.get(playerKey) : undefined;
  const data = useMemo(() => {
    if (!p) return null;
    const team = TEAM_BY_ID.get(p.teamEra)!;
    const needs = POSITIONS.map((pos) => ({ pos, ...posRating(p, pos) })).sort((a, b) => b.rating - a.rating);
    const attrs = ATTRS.filter((a) => a !== 'scrum' || ['LHP', 'HK', 'THP', 'LK', 'N8', 'BF', 'OF'].includes(p.pos[0])).filter((a) => !(a === 'lineout' && !['HK', 'LK', 'BF', 'N8', 'OF'].includes(p.pos[0])));
    const relevant = (a: Attr) => a === 'goalKick' ? p.attrs.goalKick >= 75 : profileFit(p, p.pos[0]) > 0;
    const elite = attrs.filter((a) => p.attrs[a] >= 90 && relevant(a));
    const strong = attrs.filter((a) => p.attrs[a] >= 84 && p.attrs[a] < 90 && relevant(a));
    const limited = DIMS.filter((d) => p.attrs[d] < 72 && attrs.includes(d)).slice(0, 3);
    const versions = (VERSIONS.get(p.person) ?? []).filter((v) => v.key !== p.key);
    const honours: string[] = [];
    for (const tt of team.titles ?? []) {
      const { kind, year } = parseTitle(tt);
      honours.push(t(`fact.${kind}`, { year, team: teamLabel(team) }));
    }
    for (const y of PLAYER_OF_THE_YEAR[p.person] ?? []) honours.push(t('fact.poty', { year: y }));
    const pp = loadPassport().players[p.person];
    const logs = loadLogs().filter((l) => l.picks.some((k) => PLAYER_BY_KEY.get(k)?.person === p.person));
    const bestWith = logs.length ? Math.max(...logs.map((l) => l.pts)) : null;
    let impact: { fit: number; up?: string; down?: string } | null = null;
    if (draft && draft.offer?.options.includes(p.key)) {
      const before = teamProfile(draft.lineup, byKey, plan ?? 'balanced');
      const l = place([...draft.picks.map(P), p], draft.lineup);
      const after = teamProfile(l, byKey, plan ?? 'balanced');
      let bu = 1, bd = -1, up: string | undefined, down: string | undefined;
      for (const d of DIMS) { const x = after.dims[d] - before.dims[d]; if (x > bu) { bu = x; up = d; } if (x < bd) { bd = x; down = d; } }
      impact = { fit: before.filled ? after.fit - before.fit : 0, up, down };
    }
    const strengths = keyStrengths(p, SLOTS.find((x) => x.pos === p.pos[0])!.n);
    const traits = traitsOf(p).filter((x) => ['captain', 'poty', 'goalKicker', 'utility'].includes(x));
    const rarity = rarityOf(p.key, draft?.cfg.mode);
    return { team, needs, attrs, elite, strong, limited, versions, honours, pp, bestWith, impact, strengths, traits, rarity };
  }, [p, draft, plan]);

  if (!p || !data) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const { team } = data;
  return (
    <Sheet open={!!p} onClose={onClose} wide title={<span className="flex items-center gap-2.5"><span className="h-6 w-1.5 rounded-full" style={{ background: team.color }} />{p.name}</span>}>
      <div className="flex flex-col gap-5">
        <div className="text-[14px] text-ash-2">
          <p><span className="font-semibold text-chalk">{teamLabel(team)}</span> · {natName(p.nat)}</p>
          <p className="mt-0.5">{p.pos.map(posName).join(' / ')} · <button type="button" className="font-semibold text-brass underline-offset-2 hover:underline" onClick={() => onRole?.(p.role)}>{roleName(p.role)}</button></p>
          <p className="mt-1.5 text-[13.5px] text-ash-2">{t(`roleDesc.${p.role}`)}</p>
          {data.rarity ? (
            <p className="mt-2 text-[13px] text-ash-2"><span className="eyebrow mr-1.5 rounded-sm border border-brass/70 px-1.5 py-[1px] text-[10px] text-brass-2">◆ {t(`rarity.${data.rarity.tier}`)}</span>{t('rarity.sheet', { n: data.rarity.per, drafts: fmtNumber(RARITY_SAMPLE) })}</p>
          ) : null}
          {data.traits.length ? <p className="mt-2 flex flex-wrap gap-1.5">{data.traits.map((tr) => <span key={tr} className="eyebrow rounded-sm bg-brass/12 px-1.5 py-0.5 text-[10px] text-brass">★ {t(`trait.${tr}`)}{tr === 'captain' ? ` · ${teamLabel(team)}` : ''}</span>)}</p> : null}
          <p className="mono mt-2 flex gap-4 text-[12.5px]">{data.strengths.map((st) => <span key={st.dim}>{dimName(st.dim)}{hideRatings ? '' : <span className="ml-1 font-semibold text-chalk">{st.value}</span>}</span>)}</p>
        </div>

        {data.impact ? (
          <div>
            <p className="eyebrow text-[12px] text-ash">{t('know.teamImpact')}</p>
            <p className="mt-1 text-[14px] text-ash-2">
              {data.impact.fit < 0 ? t('know.impactStarHurts') : data.impact.up ? t('know.impactHelps') : t('know.impactNeutral')}
              {data.impact.fit ? <span className={`ml-1.5 font-semibold ${data.impact.fit > 0 ? 'text-win' : 'text-loss'}`}>{t('stat.fit')} {data.impact.fit > 0 ? '+' : ''}{data.impact.fit}</span> : null}
            </p>
          </div>
        ) : null}

        <Disclosure title={t('inspect.level2')} sub={t('inspect.level2sub')}>
        <div className="flex flex-col gap-5">
        {hideRatings ? <p className="rounded-lg bg-ink-3 px-3 py-2 text-[13px] text-ash-2">{t('inspect.hidden')}</p> : (
          <div>
            <p className="eyebrow text-[12px] text-ash">{t('know.whyN', { n: p.rating })}</p>
            <div className="mt-2 flex flex-col gap-1 text-[14px]">
              {data.elite.length ? <p><span className="text-brass">{t('know.elite')}</span> · {data.elite.map((a) => t(`attr.${a}`)).join(', ')}</p> : null}
              {data.strong.length ? <p><span className="text-chalk">{t('know.strong')}</span> · {data.strong.map((a) => t(`attr.${a}`)).join(', ')}</p> : null}
              {data.limited.length ? <p><span className="text-loss">{t('know.limited')}</span> · {data.limited.map((a) => t(`attr.${a}`)).join(', ')}</p> : null}
              <p className="text-ash-2">{t('know.bestRole')} · {roleName(p.role)}</p>
            </div>
            <p className="mt-2 text-[12px] text-ash">{t('inspect.whyLine', { team: teamLabel(team), pos: posName(p.pos[0]), n: p.rating })}</p>
          </div>
        )}

        <div>
          <p className="eyebrow text-[12px] text-ash">{t('inspect.positions')}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px] sm:grid-cols-3">
            {data.needs.slice(0, 9).map((n) => (
              <div key={n.pos} className="flex items-baseline justify-between gap-2">
                <span className="break-words">{posShort(n.pos)} <span className="text-[11px] text-ash">{t(`inspect.kind.${n.kind}`)}</span></span>
                {!hideRatings ? <span className={`tnum font-semibold ${n.kind === 'natural' || n.kind === 'secondary' ? 'text-chalk' : 'text-ash'}`}>{n.rating}</span> : null}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-ash">{t('inspect.positionsNote')}</p>
        </div>
        </div>
        </Disclosure>

        <Disclosure title={t('inspect.level3')} sub={t('inspect.level3sub')}>
        <div className="flex flex-col gap-5">

        {!hideRatings ? (
          <div>
            <p className="eyebrow text-[12px] text-ash">{t('inspect.attributes')}</p>
            <div className="mt-2 flex flex-col gap-2">
              {data.attrs.map((a) => <DimBar key={a} label={t(`attr.${a}`)} value={p.attrs[a]} tone={p.attrs[a] >= 90 ? 'up' : undefined} />)}
            </div>
          </div>
        ) : null}

        {data.honours.length ? (
          <div>
            <p className="eyebrow text-[12px] text-ash">{t('know.history')}</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-[14px] text-ash-2">{data.honours.map((h, i) => <li key={i}>· {h}</li>)}</ul>
            <p className="mt-1 text-[11px] text-ash">{t('know.sources')}</p>
          </div>
        ) : null}

        {data.versions.length ? (
          <div>
            <p className="eyebrow text-[12px] text-ash">{t('know.versions')}</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-[14px]">
              {data.versions.map((v) => <li key={v.key} className="flex justify-between"><span className="text-ash-2">{teamLabel(TEAM_BY_ID.get(v.teamEra)!)} · {v.pos.map(posShort).join('/')}</span>{!hideRatings ? <span className="tnum font-semibold">{v.rating}</span> : null}</li>)}
            </ul>
          </div>
        ) : null}

        </div>
        </Disclosure>
        <div className="text-[13px] text-ash-2">
          {data.pp ? <p>{t('know.historyLine', { seen: data.pp[0], drafted: data.pp[1], skipped: data.pp[2] })}{data.bestWith !== null ? ` · ${t('know.historyBest', { n: data.bestWith })}` : ''}</p> : null}
          <p className="mt-1 text-[12px] text-ash">{t('inspect.estimate')}</p>
        </div>
      </div>
    </Sheet>
  );
}
