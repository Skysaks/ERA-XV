/**
 * Product analytics and technical metrics behind one wrapper. No vendor, no personal data:
 * events carry enumerated ids and numbers only (never a name, a link token, an email or free text).
 *
 * Sinks:
 * - local ring buffer (this device, for the Settings diagnostics and QA);
 * - optional HTTP endpoint, set at build time (ERA_ANALYTICS_URL), sent with sendBeacon in batches. Empty by default,
 *   and unusable inside an artifact (the page cannot reach other hosts) — see docs/LAUNCH.md.
 * Nothing here can block or break a game: every call is fire-and-forget inside try/catch.
 */
declare const __ANALYTICS_URL__: string;

export type EventName =
  | 'home_view' | 'mode_selected' | 'game_started' | 'draft_round_viewed' | 'player_selected' | 'draft_abandoned' | 'draft_resumed' | 'draft_completed'
  | 'game_plan_selected' | 'simulation_started' | 'simulation_skipped' | 'season_completed' | 'playoffs_reached' | 'champion'
  | 'analysis_opened' | 'turning_point_replayed' | 'replay_started'
  | 'challenge_created' | 'challenge_shared' | 'challenge_opened' | 'challenge_accepted' | 'challenge_completed' | 'challenge_link_error'
  | 'daily_viewed' | 'daily_started' | 'daily_completed' | 'share_clicked' | 'share_completed'
  | 'profile_opened' | 'archives_opened' | 'clubhouse_opened' | 'onboarding_step' | 'onboarding_skipped' | 'achievement_unlocked'
  | 'perf' | 'error';

export type Props = Record<string, string | number | boolean | undefined>;
export interface TrackedEvent { n: EventName; t: number; s: string; p?: Props }
export type Sink = (e: TrackedEvent) => void;

const KEY = 'era-xv:events';
const AID = 'era-xv:aid';
const MAX = 400;
const sinks: Sink[] = [];
let session = '';
let buffer: TrackedEvent[] | null = null;

const rid = () => {
  try { const a = new Uint32Array(2); crypto.getRandomValues(a); return a[0].toString(36) + a[1].toString(36); } catch { return Math.random().toString(36).slice(2); }
};
/** anonymous install id (random, local): lets retention be measured without knowing who plays */
export function installId(): string {
  try { let id = localStorage.getItem(AID); if (!id) { id = rid(); localStorage.setItem(AID, id); } return id; } catch { return 'no-storage'; }
}
const sessionId = () => (session ||= rid());

function readBuffer(): TrackedEvent[] {
  if (buffer) return buffer;
  try { const raw = localStorage.getItem(KEY); buffer = raw ? (JSON.parse(raw) as TrackedEvent[]) : []; if (!Array.isArray(buffer)) buffer = []; } catch { buffer = []; }
  return buffer;
}
let flushTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try { localStorage.setItem(KEY, JSON.stringify(readBuffer().slice(-MAX))); } catch { /* storage full or blocked */ }
  }, 400);
}

/** keys that may never leave the device, whatever a caller passes */
const BLOCKED = /name|token|email|mail|url|link|text|nick/i;
function clean(p?: Props): Props | undefined {
  if (!p) return undefined;
  const out: Props = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || BLOCKED.test(k)) continue;
    out[k] = typeof v === 'string' ? v.slice(0, 40) : v;
  }
  return out;
}

