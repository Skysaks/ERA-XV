import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ENGINE_VERSION, ROUNDS, botChoice, decodeChallenge, freshSeed, hashStr, newDraft, pickOption, replay, byKey, teamProfile, sideFromProfile, simulateSeason,
  withExclusions, type DraftConfig, type DraftState, type PlanId, type RulesetId,
} from '../../engine/index';
import { connectRoom, newRoomCode, newSalt, type Presence, type RoomClient, type RoomKind, type RoomPeer } from './transport';
import { P } from '../game';
import { t } from '../i18n';
import { unitRatings, UNIT_IDS } from '../../engine/index';

export type LiveStatus = 'connecting' | 'lobby' | 'draft' | 'xv' | 'waiting' | 'final' | 'unavailable' | 'closed' | 'full';
export interface Member { id: string; name: string; me: boolean; host: boolean; bot: boolean; p: Presence }

const commitOf = (epoch: number, r: number, i: number, salt: string) => hashStr(`${epoch}|${r}|${i}|${salt}`).toString(36);
const basePresence = (room: string, name: string, host: boolean, kind: RoomKind): Presence => ({
  app: 'eraxv', v: 1, room, name, host, kind, joinedAt: Date.now(), phase: 'lobby', epoch: 0, commits: [], reveals: [], salts: [], picks: [],
});

/** verified result of another player: their picks replayed on the room's seed, their season recomputed */
export interface Verified { pts: number; w: number; d: number; l: number; ok: boolean; picks: string[]; lineup: (string | null)[]; plan: PlanId }
export function verifyResult(tok: string, cfg: DraftConfig, exclude?: string[]): Verified | null {
  const d = decodeChallenge(tok);
  if (!d.ok) return null;
  const x = d.t;
  if (x.cfg.seed !== cfg.seed) return null;
  const rep = replay({ ...cfg, plan: x.cfg.plan }, x.picks, x.rerollRound, exclude);
  const prof = teamProfile(x.lineup, byKey, x.cfg.plan);
  const season = simulateSeason(sideFromProfile('them', 'x', prof), cfg.seed, cfg.ruleset);
  const lineupOk = x.lineup.filter(Boolean).every((k) => x.picks.includes(k!));
  return { pts: season.points, w: season.w, d: season.d, l: season.l, ok: (rep.ok || cfg.mode === 'shared') && lineupOk && season.points === x.points, picks: x.picks, lineup: x.lineup, plan: x.cfg.plan };
}

