// Emulates `window.claude.use('room')` (presence arm) for Playwright runs.
// Strict on purpose: it rejects what the real capability rejects (non-JSON values such as `undefined`,
// bad keys, strings over 1 KiB, nesting over 8, merged presence over 4 KiB), and records each rejection in
// window.__roomErrors so the test can fail on it. Presence is relayed between browser contexts by the
// test runner through the `__roomSend` binding and delivered back with `__roomRecv`.
(() => {
  const PEER = Math.random().toString(36).slice(2, 12);
  const KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
  const enc = new TextEncoder();
  const table = new Map();
  let mine = {};
  let snap = Object.freeze([]);
  const peerH = new Set();
  const connH = new Set();
  window.__roomErrors = [];
  const mk = (peer, presence, updatedAt) => Object.freeze({ peer, by: null, isMe: peer === PEER, sameTab: peer === PEER, kind: 'viewer', guest: false, presence, updatedAt });
  const rebuild = () => { snap = Object.freeze([...table.entries()].map(([p, v]) => mk(p, v.presence, v.updatedAt))); };
  let queued = false;
  const notify = () => {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; const c = { peers: snap, joined: [], left: [], updated: [] }; peerH.forEach((h) => h(c)); }, 16);
  };
  const put = (peer, presence) => {
    if (presence === null) table.delete(peer);
    else table.set(peer, { presence: Object.freeze(presence), updatedAt: Date.now() });
    rebuild(); notify();
  };
  window.__roomRecv = (peer, json) => put(peer, json === null ? null : JSON.parse(json));
  const check = (v, depth, path) => {
    if (depth > 8) throw new Error(`too deep at ${path}`);
    if (v === undefined) throw new Error(`undefined at ${path}`);
    if (typeof v === 'function' || typeof v === 'symbol' || typeof v === 'bigint') throw new Error(`non-JSON at ${path}`);
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`non-finite at ${path}`);
    if (typeof v === 'string' && enc.encode(v).length > 1024) throw new Error(`string over 1 KiB at ${path}`);
    if (Array.isArray(v)) v.forEach((x, i) => check(x === undefined ? undefined : x, depth + 1, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (!KEY_RE.test(k)) throw new Error(`bad key ${path}.${k}`); check(v[k], depth + 1, `${path}.${k}`); }
  };
  const ns = {
    presence(patch) {
      try {
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('patch is not an object');
        const next = { ...mine };
        for (const k of Object.keys(patch)) {
          if (!KEY_RE.test(k)) throw new Error(`bad key ${k}`);
          const v = patch[k];
          if (v === null) delete next[k];
          else { check(v, 1, k); next[k] = v; }
        }
        const json = JSON.stringify(next);
        if (enc.encode(json).length > 4096) throw new Error(`presence ${enc.encode(json).length} bytes > 4096`);
        mine = JSON.parse(json);
        put(PEER, mine);
        window.__roomMaxBytes = Math.max(window.__roomMaxBytes || 0, enc.encode(json).length);
        if (window.__roomSend) window.__roomSend(PEER, json);
        return Promise.resolve();
      } catch (e) {
        window.__roomErrors.push(String(e && e.message));
        return Promise.reject({ code: 'invalid_argument', message: String(e && e.message) });
      }
    },
    peers: () => snap,
    onPeers(h) { peerH.add(h); queueMicrotask(() => h({ peers: snap, joined: snap, left: [], updated: [] })); return () => peerH.delete(h); },
    connected: () => true,
    onConnection(h) { connH.add(h); queueMicrotask(() => h(true)); return () => connH.delete(h); },
    emit: () => Promise.reject({ code: 'not_permitted', message: 'event topics are admin-only' }),
    on: () => () => {},
  };
  window.claude = { use: (n) => new Promise((res) => setTimeout(() => res(n === 'room' ? ns : null), 60)) };
})();