export function track(n: EventName, p?: Props): void {
  try {
    const e: TrackedEvent = { n, t: Date.now(), s: sessionId(), p: clean(p) };
    const b = readBuffer();
    b.push(e);
    if (b.length > MAX * 1.5) buffer = b.slice(-MAX);
    persist();
    for (const s of sinks) { try { s(e); } catch { /* a sink never breaks the game */ } }
  } catch { /* never throws */ }
}
/** The one entry point screens use (alias kept for readability in product specs). */
export const trackEvent = track;
export const registerSink = (s: Sink) => { sinks.push(s); };
export const localEvents = (): TrackedEvent[] => readBuffer().slice();
export function clearEvents() { buffer = []; try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

/** Measure a synchronous step (draft generation, season simulation). */
export function timed<T>(metric: string, fn: () => T): T {
  const t0 = now();
  const out = fn();
  track('perf', { metric, ms: Math.round((now() - t0) * 10) / 10 });
  return out;
}
const now = () => { try { return performance.now(); } catch { return Date.now(); } };

export function trackError(where: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  track('error', { where, kind: err instanceof Error ? err.name : typeof err, msg: msg.replace(/[A-Za-z0-9_-]{30,}/g, '…').slice(0, 40) });
}

/* ----------------------------------------------------------------- funnel */

export const FUNNEL: { id: string; test: (e: TrackedEvent) => boolean }[] = [
  { id: 'home', test: (e) => e.n === 'home_view' },
  { id: 'start', test: (e) => e.n === 'game_started' },
  { id: 'round5', test: (e) => e.n === 'draft_round_viewed' && Number(e.p?.round) === 5 },
  { id: 'round10', test: (e) => e.n === 'draft_round_viewed' && Number(e.p?.round) === 10 },
  { id: 'round15', test: (e) => e.n === 'draft_round_viewed' && Number(e.p?.round) === 15 },
  { id: 'simulation', test: (e) => e.n === 'simulation_started' },
  { id: 'result', test: (e) => e.n === 'season_completed' },
  { id: 'analysis', test: (e) => e.n === 'analysis_opened' },
  { id: 'replay', test: (e) => e.n === 'replay_started' },
  { id: 'challenge', test: (e) => e.n === 'challenge_shared' },
  { id: 'accepted', test: (e) => e.n === 'challenge_accepted' },
  { id: 'dailyViewed', test: (e) => e.n === 'daily_viewed' },
  { id: 'dailyPlayed', test: (e) => e.n === 'daily_completed' },
];
/** Sessions reaching each step (a session counts once per step). */
export function funnel(events: TrackedEvent[]): { id: string; sessions: number }[] {
  return FUNNEL.map((f) => ({ id: f.id, sessions: new Set(events.filter(f.test).map((e) => e.s)).size }));
}

/* ------------------------------------------------------------------ boot */

let booted = false;
export function initAnalytics() {
  if (booted) return;
  booted = true;
  // remote sink, only when a build sets an endpoint
  let url = '';
  try { url = typeof __ANALYTICS_URL__ === 'string' ? __ANALYTICS_URL__ : ''; } catch { url = ''; }
  if (url) {
    const queue: TrackedEvent[] = [];
    const aid = installId();
    const send = () => {
      if (!queue.length) return;
      const body = JSON.stringify({ aid, events: queue.splice(0, queue.length) });
      try { if (!navigator.sendBeacon?.(url, body)) void fetch(url, { method: 'POST', body, keepalive: true }).catch(() => undefined); } catch { /* offline */ }
    };
    registerSink((e) => { queue.push(e); if (queue.length >= 20) send(); });
    try {
      addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(); });
      addEventListener('pagehide', send);
    } catch { /* ignore */ }
  }
  // runtime errors
  try {
    addEventListener('error', (e) => trackError('window', (e as ErrorEvent).error ?? (e as ErrorEvent).message));
    addEventListener('unhandledrejection', (e) => trackError('promise', (e as PromiseRejectionEvent).reason));
  } catch { /* ignore */ }
  // load time and web vitals, vendor-free
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const report = () => { if (nav) track('perf', { metric: 'load', ms: Math.round(nav.loadEventEnd || now()), dcl: Math.round(nav.domContentLoadedEventEnd) }); };
    if (document.readyState === 'complete') setTimeout(report, 0); else addEventListener('load', () => setTimeout(report, 0));
    const po = (type: string, fn: (list: PerformanceObserverEntryList) => void) => {
      try { const o = new PerformanceObserver(fn); o.observe({ type, buffered: true } as PerformanceObserverInit); return o; } catch { return null; }
    };
    let lcp = 0, cls = 0, inp = 0;
    po('largest-contentful-paint', (l) => { const es = l.getEntries(); const last = es[es.length - 1]; if (last) lcp = Math.round(last.startTime); });
    po('layout-shift', (l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) cls += e.value; });
    po('event', (l) => { for (const e of l.getEntries()) inp = Math.max(inp, Math.round(e.duration)); });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') track('perf', { metric: 'vitals', lcp, cls: Math.round(cls * 1000) / 1000, inp });
    }, { once: true });
  } catch { /* old browser */ }
}

/** Whether this build sends events anywhere (false for the artifact and the standalone file). */
export function remoteEnabled(): boolean {
  try { return typeof __ANALYTICS_URL__ === 'string' && __ANALYTICS_URL__.length > 0; } catch { return false; }
}
