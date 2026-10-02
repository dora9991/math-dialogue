/* ノート型ワークシート（ドット入り罫線）— 表示・編集・保存・印刷
   シート：{ paper:'A4'|'B5', pitch:罫の幅mm, dots:true, head:'欄外の見出し', blocks:[…] }
   ブロック：meate めあて／kadai 学習課題／text 問題文／write 記入欄／table 表／figure 図・グラフ／cols 2段組／break 改ページ
   1行＝罫1本分。文字の中では {{答え}}＝空欄、[[1/2]]＝分数、x^2＝累乗、**太字**、{|式1|式2|}＝連立方程式、√{12×8}＝根号。
   保存先：serve.py で開いたときは worksheets/<時間のID>.json、それ以外はこのブラウザ（localStorage）。 */
(function () {
  'use strict';
  const D = window.LDB || { lessons: [], units: [] };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lessonById = Object.fromEntries((D.lessons || []).map(l => [l.id, l]));
  const unitByKey = Object.fromEntries((D.units || []).map(u => [u.key, u]));
  const SAMPLES = D.worksheets || {};
  /* 問題演習プリント（表＝基礎・基本と標準／裏＝応用と入試に挑戦）。見本は D.drills[時間のID]。
     保存するときの名前は「ex＋時間のID」（ワークシートと同じ置き場に、別の名前で入る） */
  const DRILLS = D.drills || {}, DR = 'ex';
  /* 小テスト（5分・100点＋チャレンジ1問。A4 1枚）。見本は D.quizzes[時間のID]、保存するときの名前は「qz＋時間のID」 */
  const QUIZZES = D.quizzes || {}, QZ = 'qz';
  const keyOf = (id, kind) => kind === 'dr' ? DR + id : kind === 'qz' ? QZ + id : id;
  const preOf = key => { const k = String(key || ''); return [DR, QZ].find(p => k.indexOf(p) === 0 && lessonById[k.slice(p.length)]) || ''; };
  const lidOf = key => String(key || '').slice(preOf(key).length);
  const isDrill = key => preOf(key) === DR, isQuiz = key => preOf(key) === QZ;
  const sampleOf = key => isDrill(key) ? DRILLS[lidOf(key)] : isQuiz(key) ? QUIZZES[lidOf(key)] : SAMPLES[key];
  // 種類ごとの呼び名（'ws'＝ノート型ワークシート、'dr'＝問題演習プリント、'qz'＝小テスト）
  const KIND = { ws: { name: 'ノート型ワークシート', src: SAMPLES }, dr: { name: '問題演習プリント', src: DRILLS }, qz: { name: '小テスト', src: QUIZZES } };
  const kindOf = kind => KIND[kind] ? kind : 'ws';
  const hasKind = (id, kind) => kind === 'ws' || !!KIND[kind].src[id] || known.has(keyOf(id, kind));
  const clone = o => JSON.parse(JSON.stringify(o));
  const num = (v, d) => { const n = parseFloat(String(v == null ? '' : v).replace(/[−–]/g, '-')); return isFinite(n) ? n : d; };
  const f2 = n => String(Math.round(n * 100) / 100);

  const PAPER = {
    A4: { w: 210, h: 297, mx: 12, top: 23, bottom: 9 },
    B5: { w: 182, h: 257, mx: 11, top: 21, bottom: 8 }
  };
  const COL_GAP = 6;   // 2段組の列のすき間（mm）
  const FIG_GAP = 4;   // 図を横に並べるときのすき間（mm）
  const TYPE_LABEL = { meate: 'めあて', kadai: '学習課題', text: '問題文', write: '記入欄', table: '表', figure: '図・グラフ', cols: '2段組', break: '改ページ' };
  const ADD_MENU = [['meate', 'めあて'], ['sec', '見出し（基礎・基本／標準／応用 など）'], ['kadai', '学習課題（枠つき）'], ['text', '問題文・説明'], ['write', '記入欄（空欄）'],
    ['matome', 'まとめ（枠つき）'], ['furikaeri', '振り返り'], ['table', '表'], ['coord', '座標平面'], ['numline', '数直線'],
    ['geo', '図形（自由にかく）'], ['solid', '立体'], ['chart', 'グラフ・ヒストグラム'], ['image', '画像（図）'], ['cols', '2段組'], ['break', '改ページ']];
  const FIG_KINDS = [['coord', '座標平面'], ['numline', '数直線'], ['geo', '図形（自由にかく）'], ['solid', '立体'], ['chart', 'グラフ・ヒストグラム'], ['image', '画像']];
  const DEFAULTS = {
    meate: () => ({ type: 'meate', text: '' }),
    sec: () => ({ type: 'meate', label: '基礎・基本', text: '' }),
    kadai: () => ({ type: 'kadai', label: '課題', text: '' }),
    text: () => ({ type: 'text', label: '', text: '' }),
    write: () => ({ type: 'write', label: '', prompt: '', rows: 3, answer: '' }),
    matome: () => ({ type: 'write', label: 'まとめ', rows: 4, box: true, answer: '' }),
    furikaeri: () => ({ type: 'write', label: '振り返り', rows: 2 }),
    table: () => ({ type: 'table', rows: [{ h: 'x', cells: '−2 −1 0 1 2' }, { h: 'y', cells: '', blank: true }] }),
    coord: () => ({ type: 'figure', rows: 10, figs: [{ kind: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5 }] }),
    numline: () => ({ type: 'figure', rows: 2, figs: [{ kind: 'numline', min: -10, max: 10, label: 5 }] }),
    image: () => ({ type: 'figure', rows: 8, figs: [{ kind: 'image' }] }),
    geo: () => ({ type: 'figure', rows: 8, figs: [{ kind: 'geo', src: '点 A 0 0\n点 B 6 0\n点 C 2 4\n多角形 A B C' }] }),
    solid: () => ({ type: 'figure', rows: 8, figs: [{ kind: 'solid', shape: 'cuboid', a: 5, b: 3, c: 3, labels: 'ABCDEFGH' }] }),
    chart: () => ({ type: 'figure', rows: 10, figs: [{ kind: 'chart', xmin: 0, xmax: 50, xstep: 10, ymin: 0, ymax: 10, ystep: 1, xname: '（点）', yname: '（人）', bars: '' }] }),
    cols: () => ({ type: 'cols', ratio: '1:1', cols: [{ blocks: [] }, { blocks: [] }] }),
    break: () => ({ type: 'break' })
  };

  /* ---------------- シートの形をそろえる ---------------- */
  let uidN = 0;
  const uid = () => 'b' + Date.now().toString(36).slice(-4) + (uidN++).toString(36);
  function normBlock(b) {
    b = Object.assign({}, b);
    if (!b.id) b.id = uid();
    if (!TYPE_LABEL[b.type]) b.type = 'text';
    if (b.type === 'cols') {
      const cs = Array.isArray(b.cols) && b.cols.length ? b.cols.slice(0, 4) : [{ blocks: [] }, { blocks: [] }];   // 小問は4列まで
      b.cols = cs.map(c => ({ blocks: ((c && c.blocks) || []).filter(x => x && x.type !== 'cols' && x.type !== 'break').map(normBlock) }));
    }
    if (b.type === 'figure') b.figs = (b.figs && b.figs.length ? b.figs : [{ kind: 'coord' }]).map(f => Object.assign({}, f));
    if (b.type === 'table') b.rows = (b.rows || []).map(r => Object.assign({ h: '', cells: '' }, r));
    return b;
  }
  function normalize(s) {
    s = s || {};
    return {
      version: 1, paper: PAPER[s.paper] ? s.paper : 'A4', pitch: Math.min(10, Math.max(5, num(s.pitch, 7))),
      dots: s.dots !== false, fill: s.fill !== false, head: s.head == null ? null : String(s.head),
      blocks: (Array.isArray(s.blocks) ? s.blocks : []).map(normBlock), draft: !!s.draft,
      kind: s.kind === 'drill' ? 'drill' : s.kind === 'quiz' ? 'quiz' : undefined   // 'drill'＝問題演習プリント、'quiz'＝小テスト
    };
  }
  function geo(sheet) {
    const P = PAPER[sheet.paper] || PAPER.A4, pitch = sheet.pitch;
    return { P, pitch, rows: Math.floor((P.h - P.top - P.bottom) / pitch + 1e-6), cw: P.w - 2 * P.mx };
  }
  const headText = (sheet, l) => sheet.head != null ? sheet.head : (l ? `${(unitByKey[l.unit] || {}).name || ''}　第${l.no}時` : '');

  // 授業データからつくる下書き（サンプルも保存もない時間用）
  function draftFor(l) {
    const ps = (l && l.problems) || [];
    const blocks = [{ type: 'meate', text: l ? l.title : '' }];
    if (ps[0]) blocks.push({ type: 'kadai', label: ps[0].l || '課題', text: ps[0].t });
    blocks.push({ type: 'write', label: '予想', rows: 1 });
    blocks.push({ type: 'write', label: '自分の考え', rows: 7, answer: (ps[0] && ps[0].a) || '' });
    blocks.push({ type: 'write', label: 'みんなの考え', rows: 5 });
    ps.slice(1).forEach(p => {
      blocks.push({ type: 'text', label: p.l, text: p.t });
      blocks.push({ type: 'write', rows: 4, answer: p.a || '' });
    });
    return { paper: 'A4', pitch: 7, dots: true, head: null, blocks, draft: true };
  }

  // 問題演習プリントのひな形（見本も保存もない時間用）：表＝基礎・基本と標準、裏＝応用と入試に挑戦
  function drillDraft(l) {
    const q = n => ({ type: 'text', label: `（${n}）`, text: '' }), w = rows => ({ type: 'write', rows, answer: '' });
    const cols = (n, rows, from) => ({ type: 'cols', ratio: n === 3 ? '1:1:1' : '1:1', cols: Array.from({ length: n }, (_, i) => ({ blocks: [q(from + i), w(rows)] })) });
    return { paper: 'A4', pitch: 7, dots: true, head: null, kind: 'drill', draft: true, blocks: [
      { type: 'meate', text: l ? l.title : '' },
      { type: 'meate', label: '基礎・基本', text: '' }, cols(3, 3, 1), cols(3, 3, 4),
      { type: 'meate', label: '標準', text: '' }, cols(2, 5, 1), cols(2, 5, 3),
      { type: 'break' },
      { type: 'meate', label: '応用', text: '' }, q(1), w(6), q(2), w(6),
      { type: 'meate', label: '入試に挑戦', text: '' }, { type: 'kadai', label: '問題', text: '' }, w(10)] };
  }
  // 小テストのひな形（見本も保存もない時間用）：5問×20点＋チャレンジ1問
  function quizDraft(l) {
    const q = n => ({ type: 'text', label: `（${n}）`, text: '' }), w = rows => ({ type: 'write', rows, answer: '' });
    const cols = (n, rows, from) => ({ type: 'cols', ratio: n === 3 ? '1:1:1' : '1:1', cols: Array.from({ length: n }, (_, i) => ({ blocks: [q(from + i), w(rows)] })) });
    return { paper: 'A4', pitch: 7, dots: true, head: null, kind: 'quiz', draft: true, blocks: [
      { type: 'meate', label: '小テスト', text: l ? l.title : '', rows: 2, score: 100 },
      { type: 'text', label: '', text: '（各20点）' }, cols(3, 3, 1), cols(2, 3, 4),
      { type: 'meate', label: 'チャレンジ', text: '時間があまったら挑戦しよう。' }, { type: 'kadai', label: '問題', text: '' }, w(6)] };
  }

  /* ---------------- 保存と読み込み ---------------- */
  const LS = 'hyojunNavi.ws.';
  const local = {
    get(id) { try { const v = localStorage.getItem(LS + id); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(id, s) { try { localStorage.setItem(LS + id, JSON.stringify(s)); return true; } catch (e) { return false; } },
    del(id) { try { localStorage.removeItem(LS + id); } catch (e) { /* 使えない環境では何もしない */ } },
    ids() { try { return Object.keys(localStorage).filter(k => k.indexOf(LS) === 0).map(k => k.slice(LS.length)); } catch (e) { return []; } }
  };
  let serverOK = location.protocol !== 'file:';
  const HDR = { 'X-Hyojun-Navi': '1' };
  async function load(id) {
    if (serverOK) {
      try {
        const r = await fetch('api/ws/' + encodeURIComponent(id), { cache: 'no-store', headers: HDR });
        if (r.ok) { const o = await r.json(); if (o && Array.isArray(o.blocks)) return { sheet: normalize(o), source: 'saved' }; }
        else if (r.status !== 404) serverOK = false;
      } catch (e) { serverOK = false; }
    }
    const lc = local.get(id);
    if (lc) return { sheet: normalize(lc), source: 'local' };
    const smp = sampleOf(id);
    if (smp) return { sheet: normalize(clone(smp)), source: 'sample' };
    return { sheet: normalize(isDrill(id) ? drillDraft(lessonById[lidOf(id)]) : isQuiz(id) ? quizDraft(lessonById[lidOf(id)]) : draftFor(lessonById[id])), source: 'draft' };
  }
  async function save(id, sheet) {
    const data = Object.assign({}, sheet, { draft: false, lesson: id, savedAt: new Date().toISOString() });
    if (serverOK) {
      try {
        const r = await fetch('api/ws/' + encodeURIComponent(id), { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, HDR), body: JSON.stringify(data) });
        if (r.ok) { local.del(id); known.add(id); fireKnown(); return 'file'; }
        serverOK = false;
      } catch (e) { serverOK = false; }
    }
    if (local.set(id, data)) { known.add(id); fireKnown(); return 'local'; }
    return 'fail';
  }
  async function resetSaved(id) {
    if (serverOK) { try { await fetch('api/ws/' + encodeURIComponent(id), { method: 'DELETE', headers: HDR }); } catch (e) { /* つながらなければブラウザ側だけ消す */ } }
    local.del(id);
    known.delete(id);
    fireKnown();
  }
  const known = new Set();   // 編集して保存したワークシート
  let knownCb = null;
  const fireKnown = () => { if (knownCb) knownCb(); };
  function refreshKnown() {
    local.ids().forEach(id => known.add(id));
    if (!serverOK) { fireKnown(); return; }
    fetch('api/ws', { cache: 'no-store', headers: HDR }).then(r => r.ok ? r.json() : []).then(ids => {
      (Array.isArray(ids) ? ids : []).forEach(id => known.add(id)); fireKnown();
    }).catch(() => fireKnown());
  }
  const sourceText = s => ({ saved: '保存済み（worksheets フォルダ）', local: '保存済み（このブラウザ）', sample: '最初の形（まだ編集していません）', draft: '自動の下書き（まだ保存していません）' }[s] || '');

  /* ---------------- 文字の整形 ---------------- */
  // 字幅の見積もり（空欄の幅に使う）：大文字 0.75・数字 0.65・そのほかの半角 0.56・全角 1
  const emOf = t => { let n = 0; for (const ch of String(t).replace(/\[\[|\]\]|\*\*|\^|\{\{|\}\}/g, '')) n += /[A-Z]/.test(ch) ? 0.75 : /[0-9]/.test(ch) ? 0.65 : /[\x20-\x7e]/.test(ch) ? 0.56 : 1; return n; };
  // 1文字の小文字（x, y, a …）は数式らしく斜体に
  // \g のように書いた文字（単位など）は斜体にしない
  // 文字（変数）は斜体に。ax・xy のような2〜3文字の積も斜体、cm・kg などの単位は立体のまま（\m のように \ をつけた文字も立体）
  const UNITS = new Set(['cm', 'mm', 'km', 'kg', 'mg', 'ml', 'dl', 'kl', 'ha', 'min', 'sec', 'cc']);
  const VAR_RE = /(^|[^A-Za-z&#;\u0001])([a-z]{1,3})(?![A-Za-z])/g;
  const italic = (t, open, close) => t.replace(VAR_RE, (m, pre, w) => w.length > 1 && UNITS.has(w) ? m : pre + open + w + close);
  const plain = t => italic(esc(String(t).replace(/\\([A-Za-z])/g, '\u0001$1')), '<i class="v">', '</i>').replace(/\n/g, '<br>').replace(/\u0001/g, '');
  function inl(s) {
    s = String(s == null ? '' : s);
    // {|式1|式2|}＝連立方程式（左に中かっこ。式の数だけ行を使う）
    const re = /\{\{([\s\S]*?)\}\}|\[\[([^\]\/]*)\/([^\]]*)\]\]|\*\*([\s\S]+?)\*\*|\^\{([^}]*)\}|\^([0-9]+|[A-Za-z])|\{\|([\s\S]*?)\|\}|√\{([^{}]*)\}/g;
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += plain(s.slice(last, m.index));
      if (m[1] !== undefined) out += `<span class="bl" style="width:${Math.max(2.4, emOf(m[1]) + 1).toFixed(1)}em"><span class="ansx">${inl(m[1])}</span></span>`;
      else if (m[2] !== undefined) out += `<span class="fr"><span>${inl(m[2])}</span><span>${inl(m[3])}</span></span>`;
      else if (m[4] !== undefined) out += `<b>${inl(m[4])}</b>`;
      else if (m[5] !== undefined) out += `<sup>${inl(m[5])}</sup>`;
      else if (m[7] !== undefined) out += `<span class="sys">${m[7].split('|').map(t => `<span>${inl(t.trim())}</span>`).join('')}</span>`;
      else if (m[8] !== undefined) out += `<span class="sq">√<span>${inl(m[8])}</span></span>`;   // √{12×8}＝根号（上に線がのびる）
      else out += `<sup>${plain(m[6])}</sup>`;
      last = re.lastIndex;
    }
    return out + plain(s.slice(last));
  }
  const stripMarks = t => String(t || '').replace(/\{\{|\}\}|\*\*|\\(?=[A-Za-z])/g, '').replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '$1/$2');

  /* ---------------- 図（SVG・単位はmm） ---------------- */
  const ln = (x1, y1, x2, y2, c, w, extra) => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${c}" stroke-width="${w}"${extra || ''}/>`;
  const tx = (x, y, s, size, anchor, extra) => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" text-anchor="${anchor || 'middle'}"${extra || ''}>${s}</text>`;
  const svgMath = s => italic(esc(String(s).replace(/\\([A-Za-z])/g, '\u0001$1')), '<tspan class="sv">', '</tspan>').replace(/\u0001/g, '');
  const numLabel = n => { const r = Math.round(n * 1000) / 1000; return (r < 0 ? '−' : '') + Math.abs(r); };
  function head(x, y, dir, c, s) {
    const a = s * 1.7, b = s * 0.75;
    const p = dir === 'r' ? [[x, y], [x - a, y - b], [x - a, y + b]] : dir === 'l' ? [[x, y], [x + a, y - b], [x + a, y + b]]
      : dir === 'u' ? [[x, y], [x - b, y + a], [x + b, y + a]] : [[x, y], [x - b, y - a], [x + b, y - a]];
    return `<polygon points="${p.map(q => q.map(f2).join(',')).join(' ')}" fill="${c}"/>`;
  }
  const fracVal = s => { const [p, q] = String(s).split('/'); return parseFloat(p) / (q ? parseFloat(q) : 1); };
  const FR = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾' };
  const prettyEq = s => String(s).replace(/\s+/g, '').replace(/-/g, '−').replace(/=/g, '＝').replace(/\^2/g, '²').replace(/(\d)\/(\d)/g, (m, a, b) => FR[a + '/' + b] || m);
  function parseLines(s) {
    return String(s || '').split(/\n|;|；|、/).map(t => t.trim()).filter(Boolean).map(t => {
      const k = t.search(/[#＃]/), name = k >= 0 ? t.slice(k + 1).trim() : null;   // 「y=x #（1）」で名前を変える、「#」だけなら名前なし
      if (k >= 0) t = t.slice(0, k).trim();
      // 「y=2x+2 [-3,2]」のように書くと、x がその範囲の部分だけをかく（両はしに点）
      const dm = t.replace(/[−–]/g, '-').match(/[\[［]\s*([+-]?\d*\.?\d+)\s*[,，]\s*([+-]?\d*\.?\d+)\s*[\]］]\s*$/);
      if (dm) t = t.slice(0, t.search(/[\[［]/)).trim();
      const r = parseLine1(t); if (r && name != null) r.label = name;
      if (r && dm) r.dom = [Math.min(+dm[1], +dm[2]), Math.max(+dm[1], +dm[2])];
      return r;
    }).filter(Boolean);
  }
  function parseLine1(t) {
    const z0 = t.replace(/[−–ー]/g, '-').replace(/＝/g, '=').replace(/\s+/g, '');
    const v = z0.match(/^x=([+-]?\d+\.?\d*(?:\/\d+\.?\d*)?)$/i);   // x=2（y 軸に平行な直線）
    if (v) return { kind: 'vert', h: fracVal(v[1]), label: t };
    const z = z0.replace(/^y=/i, '');
    let m = z.match(/^([+-]?\d*\.?\d*)(?:\/(\d+\.?\d*))?x(?:\^2|²)$/);   // y=ax^2（放物線）
    if (m) {
      let a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseFloat(m[1]);
      if (m[2]) a /= parseFloat(m[2]);
      return isFinite(a) && a !== 0 ? { kind: 'quad', a, label: t } : null;
    }
    m = z.match(/^([+-]?\d*\.?\d*)(?:\/(\d+\.?\d*))?x([+-]\d+\.?\d*(?:\/\d+\.?\d*)?)?$/);
    if (m) {
      let a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseFloat(m[1]);
      if (m[2]) a /= parseFloat(m[2]);
      return isFinite(a) ? { kind: 'lin', a, b: m[3] ? fracVal(m[3]) : 0, label: t } : null;
    }
    m = z.match(/^([+-]?\d+\.?\d*)\/x$/);
    if (m) return { kind: 'inv', a: parseFloat(m[1]), label: t };
    m = z.match(/^([+-]?\d+\.?\d*(?:\/\d+\.?\d*)?)$/);
    if (m) return { kind: 'lin', a: 0, b: fracVal(m[1]), label: t };
    return null;
  }
  function parsePoints(s) {
    const z = String(s || '').replace(/[−–]/g, '-').replace(/（/g, '(').replace(/）/g, ')').replace(/[，、]/g, ',');
    const out = [], re = /([A-Za-z][′']?)?\s*\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*\)/g;   // A(4,3) のように名前をつけてもよい
    let m; while ((m = re.exec(z))) out.push([parseFloat(m[2]), parseFloat(m[3]), m[1] || '']);
    return out;
  }
  // 直線が枠から出るところ（上側の端）に式を書く
  function lineLabelAt(L, xmin, xmax, ymin, ymax) {
    if (L.kind === 'vert') return L.h >= xmin && L.h <= xmax ? [L.h, ymax, 1, 2.6, 'start'] : null;
    if (L.dom) { xmin = Math.max(xmin, L.dom[0]); xmax = Math.min(xmax, L.dom[1]); if (xmax <= xmin) return null; }
    if (L.kind === 'quad') {   // 右の枝が枠から出るところ
      let x = xmax, y = L.a * x * x, cut = false;
      if (y > ymax) { y = ymax; x = Math.sqrt(ymax / L.a); cut = true; } else if (y < ymin) { y = ymin; x = Math.sqrt(ymin / L.a); cut = true; }
      if (!(x >= xmin && x <= xmax)) return null;
      return L.a > 0 ? (cut ? [x, y, 1, 2.6, 'start'] : [x, y, -0.6, -1.2, 'end']) : (cut ? [x, y, 1, -1, 'start'] : [x, y, -0.6, 2.8, 'end']);
    }
    if (L.kind === 'inv') {   // 比例定数が正なら右の端、負なら左の端（どちらも x 軸より上の枝）の上に書く
      const x = L.a >= 0 ? xmax : xmin, y = L.a / x;
      return y >= ymin && y <= ymax ? (L.a >= 0 ? [x, y, -0.6, -1.2, 'end'] : [x, y, 0.6, -1.2, 'start']) : null;
    }
    const ends = [];
    [[xmin, L.a * xmin + L.b], [xmax, L.a * xmax + L.b]].forEach(([x, y]) => { if (y >= ymin - 1e-9 && y <= ymax + 1e-9) ends.push([x, y]); });
    if (L.a !== 0) [ymin, ymax].forEach(y => { const x = (y - L.b) / L.a; if (x >= xmin - 1e-9 && x <= xmax + 1e-9) ends.push([x, y]); });
    if (!ends.length) return null;
    const e = ends.sort((p, q) => q[1] - p[1] || q[0] - p[0])[0];
    if (Math.abs(e[1] - ymax) < 1e-6) return L.a >= 0 ? [e[0], e[1], 1, 2.6, 'start'] : [e[0], e[1], -1, 2.6, 'end'];
    return Math.abs(e[0] - xmax) < 1e-6 ? [e[0], e[1], -0.6, -1.2, 'end'] : [e[0], e[1], 0.6, -1.2, 'start'];
  }
  let svgN = 0;
  function figCoord(f, W, H) {
    const xmin = num(f.xmin, -5), xmax = Math.max(xmin + 1, num(f.xmax, 5));
    const ymin = num(f.ymin, -5), ymax = Math.max(ymin + 1, num(f.ymax, 5));
    const cap = f.caption ? 4.2 : 0, padL = 4.8, padR = 5.6, padT = 5 + cap, padB = 4.2;
    const u = Math.max(1, Math.min((W - padL - padR) / (xmax - xmin), (H - padT - padB) / (ymax - ymin), num(f.maxUnit, 9)));
    const gw = u * (xmax - xmin), gh = u * (ymax - ymin);
    const x0 = padL + Math.max(0, (W - padL - padR - gw) / 2), y0 = padT + Math.max(0, (H - padT - padB - gh) / 2);
    const X = x => x0 + (x - xmin) * u, Y = y => y0 + (ymax - y) * u;
    let s = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) s += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    if (f.grid !== false) {
      for (let x = Math.ceil(xmin); x <= xmax + 1e-9; x++) s += ln(X(x), Y(ymax), X(x), Y(ymin), '#b3c1cf', 0.13);
      for (let y = Math.ceil(ymin); y <= ymax + 1e-9; y++) s += ln(X(xmin), Y(y), X(xmax), Y(y), '#b3c1cf', 0.13);
    }
    const ax = xmin <= 0 && xmax >= 0 ? X(0) : X(xmin), ay = ymin <= 0 && ymax >= 0 ? Y(0) : Y(ymin);
    s += ln(X(xmin) - 1.2, ay, X(xmax) + 2.4, ay, '#222', 0.28) + head(X(xmax) + 3.4, ay, 'r', '#222', 0.75);
    s += ln(ax, Y(ymin) + 1.2, ax, Y(ymax) - 2.4, '#222', 0.28) + head(ax, Y(ymax) - 3.4, 'u', '#222', 0.75);
    s += tx(X(xmax) + 3.6, ay + 3.6, '<tspan class="sv">x</tspan>', 3.3);
    s += tx(ax - 2.2, Y(ymax) - 2.2, '<tspan class="sv">y</tspan>', 3.3);
    if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) s += tx(ax - 1.5, ay + 2.9, '<tspan class="sv">O</tspan>', 2.6);
    const st = Math.max(0.5, num(f.step, u >= 4.2 ? 1 : u >= 2.4 ? 2 : 5));
    const fs = Math.min(2.5, Math.max(1.8, u * 0.45));
    for (let x = Math.ceil(xmin / st) * st; x <= xmax + 1e-9; x += st) if (Math.abs(x) > 1e-9) s += tx(X(x), ay + fs + 0.9, numLabel(x), fs);
    for (let y = Math.ceil(ymin / st) * st; y <= ymax + 1e-9; y += st) if (Math.abs(y) > 1e-9) s += tx(ax - 0.9, Y(y) + fs * 0.36, numLabel(y), fs, 'end');
    // 線をかく。glines＝いつも印刷する線、lines＝答えの線（linesGiven なら印刷する）
    const drawLines = (lines, given) => {
      if (!lines.length) return '';
      const col = given ? '#222' : '#d62828', cid = 'wsclip' + (++svgN);
      let gs = '', lab = '';
      lines.forEach(L => {
        if (L.kind === 'vert') {
          if (L.h >= xmin && L.h <= xmax) { gs += ln(X(L.h), Y(ymin), X(L.h), Y(ymax), col, 0.34); if (L.label) lab += tx(X(L.h) + 1, Y(ymax) + 2.6, svgMath(prettyEq(L.label)), 2.5, 'start', ` fill="${col}"`); }
          return;
        }
        const p0 = L.dom ? Math.max(xmin, L.dom[0]) : xmin, p1 = L.dom ? Math.min(xmax, L.dom[1]) : xmax;
        if (p1 < p0) return;
        const fy = x => L.kind === 'lin' ? L.a * x + L.b : L.kind === 'quad' ? L.a * x * x : L.a / x;
        if (L.kind === 'lin') gs += ln(X(p0), Y(fy(p0)), X(p1), Y(fy(p1)), col, 0.34);
        else if (L.kind === 'quad') {
          const pts = [];
          for (let i = 0; i <= 120; i++) { const x = p0 + (p1 - p0) * i / 120; pts.push([X(x), Y(fy(x))]); }
          gs += `<polyline points="${pts.map(v => v.map(f2).join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="0.34"/>`;
        } else [[p0, Math.min(p1, -0.01)], [Math.max(p0, 0.01), p1]].forEach(([p, q]) => {
          if (q <= p) return;
          const pts = [];
          for (let i = 0; i <= 90; i++) { const x = p + (q - p) * i / 90; pts.push([X(x), Y(L.a / x)]); }
          gs += `<polyline points="${pts.map(v => v.map(f2).join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="0.34"/>`;
        });
        if (L.dom) [p0, p1].forEach(x => { if (L.kind !== 'inv' || Math.abs(x) > 1e-9) gs += `<circle cx="${f2(X(x))}" cy="${f2(Y(fy(x)))}" r="0.6" fill="${col}"/>`; });
        const at = L.label ? lineLabelAt(L, xmin, xmax, ymin, ymax) : null;
        if (at) lab += tx(X(at[0]) + at[2], Y(at[1]) + at[3], svgMath(prettyEq(L.label)), 2.5, at[4], ` fill="${col}"`);
      });
      return `<defs><clipPath id="${cid}"><rect x="${f2(X(xmin))}" y="${f2(Y(ymax))}" width="${f2(gw)}" height="${f2(gh)}"/></clipPath></defs>`
        + `<g${given ? '' : ' class="ansx"'}><g clip-path="url(#${cid})">${gs}</g>${lab}</g>`;
    };
    s += drawLines(parseLines(f.glines), true) + drawLines(parseLines(f.lines), !!f.linesGiven);
    const pth = parsePoints(f.path);   // 折れ線（点を線分でつないだもの。はじめから印刷する）
    if (pth.length > 1) s += `<polyline points="${pth.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="#222" stroke-width="0.32"/>` + pth.map(p => `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="0.6" fill="#222"/>`).join('');
    // 答えの折れ線（解答例のときだけ赤で出る。直角三角形をかきこむときなど）。「;」か改行で区切ると、いくつもかける。Q(2,1) のように名前をつけた点には名前も出る
    String(f.apath || '').split(/\n|;|；/).forEach(t => {
      const q = parsePoints(t); if (q.length < 2) return;
      s += `<g class="ansx"><polyline points="${q.map(v => f2(X(v[0])) + ',' + f2(Y(v[1]))).join(' ')}" fill="none" stroke="#d62828" stroke-width="0.34"/>`
        + q.filter(v => v[2]).map(v => `<circle cx="${f2(X(v[0]))}" cy="${f2(Y(v[1]))}" r="0.55" fill="#d62828"/>` + tx(X(v[0]) + 1.1, Y(v[1]) + 3.3, plab(v[2]), 3.1, 'start', ' class="pl" fill="#d62828"')).join('') + '</g>';
    });
    // gpoints＝はじめから印刷する点（名前つき）。points は答えの点（pointsGiven なら印刷）
    const gp = parsePoints(f.gpoints).filter(([x, y]) => x >= xmin && x <= xmax && y >= ymin && y <= ymax);
    if (gp.length) s += gp.map(([x, y, n]) => `<circle cx="${f2(X(x))}" cy="${f2(Y(y))}" r="0.62" fill="#222"/>` + (n ? tx(X(x) + 1.1, Y(y) - 1.1, plab(n), 3.1, 'start', ' class="pl"') : '')).join('');
    const pts = parsePoints(f.points).filter(([x, y]) => x >= xmin && x <= xmax && y >= ymin && y <= ymax);
    const pc = f.pointsGiven ? '#222' : '#d62828';
    if (pts.length) s += `<g${f.pointsGiven ? '' : ' class="ansx"'}>${pts.map(([x, y, n]) => `<circle cx="${f2(X(x))}" cy="${f2(Y(y))}" r="0.62" fill="${pc}"/>` + (n ? tx(X(x) + 1.1, Y(y) - 1.1, plab(n), 3.1, 'start', ` class="pl" fill="${pc}"`) : '')).join('')}</g>`;
    return s;
  }
  function parseArrows(s) {
    return String(s || '').split(/\n|;|；/).map(t => t.trim()).filter(Boolean).map(t => {
      const m = t.replace(/[−–]/g, '-').match(/^([+-]?\d*\.?\d+)\s*(?:→|->|⇒|>|~|〜)\s*([+-]?\d*\.?\d+)\s*(.*)$/);
      return m ? { from: parseFloat(m[1]), to: parseFloat(m[2]), label: m[3].trim().replace(/-/g, '−') } : null;
    }).filter(Boolean);
  }
  function figNumline(f, W, H) {
    const min = num(f.min, -10), max = Math.max(min + 1, num(f.max, 10)), lab = Math.max(1, num(f.label, 5)), step = Math.max(0.1, num(f.tick, 1));
    const cap = f.caption ? 3.8 : 0, padL = 2.6, padR = 5.6;
    const u = (W - padL - padR) / (max - min), X = x => padL + (x - min) * u;
    const ly = Math.min(H - 4.6, Math.max(cap + 6.4, H * 0.6));
    let s = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) s += tx(0.5, 3.2, svgMath(f.caption), 2.8, 'start');
    s += ln(X(min) - 1.6, ly, X(max) + 2.6, ly, '#222', 0.28) + head(X(max) + 3.8, ly, 'r', '#222', 0.7);
    const lmin = num(f.lblMin, -Infinity);   // これより小さい目もりの数字は空欄（解答例で赤）
    let a = '';
    for (let i = 0; min + i * step <= max + 1e-9; i++) {
      const x = min + i * step, major = Math.abs(Math.round(x / lab) * lab - x) < 1e-9;
      s += ln(X(x), ly - (major ? 1.3 : 0.8), X(x), ly + (major ? 1.3 : 0.8), '#222', major ? 0.24 : 0.17);
      if (major) { if (x >= lmin - 1e-9) s += tx(X(x), ly + 3.9, numLabel(x), 2.4); else a += tx(X(x), ly + 3.9, numLabel(x), 2.4, 'middle', ' fill="#d62828"'); }
    }
    // 名前のついた点（印刷する）：「A 2.5, B -1.5」
    String(f.pts || '').split(/[,、，]/).map(t => t.trim()).filter(Boolean).forEach(t => {
      const m = t.split(/\s+/), x = num(m[1], NaN); if (!isFinite(x)) return;
      s += `<circle cx="${f2(X(x))}" cy="${f2(ly)}" r="0.6" fill="#222"/>` + tx(X(x), ly - 2.3, plab(m[0]), 3, 'middle', ' class="pl"');
    });
    // 答えの点（解答例）：「4.5 1.5 -3」または「+3/2@1.5」
    String(f.dots || '').split(/[\s,、，]+/).filter(Boolean).forEach(t => {
      const [lb, v] = t.indexOf('@') >= 0 ? t.split('@') : [null, t], x = num(v, NaN); if (!isFinite(x)) return;
      a += `<circle cx="${f2(X(x))}" cy="${f2(ly)}" r="0.65" fill="#d62828"/>` + tx(X(x), ly - 2.2, esc(lb || ((x > 0 ? '+' : '') + numLabel(x))), 2.4, 'middle', ' fill="#d62828"');
    });
    parseArrows(f.arrows).forEach((r, i) => {
      const yy = ly - 2.8 - i * 2.6, x1 = X(r.from), x2 = X(r.to), dir = x2 >= x1 ? 1 : -1;
      a += `<circle cx="${f2(x1)}" cy="${f2(ly)}" r="0.55" fill="#d62828"/>` + ln(x1, ly, x1, yy, '#d62828', 0.18, ' stroke-dasharray="0.6 0.5"');
      a += ln(x1, yy, x2 - dir * 1.1, yy, '#d62828', 0.3) + head(x2, yy, dir > 0 ? 'r' : 'l', '#d62828', 0.62);
      if (r.label) a += tx((x1 + x2) / 2, yy - 0.8, esc(r.label), 2.4, 'middle', ' fill="#d62828"');
    });
    String(f.marks || '').replace(/[−–]/g, '-').split(/[\s,、，]+/).map(parseFloat).filter(isFinite).forEach(v => {
      a += `<circle cx="${f2(X(v))}" cy="${f2(ly + 3.05)}" r="1.95" fill="#fff" stroke="#d62828" stroke-width="0.26"/>` + tx(X(v), ly + 3.9, (v > 0 ? '+' : '') + numLabel(v), 2.2, 'middle', ' fill="#d62828"');
    });
    return a ? s + `<g class="ansx">${a}</g>` : s;
  }
  function figImage(f, W, H) {
    if (!f.src) return `<rect x="0.4" y="0.4" width="${f2(W - 0.8)}" height="${f2(H - 0.8)}" fill="#fff" stroke="#b8b8b8" stroke-width="0.25" stroke-dasharray="1.2 1"/>` + tx(W / 2, H / 2 + 1, '（画像を選ぶとここに入ります）', 3, 'middle', ' fill="#999" class="noprint"');
    return `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/><image href="${esc(f.src)}" x="0" y="0" width="${f2(W)}" height="${f2(H)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  /* ---- 図形（自由にかく）：1行に1つ「点 A 0 0」「線分 A B」…と書く。行の先頭に * で解答例（赤） ---- */
  const GEO_CMD = { '点': 'pt', pt: 'pt', '頂点': 'v', v: 'v', '線分': 'seg', seg: 'seg', '直線': 'line', line: 'line', '半直線': 'ray', ray: 'ray',
    '多角形': 'poly', poly: 'poly', '折れ線': 'path', path: 'path', '円': 'circle', circle: 'circle', '弧': 'arc', arc: 'arc',
    'おうぎ形': 'sector', sector: 'sector', 'だ円': 'ellipse', '楕円': 'ellipse', ellipse: 'ellipse', '角': 'angle', angle: 'angle', '直角': 'right', right: 'right', '印': 'tick', tick: 'tick',
    '文字': 'text', text: 'text', '長さ': 'len', len: 'len', '矢印': 'arrow', arrow: 'arrow', '方眼': 'grid', grid: 'grid',
    '点格子': 'lattice', lattice: 'lattice', '範囲': 'view', view: 'view', '縮尺': 'scale', scale: 'scale' };
  const GEO_FLAG = { '点線': 'dash', dash: 'dash', '太': 'bold', '太線': 'bold', bold: 'bold', '細': 'thin', '細線': 'thin', thin: 'thin',
    '塗り': 'fill', fill: 'fill', '非表示': 'hide', hide: 'hide', '名前なし': 'nolabel', nolabel: 'nolabel', '二重': 'double', double: 'double', '灰': 'gray', gray: 'gray', '大': 'big', big: 'big', '●': 'dot', dot: 'dot' };
  const GEO_DIR = { '上': [0, 1], '下': [0, -1], '左': [-1, 0], '右': [1, 0], '左上': [-0.72, 0.72], '右上': [0.72, 0.72], '左下': [-0.72, -0.72], '右下': [0.72, -0.72] };
  function parseGeo(src) {
    const P = {}, items = [], opt = { view: null, scale: null, grid: 0, lattice: 0 };
    String(src || '').split('\n').forEach(raw => {
      let t = raw.trim(); if (!t || t[0] === '#') return;
      let ans = false; if (t[0] === '*' || t[0] === '＊') { ans = true; t = t.slice(1).trim(); }
      const tok = t.split(/[\s　]+/), cmd = GEO_CMD[tok[0]]; if (!cmd) return;
      const flags = {}, args = []; let dir = null;
      tok.slice(1).forEach(x => { if (GEO_FLAG[x]) flags[GEO_FLAG[x]] = true; else if (GEO_DIR[x]) dir = GEO_DIR[x]; else args.push(x); });
      if (cmd === 'pt' || cmd === 'v') {
        const [name, p1, p2, p3, p4] = args; if (!name) return;
        let x, y;
        if (p1 === '中点' || p1 === 'mid') { const A = P[p2], B = P[p3]; if (!A || !B) return; x = (A.x + B.x) / 2; y = (A.y + B.y) / 2; }
        else if (p1 === '極' || p1 === 'polar') { const O = P[p2]; if (!O) return; const r = num(p3, 1), a = num(p4, 0) * Math.PI / 180; x = O.x + r * Math.cos(a); y = O.y + r * Math.sin(a); }
        else { x = num(p1, NaN); y = num(p2, NaN); if (!isFinite(x) || !isFinite(y)) return; }
        P[name] = { x, y, dot: cmd === 'pt' && !flags.hide, force: !!flags.dot, label: !flags.hide && !flags.nolabel, dir, ans, name };
        return;
      }
      if (cmd === 'view') { const v = args.map(z => num(z, NaN)); if (v.length === 4 && v.every(isFinite)) opt.view = v; return; }
      if (cmd === 'scale') { opt.scale = num(args[0], null); return; }
      if (cmd === 'grid') { opt.grid = Math.max(0.1, num(args[0], 1)); return; }
      if (cmd === 'lattice') { opt.lattice = Math.max(0.1, num(args[0], 1)); return; }
      items.push({ cmd, args, flags, dir, ans });
    });
    return { P, items, opt };
  }
  function arrowHead(x, y, ang, c, s) {   // ang：画面上の向き（ラジアン）
    const a = s * 1.7, b = s * 0.75, ca = Math.cos(ang), sa = Math.sin(ang);
    const p = [[x, y], [x - a * ca + b * sa, y - a * sa - b * ca], [x - a * ca - b * sa, y - a * sa + b * ca]];
    return `<polygon points="${p.map(q => q.map(f2).join(',')).join(' ')}" fill="${c}"/>`;
  }
  const plab = n => esc(String(n).replace(/_.*$/, '').replace(/'/g, '′'));   // A_2 は「A」と表示（展開図で同じ名前を2か所に書くとき）
  function figGeo(f, W, H) {
    const G = parseGeo(f.src), P = G.P, pts = Object.values(P);
    const cap = f.caption ? 4.2 : 0, pad = 5;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (x, y) => { if (!isFinite(x) || !isFinite(y)) return; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    pts.forEach(p => add(p.x, p.y));
    G.items.forEach(it => {
      if (it.cmd === 'circle' || it.cmd === 'arc' || it.cmd === 'sector') {
        const O = P[it.args[0]], r = num(it.args[1], 0); if (!O) return;
        const a1 = it.cmd === 'circle' ? 0 : num(it.args[2], 0), a2 = it.cmd === 'circle' ? 360 : num(it.args[3], 360);
        for (let k = 0; k <= 36; k++) { const a = (a1 + (a2 - a1) * k / 36) * Math.PI / 180; add(O.x + r * Math.cos(a), O.y + r * Math.sin(a)); }
        if (it.cmd === 'sector') add(O.x, O.y);
      }
      if (it.cmd === 'ellipse') {
        const O = P[it.args[0]], rx = num(it.args[1], 0), ry = num(it.args[2], 0); if (!O) return;
        for (let k = 0; k <= 36; k++) { const a = k / 36 * 2 * Math.PI; add(O.x + rx * Math.cos(a), O.y + ry * Math.sin(a)); }
      }
      if (it.cmd === 'text' && !P[it.args[0]]) add(num(it.args[0], NaN), num(it.args[1], NaN));
    });
    if (G.opt.view) [x0, y0, x1, y1] = G.opt.view;
    if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 10; y1 = 10; }
    const bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
    let padL = pad, padR = pad, padT = pad, padB = pad, u = 5, ox = 0, oy = 0;
    const fit = () => {
      const aw = W - padL - padR, ah = H - padT - padB - cap;
      u = G.opt.scale || Math.min(aw / bw, ah / bh);
      if (!isFinite(u) || u <= 0) u = 5;
      ox = padL + (aw - bw * u) / 2 - x0 * u; oy = padT + cap + (ah - bh * u) / 2 + y1 * u;
    };
    fit();
    const X = x => ox + x * u, Y = y => oy - y * u;
    /* 点に ● をかくかどうか（この教材の図のきまり）：向きのちがう線が2本以上集まる点（頂点・交点）と線の端にはかかない。
       線の途中の点・どの線にものっていない点・円の中心にはかく。「●」をつけた点はかならずかく。問題の点は、解答だけの線では変えない */
    const tol = Math.max(bw, bh) * 0.004 + 1e-9;
    const needDot = p => {
      const out = []; let center = false;
      const push = (dx, dy) => out.push((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360);
      const onSeg = (a, b, inf0, inf1) => {   // inf0・inf1：その端の先へものびている（直線・半直線）
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy); if (l < 1e-9) return;
        let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (l * l);
        if (!inf0) t = Math.max(0, t);
        if (!inf1) t = Math.min(1, t);
        if (Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t) > tol) return;
        if (inf0 || t * l > tol) push(-dx, -dy);
        if (inf1 || (1 - t) * l > tol) push(dx, dy);
      };
      G.items.forEach(it => {
        if (it.ans && !p.ans) return;
        const q = it.args.map(k => P[k]);
        if (it.cmd === 'seg' || it.cmd === 'arrow') { if (q[0] && q[1]) onSeg(q[0], q[1]); }
        else if (it.cmd === 'line') { if (q[0] && q[1]) onSeg(q[0], q[1], true, true); }
        else if (it.cmd === 'ray') { if (q[0] && q[1]) onSeg(q[0], q[1], false, true); }
        else if (it.cmd === 'poly' || it.cmd === 'path') { const ps = q.filter(Boolean); for (let i = 0; i + 1 < ps.length; i++) onSeg(ps[i], ps[i + 1]); if (it.cmd === 'poly' && ps.length > 2) onSeg(ps[ps.length - 1], ps[0]); }
        else if (it.cmd === 'circle' || it.cmd === 'arc' || it.cmd === 'sector') {
          const O = q[0]; if (!O) return;
          const r = num(it.args[1], 1), vx = p.x - O.x, vy = p.y - O.y, d = Math.hypot(vx, vy);
          const a0 = it.cmd === 'circle' ? 0 : num(it.args[2], 0), a1 = it.cmd === 'circle' ? 360 : num(it.args[3], 90);
          if (d < tol) center = true;
          else if (Math.abs(d - r) < tol) { const t = ((Math.atan2(vy, vx) * 180 / Math.PI - a0) % 360 + 360) % 360, sp = ((a1 - a0) % 360 + 360) % 360 || 360; if (it.cmd === 'circle' || t <= sp + 1 || t >= 359) { push(-vy, vx); push(vy, -vx); } }
          if (it.cmd === 'sector') [a0, a1].forEach(t => onSeg(O, { x: O.x + r * Math.cos(t * Math.PI / 180), y: O.y + r * Math.sin(t * Math.PI / 180) }));
        }
      });
      const diff = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
      for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) { const d = diff(out[i], out[j]); if (d > 5 && d < 168) return false; }
      if (center) return true;
      if (out.length && out.every(a => diff(a, out[0]) <= 5)) return false;
      return true;
    };
    pts.forEach(p => { if (p.dot && !p.force) p.dot = needDot(p); });
    const vis = pts.filter(p => p.label || p.dot);
    const cx = vis.length ? vis.reduce((a, p) => a + p.x, 0) / vis.length : (x0 + x1) / 2;
    const cy = vis.length ? vis.reduce((a, p) => a + p.y, 0) / vis.length : (y0 + y1) / 2;
    const unit2 = (A, B) => { const dx = X(B.x) - X(A.x), dy = Y(B.y) - Y(A.y), L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
    const out2 = (mx, my) => { const dx = mx - X(cx), dy = my - Y(cy), L = Math.hypot(dx, dy); return L < 1e-6 ? [0.7, -0.7] : [dx / L, dy / L]; };
    /* 長さ（この教材の図のきまり）：線分の両はしを点線の弧でむすび、弧のまん中に字を書く。
       線分が短くて字が入らないときは、小さな弧をかいて、その外側に字を書く。「大」をつけると弧を大きくふくらませる（ほかの弧や字をよけたいとき） */
    const dimGeom = it => {
      const A = P[it.args[0]], B = P[it.args[1]], s = it.args.slice(2).join(' ');
      const ax = X(A.x), ay = Y(A.y), bx = X(B.x), by = Y(B.y), mx = (ax + bx) / 2, my = (ay + by) / 2;
      const L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
      let nx = -uy, ny = ux; const o = it.dir ? [it.dir[0], -it.dir[1]] : out2(mx, my); if (nx * o[0] + ny * o[1] < 0) { nx = -nx; ny = -ny; }
      const fs = 2.9, hw = emOf(String(s).replace(/\\/g, '')) * fs / 2, hh = fs / 2, hn = Math.abs(nx) * hw + Math.abs(ny) * hh, hmin = hn + 0.85;
      const e = Math.min(Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : 1e9) + 0.6;   // 弧の上で字のために空ける長さ（片側）
      let h = Math.max(hmin, it.flags.big ? Math.max(hmin + 3, 0.3 * L) : Math.min(4.1, 0.18 * L + 0.85)), full = false;
      if (e > L / 2 - 1.05 || hmin > 0.5 * L) { full = true; h = Math.min(2.1, Math.max(1.05, 0.2 * L)); } else h = Math.min(h, 0.5 * L);
      const R = (L * L / 4 + h * h) / (2 * h), p0 = Math.asin(Math.min(1, L / 2 / R)), ccx = mx + nx * (h - R), ccy = my + ny * (h - R);
      const at = t => { const ph = p0 * t; return [ccx + R * (nx * Math.cos(ph) + ux * Math.sin(ph)), ccy + R * (ny * Math.cos(ph) + uy * Math.sin(ph))]; };
      const tc = full ? [mx + nx * (h + hn + 0.65), my + ny * (h + hn + 0.65)] : [mx + nx * h, my + ny * h];
      return { s, ax, ay, bx, by, R, at, full, tc, hw, hh, fs, sw: (-uy * nx + ux * ny) >= 0 ? 0 : 1, tg: full ? 0 : Math.min(0.92, Math.asin(Math.min(1, e / R)) / p0) };
    };
    // 長さの字が図のわくからはみ出すときは、その分だけ余白を広げて、図を少し小さくする（縮尺を決めた図は変えない）
    const dimItems = G.items.filter(it => (it.cmd === 'len' || (it.cmd === 'seg' && it.args[2])) && P[it.args[0]] && P[it.args[1]]);
    if (!G.opt.scale) for (let k = 0; k < 3 && dimItems.length; k++) {
      let oL = 0, oR = 0, oT = 0, oB = 0;
      dimItems.forEach(it => { const g = dimGeom(it); oL = Math.max(oL, 0.8 - (g.tc[0] - g.hw)); oR = Math.max(oR, g.tc[0] + g.hw - (W - 0.8)); oT = Math.max(oT, cap + 0.8 - (g.tc[1] - g.hh)); oB = Math.max(oB, g.tc[1] + g.hh - (H - 0.8)); });
      if (oL + oR + oT + oB < 0.05) break;
      padL += oL; padR += oR; padT += oT; padB += oB; fit();
    }
    const arcPath = (O, r, a1, a2) => { const p = a => [X(O.x + r * Math.cos(a * Math.PI / 180)), Y(O.y + r * Math.sin(a * Math.PI / 180))], s = p(a1), e = p(a2), d = ((a2 - a1) % 360 + 360) % 360; return `M${f2(s[0])},${f2(s[1])} A${f2(r * u)},${f2(r * u)} 0 ${d > 180 ? 1 : 0} 0 ${f2(e[0])},${f2(e[1])}`; };
    const cid = 'wsgeo' + (++svgN);
    let base = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`, fills = '', lines = '', marks = '', tops = '', ans = '';
    if (f.caption) base += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    if (G.opt.grid) { const s = G.opt.grid; for (let x = Math.ceil(x0 / s - 1e-9) * s; x <= x1 + 1e-9; x += s) base += ln(X(x), Y(y0), X(x), Y(y1), '#c3ccd6', 0.14); for (let y = Math.ceil(y0 / s - 1e-9) * s; y <= y1 + 1e-9; y += s) base += ln(X(x0), Y(y), X(x1), Y(y), '#c3ccd6', 0.14); }
    if (G.opt.lattice) { const s = G.opt.lattice; for (let x = Math.ceil(x0 / s - 1e-9) * s; x <= x1 + 1e-9; x += s) for (let y = Math.ceil(y0 / s - 1e-9) * s; y <= y1 + 1e-9; y += s) base += `<circle cx="${f2(X(x))}" cy="${f2(Y(y))}" r="0.45" fill="#555"/>`; }
    const put = (it, layer, str) => { if (it.ans) ans += str; else if (layer === 'f') fills += str; else if (layer === 'm') marks += str; else if (layer === 't') tops += str; else lines += str; };
    const col = it => it.ans ? '#d62828' : it.flags.gray ? '#8a939c' : '#222';
    const stk = it => `stroke="${col(it)}" stroke-width="${it.flags.bold ? 0.5 : it.flags.thin ? 0.18 : 0.3}"${it.flags.dash ? ' stroke-dasharray="1.3 0.9"' : ''} stroke-linejoin="round"`;
    const fillOf = it => it.flags.fill ? (it.ans ? 'rgba(214,40,40,.16)' : '#e4e8ec') : 'none';
    const labelAt = (x, y, dir, text, size, color, cls) => {   // 点の名前など：dir があればその向き、なければ図の外側へ
      const d = dir ? [dir[0], -dir[1]] : out2(x, y), off = 2.7;
      return tx(x + d[0] * off, y + d[1] * off + size * 0.36, text, size, Math.abs(d[0]) < 0.3 ? 'middle' : d[0] > 0 ? 'start' : 'end', `${cls ? ` class="${cls}"` : ''}${color ? ` fill="${color}"` : ''}`);
    };
    const dimSVG = it => {
      const g = dimGeom(it), c = col(it);
      const arc = (p, q, f) => `<path d="M${f2(p[0])},${f2(p[1])} A${f2(g.R)},${f2(g.R)} 0 0 ${f} ${f2(q[0])},${f2(q[1])}" fill="none" stroke="${c}" stroke-width="0.24" stroke-dasharray="0.5 0.55"/>`;
      const arcs = g.full ? arc([g.ax, g.ay], [g.bx, g.by], g.sw) : arc([g.ax, g.ay], g.at(-g.tg), g.sw) + arc([g.bx, g.by], g.at(g.tg), 1 - g.sw);
      return arcs + tx(g.tc[0], g.tc[1] + g.fs * 0.36, svgMath(g.s), g.fs, 'middle', c === '#222' ? '' : ` fill="${c}"`);
    };
    G.items.forEach(it => {
      const a = it.args, A = P[a[0]], B = P[a[1]], L = (bw + bh) * 4 + 200 / u;
      switch (it.cmd) {
        case 'seg': if (A && B) { put(it, 'l', ln(X(A.x), Y(A.y), X(B.x), Y(B.y), '', 0).replace(/ stroke="" stroke-width="0"/, ' ' + stk(it))); if (a[2]) put(it, 't', dimSVG(it)); } break;
        case 'line': case 'ray': if (A && B) { const d = [B.x - A.x, B.y - A.y], n = Math.hypot(d[0], d[1]) || 1, s0 = it.cmd === 'line' ? -L : 0; put(it, 'l', `<line x1="${f2(X(A.x + d[0] / n * s0))}" y1="${f2(Y(A.y + d[1] / n * s0))}" x2="${f2(X(A.x + d[0] / n * L))}" y2="${f2(Y(A.y + d[1] / n * L))}" ${stk(it)} clip-path="url(#${cid})"/>`); } break;
        case 'poly': case 'path': { const ps = a.map(k => P[k]).filter(Boolean); if (ps.length >= 2) { const el = it.cmd === 'poly' ? 'polygon' : 'polyline'; const str = `<${el} points="${ps.map(p => f2(X(p.x)) + ',' + f2(Y(p.y))).join(' ')}" fill="${it.cmd === 'poly' ? fillOf(it) : 'none'}" ${stk(it)}/>`; put(it, it.flags.fill && !it.ans ? 'f' : 'l', str); } } break;
        case 'circle': if (A) { const r = num(a[1], 1); put(it, it.flags.fill && !it.ans ? 'f' : 'l', `<circle cx="${f2(X(A.x))}" cy="${f2(Y(A.y))}" r="${f2(r * u)}" fill="${fillOf(it)}" ${stk(it)}/>`); } break;
        case 'arc': if (A) put(it, 'l', `<path d="${arcPath(A, num(a[1], 1), num(a[2], 0), num(a[3], 90))}" fill="none" ${stk(it)}/>`); break;
        case 'ellipse': if (A) {   // だ円 O 横の半径 縦の半径 [はじめの角 おわりの角]（角をかけば一部だけ）
          const rx = num(a[1], 1), ry = num(a[2], rx / 3), part = a.length >= 5, a1 = part ? num(a[3], 0) : 0, a2 = part ? num(a[4], 360) : 360;
          const pt2 = t => [X(A.x + rx * Math.cos(t * Math.PI / 180)), Y(A.y + ry * Math.sin(t * Math.PI / 180))];
          let str;
          if (!part || Math.abs(a2 - a1) >= 360) str = `<ellipse cx="${f2(X(A.x))}" cy="${f2(Y(A.y))}" rx="${f2(rx * u)}" ry="${f2(ry * u)}" fill="${fillOf(it)}" ${stk(it)}/>`;
          else { const s0 = pt2(a1), e0 = pt2(a2), d = ((a2 - a1) % 360 + 360) % 360; str = `<path d="M${f2(s0[0])},${f2(s0[1])} A${f2(rx * u)},${f2(ry * u)} 0 ${d > 180 ? 1 : 0} 0 ${f2(e0[0])},${f2(e0[1])}" fill="none" ${stk(it)}/>`; }
          put(it, it.flags.fill && !it.ans && !part ? 'f' : 'l', str); } break;
        case 'sector': if (A) { const r = num(a[1], 1), a1 = num(a[2], 0), a2 = num(a[3], 90); put(it, it.flags.fill && !it.ans ? 'f' : 'l', `<path d="M${f2(X(A.x))},${f2(Y(A.y))} L${arcPath(A, r, a1, a2).slice(1)} Z" fill="${fillOf(it)}" ${stk(it)}/>`); } break;
        case 'arrow': if (A && B) { const d = unit2(A, B), bx = X(B.x) - d[0] * 1.1, by = Y(B.y) - d[1] * 1.1; put(it, 'l', `<line x1="${f2(X(A.x))}" y1="${f2(Y(A.y))}" x2="${f2(bx)}" y2="${f2(by)}" ${stk(it)}/>` + arrowHead(X(B.x), Y(B.y), Math.atan2(d[1], d[0]), col(it), 0.7)); } break;
        case 'angle': { const Bp = P[a[0]], Ap = P[a[1]], Cp = P[a[2]]; if (!Bp || !Ap || !Cp) break;
          const t1 = Math.atan2(Bp.y - Ap.y, Bp.x - Ap.x), t2 = Math.atan2(Cp.y - Ap.y, Cp.x - Ap.x); let d = t2 - t1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
          const s0 = d >= 0 ? t1 : t2, sw = Math.abs(d), ax = X(Ap.x), ay = Y(Ap.y), c = col(it);
          const arc = rr => `<path d="M${f2(ax + rr * Math.cos(s0))},${f2(ay - rr * Math.sin(s0))} A${rr},${rr} 0 0 0 ${f2(ax + rr * Math.cos(s0 + sw))},${f2(ay - rr * Math.sin(s0 + sw))}" fill="none" stroke="${c}" stroke-width="0.26"/>`;
          let str = arc(3.2) + (it.flags.double ? arc(4.1) : '');
          const lab = a.slice(3).join(' ');
          if (lab && it.dir) {   // 向きを書いたとき：角の中に入らない角度を、弧の印のそばの図の外側に書く
            const w2 = emOf(lab.replace(/\\/g, '').replace(/°/g, "'")) * 2.7 / 2, dv = [it.dir[0], -it.dir[1]], rr = 3.4 + w2 * Math.abs(dv[0]) + 1.1 * Math.abs(dv[1]);
            str += tx(ax + dv[0] * rr, ay + dv[1] * rr + 1, svgMath(lab), 2.7, 'middle', it.ans ? ' fill="#d62828"' : '');
          } else if (lab) {   // 角がせまいときは、字が2辺にかぶらないところまで頂点からはなす
            const m = s0 + sw / 2, w2 = emOf(lab.replace(/\\/g, '').replace(/°/g, "'")) * 2.7 / 2, h2 = 1.1, cm = Math.abs(Math.cos(m)), sm = Math.abs(Math.sin(m));
            const need = w2 * cm + h2 * sm + (w2 * sm + h2 * cm + 0.4) / Math.tan(Math.min(sw, 3.1) / 2);
            const rr = Math.min(16, Math.max(it.flags.double ? 6.9 : 6.1, need));
            str += tx(ax + rr * Math.cos(m), ay - rr * Math.sin(m) + 1, svgMath(lab), 2.7, 'middle', it.ans ? ' fill="#d62828"' : ''); }
          put(it, 'm', str); } break;
        case 'right': { const Bp = P[a[0]], Ap = P[a[1]], Cp = P[a[2]]; if (!Bp || !Ap || !Cp) break;
          const e1 = unit2(Ap, Bp), e2 = unit2(Ap, Cp), s = 2.3, ax = X(Ap.x), ay = Y(Ap.y);
          put(it, 'm', `<polyline points="${f2(ax + e1[0] * s)},${f2(ay + e1[1] * s)} ${f2(ax + (e1[0] + e2[0]) * s)},${f2(ay + (e1[1] + e2[1]) * s)} ${f2(ax + e2[0] * s)},${f2(ay + e2[1] * s)}" fill="none" stroke="${col(it)}" stroke-width="0.24"/>`); } break;
        case 'tick': if (A && B) { const k = Math.max(1, Math.min(4, Math.round(num(a[2], 1)))), d = unit2(A, B), mx = (X(A.x) + X(B.x)) / 2, my = (Y(A.y) + Y(B.y)) / 2; let str = '';
          for (let i = 0; i < k; i++) { const o = (i - (k - 1) / 2) * 0.9, px = mx + d[0] * o, py = my + d[1] * o; str += ln(px + d[1] * 1.2, py - d[0] * 1.2, px - d[1] * 1.2, py + d[0] * 1.2, col(it), 0.26); }
          put(it, 'm', str); } break;
        case 'len': if (A && B) put(it, 't', dimSVG(it)); break;
        case 'text': { let x, y, rest; if (P[a[0]]) { const p = P[a[0]]; x = X(p.x); y = Y(p.y); rest = a.slice(1); } else { x = X(num(a[0], 0)); y = Y(num(a[1], 0)); rest = a.slice(2); }
          const str = rest.join(' '); if (!str) break;
          if (it.dir || P[a[0]]) put(it, 't', labelAt(x, y, it.dir || [0.72, 0.72], svgMath(str), 2.9, it.ans ? '#d62828' : '', ''));
          else put(it, 't', tx(x, y + 1, svgMath(str), 2.9, 'middle', it.ans ? ' fill="#d62828"' : '')); } break;
      }
    });
    let pl = '', pa = '';
    pts.forEach(p => {
      let str = '';
      if (p.dot) str += `<circle cx="${f2(X(p.x))}" cy="${f2(Y(p.y))}" r="0.55" fill="${p.ans ? '#d62828' : '#222'}"/>`;
      if (p.label) str += labelAt(X(p.x), Y(p.y), p.dir, plab(p.name), 3.2, p.ans ? '#d62828' : '', 'pl');
      if (p.ans) pa += str; else pl += str;
    });
    return `<defs><clipPath id="${cid}"><rect x="0" y="0" width="${f2(W)}" height="${f2(H)}"/></clipPath></defs>${base}${fills}${lines}${marks}${tops}${pl}${(ans || pa) ? `<g class="ansx">${ans}${pa}</g>` : ''}`;
  }

  /* ---- 立体（見取図）：斜めから見た図。見えない辺は点線 ---- */
  function figSolid(f, W, H) {
    const shape = f.shape || 'cube', K = 0.5, PH = 35 * Math.PI / 180, kc = K * Math.cos(PH), ks = K * Math.sin(PH);
    const VIEW = [-kc, 1, -ks], P2 = p => [p[0] + kc * p[1], p[2] + ks * p[1]];
    const a = Math.max(0.1, num(f.a, 4)), b = Math.max(0.1, num(f.b, a)), c = Math.max(0.1, num(f.c, a));
    const n = Math.max(3, Math.min(10, Math.round(num(f.n, shape === 'pyramid' ? 4 : 3))));
    const lt = String(f.labels || '').trim(), labels = !lt ? [] : /\s/.test(lt) ? lt.split(/\s+/) : Array.from(lt);
    const segs = [], curves = [], extra = [];   // 2D（まだ縮尺をかけていない）
    let V2 = [], idx = {};
    const dimLines = String(f.dims || '').split('\n').map(t => t.trim()).filter(Boolean).map(t => { const m = t.split(/[\s　]+/); return { key: m[0], text: m.slice(1).join(' ') }; });
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]], dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    if (['cube', 'cuboid', 'prism', 'pyramid'].includes(shape)) {
      let V = [], F = [];
      if (shape === 'cube' || shape === 'cuboid') {
        const w = a, d = shape === 'cube' ? a : b, h = shape === 'cube' ? a : c;
        V = [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h], [0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0]];
        F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
      } else {
        const R = a / (2 * Math.sin(Math.PI / n)), base = [];
        for (let k = 0; k < n; k++) { const t = (-90 - 180 / n + k * 360 / n) * Math.PI / 180; base.push([R * Math.cos(t), R * Math.sin(t)]); }
        if (shape === 'prism') {
          V = [...base.map(p => [p[0], p[1], c]), ...base.map(p => [p[0], p[1], 0])];
          F = [base.map((_, k) => k), base.map((_, k) => n + k)];
          for (let k = 0; k < n; k++) F.push([k, (k + 1) % n, n + (k + 1) % n, n + k]);
        } else {
          V = [[0, 0, c], ...base.map(p => [p[0], p[1], 0])];
          F = [base.map((_, k) => k + 1)];
          for (let k = 0; k < n; k++) F.push([0, 1 + k, 1 + (k + 1) % n]);
        }
      }
      const cen = V.reduce((s, p) => [s[0] + p[0] / V.length, s[1] + p[1] / V.length, s[2] + p[2] / V.length], [0, 0, 0]);
      const vis = F.map(face => {
        const Q = face.map(i => V[i]); let nx = 0, ny = 0, nz = 0;
        Q.forEach((p, k) => { const q = Q[(k + 1) % Q.length]; nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]); });
        const fc = Q.reduce((s, p) => [s[0] + p[0] / Q.length, s[1] + p[1] / Q.length, s[2] + p[2] / Q.length], [0, 0, 0]);
        let nn = [nx, ny, nz]; if (dot3(nn, sub(fc, cen)) < 0) nn = nn.map(v => -v);
        return dot3(nn, VIEW) < 0;
      });
      const E = new Map();
      F.forEach((face, fi) => face.forEach((v, k) => { const w = face[(k + 1) % face.length], key = Math.min(v, w) + '-' + Math.max(v, w); if (!E.has(key)) E.set(key, { i: Math.min(v, w), j: Math.max(v, w), f: [] }); E.get(key).f.push(fi); }));
      V2 = V.map(P2);
      E.forEach(e => segs.push({ a: V2[e.i], b: V2[e.j], hidden: !e.f.some(fi => vis[fi]) }));
      if (shape === 'pyramid' && labels.length > V2.length) V2.push(P2([0, 0, 0]));   // 角錐で名前を1つ多く書くと、底面の中心の名前になる
      labels.forEach((nm, k) => { if (k < V2.length) idx[nm] = k; });
      if (shape === 'pyramid') { const h0 = P2([0, 0, 0]); dimLines.filter(d => d.key === 'h').forEach(d => { extra.push({ seg: [V2[0], h0], dash: true }); extra.push({ text: d.text, at: [(V2[0][0] + h0[0]) / 2, (V2[0][1] + h0[1]) / 2], dx: 1.2, anchor: 'start' }); }); }
    } else {
      const r = a, h = c, S = (t, z, rr) => P2([(rr || r) * Math.cos(t), (rr || r) * Math.sin(t), z]);
      const arc = (t0, t1, z, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) pts.push(S(t0 + (t1 - t0) * k / 60, z)); curves.push({ pts, hidden }); };
      if (shape === 'cylinder') {
        const t1 = Math.atan(kc);
        arc(t1 - Math.PI, t1, 0, false); arc(t1, t1 + Math.PI, 0, true); arc(0, 2 * Math.PI, h, false);
        segs.push({ a: S(t1, 0), b: S(t1, h), hidden: false }, { a: S(t1 - Math.PI, 0), b: S(t1 - Math.PI, h), hidden: false });
        V2 = [P2([0, 0, h]), P2([0, 0, 0])];
        dimLines.forEach(d => {
          if (d.key === 'r') { extra.push({ seg: [P2([0, 0, h]), S(0, h)], thin: true }); extra.push({ text: d.text, at: [(P2([0, 0, h])[0] + S(0, h)[0]) / 2, P2([0, 0, h])[1]], dy: -1.4, anchor: 'middle' }); }
          if (d.key === 'h') { const p = S(t1, h / 2); extra.push({ text: d.text, at: p, dx: 1.4, anchor: 'start' }); }
        });
      } else if (shape === 'cone') {
        const A2 = P2([0, 0, h]), g = t => h * (Math.sin(t) - kc * Math.cos(t)) - ks * r;
        const bnd = []; const N = 720;
        for (let k = 0; k < N; k++) { const t0 = 2 * Math.PI * k / N, t1 = 2 * Math.PI * (k + 1) / N; if ((g(t0) < 0) !== (g(t1) < 0)) bnd.push((t0 + t1) / 2); }
        let cur = [], curHid = null;
        for (let k = 0; k <= N; k++) { const t = 2 * Math.PI * k / N, hid = g(t) >= 0; if (curHid === null) curHid = hid; if (hid !== curHid) { curves.push({ pts: cur, hidden: curHid }); cur = [cur[cur.length - 1]]; curHid = hid; } cur.push(S(t, 0)); }
        if (cur.length > 1) curves.push({ pts: cur, hidden: curHid });
        bnd.forEach(t => segs.push({ a: A2, b: S(t, 0), hidden: false }));
        V2 = [A2, P2([0, 0, 0])];
        dimLines.forEach(d => {
          if (d.key === 'r') { extra.push({ seg: [P2([0, 0, 0]), S(0, 0)], dash: true }); extra.push({ text: d.text, at: [(P2([0, 0, 0])[0] + S(0, 0)[0]) / 2, P2([0, 0, 0])[1]], dy: 3.4, anchor: 'middle' }); }
          if (d.key === 'h') { extra.push({ seg: [A2, P2([0, 0, 0])], dash: true }); extra.push({ text: d.text, at: [(A2[0] + P2([0, 0, 0])[0]) / 2, (A2[1] + P2([0, 0, 0])[1]) / 2], dx: 1.2, anchor: 'start' }); }
          if (d.key === 'l') { const p = S(bnd[0] || 0, 0); extra.push({ text: d.text, at: [(A2[0] + p[0]) / 2, (A2[1] + p[1]) / 2], dx: 1.4, anchor: 'start' }); }
        });
      } else {   // 球・半球（見取図のならわしで、輪郭は円、赤道はだ円）
        const circ = (t0, t1, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = t0 + (t1 - t0) * k / 60; pts.push([r * Math.cos(t), r * Math.sin(t)]); } curves.push({ pts, hidden }); };
        const ell = (t0, t1, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = t0 + (t1 - t0) * k / 60; pts.push([r * Math.cos(t), 0.28 * r * Math.sin(t)]); } curves.push({ pts, hidden }); };
        if (shape === 'hemisphere') circ(0, Math.PI, false); else circ(0, 2 * Math.PI, false);
        ell(Math.PI, 2 * Math.PI, false); ell(0, Math.PI, true);
        V2 = [[0, 0]];
        dimLines.forEach(d => { if (d.key === 'r') { extra.push({ seg: [[0, 0], [r, 0]], thin: true, dot0: true }); extra.push({ text: d.text, at: [r / 2, 0], dy: -1.4, anchor: 'middle' }); } });
      }
    }
    // 縮尺をきめる
    const all = [...segs.flatMap(s => [s.a, s.b]), ...curves.flatMap(cv => cv.pts), ...V2], real = all.slice();
    if (num(f.fitH, 0) > 0) all.push(P2([0, 0, num(f.fitH, 0)]));   // 2つの立体を同じ縮尺で並べたいとき：高いほうの高さを入れる
    const bx0 = Math.min(...all.map(p => p[0])), bx1 = Math.max(...all.map(p => p[0])), by0 = Math.min(...all.map(p => p[1])), by1 = Math.max(...all.map(p => p[1]));
    const cap = f.caption ? 4.2 : 0, pad = num(f.pad, 6.5), ah = H - 2 * 6.5 - cap;   // pad＝左右の余白（左の辺に長さの字を書くときは、広げる）
    let padR = pad, aw, s, ox;
    for (let k = 0; k < 3; k++) {   // 右はしに出る字（円柱の高さなど）が図からはみ出すときは、右の余白を広げる
      aw = W - pad - padR; s = Math.min(aw / Math.max(bx1 - bx0, 1e-6), ah / Math.max(by1 - by0, 1e-6)); ox = pad + (aw - (bx1 - bx0) * s) / 2 - bx0 * s;
      const over = Math.max(0, ...extra.filter(e => e.text && e.anchor === 'start').map(e => ox + e.at[0] * s + (e.dx || 0) + emOf(String(e.text).replace(/\\/g, '')) * 2.9 + 0.6 - W));
      if (over < 0.05) break;
      padR += over;
    }
    const oy = 6.5 + cap + (ah - (by1 - by0) * s) / 2 + by1 * s;
    const X = p => ox + p[0] * s, Y = p => oy - p[1] * s;
    const cx = X([(Math.min(...real.map(p => p[0])) + Math.max(...real.map(p => p[0]))) / 2, 0]), cy = Y([0, (Math.min(...real.map(p => p[1])) + Math.max(...real.map(p => p[1]))) / 2]);   // 立体そのものの中心（名前や長さの字を外側へ出す向きに使う）
    const showHidden = f.hidden !== 'none';
    let out = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) out += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    const dash = ' stroke-dasharray="1.2 0.9"';
    segs.forEach(sg => { if (sg.hidden && !showHidden) return; out += ln(X(sg.a), Y(sg.a), X(sg.b), Y(sg.b), '#222', sg.hidden ? 0.22 : 0.32, sg.hidden ? dash : ' stroke-linecap="round"'); });
    curves.forEach(cv => { if (cv.hidden && !showHidden) return; out += `<polyline points="${cv.pts.map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="${cv.hidden ? 0.22 : 0.32}"${cv.hidden ? dash : ''}/>`; });
    extra.forEach(e => {
      if (e.seg) out += ln(X(e.seg[0]), Y(e.seg[0]), X(e.seg[1]), Y(e.seg[1]), '#222', e.thin ? 0.22 : 0.22, e.dash ? dash : '') + (e.dot0 ? `<circle cx="${f2(X(e.seg[0]))}" cy="${f2(Y(e.seg[0]))}" r="0.5" fill="#222"/>` : '');
      if (e.text) out += tx(X(e.at) + (e.dx || 0), Y(e.at) + (e.dy || 0) + 1, svgMath(e.text), 2.9, e.anchor || 'middle');
    });
    // 辺の長さ（AB 5cm）
    dimLines.forEach(d => {
      const m = /^(\S+?)(\S+?)$/.exec(d.key); if (!m || !(m[1] in idx) || !(m[2] in idx)) return;
      const p = V2[idx[m[1]]], q = V2[idx[m[2]]], mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2;
      let nx = -(Y(q) - Y(p)), ny = X(q) - X(p); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
      out += tx(mx + nx * 3, my + ny * 3 + 1, svgMath(d.text), 2.9, Math.abs(nx) < 0.4 ? 'middle' : nx > 0 ? 'start' : 'end');
    });
    // 図に入れておく線（対角線など。頂点の名前を2つ並べて書く）
    String(f.diag || '').trim().split(/[\s,、]+/).filter(Boolean).forEach(k => { const m = /^(\S+?)(\S+?)$/.exec(k); if (!m || !(m[1] in idx) || !(m[2] in idx)) return; const p = V2[idx[m[1]]], q = V2[idx[m[2]]]; out += ln(X(p), Y(p), X(q), Y(q), '#222', 0.3, ' stroke-linecap="round"'); });
    // 強調する辺（解答例なら赤）
    const hl = String(f.hl || '').trim().split(/[\s,、]+/).filter(Boolean);
    let ha = '';
    hl.forEach(k => { const m = /^(\S+?)(\S+?)$/.exec(k); if (!m || !(m[1] in idx) || !(m[2] in idx)) return; const p = V2[idx[m[1]]], q = V2[idx[m[2]]]; ha += ln(X(p), Y(p), X(q), Y(q), f.hlGiven ? '#222' : '#d62828', 0.6, ' stroke-linecap="round"'); });
    if (ha) out += f.hlGiven ? ha : `<g class="ansx">${ha}</g>`;
    // 頂点の名前
    Object.keys(idx).forEach(nm => {
      const p = V2[idx[nm]], x = X(p), y = Y(p); let dx = x - cx, dy = y - cy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      out += tx(x + dx * 2.6, y + dy * 2.6 + 1.1, plab(nm), 3.1, Math.abs(dx) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end', ' class="pl"');
    });
    return out;
  }

  /* ---- グラフ・ヒストグラム（目もりを自由にとれるグラフ） ---- */
  function figChart(f, W, H) {
    const xmin = num(f.xmin, 0), xstep = Math.max(1e-6, num(f.xstep, 1)), xmax = Math.max(xmin + xstep, num(f.xmax, xmin + 10 * xstep));
    const ymin = num(f.ymin, 0), ystep = Math.max(1e-6, num(f.ystep, 1)), ymax = Math.max(ymin + ystep, num(f.ymax, ymin + 10 * ystep));
    const xl = Math.max(xstep, num(f.xlab, xstep)), yl = Math.max(ystep, num(f.ylab, (ymax - ymin) / ystep > 12 ? ystep * 2 : ystep));
    const cap = f.caption ? 4.2 : 0, padL = 9, padR = 7, padT = 6.5 + cap, padB = 8;
    const ux = (W - padL - padR) / (xmax - xmin), uy = (H - padT - padB) / (ymax - ymin);
    const X = x => padL + (x - xmin) * ux, Y = y => padT + (ymax - y) * uy, E = 1e-9;
    let s = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) s += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    if (f.grid !== false) {
      for (let x = xmin; x <= xmax + E; x += xstep) s += ln(X(x), Y(ymin), X(x), Y(ymax), '#c9d3dc', 0.13);
      for (let y = ymin; y <= ymax + E; y += ystep) s += ln(X(xmin), Y(y), X(xmax), Y(y), '#c9d3dc', 0.13);
    }
    s += ln(X(xmin), Y(ymin), X(xmax) + 2.2, Y(ymin), '#222', 0.28) + head(X(xmax) + 3.3, Y(ymin), 'r', '#222', 0.65);
    s += ln(X(xmin), Y(ymin), X(xmin), Y(ymax) - 2.2, '#222', 0.28) + head(X(xmin), Y(ymax) - 3.3, 'u', '#222', 0.65);
    const cats = String(f.xcats || '').trim() ? String(f.xcats).trim().split(/[\s,、]+/) : null;   // 横の項目名（曜日など）
    if (cats) cats.forEach((c, i) => { const x = xmin + (i + 0.5) * xstep; if (x < xmax) s += tx(X(x), Y(ymin) + 3.3, esc(c), 2.5); });
    else for (let x = xmin; x <= xmax + E; x += xl) s += tx(X(x), Y(ymin) + 3.3, numLabel(x), 2.3);
    for (let y = ymin; y <= ymax + E; y += yl) s += tx(X(xmin) - 1, Y(y) + 0.8, numLabel(y), 2.3, 'end');
    if (f.xname) s += tx(X(xmax) + 4, Y(ymin) + 6.8, esc(f.xname), 2.5, 'end');
    if (f.yname) s += tx(X(xmin) - 1, Y(ymax) - 4.4, esc(f.yname), 2.5, 'start');
    const bars = String(f.bars || '').trim() ? String(f.bars).trim().split(/[\s,、]+/).map(v => num(v, 0)) : [];
    if (bars.length) {
      const g = !!f.barsGiven;
      const r = bars.map((v, i) => { const x = xmin + i * xstep; return v > 0 && x < xmax - E ? `<rect x="${f2(X(x))}" y="${f2(Y(v))}" width="${f2(xstep * ux)}" height="${f2((v - ymin) * uy)}" fill="${g ? '#dfe5ea' : 'rgba(214,40,40,.08)'}" stroke="${g ? '#222' : '#d62828'}" stroke-width="0.28"/>` : ''; }).join('');
      s += g ? r : `<g class="ansx">${r}</g>`;
      if (f.poly) {
        const pp = [[xmin - xstep / 2, 0], ...bars.map((v, i) => [xmin + (i + 0.5) * xstep, v]), [xmin + (bars.length + 0.5) * xstep, 0]].filter(p => p[0] >= xmin - E && p[0] <= xmax + E);
        const pl = `<polyline points="${pp.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="${f.polyGiven ? '#222' : '#d62828'}" stroke-width="0.32"/>` + pp.map(p => `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="0.5" fill="${f.polyGiven ? '#222' : '#d62828'}"/>`).join('');
        s += f.polyGiven ? pl : `<g class="ansx">${pl}</g>`;
      }
    }
    String(f.hline || '').split(/[\s,、]+/).map(v => num(v, NaN)).filter(isFinite).forEach(v => {   // 基準の横線
      s += ln(X(xmin), Y(v), X(xmax), Y(v), '#1d5fbf', 0.3, ' stroke-dasharray="1.4 0.8"') + tx(X(xmax) + 0.8, Y(v) + 0.9, numLabel(v), 2.3, 'start', ' fill="#1d5fbf"');
    });
    [['points', 'pointsGiven', ''], ['points2', 'points2Given', ' stroke-dasharray="1.4 0.9"']].forEach(([key, gk, dash]) => {   // 折れ線（2本目は点線）
      const pts = parsePoints(f[key]); if (!pts.length) return;
      const g = !!f[gk], c = g ? '#222' : '#d62828';
      const conn = key === 'points' ? f.connect !== false : f.connect2 !== false, dots = key === 'points' || f.dots2 !== false;
      const pl = (conn ? `<polyline points="${pts.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="${c}" stroke-width="0.3"${dash}/>` : '') + (dots ? pts.map(p => `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="0.55" fill="${c}"/>`).join('') : '');
      s += g ? pl : `<g class="ansx">${pl}</g>`;
    });
    [['steps', 'stepsGiven', ''], ['steps2', 'steps2Given', ' stroke-dasharray="1.4 0.9"']].forEach(([key, gk, dash]) => {
      const pts = parsePoints(f[key]); if (pts.length < 2) return;
      const g = !!f[gk], c = g ? '#222' : '#d62828'; let pl = '';
      for (let i = 0; i + 1 < pts.length; i += 2) {
        const a = pts[i], b = pts[i + 1];
        pl += ln(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), c, 0.36, dash) + `<circle cx="${f2(X(a[0]))}" cy="${f2(Y(a[1]))}" r="0.62" fill="#fff" stroke="${c}" stroke-width="0.26"/><circle cx="${f2(X(b[0]))}" cy="${f2(Y(b[1]))}" r="0.62" fill="${c}"/>`;
      }
      s += g ? pl : `<g class="ansx">${pl}</g>`;
    });
    return s;
  }
  function figSVG(f, W, H) {
    const k = f.kind || 'coord';
    const inner = k === 'numline' ? figNumline(f, W, H) : k === 'image' ? figImage(f, W, H) : k === 'geo' ? figGeo(f, W, H)
      : k === 'solid' ? figSolid(f, W, H) : k === 'chart' ? figChart(f, W, H) : figCoord(f, W, H);
    return `<svg class="fsvg" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${f2(W)}mm" height="${f2(H)}mm">${inner}</svg>`;
  }

  /* ---------------- ブロックとページ ---------------- */
  let curSel = null;   // 編集画面で選んでいるブロック（枠を表示）
  let curEx = null;    // 余った行の配分 { ブロックID: 追加する行数, 'gap:ID': 前にあける行数 }
  const tag = (cls, label) => label ? `<span class="tag ${cls}">${esc(label)}</span>` : '';
  // 値は空白で区切る（「|」があれば「|」で区切る）。{{5}} と書いたマスは空欄（答えは解答例）
  const cellsOf = r => { const t = String(r.cells || '').trim(); return !t ? [] : t.indexOf('|') >= 0 ? t.split('|').map(x => x.trim()) : t.split(/[ 　]+/); };
  const cellHTML = (v, blankRow) => v == null ? '' : /^\{\{[\s\S]*\}\}$/.test(v) ? `<span class="ansx">${inl(v.slice(2, -2))}</span>` : blankRow ? `<span class="ansx">${inl(v)}</span>` : inl(v);
  function blockHTML(b, W, g) {
    const at = ` data-b="${b.id}"`, sel = b.id === curSel ? ' sel' : '';
    const rows = Math.max(1, Math.round(num(b.rows, 1)));
    if (b.type === 'meate' || b.type === 'kadai' || b.type === 'text') {
      const label = b.type === 'meate' ? (b.label || 'めあて') : b.type === 'kadai' ? (b.label == null ? '課題' : b.label) : b.label;
      const box = b.type === 'kadai' && b.box !== false;
      const body = b.blank ? `<span class="ansx">${inl(b.text)}</span>` : inl(b.text);
      // 小テストの最初の行：右はしに得点らん（score＝満点）
      const sc = b.type === 'meate' && num(b.score, 0) > 0 ? `<span class="wscore"><small>得点</small><b>／${esc(b.score)}</b></span>` : '';
      return `<div class="wb wb-t${box ? ' box' : ''}${sc ? ' has-score' : ''}${sel}"${at} style="min-height:${rows * g.pitch}mm">${tag('t-' + b.type, label)}<div class="tx">${body}</div>${sc}</div>`;
    }
    if (b.type === 'write') {
      const rows = Math.max(1, Math.round(num(b.rows, 1))) + ((curEx && curEx[b.id]) || 0);
      const pr = b.prompt ? `<span class="pr">${inl(b.prompt)}</span>` : '';
      const an = b.answer ? `<span class="ansx">${inl(b.answer)}</span>` : '';
      return `<div class="wb wb-w${b.box ? ' box' : ''}${sel}"${at} data-rows="${rows}" style="height:${rows * g.pitch}mm">${tag('t-write', b.label)}<div class="tx">${pr}${an}</div></div>`;
    }
    if (b.type === 'table') {
      const rs = b.rows || [], ncol = Math.max(1, ...rs.map(r => cellsOf(r).length));
      const tw = W * Math.min(100, Math.max(20, num(b.width, 100))) / 100;
      const hw = Math.min(tw * 0.4, Math.max(g.pitch * 1.3, Math.max(1, ...rs.map(r => emOf(stripMarks(r.h)))) * g.pitch * 0.5 + 3));
      return `<div class="wb wb-tab${sel}"${at} style="height:${Math.max(1, rs.length) * g.pitch}mm"><table class="wt" style="width:${f2(tw)}mm"><colgroup><col style="width:${f2(hw)}mm">${'<col>'.repeat(ncol)}</colgroup>${rs.map(r => {
        const cs = cellsOf(r);
        const cell = r.head ? 'th' : 'td';
        return `<tr${r.head ? ' class="hd"' : ''}><th>${inl(r.h)}</th>${Array.from({ length: ncol }, (_, i) => `<${cell}>${cellHTML(cs[i], r.blank)}</${cell}>`).join('')}</tr>`;
      }).join('')}</table></div>`;
    }
    if (b.type === 'figure') {
      const figs = b.figs && b.figs.length ? b.figs : [{ kind: 'coord' }], H = rows * g.pitch;
      const ws = figs.map(f => Math.max(0.2, num(f.w, 1))), sum = ws.reduce((a, c) => a + c, 0);
      const avail = W - FIG_GAP * (figs.length - 1);
      return `<div class="wb wb-fig${sel}"${at} style="height:${H}mm">${figs.map((f, i) => { const fw = avail * ws[i] / sum; return `<div class="fg" style="width:${f2(fw)}mm">${figSVG(f, fw, H)}</div>`; }).join('')}</div>`;
    }
    if (b.type === 'cols') {
      const r = String(b.ratio || '1:1').split(':').map(x => Math.max(1, num(x, 1)));
      const n = b.cols.length, sum = b.cols.reduce((a, c, i) => a + (r[i] || 1), 0);
      const widths = b.cols.map((c, i) => (W - COL_GAP * (n - 1)) * (r[i] || 1) / sum);
      return `<div class="wb wb-cols${sel}"${at} style="grid-template-columns:${widths.map(w => f2(w) + 'mm').join(' ')}">${b.cols.map((c, i) => `<div class="wcol">${c.blocks.map(x => blockHTML(x, widths[i], g)).join('')}</div>`).join('')}</div>`;
    }
    return '';
  }
  // 罫線とドット。印刷（PDF）でもくっきり出るよう、模様（pattern）を使わず1本ずつ線で描く。
  // ドットは「長さ0の破線＋丸い線端」で、罫の幅と同じ間隔に並べる（縦にもそろう）
  function ruleSVG(g, dots) {
    const W = g.cw, H = g.rows * g.pitch, p = g.pitch, off = (W % p) / 2;
    let s = '';
    for (let i = 0; i <= g.rows; i++) {
      const y = f2(i * p);
      s += `<line x1="0" y1="${y}" x2="${f2(W)}" y2="${y}" stroke="#a3b6c8" stroke-width="${i === 0 ? 0.28 : 0.2}"/>`;
      if (dots) s += `<line x1="${f2(off)}" y1="${y}" x2="${f2(W)}" y2="${y}" stroke="#58748e" stroke-width="0.6" stroke-linecap="round" stroke-dasharray="0 ${p}"/>`;
    }
    return `<svg class="wsp-rule" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${f2(W)}mm" height="${f2(H)}mm" overflow="visible" aria-hidden="true">${s}</svg>`;
  }
  const splitPages = blocks => { const pages = [[]]; blocks.forEach(b => { if (b.type === 'break') pages.push([]); else pages[pages.length - 1].push(b); }); return pages; };
  // 余った行を記入欄に配分してから並べる（sheet.fill が false なら配分しない）
  function pagesHTML(sheet, l) { return rawPages(sheet, l, computeExtras(sheet, l)); }
  function rawPages(sheet, l, ex) {
    const g = geo(sheet), P = g.P, pages = splitPages(sheet.blocks);
    const hd = headText(sheet, l);
    return pages.map((bl, pi) => `<div class="wsp" style="width:${P.w}mm;height:${P.h}mm;--pitch:${g.pitch}mm">
      <div class="wsp-head" style="left:${P.mx}mm;right:${P.mx}mm;top:${P.top - 12}mm">
        <div class="wh-date"><span class="u w2"></span>月<span class="u w2"></span>日（<span class="u w1"></span>）</div>
        <div class="wh-mid">${esc(hd)}${pages.length > 1 ? (sheet.kind === 'drill' && pages.length === 2 ? (pi ? '（裏）' : '（表）') : `　${pi + 1}／${pages.length}`) : ''}</div>
        <div class="wh-name"><span class="u w1"></span>年<span class="u w1"></span>組<span class="u w1"></span>号　氏名<span class="u w6"></span></div>
      </div>
      <div class="wsp-body" style="left:${P.mx}mm;top:${P.top}mm;width:${g.cw}mm;height:${g.rows * g.pitch}mm">
        ${ruleSVG(g, sheet.dots)}
        <div class="wsp-flow">${withEx(ex, () => bl.map(b => (ex && ex['gap:' + b.id] ? `<div class="wgap" style="height:${ex['gap:' + b.id] * g.pitch}mm"></div>` : '') + blockHTML(b, g.cw, g)).join(''))}</div>
      </div>
      <div class="wsp-over" hidden></div>
    </div>`).join('');
  }
  function withEx(ex, fn) { const keep = curEx; curEx = ex; try { return fn(); } finally { curEx = keep; } }
  /* ---- 行のバランス調整：一度ならべて測り、余った行を記入欄（2段組の中の記入欄も）に比例して配る。
     1つの欄は「もとの行数×2＋2」まで。それでも余れば、問題の見出しの前にすき間をあける ---- */
  const exCache = new Map();
  let mbox = null;
  function measureBox() {
    if (!mbox) { mbox = document.createElement('div'); mbox.setAttribute('aria-hidden', 'true'); mbox.style.cssText = 'position:absolute;left:-40000px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(mbox); }
    return mbox;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => exCache.clear());
  function computeExtras(sheet, l) {
    if (!sheet || sheet.fill === false || !document.body) return null;
    const key = JSON.stringify(sheet) + '|' + (l ? l.id : '');
    if (exCache.has(key)) return exCache.get(key);
    const box = measureBox(), g = geo(sheet), pages = splitPages(sheet.blocks), ex = { _added: 0, _base: [] };
    const rowsOf = b => Math.max(1, Math.round(num(b.rows, 1)));
    const give = (id, n) => { if (n > 0) ex[id] = (ex[id] || 0) + n; };
    const spread = (ws, n) => {   // 1つの列の記入欄に n 行を配る（あまりは下の欄へ）
      const k = ws.length, each = Math.floor(n / k), rest = n - each * k;
      ws.forEach((x, i) => give(x.id, each + (i >= k - rest ? 1 : 0)));
    };
    const measurePages = () => $$('.wsp', box).map(p => {
      const body = $('.wsp-body', p), flow = $('.wsp-flow', p), rowPx = body.clientHeight / g.rows || 1;
      return { p, rowPx, used: Math.ceil(flow.offsetHeight / rowPx - 0.05) };
    });
    box.innerHTML = rawPages(sheet, l, null);
    const state = measurePages().map((m, pi) => {
      ex._base.push(m.used);
      const tops = pages[pi] || [], cand = [];
      tops.forEach(b => {
        if (b.type === 'write') { const base = rowsOf(b); cand.push({ b, w: base, cap1: base * 2, cap2: base * 3 + 2, add: 0 }); return; }
        if (b.type !== 'cols') return;
        const el = $(`[data-b="${b.id}"]`, m.p); if (!el) return;
        const H = el.offsetHeight / m.rowPx, cols = [];
        [...el.children].forEach((ce, i) => {
          const ws = b.cols[i] ? b.cols[i].blocks.filter(x => x.type === 'write') : [];
          if (!ws.length) return;
          spread(ws, Math.floor(H - ce.offsetHeight / m.rowPx + 0.05));   // 短い列の記入欄をのばして、左右の下をそろえる
          cols.push(ws);
        });
        if (!cols.length) return;
        const h = Math.max(1, Math.round(H)), nmax = Math.max(...cols.map(ws => ws.length));
        cand.push({ b, cols, w: Math.max(1, h * 0.5), cap1: Math.min(Math.ceil(h * 0.5), nmax * 2), cap2: Math.max(2, h), add: 0 });
      });
      return { tops, cand, spare: g.rows - m.used };
    });
    const fill = (st, capKey) => {   // 記入欄の大きさに比例して1行ずつ配る
      for (let guard = 0; st.spare > 0 && guard < 600; guard++) {
        const open = st.cand.filter(c => c.add < c[capKey]); if (!open.length) break;
        open.sort((x, y) => (x.add + 1) / x.w - (y.add + 1) / y.w || y.w - x.w);
        open[0].add++; open[0].fresh = (open[0].fresh || 0) + 1; st.spare--; ex._added++;
      }
    };
    const gaps = (st, rounds) => {   // 問題と問題のあいだにすき間（説明文とその図・表のあいだにはあけない）
      const gcand = st.tops.filter((b, i) => {
        if (i < 2 || b.nogap) return false;   // nogap＝問いの文のすぐ下の小問（小テスト）
        const prev = st.tops[i - 1];
        if ((b.type === 'table' || b.type === 'figure') && prev && (prev.type === 'text' || prev.type === 'kadai')) return false;
        if (prev && prev.type === 'meate') return false;   // 見出し（基礎・基本／標準 など）と、その最初の問題のあいだにはあけない
        if (b.type === 'meate') return true;               // 見出しの前にあける
        return b.type === 'kadai' || b.type === 'table' || b.type === 'figure' || b.type === 'cols' || ((b.type === 'text' || b.type === 'write') && (b.label || b.prompt));
      });
      for (let round = 0; round < rounds && st.spare > 0; round++) for (const b of gcand) { if (st.spare <= 0) break; give('gap:' + b.id, 1); st.spare--; ex._added++; }
    };
    const commit = st => st.cand.forEach(c => {
      const n = c.fresh || 0; c.fresh = 0; if (!n) return;
      if (c.cols) c.cols.forEach(ws => spread(ws, n)); else give(c.b.id, n);   // 段組：どの列にも同じ行数（左右の小問の高さがそろう）
    });
    state.forEach(st => {
      if (st.spare <= 0) return;
      fill(st, 'cap1');   // ① 記入欄をまず2倍まで
      gaps(st, 2);        // ② 問題と問題のあいだ
      fill(st, 'cap2');   // ③ まだ余れば、記入欄をさらに広げる
      commit(st);
    });
    for (let it = 0; it < 3; it++) {   // 並べ直して確かめ、見込みより伸びずに下が空いていれば、もう一度配る
      box.innerHTML = rawPages(sheet, l, ex);
      let again = false;
      measurePages().forEach((m, pi) => {
        const st = state[pi]; if (!st) return;
        st.spare = g.rows - m.used; if (st.spare <= 0) return;
        again = true; fill(st, 'cap2'); gaps(st, 1); commit(st);
      });
      if (!again) break;
    }
    box.innerHTML = '';
    exCache.set(key, ex);
    if (exCache.size > 300) exCache.delete(exCache.keys().next().value);
    return ex;
  }
  // 罫の行数をこえていないか、答えが記入欄からはみ出していないかを見る
  function measure(root, sheet) {
    const g = geo(sheet), res = [];
    $$('.wsp', root).forEach(p => {
      const body = $('.wsp-body', p), flow = $('.wsp-flow', p), over = $('.wsp-over', p);
      const rowPx = body.clientHeight / g.rows || 1;
      const used = Math.ceil(flow.offsetHeight / rowPx - 0.05), extra = used - g.rows;
      p.classList.toggle('overflow', extra > 0);
      over.hidden = extra <= 0;
      over.textContent = extra > 0 ? `${extra}行はみ出しています（行数を減らすか、改ページを入れてください）` : '';
      res.push(used);
    });
    // 解答例が記入欄から半行以上はみ出したら印をつける
    $$('.wb-w', root).forEach(w => w.classList.toggle('ovf', root.classList.contains('ans-on') && w.scrollHeight - w.clientHeight > w.clientHeight / (+w.dataset.rows || 1) * 0.5));
    return { rows: g.rows, used: res };
  }

  /* ---------------- 授業ナビの「ワークシート」タブ ---------------- */
  const paneHTML = (l, kind) => `<div class="ws-tab" data-ws="${esc(l.id)}"${kindOf(kind) !== 'ws' ? ` data-kind="${kind}"` : ''}><p class="muted small">読み込み中…</p></div>`;
  async function fillPane(el, l, kind) {
    if (!el) return;
    const rt = kindOf(kind), dr = rt === 'dr', qz = rt === 'qz';
    const r = await load(keyOf(l.id, kind));
    if (!el.isConnected) return;
    if (r.source === 'draft') {
      const samples = Object.keys(KIND[rt].src).map(k => lessonById[k]).filter(Boolean).slice(0, 12)
        .map(x => `<a href="#/lesson/${x.id}/${rt}">${esc((unitByKey[x.unit] || {}).name || '')} 第${x.no}時</a>`).join('、');
      el.innerHTML = qz ? `<div class="ws-empty"><p><b>この時間の小テストは、まだありません。</b></p>
        <p class="small muted">5問×20点＋チャレンジ1問のひな形に、問題を入れて作れます（編集すると自動で保存）。</p>
        <p><a class="nbtn pri" href="#/qz/${esc(l.id)}">ひな形から作る</a></p>
        ${samples ? `<p class="small muted">見本：${samples}</p>` : ''}</div>`
        : dr ? `<div class="ws-empty"><p><b>この時間の問題演習プリントは、まだありません。</b></p>
        <p class="small muted">表（基礎・基本と標準）・裏（応用と入試に挑戦）のひな形に、問題を入れて作れます（編集すると自動で保存）。</p>
        <p><a class="nbtn pri" href="#/dr/${esc(l.id)}">ひな形から作る</a></p>
        ${samples ? `<p class="small muted">見本：${samples}</p>` : ''}</div>`
        : `<div class="ws-empty"><p><b>この時間のノート型ワークシートは、まだありません。</b></p>
        <p class="small muted">めあて・学習課題などを授業データから入れた下書きをつくり、それを直して仕上げられます（編集すると自動で保存）。</p>
        <p><a class="nbtn pri" href="#/ws/${esc(l.id)}">下書きをつくって編集する</a></p>
        ${samples ? `<p class="small muted">見本：${samples}</p>` : ''}</div>`;
      return;
    }
    el.innerHTML = `<div class="ws-tbar"><span class="ws-src">${esc(sourceText(r.source))}</span><span class="sp"></span>
        <label class="ck"><input type="checkbox" data-wsans>解答例を表示</label>
        <a class="nbtn" href="#/${rt}print/${esc(l.unit)}" title="この単元の${qz ? '小テスト' : dr ? '問題演習プリント' : 'ワークシート'}を全部並べて、まとめて印刷します">単元をまとめて印刷</a>
        <a class="nbtn pri" href="#/${rt}/${esc(l.id)}">開いて編集・印刷</a></div>
      <div class="ws-thumb"><div class="ws-thumb-in">${pagesHTML(r.sheet, l)}</div></div>
      <p class="small muted">${qz ? '5分・100点の小テストと、点数に入れないチャレンジ1問です。この時間のワークシートと演習プリントと同じ型の問題を出しています。' : dr ? '両面印刷すると1枚になります（1ページ目＝表：基礎・基本と標準、2ページ目＝裏：応用と入試に挑戦）。' : ''}赤い字（解答例）は「解答例を表示」のときだけ出ます。生徒用に印刷するときは消しておきます。</p>`;
    const inn = $('.ws-thumb-in', el), P = PAPER[r.sheet.paper] || PAPER.A4;
    const fit = () => { if (el.clientWidth) inn.style.zoom = Math.min(1, Math.max(0.3, (el.clientWidth - 30) / (P.w * 3.7795))).toFixed(3); };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el);   // タブを開いて幅が決まったときに合わせ直す
    $('[data-wsans]', el).addEventListener('change', e => inn.classList.toggle('ans-on', e.target.checked));
  }

  /* ---------------- 編集画面 ---------------- */
  const st = { id: null, lesson: null, sheet: null, source: '', ans: false, sel: null, hist: [], hi: -1, saveT: null, snapT: null, prevT: null, openAdd: null };
  let wrap = null, panel, pagesEl, viewEl;

  function ensureUI() {
    if (wrap) return;
    wrap = document.createElement('div');
    wrap.id = 'wsWrap'; wrap.className = 'ws-wrap'; wrap.hidden = true;
    wrap.innerHTML = `
      <div class="wse-bar">
        <a class="nbtn" id="wsBack" href="#/plan"><svg class="ic"><use href="#i-left"/></svg>戻る</a>
        <div class="wse-title"><small id="wsKind">ノート型ワークシート</small><b id="wsTitle"></b></div>
        <span class="sp"></span>
        <span class="wse-status" id="wsStatus"></span>
        <button class="nbtn" id="wsUndo" title="元に戻す（⌘Z / Ctrl+Z）">↶ 戻す</button>
        <button class="nbtn" id="wsRedo" title="やり直す（⇧⌘Z / Ctrl+Y）">↷</button>
        <label class="nbtn ck" title="空欄の答え（赤）を表示します。教師用に"><input type="checkbox" id="wsAns">解答例を表示</label>
        <button class="nbtn pri" id="wsPrint"><svg class="ic"><use href="#i-print"/></svg>印刷</button>
      </div>
      <div class="wse-main">
        <aside class="wse-panel" id="wsPanel"></aside>
        <section class="wse-view" id="wsView"><div class="wse-info" id="wsInfo"></div><div class="wse-pages ws-edit" id="wsPages"></div></section>
      </div>
      <input type="file" id="wsImport" accept="application/json,.json" hidden>`;
    document.body.appendChild(wrap);
    panel = $('#wsPanel', wrap); pagesEl = $('#wsPages', wrap); viewEl = $('#wsView', wrap);
    bindUI();
    if (window.WSETS) window.WSETS.mount(wrap);   // セットで入れる・周辺の問題をさがす（js/sets.js）
  }
  function setStatus(t, cls) { const e = $('#wsStatus', wrap); e.textContent = t; e.className = 'wse-status' + (cls ? ' ' + cls : ''); }
  function setPageCSS(sheet) {
    let el = document.getElementById('wsPageCSS');
    if (!sheet) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = 'wsPageCSS'; document.head.appendChild(el); }
    const P = PAPER[sheet.paper] || PAPER.A4;
    el.textContent = `@page{size:${P.w}mm ${P.h}mm;margin:0}`;
  }

  // kind：'dr' なら問題演習プリント（#/dr/<ID>）。st.id は保存するときの名前、st.lid は時間のID
  function open(lid, withAns, kind) {
    const l = lessonById[lid];
    if (!l) { location.hash = '#/plan'; return; }
    const kd = kindOf(kind), dr = kd === 'dr', id = keyOf(lid, kind);
    ensureUI();
    wrap.classList.remove('all'); st.all = null;
    if (withAns) st.ans = true;   // #/ws/<ID>/ans で開くと解答例つき
    if (st.id && st.id !== id) flushSave();
    wrap.hidden = false;
    document.body.classList.add('ws-open');
    document.body.style.overflow = 'hidden';
    if (st.id === id && st.sheet) { $('#wsAns', wrap).checked = st.ans; renderPreview(); return; }
    Object.assign(st, { id, lid, kind: kd, lesson: l, sheet: null, sel: null, openAdd: null, hist: [], hi: -1 });
    const u = unitByKey[l.unit] || {};
    $('#wsKind', wrap).textContent = kd === 'qz' ? '小テスト（5分・100点＋チャレンジ）' : dr ? '問題演習プリント（両面で1枚）' : 'ノート型ワークシート';
    $('#wsTitle', wrap).textContent = `${u.name || ''} 第${l.no}時「${l.title}」`;
    $('#wsBack', wrap).setAttribute('href', `#/lesson/${lid}/${kd}`);
    $('#wsAns', wrap).checked = st.ans;
    panel.innerHTML = '<p class="muted" style="padding:16px">読み込み中…</p>'; pagesEl.innerHTML = '';
    setStatus('');
    load(id).then(r => {
      if (st.id !== id) return;
      st.sheet = r.sheet; st.source = r.source;
      snapshot();
      setStatus(sourceText(r.source));
      renderAll();
    });
  }
  // 単元のワークシートをまとめて表示（印刷用）。#/wsprint/<単元>[/ans]
  async function openAll(unitKey, withAns, kind) {
    const u = unitByKey[unitKey]; if (!u) { location.hash = '#/plan'; return; }
    const kd = kindOf(kind), dr = kd === 'dr', qz = kd === 'qz';
    ensureUI();
    if (st.id) flushSave();
    Object.assign(st, { id: null, lid: null, kind: kd, lesson: null, sheet: null, sel: null, openAdd: null, hist: [], hi: -1, all: unitKey });
    if (withAns !== undefined) st.ans = !!withAns;
    wrap.hidden = false; wrap.classList.add('all');
    document.body.classList.add('ws-open'); document.body.style.overflow = 'hidden';
    const ls = (D.lessons || []).filter(l => l.unit === unitKey && hasKind(l.id, kd)).sort((a, b) => a.no - b.no);
    $('#wsKind', wrap).textContent = qz ? '小テスト（5分・100点＋チャレンジ）' : dr ? '問題演習プリント（両面で1枚）' : 'ノート型ワークシート';
    $('#wsTitle', wrap).textContent = qz ? `${u.name}　小テスト ${ls.length}時間ぶん（まとめて印刷）` : dr ? `${u.name}　問題演習プリント ${ls.length}時間ぶん（まとめて印刷）` : `${u.name}　全${ls.length}時間のワークシート（まとめて印刷）`;
    $('#wsBack', wrap).setAttribute('href', '#/units/' + unitKey);
    $('#wsAns', wrap).checked = st.ans;
    setStatus('読み込み中…'); pagesEl.innerHTML = '';
    let html = '', first = null;
    for (const l of ls) { const r = await load(keyOf(l.id, kind)); if (st.all !== unitKey) return; if (!first) first = r.sheet; html += pagesHTML(r.sheet, l); }
    pagesEl.innerHTML = html; pagesEl.classList.toggle('ans-on', st.ans);
    setPageCSS(first || { paper: 'A4' });
    const P = PAPER[(first || {}).paper] || PAPER.A4;
    pagesEl.style.zoom = Math.max(0.3, Math.min(1.15, (viewEl.clientWidth - 48) / (P.w * 3.7795))).toFixed(3);
    $('#wsInfo', wrap).textContent = !ls.length ? (qz ? 'この単元の小テストは、まだありません。' : dr ? 'この単元の問題演習プリントは、まだありません。' : '') : `${ls.length}時間・${$$('.wsp', pagesEl).length}${dr ? 'ページ（両面印刷で、1時間が1枚）' : '枚'}`;
    setStatus('');
    document.body.dataset.wsReady = '1';
  }
  function close() {
    if (!wrap || wrap.hidden) return;
    if (window.WSETS) window.WSETS.close();
    wrap.classList.remove('all'); st.all = null;
    flushSave();
    wrap.hidden = true;
    document.body.classList.remove('ws-open');
    document.body.style.overflow = '';
    setPageCSS(null);
    st.id = null; st.sheet = null;
  }

  function renderAll() { renderPanel(); renderPreview(); undoBtns(); }
  function renderPreview() {
    if (!st.sheet) return;
    curSel = st.sel;
    pagesEl.innerHTML = pagesHTML(st.sheet, st.lesson);
    curSel = null;
    pagesEl.classList.toggle('ans-on', st.ans);
    setPageCSS(st.sheet);
    fitZoom();
    const m = measure(pagesEl, st.sheet), ex = computeExtras(st.sheet, st.lesson);
    const over = m.used.some(u => u > m.rows);
    $('#wsInfo', wrap).innerHTML = `${esc(st.sheet.paper)}・罫${st.sheet.pitch}mm・1ページ${m.rows}行　使っている行：${m.used.map((u, i) => `<b class="${u > m.rows ? 'bad' : ''}">${m.used.length > 1 ? (i + 1) + '枚目 ' : ''}${u}行</b>`).join('　')}${ex && ex._added ? `　<span class="muted">（余った${ex._added}行を記入欄などに自動で配分）</span>` : ''}${over ? '　<span class="bad">⚠ はみ出しがあります</span>' : ''}`;
  }
  const previewSoon = () => { clearTimeout(st.prevT); st.prevT = setTimeout(renderPreview, 140); };
  function fitZoom() {
    const P = PAPER[st.sheet.paper] || PAPER.A4;
    const z = Math.max(0.3, Math.min(1.15, (viewEl.clientWidth - 48) / (P.w * 3.7795)));
    pagesEl.style.zoom = z.toFixed(3);
  }

  /* --- ブロックのリスト（左の欄） --- */
  function locate(id, list, parent) {
    list = list || st.sheet.blocks;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.id === id) return { b, list, i, parent: parent || null };
      if (b.type === 'cols') for (const c of b.cols) { const r = locate(id, c.blocks, b); if (r) return r; }
    }
    return null;
  }
  function listByKey(key) {
    if (key === 'root') return st.sheet.blocks;
    const [id, ci] = key.split(':'); const r = locate(id);
    return r && r.b.cols && r.b.cols[+ci] ? r.b.cols[+ci].blocks : null;
  }
  const typeName = b => b.type === 'write' && /まとめ|振り返り/.test(b.label || '') ? b.label : TYPE_LABEL[b.type];
  function summary(b) {
    const cut = t => { t = stripMarks(t).replace(/\s+/g, ' ').trim(); return t.length > 34 ? t.slice(0, 33) + '…' : t; };
    switch (b.type) {
      case 'meate': case 'kadai': case 'text': return cut((b.label && !(b.type === 'meate' && b.label === 'めあて') ? b.label + '　' : '') + (b.text || '')) || '（本文なし）';
      case 'write': return cut([b.label, b.prompt].filter(Boolean).join('　')) || '（空欄）';
      case 'table': { const n = Math.max(0, ...(b.rows || []).map(r => cellsOf(r).length)); return `${(b.rows || []).length}行×${n}列` + ((b.rows || []).some(r => r.blank) ? '（空欄あり）' : ''); }
      case 'figure': return b.figs.map(f => (Object.fromEntries(FIG_KINDS)[f.kind || 'coord'] || '図') + (f.caption ? `「${f.caption}」` : '')).join('＋');
      case 'cols': return `列の幅 ${b.ratio || '1:1'}`;
      case 'break': return 'ここで次のページへ';
    }
    return '';
  }
  const rowsText = b => b.type === 'write' ? `${Math.max(1, num(b.rows, 1))}行${curPanelEx && curPanelEx[b.id] ? `＋${curPanelEx[b.id]}` : ''}` : b.type === 'figure' ? `${Math.max(1, num(b.rows, 1))}行` : b.type === 'table' ? `${(b.rows || []).length}行` : ['meate', 'kadai', 'text'].includes(b.type) ? `${Math.max(1, num(b.rows, 1))}行〜` : '';
  let curPanelEx = null;
  function renderPanel() {
    const s = st.sheet;
    curPanelEx = computeExtras(s, st.lesson);
    panel.innerHTML = `
      <div class="wse-sec">
        <h3>用紙・罫線・まとめ</h3>
        <div class="wse-row">
          <label class="wse-field sm">用紙<select data-g="paper">${Object.keys(PAPER).map(k => `<option${s.paper === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
          <label class="wse-field sm">罫の幅<select data-g="pitch">${[6, 7, 8].map(v => `<option value="${v}"${s.pitch === v ? ' selected' : ''}>${v}mm${v === 6 ? '（B罫）' : v === 7 ? '（A罫）' : ''}</option>`).join('')}</select></label>
          <label class="ck" style="align-self:end;margin-bottom:6px"><input type="checkbox" data-g="dots"${s.dots ? ' checked' : ''}>ドット</label>
        </div>
        <label class="wse-field">欄外の見出し（上のまん中）<input data-g="head" value="${esc(headText(s, st.lesson))}"></label>
        <div class="wse-row wse-quick">
          <label class="ck"><input type="checkbox" data-g="matome"${hasEnd('まとめ') ? ' checked' : ''}>まとめ（枠つき）を付ける</label>
          <label class="ck"><input type="checkbox" data-g="furikaeri"${hasEnd('振り返り') ? ' checked' : ''}>振り返りを付ける</label>
        </div>
        <label class="ck" title="下のほうが空かないように、余った行を記入欄の大きさに比例して配ります"><input type="checkbox" data-g="fill"${s.fill !== false ? ' checked' : ''}>余った行を記入欄に配分する（バランス調整）</label>
      </div>
      <div class="wse-sec">
        <h3>ブロック <small>上から順に並びます（1行＝罫1本分）。押すと中身を編集できます</small></h3>
        ${listHTML(s.blocks, 'root')}
      </div>
      <details class="wse-sec wse-help"><summary>文字の書き方</summary>
        <ul><li><code>{{+8}}</code> … 空欄（生徒が書く）。中の字は「解答例を表示」のときに赤で出ます</li>
        <li><code>[[1/2]]</code> … 分数（上下2段）</li><li><code>x^2</code>・<code>10^{3}</code> … 累乗</li>
        <li><code>**大事**</code> … 太字</li><li>x・y・a など1文字の小文字は、自動で数式の字（斜体）になります</li></ul>
      </details>
      <div class="wse-sec wse-file">
        <button class="wse-mini" data-act="export">書き出す（JSON）</button>
        <button class="wse-mini" data-act="import">読み込む</button>
        <button class="wse-mini warn" data-act="reset">${sampleOf(st.id) ? '最初の形に戻す' : '下書きに戻す'}</button>
      </div>`;
  }
  // まとめ・振り返り（いちばん外側の記入欄）があるか
  const hasEnd = label => st.sheet.blocks.some(b => b.type === 'write' && (b.label || '') === label);
  function toggleEnd(label, on) {
    const bl = st.sheet.blocks;
    if (!on) { st.sheet.blocks = bl.filter(b => !(b.type === 'write' && (b.label || '') === label)); return; }
    if (hasEnd(label)) return;
    const nb = normBlock(label === 'まとめ'
      ? { type: 'write', label: 'まとめ', rows: 4, box: true, answer: (st.lesson && st.lesson.matome) || '' }
      : { type: 'write', label: '振り返り', rows: 3 });
    const fi = label === 'まとめ' ? bl.findIndex(b => b.type === 'write' && b.label === '振り返り') : -1;
    if (fi >= 0) bl.splice(fi, 0, nb); else bl.push(nb);
  }
  function listHTML(blocks, key) {
    return `<div class="wse-list" data-list="${esc(key)}">${blocks.map((b, i) => cardHTML(b, i, blocks.length)).join('')}${addHTML(key)}</div>`;
  }
  function addHTML(key) {
    const nested = key !== 'root';
    if (st.openAdd !== key) return `<button class="wse-add" data-addopen="${esc(key)}">＋ ブロックを追加</button>${!nested && window.WSETS ? '<button class="wse-add set" data-setopen>＋ セットで入れる・周辺の問題をさがす</button>' : ''}`;
    return `<div class="wse-addmenu">${ADD_MENU.filter(([k]) => !(nested && (k === 'cols' || k === 'break'))).map(([k, lb]) => `<button data-addtype="${k}" data-list="${esc(key)}">${lb}</button>`).join('')}<button class="x" data-addcancel>やめる</button></div>`;
  }
  function cardHTML(b, i, n) {
    const sel = st.sel === b.id;
    return `<div class="wsc wt-${b.type}${sel ? ' sel' : ''}" data-id="${b.id}">
      <div class="wsc-h" data-pick="${b.id}">
        <span class="wsc-ty">${esc(typeName(b))}</span><span class="wsc-sum">${esc(summary(b))}</span><span class="wsc-rows">${rowsText(b)}</span>
        <span class="wsc-ops">
          <button data-op="up" title="上へ"${i === 0 ? ' disabled' : ''}>↑</button><button data-op="down" title="下へ"${i === n - 1 ? ' disabled' : ''}>↓</button><button data-op="dup" title="複製">⧉</button><button data-op="del" title="削除">✕</button>
        </span>
      </div>
      ${sel ? `<div class="wsc-b">${fieldsHTML(b)}</div>` : ''}
      ${b.type === 'cols' ? `<div class="wsc-cols">${b.cols.map((c, ci) => `<div class="wsc-col"><div class="wsc-colh">${b.cols.length === 4 ? ['1つ目', '2つ目', '3つ目', '4つ目'][ci] : b.cols.length === 3 ? ['左', 'まん中', '右'][ci] : ['左', '右'][ci]}の列</div>${listHTML(c.blocks, b.id + ':' + ci)}</div>`).join('')}</div>` : ''}
    </div>`;
  }
  function fieldsHTML(b) {
    const inp = (label, name, val, cls) => `<label class="wse-field${cls ? ' ' + cls : ''}">${label}<input data-f="${name}" value="${esc(val == null ? '' : val)}"></label>`;
    const area = (label, name, val, rows, ph) => `<label class="wse-field">${label}<textarea data-f="${name}" rows="${rows || 2}" placeholder="${esc(ph || '')}">${esc(val || '')}</textarea></label>`;
    const nm = (label, name, val, min, max) => `<label class="wse-field sm">${label}<input type="number" data-f="${name}" value="${esc(val)}" min="${min || 1}" max="${max || 40}"></label>`;
    const ck = (label, name, val) => `<label class="ck"><input type="checkbox" data-f="${name}"${val ? ' checked' : ''}>${label}</label>`;
    const txtTypes = ['meate', 'kadai', 'text', 'write'];
    const typeSel = txtTypes.includes(b.type) ? `<label class="wse-field sm">種類<select data-f="type">${txtTypes.map(t => `<option value="${t}"${b.type === t ? ' selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}</select></label>` : '';
    switch (b.type) {
      case 'meate': return `<div class="wse-row">${typeSel}${inp('ラベル（めあて／基礎・基本／標準 など）', 'label', b.label == null ? 'めあて' : b.label, 'sm')}${nm('行数（最小）', 'rows', b.rows || 1)}</div>${area('めあての文', 'text', b.text, 2)}${ck('空欄にする（生徒が書く。文は解答例として赤で出る）', 'blank', b.blank)}`;
      case 'kadai': return `<div class="wse-row">${typeSel}${inp('ラベル', 'label', b.label == null ? '課題' : b.label, 'sm')}${nm('行数（最小）', 'rows', b.rows || 1)}</div>${area('本文', 'text', b.text, 3, '{{答え}} と書くと空欄になります')}<div class="wse-row">${ck('枠で囲む', 'box', b.box !== false)}${ck('空欄にする', 'blank', b.blank)}</div>`;
      case 'text': return `<div class="wse-row">${typeSel}${inp('ラベル（なくてもよい）', 'label', b.label, 'sm')}${nm('行数（最小）', 'rows', b.rows || 1)}</div>${area('本文', 'text', b.text, 3, '{{答え}} と書くと空欄になります')}`;
      case 'write': return `<div class="wse-row">${typeSel}${inp('ラベル', 'label', b.label, 'sm')}${nm('行数', 'rows', b.rows || 1)}</div>${inp('書き出し・発問（なくてもよい。印刷される）', 'prompt', b.prompt)}${area('解答例（「解答例を表示」のときだけ赤で出る）', 'answer', b.answer, 3)}${ck('枠で囲む', 'box', b.box)}`;
      case 'table': return `<div class="wse-row">${nm('表の幅（％）', 'width', b.width || 100, 20, 100)}</div>
        <div class="wse-trows">${(b.rows || []).map((r, i) => `<div class="wse-trow">
          <input class="h" data-row="${i}" data-rf="h" value="${esc(r.h)}" placeholder="見出し">
          <input class="c" data-row="${i}" data-rf="cells" value="${esc(r.cells)}" placeholder="値を空白（または |）で区切る。{{5}} は空欄">
          <label class="ck" title="この行を空欄にして、値は解答例にします"><input type="checkbox" data-row="${i}" data-rf="blank"${r.blank ? ' checked' : ''}>空欄</label>
          <label class="ck" title="見出しの行（太字・灰色）にします"><input type="checkbox" data-row="${i}" data-rf="head"${r.head ? ' checked' : ''}>見出し</label>
          <button data-op="row-del" data-row="${i}" title="この行を消す">✕</button></div>`).join('')}</div>
        <button class="wse-mini" data-op="row-add">＋ 行を追加</button>`;
      case 'figure': return `<div class="wse-row">${nm('行数（高さ）', 'rows', b.rows || 4, 1, 40)}</div>${b.figs.map((f, i) => figFields(f, i, b.figs.length)).join('')}<button class="wse-mini" data-op="fig-add">＋ 図を横に並べる</button>`;
      case 'cols': return `<div class="wse-row"><label class="wse-field sm">列の幅<select data-f="ratio">${['1:1', '2:1', '1:2', '3:2', '2:3', '1:1:1'].map(r => `<option${(b.ratio || '1:1') === r ? ' selected' : ''}>${r}</option>`).join('')}</select></label></div><p class="wse-note">下の各列の「＋ブロックを追加」で中身を入れます。</p>`;
      case 'break': return `<p class="wse-note">ここから次のページ（2枚目）になります。</p>`;
    }
    return '';
  }
  function figFields(f, i, n) {
    const inp = (lb, k, v) => `<label class="wse-field sm">${lb}<input data-ff="${k}" data-fig="${i}" value="${esc(v == null ? '' : v)}"></label>`;
    const area = (lb, k, v, ph) => `<label class="wse-field">${lb}<textarea data-ff="${k}" data-fig="${i}" rows="2" placeholder="${esc(ph)}">${esc(v || '')}</textarea></label>`;
    const ck = (lb, k, v) => `<label class="ck"><input type="checkbox" data-ff="${k}" data-fig="${i}"${v ? ' checked' : ''}>${lb}</label>`;
    const kind = f.kind || 'coord';
    let h = `<div class="wse-fig"><div class="wse-row">
      <label class="wse-field sm">図${n > 1 ? i + 1 : ''}の種類<select data-ff="kind" data-fig="${i}">${FIG_KINDS.map(([k, lb]) => `<option value="${k}"${kind === k ? ' selected' : ''}>${lb}</option>`).join('')}</select></label>
      ${inp('見出し', 'caption', f.caption)}
      ${n > 1 ? `<button data-op="fig-del" data-fig="${i}" title="この図を消す">✕</button>` : ''}</div>`;
    if (kind === 'numline') h += `<div class="wse-row">${inp('左はし', 'min', f.min == null ? -10 : f.min)}${inp('右はし', 'max', f.max == null ? 10 : f.max)}${inp('数字を書く間隔', 'label', f.label == null ? 5 : f.label)}</div>
      ${area('矢印（解答例）', 'arrows', f.arrows, '例：3→8 +5（1行に1本）')}${inp('○で囲む答え（解答例）', 'marks', f.marks)}`;
    else if (kind === 'geo') h += geoFields(f, i, inp, area);
    else if (kind === 'solid') h += solidFields(f, i, inp, area, ck);
    else if (kind === 'chart') h += chartFields(f, i, inp, area, ck);
    else if (kind === 'image') h += `<div class="wse-row"><label class="wse-mini file">画像を選ぶ<input type="file" accept="image/*" data-img="${i}" hidden></label>${f.src ? `<button class="wse-mini" data-op="img-clear" data-fig="${i}">画像を外す</button>` : ''}</div><p class="wse-note">図形の図などは画像（PNG・JPEG）で入れられます。大きさは行数で調整します。</p>`;
    else h += `<div class="wse-row">${inp('x の最小', 'xmin', f.xmin == null ? -5 : f.xmin)}${inp('x の最大', 'xmax', f.xmax == null ? 5 : f.xmax)}${inp('y の最小', 'ymin', f.ymin == null ? -5 : f.ymin)}${inp('y の最大', 'ymax', f.ymax == null ? 5 : f.ymax)}</div>
      ${area('グラフの式', 'lines', f.lines, '例：y=2x、y=-1/2x+3、y=6/x、y=2x^2（1行に1つ。「y=x #（1）」で名前を（1）に、「#」だけで名前なし。「y=2x+2 [-3,2]」で x の範囲を限る）')}${ck('式のグラフをはじめから印刷する（オフなら解答例）', 'linesGiven', f.linesGiven)}
      ${area('はじめから印刷しておくグラフの式（答えのグラフと重ねたいとき）', 'glines', f.glines, '例：y=2x')}
      ${area('点', 'points', f.points, '例：(1,2) (2,4)　A(4,3) のように名前もつけられる')}${ck('点をはじめから印刷する（オフなら解答例）', 'pointsGiven', f.pointsGiven)}
      ${area('答えの折れ線（解答例。点を順につなぐ）', 'apath', f.apath, '例：(1,1) Q(2,1) (2,5)（1行に1本）')}`;
    return h + '</div>';
  }

  const GEO_HELP = `<details class="wse-geohelp"><summary>図形の書き方（1行に1つ）</summary><ul>
    <li><code>点 A 0 0</code> 点と名前（座標は好きな単位。<code>上</code>・<code>右下</code>などで名前の位置）／<code>頂点 A 0 0</code> は点を打たずに名前だけ</li>
    <li>● は自動：頂点・交点・線のはしにはかかず、線の途中の点・はなれた点・円の中心にだけかく。かならずかきたい点は <code>点 A 0 0 ●</code></li>
    <li><code>点 M 中点 A B</code>／<code>点 P 極 O 3 60</code>（Oから3、60°の向き）／同じ名前を2か所に書くときは <code>A_2</code>（「A」と表示）</li>
    <li><code>線分 A B 5cm</code>（長さの字は省略可）・<code>直線 A B</code>・<code>半直線 A B</code>・<code>矢印 A B</code>・<code>折れ線 A B C</code></li>
    <li><code>多角形 A B C</code>・<code>円 O 3</code>・<code>弧 O 3 0 90</code>・<code>おうぎ形 O 3 0 120</code>・<code>だ円 O 3 1</code>（<code>だ円 O 3 1 0 180</code> で上半分）</li>
    <li><code>角 B A C 60°</code>（<code>角 B A C 20° 右</code> のように向きを書くと、角度を図の外側に書く）・<code>直角 B A C</code>・<code>印 A B 2</code>（等しい長さの印）・<code>文字 2 3 ことば</code></li>
    <li><code>長さ A B 5cm</code> 線分の両はしを点線の弧でむすんで、まん中に長さを書く（<code>下</code>・<code>左</code>などで弧の向き、<code>大</code> で弧を大きく）</li>
    <li><code>方眼 1</code>・<code>点格子 1</code>・<code>範囲 0 0 10 6</code>・<code>縮尺 10</code>（1目もり＝10mm）</li>
    <li>行の終わりに <code>点線</code> <code>太</code> <code>細</code> <code>塗り</code> <code>灰</code>。行の先頭に <code>*</code> をつけると解答例（赤）</li></ul></details>`;
  function geoFields(f, i, inp, area) {
    return `<label class="wse-field">図形<textarea data-ff="src" data-fig="${i}" rows="8" spellcheck="false">${esc(f.src || '')}</textarea></label>${GEO_HELP}`;
  }
  function solidFields(f, i, inp, area, ck) {
    const sh = f.shape || 'cube', lab = { cube: ['1辺', '', ''], cuboid: ['横', '奥行き', '高さ'], prism: ['底面の1辺', '', '高さ'], pyramid: ['底面の1辺', '', '高さ'], cylinder: ['半径', '', '高さ'], cone: ['半径', '', '高さ'], sphere: ['半径', '', ''], hemisphere: ['半径', '', ''] }[sh] || ['a', 'b', 'c'];
    return `<div class="wse-row"><label class="wse-field sm">立体<select data-ff="shape" data-fig="${i}">${[['cube', '立方体'], ['cuboid', '直方体'], ['prism', '角柱'], ['pyramid', '角錐'], ['cylinder', '円柱'], ['cone', '円錐'], ['sphere', '球'], ['hemisphere', '半球']].map(([k, lb]) => `<option value="${k}"${sh === k ? ' selected' : ''}>${lb}</option>`).join('')}</select></label>
      ${lab[0] ? inp(lab[0], 'a', f.a == null ? 4 : f.a) : ''}${lab[1] ? inp(lab[1], 'b', f.b == null ? 3 : f.b) : ''}${lab[2] ? inp(lab[2], 'c', f.c == null ? 4 : f.c) : ''}${sh === 'prism' || sh === 'pyramid' ? inp('底面の角の数', 'n', f.n == null ? (sh === 'prism' ? 3 : 4) : f.n) : ''}</div>
      ${['cube', 'cuboid', 'prism', 'pyramid'].includes(sh) ? `<div class="wse-row">${inp('頂点の名前（上の面→下の面／角錐は頂点→底面）', 'labels', f.labels)}</div>${inp('太く赤で示す辺（解答例）例：AB CG', 'hl', f.hl)}${inp('図に入れておく線（対角線など）例：BH', 'diag', f.diag)}` : ''}
      ${area('長さの字（1行に1つ）', 'dims', f.dims, sh === 'cylinder' || sh === 'cone' ? '例：r 3cm／h 6cm' : sh === 'sphere' || sh === 'hemisphere' ? '例：r 3cm' : '例：AB 5cm')}
      ${ck('見えない辺を点線でかく', 'hidden', f.hidden !== 'none')}`;
  }
  function chartFields(f, i, inp, area, ck) {
    return `<div class="wse-row">${inp('横 最小', 'xmin', f.xmin == null ? 0 : f.xmin)}${inp('横 最大', 'xmax', f.xmax == null ? 10 : f.xmax)}${inp('横の目もり（階級の幅）', 'xstep', f.xstep == null ? 1 : f.xstep)}</div>
      <div class="wse-row">${inp('縦 最小', 'ymin', f.ymin == null ? 0 : f.ymin)}${inp('縦 最大', 'ymax', f.ymax == null ? 10 : f.ymax)}${inp('縦の目もり', 'ystep', f.ystep == null ? 1 : f.ystep)}</div>
      <div class="wse-row">${inp('横の見出し', 'xname', f.xname)}${inp('縦の見出し', 'yname', f.yname)}</div>
      ${inp('ヒストグラムの度数（左の階級から空白で区切る）', 'bars', f.bars)}<div class="wse-row">${ck('ヒストグラムをはじめから印刷する（オフなら解答例）', 'barsGiven', f.barsGiven)}${ck('度数折れ線もかく', 'poly', f.poly)}</div>
      ${area('折れ線グラフの点', 'points', f.points, '例：(10,0.6) (20,0.55)')}${ck('点をはじめから印刷する（オフなら解答例）', 'pointsGiven', f.pointsGiven)}
      ${area('2本目の折れ線（点線）', 'points2', f.points2, '例：(10,0.4) (20,0.45)')}${ck('2本目をはじめから印刷する（オフなら解答例）', 'points2Given', f.points2Given)}`;
  }

  /* --- 変更・元に戻す・保存 --- */
  function snapshot() {
    const s = JSON.stringify(st.sheet);
    if (st.hist[st.hi] === s) return;
    st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(s);
    if (st.hist.length > 120) st.hist.shift();
    st.hi = st.hist.length - 1; undoBtns();
  }
  const flushSnap = () => { if (st.snapT) { clearTimeout(st.snapT); st.snapT = null; snapshot(); } };
  function undoBtns() { if (!wrap) return; $('#wsUndo', wrap).disabled = st.hi <= 0; $('#wsRedo', wrap).disabled = st.hi >= st.hist.length - 1; }
  function undo(d) {
    flushSnap();
    const k = st.hi + d; if (k < 0 || k >= st.hist.length) return;
    st.hi = k; st.sheet = JSON.parse(st.hist[k]);
    if (st.sel && !locate(st.sel)) st.sel = null;
    renderAll(); scheduleSave();
  }
  function changed(structural) {
    if (structural) { renderPanel(); renderPreview(); snapshot(); }
    else { previewSoon(); clearTimeout(st.snapT); st.snapT = setTimeout(() => { st.snapT = null; snapshot(); }, 700); }
    scheduleSave();
  }
  function scheduleSave() { clearTimeout(st.saveT); setStatus('編集中…'); st.saveT = setTimeout(doSave, 900); }
  async function doSave() {
    st.saveT = null;
    const id = st.id, sheet = st.sheet; if (!id || !sheet) return;
    const r = await save(id, sheet);
    if (st.id !== id) return;
    if (r === 'file') { st.source = 'saved'; setStatus('保存しました（worksheets フォルダ）', 'ok'); }
    else if (r === 'local') { st.source = 'local'; setStatus('保存しました（このブラウザ）', 'ok'); }
    else setStatus('保存できませんでした', 'bad');
  }
  function flushSave() { if (st.saveT) { clearTimeout(st.saveT); doSave(); } }

  function reid(b) { b = clone(b); const walk = x => { x.id = uid(); if (x.type === 'cols') x.cols.forEach(c => c.blocks.forEach(walk)); }; walk(b); return b; }
  function convert(b, t) {
    if (t === b.type) return;
    const text = b.type === 'write' ? (b.prompt || b.answer || '') : (b.text || '');
    const keep = { id: b.id, rows: b.rows };
    Object.keys(b).forEach(k => delete b[k]);
    Object.assign(b, keep, { type: t });
    if (t === 'write') Object.assign(b, { label: '', prompt: text, rows: Math.max(2, num(keep.rows, 2)) });
    else Object.assign(b, { text }, t === 'kadai' ? { label: '課題' } : {});
  }
  function doOp(op, card, el) {
    const r = locate(card.dataset.id); if (!r) return;
    const b = r.b;
    if (op === 'up' || op === 'down') {
      const j = r.i + (op === 'up' ? -1 : 1); if (j < 0 || j >= r.list.length) return;
      [r.list[r.i], r.list[j]] = [r.list[j], r.list[r.i]];
    } else if (op === 'dup') { const c = reid(b); r.list.splice(r.i + 1, 0, c); st.sel = c.id; }
    else if (op === 'del') { r.list.splice(r.i, 1); if (st.sel === b.id) st.sel = null; }
    else if (op === 'row-add') b.rows.push({ h: '', cells: '', blank: true });
    else if (op === 'row-del') b.rows.splice(+el.dataset.row, 1);
    else if (op === 'fig-add') b.figs.push({ kind: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5 });
    else if (op === 'fig-del') b.figs.splice(+el.dataset.fig, 1);
    else if (op === 'img-clear') delete b.figs[+el.dataset.fig].src;
    changed(true);
  }
  function addBlock(key, type) {
    const list = listByKey(key); if (!list || !DEFAULTS[type]) return;
    const nb = normBlock(DEFAULTS[type]()), r = st.sel ? locate(st.sel) : null;
    list.splice(r && r.list === list ? r.i + 1 : list.length, 0, nb);
    st.sel = nb.id; st.openAdd = null;
    changed(true);
    const c = $(`.wsc[data-id="${nb.id}"]`, panel); if (c) c.scrollIntoView({ block: 'nearest' });
  }
  function select(id, from) {
    st.sel = st.sel === id && from === 'panel' ? null : id;
    renderPanel(); renderPreview();
    if (window.WSETS) window.WSETS.refresh();
    if (st.sel && from !== 'panel') { const c = $(`.wsc[data-id="${st.sel}"]`, panel); if (c) c.scrollIntoView({ block: 'nearest' }); }
    if (st.sel && from === 'panel') { const e = $(`[data-b="${st.sel}"]`, pagesEl); if (e) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  function setField(el) {
    const card = el.closest('.wsc');
    const val = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.g) {
      const k = el.dataset.g, s = st.sheet;
      if (k === 'paper') s.paper = val; else if (k === 'pitch') s.pitch = num(val, 7); else if (k === 'dots') s.dots = !!val;
      else if (k === 'head') s.head = val;
      else if (k === 'matome' || k === 'furikaeri') toggleEnd(k === 'matome' ? 'まとめ' : '振り返り', !!val);
      else if (k === 'fill') s.fill = !!val;
      changed(k !== 'head');
      return;
    }
    if (!card) return;
    const r = locate(card.dataset.id); if (!r) return;
    const b = r.b;
    if (el.dataset.f) {
      const k = el.dataset.f;
      if (k === 'type') { convert(b, val); changed(true); return; }
      if (k === 'ratio') {
        b.ratio = val; const n = val.split(':').length;
        while (b.cols.length < n) b.cols.push({ blocks: [] });
        while (b.cols.length > n) { const extra = b.cols.pop(); b.cols[b.cols.length - 1].blocks.push(...extra.blocks); }
        changed(true); return;
      }
      b[k] = el.type === 'number' ? Math.max(1, Math.min(60, Math.round(num(val, 1)))) : val;
      if (k === 'width') b.width = Math.max(20, Math.min(100, num(val, 100)));
    } else if (el.dataset.rf) {
      const row = b.rows[+el.dataset.row]; if (!row) return;
      row[el.dataset.rf] = val;
    } else if (el.dataset.ff) {
      const f = b.figs[+el.dataset.fig]; if (!f) return;
      f[el.dataset.ff] = el.dataset.ff === 'hidden' ? (val ? 'dash' : 'none') : val;
      if (el.dataset.ff === 'kind' || el.dataset.ff === 'shape') { changed(true); return; }
    } else return;
    const sum = $('.wsc-sum', card), rw = $('.wsc-rows', card);
    if (sum && card.dataset.id === b.id) { sum.textContent = summary(b); if (rw) rw.textContent = rowsText(b); }
    changed(el.type === 'checkbox' || el.tagName === 'SELECT');
  }
  function bindUI() {
    panel.addEventListener('click', e => {
      const t = e.target;
      const addOpen = t.closest('[data-addopen]'); if (addOpen) { st.openAdd = addOpen.dataset.addopen; renderPanel(); return; }
      const addType = t.closest('[data-addtype]'); if (addType) { addBlock(addType.dataset.list, addType.dataset.addtype); return; }
      if (t.closest('[data-addcancel]')) { st.openAdd = null; renderPanel(); return; }
      if (t.closest('[data-setopen]')) { if (window.WSETS) window.WSETS.open(); return; }
      const opEl = t.closest('[data-op]'); if (opEl) { e.stopPropagation(); doOp(opEl.dataset.op, opEl.closest('.wsc'), opEl); return; }
      const act = t.closest('[data-act]'); if (act) { fileAct(act.dataset.act); return; }
      const pick = t.closest('[data-pick]'); if (pick && !t.closest('input,select,textarea,label')) { select(pick.dataset.pick, 'panel'); return; }
    });
    panel.addEventListener('input', e => { if (e.target.matches('input:not([type=checkbox]):not([type=file]),textarea')) setField(e.target); });
    panel.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('input[type=file][data-img]')) { readImage(t); return; }
      if (t.matches('select,input[type=checkbox]')) setField(t);
    });
    pagesEl.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) select(b.dataset.b, 'preview'); });
    $('#wsUndo', wrap).addEventListener('click', () => undo(-1));
    $('#wsRedo', wrap).addEventListener('click', () => undo(1));
    $('#wsAns', wrap).addEventListener('change', e => { st.ans = e.target.checked; if (st.all) pagesEl.classList.toggle('ans-on', st.ans); else renderPreview(); });
    $('#wsPrint', wrap).addEventListener('click', () => { flushSave(); window.print(); });
    $('#wsImport', wrap).addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      f.text().then(txt => {
        const o = JSON.parse(txt);
        if (!o || !Array.isArray(o.blocks)) throw new Error('blocks がありません');
        st.sheet = normalize(o); st.sel = null; changed(true);
      }).catch(err => alert('読み込めませんでした：' + err.message));
    });
    window.addEventListener('resize', () => { if (!wrap.hidden && st.sheet && !st.all) fitZoom(); });
    document.addEventListener('keydown', e => {
      if (!wrap || wrap.hidden) return;
      const inField = e.target.matches('input,textarea,select');
      if (e.key === 'Escape' && !inField) { e.preventDefault(); location.hash = st.all ? '#/units/' + st.all : `#/lesson/${st.lid || st.id}/${kindOf(st.kind)}`; return; }
      if ((e.metaKey || e.ctrlKey) && !inField && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) {
        e.preventDefault(); undo(e.key === 'y' || e.shiftKey ? 1 : -1);
      }
    });
  }
  function readImage(input) {
    const card = input.closest('.wsc'), r = card && locate(card.dataset.id), f = input.files && input.files[0];
    if (!r || !f) return;
    if (f.size > 3 * 1024 * 1024) { alert('3MB 以下の画像にしてください。'); return; }
    const fr = new FileReader();
    fr.onload = () => { const fig = r.b.figs[+input.dataset.img]; if (fig) { fig.src = fr.result; changed(true); } };
    fr.readAsDataURL(f);
  }
  async function fileAct(act) {
    if (act === 'export') {
      const data = Object.assign({}, st.sheet, { draft: false, lesson: st.id });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `worksheet-${st.id}.json`; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } else if (act === 'import') $('#wsImport', wrap).click();
    else if (act === 'reset') {
      if (!confirm(`${sampleOf(st.id) ? '最初の形' : (st.kind === 'dr' || st.kind === 'qz' ? 'ひな形' : '自動の下書き')}に戻します。今の内容は消えます（書き出しておくと、あとで読み込めます）。よろしいですか？`)) return;
      clearTimeout(st.saveT); st.saveT = null;
      const id = st.id;
      await resetSaved(id);
      const r = await load(id);
      if (st.id !== id) return;
      st.sheet = r.sheet; st.source = r.source; st.sel = null; st.hist = []; st.hi = -1;
      snapshot(); renderAll(); setStatus(sourceText(r.source));
    }
  }

  // 最初の形のワークシートを全部並べて、行があふれていないか調べる（点検用）
  function checkAll(ids, kind) {
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-20000px;top:0;visibility:hidden';
    box.className = 'ans-on'; document.body.appendChild(box);
    const src = KIND[kindOf(kind)].src;
    const out = (ids || Object.keys(src)).map(id => {
      const sheet = normalize(clone(src[id])); box.innerHTML = pagesHTML(sheet, lessonById[id]);
      const m = measure(box, sheet);
      const ovf = $$('.wb-w.ovf', box), ex = computeExtras(sheet, lessonById[id]) || {};
      return { id, base: ex._base || m.used, added: ex._added || 0, used: m.used, rows: m.rows, over: m.used.some(u => u > m.rows), ansOver: ovf.length, ansWhere: ovf.map(w => w.textContent.replace(/\s+/g, ' ').slice(0, 36)) };
    });
    box.remove(); return out;
  }
  refreshKnown();
  window.WSX = {
    open, openAll, close, isOpen: () => !!(wrap && !wrap.hidden), paneHTML, fillPane, pagesHTML, load: (id, kind) => load(keyOf(id, kind)), checkAll,
    has: id => known.has(id), onKnown: fn => { knownCb = fn; },
    inl, figSVG,   // 電子黒板用スライド（js/slides.js）が、同じ書き方の文字と図を使う
    _ed: { st, locate, normBlock, reid, changed, blockHTML, geo, stripMarks, cellsOf, withEx, panelEl: () => panel, select },   // セットで入れる（js/sets.js）が使う
    hasDrill: id => !!DRILLS[id] || known.has(DR + id),   // 問題演習プリントがある時間か
    drillCount: unitKey => (D.lessons || []).filter(l => l.unit === unitKey && (DRILLS[l.id] || known.has(DR + l.id))).length,
    hasQuiz: id => hasKind(id, 'qz'),   // 小テストがある時間か
    quizCount: unitKey => (D.lessons || []).filter(l => l.unit === unitKey && hasKind(l.id, 'qz')).length
  };
})();
