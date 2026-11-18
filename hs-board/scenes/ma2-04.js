/* 数学A 第2章 図形の性質 三角形の性質 ④：三角形の重心と垂心
   例はすべて自作（中線 AL=12 → AG=8／G を通り BC に平行な直線 BC=9 → PQ=6／
   垂心 A=65°（B=60°, C=55°）→ ∠BHC=115°）。
   値・誤答・図の座標（重心・垂心・垂線の足）は python3（sympy）で検算ずみ。図の三角形は、その数値どおりの形でかいている。 */
(function () {
  const POINTS = [
    '**重心** G：3本の **中線**（頂点と向かいの辺の中点を結ぶ線分）の交点。G は各中線を **$2:1$** に内分する（頂点の側が 2）',
    '2:1 のわけは **中点連結定理**：NM∥BC、NM $=\\dfrac12$BC から △GNM ∽ △GCB（相似比 $1:2$）',
    '**垂心** H：3つの頂点から向かいの辺（延長）にひいた **垂線** の交点。$\\angle\\mathrm{BHC}=180^\\circ-A$（四角形 AFHE で考える）'
  ];
  const rad = t => t * Math.PI / 180, on = (o, r, t) => [o[0] + r * Math.cos(rad(t)), o[1] + r * Math.sin(rad(t))];
  const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
  const foot = (P, Q, X) => { const ux = Q[0] - P[0], uy = Q[1] - P[1], t = ((X[0] - P[0]) * ux + (X[1] - P[1]) * uy) / (ux * ux + uy * uy); return [P[0] + t * ux, P[1] + t * uy]; };

  // 重心の図：B(0,0) C(9,0) A(5/2, 6)（BC=9）。L, M, N は BC, CA, AB の中点、G(23/6, 2)
  const A = [2.5, 6], B = [0, 0], C = [9, 0], L = mid(B, C), M = mid(C, A), N = mid(A, B), G = [23 / 6, 2];
  const P = [5 / 6, 2], Q = [41 / 6, 2];   // G を通り BC に平行な直線と AB, AC の交点（PQ=6）
  const triG = (extra) => [{ k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.05 }].concat(extra || [], [
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 }]);
  const VG = [-1.0, -1.2, 10.0, 7.0], fg = (id, items) => ({ t: 'fig', id, col: 1, view: VG, w: 560, h: 417, items });

  // 垂心の図：A=65°, B=60°, C=55°。B(0,0) C(7,0)、A は B から 60° の向きに c=7sin55°/sin65°
  const hB = [0, 0], hC = [7, 0], hA = on(hB, 7 * Math.sin(rad(55)) / Math.sin(rad(65)), 60);
  const H = [hA[0], hA[0] * (hC[0] - hA[0]) / hA[1]], hD = foot(hB, hC, hA), hE = foot(hC, hA, hB), hF = foot(hA, hB, hC);
  const triH = (extra) => [{ k: 'poly', pts: [hA, hB, hC], close: true, fill: 'w', alpha: 0.05 }].concat(extra || [], [
    { k: 'pt', at: hA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: hB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: hC, name: 'C', dir: 'se', r: 4 }]);
  const alts = [
    { k: 'seg', a: hA, b: hD, c: 'b', wd: 2.5 }, { k: 'seg', a: hB, b: hE, c: 'b', wd: 2.5 }, { k: 'seg', a: hC, b: hF, c: 'b', wd: 2.5 },
    { k: 'right', o: hD, a: hC, b: hA, s: 13, c: 'b' }, { k: 'right', o: hE, a: hA, b: hB, s: 13, c: 'b' }, { k: 'right', o: hF, a: hB, b: hC, s: 13, c: 'b' },
    { k: 'pt', at: hD, name: 'D', dir: 's', r: 4, c: 'b' }, { k: 'pt', at: hE, name: 'E', dir: 'ne', r: 4, c: 'b' }, { k: 'pt', at: hF, name: 'F', dir: 'nw', r: 4, c: 'b' }];
  const VH = [-1.0, -1.0, 8.0, 6.6], fh = (id, items) => ({ t: 'fig', id, col: 1, view: VH, w: 560, h: 473, items });

  HB.lesson({
    id: 'ma2-04', field: '数学A　図形の性質', title: '三角形の重心と垂心', level: '三角形の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC の重心を G、中線を AL とする。AL $=12$ のとき、AG を求めよ。',
        '(2)　△ABC の重心 G を通り辺 BC に平行な直線が、辺 AB, AC と交わる点を P, Q とする。BC $=9$ のとき、PQ を求めよ。',
        '(3)　△ABC の垂心を H とする。∠A $=65^\\circ$ のとき、∠BHC を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は外心と内心でした。この時間は、三角形の残りの中心 **重心** と **垂心** です。重心では「$2:1$」、垂心では角の関係がポイントです。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**重心** が中線を $2:1$ に分けるわけがわかる\n**垂心** を知り、長さや角を求められる' }] },

      // ---------- 重心 ----------
      { clear: true, part: '重心', say: '頂点と、向かいの辺の **中点** を結ぶ線分を **中線** といいます。三角形の3本の中線は1点で交わります。この点を **重心** といい、ふつう G で表します。',
        add: [{ t: 'h', text: '重心　中線の交点' },
          { t: 'box', c: 'b', label: '中線', text: '頂点と、向かいの辺の **中点** を結ぶ線分' },
          { t: 'box', c: 'y', label: '重心', text: '3本の中線の交点 G\nG は各中線を $2:1$ に内分する' },
          fg('f1', triG([
            { k: 'seg', a: A, b: L, c: 'y', wd: 2.5 }, { k: 'seg', a: B, b: M, c: 'y', wd: 2.5 }, { k: 'seg', a: C, b: N, c: 'y', wd: 2.5 },
            { k: 'pt', at: L, name: 'L', dir: 's', r: 4, c: 'y' }, { k: 'pt', at: M, name: 'M', dir: 'ne', r: 4, c: 'y' }, { k: 'pt', at: N, name: 'N', dir: 'nw', r: 4, c: 'y' },
            { k: 'pt', at: G, name: 'G', dir: 'n', off: 20, r: 5, c: 'p' }]))] },

      // ---------- 2:1 のわけ ----------
      { clear: true, cols: [0.56, 0.44], part: '2:1 のわけ', say: '中線 BM と CN の交点を G とします。N, M は AB, AC の中点なので、**中点連結定理** より NM∥BC、NM $=\\dfrac12$BC です。',
        add: [{ t: 'h', text: 'G が中線を 2:1 に分けるわけ' },
          { t: 'm', tex: '\\mathrm{NM}\\parallel\\mathrm{BC},\\qquad \\mathrm{NM}=\\frac12\\mathrm{BC}', note: '中点連結定理' },
          fg('f2', triG([
            { k: 'seg', a: B, b: M, c: 'y', wd: 2.5 }, { k: 'seg', a: C, b: N, c: 'y', wd: 2.5 }, { k: 'seg', a: N, b: M, c: 'g', wd: 3 },
            { k: 'poly', pts: [G, N, M], close: true, fill: 'g', alpha: 0.2, noStroke: true }, { k: 'poly', pts: [G, B, C], close: true, fill: 'b', alpha: 0.14, noStroke: true },
            { k: 'pt', at: M, name: 'M', dir: 'ne', r: 4, c: 'y' }, { k: 'pt', at: N, name: 'N', dir: 'nw', r: 4, c: 'y' },
            { k: 'pt', at: G, name: 'G', dir: 's', off: 22, r: 5, c: 'p' }]))] },
      { ask: { type: 'choice', q: 'NM∥BC より △GNM ∽ △GCB（錯角が2組等しい）。相似比は $1:2$。BG : GM は？',
        opts: ['$1:2$', '$2:1$', '$3:1$', '$1:1$'], ok: 1,
        why: { 0: '順番が逆です。BG は大きい △GCB の辺なので、長いほうです。', 2: '$3:1$ は BM : GM（中線全体と GM）の比です。', 3: '$1:1$ なら G は BM の中点。G は中点ではありません。' },
        good: 'GM と GB が対応する辺。GM : GB $=1:2$ なので BG : GM $=2:1$。同じく CG : GN $=2:1$。',
        add: [{ t: 'm', tex: '\\mathrm{BG}:\\mathrm{GM}=\\mathrm{CG}:\\mathrm{GN}=\\hy{2:1}', note: '相似比 NM : BC $=1:2$' }] } },
      { say: '中線 AL と BM の交点も、同じ理由で BM を $2:1$ に分けます。BM を $2:1$ に分ける点は1つだけなので、3本の中線は **1点で交わる** のです。',
        add: [{ t: 'p', text: 'AL と BM の交点も BM を $2:1$ に内分\n→ G と同じ点。**3本の中線は1点で交わる**' }] },

      // ---------- 例題 ----------
      { clear: true, part: '例題　重心と長さ', say: '例題です。重心 G、中線 AL の長さが 12 のとき、AG は？ G が中線を何対何に分けるかを使います。',
        add: [{ t: 'h', text: '例題　重心と長さ' },
          { t: 'p', text: '△ABC の重心を G、中線を AL とする。\nAL $=12$ のとき、AG を求めよ。' },
          fg('f3', triG([{ k: 'seg', a: A, b: L, c: 'y', wd: 3 }, { k: 'pt', at: L, name: 'L', dir: 's', r: 4, c: 'y' },
            { k: 'pt', at: G, name: 'G', dir: 'e', off: 16, r: 5, c: 'p' }]))] },
      { ask: { type: 'choice', q: 'AL $=12$ のとき、AG は？',
        opts: ['$6$', '$4$', '$9$', '$8$'], ok: 3,
        why: { 0: 'G は中線の中点ではありません。$2:1$ に内分します。', 1: '$4$ は GL の長さです。', 2: '$12\\times\\dfrac34$ としています。AG : GL $=2:1$ なので $\\dfrac23$ です。' },
        good: 'AG : GL $=2:1$ なので AG $=12\\times\\dfrac23=8$（GL $=4$）。',
        add: [{ t: 'm', tex: '\\mathrm{AG}=12\\times\\frac{2}{3}=\\ans{8}', note: 'AG : GL $=2:1$' }] } },
      { say: '次は、G を通り BC に平行な直線が AB, AC と交わる点を P, Q とします。BC $=9$ のとき PQ を考えます。前々回の **平行線と線分の比** の出番です。',
        add: [{ t: 'p', text: 'G を通り BC に平行な直線と AB, AC の交点を P, Q。BC $=9$ のとき PQ は？' }],
        draw: [{ fig: 'f3', items: [{ k: 'seg', a: P, b: Q, c: 'g', wd: 3 }, { k: 'pt', at: P, name: 'P', dir: 'w', r: 4, c: 'g' }, { k: 'pt', at: Q, name: 'Q', dir: 'e', r: 4, c: 'g' },
          { k: 'label', at: [6.75, 0], text: '9', size: 26, dy: 24 }] }] },
      { ask: { type: 'think', q: 'G を通り BC に平行な直線と AB, AC の交点を P, Q とする。BC $=9$ のとき、PQ の長さは？',
        hint: 'AG : AL $=2:3$。PQ∥BC なので △APQ ∽ △ABC で、相似比は $2:3$。',
        ans: 'PQ $=9\\times\\dfrac23=6$',
        after: 'AG : AL $=2:3$ は、どの中線でも同じ。重心を通る平行線では「$\\dfrac23$ 倍」になります。',
        add: [{ t: 'm', tex: '\\mathrm{PQ}=9\\times\\frac23=\\ans{6}', note: 'AG : AL $=2:3$' }] } },

      // ---------- 垂心 ----------
      { clear: true, part: '垂心', say: '三角形の各頂点から、向かいの辺（またはその延長）に垂線をひきます。3本の垂線は1点で交わり、この点を **垂心** といいます。ふつう H で表します。',
        add: [{ t: 'h', text: '垂心　垂線の交点' },
          { t: 'box', c: 'y', label: '垂心', text: '3つの頂点から向かいの辺（延長）にひいた\n垂線の交点 H' },
          fh('f4', triH(alts.concat([{ k: 'pt', at: H, name: 'H', dir: 'e', off: 22, r: 5, c: 'p' }])))] },
      { say: '1点で交わるわけ：各頂点を通り向かいの辺に平行な直線で大きい三角形を作ると、A, B, C はその辺の中点。垂線はその垂直二等分線なので、大きい三角形の **外心** で交わります。',
        add: [{ t: 'p', size: 'sm', text: '大きい三角形の 3辺の垂直二等分線 ＝ 3本の垂線\n→ 外心で1点に交わる（前の時間）' },
          { t: 'p', size: 'sm', text: '鈍角三角形では、垂心は三角形の **外部** にできる' }] },
      { ask: { type: 'choice', q: '直角三角形の垂心は、どこにある？',
        opts: ['斜辺の中点', '三角形の外部', '直角の頂点', '重心と同じ点'], ok: 2,
        why: { 0: '斜辺の中点にあるのは外心です。', 1: '垂心が外部にあるのは鈍角三角形です。', 3: '重心と垂心が一致するのは正三角形のときです。' },
        good: '直角をはさむ2辺が、そのまま2本の垂線。だから垂線は **直角の頂点** で交わります。' } },

      // ---------- 垂心と角 ----------
      { clear: true, cols: [0.56, 0.44], part: '垂心と角', say: '垂心 H で、∠BHC を ∠A で表します。垂線の足を D, E, F とすると、四角形 AFHE は ∠AFH $=$ ∠AEH $=90^\\circ$ です。',
        add: [{ t: 'h', text: '∠BHC を A で表す' },
          { t: 'm', tex: '\\angle\\mathrm{AFH}=\\angle\\mathrm{AEH}=90^\\circ', note: 'CF, BE は垂線' },
          fh('f5', triH(alts.concat([
            { k: 'poly', pts: [hA, hF, H, hE], close: true, fill: 'y', alpha: 0.2, noStroke: true },
            { k: 'angle', o: hA, a: hB, b: hC, rp: 32, c: 'y' }, { k: 'label', at: hA, text: 'A', c: 'y', size: 22, dx: -16, dy: 50 },
            { k: 'angle', o: H, a: hB, b: hC, rp: 26, c: 'p' }, { k: 'angle', o: H, a: hF, b: hE, rp: 22, c: 'y' },
            { k: 'pt', at: H, name: 'H', dir: 'e', off: 24, r: 5, c: 'p' }])))] },
      { ask: { type: 'choice', q: '四角形 AFHE で、∠FHE は？',
        opts: ['$90^\\circ-A$', '$180^\\circ-A$', '$A$', '$90^\\circ+\\dfrac{A}{2}$'], ok: 1,
        why: { 0: '四角形の内角の和は $360^\\circ$。$360^\\circ-90^\\circ-90^\\circ-A$ です。', 2: 'A と等しいのは、となりの ∠BHF（$180^\\circ$ から ∠FHE をひいた角）です。', 3: '$90^\\circ+\\dfrac{A}{2}$ は内心の ∠BIC です。' },
        good: '$360^\\circ-90^\\circ-90^\\circ-A=180^\\circ-A$。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{FHE}=360^\\circ-90^\\circ\\times2-A=180^\\circ-A' }] } },
      { say: '∠BHC は ∠FHE の **対頂角** なので等しく、$\\angle\\mathrm{BHC}=180^\\circ-A$ です。外心・内心のときの式と、区別しておきましょう。',
        add: [{ t: 'box', c: 'y', label: '垂心', tex: '\\angle\\mathrm{BHC}=\\angle\\mathrm{FHE}=180^\\circ-A' }] },
      { ask: { type: 'choice', q: 'この図の三角形は ∠A $=65^\\circ$。∠BHC は？',
        opts: ['$130^\\circ$', '$122.5^\\circ$', '$115^\\circ$', '$65^\\circ$'], ok: 2,
        why: { 0: '$2A$ は外心のときの ∠BOC です。', 1: '$90^\\circ+\\dfrac{A}{2}$ は内心のときの ∠BIC です。', 3: 'A と等しいのは ∠BHF。∠BHC は $180^\\circ-A$ です。' },
        good: '$180^\\circ-65^\\circ=115^\\circ$。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BHC}=180^\\circ-65^\\circ=\\ans{115^\\circ}' }],
        draw: [{ fig: 'f5', items: [{ k: 'label', at: hA, text: '65°', c: 'y', size: 22, anchor: 'start', dx: 8, dy: 50 }, { k: 'label', at: H, text: '115°', c: 'p', size: 22, anchor: 'start', dx: 8, dy: 46 }] }] } },

      // ---------- 4つの心 ----------
      { clear: true, cols: [1], part: '三角形の4つの心', say: '外心・内心・重心・垂心をまとめます。「何の線の交点か」と「その点の性質」をセットで覚えましょう。',
        add: [{ t: 'h', text: '三角形の4つの心' },
          { t: 'tbl', rows: [['', '何の交点', '性質'], ['外心 O', '3辺の垂直二等分線', 'OA $=$ OB $=$ OC（外接円の中心）'], ['内心 I', '3つの内角の二等分線', '3辺までの距離が等しい（内接円の中心）'], ['重心 G', '3本の中線', '中線を $2:1$ に内分'], ['垂心 H', '3本の垂線', '$\\angle\\mathrm{BHC}=180^\\circ-A$']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、重心のように「3本の線が1点で交わる」ときに使える **チェバの定理** と、**メネラウスの定理** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
