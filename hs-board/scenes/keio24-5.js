/* 2024 慶應 理工 第5問の類題（自作）：円の外側を転がる円の周上の点（複素数で表す）・道のりと時間の比の極限（全部空欄）
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題。内側ではなく外側を転がす。半径 3 の円のまわりを半径 2 の円）。
   答えは python3（sympy で速さの式、scipy の数値積分で道のり）で検算ずみ。
   接点は C 上を長さ 6t 動く → Q の偏角 2t、K 上の弧 6t → 自転 3t、QP の向きは π+2t+3t
   (1) ア P が再び C 上：6t=4π（K の周の長さ）→ t=2π/3。C 上の位置は偏角 4πk/3 → イ もとの 3 にもどるのは k=3 で t=2π（Q も 6·2π=2 周で 5 に）
       t=π では Q はもどるが P=7（いちばん遠い所）
   (2) ウ w=5(cos2t+i sin2t)　エ z=w−2(cos5t+i sin5t)（t=2π/3 で z=3(cos4π/3+i sin4π/3)、|z|=3）
   (3) x'=−10sin2t+10sin5t、y'=10cos2t−10cos5t、x'²+y'²=200(1−cos3t)=400sin²(3t/2)
       速さ 20|sin(3t/2)|、オ ∫₀^{2π/3}20sin(3t/2)dt=(40/3)·2=80/3（1周期ぶん）。0≦t≦2π で 80
   (4) 2πk/3≦T<2π(k+1)/3 で (80/3)k≦L(T)≦(80/3)(k+1) → カ 40/π（はさみうち）。Q の速さ 10、平均 40/π≒12.7 */
