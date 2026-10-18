/* 慶應型 数学（理工）：2026年度 慶應義塾大学 理工学部 第1問の類題（自作問題・元の問題ではない）
   問題：円 C:(x−2)²+(y−1)²=1（中心 A(2,1)・半径1）と、原点を通る直線 ℓ:y=tx。全部空欄。
   答え（python3 で検算ずみ）：
     (1) 距離 |2t−1|/√(t²+1)=1 → 3t²−4t=0 → t=0, 4/3。t=4/3 の接点 (6/5, 8/5)（OT=2・向き (3/5,4/5)）
     (2) 0<t<4/3　(3) AM=|2t−1|/√(t²+1)
     (4) ∠OMA=90° → OA を直径とする円：中心 (1, 1/2)、半径 √5/2（の、円 C の内部の部分）
         M=((t+2)/(t²+1), t(t+2)/(t²+1)) が x²+y²−2x−y=0 を満たすことも確認
     (5) 円すい2つ：V=(1/3)π·AM²·PQ、PQ=2√(1−AM²)。u=AM²（0≦u<1）で V=(2π/3)u√(1−u)
         V'=0 ⇔ u=2/3 → 最大値 4√3π/27。(2t−1)²/(t²+1)=2/3 ⇔ 10t²−12t+1=0 ⇔ t=(6±√26)/10（≈0.090, 1.110。どちらも 0<t<4/3）
         t で数値的に最大をさがしても 0.80613…＝4√3π/27 */
