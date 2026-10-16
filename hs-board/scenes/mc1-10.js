/* 数学C 第1章 ベクトル 空間のベクトル ⑩：球面・平面・直線の方程式
   例はすべて自作（中心 (2,−3,1)・半径 4 の球面、xy 平面との交わり：中心 (2,−3,0)・半径 √15、yz 平面との交わり：半径 2√3／
   x²+y²+z²−6x+2y+4z+5=0 → 中心 (3,−1,−2)・半径 3／A(1,−2,3)、n=(2,1,−1) → 2x+y−z+3=0／(2,0,−1)、n=(3,−1,2) → 3x−y+2z−4=0／
   A(2,0,0),B(0,4,0),C(0,0,4) → 2x+y+z=4／2x+y+z=4 ⊥ x+ky−3z=1 → k=1／A(−1,2,0)、u=(2,−1,1) と 2x+y+z=4 の交点 (1,1,1)）。
   python3（sympy）で検算ずみ。
   球面と平面の図は、斜めから見た「正射影」の見取図（方位 22°・仰角 18°）。球の輪郭は正しく円になり、切り口の円は手前を実線・奥を点線でかく。
   座標の図（平面 ABC）は前の時間と同じ見取図（x 軸を左下・奥行き 0.45・0.38 倍）。 */
