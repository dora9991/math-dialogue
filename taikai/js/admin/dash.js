/* ダッシュボード：開催までの日数・申込と入金・問い合わせ・やること・申込の推移・最近のうごき */
(function () {
  'use strict';
  const { html, icon } = T;

  // 日ごとの申込数（棒）。1つの系列なので凡例は出さず、見出しで名前を示す。棒にふれると数が出る
  function dailyBars(ev, days = 30) {
    const end = new Date(T.today() + 'T00:00:00');
    const list = [];
    for (let k = days - 1; k >= 0; k--) { const d = new Date(end); d.setDate(d.getDate() - k); list.push(T.ymd(d)); }
    const cnt = T.groupCount(ev.people, (p) => T.ymd(p.createdAt));
    const vals = list.map((d) => cnt.get(d) || 0);
    const max = Math.max(4, ...vals);
    const step = max <= 8 ? 2 : max <= 20 ? 5 : 10;
    const top = Math.ceil(max / step) * step;
    const W = 640, H = 200, L = 30, B = 22, bw = (W - L) / days;
    const y = (v) => (H - B) - ((H - B - 8) * v) / top;
    let grid = '';
    for (let v = 0; v <= top; v += step) grid += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
    const bars = vals.map((v, k) => {
      const x = L + k * bw + 2, h = (H - B) - y(v), w = Math.max(2, bw - 4);
      const lab = `${T.md(list[k])}：${v}人`;
      return `<g class="bar-g" tabindex="0" aria-label="${lab}"><rect class="hit" x="${L + k * bw}" y="0" width="${bw}" height="${H - B}"/>${v ? `<path class="b" d="M${x} ${H - B}V${H - B - h + Math.min(4, h)}q0 -${Math.min(4, h)} ${Math.min(4, w / 2)} -${Math.min(4, h)}h${w - 2 * Math.min(4, w / 2)}q${Math.min(4, w / 2)} 0 ${Math.min(4, w / 2)} ${Math.min(4, h)}V${H - B}z"/>` : ''}<title>${lab}</title></g>`;
    }).join('');
    const ticks = list.map((d, k) => (k % 7 === (days - 1) % 7 ? `<text x="${L + k * bw + bw / 2}" y="${H - 6}" class="ax" text-anchor="middle">${T.md(d).replace(/（.）/, '')}</text>` : '')).join('');
    return { svg: `<svg class="dchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="この${days}日の、日ごとの申込数">${grid}${bars}<line x1="${L}" x2="${W}" y1="${H - B}" y2="${H - B}" class="base"/>${ticks}</svg>`, sum: T.sum(vals), week: T.sum(vals.slice(-7)) };
  }

  T.page('admin', 'dash', {
    title: 'ダッシュボード', icon: 'home', group: '', order: 0,
    head() { return html`<a class="btn" href="#/admin/checkin">${icon('scan')} 受付を開く</a><a class="btn primary" href="#/admin/mail">${icon('mail')} 一斉連絡</a>`; },
    render() {
      const ev = T.ev(), i = ev.info;
      const act = T.active(ev);
      const feeP = act.filter((p) => T.fee(p, ev) > 0);
      const paid = feeP.filter((p) => p.paid);
      const unpaidYen = T.sum(feeP.filter((p) => !p.paid), (p) => T.fee(p, ev));
      const paidYen = T.sum(paid, (p) => T.fee(p, ev));
      const checked = act.filter((p) => Object.keys(p.checkin || {}).length);
      const openTh = ev.threads.filter((t) => t.status === 'open');
      const days = i.start ? T.daysUntil(i.start) : null;
      const close = i.applyClose ? T.daysUntil(i.applyClose) : null;
      const st = T.applyState ? T.applyState(ev) : { label: '' };
      const chart = dailyBars(ev);
      const bu = [...T.groupCount(act, (p) => p.a.bu).entries()].sort((a, b) => b[1] - a[1]);
      const buMax = Math.max(1, ...bu.map((x) => x[1]));
      const soon = ev.tasks.filter((t) => t.status !== 'done').sort(T.by('due')).slice(0, 5);
      const today = T.today();
      const during = i.start && today >= i.start && today <= (i.end || i.start);
      return html`
        <div class="dash-hero">
          <div class="dash-count">
            <span class="k">開催まで</span>
            <b>${days == null ? '—' : days > 0 ? days : during ? '開催中' : '終了'}</b>${days > 0 ? html`<span class="u">日</span>` : ''}
            <span class="d">${T.period(ev)}</span>
          </div>
          <div class="dash-sub">
            <div><span class="chip ${st.open ? 'ok' : 'warn'}">申込 ${st.label}</span>${close != null && close >= 0 ? html` <span class="muted small">締切まで あと${close}日（${T.md(i.applyClose)}）</span>` : ''}</div>
            <div class="kpi-line"><span class="muted small">定員</span><b>${act.length}</b><span class="muted small">/ ${i.capacity || '—'} 人</span></div>
            ${i.capacity ? html`<div class="bar gold" title="${T.pct(act.length, i.capacity)}"><span style="width:${Math.min(100, (act.length / i.capacity) * 100)}%"></span></div>` : ''}
          </div>
        </div>
        ${during ? html`<div class="note ok" style="margin-top:14px"><p><b>大会の当日です。</b> 受付は <a href="#/admin/checkin">受付（QR）</a> から。受付ずみ ${checked.length} / ${act.length} 人</p></div>` : ''}

        <div class="stats" style="margin-top:16px">
          <a class="stat link" href="#/admin/people"><div class="stat-label">${icon('users')} 申込</div><div class="stat-value">${act.length}<small>人</small></div><div class="stat-sub">この7日 +${chart.week}　取消 ${ev.people.length - act.length}</div></a>
          <a class="stat link" href="#/admin/people"><div class="stat-label">${icon('yen')} 入金</div><div class="stat-value">${T.pct(paid.length, feeP.length)}</div><div class="stat-sub">${paid.length}/${feeP.length}人　${T.yen(paidYen)}</div><div class="bar ok"><span style="width:${feeP.length ? (paid.length / feeP.length) * 100 : 0}%"></span></div></a>
          <a class="stat link" href="#/admin/people"><div class="stat-label">${icon('clock')} 未入金</div><div class="stat-value">${T.yen(unpaidYen)}</div><div class="stat-sub">${feeP.length - paid.length}人</div></a>
          <a class="stat link" href="#/admin/inbox"><div class="stat-label">${icon('chat')} 未対応の問い合わせ</div><div class="stat-value ${openTh.length ? 'warn-t' : ''}">${openTh.length}<small>件</small></div><div class="stat-sub">対応中 ${ev.threads.filter((t) => t.status === 'doing').length}件</div></a>
          <a class="stat link" href="#/admin/checkin"><div class="stat-label">${icon('scan')} 受付ずみ</div><div class="stat-value">${checked.length}<small>人</small></div><div class="stat-sub">${during ? '当日' : '大会の当日に使います'}</div></a>
        </div>

        <div class="dash-grid">
          <section class="card">
            <div class="card-head"><h2>日ごとの申込数（この30日）</h2><span class="spacer"></span><span class="muted small">30日で ${chart.sum}人</span></div>
            ${T.raw(chart.svg)}
            <div class="chart-tip" hidden></div>
          </section>
          <section class="card">
            <div class="card-head"><h2>部会ごとの申込</h2></div>
            <table class="hbars">${bu.map(([k, v]) => html`<tr><th>${k}</th><td><div class="bar"><span style="width:${(v / buMax) * 100}%"></span></div></td><td class="num right"><b>${v}</b>人</td></tr>`)}</table>
            <p class="small muted" style="margin:10px 0 0"><a href="#/admin/people">参加者・入金</a> の「集計」に、弁当・講習会などの数もあります。</p>
          </section>
          <section class="card">
            <div class="card-head"><h2>${icon('chat')} 問い合わせ（未対応）</h2><span class="spacer"></span><a class="small" href="#/admin/inbox">すべて</a></div>
            ${openTh.length ? html`<ul class="dlist">${openTh.slice(0, 5).map((t) => html`<li><a href="#/admin/inbox/${t.id}"><b>${t.subject}</b><small>${t.name}・${T.ago(t.at)}</small></a></li>`)}</ul>` : html`<p class="muted small">未対応はありません。</p>`}
          </section>
          <section class="card">
            <div class="card-head"><h2>${icon('board')} 期限が近いやること</h2><span class="spacer"></span><a class="small" href="#/admin/board">運営ボード</a></div>
            ${soon.length ? html`<ul class="dlist">${soon.map((t) => { const d = t.due ? T.daysUntil(t.due) : null; return html`<li><a href="#/admin/board"><b>${t.title}</b><small>${t.who || t.team || ''}　<span class="${d != null && d < 0 ? 'bad-t' : d != null && d <= 7 ? 'warn-t' : ''}">${t.due ? T.md(t.due) + (d < 0 ? `（${-d}日すぎ）` : d === 0 ? '（今日）' : `（あと${d}日）`) : ''}</span></small></a></li>`; })}</ul>` : html`<p class="muted small">やることはありません。</p>`}
          </section>
          <section class="card">
            <div class="card-head"><h2>${icon('spark')} すぐやる</h2></div>
            <div class="quick">
              <a href="#/admin/news">${icon('megaphone')}<span>お知らせを書く</span></a>
              <a href="#/admin/docs">${icon('upload')}<span>資料（PDF）を載せる</span></a>
              <a href="#/admin/live">${icon('video')}<span>配信のURLを入れる</span></a>
              <a href="#/admin/survey">${icon('chart')}<span>アンケート</span></a>
              <a href="#/admin/booklet">${icon('book')}<span>大会冊子をつくる</span></a>
              <a href="#/print/badges?back=admin">${icon('print')}<span>名札を印刷</span></a>
            </div>
          </section>
          <section class="card">
            <div class="card-head"><h2>${icon('clock')} 最近のうごき</h2></div>
            <ul class="dlist log">${ev.log.slice(0, 7).map((l) => html`<li><span>${l.text}</span><small>${l.who}・${T.ago(l.at)}</small></li>`)}</ul>
          </section>
        </div>`;
    },
    mount(root) {
      // 棒にふれたら、数を小さな札で出す（キーボードでも）
      const svg = root.querySelector('.dchart'), tip = root.querySelector('.chart-tip');
      if (!svg || !tip) return;
      const show = (g) => { const r = g.getBoundingClientRect(), pr = svg.parentElement.getBoundingClientRect(); tip.textContent = g.getAttribute('aria-label'); tip.hidden = false; tip.style.left = (r.left - pr.left + r.width / 2) + 'px'; tip.style.top = (r.top - pr.top - 4) + 'px'; svg.querySelectorAll('.bar-g.on').forEach((x) => x.classList.remove('on')); g.classList.add('on'); };
      const hide = () => { tip.hidden = true; svg.querySelectorAll('.bar-g.on').forEach((x) => x.classList.remove('on')); };
      svg.querySelectorAll('.bar-g').forEach((g) => { g.addEventListener('mouseenter', () => show(g)); g.addEventListener('focus', () => show(g)); g.addEventListener('mouseleave', hide); g.addEventListener('blur', hide); });
    },
  });
})();
