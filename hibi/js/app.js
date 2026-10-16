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
    full: new Map(), thumbMiss: new Map(), feedUrl: '', backHash: '#/today', calWeeks: null,
    ui: Object.assign({ memoFilter: 'all', memoCat: '', memoQ: '', libStatus: 'all', libCat: '', libQ: '', snooze: {}, calColors: {} }, HB.api.ui())
  };

  /** カレンダー（リマインダーのリスト）の色の番号。設定で選んだ色（この端末）、なければ名前から */
  const colorOf = name => { const c = S.ui.calColors && S.ui.calColors[name]; return Number.isInteger(c) && c >= 0 && c < 10 ? c : HB.colorIndex(name); };
  /** '08:15' → '8:15' */
  const hm = s => String(s || '').replace(/^0(\d)/, '$1');

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
    // 画面の高さが変わったら（回転・Safari のバーの出し入れ）、月のカレンダーの帯を並べなおす
    let rz = null;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (S.route.name === 'cal') { const snap = calSnap(); layoutMonth(); if (!calRestore(snap)) calFill(); } }, 120); });
    window.addEventListener('scroll', calOnScroll, { passive: true });
    setupSwipe();
    setupSheetDrag();
    registerSW();
    if (/demo/.test(location.search) && !HB.api.conn()) startDemo();
    else if (/demo/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    else if (HB.api.conn()) { S.st = HB.api.cachedState(); keepStorage(); }
    onRoute();
    if (!S.demo && HB.api.conn()) refresh(true);
    // 0時をまたいだら「今日」を描きなおす
    setInterval(() => {
      if (S.route.name !== 'today' || S.sheetOpen) return;
      if (S.renderedToday !== HB.today()) { render(); return; }
      const u = $('.upnext'), html = upNext(HB.dayView(S.st, HB.today()));
      if (u) u.outerHTML = html || ''; else if (html) { const h = $('.hero-head'); if (h) h.insertAdjacentHTML('afterend', html); }
    }, 60000);
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
  function onRoute() {
    const prev = S.route;
    S.route = parseRoute();
    // 設定から「もどる」で、来たところへ帰る
    if (S.route.name === 'settings' && prev && !['settings', 'guide'].includes(prev.name)) S.backHash = hashOf(prev);
    closeSheet(true); render();
    if (S.route.name === 'cal') calScrollTo(S.route.ym); else window.scrollTo(0, 0);
    // 日を移ったときは、その向きに少しすべらせる
    const v = $('#view'), dayOf = x => (x.name === 'today' ? HB.today() : x.name === 'day' ? x.ymd : '');
    if (prev && dayOf(prev) && dayOf(S.route) && dayOf(prev) !== dayOf(S.route)) {
      v.classList.remove('slide-next', 'slide-prev'); void v.offsetWidth;
      v.classList.add(dayOf(S.route) > dayOf(prev) ? 'slide-next' : 'slide-prev');
    }
  }
  const hashOf = r => (r.name === 'day' ? '#/day/' + r.ymd : r.name === 'cal' ? '#/cal/' + r.ym : '#/' + r.name);
  const go = hash => { if (location.hash === hash) onRoute(); else location.hash = hash; };

  /* ───── 描く ───── */

  function render() {
    const r = S.route;
    document.body.dataset.view = S.st ? r.name : 'welcome';
    $$('#tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === tabOf(r.name) ? 'page' : 'false'));
    if (!S.st) {
      $('#top').innerHTML = ''; $('#top').hidden = true;
      $('#view').innerHTML = HB.api.conn() ? viewLoading() : viewWelcome();
      $('#bottom').hidden = true;
      return;
    }
    $('#top').hidden = false;
    $('#bottom').hidden = ['settings', 'guide'].includes(r.name);
    $('#iosSync').classList.toggle('unsynced', !(S.st.ios && S.st.ios.syncedAt));
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
    if (r.name === 'cal') layoutMonth();
    else S.calGeom = null;
    loadThumbs($('#view'));
    if (r.name === 'guide' || r.name === 'settings') loadFeedUrl();
  }
  const tabOf = n => (n === 'day' ? 'today' : n);

  /** 裏側から新しいデータが来たとき：シートを開いているときは、閉じてから描く */
  function softRender() {
    if (S.sheetOpen) { S.dirtyWhileSheet = true; return; }
    if (S.route.name === 'cal') { const snap = calSnap(); render(); if (!calRestore(snap)) calScrollTo(S.route.ym); return; }
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  function banner() {
    const out = [];
    if (S.demo) out.push(`<div class="banner demo"><span>おためし中（サンプル・保存しません）</span><button class="link" data-act="endDemo">やめる</button></div>`);
    const q = HB.api.queue().length;
    if (q) out.push(`<div class="banner warn">未送信のメモが ${q} 件あります。つながったら送ります。</div>`);
    if (S.sync === 'offline') out.push(`<div class="banner warn">いまは裏側につながりません。前に受けとった内容を出しています。</div>`);
    else if (S.sync === 'error') out.push(`<div class="banner err">${esc(S.syncMsg)}</div>`);
    return out.join('');
  }

  /** 上のバー：左に設定（丸いボタン）、まんなかに年月、右に「今日へ」と「新しくする」。日の画面では、その下に1週間の帯 */
  function topBar(r) {
    const attention = S.sync === 'error' || (S.st.outboxErrors || []).length > 0;
    const gear = `<button class="rbtn" data-act="go" data-hash="#/settings" aria-label="設定">${icon('gear', 22)}${attention ? '<i class="dot"></i>' : ''}</button>`;
    const sync = `<button class="sync ${S.sync}" data-act="refresh" aria-label="新しくする" title="${esc(S.syncMsg || '新しくする')}">${icon('refresh', 21)}</button>`;
    const bar = (l, m, rr) => `<div class="topbar">${l}<div class="mid">${m}</div>${rr}</div>`;
    if (r.name === 'today' || r.name === 'day') {
      const ymd = r.name === 'today' ? HB.today() : r.ymd;
      return bar(gear, `<button class="title month" data-act="goCal" data-ym="${ymd.slice(0, 7)}" aria-label="月のカレンダーへ">${monthTitle(ymd.slice(0, 7))}</button>`,
        `<div class="rpill"><button data-act="go" data-hash="#/today" aria-label="今日へ"${r.name === 'today' ? ' disabled' : ''}>${icon('today', 21)}</button>${sync}</div>`) + weekStrip(ymd);
    }
    if (r.name === 'cal') {
      return bar(gear, `<button class="iconbtn nav" data-act="goCal" data-ym="${HB.addMonths(r.ym, -1)}" aria-label="前の月">${icon('left')}</button>
        <div class="title month" id="calTitle">${monthTitle(r.ym)}</div>
        <button class="iconbtn nav" data-act="goCal" data-ym="${HB.addMonths(r.ym, 1)}" aria-label="次の月">${icon('right')}</button>`,
        `<div class="rpill"><button data-act="goCal" data-ym="${HB.today().slice(0, 7)}" aria-label="今月へ" id="calNow"${r.ym === HB.today().slice(0, 7) ? ' disabled' : ''}>${icon('today', 21)}</button>${sync}</div>`);
    }
    const titles = { memos: 'メモ', library: '画像・資料', settings: '設定', guide: 'ショートカットのつくり方' };
    const back = hash => `<button class="rbtn" data-act="go" data-hash="${hash}" aria-label="もどる">${icon('left', 22)}</button>`;
    const left = r.name === 'settings' ? back(S.backHash || '#/today') : r.name === 'guide' ? back('#/settings') : gear;
    return bar(left, `<div class="title"><b>${titles[r.name]}</b></div>`, r.name === 'guide' ? '<span></span>' : `<div class="rpill">${sync}</div>`);
  }
  const monthTitle = ym => { const [y, m] = ym.split('-').map(Number); return `<span class="y">${y}年</span><b>${m}月</b>`; };

  /** 1週間の帯（月〜日）：日付と、その日にあるものの色の点。押すとその日へ、端の ‹ › で前の週・次の週 */
  function weekStrip(ymd) {
    const t = HB.today();
    const w0 = HB.addDays(ymd, -((HB.weekday(ymd) + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => HB.addDays(w0, i));
    const entries = HB.calEntries(S.st, days[0], days[6]);
    const cells = days.map((d, i) => {
      const hol = HB.holidayName(d);
      const dots = [];
      entries.forEach(e => {
        if (e.d0 > d || e.d1 < d || dots.length >= 3) return;
        const c = e.kind === 'memo' ? 'k-memo' : e.kind === 'item' ? 'k-item' : 'p' + colorOf(e.cal);
        if (!dots.includes(c)) dots.push(c);
      });
      const cls = ['wday', d === ymd ? 'sel' : '', d === t ? 'today' : '', i === 5 ? 'sat' : '', i === 6 || hol ? 'sun' : ''].filter(Boolean).join(' ');
      return `<button class="${cls}" data-act="goDay" data-ymd="${d}" aria-label="${HB.labelDay(d)}${hol ? ' ' + hol : ''}"${d === ymd ? ' aria-current="date"' : ''}>` +
        `<small>${'月火水木金土日'[i]}</small><b>${Number(d.slice(8))}</b><span class="wdots">${dots.map(c => `<i class="${c}"></i>`).join('')}</span></button>`;
    }).join('');
    return `<div class="wstrip"><button class="wnav" data-act="goDay" data-ymd="${HB.addDays(ymd, -7)}" aria-label="前の週">${icon('left', 18)}</button>${cells}` +
      `<button class="wnav" data-act="goDay" data-ymd="${HB.addDays(ymd, 7)}" aria-label="次の週">${icon('right', 18)}</button></div>`;
  }

  function viewLoading() { return `<div class="empty-state"><div class="spinner"></div><p>読みこみ中…</p></div>`; }

  function viewWelcome() {
    const c = HB.api.conn() || {};
    const pk = HB.passkey.supported();
    return `<div class="welcome">
      <div class="logo">${icon('book', 56)}</div>
      <h1>ひびの手帳</h1>
      <p class="lead">予定・リマインダー・メモ・写真を、日付ごとに。<br>毎朝 Claude が受信箱を整理して、ニュースとメールのまとめも「今日」に届きます。</p>
      ${pk ? `<div class="card pk-login">
        <button class="primary big" data-act="passkeyLogin">${icon('key', 22)}<span>Face ID・Touch ID でログイン</span></button>
        <p class="form-err" id="pkErr" hidden></p>
        <p class="muted small">パスキーを作ってあれば、顔・指紋・パスコードだけで入れます。パスキーは、つながっている端末の「設定」で作れます。</p>
      </div>
      <p class="or"><span>はじめての端末は、URL と合言葉で</span></p>` : ''}
      <form class="card form" data-form="connect">
        <h2>裏側につなぐ</h2>
        <label>裏側の URL（/exec で終わる）<input id="cUrl" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(c.url || '')}"></label>
        <label>合言葉（トークン）<input id="cToken" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="hb_…" value="${esc(c.token || '')}"></label>
        <p class="form-err" id="cErr" hidden></p>
        <button class="${pk ? '' : 'primary '}big" type="submit">つなぐ</button>
        <p class="muted small">URL と合言葉は、裏側（Apps Script）で <code>showSetupInfo</code> を実行するとログに出ます。準備のしかたは README の「はじめに」。</p>
      </form>
      <button class="ghost big" data-act="demo">おためし（サンプルで見る）</button>
    </div>`;
  }

  /* ── 今日・その日 ── */

  /** 見出しつきのまとまり（右に小さな操作を置ける） */
  const sec = (ic, title, body, opt) => {
    const o = opt || {};
    return `<section class="sec ${o.cls || ''}"${o.id ? ` id="${o.id}"` : ''}><h2 class="sec-h">${icon(ic, 18)}<span>${title}</span>${o.badge || ''}${o.right ? `<span class="act">${o.right}</span>` : ''}</h2>${body}${o.foot ? `<p class="sec-foot">${o.foot}</p>` : ''}</section>`;
  };

  const WDAY = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const toMin = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  const dur = m => (m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60 ? (m % 60) + '分' : ''}`);

  /** 日の画面のいちばん上：大きな日付・祝日・つぎの予定・ひとこと・件数（押すとそこへ） */
  function hero(v, nProps) {
    const [, m, d] = v.ymd.split('-').map(Number), wd = HB.weekday(v.ymd);
    const hol = HB.holidayName(v.ymd);
    const showHol = hol && !v.events.some(e => e.allDay && e.title.includes(hol));
    const b = v.briefing;
    const msg = b && b.summary ? `<div class="hero-msg"><span class="hm-l">${icon('sun', 15)}${v.isToday ? 'けさのひとこと' : 'この日のひとこと'}</span><p>${esc(b.summary)}</p></div>` : '';
    const over = v.reminders.filter(r => r.overdue).length;
    const chip = (id, label, n, cls) => (n ? `<button class="hchip ${cls || ''}" data-act="scrollTo" data-id="${id}">${label}<b>${n}</b></button>` : '');
    const chips = [chip('sec-plan', '予定', v.events.length), chip('sec-plan', over ? `リマインダー（期限切れ ${over}）` : 'リマインダー', v.reminders.length, over ? 'warn' : ''),
      chip('sec-props', '確認', nProps, 'ask'), chip('sec-memo', 'メモ', v.memos.length), chip('sec-items', '資料', v.items.length)].join('');
    return `<section class="hero${v.isToday ? ' is-today' : ''}">
      <div class="hero-head"><b class="hd-d${wd === 0 || hol ? ' sun' : wd === 6 ? ' sat' : ''}">${d}</b>
        <div class="hd-side"><span class="hd-w">${WDAY[wd]}</span><span class="hd-m">${m}月${d}日 · ${HB.relDay(v.ymd)}</span></div>
        ${showHol ? `<span class="hd-hol">${esc(hol)}</span>` : ''}</div>
      ${upNext(v)}${msg}${chips ? `<div class="hero-chips">${chips}</div>` : ''}</section>`;
  }

  /** 今日だけ：いまの予定か、つぎの予定（あと何分） */
  function upNext(v) {
    if (!v || !v.isToday) return '';
    const now = toMin(HB.hmOf(new Date()));
    const timed = v.events.filter(e => !e.allDay && e.d0 === v.ymd && toMin(e.t0) != null);
    const cur = timed.find(e => toMin(e.t0) <= now && e.d1 === v.ymd && toMin(e.t1) != null && now < toMin(e.t1));
    const next = timed.find(e => toMin(e.t0) > now);
    const e = cur || next;
    if (!e) return '';
    const label = cur ? `いま · ${hm(e.t1)}まで` : `つぎの予定 · あと${dur(toMin(e.t0) - now)}`;
    return `<div class="upnext p${colorOf(e.cal)}"><span class="un-l">${label}</span><b>${esc(hm(e.t0))}　${esc(e.title)}</b>${e.loc || e.cal ? `<small>${[e.loc, e.cal].filter(Boolean).map(esc).join(' · ')}</small>` : ''}</div>`;
  }

  function viewDay(ymd) {
    const st = S.st, v = HB.dayView(st, ymd);
    const props = v.proposals.filter(p => S.ui.snooze[p.id] !== HB.today());
    // 大きな日付とまとめ → 一日の予定 → Claude からの確認 → メモ → 画像・資料 → …
    const parts = [hero(v, props.length), scheduleCard(v)];
    if (props.length) parts.push(sec('ask', '確認してほしいこと', props.map(proposalCard).join(''), { cls: 'props', id: 'sec-props', badge: `<span class="count">${props.length}</span>` }));
    parts.push(sec('memo', 'この日のメモ', `<div class="card">${v.memos.map(memoCard).join('') || '<p class="empty">この日のメモはまだありません。</p>'}
      <form class="quick" data-form="quickMemo" data-ymd="${ymd}"><textarea rows="1" placeholder="この日のメモを書く…" aria-label="この日のメモ"></textarea><button class="primary" type="submit">追加</button></form></div>`, { id: 'sec-memo' }));
    parts.push(sec('photo', 'この日の画像・資料', `<div class="grid">${v.items.map(itemThumb).join('')}
      <button class="thumb add" data-act="addMenu" data-ymd="${ymd}">${icon('plus', 26)}<span>この日に入れる</span></button></div>`, { id: 'sec-items' }));
    if (v.pinned.length) parts.push(sec('star', '重要メモ（日付なし）', `<div class="card">${v.pinned.slice(0, 6).map(memoCard).join('')}
      ${v.pinned.length > 6 ? `<button class="link more-link" data-act="memoFilterGo" data-f="star">ほかに ${v.pinned.length - 6} 件</button>` : ''}</div>`));
    parts.push(briefingCards(v));
    parts.push(footInfo(ymd));
    return `<div class="day">${parts.join('')}</div>`;
  }

  /** 予定：時刻と、カレンダーの色のブロック（FirstSeed の週の表示のように）。その下にリマインダー */
  function scheduleCard(v) {
    const st = S.st, sc = st.settings.shortcuts || {};
    const now = HB.hmOf(new Date());
    const ev = v.events.map(e => {
      const starts = e.d0 === v.ymd, ends = e.d1 === v.ymd;
      let tm;
      if (e.allDay) tm = '<b>終日</b>';
      else if (!starts && !ends) tm = '<b>つづき</b>';
      else if (!starts) tm = `<b>〜${esc(hm(e.t1))}</b>`;
      else tm = `<b>${esc(hm(e.t0))}</b>${ends && e.t1 ? `<small>${esc(hm(e.t1))}</small>` : ''}`;
      let state = '';
      if (v.isToday && !e.allDay) {
        if (ends && e.t1 && e.t1 <= now) state = ' past';
        else if ((!starts || (e.t0 && e.t0 <= now)) && (!ends || (e.t1 && now < e.t1))) state = ' now';
      }
      const sub = [e.loc, e.cal].filter(Boolean).map(esc).join(' · ');
      return `<li class="tl-row${state}"><span class="tl-time">${tm}</span><span class="tl-ev p${colorOf(e.cal)}"><b>${esc(e.title)}</b>${sub ? `<small>${sub}</small>` : ''}</span></li>`;
    }).join('');
    const rem = v.reminders.map(r => {
      const sub = [r.overdue ? '期限切れ ' + HB.labelShort(r.due) : r.dueTime ? esc(hm(r.dueTime)) : '', r.list ? esc(r.list) : ''].filter(Boolean).join(' · ');
      const prio = r.prio >= 3 ? '<span class="prio">!!!</span>' : r.prio === 2 ? '<span class="prio">!!</span>' : '';
      return `<li class="rem ${r.overdue ? 'overdue' : ''}"><a href="x-apple-reminderkit://" class="rem-a"><span class="circle"></span>
        <span class="rem-main"><b>${r.flag ? '🚩 ' : ''}${esc(r.title)}</b>${sub ? `<small>${sub}</small>` : ''}</span>${prio}</a></li>`;
    }).join('');
    const synced = st.ios && st.ios.syncedAt;
    const hint = synced ? '' : `<p class="empty">iPhone の予定とリマインダーを出すには、ショートカット「${esc(sc.sync || 'ひびの手帳 同期')}」をつくります（<a href="#/guide">つくり方</a>）。</p>`;
    const body = `<div class="card">${ev ? `<ul class="tl">${ev}</ul>` : synced ? '<p class="empty">予定はありません。</p>' : ''}
      ${rem ? `<h3 class="sub-h">リマインダー</h3><ul class="rems">${rem}</ul>` : ''}${hint}</div>`;
    return sec('cal', '予定', body, {
      id: 'sec-plan',
      right: `<a class="chip-btn" href="${HB.calshowUrl(v.ymd)}">カレンダーApp</a>`,
      foot: `${synced ? 'iPhone から ' + esc(HB.labelWhen(synced)) + '　' : ''}<button class="link" data-act="runSync">iPhone と同期</button>`
    });
  }

  function briefingCards(v) {
    const b = v.briefing;
    if (!b) {
      if (!v.isToday) return '';
      const last = S.st.lastRun && S.st.lastRun.at;
      return sec('news', 'けさのまとめ', `<div class="card"><p class="empty">今日のまとめは、まだ届いていません。毎朝 6 時ごろ、Claude がメール・AI・ニュースをまとめてここに出します。${last ? '（前回：' + esc(HB.labelWhen(last)) + '）' : ''}</p></div>`);
    }
    const when = b.runAt ? `<small class="when">${esc(HB.labelWhen(b.runAt))}</small>` : '';
    const link = (u, inner) => (HB.safeUrl(u) ? `<a href="${esc(HB.safeUrl(u))}" target="_blank" rel="noopener">${inner}</a>` : inner);
    const out = [];
    if (b.gmail && b.gmail.length) {
      out.push(sec('mail', 'メール', `<div class="card"><ul class="news">${b.gmail.map(m => `<li>
        ${link(m.url, `<b>${esc(m.subject)}</b>`)}<div class="meta"><span>${esc(m.from)}</span>${m.action ? `<span class="tag ${/返信|対応|提出|期限/.test(m.action) ? 'hot' : ''}">${esc(m.action)}</span>` : ''}${m.due ? `<span class="tag due">${HB.labelShort(m.due)}まで</span>` : ''}</div>
        ${m.summary ? `<p>${esc(m.summary)}</p>` : ''}</li>`).join('')}</ul></div>`, { badge: when }));
    }
    const news = (title, ic, list) => (list && list.length ? sec(ic, title, `<div class="card"><ul class="news">${list.map(n => `<li>
      ${link(n.url, `<b>${esc(n.title)}</b>`)}${n.summary ? `<p>${esc(n.summary)}</p>` : ''}${n.source ? `<div class="meta"><span>${esc(n.source)}</span></div>` : ''}</li>`).join('')}</ul></div>`, { badge: when }) : '');
    out.push(news('AI のうごき', 'ai', b.ai));
    out.push(news('ニュース', 'news', b.news));
    return out.join('');
  }

  function footInfo(ymd) {
    const st = S.st, lr = st.lastRun;
    const bits = [];
    if (lr && lr.at) bits.push(`Claude の整理：${esc(HB.labelWhen(lr.at))}（資料 ${lr.files || 0}・メモ ${lr.memos || 0}・確認 ${lr.proposals || 0}）`);
    return `<p class="foot">${bits.join('<br>')}${bits.length ? '<br>' : ''}<a href="#/cal/${ymd.slice(0, 7)}">${icon('cal', 15)} カレンダーで見る</a></p>`;
  }

  const KIND = { category: ['tag', '分類'], date: ['cal', '日付'], reminder: ['bell', 'リマインダー'], event: ['cal', 'カレンダー'], reply: ['mail', '返信'], other: ['ask', '確認'] };

  function proposalCard(p) {
    const t = HB.proposalTarget(S.st, p);
    const k = KIND[p.kind] || KIND.other;
    let target = '';
    if (t.kind === 'item' && t.item) target = `<button class="prop-target" data-act="openItem" data-id="${t.item.id}"><img data-thumb="${t.item.id}" alt=""><span>${esc(t.item.title || t.item.name)}</span></button>`;
    else if (t.kind === 'memo' && t.memo) target = `<button class="prop-target is-memo" data-act="openMemo" data-id="${t.memo.id}">${icon('memo', 18)}<span>${esc(HB.memoTitle(t.memo))}</span></button>`;
    else if (t.kind === 'mail') target = `<div class="prop-target mail">${icon('mail', 18)} ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.subject || 'メールを開く')}</a>` : `<span>${esc(t.subject)}</span>`}</div>`;
    const opts = p.options.map((o, i) => `<button class="${i === 0 ? 'primary' : ''}" data-act="answer" data-id="${p.id}" data-opt="${i}">${o.ios ? icon(o.ios.type === 'event' ? 'cal' : 'bell', 17) + ' ' : ''}${esc(o.label)}</button>`).join('');
    return `<div class="prop card" data-pid="${p.id}"><span class="prop-kind">${icon(k[0], 14)}${k[1]}</span><p class="prop-q">${esc(p.question)}</p>${p.context ? `<p class="prop-ctx">${esc(p.context)}</p>` : ''}${target}
      <div class="prop-opts">${opts}</div>
      ${p.rule ? `<label class="remember"><input type="checkbox" data-remember="${p.id}"><span>今後もこうする：${esc(p.rule)}</span></label>` : ''}
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
    const ci = HB.catIndex(m.category, S.st.settings.categories);
    return `<div class="memo${ci >= 0 ? ' has-cat c' + ci : ''}" data-act="openMemo" data-id="${m.id}">
      <button class="star ${m.important ? 'on' : ''}" data-act="toggleStar" data-id="${m.id}" aria-label="重要">${icon('star', 18)}</button>
      <div class="memo-main"><b>${esc(HB.memoTitle(m))}</b>${body ? `<p>${esc(body)}</p>` : ''}
      <div class="memo-foot">${catChip(m.category)}${source}${m.needsDecision ? '<span class="tag">分類を確認中</span>' : ''}${datesLine(m.dates)}</div></div></div>`;
  }

  function itemThumb(i) {
    const badge = i.kind === 'pdf' ? '<span class="badge">PDF</span>' : i.status === 'inbox' ? '<span class="badge new">受信箱</span>' : i.status === 'pending' ? '<span class="badge ask">確認待ち</span>' : '';
    return `<button class="thumb ${i.kind}" data-act="openItem" data-id="${i.id}"><img data-thumb="${i.id}" alt="">${badge}${i.important ? `<span class="pin">${icon('star', 14)}</span>` : ''}<span class="t">${esc(i.title || i.name)}</span></button>`;
  }

  /* ── カレンダー ── */

  /** 月のカレンダー（FirstSeed のように）：週がたてにつづく。月曜はじまり・週番号・土は青・日と祝日は赤・月の境目に線。
      予定・リマインダー・メモ・写真は、その日の色の帯で出す（帯は layoutMonth が、1週の高さに合わせて入れる）。
      前後 CAL_BEFORE・CAL_AFTER か月を出しておき、端に近づいたら出しなおす */
  const CAL_BEFORE = 6, CAL_AFTER = 12;
  const lastDayOf = ym => HB.addDays(HB.addMonths(ym, 1) + '-01', -1);
  function viewCal(ym) {
    const t = HB.today();
    const first = HB.addMonths(ym, -CAL_BEFORE) + '-01', last = lastDayOf(HB.addMonths(ym, CAL_AFTER));
    const start = HB.addDays(first, -((HB.weekday(first) + 6) % 7)), end = HB.addDays(last, (7 - HB.weekday(last)) % 7);
    const weeks = [];
    for (let w = start; w <= end; w = HB.addDays(w, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => HB.addDays(w, i)));
    S.calWeeks = weeks;
    const head = ['月', '火', '水', '木', '金', '土', '日'].map((w, i) => `<span class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</span>`).join('');
    const rows = weeks.map(w => `<div class="wk">${w.map((d, i) => {
      const [, mm, dd] = d.split('-').map(Number), hol = HB.holidayName(d), mo = d.slice(0, 7);
      const cls = [d === t ? 'today' : '', i === 5 ? 'sat' : '', i === 6 || hol ? 'sun' : '', dd === 1 ? 'm1' : '',
        HB.addDays(d, -7).slice(0, 7) !== mo ? 'mb-t' : '', i > 0 && HB.addDays(d, -1).slice(0, 7) !== mo ? 'mb-l' : ''].filter(Boolean).join(' ');
      return `<button class="cell ${cls}" data-act="goDay" data-ymd="${d}" style="grid-column:${i + 1}" aria-label="${HB.labelDay(d)}${hol ? ' ' + hol : ''}">` +
        `${i === 0 && dd !== 1 ? `<span class="wn">${HB.isoWeek(d)}</span>` : ''}<span class="n">${dd === 1 ? mm + '月1日' : dd}</span></button>`;
    }).join('')}</div>`).join('');
    return `<div class="mcal" style="--wps:${calWps()}"><div class="mwd">${head}</div><div class="mweeks">${rows}</div></div><div class="mwm" aria-hidden="true"></div>`;
  }
  /** 1画面に何週出すか（設定。この端末に覚える） */
  const calWps = () => ([4, 5, 6].includes(S.ui.calWps) ? S.ui.calWps : 4);

  /** 帯の用意。1週の高さから、何段まで入るかを決める（入りきらない日は「+n」）。
      帯そのものは、見えている週とその前後だけに入れる（予定がとても多くても軽いように。calFill） */
  function layoutMonth() {
    const box = $('.mweeks'), all = S.calWeeks;
    if (!box || !all || !S.st) return;
    const wk = $('.wk', box);
    if (!wk) return;
    const cs = getComputedStyle(wk);
    const dateH = parseFloat(cs.getPropertyValue('--date-h')) || 20, barH = parseFloat(cs.getPropertyValue('--bar-h')) || 15;
    const lanes = Math.max(1, Math.floor((wk.clientHeight - dateH - 3) / (barH + 1)));
    box.style.setProperty('--lanes', lanes);
    // 予定などを、週ごとに分けておく
    const buckets = all.map(() => []), w0 = all[0][0];
    HB.calEntries(S.st, w0, all[all.length - 1][6]).forEach(e => {
      const a = Math.max(0, Math.floor(HB.diffDays(w0, e.d0) / 7)), b = Math.min(all.length - 1, Math.floor(HB.diffDays(w0, e.d1) / 7));
      for (let i = a; i <= b; i++) buckets[i].push(e);
    });
    S.calFillState = { lanes, buckets, done: new Set() };
    $$('.bar', box).forEach(x => x.remove());
    calMeasure();
  }
  /** いま見えている週と、その前後 6 週に、帯を入れる（まだ入れていない週だけ） */
  function calFill() {
    const f = S.calFillState, g = S.calGeom, all = S.calWeeks;
    if (!f || !g || !all) return;
    const wks = $$('.mweeks .wk');
    const from = Math.max(0, calIndexAt(g.sticky) - 6), to = Math.min(all.length - 1, calIndexAt(window.innerHeight) + 6);
    for (let wi = from; wi <= to; wi++) {
      if (f.done.has(wi) || !wks[wi]) continue;
      f.done.add(wi);
      const days = all[wi], lay = HB.weekLayout(days, f.buckets[wi], f.lanes);
      wks[wi].insertAdjacentHTML('beforeend', lay.bars.map(x => barHtml(x, days)).join('') +
        lay.more.map((n, c) => (n ? `<span class="bar more" style="grid-column:${c + 1};grid-row:${f.lanes + 1}">+${n}</span>` : '')).join(''));
    }
  }

  function barHtml(b, days) {
    const e = b.e, cls = ['bar', 'k-' + e.kind];
    if (e.kind === 'ev' || e.kind === 'rem') cls.push('p' + colorOf(e.cal));
    if (e.d0 < days[0]) cls.push('cont-l');
    if (e.d1 > days[6]) cls.push('cont-r');
    const pre = e.kind === 'rem' ? '☐' : e.kind === 'memo' ? '<i class="bi i-memo"></i>' : e.kind === 'item' ? `<i class="bi ${e.sub === 'photo' ? 'i-photo' : 'i-file'}"></i>` : '';
    return `<span class="${cls.join(' ')}" style="grid-column:${b.c0 + 1} / span ${b.c1 - b.c0 + 1};grid-row:${b.lane + 2}" data-d0="${e.d0}" data-d1="${e.d1}">${pre}${e.important ? '★' : ''}${esc(e.title)}</span>`;
  }

  /* カレンダーのスクロール：いま見ている月を上の題名に出す・大きな「11月」・月へとぶ・出しなおしても同じ所に */
  function calMeasure() {
    const wk = $('.mweeks .wk'), head = $('.mwd');
    if (!wk || !head) { S.calGeom = null; return; }
    S.calGeom = { top: wk.getBoundingClientRect().top + window.scrollY, h: wk.getBoundingClientRect().height, sticky: parseFloat(getComputedStyle(head).top) + head.offsetHeight };
  }
  /** 画面のその高さ（上からの px）にある週の番号 */
  function calIndexAt(viewY) {
    const g = S.calGeom, n = S.calWeeks ? S.calWeeks.length : 0;
    if (!g || !n) return 0;
    return Math.max(0, Math.min(n - 1, Math.floor((window.scrollY + viewY - g.top) / g.h)));
  }
  /** その月を出す：木曜がその月に入る最初の週を、いちばん上に（上の題名と同じ決め方）。
      今月で、今日の週が画面より下になるときは、今日の週が一番下に見えるところまで */
  function calScrollTo(ym, smooth) {
    const g = S.calGeom, weeks = S.calWeeks;
    if (!g || !weeks) return false;
    let i = weeks.findIndex(w => w[3].slice(0, 7) === ym);
    if (i < 0) return false;
    const now = HB.today();
    if (ym === now.slice(0, 7)) {
      const it = weeks.findIndex(w => w[0] <= now && now <= w[6]);
      if (it >= 0 && it < i) i = it;
      else if (it - i >= calWps()) i = it - calWps() + 1;
    }
    if (!smooth) S.calQuiet = Date.now() + 400;   // 開いたときの位置あわせでは、大きな「11月」を出さない
    window.scrollTo({ top: Math.max(0, g.top + i * g.h - g.sticky), behavior: smooth ? 'smooth' : 'auto' });
    calFill();
    return true;
  }
  /** いま一番上にある週と、そのずれ（出しなおしたあと、同じ所にもどすため） */
  function calSnap() {
    const g = S.calGeom;
    if (!g || !S.calWeeks) return null;
    const i = calIndexAt(g.sticky);
    return { ymd: S.calWeeks[i][0], off: window.scrollY + g.sticky - (g.top + i * g.h) };
  }
  function calRestore(snap) {
    const g = S.calGeom;
    if (!g || !snap) return false;
    const i = S.calWeeks.findIndex(w => w[0] === snap.ymd);
    if (i < 0) return false;
    S.calQuiet = Date.now() + 400;
    window.scrollTo(0, g.top + i * g.h - g.sticky + snap.off);
    calFill();
    return true;
  }
  let calWmTimer = null, calTick = false;
  function calOnScroll() {
    if (S.route.name !== 'cal' || !S.calGeom || calTick) return;
    calTick = true;
    requestAnimationFrame(() => {
      calTick = false;
      if (S.route.name !== 'cal' || !S.calGeom) return;
      const g = S.calGeom, weeks = S.calWeeks;
      calFill();
      // 上の題名：一番上に半分以上見えている週の、木曜の月
      const top = calIndexAt(g.sticky + g.h * 0.5), ym = weeks[top][3].slice(0, 7);
      if (ym !== S.route.ym) {
        S.route.ym = ym;
        history.replaceState(null, '', '#/cal/' + ym);
        const t = $('#calTitle'), nowBtn = $('#calNow');
        if (t) t.innerHTML = monthTitle(ym);
        if (nowBtn) nowBtn.disabled = ym === HB.today().slice(0, 7);
        $$('#top [data-act="goCal"].nav').forEach((x, k) => { x.dataset.ym = HB.addMonths(ym, k ? 1 : -1); });
      }
      // 大きな「11月」：画面のまんなかの週の月
      const mid = calIndexAt((g.sticky + window.innerHeight) / 2), wm = $('.mwm');
      if (wm && Date.now() > (S.calQuiet || 0)) {
        wm.textContent = Number(weeks[mid][3].slice(5, 7)) + '月';
        wm.classList.add('show');
        clearTimeout(calWmTimer);
        calWmTimer = setTimeout(() => wm.classList.remove('show'), 650);
      }
      // 端に近づいたら、いまの月を中心に出しなおす
      const screens = Math.ceil(window.innerHeight / g.h);
      if (!S.calBusy && (top < 3 || top > weeks.length - screens - 3)) {
        S.calBusy = true;
        setTimeout(() => { const snap = calSnap(); render(); calRestore(snap); S.calBusy = false; }, 60);
      }
    });
  }

  /* ── メモ ── */

  function viewMemos() {
    const st = S.st, u = S.ui;
    const list = HB.filterMemos(st.memos, { filter: u.memoFilter, category: u.memoCat, q: u.memoQ });
    const chip = (f, label, cat) => {
      const on = u.memoFilter === f && (f !== 'cat' || u.memoCat === cat);
      return `<button class="fchip ${on ? 'on' : ''}" data-act="memoFilter" data-f="${f}" data-cat="${esc(cat || '')}">${label}</button>`;
    };
    const nRem = ((st.ios && st.ios.reminders) || []).length;
    const chips = [chip('all', 'すべて'), chip('star', '★ 重要'), chip('dated', '日付つき'), chip('uncat', '分類なし')]
      .concat(nRem ? [chip('rem', `iPhoneのリマインダー ${nRem}`)] : [])
      .concat(st.settings.categories.map(c => chip('cat', esc(c.name), c.name))).concat([chip('archived', 'しまったもの')]).join('');
    const body = u.memoFilter === 'rem' ? reminderLists(u.memoQ)
      : `<div class="list-wrap">${list.map(memoCard).join('') || '<p class="empty center">メモはありません。右下の ＋ から書けます。</p>'}</div>`;
    return `<div class="toolbar"><label class="searchbox">${icon('search', 18)}<input type="search" class="search" data-input="memoQ" placeholder="メモをさがす" value="${esc(u.memoQ)}" aria-label="メモをさがす"></label></div>
      <div class="fchips">${chips}</div>${body}`;
  }

  /** iPhone のリマインダー（終わっていないもの全部）を、リストごとに。日付のないものも、ここで見られる */
  function reminderLists(q) {
    const st = S.st, n = s => String(s || '').toLowerCase().normalize('NFKC');
    const words = n(q).split(/\s+/).filter(Boolean);
    const groups = new Map();
    ((st.ios && st.ios.reminders) || []).filter(r => words.every(w => n(r.title + ' ' + (r.list || '')).includes(w))).forEach(r => {
      const k = r.list || 'リマインダー';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    });
    if (!groups.size) return '<p class="empty center">リマインダーはありません。</p>';
    const t = HB.today();
    const row = r => {
      const due = r.due ? HB.labelShort(r.due) + (r.dueTime ? ' ' + hm(r.dueTime) : '') : '';
      const prio = r.prio >= 3 ? '<span class="prio">!!!</span>' : r.prio === 2 ? '<span class="prio">!!</span>' : '';
      return `<li class="rem ${r.due && r.due < t ? 'overdue' : ''}"><a href="x-apple-reminderkit://" class="rem-a"><span class="circle"></span>
        <span class="rem-main"><b>${r.flag ? '🚩 ' : ''}${esc(r.title)}</b>${due ? `<small>${r.due < t ? '期限切れ ' : ''}${esc(due)}</small>` : ''}</span>${prio}</a></li>`;
    };
    return Array.from(groups.keys()).sort().map(k => {
      const rs = groups.get(k).slice().sort((a, b) => (a.due ? 0 : 1) - (b.due ? 0 : 1) || String(a.due).localeCompare(String(b.due)) || String(a.dueTime).localeCompare(String(b.dueTime)));
      return `<section class="sec rem-list"><h2 class="sec-h small"><i class="cc-dot p${colorOf(k)}"></i><span>${esc(k)}</span><small class="when">${rs.length}</small></h2><div class="card"><ul class="rems">${rs.map(row).join('')}</ul></div></section>`;
    }).join('');
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
    return `<div class="add-row"><button class="primary" data-act="pick" data-which="camera">${icon('camera', 24)}<span>撮る</span></button><button data-act="pick" data-which="photo">${icon('photo', 24)}<span>写真</span></button><button data-act="pick" data-which="file">${icon('file', 24)}<span>PDF</span></button></div>
      <p class="note">受信箱のものは、次の朝 Claude が読んで分類し、日付があればその日に出します。${drive}</p>
      <div class="toolbar"><label class="searchbox">${icon('search', 18)}<input type="search" class="search" data-input="libQ" placeholder="題名・中身でさがす" value="${esc(u.libQ)}" aria-label="資料をさがす"></label></div>
      <div class="fchips">${chips}</div>
      <div class="grid lib">${list.map(itemThumb).join('') || '<p class="empty center wide">ここにはまだありません。</p>'}</div>`;
  }

  /* ── 設定 ── */

  function viewSettings() {
    const st = S.st, s = st.settings, c = HB.api.conn() || {};
    const sc = s.shortcuts || {};
    const b = s.briefing || {};
    const cats = s.categories.map((x, i) => `<div class="cat-row" data-i="${i}"><span class="cat c${HB.catIndex(x.name, s.categories)}">&nbsp;</span>
      <input class="cName" value="${esc(x.name)}" aria-label="分類の名前"><input class="cHint" value="${esc(x.hint || '')}" placeholder="どんなものか（Claude へのヒント）" aria-label="ヒント">
      <button class="iconbtn" data-act="catUp" data-i="${i}" aria-label="上へ">${icon('up', 18)}</button><button class="iconbtn" data-act="catDel" data-i="${i}" aria-label="消す">${icon('x', 18)}</button></div>`).join('');
    const rules = s.rules.map((r, i) => `<li><span>${esc(r)}</span><button class="iconbtn" data-act="ruleDel" data-i="${i}" aria-label="消す">${icon('x', 18)}</button></li>`).join('');
    const lr = st.lastRun || {};
    const group = (title, body, foot) => `<section class="sec"><h2 class="sec-h small">${title}</h2><div class="card pad">${body}</div>${foot ? `<p class="sec-foot">${foot}</p>` : ''}</section>`;
    return `<div class="settings">
      ${group('裏側（Google ドライブ）', `${S.demo ? '<p>おためし中です。</p>' : `<p class="kv"><span>URL</span><code class="wrap">${esc(c.url || '')}</code></p><p class="kv"><span>合言葉</span><code>${esc(String(c.token || '').slice(0, 6))}…</code></p>`}
        <div class="btns"><button data-act="reconnect">つなぎなおす</button><button data-act="syncRun">いま取り込む</button>${st.folders && st.folders.root ? `<a class="btn" href="https://drive.google.com/drive/folders/${esc(st.folders.root)}" target="_blank" rel="noopener">ドライブのフォルダ</a>` : ''}</div>
        ${(st.outboxErrors || []).length ? `<p class="err">読めなかった Claude の結果：${st.outboxErrors.map(e => esc(e.name)).join('、')}</p>` : ''}`,
        `Claude の整理：${lr.at ? esc(HB.labelWhen(lr.at)) + `（資料 ${lr.files || 0}・メモ ${lr.memos || 0}・確認 ${lr.proposals || 0}）` : 'まだ'}${st.exportedAt ? `　Claude へのデータ：${esc(HB.labelWhen(st.exportedAt))}` : ''}`)}
      ${S.demo ? '' : passkeyGroup(group)}
      ${group('iPhone 連携（ショートカット）', `<p>iPhone のカレンダー・リマインダーとは、ショートカットApp でつなぎます。<a href="#/guide">つくり方を見る</a></p>
        <label>同期のショートカットの名前<input id="sSync" value="${esc(sc.sync || '')}"></label>
        <label>受信箱へ送るショートカットの名前<input id="sSend" value="${esc(sc.send || '')}"></label>
        <label>iPhone に登録するショートカットの名前<input id="sAdd" value="${esc(sc.add || '')}"></label>
        <div class="btns"><button data-act="saveShortcuts">名前を保存</button><button data-act="runSync">いま同期する</button></div>`,
        `iPhone から：${st.ios && st.ios.syncedAt ? esc(HB.labelWhen(st.ios.syncedAt)) + `（予定 ${st.ios.events.length}件${eventSpan(st.ios.events)}・リマインダー ${st.ios.reminders.length}件）` : 'まだ'}`)}
      ${calColorsGroup()}
      ${group('カレンダー購読（おこのみで）', `<p>日付をつけたメモ・写真を、iPhone のカレンダーにも出せます（見るだけ）。</p>
        <p>${S.feedUrl ? `<button class="copy" data-copy="${esc(S.feedUrl)}">${esc(S.feedUrl)}</button>` : '<span class="muted">URL を読みこみ中…</span>'}</p>`,
        'コピー → 設定App →「カレンダー」→「カレンダーアカウント」→「アカウントを追加」→「その他」→「照会するカレンダーを追加」に貼る。')}
      ${group('分類', `<div id="cats">${cats}</div>
        <div class="btns"><button data-act="catAdd">分類を足す</button><button class="primary" data-act="saveCats">分類を保存</button></div>`, 'Claude はこの中から選びます。ヒントを書くと、分け方が上手になります。')}
      ${group('Claude が覚えた決まり', `<ul class="rules">${rules || '<li class="muted">まだありません</li>'}</ul>
        <div class="inline"><input id="ruleNew" placeholder="例：保育園のおたよりは「家族・子ども」"><button data-act="ruleAdd">足す</button></div>`, '「今後もこうする」を選ぶと、ここに入ります。自分で書き足しても OK。')}
      ${group('けさのまとめ', `<label>ニュースの話題（1行に1つ）<textarea id="bNews" rows="3">${esc((b.news || []).join('\n'))}</textarea></label>
        <label>AI の話題（1行に1つ）<textarea id="bAi" rows="2">${esc((b.ai || []).join('\n'))}</textarea></label>
        <label>メールのさがし方（Gmail の検索の書き方）<input id="bGmail" value="${esc(b.gmailQuery || '')}"></label>
        <div class="nums"><label>ニュース<input id="bMaxNews" type="number" min="0" max="10" value="${b.maxNews}"></label><label>AI<input id="bMaxAi" type="number" min="0" max="10" value="${b.maxAi}"></label><label>メール<input id="bMaxGmail" type="number" min="0" max="15" value="${b.maxGmail}"></label></div>
        <div class="btns"><button class="primary" data-act="saveBriefing">保存</button></div>`)}
      ${group('この端末', `<div class="btns"><button data-act="exportJson">全部を書き出す（JSON）</button><button data-act="clearCache">この端末の控えを消す</button><button data-act="disconnect">接続をはずす</button></div>`,
        `ひびの手帳 ${esc(st.version || '')}　データは自分の Google ドライブ（「ひびの手帳」フォルダ）にあります。`)}
    </div>`;
  }

  /** 設定の「ログイン（Face ID・Touch ID）」 */
  function passkeyGroup(group) {
    const list = S.st.passkeys;
    if (!Array.isArray(list)) return group('ログイン（Face ID・Touch ID）', '<p>裏側の Code.gs を新しくすると、Face ID・Touch ID でログインできるようになります（README の「パスキー」）。</p>');
    const rows = list.map(p => `<li class="pk-row"><span class="pk-ic">${icon('key', 18)}</span><span class="pk-t"><b>${esc(p.name)}</b>${pkDates(p).map(t => `<small>${esc(t)}</small>`).join('')}</span>` +
      `<button data-act="passkeyDel" data-id="${esc(p.id)}" aria-label="${esc(p.name)} のパスキーを消す">消す</button></li>`).join('');
    const can = HB.passkey.supported();
    const lead = list.length ? '<p>ほかの iPhone・iPad・Mac では、ログインの画面で「Face ID・Touch ID でログイン」を押すだけでつながります。</p>'
      : '<p>パスキーを作ると、ほかの iPhone・iPad・Mac でも、顔・指紋・パスコードだけでつながります。URL と合言葉は、もう入れなくてよくなります。</p>';
    const btn = !can ? '<p class="muted">このブラウザは、パスキーに対応していません。</p>'
      : `<div class="btns"><button class="${list.length ? '' : 'primary'}" data-act="passkeyCreate">${icon('key', 18)}${list.length ? 'この端末でも作る' : 'パスキーを作る'}</button></div>`;
    return group('ログイン（Face ID・Touch ID）', `${lead}${rows ? `<ul class="pk-list">${rows}</ul>` : ''}${btn}`,
      'パスキーは iCloud キーチェーンに入り、同じ Apple ID の端末に届きます（iPhone で作るのがおすすめ）。端末をなくしたら、ここで消してください。');
  }

  /** 入っている予定の期間：' · 2025/10/16〜2027/10/15' */
  function eventSpan(evs) {
    if (!evs || !evs.length) return '';
    let a = evs[0].d0, b = evs[0].d0;
    evs.forEach(e => { if (e.d0 < a) a = e.d0; if (e.d0 > b) b = e.d0; });
    const f = ymd => ymd.replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, '$1/$2/$3');
    return ` · ${f(a)}〜${f(b)}`;
  }

  /** カレンダーの色（この端末だけに覚える）：iPhone から届いたカレンダーとリマインダーのリストごとに */
  function calColorsGroup() {
    const ios = S.st.ios || {};
    const kinds = new Map();
    const add = (n, k) => { if (n) kinds.set(n, Array.from(new Set((kinds.get(n) || []).concat([k])))); };
    (ios.events || []).forEach(e => add(e.cal, 'カレンダー'));
    (ios.reminders || []).forEach(r => add(r.list, 'リマインダー'));
    const rows = Array.from(kinds.keys()).sort().map(n => {
      const cur = colorOf(n);
      return `<div class="cc-row"><span class="cc-name"><i class="cc-dot p${cur}"></i><b>${esc(n)}</b><small>${kinds.get(n).join('・')}</small></span>
        <div class="cc-pick">${Array.from({ length: 10 }, (_, i) => `<button class="cc p${i}${i === cur ? ' on' : ''}" data-act="calColor" data-name="${esc(n)}" data-c="${i}" aria-label="${esc(n)}：色${i + 1}" aria-pressed="${i === cur}"></button>`).join('')}</div></div>`;
    }).join('');
    const wps = calWps();
    const seg = `<div class="seg-row"><span>月のカレンダー：1画面に</span><div class="segc" role="group" aria-label="1画面の週の数">${[4, 5, 6].map(n => `<button class="${n === wps ? 'on' : ''}" data-act="calWps" data-n="${n}" aria-pressed="${n === wps}">${n}週</button>`).join('')}</div></div>`;
    return `<section class="sec"><h2 class="sec-h small">カレンダーの表示（この端末）</h2><div class="card pad">${seg}${rows || '<p class="muted">iPhone と同期すると、カレンダーとリマインダーのリストがここに出て、色を選べます。</p>'}</div>
      <p class="sec-foot">色は、月のカレンダーの帯と、今日の予定の色です。iPhone のカレンダーと同じ色にしておくと、見分けやすくなります。</p></section>`;
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
    el.innerHTML = `<div class="sheet-back" data-act="closeSheet"></div><div class="sheet-body" role="dialog" aria-modal="true"><div class="sheet-grip" aria-hidden="true"></div>${html}</div>`;
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
    const y = ymd || '';
    const d = ymd && ymd !== HB.today() ? `<p class="menu-note">${HB.labelDay(ymd)} に入れます</p>` : '';
    openSheet(`<div class="menu">${d}<div class="menu-grid">
      <button data-act="newMemo" data-ymd="${y}">${icon('memo', 30)}<span>メモを書く</span></button>
      <button data-act="pick" data-which="camera" data-ymd="${y}">${icon('camera', 30)}<span>写真を撮る</span></button>
      <button data-act="pick" data-which="photo" data-ymd="${y}">${icon('photo', 30)}<span>写真を選ぶ</span></button>
      <button data-act="pick" data-which="file" data-ymd="${y}">${icon('file', 30)}<span>PDF・ファイル</span></button></div>
      <button class="cancel" data-act="closeSheet">やめる</button></div>`, 'small');
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
    const note = r.categorySource === 'claude' ? 'Claude が分類しました。変えると「自分で決めた」になります。' : r.needsDecision ? 'Claude が決めきれず、「確認してほしいこと」に出しています。' : '';
    return `${sheetHead(S.edit.isNew ? '新しいメモ' : 'メモ', 'saveMemo')}
      <div class="sheet-scroll">
      <textarea id="mText" class="big-text" rows="7" placeholder="メモ（1行目が題名になります）">${esc(r.text)}</textarea>
      <div class="fgroup">
        <button class="toggle frow ${r.important ? 'on' : ''}" data-act="mStar" aria-pressed="${!!r.important}">${icon('star', 20)}<span>重要メモ</span><span class="sw"></span></button>
        ${datesField('m', r.dates)}
        <label class="frow"><span class="fl">分類</span><select id="mCat"><option value="">おまかせ（Claude が分類）</option>${opts}</select></label>
        ${note ? `<p class="frow-note">${note}</p>` : ''}
        ${r.tags && r.tags.length ? `<p class="frow-note">${r.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join(' ')}</p>` : ''}
      </div>
      <div class="fgroup"><div class="frow col"><span class="fl">iPhone に登録</span><div class="btns"><button data-act="mToIos" data-type="reminder">${icon('bell', 18)} リマインダーに</button><button data-act="mToIos" data-type="event">${icon('cal', 18)} カレンダーに</button></div></div></div>
      ${S.edit.isNew ? '' : `<div class="fgroup danger"><div class="frow btns"><button data-act="mArchive">${r.archived ? 'しまったのをもどす' : 'しまう'}</button><button data-act="mDelete">消す</button></div></div>`}
      </div>`;
  }

  /** シートの上：左に ×（閉じる）、まんなかに題名、右に ✓（保存。なければ空き） */
  function sheetHead(title, saveAct, closeLabel) {
    return `<div class="sheet-head"><button class="rbtn" data-act="closeSheet" aria-label="${closeLabel || '閉じる'}">${icon('x', 20)}</button><b>${title}</b>${saveAct ? `<button class="rbtn ok" data-act="${saveAct}" aria-label="保存">${icon('check', 22)}</button>` : '<span></span>'}</div>`;
  }

  const dchips = (prefix, dates) => (dates || []).map(d => `<span class="dchip">${HB.labelShort(d)}<button data-act="${prefix}DelDate" data-ymd="${d}" aria-label="${d} をはずす">${icon('x', 15)}</button></span>`).join('') || '<span class="muted">なし</span>';
  function datesField(prefix, dates) {
    return `<div class="frow col"><span class="fl">日付<small>その日を開くと出ます</small></span><div class="dchips" id="${prefix}Dates">${dchips(prefix, dates)}</div>
      <div class="date-add"><button data-act="${prefix}AddDate" data-v="today">今日</button><button data-act="${prefix}AddDate" data-v="tomorrow">明日</button>
      <input type="date" id="${prefix}DateIn" aria-label="日付を選ぶ"><button data-act="${prefix}AddDate" data-v="input">追加</button></div></div>`;
  }
  function refreshDates(prefix, dates) {
    const box = $('#' + prefix + 'Dates');
    if (box) box.innerHTML = dchips(prefix, dates);
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
    const sugg = r.status === 'pending' && r.suggestedCategory ? `Claude の候補：${esc(r.suggestedCategory)}` : r.categorySource === 'claude' ? 'Claude が分類しました' : '';
    const notes = r.dateNotes ? Object.keys(r.dateNotes).sort().map(d => `<li>${HB.labelShort(d)}：${esc(r.dateNotes[d])}</li>`).join('') : '';
    return `${sheetHead(r.kind === 'pdf' ? 'PDF' : r.kind === 'photo' ? '写真' : 'ファイル', 'saveItem')}
      <div class="sheet-scroll">
      <div class="viewer ${r.kind}">${r.kind === 'photo' ? `<img id="vImg" data-thumb="${r.id}" alt="">` : `<img data-thumb="${r.id}" alt=""><div class="pdf-ic">${icon('file', 40)}</div>`}</div>
      <p class="viewer-meta"><span class="tag">${esc(status)}</span>${drive ? `<a class="chip-btn" href="${drive}" target="_blank" rel="noopener">ドライブで開く</a>` : ''}</p>
      <div class="fgroup"><label class="frow col"><span class="fl">題名</span><input id="iTitle" value="${esc(r.title || '')}"></label></div>
      ${r.summary ? `<div class="summary"><span class="fl">Claude の要約</span><p>${esc(r.summary)}</p>${notes ? `<ul>${notes}</ul>` : ''}</div>` : ''}
      ${r.text || r.ocr ? `<details class="ocr"><summary>読みとった文字</summary><pre>${esc(r.text || r.ocr)}</pre></details>` : ''}
      <div class="fgroup">
        <button class="toggle frow ${r.important ? 'on' : ''}" data-act="iStar" aria-pressed="${!!r.important}">${icon('star', 20)}<span>重要</span><span class="sw"></span></button>
        ${datesField('i', r.dates)}
        ${r.suggestedDates && r.suggestedDates.length ? `<div class="frow col"><span class="fl">Claude が見つけた日付</span><div class="btns">${r.suggestedDates.map(x => `<button class="chip-btn" data-act="iAddSugg" data-ymd="${x.date}">＋${HB.labelShort(x.date)}${x.reason ? ' ' + esc(x.reason) : ''}</button>`).join('')}</div></div>` : ''}
        <label class="frow"><span class="fl">分類</span><select id="iCat"><option value="">おまかせ（Claude が分類）</option>${opts}</select></label>
        ${sugg ? `<p class="frow-note">${sugg}</p>` : ''}
        <label class="frow col"><span class="fl">メモ<small>Claude へのヒントにもなります</small></span><textarea id="iNote" rows="2">${esc(r.note || '')}</textarea></label>
      </div>
      <div class="fgroup danger"><div class="frow btns"><button data-act="iArchive">${r.status === 'archived' ? 'しまったのをもどす' : 'しまう'}</button><button data-act="iDelete">消す（ドライブではゴミ箱へ）</button></div></div>
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
    return `${sheetHead('受信箱へ入れる', '', 'やめる')}
      <div class="sheet-scroll">
      <div class="up-prev" id="upPrev"></div>
      <div class="fgroup">
        ${datesField('u', u.dates)}
        <p class="frow-note">日付を選ばなくても、Claude が中身から日付を読みとって、その日に出します。</p>
        <label class="frow col"><span class="fl">メモ<small>任意。Claude へのヒントにもなります</small></span><textarea id="uNote" rows="2" placeholder="例：長男の遠足のおたより"></textarea></label>
        <label class="frow"><span class="fl">分類</span><select id="uCat"><option value="">おまかせ（次の朝 Claude が分類）</option>${opts}</select></label>
      </div>
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
    openSheet(`${sheetHead('リマインダー', '', 'やめる')}
      <div class="sheet-scroll"><div class="fgroup"><p class="frow"><b>${esc(x.title)}</b></p><label class="frow col"><span class="fl">いつ知らせる？</span><input type="datetime-local" id="rDue" value="${t}"></label></div>
      <button class="primary big" data-act="rGo">iPhone に登録</button></div>`, 'small');
  }

  function syncIntro(name) {
    openSheet(`${sheetHead('iPhone と同期')}
      <div class="sheet-scroll"><p>ショートカット「${esc(name)}」を動かして、iPhone のカレンダーの予定とリマインダーを、この手帳に取りこみます。</p>
      <p class="muted">まだショートカットをつくっていなければ、先につくり方を見てください（一度だけ・20分くらい）。</p>
      <button class="primary big" data-act="runSync" data-sure="1">動かす</button>
      <button class="big" data-act="go" data-hash="#/guide">つくり方を見る</button></div>`, 'small');
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
      if (!S.st) { $('#view').innerHTML = `<div class="empty-state"><p>${esc(e.message)}</p><div class="btns center"><button class="primary" data-act="refresh">もう一度</button><button data-act="reconnect">つなぎなおす</button></div></div>`; }
      else softRender();
    } finally { S.loading = false; }
  }

  function setSync(state, msg) {
    S.sync = state; S.syncMsg = msg || '';
    const b = $('#top .sync');
    if (b) { b.className = 'sync ' + state; b.title = msg || '新しくする'; }
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
      await connected({ url: chk.url, token }, 'つながりました');
      offerPasskey();
    } catch (e) { show(e.message); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = 'つなぐ'; } }
  }

  /** つながったあと：この端末に覚えて、今日を出す */
  async function connected(c, msg) {
    HB.api.setConn(c);
    HB.api.clearState();
    S.st = null; S.demo = false;
    go('#/today');
    await refresh(true);
    toast(msg);
    keepStorage();
    const here = location.origin + location.pathname;
    if (S.st && !S.st.settings.appUrl && /^https:/.test(here)) saveSettings({ appUrl: here }, msg);
  }

  /** この端末の控え（つなぎ先など）を、ブラウザが勝手に消さないようにたのむ */
  function keepStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});
    } catch (e) { /* なくても動く */ }
  }

  /* ───── パスキー（Face ID・Touch ID でログイン） ───── */

  const PK_ERR = {
    passkey_unknown: 'このパスキーは、裏側で消されています。URL と合言葉でつないでから、設定でパスキーを作りなおしてください',
    passkey_stale: 'ログインの期限が切れました。端末の時計が合っているか確かめて、もう一度押してください',
    passkey_failed: 'パスキーを確かめられませんでした。もう一度押してください',
    passkey_unsupported: '裏側（Apps Script）でパスキーが使えません。新しい Code.gs を貼って、デプロイしなおしてください',
    old_backend: '裏側の Code.gs が古く、パスキーに対応していません。新しい Code.gs を貼って、デプロイしなおしてください'
  };
  const pkMessage = (e, login) => PK_ERR[e.code] || (/^unknown_action: passkey/.test(e.code || '') || (login && e.code === 'unauthorized') ? PK_ERR.old_backend : e.message);

  /** ログインの画面の「Face ID・Touch ID でログイン」 */
  async function passkeyLogin() {
    const err = $('#pkErr'), btn = $('[data-act="passkeyLogin"]');
    // わけは、ボタンの下に残す（やめたとき・パスキーがないときは、赤くしない）
    const show = (m, soft) => { if (err) { err.textContent = m; err.hidden = false; err.classList.toggle('soft', !!soft); } else toast(m, soft ? '' : 'err'); };
    if (err) err.hidden = true;
    let got;
    try { got = await HB.passkey.get(); }   // 押したその場で呼ぶ（この前に await を入れない）
    catch (e) { show(HB.passkey.explain(e, 'login'), HB.passkey.cancelled(e)); return; }
    const chk = HB.checkGasUrl(got.url);
    if (!chk.ok) return show(HB.passkey.MESSAGES.no_url);
    const label = btn && $('span', btn);
    if (btn) { btn.disabled = true; label.textContent = 'たしかめています…'; }
    try {
      const r = await HB.api.call('passkey.login', got.assertion, { conn: { url: chk.url, token: '' } });
      await connected({ url: chk.url, token: r.token }, 'ログインしました');
    } catch (e) { show(pkMessage(e, true)); }
    finally { if (btn && btn.isConnected) { btn.disabled = false; label.textContent = 'Face ID・Touch ID でログイン'; } }
  }

  /** 設定・つないだ直後の「パスキーを作る」 */
  async function passkeyCreate() {
    if (blockDemo()) return;
    const c = HB.api.conn();
    if (!c || !S.st) { toast('この端末は、裏側につながっていません（設定の「つなぎなおす」から）', 'err'); return; }
    let k;
    try { k = await HB.passkey.create(c.url); }   // 押したその場で呼ぶ
    catch (e) { toast(HB.passkey.explain(e, 'create'), HB.passkey.cancelled(e) ? '' : 'err'); return; }
    try {
      busy(true);
      const r = await HB.api.call('passkey.add', k);
      S.st.passkeys = r.passkeys;
      HB.api.saveState(S.st);
      if (S.sheetOpen) closeSheet(true);
      toast('パスキーを作りました');
      softRender();
    } catch (e) { toast(pkMessage(e), 'err'); }
    finally { busy(false); }
  }

  /** URL と合言葉でつないだ直後：まだパスキーがなければ、作るかをきく */
  async function offerPasskey() {
    if (S.demo || !S.st || !Array.isArray(S.st.passkeys) || S.st.passkeys.length) return;
    if (!(await HB.passkey.platformReady()) || S.sheetOpen) return;
    $('#toast').className = 'toast';   // 「つながりました」はシートの題名で伝える
    openSheet(`${sheetHead('つながりました')}
      <div class="pk-offer">
        <div class="pk-hero">${icon('key', 34)}</div>
        <h3>次からは、顔や指紋で</h3>
        <p>パスキーを作っておくと、ほかの iPhone・iPad・Mac では、URL と合言葉のかわりに、Face ID・Touch ID（またはパスコード）だけでつながります。</p>
        <button class="primary big" data-act="passkeyCreate">パスキーを作る</button>
        <button class="cancel" data-act="closeSheet">あとで（設定からも作れます）</button>
      </div>`, 'small');
  }

  const pkDates = p => [p.createdAt ? `${HB.labelShort(String(p.createdAt).slice(0, 10))} に作成` : '', p.lastUsedAt ? `最後のログイン：${HB.labelWhen(p.lastUsedAt)}` : 'まだログインに使っていません'].filter(Boolean);

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
      case 'goCal':
        if (S.route.name === 'cal' && calScrollTo(d.ym, true)) break;
        go('#/cal/' + d.ym); break;
      case 'refresh': if (S.demo) toast('おためし中です'); else refresh(true); break;
      case 'demo': startDemo(); onRoute(); break;
      case 'endDemo': endDemo(); break;
      case 'passkeyLogin': passkeyLogin(); break;
      case 'passkeyCreate': passkeyCreate(); break;
      case 'passkeyDel':
        if (blockDemo() || !confirm('このパスキーを消します。消したパスキーでは、ログインできなくなります（iPhone の「パスワード」App に残る印は、そこで消せます）。')) break;
        try {
          busy(true);
          const r = await HB.api.call('passkey.remove', { id: d.id });
          S.st.passkeys = r.passkeys; HB.api.saveState(S.st);
          toast('パスキーを消しました');
          softRender();
        } catch (e) { toast(pkMessage(e), 'err'); } finally { busy(false); }
        break;
      case 'reconnect': S.st = null; S.demo = false; $('#view').innerHTML = viewWelcome(); $('#top').innerHTML = ''; $('#top').hidden = true; $('#bottom').hidden = true; break;
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
      case 'runSync': {
        const name = (st.settings.shortcuts || {}).sync || 'ひびの手帳 同期';
        // まだ一度も届いていないときは、ショートカットをつくったかを先に聞く
        if (!(st.ios && st.ios.syncedAt) && !d.sure) { syncIntro(name); break; }
        closeSheet(true);
        runShortcut(name);
        break;
      }
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
      case 'mStar': S.edit.rec.important = !S.edit.rec.important; el.classList.toggle('on', S.edit.rec.important); el.setAttribute('aria-pressed', S.edit.rec.important); break;
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
      case 'iStar': S.edit.rec.important = !S.edit.rec.important; el.classList.toggle('on', S.edit.rec.important); el.setAttribute('aria-pressed', S.edit.rec.important); break;
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
      case 'calColor': S.ui.calColors = Object.assign({}, S.ui.calColors, { [d.name]: Number(d.c) }); saveUi(); softRender(); break;
      case 'calWps': S.ui.calWps = Number(d.n); saveUi(); softRender(); break;
      case 'memoFilter': S.ui.memoFilter = d.f; S.ui.memoCat = d.cat || ''; saveUi(); render(); break;
      case 'memoFilterGo': S.ui.memoFilter = d.f; S.ui.memoCat = ''; saveUi(); go('#/memos'); break;
      case 'libFilter': S.ui.libStatus = d.s; S.ui.libCat = d.cat || ''; saveUi(); render(); break;
      case 'scrollTo': { const t = document.getElementById(d.id); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - $('#top').getBoundingClientRect().bottom - 10, behavior: 'smooth' }); break; }
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

  /* ───── 左右のスワイプで、前の日・次の日（週の帯の上なら、前の週・次の週） ───── */
  function setupSwipe() {
    let x0 = 0, y0 = 0, t0 = 0;
    document.addEventListener('touchstart', e => { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    document.addEventListener('touchend', e => {
      if (S.sheetOpen || !['today', 'day'].includes(S.route.name)) return;
      if (e.target.closest('input, textarea, select, .grid, .prop-opts, .fchips')) return;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Date.now() - t0 > 600 || Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
      const ymd = S.route.name === 'today' ? HB.today() : S.route.ymd;
      // 週の帯の上でスワイプしたら1週間、ほかは1日
      go('#/day/' + HB.addDays(ymd, (dx < 0 ? 1 : -1) * (e.target.closest('.wstrip') ? 7 : 1)));
    }, { passive: true });
  }

  /** シートの上（つまみ・題名のところ）を下へスワイプすると閉じる */
  function setupSheetDrag() {
    let y0 = null, body = null;
    document.addEventListener('touchstart', e => {
      y0 = null; body = null;
      const h = e.target.closest('.sheet-head, .sheet-grip, .menu-note');
      if (!h || e.target.closest('button, input, select, textarea, a')) return;
      body = h.closest('.sheet-body'); y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (y0 == null || !body) return;
      body.style.transform = `translateY(${Math.max(0, e.touches[0].clientY - y0)}px)`;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (y0 == null || !body) return;
      const dy = e.changedTouches[0].clientY - y0;
      body.style.transform = '';
      y0 = null; body = null;
      if (dy > 90) closeSheet();
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
    key: '<circle cx="8" cy="15.5" r="4.5"/><path d="M11.3 12.2L20 3.5M16.4 7.1l2.6 2.6M13.9 9.6l2 2"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    memo: '<path d="M6 3.5h9l3.5 3.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
    photo: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', file: '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>', news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    ai: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3.5V7M9 12h.01M15 12h.01M9.5 15.5h5"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    ask: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8h.01"/>', bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8M8 11h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    today: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><rect x="11.5" y="13" width="4.5" height="4" rx=".8" fill="currentColor" stroke="none"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
    tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="2.6"/>'
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
