/* 長崎大型 数学（理系）：2026年度 長崎大学 前期 医学部医学科 第11問の類題② （自作問題・元の問題ではない）
   問題：半径 1 の半円板（直径 AB、中心 O）＋長方形 ABCD（AB=2、BC=√3）をはり合わせた図形 D を x 軸の上で転がす
   転がり方（時計まわり）：弧で 180° → （B：0°）→ C を支点に 90° → D を支点に 90°（計 360°）。周の長さ π+2+2√3
   答え（python3・sympy で検算ずみ：剛体の回転を数値で追って、位置・面積・最大値を確認）：
     (1) C(θ+sinθ−√3cosθ, 1+cosθ+√3sinθ)（B(θ+sinθ,1+cosθ) から BC=(−√3cosθ, √3sinθ) だけ進む）
     (2) dC/dθ=(1+cosθ+√3sinθ, √3cosθ−sinθ)、TC=(sinθ−√3cosθ, 1+cosθ+√3sinθ)（T(θ,0)）、内積 0。|dC/dθ|²=5+4sin(θ+π/6)≧3 より 0 ベクトルでない
     (3) y_C=1+2sin(θ+π/6)、最大値 3（θ=π/3）、そのとき C(π/3, 3)（x 座標も θ に等しく、C は T の真上）
     (4) 止まったとき A(π+2+2√3, 0)、B(π+2+2√3, 2)、C(π+2+√3, 2)、D(π+2+√3, 0)。
         A の道すじ：サイクロイド（(0,0)→(π,2)）、C(π+√3,0) 中心・半径 √7 の 90° の弧（→(π+2+√3,√3)）、D(π+2+√3,0) 中心・半径 √3 の 90° の弧（→(π+2+2√3,0)）
         面積 = 3π/2 + (√3 + 7π/4 + √3) + 3π/4 = 4π + 2√3（数値積分 16.03047 と一致） */
