/* 共通テスト型 数学Ⅰ，A：2025年度 第1問〔2〕の類題（自作。元の問題の図形・数値・会話は使っていない）
   ねらいを合わせた所：2つの円の中心・接点・共通接線の接点でできる三角形を、余弦定理・正弦定理で調べる。接弦定理を使うと速い。会話文・ていねいな誘導・選択肢4題（ク・セ・ソ・テ）。
   設定：C₁（中心 O₁・半径 4）と C₂（中心 O₂・半径 1）が T で外接。共通外接線 ℓ と C₁・C₂ の接点を P・Q。
   図の座標：P(0,0) Q(4,0) O₁(0,4) O₂(4,1) T(16/5, 8/5) R(4,2) M(2,0)。
   答え（python3・sympy で検算ずみ）：ア 5　イ 4　ウエ 3/5　PT=8√5/5（オ 8 カ 5 キ 5）　ク ①（−3/5）　QT=4√5/5（ケ 4 コ 5 サ 5）　シス 90
   セ ①（½∠PO₁T）　ソ ⓪（直径）　PR=2√5（タ 2 チ 5）　ツ 2　テ ①（√a:√b。一般に PT²=4a²b/(a+b)、QT²=4ab²/(a+b)、PT²+QT²=4ab=PQ²） */
