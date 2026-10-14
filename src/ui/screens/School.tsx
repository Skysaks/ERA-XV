import React, { useEffect, useRef } from 'react';
import { PLANS, ROLES, ROLE_HOME, type Role } from '../../engine/index';
import { Card, Screen, Section, TopBar } from '../components/ui';
import { posName, roleName } from '../format';
import { t } from '../i18n';

const UNITS: { key: string; roles: Role[] }[] = [
  { key: 'front', roles: ['PS', 'PC', 'HS', 'HD'] },
  { key: 'lock', roles: ['LE', 'LC', 'LA'] },
  { key: 'backrow', roles: ['F6', 'FT', 'FJ', 'FL', 'NP', 'NF'] },
  { key: 'half', roles: ['9S', '9T', '9K', '10G', '10R'] },
  { key: 'centre', roles: ['12C', '12P', '13B', '13D'] },
  { key: 'back3', roles: ['WF', 'WP', 'WA', 'FC', 'FS'] },
];

export function School({ onBack, focus }: { onBack: () => void; focus?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`role-${focus}`);
    el?.scrollIntoView({ block: 'center' });
  }, [focus]);
  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<h1 className="display text-[30px] font-extrabold">{t('school.title')}</h1>} />
      <p className="mt-2 text-[15px] text-ash-2">{t('school.intro')}</p>
      <div ref={ref} className="mt-6 flex flex-col gap-8">
        <Section title={t('school.rules')}>
          <Card className="flex flex-col gap-2 px-4 py-4 text-[14px] text-ash-2">
            <p>{t('school.scoring')}</p>
            <p>{t('school.bonusIntl')}</p>
            <p>{t('school.bonusTop14')}</p>
            <p>{t('school.season')}</p>
            <p>{t('school.frontRow')}</p>
            <p>{t('school.kicker')}</p>
          </Card>
        </Section>
        <Section title={t('school.plans')}>
          <div className="flex flex-col gap-2.5">
            {PLANS.map((p) => (
              <Card key={p} className="px-4 py-3">
                <p className="display text-[22px] font-bold">{t(`plan.${p}.name`)}</p>
                <p className="text-[14px] text-ash-2">{t(`plan.${p}.tag`)}</p>
                <dl className="mt-2 grid grid-cols-1 gap-1 text-[13px]">
                  <div><dt className="inline text-brass">{t('know.strengths')} · </dt><dd className="inline text-ash-2">{t(`plan.${p}.str`)}</dd></div>
                  <div><dt className="inline text-chalk">{t('know.needs')} · </dt><dd className="inline text-ash-2">{t(`plan.${p}.needs`)}</dd></div>
                  <div><dt className="inline text-loss">{t('know.risk')} · </dt><dd className="inline text-ash-2">{t(`plan.${p}.risk`)}</dd></div>
                </dl>
              </Card>
            ))}
          </div>
        </Section>
        {UNITS.map((u) => (
          <Section key={u.key} title={t(`unit.${u.key}`)}>
            <div className="flex flex-col gap-2.5">
              {u.roles.map((r) => (
                <Card key={r} className={`px-4 py-3 ${focus === r ? 'border-brass' : ''}`}>
                  <div id={`role-${r}`} className="flex items-baseline justify-between gap-3">
                    <p className="display text-[22px] font-bold">{roleName(r)}</p>
                    <p className="text-[12px] text-ash">{ROLE_HOME[r].map(posName).join(' · ')}</p>
                  </div>
                  <p className="text-[14px] text-ash-2">{t(`roleDesc.${r}`)}</p>
                  <dl className="mt-2 grid grid-cols-1 gap-1 text-[13px]">
                    <div><dt className="inline text-brass">{t('know.strengths')} · </dt><dd className="inline text-ash-2">{t(`roleStr.${r}`)}</dd></div>
                    <div><dt className="inline text-chalk">{t('know.needs')} · </dt><dd className="inline text-ash-2">{t(`roleNeed.${r}`)}</dd></div>
                    <div><dt className="inline text-loss">{t('know.risk')} · </dt><dd className="inline text-ash-2">{t(`roleRisk.${r}`)}</dd></div>
                  </dl>
                </Card>
              ))}
            </div>
          </Section>
        ))}
        <p className="text-[12px] text-ash">{t('school.note', { n: ROLES.length })}</p>
      </div>
    </Screen>
  );
}
