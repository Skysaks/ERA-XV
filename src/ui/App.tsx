import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PLAYER_BY_KEY, PLAYER_OF_THE_YEAR, TEAM_BY_ID, parseTitle, type PlayerEra } from '../data/index';
import {
  MODES, ROUNDS, TOKEN_RE, ROOM_RE, byKey, compareDrafts, dailyDayOfSeed, decodeChallenge, newDraft, pickOption, replay, reroll, simMatch, sideFromProfile, simulateSeason,
  teamProfile, verifyGame, weeklyFor, type ChallengeToken, type ModeId, type PlanId,
} from '../engine/index';
import { Confirm, ToastProvider, useToast, Button, Screen } from './components/ui';
import { DailyCard } from './screens/Home';
import { detectLang, setLang, t, type Lang } from './i18n';
import { finishGame, makeConfig, todayKey, type GameResult, type Session } from './game';
import { loadLogs, loadRecords, loadSettings, saveLogs, saveResume, saveSettings, type GameLog, type Settings } from './store';
import { dailyView, loadDaily, markAbandoned, markStarted, officialAvailable } from './daily';
import { challengeCounts, recordPlayed, recordReceived, type ChallengeRec } from './challenges';
import { describe, persist, restore, type Stage } from './resume';
import { resultFromToken } from './history';
import { finishCoach } from './components/Coach';
import { initAnalytics, timed, track, trackError } from './analytics';
import { Home } from './screens/Home';
import { Modes } from './screens/Modes';
import { Draft } from './screens/Draft';
import { XV } from './screens/XV';
import { Plan } from './screens/Plan';
import { Clubhouse } from './screens/Clubhouse';
import { Sim } from './screens/Sim';
import { Result, type CompareView } from './screens/Result';
import { ShareSheet, type ShareKind } from './screens/Share';
import { Analysis } from './screens/Analysis';
import { PlayerSheet } from './screens/PlayerSheet';
import { School } from './screens/School';
import { Profile } from './screens/Profile';
import { Archives } from './screens/Archives';
import { SettingsScreen } from './screens/Settings';
import { ChallengeDetail, ChallengeIntro, ChallengesScreen, type DailyContext } from './screens/Challenges';
import { Notice, type NoticeId } from './screens/Notice';
import { Room } from './screens/Room';
import { kindOfCode, type RoomKind } from './room/transport';
import { teamLabel } from './format';
import { haptic, setFeel, tone } from './feel';

type ScreenId = 'home' | 'modes' | 'clubhouse' | 'draft' | 'xv' | 'plan' | 'sim' | 'result' | 'analysis' | 'challenge' | 'challengeDetail' | 'challenges'
  | 'profile' | 'archives' | 'school' | 'settings' | 'room' | 'notice';

const baseUrl = () => { try { return window.location.href.split('#')[0]; } catch { return ''; } };
/** links meant for other people: the artifact's own claude.ai address when the page runs framed inside it */
const shareBase = () => {
  try {
    const r = document.referrer;
    if (/^https:\/\/claude\.ai\/(code\/)?artifact\/[\w-]+/.test(r)) return r.split('#')[0].split('?')[0];
  } catch { /* ignore */ }
  return baseUrl();
};
const setHash = (h: string | null) => { try { window.history.replaceState(null, '', h ? `${baseUrl()}#${h}` : baseUrl()); } catch { /* sandboxed */ } };

/** a default display name for live rooms, e.g. "Hooker 27" (in the creator's language) */
function roomNick() {
  const ps = ['LHP', 'HK', 'THP', 'LK', 'BF', 'OF', 'N8', 'SH', 'FH', 'IC', 'OC', 'WG', 'FB'];
  const p = ps[Math.floor(Math.random() * ps.length)];
  return `${t(`posName.${p}`)} ${10 + Math.floor(Math.random() * 90)}`;
}

