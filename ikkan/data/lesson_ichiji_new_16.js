/* 一次関数（新しい形） 第16時：図形の中を動く点がつくる面積を調べよう。 元：lesson_ichiji_16.js（授業ナビ ichiji の第16時）を、次のように組みかえた。活動型（動点）。
   ・ワークシートは A4 1枚（約12分）：今日の問い＝長方形 ABCD（AB＝6cm、BC＝4cm）の辺 AB、BC の上を、点 P が A から C まで毎秒 1cm で動く。三角形 APC の面積 y は、x の式でどう表せるか（図は x＝3、x＝8 の 2つ。数・図は全部印刷）。
     個人3分（x＝3、x＝8 の y を求め、y を x の式で表す。変域も）→ ペア3分（ペアの式・変域とくらべる）→ ことば → 例題（グラフをかき、y＝9 になる時刻を求める。座標平面は、解答のときだけ赤で直線と点）。
   ・演習プリントは表裏：表＝確かめる 2問（1 辺 BC 上を動く／2 正方形・場合を分ける）・使ってみる 4問（3 三角形 APC の式／4 まちがい探し／5 面積が等しくなる時刻／6 A→D→C と動く）／
     裏＝ひろげる（元の考えよう：速さを毎秒 2cm に変えると、グラフはどう変わるか。表・図は白紙、答えなし）・チャレンジ★★（元の入試（6）：グラフから AB、BC を読む。ヒントカードつき）。
   ・動く点の図は、この中の関数 FIG（SVG）で描いた（点の名前は A・B・C・D・P で、変数 x・y とぶつからない）。座標平面は CO。
   ・元の（4）直角三角形の y＝z は、図3を使いまわす（5）に変えた（長方形 ABCD の BC 上で、三角形 ABP と APC が等しくなる時刻。x＝11）。元の（5）のまちがい探しは、（4）にした（「A さん」は点 A とまぎらわしいので「花さん」）。
     新しい（6）は、A→D→C と動く問題（AB＝10cm、AD＝6cm、三角形 APC、y＝15 になるのは 3秒後と 11秒後）。元の発展（A→D→C）は使わない。元の（3）の「y＝18」は、量をへらすため省いた。
   ・checks：どの問題も、点 P の位置から三角形の面積を、座標（外積）で求め直し、答えの式と合うこと、式から求めた時刻が変域に入ること、を確かめた。新しい（5）（6）と、ひろげる（7）の表の値は、別の式で出し直した。元の数値・答えは、まちがいがなかった。
   検算：node tools/verify.cjs ichiji_new-16　／　見た目：node tools/check.cjs <出力先> ichiji_new-16 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, CO, SVG } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     area(a, b, c)：3点 a、b、c を頂点とする三角形の面積（外積）　EV・arith：答えの文の中の、文字のない式を計算する */
  const area = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  const EV = s => {
    let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))');
    return new Function('return ' + t)();
  };
  const arith = t => String(t).replace(/…[①-⑥]/g, ' ').replace(/[^0-9a-z+\-−×÷＝().\[\]\/^]+/g, ' ').split(' ').map(u => u.replace(/^[a-z]＝/, '')).filter(u => u.includes('＝') && !/[a-z]/.test(u)).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(EV).every(v => near(v, EV(p[0]))); });
  const LIB = 'const area = ' + area + '; const EV = ' + EV + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const blank = n => Array.from({ length: n }, () => '');

  /* 座標平面 CO に、白い地つきの字を足す。labs：[{ t：字, at：[x, y], anchor, ans：false なら生徒用にも出す（黒） }]。省略なら、解答を表示したときだけ（赤） */
  const PLANE = (o, labs) => {
    const fig = CO(o);
    return SVG((W, H, h) => {
      const u = Math.min((W - 13) / (o.xmax - o.xmin), (H - 13) / (o.ymax - o.ymin)), ox = 6 + (W - 13 - u * (o.xmax - o.xmin)) / 2, oy = 7 + (H - 13 - u * (o.ymax - o.ymin)) / 2;
      const X = x => ox + (x - o.xmin) * u, Y = y => oy + (o.ymax - y) * u;
      const lab = l => {
        const w = IK.render.emOf(l.t.replace(/\{\{|\}\}|\\/g, '')) * 3 * 0.62 + 1.4, x = X(l.at[0]), a = l.anchor || 'start', x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
        return `<rect x="${(x0 - 0.5).toFixed(2)}" y="${(Y(l.at[1]) - 2.7).toFixed(2)}" width="${w.toFixed(2)}" height="3.9" fill="#fff"/>` + h.rich(x, Y(l.at[1]), l.t, 3, a);
      };
      const g = (labs || []).filter(l => l.ans === false).map(lab).join(''), r = (labs || []).filter(l => l.ans !== false).map(lab).join('');
      return fig.svg(W, H, h) + g + (r ? h.ans(r) : '');
    });
  };

  /* 図形と動く点 P の図。o：{ v：{ 頂点の名前: [x, y]（数学の向き：y が上） }, order：頂点を回る順, P：[x, y], tri：色をぬる三角形の頂点の名前（'P' も使える）,
        dims：[{ a, b, t：辺の長さの字 }]（辺 a−b の外がわ）, cap：見出し, plab：[dx, dy, anchor]（P の字の位置。省略は自動）, padx：左右の余白 }
     点の名前は A・B・C・D・P だけ（変数 x・y とぶつけない） */
  const FIG = o => SVG((W, H, h) => {
    const V = o.v, names = o.order, pt = k => (k === 'P' ? o.P : V[k]);
    const xs = names.map(k => V[k][0]), ys = names.map(k => V[k][1]), minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const top = o.cap ? 11 : 8, bot = 7, padx = o.padx || 12, bw = maxx - minx, bh = maxy - miny;
    const s = Math.min((W - 2 * padx) / bw, (H - top - bot) / bh);
    const X = x => (W - bw * s) / 2 + (x - minx) * s, Y = y => top + (H - top - bot - bh * s) / 2 + (maxy - y) * s;
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    const onSeg = (a, u, v) => Math.abs((v[0] - u[0]) * (a[1] - u[1]) - (v[1] - u[1]) * (a[0] - u[0])) < 1e-9 && a[0] >= Math.min(u[0], v[0]) - 1e-9 && a[0] <= Math.max(u[0], v[0]) + 1e-9 && a[1] >= Math.min(u[1], v[1]) - 1e-9 && a[1] <= Math.max(u[1], v[1]) + 1e-9;
    const onBoundary = (p, q) => names.some((k, i) => { const u = V[k], v = V[names[(i + 1) % names.length]]; return onSeg(p, u, v) && onSeg(q, u, v); });
    const pts = list => list.map(p => X(p[0]).toFixed(2) + ',' + Y(p[1]).toFixed(2)).join(' ');
    let out = '';
    if (o.tri) out += `<polygon points="${pts(o.tri.map(pt))}" fill="#e7ecf2"/>`;
    out += `<polygon points="${pts(names.map(pt))}" fill="none" stroke="#222" stroke-width="0.32" stroke-linejoin="round"/>`;
    if (o.tri) o.tri.forEach((k, i) => { const p = pt(k), q = pt(o.tri[(i + 1) % o.tri.length]); if (!onBoundary(p, q)) out += h.ln(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), '#222', 0.28, ' stroke-dasharray="1.2 0.9"'); });
    if (o.P) out += `<circle cx="${X(o.P[0]).toFixed(2)}" cy="${Y(o.P[1]).toFixed(2)}" r="0.95" fill="#222"/>`;
    names.forEach(k => {
      const p = V[k], dx = p[0] - cx, dy = p[1] - cy;
      out += h.tx(X(p[0]) + (dx > 0 ? 1.5 : -1.5), Y(p[1]) + (dy > 0 ? -1.2 : 4.0), k, 3.2, dx > 0 ? 'start' : 'end', ' class="pl"');
    });
    if (o.P) {
      const p = o.P; let l = o.plab;
      if (!l) l = Math.abs(p[1] - miny) < 1e-9 ? [0, 4.8, 'middle'] : Math.abs(p[0] - maxx) < 1e-9 ? [1.8, 1.1, 'start'] : Math.abs(p[1] - maxy) < 1e-9 ? [0, -1.8, 'middle'] : [-1.8, 1.1, 'end'];
      out += h.tx(X(p[0]) + l[0], Y(p[1]) + l[1], 'P', 3.2, l[2], ' class="pl"');
    }
    (o.dims || []).forEach(d => {
      const a = V[d.a], b = V[d.b], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
      if (nx * (m[0] - cx) + ny * (m[1] - cy) < 0) { nx = -nx; ny = -ny; }
      out += h.rich(X(m[0]) + nx * 3.6, Y(m[1]) - ny * 3.6 + 1, d.t, 2.9, Math.abs(nx) < 0.4 ? 'middle' : nx > 0 ? 'start' : 'end');
    });
    if (o.cap) out += h.tx(W / 2, 3.8, h.svgMath(o.cap), 3, 'middle', ' class="cap"');
    return out;
  });
  const RECT = (w, hh) => ({ A: [0, 0], B: [w, 0], C: [w, hh], D: [0, hh] });   // A 左下、B 右下、C 右上、D 左上

  /* ---------------- 問題のデータ ---------------- */
  // 点 P が辺 AB（A→B）、辺 BC（B→C）の上を、毎秒 sp cm で動くときの位置（x 秒後）。長方形 ABCD（AB＝w、BC＝hh）。AD（A→D）、DC（D→C）の順は walkD
  const walk = (w, hh, sp, x) => { const d = sp * x; return d <= w ? [d, 0] : d <= w + hh ? [w, d - w] : [w - (d - w - hh), hh]; };
  const walkD = (w, hh, sp, x) => { const d = sp * x; return d <= hh ? [0, d] : [d - hh, hh]; };
  // 今日の問い・例題・考えよう：AB＝6、BC＝4、毎秒 1cm、三角形 APC
  const T_TASK = '（例）x＝3　AP＝3　y＝[[1/2]]×3×4＝6\nx＝8　PC＝2　y＝[[1/2]]×2×6＝6\n辺 AB 上（0≦x≦6）　y＝2x\n辺 BC 上（6≦x≦10）　PC＝10−x　y＝−3x+30';
  const T_EX = 'グラフは、原点と点 (6, 12) を結ぶ線と、\n点 (6, 12) と点 (10, 0) を結ぶ線\ny＝9 のとき\n2x＝9　x＝[[9/2]]　（0≦x≦6 に合う）\n−3x+30＝9　x＝7　（6≦x≦10 に合う）\n[[9/2]] 秒後と、7秒後';
  const figTask = (x, cap) => FIG({ v: RECT(6, 4), order: ['A', 'B', 'C', 'D'], P: walk(6, 4, 1, x), tri: ['A', 'P', 'C'], dims: [{ a: 'D', b: 'C', t: '6cm' }, { a: 'A', b: 'D', t: '4cm' }], cap });
  const ORIG = [{ a: 2, b: 0, from: 0, to: 6 }, { a: -3, b: 30, from: 6, to: 10 }];   // もとのグラフ（毎秒 1cm）

  const DEF = {
    unit: 'ichiji_new', unitName: '一次関数（新しい形）', form: 'new', no: '第16時', title: '図形の中を動く点がつくる面積を調べよう',
    summary: '長方形の辺上を動く点がつくる三角形の面積を、点がどの辺上にあるかで場合を分けて、x の式と変域、グラフに表す。考えようは、点の速さを変えると、グラフがどう変わるか。',
    head: '一次関数　第16時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題：AB＝6、BC＝4、毎秒 1cm、三角形 APC。面積を座標から求め直す。x＝3 で 6、x＝8 で 6。0≦x≦6 は 2x、6≦x≦10 は −3x+30。頂点 (6, 12)。y＝9 は x＝9/2、7
      chk('第16時 今日の問い・例題', `const w = 6, hh = 4, A = [0, 0], C = [w, hh], walk = ${walk}, y = x => (x <= 6 ? 2 * x : -3 * x + 30); let ok = true; for (let i = 0; i <= 20; i++) { const x = i / 2, P = walk(w, hh, 1, x); ok = ok && near(area(A, P, C), y(x)); } return ok && near(area(A, walk(w, hh, 1, 3), C), 6) && near(area(A, walk(w, hh, 1, 8), C), 6) && near(1 / 2 * 3 * 4, 6) && near(10 - 8, 2) && near(1 / 2 * 2 * 6, 6) && near(2 * 6, 12) && near(-3 * 6 + 30, 12) && near(-3 * 10 + 30, 0) && near(2 * 4.5, 9) && near(-3 * 7 + 30, 9) && near(area(A, walk(w, hh, 1, 4.5), C), 9) && near(area(A, walk(w, hh, 1, 7), C), 9) && 4.5 >= 0 && 4.5 <= 6 && 7 >= 6 && 7 <= 10;`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：毎秒 2cm。3秒後に B、5秒後に C。y＝4x（0≦x≦3）、y＝−6x+30（3≦x≦5）。山の高さは 12 のまま。表の x＝0〜5 の y は 0、4、8、12、6、0
      chk('第16時 考えよう', `const w = 6, hh = 4, A = [0, 0], C = [w, hh], walk = ${walk}; let ok = true; for (let i = 0; i <= 10; i++) { const x = i / 2, P = walk(w, hh, 2, x), y = x <= 3 ? 4 * x : -6 * x + 30; ok = ok && near(area(A, P, C), y); } const col = [0, 1, 2, 3, 4, 5].map(x => area(A, walk(w, hh, 2, x), C)); return ok && col.join() === '0,4,8,12,6,0' && near(6 / 2, 3) && near((6 + 4) / 2, 5) && near(4 * 3, 12) && near(-6 * 3 + 30, 12) && near(-6 * 5 + 30, 0);`),
      // 確かめる（1）AB＝6、BC＝8、B から C へ毎秒 2cm、三角形 ABP。BP＝2x、y＝6x、0≦x≦4、0≦y≦24
      chk('第16時 確かめる（1）', `const A = [0, 0], B = [6, 0]; let ok = true; for (let i = 0; i <= 8; i++) { const x = i / 2, P = [6, 2 * x]; ok = ok && near(area(A, B, P), 6 * x); } return ok && near(8 / 2, 4) && near(6 * 4, 24) && near(1 / 2 * 6 * 2 * 4, 24);`),
      // （2）正方形 8cm、A→B→C 毎秒 1cm、三角形 APD。0≦x≦8 で 4x、8≦x≦16 で 32
      chk('第16時 確かめる（2）', `const w = 8, A = [0, 0], D = [0, 8], walk = ${walk}; let ok = true; for (let i = 0; i <= 32; i++) { const x = i / 2, P = walk(w, w, 1, x); ok = ok && near(area(A, P, D), x <= 8 ? 4 * x : 32); } return ok && near(1 / 2 * 8 * 8, 32) && near(4 * 8, 32) && near(8 + 8, 16);`),
      // 使ってみる（3）AB＝8、BC＝6、A→B→C 毎秒 1cm、三角形 APC。0≦x≦8 で 3x、8≦x≦14 で −4x+56。PC＝14−x
      chk('第16時 使ってみる（3）', `const w = 8, hh = 6, A = [0, 0], B = [w, 0], C = [w, hh], walk = ${walk}; let ok = true; for (let i = 0; i <= 28; i++) { const x = i / 2, P = walk(w, hh, 1, x); ok = ok && near(area(A, P, C), x <= 8 ? 3 * x : -4 * x + 56); if (x >= 8) ok = ok && near(Math.hypot(P[0] - C[0], P[1] - C[1]), 14 - x) && near(area(A, P, C), 1 / 2 * (14 - x) * 8); } return ok && near(3 * 8, 24) && near(-4 * 8 + 56, 24) && near(-4 * 14 + 56, 0) && near(8 + 6, 14);`),
      // （4）まちがい探し：花さんの式 4x−32 は、BC 上（8≦x≦14）の三角形 ABP（底辺 AB＝8、高さ BP＝x−8）の面積。三角形 APC は −4x+56。2つは x＝11 のときだけ等しい
      chk('第16時 使ってみる（4）', `const w = 8, hh = 6, A = [0, 0], B = [w, 0], C = [w, hh], walk = ${walk}; let ok = true; for (let i = 16; i <= 28; i++) { const x = i / 2, P = walk(w, hh, 1, x); ok = ok && near(area(A, B, P), 4 * x - 32) && near(area(A, P, C), -4 * x + 56) && (near(x, 11) === near(4 * x - 32, -4 * x + 56)); } return ok && near(4 * 10 - 32, 8) && near(area(A, B, walk(w, hh, 1, 10)), 8) && near(area(A, walk(w, hh, 1, 10), C), 16);`),
      // （5）三角形 ABP＝三角形 APC：BP＝PC＝3（BC の中点）で x＝8+3＝11。面積はどちらも 12
      chk('第16時 使ってみる（5）', `const w = 8, hh = 6, A = [0, 0], B = [w, 0], C = [w, hh], walk = ${walk}, P = walk(w, hh, 1, 11); return near(area(A, B, P), area(A, P, C)) && near(area(A, B, P), 12) && near(P[1], 3) && near(hh - P[1], 3) && near(11 - 8, 3) && near(14 - 11, 3) && near(11 - 8, 14 - 11) && near((14 + 8) / 2, 11) && near(4 * 11 - 32, 12) && near(-4 * 11 + 56, 12);`),
      // （6）AB＝10、AD＝6、A→D→C 毎秒 1cm、三角形 APC。0≦x≦6 で 5x、6≦x≦16 で −3x+48。y＝15 は x＝3、11。6 で山（30）
      chk('第16時 使ってみる（6）', `const w = 10, hh = 6, A = [0, 0], C = [w, hh], walkD = ${walkD}; let ok = true; for (let i = 0; i <= 32; i++) { const x = i / 2, P = walkD(w, hh, 1, x); ok = ok && near(area(A, P, C), x <= 6 ? 5 * x : -3 * x + 48); } return ok && near(area(A, walkD(w, hh, 1, 3), C), 15) && near(area(A, walkD(w, hh, 1, 11), C), 15) && near(5 * 3, 15) && near(-3 * 11 + 48, 15) && near((48 - 15) / 3, 11) && 3 >= 0 && 3 <= 6 && 11 >= 6 && 11 <= 16 && near(5 * 6, 30) && near(-3 * 6 + 48, 30) && near(-3 * 16 + 48, 0) && near(6 + 10, 16);`),
      // チャレンジ（8）グラフ：(0, 0)、(5, 10)、(9, 0)。速さ毎秒 1cm、AB＝5、BC＝4、三角形 APC＝½×5×4＝10。式 2x、−5/2 x+45/2。y＝6 は x＝3、33/5
      chk('第16時 チャレンジ（8）', `const w = 5, hh = 4, A = [0, 0], C = [w, hh], walk = ${walk}; let ok = true; for (let i = 0; i <= 18; i++) { const x = i / 2, P = walk(w, hh, 1, x), y = x <= 5 ? 2 * x : -5 / 2 * x + 45 / 2; ok = ok && near(area(A, P, C), y); } return ok && near(area(A, walk(w, hh, 1, 5), C), 10) && near(2 * 5, 10) && near(-5 / 2 * 9 + 45 / 2, 0) && near(2 * 3, 6) && near(-5 / 2 * (33 / 5) + 45 / 2, 6) && 33 / 5 >= 5 && 33 / 5 <= 9 && near(1 / 2 * 5 * 4, 10) && near(5 + 4, 9) && near((10 - 0) / (5 - 0), 2) && near((0 - 10) / (9 - 5), -5 / 2);`),
      // 小テスト：AB＝6、BC＝5。B から C へ毎秒 1cm、三角形 ABP＝3x（0≦x≦5）。y＝6 は x＝2。C から D へ（5≦x≦11）は 15 で一定。チャレンジ：三角形 APD＝15（0≦x≦5）、5/2(11−x)（5≦x≦11）。y＝10 は x＝7
      chk('第16時 小テスト', `const A = [0, 0], B = [6, 0], D = [0, 5], walk = (x) => (x <= 5 ? [6, x] : [6 - (x - 5), 5]); let ok = true; for (let i = 0; i <= 22; i++) { const x = i / 2, P = walk(x); if (x <= 5) ok = ok && near(area(A, B, P), 3 * x); else ok = ok && near(area(A, B, P), 15); ok = ok && near(area(A, P, D), x <= 5 ? 15 : 5 / 2 * (11 - x)); } return ok && near(3 * 2, 6) && near(3 * 5, 15) && near(area(A, B, walk(8)), 15) && near(5 / 2 * (11 - 7), 10) && near(area(A, walk(7), D), 10) && near(1 / 2 * 5 * 6, 15) && 7 >= 5 && 7 <= 11 && near(5 + 6, 11);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('図形の中を動く点がつくる面積を調べよう'),
      K('今日の問い', '長方形 ABCD の辺 AB、BC の上を、点 P が A から C まで毎秒 1cm で動く。x秒後の三角形 APC の面積 y cm^2 は、x の式でどう表せるだろう。', 2),
      F(5, figTask(3, 'x＝3 のとき'), figTask(8, 'x＝8 のとき')),
      T('①', '自分の考え（3分）　x＝3、x＝8 のときの y を求め、y を x の式で表そう。変域も書こう。', 2),
      B(4, T_TASK),
      T('②', 'ペアの考え（3分）　ペアの式・変域と、自分のをくらべよう。', 1),
      B(4, ''),
      G(1),
      WD('三角形の面積＝[[1/2]]×{{底辺}}×{{高さ}}\n点がどの辺の上にあるかで{{場合を分け}}る。\n文字がとる値の範囲を、{{変域}}という。', 3, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', 'x と y の関係を表すグラフを、右の図にかこう。また、y＝{{9}} になるのは、何秒後か。', 3),
        B(6, T_EX)
      ], [
        F(9, PLANE({ xmin: 0, xmax: 10, ymin: 0, ymax: 12, labelStep: 1,
          lines: [{ a: 2, b: 0, from: 0, to: 6 }, { a: -3, b: 30, from: 6, to: 10 }, { a: 0, b: 9, dash: true }], points: [{ x: 6, y: 12 }, { x: 4.5, y: 9 }, { x: 7, y: 9 }] },
          [{ t: 'y＝2x', at: [0.3, 9.6] }, { t: 'y＝−3x+30', at: [7.4, 11.4] }, { t: '(6, 12)', at: [2.8, 12.0], anchor: 'start' }]))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', '長方形の辺の上を、点 P が動く。x秒後の面積を y として考えよう。'),
      WD('① 三角形の面積は、[[1/2]]×{{底辺}}×{{高さ}}で求める。\n② 点がどの辺の上にあるかで{{場合を分け}}て、式を求める。\n③ x のとりうる値の範囲を、x の{{変域}}という。\n④ 辺ごとに式がちがうとき、グラフは{{線分}}をつないだ形になる。', 4, { label: 'ことば' }),
      F(4,
        FIG({ v: RECT(6, 8), order: ['A', 'B', 'C', 'D'], P: [6, 3], tri: ['A', 'B', 'P'], dims: [{ a: 'A', b: 'D', t: '8cm' }, { a: 'D', b: 'C', t: '6cm' }], cap: '図1', padx: 8 }),
        FIG({ v: RECT(8, 8), order: ['A', 'B', 'C', 'D'], P: [5, 0], tri: ['A', 'P', 'D'], dims: [{ a: 'D', b: 'C', t: '8cm' }, { a: 'A', b: 'D', t: '8cm' }], cap: '図2', padx: 8 }),
        FIG({ v: RECT(8, 6), order: ['A', 'B', 'C', 'D'], P: [8, 2], tri: ['A', 'P', 'C'], dims: [{ a: 'D', b: 'C', t: '8cm' }, { a: 'A', b: 'D', t: '6cm' }], cap: '図3', padx: 8 }),
        FIG({ v: RECT(10, 6), order: ['A', 'B', 'C', 'D'], P: [0, 3], tri: ['A', 'P', 'C'], dims: [{ a: 'D', b: 'C', t: '10cm' }, { a: 'A', b: 'D', t: '6cm' }], cap: '図4', padx: 8 })),
      C2([
        T('（1）', '図1の P は B から C まで毎秒 2cm。三角形 ABP の y を x の式と変域で表そう。', 3),
        B(3, 'BP＝2x\ny＝[[1/2]]×6×2x＝6x\n0≦x≦4')
      ], [
        T('（2）', '図2の P は A から B、C へ毎秒 1cm。三角形 APD の y を、辺 AB 上、辺 BC 上で求めよう。', 3),
        B(3, 'AB 上　y＝4x（0≦x≦8）\nBC 上　高さは 8 のまま\ny＝[[1/2]]×8×8＝32')
      ], '1:1'),
      MA('【説明】（1）で、BP を x で表したわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '点 P は毎秒 1cm で動く。x秒後の三角形の面積を y として求めよう。'),
      C2([
        T('（3）', '図3の三角形 APC の y を、辺 AB 上、辺 BC 上で、x の式で表そう。', 3),
        B(3, 'AB 上　y＝3x（0≦x≦8）\nBC 上　PC＝14−x\ny＝−4x+56（8≦x≦14）')
      ], [
        T('（4）', '（3）で、花さんは辺 BC 上の y を [[1/2]]×(x−8)×8＝4x−32 とした。まちがいを説明しよう。', 3),
        B(3, 'BP を底辺にすると、\n三角形 ABP になる。\nAPC は PC＝14−x が底辺')
      ], '1:1'),
      C2([
        T('（5）', '図3で、辺 BC 上のとき、三角形 ABP と APC の面積が等しくなるのは何秒後か。', 3),
        B(3, 'BP＝x−8、PC＝14−x\nx−8＝14−x　x＝11\n11秒後')
      ], [
        T('（6）', '図4の P は A から D、C へ。三角形 APC の y が 15 になる時刻を、すべて答えよう。', 3),
        B(3, 'AD 上　y＝5x　x＝3\nDC 上　y＝−3x+48\n　x＝11　3秒後と 11秒後')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：点の速さを変えると、グラフはどうなるか考えよう。'),
      T('（7）', 'AB＝6cm、BC＝4cm の長方形 ABCD で、P は A から B、C へ動く。毎秒 1cm のときの、三角形 APC の面積 y のグラフが図の黒い線である。P の速さを毎秒 2cm にすると、グラフはどう変わるだろう。表をうめて、図にかき、くらべよう。', 4),
      C2([
        TB('x（秒後）', ['0', '1', '2', '3', '4', '5'], [['y（cm^2）', blank(6)]], { hw: 22, width: 84 }),
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        F(8, PLANE({ xmin: 0, xmax: 10, ymin: 0, ymax: 12, labelStep: 2, given: { lines: ORIG } }, []))
      ], '1:1'),
      T('', 'ほかの速さ（毎秒 3cm など）でも、確かめよう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '長方形 ABCD の辺上を、点 P が A から B を通って C まで、毎秒 1cm で動く。x秒後の三角形 APC の面積 y cm^2 は、図のグラフになった。\n① AB、BC の長さ\n② y＝6 になる時刻', 7),
        B(5, '① 頂点 (5, 10)。5秒後に B　AB＝5cm\n　 9秒後に C　BC＝9−5＝4（cm）\n② y＝2x　y＝−[[5/2]]x+[[45/2]]\n　 x＝3　x＝[[33/5]]\n　 3秒後と、[[33/5]] 秒後')
      ], [
        F(7, PLANE({ xmin: 0, xmax: 10, ymin: 0, ymax: 11, labelStep: 2, given: { lines: [{ a: 2, b: 0, from: 0, to: 5 }, { a: -2.5, b: 22.5, from: 5, to: 9 }], points: [{ x: 5, y: 10 }, { x: 9, y: 0 }] } },
          [{ t: '(5, 10)', at: [5.4, 10.2], ans: false }])),
        MA('① 頂点で、点 P はどこにいるだろう。\n② 辺 BC 上の線は、どの 2点を通るかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('', 'AB＝6cm、BC＝5cm の長方形 ABCD がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して x秒後の、三角形 ABP の面積を y cm^2 とする。', 5)
      ], [
        F(6, FIG({ v: RECT(6, 5), order: ['A', 'B', 'C', 'D'], P: [6, 2], tri: ['A', 'B', 'P'], dims: [{ a: 'A', b: 'B', t: '6cm' }, { a: 'B', b: 'C', t: '5cm' }] }))
      ], '3:2'),
      T('（1）', 'P が辺 BC 上にあるとき、y を x の式で表そう。（3点）', 1),
      B(2, '底辺 AB＝6cm、高さ BP＝x cm\ny＝[[1/2]]×6×x＝3x'),
      T('（2）', '（1）のとき、x の変域を求めよう。（2点）', 1),
      B(2, 'C に着くのは 5÷1＝5（秒後）　　0≦x≦5'),
      T('（3）', '三角形 ABP の面積が 6cm^2 になるのは、何秒後か。（3点）', 1),
      B(2, '3x＝6　　x＝2　（0≦x≦5 に合う）　　2秒後'),
      T('（4）', 'P が辺 CD 上にあるとき（5≦x≦11）の、y の値を求めよう。（2点）', 2),
      B(2, '底辺 AB＝6cm、高さは BC＝5cm で変わらない\ny＝[[1/2]]×6×5＝15'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '同じ P について、三角形 APD の面積が 10cm^2 になるのは、何秒後か。', 2),
      B(6, '辺 BC 上（0≦x≦5）　底辺 AD＝5cm、高さ AB＝6cm で\ny＝[[1/2]]×5×6＝15　10 にならない\n辺 CD 上（5≦x≦11）　PD＝11−x（cm）\ny＝[[5/2]](11−x)　　[[5/2]](11−x)＝10　11−x＝4　x＝7\n7秒後（5≦x≦11 に合う）')
    ]
  };
  // 教卓の解答（B の答え）のすべてについて、文字のない式が、計算として正しいか確かめる
  DEF.checks.push(chk('第16時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('ichiji_new-16', DEF);
})();
