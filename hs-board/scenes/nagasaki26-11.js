/* 長崎大型 数学（理系）：2026年度 長崎大学 前期 医学部医学科 第11問の類題（自作問題・元の問題ではない）
   問題：半径 1 の半円板（直径 AB、中心 O）＋正三角形 ABC をはり合わせた図形 D を x 軸の上で転がす
   転がり方（時計まわり）：弧で 180° → B を支点に 30° → C を支点に 120° → A を支点に 30°（計 360°）
   答え（python3 で検算ずみ：剛体の回転を数値で追って、位置と面積を確認）：
     (1) B(θ+sinθ, 1+cosθ)
     (2) dA/dθ=(1−cosθ, sinθ)、dB/dθ=(1+cosθ, −sinθ)、内積 1−cos²θ−sin²θ=0（どちらも 0 ベクトルでない）
     (3) Q(θ, 2)：転がる円の最も高い点。直線 y=2 の 0<x<π の部分（両端をのぞく線分）
     (4) A(π+4, 0)、B(π+4, 2)、C(π+4−√3, 1)。
         A の道すじ：サイクロイド（(0,0)→(π,2)）、B(π,0) 中心・半径 2 の 30° の弧（→(π+1,√3)）、C(π+2,0) 中心・半径 2 の 120° の弧（→(π+4,0)）
         面積 = 3π/2 + π/3 + √3 + 4π/3 = 19π/6 + √3（数値積分 11.68043 と一致） */