/** one short, sourced line about a pick (World Cups, Grand Slams, European Cups, Super Rugby, Player of the Year) */
function factLine(p: PlayerEra): string | null {
  const poty = PLAYER_OF_THE_YEAR[p.person];
  if (poty?.length) return t('know.line.poty', { name: p.short, years: poty.join(', ') });
  const team = TEAM_BY_ID.get(p.teamEra)!;
  const titles = (team.titles ?? []).map(parseTitle);
  const major = titles.find((x) => x.kind === 'rwc') ?? titles.find((x) => x.kind === 'gs') ?? titles.find((x) => x.kind === 'lions') ?? titles.find((x) => x.kind === 'euro') ?? titles.find((x) => x.kind === 'super');
  if (major) return t(`know.line.${major.kind}`, { name: p.short, year: major.year, team: teamLabel(team) });
  return null;
}

export function App() {
  const [gen, setGen] = useState(0);
  useEffect(() => { initAnalytics(); }, []);
  return <ErrorBoundary key={gen} onReset={() => setGen((g) => g + 1)}><ToastProvider><Game /></ToastProvider></ErrorBoundary>;
}

interface Pending { t: ChallengeToken; raw: string; prev?: ChallengeRec; daily: DailyContext; day?: string }

function Game() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [lang, setLangState] = useState<Lang>(() => { const l = loadSettings().lang ?? detectLang(); setLang(l); return l; });
  const nick = useMemo(() => settings.nick || roomNick(), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!settings.nick) setSettings((s) => ({ ...s, nick })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [screen, setScreen] = useState<ScreenId>('home');
  // every new screen starts at the top (Play sits low on the home screen on phones)
  useEffect(() => { try { window.scrollTo(0, 0); } catch { /* ignore */ } }, [screen]);
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [compare, setCompare] = useState<CompareView | undefined>();
  const [pending, setPending] = useState<Pending | null>(null);
  const [detail, setDetail] = useState<ChallengeRec | null>(null);
  const [notice, setNotice] = useState<NoticeId>('malformed');
  const [inspect, setInspect] = useState<string | null>(null);
  const [schoolFocus, setSchoolFocus] = useState<string | undefined>();
  const [profileTab, setProfileTab] = useState<'stats' | 'history'>('stats');
  const [confirm, setConfirm] = useState(false);
  const [room, setRoom] = useState<{ kind: RoomKind; code?: string; practice: boolean; key: number } | null>(null);
  const [knowledge, setKnowledge] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<{ result: GameResult; kind: ShareKind } | null>(null);
  const [tick, bump] = useState(0);
  const [modeChoice, setModeChoice] = useState<ModeId>(() => (['classic', 'iq'].includes(loadSettings().mode) ? loadSettings().mode : 'classic'));
  const factCount = useRef({ facts: 0 });

  // settings → document
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.contrast = settings.contrast ? 'high' : '';
    el.dataset.text = settings.largeText ? 'large' : '';
    el.dataset.motion = settings.motion;
    setFeel(settings);
    saveSettings({ ...settings, lang });
  }, [settings, lang]);
  const changeLang = (l: Lang) => { setLang(l); setLangState(l); };

  // screens that are the start of a funnel step
  useEffect(() => {
    if (screen === 'home') { track('home_view'); track('daily_viewed', { status: dailyView().status }); }
    if (screen === 'profile') track('profile_opened');
    if (screen === 'archives') track('archives_opened');
    if (screen === 'clubhouse') track('clubhouse_opened');
  }, [screen]);

  // links: #<challenge token> or #r-<room code>, at load and when a link is opened in the same tab later
  useEffect(() => {
    const onHash = () => {
      let h = '';
      try { h = window.location.hash.slice(1); } catch { /* ignore */ }
      if (!h) return;
      const rm = ROOM_RE.exec(h);
      if (rm) { openRoom(kindOfCode(rm[1]), rm[1]); return; }
      if (TOKEN_RE.test(h)) openToken(h);
      else showNotice('malformed');
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotice = (id: NoticeId) => { setNotice(id); setScreen('notice'); setHash(null); };

  const dailyContext = (tk: ChallengeToken): { ctx: DailyContext; day?: string } => {
    if (tk.cfg.mode !== 'daily') return { ctx: null };
    const day = dailyDayOfSeed(tk.cfg.seed, new Date());
    if (!day) return { ctx: null };
    if (day !== todayKey()) return { ctx: { kind: 'pastDaily', day }, day };
    const st = loadDaily();
    if (st.entries[day]) return { ctx: { kind: 'alreadyPlayed', pts: st.entries[day].pts }, day };
    return { ctx: officialAvailable(day, st) ? { kind: 'officialToday' } : null, day };
  };

  const openToken = (raw: string) => {
    const tok = raw.includes('#') ? raw.split('#').pop()!.trim() : raw.trim();
    const rm = ROOM_RE.exec(tok);
    if (rm) { openRoom(kindOfCode(rm[1]), rm[1]); return; }
    if (/^[a-z2-9]{5}$/i.test(tok)) { openRoom(kindOfCode(tok.toLowerCase()), tok.toLowerCase()); return; }
    const d = decodeChallenge(tok);
    if (!d.ok) { track('challenge_link_error', { error: d.error }); showNotice(d.error); return; }
    const v = timed('verify', () => verifyGame(d.t));
    if (!v.ok) { track('challenge_link_error', { error: v.error }); showNotice(v.error === 'score_mismatch' ? 'score_mismatch' : v.error === 'wrong_draw' ? 'invalid' : v.error); return; }
    const { ctx, day } = dailyContext(d.t);
    track('challenge_opened', { mode: d.t.cfg.mode, daily: !!day, rematch: d.t.rematch });
    const r = recordReceived(tok, day);
    // a reply to one of my challenges: straight to the comparison
    if (r?.reply && r.rec.me) { setDetail(r.rec); setScreen('challengeDetail'); setHash(null); track('challenge_completed', { reply: true }); return; }
    // a friend's Daily when mine is already official: compare at once, no replay needed
    let prev = r?.rec;
    if (ctx?.kind === 'alreadyPlayed' && day) {
      const mine = loadDaily().entries[day]?.token;
      if (mine && prev && !prev.me) prev = recordPlayed(tok, mine) ?? prev;
    }
    setPending({ t: d.t, raw: tok, prev, daily: ctx, day });
    setScreen('challenge');
  };

  const openRoom = (kind: RoomKind, code?: string, practice = false) => {
    setRoom({ kind, code, practice, key: Date.now() });
    setScreen('room');
  };

  /* ---------------------------------------------------------- draft */
  const start = useCallback((mode: ModeId, param?: string, o: {
    seed?: number; challenge?: ChallengeToken; challengeToken?: string; challengeDay?: string;
    practiceFrom?: { picks: string[]; rerollRound: number; round: number; seed: number; plan: PlanId }; plan?: PlanId; intent?: 'challenge';
  } = {}) => {
    const plan = o.plan ?? settings.plan;
    const today = todayKey();
    const cfg = o.challenge ? { ...o.challenge.cfg } : makeConfig(mode, plan, settings.ruleset, param, o.seed ?? o.practiceFrom?.seed);
    let state = timed('draft', () => newDraft(cfg));
    let practice = false;
    if (o.practiceFrom) {
      practice = true;
      for (let r = 0; r < o.practiceFrom.round - 1; r++) {
        if (r === o.practiceFrom.rerollRound) state = reroll(state);
        const idx = state.offer!.options.indexOf(o.practiceFrom.picks[r]);
        state = pickOption(state, Math.max(0, idx));
      }
    }
    // the Daily: today's draw, from the Daily card or from a friend's Daily link
    const dailyDay = cfg.mode === 'daily' ? (o.challenge ? o.challengeDay : today) : undefined;
    const daily = dailyDay === today ? today : undefined;
    const official = daily ? officialAvailable(daily) && !practice : undefined;
    const s: Session = { state, lineup: state.lineup, plan, challenge: o.challenge, challengeToken: o.challengeToken, daily, official, practice, intent: o.intent };
    factCount.current = { facts: 0 };
    setKnowledge(null);
    setSession(s);
    setResult(null); setCompare(undefined);
    setScreen('draft');
    setHash(null);
    track('game_started', { mode: cfg.mode, kind: o.challenge ? 'challenge' : practice ? 'practice' : daily ? 'daily' : 'solo', official: !!official });
    if (daily) track('daily_started', { official: !!official });
    if (o.challenge) track('challenge_accepted', { mode: cfg.mode, daily: !!daily });
    track('draft_round_viewed', { round: state.round + 1, mode: cfg.mode });
  }, [settings.plan, settings.ruleset]);

  const save = (s: Session | null, stage: Stage) => persist(s, stage, settings.resume);

  const onPick = (idx: number) => {
    if (!session) return;
    const key = session.state.offer?.options[idx];
    const next = pickOption(session.state, idx);
    tone(520 + next.round * 12); haptic('pick');
    const s: Session = { ...session, state: next, lineup: next.lineup };
    track('player_selected', { round: next.round, idx, mode: next.cfg.mode });
    if (s.daily && s.official && next.round === 1) markStarted(s.daily);
    // mystery: reveal where the pick came from
    if (MODES[next.cfg.mode].hideTeam && key) { const tm = TEAM_BY_ID.get(PLAYER_BY_KEY.get(key)!.teamEra)!; toast(t('draft.mysteryReveal', { team: teamLabel(tm) })); }
    // knowledge line (never pauses the draft)
    if (key && settings.knowledge !== 'minimal') {
      const line = factLine(PLAYER_BY_KEY.get(key)!);
      const allow = settings.knowledge === 'deep' || factCount.current.facts < 3;
      if (line && allow) { factCount.current.facts++; setKnowledge(line); } else setKnowledge(null);
    }
    setSession(s);
    if (next.round >= ROUNDS) {
      track('draft_completed', { mode: next.cfg.mode, rerolled: next.rerollRound >= 0 });
      save(s, 'sheet');
      setScreen('xv');
    } else {
      track('draft_round_viewed', { round: next.round + 1, mode: next.cfg.mode });
      save(s, 'draft');
    }
  };
  const onReroll = () => { if (!session) return; const next = reroll(session.state); const s = { ...session, state: next }; setSession(s); save(s, 'draft'); };

  const resume = () => {
    const r = restore();
    if (!r.ok) {
      saveResume(null); bump((x) => x + 1);
      if (r.reason !== 'none') showNotice(r.reason === 'outdated' ? 'resume_outdated' : 'resume_corrupt');
      return;
    }
    setSession(r.session); setResult(null); setCompare(undefined);
    setScreen(r.stage === 'draft' ? 'draft' : r.stage === 'sheet' ? 'xv' : 'plan');
    track('draft_resumed', { stage: r.stage, round: r.round });
  };
  const abandon = () => {
    const d = describe();
    if (d?.daily && d.official) markAbandoned(d.daily);
    track('draft_abandoned', { round: d?.round, stage: d?.stage, daily: !!d?.daily });
    saveResume(null); bump((x) => x + 1);
  };

  /* ---------------------------------------------------------- season */
  const simulate = () => {
    if (!session) return;
    track('game_plan_selected', { plan: session.plan, mode: session.state.cfg.mode });
    track('simulation_started', { mode: session.state.cfg.mode });
    saveResume(null);
    const res = finishGame(session, settings.name);
    finishCoach();
    setResult(res);
    if (session.challenge) {
      const ch = session.challenge;
      const rep = replay(ch.cfg, ch.picks, ch.rerollRound);
      const theirProf = teamProfile(ch.lineup, byKey, ch.cfg.plan);
      const theirSide = sideFromProfile('them', ch.name || 'friend', theirProf);
      const theirSeason = res.season ? simulateSeason(theirSide, ch.cfg.seed, ch.cfg.ruleset) : undefined;
      const mySide = sideFromProfile('you', 'you', res.prof);
      const h2h = simMatch(mySide, theirSide, `${ch.cfg.seed}:h2h`, { neutral: true, knockout: true });
      const cmp = rep.ok && res.season && theirSeason ? compareDrafts(
        { name: 'me', picks: session.state.picks, history: session.state.history, lineup: session.lineup, plan: session.plan, season: res.season },
        { name: ch.name, picks: ch.picks, history: rep.state!.history, lineup: ch.lineup, plan: ch.cfg.plan, season: theirSeason }, ch.cfg.seed, ch.cfg.ruleset) : { diffs: [], decisive: undefined };
      setCompare({ name: ch.name || t('ch.yourFriend'), theirPoints: theirSeason?.points ?? ch.points, theirSeason, theirLineup: ch.lineup, theirPlan: ch.cfg.plan, diffs: cmp.diffs, decisive: cmp.decisive, h2h });
    }
    setScreen(settings.sim === 'instant' ? 'result' : 'sim');
  };

  const openPast = (token: string, extra: Partial<Session> = {}) => {
    const r = resultFromToken(token, extra);
    if (!r) { showNotice('outdated'); return; }
    setResult(r); setCompare(undefined); setScreen('result');
  };
  const shareDaily = () => {
    const e = dailyView().entry;
    if (!e?.token) return;
    const r = resultFromToken(e.token, { daily: e.day, official: true });
    if (r) setShareFor({ result: r, kind: 'daily' });
  };
  const playChallenge = (rec: ChallengeRec) => {
    const tokn = rec.them?.token;
    const d = tokn ? decodeChallenge(tokn) : null;
    if (!d || !d.ok) { showNotice('outdated'); return; }
    const { day } = dailyContext(d.t);
    start(d.t.cfg.mode, d.t.cfg.param, { challenge: d.t, challengeToken: tokn, challengeDay: day });
  };

  /* ---------------------------------------------------------- navigation */
  const goHome = () => {
    if (screen === 'draft' && session && session.state.round > 0 && session.state.round < ROUNDS) { setConfirm(true); return; }
    setScreen('home'); setHash(null); setRoom(null);
  };
  const favLog = (id: string) => { const logs = loadLogs().map((l) => (l.id === id ? { ...l, fav: !l.fav } : l)); saveLogs(logs); bump((x) => x + 1); };
  const isFav = result ? !!loadLogs().find((l) => l.id === result.id)?.fav : false;
  const buildUrl = (tok: string) => `${shareBase()}#${tok}`;
  const buildRoomUrl = (code: string) => `${shareBase()}#r-${code}`;
  const records = useMemo(loadRecords, [screen, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const resumeInfo = useMemo(() => describe(), [screen, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const daily = useMemo(() => dailyView(), [screen, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const toPlay = useMemo(() => challengeCounts().toPlay, [screen, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const hideRatings = session ? !!MODES[session.state.cfg.mode].hideRatings : false;
  const vsLabel = session?.challenge ? t('draft.vsLabel', { name: session.challenge.name || t('draft.friend') }) : session?.daily ? (session.official ? t('result.dailyOfficial') : t('result.dailyCasual')) : undefined;
  const dailyActions = { onPlay: () => start('daily'), onResume: resume, onShare: shareDaily, onPractice: () => start('daily') };
  const setName = (n: string) => setSettings((s) => (s.name === n ? s : { ...s, name: n }));

  let view: React.ReactNode = null;
  switch (screen) {
    case 'home':
      view = (
        <Home lang={lang} setLang={changeLang} mode={modeChoice} setMode={(m) => { setModeChoice(m); setSettings({ ...settings, mode: m }); track('mode_selected', { mode: m }); }}
          resume={resumeInfo} daily={daily} weeklyName={t(`weekly.${weeklyFor(new Date()).id}.name`)} toPlay={toPlay}
          onPlay={() => start(modeChoice)} onChallenge={() => start('classic', undefined, { intent: 'challenge' })} onClubhouse={() => setScreen('clubhouse')}
          onArchives={() => setScreen('archives')} onProfile={() => { setProfileTab('stats'); setScreen('profile'); }}
          onDaily={dailyActions.onPlay} onDailyShare={shareDaily} onDailyPractice={dailyActions.onPractice} onWeekly={() => start('weekly')}
          onModes={() => setScreen('modes')} onSchool={() => { setSchoolFocus(undefined); setScreen('school'); }} onSettings={() => setScreen('settings')}
          onResume={resume} onAbandon={abandon} />
      );
      break;
    case 'modes':
      view = <Modes current={modeChoice} onBack={() => setScreen('home')} onStart={(m, p) => { track('mode_selected', { mode: m, param: p }); start(m, p); }} onLive={(k) => openRoom(k)} onPasteCode={openToken} onClubhouse={() => setScreen('clubhouse')} />;
      break;
    case 'clubhouse':
      view = <Clubhouse onBack={() => setScreen('home')} onLive={(k) => openRoom(k)} onPractice={(k) => openRoom(k, undefined, true)} onChallenge={() => start('classic', undefined, { intent: 'challenge' })} onPasteCode={openToken}
        onMine={() => setScreen('challenges')} onHistory={() => { setProfileTab('history'); setScreen('profile'); }} records={records} daily={daily} resume={resumeInfo} dailyActions={dailyActions} />;
      break;
    case 'challenges':
      view = <ChallengesScreen onBack={() => setScreen('clubhouse')} onPlay={playChallenge} onOpen={(rec) => { setDetail(rec); setScreen('challengeDetail'); }} onNew={() => start('classic', undefined, { intent: 'challenge' })} />;
      break;
    case 'challengeDetail':
      view = detail ? <ChallengeDetail rec={detail} onBack={() => setScreen('challenges')} onNewChallenge={() => start('classic', undefined, { intent: 'challenge' })}
        onViewMine={detail.me ? () => openPast(detail.me!.token) : undefined} /> : null;
      break;
    case 'challenge':
      view = pending ? (
        <ChallengeIntro token={pending.t} daily={pending.daily} previous={pending.prev}
          onHome={() => { setPending(null); setScreen('home'); setHash(null); }}
          onPlay={() => start(pending.t.cfg.mode, pending.t.cfg.param, { challenge: pending.t, challengeToken: pending.raw, challengeDay: pending.day })}
          onOpen={(rec) => { setDetail(rec); setScreen('challengeDetail'); }}
          onFresh={() => { setPending(null); start('classic'); }} />
      ) : null;
      break;
    case 'draft':
      view = session ? (
        <Draft state={session.state} plan={session.plan} settings={settings} onPick={onPick} onReroll={onReroll} onHome={goHome} onInspect={setInspect}
          vsLabel={vsLabel} forceHints={!!session.challenge || (!!session.daily && !!session.official)} practice={session.practice}
          knowledge={knowledge ? <span key={knowledge} className="animate-fade text-[13px] font-medium text-ash-2">{knowledge}</span> : null} />
      ) : null;
      break;
    case 'xv':
      view = session ? <XV session={session} hideRatings={hideRatings} onHome={goHome} onChange={(l, p) => { const s = { ...session, lineup: l, plan: p }; setSession(s); save(s, 'sheet'); }}
        onNext={() => { save(session, 'plan'); setScreen('plan'); }} vsLabel={session.challenge ? vsLabel : undefined} /> : null;
      break;
    case 'plan':
      view = session ? <Plan state={session.state} lineup={session.lineup} plan={session.plan} onChange={(p) => { const s = { ...session, plan: p }; setSession(s); save(s, 'plan'); }}
        onBack={() => { save(session, 'sheet'); setScreen('xv'); }} onPlay={simulate} vsLabel={session.challenge ? vsLabel : undefined} /> : null;
      break;
    case 'sim':
      view = result ? <Sim result={result} speed={settings.sim} onDone={() => setScreen('result')} onHome={() => setScreen('result')} /> : null;
      break;
    case 'result': {
      const inDaily = !!result?.session.daily;
      view = result ? (
        <Result result={result} name={settings.name} fav={isFav} onFav={() => favLog(result.id)} onHome={() => { setScreen('home'); bump((x) => x + 1); }}
          onAgain={() => { track('replay_started', { same: false }); start(result.session.state.cfg.mode === 'daily' ? 'classic' : result.session.state.cfg.mode, result.session.state.cfg.param); }}
          onRunItBack={() => { track('replay_started', { same: true }); start(result.session.state.cfg.mode, result.session.state.cfg.param, { seed: result.session.state.cfg.seed, plan: result.session.plan }); }}
          onAnalysis={() => { track('analysis_opened', { mode: result.session.state.cfg.mode }); setScreen('analysis'); }} compare={compare} autoShare={result.session.intent === 'challenge'}
          onRematch={compare ? () => { setPending(null); start('classic', undefined, { intent: 'challenge' }); } : undefined}
          buildUrl={buildUrl} onName={setName}
          next={!inDaily && daily.status !== 'done' ? <DailyCard d={daily} resume={resumeInfo} compact {...dailyActions} /> : null} />
      ) : null;
      break;
    }
    case 'analysis':
      view = result ? <Analysis result={result} onBack={() => setScreen('result')} onReplayFrom={(round) => { track('turning_point_replayed', { round }); start(result.session.state.cfg.mode, result.session.state.cfg.param, { practiceFrom: { picks: result.session.state.picks, rerollRound: result.session.state.rerollRound, round, seed: result.session.state.cfg.seed, plan: result.session.plan } }); }} /> : null;
      break;
    case 'profile':
      view = <Profile key={profileTab} initial={profileTab} onBack={() => setScreen('home')} onOpenGame={(l: GameLog) => openPast(l.token, { daily: l.daily, official: l.official })} />;
      break;
    case 'archives':
      view = <Archives onBack={() => setScreen('home')} onInspect={setInspect} />;
      break;
    case 'school':
      view = <School onBack={() => setScreen('home')} focus={schoolFocus} />;
      break;
    case 'settings':
      view = <SettingsScreen settings={settings} onChange={setSettings} onBack={() => setScreen('home')} onDeleted={() => { setSettings(loadSettings()); bump((x) => x + 1); setScreen('home'); }} />;
      break;
    case 'room':
      view = room ? <Room key={room.key} kind={room.kind} joinCode={room.code} practice={room.practice} settings={settings} name={settings.name || nick} onRename={(n) => setSettings((s) => ({ ...s, name: n }))} onHome={() => { setRoom(null); setScreen('home'); setHash(null); }} onInspect={setInspect}
        buildRoomUrl={buildRoomUrl} setRoomHash={(c) => setHash(c ? `r-${c}` : null)} /> : null;
      break;
    case 'notice':
      view = <Notice id={notice} onHome={() => setScreen('home')} onPlay={() => start('classic')} />;
      break;
  }

  return (
    <div key={lang}>
      {view}
      <PlayerSheet playerKey={inspect} onClose={() => setInspect(null)} hideRatings={hideRatings && screen === 'draft'} draft={screen === 'draft' ? session?.state : undefined} plan={session?.plan}
        onRole={(r) => { setInspect(null); setSchoolFocus(r); setScreen('school'); }} />
      <Confirm open={confirm} title={t('nav.confirmDraft')} body={session?.daily && session.official ? t('nav.confirmDaily') : t('nav.confirmDraftBody')} stay={t('nav.stay')} leave={t('nav.leave')}
        onStay={() => setConfirm(false)} onLeave={() => { setConfirm(false); setScreen('home'); }} />
      {shareFor ? <ShareSheet open kind={shareFor.kind} onClose={() => setShareFor(null)} result={shareFor.result} name={settings.name} buildUrl={buildUrl} onName={setName} /> : null}
    </div>
  );
}

class ErrorBoundary extends Component<{ children: React.ReactNode; onReset: () => void }, { err: boolean; count: number }> {
  state = { err: false, count: 0 };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: unknown) { try { console.error(e); } catch { /* ignore */ } trackError('render', e); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <Screen>
        <div className="flex min-h-[70vh] flex-col justify-center">
          <h1 className="display text-[44px] font-extrabold">{t('error.title')}</h1>
          <p className="mt-2 text-[15px] text-ash-2">{t('error.body')}</p>
          <Button variant="primary" className="mt-6" onClick={() => { try { window.history.replaceState(null, '', window.location.href.split('#')[0]); } catch { /* ignore */ } this.props.onReset(); }}>{t('error.home')}</Button>
          <Button className="mt-3" onClick={() => { saveResume(null); this.props.onReset(); }}>{t('error.clearGame')}</Button>
          <p className="mt-3 text-[12.5px] text-ash">{t('error.kept')}</p>
        </div>
      </Screen>
    );
  }
}
