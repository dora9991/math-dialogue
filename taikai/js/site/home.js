/* 公開サイトのホーム：ヒーロー（大会名・会期・カウントダウン）→ お知らせ → 大会主題 → 開催概要 → 日程 → 分科会 → 配信 → 資料 → 申込の帯 → Q&A → アクセス */
(function () {
  'use strict';
  const { html, icon } = T;
  const EN_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const d8 = (s) => new Date(s + 'T00:00:00');
  const cssv = (k, d) => getComputedStyle(document.documentElement).getPropertyValue(k).trim() || d;

  // 2027.8.3 TUE — 8.6 FRI
  function enPeriod(i) {
    if (!i.start) return '';
    const a = d8(i.start), b = d8(i.end || i.start);
    const A = `${a.getFullYear()}.${a.getMonth() + 1}.${a.getDate()}`;
    if (i.start === (i.end || i.start)) return html`${A} <small>${EN_DOW[a.getDay()]}</small>`;
    return html`${A} <small>${EN_DOW[a.getDay()]}</small> <span class="dash">—</span> ${b.getMonth() + 1}.${b.getDate()} <small>${EN_DOW[b.getDay()]}</small>`;
  }
  // 「全国算数・数学教育研究（佐賀）大会」→ 2行に
  function titleLines(name) {
    const k = name.indexOf('（');
    return k > 0 ? html`${name.slice(0, k)}<br><span class="hero-title-2">${name.slice(k)}</span>` : name;
  }
  T.feeSummary = (ev = T.ev()) => {
    const f = ev.form.fields.find((x) => x.id === 'kind');
    return f ? f.options.map((o) => ({ label: o.v, fee: Number(o.fee) || 0 })) : [];
  };

  T.page('site', 'home', {
    title: 'ホーム',
    render() {
      const ev = T.ev(), i = ev.info;
      const days = i.start ? T.daysUntil(i.start) : null;
      const st = T.applyState(ev);
      const news = ev.news.filter((n) => n.published).sort((a, b) => (b.pinned - a.pinned) || (a.date < b.date ? 1 : -1));
      const latest = ev.news.filter((n) => n.published).sort(T.by('date', -1))[0];
      const live = ev.videos.filter((v) => v.visibility === 'public' && T.ytId(v.url));
      const docs = ev.docs.filter((d) => d.visibility !== 'staff').slice(0, 4);
      const bus = [...new Set(ev.sections.map((s) => s.bu))];
      const faq = ev.faq.filter((q) => q.published).slice(0, 4);
      const fees = T.feeSummary(ev);
      return html`
      <section class="hero" aria-label="大会の案内">
        <canvas class="hero-canvas" aria-hidden="true"></canvas>
        <div class="hero-wave" aria-hidden="true" style="background-image:${T.seigaiha(cssv('--ev-accent', '#d4ad57'), 0.22, cssv('--ev-ink', '#0a1530'))}"></div>
        <div class="hero-in wrap">
          <p class="hero-eyebrow"><span>${i.org || ''}</span><span class="hero-rule"></span><span class="en">${i.nameEn || ''}</span></p>
          ${i.no ? html`<p class="hero-no" aria-label="第${i.no}回"><span class="ja">第</span><span class="n">${i.no}</span><span class="ja">回</span></p>` : ''}
          <h1 class="hero-title">${titleLines(i.name || '')}</h1>
          ${i.catch ? html`<p class="hero-catch">${i.catch}</p>` : ''}
          <div class="hero-meta">
            <div><span class="k">DATE</span><b class="v">${enPeriod(i)}</b><span class="j">${T.period(ev)}</span></div>
            <div><span class="k">VENUE</span><b class="v ja">${i.city || ((i.venues[0] || {}).name) || ''}</b><span class="j">${(i.venues[0] || {}).name || ''} ほか</span></div>
          </div>
          <div class="hero-cta">
            ${st.open ? html`<a class="btn gold lg" href="#/apply">参加申込 ${icon('arrow')}</a>` : html`<span class="btn lg glass" aria-disabled="true">参加申込：${st.label}</span>`}
            <a class="btn lg glass" href="#/program">${icon('calendar')} プログラム</a>
            ${ev.videos.some((v) => v.visibility !== 'hidden') ? html`<a class="btn lg glass" href="#/live">${icon('video')} 配信</a>` : ''}
          </div>
        </div>
        ${days != null && days >= 0 ? html`<div class="hero-count" aria-label="開催まで あと${days}日">
          <span class="k">COUNTDOWN</span>
          <span class="n"><small>あと</small><b>${days === 0 ? '本日' : days}</b>${days === 0 ? '' : html`<small>日</small>`}</span>
          <span class="j">申込 ${st.label}${st.note ? html`<br><span>${st.note}</span>` : ''}</span>
        </div>` : ''}
        ${latest ? html`<a class="hero-ticker" href="#/news/${latest.id}"><span class="tag">NEWS</span><span class="date">${T.dot(latest.date)}</span><span class="t">${latest.title}</span>${icon('arrow')}</a>` : ''}
      </section>

      <section class="s-sec s-news-sec">
        <div class="wrap">
          ${T.sHead('NEWS', 'お知らせ', ['#/news', 'すべて見る'])}
          ${news.length ? html`<ul class="news-list">${news.slice(0, 5).map((n) => T.newsRow(n))}</ul>` : html`<p class="muted">お知らせはまだありません。</p>`}
        </div>
      </section>

      ${i.theme ? html`<section class="s-sec s-theme">
        <div class="wrap s-theme-in">
          <p class="s-en">THEME</p>
          <h2 class="s-theme-label">大会主題</h2>
          <p class="s-theme-main"><span class="q">「</span>${i.theme}<span class="q">」</span></p>
          ${i.subtheme ? html`<p class="s-theme-sub">${i.subtheme}</p>` : ''}
          ${i.themeNote ? html`<p class="s-theme-note">${T.text(i.themeNote)}</p>` : ''}
          <a class="s-more" href="#/about">大会概要 ${icon('arrow')}</a>
        </div>
      </section>` : ''}

      <section class="s-sec">
        <div class="wrap">
          ${T.sHead('OUTLINE', '開催概要')}
          <dl class="outline">
            <div><dt>${icon('calendar')} 期日</dt><dd>${T.period(ev)}</dd></div>
            <div><dt>${icon('pin')} 会場</dt><dd>${i.venues.map((v) => html`<span class="ol-v">${v.name}${v.role ? html`<small>${v.role}</small>` : ''}</span>`)}</dd></div>
            <div><dt>${icon('flag')} 主催など</dt><dd>${(i.hosts || []).map((h) => html`<span class="ol-v"><small>${h.role}</small>${h.names}</span>`)}</dd></div>
            <div><dt>${icon('form')} 参加申込</dt><dd><span class="chip ${st.open ? 'ok' : 'warn'}">${st.label}</span> ${i.applyOpen ? T.dateJa(i.applyOpen) : ''}〜${i.applyClose ? T.dateJa(i.applyClose) : ''}</dd></div>
            ${fees.length ? html`<div><dt>${icon('yen')} 参加費</dt><dd class="fees">${fees.map((f) => html`<span><small>${f.label}</small><b>${f.fee ? T.yen(f.fee) : '無料'}</b></span>`)}</dd></div>` : ''}
          </dl>
        </div>
      </section>

      ${ev.program.days.length ? html`<section class="s-sec s-alt">
        <div class="wrap">
          ${T.sHead('SCHEDULE', '日程', ['#/program', 'プログラムを見る'])}
          <div class="days">${ev.program.days.map((d) => { const dt = d8(d.date); return html`<a class="day-card" href="#/program?d=${d.id}">
            <span class="day-date"><b>${dt.getMonth() + 1}.${dt.getDate()}</b><small>${EN_DOW[dt.getDay()]}</small></span>
            <span class="day-label">${d.label}</span>
            <ul>${d.items.filter((x) => x.kind !== 'break' && x.kind !== 'info').slice(0, 3).map((x) => html`<li><span class="mono">${x.start}</span>${x.title.replace(/「.*?」/, '')}</li>`)}</ul>
          </a>`; })}</div>
        </div>
      </section>` : ''}

      ${ev.sections.length ? html`<section class="s-sec">
        <div class="wrap">
          ${T.sHead('SESSIONS', '部会・分科会', ['#/sections', '分科会と発表を見る'])}
          <div class="bu-grid">${bus.map((b, k) => { const ss = ev.sections.filter((s) => s.bu === b); return html`<a class="bu-card" href="#/sections?bu=${encodeURIComponent(b)}" style="--k:${k}">
            <span class="bu-name">${b}</span>
            <span class="bu-n"><b>${ss.length}</b>分科会　<b>${T.sum(ss, (s) => s.talks.length)}</b>発表</span>
            <span class="bu-themes">${ss.map((s) => s.theme).join('・')}</span>
          </a>`; })}</div>
        </div>
      </section>` : ''}

      ${live.length ? html`<section class="s-sec s-dark">
        <div class="wrap">
          ${T.sHead('LIVE', '配信', ['#/live', '配信のページへ'])}
          <div class="live-feature">${T.videoCard(live[0], true)}<div class="live-side">${ev.videos.filter((v) => v.visibility !== 'hidden').slice(0, 4).map((v) => html`<a class="live-row" href="#/live"><span class="chip ${v.onAir ? 'bad' : v.kind === 'live' ? 'gold' : ''}">${v.onAir ? 'LIVE' : { live: 'ライブ', archive: 'アーカイブ', info: '紹介' }[v.kind] || ''}</span><span>${v.title}</span><small>${v.when ? T.dt(v.when) : ''}</small></a>`)}</div></div>
        </div>
      </section>` : ''}

      ${docs.length ? html`<section class="s-sec">
        <div class="wrap">
          ${T.sHead('DOCUMENTS', '資料', ['#/docs', 'すべての資料'])}
          <div class="doc-grid">${docs.map((d) => T.docCard(d))}</div>
        </div>
      </section>` : ''}

      <section class="s-sec s-cta" style="background-image:${T.seigaiha('#ffffff', 0.07, cssv('--ev-deep', '#13265a'))}">
        <div class="wrap s-cta-in">
          <div>
            <p class="s-en">REGISTRATION</p>
            <h2>参加申込</h2>
            <p>申し込むと、<b>受付番号</b>と<b>本人用のQRコード</b>が出ます。当日は、QRコードを見せるだけで受付が終わります。</p>
            <ol class="steps"><li><b>1</b>フォームに入力</li><li><b>2</b>QRコードを受け取る</li><li><b>3</b>参加費を振り込む</li><li><b>4</b>当日、QRで受付</li></ol>
          </div>
          <div class="s-cta-box">
            <span class="chip ${st.open ? 'ok' : 'warn'}">${st.label}</span>
            <p class="s-cta-dl">${st.note}</p>
            ${st.open ? html`<a class="btn gold lg" href="#/apply">申込フォームへ ${icon('arrow')}</a>` : ''}
            <a class="btn lg glass" href="#/mypage">${icon('user')} マイページ（申込のあと）</a>
          </div>
        </div>
      </section>

      ${faq.length ? html`<section class="s-sec">
        <div class="wrap narrow">
          ${T.sHead('Q&A', 'よくある質問', ['#/faq', 'すべての質問'])}
          <div class="faq">${faq.map((q) => T.faqItem(q))}</div>
        </div>
      </section>` : ''}

      ${i.venues.length ? html`<section class="s-sec s-alt">
        <div class="wrap">
          ${T.sHead('ACCESS', '会場・アクセス', ['#/access', 'くわしく'])}
          <div class="venue-grid">${i.venues.map((v) => T.venueCard(v))}</div>
        </div>
      </section>` : ''}
      `;
    },
    mount(root) {
      const c = root.querySelector('.hero-canvas');
      if (c) T.heroStop = T.hero(c);
      T.bindVideos(root);
    },
  });

  /* ── 何度も使う部品（ほかのページでも使う） ── */
  T.newsRow = (n) => html`<li><a class="news-row" href="#/news/${n.id}">
    <span class="news-date num">${T.dot(n.date)}</span>
    <span class="news-cat cat-${{ 重要: 'imp', 申込: 'app', 資料: 'doc', 配信: 'live' }[n.cat] || 'etc'}">${n.cat}</span>
    <span class="news-title">${n.pinned ? html`<span class="pin" title="固定">${icon('pushpin')}</span>` : ''}${n.title}${T.isNew(n.date) ? html`<span class="new">NEW</span>` : ''}</span>
    ${icon('arrow', 'news-arrow')}
  </a></li>`;

  T.docCard = (d, me) => {
    const locked = d.visibility === 'member' && !me;
    return html`<div class="doc-card ${locked ? 'locked' : ''}">
      <span class="doc-ic">${locked ? icon('lock') : icon('file')}<small>${(d.fileName || '').split('.').pop().toUpperCase() || 'FILE'}</small></span>
      <span class="doc-main"><span class="doc-cat">${d.cat || ''}${d.visibility === 'member' ? '・参加者限定' : ''}</span><b>${d.title}</b><small>${d.note || ''}</small></span>
      ${locked ? html`<a class="btn sm" href="#/mypage">マイページで見る</a>` : d.hasFile ? html`<button class="btn sm primary" data-act="openDoc" data-id="${d.id}">${icon('eye')} 開く</button>` : html`<span class="chip">準備中</span>`}
    </div>`;
  };
  T.globalActs.openDoc = (el) => { const ev = T.ev(); const d = T.find(ev.docs, el.dataset.id); if (d) T.openFile(ev.id, d); };

  // 動画のカード。押すまで YouTube を読みこまない（速さと、見る人の情報のため）
  T.videoCard = (v, big) => {
    const id = T.ytId(v.url);
    return html`<figure class="video ${big ? 'big' : ''}">
      ${id ? html`<button class="video-frame" data-yt="${id}" aria-label="${v.title} を再生"><img src="${T.ytThumb(id)}" alt="" loading="lazy" onerror="this.remove()"><span class="video-play">${icon('play')}</span>${v.onAir ? html`<span class="video-live"><span class="live-dot"></span>LIVE</span>` : ''}</button>`
        : html`<div class="video-frame empty"><span>${icon('clock')}</span><small>${v.when ? T.dateJa(v.when) + ' ' + T.time(v.when) + ' から' : '準備中'}</small></div>`}
      <figcaption><b>${v.title}</b>${v.note ? html`<small>${v.note}</small>` : ''}</figcaption>
    </figure>`;
  };
  T.bindVideos = (root) => {
    root.querySelectorAll('[data-yt]').forEach((b) => b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = T.ytEmbed(b.dataset.yt) + '&autoplay=1';
      f.title = b.getAttribute('aria-label') || 'YouTube';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      b.replaceWith(f);
    }));
  };

  T.faqItem = (q, open) => html`<details class="faq-item" ${open ? T.raw('open') : ''}><summary><span class="faq-q">Q</span><span>${q.q}</span></summary><div class="faq-a"><span class="faq-q a">A</span><div>${T.text(q.a)}</div></div></details>`;

  T.venueCard = (v) => html`<div class="venue-card">
    <span class="venue-role">${v.role || ''}</span>
    <b>${v.name}</b>
    <p class="small muted">${v.address || ''}</p>
    ${v.access ? html`<p class="small">${T.text(v.access)}</p>` : ''}
    ${v.map || (v.address && !/調整中|佐賀市内$/.test(v.name + v.address)) ? html`<a class="btn sm" href="${v.map || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.name.replace(/（.*?）/g, '') + ' ' + v.address.replace(/（.*?）/g, ''))}" target="_blank" rel="noopener">${icon('pin')} 地図</a>` : ''}
  </div>`;
})();
