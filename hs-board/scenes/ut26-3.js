/* 2026 東大 理系 第3問の類題（自作）：球面上の3点（2点は xy 平面上）と重心の条件 → 弦の中点の軌跡と、弦が通る範囲
   問題：S：x²+y²+z²=9。S 上の P, Q（xy 平面上、P≠Q）、R。四面体 OPQR の重心 G(1/2, 0, 1/4)。
   答え（python3・sympy と数値で検算ずみ）：
   (1) M(u,v,0) とすると P+Q=2M、R=4G−2M=(2−2u, −2v, 1)。|R|²=9 ⇔ (u−1)²+v²=2。
       逆に、この円上の M は √2−1≦|OM|≦√2+1（0 でなく 3 未満）なので、弦 PQ がただ1つ決まり、R も S 上 → 円全体
   (2) 弦 PQ は直線 ux+vy=u²+v² の、円 x²+y²≦9 の内側の部分。u=1+√2cosθ, v=√2sinθ を入れると
       √2{(x−2)cosθ+y sinθ}=3−x。解をもつ ⇔ 2{(x−2)²+y²}≧(3−x)² ⇔ (x−1)²/2+y²≧1
       → 範囲は x²+y²≦9 かつ (x−1)²/2+y²≧1（境界をふくむ）。楕円上の点と O の距離は最大 1+√2<3
       （サンプリングで「弦の点はすべて範囲に入る」「範囲の点はどれかの弦にのる」を確認：食いちがい 0）
   図の例：θ=π/2 のとき M(1,√2,0)、P(−1,2√2,0)、Q(3,0,0)、R(0,−2√2,1)（|R|=3、重心 (1/2,0,1/4) を確認）
   別の見方：楕円の焦点は O と (2,0)。ℓ_M はすべて楕円の接線で、M は焦点 O から接線への垂線の足（補助円 (x−1)²+y²=2） */
