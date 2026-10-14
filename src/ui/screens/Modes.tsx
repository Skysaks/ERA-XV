import React, { useState } from 'react';
import { BUCKETS, ONE_CLUB_KEYS, ONE_COUNTRY_KEYS } from '../../data/index';
import { MODES, MODE_ORDER, ROLES, THEME_CHOICES, themeTeams, weeklyFor, type ModeGroup, type ModeId } from '../../engine/index';
import { Button, Card, IconArrow, Screen, Section, Sheet, TopBar } from '../components/ui';
import { fmtDate, t } from '../i18n';
import { roleName } from '../format';
import { hashStr } from '../../engine/rng';

const GROUPS: ModeGroup[] = ['core', 'social', 'history', 'skill', 'identity'];

export function Modes({ current, onBack, onStart, onLive, onPasteCode, onClubhouse }: {
  current: ModeId;
  onBack: () => void;
  onStart: (m: ModeId, param?: string) => void;
  onLive: (m: 'liveduel' | 'party' | 'shared') => void;
  onPasteCode: (code: string) => void;
  onClubhouse: () => void;
}) {
  const [param, setParam] = useState<ModeId | null>(null);
  const [code, setCode] = useState('');
  const weekly = weeklyFor(new Date());
  const roleOfWeek = ROLES[hashStr(`role:${weekly.year}:${weekly.week}`) % ROLES.length];
  const recommend: ModeId = (['iq', 'nations', 'champions', 'cult', 'mystery', 'position', 'worldxv', 'eralock'] as ModeId[])[weekly.week % 8];

  const choose = (m: ModeId) => {
    const def = MODES[m];
    if (def.live) { onLive(m as 'liveduel' | 'party' | 'shared'); return; }
    if (def.param) { setParam(m); return; }
    onStart(m);
  };

  return (
    <Screen>
      <TopBar onHome={onBack} title={<h1 className="display text-[28px] font-black">{t('modes.title')}</h1>} />
      <div className="mt-4 flex flex-col gap-7">
        {GROUPS.map((g) => (
          <Section key={g} title={t(`modes.group.${g}`)}>
            <div className="flex flex-col gap-2.5">
              {g === 'social' ? (
                <Card className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="display text-[22px] font-bold">{t('modes.rival.name')}</span>
                    <span className="eyebrow text-[11px] text-ash">{t('modes.fromResults')}</span>
                  </div>
                  <p className="mt-1 text-[14px] text-ash-2">{t('modes.rival.desc')}</p>
                  <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) onPasteCode(code.trim()); }}>
                    <label htmlFor="challenge-code" className="sr-only">{t('modes.codeLabel')}</label>
                    <input id="challenge-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('modes.codePlaceholder')}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 text-[16px] text-chalk placeholder:text-ash focus:border-brass focus:outline-none" />
                    <Button size="sm" className="h-11" type="submit" disabled={!code.trim()}>{t('modes.open')}</Button>
                  </form>
                </Card>
              ) : null}
              {g === 'social' ? (
                <button type="button" onClick={onClubhouse} className="flex items-center gap-4 rounded-xl border border-brass/45 bg-ink-2 px-4 py-4 text-left transition hover:border-brass">
                  <span className="min-w-0 flex-1">
                    <span className="display block text-[22px] font-extrabold">{t('club.title')}</span>
                    <span className="mt-1 block text-[14px] leading-snug text-ash-2">{t('club.modesLine')}</span>
                  </span>
                  <IconArrow className="h-5 w-5 shrink-0 text-ash-2" />
                </button>
              ) : null}
              {MODE_ORDER.filter((m) => MODES[m].group === g && !MODES[m].live).map((m) => (
                <button key={m} type="button" onClick={() => choose(m)}
                  className={`group flex items-start gap-4 rounded-xl border px-4 py-4 text-left transition ${current === m ? 'border-chalk/60 bg-ink-2' : 'border-line bg-ink-2 hover:border-line-2'}`}>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2.5">
                      <span className="display text-[22px] font-extrabold">{t(`mode.${m}.name`)}</span>
                      {current === m ? <span className="eyebrow text-[10px] text-ash">{t('modes.selected')}</span> : null}
                    </span>
                    <span className="mt-1 block text-[14px] leading-snug text-ash-2">
                      {m === 'weekly' ? `${t(`weekly.${weekly.id}.name`)} · ${t(`weekly.${weekly.id}.desc`)}` : t(`mode.${m}.desc`)}
                    </span>
                    {m === 'weekly' ? (
                      <span className="mt-2 block text-[12px] text-ash">
                        {t('weekly.sameDraw')} · {t('weekly.until', { date: fmtDate(weekly.until, { weekday: 'long', day: 'numeric', month: 'short' }) })} · {t('weekly.school')} {roleName(roleOfWeek)} · {t('weekly.recommend')} {t(`mode.${recommend}.name`)}
                      </span>
                    ) : null}
                  </span>
                  <IconArrow className="mt-1.5 h-5 w-5 shrink-0 text-ash transition group-hover:text-chalk" />
                </button>
              ))}
            </div>
          </Section>
        ))}
      </div>

      <Sheet open={!!param} onClose={() => setParam(null)} title={param ? t(`modes.choose.${MODES[param].param}`) : ''}>
        {param ? <ParamPicker mode={param} onPick={(v) => { const m = param; setParam(null); onStart(m, v); }} /> : null}
      </Sheet>
    </Screen>
  );
}

function ParamPicker({ mode, onPick }: { mode: ModeId; onPick: (v?: string) => void }) {
  const kind = MODES[mode].param;
  const opts: { v: string; label: string; sub?: string }[] =
    kind === 'bucket' ? BUCKETS.map((b) => ({ v: b, label: t(`bucket.${b}`), sub: t(`bucket.${b}.years`) }))
      : kind === 'club' ? ONE_CLUB_KEYS.map((k) => ({ v: k, label: t(`team.${k}`) }))
        : kind === 'theme' ? THEME_CHOICES.map((id) => ({ v: id, label: t(`weekly.${id}.name`), sub: t('modes.themeTeams', { n: themeTeams(id).length }) }))
          : ONE_COUNTRY_KEYS.map((c) => ({ v: c, label: t(`nat.${c}`) }));
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => onPick(undefined)} className="display flex h-14 items-center justify-between rounded-2xl bg-brass px-5 text-[22px] font-bold text-ink">
        {t('common.random')} <IconArrow />
      </button>
      {opts.map((o) => (
        <button key={o.v} type="button" onClick={() => onPick(o.v)} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line px-5 py-2 text-left hover:border-line-2">
          <span className="display min-w-0 break-words text-[22px] font-bold leading-tight">{o.label}</span>
          {o.sub ? <span className="shrink-0 text-[13px] text-ash">{o.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}