(function () {
  const PI = Math.PI, r3 = Math.sqrt(3);
  // 図形 D の点（はじめの位置で、O を原点とした座標）。弧は A(−90°) → 右 → B(90°)
  const BODY = [];
  for (let i = 0; i <= 30; i++) { const t = -PI / 2 + PI * i / 30; BODY.push([Math.cos(t), Math.sin(t)]); }
  BODY.push([-r3, 0]);
  const KEY = { A: [0, -1], B: [0, 1], O: [0, 0], C: [-r3, 0] };
  const rot = (p, c, ang) => { const dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(ang) - dy * Math.sin(ang), c[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; };
  // 合計で φ だけ時計まわりに回ったときの位置（φ ≦ π は弧で転がる、そのあとは B → C → A を支点に）
  const pose = (p, phi) => {
    let q = rot(p, [0, 0], -Math.min(phi, PI)); q = [q[0] + Math.min(phi, PI), q[1] + 1];
    const piv = [[PI, [PI, 0], PI / 6], [7 * PI / 6, [PI + 2, 0], 2 * PI / 3], [11 * PI / 6, [PI + 4, 0], PI / 6]];
    piv.forEach(([s, c, d]) => { if (phi > s) q = rot(q, c, -Math.min(phi - s, d)); });
    return q;
  };
  const shape = (phi, o) => Object.assign({ k: 'poly', pts: BODY.map(p => pose(p, phi)), close: true, fill: 'w', alpha: 0.1, c: 'w', wd: 2 }, o || {});
  const at = (n, phi) => pose(KEY[n], phi);
  // A のえがく曲線（サイクロイド＋2つの円弧）と、その下の部分
  const pathA = [];
  for (let i = 0; i <= 60; i++) { const t = PI * i / 60; pathA.push([t - Math.sin(t), 1 - Math.cos(t)]); }
  for (let i = 1; i <= 10; i++) { const a = (90 - 3 * i) * PI / 180; pathA.push([PI + 2 * Math.cos(a), 2 * Math.sin(a)]); }
  for (let i = 1; i <= 40; i++) { const a = (120 - 3 * i) * PI / 180; pathA.push([PI + 2 + 2 * Math.cos(a), 2 * Math.sin(a)]); }
  // (2)(3) の図：θ = 2π/3 のとき
  const th = 2 * PI / 3, Ath = [th - Math.sin(th), 1 - Math.cos(th)], Bth = [th + Math.sin(th), 1 + Math.cos(th)], Qth = [th, 2], Tth = [th, 0];
  const roll = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.5, -0.45, 4.1, 2.75], w: 690, h: 480, items: [
    { k: 'axes', tx: [[PI, 'π']], ty: [[2, '2']], o: false },
    { k: 'param', x: 't-sin(t)', y: '1-cos(t)', a: 0, b: PI, c: 'y', dash: true },
    { k: 'param', x: 't+sin(t)', y: '1+cos(t)', a: 0, b: PI, c: 'b', dash: true },
    shape(th), { k: 'seg', a: Ath, b: Bth, c: 'w', wd: 2, dash: true },
    { k: 'pt', at: Ath, name: 'A', dir: 'w', c: 'y' }, { k: 'pt', at: Bth, name: 'B', dir: 'se', c: 'b' }, { k: 'pt', at: [th, 1], name: 'O', dir: 'w', c: 'w', size: 22 }
  ].concat(extra || []) });
  const big = (id, items, h) => ({ t: 'fig', id, view: [-2.1, -0.75, 7.7, 2.85], w: Math.round((h || 450) * 9.8 / 3.6), h: h || 450, items: [{ k: 'axes', tx: [[PI, 'π'], [PI + 4, 'π+4']], ty: [[2, '2']], o: false }].concat(items) });
  const POINTS = [
    '転がる図形は「どの点を支点に、何度回るか」を先に表にする。支点で回る角は外角（$180^\\circ-$内角）、1回転で進む距離は周の長さ',
    '弧で転がる間は、接点 T が回転の中心。各点の速度（接線）は T と結ぶ線分に垂直 → 直径の両端の接線は垂直で、交点は円の最も高い点',
    '道すじの面積は、サイクロイドの部分を $\\int y\\,dx$（$\\theta$ で置換）、円弧の部分を扇形＋三角形に分けて求める'
  ];

  HB.lesson({
    id: 'nagasaki26-11', field: '長崎大型　数学（理系）', title: '2026 長崎大 理系 第11問の類題 ― 半円と正三角形の図形を転がす（サイクロイドと円弧）', level: '2026年度 長崎大学 理系 第11問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '半径 1 の半円板と，その直径 AB を1辺とする正三角形 ABC を，直径 AB をはさんで反対側にはり合わせた図形を $D$ とし，半円の中心を O とする。はじめ $D$ は，A が原点にあって $x$ 軸に接し，B は点 $(0,\\,2)$，半円の弧は直線 AB の右側，C は左側にある。$D$ を $x$ 軸の上ですべらないように右へ（時計まわりに）転がす。はじめは弧が $x$ 軸に接しながら転がり，B が $x$ 軸に達したあとは，$x$ 軸上にある頂点を支点として回る。$D$ がちょうど1回転したところで止める。弧で転がる間，O の座標は $(\\theta,\\,1)$，A の座標は $(\\theta-\\sin\\theta,\\,1-\\cos\\theta)\\ (0\\le\\theta\\le\\pi)$ で表される。',
      parts: [
        '(1)　弧で転がる間の B の座標を $\\theta$ を用いて表せ（答えのみでよい）。',
        '(2)　$0<\\theta<\\pi$ のとき，A がえがく曲線の点 A における接線と，B がえがく曲線の点 B における接線は，垂直に交わることを示せ。',
        '(3)　(2) の2本の接線の交点を Q とする。$\\theta$ が $0<\\theta<\\pi$ の範囲を動くとき，Q はどのような図形の上を動くか。理由をつけて答えよ。',
        '(4)　$D$ が1回転して止まったときの A，B，C の座標を求めよ（答えのみでよい）。また，A がはじめから止まるまでにえがく曲線と $x$ 軸で囲まれた部分の面積を求めよ。'
      ],
      src: '※ 2026年度 長崎大学 前期 医学部医学科 第11問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '図形を転がす問題です。弧で転がる間はサイクロイド、頂点を支点に回る間は円弧。動きを図で追う力が試されます。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:20px;line-height:1.42' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'はじめの形です。右が半円、左が正三角形。弧が $x$ 軸に接しながら右へ転がり、B が $x$ 軸についたら、そこからは頂点を支点に回ります。',
        add: [{ t: 'h', text: 'まず、動き方を表にする' },
          big('d0', [shape(0, { alpha: 0.18 }), { k: 'seg', a: [0, 0], b: [0, 2], c: 'w', wd: 2, dash: true },
            { k: 'pt', at: [0, 0], name: 'A', dir: 'se', c: 'y' }, { k: 'pt', at: [0, 2], name: 'B', dir: 'n', c: 'b' }, { k: 'pt', at: [0, 1], name: 'O', dir: 'e', c: 'w', size: 22 }, { k: 'pt', at: [-r3, 1], name: 'C', dir: 'w', c: 'g' },
            shape(PI, { alpha: 0.06, c: 'd' }), { k: 'pt', at: [PI, 0], name: 'B', dir: 's', c: 'b', size: 22 }, { k: 'label', at: [PI + 1.25, 2.45], text: 'θ=π（B が x 軸に）', c: 'd', size: 20, plain: true }], 330)] },
      { ask: { type: 'choice', q: 'B が $x$ 軸についたあと、$D$ は B を支点に何度回ると、辺 BC が $x$ 軸にのる？',
        opts: ['$60^\\circ$', '$30^\\circ$', '$90^\\circ$', '$150^\\circ$'], ok: 1,
        why: { 0: '$60^\\circ$ は正三角形の内角。回る角は、B での $D$ の外角です。', 2: '半円の接線と直径の角が $90^\\circ$。それに三角形の $60^\\circ$ を足した $150^\\circ$ が内角です。', 3: 'それは B での $D$ の内角。回る角は $180^\\circ-150^\\circ$ です。' },
        good: 'B での内角は $90^\\circ+60^\\circ=150^\\circ$、回る角は外角の $30^\\circ$。同じように C で $120^\\circ$、A で $30^\\circ$。',
        add: [{ t: 'tbl', size: 'sm', cls: 'rowh', rows: [['動き方', '弧で転がる', 'B が支点', 'C が支点', 'A が支点', '合計'], ['回る角', '$180^\\circ$', '$30^\\circ$', '$120^\\circ$', '$30^\\circ$', '$360^\\circ$'], ['接点の移動', '$\\pi$', '$2$', '$2$', '$0$', '$\\pi+4$（周の長さ）']] }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。O は直径 AB の中点。だから B は「O について A と反対側の点」で、$\\mathrm{B}=2\\mathrm{O}-\\mathrm{A}$ と計算できます。',
        add: [{ t: 'h', text: '(1)　B の座標' },
          { t: 'm', tex: '\\mathrm{O}(\\theta,\\,1),\\quad \\mathrm{A}(\\theta-\\sin\\theta,\\,1-\\cos\\theta)' },
          roll('r1')] },
      { ask: { type: 'choice', q: 'B の座標は？',
        opts: ['$(\\theta+\\sin\\theta,\\ 1-\\cos\\theta)$', '$(\\theta-\\sin\\theta,\\ 1+\\cos\\theta)$', '$(\\theta+\\sin\\theta,\\ 1+\\cos\\theta)$', '$(\\theta+\\sin\\theta,\\ 2-\\cos\\theta)$'], ok: 2,
        why: { 0: '$y$ 座標は $2\\cdot1-(1-\\cos\\theta)=1+\\cos\\theta$。', 1: '$x$ 座標は $2\\theta-(\\theta-\\sin\\theta)=\\theta+\\sin\\theta$。', 3: '$2\\times1$ から $(1-\\cos\\theta)$ を引きます。' },
        good: '$x=2\\theta-(\\theta-\\sin\\theta)$、$y=2-(1-\\cos\\theta)$。検算：$\\theta=0$ で $(0,\\,2)$、$\\theta=\\pi$ で $(\\pi,\\,0)$。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{B}(\\theta+\\sin\\theta,\\ 1+\\cos\\theta)' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。曲線の接線の向きは、$\\theta$ で微分した速度ベクトル。2つの速度ベクトルの内積が 0 なら、接線は垂直です。',
        add: [{ t: 'h', text: '(2)　2本の接線が垂直' },
          { t: 'm', tex: '\\vec{u}=\\Big(\\frac{dx}{d\\theta},\\ \\frac{dy}{d\\theta}\\Big)_{\\mathrm{A}}=(1-\\cos\\theta,\\ \\sin\\theta)' },
          roll('r2', [{ k: 'vec', a: Ath, b: [Ath[0] + 0.75, Ath[1] + 0.43], c: 'y' }])] },
      { ask: { type: 'choice', q: 'B がえがく曲線の速度ベクトル $\\vec{v}$ は？',
        opts: ['$(1-\\cos\\theta,\\ -\\sin\\theta)$', '$(1+\\cos\\theta,\\ -\\sin\\theta)$', '$(1+\\cos\\theta,\\ \\sin\\theta)$', '$(\\cos\\theta,\\ -\\sin\\theta)$'], ok: 1,
        why: { 0: '$(\\theta+\\sin\\theta)\'=1+\\cos\\theta$。', 2: '$(1+\\cos\\theta)\'=-\\sin\\theta$。マイナスがつきます。', 3: '$\\theta$ を微分した 1 を忘れています。' },
        good: '$\\vec v=(1+\\cos\\theta,\\ -\\sin\\theta)$。',
        add: [{ t: 'm', tex: '\\vec{v}=(1+\\cos\\theta,\\ -\\sin\\theta)' },
          { t: 'm', tex: '\\vec u\\cdot\\vec v=1-\\cos^2\\theta-\\sin^2\\theta=0' }],
        draw: [{ fig: 'r2', items: [{ k: 'vec', a: Bth, b: [Bth[0] + 0.43, Bth[1] - 0.75], c: 'b' }] }] } },
      { say: '答案では「どちらも $\\vec 0$ でない」ことも書きます。$0<\\theta<\\pi$ では $1-\\cos\\theta>0,\\ 1+\\cos\\theta>0$ なので大丈夫。これで接線が引けて、しかも垂直です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案のポイント', text: '$0<\\theta<\\pi$ のとき $1-\\cos\\theta>0$、$1+\\cos\\theta>0$ より $\\vec u\\ne\\vec0,\\ \\vec v\\ne\\vec0$。\n$\\vec u\\cdot\\vec v=0$ だから、2本の接線は垂直に交わる。' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。図を見ると、2本の接線は円の真上の点で交わっていそうです。点 $\\mathrm{R}(\\theta,\\,2)$ が両方の接線の上にあるかを確かめます。',
        add: [{ t: 'h', text: '(3)　交点 Q の動く図形' },
          { t: 'm', size: 'sm', tex: '\\mathrm{R}(\\theta,\\,2):\\ \\overrightarrow{\\mathrm{AR}}=(\\sin\\theta,\\ 1+\\cos\\theta)' },
          roll('r3', [{ k: 'line', p1: Ath, p2: Qth, a: 0.2, b: 2.9, c: 'y' }, { k: 'line', p1: Bth, p2: Qth, a: 1.3, b: 3.6, c: 'b' }, { k: 'right', o: Qth, a: Ath, b: Bth, s: 18 }])] },
      { ask: { type: 'choice', q: '$\\vec u=(1-\\cos\\theta,\\ \\sin\\theta)$ と $\\overrightarrow{\\mathrm{AR}}$ は？',
        opts: ['平行', '垂直', 'どちらでもない', '$\\theta$ によって変わる'], ok: 0,
        why: { 1: '内積は $(1-\\cos\\theta)\\sin\\theta+\\sin\\theta(1+\\cos\\theta)=2\\sin\\theta\\ne0$。垂直ではありません。', 2: '成分の「たすきがけ」$(1-\\cos\\theta)(1+\\cos\\theta)-\\sin^2\\theta$ を計算してみましょう。', 3: 'たすきがけは $\\theta$ によらず 0 です。' },
        good: '$(1-\\cos\\theta)(1+\\cos\\theta)-\\sin\\theta\\cdot\\sin\\theta=0$ なので平行。R は A の接線の上にあります。B の接線も同じように確かめられます。',
        add: [{ t: 'm', size: 'sm', tex: '(1-\\cos\\theta)(1+\\cos\\theta)-\\sin^2\\theta=0', note: 'B も同様' }],
        draw: [{ fig: 'r3', items: [{ k: 'pt', at: Qth, name: 'Q(θ, 2)', dir: 'n', c: 'p', size: 22 }] }] } },
      { say: '垂直な2直線の交点はただ1つなので、Q は R、つまり $(\\theta,\\,2)$。$\\theta$ が $0<\\theta<\\pi$ を動くと、Q は $y=2$ の上を動きます。',
        add: [{ t: 'ans', label: '(3) 答', text: 'Q$(\\theta,\\,2)$。直線 $y=2$ の $0<x<\\pi$ の部分\n（両はしをのぞく線分）の上を動く' }],
        draw: [{ fig: 'r3', items: [{ k: 'seg', a: [0, 2], b: [PI, 2], c: 'p', wd: 5 }, { k: 'pt', at: [0, 2], c: 'p', open: true }, { k: 'pt', at: [PI, 2], c: 'p', open: true }] }] },
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '別の見方です。弧で転がる間、$D$ は接点 $\\mathrm{T}(\\theta,\\,0)$ のまわりに一瞬だけ回っています。だから A の速度は TA に垂直、B の速度は TB に垂直です。',
        add: [{ t: 'h', text: '別の見方：接点 T が回転の中心' },
          { t: 'p', size: 'sm', text: 'T は直径 AB を見こむ円周上の点なので $\\angle\\mathrm{ATB}=90^\\circ$。\n接線は TA、TB に垂直なので、接線どうしも垂直。\n四角形 TAQB は長方形になり、Q は T の反対側（円の最も高い点）です。' },
          roll('r4', [{ k: 'seg', a: Tth, b: Ath, c: 'g', wd: 2 }, { k: 'seg', a: Tth, b: Bth, c: 'g', wd: 2 }, { k: 'right', o: Tth, a: Ath, b: Bth, s: 16 },
            { k: 'seg', a: Ath, b: Qth, c: 'y', wd: 2 }, { k: 'seg', a: Bth, b: Qth, c: 'b', wd: 2 },
            { k: 'pt', at: Tth, name: 'T', dir: 's', c: 'g' }, { k: 'pt', at: Qth, name: 'Q', dir: 'n', c: 'p' }])] },
      { ask: { type: 'think', q: '$\\theta=\\dfrac{\\pi}{2}$ のとき、A、B、Q の座標を求め、A の接線が Q を通ることを確かめよう。',
        hint: 'A $=(\\theta-\\sin\\theta,\\ 1-\\cos\\theta)$、B $=(\\theta+\\sin\\theta,\\ 1+\\cos\\theta)$ に $\\theta=\\frac\\pi2$ を入れる。',
        ans: 'A$\\big(\\frac\\pi2-1,\\ 1\\big)$、B$\\big(\\frac\\pi2+1,\\ 1\\big)$、Q$\\big(\\frac\\pi2,\\ 2\\big)$。A の速度は $(1,\\,1)$ で、A から $(1,\\,1)$ 進むとちょうど Q',
        after: 'このとき直径 AB は水平で、半円は真下、三角形は真上。A の接線の傾き 1、B の接線の傾き $-1$ で、たしかに垂直です。' } },

      // ---------- (4) ----------
      { clear: true, cols: [1], part: '(4)', say: '(4) です。1回転すると、$D$ ははじめと同じ向きにもどり、周の長さ $\\pi+2+2$ だけ右へ進みます。A の動きを、4つの場面に分けて追います。',
        add: [{ t: 'h', text: '(4)　1回転したあとの位置と、A のえがく曲線' },
          big('d1', [shape(0, { alpha: 0.05, c: 'd' }), shape(PI, { alpha: 0.05, c: 'd' }), shape(7 * PI / 6, { alpha: 0.05, c: 'd' }), shape(2 * PI, { alpha: 0.16 }),
            { k: 'poly', pts: pathA, c: 'y', wd: 3.5 },
            { k: 'pt', at: [0, 0], c: 'y' }, { k: 'pt', at: [PI, 2], c: 'y' }, { k: 'pt', at: [PI + 1, r3], c: 'y' },
            { k: 'pt', at: [PI, 0], name: 'B', dir: 's', c: 'b', size: 21 }, { k: 'pt', at: [PI + 2, 0], name: 'C', dir: 's', c: 'g', size: 21 }], 350)] },
      { ask: { type: 'choice', q: '止まったときの A の $x$ 座標は？',
        opts: ['$2\\pi$', '$\\pi+2$', '$\\pi+4$', '$\\pi+3$'], ok: 2,
        why: { 0: '円が1回転するときの距離です。$D$ の周は半円の弧 $\\pi$ と2辺 $2+2$。', 1: '辺は BC と CA の2本。$2$ を2回足します。', 3: '辺の長さは直径と同じ 2 です。' },
        good: 'すべらずに転がるので、進む距離 $=$ 周の長さ $=\\pi+4$。止まった形ははじめと同じ向きで、全体が $\\pi+4$ だけ右にずれます。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\mathrm{A}(\\pi+4,\\,0),\\quad \\mathrm{B}(\\pi+4,\\,2),\\quad \\mathrm{C}(\\pi+4-\\sqrt3,\\,1)' }] } },
      { clear: true, cols: [0.5, 0.5], say: 'A の道すじは、① サイクロイド（$\\theta$：$0\\to\\pi$）、② B 中心・半径 2 の $30^\\circ$ の弧、③ C 中心・半径 2 の $120^\\circ$ の弧。最後の A を支点に回る間は、A は動きません。',
        add: [{ t: 'h', text: '(4)　面積を3つに分ける' },
          { t: 'tbl', size: 'sm', rows: [['', '動き', '終わりの A'], ['①', '弧で転がる（サイクロイド）', '$(\\pi,\\,2)$'], ['②', 'B$(\\pi,0)$ が支点・$30^\\circ$', '$(\\pi+1,\\,\\sqrt3)$'], ['③', 'C$(\\pi+2,0)$ が支点・$120^\\circ$', '$(\\pi+4,\\,0)$']] },
          { t: 'fig', id: 'ar', col: 1, view: [-0.3, -0.45, 7.5, 2.55], w: 700, h: 269, items: [
            { k: 'axes', tx: [[PI, 'π'], [PI + 2, 'π+2'], [PI + 4, 'π+4']], ty: [[2, '2']], o: false },
            { k: 'poly', pts: pathA.slice(0, 61).concat([[PI, 0]]), close: true, fill: 'y', alpha: 0.25, noStroke: true },
            { k: 'poly', pts: [[PI, 0], [PI, 2]].concat(pathA.slice(61, 71)), close: true, fill: 'b', alpha: 0.3, noStroke: true },
            { k: 'poly', pts: [[PI, 0], [PI + 1, r3], [PI + 2, 0]], close: true, fill: 'w', alpha: 0.22, c: 'w', wd: 1.5 },
            { k: 'poly', pts: [[PI + 2, 0]].concat(pathA.slice(70)), close: true, fill: 'g', alpha: 0.3, noStroke: true },
            { k: 'poly', pts: pathA, c: 'y', wd: 3 },
            { k: 'label', at: [2.1, 0.55], text: '①', c: 'y', size: 22 }, { k: 'label', at: [PI + 0.28, 1.0], text: '②', c: 'b', size: 20 },
            { k: 'label', at: [PI + 1, 0.55], text: '△', c: 'w', size: 20 }, { k: 'label', at: [PI + 2.8, 0.8], text: '③', c: 'g', size: 22 }] }] },
      { ask: { type: 'choice', q: '① の面積 $\\displaystyle\\int_0^{\\pi}y\\,dx=\\int_0^{\\pi}(1-\\cos\\theta)^2\\,d\\theta$ は？',
        opts: ['$\\pi$', '$\\dfrac{3\\pi}{2}$', '$3\\pi$', '$2\\pi$'], ok: 1,
        why: { 0: '$\\cos^2\\theta=\\frac{1+\\cos2\\theta}{2}$ の部分 $\\frac\\pi2$ を足し忘れています。', 2: 'それはサイクロイドの山1つ分（$\\theta$：$0\\to2\\pi$）。ここは半分です。', 3: '$-2\\cos\\theta$ の積分は 0、$\\cos^2\\theta$ の積分は $\\frac\\pi2$。合わせて $\\pi+\\frac\\pi2$。' },
        good: '$dx=(1-\\cos\\theta)\\,d\\theta$ と置換。$\\int_0^\\pi(1-2\\cos\\theta+\\cos^2\\theta)\\,d\\theta=\\pi+0+\\frac\\pi2=\\frac{3\\pi}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^{\\pi}(1-\\cos\\theta)(1-\\cos\\theta)\\,d\\theta=\\frac{3\\pi}{2}', note: '① の面積' }] } },
      { ask: { type: 'think', q: '②・△・③ の面積の和を求め、全体の面積を出そう。（② と ③ は扇形、△ は正三角形 ABC そのもの）',
        hint: '半径 2 の扇形の面積は $\\frac12\\cdot2^2\\cdot(\\text{中心角})$。正三角形の1辺は 2。',
        ans: '② $=\\frac12\\cdot4\\cdot\\frac\\pi6=\\frac\\pi3$、△ $=\\sqrt3$、③ $=\\frac12\\cdot4\\cdot\\frac{2\\pi}{3}=\\frac{4\\pi}{3}$。全体は $\\frac{3\\pi}{2}+\\frac\\pi3+\\sqrt3+\\frac{4\\pi}3=\\dfrac{19\\pi}{6}+\\sqrt3$',
        after: '△ は「B を支点に回り終わった瞬間の三角形 ABC」。辺 BC が $x$ 軸にのっているので、ちょうど扇形 ② と ③ のすきまをうめます。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\frac{19\\pi}{6}+\\sqrt3' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。転がる問題は、まず「支点と回る角」の表、次に「接点が回転の中心」という見方。この2つで、式の計算も図の説明もぐっと楽になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、図をかきながら答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