(function () {
  const POINTS = [
    '球面：$|\\vec{p}-\\vec{c}|=r$、$(x-a)^2+(y-b)^2+(z-c)^2=r^2$。座標平面との交わりは、その座標を 0 にすると円の式になる',
    '平面：$\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0$、$a(x-x_1)+b(y-y_1)+c(z-z_1)=0$。$ax+by+cz+d=0$ の **法線ベクトルは $(a,\\ b,\\ c)$**',
    '空間の直線 $\\vec{p}=\\vec{a}+t\\vec{u}$ は $(x_1+tu_1,\\ y_1+tu_2,\\ z_1+tu_3)$。平面の式に代入すると交点が求められる'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  // ---- 正射影の見取図（球の図・平面の図）：方位 22°、仰角 18° から見る ----
  const d2r = Math.PI / 180, ph = 22 * d2r, el = 18 * d2r;
  const RR = [-Math.sin(ph), Math.cos(ph), 0], UU = [-Math.sin(el) * Math.cos(ph), -Math.sin(el) * Math.sin(ph), Math.cos(el)], VV = [Math.cos(el) * Math.cos(ph), Math.cos(el) * Math.sin(ph), Math.sin(el)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const po = p => [dot(RR, p), dot(UU, p)];
  const add3 = (a, b, s) => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
  // 空間の円（中心 o、平面の向き e1・e2、半径 r）を、球面の手前（実線）と奥（点線）に分けてかく。vis＝見えるかどうか（球の中心からの向きと視線で判定）
  const circ3 = (o, e1, e2, r, c, wd, sc) => {
    const n = 144, pts = [];
    for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n, p = [o[0] + r * (Math.cos(t) * e1[0] + Math.sin(t) * e2[0]), o[1] + r * (Math.cos(t) * e1[1] + Math.sin(t) * e2[1]), o[2] + r * (Math.cos(t) * e1[2] + Math.sin(t) * e2[2])]; pts.push({ q: po(p), v: dot([p[0] - sc[0], p[1] - sc[1], p[2] - sc[2]], VV) > 0 }); }
    let s0 = pts.findIndex((p, i) => p.v !== pts[(i + n - 1) % n].v); if (s0 < 0) s0 = 0;
    const out = []; let run = [];
    for (let j = 0; j <= n; j++) { const p = pts[(s0 + j) % n]; if (run.length && p.v !== run[0].v) { run.push(p); out.push(run); run = [p]; } else run.push(p); }
    if (run.length > 1) out.push(run);
    return out.map(rn => ({ k: 'poly', pts: rn.map(p => p.q), c, wd: rn[0].v ? (wd || 3) : 2, dash: !rn[0].v }));
  };
  const rt3 = (o, u, v, s, c) => { const L1 = Math.hypot(...u), L2 = Math.hypot(...v), q = (a, b) => po([o[0] + s * (a * u[0] / L1 + b * v[0] / L2), o[1] + s * (a * u[1] / L1 + b * v[1] / L2), o[2] + s * (a * u[2] / L1 + b * v[2] / L2)]);
    return { k: 'poly', pts: [q(1, 0), q(1, 1), q(0, 1)], c: c || 'p', wd: 2 }; };
  // 球の図：球の中心を原点にとった座標（球面 (x−2)²+(y+3)²+(z−1)²=16 を、中心 C が原点に来るように平行移動して考える）
  const SC = [0, 0, 0], SR = 4, nz = v => { const L = Math.hypot(...v); return v.map(t => t / L); };
  const SP = nz([0.5, 0.4, 0.75]).map(t => t * SR);   // 球面上の点 P（手前）
  const sphereFig = (id, extra, noEq) => ({ t: 'fig', id, col: 1, view: [-5.4, -5.0, 5.4, 5.0], w: 540, h: 500, items: [
    { k: 'circle', o: [0, 0], r: SR, c: 'w', wd: 3 }].concat(noEq ? [] : circ3(SC, [1, 0, 0], [0, 1, 0], SR, 'd', 2, SC), extra || []) });   // noEq：赤道（横の大円）をかかない
  // xy 平面（球の中心から 1 下）との切り口：中心 H(0,0,−1)、半径 √15
  const H = [0, 0, -1], r15 = Math.sqrt(15), TT = [r15 * Math.cos(105 * d2r), r15 * Math.sin(105 * d2r), -1];   // 切り口の円の上の点（右の手前）
  const cutItems = () => [{ k: 'poly', pts: Array.from({ length: 73 }, (_, i) => po(add3(add3(H, [1, 0, 0], 5 * Math.cos(i * 5 * d2r)), [0, 1, 0], 5 * Math.sin(i * 5 * d2r)))), fill: 'g', alpha: 0.12, c: 'g', wd: 1.5 },
    lb(po(add3(H, [0, 1, 0], -4.8)), 'xy 平面', 'g', 0, 26, 20)].concat(circ3(H, [1, 0, 0], [0, 1, 0], r15, 'y', 3.5, SC));

  // ---- 平面の図（正射影）：平面上の点 A、法線ベクトル n、平面上の点 P ----
  const PA = [0.5, -1, 0], PP = [-1.6, 2.2, 0], PN = [0.5, -1, 2.4];
  const planeFig = () => ({ t: 'fig', id: 'pn', col: 1, view: [-5.2, -1.9, 5.2, 3.4], w: 680, h: 347, items: [
    { k: 'poly', pts: [po([-3, -4, 0]), po([3, -4, 0]), po([3, 4, 0]), po([-3, 4, 0])], close: true, fill: 'g', alpha: 0.14, c: 'g', wd: 2 },
    ar(po(PA), po(PP), 'p', 3.5), ar(po(PA), po(PN), 'y', 4.5), vl(po(PN), 'n', 'y', 18, 4), rt3(PA, [PP[0] - PA[0], PP[1] - PA[1], 0], [0, 0, 1], 0.45, 'y'),
    { k: 'pt', at: po(PA), name: 'A', dir: 'se', r: 5 }, { k: 'pt', at: po(PP), name: 'P', dir: 'nw', r: 5, c: 'p' }] });

  // ---- 座標の図（平面 2x+y+z=4）：前の時間と同じ見取図 ----
  const pj = (x, y, z) => [y - 0.45 * x, z - 0.38 * x];
  const cO = pj(0, 0, 0), cA = pj(2, 0, 0), cB = pj(0, 4, 0), cC = pj(0, 0, 4);
  const coordFig = (id, named, extra) => ({ t: 'fig', id, col: 1, view: [-2.0, -1.4, 5.3, 4.9], w: 556, h: 480, items: [
    ar(cO, pj(3, 0, 0), 'd', 2), ar(cO, pj(0, 5.0, 0), 'd', 2), ar(cO, pj(0, 0, 4.7), 'd', 2),
    lb(pj(3, 0, 0), 'x', 'd', -14, 8, 22), lb(pj(0, 5.0, 0), 'y', 'd', 0, 18, 22), lb(pj(0, 0, 4.7), 'z', 'd', 14, 0, 22), lb(cO, 'O', 'w', -16, -8, 22),
    { k: 'poly', pts: [cA, cB, cC], close: true, fill: 'y', alpha: 0.16, c: 'y', wd: 2.5 },
    { k: 'pt', at: cA, name: named ? 'A(2, 0, 0)' : '(2, 0, 0)', dir: 'w', r: 4, size: 20 }, { k: 'pt', at: cB, name: named ? 'B(0, 4, 0)' : '(0, 4, 0)', dir: 's', r: 4, size: 20 },
    { k: 'pt', at: cC, name: named ? 'C(0, 0, 4)' : '(0, 0, 4)', dir: 'e', r: 4, size: 20 }].concat(extra || []) });
  const LA = pj(-1, 2, 0), LQ = pj(1, 1, 1), LE = pj(2.6, 0.2, 1.8);   // 直線：A(−1,2,0)、交点 (1,1,1)、その先 t=1.8

  HB.lesson({
    id: 'mc1-10', field: '数学C　ベクトル', title: '球面・平面・直線の方程式', level: '空間のベクトル', time: '目安 9分',
    noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　球面 $x^2+y^2+z^2-6x+2y+4z+5=0$ の中心と半径を求めよ。', '(2)　球面 $(x-2)^2+(y+3)^2+(z-1)^2=16$ と $yz$ 平面が交わってできる円の半径を求めよ。',
        '(3)　点 $(2,\\ 0,\\ -1)$ を通り、$\\vec{n}=(3,\\ -1,\\ 2)$ に垂直な平面の方程式を求めよ。', '(4)　3点 A$(2,\\ 0,\\ 0)$、B$(0,\\ 4,\\ 0)$、C$(0,\\ 0,\\ 4)$ を通る平面の方程式を求めよ。',
        '(5)　点 $(-1,\\ 2,\\ 0)$ を通り $\\vec{u}=(2,\\ -1,\\ 1)$ に平行な直線と、平面 $2x+y+z=4$ の交点を求めよ。'] },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { cols: [1], part: 'めあて', say: 'この章の最後です。平面上で直線や円をベクトルの式で表したように、空間では **球面・平面・直線** を式で表します。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**球面** の方程式を求め、座標平面との交わりを調べられる\n**平面** の方程式 $ax+by+cz+d=0$ を法線ベクトルから求められる' }] },

      // ---------- 球面 ----------
      { clear: true, part: '球面の方程式', say: '点 C からの距離が一定の点の集まりが **球面** です。中心 C$(\\vec{c})$、半径 $r$ なら $|\\vec{p}-\\vec{c}|=r$。成分で書くと、2点間の距離の式から右のようになります。',
        add: [{ t: 'h', text: '球面の方程式' },
          { t: 'box', c: 'y', label: '球面', tex: '|\\vec{p}-\\vec{c}|=r' },
          { t: 'box', c: 'y', label: '成分', tex: '(x-a)^2+(y-b)^2+(z-c)^2=r^2' },
          { t: 'p', size: 'sm', text: '中心 $(a,\\ b,\\ c)$、半径 $r$' },
          sphereFig('sp', [{ k: 'seg', a: [0, 0], b: po(SP), c: 'b', wd: 3 }, lb([po(SP)[0] / 2, po(SP)[1] / 2], 'r', 'b', 16, 8, 26),
            { k: 'pt', at: [0, 0], name: 'C', dir: 'sw', r: 5, c: 'y' }, { k: 'pt', at: po(SP), name: 'P', dir: 'ne', r: 5, c: 'p' }])] },
      { say: 'たとえば中心 $(2,\\ -3,\\ 1)$、半径 4 の球面は $(x-2)^2+(y+3)^2+(z-1)^2=16$。展開すると $x^2+y^2+z^2-4x+6y-2z-2=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '(x-2)^2+(y+3)^2+(z-1)^2=16' }, { t: 'm', size: 'sm', tex: '\\Longleftrightarrow\\ x^2+y^2+z^2-4x+6y-2z-2=0' }] },
      { ask: { type: 'choice', q: '球面 $x^2+y^2+z^2-6x+2y+4z+5=0$ の中心と半径は？',
        opts: ['中心 $(3,\\ -1,\\ -2)$、半径 $3$', '中心 $(-3,\\ 1,\\ 2)$、半径 $3$', '中心 $(3,\\ -1,\\ -2)$、半径 $\\sqrt{19}$', '中心 $(6,\\ -2,\\ -4)$、半径 $3$'], ok: 0,
        why: { 1: '$x^2-6x=(x-3)^2-9$ なので中心の $x$ 座標は $+3$。符号が逆です。', 2: '定数項 5 は右辺に移すと $-5$。$9+1+4-5=9$ です。', 3: '$x$ の係数 $-6$ の半分が $-3$。2 で割り忘れています。' },
        good: '平方完成して $(x-3)^2+(y+1)^2+(z+2)^2=9+1+4-5=9$。',
        add: [{ t: 'm', size: 'sm', tex: '(x-3)^2+(y+1)^2+(z+2)^2=9' }] } },

      // ---------- 座標平面との交わり ----------
      { clear: true, part: '座標平面との交わり', say: '球面 $(x-2)^2+(y+3)^2+(z-1)^2=16$ と $xy$ 平面の交わりは、$z=0$ を代入して $(x-2)^2+(y+3)^2=15$。中心 $(2,\\ -3,\\ 0)$、半径 $\\sqrt{15}$ の **円** です。',
        add: [{ t: 'h', text: '座標平面との交わり' },
          { t: 'm', size: 'sm', tex: '(x-2)^2+(y+3)^2+(z-1)^2=16' },
          { t: 'm', size: 'sm', tex: 'z=0\\ \\text{を代入}\\ \\to\\ (x-2)^2+(y+3)^2=15' },
          { t: 'p', size: 'sm', text: '$xy$ 平面上の、中心 $(2,\\ -3,\\ 0)$、半径 $\\sqrt{15}$ の円' },
          sphereFig('cut', cutItems().concat([{ k: 'pt', at: [0, 0], name: 'C', dir: 'n', r: 5, c: 'w' }, { k: 'pt', at: po(H), name: 'H', dir: 'sw', r: 5, c: 'y' }]), true)] },
      { say: '図で見ると、中心 C から $xy$ 平面までの距離は C の $z$ 座標の 1。半径 4 と三平方の定理で、切り口の円の半径は $\\sqrt{4^2-1^2}=\\sqrt{15}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sqrt{4^2-1^2}=\\sqrt{15}', note: '中心からの距離 1\n球の半径 4' }],
        draw: [{ fig: 'cut', items: [{ k: 'seg', a: [0, 0], b: po(H), c: 'p', wd: 3 }, { k: 'seg', a: po(H), b: po(TT), c: 'p', wd: 3 }, { k: 'seg', a: [0, 0], b: po(TT), c: 'b', wd: 3 },
          rt3(H, [0, 0, 1], [TT[0], TT[1], 0], 0.5, 'p'), lb([0, po(H)[1] / 2], '1', 'p', -16, 0, 24), lb([po(TT)[0] / 2, po(TT)[1] / 2], '4', 'b', 0, -20, 24),
          lb([(po(H)[0] + po(TT)[0]) / 2, (po(H)[1] + po(TT)[1]) / 2], '√15', 'p', 0, 22, 24)] }] },
      { ask: { type: 'choice', q: '同じ球面と **$yz$ 平面** が交わってできる円の半径は？',
        opts: ['$4$', '$2\\sqrt5$', '$\\sqrt{14}$', '$2\\sqrt3$'], ok: 3,
        why: { 0: '球の半径のままです。切り口の円は、球より小さくなります。', 1: '$16-4$ ではなく $16+4$ にしています。', 2: '$x=0$ を代入すると $(0-2)^2=4$。2 ではなく 4 を引きます。' },
        good: '$x=0$ を代入して $(y+3)^2+(z-1)^2=16-4=12$。半径は $\\sqrt{12}=2\\sqrt3$。',
        add: [{ t: 'm', size: 'sm', tex: 'x=0\\ \\to\\ (y+3)^2+(z-1)^2=12,\\ \\ \\text{半径}\\ 2\\sqrt3' }],
        draw: [{ fig: 'cut', items: circ3([-2, 0, 0], [0, 1, 0], [0, 0, 1], Math.sqrt(12), 'g', 3, SC).concat([lb(po([-2, 0, 3.6]), 'yz 平面との交わり', 'g', -40, -12, 18)]) }] } },

      // ---------- 平面の方程式 ----------
      { clear: true, part: '平面の方程式', say: '点 A$(\\vec{a})$ を通り $\\vec{n}$ に垂直な平面。平面上の点 P では $\\overrightarrow{\\mathrm{AP}}\\perp\\vec{n}$ なので $\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0$。$\\vec{n}$ を平面の **法線ベクトル** といいます。',
        add: [{ t: 'h', text: '平面の方程式' },
          { t: 'box', c: 'y', label: '法線ベクトル', tex: '\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0' },
          planeFig()] },
      { say: '$\\vec{n}=(a,\\ b,\\ c)$、A$(x_1,\\ y_1,\\ z_1)$ なら $a(x-x_1)+b(y-y_1)+c(z-z_1)=0$。展開すると $ax+by+cz+d=0$。**$x,\\ y,\\ z$ の係数が法線ベクトル** です。',
        add: [{ t: 'box', c: 'p', label: '成分', tex: 'a(x-x_1)+b(y-y_1)+c(z-z_1)=0' },
          { t: 'p', size: 'sm', text: '例　A$(1,\\ -2,\\ 3)$、$\\vec{n}=(2,\\ 1,\\ -1)$\n$2(x-1)+(y+2)-(z-3)=0$ より　$2x+y-z+3=0$' }] },
      { ask: { type: 'choice', q: '点 $(2,\\ 0,\\ -1)$ を通り、$\\vec{n}=(3,\\ -1,\\ 2)$ に垂直な平面は？',
        opts: ['$3x-y+2z=-4$', '$3x-y+2z=4$', '$3x-y+2z=8$', '$2x-z=4$'], ok: 1,
        why: { 0: '展開した定数は $-6+2=-4$。右辺に移すと $+4$ です。', 2: '$z_1=-1$ なので $z-(-1)=z+1$。$2(z-1)$ にしています。', 3: '通る点と法線ベクトルを取りちがえています。' },
        good: '$3(x-2)-(y-0)+2(z+1)=0$ を展開して $3x-y+2z-4=0$、つまり $3x-y+2z=4$。',
        add: [{ t: 'm', size: 'sm', tex: '3(x-2)-y+2(z+1)=0\\quad\\therefore\\ 3x-y+2z-4=0' }] } },

      // ---------- 3点を通る平面 ----------
      { clear: true, part: '3点を通る平面', say: '前の時間の平面 ABC（A$(2,\\ 0,\\ 0)$、B$(0,\\ 4,\\ 0)$、C$(0,\\ 0,\\ 4)$）の方程式を求めます。法線ベクトルは、$\\overrightarrow{\\mathrm{AB}}$ と $\\overrightarrow{\\mathrm{AC}}$ の両方に垂直なベクトルです。',
        add: [{ t: 'h', text: '3点を通る平面' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(-2,\\ 4,\\ 0),\\quad \\overrightarrow{\\mathrm{AC}}=(-2,\\ 0,\\ 4)' },
          { t: 'p', size: 'sm', text: '$\\vec{n}=(a,\\ b,\\ c)$ とおくと\n$\\vec{n}\\cdot\\overrightarrow{\\mathrm{AB}}=0$、$\\vec{n}\\cdot\\overrightarrow{\\mathrm{AC}}=0$' },
          coordFig('pa', true)] },
      { ask: { type: 'think', q: '平面 ABC の方程式を求めよう。',
        hint: '$-2a+4b=0,\\ -2a+4c=0$。$a=2$ とおくと $\\vec{n}$ が決まる。2つ前の時間の「両方に垂直なベクトル」です。',
        ans: '$b=\\frac{a}{2},\\ c=\\frac{a}{2}$ より $\\vec{n}=(2,\\ 1,\\ 1)$。A を通るので $2(x-2)+y+z=0$、つまり $2x+y+z=4$',
        after: '前の時間の交点 $\\left(\\frac45,\\ \\frac45,\\ \\frac85\\right)$ を入れると $\\frac85+\\frac45+\\frac85=4$。たしかにこの平面上です。',
        add: [{ t: 'ans', size: 'sm', label: '答', tex: '2x+y+z=4' }],
        draw: [{ fig: 'pa', items: [ar(pj(2 / 3, 4 / 3, 4 / 3), pj(2 / 3 + 1.2, 4 / 3 + 0.6, 4 / 3 + 0.6), 'g', 4), vl(pj(2 / 3 + 1.2, 4 / 3 + 0.6, 4 / 3 + 0.6), 'n', 'g', -18, -10)] }] } },

      // ---------- 2平面の垂直 ----------
      { clear: true, cols: [1], part: '2つの平面', say: '2つの平面の関係は、**法線ベクトル** で調べます。法線ベクトルどうしが垂直なら平面どうしも垂直、法線ベクトルが平行なら平面どうしも平行です。',
        add: [{ t: 'h', text: '2つの平面の垂直・平行' },
          { t: 'tbl', cls: 'rowh', rows: [['2つの平面', '法線ベクトル $\\vec{n_1},\\ \\vec{n_2}$'], ['垂直', '$\\vec{n_1}\\cdot\\vec{n_2}=0$'], ['平行', '$\\vec{n_2}=k\\vec{n_1}$']] }] },
      { ask: { type: 'choice', q: '2つの平面 $2x+y+z=4$ と $x+ky-3z=1$ が垂直になる $k$ は？',
        opts: ['$-1$', '$-5$', '$1$', '$\\dfrac12$'], ok: 2,
        why: { 0: '$2+k-3=0$ を解くと $k=1$。移項の符号に注意。', 1: '$1\\cdot(-3)$ を $+3$ にしています。', 3: '平行の条件のように、係数の比で考えています。垂直は内積 $=0$。' },
        good: '法線ベクトル $(2,\\ 1,\\ 1)$ と $(1,\\ k,\\ -3)$ の内積が $2+k-3=0$ より $k=1$。',
        add: [{ t: 'm', tex: '(2,\\ 1,\\ 1)\\cdot(1,\\ k,\\ -3)=2+k-3=0\\quad\\therefore\\ k=1' }] } },

      // ---------- 空間の直線 ----------
      { clear: true, part: '空間の直線', say: '空間の直線も平面上と同じで、点 A$(\\vec{a})$ を通り $\\vec{u}$ に平行なら $\\vec{p}=\\vec{a}+t\\vec{u}$。成分で書くと、$x,\\ y,\\ z$ がそれぞれ $t$ の1次式になります。',
        add: [{ t: 'h', text: '空間の直線' },
          { t: 'box', c: 'b', label: '直線', tex: '\\vec{p}=\\vec{a}+t\\vec{u}' },
          { t: 'm', size: 'sm', tex: '(x,\\ y,\\ z)=(x_1+tu_1,\\ y_1+tu_2,\\ z_1+tu_3)' },
          { t: 'p', size: 'sm', text: '例　A$(-1,\\ 2,\\ 0)$ を通り $\\vec{u}=(2,\\ -1,\\ 1)$ に平行\n→ $(-1+2t,\\ 2-t,\\ t)$' },
          coordFig('ln', false, [{ k: 'seg', a: LA, b: LQ, c: 'p', dash: true, wd: 2.5 }, { k: 'seg', a: LQ, b: LE, c: 'p', wd: 2.5 },
            { k: 'pt', at: LA, name: 'A(−1, 2, 0)', dir: 'n', off: 20, dx: -34, r: 5, c: 'p', size: 20 }])] },
      { ask: { type: 'think', q: '点 A$(-1,\\ 2,\\ 0)$ を通り $\\vec{u}=(2,\\ -1,\\ 1)$ に平行な直線と、平面 $2x+y+z=4$ の交点を求めよう。',
        hint: '直線上の点 $(-1+2t,\\ 2-t,\\ t)$ を、平面の式に代入する。',
        ans: '$2(-1+2t)+(2-t)+t=4$ より $4t=4$、$t=1$　　交点 $(1,\\ 1,\\ 1)$',
        after: '前の時間はベクトルの係数で求めた交点が、平面の式を使うと1行で求められます。',
        add: [{ t: 'ans', size: 'sm', label: '答', text: '交点 $(1,\\ 1,\\ 1)$' }],
        draw: [{ fig: 'ln', items: [{ k: 'pt', at: LQ, name: '(1, 1, 1)', dir: 'n', off: 24, r: 6, c: 'g', size: 20 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで第1章「ベクトル」はおしまい。次の章は **平面上の曲線と複素数平面** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
