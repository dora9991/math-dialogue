/* 高校数学 黒板解説（声なし・キャラクターなし）の再生役。 play.html?s=<ID> で scenes/<ID>.js（HB.lesson({...})）を読む。
   キー：Enter/Space/→＝つぎへ（書いている途中なら、まず書き終える）、←/Backspace＝もどる、1〜4＝選択肢、H＝ヒント、Q＝問題文、Esc＝閉じる、
         A＝自動で進む（読み終わる時間をとって次へ。発問では止まる）、W＝動画モード（発問も少し待ってから答えを出す）、
         P＝一時停止（その瞬間で止まる）、S＝速さ（×1→1.25→1.5→2→0.75）、R＝このステップをもういちど、D＝分数の横に小数。
   URL：?auto=1／?watch=1／?speed=1.5／?dec=1／?embed=1（ほかのアプリに埋めこむ：目次を隠し、進み具合を postMessage で知らせる）／?step=N（検査用）。
   時間（板書のアニメ・自動で進む待ち時間）は「動画の時計」で数える：一時停止で止まり、倍速で速く進む（ホー先生の会話アプリと同じ）。
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
  let DEC = false, NODEC = false;   // 分数の横に小数（D）。台本が noDec:true なら使わない（答えがばれる授業）
  function decimal(n, d) {
    const v = n / d; let k = d; while (k % 2 === 0) k /= 2; while (k % 5 === 0) k /= 5;
    const exact = k === 1 && String(v).replace(/^-?\d+\.?/, '').length <= 4;
    return (exact ? '=' : '\\fallingdotseq ') + (exact ? String(v) : (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, ''));
  }
  function withDec(s) {   // \frac{3}{4}・\dfrac34 のような「数字だけの分数」の直後に、青い小さな小数をそえる
    return s.replace(/\\([dt]?)frac(?:\{(\d+)\}|(\d))(?:\{(\d+)\}|(\d))/g, (m, k, n1, n2, d1, d2, off, str) => {
      const n = +(n1 || n2), d = +(d1 || d2); if (!d || n % d === 0) return m;
      // 前のマイナスが「負の数」のとき（式のはじめ・＝や（のあと）だけ、小数にも − をつける。引き算の − ならつけない
      const before = str.slice(0, off).replace(/\s+$/, ''), neg = /-$/.test(before) && /(^|[=(,{\[<>]|\\le|\\ge|\\leqq|\\geqq|\\pm)$/.test(before.slice(0, -1).replace(/\s+$/, ''));
      return m + '\\textcolor{9ad8ff}{\\scriptstyle\\,(' + decimal(n, d).replace(/^(=|\\fallingdotseq )/, '$1' + (neg ? '-' : '')) + ')}';
    });
  }
  function tex(s, display) {
    if (!window.katex) return '<code>' + esc(s) + '</code>';
    if (DEC && !NODEC) s = withDec(String(s));
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
  const plainLen = s => String(s || '').replace(/\$[^$]*\$/g, m => 'x'.repeat(Math.min(16, 4 + Math.round(m.length / 3)))).replace(/[{}*\[\]]/g, '').length;   // 自動で進む待ち時間の目安（数式は長さに応じて）

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
  const fixPow = s => String(s).replace(/(^|[^\w)\]\s])(\s*)-\s*(\([^()]*\)|[\w.]+)\s*\*\*\s*(\d+(?:\.\d+)?|\([^()]*\)|\w+)/g, '$1$2-($3**$4)');   // -x**2 → -(x**2)（JS では文法エラーになるため）
  const fnOf = s => typeof s === 'function' ? s : new Function('x', 'with (Math) { return (' + fixPow(s) + '); }');   // 台本の中の式（自分で書いたものだけ）
  const DIRS = { n: [0, -1], ne: [.72, -.72], e: [1, 0], se: [.72, .72], s: [0, 1], sw: [-.72, .72], w: [-1, 0], nw: [-.72, -.72], c: [0, 0] };
  function label(g, X, Y, text, o) {   // 英字は斜体のセリフ体（数学の文字らしく）、ほかはふつうの字。\n で改行（行のまとまりの真ん中が Y）
    o = o || {};
    if (String(text).includes('\n')) {
      const lines = String(text).split('\n'), lh = (o.size || 26) * 1.25, gg = svgEl('g', {}, g);
      lines.forEach((ln, i) => label(gg, X, Y + (i - (lines.length - 1) / 2) * lh, ln, o));
      return gg;
    }
    const t = svgEl('text', { x: X, y: Y, fill: col(o.c), 'font-size': o.size || 26, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'central',
      'font-family': '"Klee One","Hiragino Maru Gothic ProN",sans-serif', 'font-weight': 600 }, g);
    // 英字＝数式の斜体、数字・記号（− √ π ° など）＝数式の立体（KaTeX の字体）、日本語＝黒板の字
    const sz = o.size || 26;
    String(text).replace(/-/g, '−').split(/([A-Za-z]+|[0-9.+−=√π°()\/<>≦≧±×÷|]+)/).forEach(run => {
      if (!run) return;
      const sp = svgEl('tspan', {}, t);
      if (/^[A-Za-z]+$/.test(run) && !o.plain) { sp.setAttribute('font-family', 'KaTeX_Math,"Times New Roman",Times,serif'); sp.setAttribute('font-style', 'italic'); sp.setAttribute('font-size', sz * 1.12); sp.setAttribute('font-weight', 400); }
      else if (/^[0-9.+−=√π°()\/<>≦≧±×÷|]+$/.test(run)) { sp.setAttribute('font-family', 'KaTeX_Main,"Times New Roman",Times,serif'); sp.setAttribute('font-size', sz * 1.1); sp.setAttribute('font-weight', 400); }
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
  /* 図の部品。p.k：axes／fn／line／area／seg／vec／poly／pt／label／arc／dot（小さい点）／numline（数直線）／range（不等式の解）／dim（長さの矢印）／circle／venn（ベン図）／right（直角の印）／angle（角の印）／bars（ヒストグラム）／box（箱ひげ図）／pts（散布図の点）。色 c は w/y/p/b/g/o/d。
     返すのは、書く順の [{el, kind}]（kind：stroke＝線を引くように、fade＝ふわっと出す） */
  function drawPrim(f, p) {
    const g = svgEl('g', { 'data-id': p.id || null }, f.svg), out = [], c = col(p.c), wd = p.wd || 3;
    const line = (A, B, o) => { o = o || {}; const e = svgEl('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: o.c || c, 'stroke-width': o.wd || wd, 'stroke-linecap': 'round', 'stroke-dasharray': o.dash ? '9 9' : null }, g); out.push({ el: e, kind: o.kind || (o.dash ? 'fade' : 'stroke') }); return e; };
    const stroke = (d, o) => { o = o || {}; const e = svgEl('path', { d, fill: 'none', stroke: o.c || c, 'stroke-width': o.wd || wd, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash ? '9 9' : null, 'clip-path': o.clip ? `url(#${f.cid})` : null }, g); out.push({ el: e, kind: o.dash ? 'fade' : 'stroke' }); return e; };
    const lab = (X, Y, text, o) => { const e = label(g, X, Y, text, Object.assign({ c: p.c, plain: p.plain }, o)); out.push({ el: e, kind: (o && o.kind) || 'fade' }); return e; };
    const P = a => [f.X(a[0]), f.Y(a[1])];
    switch (p.k) {
      case 'axes': {   // 座標軸。at＝軸が交わる点（ふつう [0,0]。データの図なら [150,0] など）、tx・ty＝目もり、grid:true でうすい方眼、xl・yl＝軸の名前
        const [ax, ay] = p.at || [0, 0], ox = f.X(ax), oy = f.Y(ay), cc = p.c || 'd';
        if (p.grid) {
          (p.tx || []).forEach(v => { const x = Array.isArray(v) ? v[0] : v; line([f.X(x), f.Y(f.y0)], [f.X(x), f.Y(f.y1)], { c: 'rgba(244,243,234,.13)', wd: 1.5, kind: 'quick' }); });
          (p.ty || []).forEach(v => { const y = Array.isArray(v) ? v[0] : v; line([f.X(f.x0), f.Y(y)], [f.X(f.x1), f.Y(y)], { c: 'rgba(244,243,234,.13)', wd: 1.5, kind: 'quick' }); });
        }
        const xl = p.xl == null ? 'x' : p.xl, yl = p.yl == null ? 'y' : p.yl;
        if (p.xaxis !== false) {
          line([f.X(f.x0), oy], [f.X(f.x1) - 4, oy], { c: col(cc), wd: 2.5, kind: 'axis' }); out.push({ el: arrowHead(g, [0, oy], [f.X(f.x1), oy], cc, 13), kind: 'fade' });
          if (xl) { if (xl.length > 1) lab(f.X(f.x1) - 2, oy - 20, xl, { c: cc, size: 22, kind: 'quick', anchor: 'end', plain: true }); else lab(f.X(f.x1) - 4, oy + 22, xl, { c: cc, size: 24, kind: 'quick' }); }   // 2字以上の名前は、矢印の上に
        }
        if (p.yaxis !== false) {
          line([ox, f.Y(f.y0)], [ox, f.Y(f.y1) + 4], { c: col(cc), wd: 2.5, kind: 'axis' }); out.push({ el: arrowHead(g, [ox, f.h], [ox, f.Y(f.y1)], cc, 13), kind: 'fade' });
          if (yl) { if (yl.length > 1) lab(ox + 14, f.Y(f.y1) + 10, yl, { c: cc, size: 22, kind: 'quick', anchor: 'start', plain: true }); else lab(ox + 18, f.Y(f.y1) + 8, yl, { c: cc, size: 24, kind: 'quick' }); }   // 2字以上の名前は、矢印の右に
        }
        if (p.o !== false && ax === 0 && ay === 0) lab(ox - 16, oy + 18, 'O', { c: cc, size: 22, kind: 'quick' });
        if (p.xaxis !== false) (p.tx || []).forEach(v => { const [x, s] = Array.isArray(v) ? v : [v, String(v)]; line([f.X(x), oy - 6], [f.X(x), oy + 6], { c: col(cc), wd: 2, kind: 'quick' }); lab(f.X(x), oy + 22, s, { c: cc, size: 21, kind: 'quick' }); });   // 目もりは、まとめてすぐ出す
        if (p.yaxis !== false) (p.ty || []).forEach(v => { const [y, s] = Array.isArray(v) ? v : [v, String(v)]; line([ox - 6, f.Y(y)], [ox + 6, f.Y(y)], { c: col(cc), wd: 2, kind: 'quick' }); lab(ox - 12, f.Y(y), s, { c: cc, size: 21, anchor: 'end', kind: 'quick' }); });
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
        else { const a = p.a != null ? p.a : f.x0, b = p.b != null ? p.b : f.x1; stroke(pathOf(curvePts(f, x => p.m * x + p.n, a, b, 120)), { dash: p.dash, clip: true }); }   // 点を多めにとる（急な直線の両はしが図の外に出ても、見える所は描く）
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
      case 'numline': {   // 数直線（y の高さ、ふつう 0）。ticks＝目もりの数の配列（[x,'文字'] も可）か step、labels:false で数字なし
        const Y = f.Y(p.y || 0), x0 = f.X(f.x0) + 4, x1 = f.X(f.x1) - 4, cc = p.c || 'w';
        line([x0, Y], [x1 - 6, Y], { c: col(cc), wd: 2.5, kind: 'axis' }); out.push({ el: arrowHead(g, [x0, Y], [x1 + 4, Y], cc, 14), kind: 'fade' });
        let ticks = p.ticks; if (!ticks) { ticks = []; const st = p.step || 1; for (let v = Math.ceil((f.x0 + 1e-9) / st) * st; v <= f.x1 - st * 0.2; v += st) ticks.push(+v.toFixed(6)); }
        ticks.forEach(v => {
          const [x, s0] = Array.isArray(v) ? v : [v, String(v)], s = String(s0).replace(/^-/, '−');
          line([f.X(x), Y - 7], [f.X(x), Y + 7], { c: col(cc), wd: 2, kind: 'quick' });
          if (p.labels !== false && s !== '') lab(f.X(x), Y + 28, s, { c: p.lc || cc, size: p.size || 24, kind: 'quick', plain: /^[−\d.\/√ ]+$/.test(s) });
        });
        break;
      }
      case 'range': {   // 不等式の解（数直線の上の、はね上がった線）。from／to（null＝どこまでも）、fromIn／toIn（true＝●ふくむ、false＝○ふくまない）、h＝高さ(px)、label
        const Y = f.Y(p.y || 0), h = p.h || 38, A = p.from == null ? null : f.X(p.from), B = p.to == null ? null : f.X(p.to);
        const Lx = A != null ? A : f.X(f.x0) + 6, Rx = B != null ? B : f.X(f.x1) - 12, top = [];
        if (A != null) top.push([A, Y]); top.push([A != null ? A + 9 : Lx, Y - h]); top.push([B != null ? B - 9 : Rx, Y - h]); if (B != null) top.push([B, Y]);
        const poly = [[Lx, Y]].concat(top, [[Rx, Y]]);
        out.push({ el: svgEl('polygon', { points: poly.map(q => q.map(v => v.toFixed(1)).join(',')).join(' '), fill: c, 'fill-opacity': p.alpha || 0.16, stroke: 'none' }, g), kind: 'fade' });
        stroke('M' + top.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L'), { wd: p.wd || 3 });
        [[A, p.fromIn], [B, p.toIn]].forEach(([x, inc]) => { if (x != null) out.push({ el: svgEl('circle', { cx: x, cy: Y, r: 7, fill: inc ? c : '#21503f', stroke: c, 'stroke-width': 2.8 }, g), kind: 'fade' }); });
        if (p.label) lab((Lx + Rx) / 2 + (p.dx || 0), Y - h - 20, p.label, { size: p.size || 24 });
        break;
      }
      case 'dim': {   // 2点の間の長さ（両はし矢印）。a・b は数学の座標、dy＝上下にずらす(px・上はマイナス)、label
        const A = P(p.a), B = P(p.b), dy = p.dy == null ? -24 : p.dy, a = [A[0], A[1] + dy], b = [B[0], B[1] + dy];
        line(a, b, { wd: 2 }); out.push({ el: arrowHead(g, b, a, p.c, 11), kind: 'fade' }, { el: arrowHead(g, a, b, p.c, 11), kind: 'fade' });
        if (p.label) lab((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (dy <= 0 ? -18 : 20), p.label, { size: p.size || 22 });
        break;
      }
      case 'circle': {   // 円（r は目もりの長さ、rp は画面の点）。fill で中をぬる、label と lat で名前
        const [cx, cy] = P(p.o), rx = p.rp || p.r * f.w / (f.x1 - f.x0), ry = p.rp || p.r * f.h / (f.y1 - f.y0);
        if (p.fill) out.push({ el: svgEl('ellipse', { cx, cy, rx, ry, fill: col(p.fill), 'fill-opacity': p.alpha || 0.25 }, g), kind: 'fade' });
        out.push({ el: svgEl('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: c, 'stroke-width': wd, 'stroke-dasharray': p.dash ? '9 9' : null }, g), kind: p.dash ? 'fade' : 'stroke' });
        if (p.label) lab(f.X(p.lat[0]), f.Y(p.lat[1]), p.label, { size: p.size || 26 });
        break;
      }
      case 'venn': {   // ベン図（集合2つまで）。U＝全体の四角 [x0,y0,x1,y1]（省略で図いっぱい、false でかかない）、A・B＝{o:[x,y], r}、names＝['U','A','B']、
                       // shade＝ぬる所：'AB'（A∩B）'Ab'（A だけ＝A∩B̄）'aB'（B だけ）'ab'（どちらでもない）。色 fc、こさ alpha
        const U = p.U || [f.x0, f.y0, f.x1, f.y1], ux = f.X(U[0]) + 3, uy = f.Y(U[3]) + 3, uw = f.X(U[2]) - f.X(U[0]) - 6, uh = f.Y(U[1]) - f.Y(U[3]) - 6;
        const E = s => { const [cx, cy] = P(s.o); return { cx, cy, rx: s.r * f.w / (f.x1 - f.x0), ry: s.r * f.h / (f.y1 - f.y0) }; };
        const a = E(p.A), b = p.B ? E(p.B) : null, defs = f.svg.querySelector('defs'), uid = Math.random().toString(36).slice(2, 8), names = p.names || ['U', 'A', 'B'];
        const mask = (nm, shapes) => { const m = svgEl('mask', { id: nm, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: f.w, height: f.h }, defs); shapes.forEach(([sh, fill]) => sh === 'all' ? svgEl('rect', { x: -10, y: -10, width: f.w + 20, height: f.h + 20, fill }, m) : svgEl('ellipse', Object.assign({ fill }, sh), m)); return `url(#${nm})`; };
        const shg = svgEl('g', { fill: col(p.fc || 'y'), opacity: p.alpha || 0.38 }, g);
        (p.shade || []).forEach(k => {
          let e = null;
          if (k === 'AB' && b) e = svgEl('ellipse', Object.assign({ mask: mask('vAB' + uid, [[a, 'white']]) }, b), shg);
          else if (k === 'Ab') e = svgEl('ellipse', Object.assign({ mask: b ? mask('vAb' + uid, [['all', 'white'], [b, 'black']]) : null }, a), shg);
          else if (k === 'aB' && b) e = svgEl('ellipse', Object.assign({ mask: mask('vaB' + uid, [['all', 'white'], [a, 'black']]) }, b), shg);
          else if (k === 'ab') e = svgEl('rect', { x: ux, y: uy, width: uw, height: uh, mask: mask('vab' + uid, [['all', 'white'], [a, 'black']].concat(b ? [[b, 'black']] : [])) }, shg);
          if (e) out.push({ el: e, kind: 'fade' });
        });
        if (p.U !== false) { out.push({ el: svgEl('rect', { x: ux, y: uy, width: uw, height: uh, rx: 6, fill: 'none', stroke: c, 'stroke-width': 2.5 }, g), kind: 'stroke' }); lab(ux + 18, uy + 20, names[0], { size: 24 }); }
        out.push({ el: svgEl('ellipse', Object.assign({ fill: 'none', stroke: col(p.ca || 'b'), 'stroke-width': 3 }, a), g), kind: 'stroke' });
        lab(a.cx - a.rx * 0.74, a.cy - a.ry * 0.74 - 12, names[1], { c: p.ca || 'b', size: 26, anchor: 'end' });
        if (b) { out.push({ el: svgEl('ellipse', Object.assign({ fill: 'none', stroke: col(p.cb || 'p'), 'stroke-width': 3 }, b), g), kind: 'stroke' }); lab(b.cx + b.rx * 0.74, b.cy - b.ry * 0.74 - 12, names[2], { c: p.cb || 'p', size: 26, anchor: 'start' }); }
        break;
      }
      case 'right': {   // 直角の印。o＝直角の頂点、a・b＝2つの辺の上の点（数学の座標）、s＝大きさ(px)
        const O = P(p.o), A = P(p.a), B = P(p.b), s = p.s || 16, un = (Q) => { const dx = Q[0] - O[0], dy = Q[1] - O[1], L = Math.hypot(dx, dy) || 1; return [dx / L * s, dy / L * s]; };
        const u = un(A), v = un(B);
        stroke(`M${(O[0] + u[0]).toFixed(1)} ${(O[1] + u[1]).toFixed(1)}L${(O[0] + u[0] + v[0]).toFixed(1)} ${(O[1] + u[1] + v[1]).toFixed(1)}L${(O[0] + v[0]).toFixed(1)} ${(O[1] + v[1]).toFixed(1)}`, { wd: p.wd || 2 });
        break;
      }
      case 'angle': {   // 角の印（弧）。o＝頂点、a・b＝2つの辺の上の点、rp＝半径(px)、label（θ・60° など）、lr＝ラベルの外へのずらし、n＝弧の本数(1〜2)
        const O = P(p.o), A = P(p.a), B = P(p.b), rp = p.rp || 30, ang = Q => Math.atan2(-(Q[1] - O[1]), Q[0] - O[0]);
        let t1 = ang(A), t2 = ang(B), d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;   // 小さいほう（180°以下）の角
        for (let k = 0; k < (p.n || 1); k++) {
          const r = rp + k * 6, pts = []; for (let i = 0; i <= 32; i++) { const t = t1 + d * i / 32; pts.push([O[0] + r * Math.cos(t), O[1] - r * Math.sin(t)]); }
          stroke(pathOf([pts]), { wd: p.wd || 2.5 });
        }
        if (p.label) { const tm = t1 + d / 2, rr = rp + (p.lr || 20); lab(O[0] + rr * Math.cos(tm), O[1] - rr * Math.sin(tm), p.label, { size: p.size || 22 }); }
        break;
      }
      case 'bars': {   // ヒストグラムの柱。bins＝[[階級の左はし, 右はし, 度数], …]（y が度数）。fill（色）・alpha
        const fc = col(p.fill || p.c || 'b');
        p.bins.forEach(([a, b, n]) => {
          const x0 = f.X(a), x1 = f.X(b), y0 = f.Y(0), y1 = f.Y(n), d = `M${x0} ${y0}L${x0} ${y1}L${x1} ${y1}L${x1} ${y0}`;
          out.push({ el: svgEl('path', { d: d + 'Z', fill: fc, 'fill-opacity': p.alpha || 0.3, stroke: 'none' }, g), kind: 'fade' });
          stroke(d, { wd: p.wd || 2.5 });
          if (p.labels) lab((x0 + x1) / 2, y1 - 14, String(n), { size: p.size || 20, c: p.lc || p.c, kind: 'quick' });
        });
        break;
      }
      case 'box': {   // 箱ひげ図（横向き）。v＝[最小値, 第1四分位数, 中央値, 第3四分位数, 最大値]、y＝中心の高さ、h＝箱の高さ（目もり）、mean＝平均値（＋印）、out＝外れ値（○）、label＝左に名前
        const [mn, q1, md, q3, mx] = p.v, y = p.y || 0, h = p.h || 1, Yc = f.Y(y), Yt = f.Y(y + h / 2), Yb = f.Y(y - h / 2);
        out.push({ el: svgEl('rect', { x: f.X(q1), y: Yt, width: f.X(q3) - f.X(q1), height: Yb - Yt, fill: col(p.fill || p.c || 'b'), 'fill-opacity': p.alpha || 0.22, stroke: 'none' }, g), kind: 'fade' });
        line([f.X(mn), Yc], [f.X(q1), Yc]); line([f.X(q3), Yc], [f.X(mx), Yc]);
        line([f.X(mn), Yt + (Yb - Yt) * 0.25], [f.X(mn), Yb - (Yb - Yt) * 0.25]); line([f.X(mx), Yt + (Yb - Yt) * 0.25], [f.X(mx), Yb - (Yb - Yt) * 0.25]);
        stroke(`M${f.X(q1)} ${Yt}L${f.X(q3)} ${Yt}L${f.X(q3)} ${Yb}L${f.X(q1)} ${Yb}Z`);
        line([f.X(md), Yt], [f.X(md), Yb], { c: col(p.mc || 'p'), wd: 3.5 });
        if (p.mean != null) { const X = f.X(p.mean), r = 7; line([X - r, Yc], [X + r, Yc], { c: col('y'), wd: 3 }); line([X, Yc - r], [X, Yc + r], { c: col('y'), wd: 3 }); }
        (p.out || []).forEach(v => out.push({ el: svgEl('circle', { cx: f.X(v), cy: Yc, r: 6, fill: '#21503f', stroke: c, 'stroke-width': 2.5 }, g), kind: 'fade' }));
        if (p.label) lab(f.X(mn) - 14 + (p.ldx || 0), Yc, p.label, { size: p.size || 22, anchor: 'end' });
        break;
      }
      case 'pts': {   // たくさんの点（散布図など）。list＝[[x,y], …]、r（半径 px）、c
        const gg = svgEl('g', {}, g);
        p.list.forEach(([x, y]) => svgEl('circle', { cx: f.X(x), cy: f.Y(y), r: p.r || 5, fill: c, 'fill-opacity': p.alpha || 0.9 }, gg));
        out.push({ el: gg, kind: 'fade' });
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
    return '<span class="chip">' + esc(P.label || '問題') + '</span>' + rich(P.lead || '') + (P.parts && P.parts.length ? '<ol>' + P.parts.map(s => '<li>' + rich(s) + '</li>').join('') + '</ol>' : '') + (P.src ? '<div class="note" style="margin-top:6px">' + rich(P.src) + '</div>' : '');
  }

  /* ---------- 黒板を組み立てる ---------- */
  let L = null, steps = [], si = -1, state = 'boot', answers = {}, rates = {}, revealed = {}, hintOn = false, anims = [], token = 0, scale = 1, colsEls = [], capSrc = '';
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

  /* ---------- 動画の時計（一時停止で止まり、倍速で速く進む） ---------- */
  const EMBED = q.get('embed') === '1';
  const SPEEDS = [1, 1.25, 1.5, 2, 0.75], speedOf = v => { v = parseFloat(v); return SPEEDS.includes(v) ? v : 1; };
  let watch = q.get('watch') === '1', auto = watch || q.get('auto') === '1';
  let SPEED = speedOf(q.get('speed') != null ? q.get('speed') : store.get('hb.speed'));
  let paused = false, vms = 0, lastNow = 0, sched = [], autoIt = null;
  DEC = q.get('dec') != null ? q.get('dec') === '1' : store.get('hb.dec') === '1';
  const after = (ms, fn) => { const it = { at: vms + ms, fn }; sched.push(it); return it; };
  const cancel = it => { if (it) sched = sched.filter(x => x !== it); if (it === autoIt) autoIt = null; };
  function runDue() { for (let g = 0; g < 50; g++) { const i = sched.findIndex(x => x.at <= vms); if (i < 0) break; sched.splice(i, 1)[0].fn(); } }
  function advanceClock(now) {   // 時計を進めて、時間が来た予約を実行（一度に進めるのは 1.1 秒まで）
    const dt = lastNow ? clamp(now - lastNow, 0, 1100) : 0; lastNow = now;
    if (!paused) vms += dt * SPEED;
    runDue();
  }
  function tick(now) { advanceClock(now); requestAnimationFrame(tick); }   // ふだんは毎コマ
  setInterval(() => { const n = performance.now(); if (n - lastNow > 300) advanceClock(n); }, 250);   // 画面が裏に回って毎コマが止まっても、動画のように進みつづける
  function notify(m) { if (!EMBED) return; try { window.parent.postMessage(Object.assign({ src: 'hs-board', scene: ID }, m), '*'); } catch (e) { /* 親がなくてもよい */ } }

  /* ---------- チョークで書くように出す（アニメも動画の時計の速さ） ---------- */
  function stopAnims() { anims.forEach(a => { try { a.cancel(); } catch (e) { /* もう終わった */ } }); anims = []; }
  function finishAnims() { anims.forEach(a => { try { a.finish(); } catch (e) { /* もう終わった */ } }); }
  const animating = () => anims.some(a => a.playState === 'running' || a.playState === 'paused' || a.pending);
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
      if (a) { a.playbackRate = SPEED; if (paused) a.pause(); anims.push(a); }
      t += kind === 'quick' ? 12 : kind === 'fade' ? 90 : kind === 'axis' ? dur * 0.5 : dur * 0.82 + 50;
    });
    Promise.all(anims.map(a => a.finished.catch(() => null))).then(() => { if (my === token) onAnimDone(); });
  }

  /* ---------- 字幕・発問 ---------- */
  function setCap(src, kind, labText, html) {   // src＝読む時間の目安にする元の文
    const cap = $('#cap'); cap.className = kind || '';
    $('#cap .lab').textContent = labText || '解説';
    $('#cap .txt').innerHTML = html != null ? html : rich(src);
    capSrc = src || '';
  }
  function showStep(k) {
    const st = steps[k], a = st.ask;
    $('#cap .opts').innerHTML = ''; $('#cap .opts').className = 'opts'; hintOn = false;
    if (!a) { setCap(st.say || '', st.end ? 'end' : '', st.end ? 'まとめ' : (st.lab || '解説')); return; }
    if (a.type === 'think') {
      setCap(a.q, 'think', '考えてみよう');
      const o = $('#cap .opts'); o.classList.add('small');
      if (a.hint) o.appendChild(btn('💡 ヒント（H）', () => toggleHint()));
      o.appendChild(btn('答えを見る（Enter）', () => reveal()));
      return;
    }
    setCap(a.q, 'ask', '発問');
    const o = $('#cap .opts');
    a.opts.forEach((s, i) => { const b = btn('', () => choose(i)); b.innerHTML = '<span class="k">' + (i + 1) + '</span><span>' + rich(s) + '</span>'; o.appendChild(b); });
    if (a.hint) { const hb = btn('💡', () => toggleHint()); hb.title = 'ヒント（H）'; hb.style.cssText = 'flex:0 0 auto;min-width:0;justify-content:center'; o.appendChild(hb); }
  }
  function btn(text, fn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', e => { e.stopPropagation(); fn(); b.blur(); }); return b; }
  function toggleHint() {
    const a = si >= 0 && steps[si].ask; if (!a || !a.hint || answered(si)) return;
    hintOn = !hintOn; const txt = $('#cap .txt');
    const h = txt.querySelector('.hint'); if (h) h.remove();
    if (hintOn) { const s = document.createElement('span'); s.className = 'hint'; s.innerHTML = '💡 ' + rich(a.hint); txt.appendChild(s); }
  }
  function choose(i, shown) {   // shown＝動画モードで、時間が来て答えを出したとき（点数には入れない）
    const st = steps[si], a = st && st.ask; if (!a || a.type === 'think' || answered(si) || i < 0 || i >= a.opts.length) return;
    if (paused) setPause(false);
    finishAnims(); cancel(autoIt); answers[si] = shown ? -1 : i;
    const ok = i === a.ok, bs = [...$('#cap .opts').querySelectorAll('button')];
    bs.forEach((b, j) => { b.disabled = true; if (j === a.ok) b.classList.add('ok'); else if (j === i) b.classList.add('ng'); else b.classList.add('fade'); });
    const why = (a.why || {})[i];
    if (shown) setCap(a.good || '', 'ask', '発問', '<span class="okm">正解は ' + (a.ok + 1) + '</span>' + rich(a.opts[a.ok]) + '。' + (a.good ? ' ' + rich(a.good) : ''));
    else if (ok) setCap(a.good || '', 'ask', '発問', '<span class="okm">○ 正解！</span>' + rich(a.good || ''));
    else setCap((why || '') + (a.good || ''), 'ask', '発問', '<span class="ngm">× ざんねん</span>' + rich(why || '') + (why ? ' ' : '') + '正解は ' + (a.ok + 1) + ' の ' + rich(a.opts[a.ok]) + '。' + (a.good ? ' ' + rich(a.good) : ''));
    $('#score').textContent = scoreText(); addAnswerItems(si); state = 'ready'; markWaiting(); savePos(); armAuto();
    notify(Object.assign({ ev: 'answer', i: si, ok: !shown && ok }, prog()));
  }
  function reveal(shown) {
    const st = steps[si], a = st && st.ask; if (!a || a.type !== 'think' || revealed[si]) return;
    if (paused) setPause(false);
    finishAnims(); cancel(autoIt); revealed[si] = true;
    setCap((a.ans || '') + (a.after || ''), 'think', '考えてみよう', '<b>こたえ：</b>' + rich(a.ans || '') + (a.after ? '<br>' + rich(a.after) : ''));
    const o = $('#cap .opts'); o.innerHTML = ''; o.className = 'opts small';
    if (!shown) [['◎ 自分でできた', 0], ['△ おしかった', 1], ['× まだむずかしい', 2]].forEach(([t, v], j) => { const b = btn('', () => rate(v)); b.innerHTML = '<span class="k">' + (j + 1) + '</span>' + t; o.appendChild(b); });
    addAnswerItems(si); state = 'ready'; markWaiting(); savePos(); armAuto();
  }
  function rate(v) {
    if (!steps[si].ask || steps[si].ask.type !== 'think' || !revealed[si]) return;
    rates[si] = v; [...$('#cap .opts').querySelectorAll('button')].forEach((b, j) => { b.classList.toggle('ok', j === v); b.classList.toggle('fade', j !== v); });
    savePos();
  }
  function markWaiting() {
    const last = si >= steps.length - 1;
    $('#cap').classList.toggle('waiting', state === 'ready' && !last);
    $('#bNext').disabled = last && state === 'ready';
    $('#bBack').disabled = si <= 0;
  }

  /* ---------- 進行 ---------- */
  function go(k, instant) {
    if (k < 0 || k >= steps.length) return;
    if (paused) setPause(false);
    cancel(autoIt); closeProb();
    si = k; const st = steps[k];
    if (st.ask) { delete answers[k]; delete rates[k]; delete revealed[k]; }   // もどって来たら、答え直せる
    $('#result').classList.add('hidden'); $('#watchend').classList.add('hidden');
    build(k, !instant);
    showStep(k);
    let part = ''; for (let i = 0; i <= k; i++) if (steps[i].part != null) part = steps[i].part;
    $('#hd .part').textContent = part;
    $('#pg').textContent = (k + 1) + ' / ' + steps.length;
    $('#bar i').style.width = (100 * (k + 1) / steps.length).toFixed(1) + '%';
    $('#score').textContent = scoreText();
    state = 'anim'; markWaiting();
    if (instant || !animating()) onAnimDone();
    savePos(); notify(Object.assign({ ev: 'step', i: k, steps: steps.length }, prog()));
  }
  function onAnimDone() {
    if (state !== 'anim') return;
    const st = steps[si];
    state = st.ask && !answered(si) ? 'ask' : 'ready'; markWaiting();
    if (st.end) { if (watch) showWatchEnd(); else showResult(); }
    armAuto();
  }
  function next() {
    if (!$('#probov').classList.contains('hidden')) { closeProb(); return; }
    if (!$('#start').classList.contains('hidden')) { begin(false); return; }
    if (paused) setPause(false);
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
  function replay() { if (si >= 0 && $('#start').classList.contains('hidden')) go(si); }   // R：このステップを、もういちど書く

  /* 自動で進む（A）：書き終わってから、字幕を読む時間（倍速なら短く）を待って次へ。発問・考えてみようでは止まって答えを待つ。
     動画モード（W）：発問も、考える時間を少しとってから答えを出して進む。最後は成績カードのかわりに「おしまい」。 */
  const readMs = src => clamp(1500 + plainLen(src) * 115, 2600, 14000);
  function armAuto() {
    cancel(autoIt);
    if (!auto || si < 0 || !$('#start').classList.contains('hidden')) return;
    const st = steps[si];
    if (state === 'ready') {
      if (si >= steps.length - 1) return;
      autoIt = after(readMs(capSrc), () => { autoIt = null; if (auto && state === 'ready') next(); });
    } else if (state === 'ask' && watch) {
      const a = st.ask, wait = a.type === 'think' ? clamp(3500 + plainLen(a.q) * 110, 5000, 12000) : clamp(3000 + plainLen(a.q) * 90 + a.opts.length * 700, 5000, 12000);
      autoIt = after(wait, () => { autoIt = null; if (state !== 'ask') return; if (a.type === 'think') reveal(true); else choose(a.ok, true); });
    }
  }
  function setAuto(v) {
    auto = !!v; if (!auto) watch = false;
    document.documentElement.classList.toggle('watch', watch);
    const b = $('#bAuto'); b.classList.toggle('on', auto); b.textContent = watch ? '動画 ON' : auto ? '自動 ON' : '自動 OFF';
    if (auto) armAuto(); else cancel(autoIt);
  }
  function setWatch(v) { watch = !!v; setAuto(watch || auto); }

  /* ---------- 一時停止・速さ・小数 ---------- */
  function setPause(v) {   // その瞬間で止まる：板書のアニメも、自動で進む待ち時間も止まり、つづけると止めた所から動く
    v = !!v; if (v === paused) return;
    if (v && (si < 0 || !$('#start').classList.contains('hidden'))) return;
    paused = v;
    anims.forEach(a => { try { if (paused && a.playState === 'running') a.pause(); else if (!paused && a.playState === 'paused') a.play(); } catch (e) { /* もう終わった */ } });
    document.documentElement.classList.toggle('paused', paused);
    const b = $('#bPause'); b.textContent = paused ? '▶ 再開' : '⏸ 停止'; b.classList.toggle('on', paused);
    notify({ ev: paused ? 'pause' : 'resume' });
  }
  const speedText = v => '×' + (Number.isInteger(v) ? v.toFixed(1) : String(v));
  function setSpeed(v) {
    SPEED = speedOf(v); store.set('hb.speed', String(SPEED));
    const b = $('#bSpeed'); b.textContent = '速さ ' + speedText(SPEED); b.classList.toggle('on', SPEED !== 1);
    anims.forEach(a => { try { a.playbackRate = SPEED; } catch (e) { /* もう終わった */ } });
  }
  const cycleSpeed = () => setSpeed(SPEEDS[(SPEEDS.indexOf(SPEED) + 1) % SPEEDS.length]);
  function setDec(v, quiet) {
    DEC = !!v; if (!quiet) store.set('hb.dec', DEC ? '1' : '0');
    const b = $('#bDec'); b.textContent = DEC ? '小数 ON' : '小数 OFF'; b.classList.toggle('on', DEC);
    if (quiet || si < 0 || !$('#start').classList.contains('hidden')) return;
    const was = state; build(si, false);   // いまの黒板を、小数あり／なしで書き直す（字幕は、答える前のときだけ書き直す）
    if (!steps[si].ask || !answered(si)) showStep(si);
    if (was === 'anim') onAnimDone();
  }

  /* ---------- 成績・記録 ---------- */
  const choiceIdx = () => steps.map((s, i) => s.ask && s.ask.type !== 'think' ? i : -1).filter(i => i >= 0);
  const thinkIdx = () => steps.map((s, i) => s.ask && s.ask.type === 'think' ? i : -1).filter(i => i >= 0);
  const prog = () => { const c = choiceIdx(), done = c.filter(i => answers[i] !== undefined && answers[i] >= 0); return { right: done.filter(i => answers[i] === steps[i].ask.ok).length, answered: done.length, total: c.length }; };
  function scoreText() { const p = prog(); return p.answered ? '正解 ' + p.right + ' / ' + p.answered : ''; }
  const LIST = () => window.HB_LESSONS || [];
  function nextLesson() {   // つぎの解説：目次の並びで、同じコース（数学Ⅰ・入試…）の、できているもの
    const A = LIST(), i = A.findIndex(x => x.id === ID); if (i < 0) return null;
    return A.slice(i + 1).find(x => x.ready !== false && (x.course || '') === (A[i].course || '')) || null;
  }
  const lessonUrl = x => 'play.html?s=' + encodeURIComponent(x.id) + (watch ? '&watch=1' : auto ? '&auto=1' : '') + (EMBED ? '&embed=1' : '');
  function nextLink(cls) { const nx = nextLesson(); return nx && !EMBED ? '<a class="btn ' + (cls || '') + '" href="' + lessonUrl(nx) + '">つぎの解説へ ▶<small>' + esc(nx.title) + '</small></a>' : ''; }
  function showResult() {
    const c = choiceIdx(), th = thinkIdx(), p = prog();
    const r = [0, 1, 2].map(v => th.filter(i => rates[i] === v).length);
    const el = $('#result'); el.classList.remove('hidden');
    el.innerHTML = '<div class="card"><h2>おつかれさまでした</h2><div class="qs">' + esc(L.field || '') + '　' + esc(L.title || '') + '</div>' +
      '<div class="sc"><div><div class="k">発問（選択）</div><div class="v">' + p.right + '<small>/ ' + c.length + ' 問 正解</small></div>' + (p.answered < c.length ? '<div class="k">（答えた ' + p.answered + ' 問）</div>' : '') + '</div>' +
      (th.length ? '<div><div class="k">考えてみよう（自分でできたか）</div><div class="v">◎' + r[0] + '<small>△' + r[1] + '　×' + r[2] + '</small></div></div>' : '') + '</div>' +
      (L.points && L.points.length ? '<div class="pts"><span class="chip">' + esc(L.pointsTitle || (L.problem && !L.problem.label ? 'この問題のポイント' : 'この時間のポイント')) + '</span><ol>' + L.points.map(s => '<li>' + rich(s) + '</li>').join('') + '</ol></div>' : '') +
      '<div class="row">' + (L.problem ? '<button class="btn sub" id="rProb" type="button">📄 ' + esc(L.problem.label || '問題') + '</button>' : '') + '<button class="btn sub" id="rAgain" type="button">↻ はじめから</button><a class="btn sub menuLink" href="index.html">☰ 目次へ</a>' + nextLink() + '</div></div>';
    if ($('#rProb')) $('#rProb').addEventListener('click', e => { e.stopPropagation(); openProb(); });
    $('#rAgain').addEventListener('click', e => { e.stopPropagation(); restart(); });
    el.onclick = e => e.stopPropagation();
    if (p.answered === c.length) {   // 最後まで答えたら記録（いちばんよい点を残す）
      let best = null; try { best = JSON.parse(store.get('hb.best.' + ID) || 'null'); } catch (e) { best = null; }
      if (!best || p.right > best.right) store.set('hb.best.' + ID, JSON.stringify({ right: p.right, total: c.length, at: Date.now() }));
    }
    store.set('hb.done.' + ID, '1'); store.del('hb.pos.' + ID);
    notify(Object.assign({ ev: 'result' }, p));
  }
  function showWatchEnd() {
    const el = $('#watchend'); el.classList.remove('hidden');
    el.innerHTML = '<div class="card"><h2>おしまい</h2><div class="qs">' + esc(L.field || '') + '　' + esc(L.title || '') + '</div>' +
      (L.points && L.points.length ? '<div class="pts"><span class="chip">この時間のポイント</span><ol>' + L.points.map(s => '<li>' + rich(s) + '</li>').join('') + '</ol></div>' : '') +
      '<div class="row"><button class="btn sub" id="wAgain" type="button">↻ もういちど見る</button><button class="btn sub" id="wTry" type="button">✏ 自分で答えながら</button><a class="btn sub menuLink" href="index.html">☰ 目次へ</a>' + nextLink() + '</div></div>';
    $('#wAgain').addEventListener('click', e => { e.stopPropagation(); restart(); });
    $('#wTry').addEventListener('click', e => { e.stopPropagation(); setWatch(false); setAuto(false); restart(); });
    el.onclick = e => e.stopPropagation();
    store.set('hb.done.' + ID, '1'); store.del('hb.pos.' + ID);
    notify({ ev: 'watched' });
  }
  /* つづきから：途中で目次へもどっても、次に開いたとき同じ場所から（答えも）。動画モード・埋めこみ・検査では記録しない */
  const keepPos = () => !watch && !EMBED && q.get('step') == null;
  function savePos() { if (keepPos() && si > 0 && si < steps.length - 1) store.set('hb.pos.' + ID, JSON.stringify({ si, n: steps.length, answers, rates, revealed })); }
  function readPos() {
    const raw = store.get('hb.pos.' + ID); if (!raw) return null;
    let p = null; try { p = JSON.parse(raw); } catch (e) { p = null; }
    if (typeof p === 'number') p = { si: p, n: steps.length };
    return p && p.n === steps.length && p.si > 0 && p.si < steps.length - 1 ? p : null;
  }
  function restart() { answers = {}; rates = {}; revealed = {}; go(0); }

  /* ---------- 問題文・はじめの画面 ---------- */
  function openProb() { if (!L.problem) return; $('#probov .el.prob').innerHTML = probHTML(); $('#probov').classList.remove('hidden'); $('#bProb').classList.add('on'); }
  function closeProb() { $('#probov').classList.add('hidden'); $('#bProb').classList.remove('on'); }
  function begin(resume, mode) {   // mode：'auto'（自動で進める）／'watch'（動画モード）
    $('#start').classList.add('hidden');
    if (mode === 'watch') setWatch(true); else if (mode === 'auto') setAuto(true);
    notify({ ev: 'start', steps: steps.length });
    const p = resume ? readPos() : null;
    if (p) { answers = p.answers || {}; rates = p.rates || {}; revealed = p.revealed || {}; go(p.si, true); } else restart();
  }
  function startScreen() {
    $('#start').classList.remove('hidden');
    $('#start .f').textContent = L.field || ''; $('#start .t').textContent = L.title || '';
    $('#start .lv').textContent = [L.level, L.time].filter(Boolean).join('　');
    const p = readPos(), r = $('#bResume');
    if (p) { r.classList.remove('hidden'); r.textContent = '▶ つづきから（' + (p.si + 1) + ' / ' + steps.length + '）'; } else r.classList.add('hidden');
    if (watch) $('#bStart').textContent = 'Enter で 再生（動画モード）'; else if (auto) $('#bStart').textContent = 'Enter で はじめる（自動）';
    notify({ ev: 'ready', steps: steps.length });
  }

  /* ---------- 画面の大きさ ---------- */
  function fit() { scale = Math.min(innerWidth / SW, innerHeight / SH); $('#stage').style.transform = 'scale(' + scale + ')'; }

  /* ---------- キーとボタン ---------- */
  function bind() {
    addEventListener('resize', fit); fit();
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key, starting = !$('#start').classList.contains('hidden');
      if (starting) {
        if (k === 'Enter' || k === ' ') { e.preventDefault(); begin(false); }
        else if (k === 'a' || k === 'A') { e.preventDefault(); begin(false, 'auto'); }
        else if (k === 'w' || k === 'W') { e.preventDefault(); begin(false, 'watch'); }
        else if (k === 's' || k === 'S') cycleSpeed(); else if (k === 'd' || k === 'D') setDec(!DEC);
        return;
      }
      if (k === 'Enter' || k === ' ' || k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
      else if (k === 'ArrowLeft' || k === 'Backspace' || k === 'PageUp') { e.preventDefault(); back(); }
      else if (k === 'Escape') closeProb();
      else if (k === 'q' || k === 'Q') { if ($('#probov').classList.contains('hidden')) openProb(); else closeProb(); }
      else if (k === 'h' || k === 'H') toggleHint();
      else if (k === 'a' || k === 'A') setAuto(!auto);
      else if (k === 'w' || k === 'W') setWatch(!watch);
      else if (k === 'p' || k === 'P') setPause(!paused);
      else if (k === 's' || k === 'S') cycleSpeed();
      else if (k === 'd' || k === 'D') { if (!NODEC) setDec(!DEC); }
      else if (k === 'r' || k === 'R') replay();
      else if (/^[1-4]$/.test(k)) { const st = steps[si]; if (!st || !st.ask) return; if (st.ask.type === 'think') { if (revealed[si]) rate(+k - 1); } else choose(+k - 1); }
    });
    const on = (sel, fn) => $(sel).addEventListener('click', e => { e.stopPropagation(); fn(); if (e.currentTarget.blur) e.currentTarget.blur(); });   // blur＝押したあとの Enter が、ボタンのクリックにならないように
    on('#bNext', next); on('#bBack', back); on('#bAgain', replay);
    on('#bProb', () => { if ($('#probov').classList.contains('hidden')) openProb(); else closeProb(); });
    on('#bAuto', () => setAuto(!auto)); on('#bPause', () => setPause(!paused)); on('#bSpeed', cycleSpeed); on('#bDec', () => setDec(!DEC));
    on('#probov', closeProb);
    on('#bStart', () => begin(false)); on('#bResume', () => begin(true)); on('#bAutoStart', () => begin(false, 'auto')); on('#bWatchStart', () => begin(false, 'watch'));
    $('#start').addEventListener('click', e => e.stopPropagation());
    $('#board').addEventListener('click', () => { if (paused) setPause(false); else next(); });   // 黒板をタッチ：一時停止中は「再開」、ふだんは つぎへ
    $('#cap').addEventListener('click', e => { if (e.target.closest('button')) return; if (paused) setPause(false); else next(); });
    $('#bMenu').addEventListener('click', () => savePos());
  }

  /* ---------- 台本を受け取る ---------- */
  window.HB = {
    rich, tex,
    lesson(def) {
      L = def; steps = def.steps.filter(Boolean); NODEC = !!def.noDec;
      if (EMBED) document.documentElement.classList.add('embed');
      if (NODEC) $('#bDec').classList.add('hidden');
      if (!def.problem) $('#bProb').classList.add('hidden'); else $('#bProb').textContent = '📄 ' + (def.problem.label || '問題');
      document.title = (def.title || '') + '｜高校数学 黒板解説';
      $('#hd .field').textContent = def.field || ''; $('#hd .ttl').textContent = def.title || '';
      bind(); setSpeed(SPEED); setDec(DEC, true); setAuto(auto); setPause(false);
      requestAnimationFrame(tick);
      if (q.get('step') != null) { $('#start').classList.add('hidden'); go(clamp(parseInt(q.get('step'), 10) || 0, 0, steps.length - 1), true); }
      else startScreen();
    }
  };
  // 自動テスト用（tools/check.mjs）。warp(ms)＝動画の時計を進めて、時間が来た予約を実行する
  window.HB_T = { steps: () => steps, go, next, back, choose, reveal, rate, state: () => state, si: () => si, finish: finishAnims, answers: () => answers, lesson: () => L,
    warp: ms => { vms += ms; runDue(); }, setAuto, setWatch, setPause, setSpeed, setDec, paused: () => paused, speed: () => SPEED, auto: () => auto, watch: () => watch, begin };

  if (!ID) { location.replace('index.html'); return; }
  const sc = document.createElement('script'); sc.src = 'scenes/' + encodeURIComponent(ID) + '.js';
  sc.onerror = () => { document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;font:20px sans-serif;position:fixed;left:20px;top:20px;z-index:99">台本が見つかりません：' + esc(ID) + '　<a style="color:#9ad8ff" href="index.html">目次へ</a></p>'); };
  document.body.appendChild(sc);
})();
