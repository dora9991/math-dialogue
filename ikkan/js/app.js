/* ikkan：画面。一覧 → 授業（授業計画／ワークシート／演習プリント／小テスト／3点セット）。解答の表示・かくす、印刷。
   場所：#/ ＝一覧、#/<授業のID> ＝ワークシート、#/<授業のID>/plan・/ws・/dr・/qz・/set ＝授業計画・ワークシート・演習プリント・小テスト・3点セット（印刷用）、
         最後に /ans をつけると、解答を表示した状態で開く（例：#/kukan-01/dr/ans）、
         #/print/<単元のキー> ＝ 単元の授業を、まとめて印刷する画面（例：#/print/kukan） */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render;
  const $app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MM = 96 / 25.4;   // 1mm のピクセル数
  const TABS = [['plan', '授業計画'], ['ws', 'ワークシート'], ['dr', '演習プリント'], ['qz', '小テスト'], ['set', '3点セット（印刷）']];
  let ans = false, fit = 'w', cur = null, curTab = 'ws';

  const tabsOf = id => TABS.filter(([k]) => (k === 'plan' ? IK.plans[id] : k === 'dr' ? IK.drills[id] : k === 'qz' ? IK.quizzes[id] : k === 'set' ? (IK.drills[id] || IK.quizzes[id]) : IK.lessons[id]));
  const sheetOf = (id, tab) => (tab === 'dr' ? IK.drills[id] : tab === 'qz' ? IK.quizzes[id] : IK.lessons[id]);
  // 3点セット：印刷する順（ワークシート → 演習プリント → 小テスト）
  const partsOf = id => [['ワークシート', IK.lessons[id]], ['演習プリント', IK.drills[id]], ['小テスト', IK.quizzes[id]]].filter(p => p[1]);
  const nPages = sh => sh.blocks.filter(b => b.type === 'break').length + 1;

  const setAns = on => {
    ans = !!on;
    document.body.classList.toggle('ans-on', ans);
    const b = document.getElementById('ansBtn');
    if (b) { b.setAttribute('aria-pressed', String(ans)); b.textContent = ans ? '解答をかくす' : '解答を表示'; }
    const h = document.getElementById('hint');
    if (h) h.innerHTML = curTab === 'set'
      ? (ans ? '<b>解答を表示中</b>　教卓に置く解答の確認用です。印刷するときは「解答をかくす」にします。' : '印刷の順：①ワークシート（表裏）②演習プリント（表裏）③小テスト（片面）。<b>両面印刷</b>にすると、3枚になります。')
      : ans ? '<b>解答を表示中</b>　赤い字が、教師の板書と、空欄に入れる答えです。（考えようの答えは載せていません）' : '空欄の罫は、授業で書き込む場所です。ことばの空欄は、先生の説明で埋めます。';
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

  /* ---- 単元まとめ印刷 ----
     新しい形の授業（授業計画・演習プリント・小テストのどれかがある授業）を、単元ごとに、続けて印刷する。
     印刷するもの・授業のはんい・解答つき・両面印刷を選べる。両面印刷にすると、1ページだけの資料（小テストなど）のうしろに白紙を入れて、
     次の資料が、かならず紙の表から始まるようにする。 */
  const unitLessons = key => IK.order.map(id => IK.lessons[id]).filter(l => l.unit === key && (IK.plans[l.id] || IK.drills[l.id] || IK.quizzes[l.id]));
  const PO = { unit: null, ws: true, dr: true, qz: true, plan: false, duplex: true, from: 0, to: 0 };   // 印刷の選び方（この画面を開いているあいだ、覚えておく）
  const BLANK = '<div class="wsp wsp-blank" style="width:210mm;height:297mm"><span>（白紙：両面印刷で、つぎの資料を紙の表から始めるため）</span></div>';

  function printParts(key) {
    const ls = unitLessons(key), a = Math.max(0, Math.min(PO.from, ls.length - 1)), b = Math.max(a, Math.min(PO.to, ls.length - 1)), parts = [];
    ls.slice(a, b + 1).forEach(l => {
      const name = [l.unitName, l.no].filter(Boolean).join('　');
      if (PO.plan && IK.plans[l.id]) parts.push({ cap: `${name}　授業計画`, n: 1, html: R.planHTML(IK.plans[l.id], l) });
      [['ws', 'ワークシート', IK.lessons[l.id]], ['dr', '演習プリント', IK.drills[l.id]], ['qz', '小テスト', IK.quizzes[l.id]]].forEach(([k, label, sh]) => {
        if (PO[k] && sh) parts.push({ cap: `${name}　${label}`, n: nPages(sh), html: R.pagesHTML(sh) });
      });
    });
    return parts;
  }

  function printPagesHTML(key) {
    const parts = printParts(key);
    let html = '', pages = 0;
    parts.forEach((p, i) => {
      html += `<div class="set-cap">${esc(p.cap)}　<small>A4 ${p.n}ページ</small></div>${p.html}`;
      pages += p.n;
      if (PO.duplex && p.n % 2 === 1 && i < parts.length - 1) { html += BLANK; pages += 1; }
    });
    return { html, pages, docs: parts.length };
  }

  function showPrint(key, askAns) {
    const u = IK.units.find(x => x.key === key), ls = unitLessons(key);
    if (!u || !ls.length) { location.hash = '#/'; return; }
    if (PO.unit !== key) Object.assign(PO, { unit: key, from: 0, to: ls.length - 1 });
    PO.to = Math.min(PO.to, ls.length - 1);
    curTab = 'print'; cur = { paper: 'A4' };
    document.title = `${u.name}　まとめて印刷`;
    const opt = i => `<option value="${i}">${esc([ls[i].no, ls[i].title].filter(Boolean).join('　'))}</option>`;
    const kinds = [['ws', 'ワークシート'], ['dr', '演習プリント'], ['qz', '小テスト'], ['plan', '授業計画']].filter(([k]) => ls.some(l => (k === 'ws' ? IK.lessons[l.id] : k === 'dr' ? IK.drills[l.id] : k === 'qz' ? IK.quizzes[l.id] : IK.plans[l.id])));
    $app.innerHTML = `<header class="top">
        <a class="brand" href="#/" title="一覧へ">← 一覧</a>
        <div class="ttl"><small>${esc(u.name)}</small><b>授業を、まとめて印刷</b></div>
        <span class="sp"></span>
        <button type="button" class="btn" id="fitBtn" title="紙面の見せ方">全体を見る</button>
        ${IK.noPrint ? '' : '<button type="button" class="btn main2" id="prtBtn">まとめて印刷</button>'}
      </header>
      <div class="pages-wrap">
        <div class="pbar">
          <div class="pbar-row"><b>印刷するもの</b>${kinds.map(([k, n]) => `<label><input type="checkbox" data-k="${k}"${PO[k] ? ' checked' : ''}> ${esc(n)}</label>`).join('')}</div>
          <div class="pbar-row"><b>授業</b><select id="pFrom">${ls.map((_, i) => opt(i)).join('')}</select> から <select id="pTo">${ls.map((_, i) => opt(i)).join('')}</select> まで</div>
          <div class="pbar-row"><label><input type="checkbox" id="pAns"> 解答つき（教卓用。生徒に配るときは、はずす）</label>
            <label><input type="checkbox" data-k="duplex"${PO.duplex ? ' checked' : ''}> 両面印刷にする（小テストなど 1ページの資料のうしろに、白紙を入れる。片面で印刷するときは、はずす）</label></div>
          <p class="psum" id="pSum"></p>
        </div>
        <div class="pages" id="pPages"></div>
      </div>`;
    const sel = (id, v) => { const e = document.getElementById(id); e.value = String(v); return e; };
    const redraw = () => {
      const r = printPagesHTML(key), sheets = PO.duplex ? Math.ceil(r.pages / 2) : r.pages;
      document.getElementById('pPages').innerHTML = r.html;
      document.getElementById('pSum').innerHTML = r.pages ? `資料 ${r.docs}件、全 <b>${r.pages}ページ</b>（${PO.duplex ? '両面印刷で、紙 <b>' + sheets + '枚</b>' : '片面印刷で、紙 <b>' + sheets + '枚</b>'}）。印刷の設定は、A4・倍率 100%・ヘッダーとフッターなし。` : '印刷するものを選んでください。';
      zoom();
    };
    sel('pFrom', PO.from).onchange = e => { PO.from = +e.target.value; if (PO.to < PO.from) { PO.to = PO.from; sel('pTo', PO.to); } redraw(); };
    sel('pTo', PO.to).onchange = e => { PO.to = +e.target.value; if (PO.from > PO.to) { PO.from = PO.to; sel('pFrom', PO.from); } redraw(); };
    document.querySelectorAll('.pbar input[data-k]').forEach(c => { c.onchange = () => { PO[c.dataset.k] = c.checked; redraw(); }; });
    document.getElementById('pAns').onchange = e => setAns(e.target.checked);
    setAns(!!askAns); document.getElementById('pAns').checked = !!askAns;
    document.getElementById('fitBtn').onclick = e => { fit = fit === 'w' ? 'all' : 'w'; e.target.textContent = fit === 'w' ? '全体を見る' : '幅に合わせる'; zoom(); };
    const prt = document.getElementById('prtBtn'); if (prt) prt.onclick = () => window.print();
    redraw();
  }

  function home() {
    cur = null; ans = false;
    document.title = '数学ワークシート（板書型）';
    document.body.classList.remove('ans-on');
    const units = IK.units.map(u => {
      const ls = IK.order.map(id => IK.lessons[id]).filter(l => l.unit === u.key);
      if (!ls.length) return '';
      const np = unitLessons(u.key).length;
      return `<div class="unit"><h2>${esc(u.name)}</h2><span>中${esc(u.grade)}</span>${np ? `<a class="btn btnp" href="#/print/${esc(u.key)}">この単元を、まとめて印刷（${np}時間）</a>` : ''}</div>
        <div class="cards">${ls.map(l => `<a class="card" href="#/${esc(l.id)}">${l.no ? `<small>${esc(l.no)}</small>` : ''}<b>${esc(l.title)}</b><p>${esc(l.summary || '')}</p>
          <span class="chips">${tabsOf(l.id).map(([, n]) => `<i>${esc(n)}</i>`).join('')}</span><span class="go">ひらく →</span></a>`).join('')}</div>`;
    }).join('');
    $app.innerHTML = `<div class="home">
      <h1>数学ワークシート（板書型）</h1>
      <p class="lead">日付・名前 → めあて → 学習課題・例題。問題の下は、図・グラフ以外は<b>空欄</b>にしてあり、書き込んで使います。
        「解答を表示」を押すと、<b>教師の板書</b>と<b>空欄の答え</b>が赤で出ます。<b>授業計画</b>・<b>演習プリント</b>・<b>小テスト</b>がある授業は、上のタブで切りかえます。<b>3点セット（印刷）</b>のタブでは、ワークシート・演習プリント・小テストを続けて印刷できます。単元の見出しの<b>「この単元を、まとめて印刷」</b>では、単元の授業を、続けて印刷できます。</p>
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
    curTab = tab;
    cur = tab === 'plan' ? { paper: 'A4' } : sheetOf(id, tab);
    document.title = `${l.title}　数学ワークシート`;
    const pages = tab === 'plan' ? R.planHTML(IK.plans[id], l)
      : tab === 'set' ? partsOf(id).map(([n, sh], i) => `<div class="set-cap">${'①②③'[i]} ${esc(n)}　<small>A4 ${nPages(sh) > 1 ? `${nPages(sh)}ページ（表裏）` : '1ページ（片面）'}</small></div>${R.pagesHTML(sh)}`).join('')
      : R.pagesHTML(cur);
    const seg = tabs.length > 1 ? `<nav class="seg" aria-label="資料の切りかえ">${tabs.map(([k, n]) => `<a href="#/${esc(id)}/${k}"${k === tab ? ' aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>` : '';
    $app.innerHTML = `<header class="top">
        <a class="brand" href="#/" title="一覧へ">← 一覧</a>
        <div class="ttl"><small>${esc([l.unitName, l.no].filter(Boolean).join('　'))}</small><b>${esc(l.title)}</b></div>
        ${seg}
        <span class="sp"></span>
        ${tab === 'plan' ? '' : '<button type="button" class="btn main" id="ansBtn" aria-pressed="false">解答を表示</button>'}
        <button type="button" class="btn" id="fitBtn" title="紙面の見せ方">全体を見る</button>
        ${IK.noPrint ? '' : `<button type="button" class="btn${tab === 'set' ? ' main2' : ''}" id="prtBtn">${tab === 'set' ? '3点セットを印刷' : '印刷'}</button>`}
      </header>
      <div class="pages-wrap">${tab === 'plan' ? '' : '<p class="hint" id="hint"></p>'}<div class="pages">${pages}</div></div>`;
    setAns(tab === 'plan' ? false : tab === 'set' ? !!askAns : (askAns !== undefined ? askAns : ans));   // 3点セットは、いつも解答をかくした状態で開く（印刷用）
    const ab = document.getElementById('ansBtn'); if (ab) ab.onclick = () => setAns(!ans);
    document.getElementById('fitBtn').onclick = e => { fit = fit === 'w' ? 'all' : 'w'; e.target.textContent = fit === 'w' ? '全体を見る' : '幅に合わせる'; zoom(); };
    const prt = document.getElementById('prtBtn'); if (prt) prt.onclick = () => window.print();
    zoom();
  }

  function route(hash) {
    const h = String(hash != null ? hash : location.hash).replace(/^#\/?/, '').split('/');
    if (!h[0]) home();
    else if (h[0] === 'print') showPrint(h[1], h.includes('ans'));
    else show(h[0], ['plan', 'ws', 'dr', 'qz', 'set'].includes(h[1]) ? h[1] : 'ws', h.includes('ans') ? true : undefined);
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
