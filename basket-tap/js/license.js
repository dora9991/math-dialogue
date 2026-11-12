/* バスケ タップ記録 — 場面パック（購入コード・お試し 3 試合）
   ・クラブが年 3万円で「場面パック」を買うと、購入コードが1つ届く（人数は数えない。クラブの端末なら何台でも使える）
   ・場面パックで使えるのは、場面を見る・動画にする（'trim'）と、シュートの場所（'shot'）。記録・集計・CSV・クラウド・撮影は、ずっと無料
   ・お試し：この端末で、はじめの 3 試合まで無料。パックの機能を最初に使った試合が数えられ、数えた試合は、ずっと使える
     （数えるのは use() を呼んだとき。切り出しは、動画を付けたときに app.js が呼ぶ。画面を開いただけでは数えない）
   ・デモの試合は、いつでも使えて、数えない
   ・スイッチ MODE は、はじめは 'off'（売り始めるまで。off のあいだは、画面にも保存にも何も出ない）
   ・確かめ方の正直なところ：これは端末の中の確認なので、詳しい人なら回避できる。クラブに気持ちよく払ってもらうための仕組みで、コピー防止（DRM）ではない
   ・体育館は電波が弱いので、使う場面でネットを待たない。いちど確かめたコードは、期限まで端末の中の控えで通す（24 時間以上たって、つながっているときだけ、こっそり確かめ直す）
   サーバー側：public.btap_codes と btap_code_check（cloud/license.sql。README の「場面パック」） */
