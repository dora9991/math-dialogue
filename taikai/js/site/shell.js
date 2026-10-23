/* 公開サイトの外枠：上のメニュー・下の帯・配信中の帯・ヒーローの背景（数学の曲線のアニメ）
   ページの足し方：T.page('site', 'faq', { title:'Q&A', en:'Q&A', nav:true, order:60, render(r) {…}, mount(root, r) {…}, acts, forms })
   nav:true のページは上のメニューに出る（order の順）。 */
(function () {
  'use strict';
  const { html, icon } = T;
  const app = () => document.getElementById('app');

  /* ── マイページに入っている人 ── */
  const MEKEY = (ev) => 'taikai.me.' + ev.id;
  T.me = (ev = T.ev()) => {
    try {
      const s = JSON.parse(localStorage.getItem(MEKEY(ev)) || 'null');
      if (!s) return null;
      const p = ev.people.find((x) => x.id === s.pid && x.token === s.token);
      return p && p.status !== 'cancel' ? p : null;
    } catch (e) { return null; }
  };
  T.meLogin = (p, ev = T.ev()) => { try { localStorage.setItem(MEKEY(ev), JSON.stringify({ pid: p.id, token: p.token })); } catch (e) { /* なにもしない */ } };
  T.meLogout = (ev = T.ev()) => { try { localStorage.removeItem(MEKEY(ev)); } catch (e) { /* なにもしない */ } };

  // 申込を受け付けているか
  T.applyState = (ev = T.ev()) => {
    const i = ev.info, t = T.today();
    if (i.applyOpen && t < i.applyOpen) return { open: false, label: '受付前', note: T.dateJa(i.applyOpen) + 'から受付' };
    if (i.applyClose && t > i.applyClose) return { open: false, label: '受付終了', note: '申込の受付は終わりました' };
    if (i.capacity && T.active(ev).length >= i.capacity) return { open: false, label: '定員に達しました', note: '定員に達したため、受付を締め切りました' };
    return { open: true, label: '受付中', note: i.applyClose ? T.dateJa(i.applyClose) + 'まで' : '' };
  };

  function header(r, onHero) {
    const ev = T.ev(), i = ev.info;
    const pages = Object.values(T.pages.site).filter((p) => p.nav).sort((a, b) => (a.order || 50) - (b.order || 50));
    const me = T.me(ev);
    const st = T.applyState(ev);
    return html`<header class="s-head ${onHero ? 'on-hero' : ''}" id="s-head">
      <div class="s-head-in">
        <a class="s-brand" href="#/" aria-label="ホーム">
          <span class="s-logo">${T.raw(T.logoSvg())}</span>
          <span class="s-brand-t"><small>${i.no ? '第' + i.no + '回' : ''} ${i.orgShort || ''}</small><b>${i.short || i.name}</b></span>
        </a>
        <nav class="s-nav" aria-label="サイトのメニュー">${pages.map((p) => html`<a href="#/${p.id}" class="${r.id === p.id || (p.id === 'news' && r.id === 'news') ? 'on' : ''}">${p.navLabel || p.title}</a>`)}</nav>
        <div class="s-head-btns">
          <a class="btn sm s-my" href="#/mypage">${icon('user')}<span>${me ? 'マイページ' : 'マイページ'}</span></a>
          ${st.open ? html`<a class="btn sm gold s-apply" href="#/apply">参加申込</a>` : ''}
          <button class="icon-btn s-burger" data-act="sNav" aria-label="メニューを開く" aria-expanded="false">${icon('menu')}</button>
        </div>
      </div>
      <div class="s-drawer" id="s-drawer" hidden>
        <nav aria-label="サイトのメニュー（スマホ）">${[{ id: '', title: 'ホーム' }, ...pages].map((p) => html`<a href="#/${p.id}">${p.navLabel || p.title}<small>${p.en || ''}</small></a>`)}
          <a href="#/mypage">マイページ<small>MY PAGE</small></a>${st.open ? html`<a href="#/apply" class="gold">参加申込<small>REGISTRATION</small></a>` : ''}</nav>
      </div>
    </header>`;
  }

  function liveBar() {
    const ev = T.ev();
    const v = ev.videos.find((x) => x.onAir && x.visibility !== 'hidden');
    return v ? html`<a class="s-livebar" href="#/live"><span class="live-dot"></span><b>LIVE</b><span>配信中：${v.title}</span>${icon('arrow')}</a>` : '';
  }

  function footer() {
    const ev = T.ev(), i = ev.info, o = i.office || {};
    return html`<footer class="s-foot">
      <div class="wrap s-foot-in">
        <div class="s-foot-brand">
          <span class="s-logo lg">${T.raw(T.logoSvg())}</span>
          <div><p class="s-foot-org">${i.org || ''}</p><p class="s-foot-title">${T.eventTitle(ev)}</p><p class="s-foot-date">${T.period(ev)}　${i.city || ''}</p></div>
        </div>
        <div class="s-foot-cols">
          <div><h4>問い合わせ</h4><p>${o.name || ''}<br>${o.person ? html`${o.person}<br>` : ''}${o.email ? html`<a href="mailto:${o.email}">${o.email}</a><br>` : ''}${o.tel || ''}<br>${o.address || ''}</p><a class="btn sm" href="#/contact">${icon('chat')} フォームで問い合わせる</a></div>
          <div><h4>主催など</h4>${(i.hosts || []).map((h) => html`<p><span class="muted">${h.role}</span>　${h.names}</p>`)}</div>
          <div><h4>リンク</h4>${(i.links || []).map((l) => html`<p><a href="${l.url}" target="_blank" rel="noopener">${l.label} ${icon('external')}</a></p>`)}<p><a href="#/mypage">マイページ</a>　<a href="#/faq">Q&amp;A</a></p></div>
        </div>
      </div>
      <div class="wrap s-foot-bottom"><span>© ${new Date(i.start || Date.now()).getFullYear()} ${i.orgShort || ''} ${i.short || ''}</span><span class="spacer"></span><a href="#/admin">${icon('lock')} 運営者ログイン</a><span class="muted">大会運営キット</span></div>
    </footer>`;
  }

  T.shells.site = (r, o = {}) => {
    document.body.className = 'is-site';
    const ev = T.ev();
    if (!ev) { app().innerHTML = '<p style="padding:24px">大会がありません。</p>'; return; }
    T.applyTheme(ev);
    const pg = T.pages.site[r.id] || T.pages.site.home;
    T.activePage = pg;
    if (T.heroStop) { T.heroStop(); T.heroStop = null; }
    const isHome = pg.id === 'home';
    document.title = (isHome ? '' : pg.title + '｜') + T.eventTitle(ev);
    let body;
    try { body = pg.render(r); } catch (e) { console.error(e); body = html`<div class="wrap"><div class="note bad">このページを開けませんでした：${e.message}</div></div>`; }
    app().innerHTML = String(html`${liveBar()}${header(r, isHome)}
      <main id="main" class="s-main ${isHome ? 'home' : 'sub'}">
        ${isHome ? '' : html`<div class="s-pagehead"><div class="wrap"><p class="s-en">${pg.en || ''}</p><h1>${pg.heading ? pg.heading(r) : pg.title}</h1>${pg.lead ? html`<p class="s-lead">${typeof pg.lead === 'function' ? pg.lead(r) : pg.lead}</p>` : ''}</div></div>`}
        ${body}
      </main>
      ${footer()}
      ${ev.info.sample ? html`<div class="sample-ribbon">SAMPLE（サンプルのデータ）</div>` : ''}`);
    if (pg.mount) { try { pg.mount(app().querySelector('#main'), r); } catch (e) { console.error(e); } }
    // ページを移ったら上へ（同じページの描きなおしのときは、そのまま）
    if (!o.keepScroll && T._lastSite !== location.hash) window.scrollTo(0, 0);
    T._lastSite = location.hash;
    onScroll();
  };

  function onScroll() {
    const h = document.getElementById('s-head');
    if (h) h.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  Object.assign(T.globalActs, {
    sNav(el) {
      const d = document.getElementById('s-drawer');
      const open = d.hidden;
      d.hidden = !open;
      el.setAttribute('aria-expanded', String(open));
      document.getElementById('s-head').classList.toggle('drawer-open', open);
    },
  });

  /* ── 見出し（英字の小さなラベル＋明朝の見出し） ── */
  T.sHead = (en, ja, more) => html`<div class="s-sec-head"><p class="s-en">${en}</p><h2>${ja}</h2>${more ? html`<a class="s-more" href="${more[0]}">${more[1]} ${icon('arrow')}</a>` : ''}</div>`;

  /* ── ヒーローの背景：方眼・同心円と、金の線で描かれていく曲線、ただよう数式 ── */
  T.hero = (canvas) => {
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = getComputedStyle(document.documentElement);
    const gold = css.getPropertyValue('--ev-accent').trim() || '#d4ad57';
    const gold2 = css.getPropertyValue('--ev-accent2').trim() || '#f1dca2';
    let W = 0, H = 0, dpr = 1, raf = 0, running = true, t0 = performance.now();
    let base = null;
    // 描く曲線たち（媒介変数表示。0〜2π·turns）
    const CURVES = [
      { name: 'hypotrochoid', turns: 3, f: (t) => { const R = 5, r = 3, d = 4.2; return [(R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)]; }, s: 1 / 6.4 },
      { name: 'rose', turns: 1, f: (t) => { const k = 7 / 3, rr = Math.cos(k * t * 3); return [rr * Math.cos(t * 3), rr * Math.sin(t * 3)]; }, s: 1 },
      { name: 'epitrochoid', turns: 1, f: (t) => { const R = 3, r = 1, d = 1.6; return [(R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t), (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t)]; }, s: 1 / 5.6 },
      { name: 'lissajous', turns: 1, f: (t) => [Math.sin(5 * t + Math.PI / 2), Math.sin(4 * t)], s: 1 },
    ];
    const GLYPHS = ['π', '∑', '∫', '√2', 'eⁱᵖ + 1 = 0', 'a² + b² = c²', 'φ', '∞', 'Δ', 'f(x)', 'n!', '∮', 'θ', 'sin²θ + cos²θ = 1', 'ℝ', '∂'];
    let glyphs = [];
    let ci = 0, prog = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      base = document.createElement('canvas');
      base.width = canvas.width; base.height = canvas.height;
      const b = base.getContext('2d');
      b.scale(dpr, dpr);
      // 方眼
      const step = W < 700 ? 40 : 56;
      b.lineWidth = 1;
      for (let x = (W % step) / 2; x < W; x += step) { b.strokeStyle = 'rgba(255,255,255,.035)'; b.beginPath(); b.moveTo(x + .5, 0); b.lineTo(x + .5, H); b.stroke(); }
      for (let y = (H % step) / 2; y < H; y += step) { b.strokeStyle = 'rgba(255,255,255,.035)'; b.beginPath(); b.moveTo(0, y + .5); b.lineTo(W, y + .5); b.stroke(); }
      // 同心円と放射線（極座標）
      const [cx, cy, R] = center();
      b.strokeStyle = hexA(gold, .09);
      for (let k = 1; k <= 6; k++) { b.beginPath(); b.arc(cx, cy, (R * k) / 5, 0, Math.PI * 2); b.stroke(); }
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; b.beginPath(); b.moveTo(cx + Math.cos(a) * R * 0.2, cy + Math.sin(a) * R * 0.2); b.lineTo(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2); b.strokeStyle = hexA(gold, k % 6 === 0 ? .1 : .04); b.stroke(); }
      glyphs = Array.from({ length: W < 700 ? 7 : 12 }, (_, k) => ({ s: GLYPHS[k % GLYPHS.length], x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 10, size: 14 + Math.random() * 22, a: .05 + Math.random() * .09 }));
    }
    function center() { const wide = W > 900; return wide ? [W * 0.72, H * 0.46, Math.min(H * 0.42, 420)] : [W * 0.82, Math.min(H * 0.2, 220), W * 0.5]; }
    function hexA(hex, a) { const m = hex.replace('#', '').match(/.{2}/g); if (!m) return `rgba(212,173,87,${a})`; const [r, g, b] = m.map((x) => parseInt(x, 16)); return `rgba(${r},${g},${b},${a})`; }

    function path(c, upto) {
      const [cx, cy, R] = center();
      const N = 1400, end = Math.max(2, Math.floor(N * upto)), T2 = Math.PI * 2 * c.turns;
      const rot = (performance.now() - t0) / 60000;
      ctx.beginPath();
      for (let i = 0; i <= end; i++) {
        const [x, y] = c.f((i / N) * T2);
        const X = x * c.s * R, Y = y * c.s * R;
        const px = cx + X * Math.cos(rot) - Y * Math.sin(rot), py = cy + X * Math.sin(rot) + Y * Math.cos(rot);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      return end / N;
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(64, now - (frame.last || now)); frame.last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      // ただよう数式
      ctx.textAlign = 'center';
      for (const g of glyphs) {
        if (!reduce) { g.y -= (g.v * dt) / 1000; if (g.y < -30) { g.y = H + 30; g.x = Math.random() * W; } }
        ctx.font = `italic ${g.size}px 'Cormorant Garamond', 'Times New Roman', serif`;
        ctx.fillStyle = `rgba(255,255,255,${g.a})`;
        ctx.fillText(g.s, g.x, g.y);
      }
      // 曲線：描いて（14秒）→ しばらく見せて → うすくなって → 次の曲線
      const c = CURVES[ci];
      if (!reduce) prog += dt / 14000;
      const draw = reduce ? 1 : Math.min(1, prog);
      const fade = reduce ? 1 : prog < 1.6 ? 1 : Math.max(0, 1 - (prog - 1.6) / 0.5);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      path(c, draw); ctx.strokeStyle = hexA(gold, .16 * fade); ctx.lineWidth = 5; ctx.stroke();
      path(c, draw); ctx.strokeStyle = hexA(gold2, .85 * fade); ctx.lineWidth = 1.2; ctx.stroke();
      // ペン先の光
      if (draw < 1) {
        const [cx, cy, R] = center();
        const T2 = Math.PI * 2 * c.turns, [x, y] = c.f(draw * T2), rot = (performance.now() - t0) / 60000;
        const X = x * c.s * R, Y = y * c.s * R;
        const px = cx + X * Math.cos(rot) - Y * Math.sin(rot), py = cy + X * Math.sin(rot) + Y * Math.cos(rot);
        const g = ctx.createRadialGradient(px, py, 0, px, py, 18);
        g.addColorStop(0, 'rgba(255,245,215,.95)'); g.addColorStop(1, 'rgba(255,245,215,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
      }
      if (prog > 2.1) { prog = 0; ci = (ci + 1) % CURVES.length; }
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduce) frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver((es) => { const vis = es[0].isIntersecting; if (vis && !running) { running = true; frame.last = 0; raf = requestAnimationFrame(frame); } else if (!vis) { running = false; cancelAnimationFrame(raf); } });
    io.observe(canvas);
    const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; frame.last = 0; raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  };

  // 青海波（同心円を、下の段が上の段に重なるように並べた模様）。CSS の background-image に使う
  // stroke：線の色、a：線の濃さ、fill：下地の色（重なりを隠すため。置く場所の背景色と同じにする）
  T.seigaiha = (stroke = '#ffffff', a = 0.12, fill = '#0a1530') => {
    const R = 20;
    const wave = (x, y) => `<g transform='translate(${x} ${y})'><circle r='${R}' fill='${fill}'/>${[1, 0.8, 0.6, 0.4, 0.2].map((k) => `<circle r='${R * k - 0.6}'/>`).join('')}</g>`;
    const order = [[R, -R / 2], [0, 0], [2 * R, 0], [R, R / 2], [0, R], [2 * R, R], [R, (3 * R) / 2]];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${2 * R}' height='${R}' viewBox='0 0 ${2 * R} ${R}'><g fill='none' stroke='${stroke}' stroke-opacity='${a}' stroke-width='1'>${order.map(([x, y]) => wave(x, y)).join('')}</g></svg>`;
    return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
  };
})();
