/* 京大型 数学（理系）：2026年度 京都大学 前期 理系 第2問の類題（自作問題・元の問題ではない）
   問題：底面が1辺1の正六角形、側辺がすべて2の正六角錐 O-ABCDEF。辺 OA を t:(1−t) に内分する点 P を中心とする半径 r の球（内部をふくむ）が、
         辺 BC（OA とねじれの位置）と共有点をもたない r の範囲。
   答え（python3 で検算ずみ：t を 500 通り、辺 BC 上の点 20 万個で最小距離と一致）：
     |PQ|^2 = s^2+(2t−1)s+4t^2−7t+4 = (s−(1/2−t))^2+3t^2−6t+15/4（Q=(1−s)B+sC, 0≤s≤1）
     0<t≤1/2 のとき 0<r<√(3t^2−6t+15/4)、1/2<t<1 のとき 0<r<√(4t^2−7t+4)（＝PB）
     a·b=b·c=7/2、a·c=5/2。t=3/4 のとき 直線 BC との距離 √15/4、辺 BC との距離 PB=1、PC=√10/2 */
(function () {
  const r3 = Math.sqrt(3), PS = -140 * Math.PI / 180, EL = 30 * Math.PI / 180;
  const pj = (x, y, z) => { const xr = x * Math.cos(PS) - y * Math.sin(PS), yr = x * Math.sin(PS) + y * Math.cos(PS); return [xr, z * Math.cos(EL) + yr * Math.sin(EL)]; };
  const V = { A: [1, 0, 0], B: [0.5, r3 / 2, 0], C: [-0.5, r3 / 2, 0], D: [-1, 0, 0], E: [-0.5, -r3 / 2, 0], F: [0.5, -r3 / 2, 0], O: [0, 0, r3] };
  const S = {}; Object.keys(V).forEach(k => { S[k] = pj(...V[k]); });
  const Pt = t => pj(t, 0, r3 * (1 - t));
  // 見取図（見える辺は実線、DE・EF・OE は点線）
  const solid = (id, t, extra) => ({ t: 'fig', id, col: 1, view: [-1.3, -0.85, 1.3, 1.78], w: 460, h: 465, items: [
    { k: 'seg', a: S.A, b: S.B, wd: 2.5 }, { k: 'seg', a: S.C, b: S.D, wd: 2.5 }, { k: 'seg', a: S.F, b: S.A, wd: 2.5 },
    { k: 'seg', a: S.D, b: S.E, wd: 2, dash: true, c: 'd' }, { k: 'seg', a: S.E, b: S.F, wd: 2, dash: true, c: 'd' }, { k: 'seg', a: S.O, b: S.E, wd: 2, dash: true, c: 'd' },
    { k: 'seg', a: S.O, b: S.B, wd: 2.5 }, { k: 'seg', a: S.O, b: S.C, wd: 2.5 }, { k: 'seg', a: S.O, b: S.D, wd: 2.5 }, { k: 'seg', a: S.O, b: S.F, wd: 2.5 },
    { k: 'seg', a: S.O, b: S.A, wd: 4, c: 'b' }, { k: 'seg', a: S.B, b: S.C, wd: 5, c: 'y' },
    { k: 'label', at: S.O, text: 'O', dy: -20, size: 24 }, { k: 'label', at: S.A, text: 'A', dx: -18, dy: 10, size: 24 }, { k: 'label', at: S.B, text: 'B', dy: 22, size: 24 },
    { k: 'label', at: S.C, text: 'C', dx: 18, dy: 8, size: 24 }, { k: 'label', at: S.D, text: 'D', dx: 18, size: 24 }, { k: 'label', at: S.E, text: 'E', dy: 24, size: 22, c: 'd' }, { k: 'label', at: S.F, text: 'F', dx: -18, size: 24 },
    { k: 'pt', at: Pt(t), name: 'P', dir: 'w', c: 'p' }].concat(extra || []) });
  // 上から見た図（底面）。H＝底面の中心（O の真下）、P'＝P の真下の点（HP' = t）
  const top = (id, t, extra) => ({ t: 'fig', id, col: 1, view: [-1.25, -1.1, 1.55, 1.3], w: 520, h: 446, items: [
    { k: 'poly', pts: [[1, 0], [0.5, r3 / 2], [-0.5, r3 / 2], [-1, 0], [-0.5, -r3 / 2], [0.5, -r3 / 2]], close: true, wd: 2.5 },
    { k: 'seg', a: [0.5, r3 / 2], b: [-0.5, r3 / 2], wd: 5, c: 'y' }, { k: 'seg', a: [0, 0], b: [1, 0], wd: 3, c: 'b' },
    { k: 'pt', at: [0, 0], name: 'H', dir: 'sw', size: 22 }, { k: 'label', at: [1, 0], text: 'A', dx: 20, size: 24 },
    { k: 'label', at: [0.5, r3 / 2], text: 'B', dx: -6, dy: -22, size: 24 }, { k: 'label', at: [-0.5, r3 / 2], text: 'C', dy: -22, size: 24 },
    { k: 'pt', at: [t, 0], name: "P'", dir: 's', c: 'p', size: 24 }].concat(extra || []) });
  // |PQ|^2 を s の関数として（t=1/4 と t=3/4）
  const qd = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.75, -0.35, 1.35, 3.2], w: 470, h: 400, items: [
    { k: 'axes', tx: [[1, '1']], ty: [], xl: 's', yl: '' },
    { k: 'seg', a: [0, 0], b: [1, 0], wd: 7, c: 'g' }].concat(items || []) });
  const POINTS = [
    '「球が辺と共有点をもたない」⇔ $r<$（中心と **辺（線分）上の点** の距離の最小値）。直線との距離とはかぎらない',
    '辺上の点を $\\overrightarrow{\\mathrm{OQ}}=(1-s)\\vec b+s\\vec c\\ (0\\le s\\le1)$ とおき、$|\\overrightarrow{\\mathrm{PQ}}|^2$ を $s$ の2次関数に。内積は辺の長さから',
    '軸 $s=\\frac12-t$ が区間に入るか入らないかで場合分け。入らないときは端の点 B がいちばん近い'
  ];

  HB.lesson({
    id: 'kyo26-2', field: '京大型　数学（理系）', title: '2026 京大 理系 第2問の類題 ― 正六角錐の辺の上に中心がある球と、ねじれの位置の辺', level: '2026年度 京都大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '底面が 1 辺の長さ 1 の正六角形 ABCDEF で、$\\mathrm{OA}=\\mathrm{OB}=\\mathrm{OC}=\\mathrm{OD}=\\mathrm{OE}=\\mathrm{OF}=2$ である正六角錐 O-ABCDEF がある。$0<t<1$ とし、辺 OA を $t:(1-t)$ に内分する点を P とする。P を中心とする半径 $r$ の球（内部をふくむ）が辺 BC と共有点をもたないような $r$ の値の範囲を、$t$ を用いて表せ。',
      src: '※ 2026年度 京都大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [1],
    steps: [
      { part: '問題', say: '空間の図形とベクトルの問題です。小問の誘導はありません。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 図と読みかえ ----------
      { clear: true, cols: [0.55, 0.45], part: '読みかえ', say: '図をかきます。P は辺 OA（青）の上、調べるのは辺 BC（黄）。OA と BC は、交わらず平行でもない **ねじれの位置** にあります。',
        add: [{ t: 'h', text: '図と問題の読みかえ' },
          { t: 'p', size: 'sm', text: '側面は 3 辺が $2,\\ 2,\\ 1$ の二等辺三角形\nP は OA を $t:(1-t)$ に内分（$0<t<1$）' },
          solid('s1', 0.5)] },
      { ask: { type: 'choice', q: '球（内部をふくむ）が辺 BC と共有点をもたない条件は？',
        opts: ['$r<$（P と直線 BC の距離）', '$r<$（P と辺 BC 上の点の距離の最小値）', '$r>\\mathrm{PB}$ かつ $r>\\mathrm{PC}$', '$r<\\mathrm{PB}$ かつ $r<\\mathrm{PC}$'], ok: 1,
        why: { 0: '辺は線分です。垂線の足が辺の外に出ると、直線との距離では答えがずれます。', 2: 'それは辺 BC がまるごと球の中に入る条件。共有点だらけです。', 3: '両はしだけ見ても、辺の途中の点が球に入ることがあります。' },
        good: '辺 BC 上の点 Q について PQ の最小値を $m$ とすると、条件は $r<m$。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: 'Q を辺 BC 上の点として $|\\overrightarrow{\\mathrm{PQ}}|^2$ を $s$ の2次関数で表し、$0\\le s\\le1$ での最小値 $m^2$ を求める → $0<r<m$' }] } },

      // ---------- 内積の準備 ----------
      { clear: true, cols: [0.55, 0.45], part: '内積の準備', say: 'O を始点にして、$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b,\\ \\overrightarrow{\\mathrm{OC}}=\\vec c$ とおきます。大きさはどれも 2。内積は、辺の長さから出します。',
        add: [{ t: 'h', text: 'ベクトルの準備' },
          { t: 'm', tex: '|\\vec a|=|\\vec b|=|\\vec c|=2' },
          solid('s2', 0.5)] },
      { ask: { type: 'choice', q: '$\\mathrm{AB}=1$ から、内積 $\\vec a\\cdot\\vec b$ は？',
        opts: ['$2$', '$\\dfrac12$', '$\\dfrac52$', '$\\dfrac72$'], ok: 3,
        why: { 0: '$|\\vec a||\\vec b|\\cos60^\\circ$ としています。側面は正三角形ではありません（2, 2, 1）。', 1: '$|\\vec b-\\vec a|^2=1$ の展開で、$|\\vec a|^2+|\\vec b|^2=8$ を入れ忘れています。', 2: 'それは $\\vec a\\cdot\\vec c$（AC $=\\sqrt3$ から）の値です。' },
        good: '$|\\vec b-\\vec a|^2=8-2\\vec a\\cdot\\vec b=1$ より $\\vec a\\cdot\\vec b=\\frac72$。同じく $\\vec b\\cdot\\vec c=\\frac72$。',
        add: [{ t: 'm', tex: '|\\vec b-\\vec a|^2=1\\ \\Longrightarrow\\ \\vec a\\cdot\\vec b=\\frac72,\\quad \\vec b\\cdot\\vec c=\\frac72' }] } },
      { ask: { type: 'think', q: '$\\vec a\\cdot\\vec c$ を求めよう。',
        hint: 'AC は正六角形の「1つとばし」の対角線。$\\angle\\mathrm{ABC}=120^\\circ$ で余弦定理。',
        ans: '$\\mathrm{AC}^2=1+1-2\\cos120^\\circ=3$。$|\\vec c-\\vec a|^2=8-2\\vec a\\cdot\\vec c=3$ より $\\vec a\\cdot\\vec c=\\dfrac52$',
        add: [{ t: 'm', tex: '\\mathrm{AC}=\\sqrt3\\ \\Longrightarrow\\ \\vec a\\cdot\\vec c=\\frac52' }] } },

      // ---------- |PQ|^2 ----------
      { clear: true, cols: [0.6, 0.4], part: '答案', say: 'P と、辺 BC 上の点 Q を表します。Q は BC を $s:(1-s)$ に内分する点とします（$s=0$ で B、$s=1$ で C）。',
        add: [{ t: 'h', text: '|PQ|² を s で表す' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=t\\vec a,\\quad \\overrightarrow{\\mathrm{OQ}}=(1-s)\\vec b+s\\vec c\\quad(0\\le s\\le1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PQ}}=(\\vec b-t\\vec a)+s(\\vec c-\\vec b)' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['内積', '値'], ['$|\\vec a|^2,\\ |\\vec b|^2,\\ |\\vec c|^2$', '$4$'], ['$\\vec a\\cdot\\vec b,\\ \\vec b\\cdot\\vec c$', '$\\frac72$'], ['$\\vec a\\cdot\\vec c$', '$\\frac52$']] }] },
      { ask: { type: 'choice', q: '$(\\vec b-t\\vec a)\\cdot(\\vec c-\\vec b)$ は？',
        opts: ['$t-\\dfrac12$', '$-\\dfrac12$', '$t+\\dfrac12$', '$\\dfrac12-t$'], ok: 0,
        why: { 1: '$-t\\vec a\\cdot\\vec c+t\\vec a\\cdot\\vec b=t$ の部分を落としています。', 2: '$\\vec b\\cdot\\vec c-|\\vec b|^2=\\frac72-4=-\\frac12$。符号に注意。', 3: '$-t\\vec a\\cdot\\vec c+t\\vec a\\cdot\\vec b=-\\frac52t+\\frac72t=+t$ です。' },
        good: '$\\vec b\\cdot\\vec c-|\\vec b|^2-t\\,\\vec a\\cdot\\vec c+t\\,\\vec a\\cdot\\vec b=\\frac72-4-\\frac52t+\\frac72t=t-\\frac12$。',
        add: [{ t: 'm', size: 'sm', tex: '(\\vec b-t\\vec a)\\cdot(\\vec c-\\vec b)=t-\\frac12' }] } },
      { say: 'ほかの部分は $|\\vec b-t\\vec a|^2=4-7t+4t^2$、$|\\vec c-\\vec b|^2=1$。まとめて、$s$ について平方完成します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}|\\overrightarrow{\\mathrm{PQ}}|^2&=s^2+(2t-1)s+4t^2-7t+4\\\\ &=\\Big(s-\\big(\\tfrac12-t\\big)\\Big)^2+3t^2-6t+\\frac{15}4\\end{aligned}' }] },

      // ---------- 場合分け ----------
      { clear: true, cols: [0.56, 0.44], part: '場合分け', say: '$0\\le s\\le1$（緑）での最小値です。軸は $s=\\frac12-t$。右の図は $t=\\frac14$（青）と $t=\\frac34$（桃）のときのグラフです。',
        add: [{ t: 'h', text: '0 ≦ s ≦ 1 での最小値' },
          { t: 'm', size: 'sm', tex: 'g(s)=\\Big(s-\\big(\\tfrac12-t\\big)\\Big)^2+3t^2-6t+\\frac{15}4' },
          qd('q1', [{ k: 'fn', f: '(x-0.25)**2+39/16', a: -0.75, b: 1.3, c: 'b', label: 't = 1/4', lat: [-0.72, 2.25] },
            { k: 'fn', f: '(x+0.25)**2+15/16', a: -0.75, b: 1.3, c: 'p', label: 't = 3/4', lat: [0.75, 1.65] },
            { k: 'line', x: 0.25, dash: true, c: 'b' }, { k: 'line', x: -0.25, dash: true, c: 'p' }])] },
      { ask: { type: 'choice', q: '軸 $s=\\dfrac12-t$ が区間 $0\\le s\\le1$ に入るような $t$ は？（$0<t<1$）',
        opts: ['$\\dfrac12<t<1$', 'すべての $t$', '$t=\\dfrac12$ だけ', '$0<t\\le\\dfrac12$'], ok: 3,
        why: { 0: '$t>\\frac12$ だと $\\frac12-t<0$。軸は区間の左に出ます。', 1: '$t=\\frac34$ の桃のグラフでは、軸 $s=-\\frac14$ が区間の外です。', 2: '$t<\\frac12$ でも $0<\\frac12-t<\\frac12$ で区間に入ります。' },
        good: '$0\\le\\frac12-t$ ⇔ $t\\le\\frac12$。$\\frac12-t\\le1$ はいつも成り立ちます。' } },
      { say: '(i) $0<t\\le\\frac12$ のとき、軸は区間の中。頂点で最小になり、最小値は $3t^2-6t+\\frac{15}4$。垂線の足が辺 BC の上にある場合です。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{(i)}\\ 0<t\\le\\tfrac12:\\ m^2=3t^2-6t+\\frac{15}4' }] },
      { say: '(ii) $\\frac12<t<1$ のとき、軸は区間の左。区間では増加するので、$s=0$（点 B）で最小。最小値は $g(0)=4t^2-7t+4=\\mathrm{PB}^2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{(ii)}\\ \\tfrac12<t<1:\\ m^2=g(0)=4t^2-7t+4' }] },
      { say: '最小値 $m$ が求まりました。球が辺 BC と共有点をもたない条件は $0<r<m$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\begin{aligned}&0<t\\le\\tfrac12\\ \\text{のとき}\\quad 0<r<\\sqrt{3t^2-6t+\\tfrac{15}4}\\\\ &\\tfrac12<t<1\\ \\text{のとき}\\quad 0<r<\\sqrt{4t^2-7t+4}\\end{aligned}' }] },

      // ---------- 図で確かめ ----------
      { clear: true, cols: [0.52, 0.48], part: '図で確かめ', say: '上から見た図で確かめます。P の真下の点を P′ とすると、BC は底面にあるので　$\\mathrm{PQ}^2=$（P の高さ）$^2+\\mathrm{P\'Q}^2$。',
        add: [{ t: 'h', text: '上から見ると' },
          { t: 'm', size: 'sm', tex: "\\mathrm{PQ}^2=\\big(\\sqrt3(1-t)\\big)^2+\\mathrm{P'Q}^2" },
          { t: 'p', size: 'sm', text: "H は底面の中心、$\\mathrm{HP'}=t$\nP′Q がいちばん短い Q をさがせばよい" },
          top('tp', 0.75, [{ k: 'seg', a: [0.5, r3 / 2], b: [1.3, r3 / 2], c: 'y', dash: true, wd: 2 },
            { k: 'line', x: 0.5, dash: true, c: 'g' }, { k: 'label', at: [0.43, -1.0], text: 'B を通り BC に垂直', c: 'g', size: 19, anchor: 'end', plain: true }])] },
      { ask: { type: 'choice', q: '$t=\\dfrac34$ のとき、$r$ の範囲の上限 $m$ は？',
        opts: ['$\\dfrac{\\sqrt{15}}4$', '$\\dfrac{\\sqrt3}2$', '$1$', '$\\dfrac{\\sqrt{10}}2$'], ok: 2,
        why: { 0: 'それは直線 BC との距離（垂線の足は辺の外）。辺 BC 上でいちばん近いのは B です。', 1: '上から見た P′ と直線 BC の距離だけで、P の高さを忘れています。', 3: 'それは PC。B のほうが近いです。' },
        good: '$t=\\frac34>\\frac12$ なので (ii)。$m^2=4\\cdot\\frac9{16}-\\frac{21}4+4=1$、つまり $m=\\mathrm{PB}=1$。',
        draw: [{ fig: 'tp', items: [{ k: 'pt', at: [0.75, r3 / 2], name: '足', dir: 'n', c: 'w', open: true, size: 20 }, { k: 'seg', a: [0.75, 0], b: [0.5, r3 / 2], c: 'p', wd: 3 }, { k: 'pt', at: [0.5, r3 / 2], c: 'p' }] }] } },
      { say: 'P′ が緑の点線（B を通り BC に垂直な直線）より A 側に来ると、垂線の足は辺の外に出て、いちばん近い点は B になります。それが $t=\\frac12$ の境目です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・「線分上の点」を $0\\le s\\le1$ で表す\n・軸と区間の位置で場合分けし、理由を書く\n・答えは $t$ の範囲ごとに' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「直線との距離」と「線分との距離」のちがいが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