(function () {
  const PI = Math.PI, r3 = Math.sqrt(3);
  // 図形 D の点（はじめの位置で、O を原点とした座標）。弧は A(−90°) → 右 → B(90°)、そのあと C(−√3,1)、D(−√3,−1)
  const BODY = [];
  for (let i = 0; i <= 30; i++) { const t = -PI / 2 + PI * i / 30; BODY.push([Math.cos(t), Math.sin(t)]); }
  BODY.push([-r3, 1]); BODY.push([-r3, -1]);
  const KEY = { A: [0, -1], B: [0, 1], O: [0, 0], C: [-r3, 1], D: [-r3, -1] };
  const rot = (p, c, ang) => { const dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(ang) - dy * Math.sin(ang), c[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; };
  // 合計で φ だけ時計まわりに回ったときの位置（φ ≦ π は弧で転がる、そのあとは C → D を支点に 90° ずつ）
  const pose = (p, phi) => {
    let q = rot(p, [0, 0], -Math.min(phi, PI)); q = [q[0] + Math.min(phi, PI), q[1] + 1];
    const piv = [[PI, [PI + r3, 0], PI / 2], [3 * PI / 2, [PI + r3 + 2, 0], PI / 2]];
    piv.forEach(([s, c, d]) => { if (phi > s) q = rot(q, c, -Math.min(phi - s, d)); });
    return q;
  };
  const shape = (phi, o) => Object.assign({ k: 'poly', pts: BODY.map(p => pose(p, phi)), close: true, fill: 'w', alpha: 0.1, c: 'w', wd: 2 }, o || {});
  // A のえがく曲線（サイクロイド＋2つの円弧）
  const N = 720, pathAll = [];
  for (let i = 0; i <= N; i++) pathAll.push(pose(KEY.A, 2 * PI * i / N));
  const path1 = pathAll.slice(0, 361), path2 = pathAll.slice(360, 541), path3 = pathAll.slice(540);
  const CP = [PI + r3, 0], DP = [PI + r3 + 2, 0], A1 = [PI, 2], A2 = [PI + r3 + 2, r3];
  const FX = PI + 2 + 2 * r3;
  // (1)〜(3) の図：θ のときの様子
  const cpath = { k: 'param', x: 't+sin(t)-' + r3 + '*cos(t)', y: '1+cos(t)+' + r3 + '*sin(t)', a: 0, b: PI, c: 'g', dash: true };
  const apath = { k: 'param', x: 't-sin(t)', y: '1-cos(t)', a: 0, b: PI, c: 'y', dash: true };
  const roll = (id, th, extra) => {
    const A = pose(KEY.A, th), B = pose(KEY.B, th), C = pose(KEY.C, th), O = pose(KEY.O, th);
    return { t: 'fig', id, col: 1, view: [-2.2, -0.5, 5.4, 3.6], w: 690, h: 372, items: [
      { k: 'axes', tx: [[PI, 'π']], ty: [[3, '3']], o: false }, apath, cpath, shape(th),
      { k: 'pt', at: A, name: 'A', dir: 'sw', c: 'y' }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'b' }, { k: 'pt', at: C, name: 'C', dir: 'n', c: 'g' },
      { k: 'pt', at: O, name: 'O', dir: 's', c: 'w', size: 20 }
    ].concat(extra || []) };
  };
  const big = (id, items, h) => ({ t: 'fig', id, view: [-2.3, -0.7, 9.3, 3.35], w: Math.round((h || 450) * 11.6 / 4.05), h: h || 450, items: [{ k: 'axes', tx: [[PI, 'π'], [FX, 'π+2+2√3']], ty: [[3, '3']], o: false }].concat(items) });
  const POINTS = [
    '転がる図形は「どの点を支点に、何度回るか」を先に表にする。支点で回る角は外角（$180^\\circ-$内角）、地面にのる部分の長さの合計が周の長さ',
    '弧で転がる間は接点 T が回転の中心。各点の速度（接線）は T と結ぶ線分に垂直。一番高い点は、その点が T の真上にくるとき',
    '道すじの面積は、サイクロイドの部分を $\\int y\\,dx$（$\\theta$ で置換）、円弧の部分を扇形＋三角形に分けて求める'
  ];

  HB.lesson({
    id: 'nagasaki26-11b', field: '長崎大型　数学（理系）', title: '2026 長崎大 理系 第11問の類題② ― 半円と長方形の図形を転がす（サイクロイドと円弧）', level: '2026年度 長崎大学 理系 第11問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '半径 1 の半円板と，その直径 AB を1辺とし，辺 BC の長さが $\\sqrt3$ である長方形 ABCD を，直径 AB をはさんで反対側にはり合わせた図形を $D$ とし，半円の中心を O とする。はじめ $D$ は，A が原点にあって $x$ 軸に接し，B は点 $(0,\\,2)$，半円の弧は直線 AB の右側，C，D は左側にあり，辺 DA は $x$ 軸の上にある。$D$ を $x$ 軸の上ですべらないように右へ（時計まわりに）転がす。はじめは弧が $x$ 軸に接しながら転がり，辺 BC が $x$ 軸にのったあとは，$x$ 軸上にある頂点を支点として回る。$D$ がちょうど1回転したところで止める。弧で転がる間，O の座標は $(\\theta,\\,1)$，A の座標は $(\\theta-\\sin\\theta,\\,1-\\cos\\theta)\\ (0\\le\\theta\\le\\pi)$ で表される。また接点を $\\mathrm{T}(\\theta,\\,0)$ とする。',
      parts: [
        '(1)　弧で転がる間の C の座標を $\\theta$ を用いて表せ（答えのみでよい）。',
        '(2)　$0<\\theta<\\pi$ のとき，C がえがく曲線の点 C における接線は，直線 TC に垂直であることを示せ。',
        '(3)　$0\\le\\theta\\le\\pi$ の範囲で，C の $y$ 座標が最大になる $\\theta$ の値と，そのときの C の座標を求めよ。',
        '(4)　$D$ が1回転して止まったときの A，B，C，D の座標を求めよ（答えのみでよい）。また，A がはじめから止まるまでにえがく曲線と $x$ 軸で囲まれた部分の面積を求めよ。'
      ],
      src: '※ 2026年度 長崎大学 前期 医学部医学科 第11問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '図形を転がす問題の類題②。弧で転がる間はサイクロイドの仲間、頂点を支点に回る間は円弧。動きを図で追う力が試されます。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:19px;line-height:1.4' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'はじめの形です。右が半円、左が長方形で、辺 DA が $x$ 軸にのっています。弧で右へ転がり、B が着くと辺 BC がちょうど $x$ 軸にのります。',
        add: [{ t: 'h', text: 'まず、動き方を表にする' },
          big('d0', [shape(0, { alpha: 0.18 }), { k: 'seg', a: [0, 0], b: [0, 2], c: 'w', wd: 2, dash: true },
            { k: 'pt', at: [0, 0], name: 'A', dir: 'se', c: 'y' }, { k: 'pt', at: [0, 2], name: 'B', dir: 'ne', c: 'b' }, { k: 'pt', at: [0, 1], name: 'O', dir: 'e', c: 'w', size: 22 },
            { k: 'pt', at: [-r3, 2], name: 'C', dir: 'nw', c: 'g' }, { k: 'pt', at: [-r3, 0], name: 'D', dir: 'sw', c: 'g' },
            shape(PI, { alpha: 0.06, c: 'd' }), { k: 'pt', at: [PI, 0], name: 'B', dir: 's', c: 'b', size: 20 }, { k: 'pt', at: [PI + r3, 0], name: 'C', dir: 's', c: 'g', size: 20 },
            { k: 'label', at: [PI + 1.7, 2.7], text: 'θ=π（辺 BC が x 軸に）', c: 'd', size: 19, plain: true }], 320)] },
      { ask: { type: 'choice', q: '辺 BC が $x$ 軸にのったあと、$D$ はどの頂点を支点に何度回ると、次の辺 CD が $x$ 軸にのる？',
        opts: ['C を支点に $90^\\circ$', 'B を支点に $90^\\circ$', 'C を支点に $60^\\circ$', 'C を支点に $180^\\circ$'], ok: 0,
        why: { 1: '時計まわりに転がるので、支点は辺 BC の右はし C。B を支点にすると辺 BC がもち上がります。', 2: '$60^\\circ$ は正三角形の角。長方形の角は $90^\\circ$ で、回る角はその外角 $90^\\circ$ です。', 3: '$180^\\circ$ は辺と辺がまっすぐつながる所の外角。C は直角の頂点なので $90^\\circ$ です。' },
        good: '回る角は外角：C で $90^\\circ$、D で $90^\\circ$。B は弧と辺 BC がなめらかにつながる（外角 $0^\\circ$）ので、そこでは回りません。',
        add: [{ t: 'tbl', size: 'sm', cls: 'rowh', rows: [['動き方', '弧で転がる', 'B が支点', 'C が支点', 'D が支点', '合計'], ['回る角', '$180^\\circ$', '$0^\\circ$', '$90^\\circ$', '$90^\\circ$', '$360^\\circ$'], ['のる部分', '弧 $\\pi$', 'BC $\\sqrt3$', 'CD $2$', 'DA $\\sqrt3$', '$\\pi+2+2\\sqrt3$（周の長さ）']] }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。B は直径 AB の端で、$\\mathrm{B}=2\\mathrm{O}-\\mathrm{A}$。C は B から「辺 BC を、$D$ と同じだけ時計まわりに回した向き」へ $\\sqrt3$ 進んだ点です。',
        add: [{ t: 'h', text: '(1)　C の座標' },
          { t: 'm', size: 'sm', tex: '\\mathrm{B}(\\theta+\\sin\\theta,\\ 1+\\cos\\theta)', note: 'O について A と反対側' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{BC}}=(-\\sqrt3,\\,0)\\ \\text{を時計まわりに}\\ \\theta\\ \\text{回す}' },
          roll('r1', PI / 2)] },
      { ask: { type: 'choice', q: 'C の座標は？（$\\overrightarrow{\\mathrm{BC}}$ は $(-\\sqrt3,\\,0)$ を時計まわりに $\\theta$ 回したもの）',
        opts: ['$(\\theta+\\sin\\theta+\\sqrt3\\cos\\theta,\\ 1+\\cos\\theta-\\sqrt3\\sin\\theta)$', '$(\\theta+\\sin\\theta-\\sqrt3\\cos\\theta,\\ 1+\\cos\\theta+\\sqrt3\\sin\\theta)$', '$(\\theta-\\sin\\theta-\\sqrt3\\cos\\theta,\\ 1-\\cos\\theta+\\sqrt3\\sin\\theta)$', '$(\\theta-\\sqrt3\\cos\\theta,\\ 1+\\sqrt3\\sin\\theta)$'], ok: 1,
        why: { 0: '回す向きが逆（反時計まわり）です。', 2: 'それは D の座標（起点が A）です。C は B から進みます。', 3: 'O から進めています。起点は B です。' },
        good: '時計まわり $\\theta$：$(x,y)\\to(x\\cos\\theta+y\\sin\\theta,\\ -x\\sin\\theta+y\\cos\\theta)$。検算：$\\theta=0$ で $(-\\sqrt3,2)$、$\\theta=\\pi$ で $(\\pi+\\sqrt3,0)$。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{C}(\\theta+\\sin\\theta-\\sqrt3\\cos\\theta,\\ 1+\\cos\\theta+\\sqrt3\\sin\\theta)' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。接線の向きは、$\\theta$ で微分した速度ベクトルです。C の速度ベクトル $\\vec v$ と、TC の内積が 0 になるかを調べます。',
        add: [{ t: 'h', text: '(2)　接線 ⟂ TC' },
          { t: 'm', size: 'sm', tex: '\\vec v=\\Big(\\frac{dx}{d\\theta},\\ \\frac{dy}{d\\theta}\\Big)=(1+\\cos\\theta+\\sqrt3\\sin\\theta,\\ \\sqrt3\\cos\\theta-\\sin\\theta)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{TC}}=(\\sin\\theta-\\sqrt3\\cos\\theta,\\ 1+\\cos\\theta+\\sqrt3\\sin\\theta)', note: 'C − T(θ, 0)' },
          roll('r2', PI / 2, [{ k: 'seg', a: [PI / 2, 0], b: pose(KEY.C, PI / 2), c: 'g', wd: 2 }, { k: 'pt', at: [PI / 2, 0], name: 'T', dir: 's', c: 'g', size: 20 }])] },
      { ask: { type: 'choice', q: '$p=1+\\cos\\theta+\\sqrt3\\sin\\theta$ とおく。$\\vec v\\cdot\\overrightarrow{\\mathrm{TC}}$ は？',
        opts: ['$p^2+(\\sqrt3\\cos\\theta-\\sin\\theta)^2$', '$2p(\\sin\\theta-\\sqrt3\\cos\\theta)$', '$0$', '$p$'], ok: 2,
        why: { 0: 'それは $|\\vec v|^2$。TC との内積ではありません。', 1: '内積は「$x$ 成分どうし ＋ $y$ 成分どうし」。引き算にしていませんか。', 3: '成分ごとにかけて足すと、$p$ は残りません。' },
        good: '$p(\\sin\\theta-\\sqrt3\\cos\\theta)+(\\sqrt3\\cos\\theta-\\sin\\theta)p$。符号が逆の項どうしで打ち消し合って 0。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec v\\cdot\\overrightarrow{\\mathrm{TC}}=p(\\sin\\theta-\\sqrt3\\cos\\theta)+(\\sqrt3\\cos\\theta-\\sin\\theta)p=0' }] } },
      { say: '答案では「$\\vec v\\ne\\vec 0$」も書きます。$|\\vec v|^2=5+4\\sin\\big(\\theta+\\frac\\pi6\\big)$ で、$0<\\theta<\\pi$ では $\\sin\\big(\\theta+\\frac\\pi6\\big)>-\\frac12$。だから $|\\vec v|^2>3$ です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案のポイント', text: '$|\\vec v|^2=5+4\\sin\\Big(\\theta+\\dfrac\\pi6\\Big)>3$ より $\\vec v\\ne\\vec0$。さらに $\\overrightarrow{\\mathrm{TC}}\\ne\\vec0$（C は $x$ 軸の上）で $\\vec v\\cdot\\overrightarrow{\\mathrm{TC}}=0$ だから、接線は TC に垂直。' },
          { t: 'p', size: 'sm', text: '別の見方：弧で転がる間、$D$ は T のまわりに一瞬だけ回っている。だから、どの点の速度も「T とその点を結ぶ線分」に垂直。' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。C の $y$ 座標は $1+\\cos\\theta+\\sqrt3\\sin\\theta$。三角関数の合成で、$\\sin$ ひとつにまとめます。',
        add: [{ t: 'h', text: '(3)　C がいちばん高くなるとき' },
          { t: 'm', size: 'sm', tex: 'y=1+\\cos\\theta+\\sqrt3\\sin\\theta=1+2\\sin\\Big(\\theta+\\frac{\\pi}{6}\\Big)' },
          { t: 'box', c: 'g', size: 'sm', label: '合成', text: '$\\sqrt3\\sin\\theta+\\cos\\theta$ の大きさは $\\sqrt{(\\sqrt3)^2+1^2}=2$。$2\\big(\\sin\\theta\\cos\\frac\\pi6+\\cos\\theta\\sin\\frac\\pi6\\big)$' },
          roll('r3', PI / 3, [{ k: 'line', m: 0, n: 3, c: 'p', dash: true }])] },
      { ask: { type: 'think', q: '$0\\le\\theta\\le\\pi$ で $y$ が最大になる $\\theta$ と、そのときの C の座標を求めよう。',
        hint: '$\\theta+\\frac\\pi6$ の範囲は $\\frac\\pi6\\le\\theta+\\frac\\pi6\\le\\frac{7\\pi}{6}$。この範囲に $\\frac\\pi2$ はふくまれる？',
        ans: '$\\theta+\\frac\\pi6=\\frac\\pi2$ より $\\theta=\\dfrac\\pi3$。最大値 $y=3$。$x=\\frac\\pi3+\\frac{\\sqrt3}{2}-\\sqrt3\\cdot\\frac12=\\dfrac\\pi3$ なので C$\\big(\\frac\\pi3,\\ 3\\big)$',
        after: 'このとき C の $x$ 座標は T の $x$ 座標 $\\frac\\pi3$ と等しい。つまり C は T の真上。接線が水平で TC は垂直、(2) の結果ともつながっています。',
        add: [{ t: 'ans', label: '(3) 答', text: '$\\theta=\\dfrac\\pi3$、C$\\Big(\\dfrac\\pi3,\\ 3\\Big)$（最大値 3）' }],
        draw: [{ fig: 'r3', items: [{ k: 'seg', a: [PI / 3, 0], b: [PI / 3, 3], c: 'g', wd: 2 }, { k: 'pt', at: [PI / 3, 0], name: 'T', dir: 's', c: 'g', size: 20 }] }] } },

      // ---------- (4) ----------
      { clear: true, cols: [1], part: '(4)', say: '(4) です。1回転すると、$D$ ははじめと同じ向きにもどり、周の長さ $\\pi+2+2\\sqrt3$ だけ右へ進みます。A の動きを、場面に分けて追います。',
        add: [{ t: 'h', text: '(4)　1回転したあとの位置と、A のえがく曲線' },
          big('d1', [shape(0, { alpha: 0.05, c: 'd' }), shape(PI, { alpha: 0.05, c: 'd' }), shape(3 * PI / 2, { alpha: 0.05, c: 'd' }), shape(2 * PI, { alpha: 0.16 }),
            { k: 'poly', pts: pathAll, c: 'y', wd: 3.5 },
            { k: 'pt', at: [0, 0], c: 'y' }, { k: 'pt', at: A1, c: 'y' }, { k: 'pt', at: A2, c: 'y' },
            { k: 'pt', at: CP, name: 'C', dir: 's', c: 'g', size: 20 }, { k: 'pt', at: DP, name: 'D', dir: 's', c: 'g', size: 20 }], 330)] },
      { ask: { type: 'choice', q: '止まったときの A の $x$ 座標は？',
        opts: ['$\\pi+2\\sqrt3$', '$\\pi+2+\\sqrt3$', '$\\pi+2+2\\sqrt3$', '$2\\pi+2+2\\sqrt3$'], ok: 2,
        why: { 0: '辺 CD の長さ 2 が入っていません。のる部分は 弧・BC・CD・DA の4つです。', 1: '辺は BC と DA の2本（どちらも $\\sqrt3$）。$\\sqrt3$ を2回足します。', 3: '半円の弧の長さは $\\pi$（半径 1 の半周）。$2\\pi$ は円1周分です。' },
        good: 'すべらずに転がるので、進む距離 $=$ 周の長さ $=\\pi+\\sqrt3+2+\\sqrt3$。止まった形ははじめと同じ向きで、全体が右へずれます。',
        add: [{ t: 'ans', label: '(4) 答（座標）', text: 'A$(\\pi+2+2\\sqrt3,\\,0)$、B$(\\pi+2+2\\sqrt3,\\,2)$\nC$(\\pi+2+\\sqrt3,\\,2)$、D$(\\pi+2+\\sqrt3,\\,0)$' }] } },
      { clear: true, cols: [0.5, 0.5], say: 'A の道すじは、① サイクロイド（$\\theta$：$0\\to\\pi$）、② C 中心・半径 $\\sqrt7$ の $90^\\circ$ の弧、③ D 中心・半径 $\\sqrt3$ の $90^\\circ$ の弧。B を支点にする間は動きません。',
        add: [{ t: 'h', text: '(4)　面積を分ける' },
          { t: 'tbl', size: 'sm', rows: [['', '動き', '終わりの A'], ['①', '弧で転がる（サイクロイド）', '$(\\pi,\\,2)$'], ['②', 'C$(\\pi+\\sqrt3,0)$ が支点・$90^\\circ$', '$(\\pi+\\sqrt3+2,\\,\\sqrt3)$'], ['③', 'D$(\\pi+\\sqrt3+2,0)$ が支点・$90^\\circ$', '$(\\pi+2+2\\sqrt3,\\,0)$']] },
          { t: 'p', size: 'sm', text: '② の半径は C から $(\\pi,2)$ までの距離 $\\sqrt{(\\sqrt3)^2+2^2}=\\sqrt7$。' },
          { t: 'fig', id: 'ar', col: 1, view: [-0.3, -0.45, 9.0, 3.35], w: 700, h: 262, items: [
            { k: 'axes', tx: [[PI, 'π'], [PI + r3, ''], [FX, 'π+2+2√3']], ty: [[2, '2']], o: false },
            { k: 'poly', pts: path1.concat([[PI, 0]]), close: true, fill: 'y', alpha: 0.25, noStroke: true },
            { k: 'poly', pts: [CP].concat(path2), close: true, fill: 'b', alpha: 0.3, noStroke: true },
            { k: 'poly', pts: [[PI, 0], CP, A1], close: true, fill: 'w', alpha: 0.22, c: 'w', wd: 1.5 },
            { k: 'poly', pts: [CP, DP, A2], close: true, fill: 'w', alpha: 0.22, c: 'w', wd: 1.5 },
            { k: 'poly', pts: [DP].concat(path3), close: true, fill: 'g', alpha: 0.3, noStroke: true },
            { k: 'poly', pts: pathAll, c: 'y', wd: 3 },
            { k: 'label', at: [2.0, 0.6], text: '①', c: 'y', size: 22 }, { k: 'label', at: [PI + r3, 1.2], text: '②', c: 'b', size: 22 },
            { k: 'label', at: [PI + 0.55, 0.45], text: '△', c: 'w', size: 18 }, { k: 'label', at: [PI + r3 + 1.4, 0.4], text: '△', c: 'w', size: 18 },
            { k: 'label', at: [FX - 0.65, 0.6], text: '③', c: 'g', size: 22 }] }] },
      { ask: { type: 'choice', q: '② の扇形の面積は？（半径 $\\sqrt7$、中心角 $90^\\circ$）',
        opts: ['$\\dfrac{7\\pi}{2}$', '$\\dfrac{3\\pi}{4}$', '$\\dfrac{\\sqrt7\\,\\pi}{2}$', '$\\dfrac{7\\pi}{4}$'], ok: 3,
        why: { 0: '扇形の面積は $\\frac12r^2\\times(\\text{中心角})$。$\\frac12$ をかけ忘れています。', 1: 'それは ③（半径 $\\sqrt3$）の扇形です。', 2: '$r^2$ のところを $r=\\sqrt7$ にしています。面積は半径の2乗です。' },
        good: '$\\frac12\\cdot7\\cdot\\frac\\pi2=\\frac{7\\pi}{4}$。② の下には、左右に直角三角形（底辺 $\\sqrt3$・高さ 2 と、底辺 2・高さ $\\sqrt3$）もあり、面積はどちらも $\\sqrt3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{弧の部分}=\\sqrt3+\\frac{7\\pi}{4}+\\sqrt3', note: '三角形＋扇形＋三角形' }] } },
      { ask: { type: 'think', q: '① の面積 $\\displaystyle\\int_0^{\\pi}(1-\\cos\\theta)^2\\,d\\theta$ と ③ の面積を求め、全体の面積を出そう。',
        hint: '① は $dx=(1-\\cos\\theta)\\,d\\theta$ と置換して、$\\cos^2\\theta=\\frac{1+\\cos2\\theta}{2}$。③ は半径 $\\sqrt3$ の四分円。',
        ans: '① $=\\pi+0+\\frac\\pi2=\\frac{3\\pi}{2}$、③ $=\\frac14\\cdot3\\pi=\\frac{3\\pi}{4}$。全体は $\\frac{3\\pi}{2}+\\big(2\\sqrt3+\\frac{7\\pi}{4}\\big)+\\frac{3\\pi}{4}=4\\pi+2\\sqrt3$',
        after: '数値でも 16.03 になります。サイクロイドの部分は半分の山なので、1つの山の面積 $3\\pi$ の半分です。',
        add: [{ t: 'ans', label: '(4) 答（面積）', tex: '4\\pi+2\\sqrt3' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。転がる問題は、まず「支点と回る角」の表、次に「接点が回転の中心」という見方。この2つで、式の計算も図の説明もぐっと楽になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、図をかきながら答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
