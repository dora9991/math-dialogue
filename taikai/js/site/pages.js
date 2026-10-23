/* 公開サイトのページ：お知らせ・大会概要・プログラム・分科会・資料・配信・Q&A・アクセス・問い合わせ */
(function () {
  'use strict';
  const { html, icon } = T;
  const EN_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  /* ── お知らせ（一覧と1件） ── */
  T.page('site', 'news', {
    title: 'お知らせ', en: 'NEWS', nav: true, order: 10,
    heading(r) { const n = r.arg && T.find(T.ev().news, r.arg); return n ? n.title : 'お知らせ'; },
    render(r) {
      const ev = T.ev();
      if (r.arg) {
        const n = T.find(ev.news, r.arg);
        if (!n || !n.published) return html`<div class="wrap narrow s-body"><p>お知らせが見つかりません。</p><a href="#/news">← お知らせの一覧</a></div>`;
        return html`<div class="wrap narrow s-body">
          <p class="news-meta"><span class="news-date num">${T.dot(n.date)}</span><span class="news-cat cat-${{ 重要: 'imp', 申込: 'app', 資料: 'doc', 配信: 'live' }[n.cat] || 'etc'}">${n.cat}</span></p>
          <div class="prose">${T.text(n.body)}</div>
          <p style="margin-top:32px"><a class="btn" href="#/news">${icon('back')} お知らせの一覧</a></p>
        </div>`;
      }
      const cat = r.q.cat || '';
      const all = ev.news.filter((n) => n.published).sort((a, b) => (b.pinned - a.pinned) || (a.date < b.date ? 1 : -1));
      const cats = [...new Set(all.map((n) => n.cat))];
      const list = all.filter((n) => !cat || n.cat === cat);
      return html`<div class="wrap narrow s-body">
        <div class="seg" role="group" aria-label="分類">${['', ...cats].map((c) => html`<button data-act="go" data-to="news${c ? '?cat=' + encodeURIComponent(c) : ''}" aria-pressed="${c === cat}">${c || 'すべて'}</button>`)}</div>
        <ul class="news-list" style="margin-top:16px">${list.map((n) => T.newsRow(n))}</ul>
      </div>`;
    },
  });

  /* ── 大会概要 ── */
  T.page('site', 'about', {
    title: '大会概要', en: 'ABOUT', nav: true, order: 5,
    render() {
      const ev = T.ev(), i = ev.info;
      return html`<div class="wrap narrow s-body">
        ${i.theme ? html`<div class="about-theme"><p class="s-en">THEME</p><p class="s-theme-main sm"><span class="q">「</span>${i.theme}<span class="q">」</span></p>${i.subtheme ? html`<p class="s-theme-sub">${i.subtheme}</p>` : ''}</div>` : ''}
        ${i.themeNote ? html`<h2 class="s-h2">主題について</h2><div class="prose">${T.text(i.themeNote)}</div>` : ''}
        <h2 class="s-h2">開催の概要</h2>
        <table class="kv">
          <tr><th>大会名</th><td>${T.eventTitle(ev)}</td></tr>
          <tr><th>期日</th><td>${T.period(ev)}</td></tr>
          ${i.venues.map((v, k) => html`<tr><th>${k === 0 ? '会場' : ''}</th><td>${v.name}${v.role ? html`<br><small class="muted">${v.role}</small>` : ''}</td></tr>`)}
          ${(i.hosts || []).map((h) => html`<tr><th>${h.role}</th><td>${h.names}</td></tr>`)}
          <tr><th>参加申込</th><td>${i.applyOpen ? T.dateJa(i.applyOpen) : ''}〜${i.applyClose ? T.dateJa(i.applyClose) : ''}（<a href="#/apply">申込フォーム</a>）</td></tr>
          ${T.feeSummary(ev).length ? html`<tr><th>参加費</th><td>${T.feeSummary(ev).map((f) => html`${f.label} ${f.fee ? T.yen(f.fee) : '無料'}<br>`)}<small class="muted">講習会・弁当・情報交換会などは別に申し込みます（申込フォームで金額が出ます）。</small></td></tr>` : ''}
        </table>
        ${(ev.booklet.greetings || []).map((g) => html`<h2 class="s-h2">${g.title}</h2><p class="muted small">${g.who}</p><div class="prose">${T.text(g.body)}</div>`)}
      </div>`;
    },
  });

  /* ── プログラム ── */
  T.page('site', 'program', {
    title: 'プログラム', en: 'PROGRAM', nav: true, order: 20,
    lead: '時刻・会場は変わることがあります。最新の情報は、このページとお知らせでご確認ください。',
    render(r) {
      const ev = T.ev();
      const days = ev.program.days;
      if (!days.length) return html`<div class="wrap s-body"><p class="muted">プログラムは準備中です。</p></div>`;
      const d = T.find(days, r.q.d) || days[0];
      return html`<div class="wrap s-body">
        <div class="day-tabs" role="tablist">${days.map((x) => { const dt = new Date(x.date + 'T00:00:00'); return html`<button role="tab" aria-selected="${x.id === d.id}" data-act="go" data-to="program?d=${x.id}"><b>${dt.getMonth() + 1}.${dt.getDate()}</b><small>${EN_DOW[dt.getDay()]}</small><span>${x.label}</span></button>`; })}</div>
        <h2 class="s-h2">${T.dateJa(d.date)}　${d.label}</h2>
        <ol class="timeline">${d.items.slice().sort(T.by('start')).map((x) => html`<li class="tl k-${x.kind}">
          <span class="tl-time num"><b>${x.start}</b>${x.end ? html`<small>〜${x.end}</small>` : ''}</span>
          <span class="tl-dot" aria-hidden="true"></span>
          <div class="tl-body">
            <span class="tl-kind">${T.KINDS[x.kind] || ''}</span>
            <b class="tl-title">${x.title}</b>
            <span class="tl-meta">${x.place ? html`<span>${icon('pin')} ${x.place}</span>` : ''}${x.who ? html`<span>${icon('user')} ${x.who}</span>` : ''}</span>
            ${x.note ? html`<span class="tl-note">${x.note}</span>` : ''}
            ${x.kind === 'section' && ev.sections.length ? html`<a class="small" href="#/sections">分科会と発表を見る →</a>` : ''}
          </div>
        </li>`)}</ol>
      </div>`;
    },
  });

  /* ── 分科会 ── */
  T.page('site', 'sections', {
    title: '分科会', en: 'SESSIONS', nav: true, order: 25,
    lead: '部会ごとの分科会と、研究発表の一覧です。',
    render(r) {
      const ev = T.ev();
      const bus = [...new Set(ev.sections.map((s) => s.bu))];
      const bu = r.q.bu || '';
      const list = ev.sections.filter((s) => !bu || s.bu === bu);
      return html`<div class="wrap s-body">
        <div class="seg" role="group" aria-label="部会">${['', ...bus].map((b) => html`<button data-act="go" data-to="sections${b ? '?bu=' + encodeURIComponent(b) : ''}" aria-pressed="${b === bu}">${b || 'すべての部会'}</button>`)}</div>
        <div class="sec-list">${list.map((s) => html`<article class="sec-card">
          <header><span class="sec-bu">${s.bu}</span><h3>${s.no}<span>${s.theme}</span></h3><p class="small muted">${icon('pin')} ${s.room || ''}　${s.chair ? html`${icon('user')} ${s.chair}` : ''}</p></header>
          ${s.talks.length ? html`<ol class="talks">${s.talks.map((t) => html`<li><span class="mono talk-time">${t.time || ''}</span><div><b>${t.title}</b><small>${t.presenter}（${t.school}）</small>${t.abstract ? html`<details><summary>要旨</summary><p>${t.abstract}</p></details>` : ''}</div></li>`)}</ol>` : html`<p class="muted small">発表は決まりしだい載せます。</p>`}
        </article>`)}</div>
      </div>`;
    },
  });

  /* ── 資料 ── */
  T.page('site', 'docs', {
    title: '資料', en: 'DOCUMENTS', nav: true, order: 30,
    lead: '要項・案内などの資料です。「参加者限定」の資料は、マイページに入ると見られます。',
    render() {
      const ev = T.ev();
      const me = T.me(ev);
      const docs = ev.docs.filter((d) => d.visibility !== 'staff');
      const cats = [...new Set(docs.map((d) => d.cat || 'その他'))];
      if (!docs.length) return html`<div class="wrap s-body"><p class="muted">資料は準備中です。</p></div>`;
      return html`<div class="wrap narrow s-body">${cats.map((c) => html`<h2 class="s-h2">${c}</h2><div class="doc-grid one">${docs.filter((d) => (d.cat || 'その他') === c).map((d) => T.docCard(d, me))}</div>`)}</div>`;
    },
  });

  /* ── 配信 ── */
  T.page('site', 'live', {
    title: '配信', en: 'LIVE', nav: true, order: 35,
    lead: '講演・まとめのライブ配信と、大会後のアーカイブです。',
    render() {
      const ev = T.ev();
      const me = T.me(ev);
      const vs = ev.videos.filter((v) => v.visibility !== 'hidden').sort((a, b) => (b.onAir - a.onAir) || String(a.when || '9').localeCompare(String(b.when || '9')));
      if (!vs.length) return html`<div class="wrap s-body"><p class="muted">配信は準備中です。</p></div>`;
      return html`<div class="wrap s-body">
        <div class="video-grid">${vs.map((v) => v.visibility === 'member' && !me ? html`<figure class="video"><div class="video-frame empty">${icon('lock')}<small>参加者限定</small></div><figcaption><b>${v.title}</b><small><a href="#/mypage">マイページに入ると見られます</a></small></figcaption></figure>` : T.videoCard(v))}</div>
        ${ev.info.youtubeChannel ? html`<p style="margin-top:24px"><a class="btn" href="${ev.info.youtubeChannel}" target="_blank" rel="noopener">${icon('video')} 大会のYouTubeチャンネル</a></p>` : ''}
      </div>`;
    },
    mount(root) { T.bindVideos(root); },
  });

  /* ── Q&A ── */
  T.page('site', 'faq', {
    title: 'Q&A', en: 'Q&A', nav: true, order: 40,
    lead: 'よくある質問です。見つからないときは、問い合わせからお送りください。',
    render(r) {
      const ev = T.ev();
      const qs = ev.faq.filter((q) => q.published);
      const word = r.q.w || '';
      const hit = qs.filter((q) => !word || (q.q + q.a + q.cat).includes(word));
      const cats = [...new Set(hit.map((q) => q.cat || 'その他'))];
      return html`<div class="wrap narrow s-body">
        <form class="faq-search" data-form="faqSearch"><label class="search">${icon('search')}<input type="search" name="w" value="${word}" placeholder="ことばで探す（例：駐車場）" aria-label="Q&Aを探す"></label><button class="btn">探す</button></form>
        ${cats.map((c) => html`<h2 class="s-h2">${c}</h2><div class="faq">${hit.filter((q) => (q.cat || 'その他') === c).map((q) => T.faqItem(q, !!word))}</div>`)}
        ${!hit.length ? html`<p class="muted">見つかりませんでした。</p>` : ''}
        <div class="note" style="margin-top:28px"><p>答えが見つからないときは <a href="#/contact">問い合わせ</a> から送ってください。申込のあとは、マイページからも送れます。</p></div>
      </div>`;
    },
    forms: { faqSearch(v) { T.go('faq' + (v.w ? '?w=' + encodeURIComponent(v.w) : '')); } },
  });

  /* ── アクセス ── */
  T.page('site', 'access', {
    title: '会場・アクセス', navLabel: 'アクセス', en: 'ACCESS', nav: true, order: 50,
    render() {
      const ev = T.ev();
      return html`<div class="wrap s-body"><div class="venue-grid">${ev.info.venues.map((v) => T.venueCard(v))}</div>
        ${ev.docs.some((d) => d.cat === '会場' && d.visibility === 'public') ? html`<h2 class="s-h2">会場の資料</h2><div class="doc-grid one">${ev.docs.filter((d) => d.cat === '会場' && d.visibility === 'public').map((d) => T.docCard(d))}</div>` : ''}
      </div>`;
    },
  });

  /* ── 問い合わせ ── */
  T.page('site', 'contact', {
    title: '問い合わせ', en: 'CONTACT', order: 90,
    lead: '大会の運営（実行委員会 事務局）に届きます。申込のあとの方は、マイページから送ると、やり取りがマイページに残ります。',
    render() {
      const ev = T.ev();
      const me = T.me(ev);
      if (me) return html`<div class="wrap narrow s-body"><div class="note"><p>${T.pname(me)} さんはマイページに入っています。<a href="#/mypage?tab=contact">マイページの「問い合わせ」</a>から送ると、回答もそこに出ます。</p></div></div>`;
      return html`<div class="wrap narrow s-body">
        <form class="card s-form" data-form="contact">
          ${T.fieldsHtml([
            { k: 'name', label: 'お名前', required: true },
            { k: 'email', label: 'メールアドレス', type: 'email', required: true },
            { k: 'cat', label: '分類', type: 'select', options: T.THREAD_CATS },
            { k: 'subject', label: '件名', required: true, full: true },
            { k: 'text', label: '内容', type: 'textarea', rows: 6, required: true },
          ])}
          <div class="row end" style="margin-top:16px"><button class="btn primary lg">${icon('send')} 送る</button></div>
        </form>
        <p class="small muted">よくある質問は <a href="#/faq">Q&amp;A</a> にまとめています。</p>
      </div>`;
    },
    forms: {
      contact(v, form) {
        if (!form.reportValidity()) return;
        T.thread.create({ name: v.name, email: v.email, cat: v.cat, subject: v.subject, text: v.text });
        T.save(true);
        document.querySelector('#main .s-body').innerHTML = String(html`<div class="card done-card"><span class="done-ic">${icon('check')}</span><h2>送りました</h2><p>お問い合わせを受け付けました。事務局から、メールで回答します。</p><a class="btn" href="#/">ホームへ</a></div>`);
        window.scrollTo(0, 0);
      },
    },
  });
})();