(function (root) {
  'use strict';
  const BT = root.BT || (root.BT = {});
  const MODE = 'off';           // 売り始めるときに 'on' にする
  const CONTACT = '';           // お申し込みの窓口（https:// か mailto:）。空のあいだは、ボタンを出さない
  const URL_ = 'https://mtzhbiadzqjhvhzzdsbn.supabase.co';          // js/cloud.js と同じ
  const ANON = 'sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E';
  const K = { mode: 'btap:licmode', license: 'btap:license', trial: 'btap:trial' };
  const TRIAL_MAX = 3;
  const DAY = 86400000;
  const RECHECK = DAY;          // 確かめ直すのは 24 時間に 1 回まで
  const WARN_DAYS = 30;         // 期限の 30 日前から知らせる
  const CODE_RE = /^[2-9A-HJKMNP-Z]{12}$/;      // まぎらわしい文字（0 O 1 I L）は使わない
  const MSG = {
    format: 'コードの形がちがいます（12 文字。例：ABCD-EFGH-JKMN）。0・1・I・L・O は使いません',
    none: 'このコードは見つかりません。もう一度、確かめてください',
    expired: 'このコードは、期限が切れています',
    revoked: 'このコードは、使えなくなっています。お申し込みの窓口へ',
    net: 'サーバーにつながりませんでした。電波のあるところで、もう一度どうぞ'
  };

  function memStorage() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; }
  function domStorage() { try { return root.localStorage || null; } catch (e) { return null; } }
  const normCode = (s) => String(s || '').toUpperCase().replace(/[\s\-ー－_]/g, '');
  const showCode = (c) => normCode(c).replace(/(.{4})(?=.)/g, '$1-');
  const two = (n) => String(n).padStart(2, '0');
  const ymd = (ms) => { const d = new Date(ms); return `${d.getFullYear()}/${two(d.getMonth() + 1)}/${two(d.getDate())}`; };

  /* env：{ storage, now, fetch, online, mode（MODE の代わり）} をさしかえられる（テスト用） */
  function make(env) {
    env = env || {};
    const store = env.storage || domStorage() || memStorage();
    const now = env.now || (() => Date.now());
    const baseMode = env.mode || MODE;
    const listeners = new Set();
    let checking = false;

    function readJSON(k) { try { const v = store.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
    function writeJSON(k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* いっぱい */ } }
    function remove(k) { try { store.removeItem(k); } catch (e) { /* 無視 */ } }
    function emit() { listeners.forEach((fn) => { try { fn(); } catch (e) { /* 無視 */ } }); }
    const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

    /* ---------- スイッチ ---------- */
    function mode() {
      let v = null;
      try { v = store.getItem(K.mode); } catch (e) { v = null; }
      return v === 'on' || v === 'off' ? v : baseMode;
    }
    const enabled = () => mode() === 'on';
    /* ?lic=on / ?lic=off（見せるとき・テスト用）。off は印を外して、MODE にもどす。変えたら true */
    function applySearch(search) {
      const m = /[?&]lic=(on|off)\b/.exec(search || '');
      if (!m) return false;
      if (m[1] === 'on') { try { store.setItem(K.mode, 'on'); } catch (e) { /* 無視 */ } } else remove(K.mode);
      emit();
      return true;
    }

    /* ---------- 控え ---------- */
    function license() {
      const l = readJSON(K.license);
      return l && typeof l === 'object' && l.code && Number.isFinite(l.expiresAt) ? l : null;
    }
    function trial() {
      const t = readJSON(K.trial);
      return Array.isArray(t) ? t.filter((x) => x && x.id).slice(0, TRIAL_MAX) : [];
    }
    const valid = (l) => !!(l && !l.revoked && l.expiresAt > now());

    function status() {
      const l = license(), t = trial(), n = now();
      const licensed = valid(l);
      return {
        mode: mode(), licensed, club: l ? l.club || '' : '', expiresAt: l ? l.expiresAt : 0,
        expired: !!(l && !l.revoked && l.expiresAt <= n), revoked: !!(l && l.revoked),
        daysLeft: licensed ? Math.max(0, Math.ceil((l.expiresAt - n) / DAY)) : 0,
        trialUsed: t.length, trialLeft: Math.max(0, TRIAL_MAX - t.length), trialGames: t
      };
    }

    /* ---------- 使えるか ---------- */
    const isDemo = (g) => !!((g && g.demo) || (BT.app && BT.app.S && BT.app.S.demoMode));
    function label(g) {
      const nm = (i) => (typeof BT.teamName === 'function' && g.teams ? BT.teamName(g, i) : '');
      return [g.date || '', [nm(0), nm(1)].filter(Boolean).join(' vs ')].filter(Boolean).join(' ') || '試合';
    }
    function decide(game, commit) {
      if (!enabled()) return true;
      if (isDemo(game)) return true;
      if (valid(license())) return true;
      const t = trial();
      if (game && game.id && t.some((x) => x.id === game.id)) return true;
      if (t.length >= TRIAL_MAX) return false;
      if (!commit) return true;
      if (!game || !game.id) return false;
      t.push({ id: game.id, at: now(), name: label(game) });
      writeJSON(K.trial, t);
      emit();
      return true;
    }
    /* feature：'trim'・'shot'（いまは、どの機能も同じ場面パック） */
    const can = (feature, game) => decide(game, false);
    const use = (feature, game) => decide(game, true);

    /* ---------- 購入コード ---------- */
    async function rpc(code) {
      const f = env.fetch || (typeof root.fetch === 'function' ? root.fetch.bind(root) : null);
      if (!f) throw new Error('offline');
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, 12000);
      try {
        const r = await f(`${URL_}/rest/v1/rpc/btap_code_check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON },
          body: JSON.stringify({ p_code: code }),
          signal: ctrl ? ctrl.signal : undefined
        });
        if (!r.ok) throw new Error('http ' + r.status);
        return await r.json();
      } finally { clearTimeout(timer); }
    }
    /* → { ok: true, club, expiresAt } か { ok: false, error: 'format'|'none'|'expired'|'revoked'|'net', message } */
    async function enter(input) {
      const code = normCode(input);
      const fail = (error) => ({ ok: false, error, message: MSG[error] || MSG.net });
      if (!CODE_RE.test(code)) return fail('format');
      let j;
      try { j = await rpc(code); } catch (e) { return fail('net'); }
      if (!j || typeof j !== 'object') return fail('net');
      if (j.ok !== true) return fail(MSG[j.error] && j.error !== 'net' ? j.error : 'none');
      const exp = Date.parse(j.expires_at);
      if (!Number.isFinite(exp)) return fail('net');
      if (exp <= now()) return fail('expired');
      writeJSON(K.license, { code, club: String(j.club || ''), plan: String(j.plan || 'scene'), expiresAt: exp, checkedAt: now() });
      emit();
      return { ok: true, club: String(j.club || ''), expiresAt: exp };
    }
    /* 24 時間に 1 回、つながっているときだけ、こっそり確かめ直す。つながらないときは、控えのまま */
    async function refresh() {
      const l = license();
      if (!l || l.revoked || checking) return status();
      if (now() - (l.checkedAt || 0) < RECHECK) return status();
      if (env.online ? !env.online() : (root.navigator && root.navigator.onLine === false)) return status();
      checking = true;
      try {
        let j = null;
        try { j = await rpc(l.code); } catch (e) { return status(); }
        if (!j || typeof j !== 'object') return status();
        const cur = license();
        if (!cur || cur.code !== l.code) return status();      // 確かめているあいだに、コードが変わった
        if (j.ok === true) {
          const exp = Date.parse(j.expires_at);
          if (Number.isFinite(exp)) writeJSON(K.license, Object.assign({}, cur, { club: String(j.club || cur.club), expiresAt: exp, checkedAt: now(), revoked: false }));
        } else if (j.error === 'revoked' || j.error === 'none') {
          writeJSON(K.license, Object.assign({}, cur, { revoked: true, expiresAt: Math.min(cur.expiresAt, now()), checkedAt: now() }));
        } else if (j.error === 'expired') {
          writeJSON(K.license, Object.assign({}, cur, { expiresAt: Math.min(cur.expiresAt, now()), checkedAt: now() }));
        }
        emit();
        return status();
      } finally { checking = false; }
    }
    function clear() { remove(K.license); emit(); }

    return { MODE, CONTACT, TRIAL_MAX, MSG, isDemo, mode, enabled, applySearch, status, can, use, enter, refresh, clear, on, normCode, showCode, ymd, KEYS: K };
  }

  const lic = make();
  lic.make = make;
  BT.license = lic;

  /* ---------- 画面（ブラウザのときだけ。スイッチが off のあいだは、何も出さない） ---------- */
  const ui = {};
  lic.ui = ui;
  const hh = (...a) => BT.ui.h(...a);

  /* 期限のひとこと（なければ ''） */
  function expiryNote(s) {
    if (s.revoked) return 'このコードは、使えなくなっています';
    if (s.expired) return '期限が切れました';
    if (s.licensed && s.daysLeft <= WARN_DAYS) return `あと ${s.daysLeft} 日で期限です`;
    return '';
  }
  ui.expiryNote = expiryNote;
  const clubLine = (s) => `${s.club ? s.club + '・' : ''}${ymd(s.expiresAt)} まで`;

  /* 試合のページ：切り出しボタンの下の小さな一行 */
  ui.line = function (game) {
    if (!lic.enabled() || lic.isDemo(game)) return null;
    const el = hh('p', { class: 'lic-line', id: 'licLine' });
    const draw = () => {
      const s = lic.status();
      let txt, cls = '';
      if (s.licensed) { txt = `🔑 場面パック：${clubLine(s)}`; const w = expiryNote(s); if (w) { txt += `（${w}）`; cls = ' warn'; } }
      else {
        const counted = s.trialGames.some((x) => x.id === game.id);
        const w = s.expired || s.revoked ? expiryNote(s) + '。' : '';
        if (counted) txt = w + 'お試し中の試合です';
        else if (s.trialLeft > 0) txt = w + `お試し：あと ${s.trialLeft} 試合`;
        else { txt = w + '🔒 場面パックが必要です'; cls = ' warn'; }
      }
      el.className = 'lic-line' + cls;
      el.textContent = txt;
    };
    draw();
    const off = lic.on(() => { if (!document.contains(el)) { if (el.dataset.seen) off(); return; } el.dataset.seen = '1'; draw(); });
    setTimeout(() => { if (document.contains(el)) el.dataset.seen = '1'; }, 0);
    return el;
  };

  /* 購入コードを入れる小窓。onDone：使えるようになったあと（ここから来たときは、続きへ） */
  ui.codeSheet = function (onDone, onCancel) {
    const inp = hh('input', { type: 'text', id: 'licCode', class: 'lic-input', placeholder: 'XXXX-XXXX-XXXX', autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', inputmode: 'text', maxlength: '14', 'aria-label': '購入コード' });
    const msg = hh('p', { class: 'lic-msg', id: 'licMsg', role: 'alert' });
    const go = hh('button', { class: 'btn primary', id: 'licCheck' }, '確かめる');
    let busy = false, done = false;
    inp.addEventListener('input', () => {
      const c = normCode(inp.value).replace(/[^2-9A-HJKMNP-Z]/g, '').slice(0, 12);
      inp.value = showCode(c);
      msg.textContent = '';
    });
    const submit = async () => {
      if (busy) return;
      busy = true; go.disabled = true; inp.disabled = true;
      go.textContent = '確かめています…'; msg.className = 'lic-msg'; msg.textContent = '';
      const r = await lic.enter(inp.value);
      busy = false; go.disabled = false; inp.disabled = false; go.textContent = '確かめる';
      if (!r.ok) { msg.className = 'lic-msg bad'; msg.textContent = r.message; inp.focus(); return; }
      done = true;
      s.close();
      BT.ui.toast(`場面パックが使えるようになりました（${r.club ? r.club + '・' : ''}${ymd(r.expiresAt)} まで）`, 'ok', 5000);
      if (onDone) onDone();
    };
    go.addEventListener('click', submit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    const s = BT.ui.sheet({
      title: '🔑 購入コードを入れる', cls: 'lic-sheet',
      body: hh('div', { class: 'lic-body' },
        hh('p', null, 'お申し込みのあとにお渡しした、12 文字のコードを入れてください。クラブの端末なら、何台でも同じコードで使えます。'),
        inp, msg,
        hh('p', { class: 'note' }, '大文字・小文字、「-」は、どちらでも大丈夫です。')),
      foot: [hh('button', { class: 'btn', id: 'licCodeClose', onclick: () => s.close() }, 'やめる'), go],
      onClose: (silent) => { if (!silent && !done && onCancel) onCancel(); }
    });
    setTimeout(() => { try { inp.focus(); } catch (e) { /* 無視 */ } }, 50);
    return s;
  };

  /* 申し込みボタン（窓口が決まっていないときは、案内の文だけ） */
  function contactEl() {
    const c = lic.CONTACT;
    if (!c) return hh('p', { class: 'note', id: 'licApplyNote' }, 'お申し込みは、ご案内した窓口へ');
    return hh('a', { class: 'btn', id: 'licApply', href: c, target: '_blank', rel: 'noopener' }, '✉ お申し込み・お問い合わせ');
  }

  /* 場面パックが必要なとき。onDone：コードが通ったあとの続き（切り出しを開く） */
  ui.paywall = function (game, onDone) {
    const s0 = lic.status();
    const games = s0.trialGames;
    const s = BT.ui.sheet({
      title: '場面パック（クラブで 年 3万円）', cls: 'lic-sheet paywall',
      body: hh('div', { class: 'lic-body' },
        s0.expired || s0.revoked ? hh('p', { class: 'lic-msg bad' }, expiryNote(s0) + '。続けるには、新しいコードを入れてください') : null,
        hh('ul', { class: 'lic-list' },
          hh('li', null, '🎬 記録した場面を、選手ごと・プレーごとに見られます'),
          hh('li', null, '🎞 場面をつなげて、1本の動画にできます'),
          hh('li', null, '📍 シュートの場所を記録して、場所ごとの数を見られます')),
        hh('p', { class: 'lic-used' }, 'お試しの 3 試合を使いました'),
        hh('ol', { class: 'lic-games', id: 'licGames' }, games.map((x) => hh('li', null, x.name || '試合'))),
        hh('p', { class: 'note lic-free' }, '記録・集計・CSV の書き出し・クラウド・撮影は、これからもずっと無料です。人数はかぞえません（クラブで 1 つのコード）。'),
        contactEl()),
      foot: [hh('button', { class: 'btn', id: 'licClose', onclick: () => s.close() }, 'とじる'),
        hh('button', { class: 'btn primary', id: 'licEnter', onclick: () => ui.codeSheet(onDone) }, '🔑 購入コードを入れる')]
    });
    return s;
  };

  /* 設定の一つ。reopen：コードを入れた・外したあとに、設定を開き直す */
  ui.settings = function (reopen) {
    const s = lic.status();
    const note = expiryNote(s);
    const body = [hh('span', null, '🔑 場面パック')];
    if (s.licensed) body.push(hh('p', { class: 'lic-stat', id: 'licStat' }, `使えます：${clubLine(s)}`));
    else body.push(hh('p', { class: 'lic-stat', id: 'licStat' }, s.trialLeft > 0 ? `お試し：あと ${s.trialLeft} 試合（使った試合 ${s.trialUsed} / ${lic.TRIAL_MAX}）` : 'お試しの 3 試合を使いました'));
    if (note) body.push(hh('p', { class: 'lic-msg ' + (s.licensed && !s.expired ? 'warnc' : 'bad'), id: 'licNote' }, note));
    body.push(hh('p', { class: 'note' }, '記録・集計・CSV・クラウド・撮影は、ずっと無料です。場面を見る・動画にする機能と、シュートの場所が、場面パックです（クラブで 年 3万円）。'));
    const row = [hh('button', { class: 'btn small', id: 'licSetEnter', onclick: () => ui.codeSheet(reopen, reopen) }, '🔑 購入コードを入れる')];
    if (s.club || s.licensed || s.expired || s.revoked) row.push(hh('button', { class: 'btn small', id: 'licSetClear', onclick: () => BT.ui.confirm('コードを外しますか？', 'この端末で場面パックが使えなくなります。コードは、あとでまた入れられます。', '外す', () => { lic.clear(); if (reopen) reopen(); }, true) }, 'コードを外す'));
    body.push(hh('div', { class: 'row' }, row));
    if (!s.licensed) body.push(contactEl());
    return hh('section', { class: 'field', id: 'setLicense' }, body);
  };

  /* ---------- はじめ：?lic=on・off と、こっそり確かめ直し ---------- */
  if (typeof location !== 'undefined' && root.document) {
    try {
      if (lic.applySearch(location.search)) {
        const q = location.search.replace(/([?&])lic=(on|off)\b&?/, '$1').replace(/[?&]$/, '');
        history.replaceState(null, '', location.pathname + q + location.hash);
      }
    } catch (e) { /* 無視 */ }
    if (lic.enabled()) setTimeout(() => { lic.refresh().catch(() => {}); }, 3000);
  }
})(typeof window !== 'undefined' ? window : globalThis);