(function () {
  const B = s => '\\boxed{\\text{' + s + '}}';
  const P = [0, 0], Q = [4, 0], O1 = [0, 4], O2 = [4, 1], T = [3.2, 1.6], R = [4, 2], M = [2, 0];
  const base = [
    { k: 'circle', o: O1, r: 4, clip: true, c: 'w' }, { k: 'circle', o: O2, r: 1, c: 'w' },
    { k: 'seg', a: [-2.1, 0], b: [5.7, 0], c: 'b', wd: 3 },
    { k: 'label', at: [5.55, 0.35], text: 'ℓ', size: 24, c: 'b' },
    { k: 'label', at: [-1.75, 1.2], text: 'C₁', size: 24 }, { k: 'label', at: [5.35, 1.75], text: 'C₂', size: 24 },
    { k: 'pt', at: O1, name: 'O₁', dir: 'nw', r: 4 }, { k: 'pt', at: O2, name: 'O₂', dir: 'e', r: 4 },
    { k: 'pt', at: P, name: 'P', dir: 'sw' }, { k: 'pt', at: Q, name: 'Q', dir: 's' }, { k: 'pt', at: T, name: 'T', dir: 'n', c: 'y' }];
  const fig = (id, extra, col, w) => ({ t: 'fig', id, col: col == null ? 1 : col, view: [-2.2, -1.0, 5.8, 5.0], w: w || 600, h: Math.round((w || 600) * 6 / 8), items: base.concat(extra || []) });
  const radii = [{ k: 'seg', a: O1, b: P, c: 'd', wd: 2.5 }, { k: 'seg', a: O2, b: Q, c: 'd', wd: 2.5 }, { k: 'seg', a: O1, b: O2, c: 'd', wd: 2.5 },
    { k: 'right', o: P, a: O1, b: Q, s: 14 }, { k: 'right', o: Q, a: O2, b: [6, 0], s: 12 }];
  const triPTQ = [{ k: 'poly', pts: [P, T, Q], close: true, c: 'y', fill: 'y', alpha: 0.12 }];
  const POINTS = [
    '2円の問題は **中心どうしを結ぶ・中心と接点を結ぶ（接線に垂直）**。外接なら $\\mathrm{O_1O_2}=$ 半径の和。共通接線の長さは直角三角形で',
    '長さは **余弦定理**（平行線の同側内角で $\\cos(180^\\circ-\\theta)=-\\cos\\theta$）。角は **接弦定理**（接線と弦の角 ＝ 円周角 ＝ 中心角の半分）が速い',
    '外接円の半径は **正弦定理** $\\dfrac{a}{\\sin A}=2R$。円周角 $90^\\circ$ ⇔ 直径。半径を文字にして、いつでも成り立つかを確かめる'
  ];

  HB.lesson({
    id: 'ct25-1a-1-2', field: '共通テスト型　数学Ⅰ，A', title: '2025 共通テスト 数学Ⅰ，A 第1問〔2〕の類題 ― 外接する2円と共通接線の三角形',
    level: '2025年度 第1問〔2〕の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '太郎さんと花子さんは，2つの円が接するときにできる図形について調べている。円 $C_1$ は中心 $\\mathrm{O_1}$，半径 $4$，円 $C_2$ は中心 $\\mathrm{O_2}$，半径 $1$ で，$C_1$ と $C_2$ は点 T で外接している。直線 $\\ell$ は $C_1,\\ C_2$ の共通接線のうち点 T を通らないものの1つで，$\\ell$ と $C_1,\\ C_2$ の接点をそれぞれ P，Q とする。',
      parts: [
        '(1)　$\\mathrm{O_1O_2}=' + B('ア') + '$，$\\mathrm{PQ}=' + B('イ') + '$ であり，$\\cos\\angle\\mathrm{PO_1O_2}=\\dfrac{' + B('ウ') + '}{' + B('エ') + '}$ である。',
        '(2)　太郎：三角形 $\\mathrm{O_1PT}$ と三角形 $\\mathrm{O_2QT}$ で余弦定理を使えば，PT と QT が求められるね。\n$\\mathrm{PT}=\\dfrac{' + B('オ') + '\\sqrt{' + B('カ') + '}}{' + B('キ') + '}$ である。また，$\\cos\\angle\\mathrm{QO_2T}=' + B('ク') + '$ であり，$\\mathrm{QT}=\\dfrac{' + B('ケ') + '\\sqrt{' + B('コ') + '}}{' + B('サ') + '}$ である。これらより $\\angle\\mathrm{PTQ}=' + B('シス') + '^\\circ$ である。\n　$' + B('ク') + '$ の解答群：⓪ $\\dfrac35$　① $-\\dfrac35$　② $\\dfrac45$　③ $-\\dfrac45$',
        '　　花子：長さを求めなくても，接弦定理を使えば $\\angle\\mathrm{PTQ}$ がわかるよ。\n円 $C_1$ において，接線 $\\ell$ と弦 PT のつくる角 $\\angle\\mathrm{QPT}$ は $' + B('セ') + '$ に等しい。円 $C_2$ でも同じように考えると，$\\angle\\mathrm{PTQ}$ が求められる。\n　$' + B('セ') + '$ の解答群：⓪ $\\angle\\mathrm{PO_1T}$　① $\\dfrac12\\angle\\mathrm{PO_1T}$　② $\\angle\\mathrm{O_1PT}$　③ $\\dfrac12\\angle\\mathrm{O_1TP}$',
        '(3)　直線 PT と円 $C_2$ の，T 以外の交点を R とする。$\\angle\\mathrm{QTR}=90^\\circ$ であるから，線分 QR は $' + B('ソ') + '$。よって $\\mathrm{PR}=' + B('タ') + '\\sqrt{' + B('チ') + '}$ である。また，三角形 PQT の外接円の半径は $' + B('ツ') + '$ である。\n　$' + B('ソ') + '$ の解答群：⓪ 円 $C_2$ の直径である　① 円 $C_2$ の接線である　② 直線 $\\ell$ に平行である　③ 線分 PT と長さが等しい',
        '(4)　円 $C_1,\\ C_2$ の半径を $a,\\ b\\ (a>b)$ に変えて，同じように P，Q，T を定める。このとき $\\mathrm{PT}:\\mathrm{QT}=' + B('テ') + '$ である。\n　$' + B('テ') + '$ の解答群：⓪ $a:b$　① $\\sqrt a:\\sqrt b$　② $a^2:b^2$　③ $b:a$'
      ],
      src: '※ 2025年度 共通テスト 数学Ⅰ，A 第1問〔2〕と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '2025年度 共通テスト 数学Ⅰ，A 第1問〔2〕の類題（自作）です。2つの円が接してできる三角形を、余弦定理・正弦定理で調べます。問題文は長いので Q キーで見ながら進めましょう。',
        add: [{ t: 'h', text: '外接する2つの円と共通接線' },
          { t: 'box', c: 'b', size: 'sm', label: '設定', text: '$C_1$：中心 $\\mathrm{O_1}$、半径 $4$\n$C_2$：中心 $\\mathrm{O_2}$、半径 $1$\n2円は点 T で **外接**\n$\\ell$：T を通らない共通接線\n接点は P（$C_1$ 側）、Q（$C_2$ 側）' },
          fig('f0')] },
      { say: 'まず図に2つの線をかき込みます。① 中心と接点を結ぶと **接線に垂直**。② 外接する2円の接点 T は、**中心を結ぶ線分上** にあります。',
        draw: [{ fig: 'f0', items: radii }] },
      { say: '会話文に方針が書いてあります。太郎さんは **余弦定理で長さから**、花子さんは **接弦定理で角から**。同じ答えに2通りでたどり着く構成です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '時間の目安', text: '配点 20 点・12〜15 分。前半の計算は手早く、後半の考察に時間を残す' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。外接しているので、$\\mathrm{O_1O_2}$ は半径の和で $5$。PQ は、$\\mathrm{O_2}$ から $\\mathrm{O_1P}$ に垂線 $\\mathrm{O_2H}$ をひくと、直角三角形 $\\mathrm{O_1HO_2}$ で求められます。',
        add: [{ t: 'h', text: '(1)　O₁O₂、PQ、cos∠PO₁O₂' },
          { t: 'm', tex: '\\mathrm{O_1O_2}=4+1=\\ans{5}', note: '← 外接：半径の和' },
          { t: 'm', tex: '\\mathrm{O_1H}=4-1=3', note: '← H(0, 1)：O₁P 上で\n　 O₂ と同じ高さ' },
          fig('f1', radii.concat([{ k: 'seg', a: O2, b: [0, 1], c: 'g', dash: true }, { k: 'pt', at: [0, 1], name: 'H', dir: 'w', c: 'g' },
            { k: 'poly', pts: [O1, [0, 1], O2], close: true, fill: 'g', alpha: 0.15, c: 'g' }]))] },
      { say: '三平方の定理で $\\mathrm{O_2H}=\\sqrt{5^2-3^2}=4$。四角形 $\\mathrm{PQO_2H}$ は長方形なので $\\mathrm{PQ}=\\mathrm{O_2H}=4$。そして $\\cos\\angle\\mathrm{PO_1O_2}=\\dfrac{\\mathrm{O_1H}}{\\mathrm{O_1O_2}}=\\dfrac35$。',
        add: [{ t: 'm', tex: '\\mathrm{PQ}=\\mathrm{O_2H}=\\sqrt{5^2-3^2}=\\ans{4}' },
          { t: 'm', tex: '\\cos\\angle\\mathrm{PO_1O_2}=\\frac{\\mathrm{O_1H}}{\\mathrm{O_1O_2}}=\\ans{\\frac35}' },
          { t: 'ans', label: '(1) 答', text: 'ア $5$　イ $4$　ウ $3$　エ $5$' }] },

      // ---------- (2) 太郎 ----------
      { clear: true, part: '(2) 太郎', say: '(2) 太郎さんの方法。T は線分 $\\mathrm{O_1O_2}$ 上なので $\\angle\\mathrm{PO_1T}=\\angle\\mathrm{PO_1O_2}$。三角形 $\\mathrm{O_1PT}$ は $\\mathrm{O_1P}=\\mathrm{O_1T}=4$ の二等辺三角形です。',
        add: [{ t: 'h', text: '(2)　太郎さん：余弦定理で PT、QT' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PT}^2=4^2+4^2-2\\cdot4\\cdot4\\cos\\angle\\mathrm{PO_1T}' },
          fig('f2', radii.concat([{ k: 'poly', pts: [O1, P, T], close: true, fill: 'y', alpha: 0.15, c: 'y' }, { k: 'seg', a: P, b: T, c: 'y', wd: 4 }]))] },
      { ask: { type: 'choice', q: 'PT（$\\dfrac{\\boxed{\\text{オ}}\\sqrt{\\boxed{\\text{カ}}}}{\\boxed{\\text{キ}}}$）の値は？',
        opts: ['$\\dfrac{64}{5}$', '$\\dfrac{16\\sqrt5}{5}$', '$\\dfrac{8\\sqrt5}{5}$', '$\\dfrac{4\\sqrt{10}}{5}$'], ok: 2,
        why: { 0: 'それは $\\mathrm{PT}^2$。最後に平方根をとります。', 1: '余弦定理の「$-2bc\\cos A$」を $+$ にしています。', 3: '$\\cos$ を $\\frac45$ にしています（それは $\\sin$）。$\\cos\\angle\\mathrm{PO_1T}=\\frac35$ です。' },
        good: '$32-32\\cdot\\frac35=\\frac{64}{5}$、$\\mathrm{PT}=\\frac{8}{\\sqrt5}=\\frac{8\\sqrt5}{5}$。',
        add: [{ t: 'm', tex: '=32-32\\cdot\\frac35=\\frac{64}{5}' }, { t: 'm', tex: '\\mathrm{PT}=\\frac{8}{\\sqrt5}=\\ans{\\frac{8\\sqrt5}{5}}' }] } },
      { clear: true, say: '次は QT。$\\mathrm{O_1P}$ と $\\mathrm{O_2Q}$ はどちらも $\\ell$ に垂直なので **平行**。だから $\\angle\\mathrm{PO_1O_2}$ と $\\angle\\mathrm{QO_2O_1}$ は、足して $180^\\circ$（同側内角）です。',
        add: [{ t: 'h', text: '(2)　つづき：QT' },
          { t: 'm', tex: '\\angle\\mathrm{QO_2T}=180^\\circ-\\angle\\mathrm{PO_1O_2}', note: '← O₁P ∥ O₂Q' },
          fig('f3', radii.concat([{ k: 'poly', pts: [O2, Q, T], close: true, fill: 'p', alpha: 0.2, c: 'p' }, { k: 'seg', a: Q, b: T, c: 'p', wd: 4 },
            { k: 'angle', o: O1, a: P, b: O2, rp: 34, c: 'y' }, { k: 'angle', o: O2, a: Q, b: O1, rp: 26, c: 'p' }]))] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ク}}$：$\\cos\\angle\\mathrm{QO_2T}$ の値は？',
        opts: ['$\\dfrac35$', '$-\\dfrac35$', '$\\dfrac45$', '$-\\dfrac45$'], ok: 1,
        why: { 0: '$\\cos(180^\\circ-\\theta)=-\\cos\\theta$。符号が変わります（図でも鈍角）。', 2: '$\\frac45$ は $\\sin\\angle\\mathrm{PO_1O_2}$。しかも符号も変わります。', 3: '$-\\frac45$ は $-\\sin$。使うのは $\\cos(180^\\circ-\\theta)=-\\cos\\theta$ です。' },
        good: '$\\cos(180^\\circ-\\theta)=-\\cos\\theta$ より $-\\dfrac35$（解答群の ①）。$\\angle\\mathrm{QO_2T}$ は鈍角です。',
        add: [{ t: 'm', tex: '\\cos\\angle\\mathrm{QO_2T}=\\ans{-\\frac35}' }] } },
      { say: '三角形 $\\mathrm{O_2QT}$（$\\mathrm{O_2Q}=\\mathrm{O_2T}=1$）で余弦定理。$\\cos$ が負なので、$-2\\cdot(-\\frac35)$ は足し算になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{QT}^2=1+1-2\\cdot1\\cdot1\\cdot\\left(-\\frac35\\right)=\\frac{16}{5}' },
          { t: 'm', tex: '\\mathrm{QT}=\\frac{4}{\\sqrt5}=\\ans{\\frac{4\\sqrt5}{5}}' }] },
      { ask: { type: 'think', q: '$\\mathrm{PT}^2=\\dfrac{64}{5},\\ \\mathrm{QT}^2=\\dfrac{16}{5},\\ \\mathrm{PQ}=4$ から、$\\angle\\mathrm{PTQ}$（シス）を求めよう。',
        hint: '$\\mathrm{PT}^2+\\mathrm{QT}^2$ と $\\mathrm{PQ}^2$ を比べる（余弦定理で $\\cos\\angle\\mathrm{PTQ}$ を求めても同じ）。',
        ans: '$\\mathrm{PT}^2+\\mathrm{QT}^2=\\dfrac{64}{5}+\\dfrac{16}{5}=16=\\mathrm{PQ}^2$ なので $\\angle\\mathrm{PTQ}=90^\\circ$（シス＝90）',
        after: '三平方の定理の逆です。余弦定理なら $\\cos\\angle\\mathrm{PTQ}=\\frac{\\mathrm{PT}^2+\\mathrm{QT}^2-\\mathrm{PQ}^2}{2\\,\\mathrm{PT}\\cdot\\mathrm{QT}}=0$。',
        add: [{ t: 'ans', label: '答', text: 'オ $8$ カ $5$ キ $5$　ク ①　ケ $4$ コ $5$ サ $5$　シス $90$' }],
        draw: [{ fig: 'f3', items: triPTQ.concat([{ k: 'right', o: T, a: P, b: Q, s: 12, c: 'y' }]) }] } },

      // ---------- (2) 花子 ----------
      { clear: true, part: '(2) 花子', say: '花子さんの方法。**接弦定理**：接線と弦のつくる角は、その角の内側にある弧に対する円周角に等しい。そして円周角は中心角の半分です。',
        add: [{ t: 'h', text: '(2)　花子さん：接弦定理で ∠PTQ' },
          { t: 'box', c: 'b', size: 'sm', label: '接弦定理', text: '接線と弦のつくる角 ＝ その弧に対する円周角\n（＝ 中心角の $\\dfrac12$）' },
          fig('f4', radii.concat(triPTQ, [{ k: 'angle', o: P, a: Q, b: T, rp: 44, c: 'y' }, { k: 'angle', o: O1, a: P, b: T, rp: 30, c: 'g' }]))] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{セ}}$：接線 $\\ell$ と弦 PT のつくる角 $\\angle\\mathrm{QPT}$ と等しいのは？',
        opts: ['$\\angle\\mathrm{PO_1T}$', '$\\angle\\mathrm{O_1PT}$', '$\\dfrac12\\angle\\mathrm{O_1TP}$', '$\\dfrac12\\angle\\mathrm{PO_1T}$'], ok: 3,
        why: { 0: 'それは中心角。円周角は中心角の半分です。', 1: '$\\angle\\mathrm{O_1PT}$ は $\\angle\\mathrm{QPT}$ と合わせて $90^\\circ$（半径 ⊥ 接線）。等しくはありません。', 2: '$\\angle\\mathrm{O_1TP}=\\angle\\mathrm{O_1PT}$（二等辺三角形）で、別の角です。' },
        good: '接弦定理より $\\angle\\mathrm{QPT}$ ＝ 弧 PT に対する円周角 ＝ $\\dfrac12\\angle\\mathrm{PO_1T}$（解答群の ①）。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{QPT}=\\frac12\\angle\\mathrm{PO_1T}', note: '← 円 C₁' }] } },
      { say: '円 $C_2$ でも同じで、$\\angle\\mathrm{PQT}=\\dfrac12\\angle\\mathrm{QO_2T}$。2つの中心角は足して $180^\\circ$ だったので、三角形 PQT の2つの角の和は $90^\\circ$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{PQT}=\\frac12\\angle\\mathrm{QO_2T}', note: '← 円 C₂' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{QPT}+\\angle\\mathrm{PQT}=\\frac12\\cdot180^\\circ=90^\\circ' },
          { t: 'm', tex: '\\angle\\mathrm{PTQ}=180^\\circ-90^\\circ=\\ans{90^\\circ}' }] },
      { say: '長さの計算なしで $90^\\circ$。しかも **半径の値を使っていない** ので、どんな大きさの2円でも成り立ちます。これが (4) への伏線です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'コツ', text: '角を聞かれたら、まず **円周角・接弦定理** で角を追う。計算（余弦定理）は確かめに' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。直線 PT が円 $C_2$ と再び交わる点が R。$\\angle\\mathrm{PTQ}=90^\\circ$ なので、となりの $\\angle\\mathrm{QTR}$ も $90^\\circ$ です。',
        add: [{ t: 'h', text: '(3)　点 R と、三角形 PQT の外接円' },
          { t: 'm', tex: '\\angle\\mathrm{QTR}=180^\\circ-90^\\circ=90^\\circ' },
          fig('f5', [{ k: 'seg', a: P, b: R, c: 'y', wd: 3.5 }, { k: 'seg', a: Q, b: T, c: 'p', wd: 3.5 }, { k: 'seg', a: Q, b: R, c: 'g', wd: 3.5, dash: true },
            { k: 'right', o: T, a: R, b: Q, s: 12, c: 'p' }, { k: 'pt', at: R, name: 'R', dir: 'ne', c: 'g' }])] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ソ}}$：線分 QR について正しいのは？',
        opts: ['円 $C_2$ の接線である', '直線 $\\ell$ に平行である', '円 $C_2$ の直径である', '線分 PT と長さが等しい'], ok: 2,
        why: { 0: 'Q も R も $C_2$ 上の点。QR は弦です。', 1: 'QR は Q を通る直径なので、$\\ell$ に垂直です。', 3: '$\\mathrm{QR}=2$、$\\mathrm{PT}=\\frac{8\\sqrt5}{5}\\fallingdotseq3.58$ で、等しくありません。' },
        good: '円周上の点 T で $\\angle\\mathrm{QTR}=90^\\circ$ → QR は直径（解答群の ⓪）。',
        add: [{ t: 'm', tex: '\\mathrm{QR}=2,\\qquad \\mathrm{QR}\\perp\\ell', note: '← 直径（O₂ を通る）' }] } },
      { say: 'QR は直径で、$\\ell$ に垂直。直角三角形 PQR で三平方の定理を使うと $\\mathrm{PR}=\\sqrt{4^2+2^2}=2\\sqrt5$。方べきの定理 $\\mathrm{PT}\\cdot\\mathrm{PR}=\\mathrm{PQ}^2$ でも確かめられます。',
        add: [{ t: 'm', tex: '\\mathrm{PR}=\\sqrt{4^2+2^2}=\\ans{2\\sqrt5}' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PT}\\cdot\\mathrm{PR}=\\frac{8\\sqrt5}{5}\\cdot2\\sqrt5=16=\\mathrm{PQ}^2', note: '← 検算' }] },
      { clear: true, ask: { type: 'choice', q: '$\\boxed{\\text{ツ}}$：三角形 PQT の外接円の半径は？（正弦定理 $\\dfrac{\\mathrm{PQ}}{\\sin\\angle\\mathrm{PTQ}}=2R$）',
        opts: ['$2$', '$4$', '$\\dfrac{2\\sqrt5}{5}$', '$1$'], ok: 0,
        why: { 1: '$4$ は $2R$。2 で割ります。', 2: 'QT を使っています。PQ と、向かい合う角 $\\angle\\mathrm{PTQ}$ の組で使います。', 3: '$1$ は $C_2$ の半径。$\\frac{4}{\\sin90^\\circ}=4=2R$ です。' },
        good: '$\\dfrac{4}{\\sin90^\\circ}=4=2R$ より $R=2$。中心は PQ の中点 M です。',
        add: [{ t: 'm', tex: '\\frac{4}{\\sin90^\\circ}=4=2R\\qquad R=\\ans{2}' }],
        draw: [{ fig: 'f6', items: [{ k: 'circle', o: M, r: 2, c: 'g', dash: true }, { k: 'pt', at: M, name: 'M', dir: 's', c: 'g' }] }] },
        add: [{ t: 'h', text: '(3)　つづき：外接円の半径（正弦定理）' },
          { t: 'm', tex: '\\frac{\\mathrm{PQ}}{\\sin\\angle\\mathrm{PTQ}}=2R', note: '← 正弦定理\n　 PQ と向かいの角' },
          fig('f6', triPTQ)] },
      { say: '実は M は、T での共通接線（2円の間の接線）と $\\ell$ の交点です。M から $C_1$ への接線の長さ MP、$C_2$ への MQ が、どちらも MT に等しいからです。',
        add: [{ t: 'm', tex: '\\mathrm{MP}=\\mathrm{MT}=\\mathrm{MQ}=2', note: '← 接線の長さは等しい' },
          { t: 'ans', label: '(3) 答', text: 'ソ ⓪　タ $2$　チ $5$　ツ $2$' }],
        draw: [{ fig: 'f6', items: [{ k: 'seg', a: [1.4, -0.8], b: [4.7, 3.6], c: 'b', wd: 2.5, dash: true }, { k: 'seg', a: M, b: T, c: 'g', wd: 3 }] }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) は半径を $a,\\ b$ にした一般の場合。(1)(2) と同じ計算を文字で行います。$\\cos\\angle\\mathrm{PO_1O_2}=\\dfrac{a-b}{a+b}$ です。',
        add: [{ t: 'h', text: '(4)　半径が a, b のとき' },
          { t: 'm', tex: '\\cos\\angle\\mathrm{PO_1O_2}=\\frac{a-b}{a+b}', note: '← (1) と同じ：$\\frac{3}{5}=\\frac{4-1}{4+1}$' },
          { t: 'm', tex: '\\mathrm{PT}^2=2a^2\\left(1-\\frac{a-b}{a+b}\\right)=\\frac{4a^2b}{a+b}' },
          { t: 'm', tex: '\\mathrm{QT}^2=2b^2\\left(1+\\frac{a-b}{a+b}\\right)=\\frac{4ab^2}{a+b}' }] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{テ}}$：$\\mathrm{PT}:\\mathrm{QT}$ は？',
        opts: ['$a:b$', '$\\sqrt a:\\sqrt b$', '$a^2:b^2$', '$b:a$'], ok: 1,
        why: { 0: '$a:b$ は $\\mathrm{PT}^2:\\mathrm{QT}^2$ の比。長さの比はその平方根です。', 2: '$\\mathrm{PT}^2:\\mathrm{QT}^2=4a^2b:4ab^2=a:b$ です。', 3: '逆です。大きい円の側の PT のほうが長くなります。' },
        good: '$\\mathrm{PT}^2:\\mathrm{QT}^2=a:b$ より $\\sqrt a:\\sqrt b$（①）。今回は $\\sqrt4:\\sqrt1=2:1$ で、$\\frac{8\\sqrt5}{5}:\\frac{4\\sqrt5}{5}$ と合います。',
        add: [{ t: 'ans', label: '(4) 答', text: 'テ ①　$\\mathrm{PT}:\\mathrm{QT}=\\sqrt a:\\sqrt b$' }] } },
      { ask: { type: 'think', q: '$\\mathrm{PT}^2+\\mathrm{QT}^2$ を $a,\\ b$ で表して、$\\angle\\mathrm{PTQ}=90^\\circ$ がいつも成り立つことを確かめよう。',
        hint: '$\\mathrm{PQ}^2$ は、(1) と同じ直角三角形で $(a+b)^2-(a-b)^2$。',
        ans: '$\\mathrm{PT}^2+\\mathrm{QT}^2=\\dfrac{4ab(a+b)}{a+b}=4ab$、$\\mathrm{PQ}^2=(a+b)^2-(a-b)^2=4ab$。等しいので、いつも $\\angle\\mathrm{PTQ}=90^\\circ$',
        after: '花子さんの接弦定理の方法でも、半径を使わずに $90^\\circ$ が出ていました。2つの方法が一致します。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。共通テストの図形と計量は、会話文の2つの方法を両方たどると、検算にもなります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
