/* 共通テスト型 数学Ⅰ，A：2025年度 第3問の類題（自作。元の問題の立体・数値・証明文は使っていない）
   ねらいを合わせた所：空間図形（自作：四面体と、各辺上の3点を通る平面）で、2平面の交線を使う証明の穴埋め → 方べきの定理・相似・メネラウスの定理で線分の長さ → 命題の正誤の判断（正誤の組合せ8択）。
   答え（python3・sympy で検算ずみ）：ア ①（平面 PQR）　イ ②（平面 BCD）　ウ ①（1本の直線）
   (2) 面 ABC：AB=6, AC=4, BC=5, AP=2、P,B,C,Q が同一円周上 → AP·AB=AQ·AC で エ AQ=3（QC=1）。△APQ∽△ACB（比 1:2）で PQ=5/2（オ 5 カ 2）。
       メネラウス (AP/PB)(BX/XC)(CQ/QA)=1 → BX:XC=6:1、X は C の外側で キ CX=1。方べき XQ·XP=XC·XB=6、XP=XQ+5/2 → 2q²+5q−12=(2q−3)(q+4)=0 → XQ=3/2（ク 3 ケ 2）。
       座標の検算：B(0,0) C(5,0) A(9/2, √63/2) で P(3, √7) Q(39/8, √7·3/8)、X(6,0)、円の中心 (5/2, √7/14)。∠APQ=∠ACB≒82.8°、∠ABC≒41.4°。
   (3) (a) 正（AP·AB=AQ·AC=AR·AD → 方べきの定理の逆）　(b) 誤（∠APQ=∠ACB であって ∠ABC ではない）　(c) 誤（AB=AC なら AP=AQ で PQ∥BC）→ コ ③（正・誤・誤）
   見取図：A(2.2,4.6) B(0,0) C(4.6,−0.4) D(3.2,1.3)（D は奥）。AP:PB=1:2、AQ:QC=3:1、AR:RD=3:2。平行投影なので比と一直線は保たれる（X,Y,Z の一直線は計算で確認ずみ） */
