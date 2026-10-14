/* みせびらき — 迷わないための案内（画面の部分）
   ・Guide.tour(steps, opts)  … 画面の要素を順に光らせて説明する（各ツールのツアー・3分デモ）
   ・Guide.runTask(task|id)   … その画面へ行き、押す場所を光らせる（「やりたいこと」を選んだとき）
   ・Guide.openHelp(appId)    … 右から出る「使い方」パネル
   ・Guide.openSearch(q)      … やりたいことから探す
   ・Guide.demo()             … 3分デモ。保存しない試し箱（Kit.store.sandbox）の中で動く
   入口：メニューの「やりたいことを探す」「このページの使い方」、スマホ上部の2つのボタン、キーの / と ? */
(function () {
  'use strict';
  const { h } = Kit;
  const G = window.Guide;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.innerWidth < 640;

  Kit.css('guide', `
    .gd-side-tools { padding: 18px 14px 0; }
    .gd-search-btn { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 38px; padding: 7px 10px; border: 1px solid var(--line-strong); border-radius: 9px; background: var(--surface); color: var(--ink-3); font: inherit; font-size: 13.5px; cursor: pointer; text-align: left; }
    .gd-search-btn:hover { border-color: var(--gosu); color: var(--ink-2); }
    .gd-search-btn svg { width: 16px; height: 16px; flex: none; }
    .gd-search-btn span { flex: 1; min-width: 0; }
    .gd-search-btn kbd { font-size: 11px; }
    .gd-help-btn { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 0; border: 0; background: transparent; color: var(--gosu); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; text-align: left; }
    .gd-help-btn svg { width: 16px; height: 16px; }
    .gd-help-btn:hover { text-decoration: underline; }
    .mb-top .gd-top-btn { flex: none; color: var(--on-noren); background: transparent; border: 0; width: 38px; height: 38px; border-radius: 8px; display: grid; place-items: center; cursor: pointer; }
    .mb-top .gd-top-btn:hover { background: rgba(255, 255, 255, .12); }
    .mb-top .gd-top-btn svg { width: 20px; height: 20px; }
    .mb-top .gd-top-btns { display: flex; gap: 2px; margin-right: -6px; }

    /* 光らせる */
    .gd-layer { position: fixed; inset: 0; z-index: 150; pointer-events: none; }
    .gd-spot { position: fixed; border-radius: 10px; pointer-events: none; box-shadow: 0 0 0 3px var(--shu), 0 0 0 9999px rgba(8, 13, 26, .58); transition: top .25s ease, left .25s ease, width .25s ease, height .25s ease; }
    .gd-layer.is-tip .gd-spot { box-shadow: 0 0 0 3px var(--shu), 0 0 0 9999px rgba(8, 13, 26, .38); }
    .gd-layer.no-target .gd-spot { box-shadow: 0 0 0 9999px rgba(8, 13, 26, .58); }
    .gd-block { position: fixed; pointer-events: auto; background: transparent; }
    .gd-card { position: fixed; pointer-events: auto; width: min(370px, calc(100vw - 24px)); background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow-2); padding: 14px 16px 12px; display: grid; gap: 8px; transition: top .2s ease, left .2s ease; }
    .gd-card:focus { outline: none; }
    .gd-card-top { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-3); }
    .gd-card-top .chip { font-size: 11px; }
    .gd-card-top .gd-x { margin-left: auto; }
    .gd-card h3 { font-size: 16.5px; font-weight: 700; line-height: 1.45; }
    .gd-card p { font-size: 14px; color: var(--ink-2); line-height: 1.7; }
    .gd-card .btn-row { justify-content: flex-end; margin-top: 2px; }
    .gd-dots { display: flex; gap: 4px; margin-right: auto; }
    .gd-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line-strong); }
    .gd-dots i.on { background: var(--shu); }
    .gd-card.is-dock { left: 12px !important; right: 12px; width: auto; }

    /* 使い方パネル */
    .gd-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 95; width: min(430px, 100vw); background: var(--surface); border-left: 1px solid var(--line); box-shadow: var(--shadow-2); overflow-y: auto; overscroll-behavior: contain; padding: 0 0 calc(24px + env(safe-area-inset-bottom, 0px)); animation: gd-in .2s ease-out; }
    @keyframes gd-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
    .gd-panel-h { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: calc(12px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 10px 18px; background: var(--surface); border-bottom: 1px solid var(--line); }
    .gd-panel-h h2 { font-family: var(--font-display); font-size: 19px; font-weight: 800; flex: 1; min-width: 0; }
    .gd-panel-b { padding: 14px max(18px, env(safe-area-inset-right, 0px)) 0 18px; display: grid; gap: 18px; }
    .gd-lead { font-size: 14.5px; color: var(--ink); }
    .gd-sec h3 { font-size: 12px; letter-spacing: .14em; color: var(--ink-3); font-weight: 700; margin-bottom: 8px; }
    .gd-can { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: 14px; color: var(--ink-2); }
    .gd-first { display: grid; gap: 8px; }
    .gd-first-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); text-align: left; font: inherit; color: inherit; cursor: pointer; width: 100%; }
    .gd-first-item:hover { border-color: var(--gosu); }
    .gd-first-item .n { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--gosu); color: var(--on-gosu); font-size: 12.5px; font-weight: 700; }
    .gd-first-item .t { font-size: 14px; font-weight: 500; }
    .gd-first-item svg { width: 16px; height: 16px; color: var(--ink-3); }
    .gd-faq details { border-bottom: 1px solid var(--line); padding: 9px 0; }
    .gd-faq summary { cursor: pointer; font-weight: 500; font-size: 14px; list-style: none; display: flex; gap: 8px; }
    .gd-faq summary::-webkit-details-marker { display: none; }
    .gd-faq summary::before { content: "Q"; font-weight: 800; color: var(--gosu); flex: none; }
    .gd-faq details p { font-size: 13.5px; color: var(--ink-2); margin-top: 6px; padding-left: 1.2em; }
    .gd-related { display: flex; flex-wrap: wrap; gap: 6px; }
    .gd-mini-results { display: grid; gap: 4px; margin-top: 8px; }
    .gd-ask { display: grid; gap: 8px; }
    .gd-ask-out { font-size: 14px; color: var(--ink-2); white-space: pre-wrap; }

    /* やりたいことから探す */
    .gd-pal-back { position: fixed; inset: 0; z-index: 130; background: var(--scrim); display: flex; justify-content: center; align-items: flex-start; padding: max(10vh, calc(16px + env(safe-area-inset-top, 0px))) max(12px, env(safe-area-inset-right, 0px)) 16px max(12px, env(safe-area-inset-left, 0px)); animation: mb-fade .12s ease-out; }
    .gd-pal { width: min(640px, 100%); max-height: min(78vh, 640px); display: flex; flex-direction: column; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow-2); overflow: hidden; }
    .gd-pal-in { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
    .gd-pal-in svg { width: 20px; height: 20px; color: var(--ink-3); flex: none; }
    .gd-pal-in input { border: 0; outline: none; font-size: 17px; padding: 6px 0; background: transparent; min-height: 0; }
    .gd-pal-in input:focus { outline: none; }
    .gd-pal-list { overflow-y: auto; padding: 6px; }
    .gd-pal-h { font-size: 11.5px; letter-spacing: .14em; color: var(--ink-3); font-weight: 700; padding: 10px 10px 4px; }
    .gd-pal-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; width: 100%; padding: 9px 10px; border: 0; border-radius: 9px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .gd-pal-item[aria-selected="true"], .gd-pal-item:hover { background: var(--gosu-wash); }
    .gd-pal-item .ic { grid-row: span 2; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: var(--surface-2); color: var(--gosu); }
    .gd-pal-item .ic svg { width: 16px; height: 16px; }
    .gd-pal-item .t { font-size: 14.5px; font-weight: 500; min-width: 0; }
    .gd-pal-item .s { grid-column: 2; font-size: 12.5px; color: var(--ink-3); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .gd-pal-item .chip { grid-row: span 2; }
    .gd-pal-foot { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; padding: 9px 14px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-3); }
    .gd-pal-foot .btn { margin-left: auto; }
    .gd-pal-empty { padding: 18px 12px; font-size: 14px; color: var(--ink-2); display: grid; gap: 10px; }
    @media (max-width: 640px) { .gd-pal-item .chip { display: none; } .gd-pal-foot .gd-keys { display: none; } }
  `);

  /* ───────── 光らせる（ツアー） ───────── */
  let tour = null; // いま動いているツアー

  function visibleMatch(sel) {
    if (!sel) return null;
    let list;
    try { list = document.querySelectorAll(sel); } catch (e) { console.warn('案内：セレクタが正しくありません', sel); return null; }
    for (const el of list) {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && getComputedStyle(el).visibility !== 'hidden') return el;
    }
    return null;
  }
  async function findTarget(sel, timeout = 2600) {
    const t0 = performance.now();
    for (;;) {
      const el = visibleMatch(sel);
      if (el || performance.now() - t0 > timeout) return el;
      await sleep(120);
    }
  }
  const val = (v, ctx) => (typeof v === 'function' ? v(ctx) : v);

  // steps: [{ app, params, target, targetPhone, skipOnPhone, title, body, before(ctx) }]
  // opts: { tip: 1つだけの「ここです」表示, label: 上に出す札, onEnd(), nextLabel, doneLabel }
  G.tour = (steps, opts = {}) => {
    endTour(true);
    const list = steps.filter((s) => !(narrow() && s.skipOnPhone));
    if (!list.length) return Promise.resolve();
    return new Promise((resolve) => {
      const layer = h('div', { class: 'gd-layer' + (opts.tip ? ' is-tip' : ''), 'aria-hidden': 'false' });
      const spot = h('div', { class: 'gd-spot' });
      const blocks = opts.tip ? [] : [0, 1, 2, 3].map(() => h('div', { class: 'gd-block', onclick: () => card.focus() }));
      const card = h('div', { class: 'gd-card', role: 'dialog', 'aria-live': 'polite', tabindex: -1 });
      layer.append(spot, ...blocks, card);
      document.body.append(layer);
      const prevFocus = document.activeElement;
      const ctx = {};
      const t = (tour = { idx: -1, seq: 0, el: null, layer, spot, blocks, card, list, opts, ctx, resolve, prevFocus, raf: 0, done: false });
      const onMove = () => { cancelAnimationFrame(t.raf); t.raf = requestAnimationFrame(() => place(t)); };
      const onKey = (e) => {
        if (t.done) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(); }
        else if (!opts.tip && (e.key === 'ArrowRight' || (e.key === 'Enter' && document.activeElement === card))) { e.preventDefault(); go(t, t.idx + 1); }
        else if (!opts.tip && e.key === 'ArrowLeft' && t.idx > 0) { e.preventDefault(); go(t, t.idx - 1); }
      };
      // 1つだけの表示は、どこかを押したら消える（押した先の操作はそのまま効く）
      const onDown = (e) => { if (opts.tip && !card.contains(e.target)) setTimeout(() => endTour(), 0); };
      window.addEventListener('resize', onMove);
      window.addEventListener('scroll', onMove, true);
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('pointerdown', onDown, true);
      t.cleanup = () => { window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); cancelAnimationFrame(t.raf); };
      go(t, 0);
    });
  };

  async function go(t, i) {
    if (t.done) return;
    if (i >= t.list.length) { endTour(); return; }
    if (i < 0) return;
    const seq = ++t.seq;
    t.idx = i;
    const st = t.list[i];
    renderCard(t, st, true);
    try { if (st.before) await st.before(t.ctx); } catch (e) { console.error(e); }
    if (seq !== t.seq || t.done) return;
    // 同じ画面・同じ指定が続くときは、開き直さない（スクロールや入力がそのまま残る）
    const params = val(st.params, t.ctx);
    const nav = st.app ? st.app + JSON.stringify(params || null) : '';
    if (st.app && (Kit.current() !== st.app || (params && nav !== t.lastNav))) await Kit.go(st.app, params || undefined);
    t.lastNav = nav;
    if (seq !== t.seq || t.done) return;
    const sel = val(narrow() && st.targetPhone ? st.targetPhone : st.target, t.ctx);
    const el = sel ? await findTarget(sel) : null;
    if (seq !== t.seq || t.done) return;
    t.el = el;
    if (el) {
      const r = el.getBoundingClientRect();
      const fits = r.top >= 60 && r.bottom <= window.innerHeight - 40;
      if (!fits) { el.scrollIntoView({ block: r.height > window.innerHeight * 0.7 ? 'start' : 'center', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); await sleep(reduced() ? 60 : 360); }
    }
    if (seq !== t.seq || t.done) return;
    renderCard(t, st, false);
    place(t);
    try { t.card.focus({ preventScroll: true }); } catch (e) { /* noop */ }
  }

  function renderCard(t, st, loading) {
    const { card, list, opts, idx } = t;
    Kit.clear(card);
    const top = h('div', { class: 'gd-card-top' },
      opts.label ? h('span', { class: 'chip shu' }, opts.label) : null,
      !opts.tip && list.length > 1 ? h('span', { class: 'num' }, (idx + 1) + ' / ' + list.length) : null,
      Kit.btn('', () => endTour(), { icon: 'close', title: opts.tip ? '閉じる' : '案内を終わる', kind: 'ghost', sm: true, class: 'gd-x' }));
    card.append(top, h('h3', null, st.title || ''), st.body ? h('p', null, st.body) : null);
    if (loading) { card.append(h('p', { class: 'small muted' }, '画面を開いています…')); return; }
    if (!t.el && (st.target || st.targetPhone)) card.append(h('p', { class: 'small muted' }, 'この画面では、示す場所が見つかりませんでした。'));
    const row = h('div', { class: 'btn-row' });
    if (!opts.tip && list.length > 1) row.append(h('span', { class: 'gd-dots', 'aria-hidden': 'true' }, list.map((_, k) => h('i', { class: k === idx ? 'on' : null }))));
    if (opts.tip) row.append(Kit.btn('わかった', () => endTour(), { kind: 'primary', sm: true }));
    else {
      if (idx > 0) row.append(Kit.btn('戻る', () => go(t, idx - 1), { kind: 'ghost', sm: true }));
      const last = idx === list.length - 1;
      row.append(Kit.btn(last ? (opts.doneLabel || '終わる') : (st.next || opts.nextLabel || '次へ'), () => go(t, idx + 1), { kind: 'primary', sm: true, icon: last ? 'check' : 'right' }));
    }
    card.append(row);
  }

  function place(t) {
    if (!t || t.done) return;
    const { el, spot, blocks, card, layer } = t;
    const W = window.innerWidth, H = window.innerHeight, pad = 6;
    let r = el && el.isConnected ? el.getBoundingClientRect() : null;
    if (r && (r.width < 2 || r.bottom < 0 || r.top > H)) r = el && el.isConnected ? r : null;
    layer.classList.toggle('no-target', !r);
    let box;
    if (r) {
      const top = Math.max(6, r.top - pad), left = Math.max(6, r.left - pad);
      const bottom = Math.min(H - 6, r.bottom + pad), right = Math.min(W - 6, r.right + pad);
      box = { top, left, width: Math.max(10, right - left), height: Math.max(10, bottom - top) };
    } else box = { top: H / 2, left: W / 2, width: 0, height: 0 };
    Object.assign(spot.style, { top: box.top + 'px', left: box.left + 'px', width: box.width + 'px', height: box.height + 'px' });
    if (blocks.length) {
      const [b1, b2, b3, b4] = blocks;
      Object.assign(b1.style, { top: 0, left: 0, width: W + 'px', height: box.top + 'px' });
      Object.assign(b2.style, { top: box.top + box.height + 'px', left: 0, width: W + 'px', height: Math.max(0, H - box.top - box.height) + 'px' });
      Object.assign(b3.style, { top: box.top + 'px', left: 0, width: box.left + 'px', height: box.height + 'px' });
      Object.assign(b4.style, { top: box.top + 'px', left: box.left + box.width + 'px', width: Math.max(0, W - box.left - box.width) + 'px', height: box.height + 'px' });
    }
    // 説明のカード：的の下 → 上 → 右 → 左。入らなければ画面の端に寄せる
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 12;
    const sTop = parseFloat(getComputedStyle(document.documentElement).paddingTop) || 0;
    card.classList.remove('is-dock');
    card.style.right = ''; card.style.bottom = '';
    let x, y;
    if (!r) { x = (W - cw) / 2; y = Math.max(16, (H - ch) / 2); }
    else if (narrow()) {
      card.classList.add('is-dock');
      const below = box.top + box.height / 2 < H / 2;
      y = below ? H - ch - 12 - (parseFloat(getComputedStyle(document.documentElement).paddingBottom) || 0) : 12 + sTop;
      x = 12;
    } else if (box.top + box.height + gap + ch <= H - 8) { y = box.top + box.height + gap; x = box.left; }
    else if (box.top - gap - ch >= 8) { y = box.top - gap - ch; x = box.left; }
    else if (box.left + box.width + gap + cw <= W - 8) { x = box.left + box.width + gap; y = box.top + 12; }
    else if (box.left - gap - cw >= 8) { x = box.left - gap - cw; y = box.top + 12; }
    else { x = W - cw - 16; y = H - ch - 16; }
    x = Kit.clamp(x, 8, Math.max(8, W - cw - 8));
    y = Kit.clamp(y, 8, Math.max(8, H - ch - 8));
    card.style.left = x + 'px';
    card.style.top = y + 'px';
  }

  function endTour(silent) {
    const t = tour;
    if (!t || t.done) return;
    t.done = true;
    t.cleanup();
    t.layer.remove();
    tour = null;
    if (!silent && t.prevFocus && t.prevFocus.isConnected && t.prevFocus.focus) { try { t.prevFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
    if (t.opts.onEnd) { try { t.opts.onEnd(t.idx >= t.list.length - 1); } catch (e) { console.error(e); } }
    t.resolve();
  }
  G.endTour = () => endTour();
  G.touring = () => !!tour;

  // そのツールの「画面をひとめぐり」
  G.tourApp = (appId = Kit.current()) => {
    const help = G.getHelp(appId);
    if (!help || !help.tour || !help.tour.length) { Kit.toast('このツールのツアーは、まだありません'); return; }
    closeHelp();
    const def = Kit.appDef(appId);
    return G.tour(help.tour.map((s) => Object.assign({ app: appId }, s)), { label: (def ? def.title : '') + 'のツアー', doneLabel: 'わかった' });
  };

  // やりたいこと：その画面へ行き、押す場所を光らせる
  G.runTask = async (t) => {
    if (typeof t === 'string') t = G.getTask(t);
    if (!t) return;
    closeHelp(); closeSearch();
    Kit.pref.set('guide.lastTask', t.id);
    if (typeof t.run === 'function') return t.run();
    if (!t.target && !t.targetPhone) { await Kit.go(t.app, t.params); if (t.tip) Kit.toast(t.tip); return; }
    return G.tour([{ app: t.app, params: t.params, target: t.target, targetPhone: t.targetPhone, title: t.title, body: t.tip }], { tip: true, label: 'ここです' });
  };

  /* ───────── 3分デモ（保存しない試し箱の中で） ───────── */
  const DEMO_LEAD = { name: '森 はるか', email: 'haruka.mori@example.com', phone: '', kind: '無料体験レッスンの予約', message: '高1の息子が、二次関数でつまずいています。図で考える授業が気になりました。体験レッスンを受けてみたいです。', source: 'Instagram', status: 'new', value: 16000, tags: ['高校生', '保護者'], notes: [], nextAt: '', meetingAt: '', channel: 'form', preferredAt: '' };
  G.demo = async () => {
    if (G.touring()) endTour(true);
    closeHelp(); closeSearch();
    await Kit.store.sandbox(true);
    const meetDay = Kit.rel(2);
    const steps = [
      { app: 'dashboard', target: '.app-dashboard .db-top', title: 'ここが、お店の帳場です', body: '今日やることと、今月の数字が集まる場所です。これから、ひとつの問い合わせが売上になるまでを、実際の画面で追いかけます（デモの中の変更は保存されません）。' },
      { app: 'site', target: '.app-site iframe', title: 'お客さんが見るページ', body: 'ホームページです。エディターで文章や写真を直して、1つのファイルに書き出して公開します。お客さんはここのフォームから問い合わせます。' },
      {
        app: 'inbox', params: (c) => ({ lead: c.leadId }), target: '.app-inbox .ib-detail .ib-d-head', title: '問い合わせが届きました',
        body: 'フォームから届いた問い合わせは、集客窓口の受付箱に入ります。だれから、何の用件かがひとめで分かります。',
        before: async (c) => { if (!c.leadId) { const l = await Kit.store.put('leads', Object.assign({}, DEMO_LEAD, { preferredAt: meetDay + 'T15:00' })); c.leadId = l.id; } },
      },
      { app: 'inbox', params: (c) => ({ lead: c.leadId }), target: '.app-inbox .ib-detail .btn.primary', title: '返信は、ひな形から', body: '「返信文をつくる」を押すと、名前や希望日時が入った返信文ができます。返したら、状態を「返信済み」へ1クリックで進めます。' },
      {
        app: 'calendar', params: { date: meetDay }, target: (c) => '.app-calendar .cal-ev[data-key="lm:' + c.leadId + '"]', targetPhone: '.app-calendar [data-date="' + meetDay + '"]',
        title: '予約は、カレンダーへ', body: '問い合わせに予約の日時を入れると、カレンダーに自動で出ます（点線の予定）。空いている日時の案内文も、ここで作れます。',
        before: async (c) => { const l = await Kit.store.getItem('leads', c.leadId); if (l && !l.meetingAt) await Kit.store.put('leads', Object.assign(l, { meetingAt: meetDay + 'T15:00', status: 'talking' })); },
      },
      { app: 'invoice', params: (c) => ({ fromLead: c.leadId }), target: '.app-invoice .inv-paper', targetPhone: '.app-invoice .inv-ed-switch', title: '決まったら、見積書', body: '問い合わせから「見積書をつくる」を押すと、宛先が入った見積書ができます。インボイス制度に合わせた計算で、PDFにして送れます。' },
      { app: 'money', target: '.app-money .mo-kpis', title: '計画と、くらべる', body: '売上はマネタイズ計画の数字とくらべられます。1か月に使える時間の上限も見えるので、無理のない計画にできます。' },
      { app: 'dashboard', target: '.app-dashboard .db-todo', title: 'ぜんぶ、ここに戻ってきます', body: 'さっきの問い合わせや予定が、今日やることに並びます。デモはここまで。自分の事業で始めるなら、「まずはここから」の最初の3歩へどうぞ。' },
    ];
    await G.tour(steps, {
      label: 'デモ中（保存されません）', doneLabel: 'デモを終わる',
      onEnd: () => {},
    });
    await Kit.store.sandbox(false);
    await Kit.go('start');
    Kit.toast('デモを終わりました。元の内容に戻っています');
  };

  /* ───────── 使い方パネル ───────── */
  let panel = null;
  function closeHelp() { if (panel) { panel.cleanup(); panel = null; } }
  G.closeHelp = closeHelp;
  G.openHelp = (appId = Kit.current()) => {
    if (panel && panel.app === appId) { closeHelp(); return; }
    closeHelp(); closeSearch();
    const def = Kit.appDef(appId) || { title: 'このページ' };
    const help = G.getHelp(appId);
    const prev = document.activeElement;
    const body = h('div', { class: 'gd-panel-b' });
    const el = h('aside', { class: 'gd-panel', role: 'dialog', 'aria-label': def.title + 'の使い方', tabindex: -1 },
      h('div', { class: 'gd-panel-h' }, h('h2', null, def.title + 'の使い方'), Kit.btn('', closeHelp, { icon: 'close', title: '閉じる', kind: 'ghost', sm: true })),
      body);
    if (help) {
      if (help.lead) body.append(h('p', { class: 'gd-lead' }, help.lead));
      if (help.tour && help.tour.length) body.append(h('div', { class: 'btn-row' }, Kit.btn('画面をひとめぐり（' + help.tour.length + '）', () => G.tourApp(appId), { kind: 'primary', icon: 'eye' })));
      if (help.first && help.first.length) {
        body.append(h('section', { class: 'gd-sec' }, h('h3', null, 'まずはこの3つ'),
          h('div', { class: 'gd-first' }, help.first.map((f, i) => h('button', { type: 'button', class: 'gd-first-item', onclick: () => (f.task ? G.runTask(f.task) : null), disabled: !f.task },
            h('span', { class: 'n' }, String(i + 1)), h('span', { class: 't' }, f.text), f.task ? Kit.icon('right') : h('span'))))));
      }
      if (help.can && help.can.length) body.append(h('section', { class: 'gd-sec' }, h('h3', null, 'できること'), h('ul', { class: 'gd-can' }, help.can.map((c) => h('li', null, c)))));
      if (help.faq && help.faq.length) body.append(h('section', { class: 'gd-sec gd-faq' }, h('h3', null, '迷いやすいところ'), help.faq.map((f) => h('details', null, h('summary', null, f.q), h('p', null, f.a)))));
      if (help.related && help.related.length) {
        body.append(h('section', { class: 'gd-sec' }, h('h3', null, 'つながるツール'),
          h('div', { class: 'gd-related' }, help.related.filter((id) => Kit.appDef(id)).map((id) => h('button', { type: 'button', class: 'chip line', onclick: () => { closeHelp(); Kit.go(id); } }, Kit.appDef(id).title)))));
      }
    } else {
      body.append(h('p', { class: 'gd-lead' }, 'このツールの説明は、まだありません。やりたいことから探すか、「まずはここから」をどうぞ。'));
    }
    // パネルの中でも探せる
    const q = h('input', { type: 'search', placeholder: '例：請求書、QRコード、予約', id: 'gd-panel-q', 'aria-label': 'やりたいことを入力' });
    const res = h('div', { class: 'gd-mini-results' });
    q.addEventListener('input', () => {
      Kit.clear(res);
      for (const t of G.search(q.value, 5)) res.append(resultItem(t, () => G.runTask(t)));
      if (q.value.trim() && !res.firstChild) res.append(h('p', { class: 'small muted' }, '見つかりませんでした。言いかえてみてください。'));
    });
    body.append(h('section', { class: 'gd-sec' }, h('h3', null, 'やりたいことから探す'), q, res));
    body.append(askBox(appId));
    body.append(h('section', { class: 'gd-sec' }, h('div', { class: 'btn-row' },
      Kit.btn('3分デモを見る', () => G.demo(), { icon: 'play', sm: true }),
      Kit.btn('まずはここから', () => { closeHelp(); Kit.go('start'); }, { icon: 'star', sm: true, kind: 'ghost' }))));
    document.body.append(el);
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-back') && !tour) { e.preventDefault(); closeHelp(); } };
    document.addEventListener('keydown', onKey);
    const offMount = Kit.onMount((id) => { if (panel && id !== appId) closeHelp(); });
    panel = { app: appId, el, cleanup: () => { document.removeEventListener('keydown', onKey); offMount(); el.remove(); if (prev && prev.isConnected && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) { /* noop */ } } };
    setTimeout(() => el.focus({ preventScroll: true }), 20);
  };

  // AIに聞く（使える画面だけ）
  function askBox(appId) {
    const ta = h('textarea', { rows: 2, placeholder: '例：お客さんに日程の候補を送るには？', id: 'gd-ask-q', 'aria-label': 'AIへの質問' });
    const out = h('div', { class: 'gd-ask-out', 'aria-live': 'polite' });
    const btns = h('div', { class: 'gd-mini-results' });
    const run = async () => {
      const question = ta.value.trim();
      if (!question) { ta.focus(); return; }
      out.textContent = '考え中…'; Kit.clear(btns);
      const list = G.allTasks().map((t) => t.id + '：' + t.title + '（' + ((Kit.appDef(t.app) || {}).title || t.app) + '）').join('\n');
      const prompt = 'あなたは、起業ツール一式「みせびらき」の使い方の案内係です。使う人は、ITにくわしくない一人の事業者です。\n'
        + 'いまの画面：' + ((Kit.appDef(appId) || {}).title || appId) + '\n'
        + '次の「できること一覧」から、質問に合うものを最大3つ選び、やさしい日本語で3文以内の答えをつけてください。一覧にないことは、できないと正直に答えてください。\n'
        + 'JSONだけで返してください：{"answer": "答え", "tasks": ["id", "id"]}\n\n【できること一覧】\n' + list + '\n\n【質問】\n' + question;
      try {
        const r = await Kit.ai.ask(prompt, { json: true, tier: 'quick' });
        out.textContent = (r && r.answer) || '';
        for (const id of (r && r.tasks) || []) { const t = G.getTask(id); if (t) btns.append(resultItem(t, () => G.runTask(t))); }
      } catch (e) { out.textContent = (e && e.message) || Kit.ai.message(); }
    };
    return h('section', { class: 'gd-sec gd-ask ai-only' }, h('h3', null, 'AIに聞く'), ta, h('div', { class: 'btn-row' }, Kit.btn('聞く', run, { icon: 'sparkle', sm: true, kind: 'ai' })), out, btns);
  }

  function resultItem(t, onClick, selected) {
    const def = Kit.appDef(t.app);
    return h('button', { type: 'button', class: 'gd-pal-item', 'aria-selected': selected ? 'true' : 'false', onclick: onClick },
      h('span', { class: 'ic' }, Kit.icon(def ? def.icon : 'info')),
      h('span', { class: 't' }, t.title),
      h('span', { class: 'chip' }, def ? def.title : t.app),
      t.tip ? h('span', { class: 's' }, t.tip) : null);
  }

  /* ───────── やりたいことから探す ───────── */
  let pal = null;
  function closeSearch() { if (pal) { pal.cleanup(); pal = null; } }
  G.closeSearch = closeSearch;
  G.openSearch = (initial = '') => {
    if (pal) { pal.input.focus(); return; }
    closeHelp();
    const prev = document.activeElement;
    const input = h('input', { type: 'text', inputmode: 'search', enterkeyhint: 'search', id: 'gd-pal-q', placeholder: 'やりたいことを入力（例：請求書、チラシのQR、予約）', 'aria-label': 'やりたいことを入力', autocomplete: 'off' });
    input.value = initial;
    const list = h('div', { class: 'gd-pal-list', role: 'listbox' });
    const box = h('div', { class: 'gd-pal', role: 'dialog', 'aria-label': 'やりたいことから探す' },
      h('div', { class: 'gd-pal-in' }, Kit.icon('search'), input, Kit.btn('', () => closeSearch(), { icon: 'close', title: '閉じる', kind: 'ghost', sm: true })),
      list,
      h('div', { class: 'gd-pal-foot' }, h('span', { class: 'gd-keys' }, h('kbd', null, '↑↓'), ' えらぶ　', h('kbd', null, 'Enter'), ' ひらく　', h('kbd', null, 'Esc'), ' とじる'),
        Kit.btn('このページの使い方', () => { closeSearch(); G.openHelp(); }, { sm: true, kind: 'ghost', icon: 'info' })));
    const back = h('div', { class: 'gd-pal-back' }, box);
    let items = [], sel = 0;
    const appEntries = () => Kit.apps().map((a) => ({ id: 'app:' + a.id, app: a.id, title: a.title + 'を開く', tip: a.desc, words: a.desc }));
    const render = () => {
      Kit.clear(list);
      const q = input.value.trim();
      if (!q) {
        const pinned = G.allTasks().filter((t) => t.pin).slice(0, 7);
        const last = G.getTask(Kit.pref.get('guide.lastTask', ''));
        items = (last && !pinned.includes(last) ? [last] : []).concat(pinned);
        if (items.length) list.append(h('div', { class: 'gd-pal-h' }, 'よく使うこと'));
      } else {
        items = G.search(q, 9);
        const nq = G.norm(q);
        const apps = appEntries().filter((a) => G.norm(a.title + a.words).includes(nq)).slice(0, 3);
        items = items.concat(apps.filter((a) => !items.some((t) => t.app === a.app && !t.target)));
      }
      sel = Math.min(sel, Math.max(0, items.length - 1));
      items.forEach((t, i) => list.append(resultItem(t, () => choose(t), i === sel)));
      if (q && !items.length) {
        list.append(h('div', { class: 'gd-pal-empty' },
          h('p', null, '「' + q + '」に合うものが見つかりませんでした。短い言葉や、別の言い方で試してみてください（例：「見積」「投稿」「予約」）。'),
          h('div', { class: 'btn-row' }, Kit.ai.button('AIに聞いてみる', async () => { closeSearch(); G.openHelp(); const ta = document.getElementById('gd-ask-q'); if (ta) { ta.value = q; ta.focus(); } }, { sm: true }))));
      }
    };
    const choose = (t) => { closeSearch(); if (String(t.id).startsWith('app:')) Kit.go(t.app); else G.runTask(t); };
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[sel]) choose(items[sel]); }
    });
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSearch(); } };
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('mousedown', (e) => { if (e.target === back) closeSearch(); });
    document.body.append(back);
    render();
    setTimeout(() => input.focus(), 20);
    pal = { input, cleanup: () => { document.removeEventListener('keydown', onKey, true); back.remove(); if (prev && prev.isConnected && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) { /* noop */ } } };
  };

  /* ───────── 入口（メニュー・スマホ上部・キー） ───────── */
  Kit.started.then((shell) => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const sideTools = h('div', { class: 'gd-side-tools' },
      h('button', { type: 'button', class: 'gd-search-btn', onclick: () => G.openSearch() }, Kit.icon('search'), h('span', null, 'やりたいことを探す'), h('kbd', null, '/')));
    const noren = shell.side.querySelector('.noren');
    if (noren) noren.after(sideTools);
    const foot = shell.side.querySelector('.mb-side-foot');
    if (foot) foot.prepend(h('button', { type: 'button', class: 'gd-help-btn', onclick: () => G.openHelp() }, Kit.icon('info'), 'このページの使い方'));
    shell.top.append(h('span', { class: 'gd-top-btns' },
      h('button', { type: 'button', class: 'gd-top-btn', 'aria-label': 'やりたいことを探す', title: 'やりたいことを探す', onclick: () => G.openSearch() }, Kit.icon('search')),
      h('button', { type: 'button', class: 'gd-top-btn', 'aria-label': 'このページの使い方', title: 'このページの使い方', onclick: () => G.openHelp() }, Kit.icon('info'))));
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || tour) return;
      const tag = (e.target && e.target.tagName) || '';
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
      if (document.querySelector('.modal-back')) return;
      if ((e.key === 'k' || e.key === 'K') && (isMac ? e.metaKey : e.ctrlKey)) { e.preventDefault(); G.openSearch(); return; }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); G.openSearch(); }
      else if (e.key === '?') { e.preventDefault(); G.openHelp(); }
    });
  });
})();
