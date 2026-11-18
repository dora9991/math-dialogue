/* 数学A 第2章 図形の性質 三角形の性質 ⑥：三角形の辺と角の大小・成立条件
   例はすべて自作（a=7, b=5, c=8 → B<A<C（A=60°）／A=50°, B=70° → a<c<b／
   5, 7, 11 はできる・3, 5, 9 などはできない／x, 5, 8 → 3<x<13／4, x, 2x+1 → 1<x<3）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。図の三角形は、その長さどおりの形でかいている。 */
(function () {
  const POINTS = [
    '△ABC で　$b>c\\iff B>C$。**大きい辺の向かいの角は大きい**（逆に、大きい角の向かいの辺は大きい）',
    '証明は、AC 上に AD $=$ AB となる点 D をとり、**二等辺三角形** と **外角**（$\\angle\\mathrm{ADB}>\\angle\\mathrm{C}$）を使う',
    '三角形ができる条件：$|b-c|<a<b+c$。3つの長さなら「**いちばん長い辺 < 残り2辺の和**」を確かめればよい'
  ];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];

  // 図1：b>c の三角形 B(0,0) C(7,0) A(2,4)（c=2√5, b=√41）。D は AC 上で AD=AB
  const A = [2, 4], B = [0, 0], C = [7, 0], G = G3(A, B, C), cc = Math.hypot(2, 4), bb = Math.hypot(5, 4);
  const D = [A[0] + (C[0] - A[0]) * cc / bb, A[1] + (C[1] - A[1]) * cc / bb];
  const tri = (extra) => [{ k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.05 }].concat(extra || [], [
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 }]);

  // 図2：a=7, b=5, c=8。B(0,0) C(7,0) A(44/7, √(64−(44/7)²))（A=60°）
  const eA = [44 / 7, Math.sqrt(64 - (44 / 7) ** 2)], eB = [0, 0], eC = [7, 0], eG = G3(eA, eB, eC);

  // 図3：できる（5, 7, 11）とできない（3, 5, 9）。上の段 y=6、下の段 y=0
  const tB = [0, 6], tC = [11, 6], tA = [97 / 22, 6 + Math.sqrt(25 - (97 / 22) ** 2)];

  HB.lesson({
    id: 'ma2-06', field: '数学A　図形の性質', title: '三角形の辺と角の大小・成立条件', level: '三角形の性質', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$a=7,\\ b=5,\\ c=8$ の △ABC で、角 A, B, C の大小を答えよ。',
        '(2)　$A=50^\\circ,\\ B=70^\\circ$ の △ABC で、辺 $a,\\ b,\\ c$ の大小を答えよ。',
        '(3)　3辺の長さが $x,\\ 5,\\ 8$ の三角形があるとき、$x$ の値の範囲を求めよ。',
        '(4)　3辺の長さが $4,\\ x,\\ 2x+1$ の三角形があるとき、$x$ の値の範囲を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '三角形の章の最後です。辺の長さと角の大きさの **大小関係**、そして3つの長さで三角形が **できる条件** を調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '辺と角の **大小関係** で、角や辺の大小を比べられる\n三角形ができる条件から $x$ の範囲を求められる' }] },

      // ---------- 辺と角の大小 ----------
      { clear: true, part: '辺と角の大小', say: '△ABC で、辺 $b$（$=$ CA）が辺 $c$（$=$ AB）より長いとき、$b$ の向かいの角 B は、$c$ の向かいの角 C より大きくなります。',
        add: [{ t: 'h', text: '辺と角の大小' },
          { t: 'box', c: 'y', label: '定理', tex: 'b>c\\iff B>C' },
          { t: 'p', text: '**大きい辺の向かいの角は大きい**\n**大きい角の向かいの辺は大きい**' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.0, -1.2, 8.0, 5.2], w: 560, h: 398, items: tri([
            sl(A, C, G, 'b', 'y', 24), sl(A, B, G, 'c', 'b', 24),
            { k: 'angle', o: B, a: C, b: A, rp: 40, c: 'y', label: 'B', lr: 22 }, { k: 'angle', o: C, a: A, b: B, rp: 52, c: 'b', label: 'C', lr: 16 }]) }] },
      { say: '$b>c\\Rightarrow B>C$ を示します。AC $>$ AB なので、辺 AC 上に AD $=$ AB となる点 D がとれます。△ABD は二等辺三角形なので、∠ABD $=$ ∠ADB です。',
        add: [{ t: 'p', size: 'sm', text: '証明　AC 上に AD $=$ AB となる点 D をとる' },
          { t: 'm', tex: '\\angle\\mathrm{ABD}=\\angle\\mathrm{ADB}', note: '△ABD は二等辺三角形' }],
        draw: [{ fig: 'f1', items: [{ k: 'poly', pts: [A, B, D], close: true, fill: 'p', alpha: 0.18, noStroke: true }, { k: 'seg', a: B, b: D, c: 'p', wd: 3 },
          { k: 'pt', at: D, name: 'D', dir: 'ne', r: 4, c: 'p' },
          { k: 'angle', o: B, a: D, b: A, rp: 26, c: 'p' }, { k: 'angle', o: D, a: A, b: B, rp: 30, c: 'p' }] }] },
      { ask: { type: 'choice', q: '∠ADB と ∠C の大小は？',
        opts: ['∠ADB $<$ ∠C', '∠ADB $=$ ∠C', 'どちらともいえない', '∠ADB $>$ ∠C'], ok: 3,
        why: { 0: '∠ADB は △DBC の外角。外角は、となりにない内角 ∠C より大きくなります。', 1: '∠ADB $=$ ∠DBC $+$ ∠C。∠DBC の分だけ大きくなります。', 2: '外角の性質で、いつでも比べられます。' },
        good: '∠ADB は △DBC の **外角** なので、∠ADB $=$ ∠DBC $+$ ∠C $>$ ∠C。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{ADB}=\\angle\\mathrm{DBC}+\\angle\\mathrm{C}>\\angle\\mathrm{C}', note: '△DBC の外角' }] } },
      { say: 'まとめると、∠B は ∠ABD より大きく、∠ABD $=$ ∠ADB $>$ ∠C。よって B $>$ C です。逆の「B $>$ C なら $b>c$」も成り立ちます。',
        add: [{ t: 'm', tex: 'B>\\angle\\mathrm{ABD}=\\angle\\mathrm{ADB}>C', note: 'よって $B>C$' }] },

      // ---------- 例題 ----------
      { clear: true, part: '例題　大小を比べる', say: '例題です。$a=7,\\ b=5,\\ c=8$ の三角形で、角の大小を比べます。各辺の **向かいの角** を組にして考えます。',
        add: [{ t: 'h', text: '例題　大小を比べる' },
          { t: 'p', text: '(1)　$a=7,\\ b=5,\\ c=8$ の △ABC で、角 A, B, C の大小は？' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.0, -1.2, 8.2, 6.0], w: 560, h: 438, items: [
            { k: 'poly', pts: [eA, eB, eC], close: true, fill: 'w', alpha: 0.05 },
            sl(eB, eC, eG, '7', 'w', 22), sl(eC, eA, eG, '5', 'w', 22), sl(eA, eB, eG, '8', 'w', 22),
            { k: 'angle', o: eA, a: eB, b: eC, rp: 34, c: 'y' }, { k: 'angle', o: eB, a: eC, b: eA, rp: 44, c: 'y' }, { k: 'angle', o: eC, a: eA, b: eB, rp: 30, c: 'y' },
            { k: 'pt', at: eA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: eB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: eC, name: 'C', dir: 'se', r: 4 }] }] },
      { ask: { type: 'choice', q: '$a=7,\\ b=5,\\ c=8$ のとき、角の大小は？',
        opts: ['$C<A<B$', '$A<B<C$', '$B<A<C$', '$B<C<A$'], ok: 2,
        why: { 0: '逆です。大きい辺の **向かいの角** が大きくなります。', 1: '辺の長さを比べずに、文字の順に並べています。$b<a<c$ です。', 3: 'いちばん長い辺は $c=8$。だから、いちばん大きい角は C です。' },
        good: '$b<a<c$ なので、向かいの角も $B<A<C$。図でも C がいちばん大きい角です。',
        add: [{ t: 'm', tex: 'b<a<c\\ \\text{より}\\ \\ans{B<A<C}' }],
        draw: [{ fig: 'f2', items: [{ k: 'label', at: eB, text: '小', c: 'p', size: 22, dx: 74, dy: -20 }, { k: 'label', at: eC, text: '大', c: 'p', size: 22, dx: -42, dy: -32 }] }] } },
      { ask: { type: 'choice', q: '(2)　$A=50^\\circ,\\ B=70^\\circ$ の △ABC で、辺の大小は？',
        opts: ['$a<b<c$', '$a<c<b$', '$b<c<a$', '$c<a<b$'], ok: 1,
        why: { 0: '先に C を出します。C $=60^\\circ$ なので、$c$ は真ん中です。', 2: '逆です。小さい角の向かいの辺が短くなります。', 3: 'C $=180^\\circ-50^\\circ-70^\\circ=60^\\circ$。C は A より大きいので $c>a$ です。' },
        good: 'C $=60^\\circ$。$A<C<B$ なので、向かいの辺も $a<c<b$。',
        add: [{ t: 'm', tex: 'C=60^\\circ,\\ A<C<B\\ \\text{より}\\ \\ans{a<c<b}' }] } },

      // ---------- 成立条件 ----------
      { clear: true, part: '三角形の成立条件', say: '3本の棒で三角形を作ります。両はしから円をかいて交われば、三角形ができます。2辺の和が残りの辺より **大きい** ことが必要です。',
        add: [{ t: 'h', text: '三角形ができる条件' },
          { t: 'p', text: '三角形の2辺の和は、残りの1辺より大きい\n（2点を結ぶいちばん短い道は線分だから）' },
          { t: 'm', tex: 'a<b+c,\\quad b<c+a,\\quad c<a+b' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.0, -1.6, 12.0, 9.8], w: 560, h: 491, items: [
            { k: 'arc', o: tB, r: 5, a1: 8, a2: 46, c: 'b', dash: true }, { k: 'arc', o: tC, r: 7, a1: 148, a2: 172, c: 'g', dash: true },
            { k: 'poly', pts: [tA, tB, tC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'label', at: [5.5, 6], text: '11', size: 24, dy: 24 }, sl(tA, tB, [5, 6], '5', 'b', 20, 24), sl(tA, tC, [5, 6], '7', 'g', 20, 24),
            { k: 'label', at: [11.6, 8.6], text: 'できる', c: 'y', size: 24, anchor: 'end' },
            { k: 'arc', o: [0, 0], r: 3, a1: 0, a2: 75, c: 'b', dash: true }, { k: 'arc', o: [9, 0], r: 5, a1: 112, a2: 180, c: 'g', dash: true },
            { k: 'seg', a: [0, 0], b: [9, 0], wd: 3 }, { k: 'seg', a: [0, 0], b: [3, 0], c: 'b', wd: 5 }, { k: 'seg', a: [4, 0], b: [9, 0], c: 'g', wd: 5 },
            { k: 'label', at: [4.5, 0], text: '9', size: 24, dy: 26 }, { k: 'label', at: [1.5, 0], text: '3', c: 'b', size: 24, dy: -20 }, { k: 'label', at: [6.5, 0], text: '5', c: 'g', size: 24, dy: -20 },
            { k: 'label', at: [11.6, 3.2], text: 'できない', c: 'p', size: 24, anchor: 'end' }] }] },
      { say: '3つの式のうち、$b<c+a$ と $c<a+b$ は $b-c<a$、$c-b<a$ と書けて、まとめると $|b-c|<a$。だから条件は1つの式 $|b-c|<a<b+c$ になります。',
        add: [{ t: 'box', c: 'y', label: '成立条件', tex: '|b-c|<a<b+c' },
          { t: 'p', size: 'sm', text: '3つの長さなら「**いちばん長い辺 < 残り2辺の和**」だけ確かめればよい' }] },
      { ask: { type: 'choice', q: '3つの長さで三角形ができるのは？',
        opts: ['$3,\\ 5,\\ 9$', '$4,\\ 6,\\ 10$', '$5,\\ 7,\\ 11$', '$2,\\ 4,\\ 7$'], ok: 2,
        why: { 0: '$3+5=8<9$。2本の和がいちばん長い辺にとどきません。', 1: '$4+6=10$。和が等しいと、つぶれて一直線になります。', 3: '$2+4=6<7$。とどきません。' },
        good: 'いちばん長い 11 と、残りの和 $5+7=12$ をくらべて $11<12$。三角形ができます。' } },

      // ---------- x の範囲 ----------
      { clear: true, part: '例題　x の範囲', say: '例題です。3辺の長さが $x,\\ 5,\\ 8$ の三角形があるとき、$x$ の範囲を求めます。$|b-c|<a<b+c$ に $a=x$ を入れます。',
        add: [{ t: 'h', text: '例題　x の値の範囲' },
          { t: 'p', text: '(3)　3辺の長さが $x,\\ 5,\\ 8$ の三角形があるとき、$x$ の値の範囲を求めよ。' },
          { t: 'm', tex: '|8-5|<x<8+5' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.2, -0.7, 15.6, 1.6], w: 600, h: 200, items: [{ k: 'numline', ticks: [0, 3, 5, 8, 13] }] }] },
      { ask: { type: 'choice', q: '$x$ の値の範囲は？',
        opts: ['$0<x<13$', '$3<x<13$', '$x>3$', '$3<x<8$'], ok: 1,
        why: { 0: '$x$ が小さすぎてもできません。たとえば $x=1$ なら $1+5<8$ です。', 2: '$x$ が大きすぎてもできません。たとえば $x=20$ なら $5+8<20$ です。', 3: '$x$ がいちばん長い辺になってもかまいません。$x<5+8$ までなら OK です。' },
        good: '$3<x<13$。$x$ が 3 以下でも 13 以上でも、三角形はできません。',
        add: [{ t: 'ans', label: '答', tex: '3<x<13' }],
        draw: [{ fig: 'f4', items: [{ k: 'range', from: 3, to: 13, fromIn: false, toIn: false, c: 'p', label: '3<x<13' }] }] } },
      { say: '数直線で見ると、両はしの 3 と 13 は入りません（○）。$x=3$ や $x=13$ では、三角形がつぶれて一直線になるからです。',
        add: [{ t: 'p', size: 'sm', text: '$x=3$：$3+5=8$　$x=13$：$5+8=13$\n→ どちらも一直線になって、三角形ができない' }] },
      { ask: { type: 'think', q: '3辺の長さが $4,\\ x,\\ 2x+1$ の三角形があるとき、$x$ の値の範囲を求めよう。',
        hint: '$|(2x+1)-x|<4<x+(2x+1)$。$x>0$ なので $|x+1|=x+1$。',
        ans: '$x+1<4$ かつ $3x+1>4$ より　$1<x<3$',
        after: 'たとえば $x=2$ なら、3辺は 4, 2, 5。いちばん長い 5 は $4+2=6$ より小さいので、三角形ができます。',
        add: [{ t: 'm', col: 1, tex: 'x+1<4<3x+1\\qquad \\ans{1<x<3}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角形の性質はここまで。次の時間からは **円の性質**（円周角・接線・方べき）に進みます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
