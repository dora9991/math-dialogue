/* ikkan：画面。一覧 → 授業（授業計画／ワークシート／演習プリント）。解答の表示・かくす、印刷。
   場所：#/ ＝一覧、#/<授業のID> ＝ワークシート、#/<授業のID>/plan・/ws・/dr ＝授業計画・ワークシート・演習プリント、
         最後に /ans をつけると、解答を表示した状態で開く（例：#/kukan-01/dr/ans） */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render;
  const $app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MM = 96 / 25.4;   // 1mm のピクセル数
  const TABS = [['plan', '授業計画'], ['ws', 'ワークシート'], ['dr', '演習プリント']];
  let ans = false, fit = 'w', cur = null;

  const tabsOf = id => TABS.filter(([k]) => (k === 'plan' ? IK.plans[id] : k === 'dr' ? IK.drills[id] : IK.lessons[id]));
  const sheetOf = (id, tab) => (tab === 'dr' ? IK.drills[id] : IK.lessons[id]);

  const setAns = on => {
    ans = !!on;
    document.body.classList.toggle('ans-on', ans);
    const b = document.getElementById('ansBtn');
    if (b) { b.setAttribute('aria-pressed', String(ans)); b.textContent = ans ? '解答をかくす' : '解答を表示'; }
    const h = document.getElementById('hint');
    if (h) h.innerHTML = ans ? '<b>解答を表示中</b>　赤い字が、教師の板書と、空欄に入れる答えです。（考えようの答えは載せていません）' : '空欄の罫は、授業で書き込む場所です。ことばの空欄は、先生の説明で埋めます。';
  };

  function zoom() {
    const pages = document.querySelector('.pages');
    if (!pages) return;
    const wrap = pages.parentElement, top = document.querySelector('.top');
    const g = R.geo(cur || { paper: 'A4' }), pw = g.P.w * MM, ph = g.P.h * MM;
    let z = Math.min(1.6, (wrap.clientWidth - 32) / pw);
    if (fit === 'all') z = Math.min(z, (window.innerHeight - (top ? top.offsetHeight : 0) - 70) / ph);
    pages.style.zoom = Math.max(0.3, z);
  }

  function home() {
    cur = null; ans = false;
    document.title = '数学ワークシート（板書型）';
    document.body.classList.remove('ans-on');
    const units = IK.units.map(u => {
      const ls = IK.order.map(id => IK.lessons[id]).filter(l => l.unit === u.key);
      if (!ls.length) return '';
      return `<div class="unit"><h2>${esc(u.name)}</h2><span>中${esc(u.grade)}</span></div>
        <div class="cards">${ls.map(l => `<a class="card" href="#/${esc(l.id)}">${l.no ? `<small>${esc(l.no)}</small>` : ''}<b>${esc(l.title)}</b><p>${esc(l.summary || '')}</p>
          <span class="chips">${tabsOf(l.id).map(([, n]) => `<i>${esc(n)}</i>`).join('')}</span><span class="go">ひらく →</span></a>`).join('')}</div>`;
    }).join('');
    $app.innerHTML = `<div class="home">
      <h1>数学ワークシート（板書型）</h1>
      <p class="lead">日付・名前 → めあて → 学習課題・例題。問題の下は、図・グラフ以外は<b>空欄</b>にしてあり、書き込んで使います。
        「解答を表示」を押すと、<b>教師の板書</b>と<b>空欄の答え</b>が赤で出ます。<b>授業計画</b>と<b>演習プリント</b>がある授業は、上のタブで切りかえます。</p>
      ${units || '<p>ワークシートがまだありません。</p>'}
      <div class="note"><h3>ワークシートのつくり方</h3>
        <code>data/lesson_*.js</code>（授業計画・ワークシート・演習プリント）か、<code>data/ws_*.js</code>（ワークシートだけ）に書き足します。くわしくは <code>README.md</code> を見てください。</div>
    </div>`;
  }

  function show(id, tab, askAns) {
    const l = IK.lessons[id];
    if (!l) { location.hash = '#/'; return; }
    const tabs = tabsOf(id);
    if (!tabs.some(([k]) => k === tab)) tab = 'ws';
    cur = tab === 'plan' ? { paper: 'A4' } : sheetOf(id, tab);
    document.title = `${l.title}　数学ワークシート`;
    const pages = tab === 'plan' ? R.planHTML(IK.plans[id], l) : R.pagesHTML(cur);
    const seg = tabs.length > 1 ? `<nav class="seg" aria-label="資料の切りかえ">${tabs.map(([k, n]) => `<a href="#/${esc(id)}/${k}"${k === tab ? ' aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>` : '';
    $app.innerHTML = `<header class="top">
        <a class="brand" href="#/" title="一覧へ">← 一覧</a>
        <div class="ttl"><small>${esc([l.unitName, l.no].filter(Boolean).join('　'))}</small><b>${esc(l.title)}</b></div>
        ${seg}
        <span class="sp"></span>
        ${tab === 'plan' ? '' : '<button type="button" class="btn main" id="ansBtn" aria-pressed="false">解答を表示</button>'}
        <button type="button" class="btn" id="fitBtn" title="紙面の見せ方">全体を見る</button>
        ${IK.noPrint ? '' : '<button type="button" class="btn" id="prtBtn">印刷</button>'}
      </header>
      <div class="pages-wrap">${tab === 'plan' ? '' : '<p class="hint" id="hint"></p>'}<div class="pages">${pages}</div></div>`;
    setAns(tab === 'plan' ? false : (askAns !== undefined ? askAns : ans));
    const ab = document.getElementById('ansBtn'); if (ab) ab.onclick = () => setAns(!ans);
    document.getElementById('fitBtn').onclick = e => { fit = fit === 'w' ? 'all' : 'w'; e.target.textContent = fit === 'w' ? '全体を見る' : '幅に合わせる'; zoom(); };
    const prt = document.getElementById('prtBtn'); if (prt) prt.onclick = () => window.print();
    zoom();
  }

  function route(hash) {
    const h = String(hash != null ? hash : location.hash).replace(/^#\/?/, '').split('/');
    if (!h[0]) home();
    else show(h[0], ['plan', 'ws', 'dr'].includes(h[1]) ? h[1] : 'ws', h.includes('ans') ? true : undefined);
    window.scrollTo(0, 0);
  }

  // 一覧↔ワークシートの移動は、ページの中で処理する（埋めこみ表示では、アドレスの # が変えられないことがある）
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a) return;
    e.preventDefault();
    const h = a.getAttribute('href');
    try { history.pushState(null, '', h); } catch (_) { /* 変えられなくてもよい */ }
    route(h);
  });
  window.addEventListener('hashchange', () => route());
  window.addEventListener('popstate', () => route());
  window.addEventListener('resize', zoom);
  document.addEventListener('keydown', e => {
    if (!cur || !document.getElementById('ansBtn') || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'a' || e.key === 'A') setAns(!ans);
  });
  route();
})();