(function () {
  const A = [2, 1], T1 = [2, 0], T2 = [1.2, 1.6];
  const meet = t => {   // ℓ:y=tx と C の交点（(1+t²)x²−(4+2t)x+4=0）と中点 M
    const a = 1 + t * t, b = 4 + 2 * t, D = Math.sqrt(b * b - 16 * a), x1 = (b - D) / (2 * a), x2 = (b + D) / (2 * a), xm = b / (2 * a);
    return { P: [x1, t * x1], Q: [x2, t * x2], M: [xm, t * xm] };
  };
  const S = meet(0.75), S1 = meet(1);
  const VIEW = [-0.55, -0.55, 3.45, 2.45];
  const fig = (id, items, w) => ({ t: 'fig', id, col: 1, view: VIEW, w: w || 520, h: Math.round((w || 520) * 3 / 4), items: [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [3, '3']], ty: [[1, '1'], [2, '2']] },
    { k: 'circle', o: A, r: 1, c: 'w', wd: 3 }, { k: 'label', at: [2.78, 1.95], text: 'C', size: 26 },
    { k: 'pt', at: A, name: 'A', dir: 'e', c: 'y' }].concat(items || []) });
  const ELL = (t, c) => ({ k: 'line', m: t, n: 0, c: c || 'b', wd: 2.5 });
  const TAN = [{ k: 'seg', a: [-0.5, 0], b: [3.4, 0], c: 'p', wd: 4 }, { k: 'line', m: 4 / 3, n: 0, c: 'p', wd: 3 },
    { k: 'pt', at: T1, c: 'p', name: '(2, 0)', dir: 's', off: 30, size: 20 }, { k: 'pt', at: T2, c: 'p', name: 'T', dir: 'nw', size: 24 }];
  const PQM = (s, nm) => [{ k: 'pt', at: s.P, name: 'P', dir: 'nw', c: 'b', size: 24 }, { k: 'pt', at: s.Q, name: 'Q', dir: 'nw', c: 'b', size: 24 },
    { k: 'seg', a: A, b: s.M, c: 'y', wd: 3 }, { k: 'right', o: s.M, a: A, b: s.Q, s: 15 }, { k: 'pt', at: s.M, name: nm || 'M', dir: 'nw', c: 'g', size: 24 }];
  // (4) 軌跡：OA を直径とする円（中心 (1, 1/2)、半径 √5/2）の、C の内部の弧（T1 → A → T2）
  const K = [1, 0.5], RK = Math.sqrt(5) / 2, ang = p => Math.atan2(p[1] - K[1], p[0] - K[0]) * 180 / Math.PI;
  // (5) 回転体：三角形 APQ と、ℓ で折り返した A'（t=1 のとき A'(1, 2)）
  const A2 = [1, 2], Mv = S1.M, AM = Math.SQRT1_2;
  const POINTS = [
    '円と直線は **中心と直線の距離** と半径をくらべる。接点は直角三角形（接線の長さ $\\sqrt{\\mathrm{OA}^2-r^2}$）で求めると速い',
    '弦の中点 M は「中心から弦への垂線の足」。$\\angle\\mathrm{OMA}=90^\\circ$ なので、M は **OA を直径とする円** の上（計算はほぼいらない）',
    '体積は円すい2つで $V=\\frac13\\pi\\,\\mathrm{AM}^2\\cdot\\mathrm{PQ}$。$t$ のまま微分せず、$\\mathrm{AM}^2=u$ と **まとまりを置きかえて** 微分する'
  ];

  HB.lesson({
    id: 'keio26-1', field: '慶應型　数学（理工）', title: '2026 慶應 理工 第1問の類題 ― 円と原点を通る直線・弦の中点と回転体', level: '2026年度 慶應義塾大学 理工学部 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上に、点 A$(2,\\ 1)$ を中心とする半径 $1$ の円 $C:\\ (x-2)^2+(y-1)^2=1$ がある。原点 O を通り傾きが $t$ の直線を $\\ell:\\ y=tx$ とする。次の空欄にあてはまる数または式を答えよ。',
      parts: [
        '(1)　$\\ell$ が $C$ に接するのは $t=\\boxed{\\text{ア}},\\ \\boxed{\\text{イ}}$ のときである（ただし $\\boxed{\\text{ア}}<\\boxed{\\text{イ}}$）。$t=\\boxed{\\text{イ}}$ のときの接点の座標は $\\big(\\boxed{\\text{ウ}},\\ \\boxed{\\text{エ}}\\big)$ である。',
        '(2)　$\\ell$ と $C$ が異なる 2 点で交わるような $t$ の値の範囲は $\\boxed{\\text{オ}}$ である。',
        '(3)　(2) のとき、$\\ell$ と $C$ の 2 つの交点を P，Q とし、線分 PQ の中点を M とする。線分 AM の長さを $t$ で表すと、AM $=\\boxed{\\text{カ}}$ である。',
        '(4)　$t$ が (2) の範囲を動くとき、点 M の軌跡は、中心 $\\big(\\boxed{\\text{キ}},\\ \\boxed{\\text{ク}}\\big)$、半径 $\\boxed{\\text{ケ}}$ の円のうち、円 $C$ の内部にある部分である。',
        '(5)　$t$ が (2) の範囲を動くとき、三角形 APQ を直線 $\\ell$ のまわりに 1 回転させてできる立体の体積を $V$ とする（$t=\\frac12$ のときは $V=0$ とする）。$V$ の最大値は $\\boxed{\\text{コ}}$ であり、$V$ を最大にする $t$ の値は $t=\\boxed{\\text{サ}}$ である。'
      ],
      src: '※ 2026年度 慶應義塾大学 理工学部 一般選抜 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '円と、原点を通る直線の問題です。全部が答えだけを書く空欄なので、図の性質を使って計算を減らすのがコツ。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:20px;line-height:1.5' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '円と直線の位置関係は、**中心 A と直線の距離 $d$** を半径 1 とくらべるのが基本です。$\\ell$ を $tx-y=0$ と書いて、点と直線の距離の公式を使います。',
        add: [{ t: 'h', text: '(1)　接するときの t と接点' },
          { t: 'm', tex: 'd=\\frac{|2t-1|}{\\sqrt{t^2+1}}', note: 'A(2, 1) と $tx-y=0$' },
          { t: 'box', c: 'b', size: 'sm', label: '基本', text: '$d<1$ ⇔ 2点で交わる　$d=1$ ⇔ 接する　$d>1$ ⇔ 共有点なし' },
          fig('f1', [ELL(0.75, 'd'), { k: 'label', at: [3.3, 2.2], text: 'ℓ', c: 'd', size: 24, anchor: 'end' }])] },
      { ask: { type: 'choice', q: '$\\ell$ が $C$ に接する $t$ の値は？',
        opts: ['$t=0,\\ \\dfrac43$', '$t=\\pm\\dfrac43$', '$t=0,\\ \\dfrac34$', '$t=\\dfrac34$'], ok: 0,
        why: { 1: '中心 A は $x$ 軸の上にないので、2本の接線は $x$ 軸について対称になりません。', 2: '$3t^2-4t=0$ は $t(3t-4)=0$。$3t-4=0$ の解は $\\frac43$ です。', 3: 'A を $(1,\\ 2)$ と入れかえると $\\frac34$ が出ます。分子は $|2t-1|$。また $t=0$ も解です。' },
        good: '$d=1$ の両辺を2乗して $(2t-1)^2=t^2+1$、$3t^2-4t=0$。$t=0$ は $x$ 軸そのもので、点 (2, 0) で接します。',
        add: [{ t: 'm', tex: '(2t-1)^2=t^2+1\\iff t(3t-4)=0' }, { t: 'ans', label: 'ア・イ', tex: 't=0,\\ \\ \\frac43' }],
        draw: [{ fig: 'f1', items: TAN }] } },
      { clear: true, part: '(1) 接点', say: '接点 T は直角三角形で。$\\angle\\mathrm{OTA}=90^\\circ$、OA $=\\sqrt5$、AT $=1$ なので **OT $=2$**。T は O から傾き $\\frac43$ の向きに 2 進んだ点です。',
        add: [{ t: 'h', text: '(1)　t = 4/3 のときの接点 T' },
          { t: 'm', tex: '\\mathrm{OT}=\\sqrt{\\mathrm{OA}^2-\\mathrm{AT}^2}=\\sqrt{5-1}=2' },
          { t: 'm', tex: '\\mathrm{T}=2\\Big(\\frac35,\\ \\frac45\\Big)=\\Big(\\frac65,\\ \\frac85\\Big)', note: '傾き $\\frac43$ の向きの\n長さ 1 のベクトル' },
          { t: 'ans', label: 'ウ・エ', tex: '\\Big(\\frac65,\\ \\frac85\\Big)' },
          fig('f1b', TAN.concat([{ k: 'poly', pts: [[0, 0], T2, A], close: true, c: 'y', wd: 2.5, fill: 'y', alpha: 0.15 }, { k: 'right', o: T2, a: [0, 0], b: A, s: 14 }]))] },
      { ask: { type: 'think', q: '別の見方：$\\angle\\mathrm{AO}x=\\alpha$ とすると $\\tan\\alpha=\\frac12$。また $\\tan\\angle\\mathrm{AOT}=\\frac{\\mathrm{AT}}{\\mathrm{OT}}=\\frac12$ も同じ。このことから、接線の傾き $\\frac43$ を出してみよう。',
        hint: '$x$ 軸と OT のなす角は $2\\alpha$。2倍角の公式 $\\tan2\\alpha=\\dfrac{2\\tan\\alpha}{1-\\tan^2\\alpha}$。',
        ans: '$\\tan2\\alpha=\\dfrac{2\\cdot\\frac12}{1-\\frac14}=\\dfrac43$。もう1本は角 $\\alpha-\\alpha=0$ で $x$ 軸（傾き 0）',
        after: 'OA は2本の接線のなす角を2等分します。空欄なら、この見方で式を立てずに答えられます。' } },

      // ---------- (2)(3) ----------
      { clear: true, part: '(2)(3)', say: '(2) は $d<1$ です。(1) と同じ式で、等号を不等号にかえるだけ。$(2t-1)^2<t^2+1$ を整理すると $t(3t-4)<0$。',
        add: [{ t: 'h', text: '(2)　2点で交わる t の範囲' },
          { t: 'm', tex: '\\frac{|2t-1|}{\\sqrt{t^2+1}}<1\\iff t(3t-4)<0' },
          fig('f2', [ELL(0.75)].concat(PQM(S)))] },
      { ask: { type: 'choice', q: '$t$ の値の範囲（空欄オ）は？',
        opts: ['$t<0,\\ \\dfrac43<t$', '$0\\le t\\le\\dfrac43$', '$0<t<\\dfrac43$', '$-\\dfrac43<t<\\dfrac43$'], ok: 2,
        why: { 0: 'それは $d>1$（共有点なし）の範囲です。2次不等式の解は「間」。', 1: '端の $t=0,\\ \\frac43$ では接するので、等号は入りません。', 3: '接線は $x$ 軸について対称ではありません。' },
        good: '2本の接線（$x$ 軸と $y=\\frac43x$）の間の傾きです。',
        add: [{ t: 'ans', label: 'オ', tex: '0<t<\\frac43' }] } },
      { say: '(3) です。中心から弦に下ろした垂線は、弦の中点を通ります。だから **M は A から $\\ell$ への垂線の足** で、AM は (1) の距離 $d$ そのものです。',
        add: [{ t: 'h', text: '(3)　AM の長さ' },
          { t: 'box', c: 'y', size: 'sm', label: '弦の中点', text: '中心 A と中点 M を結ぶと、AM ⊥ PQ' }] },
      { ask: { type: 'choice', q: 'AM（空欄カ）は？',
        opts: ['$\\dfrac{2t-1}{\\sqrt{t^2+1}}$', '$\\dfrac{|2t-1|}{\\sqrt{t^2+1}}$', '$\\dfrac{|2t-1|}{t^2+1}$', '$\\sqrt{1-\\dfrac{(2t-1)^2}{t^2+1}}$'], ok: 1,
        why: { 0: '$0<t<\\frac12$ のとき $2t-1<0$ で、長さが負になります。絶対値が必要です。', 2: '分母は $\\sqrt{t^2+1}$（法線ベクトル $(t,\\ -1)$ の大きさ）。', 3: 'それは三平方の定理で出す PM（弦の半分）の長さです。' },
        good: 'AM は「A と $\\ell$ の距離」。$t=\\frac12$ のとき 0 で、このとき $\\ell$ は A を通ります。',
        add: [{ t: 'ans', label: 'カ', tex: '\\mathrm{AM}=\\frac{|2t-1|}{\\sqrt{t^2+1}}' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) の軌跡。M は A から $\\ell$ への垂線の足なので **$\\angle\\mathrm{OMA}=90^\\circ$**。O と A は動かないので、M は OA を直径とする円の上にあります。',
        add: [{ t: 'h', text: '(4)　M の軌跡' },
          { t: 'box', c: 'g', size: 'sm', label: '気づくこと', text: '$\\angle\\mathrm{OMA}=90^\\circ$（O，A は定点）\n→ M は OA を直径とする円の上' },
          fig('f3', [ELL(0.75, 'd'), { k: 'circle', o: K, r: RK, c: 'w', wd: 2, dash: true }, { k: 'seg', a: [0, 0], b: A, c: 'y', wd: 2, dash: true },
            { k: 'seg', a: A, b: S.M, c: 'y', wd: 3 }, { k: 'right', o: S.M, a: A, b: [0, 0], s: 15 }, { k: 'pt', at: S.M, name: 'M', dir: 'nw', c: 'g', size: 24 }])] },
      { ask: { type: 'choice', q: 'OA を直径とする円の、中心と半径（空欄キ・ク・ケ）は？',
        opts: ['中心 $(2,\\ 1)$、半径 $\\sqrt5$', '中心 $\\left(1,\\ \\frac12\\right)$、半径 $\\sqrt5$', '中心 $\\left(1,\\ \\frac12\\right)$、半径 $\\frac54$', '中心 $\\left(1,\\ \\frac12\\right)$、半径 $\\frac{\\sqrt5}2$'], ok: 3,
        why: { 0: '中心は OA の中点です。A を中心にした円ではありません。', 1: 'OA $=\\sqrt5$ は直径。半径はその半分です。', 2: '$\\frac54$ は半径の2乗。$x^2+y^2-2x-y=0$ を平方完成すると右辺が $\\frac54$ になります。' },
        good: '中心は OA の中点 $\\left(1,\\ \\frac12\\right)$、半径は $\\frac{\\sqrt5}{2}$。式では $x^2+y^2-2x-y=0$ です。',
        add: [{ t: 'm', tex: '\\Big(x-1\\Big)^2+\\Big(y-\\frac12\\Big)^2=\\frac54' }] } },
      { say: 'ただし M は弦の中点なので、円 $C$ の内部だけ。両はしは2つの接点（ふくまない）、途中で A も通ります（$t=\\frac12$）。黄色の弧が軌跡です。',
        add: [{ t: 'ans', label: 'キ・ク・ケ', tex: '\\text{中心 }\\Big(1,\\ \\frac12\\Big),\\ \\ \\text{半径 }\\frac{\\sqrt5}{2}' }],
        draw: [{ fig: 'f3', items: [{ k: 'arc', o: K, r: RK, a1: ang(T1), a2: ang(T2), c: 'y', wd: 6 },
          { k: 'pt', at: T1, open: true, c: 'p' }, { k: 'pt', at: T2, open: true, c: 'p', name: 'T', dir: 'nw', size: 22 }] }] },

      // ---------- (5) ----------
      { clear: true, cols: [0.54, 0.46], part: '(5)', say: '三角形 APQ を $\\ell$ のまわりに回すと、底面の半径が AM の **円すい2つ** を、底面どうしでくっつけた形になります。高さの和は PQ です。',
        add: [{ t: 'h', text: '(5)　回転体の体積の最大' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}V&=\\tfrac13\\pi\\,\\mathrm{AM}^2\\cdot\\mathrm{PM}+\\tfrac13\\pi\\,\\mathrm{AM}^2\\cdot\\mathrm{QM}\\\\ &=\\tfrac13\\pi\\,\\mathrm{AM}^2\\cdot\\mathrm{PQ}\\end{aligned}' },
          fig('f4', [ELL(1),
            { k: 'poly', pts: [A, S1.P, A2, S1.Q], close: true, c: 'y', wd: 2, dash: true },
            { k: 'poly', pts: [A, S1.P, S1.Q], close: true, c: 'y', wd: 3, fill: 'y', alpha: 0.3 },
            { k: 'seg', a: A, b: A2, c: 'g', wd: 2.5 },
            { k: 'param', x: Mv[0] + '+' + AM + '*cos(t)*0.7071+0.12*sin(t)*0.7071', y: Mv[1] + '-' + AM + '*cos(t)*0.7071+0.12*sin(t)*0.7071', a: 0, b: 2 * Math.PI, c: 'g', wd: 2 },
            { k: 'pt', at: S1.P, name: 'P', dir: 'w', c: 'b', size: 24 }, { k: 'pt', at: S1.Q, name: 'Q', dir: 'nw', c: 'b', size: 24 }, { k: 'label', at: [2.62, 2.25], text: 'ℓ', c: 'b', size: 24 }, { k: 'label', at: A2, text: 'A′', c: 'y', size: 22, dx: -14, dy: -12, anchor: 'end' }], 480)] },
      { say: 'PQ は三平方の定理で $\\mathrm{PQ}=2\\mathrm{PM}=2\\sqrt{1-\\mathrm{AM}^2}$。ここで $\\mathrm{AM}^2=u$ と **置きかえる** と、$V$ は $u$ だけの式になります。',
        add: [{ t: 'm', tex: 'V=\\frac{2\\pi}{3}\\,u\\sqrt{1-u}\\qquad(0\\le u<1)', note: '$u=\\mathrm{AM}^2=\\dfrac{(2t-1)^2}{t^2+1}$' },
          { t: 'p', size: 'sm', text: '$t$ が $0<t<\\frac43$ を動くと、$u$ は $0\\le u<1$ のすべての値をとる（$t=\\frac12$ で 0、接する直前で 1 に近づく）' }] },
      { clear: true, cols: [0.6, 0.4], part: '(5) 最大', say: '$t$ のまま微分すると式がとても複雑です。$u$ の式 $f(u)=u\\sqrt{1-u}$ を微分して、増減を調べます。',
        add: [{ t: 'h', text: '(5)　u で微分して最大値を求める' },
          { t: 'm', tex: 'V=\\frac{2\\pi}{3}f(u),\\quad f(u)=u\\sqrt{1-u}' }] },
      { ask: { type: 'choice', q: '$f(u)=u\\sqrt{1-u}$ を微分して $f\'(u)=0$ となる $u$ は？',
        opts: ['$u=\\dfrac12$', '$u=\\dfrac13$', '$u=\\dfrac23$', '$u=\\dfrac34$'], ok: 2,
        why: { 0: 'それは $u(1-u)$ の最大。$\\sqrt{\\phantom{a}}$ がついているので答えがかわります。', 1: '$f\'(u)=\\frac{2-3u}{2\\sqrt{1-u}}$ の分子 $2-3u$ を $1-3u$ としています。', 3: '$\\sqrt{1-u}$ の微分 $-\\frac1{2\\sqrt{1-u}}$ の $\\frac12$ を落とすと、こうなります。' },
        good: '$f\'(u)=\\sqrt{1-u}-\\frac{u}{2\\sqrt{1-u}}=\\frac{2-3u}{2\\sqrt{1-u}}$。$u=\\frac23$ の前後で ＋ から − にかわります。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$u$', '$0$', '$\\cdots$', '$\\frac23$', '$\\cdots$', '$(1)$'], ["$f'(u)$", '', '$+$', '$0$', '$-$', ''], ['$f(u)$', '$0$', '$\\nearrow$', '最大', '$\\searrow$', '']] }] } },
      { say: '最大値は $u=\\frac23$ を入れて $\\frac{2\\pi}{3}\\cdot\\frac23\\cdot\\frac1{\\sqrt3}$。分母を有理化して $\\frac{4\\sqrt3}{27}\\pi$ です。',
        add: [{ t: 'ans', label: 'コ', tex: 'V_{\\max}=\\frac{2\\pi}{3}\\cdot\\frac23\\sqrt{\\frac13}=\\frac{4\\sqrt3}{27}\\pi' }] },
      { ask: { type: 'choice', q: '$\\mathrm{AM}^2=\\dfrac{(2t-1)^2}{t^2+1}=\\dfrac23$ となる $t$（空欄サ）は？',
        opts: ['$t=\\dfrac{6+\\sqrt{26}}{10}$ だけ', '$t=\\dfrac{6\\pm\\sqrt{26}}{10}$', '$t=\\dfrac{6-\\sqrt{26}}{10}$ だけ', '$t=\\dfrac{3\\pm\\sqrt{7}}{5}$'], ok: 1,
        why: { 0: '$\\frac{6-\\sqrt{26}}{10}\\approx0.09$ も $0<t<\\frac43$ に入ります。', 2: '$\\frac{6+\\sqrt{26}}{10}\\approx1.11<\\frac43$ なので、こちらも入ります。', 3: '整理した式は $10t^2-12t+1=0$。解の公式で $\\frac{12\\pm\\sqrt{104}}{20}$ です。' },
        good: '$3(2t-1)^2=2(t^2+1)$ より $10t^2-12t+1=0$。2つとも範囲に入るので、最大になる $t$ は2つあります。',
        add: [{ t: 'm', col: 1, tex: '10t^2-12t+1=0' }, { t: 'ans', col: 1, label: 'サ', tex: 't=\\frac{6\\pm\\sqrt{26}}{10}' }] } },
      { ask: { type: 'think', q: '$V$ を最大にする直線が2本あるのはなぜ？　図で説明してみよう。',
        hint: '$\\mathrm{AM}^2=\\frac23$ は「A と $\\ell$ の距離が $\\frac{\\sqrt6}{3}$」ということ。O を通る直線で、A からの距離が決まった値になるものは何本？',
        ans: 'A を中心とする半径 $\\frac{\\sqrt6}{3}$ の円に、O から引いた接線が2本ある（A の下側と上側を通る）。どちらも AM が同じなので V も同じ',
        after: '$V$ は AM だけで決まります。だから「AM² を1つの文字に置きかえる」のが、いちばん計算の少ない道でした。' } },

      // ---------- ポイント ----------
      { clear: true, cols: [1], part: '空欄のコツ', say: 'この大問は全部が空欄。式を立てる前に「どの図形の性質が使えるか」を見ると、計算がぐっと減ります。最後に見直しのしかたも確かめましょう。',
        add: [{ t: 'h', text: '速く・正確に埋めるコツ' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['小問', '使う性質', '確かめ'], ['(1) 接点', '直角三角形 OTA（OT $=2$）', 'T が $C$ の式を満たすか'], ['(2)(3)', '中心と直線の距離 $d$', '$t=\\frac12$ で AM $=0$（A を通る）'], ['(4)', '$\\angle\\mathrm{OMA}=90^\\circ$ → 直径の円', '両はしが接点・A を通る'], ['(5)', '円すい2つ・$\\mathrm{AM}^2=u$', '範囲 $0<t<\\frac43$ に入るか']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。距離・直角・置きかえの3つで、5つの小問がつながっていました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、空欄を自分でうめてみましょう。' }
    ]
  });
})();