(function () {
  const B_ = s => '\\boxed{\\text{' + s + '}}';
  // ---------- 見取図（四面体） ----------
  const A = [2.2, 4.6], B = [0, 0], C = [4.6, -0.4], D = [3.2, 1.3];
  const P = [1.4667, 3.0667], Q = [4.0, 0.85], R = [2.8, 2.62], X = [5.52, -0.48], Y = [6.0, -2.1], Z = [4.8, 1.95];
  const tet = [
    { k: 'seg', a: A, b: B, wd: 3 }, { k: 'seg', a: A, b: C, wd: 3 }, { k: 'seg', a: B, b: C, wd: 3 },
    { k: 'seg', a: A, b: D, wd: 2.5, dash: true, c: 'd' }, { k: 'seg', a: B, b: D, wd: 2.5, dash: true, c: 'd' }, { k: 'seg', a: C, b: D, wd: 2.5, dash: true, c: 'd' },
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 's', r: 4 }, { k: 'pt', at: D, name: 'D', dir: 'w', off: 22, r: 4, c: 'd' }];
  const sec = [
    { k: 'poly', pts: [P, Q, R], close: true, c: 'y', fill: 'y', alpha: 0.13, wd: 0.01 },
    { k: 'seg', a: P, b: Q, c: 'y', wd: 3.5 }, { k: 'seg', a: Q, b: R, c: 'y', wd: 3, dash: true }, { k: 'seg', a: R, b: P, c: 'y', wd: 3, dash: true },
    { k: 'pt', at: P, name: 'P', dir: 'w', c: 'y' }, { k: 'pt', at: Q, name: 'Q', dir: 'ne', c: 'y' }, { k: 'pt', at: R, name: 'R', dir: 'n', off: 22, c: 'y' }];
  const ext = [
    { k: 'seg', a: Q, b: X, c: 'g', wd: 2 }, { k: 'seg', a: C, b: X, c: 'g', wd: 2 },
    { k: 'seg', a: Q, b: Y, c: 'g', wd: 2 }, { k: 'seg', a: C, b: Y, c: 'g', wd: 2 },
    { k: 'seg', a: R, b: Z, c: 'g', wd: 2, dash: true }, { k: 'seg', a: D, b: Z, c: 'g', wd: 2, dash: true },
    { k: 'pt', at: X, name: 'X', dir: 'e', c: 'p' }, { k: 'pt', at: Y, name: 'Y', dir: 'e', c: 'p' }, { k: 'pt', at: Z, name: 'Z', dir: 'e', c: 'p' }];
  const ell = [{ k: 'seg', a: [6.144, -2.586], b: [4.656, 2.436], c: 'p', wd: 3 }, { k: 'label', at: [4.62, 2.75], text: 'ℓ', size: 26, c: 'p' }];
  const solid = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-0.7, -2.8, 6.9, 5.3], w: Math.round((h || 470) * 7.6 / 8.1), h: h || 470, items: tet.concat(extra || []) });
  // ---------- 面 ABC（実際の形） ----------
  const s7 = Math.sqrt(7), FA = [4.5, Math.sqrt(15.75)], FB = [0, 0], FC = [5, 0], FP = [3, s7], FQ = [4.875, 3 * s7 / 8], FX = [6, 0];
  const face = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.6, -2.7, 6.8, 4.5], w: 480, h: 467, items: [
    { k: 'poly', pts: [FA, FB, FC], close: true, wd: 3 },
    { k: 'pt', at: FA, name: 'A', dir: 'n' }, { k: 'pt', at: FB, name: 'B', dir: 'sw' }, { k: 'pt', at: FC, name: 'C', dir: 's', off: 24 },
    { k: 'pt', at: FP, name: 'P', dir: 'nw', c: 'y' }, { k: 'pt', at: FQ, name: 'Q', dir: 'e', off: 22, c: 'y' },
    { k: 'label', at: [3.55, 3.65], text: '2', size: 22, c: 'b' }, { k: 'label', at: [1.15, 1.65], text: '4', size: 22, c: 'b' },
    { k: 'label', at: [2.5, 0.3], text: '5', size: 22, c: 'b' }].concat(extra || []) });
  const circ = { k: 'circle', o: [2.5, s7 / 14], r: 2.50713, c: 'g', dash: true };
  const POINTS = [
    '空間で「3点が一直線上」を示すには、3点が **異なる2平面の両方の上** にあることを言う（2平面の共有点全体は1本の直線＝交線）',
    '4点が同一円周上 → **方べきの定理** $\\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AQ}\\cdot\\mathrm{AC}$ と、**2辺の比と間の角で相似**（$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{ACB}$。対応に注意）',
    '空間図形でも、長さは **1つの面（平面）の中** で、方べき・相似・メネラウスを使って求める。正誤判断は、反例になる特別な場合（AB＝AC など）を考える'
  ];

  HB.lesson({
    id: 'ct25-1a-3', field: '共通テスト型　数学Ⅰ，A', title: '2025 共通テスト 数学Ⅰ，A 第3問の類題 ― 四面体の切り口と交線・方べきの定理',
    level: '2025年度 第3問の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '四面体 ABCD において，辺 AB，AC，AD 上にそれぞれ頂点と異なる点 P，Q，R をとる。直線 PQ と直線 BC，直線 QR と直線 CD，直線 RP と直線 DB は，それぞれ1点で交わるとし，その交点を順に X，Y，Z とする。',
      parts: [
        '(1)　3点 X，Y，Z が一直線上にあることを，次のように証明した。\n【証明】X は直線 PQ 上にあり，直線 PQ は平面 $' + B_('ア') + '$ 上にあるから，X は平面 $' + B_('ア') + '$ 上にある。また，X は直線 BC 上にあるから，平面 $' + B_('イ') + '$ 上にもある。Y，Z についても同様に，平面 $' + B_('ア') + '$ と平面 $' + B_('イ') + '$ の両方の上にある。2つの平面 $' + B_('ア') + '$，$' + B_('イ') + '$ は異なる平面で共有点をもつから，その共有点全体は $' + B_('ウ') + '$ である。よって，3点 X，Y，Z は一直線上にある。\n　$' + B_('ア') + '$，$' + B_('イ') + '$ の解答群：⓪ ABC　① PQR　② BCD　③ ABD\n　$' + B_('ウ') + '$ の解答群：⓪ 1点　① 1本の直線　② 2本の直線　③ 1つの平面',
        '(2)　$\\mathrm{AB}=6,\\ \\mathrm{AC}=4,\\ \\mathrm{BC}=5,\\ \\mathrm{AP}=2$ とし，4点 P，B，C，Q が同一円周上にあるとする。このとき，方べきの定理により $\\mathrm{AQ}=' + B_('エ') + '$ である。また，$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{ACB}$ であるから $\\mathrm{PQ}=\\dfrac{' + B_('オ') + '}{' + B_('カ') + '}$ である。さらに，$\\mathrm{CX}=' + B_('キ') + '$，$\\mathrm{XQ}=\\dfrac{' + B_('ク') + '}{' + B_('ケ') + '}$ である。',
        '(3)　次の (a)〜(c) の正誤の組合せとして正しいものは $' + B_('コ') + '$ である。\n(a) 4点 P，B，C，Q が同一円周上にあり，4点 Q，C，D，R も同一円周上にあるならば，4点 R，D，B，P も同一円周上にある。\n(b) (2) の場合，$\\angle\\mathrm{APQ}=\\angle\\mathrm{ABC}$ である。\n(c) $\\mathrm{AB}=\\mathrm{AC}$ のとき，4点 P，B，C，Q が同一円周上にあるならば，直線 PQ と直線 BC は1点で交わる。\n　$' + B_('コ') + '$ の解答群（(a)，(b)，(c) の順）：⓪ 正 正 正　① 正 正 誤　② 正 誤 正　③ 正 誤 誤　④ 誤 正 正　⑤ 誤 正 誤　⑥ 誤 誤 正　⑦ 誤 誤 誤'
      ],
      src: '※ 2025年度 共通テスト 数学Ⅰ，A 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '2025年度 共通テスト 数学Ⅰ，A 第3問の類題（自作）です。四面体を平面で切ったときの「交線」と、面の中での方べきの定理・相似を使います。',
        add: [{ t: 'h', text: '四面体の切り口と交線' },
          { t: 'box', c: 'b', size: 'sm', label: '設定', text: '四面体 ABCD の辺 AB，AC，AD 上に P，Q，R\n直線 PQ と BC の交点 X\n直線 QR と CD の交点 Y\n直線 RP と DB の交点 Z' },
          solid('s0', sec)] },
      { say: '見取図に交点 X、Y、Z をかき込みました（緑は延長した線）。3点は1本の直線 ℓ の上に並んでいるように見えます。(1) はこれを証明します。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '時間の目安', text: '配点 20 点・15 分前後。(1) の証明はことばの穴埋めなので手早く。(2) の計算に時間を使う' }],
        draw: [{ fig: 's0', items: ext.concat(ell) }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) は証明の穴埋め。空間では「その点が **どの平面の上にあるか**」をことばで追うのがコツです。まず X について考えます。',
        add: [{ t: 'h', text: '(1)　X，Y，Z が一直線上にある証明' },
          { t: 'box', c: 'b', size: 'sm', label: 'X について', text: 'X は直線 PQ 上 → 平面 [ア] 上\nX は直線 BC 上 → 平面 [イ] 上' },
          solid('s1', sec.concat(ext))] },
      { ask: { type: 'choice', q: 'ア・イ に入る平面の組は？（X，Y，Z の **3点すべて** がのる平面）',
        opts: ['ア PQR，イ BCD', 'ア ABC，イ BCD', 'ア PQR，イ ABC', 'ア ABC，イ ABD'], ok: 0,
        why: { 1: '直線 PQ は平面 ABC 上にもありますが、Y・Z は平面 ABC 上にありません。PQ・QR・RP がすべてのる平面 PQR です。', 2: 'X は BC 上なので平面 ABC 上にもありますが、Y（CD 上）・Z（DB 上）は平面 ABC 上にありません。', 3: '平面 ABC・ABD は、3点のうち1つずつしかのっていません。' },
        good: 'PQ・QR・RP は平面 PQR 上（ア ①）、BC・CD・DB は平面 BCD 上（イ ②）。X，Y，Z はどれも両方の平面上にあります。',
        add: [{ t: 'm', tex: '\\mathrm{X},\\ \\mathrm{Y},\\ \\mathrm{Z}\\in(\\text{平面 PQR})\\cap(\\text{平面 BCD})' }] } },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ウ}}$：異なる2つの平面が共有点をもつとき、その共有点全体は？',
        opts: ['1点', '1つの平面', '2本の直線', '1本の直線'], ok: 3,
        why: { 0: '共有点が1つあれば、ほかにも無数にあります。2平面は直線で交わります。', 1: '共有点全体が平面になるのは、2平面が一致するときだけです。', 2: '2つの平面の交わりは、1本の直線（交線）だけです。' },
        good: '異なる2平面が共有点をもてば、共有点全体は1本の直線（交線）。だから X，Y，Z はその交線 ℓ 上に並びます。',
        draw: [{ fig: 's1', items: ell }] } },
      { say: '(1) の答えです。空間で「3点が一直線上」を示すときは、**2つの平面の交線にのせる** のが定番の方法です。',
        add: [{ t: 'ans', label: '(1) 答', text: 'ア ①（PQR）　イ ②（BCD）　ウ ①（1本の直線）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は面 ABC の中だけで考えます。空間図形でも、長さは **1つの平面の中** で求めます。右は面 ABC を実際の形でかいた図。4点 P，B，C，Q が同一円周上にあります。',
        add: [{ t: 'h', text: '(2)　面 ABC の中で長さを求める' },
          { t: 'm', tex: '\\mathrm{AB}=6,\\ \\mathrm{AC}=4,\\ \\mathrm{BC}=5,\\ \\mathrm{AP}=2' },
          { t: 'box', c: 'b', size: 'sm', label: '方べきの定理', text: '点 A を通る2直線が円と P，B および Q，C で交わるとき\n$\\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AQ}\\cdot\\mathrm{AC}$' },
          face('f1', [circ])] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{エ}}$：AQ の長さは？',
        opts: ['$2$', '$\\dfrac43$', '$3$', '$12$'], ok: 2,
        why: { 0: 'PB ではなく AB を使います。A から円までの長さどうし：$\\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AQ}\\cdot\\mathrm{AC}$。', 1: 'かける組がちがいます。同じ直線上の AP と AB、AQ と AC をかけます。', 3: '$\\mathrm{AP}\\cdot\\mathrm{AB}=12$ は $\\mathrm{AQ}\\cdot\\mathrm{AC}$ の値。$\\mathrm{AC}=4$ で割ります。' },
        good: '$2\\cdot6=\\mathrm{AQ}\\cdot4$ より $\\mathrm{AQ}=3$。QC は $4-3=1$ です。',
        add: [{ t: 'm', tex: '2\\cdot6=\\mathrm{AQ}\\cdot4\\qquad \\mathrm{AQ}=\\ans{3},\\ \\ \\mathrm{QC}=1' }],
        draw: [{ fig: 'f1', items: [{ k: 'label', at: [4.85, 2.95], text: '3', size: 22, c: 'p' }, { k: 'label', at: [5.15, 0.55], text: '1', size: 22, c: 'p' }] }] } },
      { ask: { type: 'choice', q: '$\\mathrm{AP}:\\mathrm{AC}=\\mathrm{AQ}:\\mathrm{AB}=1:2$、$\\angle\\mathrm{A}$ は共通。相似の対応として正しいのは？',
        opts: ['$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{ABC}$', '$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{ACB}$', '$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{BCA}$', '$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{CAB}$'], ok: 1,
        why: { 0: 'それだと AP:AB と AQ:AC（1:3 と 3:4）が等しくなるはず。PQ ∥ BC のときの形です。', 2: '共通な角 A どうしが対応していません。A は A に対応します。', 3: '共通な角 A どうしが対応していません。' },
        good: 'P が C に、Q が B に対応（2辺の比とその間の角）。よって $\\mathrm{PQ}=\\dfrac12\\mathrm{CB}=\\dfrac52$。',
        add: [{ t: 'm', tex: '\\mathrm{PQ}=\\frac12\\,\\mathrm{BC}=\\ans{\\frac52}', note: '← オ 5、カ 2' }] } },
      { clear: true, say: '次に CX。直線 PQX が三角形 ABC の辺（の延長）を切っているので、**メネラウスの定理** が使えます。',
        add: [{ t: 'h', text: '(2)　つづき：CX と XQ' },
          { t: 'm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PB}}\\cdot\\frac{\\mathrm{BX}}{\\mathrm{XC}}\\cdot\\frac{\\mathrm{CQ}}{\\mathrm{QA}}=1', note: '← メネラウスの定理' },
          { t: 'm', tex: '\\frac24\\cdot\\frac{\\mathrm{BX}}{\\mathrm{XC}}\\cdot\\frac13=1\\qquad \\mathrm{BX}:\\mathrm{XC}=6:1' },
          face('f2', [circ, { k: 'seg', a: FP, b: FX, c: 'y', wd: 3 }, { k: 'seg', a: FC, b: FX, c: 'g', wd: 3 }, { k: 'pt', at: FX, name: 'X', dir: 'se', c: 'p' }])] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{キ}}$：$\\mathrm{BX}:\\mathrm{XC}=6:1$ のとき、CX の長さは？',
        opts: ['$\\dfrac56$', '$6$', '$\\dfrac57$', '$1$'], ok: 3,
        why: { 0: 'BX と BC を同じ長さとみています。X は C の外側にあり、$\\mathrm{BX}=\\mathrm{BC}+\\mathrm{CX}$ です。', 1: '6 は BX の長さ（$5+1$）です。', 2: 'X は線分 BC の上（内分点）ではなく、C の外側（外分点）です。' },
        good: '$\\mathrm{BX}=5+\\mathrm{CX}$ と $\\mathrm{BX}=6\\,\\mathrm{CX}$ から $\\mathrm{CX}=1$（BX は 6）。',
        add: [{ t: 'm', tex: '5+\\mathrm{CX}=6\\,\\mathrm{CX}\\qquad \\mathrm{CX}=\\ans{1},\\ \\ \\mathrm{XB}=6' }] } },
      { say: 'XQ は、点 X から見た **方べきの定理** を使います。X を通る2直線が円と Q，P および C，B で交わるので $\\mathrm{XQ}\\cdot\\mathrm{XP}=\\mathrm{XC}\\cdot\\mathrm{XB}=6$。',
        add: [{ t: 'm', tex: '\\mathrm{XQ}\\cdot\\mathrm{XP}=\\mathrm{XC}\\cdot\\mathrm{XB}=1\\cdot6=6' },
          { t: 'm', tex: '\\mathrm{XP}=\\mathrm{XQ}+\\mathrm{QP}=\\mathrm{XQ}+\\frac52' }] },
      { ask: { type: 'think', q: '$\\mathrm{XQ}=q$ とおいて、$q$（ク/ケ）を求めよう。',
        hint: '$q\\left(q+\\dfrac52\\right)=6$ の両辺を 2 倍して整理する。',
        ans: '$2q^2+5q-12=0$、$(2q-3)(q+4)=0$、$q>0$ より $\\mathrm{XQ}=\\dfrac32$（ク 3、ケ 2）',
        after: '検算：$\\mathrm{XP}=\\frac32+\\frac52=4$ で、$\\frac32\\cdot4=6$。$\\triangle\\mathrm{XCQ}\\backsim\\triangle\\mathrm{XPB}$（比 $1:4$）からも出せます。',
        add: [{ t: 'ans', label: '(2) 答', text: 'エ $3$　オ $5$ カ $2$　キ $1$　ク $3$ ケ $2$' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) は (a)〜(c) の正誤。まず (a)。面 ABC の円と面 ACD の円で、点 A からの方べきの定理を2回使うと、AP·AB と AR·AD がつながります。',
        add: [{ t: 'h', text: '(3)　(a)〜(c) の正誤' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AQ}\\cdot\\mathrm{AC}', note: '← 面 ABC（P，B，C，Q が円周上）' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AQ}\\cdot\\mathrm{AC}=\\mathrm{AR}\\cdot\\mathrm{AD}', note: '← 面 ACD（Q，C，D，R が円周上）' },
          { t: 'm', size: 'sm', tex: '\\therefore\\ \\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AR}\\cdot\\mathrm{AD}', note: '← 方べきの定理の逆で\n　 R，D，B，P は円周上（(a) 正）' },
          solid('s3', sec)] },
      { ask: { type: 'think', q: '(c) を考えよう。AB＝AC のとき、4点 P，B，C，Q が同一円周上にあると、直線 PQ と BC はどうなる？',
        hint: '方べきの定理 $\\mathrm{AP}\\cdot\\mathrm{AB}=\\mathrm{AQ}\\cdot\\mathrm{AC}$ で、$\\mathrm{AB}=\\mathrm{AC}$ を使う。',
        ans: '$\\mathrm{AP}=\\mathrm{AQ}$ となり、$\\mathrm{AP}:\\mathrm{AB}=\\mathrm{AQ}:\\mathrm{AC}$ なので **PQ ∥ BC**。1点で交わらないので (c) は **誤り**',
        after: '正誤問題では、このような「特別な場合（二等辺三角形など）」が反例になることがよくあります。',
        add: [{ t: 'p', size: 'sm', text: '(c)：AB＝AC → AP＝AQ → PQ ∥ BC → 交わらない（誤）' }] } },
      { ask: { type: 'choice', q: '$\\boxed{\\text{コ}}$：(a)，(b)，(c) の正誤の組合せは？（(b)：(2) の場合 $\\angle\\mathrm{APQ}=\\angle\\mathrm{ABC}$）',
        opts: ['正　正　誤', '正　誤　誤', '誤　誤　正', '正　誤　正'], ok: 1,
        why: { 0: '(b) は誤り。$\\triangle\\mathrm{APQ}\\backsim\\triangle\\mathrm{ACB}$ なので、$\\angle\\mathrm{APQ}$ と等しいのは $\\angle\\mathrm{ACB}$ です。', 2: '(a) は方べきの定理（とその逆）で正しい。(c) は AB＝AC だと PQ ∥ BC で誤りです。', 3: '(c) は誤り。AB＝AC だと AP＝AQ となり、PQ ∥ BC です。' },
        good: '(a) 正、(b) 誤（等しいのは ∠ACB）、(c) 誤。解答群の ③ です。',
        add: [{ t: 'ans', label: '(3) 答', text: 'コ ③（(a) 正　(b) 誤　(c) 誤）' }] } },
      { say: '(b) のように「∠APQ＝∠ABC」と思いこむのは、PQ ∥ BC のときの形と混同しているから。円に内接する四角形では、**外角が向かいの内角に等しい** 形になります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '注意', text: '四角形 PBCQ が円に内接 → $\\angle\\mathrm{APQ}=\\angle\\mathrm{QCB}$（外角 ＝ 内対角）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間図形の問題も、「平面の交線」と「面の中の平面図形」に分けて考えると、使い慣れた定理で解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
