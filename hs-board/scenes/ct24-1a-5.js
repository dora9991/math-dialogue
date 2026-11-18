/* 2024 共通テスト 数学Ⅰ・A 第5問の類題（自作）：円と三角形で、方べきの定理とメネラウスの定理をくり返し使う
   △ABC、AB=8、AC=6、AD=3（D は辺 AB 上）、B・C・D を通る円 O と辺 AC の交点 E、P＝BE∩CD、F＝AP∩BC
   答え（python3・座標で検算ずみ。(1)〜(4) は ∠A によらない）：
   (1) AE=4　(2) BP/PE=5、CP/PD=4/5　(3) BF/FC=10/3、AP/PF=13/5　(4) BE:CD=4:3
   (5) CD=3√3 → BE=4√3、BD・BA=40、BP・BE=(5/6)(4√3)²=40 → A,D,P,E は同一円周上（⓪）
       △ABE∽△ACD より ∠AEB=∠ADC、和が 180° なので 90°。P は垂心で AF⊥BC（②）。（このとき ∠A=60°） */
(function () {
  const POINTS = [
    '**方べきの定理**：円の外の点から AD・AB＝AE・AC、円の中の点（弦の交点）なら PB・PE＝PC・PD。逆も使える（4点が同一円周上）',
    '**メネラウスの定理** は「どの三角形」と「どの直線」かを先に決め、頂点→分点→頂点…と一周するように比をかける',
    '比が求まったら、方べきの定理で **比を長さの関係に** つなぐ。BD・BA＝BP・BE から、4点 A, D, P, E が同一円周上'
  ];
  // 図の座標（python3 で計算）。G1：∠A=72°（(1)〜(4) 用の一般の形）、G2：∠A=60°（(5) の条件どおり）
  const G1 = { A: [0, 0], B: [8, 0], C: [1.854, 5.706], D: [3, 0], E: [1.236, 3.804], P: [2.363, 3.170], F: [3.272, 4.389], O: [5.5, 3.470], R: 4.277 };
  const G2 = { A: [0, 0], B: [8, 0], C: [3, 5.196], D: [3, 0], E: [2, 3.464], P: [3, 2.887], F: [4.154, 3.997], O: [5.5, 2.598], R: 3.606 };
  const base = (g, opt) => {
    opt = opt || {};
    const it = [
      { k: 'circle', o: g.O, r: g.R, c: 'b', wd: 2.5 },
      { k: 'poly', pts: [g.A, g.B, g.C], close: true, c: 'w' },
      { k: 'seg', a: g.B, b: g.E, c: 'y' }, { k: 'seg', a: g.C, b: g.D, c: 'y' }];
    if (opt.af) it.push({ k: 'seg', a: g.A, b: g.F, c: 'g', dash: true });
    it.push({ k: 'pt', at: g.A, name: 'A', dir: 'sw', c: 'w', r: 4 }, { k: 'pt', at: g.B, name: 'B', dir: 'se', c: 'w', r: 4 },
      { k: 'pt', at: g.C, name: 'C', dir: 'n', c: 'w', r: 4 }, { k: 'pt', at: g.D, name: 'D', dir: 's', c: 'w', r: 4 },
      { k: 'pt', at: g.E, name: 'E', dir: 'w', c: 'w', r: 4 }, { k: 'pt', at: g.P, name: 'P', dir: opt.pdir || 'e', c: 'p' });
    if (opt.af) it.push({ k: 'pt', at: g.F, name: 'F', dir: 'ne', c: 'g', r: 4 });
    if (opt.lens) it.push({ k: 'label', at: [1.5, 0], text: '3', dy: 26, size: 22, c: 'o' }, { k: 'label', at: [5.5, 0], text: '5', dy: 26, size: 22, c: 'o' });
    return it.concat(opt.extra || []);
  };
  const fig1 = (id, opt) => ({ t: 'fig', id, col: 1, view: [-0.9, -1.1, 10.1, 8.1], w: 520, h: 435, items: base(G1, opt) });
  const fig2 = (id, opt) => ({ t: 'fig', id, col: 1, view: [-0.9, -1.3, 10.1, 6.6], w: 560, h: 402, items: base(G2, opt) });

  HB.lesson({
    id: 'ct24-1a-5', field: '共通テスト型　数学Ⅰ・A', title: '2024 共通テスト 数学Ⅰ・A 第5問の類題 ― 円と三角形で、方べきとメネラウスをくり返す',
    level: '2024年度 第5問の類題（自作）', time: '目安 15〜20分', noDec: true,
    problem: {
      label: '類題',
      lead: '$\\triangle\\mathrm{ABC}$ において、AB $=8$、AC $=6$ とする。辺 AB 上に AD $=3$ となる点 D をとり、3 点 B, C, D を通る円を $O$ とする。円 $O$ と辺 AC の交点のうち C と異なるものを E とする。線分 BE と線分 CD の交点を P とし、直線 AP と辺 BC の交点を F とする。',
      parts: [
        '(1)　方べきの定理により、AE $=\\boxed{\\text{ア}}$ である。',
        '(2)　$\\triangle\\mathrm{ABE}$ と直線 CD にメネラウスの定理を用いると $\\dfrac{\\mathrm{BP}}{\\mathrm{PE}}=\\boxed{\\text{イ}}$ である。同様にして $\\dfrac{\\mathrm{CP}}{\\mathrm{PD}}=\\dfrac{\\boxed{\\text{ウ}}}{\\boxed{\\text{エ}}}$ である。',
        '(3)　$\\dfrac{\\mathrm{BF}}{\\mathrm{FC}}=\\dfrac{\\boxed{\\text{オカ}}}{\\boxed{\\text{キ}}}$、$\\dfrac{\\mathrm{AP}}{\\mathrm{PF}}=\\dfrac{\\boxed{\\text{クケ}}}{\\boxed{\\text{コ}}}$ である。',
        '(4)　点 P は円 $O$ の 2 つの弦 BE、CD の交点であるから、方べきの定理により BE : CD $=\\boxed{\\text{サ}}:\\boxed{\\text{シ}}$ である。',
        '(5)　さらに CD $=3\\sqrt3$ とする。このとき BE $=\\boxed{\\text{ス}}\\sqrt{\\boxed{\\text{セ}}}$ であり、BD・BA $=\\boxed{\\text{ソタ}}$、BP・BE $=\\boxed{\\text{チツ}}$ である。このことから $\\boxed{\\text{テ}}$。また、直線 AF と辺 BC について $\\boxed{\\text{ト}}$。\n　テ の解答群　⓪ 4 点 A, D, P, E は同一円周上にある　① 4 点 A, D, P, E は同一円周上にない　② 点 P は円 $O$ の外部にある　③ 点 P は △ABC の重心である\n　ト の解答群　⓪ AF ∥ BC である　① F は辺 BC の中点である　② AF ⊥ BC である　③ AF は ∠BAC の二等分線である'
      ],
      src: '※ 2024年度 共通テスト 数学Ⅰ・A 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', cols: [1], say: '共通テスト第5問型の「図形の性質」（選択問題）。易しい設問から順に、前の結果を使って進む構成です。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:21px;line-height:1.5' }] },
      { clear: true, part: '準備', say: '図をかきます。B, C, D, E は円 O の上。BE と CD（黄）の交点が P です。(1)〜(4) の答えは ∠A の大きさによらないので、図は一例です。',
        add: [{ t: 'h', text: '図をかく' },
          { t: 'p', size: 'sm', text: 'AB $=8$、AC $=6$、AD $=3$\nB, C, D, E は円 $O$ 上\nP $=$ BE と CD の交点' },
          { t: 'box', c: 'y', size: 'sm', label: '共通テストのコツ', text: 'メネラウスを使う前に\n「どの三角形」「どの直線」かを\n図に色をつけて決める' },
          fig1('g0', { lens: true })] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。点 A は円 O の外にあり、A から引いた2本の直線が、円と D・B、E・C で交わっています。方べきの定理が使えます。',
        add: [{ t: 'h', text: '(1)　方べきの定理で AE' },
          { t: 'box', c: 'b', size: 'sm', label: '方べきの定理', text: '円の外の点 A から\nAD・AB $=$ AE・AC' },
          fig1('g1', { lens: true })] },
      { ask: { type: 'choice', q: 'AE（ア）の値は？',
        opts: ['$\\dfrac94$', '$2$', '$4$', '$5$'], ok: 2,
        why: { 0: 'AD・AC $=$ AE・AB と組を取りちがえています。同じ直線上の2つをかけます。', 1: '2 は EC の長さです（$6-4$）。', 3: '5 は DB の長さ。AE とは関係ありません。' },
        good: '$3\\times8=\\mathrm{AE}\\times6$ より AE $=4$（ア＝4）。EC $=6-4=2$ です。',
        add: [{ t: 'm', tex: '3\\times8=\\mathrm{AE}\\times6\\quad\\therefore\\ \\mathrm{AE}=\\ans{4}', note: 'EC $=2$' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は △ABE と直線 CD。直線 CD は、辺 AB と D で、辺 BE と P で、辺 EA の延長と C で交わります。A → D → B → P → E → C → A と一周します。',
        add: [{ t: 'h', text: '(2)　△ABE と直線 CD' },
          { t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AD}}{\\mathrm{DB}}\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PE}}\\cdot\\frac{\\mathrm{EC}}{\\mathrm{CA}}=1', note: 'メネラウスの定理' },
          fig1('g2', { lens: true, extra: [{ k: 'poly', pts: [G1.A, G1.B, G1.E], close: true, fill: 'p', alpha: 0.2, c: 'p' }, { k: 'seg', a: G1.C, b: G1.D, c: 'g', wd: 5 }] })] },
      { ask: { type: 'choice', q: '$\\dfrac{\\mathrm{BP}}{\\mathrm{PE}}$（イ）の値は？',
        opts: ['$\\dfrac15$', '$5$', '$\\dfrac{10}{3}$', '$\\dfrac53$'], ok: 1,
        why: { 0: '逆数です。$\\frac35\\cdot x\\cdot\\frac26=1$ を解くと $x=5$。', 2: '$\\frac{\\mathrm{EC}}{\\mathrm{CA}}$ を $\\frac{\\mathrm{EC}}{\\mathrm{EA}}=\\frac24$ にしています。C から A までは 6。', 3: '$\\frac{\\mathrm{EC}}{\\mathrm{CA}}=\\frac26$ を使い忘れています。' },
        good: '$\\dfrac35\\cdot\\dfrac{\\mathrm{BP}}{\\mathrm{PE}}\\cdot\\dfrac26=1$ より $\\dfrac{\\mathrm{BP}}{\\mathrm{PE}}=5$（イ＝5）。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac35\\cdot\\frac{\\mathrm{BP}}{\\mathrm{PE}}\\cdot\\frac26=1\\quad\\therefore\\ \\frac{\\mathrm{BP}}{\\mathrm{PE}}=5' }] } },
      { say: '「同様にして」は △ACD と直線 BE。$\\dfrac{\\mathrm{AB}}{\\mathrm{BD}}\\cdot\\dfrac{\\mathrm{DP}}{\\mathrm{PC}}\\cdot\\dfrac{\\mathrm{CE}}{\\mathrm{EA}}=1$ に入れると、$\\dfrac85\\cdot\\dfrac{\\mathrm{DP}}{\\mathrm{PC}}\\cdot\\dfrac24=1$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\mathrm{DP}}{\\mathrm{PC}}=\\frac54\\quad\\therefore\\ \\frac{\\mathrm{CP}}{\\mathrm{PD}}=\\frac45', note: 'ウ 4　エ 5' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) の BF : FC は、3本の線 AF、BE、CD が1点 P で交わるので、チェバの定理が速い。メネラウスで2回に分けても求められます。',
        add: [{ t: 'h', text: '(3)　BF : FC と AP : PF' },
          { t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AD}}{\\mathrm{DB}}\\cdot\\frac{\\mathrm{BF}}{\\mathrm{FC}}\\cdot\\frac{\\mathrm{CE}}{\\mathrm{EA}}=1', note: 'チェバの定理' },
          fig1('g3', { lens: true, af: true, pdir: 'w' })] },
      { ask: { type: 'choice', q: '$\\dfrac{\\mathrm{BF}}{\\mathrm{FC}}$（オカ／キ）の値は？',
        opts: ['$\\dfrac{3}{10}$', '$\\dfrac56$', '$\\dfrac53$', '$\\dfrac{10}{3}$'], ok: 3,
        why: { 0: '逆数です。$\\frac35\\cdot x\\cdot\\frac12=1$ から $x=\\frac{10}{3}$。', 1: '$\\frac{\\mathrm{CE}}{\\mathrm{EA}}$ を $\\frac{\\mathrm{EA}}{\\mathrm{CE}}=2$ にしています。一周の向きをそろえます。', 2: '$\\frac{\\mathrm{CE}}{\\mathrm{EA}}=\\frac24$ をかけ忘れています。' },
        good: '$\\dfrac35\\cdot\\dfrac{\\mathrm{BF}}{\\mathrm{FC}}\\cdot\\dfrac24=1$ より $\\dfrac{10}{3}$（オカ＝10、キ＝3）。BF : FC $=10:3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac35\\cdot\\frac{\\mathrm{BF}}{\\mathrm{FC}}\\cdot\\frac24=1\\quad\\therefore\\ \\frac{\\mathrm{BF}}{\\mathrm{FC}}=\\frac{10}{3}' }] } },
      { ask: { type: 'think', q: '△ABF と直線 CD にメネラウスの定理を使って、$\\dfrac{\\mathrm{AP}}{\\mathrm{PF}}$（クケ／コ）を求めよう。',
        hint: 'A → D → B → C → F → P → A と一周。BF : FC $=10:3$ なので、$\\frac{\\mathrm{BC}}{\\mathrm{CF}}=\\frac{13}{3}$。',
        ans: '$\\dfrac35\\cdot\\dfrac{13}{3}\\cdot\\dfrac{\\mathrm{FP}}{\\mathrm{PA}}=1$ より $\\dfrac{\\mathrm{FP}}{\\mathrm{PA}}=\\dfrac{5}{13}$。よって $\\dfrac{\\mathrm{AP}}{\\mathrm{PF}}=\\dfrac{13}{5}$',
        after: '(3) の BF : FC を使って、メネラウスをもう一度。前の結果を次で使う、第5問らしい流れです。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PF}}=\\frac{13}{5}', note: 'クケ 13　コ 5' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。P は円 O の中で、2本の弦 BE と CD が交わる点。円の中の点でも方べきの定理 PB・PE $=$ PC・PD が成り立ちます。',
        add: [{ t: 'h', text: '(4)　弦の交点 P で方べきの定理' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PB}\\cdot\\mathrm{PE}=\\mathrm{PC}\\cdot\\mathrm{PD}' },
          { t: 'p', size: 'sm', text: 'PE $=u$ とすると PB $=5u$（(2) より）\nPC $=4v$ とすると PD $=5v$' },
          fig1('g4', { extra: [{ k: 'seg', a: G1.B, b: G1.E, c: 'p', wd: 5 }, { k: 'seg', a: G1.C, b: G1.D, c: 'g', wd: 5 }] })] },
      { say: '代入すると $5u\\cdot u=4v\\cdot5v$、つまり $u^2=4v^2$ で $u=2v$。BE $=6u=12v$、CD $=9v$ です。',
        add: [{ t: 'm', size: 'sm', tex: '5u^2=20v^2\\quad\\therefore\\ u=2v' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BE}=6u=12v,\\qquad \\mathrm{CD}=9v' }] },
      { ask: { type: 'choice', q: 'BE : CD（サ : シ）は？',
        opts: ['$4:3$', '$3:4$', '$2:3$', '$1:1$'], ok: 0,
        why: { 1: '逆です。BE $=12v$、CD $=9v$。', 2: '$u=v$ としています。方べきの定理から $u=2v$ です。', 3: 'BE と CD は同じ長さではありません。' },
        good: '$12v:9v=4:3$（サ＝4、シ＝3）。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\mathrm{BE}:\\mathrm{CD}=4:3' }] } },
      { say: '確かめ：△ABE と △ACD は、AB : AC $=8:6$、AE : AD $=4:3$ で、間の角 A が共通。2辺の比とその間の角が等しいので相似で、BE : CD $=4:3$ になります。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '別の見方', text: '△ABE ∽ △ACD（相似比 4 : 3）\n→ BE : CD $=4:3$、∠AEB $=$ ∠ADC' }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) で CD $=3\\sqrt3$ が与えられます。BE $=\\frac43\\mathrm{CD}=4\\sqrt3$（ス＝4、セ＝3）。BP は BE の $\\frac56$ です。',
        add: [{ t: 'h', text: '(5)　CD = 3√3 のとき' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BE}=\\frac43\\cdot3\\sqrt3=4\\sqrt3,\\quad \\mathrm{BP}=\\frac56\\mathrm{BE}=\\frac{10\\sqrt3}{3}' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BD}\\cdot\\mathrm{BA}=5\\cdot8=40', note: 'ソタ 40' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BP}\\cdot\\mathrm{BE}=\\frac{10\\sqrt3}{3}\\cdot4\\sqrt3=40', note: 'チツ 40' },
          fig2('h1', { pdir: 'e' })] },
      { ask: { type: 'choice', q: 'BD・BA $=$ BP・BE から言えること（テ）は？',
        opts: ['⓪　A, D, P, E は同一円周上', '①　A, D, P, E は同一円周上にない', '②　P は円 O の外部', '③　P は △ABC の重心'], ok: 0,
        why: { 1: '方べきの定理の **逆** で、等しいときは同一円周上にあります。', 2: 'P は弦 BE と CD の交点なので、円 O の内部です。', 3: '重心なら BP : PE $=2:1$。ここでは $5:1$ です。' },
        good: 'B から引いた2直線上の D, A と P, E で BD・BA $=$ BP・BE。方べきの定理の逆より、4点 A, D, P, E は同一円周上（テ＝⓪）。',
        draw: [{ fig: 'h1', items: [{ k: 'circle', o: [1.5, 1.443], r: 2.082, c: 'g', wd: 2.5 }] }] } },
      { say: 'A, D, P, E が同一円周上なので、向かい合う角の和 ∠ADP ＋ ∠AEP $=180^\\circ$。(4) の相似から ∠ADC $=$ ∠AEB なので、どちらも $90^\\circ$。CD ⊥ AB、BE ⊥ AC です。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: 'わかったこと', text: '∠ADC $=$ ∠AEB $=90^\\circ$\n→ CD と BE は △ABC の **垂線**、P は **垂心**' }],
        draw: [{ fig: 'h1', items: [{ k: 'right', o: G2.D, a: G2.A, b: G2.C, s: 14 }, { k: 'right', o: G2.E, a: G2.A, b: G2.B, s: 14 }] }] },
      { ask: { type: 'choice', q: '直線 AF と辺 BC について言えること（ト）は？',
        opts: ['⓪　AF ∥ BC', '①　F は BC の中点', '②　AF ⊥ BC', '③　AF は ∠BAC の二等分線'], ok: 2,
        why: { 0: 'AF は BC と F で交わるので、平行ではありません。', 1: 'BF : FC $=10:3$ なので、中点ではありません。', 3: '二等分線なら BF : FC $=$ AB : AC $=4:3$。$10:3$ とはちがいます。' },
        good: '三角形の3本の垂線は1点（垂心）で交わります。P が垂心なので、A と P を通る直線 AF も垂線で、AF ⊥ BC（ト＝②）。',
        add: [{ t: 'ans', label: '(5) 答', text: 'ス 4　セ 3　ソタ 40　チツ 40　テ ⓪　ト ②' }],
        draw: [{ fig: 'h1', items: [{ k: 'seg', a: G2.A, b: G2.F, c: 'g', dash: true }, { k: 'pt', at: G2.F, name: 'F', dir: 'ne', c: 'g', r: 4 }, { k: 'right', o: G2.F, a: G2.A, b: G2.B, s: 14 }] }] } },
      { ask: { type: 'think', q: '別の見方：CD $=3\\sqrt3$、AD $=3$、AC $=6$ から、∠ADC $=90^\\circ$ を直接示せる？',
        hint: '△ACD の3辺の長さで、三平方の定理の逆を使う。',
        ans: '$\\mathrm{AD}^2+\\mathrm{CD}^2=9+27=36=\\mathrm{AC}^2$ なので、∠ADC $=90^\\circ$（このとき ∠A $=60^\\circ$）',
        after: '本番では誘導どおり方べきの逆で進めますが、別の道で確かめられると安心です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。方べきの定理とメネラウスの定理を、前の結果を使いながらくり返す。図に色をつけて、どこを使うかを決めるのがコツでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文だけを見て（Q キー）、図をかくところから、もう一度ノートに解いてみましょう。' }
    ]
  });
})();
