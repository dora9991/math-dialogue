/* hibi/js/api.js
   裏側（Apps Script）とのやりとりと、この端末に残すもの。
   ・接続先（URL・合言葉）と、最後に受け取ったデータ（すぐ画面を出すため）は localStorage
   ・サムネイルは IndexedDB（使えなければメモリだけ）
   ・電波がないときに書いたメモは「未送信」としてためておき、つながったら送る
   裏側は POST だけ。本文は JSON の文字列（Content-Type は text/plain のまま。こうすると Apps Script の CORS で止まらない）。 */
(function (root) {
  'use strict';
  const HB = root.HB = root.HB || {};

  const LS = { conn: 'hibi.conn.v1', state: 'hibi.state.v1', queue: 'hibi.queue.v1', ui: 'hibi.ui.v1' };
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { /* noop */ } };

  class ApiError extends Error {
    constructor(code, message, net) { super(message || code); this.code = code; this.net = !!net; }
  }

  const MESSAGES = {
    unauthorized: '合言葉がちがいます（設定の「合言葉」と、裏側の showSetupInfo の合言葉を見くらべてください）',
    not_connected: 'まだ裏側につないでいません（設定から）',
    timeout: '時間がかかりすぎました。電波のよいところで、もう一度',
    network: 'つながりません（電波・URL を確かめてください）',
    bad_response: '裏側の返事が読めません（URL が /exec で終わっているか、デプロイが「全員」になっているか確かめてください）'
  };

  function conn() { return lsGet(LS.conn, null); }
  function setConn(c) { lsSet(LS.conn, { url: String(c.url).trim(), token: String(c.token).trim() }); }
  function clearConn() { lsDel(LS.conn); }

  /** 裏側に1回たのむ */
  async function call(action, payload, opts) {
    opts = opts || {};
    const c = opts.conn || conn();
    if (!c) throw new ApiError('not_connected', MESSAGES.not_connected);
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), opts.timeout || 45000);
    let res;
    try {
      res = await fetch(c.url, { method: 'POST', body: JSON.stringify(Object.assign({ action, token: c.token }, payload || {})), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined });
    } catch (e) {
      throw new ApiError(e && e.name === 'AbortError' ? 'timeout' : 'network', e && e.name === 'AbortError' ? MESSAGES.timeout : MESSAGES.network, true);
    } finally { clearTimeout(timer); }
    const text = await res.text();
    let j = null;
    try { j = JSON.parse(text); } catch (e) { throw new ApiError('bad_response', MESSAGES.bad_response); }
    if (!j || !j.ok) {
      const code = (j && j.error) || 'error';
      throw new ApiError(code, MESSAGES[code] || code);
    }
    return j.data;
  }

  /* ───── 最後に受け取ったデータ ───── */
  function cachedState() { return lsGet(LS.state, null); }
  function saveState(st) { if (!lsSet(LS.state, st)) { lsDel(LS.state); } }
  function clearState() { lsDel(LS.state); }

  /* ───── 未送信（電波がないときに書いたメモ） ───── */
  function queue() { return lsGet(LS.queue, []); }
  function enqueue(action, payload) {
    const key = keyOf(action, payload);
    let q = queue();
    const prev = key ? q.find(x => x.key === key && x.action === 'memo.save') : null;
    if (action === 'memo.save' && prev) {
      prev.payload = { memo: Object.assign({}, prev.payload.memo, payload.memo) };   // 前の変更に重ねる
    } else {
      if (action === 'memo.delete' && key) q = q.filter(x => x.key !== key);       // 消すなら、送っていない変更はいらない
      q.push({ action, payload, key, at: Date.now() });
    }
    lsSet(LS.queue, q);
    return q.length;
  }
  function keyOf(action, payload) { return action === 'memo.save' && payload.memo ? 'memo:' + payload.memo.id : action === 'memo.delete' ? 'memo:' + payload.id : ''; }
  /** ためた分を順に送る。送れたものの結果を返す */
  async function flushQueue(onResult) {
    let q = queue();
    const done = [];
    while (q.length) {
      const x = q[0];
      try {
        const r = await call(x.action, x.payload);
        done.push({ action: x.action, payload: x.payload, result: r });
        if (onResult) onResult(x, r);
      } catch (e) {
        if (e.net) break;                // まだつながらない → 次の機会に
        done.push({ action: x.action, payload: x.payload, error: e });   // 合言葉など、送っても直らないものは捨てる
      }
      q = queue().slice(1);
      lsSet(LS.queue, q);
    }
    return done;
  }

  /* ───── 画面の状態（どのタブ・絞りこみ） ───── */
  function ui() { return lsGet(LS.ui, {}); }
  function saveUi(u) { lsSet(LS.ui, u); }

  /* ───── サムネイル（IndexedDB） ───── */
  const mem = new Map();
  let dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise(resolve => {
      try {
        const req = indexedDB.open('hibi', 1);
        req.onupgradeneeded = () => { req.result.createObjectStore('thumbs'); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  async function thumbGet(id) {
    if (mem.has(id)) return mem.get(id);
    const db = await idb();
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const r = db.transaction('thumbs').objectStore('thumbs').get(id);
        r.onsuccess = () => { if (r.result) mem.set(id, r.result); resolve(r.result || null); };
        r.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  async function thumbSet(id, dataUrl) {
    mem.set(id, dataUrl);
    const db = await idb();
    if (!db) return;
    try { db.transaction('thumbs', 'readwrite').objectStore('thumbs').put(dataUrl, id); } catch (e) { /* 入らなくてもメモリにはある */ }
  }
  async function thumbClear() {
    mem.clear();
    const db = await idb();
    if (!db) return;
    try { db.transaction('thumbs', 'readwrite').objectStore('thumbs').clear(); } catch (e) { /* noop */ }
  }

  HB.api = { ApiError, MESSAGES, conn, setConn, clearConn, call, cachedState, saveState, clearState, queue, enqueue, flushQueue, ui, saveUi, thumbGet, thumbSet, thumbClear };
})(typeof globalThis !== 'undefined' ? globalThis : this);
