/* 高校数学 黒板解説（声なし・キャラクターなし）の再生役。 play.html?s=<ID> で scenes/<ID>.js（HB.lesson({...})）を読む。
   キー：Enter/Space/→＝つぎへ（書いている途中なら、まず書き終える）、←/Backspace＝もどる、1〜4＝選択肢、H＝ヒント、Q＝問題文、A＝自動で進む、Esc＝閉じる。
   黒板はステップごとに「そのページの最初から今のステップまで」を組み立て直す（もどる・つづきからが、いつも同じ形になる）。新しく足した物だけ、チョークで書くように出す。
   台本の書き方は README.md。 */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const q = new URLSearchParams(location.search), ID = q.get('s') || '';
  const SW = 1600, SH = 900;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 記録できなくても進める */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* 同上 */ } }
  };
  const COL = { w: '#f4f3ea', y: '#ffe27a', p: '#ff9db2', b: '#9ad8ff', g: '#9ff0b8', o: '#ffc078', d: 'rgba(244,243,234,.42)' };
  const col = c => COL[c] || c || COL.w;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- 数式（KaTeX）と、字のかざり ----------
     $…$ は文中の数式、$$…$$ は大きい数式。{{…}} は答えの色（桃）、[[y:…]] [[b:…]] [[g:…]] は黄・青・緑、**…** は太字、改行は \n。
     数式の中では \ans{…}（桃）\hy{…}（黄）\hb{…}（青）\hg{…}（緑）で色をつけられる。 */
  const MACROS = { '\\ans': '\\textcolor{ff9db2}{#1}', '\\hy': '\\textcolor{ffe27a}{#1}', '\\hb': '\\textcolor{9ad8ff}{#1}', '\\hg': '\\textcolor{9ff0b8}{#1}' };   // 色は # なし（マクロの中の # は引数の印になるため）
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function tex(s, display) {
    if (!window.katex) return '<code>' + esc(s) + '</code>';
    try { return katex.renderToString(String(s), { displayMode: !!display, throwOnError: false, strict: 'ignore', macros: Object.assign({}, MACROS) }); }
    catch (e) { return '<span class="katex-error">' + esc(s) + '</span>'; }
  }
  function rich(s) {
    if (s == null) return '';
    const parts = [];
    let t = String(s).replace(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g, (m, d, i) => { parts.push(d != null ? tex(d, true) : tex(i, false)); return '\u0001' + (parts.length - 1) + '\u0002'; });
    t = esc(t).replace(/\{\{([\s\S]+?)\}\}/g, '<span class="ans">$1</span>')
      .replace(/\[\[([ybg]):([\s\S]+?)\]\]/g, (m, c, x) => '<span class="' + c + c + '">' + x + '</span>')
      .replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    return t.replace(/\u0001(\d+)\u0002([。、，．）」]*)/g, (m, n, pu) => pu ? '<span class="nw">' + parts[+n] + pu + '</span>' : parts[+n]);   // 数式の直後の句読点だけが次の行へ落ちないように
  }
  const plainLen = s => String(s || '').replace(/\$[^$]*\$/g, 'xxxx').replace(/[{}*\[\]]/g, '').length;

  /* ---------- 図（SVG。座標は数学の座標で、y が上） ---------- */
  let figs = {};
  function svgEl(tag, a, parent) { const e = document.createElementNS(NS, tag); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function makeFig(it, host) {
    const [x0, y0, x1, y1] = it.view, w = it.w || 640, h = it.h || 420;
    const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, host);
    const cid = 'clip-' + it.id + '-' + Math.random().toString(36).slice(2, 7);
    const defs = svgEl('defs', {}, svg), cp = svgEl('clipPath', { id: cid }, defs); svgEl('rect', { x: -3, y: -3, width: w + 6, height: h + 6 }, cp);
    const f = { id: it.id, svg, w, h, x0, y0, x1, y1, cid, X: x => (x - x0) / (x1 - x0) * w, Y: y => (y1 - y) / (y1 - y0) * h };
    figs[it.id] = f; return f;
  }
  const fnOf = s => typeof s === 'function' ? s : new Function('x', 'with (Math) { return (' + s + '); }');   // 台本の中の式（自分で書いたものだけ）
  const DIRS = { n: [0, -1], ne: [.72, -.72], e: [1, 0], se: [.72, .72], s: [0, 1], sw: [-.72, .72], w: [-1, 0], nw: [-.72, -.72], c: [0, 0] };
  function label(g, X, Y, text, o) {   // 英字は斜体のセリフ体（数学の文字らしく）、ほかはふつうの字
    o = o || {};
    const t = svgEl('text', { x: X, y: Y, fill: col(o.c), 'font-size': o.size || 26, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'central',
      'font-family': '"Klee One","Hiragino Maru Gothic ProN",sans-serif', 'font-weight': 600 }, g);
    String(text).split(/([A-Za-z]+)/).forEach((run, i) => {
      if (!run) return;
      const sp = svgEl('tspan', {}, t);
      if (i % 2 === 1 && !o.plain) { sp.setAttribute('font-family', '"Times New Roman",Times,serif'); sp.setAttribute('font-style', 'italic'); sp.setAttribute('font-size', (o.size || 26) * 1.12); sp.setAttribute('font-weight', 400); }
      sp.textContent = run;
    });
    return t;
  }
  function arrowHead(g, A, B, c, s) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; s = s || 15;
    const p1 = [B[0] - ux * s - uy * s * 0.5, B[1] - uy * s + ux * s * 0.5], p2 = [B[0] - ux * s + uy * s * 0.5, B[1] - uy * s - ux * s * 0.5];
    return svgEl('polygon', { points: [B, p1, p2].map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), fill: col(c) }, g);
  }
  function curvePts(f, F, a, b, n) {   // 関数のグラフの点（見える範囲を少しこえた所で切る）
    const my = (f.y1 - f.y0) * 0.1, out = [[]]; n = n || 280;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = F(x);
      if (!isFinite(y) || y < f.y0 - my || y > f.y1 + my) { if (out[out.length - 1].length) out.push([]); continue; }
      out[out.length - 1].push([f.X(x), f.Y(y)]);
    }
    return out.filter(s => s.length > 1);
  }
  const pathOf = segs => segs.map(s => 'M' + s.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')).join('');
  /* 図の部品。p.k：axes／fn／line／area／seg／vec／poly／pt／label／arc／dot（小さい点）。色 c は w/y/p/b/g/o/d。
     返すのは、書く順の [{el, kind}]（kind：stroke＝線を引くように、fade＝ふわっと出す） */
  function drawPrim(f, p) {
    const g = svgEl('g', { 'data-id': p.id || null }, f.svg), out = [], c = col(p.c), wd = p.wd || 3;
    const line = (A, B, o) => { o = o || {}; const e = svgEl('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: o.c || c, 'stroke-width': o.wd || wd, 'stroke-linecap': 'round', 'stroke-dasharray': o.dash ? '9 9' : null }, g); out.push({ el: e, kind: o.kind || (o.dash ? 'fade' : 'stroke') }); return e; };
    const stroke = (d, o) => { o = o || {}; const e = svgEl('path', { d, fill: 'none', stroke: o.c || c, 'stroke-width': o.wd || wd, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash ? '9 9' : null, 'clip-path': o.clip ? `url(#${f.cid})` : null }, g); out.push({ el: e, kind: o.dash ? 'fade' : 'stroke' }); return e; };
    const lab = (X, Y, text, o) => { const e = label(g, X, Y, text, Object.assign({ c: p.c }, o)); out.push({ el: e, kind: (o && o.kind) || 'fade' }); return e; };
    const P = a => [f.X(a[0]), f.Y(a[1])];
    switch (p.k) {
      case 'axes': {
        const ox = f.X(0), oy = f.Y(0), cc = p.c || 'd';
        line([f.X(f.x0), oy], [f.X(f.x1) - 4, oy], { c: col(cc), wd: 2.5, kind: 'axis' }); out.push({ el: arrowHead(g, [0, oy], [f.X(f.x1), oy], cc, 13), kind: 'fade' });
        line([ox, f.Y(f.y0)], [ox, f.Y(f.y1) + 4], { c: col(cc), wd: 2.5, kind: 'axis' }); out.push({ el: arrowHead(g, [ox, f.h], [ox, f.Y(f.y1)], cc, 13), kind: 'fade' });
        lab(f.X(f.x1) - 4, oy + 22, p.xl || 'x', { c: cc, size: 24, kind: 'quick' }); lab(ox + 18, f.Y(f.y1) + 8, p.yl || 'y', { c: cc, size: 24, kind: 'quick' });
        if (p.o !== false) lab(ox - 16, oy + 18, 'O', { c: cc, size: 22, kind: 'quick' });
        (p.tx || []).forEach(v => { const [x, s] = Array.isArray(v) ? v : [v, String(v)]; line([f.X(x), oy - 6], [f.X(x), oy + 6], { c: col(cc), wd: 2, kind: 'quick' }); lab(f.X(x), oy + 22, s, { c: cc, size: 21, kind: 'quick' }); });   // 目もりは、まとめてすぐ出す
        (p.ty || []).forEach(v => { const [y, s] = Array.isArray(v) ? v : [v, String(v)]; line([ox - 6, f.Y(y)], [ox + 6, f.Y(y)], { c: col(cc), wd: 2, kind: 'quick' }); lab(ox - 12, f.Y(y), s, { c: cc, size: 21, anchor: 'end', kind: 'quick' }); });
        break;
      }
      case 'fn': {   // y＝f(x)。f は 'x**3-6*x**2+9*x' のような式
        const F = fnOf(p.f), a = p.a != null ? p.a : f.x0, b = p.b != null ? p.b : f.x1;
        stroke(pathOf(curvePts(f, F, a, b)), { dash: p.dash, clip: true });
        if (p.label) lab(f.X(p.lat[0]), f.Y(p.lat[1]), p.label, { anchor: p.la || 'start', size: p.size || 24 });
        break;
      }
      case 'line': {   // y＝mx＋n（x＝c の縦線は {k:'line', x:c}）
        if (p.x != null) stroke(`M${f.X(p.x)} ${f.Y(f.y0)}L${f.X(p.x)} ${f.Y(f.y1)}`, { dash: p.dash });
        else { const a = p.a != null ? p.a : f.x0, b = p.b != null ? p.b : f.x1; stroke(pathOf(curvePts(f, x => p.m * x + p.n, a, b, 2)), { dash: p.dash, clip: true }); }
        if (p.label) lab(f.X(p.lat[0]), f.Y(p.lat[1]), p.label, { anchor: p.la || 'start', size: p.size || 24 });
        break;
      }
      case 'area': {   // 2つのグラフ f（上）と g（下、ないときは x 軸）にはさまれた所をぬる
        const F = fnOf(p.f), G = fnOf(p.g || '0'), n = 160, pts = [];
        for (let i = 0; i <= n; i++) { const x = p.a + (p.b - p.a) * i / n; pts.push([f.X(x), f.Y(F(x))]); }
        for (let i = n; i >= 0; i--) { const x = p.a + (p.b - p.a) * i / n; pts.push([f.X(x), f.Y(G(x))]); }
        const e = svgEl('polygon', { points: pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '), fill: col(p.c || 'y'), 'fill-opacity': p.alpha || 0.28, stroke: 'none', 'clip-path': `url(#${f.cid})` }, g);
        out.push({ el: e, kind: 'fade' });
        if (p.label) lab(f.X(p.lat[0]), f.Y(p.lat[1]), p.label, { c: p.lc || p.c || 'y', size: p.size || 26 });
        break;
      }
      case 'seg': case 'vec': {
        const A = P(p.a), B = P(p.b);
        if (p.k === 'vec' || p.arrow) { const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, s = 8 / L; line(A, [B[0] - (B[0] - A[0]) * s, B[1] - (B[1] - A[1]) * s], { dash: p.dash }); out.push({ el: arrowHead(g, A, B, p.c, 16), kind: 'fade' }); }
        else line(A, B, { dash: p.dash });
        if (p.label) { const m = p.lat ? P(p.lat) : [(A[0] + B[0]) / 2 + (p.dx || 0), (A[1] + B[1]) / 2 + (p.dy || 0)]; lab(m[0], m[1], p.label, { size: p.size || 24, c: p.lc || p.c }); }
        break;
      }
      case 'poly': {
        const pts = p.pts.map(P), d = 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + (p.close ? 'Z' : '');
        if (p.fill) out.push({ el: svgEl('path', { d, fill: col(p.fill), 'fill-opacity': p.alpha || 0.25, stroke: 'none' }, g), kind: 'fade' });
        if (p.noStroke !== true) stroke(d, { dash: p.dash });
        break;
      }
      case 'pt': case 'dot': {
        const [X, Y] = P(p.at), r = p.r || (p.k === 'dot' ? 4 : 6);
        out.push({ el: svgEl('circle', { cx: X, cy: Y, r, fill: p.open ? '#21503f' : c, stroke: c, 'stroke-width': 2.5 }, g), kind: 'fade' });
        if (p.name) {
          const d = DIRS[p.dir || 'ne'] || DIRS.ne, dist = p.off || 22, sz = p.size || 26;
          lab(X + d[0] * dist + (p.dx || 0), Y + d[1] * dist + (p.dy || 0), p.name, { size: sz, anchor: d[0] > 0.3 ? 'start' : d[0] < -0.3 ? 'end' : 'middle', c: p.lc || p.c });
        }
        break;
      }
      case 'label': {
        const [X, Y] = P(p.at), e = lab(X + (p.dx || 0), Y + (p.dy || 0), p.text, { size: p.size, anchor: p.anchor, plain: p.plain });
        if (p.vec) {   // ベクトルの矢印を字の上に
          try { const bb = e.getBBox(), y = bb.y - 1, x0 = bb.x + 2, x1 = bb.x + bb.width - 1; line([x0, y], [x1 - 5, y], { wd: 2 }); out.push({ el: arrowHead(g, [x0, y], [x1, y], p.c, 9), kind: 'fade' }); } catch (err) { /* 字の大きさがはかれないときは矢印なし */ }
        }
        break;
      }
      case 'arc': {   // 中心 o、半径 r（x 方向の目もりで）または rp（画面の点）、角 a1→a2（度・反時計まわり）
        const [cx, cy] = P(p.o), rp = p.rp || p.r * (f.w / (f.x1 - f.x0)), n = 48, pts = [];
        for (let i = 0; i <= n; i++) { const t = (p.a1 + (p.a2 - p.a1) * i / n) * Math.PI / 180; pts.push([cx + rp * Math.cos(t), cy - rp * Math.sin(t)]); }
        stroke(pathOf([pts]), { dash: p.dash, wd: p.wd || 2.5 });
        if (p.label) { const t = ((p.a1 + p.a2) / 2) * Math.PI / 180, rr = rp + (p.lr || 18); lab(cx + rr * Math.cos(t), cy - rr * Math.sin(t), p.label, { size: p.size || 22 }); }
        break;
      }
      default: console.warn('図の部品がわからない:', p.k);
    }
    return out;
  }

  /* ---------- 黒板の物（add の中身） ----------
     t：'h' 見出し／'m' 数式の行（tex、note＝右の小さいメモ）／'p' 文（text）／'box' 枠（label・text）／'ans' 答えの枠／'prob' 問題文／'tbl' 表（rows）／'fig' 図／'gap' すきま */
  function mkEl(it) {
    const t = it.t || 'p', d = document.createElement('div');
    d.className = 'el ' + (t === 'ans' ? 'ansbox' : t === 'p' ? 'tx' : t) +   // 文は tx（色の p＝桃 と重ならないように）
      (it.c ? ' ' + it.c : '') + (it.size ? ' ' + it.size : '') + (it.cls ? ' ' + it.cls : '');
    if (it.id) d.dataset.id = it.id;
    switch (t) {
      case 'h': d.innerHTML = rich(it.text); break;
      case 'm': d.innerHTML = '<span class="mx">' + tex(it.tex, true) + '</span>' + (it.note ? '<span class="note">' + rich(it.note) + '</span>' : ''); break;
      case 'box': case 'ans': d.innerHTML = '<span class="chip">' + esc(it.label || (t === 'ans' ? '答' : 'ポイント')) + '</span>' + (it.tex ? tex('\\displaystyle ' + it.tex, false) : rich(it.text)); break;   // 数式は見出しの横に（大きい形のまま）
      case 'prob': d.innerHTML = probHTML(); break;
      case 'tbl': d.innerHTML = '<table>' + it.rows.map(r => '<tr>' + r.map(c => '<td>' + rich(c) + '</td>').join('') + '</tr>').join('') + '</table>'; break;
      case 'fig': break;
      case 'gap': d.style.height = (it.h || 16) + 'px'; break;
      default: d.innerHTML = rich(it.text);
    }
    if (it.style) d.style.cssText += ';' + it.style;
    return d;
  }
  function probHTML() {
    const P = L.problem || {};
    return '<span class="chip">問題</span>' + rich(P.lead || '') + (P.parts && P.parts.length ? '<ol>' + P.parts.map(s => '<li>' + rich(s) + '</li>').join('') + '</ol>' : '') + (P.src ? '<div class="note" style="margin-top:6px">' + rich(P.src) + '</div>' : '');
  }

  /* ---------- 黒板を組み立てる ---------- */
  let L = null, steps = [], si = -1, state = 'boot', answers = {}, rates = {}, revealed = {}, hintOn = false, anims = [], token = 0, auto = false, autoT = null, scale = 1, colsEls = [];
  const pageStart = k => { for (let i = k; i > 0; i--) if (steps[i].clear) return i; return 0; };
  const answered = k => { const a = steps[k].ask; if (!a) return true; return a.type === 'think' ? !!revealed[k] : answers[k] !== undefined; };
  function apply(items, draws, fresh) {
    (items || []).forEach(it => {
      const host = colsEls[clamp(it.col || 0, 0, colsEls.length - 1)];
      const d = mkEl(it); host.appendChild(d);
      if ((it.t || 'p') === 'fig') {
        const f = makeFig(it, d);
        (it.items || []).forEach(p => { const o = drawPrim(f, p); if (fresh) fresh.push(...o); });
      } else if (fresh) fresh.push({ el: d, kind: 'wipe' });
    });
    (draws || []).forEach(dr => {
      const f = figs[dr.fig]; if (!f) { console.warn('図がない:', dr.fig); return; }
      (dr.items || []).forEach(p => { const o = drawPrim(f, p); if (fresh) fresh.push(...o); });
    });
  }
  function build(k, animate) {
    stopAnims(); figs = {};
    const p = pageStart(k), cw = 1540, ratios = steps[p].cols || L.cols || [0.5, 0.5];
    const box = $('#cols'); box.innerHTML = '';
    const page = document.createElement('div'); page.className = 'page'; box.appendChild(page);
    colsEls = []; let x = 0;
    ratios.forEach(r => { const c = document.createElement('div'); c.className = 'col'; c.style.left = Math.round(x * cw) + 'px'; c.style.width = Math.round(r * cw) + 'px'; page.appendChild(c); colsEls.push(c); x += r; });
    const fresh = [];
    for (let i = p; i <= k; i++) {
      const st = steps[i], now = i === k && animate;
      apply(st.add, st.draw, now ? fresh : null);
      if (st.ask && (i < k || answered(k)) && (st.ask.add || st.ask.draw)) apply(st.ask.add, st.ask.draw, now ? fresh : null);
    }
    (steps[k].hl || []).forEach(id => page.querySelectorAll(`[data-id="${id}"]`).forEach(e => e.classList.add('hl')));
    (steps[k].dim || []).forEach(id => page.querySelectorAll(`[data-id="${id}"]`).forEach(e => e.classList.add('dimmed')));
    if (animate) runAnims(fresh);
  }
  function addAnswerItems(k) {   // 答えたあと（考えてみよう：答えを見たあと）に黒板へ足す物
    const a = steps[k].ask; if (!a || !(a.add || a.draw)) return;
    const fresh = []; apply(a.add, a.draw, fresh); runAnims(fresh);
  }

  /* ---------- チョークで書くように出す ---------- */
  function stopAnims() { anims.forEach(a => { try { a.cancel(); } catch (e) { /* もう終わった */ } }); anims = []; }
  function finishAnims() { anims.forEach(a => { try { a.finish(); } catch (e) { /* もう終わった */ } }); }
  const animating = () => anims.some(a => a.playState === 'running' || a.playState === 'pending');
  function runAnims(list) {
    let t = 80; const my = ++token;
    list.forEach(({ el, kind }) => {
      let a = null, dur = 300;
      try {
        if (kind === 'wipe') {
          const r = el.getBoundingClientRect(), w = r.width / scale, h = r.height / scale;
          if (h > 92) { dur = clamp(200 + h * 2.4, 320, 1300); a = el.animate([{ clipPath: 'inset(-30px -30px 100% -30px)' }, { clipPath: 'inset(-30px -30px -30px -30px)' }], { duration: dur, delay: t, easing: 'linear', fill: 'backwards' }); }
          else { dur = clamp(180 + w * 0.75, 260, 1150); a = el.animate([{ clipPath: 'inset(-30px 100% -30px -30px)' }, { clipPath: 'inset(-30px -30px -30px -30px)' }], { duration: dur, delay: t, easing: 'linear', fill: 'backwards' }); }
        } else if ((kind === 'stroke' || kind === 'axis') && el.getTotalLength) {   // axis：座標軸は速く
          const len = el.getTotalLength() || 1; dur = kind === 'axis' ? clamp(len * 0.6, 200, 450) : clamp(len * 0.9, 220, 1400);
          a = el.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: dur, delay: t, easing: 'ease-in-out', fill: 'backwards' });
        } else { dur = kind === 'quick' ? 200 : 260; a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: t, fill: 'backwards' }); }
      } catch (e) { a = null; }
      if (a) anims.push(a);
      t += kind === 'quick' ? 12 : kind === 'fade' ? 90 : kind === 'axis' ? dur * 0.5 : dur * 0.82 + 50;
    });
    Promise.all(anims.map(a => a.finished.catch(() => null))).then(() => { if (my === token) onAnimDone(); });
  }

  /* ---------- 字幕・発問 ---------- */
  function setCap(html, kind, labText) {
    const cap = $('#cap'); cap.className = kind || '';
    $('#cap .lab').textContent = labText || '解説';
    $('#cap .txt').innerHTML = html;
  }
  function showStep(k) {
    const st = steps[k], a = st.ask;
    $('#cap .opts').innerHTML = ''; $('#cap .opts').className = 'opts'; hintOn = false;
    if (!a) { setCap(rich(st.say || ''), st.end ? 'end' : '', st.end ? 'まとめ' : (st.lab || '解説')); return; }
    if (a.type === 'think') {
      setCap(rich(a.q), 'think', '考えてみよう');
      const o = $('#cap .opts'); o.classList.add('small');
      if (a.hint) o.appendChild(btn('💡 ヒント（H）', () => toggleHint()));
      o.appendChild(btn('答えを見る（Enter）', () => reveal()));
      return;
    }
    setCap(rich(a.q), 'ask', '発問');
    const o = $('#cap .opts');
    a.opts.forEach((s, i) => { const b = btn('', () => choose(i)); b.innerHTML = '<span class="k">' + (i + 1) + '</span><span>' + rich(s) + '</span>'; o.appendChild(b); });
    if (a.hint) { const hb = btn('💡', () => toggleHint()); hb.title = 'ヒント（H）'; hb.style.cssText = 'flex:0 0 auto;min-width:0;justify-content:center'; o.appendChild(hb); }
  }
  function btn(text, fn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; }
  function toggleHint() {
    const a = steps[si].ask; if (!a || !a.hint || answered(si)) return;
    hintOn = !hintOn; const txt = $('#cap .txt');
    const h = txt.querySelector('.hint'); if (h) h.remove();
    if (hintOn) { const s = document.createElement('span'); s.className = 'hint'; s.innerHTML = '💡 ' + rich(a.hint); txt.appendChild(s); }
  }
  function choose(i) {
    const st = steps[si], a = st.ask; if (!a || a.type === 'think' || answered(si) || i < 0 || i >= a.opts.length) return;
    finishAnims(); answers[si] = i;
    const ok = i === a.ok, bs = [...$('#cap .opts').querySelectorAll('button')];
    bs.forEach((b, j) => { b.disabled = true; if (j === a.ok) b.classList.add('ok'); else if (j === i) b.classList.add('ng'); else b.classList.add('fade'); });
    const why = (a.why || {})[i];
    setCap(ok ? '<span class="okm">○ 正解！</span>' + rich(a.good || '') : '<span class="ngm">× ざんねん</span>' + rich(why || '') + (why ? ' ' : '') + '正解は ' + (a.ok + 1) + ' の ' + rich(a.opts[a.ok]) + '。' + (a.good ? ' ' + rich(a.good) : ''), 'ask', '発問');
    $('#score').textContent = scoreText(); addAnswerItems(si); state = 'ready'; markWaiting(); savePos(); armAuto();
  }
  function reveal() {
    const st = steps[si], a = st.ask; if (!a || a.type !== 'think' || revealed[si]) return;
    finishAnims(); revealed[si] = true;
    setCap('<b>こたえ：</b>' + rich(a.ans || '') + (a.after ? '<br>' + rich(a.after) : ''), 'think', '考えてみよう');
    const o = $('#cap .opts'); o.innerHTML = ''; o.className = 'opts small';
    [['◎ 自分でできた', 0], ['△ おしかった', 1], ['× まだむずかしい', 2]].forEach(([t, v], j) => { const b = btn('', () => rate(v)); b.innerHTML = '<span class="k">' + (j + 1) + '</span>' + t; o.appendChild(b); });
    addAnswerItems(si); state = 'ready'; markWaiting(); armAuto();
  }
  function rate(v) {
    if (!steps[si].ask || steps[si].ask.type !== 'think' || !revealed[si]) return;
    rates[si] = v; [...$('#cap .opts').querySelectorAll('button')].forEach((b, j) => { b.classList.toggle('ok', j === v); b.classList.toggle('fade', j !== v); });
  }
  function markWaiting() { $('#cap').classList.toggle('waiting', state === 'ready' && si < steps.length - 1); $('#bNext').disabled = si >= steps.length - 1 && state === 'ready'; }

  /* ---------- 進行 ---------- */
  function go(k, instant) {
    if (k < 0 || k >= steps.length) return;
    clearTimeout(autoT); closeProb();
    si = k; const st = steps[k];
    if (st.ask) { delete answers[k]; delete rates[k]; delete revealed[k]; }   // もどって来たら、答え直せる
    $('#result').classList.add('hidden');
    build(k, !instant);
    showStep(k);
    let part = ''; for (let i = 0; i <= k; i++) if (steps[i].part != null) part = steps[i].part;
    $('#hd .part').textContent = part;
    $('#pg').textContent = (k + 1) + ' / ' + steps.length;
    $('#bar i').style.width = (100 * (k + 1) / steps.length).toFixed(1) + '%';
    $('#score').textContent = scoreText();
    state = 'anim'; markWaiting();
    if (instant || !animating()) onAnimDone();
    savePos();
  }
  function onAnimDone() {
    if (state !== 'anim') return;
    const st = steps[si];
    state = st.ask && !answered(si) ? 'ask' : 'ready'; markWaiting();
    if (st.end) showResult();
    armAuto();
  }
  function next() {
    if (!$('#probov').classList.contains('hidden')) { closeProb(); return; }
    if (!$('#start').classList.contains('hidden')) { begin(false); return; }
    if (state === 'anim') { finishAnims(); return; }
    if (state === 'ask') {
      const a = steps[si].ask;
      if (a.type === 'think') reveal();
      else { const o = $('#cap .opts'); o.classList.remove('shake'); void o.offsetWidth; o.classList.add('shake'); }
      return;
    }
    if (state === 'ready' && si < steps.length - 1) go(si + 1);
  }
  function back() { if (!$('#probov').classList.contains('hidden')) { closeProb(); return; } if (si > 0) go(si - 1, true); }
  /* 自動で進む（A）：書き終わってから、字幕の長さに合わせて待って次へ。発問では止まって答えを待つ */
  function armAuto() {
    clearTimeout(autoT);
    if (!auto || state !== 'ready' || si >= steps.length - 1) return;
    const st = steps[si], text = st.ask ? '' : st.say || '';
    autoT = setTimeout(() => { if (auto && state === 'ready') next(); }, st.ask ? 2600 : clamp(1600 + plainLen(text) * 95, 2200, 9000));
  }
  function setAuto(v) { auto = !!v; $('#bAuto').classList.toggle('on', auto); $('#bAuto').textContent = auto ? '自動 ON' : '自動 OFF'; store.set('hb.auto', auto ? '1' : '0'); if (auto) armAuto(); else clearTimeout(autoT); }

  /* ---------- 成績・記録 ---------- */
  const choiceIdx = () => steps.map((s, i) => s.ask && s.ask.type !== 'think' ? i : -1).filter(i => i >= 0);
  const thinkIdx = () => steps.map((s, i) => s.ask && s.ask.type === 'think' ? i : -1).filter(i => i >= 0);
  function scoreText() { const c = choiceIdx(), done = c.filter(i => answers[i] !== undefined); if (!done.length) return ''; return '正解 ' + done.filter(i => answers[i] === steps[i].ask.ok).length + ' / ' + done.length; }
  function showResult() {
    const c = choiceIdx(), th = thinkIdx(), right = c.filter(i => answers[i] === steps[i].ask.ok).length, ans = c.filter(i => answers[i] !== undefined).length;
    const r = [0, 1, 2].map(v => th.filter(i => rates[i] === v).length);
    const el = $('#result'); el.classList.remove('hidden');
    el.innerHTML = '<div class="card"><h2>おつかれさまでした</h2><div class="qs">' + esc(L.field || '') + '　' + esc(L.title || '') + '</div>' +
      '<div class="sc"><div><div class="k">発問（選択）</div><div class="v">' + right + '<small>/ ' + c.length + ' 問 正解</small></div>' + (ans < c.length ? '<div class="k">（答えた ' + ans + ' 問）</div>' : '') + '</div>' +
      (th.length ? '<div><div class="k">考えてみよう（自分でできたか）</div><div class="v">◎' + r[0] + '<small>△' + r[1] + '　×' + r[2] + '</small></div></div>' : '') + '</div>' +
      (L.points && L.points.length ? '<div class="pts"><span class="chip">この問題のポイント</span><ol>' + L.points.map(s => '<li>' + rich(s) + '</li>').join('') + '</ol></div>' : '') +
      '<div class="row"><button class="btn sub" id="rProb" type="button">📄 問題文</button><button class="btn sub" id="rAgain" type="button">↻ はじめから</button><a class="btn" href="index.html">☰ 目次へ</a></div></div>';
    $('#rProb').addEventListener('click', e => { e.stopPropagation(); openProb(); });
    $('#rAgain').addEventListener('click', e => { e.stopPropagation(); restart(); });
    el.onclick = e => e.stopPropagation();
    if (ans === c.length) {   // 最後まで答えたら記録（いちばんよい点を残す）
      let best = null; try { best = JSON.parse(store.get('hb.best.' + ID) || 'null'); } catch (e) { best = null; }
      if (!best || right > best.right) store.set('hb.best.' + ID, JSON.stringify({ right, total: c.length, at: Date.now() }));
      store.set('hb.done.' + ID, '1');
    }
    store.del('hb.pos.' + ID);
  }
  function savePos() { if (si > 0 && si < steps.length - 1) store.set('hb.pos.' + ID, String(si)); }
  function restart() { answers = {}; rates = {}; revealed = {}; go(0); }

  /* ---------- 問題文・はじめの画面 ---------- */
  function openProb() { $('#probov .el.prob').innerHTML = probHTML(); $('#probov').classList.remove('hidden'); $('#bProb').classList.add('on'); }
  function closeProb() { $('#probov').classList.add('hidden'); $('#bProb').classList.remove('on'); }
  function begin(resume) {
    $('#start').classList.add('hidden');
    const pos = parseInt(store.get('hb.pos.' + ID) || '0', 10);
    if (resume && pos > 0 && pos < steps.length) go(pos, true); else restart();
  }
  function startScreen() {
    const s = $('#start'); s.classList.remove('hidden');
    $('#start .f').textContent = L.field || ''; $('#start .t').textContent = L.title || '';
    $('#start .lv').textContent = [L.level, L.time].filter(Boolean).join('　');
    const pos = parseInt(store.get('hb.pos.' + ID) || '0', 10), r = $('#bResume');
    if (pos > 0 && pos < steps.length) { r.classList.remove('hidden'); r.textContent = '▶ つづきから（' + (pos + 1) + ' / ' + steps.length + '）'; } else r.classList.add('hidden');
  }

  /* ---------- 画面の大きさ ---------- */
  function fit() { scale = Math.min(innerWidth / SW, innerHeight / SH); $('#stage').style.transform = 'scale(' + scale + ')'; }

  /* ---------- キーとボタン ---------- */
  function bind() {
    addEventListener('resize', fit); fit();
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'Enter' || k === ' ' || k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
      else if (k === 'ArrowLeft' || k === 'Backspace' || k === 'PageUp') { e.preventDefault(); back(); }
      else if (k === 'Escape') closeProb();
      else if (k === 'q' || k === 'Q') { if ($('#probov').classList.contains('hidden')) openProb(); else closeProb(); }
      else if (k === 'h' || k === 'H') toggleHint();
      else if (k === 'a' || k === 'A') setAuto(!auto);
      else if (/^[1-4]$/.test(k)) { const st = steps[si]; if (!st || !st.ask) return; if (st.ask.type === 'think') { if (revealed[si]) rate(+k - 1); } else choose(+k - 1); }
    });
    $('#bNext').addEventListener('click', e => { e.stopPropagation(); next(); });
    $('#bBack').addEventListener('click', e => { e.stopPropagation(); back(); });
    $('#bProb').addEventListener('click', e => { e.stopPropagation(); if ($('#probov').classList.contains('hidden')) openProb(); else closeProb(); });
    $('#bAuto').addEventListener('click', e => { e.stopPropagation(); setAuto(!auto); });
    $('#probov').addEventListener('click', e => { e.stopPropagation(); closeProb(); });
    $('#bStart').addEventListener('click', e => { e.stopPropagation(); begin(false); });
    $('#bResume').addEventListener('click', e => { e.stopPropagation(); begin(true); });
    $('#start').addEventListener('click', e => e.stopPropagation());
    $('#board').addEventListener('click', () => next());   // 黒板をタッチしても つぎへ
    $('#cap').addEventListener('click', e => { if (e.target.closest('button')) return; next(); });
  }

  /* ---------- 台本を受け取る ---------- */
  window.HB = {
    rich, tex,
    lesson(def) {
      L = def; steps = def.steps.filter(Boolean);
      document.title = (def.title || '') + '｜高校数学 黒板解説';
      $('#hd .field').textContent = def.field || ''; $('#hd .ttl').textContent = def.title || '';
      bind(); setAuto(store.get('hb.auto') === '1' && q.get('auto') !== '0' || q.get('auto') === '1');
      if (q.get('step') != null) { $('#start').classList.add('hidden'); go(clamp(parseInt(q.get('step'), 10) || 0, 0, steps.length - 1), true); }
      else startScreen();
    }
  };
  // 自動テスト用（tools/check.mjs）
  window.HB_T = { steps: () => steps, go, next, back, choose, reveal, rate, state: () => state, si: () => si, finish: finishAnims, answers: () => answers, lesson: () => L };

  if (!ID) { location.replace('index.html'); return; }
  const sc = document.createElement('script'); sc.src = 'scenes/' + encodeURIComponent(ID) + '.js';
  sc.onerror = () => { document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;font:20px sans-serif;position:fixed;left:20px;top:20px;z-index:99">台本が見つかりません：' + esc(ID) + '　<a style="color:#9ad8ff" href="index.html">目次へ</a></p>'); };
  document.body.appendChild(sc);
})();