(function () {
  const PI = Math.PI, T0 = 0.45;
  const W = t => [5 * Math.cos(2 * t), 5 * Math.sin(2 * t)];
  const Z = t => [5 * Math.cos(2 * t) - 2 * Math.cos(5 * t), 5 * Math.sin(2 * t) - 2 * Math.sin(5 * t)];
  const XS = '5*cos(2*t)-2*cos(5*t)', YS = '5*sin(2*t)-2*sin(5*t)';
  const AX = { k: 'axes', tx: [[3, '3'], [5, '5']], ty: [], xl: '実軸', yl: '虚軸' };
  const CC = { k: 'circle', o: [0, 0], r: 3, c: 'w', wd: 2.5 };
  const plane = (id, items, view, w) => { const v = view || [-7.8, -7.8, 7.8, 7.8], ww = w || 440; return { t: 'fig', id, col: 1, view: v, w: ww, h: Math.round(ww * (v[3] - v[1]) / (v[2] - v[0])), items: [AX, CC, { k: 'label', at: [-1.1, -1.7], text: 'C', size: 24 }].concat(items || []) }; };
  const snap = (t, c) => { const q = W(t), p = Z(t), tc = [3 * Math.cos(2 * t), 3 * Math.sin(2 * t)];
    return [{ k: 'circle', o: q, r: 2, c: c || 'b', wd: 2.5 }, { k: 'seg', a: q, b: p, c: 'p', wd: 2.5 }, { k: 'pt', at: q, name: 'Q', dir: 'ne', c: c || 'b', size: 22 },
      { k: 'pt', at: p, name: 'P', dir: 'nw', c: 'p', size: 22 }, { k: 'dot', at: tc, c: 'y' }]; };
  const ZOOM = [-1.5, -1.6, 7.8, 6.2];
  const POINTS = [
    '「すべらずに転がる」＝ **接点が動いた弧の長さが、両方の円で等しい**。弧 ÷ 半径 で、中心の回転（公転）と円そのものの回転（自転）が出る',
    '点の位置は「中心＋半径 ×（向き）」。向きの角は **公転＋自転**（外側を転がると足し算）。式ができたら、$t=0$ や C 上にくる時刻で検算',
    '道のりは $\\int\\sqrt{(x\')^2+(y\')^2}\\,dt$。三角関数の差は $1-\\cos\\theta=2\\sin^2\\frac{\\theta}{2}$ でまとめて根号をはずす。長い時間の比は **1周期ごとにはさむ**'
  ];

  HB.lesson({
    id: 'keio24-5', field: '慶應型　数学（理工）', title: '2024 慶應 理工 第5問の類題 ― 外側を転がる円の点の道のりと、時間との比の極限', level: '2024年度 慶應義塾大学 理工学部 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$i$ を虚数単位とする。複素数平面上に、原点 O を中心とする半径 $3$ の円 $C$ がある。半径 $2$ の円 $K$ が、$C$ に外側から接しながら、すべることなく $C$ のまわりを反時計まわりに転がる。$K$ の中心を Q とし、$K$ の周上に固定した点を P とする。時刻 $t=0$ では、Q は点 $5$ に、P は $C$ と $K$ の接点 $3$ にある。また、時刻 $t$ までに、$C$ と $K$ の接点は $C$ 上を長さ $6t$ の弧だけ動くものとする。次の空欄にあてはまる数または式を答えよ。',
      parts: [
        '(1)　$t>0$ で、P がはじめて再び $C$ 上にくる時刻は $t=\\boxed{\\text{ア}}$ である。また、P と Q がともに時刻 $0$ と同じ位置にもどる最初の時刻（$t>0$）は $t=\\boxed{\\text{イ}}$ である。',
        '(2)　時刻 $t$ における Q，P を表す複素数をそれぞれ $w(t)$，$z(t)$ とすると\n　$w(t)=5\\left(\\cos\\boxed{\\text{ウ}}+i\\sin\\boxed{\\text{ウ}}\\right)$，$z(t)=w(t)-2\\left(\\cos\\boxed{\\text{エ}}+i\\sin\\boxed{\\text{エ}}\\right)$\nである。',
        '(3)　$0\\le t\\le\\boxed{\\text{ア}}$ の間に P が動く道のりは $\\boxed{\\text{オ}}$ である。',
        '(4)　$T>0$ に対し、$0\\le t\\le T$ の間に P が動く道のりを $L(T)$ とすると、$\\displaystyle\\lim_{T\\to\\infty}\\frac{L(T)}{T}=\\boxed{\\text{カ}}$ である。'
      ],
      src: '※ 2024年度 慶應義塾大学 理工学部 一般選抜 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { clear: true, cols: [1], part: '問題', say: '円の外側を、別の円がすべらずに転がる問題です。全部が空欄。まず問題文を読んで、動きを頭の中で想像しましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:22px;line-height:1.55' }] },
      { clear: true, part: '見通し', say: '右の図は、少し転がったところ。黄色の点が接点、桃色の線分 QP が K に固定した半径です。P は「回りながら進む」ので、曲線をえがきます。',
        add: [{ t: 'h', text: '動きのイメージ' },
          { t: 'box', c: 'y', size: 'sm', label: 'すべらない', text: '接点が $C$ 上を動いた弧の長さ $6t$\n＝ 接点が $K$ 上を動いた弧の長さ $6t$' },
          { t: 'p', size: 'sm', text: '弧の長さ ÷ 半径 ＝ 回った角（弧度法）' },
          plane('c1', [{ k: 'circle', o: [5, 0], r: 2, c: 'd', wd: 2, dash: true }, { k: 'param', x: XS, y: YS, a: 0, b: T0, c: 'p', wd: 2 }].concat(snap(T0)), ZOOM, 450)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P がふたたび $C$ に触れるのは、接点が $K$ をちょうど1周したとき。$K$ の周の長さは $2\\pi\\cdot2=4\\pi$ です。',
        add: [{ t: 'h', text: '(1)　P が再び C 上にくる時刻' },
          { t: 'm', tex: '6t=4\\pi', note: '$K$ 上の弧＝$K$ の周' }] },
      { ask: { type: 'choice', q: 'P がはじめて再び $C$ 上にくる時刻（ア）は？',
        opts: ['$\\dfrac{\\pi}{3}$', '$\\dfrac{2\\pi}{3}$', '$\\pi$', '$\\dfrac{4\\pi}{3}$'], ok: 1,
        why: { 0: '$K$ の周を $2\\pi$（半径 1 の円）にしています。半径 2 なので $4\\pi$。', 2: '$6t=6\\pi$ は、接点が $C$ を1周する時刻（Q がもどる時刻）です。', 3: '2 回目に $C$ 上にくる時刻です。' },
        good: '$t=\\dfrac{4\\pi}{6}=\\dfrac{2\\pi}{3}$。このとき接点は $C$ 上を $4\\pi$ 動いたので、P は偏角 $\\dfrac{4\\pi}{3}$ の点 $3\\left(\\cos\\frac{4\\pi}3+i\\sin\\frac{4\\pi}3\\right)$ にあります。',
        add: [{ t: 'ans', label: 'ア', tex: 't=\\frac{2\\pi}{3}' }] } },
      { say: 'Q がもどるのは接点が $C$ を1周（$6t=6\\pi$）する $t=\\pi$。でもこのとき P は1周半回っていて、いちばん外の点 $7$ にいます。P が $C$ 上にくるのは偏角 $\\frac{4\\pi}3,\\ \\frac{8\\pi}3,\\ 4\\pi,\\ \\cdots$ の所です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['時刻 $t$', '$\\frac{2\\pi}3$', '$\\pi$', '$\\frac{4\\pi}3$', '$2\\pi$'], ['Q の偏角', '$\\frac{4\\pi}3$', '$2\\pi$', '$\\frac{8\\pi}3$', '$4\\pi$'], ['P', '$C$ 上', '点 $7$', '$C$ 上', '点 $3$']] },
          { t: 'ans', label: 'イ', tex: 't=2\\pi' },
          plane('c2', [{ k: 'param', x: XS, y: YS, a: 0, b: 2 * PI, c: 'p', wd: 2, n: 600 },
            { k: 'pt', at: Z(2 * PI / 3), c: 'y', name: 't=2π/3', dir: 'sw', size: 19 }, { k: 'pt', at: Z(4 * PI / 3), c: 'y', name: 't=4π/3', dir: 'nw', size: 19 },
            { k: 'pt', at: [3, 0], c: 'g' }, { k: 'label', at: [1.75, 0.6], text: 't=0, 2π', size: 19, c: 'g' }, { k: 'pt', at: [7, 0], c: 'b' }, { k: 'label', at: [7, -1.2], text: 't=π', size: 19, c: 'b' }], null, 420)] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。接点は $C$ 上を弧 $6t$ 動くので、偏角は $\\frac{6t}{3}=2t$。Q は接点と同じ向きで、原点からの距離は $3+2=5$。よって $w(t)=5(\\cos2t+i\\sin2t)$（ウ $=2t$）。',
        add: [{ t: 'h', text: '(2)　Q と P を複素数で表す' },
          { t: 'm', tex: 'w(t)=5(\\cos2t+i\\sin2t)', note: '公転の角 $2t$' },
          plane('c3', [{ k: 'circle', o: [5, 0], r: 2, c: 'd', wd: 2, dash: true }, { k: 'param', x: XS, y: YS, a: 0, b: T0, c: 'p', wd: 2 },
            { k: 'seg', a: [0, 0], b: W(T0), c: 'b', wd: 1.5, dash: true }, { k: 'arc', o: [0, 0], rp: 34, a1: 0, a2: 2 * T0 * 180 / PI, c: 'b', label: '2t' }].concat(snap(T0)), ZOOM, 450)] },
      { say: '次は $\\overrightarrow{\\mathrm{QP}}$ の向き。はじめ（$t=0$）は Q から見て左向き、つまり偏角 $\\pi$。そこから「公転の $2t$」と「自転」の分だけ回ります。',
        add: [{ t: 'm', tex: 'z(t)=w(t)+2\\{\\cos(\\pi+\\theta)+i\\sin(\\pi+\\theta)\\}', note: '$\\theta$＝回った角' },
          { t: 'p', size: 'sm', text: '自転：$K$ 上の弧 $6t$ ÷ 半径 $2$ ＝ $3t$' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{QP}}$ が回った角 $\\theta$（＝エ）は？',
        opts: ['$3t$', '$t$', '$6t$', '$5t$'], ok: 3,
        why: { 0: '自転の $3t$ だけです。$K$ 全体も O のまわりを $2t$ 回っている（公転）ので、たします。', 1: '$3t-2t$ は、円の **内側** を転がるときの引き算。外側では同じ向きに回るので足し算です。', 2: '$6t$ は弧の長さ。角は弧 ÷ 半径です。' },
        good: '公転 $2t$ ＋ 自転 $3t$ ＝ $5t$。$\\cos(\\pi+5t)=-\\cos5t$ などから　$z(t)=w(t)-2(\\cos5t+i\\sin5t)$。',
        add: [{ t: 'ans', label: 'ウ・エ', tex: 'z(t)=5(\\cos2t+i\\sin2t)-2(\\cos5t+i\\sin5t)' }] } },
      { ask: { type: 'think', q: '検算：$t=\\dfrac{2\\pi}{3}$ を入れて、$|z|=3$（P が $C$ 上）になることを確かめよう。',
        hint: '$5t=\\dfrac{10\\pi}{3}=\\dfrac{4\\pi}{3}+2\\pi$。',
        ans: '$z=5\\left(\\cos\\frac{4\\pi}3+i\\sin\\frac{4\\pi}3\\right)-2\\left(\\cos\\frac{4\\pi}3+i\\sin\\frac{4\\pi}3\\right)=3\\left(\\cos\\frac{4\\pi}3+i\\sin\\frac{4\\pi}3\\right)$。$|z|=3$',
        after: '(1) の答え ア と、(2) の式がかみ合いました。$t=0$ でも $z=5-2=3$ です。空欄はこうして答えどうしで確かめます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$z(t)=x(t)+iy(t)$ として、道のりは $\\int\\sqrt{(x\')^2+(y\')^2}\\,dt$。まず微分します。',
        add: [{ t: 'h', text: '(3)　1周期ぶんの道のり' },
          { t: 'm', size: 'sm', tex: 'x=5\\cos2t-2\\cos5t,\\quad y=5\\sin2t-2\\sin5t' },
          { t: 'm', size: 'sm', tex: "x'=-10\\sin2t+10\\sin5t,\\quad y'=10\\cos2t-10\\cos5t" },
          plane('c4', [{ k: 'param', x: XS, y: YS, a: 0, b: 2 * PI / 3, c: 'p', wd: 3, n: 300 }, { k: 'pt', at: [3, 0], c: 'g' }, { k: 'pt', at: Z(2 * PI / 3), c: 'g' }], null, 420)] },
      { ask: { type: 'choice', q: "$(x')^2+(y')^2$ をまとめると？",
        opts: ['$200(1+\\cos3t)$', '$200(1-\\cos3t)$', '$200(1-\\cos7t)$', '$100(1-\\cos3t)$'], ok: 1,
        why: { 0: '展開すると $-2(\\sin5t\\sin2t+\\cos5t\\cos2t)$ と **引き算** になります。', 2: '$\\cos5t\\cos2t+\\sin5t\\sin2t=\\cos(5t-2t)$。差の角です。', 3: '$\\sin^2+\\cos^2=1$ が2組で $2$。$100\\times2=200$ です。' },
        good: '$100\\{2-2(\\cos5t\\cos2t+\\sin5t\\sin2t)\\}=200(1-\\cos3t)$。加法定理で、差の角 $3t$ にまとまります。',
        add: [{ t: 'm', size: 'sm', tex: "(x')^2+(y')^2=200(1-\\cos3t)=400\\sin^2\\frac{3t}{2}" }] } },
      { say: '半角の公式 $1-\\cos3t=2\\sin^2\\frac{3t}2$ で根号がはずれます。$0\\le t\\le\\frac{2\\pi}3$ では $0\\le\\frac{3t}2\\le\\pi$ なので $\\sin\\frac{3t}2\\ge0$。絶対値もはずれます。',
        add: [{ t: 'm', tex: '\\sqrt{(x\')^2+(y\')^2}=20\\left|\\sin\\frac{3t}{2}\\right|=20\\sin\\frac{3t}{2}' },
          { t: 'm', size: 'sm', tex: '\\int_0^{\\frac{2\\pi}{3}}20\\sin\\frac{3t}{2}\\,dt=20\\cdot\\frac23\\Big[-\\cos\\frac{3t}2\\Big]_0^{\\frac{2\\pi}3}' }] },
      { ask: { type: 'choice', q: '1周期ぶんの道のり（オ）は？',
        opts: ['$\\dfrac{40}{3}$', '$60$', '$\\dfrac{80}{3}$', '$40$'], ok: 2,
        why: { 0: '$\\Big[-\\cos\\frac{3t}2\\Big]_0^{2\\pi/3}=-\\cos\\pi+\\cos0=2$ です。1 にしています。', 1: '$\\sin\\frac{3t}2$ の原始関数は $-\\frac23\\cos\\frac{3t}2$。$\\frac32$ をかけています。', 3: '$\\frac23$ をかけ忘れています。' },
        good: '$\\dfrac{40}3\\cdot\\{1-(-1)\\}=\\dfrac{80}3$。$0\\le t\\le2\\pi$（もとにもどるまで）は、同じ形が3つで $80$。',
        add: [{ t: 'ans', label: 'オ', tex: '\\frac{40}{3}\\{1-(-1)\\}=\\frac{80}{3}' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。速さ $20\\left|\\sin\\frac{3t}2\\right|$ は周期 $\\frac{2\\pi}3$。長い時間 $T$ は「1周期がいくつ入るか」で考えます。',
        add: [{ t: 'h', text: '(4)　道のりと時間の比の極限' },
          { t: 'p', size: 'sm', text: '$k$ を $\\dfrac{2\\pi}{3}k\\le T<\\dfrac{2\\pi}{3}(k+1)$ を満たす整数とする（$k\\ge1$）' },
          { t: 'm', tex: '\\frac{80}{3}k\\le L(T)\\le\\frac{80}{3}(k+1)' },
          { t: 'fig', id: 'v1', col: 1, view: [-0.3, -3, 7.2, 23.5], w: 440, h: 300, items: [
            { k: 'axes', tx: [[2 * PI / 3, '2π/3'], [4 * PI / 3, '4π/3'], [2 * PI, '2π']], ty: [[20, '20']], xl: 't', yl: '速さ' },
            { k: 'area', f: '20*abs(sin(1.5*x))', a: 0, b: 2 * PI / 3, c: 'y', alpha: 0.3, label: '80/3', lat: [1.05, 8] },
            { k: 'fn', f: '20*abs(sin(1.5*x))', a: 0, b: 7, c: 'w', wd: 2.5 }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{T\\to\\infty}\\frac{L(T)}{T}$（カ）は？',
        opts: ['$\\dfrac{80}{3}$', '$20$', '$\\dfrac{40}{\\pi}$', '$\\dfrac{20}{\\pi}$'], ok: 2,
        why: { 0: 'それは1周期の道のり。時間 $\\frac{2\\pi}3$ で割ります。', 1: '20 はいちばん速いときの速さ。平均はそれより小さくなります。', 3: '$|\\sin|$ の平均は $\\frac2\\pi$。$20\\times\\frac2\\pi=\\frac{40}\\pi$ です。' },
        good: '1周期で道のり $\\frac{80}3$、時間 $\\frac{2\\pi}3$。比は $\\frac{80}3\\div\\frac{2\\pi}3=\\frac{40}\\pi$。下のはさみうちで、これが極限になります。' } },
      { say: '辺々を $T$ で割ると、左は $T$ の上の限り、右は下の限りで割って、両側から $\\frac{40}{\\pi}$ にはさまれます。$T\\to\\infty$ のとき $k\\to\\infty$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\frac{80}{3}k}{\\frac{2\\pi}{3}(k+1)}<\\frac{L(T)}{T}\\le\\frac{\\frac{80}{3}(k+1)}{\\frac{2\\pi}{3}k}' },
          { t: 'm', size: 'sm', tex: '\\frac{40}{\\pi}\\cdot\\frac{k}{k+1}<\\frac{L(T)}{T}\\le\\frac{40}{\\pi}\\cdot\\frac{k+1}{k}\\ \\longrightarrow\\ \\frac{40}{\\pi}' },
          { t: 'ans', label: 'カ', tex: '\\lim_{T\\to\\infty}\\frac{L(T)}{T}=\\frac{40}{\\pi}' }] },
      { ask: { type: 'think', q: '中心 Q の速さとくらべよう。Q は時間あたりどれだけ動く？　P の平均の速さ $\\frac{40}{\\pi}\\fallingdotseq12.7$ とどちらが大きい？',
        hint: 'Q は半径 5 の円の上を、偏角 $2t$ で動く。',
        ans: 'Q の速さは $5\\times2=10$（一定）。P の平均 $\\frac{40}{\\pi}\\fallingdotseq12.7$ の方が大きい',
        after: 'P は接点の所で一瞬止まり（速さ 0）、外側では最大 20 で走ります。止まる時間があっても、平均すると中心より速いのです。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「弧の長さが等しい」から角を出し、複素数で位置を書き、半角の公式で道のり、周期ではさんで極限。この流れは転がる円の問題に共通です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
