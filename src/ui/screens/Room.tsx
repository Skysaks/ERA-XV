import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  UNIT_IDS, byKey, unitRatings, compareDrafts, simMatch, sideFromProfile, simulateSeason, teamProfile, type Lineup, type PlanId,
} from '../../engine/index';
import { Button, Card, Ord, Panel, Screen, Section, TopBar, copyText, useToast } from '../components/ui';
import { TeamSheet } from '../components/rugby';
import { roleName, upper } from '../format';
import { t } from '../i18n';
import { finishGame, P, type Session } from '../game';
import { loadRecords, saveRecords, type Settings } from '../store';
import { useLive, verifyResult, type Member } from '../room/useLive';
import type { RoomKind } from '../room/transport';
import { Draft } from './Draft';
import { XV } from './XV';
import { Plan } from './Plan';
import { standingLabel } from './Result';
import { haptic } from '../feel';

/** presence strings must be free of control and invisible characters */
const cleanName = (s: string) => s.replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').slice(0, 24);

export function Room({ kind, joinCode, settings, name, practice, onHome, onInspect, buildRoomUrl, setRoomHash, onRename }: {
  kind: RoomKind; joinCode?: string; settings: Settings; name: string; practice: boolean; onRename: (n: string) => void;
  onHome: () => void; onInspect: (k: string) => void; buildRoomUrl: (code: string) => string; setRoomHash: (code: string | null) => void;
}) {
  const live = useLive({ kind, joinCode, name: cleanName(name) || t('room.you'), plan: settings.plan, ruleset: settings.ruleset, practice, onUrl: setRoomHash });
  const toast = useToast();
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [plan, setPlan] = useState<PlanId>(settings.plan);
  const [step, setStep] = useState<'sheet' | 'plan'>('sheet');
  const [mine, setMine] = useState<{ pts: number; w: number; d: number; l: number } | null>(null);
  const recorded = useRef<number>(-1);
  const d = live.draft;
  const tag = live.practice ? t('room.tag.practice') : t(`room.tag.${kind}`);

  useEffect(() => { if (live.status === 'draft') { setLineup(null); setMine(null); setStep('sheet'); } }, [live.status, live.me.epoch]);
  useEffect(() => { if (live.status === 'xv' && d && !lineup) setLineup(d.lineup); }, [live.status, d, lineup]);

  const others = live.members.filter((m) => !m.me);
  const opp = others[0];

  /* ---------------------------------------------------------- views */
  if (live.status === 'connecting') return <Centered title={t('room.opening')} onHome={onHome} />;
  if (live.status === 'unavailable') {
    return (
      <Centered title={t('room.off')} onHome={onHome}>
        <p className="max-w-[40ch] text-[15px] text-ash-2">{t('room.offBody')}</p>
        <Button variant="primary" className="mt-5" onClick={live.goPractice}>{t('room.practice')}</Button>
      </Centered>
    );
  }
  if (live.status === 'closed') return <Centered title={t('room.unavailable')} onHome={onHome}><p className="text-ash-2">{t('room.closed')}</p></Centered>;
  if (live.status === 'full') return <Centered title={t('room.unavailable')} onHome={onHome}><p className="text-ash-2">{t('room.full')}</p></Centered>;
  if (live.partnerGone && live.status !== 'final') {
    return (
      <Centered title={t('room.partnerLeftTitle')} onHome={onHome}>
        <p className="text-ash-2">{t('room.partnerLeft', { name: live.partnerName || '…' })}</p>
        <div className="mt-5 grid gap-2">
          <Button variant="primary" onClick={live.goPractice}>{t('room.continueBots')}</Button>
          <Button onClick={onHome}>{t('room.leaveRoom')}</Button>
        </div>
      </Centered>
    );
  }

  if (live.status === 'lobby') {
    const url = buildRoomUrl(live.code);
    return (
      <Screen>
        <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{t('club.title')} · {t(`room.tag.${kind}`)}</span>} />
        <h1 className="display mt-4 text-[44px] font-black leading-[0.9]">{t('room.pitch1')}<br />{kind === 'shared' ? t('room.pitch2shared') : kind === 'party' ? t('room.pitch2party') : kind === 'coop' ? t('room.pitch2coop') : t('room.pitch2')}<br /><span className="text-brass">{kind === 'coop' ? t('room.pitch3coop') : t('room.pitch3')}</span></h1>
        <p className="mt-3 text-[15px] text-ash-2">{kind === 'shared' ? t('mode.shared.desc') : kind === 'party' ? t('mode.party.desc') : kind === 'coop' ? t('mode.coop.desc') : t('room.pitchBody')}</p>
        <Panel className="mt-5" label={t('room.code')}>
          <div className="px-4 py-3">
            <p className="display tnum text-[50px] font-black tracking-[0.12em] text-brass">{live.code.toUpperCase()}</p>
            <label htmlFor="room-link" className="sr-only">{t('room.link')}</label>
            <div className="mt-2 flex gap-2">
              <input id="room-link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 text-[16px] text-ash-2" />
              <Button size="sm" className="h-11" onClick={async () => { const ok = await copyText(url); toast(ok ? t('room.copied') : t('share.select')); }}>{t('room.copy')}</Button>
            </div>
            <p className="mt-2 text-[13px] text-ash">{kind === 'party' ? t('room.shareParty', { n: 8 }) : t('room.shareDuel')}</p>
          </div>
        </Panel>
        <label className="mt-5 flex flex-col gap-1.5">
          <span className="eyebrow text-[10.5px] text-ash">{t('room.yourName')}</span>
          <input value={live.me.name} maxLength={24} onChange={(e) => live.setName(cleanName(e.target.value))} onBlur={(e) => { const v = cleanName(e.target.value).trim(); if (v) onRename(v); }}
            className="h-11 rounded-lg border border-line-2 bg-ink px-3 text-[16px] text-chalk focus:border-brass focus:outline-none" />
        </label>
        <Section title={others.length ? t('room.players', { n: live.members.length }) : (kind === 'party' ? t('room.waitingFriends') : t('room.waitingOpp'))} className="mt-6">
          <ul className="flex flex-col gap-1.5">{live.members.map((m) => <li key={m.id} className="flex items-center gap-2 text-[15px]"><span className="h-2 w-2 rounded-full bg-win" aria-hidden />{m.name}{m.me ? <span className="text-ash"> · {t('common.you')}</span> : null}{m.host ? <span className="eyebrow text-[10px] text-ash"> · {t('room.host')}</span> : null}</li>)}</ul>
        </Section>
        {kind === 'party' && live.me.host && others.length ? <Button variant="primary" size="lg" className="mt-6 w-full" onClick={live.hostStart}>{t('room.start')}</Button> : null}
        <button type="button" onClick={live.goPractice} className="mt-6 min-h-11 text-[14px] text-ash-2 underline underline-offset-2 hover:text-chalk">{kind === 'party' ? t('room.practiceBots') : t('room.practiceNoOne')}</button>
      </Screen>
    );
  }

  if (live.status === 'draft' && d) {
    const r = d.round;
    let status: React.ReactNode = null;
    let locked = false;
    let lockedKey: string | undefined;
    if (kind === 'liveduel' && opp) {
      const mineC = live.me.commits[r], theirC = opp.p.commits[r];
      locked = !!mineC;
      if (mineC && live.pendingIdx !== null) lockedKey = d.offer?.options[live.pendingIdx];
      if (mineC && !theirC) status = t('room.lockedWaiting', { name: opp.name });
      else if (!mineC && theirC) status = t('room.oppLocked', { name: opp.name });
      else if (r > 0 && opp.p.reveals[r - 1] !== undefined) {
        const offer = d.history[r - 1];
        const k = offer?.options[opp.p.reveals[r - 1]];
        if (k) status = t('room.theyTook', { name: opp.name, player: P(k).short });
      }
    }
    if (kind === 'shared' && opp) {
      const first = live.firstPicker(r);
      const theirs = opp.p.picks[r];
      locked = !first && !theirs;
      if (locked) status = t('room.theirTurn', { name: opp.name });
      else if (theirs) status = t('room.yourTurnAfter', { name: opp.name, player: P(theirs).short });
    }
    if (kind === 'coop' && opp) {
      const myTurn = live.firstPicker(r);
      locked = !myTurn;
      const prevKey = r > 0 ? d.picks[r - 1] : undefined;
      const prevByPartner = r > 0 && !live.firstPicker(r - 1);
      status = myTurn
        ? (prevByPartner && prevKey ? t('coop.yourTurnAfter', { name: opp.name, player: P(prevKey).short }) : t('coop.yourTurn'))
        : t('coop.theirTurn', { name: opp.name });
    }
    if (kind === 'party') status = t('room.partyStatus', { a: others.filter((o) => o.p.phase === 'done').length, b: others.length });
    return (
      <Draft state={d} plan={plan} settings={settings} forceHints coach={false} onPick={live.pick} onReroll={() => undefined} onHome={onHome} onInspect={onInspect}
        vsLabel={kind === 'party' ? t('room.statusParty', { n: live.members.length }) : kind === 'coop' ? t('coop.status', { name: opp?.name ?? '…' }) : t('room.statusDuel', { kind: tag, name: opp?.name ?? '…' })}
        status={status} locked={locked} lockedKey={lockedKey}
        aside={kind === 'party' ? <CupProgress members={live.members} /> : kind === 'coop' ? <CoopPicks picks={d.picks} firstPicker={live.firstPicker} partner={opp?.name ?? '…'} /> : undefined} />
    );
  }

  if (live.status === 'xv' && d && lineup) {
    // co-op: the host finalises the sheet and the plan for both
    if (kind === 'coop' && !live.me.host && !live.practice) {
      const prof = teamProfile(lineup, byKey, plan);
      return (
        <Screen>
          <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{tag}</span>} />
          <h1 className="display mt-3 text-[34px] font-black">{t('coop.ourXV')}</h1>
          <p className="mt-1 text-[14px] text-ash-2">{t('coop.hostDecides', { name: live.members.find((m) => m.host)?.name ?? '…' })}</p>
          <div className="mt-4"><TeamSheet lineup={lineup} compact rowOf={(n) => { const sv = prof.slots.find((s) => s.n === n); return sv ? { n, player: sv.player, rating: sv.rating, kind: sv.kind, role: roleName(sv.player.role) } : { n }; }} /></div>
        </Screen>
      );
    }
    const session: Session = { state: d, lineup, plan, live: live.practice ? 'practice' : (kind as Session['live']) };
    const play = () => {
      const res = finishGame(session, name);
      setMine({ pts: res.points, w: res.season?.w ?? 0, d: res.season?.d ?? 0, l: res.season?.l ?? 0 });
      live.publishResult({ pts: res.points, w: res.season?.w ?? 0, d: res.season?.d ?? 0, l: res.season?.l ?? 0, tok: res.token });
    };
    if (step === 'plan') {
      return <Plan coach={false} state={d} lineup={lineup} plan={plan} onChange={setPlan} onBack={() => setStep('sheet')} onPlay={play} vsLabel={tag} />;
    }
    return <XV session={session} hideRatings={false} onHome={onHome} vsLabel={tag} onChange={(l, p) => { setLineup(l); setPlan(p); }} onNext={() => setStep('plan')} />;
  }

  if ((live.status === 'waiting' || live.status === 'final') && d) {
    if (kind === 'coop') return <CoopFinal live={live} mine={mine} lineup={lineup ?? d.lineup} plan={plan} onHome={onHome} tag={tag} />;
    return <Final kind={kind} live={live} mine={mine} lineup={lineup ?? d.lineup} plan={plan} onHome={onHome} recorded={recorded} tag={tag} />;
  }
  return <Centered title={t('room.opening')} onHome={onHome} />;
}

