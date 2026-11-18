/* バスケ タップ記録 — クラウドに残す（Supabase）
   試合の記録を、この端末（ブラウザの中）と、クラウドの両方に残す。
   ・ログインはない。端末ごとに「合言葉」（16 文字）を作り、それで読み書きする（サーバーには合言葉のハッシュだけが残る）
   ・ほかの端末で同じ合言葉を入れると、同じ記録が見える（試合はスマホで記録して、パソコンで動画から切り出す など）
   ・電波がなくても記録は止めない。送れなかった試合は「送る待ち」に残し、次に開いたとき・つながったときに送る
   ・記録の途中は、数秒ごとにまとめて送る（1つ押すたびには送らない）。試合を終えたときは、すぐ送る
   サーバー側：public.btap_games と btap_put・btap_list・btap_get・btap_del（Supabase の math-labo-second。README の「クラウド」） */
(function (root) {
  'use strict';
  const BT = root.BT;
  const URL_ = 'https://mtzhbiadzqjhvhzzdsbn.supabase.co';
  const ANON = 'sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E';
  const K = { key: 'btap:cloudkey', queue: 'btap:cloudq', done: 'btap:cloudok' };
  const ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';      // まぎらわしい文字（0 O 1 I L）は使わない
  const LIVE_GAP = 8000;     // 記録の途中は、8 秒に1回まで

  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  function readJSON(k) { const s = ls(); if (!s) return null; try { const v = s.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { const s = ls(); if (!s) return; try { s.setItem(k, JSON.stringify(v)); } catch (e) { /* いっぱい */ } }

  const listeners = new Set();
  const state = { busy: false, lastError: null, timer: 0, online: true };
  function emit() { listeners.forEach((fn) => { try { fn(); } catch (e) { /* 無視 */ } }); }

  /* ---------- 合言葉 ---------- */
  function newKey() {
    const a = new Uint8Array(16);
    try { root.crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
    return Array.from(a, (b) => ABC[b % ABC.length]).join('');
  }
  /* 入れられた合言葉をそろえる（小文字・空白・「-」を許す）。使えなければ null */
  function normKey(s) {
    const k = String(s || '').toUpperCase().replace(/[\s\-ー－_]/g, '');
    return /^[2-9A-HJKMNP-Z]{16}$/.test(k) ? k : null;
  }
  function key() {
    const s = ls();
    let k = null;
    try { k = s ? s.getItem(K.key) : null; } catch (e) { k = null; }
    if (!normKey(k)) { k = newKey(); try { if (s) s.setItem(K.key, k); } catch (e) { /* 無視 */ } }
    return k;
  }
  const showKey = (k) => (k || key()).replace(/(.{4})(?=.)/g, '$1-');
  /* ほかの端末の合言葉に切りかえる（この端末の記録は、そのまま残る。新しい合言葉の側にも送る） */
  function setKey(input) {
    const k = normKey(input);
    if (!k) return false;
    const s = ls();
    try { if (s) s.setItem(K.key, k); } catch (e) { return false; }
    // この端末の試合を、新しい合言葉の側にも送る
    writeJSON(K.done, {});
    const q = {};
    BT.store.games().forEach((g) => { q[g.id] = Date.now(); });
    writeJSON(K.queue, q);
    emit();
    flush();
    return true;
  }

  /* ---------- 通信（Supabase の RPC） ---------- */
  async function rpc(name, args) {
    if (typeof fetch !== 'function') throw new Error('offline');
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, 15000);
    try {
      const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON },
        body: JSON.stringify(args),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (j && j.error) throw new Error(j.error);
      state.online = true;
      return j;
    } catch (e) {
      state.online = false;
      throw e;
    } finally { clearTimeout(timer); }
  }

  /* ---------- 送る ---------- */
  const enabled = () => BT.store.prefs().cloud !== false && typeof fetch === 'function';
  const queue = () => readJSON(K.queue) || {};
  const done = () => readJSON(K.done) || {};
  const isDemo = (g) => !!(g && g.demo);
  /* 試合が変わったら呼ぶ。now：すぐ送る（試合を終えた・閉じる前など）。ふだんは数秒まとめて */
  function push(game, now) {
    if (!game || !game.id || isDemo(game)) return;
    const q = queue();
    q[game.id] = game.updatedAt || Date.now();
    writeJSON(K.queue, q);
    emit();
    if (!enabled()) return;
    clearTimeout(state.timer);
    const live = game.startedAt && !game.endedAt;
    state.timer = setTimeout(flush, now ? 0 : live ? LIVE_GAP : 1500);
  }
  async function flush() {
    clearTimeout(state.timer);
    if (!enabled() || state.busy) return;
    const q = queue();
    const ids = Object.keys(q);
    if (!ids.length) return;
    state.busy = true;
    emit();
    let failed = false;
    for (const id of ids) {
      const g = BT.store.loadGame(id);
      const at = q[id];
      if (!g || isDemo(g)) { const q2 = queue(); delete q2[id]; writeJSON(K.queue, q2); continue; }
      try {
        const sum = BT.summary(g);
        await rpc('btap_put', { p_key: key(), p_id: id, p_data: g, p_summary: sum, p_at: Math.round(g.updatedAt || at || Date.now()) });
        const q2 = queue();
        if (q2[id] === at) delete q2[id];          // （送っている間に、また変わったものは残す）
        writeJSON(K.queue, q2);
        const d = done(); d[id] = Date.now(); writeJSON(K.done, d);
        state.lastError = null;
      } catch (e) {
        state.lastError = String(e && e.message || e);
        failed = true;
        break;
      }
    }
    state.busy = false;
    emit();
    // 送れなかったら、少しあとでもう一度（記録は、この端末には残っている）
    if (failed) { clearTimeout(state.timer); state.timer = setTimeout(flush, 30000); }
    else if (Object.keys(queue()).length) { clearTimeout(state.timer); state.timer = setTimeout(flush, 500); }
  }
  /* その試合の、クラウドの状態：'off'（クラウドを使わない）| 'demo' | 'wait'（送る待ち）| 'ok'（送った） */
  function status(id) {
    if (!enabled()) return { s: 'off' };
    if (queue()[id]) return { s: 'wait', err: state.lastError, busy: state.busy };
    const at = done()[id];
    return at ? { s: 'ok', at } : { s: 'wait' };
  }
  const pending = () => Object.keys(queue()).length;

  /* ---------- 読む ---------- */
  async function list() {
    const j = await rpc('btap_list', { p_key: key() });
    return (j && j.games) || [];
  }
  async function get(id) {
    const j = await rpc('btap_get', { p_key: key(), p_id: id });
    const g = j && j.data;
    if (!g || g.format !== BT.FORMAT || !Array.isArray(g.events) || !Array.isArray(g.teams)) return null;
    return g;
  }
  async function del(id) {
    const q = queue(); delete q[id]; writeJSON(K.queue, q);
    const d = done(); delete d[id]; writeJSON(K.done, d);
    if (!enabled()) return;
    try { await rpc('btap_del', { p_key: key(), p_id: id }); } catch (e) { /* 消せなくても、この端末からは消えている */ }
  }

  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  if (root.addEventListener) {
    root.addEventListener('online', () => flush());
    // 画面を閉じる・ほかのアプリに切りかえるときに、送り残しを送る
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  }

  BT.cloud = { key, showKey, setKey, normKey, newKey, push, flush, status, pending, list, get, del, on, enabled, state, KEYS: K };
})(typeof window !== 'undefined' ? window : globalThis);