(function () {
  const r2 = Math.SQRT2, f = v => v.toFixed(4);
  // ---- 見取図（正射影：x 軸は左下、y 軸は右、z 軸は上） ----
  const nrm = v => { const L = Math.hypot(...v); return v.map(c => c / L); };
  const V = nrm([1, 0.4, 0.5]), E1 = nrm([-V[1], V[0], 0]), E2 = [V[1] * E1[2] - V[2] * E1[1], V[2] * E1[0] - V[0] * E1[2], V[0] * E1[1] - V[1] * E1[0]];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const t0 = Math.atan2(V[1], V[0]);   // 赤道のうち、手前に見える半分は t0−π/2 〜 t0+π/2
  const eq = (a, b, dash) => ({ k: 'param', x: `3*cos(t)*${f(E1[0])}+3*sin(t)*${f(E1[1])}`, y: `3*cos(t)*${f(E2[0])}+3*sin(t)*${f(E2[1])}`, a, b, c: 'b', dash, wd: 2.5 });
  const P3 = [-1, 2 * r2, 0], Q3 = [3, 0, 0], M3 = [1, r2, 0], R3 = [0, -2 * r2, 1], G3 = [0.5, 0, 0.25];
  const sph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-3.9, -3.6, 3.9, 3.7], w: 560, h: 524, items: [
    { k: 'circle', o: [0, 0], r: 3, c: 'd', wd: 2.5 },
    eq(t0 - Math.PI / 2, t0 + Math.PI / 2, false), eq(t0 + Math.PI / 2, t0 + 3 * Math.PI / 2, true),
    { k: 'vec', a: pj([0, 0, 0]), b: pj([4.4, 0, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 3.7, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 0, 3.5]), c: 'd', wd: 2 },
    { k: 'label', at: pj([4.4, 0, 0]), text: 'x', dx: -14, dy: 10, c: 'd' }, { k: 'label', at: pj([0, 3.7, 0]), text: 'y', dx: 16, c: 'd' }, { k: 'label', at: pj([0, 0, 3.5]), text: 'z', dx: 16, c: 'd' },
    { k: 'seg', a: pj(P3), b: pj(Q3), c: 'y', wd: 4 }, { k: 'seg', a: pj(P3), b: pj(R3), c: 'w', wd: 2, dash: true }, { k: 'seg', a: pj(Q3), b: pj(R3), c: 'w', wd: 2, dash: true },
    { k: 'pt', at: pj([0, 0, 0]), name: 'O', dir: 'sw', size: 22, c: 'w', r: 4 },
    { k: 'pt', at: pj(P3), name: 'P', dir: 'ne', c: 'y' }, { k: 'pt', at: pj(Q3), name: 'Q', dir: 'w', c: 'y' }, { k: 'pt', at: pj(M3), name: 'M', dir: 's', c: 'p' },
    { k: 'pt', at: pj(R3), name: 'R', dir: 'nw', c: 'g' }, { k: 'pt', at: pj(G3), name: 'G', dir: 'n', c: 'o', r: 5 }].concat(extra || []) });
  // ---- xy 平面の図 ----
  const ax = { k: 'axes', tx: [[3, '3']], ty: [] };
  const plane = (id, extra, s) => ({ t: 'fig', id, col: 1, view: [-3.8, -3.8, 3.8, 3.8], w: s || 450, h: s || 450, items: [ax, { k: 'circle', o: [0, 0], r: 3, c: 'd', dash: true, wd: 2.5 }].concat(extra || []) });
  const Mcirc = { k: 'circle', o: [1, 0], r: r2, c: 'p', wd: 3.5 };
  // θ のときの M と弦 PQ の両はし
  const chord = th => { const u = 1 + r2 * Math.cos(th), v = r2 * Math.sin(th), d = Math.hypot(u, v), s = Math.sqrt(9 - d * d), nx = -v / d, ny = u / d; return { M: [u, v], P: [u + s * nx, v + s * ny], Q: [u - s * nx, v - s * ny] }; };
  const chords = (n, c) => { const out = []; for (let k = 0; k < n; k++) { const ch = chord(2 * Math.PI * k / n); out.push({ k: 'seg', a: ch.P, b: ch.Q, c: c || 'y', wd: 2 }); } return out; };
  const ell = { k: 'param', x: '1+sqrt(2)*cos(t)', y: 'sin(t)', c: 'g', wd: 3.5 };
  // 範囲（円の内側・楕円の外側）を上半分・下半分の2つの多角形でぬる
  const half = sg => { const pts = []; for (let i = 0; i <= 90; i++) { const t = Math.PI * i / 90; pts.push([3 * Math.cos(t), sg * 3 * Math.sin(t)]); }
    for (let i = 90; i >= 0; i--) { const t = Math.PI * i / 90; pts.push([1 + r2 * Math.cos(t), sg * Math.sin(t)]); } return pts; };
  const region = [{ k: 'poly', pts: half(1), close: true, fill: 'g', alpha: 0.3, noStroke: true }, { k: 'poly', pts: half(-1), close: true, fill: 'g', alpha: 0.3, noStroke: true }];
  const POINTS = [
    '重心の条件は **ベクトルの和** で：$\\overrightarrow{\\mathrm{OR}}=4\\overrightarrow{\\mathrm{OG}}-2\\overrightarrow{\\mathrm{OM}}$。R が球面上 ⇔ M の式。軌跡は **逆の確認**（M から弦が本当に決まるか）まで書く',
    '線分の **通過範囲** は、点 $(x,\\,y)$ を固定して「それを通る線分があるようなパラメータ $\\theta$ が存在する条件」に読みかえる',
    '$a\\cos\\theta+b\\sin\\theta=c$ が解をもつ ⇔ $c^2\\le a^2+b^2$（**合成**）。境界の曲線は、直線たちがみな接する曲線（今回は楕円）'
  ];

  HB.lesson({
    id: 'ut26-3', field: '東大型　数学（理系）', title: '2026 東大 理系 第3問の類題 ― 球面上の3点と重心、弦が通る範囲', level: '2026年度 東京大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '座標空間において、原点 O を中心とする半径 3 の球面を $S$ とする。$S$ 上の3点 P, Q, R が、次の2つの条件をみたしながら動く。\n・P, Q は $xy$ 平面上にあり、P $\\neq$ Q である。\n・四面体 OPQR の重心は G$\\left(\\dfrac12,\\ 0,\\ \\dfrac14\\right)$ である。',
      parts: [
        '(1)　線分 PQ の中点 M の軌跡を求め、$xy$ 平面上に図示せよ。',
        '(2)　線分 PQ が通過する範囲を、$xy$ 平面上に図示せよ。'
      ],
      src: '※ 2026年度 東京大学 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '空間の点の動きを、平面の軌跡と領域に読みかえる問題です。前半は軌跡、後半は「線分が通過する範囲」。まず問題文を読みましょう。（問題文は Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'P, Q は球面上で、しかも $xy$ 平面上。つまり $xy$ 平面の円 $x^2+y^2=9$ の上の点で、PQ はその円の弦です。R は空間の点で、重心の条件で M から決まります。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: '・P, Q：$xy$ 平面の円 $x^2+y^2=9$ の上\n・M：弦 PQ の中点（$xy$ 平面上）\n・R：球面 $S$ 上。重心の条件で M から決まる' },
          { t: 'box', c: 'b', size: 'sm', label: '重心', text: '四面体 OPQR の重心 G は（O の位置ベクトルは $\\vec0$）\n$\\overrightarrow{\\mathrm{OG}}=\\dfrac14\\left(\\overrightarrow{\\mathrm{OP}}+\\overrightarrow{\\mathrm{OQ}}+\\overrightarrow{\\mathrm{OR}}\\right)$' },
          sph('s1')] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。M$(u,\\,v,\\,0)$ とおくと $\\overrightarrow{\\mathrm{OP}}+\\overrightarrow{\\mathrm{OQ}}=2\\overrightarrow{\\mathrm{OM}}$。重心の式に入れて、R を M で表します。',
        add: [{ t: 'h', text: '(1)　中点 M の軌跡' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}+\\overrightarrow{\\mathrm{OQ}}+\\overrightarrow{\\mathrm{OR}}=4\\overrightarrow{\\mathrm{OG}}=(2,\\ 0,\\ 1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OR}}=(2,\\ 0,\\ 1)-2\\overrightarrow{\\mathrm{OM}}' },
          sph('s2')] },
      { ask: { type: 'choice', q: 'M$(u,\\,v,\\,0)$ のとき、R の座標は？',
        opts: ['$(2-u,\\ -v,\\ 1)$', '$(2u-2,\\ 2v,\\ 1)$', '$(2-2u,\\ -2v,\\ 1)$', '$\\left(\\frac32-2u,\\ -2v,\\ \\frac34\\right)$'], ok: 2,
        why: { 0: '$\\overrightarrow{\\mathrm{OP}}+\\overrightarrow{\\mathrm{OQ}}=2\\overrightarrow{\\mathrm{OM}}$。M を1回しか引いていません。', 1: '符号が逆です。$\\overrightarrow{\\mathrm{OR}}=4\\overrightarrow{\\mathrm{OG}}-2\\overrightarrow{\\mathrm{OM}}$。', 3: '三角形 PQR の重心（3でわる）と取りちがえています。四面体は O もふくめて 4 でわります。' },
        good: '$\\overrightarrow{\\mathrm{OR}}=(2,0,1)-(2u,2v,0)=(2-2u,\\ -2v,\\ 1)$。',
        add: [{ t: 'm', tex: '\\mathrm{R}(2-2u,\\ -2v,\\ 1)' }] } },
      { say: 'R は球面 $S$ 上なので $\\mathrm{OR}^2=9$。これを整理すると、$u,\\ v$ の式（円）になります。',
        add: [{ t: 'm', tex: '(2-2u)^2+(-2v)^2+1^2=9' },
          { t: 'm', tex: '\\iff (u-1)^2+v^2=2' }] },

      { clear: true, cols: [0.54, 0.46], say: 'M は「中心 $(1,\\,0)$、半径 $\\sqrt2$ の円」の上にあります。でも軌跡の答案では、**逆** も確かめます。円の上のどの点も、本当に M になれるでしょうか。',
        add: [{ t: 'h', text: '(1)　つづき：逆の確認' },
          { t: 'm', tex: '(u-1)^2+v^2=2,\\quad z=0' },
          plane('p1', [Mcirc, { k: 'pt', at: [1, 0], c: 'p', r: 4 }, { k: 'label', at: [1, -r2], text: '(x−1)²+y² = 2', c: 'p', dy: 26, size: 22 }])] },
      { ask: { type: 'choice', q: '円上の点 M が、本当に弦 PQ の中点になるために確かめることは？',
        opts: ['M が $x$ 軸上にある', 'M が O でなく $x^2+y^2<9$', 'M が円 $x^2+y^2=9$ の上', '何も確かめなくてよい'], ok: 1,
        why: { 0: '$x$ 軸上でなくても弦は作れます。大事なのは O からの距離です。', 2: 'M が円周上だと P＝Q になってしまい、弦ができません。', 3: '軌跡では「本当にその点に来られるか」まで確かめます。' },
        good: '$0<\\mathrm{OM}<3$ なら、OM に垂直な弦がちょうど1本でき、M はその中点。この円では $\\sqrt2-1\\le\\mathrm{OM}\\le\\sqrt2+1$ です。',
        draw: [{ fig: 'p1', items: [{ k: 'seg', a: [-1, 2 * r2], b: [3, 0], c: 'y', wd: 3 }, { k: 'pt', at: [-1, 2 * r2], name: 'P', dir: 'nw', c: 'y' }, { k: 'pt', at: [3, 0], name: 'Q', dir: 'ne', c: 'y' }, { k: 'pt', at: [1, r2], name: 'M', dir: 'ne', c: 'p' }] }] } },
      { say: 'そのとき R$(2-2u,\\,-2v,\\,1)$ は自動的に $S$ 上。R の $z$ 座標は 1 なので、O, P, Q, R は同じ平面になく、四面体もできます。(1) の答えです。',
        add: [{ t: 'ans', label: '(1) 答', text: '$xy$ 平面上の円 $(x-1)^2+y^2=2$（全体）\n右の図の桃色の円' }] },

      // ---------- (2) 方針 ----------
      { clear: true, cols: [0.54, 0.46], part: '(2)', say: '(2) です。M を決めると、弦 PQ は「M を通り、OM に垂直な直線」の、円 $x^2+y^2\\le9$ の内側の部分。その直線の式は $ux+vy=u^2+v^2$ です。',
        add: [{ t: 'h', text: '(2)　線分 PQ が通過する範囲' },
          { t: 'm', tex: '\\ell_M:\\ ux+vy=u^2+v^2', note: '← $\\overrightarrow{\\mathrm{OM}}\\cdot(\\overrightarrow{\\mathrm{OX}}-\\overrightarrow{\\mathrm{OM}})=0$' },
          { t: 'p', size: 'sm', text: '線分 PQ ＝ 直線 $\\ell_M$ のうち、$x^2+y^2\\le9$ の部分' },
          plane('p2', [Mcirc].concat(chords(16)))] },
      { ask: { type: 'choice', q: '通過する範囲を、もれなく正確に求める方針は？',
        opts: ['M をいくつか選んで図をかく', '弦の長さの範囲を調べる', '$\\ell_M$ の傾きの範囲を調べる', '点を固定し、それを通る $\\ell_M$ の存在条件を調べる'], ok: 3,
        why: { 0: '図は見当をつけるのに役立ちますが、境界の曲線が何かは決まりません。', 1: '長さがわかっても、どこを通るかはわかりません。', 2: '傾きだけでは、直線の位置が決まりません。' },
        good: '点を固定して「その点を通るパラメータが **存在する** 条件」に読みかえるのが基本です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '方針', text: '点 $(x,\\,y)$ を固定する。\n$\\ell_M$ がこの点を通るような M（円上）が存在する条件を求める' }] } },

      // ---------- (2) 計算 ----------
      { clear: true, say: 'M を角 $\\theta$ で表します。$u=1+\\sqrt2\\cos\\theta,\\ v=\\sqrt2\\sin\\theta$。$u^2+v^2=3+2\\sqrt2\\cos\\theta$ なので、$\\ell_M$ の式は $\\theta$ の式になります。',
        add: [{ t: 'h', text: '(2)　つづき：θ が存在する条件' },
          { t: 'm', tex: 'u=1+\\sqrt2\\cos\\theta,\\quad v=\\sqrt2\\sin\\theta', note: '$u^2+v^2=3+2\\sqrt2\\cos\\theta$' },
          { t: 'm', tex: '(1+\\sqrt2\\cos\\theta)x+\\sqrt2\\sin\\theta\\cdot y=3+2\\sqrt2\\cos\\theta' },
          { t: 'm', tex: '\\iff\\ \\sqrt2\\{(x-2)\\cos\\theta+y\\sin\\theta\\}=3-x' }] },
      { ask: { type: 'choice', q: 'この $\\theta$ の方程式が解をもつ条件は？',
        opts: ['$2\\{(x-2)^2+y^2\\}\\ge(3-x)^2$', '$2\\{(x-2)^2+y^2\\}\\le(3-x)^2$', '$|3-x|\\le\\sqrt2$', '$(x-2)^2+y^2\\ge(3-x)^2$'], ok: 0,
        why: { 1: '不等号が逆です。左辺は合成すると $-\\sqrt2r$ から $\\sqrt2r$ まで動くので、$|3-x|\\le\\sqrt2r$。', 2: '$\\cos\\theta,\\ \\sin\\theta$ の係数 $x-2,\\ y$ を忘れています。', 3: '$\\sqrt2$ を2乗した 2 を落としています。' },
        good: '$r=\\sqrt{(x-2)^2+y^2}$ とおくと、合成で左辺は $\\sqrt2r\\sin(\\theta+\\beta)$。$-\\sqrt2r$ 以上 $\\sqrt2r$ 以下のすべての値をとります。',
        add: [{ t: 'm', tex: '2\\{(x-2)^2+y^2\\}\\ge(3-x)^2' }] } },
      { say: '展開して整理すると $x^2-2x+2y^2-1\\ge0$、つまり楕円 $\\dfrac{(x-1)^2}{2}+y^2=1$ の **外側**（周もふくむ）。なお $r=0$ の点 $(2,0)$ は条件をみたさず、ちゃんと除かれます。',
        add: [{ t: 'm', tex: '\\iff x^2-2x+2y^2-1\\ge0\\iff\\frac{(x-1)^2}{2}+y^2\\ge1' }] },

      // ---------- (2) 答え ----------
      { clear: true, cols: [0.5, 0.5], say: '線分 PQ は円 $x^2+y^2\\le9$ の内側にあるので、この条件と合わせたものが答えです。楕円上の点と O の距離は最大でも $1+\\sqrt2<3$ なので、楕円は円の内側にすっぽり入ります。',
        add: [{ t: 'h', text: '(2)　答え' },
          { t: 'ans', label: '(2) 答', text: '$x^2+y^2\\le9$ かつ $\\dfrac{(x-1)^2}{2}+y^2\\ge1$\n右の図の緑の部分（境界をふくむ）' },
          plane('p3', region.concat([{ k: 'circle', o: [0, 0], r: 3, c: 'g', wd: 3 }, ell, { k: 'pt', at: [1, 0], c: 'g', r: 4 },
            { k: 'label', at: [1, 0], text: '楕円', c: 'g', dy: -22, size: 22, plain: true }]), 480),
          { t: 'p', size: 'sm', text: '楕円 $\\dfrac{(x-1)^2}{2}+y^2=1$：中心 $(1,\\,0)$\n$x$ 方向の半径 $\\sqrt2$、$y$ 方向の半径 $1$\n（$x$ 軸と $1\\pm\\sqrt2$、$y$ 軸と $\\pm\\dfrac{1}{\\sqrt2}$ で交わる）' }] },
      { say: '16 本の弦をかいた図と見くらべてください。弦がびっしり通る所と、まったく通らない「楕円の穴」が、計算どおりになっています。',
        draw: [{ fig: 'p3', items: chords(16, 'y') }] },
      { ask: { type: 'think', q: '別の見方：この楕円の焦点はどこ？　M と焦点 O の関係も考えてみよう。',
        hint: '$\\frac{(x-1)^2}{2}+y^2=1$ で $a^2=2,\\ b^2=1$。焦点は中心から $\\sqrt{a^2-b^2}$ の所。',
        ans: '焦点は O$(0,\\,0)$ と $(2,\\,0)$。直線 $\\ell_M$ はどれも楕円の接線で、M は焦点 O から接線に下ろした垂線の足。その足は「中心 $(1,0)$、半径 $a=\\sqrt2$ の円」（補助円）をえがく',
        after: 'M の円が O を内側にふくむので楕円になりました。O が M の円の外にあると、同じ計算で境界は **双曲線** になります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の条件を平面の式に落とし、「存在条件」で範囲を求める。東大の軌跡・領域の王道です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
