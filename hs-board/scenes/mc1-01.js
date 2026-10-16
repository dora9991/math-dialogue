/* 数学C 第1章 ベクトル 平面上のベクトル ①：ベクトルとその演算
   例はすべて自作（方眼の矢印 a=(2,1) と p=(4,2)・q=(−2,−1)・r=(2,1)・s=(1,2)／和 (3,1)+(1,2)=(4,3)／
   AB−CB=AC／2(a+3b)−3(a−b)=−a+9b／3x−a=x+5b → x=a/2+5b/2／(3,4)=2(2,1)+(−1,2)／平行四辺形 ABCD で AM=b+a/2、DE=a−2b/3）。
   python3（sympy）で検算ずみ。図は方眼の目もりどおりの形。 */
(function () {
  const POINTS = [
    'ベクトルは **向きと大きさ** だけをもつ量。向きも大きさも同じなら、位置がちがっても等しい。$-\\vec{a}$ は反対向き、$\\vec{0}$ は大きさ 0',
    '和は「つなぐ」：$\\overrightarrow{\\mathrm{AB}}+\\overrightarrow{\\mathrm{BC}}=\\overrightarrow{\\mathrm{AC}}$。差は始点をそろえて $\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OA}}=\\overrightarrow{\\mathrm{AB}}$。$k\\vec{a}$ は大きさ $|k|$ 倍（$k<0$ なら反対向き）',
    '$\\vec{a},\\ \\vec{b}$ が $\\vec{0}$ でなく平行でないとき、平面上のどんなベクトルも $s\\vec{a}+t\\vec{b}$ の形に **ただ1通り** に表せる'
  ];
  const range = n => Array.from({ length: n + 1 }, (_, i) => i);
  // 方眼の図（目もり 1 の方眼。view は少し外側まで）
  const grid = (id, W, H, items, w) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.3, W + 0.3, H + 0.3], w: w || 600, h: Math.round((w || 600) * (H + 0.6) / (W + 0.6)),
    items: [{ k: 'axes', grid: true, xaxis: false, yaxis: false, o: false, tx: range(W), ty: range(H) }].concat(items) });
  const ar = (a, b, c, id) => ({ k: 'vec', a, b, c, wd: 3.5, id });
  const vl = (at, text, c, dx, dy, id) => ({ k: 'label', at, text, c, vec: true, size: 28, dx: dx || 0, dy: dy || 0, id });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // 「a + b」「2a」のような字：ベクトルの文字だけに矢印をのせる（spec＝[字, 矢印か, 横のずらし px]）
  const vx = (at, spec, c, dx, dy, size) => spec.map(([t, v, x]) => ({ k: 'label', at, text: t, c, vec: v, size: size || 26, dx: (dx || 0) + x, dy: dy || 0 }));
  const PLUS = [['a', true, -26], ['+', false, 0], ['b', true, 25]], MINUS = [['a', true, -26], ['−', false, 0], ['b', true, 25]];

  // 相等の図：a=(2,1)、p=(4,2)（2倍）、q=(−2,−1)（反対）、r=(2,1)（等しい）、s=(1,2)（向きがちがう）
  const eqFig = () => grid('eq', 10, 6, [
    ar([1, 1], [3, 2], 'y'), vl(mid([1, 1], [3, 2]), 'a', 'y', -10, -26),
    ar([1, 3], [5, 5], 'w', 'vp'), vl(mid([1, 3], [5, 5]), 'p', 'w', -12, -26),
    ar([9, 5], [7, 4], 'w', 'vq'), vl(mid([9, 5], [7, 4]), 'q', 'w', -12, -26),
    ar([7, 1], [9, 2], 'w', 'vr'), vl(mid([7, 1], [9, 2]), 'r', 'w', -12, -26, 'lr'),
    ar([4, 1], [5, 3], 'w', 'vs'), vl(mid([4, 1], [5, 3]), 's', 'w', 22, 4)
  ], 680);
  // 和・差の図：始点 (1,1)、a=(3,1)、b=(1,2)
  const S0 = [1, 1], SA = [4, 2], SB = [2, 3], SC = [5, 4];
  const sumFig = () => grid('sum', 7, 5, [
    ar(S0, SA, 'y'), vl(mid(S0, SA), 'a', 'y', 10, 22),
    ar(SA, SC, 'b'), vl(mid(SA, SC), 'b', 'b', 22, 0),
    ar(S0, SC, 'p', 'vab')
  ].concat(vx([3.0, 2.5], PLUS, 'p', 44, 22)), 640);
  const diffFig = () => grid('dif', 7, 5, [
    ar(S0, SA, 'y'), vl(mid(S0, SA), 'a', 'y', 10, 22),
    ar(S0, SB, 'b'), vl(mid(S0, SB), 'b', 'b', -22, 0),
    ar(SB, SA, 'p', 'vamb'),
    { k: 'pt', at: S0, name: 'O', dir: 'sw', r: 4, size: 24 }
  ].concat(vx(mid(SB, SA), MINUS, 'p', 36, -24)), 640);
  // 実数倍の図：a=(2,1)
  const mulFig = () => grid('mul', 10, 5, [
    ar([1, 1], [3, 2], 'y'), vl(mid([1, 1], [3, 2]), 'a', 'y', -8, -24),
    ar([4, 1], [8, 3], 'b'),
    ar([4, 4.5], [2, 3.5], 'p')
  ].concat(vx(mid([4, 1], [8, 3]), [['2', false, -8], ['a', true, 8]], 'b', -12, -28), vx(mid([4, 4.5], [2, 3.5]), [['−', false, -9], ['a', true, 9]], 'p', 12, 26)), 700);
  // 分解の図：O(2,1)、a=(2,1)、b=(−1,2)、p=(3,4)=2a+b
  const D0 = [2, 1];
  const decFig = () => grid('dec', 7, 6, [
    ar(D0, [4, 2], 'y'), vl([3, 1.5], 'a', 'y', 6, 24),
    ar(D0, [1, 3], 'b'), vl([1.5, 2], 'b', 'b', -24, 0),
    ar(D0, [5, 5], 'p', 'vpp'), vl([3.5, 3], 'p', 'p', -20, -14),
    { k: 'pt', at: D0, name: 'O', dir: 's', r: 4, size: 24 }
  ], 600);
  // 平行四辺形 ABCD（A(0,0) B(4,0) D(1,2.4) C(5,2.4)）、M＝CD の中点、E＝BC を 1:2 に分ける点
  const PA = [0, 0], PB = [4, 0], PD = [1, 2.4], PC = [5, 2.4], PM = [3, 2.4], PE = [4 + 1 / 3, 0.8];
  const pgFig = () => ({ t: 'fig', id: 'pg', col: 1, view: [-0.6, -0.7, 5.8, 3.2], w: 680, h: 414, items: [
    { k: 'poly', pts: [PA, PB, PC, PD], close: true, c: 'd', wd: 2.5 },
    ar(PA, PB, 'y'), vl([2, 0], 'a', 'y', 0, 24), ar(PA, PD, 'b'), vl([0.5, 1.2], 'b', 'b', -22, 0),
    { k: 'pt', at: PA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: PB, name: 'B', dir: 'se', r: 4 },
    { k: 'pt', at: PC, name: 'C', dir: 'ne', r: 4 }, { k: 'pt', at: PD, name: 'D', dir: 'nw', r: 4 },
    { k: 'pt', at: PM, name: 'M', dir: 'n', r: 5, c: 'p' }
  ] });

  HB.lesson({
    id: 'mc1-01', field: '数学C　ベクトル', title: 'ベクトルとその演算', level: '平面上のベクトル', time: '目安 8分',
    noDec: true,   // 分数はベクトルの係数ばかりなので、小数をそえない
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\overrightarrow{\\mathrm{AB}}-\\overrightarrow{\\mathrm{CB}}$ を1つのベクトルで表せ。', '(2)　$2(\\vec{a}+3\\vec{b})-3(\\vec{a}-\\vec{b})$ を計算せよ。',
        '(3)　$3\\vec{x}-\\vec{a}=\\vec{x}+5\\vec{b}$ をみたす $\\vec{x}$ を $\\vec{a},\\ \\vec{b}$ で表せ。',
        '(4)　平行四辺形 ABCD で $\\overrightarrow{\\mathrm{AB}}=\\vec{a},\\ \\overrightarrow{\\mathrm{AD}}=\\vec{b}$ とする。辺 CD の中点を M、辺 BC を $1:2$ に分ける点を E とするとき、$\\overrightarrow{\\mathrm{AM}}$、$\\overrightarrow{\\mathrm{DE}}$ を $\\vec{a},\\ \\vec{b}$ で表せ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: 'ここから数学C。**向きと大きさをもつ量**、ベクトルを学びます。物理で、力や速度を矢印で表しましたね。あの矢印を数学として整理します。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: 'ベクトルを矢印（有向線分）で表し、**等しいベクトル** を見分けられる\nベクトルの **和・差・実数倍** を図でかき、計算できる' }] },

      // ---------- 有向線分とベクトル ----------
      { clear: true, part: '有向線分とベクトル', say: '向きをつけた線分を **有向線分** といいます。A を **始点**、B を **終点** として、A から B へ矢印をかきます。',
        add: [{ t: 'h', text: '有向線分とベクトル' },
          { t: 'p', size: 'sm', text: '有向線分 AB：始点 A から 終点 B へ\n**向き** と **長さ** をもつ線分' },
          { t: 'fig', id: 'dl', col: 1, view: [-0.5, -0.9, 5.5, 2.4], w: 560, h: 308, items: [
            ar([0.4, 0.2], [4.6, 1.6], 'y'),
            { k: 'pt', at: [0.4, 0.2], name: 'A（始点）', dir: 's', r: 5, size: 24 }, { k: 'pt', at: [4.6, 1.6], name: 'B（終点）', dir: 'n', r: 5, size: 24 }] }] },
      { say: '有向線分の **位置は問題にせず、向きと大きさだけ** に目をつけたものを **ベクトル** といいます。$\\overrightarrow{\\mathrm{AB}}$ や $\\vec{a}$ と書きます。',
        add: [{ t: 'box', c: 'b', label: 'ベクトル', text: '向きと大きさだけをもつ量　$\\overrightarrow{\\mathrm{AB}}$、$\\vec{a}$\n大きさ　$|\\overrightarrow{\\mathrm{AB}}|$ … 線分 AB の長さ' }] },

      // ---------- 相等 ----------
      { clear: true, part: 'ベクトルの相等', say: '**向きが同じで大きさも等しい** 2つのベクトルは、位置がちがっても **等しい** といいます。平行移動して重なれば等しい、ということです。',
        add: [{ t: 'h', text: 'ベクトルの相等' },
          { t: 'box', c: 'y', label: '等しい', text: '$\\vec{a}=\\vec{b}$ … 向きも大きさも同じ\n（平行移動して重なる）' },
          { t: 'p', size: 'sm', text: '右の図は方眼。$\\vec{a}$ は「右へ 2、上へ 1」の矢印' },
          eqFig()] },
      { ask: { type: 'choice', q: '右の図で、$\\vec{a}$ と **等しい** ベクトルは？',
        opts: ['$\\vec{p}$', '$\\vec{q}$', '$\\vec{r}$', '$\\vec{s}$'], ok: 2,
        why: { 0: '$\\vec{p}$ は向きは同じですが、大きさが2倍です（右へ 4、上へ 2）。', 1: '$\\vec{q}$ は大きさは同じですが、向きが反対です。', 3: '$\\vec{s}$ は右へ 1、上へ 2。向きがちがいます。' },
        good: '$\\vec{r}$ も「右へ 2、上へ 1」。平行移動すると $\\vec{a}$ に重なります。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec{r}=\\vec{a},\\qquad \\vec{q}=-\\vec{a},\\qquad \\vec{p}=2\\vec{a}', note: '$-\\vec{a}$・$2\\vec{a}$ はこのあと' }] } },

      // ---------- 逆ベクトル・零ベクトル ----------
      { clear: true, part: '逆ベクトル・零ベクトル', say: '大きさが同じで **向きが反対** のベクトルが **逆ベクトル** $-\\vec{a}$。始点と終点が同じ $\\overrightarrow{\\mathrm{AA}}$ は、大きさ 0 の **零ベクトル** $\\vec{0}$ です。',
        add: [{ t: 'h', text: '逆ベクトル・零ベクトル' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{BA}}=-\\overrightarrow{\\mathrm{AB}}', note: '向きが反対\n大きさは同じ' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AA}}=\\vec{0},\\qquad |\\vec{0}|=0', note: '零ベクトルの\n向きは考えない' },
          { t: 'fig', id: 'inv', col: 1, view: [-0.5, -0.8, 5.5, 2.8], w: 540, h: 324, items: [
            ar([0.3, 1.9], [3.5, 1.9], 'y'), { k: 'label', at: [1.9, 1.9], text: 'AB', c: 'y', vec: true, size: 26, dy: -24 },
            { k: 'pt', at: [0.3, 1.9], name: 'A', dir: 'w', r: 4 }, { k: 'pt', at: [3.5, 1.9], name: 'B', dir: 'e', r: 4 },
            ar([4.5, 0.2], [1.3, 0.2], 'p'), { k: 'label', at: [2.9, 0.2], text: 'BA', c: 'p', vec: true, size: 26, dy: -24 },
            { k: 'pt', at: [4.5, 0.2], name: 'B', dir: 'e', r: 4 }, { k: 'pt', at: [1.3, 0.2], name: 'A', dir: 'w', r: 4 }] }] },

      // ---------- 和 ----------
      { clear: true, part: 'ベクトルの和', say: '$\\vec{a}$ の終点に $\\vec{b}$ の始点をつなぐと、$\\vec{a}$ の始点から $\\vec{b}$ の終点への矢印ができます。これが **和** $\\vec{a}+\\vec{b}$ です。',
        add: [{ t: 'h', text: 'ベクトルの和' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}+\\overrightarrow{\\mathrm{BC}}=\\overrightarrow{\\mathrm{AC}}', note: 'B でつなぐ' },
          sumFig()] },
      { say: '始点をそろえて $\\vec{a},\\ \\vec{b}$ を2辺とする **平行四辺形** をつくると、その対角線も $\\vec{a}+\\vec{b}$。だから $\\vec{a}+\\vec{b}=\\vec{b}+\\vec{a}$ です。',
        add: [{ t: 'm', tex: '\\vec{a}+\\vec{b}=\\vec{b}+\\vec{a}', note: '交換法則' },
          { t: 'p', size: 'sm', text: '結合法則 $(\\vec{a}+\\vec{b})+\\vec{c}=\\vec{a}+(\\vec{b}+\\vec{c})$ も成り立つ' }],
        draw: [{ fig: 'sum', items: [{ k: 'vec', a: S0, b: SB, c: 'b', dash: true, wd: 2.5 }, { k: 'vec', a: SB, b: SC, c: 'y', dash: true, wd: 2.5 }] }] },

      // ---------- 差 ----------
      { clear: true, part: 'ベクトルの差', say: '$\\vec{a}-\\vec{b}$ は $\\vec{a}+(-\\vec{b})$ のこと。始点をそろえてかくと、**$\\vec{b}$ の終点から $\\vec{a}$ の終点へ** の矢印になります。',
        add: [{ t: 'h', text: 'ベクトルの差' },
          { t: 'm', tex: '\\vec{a}-\\vec{b}=\\vec{a}+(-\\vec{b})' },
          { t: 'box', c: 'y', label: '始点をそろえた差', tex: '\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OA}}=\\overrightarrow{\\mathrm{AB}}' },
          { t: 'p', size: 'sm', text: '（終点の側）−（始点の側）と覚える' },
          diffFig()] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AB}}-\\overrightarrow{\\mathrm{CB}}$ を1つのベクトルで表すと？',
        opts: ['$\\overrightarrow{\\mathrm{CA}}$', '$\\overrightarrow{\\mathrm{AC}}$', '$\\overrightarrow{\\mathrm{BC}}$', '$\\vec{0}$'], ok: 1,
        why: { 0: '$-\\overrightarrow{\\mathrm{CB}}=\\overrightarrow{\\mathrm{BC}}$ です。A → B → C とつながるので、A から C へ。', 2: '$\\overrightarrow{\\mathrm{AB}}$ が消えています。$\\overrightarrow{\\mathrm{AB}}+\\overrightarrow{\\mathrm{BC}}$ とつなぎます。', 3: 'B どうしが消えるのではありません。$-\\overrightarrow{\\mathrm{CB}}$ を $\\overrightarrow{\\mathrm{BC}}$ に直してつなぎます。' },
        good: '逆ベクトルに直してつなぐと、A → B → C で $\\overrightarrow{\\mathrm{AC}}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}-\\overrightarrow{\\mathrm{CB}}=\\overrightarrow{\\mathrm{AB}}+\\overrightarrow{\\mathrm{BC}}=\\overrightarrow{\\mathrm{AC}}' }] } },

      // ---------- 実数倍 ----------
      { clear: true, part: 'ベクトルの実数倍', say: '実数 $k$ に対して $k\\vec{a}$ は、$k>0$ なら $\\vec{a}$ と **同じ向き**、$k<0$ なら **反対向き** で、大きさは $|k|$ 倍。$0\\vec{a}=\\vec{0}$ です。',
        add: [{ t: 'h', text: 'ベクトルの実数倍 $k\\vec{a}$' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['$k$', '$k\\vec{a}$ の向き', '大きさ'], ['$k>0$', '$\\vec{a}$ と同じ', '$k|\\vec{a}|$'], ['$k<0$', '$\\vec{a}$ と反対', '$|k||\\vec{a}|$'], ['$k=0$', '（$\\vec{0}$）', '$0$']] },
          mulFig()] },
      { say: '$\\vec{a}$、$\\vec{b}$ が $\\vec{0}$ でないとき、**$\\vec{a}\\parallel\\vec{b}\\iff\\vec{b}=k\\vec{a}$ となる実数 $k$ がある**。この平行の条件は、これから何度も使います。',
        add: [{ t: 'box', c: 'p', label: '平行の条件', tex: '\\vec{a}\\parallel\\vec{b}\\iff \\vec{b}=k\\vec{a}\\ \\ (k\\text{ は実数})' }] },

      // ---------- 計算 ----------
      { clear: true, part: '計算の法則', say: 'ベクトルの和・差・実数倍は、**文字式と同じように** 計算できます。かっこをはずして、$\\vec{a}$ どうし、$\\vec{b}$ どうしをまとめます。',
        add: [{ t: 'h', text: '計算の法則' },
          { t: 'p', size: 'sm', text: '$k(\\vec{a}+\\vec{b})=k\\vec{a}+k\\vec{b}$、$(k+l)\\vec{a}=k\\vec{a}+l\\vec{a}$、$k(l\\vec{a})=(kl)\\vec{a}$' },
          { t: 'm', tex: '2(\\vec{a}+3\\vec{b})-3(\\vec{a}-\\vec{b})' }] },
      { ask: { type: 'choice', q: '$2(\\vec{a}+3\\vec{b})-3(\\vec{a}-\\vec{b})$ を計算すると？',
        opts: ['$-\\vec{a}+9\\vec{b}$', '$-\\vec{a}+3\\vec{b}$', '$-\\vec{a}+7\\vec{b}$', '$5\\vec{a}+9\\vec{b}$'], ok: 0,
        why: { 1: '$-3\\times(-\\vec{b})=+3\\vec{b}$ です。符号に注意。', 2: '$-3$ を $-\\vec{b}$ にかけ忘れています（$+\\vec{b}$ ではなく $+3\\vec{b}$）。', 3: '$2\\vec{a}-3\\vec{a}$ のひき算が、たし算になっています。' },
        good: '$2\\vec{a}+6\\vec{b}-3\\vec{a}+3\\vec{b}=-\\vec{a}+9\\vec{b}$。',
        add: [{ t: 'm', tex: '\\begin{aligned}&=2\\vec{a}+6\\vec{b}-3\\vec{a}+3\\vec{b}\\\\ &=-\\vec{a}+9\\vec{b}\\end{aligned}' }] } },
      { ask: { type: 'think', q: '$3\\vec{x}-\\vec{a}=\\vec{x}+5\\vec{b}$ をみたす $\\vec{x}$ を、$\\vec{a},\\ \\vec{b}$ で表そう。',
        hint: '1次方程式と同じように、$\\vec{x}$ を左辺に、$\\vec{a}$ を右辺に集める。',
        ans: '$2\\vec{x}=\\vec{a}+5\\vec{b}$ より　$\\vec{x}=\\dfrac12\\vec{a}+\\dfrac52\\vec{b}$',
        add: [{ t: 'm', size: 'sm', tex: '3\\vec{x}-\\vec{x}=\\vec{a}+5\\vec{b}\\quad\\therefore\\ \\vec{x}=\\frac12\\vec{a}+\\frac52\\vec{b}' }] } },

      // ---------- 分解 ----------
      { clear: true, part: 'ベクトルの分解', say: '$\\vec{a},\\ \\vec{b}$ が $\\vec{0}$ でなく、平行でもないとき、平面上のどんなベクトル $\\vec{p}$ も、$s\\vec{a}+t\\vec{b}$ の形に **ただ1通り** に表せます。',
        add: [{ t: 'h', text: 'ベクトルの分解' },
          { t: 'box', c: 'b', label: '分解', tex: '\\vec{p}=s\\vec{a}+t\\vec{b}\\quad(s,\\ t\\text{ は実数・ただ1通り})' },
          { t: 'p', size: 'sm', text: '条件：$\\vec{a}\\neq\\vec{0},\\ \\vec{b}\\neq\\vec{0},\\ \\vec{a}\\not\\parallel\\vec{b}$' },
          decFig()] },
      { say: '図の $\\vec{p}$ は、$\\vec{a}$ の向きに 2つ分進み、そこから $\\vec{b}$ の向きに 1つ分進んだ所。だから $\\vec{p}=2\\vec{a}+\\vec{b}$ です。',
        add: [{ t: 'm', tex: '\\vec{p}=2\\vec{a}+\\vec{b}', note: '$s=2,\\ t=1$' }],
        draw: [{ fig: 'dec', items: [{ k: 'vec', a: [4, 2], b: [6, 3], c: 'y', dash: true, wd: 3 }, { k: 'vec', a: [6, 3], b: [5, 5], c: 'b', dash: true, wd: 3 }, ].concat(vx([5.4, 2.5], [['2', false, -8], ['a', true, 8]], 'y', 18, 22)) }] },

      // ---------- 図形の中のベクトル ----------
      { clear: true, part: '図形の中のベクトル', say: '平行四辺形 ABCD で $\\overrightarrow{\\mathrm{AB}}=\\vec{a},\\ \\overrightarrow{\\mathrm{AD}}=\\vec{b}$ とします。$\\overrightarrow{\\mathrm{DC}}=\\vec{a}$、$\\overrightarrow{\\mathrm{BC}}=\\vec{b}$ にも注目。辺 CD の中点を M とします。',
        add: [{ t: 'h', text: '平行四辺形 ABCD' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{DC}}=\\overrightarrow{\\mathrm{AB}}=\\vec{a},\\qquad \\overrightarrow{\\mathrm{BC}}=\\overrightarrow{\\mathrm{AD}}=\\vec{b}', note: '向かい合う辺' },
          pgFig()] },
      { ask: { type: 'choice', q: '辺 CD の中点を M とする。$\\overrightarrow{\\mathrm{AM}}$ は？',
        opts: ['$\\vec{a}+\\dfrac12\\vec{b}$', '$\\dfrac12(\\vec{a}+\\vec{b})$', '$\\vec{b}-\\dfrac12\\vec{a}$', '$\\dfrac12\\vec{a}+\\vec{b}$'], ok: 3,
        why: { 0: '$\\vec{a}$ と $\\vec{b}$ の役割が逆です。A から D へ進むのが $\\vec{b}$。', 1: 'それは対角線 AC の中点です。', 2: '$\\overrightarrow{\\mathrm{DM}}$ は $\\overrightarrow{\\mathrm{DC}}=\\vec{a}$ と同じ向きなので、＋です。' },
        good: 'A → D → M と進む：$\\overrightarrow{\\mathrm{AM}}=\\overrightarrow{\\mathrm{AD}}+\\overrightarrow{\\mathrm{DM}}=\\vec{b}+\\dfrac12\\vec{a}$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AM}}=\\overrightarrow{\\mathrm{AD}}+\\overrightarrow{\\mathrm{DM}}=\\frac12\\vec{a}+\\vec{b}' }],
        draw: [{ fig: 'pg', items: [{ k: 'vec', a: PA, b: PM, c: 'p', wd: 3.5 }] }] } },
      { ask: { type: 'think', q: '辺 BC を BE : EC $=1:2$ に分ける点を E とする。$\\overrightarrow{\\mathrm{DE}}$ を $\\vec{a},\\ \\vec{b}$ で表そう。',
        hint: 'まず $\\overrightarrow{\\mathrm{AE}}=\\vec{a}+\\frac13\\vec{b}$。始点を A にそろえて $\\overrightarrow{\\mathrm{DE}}=\\overrightarrow{\\mathrm{AE}}-\\overrightarrow{\\mathrm{AD}}$。',
        ans: '$\\overrightarrow{\\mathrm{DE}}=\\left(\\vec{a}+\\dfrac13\\vec{b}\\right)-\\vec{b}=\\vec{a}-\\dfrac23\\vec{b}$',
        after: '「始点をそろえて、（終点の側）−（始点の側）」。このあと学ぶ位置ベクトルで、この考え方が主役になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DE}}=\\overrightarrow{\\mathrm{AE}}-\\overrightarrow{\\mathrm{AD}}=\\vec{a}-\\frac23\\vec{b}' }],
        draw: [{ fig: 'pg', items: [{ k: 'pt', at: PE, name: 'E', dir: 'e', r: 5, c: 'g' }, { k: 'vec', a: PD, b: PE, c: 'g', wd: 3.5 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、ベクトルを座標の数の組で表す **成分** を学び、計算を数でできるようにします。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
