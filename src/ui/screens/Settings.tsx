import React, { useState } from 'react';
import { MODES, PLANS, SOLO_MODES, type ModeId, type PlanId, type RulesetId } from '../../engine/index';
import { Button, Card, Screen, Section, Segmented, Toggle, TopBar, copyText, useToast } from '../components/ui';
import { t } from '../i18n';
import { clearAll, exportAll, saveOnboarding, type Knowledge, type Settings as S, type SimSpeed } from '../store';
import { clearEvents, funnel, localEvents, remoteEnabled } from '../analytics';

export function SettingsScreen({ settings, onChange, onBack, onDeleted }: { settings: S; onChange: (s: S) => void; onBack: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof S>(k: K, v: S[K]) => onChange({ ...settings, [k]: v });
  return (
    <Screen>
      <TopBar onHome={onBack} homeLabel={t('common.back')} title={<h1 className="display text-[30px] font-extrabold">{t('settings.title')}</h1>} />
      <div className="mt-5 flex flex-col gap-8">
        <Section title={t('settings.game')}>
          <Card className="flex flex-col gap-4 px-4 py-4">
            <div><p className="mb-2 text-[14px] text-ash-2">{t('settings.plan')}</p>
              <Segmented label={t('settings.plan')} value={settings.plan} onChange={(v) => set('plan', v as PlanId)} options={PLANS.map((p) => ({ v: p, label: t(`plan.${p}.short`) }))} /></div>
            <div><p className="mb-2 text-[14px] text-ash-2">{t('settings.mode')}</p>
              <Segmented label={t('settings.mode')} value={settings.mode} onChange={(v) => set('mode', v as ModeId)} options={SOLO_MODES.filter((m) => !MODES[m].param && m !== 'daily' && m !== 'weekly').slice(0, 6).map((m) => ({ v: m, label: t(`mode.${m}.name`) }))} /></div>
            <div><p className="mb-2 text-[14px] text-ash-2">{t('settings.ruleset')}</p>
              <Segmented label={t('settings.ruleset')} value={settings.ruleset} onChange={(v) => set('ruleset', v as RulesetId)} options={[{ v: 'intl', label: t('ruleset.intl') }, { v: 'top14', label: t('ruleset.top14') }]} />
              <p className="mt-2 text-[12px] text-ash">{t(`ruleset.${settings.ruleset}.desc`)}</p></div>
            <div><p className="mb-2 text-[14px] text-ash-2">{t('settings.sim')}</p>
              <Segmented label={t('settings.sim')} value={settings.sim} onChange={(v) => set('sim', v as SimSpeed)} options={(['live', 'fast', 'instant'] as SimSpeed[]).map((v) => ({ v, label: t(`settings.sim.${v}`) }))} /></div>
            <div className="divide-y divide-line">
              <Toggle id="set-hints" checked={settings.hints} onChange={(v) => set('hints', v)} label={t('settings.hints')} hint={t('settings.hintsHint')} />
              <Toggle id="set-preview" checked={settings.preview} onChange={(v) => set('preview', v)} label={t('settings.preview')} hint={t('settings.previewHint')} />
              <Toggle id="set-resume" checked={settings.resume} onChange={(v) => set('resume', v)} label={t('settings.resume')} />
            </div>
            <p className="text-[12px] text-ash">{t('settings.integrity')}</p>
          </Card>
        </Section>
        <Section title={t('settings.knowledge')}>
          <Card className="flex flex-col gap-3 px-4 py-4">
            <Segmented label={t('settings.knowledge')} value={settings.knowledge} onChange={(v) => set('knowledge', v as Knowledge)} options={(['minimal', 'standard', 'deep'] as Knowledge[]).map((v) => ({ v, label: t(`settings.knowledge.${v}`) }))} />
            <p className="text-[13px] text-ash-2">{t(`settings.knowledge.${settings.knowledge}.hint`)}</p>
          </Card>
        </Section>
        <Section title={t('settings.experience')}>
          <Card className="flex flex-col px-4 py-2">
            <div className="divide-y divide-line">
              <Toggle id="set-sound" checked={settings.sound} onChange={(v) => set('sound', v)} label={t('settings.sound')} />
              <Toggle id="set-haptics" checked={settings.haptics} onChange={(v) => set('haptics', v)} label={t('settings.haptics')} />
              <Toggle id="set-contrast" checked={settings.contrast} onChange={(v) => set('contrast', v)} label={t('settings.contrast')} />
              <Toggle id="set-large" checked={settings.largeText} onChange={(v) => set('largeText', v)} label={t('settings.largeText')} />
            </div>
            <div className="py-3"><p className="mb-2 text-[14px] text-ash-2">{t('settings.motion')}</p>
              <Segmented label={t('settings.motion')} value={settings.motion} onChange={(v) => set('motion', v as S['motion'])} options={(['system', 'full', 'reduced'] as const).map((v) => ({ v, label: t(`settings.motion.${v}`) }))} /></div>
          </Card>
        </Section>
        <Section title={t('settings.account')}>
          <Card className="flex flex-col gap-2 px-4 py-4 text-[14px]">
            <p><span className="text-ash">{t('settings.status')}:</span> {t('settings.guest')}</p>
            <p className="text-ash-2">{t('settings.guestNote')}</p>
            <p className="text-[12px] text-ash">{t('settings.accountSoon')}</p>
          </Card>
        </Section>
        <Section title={t('diag.title')}>
          <Diagnostics />
        </Section>
        <Section title={t('settings.data')}>
          <Card className="flex flex-col gap-3 px-4 py-4">
            <p className="text-[13px] text-ash-2">{t('settings.dataNote')}</p>
            <Button size="sm" onClick={() => { saveOnboarding({ done: false, seen: [], forced: true }); toast(t('settings.tipsReset')); }}>{t('settings.tips')}</Button>
            <div className="grid grid-cols-2 gap-3">
              <Button size="sm" onClick={async () => { const ok = await copyText(exportAll()); toast(ok ? t('settings.exported') : t('share.select')); }}>{t('settings.export')}</Button>
              <Button size="sm" variant="danger" onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return; } clearAll(); setConfirmDelete(false); onDeleted(); }}>{confirmDelete ? t('settings.deleteConfirm') : t('settings.delete')}</Button>
            </div>
          </Card>
        </Section>
      </div>
    </Screen>
  );
}

/** What this device measured: anonymous events only, kept here unless a build sets an endpoint. */
function Diagnostics() {
  const toast = useToast();
  const [ev, setEv] = useState(localEvents);
  const steps = funnel(ev);
  return (
    <Card className="flex flex-col gap-3 px-4 py-4">
      <p className="text-[13px] text-ash-2">{remoteEnabled() ? t('diag.remote') : t('diag.local')}</p>
      <p className="mono text-[12px] text-ash">{t('diag.count', { n: ev.length })}</p>
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-ash-2">{t('diag.funnel')}</summary>
        <ol className="mt-1 flex flex-col gap-1 text-[13px]">
          {steps.map((s) => <li key={s.id} className="flex justify-between gap-3"><span className="text-ash-2">{t(`diag.step.${s.id}`)}</span><span className="mono">{s.sessions}</span></li>)}
        </ol>
      </details>
      <div className="grid grid-cols-2 gap-3">
        <Button size="sm" onClick={async () => { const ok = await copyText(JSON.stringify(ev)); toast(ok ? t('settings.exported') : t('share.select')); }}>{t('diag.copy')}</Button>
        <Button size="sm" onClick={() => { clearEvents(); setEv([]); }}>{t('diag.clear')}</Button>
      </div>
    </Card>
  );
}
