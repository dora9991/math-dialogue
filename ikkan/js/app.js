/* ikkan：画面。一覧 → ワークシート（解答の表示・かくす、印刷）。
   場所：#/ ＝一覧、#/<授業のID> ＝ワークシート、#/<授業のID>/ans ＝解答を表示した状態で開く */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render;
  const $app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MM = 96 / 25.4;   // 1mm のピクセル数
  let ans = false, fit = 'w', cur = null;

  const setAns = on => {
    ans = !!on;
    document.body.classList.toggle('ans-on', ans);
    const b = document.getElementById('ansBtn');
    if (b) { b.setAttribute('aria-pressed', String(ans)); b.textContent = ans ? '解答をかくす' : '解答を表示'; }
    const h = document.getElementById('hint');
    if (h) h.innerHTML = ans ? '<b>解答を表示中</b>　赤い字が、教師が板書する内容と、空欄に入れる数字です。' : '空欄の罫は、授業で板書を写す場所です。数字の空欄は、先生が板書で伝えます。';
  };

  function zoom() {
    const pages = document.querySelector('.pages');
    if (!pages) return;
    const wrap = pages.parentElement, top = document.querySelector('.top');
    const g = R.geo(cur), pw = g.P.w * MM, ph = g.P.h * MM;
    let z = Math.min(1.6, (wrap.clientWidth - 24) / pw);
    if (fit === 'all') z = Math.min(z, (window.innerHeight - (top ? top.offsetHeight : 0) - 70) / ph);
    pages.style.zoom = Math.max(0.3, z);
  }

  function home() {
    cur = null;
    document.title = '数学ワークシート（板書型）';
    document.body.classList.remove('ans-on');
    const units = IK.units.map(u => {
      const ls = IK.order.map(id => IK.lessons[id]).filter(l => l.unit === u.key);
      if (!ls.length) return '';
      return `<div class="unit"><h2>${esc(u.name)}</h2><span>中${esc(u.grade)}</span></div>
        <div class="cards">${ls.map(l => `<a class="card" href="#/${esc(l.id)}">${l.no ? `<small>${esc(l.no)}</small>` : ''}<b>${esc(l.title)}</b><p>${esc(l.summary || '')}</p><span class="go">ひらく →</span></a>`).join('')}</div>`;
    }).join('');
    $app.innerHTML = `<div class="home">
      <h1>数学ワークシート（板書型）</h1>
      <p class="lead">日付・名前 → めあて → 学習課題・例題（1〜3問）。問題の下は、図・グラフ以外は<b>空欄</b>にしてあり、板書を写して使います。
        「解答を表示」を押すと、<b>教師が板書する内容</b>と、<b>空欄の数字</b>が赤で出ます。</p>
      ${units || '<p>ワークシートがまだありません。</p>'}
      <div class="note"><h3>ワークシートのつくり方</h3>
        <code>data/ws_*.js</code> に、<code>IK.add(…)</code> で 1 授業ぶんを書き足します。くわしくは <code>README.md</code> を見てください。</div>
    </div>`;
  }

  function show(id, withAns) {
    const l = IK.lessons[id];
    if (!l) { location.hash = '#/'; return; }
    cur = l;
    document.title = `${l.title}　数学ワークシート`;
    $app.innerHTML = `<header class="top">
        <a class="brand" href="#/" title="一覧へ">← 一覧</a>
        <div class="ttl"><small>${esc([l.unitName, l.no].filter(Boolean).join('　'))}</small><b>${esc(l.title)}</b></div>
        <span class="sp"></span>
        <button type="button" class="btn main" id="ansBtn" aria-pressed="false">解答を表示</button>
        <button type="button" class="btn" id="fitBtn" title="紙面の見せ方">全体を見る</button>
        <button type="button" class="btn" id="prtBtn">印刷</button>
      </header>
      <div class="pages-wrap"><p class="hint" id="hint"></p><div class="pages">${R.pagesHTML(l)}</div></div>`;
    setAns(withAns);
    document.getElementById('ansBtn').onclick = () => setAns(!ans);
    document.getElementById('fitBtn').onclick = e => { fit = fit === 'w' ? 'all' : 'w'; e.target.textContent = fit === 'w' ? '全体を見る' : '幅に合わせる'; zoom(); };
    document.getElementById('prtBtn').onclick = () => window.print();
    zoom();
  }

  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (!h[0]) home(); else show(h[0], h[1] === 'ans');
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('resize', zoom);
  document.addEventListener('keydown', e => {
    if (!cur || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'a' || e.key === 'A') setAns(!ans);
  });
  route();
})();