/* --------------------------------------------------- Clubhouse Cup progress */

/** Unit strength of everyone in the room while drafting (never their picks, never a season score). */
function CupProgress({ members }: { members: Member[] }) {
  return (
    <Panel className="mt-3" label={t('cup.progress')}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-ash">
            <th className="eyebrow px-3 py-1.5 text-[9.5px] font-medium">{t('cup.player')}</th>
            {UNIT_IDS.map((u) => <th key={u} className="eyebrow px-1.5 py-1.5 text-right text-[9.5px] font-medium">{t(`unit2.${u}.short`)}</th>)}
          </tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={`border-t border-line ${m.me ? 'text-chalk' : 'text-ash-2'}`}>
                <td className="break-words px-3 py-1.5 font-semibold">{m.name}{m.me ? <span className="text-ash"> · {t('common.you')}</span> : null}{m.p.phase === 'done' ? <span className="text-win"> ✓</span> : null}</td>
                {UNIT_IDS.map((u, i) => <td key={u} className="mono px-1.5 py-1.5 text-right">{m.p.units && m.p.units[i] >= 0 ? m.p.units[i] : '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 pb-2 pt-1 text-[11.5px] text-ash">{t('cup.note')}</p>
    </Panel>
  );
}

function CoopPicks({ picks, firstPicker, partner }: { picks: string[]; firstPicker: (r: number) => boolean; partner: string }) {
  const mine = picks.filter((_, r) => firstPicker(r)).length;
  return <p className="mono mt-2 text-center text-[12px] text-ash-2">{t('coop.split', { me: mine, them: picks.length - mine, name: partner })}</p>;
}

/* ------------------------------------------------------------ co-op final */

function CoopFinal({ live, mine, lineup, plan, onHome, tag }: { live: ReturnType<typeof useLive>; mine: { pts: number } | null; lineup: Lineup; plan: PlanId; onHome: () => void; tag: string }) {
  const d = live.draft!;
  const host = live.members.find((m) => m.host);
  const hostRes = live.me.host ? live.me.result : host?.p.result;
  const verified = useMemo(() => (hostRes ? verifyResult(hostRes.tok, d.cfg) : null), [hostRes?.tok]); // eslint-disable-line react-hooks/exhaustive-deps
  const season = useMemo(() => {
    const l = verified?.lineup ?? lineup;
    const p = verified?.plan ?? plan;
    return simulateSeason(sideFromProfile('you', 'ERA XV', teamProfile(l, byKey, p)), d.cfg.seed, d.cfg.ruleset);
  }, [verified, lineup, plan, d.cfg.seed, d.cfg.ruleset]);
  useEffect(() => { if (season.finish === 'champion') haptic('title'); }, [season.finish]);
  const partner = live.members.find((m) => !m.me);
  const myPicks = d.picks.filter((_, r) => live.firstPicker(r)).length;
  if (!hostRes && !mine) return <Centered title={t('room.waitingFor', { name: host?.name ?? '…' })} onHome={onHome} />;
  return (
    <Screen>
      <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{tag}</span>} />
      <section className={`touchlines mt-3 rounded-xl border px-4 py-4 ${season.finish === 'champion' ? 'border-brass bg-brass/[0.08]' : 'border-line-2 bg-ink-2'}`}>
        <p className="eyebrow text-[10.5px] text-ash">{t('coop.ourSeason')}</p>
        <p className="display mt-1 text-[40px] font-black leading-[0.9]">{standingLabel(season)}</p>
        <p className="mono mt-2 text-[13px] text-ash-2">{t('card.stats', { pts: season.points, w: season.w, d: season.d, l: season.l, diff: `${season.pf - season.pa >= 0 ? '+' : ''}${season.pf - season.pa}`, bp: season.tb + season.lb })}</p>
        {verified && !verified.ok ? <p className="mt-1 text-[13px] text-loss">{t('room.unverified')}</p> : null}
      </section>
      <p className="mt-3 text-[14px] text-ash-2">{t('coop.split', { me: myPicks, them: d.picks.length - myPicks, name: partner?.name ?? '…' })}</p>
      <ol className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {d.picks.map((k, r) => (
          <li key={k} className="flex items-center gap-2 rounded-lg border border-line bg-ink-2 px-3 py-1.5 text-[13.5px]">
            <span className="mono w-7 text-ash">{r + 1}</span>
            <span className="min-w-0 flex-1 break-words font-semibold">{P(k).name}</span>
            <span className={`mono break-words text-[11.5px] ${live.firstPicker(r) ? 'text-brass' : 'text-ash-2'}`}>{live.firstPicker(r) ? t('common.you') : partner?.name ?? '…'}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="primary" onClick={live.requestRematch}>{t('room.rematch')}</Button>
        <Button onClick={onHome}>{t('room.leaveRoom')}</Button>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------- duel / cup final */

function Final({ kind, live, mine, lineup, plan, onHome, recorded, tag }: {
  kind: RoomKind; live: ReturnType<typeof useLive>; mine: { pts: number; w: number; d: number; l: number } | null; lineup: Lineup; plan: PlanId; onHome: () => void;
  recorded: React.MutableRefObject<number>; tag: string;
}) {
  const d = live.draft!;
  const others = live.members.filter((m) => !m.me);
  const verified = useMemo(() => others.map((m) => ({ m, v: m.p.result && m.p.epoch === live.me.epoch ? verifyResult(m.p.result.tok, d.cfg, kind === 'shared' ? live.me.picks.map((k) => P(k).person) : undefined) : null })), [others.map((o) => o.p.result?.tok).join(), live.me.epoch]); // eslint-disable-line react-hooks/exhaustive-deps
  const finished = verified.filter((x) => x.v);
  const myPts = mine?.pts ?? live.me.result?.pts ?? 0;
  const [revealed, setRevealed] = useState(0);

  // records once per game
  useEffect(() => {
    if (recorded.current === live.me.epoch || live.practice) return;
    if (kind !== 'party' && finished.length && finished[0].v) {
      recorded.current = live.me.epoch;
      const rec = loadRecords();
      if (myPts > finished[0].v.pts) rec.duels.w++; else if (myPts < finished[0].v.pts) rec.duels.l++;
      saveRecords(rec);
    }
    if (kind === 'party' && others.length && finished.length === others.length) {
      recorded.current = live.me.epoch;
      const rec = loadRecords();
      if (finished.every((x) => myPts > (x.v?.pts ?? 0))) { rec.partiesWon++; saveRecords(rec); }
    }
  }, [finished.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const opp = verified[0];
  const theirs = opp?.v;
  const mySeason = useMemo(() => simulateSeason(sideFromProfile('you', 'ERA XV', teamProfile(lineup, byKey, plan)), d.cfg.seed, d.cfg.ruleset), [lineup, plan, d.cfg.seed, d.cfg.ruleset]);
  const theirSeason = useMemo(() => (theirs ? simulateSeason(sideFromProfile('them', 'x', teamProfile(theirs.lineup, byKey, theirs.plan)), d.cfg.seed, d.cfg.ruleset) : null), [theirs, d.cfg.seed, d.cfg.ruleset]);
  const h2h = useMemo(() => {
    if (!theirs) return null;
    const a = sideFromProfile('you', 'you', teamProfile(lineup, byKey, plan));
    const b = sideFromProfile('them', 'them', teamProfile(theirs.lineup, byKey, theirs.plan));
    return simMatch(a, b, `${d.cfg.seed}:${live.me.epoch}:h2h`, { neutral: true, knockout: true });
  }, [theirs, lineup, plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const cmp = useMemo(() => {
    if (!theirs || !mine) return null;
    return compareDrafts({ name: 'me', picks: d.picks, history: d.history, lineup, plan, season: undefined as never }, { name: opp.m.name, picks: theirs.picks, history: d.history, lineup: theirs.lineup, plan: theirs.plan, season: undefined as never }, d.cfg.seed, d.cfg.ruleset);
  }, [theirs, mine]); // eslint-disable-line react-hooks/exhaustive-deps

  // the reveal: standings first, then points, then the verdict
  useEffect(() => {
    if (revealed < 1 || revealed >= 4) return;
    const h = setTimeout(() => setRevealed((x) => x + 1), revealed === 1 ? 1500 : 700);
    return () => clearTimeout(h);
  }, [revealed]);
  useEffect(() => { if (revealed === 4 && theirs && myPts > theirs.pts) haptic('win'); }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (kind === 'party') {
    const rows = [{ name: live.me.name, pts: myPts, me: true, ok: true, w: mine?.w ?? 0 }, ...finished.map((x) => ({ name: x.m.name, pts: x.v!.pts, me: false, ok: x.v!.ok, w: x.v!.w }))].sort((a, b) => b.pts - a.pts || b.w - a.w);
    return (
      <Screen>
        <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{live.practice ? t('room.practiceParty') : t('room.partyTag', { code: live.code.toUpperCase() })}</span>} />
        <h1 className="display mt-3 text-[40px] font-black">{t('room.finalTable')}</h1>
        <p className="text-[14px] text-ash-2">{t('room.finishedOf', { a: finished.length + 1, b: live.members.length })}</p>
        <Card className="mt-4 divide-y divide-line">
          {rows.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${r.me ? 'text-brass' : ''}`}>
              <span className="display tnum w-6 text-[22px] font-black">{i + 1}</span>
              <span className="min-w-0 flex-1 break-words text-[16px] font-semibold">{r.name}{!r.ok ? <span className="ml-2 text-[12px] text-loss">{t('room.unverified')}</span> : null}</span>
              <span className="display tnum text-[26px] font-black">{r.pts}</span>
            </div>
          ))}
          {others.filter((o) => !finished.some((f) => f.m.id === o.id)).map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-4 py-3 text-ash"><span className="w-6" /><span className="flex-1">{o.name}</span><span className="text-[13px]">{t('room.stillDrafting')}</span></div>
          ))}
        </Card>
        <p className="mt-2 text-[12px] text-ash">{t('room.partySeason', { w: mine?.w ?? 0, d: mine?.d ?? 0, l: mine?.l ?? 0 })}</p>
        {live.me.host && !live.practice ? <Button variant="primary" className="mt-5 w-full" onClick={live.hostStart}>{t('room.runBack')}</Button> : live.practice ? <Button variant="primary" className="mt-5 w-full" onClick={live.requestRematch}>{t('room.runBack')}</Button> : <p className="mt-4 text-[13px] text-ash">{t('room.hostRunBack')}</p>}
        <Button className="mt-3 w-full" onClick={onHome}>{t('room.leaveRoom')}</Button>
      </Screen>
    );
  }

  if (!theirs || !opp) {
    return (
      <Centered title={t('room.waitingFor', { name: others[0]?.name ?? '…' })} onHome={onHome}>
        <p className="text-[15px] text-ash-2">{t('room.yourSeasonHidden')}</p>
      </Centered>
    );
  }
  const level = myPts === theirs.pts;
  const iWin = level ? (h2h ? h2h.w === 1 : false) : myPts > theirs.pts;
  const wantsRematch = opp.m.p.rematch === live.me.epoch + 1;
  const iWant = live.me.rematch === live.me.epoch + 1;

  if (revealed === 0) {
    return (
      <Screen>
        <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{tag}</span>} />
        <div className="flex min-h-[60vh] flex-col items-start justify-center">
          <p className="eyebrow text-[11px] text-ash">{t('duel.bothDone')}</p>
          <h1 className="display mt-2 text-[44px] font-black leading-[0.9]">{t('duel.seasonsPlayed')}</h1>
          <p className="mt-3 max-w-[36ch] text-[15px] text-ash-2">{t('duel.suspense', { name: opp.m.name })}</p>
          <Button variant="primary" size="lg" className="mt-6 w-full" onClick={() => setRevealed(1)}>{t('duel.reveal')}</Button>
        </div>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar onHome={onHome} title={<span className="eyebrow text-[11px] text-brass">{tag}</span>} />
      <UnitDuel mine={lineup} theirs={theirs.lineup} name={opp.m.name} />
      {revealed >= 2 ? (
      <table className="animate-fade mt-4 w-full" aria-label={t('duel.table')}>
        <tbody>
          {[{ n: live.me.name, me: true, s: mySeason, pts: myPts }, { n: opp.m.name, me: false, s: theirSeason, pts: theirs.pts }].map((row) => (
            <tr key={String(row.me)} className="border-b border-line">
              <td className="break-words py-3 pr-2"><span className={`display text-[22px] font-black ${row.me ? 'text-chalk' : 'text-ash-2'}`}>{upper(row.n)}</span></td>
              <td className="animate-fade py-3 text-right"><span className="display tnum text-[28px] font-black">{row.s ? <Ord n={row.s.position} /> : '—'}</span></td>
              <td className="py-3 pl-3 text-right">{revealed >= 3 ? <span className="display tnum animate-pop text-[28px] font-black">{row.pts}<span className="text-[14px] text-ash"> {t('story.pts')}</span></span> : <span className="mono text-ash">···</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      ) : <p className="mono mt-4 text-[13px] text-ash">{t('duel.units.next')}</p>}
      {revealed >= 4 ? (
        <>
          <h1 className={`display animate-pop mt-5 text-[48px] font-black leading-none ${iWin ? 'text-win' : 'text-loss'}`}>{iWin ? `▲ ${t('room.youWin')}` : `▼ ${t('room.theyWin', { name: opp.m.name })}`}</h1>
          <p className="mt-2 text-[14px] text-ash-2">{level ? t('room.levelH2h') : t('room.byPoints', { n: Math.abs(myPts - theirs.pts) })}</p>
          <p className="display tnum mt-2 text-[24px] font-black">{t('common.you')} {myPts} – {theirs.pts} {opp.m.name}</p>
          {!theirs.ok ? <p className="mt-1 text-[13px] text-loss">{t('room.unverified')}</p> : null}
          {mine ? <p className="mt-2 text-[14px] text-ash-2">{t('room.youWent', { w: mine.w, d: mine.d, l: mine.l })}</p> : null}
          {h2h ? (
            <Card className="mt-4 px-4 py-3">
              <p className="eyebrow text-[10.5px] text-ash">{t('room.h2h')} · {level ? t('room.h2hDecider') : t('room.h2hFun')}</p>
              <p className="display tnum mt-1 text-[24px] font-black">{t('room.h2hScore', { a: h2h.home.pts, b: h2h.away.pts, name: opp.m.name })}</p>
              {h2h.kc ? <p className="mono text-[12px] text-ash">{t('po.kc', { a: h2h.kc[0], b: h2h.kc[1] })}</p> : h2h.et ? <p className="mono text-[12px] text-ash">{t('po.et')}</p> : null}
            </Card>
          ) : null}
          {cmp ? (
            <Section title={t('room.diffs')} className="mt-6">
              {cmp.diffs.length ? (
                <Card className="divide-y divide-line">
                  {cmp.diffs.slice(0, 6).map((x) => (
                    <div key={x.round} className="flex items-center justify-between gap-3 px-4 py-2 text-[14px]">
                      <span><span className="mono text-ash">{t('analysis.round', { n: x.round })}</span> {x.yours.short} <span className="text-ash">{t('ch.over')}</span> {x.theirs.short}</span>
                      <span className={`mono font-semibold ${x.pts > 0 ? 'text-win' : x.pts < 0 ? 'text-loss' : 'text-ash'}`}>{x.pts > 0 ? '+' : ''}{x.pts}</span>
                    </div>
                  ))}
                </Card>
              ) : <p className="text-[14px] text-ash-2">{t('room.identical')}</p>}
            </Section>
          ) : null}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="primary" onClick={live.requestRematch} disabled={iWant && !live.practice}>{iWant && !live.practice ? t('room.waitingRematch', { name: opp.m.name }) : wantsRematch ? t('room.wantsRematch', { name: opp.m.name }) : t('room.rematch')}</Button>
            <Button onClick={onHome}>{t('room.leaveRoom')}</Button>
          </div>
          <p className="mt-2 text-[12px] text-ash">{t('room.rematchNote')}</p>
        </>
      ) : null}
    </Screen>
  );
}

/** First stage of the reveal: unit against unit, the season still hidden. */
function UnitDuel({ mine, theirs, name }: { mine: Lineup; theirs: (string | null)[]; name: string }) {
  const a = unitRatings(mine, byKey), b = unitRatings(theirs as Lineup, byKey);
  return (
    <section className="animate-rise mt-3 rounded-xl border border-line bg-ink-2" aria-label={t('duel.units.title')}>
      <p className="eyebrow border-b border-line px-4 py-2 text-[11px] text-brass">{t('duel.units.title')}</p>
      <table className="w-full table-fixed text-[14px]">
        <thead><tr className="text-ash"><th className="w-[40%]" /><th className="eyebrow px-2 py-1.5 text-right text-[10px] font-medium">{t('common.you')}</th><th className="eyebrow break-words px-3 py-1.5 text-right text-[10px] font-medium">{upper(name)}</th></tr></thead>
        <tbody>
          {UNIT_IDS.map((u) => {
            const x = a[u] ?? 0, y = b[u] ?? 0;
            return (
              <tr key={u} className="border-t border-line">
                <th scope="row" className="display px-4 py-2 text-left text-[17px] font-extrabold">{t(`unit2.${u}`)}</th>
                <td className={`mono px-2 py-2 text-right font-semibold ${x > y ? 'text-win' : ''}`}>{x > y ? '▲ ' : ''}{x || '—'}</td>
                <td className={`mono px-3 py-2 text-right font-semibold ${y > x ? 'text-win' : ''}`}>{y > x ? '▲ ' : ''}{y || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Centered({ title, children, onHome }: { title: string; children?: React.ReactNode; onHome: () => void }) {
  return (
    <Screen>
      <TopBar onHome={onHome} />
      <div className="flex min-h-[60vh] flex-col items-start justify-center">
        <h1 className="display text-[40px] font-black leading-none">{title}</h1>
        <div className="mt-3">{children}</div>
      </div>
    </Screen>
  );
}
export type { Member };
