/* 管理画面の外枠：ログイン（暗証番号）・左のメニュー・上の帯（大会の切りかえ・公開サイトへ）
   画面の足し方：
     T.page('admin', 'news', {
       title: 'お知らせ', icon: 'megaphone', group: '広報', order: 20,
       lead: '画面の上に出る短い説明（なくてもよい）',
       head(r)   … 右上のボタン（T.html）。なくてもよい
       render(r) … 中身（T.html）。r は {id, arg, q}（#/admin/news/編集中のid?…）
       mount(root, r) … 描いたあとに呼ばれる（入力欄に動きをつけるときなど）
       acts: { 名前(el, event) {} }   … <button data-act="名前"> を押したとき
       forms: { 名前(値, form) {} }   … <form data-form="名前"> を送ったとき
     });
   データを変えたら T.save() → T.refresh()（描きなおし）。記録に残すなら T.logIt('…')。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const GROUPS = ['', '大会', '広報', '参加者', '連絡', '運営', 'データ'];
  const SKEY = 'taikai.admin';
  T.who = () => { try { return JSON.parse(sessionStorage.getItem(SKEY) || '{}').who || '運営'; } catch (e) { return '運営'; } };
  const authed = () => { try { const s = JSON.parse(sessionStorage.getItem(SKEY) || '{}'); return !!s.ok; } catch (e) { return false; } };

  // 未対応の数（メニューの横に出す）
  T.adminBadges = () => {
    const ev = T.ev();
    return {
      inbox: ev.threads.filter((t) => t.status === 'open').length,
      board: ev.tasks.filter((t) => t.status !== 'done' && t.due && T.daysUntil(t.due) <= 7).length,
      people: T.active(ev).filter((p) => !T.paid(p, ev)).length,
    };
  };

  function nav(cur) {
    const pages = Object.values(T.pages.admin).sort((a, b) => GROUPS.indexOf(a.group || '') - GROUPS.indexOf(b.group || '') || (a.order || 50) - (b.order || 50));
    const badges = T.adminBadges();
    let lastGroup = null;
    return html`<nav class="side-nav" aria-label="管理メニュー">${pages.map((p) => {
      const head = p.group !== lastGroup && p.group ? html`<div class="nav-group">${p.group}</div>` : '';
      lastGroup = p.group;
      const b = badges[p.id];
      return html`${head}<a href="#/admin/${p.id}" class="nav-item ${p.id === cur ? 'on' : ''}" ${p.id === cur ? T.raw('aria-current="page"') : ''}>${icon(p.icon)}<span>${p.nav || p.title}</span>${b ? html`<b class="nav-badge ${p.id === 'people' ? 'soft' : ''}">${b}</b>` : ''}</a>`;
    })}</nav>`;
  }

  function login() {
    const ev = T.ev();
    T.activePage = loginPage;
    T.applyTheme(ev);
    document.title = '管理画面にログイン｜' + T.eventTitle(ev);
    app().innerHTML = String(html`<div class="login-wrap">
      <form class="login card" data-form="login">
        <div class="login-mark">${T.raw(T.logoSvg())}</div>
        <p class="eyebrow">${ev.info.orgShort || ''} 大会運営キット</p>
        <h1>${T.eventTitle(ev)}<br><small>管理画面</small></h1>
        <div class="fgrid">
          <div class="field full"><label class="flabel" for="lg-who">あなたは</label>
            <select id="lg-who" name="who">${ev.staff.map((s) => html`<option>${s.name}</option>`)}<option>運営スタッフ</option></select></div>
          <div class="field full"><label class="flabel" for="lg-pin">暗証番号</label><input id="lg-pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></div>
        </div>
        ${ev.info.sample ? html`<p class="help">サンプルの暗証番号は <b class="mono">${ev.info.pin}</b> です。</p>` : ''}
        <button class="btn primary lg" style="width:100%;margin-top:12px">${icon('lock')} ログイン</button>
        <p class="small muted" style="margin:14px 0 0">これは見本です。本番では、学校・学会のアカウントでのログインに置きかえます。</p>
        <a class="small" href="#/">← 公開サイトへ</a>
      </form>
    </div>`);
    const pin = document.getElementById('lg-pin');
    if (pin) pin.focus();
  }
  const loginPage = {
    forms: {
      login(v) {
        const ev = T.ev();
        if (String(v.pin) !== String(ev.info.pin || '')) { T.toast('暗証番号がちがいます', 'bad'); return; }
        sessionStorage.setItem(SKEY, JSON.stringify({ ok: true, who: v.who }));
        T.toast(v.who + ' さん、おつかれさまです');
        T.render();
      },
    },
  };

  const app = () => document.getElementById('app');

  T.shells.admin = (r) => {
    document.body.className = 'is-admin';
    if (!T.ev()) { app().innerHTML = '<p style="padding:24px">大会がありません。「データ」から作ってください。</p>'; return; }
    if (!authed()) return login();
    const ev = T.ev();
    T.applyTheme(ev);
    const pg = T.pages.admin[r.id] || T.pages.admin.dash;
    T.activePage = pg;
    document.title = pg.title + '｜管理｜' + T.eventTitle(ev);
    const events = Object.values(T.db.events);
    let body;
    try { body = pg.render(r); } catch (e) { console.error(e); body = html`<div class="note bad">この画面を開けませんでした：${e.message}</div>`; }
    app().innerHTML = String(html`<div class="admin ${document.body.dataset.nav === 'open' ? 'nav-open' : ''}">
      <aside class="side">
        <a class="side-brand" href="#/admin">
          <span class="side-logo">${T.raw(T.logoSvg())}</span>
          <span><b>${ev.info.no ? '第' + ev.info.no + '回' : ''} ${ev.info.short || ev.info.name}</b><small>大会運営キット</small></span>
        </a>
        ${nav(pg.id)}
        <div class="side-foot"><a href="#/" class="nav-item">${icon('external')}<span>公開サイトを見る</span></a></div>
      </aside>
      <div class="side-scrim" data-act="navClose"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn only-sp" data-act="navOpen" aria-label="メニュー">${icon('menu')}</button>
          <label class="ev-switch" title="大会の切りかえ">${icon('swap')}
            <select data-ev-switch aria-label="大会の切りかえ">${events.map((e) => html`<option value="${e.id}" ${e.id === ev.id ? T.raw('selected') : ''}>${T.eventTitle(e)}</option>`)}<option value="__new">＋ 新しい大会を作る…</option></select>
          </label>
          <span class="spacer"></span>
          ${ev.info.sample ? html`<span class="chip warn only-pc">サンプルのデータ</span>` : ''}
          <a class="btn sm ghost only-pc" href="#/" target="_blank" rel="noopener">${icon('external')} 公開サイト</a>
          <span class="who only-pc">${icon('user')} ${T.who()}</span>
          <button class="icon-btn" data-act="logout" title="ログアウト" aria-label="ログアウト">${icon('logout')}</button>
        </header>
        <main class="page" id="main">
          <header class="page-head">
            <div><h1>${icon(pg.icon)} ${pg.title}</h1>${pg.lead ? html`<p class="page-lead">${pg.lead}</p>` : ''}</div>
            <div class="row page-actions">${pg.head ? pg.head(r) : ''}</div>
          </header>
          <div class="page-body">${body}</div>
        </main>
      </div>
    </div>`);
    const sw = app().querySelector('[data-ev-switch]');
    sw.addEventListener('change', () => {
      if (sw.value === '__new') { sw.value = ev.id; return T.go('admin/data/new'); }
      T.db.current = sw.value; T.save(true); T.toast('「' + T.eventTitle(T.ev()) + '」に切りかえました'); T.render();
    });
    if (pg.mount) { try { pg.mount(app().querySelector('.page-body'), r); } catch (e) { console.error(e); } }
  };

  Object.assign(T.globalActs, {
    navOpen() { document.querySelector('.admin').classList.add('nav-open'); },
    navClose() { document.querySelector('.admin').classList.remove('nav-open'); },
    async logout() { if (await T.confirm('ログアウトしますか？')) { sessionStorage.removeItem(SKEY); T.go('admin'); } },
  });
  // メニューを押したら、スマホでは閉じる
  document.addEventListener('click', (e) => { if (e.target.closest('.side-nav a')) { const a = document.querySelector('.admin'); if (a) a.classList.remove('nav-open'); } });

  // 大会のしるし（円・三角形・正方形を重ねた、数学っぽいマーク）
  T.logoSvg = () => `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 5.5 40 33H8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="24" r="8.2" fill="none" stroke="var(--ev-accent)" stroke-width="2.4"/><circle cx="24" cy="24" r="1.8" fill="var(--ev-accent)"/></svg>`;

  /* ── 管理画面でよく使う部品 ── */
  // 一覧の上の「さがす」欄。入力のたびに onInput(文字)。描きなおしても入力欄の文字と位置を保つ
  T.searchBox = (name, value, ph = 'さがす') => html`<label class="search">${icon('search')}<input type="search" data-search="${name}" value="${value || ''}" placeholder="${ph}" aria-label="${ph}"></label>`;
  T.bindSearch = (root, name, onInput) => {
    const el = root.querySelector(`[data-search="${name}"]`);
    if (!el) return;
    el.addEventListener('input', T.debounce(() => { onInput(el.value); const pos = el.selectionStart; T.refresh(); const n = document.querySelector(`[data-search="${name}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* なにもしない */ } } }, 200));
  };
  // 画面ごとの一時的な状態（絞りこみ・選んだタブなど）。ページを開きなおすまで残る
  T.ui = {};
  T.uiState = (id, init) => (T.ui[id] = T.ui[id] || init);
})();
