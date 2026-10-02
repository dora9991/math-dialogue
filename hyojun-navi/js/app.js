/* 授業ナビ 標準版 — 標準の進度の年間計画から、各時間の授業構想・板書計画・スライド・ワークシート・演習プリント・小テストを開く。 */
(function () {
  'use strict';
  const D = window.LDB || { units: [], lessons: [] };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/√\{([^{}]*)\}/g, '<span class="mx"><span class="sq">√<span>$1</span></span></span>').replace(/\n/g, '<br>');   // √{12}＝根号（上に線）
  const mfmt = s => window.WSX && WSX.inl ? `<span class="mx">${WSX.inl(String(s == null ? '' : s))}</span>` : fmt(s);   // 数式まじりの文（分数・累乗など）

  /* ---------------- index ---------------- */
  const units = D.units.slice();
  const unitByKey = Object.fromEntries(units.map(u => [u.key, u]));
  const GRADES = [1, 2, 3];
  const lessons = D.lessons.slice();
  const lessonById = Object.fromEntries(lessons.map(l => [l.id, l]));
  const lessonsOf = k => lessons.filter(l => l.unit === k);
  const lessonGrade = l => (unitByKey[l.unit] || {}).grade || 1;
  // 授業の型（年間計画の1文字）
  const TYPES = {
    '探': { name: '課題解決', cls: 'ty-t', desc: '1つの問いを、自分で考え、考えを出し合って解決する時間' },
    '例': { name: '例題と練習', cls: 'ty-r', desc: '例題で考え方を学び、練習で身につける時間（途中に「考える問い」を1つ入れる）' },
    '遊': { name: 'ゲーム・活動', cls: 'ty-g', desc: 'ゲームや操作・実験を通して、気づいたり、楽しみながら習熟したりする時間' },
    '練': { name: '習熟・教え合い', cls: 'ty-p', desc: '自分でコースを選んで練習し、教え合って確かなものにする時間' },
    '活': { name: '活用・表現', cls: 'ty-k', desc: '学んだことを身のまわりや新しい場面で使い、考えを書いたり説明したりする時間' },
    '確': { name: 'まとめ', cls: 'ty-m', desc: '単元の内容を整理し、自分の力を確かめる時間' }
  };
  const typeOf = l => TYPES[l.type] || TYPES['例'];
  /* 50分の使い方。はじめ（前の時間の小テスト）と、練習・振り返りは、型ごとに同じ形。
     授業構想（data/c_*.js）の flow には、そのあいだの「本時の中心」だけを書く。lect＝本時の中心に使う分 */
  const PRE = [['小テスト', 7, '前の時間の小テスト（5分）。となりと交換して丸つけ（2分）。早く終わった人はチャレンジ問題。']];
  const FRAME = {
    '探': { lect: 28, post: [['練習', 10, 'ワークシートの練習 → 演習プリントの基礎・基本。答えは教卓に置き、自分で丸つけ。わからないところは、友だちや先生に聞いてよい。'], ['振り返り', 5, '今日わかったこと・まだはっきりしないことを書く。']] },
    '例': { lect: 20, post: [['練習', 18, 'ワークシートの練習 → 演習プリントの表（基礎・基本 → 標準）。早い人は裏（応用）へ。答えは教卓に置き、自分で丸つけ。教え合ってよい。'], ['振り返り', 5, 'つまずきが多かったところを全体で確かめ、振り返りを書く。']] },
    '遊': { lect: 30, post: [['練習', 8, 'ワークシートの練習 → 演習プリントの基礎・基本。'], ['振り返り', 5, '活動で気づいたことを、ことばや式で書く。']] },
    '練': { lect: 5, post: [['練習・教え合い', 33, '演習プリントを、自分でコース（基礎・基本から／標準から）を選んで進める。大問ごとに丸つけ。早く終わった人は「ミニ先生」になる。教師は、手が止まっている生徒を回る。'], ['振り返り', 5, 'まちがいが多かった問題を全体で確かめ、振り返りを書く。']] },
    '活': { lect: 33, post: [['練習', 5, '演習プリントの基礎・基本。残りは家庭学習の材料にする。'], ['振り返り', 5, '考え方のよかったところ・友だちの説明でなるほどと思ったところを書く。']] },
    '確': { lect: 10, post: [['確かめる', 28, 'ワークシートの確かめの問題 → 演習プリント。自分で丸つけをし、まちがえた問題に印をつける。'], ['直し・振り返り', 5, '印をつけた問題をやり直す。テストまでに取り組む問題を決める。']] }
  };
  // 授業構想がまだない時間に出す、本時の中心のめやす
  const LECT_DEF = {
    '探': [['問いをつかむ', 5, '問いを示し、「何がわかれば解決か」をそろえる。予想を書かせる。'], ['自分で考える', 7, 'ワークシートの「自分の考え」に書く。'], ['考えを出し合う', 11, 'ペアで説明し合ったあと、2〜3人の考えを取り上げ、「どこが同じで、どこがちがうか」「いつでも使えるか」を問う。'], ['まとめる', 5, 'わかったことを、生徒のことばでまとめる。']],
    '例': [['例題1', 7, '例題を、発問しながら解き進める。'], ['例題2', 6, '少し形を変えた例題。'], ['考える問い', 7, 'この時間の「考える問い」。ここだけは、すぐに教えずに待つ。ペアで説明し合う。']],
    '遊': [['ルールをつかむ', 5, 'やり方を1回、全体でためす。'], ['活動する', 15, 'ペアや班で活動する。気づいたことをワークシートに書きとめる。'], ['気づきを出し合う', 10, '活動の中で見つけたきまり・うまいやり方を出し合い、数学のことばに直す。']],
    '練': [['ポイントの確認', 5, '演習プリントの「ポイント」を全員で確かめる。']],
    '活': [['問題をつかむ', 6, '場面を読み、条件と求めるものを整理する。'], ['考える', 12, '1人で、または近くの人と相談しながら考える。'], ['伝え合う', 10, '考えを書き、ペアや全体で説明する。解き方をくらべる。'], ['広げる', 5, '条件を変えるとどうなるかを考える。']],
    '確': [['ふり返る', 10, '単元で学んだことを、ワークシートで整理する。']]
  };
  const frameOf = l => FRAME[l.type] || FRAME['例'];

  (function check() {
    const warn = [], ids = new Set();
    lessons.forEach(l => { if (!unitByKey[l.unit]) warn.push('unknown unit ' + l.id); if (!TYPES[l.type]) warn.push('unknown type ' + l.id); if (ids.has(l.id)) warn.push('dup ' + l.id); ids.add(l.id); });
    ['worksheets', 'drills', 'quizzes'].forEach(k => Object.keys(D[k] || {}).forEach(id => { if (!lessonById[id]) warn.push(`${k}: 年間計画にない時間 ${id}`); }));
    if (warn.length) console.warn('[授業ナビ 標準版] データ警告', warn);
  })();

  /* ---------------- settings ---------------- */
  const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const TERM = m => (m >= 4 && m <= 8) ? 1 : (m >= 9) ? 2 : 3;
  // 年35週。週の時数は中1・中3が4時間（年140時間）、中2が3時間（年105時間）＝数学の標準時数
  const DEF = { weeks: { 4: 3, 5: 3, 6: 4, 7: 3, 8: 0, 9: 3, 10: 4, 11: 4, 12: 3, 1: 3, 2: 3, 3: 2 }, hpwBy: { 1: 4, 2: 3, 3: 4 } };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('hyojunNavi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('hyojunNavi.' + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境でも表示は続ける */ } }
  };
  let S;
  function loadSettings(o) { S = Object.assign({}, DEF, o || {}); S.weeks = Object.assign({}, DEF.weeks, S.weeks || {}); S.hpwBy = Object.assign({}, DEF.hpwBy, S.hpwBy || {}); }
  loadSettings(store.get('settings', {}));

  /* ---------------- grade ---------------- */
  let G = +store.get('grade', 1); if (!GRADES.includes(G)) G = 1;
  const hpw = () => S.hpwBy[G] || 4;
  const unitsG = () => units.filter(u => u.grade === G);
  const lessonsG = () => lessons.filter(l => unitByKey[l.unit].grade === G);
  function paintGrade() { $$('#gradeSw button').forEach(b => { const on = +b.dataset.g === G; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  function setGrade(g) { if (!GRADES.includes(g) || g === G) return false; G = g; store.set('grade', G); paintGrade(); return true; }
  const has = (kind, id) => kind === 'ws' ? !!(D.worksheets || {})[id] : kind === 'dr' ? !!(D.drills || {})[id] : !!(D.quizzes || {})[id];
  const countOf = (kind, key) => lessonsOf(key).filter(l => has(kind, l.id)).length;

  /* ---------------- schedule ---------------- */
  // 行事の枠（定期テスト・学期のまとめ）を先に置き、残りのコマに授業を順に入れる。余ったコマは予備
  const EV_PARTS = (e) => e.exam ? (e.n >= 3 ? ['テスト対策', 'テスト', 'テスト返し・解き直し'].concat(Array(e.n - 3).fill('テスト対策')) : ['テスト対策', 'テスト返し・解き直し'].slice(0, e.n)) : Array(e.n).fill('まとめ・補充');
  function buildSchedule() {
    const main = [];
    unitsG().forEach(u => lessonsOf(u.key).forEach(l => main.push(l)));
    const evs = (S.useEvents === false ? [] : (D.events || {})[G] || []);
    const months = []; let k = 0, nEv = 0; const carry = [], H = hpw();
    MONTHS.forEach(m => {
      const w = Math.max(0, S.weeks[m] | 0), weeks = [];
      for (let i = 0; i < w; i++) {
        const cells = [];
        evs.filter(e => e.m === m && Math.min(e.w, w) === i + 1).forEach(e => { EV_PARTS(e).forEach(p => carry.push({ type: 'event', name: e.name, label: p, exam: !!e.exam })); });
        while (carry.length && cells.length < H) { cells.push(carry.shift()); nEv++; }
        while (cells.length < H) cells.push(main[k] ? { type: 'lesson', l: main[k++] } : { type: 'rsv', label: G === 3 ? '3年間の総復習・予備' : '1年間のまとめ・予備' });
        weeks.push(cells);
      }
      months.push({ m, weeks });
    });
    return { months, overflow: main.length - k, events: nEv, total: MONTHS.reduce((a, m) => a + (S.weeks[m] | 0), 0) * H };
  }
  function nowPos() { const d = new Date(), m = d.getMonth() + 1, w = Math.floor((d.getDate() - 1) / 7); return { m, w: Math.min(w, Math.max(0, (S.weeks[m] | 0) - 1)) }; }

  /* ---------------- views ---------------- */
  const view = $('#view');
  let baseView = 'plan';
  const tyBadge = l => `<span class="ty ${typeOf(l).cls}" title="${esc(typeOf(l).name + '：' + typeOf(l).desc)}">${esc(typeOf(l).name)}</span>`;
  const matBadges = l => ['ws', 'dr', 'qz'].map(k => has(k, l.id) ? `<span class="mb on" title="${{ ws: 'ワークシート', dr: '演習プリント', qz: '小テスト' }[k]}あり">${{ ws: 'W', dr: '演', qz: '小' }[k]}</span>` : '').join('');

  function renderPlan() {
    const sch = buildSchedule(), now = nowPos();
    const flat = []; sch.months.forEach(mo => mo.weeks.forEach(w => w.forEach(c => flat.push(c))));
    const segs = [];
    flat.forEach(c => {
      const key = c.type === 'lesson' ? c.l.unit : c.type === 'event' ? '_ev' : '_rsv', last = segs[segs.length - 1];
      if (last && last.key === key) last.n++; else segs.push({ key, n: 1 });
    });
    const monthTicks = sch.months.map(mo => mo.weeks.length * hpw());
    const ls = lessonsG(), nType = t => ls.filter(l => l.type === t).length;
    const made = ls.filter(l => has('ws', l.id)).length;
    let nowLesson = null; const nm = sch.months.find(mo => mo.m === now.m);
    if (nm && nm.weeks[now.w]) nowLesson = nm.weeks[now.w].find(c => c.type === 'lesson');
    let h = `<h1 class="pg">年間計画<span class="gtag">中${G}</span></h1>
      <p class="sub">${esc(GRADE_NOTE[G])}　カードを押すと、その時間の授業構想・板書計画・スライド・ワークシート・演習プリント・小テストが開きます。</p>
      <section class="yearbar">
        <div class="yb-months" style="grid-template-columns:${monthTicks.filter(n => n).map(n => n + 'fr').join(' ')}">${sch.months.filter(mo => mo.weeks.length).map(mo => `<span>${mo.m}月</span>`).join('')}</div>
        <div class="yb-track">${segs.map(s => { const u = unitByKey[s.key]; return u ? `<div class="yb-seg" style="flex:${s.n};background:${u.color}" data-jump="${u.key}" title="${esc(u.name)}（${lessonsOf(u.key).length}時間）">${esc(u.short || u.name)}</div>` : `<div class="yb-seg ${s.key === '_ev' ? 'ev' : 'rsv'}" style="flex:${s.n}" title="${s.key === '_ev' ? 'テスト・まとめ' : '予備'}"></div>`; }).join('')}</div>
        <div class="yb-legend">${unitsG().map(u => `<span><b style="background:${u.color}"></b>${esc(u.name)}（${lessonsOf(u.key).length}）</span>`).join('')}</div>
        <div class="tysum">${Object.keys(TYPES).filter(nType).map(t => `<span><span class="ty ${TYPES[t].cls}">${TYPES[t].name}</span>${nType(t)}時間</span>`).join('')}<span class="muted">／ 授業 ${ls.length}時間＋テスト・まとめ ${sch.events}コマ＋予備 ${Math.max(0, sch.total - ls.length - sch.events)}コマ（年間${sch.total}コマ）・教材ができている時間 ${made}</span></div>
        ${nowLesson ? `<div class="yb-now">📍 今週のめやす：<a href="#/lesson/${nowLesson.l.id}">${esc(unitByKey[nowLesson.l.unit].name)} 第${nowLesson.l.no}時「${esc(nowLesson.l.title)}」</a></div>` : ''}
        ${sch.overflow > 0 ? `<div class="yb-now" style="color:var(--warn)">⚠ 週の数が足りず、${sch.overflow}時間ぶんが年度内に入りきっていません（⚙で週の数を増やしてください）。</div>` : ''}
      </section>`;
    let term = 0;
    sch.months.forEach(mo => {
      if (!mo.weeks.length) return;
      if (TERM(mo.m) !== term) { term = TERM(mo.m); h += `<h2 class="term">${term}学期</h2>`; }
      const us = [...new Set(mo.weeks.flat().filter(c => c.type === 'lesson').map(c => c.l.unit))].map(k => unitByKey[k].name);
      const nl = mo.weeks.flat().filter(c => c.type === 'lesson').length;
      h += `<section class="month" id="m${mo.m}"><h2>${mo.m}月<small>${mo.weeks.length}週・${mo.weeks.length * hpw()}コマ（授業${nl}）${us.length ? '　' + esc(us.join('／')) : ''}</small></h2>`;
      mo.weeks.forEach((w, wi) => {
        const isNow = mo.m === now.m && wi === now.w;
        h += `<div class="week${isNow ? ' now' : ''}" style="--h:${hpw()}"><div class="wk-lb"><b>第${wi + 1}週</b></div><div class="wk-cells">${w.map(cellHTML).join('')}</div></div>`;
      });
      h += `</section>`;
    });
    view.innerHTML = h;
    $$('.yb-seg[data-jump]', view).forEach(el => el.addEventListener('click', () => {
      const first = view.querySelector(`.lc[data-unit="${el.dataset.jump}"]`);
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); }
    }));
  }
  const GRADE_NOTE = {
    1: '年140コマ（週4時間）。授業110時間＋定期テスト15コマ＋学期のまとめ。残りは予備です。',
    2: '年105コマ（週3時間）。授業85時間＋定期テスト15コマ。残りは予備です。',
    3: '年140コマ（週4時間）。授業102時間＋定期テスト15コマ＋学期のまとめ。3学期の残りは、3年間の総復習にあてます。'
  };
  function cellHTML(c) {
    if (c.type === 'event') return `<div class="lc ev${c.exam ? ' exam' : ''}"><div class="lc-h"><i>${esc(c.name)}</i></div><div class="lc-t">${esc(c.label)}</div></div>`;
    if (c.type !== 'lesson') return `<div class="lc rsv"><div class="lc-h"></div><div class="lc-t muted">${esc(c.label)}</div></div>`;
    const l = c.l, u = unitByKey[l.unit];
    return `<button class="lc" style="--u:${u.color}" data-unit="${u.key}" data-open="${l.id}" title="${esc(l.title)}">
      <span class="lc-h"><i>${esc(u.short || u.name)}</i>第${l.no}時${tyBadge(l)}</span>
      <span class="lc-t">${esc(l.title)}</span>
      <span class="lc-f">${matBadges(l)}${window.WSX && WSX.has(l.id) ? '<span class="badge wsb" title="編集して保存したワークシートがあります">WS✎</span>' : ''}</span>
    </button>`;
  }

  // 年間指導計画の一覧表（印刷用）
  function renderTable(all) {
    if (all) {   // 中1・中2・中3を続けて出す（印刷・PDF用）
      const keepG = G; let out = '';
      [1, 2, 3].forEach(g => { G = g; out += `<section class="ypage">${tableHTML(true)}</section>`; });
      G = keepG; view.innerHTML = out; return;
    }
    view.innerHTML = tableHTML(false);
    $('#tPrint').addEventListener('click', () => window.print());
  }
  function tableHTML(plain) {
    const sch = buildSchedule();
    const rows = []; let n = 0;
    sch.months.forEach(mo => mo.weeks.forEach((w, wi) => w.forEach(c => { if (c.type === 'lesson') rows.push({ m: mo.m, w: wi + 1, l: c.l, n: ++n }); else if (c.type === 'event') rows.push({ m: mo.m, ev: c }); })));
    let h = `<h1 class="pg">年間指導計画（一覧表）<span class="gtag">中${G}</span></h1>
      <p class="sub${plain ? '' : ' no-print'}">${esc(GRADE_NOTE[G])}</p>
      ${plain ? `<div class="tysum" style="margin:0 0 8px">${unitsG().map(u => `<span><b style="color:${u.color}">■</b>${esc(u.name)} ${lessonsOf(u.key).length}</span>`).join('')}</div>` : `<div class="row no-print" style="margin:0 0 12px"><button class="nbtn pri" id="tPrint"><svg class="ic"><use href="#i-print"/></svg>この表を印刷</button><a class="nbtn" href="#/tableall">全学年をまとめて見る</a></div>`}
      <table class="plan-tbl ytbl"><thead><tr><th>月</th><th>通し</th><th>単元</th><th>時</th><th>型</th><th>めあて</th><th>内容</th></tr></thead><tbody>`;
    let lm = 0, lu = '';
    rows.forEach(r => {
      if (r.ev) { const p = rows[rows.indexOf(r) - 1]; if (!(p && p.ev && p.ev.name === r.ev.name)) { const cnt = rows.filter((x, i) => x.ev && x.ev.name === r.ev.name && x.m === r.m).length; h += `<tr class="evrow"><td class="n">${r.m !== lm ? r.m + '月' : ''}</td><td colspan="6">◆ ${esc(r.ev.name)}（${cnt}コマ：${r.ev.exam ? 'テスト対策・テスト・返却と解き直し' : '学期の内容のまとめと、つまずきの補充'}）</td></tr>`; lm = r.m; lu = ''; } return; }
      const u = unitByKey[r.l.unit];
      if (u.key !== lu) { h += `<tr class="grp-h"><td colspan="7"><b style="color:${u.color}">■</b> ${esc(u.name)}（${lessonsOf(u.key).length}時間）</td></tr>`; lu = u.key; }
      h += `<tr class="cl" data-open="${r.l.id}"><td class="n">${r.m !== lm ? r.m + '月' : ''}</td><td class="n">${r.n}</td><td class="sb">${esc(u.short || u.name)}</td><td class="n">${r.l.no}</td><td>${tyBadge(r.l)}</td><td>${esc(r.l.title)}</td><td class="sb">${esc(r.l.sub)}</td></tr>`;
      lm = r.m;
    });
    return h + `</tbody></table>`;
  }

  function renderUnits() {
    let h = `<h1 class="pg">単元<span class="gtag">中${G}</span></h1><p class="sub">単元のねらいと、毎時間のめあての一覧です。行を押すとその時間を開きます。</p><div class="units">`;
    unitsG().forEach(u => {
      const ls = lessonsOf(u.key), nw = countOf('ws', u.key), nd = countOf('dr', u.key), nq = countOf('qz', u.key);
      h += `<section class="unit" id="u-${u.key}" style="--u:${u.color}"><header><h2>${esc(u.name)}</h2><span class="muted">全${ls.length}時間</span>
        <span style="flex:1"></span>${ls.some(l => l.card) ? `<a class="nbtn" href="#/cards/${u.key}">授業構想と板書計画をまとめて見る</a>` : ''}${nw ? `<a class="nbtn" href="#/wsprint/${u.key}">ワークシート ${nw}枚を印刷</a>` : ''}${nd ? `<a class="nbtn" href="#/drprint/${u.key}">演習プリント ${nd}枚を印刷</a>` : ''}${nq ? `<a class="nbtn" href="#/qzprint/${u.key}">小テスト ${nq}枚を印刷</a>` : ''}</header><div class="ub">`;
      if (u.goals && u.goals.length) h += `<div class="card"><h3>単元の目標</h3><ul>${u.goals.map(g => `<li>${fmt(g)}</li>`).join('')}</ul></div>`;
      if (u.overview) h += `<div class="card"><h3>この単元の進め方</h3><p>${fmt(u.overview)}</p></div>`;
      h += `<table class="plan-tbl"><thead><tr><th>時</th><th>型</th><th>めあて</th><th>内容</th><th>教材</th></tr></thead><tbody>`;
      let lastSub = null;
      ls.forEach(l => {
        const g = (u.groups || []).find(g => l.no >= g.from && l.no <= g.to);
        if (g && g !== lastSub) { h += `<tr class="grp-h"><td colspan="5">${esc(g.name)}</td></tr>`; lastSub = g; }
        h += `<tr class="cl" data-open="${l.id}"><td class="n">第${l.no}時</td><td>${tyBadge(l)}</td><td>${esc(l.title)}</td><td class="sb">${esc(l.sub)}</td><td class="sb">${matBadges(l)}</td></tr>`;
      });
      h += `</tbody></table></div></section>`;
    });
    view.innerHTML = h + '</div>';
  }

  // 単元の授業構想をまとめて出す（印刷・PDF用）。#/cards/<単元>
  function renderCards(key) {
    const u = unitByKey[key]; if (!u) { renderPlan(); return; }
    view.innerHTML = `<h1 class="pg">授業構想　${esc(u.name)}<span class="gtag">中${u.grade}</span></h1>
      <p class="sub">全${lessonsOf(key).length}時間。${esc(u.overview || '')}</p>
      <div class="row no-print" style="margin:0 0 12px"><button class="nbtn pri" id="cPrint"><svg class="ic"><use href="#i-print"/></svg>印刷</button><a class="nbtn" href="#/units/${key}">単元にもどる</a></div>
      ${lessonsOf(key).map(l => `<section class="cardp" style="--u:${u.color}"><h2><span class="no">第${l.no}時</span>${esc(l.title)}${tyBadge(l)}</h2>
        <div class="d-meta"><span>📘 ${esc(l.sub)}</span></div>${l.goal ? `<div class="d-goal"><b>ねらい</b>${fmt(l.goal)}</div>` : ''}<div class="cp-body">${panePlan(l).replace(/<div class="card tycard">[\s\S]*?<\/div>/, '')}</div>${l.board ? paneBoard(l) : ''}</section>`).join('')}`;
    $('#cPrint').addEventListener('click', () => window.print());
  }

  function renderAbout() {
    const A = D.about || {};
    const sec = s => `<section class="idea-sec"><h2>${esc(s.h)}</h2>${(s.p || []).map(p => `<p>${fmt(p)}</p>`).join('')}${s.li ? `<ul class="tips">${s.li.map(x => `<li>${fmt(x)}</li>`).join('')}</ul>` : ''}${s.table ? `<table class="plan-tbl"><thead><tr>${s.table[0].map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.table.slice(1).map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}</section>`;
    view.innerHTML = `<h1 class="pg">この計画の進め方</h1><p class="sub">${esc(A.lead || '')}</p>
      <div class="card"><h3>授業の型（年間計画のしるし）</h3><ul class="tylist">${Object.keys(TYPES).map(t => `<li><span class="ty ${TYPES[t].cls}">${TYPES[t].name}</span>${esc(TYPES[t].desc)}</li>`).join('')}</ul></div>
      ${(A.sections || []).map(sec).join('')}`;
  }

  function renderSearch(q) {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hay = o => JSON.stringify(o).toLowerCase();
    const hit = lessons.filter(l => terms.every(t => hay(l).includes(t)));
    const mark = s => { let r = esc(s); terms.forEach(t => { r = r.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); }); return r; };
    view.innerHTML = `<h1 class="pg">「${esc(q)}」の検索結果</h1><p class="sub">${hit.length}時間（全学年から探しています）</p><div class="sr">${hit.map(l => { const u = unitByKey[l.unit];
      return `<button class="ri" data-open="${l.id}"><div class="rk"><span class="kind" style="background:${u.color}">${esc(u.name)}</span>中${u.grade}・第${l.no}時 ${tyBadge(l)}</div><div class="rt">${mark(l.title)}</div><div class="rs">${mark(l.sub + (l.goal ? '　' + l.goal : ''))}</div></button>`; }).join('')}</div>${hit.length ? '' : `<div class="empty-note">見つかりませんでした。ことばを短くしてみてください。</div>`}`;
  }

  /* ---------------- lesson drawer ---------------- */
  const drawerWrap = $('#drawerWrap'), drawer = $('#drawer');
  let curLesson = null, curTab = 'plan';
  const TABS = [['plan', '授業構想'], ['bd', '板書計画'], ['sl', 'スライド'], ['ws', 'ワークシート'], ['dr', '演習プリント'], ['qz', '小テスト']];
  const seqOf = l => { const u = unitByKey[l.unit]; return lessons.filter(x => unitByKey[x.unit].grade === u.grade); };
  function openLesson(id, tab) {
    const l = lessonById[id]; if (!l) return;
    curLesson = l; curTab = TABS.some(t => t[0] === tab) ? tab : (curTab || 'plan');
    const u = unitByKey[l.unit], ls = lessonsOf(l.unit), seq = seqOf(l), gi = seq.indexOf(l), prev = seq[gi - 1], next = seq[gi + 1];
    drawer.style.setProperty('--u', u.color);
    drawer.innerHTML = `
      <div class="d-head">
        <div class="d-bar">
          <span class="d-unit">中${u.grade}　${esc(u.name)}　第${l.no}時／全${ls.length}時間</span><span class="sp"></span>
          <a class="nbtn" ${prev ? `href="#/lesson/${prev.id}"` : 'disabled'} title="前の時間（←キー）"><svg class="ic"><use href="#i-left"/></svg>前</a>
          <a class="nbtn" ${next ? `href="#/lesson/${next.id}"` : 'disabled'} title="次の時間（→キー）">次<svg class="ic"><use href="#i-right"/></svg></a>
          <button class="nbtn" id="btnPrint" title="授業構想と板書計画を印刷"><svg class="ic"><use href="#i-print"/></svg>印刷</button>
          <button class="d-close" data-close title="閉じる（Esc）"><svg class="ic"><use href="#i-x"/></svg></button>
        </div>
        <h2 class="d-title" id="dTitle">${esc(l.title)}</h2>
        <div class="d-meta">${tyBadge(l)}<span>📘 ${esc(l.sub)}</span></div>
        ${l.goal ? `<div class="d-goal"><b>ねらい</b>${fmt(l.goal)}</div>` : ''}
        <div class="d-tabs" role="tablist">${TABS.map(([k, lb]) => `<button role="tab" data-tab="${k}" class="${k === curTab ? 'on' : ''}">${lb}${['ws', 'dr', 'qz'].includes(k) && has(k, l.id) ? '<span class="cnt">あり</span>' : ''}</button>`).join('')}</div>
      </div>
      <div class="d-body">
        <section class="pane" data-p="plan">${panePlan(l)}</section>
        <section class="pane" data-p="bd">${paneBoard(l)}</section>
        <section class="pane" data-p="sl">${window.SLX ? SLX.paneHTML(l) : ''}</section>
        <section class="pane" data-p="ws">${window.WSX ? WSX.paneHTML(l) : ''}</section>
        <section class="pane" data-p="dr">${window.WSX ? WSX.paneHTML(l, 'dr') : ''}</section>
        <section class="pane" data-p="qz">${window.WSX ? WSX.paneHTML(l, 'qz') : ''}</section>
      </div>`;
    showTab(curTab);
    drawerWrap.hidden = false; document.body.style.overflow = 'hidden';
    $('#btnPrint', drawer).addEventListener('click', () => window.print());
    if (window.WSX) { WSX.fillPane($('.pane[data-p="ws"] .ws-tab', drawer), l); WSX.fillPane($('.pane[data-p="dr"] .ws-tab', drawer), l, 'dr'); WSX.fillPane($('.pane[data-p="qz"] .ws-tab', drawer), l, 'qz'); }
    if (window.SLX) SLX.fillPane($('.pane[data-p="sl"] .sl-tab', drawer), l);
    $$('.d-tabs button', drawer).forEach(b => b.addEventListener('click', () => { showTab(b.dataset.tab); history.replaceState(null, '', `#/lesson/${l.id}/${b.dataset.tab}`); }));
    $('.d-body', drawer).scrollTop = 0;
  }
  function showTab(k) { curTab = k; $$('.d-tabs button', drawer).forEach(b => b.classList.toggle('on', b.dataset.tab === k)); $$('.pane', drawer).forEach(p => p.classList.toggle('on', p.dataset.p === k)); }
  function closeDrawer() { drawerWrap.hidden = true; document.body.style.overflow = ''; curLesson = null; if (/^#\/lesson\//.test(location.hash)) history.pushState(null, '', '#/' + baseView); }

  function panePlan(l) {
    const ty = typeOf(l), own = l.flow && l.flow.length, fr = frameOf(l);
    const mid = own ? l.flow : (LECT_DEF[l.type] || []).map(f => ({ st: f[0], min: f[1], tx: f[2], q: [] }));
    const fix = f => ({ st: f[0], min: f[1], tx: f[2], q: [], fixed: true });
    const flow = [...(fr.pre || PRE).map(fix), ...mid, ...fr.post.map(fix)];
    const total = flow.reduce((a, f) => a + (f.min || 0), 0);
    let h = `<div class="card tycard"><h3>授業の型<span class="ty ${ty.cls}">${ty.name}</span></h3><p>${esc(ty.desc)}</p></div>`;
    if (l.think) h += `<div class="prob think"><span class="pl">考える問い</span>${mfmt(l.think)}</div>`;
    if (l.prep) h += `<div class="card prep"><h3>準備するもの</h3><p>${mfmt(l.prep)}</p></div>`;
    h += `<div class="card flowcard"><h3>授業の流れ（${total}分）${own ? '' : '<span class="tag">型のめやす</span>'}</h3><ol class="flow">${flow.map(f => `<li${f.fixed ? ' class="fx"' : ''}>
        <div class="st">${esc(f.st)}${f.min ? `<small>${f.min}分</small>` : ''}</div>
        ${f.tx ? `<div class="tx">${mfmt(f.tx)}</div>` : ''}
        ${(f.q || []).map(q => `<span class="q">${mfmt(q)}</span>`).join('')}
      </li>`).join('')}</ol><p class="muted small fxnote" style="margin:8px 0 0">うすい色の場面（はじめの小テスト・練習・振り返り）は、型ごとに同じ進め方です。</p></div>`;
    if (l.say || l.see) h += `<div class="card"><h3>表現する場面と見取り</h3>${l.say ? `<p><b>表現する場面</b>　${mfmt(l.say)}</p>` : ''}${l.see ? `<p><b>見取り</b>　${mfmt(l.see)}</p>` : ''}</div>`;
    if (l.tips && l.tips.length) h += `<div class="card"><h3>つまずきと手立て</h3><ul class="tips">${l.tips.map(t => `<li>${mfmt(t)}</li>`).join('')}</ul></div>`;
    if (l.matome) h += `<div class="card"><h3>まとめ</h3><p>${mfmt(l.matome)}</p></div>`;
    if (!l.card) h += `<p class="muted small">この時間の授業構想（考える問い・発問・つまずき）は、まだ書いていません。上の流れは、型ごとのめやすです。</p>`;
    return h;
  }
  // 板書計画：黒板を3つに分けて書く。行のはじめのしるし：□＝枠で囲む　★＝黄色（大事なこと）　→＝生徒の考え・答え　？＝問い
  function paneBoard(l) {
    const b = l.board;
    if (!b || !b.length) return `<div class="empty-note">この時間の板書計画は、まだ書いていません。</div>`;
    const line = x => {
      const m = /^([□★→？])\s*/.exec(x), k = m ? m[1] : '', t = m ? x.slice(m[0].length) : x;
      const cls = k === '□' ? 'box' : k === '★' ? 'y' : k === '？' ? 'b' : k === '→' ? 'p' : '';
      return `<li class="${cls}">${k === '→' ? '<i>→</i>' : ''}${mfmt(t)}</li>`;
    };
    return `<div class="board"><div class="bt"><span>第${l.no}時</span><b>めあて</b>${esc(l.title)}</div>
      <div class="cols" style="grid-template-columns:${b.map(() => '1fr').join(' ')}">${b.map(c => `<div class="col">${c[0] ? `<h4>${esc(c[0])}</h4>` : ''}<ul>${c.slice(1).map(line).join('')}</ul></div>`).join('')}</div></div>
      <p class="board-note">黒板を${b.length}つに分けて、左から順に書いていきます。<b class="bn-box">枠</b>＝課題・問題　<b class="bn-y">黄</b>＝大事なこと・まとめ　<b class="bn-b">青</b>＝問い　→＝生徒の考え・答え。電子黒板を使うときは、問題文や図はスライド（「板書と使う」）で映し、黒板には考えとまとめを書きます。</p>`;
  }

  /* ---------------- settings modal ---------------- */
  const modalWrap = $('#modalWrap'), modal = $('#modal');
  function openSettings() {
    modal.innerHTML = `<div class="m-head"><h2>設定</h2><button class="d-close" data-mclose><svg class="ic"><use href="#i-x"/></svg></button></div><div class="m-body">
      <div class="card"><h3>年間計画の組み方</h3>
        <p class="small muted">各月の「授業のある週の数」と1週あたりの時数から、年間計画のカードを自動で並べます。行事などで週の数が変わる月は、ここで直してください。</p>
        <div class="set-grid">${MONTHS.map(m => `<label>${m}月<input type="number" min="0" max="5" data-wk="${m}" value="${S.weeks[m] | 0}"></label>`).join('')}</div>
        <div class="row" style="margin-top:10px">
          ${GRADES.map(g => `<label class="field" style="margin:0">1週の時数（中${g}）<input type="number" min="1" max="6" data-hpw="${g}" value="${S.hpwBy[g]}" style="width:7em"></label>`).join('')}
          <label class="ck" style="margin:0"><input type="checkbox" id="sEv"${S.useEvents === false ? '' : ' checked'}>定期テスト・まとめの枠を入れる</label>
        </div>
      </div>
      <div class="row"><button class="nbtn pri" id="sSave">保存する</button><button class="nbtn" id="sReset">初期値に戻す</button></div>
    </div>`;
    modalWrap.hidden = false;
    $('#sSave').addEventListener('click', () => {
      $$('[data-wk]', modal).forEach(i => { S.weeks[i.dataset.wk] = Math.max(0, Math.min(5, parseInt(i.value, 10) || 0)); });
      $$('[data-hpw]', modal).forEach(i => { S.hpwBy[i.dataset.hpw] = Math.max(1, Math.min(6, parseInt(i.value, 10) || DEF.hpwBy[i.dataset.hpw])); });
      S.useEvents = $('#sEv').checked;
      store.set('settings', S); modalWrap.hidden = true; route();
    });
    $('#sReset').addEventListener('click', () => { loadSettings(JSON.parse(JSON.stringify(DEF))); store.set('settings', S); modalWrap.hidden = true; route(); });
  }
  function closeModal() { modalWrap.hidden = true; }

  /* ---------------- router ---------------- */
  function setTabs(v) { $$('#mainTabs a').forEach(a => a.classList.toggle('on', a.dataset.v === v)); }
  function renderBase(v, arg) {
    baseView = v; setTabs(v);
    document.body.classList.toggle('pm', ['table', 'tableall', 'about', 'cards'].includes(v));   // 一覧表と「進め方」は、画面そのものを印刷する
    if (v === 'units') renderUnits();
    else if (v === 'table') renderTable();
    else if (v === 'tableall') { setTabs('table'); renderTable(true); }
    else if (v === 'about') renderAbout();
    else if (v === 'cards') { setTabs('units'); renderCards(arg); }
    else if (v === 'search') renderSearch(arg || '');
    else { baseView = 'plan'; setTabs('plan'); renderPlan(); }
  }
  let lastBase = null;
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [a, b, c] = h.split('/');
    // 開こうとしている授業・単元の学年に、表示を合わせる
    const tu = a === 'cards' && unitByKey[b] ? unitByKey[b] : (a === 'lesson' || a === 'ws' || a === 'dr' || a === 'qz' || a === 'sl') && lessonById[b] ? unitByKey[lessonById[b].unit] : (a === 'units' || /print$/.test(a)) && unitByKey[b] ? unitByKey[b] : null;
    let changed = false;
    if (['plan', 'table', 'units'].includes(a) && GRADES.includes(+b)) setGrade(+b);
    if (tu) changed = setGrade(tu.grade);
    if (changed && a === 'lesson' && ['plan', 'units', 'table'].includes(lastBase)) renderBase(lastBase);
    if (a === 'sl' && window.SLX) {
      if (lastBase === null) { renderBase('plan'); lastBase = 'plan'; }
      if (window.WSX) WSX.close();
      drawerWrap.hidden = true; modalWrap.hidden = true;
      SLX.open(b, c, h.split('/')[3]); return;
    }
    if (window.SLX) SLX.close();
    if ((a === 'wsprint' || a === 'drprint' || a === 'qzprint') && window.WSX) {
      if (lastBase === null) { renderBase('plan'); lastBase = 'plan'; }
      drawerWrap.hidden = true; modalWrap.hidden = true;
      WSX.openAll(b, c === 'ans', a.slice(0, 2)); return;
    }
    if ((a === 'ws' || a === 'dr' || a === 'qz') && window.WSX) {
      if (lastBase === null) { renderBase('plan'); lastBase = 'plan'; }
      drawerWrap.hidden = true; modalWrap.hidden = true;
      WSX.open(b, c === 'ans', a); return;
    }
    if (window.WSX) WSX.close();
    if (a === 'lesson') {
      if (lastBase === null) { renderBase('plan'); lastBase = 'plan'; }
      modalWrap.hidden = true; openLesson(b, c); return;
    }
    drawerWrap.hidden = true; modalWrap.hidden = true; document.body.style.overflow = '';
    const key = a || 'plan';
    renderBase(key, key === 'search' ? h.slice('search/'.length) : b);
    lastBase = key;
    if (key === 'units' && b) { const el = document.getElementById('u-' + b); if (el) el.scrollIntoView(); }
    else if (key !== 'plan') window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------------- events ---------------- */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); location.hash = '#/lesson/' + o.dataset.open; return; }
    if (e.target.closest('[data-close]')) { closeDrawer(); return; }
    if (e.target.closest('[data-mclose]')) { closeModal(); return; }
  });
  document.addEventListener('keydown', e => {
    if (window.WSX && WSX.isOpen()) return;
    if (window.SLX && SLX.isOpen()) return;
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'Escape') { if (!modalWrap.hidden) closeModal(); else if (!drawerWrap.hidden) closeDrawer(); }
    if (!drawerWrap.hidden && modalWrap.hidden && curLesson && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const seq = seqOf(curLesson), t = seq[seq.indexOf(curLesson) + (e.key === 'ArrowLeft' ? -1 : 1)];
      if (t) location.hash = `#/lesson/${t.id}/${curTab}`;
    }
    if (e.key === '/' && drawerWrap.hidden) { e.preventDefault(); $('#q').focus(); }
  });
  let qTimer = null;
  $('#q').addEventListener('input', e => {
    clearTimeout(qTimer);
    const v = e.target.value;
    qTimer = setTimeout(() => { location.hash = v.trim() ? '#/search/' + encodeURIComponent(v.trim()) : '#/plan'; }, 250);
  });
  $('#btnSettings').addEventListener('click', openSettings);
  $$('#gradeSw button').forEach(b => b.addEventListener('click', () => {
    if (!setGrade(+b.dataset.g)) return;
    const base = ['plan', 'units', 'table'].includes(baseView) ? baseView : 'plan';
    if (window.WSX) WSX.close();
    if (location.hash === '#/' + base) route(); else location.hash = '#/' + base;
  }));
  paintGrade();
  // 一覧表と「進め方」は、画面そのものを印刷する（ふだんの印刷は、開いている授業だけ）
  window.addEventListener('beforeprint', () => document.body.classList.toggle('pm', ['table', 'tableall', 'about', 'cards'].includes(baseView) && drawerWrap.hidden && modalWrap.hidden && !(window.WSX && WSX.isOpen())));
  if (window.WSX) WSX.onKnown(() => {
    $$('.lc[data-open]').forEach(c => {
      const f = $('.lc-f', c), b = f && $('.wsb', f), hasW = WSX.has(c.dataset.open);
      if (f && hasW && !b) f.insertAdjacentHTML('beforeend', '<span class="badge wsb" title="編集して保存したワークシートがあります">WS✎</span>');
      if (b && !hasW) b.remove();
    });
  });
  window.HJX = { buildSchedule, TYPES, FRAME, frameOf };
  route();
})();