export function useLive(opts: { kind: RoomKind; joinCode?: string; name: string; plan: PlanId; ruleset: RulesetId; practice: boolean; onUrl: (code: string | null) => void }) {
  const { kind } = opts;
  const [, force] = useState(0);
  const rerender = useCallback(() => force((x) => x + 1), []);
  const client = useRef<RoomClient | null>(null);
  const me = useRef<Presence>(basePresence(opts.joinCode ?? newRoomCode(kind), opts.name, !opts.joinCode, kind));
  const [status, setStatus] = useState<LiveStatus>(opts.practice ? 'lobby' : 'connecting');
  const [practice, setPractice] = useState(opts.practice);
  const draft = useRef<DraftState | null>(null);
  const salts = useRef<string[]>([]);
  const pending = useRef<number | null>(null);
  const bots = useRef<Presence[]>([]);
  const botDrafts = useRef<DraftState[]>([]);
  const timers = useRef<number[]>([]);
  /** pair rooms: the other player vanished from presence while the room needs them */
  const [partnerGone, setPartnerGone] = useState(false);
  const goneTimer = useRef<number | null>(null);
  const lastOther = useRef('');
  /** practice bots: one timer per bot action (scheduleBots runs on every render) */
  const botJobs = useRef<Set<string>>(new Set());
  const once = (k: string) => { const key = `${me.current.epoch}:${k}`; if (botJobs.current.has(key)) return false; botJobs.current.add(key); return true; };

  const publish = useCallback((patch: Partial<Presence>) => {
    me.current = { ...me.current, ...patch };
    if (client.current && !practice) client.current.set(patch);
    rerender();
  }, [practice, rerender]);

  /* ------------------------------------------------------ members */
  const members = (): Member[] => {
    if (practice) return [{ id: 'me', name: me.current.name, me: true, host: true, bot: false, p: me.current }, ...bots.current.map((b, i) => ({ id: `bot${i}`, name: b.name, me: false, host: false, bot: true, p: b }))];
    const c = client.current;
    if (!c) return [{ id: 'me', name: me.current.name, me: true, host: me.current.host, bot: false, p: me.current }];
    const ps: RoomPeer[] = c.peers();
    const out: Member[] = ps.filter((x) => !x.me).map((x) => ({ id: x.peer, name: x.p.name || '?', me: false, host: x.p.host, bot: false, p: x.p }));
    out.push({ id: 'me', name: me.current.name, me: true, host: me.current.host, bot: false, p: me.current });
    return out.sort((a, b) => a.p.joinedAt - b.p.joinedAt || a.id.localeCompare(b.id));
  };

  const cfgOf = (): DraftConfig | null => {
    const host = members().find((m) => m.host);
    const c = (me.current.host ? me.current.cfg : host?.p.cfg);
    return c ? { seed: c.seed, plan: c.plan, ruleset: c.ruleset, mode: kind, engine: ENGINE_VERSION } : null;
  };

  const startDraft = useCallback((cfg: DraftConfig) => {
    draft.current = newDraft({ ...cfg, plan: opts.plan });
    salts.current = []; pending.current = null;
    publish({ phase: 'draft', epoch: me.current.host ? me.current.epoch : (me.current.cfg?.epoch ?? me.current.epoch), commits: [], reveals: [], salts: [], picks: [], result: undefined, rematch: undefined });
    setStatus('draft');
  }, [opts.plan, publish]);

  /* ------------------------------------------------------ connect */
  useEffect(() => {
    if (practice) { opts.onUrl(null); return; }
    let alive = true;
    connectRoom().then((c) => {
      if (!alive) return;
      if (!c) { setStatus('unavailable'); return; }
      client.current = c;
      if (me.current.host) {
        let code = me.current.room;
        let guard = 0;
        while (c.codeInUse(code) && guard++ < 5) code = newRoomCode(kind);
        me.current.room = code;
        me.current.epoch = 1;
        me.current.cfg = { seed: freshSeed(), plan: opts.plan, ruleset: opts.ruleset, epoch: 1 };
      }
      c.join(me.current.room);
      c.set(me.current);
      opts.onUrl(me.current.room);
      setStatus('lobby');
      const unsub = c.subscribe(() => { react(); rerender(); });
      // a joiner who finds no host after a while: the room is gone
      if (!me.current.host) {
        const h = window.setTimeout(() => { if (!members().some((m) => m.host)) setStatus('closed'); }, 9000);
        timers.current.push(h);
      }
      return unsub;
    });
    return () => { alive = false; };
  }, [practice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    timers.current.forEach((h) => clearTimeout(h));
    if (client.current) { client.current.leave(); client.current.dispose(); }
    opts.onUrl(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------ protocol */
  const react = () => {
    const ms = members();
    const others = ms.filter((m) => !m.me);
    const host = ms.find((m) => m.host);
    // departures: a screen that can only progress with the others must not wait forever
    if (others.length) lastOther.current = others[0].name;
    const cur = statusRef.current;
    const blocked = !practice && ((cur === 'draft' && kind !== 'party') || cur === 'waiting' || (cur === 'xv' && kind === 'coop' && !me.current.host));
    if (blocked && !others.length) {
      if (goneTimer.current === null) {
        goneTimer.current = window.setTimeout(() => {
          goneTimer.current = null;
          if (members().some((m) => !m.me)) return;
          // a party table can close on its own; a pair format cannot go on alone
          if (kind === 'party') setStatus('final'); else setPartnerGone(true);
        }, 8000);
        timers.current.push(goneTimer.current);
      }
    } else {
      if (goneTimer.current !== null) { clearTimeout(goneTimer.current); goneTimer.current = null; }
      if (others.length) setPartnerGone(false);
    }
    // room full for pairs
    if ((kind === 'liveduel' || kind === 'shared' || kind === 'coop') && !practice) {
      const idx = ms.findIndex((m) => m.me);
      if (idx >= 2) { setStatus('full'); return; }
    }
    const st = statusRef.current;
    // lobby → draft
    if (st === 'lobby') {
      if (me.current.host && kind !== 'party' && others.length >= 1 && me.current.cfg) { startDraft({ seed: me.current.cfg.seed, plan: me.current.cfg.plan, ruleset: me.current.cfg.ruleset, mode: kind, engine: ENGINE_VERSION }); return; }
      if (!me.current.host && host && host.p.phase === 'draft' && host.p.cfg) {
        me.current.cfg = host.p.cfg; me.current.epoch = host.p.cfg.epoch;
        startDraft({ seed: host.p.cfg.seed, plan: host.p.cfg.plan, ruleset: host.p.cfg.ruleset, mode: kind, engine: ENGINE_VERSION });
        return;
      }
    }
    // rematch / run it back: host restarts, guests follow a newer epoch
    if (!me.current.host && host?.p.cfg && host.p.cfg.epoch > me.current.epoch && host.p.phase === 'draft') {
      me.current.cfg = host.p.cfg; me.current.epoch = host.p.cfg.epoch;
      startDraft({ seed: host.p.cfg.seed, plan: host.p.cfg.plan, ruleset: host.p.cfg.ruleset, mode: kind, engine: ENGINE_VERSION });
      return;
    }
    if (me.current.host && kind !== 'party' && (st === 'final' || st === 'waiting') && others.length && ms.every((m) => m.p.rematch === me.current.epoch + 1)) {
      const epoch = me.current.epoch + 1;
      const cfg = { seed: freshSeed(), plan: opts.plan, ruleset: opts.ruleset, epoch };
      me.current.cfg = cfg; me.current.epoch = epoch;
      startDraft({ seed: cfg.seed, plan: cfg.plan, ruleset: cfg.ruleset, mode: kind, engine: ENGINE_VERSION });
      if (client.current && !practice) client.current.set({ cfg, epoch });
      return;
    }
    advance();
    if (kind === 'coop') {
      if (!me.current.host && st === 'xv' && host?.p.result && host.p.epoch === me.current.epoch) setStatus('final');
      return;
    }
    if ((st === 'waiting' || st === 'final') && others.length && others.every((o) => o.p.result && o.p.epoch === me.current.epoch)) setStatus('final');
  };
  const statusRef = useRef(status);
  statusRef.current = status;

  const opp = (): Member | undefined => members().find((m) => !m.me);
  const firstPicker = (r: number) => (r % 2 === 0) === me.current.host; // shared: host picks first on even rounds

  const advance = () => {
    const d = draft.current;
    if (!d || statusRef.current !== 'draft') return;
    const r = d.round;
    if (r >= ROUNDS) return;
    const o = opp();
    if (kind === 'liveduel' && o) {
      const mine = me.current.commits[r];
      const theirs = o.p.commits[r];
      if (mine && theirs && me.current.reveals[r] === undefined && pending.current !== null) {
        const reveals = me.current.reveals.slice(); reveals[r] = pending.current;
        const ss = me.current.salts.slice(); ss[r] = salts.current[r];
        const idx = pending.current;
        pending.current = null;
        publish({ reveals, salts: ss });
        applyPick(idx);
      }
    }
    if (kind === 'coop' && o && !firstPicker(r)) {
      // the partner's turn: apply the key they published for this round
      const key = o.p.picks[r];
      if (key) {
        const idx = d.offer?.options.indexOf(key) ?? -1;
        if (idx >= 0) applyPick(idx);
      }
    }
    if (kind === 'shared' && o) {
      // keep the rival's picks out of my pool
      const excl = o.p.picks.filter(Boolean).map((k) => P(k)?.person).filter(Boolean) as string[];
      if (excl.join() !== d.exclude.join()) { draft.current = withExclusions(d, excl); rerender(); }
      if (me.current.picks[r] && o.p.picks[r]) { /* both picked this round; my pick already applied */ }
    }
  };

  const applyPick = (idx: number) => {
    const d = draft.current!;
    draft.current = pickOption(d, idx);
    if (draft.current.round >= ROUNDS) setStatus('xv');
    rerender();
    if (practice) scheduleBots();
  };

  /* ------------------------------------------------------ actions */
  const pick = (idx: number) => {
    const d = draft.current;
    if (!d || !d.offer) return;
    const r = d.round;
    if (kind === 'liveduel') {
      if (me.current.commits[r]) return;
      const salt = newSalt();
      salts.current[r] = salt;
      pending.current = idx;
      const commits = me.current.commits.slice(); commits[r] = commitOf(me.current.epoch, r, idx, salt);
      publish({ commits });
      if (practice) scheduleBots();
      react();
      return;
    }
    if (kind === 'shared') {
      const o = opp();
      const mayPick = firstPicker(r) || (o && o.p.picks[r]);
      if (!mayPick || me.current.picks[r]) return;
      const key = d.offer.options[idx];
      const picks = me.current.picks.slice(); picks[r] = key;
      publish({ picks });
      applyPick(idx);
      return;
    }
    if (kind === 'coop') {
      if (!firstPicker(r)) return;
      const key = d.offer.options[idx];
      const picks = me.current.picks.slice(); picks[r] = key;
      publish({ picks });
      applyPick(idx);
      return;
    }
    applyPick(idx); // party: own pace
    // Clubhouse Cup: share unit strength, never the picks, while drafting
    const ur = unitRatings(draft.current!.lineup, (k) => P(k));
    publish({ units: UNIT_IDS.map((u) => ur[u] ?? -1) });
  };

  const publishResult = (res: { pts: number; w: number; d: number; l: number; tok: string }) => {
    publish({ phase: 'done', result: res, picks: kind === 'party' || kind === 'coop' ? draft.current?.picks ?? [] : me.current.picks });
    setStatus(kind === 'coop' ? 'final' : 'waiting');
    react();
  };

  const requestRematch = () => {
    publish({ rematch: me.current.epoch + 1 });
    if (practice) {
      const epoch = me.current.epoch + 1;
      me.current.epoch = epoch;
      me.current.cfg = { seed: freshSeed(), plan: opts.plan, ruleset: opts.ruleset, epoch };
      setupBots();
      startDraft({ seed: me.current.cfg.seed, plan: opts.plan, ruleset: opts.ruleset, mode: kind, engine: ENGINE_VERSION });
      return;
    }
    react();
  };

  const hostStart = () => {
    if (!me.current.host) return;
    if (kind === 'party' && !practice) {
      const epoch = me.current.epoch + (statusRef.current === 'lobby' ? 0 : 1);
      const cfg = { seed: statusRef.current === 'lobby' ? me.current.cfg!.seed : freshSeed(), plan: opts.plan, ruleset: opts.ruleset, epoch };
      me.current.cfg = cfg; me.current.epoch = epoch;
      startDraft({ seed: cfg.seed, plan: cfg.plan, ruleset: cfg.ruleset, mode: kind, engine: ENGINE_VERSION });
      if (client.current) client.current.set({ cfg, epoch });
    }
  };

  /* ------------------------------------------------------ practice bots */
  const setupBots = () => {
    timers.current.forEach((h) => clearTimeout(h));
    timers.current = [];
    botJobs.current.clear();
    const n = kind === 'party' ? 3 : 1;
    const seed = me.current.cfg!.seed;
    bots.current = Array.from({ length: n }, (_, i) => ({ ...basePresence(me.current.room, n === 1 ? (kind === 'coop' ? t('room.botMate') : t('room.botName')) : t('room.botN', { n: i + 1 }), false, kind), epoch: me.current.epoch, phase: 'draft' as const }));
    botDrafts.current = bots.current.map(() => newDraft({ seed, plan: 'balanced', ruleset: opts.ruleset, mode: kind, engine: ENGINE_VERSION }));
    if (kind === 'party') {
      // each bot drafts at its own pace, one pick every second or so, then plays its season
      const step = (i: number) => {
        const bd = botDrafts.current[i];
        if (bd.round >= ROUNDS) { finishBot(i); return; }
        botDrafts.current[i] = pickOption(bd, botChoice(bd));
        const ur = unitRatings(botDrafts.current[i].lineup, (k) => P(k));
        bots.current[i] = { ...bots.current[i], units: UNIT_IDS.map((u) => ur[u] ?? -1) };
        rerender();
        timers.current.push(window.setTimeout(() => step(i), 500 + i * 250 + Math.random() * 900));
      };
      bots.current.forEach((_, i) => timers.current.push(window.setTimeout(() => step(i), 800 + i * 400)));
    }
  };
  const finishBot = (i: number) => {
    let bd = botDrafts.current[i];
    while (bd.round < ROUNDS) bd = pickOption(bd, botChoice(bd));
    botDrafts.current[i] = bd;
    const prof = teamProfile(bd.lineup, byKey, 'balanced');
    const season = simulateSeason(sideFromProfile('bot', 'bot', prof), bd.cfg.seed, bd.cfg.ruleset);
    import('../game').then(({ tokenFor }) => {
      const tok = tokenFor({ state: bd, lineup: bd.lineup, plan: 'balanced' }, season.points, season.w, bots.current[i].name);
      bots.current[i] = { ...bots.current[i], phase: 'done', picks: bd.picks, result: { pts: season.points, w: season.w, d: season.d, l: season.l, tok } };
      react(); rerender();
    });
  };
  const scheduleBots = () => {
    if (!practice || kind === 'party') return;
    const d = draft.current;
    if (!d) return;
    const r = Math.min(d.round, ROUNDS - 1);
    const bot = bots.current[0];
    const bd = botDrafts.current[0];
    if (!bot || !bd) return;
    if (kind === 'liveduel' && me.current.commits[r] && !bot.commits[r] && bd.round === r && once(`duel:${r}`)) {
      const h = window.setTimeout(() => {
        const idx = botChoice(botDrafts.current[0]);
        const commits = bot.commits.slice(); commits[r] = 'bot';
        const reveals = bot.reveals.slice(); reveals[r] = idx;
        bots.current[0] = { ...bots.current[0], commits, reveals };
        botDrafts.current[0] = pickOption(botDrafts.current[0], idx);
        react(); rerender();
      }, 500 + Math.random() * 1400);
      timers.current.push(h);
    }
    if (kind === 'shared') {
      // the bot drafts its own rounds in order: first on the rounds it opens, second after your pick otherwise
      const br = botDrafts.current[0].round;
      const botMay = br < ROUNDS && !bot.picks[br] && (!firstPicker(br) || !!me.current.picks[br]);
      if (botMay && once(`shared:${br}`)) {
        const h = window.setTimeout(() => {
          const b0 = bots.current[0];
          if (b0.picks[br] || botDrafts.current[0].round !== br) return;
          const excl = me.current.picks.filter(Boolean).map((k) => P(k).person);
          let bdr = withExclusions(botDrafts.current[0], excl);
          const idx = botChoice(bdr);
          const key = bdr.offer!.options[idx];
          bdr = pickOption(bdr, idx);
          botDrafts.current[0] = bdr;
          const picks = b0.picks.slice(); picks[br] = key;
          bots.current[0] = { ...b0, picks };
          react(); rerender();
        }, 700 + Math.random() * 1200);
        timers.current.push(h);
      }
    }
    if (kind === 'coop') {
      const r2 = d.round;
      if (r2 < ROUNDS && !firstPicker(r2) && !bot.picks[r2] && once(`coop:${r2}`)) {
        const h = window.setTimeout(() => {
          const cur = draft.current;
          if (!cur || cur.round !== r2 || !cur.offer) return;
          const key = cur.offer.options[botChoice(cur)];
          const picks = bots.current[0].picks.slice(); picks[r2] = key;
          bots.current[0] = { ...bots.current[0], picks };
          react(); rerender();
        }, 800 + Math.random() * 900);
        timers.current.push(h);
      }
      return;
    }
    if (d.round >= ROUNDS && !bot.result && once('finish')) {
      const h = window.setTimeout(() => finishBot(0), 1500);
      timers.current.push(h);
    }
  };

  const goPractice = () => {
    setPartnerGone(false);
    setPractice(true);
    me.current = { ...basePresence(me.current.room, me.current.name, true, kind), epoch: 1, cfg: { seed: freshSeed(), plan: opts.plan, ruleset: opts.ruleset, epoch: 1 } };
    setupBots();
    startDraft({ seed: me.current.cfg!.seed, plan: opts.plan, ruleset: opts.ruleset, mode: kind, engine: ENGINE_VERSION });
    scheduleBots();
  };
  useEffect(() => { if (opts.practice) goPractice(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // shared practice: the bot opens odd rounds
  useEffect(() => { if (practice && status === 'draft') scheduleBots(); }); // eslint-disable-line react-hooks/exhaustive-deps

  const ms = useMemo(members, [status, practice, force]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    status, setStatus, practice, goPractice, code: me.current.room, me: me.current, members: members(), draft: draft.current, cfg: cfgOf(),
    pick, publishResult, requestRematch, hostStart, setName: (n: string) => publish({ name: n }), opp: opp(), firstPicker, verifyResult, ms, pendingIdx: pending.current,
    partnerGone, partnerName: lastOther.current,
  };
}
