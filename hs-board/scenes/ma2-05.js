/* 数学A 第2章 図形の性質 三角形の性質 ⑤：チェバの定理とメネラウスの定理
   例はすべて自作（チェバ AR:RB=1:2, BP:PC=3:2 → CQ:QA=4:3／メネラウス AR:RB=2:3, AQ:QC=4:1 → BP:PC=6:1／
   同じ図で AO:OP=5:4（△ABP と直線 RC）、BO:OQ=7:2（△BCQ と直線 AP））。
   値・誤答・図の座標は python3（sympy）で検算ずみ。図の点は、その比どおりの位置にかいている。 */
(function () {
  const POINTS = [
    '**チェバの定理**：3本の線 AP, BQ, CR が1点 O で交わるとき　$\\dfrac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\dfrac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}=1$',
    '**メネラウスの定理**：1本の直線が △ABC の辺（延長）と P, Q, R で交わるとき、**同じ形** の式が成り立つ',
    '式は「頂点 → 分点 → 頂点 → …」と **ぐるっと一周**。AO : OP のような比は、メネラウスで「三角形」と「横切る直線」を選んで出す'
  ];
  const sl = (P, Q, G, text, c, px, size) => {   // 線分 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];

  // 三角形 A(5/2, 11/2) B(0,0) C(8,0)。チェバの図：R は AB を 1:2、P は BC を 3:2、Q は CA を 4:3 に内分。O＝(4A+2B+3C)/9
  const A = [2.5, 5.5], B = [0, 0], C = [8, 0], Gc = [3.5, 11 / 6];
  const R = lerp(A, B, 1 / 3), P = lerp(B, C, 3 / 5), Q = lerp(C, A, 4 / 7), O = [(4 * A[0] + 3 * C[0]) / 9, 4 * A[1] / 9];
  const tri = (dC) => [{ k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.05 },
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: dC || 'se', r: 4 }];
  const ceva = (lab) => tri().concat([
    { k: 'seg', a: A, b: P, c: 'y', wd: 2.5 }, { k: 'seg', a: B, b: Q, c: 'y', wd: 2.5 }, { k: 'seg', a: C, b: R, c: 'y', wd: 2.5 },
    { k: 'pt', at: P, name: 'P', dir: 's', r: 4, c: 'y' }, { k: 'pt', at: Q, name: 'Q', dir: 'ne', r: 4, c: 'y' }, { k: 'pt', at: R, name: 'R', dir: 'nw', r: 4, c: 'y' },
    { k: 'pt', at: O, name: 'O', dir: 'n', off: 1, dx: 9, dy: -27, r: 5, c: 'p' }]).concat(lab ? [
    sl(A, R, Gc, '1', 'b', 20, 24), sl(R, B, Gc, '2', 'b', 20, 24), { k: 'label', at: lerp(B, P, 0.5), text: '3', c: 'g', size: 24, dy: 24 }, { k: 'label', at: lerp(P, C, 0.5), text: '2', c: 'g', size: 24, dy: 24 }] : []);
  const VC = [-1.0, -1.0, 9.0, 6.6], fc = (id, items) => ({ t: 'fig', id, col: 1, view: VC, w: 560, h: 426, items });

  // メネラウスの図：R2 は AB を 2:3、Q2 は AC を 4:1 に内分。直線 R2Q2 と BC の延長の交点 P2(48/5, 0)
  const R2 = lerp(A, B, 2 / 5), Q2 = lerp(A, C, 4 / 5), P2 = [9.6, 0];

  HB.lesson({
    id: 'ma2-05', field: '数学A　図形の性質', title: 'チェバの定理とメネラウスの定理', level: '三角形の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC の内部の点 O について、AO, BO, CO の延長が辺 BC, CA, AB と交わる点を P, Q, R とする。AR : RB $=1:2$、BP : PC $=3:2$ のとき、CQ : QA を求めよ。',
        '(2)　△ABC の辺 AB を $2:3$、辺 AC を $4:1$ に内分する点を R, Q とし、直線 RQ と辺 BC の延長の交点を P とする。BP : PC を求めよ。',
        '(3)　(1) の図で、AO : OP を求めよ。',
        '(4)　(1) の図で、BO : OQ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '重心では、3本の中線が1点で交わりました。この時間は、3本の線が1点で交わるときの **チェバの定理** と、1本の直線が三角形を横切るときの **メネラウスの定理** です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**チェバ**・**メネラウス** の定理の式を「ぐるっと一周」で書ける\nどちらを使うか見分けて、比を求められる' }] },

      // ---------- チェバ ----------
      { clear: true, part: 'チェバの定理', say: '△ABC の内部の点 O と各頂点を結ぶ直線が、向かいの辺と P, Q, R で交わるとき、3つの比をかけると 1 になります。これが **チェバの定理** です。',
        add: [{ t: 'h', text: 'チェバの定理' },
          { t: 'box', c: 'y', label: 'チェバ', tex: '\\frac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{QA}}=1' },
          { t: 'p', size: 'sm', text: 'AP, BQ, CR が1点 O で交わるとき' },
          fc('f1', ceva(false))] },
      { say: '式の読み方は **ぐるっと一周**。A から出発して、分点 R、頂点 B、分点 P、頂点 C、分点 Q と進み、A にもどります。分子・分母が交互に並びます。',
        add: [{ t: 'box', c: 'b', label: '一周', text: 'A →(R)→ B →(P)→ C →(Q)→ A\n頂点 → 分点 → 頂点 → 分点 …' }],
        draw: [{ fig: 'f1', items: [
          { k: 'vec', a: lerp(A, B, 0.06), b: lerp(A, B, 0.9), c: 'b', wd: 2 }, { k: 'vec', a: lerp(B, C, 0.06), b: lerp(B, C, 0.92), c: 'b', wd: 2 }, { k: 'vec', a: lerp(C, A, 0.06), b: lerp(C, A, 0.9), c: 'b', wd: 2 }] }] },
      { ask: { type: 'choice', q: 'チェバの定理で、値がいつも $1$ になる式は？',
        opts: ['$\\frac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\frac{\\mathrm{QA}}{\\mathrm{CQ}}$', '$\\frac{\\mathrm{AR}}{\\mathrm{AB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{BC}}\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{CA}}$', '$\\frac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{QA}}$', '$\\frac{\\mathrm{AR}}{\\mathrm{RB}}+\\frac{\\mathrm{BP}}{\\mathrm{PC}}+\\frac{\\mathrm{CQ}}{\\mathrm{QA}}$'], ok: 2,
        why: { 0: '最後が逆。C → Q → A と進むので $\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}$ です。', 1: '辺全体との比ではありません。分点で分けた2つの部分の比です。', 3: '和ではなく **積** が 1 です。' },
        good: '頂点 → 分点 → 頂点 … とぐるっと一周。分子と分母が交互に並びます。' } },
      { say: 'わけは面積の比です。△OAB と △OCA は底辺 AO を共有し、高さの比が BP : PC。だから $\\frac{\\mathrm{BP}}{\\mathrm{PC}}=\\frac{\\triangle\\mathrm{OAB}}{\\triangle\\mathrm{OCA}}$。3つかけると約分されて 1 です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\triangle\\mathrm{OCA}}{\\triangle\\mathrm{OBC}}\\cdot\\frac{\\triangle\\mathrm{OAB}}{\\triangle\\mathrm{OCA}}\\cdot\\frac{\\triangle\\mathrm{OBC}}{\\triangle\\mathrm{OAB}}=1', note: '面積の比' }] },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1　チェバ', say: '例題1。AR : RB $=1:2$、BP : PC $=3:2$ のとき、CQ : QA を求めます。わかっている比を、ぐるっと一周の式に入れます。',
        add: [{ t: 'h', text: '例題1　チェバの定理' },
          { t: 'p', text: 'AR : RB $=1:2$、BP : PC $=3:2$ のとき\nCQ : QA を求めよ。' },
          { t: 'm', tex: '\\frac12\\cdot\\frac32\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{QA}}=1' },
          fc('f2', ceva(true))] },
      { ask: { type: 'choice', q: 'CQ : QA は？',
        opts: ['$3:4$', '$1:3$', '$3:1$', '$4:3$'], ok: 3,
        why: { 0: '$\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}=\\dfrac43$。分母と分子を逆にしています。', 1: 'AR : RB を逆に $\\frac21$ と入れています。A → R → B の順で $\\frac12$。', 2: 'BP : PC を逆に $\\frac23$ と入れています。B → P → C の順で $\\frac32$。' },
        good: '$\\dfrac34\\cdot\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}=1$ より $\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}=\\dfrac43$。CQ : QA $=4:3$。',
        add: [{ t: 'm', tex: '\\frac{\\mathrm{CQ}}{\\mathrm{QA}}=\\frac43\\qquad \\mathrm{CQ}:\\mathrm{QA}=\\ans{4:3}' }],
        draw: [{ fig: 'f2', items: [sl(C, Q, Gc, '4', 'p', 20, 24), sl(Q, A, Gc, '3', 'p', 20, 24)] }] } },

      // ---------- メネラウス ----------
      { clear: true, part: 'メネラウスの定理', say: '次は、**1本の直線** が三角形を横切るとき。直線が辺 AB, AC と R, Q で、辺 BC の **延長** と P で交わるとき、チェバと **同じ形** の式が成り立ちます。',
        add: [{ t: 'h', text: 'メネラウスの定理' },
          { t: 'box', c: 'y', label: 'メネラウス', tex: '\\frac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{QA}}=1' },
          { t: 'p', size: 'sm', text: '直線が辺（延長）と P, Q, R で交わるとき\nP は辺 BC を **外分** する点' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.0, -1.0, 10.8, 6.6], w: 600, h: 386, items: tri('s').concat([
            { k: 'seg', a: C, b: P2, c: 'd', dash: true }, { k: 'seg', a: R2, b: P2, c: 'g', wd: 3 },
            { k: 'pt', at: R2, name: 'R', dir: 'nw', r: 4, c: 'g' }, { k: 'pt', at: Q2, name: 'Q', dir: 'ne', r: 4, c: 'g' }, { k: 'pt', at: P2, name: 'P', dir: 's', r: 4, c: 'g' },
            sl(A, R2, Gc, '2', 'b', 20, 24), sl(R2, B, Gc, '3', 'b', 20, 24), sl(A, Q2, Gc, '4', 'b', 20, 24), sl(Q2, C, P2, '1', 'b', 18, 24)]) }] },
      { say: '読み方も同じ。A →(R)→ B →(P)→ C →(Q)→ A。P は三角形の外にありますが、「頂点 → 交点 → 頂点」の順は変わりません。',
        add: [{ t: 'box', c: 'b', label: '一周', text: 'A →(R)→ B →(P)→ C →(Q)→ A' }] },
      { ask: { type: 'choice', q: '図で AR : RB $=2:3$、AQ : QC $=4:1$。BP : PC は？',
        opts: ['$1:6$', '$6:1$', '$3:8$', '$5:1$'], ok: 1,
        why: { 0: '比が逆です。P は C の先にあるので、BP のほうが長くなります。', 2: '$\\dfrac{\\mathrm{AQ}}{\\mathrm{QC}}$ を入れています。一周の順では $\\dfrac{\\mathrm{CQ}}{\\mathrm{QA}}=\\dfrac14$ です。', 3: '$5:1$ は BC : CP。BP は B から P までです。' },
        good: '$\\dfrac23\\cdot\\dfrac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\dfrac14=1$ より $\\dfrac{\\mathrm{BP}}{\\mathrm{PC}}=6$。BP : PC $=6:1$。',
        add: [{ t: 'm', tex: '\\frac23\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PC}}\\cdot\\frac14=1\\qquad \\mathrm{BP}:\\mathrm{PC}=\\ans{6:1}' }] } },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2　AO : OP', say: '例題1の図で、AO : OP を求めます。チェバの定理で出るのは **辺の比** だけ。AO : OP には、メネラウスの定理を使います。',
        add: [{ t: 'h', text: '例題2　AO : OP を求める' },
          { t: 'p', text: '例題1の図（AR : RB $=1:2$、BP : PC $=3:2$）で\nAO : OP を求めよ。' },
          fc('f4', ceva(true))] },
      { ask: { type: 'choice', q: 'AO : OP を出すには、どの三角形と直線にメネラウスの定理を使う？',
        opts: ['△ABC と直線 RC', '△ABC と点 O（チェバ）', '△BCQ と直線 AP', '△ABP と直線 RC'], ok: 3,
        why: { 0: '直線 RC は頂点 C を通るので、△ABC を横切る直線になりません。', 1: 'チェバの定理で出るのは辺の比だけ。AO : OP は出ません。', 2: 'それで出るのは BO : OQ です（あとで使います）。' },
        good: '直線 R-O-C が △ABP の辺 AB, AP と、BP の延長（C）で交わります。O が入るので AO : OP が出ます。',
        draw: [{ fig: 'f4', items: [{ k: 'poly', pts: [A, B, P], close: true, fill: 'y', alpha: 0.2, noStroke: true }, { k: 'seg', a: R, b: C, c: 'g', wd: 4 }] }] } },
      { say: '△ABP で一周します。A →(R)→ B →(C)→ P →(O)→ A。BC : CP は、BP : PC $=3:2$ から $5:2$ です。',
        add: [{ t: 'm', tex: '\\frac{\\mathrm{AR}}{\\mathrm{RB}}\\cdot\\frac{\\mathrm{BC}}{\\mathrm{CP}}\\cdot\\frac{\\mathrm{PO}}{\\mathrm{OA}}=1', note: '△ABP と直線 RC' },
          { t: 'm', tex: '\\frac12\\cdot\\frac52\\cdot\\frac{\\mathrm{PO}}{\\mathrm{OA}}=1', note: 'BC : CP $=5:2$' }] },
      { ask: { type: 'choice', q: 'AO : OP は？',
        opts: ['$4:5$', '$5:4$', '$5:9$', '$2:1$'], ok: 1,
        why: { 0: '$\\dfrac{\\mathrm{PO}}{\\mathrm{OA}}=\\dfrac45$。AO : OP はその逆です。', 2: '$5:9$ は AO : AP（全体との比）です。', 3: '$2:1$ は重心のとき。O は重心ではありません。' },
        good: '$\\dfrac54\\cdot\\dfrac{\\mathrm{PO}}{\\mathrm{OA}}=1$ より $\\dfrac{\\mathrm{PO}}{\\mathrm{OA}}=\\dfrac45$。AO : OP $=5:4$。',
        add: [{ t: 'm', tex: '\\frac{\\mathrm{PO}}{\\mathrm{OA}}=\\frac45\\qquad \\mathrm{AO}:\\mathrm{OP}=\\ans{5:4}' }] } },
      { ask: { type: 'think', q: '同じ図で、BO : OQ を求めよう。（CQ : QA $=4:3$ は例題1の答え）',
        hint: '△BCQ と直線 AP。B →(P)→ C →(A)→ Q →(O)→ B と一周。CA : AQ $=7:3$。',
        ans: '$\\dfrac32\\cdot\\dfrac73\\cdot\\dfrac{\\mathrm{QO}}{\\mathrm{OB}}=1$ より　BO : OQ $=7:2$',
        after: '直線 AP は、△BCQ の辺 BC と P、QB と O、CQ の延長と A で交わります。三角形と直線の選び方がカギです。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\frac32\\cdot\\frac73\\cdot\\frac{\\mathrm{QO}}{\\mathrm{OB}}=1\\quad \\mathrm{BO}:\\mathrm{OQ}=\\ans{7:2}' }] } },

      // ---------- 見分け ----------
      { clear: true, cols: [1], part: 'チェバかメネラウスか', say: '見分け方です。3本の線が1点で交わる図で **辺の比** ならチェバ。線分の途中の比（AO : OP など）や、直線が横切る図ならメネラウスです。',
        add: [{ t: 'h', text: 'チェバかメネラウスか' },
          { t: 'tbl', rows: [['', 'チェバの定理', 'メネラウスの定理'], ['図の形', '頂点からの3本の線が1点で交わる', '1本の直線が三角形を横切る'], ['式', '頂点 → 分点 → 頂点 … と一周', '頂点 → 交点 → 頂点 … と一周（同じ形）'], ['求めやすい比', '辺の比（CQ : QA など）', '線分の途中の比（AO : OP など）']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角形の **辺と角の大小関係** と、3つの長さで三角形ができる条件です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
