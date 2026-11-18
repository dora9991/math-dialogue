/* 数学A 第2章 図形の性質 作図と空間図形 ①：作図
   例はすべて自作（AB=6 の垂直二等分線（半径 4 の円の交点 (3,±√7)）／AB を 2:3 に内分（等間隔 1.6・32° の半直線 → P(4,0)）／
   AB を 3:1 に外分（等間隔 2.4 → Q(15,0)）／長さ ab（a=2, b=1.5 → OC=3）／長さ √a（AB=3, BC=1 → BD=√3）／AB=2, BC=3 → √6）。
   値・図の座標は python3（sympy）で検算ずみ。作図の手順は1つずつ図に足していく。 */
(function () {
  const POINTS = [
    '**作図** は、定規（直線を引く）とコンパス（円をかく・長さを写す）だけでかく。基本は **垂直二等分線・角の二等分線・垂線・平行線**',
    '線分の **内分点・外分点** は、半直線の上に等間隔の点をとり、**平行線** を引いてつくる（根拠は平行線と線分の比）',
    '長さ $1,\\ a,\\ b$ から、**平行線（相似）** で $ab$、**直径の円と垂線（方べきの定理）** で $\\sqrt a$ がつくれる'
  ];
  const rad = d => d * Math.PI / 180, U = d => [Math.cos(rad(d)), Math.sin(rad(d))], sc = (v, t) => [v[0] * t, v[1] * t], plus = (P, v, t) => [P[0] + v[0] * t, P[1] + v[1] * t];
  const unit = (P, Q) => { const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]); return [(Q[0] - P[0]) / L, (Q[1] - P[1]) / L]; };
  const SUB = ['', '₁', '₂', '₃', '₄', '₅'];

  // 図1：垂直二等分線。A(0,0) B(6,0)、半径 4 → P(3,√7) Q(3,−√7)（A から見て ±41.4°）
  const A1 = [0, 0], B1 = [6, 0], s7 = Math.sqrt(7), P1 = [3, s7], Q1 = [3, -s7];
  // 図2：内分 2:3。A(0,0) B(10,0)、32° の半直線に 1.6 ずつ C₁〜C₅。C₂ を通り C₅B に平行 → P(4,0)
  const u32 = U(32), A2 = [0, 0], B2 = [10, 0], s2 = 1.6, Ck = k => sc(u32, k * s2), P2 = [4, 0];
  const marks = (sp, n, c) => { const out = []; for (let k = 1; k <= n; k++) out.push({ k: 'arc', o: sc(u32, (k - 1) * sp), r: sp, a1: 18, a2: 46, c: c || 'b', wd: 2 }, { k: 'pt', at: sc(u32, k * sp), name: 'C' + SUB[k], dir: 'nw', r: 3.5, c: c || 'b', size: 22 }); return out; };
  // 図3：外分 3:1。間隔 2.4、C₂B に平行に C₃ から → Q(15,0)
  const s3 = 2.4, C2e = sc(u32, 2 * s3), C3e = sc(u32, 3 * s3), Q3 = [15, 0];
  // 図4：長さ ab。O(0,0)、横の半直線に E(1,0)・A(2,0)、40° の半直線に B（1.5）・C（3）
  const u40 = U(40), O4 = [0, 0], E4 = [1, 0], A4 = [2, 0], B4 = sc(u40, 1.5), C4 = sc(u40, 3);
  // 図5：長さ √a。A(0,0) B(3,0) C(4,0)、中点 M(2,0)・半径 2 の円、D(3,√3)・D′(3,−√3)
  const A5 = [0, 0], B5 = [3, 0], C5 = [4, 0], M5 = [2, 0], D5 = [3, Math.sqrt(3)], D5b = [3, -Math.sqrt(3)];

  HB.lesson({
    id: 'ma2-11', field: '数学A　図形の性質', title: '作図', level: '作図と空間図形', time: '目安 9分',
    problem: { label: '例題', lead: 'この時間の例題（定規とコンパスだけで作図する）',
      parts: ['(1)　線分 AB の垂直二等分線を作図せよ。',
        '(2)　線分 AB を $2:3$ に内分する点 P を作図せよ。',
        '(3)　線分 AB を $3:1$ に外分する点 Q を作図せよ。',
        '(4)　長さ $1,\\ a,\\ b$ の線分から、長さ $ab$ の線分を作図せよ。',
        '(5)　長さ $1,\\ a$ の線分から、長さ $\\sqrt a$ の線分を作図せよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: 'ここから「作図と空間図形」です。中学で学んだ作図をふり返り、**内分点・外分点** や、**$ab$ や $\\sqrt a$ の長さ** をつくる作図に進みます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '作図の手順を、**根拠**（平行線と線分の比・相似・方べきの定理）とあわせて説明できる' }] },

      // ---------- 基本の作図 ----------
      { clear: true, part: '基本の作図', say: '**作図** とは、定規とコンパスだけを使って図をかくことです。定規は直線を引くだけ、コンパスは円をかいたり長さを写したりします。目もりは使いません。',
        add: [{ t: 'h', text: '作図とは' },
          { t: 'box', c: 'b', label: '作図', text: '定規：2点を通る直線を引く\nコンパス：円をかく・長さを写す' },
          { t: 'p', size: 'sm', text: '**例**　線分 AB の垂直二等分線' },
          { t: 'fig', id: 'c1', col: 1, view: [-1.2, -3.7, 7.2, 3.7], w: 560, h: 493, items: [
            { k: 'seg', a: A1, b: B1, wd: 4 }, { k: 'pt', at: A1, name: 'A', dir: 'w', r: 5 }, { k: 'pt', at: B1, name: 'B', dir: 'e', r: 5 }] }] },
      { say: '① A, B を中心に、**同じ半径** の円をかきます（半径は AB の半分より大きく）。② 2つの交点 P, Q を結ぶと、垂直二等分線になります。',
        add: [{ t: 'p', size: 'sm', text: '① A, B を中心に、同じ半径の円\n② 交点 P, Q を通る直線を引く' }],
        draw: [{ fig: 'c1', items: [
          { k: 'arc', o: A1, r: 4, a1: 25, a2: 58, c: 'b', wd: 2 }, { k: 'arc', o: A1, r: 4, a1: -58, a2: -25, c: 'b', wd: 2 },
          { k: 'arc', o: B1, r: 4, a1: 122, a2: 155, c: 'b', wd: 2 }, { k: 'arc', o: B1, r: 4, a1: 205, a2: 238, c: 'b', wd: 2 },
          { k: 'pt', at: P1, name: 'P', dir: 'ne', r: 4, c: 'b' }, { k: 'pt', at: Q1, name: 'Q', dir: 'se', r: 4, c: 'b' },
          { k: 'seg', a: [3, -3.5], b: [3, 3.5], c: 'y', wd: 3.5 }, { k: 'right', o: [3, 0], a: B1, b: P1, s: 16, c: 'y' },
          { k: 'seg', a: A1, b: P1, c: 'd', dash: true }, { k: 'seg', a: B1, b: P1, c: 'd', dash: true }] }] },
      { ask: { type: 'choice', q: '垂直二等分線の上の点 X について、いつも成り立つことは？',
        opts: ['XA $=$ XB', '$\\angle\\mathrm{XAB}=90^\\circ$', 'XA $=$ AB', 'X は AB の中点'], ok: 0,
        why: { 1: '直角になるのは、直線 PQ と AB が交わる所の角。$\\angle\\mathrm{XAB}$ ではありません。', 2: '円の半径を AB にとるとはかぎりません。等しいのは A と B からの距離です。', 3: '中点は、垂直二等分線の上の1点だけです。' },
        good: '垂直二等分線は、A, B から **等しい距離** にある点の集まり。だから P, Q を結べばよいのです。' } },
      { say: '**角の二等分線**・**垂線**・**平行線** も、同じように円と直線の組み合わせでかけます。このあとは、とくに **平行線** をよく使います。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '基本の作図', text: '垂直二等分線・角の二等分線・垂線\n平行線（同位角を写す　など）' }] },

      // ---------- 内分点 ----------
      { clear: true, cols: [0.42, 0.58], part: '内分点の作図', say: '線分 AB を $2:3$ に内分する点 P を作図します。① A から半直線 AX を引き、② コンパスで同じ長さを5回写して、点 C₁〜C₅ をとります。',
        add: [{ t: 'h', text: 'AB を $2:3$ に内分する点 P' },
          { t: 'p', size: 'sm', text: '① A から半直線 AX を引く\n② AX 上に、等間隔に C₁, C₂, …, C₅' },
          { t: 'fig', id: 'c2', col: 1, view: [-0.8, -1.0, 11.0, 5.6], w: 820, h: 459, items: [
            { k: 'seg', a: A2, b: B2, wd: 4 }, { k: 'seg', a: A2, b: sc(u32, 9.6), c: 'w', wd: 2.5 }, { k: 'label', at: sc(u32, 9.6), text: 'X', size: 24, dx: 14, dy: -10 },
            { k: 'pt', at: A2, name: 'A', dir: 'sw', r: 5 }, { k: 'pt', at: B2, name: 'B', dir: 'se', r: 5 }].concat(marks(s2, 5)) }] },
      { say: '③ C₅ と B を結びます。④ C₂ を通り、C₅B に **平行な直線** を引きます。この直線と AB の交点が P です。',
        add: [{ t: 'p', size: 'sm', text: '③ C₅ と B を結ぶ\n④ C₂ を通り C₅B に平行な直線 → AB との交点が P' }],
        draw: [{ fig: 'c2', items: [{ k: 'seg', a: Ck(5), b: B2, c: 'y', wd: 3 },
          { k: 'seg', a: plus(Ck(2), unit(Ck(5), B2), -0.6), b: plus(P2, unit(Ck(5), B2), 0.6), c: 'p', wd: 3 },
          { k: 'pt', at: P2, name: 'P', dir: 's', r: 5, c: 'p' }] }] },
      { ask: { type: 'choice', q: 'この作図で AP : PB $=2:3$ になる根拠は？',
        opts: ['中点連結定理', '三平方の定理', '平行線と線分の比', '角の二等分線と比'], ok: 2,
        why: { 0: '中点連結定理は、中点どうしを結ぶときの性質。ここは $2:3$ です。', 1: '長さの計算はしていません。平行線で比を写しています。', 3: '角の二等分線は引いていません。' },
        good: 'C₂P ∥ C₅B なので、AP : PB $=$ AC₂ : C₂C₅ $=2:3$（平行線と線分の比）。',
        add: [{ t: 'm', tex: '\\mathrm{AP}:\\mathrm{PB}=\\mathrm{AC_2}:\\mathrm{C_2C_5}=2:3', note: 'C₂P ∥ C₅B' }] } },

      // ---------- 外分点 ----------
      { clear: true, cols: [0.4, 0.6], part: '外分点の作図', say: '次は、線分 AB を $3:1$ に **外分** する点 Q です。Q は B の外側にあって、AQ : QB $=3:1$。内分と同じく、平行線を使います。',
        add: [{ t: 'h', text: 'AB を $3:1$ に外分する点 Q' },
          { t: 'p', size: 'sm', text: 'AQ : QB $=3:1$\nQ は線分 AB の延長上（B の外側）' },
          { t: 'fig', id: 'c3', col: 1, view: [-0.8, -1.0, 16.4, 4.8], w: 880, h: 297, items: [
            { k: 'seg', a: A2, b: B2, wd: 4 }, { k: 'seg', a: B2, b: [16.2, 0], c: 'w', wd: 2, dash: true },
            { k: 'seg', a: A2, b: sc(u32, 8.6), c: 'w', wd: 2.5 },
            { k: 'pt', at: A2, name: 'A', dir: 'sw', r: 5 }, { k: 'pt', at: B2, name: 'B', dir: 's', r: 5 }] }] },
      { ask: { type: 'think', q: 'AB を $3:1$ に外分する点 Q の作図の手順を考えよう。',
        hint: 'AQ : AB $=3:2$ になればよい。半直線の上に等間隔に3つ点をとり、2つ目の点と B を結ぶ。',
        ans: '等間隔に C₁, C₂, C₃ をとり、C₂ と B を結ぶ。C₃ を通り C₂B に平行な直線と、直線 AB の交点が Q。',
        after: 'AQ : AB $=$ AC₃ : AC₂ $=3:2$ なので、AQ : QB $=3:(3-2)=3:1$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{AQ}:\\mathrm{AB}=\\mathrm{AC_3}:\\mathrm{AC_2}=3:2', note: 'C₃Q ∥ C₂B' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AQ}:\\mathrm{QB}=3:(3-2)=3:1' }],
        draw: [{ fig: 'c3', items: marks(s3, 3).concat([{ k: 'seg', a: C2e, b: B2, c: 'y', wd: 3 },
          { k: 'seg', a: plus(C3e, unit(C2e, B2), -0.5), b: plus(Q3, unit(C2e, B2), 0.6), c: 'p', wd: 3 },
          { k: 'pt', at: Q3, name: 'Q', dir: 's', r: 5, c: 'p' }]) }] } },

      // ---------- 長さ ab ----------
      { clear: true, part: '長さ ab の作図', say: '長さ $1,\\ a,\\ b$ の線分から、長さ $ab$ の線分をつくります。① O から2本の半直線を引き、一方に OE $=1$、OA $=a$、もう一方に OB $=b$ をとります。',
        add: [{ t: 'h', text: '長さ $ab$ の作図' },
          { t: 'p', size: 'sm', text: '長さ $1,\\ a,\\ b$ の線分が与えられている\n① OE $=1$、OA $=a$、OB $=b$ をとる' },
          { t: 'fig', id: 'c4', col: 1, view: [-0.4, -0.75, 3.7, 2.45], w: 640, h: 500, items: [
            { k: 'seg', a: O4, b: [3.5, 0], wd: 2.5 }, { k: 'seg', a: O4, b: sc(u40, 3.4), wd: 2.5 },
            { k: 'dim', a: O4, b: E4, dy: 26, label: '1', c: 'b' }, { k: 'dim', a: O4, b: A4, dy: 62, label: 'a', c: 'y' },
            { k: 'label', at: sc(u40, 0.75), text: 'b', c: 'g', size: 26, dx: -16, dy: -12 },
            { k: 'pt', at: O4, name: 'O', dir: 'w', r: 4 }, { k: 'pt', at: E4, name: 'E', dir: 'nw', r: 4, c: 'b' }, { k: 'pt', at: A4, name: 'A', dir: 'nw', r: 4, c: 'y' },
            { k: 'pt', at: B4, name: 'B', dir: 'nw', r: 4, c: 'g' }] }] },
      { say: '② E と B を結びます。③ A を通り EB に **平行な直線** を引き、もう一方の半直線との交点を C とします。この OC が求める長さです。',
        add: [{ t: 'p', size: 'sm', text: '② E と B を結ぶ\n③ A を通り EB に平行な直線 → 交点 C' }],
        draw: [{ fig: 'c4', items: [{ k: 'seg', a: E4, b: B4, c: 'b', wd: 3 },
          { k: 'seg', a: plus(A4, unit(E4, B4), -0.25), b: plus(C4, unit(E4, B4), 0.3), c: 'p', wd: 3 },
          { k: 'pt', at: C4, name: 'C', dir: 'nw', r: 5, c: 'p' }] }] },
      { ask: { type: 'choice', q: 'この作図で、OC の長さは？',
        opts: ['$a+b$', '$\\dfrac{b}{a}$', '$\\dfrac{a}{b}$', '$ab$'], ok: 3,
        why: { 0: '平行線では長さを足すのではなく、比が写ります。', 1: 'OE : OA $=$ OB : OC の、OA と OE を逆にしています。', 2: '比の組がずれています。OE : OA $=$ OB : OC です。' },
        good: 'EB ∥ AC なので OE : OA $=$ OB : OC、つまり $1:a=b:\\mathrm{OC}$。よって OC $=ab$。',
        add: [{ t: 'm', tex: '1:a=b:\\mathrm{OC}\\qquad \\mathrm{OC}=\\ans{ab}', note: 'EB ∥ AC' }] } },

      // ---------- 長さ √a ----------
      { clear: true, part: '長さ √a の作図', say: '次は $\\sqrt a$ です。① 1つの直線の上に、AB $=a$、BC $=1$ となるように点 A, B, C をとります（図は $a=3$）。',
        add: [{ t: 'h', text: '長さ $\\sqrt a$ の作図' },
          { t: 'p', size: 'sm', text: '① 直線上に AB $=a$、BC $=1$' },
          { t: 'fig', id: 'c5', col: 1, view: [-0.6, -2.4, 4.6, 2.4], w: 560, h: 517, items: [
            { k: 'seg', a: [-0.4, 0], b: [4.4, 0], wd: 2.5 },
            { k: 'dim', a: A5, b: B5, dy: 30, label: 'a', c: 'y' }, { k: 'dim', a: B5, b: C5, dy: 30, label: '1', c: 'b' },
            { k: 'pt', at: A5, name: 'A', dir: 'nw', r: 4 }, { k: 'pt', at: B5, name: 'B', dir: 'nw', r: 4 }, { k: 'pt', at: C5, name: 'C', dir: 'ne', r: 4 }] }] },
      { say: '② AC の中点 M を（垂直二等分線で）とり、AC を **直径** とする円をかきます。③ B を通り AC に垂直な直線を引き、円との交点を D とします。',
        add: [{ t: 'p', size: 'sm', text: '② AC を直径とする円（中心 M）\n③ B で AC に垂線 → 円との交点 D, D′' }],
        draw: [{ fig: 'c5', items: [{ k: 'circle', o: M5, r: 2, c: 'b' }, { k: 'pt', at: M5, name: 'M', dir: 'n', r: 3, c: 'b', size: 22 },
          { k: 'seg', a: [3, -2.2], b: [3, 2.2], c: 'p', wd: 3 }, { k: 'right', o: B5, a: C5, b: D5, s: 14, c: 'p' },
          { k: 'pt', at: D5, name: 'D', dir: 'ne', r: 5, c: 'p' }, { k: 'pt', at: D5b, name: "D'", dir: 'se', r: 4, c: 'p' }] }] },
      { ask: { type: 'choice', q: '$\\mathrm{BD}^2$ を AB, BC で表すと？',
        opts: ['AB $+$ BC', 'AB $\\cdot$ BC', 'AB$^2+$BC$^2$', 'AC $\\cdot$ BC'], ok: 1,
        why: { 0: '長さの和ではありません。方べきの定理は「積」です。', 2: '三平方の定理の形ではありません。BD は直角三角形の斜辺ではありません。', 3: 'AC・BC は $\\mathrm{CD}^2$ の方です（△ACD ∽ △DCB）。' },
        good: '弦 DD′ は直径 AC に垂直なので BD $=$ BD′。方べきの定理で BA・BC $=$ BD・BD′ $=\\mathrm{BD}^2$。',
        add: [{ t: 'm', tex: "\\mathrm{BD}^2=\\mathrm{BA}\\cdot\\mathrm{BC}=a\\cdot1", note: '方べきの定理\nBD $=$ BD′' },
          { t: 'ans', label: '答', tex: '\\mathrm{BD}=\\sqrt a' }],
        draw: [{ fig: 'c5', items: [{ k: 'seg', a: B5, b: D5, c: 'y', wd: 5 }, { k: 'label', at: [3, Math.sqrt(3) / 2], text: '√a', c: 'y', size: 26, dx: 26 }] }] } },
      { ask: { type: 'think', q: '同じ作図で、AB $=2$、BC $=3$ にすると、BD の長さは？',
        hint: '$\\mathrm{BD}^2=\\mathrm{AB}\\cdot\\mathrm{BC}$ は、BC が 1 でなくても成り立つ。',
        ans: '$\\mathrm{BD}^2=2\\cdot3=6$ より　BD $=\\sqrt6$',
        after: '一般に、長さ $a,\\ b$ から $\\sqrt{ab}$ がつくれます。BC $=1$ にすると $\\sqrt a$ になります。',
        add: [{ t: 'm', tex: '\\mathrm{BD}^2=2\\cdot3=6\\qquad \\mathrm{BD}=\\sqrt6' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。作図は、手順だけでなく「なぜそうなるか」の根拠が大切です。次の時間は **空間図形** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
