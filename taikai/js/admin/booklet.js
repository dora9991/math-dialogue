/* 管理画面：大会冊子（要項）
   大会の設定・プログラム・分科会・会場から、印刷できる冊子を自動でつくる（#/print/booklet）。
   ・ev.booklet.parts     … 入れるもの {cover, greetings, outline, program, sections, venues, notes, roster}
   ・ev.booklet.size      … 'A4' | 'A5'
   ・ev.booklet.greetings … [{id, title, who, body}]
   ・ev.booklet.notes     … 参加の注意（文） */
(function () {
  'use strict';
  const { html, icon } = T;

  const PARTS = [
    ['cover', '表紙', '大会名・主題・会期・会場・主催'],
    ['greetings', 'ごあいさつ', ''],
    ['outline', '大会概要', '主題・趣旨・期日・会場・主催・申込'],
    ['program', '日程', ''],
    ['sections', '分科会と発表', ''],
    ['venues', '会場案内', ''],
    ['notes', '参加の注意', ''],
    ['roster', '参加者名簿', ''],
  ];
  const DEFAULT_PARTS = { cover: true, greetings: true, outline: true, program: true, sections: true, venues: true, notes: true, roster: false };
  const parts = (ev) => Object.assign({}, DEFAULT_PARTS, ev.booklet.parts || {});
  const isA5 = (ev) => ev.booklet.size === 'A5';
  const BU_ORDER = ['小学校部会', '中学校部会', '高等学校部会', '高専・大学部会'];
  const buOrder = (ev) => { const out = BU_ORDER.slice(); for (const s of ev.sections) if (s.bu && !out.includes(s.bu)) out.push(s.bu); return out; };
  const move = (list, i, d) => { const j = i + d; if (j < 0 || j >= list.length) return false; const [x] = list.splice(i, 1); list.splice(j, 0, x); return true; };
  const byTime = (a, b) => String(a.start || '').localeCompare(String(b.start || ''));
  const kindOf = (k) => (T.KINDS[k] ? k : 'info');
  const DOW_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function counts(ev) {
    return {
      greetings: `${(ev.booklet.greetings || []).length}件`,
      program: `${ev.program.days.length}日・${T.sum(ev.program.days, (d) => (d.items || []).length)}項目`,
      sections: `分科会 ${ev.sections.length}・発表 ${T.sum(ev.sections, (s) => (s.talks || []).length)}件`,
      venues: `${ev.info.venues.length}か所`,
      notes: (ev.booklet.notes || '').trim() ? `${(ev.booklet.notes || '').split('\n').filter((x) => x.trim()).length}行` : 'まだ書いていない',
      roster: `${T.active(ev).length}人`,
    };
  }

  /* ───────── 表紙 ───────── */
  // 内サイクロイド（スピログラフの曲線）。単位は mm
  function trochoid(cx, cy, R, r, d, scale, rot = 0) {
    const turns = r / gcd(R, r);
    const n = 900;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2 * turns;
      const x0 = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
      const y0 = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
      const x = x0 * Math.cos(rot) - y0 * Math.sin(rot), y = x0 * Math.sin(rot) + y0 * Math.cos(rot);
      s += (i ? 'L' : 'M') + (cx + x * scale).toFixed(2) + ' ' + (cy + y * scale).toFixed(2);
    }
    return s + 'Z';
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ticks(cx, cy, r) {
    let s = '';
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, len = i % 6 === 0 ? 3.2 : 1.4;
      s += `M${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}L${(cx + Math.cos(a) * (r + len)).toFixed(2)} ${(cy + Math.sin(a) * (r + len)).toFixed(2)}`;
    }
    return s;
  }
  function latinDates(info) {
    if (!info.start) return '';
    const a = new Date(info.start + 'T00:00:00');
    const f = (d, y) => (y ? d.getFullYear() + '.' : '') + (d.getMonth() + 1) + '.' + d.getDate();
    const s = `${f(a, true)} ${DOW_EN[a.getDay()]}`;
    if (!info.end || info.end === info.start) return s;
    const b = new Date(info.end + 'T00:00:00');
    return `${s} — ${f(b, a.getFullYear() !== b.getFullYear())} ${DOW_EN[b.getDay()]}`;
  }
  T.bookletCover = (ev, o = {}) => {
    const i = ev.info;
    const name = String(i.name || '');
    const k = name.indexOf('（');
    const title = k > 0 ? html`${name.slice(0, k)}<br>${name.slice(k)}` : name;
    const pid = 'bk-sei' + (o.idSuffix || '');
    const fid = 'bk-fade' + (o.idSuffix || '');
    const sei = [[0, 0], [20, 0], [10, 5], [0, 10], [20, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" class="sei-bg"/>${[8, 6, 4, 2].map((r) => `<circle cx="${x}" cy="${y}" r="${r}" class="sei-ln"/>`).join('')}<circle cx="${x}" cy="${y}" r="10" class="sei-ln"/>`).join('');
    let grid = '';
    for (let x = 10; x < 210; x += 10) grid += `M${x} 0V297`;
    for (let y = 10; y < 297; y += 10) grid += `M0 ${y}H210`;
    const v0 = i.venues[0];
    return html`<section class="sheet bk-cover ${isA5(ev) ? 'a5' : ''}" aria-label="表紙">
      <svg class="bk-art" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="${pid}" width="20" height="10" patternUnits="userSpaceOnUse">${T.raw(sei)}</pattern>
          <linearGradient id="${fid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fade-a"/><stop offset="1" class="fade-b"/></linearGradient>
        </defs>
        <path class="bk-grid" d="${grid}"/>
        <circle class="bk-ring" cx="150" cy="86" r="62"/>
        <path class="bk-ticks" d="${ticks(150, 86, 62)}"/>
        <circle class="bk-ring thin" cx="150" cy="86" r="40"/>
        <path class="bk-curve b" d="${trochoid(150, 86, 7, 4, 2.4, 6.4, 0.3)}"/>
        <path class="bk-curve" d="${trochoid(150, 86, 5, 3, 4.2, 8.6)}"/>
        <circle class="bk-dot" cx="150" cy="86" r="1.3"/>
        <rect x="0" y="200" width="210" height="97" fill="url(#${pid})"/>
        <rect x="0" y="199" width="210" height="44" fill="url(#${fid})"/>
        <rect class="bk-frame" x="7" y="7" width="196" height="283" rx="1.5"/>
      </svg>
      <div class="bk-cv">
        <div class="bk-cv-top">
          <p class="bk-org">${i.org || ''}</p>
          ${i.nameEn ? html`<p class="bk-en">${i.nameEn}</p>` : ''}
        </div>
        <div class="bk-cv-mid">
          ${i.no ? html`<p class="bk-no"><span class="bk-no-ja">第</span><span class="bk-no-num">${i.no}</span><span class="bk-no-ja">回</span></p>` : ''}
          <h1 class="bk-title">${title}</h1>
          ${i.theme ? html`<div class="bk-theme"><span class="bk-theme-lb">大会主題</span><p class="bk-theme-main">${i.theme}</p>${i.subtheme ? html`<p class="bk-theme-sub">${i.subtheme}</p>` : ''}</div>` : ''}
          <div class="bk-when">
            <p class="bk-date">${latinDates(i)}</p>
            <p class="bk-date-ja">${T.period(ev)}${i.city ? html`<span>　${i.city}</span>` : ''}</p>
            ${v0 ? html`<p class="bk-venue">${v0.name}</p>` : ''}
          </div>
        </div>
        <div class="bk-cv-foot">${(i.hosts || []).map((h) => html`<p><span>${h.role}</span>${h.names}</p>`)}</div>
      </div>
    </section>`;
  };

  /* ───────── 中のページ ───────── */
  function page(ev, key, no, label, body) {
    return html`<section class="sheet bk-sheet ${isA5(ev) ? 'a5' : ''}" id="bk-${key}">
      <header class="bk-run"><span>${T.eventTitle(ev)}</span><span>${label}</span></header>
      <h2 class="bk-h"><span class="bk-h-no">${String(no).padStart(2, '0')}</span>${label}</h2>
      ${body}
    </section>`;
  }
  const BODY = {
    greetings(ev) {
      const gs = ev.booklet.greetings || [];
      if (!gs.length) return html`<p class="bk-muted">（あいさつはまだありません）</p>`;
      return gs.map((g) => html`<article class="bk-greet"><h3>${g.title}</h3><p class="bk-who">${g.who}</p><div class="bk-body">${T.text(g.body)}</div></article>`);
    },
    outline(ev) {
      const i = ev.info;
      const row = (k, v) => (v ? html`<tr><th>${k}</th><td>${v}</td></tr>` : '');
      return html`<table class="bk-dl">
        ${row('大会主題', i.theme ? html`<b class="bk-serif">${i.theme}</b>${i.subtheme ? html`<br><span>${i.subtheme}</span>` : ''}` : '')}
        ${row('趣旨', i.themeNote ? T.text(i.themeNote) : '')}
        ${row('期日', T.period(ev))}
        ${row('会場', i.venues.length ? html`${i.venues.map((v) => html`<div>${v.name}${v.role ? html`<span class="bk-muted">（${v.role}）</span>` : ''}</div>`)}` : '')}
        ${(i.hosts || []).map((h) => row(h.role, h.names))}
        ${row('参加申込', i.applyOpen || i.applyClose ? `${i.applyOpen ? T.dateJa(i.applyOpen) : ''}〜${i.applyClose ? T.dateJa(i.applyClose) : ''}（大会ホームページから）` : '')}
        ${row('問い合わせ', i.office ? html`${i.office.name}${i.office.person ? html`<br>${i.office.person}` : ''}${i.office.email ? html`<br>メール：${i.office.email}` : ''}${i.office.tel ? html`<br>電話：${i.office.tel}` : ''}` : '')}
      </table>`;
    },
    program(ev) {
      if (!ev.program.days.length) return html`<p class="bk-muted">（日程はまだありません）</p>`;
      return ev.program.days.map((d, n) => html`<div class="bk-day">
        <h3><span class="bk-day-no">DAY ${n + 1}</span>${T.dateJa(d.date)}<span class="bk-day-lb">${d.label || ''}</span></h3>
        <table class="bk-tbl">${(d.items || []).slice().sort(byTime).map((it) => html`<tr>
          <td class="bk-t num">${it.start || ''}${it.end ? html`<span>–${it.end}</span>` : ''}</td>
          <td><span class="bk-kind k-${kindOf(it.kind)}">${T.KINDS[kindOf(it.kind)]}</span><b>${it.title}</b>
            ${it.place || it.who || it.note ? html`<div class="bk-sub">${[it.place, it.who, it.note].filter(Boolean).join('　／　')}</div>` : ''}</td>
        </tr>`)}</table>
      </div>`);
    },
    sections(ev) {
      if (!ev.sections.length) return html`<p class="bk-muted">（分科会はまだありません）</p>`;
      return buOrder(ev).filter((bu) => ev.sections.some((s) => s.bu === bu)).map((bu) => html`<div class="bk-bu">
        <h3 class="bk-bu-h">${bu}</h3>
        ${ev.sections.filter((s) => s.bu === bu).map((s) => html`<div class="bk-sec">
          <h4><span class="bk-sec-no">${s.no}</span>${s.theme}</h4>
          <p class="bk-sub">${[s.room && '会場：' + s.room, s.chair && '司会・助言：' + s.chair].filter(Boolean).join('　／　')}</p>
          ${(s.talks || []).length ? html`<ol class="bk-talks">${s.talks.map((t) => html`<li>
            <div class="bk-talk-head"><span class="bk-t num">${t.time || ''}</span><b>${t.title}</b></div>
            <div class="bk-talk-by">${t.presenter || ''}${t.school ? html`<span>（${t.school}）</span>` : ''}</div>
            ${t.abstract ? html`<p class="bk-abs">${t.abstract}</p>` : ''}
          </li>`)}</ol>` : html`<p class="bk-muted">（発表は決まりしだい掲載します）</p>`}
        </div>`)}
      </div>`);
    },
    venues(ev) {
      if (!ev.info.venues.length) return html`<p class="bk-muted">（会場はまだ決まっていません）</p>`;
      return ev.info.venues.map((v) => html`<div class="bk-venue-box">
        <h3>${v.name}</h3>
        ${v.role ? html`<p class="bk-sub">${v.role}</p>` : ''}
        <table class="bk-dl">${v.address ? html`<tr><th>所在地</th><td>${v.address}</td></tr>` : ''}${v.access ? html`<tr><th>交通</th><td>${T.text(v.access)}</td></tr>` : ''}</table>
      </div>`);
    },
    notes(ev) {
      const n = (ev.booklet.notes || '').trim();
      return n ? html`<div class="bk-notes">${T.text(n)}</div>` : html`<p class="bk-muted">（参加の注意はまだありません）</p>`;
    },
    roster(ev) {
      const people = T.active(ev);
      const groups = buOrder(ev).map((bu) => [bu, people.filter((p) => T.pv(p, 'bu') === bu)]).filter((g) => g[1].length);
      const other = people.filter((p) => !buOrder(ev).includes(T.pv(p, 'bu')));
      if (other.length) groups.push(['そのほか', other]);
      const kana = (p) => T.pv(p, 'kana') || T.pname(p);
      return html`<p class="bk-muted small">名簿は、申込のときに「冊子の名簿に載せてよい」と同意した人だけを載せます（このサンプルでは全員を出しています）。</p>
        ${groups.map(([bu, list]) => html`<div class="bk-roster-g"><h3 class="bk-bu-h">${bu}<span>${list.length}人</span></h3>
          <ul class="bk-roster">${list.slice().sort((a, b) => kana(a).localeCompare(kana(b), 'ja')).map((p) => html`<li><b>${T.pname(p)}</b><span>${T.pv(p, 'org') || ''}</span></li>`)}</ul></div>`)}`;
    },
  };

  /* ───────── 印刷の画面 ───────── */
  T.page('print', 'booklet', {
    admin: true, title: '大会冊子', cls: 'booklet',
    hint: '「印刷する」→ 送信先で「PDFに保存」。設定の「背景のグラフィック」をオンにすると、表紙の色も出ます。',
    render() {
      const ev = T.ev();
      const p = parts(ev);
      const a5 = isA5(ev);
      const size = a5 ? 'A5' : 'A4';
      const inner = PARTS.filter(([k]) => k !== 'cover' && p[k]);
      const out = [html`<style>@page bkcover { size: ${size}; margin: 0; } @page bkpage { size: ${size}; margin: ${a5 ? '11mm 0 12mm' : '14mm 0 15mm'}; }</style>`];
      if (p.cover) out.push(T.bookletCover(ev));
      if (inner.length > 1) {
        out.push(html`<section class="sheet bk-sheet bk-toc-sheet ${a5 ? 'a5' : ''}">
          <h2 class="bk-h"><span class="bk-h-no">—</span>目次</h2>
          <ol class="bk-toc">${inner.map(([k, label], n) => html`<li><span class="bk-toc-no">${String(n + 1).padStart(2, '0')}</span><span class="bk-toc-lb">${label}</span><span class="bk-toc-line"></span></li>`)}</ol>
          <div class="bk-toc-foot"><p>${T.eventTitle(ev)}</p><p>${T.period(ev)}</p></div>
        </section>`);
      }
      inner.forEach(([k, label], n) => out.push(page(ev, k, n + 1, label, BODY[k](ev))));
      if (out.length === 1) out.push(html`<section class="sheet"><p>入れるものが選ばれていません。「大会冊子」の画面で選んでください。</p></section>`);
      return out;
    },
  });

  /* ───────── 管理の画面 ───────── */
  const greetFields = [
    { k: 'title', label: '見出し', required: true, placeholder: 'ごあいさつ' },
    { k: 'who', label: '肩書き・名前', placeholder: '佐賀大会実行委員会 委員長　○○ ○○', full: true },
    { k: 'body', label: '本文', type: 'textarea', rows: 9 },
  ];

  T.page('admin', 'booklet', {
    title: '大会冊子', icon: 'book', group: '運営', order: 20,
    lead: '大会の設定・プログラム・分科会から、冊子（要項）を自動でつくります。印刷して、PDF にも保存できます。',
    head() { return html`<a class="btn primary" href="#/print/booklet?back=admin/booklet">${icon('print')} 冊子をつくる（印刷・PDF）</a>`; },
    render() {
      const ev = T.ev();
      const p = parts(ev);
      const c = counts(ev);
      const gs = ev.booklet.greetings || [];
      return html`<div class="bk-admin">
        <div class="stack">
          <section class="card">
            <div class="card-head"><h2>${icon('list')} 冊子に入れるもの</h2></div>
            <ol class="bk-parts">${PARTS.map(([k, label, desc], n) => html`<li class="${p[k] ? 'on' : ''}">
              <label class="check"><input type="checkbox" data-part="${k}" ${p[k] ? T.raw('checked') : ''}> <span class="bk-parts-no num">${String(n + 1).padStart(2, '0')}</span><b>${label}</b></label>
              <span class="muted small">${c[k] || desc}</span>
              ${k === 'roster' ? html`<p class="help bk-parts-warn">${icon('lock')} 名簿を載せるときは、本人の同意が要ります（申込フォームに「冊子の名簿に載せてよい」の同意の項目を足す）。</p>` : ''}
            </li>`)}</ol>
            <div class="row" style="margin-top:12px"><span class="small muted">紙の大きさ</span>
              <div class="seg" role="group" aria-label="紙の大きさ">${['A4', 'A5'].map((s) => html`<button data-act="size" data-size="${s}" aria-pressed="${(ev.booklet.size || 'A4') === s}">${s}</button>`)}</div>
              <span class="help" style="margin:0">A5 は持ち歩きやすい小冊子向け（A4 の紙に1ページずつ印刷されます）。</span>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h2>${icon('chat')} ごあいさつ</h2><span class="spacer"></span><button class="btn sm" data-act="greetAdd">${icon('plus')} 足す</button></div>
            ${gs.length ? html`<div class="list">${gs.map((g, i) => html`<div class="item">
              <div class="item-main"><div class="item-title">${g.title}</div><div class="item-meta"><span>${g.who}</span><span>${(g.body || '').length}字</span></div></div>
              <div class="item-actions">
                <button class="icon-btn" data-act="greetMove" data-i="${i}" data-d="-1" title="前へ" aria-label="前へ" ${i === 0 ? T.raw('disabled') : ''}>↑</button>
                <button class="icon-btn" data-act="greetMove" data-i="${i}" data-d="1" title="後へ" aria-label="後へ" ${i === gs.length - 1 ? T.raw('disabled') : ''}>↓</button>
                <button class="btn sm ghost" data-act="greetEdit" data-id="${g.id}">${icon('edit')} 直す</button>
              </div>
            </div>`)}</div>` : html`<div class="empty">あいさつはまだありません。</div>`}
          </section>

          <section class="card">
            <div class="card-head"><h2>${icon('flag')} 参加の注意</h2><span class="spacer"></span><span class="small muted" data-notes-state>入力すると自動で保存します</span></div>
            <textarea data-notes rows="7" aria-label="参加の注意">${ev.booklet.notes || ''}</textarea>
            <p class="help">1行ずつ「・」で始めると、読みやすくなります。</p>
          </section>
        </div>

        <aside class="bk-side">
          <div class="card bk-preview">
            <div class="card-head"><h2>${icon('eye')} 表紙の見本</h2></div>
            ${p.cover ? html`<a class="bk-mini ${isA5(ev) ? 'a5' : ''}" href="#/print/booklet?back=admin/booklet" aria-label="冊子を開く">${T.bookletCover(ev, { idSuffix: '-mini' })}</a>` : html`<div class="empty small">表紙は入れない設定です</div>`}
            <p class="help">大会名・主題・会期・会場・主催は「大会の設定」、日程と分科会は「プログラム・分科会」で直すと、冊子にもそのまま出ます。</p>
            <div class="row"><a class="btn sm ghost" href="#/admin/event">${icon('gear')} 大会の設定</a><a class="btn sm ghost" href="#/admin/program">${icon('calendar')} プログラム</a></div>
          </div>
        </aside>
      </div>`;
    },
    mount(root) {
      const ev = T.ev();
      for (const cb of root.querySelectorAll('[data-part]')) cb.addEventListener('change', () => {
        ev.booklet.parts = Object.assign({}, DEFAULT_PARTS, ev.booklet.parts || {}, { [cb.dataset.part]: cb.checked });
        T.save(); T.refresh();
      });
      const ta = root.querySelector('[data-notes]');
      const state = root.querySelector('[data-notes-state]');
      if (ta) ta.addEventListener('input', T.debounce(() => { ev.booklet.notes = ta.value; T.save(); if (state) state.textContent = '保存しました ' + T.time(new Date()); }, 400));
    },
    acts: {
      size(el) { const ev = T.ev(); ev.booklet.size = el.dataset.size; T.save(); T.refresh(); },
      greetAdd() {
        const ev = T.ev();
        T.editRecord({
          title: 'あいさつを足す', wide: true, fields: greetFields, value: { title: 'ごあいさつ' },
          onSave(v) { ev.booklet.greetings = ev.booklet.greetings || []; ev.booklet.greetings.push(Object.assign({ id: T.uid('g') }, v)); T.save(); T.refresh(); T.toast('足しました'); },
        });
      },
      greetEdit(el) {
        const ev = T.ev();
        const g = T.find(ev.booklet.greetings, el.dataset.id);
        if (!g) return;
        T.editRecord({
          title: 'あいさつを直す', wide: true, fields: greetFields, value: g,
          onSave(v) { Object.assign(g, v); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(ev.booklet.greetings, g.id); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      greetMove(el) { const ev = T.ev(); if (move(ev.booklet.greetings, Number(el.dataset.i), Number(el.dataset.d))) { T.save(); T.refresh(); } },
    },
  });
})();
