/* hibi/js/app.js
   画面（今日・カレンダー・メモ・資料・設定・つくり方）と、操作。
   ・データは裏側（Apps Script）から bootstrap で受けとり、この端末にも残す（次に開いたとき、すぐ出すため）
   ・書きこみは、送ってから画面に反映する（メモだけは、電波がなくても未送信としてためる）
   ・iPhone のリマインダー・カレンダーへの登録は、ショートカット（shortcuts://）を呼ぶ */
(function () {
  'use strict';
  const HB = window.HB;
  const esc = HB.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const S = {
    st: null, demo: false, loading: false, lastFetch: 0, sync: 'idle', syncMsg: '',
    route: { name: 'today' }, edit: null, upload: null, sheetOpen: false, dirtyWhileSheet: false,
    full: new Map(), thumbMiss: new Map(), feedUrl: '',
    ui: Object.assign({ memoFilter: 'all', memoCat: '', memoQ: '', libStatus: 'all', libCat: '', libQ: '', snooze: {} }, HB.api.ui())
  };

  /* ───── 起動 ───── */

  /** 接続リンク（#connect=…）で開かれたら、つなぐ */
  function takeConnectLink() {
    const c = HB.parseConnect(location.hash);
    if (!c) return false;
    HB.api.setConn(c); HB.api.clearState();
    S.st = null; S.demo = false;
    history.replaceState(null, '', location.pathname + '#/today');
    setTimeout(() => toast('裏側につなぎました'), 300);
    return true;
  }

  function boot() {
    takeConnectLink();
    window.addEventListener('hashchange', () => { if (takeConnectLink()) { onRoute(); refresh(true); } else onRoute(); });
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(false); });
    window.addEventListener('online', () => refresh(true));
    setupSwipe();
    registerSW();
    if (/demo/.test(location.search) && !HB.api.conn()) startDemo();
    else if (/demo/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    else if (HB.api.conn()) S.st = HB.api.cachedState();
    onRoute();
    if (!S.demo && HB.api.conn()) refresh(true);
    // 0時をまたいだら「今日」を描きなおす
    setInterval(() => { if (S.route.name === 'today' && !S.sheetOpen && S.renderedToday !== HB.today()) render(); }, 60000);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) return;
    navigator.serviceWorker.register('sw.js').catch(() => { /* なくても動く */ });
  }

  /* ───── 道すじ（#/today など） ───── */

  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    if (name === 'day' && HB.isYmd(arg)) return arg === HB.today() ? { name: 'today' } : { name: 'day', ymd: arg };
    if (name === 'cal') return { name: 'cal', ym: /^\d{4}-\d{2}$/.test(arg || '') ? arg : HB.today().slice(0, 7) };
    if (['memos', 'library', 'settings', 'guide'].includes(name)) return { name };
    return { name: 'today' };
  }
  function onRoute() { S.route = parseRoute(); closeSheet(true); render(); window.scrollTo(0, 0); }
  const go = hash => { if (location.hash === hash) onRoute(); else location.hash = hash; };

  /* ───── 描く ───── */

  function render() {
    const r = S.route;
    document.body.dataset.view = r.name;
    $$('#tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === tabOf(r.name) ? 'page' : 'false'));
    if (!S.st) {
      $('#top').innerHTML = '';
      $('#view').innerHTML = HB.api.conn() ? viewLoading() : viewWelcome();
      $('#fab').hidden = true; $('#tabs').hidden = !HB.api.conn();
      return;
    }
    $('#tabs').hidden = false;
    $('#fab').hidden = ['settings', 'guide'].includes(r.name);
    $('#top').innerHTML = topBar(r);
    let html = '';
    if (r.name === 'today') { html = viewDay(HB.today()); S.renderedToday = HB.today(); }
    else if (r.name === 'day') html = viewDay(r.ymd);
    else if (r.name === 'cal') html = viewCal(r.ym);
    else if (r.name === 'memos') html = viewMemos();
    else if (r.name === 'library') html = viewLibrary();
    else if (r.name === 'settings') html = viewSettings();
    else if (r.name === 'guide') html = viewGuide();
    $('#view').innerHTML = banner() + html;
    loadThumbs($('#view'));
    if (r.name === 'guide' || r.name === 'settings') loadFeedUrl();
  }
  const tabOf = n => (n === 'day' ? 'cal' : n === 'guide' ? 'settings' : n);

  /** 裏側から新しいデータが来たとき：シートを開いているときは、閉じてから描く */
  function softRender() {
    if (S.sheetOpen) { S.dirtyWhileSheet = true; return; }
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  function banner() {
    const out = [];
    if (S.demo) out.push(`<div class="banner demo">おためし中です（サンプルのデータ。保存はされません） <button class="link" data-act="endDemo">おためしをやめる</button></div>`);
    const q = HB.api.queue().length;
    if (q) out.push(`<div class="banner warn">未送信のメモが ${q} 件あります。つながったら送ります。</div>`);
    if (S.sync === 'offline') out.push(`<div class="banner warn">いまは裏側につながりません。前に受けとった内容を出しています。</div>`);
    else if (S.sync === 'error') out.push(`<div class="banner err">${esc(S.syncMsg)}</div>`);
    return out.join('');
  }

  function topBar(r) {
    const sync = `<button class="iconbtn sync ${S.sync}" data-act="refresh" aria-label="新しくする" title="${esc(S.syncMsg || '新しくする')}">${icon('refresh')}</button>`;
    if (r.name === 'today' || r.name === 'day') {
      const ymd = r.name === 'today' ? HB.today() : r.ymd;
      return `<button class="iconbtn" data-act="goDay" data-ymd="${HB.addDays(ymd, -1)}" aria-label="前の日">${icon('left')}</button>
        <button class="title" data-act="goCal" data-ym="${ymd.slice(0, 7)}"><b>${HB.labelDay(ymd)}</b><small>${HB.relDay(ymd)}</small></button>
        <button class="iconbtn" data-act="goDay" data-ymd="${HB.addDays(ymd, 1)}" aria-label="次の日">${icon('right')}</button>${sync}`;
    }
    if (r.name === 'cal') {
      const [y, m] = r.ym.split('-').map(Number);
      return `<button class="iconbtn" data-act="goCal" data-ym="${HB.addMonths(r.ym, -1)}" aria-label="前の月">${icon('left')}</button>
        <div class="title"><b>${y}年${m}月</b></div>
        <button class="iconbtn" data-act="goCal" data-ym="${HB.addMonths(r.ym, 1)}" aria-label="次の月">${icon('right')}</button>
        <button class="chip-btn" data-act="goCal" data-ym="${HB.today().slice(0, 7)}">今月</button>${sync}`;
    }
    const titles = { memos: 'メモ', library: '画像・資料', settings: '設定', guide: 'ショートカットのつくり方' };
    const back = r.name === 'guide' ? `<button class="iconbtn" data-act="go" data-hash="#/settings" aria-label="もどる">${icon('left')}</button>` : '';
    return `${back}<div class="title"><b>${titles[r.name]}</b></div>${r.name === 'guide' ? '' : sync}`;
  }

  function viewLoading() { return `<div class="empty-state"><div class="spinner"></div><p>読みこみ中…</p></div>`; }

  function viewWelcome() {
    const c = HB.api.conn() || {};
    return `<div class="welcome">
      <div class="logo">${icon('book', 56)}</div>
      <h1>ひびの手帳</h1>
      <p class="lead">予定・リマインダー・メモ・写真を、日付ごとに。<br>毎朝 Claude が受信箱を整理して、ニュースとメールのまとめも「今日」に届きます。</p>
      <form class="card form" data-form="connect">
        <h2>裏側につなぐ</h2>
        <label>裏側の URL（/exec で終わる）<input id="cUrl" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(c.url || '')}"></label>
        <label>合言葉（トークン）<input id="cToken" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="hb_…" value="${esc(c.token || '')}"></label>
        <p class="form-err" id="cErr" hidden></p>
        <button class="primary big" type="submit">つなぐ</button>
        <p class="muted small">URL と合言葉は、裏側（Apps Script）で <code>showSetupInfo</code> を実行するとログに出ます。準備のしかたは README の「はじめに」。</p>
      </form>
      <button class="ghost big" data-act="demo">おためし（サンプルで見る）</button>
    </div>`;
  }

  /* ── 今日・その日 ── */

  function viewDay(ymd) {
    const st = S.st, v = HB.dayView(st, ymd);
    const parts = [];
    if (v.isToday && v.briefing && v.briefing.summary) {
      parts.push(`<section class="card hitokoto"><div class="label">${icon('sun')} けさのひとこと</div><p>${esc(v.briefing.summary)}</p></section>`);
    }
    const props = v.proposals.filter(p => S.ui.snooze[p.id] !== HB.today());
    if (props.length) parts.push(`<section class="card props"><h2>${icon('ask')} 確認してほしいこと <span class="count">${props.length}</span></h2>${props.map(proposalCard).join('')}</section>`);
    parts.push(scheduleCard(v));
    parts.push(`<section class="card"><h2>${icon('memo')} この日のメモ</h2>${v.memos.map(memoCard).join('') || '<p class="muted small">この日のメモはまだありません。</p>'}
      <form class="quick" data-form="quickMemo" data-ymd="${ymd}"><textarea rows="1" placeholder="この日のメモを書く…" aria-label="この日のメモ"></textarea><button class="primary" type="submit">追加</button></form></section>`);
    parts.push(`<section class="card"><h2>${icon('photo')} この日の画像・資料</h2><div class="grid">${v.items.map(itemThumb).join('')}
      <button class="thumb add" data-act="addMenu" data-ymd="${ymd}">${icon('plus')}<span>この日に入れる</span></button></div></section>`);
    if (v.pinned.length) parts.push(`<section class="card"><h2>${icon('star')} 重要メモ（日付なし）</h2>${v.pinned.slice(0, 6).map(memoCard).join('')}
      ${v.pinned.length > 6 ? `<button class="link" data-act="memoFilterGo" data-f="star">ほかに ${v.pinned.length - 6} 件</button>` : ''}</section>`);
    parts.push(briefingCards(v));
    parts.push(footInfo(ymd));
    return `<div class="day">${parts.join('')}</div>`;
  }

  function scheduleCard(v) {
    const st = S.st, sc = st.settings.shortcuts || {};
    const ev = v.events.map(e => `<li class="ev"><span class="time">${e.allDay ? '終日' : esc(e.t0) + (e.t1 ? `<small>${esc(e.t1)}</small>` : '')}</span>
      <span class="ev-main"><b>${esc(e.title)}</b>${e.loc ? `<small>${esc(e.loc)}</small>` : ''}</span>${e.cal ? `<span class="cal-name">${esc(e.cal)}</span>` : ''}</li>`).join('');
    const rem = v.reminders.map(r => `<li class="rem ${r.overdue ? 'overdue' : ''}"><a href="x-apple-reminderkit://" class="rem-a"><span class="circle"></span>
      <span class="ev-main"><b>${r.flag ? '🚩 ' : ''}${esc(r.title)}</b><small>${r.overdue ? '期限切れ ' + HB.labelShort(r.due) : r.dueTime ? esc(r.dueTime) : ''}${r.list ? ' · ' + esc(r.list) : ''}</small></span>${r.prio >= 3 ? '<span class="prio">!!!</span>' : r.prio === 2 ? '<span class="prio">!!</span>' : ''}</a></li>`).join('');
    const synced = st.ios && st.ios.syncedAt;
    const hint = synced ? '' : `<p class="muted small">iPhone の予定とリマインダーを出すには、ショートカット「${esc(sc.sync || 'ひびの手帳 同期')}」をつくります（<a href="#/guide">つくり方</a>）。</p>`;
    return `<section class="card"><h2>${icon('cal')} 予定</h2>
      ${ev ? `<ul class="list">${ev}</ul>` : synced ? '<p class="muted small">予定はありません。</p>' : ''}
      ${rem ? `<h3>リマインダー</h3><ul class="list">${rem}</ul>` : ''}
      ${hint}
      <div class="card-foot"><span class="muted small">${synced ? 'iPhone から ' + esc(HB.labelWhen(synced)) : ''}</span>
        <span><a class="chip-btn" href="${HB.calshowUrl(v.ymd)}">カレンダーApp</a> <button class="chip-btn" data-act="runSync">iPhoneと同期</button></span></div></section>`;
  }

  function briefingCards(v) {
    const b = v.briefing;
    if (!b) {
      if (!v.isToday) return '';
      const last = S.st.lastRun && S.st.lastRun.at;
      return `<section class="card"><h2>${icon('news')} けさのまとめ</h2><p class="muted small">今日のまとめは、まだ届いていません。毎朝 6 時ごろ、Claude がメール・AI・ニュースをまとめてここに出します。${last ? '（前回：' + esc(HB.labelWhen(last)) + '）' : ''}</p></section>`;
    }
    const when = b.runAt ? `<small class="muted">${esc(HB.labelWhen(b.runAt))} Claude</small>` : '';
    const link = (u, inner) => (HB.safeUrl(u) ? `<a href="${esc(HB.safeUrl(u))}" target="_blank" rel="noopener">${inner}</a>` : inner);
    const out = [];
    if (b.gmail && b.gmail.length) {
      out.push(`<section class="card"><h2>${icon('mail')} メール ${when}</h2><ul class="news">${b.gmail.map(m => `<li>
        ${link(m.url, `<b>${esc(m.subject)}</b>`)}<div class="meta">${esc(m.from)}${m.action ? ` <span class="tag ${/返信|対応|提出|期限/.test(m.action) ? 'hot' : ''}">${esc(m.action)}</span>` : ''}${m.due ? ` <span class="tag due">${HB.labelShort(m.due)}まで</span>` : ''}</div>
        ${m.summary ? `<p>${esc(m.summary)}</p>` : ''}</li>`).join('')}</ul></section>`);
    }
    const news = (title, ic, list) => (list && list.length ? `<section class="card"><h2>${icon(ic)} ${title} ${when}</h2><ul class="news">${list.map(n => `<li>
      ${link(n.url, `<b>${esc(n.title)}</b>`)}${n.summary ? `<p>${esc(n.summary)}</p>` : ''}${n.source ? `<div class="meta">${esc(n.source)}</div>` : ''}</li>`).join('')}</ul></section>` : '');
    out.push(news('AI のうごき', 'ai', b.ai));
    out.push(news('ニュース', 'news', b.news));
    if (!v.isToday && b.summary) out.unshift(`<section class="card hitokoto"><div class="label">${icon('sun')} この日のひとこと</div><p>${esc(b.summary)}</p></section>`);
    return out.join('');
  }

  function footInfo(ymd) {
    const st = S.st, lr = st.lastRun;
    const bits = [];
    if (lr && lr.at) bits.push(`Claude の整理：${esc(HB.labelWhen(lr.at))}（資料 ${lr.files || 0}・メモ ${lr.memos || 0}・確認 ${lr.proposals || 0}）`);
    return `<p class="foot muted small">${bits.join('<br>')}${bits.length ? '<br>' : ''}<a href="#/cal/${ymd.slice(0, 7)}">${icon('cal', 14)} カレンダーで見る</a></p>`;
  }

  function proposalCard(p) {
    const t = HB.proposalTarget(S.st, p);
    let target = '';
    if (t.kind === 'item' && t.item) target = `<button class="prop-target" data-act="openItem" data-id="${t.item.id}"><img data-thumb="${t.item.id}" alt=""><span>${esc(t.item.title || t.item.name)}</span></button>`;
    else if (t.kind === 'memo' && t.memo) target = `<button class="prop-target memo" data-act="openMemo" data-id="${t.memo.id}"><span>${esc(HB.memoTitle(t.memo))}</span></button>`;
    else if (t.kind === 'mail') target = `<div class="prop-target mail">${icon('mail', 16)} ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.subject || 'メールを開く')}</a>` : esc(t.subject)}</div>`;
    const opts = p.options.map((o, i) => `<button class="${i === 0 ? 'primary' : ''}" data-act="answer" data-id="${p.id}" data-opt="${i}">${o.ios ? icon(o.ios.type === 'event' ? 'cal' : 'bell', 15) + ' ' : ''}${esc(o.label)}</button>`).join('');
    return `<div class="prop" data-pid="${p.id}"><p class="prop-q">${esc(p.question)}</p>${p.context ? `<p class="prop-ctx">${esc(p.context)}</p>` : ''}${target}
      <div class="prop-opts">${opts}</div>
      ${p.rule ? `<label class="remember"><input type="checkbox" data-remember="${p.id}"> 今後もこうする：${esc(p.rule)}</label>` : ''}
      <div class="prop-foot"><button class="link" data-act="snooze" data-id="${p.id}">あとで</button><button class="link" data-act="dismiss" data-id="${p.id}">${p.kind === 'category' ? '自分で決める' : '却下'}</button></div></div>`;
  }

  /* ── 部品 ── */

  function catChip(name) {
    if (!name) return '';
    return `<span class="cat c${HB.catIndex(name, S.st.settings.categories)}">${esc(name)}</span>`;
  }
  function datesLine(dates) {
    if (!dates || !dates.length) return '';
    const t = HB.today();
    const shown = dates.slice(0, 3).map(d => `<span class="date ${d === t ? 'today' : d < t ? 'past' : ''}">${HB.labelShort(d)}</span>`).join('');
    return `<span class="dates">${shown}${dates.length > 3 ? `<span class="date">ほか${dates.length - 3}</span>` : ''}</span>`;
  }

  function memoCard(m) {
    const body = HB.memoBody(m);
    const source = m.categorySource === 'claude' ? ' <small class="muted">Claude</small>' : '';
    return `<div class="memo" data-act="openMemo" data-id="${m.id}">
      <button class="star ${m.important ? 'on' : ''}" data-act="toggleStar" data-id="${m.id}" aria-label="重要">${icon('star', 18)}</button>
      <div class="memo-main"><b>${esc(HB.memoTitle(m))}</b>${body ? `<p>${esc(body)}</p>` : ''}
      <div class="memo-foot">${catChip(m.category)}${source}${m.needsDecision ? '<span class="tag">分類を確認中</span>' : ''}${datesLine(m.dates)}</div></div></div>`;
  }

  function itemThumb(i) {
    const badge = i.kind === 'pdf' ? '<span class="badge">PDF</span>' : i.status === 'inbox' ? '<span class="badge new">受信箱</span>' : i.status === 'pending' ? '<span class="badge ask">確認待ち</span>' : '';
    return `<button class="thumb ${i.kind}" data-act="openItem" data-id="${i.id}"><img data-thumb="${i.id}" alt="">${badge}${i.important ? `<span class="pin">${icon('star', 14)}</span>` : ''}<span class="t">${esc(i.title || i.name)}</span></button>`;
  }

  /* ── カレンダー ── */

  function viewCal(ym) {
    const marks = HB.monthMarks(S.st, ym), t = HB.today();
    const head = HB.WD.map((w, i) => `<div class="wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</div>`).join('');
    const cells = HB.monthGrid(ym).map(w => w.map(c => {
      const m = marks[c.ymd], wd = HB.weekday(c.ymd);
      const dots = m ? `<span class="dots">${m.ev ? '<i class="d-ev"></i>' : ''}${m.memo ? '<i class="d-memo"></i>' : ''}${m.item ? '<i class="d-item"></i>' : ''}</span>` : '';
      return `<button class="cell ${c.inMonth ? '' : 'out'} ${c.ymd === t ? 'today' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}" data-act="goDay" data-ymd="${c.ymd}">
        <span class="n">${Number(c.ymd.slice(8))}</span>${m && m.star ? `<span class="st">${icon('star', 10)}</span>` : ''}${dots}</button>`;
    }).join('')).join('');
    // この月の一覧（印のある日）
    const days = Object.keys(marks).sort();
    const agenda = days.map(d => {
      const v = HB.dayView(S.st, d);
      const rows = [].concat(
        v.events.map(e => `<li><i class="d-ev"></i>${e.allDay ? '' : `<span class="muted">${esc(e.t0)}</span> `}${esc(e.title)}</li>`),
        v.memos.map(m => `<li><i class="d-memo"></i>${m.important ? '★ ' : ''}${esc(HB.memoTitle(m))}</li>`),
        v.items.map(i => `<li><i class="d-item"></i>${i.important ? '★ ' : ''}${esc(i.title || i.name)}${i.dateNotes && i.dateNotes[d] ? ` <span class="muted">（${esc(i.dateNotes[d])}）</span>` : ''}</li>`)
      ).slice(0, 8).join('');
      return `<button class="ag-day ${d < t ? 'past' : ''}" data-act="goDay" data-ymd="${d}"><span class="ag-date">${HB.labelShort(d)}</span><ul>${rows}</ul></button>`;
    }).join('');
    return `<div class="cal card"><div class="cal-grid">${head}${cells}</div>
      <div class="legend muted small"><span><i class="d-ev"></i>予定</span><span><i class="d-memo"></i>メモ</span><span><i class="d-item"></i>画像・資料</span><span>${icon('star', 10)} 重要</span></div></div>
      ${agenda ? `<section class="card agenda"><h2>この月</h2>${agenda}</section>` : '<p class="muted small center">この月に、日付つきのものはまだありません。</p>'}`;
  }

  /* ── メモ ── */

  function viewMemos() {
    const st = S.st, u = S.ui;
    const list = HB.filterMemos(st.memos, { filter: u.memoFilter, category: u.memoCat, q: u.memoQ });
    const chip = (f, label, cat) => {
      const on = u.memoFilter === f && (f !== 'cat' || u.memoCat === cat);
      return `<button class="fchip ${on ? 'on' : ''}" data-act="memoFilter" data-f="${f}" data-cat="${esc(cat || '')}">${label}</button>`;
    };
    const chips = [chip('all', 'すべて'), chip('star', '★ 重要'), chip('dated', '日付つき'), chip('uncat', '分類なし')]
      .concat(st.settings.categories.map(c => chip('cat', esc(c.name), c.name))).concat([chip('archived', 'しまったもの')]).join('');
    return `<div class="toolbar"><input type="search" class="search" data-input="memoQ" placeholder="メモをさがす" value="${esc(u.memoQ)}" aria-label="メモをさがす"></div>
      <div class="fchips">${chips}</div>
      <div class="list-wrap">${list.map(memoCard).join('') || '<p class="muted small center">メモはありません。右下の ＋ から書けます。</p>'}</div>`;
  }

  /* ── 画像・資料 ── */

  function viewLibrary() {
    const st = S.st, u = S.ui;
    const list = HB.filterItems(st.items, { status: u.libStatus, category: u.libCat, q: u.libQ });
    const n = s => st.items.filter(i => i.status === s).length;
    const chip = (s, label, cat) => {
      const on = u.libStatus === s && (s !== 'cat' || u.libCat === cat);
      return `<button class="fchip ${on ? 'on' : ''}" data-act="libFilter" data-s="${s}" data-cat="${esc(cat || '')}">${label}</button>`;
    };
    const chips = [chip('all', 'すべて'), chip('inbox', `受信箱 ${n('inbox')}`), chip('pending', `確認待ち ${n('pending')}`), chip('star', '★ 重要')]
      .concat(st.settings.categories.map(c => chip('cat', esc(c.name), c.name))).concat([chip('archived', 'しまったもの')]).join('');
    const drive = st.folders && st.folders.inbox ? `<a href="https://drive.google.com/drive/folders/${esc(st.folders.inbox)}" target="_blank" rel="noopener">ドライブの受信箱</a>` : '';
    return `<div class="add-row"><button class="primary" data-act="pick" data-which="camera">${icon('camera', 18)} 撮る</button><button data-act="pick" data-which="photo">${icon('photo', 18)} 写真</button><button data-act="pick" data-which="file">${icon('file', 18)} PDF</button></div>
      <p class="muted small">受信箱のものは、次の朝 Claude が読んで分類し、日付があればその日に出します。${drive}</p>
      <div class="toolbar"><input type="search" class="search" data-input="libQ" placeholder="題名・中身でさがす" value="${esc(u.libQ)}" aria-label="資料をさがす"></div>
      <div class="fchips">${chips}</div>
      <div class="grid lib">${list.map(itemThumb).join('') || '<p class="muted small center wide">ここにはまだありません。</p>'}</div>`;
  }

  /* ── 設定 ── */

  function viewSettings() {
    const st = S.st, s = st.settings, c = HB.api.conn() || {};
    const sc = s.shortcuts || {};
    const b = s.briefing || {};
    const cats = s.categories.map((x, i) => `<div class="cat-row" data-i="${i}"><span class="cat c${HB.catIndex(x.name, s.categories)}">&nbsp;</span>
      <input class="cName" value="${esc(x.name)}" aria-label="分類の名前"><input class="cHint" value="${esc(x.hint || '')}" placeholder="どんなものか（Claude へのヒント）" aria-label="ヒント">
      <button class="iconbtn" data-act="catUp" data-i="${i}" aria-label="上へ">${icon('up', 16)}</button><button class="iconbtn" data-act="catDel" data-i="${i}" aria-label="消す">${icon('x', 16)}</button></div>`).join('');
    const rules = s.rules.map((r, i) => `<li><span>${esc(r)}</span><button class="iconbtn" data-act="ruleDel" data-i="${i}" aria-label="消す">${icon('x', 16)}</button></li>`).join('');
    const lr = st.lastRun || {};
    return `<div class="settings">
      <section class="card"><h2>裏側（Google ドライブ）</h2>
        ${S.demo ? '<p class="muted small">おためし中です。</p>' : `<p class="small">URL：<code class="wrap">${esc(c.url || '')}</code></p><p class="small">合言葉：<code>${esc(String(c.token || '').slice(0, 6))}…</code></p>`}
        <div class="btns"><button data-act="reconnect">つなぎなおす</button><button data-act="syncRun">いま取り込む</button>${st.folders && st.folders.root ? `<a class="btn" href="https://drive.google.com/drive/folders/${esc(st.folders.root)}" target="_blank" rel="noopener">ドライブのフォルダ</a>` : ''}</div>
        <p class="muted small">Claude の整理：${lr.at ? esc(HB.labelWhen(lr.at)) + `（資料 ${lr.files || 0}・メモ ${lr.memos || 0}・確認 ${lr.proposals || 0}）` : 'まだ'}${st.exportedAt ? `　Claude へのデータ：${esc(HB.labelWhen(st.exportedAt))}` : ''}</p>
        ${(st.outboxErrors || []).length ? `<p class="small err">読めなかった Claude の結果：${st.outboxErrors.map(e => esc(e.name)).join('、')}</p>` : ''}
      </section>
      <section class="card"><h2>iPhone 連携（ショートカット）</h2>
        <p class="small">iPhone のカレンダー・リマインダーとは、ショートカットApp でつなぎます。<a href="#/guide">つくり方を見る</a></p>
        <label class="small">同期のショートカットの名前<input id="sSync" value="${esc(sc.sync || '')}"></label>
        <label class="small">受信箱へ送るショートカットの名前<input id="sSend" value="${esc(sc.send || '')}"></label>
        <label class="small">iPhone に登録するショートカットの名前<input id="sAdd" value="${esc(sc.add || '')}"></label>
        <div class="btns"><button data-act="saveShortcuts">名前を保存</button><button data-act="runSync">いま同期する</button></div>
        <p class="muted small">iPhone から：${st.ios && st.ios.syncedAt ? esc(HB.labelWhen(st.ios.syncedAt)) + `（予定 ${st.ios.events.length}・リマインダー ${st.ios.reminders.length}）` : 'まだ'}</p>
      </section>
      <section class="card"><h2>カレンダー購読（おこのみで）</h2>
        <p class="small">日付をつけたメモ・写真を、iPhone のカレンダーにも出せます（見るだけ）。</p>
        <p class="small">${S.feedUrl ? `<button class="copy" data-copy="${esc(S.feedUrl)}">${esc(S.feedUrl)}</button>` : '<span class="muted">URL を読みこみ中…</span>'}</p>
        <p class="muted small">コピー → 設定App →「カレンダー」→「カレンダーアカウント」→「アカウントを追加」→「その他」→「照会するカレンダーを追加」に貼る。</p>
      </section>
      <section class="card"><h2>分類</h2><p class="muted small">Claude はこの中から選びます。ヒントを書くと、分け方が上手になります。</p>
        <div id="cats">${cats}</div>
        <div class="btns"><button data-act="catAdd">分類を足す</button><button class="primary" data-act="saveCats">分類を保存</button></div></section>
      <section class="card"><h2>Claude が覚えた決まり</h2><p class="muted small">「今後もこうする」を選ぶと、ここに入ります。自分で書き足しても OK。</p>
        <ul class="rules">${rules || '<li class="muted small">まだありません</li>'}</ul>
        <div class="inline"><input id="ruleNew" placeholder="例：保育園のおたよりは「家族・子ども」"><button data-act="ruleAdd">足す</button></div></section>
      <section class="card"><h2>けさのまとめ</h2>
        <label class="small">ニュースの話題（1行に1つ）<textarea id="bNews" rows="3">${esc((b.news || []).join('\n'))}</textarea></label>
        <label class="small">AI の話題（1行に1つ）<textarea id="bAi" rows="2">${esc((b.ai || []).join('\n'))}</textarea></label>
        <label class="small">メールのさがし方（Gmail の検索の書き方）<input id="bGmail" value="${esc(b.gmailQuery || '')}"></label>
        <div class="inline small">件数　ニュース <input id="bMaxNews" type="number" min="0" max="10" value="${b.maxNews}"> AI <input id="bMaxAi" type="number" min="0" max="10" value="${b.maxAi}"> メール <input id="bMaxGmail" type="number" min="0" max="15" value="${b.maxGmail}"></div>
        <div class="btns"><button class="primary" data-act="saveBriefing">保存</button></div></section>
      <section class="card"><h2>この端末</h2>
        <div class="btns"><button data-act="exportJson">全部を書き出す（JSON）</button><button data-act="clearCache">この端末の控えを消す</button><button data-act="disconnect">接続をはずす</button></div>
        <p class="muted small">ひびの手帳 ${esc(st.version || '')}　データは自分の Google ドライブ（「ひびの手帳」フォルダ）にあります。</p></section>
    </div>`;
  }

  /* ── ショートカットのつくり方 ── */

  function viewGuide() {
    const c = HB.api.conn() || {}, sc = (S.st && S.st.settings.shortcuts) || {};
    const vals = { URL: c.url, TOKEN: c.token, SYNC: sc.sync, SEND: sc.send, ADD: sc.add, ICS: S.feedUrl };
    const fill = s => {
      const parts = [];
      let last = 0;
      s.replace(/\{(URL|TOKEN|SYNC|SEND|ADD|ICS)\}/g, (m, k, at) => {
        parts.push(esc(s.slice(last, at)));
        const v = vals[k];
        parts.push(v ? (['URL', 'TOKEN', 'ICS'].includes(k) ? `<button class="copy" data-copy="${esc(v)}">${esc(v)}</button>` : esc(v)) : `<span class="muted">${esc(HB.guide.LABELS[k])}</span>`);
        last = at + m.length;
        return m;
      });
      parts.push(esc(s.slice(last)));
      return parts.join('');
    };
    const table = fields => `<table class="fields"><tbody>${fields.map(([k, v]) => `<tr><th><button class="copy key" data-copy="${esc(k)}">${esc(k)}</button></th><td>${fill(v)}</td></tr>`).join('')}</tbody></table>`;
    const toc = HB.guide.SECTIONS.filter(s => s.id !== 'tips').map(s => `<button class="chip-btn" data-act="scrollTo" data-id="g-${s.id}">${fill(s.title.split('：')[0])}</button>`).join('');
    return `<div class="guide"><div class="toc">${toc}</div>${HB.guide.SECTIONS.map(sec => {
      let n = 0;
      const steps = sec.steps.map(HB.guide.norm).map(st => {
        const cls = st.sub ? 'sub' : sec.plain ? 'plain' : '';
        const num = !st.sub && !sec.plain ? ` data-n="${++n}"` : '';
        return `<li class="${cls}"${num}>${fill(st.t)}${st.fields ? table(st.fields) : ''}</li>`;
      }).join('');
      return `<section class="card" id="g-${sec.id}"><h2>${fill(sec.title)}</h2>${sec.lead ? `<p class="small">${fill(sec.lead)}</p>` : ''}<ol class="steps">${steps}</ol>
        ${sec.after ? `<h3>できたら</h3><ul class="after">${sec.after.map(a => `<li>${fill(a)}</li>`).join('')}</ul>` : ''}</section>`;
    }).join('')}</div>`;
  }

  /* ───── シート（下から出る画面） ───── */

  function openSheet(html, cls) {
    const el = $('#sheet');
    el.className = 'sheet ' + (cls || '');
    el.innerHTML = `<div class="sheet-back" data-act="closeSheet"></div><div class="sheet-body" role="dialog" aria-modal="true">${html}</div>`;
    el.hidden = false;
    S.sheetOpen = true;
    document.body.classList.add('noscroll');
    loadThumbs(el);
  }
  function closeSheet(silent) {
    const el = $('#sheet');
    if (!el || el.hidden) { S.sheetOpen = false; return; }
    el.hidden = true; el.innerHTML = '';
    S.sheetOpen = false; S.edit = null; S.upload = null;
    document.body.classList.remove('noscroll');
    if (S.dirtyWhileSheet && !silent) { S.dirtyWhileSheet = false; softRender(); }
  }

  function addMenu(ymd) {
    const d = ymd && ymd !== HB.today() ? `<p class="muted small center">${HB.labelDay(ymd)} に入れます</p>` : '';
    openSheet(`<div class="menu">${d}
      <button data-act="newMemo" data-ymd="${ymd || ''}">${icon('memo')} メモを書く</button>
      <button data-act="pick" data-which="camera" data-ymd="${ymd || ''}">${icon('camera')} 写真を撮る</button>
      <button data-act="pick" data-which="photo" data-ymd="${ymd || ''}">${icon('photo')} 写真を選ぶ</button>
      <button data-act="pick" data-which="file" data-ymd="${ymd || ''}">${icon('file')} PDF・ファイルを選ぶ</button>
      <button class="ghost" data-act="closeSheet">やめる</button></div>`, 'small');
  }

  /* ── メモの編集 ── */

  function openMemo(id, ymd) {
    const st = S.st;
    const m = id ? st.memos.find(x => x.id === id) : null;
    const rec = m ? JSON.parse(JSON.stringify(m)) : { id: HB.uid('m_'), text: '', important: false, dates: ymd ? [ymd] : [], category: '', categorySource: '', tags: [], archived: false };
    S.edit = { kind: 'memo', rec, isNew: !m };
    openSheet(memoEditor(), 'full');
    const ta = $('#mText');
    if (!m) setTimeout(() => ta && ta.focus(), 150);
  }

  function memoEditor() {
    const r = S.edit.rec, s = S.st.settings;
    const opts = s.categories.map(c => `<option value="${esc(c.name)}" ${r.category === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const note = r.categorySource === 'claude' ? '<small class="muted">Claude が分類しました。変えると「自分で決めた」になります。</small>' : r.needsDecision ? '<small class="muted">Claude が決めきれず、「確認してほしいこと」に出しています。</small>' : '';
    return `<div class="sheet-head"><button class="link" data-act="closeSheet">閉じる</button><b>${S.edit.isNew ? '新しいメモ' : 'メモ'}</b><button class="primary" data-act="saveMemo">保存</button></div>
      <div class="sheet-scroll">
      <textarea id="mText" rows="7" placeholder="メモ（1行目が題名になります）">${esc(r.text)}</textarea>
      <button class="toggle ${r.important ? 'on' : ''}" data-act="mStar">${icon('star', 18)} 重要メモ</button>
      ${datesField('m', r.dates)}
      <label class="field">分類<select id="mCat"><option value="">おまかせ（Claude が分類）</option>${opts}</select>${note}</label>
      ${r.tags && r.tags.length ? `<p class="small">${r.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join(' ')}</p>` : ''}
      <div class="field"><span class="flabel">iPhone に登録</span><div class="btns"><button data-act="mToIos" data-type="reminder">${icon('bell', 16)} リマインダーに</button><button data-act="mToIos" data-type="event">${icon('cal', 16)} カレンダーに</button></div></div>
      ${S.edit.isNew ? '' : `<div class="field btns danger"><button data-act="mArchive">${r.archived ? 'しまったのをもどす' : 'しまう'}</button><button data-act="mDelete">消す</button></div>`}
      </div>`;
  }

  function datesField(prefix, dates) {
    const chips = (dates || []).map(d => `<span class="dchip">${HB.labelShort(d)}<button data-act="${prefix}DelDate" data-ymd="${d}" aria-label="${d} をはずす">${icon('x', 14)}</button></span>`).join('');
    return `<div class="field"><span class="flabel">日付（その日を開くと出ます）</span><div class="dchips" id="${prefix}Dates">${chips || '<span class="muted small">なし</span>'}</div>
      <div class="date-add"><button data-act="${prefix}AddDate" data-v="today">今日</button><button data-act="${prefix}AddDate" data-v="tomorrow">明日</button>
      <input type="date" id="${prefix}DateIn" aria-label="日付を選ぶ"><button data-act="${prefix}AddDate" data-v="input">追加</button></div></div>`;
  }
  function refreshDates(prefix, dates) {
    const box = $('#' + prefix + 'Dates');
    if (!box) return;
    box.innerHTML = (dates || []).map(d => `<span class="dchip">${HB.labelShort(d)}<button data-act="${prefix}DelDate" data-ymd="${d}" aria-label="${d} をはずす">${icon('x', 14)}</button></span>`).join('') || '<span class="muted small">なし</span>';
  }
  function dateFromButton(el, prefix) {
    const v = el.dataset.v;
    if (v === 'today') return HB.today();
    if (v === 'tomorrow') return HB.addDays(HB.today(), 1);
    const inp = $('#' + prefix + 'DateIn');
    return inp && HB.isYmd(inp.value) ? inp.value : '';
  }

  async function saveMemo() {
    const e = S.edit;
    if (!e || e.kind !== 'memo') return;
    const text = $('#mText').value.replace(/\s+$/, '');
    if (!text.trim()) { toast('メモが空です'); return; }
    const cat = $('#mCat').value;
    const r = e.rec;
    const payload = { id: r.id, text, important: !!r.important, dates: r.dates, category: cat };
    if (e.isNew) payload.createdAt = new Date().toISOString();
    if (blockDemo()) return;
    const local = Object.assign({}, r, { text, category: cat, categorySource: cat ? 'manual' : (cat === r.category ? r.categorySource : ''), updatedAt: new Date().toISOString(), title: r.title && text.split('\n')[0].trim() === (r.text || '').split('\n')[0].trim() ? r.title : '' });
    HB.upsert(S.st.memos, local);
    closeSheet();
    render();
    await sendMemo(payload, e.isNew ? 'メモを保存しました' : '保存しました');
  }

  /** メモを送る。電波がないときは、ためておく */
  async function sendMemo(payload, msg) {
    try {
      const r = await HB.api.call('memo.save', { memo: payload });
      HB.upsert(S.st.memos, r.memo);
      if (r.rev) S.st.rev = r.rev;
      HB.api.saveState(S.st);
      if (msg) toast(msg);
      softRender();
    } catch (err) {
      if (err.net) { HB.api.enqueue('memo.save', { memo: payload }); HB.api.saveState(S.st); toast('電波がないので、つながったら送ります'); softRender(); }
      else toast(err.message, 'err');
    }
  }

  /* ── 資料を見る・直す ── */

  function openItem(id) {
    const it = S.st.items.find(x => x.id === id);
    if (!it) return;
    S.edit = { kind: 'item', rec: JSON.parse(JSON.stringify(it)) };
    openSheet(itemViewer(), 'full');
    if (it.kind === 'photo') loadFull(it);
  }

  function itemViewer() {
    const r = S.edit.rec, s = S.st.settings;
    const opts = s.categories.map(c => `<option value="${esc(c.name)}" ${r.category === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const drive = r.fileId && !S.demo ? `https://drive.google.com/file/d/${encodeURIComponent(r.fileId)}/view` : '';
    const status = { inbox: '受信箱（次の朝 Claude が整理）', pending: '確認待ち（分類を選んでください）', organized: '整理済み', archived: 'しまったもの' }[r.status] || '';
    const sugg = r.status === 'pending' && r.suggestedCategory ? `<small class="muted">Claude の候補：${esc(r.suggestedCategory)}</small>` : r.categorySource === 'claude' ? '<small class="muted">Claude が分類しました</small>' : '';
    const notes = r.dateNotes ? Object.keys(r.dateNotes).sort().map(d => `<li>${HB.labelShort(d)}：${esc(r.dateNotes[d])}</li>`).join('') : '';
    return `<div class="sheet-head"><button class="link" data-act="closeSheet">閉じる</button><b>${r.kind === 'pdf' ? 'PDF' : r.kind === 'photo' ? '写真' : 'ファイル'}</b><button class="primary" data-act="saveItem">保存</button></div>
      <div class="sheet-scroll">
      <div class="viewer ${r.kind}">${r.kind === 'photo' ? `<img id="vImg" data-thumb="${r.id}" alt="">` : `<img data-thumb="${r.id}" alt=""><div class="pdf-ic">${icon('file', 40)}</div>`}</div>
      ${drive ? `<p class="center"><a class="btn" href="${drive}" target="_blank" rel="noopener">ドライブで開く</a></p>` : ''}
      <p class="muted small center">${esc(status)}</p>
      <label class="field">題名<input id="iTitle" value="${esc(r.title || '')}"></label>
      ${r.summary ? `<div class="summary"><span class="flabel">Claude の要約</span><p>${esc(r.summary)}</p>${notes ? `<ul class="small">${notes}</ul>` : ''}</div>` : ''}
      ${r.text || r.ocr ? `<details class="ocr"><summary>読みとった文字</summary><pre>${esc(r.text || r.ocr)}</pre></details>` : ''}
      <button class="toggle ${r.important ? 'on' : ''}" data-act="iStar">${icon('star', 18)} 重要</button>
      ${datesField('i', r.dates)}
      ${r.suggestedDates && r.suggestedDates.length ? `<p class="small muted">Claude が見つけた日付：${r.suggestedDates.map(x => `<button class="chip-btn" data-act="iAddSugg" data-ymd="${x.date}">＋${HB.labelShort(x.date)}${x.reason ? ' ' + esc(x.reason) : ''}</button>`).join(' ')}</p>` : ''}
      <label class="field">分類<select id="iCat"><option value="">おまかせ（Claude が分類）</option>${opts}</select>${sugg}</label>
      <label class="field">メモ（Claude へのヒントにもなります）<textarea id="iNote" rows="2">${esc(r.note || '')}</textarea></label>
      <div class="field btns danger"><button data-act="iArchive">${r.status === 'archived' ? 'しまったのをもどす' : 'しまう'}</button><button data-act="iDelete">消す（ドライブではゴミ箱へ）</button></div>
      </div>`;
  }

  async function loadFull(it) {
    if (S.demo) return;
    let url = S.full.get(it.id);
    if (!url) {
      try {
        const r = await HB.api.call('item.file', { id: it.id }, { timeout: 60000 });
        if (r.data && /^image\//.test(r.mime)) { url = `data:${r.mime};base64,${r.data}`; S.full.set(it.id, url); }
      } catch (e) { /* サムネイルのまま */ }
    }
    const img = $('#vImg');
    if (url && img && S.edit && S.edit.rec.id === it.id) img.src = url;
  }

  async function saveItem() {
    const e = S.edit;
    if (!e || e.kind !== 'item') return;
    const r = e.rec, orig = S.st.items.find(x => x.id === r.id) || {};
    const patch = {};
    const title = $('#iTitle').value.trim();
    if (title && title !== orig.title) patch.title = title;
    const note = $('#iNote').value;
    if (note !== (orig.note || '')) patch.note = note;
    if (!!r.important !== !!orig.important) patch.important = !!r.important;
    if (JSON.stringify(r.dates || []) !== JSON.stringify(orig.dates || [])) patch.dates = r.dates;
    const cat = $('#iCat').value;
    if (cat !== (orig.category || '') && (cat || orig.categorySource === 'manual' || orig.status === 'organized')) patch.category = cat;
    if (!Object.keys(patch).length) { closeSheet(); return; }
    if (blockDemo()) return;
    await itemPatch(r.id, patch, '保存しました');
    closeSheet();
  }

  async function itemPatch(id, patch, msg) {
    try {
      busy(true);
      const res = await HB.api.call('item.update', { id, patch });
      HB.upsert(S.st.items, res.item);
      if (res.rev) S.st.rev = res.rev;
      // 分類を決めたら、その資料への「分類の確認」は消える（裏側は次の bootstrap で反映）
      if (patch.category) S.st.proposals = S.st.proposals.filter(p => !(p.kind === 'category' && p.target && p.target.itemId === id));
      HB.api.saveState(S.st);
      if (msg) toast(msg);
      softRender();
      return res.item;
    } catch (err) { toast(err.message, 'err'); return null; }
    finally { busy(false); }
  }

  /* ── 写真・PDF を入れる ── */

  function pick(which, ymd) {
    S.pickYmd = ymd || (S.route.name === 'day' ? S.route.ymd : '');
    const id = which === 'camera' ? 'pickCamera' : which === 'photo' ? 'pickPhoto' : 'pickFile';
    const inp = document.getElementById(id);
    inp.value = '';
    inp.click();
  }

  async function onPicked(files) {
    files = Array.from(files || []);
    if (!files.length) return;
    closeSheet(true);
    const ymd = S.pickYmd || '';
    S.upload = { files: [], dates: ymd ? [ymd] : [], preparing: files.length };
    openSheet(uploadSheet(), 'full');
    for (const f of files) {
      try { S.upload && S.upload.files.push(await HB.image.prepare(f)); }
      catch (e) { toast(e.message, 'err'); }
      if (S.upload) { S.upload.preparing--; refreshUpload(); }
    }
  }

  function uploadSheet() {
    const u = S.upload, s = S.st.settings;
    const opts = s.categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
    return `<div class="sheet-head"><button class="link" data-act="closeSheet">やめる</button><b>受信箱へ入れる</b><span></span></div>
      <div class="sheet-scroll">
      <div class="up-prev" id="upPrev"></div>
      ${datesField('u', u.dates)}
      <p class="muted small">日付を選ばなくても、Claude が中身から日付を読みとって、その日に出します。</p>
      <label class="field">メモ（任意。Claude へのヒントにもなります）<textarea id="uNote" rows="2" placeholder="例：長男の遠足のおたより"></textarea></label>
      <label class="field">分類<select id="uCat"><option value="">おまかせ（次の朝 Claude が分類）</option>${opts}</select></label>
      <button class="primary big" id="uSend" data-act="uSend" disabled>準備中…</button>
      </div>`;
  }
  function refreshUpload() {
    const u = S.upload;
    if (!u) return;
    const prev = $('#upPrev');
    if (prev) prev.innerHTML = u.files.map(f => f.preview ? `<img src="${f.preview}" alt="">` : `<div class="fileprev">${icon('file', 28)}<span>${esc(f.name)}</span></div>`).join('') + (u.preparing > 0 ? '<div class="fileprev"><div class="spinner"></div></div>' : '');
    const btn = $('#uSend');
    if (btn) { btn.disabled = u.preparing > 0 || !u.files.length || u.sending; btn.textContent = u.sending ? `送っています… ${u.sent}/${u.files.length}` : u.preparing > 0 ? '準備中…' : `受信箱に入れる（${u.files.length}件）`; }
  }

  async function sendUploads() {
    const u = S.upload;
    if (!u || !u.files.length) return;
    if (blockDemo()) return;
    const note = $('#uNote').value.trim(), cat = $('#uCat').value;
    u.sending = true; u.sent = 0; refreshUpload();
    let ok = 0;
    for (const f of u.files) {
      try {
        const r = await HB.api.call('item.upload', { name: f.name, mime: f.mime, data: f.data, thumb: f.thumb, dates: u.dates, note, category: cat, source: 'app' }, { timeout: 120000 });
        HB.upsert(S.st.items, r.item);
        if (r.rev) S.st.rev = r.rev;
        if (f.thumb) HB.api.thumbSet(r.item.id, f.thumb);
        ok++;
      } catch (e) { toast(`「${f.name}」を送れませんでした：${e.message}`, 'err'); }
      u.sent++; refreshUpload();
    }
    HB.api.saveState(S.st);
    closeSheet();
    if (ok) toast(cat ? `${ok}件を「${cat}」に入れました` : `${ok}件を受信箱に入れました。次の朝 Claude が整理します`);
    softRender();
  }

  /* ── iPhone に登録（ショートカット） ── */

  function runShortcut(name, payload) {
    const url = HB.shortcutUrl(name, payload);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent)) location.href = url;
    else { toast('iPhone でショートカットを呼びます（このパソコンでは動きません）'); console.log('shortcut:', url); }
    S.lastShortcut = url;
  }

  /** リマインダーは日時が要る。なければ聞く */
  function toIos(x) {
    const sc = S.st.settings.shortcuts || {};
    if (!x) return;
    if (x.type === 'reminder' && !x.due) { askDue(x); return; }
    runShortcut(sc.add || 'ひびの手帳から登録', HB.iosForShortcut(x));
  }
  function askDue(x, then) {
    const t = HB.addDays(HB.today(), 1) + 'T08:00';
    S.askDue = { ios: x, then };
    openSheet(`<div class="sheet-head"><button class="link" data-act="closeSheet">やめる</button><b>リマインダー</b><span></span></div>
      <div class="sheet-scroll"><p><b>${esc(x.title)}</b></p><label class="field">いつ知らせる？<input type="datetime-local" id="rDue" value="${t}"></label>
      <button class="primary big" data-act="rGo">iPhone に登録</button></div>`, 'small');
  }

  /* ───── 確認してほしいこと ───── */

  function answer(id, opt) {
    const p = S.st.proposals.find(x => x.id === id);
    if (!p) return;
    const o = p.options[opt] || {};
    const rememberEl = document.querySelector(`[data-remember="${id}"]`);
    const remember = !!(rememberEl && rememberEl.checked);
    if (o.ios && o.ios.type === 'reminder' && !o.ios.due) { askDue(o.ios, () => { if (!blockDemo()) sendAnswer(id, opt, remember); }); return; }
    if (o.ios) toIos(o.ios);                 // 押した瞬間に呼ぶ
    if (blockDemo()) return;
    sendAnswer(id, opt, remember, !!o.ios);
  }

  async function sendAnswer(id, opt, remember, iosDone) {
    const card = document.querySelector(`[data-pid="${id}"]`);
    if (card) card.classList.add('done');
    try {
      const r = await HB.api.call('proposal.answer', { id, option: opt, remember });
      S.st.proposals = S.st.proposals.filter(x => x.id !== id);
      if (r.item) HB.upsert(S.st.items, r.item);
      if (r.memo) HB.upsert(S.st.memos, r.memo);
      if (r.rules) S.st.settings.rules = r.rules;
      if (r.rev) S.st.rev = r.rev;
      HB.api.saveState(S.st);
      softRender();
      if (!iosDone) toast(remember ? '決めました。次からも、そうします' : '決めました');
    } catch (e) { if (card) card.classList.remove('done'); toast(e.message, 'err'); }
  }

  async function dismiss(id) {
    if (blockDemo()) return;
    try {
      const r = await HB.api.call('proposal.dismiss', { id });
      S.st.proposals = S.st.proposals.filter(x => x.id !== id);
      if (r.rev) S.st.rev = r.rev;
      HB.api.saveState(S.st);
      softRender();
      toast('この確認は閉じました');
    } catch (e) { toast(e.message, 'err'); }
  }

  /* ───── 裏側から新しくする ───── */

  async function refresh(force) {
    if (S.demo || !HB.api.conn() || S.loading) return;
    if (!force && Date.now() - S.lastFetch < 30000) return;
    S.loading = true; setSync('loading');
    try {
      if (HB.api.queue().length) {
        await HB.api.flushQueue((x, r) => { if (r && r.memo && S.st) HB.upsert(S.st.memos, r.memo); });
      }
      const r = await HB.api.call('bootstrap', { rev: S.st && !HB.api.queue().length ? S.st.rev : null });
      S.lastFetch = Date.now();
      if (!r.unchanged) { S.st = r; HB.api.saveState(r); }
      setSync('ok');
      softRender();
    } catch (e) {
      setSync(e.net ? 'offline' : 'error', e.message);
      if (!S.st) { $('#view').innerHTML = `<div class="empty-state"><p>${esc(e.message)}</p><button class="primary" data-act="refresh">もう一度</button> <button data-act="reconnect">つなぎなおす</button></div>`; $('#tabs').hidden = false; }
      else softRender();
    } finally { S.loading = false; }
  }

  function setSync(state, msg) {
    S.sync = state; S.syncMsg = msg || '';
    const b = $('.sync');
    if (b) { b.className = 'iconbtn sync ' + state; b.title = msg || '新しくする'; }
  }

  async function connect() {
    const url = $('#cUrl').value.trim(), token = $('#cToken').value.trim();
    const err = $('#cErr');
    const show = m => { err.textContent = m; err.hidden = false; };
    const chk = HB.checkGasUrl(url);
    if (!chk.ok) return show(chk.why);
    if (!/^hb_/.test(token) && token.length < 16) return show('合言葉は hb_ で始まる長い文字です（showSetupInfo のログに出ます）');
    const btn = $('[data-form="connect"] button[type="submit"]');
    btn.disabled = true; btn.textContent = 'つないでいます…';
    try {
      await HB.api.call('ping', {}, { conn: { url: chk.url, token } });
      HB.api.setConn({ url: chk.url, token });
      HB.api.clearState();
      S.st = null; S.demo = false;
      go('#/today');
      await refresh(true);
      toast('つながりました');
      const here = location.origin + location.pathname;
      if (S.st && !S.st.settings.appUrl && /^https:/.test(here)) saveSettings({ appUrl: here }, 'つながりました');
    } catch (e) { show(e.message); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = 'つなぐ'; } }
  }

  function startDemo() {
    S.demo = true;
    S.st = HB.sample.build();
    if (!/demo/.test(location.search)) history.replaceState(null, '', location.pathname + '?demo#/today');
  }
  function endDemo() {
    S.demo = false; S.st = HB.api.conn() ? HB.api.cachedState() : null;
    history.replaceState(null, '', location.pathname + '#/today');
    onRoute();
    if (HB.api.conn()) refresh(true);
  }
  function blockDemo() { if (!S.demo) return false; toast('おためし中は保存しません（裏側につなぐと使えます）'); return true; }

  async function saveSettings(patch, msg) {
    if (blockDemo()) return;
    try {
      busy(true);
      const r = await HB.api.call('settings.save', { settings: Object.assign({}, S.st.settings, patch) });
      S.st.settings = r.settings;
      if (r.rev) S.st.rev = r.rev;
      HB.api.saveState(S.st);
      toast(msg || '保存しました');
      softRender();
    } catch (e) { toast(e.message, 'err'); }
    finally { busy(false); }
  }

  async function loadFeedUrl() {
    if (S.feedUrl || S.demo || !HB.api.conn() || S.feedLoading) return;
    S.feedLoading = true;
    try {
      const r = await HB.api.call('feed.info');
      S.feedUrl = HB.api.conn().url + '?feed=ics&key=' + encodeURIComponent(r.key);
      if (['guide', 'settings'].includes(S.route.name)) softRender();
    } catch (e) { /* あとで */ }
    finally { S.feedLoading = false; }
  }

  /* ───── サムネイル ───── */

  async function loadThumbs(scope) {
    const imgs = $$('img[data-thumb]', scope);
    if (!imgs.length) return;
    const need = new Set();
    for (const img of imgs) {
      const id = img.dataset.thumb;
      const it = S.st && S.st.items.find(x => x.id === id);
      if (!it) continue;
      if (it._thumb) { img.src = it._thumb; continue; }
      const c = await HB.api.thumbGet(id);
      if (c) { if (!img.src || img.id !== 'vImg' || !S.full.has(id)) img.src = c; }
      else if (!S.demo && (!S.thumbMiss.has(id) || Date.now() - S.thumbMiss.get(id) > 600000)) need.add(id);
      else img.classList.add('noimg');
    }
    const ids = Array.from(need);
    for (let i = 0; i < ids.length; i += 12) {
      const chunk = ids.slice(i, i + 12);
      try {
        const r = await HB.api.call('item.thumbs', { ids: chunk });
        chunk.forEach(id => {
          const u = r.thumbs[id];
          if (u) HB.api.thumbSet(id, u); else S.thumbMiss.set(id, Date.now());
          $$(`img[data-thumb="${id}"]`).forEach(img => { if (u) { if (!(img.id === 'vImg' && S.full.has(id))) img.src = u; } else img.classList.add('noimg'); });
        });
      } catch (e) { chunk.forEach(id => S.thumbMiss.set(id, Date.now())); }
    }
  }

  /* ───── 操作の受けつけ ───── */

  async function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const a = el.dataset.act, d = el.dataset;
    // メモのカードの中の ★ は、カードを開かない
    if (a === 'openMemo' && ev.target.closest('[data-act="toggleStar"]')) return;
    ev.preventDefault();
    const st = S.st;
    switch (a) {
      case 'go': go(d.hash); break;
      case 'goDay': go('#/day/' + d.ymd); break;
      case 'goCal': go('#/cal/' + d.ym); break;
      case 'refresh': if (S.demo) toast('おためし中です'); else refresh(true); break;
      case 'demo': startDemo(); onRoute(); break;
      case 'endDemo': endDemo(); break;
      case 'reconnect': S.st = null; S.demo = false; $('#view').innerHTML = viewWelcome(); $('#top').innerHTML = ''; $('#fab').hidden = true; break;
      case 'disconnect':
        if (!confirm('この端末の接続をはずします（データは Google ドライブに残ります）')) break;
        HB.api.clearConn(); HB.api.clearState(); await HB.api.thumbClear(); S.st = null; S.demo = false; render(); break;
      case 'clearCache': HB.api.clearState(); await HB.api.thumbClear(); S.full.clear(); toast('この端末の控えを消しました'); refresh(true); break;
      case 'exportJson': exportJson(); break;
      case 'syncRun':
        if (blockDemo()) break;
        try { busy(true); const r = await HB.api.call('sync.run', {}, { timeout: 120000 }); S.st = r; HB.api.saveState(r); toast(`取り込みました（Claude の結果 ${r.result.applied}・見つけたファイル ${r.result.found}）`); softRender(); }
        catch (e) { toast(e.message, 'err'); } finally { busy(false); }
        break;
      case 'runSync': runShortcut((st.settings.shortcuts || {}).sync || 'ひびの手帳 同期'); break;
      case 'addMenu': addMenu(d.ymd); break;
      case 'closeSheet': closeSheet(); break;
      case 'newMemo': closeSheet(true); openMemo(null, d.ymd || (S.route.name === 'day' ? S.route.ymd : '')); break;
      case 'openMemo': openMemo(d.id); break;
      case 'toggleStar': {
        const m = st.memos.find(x => x.id === d.id);
        if (!m || blockDemo()) break;
        m.important = !m.important; softRender();
        await sendMemo({ id: m.id, important: m.important }, m.important ? '重要メモにしました' : '重要メモからはずしました');
        break;
      }
      case 'saveMemo': saveMemo(); break;
      case 'mStar': S.edit.rec.important = !S.edit.rec.important; el.classList.toggle('on', S.edit.rec.important); break;
      case 'mAddDate': case 'iAddDate': case 'uAddDate': {
        const p = a[0], ymd = dateFromButton(el, p);
        if (!ymd) { toast('日付を選んでください'); break; }
        const target = p === 'u' ? S.upload : S.edit.rec;
        target.dates = HB.withDate(target.dates, ymd); refreshDates(p, target.dates); break;
      }
      case 'mDelDate': case 'iDelDate': case 'uDelDate': {
        const p = a[0], target = p === 'u' ? S.upload : S.edit.rec;
        target.dates = HB.withoutDate(target.dates, d.ymd); refreshDates(p, target.dates); break;
      }
      case 'iAddSugg': S.edit.rec.dates = HB.withDate(S.edit.rec.dates, d.ymd); refreshDates('i', S.edit.rec.dates); el.remove(); break;
      case 'mToIos': {
        const r = S.edit.rec, text = $('#mText').value;
        if (!text.trim()) { toast('メモが空です'); break; }
        const ios = HB.memoToIos(Object.assign({}, r, { text }), d.type, S.route.name === 'day' ? S.route.ymd : '');
        if (ios.type === 'reminder' && !ios.due) { if (S.demo) closeSheet(true); else await saveMemo(); askDue(ios); }
        else { toIos(ios); if (S.demo) closeSheet(); else saveMemo(); }
        break;
      }
      case 'rGo': {
        const v = $('#rDue').value;
        if (!v) { toast('日時を選んでください'); break; }
        const x = Object.assign({}, S.askDue.ios, { due: v.replace('T', ' ') });
        const then = S.askDue.then;
        closeSheet(); toIos(x);
        if (then) then();
        break;
      }
      case 'mArchive': {
        if (blockDemo()) break;
        const r = S.edit.rec; closeSheet();
        await sendMemo({ id: r.id, archived: !r.archived }, r.archived ? 'もどしました' : 'しまいました'); break;
      }
      case 'mDelete': {
        if (!confirm('このメモを消しますか？')) break;
        if (blockDemo()) break;
        const id = S.edit.rec.id; closeSheet();
        try { await HB.api.call('memo.delete', { id }); st.memos = st.memos.filter(m => m.id !== id); st.proposals = st.proposals.filter(p => !(p.target && p.target.id === id)); HB.api.saveState(st); softRender(); toast('消しました'); }
        catch (e) { if (e.net) { HB.api.enqueue('memo.delete', { id }); st.memos = st.memos.filter(m => m.id !== id); HB.api.saveState(st); softRender(); toast('つながったら消します'); } else toast(e.message, 'err'); }
        break;
      }
      case 'openItem': openItem(d.id); break;
      case 'saveItem': saveItem(); break;
      case 'iStar': S.edit.rec.important = !S.edit.rec.important; el.classList.toggle('on', S.edit.rec.important); break;
      case 'iArchive': {
        if (blockDemo()) break;
        const r = S.edit.rec; closeSheet();
        await itemPatch(r.id, { archive: r.status !== 'archived' }, r.status === 'archived' ? 'もどしました' : 'しまいました'); break;
      }
      case 'iDelete': {
        if (!confirm('この資料を消しますか？（Google ドライブではゴミ箱に入ります）')) break;
        if (blockDemo()) break;
        const id = S.edit.rec.id; closeSheet();
        try { busy(true); await HB.api.call('item.delete', { id }); st.items = st.items.filter(i => i.id !== id); st.proposals = st.proposals.filter(p => !(p.target && p.target.itemId === id)); HB.api.saveState(st); softRender(); toast('消しました'); }
        catch (e) { toast(e.message, 'err'); } finally { busy(false); }
        break;
      }
      case 'pick': pick(d.which, d.ymd); break;
      case 'uSend': sendUploads(); break;
      case 'answer': answer(d.id, Number(d.opt)); break;
      case 'dismiss': dismiss(d.id); break;
      case 'snooze': S.ui.snooze[d.id] = HB.today(); saveUi(); softRender(); toast('あしたまた出します'); break;
      case 'memoFilter': S.ui.memoFilter = d.f; S.ui.memoCat = d.cat || ''; saveUi(); render(); break;
      case 'memoFilterGo': S.ui.memoFilter = d.f; S.ui.memoCat = ''; saveUi(); go('#/memos'); break;
      case 'libFilter': S.ui.libStatus = d.s; S.ui.libCat = d.cat || ''; saveUi(); render(); break;
      case 'scrollTo': { const t = document.getElementById(d.id); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' }); break; }
      case 'saveShortcuts': saveSettings({ shortcuts: { sync: $('#sSync').value.trim(), send: $('#sSend').value.trim(), add: $('#sAdd').value.trim() } }, '名前を保存しました'); break;
      case 'catAdd': {
        const box = $('#cats'), i = box.children.length;
        box.insertAdjacentHTML('beforeend', `<div class="cat-row" data-i="${i}"><span class="cat c${i % 10}">&nbsp;</span><input class="cName" placeholder="新しい分類" aria-label="分類の名前"><input class="cHint" placeholder="どんなものか（Claude へのヒント）" aria-label="ヒント"><button class="iconbtn" data-act="catDel" data-i="${i}" aria-label="消す">${icon('x', 16)}</button></div>`);
        box.lastElementChild.querySelector('.cName').focus(); break;
      }
      case 'catDel': el.closest('.cat-row').remove(); break;
      case 'catUp': { const row = el.closest('.cat-row'); if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling); break; }
      case 'saveCats': {
        const cats = $$('#cats .cat-row').map(r => ({ name: $('.cName', r).value.trim(), hint: $('.cHint', r).value.trim() })).filter(c => c.name);
        if (!cats.length) { toast('分類が1つもありません'); break; }
        saveSettings({ categories: cats }, '分類を保存しました（ドライブにフォルダもつくりました）'); break;
      }
      case 'ruleDel': saveSettings({ rules: st.settings.rules.filter((r, i) => i !== Number(d.i)) }, '決まりを消しました'); break;
      case 'ruleAdd': { const v = $('#ruleNew').value.trim(); if (v) saveSettings({ rules: st.settings.rules.concat([v]) }, '決まりを足しました'); break; }
      case 'saveBriefing': {
        const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
        saveSettings({ briefing: { news: lines('#bNews'), ai: lines('#bAi'), gmailQuery: $('#bGmail').value.trim(), maxNews: +$('#bMaxNews').value, maxAi: +$('#bMaxAi').value, maxGmail: +$('#bMaxGmail').value } });
        break;
      }
      default: break;
    }
  }

  // コピー（data-copy）は data-act なしでも受ける
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-copy]');
    if (!el) return;
    ev.preventDefault();
    const v = el.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast('コピーしました')).catch(() => { window.prompt('コピーしてください', v); });
  });

  function onChange(ev) {
    const t = ev.target;
    if (t.id === 'pickCamera' || t.id === 'pickPhoto' || t.id === 'pickFile') onPicked(t.files);
  }
  let qTimer = null;
  function onInput(ev) {
    const t = ev.target;
    if (t.dataset.input === 'memoQ' || t.dataset.input === 'libQ') {
      S.ui[t.dataset.input] = t.value;
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        const n = $(`[data-input="${t.dataset.input}"]`);
        if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* noop */ } }
      }, 250);
    }
    if (t.matches('.quick textarea')) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
  }
  async function onSubmit(ev) {
    const f = ev.target;
    if (f.dataset.form === 'connect') { ev.preventDefault(); connect(); }
    if (f.dataset.form === 'quickMemo') {
      ev.preventDefault();
      const ta = $('textarea', f), text = ta.value.trim();
      if (!text) return;
      if (blockDemo()) return;
      const memo = { id: HB.uid('m_'), text, important: false, dates: [f.dataset.ymd], category: '', createdAt: new Date().toISOString() };
      HB.upsert(S.st.memos, Object.assign({ categorySource: '', tags: [], archived: false, updatedAt: memo.createdAt }, memo));
      ta.value = '';
      softRender();
      await sendMemo(memo, 'メモを追加しました');
    }
  }
  function saveUi() {
    const keep = {};
    const t = HB.today();
    Object.keys(S.ui.snooze || {}).forEach(k => { if (S.ui.snooze[k] === t) keep[k] = t; });
    S.ui.snooze = keep;
    HB.api.saveUi(S.ui);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(S.st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hibi-' + HB.today() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  /* ───── 左右のスワイプで、前の日・次の日 ───── */
  function setupSwipe() {
    let x0 = 0, y0 = 0, t0 = 0;
    document.addEventListener('touchstart', e => { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    document.addEventListener('touchend', e => {
      if (S.sheetOpen || !['today', 'day'].includes(S.route.name)) return;
      if (e.target.closest('input, textarea, select, .grid, .prop-opts')) return;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Date.now() - t0 > 600 || Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
      const ymd = S.route.name === 'today' ? HB.today() : S.route.ymd;
      go('#/day/' + HB.addDays(ymd, dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ───── 小さな表示 ───── */

  let toastTimer = null;
  function toast(msg, kind) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, kind === 'err' ? 5000 : 2600);
  }
  let busyN = 0;
  function busy(on) { busyN = Math.max(0, busyN + (on ? 1 : -1)); document.body.classList.toggle('busy', busyN > 0); }

  const ICONS = {
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
    up: '<path d="M18 15l-6-6-6 6"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    memo: '<path d="M6 3.5h9l3.5 3.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
    photo: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', file: '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>', news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    ai: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3.5V7M9 12h.01M15 12h.01M9.5 15.5h5"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    ask: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8h.01"/>', bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8M8 11h6"/>'
  };
  function icon(name, size) {
    const s = size || 20;
    return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }
  HB.icon = icon;

  // テスト用に中をのぞけるようにしておく（画面の動作には使わない）
  window.__hibi = { S, render, refresh, go };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
