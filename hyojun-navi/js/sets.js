/* セットで入れる・周辺の問題をさがす — ワークシート（演習プリント・小テスト）の編集画面の右に出る欄。
   ① ひな形：例題＋解き方＋練習、課題＋自分の考え＋まとめ … のような「塊」を、1回で入れる
   ② さがす：その時間・前後の時間・同じ単元の ワークシート／演習プリント／小テスト を塊に分けて、ことばで探し、塊のまま入れる
   塊の分け方：枠つきの問題（課題・例題・考えよう）や、見出しのついた文（練習・ことば・（1）…）から、次の見出しの前までを1つの塊にする。
   入れる場所：選んでいるブロックのすぐ下（選んでいなければ、いちばん下）。 */
(function () {
  'use strict';
  const D = window.LDB || {}, X = window.WSX, E = X && X._ed;
  if (!E) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const lessons = D.lessons || [], units = D.units || [];
  const lessonById = Object.fromEntries(lessons.map(l => [l.id, l]));
  const unitByKey = Object.fromEntries(units.map(u => [u.key, u]));
  const KIND = { ws: { name: 'ワークシート', src: () => D.worksheets || {} }, dr: { name: '演習プリント', src: () => D.drills || {} }, qz: { name: '小テスト', src: () => D.quizzes || {} } };
  const TYPE = { ex: '例題', task: '課題・問題', prac: '練習・小問', think: '考える問題', word: 'ことば・まとめ' };

  /* ---------------- ひな形 ---------------- */
  const q3 = (n, rows) => ({ type: 'cols', ratio: '1:1:1', cols: Array.from({ length: 3 }, (_, i) => ({ blocks: [{ type: 'text', label: `（${n + i}）`, text: '' }, { type: 'write', rows, answer: '' }] })) });
  const q2 = (n, rows) => ({ type: 'cols', ratio: '1:1', cols: Array.from({ length: 2 }, (_, i) => ({ blocks: [{ type: 'text', label: `（${n + i}）`, text: '' }, { type: 'write', rows, answer: '' }] })) });
  const TEMPLATES = [
    { name: '例題セット', desc: '例題（枠つき）＋解き方＋練習3問', type: 'ex', blocks: () => [{ type: 'kadai', label: '例題', text: '' }, { type: 'write', label: '解き方', rows: 4, answer: '' }, { type: 'text', label: '練習', text: '次の計算をしよう。' }, q3(1, 2)] },
    { name: '例題だけ', desc: '例題（枠つき）＋解き方', type: 'ex', blocks: () => [{ type: 'kadai', label: '例題', text: '' }, { type: 'write', label: '解き方', rows: 4, answer: '' }] },
    { name: '課題セット', desc: '課題（枠つき）＋自分の考え＋問いかけ＋まとめ（空らんつき）', type: 'task', blocks: () => [{ type: 'kadai', label: '課題', text: '' }, { type: 'write', label: '自分の考え', rows: 4, answer: '', prompt: '' }, { type: 'write', label: '', rows: 3, answer: '', prompt: '（みんなで考える問い）' }, { type: 'text', label: 'まとめ', text: '{{　　}}', rows: 2 }] },
    { name: '練習 6問', desc: '3列×2段（計算むき）', type: 'prac', blocks: () => [{ type: 'text', label: '練習', text: '次の計算をしよう。' }, q3(1, 2), q3(4, 2)] },
    { name: '練習 4問', desc: '2列×2段（文章題・少し長い問題むき）', type: 'prac', blocks: () => [{ type: 'text', label: '練習', text: '次の問いに答えよう。' }, q2(1, 3), q2(3, 3)] },
    { name: '考える問題', desc: '「考えよう」（枠つき）＋記入欄', type: 'think', blocks: () => [{ type: 'kadai', label: '考えよう', text: '' }, { type: 'write', label: '', rows: 3, answer: '' }] },
    { name: 'ことば・まとめ', desc: '空らんつきの文（{{ }} の中が空らんになる）', type: 'word', blocks: () => [{ type: 'text', label: 'ことば', text: '○○を{{　　}}という。', rows: 2 }] },
    { name: '表つきの問題', desc: '問題文＋表（下の段が空らん）＋記入欄', type: 'task', blocks: () => [{ type: 'kadai', label: '問題', text: '' }, { type: 'table', rows: [{ h: 'x', cells: '−2 −1 0 1 2', head: true }, { h: 'y', cells: '', blank: true }] }, { type: 'write', label: '', rows: 3, answer: '', prompt: '' }] },
    { name: 'グラフつきの問題', desc: '左に問題と記入欄、右に座標平面', type: 'task', blocks: () => [{ type: 'cols', ratio: '1:1', cols: [{ blocks: [{ type: 'kadai', label: '問題', text: '', rows: 2 }, { type: 'write', label: '', rows: 6, answer: '' }] }, { blocks: [{ type: 'figure', rows: 10, figs: [{ kind: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5 }] }] }] }] },
    { name: '図形つきの問題', desc: '左に問題と記入欄、右に図（自由にかく）', type: 'task', blocks: () => [{ type: 'cols', ratio: '3:2', cols: [{ blocks: [{ type: 'kadai', label: '問題', text: '', rows: 2 }, { type: 'write', label: '', rows: 5, answer: '' }] }, { blocks: [{ type: 'figure', rows: 8, figs: [{ kind: 'geo', src: '頂点 A 2 4 上\n頂点 B 0 0 左下\n頂点 C 6 0 右下\n多角形 A B C' }] }] }] }] },
    { name: '演習の見出し＋計算6問', desc: '演習プリント用：見出し（基礎・基本）＋3列×2段', type: 'prac', kinds: ['dr'], blocks: () => [{ type: 'meate', label: '基礎・基本', text: '次の計算をしよう。' }, q3(1, 2), q3(4, 2)] },
    { name: '入試に挑戦', desc: '演習プリント用：見出し＋問題（枠つき）＋記入欄', type: 'task', kinds: ['dr'], blocks: () => [{ type: 'meate', label: '入試に挑戦', text: 'テストでよく出る形の問題に挑戦しよう。' }, { type: 'kadai', label: '問題', text: '' }, { type: 'write', label: '', rows: 6, answer: '' }] }
  ];

  /* ---------------- 塊に分ける ---------------- */
  const strip = t => E.stripMarks(String(t || '')).replace(/\s+/g, ' ').trim();
  const walk = (bs, fn) => bs.forEach(b => { fn(b); if (b.type === 'cols') b.cols.forEach(c => walk(c.blocks, fn)); });
  function clean(b, kind) {   // 小テストの点・検算のしるしなど、入れるときにいらないものを取る
    b = clone(b);
    walk([b], x => {
      delete x.id; delete x.pt; delete x.nogap; delete x.score; delete x.v; delete x.vp;
      if (kind === 'qz') ['text', 'label', 'prompt'].forEach(k => { if (typeof x[k] === 'string') x[k] = x[k].replace(/（各?\d+点）/g, '').trim(); });
    });
    return b;
  }
  const textOf = bs => { const out = []; walk(bs, b => { out.push(b.label, b.text, b.prompt, b.answer); (b.rows && Array.isArray(b.rows) ? b.rows : []).forEach(r => out.push(r.h, r.cells)); (b.figs || []).forEach(f => out.push(f.caption)); }); return strip(out.filter(Boolean).join(' ')); };
  const rowsOf = bs => bs.reduce((a, b) => a + (b.type === 'write' || b.type === 'figure' ? Math.max(1, +b.rows || 1) : b.type === 'table' ? (b.rows || []).length : b.type === 'cols' ? Math.max(0, ...b.cols.map(c => rowsOf(c.blocks))) : Math.max(1, +b.rows || 1)), 0);
  function typeOf(c) {
    const b = c.blocks[0], lb = b.label || '';
    if (c.sec === 'チャレンジ') return 'think';
    if (b.type === 'kadai') return /^例題/.test(lb) ? 'ex' : /^考えよう/.test(lb) ? 'think' : /^練習/.test(lb) ? 'prac' : 'task';
    if (b.type === 'text' && /^(ことば|きまり|まとめ|ポイント|確認|ふり返り)/.test(lb)) return 'word';
    if (b.type === 'cols') { let t = 'prac', done = false; walk([b], x => { if (done) return; if (x.type === 'kadai') { t = /^例題/.test(x.label || '') ? 'ex' : /^考えよう/.test(x.label || '') ? 'think' : 'task'; done = true; } else if (x.type === 'text' && /^例題/.test(x.label || '')) { t = 'ex'; done = true; } }); return t; }
    return 'prac';
  }
  function chunksOf(sheet, lid, kind) {
    const out = []; let cur = null, sec = '', lead = '';
    (sheet.blocks || []).forEach(raw => {
      if (raw.type === 'break') { cur = null; return; }
      if (raw.type === 'meate') {
        cur = null;
        if (!raw.label || raw.label === '問題演習' || raw.label === '小テスト') return;   // めあて・ねらいの行は、塊にしない
        sec = raw.label; lead = raw.label === 'チャレンジ' || raw.label === '入試に挑戦' ? '' : (raw.text || ''); return;
      }
      const b = clean(raw, kind), prev = cur && cur.blocks[cur.blocks.length - 1];
      // 段組の中に、枠つきの問題や見出しのある文（（1）のような小問の番号はのぞく）が入っていれば、その段組は1つで独立した塊
      let own = false; if (b.type === 'cols') walk([b], x => { if (x.type === 'kadai' || (x.type === 'text' && x.label && !/^[（(]?\d+[）)]?$/.test(x.label))) own = true; });
      const starts = !cur || b.type === 'kadai' || own || (b.type === 'text' && (b.label || (prev && (prev.type === 'write' || prev.type === 'cols'))));
      if (starts) {
        cur = { lid, kind, sec, blocks: [] }; out.push(cur);
        // 見出しの文（「次の計算をしよう。」など）は、すぐ下が小問のならび・記入欄のときだけ、前おきとして塊に入れる
        if (lead && (b.type === 'cols' || b.type === 'write' || b.type === 'table')) cur.blocks.push({ type: 'text', label: '練習', text: lead });
        if (b.type === 'text' && !b.label && kind === 'qz') b.label = '練習';
        lead = '';
      }
      cur.blocks.push(b);
    });
    return out.filter(c => c.blocks.length > 1 || !['text'].includes(c.blocks[0].type) || /\{\{/.test(c.blocks[0].text || '') || c.blocks[0].label)
      .map((c, i) => { const b = c.blocks[0]; return Object.assign(c, { n: i, type: typeOf(c), rows: rowsOf(c.blocks), title: (b.label ? b.label + '　' : '') + strip(b.type === 'cols' ? textOf(b.cols[0].blocks) : (b.text || b.prompt || '')).slice(0, 70), text: textOf(c.blocks).toLowerCase() }); });
  }
  let INDEX = null;
  const seqIdx = {};   // 年間計画の中での順番（「周辺」をはかるのに使う）
  function buildIndex() {
    if (INDEX) return INDEX;
    lessons.forEach((l, i) => { seqIdx[l.id] = i; });
    INDEX = [];
    Object.keys(KIND).forEach(kind => {
      const src = KIND[kind].src();
      Object.keys(src).forEach(lid => {
        const l = lessonById[lid]; if (!l) return;
        const u = unitByKey[l.unit] || {}, ctx = `${u.name || ''} ${l.title || ''} ${l.sub || ''}`.toLowerCase();
        chunksOf(src[lid], lid, kind).forEach(c => { c.ctx = ctx; INDEX.push(c); });
      });
    });
    return INDEX;
  }

  /* ---------------- 画面 ---------------- */
  let wrap = null, box = null;
  const S = { tab: 'find', q: '', scope: 'unit', type: 'all', kinds: { ws: true, dr: true, qz: true }, level: 'all', ans: false, limit: 20, where: 'sel' };
  const SCOPES = [['here', 'この時間'], ['near', '前後2時間'], ['unit', 'この単元'], ['grade', 'この学年'], ['all', '全部']];
  const LEVELS = ['基礎・基本', '標準', '応用', '入試に挑戦'];
  const curLesson = () => lessonById[E.st.lid] || null;
  function mount(w) {
    wrap = w;
    const bar = $('.wse-bar', wrap), undo = $('#wsUndo', wrap);
    const btn = document.createElement('button'); btn.className = 'nbtn set'; btn.id = 'wsSetBtn'; btn.type = 'button'; btn.title = '例題＋練習などの塊を入れる／前後の時間の問題をさがして入れる';
    btn.textContent = '＋ セット・問題を入れる';
    bar.insertBefore(btn, undo);
    btn.addEventListener('click', () => (box.hidden ? open() : close()));
    box = document.createElement('aside'); box.id = 'wsSetBox'; box.className = 'wset'; box.hidden = true;
    wrap.appendChild(box);
    box.addEventListener('click', onClick);
    box.addEventListener('input', e => { if (e.target.id === 'wsetQ') { S.q = e.target.value; S.limit = 20; paintList(); } });
    box.addEventListener('change', e => { if (e.target.id === 'wsetAns') { S.ans = e.target.checked; $$('.wset-pv', box).forEach(p => p.classList.toggle('ans-on', S.ans)); } if (e.target.name === 'wsetWhere') S.where = e.target.value; });
    document.addEventListener('keydown', e => { if (box && !box.hidden && e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } }, true);
  }
  function open(tab) {
    if (!box || !E.st.sheet || E.st.all) return;
    if (tab) S.tab = tab;
    box.style.top = ($('.wse-bar', wrap).offsetHeight || 54) + 'px';
    buildIndex(); box.hidden = false; wrap.classList.add('set-on'); paint();
    window.dispatchEvent(new Event('resize'));   // 紙の大きさを、せまくなった画面に合わせ直す
    const q = $('#wsetQ', box); if (q && S.tab === 'find') q.focus();
  }
  function close() { if (box && !box.hidden) { box.hidden = true; wrap.classList.remove('set-on'); window.dispatchEvent(new Event('resize')); } }
  function refresh() { if (box && !box.hidden) { const w = $('#wsetWhere', box); if (w) w.textContent = whereText(); } }

  const whereText = () => {
    const r = E.st.sel ? E.locate(E.st.sel) : null;
    if (!r) return 'いちばん下に入ります（入れたい場所があるときは、左のブロックか、紙の上のブロックを選んでください）';
    const top = r.parent || r.b, t = strip((top.label ? top.label + ' ' : '') + (top.text || top.prompt || '')).slice(0, 22);
    return `選んでいるブロック「${t || { cols: '段組', table: '表', figure: '図', write: '記入欄' }[top.type] || ''}」のすぐ下に入ります`;
  };
  function paint() {
    const l = curLesson(), u = l ? unitByKey[l.unit] : null;
    const chip = (key, v, lb, on) => `<button type="button" class="chip${on ? ' on' : ''}" data-k="${key}" data-v="${esc(v)}">${esc(lb)}</button>`;
    box.innerHTML = `
      <div class="wset-h"><b>セット・問題を入れる</b><span class="sp"></span><button type="button" class="d-close" data-x title="とじる（Esc）">✕</button></div>
      <div class="wset-tabs"><button type="button" data-tab="find" class="${S.tab === 'find' ? 'on' : ''}">周辺の問題をさがす</button><button type="button" data-tab="tpl" class="${S.tab === 'tpl' ? 'on' : ''}">ひな形（空のセット）</button></div>
      <p class="wset-where" id="wsetWhere">${esc(whereText())}</p>
      ${S.tab === 'tpl' ? `<div class="wset-list" id="wsetList"></div>` : `
      <div class="wset-f">
        <input id="wsetQ" type="search" placeholder="ことばで探す（例：分数　速さ　グラフ　変域）" value="${esc(S.q)}" autocomplete="off">
        <div class="wset-chips">${SCOPES.map(([v, lb]) => chip('scope', v, lb, S.scope === v)).join('')}</div>
        <div class="wset-chips">${chip('type', 'all', 'すべて', S.type === 'all')}${Object.keys(TYPE).map(t => chip('type', t, TYPE[t], S.type === t)).join('')}</div>
        <div class="wset-chips">${Object.keys(KIND).map(k => chip('kind', k, KIND[k].name, S.kinds[k])).join('')}<span class="fsep"></span>${chip('level', 'all', '難しさ：すべて', S.level === 'all')}${LEVELS.map(v => chip('level', v, v, S.level === v)).join('')}</div>
        <label class="ck"><input type="checkbox" id="wsetAns"${S.ans ? ' checked' : ''}>解答例も見る</label>
      </div>
      <p class="wset-n" id="wsetN"></p>
      <div class="wset-list" id="wsetList"></div>`}
      <p class="wset-foot">${l ? `いま開いている時間：${esc(u ? u.name : '')} 第${l.no}時` : ''}　入れたあとは、ふつうのブロックと同じように直せます（↶ で取り消し）。</p>`;
    paintList();
  }
  const g7 = () => E.geo({ paper: 'A4', pitch: 7 });
  function previewHTML(blocks) {
    const g = g7(), bs = blocks.map(b => E.normBlock(clone(b)));
    return `<div class="wset-pv${S.ans ? ' ans-on' : ''}"><div class="wsp wset-sheet" style="--pitch:${g.pitch}mm;width:${g.cw}mm"><div class="wsp-flow">${E.withEx(null, () => bs.map(b => E.blockHTML(b, g.cw, g)).join(''))}</div></div></div>`;
  }
  function results() {
    const l = curLesson(), here = l ? seqIdx[l.id] : -1, u = l ? unitByKey[l.unit] : null;
    const terms = S.q.trim().toLowerCase().split(/[\s　]+/).filter(Boolean);
    const dist = c => { const cl = lessonById[c.lid], cu = unitByKey[cl.unit] || {}; return u && cu.grade === u.grade ? Math.abs(seqIdx[c.lid] - here) : 9999; };
    return buildIndex().filter(c => {
      if (!S.kinds[c.kind]) return false;
      if (S.type !== 'all' && c.type !== S.type) return false;
      if (S.level !== 'all' && c.sec !== S.level) return false;
      const cl = lessonById[c.lid], cu = unitByKey[cl.unit] || {};
      if (l) {
        if (S.scope === 'here' && c.lid !== l.id) return false;
        if (S.scope === 'near' && !(cl.unit === l.unit && Math.abs(cl.no - l.no) <= 2)) return false;
        if (S.scope === 'unit' && cl.unit !== l.unit) return false;
        if (S.scope === 'grade' && cu.grade !== u.grade) return false;
      }
      return terms.every(t => c.text.includes(t) || c.ctx.includes(t));
    }).map(c => ({ c, d: dist(c) + (l && c.lid === l.id && c.kind === (E.st.kind || 'ws') ? 0.5 : 0) })).sort((a, b) => a.d - b.d || seqIdx[a.c.lid] - seqIdx[b.c.lid] || ['ws', 'dr', 'qz'].indexOf(a.c.kind) - ['ws', 'dr', 'qz'].indexOf(b.c.kind) || a.c.n - b.c.n).map(x => x.c);
  }
  let shown = [];
  function paintList() {
    const list = $('#wsetList', box); if (!list) return;
    if (S.tab === 'tpl') {
      const kd = E.st.kind || 'ws';
      shown = TEMPLATES.filter(t => !t.kinds || t.kinds.includes(kd)).map(t => ({ tpl: t, blocks: t.blocks() }));
      list.innerHTML = shown.map((t, i) => `<article class="wset-c"><div class="wset-ch"><span class="ty t-${t.tpl.type}">${esc(TYPE[t.tpl.type])}</span><b>${esc(t.tpl.name)}</b><span class="muted">${esc(t.tpl.desc)}</span><span class="sp"></span><button type="button" class="nbtn pri" data-ins="${i}">入れる</button></div>${previewHTML(t.blocks)}</article>`).join('');
      return;
    }
    const all = results(); shown = all.slice(0, S.limit).map(c => ({ c, blocks: c.blocks }));
    $('#wsetN', box).textContent = all.length ? `${all.length}件（近い時間から順に）` : '';
    list.innerHTML = shown.length ? shown.map((s, i) => {
      const c = s.c, l = lessonById[c.lid], u = unitByKey[l.unit] || {};
      return `<article class="wset-c"><div class="wset-ch"><span class="ty t-${c.type}">${esc(TYPE[c.type])}</span><span class="wsrc" style="--u:${esc(u.color || '#555')}">${esc(u.short || u.name || '')} 第${l.no}時・${esc(KIND[c.kind].name)}${c.sec && c.kind !== 'ws' ? '（' + esc(c.sec) + '）' : ''}</span><span class="muted">${c.rows}行</span><span class="sp"></span><button type="button" class="nbtn pri" data-ins="${i}">入れる</button></div>${previewHTML(c.blocks)}</article>`;
    }).join('') + (all.length > shown.length ? `<button type="button" class="wse-add" data-more>さらに表示（あと${all.length - shown.length}件）</button>` : '')
      : `<div class="empty-note">この条件に合う問題はありません。<br><small>「この単元」→「この学年」→「全部」と広げるか、ことばを短くしてみてください。教材がまだできていない単元からは見つかりません。</small></div>`;
  }
  function onClick(e) {
    const t = e.target;
    if (t.closest('[data-x]')) { close(); return; }
    const tab = t.closest('[data-tab]'); if (tab) { S.tab = tab.dataset.tab; paint(); return; }
    const ch = t.closest('.chip[data-k]');
    if (ch) {
      const k = ch.dataset.k, v = ch.dataset.v;
      if (k === 'kind') { S.kinds[v] = !S.kinds[v]; if (!Object.values(S.kinds).some(Boolean)) S.kinds[v] = true; }
      else S[k] = v;
      S.limit = 20; const q = S.q; paint(); const qi = $('#wsetQ', box); if (qi) qi.value = q; return;
    }
    if (t.closest('[data-more]')) { S.limit += 20; paintList(); return; }
    const ins = t.closest('[data-ins]'); if (ins) insert(shown[+ins.dataset.ins], ins);
  }
  // 例題・練習の番号を、入れる先に合わせてふり直す（例題が2つあるところに入れたら「例題3」）
  function relabel(blocks, sheet) {
    const count = re => { let n = 0; walk(sheet.blocks, b => { if ((b.type === 'kadai' || b.type === 'text') && re.test(b.label || '')) n++; }); return n; };
    let ex = count(/^例題/), pr = count(/^練習/);
    walk(blocks, b => {
      if (b.type === 'kadai' && /^例題\d*$/.test(b.label || '')) b.label = '例題' + (++ex);
      else if ((b.type === 'text' || b.type === 'kadai') && /^練習\d*$/.test(b.label || '')) { pr++; b.label = pr > 1 || /\d/.test(b.label) ? '練習' + pr : '練習'; }
    });
  }
  function insert(item, btn) {
    const st = E.st; if (!item || !st.sheet) return;
    const blocks = item.blocks.map(b => E.reid(E.normBlock(clone(b))));
    // ワークシートに、演習プリントの見出し（基礎・基本 など）は入れない
    relabel(blocks, st.sheet);
    const root = st.sheet.blocks, r = st.sel ? E.locate(st.sel) : null;
    let at = root.length;
    if (r) { const top = r.parent || r.b; const i = root.indexOf(top); if (i >= 0) at = i + 1; }
    root.splice(at, 0, ...blocks);
    st.sel = blocks[blocks.length - 1].id;   // 続けて入れると、その下に並ぶ
    E.changed(true);
    const w = $('#wsetWhere', box); if (w) w.textContent = whereText();
    if (btn) { const keep = btn.textContent; btn.textContent = '入れました ✓'; btn.classList.add('done'); setTimeout(() => { btn.textContent = keep; btn.classList.remove('done'); }, 1400); }
    const el = document.querySelector(`#wsPages [data-b="${blocks[0].id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  window.WSETS = { mount, open, close, refresh, isOpen: () => !!(box && !box.hidden), _t: { chunksOf, buildIndex, results, S, insert, TEMPLATES } };
})();
